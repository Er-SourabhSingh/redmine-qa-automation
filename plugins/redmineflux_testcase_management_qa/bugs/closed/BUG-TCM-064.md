# BUG-TCM-064

- Bug ID: BUG-TCM-064
- Production Redmine Issue ID: #123501 (https://flux.zehntech.com/issues/123501) — assigned to Vaishnavi Bhawsar, target version Testcase Management plugin Release 7.2.0
- Title: Deleting a user who authored or last-updated a Testcase Report crashes with an unhandled 500 (foreign key violation), instead of a clean error or a successful delete
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: master (post Release 7.1.0, pre-7.2.0)
- Environment: Docker `localhost:3000` (container `redmine6-redmine-1`, Postgres, project `rftc-016-ci-qa`)
- Browser: Chromium (Playwright MCP)
- User role: Administrator
- Date: 2026-10-15

## Steps to reproduce

1. Have at least one Testcase Report in any project whose `created_by_id` (or `updated_by_id`) is a given user.
   (Confirmed directly in this repro: `testcase_reports` row `id=2`, name "dgdsfg", `report_type=testcase`,
   `project_id=1` (`bug-121896-retest`), `created_by_id=5` — a pre-existing fixture from an earlier session, not
   created as part of this reproduction.)
2. As an Administrator, go to **Administration → Users**, select that same user (id 5, login `test`), and click
   **Delete** (entering their login to confirm, as Redmine requires).
3. Observe the result.

## Expected result

- Either the delete succeeds and the report's `created_by_id`/`updated_by_id` are nullified/reassigned (same pattern core Redmine already uses for issues, time entries, etc. when a user is deleted), **or** if deletion must be blocked, the user sees a clean, specific error message (e.g. "This user cannot be deleted because they authored N testcase report(s)") — never a raw crash.

## Actual result

- The deletion raises an unhandled `ActiveRecord::InvalidForeignKey` and the request fails with **HTTP 500**, shown to the admin as a generic "Redmine 500 error" page with zero explanation of what actually went wrong or how to fix it:

```
Completed 500 Internal Server Error in 48ms (ActiveRecord: 24.7ms (49 queries, 2 cached) | GC: 0.9ms)
FATAL -- : ActiveRecord::InvalidForeignKey (PG::ForeignKeyViolation: ERROR:  update or delete on table "users"
violates foreign key constraint "fk_rails_0a2505e2a2" on table "testcase_reports"
DETAIL:  Key (id)=(5) is still referenced from table "testcase_reports".
):
```

Confirmed reproducible twice in a row (same user, same error, two separate delete attempts, timestamps
10:36:29 and 10:38:20).

## Root cause

`app/models/testcase_report.rb`:

```ruby
belongs_to :created_by, class_name: 'User', foreign_key: 'created_by', optional: true
belongs_to :updated_by_user, class_name: 'User', foreign_key: 'updated_by', optional: true
```

The **Rails model** correctly declares both associations `optional: true` (allows `NULL`), but the **database
schema** was migrated with a real `NOT NULL`-independent foreign key constraint on `testcase_reports.created_by_id`
and `testcase_reports.updated_by_id` pointing at `users.id`, with **no `ON DELETE SET NULL` / `ON DELETE CASCADE`**
clause, confirmed directly:

```sql
SELECT tc.table_name, kcu.column_name
FROM information_schema.table_constraints tc ...
WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'users';
-- testcase_reports | created_by_id
-- testcase_reports | updated_by_id
```

Core Redmine's own `User#destroy` walks a known list of Redmine-core associations (issues, time entries, etc.)
and reassigns/nullifies them before deleting the row — but it has **no knowledge of this plugin's own
`testcase_reports` table**, so it never touches `created_by_id`/`updated_by_id` before attempting the delete. The
delete then hits the raw DB-level FK constraint, which Postgres correctly rejects — but nothing in the plugin
catches that and turns it into a clean, actionable message; it propagates all the way up as a bare 500.

This is a narrow, confirmed-scope defect: a repo-wide check of every plugin table with a foreign key to `users`
found **only** `testcase_reports.created_by_id`/`updated_by_id` affected — other plugin tables that reference a
user (e.g. `run_assignments.assignee_id`) have **no** DB-level FK at all, which is a different, already-known
defect (see `BUG-TCM-008`, closed) where a stale reference causes a crash on *read* instead of blocking *delete*.

## Suggested fix

Either:
- **(a)** Add a `before_destroy` hook on `User` (or a `dependent: :nullify` equivalent reachable from the user
  deletion path) that nullifies `testcase_reports.created_by_id`/`updated_by_id` for the user being deleted, matching
  how core Redmine already treats other optional-author associations, **or**
- **(b)** Change the migration/FK itself to `ON DELETE SET NULL` so Postgres handles it automatically, **or**
- **(c)** At minimum, rescue `ActiveRecord::InvalidForeignKey` in `UsersController#destroy` (or a plugin hook on
  the user-deletion flow) and show a clear, specific error instead of a raw 500.

(a) or (b) is preferable since the model already treats the author as optional — the fix should just make the
database agree.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-TCM-064/delete-user-500-foreign-key-violation.png)

### Console / log

```
Started DELETE "/users/5" for 172.18.0.1 at 2026-10-15 10:38:20 +0000
Processing by UsersController#destroy as HTML
  Parameters: {"authenticity_token"=>"...", "confirm"=>"test", "commit"=>"Delete", "id"=>"5"}
  Current user: admin (id=1)
Completed 500 Internal Server Error in 48ms (ActiveRecord: 24.7ms (49 queries, 2 cached) | GC: 0.9ms)
FATAL -- :
ActiveRecord::InvalidForeignKey (PG::ForeignKeyViolation: ERROR:  update or delete on table "users" violates
foreign key constraint "fk_rails_0a2505e2a2" on table "testcase_reports"
DETAIL:  Key (id)=(5) is still referenced from table "testcase_reports".
):
Causes:
PG::ForeignKeyViolation (ERROR:  update or delete on table "users" violates foreign key constraint
"fk_rails_0a2505e2a2" on table "testcase_reports"
DETAIL:  Key (id)=(5) is still referenced from table "testcase_reports".
)
```

## Duplicate check

- Duplicate found: No
- Checked `bugs/_index.md` and `bugs/_duplicates.md` — `BUG-TCM-008` is related (also about a deleted user
  breaking something) but is a distinct defect: BUG-TCM-008 is a *read-time* crash on the Run page caused by a
  stale, unconstrained `assignee_id` reference (the delete itself succeeded); this bug is a *delete-time* crash
  caused by a real, unhandled DB foreign-key constraint on `testcase_reports` (the delete itself fails). No
  existing bug covers the user-deletion flow colliding with Testcase Reports.

---

## Retest — 2026-10-19

**CONFIRMED FIXED.** Migration `20261015000000_nullify_testcase_reports_user_fks_on_delete.rb` applied; restarted
container. Deleted user id=5 (`test`, the same user from the original repro, still linked as `created_by_id` on
`testcase_reports` id=2). Deletion succeeded cleanly (redirected to `/users`, no 500). DB-confirmed:
`testcase_reports.id=2` now has `created_by_id = NULL`, `updated_by_id = NULL`; `users` table confirms id=5 no
longer exists. Closing.
