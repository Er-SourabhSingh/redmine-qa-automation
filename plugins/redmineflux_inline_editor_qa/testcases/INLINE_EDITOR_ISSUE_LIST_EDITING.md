# Test Cases — Redmineflux Inline Editor — Editing from the Issue Table

> Source: vendor KB — "Configuration" (hover a row, click the pencil icon, edit without reloading),
> "How to Edit Issue Table".
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Inline Editor Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_inline_editor_qa

## Navigation methodology

Top menu **Issues** → hover a row or a cell → click the pencil icon. Do not jump to a deep URL.
Every "saved" result must be confirmed by a **full page reload**, not by the optimistic on-screen update — an
inline editor that only updates the DOM is the central failure mode of this plugin.

---

## Functional Cases

---

### TC-INE-201: Pencil icon appears on hover

**User Role:** Member with issue-edit rights
**Steps:**
1. Open the issue list and hover over a row, then over individual cells.

**Expected Result:**
- The row/cell highlights and a pencil icon appears, exactly as the KB describes.
- The icon appears only on fields that are actually editable — an icon on a read-only column that then fails is a
  defect.

---

### TC-INE-202: Inline-edit the Status column

**User Role:** Member
**Steps:**
1. Click the pencil on an issue's Status cell, choose a different status.
2. **Reload the page.**

**Expected Result:**
- The new status is shown before and after the reload.
- No full page reload was required to make the change — the KB's core claim.

---

### TC-INE-203: Inline-edit the Priority column

**User Role:** Member
**Steps:**
1. Change Priority inline and reload.

**Expected Result:**
- Value persists. The priority dropdown offers exactly the instance's configured priorities.

---

### TC-INE-204: Inline-edit the Subject column

**User Role:** Member
**Steps:**
1. Change the Subject inline and reload.

**Expected Result:**
- The new subject persists and is reflected on the issue detail page and anywhere else the subject is rendered.

---

### TC-INE-205: Inline-edit the Assignee column

**User Role:** Member
**Steps:**
1. Change the assignee inline and reload.

**Expected Result:**
- Persists. The dropdown lists only users who are assignable on that issue's project — not every user on the
  instance.

---

### TC-INE-206: Inline-edit a date column

**User Role:** Member
**Steps:**
1. Change Start date, then Due date, inline.

**Expected Result:**
- A date picker or a validated date input is offered and the value persists.
- Locale date formatting matches the rest of the instance.

---

### TC-INE-207: Inline-edit a custom field column

**User Role:** Member
**Preconditions:** At least one custom field of each type (list, text, integer, date, boolean) added as a column.
**Steps:**
1. Inline-edit each custom field type in turn.

**Expected Result:**
- Each renders the correct input control for its type and persists.
- The KB explicitly claims custom field support, so a type that silently fails is a defect against a stated feature.

---

### TC-INE-208: Change is journaled in the issue history

**User Role:** Member
**Steps:**
1. Make an inline change, then open the issue's History tab.

**Expected Result:**
- A normal journal entry with old value, new value, actor and timestamp — identical to what the standard Edit form
  would produce.
- An inline change that bypasses the journal is a High-severity auditability defect.

---

### TC-INE-209: Notifications fire as they would from the standard form

**User Role:** Member, with a watcher on the issue
**Steps:**
1. Inline-change the status of an issue that has a watcher.

**Expected Result:**
- The watcher receives the same notification the standard Edit form would have produced.
- Silent changes that skip notification are a defect — collaborators lose visibility of updates.

---

### TC-INE-210: Edits survive list sorting and filtering

**User Role:** Member
**Steps:**
1. Apply a filter and a sort, then inline-edit a field that the filter depends on (e.g. change Status while
   filtered to open issues).

**Expected Result:**
- The change persists.
- The row either updates in place or leaves the filtered set with a visible cue. It must not silently vanish in a
  way that looks like data loss, and it must not remain showing a value that contradicts the active filter.

---

### TC-INE-211: Multiple sequential edits on different rows

**User Role:** Member
**Steps:**
1. Inline-edit five different issues in a row without reloading, then reload.

**Expected Result:**
- All five changes persisted, each against the correct issue.
- Editing row 5 must not write to row 1 — a row-index binding bug is the classic failure here and would be High
  severity.

---

### TC-INE-212: Cancel an inline edit

**User Role:** Member
**Steps:**
1. Open an inline editor, change the value, then press Escape or click elsewhere without confirming.

**Expected Result:**
- The original value is retained and nothing is written. Confirm with a reload and with the issue History.

---

## Negative Cases

---

### TC-INE-213: Invalid value in a validated field

**User Role:** Member
**Steps:**
1. Inline-enter an invalid date (e.g. `31/02/2026`), a non-numeric value in an integer custom field, and an empty
   value in a required custom field.

**Expected Result:**
- Each is rejected with a visible, intelligible error **at the field**.
- The old value is retained. A rejected save that silently leaves the new value displayed until reload is a
  misleading-state defect.

---

### TC-INE-214: Required field cleared inline

**User Role:** Member
**Steps:**
1. Clear the Subject inline and confirm.

**Expected Result:**
- Rejected with the same validation the standard form applies. An inline path that bypasses a required-field rule
  is a High-severity defect.

---

### TC-INE-215: Workflow-forbidden status transition

**User Role:** Member on a role with a restricted workflow
**Steps:**
1. Attempt an inline status change that the workflow does not permit for this role.

**Expected Result:**
- The dropdown offers only permitted transitions, **and** a directly submitted forbidden transition is rejected.
- Inline editing must honour workflow rules, not just field presence.

---

### TC-INE-216: Read-only field per workflow field permissions

**User Role:** Member on a role where a field is read-only
**Steps:**
1. Confirm no pencil icon is offered on that field.
2. Send the field update request directly to the endpoint.

**Expected Result:**
- No icon, **and** the direct request is rejected with 403/422.
- A hidden icon whose endpoint still accepts writes is a High-severity permission defect.

---

### TC-INE-217: Read-only user

**User Role:** Role with view-issues but not edit-issues
**Steps:**
1. Hover rows in the issue list.
2. Send an inline update request directly.

**Expected Result:**
- No pencil icon anywhere, **and** the direct request is refused with 403.

---

### TC-INE-218: Concurrent edit from two sessions

**User Role:** Two members
**Steps:**
1. Both open the issue list. A inline-changes the status; B, without reloading, inline-changes the priority.

**Expected Result:**
- Both changes survive, or the second is refused with a clear stale-object message.
- B's save must not silently revert A's status change by writing a whole stale issue record — this is the most
  likely real defect in an inline editor and would be High severity.

---

### TC-INE-219: Session expiry mid-edit

**User Role:** Member
**Steps:**
1. Open an inline editor, let the session expire, then confirm the edit.

**Expected Result:**
- A clear message or a redirect to login. **Not** a silent failure that looks like a successful save.
- After logging back in, the value is confirmed unchanged.

---

### TC-INE-220: Network failure mid-save

**User Role:** Member
**Steps:**
1. Open an inline editor, take the network offline, confirm the edit.

**Expected Result:**
- A visible error. The displayed value reverts to the stored one rather than showing the unsaved value as if it had
  been written.

---

### TC-INE-221: Very long value

**User Role:** Member
**Steps:**
1. Inline-enter a 5000-character subject.

**Expected Result:**
- Rejected with a stated maximum, or accepted without breaking the table layout. Silent truncation with no message
  is a defect.

---

### TC-INE-222: HTML or script injected inline

**User Role:** Member
**Steps:**
1. Inline-enter a script tag as a subject and as a text custom field value.

**Expected Result:**
- Stored and rendered as literal text in the list, on the detail page and in the journal entry.
- **No script executes** — execution is a Critical security defect.

---

### TC-INE-223: Inline edit on an issue in a closed or archived project

**User Role:** Member
**Steps:**
1. Attempt an inline edit in a closed project, then in an archived project.

**Expected Result:**
- Refused, matching Redmine's own semantics, at the endpoint as well as in the UI.

---

### TC-INE-224: Inline edit of a closed issue

**User Role:** Member
**Steps:**
1. Inline-edit a field on a closed issue.

**Expected Result:**
- Behaviour matches the instance's rules for editing closed issues, and is the same as the standard Edit form's.
  A divergence between the two paths is the defect, whichever way it falls.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
