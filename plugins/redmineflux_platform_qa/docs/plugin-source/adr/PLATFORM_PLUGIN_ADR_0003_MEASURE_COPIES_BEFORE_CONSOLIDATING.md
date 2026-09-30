# ADR 0003 — Measure the copies before consolidating them

**Status:** accepted

## Context

A `grep -c` for a duplicated method name is not evidence of duplication. Four
examples from this codebase, all of which look identical from a name count:

| method | copies | distinct bodies | outcome |
| --- | --- | --- | --- |
| `per_page_option` | 7 | 1 (differing in one token) | consolidated |
| `parse_date` | 11 | 8, all subsets of one union | consolidated |
| `render_not_found` | 10 | **10**, each a different message | left alone |
| `render_forbidden` | 6 | **5**, each a different JSON shape | left alone |

Consolidating `render_forbidden` would have changed the error payload every API
client parses. Consolidating `render_not_found` would have replaced ten
specific messages with one vague one. `holiday_params` has five different
permit lists for the same model — a direct consequence of ADR 0001 — and
unifying them would break each plugin's own forms.

The reverse error is just as expensive. `redmineflux_timesheet`'s audit patch
looked like a faithful copy of `AuditService.log` and was not: it rescued three
specific `ActiveRecord` classes where the service rescues `StandardError`.
Metadata is serialised to JSON on the way in, and `TimeEntry#hours` returns a
`Rational` — which raises outside those three. Assuming the copies agreed would
have preserved a latent 500 on every timesheet approval.

## Decision

Before consolidating a repeated name: extract every body, strip comments and
indentation, hash, and group. Consolidate only where the bodies agree or where
one is a provable superset of the rest. Record in the shared implementation
which copies were left alone, and why.

## Consequences

- `Concerns::Authorizable` carries a comment block naming the four things
  deliberately **not** in it, so the next person does not re-litigate them.
- Consolidation is slower. It is also the only reason the audit rescue widened
  instead of narrowing, and the only reason `Dates.parse` rescues `TypeError` —
  a clause exactly one of the eleven copies had.
