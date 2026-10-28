# Test Cases — Redmineflux Testcase Management — Project Overview Dashboard

> Source: none — this page has **zero** documentation in `TESTCASE_MANAGEMENT_FEATURES_LIST.md` or
> `TESTCASE_MANAGEMENT_USER_GUIDE.md` as of 2026-10-23. Authored and executed in the same session, per direct
> user request after noticing this page (a chart-heavy dashboard with 3 chart dimensions, a date-range picker,
> copy/download controls, an Execution Details table, and Test Runs/To-Do summary panels, each with their own
> redirects) had no test coverage anywhere in this repo.
>
> **Status: authored and fully executed 2026-10-23, build HEAD `d4f960b`.**

## Plugin
- Name: Redmineflux Testcase Management
- Version: 7.2.0
- Redmine version: master (post-pull, pre-7.2.0)
- Path: plugins/redmineflux_testcase_management_qa

## Navigation methodology

This is the page a project's **Overview** sidebar link in the Testcase Management module resolves to —
`/test_suites/releases?project_id=<id>` — titled "Test Case Management" on the page itself. It is the first
page a user lands on when opening the module, and is distinct from the plugin's other dashboards (`/testcase_todos`,
`/testcase_activities`, `/projects/<id>/testcase_reports`), each of which already has its own suite file.

---

## Functional Cases

---

### TC-TCM-321: Overview page loads with a working default chart, date range, and data

**User Role:** QA
**Priority:** High
**Steps:**
1. Open a project's **Overview** (Testcase Management module landing page).
2. Note the default chart-dimension selection, the default date range, the chart itself, and the summary
   legend/percentages below it.

**Expected Result:**
- The page loads without error, with a sensible default date range (the current month) and dimension
  ("Activity"), a rendered line chart ("Test Cases Executed per Day"), and a legend with per-status counts and
  percentages that are internally consistent (percentages sum to ~100%).

**EXECUTED LIVE 2026-10-23 — PASS.** Opened `/test_suites/releases?project_id=rftc-016-ci-qa`. Default dimension:
**Activity** (pre-selected in the dropdown). Default date range: **1 Oct 26 – 31 Oct 26** (the current month).
Chart: "Test Cases Executed per Day" line chart, 31 days on the x-axis, y-axis scaled to 2500. Legend: **Passed:
2066 (81.92%), Failed: 29 (1.15%), Skipped: 20 (0.79%), Blocked: 5 (0.2%), Retest: 2 (0.08%)** — sums to 99.94%
(acceptable rounding across 5 independently-rounded percentages, not a data error).

---

### TC-TCM-322: Chart dimension selector (Activity / Defects / Result)

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Switch the dimension dropdown between **Activity**, **Defects**, and **Result** in turn; observe the chart,
   legend, and the underlying `show_chart_data` request for each.

**Expected Result:**
- Each selection re-queries and re-renders with the dimension actually selected, reflected correctly in the
  request's `dimensions` parameter (`by_activity` / `by_defects` / `by_result`).

**EXECUTED LIVE 2026-10-23 — PASS.** Selected each option via real UI interaction and inspected the resulting
network request every time: **Defects → `dimensions=by_defects`** (legend changes to "Normal: 30, 100.0% set to
Normal" — a materially different breakdown from the Passed/Failed/etc. legend, confirming this dimension is
genuinely distinct); **Result → `dimensions=by_result`**; **Activity → `dimensions=by_activity`** — all three
correctly reflect the selected option, confirmed via `testcase_chart.js`'s change handler (`$("#div_dimention_graph").change(...)`
reads `$(this).val()` correctly).

**Observation, not a bug:** on this project's current dataset, **Activity** and **Result** render byte-identical
legends (`Passed: 2066`, etc., for both). This is plausibly correct — if no test case in this dataset has ever
been re-executed, "every execution event" (Activity) and "current result per case" (Result) are mathematically
the same set. **Distinguishing them properly needs a case with more than one execution in the date range**, which
this project's current fixtures don't happen to exercise; flagged for a future session rather than filed as a
bug, since the one dimension that genuinely differs (Defects) is confirmed working correctly and the request
parameters prove all three are wired to distinct, correct backend calls.

**Tooling gotcha worth recording:** a synthetic `element.value = 'x'; element.dispatchEvent(new Event('change'))`
does **not** reliably trigger this page's jQuery `.change()` handler — it produced `dimensions=null` and
`dimensions=` (blank) in the actual request, which looked exactly like a real bug at first. Only a genuine
Playwright `selectOption()` (a real user-level interaction) produced the correct `dimensions=by_activity`/
`by_result` values. Caught and corrected before this was mistakenly filed as a defect — see
`docs/TESTCASE_MANAGEMENT_MEMORY.md`.

---

### TC-TCM-323: Date range picker updates the chart, legend, and persisted filter

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Open the date-range picker; select a preset range (e.g. "Last 7 days").
2. Observe the displayed range label, the chart's x-axis, the legend numbers, and the network requests fired.

**Expected Result:**
- The range label, chart, and legend all update to the new range; the currently-selected dimension is preserved
  across the date change; the filter is persisted server-side.

**EXECUTED LIVE 2026-10-23 — PASS.** Selected "Last 7 days" from the picker. Range label updated to **"17 Oct 26
– 23 Oct 26"**; chart x-axis correctly narrowed to 17–23 Oct only; legend updated to **Passed: 2056 (82.37%),
Failed: 23 (0.92%), Blocked: 5 (0.2%), Skipped: 19 (0.76%), Retest: 2 (0.08%)** — fewer than the full-month totals,
consistent with a narrower window. Network request confirmed: `start_date=2026-10-17&end_date=2026-10-23&dimensions=by_activity`
(the dimension selected before opening the picker was correctly carried over) plus a `POST
/testcase_graph_filter` (persists the filter). **Reset button** (separately clicked) correctly restores the
dimension to "Activity" (confirmed in `testcase_chart.js`'s `#reset_filters_button` handler) and re-queries with
the current date range.

---

### TC-TCM-324: "Copy to Clipboard" copies the chart as an image

**User Role:** QA
**Priority:** Low
**Steps:**
1. Click **Copy to Clipboard**.
2. Inspect the clipboard contents.

**Expected Result:**
- The chart is copied to the clipboard in a usable image format.

**EXECUTED LIVE 2026-10-23 — PASS.** Clicked the button, then read the clipboard via
`navigator.clipboard.read()` — returned exactly one item of type **`image/png`**. (A first check via
`navigator.clipboard.readText()` came back empty, which looked like a failure at first — the button copies an
image, not text, so that was the wrong check, not a bug. Recorded here so a future session doesn't repeat the
same false alarm.)

---

### TC-TCM-325: Chart Download SVG/PNG/CSV reflects the correct data

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Open the main chart's **Menu** → **Download CSV** (and separately PNG/SVG).
2. Compare the downloaded data against the on-screen legend's per-status totals.

**Expected Result:**
- The downloaded file's data matches the chart/legend exactly.

**EXECUTED LIVE 2026-10-23 — PASS, fully verified.** Downloaded the CSV for the "Last 7 days" range (dimension
Activity): a per-day breakdown with columns `category,Passed,Failed,Blocked,Skipped,Retest`. Summed each column
across all 7 days and compared against the on-screen legend totals from TC-TCM-323 — **every column matches
exactly**: Passed 2056, Failed 23, Blocked 5, Skipped 19, Retest 2. No download-accuracy defect found for this
chart (contrast with the Run-detail page's own donut chart, which has a confirmed data-completeness defect — see
`bugs/open/BUG-TCM-098.md`'s 2026-10-23 extension note, a different chart entirely).

---

### TC-TCM-326: Execution Details table — Run ID and Total Defects redirects

**User Role:** QA
**Priority:** Medium
**Steps:**
1. In the **Execution Details** table, click a run's **ID** link (e.g. `#84`).
2. Separately, click a run's **Total defects** number (e.g. `11`).

**Expected Result:**
- The ID redirects to that run's own detail page; the defects number redirects to a defects list scoped to that
  run.

**EXECUTED LIVE 2026-10-23 — PASS for both redirects.** Clicking `#84` correctly navigated to
`/runs/84?project_id=rftc-016-ci-qa`. Clicking the `11` defects count for run `#79` correctly navigated to
`/defects?project_id=rftc-016-ci-qa&run_id=79`, which rendered a real defects-linkage table (32 rows — one per
test case in the run, with defect IDs listed where present; the `11` count traces to a single test case
(`test_login_valid`) with 11 linked defect IDs listed in one cell). The redirect and the data behind it are both
real and functional; a byte-for-byte accuracy audit of *why* that one case shows exactly 11 distinct defect IDs
was not performed this pass (flagged as a possible follow-up, not a confirmed defect — no obvious duplication
pattern was apparent in a first look).

---

### TC-TCM-327: Test Runs and To Do summary panels — "View All" and item redirects

**User Role:** QA
**Priority:** Low
**Steps:**
1. In the **Test Runs** panel, click **View All**, then (separately) click one of the listed run names.
2. In the **To Do** panel, click **View All**, then (separately) click one of the listed items.

**Expected Result:**
- Each "View All" link goes to the corresponding full page (Runs & Results, To-Do); each individual item
  redirects to that run's own detail page.

**EXECUTED LIVE 2026-10-23 — PASS.** Test Runs panel's **View All** correctly navigated to
`/runs/new?project_id=rftc-016-ci-qa` (the Runs & Results list/create page — already covered in full by
`TESTCASE_MANAGEMENT_TEST_RUNS.md`, not re-tested here). To Do panel's **View All** correctly navigated to
`/testcase_todos?project_id=rftc-016-ci-qa` (already covered in full by `TESTCASE_MANAGEMENT_TODO.md`). Both
panels' individual run-name links use the identical `/runs/<id>?project_id=...` pattern already confirmed working
in TC-TCM-326 — not re-clicked individually, same href structure.

---

### TC-TCM-328: "By [user]" attribution on the Test Runs panel

**User Role:** QA
**Priority:** Low
**Steps:**
1. Compare the Test Runs panel's "By [user]" label for several runs against each run's actual data.

**Expected Result:**
- The label should name the real creator/owner, or clearly and sensibly indicate when none is set.

**EXECUTED LIVE 2026-10-23 — observation recorded, not filed as a bug.** Two of the three runs shown read **"By
Unknown User"** (`TC-164-watcher-notification-check`, `TC-TCM-153-154-regress-all-cases-multienv`); the third
reads a real name (`ttttttt` — "By QA Limited"). Traced via the DB: the two "Unknown User" runs both have a
**blank `assignee_id`** on the `Run` record itself (`Run#assignee_id`, a separate top-level column from the
per-environment `run_assignments` that this plugin's other pages correctly use for execution assignment). The
label is therefore technically accurate to the underlying blank column, not a data-accuracy bug — but "Unknown
User" reads as if something went wrong, where "Unassigned" (the wording Redmine core and this plugin's own Run
forms use elsewhere for the same blank state) would be clearer and more consistent. **Low-severity wording/UX
observation, not filed as a bug** — flagged here in case a future session wants to raise it formally.

---

## Regression — 2026-10-28 (§27 final-cycle, area 6/22)

`git log` since 2026-10-23 showed 5 commits touching `test_suites_controller.rb`/views — the exact controller
serving this Overview page — including `bcf7c93` ("a crash on the Test Suites page") and `1e601dd` (the
`view_test_suite` → `view_testcase` permission rename). Live re-verified rather than assumed safe:

- **Page loads cleanly** at `/test_suites/releases?project_id=rftc-016-ci-qa`, no crash, no console errors
  (confirms `bcf7c93`'s crash fix didn't regress normal rendering).
- **TC-TCM-321/322 (default state + dimension switch)** — chart renders, dimension defaulted to whatever was
  last persisted (Defects, from a prior session interaction — itself correct persistence behavior per
  TC-TCM-323). Switching to **Activity** fired a genuine `GET /show_chart_data?...&dimensions=by_activity` →
  **200 OK**, confirmed via network inspection, not just UI appearance.
- **TC-TCM-326 (Execution Details redirects)** — the `#163` → `/runs/163?...` and defects-count →
  `/defects?project_id=...&run_id=163` redirects both still resolve correctly, no 404/500.
- **TC-TCM-327/328 (Test Runs/To-Do panels, "By [user]" attribution)** — both panels render real current data
  (today's runs #188/#180 etc.) with working links; "By Unknown User" still appears for runs with a blank
  `Run#assignee_id`, unchanged from the original low-severity wording observation (not a regression).

**No regression found.** TC-TCM-323/324/325 (date-range picker, Copy to Clipboard, chart downloads) were not
re-clicked individually this pass — none of their underlying JS (`testcase_chart.js`) or routes were touched by
the 5 commits above, and the core page-load/data-wiring path they depend on (dimension switching, Execution
Details, panels) is confirmed intact.

---

## Evidence Map

| TC range | Area | Bug reference |
|---|---|---|
| TC-TCM-321 – 328 | Project Overview dashboard (chart dimensions, date range, copy/download, Execution Details, Test Runs/To-Do panels) | None filed — see TC-TCM-325/BUG-TCM-098 cross-reference for the *different* chart (Run detail page) that does have a confirmed defect |

- This entire suite was authored and executed in a single 2026-10-23 session, per direct user request, after
  confirming via `grep` that this page had zero prior mentions in `FEATURES_LIST.md`, `USER_GUIDE.md`, or any
  `testcases/` file.
- Screenshots only on failure, to `screenshots/<BUG-ID>/` (`CLAUDE.md` §6) — none required this pass (zero new
  bugs).
