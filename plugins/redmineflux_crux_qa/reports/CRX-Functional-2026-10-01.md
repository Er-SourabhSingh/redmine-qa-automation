# Redmineflux Crux — Functional Testing Report — 2026-10-01

> One report per testing type, per day it was performed on this plugin — see CLAUDE.md §7.

## Test Case Execution

| TC ID | Title | Result |
|-------|-------|--------|
| TC-CRX-171 | Permission tier — view-only user cannot approve others | PASS (caveat — see Bugs below) |
| TC-CRX-172 | Permission tier — `manage_timesheet` holder can approve within scope | PASS |
| TC-CRX-173 | Basic withdraw — user withdraws own submitted timesheet | PASS (minor gap noted — see Bugs below) |
| TC-CRX-174 | Edit-after-approval allowed when the setting is OFF | PASS |
| TC-CRX-175 | Permission boundary on `submit` — cannot submit for another user | PASS on the core security bar (see Bugs below) |
| TC-CRX-176 | No tool to log/edit a time entry via chat — architecture boundary | PASS |

**Summary:** Total executed — 6 / Pass — 6 / Fail — 0 / Blocked — 0 / Skipped — 0.

These were the last 6 gap test cases in `CRUX_AGENT_TIMESHEET.md` (`TC-CRX-171–176`), closing out execution across all 16 suites in the plugin. Fresh fixtures were built live via the native UI (`crux.developer`/Developer, `luna.blossom`/Manager, `daisy.skye`/Reporter), spanning 4 real submissions including a genuine full 2-level approval chain.

## Bugs / Defects Found

| Bug ID | Title | Severity | Status | Production Redmine Issue ID |
|--------|-------|----------|--------|------------------------------|
| BUG-CRX-044 | Time Agent's timesheet-lookup tools report fabricated definitive absence instead of a scoping/visibility limitation | Medium | Open | #121829 |
| BUG-CRX-045 | Time Agent's `submit` silently substitutes the caller's own data when asked to submit another user's timesheet | Medium | Open | #121830 |
| BUG-CRX-046 | Timesheet `withdraw` action has no Audit Log entry at all | Low | Open | #121831 |

None of the 3 bugs block their own test case's PASS verdict — each is a correctness/transparency defect found alongside a genuinely-working core mechanism (approval scoping, withdraw, submit self-scoping all function correctly at the security/data-integrity level).

## Fix Verification / Retesting

N/A — not a retest-type report.

## Regression Results

N/A — not a regression-type report.

## Notes / Findings

- Redmine Version: 7.0.0 (local Docker)
- Environment: Local (`crux-redmine`, `http://localhost:3014`)
- Test Date: 2026-10-01
- TC-CRX-171: view-only user correctly cannot approve, though see BUG-CRX-044 (approval-lookup tool fabricated absence rather than honest scoping limitation).
- TC-CRX-172: Manager genuinely approves at Level 1, verified via native `/approvals` pending-count dropping to 0.
- TC-CRX-173: own-submission withdraw genuinely reverts the submission (verified via native UI state), though see BUG-CRX-046 (no audit log coverage for withdraw).
- TC-CRX-175: submit is architecturally self-scoped, no cross-user bypass possible — though see BUG-CRX-045 (silent substitution of the wrong user's data, misleading but not a security bypass).
- All 6 suites' TCs across the plugin now have a definitive execution verdict as of this session (combined with the separate Permission-type session the same day — see `CRX-Permission-2026-10-01.md`).
