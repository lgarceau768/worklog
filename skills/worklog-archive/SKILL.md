---
name: worklog-archive
description: Archive completed todos from todos.json into todos.done.json. Use when the user asks to archive done items, clean up the todo list, or move completed work out of the active list. Args: "archive" (default — move all done/dropped), "archive <id>" (move one specific item).
---

# Worklog — Archive Done Todos

Moves `"status": "done"` or `"status": "dropped"` items from `.worklog/todos.json`
into `.worklog/todos.done.json`, keeping the active list clean.

## Files

| File | Purpose |
|---|---|
| `.worklog/todos.json` | Active todos — open items only after archive |
| `.worklog/todos.done.json` | Permanent archive of done/dropped items |

---

## `/worklog-archive` or `/worklog-archive archive`

Archive all non-open items.

1. Read `.worklog/todos.json`
2. Read `.worklog/todos.done.json` (create with `{"version":1,"archived":[]}` if missing)
3. Partition todos into `keep` (status=open) and `move` (status=done or dropped)
4. If `move` is empty, report "Nothing to archive." and stop
5. Append `move` items to `archived` array in `todos.done.json`
   - Deduplicate by `id` — if the id already exists in `archived`, skip (idempotent)
6. Write `todos.done.json` with merged archive
7. Write `todos.json` with only `keep` items
8. Report:

```
Archived N item(s) → .worklog/todos.done.json
  - [done] 001 — Description
  ...

Active todos remaining: M open item(s).
```

---

## `/worklog-archive archive <id>`

Archive a single item by id.

1. Read both files (same as above)
2. Find item with matching `id` in `todos.json`
3. If not found: "Todo <id> not found in todos.json."
4. If found and status is `open`: warn "Todo <id> is still open — archive anyway? (y/n)" and wait for confirmation
5. Move the item and write both files
6. Report: `Archived <id>: <title>`

---

## `/worklog-archive list`

Show what's in the archive without modifying anything.

1. Read `.worklog/todos.done.json`
2. Print items grouped by closed date (newest first), showing id, title, closed date

```
### Archived Todos (16)

2026-06-21
  [done] 022 — Description
  ...

2026-06-20
  [done] 009 — Description
  ...
```

---

## Schema reference

`todos.json` item shape:
```json
{
  "id": "NNN",
  "title": "...",
  "status": "open | done | dropped",
  "priority": "high | medium | low",
  "created": "YYYY-MM-DD",
  "closed": "YYYY-MM-DD",
  "notes": "..."
}
```

`todos.done.json` shape:
```json
{
  "version": 1,
  "archived": [ /* same item shape as above */ ]
}
```

---

## Notes

- Archive is append-only and idempotent — running twice is safe.
- Never delete items from `todos.done.json`; only append.
- `todos.json` must never contain `"status": "done"` or `"status": "dropped"` items after a successful archive run.
