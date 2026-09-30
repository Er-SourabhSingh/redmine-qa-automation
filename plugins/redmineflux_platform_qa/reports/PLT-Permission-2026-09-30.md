# Redmineflux Platform — Permission Testing Report — 2026-09-30

> One report per testing type, per day it was performed on this plugin — see CLAUDE.md §7.

## Test Case Execution

| TC ID | Result |
|-------|--------|
| TC-PLT-136 — Not logged in → every Platform URL redirects to login | Pass |
| TC-PLT-137 — Logged in, no `rf_platform` permission at all → 403 on every URL | Pass |
| TC-PLT-138 — `view_rf_platform` + `view_rf_platform_teams` only → view-only Teams, other entities 403 | Pass |
| TC-PLT-139 — Adding `manage_rf_platform_teams` → New/Edit/Delete appear and function | Pass |
| TC-PLT-140 — Audit events and Settings stay admin-only regardless of any manage permission | Pass |
| TC-PLT-141 — Every "must not be able to X" case also blocked at the direct URL, not just hidden | Pass |
| TC-PLT-204 — Holiday Schemes: view-only then +manage, isolated from other entities | Pass |
| TC-PLT-205 — Holidays: view-only then +manage, isolated from other entities | Pass |
| TC-PLT-206 — Leave Types: view-only then +manage, isolated from other entities | Pass |
| TC-PLT-207 — Leaves: view/decide permission split, isolated (2-layer authorization confirmed, not a bug) | Pass |
| TC-PLT-208 — Organizations: view-only then +manage, isolated from other entities | Pass |
| TC-PLT-209 — Contacts: view-only then +manage, isolated from other entities | Pass |

**Summary:** Total executed — 12 / Pass 12 / Fail 0 / Blocked 0 / Skipped 0

All 15 `rf_platform` permissions (the top-level gate plus view/manage for each of the 7 shared entities) individually confirmed working, correctly isolated per entity, and non-leaking across entities. Audit Events and Settings confirmed to have no grantable permission at all — admin-only by design, correctly enforced at both the UI and direct-URL level. One noteworthy non-bug finding: Leaves requires a second, independent layer of authorization beyond `manage_rf_platform_leaves` — a user also needs to be flagged as an approver on a shared team with the requester (`TeamService.can_approve_leave_for?`) before another user's pending leave becomes visible/actionable.

This suite was re-executed exhaustively today after an initial pass had generalized from partial coverage (Team's 2 permissions plus one representative negative check) to a "6/6 PASS, no findings" claim for all 7 entities — the gap was caught and corrected before being accepted as complete.

## Bugs / Defects Found

None.

## Notes / Findings

- Redmine Version: 6 (Rails 7.2.3.1)
- Environment: `redmine-docker-6-platform`, `localhost:3013`
- Test Date: 2026-09-30
- Source: `plugins/redmineflux_platform_qa/testcases/PLATFORM_PERMISSIONS_AND_ACCESS.md`
