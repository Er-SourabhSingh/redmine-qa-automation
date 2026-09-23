# Final Bug Report — Redmineflux Dashboards

> Generated from bugs/open/. PDF only on explicit user request.

## Summary

| Total | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|
| 6 | 0 | 2 | 3 | 1 |

## Open Bugs

### BUG-DSH-005 (High)
Saving Chart Settings on any chart-template query widget (Doughnut/Pie/Bar/Line) breaks its live rendering to "No Data Available" in place (self-heals on page reload — server-side data is correct, purely a client-side re-render failure), silently resets the Top Accent Color to its default even on a no-op save. Per user clarification, the Issue Status Filter/Data Filters section shouldn't exist at all — see `BUG-DSH-006`. See `bugs/open/BUG-DSH-005.md`.

### BUG-DSH-008 (High)
Drill-down silently returns the entire saved query — not the clicked segment — when grouped by a custom field that doesn't have Redmine core's "Used as a filter" enabled (Redmine's own default state for a new custom field). The chart itself displays correctly; the drill-down URL is correctly shaped; but Redmine's issue-list route silently drops the unfilterable field's parameter, and the plugin shows the resulting (wrong, larger) result set with no indication anything went wrong. Confirmed: a "Not set" segment of 139 returned all 141 query issues. See `bugs/open/BUG-DSH-008.md`.

### BUG-DSH-002 (Medium)
Chart-template query widget grouped by a **custom field** is missing the General section (Legend Position, Show Data Labels) in its Settings panel; a widget grouped by a **standard field** (e.g. Status) correctly shows it. See `bugs/open/BUG-DSH-002.md`.

### BUG-DSH-006 (Medium)
Chart Settings panel for a saved-query widget has no "Display as:" (template) or "Group by:" control at all — both are permanently fixed at Add-Chart time. See `bugs/open/BUG-DSH-006.md`.

### BUG-DSH-007 (Medium)
Bar and Line chart-template widgets show the saved query's own name in the legend instead of the grouped category label — Doughnut and Pie correctly show the category. Purely cosmetic — drill-down independently reconfirmed correct in every case tested. See `bugs/open/BUG-DSH-007.md`.

### BUG-DSH-004 (Low)
Grouping-dimension selector offers "QA Multi Select Field", a genuine multi-select custom field, as a groupable dimension — #120914's Out-of-scope section explicitly excludes multi-select custom fields from grouping. See `bugs/open/BUG-DSH-004.md`.

## Environment

- Redmine Version: 7.0.1.stable
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Test Date: 2026-09-23
