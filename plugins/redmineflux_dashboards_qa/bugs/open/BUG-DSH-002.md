# Bug Report Template

- Bug ID: BUG-DSH-002
- Production Redmine Issue ID: <!-- fill after MCP report_defect/create_issue is approved and executed -->
- Title: Chart-template query widget's Settings panel is missing Legend Position and Data Labels controls
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Analytics Dashboard (`redmineflux_dashboard`)
- Plugin version: 7.0.0
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Browser: Playwright MCP (Chromium)
- User role: Administrator
- Date: 2026-09-23

## Steps to reproduce

1. Open a project's Dashboard tab.
2. Click **Add Chart** → **Saved Queries** tab → select any saved **issue** query.
3. Set **Display as:** to **Doughnut chart** (or Pie/Bar/Line), leave **Group by:** at its default (**Status**), and click **Add**.
4. On the newly added chart's card, click the **Settings** (gear) icon.
5. Read the **Chart Settings** panel from top to bottom.

## Expected result

- Per production issue **#120914** ("Custom Dashboard: Chart Templates and Custom Field Grouping for User-Defined Queries") part 3: "For a query widget drawn as a chart, the colour palette, legend position and data labels should become available — it is a real chart and those settings apply."
- The Settings panel for a chart-template saved-query widget should offer all three: **colour palette**, **legend position**, and a **data labels** show/hide toggle.

## Actual result

- The panel shows only **Data Filters** (an Issue Status Filter dropdown) and **Appearance** → **Top Accent Color** + **Chart Color Palette** (6 prebuilt palettes, custom palette, clear colors).
- There is **no Legend Position control** and **no Data Labels toggle** anywhere in the panel — confirmed both visually (screenshot below) and via `browser_find` regex search (`/Legend Position|Show.*Labels?|Data Labels/i`) against the panel's full accessibility tree, which returned zero matches.
- Two of the three appearance settings #120914 explicitly promised for chart-template query widgets are simply absent, not just hard to find.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-DSH-002/chart-settings-missing-legend-and-data-labels.png)

The Chart Settings modal for "Sanity 120914 - Doughnut by Single Select CF" (a Doughnut-template saved-query widget) — visible sections are only "Saved Query Widget" info banner, "Data Filters" (Issue Status Filter), and "Appearance" (Top Accent Color, Chart Color Palette). No Legend Position or Data Labels section exists below Appearance; the panel ends at the Cancel/Save Settings buttons.

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-DSH-002/retest-yyyy-mm-dd-pass.png)

### Console / log

- No JS console errors associated with opening this panel. This is a missing-feature gap, not a crash.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): n/a — checked against `bugs/_duplicates.md` and `bugs/_index.md` (only prior bug is `BUG-DSH-001`, a closed German-translation bug, unrelated).
