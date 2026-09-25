# Handoff — Redmineflux Timesheet Plugin

## Last Session

- Date: 2026-09-25
- Redmine Version: 7.0.0 (Docker)
- Environment: Local Docker (redmine-docker-700-redmine-1, http://localhost:3010)

## Completed This Session

- Restarted Docker 7 (localhost:3010). Discovered the container restart does not auto-run plugin migrations;
  ran `rake redmine:plugins:migrate NAME=redmineflux_timesheet` by hand (applied migration 019) and restarted again.
- Retested **BUG-TMS-001** (bulk-deleting a user with a timesheet submission crashed with a 500) — **PASS**.
  Confirmed fix in `user_patch.rb` source, reproduced the original crash scenario end-to-end via the UI with
  throwaway fixture users, confirmed clean cascade + no error.
- Closed BUG-TMS-001: moved `bugs/open/BUG-TMS-001.md` → `bugs/closed/BUG-TMS-001.md`, synced production issue
  #121040 to Status: Done, % done: 100 (approved by user), updated `bugs/_index.md`, `reports/final-bug-report.md`,
  and `docs/TIMESHEET_MEMORY.md`.

## In Progress

- No test case in `testcases/` has been executed yet. BUG-TMS-001 was found/retested ad-hoc, outside the authored
  TC-TMS-1xx suite.

## Blockers

- None currently open. `bugs/open/` is empty.

## Next Session Start Point

- Start with the installation/configuration suite, then the permissions suite (it provisions the roles the other
  suites assume), then the functional suites in file order.
- Because `bugs/open/` just became empty, before `STATUS.md` can be marked `Complete` a full final-cycle regression
  (`SENIOR_QA_STANDARDS.md` §27) is required — but that rule assumes an existing suite of passed TCs to re-run,
  and none exist yet here. Treat the upcoming first full execution pass over `testcases/` as satisfying that gate
  once it completes with zero new failures.
- Local team-mode fixture note: adding a user to a Timesheet team requires setting a **team role** (not just a
  project role) for the "Timesheet" top-menu entry to appear — see `TIMESHEET_MEMORY.md`.

## Open Bugs Found

- None open. BUG-TMS-001 closed this session (see `bugs/closed/BUG-TMS-001.md`).

## Run History

> One row per test run / regression pass.

| Date | Redmine Version | Environment | Tested By | Summary |
|------|-----------------|-------------|-----------|---------|
| 2026-09-15 | — | — | Claude | Authoring only — test cases written from the vendor KB, nothing executed. |
| 2026-09-25 | 7.0.0 (Docker) | Local Docker (localhost:3010) | Claude | Retest of BUG-TMS-001 (bulk user delete crash) — PASS, fix confirmed, bug closed and synced to production #121040 (Done, 100%). No suite-wide regression run (no TCs executed yet this cycle). |
