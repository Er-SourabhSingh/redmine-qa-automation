# Bug Report Template

- Bug ID: BUG-DSH-005
- Production Redmine Issue ID: #121133 (ztflux, https://flux.zehntech.com/issues/121133) — linked as a defect to Test Case #121093, Run #577, Test Suite #249, Environment "Window 11 + Chrome"
- Title: Saving Chart Settings on any chart-template query widget (Doughnut/Pie/Bar/Line) breaks its live rendering to "No Data Available", silently resets the accent colour, and silently discards the Issue Status Filter selection
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Analytics Dashboard (`redmineflux_dashboard`)
- Plugin version: 7.0.0
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Browser: Playwright MCP (Chromium)
- User role: Administrator
- Date: 2026-09-23

## Steps to reproduce

1. Open a project's Dashboard tab.
2. Add a saved-query widget drawn as **Doughnut** (or Pie/Bar/Line) — any grouping dimension. Confirm it renders
   correctly with real data (e.g. a segment showing "Closed: 6").
3. Click the widget's **Settings** (gear) icon.
4. Without changing **anything** in the panel, click **Save Settings**.
5. Observe the chart card in place, without reloading the page.
6. Reload the page and observe the same chart card again.

## Expected result

- Saving settings with no actual changes should be a no-op: the chart should keep showing exactly the same data it
  showed before Settings was opened, with no visible change (per #120914 part 3, the whole point of exposing these
  settings live is so a user can see the effect of a change — a no-op save producing a *different*, broken result
  contradicts that).
- Any customization already set (e.g. the Top Accent Color) should be preserved unless the user explicitly changes it.

## Actual result

- **The chart body immediately replaces its real data with a "No Data Available — No data matches your selected
  filters. Try adjusting your filter criteria." empty state**, in place, right after clicking Save Settings — even
  though nothing was changed and the widget's underlying query still has the same 6 matching issues it had seconds
  earlier.
- **This is purely a client-side rendering failure, not real data loss**: the `PATCH .../widgets/:id/settings`
  response itself carries fully correct `chart_data` (`"labels":["Closed"],"data":[6],"total":6`) — the server
  computed everything correctly. The front-end simply fails to apply that response to the chart in place. A full
  page **reload recovers it** — the chart renders correctly again from a fresh page load, using the same stored
  widget configuration.
- **Reproduced on two different chart templates**, ruling out a style-specific cause:
  - A **Doughnut** widget grouped by a custom field (`cf_68`).
  - A **Bar** widget grouped by the standard field **Status**.
  Same result both times: chart body → "No Data Available" immediately after Save Settings, fine again after reload.
- **A second, independent defect in the same action**: the Top Accent Color is silently reset to the default
  `#2196F3` even on this same no-op save. The Doughnut widget had previously been set to `#9c27b0`; after clicking
  Save Settings without touching the colour picker, the stored `top_border_color` came back as `#2196F3` in both
  the PATCH response and after a page reload — the customization was lost, not merely not applied.
- The request payload itself looks suspect: for the Doughnut widget, the `PATCH` body sent was
  `{"title":"...","legend_position":"bottom","chart_colors":"","top_border_color":"#2196F3"}` — `legend_position`
  is present even though this specific widget's Settings panel doesn't render a Legend Position control at all
  (see `BUG-DSH-002`), and `top_border_color` is the hardcoded default rather than the widget's actual current
  colour — suggesting the settings-save code reads from a generic/default form state rather than the specific
  widget's actual current values.
- **A third, independent defect confirmed via the same payload inspection: the "Issue Status Filter" control in
  Data Filters is completely non-functional.** Changed it from "All Issues" to "Open Issues Only" and clicked Save
  Settings — the outgoing `PATCH` body was byte-for-byte identical to a save where that field was never touched
  (`{"title":"...","legend_position":"bottom","chart_colors":"","top_border_color":"#2196F3"}`, no
  `issue_status_filter` key at all), and the server's own stored value confirmed unchanged afterwards
  (`"issue_status_filter":"all"` in the response, not `"open"`). The dropdown visibly changes in the UI but the
  selection is silently discarded — it is never included in the save request.
- **User correction (2026-09-23, same day): the fix here isn't to make the Issue Status Filter work — it's to
  remove the whole Data Filters section from a saved-query widget's Settings panel.** Since which issues are shown
  is already fully determined by the saved query itself (per the panel's own banner text: "Which issues are shown
  is controlled by the saved query itself"), an additional widget-level status filter that can further narrow or
  contradict the query's own filters shouldn't exist at all — it isn't just broken, its presence is the design
  defect. The user's expected Settings panel for a saved-query widget: **Display as** (template, see `BUG-DSH-006`)
  → **Group by** (see `BUG-DSH-006`) → **Chart Color Palette** (already correct when a non-statistics-card template
  is selected) — and nothing else filter-related.

## Evidence

### Screenshot

![Doughnut widget — normal data before opening Settings](../../screenshots/BUG-DSH-005/chart-empty-after-settings-applied-live-state.png)

![Doughnut widget — "No Data Available" immediately after a no-op Save Settings click](../../screenshots/BUG-DSH-005/after-save-settings-click.png)

![Same widget — data is back to normal after a plain page reload, no other action taken](../../screenshots/BUG-DSH-005/after-page-reload.png)

![Bar widget grouped by Status — same "No Data Available" break after Save Settings, confirming this is not style- or grouping-specific](../../screenshots/BUG-DSH-005/bar-chart-after-save.png)

### Console / log

- `PATCH /projects/test-project/analytics_dashboard/widgets/64/settings` → `200 OK`.
- Request body: `{"title":"📋 Closed Only Query 120436","legend_position":"bottom","chart_colors":"","top_border_color":"#2196F3"}`
- Response body (abridged): `{"success":true,"widget":{...,"chart_options":{"query_id":"13","group_by":"status","chart_style":"doughnut","top_border_color":"#2196F3",...},"top_border_color":"#2196F3"},"chart_data":{"type":"chart","chart_style":"doughnut","data":{"labels":["Closed"],"datasets":[{"data":[6],...}],"total":6,...}}}`
  — note the response's own `chart_data` is entirely correct; the bug is that the UI doesn't render it after receiving this response.
- No JavaScript console errors were raised during the failure — it fails silently.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): n/a — checked against `bugs/_duplicates.md` and `bugs/_index.md`. Related to but distinct from `BUG-DSH-002` (missing controls) and `BUG-DSH-004` (wrong field offered) — this one is about the save action actively breaking a working chart, not about which controls/fields are offered.

## Production report

- Reported on `flux.zehntech.com` (project `ztflux`) as issue **#121133**, 2026-09-23.
- Linked as a defect to Test Case **#121093**, Run **#577**, Test Suite **#249**, Environment "Window 11 + Chrome" — verified via `get_run_testcases`.
- Priority: High | Defect Severity: High-severity | Defect priority: High | Defect Type: Functional | Assignee: Prashant Chaurasia.
