# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] — 2026-07-01

### Added
- Plugin bootstrap: creates `.worklog/` directory structure on session start
- Auto-installs 6 skills to `.opencode/skills/` on first run (idempotent)
- Injects open todos and blockers into context compaction via `experimental.session.compacting`
- `worklog` skill — session dashboard, checkpoint, and close
- `worklog-todo` skill — add, list, complete, drop cross-session todos
- `worklog-archive` skill — move done/dropped todos to `todos.done.json`
- `worklog-blocker` skill — record and resolve blockers and open questions
- `worklog-decide` skill — lightweight ADR recording in `.worklog/decisions.md`
- `worklog-docs` skill — full ADR, report, and research note management
