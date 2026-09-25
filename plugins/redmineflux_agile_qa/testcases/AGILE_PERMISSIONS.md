# Test Cases — Redmineflux Agile Board — Permissions & Access Control

> Source: vendor KB — Troubleshooting names three permissions to check ("View Agile Board", "Edit issues",
> "Manage sprints"); "How to Use the Agile Board on My Page" states issue movement follows normal Redmine
> permissions and workflow transitions; "How to Add a New Issue from the Agile Board" states creation depends on
> project permissions. No full matrix is published, so this suite establishes one.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Agile Board
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_agile_qa

## Methodology — mandatory for every case in this suite

A missing drag handle or hidden tab is **not** evidence that a write is blocked. This plugin adds four separate
write surfaces — project board, global board, My Page block, and Backlog — and each one must enforce the rules
independently. Every case is checked three ways:

1. **Positive UI** — the permitted role performs the action through real navigation and it works.
2. **Negative UI** — the denied role sees no control.
3. **Negative endpoint** — the denied role is refused when the request is sent **directly**.

The governing question throughout: *does each board surface enforce the same rule the issue form enforces?*
Any surface where it does not is the defect. It is not enough to verify this once on the project board.

---

## Permissions matrix to establish

| Action | Admin | Manager | Developer | QA | Reporter | Non-member | Anonymous |
|--------|-------|---------|-----------|-----|----------|------------|-----------|
| View project Agile Board | | | | | | | |
| View Global Agile Board | | | | | | | |
| Use the My Page block | | | | | | | |
| View Backlog | | | | | | | |
| Quick-add an issue from a column | | | | | | | |
| Drag a card between statuses | | | | | | | |
| Double-click edit a card | | | | | | | |
| Drag in the Backlog (sprint/version assignment) | | | | | | | |
| Create / edit / delete sprints | | | | | | | |
| Change board settings (columns, WIP, card fields) | | | | | | | |
| Create / edit / delete custom boards | | | | | | | |
| Change plugin configuration | | | | | | | |

Fill in from observed behaviour, not assumption. Record the exact permission set of each role tested.

---

## Functional Cases

---

### TC-AGB-170: Admin has full access

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Exercise every row of the matrix as Admin, on all four board surfaces.

**Expected Result:**
- All actions succeed.

---

### TC-AGB-171: View Agile Board gates board access

**User Role:** Member of the project on a role lacking the permission
**Priority:** High
**Steps:**
1. Confirm no Agile Board tab appears.
2. Request the project board URL directly.
3. Request the board's data endpoint directly.

**Expected Result:**
- All three refused. No issue subjects or counts leak in any response body.

---

### TC-AGB-172: Board viewing and issue editing are separate permissions

**User Role:** Member with View Agile Board but **without** edit-issues
**Priority:** High
**Steps:**
1. Confirm the board renders read-only: cards visible, no drag handles, no quick-add, no edit modal save.
2. Send, directly: a status-update request, a quick-add request, and a card-edit request.

**Expected Result:**
- The board is viewable; all three direct requests are refused with 403.
- This separation is the plugin's most important boundary — the board is a write surface for anyone who can drag,
  and viewing must not imply editing.

---

### TC-AGB-173: Workflow transitions are enforced at the endpoint

**User Role:** Member on a role with a restricted workflow
**Priority:** High
**Steps:**
1. Confirm the board does not apply a forbidden transition by drag (paired with TC-AGB-195).
2. Send the forbidden status change **directly** to the board's endpoint.

**Expected Result:**
- Refused with the same error the issue form produces.
- A board that filters transitions client-side but accepts anything server-side lets any member bypass the
  workflow entirely — High severity.

---

### TC-AGB-174: Quick-add requires issue-create permission

**User Role:** Member with edit rights but without create rights
**Priority:** High
**Steps:**
1. Confirm no quick-add control is offered.
2. Send the quick-add request directly.

**Expected Result:**
- Refused with 403. Creating and editing are distinct permissions in Redmine and must remain distinct here.

---

### TC-AGB-175: Sprint management requires its own permission

**User Role:** Member with full board access but without manage-sprints
**Priority:** High
**Steps:**
1. Confirm Sprint management is absent from Project Settings.
2. Send sprint create, update and **delete** requests directly.

**Expected Result:**
- All refused. Deleting a sprint detaches every issue assigned to it, so an unenforced delete endpoint would let
  any board user disrupt the team's planning — High severity.

---

### TC-AGB-176: Backlog drag is gated by edit permission

**User Role:** Member with view-only issue access
**Priority:** High
**Steps:**
1. Confirm Backlog cards are not draggable.
2. Send the sprint-assignment and version-assignment requests directly.

**Expected Result:**
- Refused at both. The Backlog is a separate surface and must be checked separately from the board.

---

### TC-AGB-177: Global board does not aggregate permissions

**User Role:** Member who can view project B but not edit its issues, and can edit in project A
**Priority:** High
**Steps:**
1. On the global board, confirm A's cards are draggable and B's are not.
2. Send a status-update request for a B issue directly.

**Expected Result:**
- Per-project permissions are applied per card, and the direct request for B is refused.
- A global view that grants the union of permissions across projects would be a Critical defect.

---

### TC-AGB-178: My Page block respects visibility as well as assignment

**User Role:** Member assigned an issue in a project they can no longer view
**Priority:** High
**Steps:**
1. Remove the user's access to that project while leaving them as assignee; reload My Page.
2. Send a status-update request for that issue directly.

**Expected Result:**
- The issue is absent from the block **and** the direct update is refused.
- "Assignee = me" is the natural way to write this block and the natural place to forget the visibility check —
  making this a subtle but real leak path.

---

### TC-AGB-179: Non-member cannot reach a private project's board or backlog

**User Role:** Authenticated non-member
**Priority:** High
**Preconditions:** **Confirm the project is genuinely private** — a newly created Redmine project has "Public"
checked by default; uncheck it explicitly or this case falsely passes.
**Steps:**
1. Request the project board URL, the Backlog URL, and the board data endpoint directly.

**Expected Result:**
- All refused. No issue subjects, sprint names or counts in any response body, including error bodies.

---

### TC-AGB-180: Anonymous user has no access

**User Role:** Anonymous (logged out)
**Priority:** High
**Steps:**
1. Request the project board, the global board, the Backlog and My Page with no session.
2. Send a status-update request with no session.

**Expected Result:**
- Redirect to login or 403 for all. An anonymous write path to issue statuses would be Critical.

---

### TC-AGB-181: Issue-visibility-scoped roles

**User Role:** Role whose issue visibility is limited to issues they created
**Priority:** High
**Steps:**
1. Open the project board and confirm which cards render.
2. Send a status-update request for another user's issue in the same project.

**Expected Result:**
- Only visible issues are rendered, column counts reflect only those, and the update for another user's issue is
  refused.
- A board that draws cards for issues the user cannot open is a data leak, and column counts computed over the
  unfiltered set leak information even when the cards do not.

---

### TC-AGB-182: Board settings and custom boards are permission-gated

**User Role:** Member with view-only board access
**Priority:** High
**Steps:**
1. Confirm the Settings icon and custom-board create/edit/delete controls are absent.
2. Send board-settings and custom-board create/edit/delete requests directly.

**Expected Result:**
- All refused. A shared board's configuration must not be changeable, and a shared board must not be deletable, by
  a user with only view access.

---

### TC-AGB-183: Permission revocation takes effect without re-login

**User Role:** Admin + affected member
**Priority:** High
**Steps:**
1. Remove edit-issues while the member has the board open mid-drag.
2. Member completes the drag without logging out.

**Expected Result:**
- Refused and the card returns to its original column. Permissions are evaluated per request, not cached in the
  page state.

---

### TC-AGB-184: Closed and archived projects

**User Role:** Member with full board permissions
**Priority:** High
**Steps:**
1. Close a project: open the board and Backlog, attempt a drag and a quick-add, at the UI and the endpoint.
2. Archive it and repeat. Also check whether its issues still appear on the global board and the My Page block.

**Expected Result:**
- Closed projects are viewable but read-only; archived projects are inaccessible everywhere, including the
  aggregate views.
- An archived project's issues still appearing on the global board is a defect — archiving is expected to remove
  them from view entirely.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
