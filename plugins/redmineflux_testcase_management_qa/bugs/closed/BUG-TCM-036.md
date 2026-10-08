# BUG-TCM-036

> **CLOSED — 2026-10-06.** Production #122092 (https://flux.zehntech.com/issues/122092) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.

- Bug ID: BUG-TCM-036
- Production Redmine Issue ID: #122092
- Title: The `execution_defects` backfill migration (20261001000002) crashes immediately on MySQL whenever there is any real `defect_ids` CSV data to backfill — `insert_all(unique_by:)` is unsupported on this adapter
- Severity: High
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.1.0
- Environment: Docker `localhost:3015` (project `qa-demo`), MySQL (Mysql2 adapter)
- Browser: N/A (migration / Rails console)
- User role: Admin (`admin`)
- Date: 2026-10-05

## Summary

Migration `20261001000002_backfill_execution_defects_from_defect_ids.rb` backfills the `execution_defects` join
table from every pre-existing `issue_status_results.defect_ids` CSV value. For each result with a non-blank,
resolvable-in-project defect id, it calls:

```ruby
ExecutionDefect.insert_all(rows, unique_by: 'idx_exec_defect_unique')
```

`insert_all`'s `unique_by:` option relies on `ON CONFLICT` (Postgres) / `INSERT OR IGNORE` (SQLite)-style upsert
support. **Rails' MySQL (Mysql2) adapter does not implement `unique_by:` at all** and raises `ArgumentError`
immediately, the very first time the line executes with a non-empty `rows` array. On this install (MySQL/Mysql2,
confirmed via `ActiveRecord::Base.connection.adapter_name`), the migration therefore crashes as soon as it hits
the first `IssueStatusResult` whose `defect_ids` CSV resolves to at least one real in-project defect.

**Why this wasn't caught before:** `schema_migrations` shows this migration already recorded as successfully
applied on this instance. That's only because it was first run against a **freshly-seeded, empty** database —
zero `IssueStatusResult` rows had a non-blank `defect_ids` at that moment, so the loop body (and the crashing
`insert_all` call) was never actually reached on that first run. The "idempotent, safe to re-run" claim in the
migration's own header comment (`SI-6`) was never actually exercised. The moment real defect-linked execution
data exists — which is true on any install that has actually been used — re-running this migration (a
maintenance/rollback/reinstall scenario, exactly what TC-DEFECT-05-03 describes) crashes hard instead of being a
safe no-op.

## Steps to reproduce

1. On a MySQL-backed install, ensure at least one `IssueStatusResult` has a non-blank `defect_ids` resolving to a
   real in-project defect issue (trivially true after any normal usage — e.g. any `POST
   /testcase_status_result/create.json` call with `defect_ids` set, or any `link_defect` call).
2. Re-run the migration's `up` method (e.g. via a maintenance task, a `rake db:migrate:redo`, or directly loading
   and invoking it, as a DBA/admin would for a rollback-forward or reinstall scenario).

## Expected result

- Per the migration's own documented design intent (`SI-6`): a second/later run is a safe no-op — it backfills
  nothing new and raises no error, regardless of how much real defect-linked data already exists.

## Actual result

- The migration raises immediately:
  ```
  ActiveRecord::ConnectionAdapters::Mysql2Adapter does not support :unique_by (ArgumentError)
    from .../active_record/insert_all.rb:42:in 'ActiveRecord::InsertAll#initialize'
    from .../active_record/insert_all.rb:153:in 'ActiveRecord::InsertAll#find_unique_index_for'
  ```
- Confirmed the migration IS already marked applied in `schema_migrations` on this instance, meaning its first
  (successful) run coincided with an empty table and never actually exercised the `insert_all` line.
- Direct repro: loaded the migration class in a Rails console and called `.new.up` with real `defect_ids` data
  present (created via multiple `create`/`bulk_create`/`link_defect` calls earlier in this same session) — crashed
  on the very first eligible row.
- **Side effect on this test cycle:** TC-DEFECT-05-04 (cross-project defect id in a legacy CSV must be rejected,
  not promoted into a join row during backfill) cannot be independently verified by actually re-running the
  migration right now, since the crash happens on the first eligible row (by id order) well before the loop would
  ever reach a row carrying a cross-project id — blocked by this same bug, not separately confirmed broken.

## Evidence

### Console / log

```
$ rails runner 'puts ActiveRecord::Base.connection.adapter_name'
Mysql2

$ rails runner 'puts ActiveRecord::Base.connection.select_values("SELECT version FROM schema_migrations WHERE version = 20261001000002").inspect'
["20261001000002-redmineflux_testcase_management"]

$ rails runner 'load ".../20261001000002_backfill_execution_defects_from_defect_ids.rb"; BackfillExecutionDefectsFromDefectIds.new.up'
ActiveRecord::ConnectionAdapters::Mysql2Adapter does not support :unique_by (ArgumentError)
```

## Test case coverage

Found while executing TC-DEFECT-05-03 (P1, `docs/qa/V1-TEST-CYCLE-7.1.0.md`) — **FAIL**. The migration is not
safely re-runnable on MySQL once real data exists, contradicting the TC's core assertion and the migration's own
design-intent comment.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers this migration or `insert_all`
  adapter compatibility.

## Production report

Reported to production `ztflux` as #122092 on 2026-10-06, assigned to Vaishnavi Bhawsar, target version "Testcase Management plugin Release 7.1.0". Created as a standalone bug issue (no production Run/Testcase created).

---

## Production history (synced from #122092 on 2026-10-08)

### 2026-10-06 09:43 UTC — Vaishnavi Bhawsar

Fixed. The backfill migration no longer relies on insert_all's unique_by: option (not supported by the MySQL adapter) for idempotency -- it now pre-loads the (execution, defect) pairs that already exist and simply skips any row that would duplicate one, which works identically on every adapter.

Verified directly against real data (not an empty table): re-ran the migration's up method with 11 pre-existing execution_defects rows already in place -- it completed with no error and 0 new rows (genuine no-op re-run). Then deleted one join row to simulate a gap and re-ran it again: it correctly recreated only that one missing row (10 -> 11) without touching or duplicating any of the others.

For QA:
1. On a MySQL-backed instance with real defect-linked execution data already present, re-run this migration (e.g. via rake db:migrate:redo for this migration, or loading and calling .new.up directly).
2. Confirm it completes without the previous "Mysql2Adapter does not support :unique_by" ArgumentError.
3. Confirm the execution_defects row count is unchanged after a re-run with nothing new to backfill, and that deleting one row and re-running backfills exactly that one back.

### 2026-10-06 13:32 UTC — Sourabh Singh

Retested 2026-10-06 against master 67631e0 — live-confirmed fixed. Invoked the corrected migration class directly against 23 real defect_ids rows: no crash, and a second run was a true no-op (24→24 execution_defects rows), confirming both the fix and its idempotency.
