# Final Bug Report — Redmineflux Time Tracker Plugin

> Generated from bugs/open/. PDF only on explicit user request.

## Summary

| Total | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|
| 1 | 0 | 1 | 0 | 0 |

## Open Bugs

### BUG-TMT-001 — "Start Timer" writes real time entries on a closed/read-only project

- Severity: High
- Production Redmine Issue ID: not yet reported
- Found via an ad-hoc investigation prompted by a user report, not a full suite pass — this is the plugin's
  first live finding. Corresponds to `TC-TMT-923` ("Closed and archived projects"), previously authored but not
  executed.
- Core's "Log time" is correctly absent/blocked on a closed project's issue, but the plugin's own "Start Timer" →
  "Stop Timer & Log Time" flow fully succeeds: `POST /time_tracker/start_timer` → 200, `POST
  /time_tracker/save_time_entry_with_custom_fields` → 200, and the issue's Spent time total genuinely increased.
- Full detail: `bugs/open/BUG-TMT-001.md`

## Environment

- Redmine Version: 7.0.0 (Docker, localhost:3010)
- Environment: Local Docker (redmine-docker-700-redmine-1)
- Test Date: 2026-09-22
