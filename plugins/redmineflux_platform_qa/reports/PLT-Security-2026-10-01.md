# Redmineflux Platform — Security Testing Report — 2026-10-01

> One report per testing type, per day it was performed on this plugin — see CLAUDE.md §7.

## Test Case Execution

| TC ID | Result |
|-------|--------|
| TC-PLT-210 | PASS |
| TC-PLT-211 | PASS (Create/Update leg) — Destroy leg not executed, tooling-blocked (see TC notes) |
| TC-PLT-212 | PASS |
| TC-PLT-213 | PASS |
| TC-PLT-214 | PASS (behavior) — documentation gap found, `BUG-PLT-028` |
| TC-PLT-215 | PASS |
| TC-PLT-216 | PASS |
| TC-PLT-217 | PASS |
| TC-PLT-218 | **FAIL — confirmed stored XSS, `BUG-PLT-027` (Critical)** |
| TC-PLT-219 | PASS |
| TC-PLT-220 | PASS |
| TC-PLT-221 | BLOCKED — not executed (tooling limitation, see test case file) |
| TC-PLT-222 | PASS / Confirmed N/A |

**Summary:** Total executed — 11 Pass / 1 Fail / 1 Blocked / 0 Skipped (12 of 13 TCs executed; TC-PLT-221 requires two independent concurrent browser sessions, not achievable with the single-context Playwright MCP connection available this session).

## Bugs / Defects Found

| Bug ID | Title | Severity | Status | Production Redmine Issue ID |
|--------|-------|----------|--------|------------------------------|
| BUG-PLT-027 | Confirmed stored XSS — Holiday name breaks out of the unquoted `title=` attribute on the Overview's Holiday Calendar widget and executes as real script on every page load | Critical | Open | Not yet reported |
| BUG-PLT-028 | "Mark as Private" helper text undersells the actual visibility rule — omits the assignee carve-out the backend genuinely grants | Low | Open | Not yet reported |

## Notes / Findings

- **Redmine Version:** 6 (Rails 7.2.3.1)
- **Environment:** `redmine-docker-6-platform`, `localhost:3013`
- **Test Date:** 2026-10-01

### Coverage performed, per `SENIOR_QA_STANDARDS.md` §28's minimum bar

- **Unauthenticated access** — TC-PLT-210, 12+ URLs swept, all redirect cleanly.
- **Cross-role authorization at the endpoint** — TC-PLT-211, mutation endpoints (not just UI buttons) confirmed rejecting a correctly-authenticated-but-under-privileged session.
- **Cross-project / cross-tenant isolation (private-record visibility)** — TC-PLT-212/213/214/215, full 4-way matrix (non-owner list exclusion, non-owner direct-URL 404, assignee carve-out, admin override) all confirmed, plus TC-PLT-220's direct ID-sweep cross-check.
- **Script-injection on user-editable text fields** — TC-PLT-216/217, 4 different fields across 3 entities plus the Tags chip control, all properly escaped — **except** the Overview/Holiday-Calendar `title=` attribute (TC-PLT-218), which is genuinely vulnerable and is this session's one real security defect.
- **SQL-meta-character safety** — TC-PLT-219, parameterized queries confirmed, no injection possible.
- **Direct object reference / ID-guessing** — TC-PLT-220, full sweep with a genuinely-another-user's private record mixed in, correctly differentiated from own records and no-permission entities.
- **Session handling** — TC-PLT-221, not executable this session (see Test Case Execution table); needs a two-independent-session setup in a future pass.
- **File upload / rate limiting** — TC-PLT-222, confirmed genuinely Not Applicable to this plugin's own surface (no upload fields exist; no public endpoint of Platform's own exists).

### Role-drift correction made during execution (not a bug, a test-infrastructure note)

Several of the Permissions suite's "view-only" test roles (`PLT-QA-TeamsViewOnly`, `PLT-QA-SchemesOnly`) had `manage_*` permission added to them by an earlier session's TC-139-style "now also grant manage" step, and were never re-split into a separate pure-view-only role afterward. This TC-PLT-211 execution found and worked around the drift (used `PLT-QA-ViewOnlyNoManage` for Teams, temporarily toggled `PLT-QA-SchemesOnly`'s manage permission off and back on for Holiday Schemes) rather than silently trusting the stale role assignment named in the TC text. Future sessions reusing any role from this suite's "Test infrastructure created this run" list should re-verify its actual current permissions via `/roles/<id>/edit` before assuming the name still matches its original scope.
