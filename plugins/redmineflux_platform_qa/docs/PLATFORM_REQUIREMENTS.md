# Plugin Requirements — Redmineflux Platform

> Source: production Feature ticket **#120043** ("Redmineflux Platform Plugin: Consolidate Duplicated Tables, Models & Vocabulary Across CRM, Helpdesk, Invoice, Timesheet, Workload & Shift Management"), `ztflux` project, branch `redmineflux_platform`. No vendor KB/user guide exists yet for this plugin — it is brand new. This file will be corrected against live/source behavior as testing proceeds.

## Overview

`redmineflux_platform` is a new plugin holding functionality that was previously duplicated across six consumer plugins: **CRM, Helpdesk, Invoice, Timesheet, Workload, Shift Management**. It is the old plugin-specific architecture being replaced with a shared-ownership one: every shared entity now has exactly **one table and one model**, owned by the platform plugin. Each consumer plugin reads/writes through it and only adds its own plugin-specific extensions via patches.

All six consumer plugins have a **hard runtime dependency** on `redmineflux_platform` — they fail at boot with an actionable error message if it isn't installed (checked in `after_initialize`, not via Redmine's own `requires_redmine_plugin`, because plugin load order is alphabetical and CRM would resolve before the platform).

## Key Features

### Ten consolidated shared entities (single table + single model each)
Organization, Contact, Team, Team Membership, Holiday, Holiday Scheme, Leave, Leave Type, Audit Event, User Preference.

### Specific merges performed
- **Organization / Company merge** — CRM's "Company" and Helpdesk's "Organization" were the same record under two names → `rf_organizations`, existing IDs preserved (no FK rewrite needed).
- **Contact / Customer merge** — CRM's "Contact" and Invoice's "Customer" were the same table under two names → unified. **Helpdesk's "Customer" is explicitly NOT part of this merge** — it's a Redmine `User` with `is_helpdesk_customer`, a genuinely different entity that only shares the English word.
- **Leave consolidation** — Workload's `rf_leaves` and Shift Management's `rf_leave_applications` were two unaware, parallel leave systems (an employee could double-file leave) → merged into one table. Leave Type was a hardcoded 5-value enum in Workload and a real table in Shift Management → now one `rf_leave_types` table (a type added in one plugin's admin now appears in the other).
- **Audit consolidation** — Timesheet's `timesheet_audit_logs` + Shift Management's `rf_audit_logs` → `rf_audit_events`. Append-only immutability now enforced in exactly one place.
- **8 duplicate tables dropped**: `rf_crm_companies`, `rf_helpdesk_holidays`, `rf_holidays_management`, `rf_holiday_schemas`, `rf_audit_logs`, `rf_leave_applications`, `timesheet_audit_logs`, `customers`. Each drop is guarded — refuses while any row is unaccounted for in its replacement.
- **33 duplicate table-creation migrations** removed from consumer plugins; the platform's 31 migrations are the only place a shared table gets created.
- **Shared working-day calendar** (`WorkingCalendar`) replaces three separate weekend/holiday implementations; evaluates recurring holidays as rules (not materialized rows) — fixes cases where a recurring holiday was silently counted as a working day.
- **Consistent vocabulary** — 54 shared labels now defined exactly once, in the platform; 64 duplicate label keys removed from consumer plugins. "Company" no longer appears anywhere in CRM. Active/Inactive/Private wording identical everywhere. Fixes three plugins each redefining the global `label_active`/`label_inactive` keys (previously, whichever plugin loaded last silently won app-wide).

### Supporting infrastructure (per 2026-09-25 journal update)
- **Outbox dispatcher** — `rf_outbox_events` now has a real ActiveJob-based dispatcher (`OutboxDispatchJob`, auto-enqueues on `after_create_commit`, retries with polynomial backoff, consumer-registerable via `OutboxEvent.register_handler`). Rake task `redmineflux_platform:outbox:dispatch_pending` re-enqueues anything stuck.
- **Organization–Contact linking** — join model `rf_organization_contact_links` records a contact's role at an organization; includes a duplicate-organizations detection report.
- **External identity mapping** — generic `rf_external_identities` table for mapping a shared entity to its ID in another system (future cross-system sync groundwork).
- **CI dependency-direction rule** — automated check that consumer plugins may depend on the platform but never the reverse.
- **UX pass** — Holidays, Leave Types, Leaves, Organizations moved to dedicated create/edit pages (previously popups), matching each consumer plugin's own existing conventions. Organization form grouped into Basic Information / Business Details / Additional Details (matches CRM's Companies form). Primary action button now comes first (Create/Save before Cancel), left-aligned, across all forms.
- **Demo data rake task** — `redmineflux_platform:demo:load` / `:status` / `:clear`, tagged so it can be added/removed from an instance holding real data.

## Business Workflows

### Fresh install
Install `redmineflux_platform` + the 6 consumer plugins together on a clean Redmine instance. All plugins load, migrations create the shared tables once (in the platform), consumer plugins register no duplicate tables.

### Upgrade (the scenario this QA cycle is specifically testing)
An existing Redmine instance already has the 6 consumer plugins installed at their pre-consolidation `master` branch, with real data (organizations, contacts, teams, holidays, leaves, audit entries created independently per plugin, since at that point they don't share storage). The instance is then upgraded: consumer plugins switched to the `redmineflux_platform` branch, the platform plugin added, migrations run. Per the ticket's own verification claim, a fresh install and an upgrade must produce an **identical schema** (232 items compared: columns, defaults, nullability, indexes, foreign keys — zero differences claimed) and **no data loss**.

## Permissions Matrix

| Action | Admin | Manager | Developer | QA | Client | Non-member |
|--------|-------|---------|-----------|-----|--------|------------|

> Not yet documented anywhere — the ticket describes data-model/architecture, not a permissions model. To be filled in from live testing (Administration → Roles and permissions, once the plugin is installed) rather than assumed.

## Known Constraints

### Deliberately NOT merged (still separate entities/tables post-consolidation — verify they STAY separate)
- `project_customers` (Invoice) vs `rf_project_customers` (Helpdesk) — same-looking name, different meaning: Invoice links a project to a Contact for billing; Helpdesk links a project to a User with an SLA/support level.
- `rf_crm_activities` (CRM) — a communication log with email tracking, not an audit trail.
- Shift Management's six leave-accrual tables (balances, accrual logs, carry-forward logs, policy bands) — Workload has no equivalent, so these are not duplication and stay in Shift Management.
- Invoice's "Company" labels — describe the invoice issuer's own business details in plugin settings, not the shared Organization entity.

### Known gaps (as of the 2026-09-25 ticket update — RE-VERIFIED 2026-10-01, see below)
1. ~~`contact_type` still internally stores the value `"company"` although its label now reads "Organization" — needs a small data migration.~~ **FIXED, confirmed 2026-10-01** (`PLATFORM_KNOWN_GAPS_AND_EDGE_CASES.md` TC-PLT-091) — `db/migrate/032_data_rename_company_contact_type.rb` rewrites every stored `'company'` row to `'organization'`; zero `'company'` rows remain live. Not mentioned in any later journal update.
2. ~~**Shift Management's pre-platform holiday, scheme and audit rows have no data migration.**~~ **FIXED, confirmed 2026-10-01** (TC-PLT-090, the cycle's single most important TC) — all 3 pre-upgrade Shift Management fixtures (Holiday Scheme, Holiday, Audit entry) migrated correctly, verified via explicit source-tracking FK columns (`source_shift_schema_id`/`source_shift_holiday_id`/`source_shift_audit_log_id`) and preserved original `created_at` timestamps. Not mentioned in any later journal update.
3. 32 existing test files across the six plugins reference deleted model classes and will fail until ported — dev-side automated test debt, not manually testable via UI, out of scope for this QA cycle. (Not re-verified 2026-10-01 — out of scope, UI-untestable.)
