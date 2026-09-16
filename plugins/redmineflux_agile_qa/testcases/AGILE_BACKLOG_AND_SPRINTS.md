# Test Cases — Redmineflux Agile Board — Backlog, Sprints & Version Planning

> Source: vendor KB — "How to Use the Backlog", "How to Create and Manage Sprints",
> "How to Assign Issues to a Sprint", "How to Use Version Planning in Backlog", FAQ Q5.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Agile Board
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_agile_qa

## Navigation methodology

Project → **Backlog** tab for planning; Project → **Settings** → **Sprint management** for sprint CRUD.
Do not type URLs. Confirm every sprint assignment on the **issue page's sprint field**, not only by where the card
sits in the Backlog.

---

## Functional Cases — Sprint management

---

### TC-AGB-501: Create a sprint

**User Role:** Member with manage-sprints rights
**Steps:**
1. Project → Settings → **Sprint management** → **New Sprint**.
2. Enter name, description, start date, end date, duration (if used), status and sharing option. Save.

**Expected Result:**
- The sprint is created and listed with all entered values.
- It becomes selectable on the Scrum board and as a Backlog column.

---

### TC-AGB-502: Edit a sprint

**User Role:** Member with manage-sprints rights
**Steps:**
1. Select a sprint, change its name and dates, save.

**Expected Result:**
- Changes persist and are reflected on the Backlog columns and the Scrum board's sprint selector.
- Issues already assigned to it stay assigned — renaming must not detach work.

---

### TC-AGB-503: Delete a sprint

**User Role:** Member with manage-sprints rights
**Steps:**
1. Delete a sprint that has issues assigned; confirm.
2. Open one of those issues.

**Expected Result:**
- The sprint is removed and its issues are left **unassigned but intact**, with the outcome stated in the
  confirmation before it happens.
- Silent loss of issues, or issues left pointing at a deleted sprint so that their page errors, would be Critical.

---

### TC-AGB-504: Cancel a sprint deletion

**User Role:** Member
**Steps:**
1. Trigger the delete and cancel the confirmation.

**Expected Result:**
- The sprint still exists after a reload, with its issues still assigned.

---

### TC-AGB-505: Sprint sharing option behaves as configured

**User Role:** Member
**Steps:**
1. Create a sprint with sharing enabled and check whether it is available in sub-projects or other projects,
   according to the sharing value chosen.

**Expected Result:**
- The sprint appears exactly where its sharing setting says it should, mirroring how Redmine shares versions.
- A shared sprint appearing in a project the user cannot see would be a visibility defect.

---

### TC-AGB-506: Sprint status controls its lifecycle

**User Role:** Member
**Steps:**
1. Set a sprint's status (e.g. open vs closed/completed) and observe the Backlog and Scrum board.

**Expected Result:**
- The status is respected — a closed sprint is not offered as an assignment target, or is clearly marked.
- Record the exact behaviour; the KB lists Status as a field but does not say what it does.

---

## Functional Cases — Backlog view

---

### TC-AGB-507: Backlog opens and shows its columns

**User Role:** Member
**Steps:**
1. Open a project and click **Backlog**.

**Expected Result:**
- Sprint columns, version columns, and a column of issues assigned to neither, per the KB.

---

### TC-AGB-508: Drag an issue into a sprint column

**User Role:** Member with edit rights
**Steps:**
1. Drag an unassigned issue into a sprint column.
2. Reload, then open the issue.

**Expected Result:**
- The issue's sprint field is set and the change is journaled.
- The issue leaves the unassigned column.

---

### TC-AGB-509: Drag an issue into a version column

**User Role:** Member
**Steps:**
1. Drag an issue into a version column; confirm on the issue page.

**Expected Result:**
- The issue's target version is set. Version planning and sprint planning are independent — setting one must not
  clear the other unless that is deliberate and journaled.

---

### TC-AGB-510: Move an issue between sprints

**User Role:** Member
**Steps:**
1. Drag an issue from sprint A's column to sprint B's.

**Expected Result:**
- The sprint changes, with one journal entry recording old and new values.

---

### TC-AGB-511: Remove an issue from a sprint

**User Role:** Member
**Steps:**
1. Drag an issue from a sprint column back to the unassigned column.

**Expected Result:**
- The sprint field is cleared and the change is journaled.

---

### TC-AGB-512: Backlog lazy-loads large datasets

**User Role:** Member
**Steps:**
1. Open the Backlog on a project with several thousand issues and scroll a large column.

**Expected Result:**
- Cards load progressively, as the KB states, without duplicating or skipping issues.
- Record the initial load time; loading every issue at once contradicts the stated design and is a performance
  defect.

---

### TC-AGB-513: Backlog search and filters

**User Role:** Member
**Steps:**
1. Apply the Backlog's search and filters.

**Expected Result:**
- Columns narrow consistently and counts update to match the filtered set.

---

### TC-AGB-514: Backlog card field settings

**User Role:** Member
**Steps:**
1. Change the Backlog's card field settings.

**Expected Result:**
- Cards update accordingly, independently of the Agile Board's own card field selection.

---

## Functional Cases — Assigning issues to sprints by other routes

---

### TC-AGB-515: Assign from the issue edit form

**User Role:** Member
**Steps:**
1. Open an issue → Edit → choose a Sprint → Save.

**Expected Result:**
- The sprint is set and the issue immediately appears in that sprint's Backlog column and on the Scrum board.
- The sprint field offers only sprints valid for this project.

---

### TC-AGB-516: Bulk-assign issues to a sprint

**User Role:** Manager
**Steps:**
1. Select several issues in the issue list and apply a sprint update.

**Expected Result:**
- All selected issues are assigned, each journaled.
- Issues for which the assignment is invalid are reported clearly rather than silently skipped.

---

### TC-AGB-517: Sprint field appears on the issue form only when relevant

**User Role:** Member
**Steps:**
1. Open the issue form in a project **without** the Agile Board module enabled.

**Expected Result:**
- No sprint field, or an inert one. The plugin must not add a mandatory-looking field to projects that do not use
  it.

---

## Negative Cases

---

### TC-AGB-518: Sprint with a blank name

**User Role:** Member
**Steps:**
1. Create a sprint leaving the name empty.

**Expected Result:**
- Rejected with a validation message. An unnamed sprint column is unusable in the Backlog.

---

### TC-AGB-519: Sprint end date before start date

**User Role:** Member
**Steps:**
1. Enter an end date earlier than the start date and save.

**Expected Result:**
- Rejected with a clear message.

---

### TC-AGB-520: Overlapping sprints

**User Role:** Member
**Steps:**
1. Create two sprints with overlapping date ranges.

**Expected Result:**
- Record whether this is allowed. Overlap is legitimate in many teams, so either behaviour is acceptable — but if
  it is refused, the message must say so clearly rather than failing generically.

---

### TC-AGB-521: Duplicate sprint names

**User Role:** Member
**Steps:**
1. Create two sprints with the same name in one project.

**Expected Result:**
- Either rejected, or both distinguishable in the Backlog columns and the sprint selector.
- Two identical, indistinguishable columns is a usability defect — issues get dragged into the wrong one.

---

### TC-AGB-522: Script content in a sprint name or description

**User Role:** Member
**Steps:**
1. Create a sprint whose name and description contain a script tag; view the Backlog and the sprint selector.

**Expected Result:**
- Escaped and rendered literally. **No script executes** — Critical if it does.

---

### TC-AGB-523: Very long sprint name

**User Role:** Member
**Steps:**
1. Create a sprint with a 500-character name.

**Expected Result:**
- Rejected with a stated maximum, or truncated in the column header without breaking the Backlog layout.

---

### TC-AGB-524: Sprint management without permission

**User Role:** Member without manage-sprints rights
**Steps:**
1. Confirm the Sprint management section is absent from Project Settings.
2. Request its URL directly.
3. Send sprint create, update and **delete** requests directly.

**Expected Result:**
- All refused with 403.
- Sprint deletion detaches every assigned issue, so an unenforced delete endpoint would let any member disrupt a
  whole team's planning — High severity.

---

### TC-AGB-525: Backlog drag without edit permission

**User Role:** Member with view-only issue access
**Steps:**
1. Confirm cards are not draggable in the Backlog.
2. Send the sprint-assignment request directly.

**Expected Result:**
- Not draggable **and** the direct request refused.

---

### TC-AGB-526: Concurrent sprint assignment

**User Role:** Two members
**Steps:**
1. Both have the Backlog open. A drags an issue to sprint X; B, without reloading, drags it to sprint Y.

**Expected Result:**
- The second write wins cleanly or is refused with a stale-state message. Both see the same sprint after reload.

---

### TC-AGB-527: Issue moved to a project where the sprint does not apply

**User Role:** Member
**Steps:**
1. Assign an issue to a sprint, then move the issue to a different project where that sprint is not shared.

**Expected Result:**
- The sprint is cleared or the move is refused with an explanation. The issue must not keep a sprint that does not
  exist in its new project — that produces a card that appears in a Backlog the issue no longer belongs to.

---

### TC-AGB-528: Backlog on a project with no sprints and no versions

**User Role:** Member
**Steps:**
1. Open the Backlog on a bare project.

**Expected Result:**
- A clean layout showing only the unassigned column, with a route to create a sprint. Not an error and not a blank
  page.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
