# BUG-TCM-116

- Bug ID: BUG-TCM-116
- Production Redmine Issue ID: 125094
- Title: Deleting a test case that is on an active run leaves its `issue_status_results` execution row behind as an orphan
- Severity: Low
- Redmine version: 6.0.11.stable (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.2.0
- Environment: Docker `localhost:3000`, project `alpha-web`
- Browser: Chromium (Playwright MCP)
- User role: QA Manager (`qa.manager`, holds `delete_issues`)
- Date: 2026-10-24

## Steps to reproduce

1. Create a test case, add it to a run, and record at least one execution result for it (e.g. Failed).
2. Delete the test case via the standard Redmine issue-destroy path (core `DELETE /issues/:id`).
3. Query `issue_status_results` for rows whose `issue_id` is the deleted test case's id.

## Expected result

- Either the execution result row is also cleaned up (cascaded) when its test case is deleted, or the run UI
  clearly indicates a result exists for a case that no longer exists — not a silently-orphaned row with no
  product-visible trace.

## Actual result

- The test case's `run_issues` row is removed (so the run's case *list* correctly shows one fewer case, matching
  the already-known, accepted asymmetry that test-case delete isn't run-guarded the way suite delete is), but its
  `issue_status_results` row is **not** removed — it remains in the database referencing an `issue_id` that no
  longer exists in `issues`. The run page shows "0 of 0 tested," giving no indication that an orphaned result row
  still exists underneath.

## Root cause (confirmed via code read + live DB check)

`issue_patch.rb` declares `has_many :run_issues, dependent: :destroy` on `Issue`, which correctly cascades the
run-membership join row, but there is no equivalent `has_many :issue_status_results, dependent: :destroy` (or
equivalent cleanup) for the execution-result table. Confirmed live: test case #3666 (on run #110, with one
`issue_status_results` row id 6403) was deleted; `run_issues` for run 110 dropped to 0 rows (correct), but
`issue_status_results` row 6403 still exists with `issue_id = 3666`, an id `issues` no longer contains.

## Evidence

### Database state after delete

```sql
select count(*) from run_issues where run_id = 110;              -- 0
select count(*) from issue_status_results where run_id = 110;    -- 1  (orphaned row id 6403, issue_id 3666)
select count(*) from issues where id = 3666;                     -- 0
```

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md`. Related to, but distinct from, the already-documented
  product asymmetry that test-case delete (unlike suite delete) is not run-guarded — this bug is specifically
  about the orphaned `issue_status_results` row left behind by that cascade gap, not the lack of a guard itself
  (which the team may consider intentional/by design).

## Retest Result (2026-10-26)

**CONFIRMED FIXED.** Confirmed via precise source diff (issue_patch.rb): has_many :issue_status_results, dependent: :destroy was added (matching the sibling run_issues association), so deleting a test case no longer leaves an orphaned execution-result row behind.
