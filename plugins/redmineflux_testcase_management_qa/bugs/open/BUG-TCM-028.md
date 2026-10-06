# BUG-TCM-028

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
