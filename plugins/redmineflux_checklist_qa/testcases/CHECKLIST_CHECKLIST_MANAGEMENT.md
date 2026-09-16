# Test Cases — Redmineflux Checklist — Checklist & Item Management

> Source: vendor KB https://www.redmineflux.com/knowledge-base/plugins/checklist-plugin/ — sections "Configuration",
> "How to Create Checklist", "How to Edit and Delete the Checklist", "How To Create Sub Checklist item",
> FAQ "Can I create multiple checklists within a single issue?".
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Checklist Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_checklist_qa

## Navigation methodology

Reach the widget by clicking through real navigation: top menu **Issues** → an issue row → scroll to the
**Checklist** section. Do not jump straight to a deep URL.

---

## Functional Cases — Creating checklists

---

### TC-CHK-201: Create a checklist via Actions → New checklist

**User Role:** Member with issue-edit rights
**Steps:**
1. Open an issue and scroll to the Checklist section.
2. Click **Actions** → **New checklist**.
3. Type a title and press **Enter**.

**Expected Result:**
- The checklist is created and appears in the list immediately.
- It persists after a full page reload — not just an optimistic client-side row.

---

### TC-CHK-202: Create multiple checklists in a single issue

**User Role:** Member
**Steps:**
1. Repeat TC-CHK-201 three times with distinct titles on the same issue.

**Expected Result:**
- All three coexist, each with its own item list and its own progress bar.
- Ordering is stable across reloads.
- Confirms the KB FAQ claim that multiple checklists per issue are supported.

---

### TC-CHK-203: Create a sub-checklist item under a checklist

**User Role:** Member
**Steps:**
1. Click the action button next to an existing checklist.
2. Choose **Add**.
3. Enter a title and press Enter.

**Expected Result:**
- The item is nested under its parent checklist, not created as a sibling top-level checklist.
- The parent's progress denominator increases by one.

---

### TC-CHK-204: Add several items to one checklist consecutively

**User Role:** Member
**Steps:**
1. Add five items in sequence to the same checklist.

**Expected Result:**
- All five persist in creation order.
- The input stays focused or reopens so items can be added consecutively without re-opening the menu each time —
  the KB describes a press-Enter-to-create flow.

---

### TC-CHK-205: Checklist survives an issue update made from another form

**User Role:** Member
**Steps:**
1. Create a checklist with items.
2. Edit the issue subject/description via the normal Edit form and save.

**Expected Result:**
- Checklist and all items are intact after the save. An unrelated issue update must not drop checklist data.

---

## Functional Cases — Editing

---

### TC-CHK-206: Edit a checklist title

**User Role:** Member
**Steps:**
1. Open the action menu next to a checklist and choose **Edit**.
2. Change the title and press Enter.

**Expected Result:**
- The new title is shown and persists after reload.

---

### TC-CHK-207: Edit a sub-checklist item title

**User Role:** Member
**Steps:**
1. Open the action menu on an item, click the edit icon, change the text, press Enter.

**Expected Result:**
- Item text updates and persists; sibling items are unchanged.

---

### TC-CHK-208: Cancel an in-progress edit

**User Role:** Member
**Steps:**
1. Begin editing an item, change the text, then press Escape or click away without confirming.

**Expected Result:**
- The original text is retained. The abandoned edit is not silently saved.

---

## Functional Cases — Deleting

---

### TC-CHK-209: Delete a single checklist item

**User Role:** Member
**Steps:**
1. Open the action menu on an item and choose delete.
2. Confirm the deletion prompt.

**Expected Result:**
- Only that item is removed; the parent checklist and its other items remain.
- Progress recalculates against the new item count.

---

### TC-CHK-210: Delete a whole checklist that contains items

**User Role:** Member
**Steps:**
1. Open the action menu on a checklist that contains items and choose delete.
2. Confirm.

**Expected Result:**
- The checklist and all of its items are removed together.
- The confirmation makes clear that child items go too. A silent cascade with no warning is a usability defect
  worth recording.

---

### TC-CHK-211: Cancel a delete confirmation

**User Role:** Member
**Steps:**
1. Trigger delete on a checklist, then **Cancel** the confirmation.

**Expected Result:**
- Nothing is deleted. The row is still present after a reload.

---

### TC-CHK-212: Expand and collapse a checklist

**User Role:** Member
**Steps:**
1. Click the up-arrow icon next to a checklist to collapse it, then again to expand.

**Expected Result:**
- Items hide and reappear.
- The collapsed/expanded state does not corrupt item data or progress on reload.

---

### TC-CHK-213: Checklist History tab records checklist activity

**User Role:** Member
**Steps:**
1. Create, edit and delete checklist items on one issue.
2. Open the issue's Checklist History tab.

**Expected Result:**
- Each action is recorded with actor and timestamp.
- Entries correspond one-to-one with the actions performed — no missing and no phantom rows.

---

## Negative Cases

---

### TC-CHK-214: Create a checklist with an empty title

**User Role:** Member
**Steps:**
1. Actions → New checklist, leave the field blank, press Enter.

**Expected Result:**
- Creation is rejected with a validation message, or the Enter is a no-op.
- A blank-titled, unidentifiable checklist row must not be created.

---

### TC-CHK-215: Create a checklist with a whitespace-only title

**User Role:** Member
**Steps:**
1. Enter only spaces and tabs, then press Enter.

**Expected Result:**
- Treated the same as empty (TC-CHK-214) — input is trimmed before validation.

---

### TC-CHK-216: Very long checklist title

**User Role:** Member
**Steps:**
1. Enter a 1000-character title and submit.

**Expected Result:**
- Either accepted and rendered without breaking the page layout, or rejected with a stated maximum length.
- A silent truncation with no message is a defect; a 500 error is a High-severity defect.

---

### TC-CHK-217: Special characters and HTML in a checklist title

**User Role:** Member
**Steps:**
1. Create items titled with a script tag, a double-quoted string, an apostrophe-and-ampersand name, and an emoji.

**Expected Result:**
- All are stored and rendered as literal text.
- **No script executes** — the markup is escaped. Script execution here is a Critical security defect.

---

### TC-CHK-218: Duplicate checklist titles on one issue

**User Role:** Member
**Steps:**
1. Create two checklists with an identical title on the same issue.

**Expected Result:**
- Behaviour is consistent and explicit: either both are allowed with distinct IDs and independently editable, or
  the second is rejected with a clear message. Editing one must never modify the other.

---

### TC-CHK-219: Checklist edit on a closed issue

**User Role:** Member
**Steps:**
1. Close an issue that has a checklist.
2. Attempt to add, edit and delete a checklist item.

**Expected Result:**
- Behaviour matches the instance's issue-edit rules. If the issue is read-only when closed, the checklist controls
  are disabled too — not merely hidden while the underlying endpoint still accepts writes.

---

### TC-CHK-220: Concurrent edits from two sessions

**User Role:** Two members in separate browser sessions
**Steps:**
1. Both open the same issue's checklist.
2. User A adds an item; User B, without reloading, deletes a different item.

**Expected Result:**
- Both operations resolve without data loss and without a stale-state exception.
- After both reload, the resulting list is consistent for both users.

---

### TC-CHK-221: Deleting the issue removes its checklists

**User Role:** Manager or Admin
**Steps:**
1. Delete an issue that has checklists.
2. Look for orphaned rows in plugin views and in the Checklist History of other issues.

**Expected Result:**
- Checklist data is removed with the issue. No orphaned records surface elsewhere in the UI.

---

### TC-CHK-222: Checklist section on an issue in a project where the plugin is not applicable

**User Role:** Member
**Steps:**
1. Open an issue in a project whose tracker/module configuration excludes checklists (if such a configuration
   exists on this instance).

**Expected Result:**
- The Checklist section is either absent cleanly or present and functional — never present-but-broken
  (visible controls that error on use).

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
