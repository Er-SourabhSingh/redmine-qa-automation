# Handoff — Redmineflux Workload Plugin

## Last Session

- Date: 2026-09-15
- Redmine Version: n/a (authoring session only — no execution)
- Environment: n/a

## Completed This Session

- Folder structure scaffolded per CLAUDE.md §3.
- Vendor knowledge base ingested from https://www.redmineflux.com/knowledge-base/plugins/workload-plugin/
- `WORKLOAD_REQUIREMENTS.md`, `WORKLOAD_FEATURES_LIST.md` and `WORKLOAD_USER_GUIDE.md` populated from the KB, clearing the
  §11 pre-test blocker.
- Functional, negative and permission test suites authored in `testcases/`.

## In Progress

- Nothing executed yet.

## Blockers

- None. Execution requires a running instance with the plugin installed and the roles named in the permissions
  suite provisioned.

## Next Session Start Point

- Start with the installation/configuration suite, then the permissions suite (it provisions the roles the other
  suites assume), then the functional suites in file order.

## Open Bugs Found

- `BUG-WKL-003` (Medium) — `rf_workload_gantt_data_service.rb` treats a still-Pending leave identically to an
  Approved one, reducing a member's capacity before any approval decision. Found 2026-10-16 while testing
  Platform's Leave module at the user's request. Reported to production as **#123791**, assigned Prashant
  Chaurasia — not linked to any Run/Testcase (same as `BUG-WKL-001`/`002`, no production suite exists yet for
  this plugin).

## Run History

> One row per test run / regression pass.

| Date | Redmine Version | Environment | Tested By | Summary |
|------|-----------------|-------------|-----------|---------|
| 2026-09-15 | — | — | Claude | Authoring only — test cases written from the vendor KB, nothing executed. |
| 2026-10-16 | 6 | `redmine6platform`, localhost:3013 | Sourabh Singh | Retested `BUG-WKL-002` (Workload Gantt never highlighting a recurring Holiday's current-year occurrence) after pulling the dev's fix (`rf_workload_gantt_data_service.rb`, branch `redmineflux_platform`) + the shared `redmineflux_platform` fix, and restarting the container. Gantt now shows the holiday label on Dec 25, 2026, matching Nov 20. Regression: Nov 20 label, Dec 26 weekend class, and the plugin's own (already-correct) capacity-aggregation totals (792h/384h/408h, unchanged) all confirmed unaffected — PASS. Closed; production #123757 synced to Done/100%. `bugs/open/` now empty for this plugin. |
| 2026-10-16 | 6 | `redmine6platform`, localhost:3013 | Sourabh Singh | **Found `BUG-WKL-003`** while verifying Platform's Leave module's cross-plugin capacity impact (TC-PLT-326, part of a full Leave-module pass requested by the user). A still-Pending leave is already excluded from a member's available working days on this plugin's own per-workload Gantt, confirmed via direct `rails runner` call to `RfWorkloadGanttDataService` (10 vs. 11 working days with/without the Pending leave counted). Contrasted against Shift Management's own calendar (TC-PLT-327), which correctly shows "On Leave" only for the Approved date — proving the correct behavior is achievable and already implemented elsewhere in the same codebase. Reported to production same day as **#123791**, assigned Prashant Chaurasia, not linked to any Run/Testcase (none exists yet for this plugin). `bugs/open/` now has 1 bug for this plugin. |
