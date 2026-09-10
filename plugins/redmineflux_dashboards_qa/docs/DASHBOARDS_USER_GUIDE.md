# User Guide — Redmineflux Dashboards

> This file must be read before writing any test case. It describes real end-user behavior and UI flows.
> Initial version derived from https://www.redmineflux.com/knowledge-base/plugins/custom-dashboard/ — to be refined with live-confirmed UI strings/behavior during testing.

## Getting Started

1. Open any project.
2. Click the "Dashboard" tab in the project navigation (present by default, no module to enable).
3. The dashboard grid loads with any previously-saved charts (empty on a fresh project).

## Key Screens

- **Dashboard grid** — the main canvas; charts arranged in a draggable/resizable grid.
- **Header bar** — dashboard title, Add Chart, Refresh, Full-screen, Auto Refresh (+ interval dropdown), Share.
- **Global filter bar** — Tracker, Date Range (preset dropdown + custom range), Issue Status, Apply Filters.
- **Add Chart modal** — "Our Queries" tab (built-in chart types) / "Saved Queries" tab, search field, chart-specific options, custom title field, Add button.
- **Per-chart card** — chart body + hover/visible icon row: Settings, Refresh, Full-screen, Copy, Delete, Info.
- **Chart Settings panel** — General (title, legend position, data labels, custom date range) / Appearance (accent color, palette, background/border color) / Data Filters (status, tracker, priority, assignee, version, activity, role, user) sections.
- **Share dialog** — generates a public token URL; Copy and Regenerate controls.

## Step-by-Step Workflows

### Workflow 1: Add a chart

1. Click "Add Chart" in the header.
2. Choose a built-in chart type ("Our Queries" tab) or a saved query ("Saved Queries" tab); optionally search to filter the list.
3. Optionally set a custom title.
4. Click Add — the chart appears on the grid.

### Workflow 2: Configure a chart

1. Hover/click the chart card to reveal its icon row.
2. Click Settings.
3. Adjust General/Appearance/Data Filters as needed.
4. Save/apply (exact control TBD — verify live).

### Workflow 3: Rearrange the layout

1. Drag a chart by its header area to reposition.
2. Drag an edge/corner handle to resize.
3. Layout auto-saves (no explicit Save button expected — verify live).

### Workflow 4: Drill down into a chart

1. Click a segment/bar/slice within a chart.
2. Redmine navigates to (or opens) the underlying filtered issue list.

### Workflow 5: Share a dashboard publicly

1. Click Share in the header.
2. Copy the generated token URL.
3. Anyone with the link can view a read-only copy of the dashboard without logging in.
4. Regenerate the token to invalidate the previous link.

### Workflow 6: Auto-refresh

1. Enable Auto Refresh in the header.
2. Pick an interval (30s/1m/2m/5m/10m).
3. The dashboard silently re-queries on that timer.

## UI Elements Reference

See `DASHBOARDS_FEATURES_LIST.md` for the full enumerated list of header controls, filter-bar controls, chart-card icons, and settings-panel fields.

## Notes & Known Behavior

- To be filled in as live testing confirms exact German strings, control placement, and any deviations from the official KB description.
