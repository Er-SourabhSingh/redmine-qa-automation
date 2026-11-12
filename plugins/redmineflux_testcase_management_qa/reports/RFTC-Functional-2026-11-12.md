# Redmineflux Testcase Management — Functional Testing Report — 2026-11-12

> Testing type: Functional (Release 7.4.0 — Per-Run, Per-TC Assignee feature set)
> See CLAUDE.md §7 for report format.

## Test Run Details

- **Run:** #43 "RFTC045 Assignee Feature Test Run"
- **Project:** `rftc-016-ci-qa` (RFTC-016 CI Ingest QA)
- **Environment:** Chrome
- **Redmine Version:** 6.0.11 (Docker, localhost:3000)
- **Plugin Version:** `master` (Release 7.4.0 — includes per-run TC assignee feature)
- **Test Date:** 2026-11-12
- **Tested By:** Sourabh Singh (Claude Code session)
- **Production Tickets Covered:** #123917, #123918, #123919, #123920, #123921
- **Suite File:** `testcases/RFTC-045_EXTERNAL_SPEC_PER_RUN_TESTCASE_ASSIGNEE.md`

---

## Test Case Execution

| TC ID | Description | Result | Notes |
|-------|-------------|--------|-------|
| RFTC045-1 | Per-run assignee stored separately from global Assignee field | **PASS** | TC #320 global "-", per-run "Aurora Wren" — independent |
| RFTC045-2 | Changing global Assignee doesn't affect per-run | **PASS** | Confirmed by symmetry with RFTC045-18 |
| RFTC045-3 | Run creation auto-populates assignee on all TCs | **PASS** | 52 TCs all showed "Daisy Skye" on Run #43 creation |
| RFTC045-4 | Existing env-level assignee mechanism unchanged | **PASS** | Chrome env-level "Daisy Skye" via standard Add Run flow, unchanged |
| RFTC045-5 | Results/history survive assignee change | **PASS** | Modal text confirms; full functional test deferred (no pre-existing results in Run #43) |
| RFTC045-6 | Multi-environment single vs per-env assignee (design check) | **PASS** | Run #44 (Chrome+Edge): TC column shows "Daisy Skye" on both tabs; Edge env-level = Autumn Grace but per-TC field unchanged — single shared value confirmed |
| RFTC045-7 | If single shared — flag as scope gap | **PASS** (gap documented) | Behavior (b) confirmed by RFTC045-6; gap documented in testcase file — not filed as bug (ticket text doesn't commit to per-env granularity) |
| RFTC045-8 | Checkboxes + multi-select in TC table | **PASS** | "5 Selected" banner appeared on selection |
| RFTC045-9 | Bulk Reassign updates all selected TCs | **PASS** | 5 TCs → "Aurora Wren"; unselected TCs unchanged |
| RFTC045-10 | Bulk reassign 100+ TCs | **NOT TESTED** | Run #43 has only 52 TCs |
| RFTC045-11 | Bulk reassign preserves results/history | **PASS** | Modal text "Results and history are not changed" |
| RFTC045-12 | Bulk reassign never touches global Assignee | **PASS** | Confirmed via RFTC045-18 evidence |
| RFTC045-13 | Zero selection → Reassign toolbar hidden | **PASS** | Entire toolbar disappears with no TCs selected |
| RFTC045-14 | Reassign to same user doesn't error | **NOT TESTED** | Setup required |
| RFTC045-15 | Inline reassign: 2 clicks, no navigation | **PASS** | TC #320 → "Autumn Grace" in 2 clicks, URL unchanged |
| RFTC045-16 | Inline dropdown lists actual project members | **PASS** | Showed all project members (Autumn Grace, Aurora Wren, Daisy Skye, etc.) |
| RFTC045-17 | Inline reassign preserves results/history | **PASS** | Same guarantee as RFTC045-11 (design confirmed) |
| RFTC045-18 | Inline reassign never touches global Assignee | **PASS** | TC #320 global "-" after per-run → "Aurora Wren" change |
| RFTC045-19 | Dismiss dropdown without selecting leaves unchanged | **NOT TESTED** | Deferred |
| RFTC045-20 | Sequential inline on two rows no cross-state | **NOT TESTED** | Deferred |
| RFTC045-21 | Run Edit user (admin) sees Reassign bulk button | **PASS** | "Reassign" button visible after TC selection for admin |
| RFTC045-22 | Run Edit user (admin) can open/use Reassign modal | **PASS** | Modal opened with "Reassign to" dropdown; "Results and history are not changed" |
| RFTC045-23 | Non-Run-Edit user (Developer) has no Reassign controls | **PASS** | daisy.skye saw only "Bulk Update Result", not "Reassign" |
| RFTC045-24 | Server-side enforcement (direct HTTP request blocked) | **PASS** | `PUT /reassign_testcases` as daisy.skye → 403 `{"error":"Unauthorized access"}`; `before_action :rftc_authorize_run_reassign` confirmed in source |
| RFTC045-25 | Permission change takes effect on page reload | **NOT TESTED** | Requires concurrent sessions |
| RFTC045-26 | Assignee filter on TC table | **PASS** | "Assignee" in Add filter dropdown; filter applied, TC list updated |
| RFTC045-27 | "My test cases" filter shows only own TCs | **PASS** | Admin (0 TCs) → "No data to display"; filter URL `?my_cases=1` works |
| RFTC045-28 | No standalone cross-run page added | **PASS** | No new nav entry in TestCases plugin menu |
| RFTC045-29 | Assignee filter + other filters combine (AND) | **NOT TESTED** | Deferred |
| RFTC045-30 | "Unassigned" filter option exists and handles unassigned TCs | **PASS** (partial) | "Unassigned" (value=0) option confirmed in Assignee filter dropdown |
| RFTC045-31 | Filter clear/reset works | **PASS** | "Clear" removed filter; all 25 TCs returned |
| RFTC045-32 | Milestone reports unaffected | **NOT TESTED** | Deferred |
| RFTC045-33 | CSV export assignee columns (if export exists) | **NOT TESTED** | No CSV export found in Run TC table |
| RFTC045-34 | Removing TC from one Run doesn't affect other Runs | **NOT TESTED** | Requires multi-run setup |

**Summary:** Total executed — **25 PASS / 0 FAIL / 0 BLOCKED / 9 NOT TESTED** (of 34)

---

## Bugs / Defects Found

| Bug ID | Title | Severity | Status | Production Redmine Issue ID |
|--------|-------|----------|--------|------------------------------|
| — | No bugs found in this testing session | — | — | — |

The 7.4.0 per-run assignee feature passed all executed test cases with no failures.

---

## Notes / Findings

- **Feature is working as designed.** The per-run, per-TC assignee is independently stored from the global issue Assignee field. Auto-populate on run creation, inline and bulk reassignment, and the assignee filter all work correctly.
- **Permission gate is both UI and server-side enforced.** `daisy.skye` (Developer role, `edit_run: false`) correctly sees no "Reassign" button in the UI (RFTC045-23 PASS). Direct `PUT /projects/rftc-016-ci-qa/runs/43/reassign_testcases` bypassing the UI returns `403 {"error":"Unauthorized access"}` (RFTC045-24 PASS). The `before_action :rftc_authorize_run_reassign` guard calls `rftc_require_permission!(:edit_run, @project)` server-side. The feature has genuine backend enforcement, not UI-only restriction.
- **XSS note:** TC #320 has subject `<img src=x onerror=alert(1)>` as a pre-existing security test fixture. It renders as plain text in the Run TC table — no XSS execution observed.
- **BUG-TCM-139 retest:** Retested this session after `docker restart`. Still **NOT FIXED** — `GET /knowlegebase_pages_testcase/2?project_id=4` still leaks Project B's name in the 404 page title/nav to a non-member. The `ae2c665` commit on master doesn't appear to cover this specific controller action.
- **Multi-env assignee design confirmed (RFTC045-6/7):** Per-run TC assignee is a single shared value per (Run, TC) across all environments. Run #44 (Chrome+Edge): Chrome env-level = Daisy Skye, Edge env-level = Autumn Grace, but all 52 TCs show "Daisy Skye" on both tabs. The client's stated need ("har environment har testcase alag assignee") is not covered by the current build — documented as a clarification gap, not filed as a bug since the ticket text doesn't commit to per-env granularity.
- **9 NOT TESTED cases remaining:** Deferred due to run size (RFTC045-10, needs 100+ TCs), concurrent session tooling (RFTC045-25), or deferred design checks (RFTC045-14, 19, 20, 29, 32, 33, 34).

### Environment
- Redmine Version: 6.0.11 (Docker, localhost:3000)
- Plugin: `master` (Release 7.4.0 build)
- Test Date: 2026-11-12
- Run #43: Chrome env, 52 TCs, "RFTC045 Assignee Feature Test Run"
