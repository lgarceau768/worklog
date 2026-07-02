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
const PKG_ROOT = fileURLToPath(new URL(".", import.meta.url))
const PKG_SKILLS = join(PKG_ROOT, "skills")
const WL_SCRIPT_SRC = join(PKG_ROOT, "scripts", "wl.py")

export const WorklogPlugin: Plugin = async ({ directory, $ }) => {
  const wl = join(directory, ".worklog")
  await $`mkdir -p ${wl}/sessions ${wl}/adrs ${wl}/reports ${wl}/research ${wl}/bin`

  const decisions = join(wl, "decisions.md")
  const blockers = join(wl, "blockers.md")
  const todosFile = join(wl, "todos.json")
  const wlBin = join(wl, "bin", "wl")

  await $`test -f ${decisions} || printf '# Decisions\n\n_No decisions recorded yet._\n' > ${decisions}`
  await $`test -f ${blockers} || printf '# Blockers & Open Questions\n\n_No open blockers._\n' > ${blockers}`
  await $`test -f ${todosFile} || printf '{"version":1,"todos":[]}\n' > ${todosFile}`

  // Install wl CLI to .worklog/bin/wl (always refresh so updates land on next session)
  await $`cp -f ${WL_SCRIPT_SRC} ${wlBin} && chmod +x ${wlBin}`

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
        `Prefer shell lookups over reading JSON files directly — use \`python3 .worklog/bin/wl\` for all worklog operations.\n` +
        `At session end, run \`/worklog end\` to write a closing summary.`
      )
    },

    // Inject open todos and blockers into compaction context — use wl script to avoid JSON in context
    "experimental.session.compacting": async (_input, output) => {
      try {
        const open = await $`python3 ${wlBin} todo list`.text().catch(() => "")
        if (open.trim() && open.trim() !== "No open todos.") {
          output.context.push(`## Open Worklog TODOs\n${open.trim()}`)
        }

        const blockerOut = await $`python3 ${wlBin} blocker list`.text().catch(() => "")
        if (blockerOut.trim() && blockerOut.trim() !== "No open blockers.") {
          output.context.push(`## Open Worklog Blockers\n${blockerOut.trim()}`)
        }
      } catch {
        // .worklog not present — skip silently
      }
    },
  }
}
