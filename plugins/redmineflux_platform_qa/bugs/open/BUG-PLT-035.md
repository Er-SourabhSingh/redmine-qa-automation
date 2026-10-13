# Bug Report Template

- Bug ID: BUG-PLT-035
- Production Redmine Issue ID: #121652 (production title reads "BUG-PLT-017" — a mislabeling by whoever filed it on production; this is a distinct defect, correctly numbered BUG-PLT-035 in this local repo, and the production issue's own journal cross-references this local file by that name)
- Title: A Redmine user who has filed or approved anything cannot be deleted — foreign keys across multiple plugins block it
- Redmine version: 6/7 (Rails 7.2.3.1 / 8.1), both reproduced
- Plugin name: redmineflux_platform / redmineflux_timesheet / redmineflux_workload / redmineflux_helpdesk / redmineflux_invoice / redmineflux_knowledgebase / redmineflux_agile_board (cross-plugin)
- Plugin version: `redmineflux_platform` branch, current tip
- Environment: `redmine-docker-6-platform` (`localhost:3013`, MySQL 8) for the 2026-10-06 QA retest; `redmine-700-redmine-1` (`localhost:8091`, PostgreSQL 16) for the original filing and the dev's own fix/verification
- Browser: N/A — reproduced via `rails runner` / direct DB inspection, not a UI click-through, since this is a database constraint behavior
- User role: Admin
- Date: 2026-09-30 (filed by the developer, not by QA)

## Steps to reproduce

1. Log in as Admin. Create a user.
2. Have them approve one leave (Workload or Shift Management), or approve one timesheet — or more generally, give them any row in a RedmineFlux table that references `users` with no release mechanism.
3. Administration → Users → that user → Delete.

## Expected result

The account is deleted. Records that person created stay, with the identity link severed — matching what Redmine itself does to an issue's assignee, and what the plugins' own code already intends (e.g. `dependent: :nullify` on several `User` associations).

## Actual result

The delete fails outright with a database-level error — originally `ActiveRecord::InvalidForeignKey` (`rf_leaves`, PostgreSQL) and a `PG::NotNullViolation` on `timesheet_approval_actions.approver_id` (a migration recorded as applied in `schema_migrations` that never actually ran). The account cannot be removed at all.

### Root cause (confirmed from source, production issue #121652 description)

Every FK from a RedmineFlux table to `users` was created with the default `ON DELETE NO ACTION`, so the database refuses the delete rather than cascading or nullifying — across `rf_leaves`, `rf_holidays`, `timesheet_approval_actions`, `timesheet_submissions`, `timesheet_entry_locks`, `rf_user_skills`, `rf_workloads`, `rf_workload_users`, `rf_project_customers`, and Helpdesk's 3 `author_id` columns.

## History — three rounds, not one fix

This bug is unusual in that it was found by the **developer**, not QA, and went through two further rounds of QA-driven discovery after the first fix landed — each round finding real gaps the previous one had missed. Recorded here in full since it is the reason this took until 2026-10-07 to settle.

**Round 1 — developer's own fix (2026-09-30).** Migration 040 (`redmineflux_platform`, commit `8caa327`) set per-column `ON DELETE` rules on `rf_leaves`/`rf_holidays` (CASCADE for `user_id`, SET NULL for the "who did it" columns); migration 020 (`redmineflux_timesheet`, commit `db0ef3e`) idempotently repaired the broken 019. The developer's own "Still open" list named 7 remaining columns across Workload, Timesheet and Invoice as needing the same per-column decision.

**Round 2 — QA retest, 2026-10-06 (Sourabh Singh).** Confirmed migration 040 and 020 genuinely fixed live, via `rails runner` exercising the actual `User#destroy` path plus `information_schema` FK inspection (DB constraint behavior, not a UI concern). But found the developer's own "Still open" list was itself **wrong for 3 of its 7 items** — `rf_workload_users`, `rf_user_skills` (workload) and `timesheet_submissions`/`timesheet_entry_locks` (timesheet) do *not* actually block a delete, because each plugin already declares `dependent: :destroy`/`:nullify` on the `User` association in its own `user_patch.rb`, which runs before the DB constraint is ever reached — the raw schema-level FK is a red herring once an app-level patch exists. Recommended reopening with the list narrowed to the genuinely-still-open items: `rf_workloads.created_by_id`, `rf_project_customers.customer_id`, and Helpdesk's 3 `author_id` columns.

**Round 3 — dev response, 2026-10-07 (Prashant Chaurasia).** Accepted the QA correction as his own error, and re-tested every column in isolation (fresh user, exactly one row in that table, delete inside a rolled-back transaction — necessary because a user with rows in several tables is stopped by whichever key is reached first, masking the rest). This surfaced **3 more blockers nobody had listed** (all in `redmineflux_invoice`: `invoices.author_id`, `invoice_payments.recorded_by_id`, `team_rates.user_id`), plus a completely unlisted blocker in a different plugin entirely (`rf_board_configs.user_id`, `agile_board`) that was masking several real demo-account deletes. Fixed all newly-found columns via the same `user_patch.rb`-style app-level `dependent:` pattern (not more migrations — four DB-level migrations written first were rolled back as "the wrong precedent"). Added `test/unit/user_deletion_test.rb` to the platform suite: it queries the DB for every FK pointing at `users` and requires each to be released by *something* (DB rule or app-level `dependent:`), failing the build instead of relying on a hand-kept list — the exact mechanism that let rounds 1 and 2 both miss columns.

**What remains deliberately unfixed, per the dev's own final note:**
1. `rf_board_configs.user_id` / `rf_board_caches` / `rf_board_filters` (agile_board) — confirmed live, the one actually blocking real demo accounts, but that plugin is on `master`, outside this release's branch scope. No ticket raised against it yet.
2. `rf_knowledgebase_versions.author_id` — left by decision, not oversight. The column is `NOT NULL` and the model validates the author's presence; nullifying needs the model relaxed, destroying would delete page history along with the account. A user who has *edited* a KB page can still be refused a delete; one who merely *created* a page now can be deleted.

## Evidence

### Screenshot

N/A — this defect is a database-level constraint behavior, verified via `rails runner`/DB inspection rather than a UI screenshot, consistent with how both QA and the developer verified it throughout.

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-035/retest-yyyy-mm-dd-pass.png)

### Console / log

```
ActiveRecord::InvalidForeignKey: PG::ForeignKeyViolation:
update or delete on table "users" violates foreign key constraint
"fk_rails_57d422a039" on table "rf_leaves"
```

## Duplicate check

- Duplicate found: No — production issue is mislabeled "BUG-PLT-017" in its title (a filing error), which collides in name only with the real BUG-PLT-017 (Contacts search, production #121707, local `bugs/closed/BUG-PLT-017.md`). The two are unrelated defects; this file uses the correct next-available local ID, BUG-PLT-035.

## Fix Verification — pending second retest

Status on production (as of 2026-10-13): **In QA**, 90% done. The three rounds above are complete through round 3 (dev's 2026-10-07 response). What has **not** yet happened is a fourth-round QA retest of round 3's fixes — the agile_board and knowledgebase-version exceptions, and the three new Invoice columns Prashant found, have not been independently re-verified by QA since his 2026-10-07 commits. This file was not created or pushed when it should have been after the round-2 retest (2026-10-06) — the production journal's own "Full local writeup: bugs/open/BUG-PLT-035.md in the QA repo" reference predates this file actually existing locally; this is that backfill.

**Next session**: retest round 3's claims — the 6 columns across workload/helpdesk/invoice/knowledgebase the 2026-10-07 commits touched — before moving this to closed/.

## Production report

Filed on production `ztflux` as **#121652** on 2026-09-30 by the developer (Prashant Chaurasia), not QA — an unusual origin for a bug in this repo, recorded here for traceability. QA (Sourabh Singh) added the 2026-10-06 retest journal entry documented above. Priority: Medium; Defect custom fields: Type=Functional, Severity=Medium-severity, Priority=Medium.
