# Test Cases — Redmineflux Analytics Dashboard — Per-Chart Settings, Filters & Date Ranges

> Source: vendor KB — "How to Change the Chart Legend Position", "How to Show or Hide Data Labels",
> "How to Change the Chart Color", "How to Apply Data Filters to a Chart",
> "How to Set a Custom Date Range for a Single Chart", FAQ Q2, Q3, Q8.
> **Status: authored 2026-09-15. Not yet executed.**

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

### TC-DSH-301: Legend position

**User Role:** Member
**Steps:**
1. Settings → General → **Legend Position** → set Top, then Bottom, then Left, then Right, saving each time.

**Expected Result:**
- The chart updates immediately for each of the four documented positions.
- The legend does not overlap the plot area or get clipped at any position, including on a small widget.

---

### TC-DSH-302: Show and hide data labels

**User Role:** Member
**Steps:**
1. Settings → General → **Show Data Labels** → Show, save; then Hide, save.

**Expected Result:**
- Values appear on the chart when shown and disappear when hidden.
- When shown, the labels display the same numbers the tooltip and the underlying query give — a label that rounds
  differently from the data it labels is a correctness defect, not a cosmetic one.

---

### TC-DSH-303: Settings persist across reload

**User Role:** Member
**Steps:**
1. Change legend position, data labels and colours; reload the page.

**Expected Result:**
- All settings are restored exactly.

---

## Functional Cases — Appearance

---

### TC-DSH-304: Top accent colour

**User Role:** Member
**Steps:**
1. Settings → Appearance → set the **Top Accent Color**; save.

**Expected Result:**
- The card header border takes the chosen colour, per the KB.

---

### TC-DSH-305: Prebuilt colour palettes

**User Role:** Member
**Steps:**
1. Apply each available prebuilt palette to a multi-series chart.

**Expected Result:**
- Series colours change consistently and remain **mutually distinguishable** — a palette in which two adjacent
  series render near-identically defeats the chart's purpose and is worth recording.

---

### TC-DSH-306: Individual custom series colours

**User Role:** Member
**Steps:**
1. Set custom colours for individual series; save.

**Expected Result:**
- Each series takes its assigned colour, overriding the palette.

---

### TC-DSH-307: Card background and border colour

**User Role:** Member
**Steps:**
1. Set the card background and border colours; save.

**Expected Result:**
- Applied to the card.
- Text, axis labels and data labels stay **legible** against the chosen background. A configuration that renders
  the chart unreadable without warning is a usability defect, and it is easy to reach here.

---

### TC-DSH-308: Appearance settings are per chart

**User Role:** Member
**Steps:**
1. Style one chart distinctively and confirm the others are unaffected.

**Expected Result:**
- Styling is scoped to the individual widget, as the KB describes ("individually or globally").

---

## Functional Cases — Per-chart data filters

---

### TC-DSH-309: Apply each available data filter

**User Role:** Member
**Steps:**
1. Settings → **Data Filters** → for each filter the chart type offers — Issue Status, Tracker, Priority,
   Assignee, Version, Activity, Role, User — move values from available to selected and save.

**Expected Result:**
- The chart redraws using only the selected values.
- **Cross-check each filtered chart against the equivalent Redmine query.** A filter that redraws the chart but
  does not actually constrain the data is the defect this case exists to catch, and it looks correct at a glance.

---

### TC-DSH-310: Available filters depend on the chart type

**User Role:** Member
**Steps:**
1. Compare the filter options offered on an issue chart with those on a time-tracking chart.

**Expected Result:**
- Filters are appropriate to the chart type — Activity and Role on time charts, Tracker and Priority on issue
  charts, per FAQ Q8.
- A filter offered on a chart type it cannot apply to, which then silently does nothing, is a defect.

---

### TC-DSH-311: Multiple filters combine

**User Role:** Member
**Steps:**
1. Apply a tracker filter and an assignee filter to one chart.

**Expected Result:**
- The result is the intersection — a subset of each applied alone. Verify against an equivalent issue-list query.

---

### TC-DSH-312: Clearing a filter restores the full data

**User Role:** Member
**Steps:**
1. Move all values back to the available list and save.

**Expected Result:**
- The chart returns to unfiltered data for the active date range. No filter remains silently applied.

---

### TC-DSH-313: Per-chart filters are independent

**User Role:** Member
**Steps:**
1. Apply different filters to two charts of the same type.

**Expected Result:**
- Each reflects only its own filters. Filter state must not bleed between widgets.

---

## Functional Cases — Per-chart date range

---

### TC-DSH-314: Set a custom date range on one chart

**User Role:** Member
**Steps:**
1. Settings → General → set **Custom Start Date** and **Custom End Date**; save.

**Expected Result:**
- That chart shows data for its own range.
- Its data matches an equivalent Redmine query constrained to the same dates.

---

### TC-DSH-315: A per-chart range overrides the global range

**User Role:** Member
**Steps:**
1. With one chart on a custom range, change the **global** date range and Apply Filters.

**Expected Result:**
- Charts without an override update to the new global range.
- The overridden chart **does not change** — the KB's central claim for this feature (FAQ Q3).

---

### TC-DSH-316: Clearing the custom range restores global behaviour

**User Role:** Member
**Steps:**
1. Clear both custom date fields and save; then change the global range.

**Expected Result:**
- The chart follows the global range again, exactly as the KB describes.

---

### TC-DSH-317: Per-chart range survives a copy

**User Role:** Member
**Steps:**
1. Copy a chart that has a custom date range.

**Expected Result:**
- The copy carries the same custom range and can then be changed independently (paired with TC-DSH-210).

---

## Negative Cases

---

### TC-DSH-318: End date before start date

**User Role:** Member
**Steps:**
1. Set a custom end date earlier than the start date and save.

**Expected Result:**
- Rejected with a clear message, or normalised. Not an empty chart with no explanation — an empty chart is
  indistinguishable from "no data", which hides the mistake.

---

### TC-DSH-319: Only one of the two custom dates set

**User Role:** Member
**Steps:**
1. Set a custom start date but leave the end date blank, and save; then the reverse.

**Expected Result:**
- Behaviour is explicit and documented — open-ended in the missing direction, or rejected as incomplete.
- A half-set range that silently reverts to the global range without saying so is misleading, because the settings
  panel then disagrees with what the chart is showing.

---

### TC-DSH-320: Date range with no data

**User Role:** Member
**Steps:**
1. Set a custom range far in the past or future where no issues or time entries exist.

**Expected Result:**
- A clean empty state, not `NaN`, a broken axis or a zero-division error.
- Check the **Project Progress Gauge** and the **Estimated vs Spent** charts specifically, as they divide.

---

### TC-DSH-321: Extremely wide date range

**User Role:** Member
**Steps:**
1. Set a ten-year custom range on a trend chart.

**Expected Result:**
- Renders in reasonable time with legible axis labels — not thousands of overlapping tick labels.
- Record the render time.

---

### TC-DSH-322: Invalid colour values

**User Role:** Member
**Steps:**
1. Enter an invalid colour string for the accent, background or a series colour.

**Expected Result:**
- Rejected or coerced to a documented fallback. The chart must not render invisible or break the card's CSS.

---

### TC-DSH-323: Filter values the user cannot see

**User Role:** Member with restricted visibility
**Steps:**
1. Open the Data Filters section and enumerate the available values for Assignee, User and Version.

**Expected Result:**
- Only values the user is entitled to see are listed.
- A filter list is an easy, overlooked enumeration path — for example disclosing the full user list of the
  instance, or version names from projects the user cannot access.

---

### TC-DSH-324: Filter referencing a deleted value

**User Role:** Admin + Member
**Steps:**
1. Filter a chart on a specific version; delete that version; reload the dashboard and reopen the chart settings.

**Expected Result:**
- The chart renders and the settings panel opens, dropping or noting the missing value. Not a 500 and not a widget
  that can no longer be configured or deleted.

---

### TC-DSH-325: Settings changes without permission

**User Role:** Member with view-only project access
**Steps:**
1. Confirm whether the chart settings control is offered.
2. Send a chart-settings update request **directly**.

**Expected Result:**
- Consistent with the permission model, enforced at the endpoint.
- If dashboards are shared per project, a view-only user reconfiguring another team's charts through the endpoint
  would be a real defect.

---

### TC-DSH-326: Settings scope — per user or per project

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
