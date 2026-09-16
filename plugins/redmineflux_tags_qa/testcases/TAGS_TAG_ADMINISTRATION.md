# Test Cases — Redmineflux Tag Plugin — Tag Administration (Manage Tags)

> Source: vendor KB — "How to Edit and Delete Tag", "Configuration" (Tag Color), FAQ Q1 (custom tag colours),
> FAQ Q2 (impact of renaming/deleting an assigned tag), FAQ Q3 (only admins/permitted users may edit or delete).
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Tag Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_tags_qa

## Navigation methodology

Administration → Plugins → Redmineflux Tag Plugin → Configure → **Manage Tags**.

---

## Functional Cases — Managing existing tags

---

### TC-TAG-301: Manage Tags lists every existing tag

**User Role:** Admin
**Steps:**
1. Create three tags from the issue side.
2. Open Manage Tags.

**Expected Result:**
- All three appear in the table, each with an edit and a delete control.
- Tags created from the issue form and tags created in administration appear in the same single list.

---

### TC-TAG-302: Rename a tag

**User Role:** Admin
**Steps:**
1. Edit a tag that is assigned to at least two issues and change its name; save.
2. Open both issues.

**Expected Result:**
- The new name is shown on **both** issues — the KB states renaming changes the name on all associated entities.
- The association itself is preserved; neither issue loses the tag.
- The tag's filter entry and its entity listing page use the new name.

---

### TC-TAG-303: Assign a specific colour to a tag

**User Role:** Admin
**Steps:**
1. Set a distinct colour on one tag; save.
2. View it on an issue, in the issue list Tag column and on its entity listing.

**Expected Result:**
- The colour is applied consistently in all three places, overriding the instance default.

---

### TC-TAG-304: Delete a tag that is not assigned anywhere

**User Role:** Admin
**Steps:**
1. Create an unused tag, then delete it from Manage Tags.

**Expected Result:**
- Removed from the list, from the filter dropdown and from autocomplete.

---

### TC-TAG-305: Delete a tag that is assigned to entities

**User Role:** Admin
**Steps:**
1. Delete a tag currently on three issues.
2. Open all three issues.

**Expected Result:**
- The tag is gone from all three; the issues themselves are intact and open without error.
- Issues that carried only that tag now show no tags — not a broken or blank tag chip.
- The KB warns this affects entities, so the UI should warn before deleting an in-use tag, ideally naming the
  usage count. Absence of any warning is a usability finding worth recording.

---

### TC-TAG-306: Cancel a tag deletion

**User Role:** Admin
**Steps:**
1. Trigger delete, then cancel the confirmation.

**Expected Result:**
- The tag still exists after a page reload and remains attached to its entities.

---

### TC-TAG-307: Tag usage count is accurate

**User Role:** Admin
**Steps:**
1. If Manage Tags shows a usage count, tag two more issues and re-check; then untag one and re-check.

**Expected Result:**
- The count tracks actual assignments exactly. A stale count is a defect.

---

### TC-TAG-308: Merging duplicate tags

**User Role:** Admin
**Steps:**
1. With two near-duplicate tags in use, attempt to merge them (or rename one to exactly match the other).

**Expected Result:**
- Record the actual behaviour. If renaming to an existing name is allowed, the result must be a clean merge or a
  clear rejection — **two tags with identical names and separate IDs is a defect**, since the filter dropdown then
  offers two indistinguishable entries.

---

## Negative Cases

---

### TC-TAG-309: Rename a tag to an empty or whitespace-only name

**User Role:** Admin
**Steps:**
1. Clear the name field and save; then try spaces only.

**Expected Result:**
- Rejected with a validation message in both cases. A nameless tag is unusable and unremovable from the UI.

---

### TC-TAG-310: Rename a tag to a name that already exists

**User Role:** Admin
**Steps:**
1. Rename tag A to exactly tag B's name.

**Expected Result:**
- Either rejected with a uniqueness message, or merged deliberately (see TC-TAG-308). Not silently duplicated.

---

### TC-TAG-311: HTML and special characters in a tag name via administration

**User Role:** Admin
**Steps:**
1. Rename a tag to include a script tag and quotes.
2. View it in Manage Tags, on an issue, in the filter dropdown and in autocomplete.

**Expected Result:**
- Escaped and rendered literally in all four. **No script executes** — a Critical security defect if it does.

---

### TC-TAG-312: Very long tag name via administration

**User Role:** Admin
**Steps:**
1. Rename a tag to 500 characters.

**Expected Result:**
- Rejected with a stated maximum, or accepted without breaking the Manage Tags table, the issue list column or the
  filter dropdown layout.

---

### TC-TAG-313: Non-admin cannot reach Manage Tags

**User Role:** Manager, Developer, QA, Reporter (each in turn)
**Steps:**
1. Confirm no tag-management entry point is visible in the project UI.
2. Request the plugin configuration URL directly for each role.
3. Send a tag rename and a tag delete request directly to their endpoints.

**Expected Result:**
- Every role is refused at all three legs, with 403 on the direct requests.
- This confirms the KB's FAQ Q3 claim that ordinary users cannot edit or delete tags. A role that is refused the
  page but accepted at the endpoint is a High-severity defect.

---

### TC-TAG-314: Deleting a tag mid-use by another session

**User Role:** Admin plus a member
**Steps:**
1. Member has an issue edit form open with tag X selected.
2. Admin deletes tag X.
3. Member saves the issue.

**Expected Result:**
- The save either succeeds without tag X or fails with a clear message. It must not 500 or write a dangling
  reference to a deleted tag.

---

### TC-TAG-315: Deleting a tag does not delete its entities

**User Role:** Admin
**Steps:**
1. Delete a tag assigned to several issues, then look for those issues in the issue list.

**Expected Result:**
- Every issue still exists. Only the association is removed. Any loss of issues here is Critical.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
