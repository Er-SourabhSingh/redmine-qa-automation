# BUG-TCM-060

> **CLOSED — 2026-10-07.** Production #122800 (https://flux.zehntech.com/issues/122800) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.
> The original local bug file was lost (system reformatted before it was pushed); this file is rebuilt from the
> production issue's description and journal.

- Bug ID: BUG-TCM-060
- Production Redmine Issue ID: #122800 (https://flux.zehntech.com/issues/122800) — created 2026-10-07, assigned to Vaishnavi Bhawsar, Priority Medium, Defect Severity Medium-severity
- Title: Run page's "Testcase" filter (With Defects/Without Defects) matches on a defect's stale scalar columns, not the real ExecutionDefect link
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

User reported: linking an **existing** defect to a test case, then using the Run page's **Testcase** filter ("With
Defects" / "Without Defects") inside that run, gives wrong results. Confirmed in code: this filter is an *8th
call site* using the exact same anti-pattern already fixed at 5 sites by BUG-TCM-050, found unfixed at a 6th site
(Relations panel) in BUG-TCM-058, and a 7th site (`total_defect_count`) fixed in commit `1f671e0` -- this filter
was not touched by either fix and still has the bug.

## Root cause

`RunsController` (private filtering method, `app/controllers/runs_controller.rb:809-827`):

```
if @filter.testcase == 'with_defects'
  issue_ids = scope.pluck(:id)
  defect_ids = Setting.plugin_redmineflux_testcase_management['defected_tracker']&.map(&:to_i)
  issues_defect_ids = IssueRelation.where(issue_from_id: issue_ids, relation_type: 'defect').select(:issue_to_id)
  defect_ids = Issue.where("id IN (?) AND tracker_id IN (?) AND environment = ? AND run_id = ?",
                           issues_defect_ids, defect_ids, environment, @run.id).pluck(:id)
  testcase_ids = IssueRelation.where(issue_to_id: defect_ids).pluck(:issue_from_id).uniq
  scope = scope.where(id: testcase_ids)
elsif @filter.testcase == 'without_defects'
  # identical shape, scope.where.not(id: testcase_ids) at the end
end
```

The second query filters candidate defect Issues by `environment = ? AND run_id = ?` -- the *defect issue's own
scalar `environment`/`run_id` columns*, set once to wherever that defect happened to be first reported/linked
from. It does not go through `ExecutionDefect`/`ExecutionDefect.linked_defects` (the join-table-based lookup
BUG-TCM-050 introduced specifically because this exact scalar-column pattern "only reflects wherever it was first
reported from, and says nothing about every OTHER execution it has since been linked to"). So:

- A defect linked to a test case in run/environment **A**, whose own `run_id`/`environment` scalar columns happen
  to point at a **different** run/environment **B** (e.g. because it was first reported there, or linked via the
  proper `ExecutionDefect`-based flow which never touches these scalar columns at all), will not match this
  filter's `Issue.where(... environment: ? AND run_id: ?)` clause for run A -- "With Defects" will silently
  exclude a test case that genuinely has a defect in this run, and "Without Defects" will wrongly include it.
- Conversely a defect whose scalar columns happen to coincidentally match the run/environment being filtered
  will "accidentally" show up correctly -- which is why a quick before/after check can look fine on one data set
  but still be broken in general.

This is the identical disease as BUG-TCM-050 (5 sites fixed), BUG-TCM-058 (Relations panel, fixed in `1f671e0`),
and the pre-fix `total_defect_count` (also fixed in `1f671e0`) -- just an 8th call site neither fix reached.

## Steps to reproduce

1. Create/identify a defect issue whose own `run_id`/`environment` columns point somewhere other than the run you
  are about to test in (e.g. a defect originally reported from a different run, or one whose link was
  established purely via the `ExecutionDefect` join without ever setting these scalar columns).
1. Link that defect to a test case inside a **different** run/environment (the one you want to filter in).
1. On that run's page, apply the **Testcase** filter -> **With Defects**.

## Expected result

The test case with the genuinely-linked defect should appear under "With Defects" (and be excluded from "Without
Defects"), regardless of which run/environment the defect issue's own scalar columns happen to reference.

## Actual result

The filter's match/no-match outcome depends on the defect issue's own stale `run_id`/`environment` columns, not
on whether it's actually linked to the test case in the run/environment currently being viewed -- producing
wrong results whenever those happen to diverge.

## Suggested fix

Replace both branches' defect-matching query with the same `ExecutionDefect`-join-based approach already used
elsewhere (e.g. build the "which test cases have a defect in this run/environment" set directly from
`ExecutionDefect.joins(:issue_status_result).where(issue_status_results: { run_id: `run.id, environment:
environment, issue_id: issue_ids })@, rather than filtering defect Issues by their own scalar columns and then
working backward through `IssueRelation`).

## QA reference

Local bug file: bugs/open/BUG-TCM-060.md . Test case: TC-TCM-274 (TESTCASE_MANAGEMENT_TEST_RUNS.md). Same
root-cause family as BUG-TCM-050 (closed) and BUG-TCM-058 (closed, fixed in commit 1f671e0).

---

## Production history (synced from #122800 on 2026-10-08)

### 2026-10-07 13:39 UTC — Vaishnavi Bhawsar

Fixed. The run page's "With Defects" / "Without Defects" filter used to check a defect's own stored run/environment info to decide whether it counted for the run you're currently viewing. That info only reflects wherever the defect happened to be first reported from, so a defect genuinely linked to a test case in the run you're viewing could still be invisible to this filter if its own stored info pointed somewhere else (or vice versa for "Without Defects").

The filter now checks the real, direct link between the test case and the defect for the run/environment actually being viewed, the same reliable way several other places in this plugin already do, instead of the defect's own stored info.

For QA:
1. Link a defect to a test case's failed/blocked result in a specific run/environment.
2. Open that run, apply the "Testcase" filter to "With Defects."
3. That test case should now reliably appear, and correctly disappear from "Without Defects" — regardless of where that defect was originally reported from.

Screenshot attached shows the fix working: the "With Defects" filter on a run page correctly narrowing the list down to only the test cases genuinely linked to a defect in that run.

### 2026-10-07 14:23 UTC — Sourabh Singh

### Retest — FIXED

Retested on local Docker instance (localhost:3015), master commit `f3e44e2` (touches `app/controllers/runs_controller.rb`), container restarted before retest.

**Repro:** created a fresh defect via the plain New Issue form (no run association, so its own `run_id`/`environment` scalar columns are nil — the exact "stale columns don't match this run" scenario), linked it to a real Failed execution in run 55 via the real `link_defect` endpoint, then applied the Testcase "With Defects" / "Without Defects" filter on that run.

**Result:** "With Defects" now correctly **includes** the test case (previously it would have been excluded, since the old code matched against the defect's own stale scalar columns, not the real link) and "Without Defects" correctly **excludes** it. The filter now reads through the real `ExecutionDefect` join, same fix family as BUG-TCM-050/057/058.

Confirmed fixed — closing.
