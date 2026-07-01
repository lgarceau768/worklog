# opencode-worklog

[![npm](https://img.shields.io/npm/v/opencode-worklog)](https://www.npmjs.com/package/opencode-worklog)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Cross-session work management for [OpenCode](https://opencode.ai) AI agents.**

OpenCode sessions are stateless — each compaction or restart wipes the agent's working memory. `opencode-worklog` solves this by persisting todos, blockers, and decisions to disk and automatically injecting them back into context on compaction, so work in progress survives session resets.

---

## What it does

An OpenCode plugin (`index.ts`) that:

1. **On session start** — bootstraps the `.worklog/` directory structure in the project root (idempotent)
2. **On session start** — auto-installs 6 skills to `.opencode/skills/` (skips any that are already present)
3. **On context compaction** — injects open todos and active blockers into the compaction payload so they survive the reset

---

## Install

Add to `opencode.json` in your project root:

```json
{
  "plugins": ["opencode-worklog"]
}
```

That's it. On the next session start, the plugin bootstraps `.worklog/` and installs the skills automatically.

### Local / development

```json
{
  "plugins": ["file:../opencode-worklog"]
}
```

> **Peer dependency:** `@opencode-ai/plugin`  
> **Runtime:** Bun (OpenCode's native runtime)

---

## Skills reference

Six skills are installed to `.opencode/skills/` automatically. Invoke them by slash command or by describing what you want to the agent.

| Skill | Triggers | Purpose |
|---|---|---|
| `worklog` | `/worklog` · `/worklog checkpoint` · `/worklog end` | Session dashboard, mid-session checkpoint, close-out summary |
| `worklog-todo` | `/worklog-todo add <title>` · `list` · `done <id>` · `drop <id>` | Cross-session todo list backed by `.worklog/todos.json` |
| `worklog-archive` | `/worklog-archive` | Move done/dropped todos to `todos.done.json` |
| `worklog-blocker` | `/worklog-blocker add <title>` · `resolve <id>` | Record and resolve blockers and open questions |
| `worklog-decide` | `/worklog-decide` | Lightweight ADR appended to `.worklog/decisions.md` |
| `worklog-docs` | `/worklog-docs` · `new adr` · `new report` · `new research` | Full ADR, formal report, and research note management |

---

## `.worklog/` layout

```
.worklog/
  todos.json          ← active todos (JSON array)
  todos.done.json     ← archived done/dropped todos
  blockers.md         ← open questions and blockers
  decisions.md        ← lightweight ADRs (ADR-001…)
  sessions/           ← daily session files (YYYY-MM-DD.md)
  adrs/               ← pre-decision technical research
  reports/            ← formal investigation reports
  research/           ← quick audit notes

docs/
  adr-NNN-*.md        ← full formal ADRs (committed, permanent)
```

---

## Gitignore recommendations

```gitignore
# Session files are noisy — safe to ignore
.worklog/sessions/

# Auto-installed skills (reinstalled each session start)
.opencode/skills/worklog
.opencode/skills/worklog-todo
.opencode/skills/worklog-archive
.opencode/skills/worklog-blocker
.opencode/skills/worklog-decide
.opencode/skills/worklog-docs
```

**Worth committing:** `.worklog/todos.json`, `.worklog/decisions.md`, `.worklog/blockers.md`, and everything under `docs/`.

---

## Contributing

PRs and issues welcome on [GitHub](https://github.com/lgarceau768/worklog).

---

## License

MIT
