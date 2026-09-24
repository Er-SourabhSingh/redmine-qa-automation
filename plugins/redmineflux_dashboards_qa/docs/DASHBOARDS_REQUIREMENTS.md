# Plugin Requirements — Redmineflux Dashboards

> Source: https://www.redmineflux.com/knowledge-base/plugins/custom-dashboard/ (official knowledge base, fetched 2026-09-07)
> Live plugin identity confirmed via Administration > Plugins: "Redmineflux Analytics Dashboard" (internal name `redmineflux_dashboard`), version 7.0.0. KB also cross-linked from the plugin listing at https://www.redmineflux.com/knowledge-base/plugins/analytics-dashboard/.

## Overview

Custom Dashboard ("Your data, your view") lets users build personalized, per-project data visualizations from 20+ chart types (issue distributions, time tracking, trends, gauges) plus saved-query-based widgets. Dashboards support drag-and-drop layout, per-chart configuration, drill-down into underlying issues, auto-refresh, full-screen viewing, and token-based public sharing (read-only).

## Key Features

- 20+ built-in chart types covering issue distribution (status/tracker/priority/assignee/version/% done), time tracking (spent hours by user/activity/tracker/status/version, estimated vs. spent, spent time by role, remaining time by assignee/tracker), trends (open vs. closed over time), user activity, and a project-progress gauge.
- Saved Query widgets — turn any saved Issue or Time Entry query into a dashboard chart.
- Add Chart modal with "Our Queries" (built-in chart types) and "Saved Queries" tabs, a search field, and a custom title field per chart.
- Global filter bar (**tracker, date range presets** — confirmed live 2026-09-24 there is no separate global issue-status control despite an earlier draft of this doc claiming one; per-chart Issue Status Filter is per-chart only) applied dashboard-wide, plus per-chart Data Filters (status/tracker/priority/assignee/version/activity/role/user) that override/refine the global filter for that one chart.
- **Two documented, intentional exceptions to "every chart follows the global filter bar"** (confirmed by the
  product owner 2026-09-24, see `DASHBOARDS_MEMORY.md`): the **Project Progress (Gauge)** widget is always an
  all-time metric, never scoped to the date-range filter; and **Saved Query widgets** are always governed solely
  by their own saved query's own criteria, never further constrained by the global filter bar. Every other chart
  type (built-in, non-Gauge) does respect the global filter bar as normal.
- Per-chart settings panel: title, legend position, data labels toggle, custom date range, accent color, color palette, background/border color.
- Drag-and-drop repositioning and resize handles; layout auto-saves.
- Drill-down: clicking a chart segment opens the underlying issue list.
- Auto-refresh with selectable interval (30s/1m/2m/5m/10m); manual refresh (dashboard-wide and per-chart).
- Full-screen mode, both dashboard-wide and per individual chart.
- Public sharing via a generated token URL (copy link, regenerate to revoke old links) — read-only view for anyone with the link, no login required.
- Available as a "Dashboard" tab on every project with no explicit module-enablement step (unlike Flux Gantt, which requires enabling its module).

## Business Workflows

1. **Build a dashboard**: open a project's Dashboard tab → "Diagramm hinzufügen"-equivalent (Add Chart) → pick a built-in chart type or a saved query → optionally set a custom title → Add. Chart appears on the grid; drag/resize to arrange.
2. **Configure a chart**: hover/click a chart's Settings icon → adjust General (title, legend, data labels, custom date range), Appearance (colors), and Data Filters sections → changes apply live or on save.
3. **Filter the whole dashboard**: use the global filter bar (tracker/date range) → Apply Filters → every chart re-queries against the new filter, **except** the Project Progress Gauge (always all-time) and Saved Query widgets (always governed by their own query's own criteria) — both by design, confirmed 2026-09-24.
4. **Drill down**: click a segment/bar/slice in any chart → navigate to the filtered issue list behind that segment.
5. **Share publicly**: click Share → a token URL is generated → copy it → anyone with the link sees a read-only version of the dashboard without logging in → regenerate the token to invalidate the old link.
6. **Auto-refresh**: enable auto-refresh and pick an interval so the dashboard re-queries live data on a timer without manual intervention.

## Permissions Matrix

| Action | Admin | Manager | Developer | QA | Client | Non-member |
|--------|-------|---------|-----------|-----|--------|------------|
| View project Dashboard tab | ✓ | ? | ? | ? | ? | ? (depends on project visibility) |
| Add/configure/delete charts | ✓ | ? | ? | ? | ? | ✗ |
| Generate/revoke public share link | ✓ | ? | ? | ? | ? | ✗ |
| View a shared public dashboard link | ✓ (no login required) | ✓ | ✓ | ✓ | ✓ | ✓ |

> Permission granularity (which role-level permission gates chart add/edit/delete/share) not yet confirmed live — verify via Roles & Permissions during testing.

## Known Constraints

- Requires "REST API" enabled at Administration > Settings > API for at least some chart data-fetching to function (per the plugin's own installation notes) — check this precondition before testing, similar to the Host Name/Path precondition for email flows.
- No project-module toggle to enable/disable the Dashboard tab itself (unlike Flux Gantt) — confirm this live.
