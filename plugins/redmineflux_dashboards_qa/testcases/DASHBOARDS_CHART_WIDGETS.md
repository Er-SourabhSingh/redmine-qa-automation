# Test Cases — Redmineflux Analytics Dashboard — Chart Widgets & Chart Types

> Source: vendor KB — "How to Create a Chart Widget", "How to Delete a Chart Widget",
> "How to Select the Chart Type While Adding a Chart", "How to Search and Add Charts", "How to Copy a Chart",
> "How to Update a Chart Title", FAQ Q1, Q6, Q7.
> **Status: authored 2026-09-15. Not yet executed.**

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

---

### TC-DSH-028: Custom title is applied at creation

**User Role:** Member
**Steps:**
1. Add a chart with a custom title.

**Expected Result:**
- The card shows the custom title, not the chart type's default name.

---

### TC-DSH-029: Default title when none is entered

**User Role:** Member
**Steps:**
1. Add a chart leaving the title blank.

**Expected Result:**
- The chart type's name is used. The card is never left untitled and unidentifiable.

---

### TC-DSH-030: Search the chart type list

**User Role:** Member
**Steps:**
1. In the Add Chart modal, type a keyword into the search field.

**Expected Result:**
- The list filters to matching chart types. Clearing the search restores the full list.
- A search with no matches shows an empty state, not the unfiltered list.

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

---

### TC-DSH-032: Project Progress Gauge is available in all installations

**User Role:** Member
**Steps:**
1. Confirm the gauge is offered and add it; compare its value with the project's own progress figures.

**Expected Result:**
- Present as a core type (FAQ Q6) and showing a defensible, explainable percentage.

---

### TC-DSH-033: Chart type cannot be changed after creation

**User Role:** Member
**Steps:**
1. Open an existing widget's settings and look for a chart-type control.

**Expected Result:**
- No chart-type control exists — FAQ Q7 states the type is fixed at creation and the documented workaround is to
  add a new widget and delete the old one.
- Confirm that documented workaround actually works end to end.

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

---

### TC-DSH-035: Cancel a widget deletion

**User Role:** Member
**Steps:**
1. Trigger the delete and cancel the confirmation.

**Expected Result:**
- The widget is still present after a reload, with its settings intact.

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

---

### TC-DSH-037: Update a chart title

**User Role:** Member
**Steps:**
1. Open chart settings, edit the **Chart Title**, save.

**Expected Result:**
- The card's title updates immediately and persists across a reload.

---

### TC-DSH-038: Info tooltip shows chart context

**User Role:** Member
**Steps:**
1. Click the info icon on a chart card; then open the chart in full screen and check again.

**Expected Result:**
- A tooltip/popover shows the chart's context and metadata.
- In full-screen it includes the active date range and selected tracker, per the KB — and those values must match
  what is actually applied, not stale defaults.

---

### TC-DSH-039: Many widgets on one dashboard

**User Role:** Member
**Steps:**
1. Add 20 widgets of mixed types to one dashboard.

**Expected Result:**
- All render and the layout remains usable. Record the total load time.
- Combined with auto-refresh at 30 seconds (see the filters suite), this is the plugin's heaviest load scenario.

---

## Negative Cases

---

### TC-DSH-040: Chart with no matching data

**User Role:** Member
**Steps:**
1. Add a chart whose filters and date range select nothing.

**Expected Result:**
- A clean empty state, as the KB states — not a blank canvas, not `NaN`, not a JavaScript error in the console.

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

---

### TC-DSH-042: Very long chart title

**User Role:** Member
**Steps:**
1. Set a 500-character title.

**Expected Result:**
- Rejected with a stated maximum, or truncated in the card header without breaking the widget or grid layout.

---

### TC-DSH-043: Duplicate widgets of the same type

**User Role:** Member
**Steps:**
1. Add three "Issues by Status" widgets with different titles and different per-chart filters.

**Expected Result:**
- All three coexist and each keeps its own configuration. Settings must not bleed between widgets of the same type
  — a shared-state bug here would be easy to miss because the charts look similar.

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

---

### TC-DSH-045: Chart data respects issue visibility

**User Role:** Member on a role whose issue visibility is limited (e.g. to their own issues)
**Steps:**
1. Add "Issues by Status" and compare its total against the issue list as that same user.

**Expected Result:**
- The chart counts **only** issues this user may see.
- An aggregate that silently counts invisible issues leaks information even though no subject is displayed — for
  example revealing how many issues exist in a restricted area. This is a genuine leak and would be High severity.

---

### TC-DSH-046: Time-tracking charts respect time-entry visibility

**User Role:** Member without permission to view other users' spent time
**Steps:**
1. Add "Total Spent Hours by Users" and "Estimated vs Spent Time by User".

**Expected Result:**
- Only permitted data is included. Other users' hours must not be disclosed through an aggregate chart when the
  time report itself would hide them.
- This is the time-tracking equivalent of TC-DSH-045 and is just as easy to get wrong.

---

### TC-DSH-047: Widget creation without permission

**User Role:** Member with view-only project access
**Steps:**
1. Confirm whether Add Chart is offered.
2. Send the widget-create and widget-delete requests **directly**.

**Expected Result:**
- The behaviour matches the permission model established in the permissions suite, and the endpoint enforces it.
- A view-only user able to delete another team's dashboard widgets through the endpoint is a High-severity defect.

---

### TC-DSH-048: Concurrent widget edits

**User Role:** Two members
**Steps:**
1. Both open the same project dashboard. A adds a widget; B, without reloading, deletes a different widget.

**Expected Result:**
- Both operations resolve without data loss and without one user's stale layout overwriting the other's change.
- After both reload, the dashboard is consistent for both. Layout is saved automatically on this plugin, which
  makes a last-writer-wins whole-layout save a real risk here.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
