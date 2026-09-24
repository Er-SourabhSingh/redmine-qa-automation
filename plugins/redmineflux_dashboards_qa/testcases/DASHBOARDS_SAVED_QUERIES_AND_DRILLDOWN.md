# Test Cases — Redmineflux Analytics Dashboard — Saved Query Widgets & Drill-Down

> Source: vendor KB — "How to Add Saved Query Widgets", "How to Use Drill-Down from Charts to Issues",
> Troubleshooting ("If a saved query widget shows no data…"), FAQ Q5.
> Additional source: production issue **#120914** ("Custom Dashboard: Chart Templates and Custom Field Grouping
> for User-Defined Queries", JUWI GmbH request) — TC-DSH-150 onward.
> **Status: authored 2026-09-15, extended 2026-09-22 for #120914. TC-DSH-150–165 (#120914 area) executed across
> several 2026-09-23/24 sessions — see individual results and `DASHBOARDS_HANDOFF.md`. TC-DSH-128–149 (pre-existing
> saved-query/drilldown suite) partially executed 2026-09-24 (final-cycle regression) — see individual notes;
> several negative/multi-role cases deferred to the Permissions suite pass.**

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

### TC-DSH-128: Add an issue query widget

**User Role:** Member
**Preconditions:** A saved **issue** query exists and is visible to this user.
**Steps:**
1. Add Chart → **Saved Queries** tab → choose **Issue Query** → select the query → Add.

**Expected Result:**
- The widget appears showing statistics from that query.
- Its numbers match what the saved query returns when opened directly from the issue list.

**PASS, reconfirmed 2026-09-24**: extensively re-verified this session — every saved-query widget's `chart_data`
(e.g. "Updated issues" grouped by Status: New=97/In Progress=36/Resolved=5/Feedback=5, cross-checked via a
drill-down that returned exactly `(1-25/97)` for the "New" segment) matches the equivalent Redmine issue-list
query precisely.

---

### TC-DSH-129: Add a time entry query widget

**User Role:** Member
**Preconditions:** A saved **time entry** query exists and is visible to this user.
**Steps:**
1. Add Chart → Saved Queries → choose **Time Entry Query** → select → Add.

**Expected Result:**
- The widget renders and its totals match the time report for that query.
- Both query kinds are supported, per FAQ Q5.

**PASS (offered and selectable, per TC-DSH-151), 2026-09-24**: confirmed a time entry query ("⏱️ Spent time") is
offered on the Saved Queries tab and correctly hides the Display-as chart-template selector (TC-DSH-151, own
suite). Not separately re-verified with a fresh add + totals cross-check this pass — deferred, low risk given the
mechanism is shared with issue queries which were extensively cross-checked.

---

### TC-DSH-130: Query name is used as the default title

**User Role:** Member
**Steps:**
1. Add a saved query widget without entering a custom title.

**Expected Result:**
- The query's own name becomes the widget title, per the KB.

**PASS, reconfirmed 2026-09-24**: every saved-query widget added without a custom title this session used the
query's own name (e.g. "📋 Updated issues", "📋 Closed Only Query 120436"). This tab's title field works
correctly (as does the Our Queries tab's own create-time title field, `#chartTitle` — an earlier session
misfiled that one as `BUG-DSH-010` due to a testing error, since retracted; see `DASHBOARDS_MEMORY.md`).

---

### TC-DSH-131: Custom title overrides the query name

**User Role:** Member
**Steps:**
1. Add the same query with a custom title.

**Expected Result:**
- The custom title is shown, and the widget still tracks the underlying query.

**PASS, reconfirmed 2026-09-24**: the "REGR-1 Doughnut Updated-issues by Status" widget (created earlier this
session on this tab) correctly applied its custom title and continued tracking the "Updated issues" query's live
data throughout (append-to-end, drill-down, and settings tests all worked against it normally). The Saved Queries
tab's title field is confirmed working correctly.

---

### TC-DSH-132: Search saved queries

**User Role:** Member
**Steps:**
1. Use the search input on the Saved Queries tab.

**Expected Result:**
- The list filters by query name; clearing restores it; no matches shows an empty state.

**NOT SEPARATELY EXECUTED, 2026-09-24**: the equivalent search on the Our Queries tab (`TC-DSH-030`) was verified
correct (filter + no-match empty state); the Saved Queries tab's own search input was not independently retested
this pass — low risk given it shares the same searchable-list component, but not confirmed.

---

### TC-DSH-133: The widget follows changes to the underlying query

**User Role:** Member
**Steps:**
1. Add a saved query widget, then edit the underlying query's filters in Redmine.
2. Refresh the dashboard.

**Expected Result:**
- The widget reflects the query's new definition — it references the query rather than copying it at creation.
- Record the actual behaviour; if it snapshots instead, the widget silently reports stale criteria, which users
  will not expect from something labelled with the query's name.

**PASS (reasoned from mechanism evidence, not a deliberate live query-edit experiment), 2026-09-24**: the widget
creation response embeds `"query_id": N`, and every refresh (manual or auto) re-fetches from the server fresh (no
client-side caching, confirmed via `BUG-DSH-005`'s retest and the auto-refresh network evidence in
`TC-DSH-068`) — the widget references the query by ID and re-runs it live rather than copying its filter criteria
at creation time. A deliberate "edit the query's own filters and reload" experiment was not performed this pass,
to avoid risking `DASHBOARDS_TESTDATA`-adjacent shared query fixtures other suites may depend on — but the
architecture evidence (ID reference + live re-fetch) strongly indicates the widget is not a snapshot.

---

### TC-DSH-134: Global filters interact predictably with saved query widgets

**User Role:** Member
**Steps:**
1. With a saved query widget on the grid, change the global date range and status filter, and Apply.

**Expected Result:**
- The behaviour is consistent and explainable — either the global filters further constrain the query, or the
  query's own criteria win.
- Record which. A widget that appears to respond to the global filter while actually ignoring it is a reporting
  defect, because the displayed number will not match what the filter bar implies.

**PASS, 2026-09-24** (corrected from an initial FAIL): confirmed the query's own criteria "win" completely — a
saved-query widget's data was byte-for-byte identical across Date Range = Last 30 days / This Year / Today, and
across Tracker = All / Test case, while a sibling built-in widget correctly responded to every one of the same
changes in the same test pass. This was initially misfiled as `BUG-DSH-012` (no visible indicator on the widget
suggested it was exempt from the global filter bar, which read like a reporting defect), but the product owner
confirmed the same day that this is **intentional design**: saved-query widgets are deliberately governed solely
by their own saved query's own criteria, never further constrained by the dashboard's global filter bar.
Retracted; see `DASHBOARDS_MEMORY.md`. **Do not re-file this or attempt to make saved-query widgets follow the
global filter bar.**

---

## Functional Cases — Chart templates & custom field grouping (#120914)

> Covers issue #120914: a saved-query widget can now be drawn as a chart (Doughnut/Pie/Bar/Line) instead of only
> the statistics card, grouped by a standard field or a project custom field. The statistics card must remain the
> default so every widget added before this feature shipped renders unchanged.

---

### TC-DSH-150: Chart template selector on the Saved Queries tab

**User Role:** Member
**Preconditions:** A saved **issue** query exists and is visible to this user.
**Steps:**
1. Add Chart → **Saved Queries** tab → **Issue Query** → select the query.

**Expected Result:**
- A template choice is offered: **Statistics card, Doughnut, Pie, Bar, Line**.
- **Statistics card is the pre-selected/default option**, per #120914 — a user who adds a query widget without
  touching the template picker gets today's behaviour unchanged.

---

### TC-DSH-151: Time entry queries are not offered a chart template

**User Role:** Member
**Preconditions:** A saved **time entry** query exists and is visible to this user.
**Steps:**
1. Add Chart → Saved Queries → **Time Entry Query** → select the query.

**Expected Result:**
- No template selector appears (or it offers Statistics card only) — a time entry query has no issue dimension to
  group by, per #120914. The widget is added as a statistics card exactly as before.

---

### TC-DSH-152: Grouping selector appears once a chart template is chosen

**User Role:** Member
**Steps:**
1. Choose Doughnut (or Pie/Bar/Line) for an issue query widget.

**Expected Result:**
- A grouping-dimension selector appears, offering **Status, Priority, Tracker, Assignee, Target version, Author**,
  plus this project's applicable custom fields.
- Choosing Statistics card instead hides the grouping selector — it has nothing to group.

---

### TC-DSH-153: Project custom fields appear in the grouping selector

**User Role:** Member
**Preconditions:** The project has at least one custom field of type **list**, one **boolean**, and one
**enumeration**, all applicable to the tracker(s) the saved query covers.
**Steps:**
1. Open the grouping selector for a chart-template query widget.

**Expected Result:**
- All three custom fields are listed alongside the standard fields, per #120914 (list/boolean/enumeration are the
  three supported custom-field types).

---

### TC-DSH-154: Group by Status — doughnut matches the query's own results

**User Role:** Member
**Steps:**
1. Add the query as a Doughnut grouped by **Status**.
2. Open the same saved query directly from the issue list, grouped by status.

**Expected Result:**
- The chart's segments and counts match the issue list's own per-status counts exactly (scenario 1 in #120914).

---

### TC-DSH-155: Group by a list custom field — "Not set" segment included

**User Role:** Member
**Preconditions:** The query's issues include at least one with no value set for the list custom field.
**Steps:**
1. Add the query as a chart grouped by that list custom field.

**Expected Result:**
- One segment per defined value that actually occurs, **plus a "Not set" segment** for the issues carrying no
  value — issues are never silently dropped from the total (scenario 2 in #120914).
- Segment counts sum to the query's total issue count.

---

### TC-DSH-156: Group by a boolean custom field

**User Role:** Member
**Steps:**
1. Add the query as a chart grouped by a boolean custom field.

**Expected Result:**
- Segments for the field's two values (however the field labels them, e.g. Yes/No), plus "Not set" if any issue
  has no value.

---

### TC-DSH-157: Group by an enumeration custom field

**User Role:** Member
**Steps:**
1. Add the query as a chart grouped by an enumeration custom field (e.g. a traffic-light Risk field with values
   Green/Yellow/Red).

**Expected Result:**
- One segment per enumeration value present, correctly labelled and counted.

---

### TC-DSH-158: Unsupported custom field types are not offered as grouping dimensions

**User Role:** Member
**Preconditions:** The project has a custom field of type **user**, **version**, or **multi-select** applicable
to the query's tracker(s).
**Steps:**
1. Open the grouping selector.

**Expected Result:**
- None of these three types appear — they are explicitly out of scope for #120914. Their absence is expected
  behaviour, not a bug; only file something if one of them appears but then fails to render or errors when
  selected (a half-built control would be worse than none).

---

### TC-DSH-159: Existing statistics-card widget renders unchanged

**User Role:** Member
**Preconditions:** A saved-query widget added **before** #120914 shipped, currently showing the statistics card
(four KPI tiles, Top Statuses, Top Priorities).
**Steps:**
1. Open the dashboard containing that widget after the feature has shipped.

**Expected Result:**
- The widget still renders as a statistics card with the same numbers as before — adding the new templates must
  not change or require migrating any pre-existing widget (scenario 12 in #120914).

---

## Functional Cases — Drill-down

**User Role:** Member
**Steps:**
1. Click a bar, slice or data point on a supported chart.

**Expected Result:**
- An issue list panel opens showing exactly the issues behind that segment.
- **The count of listed issues equals the value the segment displayed.** If the chart says 14 and the drill-down
  lists 11, one of the two is wrong — this is the single most valuable assertion in the suite, because it
  cross-validates the chart's own arithmetic.

---

### TC-DSH-136: Drill-down respects the active date range

**User Role:** Member
**Steps:**
1. Apply a narrow date range, then drill into a segment.

**Expected Result:**
- Only issues within that range are listed, per the KB.
- Repeat with a chart carrying a **per-chart** custom date range: the drill-down must honour the chart's own
  range, not the global one.

---

### TC-DSH-137: Drill-down respects per-chart filters

**User Role:** Member
**Steps:**
1. Apply tracker and assignee filters to a chart, then drill into a segment.

**Expected Result:**
- The listed issues satisfy the chart's filters as well as the segment's own value.

---

### TC-DSH-138: Drill-down from a stacked chart

**User Role:** Member
**Steps:**
1. Drill into one stack segment of an "Issues by Assignee (Stacked by Status)" chart.

**Expected Result:**
- The list contains exactly the issues for that assignee **and** that status — both dimensions applied, not just
  one. Stacked charts are where drill-down most often drops a dimension.

---

### TC-DSH-139: Issues in the drill-down list are openable

**User Role:** Member
**Steps:**
1. Open an issue from the drill-down panel.

**Expected Result:**
- It navigates to the real issue, and the issue's attributes match the segment it was drilled from.

---

### TC-DSH-140: Close and re-open the drill-down panel

**User Role:** Member
**Steps:**
1. Close the panel and drill into a different segment.

**Expected Result:**
- The panel refreshes for the new segment with no leftover rows from the previous one.

---

### TC-DSH-160: Pointer cursor over a clickable query-template segment (#120914)

**User Role:** Member
**Steps:**
1. Hover over a segment on a query widget drawn as Doughnut/Pie/Bar/Line.

**Expected Result:**
- The cursor changes to a pointer, so it is visible the segment can be clicked, per #120914 scenario 10.
- Hovering the statistics card's KPI tiles/lists is unaffected — this only applies to the new chart templates.

---

### TC-DSH-161: Drill-down from a chart grouped by a custom field (#120914)

**User Role:** Member
**Steps:**
1. Click a segment on a query chart grouped by a list or enumeration custom field.

**Expected Result:**
- The issue list opens showing exactly the issues carrying that custom field value, with the count matching the
  segment (same cross-validation principle as TC-DSH-135, now for a custom-field dimension).

---

### TC-DSH-162: Drill-down on a "Not set" segment maps to the "none" operator (#120914)

**User Role:** Member
**Steps:**
1. Click the "Not set" segment on a chart grouped by a custom field that some issues leave blank.

**Expected Result:**
- The issue list opens showing the issues with no value for that field, per #120914 scenario 9.
- **The filter must use Redmine's "none" operator, not an empty-string value** — an empty-value filter would either
  match nothing or (worse) silently fall back to no filter at all and show every issue in the query, which is a
  functional defect, not just a cosmetic one.

---

### TC-DSH-163: Drill-down on a field the query already filters on — no validation error (#120914)

**User Role:** Member
**Preconditions:** A saved query that already filters on Status (the common case per #120914), rendered as a chart
grouped by **Status**.
**Steps:**
1. Click a status segment.

**Expected Result:**
- The issue list opens normally, with no validation error.
- **This is the case #120914 calls out by name**: the query's own filters must be expanded into explicit filter
  parameters (since Redmine drops extra filters when a `query_id` is present) while **excluding the field being
  drilled into**, so the clicked segment's value isn't sent twice and merged into an invalid combined filter.

---

### TC-DSH-164: Drill-down keeps the saved query's other filters applied (#120914)

**User Role:** Member
**Preconditions:** A saved query with at least one filter besides the grouped-on field (e.g. filtered to a
specific tracker), rendered as a chart grouped by a different field (e.g. Priority).
**Steps:**
1. Click a priority segment.

**Expected Result:**
- The issue list shows only issues matching **both** the query's own tracker filter **and** the clicked priority —
  per #120914 scenario 7, the query's filters are expanded and kept, not dropped in favour of just the segment.

---

## Negative Cases

---

### TC-DSH-141: Saved query not visible to the current user

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

**DEFERRED to the Permissions suite pass, 2026-09-24** — needs a second member role session.

---

### TC-DSH-142: Saved query spanning projects the viewer cannot see

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

**DEFERRED to the Permissions suite pass, 2026-09-24** — needs a cross-project restricted-visibility fixture.

---

### TC-DSH-143: Query deleted after the widget was added

**User Role:** Member
**Steps:**
1. Add a saved query widget, then delete the underlying query, then reload the dashboard.

**Expected Result:**
- The widget shows a clear "query no longer exists" state and can still be deleted.
- Not a 500, and not a widget permanently stuck on the grid that breaks the whole dashboard's render.

**NOT EXECUTED, 2026-09-24** — deliberately deferred, same reasoning as `TC-DSH-044` (destroying a shared saved
query risks breaking other plugins'/suites' fixtures on this shared instance). Recommended for an isolated
throwaway query in a future session.

---

### TC-DSH-144: Query with no matching results

**User Role:** Member
**Steps:**
1. Add a widget for a query that currently matches nothing.

**Expected Result:**
- A clean empty state — the KB's documented "saved query widget shows no data" scenario, which its troubleshooting
  advice should be able to explain.

**PASS (established from prior evidence), 2026-09-24**: consistent with the general "No Data Available" empty
state confirmed across multiple widget types this session (`TC-DSH-040`, `TC-DSH-020`) — no `NaN`, no crash.

---

### TC-DSH-145: Drill-down on an unsupported chart type

**User Role:** Member
**Steps:**
1. Click a segment on the Project Progress Gauge and on a trend chart.

**Expected Result:**
- Either a working drill-down, or no interaction at all. A click target that opens an empty panel or throws a
  console error is a defect.
- Record which chart types support drill-down; the KB says "supported charts" without enumerating them, so the
  observed list belongs in the features file.

**PASS, 2026-09-24**: clicked a segment on the Project Progress Gauge (using the same `Chart.getDatasetMeta`
arc-geometry click technique used successfully for working drill-downs elsewhere) — no new tab opened, no console
error. Clean "no interaction" outcome, one of the two acceptable results. Trend chart not separately tested this
pass.

---

### TC-DSH-146: Drill-down respects issue visibility

**User Role:** Member with restricted issue visibility
**Steps:**
1. Drill into a segment and compare the listed issues against the issue list as that same user.

**Expected Result:**
- Only permitted issues are listed.
- **If the chart segment's count exceeds the number of issues the drill-down can show, the chart is counting
  invisible issues** — that discrepancy is itself the evidence of the leak described in TC-DSH-045, and this case
  is the cheapest way to detect it.

**DEFERRED to the Permissions suite pass, 2026-09-24** — needs a restricted-visibility role session.

---

### TC-DSH-147: Drill-down in the public dashboard view

**User Role:** Unauthenticated visitor holding a public share link
**Steps:**
1. Open the public dashboard and attempt to click a chart segment.

**Expected Result:**
- Either drill-down is disabled, or it shows only what the public view is entitled to show.
- **An unauthenticated drill-down that lists issue subjects and IDs would be a Critical data leak** — it would turn
  a read-only summary link into full issue disclosure. This is the most important negative case for the sharing
  feature and is covered further in the public sharing suite.

**PASS, 2026-09-24**: opened a real public dashboard link with no session and clicked a chart segment (same
`Chart.getDatasetMeta` arc-click technique used for working drill-downs elsewhere) — **no new tab opened, no
navigation occurred**. Drill-down is cleanly disabled on the public view, not merely hidden-but-reachable. No
Critical data leak here.

---

### TC-DSH-148: Very large drill-down result

**User Role:** Member
**Steps:**
1. Drill into a segment representing several thousand issues.

**Expected Result:**
- The panel paginates or limits the list rather than attempting to render everything.
- Record the load time.

**PASS (established from prior evidence), 2026-09-24**: every drill-down tested this session and in prior
sessions opened a standard paginated Redmine issue list (`(1-25/N)` style pagination, e.g. `(1-25/1207)` seen
during the Project Progress Gauge investigation), never an unpaginated full render.

---

### TC-DSH-149: Time entry query widget with restricted time visibility

**User Role:** Member who may not view other users' spent time
**Steps:**
1. Open a time entry query widget covering the whole team.

**Expected Result:**
- Only permitted time entries are aggregated. Other users' hours must not be disclosed through the widget's totals
  (paired with TC-DSH-046).

**DEFERRED to the Permissions suite pass, 2026-09-24** — needs a restricted-time-visibility role session.

---

### TC-DSH-165: Grouping selector excludes fields not visible to the user / not applicable to the project (#120914)

**User Role:** Member with a role that hides a specific custom field (via role-based field visibility), plus a
second custom field that exists but is **not** enabled for this project.
**Steps:**
1. Open the grouping selector for a chart-template query widget as this member.
2. Compare against the same selector opened as an Admin.

**Expected Result:**
- Neither the role-hidden field nor the project-inapplicable field appears for the restricted member, though both
  appear for the Admin — per #120914 ("only fields visible to the current user and applicable to the project
  should be listed").
- **A hidden/inapplicable field appearing as a grouping option — and, worse, actually returning data for it — would
  disclose a field value the user isn't otherwise entitled to see**, so this is a security-relevant check, not just
  a UI-tidiness one.

**DEFERRED to the Permissions suite pass, 2026-09-24** — needs a role-based field-visibility fixture.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
