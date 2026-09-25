# Test Cases — Redmineflux Gantt Chart — Releases, Issues & Timeline Structure

> Source: vendor KB — "How to Read the Timeline", "How to Add a Release", "How to Add an Issue",
> "How to Use Issues Without Version", "How to Expand and Collapse Releases", "How Progress Is Calculated",
> FAQ Q6.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Gantt Chart Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_gantt_qa

## Navigation methodology

Project → **Flux Gantt** in the project menu. Do not type the URL. Every created or changed record must be
confirmed against the **core Redmine issue/version page**, not only against the chart's own rendering — a chart
that shows a bar the database does not back is the defect this suite exists to catch.

---

## Functional Cases — Timeline structure

---

### TC-GNT-110: Left panel and timeline render together

**User Role:** Member with View Flux Gantt
**Priority:** High
**Steps:**
1. Open the project Flux Gantt on a project with releases, issues and subtasks.

**Expected Result:**
- A left panel showing project/release/issue/subtask rows and a right-hand date grid with bars.
- Release bars, issue bars, subtask bars, the today line and dependency lines are all distinguishable, as the KB
  describes.

---

### TC-GNT-111: Bar position matches the record's dates

**User Role:** Member
**Priority:** High
**Steps:**
1. Pick three issues with known start and due dates.
2. Compare each bar's left and right edges against the date grid.

**Expected Result:**
- Position and width correspond exactly to start and due dates.
- Cross-check against the issue's own page. A bar drawn a day off is a real defect — off-by-one date rendering is
  common in timeline widgets and is invisible unless deliberately checked.

---

### TC-GNT-112: Progress fill reflects the done ratio

**User Role:** Member
**Priority:** High
**Steps:**
1. Set an issue's % done to 50 and view its bar.

**Expected Result:**
- The bar fill is half, matching the issue's done ratio, as the KB's "How Progress Is Calculated" states.

---

### TC-GNT-113: Parent progress and dates derive from subtasks

**User Role:** Member
**Priority:** High
**Steps:**
1. On a parent with two subtasks, set the subtasks' dates and progress.
2. View the parent row.

**Expected Result:**
- The parent's bar spans its children's range and its progress is derived from them, per the KB.
- Fields that are derived are shown as read-only rather than editable-but-ignored.

---

### TC-GNT-114: Today line is positioned correctly

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Locate the today line at each zoom level.

**Expected Result:**
- It sits on the current date in the instance's timezone, at every zoom level.

---

## Functional Cases — Releases

---

### TC-GNT-115: Add a release

**User Role:** Member with Manage versions
**Priority:** High
**Steps:**
1. Click **Add Release**.
2. Enter a name, a description, a start date and a due date. Save.

**Expected Result:**
- The release appears as a timeline row spanning those dates.
- It also exists as a normal Redmine version under Project → Settings → Versions — confirm there, not just on the
  chart.

---

### TC-GNT-116: Release name cannot be blank

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Open Add Release, leave the name blank, save.

**Expected Result:**
- Rejected with a clear validation message. The KB states this as a required behaviour, so a blank-named release
  reaching the timeline is a defect against a documented rule.

---

### TC-GNT-117: Start date must be on or before the due date

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Enter a start date later than the due date and save.

**Expected Result:**
- Rejected with a clear message. The KB states this rule explicitly.

---

### TC-GNT-118: Edit a release

**User Role:** Member with Manage versions
**Priority:** High
**Steps:**
1. Open a release's edit dialog, change its name and dates, save.

**Expected Result:**
- The row and bar update, and the change is reflected on the core version page.

---

### TC-GNT-119: Delete a release

**User Role:** Member with Manage versions
**Priority:** High
**Steps:**
1. Delete a release that has no issues; confirm the dialog.
2. Attempt to delete one that **does** have issues.

**Expected Result:**
- The empty release is removed.
- For the populated one, Redmine's own version-deletion semantics apply and the user is told what will happen to
  the assigned issues. Silent reassignment or silent issue loss is a Critical defect.

---

### TC-GNT-120: Expand and collapse a release

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Expand a release row, then collapse it.

**Expected Result:**
- Issues load on expand (lazily) and hide on collapse.

---

### TC-GNT-121: Expand All and Collapse All

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Use the toolbar's **Expand All**, then **Collapse All**.

**Expected Result:**
- Every release expands and collapses respectively, loading issues as needed.

---

### TC-GNT-122: Expand/collapse state is saved per user and project

**User Role:** Two members
**Priority:** Medium
**Steps:**
1. User A expands releases 1 and 3, then leaves and returns to the chart.
2. User B opens the same project's chart.

**Expected Result:**
- A's state is restored for A. B is unaffected by A's state, as the KB's per-user persistence claim requires.
- State is also per project — A's state in project X does not carry into project Y.

---

## Functional Cases — Issues

---

### TC-GNT-123: Add an issue from the chart

**User Role:** Member with View Flux Gantt
**Priority:** High
**Steps:**
1. Click **Add Issue**.
2. Enter subject, tracker, release/version, parent (optional), start and due dates, estimated hours, assignee.
3. Save.

**Expected Result:**
- The issue appears on the selected release's timeline.
- It exists as a normal Redmine issue with exactly those field values — confirm on the issue page.

---

### TC-GNT-124: Created issue respects tracker required fields

**User Role:** Member
**Priority:** High
**Steps:**
1. Create an issue from the chart on a tracker with required custom fields.

**Expected Result:**
- Required fields are enforced, either by being present in the dialog or by a clear rejection naming them.
- An issue created through this path that bypasses required-field validation is a High-severity defect — it puts
  invalid records into the project that the normal form would have refused.

---

### TC-GNT-125: Subtask hierarchy renders

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Create an issue with a parent, then view both rows.

**Expected Result:**
- The subtask is nested under its parent in the left panel and drawn as a subtask bar.

---

### TC-GNT-126: Issues Without Version panel lists unassigned issues

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Open the **Issues Without Version** panel on a project with some unversioned issues.

**Expected Result:**
- Exactly the issues with no target version are listed. An issue assigned to a version must not appear here.

---

### TC-GNT-127: Assign an issue to a release from the panel

**User Role:** Member
**Priority:** High
**Steps:**
1. Drag an issue from the Issues Without Version panel onto a release.

**Expected Result:**
- The issue's target version is set to that release and it disappears from the panel.
- Confirm the target version on the issue page itself.

---

### TC-GNT-128: Empty state when all issues are versioned

**User Role:** Member
**Priority:** Low
**Steps:**
1. Assign every issue to a release and reopen the panel.

**Expected Result:**
- A clean empty state, as the KB describes — not a spinner and not an error.

---

## Negative Cases

---

### TC-GNT-129: Release with no dates

**User Role:** Member
**Priority:** Low
**Steps:**
1. Create a release leaving the dates blank.

**Expected Result:**
- Either rejected, or created and rendered sensibly (e.g. an undated row) without breaking the grid.
- A release with no dates that draws a bar spanning the entire timeline, or one pinned at epoch, is a defect.

---

### TC-GNT-130: Issue with a due date before its start date

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Create an issue from the chart with due before start.

**Expected Result:**
- Rejected with a clear message, matching the validation applied to releases.

---

### TC-GNT-131: Issue dated outside its release's range

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Add an issue whose dates fall entirely outside the selected release's window.

**Expected Result:**
- Behaviour is explicit — rejected with a boundary message, or accepted and drawn outside the release bar.
- Critically, the issue must **still be counted and listed under that release**. A version whose issues silently
  disappear from the chart because of a date mismatch, while core Redmine still lists them, is a real reporting
  defect.

---

### TC-GNT-132: Very long release or issue name

**User Role:** Member
**Priority:** Low
**Steps:**
1. Create a release and an issue with 500-character names.

**Expected Result:**
- Either rejected with a stated maximum, or rendered with truncation/ellipsis that does not break the left panel
  layout or push the timeline off screen.

---

### TC-GNT-133: HTML and script in a name or description

**User Role:** Member
**Priority:** High
**Steps:**
1. Create a release and an issue whose names and descriptions contain a script tag.

**Expected Result:**
- Escaped and rendered literally in the left panel, in tooltips, and in the inline edit modal.
- **No script executes** in any of those three places — the chart's tooltips are the easiest place to miss this.
  Execution is a Critical security defect.

---

### TC-GNT-134: Deleting an issue that others depend on

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Delete an issue that is the source of a dependency line.

**Expected Result:**
- The dependency line is removed with it. No orphaned line is drawn to a non-existent bar and no console error is
  raised on the next render.

---

### TC-GNT-135: Concurrent structural changes

**User Role:** Two members
**Priority:** Medium
**Steps:**
1. Both have the chart open. A deletes a release; B, without reloading, adds an issue to it.

**Expected Result:**
- B gets a clear failure message and the chart reconciles on reload. No 500 and no issue written against a deleted
  version.

---

### TC-GNT-136: Read-only derived parent

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Attempt to change the dates of a parent whose dates are derived from its subtasks, via the chart.

**Expected Result:**
- Rejected with the read-only-dates message the KB describes, pointing the user at the child tasks.
- The message must be intelligible — the KB treats this as an expected, explainable outcome rather than an error.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
