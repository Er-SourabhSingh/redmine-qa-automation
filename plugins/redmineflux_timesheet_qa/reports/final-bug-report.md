# Final Bug Report — Redmineflux Timesheet Plugin

> Generated from bugs/open/ + bugs/closed/. PDF only on explicit user request.

## Summary

| Total | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|
| 1 | 0 | 1 | 0 | 0 |

All bugs found this cycle are now Closed. `bugs/open/` is empty.

## Closed Bugs

### BUG-TMS-001 — Bulk-deleting a user with a timesheet submission crashes with an unhandled 500 Internal error

- Severity: High
- Status: **Closed / FIXED** — retested PASS 2026-09-25
- Production Redmine Issue ID: #121040 (assigned Sheetal Sharma) — synced to Status: Done, % done: 100 on 2026-09-25
- Found ad-hoc while investigating a live user-reported 500 error — not from the authored TC-TMS-1xx suite, which
  has not been executed yet.
- Root cause: `redmineflux_timesheet`'s `User` model patch had no `has_many :timesheet_submissions` association,
  so Rails couldn't cascade/pre-validate before `destroy`, and the DB's `ON DELETE RESTRICT` foreign key surfaced as
  a raw, unrescued `PG::ForeignKeyViolation`.
- Fix: `user_patch.rb` now declares `has_many :timesheet_submissions`/`:timesheet_entry_locks` with
  `dependent: :destroy`, re-points `:timesheet_approval_actions` at `approver_id` with `dependent: :nullify`
  (backed by new migration `019_allow_null_approver_id_on_approval_actions.rb`), and adds a `DestroySafety#destroy`
  rescue as a safety net for any future unmapped FK.
- Retest: bulk-deleted two fresh throwaway users (one with a submitted, pending-approval weekly timesheet) via
  Administration → Users → Delete — clean `302` redirect, "Successful deletion." flash, no 500/FK error in the
  server log, all dependent rows cascaded correctly. Full detail: `bugs/closed/BUG-TMS-001.md`.

## Environment

- Redmine Version: 7.0.0 (Docker)
- Environment: Local Docker (redmine-docker-700-redmine-1, localhost:3010)
- Test Date: 2026-09-21 (found) / 2026-09-25 (retested, closed)
