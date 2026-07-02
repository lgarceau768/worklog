---
name: worklog-blocker
description: Record or resolve an open question or blocker in .worklog/blockers.md. Use when something is blocking progress or needs investigation before work can continue. Args: no args = list open; "add <title>"; "resolve <id>".
---

# Worklog — Blockers & Open Questions

Manages `.worklog/blockers.md`.

## Format in the file

```markdown
## BLOCKER-NNN — YYYY-MM-DD [OPEN]
**What:** One sentence describing the blocker or question.  
**Impact:** What can't be done until this is resolved?  
**Needs:** What would resolve it (investigation, upstream fix, decision, etc.)?
```

When resolved, update `[OPEN]` → `[RESOLVED YYYY-MM-DD]` and add a resolution line:
```markdown
**Resolution:** What turned out to be the answer or workaround.
```

---

## `/worklog-blocker` — List Open Blockers

Run: `bun .worklog/bin/wl.ts blocker list`

Prints header + What line for each `[OPEN]` entry. Add `--all` to include resolved blockers.

---

## `/worklog-blocker add <title>`

1. Read `.worklog/blockers.md`
2. Find the highest BLOCKER-NNN and increment
3. Ask for / infer:
   - **What:** description
   - **Impact:** what's blocked
   - **Needs:** what would unblock it
4. Append the formatted block to the file
5. Remove the `_No open blockers._` placeholder if present
6. Confirm: `Recorded BLOCKER-NNN: <title>`

---

## `/worklog-blocker resolve <id>`

1. Read `.worklog/blockers.md`
2. Find `BLOCKER-<id>`
3. Change `[OPEN]` to `[RESOLVED YYYY-MM-DD]`
4. Append `**Resolution:** <user-provided or inferred resolution>`
5. Write file
6. Confirm: `Resolved BLOCKER-<id>`
