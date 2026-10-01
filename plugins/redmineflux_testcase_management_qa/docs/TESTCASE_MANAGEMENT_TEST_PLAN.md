# Test Plan — Redmineflux Testcase Management

> Written after `TESTCASE_MANAGEMENT_REQUIREMENTS.md`, `TESTCASE_MANAGEMENT_FEATURES_LIST.md` and
> `TESTCASE_MANAGEMENT_USER_GUIDE.md` were read, and after `TESTCASE_MANAGEMENT_SCOPE.md` was filled in.
> Backfilled 2026-10-01 against the plugin's actual, already-advanced test cycle — this is not a fresh-cycle plan.

## Objective

Verify that Testcase Management delivers a working requirement → test case → test run → defect → release
traceability layer inside Redmine, on top of standard Redmine issues/trackers, across both QA instances in use
(Redmine 6.1.3 `localhost:3012` and 7.0.0 `localhost:3010` — both outside the plugin's documented 5.0.x/6.0.x
support range, which is itself a standing risk to track, not assume away).

## Test Approach

Testing types performed this cycle (mirrors `TESTCASE_MANAGEMENT_SCOPE.md`):

- **Functional** — CSV import, suites, test case authoring, runs, execution, reporting, requirements/RTM, To-Do,
  activity log (one suite file per feature area, see the Traceability Matrix for current status per feature).
- **Permission** — all 16 permissions across 6 groups, each with the 3-leg check (UI present, UI absent, direct
  endpoint) per `MEMORY.md`'s "Permission TC Needs UI + URL Both Sides."
- **Negative / Validation** — required-field, duplicate-name, invalid-tracker-config cases folded into the
  Configuration and Test Case suites.
- **Regression** — a full final-cycle regression (`SENIOR_QA_STANDARDS.md` §27) is in progress as of 2026-10-01,
  since `bugs/open/` emptied once (2026-09-30) before new findings reopened it.
- **Security / Performance / Code Quality** — not yet run as dedicated passes on this plugin; see Risks below.

Environments: see `QA_CREDENTIALS.md`. Both instances require Redis + Sidekiq running and Node/Puppeteer/Chromium
installed before any email/report/PDF testing — an incomplete install silently disables features rather than
erroring (confirmed cause of BUG-TCM-005/006).

## Entry Criteria

- Plugin installed and migrated on the target instance.
- A Testcase Tracker configured (mandatory — testcase creation fails without it, see BUG-TCM-010).
- At least one role per permission tier available (Admin, Manager, QA, Developer, Reporter) to exercise the
  Permissions suite's granted/denied legs.

## Exit Criteria

- Every suite in `testcases/` checkpoint-complete (executed, not just authored).
- `bugs/open/` empty, or every remaining open bug explicitly accepted/deferred by the user.
- A passed final-cycle regression on record in `TESTCASE_MANAGEMENT_HANDOFF.md`'s Run History (§27).
- `TESTCASE_MANAGEMENT_TRACEABILITY_MATRIX.md` shows no feature with zero TC coverage, or the gap is recorded in
  `TESTCASE_MANAGEMENT_SCOPE.md`'s Out of Scope.

## Test Deliverables

- Test cases — `testcases/TESTCASE_MANAGEMENT_*.md` (10 suite files)
- Bug reports — `bugs/open/`, `bugs/closed/`
- Reports — `reports/TCM-<TestingType>-<date>.md` (see `CLAUDE.md` §7)
- Traceability Matrix — `TESTCASE_MANAGEMENT_TRACEABILITY_MATRIX.md`

## Roles & Responsibilities

QA execution and bug filing: as logged per session in `TIME_LOG.md`. Dev fixes assigned to Sheetal Sharma on
production (`ztflux`) per the bugs filed so far this cycle.

## Risks & Assumptions

- **Both QA instances are outside the plugin's documented Redmine support range** (5.0.x/6.0.x vs. 6.1.3/7.0.0) —
  any bug found may be instance-specific; state the version in every bug filed.
- **Sidekiq is not officially supported on native Windows** per the vendor KB — if the test environment is native
  Windows rather than WSL2/Docker, email/report findings carry that caveat.
- Security/Performance/Code Quality passes (mandatory per `SENIOR_QA_STANDARDS.md` §28–§30) have not been
  scheduled yet for this plugin — flagged here so it isn't silently skipped before the cycle is called `Complete`.
- Two suites (Reports, To-Do/Activity Log) were not yet part of the 2026-09-30/10-01 regression pass — see the
  Traceability Matrix for exactly which features that leaves uncovered right now.

## Test Cycle / Schedule

- 2026-09-14: suites authored from the vendor KB (CSV Import executed and passed same window).
- 2026-09-15 – 09-29: scattered retest/verification sessions (see `TESTCASE_MANAGEMENT_HANDOFF.md` Run History).
- 2026-09-30 – 10-01: final-cycle regression (§27) in progress — Permissions, Configuration, Test Runs, Test
  Suites, Environments, Test Cases and Requirements/RTM suites checkpoint-complete; Reports and To-Do/Activity Log
  remain.
