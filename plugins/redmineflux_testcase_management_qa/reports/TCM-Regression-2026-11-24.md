# Redmineflux Testcase Management — Regression Testing Report — 2026-11-24

> Closure report for the **full happy-flow cross-DB regression** — source of truth:
> `testcases/TESTCASE_MANAGEMENT_HAPPY_FLOW_CROSS_DB.md`. This pass exercised the plugin's happy-flow test
> catalog across all 4 supported database engines (SQLite, PostgreSQL, MariaDB, MySQL) plus two Redmine
> major-version compatibility legs (5.1, 7.0), spanning multiple sessions from early November through
> 2026-11-23. `STATUS.md` was updated to reflect the suite as **fully closed** on all legs as of this pass.

## Scope

~282 distinct happy-flow test cases curated from 33 source suite files, organized into 7 groups:

| # | Group | Approx. TCs | Covers |
|---|---|---|---|
| 1 | Core CRUD | ~75 | Test Cases, Suites, Runs, Environments, Overview, To-Do, Configuration, Permissions |
| 2 | Reports / CSV Import / Requirements-RTM | ~55 | Report generation & scheduling, CSV import, Requirements + Traceability Matrix |
| 3 | Automation / CI | ~45 | RFTC-008, 009, 016–022 + RFTC-038 (CI Platform Recipes, 3 TCs) |
| 4 | Milestones / Sessions / Dashboards / Quality HQ / Assignee | ~45 | RFTC-026 through RFTC-045 |
| 5 | Core V1 Release Cycle | 69 | SUITE / CASE / RUN / EXEC / DEFECT / REPORT / API / PERM (full completion sweep) |
| 6 | COMPAT area | 10 | DB/Redmine-version matrix (subset of Group 5) |
| 7 | Release 7.5.0 new features | 9 | Results Dashboard, JPG report, multi-line Steps |

**Two documented gaps** (feature not yet built, not defects — recorded in `TESTCASE_MANAGEMENT_SCOPE.md`'s Out
of Scope section): RFTC026-31 (Reports milestone filter, Phase 2) and the RFTC-044 flaky-trend section.

Branch under test: `release/7.3.0` (through fix commit `acf042b` for BUG-TCM-159).

## Test Case Execution — per leg

| Leg | Environment | Status | Notable findings |
|---|---|---|---|
| MySQL | `redmine6-happyflow-mysql`, `localhost:3022` | **Closed** — every group executed (Test Cases/Suites/Runs/Environments/Overview/Todo/Permissions/Reports/CSV/Requirements-RTM/security-positive/RFTC-008,009,016–022/026,029,033–035,044,045/COMPAT/Group 7) | BUG-TCM-155 |
| SQLite | `redmine6-happyflow-sqlite`, `localhost:3021` | **Closed** (2026-11-20) — Permissions, To-Do, Environments+Overview, Test Runs, Test Cases+Suites, RFTC-017/019/021/022, remaining 44 TCs of Group 5 | BUG-TCM-156 |
| PostgreSQL | primary Docker, `localhost:3000` | **Closed** — Group 5's 44 TCs completed 2026-11-20; TC-TCM-278 (found to have never actually run on this leg) closed out 2026-11-23 | — |
| MariaDB | `redmine6-happyflow-mariadb`, `localhost:3023` | **Closed** (2026-11-23, newest leg, closed in one extended session) — Core CRUD anchors, RFTC-038 (real Jenkins), Group 4 (RFTC-026/029/033/034/035/044/045, incl. resolving an RFTC045-53/54/56/58 CSRF/session-timeout root cause), Requirements/RTM, CSV Import, full Reports group (24/24), Group 3 (RFTC-009/016/017/018), full Group 5 (69/69), full COMPAT (7/7), full Group 7 (9/9) | BUG-TCM-159 |
| Redmine 7.0 COMPAT | `redmine7compat`, `localhost:3012` (Postgres-backed) | **Closed** (2026-11-20) — version-compatibility spot-check, not a full 4th DB-engine leg | BUG-TCM-157, BUG-TCM-158 |
| Redmine 5.1 COMPAT | `redmine5`, `localhost:3001` (Postgres-backed) | **Closed** (2026-11-20) — version-compatibility spot-check | BUG-TCM-157 |

**Summary: all happy-flow groups across all 4 DB-engine legs + both Redmine-version COMPAT legs are now PASS /
closed**, except the two documented out-of-scope gaps above (not failures — unbuilt features).

## Bugs / Defects Found

| Bug ID | Severity | Title | Leg found | Status | Production Issue ID |
|---|---|---|---|---|---|
| BUG-TCM-159 | Critical | `get_testcases.json` leaks assignee's `hashed_password`/`salt` in the response | MariaDB (`localhost:3023`) | Closed — fixed same day (`acf042b`) | #129223 |
| BUG-TCM-155 | High | `AutomationSourceResolver.resolve!` fails on MySQL — unquoted reserved word `key` | MySQL (`localhost:3022`) | Closed | #129147 |
| BUG-TCM-156 | High | Reassigning a testcase's assignee doesn't move it in the assignee's My-ToDo list | SQLite (`localhost:3021`) | Closed | #129166 |
| BUG-TCM-158 | High | Redmine 7's Propshaft migration breaks legacy plugin-asset mirroring (`public/plugin_assets/`) | Redmine 7.0 COMPAT (`localhost:3012`) | Closed | #129193 |
| BUG-TCM-157 | Low | `testcase-tour.css`/`.js` always 404 regardless of Redmine version | SQLite / Redmine 5.1 / Redmine 7.0 COMPAT legs | Closed | #129192 |
| BUG-TCM-154 | Low | CSV import "Private" column only recognizes the literal string `"yes"` | SQLite (`localhost:3021`) | **Open** — not yet reported to production, per explicit user instruction | — |

**Net result: 6 bugs found across the entire cross-DB happy-flow effort, 5 closed, 1 still open (Low severity,
deliberately not yet reported).**

## Regression Results

- All previously-closed TCM bugs (BUG-TCM-001 through BUG-TCM-158, excluding this pass's own finds) showed
  **no regressions** across any of the 4 DB-engine legs re-exercised in this pass.
- BUG-TCM-159 (Critical, MariaDB-leg password/salt leak) was found, fixed, and reverified **same day** —
  no separate regression pass was needed beyond the Group 5 re-run already in progress on that leg.
- This closes the cross-DB happy-flow regression cycle `SENIOR_QA_STANDARDS.md` §26/§27 call for before
  `bugs/open/` can be considered cleared for this effort — one Low-severity bug (BUG-TCM-154) remains open
  by deliberate user choice, not an oversight.

## Notes / Findings

- Redmine Version: 6.0-bookworm (all 4 primary DB-engine legs); 5.1 and 7.0 for the two COMPAT-only legs.
- Environment: Docker, 6 separate stacks (`redmine6-happyflow-{mysql,sqlite,mariadb}`, primary `redmine6`
  Postgres instance, `redmine5`, `redmine7compat`).
- Test Date: spans early November 2026 through 2026-11-23 (report compiled 2026-11-24).
- **Flag (not part of this report's own content):** `STATUS.md`'s TCM row currently has a malformed table
  structure — narrative content with embedded raw newlines spanning several lines, and the row has no
  closing `Status` column value. This is a pre-existing structural issue in the file, not something caused
  by this pass — worth a cleanup pass separately.
