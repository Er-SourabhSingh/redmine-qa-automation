# BUG-TCM-081

- Bug ID: BUG-TCM-081
- Production Redmine Issue ID: #124160 (https://flux.zehntech.com/issues/124160) — assigned to Vaishnavi Bhawsar, priority Low, Defect Type Functional / Defect Severity Low-severity / Defect priority Low, target version Testcase Management plugin Release 7.2.0. Linked to production Testcase #123984 (Most Failed Tests export formats) in Run #612, environment Win + Chrome + Ver6.
- Title: Most Failed Tests report's "Download PDF" button export has a table-layout glitch — the "Failing Runs" drilldown column's rows overlap and misalign the Failures/Executed/Failure Rate columns
- Severity: Low
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: master (post-7.1.0, post plugin-code pull on 2026-10-21)
- Environment: Docker `localhost:3000` (`redmine6-redmine-1`), project `RFTC-016 CI Ingest QA` (id=2), report #13 "Export XSS Check" (Most Failed Tests)
- Browser: Chromium (Playwright)
- User role: Administrator
- Date: 2026-10-21

## Summary

Found while retesting `BUG-TCM-076` (missing chart in PDF export) against freshly-pulled plugin code. That bug's
own symptom (missing chart) is now fixed — the Most Failed Tests PDF now includes a correctly-captured chart
image. However, the same PDF's **table** has a layout defect: the "Failing Runs" column (which on the live page
is an expandable `<details>/<summary>` drilldown listing each failing run) does not collapse cleanly in the PDF
capture — its content bleeds across row boundaries, visually overlapping and misaligning the Failures/Executed/
Failure Rate values of several other rows.

This is a different, narrower defect than `BUG-TCM-076` (which is about the chart being absent entirely): the
chart is fine; only the table's handling of the expandable drilldown column is broken in the PDF capture. The
Slow Tests report (which has no drilldown column) renders its table cleanly in the same "Download PDF" pipeline,
confirming this is specific to reports whose table includes a `<details>` drilldown cell.

## Steps to reproduce

1. Log in as Administrator, open project `RFTC-016 CI Ingest QA`.
2. Open report #13 "Export XSS Check" (`/testcase_reports/13?project_id=rftc-016-ci-qa`, type Most Failed Tests)
   — confirm the live page's table renders correctly, with each row's "Failing Runs" cell as a collapsed
   `<details>` element that expands on click.
3. Click the download menu → **Download PDF**.
4. Open the downloaded PDF and inspect the table.

## Expected result

- The PDF's table should render each row cleanly, with the "Failing Runs" column's content (the list of runs,
  shown collapsed with an expand affordance on the live page, or however the PDF chooses to represent it)
  contained within its own row — matching the clean per-row layout the HTML export and live page both show.

## Actual result

- `pdftotext -layout` extraction of the PDF shows column values and drilldown run-listings interleaved across
  rows rather than per-row, e.g.:
  ```
  Rank  Test Case                                  Failures Executed Failure              Failing Runs
  1     #2048 Cross-run reuse fixture                                               Rate
  2                                                                                       2 CrossRunReuse A · CI · 2026-10-19 10:01:38 UTC CrossRunReuse B · CI · 2026-10-19 10:01:29
  3                                                2                    2  100.0%         UTC
  ```
  Numeric values (Failures/Executed/Failure Rate) and the drilldown run-listing text are visually scattered
  across the wrong rows rather than aligned to their own row — the underlying data is still present somewhere in
  the document (all 5 test cases, all run names, all percentages are findable), but the table is not usable as a
  readable grid in this PDF.
- By contrast, this same report's chart (fixed per `BUG-TCM-076`'s retest) and the Slow Tests report's entire
  table (no drilldown column) both render cleanly in the same "Download PDF" pipeline — isolating this to the
  `<details>`/drilldown cell specifically.

## Root cause (inferred)

The PDF capture (likely `html2canvas`, per the script tags this plugin's report pages load) probably captures the
table's visual layout at a point where one or more `<details>` elements are expanded, or the capture's internal
page-break/row-height logic doesn't account for a `<details>` cell's variable/collapsed height correctly,
causing its content to render past its own row's boundary and overlap adjacent rows.

## Suggested fix

Ensure all `<details>` elements in the report table are explicitly collapsed (not relying on default browser
state) before the PDF capture step runs, and verify the capture tool correctly measures each row's height
including a collapsed `<details>` cell's closed-state height, not its potential expanded height.

## Evidence

- `screenshots/BUG-TCM-076/retest-2026-10-21-most-failed-pdf-button.pdf` (same file used to confirm BUG-TCM-076's
  chart fix also shows this table glitch)

## Test case coverage

Found during this session's retest of `BUG-TCM-076` against freshly-pulled plugin code. Not yet mapped to an
automation TC — "Download PDF table layout for reports with a drilldown column" is not currently covered in
`testcases/`; should be added as a dedicated TC once this is fixed (Traceability Matrix gap, same pattern as
BUG-TCM-075/076/077/078/080).

## Duplicate check

- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers a table-layout/overlap glitch in
  PDF exports. `BUG-TCM-076` is the chart being completely absent (now fixed); this bug is the table's own
  layout breaking for a specific column type, a different symptom in the same export pipeline. Not a duplicate.

## Production report

Reported 2026-10-21 as issue #124160 on `ztflux`, via `redmineflux_core_create_issue`, per explicit user approval.
Linked to production Testcase #123984 in Run #612 via `report_defect`.
