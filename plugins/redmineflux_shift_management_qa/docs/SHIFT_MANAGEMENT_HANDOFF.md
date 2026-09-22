# Handoff — Redmineflux Shift Management

## Last Session

- Date: 2026-09-22
- Redmine Version: 7.0.0
- Environment: localhost:3010 (redmine-docker-700-redmine-1)

## Completed This Session

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

- If asked to actually test Shift Management: stop and ask the user for the plugin's requirements/user guide
  first (per CLAUDE.md §11 — requirements, features-list, and user-guide must all be present before writing
  test cases; none of that exists yet beyond the one observed constraint noted in
  `SHIFT_MANAGEMENT_REQUIREMENTS.md`).
- BUG-SFM-001 has not been reported to production — needs the user's fresh, explicit approval before any
  production write.

## Open Bugs Found

- BUG-SFM-001 — Global double-confirm on `[data-confirm]` dialogs site-wide (High) — not yet reported to
  production.

## Run History

> One row per test run / regression pass. Replaces the old changelog.md.

| Date | Redmine Version | Environment | Tested By | Summary |
|------|-----------------|-------------|-----------|---------|
| 2026-09-22 | 7.0.0 | localhost:3010 | Sheetal Sharma (AI-assisted) | Folder scaffolded ad hoc; one bug (BUG-SFM-001) found and filed via root-cause investigation prompted by a Checklist-plugin session. No dedicated test cycle run yet. |
