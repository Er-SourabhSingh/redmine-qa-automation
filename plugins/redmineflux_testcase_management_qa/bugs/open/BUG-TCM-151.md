# Bug Report Template

- Bug ID: BUG-TCM-151
- Production Redmine Issue ID: #128835 (assigned to Vaishnavi Bhawsar, Priority: Blocker)
- Title: Plugin fails to install on SQLite — migration 20261015000000 crashes with "no foreign key for column" even though the FK genuinely exists
- Redmine version: 6.0 (official `redmine:6.0-bookworm` Docker image)
- Plugin name: redmineflux_testcase_management
- Plugin version: master (commit `dcf15c1`, same commit BUG-TCM-148/149/150 were fixed on)
- Environment: Fresh Docker container, SQLite3 adapter (official image's zero-config fallback — no `REDMINE_DB_MYSQL`/`REDMINE_DB_POSTGRES` set), Redis, no other plugins besides this one
- Browser: N/A (install-time crash, before any UI loads)
- User role: N/A (container boot, `rake redmine:plugins:migrate`)
- Date: 2026-11-17

## Steps to reproduce

1. Boot a fresh Redmine 6 + this plugin stack with no `REDMINE_DB_MYSQL`/`REDMINE_DB_POSTGRES`/`REDMINE_DB_SQLSERVER` env vars set — the official Redmine Docker entrypoint falls back to SQLite3 automatically (`sqlite/redmine.db`).
2. Let the entrypoint run its normal `rake db:migrate` + `rake redmine:plugins:migrate` on first boot (`REDMINE_PLUGINS_MIGRATE=true`).
3. Observe the container crash-loop.

## Expected result

- All plugin migrations run cleanly on SQLite, exactly as they do on PostgreSQL and MySQL (both already confirmed working this cycle). The container reaches a healthy state and serves `/login`.

## Actual result

- Migration `db/migrate/20261015000000_nullify_testcase_reports_user_fks_on_delete.rb` (the fix for BUG-TCM-064) crashes:

```
ArgumentError: Table 'testcase_reports' has no foreign key for {:column=>:created_by_id} (ArgumentError)
.../schema_statements.rb:80:in `remove_foreign_key'
.../20261015000000_nullify_testcase_reports_user_fks_on_delete.rb:11:in `up'
```

  This happens on the very first `remove_foreign_key :testcase_reports, column: :created_by_id` call (line 11 of the migration). The container never boots; `rails server` never starts, so `docker-entrypoint.sh`'s healthcheck fails and it keeps restarting in a crash loop forever — **this blocks a fresh SQLite install of the plugin entirely**, not just this one migration's intent.

- **Confirmed the FK genuinely exists** — this is not a case of the FK being legitimately missing. Queried the actual SQLite file directly via the `sqlite3` gem (bypassing ActiveRecord):

  ```
  PRAGMA foreign_key_list(testcase_reports)
  => [0, 0, "users", "created_by_id", "id", "NO ACTION", "NO ACTION", "NONE"]
  => [1, 0, "users", "updated_by_id", "id", "NO ACTION", "NO ACTION", "NONE"]

  CREATE TABLE "testcase_reports" (... "created_by_id" integer, "updated_by_id" integer, ...
    CONSTRAINT "fk_rails_f8de6d2f5b" FOREIGN KEY ("updated_by_id") REFERENCES "users" ("id"),
    CONSTRAINT "fk_rails_0a2505e2a2" FOREIGN KEY ("created_by_id") REFERENCES "users" ("id")
  )
  ```

  Both FKs were created correctly by the original `20240801095459_create_testcase_reports.rb` migration's `t.references :created_by, foreign_key: { to_table: :users }`. So the FK is real and present in the schema — ActiveRecord's own `remove_foreign_key(:testcase_reports, column: :created_by_id)` call on the SQLite3 adapter simply fails to find/match it, even though the identical PostgreSQL and MySQL migrations (confirmed working this cycle) handle this exact same call without issue.

## Root cause (for the developer)

- This is an **ActiveRecord SQLite3-adapter quirk specific to `remove_foreign_key` called with only `column:` and no explicit `to_table`** — PostgreSQL/MySQL adapters resolve the FK from `column:` alone; SQLite3's adapter apparently does not reliably match it the same way in Rails 7.2 (gem `activerecord-7.2.3.2`, as pinned by this plugin's Gemfile/the official `redmine:6.0-bookworm` image).
- Likely fix: pass `to_table` explicitly, e.g. `remove_foreign_key :testcase_reports, :users, column: :created_by_id` (and the same for `updated_by_id`) in both `up` and `down` of `20261015000000_nullify_testcase_reports_user_fks_on_delete.rb`. This is the Rails-recommended disambiguated form and should resolve on all three adapters without changing behavior on Postgres/MySQL.
- This migration is the one and only thing blocking SQLite from being a viable install target for this plugin — everything else in the stack (Redis, Sidekiq, Mailpit, the base Redmine image) came up fine; only this migration crashes.

## Impact

- **Severity: Critical (install blocker)** — a brand-new customer/test instance running SQLite (Redmine's own zero-config default when no DB env vars are set) cannot install this plugin at all. The container never reaches a healthy state.
- Blocks the SQLite leg of this cycle's happy-flow cross-DB regression pass entirely until fixed — PostgreSQL and MySQL passes are unaffected (different adapters, already confirmed clean on this exact migration).

## Evidence

### Console / log

```
I, [...] INFO -- : Migrating to NullifyTestcaseReportsUserFksOnDelete (20261015000000)
== 20261015000000 NullifyTestcaseReportsUserFksOnDelete: migrating ============
-- remove_foreign_key(:testcase_reports, {:column=>:created_by_id})
ArgumentError: Table 'testcase_reports' has no foreign key for {:column=>:created_by_id} (ArgumentError)
```

Direct schema inspection (bypassing ActiveRecord, via the `sqlite3` gem) proving the FK is physically present:
```
PRAGMA foreign_key_list(testcase_reports) =>
[0, 0, "users", "created_by_id", "id", "NO ACTION", "NO ACTION", "NONE"]
[1, 0, "users", "updated_by_id", "id", "NO ACTION", "NO ACTION", "NONE"]
```

## Found via

- Found while provisioning a fresh SQLite-backed Redmine 6 instance (`redmine6-happyflow-sqlite`, Docker, port 3021) for this cycle's SQLite leg of the happy-flow cross-DB regression suite (`TESTCASE_MANAGEMENT_HAPPY_FLOW_CROSS_DB.md`) — not found via an automated Playwright spec (the suite never got far enough to run any; this is an install-time crash).
