# Redmineflux Crux — Permission Testing Report — 2026-10-01

> One report per testing type, per day it was performed on this plugin — see CLAUDE.md §7.

## Test Case Execution

| TC ID | Title | Result |
|-------|-------|--------|
| TC-CRX-032 | Permission matrix — DevOps Agent, no-domain-permission probe | PASS |
| TC-CRX-033 | Permission matrix — Budget Agent, no-domain-permission probe | PASS |
| TC-CRX-063 | Permission matrix — QA Agent, no-domain-permission probe | PASS |

**Summary:** Total executed — 3 / Pass — 3 / Fail — 0 / Blocked — 0 / Skipped — 0.

These were the last 3 test cases in the plugin with no prior execution verdict, closing out the permission matrix sweep across all 9 bundled domain agents. All 3 executed live as `luna.blossom` (a user deliberately lacking the relevant domain permission in each case).

## Bugs / Defects Found

None. All 3 probes produced honest, real-backend permission refusals with no fabricated success and no silent write:

- **TC-CRX-032**: "I don't have permission to view the repositories or builds for the crux-qa project." — correctly distinguished from the separate TC-CRX-024 "no safe test repo" infra blocker (no repo-related wording at all; refused purely at the view-permission layer).
- **TC-CRX-033**: agent correctly declined to guess a numeric project ID or category, then — once supplied — produced a genuine governed-write confirm card; clicking Confirm returned "Permission denied: you do not have manage_approved_hours permission in this project."
- **TC-CRX-063**: "I don't have permission to view test suites in the crux-qa project... grant you the `view_test_suite` permission."

## Fix Verification / Retesting

N/A — not a retest-type report.

## Regression Results

N/A — not a regression-type report.

## Notes / Findings

- Redmine Version: 7.0.0 (local Docker)
- Environment: Local (`crux-redmine`, `http://localhost:3014`)
- Test Date: 2026-10-01
- No dummy/safe test repo was needed for TC-CRX-032 — the DevOps Agent's permission check fires before any repo-specific logic is reached, so the probe resolves cleanly without one.
- Crux QA's production numeric project ID was confirmed as **1** (via direct `/projects/1` navigation) while working through TC-CRX-033 — recorded in `docs/CRUX_HANDOFF.md` for reuse by future sessions needing it.
- With these 3 complete, all 174 in-scope test cases across all 16 suites in the plugin now have a definitive PASS/FAIL/BLOCKED/INCONCLUSIVE verdict (TC-CRX-116/117 remain correctly out of scope per the 2026-09-11 dev decision, not pending).
