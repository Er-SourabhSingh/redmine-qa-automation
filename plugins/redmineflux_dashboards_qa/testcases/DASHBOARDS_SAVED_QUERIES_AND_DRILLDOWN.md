# Test Cases — Redmineflux Analytics Dashboard — Saved Query Widgets & Drill-Down

> Source: vendor KB — "How to Add Saved Query Widgets", "How to Use Drill-Down from Charts to Issues",
> Troubleshooting ("If a saved query widget shows no data…"), FAQ Q5.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Analytics Dashboard
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_dashboards_qa

## Navigation methodology

Saved query widgets: **Add Chart** → the **Saved Queries** tab. Drill-down: click a segment, bar or data point on
a chart. Do not type URLs.

> **The governing claim under test:** the KB states saved query widgets "respect the visibility and permission
> rules of the original query" and that "if a query is not visible to the current user, its data will not be
> shown." That is a security promise, and the negative cases below are what actually verify it.

---

## Functional Cases — Saved query widgets

---

### TC-DSH-501: Add an issue query widget

**User Role:** Member
**Preconditions:** A saved **issue** query exists and is visible to this user.
**Steps:**
1. Add Chart → **Saved Queries** tab → choose **Issue Query** → select the query → Add.

**Expected Result:**
- The widget appears showing statistics from that query.
- Its numbers match what the saved query returns when opened directly from the issue list.

---

### TC-DSH-502: Add a time entry query widget

**User Role:** Member
**Preconditions:** A saved **time entry** query exists and is visible to this user.
**Steps:**
1. Add Chart → Saved Queries → choose **Time Entry Query** → select → Add.

**Expected Result:**
- The widget renders and its totals match the time report for that query.
- Both query kinds are supported, per FAQ Q5.

---

### TC-DSH-503: Query name is used as the default title

**User Role:** Member
**Steps:**
1. Add a saved query widget without entering a custom title.

**Expected Result:**
- The query's own name becomes the widget title, per the KB.

---

### TC-DSH-504: Custom title overrides the query name

**User Role:** Member
**Steps:**
1. Add the same query with a custom title.

**Expected Result:**
- The custom title is shown, and the widget still tracks the underlying query.

---

### TC-DSH-505: Search saved queries

**User Role:** Member
**Steps:**
1. Use the search input on the Saved Queries tab.

**Expected Result:**
- The list filters by query name; clearing restores it; no matches shows an empty state.

---

### TC-DSH-506: The widget follows changes to the underlying query

**User Role:** Member
**Steps:**
1. Add a saved query widget, then edit the underlying query's filters in Redmine.
2. Refresh the dashboard.

**Expected Result:**
- The widget reflects the query's new definition — it references the query rather than copying it at creation.
- Record the actual behaviour; if it snapshots instead, the widget silently reports stale criteria, which users
  will not expect from something labelled with the query's name.

---

### TC-DSH-507: Global filters interact predictably with saved query widgets

**User Role:** Member
**Steps:**
1. With a saved query widget on the grid, change the global date range and status filter, and Apply.

**Expected Result:**
- The behaviour is consistent and explainable — either the global filters further constrain the query, or the
  query's own criteria win.
- Record which. A widget that appears to respond to the global filter while actually ignoring it is a reporting
  defect, because the displayed number will not match what the filter bar implies.

---

## Functional Cases — Drill-down

---

### TC-DSH-508: Drill down from a chart segment

**User Role:** Member
**Steps:**
1. Click a bar, slice or data point on a supported chart.

**Expected Result:**
- An issue list panel opens showing exactly the issues behind that segment.
- **The count of listed issues equals the value the segment displayed.** If the chart says 14 and the drill-down
  lists 11, one of the two is wrong — this is the single most valuable assertion in the suite, because it
  cross-validates the chart's own arithmetic.

---

### TC-DSH-509: Drill-down respects the active date range

**User Role:** Member
**Steps:**
1. Apply a narrow date range, then drill into a segment.

**Expected Result:**
- Only issues within that range are listed, per the KB.
- Repeat with a chart carrying a **per-chart** custom date range: the drill-down must honour the chart's own
  range, not the global one.

---

### TC-DSH-510: Drill-down respects per-chart filters

**User Role:** Member
**Steps:**
1. Apply tracker and assignee filters to a chart, then drill into a segment.

**Expected Result:**
- The listed issues satisfy the chart's filters as well as the segment's own value.

---

### TC-DSH-511: Drill-down from a stacked chart

**User Role:** Member
**Steps:**
1. Drill into one stack segment of an "Issues by Assignee (Stacked by Status)" chart.

**Expected Result:**
- The list contains exactly the issues for that assignee **and** that status — both dimensions applied, not just
  one. Stacked charts are where drill-down most often drops a dimension.

---

### TC-DSH-512: Issues in the drill-down list are openable

**User Role:** Member
**Steps:**
1. Open an issue from the drill-down panel.

**Expected Result:**
- It navigates to the real issue, and the issue's attributes match the segment it was drilled from.

---

### TC-DSH-513: Close and re-open the drill-down panel

**User Role:** Member
**Steps:**
1. Close the panel and drill into a different segment.

**Expected Result:**
- The panel refreshes for the new segment with no leftover rows from the previous one.

---

## Negative Cases

---

### TC-DSH-514: Saved query not visible to the current user

**User Role:** Member B, where the query is a **private** query owned by member A
**Steps:**
1. Confirm A's private query is not offered to B in the Saved Queries tab.
2. If A added a widget for it to a shared dashboard, open that dashboard as B.
3. Send a request for that widget's data **directly** as B, naming the query ID.

**Expected Result:**
- The query is not listed for B; the widget shows no data for B; and the direct request is refused.
- This is the KB's explicit promise, and leg 3 is what proves it. **A private query's results rendered to another
  user through a dashboard widget is a High-severity data leak**, and a widget is a very easy place to forget the
  check, because the permission logic naturally lives on the query page.

---

### TC-DSH-515: Saved query spanning projects the viewer cannot see

**User Role:** Member of project A only
**Preconditions:** A cross-project saved query covering A and private project C. **Confirm C is genuinely
private** — a newly created Redmine project defaults to public.
**Steps:**
1. Add or open a widget for that query and compare its totals against the same query run by a user with access to
   both projects.

**Expected Result:**
- The widget counts only project A's issues for this viewer.
- A total that silently includes C's issues discloses the size of a restricted area even without naming any issue
  — High severity.

---

### TC-DSH-516: Query deleted after the widget was added

**User Role:** Member
**Steps:**
1. Add a saved query widget, then delete the underlying query, then reload the dashboard.

**Expected Result:**
- The widget shows a clear "query no longer exists" state and can still be deleted.
- Not a 500, and not a widget permanently stuck on the grid that breaks the whole dashboard's render.

---

### TC-DSH-517: Query with no matching results

**User Role:** Member
**Steps:**
1. Add a widget for a query that currently matches nothing.

**Expected Result:**
- A clean empty state — the KB's documented "saved query widget shows no data" scenario, which its troubleshooting
  advice should be able to explain.

---

### TC-DSH-518: Drill-down on an unsupported chart type

**User Role:** Member
**Steps:**
1. Click a segment on the Project Progress Gauge and on a trend chart.

**Expected Result:**
- Either a working drill-down, or no interaction at all. A click target that opens an empty panel or throws a
  console error is a defect.
- Record which chart types support drill-down; the KB says "supported charts" without enumerating them, so the
  observed list belongs in the features file.

---

### TC-DSH-519: Drill-down respects issue visibility

**User Role:** Member with restricted issue visibility
**Steps:**
1. Drill into a segment and compare the listed issues against the issue list as that same user.

**Expected Result:**
- Only permitted issues are listed.
- **If the chart segment's count exceeds the number of issues the drill-down can show, the chart is counting
  invisible issues** — that discrepancy is itself the evidence of the leak described in TC-DSH-219, and this case
  is the cheapest way to detect it.

---

### TC-DSH-520: Drill-down in the public dashboard view

**User Role:** Unauthenticated visitor holding a public share link
**Steps:**
1. Open the public dashboard and attempt to click a chart segment.

**Expected Result:**
- Either drill-down is disabled, or it shows only what the public view is entitled to show.
- **An unauthenticated drill-down that lists issue subjects and IDs would be a Critical data leak** — it would turn
  a read-only summary link into full issue disclosure. This is the most important negative case for the sharing
  feature and is covered further in the public sharing suite.

---

### TC-DSH-521: Very large drill-down result

**User Role:** Member
**Steps:**
1. Drill into a segment representing several thousand issues.

**Expected Result:**
- The panel paginates or limits the list rather than attempting to render everything.
- Record the load time.

---

### TC-DSH-522: Time entry query widget with restricted time visibility

**User Role:** Member who may not view other users' spent time
**Steps:**
1. Open a time entry query widget covering the whole team.

**Expected Result:**
- Only permitted time entries are aggregated. Other users' hours must not be disclosed through the widget's totals
  (paired with TC-DSH-220).

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
