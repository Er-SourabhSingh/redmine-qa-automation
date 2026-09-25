# Final Bug Report — Redmineflux Dashboards

> Generated from bugs/open/. PDF only on explicit user request.

## Summary

| Total | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|
| 8 | 1 | 1 | 4 | 2 |

`bugs/closed/` holds 8 previously-fixed bugs (BUG-DSH-001–002/004–008), all retested 2026-09-24, confirmed FIXED,
synced to production (Done/100%). **`bugs/open/` now holds 8 bugs.** `BUG-DSH-011/013/014` (found during the
2026-09-24 full final-cycle regression, CLAUDE.md §27) have been reported to production
(#121272/#121273/#121274). `BUG-DSH-016/018/019/020/021` (5 bugs) were found during a later same-day pass
executing the plugin's remaining not-yet-executed test cases, and are not yet reported to production. **The most
significant finding of the whole plugin's testing to date is `BUG-DSH-019` (Critical)** — any authenticated user,
with zero project membership, can open any private project's Analytics Dashboard and see its real chart data; the
dashboard route performs no project-access check at all, unlike every other controller on the instance.

**Six other candidates were retracted, across two testing passes**: `BUG-DSH-009` and `BUG-DSH-012` (2026-09-24)
after the product owner confirmed both are intentional design (Gauge is always an all-time metric; saved-query
widgets are always governed by their own query, not the global filter bar); `BUG-DSH-010` (2026-09-24) after the
user reported it wouldn't reproduce, which led to finding it was a **testing error** — the original investigation
had been typing into the wrong DOM element the whole time. `BUG-DSH-015`, `BUG-DSH-017`, and `BUG-DSH-022`
(2026-09-25) after the user asked for documentation verification and/or careful re-testing on 5 of the previous
day's bugs: `BUG-DSH-015` (a view-only role could add/edit/delete widgets) was retracted after fetching the
vendor KB directly — it explicitly documents equal dashboard capabilities for any project member, with no
role-based restriction on any dashboard action. `BUG-DSH-017` (invalid date range silently rejected) was retracted
as a false positive — a real toast error does appear, but auto-dismisses fast enough that the original static DOM
check missed it; caught on re-test with a `MutationObserver` attached before the triggering click. `BUG-DSH-022`
(a restricted user's share link shows full project data) was retracted as consistent with this plugin's
documented-elsewhere behavior of showing project-wide, unscoped data regardless of viewer (`BUG-DSH-013`, which
remains open in its own right). `BUG-DSH-020` was **narrowed rather than retracted**: its "any role can share"
half rested on the same now-retracted basis as `BUG-DSH-015` and was dropped, but its "creator cannot self-revoke"
half survives (the app's own Share-modal text documents this as Admin-only) — severity lowered High → Medium
accordingly. See `bugs/_duplicates.md` and `DASHBOARDS_MEMORY.md` for full detail on all six retractions.
`STATUS.md` remains `In Progress`.

## Open Bugs

### BUG-DSH-019 (Critical)
Any authenticated user — with zero project membership — can open a completely private project's Analytics
Dashboard directly (`/projects/<project>/analytics_dashboard`) and see its real chart data. Proven cleanly: the
same user/session that got a normal-looking dashboard from this plugin's controller was correctly refused with a
403 by Redmine core's own `/issues` controller on the identical project moments later. The dashboard route
performs no project-access check at all. See `bugs/open/BUG-DSH-019.md`.

### BUG-DSH-013 (High)
Dashboard chart widgets (Issues by Status, Issues by Assignee, Issues Trend) disclose the full, unrestricted
project issue count (725) to a role with maximally restricted issue visibility (confirmed via a real restricted
role — "QA Own Visibility" — who can see exactly 1 issue through every normal Redmine surface). A 725x aggregate
data-visibility leak. Drill-down itself is safe (Redmine core's own issue-list permission check catches it), so
real issue records are not disclosed — the leak is the aggregate counts/breakdowns themselves. See `bugs/open/BUG-DSH-013.md`.

### BUG-DSH-021 (Medium)
A chart's User Filter dropdown discloses the full instance-wide user list (20 real accounts) to a role with
maximally restricted issue visibility. See `bugs/open/BUG-DSH-021.md`.

### BUG-DSH-016 (Medium)
The global date range is not actually remembered across navigation — silently resets to the default "Last 30
days" instead of the last-applied range, despite the vendor KB's explicit claim that it "reapplies on the next
load." See `bugs/open/BUG-DSH-016.md`.

### BUG-DSH-018 (Medium)
A failed widget refresh leaves the chart silently showing stale data, with no visible error to the user. See
`bugs/open/BUG-DSH-018.md`.

### BUG-DSH-020 (Medium, narrowed 2026-09-25)
A member who creates a public share link cannot revoke it themselves — only an Administrator can, per the app's
own Share-modal text ("contact your administrator"), with no self-service revoke and no audit trail of who
created a given link. See `bugs/open/BUG-DSH-020.md`.

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
