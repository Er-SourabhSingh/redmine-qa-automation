# Test Cases — Redmineflux Platform — Installation & Branch Upgrade

> Source: `docs/PLATFORM_REQUIREMENTS.md` Business Workflows (Fresh install / Upgrade), Known Constraints; `docs/PLATFORM_FEATURES_LIST.md` #2–4, #15, #24.
>
> **Precondition for this entire suite:** `PLATFORM_OLD_ARCHITECTURE_BASELINE.md` (TC-PLT-001–010) must be PASS and its fixture data must exist before TC-PLT-021 onward runs — those TCs perform the actual branch switch that the migration-integrity suite depends on. Do not run the upgrade before the baseline fixtures are created, or there will be nothing to verify survival of.

## Plugin
- Name: redmineflux_platform
- Version: `redmineflux_platform` branch, HEAD (2026-09-25 per ticket #120043)
- Redmine version: 6 (`redmine-docker-6-platform`, `localhost:3013`)
- Path: plugins/redmineflux_platform_qa

---

## Functional Cases — Hard Dependency Enforcement

---

### TC-PLT-011: Consumer plugin on `redmineflux_platform` branch refuses to boot without the platform plugin

**User Role:** Admin / server operator.
**Precondition:** At least one consumer plugin (e.g. `redmineflux_crm`) switched to the `redmineflux_platform` branch, but `redmineflux_platform` plugin itself NOT yet added.

**Steps:**
1. In `C:\redmineflux palform\plugins\redmineflux_crm`, `git checkout redmineflux_platform` (or fetch/checkout the branch).
2. Restart the container.
3. Check container logs and try loading the app.

**Expected Result:**
- Per the ticket: the app fails to boot (or the plugin fails to load) with a **clear, actionable error message** stating that `redmineflux_platform` is required and missing — not a generic Ruby exception/stack trace with no explanation.
- This confirms the ticket's claim that the dependency check is deferred to `after_initialize` specifically to work around Redmine's alphabetical plugin-load-order problem (CRM would otherwise resolve before the platform and wrongly raise `PluginNotFound` even when the platform IS installed, if a naive `requires_redmine_plugin` were used).

---

### TC-PLT-012: All 6 consumer plugins together, still no platform plugin — same clear failure

**User Role:** Admin.
**Precondition:** All 6 consumer plugins switched to `redmineflux_platform` branch; platform plugin still not present.

**Steps:**
1. Switch all remaining 5 consumer plugins to `redmineflux_platform` branch.
2. Restart container, check logs.

**Expected Result:**
- Same clear, actionable failure message as TC-PLT-011, and it does not depend on which single plugin happens to load first alphabetically (`redmineflux_crm` genuinely does resolve before a plugin named `redmineflux_platform` alphabetically — this is the exact scenario the ticket says would break with a naive `requires_redmine_plugin` check).

---

## Functional Cases — Fresh Install (control group)

---

### TC-PLT-013: Platform plugin + all 6 consumer plugins install cleanly together on a CLEAN instance

**User Role:** Admin.
**Precondition:** A separate clean Redmine 6 instance (or a clean DB on this one) with zero prior data — this is the "fresh install" control group the ticket compares against the "upgrade" path. If a second clean environment isn't available, note this TC as BLOCKED and rely on TC-PLT-014's schema comparison instead.

**Steps:**
1. Clone `redmineflux_platform` (its own primary branch) plus all 6 consumer plugins at `redmineflux_platform` branch into a clean instance's plugins folder.
2. Restart, run `rake redmine:plugins:migrate`.
3. Check Administration → Plugins and container logs.

**Expected Result:**
- All 7 plugins load without error, migrations run cleanly, no duplicate-table-creation attempts from any consumer plugin (per requirements: 33 duplicate migrations were removed from consumer plugins — the platform's 31 migrations are the only ones creating shared tables).

---

### TC-PLT-014: Fresh-install schema matches expected shared-table structure

**User Role:** Admin / DB access.
**Precondition:** TC-PLT-013 PASS (or the upgraded instance from TC-PLT-021, if no separate clean instance exists).

**Steps:**
1. Inspect the database: confirm `rf_organizations`, and the platform's tables for Contact, Team, Team Membership, Holiday, Holiday Scheme, Leave, Leave Type, Audit Event (`rf_audit_events`), User Preference all exist.
2. Confirm the 8 named old duplicate tables do NOT exist: `rf_crm_companies`, `rf_helpdesk_holidays`, `rf_holidays_management`, `rf_holiday_schemas`, `rf_audit_logs`, `rf_leave_applications`, `timesheet_audit_logs`, `customers`.

**Expected Result:**
- Shared tables present exactly once each; old duplicate tables absent entirely on a fresh install.

---

## Functional Cases — Branch Upgrade (the primary scenario this cycle exists to test)

---

### TC-PLT-020: Add the `redmineflux_platform` plugin to the existing instance (still has master-branch consumer plugins + baseline data)

**User Role:** Admin.
**Precondition:** `PLATFORM_OLD_ARCHITECTURE_BASELINE.md` complete (TC-PLT-001–010 PASS, fixture data exists). Consumer plugins still on `master`.

**Steps:**
1. Clone `redmineflux_platform` plugin itself into `C:\redmineflux palform\plugins\redmineflux_platform`.
2. Restart the container WITHOUT yet switching any consumer plugin's branch.
3. Check logs.

**Expected Result:**
- Per the requirements, consumer plugins at `master` presumably predate the hard-dependency check entirely (that check only exists on the `redmineflux_platform` branch of each consumer plugin) — so this step should NOT break anything; the platform plugin loads alongside the still-independent master-branch consumer plugins with no interaction yet. If this assumption is wrong (i.e. the platform plugin's mere presence changes master-branch consumer plugin behavior), that is itself a notable finding — document actual behavior here.

- **EXECUTED DIFFERENTLY LIVE 2026-09-29** — the platform plugin was cloned and all 6 consumer plugins were switched to `redmineflux_platform` together in one pass (not staged platform-first per this TC's original steps), so this TC and TC-PLT-021 were effectively executed as one combined step. See TC-PLT-021 below for the full result — **FAILED**.

---

### TC-PLT-021: Switch all 6 consumer plugins to `redmineflux_platform` branch (the actual upgrade)

**User Role:** Admin.
**Precondition:** TC-PLT-020 PASS. Baseline fixture data from `PLATFORM_OLD_ARCHITECTURE_BASELINE.md` still intact and NOT touched since creation.

**Steps:**
1. In each of the 6 consumer plugin folders under `C:\redmineflux palform\plugins`, `git checkout redmineflux_platform` (or fetch + checkout).
2. Restart the container (`docker compose restart redmine`) to `bundle install` the new branch's dependencies.
3. Run `rake redmine:plugins:migrate RAILS_ENV=production` for all 7 plugins.
4. Watch migration output closely for errors, warnings, or any message about the duplicate-table-drop guard (TC-PLT-022) refusing a drop.
5. Check Administration → Plugins and container logs for boot errors.

**Expected Result:**
- All 7 plugins load without error.
- Migrations complete without error — including the 8 old duplicate-table drops.
- No data-loss warnings in migration output (or if there are any, they are legitimate — cross-check against `PLATFORM_DATA_MIGRATION_INTEGRITY.md` immediately).
- This is the single most important TC in this suite — a clean pass here is the precondition for every TC in `PLATFORM_DATA_MIGRATION_INTEGRITY.md` and `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md`.

- **CONFIRMED LIVE 2026-09-29** (Local, `redmine-docker-6-platform` localhost:3013, admin): **FAILED — two blocking bugs found, both filed.**
  - Precondition confirmed: all 7 plugin folders (`redmineflux_platform` + 6 consumer plugins) verified on `redmineflux_platform` branch via `git rev-parse --abbrev-ref HEAD`, clean working trees, before touching anything.
  - Step 2 (restart to bundle install): completed cleanly — "Bundle complete! 73 Gemfile dependencies, 126 gems now installed", no missing-gem errors.
  - Step 3 (`rake redmine:plugins:migrate RAILS_ENV=production`): **aborted** at the platform plugin's own migration `004_create_rf_organizations.rb` — `Mysql2::Error: Key column 'is_private' doesn't exist in table`, "all later migrations canceled" per Rails' own message. Reran the identical command a second time — failed at the identical line, 100% reproducible. Filed as **`BUG-PLT-003`** (High) — full root cause (migration-ordering bug: `add_index :is_private`/`:email` runs before the upgrade-only column top-up in migration 010 adds them) in the bug file.
  - Step 5 (container logs for boot errors): after the container was restarted (as part of retrying the migration), Puma **never finished booting at all** — every request to `localhost:3013` connection-refused. Logs show a repeating crash: `NameError: uninitialized constant RedminefluxPlatform::WillPaginate` in `pagination_renderer.rb`, triggered by Zeitwerk eager-loading in `RAILS_ENV=production` bypassing `init.rb`'s own `if defined?(WillPaginate::ActionView::LinkRenderer)` guard. Filed as **`BUG-PLT-004`** (Critical) — this is a second, independent defect from BUG-PLT-003, not a consequence of the half-migrated DB; it reproduces on plain boot regardless of migration state.
  - **Net result: the upgrade path is completely blocked by two separate, unrelated defects before any schema-integrity or data-survival check could even be attempted.** `PLATFORM_DATA_MIGRATION_INTEGRITY.md` and `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` cannot proceed until both are fixed — this TC's own note that "a clean pass here is the precondition" for those suites is now the actual blocker.
  - No data loss from BUG-PLT-003's partial migration: `rf_organizations` still holds its 1 pre-existing row untouched. The environment is currently left in this half-migrated, non-booting state pending a decision on how to proceed (dev fix, or a QA-side workaround to unblock further testing).

- **RETESTED 2026-09-29 (after 4 dev fix rounds) — PASS.** Both `BUG-PLT-003` and `BUG-PLT-004` went through further fix/retest rounds (see `bugs/closed/BUG-PLT-003.md` and `bugs/closed/BUG-PLT-004.md` for the full history — 3 rounds and 2 rounds respectively before each genuinely resolved), and a third bug (`BUG-PLT-005`, migration 019 crashing on MySQL's `execute(...).cmd_tuples`) was found immediately downstream once 003/004 cleared, also now fixed and closed (`bugs/closed/BUG-PLT-005.md`). With all three fixed (commit `5db0312`, `redmineflux_platform` branch), reran steps 2–5 in full on this same environment (no DB reset at any point across the whole investigation):
  - Step 2 (restart): completed cleanly.
  - Step 3 (`rake redmine:plugins:migrate RAILS_ENV=production`): **exit code 0**, migration chain completed through migration 38 (the last one) with zero errors.
  - Step 4 (duplicate-table-drop guard, migration 34): ran cleanly — `rf_holidays_management`, `rf_holiday_schemas`, `rf_audit_logs` all dropped, each explicitly confirmed "all present" in its replacement table first (no data-loss warning, and this one was legitimate — a real, guarded drop).
  - Step 5 (boot errors): none. Confirmed live via an authenticated Playwright session — `GET /redmineflux_platform` (previously 500ing due to `BUG-PLT-005`'s downstream effect) now loads correctly.
  - Schema spot-checks: `rf_organizations.active`/`is_private` both `NOT NULL` with correct defaults; `rf_leave_types.code` present.
  - **This TC now PASSes.** It took 3 bugs and roughly 5-6 fix/retest cycles total across the session, but the primary scenario this entire QA cycle exists to verify now genuinely works end to end on a MySQL-backed environment with real pre-upgrade data. Data-loss/integrity claims themselves are NOT yet verified in detail — that's `PLATFORM_DATA_MIGRATION_INTEGRITY.md`'s job, next.

---

### TC-PLT-022: Duplicate-table-drop guard behavior (if reproducible)

**User Role:** Admin / DB access.
**Precondition:** Understanding of the migration guard described in the requirements ("Each drop is guarded: it refuses while any row is unaccounted for in the replacement").

**Steps:**
1. If feasible without corrupting the main upgrade test environment, on a throwaway copy of the DB: manually insert a row into one of the 8 old duplicate tables AFTER the platform's merge migration has already run for that entity, simulating an "unaccounted for" row.
2. Re-run migrations (or the specific drop migration) and observe behavior.

**Expected Result:**
- The migration refuses to drop the table and surfaces a clear error identifying the unaccounted-for row(s), rather than silently dropping data or crashing uninformatively.
- **BLOCKED note:** if a throwaway DB copy isn't practical this cycle, mark BLOCKED and rely on the clean TC-PLT-021 run as indirect evidence the guard works correctly in the common case (zero unaccounted rows).

---

### TC-PLT-023: 42 pages across all six plugins render with 0 server errors (spot-check)

**User Role:** Admin (repeat with at least one non-admin role per plugin if time allows).
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Visit every top-level list/index and every create/edit form for each of the 6 consumer plugins' consolidated-entity screens (Organizations, Contacts/Customers, Teams, Holidays, Leaves, Leave Types, Audit log views) plus each plugin's own non-consolidated screens.
2. Note any 500 error, stack trace, or blank page.

**Expected Result:**
- No server errors on any visited page. This is a spot-check against the ticket's own claim of "42 pages... 0 server errors" — the actual page count/list may differ once the real UI is explored; update this TC with the concrete page list once known.

---

### TC-PLT-024: Outbox dispatcher processes events without manual intervention

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS. An action exists that writes to `rf_outbox_events` (need to identify one from real plugin behavior — the ticket doesn't specify which user actions enqueue outbox events).

**Steps:**
1. Perform an action expected to create an outbox event.
2. Without running the rake task manually, check whether the event is dispatched automatically (per the `after_create_commit` auto-enqueue described in requirements).
3. Separately, run `rake redmineflux_platform:outbox:dispatch_pending` and confirm it re-enqueues anything genuinely stuck, with no error.

**Expected Result:**
- Events dispatch automatically without manual rake intervention in the normal case; the rake task is a safety net only, and running it is a no-op (or a clean catch-up) when nothing is stuck.

---

## Evidence Map

- Case ID: TC-PLT-011 … TC-PLT-024
- Screenshot: (bugs only)
- Log: container logs at each restart/migration step, saved under `logs/`
- Bug reference: —
