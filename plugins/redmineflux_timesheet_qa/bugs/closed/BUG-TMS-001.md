# Bug Report Template

- Bug ID: BUG-TMS-001
- Production Redmine Issue ID: #121040
- Title: Bulk-deleting a user with a timesheet submission crashes with an unhandled 500 Internal error
- Redmine version: 7.0.0 (Docker)
- Plugin name: Redmineflux Timesheet
- Plugin version: 7.0.0
- Environment: Local Docker (redmine-docker-7.0.0, `redmine-docker-700-redmine-1`, http://localhost:3010)
- Browser: Chrome
- User role: Administrator (bulk user delete is an admin-only action)
- Date: 2026-09-21

## Steps to reproduce

1. As an Administrator, go to Administration → Users.
2. Select two or more users where at least one has ever submitted a timesheet (has a row in `timesheet_submissions` — e.g. via Timesheet → submit a weekly timesheet for approval).
3. Right-click the selection → **Delete**.
4. On the confirmation page, type `Yes` and click **Delete**.

## Expected result

- Either the deletion succeeds and the user's timesheet submissions are removed/handled along with them (matching how the plugin already handles `:timesheets`, which has `dependent: :destroy`), or Redmine shows a graceful validation message explaining the user can't be deleted because of existing timesheet submissions — the same pattern Redmine core uses elsewhere for records that block deletion.

## Actual result

- The request raises an unhandled `ActiveRecord::InvalidForeignKey` / `PG::ForeignKeyViolation` and Rails shows its generic "Internal error" page (HTTP 500) — no explanation, no rollback message, just a broken admin action.
- Reproduced twice independently: once by the user directly (`bulk_destroy?ids[]=107&ids[]=5`, screenshot below) and once via a live tail of the container's stdout during a separate reproduction attempt, which captured the exact same error for user id 5.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-TMS-001/bulk-destroy-internal-error.png)

### Console / log

```
Completed 500 Internal Server Error in 94ms (ActiveRecord: 46.5ms (101 queries, 3 cached) | GC: 0.0ms)
FATAL -- : ActiveRecord::InvalidForeignKey (PG::ForeignKeyViolation: ERROR:  update or delete on table "users" violates foreign key constraint "fk_rails_00ebe96911" on table "timesheet_submissions"
DETAIL:  Key (id)=(5) is still referenced from table "timesheet_submissions".
)
Caused by: PG::ForeignKeyViolation (ERROR:  update or delete on table "users" violates foreign key constraint "fk_rails_00ebe96911" on table "timesheet_submissions"
DETAIL:  Key (id)=(5) is still referenced from table "timesheet_submissions".
)
app/controllers/users_controller.rb:250:in 'UsersController#bulk_destroy'
lib/redmine/sudo_mode.rb:78:in 'Redmine::SudoMode::Controller#sudo_mode'
```

**Root cause (confirmed via source):** `plugins/redmineflux_timesheet/lib/redmineflux_timesheet/patches/user_patch.rb` patches Redmine's `User` model with:

```ruby
has_many :timesheets, class_name: 'Timesheet::Timesheet', dependent: :destroy
has_many :timesheet_entries, through: :timesheets, class_name: 'TimesheetEntry'
has_many :timesheet_approval_actions, class_name: 'Timesheet::ApprovalAction', foreign_key: 'user_id'
```

`:timesheets` correctly declares `dependent: :destroy`. But `Timesheet::TimesheetSubmission` (`app/models/timesheet/timesheet_submission.rb`) has `belongs_to :user`, backed by a hard DB-level foreign key added in `db/migrate/014_create_timesheet_submissions.rb` (`t.references :user, ..., foreign_key: true`, which defaults to `ON DELETE RESTRICT` in PostgreSQL) — and **`User` has no matching `has_many :timesheet_submissions` association at all**, with or without a `dependent:` option. Since Rails has no knowledge of this relationship from the `User` side, it can't cascade, nullify, or pre-validate against it before calling `destroy` — the DB-level `RESTRICT` constraint is the only thing that fires, as a raw, unrescued exception. (`:timesheet_approval_actions` has the same gap — an association with no `dependent:` — but was not exercised in this specific repro.)

## Retest — 2026-09-25

- Status: FIXED
- Fix Date: on or before 2026-09-25 (fix present in plugin source when Docker 7 was restarted for this retest)
- Retest Date: 2026-09-25
- Retest Result: **PASS**
- Environment: Local Docker (redmine-docker-7.0.0, http://localhost:3010), Chrome, Administrator

**Fix in source:** `user_patch.rb` now declares `has_many :timesheet_submissions, dependent: :destroy` (cascades to approval instances → approval actions), `has_many :timesheet_entry_locks, dependent: :destroy`, and re-points `:timesheet_approval_actions` at `foreign_key: 'approver_id'` with `dependent: :nullify`. It also prepends a `DestroySafety#destroy` rescue that turns any future FK violation into a validation error instead of a 500. New migration `019_allow_null_approver_id_on_approval_actions.rb` backs the `:nullify`.

**Env note:** migration 019 was **not** applied by the container restart (plugin migrations don't auto-run on Docker 7 either). Ran `rake redmine:plugins:migrate NAME=redmineflux_timesheet` manually, then restarted again before retesting.

**Retest steps (all via the real UI, fresh throwaway fixtures so no real account was deleted):**

1. As Admin, created users `tms.retest.a` (#130) and `tms.retest.b` (#131).
2. Added #130 to Timesheet team "Artificial Intelligence Team" (team role Developer, needed for `view_timesheets` in team mode) and to project "test project" as Developer.
3. As #130, logged 2h on 2026-09-25 and clicked **Submit Timesheet**. Result: "Team timesheets processed: 1 submitted." That created submission #3 (`submitted`), approval instance #3 (`pending`), and 1 entry lock.
4. As Admin, Administration → Users, selected #130 + #131 → right-click → **Delete** → typed `Yes` → **Delete**.

**Result:** `UsersController#bulk_destroy` → `302 Found` → `/users`, flash **"Successful deletion."**, both users gone from the list. No `FATAL` / `ForeignKeyViolation` in the container log. DB after delete: submission #3, approval instance #3, entry lock and team membership all removed (cascade worked). The time entry was reassigned to Anonymous, which is standard Redmine core behavior.

**Adjacent sanity check:** team 6 page shows its original 2 members, aurora.wren's submissions #1/#2 are untouched, and the Approver Dashboard renders with no errors.

**Not exercised:** the approver-side `:nullify` path (deleting a user who has acted as an approver) and the single-user `UsersController#destroy` path. Both go through the same `User#destroy` + associations, but neither was run live in this retest.

![Retest pass](../../screenshots/BUG-TMS-001/retest-2026-09-25-pass.png)

**Production sync:** #121040 updated 2026-09-25 — Status In QA → Done, % done 0 → 100, with a note summarizing the retest.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): n/a
