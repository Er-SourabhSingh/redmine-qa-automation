# Bug Report Template

- Bug ID: BUG-DSH-007
- Production Redmine Issue ID: #121135 (ztflux, https://flux.zehntech.com/issues/121135) — linked as a defect to Test Case #121093, Run #577, Test Suite #249, Environment "Window 11 + Chrome"
- Title: Bar and Line chart-template query widgets show the query name in the legend instead of the grouped category label (Doughnut/Pie are correct)
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Analytics Dashboard (`redmineflux_dashboard`)
- Plugin version: 7.0.0
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Browser: Playwright MCP (Chromium)
- User role: Administrator
- Date: 2026-09-23

> **Source:** user noticed the mismatch directly (screenshot of a Bar chart showing a single bar at X-axis
> category "Not set", with a legend swatch labelled "Closed Only Query 120436" instead of "Not set") and asked
> for it to be tested carefully. Reproduced exactly, and found it also affects Line charts; confirmed Doughnut and
> Pie are correct.

## Steps to reproduce

1. Open a project's Dashboard tab.
2. Add the **same saved issue query** as all four chart templates, one widget each: **Doughnut**, **Pie**, **Bar**,
   **Line** (any grouping dimension; a single-segment/single-bar result makes the mismatch obvious, but it applies
   regardless of how many categories there are).
3. Compare each widget's legend text against its own axis/segment labels.

## Expected result

- Every chart template should show the same legend content for the same underlying data: one legend entry per
  grouped category (e.g. "Not set", "Closed", "Green"), consistent with how Doughnut and Pie already render it.

## Actual result

- **Doughnut and Pie: correct.** Legend shows the category label(s) — e.g. "Closed" for one widget, "Not set" for
  another — confirmed both via the rendered DOM/Chart.js legend items and visually.
- **Bar and Line: wrong.** The legend shows the **query's own name** ("Closed Only Query 120436") instead of the
  category label the bar/line point is plotted against. Confirmed via `Chart.getChart(canvas).legend.legendItems`
  (the actual rendered legend text Chart.js produced), not just a visual read:
  - Doughnut: `categoryLabels: ["Closed"]` → rendered legend: `["Closed"]` ✅
  - Pie: `categoryLabels: ["Not set"]` → rendered legend: `["Not set"]` ✅
  - Bar: `categoryLabels: ["Not set"]` → rendered legend: `["Closed Only Query 120436"]` ❌
  - Line: `categoryLabels: ["Closed"]` → rendered legend: `["Closed Only Query 120436"]` ❌
- **Root cause, from the data shape**: all four widgets share the same underlying `chart_data.datasets[0].label`
  ("Closed Only Query 120436", the query name) alongside `chart_data.labels` (the real category names). Chart.js's
  *default* legend behaviour differs by chart family — Doughnut/Pie legends are keyed per data point by default,
  Bar/Line legends are keyed per dataset by default — so whatever custom legend configuration the plugin applies
  to make Doughnut/Pie show category labels was evidently never applied to the Bar/Line code path, which is just
  falling back to Chart.js's raw per-dataset default.
- **Functionally harmless — drill-down still works correctly despite the wrong legend text.** Clicked the single
  bar on the Bar widget: opened the correct filtered issue list in a new tab (`op[cf_67]=!*`, i.e. the "Not set"
  segment), and the result count matched the bar's value exactly (6/6). So this is a **display-only** defect, not
  a data or interaction defect — but it's actively misleading, since the legend visually claims the bar represents
  "Closed Only Query 120436" as if that were a single category, when the actual category is "Not set" (or whatever
  the real grouped value is).
- **Gets worse, not better, with more categories.** Tested a Bar chart on the "Updated issues" query grouped by
  **Priority** (a standard field, 5 real categories: Low=2, Normal=133, High=3, Urgent=1, Immediate=2) — the chart
  correctly draws 5 differently-coloured bars, but the legend still shows **exactly one entry, "Updated issues"**
  (the query name again), with no indication of which colour corresponds to which priority at all. With only one
  category this reads as merely "wrong text"; with several categories it becomes actively useless, since the
  legend gives the viewer no way to decode the bar colours. Drill-down on the "High" bar was independently
  reconfirmed correct here too — opened the filtered issue list (`priority_id=3` plus the query's own filters) and
  the count matched exactly (3/3).
- **Confirmed independent of standard-vs-custom-field grouping.** Same Bar template, same "Updated issues" query,
  grouped by a **custom field** (`cf_71`, "QA Boolean Field": Yes=1, No=1, Not set=139) — same result, one legend
  entry ("Updated issues") for 3 real bars. Drill-down on the "Not set" bar again correctly used `op[cf_71]=!*`
  (the `none` operator, not an empty value), matching the `BUG-DSH-005`/memory finding pattern for custom-field
  drill-down — the returned count (141) didn't match the bar's own value (139) only because this particular field
  didn't have Redmine core's "Used as a filter" enabled on this test instance (the same precondition documented in
  `DASHBOARDS_MEMORY.md`), not because of anything specific to this bug.

## Evidence

### Screenshot

![All four chart templates for the same query side by side — Doughnut and Pie legends match their category, Bar and Line legends show the query name instead](../../screenshots/BUG-DSH-007/bar-line-legend-shows-query-name-not-category.png)

![Bar chart, 5 real categories (Priority: Low/Normal/High/Urgent/Immediate) — 5 differently-coloured bars, but only one legend entry, "Updated issues"](../../screenshots/BUG-DSH-007/multi-category-bar-single-wrong-legend-entry.png)

### Console / log

- `Chart.getChart(canvas)` data captured per widget (indices in add order: 0=Doughnut, 1=Pie, 2=Bar, 3=Line):
  ```
  0 doughnut: categoryLabels=["Closed"]  datasetLabel="Closed Only Query 120436"  renderedLegend=["Closed"]
  1 pie:      categoryLabels=["Not set"] datasetLabel="Closed Only Query 120436"  renderedLegend=["Not set"]
  2 bar:      categoryLabels=["Not set"] datasetLabel="Closed Only Query 120436"  renderedLegend=["Closed Only Query 120436"]
  3 line:     categoryLabels=["Closed"]  datasetLabel="Closed Only Query 120436"  renderedLegend=["Closed Only Query 120436"]
  ```
- Bar-chart drill-down confirmed correct: clicked the single bar → new tab opened
  `/projects/5/issues?...&f[]=cf_67&op[cf_67]=!*` (plus the query's own filters) → issue list showed `(1-6/6)`,
  matching the bar's plotted value exactly.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): n/a — checked against `bugs/_duplicates.md` and `bugs/_index.md`. Distinct
  from `BUG-DSH-002`/`BUG-DSH-005`/`BUG-DSH-006` (all about the Settings panel); this one is about the chart's own
  legend rendering at display time, present on the widget as soon as it's added, no Settings interaction needed.

## Production report

- Reported on `flux.zehntech.com` (project `ztflux`) as issue **#121135**, 2026-09-23.
- Linked as a defect to Test Case **#121093**, Run **#577**, Test Suite **#249**, Environment "Window 11 + Chrome" — verified via `get_run_testcases`.
- Priority: Medium | Defect Severity: Medium-severity | Defect priority: Medium | Defect Type: Usability | Assignee: Prashant Chaurasia.
