# BUG-TCM-040

> **CLOSED — 2026-10-06.** Production #122096 (https://flux.zehntech.com/issues/122096) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.

- Bug ID: BUG-TCM-040
- Production Redmine Issue ID: #122096
- Title: `bulk_testcase_create` crashes with a 500 whenever `steps_and_results` is omitted, even though steps are clearly meant to be optional
- Severity: Medium
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.1.0
- Environment: Docker `localhost:3015` (project `qa-demo`)
- Browser: N/A (direct API call)
- User role: QA Manager (`qa.manager`)
- Date: 2026-10-05

## Summary

`RunsController#bulk_testcase_create` (`POST /testcase/bulk_testcase_create.json`) unconditionally calls
`steps_and_results.each do |step| ... end` with no nil-guard. If a submitted test case entry omits
`steps_and_results` entirely — which a caller would reasonably expect to be optional, since not every test case
needs authored steps — the whole request crashes with an unhandled `NoMethodError` (`undefined method 'each' for
nil`), returning a bare `500 Internal Server Error` with no useful message, instead of either defaulting to no
steps or returning a clean validation error.

The whole batch is rolled back (confirmed no partial `Issue` row survives the crash, since the loop runs inside
an `Issue.transaction do...end` block), so there's no data-corruption risk — but the endpoint is completely
unusable for the (presumably common) case of bulk-creating simple test cases that don't need steps.

## Steps to reproduce

1. `POST /testcase/bulk_testcase_create.json` with a `test_cases` entry that has a `testcase` object but no
   `steps_and_results` key at all:
   ```json
   {"test_cases":[{"testcase":{"project_id":1,"subject":"No steps case","priority_id":2}}]}
   ```

## Expected result

- Either the test case is created successfully with zero steps (treating `steps_and_results` as optional,
  defaulting to an empty array), or a clean `422` validation error is returned — not a crash.

## Actual result

- `500 Internal Server Error`, no test case created (transaction rolled back cleanly, confirmed via DB — no
  orphaned row).
- Server log:
  ```
  NoMethodError (undefined method 'each' for nil):
  plugins/redmineflux_testcase_management/app/controllers/runs_controller.rb:1181:in
    'block (2 levels) in RunsController#bulk_testcase_create'
  ```
- Reproduced with both a single-entry batch and a 50-entry batch (same crash, same root cause) — confirming it's
  the missing key itself, not a batch-size effect.

## Evidence

### Console / log

```
$ curl -X POST .../testcase/bulk_testcase_create.json -d '{"test_cases":[{"testcase":{"project_id":1,"subject":"No steps case","priority_id":2}}]}'
{"status":500,"error":"Internal Server Error"}

$ docker logs ... | tail
NoMethodError (undefined method 'each' for nil):
  .../runs_controller.rb:1181:in 'block (2 levels) in RunsController#bulk_testcase_create'
  .../runs_controller.rb:1115:in 'Array#each'

$ rails runner 'puts Issue.where(subject:"No steps case").exists?'
false   # correctly rolled back, no orphaned data
```

## Test case coverage

Found while setting up a fixture for TC-RUN-01-10 (P3, exploratory, large-suite-selection stress test,
`docs/qa/V1-TEST-CYCLE-7.1.0.md`) — the fixture-creation call itself crashed before the actual exploratory
scenario could be tested, surfacing this as a genuine defect in the bulk-create endpoint rather than a test-setup
issue.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers `bulk_testcase_create`'s handling
  of missing `steps_and_results`.

## Production report

Reported to production `ztflux` as #122096 on 2026-10-06, assigned to Vaishnavi Bhawsar, target version "Testcase Management plugin Release 7.1.0". Created as a standalone bug issue (no production Run/Testcase created).

---

## Production history (synced from #122096 on 2026-10-08)

### 2026-10-06 09:24 UTC — Vaishnavi Bhawsar

Fixed. Bulk-creating test cases without any steps no longer crashes — steps are now genuinely optional, exactly as expected.

For QA:
1. POST to /testcase/bulk_testcase_create.json with a test case entry that has no "steps_and_results" key at all, e.g.:
{"test_cases":[{"testcase":{"project_id":1,"subject":"No steps case","priority_id":2}}]}
2. Confirm it returns a clean 200 with the test case created (not a 500), and that the created issue has zero steps.
3. Confirm a normal bulk-create request that DOES include steps still works exactly as before.

### 2026-10-06 13:32 UTC — Sourabh Singh

Retested 2026-10-06 against master 67631e0 — live-confirmed fixed. POST to bulk_testcase_create.json with steps_and_results omitted entirely now returns 200 success (test case created with zero steps), not a 500 crash.
