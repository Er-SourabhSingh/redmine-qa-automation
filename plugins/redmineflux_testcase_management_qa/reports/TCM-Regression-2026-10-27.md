# Redmineflux Testcase Management — Regression Testing Report — 2026-10-27

> Post-bug-fix regression triggered by the 39 bugs retested/closed over 2026-10-26/2026-10-27
> (BUG-TCM-009 through BUG-TCM-122). Scope and priority order determined per `SENIOR_QA_STANDARDS.md` §26
> (severity-driven regression scope) — Critical/High severity areas first. This is a **targeted, in-progress**
> pass, not the full final-cycle regression (`SENIOR_QA_STANDARDS.md` §27, all 22 features) that `bugs/open/`
> being empty also requires before `STATUS.md` can show `Complete`.

## Areas covered this pass (Critical tier)

| Area | Suite file | TCs touched | Result |
|---|---|---|---|
| Requirements management (editor/escaping group) | `TESTCASE_MANAGEMENT_REQUIREMENTS_RTM.md` | TC-TCM-112, 113, 269, 303, 304, 305, 306 (partial), 307, 308 (partial), 309 | All PASS |
| Traceability Matrix (spot-check) | same file | TC-TCM-122 (partial) | PASS |
| Report emailing & scheduling | `TESTCASE_MANAGEMENT_REPORTS.md` | TC-TCM-098 (Tester Scorecard crash re-check), 110, 111 | PASS (TC-110/111 delivery-side not live-reproduced, see resume points) |
| Installation prerequisites | `TESTCASE_MANAGEMENT_CONFIGURATION.md` | Sidekiq-boot-health re-check (BUG-TCM-111) | PASS |

**Summary: 11 TCs executed live, 11 PASS, 0 FAIL, 0 new bugs.**

## Bugs re-verified fixed this pass

| Bug ID | Severity | What was re-verified |
|---|---|---|
| BUG-TCM-093 | Critical | (already closed 2026-10-27 earlier same day) — editor/escaping group shows no regression |
| BUG-TCM-072 / BUG-TCM-121 | High / Low | Mention links and highlight spans on existing fixture still render correctly |
| BUG-TCM-099 | Low | Escape key — no console error (re-confirmed) |
| BUG-TCM-108 | High | Tester Scorecard + "Include all test run" no longer 500s — real scorecard table renders |
| BUG-TCM-110 | High | Fix confirmed via source (`rftc_authorize_report_schedule` now falls back to `identifier:`) — **live UI reproduction not reached, see resume point** |
| BUG-TCM-111 | Critical | Sidekiq boots cleanly (`connection_pool 2.5.5` now compatible with `sidekiq 7.3.9`), no crash in scheduled-job poller |

## Not yet executed (resume points for next session)

- **Requirements/RTM**: TC-TCM-114–121 (CRUD beyond 112/113), TC-TCM-270–273 (race condition, fresh mention link/unlink, rename), TC-TCM-310–312 (linking surfaces), TC-TCM-123–127/313–315 (remaining RTM count-accuracy checks)
- **Report emailing**: live delivery check for Tester Scorecard "Include all" (BUG-108's email half), live Cancel-schedule reproduction (BUG-110), live scheduled-delivery timing check (BUG-111)
- **High-tier areas not started at all**: Roles & permissions (TC-TCM-046–077, 287–294), Email notifications (TC-TCM-008–014, 280–286), Test case authoring (TC-TCM-128–143, 298–302), Test suite management (TC-TCM-192–203), CSV Import (TC-TCM-021–037, 275–279), Test execution (TC-TCM-170–187, 318–319), Test case ↔ suite organisation (TC-TCM-144–151, 295–298), Test run lifecycle (TC-TCM-152–169), Reporting (TC-TCM-078–111, 274, 316–317 — remaining TCs beyond the Tester Scorecard spot-check)
- **Not touched by any of this cycle's bugs** (only needed for the full §27 final-cycle regression, not this targeted pass): Environment management, Bulk update of results, To-Do management, Activity log, Plugin configuration, Performance testing, Project Overview dashboard

## Notes / Findings

- Redmine version: 6.x (Docker `redmine6-redmine-1`), plugin version 7.2.0
- Environment: `localhost:3000`, project `rftc-016-ci-qa`
- Test Date: 2026-10-27
- One cosmetic, pre-existing, unrelated console 404 noted (`article-icon.svg` missing asset) — not filed, no functional impact, not a regression from any of this cycle's fixes
- An initial attempt to test TC-TCM-271 live overwrote a shared fixture's content via Playwright `.fill()`; caught before saving, confirmed fully reverted on reload — no data was actually lost. Lesson: use a disposable fixture for any further manual edit-testing, not a shared one.
