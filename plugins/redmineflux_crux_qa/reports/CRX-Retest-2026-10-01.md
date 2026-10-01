# Redmineflux Crux — Retest Testing Report — 2026-10-01

> One report per testing type, per day it was performed on this plugin — see CLAUDE.md §7.

## Test Case Execution

| TC / Bug Retested | Linked Production Testcase | Original Severity | Result |
|---|---|---|---|
| BUG-CRX-013 (self-contradiction on `update_deal_stage`) | #120490 (`CRUX_AGENT_CRM_SALES`) | High | CONFIRMED FIXED (2/2 clean) — see note below |
| BUG-CRX-035 (inline success-message styling) | #120489 (`CRUX_AGENT_ROSTER_ADMIN`) | Low | CONFIRMED FIXED |
| BUG-CRX-036 (suite-removal not blocked by active run) | #120494 (`CRUX_AGENT_QA_TESTCASES`) | Medium | CONFIRMED FIXED |
| BUG-CRX-037 (Retire dialog not auto-closing) | #120495 (`CRUX_AGENT_TIMESHEET`) | Low | CONFIRMED FIXED |
| BUG-CRX-038 (Time Agent fabricated team-slug) | #120495 (`CRUX_AGENT_TIMESHEET`) | Medium | CONFIRMED FIXED |
| BUG-CRX-039 (Admin self-submission not refused) | #120495 (`CRUX_AGENT_TIMESHEET`) | High | CONFIRMED FIXED |
| BUG-CRX-040 (misleading ✓ on Permission-denied) | #120495 (`CRUX_AGENT_TIMESHEET`) | Medium | CONFIRMED FIXED |

**Summary:** 7 bugs retested — 7 CONFIRMED FIXED (0 FAIL, 0 BLOCKED).

## Bugs / Defects Found

| Bug ID | Title | Severity | Status | Production Redmine Issue ID |
|--------|-------|----------|--------|------------------------------|
| BUG-CRX-043 | Sales Agent's `update_deal_stage` always fails "Stage cannot be blank" on confirm — MCP tool sends nested body, Rails action reads flat params | High | Open — reported to production | #121819 |

## Fix Verification / Retesting

All 7 bugs were previously "In QA" on production. Retested live against the running local stack after pulling dev fixes across 4 repos (`redmineflux-crux-core`, `redmineflux_crux`, `redmineflux_timesheet`, `redmineflux_testcase_management`) and running the required plugin migration.

- **BUG-CRX-013**: the original self-contradiction defect on `update_deal_stage` is confirmed fixed (2/2 clean real proposals with genuine Confirm/Cancel buttons). However, confirming the proposal surfaced a new, 100%-reproducible defect — "Stage cannot be blank" on confirm despite the proposal showing the correct stage — root-caused to a parameter-shape mismatch between the MCP tool (sends nested `{"crm_deal": {"stage": ...}}`) and the Rails `update_stage` action (reads flat `params[:stage]`). Per the "retest verdict against original scope" rule, this was filed separately as **BUG-CRX-043** rather than keeping BUG-CRX-013 open for the wrong reason. BUG-CRX-013 itself closed.
- **BUG-CRX-035**: real browser click-through confirms the `.crux-success` banner is genuinely present on the Fleet page.
- **BUG-CRX-036**: confirmed via a real Ask Crux chat click-through against a fresh suite+run fixture — the proposal now fails honestly with the documented 422 message naming the blocking run.
- **BUG-CRX-037**: retired a fresh throwaway agent — dialog genuinely auto-closes (`display:none`) immediately after success.
- **BUG-CRX-038**: re-ran the exact original repro naming the team by display name only — agent now genuinely calls `team_list` first and resolves to the real numeric ID.
- **BUG-CRX-039**: Admin's own submission is now refused with a real, honest message; verified `/admin_dashboard` shows 0 submissions, no bypass. (A new ✓-on-refusal instance was noted and cross-referenced to BUG-CRX-040, not filed separately.)
- **BUG-CRX-040**: re-ran as `luna.blossom` — the literal "Permission denied..." text no longer carries a checkmark; Overtime Threshold verified unchanged.

All 7 production issues (#120664, #121482, #121484, #121510, #121511, #121513, #121518) synced to Status Done / 100% done, each with a closing note citing its specific retest evidence. BUG-CRX-043 reported to production as #121819, linked to testcase #120490 / Run #569 / Suite #374, environment "Window 11 + Chrome" — testcase marked Failed.

## Regression Results

N/A — not a regression-type report. (Final full-plugin regression has not yet been run; `bugs/open/` is not empty.)

## Notes / Findings

- Redmine Version: 7.0.0 (local Docker)
- Environment: Local (`crux-redmine`, `http://localhost:3014`)
- Test Date: 2026-10-01
- Also this day (not itself a testing activity — recorded for completeness): the 5 remaining open bugs with no prior Production Redmine Issue ID were reported to production — BUG-CRX-041 (#121827), BUG-CRX-042 (#121828), BUG-CRX-044 (#121829), BUG-CRX-045 (#121830), BUG-CRX-046 (#121831) — all linked to testcase #120495 / Run #569 / Suite #374. All 6 currently-open Crux bugs now carry a Production Redmine Issue ID.
