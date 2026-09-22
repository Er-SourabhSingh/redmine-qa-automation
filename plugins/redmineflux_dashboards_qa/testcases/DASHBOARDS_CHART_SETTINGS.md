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
