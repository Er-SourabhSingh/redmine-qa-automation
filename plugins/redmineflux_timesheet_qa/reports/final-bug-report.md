# Final Bug Report — Redmineflux Timesheet Plugin

> Generated from bugs/open/. PDF only on explicit user request.

## Summary

| Total | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|
| 1 | 0 | 1 | 0 | 0 |

## Open Bugs

### BUG-TMS-001 — Bulk-deleting a user with a timesheet submission crashes with an unhandled 500 Internal error

- Severity: High
- Production Redmine Issue ID: #121040 (assigned Sheetal Sharma)
- Found ad-hoc while investigating a live user-reported 500 error — not from the authored TC-TMS-1xx suite, which
  has not been executed yet.
- Root cause: `redmineflux_timesheet`'s `User` model patch has no `has_many :timesheet_submissions` association,
  so Rails can't cascade/pre-validate before `destroy`, and the DB's `ON DELETE RESTRICT` foreign key surfaces as
  a raw, unrescued `PG::ForeignKeyViolation`.
- Full detail: `bugs/open/BUG-TMS-001.md`

## Environment

- Redmine Version: 7.0.0 (Docker)
- Environment: Local Docker (redmine-docker-700-redmine-1, localhost:3010)
- Test Date: 2026-09-21
