# Test Cases — Redmineflux Agile Board — Board Settings: Columns, WIP, Card Fields, Board Type

> Source: vendor KB — "How to Customize Card Fields", "How to Configure Board Columns and WIP Limits"
> (including Column Reordering), "How to Use Scrum Board View", FAQ Q2, Q3.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Agile Board
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_agile_qa

## Navigation methodology

Open a board → the **Settings** icon → the relevant section → **Apply**. Every setting must be verified by its
effect on the board, not by the panel closing without error.

---

## Functional Cases — Board columns

---

### TC-AGB-301: Enable and disable status columns

**User Role:** Member with board-settings rights
**Steps:**
1. Settings → **Board Columns** → disable one status, enable another → Apply.

**Expected Result:**
- The disabled status's column disappears and the enabled one appears.
- Cards in a disabled status are no longer shown (see TC-AGB-226 for the consequence).

---

### TC-AGB-302: Column selection persists

**User Role:** Member
**Steps:**
1. Configure columns, leave the board, return.

**Expected Result:**
- The same columns are shown. The configuration survives navigation and a fresh login.

---

### TC-AGB-303: Set a WIP limit on a column

**User Role:** Member
**Steps:**
1. Settings → Board Columns → enter a WIP value for one column → Apply.

**Expected Result:**
- The column displays its limit alongside its current count.

---

### TC-AGB-304: Exceeding a WIP limit is made visible

**User Role:** Member
**Steps:**
1. Set a WIP of 2 on a column, then drag a third card into it.

**Expected Result:**
- The column is visibly flagged as over limit — the KB's stated purpose is to "make overloaded columns visible".
- Record whether the move is **blocked** or merely **flagged**. The KB describes WIP limits as a visibility aid,
  not an enforcement mechanism, so flagging is the expected behaviour; a hard block would be a documented-behaviour
  mismatch worth recording either way.

---

### TC-AGB-305: WIP limit is capped by the plugin-level maximum

**User Role:** Member
**Steps:**
1. With the instance maximum set to 5, attempt a column WIP of 10.

**Expected Result:**
- Capped or rejected with a message naming the instance maximum (paired with TC-AGB-109).

---

### TC-AGB-306: Enable Column Reordering and reorder columns

**User Role:** Member
**Steps:**
1. Settings → enable **Column Reordering** → Apply.
2. Drag a status column to a new position.

**Expected Result:**
- Columns become draggable and the new order is saved for that board configuration, per the KB.
- The order survives a reload.

---

### TC-AGB-307: Disabling Column Reordering locks the order

**User Role:** Member
**Steps:**
1. Disable Column Reordering and attempt to drag a column.

**Expected Result:**
- Columns cannot be dragged and stay in their configured order, exactly as the KB states.

---

## Functional Cases — Card fields

---

### TC-AGB-308: Select card fields and apply

**User Role:** Member
**Steps:**
1. Settings → **Card Fields** → select several fields → Apply.

**Expected Result:**
- Each selected field appears on every card with the correct value; deselected fields disappear.

---

### TC-AGB-309: Every documented card field renders correctly

**User Role:** Member
**Steps:**
1. Enable each of the KB's listed fields in turn and verify its value against the issue page:
   Issue ID, Subject, Tracker, Priority, Assignee, Author, Start date, Due date, Estimated time, Spent time,
   Done ratio, Parent task, Subtask count, Description, Last comment, Tags, Category, Target version,
   Comment count, Attachment count.

**Expected Result:**
- All twenty render their real values. An empty value shows as blank, not as a placeholder or an error.
- Record per field — a field that silently renders blank for every issue is a defect against a named capability,
  and a blanket "cards work" result would hide it.

---

### TC-AGB-310: Derived counts are accurate

**User Role:** Member
**Steps:**
1. On an issue with 3 comments, 2 attachments and 4 subtasks, compare the card's comment count, attachment count
   and subtask count.

**Expected Result:**
- All three match the issue exactly. Counts are the easiest card fields to get wrong and the least likely to be
  noticed.

---

### TC-AGB-311: Spent time and estimated time totals

**User Role:** Member
**Steps:**
1. Enable estimated and spent time as card fields and as column totals.

**Expected Result:**
- Card values match the issue; column totals equal the sum of the cards currently loaded in that column.
- If a column is lazily loaded, the total must reflect the **whole** column, not only the loaded page — a total
  that grows as you scroll is a real reporting defect.

---

### TC-AGB-312: Tags card field integrates with the Tag plugin

**User Role:** Member
**Preconditions:** The Redmineflux Tag plugin installed with tags assigned.
**Steps:**
1. Enable the Tags card field.

**Expected Result:**
- Tags render on the card in their configured colours and match the issue's tags.
- If the Tag plugin is absent, the field is either not offered or renders empty — not an error.

---

### TC-AGB-313: Card fields are stored per board configuration

**User Role:** Member
**Steps:**
1. Set different card fields on two saved custom boards of the same project.

**Expected Result:**
- Each board keeps its own card field selection; switching between them switches the layout.

---

## Functional Cases — Board type

---

### TC-AGB-314: Switch the board to Scrum mode

**User Role:** Member
**Steps:**
1. Settings → set **Board Type** to **Scrum** → Apply.

**Expected Result:**
- Sprint selection becomes available and the board can be filtered by sprint, per the KB.

---

### TC-AGB-315: Scrum board shows one sprint at a time

**User Role:** Member
**Steps:**
1. In Scrum mode, select a sprint.

**Expected Result:**
- Only that sprint's issues are shown. Issues in other sprints and unassigned issues are excluded.
- Column counts reflect the sprint filter, not the whole project.

---

### TC-AGB-316: Switch back to Kanban mode

**User Role:** Member
**Steps:**
1. Set Board Type back to **Kanban** → Apply.

**Expected Result:**
- Sprint selection disappears and all issues matching the board's filters are shown again.
- No sprint filter remains silently applied — a stuck filter after switching modes would make the board appear to
  have lost issues.

---

## Negative Cases

---

### TC-AGB-317: All columns disabled

**User Role:** Member
**Steps:**
1. Disable every status column and Apply.

**Expected Result:**
- Either refused with a message requiring at least one column, or an empty board with a clear explanation and a
  way back to the settings panel.
- The user must not be able to lock themselves out of a board they can no longer configure.

---

### TC-AGB-318: Invalid WIP values

**User Role:** Member
**Steps:**
1. Enter a negative number, a decimal and a non-numeric value as a column WIP.

**Expected Result:**
- Each rejected with a clear message. No column ends up with an uninterpretable limit.

---

### TC-AGB-319: WIP limit of zero

**User Role:** Member
**Steps:**
1. Set a column WIP to 0.

**Expected Result:**
- Either rejected, or treated as "no work allowed" and flagged consistently. It must not be treated as "no limit"
  while displaying `0` — that reads as the opposite of what it does.

---

### TC-AGB-320: Status deleted while used as a column

**User Role:** Admin + Member
**Steps:**
1. Enable a status column, then delete that status in Administration, then reopen the board.

**Expected Result:**
- The column is dropped cleanly or shown as unavailable. Not a 500 and not a permanently unopenable board.

---

### TC-AGB-321: Custom field deleted while used as a card field

**User Role:** Admin + Member
**Steps:**
1. Enable a custom field as a card field, delete the custom field, reopen the board.

**Expected Result:**
- The field is dropped silently or with a note. The board still renders.

---

### TC-AGB-322: Card fields showing data the user cannot see

**User Role:** Member with limited custom-field or spent-time visibility
**Steps:**
1. Enable Spent time and any restricted custom field as card fields.

**Expected Result:**
- Values the user is not permitted to see are **not** rendered on the card.
- A board card is an easy place to leak a restricted field's value, because the permission check lives on the
  issue page rather than the card renderer. A leak here is High severity — check the values, not just that the
  field name appears.

---

### TC-AGB-323: Settings changes by one user do not affect another

**User Role:** Two members
**Steps:**
1. A changes columns, WIP and card fields on the shared project board; B opens the same board.

**Expected Result:**
- Record the actual scope. Project board settings may legitimately be shared configuration rather than per-user —
  but whichever it is must be consistent and discoverable, and My Page settings are explicitly per user (covered in
  the My Page suite).
- A shared board silently overwritten by any member's preference change is worth recording as a usability finding.

---

### TC-AGB-324: Settings panel without permission

**User Role:** Member with view-only board access
**Steps:**
1. Confirm the Settings icon is absent or the panel will not open.
2. Send a board-settings update request directly.

**Expected Result:**
- Refused at both legs. A view-only user must not be able to reconfigure a shared board through its endpoint.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
