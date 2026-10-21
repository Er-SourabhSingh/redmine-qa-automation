# BUG-TCM-068

- Bug ID: BUG-TCM-068
- Production Redmine Issue ID: #123979 (https://flux.zehntech.com/issues/123979) — assigned to Vaishnavi Bhawsar, target version Testcase Management plugin Release 7.2.0. Linked to production Testcase #123977 ("Slow Tests report export formats: HTML, PDF and Excel") in Run #612, environment Win + Chrome + Ver6.
- Title: Slow Tests report's Excel export is completely empty — no "Rank" column, no data rows, and a wrong "No timing data yet: 0" regardless of the real count
- Redmine version: 6.x (Docker `localhost:3000`, Postgres)
- Plugin name: redmineflux_testcase_management
- Plugin version: master (post-7.1.0, pre-7.2.0 — rftc-016/017/020/021/038/042/043/044 merged)
- Environment: Docker `redmine6-redmine-1`, project `RFTC-016 CI Ingest QA` (id=2), report #3 "Slow Tests - QA check"
- Browser: Chrome (via Playwright), Windows
- User role: Admin
- Date: 2026-10-19

## Steps to reproduce

1. Open an existing "Slow Tests" report on the web (`/testcase_reports/3?project_id=rftc-016-ci-qa`) — confirm
   the on-screen table shows real ranked data (8 rows: `#26`, `#23`, `#24`, `#27`, `#33`, `#34`, `#35`, `#36`,
   with Rank/Test Case/Samples/Avg/Max/p95/Flag columns, footer "No timing data yet: 1").
2. Click the report's download menu → **Download Excel**.
3. Open the downloaded `report_3.xlsx`.
4. For comparison, also click **Download PDF** and **Download HTML** on the same report and open both.

## Expected result

The Excel file should contain the same data as the on-screen report and the PDF/HTML exports: a header row with
all 7 columns (**Rank**, Test Case, Samples, Avg, Max, p95, Flag), one row per ranked test case (8 rows in this
case), and an accurate "No timing data yet: 1" footer line.

## Actual result

The Excel file is effectively empty:
- Header row has only **6 columns** — `Test Case, Samples, Avg, Max, p95, Flag` — the **"Rank" column is missing
  entirely**.
- **Zero data rows.** Row 5 (where the first test case should start) is a completely blank row; the sheet's own
  dimension is `A1:A7` — only 7 rows total (title, subtitle, blank, header, blank, threshold line, untimed-count
  line). None of the 8 real test cases appear anywhere in the file.
- The footer reads **"No timing data yet: 0"** — wrong; the live page and the HTML/PDF exports all correctly say
  "No timing data yet: 1" at the same moment.

By contrast, in the same session, for the same report:
- **PDF export: correct.** All 8 rows present with the Rank column, exact values matching the live page (only the
  footer threshold/untimed-count line is omitted from the PDF, a separate minor gap, not part of this bug).
- **HTML export: fully correct.** Rank column, all 8 rows, and the correct "No timing data yet: 1" footer.

So the defect is isolated specifically to the Excel export path for Slow Tests reports.

## Root cause

`TestcaseReportsController#export_excel` (`app/controllers/testcase_reports_controller.rb:346`) builds the
workbook by calling `generate_slow_test_report(worksheet)`, which reads two instance variables:

```ruby
Array(@slow_tests).each do |row|
  ...
end
worksheet.add_row excel_safe_row(["#{l(:label_no_timing_data)}: #{@untimed_count.to_i}"])
```

But `@slow_tests` and `@untimed_count` are **only ever computed in the `show` action**
(`app/controllers/testcase_reports_controller.rb:282`):

```ruby
@slow_tests, @untimed_count = calculate_slow_test_results(@runs)
```

`export_excel` never calls `show` or `calculate_slow_test_results` itself — it only does
`@report = TestcaseReport.find(params[:id])` and loads `@runs`, then jumps straight into
`generate_slow_test_report`. Since `@slow_tests` is `nil` in this action, `Array(@slow_tests)` evaluates to `[]`
(an empty array), producing zero data rows, and `@untimed_count.to_i` evaluates `nil.to_i` → `0`, producing the
wrong "No timing data yet: 0" regardless of the real count.

This is exactly why PDF export is unaffected: `export_pdf1` (`app/controllers/testcase_reports_controller.rb`
just below `export_excel`) calls `show` first (`html_content = render_to_string(template: 'testcase_reports/show'...)`
after calling `show`), which populates `@slow_tests`/`@untimed_count` before the template renders. `export_excel`
has no equivalent call.

## Suggested fix

In `export_excel`, before dispatching on `@report.report_type`, call the same per-type calculation the `show`
action performs (or simply invoke the relevant private method, e.g. for `slow_test`:
`@slow_tests, @untimed_count = calculate_slow_test_results(@runs)` using `@runs = @report.runs.includes(issues: :issue_status_results)`), mirroring the `show` action's own per-branch setup for whichever `@report.report_type`
is being exported. This likely affects any other report type whose Excel generator method similarly depends on
instance variables that only `show` populates — worth auditing `generate_activity_report`,
`generate_summary_report`, `generate_testcase_report`, `generate_scorecard_report`,
`generate_overdue_run_report`, and `generate_testplan_report` for the same pattern.

## Evidence

### Console / log

Excel (`xl/worksheets/sheet1.xml`, unzipped):
```xml
<dimension ref="A1:A7"></dimension>
...
<row r="4"><c r="A4"><is><t>Test Case</t></is></c><c r="B4"><is><t>Samples</t></is></c>
  <c r="C4"><is><t>Avg</t></is></c><c r="D4"><is><t>Max</t></is></c>
  <c r="E4"><is><t>p95</t></is></c><c r="F4"><is><t>Flag</t></is></c></row>
<row r="5"></row>
<row r="6"><c r="A6"><is><t>Slow-test threshold: 5000 ms</t></is></c></row>
<row r="7"><c r="A7"><is><t>No timing data yet: 0</t></is></c></row>
```
(No "Rank" header column; no data rows between the header at row 4 and the blank row 5.)

PDF (same report, correct, for comparison):
```
Rank Test Case Samples Avg Max p95 Flag
1 #26 Checkout flow renders correctly 1 5.0 s 5.0 s 5.0 s
2 #23 test_login_valid 3 2.9 s 7.5 s 7.5 s Slow
3 #24 Apply valid discount code at checkout 5 1.07 s 2.5 s 2.5 s
4 #27 Checkout flow renders correctly 1 0 ms 0 ms 0 ms
5 #33 Login with invalid password 1 0 ms 0 ms 0 ms
6 #34 Add item to cart 1 0 ms 0 ms 0 ms
7 #35 Remove item from cart 1 0 ms 0 ms 0 ms
8 #36 Password reset email is sent 1 0 ms 0 ms 0 ms
```

HTML (same report, correct, for comparison): contains `Rank`, `Samples`, `test_login_valid`, `Checkout flow
renders...`, and `No timing data yet: 1`.

Code references:
- `app/controllers/testcase_reports_controller.rb:346` — `export_excel` (missing the calculation call)
- `app/controllers/testcase_reports_controller.rb:282` — where `@slow_tests`/`@untimed_count` are actually
  computed, only inside `show`
- `app/controllers/testcase_reports_controller.rb:988-1010` — `generate_slow_test_report`, which silently
  tolerates `@slow_tests` being `nil`

## Duplicate check

- Duplicate found: No
- Checked `bugs/_index.md` and `bugs/_duplicates.md` — no existing bug covers report export functionality for
  any report type in this plugin.

## Retest — 2026-10-21 (FIXED)

Retested against `localhost:3000` after the user pulled updated plugin code into `C:\redmine v6\plugins` and the
stack was restarted. Downloaded report #3's Excel export live via the browser session (`fetch()` to
`/testcase_reports/3/export_excel?project_id=2`, base64-decoded to a real `.xlsx`, unzipped and inspected
`xl/worksheets/sheet1.xml` directly — `screenshots/BUG-TCM-068/retest-2026-10-21-slow-tests-excel.xlsx`):

- **Rank column now present** — header row is the full 7 columns (`Rank, Test Case, Samples, Avg, Max, p95,
  Flag`), not the previous 6.
- **All 8 data rows present**, matching the live page and PDF export exactly (same test case subjects, same
  Avg/Max/p95 values, including the XSS-fixture test case's subject correctly inline-escaped as inert text).
- **Footer now correct** — `No timing data yet: 4` (an accurate count reflecting this report's current data, not
  a hardcoded value), not the previous always-`0`.
- **Verdict: FIXED.** Moving this bug to `bugs/closed/`.
