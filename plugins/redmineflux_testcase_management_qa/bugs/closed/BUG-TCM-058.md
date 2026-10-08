# BUG-TCM-058

> **CLOSED — 2026-10-07.** Production #122769 (https://flux.zehntech.com/issues/122769) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.
> The original local bug file was lost (system reformatted before it was pushed); this file is rebuilt from the
> production issue's description and journal.

- Bug ID: BUG-TCM-058
- Production Redmine Issue ID: #122769 (https://flux.zehntech.com/issues/122769) — created 2026-10-07, assigned to Vaishnavi Bhawsar, Priority Medium, Defect Severity Medium-severity
- Title: Relations section's "Run" column shows only one run even when a defect is linked to the same test case across multiple runs
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

Found while verifying BUG-TCM-057: when the same defect is linked to the same test case across **multiple runs**,
how does the issue's **Relations** section show that? The Relations section does have a plugin-added "Run" column
(it is not plain Redmine core), but it only ever shows **one** run, regardless of how many runs/executions
actually link the two issues. For a defect genuinely linked across 3 different runs, the Relations panel makes it
look like only 1 run is involved.

## Root cause

`lib/testcase_management/patches/issues_helper_patch.rb#render_issue_relations_with_run_id` builds the "Run"
column like this:

```
content_tag('td',
  if other_issue.run.present?
    link_to(other_issue.run.name, run_path(other_issue.run, ...))
  elsif issue.run.present?
    link_to(issue.run.name, run_path(issue.run, ...))
  else
    ''.html_safe
  end,
  class: 'run_name', title: l(:label_run)
)
```

`other_issue.run` / `issue.run` is the issue's own **single scalar `run_id` association** -- set once, to
whichever run the issue happened to be linked from **first** -- exactly the same column @ExecutionDefect.linked
_defects@ was built to stop relying on in BUG-TCM-050 (closed), because it "only reflects wherever it was first
reported from, and says nothing about every OTHER execution it has since been linked to." That fix touched 5
call sites (`runs_helper.rb#defect_ids`, `issue_status_results_controller.rb#selected_defects`, and 3 spots in
`testcase_reports_controller.rb`) but not this one -- `issues_helper_patch.rb` was never updated to go through
the `ExecutionDefect` join instead, so it still has the exact defect BUG-TCM-050 fixed everywhere else.

## Steps to reproduce

1. Link the same defect to the same test case via Failed/Blocked results in 3 different runs.
1. Open the test case's own issue page and look at the Relations section's "Run" column for that defect.

## Expected result

The Run column should reflect that this defect is linked across all 3 runs (or at minimum not misleadingly imply
there's only one).

## Actual result

Only one run shows -- confirmed to be whichever run the relationship happened to be established from first, not
the most recent one, not all of them.

## Evidence

Issue #3 (Test Case A), defect #15, confirmed linked via 5 separate `IssueStatusResult` executions across 3
different runs:

```
IssueStatusResult.where(issue_id:3).where("defect_ids LIKE '%15%'").pluck(:id,:run_id,:defect_ids)
=> [[3, 1, "15"], [17, 1, "15"], [176, 1, "15"], [846, 51, "15"], [850, 48, "15"]]
  -- run 1: 3 separate executions, run 51: 1, run 48: 1
```

ExecutionDefect.joins(:issue_status_result).where(issue_status_results:{issue_id:3}, defect_issue_id:15)
  .pluck(:id,:issue_status_result_id)
=> [[1,3], [4,17], [12,176], [107,846], [110,850]]
  -- correctly 5 separate join rows, one per execution -- the join table itself is NOT the problem

Real browser (issues/3 page), Relations section, rendered row for defect #15:

```
<td class="run_name" title="Run">
  <a href="/runs/1?project_id=qa-demo">Regression — Release 6.2 / Sprint 24</a>
</td>
```

Only Run #1 ("Regression — Release 6.2 / Sprint 24") is shown -- runs #48 and #51, which this exact defect is
also linked to this exact test case through, are completely invisible here. A tester looking at this panel would
reasonably conclude the defect only came up once, in one run, when it has actually recurred across 3.

## Suggested fix

Route `render_issue_relations_with_run_id`'s "Run" column through the same `ExecutionDefect.linked_defects`-style
join lookup BUG-TCM-050 already introduced, instead of `other_issue.run`/`issue.run`'s single scalar column --
e.g. look up every distinct run (via `ExecutionDefect` -> `IssueStatusResult#run`) linking the two issues, and
either list all of them or at least show a count ("3 runs") with the full list on hover/click, rather than
silently picking one.

## QA reference

Local bug file: bugs/open/BUG-TCM-058.md . Test case: TC-TCM-272 (TESTCASE_MANAGEMENT_TEST_RUNS.md). Related to
BUG-TCM-050 (closed) -- same root-cause pattern, a 6th call site that fix missed.

---

## Production history (synced from #122769 on 2026-10-08)

### 2026-10-07 11:13 UTC — Vaishnavi Bhawsar

Fixed — same join-based lookup BUG-TCM-050 already introduced, applied to this one remaining spot.

The Run column now shows every run this exact defect-testcase link was actually recorded through, not just whichever one it happened to be reported from first. One run still shows as a plain link, same as before. More than one now shows a small "N runs" badge — click it and a short list drops down with every run, each a real link.

Screenshot attached: a defect genuinely linked across 2 runs, showing the "2 runs" badge expanded with both run links visible.

For QA:
1. Link the same defect to the same test case through Failed/Blocked results in at least 2 different runs.
2. Open that test case's issue page, check the Relations section's Run column for that defect — confirm it now shows a "2 runs" badge (or however many), not just one run.
3. Click the badge — confirm it expands to show every run, each clickable.
4. Confirm a defect linked through only one run still just shows that run's name directly (no badge needed for a single run).

### 2026-10-07 12:27 UTC — Sourabh Singh

Retested on fresh master (commit `1f671e0`, same commit as BUG-TCM-057's fix). The Relations panel's "Run" column for a defect-type relation now queries the `ExecutionDefect` join for every distinct run the pair is linked through, rendering a plain link when there's exactly one, or a clickable "N runs" badge with a popover listing all of them when there's more.

Confirmed live: a defect linked across 3 different runs to the same test case now shows a "3 runs" badge; clicking it lists all 3 run names correctly. Other relations linked through only one run still correctly show a plain single run link. Closing.
