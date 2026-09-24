# Final Bug Report — Redmineflux Dashboards

> Generated from bugs/open/. PDF only on explicit user request.

## Summary

| Total | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|
| 3 | 0 | 1 | 0 | 2 |

`bugs/closed/` holds 8 previously-fixed bugs (BUG-DSH-001–002/004–008), all retested 2026-09-24, confirmed FIXED,
synced to production (Done/100%). **`bugs/open/` now holds 3 bugs (BUG-DSH-011/013/014)**, found during the
2026-09-24 full final-cycle regression required by CLAUDE.md §27 (triggered when `bugs/open/` went empty). The
most significant is `BUG-DSH-013` (High) — a genuine data-visibility leak, not a UI/filtering defect like the
others. **Three other candidates found in the same pass were retracted the same day, for two different reasons**:
`BUG-DSH-009` and `BUG-DSH-012` after the product owner confirmed both are intentional design (Gauge is always an
all-time metric; saved-query widgets are always governed by their own query, not the global filter bar);
`BUG-DSH-010` after the user reported it wouldn't reproduce, which led to finding it was a **testing error** — the
original investigation had been typing into the wrong DOM element the whole time. See `bugs/_duplicates.md` and
`DASHBOARDS_MEMORY.md` for all three. `STATUS.md` remains `In Progress`.

## Open Bugs (found 2026-09-24, final-cycle regression)

### BUG-DSH-013 (High)
Dashboard chart widgets (Issues by Status, Issues by Assignee, Issues Trend) disclose the full, unrestricted
project issue count (725) to a role with maximally restricted issue visibility (confirmed via a real restricted
role — "QA Own Visibility" — who can see exactly 1 issue through every normal Redmine surface). A 725x aggregate
data-visibility leak. Drill-down itself is safe (Redmine core's own issue-list permission check catches it), so
real issue records are not disclosed — the leak is the aggregate counts/breakdowns themselves. See `bugs/open/BUG-DSH-013.md`.

### BUG-DSH-014 (Low)
Dashboard widgets can be added on a closed project — the plugin doesn't enforce Redmine's "closed = read-only"
convention. See `bugs/open/BUG-DSH-014.md`.

### BUG-DSH-011 (Low)
Turning Auto Refresh off doesn't cancel the already-scheduled refresh cycle — one more full-dashboard refresh
fires ~30 seconds after toggling off (bounded, not an infinite leak — confirmed via precise Performance API
timing). See `bugs/open/BUG-DSH-011.md`.

## Closed Bugs (this cycle)

### BUG-DSH-005 (High) — FIXED, retested 2026-09-24
Saving Chart Settings on any chart-template query widget (Doughnut/Pie/Bar/Line) broke its live rendering to "No Data Available" in place (self-heals on page reload — server-side data was correct, purely a client-side re-render failure), silently reset the Top Accent Color to its default even on a no-op save. Per user clarification, the Issue Status Filter/Data Filters section shouldn't exist at all — see `BUG-DSH-006`. See `bugs/closed/BUG-DSH-005.md`.

### BUG-DSH-008 (High) — FIXED, retested 2026-09-24
Drill-down silently returned the entire saved query — not the clicked segment — when grouped by a custom field that doesn't have Redmine core's "Used as a filter" enabled (Redmine's own default state for a new custom field). See `bugs/closed/BUG-DSH-008.md`.

### BUG-DSH-002 (Medium) — FIXED, retested 2026-09-24
Chart-template query widget grouped by a **custom field** was missing the General section (Legend Position, Show Data Labels) in its Settings panel; a widget grouped by a **standard field** (e.g. Status) correctly showed it. See `bugs/closed/BUG-DSH-002.md`.

### BUG-DSH-006 (Medium) — FIXED, retested 2026-09-24
Chart Settings panel for a saved-query widget had no "Display as:" (template) or "Group by:" control at all — both were permanently fixed at Add-Chart time. See `bugs/closed/BUG-DSH-006.md`.

### BUG-DSH-007 (Medium) — FIXED, retested 2026-09-24
Bar and Line chart-template widgets showed the saved query's own name in the legend instead of the grouped category label — Doughnut and Pie correctly showed the category. Purely cosmetic — drill-down independently reconfirmed correct in every case tested. See `bugs/closed/BUG-DSH-007.md`.

### BUG-DSH-004 (Low) — FIXED, retested 2026-09-24
Grouping-dimension selector offered "QA Multi Select Field", a genuine multi-select custom field, as a groupable dimension — #120914's Out-of-scope section explicitly excludes multi-select custom fields from grouping. See `bugs/closed/BUG-DSH-004.md`.

## Environment

- Redmine Version: 7.0.1.stable
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Test Date: 2026-09-23 (filed) / 2026-09-24 (retested, fixed, closed)
