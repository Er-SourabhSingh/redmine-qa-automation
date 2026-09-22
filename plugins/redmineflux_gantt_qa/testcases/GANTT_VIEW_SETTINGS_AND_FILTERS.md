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

### TC-GNT-161: Search filters visible rows

**User Role:** Member
**Steps:**
1. Enter a keyword matching some issue subjects in the search field.

**Expected Result:**
- Matching rows remain visible; non-matching ones are hidden.
- Clearing the search restores all rows, as the KB describes.

---

### TC-GNT-162: Search with no matches shows an empty state

**User Role:** Member
**Steps:**
1. Search for a string that matches nothing.

**Expected Result:**
- A clean empty search state — not a blank chart with no explanation and not an error.

---

### TC-GNT-163: Type filter narrows rows

**User Role:** Member
**Steps:**
1. Apply the type filter and confirm which row kinds remain.

**Expected Result:**
- Only the selected types are shown, and the hierarchy stays coherent — a subtask shown without any parent context
  is a usability problem worth recording.

---

### TC-GNT-164: Date range controls focus the timeline

**User Role:** Member
**Steps:**
1. Set Date From and Date To to a one-month window and apply.

**Expected Result:**
- The timeline redraws to that window.
- Issues whose dates fall outside it behave consistently with the KB's troubleshooting note that date filters can
  hide releases and issues — the behaviour must be discoverable, not a mystery disappearance.

---

### TC-GNT-165: Clearing filters restores everything

**User Role:** Member
**Steps:**
1. Apply a search, a type filter and a date range together, then clear all three.

**Expected Result:**
- The full chart returns. No filter remains silently applied — a stuck filter is exactly what the KB's
  troubleshooting steps exist to unstick, and it should not be possible to reach that state by normal use.

---

## Functional Cases — Zoom and display modes

---

### TC-GNT-166: All four zoom levels render

**User Role:** Member
**Steps:**
1. Switch between **Hours**, **Day**, **Week** and **Month**.

**Expected Result:**
- The timeline redraws at each scale with correctly labelled headers and correctly positioned bars.
- Column headers must remain legible and must not overlap each other at any zoom level or viewport width — header
  overlap on this chart is a known class of defect and must be checked at each of the four levels.

---

### TC-GNT-167: Bar positions stay accurate across zoom levels

**User Role:** Member
**Steps:**
1. Note an issue's dates, then read its bar edges at each zoom level.

**Expected Result:**
- The same dates are represented at every scale. A bar that appears to shift by a day when zooming is a rendering
  defect.

---

### TC-GNT-168: Work Days vs Full Week

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

### TC-GNT-169: Toggle each display field

**User Role:** Member with Manage versions
**Steps:**
1. In the settings panel, toggle **Show Assignee**, **Show Progress %**, **Show Estimated Hours**, **Show Task ID**
   independently.

**Expected Result:**
- Each adds or removes its column in the left panel with correct values.
- With several enabled at once, the headers must not overlap or clip each other. Enabling all four simultaneously
  is the specific combination most likely to break the header row, so test it as its own step.

---

### TC-GNT-170: Bar colour customisation

**User Role:** Member
**Steps:**
1. Set distinct colours for release bars, issue bars and subtask bars.

**Expected Result:**
- Each bar type takes its configured colour and the three remain distinguishable.
- Progress fill and baseline overlay bars remain visible against the chosen colours.

---

### TC-GNT-171: Per-issue colour overrides the type colour

**User Role:** Member
**Preconditions:** The issue colour field is available on this instance.
**Steps:**
1. Set a colour on one issue and compare it with its siblings.

**Expected Result:**
- The per-issue colour wins for that bar only, per the KB.

---

### TC-GNT-172: Settings are stored per user

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

### TC-GNT-173: Enable a milestone marker from a project Date custom field

**User Role:** Member with Manage versions
**Preconditions:** At least one **project-level** custom field of type **Date**, with a value set.
**Steps:**
1. Settings panel → **Milestone Markers** → enable **Show Milestone Markers**.
2. Tick the date field's checkbox, enter a label and choose a colour.

**Expected Result:**
- A labelled vertical line appears at that field's date in the chosen colour.

---

### TC-GNT-174: Marker follows the field value automatically

**User Role:** Member
**Steps:**
1. Change the project custom field's date value.
2. Reopen the chart.

**Expected Result:**
- The marker appears at the new date with no change to the Gantt configuration — the KB's central claim for this
  feature (FAQ Q11).

---

### TC-GNT-175: A field with no value produces no marker and no error

**User Role:** Member
**Steps:**
1. Enable a marker for a date custom field that has no value set.

**Expected Result:**
- No marker and no error, exactly as the KB states. Not a marker at epoch or at today's date.

---

### TC-GNT-176: Master toggle hides all markers

**User Role:** Member
**Steps:**
1. With several markers enabled, turn off **Show Milestone Markers**.

**Expected Result:**
- All markers disappear together; individual checkboxes retain their state for when it is re-enabled.

---

### TC-GNT-177: Only project-level Date custom fields are offered

**User Role:** Member
**Preconditions:** The instance also has issue-level date fields and project fields of other types.
**Steps:**
1. Inspect the list of fields offered in the Milestone Markers section.

**Expected Result:**
- Only **project** custom fields of type **Date** are listed, per the KB. An issue-level date field or a
  project text field appearing here is a defect.

---

### TC-GNT-178: Marker outside the visible date range

**User Role:** Member
**Steps:**
1. Set a date range that excludes the marker's date.

**Expected Result:**
- The marker is simply not visible, with no error — the KB names this as a troubleshooting cause, so the behaviour
  is expected and must be benign.

---

## Functional Cases — Custom field columns

---

### TC-GNT-179: Add custom field columns

**User Role:** Member with Manage versions
**Steps:**
1. Settings panel → **Custom Field Columns** → tick several fields.

**Expected Result:**
- Each appears as a column in the left panel beside Assignee and Progress %.
- A task with no value shows an **empty cell**, not a placeholder or an error, per the KB.

---

### TC-GNT-180: All documented field types are supported

**User Role:** Member
**Preconditions:** Custom fields of selection-list, text, date, yes/no, user and version types exist.
**Steps:**
1. Enable one column of each type and compare each value with the issue page.

**Expected Result:**
- All six types render their values correctly. The KB names these six explicitly, so any type rendering blank or
  raw is a defect against a stated capability — record it per type.

---

### TC-GNT-181: Values update when changed elsewhere in Redmine

**User Role:** Member
**Steps:**
1. Change a custom field value on the issue page, then reopen the chart.

**Expected Result:**
- The column shows the new value with no further configuration, per the KB.

---

### TC-GNT-182: Column selection is retained for the next visit

**User Role:** Member
**Steps:**
1. Enable two custom field columns, leave the chart, return.

**Expected Result:**
- The same columns are still enabled, and only for this user.

---

### TC-GNT-183: Only permitted and applicable fields are listed

**User Role:** Member with limited custom-field visibility
**Steps:**
1. Compare the offered field list against the fields this role may see and that apply to the project's trackers.

**Expected Result:**
- Fields the user cannot see are **not** listed, and neither are fields not applicable to this project.
- A field name leaking into this list is a minor information disclosure; a field whose **values** are shown despite
  the user lacking visibility is a High-severity leak. Check the values, not just the names.

---

### TC-GNT-184: Panel divider widens a clipped column

**User Role:** Member
**Steps:**
1. Enable enough columns to clip the left panel, then drag the divider between the table and the timeline.

**Expected Result:**
- The panel widens and the columns become fully readable — the KB's documented remedy.
- If the divider is not draggable, the KB's own troubleshooting advice is unusable and that is a defect.

---

## Negative Cases

---

### TC-GNT-185: Settings panel without Manage versions

**User Role:** Member with View Flux Gantt but **not** Manage versions
**Steps:**
1. Confirm the gear icon is absent or the panel will not open.
2. Send a settings-update request directly.

**Expected Result:**
- Refused at both. The KB states the settings panel requires core Manage versions, so this is a documented boundary
  and the endpoint must enforce it.

---

### TC-GNT-186: Invalid date range

**User Role:** Member
**Steps:**
1. Set Date From later than Date To and apply.

**Expected Result:**
- Rejected with a clear message, or normalised. Not an empty chart with no explanation.

---

### TC-GNT-187: Extreme date range

**User Role:** Member
**Steps:**
1. Set a ten-year range at **Hours** zoom.

**Expected Result:**
- The chart either refuses the combination with an explanation or renders without hanging the browser.
- Record the render time — hours-zoom across years is the worst-case combination for this widget.

---

### TC-GNT-188: Marker label with script content

**User Role:** Member
**Steps:**
1. Enter a script tag as a milestone marker label.

**Expected Result:**
- Rendered as literal text on the timeline. **No script executes** — a Critical security defect if it does.

---

### TC-GNT-189: Custom field deleted while used as a column

**User Role:** Admin + Member
**Steps:**
1. Enable a custom field column, then delete that custom field in Administration, then reopen the chart.

**Expected Result:**
- The column is dropped silently or with a clear note. Not a 500 and not a permanently broken saved setting that
  prevents the chart from loading.

---

### TC-GNT-190: Settings persistence survives a session change

**User Role:** Member
**Steps:**
1. Configure settings, log out, log back in, reopen the chart.

**Expected Result:**
- Settings are restored — they are stored per user, not per browser session. If they reset on logout they are
  really browser-local, which contradicts the KB and is worth recording.

---

## Functional Cases — Year time scale (new, issue #120913)

> Addendum 2026-09-22: TC-GNT-191 through TC-GNT-212 were added for the new-functionality batch shipped on top of
> the existing plugin per production issue #120913 (ztflux, client JUWI GmbH, tracker Feature, status "In QA").
> These are the only source for the new scope — REQUIREMENTS.md/USER_GUIDE.md do not yet document it.
> **Status: authored 2026-09-22. Not yet executed.**

---

### TC-GNT-191: Year zoom level is available alongside Hours/Day/Week/Month

**User Role:** Member
**Steps:**
1. Open the project's Flux Gantt view.
2. Open the zoom/display-mode control used for TC-GNT-166 and select **Year**.

**Expected Result:**
- **Year** appears as a fifth zoom option alongside the existing **Hours**, **Day**, **Week** and **Month** (issue #120913 item 1).
- Selecting it redraws the timeline at year scale without error.

---

### TC-GNT-192: Year scale ruler shows years on the upper row and quarters on the lower row

**User Role:** Member
**Steps:**
1. With **Year** zoom selected, inspect the two header rows of the timeline ruler.

**Expected Result:**
- The upper header row shows year labels (e.g. "2026").
- The lower header row shows quarter labels (e.g. "Q1", "Q2", "Q3", "Q4") for each year, per issue #120913 item 1's stated ruler structure.

---

### TC-GNT-193: Year scale in Work Days mode excludes weekends and keeps the ruler correct

**User Role:** Member
**Steps:**
1. With **Year** zoom selected, switch display mode to **Work Days** (same control exercised by TC-GNT-168).
2. Inspect the ruler and bar rendering.

**Expected Result:**
- Year scale renders correctly in **Work Days** mode — the ruler's year/quarter labels remain accurate and weekends
  are omitted/de-emphasised the same way they are at other zoom levels (issue #120913 item 1: "Must work in both
  Work Days and Full Week display modes").
- No broken or misaligned ruler cells caused by combining Year scale with Work Days mode.
- This is explicit scenario 2 from issue #120913.

---

### TC-GNT-194: Year scale in Full Week mode

**User Role:** Member
**Steps:**
1. With **Year** zoom selected, switch display mode to **Full Week**.
2. Inspect the ruler and bar rendering.

**Expected Result:**
- Year scale renders correctly with **Full Week** mode — all days shown as regular days, ruler unaffected, per
  issue #120913 item 1.

---

### TC-GNT-195: Year/quarter labels stay visible when the selected date range covers only part of a year

**User Role:** Member
**Steps:**
1. With **Year** zoom selected, set the date range (Date From/Date To) to a window covering only part of one year
   (e.g. April–September of the current year).
2. Inspect the ruler's year and quarter labels.

**Expected Result:**
- The year and quarter labels for the partial year remain visible on screen — they must not disappear off-screen,
  per issue #120913 item 1's explicit requirement ("label must not disappear off-screen").
- This is explicit scenario 1 from issue #120913.

---

## Functional Cases — Row sorting (new, issue #120913)

---

### TC-GNT-196: Sort selector offers all seven documented fields, each ascending/descending

**User Role:** Member with Manage versions
**Steps:**
1. Open the settings panel (gear icon).
2. Locate the new sort selector.
3. Open its list of options.

**Expected Result:**
- The selector offers **Subject, Start date, Due date, Priority, Assignee, Status, Ticket number**, each available
  ascending and descending, plus **Default (hierarchy)**, per issue #120913 item 2.

---

### TC-GNT-197: Default sort value is "Default (hierarchy)" with no behavior change on upgrade

**User Role:** Member
**Preconditions:** A project that has never had its sort field changed (i.e. simulating pre-upgrade state).
**Steps:**
1. Open the Gantt view without changing the sort selector.

**Expected Result:**
- The sort selector shows **Default (hierarchy)** and the row order is identical to the plugin's pre-#120913
  ordering — no behavior change unless a user explicitly changes it, per issue #120913 item 2 ("Default value
  remains 'Default (hierarchy)' — no behavior change on upgrade unless changed").

---

### TC-GNT-198: Sort by Subject, ascending and descending

**User Role:** Member
**Steps:**
1. Select **Subject — Ascending** in the sort selector.
2. Note the row order, then select **Subject — Descending**.

**Expected Result:**
- Rows reorder alphabetically by subject in each direction, consistently reversed between the two.

---

### TC-GNT-199: Sort by Due date descending — issues with no due date sort last, not first

**User Role:** Member
**Preconditions:** At least one issue in the project has no due date set; others have due dates.
**Steps:**
1. Select **Due date — Descending** in the sort selector.
2. Locate the issue(s) with no due date in the resulting row order.

**Expected Result:**
- Rows with a due date are ordered from latest to earliest.
- The issue(s) with **no due date** appear **last**, not first — per issue #120913 item 2 ("Rows with no value for
  the sort field sort LAST in both ascending and descending order (e.g., no due date never floats to top on
  descending)").
- This is explicit scenario 3 from issue #120913.

---

### TC-GNT-200: Sub-tasks stay directly beneath their parent regardless of sort field

**User Role:** Member
**Preconditions:** At least one parent issue with two or more sub-tasks, all with differing values for the field
being sorted (e.g. differing priorities).
**Steps:**
1. Select each of the documented sort fields in turn (e.g. Priority — Ascending, Assignee — Descending).
2. After each selection, locate the parent issue's row and its sub-task rows.

**Expected Result:**
- For every sort field tested, the sub-tasks remain directly beneath their own parent issue — sorting is applied
  **within** each hierarchy level and does not flatten the tree, per issue #120913 item 2.
- This is explicit scenario 4 from issue #120913.

---

### TC-GNT-201: Release rows follow the chosen field where applicable, otherwise keep Redmine's own order

**User Role:** Member
**Preconditions:** Two or more release/version rows exist, with differing start dates.
**Steps:**
1. Select **Start date — Ascending**, and observe release row order.
2. Select **Priority — Ascending** (a field that has no meaning for a release).

**Expected Result:**
- With **Start date**, release rows reorder according to their start date.
- With **Priority** (or **Assignee**, meaningless for a release), release rows keep Redmine's own default order
  rather than erroring or moving arbitrarily — per issue #120913 item 2 ("Releases follow the chosen field where
  applicable to a release, otherwise keep Redmine's own order (priority/assignee are meaningless for a release
  row)").

---

### TC-GNT-202: Sort selection is stored per user, applied server-side, and survives reload

**User Role:** Two members (User A, User B)
**Steps:**
1. User A selects **Assignee — Ascending** and reloads the page.
2. User B opens the same project's Gantt view.

**Expected Result:**
- User A's sort selection is restored after reload — it is applied server-side, not merely held in client-side
  state, per issue #120913 item 2.
- User B's own view is unaffected by A's choice (per-user, consistent with issue #120913 item 4).

---

## Functional Cases — "Ticket status" column (new, issue #120913)

---

### TC-GNT-203: "Ticket status" display column toggle, default OFF

**User Role:** Member with Manage versions
**Steps:**
1. Open the settings panel and locate the new **Ticket status** on/off toggle among the display columns (alongside
   Show Assignee, Show Progress %, etc.).
2. Before touching it, confirm its current state on a project that has not had it configured before.
3. Enable it.

**Expected Result:**
- Before being explicitly enabled, the toggle is **OFF** and no status column is shown — no visual change on
  upgrade, per issue #120913 item 3.
- Once enabled, a **Ticket status** column appears in the left panel showing each issue's/sub-task's status value.

---

### TC-GNT-204: Release and project rows render an empty cell for the status column

**User Role:** Member
**Preconditions:** The **Ticket status** column is enabled (TC-GNT-203).
**Steps:**
1. Inspect the status column's cell for a release/version row and for the project's own summary row, if shown.

**Expected Result:**
- Release and project (non-ticket) rows show an **empty cell** for this column — not an error, not
  "undefined"/"null" text, and not a misaligned grid, per issue #120913 item 3.
- This is explicit scenario 15 from issue #120913.

---

## Functional Cases — Per-user view settings (new, issue #120913)

---

### TC-GNT-205: Zoom, display mode, today line, columns, date range and critical-path mode are stored per user

**User Role:** Two members (User A, User B)
**Steps:**
1. User A opens the project's Flux Gantt view and changes: zoom level (e.g. to Week), display mode (Work Days),
   toggles the today-line marker off, enables an additional display column, sets a custom date range, and (if
   per-release critical path is enabled, see TC-GNT-217) selects a critical-path scope. Reloads.
2. User B opens the same project's Flux Gantt view, without having changed anything.

**Expected Result:**
- Every one of User A's changes (zoom, display mode, today line, visible columns, date range, critical-path mode)
  is restored for User A after reload.
- User B sees their **own** view (defaulting to the project's prior settings per TC-GNT-206), completely
  unaffected by A's changes — a change by one user must not overwrite another user's view, per issue #120913
  item 4.
- This is explicit scenario 6 from issue #120913 (the "own settings" half; the "shared bar colors" half is
  TC-GNT-208).

---

### TC-GNT-206: Existing project-level settings become each user's starting default post-upgrade

**User Role:** Member
**Preconditions:** A project whose Flux Gantt settings were configured before #120913 shipped (project-level
zoom/columns/date range already set), and a user who has never personally saved a view on it.
**Steps:**
1. Open the project's Flux Gantt view as a user with no personal view saved yet.

**Expected Result:**
- The view opens using the project's pre-existing (pre-migration) settings as this user's starting default —
  nothing is lost or reset to a blank/factory state, per issue #120913 item 4 and the delivery/migration note
  ("Existing project-level settings become each user's starting default — no data loss/backfill needed,
  migration-preserved").
- This is explicit scenario 8 from issue #120913.

---

### TC-GNT-207: Saving a personal view no longer requires "Manage versions" permission

**User Role:** Member with **View Flux Gantt** but explicitly **without** core **Manage versions**
**Steps:**
1. Confirm this role lacks Manage versions (check Roles administration, or attempt an action that requires it —
   e.g. TC-GNT-185's settings-panel-access check for the plugin's pre-#120913 behavior).
2. As this user, change a personal view setting that issue #120913 item 4 covers — e.g. zoom level or a visible
   column — and reload.

**Expected Result:**
- The change saves successfully and persists across reload, **despite** the user lacking Manage versions — issue
  #120913 item 4 states "Saving a personal view no longer requires the 'Manage versions' permission."
- This is a **permission relaxation** versus the plugin's pre-#120913 behavior (compare TC-GNT-185, which required
  Manage versions to even open the settings panel) — verify explicitly rather than assuming, since a relaxation
  that silently fails to apply is itself a defect.
- This is explicit scenario 7 from issue #120913.

---

### TC-GNT-208: Bar colours and milestone markers remain shared/project-wide, not per-user

**User Role:** Two members (User A, User B), at least one with Manage versions
**Steps:**
1. User A (with sufficient permission) changes a bar colour and/or a milestone marker configuration and reloads.
2. User B opens the same project's Flux Gantt view.

**Expected Result:**
- User B sees the **same** bar colours and milestone marker configuration that User A set — these remain
  project-wide/shared, **not** per-user, per issue #120913 item 4's explicit statement ("Bar colors and milestone
  markers remain project-wide/shared (NOT per-user) — this is deliberate, don't treat as a bug").
- Do not treat a shared bar-colour/marker change as a per-user isolation defect — it is the documented, intended
  behavior.
- This is the "shared" half of explicit scenario 6 from issue #120913.

---

## Functional Cases — Additional date-range presets (new, issue #120913)

---

### TC-GNT-209: New calendar-quarter/year presets are available in the project Gantt's date-range picker

**User Role:** Member
**Steps:**
1. Open the date range picker (Date From/Date To control).
2. Open its list of predefined presets.

**Expected Result:**
- **This Quarter**, **Next Quarter**, **This Year** and **Next Year** appear as new presets alongside the existing
  ones, per issue #120913 item 6.

---

### TC-GNT-210: "This Year" preset with Year scale active shows the full year sensibly

**User Role:** Member
**Steps:**
1. Select **Year** zoom (TC-GNT-191).
2. Select the **This Year** preset from the date-range picker.

**Expected Result:**
- The timeline shows the current year's full range with the Year-scale ruler (years on top, quarters below, per
  TC-GNT-192) rendering legibly across the whole selected span — this combination is what issue #120913 calls out
  as needing to "make full visual sense" together (item 6 note).
- This is explicit scenario 9 from issue #120913.

---

### TC-GNT-211: Quarter-based presets align to actual calendar quarters

**User Role:** Member
**Steps:**
1. Select **This Quarter** and note the resulting Date From/Date To values.
2. Compare them against the actual calendar-quarter boundaries for today's date (e.g. if today is in Q3,
   From = Jul 1, To = Sep 30 of the current year).

**Expected Result:**
- **This Quarter**'s resulting date range matches the real calendar quarter boundaries, not an arbitrary
  "3 months from today" window.

---

## Low-Priority Confirmation — Row-type legend (informational only, issue #120913 item 5)

---

### TC-GNT-212: Row-type legend/hover correctly identifies each marker (confirmation only, no fix expected)

**User Role:** Member
**Priority:** Low
**Steps:**
1. Hover over a green dot next to an issue row, a blue diamond next to a release row, a purple square next to a
   sub-task row, and a blue "P" next to the project row.

**Expected Result:**
- Hovering each marker reveals a tooltip naming its type: green dot = issue, blue diamond = release, purple
  square = sub-task, blue "P" = project — per issue #120913 item 5, which is explicitly informational/no-dev-work.
- This TC is a confirmation-only check — issue #120913 states no development work is expected here; do **not**
  file a bug implying this needs a fix unless the documented mapping itself is contradicted by what's observed.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
