---
name: worklog
description: Cross-session work management. Use when the user wants to see current work status, save a checkpoint mid-session, or write a closing summary at the end of a session. Subcommands — no args: dashboard; "checkpoint": save progress now; "end": close out session with full summary.
---

# Worklog — Session Management

Manages `.worklog/` for cross-session continuity.

## Invocation forms

| Command | What to do |
|---|---|
| `/worklog` | Show the **status dashboard** |
| `/worklog checkpoint` | Write current progress to today's session file |
| `/worklog end` | Write a full closing summary and update todos/blockers |

---

## `/worklog` — Status Dashboard

Use the `wl` CLI for todos and blockers — never read JSON directly.

1. **Open TODOs** — run `python3 .worklog/bin/wl todo list`
2. **Open Blockers** — run `python3 .worklog/bin/wl blocker list`
3. **Today's session** — read `.worklog/sessions/YYYY-MM-DD.md` if it exists (use today's date), show Activity section
4. **Last decision** — read `.worklog/decisions.md`, show the most recent lightweight ADR
5. **Recent formal ADRs** — list `docs/adr-*.md` files (filename + first heading line only)

Format:
```
## Worklog Status — YYYY-MM-DD

### Open TODOs (N)
[high] 001 — Description

### Open Blockers
- none

### Today's session
[summary if written]

### Last decision (.worklog/decisions.md)
ADR-005 — Brief title

### Formal ADRs (docs/)
- adr-005-some-decision.md — Some Decision
```

> To browse, read, or write ADRs/reports/research in full, use `/worklog-docs`.

---

## `/worklog checkpoint` — Mid-Session Checkpoint

Write a checkpoint to `.worklog/sessions/YYYY-MM-DD.md`.

1. Read the current session file (create with template header if missing)
2. Append a `## Checkpoint — HH:MM` section containing:
   - What is currently in progress
   - Any decisions made so far this session
   - Files changed (summarize, don't list every line)
3. Write the updated file

Template for a new checkpoint section:
```markdown
## Checkpoint — HH:MM

**In progress:** [what's being worked on]

**Done so far:**
- [item]

**Files touched:** [brief list]

**Next:** [what comes next]
```

---

## `/worklog end` — Close Session

Write a full closing summary to today's session file.

1. Read `.worklog/todos.json` — ask the user if any todos changed status; update if so
2. Read `.worklog/blockers.md` — note any new or resolved blockers
3. Append a `## Summary` section to `.worklog/sessions/YYYY-MM-DD.md`:

```markdown
## Summary

**Accomplished:**
- [bullet per major thing done]

**Commits:** [list commit SHAs or descriptions if any]

**Decisions made:** [reference ADR numbers if any were added this session]

**Handoff:** [what the next session should pick up first]
```

4. Write the session file
5. If todos changed, write `.worklog/todos.json`
