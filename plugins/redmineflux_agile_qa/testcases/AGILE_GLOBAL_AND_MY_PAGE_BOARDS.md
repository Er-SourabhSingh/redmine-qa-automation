# Test Cases — Redmineflux Agile Board — Global Board & My Page Board

> Source: vendor KB — "How to Use the Global Agile Board", "How to Use the Agile Board on My Page",
> Troubleshooting ("For My Page Agile Board issues"), FAQ Q1, Q9, Q10.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Agile Board
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_agile_qa

## Navigation methodology

Global board: **Agile Board** in the top navigation menu. My Page board: **My Page** → personalisation controls →
add the **Agile Board** block. Reach both by clicking, not by URL — except in the negative cases, where the direct
URL is the point.

---

## Functional Cases — Global Agile Board

---

### TC-AGB-122: Global board opens from the top menu

**User Role:** Member with the required permission
**Steps:**
1. Click **Agile Board** in the top menu.

**Expected Result:**
- A board loads showing issues from all projects the user can see, per FAQ Q1.

---

### TC-AGB-123: Only visible projects' issues appear

**User Role:** Member of projects A and B, not of private project C
**Preconditions:** **Confirm project C is genuinely private** — a newly created Redmine project has "Public"
checked by default; uncheck it explicitly or this case falsely passes.
**Steps:**
1. Enumerate the cards on the global board.

**Expected Result:**
- Issues from A and B only. No subject, ID or project name from C appears in the view or the response body.
- A leak here is a High-severity cross-project data exposure — the global board is the plugin's widest aggregation
  surface.

---

### TC-AGB-124: Project context is shown on cards

**User Role:** Member
**Steps:**
1. Enable the project context on cards, per the KB.

**Expected Result:**
- Each card names its project, so cards from different projects in one column are distinguishable.

---

### TC-AGB-125: Search by subject across projects

**User Role:** Member
**Steps:**
1. Search for a keyword matching issues in two different projects.

**Expected Result:**
- Matches from both appear. Counts reflect the filtered set.

---

### TC-AGB-126: Filter by assigned members

**User Role:** Member
**Steps:**
1. Filter the global board by one assignee.

**Expected Result:**
- Only that user's issues, across all visible projects, remain.

---

### TC-AGB-127: Group by each supported option globally

**User Role:** Member
**Steps:**
1. Apply Group By for Project, Tracker, Priority, Author, Assignee, Category, Target version and Parent task.

**Expected Result:**
- Swimlanes render correctly for each. **Group by Project** is the most useful here and must produce one lane per
  visible project with accurate counts.

---

### TC-AGB-128: Drag between statuses on the global board

**User Role:** Member with edit rights on the issue's project
**Steps:**
1. Drag a card to another status column; reload; confirm on the issue page.

**Expected Result:**
- The status changes, subject to permissions and workflow, exactly as on the project board.

---

### TC-AGB-129: Double-click editing on the global board

**User Role:** Member
**Steps:**
1. Double-click a card, edit subject and description, save.

**Expected Result:**
- The issue is updated and journaled; the card refreshes.

---

## Functional Cases — My Page Agile Board

---

### TC-AGB-130: Add the Agile Board block to My Page

**User Role:** Any logged-in user
**Steps:**
1. Open **My Page** → personalisation controls → add the **Agile Board** block → save the layout.

**Expected Result:**
- The block appears with status columns and issue cards in the standard card layout.

---

### TC-AGB-131: The block shows only the user's assigned issues

**User Role:** Member
**Steps:**
1. Compare the block's cards against the issue list filtered to assignee = me.

**Expected Result:**
- Exactly the issues assigned to this user, in active projects they can access, per the KB.
- An issue assigned to someone else appearing here is a defect; so is a missing assigned issue in an active,
  visible project.

---

### TC-AGB-132: Only active, visible projects are included

**User Role:** Member
**Steps:**
1. Close or archive a project containing one of the user's assigned issues; reload My Page.

**Expected Result:**
- That issue is excluded once the project is no longer active/visible, matching the KB's stated scope.

---

### TC-AGB-133: Drag cards on the My Page board

**User Role:** Member
**Steps:**
1. Drag an assigned card to another status column; reload; confirm on the issue page.

**Expected Result:**
- The status changes, subject to normal permissions and workflow transitions — the KB states this explicitly.

---

### TC-AGB-134: Double-click editing on the My Page board

**User Role:** Member
**Steps:**
1. Double-click a card and edit subject and description.

**Expected Result:**
- The issue updates and is journaled.

---

### TC-AGB-135: Block settings — visible statuses

**User Role:** Member
**Steps:**
1. Open the block settings and change which statuses are shown.

**Expected Result:**
- Columns appear and disappear accordingly.
- The KB names "selected visible statuses do not include the issue statuses" as a troubleshooting cause for a board
  that looks empty, so confirm both directions of this setting.

---

### TC-AGB-136: Block settings — card fields, totals and WIP

**User Role:** Member
**Steps:**
1. Change card fields, enable totals (estimated time, spent time, Story Points) and set WIP limits in the block
   settings.

**Expected Result:**
- Cards, totals and WIP indicators all update as configured.
- Totals equal the sum of the issues in scope, not only the currently loaded page.

---

### TC-AGB-137: Block settings are stored per user

**User Role:** Two members
**Steps:**
1. A configures the block distinctively; B opens their own My Page.

**Expected Result:**
- B sees their own default configuration, unaffected by A. The KB states these preferences are per user (FAQ Q10).
- A preference leaking between users would be a real defect here, since My Page is inherently personal.

---

### TC-AGB-138: Column reordering on the My Page block

**User Role:** Member
**Steps:**
1. Enable Column Reordering in the block settings and drag a column.

**Expected Result:**
- The new order is saved **in this user's My Page block settings**, per the KB, and survives a reload.

---

### TC-AGB-139: Load more in large columns

**User Role:** Member with many assigned issues
**Steps:**
1. Use the load-more control in a large column.

**Expected Result:**
- More cards load without duplicates or gaps.

---

## Negative Cases

---

### TC-AGB-140: Global board without the required permission

**User Role:** Member lacking the board permission
**Steps:**
1. Confirm the top-menu entry is absent.
2. Request the global board URL **directly**.
3. Send a status-update request for one of its cards directly.

**Expected Result:**
- All three refused. A hidden menu whose URL still serves the global board is a High-severity defect, because that
  view aggregates every project the user could otherwise only reach one at a time.

---

### TC-AGB-141: Global drag without edit permission on the target project

**User Role:** Member who can view project B but not edit its issues
**Steps:**
1. Confirm B's cards are not draggable on the global board.
2. Send the status-update request for a B issue directly.

**Expected Result:**
- Not draggable **and** the direct request refused. Aggregating projects into one view must not aggregate
  permissions.

---

### TC-AGB-142: My Page board for a user with no assigned issues

**User Role:** A user with nothing assigned
**Steps:**
1. Add the block and view My Page.

**Expected Result:**
- Clean empty columns with an explanatory empty state — the KB treats this as an expected, diagnosable situation,
  not an error.

---

### TC-AGB-143: My Page block for an anonymous visitor

**User Role:** Anonymous (logged out)
**Steps:**
1. Attempt to reach My Page and the block's data endpoint with no session.

**Expected Result:**
- Redirect to login. The block is defined as the **current user's** assigned work, so it must not render for an
  unauthenticated request under any circumstances.

---

### TC-AGB-144: My Page board respects issue visibility, not just assignment

**User Role:** Member assigned an issue in a project their role can no longer view
**Steps:**
1. Remove the user's access to that project while keeping them as the assignee; reload My Page.

**Expected Result:**
- The issue no longer appears. Assignment alone must not grant visibility — this is a subtle leak path, because
  the block is naturally written as "issues where assignee = me".

---

### TC-AGB-145: Story Points hidden when disabled at plugin level

**User Role:** Member
**Steps:**
1. With Story Points disabled in plugin configuration, inspect the global board and the My Page block settings.

**Expected Result:**
- No Story Point card field, no Story Point totals, and no Story Point options in block settings — the KB states
  the feature is hidden across the Agile system when disabled. (Covered fully in the Story Points suite.)

---

### TC-AGB-146: Global board with a very large dataset

**User Role:** Member with access to many projects
**Steps:**
1. Open the global board on an instance with 100+ visible projects and thousands of issues.

**Expected Result:**
- The board loads in reasonable time using lazy loading and load-more. Record the timings.
- A browser hang here is a performance defect against the KB's "designed for high performance" claim.

---

### TC-AGB-147: My Page block after the module is disabled everywhere

**User Role:** Admin + Member
**Steps:**
1. Disable the Agile Board module on every project, then open a user's My Page with the block added.

**Expected Result:**
- The block renders empty or removes itself cleanly. Not a 500 that breaks the whole My Page for that user.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
