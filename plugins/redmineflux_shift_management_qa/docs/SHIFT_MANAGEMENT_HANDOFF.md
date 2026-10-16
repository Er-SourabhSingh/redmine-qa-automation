# Handoff — Redmineflux Shift Management

## Last Session

- Date: 2026-09-25
- Redmine Version: 7.0.0
- Environment: localhost:3010 (redmine-docker-700-redmine-1)

## Completed This Session

### 2026-09-25 — BUG-SFM-001 retest
- Retested BUG-SFM-001 against plugin commit `d29e480` (rsm-093). **PASS / FIXED.** Served asset is now
  `shift_management-c2dd912b.js`, handler removed. Core Custom Fields Delete and the plugin's own Attendance
  Delete both confirm/cancel on a single click. Details in the bug file's Retest section.
- Closed: production #121065 set In QA → Done / 100% (user-approved), bug file moved to `bugs/closed/`.
  `bugs/open/` is now empty.

### 2026-09-22

- Plugin QA folder scaffolded per CLAUDE.md §3. This was NOT a planned onboarding — it happened because a
  site-wide UI bug (native confirm dialogs across the entire Redmine instance requiring two clicks to
  accept/dismiss) was reported by the user while testing the Checklist plugin, and root-caused to this
  plugin's globally-loaded JS asset.
- Root-caused, reproduced (safely, via a disposable test custom field, since deleted), and filed
  `BUG-SFM-001` — global double-binding of `[data-confirm]` click handlers in
  `redmineflux_shift_management/assets/javascripts/shift_management-02242f4f.js`, duplicating Rails UJS's own
  native handling for every confirm dialog on every page of the instance.
- Added `SFM` to CLAUDE.md's Bug ID Convention table.

## In Progress

- No test cases have been written or executed for this plugin's own features yet.

## Blockers

- None for the filed bug. A full onboarding (proper requirements/features-list/user-guide pass) is still
  needed before any real test cycle starts here.

## Next Session Start Point

- `bugs/open/` is empty, but STATUS must stay `In Progress`, not `Complete` — no test cases exist
  for this plugin yet, so there is no full-cycle regression (§27) to run. A real test cycle needs the
  plugin's requirements/features-list/user-guide from the user first (CLAUDE.md §11).

## Open Bugs Found

- `BUG-SFM-003` (Medium) — `POST /shift_management/api/v1/leave` never checks `manage_rf_platform_leaves`; a
  zero-permission user can still create their own leave via this REST API, bypassing the just-fixed
  `redmineflux_platform` web-form gate (`BUG-PLT-054`). Found 2026-10-16 via a Platform-driven Security pass,
  proven live via direct `curl` with a zero-permission user's own API key. Not yet reported to production.

## Run History

> One row per test run / regression pass. Replaces the old changelog.md.

| Date | Redmine Version | Environment | Tested By | Summary |
|------|-----------------|-------------|-----------|---------|
| 2026-09-22 | 7.0.0 | localhost:3010 | Sheetal Sharma (AI-assisted) | Folder scaffolded ad hoc; one bug (BUG-SFM-001) found and filed via root-cause investigation prompted by a Checklist-plugin session. No dedicated test cycle run yet. |
| 2026-09-25 | 7.0.0 | localhost:3010 | Sourabh Singh (AI-assisted) | Retest BUG-SFM-001 against fix commit d29e480 — PASS. Regression: core Custom Fields delete + plugin Attendance delete, accept-once and dismiss-once — all PASS. BUG-SFM-001 closed; prod #121065 → Done / 100%. |
| 2026-10-16 | 6 | `redmine6platform`, localhost:3013 | Sourabh Singh | Retested `BUG-SFM-002` (Shift Calendar never highlighting a recurring Holiday's current-year occurrence) after pulling the dev's fix (`shift_dashboard_controller.rb`/`holiday_engine.rb`, branch `redmineflux_platform`) + the shared `redmineflux_platform` fix, and restarting the container/Sidekiq. Dec 25, 2026 now correctly shows `sm-shift-cell sm-shift-holiday`. Regression: Dec 25 2025 baseline, Nov 20 2026 non-recurring holiday, and Dec 26 2026 weekend all unaffected — PASS. Closed; production #123755 synced to Done/100%. `bugs/open/` now empty for this plugin. |
| 2026-10-16 | 6 | `redmine6platform-redmine-1`, localhost:3013 | Sourabh Singh | **Found `BUG-SFM-003`** during a `redmineflux_platform`-driven Security pass (TC-PLT-354, `SENIOR_QA_STANDARDS.md` §28 — "always send the request directly too" after `BUG-PLT-054`'s web-form fix). `ShiftManagementApi::V1::LeaveController#create` builds and saves a `RedminefluxPlatform::Leave` directly with no check of `manage_rf_platform_leaves` anywhere — only plain login. Proved live: `marigold.rayne` (zero permission, confirmed via `rails runner`) successfully created Leave #15 via `POST /shift_management/api/v1/leave` with her own API key, once a Policy Band was temporarily assigned to isolate the already-fixed band check. Same root cause and same day as Workload's own `BUG-WKL-004`. Fixture cleaned up immediately after confirming the finding. `bugs/open/` count: 0 → 1. |
| 2026-10-16 | 6 | `redmine6platform-redmine-1`, localhost:3013 | Sourabh Singh | Per explicit user instruction ("okay bana do bug or jo bhi update krna he proper update kr do production pe"), reported `BUG-SFM-003` to production as **#123834** (Category "Shift Management", Defect Type Security, Defect Severity Medium-severity, Defect priority Medium, Priority Medium, assigned Prashant Chaurasia) — filed as a fresh issue rather than reopening the already-closed `BUG-PLT-054`, since the broken code lives in this plugin's own controller. Updated local bug file's Production Redmine Issue ID and Production report section, `bugs/_index.md`, `STATUS.md`. |
