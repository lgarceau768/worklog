---
name: worklog-todo
description: Manage the cross-session todo list in .worklog/todos.json. Use when the user wants to add, complete, list, or edit todos. Args: "list" (default), "add <title>", "done <id>", "drop <id>".
---

# Worklog — Todo Management

Manages `.worklog/todos.json`.

## Schema

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
      "notes": "optional context or file references"
    }
  ]
}
```

---

## `/worklog-todo` or `/worklog-todo list`

1. Read `.worklog/todos.json`
2. Print open items grouped by priority (high first), then a count of done/dropped items

```
### Open TODOs

[high]  001 — Description
        Created 2026-06-20 | Notes: ...

[medium] 002 — ...

--- 1 done, 0 dropped (run /worklog-todo list all to show) ---
```

---

## `/worklog-todo add <title>`

1. Read `.worklog/todos.json`
2. Generate next ID (max existing ID + 1, zero-padded to 3 digits)
3. Ask priority if not obvious from context (default: medium)
4. Append new todo with `"status": "open"`, today's date
5. Write file
6. Confirm: `Added TODO-NNN: <title>`

---

## `/worklog-todo done <id>`

1. Read `.worklog/todos.json`
2. Find item with matching id
3. Set `"status": "done"`, add `"completed": "YYYY-MM-DD"`
4. Write file
5. Confirm: `Marked TODO-NNN done: <title>`

---

## `/worklog-todo drop <id>`

Same as `done` but sets `"status": "dropped"`. Use when a todo is no longer relevant.

---

## `/worklog-todo note <id> <text>`

Appends to the `notes` field of an existing todo.
