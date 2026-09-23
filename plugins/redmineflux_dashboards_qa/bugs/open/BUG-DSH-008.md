# Bug Report Template

- Bug ID: BUG-DSH-008
- Production Redmine Issue ID: #121136 (ztflux, https://flux.zehntech.com/issues/121136) — linked as a defect to Test Case #121093, Run #577, Test Suite #249, Environment "Window 11 + Chrome"
- Title: Drill-down silently returns the entire query (not the clicked segment) when grouped by a custom field that doesn't have Redmine's "Used as a filter" enabled — no warning, wrong data shown as if correct
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Analytics Dashboard (`redmineflux_dashboard`)
- Plugin version: 7.0.0
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Browser: Playwright MCP (Chromium)
- User role: Administrator
- Date: 2026-09-23

> **Source:** raised directly by the user, who correctly identified this as a real product defect rather than a
> test-setup detail — the chart's own display is 100% correct in this scenario, but the drill-down it advertises
> as working silently lies about what it's showing.

## Steps to reproduce

1. In Administration → Custom fields, confirm a project custom field applicable to the query's tracker(s) does
   **not** have Redmine core's **"Used as a filter"** checkbox enabled (this is Redmine's own **default** state for
   a newly created custom field — nothing exotic has to be configured to reach it). On this instance: `cf_71`
   ("QA Boolean Field").
2. Open a project's Dashboard tab → Add Chart → Saved Queries → any issue query → a chart template (Doughnut/Pie/
   Bar/Line) → **Group by:** that custom field → Add.
3. Confirm the chart itself renders correct grouped counts (e.g. Yes=1, No=1, Not set=139, summing to the query's
   real total of 141).
4. Click the **"Not set"** segment (or any real segment).
5. Compare the drill-down issue list's result count against the segment's own plotted value.

## Expected result

- Either: the drill-down correctly filters to just the clicked segment's issues (matching its plotted count), the
  same way it does for a filterable field — **or**, if the field genuinely cannot be filtered by Redmine core, the
  plugin should not silently pretend the drill-down worked: at minimum it should not present a result set that
  looks like a valid filtered answer when it is actually the entire unfiltered query.
- A "click a segment showing 139 → get 139 issues" contract, per #120914 part 5 ("Clicking a segment should open
  the issue list showing exactly the issues behind it"), should hold for **every** field the plugin lets a user
  group by — not only for a subset that happens to also have an unrelated Redmine setting enabled.

## Actual result

- The chart itself is entirely correct: **Yes: 1, No: 1, Not set: 139** (sums to 141, the query's real total).
- Clicking the **"Not set"** segment (139) opens a new tab with the correctly-shaped drill-down URL —
  `.../issues?...&f[]=cf_71&op[cf_71]=!*` (the query's own filters expanded, `cf_71` correctly using the `none`
  operator, not double-filtered) — so the plugin's own drill-down logic did everything right on its side.
- **But the resulting issue list shows `(1-25/141)` — the entire query's issue count, not the segment's 139.**
  Because `cf_71` doesn't have Redmine core's "Used as a filter" enabled, Redmine's own issue-list route silently
  drops the `cf_71` filter parameter without any error — the URL looks valid, the page loads normally, and nothing
  on screen indicates the filter was ignored. A user clicking "Not set" (139 issues) is shown 141 issues with no
  way to tell, from the drill-down page alone, that 2 issues (the "Yes"/"No" ones) don't belong there.
- **This is not a one-off — it is the mechanism, and it will recur for any custom field a user groups by that
  doesn't happen to have "Used as a filter" enabled**, which is Redmine's own *default* state for a newly created
  custom field. A real site's admin would have to specifically remember to check that box on every custom field
  they ever want used as a Dashboard grouping dimension, with nothing in this plugin's own UI (the grouping
  selector, the chart, or the drill-down result) ever telling them it matters.
- Confirmed identically on a second field earlier in the same testing session: `cf_68` before "Used as a filter"
  was enabled on it (a "Not set" segment of 139 also came back as 141) — this repro instance was deliberately kept
  as-is on `cf_71` for evidence, but the underlying defect is field-agnostic.

## Evidence

### Screenshot

![Chart renders correct grouped data — Yes: 1, No: 1, Not set: 139](../../screenshots/BUG-DSH-008/chart-correct-before-drilldown.png)

![Clicking the "Not set" (139) segment opens a drill-down showing (1-25/141) — the whole query, not the segment](../../screenshots/BUG-DSH-008/drilldown-shows-all-141-instead-of-139.png)

### Console / log

- Drill-down URL: `/projects/5/issues?...&f[]=status_id&op[status_id]=o&f[]=updated_by&op[updated_by]==&v[updated_by][]=me&f[]=project.status&op[project.status]==&v[project.status][]=1&f[]=cf_71&op[cf_71]=!*` — correctly shaped (query's own filters + `cf_71` with the `none` operator, no duplicate/conflicting filter), confirming the plugin-side logic is right.
- Result: `(1-25/141)`. Expected: `(1-25/139)`.
- `Administration → Custom fields → QA Boolean Field → edit`: "Used as a filter" checkbox confirmed **unchecked**.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): n/a — checked against `bugs/_duplicates.md` and `bugs/_index.md`. Related
  to but distinct from `BUG-DSH-007` (legend text) and the drill-down mechanics covered generally in
  `DASHBOARDS_SAVED_QUERIES_AND_DRILLDOWN.md`'s TC-DSH-160–165 — this is specifically about the silent-wrong-data
  failure mode when the grouped field isn't Redmine-filterable, not about the filter-expansion logic itself (which
  is confirmed correct).

## Production report

- Reported on `flux.zehntech.com` (project `ztflux`) as issue **#121136**, 2026-09-23.
- Linked as a defect to Test Case **#121093**, Run **#577**, Test Suite **#249**, Environment "Window 11 + Chrome" — verified via `get_run_testcases`.
- Priority: High | Defect Severity: High-severity | Defect priority: High | Defect Type: Functional | Assignee: Prashant Chaurasia.
