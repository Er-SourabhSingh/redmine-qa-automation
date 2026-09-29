# Bug Report Template

- Bug ID: BUG-PLT-003
- Production Redmine Issue ID: #121479
- Title: Upgrade migration `004_create_rf_organizations.rb` crashes and cancels all later migrations when Helpdesk's pre-existing `rf_organizations` table already exists
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_platform
- Plugin version: `redmineflux_platform` branch, commit `8d739ea` ("Add a tester's guide", 2026-09-28)
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance)
- Browser: N/A — server-side migration failure, not a UI defect
- User role: Admin / server operator (running `rake redmine:plugins:migrate`)
- Date: 2026-09-29

## Steps to reproduce

1. Start from an instance with the 6 consumer plugins (CRM, Helpdesk, Invoice, Timesheet, Workload, Shift Management) installed at `master` (pre-consolidation), with at least one Helpdesk Organization already created (so `rf_organizations` already exists with the old Helpdesk schema — no `is_private`, `email`, `industry`, `tags`, `assigned_to_id`, `project_id`, `updated_by` columns). This repo's `PLT-BASELINE-Acme Corp` Organization (Helpdesk side, `/rf_organizations/1`) is exactly this precondition — see `PLATFORM_OLD_ARCHITECTURE_BASELINE.md` TC-PLT-003.
2. Switch all 6 consumer plugins plus the new `redmineflux_platform` plugin to the `redmineflux_platform` branch (the upgrade scenario per `docs/PLATFORM_REQUIREMENTS.md` §Business Workflows → Upgrade).
3. Restart the container to `bundle install` the new branch's dependencies.
4. Run `docker exec redmine-docker-6-platform-redmine-1 bundle exec rake redmine:plugins:migrate RAILS_ENV=production`.

## Expected result

- Per the ticket's own verification claim (`docs/PLATFORM_REQUIREMENTS.md`, "Upgrade" workflow), a fresh install and an upgrade must produce an identical schema (232 items compared, zero differences claimed) with no data loss. All 6 consumer plugins' + the platform plugin's migrations should complete cleanly, top up the pre-existing `rf_organizations` table with the platform's new columns, and preserve the existing row(s).

## Actual result

- The migration run aborts partway through with:
  ```
  rake aborted!
  StandardError: An error has occurred, all later migrations canceled: (StandardError)
  Mysql2::Error: Key column 'is_private' doesn't exist in table
  ...
  == 4 CreateRfOrganizations: migrating =========================================
  -- create_table(:rf_organizations, {if_not_exists: true})
     -> 0.0072s
  -- add_index(:rf_organizations, :name, {if_not_exists: true, name: "index_rf_organizations_on_name"})
     -> 0.0020s
  -- add_index(:rf_organizations, :active, {if_not_exists: true, name: "index_rf_organizations_on_active"})
     -> 0.0015s
  -- add_index(:rf_organizations, :is_private, {if_not_exists: true, name: "index_rf_organizations_on_is_private"})
  rake aborted!
  ...
  Caused by:
  Mysql2::Error: Key column 'is_private' doesn't exist in table (Mysql2::Error)
  .../redmineflux_platform/db/migrate/004_create_rf_organizations.rb:34:in 'CreateRfOrganizations#change'
  ```
- **Every migration after #4 is canceled** — not just the platform plugin's own remaining migrations (005–031: Contacts, Holidays, Audit consolidation, the CRM-company data merge, the 8 duplicate-table drops, etc.), but this is the single rake invocation that was also meant to migrate the other 5 consumer plugins in the same run. The upgrade cannot complete at all; it is 100% reproducible (reran the exact same command a second time — identical failure at the identical line).
- No data was lost by this failure itself (`rf_organizations` still has its 1 pre-existing row, schema untouched — confirmed via `DESCRIBE rf_organizations` and `SELECT COUNT(*)`), but the instance is left in a permanently half-migrated state with no way to proceed via the documented upgrade path.

### Root cause (confirmed from source, not just from the log)

`db/migrate/004_create_rf_organizations.rb`:
```ruby
create_table :rf_organizations, if_not_exists: true do |t|
  ...
  t.boolean :is_private, null: false, default: false
  ...
end

add_index :rf_organizations, :is_private, if_not_exists: true   # line 34 — crashes here
add_index :rf_organizations, :email, if_not_exists: true         # would crash here too, same reason
```
Because `rf_organizations` already exists (created by Helpdesk's pre-consolidation `master` migration), `create_table ... if_not_exists: true` is a silent no-op — none of the new columns declared inside that block get added to the existing table. Those columns are only meant to arrive later, via `010_add_platform_columns_to_existing_tables.rb`'s `COLUMNS`/`DEFAULTS` hashes (which explicitly lists `rf_organizations: { email: :string, industry: :string, ... }` and `{ rf_organizations: is_private } => false` as an upgrade-only column top-up). Migration 004's unconditional `add_index` on `is_private`/`email` runs *before* 010 has a chance to add them, so it crashes on a column that doesn't exist yet.

This exact failure mode is already known to, and was already fixed for, three sibling migrations: `005_create_rf_contacts.rb`, `006_create_rf_holiday_schemes.rb`, and `007_create_rf_holidays.rb` each define a private `index_column(table, column, **opts)` guard that checks `column_exists?`/`index_exists?` before calling `add_index`, with this exact comment in 005:

> "On an upgrade the table already exists, so `create_table ... if_not_exists` above did nothing and the columns this migration introduces are still missing — they arrive in migration 010/016 — so indexing them here aborted the whole run with `PG::UndefinedColumn`. Migration 020 is the top-up that adds these indexes once the columns are present."

Migration `020_add_shared_indexes.rb` is indeed that deferred top-up for the other tables, but its own `INDEXES` hash for `rf_organizations` only lists `%i[created_by updated_by source_crm_company_id]` — it is missing `is_private`, `email`, and `active`, so even fixing migration 004 to defer would still need 020's list corrected to match.

**In short: migration 004 (Organizations) never received the same upgrade-safety treatment that 005/006/007 (Contacts/Holidays) already got, despite 010 and 020 both being clearly designed with the Organizations-upgrade case in mind.**

## Evidence

### Screenshot

N/A — this is a server-side migration/rake failure with no UI to capture. See the terminal log transcript below and the source excerpts above, which are the actual reproduction evidence.

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-003/retest-yyyy-mm-dd-pass.png)

### Console / log

```
rake aborted!
StandardError: An error has occurred, all later migrations canceled: (StandardError)

Mysql2::Error: Key column 'is_private' doesn't exist in table
/usr/local/bundle/gems/activerecord-7.2.3.1/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:460:in 'ActiveRecord::ConnectionAdapters::AbstractMysqlAdapter#add_index'
/usr/src/redmine/plugins/redmineflux_platform/db/migrate/004_create_rf_organizations.rb:34:in 'CreateRfOrganizations#change'
...
Caused by:
Mysql2::Error: Key column 'is_private' doesn't exist in table (Mysql2::Error)
...
Tasks: TOP => redmine:plugins:migrate

I, [...] INFO -- : Migrating to CreateRfOrganizations (4)
== 4 CreateRfOrganizations: migrating =========================================
-- create_table(:rf_organizations, {if_not_exists: true})
   -> 0.0072s
-- add_index(:rf_organizations, :name, {if_not_exists: true, name: "index_rf_organizations_on_name"})
   -> 0.0020s
-- add_index(:rf_organizations, :active, {if_not_exists: true, name: "index_rf_organizations_on_active"})
   -> 0.0015s
-- add_index(:rf_organizations, :is_private, {if_not_exists: true, name: "index_rf_organizations_on_is_private"})
```

`DESCRIBE rf_organizations` immediately after the failure (confirming the pre-existing Helpdesk schema, no `is_private`/`email`/`industry`/`tags`/`assigned_to_id`/`project_id`/`updated_by`):
```
Field                Type          Null  Key  Default  Extra
id                   bigint        NO    PRI  NULL     auto_increment
name                 varchar(255)  NO    MUL  NULL
website              varchar(255)  YES        NULL
phone_number         varchar(255)  YES        NULL
address              text          YES        NULL
number_of_employees  int           YES        NULL
notes                text          YES        NULL
billing_info         text          YES        NULL
created_by           int           YES   MUL  NULL
active               tinyint(1)    YES   MUL  1
created_at           datetime(6)   NO         NULL
updated_at           datetime(6)   NO         NULL
updated_by           int           YES   MUL  NULL
```
`SELECT COUNT(*), MAX(id) FROM rf_organizations` → `1, 1` (the pre-existing `PLT-BASELINE-Acme Corp` row, confirmed intact, not lost).

Reran the identical `rake redmine:plugins:migrate` command a second time — failed at the exact same line, confirming 100% reproducibility (not a transient/timing issue).

## Retest — 2026-09-29 — NOT FIXED, reopened (production #121479 → Reopen)

Dev journal (Prashant Chaurasia, commit `133ebf5` on `redmineflux_platform`) said: migration `004` now uses the same `index_column` guard as 005/006/007, and migration `020`'s deferred-index list for `rf_organizations` was completed to include `is_private`/`email`. Asked to "retest the branch-upgrade path against a Helpdesk instance with a pre-existing Organization, per the original repro steps."

**Followed exactly**: no branch change needed (already on `redmineflux_platform`) — `git pull` in `plugins/redmineflux_platform` to bring in `133ebf5`, confirmed via `git log` the fix commit landed and matches the journal's description (read `004_create_rf_organizations.rb` and `020_add_shared_indexes.rb` directly). Restarted the container, re-ran `rake redmine:plugins:migrate RAILS_ENV=production` — the exact original repro step.

**Result: migration 004 no longer crashes** (confirmed — the `index_column` guard works). **But the run still aborts, now at migration `011_data_merge_crm_companies.rb`:**
```
ActiveModel::UnknownAttributeError: unknown attribute 'is_private' for DataMergeCrmCompanies::Organization.
db/migrate/011_data_merge_crm_companies.rb:66:in 'block in DataMergeCrmCompanies#up'
```
Root cause: migration `010_add_platform_columns_to_existing_tables.rb`'s `COLUMNS` hash for `rf_organizations` never actually lists `is_private` as a key — only the separate `DEFAULTS` hash has an entry for it (`%i[rf_organizations is_private] => false`). Since `up` only iterates `COLUMNS` and looks up `DEFAULTS` per iterated column, that `DEFAULTS` entry is dead code — `is_private` is never actually added to a pre-existing `rf_organizations` table. Confirmed live via `DESCRIBE rf_organizations` immediately after the full migration attempt — still no `is_private` column. Migration 011 then unconditionally writes `attrs[:is_private]`, and crashes.

**Same underlying defect as originally reported** (a pre-existing `rf_organizations` table never receives `is_private` on upgrade) — the fix patched the symptom where it was first caught (migration 004's index) but not the actual missing-column bug, which now surfaces one migration later. The dev's own "415 runs, 0 failures" regression claim almost certainly still only covers a fresh install, where `rf_organizations` never pre-exists and gets `is_private` from migration 004's own `create_table` block.

**Reopened on production** (`#121479` → status `Reopen`) with this evidence and a note asking the dev to add `is_private` (and confirm `active`) as keys in migration 010's `COLUMNS` hash, not just `DEFAULTS`.

## Retest 2 — 2026-09-29 — STILL NOT FIXED on this environment, reopened again (production #121479 → Reopen) — nuanced finding

Dev journal (Prashant Chaurasia, commit `4fb3f22` on top of `133ebf5`) said: migration `010`'s `COLUMNS` hash for `rf_organizations` now includes `is_private` and `active` as keys, so the existing `DEFAULTS` entries take effect. Verified via a rolled-back transaction against a simulated pre-existing table. Asked to "retest the full upgrade path end to end (migrations 004 through at least 011)."

**Followed exactly**: `git pull` (no branch change, no code edits) to bring in `4fb3f22`. Read `010_add_platform_columns_to_existing_tables.rb` directly — confirmed `is_private: :boolean, active: :boolean` are now genuinely present as `COLUMNS` keys for `rf_organizations`, matching the journal exactly. Restarted the container, re-ran `rake redmine:plugins:migrate RAILS_ENV=production` — the full end-to-end path requested.

**Result: still fails at migration 011**, same symptom (`NoMethodError: undefined method 'is_private='`). But this time the cause is different and more precise:
```
mysql> SELECT version FROM schema_migrations WHERE version LIKE '%redmineflux_platform%';
...
10-redmineflux_platform   <- already recorded as applied
```
Migration `010` was already recorded as applied in `schema_migrations` from the *previous* retest of `133ebf5` — at that point its old `COLUMNS` hash ran to completion without erroring (it simply skipped `is_private`/`active`, since neither was a key yet). Redmine's plugin migrator tracks migrations by version number, not by file content, so re-running the migrate task now **skips migration 010 entirely** — its corrected `COLUMNS` hash never actually executes on this environment. `DESCRIBE rf_organizations` confirms `is_private` is still absent.

**This is not merely a QA-environment retry artifact.** It strongly suggests the column-adding logic itself is now correct in isolation — but the fix as shipped has no repair path for any instance (this QA environment, or a real customer) that already attempted this exact upgrade once with an earlier broken plugin build and got partway through migration 010 before hitting the original failure. Recorded-but-incomplete migrations don't self-heal from a later content fix.

**Reopened again on production** (`#121479` → status `Reopen`) with this refined finding — suggested a new, separately-numbered, `if_not_exists`-guarded migration to backfill `is_private`/`active` on `rf_organizations`, rather than relying solely on edits to migration 010's content, so already-touched instances get the missing columns on their next migrate run too.

## Retest 3 — 2026-09-29 — CONFIRMED FIXED at its own root, closed (production #121479 → Done, 100%)

Dev journal (Prashant Chaurasia, commit `01b987b` on top of `4fb3f22`/`133ebf5`) said: migration 011 itself now does its own `if_not_exists`-guarded `add_column` for both `is_private` and `active`, directly in its `up`, independent of whatever migration 010 did or didn't do on a given install — reasoning that 011 can never have been recorded as already-applied on any install that hit this bug (it always aborted before completing), making it the one safe, durable place to fix this from. Dev also audited every other migration in the plugin for the same shape of defect and found no other live gaps. Asked to retest on a completely fresh copy of the database if possible, noting that an already-touched database might still need a one-time manual backfill since no migration content change can make an already-applied version re-run.

**Followed exactly**: `git pull` (no branch change, no code edits) to bring in `01b987b`. Read `011_data_merge_crm_companies.rb` directly — confirmed both `add_column` calls for `is_private`/`active` are now present in `up`, with `if_not_exists: true`, exactly as described. Restarted the container, re-ran `rake redmine:plugins:migrate RAILS_ENV=production` on this same (already-touched) database — did not reset it, since the fix should be self-sufficient regardless of migration 010's prior state.

**Result: migration 011 now completes cleanly**, on the first try, on this exact already-touched environment:
```
== 11 DataMergeCrmCompanies: migrating ========================================
-- add_column(:rf_organizations, :is_private, :boolean, {default: false, null: false, if_not_exists: true})
-- add_column(:rf_organizations, :active, :boolean, {default: true, null: false, if_not_exists: true})
-- company #1 -> organization #2
-- remapped references 1 -> 2
== 11 DataMergeCrmCompanies: migrated (0.3975s)
```
The dev's reasoning held up exactly — no manual DB repair was needed, confirming migration 011 genuinely doesn't depend on migration 010's recorded state anymore. **This confirms the original BUG-PLT-003 defect (a pre-existing `rf_organizations` table never receiving `is_private` on upgrade) is resolved.**

**New, different blocker found further down the same migration run**, at migration `019_align_organizations_active_not_null.rb`:
```
NoMethodError: undefined method 'cmd_tuples' for nil
filled = execute('UPDATE rf_organizations SET active = TRUE WHERE active IS NULL').cmd_tuples
```
`cmd_tuples` is PostgreSQL-specific (`PG::Result#cmd_tuples`); this environment runs MySQL (`mysql2` adapter), where `execute()` on an `UPDATE` returns `nil`, so `.cmd_tuples` raises. This is a different migration, a different root cause (DB-adapter portability, not the `is_private`/schema-tracking issue this bug was about) — filed separately as `BUG-PLT-005` rather than folded into this one.

**Downstream symptom also observed live**: `GET /redmineflux_platform` (the platform's own Overview page) 500s with `NoMethodError: undefined method 'code' for an instance of RedminefluxPlatform::LeaveType` — `LeaveType#code` is added by migration `024`, which never ran because migration `019` blocks everything after it. This is not a separate bug — it's the expected consequence of `BUG-PLT-005` still blocking the migration chain; noted in that bug file instead.

**Closed this bug on production** (`#121479` → status `Done`, 100%). Local file moved to `bugs/closed/`.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —
