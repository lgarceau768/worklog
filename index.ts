import type { Plugin } from "@opencode-ai/plugin"
import { join } from "path"

// ponytail: bootstrap only, no heavy deps
export const WorklogPlugin: Plugin = async ({ directory, $ }) => {
  // Ensure .worklog/ skeleton exists in the project root on every session start
  const wl = join(directory, ".worklog")
  await $`mkdir -p ${wl}/sessions ${wl}/adrs ${wl}/reports ${wl}/research`

  // Seed required files if absent
  const decisions = join(wl, "decisions.md")
  const blockers = join(wl, "blockers.md")
  const todosFile = join(wl, "todos.json")

  await $`test -f ${decisions} || printf '# Decisions\n\n_No decisions recorded yet._\n' > ${decisions}`
  await $`test -f ${blockers} || printf '# Blockers & Open Questions\n\n_No open blockers._\n' > ${blockers}`
  await $`test -f ${todosFile} || printf '{"version":1,"todos":[]}\n' > ${todosFile}`

  return {
    // Inject worklog summary into compaction so open todos/blockers survive context resets
    "experimental.session.compacting": async (_input, output) => {
      try {
        const todosRaw = await $`cat ${todosFile}`.text()
        const todos = JSON.parse(todosRaw)
        const open = (todos.todos ?? []).filter((t: { status: string }) => t.status === "open")

        if (open.length > 0) {
          const lines = open.map((t: { priority: string; id: string; title: string }) =>
            `- [${t.priority}] ${t.id} — ${t.title}`
          ).join("\n")
          output.context.push(`## Open Worklog TODOs\n${lines}`)
        }

        const blockersRaw = await $`grep -c '\\[OPEN\\]' ${blockers}`.text().catch(() => "0")
        if (parseInt(blockersRaw.trim()) > 0) {
          const blockersContent = await $`grep -A3 '\\[OPEN\\]' ${blockers}`.text()
          output.context.push(`## Open Worklog Blockers\n${blockersContent}`)
        }
      } catch {
        // .worklog not initialised in this project — skip silently
      }
    },
  }
}
