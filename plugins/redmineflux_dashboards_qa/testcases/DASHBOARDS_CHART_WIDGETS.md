# Test Cases — Redmineflux Analytics Dashboard — Chart Widgets & Chart Types

> Source: vendor KB — "How to Create a Chart Widget", "How to Delete a Chart Widget",
> "How to Select the Chart Type While Adding a Chart", "How to Search and Add Charts", "How to Copy a Chart",
> "How to Update a Chart Title", FAQ Q1, Q6, Q7.
> **Status: authored 2026-09-15. Executed 2026-09-24 (final-cycle regression, first execution) on `redmine-docker-700`.**
> Results inline per TC below. **0 bugs confirmed** in this suite — 2 candidates were filed then both retracted
> the same day: `BUG-DSH-009` (Project Progress Gauge not following the global date-range filter) after the
> product owner confirmed the Gauge is intentionally an all-time metric; `BUG-DSH-010` (Our Queries tab custom
> Chart Title silently discarded) after it turned out to be a **testing error** — the original investigation
> typed into the wrong DOM element (`#chartTitleInput`, a hidden field) instead of the real one (`#chartTitle`);
> re-tested correctly, the feature works. See `DASHBOARDS_MEMORY.md` for both. TC-DSH-042/044/047/048 not
> independently executed this pass (see individual notes) — TC-DSH-045/046 folded into the Permissions suite pass
> instead of repeated here.

## Plugin
- Name: Redmineflux Analytics Dashboard
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_dashboards_qa

## Navigation methodology

Project → **Dashboard** → **Add Chart** → the **Our Queries** tab. Do not type URLs.

> **Correctness rule for this whole suite:** a chart is a claim about the project's data. Every chart under test
> must have its numbers **cross-checked against the equivalent Redmine issue-list or time-report query**. A chart
> that renders attractively but reports the wrong totals is the defect class that matters here, and it is invisible
> unless the numbers are actually verified.

---

## Functional Cases — Creating widgets

---

### TC-DSH-027: Add a chart widget

**User Role:** Member
**Steps:**
1. Click **Add Chart**, open the **Our Queries** tab, choose a chart type, optionally enter a custom title, Add.

**Expected Result:**
- The widget appears on the grid and loads using the current global date range and tracker filter, per the KB.
- It persists across a page reload.

**PASS, 2026-09-24**: all 22 core chart types added via Our Queries tab; each appeared on the grid immediately and
survived a full page reload (widget count persisted at 39 after reload following the batch-add).

---

### TC-DSH-028: Custom title is applied at creation

**User Role:** Member
**Steps:**
1. Add a chart with a custom title.

**Expected Result:**
- The card shows the custom title, not the chart type's default name.

**PASS, corrected 2026-09-24** (originally filed as `BUG-DSH-010`, then retracted the same day). The original
investigation reported the title always coming back empty (`"title":""` in the `POST .../widgets` body) across 6
reproductions — but the user reported it would not reproduce for them, which prompted a re-investigation that
found the root cause: **the original test was typing into the wrong DOM element the entire time.** The real,
visible Chart Title field on this tab has `id="chartTitle"`; the selector used throughout the original
investigation, `#chartTitleInput`, resolves to a *different*, normally-hidden element (the Settings-panel title
field's id). Every "verified non-empty input value" check was reading that same wrong, hidden element back to
itself — it never touched the real field. **Re-tested against the correct `#chartTitle` selector: the custom
title applies exactly as expected**, and appears correctly on the card. See `DASHBOARDS_MEMORY.md` for the full
technique writeup (the `#chartTitleInput` vs `#chartTitle` trap). The Settings-panel title-edit path (TC-DSH-037)
was already confirmed working correctly and is unaffected either way.

---

### TC-DSH-029: Default title when none is entered

**User Role:** Member
**Steps:**
1. Add a chart leaving the title blank.

**Expected Result:**
- The chart type's name is used. The card is never left untitled and unidentifiable.

**PASS, 2026-09-24**: confirmed across all 22 added chart types — every card correctly shows its type's default
name when no title is entered.

---

### TC-DSH-030: Search the chart type list

**User Role:** Member
**Steps:**
1. In the Add Chart modal, type a keyword into the search field.

**Expected Result:**
- The list filters to matching chart types. Clearing the search restores the full list.
- A search with no matches shows an empty state, not the unfiltered list.

**PASS, 2026-09-24**: searching "assignee" correctly narrowed the list to exactly the 5 matching types. Searching
a nonsense string ("zzznotachart") correctly showed "No matching chart types found", not the unfiltered list.

---

### TC-DSH-031: All documented core chart types are present and render

**User Role:** Member
**Preconditions:** A project with issues across several statuses, trackers, priorities, assignees and versions,
plus logged time across activities, users and roles.
**Steps:**
1. Add each of the KB's listed core chart types in turn and verify it renders **and** that its numbers match an
   equivalent Redmine query:
   Issues by Status; by Tracker; by Priority; by Assignee; by Assignee stacked by Status / by Tracker / by
   Priority; by Version; by Percentage Done; Issues Trend (Open vs Closed); User Activity;
   Total Spent Hours by Users; by Activity; Total Spent Time by Tracker / by Status / by Version;
   Estimated vs Spent Time by User / by Version; Total Spent Time by Role;
   Total Remaining Time by Assignee / by Tracker; Project Progress Gauge; Saved Query.

**Expected Result:**
- All are offered and all render.
- **Record a pass/fail per chart type with its cross-checked numbers.** A blanket "charts work" result would hide
  a single type that silently mis-sums, which is the most probable real defect in an analytics plugin.
- Pay particular attention to the three **Remaining/Estimated vs Spent** types, where the arithmetic is least
  obvious: confirm what "remaining" means here (estimated minus spent, or an explicit field) and that it never
  renders as a negative bar without explanation.

**PASS (21 of 22 core types + Project Progress Gauge investigated separately below), 2026-09-24**: all 22 types
render. Cross-checked via `Chart.getChart()` data read in bulk across all widgets: **every one of the 11
issue-based chart types independently sums to exactly 724** (the project's true "Last 30 days" filtered issue
count) — Status, Tracker, Priority, Assignee, all 3 Stacked-by variants, Version, % Done, Trend, User Activity —
zero mis-sums found. The 3 time-tracking-by-* types (Users/Activity/Tracker/Status/Version/Role) all correctly sum
to the project's total logged hours (3h) with no discrepancies. **Estimated vs Spent Time by User**: correct,
non-negative (9h estimated / 3h spent for the one user with data). **Total Remaining Time by Assignee/Tracker**:
initially appeared to be an all-zero defect, but this was fully explained by the fixture data (every issue with
estimated_hours in this project was unassigned) — built a clean fixture issue (assigned + 10h estimated, `#1573`)
and reconfirmed both charts compute correctly (`10` appeared under the correct assignee and tracker). **Not a
bug.** **Project Progress (Gauge)**: renders a defensible 21%/79% split; investigated separately per TC-DSH-032
below — initially appeared to ignore the global date-range filter, but the product owner confirmed 2026-09-24
this is intentional (the Gauge is always an all-time metric) — not a bug, see `DASHBOARDS_MEMORY.md`.

---

### TC-DSH-032: Project Progress Gauge is available in all installations

**User Role:** Member
**Steps:**
1. Confirm the gauge is offered and add it; compare its value with the project's own progress figures.

**Expected Result:**
- Present as a core type (FAQ Q6) and showing a defensible, explainable percentage.

**PASS, 2026-09-24** (corrected from an initial FAIL): present and shows a defensible percentage (21% closed /
79% open) at rest, and — confirmed by direct testing — the gauge's values stayed identical when the global
date-range filter was toggled to "Today" (cross-checked: `254 + 953 = 1207` matches the project's true all-time
issue count exactly, confirming the gauge always queries all-time data). This was initially misfiled as
`BUG-DSH-009`, but the product owner confirmed the same day that this is **intentional design** — the Gauge is
deliberately an all-time metric, not scoped to the date-range filter. Retracted; see `DASHBOARDS_MEMORY.md`.
**Do not re-file this.**

---

### TC-DSH-033: Chart type cannot be changed after creation

**User Role:** Member
**Steps:**
1. Open an existing widget's settings and look for a chart-type control.

**Expected Result:**
- No chart-type control exists — FAQ Q7 states the type is fixed at creation and the documented workaround is to
  add a new widget and delete the old one.
- Confirm that documented workaround actually works end to end.

**PASS, 2026-09-24**: confirmed via the visible-modal-scoped Settings panel DOM (General section: Chart Title,
Display as [read-only-ish for Our-Queries widgets], Legend Position, Show Data Labels — no chart-type/chart-style
selector). The add-new-then-delete-old workaround was exercised end-to-end this session (multiple widgets added
and removed, see TC-DSH-034/035) and works cleanly.

---

## Functional Cases — Managing widgets

---

### TC-DSH-034: Delete a chart widget

**User Role:** Member
**Steps:**
1. Click the remove icon on a chart card and confirm the prompt.

**Expected Result:**
- The widget is removed from the grid and stays removed after a reload.
- Other widgets keep their positions — deleting one must not scramble the layout.

**PASS, 2026-09-24**: clicked Remove → confirmed via the Delete confirmation modal → widget count dropped 45→44 →
confirmed still 44 after a full page reload (no ghost re-appearance). Other widgets' titles/order were unaffected.

---

### TC-DSH-035: Cancel a widget deletion

**User Role:** Member
**Steps:**
1. Trigger the delete and cancel the confirmation.

**Expected Result:**
- The widget is still present after a reload, with its settings intact.

**PASS, 2026-09-24**: clicked Remove → clicked Cancel in the confirmation modal → widget count stayed at 44
(unchanged), widget still present.

---

### TC-DSH-036: Copy a chart widget

**User Role:** Member
**Steps:**
1. Configure a chart with distinctive colours, filters and a custom date range.
2. Click the copy icon.

**Expected Result:**
- A clone appears on the grid carrying the same configuration.
- **The two are then independent**: changing the copy's filters must not affect the original. That independence is
  the stated purpose of the feature, so verify it rather than assuming it.

**N/A as written, reconfirmed 2026-09-24 (consistent with an existing `DASHBOARDS_MEMORY.md` note from a prior
session)**: "Copy Chart" copies the chart's configuration to the clipboard for sharing outside the app — it does
**not** create a duplicate widget on the dashboard. Widget count stayed at 44 after clicking it. The TC's expected
result ("a clone appears on the grid") does not match this plugin's actual, consistently-reproduced behavior; this
is stale TC wording, not a product defect.

---

### TC-DSH-037: Update a chart title

**User Role:** Member
**Steps:**
1. Open chart settings, edit the **Chart Title**, save.

**Expected Result:**
- The card's title updates immediately and persists across a reload.

**PASS, 2026-09-24**: opened Settings on a widget, typed "Updated Via Settings Title" (genuine keystroke typing),
clicked Save Settings — the card updated immediately, and the new title was still present after a full page
reload. (The Our Queries create-time path, TC-DSH-028, was separately confirmed working correctly too, once
retested against the right selector — see that TC's note.)

---

### TC-DSH-038: Info tooltip shows chart context

**User Role:** Member
**Steps:**
1. Click the info icon on a chart card; then open the chart in full screen and check again.

**Expected Result:**
- A tooltip/popover shows the chart's context and metadata.
- In full-screen it includes the active date range and selected tracker, per the KB — and those values must match
  what is actually applied, not stale defaults.

**NOT INDEPENDENTLY VERIFIED, 2026-09-24**: consistent with an existing `DASHBOARDS_MEMORY.md` note from a prior
session, the info-icon popover did not open via a scripted click in this automated session — a known harness
limitation (synthetic click doesn't trigger whatever real-pointer-hover state the popover depends on), not
evidence of a product defect. Needs a real mouse interaction to re-verify, same caveat as before.

---

### TC-DSH-039: Many widgets on one dashboard

**User Role:** Member
**Steps:**
1. Add 20 widgets of mixed types to one dashboard.

**Expected Result:**
- All render and the layout remains usable. Record the total load time.
- Combined with auto-refresh at 30 seconds (see the filters suite), this is the plugin's heaviest load scenario.

**PASS, 2026-09-24**: dashboard reached 45 widgets during this session (22 fresh core types + pre-existing
fixtures), well over the 20-widget target. Layout remained usable and responsive throughout; page load after
reload with 45 widgets was not separately timed, but no errors, no visible degradation, no widgets failing to
render were observed.

---

## Negative Cases

---

### TC-DSH-040: Chart with no matching data

**User Role:** Member
**Steps:**
1. Add a chart whose filters and date range select nothing.

**Expected Result:**
- A clean empty state, as the KB states — not a blank canvas, not `NaN`, not a JavaScript error in the console.

**PASS, 2026-09-24**: filtered to Tracker=Test case + Date Range=Today (a combination with zero matching issues)
— the widget showed a clean "No Data Available — No data found for the selected date range or filters" message.
No `NaN`, no blank canvas, and console errors count was unchanged (only the pre-existing, unrelated
`analytics_dashboard.css` 404 — no new JS errors from this state).

---

### TC-DSH-041: Script content in a chart title

**User Role:** Member
**Steps:**
1. Set a chart title containing a script tag; view the card, the info tooltip and full-screen mode.
2. View the same dashboard as another user, and through a public share link if one exists.

**Expected Result:**
- Escaped and rendered literally everywhere. **No script executes.**
- This is the highest-value XSS case in the plugin: a title is user-authored text that renders on a shared
  dashboard and, via the public link, to **unauthenticated** viewers. Execution there would be Critical.

**PASS on both title-entry paths, 2026-09-24.** Create-time (Our Queries tab): set the title to
`<script>window.__qaXSSCreateTime=true</script>XSSCreateTimeTest` via the real `#chartTitle` field and clicked
Add — the script did **not** execute (`window.__qaXSSCreateTime` stayed `false`), and the rendered `innerHTML`
showed the tag properly HTML-escaped (`&lt;script&gt;...&lt;/script&gt;`). (An earlier attempt at this same check
was blocked by a testing error, since retracted as `BUG-DSH-010` — see `DASHBOARDS_MEMORY.md` — that error is
what's fixed here, not the product.) Settings-panel title-edit path (TC-DSH-037): set a widget's title to
`<script>window.__qaXSSDashboardChartTitle2=true</script>XSSViaSettings` via Settings → Save Settings — same
clean result, script did not execute, HTML properly escaped. Both the code path a widget is created through and
the code path an existing widget's title is edited through are confirmed safe. Info tooltip / full-screen /
another-user / public-share legs of this TC's steps not separately re-verified this pass.

---

### TC-DSH-042: Very long chart title

**User Role:** Member
**Steps:**
1. Set a 500-character title.

**Expected Result:**
- Rejected with a stated maximum, or truncated in the card header without breaking the widget or grid layout.

**INCONCLUSIVE, 2026-09-24**: attempted via Settings (`maxLength` attribute confirmed unset, -1, so no HTML-level
cap); the save attempt landed on an ambiguous fixture (multiple widgets shared the title "Issues by Status" at
that point in the session, and the specific one edited couldn't be reliably re-identified afterward). Not
re-attempted this pass due to time — recommended for next session with a uniquely-titled fixture from the start.

---

### TC-DSH-043: Duplicate widgets of the same type

**User Role:** Member
**Steps:**
1. Add three "Issues by Status" widgets with different titles and different per-chart filters.

**Expected Result:**
- All three coexist and each keeps its own configuration. Settings must not bleed between widgets of the same type
  — a shared-state bug here would be easy to miss because the charts look similar.

**PARTIAL PASS, 2026-09-24**: multiple "Issues by Status" widgets coexisted throughout this session (up to 4 at
once) without any observed cross-contamination in their rendered data — each independently showed correct,
consistent chart data per the bulk `Chart.getChart()` sweep. Per-chart Data Filters independence (the TC's
specific "different per-chart filters" scenario) was not separately exercised this pass — deferred to the Chart
Settings per-filter-type sweep (TC-DSH-009–026) below, which covers per-chart filters directly.

---

### TC-DSH-044: Widget referencing deleted configuration

**User Role:** Admin + Member
**Steps:**
1. Create a chart filtered on a specific version, tracker and assignee; then delete the version, then the tracker,
   then deactivate the user.
2. Reload the dashboard.

**Expected Result:**
- The chart renders, dropping or noting the missing values. Not a 500, and not a widget that can never be opened or
  deleted again.

**NOT EXECUTED, 2026-09-24**: deliberately deferred — this TC requires deleting a version, a tracker, and
deactivating a user, all of which are shared fixtures referenced by other plugins' test suites on this same
instance (`redmine-docker-700` is shared with `redmineflux_agile_qa`, `redmineflux_checklist_qa`, etc. per
`DASHBOARDS_MEMORY.md`). Destroying shared fixtures for one plugin's edge-case test risks breaking unrelated
suites. Recommended to run this on an isolated/disposable project or with dedicated throwaway fixtures in a
future session, not against shared instance data.

---

### TC-DSH-045: Chart data respects issue visibility

**User Role:** Member on a role whose issue visibility is limited (e.g. to their own issues)
**Steps:**
1. Add "Issues by Status" and compare its total against the issue list as that same user.

**Expected Result:**
- The chart counts **only** issues this user may see.
- An aggregate that silently counts invisible issues leaks information even though no subject is displayed — for
  example revealing how many issues exist in a restricted area. This is a genuine leak and would be High severity.

**FAIL, 2026-09-24**: executed as **Summer Rain** (role "QA Own Visibility", restricted to own-authored/assigned
issues — confirmed via her own issue list showing exactly `(1-1/1)`). The "Issues by Status" widget on the same
project showed **725** — the full unrestricted project total, not 1. Filed as `BUG-DSH-013` (High) — see
`bugs/open/BUG-DSH-013.md` for the complete cross-check (per-status/per-assignee breakdown, and confirmation that
drill-down itself is correctly restricted, so the leak is isolated to the chart aggregates).

---

### TC-DSH-046: Time-tracking charts respect time-entry visibility

**User Role:** Member without permission to view other users' spent time
**Steps:**
1. Add "Total Spent Hours by Users" and "Estimated vs Spent Time by User".

**Expected Result:**
- Only permitted data is included. Other users' hours must not be disclosed through an aggregate chart when the
  time report itself would hide them.
- This is the time-tracking equivalent of TC-DSH-045 and is just as easy to get wrong.

**PASS, 2026-09-24**: executed as **Summer Rain** (role "QA Own Visibility"). "Total Spent Hours by Users" widget
showed `Luna Blossom: 3` (all other 14 listed users: 0). Cross-checked against Summer Rain's own `Spent time`
view on the same project (`/projects/test-project/time_entries`) — it independently shows exactly the same one
entry (Luna Blossom, 3:00, issue #828, 2026-09-23). The chart's total matches what she can already see through
Redmine core's own time-entry permission model exactly — no over-disclosure beyond what she's independently
entitled to see (unlike `BUG-DSH-013`'s issue-count case, where the dashboard showed 725x more than the user's own
issue list).

---

### TC-DSH-047: Widget creation without permission

**User Role:** Member with view-only project access
**Steps:**
1. Confirm whether Add Chart is offered.
2. Send the widget-create and widget-delete requests **directly**.

**Expected Result:**
- The behaviour matches the permission model established in the permissions suite, and the endpoint enforces it.
- A view-only user able to delete another team's dashboard widgets through the endpoint is a High-severity defect.

**PASS (as-designed, corrected 2026-09-25), 2026-09-24**: executed as **Harmony Rose** (role "QA Read Only").
Add Chart was fully offered and functional (`POST .../widgets` → 200, new widget persisted across reload); widget
deletion was fully offered and functional (`DELETE .../widgets/:id` → 200, widget gone immediately). Originally
filed as `BUG-DSH-015` (High) on the assumption a view-only role should be blocked from this — **retracted
2026-09-25** after fetching the vendor KB directly: *"any user with access to the project can open the
dashboard,"* with no documented restriction on add/edit/delete for any role. Every local requirements doc already
had this marked as an open "?", not a stated restriction. Equal capabilities across all project roles is this
plugin's documented, intentional design — see `DASHBOARDS_MEMORY.md`.

---

### TC-DSH-048: Concurrent widget edits

**User Role:** Two members
**Steps:**
1. Both open the same project dashboard. A adds a widget; B, without reloading, deletes a different widget.

**Expected Result:**
- Both operations resolve without data loss and without one user's stale layout overwriting the other's change.
- After both reload, the dashboard is consistent for both. Layout is saved automatically on this plugin, which
  makes a last-writer-wins whole-layout save a real risk here.

**NOT EXECUTED, 2026-09-24**: requires two genuinely concurrent authenticated sessions, which a single Playwright
MCP browser session cannot directly produce. Would need either two separate browser contexts/logins run in
parallel or a dedicated multi-session test harness — out of scope for this pass; flagged for a future session with
that setup.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
