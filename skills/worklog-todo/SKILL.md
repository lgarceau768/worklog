---
name: worklog-todo
description: Manage the cross-session todo list in .worklog/todos.json. Use when the user wants to add, complete, list, or edit todos. Args: "list" (default), "add <title>", "done <id>", "drop <id>".
---

# Worklog — Todo Management

Manages `.worklog/todos.json` via the `wl` CLI at `.worklog/bin/wl`.
**Always use the script — never read/write `todos.json` directly.** This keeps JSON out of context.

## CLI reference

```bash
bun .worklog/bin/wl.ts todo list                         # open todos, priority-sorted
bun .worklog/bin/wl.ts todo list --all                   # include done/dropped
bun .worklog/bin/wl.ts todo list --priority=high         # filter by priority
bun .worklog/bin/wl.ts todo list --json                  # raw JSON output
bun .worklog/bin/wl.ts todo add "title" --priority=high  # add (default priority: medium)
bun .worklog/bin/wl.ts todo done <id>                    # mark done
bun .worklog/bin/wl.ts todo drop <id>                    # mark dropped
bun .worklog/bin/wl.ts todo get <id>                     # fetch single item as JSON
bun .worklog/bin/wl.ts todo note <id> "text"             # append note to existing todo
bun .worklog/bin/wl.ts status                            # compact dashboard (todos + blockers)
```

## Schema (for reference only — use the CLI to mutate)

```json
{
  "version": 1,
  "todos": [
    {
      "id": "NNN",
      "title": "...",
      "status": "open | done | dropped",
      "priority": "high | medium | low",
      "created": "YYYY-MM-DD",
      "closed": "YYYY-MM-DD",
      "notes": "optional context or file references"
    }
  ]
}
```

---

## `/worklog-todo` or `/worklog-todo list`

Run: `bun .worklog/bin/wl.ts todo list`

Output is priority-sorted, one line per open todo:
```
[high]  001 — Description
[medium] 002 — ...
```

---

## `/worklog-todo add <title>`

Run: `bun .worklog/bin/wl.ts todo add "<title>" --priority=<high|medium|low>`

Default priority: `medium`. Infer priority from context if obvious.
Confirm output: `Added TODO-NNN: <title>`

---

## `/worklog-todo done <id>`

Run: `bun .worklog/bin/wl.ts todo done <id>`

Confirm output: `Done TODO-NNN: <title>`

---

## `/worklog-todo drop <id>`

Run: `bun .worklog/bin/wl.ts todo drop <id>`

Use when a todo is no longer relevant.

---

## `/worklog-todo note <id> <text>`

Run: `bun .worklog/bin/wl.ts todo note <id> "<text>"`

Appends to the `notes` field of an existing todo.
