---
name: worklog-docs
description: Browse, read, and write documentation across the worklog system — ADRs, reports, and research notes. Use when asked to "check the ADRs", "look at research on X", "write a report about Y", "what do we know about Z", or "create an ADR". Covers .worklog/adrs/, .worklog/reports/, .worklog/research/, docs/adr-*.md, and .worklog/decisions.md.
---

# Worklog — Documentation (ADRs, Reports, Research)

Manages the documentation layer of `.worklog/` and `docs/`. Not to be confused with the session log (`/worklog`) or decision recorder (`/worklog-decide`).

---

## Directory Map

```
.worklog/
  decisions.md          ← lightweight inline ADRs (ADR-001…), managed by /worklog-decide
  adrs/                 ← deep technical research docs (content is research, not decisions)
  reports/              ← formal reports on topics, investigations, reconnaissance
  research/             ← audit notes, quick investigation outputs

docs/
  adr-NNN-*.md          ← full formal ADRs (longer form, versioned, committed)
  architecture.md       ← (if present) high-level architecture overview
```

### Which location for which content?

| Content type | Location | When to use |
|---|---|---|
| Lightweight ADR (2–4 sentences) | `.worklog/decisions.md` | Use `/worklog-decide` for these |
| Formal ADR (full context, alternatives, consequences) | `docs/adr-NNN-*.md` | Major architectural decisions affecting long-term direction |
| Deep technical research (API survey, version compat, integration patterns) | `.worklog/adrs/<topic>.md` | Pre-implementation research drop; not a decision, just findings |
| Formal report (recon, analysis, design proposals) | `.worklog/reports/<name>.md` | Multi-section structured output for a specific topic |
| Quick audit / investigation notes | `.worklog/research/<name>.md` | Ad-hoc findings from a focused spike |

---

## `/worklog-docs` — List All Docs

List every file across all doc locations:

1. Run: `find .worklog/adrs .worklog/reports .worklog/research -name "*.md" | sort`
2. List `docs/adr-*.md` files
3. Summarize `.worklog/decisions.md` — just the ADR numbers and titles (one line each)

Output format:
```
## Worklog Docs Index

### Formal ADRs (docs/)
- adr-005-some-decision.md — Some Decision

### Lightweight ADRs (.worklog/decisions.md)
- ADR-001 — Brief title
- ADR-002 — Brief title

### Research (.worklog/adrs/)
- topic-research.md

### Reports (.worklog/reports/)
- investigation-report.md

### Research Notes (.worklog/research/)
- audit-notes.md
```

---

## `/worklog-docs read <keyword>`

Find and read a doc by keyword or topic name.

1. Search all doc locations for files matching the keyword (filename or title):
   - `find .worklog/adrs .worklog/reports .worklog/research docs -name "*.md" | grep -i <keyword>`
   - Also scan `.worklog/decisions.md` for matching ADR titles
2. If multiple matches: list them, ask which to open
3. If one match: read and display the file
4. If none: search file contents — `grep -rl "<keyword>" .worklog/ docs/adr-*.md`

---

## `/worklog-docs new report <title>`

Create a new formal report in `.worklog/reports/`.

1. Derive filename from title: lowercase, spaces → underscores, e.g. `performance_audit.md`
2. Ask / infer: Is this a sub-topic of an existing report folder? If so, place under that subfolder.
3. Write the file with this template:

```markdown
# <Title>

**Generated:** YYYY-MM-DD  
**Scope:** <one-sentence scope>

---

## 1. <Section>

...

## 2. <Section>

...
```

4. Confirm: `Created .worklog/reports/<filename>.md`

---

## `/worklog-docs new research <title>`

Create a new research/audit note in `.worklog/research/`.

1. Derive filename: lowercase-with-dashes, e.g. `auth-flow-audit.md`
2. Write with template:

```markdown
# <Title>

_Date: YYYY-MM-DD_  
_Scope: <one sentence>_

---

## Findings

...

## Open Questions

...
```

3. Confirm: `Created .worklog/research/<filename>.md`

---

## `/worklog-docs new adr <title>`

Create a new **formal** ADR in `docs/`.

1. Read `docs/` to find the highest existing `adr-NNN-*.md` number; increment
2. Derive filename: `adr-NNN-<kebab-title>.md`
3. Write with this template:

```markdown
# ADR-NNN — <Title>

**Status:** Accepted  
**Date:** YYYY-MM-DD  
**Deciders:** [author]

---

## Context

<Why did this decision come up? What problem does it solve?>

## Decision

<What was decided?>

## Alternatives Considered

| Option | Reason rejected |
|---|---|
| <alt> | <reason> |

## Consequences

**Positive:**
- ...

**Negative / Risks:**
- ...

## References

- [link]()
```

4. Add a reference line to `docs/architecture.md` if that file exists and the ADR affects architecture.
5. Confirm: `Created docs/adr-NNN-<title>.md`

---

## `/worklog-docs new research-adr <title>`

Create a deep technical research doc in `.worklog/adrs/` (not a decision — a knowledge dump).

1. Derive filename: `<kebab-title>.md`
2. Write with template:

```markdown
# <Title> — Research

_Researched: YYYY-MM-DD_

---

## 1. Findings

...

## 2. Recommended Approach

...

## 3. Key API / Code Patterns

```

3. Confirm: `Created .worklog/adrs/<filename>.md`

---

## Notes

- Formal ADRs in `docs/` should be committed and treated as permanent record.
- Lightweight ADRs in `.worklog/decisions.md` are session-local context that doesn't need a full file.
- When recording a major decision, use the formal ADR path if the decision will affect future sessions or new contributors.
- Use `/worklog-decide` for small, quick decisions that don't warrant a full ADR file.
- The `.worklog/adrs/` folder holds research (pre-decision knowledge), not decisions — don't confuse it with `docs/adr-*.md` formal ADRs.
