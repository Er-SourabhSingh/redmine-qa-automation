# Final Bug Report — Redmineflux MCP

> Generated from bugs/open/. PDF only on explicit user request.

## Summary

| Total | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|
| 0     | 0        | 0    | 0      | 0   |

## Environment

- Redmine Version: Flux / Local Docker (localhost:3006)
- Environment: dev-flux.zehntech.com / localhost:3006
- Test Dates: 2026-06-11 (Session 1), 2026-06-12 (Session 2), 2026-06-15 (Retest), 2026-06-16 (Retest), 2026-06-17 (Retest × 2), 2026-06-18 (Retest)
- Tested By: Claude (admin)

---

## Open Bugs

No open bugs.

---

## Closed Bugs

| Bug ID | Title | Closed Date | Resolution |
|--------|-------|-------------|------------|
| BUG-RFM-001 | Holidays modal shows "Error loading holidays" for non-active scheme | 2026-06-12 | Fixed |
| BUG-RFM-002 | `team_data` misreports HTTP 403 as "Server error (500)" for deleted team ID | 2026-06-18 | Not a Bug — deletion works correctly; error on show of deleted team is expected |
| BUG-RFM-003 | `member_update` and `member_add` accept `role` param but do not apply it | 2026-06-12 | Fixed |
| BUG-RFM-004 | `workload_show` misreports HTTP 404 as "Server error (500)" for deleted workload ID | 2026-06-18 | Not a Bug — deletion works correctly; error on show of deleted workload is expected |
| BUG-RFM-005 | `dashboard` MCP tool returns incorrect capacity, logged hours, and derived metrics vs UI | 2026-06-17 | Fixed |
| BUG-RFM-006 | `holiday_scheme_create/update` missing `description` parameter | 2026-06-17 | Fixed |
| BUG-RFM-007 | `holiday_update` missing `is_recurring` parameter | 2026-06-17 | Fixed |
| BUG-RFM-009 | MCP `team_data` does not return `created_by` or `created_on` fields | 2026-06-18 | Not a Bug — fields not accepted by `team_create`; out of MCP scope |
| BUG-RFM-011 | Allocation split fails with raw MySQL duplicate-key error | 2026-06-18 | Closed |

---

*Last updated: 2026-06-18 — Open bugs: 0*
