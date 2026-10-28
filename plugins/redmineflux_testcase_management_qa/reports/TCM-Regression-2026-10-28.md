# Redmineflux Testcase Management — Regression Testing Report — 2026-10-28

> **Full exhaustive final-cycle regression (`SENIOR_QA_STANDARDS.md` §27 / `CLAUDE.md` §10)** — all 22 rows of
> `docs/TESTCASE_MANAGEMENT_TRACEABILITY_MATRIX.md` covered in one continuous session, completing the partial
> pass started 2026-10-27 (`reports/TCM-Regression-2026-10-27.md`, Critical + 9 High-tier areas only). This pass
> also includes the day's bug-retest work (upgrading several closures from source-diff-only to genuinely
> live-reproduced) inline, per-area, rather than as a separate Retest report — matching this plugin's existing
> 2026-10-27 report convention.

## Scope

For each of the 22 Traceability Matrix areas: checked real `git log` history on the plugin source since that
area's last checkpoint, then live-reproduced every relevant fix against the running app (Docker `localhost:3000`)
rather than trusting a source diff alone.

| # | Area | Result |
|---|---|---|
| 1 | CSV Import | Covered — no new commits since 2026-10-23, unchanged |
| 2 | Environment management | Covered — unchanged |
| 3 | Test suite management | Covered — unchanged |
| 4 | Test case authoring | Covered — unchanged |
| 5 | Test case ↔ suite organisation | Covered — unchanged |
| 6 | Test run lifecycle | Covered — **TC-TCM-187 resolved live this pass (see below), suite now 40/40, zero deferred** |
| 7 | Test execution | Covered — unchanged |
| 8 | Bulk update of results | Covered — unchanged |
| 9 | Reporting | Covered — unchanged |
| 10 | Report emailing & scheduling | Covered — **BUG-TCM-108, BUG-TCM-110 upgraded to genuinely live-reproduced** |
| 11 | Requirements management | Covered — **BUG-TCM-089 Finding 3 upgraded to genuinely live-reproduced**; stale "no further commits" note on Requirement Templates corrected (9 missed cosmetic-UI commits found and reviewed, error-display fix live-verified, no functional regression) |
| 12 | Traceability matrix (RTM) | Covered — unchanged |
| 13 | To-Do management | Covered — unchanged |
| 14 | Activity log | Covered — unchanged |
| 15 | Roles & permissions | Covered — **`view_test_suite`→`view_testcase` permission rename and its menu-gating fix live-reconfirmed with a real denied project member (403 via both hidden menu and direct URL)** |
| 16 | Plugin configuration | Covered — unchanged |
| 17 | Email notifications | Covered — unchanged |
| 18 | Installation prerequisites | Covered — Node-absent boot-crash fix re-verified via a real 31-page PDF export download |
| 19 | Security testing | Covered — **BUG-TCM-091 (CSV cross-project suite-link tamper), BUG-TCM-094 (cross-project IDOR) upgraded to genuinely live-reproduced**; BUG-TCM-092/093 reconfirmed via existing evidence |
| 20 | Performance testing | Covered — unchanged |
| 21 | Project Overview dashboard | Covered — unchanged |
| 22 | Requirement Templates | Covered — stale commit-scope note corrected, UI-polish fix live-verified |

**Summary: 22/22 areas covered, zero new bugs found, zero regressions. 6 bug closures upgraded from
source-diff-only to genuinely live-reproduced this pass.**

## Bugs re-verified fixed this pass (upgraded source-diff → genuinely live-reproduced)

| Bug ID | Area | What was live-reproduced |
|---|---|---|
| BUG-TCM-091 | CSV Import / Security | Cross-project suite-link tamper re-driven through the real 4-step import wizard, not just a source read |
| BUG-TCM-094 | Test execution / Security | Cross-project IDOR on `issue_status_results#new` — real `qanonadmin` (non-member) got a genuine 403 against `alpha-web`'s run #134, both with and without a `project_id` override |
| BUG-TCM-101 | Test execution | Run/Environment dropdown switch exercised live, zero console errors |
| BUG-TCM-108 | Reporting | Tester Scorecard "Include all test run" confirmed not to 500 (report id 190) |
| BUG-TCM-110 | Report emailing & scheduling | Scheduled Reports Cancel action confirmed not to 404 — a real schedule was created and cancelled |
| BUG-TCM-123 | Requirements / Security | Cross-project Requirement IDOR fix reconfirmed |
| BUG-TCM-089 (Finding 3) | Requirements / Roles & permissions | Attachment-download permission bypass — created a real attachment as admin, then requested it as `qanonadmin` (zero Requirements permissions): **403 Forbidden**, where it was previously 200 OK. Full walkthrough in `bugs/closed/BUG-TCM-089.md`'s 2026-10-28 Retest Result section. |

## TC-TCM-187 resolved — last tooling-blocked test case in the plugin

**TC-TCM-187 (Concurrent execution by two users on the same case)** had been deferred since 2026-10-01 — Playwright
MCP's single shared browser cookie jar cannot hold two independently-authenticated UI sessions simultaneously.
Resolved this pass by combining a real browser-UI action (Admin, Add Result popup, Status: Passed) with a
genuinely-independent second session authenticated separately via `curl` (its own cookie jar and CSRF token, QA
Limited, Status: Retest) firing at the same moment, without either side reloading. **Result: PASS** — both entries
preserved in history, final badge deterministically shows the chronologically later write (Passed), zero silent
loss. Full detail in `testcases/TESTCASE_MANAGEMENT_TEST_RUNS.md` under TC-TCM-187. **No TC in this plugin remains
tooling-blocked.**

## Bugs / Defects Found

None new this pass.

## Regression Results

- `bugs/open/` is **empty** as of this pass — every bug ever filed against this plugin is `Closed`.
- `docs/TESTCASE_MANAGEMENT_TRACEABILITY_MATRIX.md` shows no requirement/feature with zero TC coverage.
- **All 3 of `CLAUDE.md` §10's `Complete` criteria are now met.** `STATUS.md` updated to `Complete`.

## Notes / Findings

- Redmine version: 6.x (Docker `redmine6-redmine-1`), plugin version 7.2.0
- Environment: `localhost:3000`, project `rftc-016-ci-qa`, plus cross-project targets `alpha-web`,
  `rftc-038-multisuite-qa`, `rftc-perf-500`
- Test Date: 2026-10-28
- See `docs/TESTCASE_MANAGEMENT_HANDOFF.md`'s matching 2026-10-28 Run History row for the full area-by-area
  narrative, and `docs/TESTCASE_MANAGEMENT_TRACEABILITY_MATRIX.md`'s "Gaps requiring action" section (all items
  now resolved).
