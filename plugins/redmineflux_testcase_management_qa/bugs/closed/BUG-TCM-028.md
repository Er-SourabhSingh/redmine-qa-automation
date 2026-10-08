# BUG-TCM-028

> **CLOSED — 2026-10-06.** Production #121990 (https://flux.zehntech.com/issues/121990) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.

- Bug ID: BUG-TCM-028
- Production Redmine Issue ID: #121990
- Title: A project with zero Runs cannot create any report at all — "Runs must have at least one selected" blocks creation even with "Include all test run" selected (the default)
- Redmine version: 7.0.0
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.0.0
- Environment: Docker `localhost:3010` (project `tcm-permissions-private-test`)
- Browser: Chromium (Playwright, automation-first spec `TESTCASE_MANAGEMENT_REPORTS.spec.ts`)
- User role: Administrator
- Date: 2026-10-05

## Summary

`tcm-permissions-private-test` is a real project with the Testcase Management module enabled and zero Runs
created in it at all (built earlier for the Permissions suite's own non-member-access fixtures, never given a
Run). Attempting to create **any** report type there — Testcase Summary, Defect Summary, Tester Scorecard,
Overdue Run Summary (all 4 explicitly tried; Activity Summary/Requirement Coverage not tried but share the same
run-count validation path) — fails with **"Runs must have at least one selected"**, even though the form's
default Advanced Options radio is **"Include all test run"**, not "Only the following test runs". The validation
appears to count the project's actual Run rows rather than treating "Include all" as satisfied-by-definition when
that count is zero.

This directly contradicts `TESTCASE_MANAGEMENT_REPORTS.md` TC-TCM-095's own expected result for exactly this
scenario ("A project with the module enabled but no runs or results" / "Each renders an explicit empty state. No
blank page, no error...") — the actual behavior is a hard validation block, not a clean empty-state render. It
also means a brand-new project with the module enabled genuinely cannot produce its first report until at least
one Run exists, which is a materially different (and worse) UX than "shows zero data."

## Steps to reproduce

1. Use (or create) a project with the Testcase Management module enabled and zero Runs.
2. **Reports** → **New report** → leave **Advanced Options** at its default, **Include all test run**.
3. Select any report type, enter a Name, click **Create**.

## Expected result

- Per `TESTCASE_MANAGEMENT_REPORTS.md` TC-TCM-095, the report is created and renders an explicit empty state —
  no blank page, no error, no `NaN`/`undefined` in any figure.

## Actual result

- Creation is refused with **"Runs must have at least one selected"**, for every report type tried (Testcase
  Summary, Defect Summary, Tester Scorecard, Overdue Run Summary) — reproduced 4/4 times, live, via a direct
  Playwright script (not a UI misread). No report is ever created; the project's Reports list stays "No data"
  indefinitely, since there is no way to get past this validation without first creating a Run — a separate
  precondition this TC never asked the user to satisfy.

## Evidence

### Screenshot

![Zero-run project blocks all report creation with "Runs must have at least one selected"](../../screenshots/BUG-TCM-028/zero-run-project-blocks-all-report-creation.png)

### Console / log

```
Project: tcm-permissions-private-test (Testcase Management module enabled, 0 Runs)
POST /projects/tcm-permissions-private-test/testcase_reports (report_type=Testcase Summary, include_testcase=all)
  => re-rendered New report form with: "Runs must have at least one selected"
Repeated for Defect Summary, Tester Scorecard, Overdue Run Summary — identical result all 4 times.
```

## Test case coverage

Found while building the automation-first Playwright spec for `testcases/TESTCASE_MANAGEMENT_REPORTS.md`
(TC-TCM-095, "report with no data renders cleanly" — **FAIL**, this is the blocking defect). TC-TCM-097 (project
scope) required a workaround — a dedicated second project with one minimal Run was provisioned instead of
reusing this zero-run project for both TCs, since report creation in a genuinely zero-run project cannot
currently succeed at all.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers report creation on a zero-run
  project. Distinct from BUG-TCM-009 (project-membership/module-enabled access control) — this project IS
  correctly accessible to its real members; the defect is purely in the run-count validation on report creation.

## Production report

- Reported to `ztflux` as **#121990** on 2026-10-05, assigned to Sheetal Sharma. Priority: Medium | Defect
  Severity: Medium-severity | Defect priority: Medium | Defect Type: Functional. Linked via `report_defect` to
  Test Case **#121697** ("Sanity: Redmineflux Testcase Management — Final-Cycle Regression 2026-09-30"), Run
  **#592**, environment **"Window 11 + Chrome"** — confirmed via `get_run_testcases` showing #121990 in the
  testcase's linked defects list.

---

## Production history (synced from #121990 on 2026-10-08)

### 2026-10-06 08:29 UTC — Vaishnavi Bhawsar

Fixed. The validation was literally counting the project's actual runs rather than recognizing that "Include all test run" is satisfied by definition when there are no runs at all yet — so a brand-new project could never get its first report off the ground. Now, when a project has zero runs, that check is skipped entirely (there's nothing to select either way); it still correctly blocks "Only the following test runs" with nothing picked when the project DOES have runs.

Fix is committed and pushed (commit e5d3fae).

I verified it directly in a project with the module enabled and zero runs: creating a report with the default "Include all test run" option now succeeds (previously blocked every time), and the resulting report page opens cleanly with no error and no blank/NaN content.

One unrelated note found during testing: in my local demo environment specifically, saving a new report can briefly show a server error because this particular setup doesn't have its background job queue (Sidekiq/Redis) running — that's a one-off limitation of my test instance, not something this fix touches, and the report itself still saves correctly underneath it.

For QA:
1. Use a project with the Testcase Management module enabled and zero test runs.
2. Reports → New report → leave "Include all test run" selected (default) → pick any report type → Create.
3. Confirm the report is created (not blocked by a "Runs must have at least one selected" error) and its page opens showing an empty state, no crash.
4. In a project that DOES have runs, confirm "Only the following test runs" with nothing selected is still correctly blocked (no regression).

### 2026-10-06 13:32 UTC — Sourabh Singh

Retested 2026-10-06 against master 67631e0 — confirmed fixed via code read (commit e5d3fae). TestcaseReport#at_least_one_run now returns early (no validation error) when the project genuinely has zero runs yet.
