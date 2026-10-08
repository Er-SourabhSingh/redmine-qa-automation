# BUG-TCM-055

> **CLOSED — 2026-10-07.** Production #122759 (https://flux.zehntech.com/issues/122759) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.
> The original local bug file was lost (system reformatted before it was pushed); this file is rebuilt from the
> production issue's description and journal.

- Bug ID: BUG-TCM-055
- Production Redmine Issue ID: #122759 (https://flux.zehntech.com/issues/122759) — created 2026-10-07, assigned to Vaishnavi Bhawsar, Priority High, Defect Severity High-severity
- Title: Bulk Update Result silently has no effect on a case that was already executed individually
- Severity: High
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.1.0
- Target version: Testcase Management plugin Release 7.1.0 [07-10-2026]
- Defect Type: Functional
- Defect priority: High
- Reported by: Sourabh Singh
- Date: 2026-10-07
- Status: Closed (production: Done, 2026-10-07)

## Summary

Once a test case in a run has been given a result through the single **Add Result** action, a later **Bulk Update Result** that includes that same case reports success but does not change what is displayed for it -- it silently keeps showing the result from the earlier individual Add Result, not the new bulk status. Every other case in the same bulk batch (one that was still Untested) updates correctly.

## Root cause

Two different code paths write an execution result and disagree about which row is "the seeded Untested placeholder":

- **Single Add Result** (`IssueStatusResultsController#create`) always inserts a brand-new `IssueStatusResult` row. It never looks for, or transitions, the seeded `case_status_id: 1` ("Untested") row created when the run was built -- that placeholder is left behind untouched.
- **Bulk Update Result** (`IssueStatusResultsController#bulk_create` -> `IssueStatusResultWriter.write`) does the opposite: for each selected case it looks for an **existing row with `case_status_id: 1`** and, if found, updates **that exact row in place** instead of inserting a new one.
- Because the single Add Result path never touched the placeholder, Bulk Update Result finds it still at `case_status_id: 1` and updates it -- but it's now the wrong, superseded row. The real, visible result (from the individual Add Result) is a separate, later row with a **higher id**.
- The run grid's "current result" query is `...where.not(case_status_id: nil).last` with **no explicit order** -- an unordered `.last` resolves by primary key, i.e. highest id wins. The row Bulk Update just updated (the old placeholder) has a lower id than the individually-created row, so the grid keeps showing the individual result and the bulk status silently never becomes visible for that case, even though the API response claims success.

This is a one-time trap per case: a **second** bulk update of the same case will correctly insert a new, higher-id row and display properly, since the placeholder itself no longer holds `case_status_id: 1` after the first mis-fire.

## Preconditions

- A run with several seeded-Untested cases.

## Steps to reproduce

1. Create a new run with several cases (all start Untested).
1. Individually open one case's **Add Result** and set it to **Passed**.
1. Select **all** cases in the run (including the one from step 2), open **Bulk Update Result**, choose a different status (e.g. **Skipped**), and submit.
1. Reload the run and look at the case from step 2.

## Expected result

The case from step 2 shows the new bulk status (Skipped), same as every other case in the batch.

## Actual result

The case from step 2 still shows Passed -- the bulk update had no visible effect on it, despite the bulk response reporting success for it.

## Evidence

Reproduced via direct authenticated API calls against run #48 (`localhost:3015`, testsuite "Authentication", environment "CI"), 6 seeded-Untested cases (#3/4/5/31/87/88):

```
IssueStatusResult.where(run_id:48) before any action:
[[799, 3, 1, "CI"], [800, 4, 1, "CI"], [801, 5, 1, "CI"], ...]
# [id, issue_id, case_status_id, environment] -- row 799 is case #3's seeded Untested placeholder
```

Step 1 -- individually set case #3 to Passed:
POST /issue_status_results.json  issue_id=3 case_status_id=2(Passed) environment=CI run_id=48 testsuite_id=1
-> 201 Created  {"issue_status_result":{"id":805,"issue_id":3,"case_status_id":2,...}}
1. a brand-new row (id 805) was inserted; row 799 was never touched

Step 2 -- bulk-update ALL 6 cases (including #3) to Skipped:
POST /issue_status_results/bulk_create.json  {"run_id":48,"testsuite_id":1,"issue_status_results":[{"issue_id":3,"case_status_id":6,"environment":"CI",...}, ...]}
-> 201 Created  {"status":"success", ..., "issue_status_results":[{"issue_id":3,"case_status_id":6,...,"id":799,"created_at":"...08:37:42...","updated_at":"...08:38:33..."}, ...]}
1. the response for issue #3 reports id: 799 -- the OLD placeholder, updated in place (created_at is the run-creation timestamp, not the bulk-update timestamp) -- not a new row

Post-bulk state:
IssueStatusResult.where(run_id:48, issue_id:3).order(:id):
[799, 6, created 08:37:42, updated 08:38:33]   # placeholder, now Skipped -- but NOT what's displayed
[805, 2, created 08:38:26, updated 08:38:26]   # individual result, Passed -- still the displayed one

run.issue_status_results.where(issue_id:3, run_id:48, testsuite_id:1, environment:'CI').where.not(case_status_id: nil).last
=> id=805, case_status_id=2  (Passed)   <- what the run grid actually shows

Every other case in the same bulk batch (#4/5/31/87/88, no prior individual execution) correctly shows Skipped, because for them the writer's `case_status_id: 1` lookup found their one and only row and updated it in place -- no superseding higher-id row to lose to.

## Suggested fix direction

Make both write paths agree on how to find "the row to transition":

- Have the single Add Result action reuse the same `IssueStatusResultWriter.write` seeded-Untested-transition logic the bulk/CI paths already use, so there is one row per Untested placeholder, consistently transitioned regardless of which action executes it first; **or**
- Have the "current result" grid query resolve by `updated_at`/`created_at` rather than by raw id, so a transitioned-in-place placeholder with a fresher `updated_at` wins over an older, no-longer-current row.

The first option looks more correct -- it also avoids an individually-executed case accumulating an orphaned, perpetually-"Untested"-looking placeholder that bulk logic can still find and silently mutate.

## QA reference

Local bug file: bugs/open/BUG-TCM-055.md . New test case: TC-TCM-269 (testcases/TESTCASE_MANAGEMENT_TEST_RUNS.md).

---

## Production history (synced from #122759 on 2026-10-08)

### 2026-10-07 09:34 UTC — Vaishnavi Bhawsar

Fixed using your first suggested direction — made both ways of recording a result agree.

Recording a result one case at a time was always creating a brand new row and leaving the original blank placeholder behind, untouched. Bulk Update Result, on the other hand, specifically looks for that blank placeholder and updates it in place. So when a case had already been given a result on its own, Bulk Update was quietly updating the old, no-longer-shown placeholder instead of the row that was actually on screen — it looked like nothing happened.

Now recording a result one at a time uses the exact same logic Bulk Update already does, so there's only ever one "current" placeholder to find, and whichever action runs last is the one that's actually shown — same as every other case that was never touched individually.

Verified directly against Run #4, Authentication suite, CI environment: set test case #1 to Passed individually, then bulk-updated it along with 4 others to Skipped. All five, including #1, now correctly show Skipped. Screenshot attached.

For QA:
1. In a run with several Untested cases, give one of them a result individually (e.g. Passed).
2. Select all cases (including that one) and run Bulk Update Result with a different status (e.g. Skipped).
3. Confirm every case, including the one done individually, now shows the bulk status.
4. Confirm its execution history still shows both the earlier individual result and the new bulk result, in order.

### 2026-10-07 12:29 UTC — Sourabh Singh

Retested on fresh master (commit `69e438d`, which cites this bug by name). The single Add Result action now routes through `IssueStatusResultWriter.write`, the same seeded-Untested-transition logic the bulk/CI paths already used.

Confirmed live on a fresh run: individually set a case to Passed, then bulk-updated it (with others) to Skipped. Only 2 result rows exist for that case afterward (not 3) -- the individual write correctly transitioned the original seeded-Untested placeholder in place (reusing its id), so there was no orphaned placeholder left for the bulk update to silently grab instead. The bulk update's row has the highest id and is correctly the one displayed (Skipped), matching the expected status. Closing.
