# Features List — Redmineflux Dashboards

> This file must be read before writing any test case. It defines the full feature scope for test coverage.
> Source: https://www.redmineflux.com/knowledge-base/plugins/custom-dashboard/ (official knowledge base, fetched 2026-09-07)

## Feature List

| # | Feature | Description | Covered by TC |
|---|---------|-------------|---------------|
| 1 | Dashboard tab | Per-project tab, no module-enablement required | TC-DSH-049 — confirmed present without module enablement; FAIL on translation, see `BUG-DSH-001` |
| 2 | Header controls | Dashboard title, Add Chart, Refresh, Full-screen toggle, Auto Refresh (+ interval), Share | TC-DSH-049 — all present and functional, but entirely untranslated (`BUG-DSH-001`) |
| 3 | Global filter bar | Tracker filter, Date Range presets (Today/Last 7/30/90 Days/This/Last Month/This Year/Custom), Issue Status filter, Apply Filters button | TC-DSH-049 — present; labels untranslated, but 7/8 Date Range preset values ARE translated (`BUG-DSH-001`) |
| 4 | Add Chart modal | "Our Queries"/"Saved Queries" tabs, search field, custom title field, Add button | TC-DSH-050 — fully functional, entirely untranslated except "Abbrechen" (`BUG-DSH-001`) |
| 5 | Built-in chart types (20+) | Issues by Status/Tracker/Priority/Assignee/Version/%Done, Issues by Assignee stacked, Issues Trend, User Activity, Spent Hours by User/Activity/Tracker/Status/Version, Estimated vs Spent by User/Version, Spent Time by Role, Remaining Time by Assignee/Tracker, Project Progress Gauge | TC-DSH-050 — confirmed all 22 present in list (spot-checked 5 by name); "Issues by Status" added and renders correctly. Remaining 21 not individually added |
| 6 | Saved Query widgets | Issue Query and Time Entry Query based charts | — not yet tested |
| 7 | Chart card controls | Settings, Refresh, Full-screen, Copy, Delete, Info (tooltip) icons per chart | TC-DSH-051 — all present and functional, entirely untranslated (`BUG-DSH-001`) |
| 8 | Chart settings — General | Chart Title, Legend Position (Top/Bottom/Left/Right), Show/Hide Data Labels, Custom Start/End Date | TC-DSH-052 — present, entirely untranslated (`BUG-DSH-001`) |
| 9 | Chart settings — Appearance | Top Accent Color, Color Palette (prebuilt/custom), chart colors, background color, border color | TC-DSH-052 — present, entirely untranslated (`BUG-DSH-001`); palette names not counted as translation defects |
| 10 | Chart settings — Data Filters | Status, Tracker, Priority, Assignee, Version, Activity, Role, User | TC-DSH-052 — Issue Status filter present and untranslated (`BUG-DSH-001`); other 7 filter types not yet exercised |
| 11 | Drag-and-drop layout | Reposition via header drag area, resize via edge/corner handles, auto-save | Partial — resize-handle labels confirmed untranslated (TC-DSH-051); actual drag/resize interaction not yet exercised |
| 12 | Drill-down | Click a chart segment to view underlying issues | — not yet tested |
| 13 | Auto-refresh | Selectable interval: 30s/1m/2m/5m/10m | Partial — toggle/dropdown UI confirmed present and untranslated (TC-DSH-049); actual timer behavior not yet exercised |
| 14 | Full-screen mode | Dashboard-wide and per-chart | — not yet tested (buttons present, both untranslated) |
| 15 | Public sharing | Share button, token URL generation, copy link, token regeneration (revokes old link), read-only no-login view | — not yet tested (Share button present, untranslated) |
| 16 | Admin config | Administration > Settings > API — REST API enable toggle (precondition for chart data) | — not yet tested; chart data rendered correctly without explicitly checking this setting |
| 17 | Permissions | Role-gated access to view Dashboard tab / add-edit-delete charts / share — not yet confirmed which permission(s) gate this | — not yet tested |
| 18 | System messages | Validation errors, empty states, permission-denial messages | Partial — empty state ("No Charts Added") confirmed present and untranslated (TC-DSH-049) |
| 19 | Chart templates & custom field grouping for saved queries (production issue #120914) | Saved-query widgets can be drawn as Doughnut/Pie/Bar/Line (not just the statistics card), grouped by a standard field or a project custom field (list/boolean/enumeration); "Not set" segment for empty values; dimension-ordered segments; colour-name auto-matching (EN/DE) with palette override; drill-down expands the query's own filters excluding the grouped-on field; new charts append to the end of the layout, no reload, scrolled + highlighted | TC-DSH-150–165 (`DASHBOARDS_SAVED_QUERIES_AND_DRILLDOWN.md`), TC-DSH-166–188 (`DASHBOARDS_CHART_SETTINGS.md`, incl. 181–188 added 2026-09-23 covering `BUG-DSH-005/006/007`), TC-DSH-177–180 (`DASHBOARDS_GLOBAL_FILTERS_AND_LAYOUT.md`) — sanity-executed 2026-09-23, 5 bugs open (`BUG-DSH-002/004/005/006/007`), not all 39 cases individually executed |

## Notes

- Session 2026-09-07 (first pass, TC-DSH-049–004): Stage 1 (German, Default theme) first pass on the project Dashboard tab. **1 bug found, but it is severe and pervasive**: `BUG-DSH-001` (High) — almost the entire plugin UI (dashboard shell, Add Chart modal, chart card controls, Chart Settings panel across all 3 sections) is hardcoded in English with essentially no i18n coverage, confirmed via `document.body.innerText` against a confirmed-German session (`document.documentElement.lang === "de"`, fully-German core Redmine chrome on the same pages). The only translated plugin-owned content found: 7 of 8 Date Range preset dropdown options, and the "Abbrechen" button in the Add Chart modal — both cases where the plugin happens to reuse a shared/core Redmine locale key rather than defining its own string.
- Large surface still untested: drag/resize interaction, drill-down, auto-refresh timer behavior, public sharing flow, full-screen mode, Saved Queries tab, remaining 21 of 22 chart types, Data Filters beyond Issue Status, permissions, admin REST API precondition, Stage 2 (resolutions), Stages 3–6 (Lotus theme). See `DASHBOARDS_HANDOFF.md`.
