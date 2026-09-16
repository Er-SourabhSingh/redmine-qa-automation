# Test Cases — Redmineflux Checklist — Checklist Templates

> Source: vendor KB — "How to Create a Checklist Template", "How to Edit and Delete a Checklist Template",
> "How to Create the Checklist from template".
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Checklist Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_checklist_qa

## Navigation methodology

Administration → Plugins → Redmineflux Checklist Plugin → Configure → **Checklist templates** tab.
Application side: issue detail → Checklist section → **Actions** → **Add from template**.

---

## Functional Cases — Creating templates

---

### TC-CHK-401: Create a checklist template bound to a tracker

**User Role:** Admin
**Steps:**
1. Open the Checklist templates tab and click **Add Checklist Template**.
2. Select a tracker (e.g. Bug) from the dropdown.
3. Enter a template name.
4. Add one checklist title.
5. Click **Create Checklist template**.

**Expected Result:**
- The template is created and listed on the Checklist templates tab with its name and tracker.
- A success message is shown.

---

### TC-CHK-402: Tracker dropdown lists all active trackers

**User Role:** Admin
**Steps:**
1. Compare the tracker dropdown contents with Administration → Trackers.

**Expected Result:**
- Every tracker configured on the instance is offered, with no duplicates and none missing.

---

### TC-CHK-403: Create a template with multiple checklist entries

**User Role:** Admin
**Steps:**
1. Create a template, then use **Add checklist** to add five title rows before saving.

**Expected Result:**
- All five rows are saved in order and shown when the template is reopened for edit.

---

### TC-CHK-404: Create a template with nested sub-checklist entries

**User Role:** Admin
**Steps:**
1. Use the add-sub-checklist control to nest entries under a parent entry, then save.

**Expected Result:**
- The hierarchy is preserved on save and reproduced when the template is applied to an issue.

---

### TC-CHK-405: Multiple templates can target the same tracker

**User Role:** Admin
**Steps:**
1. Create two differently-named templates both bound to the Bug tracker.

**Expected Result:**
- Both are created and both are offered when applying a template to a Bug issue.

---

## Functional Cases — Editing and deleting templates

---

### TC-CHK-406: Edit a template name

**User Role:** Admin
**Steps:**
1. Click **Edit** on an existing template, change its name, save.

**Expected Result:**
- The new name is shown in the list and in the issue-side template picker.

---

### TC-CHK-407: Edit a template's checklist entries

**User Role:** Admin
**Steps:**
1. Edit a template: rename one entry, add one, remove one. Save.

**Expected Result:**
- All three changes persist.
- **Issues that already had this template applied are unaffected** — applying a template copies its contents; it
  does not create a live link. Record the actual behaviour; retroactive mutation of existing issue checklists
  would be a High-severity finding.

---

### TC-CHK-408: Change a template's tracker binding

**User Role:** Admin
**Steps:**
1. Change an existing template's tracker from Bug to Task and save.
2. Open a Bug issue and a Task issue and check the template picker in each.

**Expected Result:**
- The template is now offered on Task issues and no longer on Bug issues.

---

### TC-CHK-409: Delete a template

**User Role:** Admin
**Steps:**
1. Click **Delete** on a template and confirm.

**Expected Result:**
- The template disappears from the list permanently (KB states deletion is permanent).
- It no longer appears in the issue-side picker.
- Checklists previously created from it on existing issues remain intact.

---

### TC-CHK-410: Cancel a template deletion

**User Role:** Admin
**Steps:**
1. Trigger Delete, then cancel the confirmation.

**Expected Result:**
- The template still exists after a page reload.

---

## Functional Cases — Applying a template

---

### TC-CHK-411: Apply a template to an issue

**User Role:** Member
**Steps:**
1. Open a Bug issue → Checklist section → **Actions** → **Add from template**.
2. Pick a template bound to Bug and confirm.

**Expected Result:**
- All of the template's entries are created on the issue, in order, with the correct nesting.
- All new items start in the incomplete state, regardless of anything in the template.

---

### TC-CHK-412: Applying a template is journaled

**User Role:** Member
**Steps:**
1. Apply a template, then open the issue History and the Checklist History tab.

**Expected Result:**
- An entry records that a template was applied, naming the template and the actor.

---

### TC-CHK-413: Apply a template on top of an existing checklist

**User Role:** Member
**Steps:**
1. On an issue that already has a checklist with completed items, apply a template.

**Expected Result:**
- The template's items are **added alongside** the existing checklist. Existing items and their completion states
  are not overwritten or reset.

---

### TC-CHK-414: Apply the same template twice

**User Role:** Member
**Steps:**
1. Apply the same template to the same issue twice.

**Expected Result:**
- Behaviour is explicit: either a second copy is created, or the action is refused with a clear message.
- It must not half-apply, producing a partially duplicated list.

---

## Negative Cases

---

### TC-CHK-415: Create a template with no name

**User Role:** Admin
**Steps:**
1. Leave the Template Name field blank and submit.

**Expected Result:**
- Rejected with a validation message naming the missing field. No nameless template is created.

---

### TC-CHK-416: Create a template with no checklist entries

**User Role:** Admin
**Steps:**
1. Provide a name and tracker but no entries; submit.

**Expected Result:**
- Either rejected with a clear message, or created and then, when applied, it adds nothing while saying so.
- Applying an empty template must not throw an error or create a blank unnamed checklist.

---

### TC-CHK-417: Create a template with no tracker selected

**User Role:** Admin
**Steps:**
1. Leave the tracker dropdown unselected and submit.

**Expected Result:**
- Rejected with a validation message, or explicitly saved as "all trackers" if that is a supported option —
  record which. An unbound template that appears nowhere is a defect.

---

### TC-CHK-418: Duplicate template names

**User Role:** Admin
**Steps:**
1. Create two templates with the same name on the same tracker.

**Expected Result:**
- Either rejected, or allowed with both distinguishable in the picker. Two identical-looking entries with no way
  to tell them apart is a usability defect worth recording.

---

### TC-CHK-419: HTML and special characters in template name and entries

**User Role:** Admin
**Steps:**
1. Create a template whose name and entries contain a script tag, quotes and an ampersand.
2. Apply it to an issue.

**Expected Result:**
- Rendered as literal text in both the admin list and the issue checklist. **No script executes** in either place.
  Execution is a Critical security defect.

---

### TC-CHK-420: Template with a very large number of entries

**User Role:** Admin
**Steps:**
1. Create a template with 100 entries and apply it to an issue.

**Expected Result:**
- The apply completes without timeout, all 100 items are created, and the issue page still renders acceptably.
- Record the wall-clock time; a multi-minute apply is a performance finding.

---

### TC-CHK-421: Template picker on an issue whose tracker has no templates

**User Role:** Member
**Steps:**
1. Open an issue on a tracker with no templates bound and choose **Add from template**.

**Expected Result:**
- A clear empty state ("no templates available for this tracker"). Not an empty silent dropdown and not an error.

---

### TC-CHK-422: Templates tab is not reachable by a non-admin

**User Role:** Non-admin member
**Steps:**
1. Request the plugin configuration URL directly as a non-admin.

**Expected Result:**
- 403 or redirect to login. Non-admins must not be able to create, edit or delete templates, by UI or by URL.

---

### TC-CHK-423: Changing an issue's tracker after applying a template

**User Role:** Member
**Steps:**
1. Apply a Bug-bound template to a Bug issue, then change the issue's tracker to Task.

**Expected Result:**
- The already-created checklist items remain on the issue — they are issue data now, not template data, and must
  not vanish when the tracker changes.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
