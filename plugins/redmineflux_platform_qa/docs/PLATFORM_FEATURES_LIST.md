# Features List — Redmineflux Platform

> This file must be read before writing any test case. It defines the full feature scope for test coverage.
> Source: production ticket #120043 (see `PLATFORM_REQUIREMENTS.md`). No vendor KB exists for this brand-new plugin.

## Feature List

| # | Feature | Description | Covered by TC |
|---|---------|-------------|---------------|
| 1 | Old-architecture baseline (pre-consolidation) | 6 consumer plugins installed standalone at `master`, each with its own duplicated tables/models, fully functional independently | `PLATFORM_OLD_ARCHITECTURE_BASELINE.md` |
| 2 | Platform plugin fresh install | `redmineflux_platform` installs cleanly alongside the 6 consumer plugins on `redmineflux_platform` branch, no errors | `PLATFORM_INSTALLATION_AND_UPGRADE.md` |
| 3 | Hard dependency enforcement | Consumer plugin on `redmineflux_platform` branch refuses to boot with a clear message if the platform plugin is missing | `PLATFORM_INSTALLATION_AND_UPGRADE.md` |
| 4 | Branch upgrade path (master → redmineflux_platform) | Existing instance with real data, consumer plugins switched branch + platform plugin added, migrations run cleanly | `PLATFORM_INSTALLATION_AND_UPGRADE.md` |
| 5 | Organization / Company merge | CRM "Company" + Helpdesk "Organization" → one `rf_organizations` row, ID preserved | `PLATFORM_DATA_MIGRATION_INTEGRITY.md` |
| 6 | Contact / Customer merge | CRM "Contact" + Invoice "Customer" → unified table | `PLATFORM_DATA_MIGRATION_INTEGRITY.md` |
| 7 | Helpdesk Customer stays separate | Helpdesk's User-based "Customer" (`is_helpdesk_customer`) is NOT merged into Contact/Organization | `PLATFORM_DATA_MIGRATION_INTEGRITY.md` |
| 8 | Leave consolidation | Workload `rf_leaves` + Shift Management `rf_leave_applications` → one table, no double-filing possible | `PLATFORM_DATA_MIGRATION_INTEGRITY.md` |
| 9 | Leave Type consolidation | One `rf_leave_types` table — a type added in either plugin's admin appears in the other | `PLATFORM_DATA_MIGRATION_INTEGRITY.md` |
| 10 | Audit consolidation | Timesheet `timesheet_audit_logs` + Shift Management `rf_audit_logs` → `rf_audit_events`, append-only enforced once | `PLATFORM_DATA_MIGRATION_INTEGRITY.md` |
| 11 | Team / Team Membership consolidation | One Team entity shared by Workload, Timesheet, Shift Management | `PLATFORM_DATA_MIGRATION_INTEGRITY.md`, `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` |
| 12 | Holiday / Holiday Scheme consolidation | One Holiday entity shared by Workload and Shift Management, shared `WorkingCalendar` | `PLATFORM_DATA_MIGRATION_INTEGRITY.md`, `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` |
| 13 | Recurring-holiday calendar correctness | `WorkingCalendar` evaluates recurring holidays as rules, not materialized rows | `PLATFORM_DATA_MIGRATION_INTEGRITY.md` |
| 14 | Shift Management pre-platform data carry-over (KNOWN GAP) | Real (non-empty) Shift Management holiday/scheme/audit rows created under `master`, checked for survival after upgrade | `PLATFORM_KNOWN_GAPS_AND_EDGE_CASES.md` |
| 15 | Duplicate-table-drop guard | Migration refuses to drop an old duplicate table while any row is unaccounted for in its replacement | `PLATFORM_INSTALLATION_AND_UPGRADE.md` |
| 16 | Single-source-of-truth cross-plugin visibility | Same Organization/Team/Holiday/Leave record visible in every consumer plugin that uses it | `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` |
| 17 | Single-source-of-truth cross-plugin writes | Editing a shared record from one plugin's UI reflects immediately in another plugin's UI (not a stale duplicate) | `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` |
| 18 | Real form submission post-model-swap | CRM, Helpdesk, Shift Management forms for consolidated entities submit successfully (Rails param key changed behind the model swap) | `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` |
| 19 | Deliberately-not-merged entities stay separate | Invoice `project_customers` vs Helpdesk `rf_project_customers`; CRM `rf_crm_activities`; Shift Management's 6 leave-accrual tables; Invoice's own "Company" settings labels | `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` |
| 20 | Vocabulary consolidation | "Company" wording gone from CRM; Active/Inactive/Private identical everywhere; no more silent `label_active`/`label_inactive` clobbering | `PLATFORM_VOCABULARY_AND_LABELS.md` |
| 21 | UX pass — dedicated pages | Holidays/Leave Types/Leaves/Organizations use dedicated create/edit pages (not popups); Teams/Holiday Schemes remain popups | `PLATFORM_VOCABULARY_AND_LABELS.md` |
| 22 | UX pass — button order/alignment | Primary action (Create/Save) first, left-aligned, across all consolidated-entity forms | `PLATFORM_VOCABULARY_AND_LABELS.md` |
| 23 | Organization–Contact linking | `rf_organization_contact_links` join model records a contact's role at an organization; duplicate-organizations detection report | `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` |
| 24 | Outbox dispatcher | `rf_outbox_events` auto-dispatches via ActiveJob on create, retries with backoff; rake task re-enqueues stuck events | `PLATFORM_INSTALLATION_AND_UPGRADE.md` |
| 25 | External identity mapping | `rf_external_identities` generic mapping table (groundwork, no consumer yet) | `PLATFORM_KNOWN_GAPS_AND_EDGE_CASES.md` |
| 26 | `contact_type` internal value (KNOWN GAP) | Internally still stores `"company"` though the label reads "Organization" | `PLATFORM_KNOWN_GAPS_AND_EDGE_CASES.md` |
| 27 | Demo data rake task | `redmineflux_platform:demo:load` / `:status` / `:clear` | Out of scope this cycle (rake-task/dev tooling, not UI-testable) |
| 28 | Layered Settings sync (`SettingsService`) | Working hours per day / Company Identity fields read the resolved value from the originating plugin, and (per the plugin's own docs) are meant to become the single source of truth other plugins read from | `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` (TC-PLT-094–097) |
| 29 | Real Leave form submission across all 3 entry points | Platform's own "New Leave Request", Shift Management's "Apply Leave", and Workload's "Request Leave" must each actually create a Leave record post-model-swap | `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` (TC-PLT-098–101) |
| 30 | Team → consumer-plugin deep workflows | A team/membership set in Platform is actually usable end-to-end in Shift Management/Timesheet/Workload's own real features, not just visible on a read-only team page | `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` (TC-PLT-102–106) |
| 31 | Delete-dependency handling for shared entities | Deleting an Organization/Team/Holiday with live dependents is refused or clearly handled, per the `register_destroy_guard` mechanism | `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` (TC-PLT-110–112) |
| 32 | Header/breadcrumb/modal-button UI consistency | Platform's own header banner, a shared-screen's page-title/menu context, and delete-modal button sizing must be consistent across every Platform section and against each consumer plugin's native equivalent | `PLATFORM_VOCABULARY_AND_LABELS.md` (TC-PLT-107–109) |
| 33 | Entity CRUD & field validation | Search/sort/pagination, required-field and duplicate-name validation, delete confirmation wording, Team member management, Leave approve/reject/cancel rules, Audit trail correctness, tags, responsive layout — per the plugin's own Tester's Guide §7/§9 | `PLATFORM_ENTITY_CRUD_AND_FIELD_VALIDATION.md` (TC-PLT-113–135) |
| 34 | Platform's own permission model | Two-level `view_rf_platform` / `view_rf_platform_<entity>` / `manage_rf_platform_<entity>` permissions, admin-only Audit events/Settings, hidden-UI-vs-blocked-URL for every restriction | `PLATFORM_PERMISSIONS_AND_ACCESS.md` (TC-PLT-136–141) |
| 35 | Complete cross-plugin CRUD propagation matrix | For every shared entity (Team, Holiday Scheme, Holiday, Leave Type, Leaves, Organizations, Contacts, Audit Events), Create/Update/Delete from **every** relevant origin plugin, each verified against Platform + every other consumer plugin + the underlying database, not just one direction | `PLATFORM_CROSS_PLUGIN_CRUD_MATRIX.md` (TC-PLT-142–202) |

## Notes

- This list is sourced entirely from production ticket #120043 (description + 2026-09-25 journal), since no vendor KB/user guide exists yet for this brand-new plugin. Update this file and `PLATFORM_USER_GUIDE.md` as the actual UI is explored during testing — the ticket describes architecture/backend behavior, not exact screen names or click paths.
- Feature #27 (demo data rake task) is a developer/ops tool, not exercised through the UI a real user would use — left out of the manual TC suites for this cycle.
- Feature #25 (external identity mapping) has no consumer feature yet per the ticket ("groundwork for future cross-system sync") — covered only as a smoke/no-error check, not a functional flow.
