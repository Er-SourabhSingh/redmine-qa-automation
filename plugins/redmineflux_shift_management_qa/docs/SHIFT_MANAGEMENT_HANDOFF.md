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

- None open. BUG-SFM-001 (High, prod #121065) closed 2026-09-25.

## Run History

> One row per test run / regression pass. Replaces the old changelog.md.

| Date | Redmine Version | Environment | Tested By | Summary |
|------|-----------------|-------------|-----------|---------|
| 2026-09-22 | 7.0.0 | localhost:3010 | Sheetal Sharma (AI-assisted) | Folder scaffolded ad hoc; one bug (BUG-SFM-001) found and filed via root-cause investigation prompted by a Checklist-plugin session. No dedicated test cycle run yet. |
| 2026-09-25 | 7.0.0 | localhost:3010 | Sourabh Singh (AI-assisted) | Retest BUG-SFM-001 against fix commit d29e480 — PASS. Regression: core Custom Fields delete + plugin Attendance delete, accept-once and dismiss-once — all PASS. BUG-SFM-001 closed; prod #121065 → Done / 100%. |
