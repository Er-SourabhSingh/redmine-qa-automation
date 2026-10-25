# BUG-TCM-118

- Bug ID: BUG-TCM-118
- Production Redmine Issue ID: <!-- fill after MCP report_defect is approved and executed -->
- Title: CI bootstrap race-condition protection is incomplete — a concurrent duplicate-name request can get a plain `422 "Name has already been taken"` instead of the documented graceful `reused: true` resolution
- Severity: Medium
- Redmine version: 6.0.11.stable (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.2.0
- Environment: Docker `localhost:3000`, project `rftc-016-ci-qa`
- Browser: N/A (API-only, `curl`)
- User role: QA Manager-equivalent (`qa.limited`, Manager on this project), via API key
- Date: 2026-10-24

## Steps to reproduce

1. Fire two genuinely concurrent (backgrounded, not sequential) `POST /testcase_ci/bootstrap_run.json` requests
   for the exact same new run name in the same project, with default `on_existing` (`reuse`):
   ```bash
   curl -u <api_key>:x -X POST ".../testcase_ci/bootstrap_run.json" -d '{"project_id":2,"run":{"name":"RaceTest"},"suites":["CI Ingest"],"testcase_selection":"suites"}' &
   curl -u <api_key>:x -X POST ".../testcase_ci/bootstrap_run.json" -d '{"project_id":2,"run":{"name":"RaceTest"},"suites":["CI Ingest"],"testcase_selection":"suites"}' &
   wait
   ```
2. Repeat several times (the failure is intermittent, not every run).

## Expected result

Per the feature's own spec (rftc-009, RFTC009-F14, explicitly marked **SACRED**): "Exactly one run row ever
exists; the loser resolves via the `RecordNotUnique` rescue to `reused: true` pointing at the winner's id — never
a 500, never a silent duplicate." Every concurrent duplicate-name call should resolve to either `201
reused:false` (winner) or `201 reused:true` (loser) — never an unhandled validation error.

## Actual result

**Intermittent — reproduced in 1 of 5 real concurrent trials this session.** In the failing case, one request got
the documented `201 reused:true`, but the losing request instead got:
```
HTTP 422
{"status":"error","errors":["Name has already been taken"]}
```
This is not a 500 and not a silent duplicate (the spec's two hard floors both hold), but it is also not the
documented graceful resolution — a real CI client retrying a dropped connection could receive this confusing
"name taken" error on the retry instead of being told the run already exists and transparently proceeding.

In 4 of the 5 trials, the race resolved exactly as documented (`201/201`, `reused:false`/`reused:true`, same run
id) — the protection works most of the time, which is consistent with a narrow timing window rather than it being
broken outright.

## Root cause (confirmed via code read)

`app/services/ci_run_bootstrap_service.rb`:
```ruby
def create_run_with_retry(attempt = 0)
  run = nil
  ActiveRecord::Base.transaction do
    ...
    run = build_run(attached_suites, pairs)
    unless run.save                                    # <-- line 284: Rails VALIDATION runs here first
      @errors.concat(run.errors.full_messages)
      raise ActiveRecord::Rollback
    end
  end
  ...
rescue ActiveRecord::RecordNotUnique                     # <-- only catches the DB-level unique-index race
  handle_run_race(attempt)
end
```
`app/models/run.rb`:
```ruby
validates :name, presence: true, uniqueness: { scope: :project_id }, length: { maximum: 100 }
```

`run.save` runs the `uniqueness: { scope: :project_id }` Rails validator **before** ever attempting the INSERT.
That validator does its own `SELECT ... WHERE name = ? AND project_id = ?` check. This creates a **second,
narrower TOCTOU race window**, separate from (and earlier than) the actual DB unique-index race the
`rescue ActiveRecord::RecordNotUnique` is written to catch:

- If both concurrent requests' Rails-level uniqueness checks run *before* either has committed its INSERT, both
  pass validation, and the real DB unique index correctly rejects the loser's INSERT — `ActiveRecord::RecordNotUnique`
  is raised, `handle_run_race` fires, and the documented graceful `reused:true` resolution happens. **This is the
  common case (4/5 trials).**
- If the loser's Rails-level uniqueness check happens to run *after* the winner has already committed, `run.save`
  returns `false` with `errors: ["Name has already been taken"]` — the plain validation failure path
  (`unless run.save` → `@errors.concat(...)` → `failure(:unprocessable_entity)`) is taken instead.
  `ActiveRecord::RecordNotUnique` is **never raised** in this path, so `handle_run_race` is never reached, and
  the caller gets the raw 422 instead of `reused:true`. **This is the rarer case (1/5 trials here).**

The fix needs to treat a validation-level "name taken" failure the same way as the DB-level race — e.g. by
re-querying for the existing run and returning `reused: true` whenever `run.save` fails specifically on the
`name` uniqueness validation (not just when the DB raises `RecordNotUnique`), so both race outcomes converge on
the same documented graceful behavior.

## Duplicate check

- Duplicate found: No. Checked `bugs/_duplicates.md` and `bugs/_index.md` for "race", "bootstrap_run",
  "RecordNotUnique" — no existing entry. This is the first time RFTC009-F14 (the race-condition SACRED test) has
  been run with multiple real trials rather than a single pair of concurrent calls — the original 2026-10-19
  execution recorded only one trial, which evidently landed in the common (working) case.
