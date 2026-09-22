# Test Cases — Redmineflux Tag Plugin — Assigning & Removing Tags on Entities

> Source: vendor KB — "How to Viewing a tag plugin", "How to Tag Creation", FAQ Q2 (impact of renaming/deleting
> tags already assigned to entities).
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Tag Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_tags_qa

## Navigation methodology

Reach the Tags field through real navigation: top menu **Issues** → an issue → **Edit**, or **New issue** from a
project. Do not jump straight to a deep URL.

---

## Functional Cases — Creating and assigning tags

---

### TC-TAG-069: Add a new tag while creating an issue

**User Role:** Member with issue-create rights
**Steps:**
1. Open New issue.
2. In the **Tags** field type a tag name that does not yet exist and press Enter.
3. Fill the required fields and create the issue.

**Expected Result:**
- The tag is created and attached to the new issue.
- It appears on the issue detail page after creation and persists across a reload.

---

### TC-TAG-070: Add an existing tag via autocomplete

**User Role:** Member
**Steps:**
1. Edit an issue, type the first few characters of an existing tag in the Tags field.

**Expected Result:**
- Matching existing tags are suggested.
- Selecting a suggestion reuses the **existing** tag — it does not create a second tag with the same name.

---

### TC-TAG-071: Assign multiple tags to one issue

**User Role:** Member
**Steps:**
1. Add three distinct tags to one issue and save.

**Expected Result:**
- All three are shown on the issue, each as its own label/hyperlink in its own colour.
- Order is stable across reloads.

---

### TC-TAG-072: Remove a tag from an issue

**User Role:** Member
**Steps:**
1. Remove one of three tags (via the chip's remove control) and save.

**Expected Result:**
- Only that tag is detached from the issue; the other two remain.
- **The tag itself still exists** for other entities and in the admin tag list — detaching is not deleting.

---

### TC-TAG-073: Remove all tags from an issue

**User Role:** Member
**Steps:**
1. Clear the Tags field entirely and save.

**Expected Result:**
- The issue shows no tags. The save succeeds — an empty tag set is valid.
- The tags themselves still exist globally.

---

### TC-TAG-074: Tag changes are journaled in the issue history

**User Role:** Member
**Steps:**
1. Add one tag and remove another in a single save.
2. Open the issue History.

**Expected Result:**
- The change is recorded with old and new values, actor and timestamp — tags are auditable like any other field.

---

### TC-TAG-075: Tags are visible on the issue detail page

**User Role:** Member
**Steps:**
1. Open a tagged issue.

**Expected Result:**
- Tags render as labels/hyperlinks in the Tags field, in their assigned colours.

---

### TC-TAG-076: Clicking a tag lists all entities carrying it

**User Role:** Member
**Steps:**
1. Click a tag label on an issue.

**Expected Result:**
- Navigates to a listing of all entities tagged with it.
- The listing includes the issue clicked from, and respects the current user's visibility — issues in projects the
  user cannot see must not appear.

---

### TC-TAG-077: Tags survive unrelated issue updates

**User Role:** Member
**Steps:**
1. On a tagged issue, change status, assignee and description in a normal save.

**Expected Result:**
- Tags are unchanged. An unrelated field update must not silently drop them.

---

### TC-TAG-078: Bulk tag assignment from the issue list

**User Role:** Manager
**Steps:**
1. Select several issues in the issue list and use the context-menu/bulk edit to set a tag, if supported.

**Expected Result:**
- If bulk tagging is offered it applies to every selected issue and is journaled on each.
- If it is not offered, record that as a documented limitation rather than a defect.

---

## Negative Cases

---

### TC-TAG-079: Empty tag name

**User Role:** Member
**Steps:**
1. Press Enter in the Tags field with nothing typed; then with only spaces.

**Expected Result:**
- No tag is created in either case. An empty or whitespace-only tag must never enter the tag list — it is
  unselectable and unremovable once there.

---

### TC-TAG-080: Duplicate tag on the same issue

**User Role:** Member
**Steps:**
1. Add the same tag twice to one issue.

**Expected Result:**
- The second add is a no-op or is rejected. The tag appears exactly once on the issue.

---

### TC-TAG-081: Case sensitivity of tag names

**User Role:** Member
**Steps:**
1. Create a tag `Urgent`, then on another issue type `urgent` and `URGENT`.

**Expected Result:**
- Behaviour is consistent and explicit: either all three resolve to one tag, or they are three distinct tags.
- Record which. Silently creating near-duplicate tags that look identical in the filter dropdown is a usability
  defect worth filing.

---

### TC-TAG-082: Very long tag name

**User Role:** Member
**Steps:**
1. Create a 500-character tag name.

**Expected Result:**
- Either rejected with a stated maximum, or accepted and rendered without breaking the issue layout or the issue
  list column width. Silent truncation with no message is a defect.

---

### TC-TAG-083: Special characters and HTML in a tag name

**User Role:** Member
**Steps:**
1. Create tags containing a script tag, quotes, an ampersand, a comma, a leading/trailing space, and an emoji.

**Expected Result:**
- Stored and rendered as literal text everywhere a tag appears (issue page, list column, filter dropdown, tag
  listing page). **No script executes** — execution is a Critical security defect.
- Leading/trailing whitespace is trimmed rather than preserved into an invisible-looking duplicate.
- A comma does not split the input into two tags unless comma is a documented separator — record which.

---

### TC-TAG-084: Tag field on an issue the user may view but not edit

**User Role:** Read-only member
**Steps:**
1. Open a tagged issue as a user without edit-issues.
2. Confirm the Tags field is read-only.
3. Send a tag-update request to the endpoint directly.

**Expected Result:**
- Tags are visible but not editable, **and** the direct request is rejected with 403.

---

### TC-TAG-085: Assigning a tag to an issue in a closed or archived project

**User Role:** Member
**Steps:**
1. Attempt to tag an issue in a closed project, then in an archived project.

**Expected Result:**
- Matches Redmine's own semantics — closed projects read-only, archived inaccessible. The tag endpoint honours
  this, not only the page.

---

### TC-TAG-086: Deleting an issue removes its tag associations

**User Role:** Manager / Admin
**Steps:**
1. Delete a tagged issue.
2. Open the tag's entity listing and the admin tag list.

**Expected Result:**
- The deleted issue no longer appears in the tag's listing.
- The tag itself survives; any usage count shown is decremented correctly, not left stale.

---

### TC-TAG-087: Concurrent tag edits from two sessions

**User Role:** Two members
**Steps:**
1. Both open the same issue. A adds tag X; B, without reloading, adds tag Y and saves.

**Expected Result:**
- No lost update — after both reload, the issue carries both X and Y, or the second save is refused with a clear
  stale-object message. Silently discarding A's tag is a defect.

---

### TC-TAG-088: Tagging is possible on every entity type the plugin claims to support

**User Role:** Member
**Steps:**
1. For each entity type the installed build exposes a Tags field on (issues at minimum; projects and time entries
   if present), assign and remove a tag.

**Expected Result:**
- Works uniformly for each. Record exactly which entity types this build supports — the KB says "various entities"
  without enumerating them, so the observed list is the authority, not the KB wording.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
