# Bug Report Template

- Bug ID: BUG-DSH-002
- Production Redmine Issue ID: #121131 (ztflux, https://flux.zehntech.com/issues/121131) — linked as a defect to Test Case #121093, Run #577, Test Suite #249, Environment "Window 11 + Chrome"
- Title: Chart-template query widget grouped by a custom field is missing Legend Position and Data Labels controls (standard-field grouping is unaffected)
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Analytics Dashboard (`redmineflux_dashboard`)
- Plugin version: 7.0.0
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Browser: Playwright MCP (Chromium)
- User role: Administrator
- Date: 2026-09-23

> **Corrected 2026-09-23 (same-day, before this bug was ever reported to production):** the original write-up
> claimed this affected chart-template widgets in general. Direct comparison with a second widget grouped by a
> **standard** field (Status) showed its Settings panel correctly has Legend Position and Data Labels — so the gap
> is narrower than first filed. It reproduces specifically when the widget is grouped by a **custom field**.

## Steps to reproduce

1. Open a project's Dashboard tab.
2. Click **Add Chart** → **Saved Queries** tab → select any saved **issue** query.
3. Set **Display as:** to **Doughnut chart** (or Pie/Bar/Line).
4. Set **Group by:** to a **project custom field** (e.g. "QA Single Select Field"), then click **Add**.
5. On the newly added chart's card, click the **Settings** (gear) icon.
6. Read the **Chart Settings** panel from top to bottom.
7. **For comparison:** repeat steps 2–6 for a second widget, but at step 4 leave **Group by:** at its default
   (**Status**, a standard field) instead of picking a custom field.

## Expected result

- Per production issue **#120914** ("Custom Dashboard: Chart Templates and Custom Field Grouping for User-Defined
  Queries") part 3: "For a query widget drawn as a chart, the colour palette, legend position and data labels
  should become available — it is a real chart and those settings apply." Nothing in the ticket says this should
  depend on which field the chart happens to be grouped by.
- Both the custom-field-grouped widget (step 4) and the standard-field-grouped widget (step 7) should show the same
  **General** section (Chart Title, **Legend Position**, **Show Data Labels**, Custom Date Range) in their Settings
  panel.

## Actual result

- **Custom-field-grouped widget** (Group by: "QA Single Select Field"): the Settings panel shows only **Data
  Filters** (Issue Status Filter) and **Appearance** (Top Accent Color, Chart Color Palette) — no General section
  at all, so no Legend Position and no Data Labels toggle. Confirmed via `browser_find` regex search
  (`/Legend Position|Show.*Labels?|Data Labels/i`) against the panel's full accessibility tree returning zero
  matches, and visually (screenshot below).
- **Standard-field-grouped widget** (Group by: "Status", same query, same Doughnut/Bar template): the Settings
  panel *does* show a full **General** section with Chart Title, Legend Position (Bottom/Top/Left/Right), Show
  Data Labels (Hide/Show), and Custom Date Range — exactly as #120914 describes — in addition to Data Filters and
  Appearance.
- So the General section (and with it, Legend Position + Data Labels) is being conditionally omitted specifically
  when `group_by` is a custom field (`cf_NN`) rather than a standard field. This looks like the settings-panel
  builder branches on the grouping field's type and simply forgot to include the General section on the
  custom-field branch.

## Evidence

### Screenshot

![Bug evidence — custom-field-grouped widget missing General/Legend/Data Labels](../../screenshots/BUG-DSH-002/chart-settings-missing-legend-and-data-labels.png)

The Chart Settings modal for a Doughnut widget grouped by "QA Single Select Field" (a custom field) — visible
sections are only "Saved Query Widget" info banner, "Data Filters" (Issue Status Filter), and "Appearance" (Top
Accent Color, Chart Color Palette). No General section, no Legend Position, no Data Labels.

### Comparison screenshot — standard-field grouping works correctly

![Comparison — Bar chart grouped by Status shows General/Legend Position/Data Labels](../../screenshots/BUG-DSH-002/comparison-standard-field-grouping-has-legend-and-labels.png)

A second widget, same query, same chart engine, grouped by **Status** instead of a custom field, shows the full
panel including **General → Legend Position → Show Data Labels**. (This widget's chart body shows "No Data
Available" in the screenshot because it had just been hit by the unrelated `BUG-DSH-005` — the Settings panel
content itself, which is what this comparison is about, is unaffected by that.)

### Retest — 2026-09-23 (still failing for custom-field grouping, not fixed)

User ran the plugin migration and restarted the server (`redmine-docker-700`, localhost:3010) after this bug was
originally filed. Retested the exact same repro steps on a custom-field-grouped widget ("Sanity 120914 - Doughnut
by Single Select CF"): the Chart Settings panel still shows only **Data Filters** (Issue Status Filter) and
**Appearance** (Top Accent Color + Chart Color Palette) — no Legend Position control and no Data Labels toggle,
confirmed both visually and via a full accessibility-tree regex search of the panel. **Not fixed.** The
migration+restart was not the cause — this is a genuine code gap specific to the custom-field grouping branch.

![Retest — still missing Legend Position / Data Labels after migration+restart](../../screenshots/BUG-DSH-002/retest-2026-09-23-still-failing.png)

**Same session, later:** while investigating `BUG-DSH-005` (a separate "chart disappears after Save Settings" bug),
directly compared a custom-field-grouped widget against a standard-field-grouped (Status) widget side by side and
confirmed the General/Legend/Data-Labels gap is specific to custom-field grouping, not chart-template widgets in
general — narrowing this bug's scope as reflected in the "Corrected" note above and the retitled Steps/Expected/
Actual sections.

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-DSH-002/retest-yyyy-mm-dd-pass.png)

### Console / log

- No JS console errors associated with opening this panel. This is a missing-feature gap, not a crash.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): n/a — checked against `bugs/_duplicates.md` and `bugs/_index.md` (only prior bug is `BUG-DSH-001`, a closed German-translation bug, unrelated).

## Production report

- Reported on `flux.zehntech.com` (project `ztflux`) as issue **#121131**, 2026-09-23.
- Linked as a defect to Test Case **#121093**, Run **#577**, Test Suite **#249**, Environment "Window 11 + Chrome" — verified via `get_run_testcases`.
- Priority: Medium | Defect Severity: Medium-severity | Defect priority: Medium | Defect Type: Functional | Assignee: Prashant Chaurasia.
