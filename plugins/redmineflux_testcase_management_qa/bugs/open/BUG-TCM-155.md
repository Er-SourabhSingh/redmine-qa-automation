# BUG-TCM-155

- Bug ID: BUG-TCM-155
- Production Redmine Issue ID: 129147 (assigned: Vaishnavi Bhawsar)
- Severity: High — the entire rftc-018 Automation Source grouping feature is silently non-functional on every MySQL-backed instance (not a crash/data-loss, so not Critical; but a whole feature area dead on one of three supported DB engines, with no user-facing error at all)
- Title: `AutomationSourceResolver.resolve!` always fails on MySQL — raw SQL uses the unquoted reserved word `key` as a column name, causing every CI-ingested result's `source_id` to silently resolve to `nil`
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: dev build (`Version: 0.0.0-dev`), same `AutomationSourceResolver` code already verified working on the PostgreSQL and SQLite legs of this cross-DB pass
- Environment: Docker `redmine6-happyflow-mysql` (`localhost:3022`), project `happy-flow-mysql` (id=1), MySQL 8.x (`ActiveRecord::Base.connection.adapter_name` → `Mysql2`)
- Browser: N/A — reproduced directly via `bin/rails runner` and via real `POST /testcase_ci/ingest_results.json` HTTP calls
- User role: N/A (server-side service logic, triggered by any CI ingest call regardless of caller's role)
- Date: 2026-11-19

## Steps to reproduce

1. On a MySQL-backed Redmine instance with this plugin installed, CI-ingest any result with an explicit `source`
   (e.g. `POST /testcase_ci/ingest_results.json` with `{"results":[{"key":"<id>","status":"passed","source":"nightly-regression"}]}`),
   OR ingest a result with no source at all — the bug fires on **every** call, since `derive_key`'s fallback
   path reaches `AutomationSourceResolver.resolve!` regardless of which precedence level supplied the key.
2. Equivalently, call directly via `rails runner`:
   ```ruby
   AutomationSourceResolver.resolve!(project: Project.find(1), key: 'any-key', kind: 'explicit')
   ```

## Expected result

- The result's `source_id`/`source_name` in the ingest response are populated with a real, newly-created or
  reused `AutomationSource` row — exactly as already confirmed working on both the PostgreSQL leg
  (`source_id:4`, DB-confirmed) and the SQLite leg (`source_id:6`, DB-confirmed) of this same cross-DB pass.

## Actual result

- `source_id`/`source_name` are always `null` in the ingest response on MySQL. Root cause (confirmed by reading
  the source and reproducing directly):
  - `AutomationSourceResolver.find_by_key_ci` (`app/services/automation_source_resolver.rb:90`) runs:
    ```ruby
    AutomationSource.where(project_id: project.id).where('LOWER(key) = LOWER(?)', key).first
    ```
    The bare, unquoted column name `key` inside the raw SQL fragment is **`KEY`, a MySQL reserved word**
    (used in index/key-definition syntax). PostgreSQL and SQLite both accept an unquoted `key` as an ordinary
    column identifier, which is why this exact code already passed cleanly on both other legs of this pass —
    MySQL is the one engine where it is a hard syntax error.
  - Direct `rails runner` reproduction:
    ```
    irb(main)> AutomationSourceResolver.resolve!(project: Project.find(1), key: 'BUG-TCM-155-repro', kind: 'explicit')
    RAISED: ActiveRecord::StatementInvalid: Mysql2::Error: You have an error in your SQL syntax; check the
    manual that corresponds to your MySQL server version for the right syntax to use near 'key) = LOWER(...))
    ORDER BY `automation_sources`.`id` ASC LIMIT ' at line 1
    ```
  - The real HTTP-level ingest path never surfaces this: `CiResultIngestService#resolve_source_for`
    (`app/services/ci_result_ingest_service.rb:373-394`) wraps the whole resolution in `rescue => e` and merely
    logs `"CI ingest: automation source resolution failed for key=..."`, leaving `source_id` as `nil` — the
    deliberate "never raises and never blocks the write" design for a *missing* source correctly degrades a
    genuinely-unresolvable key to "ungrouped", but here it's silently swallowing a real SQL error on **every**
    call, so **no result on a MySQL-backed instance can ever be grouped under an Automation Source** — the
    entire rftc-018 feature (the Automation Dashboard's per-source grouping) is non-functional on MySQL.
  - Confirmed via server log (`docker logs`):
    ```
    E, [...] ERROR -- : [...] CI ingest: automation source resolution failed for key=118: Mysql2::Error: ...
    'key) = LOWER('nightly-regression-mysql')) ORDER BY `automation_sources`.`id` ASC' at line 1
    ```
  - Confirmed via DB: `AutomationSource.count` remains `0` on this project after multiple real ingest calls
    that each supplied an explicit `source`, which on PostgreSQL/SQLite would have created a new row each time.

## Evidence

### Screenshot

N/A — this is a backend-only resolution bug with no UI reproduction path of its own (it's visible indirectly on
the Automation Dashboard, where every MySQL-ingested result would show as "Ungrouped" regardless of any
`source` the caller supplied — not screenshotted separately since the direct `rails runner`/log evidence above
is the authoritative, unambiguous proof of root cause).

### Console / log

```
$ bundle exec rails runner "puts ActiveRecord::Base.connection.adapter_name; AutomationSourceResolver.resolve!(project: Project.find(1), key: 'BUG-TCM-155-repro', kind: 'explicit')"
Mysql2
RAISED: ActiveRecord::StatementInvalid: Mysql2::Error: You have an error in your SQL syntax; check the manual
that corresponds to your MySQL server version for the right syntax to use near 'key) = LOWER('BUG-TCM-155-repro'))
ORDER BY `automation_sources`.`id` ASC LIMIT ' at line 1

$ docker logs redmine6-happyflow-mysql-redmine-1 | grep "automation source resolution failed"
E, [...] CI ingest: automation source resolution failed for key=118: Mysql2::Error: ... 'key) = LOWER(...))
ORDER BY `automation_sources`.`id` ASC' at line 1
(repeats for every ingest call made during RFTC-016/017/018 testing on this leg)
```

**Suggested fix:** quote the column explicitly, e.g. `where('LOWER(`key`) = LOWER(?)', key)` (MySQL backtick
quoting) or use Arel/the model attribute instead of a raw SQL fragment (e.g.
`AutomationSource.where(project_id: project.id).where(AutomationSource.arel_table[:key].lower.eq(key.downcase)).first`),
which is portable across all three supported adapters without needing per-adapter quoting at all.

## Duplicate check

- Duplicate found: No — BUG-TCM-125 (closed) is a different, already-fixed bug in the same file (case-sensitivity
  logic in the *Ruby* comparison, not a SQL syntax error), confirmed not reproducing on this leg at the Ruby
  level — this is a MySQL-specific raw-SQL portability bug that only exists because of the literal, unquoted
  `key` identifier in the raw SQL string.
- Existing bug reference (if duplicate): —
