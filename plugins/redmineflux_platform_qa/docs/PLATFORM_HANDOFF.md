# Handoff — Redmineflux Platform

## Last Session

- Date: 2026-09-28
- Redmine Version: 6 (dedicated container)
- Environment: `redmine-docker-6-platform`, `localhost:3013`

## Completed This Session

- Stood up a new dedicated Docker container, separate from the shared `redmine-docker-6` instance (port 3012) used by other plugins — `C:\redmine-docker-6-platform`, port 3013. Plugin source bind-mount moved twice this session; **currently `./plugins` (relative, inside `C:\redmine-docker-6-platform`)** — check `docker-compose.yml` directly if in doubt, don't assume either historical external path.
- Scaffolded the standard QA folder structure and wrote **61 test cases** (TC-PLT-001–093, across 6 suites) sourced from production ticket #120043 (no vendor KB exists for this brand-new plugin).
- Imported all 20 shared Seed Users into the environment via Redmine's built-in Users → Import CSV wizard (`scripts/qa_seed_users_import.csv`).
- **Installed all 6 consumer plugins at `master`** (CRM, Helpdesk, Invoice, Timesheet, Workload, Shift Management) — migrations ran clean, all 6 confirmed loaded via Administration → Plugins.
- **Executed the full old-architecture baseline suite, `testcases/PLATFORM_OLD_ARCHITECTURE_BASELINE.md` (TC-PLT-001–010) — all PASS**, with two major scope-correcting discoveries and one confirmed real bug (a second candidate was investigated further and retracted — see below). Created `PLT-BASELINE-Project` plus fixtures across CRM, Helpdesk, Invoice, Workload, Shift Management, Timesheet — see the testcase file for full per-TC evidence.
- Enabled Administration → Settings → API → "Enable REST web service" on this environment (was off, Redmine's default) — required for Timesheet's time-logging feature to work at all; see BUG-PLT-002 below. Confirmed persisted through a full container recreate.

### Major discovery: two entities are already pre-consolidated at `master`, independent of the platform plugin

This changes what the later migration-integrity suites actually need to check:

1. **Contact/Customer (CRM ↔ Invoice)** — already merged via Invoice's own `riv-006` spec (dated 2026-07-27, three weeks *before* platform ticket #120043 existed). `db/migrate/027_migrate_legacy_customers_to_rf_crm_contacts.rb` already repointed Invoice at `rf_crm_contacts`; `/customers` redirects to `/contacts`. Confirmed live via Invoice's Billing Settings customer dropdown.
2. **Team (Workload ↔ Timesheet ↔ Shift Management)** — already one shared `rf_teams` table. Creating a team in Workload made it instantly appear, identically, in both other plugins' UIs with zero extra action.

Organization (CRM Company vs Helpdesk Organization) and Holiday (Workload vs Shift Management) remain genuinely separate today, as originally assumed — these are the real migration-integrity targets.

### Two candidate bugs investigated — neither filed, per explicit user decision

1. **Workload leave-request modal (`/rf_leaves`)**: originally claimed a broken off-screen datepicker. Root cause was my own testing artifact — I'd been probing the modal's default hidden DOM state (a CSS slide-in drawer, `right: -500px` until an `.active` class is applied) without ever actually clicking "+ Request Leave" in that session first. Retested with a real click-to-open: works cleanly. **Not a bug.**
2. **Timesheet weekly view (`/timesheets/weekly`)**: "Log Time Entry" failed with "You do not have permission to log time for this project" because `Setting.rest_api_enabled?` was `false` (Redmine's own default) — Timesheet's save action POSTs to Redmine core's `/time_entries.json`, which refuses session-auth on JSON-format requests when REST API is off. Enabling Administration → Settings → API → "Enable REST web service" fixed it (confirmed `201 Created` afterward). **User explicitly decided this is not a bug either** — a disabled-by-default core setting needing to be turned on is normal environment setup, not a plugin defect. Left enabled on this environment since Timesheet needs it either way.

Full repro/diagnosis for both is in `PLATFORM_OLD_ARCHITECTURE_BASELINE.md` (TC-PLT-008 and TC-PLT-009) for reference, but **neither is filed to `bugs/open/`**.

### One item left genuinely incomplete

`timesheet_audit_logs` remains empty — triggering a real "Submit" audit entry requires an Approval Schema assigned to the project (a separate Timesheet-plugin concept, `Project#approval_schema_id`, not yet configured). Two real `TimeEntry` rows were created via genuine UI submission after the REST API fix (Tuesday 1.5h, Thursday 1h), plus one earlier `rails runner`-created entry (Monday 2h, real but not UI-created, kept as-is) — none of these are Submit/Approve actions, so no audit hook fired yet. Shift Management's audit log is fine — it got a real entry (`auto_approve_leave`) as a side effect of the TC-PLT-008 leave-application fixture, no extra work needed.

## In Progress

None — the baseline suite is complete. The next phase is the actual branch upgrade.

## Blockers

None. Ready to proceed to `testcases/PLATFORM_INSTALLATION_AND_UPGRADE.md`. Both bug candidates from this session are resolved (neither filed, see above) — nothing pending.

## Next Session Start Point

1. Move to `testcases/PLATFORM_INSTALLATION_AND_UPGRADE.md`. TC-PLT-011/012 (hard-dependency enforcement) can run now — switch one or all 6 consumer plugins to the `redmineflux_platform` branch *without* the platform plugin present, confirm the clear failure message.
2. TC-PLT-013/014 (fresh-install control group) needs a second clean environment — may need to ask the user for one, or skip and rely on TC-PLT-021's schema check alone.
3. **TC-PLT-020/021 is the actual upgrade** — add the `redmineflux_platform` plugin, switch all 6 consumer plugins' branch, run migrations.
4. Once upgraded, all the fixture data created this session (`PLT-BASELINE-*` everywhere) becomes the input for `PLATFORM_DATA_MIGRATION_INTEGRITY.md` and `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` — remember Organization/Contact/Company and Holiday are genuine merge targets, but Team and Contact/Customer are **not** (already merged) — those TCs should check "survived unchanged," not "merge happened."
5. `PLATFORM_KNOWN_GAPS_AND_EDGE_CASES.md` TC-PLT-090 (Shift Management pre-platform data survival) still needs its own dedicated fixtures created — not yet done, separate from this session's baseline suite.

## Open Bugs Found

None. Both candidates investigated this session (Workload leave modal, Timesheet REST-API-disabled 403) were explicitly decided by the user to not be bugs — see "Completed This Session" above. Nothing pending.

## Run History

> One row per test run / regression pass. Replaces the old changelog.md.

| Date | Redmine Version | Environment | Tested By | Summary |
|------|-----------------|-------------|-----------|---------|
| 2026-09-28 | 6 | `redmine-docker-6-platform` (localhost:3013) | Sourabh Singh | Environment setup only — new dedicated container created and running; no plugin installed yet, no testing performed. |
| 2026-09-28 | 6 | `redmine-docker-6-platform` (localhost:3013) | Sourabh Singh | Test case authoring only, no execution — 61 TCs (TC-PLT-001–093) written across 6 suites from production ticket #120043, covering the old-architecture baseline, install/branch-upgrade, data-migration integrity, cross-plugin consistency, vocabulary, and the ticket's own admitted known gaps (esp. Shift Management pre-platform data survival, TC-PLT-090). |
| 2026-09-28 | 6 (`master` branch, all 6 consumer plugins) | `redmine-docker-6-platform` (localhost:3013) | Sourabh Singh | Old-architecture baseline suite executed in full — TC-PLT-001–010, all PASS. Installed all 6 consumer plugins at `master`; created full fixture data set (`PLT-BASELINE-*` across CRM, Helpdesk, Invoice, Workload, Shift Management, Timesheet). Found: Contact/Customer and Team are already pre-consolidated independent of the platform plugin (changes migration-integrity scope); 2 candidate bugs found initially (Workload leave-modal, Timesheet weekly-view permission error) — not yet filed, pending user decision. |
| 2026-09-29 | 6 (`master` branch, all 6 consumer plugins) | `redmine-docker-6-platform` (localhost:3013) | Sourabh Singh | Bug candidates re-verified at user's request. Workload leave-modal candidate **retracted** — was my own testing artifact (probed the modal's default-hidden slide-in-drawer state without a real open click first); real click-to-open works cleanly, no bug. Timesheet candidate **confirmed real and root-caused**: `Setting.rest_api_enabled?` was `false` (Redmine default), and Timesheet's save action posts to Redmine core's own `/time_entries.json`, which refuses session-auth on JSON-format requests when REST API is off — arrives as anonymous, 403. Enabled REST API via Administration → Settings → API (persisted, survived a container recreate); retested live, `201 Created`. Plugin source bind-mount also moved to `./plugins` inside the docker project folder (user relocated it). |
