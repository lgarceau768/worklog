# opencode-worklog

Cross-session work management for [OpenCode](https://opencode.ai) — todos, blockers, decisions, ADRs, session checkpoints, and documentation.

## What it provides

Six agent skills wired through a plugin that bootstraps the `.worklog/` directory and injects open work items into context compaction.

| Skill | Trigger |
|---|---|
| `worklog` | Dashboard, mid-session checkpoint, session close |
| `worklog-todo` | Add/list/complete/drop cross-session todos |
| `worklog-archive` | Move done todos to permanent archive |
| `worklog-blocker` | Record and resolve blockers/open questions |
| `worklog-decide` | Record lightweight ADRs in `.worklog/decisions.md` |
| `worklog-docs` | Browse/write formal ADRs, reports, and research notes |

## Install

### From npm (once published)

```json
// opencode.json
{
  "plugin": ["opencode-worklog"]
}
```

### From local path (development)

```json
// opencode.json
{
  "plugin": ["file:../opencode-worklog"]
}
```

Or for global use, add the skills to `~/.config/opencode/skills/` by symlinking:

```sh
for skill in worklog worklog-todo worklog-archive worklog-blocker worklog-decide worklog-docs; do
  ln -s /path/to/opencode-worklog/skills/$skill ~/.config/opencode/skills/$skill
done
```

## How it works

**Plugin** (`index.ts`): On `session.created`, bootstraps the `.worklog/` directory structure if it doesn't exist. On `experimental.session.compacting`, injects open todos and blockers into the compaction context so they survive session resets.

**Skills**: Markdown instruction files loaded by OpenCode's skill system. The agent invokes them when it sees relevant triggers in the conversation (e.g. "add a todo", "record a decision", "show worklog status").

## `.worklog/` layout

```
.worklog/
  todos.json          ← active todo list
  todos.done.json     ← archive of done/dropped todos
  blockers.md         ← open questions and blockers
  decisions.md        ← lightweight ADRs (ADR-001, ADR-002, …)
  sessions/           ← daily session files (YYYY-MM-DD.md)
  adrs/               ← pre-decision technical research
  reports/            ← formal investigation reports
  research/           ← quick audit notes

docs/
  adr-NNN-*.md        ← full formal ADRs (committed, permanent)
```

Add `.worklog/sessions/` to `.gitignore` if session files are too noisy for your repo. The rest (todos, decisions, ADRs) are worth committing.

## License

MIT
