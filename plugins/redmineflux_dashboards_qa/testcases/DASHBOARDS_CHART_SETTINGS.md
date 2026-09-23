# Test Cases — Redmineflux Analytics Dashboard — Per-Chart Settings, Filters & Date Ranges

> Source: vendor KB — "How to Change the Chart Legend Position", "How to Show or Hide Data Labels",
> "How to Change the Chart Color", "How to Apply Data Filters to a Chart",
> "How to Set a Custom Date Range for a Single Chart", FAQ Q2, Q3, Q8.
> Additional source: production issue **#120914** ("Custom Dashboard: Chart Templates and Custom Field Grouping
> for User-Defined Queries") — TC-DSH-166 onward.
> **Status: authored 2026-09-15, extended 2026-09-22 for #120914. Not yet executed.**

## Plugin
- Name: Redmineflux Analytics Dashboard
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_dashboards_qa

## Navigation methodology

Chart card → the **settings** icon → the **General**, **Appearance** or **Data Filters** section → Save.
Each setting must be verified by its visible effect on the chart, and by persistence across a full reload.

---

## Functional Cases — General settings

---

### TC-DSH-001: Legend position

**User Role:** Member
**Steps:**
1. Settings → General → **Legend Position** → set Top, then Bottom, then Left, then Right, saving each time.

**Expected Result:**
- The chart updates immediately for each of the four documented positions.
- The legend does not overlap the plot area or get clipped at any position, including on a small widget.

---

### TC-DSH-002: Show and hide data labels

**User Role:** Member
**Steps:**
1. Settings → General → **Show Data Labels** → Show, save; then Hide, save.

**Expected Result:**
- Values appear on the chart when shown and disappear when hidden.
- When shown, the labels display the same numbers the tooltip and the underlying query give — a label that rounds
  differently from the data it labels is a correctness defect, not a cosmetic one.

---

### TC-DSH-003: Settings persist across reload

**User Role:** Member
**Steps:**
1. Change legend position, data labels and colours; reload the page.

**Expected Result:**
- All settings are restored exactly.

---

## Functional Cases — Appearance

---

### TC-DSH-004: Top accent colour

**User Role:** Member
**Steps:**
1. Settings → Appearance → set the **Top Accent Color**; save.

**Expected Result:**
- The card header border takes the chosen colour, per the KB.

---

### TC-DSH-005: Prebuilt colour palettes

**User Role:** Member
**Steps:**
1. Apply each available prebuilt palette to a multi-series chart.

**Expected Result:**
- Series colours change consistently and remain **mutually distinguishable** — a palette in which two adjacent
  series render near-identically defeats the chart's purpose and is worth recording.

---

### TC-DSH-006: Individual custom series colours

**User Role:** Member
**Steps:**
1. Set custom colours for individual series; save.

**Expected Result:**
- Each series takes its assigned colour, overriding the palette.

---

### TC-DSH-007: Card background and border colour

**User Role:** Member
**Steps:**
1. Set the card background and border colours; save.

**Expected Result:**
- Applied to the card.
- Text, axis labels and data labels stay **legible** against the chosen background. A configuration that renders
  the chart unreadable without warning is a usability defect, and it is easy to reach here.

---

### TC-DSH-008: Appearance settings are per chart

**User Role:** Member
**Steps:**
1. Style one chart distinctively and confirm the others are unaffected.

**Expected Result:**
- Styling is scoped to the individual widget, as the KB describes ("individually or globally").

---

## Functional Cases — Query-template chart appearance & segment order (#120914)

> Covers issue #120914 parts 3 and 4: appearance controls only make sense once a saved-query widget is drawn as a
> real chart, and segment order/colour must follow the grouping dimension's own defined order rather than segment
> size, so a re-ordered/recoloured chart still reads correctly after the underlying counts change.

---

### TC-DSH-166: Appearance settings become available for a chart-template query widget

**User Role:** Member
**Preconditions:** A saved-query widget added as a Doughnut/Pie/Bar/Line (grouped by any dimension).
**Steps:**
1. Open that widget's Settings.

**Expected Result:**
- Colour palette, legend position and data labels controls are present and functional — per #120914, "it is a real
  chart and those settings apply."

---

### TC-DSH-167: Appearance settings stay hidden for the statistics card

**User Role:** Member
**Preconditions:** A saved-query widget left on (or switched back to) the Statistics card template.
**Steps:**
1. Open that widget's Settings.

**Expected Result:**
- Colour palette, legend position and data labels controls remain hidden, exactly as before #120914 — "a grid of
  numbers has nothing to apply them to."

---

### TC-DSH-168: Segment order follows a list custom field's own defined order

**User Role:** Member
**Preconditions:** A list custom field with a defined, non-alphabetical value order (e.g. Low, Medium, High,
Critical).
**Steps:**
1. Add a query chart grouped by that field, with issue counts arranged so the values are **not** already in
   size order (e.g. "Critical" has the fewest issues).

**Expected Result:**
- Segments appear in the field's defined order (Low → Medium → High → Critical), **not** ordered by count, per
  #120914 part 4.

---

### TC-DSH-169: Segment order follows configured order for Status/Priority/Tracker/Target version

**User Role:** Member
**Steps:**
1. Add a query chart grouped by Status (or Priority/Tracker/Target version), with counts arranged so the largest
   value is not the one configured first.

**Expected Result:**
- Segments follow that field's own configured order (e.g. the workflow's status order), not descending count.

---

### TC-DSH-170: Assignee/Author grouping stays largest-first

**User Role:** Member
**Steps:**
1. Add a query chart grouped by Assignee (then, separately, by Author).

**Expected Result:**
- Segments are ordered largest-count-first, since neither dimension has an inherent order of its own, per
  #120914's explicit exception.

---

### TC-DSH-171: "Not set" segment always trails the real values

**User Role:** Member
**Steps:**
1. Add a query chart grouped by a custom field where "Not set" is not the smallest segment (i.e. more issues have
   no value than have any single defined value).

**Expected Result:**
- "Not set" is still drawn **last**, after every real value, regardless of its own count.

---

### TC-DSH-172: Order and colour-to-label mapping stay stable when counts change

**User Role:** Member
**Steps:**
1. Note the segment order and colours of a chart grouped by a field with a defined order.
2. Change enough issues' values (or add new issues) that a different value becomes the largest segment.
3. Refresh the chart.

**Expected Result:**
- Segment order is unchanged, and each label keeps the same colour it had before — per #120914 scenario 6, a
  stable order is what keeps a chosen palette lined up with its labels, since colours are applied by position.

---

### TC-DSH-173: Colour-named custom field values are auto-coloured — English

**User Role:** Member
**Preconditions:** No colour palette explicitly configured for the chart. A custom field whose values are named
after colours in English (e.g. Green/Yellow/Red).
**Steps:**
1. Add a query chart grouped by that field.

**Expected Result:**
- Segments are drawn in the colours the values name — Green segment green, Yellow segment yellow/amber, Red
  segment red — with no palette configured, per #120914 scenario 3.

---

### TC-DSH-174: Colour-named custom field values are auto-coloured — German

**User Role:** Member
**Preconditions:** Same as TC-DSH-173, but the field's values are set up in German (e.g. Grün/Gelb/Rot).
**Steps:**
1. Add a query chart grouped by that field on a German-language session.

**Expected Result:**
- The same colour matching applies in German — Grün → green, Gelb → yellow/amber, Rot → red — per #120914's
  explicit requirement that colour-name matching work "in English and German, as the values carry whatever
  language the field was set up in."

---

### TC-DSH-175: Non-colour-named values fall back to the generic palette

**User Role:** Member
**Preconditions:** No colour palette explicitly configured. A custom field whose values are not colour names (e.g.
"OK / Warning / Critical").
**Steps:**
1. Add a query chart grouped by that field.

**Expected Result:**
- The chart falls back to the generic palette, per #120914 scenario 4.
- **No two segments render the same colour** — a palette collision on a field with only 2–3 values is the easiest
  place for this to go wrong.

---

### TC-DSH-176: An explicit palette overrides automatic colour-name matching

**User Role:** Member
**Preconditions:** A chart grouped by a colour-named custom field (as in TC-DSH-173).
**Steps:**
1. In Chart Settings → Appearance, set an explicit colour palette.

**Expected Result:**
- The configured palette's colours are used instead of the automatic colour-name match, per #120914 scenario 5 ("a
  palette set in chart settings should still override it").

---

## Functional Cases — Chart-template widget Settings scope & legend correctness (#120914 follow-up)

> Added 2026-09-23 following live investigation of the Settings panel and chart legends prompted directly by the
> user. Covers `BUG-DSH-005` (Save Settings breaks live rendering; Data Filters section shouldn't exist),
> `BUG-DSH-006` (no post-creation Display as/Group by editing), and `BUG-DSH-007` (Bar/Line legend shows the query
> name instead of the category label). All currently **FAIL** against the live build — see the linked bugs.

---

### TC-DSH-181: Saving Chart Settings with no changes is a true no-op

**User Role:** Member
**Preconditions:** A chart-template (Doughnut/Pie/Bar/Line) saved-query widget already rendering real data.
**Steps:**
1. Open the widget's Settings.
2. Without changing anything, click **Save Settings**.
3. Observe the chart card in place (no page reload).
4. Reload the page and observe the same card again.

**Expected Result:**
- The chart keeps showing exactly the same data before and after the save, with no visible change at any point.
- **FAIL, live build**: the chart body is immediately replaced with "No Data Available" right after Save Settings,
  even though the server's own response carries fully correct data. A page reload recovers it. See `BUG-DSH-005`.

---

### TC-DSH-182: Save Settings preserves an already-set Top Accent Color

**User Role:** Member
**Preconditions:** A chart-template widget with a custom Top Accent Color already set (not the default `#2196F3`).
**Steps:**
1. Open Settings, change nothing, click **Save Settings**.
2. Reopen Settings and check the Top Accent Color field.

**Expected Result:**
- The previously-set colour is still shown.
- **FAIL, live build**: the colour silently reverts to the default `#2196F3`, confirmed both in the save response
  and after a page reload. See `BUG-DSH-005`.

---

### TC-DSH-183: Issue Status Filter selection is actually sent and applied

**User Role:** Member
**Preconditions:** A chart-template widget's Settings panel, Data Filters → Issue Status Filter set to "All Issues".
**Steps:**
1. Change Issue Status Filter to "Open Issues Only" (or "Closed Issues Only").
2. Click **Save Settings**.
3. Inspect the outgoing `PATCH .../widgets/:id/settings` request body.
4. Reopen Settings and check the field's value.

**Expected Result:**
- The chosen value is included in the save request and persists on reopening.
- **FAIL, live build**: the request body never includes an `issue_status_filter` key at all — the selection is
  silently discarded, and the field always reads back as whatever it was before ("all"). See `BUG-DSH-005`.
- **Design note**: per the user, the correct fix is to remove this control entirely (not make it work) — see
  TC-DSH-184.

---

### TC-DSH-184: Chart-template widget's Settings panel has no unrelated Data Filters section

**User Role:** Member
**Preconditions:** Any chart-template (Doughnut/Pie/Bar/Line) saved-query widget.
**Steps:**
1. Open the widget's Settings and read the panel top to bottom.

**Expected Result:**
- Only **Display as**, **Group by**, and **Chart Color Palette** (plus Accent Color) appear — no separate Data
  Filters/Issue Status Filter section, since which issues are shown is already fully determined by the saved query
  itself (per the panel's own banner text: "Which issues are shown is controlled by the saved query itself").
- **FAIL, live build**: a Data Filters section with an Issue Status Filter dropdown is present (and non-functional
  — see TC-DSH-183). See `BUG-DSH-005`.

---

### TC-DSH-185: Chart template (Display as) can be changed after creation

**User Role:** Member
**Preconditions:** A saved-query widget already added as Doughnut.
**Steps:**
1. Open the widget's Settings.
2. Look for a **Display as:** control to change the template to Pie/Bar/Line.

**Expected Result:**
- A Display as: selector is present in Settings, matching the one in the Add Chart dialog, and changing it updates
  the widget's rendered chart type without deleting and re-adding the widget.
- **FAIL, live build**: no Display as control exists anywhere in the Settings panel — confirmed via a full
  accessibility-tree regex search returning zero matches for `/Display as|Group by|Chart Type|Chart Style/i`. The
  template is permanently fixed at Add-Chart time. See `BUG-DSH-006`.

---

### TC-DSH-186: Group by can be changed after creation, updating with Display as

**User Role:** Member
**Preconditions:** A saved-query widget already added and grouped by Status.
**Steps:**
1. Open the widget's Settings.
2. Look for a **Group by:** control, and confirm it updates when Display as is changed (mirroring the Add Chart
   dialog's behaviour).

**Expected Result:**
- A Group by: selector is present and editable in Settings, offering the same standard/custom field list as the
  Add Chart dialog.
- **FAIL, live build**: no Group by control exists in Settings at all — same investigation as TC-DSH-185. See
  `BUG-DSH-006`.

---

### TC-DSH-187: Doughnut/Pie chart legend shows the grouped category label

**User Role:** Member
**Steps:**
1. Add a saved-query widget as Doughnut (and separately as Pie), grouped by any dimension.
2. Read the chart's legend.

**Expected Result:**
- The legend lists the grouped category value(s) (e.g. "Closed", "Not set", "Green") — matching the segment(s).
- **PASS, live build**: confirmed via `Chart.getChart(canvas).legend.legendItems` — the rendered legend text
  matches `chart.data.labels` exactly for both Doughnut and Pie.

---

### TC-DSH-188: Bar/Line chart legend shows the grouped category label, not the query name

**User Role:** Member
**Steps:**
1. Add the **same** saved-query widget as Bar (and separately as Line), same grouping as TC-DSH-187.
2. Read the chart's legend and compare against the X-axis category labels.
3. Repeat with a grouping that produces **multiple** categories (e.g. Priority — Low/Normal/High/Urgent/Immediate),
   and with a **custom-field** grouping (e.g. a boolean field — Yes/No/Not set), to confirm the defect is
   independent of category count and of standard- vs custom-field grouping.

**Expected Result:**
- The legend should list the grouped category value(s), exactly as Doughnut/Pie correctly do (TC-DSH-187) — one
  entry per category, matching each bar/line point.
- **FAIL, live build**: Bar and Line always show a single legend entry equal to the saved query's own name (e.g.
  "Closed Only Query 120436", "Updated issues") instead of the category label(s) — confirmed with 1-category,
  5-category (Priority), and custom-Boolean-field groupings alike. With multiple categories this leaves no way to
  tell which bar/line colour corresponds to which category from the legend at all. See `BUG-DSH-007`.
- **Drill-down is unaffected by this defect** — clicking a Bar segment still opens the correctly-filtered issue
  list with the exact matching count, confirmed across every grouping combination tested in `BUG-DSH-007`. This is
  a purely cosmetic/legend-rendering defect, not a data or interaction one.

---

## Functional Cases — Per-chart data filters

---

### TC-DSH-009: Apply each available data filter

**User Role:** Member
**Steps:**
1. Settings → **Data Filters** → for each filter the chart type offers — Issue Status, Tracker, Priority,
   Assignee, Version, Activity, Role, User — move values from available to selected and save.

**Expected Result:**
- The chart redraws using only the selected values.
- **Cross-check each filtered chart against the equivalent Redmine query.** A filter that redraws the chart but
  does not actually constrain the data is the defect this case exists to catch, and it looks correct at a glance.

---

### TC-DSH-010: Available filters depend on the chart type

**User Role:** Member
**Steps:**
1. Compare the filter options offered on an issue chart with those on a time-tracking chart.

**Expected Result:**
- Filters are appropriate to the chart type — Activity and Role on time charts, Tracker and Priority on issue
  charts, per FAQ Q8.
- A filter offered on a chart type it cannot apply to, which then silently does nothing, is a defect.

---

### TC-DSH-011: Multiple filters combine

**User Role:** Member
**Steps:**
1. Apply a tracker filter and an assignee filter to one chart.

**Expected Result:**
- The result is the intersection — a subset of each applied alone. Verify against an equivalent issue-list query.

---

### TC-DSH-012: Clearing a filter restores the full data

**User Role:** Member
**Steps:**
1. Move all values back to the available list and save.

**Expected Result:**
- The chart returns to unfiltered data for the active date range. No filter remains silently applied.

---

### TC-DSH-013: Per-chart filters are independent

**User Role:** Member
**Steps:**
1. Apply different filters to two charts of the same type.

**Expected Result:**
- Each reflects only its own filters. Filter state must not bleed between widgets.

---

## Functional Cases — Per-chart date range

---

### TC-DSH-014: Set a custom date range on one chart

**User Role:** Member
**Steps:**
1. Settings → General → set **Custom Start Date** and **Custom End Date**; save.

**Expected Result:**
- That chart shows data for its own range.
- Its data matches an equivalent Redmine query constrained to the same dates.

---

### TC-DSH-015: A per-chart range overrides the global range

**User Role:** Member
**Steps:**
1. With one chart on a custom range, change the **global** date range and Apply Filters.

**Expected Result:**
- Charts without an override update to the new global range.
- The overridden chart **does not change** — the KB's central claim for this feature (FAQ Q3).

---

### TC-DSH-016: Clearing the custom range restores global behaviour

**User Role:** Member
**Steps:**
1. Clear both custom date fields and save; then change the global range.

**Expected Result:**
- The chart follows the global range again, exactly as the KB describes.

---

### TC-DSH-017: Per-chart range survives a copy

**User Role:** Member
**Steps:**
1. Copy a chart that has a custom date range.

**Expected Result:**
- The copy carries the same custom range and can then be changed independently (paired with TC-DSH-036).

---

## Negative Cases

---

### TC-DSH-018: End date before start date

**User Role:** Member
**Steps:**
1. Set a custom end date earlier than the start date and save.

**Expected Result:**
- Rejected with a clear message, or normalised. Not an empty chart with no explanation — an empty chart is
  indistinguishable from "no data", which hides the mistake.

---

### TC-DSH-019: Only one of the two custom dates set

**User Role:** Member
**Steps:**
1. Set a custom start date but leave the end date blank, and save; then the reverse.

**Expected Result:**
- Behaviour is explicit and documented — open-ended in the missing direction, or rejected as incomplete.
- A half-set range that silently reverts to the global range without saying so is misleading, because the settings
  panel then disagrees with what the chart is showing.

---

### TC-DSH-020: Date range with no data

**User Role:** Member
**Steps:**
1. Set a custom range far in the past or future where no issues or time entries exist.

**Expected Result:**
- A clean empty state, not `NaN`, a broken axis or a zero-division error.
- Check the **Project Progress Gauge** and the **Estimated vs Spent** charts specifically, as they divide.

---

### TC-DSH-021: Extremely wide date range

**User Role:** Member
**Steps:**
1. Set a ten-year custom range on a trend chart.

**Expected Result:**
- Renders in reasonable time with legible axis labels — not thousands of overlapping tick labels.
- Record the render time.

---

### TC-DSH-022: Invalid colour values

**User Role:** Member
**Steps:**
1. Enter an invalid colour string for the accent, background or a series colour.

**Expected Result:**
- Rejected or coerced to a documented fallback. The chart must not render invisible or break the card's CSS.

---

### TC-DSH-023: Filter values the user cannot see

**User Role:** Member with restricted visibility
**Steps:**
1. Open the Data Filters section and enumerate the available values for Assignee, User and Version.

**Expected Result:**
- Only values the user is entitled to see are listed.
- A filter list is an easy, overlooked enumeration path — for example disclosing the full user list of the
  instance, or version names from projects the user cannot access.

---

### TC-DSH-024: Filter referencing a deleted value

**User Role:** Admin + Member
**Steps:**
1. Filter a chart on a specific version; delete that version; reload the dashboard and reopen the chart settings.

**Expected Result:**
- The chart renders and the settings panel opens, dropping or noting the missing value. Not a 500 and not a widget
  that can no longer be configured or deleted.

---

### TC-DSH-025: Settings changes without permission

**User Role:** Member with view-only project access
**Steps:**
1. Confirm whether the chart settings control is offered.
2. Send a chart-settings update request **directly**.

**Expected Result:**
- Consistent with the permission model, enforced at the endpoint.
- If dashboards are shared per project, a view-only user reconfiguring another team's charts through the endpoint
  would be a real defect.

---

### TC-DSH-026: Settings scope — per user or per project

**User Role:** Two members
**Steps:**
1. A changes one chart's colours, filters and custom date range. B opens the same project dashboard.

**Expected Result:**
- Record precisely whether B sees A's changes. The KB says dashboard settings are managed "per project and per
  user", which is ambiguous about which settings fall into which bucket.
- Whichever it is must be consistent and discoverable. A shared dashboard silently reconfigured by any member,
  with no indication of who changed it, is a usability finding worth filing.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
