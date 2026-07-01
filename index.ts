import type { Plugin } from "@opencode-ai/plugin"
import { join } from "path"
import { fileURLToPath } from "url"

const SKILLS = [
  "worklog",
  "worklog-todo",
  "worklog-archive",
  "worklog-blocker",
  "worklog-decide",
  "worklog-docs",
]

// ponytail: package root via import.meta.url — works with Bun's native TS execution
const PKG_SKILLS = join(fileURLToPath(new URL(".", import.meta.url)), "skills")

export const WorklogPlugin: Plugin = async ({ directory, $ }) => {
  const wl = join(directory, ".worklog")
  await $`mkdir -p ${wl}/sessions ${wl}/adrs ${wl}/reports ${wl}/research`

  const decisions = join(wl, "decisions.md")
  const blockers = join(wl, "blockers.md")
  const todosFile = join(wl, "todos.json")

  await $`test -f ${decisions} || printf '# Decisions\n\n_No decisions recorded yet._\n' > ${decisions}`
  await $`test -f ${blockers} || printf '# Blockers & Open Questions\n\n_No open blockers._\n' > ${blockers}`
  await $`test -f ${todosFile} || printf '{"version":1,"todos":[]}\n' > ${todosFile}`

  // Auto-install skills to .opencode/skills/ (idempotent — skips if already present)
  const projectSkillsDir = join(directory, ".opencode", "skills")
  await $`mkdir -p ${projectSkillsDir}`
  for (const skill of SKILLS) {
    const dest = join(projectSkillsDir, skill)
    await $`test -d ${dest} || cp -r ${join(PKG_SKILLS, skill)} ${dest}`
  }

  return {
    // Remind the agent when to use each worklog skill — fires on every LLM call
    "experimental.chat.system.transform": async (_input, output) => {
      output.system.push(
        `## Worklog — Cross-Session Continuity\n` +
        `At session start, run \`/worklog\` to review open todos and blockers.\n` +
        `During work: record tasks with \`/worklog-todo\`, blockers with \`/worklog-blocker\`, and decisions with \`/worklog-decide\`.\n` +
        `At session end, run \`/worklog end\` to write a closing summary.`
      )
    },

    // Inject open todos and blockers into compaction context so they survive resets
    "experimental.session.compacting": async (_input, output) => {
      try {
        const todosRaw = await $`cat ${todosFile}`.text()
        const todos = JSON.parse(todosRaw)
        const open = (todos.todos ?? []).filter((t: { status: string }) => t.status === "open")

        if (open.length > 0) {
          const lines = open
            .map((t: { priority: string; id: string; title: string }) => `- [${t.priority}] ${t.id} — ${t.title}`)
            .join("\n")
          output.context.push(`## Open Worklog TODOs\n${lines}`)
        }

        const blockersRaw = await $`grep -c '\\[OPEN\\]' ${blockers}`.text().catch(() => "0")
        if (parseInt(blockersRaw.trim()) > 0) {
          const blockersContent = await $`grep -A3 '\\[OPEN\\]' ${blockers}`.text()
          output.context.push(`## Open Worklog Blockers\n${blockersContent}`)
        }
      } catch {
        // .worklog not present — skip silently
      }
    },
  }
}
