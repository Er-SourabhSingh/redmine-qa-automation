# Test Cases — Redmineflux Agile Board — Custom Saved Boards & Story Points

> Source: vendor KB — "How to Create Custom Agile Boards", "How to Edit or Remove Custom Agile Boards",
> "How to Enable and Use Story Points", FAQ Q4, Q6.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Agile Board
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_agile_qa

## Navigation methodology

Custom boards: project **Agile Board** → the saved-board list / sidebar.
Story Points: Administration → Plugins → Redmineflux Agile Board → Configure.

> **Warning:** the Story Points toggle is instance-wide and hides or reveals the feature across every Agile
> surface. Record its original value and restore it when this suite ends.

---

## Functional Cases — Custom saved boards

---

### TC-AGB-801: Create a custom board

**User Role:** Member with board-management rights
**Steps:**
1. Open the project Agile Board → the custom board list → create a new board.
2. Enter board details and select columns, card fields, totals, filters and grouping. Save.

**Expected Result:**
- The board is saved and appears in the custom board list.
- Opening it applies all five saved aspects at once.

---

### TC-AGB-802: Multiple custom boards coexist for one project

**User Role:** Member
**Steps:**
1. Create three boards for distinct purposes — e.g. bug triage, QA, release monitoring — with different columns,
   filters and grouping.
2. Switch between them.

**Expected Result:**
- Each retains its own configuration independently. Switching applies the selected board's settings completely,
  with nothing carried over from the previous one.
- This is the feature's whole point (FAQ Q4); leakage between boards is the defect to look for.

---

### TC-AGB-803: Edit a custom board

**User Role:** Member
**Steps:**
1. Select a saved board → Edit → change its columns and filters → Save.

**Expected Result:**
- Changes persist and take effect immediately.
- Other saved boards are unaffected.

---

### TC-AGB-804: Delete a custom board

**User Role:** Member
**Steps:**
1. Select a board → Delete → confirm.

**Expected Result:**
- It disappears from the list. The project's default board still works.
- **No issues are affected** — a board is a view, and deleting one must never touch issue data.

---

### TC-AGB-805: Cancel a custom board deletion

**User Role:** Member
**Steps:**
1. Trigger the delete and cancel the confirmation.

**Expected Result:**
- The board still exists after a reload with its configuration intact.

---

### TC-AGB-806: Board visibility and sharing rules

**User Role:** Two members with different roles
**Steps:**
1. Create a board with each available visibility/sharing option and check who can see it.

**Expected Result:**
- The board appears exactly to the audience its sharing setting names, mirroring how Redmine shares saved queries.
- A board marked private that another user can see is a defect; so is a board shared with a role that cannot see
  it at all.

---

### TC-AGB-807: A custom board's filters do not widen visibility

**User Role:** Member with restricted issue visibility
**Steps:**
1. Open a board created by a user with broader access.

**Expected Result:**
- Only issues this viewer may see are rendered, regardless of what the board's saved filter would otherwise match.
- A saved board must not become a way to read issues the viewer could not reach directly — this is the most likely
  real leak in the custom board feature and would be High severity.

---

### TC-AGB-808: Custom board survives configuration changes elsewhere

**User Role:** Admin + Member
**Steps:**
1. Save a board using a status, a custom field and a target version; then delete each of those in Administration.
2. Reopen the board.

**Expected Result:**
- The board opens, dropping the missing elements cleanly or noting them. Not a 500 and not a board that can never
  be opened or edited again.

---

## Negative Cases — Custom boards

---

### TC-AGB-809: Board with a blank name

**User Role:** Member
**Steps:**
1. Create a board leaving the name empty.

**Expected Result:**
- Rejected with a validation message. An unnamed entry in the board list is unselectable in practice.

---

### TC-AGB-810: Duplicate board names

**User Role:** Member
**Steps:**
1. Create two boards with the same name in one project.

**Expected Result:**
- Either rejected, or both distinguishable. Two identical entries is a usability defect, because deleting the
  wrong one is irreversible.

---

### TC-AGB-811: Script content in a board name

**User Role:** Member
**Steps:**
1. Name a board with a script tag and view the board list.

**Expected Result:**
- Escaped and rendered literally. **No script executes** — Critical if it does, and a shared board's name is
  rendered to every user who can see it.

---

### TC-AGB-812: Editing or deleting another user's board

**User Role:** Member who is not the board's owner
**Steps:**
1. Confirm whether edit/delete controls are offered on a board owned by someone else.
2. Send the edit and delete requests directly.

**Expected Result:**
- Consistent with the board's sharing rules, and enforced at the endpoint.
- A member able to delete a shared team board through its endpoint, with no UI control offered, is a High-severity
  defect.

---

### TC-AGB-813: Very many custom boards

**User Role:** Member
**Steps:**
1. Create 50 custom boards on one project and open the list.

**Expected Result:**
- The list remains usable — scrollable, searchable or paginated — and the board loads in reasonable time.

---

## Functional Cases — Story Points

---

### TC-AGB-851: Story Points are disabled by default

**User Role:** Admin
**Steps:**
1. On a fresh installation, open the plugin configuration.

**Expected Result:**
- The Story Points toggle is **off**, as the KB states (FAQ Q6).

---

### TC-AGB-852: Enabling Story Points exposes the feature everywhere

**User Role:** Admin then Member
**Steps:**
1. Enable Story Points, enter the allowed values, save.
2. Check the project board, the global board, the My Page block, the Backlog, and the issue form.

**Expected Result:**
- Story Points are available in all five places the KB names — as a card field, in totals, in board settings, and
  as an issue field.
- A build where it appears on some surfaces but not others is a defect against an explicit list.

---

### TC-AGB-853: Only the configured values are selectable

**User Role:** Member
**Steps:**
1. Configure the allowed values (e.g. 1, 2, 3, 5, 8, 13) and open the Story Points field on an issue.

**Expected Result:**
- Exactly those values are offered, in order, with no extras and none missing.

---

### TC-AGB-854: Story Points display on cards

**User Role:** Member
**Steps:**
1. Enable Story Points as a card field; set values on several issues.

**Expected Result:**
- Each card shows its issue's Story Points; issues without a value show blank, not zero — blank and zero mean
  different things in estimation and must not be conflated.

---

### TC-AGB-855: Story Point totals per column

**User Role:** Member
**Steps:**
1. Enable Story Point totals and compare a column's total against the sum of its cards.

**Expected Result:**
- The total equals the sum of all issues in the column, including any not yet lazily loaded.
- A total that only counts loaded cards, and grows as you scroll, is a real reporting defect — sprint capacity
  decisions are made from this number.

---

### TC-AGB-856: Story Points on the Backlog

**User Role:** Member
**Steps:**
1. View Story Points on Backlog cards and any sprint totals.

**Expected Result:**
- Values and per-sprint totals are correct — this is the number teams plan sprints with.

---

### TC-AGB-857: Story Point changes are journaled

**User Role:** Member
**Steps:**
1. Change an issue's Story Points and open its History.

**Expected Result:**
- Recorded with old and new values, like any other field change.

---

### TC-AGB-858: Disabling Story Points hides the feature completely

**User Role:** Admin then Member
**Steps:**
1. With values already set on issues, disable Story Points and save.
2. Re-check the project board, global board, My Page block, Backlog, issue form and every board settings panel.

**Expected Result:**
- No Story Point field, no totals, no card field option, no board settings option, and inactive controls —
  the KB lists all four of these consequences explicitly.
- **Existing Story Point values are retained in the data, not destroyed**, so re-enabling restores them
  (TC-AGB-859). A disable that silently deletes estimation data would be a Critical defect.

---

### TC-AGB-859: Re-enabling restores previously stored values

**User Role:** Admin then Member
**Steps:**
1. Re-enable Story Points and open an issue that had a value before it was disabled.

**Expected Result:**
- The original value is still present. This is the confirming half of TC-AGB-858.

---

## Negative Cases — Story Points

---

### TC-AGB-860: A stored value outside the configured list

**User Role:** Admin then Member
**Steps:**
1. Set an issue to 13, then remove 13 from the allowed values in plugin configuration.
2. Open that issue and its card.

**Expected Result:**
- The stored value is still displayed rather than silently blanked, and editing the issue either keeps it or
  requires an allowed value with a clear message.
- Silently zeroing the estimate of every issue holding a removed value would be a High-severity data defect.

---

### TC-AGB-861: Empty Story Point values list

**User Role:** Admin
**Steps:**
1. Enable Story Points but leave the allowed values empty; save.

**Expected Result:**
- Rejected with a message, or the field is offered with no selectable options and that state is obvious.
- The feature must not appear enabled but be unusable with no explanation.

---

### TC-AGB-862: Story Points on a parent issue with subtasks

**User Role:** Member
**Steps:**
1. Set Story Points on subtasks and inspect the parent's card and column totals.

**Expected Result:**
- Record whether the parent rolls up its children's points or holds its own.
- Whichever it does, the **column total must not double-count** parent and children. Double counting inflates
  sprint capacity figures and is a genuine planning defect.

---

### TC-AGB-863: Non-admin cannot change Story Point configuration

**User Role:** Every non-admin role in turn
**Steps:**
1. Request the plugin configuration URL directly and attempt to post a Story Points change.

**Expected Result:**
- Refused with 403. Disabling Story Points is instance-wide and would remove the field from every team's boards.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
