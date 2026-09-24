# Final Bug Report — Redmineflux Checklist

> Generated from bugs/open/. PDF only on explicit user request.

## Summary

| Total | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|
| 1 | 0 | 0 | 0 | 1 |

## Open Bugs

### BUG-CHK-005 — Checklist CRUD is not blocked on a closed/read-only project (remaining scope: no user feedback)

- Severity: Low (downgraded from High — see below)
- Production Redmine Issue ID: #121061
- Found live while investigating a user-reported console 403 on "Add from template" for a closed project.
- **Retested 2026-09-24 — write-authorization half is FIXED:** `POST /checklists`, `PATCH
  /checklists/:id/toggle_completed` (and the bulk variant), and `DELETE /checklists_delete/:id.json` now all
  correctly return 403 and do not persist on a closed project.
- **Remaining scope:** all four checklist-mutating actions (including the pre-existing "Add from template"
  block) still fail completely silently — console-only 403, zero visible flash/error message. This is a
  UX/feedback gap, not a security or data-integrity issue.
- Full detail: `bugs/open/BUG-CHK-005.md`

## Closed This Cycle

- **BUG-CHK-002** (Critical) — checklist/sub-item title `<script>` tag self-XSS on creation. Fixed, retested
  PASS, scoped regression PASS (41/42 applicable TCs PASS, 1 N/A, 0 new bugs), production #121059 synced to
  Done/100%. Closed 2026-09-24. `bugs/closed/BUG-CHK-002.md`.
- **BUG-CHK-004** (Medium) — duplicate Checklist History journal entries on checkbox toggle. Fixed, retested
  PASS, scoped regression PASS, production #121060 synced to Done/100%. Closed 2026-09-24.
  `bugs/closed/BUG-CHK-004.md`.

## Environment

- Redmine Version: 7.0.0 (Docker, localhost:3010)
- Environment: Local Docker (redmine-docker-700-redmine-1)
- Test Date: 2026-09-24
