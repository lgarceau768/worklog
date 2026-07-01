---
name: worklog-decide
description: Record an architectural or design decision (ADR) in .worklog/decisions.md. Use when a non-obvious decision is made that future sessions should understand — why something was done a certain way, what was rejected, or what constraints apply.
---

# Worklog — Decision Recording

Appends a lightweight ADR to `.worklog/decisions.md`.

## Decision routing — which tool to use?

| Decision size | Tool | Output |
|---|---|---|
| Small (1–2 sentences, inline context) | `/worklog-decide` (this skill) | Appends to `.worklog/decisions.md` |
| Major (version selection, architecture change, new system, alternatives considered) | `/worklog-docs new adr <title>` | Creates `docs/adr-NNN-*.md` — committed, permanent |

**Use this skill when:**
- A design choice that isn't obvious from the code
- A decision that rejected an alternative worth remembering
- A constraint imposed by the runtime, framework, or environment that shapes code structure
- Anything you'd explain in a PR description that isn't in the diff

**Escalate to `/worklog-docs new adr` when:**
- The decision affects a whole subsystem
- Alternatives were seriously compared with trade-offs
- Future contributors need the full context to avoid re-litigating it

## Steps

1. Read `.worklog/decisions.md`
2. Find the current highest ADR number (e.g. `ADR-002`) and increment
3. Prompt for (or infer from context):
   - **Context:** Why did this come up?
   - **Decision:** What was chosen?
   - **Alternatives considered:** (optional, only if relevant)
   - **Status:** `Accepted` | `Superseded by ADR-NNN` | `Experimental`
4. Append to the file:

```markdown
## ADR-NNN — YYYY-MM-DD: <short title>
**Context:** ...  
**Decision:** ...  
**Status:** Accepted
```

5. Confirm: `Recorded ADR-NNN: <title>`

## Format notes

- Keep context and decision to 1–2 sentences each
- Only add Alternatives if the other option was seriously considered
- Use `Superseded by ADR-NNN` when a later decision overrides this one — don't delete old ADRs
