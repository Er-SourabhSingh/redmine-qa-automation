# Bug Report Template

- Bug ID: BUG-DSH-006
- Production Redmine Issue ID: #121134 (ztflux, https://flux.zehntech.com/issues/121134) — linked as a defect to Test Case #121093, Run #577, Test Suite #249, Environment "Window 11 + Chrome"
- Title: Chart Settings panel for a saved-query widget has no way to change Display as (chart template) or Group by after creation — both are locked in at Add-Chart time
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Analytics Dashboard (`redmineflux_dashboard`)
- Plugin version: 7.0.0
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Browser: Playwright MCP (Chromium)
- User role: Administrator
- Date: 2026-09-23

> **Source:** raised directly by the user (QA lead) after reviewing the Settings panel's actual contents,
> describing what the panel should contain for a saved-query widget. This finding goes **beyond the literal text
> of production issue #120914**, which only describes the template/grouping pickers living in the Add Chart
> dialog and says nothing about changing them afterward — flagging that distinction so whoever triages this can
> decide whether it belongs in #120914's scope or as a fast-follow. The other two expectations in the same
> discussion (colour palette shown for non-statistics-card templates; no unrelated Data Filters section) are
> already covered by existing bugs — see "Related" below.

## Steps to reproduce

1. Open a project's Dashboard tab.
2. Add Chart → Saved Queries → any issue query → **Doughnut chart** (or Pie/Bar/Line) → Add.
3. On the new widget's card, click the **Settings** (gear) icon.
4. Read the entire panel top to bottom, looking for a way to change the chart's template (Statistics
   card/Doughnut/Pie/Bar/Line) or its grouping dimension (Status/Priority/.../custom field).

## Expected result (per the user's spec, discussed 2026-09-23)

- The Settings panel should include a **"Display as:"** selector, the same one offered in the Add Chart dialog,
  so the chart's template can be changed after creation without deleting and re-adding the widget.
- When a non-statistics-card template is selected (in Add Chart, or — once implemented — in Settings), a
  **"Group by:"** dropdown should be shown/updated to match, exactly as it already behaves in the Add Chart dialog.
- The **Chart Color Palette** should be shown whenever a template other than Statistics card is selected — this
  part already works correctly today (see `BUG-DSH-002`/`BUG-DSH-005` for the *other* two gaps in this same panel).
- No unrelated Data Filters section — since the underlying saved query already determines which issues are shown,
  a widget-level filter duplicating/overriding that has no place in the panel (see `BUG-DSH-005`, which already
  covers this control being non-functional; the design point here is that it shouldn't exist at all).

## Actual result

- The Settings panel has **no "Display as:" control and no "Group by:" control anywhere** — confirmed via a full
  accessibility-tree regex search (`/Display as|Group by|Chart Type|Chart Style/i`) against the open panel,
  returning zero matches.
- Once a saved-query widget is created with a given template and grouping, **both are permanently fixed** — the
  only way to get a different template or grouping is to delete the widget and add a new one from scratch, losing
  its position, size, and any appearance customization already applied.
- This is consistent with the pre-existing behavior for built-in ("Our Queries") chart widgets, where chart type
  is likewise fixed after creation (see `TC-DSH-033`) — so it may be an intentional product-wide constraint rather
  than something #120914 was ever expected to change. Flagging for the developer/PM to confirm either way.

## Evidence

### Screenshot

![Chart Settings panel — no Display as / Group by control, Data Filters section still present](../../screenshots/BUG-DSH-006/settings-panel-no-display-as-or-group-by-plus-filters-present.png)

A freshly-added Doughnut saved-query widget's Settings panel: only Data Filters (Issue Status Filter) and
Appearance (Accent Color, Chart Color Palette) sections exist — no way to change the template or grouping shown.

### Console / log

- No JS errors; this is a missing-capability gap, not a crash.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): n/a. **Related** (same Settings panel, different specific gaps):
  `BUG-DSH-002` (General section missing for custom-field grouping), `BUG-DSH-005` (Save Settings breaks live
  rendering; Issue Status Filter is a dead control).

## Production report

- Reported on `flux.zehntech.com` (project `ztflux`) as issue **#121134**, 2026-09-23.
- Linked as a defect to Test Case **#121093**, Run **#577**, Test Suite **#249**, Environment "Window 11 + Chrome" — verified via `get_run_testcases`.
- Priority: Medium | Defect Severity: Medium-severity | Defect priority: Medium | Defect Type: Functional | Assignee: Prashant Chaurasia.
