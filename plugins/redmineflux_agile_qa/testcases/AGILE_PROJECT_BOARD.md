# Test Cases — Redmineflux Agile Board — Project Board: Cards, Quick Add, Drag & Edit

> Source: vendor KB — "How to View the Agile Board", "How to Add a New Issue from the Agile Board",
> "How to Update an Issue from the Agile Board", "How to Change Issue Status with Drag and Drop", FAQ Q1, Q7.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Agile Board
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_agile_qa

## Navigation methodology

Project → **Agile Board** tab. Do not type the URL. Every board action must be confirmed against the **core
Redmine issue page** or after a full reload — a card that moved while the issue's status did not change is the
central defect class this suite exists to catch.

---

## Functional Cases — Board rendering

---

### TC-AGB-185: Project board opens from the project menu

**User Role:** Member with View Agile Board
**Steps:**
1. Open a project and click **Agile Board**.

**Expected Result:**
- The board renders with status columns and issue cards.
- Only issues from this project appear — the project board is single-project scoped (FAQ Q1).

---

### TC-AGB-186: Cards are placed in the correct status column

**User Role:** Member
**Steps:**
1. Pick five issues of known statuses and locate their cards.

**Expected Result:**
- Each card sits under its issue's actual status. Cross-check against the issue list filtered by status —
  a card in the wrong column misrepresents the whole board.

---

### TC-AGB-187: Card content matches the issue

**User Role:** Member
**Steps:**
1. Compare a card's ID, subject, tracker, priority and assignee with the issue page.

**Expected Result:**
- All shown values match exactly, including the tracker and priority icons configured at plugin level.

---

### TC-AGB-188: Column issue counts are accurate

**User Role:** Member
**Steps:**
1. Compare each column's count with the same status filtered on the issue list.

**Expected Result:**
- Counts match. A count that includes issues the user cannot see, or excludes ones they can, is a defect.

---

### TC-AGB-189: Large columns load more cards

**User Role:** Member
**Steps:**
1. Open a board with a column holding several hundred issues and use the load-more control.

**Expected Result:**
- Additional cards load without duplicating or skipping any.
- The total loaded eventually equals the column's stated count.

---

## Functional Cases — Quick add

---

### TC-AGB-190: Quick-add an issue into a column

**User Role:** Member with issue-create rights
**Steps:**
1. Use the quick add control in a column, enter a subject, confirm.

**Expected Result:**
- A new issue is created **with that column's status**, per the KB.
- The card appears immediately and the issue exists in Redmine with the expected project, status and subject.

---

### TC-AGB-191: Quick-add applies project defaults for unspecified fields

**User Role:** Member
**Steps:**
1. Quick-add an issue, then open it in full.

**Expected Result:**
- Tracker, priority and other unspecified fields take the project's defaults, as the KB notes, and the issue is
  valid — not a half-created record that the standard form would refuse.

---

### TC-AGB-192: Quick-add respects required fields

**User Role:** Member
**Steps:**
1. Quick-add on a tracker whose required custom fields the quick form does not collect.

**Expected Result:**
- Either the required fields are prompted for, or the creation is refused with a message naming them.
- **Silently creating an issue that violates required-field rules is a High-severity defect** — it puts records
  into the project that the normal form would have blocked, and they surface later as unsaveable issues.

---

### TC-AGB-193: Quick-add into a column whose status is not the default

**User Role:** Member
**Steps:**
1. Quick-add directly into an "In Progress"-style column rather than the first column.

**Expected Result:**
- The issue is created in that status if the workflow allows a new issue to start there; otherwise the action is
  refused with an explanation. Not silently created in a different status than the column implies.

---

## Functional Cases — Drag and drop

---

### TC-AGB-194: Drag a card to another status column

**User Role:** Member with edit rights
**Steps:**
1. Drag a card from one column to another and drop it.
2. Reload, then open the issue.

**Expected Result:**
- The issue's status is updated to the target column's status and the change is journaled.
- The card remains in the target column after reload.

---

### TC-AGB-195: A workflow-blocked transition is not applied

**User Role:** Member on a role with a restricted workflow
**Steps:**
1. Drag a card into a column whose status the workflow forbids from the current one.

**Expected Result:**
- The move is **not applied** — the KB states this plainly — and the card returns to its original column.
- A message explains why. Confirm the issue's status is unchanged; a card that stays in the new column while the
  status did not change is a misleading-state defect of the worst kind on a board.

---

### TC-AGB-196: Drag respects edit permission

**User Role:** Member with view-only access to issues
**Steps:**
1. Confirm cards are not draggable.
2. Send the status-update request **directly** to the board's endpoint.

**Expected Result:**
- Not draggable **and** the direct request refused with 403.

---

### TC-AGB-197: Drag within the same column

**User Role:** Member
**Steps:**
1. Drag a card and drop it back into its own column, at a different vertical position.

**Expected Result:**
- No status change and no spurious journal entry. If card ordering within a column is persisted, it persists
  consistently; if it is not, the card returns to its natural position rather than appearing to have moved.

---

### TC-AGB-198: Drag triggers the same side effects as a normal status change

**User Role:** Member, with a watcher on the issue
**Steps:**
1. Drag a card to a closed status.

**Expected Result:**
- The watcher is notified exactly as a normal edit would notify them, and any status-driven automation fires.
- A board move that bypasses notifications makes the board invisible to the rest of the team and is a defect.

---

## Functional Cases — Card editing

---

### TC-AGB-199: Double-click opens the edit modal

**User Role:** Member
**Steps:**
1. Double-click a card.

**Expected Result:**
- A modal opens allowing the issue **subject and description** to be edited, per the KB.

---

### TC-AGB-200: Saving the modal updates the issue and the board

**User Role:** Member
**Steps:**
1. Change the subject and description; save.
2. Reload and open the issue.

**Expected Result:**
- Both fields are updated on the issue and journaled.
- The card reflects the new subject immediately, without a manual reload.

---

### TC-AGB-201: Cancelling the modal writes nothing

**User Role:** Member
**Steps:**
1. Open the modal, change both fields, cancel.

**Expected Result:**
- Nothing is written. Confirm via reload and the issue's History.

---

### TC-AGB-202: Modal validation matches the standard form

**User Role:** Member
**Steps:**
1. Clear the subject and save.

**Expected Result:**
- Rejected with the same required-field validation the standard issue form applies. A modal that accepts an empty
  subject is a High-severity defect.

---

## Negative Cases

---

### TC-AGB-203: Script content in a subject or description

**User Role:** Member
**Steps:**
1. Via quick add and via the edit modal, enter a script tag as the subject and in the description.
2. View the board as another user, including in the card's tooltip and any description card field.

**Expected Result:**
- Escaped and rendered literally everywhere a card shows it. **No script executes** — Critical if it does, and the
  board renders other users' content to every team member, which makes this a genuine stored-XSS surface.

---

### TC-AGB-204: Very long subject

**User Role:** Member
**Steps:**
1. Quick-add an issue with a 1000-character subject.

**Expected Result:**
- Rejected with a stated maximum, or rendered truncated on the card without breaking the column layout.

---

### TC-AGB-205: Concurrent moves of the same card

**User Role:** Two members
**Steps:**
1. Both have the board open. A drags the card to column X; B, without reloading, drags it to column Y.

**Expected Result:**
- The second move either wins cleanly or is refused with a stale-state message. Both users see the same status
  after reload, and the issue History shows each real transition once.

---

### TC-AGB-206: Issue deleted while its card is on screen

**User Role:** Two members
**Steps:**
1. A has the board open. B deletes the issue. A drags the now-stale card.

**Expected Result:**
- A clear failure message and the card disappears on reconciliation. No 500 and no write against a deleted issue.

---

### TC-AGB-207: Network failure mid-drag

**User Role:** Member
**Steps:**
1. Take the network offline and drag a card.

**Expected Result:**
- A visible error and the card returns to its original column. It must not be left in the target column looking
  committed.

---

### TC-AGB-208: Session expiry mid-action

**User Role:** Member
**Steps:**
1. Let the session expire, then drag a card and then open the edit modal.

**Expected Result:**
- A clear message or redirect to login in both cases. Not a silent no-op that reads as success.

---

### TC-AGB-209: Board in a closed or archived project

**User Role:** Member
**Steps:**
1. Close the project: open the board, attempt a drag and a quick add, at the UI and at the endpoint.
2. Archive it and repeat.

**Expected Result:**
- Closed projects are read-only, archived ones inaccessible — matching Redmine's own semantics, enforced at the
  endpoint as well as the UI.

---

### TC-AGB-210: Issue moved to a status hidden from the board

**User Role:** Member
**Steps:**
1. Change an issue's status from the issue page to one **not** enabled in the board's column settings.
2. Reload the board.

**Expected Result:**
- The card is absent from the board, and this is discoverable — the column settings explain why.
- Cards must not silently pile into a wrong column because their status has no column; that would misreport the
  board's counts.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
