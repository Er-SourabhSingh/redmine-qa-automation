# BUG-TCM-061

> **CLOSED — 2026-10-07.** Production #122803 (https://flux.zehntech.com/issues/122803) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.
> The original local bug file was lost (system reformatted before it was pushed); this file is rebuilt from the
> production issue's description and journal.

- Bug ID: BUG-TCM-061
- Production Redmine Issue ID: #122803 (https://flux.zehntech.com/issues/122803) — created 2026-10-07, assigned to Vaishnavi Bhawsar, Priority Medium, Defect Severity Medium-severity
- Title: Deleting a defect issue entirely leaves its ExecutionDefect join row behind — Total Defects / Defect Count keep counting a defect that no longer exists
- Severity: Medium
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.1.0
- Target version: Testcase Management plugin Release 7.1.0 [07-10-2026]
- Defect Type: Functional
- Defect priority: Medium
- Reported by: Sourabh Singh
- Date: 2026-10-07
- Status: Closed (production: Done, 2026-10-07)

## Summary

User reported: deleting a defect doesn't reduce the "Total Defects" count shown on the Runs listing page.
Confirmed live using the user's own test data: defect issue **#143** had already been deleted (genuinely gone --
`Issue.find_by(id: 143)` returns `nil`), but run #55's "Total Defects" still showed **2** (should be 1, since only
defect #142 still exists). The `ExecutionDefect` join row for #143 was never cleaned up when the issue itself was
deleted.

## Root cause

`ExecutionDefect belongs_to :defect_issue, class_name: 'Issue', foreign_key: 'defect_issue_id', optional: true` --
there is no reverse association or cleanup hook on the `Issue` side for this. The only cascades that exist for
`ExecutionDefect` are:
- `IssueStatusResult has_many :execution_defects, dependent: :destroy` (cleans up when the **execution/result** or
  its parent **Run** is destroyed)
- `IssueRelation#after_destroy :rftc_cleanup_execution_defects` (cleans up when the **relation** is explicitly
  deleted -- this is the BUG-TCM-057 fix)

Neither covers deleting the **defect Issue itself**. When a defect issue is deleted via Redmine's normal issue
delete, core Redmine's own `IssueRelation` cleanup correctly removes the relation (confirmed: @IssueRelation
.where(issue_to_id: 143)` -> `[]@), but nothing hooks into that to also clean up this plugin's own
`ExecutionDefect` rows pointing at the now-gone issue -- so `ExecutionDefect.where(defect_issue_id: 143)` still
returns a real row, and both `total_defect_count` (fixed in BUG-TCM-058's commit `1f671e0` to correctly use this
join) and `count_defects`/`ExecutionDefect.linked_defects` keep including it, because none of them check whether
the referenced defect Issue still actually exists.

## Steps to reproduce

1. Link a defect to a test case's Failed/Blocked result in a run; confirm the run's "Total Defects" count
  includes it.
1. Delete the defect issue entirely (not the relation -- the issue itself, e.g. via Redmine's own issue delete).
1. Re-check the run's "Total Defects" count (and the Run detail page's "Defect Count" / "Defect ID's" column).

## Expected result

A deleted defect should no longer count anywhere -- Total Defects, Defect Count, and the Defect ID's column
should all decrease/update to reflect only defects that still genuinely exist.

## Actual result

Confirmed live (user's own data, not a constructed repro): defect issue #143 is genuinely deleted (@Issue.find_by
(id: 143)` -> `nil@), but:

```
ExecutionDefect.where(defect_issue_id: 143) => [[122, issue_status_result_id: 894]]   -- still exists
IssueRelation.where(issue_to_id: 143)        => []                                     -- core Redmine DID clean this up
Run #55's "Total Defects" (from the Runs listing screenshot) => 2   -- should be 1 (only #142 still exists)
```

Run #56 and #57 (both linked only to the still-existing #142) correctly show 1 each, confirming the counting
**logic itself** is otherwise fine (per the BUG-TCM-058 fix) -- the only gap is the missing cleanup-on-issue-delete.

## Suggested fix

Add a cleanup hook for this trigger too -- e.g. an `after_destroy` callback on `Issue` (or a `before_destroy` on
the defect side specifically) that destroys any `ExecutionDefect` rows where `defect_issue_id` matches the issue
being deleted, mirroring the same cleanup `IssueRelation`'s own `after_destroy` now performs for BUG-TCM-057.
Alternatively/additionally, have `total_defect_count`/`count_defects`/`ExecutionDefect.linked_defects` join
against `issues` and filter out rows whose `defect_issue` no longer exists, as a defensive backstop against any
other untracked deletion path.

## QA reference

Local bug file: bugs/open/BUG-TCM-061.md . Test case: TC-TCM-275 (TESTCASE_MANAGEMENT_TEST_RUNS.md). Related to
BUG-TCM-057 (closed, fixed in commit 1f671e0) -- same join table, different and uncovered trigger (deleting the
issue vs. deleting the relation).

---

## Production history (synced from #122803 on 2026-10-08)

### 2026-10-07 13:39 UTC — Vaishnavi Bhawsar

Fixed. Deleting a defect issue entirely (not just unlinking it) left behind the internal record connecting it to the test executions it had been linked to, so runs kept counting a defect that no longer existed in "Total Defects" and "Defect Count."

Deleting a defect issue now also cleans up those connecting records, the same way unlinking a defect from a specific execution already did. Counts update correctly as soon as the defect is gone.

For QA:
1. Link a defect to a test case's failed/blocked result; confirm the run's "Total Defects" count includes it.
2. Delete that defect issue entirely (not just the link — the issue itself).
3. Re-check the run's "Total Defects" / "Defect Count" — it should now correctly drop by one, with no leftover phantom count.

I verified this directly: linked a defect to an execution, confirmed the connecting record existed, deleted the defect issue outright, and confirmed the connecting record was automatically removed.

Screenshot attached shows the Runs listing page with "Total Defects" counts, all correctly reflecting only defects that still genuinely exist.

### 2026-10-07 14:23 UTC — Sourabh Singh

### Retest — FIXED

Retested on local Docker instance (localhost:3015), master commit `f3e44e2` (touches `lib/testcase_management/patches/issue_patch.rb`, new `after_destroy :rftc_cleanup_execution_defects_as_defect` hook), container restarted before retest.

**Repro:** linked a fresh defect to a Failed execution in run 56 (Defect Count 0 → 1, confirmed on the Runs listing), then deleted the defect issue entirely via the real UI/issue-delete action (not just the relation).

**Result:** Defect Count correctly dropped back to 0 immediately, and a direct check confirmed the underlying `ExecutionDefect` join row for that defect was actually destroyed (not just filtered at display time) — the new hook mirrors the same cleanup BUG-TCM-057 already does for relation deletion, now also covering the issue being deleted outright.

Confirmed fixed — closing.
