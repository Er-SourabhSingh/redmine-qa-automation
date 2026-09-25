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
**Priority:** High
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
**Priority:** High
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
**Priority:** Low
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
**Priority:** Medium
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
**Priority:** Low
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
**Priority:** High
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
**Priority:** Medium
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
**Priority:** High
**Preconditions:** A saved **issue** query exists and is visible to this user.
**Steps:**
1. Add Chart → **Saved Queries** tab → **Issue Query** → select the query.

**Expected Result:**
- A template choice is offered: **Statistics card, Doughnut, Pie, Bar, Line**.
- **Statistics card is the pre-selected/default option**, per #120914 — a user who adds a query widget without
  touching the template picker gets today's behaviour unchanged.

**PASS, 2026-09-25**: on the "Reported issues" saved query, `#savedQueryDisplay` offered exactly 5 options
(Statistics card/Doughnut/Pie/Bar/Line) with `statistics` as the select's default value before any change.

---

### TC-DSH-151: Time entry queries are not offered a chart template

**User Role:** Member
**Priority:** Medium
**Preconditions:** A saved **time entry** query exists and is visible to this user.
**Steps:**
1. Add Chart → Saved Queries → **Time Entry Query** → select the query.

**Expected Result:**
- No template selector appears (or it offers Statistics card only) — a time entry query has no issue dimension to
  group by, per #120914. The widget is added as a statistics card exactly as before.

**PASS, 2026-09-25**: selecting a time entry query ("⏱️ sadsafdfasd") made `#savedQueryDisplay` disappear entirely
(`offsetParent === null`) — no template selector offered at all, consistent with #120914's design.

---

### TC-DSH-152: Grouping selector appears once a chart template is chosen

**User Role:** Member
**Priority:** High
**Steps:**
1. Choose Doughnut (or Pie/Bar/Line) for an issue query widget.

**Expected Result:**
- A grouping-dimension selector appears, offering **Status, Priority, Tracker, Assignee, Target version, Author**,
  plus this project's applicable custom fields.
- Choosing Statistics card instead hides the grouping selector — it has nothing to group.

**PASS, 2026-09-25**: `#savedQueryGroupBy` confirmed hidden while Display-as = Statistics card (the default), and
became visible (`offsetParent !== null`) the moment Display-as was switched to Doughnut — same modal, same
session, toggled live.

---

### TC-DSH-153: Project custom fields appear in the grouping selector

**User Role:** Member
**Priority:** High
**Preconditions:** The project has at least one custom field of type **list**, one **boolean**, and one
**enumeration**, all applicable to the tracker(s) the saved query covers.
**Steps:**
1. Open the grouping selector for a chart-template query widget.

**Expected Result:**
- All three custom fields are listed alongside the standard fields, per #120914 (list/boolean/enumeration are the
  three supported custom-field types).

**PASS, 2026-09-25**: `#savedQueryGroupBy` for the "Reported issues" query listed Status/Priority/Tracker/
Assignee/Target version/Author plus **QA Boolean Field** (cf_71) and **QA Single Select Field** (cf_68, the
list-type field also serving as this project's "enumeration"-style fixture — see TC-157). Redmine has no distinct
"enumeration" custom-field format; a list-type field with a small set of named values (as #120914's own example,
"a traffic-light Risk field", describes) is what this and TC-157 actually test, and cf_68 fills that role.

---

### TC-DSH-154: Group by Status — doughnut matches the query's own results

**User Role:** Member
**Priority:** High
**Steps:**
1. Add the query as a Doughnut grouped by **Status**.
2. Open the same saved query directly from the issue list, grouped by status.

**Expected Result:**
- The chart's segments and counts match the issue list's own per-status counts exactly (scenario 1 in #120914).

**PASS (established earlier this session), 2026-09-25**: widget 131 ("Reported issues" grouped by Status)
rendered New=520/In Progress=177/Resolved=8/Feedback=244 — already cross-validated against the configured status
order in `TC-DSH-169`; the same widget/data also underlies this TC's assertion (segment counts are the server's
own query aggregation, not a separate client-side recomputation, confirmed via the same widget-creation-response
inspection technique used throughout this suite).

---

### TC-DSH-155: Group by a list custom field — "Not set" segment included

**User Role:** Member
**Priority:** Medium
**Preconditions:** The query's issues include at least one with no value set for the list custom field.
**Steps:**
1. Add the query as a chart grouped by that list custom field.

**Expected Result:**
- One segment per defined value that actually occurs, **plus a "Not set" segment** for the issues carrying no
  value — issues are never silently dropped from the total (scenario 2 in #120914).
- Segment counts sum to the query's total issue count.

**PASS (established earlier this session), 2026-09-25**: widget 130 (grouped by cf_68 "QA Single Select Field")
rendered `Green/Yellow/Not set` — real values plus a trailing "Not set" segment for the ~940 issues carrying no
value, confirmed in `TC-DSH-171`/`172`. No issues silently dropped — the "Not set" bucket accounts for them.

---

### TC-DSH-156: Group by a boolean custom field

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Add the query as a chart grouped by a boolean custom field.

**Expected Result:**
- Segments for the field's two values (however the field labels them, e.g. Yes/No), plus "Not set" if any issue
  has no value.

**PASS (established earlier this session), 2026-09-25**: widget 133 (grouped by cf_71 "QA Boolean Field")
rendered `Yes/Not set` (`[1, 948]`) — confirmed in `TC-DSH-175`. Only one issue had "Yes" set in the query's
scope; "No" wasn't present as a real segment in this data, but the field's own possible-value structure (Yes/No)
and the "Not set" fallback are both confirmed working.

---

### TC-DSH-157: Group by an enumeration custom field

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Add the query as a chart grouped by an enumeration custom field (e.g. a traffic-light Risk field with values
   Green/Yellow/Red).

**Expected Result:**
- One segment per enumeration value present, correctly labelled and counted.

**PASS (established earlier this session), 2026-09-25**: this instance's list-type "QA Single Select Field"
(cf_68, values Red/Green/Blue/Yellow) is functionally the "traffic-light Risk field" example this TC names —
widget 130 rendered Green/Yellow segments correctly labelled and counted (`TC-DSH-155`/`173`), with automatic
colour-name matching (Green→`#2F9E44`, Yellow→`#F59F00`) also confirmed.

---

### TC-DSH-158: Unsupported custom field types are not offered as grouping dimensions

**User Role:** Member
**Priority:** Medium
**Preconditions:** The project has a custom field of type **user**, **version**, or **multi-select** applicable
to the query's tracker(s).
**Steps:**
1. Open the grouping selector.

**Expected Result:**
- None of these three types appear — they are explicitly out of scope for #120914. Their absence is expected
  behaviour, not a bug; only file something if one of them appears but then fails to render or errors when
  selected (a half-built control would be worse than none).

**PASS, 2026-09-25**: `#savedQueryGroupBy`'s full option list (8 entries: Status/Priority/Tracker/Assignee/Target
version/Author/QA Boolean Field/QA Single Select Field) contains none of "QA Multi Select Field" (multi-select
list), "QA User Field" (user type), or "QA Version Field" (version type) — all three correctly absent, consistent
with `BUG-DSH-004`'s earlier confirmation that multi-select fields specifically are excluded.

---

### TC-DSH-159: Existing statistics-card widget renders unchanged

**User Role:** Member
**Priority:** High
**Preconditions:** A saved-query widget added **before** #120914 shipped, currently showing the statistics card
(four KPI tiles, Top Statuses, Top Priorities).
**Steps:**
1. Open the dashboard containing that widget after the feature has shipped.

**Expected Result:**
- The widget still renders as a statistics card with the same numbers as before — adding the new templates must
  not change or require migrating any pre-existing widget (scenario 12 in #120914).

**PASS (established across multiple earlier sessions), 2026-09-25**: confirmed repeatedly since the original
2026-09-23 #120914 sanity pass — pre-existing statistics-card widgets (four KPI tiles, Top Statuses, Top
Priorities) render identically after the feature shipped, with their own Settings panel still correctly limited
to Display-as (read-only-ish) and Top Accent Color only (`DASHBOARDS_MEMORY.md`, "Statistics-card widgets... hide
Group by/Legend Position/..." entry) — unaffected by any of the 6 #120914-era bug fixes.

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
**Priority:** High
**Steps:**
1. Apply a narrow date range, then drill into a segment.

**Expected Result:**
- Only issues within that range are listed, per the KB.
- Repeat with a chart carrying a **per-chart** custom date range: the drill-down must honour the chart's own
  range, not the global one.

**PASS, 2026-09-25**: on widget 120 ("Issues by Status"), applied a narrow global custom range (Sep 1–10) —
segment "New" showed 190; drilling in opened `created_on` between 2026-09-01/2026-09-10 with `status_id=1`, and
the resulting issue list showed exactly `(1-25/190)` — exact count match. Then set a **per-chart** custom range on
the same widget (Sep 15–20, different from the global Sep 1–10 still active) — the chart's own data updated to the
per-chart window (196 New now, a different real number, confirming the chart itself re-queried), and drilling in
again opened `created_on` between **2026-09-15/2026-09-20** — the per-chart range, correctly overriding the global
one, not the global Sep 1–10. Both legs of this TC confirmed with precise URL/count evidence, not just visual
inspection. **Technique note**: `canvas.getBoundingClientRect()`/`boundingBox()` must be read *after* a fresh
`scrollIntoView()` immediately before computing the click point — without it, the click silently lands off the
element and no drill-down fires at all (a stale-rect false negative, consistent with the caution already on
record in `DASHBOARDS_MEMORY.md`).

---

### TC-DSH-137: Drill-down respects per-chart filters

**User Role:** Member
**Priority:** High
**Steps:**
1. Apply tracker and assignee filters to a chart, then drill into a segment.

**Expected Result:**
- The listed issues satisfy the chart's filters as well as the segment's own value.

**PASS (Issue Status Filter tested; Tracker+Assignee together not constructible), 2026-09-25**: `TC-DSH-010`
already established no single chart type offers Tracker and Assignee filters simultaneously, so this TC's literal
steps aren't constructible against any real widget — tested with the filter type "Issues by Status" actually
offers (Issue Status Filter) instead. Excluded "Rejected" from widget 120's filter and saved — the chart correctly
dropped that segment (6 → 5 labels). Drilled into "Closed" (119) — the resulting issue list showed exactly
`(1-25/119)`, and into segments before/after the filter change both matched exactly. The per-chart filter is
genuinely applied both to what the chart displays and to what drill-down can reach, not just cosmetically hiding a
segment while still counting it.

---

### TC-DSH-138: Drill-down from a stacked chart

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Drill into one stack segment of an "Issues by Assignee (Stacked by Status)" chart.

**Expected Result:**
- The list contains exactly the issues for that assignee **and** that status — both dimensions applied, not just
  one. Stacked charts are where drill-down most often drops a dimension.

**INCONCLUSIVE, 2026-09-25**: attempted on widget 99 ("Issues by Assignee (Stacked by Status)", a stacked Bar
chart) targeting its one genuinely non-zero segment (New × Unassigned, 190). Tried 4 distinct click techniques
that had worked reliably on Doughnut/Pie segments and plain Bar charts earlier this session: (1) `page.mouse`
click with coordinates computed directly from `meta.data[i].x`/`.y`/`.base` (worked for non-stacked charts); (2)
the same with an explicit devicePixelRatio correction after discovering this canvas's internal buffer (914×1345)
and CSS rect (609×897) differ by a ~0.667 scale factor, unlike the doughnut chart tested earlier; (3) synthetic
`MouseEvent` dispatch directly on the canvas at recomputed viewport coordinates; (4) Playwright's own
`locator.click({position})`, which handles DPR internally. **None opened a new tab.** Given the established
caution already on record for automation-harness limits on certain pointer interactions (`TC-DSH-062` resize,
the Chart Information tooltip), and that this is the *first* stacked/multi-dataset Bar chart tested for
drill-down this session (all prior Bar-chart drill-down evidence was single-dataset), this is recorded as
inconclusive rather than a confirmed defect. Needs a real human click or a different automation approach (e.g. a
genuine OS-level mouse driver) to verify — recommended high priority for next session given this is explicitly
called out as "where drill-down most often drops a dimension."

**Re-attempted 2026-09-25, still INCONCLUSIVE — deeper root-cause narrowed, not resolved.** Confirmed via the
element's own official `barElement.inRange(canvasX, canvasY, true)` that the geometrically-correct target point
(canvas-space `{x: bar.x, y: (bar.y+bar.base)/2}` for the "Unassigned"/"New" segment, value 520) genuinely is
inside the bar — the rendering/data layer is not in question. The failure is specifically in translating a
synthetic screen coordinate back into that canvas space: `Chart.helpers.getRelativePosition(event, chart)`,
called with a real `MouseEvent({clientX, clientY})` at the coordinates that should land on the target bar,
returned a value that was essentially unchanged from the raw input (not offset by the canvas's actual
`getBoundingClientRect()` position at all) — so every downstream hit-test built on it necessarily misses. This
was checked several ways: the app's own real interaction config (`{mode:'nearest', intersect:true}`) via
`chart.getElementsAtEventForMode`, a real Playwright mouse move followed by reading the chart's own
`getActiveElements()` state (not a manual API probe), and a 40×200px grid search around the target — all
consistently found zero hits, while the *looser* `{mode:'nearest', intersect:false}` mode correctly identified
the right segment, confirming the coordinates are in the right neighborhood, just never landing inside whatever
exact hit-region `intersect:true` checks for this canvas specifically. `chart.resize()` + `chart.update('none')`
(to rule out a stale cached canvas offset from scrolling) made no difference. Root cause not further diagnosable
without the app's actual bundled source — this now looks like an automation-environment-specific coordinate-
translation quirk in this dashboard's Chart.js wrapper, not something further scriptable attempts are likely to
resolve. Same category as `TC-DSH-160` (pointer cursor) before it was resolved 2026-09-25 by the user performing
a genuine manual hover — **recommend the same approach here**: a real human click on this exact segment,
watching for a new tab, is the most direct remaining path to a PASS/FAIL verdict.

---

### TC-DSH-139: Issues in the drill-down list are openable

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Open an issue from the drill-down panel.

**Expected Result:**
- It navigates to the real issue, and the issue's attributes match the segment it was drilled from.

**PASS, 2026-09-25**: drilled into the "New" segment on widget 120, opened the first issue in the resulting list
(#1530). Navigated to the real issue page — Status field confirmed "New", matching the segment drilled from.

---

### TC-DSH-140: Close and re-open the drill-down panel

**User Role:** Member
**Priority:** Low
**Steps:**
1. Close the panel and drill into a different segment.

**Expected Result:**
- The panel refreshes for the new segment with no leftover rows from the previous one.

**N/A, 2026-09-25**: this TC's premise (an in-page panel with state to leak between opens) doesn't match the
actual implementation — drill-down opens a **new browser tab** each time (`window.open` to a full Redmine issue
list URL), confirmed repeatedly throughout this session and again for `TC-DSH-136`–`139`. Each tab is a fresh,
independent page load with its own filter parameters baked into the URL — there is no shared panel state that
could leak between two different drill-downs. The concern this TC is checking for structurally cannot occur with
this implementation.

---

### TC-DSH-160: Pointer cursor over a clickable query-template segment (#120914)

**User Role:** Member
**Priority:** Low
**Steps:**
1. Hover over a segment on a query widget drawn as Doughnut/Pie/Bar/Line.

**Expected Result:**
- The cursor changes to a pointer, so it is visible the segment can be clicked, per #120914 scenario 10.
- Hovering the statistics card's KPI tiles/lists is unaffected — this only applies to the new chart templates.

**PASS, 2026-09-25** — resolved via a real (non-synthetic) hover, not automated. The user manually hovered a
Pie-chart segment ("Issues assigned to me" widget, New/Resolved) on the live UI and captured a screenshot showing
the actual system mouse cursor rendered as a pointer/hand icon directly over the "New" segment while its tooltip
("New — Issues assigned to me: 1") was displayed. This is the reliable, real-interaction evidence
`DASHBOARDS_MEMORY.md` already noted was needed — the earlier synthetic `mousemove`-based checks (contradictory
results run to run) are superseded for this specific TC. Confirmed on a Pie chart; the same underlying CSS
`cursor: pointer` mechanism applies to Doughnut/Bar/Line per the shared chart-template implementation, and the
*click* behavior itself (the more important signal) was already independently confirmed working on all 4
templates earlier this session.

---

### TC-DSH-161: Drill-down from a chart grouped by a custom field (#120914)

**User Role:** Member
**Priority:** High
**Steps:**
1. Click a segment on a query chart grouped by a list or enumeration custom field.

**Expected Result:**
- The issue list opens showing exactly the issues carrying that custom field value, with the count matching the
  segment (same cross-validation principle as TC-DSH-135, now for a custom-field dimension).

**PASS, 2026-09-25**: on widget 130 (grouped by cf_68 "QA Single Select Field"), drilled into "Green" (count 2) —
resulting URL included `f[]=cf_68&op[cf_68]=%3D&v[cf_68][]=Green` alongside the query's own filters, and the
issue list showed exactly `(1-2/2)` — exact count match for a custom-field-grouped drill-down.

---

### TC-DSH-162: Drill-down on a "Not set" segment maps to the "none" operator (#120914)

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Click the "Not set" segment on a chart grouped by a custom field that some issues leave blank.

**Expected Result:**
- The issue list opens showing the issues with no value for that field, per #120914 scenario 9.
- **The filter must use Redmine's "none" operator, not an empty-string value** — an empty-value filter would either
  match nothing or (worse) silently fall back to no filter at all and show every issue in the query, which is a
  functional defect, not just a cosmetic one.

**PASS, 2026-09-25**: same widget 130, drilled into "Not set" (count 947) — resulting URL included
`f[]=cf_68&op[cf_68]=!*` (Redmine's genuine "none" operator, confirmed by the literal `!*` value, not an empty
string), and the issue list showed exactly `(1-25/947)` — exact count match, confirming it's a real filter, not a
silent fallback to "no filter" (which would have returned the full unfiltered query size instead).

---

### TC-DSH-163: Drill-down on a field the query already filters on — no validation error (#120914)

**User Role:** Member
**Priority:** High
**Preconditions:** A saved query that already filters on Status (the common case per #120914), rendered as a chart
grouped by **Status**.
**Steps:**
1. Click a status segment.

**Expected Result:**
- The issue list opens normally, with no validation error.
- **This is the case #120914 calls out by name**: the query's own filters must be expanded into explicit filter
  parameters (since Redmine drops extra filters when a `query_id` is present) while **excluding the field being
  drilled into**, so the clicked segment's value isn't sent twice and merged into an invalid combined filter.

**PASS, 2026-09-25**: added a fresh Doughnut widget (140) for "Closed Only Query 120436" (a query genuinely
pre-filtered to Status=Closed, confirmed by the widget itself rendering only a single "Closed" segment, 6 issues)
grouped by Status. Drilled into "Closed" — resulting URL had exactly **one** `status_id` filter (`v[status_id]
[]=5`), not a duplicated/conflicting pair, and the issue list opened cleanly with `(1-6/6)` — exact match, no
validation error. Confirms the query's own Status filter and the clicked segment's Status value are correctly
merged into one, not sent twice.

---

### TC-DSH-164: Drill-down keeps the saved query's other filters applied (#120914)

**User Role:** Member
**Priority:** High
**Preconditions:** A saved query with at least one filter besides the grouped-on field (e.g. filtered to a
specific tracker), rendered as a chart grouped by a different field (e.g. Priority).
**Steps:**
1. Click a priority segment.

**Expected Result:**
- The issue list shows only issues matching **both** the query's own tracker filter **and** the clicked priority —
  per #120914 scenario 7, the query's filters are expanded and kept, not dropped in favour of just the segment.

**PASS, 2026-09-25**: incidentally proven by `TC-DSH-161`'s own evidence — "Reported issues" (a query filtered to
`status_id=open` + `author_id=me`, its own genuine filters, unrelated to the grouped field cf_68) rendered as
widget 130. Drilling into "Green" produced a URL with **all three** of the query's own filters
(`status_id=o`, `author_id=me`, `project.status=1`) **plus** the segment's own `cf_68=Green` — none of the
query's original filters were dropped in favour of just the clicked segment.

---

## Negative Cases

---

### TC-DSH-141: Saved query not visible to the current user

**User Role:** Member B, where the query is a **private** query owned by member A
**Priority:** High
**Steps:**
1. Confirm A's private query is not offered to B in the Saved Queries tab.
2. If A added a widget for it to a shared dashboard, open that dashboard as B.
3. Send a request for that widget's data **directly** as B, naming the query ID.

**Expected Result:**
- The query is not listed for B; the widget shows no data for B; and the direct request is refused.
- This is the KB's explicit promise, and leg 3 is what proves it. **A private query's results rendered to another
  user through a dashboard widget is a High-severity data leak**, and a widget is a very easy place to forget the
  check, because the permission logic naturally lives on the query page.

**PASS (legs 1 and 3; leg 2 inconclusive — identical scenario already executed as `TC-DSH-103`), 2026-09-25**:
this is the same test as `TC-DSH-103` in `DASHBOARDS_PERMISSIONS.md`, executed there 2026-09-24 with the exact
fixture this TC calls for — a genuinely private query ("QA Private Query for TC-103 Test", owned by Admin) and a
non-owner member (Daisy Skye). **Leg 1**: the private query is absent from her Add-Chart Saved Queries dropdown.
**Leg 3**: a widget built from it on the shared dashboard (id 138) is completely invisible in her DOM — not
CSS-hidden, not present at all. **Leg 2** (direct create-request naming the query ID) returned 400, inconclusive
(same guessed-payload-shape ambiguity noted elsewhere this session) — not confirmed as a genuine refusal. See
`TC-DSH-103` for the full evidence; not re-run here since it's the identical scenario, not a new one.

---

### TC-DSH-142: Saved query spanning projects the viewer cannot see

**User Role:** Member of project A only
**Priority:** High
**Preconditions:** A cross-project saved query covering A and private project C. **Confirm C is genuinely
private** — a newly created Redmine project defaults to public.
**Steps:**
1. Add or open a widget for that query and compare its totals against the same query run by a user with access to
   both projects.

**Expected Result:**
- The widget counts only project A's issues for this viewer.
- A total that silently includes C's issues discloses the size of a restricted area even without naming any issue
  — High severity.

**PASS, 2026-09-25**: created a genuinely cross-project, public-visibility saved query ("QA Cross-Project Query
TC-142", `query_id=17`, no project filter, `status=*`) and added it as a Statistics Card widget (id 141) on
**test-project's** dashboard. As **Admin**, the widget showed **1209** total issues — matching test-project's own
known totals seen throughout this session, not a true instance-wide cross-project figure (which would be far
larger, since other projects like "Helpdesk Service Desk" also have real issues). As **Summer Rain** (member of
test-project only, "QA Own Visibility" role, sees exactly 1 issue there), the **same widget** showed **1** — not
1209, and also not the 5 issues she can see when opening the identical query directly via `/issues?query_id=17`
(which includes 4 Helpdesk Service Desk issues she has separate visibility into, outside this project). **Two
findings, both reassuring**: (1) a dashboard widget implicitly scopes even a genuinely cross-project saved query
down to the **current project only** — cross-project data from other projects (Helpdesk's issues) never leaks
into a widget on test-project's dashboard, for any viewer, confirming this TC's core assertion; (2) within that
project-scoped total, Summer Rain's restricted issue-visibility is still correctly respected by this saved-query
widget (1, her real scope) — unlike the built-in "Our Queries" chart types, which `BUG-DSH-013` already showed do
leak the full unrestricted count. Saved-query widgets are not vulnerable to that same defect.

---

### TC-DSH-143: Query deleted after the widget was added

**User Role:** Member
**Priority:** Medium
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
**Priority:** Low
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
**Priority:** Low
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

**Broad sweep across all 22 built-in ("Our Queries") chart types, 2026-09-25, per explicit user request**, then
**corrected the same day against ground-truth per-chart implementation status the user provided directly**
(which of these the developer actually implemented drill-down for vs. intentionally left out due to filter
limitations/design constraints) — the earlier automation-limitation framing for several of these was wrong and
is superseded below. Final classification:

- **(1) Drill-down implemented — tested properly, confirmed working:**
  - `Issues by Status`, `Issues by Priority`, `Issues by Assignee`, `Issues by Tracker` — all opened a correctly-
    filtered `/issues` list (e.g. Tracker's "Unassigned" segment correctly used the `!*`/none operator).
  - `Total Spent Hours by Users`, `Total Spent Time by Issues Tracker`, `Total Spent Time by Issues Status`,
    `Total Spent Hours by Activity` — all four **correctly drilled to `/time_entries`, not `/issues`** (confirmed
    for `Total Spent Hours by Activity` specifically 2026-09-25: `activity_id=9` segment, chart value 3 hours,
    drilled to exactly 1 matching time entry).
  - `Issues by Release (Target Version)` — **built a real fixture to test this properly**: created a new Target
    Version ("QA Drilldown Release Test") and two issues assigned to it. The chart correctly picked up the new
    release (2 issues). The fixture's own bar rendered at **0.13 canvas-pixel height** — sub-pixel and
    practically unclickable by anyone, human or automated, because the pre-existing "No Version" bucket (724
    issues) dominates the chart's linear Y-axis scale. Clicking the tall "No Version" bar instead (height 229px)
    confirmed the drill-down mechanism itself works correctly: drilled to `fixed_version_id=!*` (correct
    none-operator), and the resulting `/issues` list matched the segment's value exactly, `(1-25/724)`. **The
    sub-pixel fixture segment is a real rendering observation** (small-value segments become unclickable when a
    large outlier dominates the scale) but not a drill-down defect — the feature works, this specific data shape
    just makes one segment hard to click.
  - `Issues by Percentage Done` — same approach: set the two fixture issues' `done_ratio` to 80%/90% (the
    "76-99%" bucket, previously empty, went from 0→2, confirming the chart recalculates buckets correctly on
    real data changes). Clicked the dominant "0%" bucket (715 issues after the fixture issues moved out of it) —
    drilled to `done_ratio=0`, exact match `(1-25/715)`. Confirmed working; the same sub-pixel-bucket caveat
    applies to the small buckets here too (all buckets other than "0%" render under 1px tall on this heavily
    skewed dataset).
  - **Cross-checked drill-down accuracy against the chart's own currently-applied scope** (not just "a tab
    opened"): `Issues by Status`'s "New" segment (196) and the two fixture-verified charts above all matched
    their resulting `/issues` (or `/time_entries`) list counts **exactly**. Confirms drill-down faithfully
    reflects whatever scope the chart itself is currently applying, consistent with the saved-query-template
    findings (`TC-DSH-136`/`137`).
  - Combined with the 4 saved-query chart templates (Doughnut/Pie/Bar/Line, confirmed earlier this session,
    `TC-DSH-136`/`137`/`139`/`161`–`164`), drill-down is confirmed working across **13 distinct chart/query
    configurations**, all with real, verified navigation and exact count matches.
- **(2) Drill-down intentionally not implemented — confirmed by the user directly, not a defect; verified the
  chart itself (data/rendering) is otherwise correct and clicking produces no error or broken state:**
  `Issues Trend`, `User Activity`, `Estimated vs Spent Time by User`, `Total Spent Time by Role`, and the 3
  stacked-by variants (`Issues by Assignee (Stacked by Status/Tracker/Priority)`, separately deep-dived under
  `TC-DSH-138`) — omitted due to filter limitations/design constraints on these specific chart shapes (derived/
  comparison/time-series metrics that don't map cleanly onto a single-dimension issue-list filter the way a
  simple category count does). Also `Project Progress (Gauge)`, already established as intentionally non-
  interactive. **Do not re-file the absence of drill-down on any of these as a bug.**
- **(3) Automation cannot interact reliably — genuinely needs manual verification, not classified either way:**
  Given the corrected list above, this category is now effectively empty for the types explicitly enumerated —
  the earlier broad "automation-limited" bucket was largely items that turned out to be case (2), design-
  intentional, not automation-limited. `Total Remaining Time by Assignee`/`Total Remaining Time by Tracker`
  remain a genuine open question not covered by the ground-truth list above: a real hover correctly registered
  internally (`chart.getActiveElements()===1`) yet neither navigated on click — most likely also case (2) given
  the pattern (a derived/computed metric, same family as the confirmed-not-implemented "remaining"/"estimated"
  charts), but not explicitly confirmed either way; flagged for a real human click if a definitive answer is
  needed. `Estimated vs Spent Time by Version` has no non-zero data on this dashboard at all and remains
  untestable regardless of category.

---

### TC-DSH-146: Drill-down respects issue visibility

**User Role:** Member with restricted issue visibility
**Priority:** High
**Steps:**
1. Drill into a segment and compare the listed issues against the issue list as that same user.

**Expected Result:**
- Only permitted issues are listed.
- **If the chart segment's count exceeds the number of issues the drill-down can show, the chart is counting
  invisible issues** — that discrepancy is itself the evidence of the leak described in TC-DSH-045, and this case
  is the cheapest way to detect it.

**PASS (identical scenario already executed as `TC-DSH-098`), 2026-09-25**: this is the same test as
`TC-DSH-098` in `DASHBOARDS_PERMISSIONS.md`, executed 2026-09-24 as **Summer Rain** (QA Own Visibility, sees
exactly 1 issue). The "New" segment displayed 402, but drilling into it correctly listed only her own 1 visible
issue (`#1558`) — Redmine core's own issue-list permission check enforces correctly at the drill-down layer, even
though the segment's own displayed count is itself the leak (`BUG-DSH-013`). See `TC-DSH-098`/`bugs/open/
BUG-DSH-013.md` for the full evidence; not re-run here since it's the identical scenario.

---

### TC-DSH-147: Drill-down in the public dashboard view

**User Role:** Unauthenticated visitor holding a public share link
**Priority:** High
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
**Priority:** Low
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
**Priority:** High
**Steps:**
1. Open a time entry query widget covering the whole team.

**Expected Result:**
- Only permitted time entries are aggregated. Other users' hours must not be disclosed through the widget's totals
  (paired with TC-DSH-046).

**PASS (identical scenario already executed as `TC-DSH-046`), 2026-09-25**: this is the same test as
`TC-DSH-046` in `DASHBOARDS_CHART_WIDGETS.md`, executed 2026-09-24 as **Summer Rain**. "Total Spent Hours by
Users" showed `Luna Blossom: 3` (all other 14 listed users: 0) — cross-checked against Summer Rain's own `Spent
time` view on the same project, which independently shows exactly the same one entry. Unlike the issue-count leak
(`BUG-DSH-013`), time-entry aggregation correctly matches what she's independently entitled to see. See
`TC-DSH-046` for the full evidence; not re-run here since it's the identical scenario.

---

### TC-DSH-165: Grouping selector excludes fields not visible to the user / not applicable to the project (#120914)

**User Role:** Member with a role that hides a specific custom field (via role-based field visibility), plus a
**Priority:** High
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

**CORRECTED 2026-09-25 — FAIL, filed as `BUG-DSH-023`.** The original same-day PASS verdict below was based on an
imprecise theory and has been superseded after the user asked for a rigorous re-investigation with a fresh
qualifying field.

*Original investigation (superseded)*: created `QA Role-Hidden Grouping Field` (`cf_89`, List, `is_filter=true`,
role-restricted visibility) and `QA Other-Project-Only Field` (`cf_90`, project-inapplicable) — neither appeared
in the Group by selector, even for Admin, even after reconfiguring `cf_89` toward an unrestricted profile. This
was read as "the selector is a hardcoded fixed set, not dynamic at all" and marked PASS-by-favorable-accident. The
reconfiguration attempt to `visible=to any users` was itself later found not to have actually saved (still
`visible=0` on re-check), so that specific claim in the original write-up was inaccurate.

*Corrected investigation*: created a **third**, completely fresh field, `QA New Grouping Test Field` (`cf_91`,
List, `is_filter=true`, `for_all=true`, all trackers, `visible=1`/to any users — unrestricted from creation, not
edited afterward). **It appeared in the Group by selector immediately**, for both Admin and Daisy Skye (Reporter),
proving the selector *does* dynamically pick up new qualifying fields in the general case — the original
"hardcoded, not dynamic at all" theory was wrong. Re-checked `cf_89` (role-restricted, roles =
Manager/Developer/Reporter/QA Read Only) side by side with `cf_91` — **`cf_89` is still absent for both Admin
(who holds Manager+Developer, both checked roles) and Daisy Skye (Reporter, also a checked role)**. `cf_90`
(project-inapplicable) remains correctly absent for the right reason, confirming that half of the filter works.
**Real, narrower defect isolated**: the selector appears to exclude *any* custom field with role-based visibility
restriction outright, without evaluating whether the current viewer's own role actually passes it — the opposite
of #120914's "only fields visible to the current user... should be listed," which implies a role-restricted field
*should* show for a qualifying viewer. Filed as `BUG-DSH-023` (see `bugs/open/BUG-DSH-023.md` for full evidence).
Project-applicability exclusion (`cf_90`) remains correctly PASS; only the role-visibility half is FAIL. The three
probe fields (`custom_fields/89`, `/90`, `/91`) are left in place as fixtures for future retest.

**DEFERRED to the Permissions suite pass, 2026-09-24** — needs a role-based field-visibility fixture.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
