# BUG-TCM-050

> **CLOSED — 2026-10-07.** Production #122689 (https://flux.zehntech.com/issues/122689) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.
> The original local bug file was lost (system reformatted before it was pushed); this file is rebuilt from the
> production issue's description and journal.

- Bug ID: BUG-TCM-050
- Production Redmine Issue ID: #122689 (https://flux.zehntech.com/issues/122689) — created 2026-10-07, assigned to Vaishnavi Bhawsar, Priority Medium, Defect Severity Medium-severity
- Title: A defect linked via the Defects* search box is silently excluded from the Add Result popup, the Run's Defect Count, the Run's Defects page, and Reports' defect counts
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

Found immediately after BUG-TCM-014/047 were confirmed fixed (the Defects* field can now search and genuinely link any pre-existing defect in the project, not just one already tied to the current test case). That fix exposed a new, distinct gap: a defect linked this way -- found via search, not freshly created via "Report Defect" -- behaves inconsistently with one created directly from the Run.

- **"Report Defect"-created defect** (e.g. #111): its `run_id`/`environment` columns are stamped with the current run and environment at creation time. Reopening the Add Result popup for this execution correctly shows it in the Defects* field, and the Run's "Defect Count"/"Total Defects" correctly includes it.
- **Searched-and-linked existing defect** (e.g. #110): its `IssueRelation(relation_type: 'defect')` to the test case is created correctly, and it **does** show up in the Run execution grid's own "Defect ID's" column. But its own `run_id`/`environment` columns reflect wherever that defect was originally created -- in this case `run_id: nil, environment: nil`. Every other place that re-derives "which defects are linked to this execution" by filtering `Issue.where(..., run_id: `run.id, environment: `selected_environment)` -- rather than just following the `IssueRelation` -- silently excludes it.

## Root cause

Five call sites across four features share the identical bug -- they derive "defects linked to this run/environment" by intersecting the `IssueRelation` lookup with the **defect Issue's own** `run_id`/`environment` columns, instead of trusting the relation alone:

- `app/helpers/runs_helper.rb#defect_ids` -- feeds the Run's "Defect Count"/"Total Defects" stat.
- `app/controllers/issue_status_results_controller.rb#selected_defects` -- feeds the Add Result popup's pre-selected Defects* field on reopen.
- `app/views/runs/defect.html.erb` -- the Run's own "Defects" page, reached via the "Total Defects" link, reuses the same broken `defect_ids` helper per environment section.
- `app/controllers/testcase_reports_controller.rb`'s `summary` report chart-data block -- checks the defect's own `run_id`/`environment` **before** even consulting the `IssueRelation`.
- `testcase_reports_controller.rb`'s own separate `defect_ids` private method -- feeds the `tester_scorecard` report type's "Defects Reported" column, on-screen and in its Excel export.

A defect's `run_id`/`environment` are single scalar columns set once (effectively "where was this defect first reported from"), but linking (`IssueRelation`) is many-to-one -- one existing defect can legitimately be linked to test case executions across many different runs/environments. Filtering by the defect's own `run_id`/`environment` can only ever match the one run/environment it happened to be created under -- never any other execution it's since been linked to.

## Steps to reproduce

1. On a Failed/Blocked execution, use the Defects* field's search box to find and link an already-existing defect that was never created from this specific run.
1. On the same or another execution in the same run, use "Report Defect" to create a brand-new defect instead.
1. Note the Run's "Total Defects"/"Defect Count" value.
1. Reopen the Add Result popup for the execution from step 1.
1. Also check the Run execution grid's "Defect ID's" column for that row.
1. Also open the Run's own "Defects" page and check every environment section it renders.
1. Also open a summary-type Report covering this run and check its defect chart/count per environment.
1. Also open a Tester Scorecard report covering this run and check its "Defects Reported" column.

## Expected result

The Run's "Total Defects"/"Defect Count", the Add Result popup's reopened Defects field, the Run's Defects page, and both Report types should count every defect genuinely linked via `IssueRelation`, regardless of whether it was created fresh or found via search.

## Actual result

Run #28's "Total Defects" showed 1, even though 2 real `IssueRelation(relation_type: 'defect')` rows existed for the test case in this run. Reopening Add Result showed only the "Report Defect"-created defect as a selected chip -- the search-linked one was missing entirely, despite correctly appearing in the grid's own "Defect ID's" column. The Run's own Defects page showed the same gap across both of its environment sections. The summary Report's chart-data query and the Tester Scorecard's "Defects Reported" column both independently reproduced the identical undercount -- confirmed by replicating each controller's exact query via Rails console and matching the live screenshots exactly.

## Evidence

```
Relation -> defect #110 subject="D!" run_id=nil environment=nil   (linked via search)
Relation -> defect #111 subject="d2" run_id=28  environment="Window 11 + Chrome"   (linked via Report Defect)

runs_helper.rb#defect_ids / issue_status_results_controller.rb#selected_defects / runs/defect.html.erb /
testcase_reports_controller.rb (summary chart + tester_scorecard defect_ids): all filter by
Issue.where(..., environment: ?, run_id: ?) instead of trusting the IssueRelation alone, so defect #110
is excluded from every one of these five locations while #111 is counted correctly in each.
```

## Suggested fix

Stop re-deriving "linked defects" by filtering the defect Issue's own `run_id`/`environment` columns, anywhere it happens. All five call sites should trust the `IssueRelation(relation_type: 'defect')` rows alone (optionally still scoped by `tracker_id` to stay within the configured Defect tracker), the same way the Run execution grid's own "Defect ID's" column already does correctly. Given how many independent copies of this same filter already exist, this is a good candidate for one shared helper that every call site delegates to.

## Environment

- Redmine version: 6.x (Docker)
- Plugin version: 7.1.0
- Environment: Docker localhost:3015 (project compat-fresh-project)
- User role: QA Manager / Administrator

---

## Production history (synced from #122689 on 2026-10-08)

### 2026-10-07 05:52 UTC — Vaishnavi Bhawsar

Fixed all five places this showed up, plus one more of the same kind I found while fixing it (a sixth spot feeding the run's own test-case data).

The real problem: a defect you find and link yourself (instead of reporting a brand-new one) was being counted by checking where that defect itself was originally logged from, instead of checking that it's actually linked here. A defect first logged somewhere else and later linked to this run/environment was being skipped everywhere except the one place that already did this correctly. Now every one of these spots checks the actual link, not the defect's own original details.

Screenshot attached: same test case showing both a freshly-reported defect and a separately-linked existing defect, both now counted together in the run's Defect Count and both pre-filled when reopening that result.

For QA:
1. On a Failed/Blocked result, use the Defects search box to link an existing defect that was NOT originally reported from this run.
2. Separately report a brand-new defect on the same or another execution in the same run.
3. Confirm the run's Defect Count includes both.
4. Reopen Add Result for the first execution — confirm both defects are pre-selected.
5. Open the run's own Defects page and confirm both appear.
6. Check a Summary report and a Tester Scorecard report covering this run — confirm both are counted in each.

### 2026-10-07 07:25 UTC — Sourabh Singh

Retested on master `c43c588` (commit 296a5d3, which cites this bug by name). The fix centralizes all five affected locations onto one new ExecutionDefect.linked_defects method, scoped by the execution's own IssueStatusResult rows via the join table instead of the defect Issue's own run_id/environment columns. Verified with a clean cross-run test: linked a real same-project defect with blank run_id/environment to a new execution, and confirmed it now correctly appears in the Run defect count, Add Result reopen, the summary report chart, and the Tester Scorecard -- all four previously-broken locations. Closing.
