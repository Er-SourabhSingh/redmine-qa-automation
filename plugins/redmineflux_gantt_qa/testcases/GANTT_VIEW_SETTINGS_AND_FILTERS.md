# Test Cases — Redmineflux Gantt Chart — View Settings, Filters, Zoom, Markers & Columns

> Source: vendor KB — "How to Search and Filter the Chart", "How to Use Date Range Controls",
> "How to Use Zoom and Display Modes", "How to Configure Display Fields and Bar Colors",
> "How to Configure Milestone Markers", "How to Configure Custom Field Columns", FAQ Q7, Q9, Q11, Q12.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Gantt Chart Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_gantt_qa

## Navigation methodology

Project → **Flux Gantt** → the settings panel via the **gear icon (⚙)** on the right of the toolbar.
Opening the settings panel requires Redmine's core **Manage versions** permission — grant it before running this
suite, or every case here will fail for the wrong reason.

---

## Functional Cases — Search and filtering

---

### TC-GNT-501: Search filters visible rows

**User Role:** Member
**Steps:**
1. Enter a keyword matching some issue subjects in the search field.

**Expected Result:**
- Matching rows remain visible; non-matching ones are hidden.
- Clearing the search restores all rows, as the KB describes.

---

### TC-GNT-502: Search with no matches shows an empty state

**User Role:** Member
**Steps:**
1. Search for a string that matches nothing.

**Expected Result:**
- A clean empty search state — not a blank chart with no explanation and not an error.

---

### TC-GNT-503: Type filter narrows rows

**User Role:** Member
**Steps:**
1. Apply the type filter and confirm which row kinds remain.

**Expected Result:**
- Only the selected types are shown, and the hierarchy stays coherent — a subtask shown without any parent context
  is a usability problem worth recording.

---

### TC-GNT-504: Date range controls focus the timeline

**User Role:** Member
**Steps:**
1. Set Date From and Date To to a one-month window and apply.

**Expected Result:**
- The timeline redraws to that window.
- Issues whose dates fall outside it behave consistently with the KB's troubleshooting note that date filters can
  hide releases and issues — the behaviour must be discoverable, not a mystery disappearance.

---

### TC-GNT-505: Clearing filters restores everything

**User Role:** Member
**Steps:**
1. Apply a search, a type filter and a date range together, then clear all three.

**Expected Result:**
- The full chart returns. No filter remains silently applied — a stuck filter is exactly what the KB's
  troubleshooting steps exist to unstick, and it should not be possible to reach that state by normal use.

---

## Functional Cases — Zoom and display modes

---

### TC-GNT-506: All four zoom levels render

**User Role:** Member
**Steps:**
1. Switch between **Hours**, **Day**, **Week** and **Month**.

**Expected Result:**
- The timeline redraws at each scale with correctly labelled headers and correctly positioned bars.
- Column headers must remain legible and must not overlap each other at any zoom level or viewport width — header
  overlap on this chart is a known class of defect and must be checked at each of the four levels.

---

### TC-GNT-507: Bar positions stay accurate across zoom levels

**User Role:** Member
**Steps:**
1. Note an issue's dates, then read its bar edges at each zoom level.

**Expected Result:**
- The same dates are represented at every scale. A bar that appears to shift by a day when zooming is a rendering
  defect.

---

### TC-GNT-508: Work Days vs Full Week

**User Role:** Member
**Steps:**
1. Switch between **Work Days** and **Full Week**.

**Expected Result:**
- Work Days omits or de-emphasises weekends; Full Week shows them as regular days, per the KB.
- Bar durations remain consistent with the underlying dates in both modes — a task must not appear to change
  length just because weekends were hidden, unless that is the documented intent. Record which.

---

## Functional Cases — Display fields and colours

---

### TC-GNT-509: Toggle each display field

**User Role:** Member with Manage versions
**Steps:**
1. In the settings panel, toggle **Show Assignee**, **Show Progress %**, **Show Estimated Hours**, **Show Task ID**
   independently.

**Expected Result:**
- Each adds or removes its column in the left panel with correct values.
- With several enabled at once, the headers must not overlap or clip each other. Enabling all four simultaneously
  is the specific combination most likely to break the header row, so test it as its own step.

---

### TC-GNT-510: Bar colour customisation

**User Role:** Member
**Steps:**
1. Set distinct colours for release bars, issue bars and subtask bars.

**Expected Result:**
- Each bar type takes its configured colour and the three remain distinguishable.
- Progress fill and baseline overlay bars remain visible against the chosen colours.

---

### TC-GNT-511: Per-issue colour overrides the type colour

**User Role:** Member
**Preconditions:** The issue colour field is available on this instance.
**Steps:**
1. Set a colour on one issue and compare it with its siblings.

**Expected Result:**
- The per-issue colour wins for that bar only, per the KB.

---

### TC-GNT-512: Settings are stored per user

**User Role:** Two members
**Steps:**
1. User A enables Show Assignee and sets a custom bar colour, then reloads.
2. User B opens the same chart.

**Expected Result:**
- A's settings are restored for A and B is unaffected — the KB states settings are stored per user (FAQ Q7).
- A user preference that leaks across accounts is a defect.

---

## Functional Cases — Milestone markers

---

### TC-GNT-513: Enable a milestone marker from a project Date custom field

**User Role:** Member with Manage versions
**Preconditions:** At least one **project-level** custom field of type **Date**, with a value set.
**Steps:**
1. Settings panel → **Milestone Markers** → enable **Show Milestone Markers**.
2. Tick the date field's checkbox, enter a label and choose a colour.

**Expected Result:**
- A labelled vertical line appears at that field's date in the chosen colour.

---

### TC-GNT-514: Marker follows the field value automatically

**User Role:** Member
**Steps:**
1. Change the project custom field's date value.
2. Reopen the chart.

**Expected Result:**
- The marker appears at the new date with no change to the Gantt configuration — the KB's central claim for this
  feature (FAQ Q11).

---

### TC-GNT-515: A field with no value produces no marker and no error

**User Role:** Member
**Steps:**
1. Enable a marker for a date custom field that has no value set.

**Expected Result:**
- No marker and no error, exactly as the KB states. Not a marker at epoch or at today's date.

---

### TC-GNT-516: Master toggle hides all markers

**User Role:** Member
**Steps:**
1. With several markers enabled, turn off **Show Milestone Markers**.

**Expected Result:**
- All markers disappear together; individual checkboxes retain their state for when it is re-enabled.

---

### TC-GNT-517: Only project-level Date custom fields are offered

**User Role:** Member
**Preconditions:** The instance also has issue-level date fields and project fields of other types.
**Steps:**
1. Inspect the list of fields offered in the Milestone Markers section.

**Expected Result:**
- Only **project** custom fields of type **Date** are listed, per the KB. An issue-level date field or a
  project text field appearing here is a defect.

---

### TC-GNT-518: Marker outside the visible date range

**User Role:** Member
**Steps:**
1. Set a date range that excludes the marker's date.

**Expected Result:**
- The marker is simply not visible, with no error — the KB names this as a troubleshooting cause, so the behaviour
  is expected and must be benign.

---

## Functional Cases — Custom field columns

---

### TC-GNT-519: Add custom field columns

**User Role:** Member with Manage versions
**Steps:**
1. Settings panel → **Custom Field Columns** → tick several fields.

**Expected Result:**
- Each appears as a column in the left panel beside Assignee and Progress %.
- A task with no value shows an **empty cell**, not a placeholder or an error, per the KB.

---

### TC-GNT-520: All documented field types are supported

**User Role:** Member
**Preconditions:** Custom fields of selection-list, text, date, yes/no, user and version types exist.
**Steps:**
1. Enable one column of each type and compare each value with the issue page.

**Expected Result:**
- All six types render their values correctly. The KB names these six explicitly, so any type rendering blank or
  raw is a defect against a stated capability — record it per type.

---

### TC-GNT-521: Values update when changed elsewhere in Redmine

**User Role:** Member
**Steps:**
1. Change a custom field value on the issue page, then reopen the chart.

**Expected Result:**
- The column shows the new value with no further configuration, per the KB.

---

### TC-GNT-522: Column selection is retained for the next visit

**User Role:** Member
**Steps:**
1. Enable two custom field columns, leave the chart, return.

**Expected Result:**
- The same columns are still enabled, and only for this user.

---

### TC-GNT-523: Only permitted and applicable fields are listed

**User Role:** Member with limited custom-field visibility
**Steps:**
1. Compare the offered field list against the fields this role may see and that apply to the project's trackers.

**Expected Result:**
- Fields the user cannot see are **not** listed, and neither are fields not applicable to this project.
- A field name leaking into this list is a minor information disclosure; a field whose **values** are shown despite
  the user lacking visibility is a High-severity leak. Check the values, not just the names.

---

### TC-GNT-524: Panel divider widens a clipped column

**User Role:** Member
**Steps:**
1. Enable enough columns to clip the left panel, then drag the divider between the table and the timeline.

**Expected Result:**
- The panel widens and the columns become fully readable — the KB's documented remedy.
- If the divider is not draggable, the KB's own troubleshooting advice is unusable and that is a defect.

---

## Negative Cases

---

### TC-GNT-525: Settings panel without Manage versions

**User Role:** Member with View Flux Gantt but **not** Manage versions
**Steps:**
1. Confirm the gear icon is absent or the panel will not open.
2. Send a settings-update request directly.

**Expected Result:**
- Refused at both. The KB states the settings panel requires core Manage versions, so this is a documented boundary
  and the endpoint must enforce it.

---

### TC-GNT-526: Invalid date range

**User Role:** Member
**Steps:**
1. Set Date From later than Date To and apply.

**Expected Result:**
- Rejected with a clear message, or normalised. Not an empty chart with no explanation.

---

### TC-GNT-527: Extreme date range

**User Role:** Member
**Steps:**
1. Set a ten-year range at **Hours** zoom.

**Expected Result:**
- The chart either refuses the combination with an explanation or renders without hanging the browser.
- Record the render time — hours-zoom across years is the worst-case combination for this widget.

---

### TC-GNT-528: Marker label with script content

**User Role:** Member
**Steps:**
1. Enter a script tag as a milestone marker label.

**Expected Result:**
- Rendered as literal text on the timeline. **No script executes** — a Critical security defect if it does.

---

### TC-GNT-529: Custom field deleted while used as a column

**User Role:** Admin + Member
**Steps:**
1. Enable a custom field column, then delete that custom field in Administration, then reopen the chart.

**Expected Result:**
- The column is dropped silently or with a clear note. Not a 500 and not a permanently broken saved setting that
  prevents the chart from loading.

---

### TC-GNT-530: Settings persistence survives a session change

**User Role:** Member
**Steps:**
1. Configure settings, log out, log back in, reopen the chart.

**Expected Result:**
- Settings are restored — they are stored per user, not per browser session. If they reset on logout they are
  really browser-local, which contradicts the KB and is worth recording.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
