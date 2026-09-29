# Bug Report Template

- Bug ID: BUG-PLT-005
- Production Redmine Issue ID: <!-- filled after report_defect is approved and executed -->
- Title: Migration `019_align_organizations_active_not_null.rb` crashes on MySQL — `execute(...).cmd_tuples` is PostgreSQL-only, blocks every migration after it
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_platform
- Plugin version: `redmineflux_platform` branch, commit `01b987b` ("Fix BUG-PLT-003 at the migration that can never be already-applied", on top of `4fb3f22`/`133ebf5`)
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance, `mysql:8` database — confirmed via `docker-compose.yml`)
- Browser: N/A for the migration crash itself — server-side migration failure. A downstream UI symptom is also documented below.
- User role: Admin / server operator (running `rake redmine:plugins:migrate`)
- Date: 2026-09-29

## Steps to reproduce

1. Have any Redmine instance on the `redmineflux_platform` branch (all 6 consumer plugins + platform) backed by **MySQL**, at a point where migrations 1–18 have completed (this repo's environment, after `BUG-PLT-003`'s fix, reaches exactly this state).
2. Run `rake redmine:plugins:migrate RAILS_ENV=production`.
3. Watch the run reach migration `019_align_organizations_active_not_null`.

## Expected result

- Migration 019 backfills `rf_organizations.active` to `true` where `NULL`, then tightens the column to `NOT NULL default: true` — completing cleanly on any supported database adapter (this plugin supports both, per its own Postgres-specific branches elsewhere, e.g. migration 011's `reset_sequence`).

## Actual result

The migration run aborts:
```
rake aborted!
StandardError: An error has occurred, all later migrations canceled: (StandardError)

undefined method 'cmd_tuples' for nil
/usr/src/redmine/plugins/redmineflux_platform/db/migrate/019_align_organizations_active_not_null.rb:18:in 'AlignOrganizationsActiveNotNull#up'
...
Caused by:
NoMethodError: undefined method 'cmd_tuples' for nil (NoMethodError)

    filled = execute('UPDATE rf_organizations SET active = TRUE WHERE active IS NULL').cmd_tuples
                                                                                      ^^^^^^^^^^^
```
Every migration after 019 is canceled — the upgrade cannot proceed past this point on a MySQL-backed instance. This directly blocks `BUG-PLT-003`'s own precondition from being fully exercised end to end, since migrations 020 onward (including migration 024, which adds `LeaveType#code`) never get a chance to run.

### Root cause (confirmed from source)

```ruby
def up
  return unless table_exists?(:rf_organizations)
  return unless column_exists?(:rf_organizations, :active)

  filled = execute('UPDATE rf_organizations SET active = TRUE WHERE active IS NULL').cmd_tuples
  say "backfilled #{filled} row(s) with active = true" if filled.to_i.positive?

  change_column_null :rf_organizations, :active, false
  change_column_default :rf_organizations, :active, true
end
```
`cmd_tuples` is a method on `PG::Result` (the PostgreSQL adapter's raw result object) — it does not exist on whatever the `mysql2` adapter's `execute` returns for an `UPDATE` statement. Confirmed live: under `mysql2`, `execute('UPDATE ...')` returns `nil` for a data-modifying statement (no result set), so `.cmd_tuples` raises `NoMethodError` immediately, regardless of how many rows were actually affected.

This plugin is written to support more than one database adapter — migration `011`'s `reset_sequence` explicitly checks `connection.adapter_name.match?(/postgres/i)` before doing anything Postgres-specific, and migration `011`'s own `down` comment references "MySQL's AUTO_INCREMENT self-corrects" as the reason no MySQL-specific branch was needed there. Migration `019` is the one place that assumes a Postgres-only API unconditionally, with no MySQL branch and no portable alternative (e.g. `ActiveRecord::Result#rows.length`, or simply not needing the row count for anything beyond a log line via `say`).

### Downstream UI symptom (same root cause, not a separate bug)

With the migration chain still stuck at 019, `GET /redmineflux_platform` (the platform plugin's own Overview page) 500s:
```
[RedminefluxPlatform::OverviewController#index] ActionView::Template::Error (undefined method 'code' for an instance of RedminefluxPlatform::LeaveType):
NoMethodError (undefined method 'code' for an instance of RedminefluxPlatform::LeaveType)
```
`LeaveType#code` is added by migration `024`, which never ran because `019` blocks everything after it. Any other page touching a feature introduced by migration 20+ would show the same class of error until the chain actually completes — this is the expected consequence of the migration blocker, not an independent defect.

## Evidence

### Screenshot

N/A for the migration crash — server-side, no UI. The downstream `/redmineflux_platform` 500 also has no meaningful screenshot beyond a generic Rails error page; the log excerpt above is the actual evidence.

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-005/retest-yyyy-mm-dd-pass.png)

### Console / log

```
I, [...] INFO -- : Migrating to AlignOrganizationsActiveNotNull (19)
== 19 AlignOrganizationsActiveNotNull: migrating ==============================
-- table_exists?(:rf_organizations)
-- column_exists?(:rf_organizations, :active)
-- execute("UPDATE rf_organizations SET active = TRUE WHERE active IS NULL")
rake aborted!
StandardError: An error has occurred, all later migrations canceled: (StandardError)

undefined method 'cmd_tuples' for nil
/usr/src/redmine/plugins/redmineflux_platform/db/migrate/019_align_organizations_active_not_null.rb:18:in 'AlignOrganizationsActiveNotNull#up'
```
Downstream 500, `GET /redmineflux_platform`:
```
I, [2026-09-29T10:24:10.707674 #1]  INFO -- : [5c3deaf5-9c73-4990-8ae0-510539e51cad] Completed 500 Internal Server Error in 325ms (ActiveRecord: 42.0ms (26 queries, 0 cached) | GC: 17.4ms)
[5c3deaf5-9c73-4990-8ae0-510539e51cad] ActionView::Template::Error (undefined method 'code' for an instance of RedminefluxPlatform::LeaveType):
[5c3deaf5-9c73-4990-8ae0-510539e51cad] NoMethodError (undefined method 'code' for an instance of RedminefluxPlatform::LeaveType)
```
Reproduced identically on the first attempt reaching migration 019 (this was the first time the run got this far, since `BUG-PLT-003` blocked everything before it until its own fix landed).

## Retest — 2026-09-29 — CONFIRMED FIXED, closed (production #121512 → Done, 100%)

Dev journal (Prashant Chaurasia, commit `5db0312`, `redmineflux_platform` branch) said: audited every migration for the same `execute(...).cmd_tuples` pattern rather than patching only migration 019 — found it in 12 places across 6 files (019, 026, 027, 030, 032, 033). Replaced every occurrence with `update(sql)`, which reports the affected-row count through ActiveRecord's adapter-agnostic path instead of a Postgres-only result method. Also stood up a second, MySQL-backed Redmine instance on their end specifically to catch anything else, since their whole existing stack (including the one used for BUG-PLT-003/004's regression runs) was Postgres-only — explaining why this was never caught until it reached this MySQL environment.

**Followed exactly**: `git pull` (no branch change, no code edits) to bring in `5db0312`. Read `019_align_organizations_active_not_null.rb` directly — confirmed `update(...)` replaces `execute(...).cmd_tuples`, matching the journal. Restarted the container, re-ran `rake redmine:plugins:migrate RAILS_ENV=production` — the full remaining chain.

**Result: genuinely fixed, full chain completes.**
- Exit code `0`, migration run reached and completed migration `38` (the last one) with zero errors anywhere in the log.
- Migration 019 (and the rest of the former `cmd_tuples` call sites) completed without error.
- Migration 34's duplicate-table drops ran cleanly — `rf_holidays_management`, `rf_holiday_schemas`, `rf_audit_logs` all dropped, each confirmed "all present" in its replacement table first.
- `DESCRIBE rf_organizations` — `active`/`is_private` both `NOT NULL` with correct defaults.
- `DESCRIBE rf_leave_types` — `code` column now present (migration 024 finally ran).
- The previously-500ing `GET /redmineflux_platform` Overview page now loads correctly — confirmed live via an authenticated Playwright session (page title "Redmineflux Platform - Redmine", no error), resolving the downstream symptom documented above with no separate fix needed.

**This also means the full branch-upgrade path (TC-PLT-020/021) now completes end to end** on this MySQL-backed environment for the first time this cycle. Closed on production (`#121512` → status `Done`, 100%). Local file moved to `bugs/closed/`.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —
