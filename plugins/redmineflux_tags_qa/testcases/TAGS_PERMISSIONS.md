# Test Cases — Redmineflux Tag Plugin — Permissions & Access Control

> Source: vendor KB — FAQ Q3 ("users are not allowed to edit or delete the tags, only the admin or who have
> permission"), "How to Viewing a tag plugin" (tag management is in the administration area).
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Tag Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_tags_qa

## Methodology — mandatory for every case in this suite

A hidden link is **not** evidence that access is blocked. Each case is checked three ways:

1. **Positive UI** — the permitted role reaches the function through real navigation and it works.
2. **Negative UI** — the denied role does not see the control.
3. **Negative endpoint** — the denied role is refused when the URL or API endpoint is requested **directly**.

Leg 3 is where real leaks are found. A case verified only by legs 1 and 2 is not complete.

---

## Permissions matrix to confirm

| Action | Admin | Manager | Developer | QA | Reporter | Non-member | Anonymous |
|--------|-------|---------|-----------|-----|----------|------------|-----------|
| View tags on an issue | | | | | | | |
| Add a tag to an issue | | | | | | | |
| Create a new tag from the issue form | | | | | | | |
| Remove a tag from an issue | | | | | | | |
| Filter issues by tag | | | | | | | |
| Open a tag's entity listing | | | | | | | |
| Rename a tag (global) | | | | | | | |
| Delete a tag (global) | | | | | | | |
| Change tag colour / plugin settings | | | | | | | |

Fill this in from observed behaviour during execution, not from assumption.

---

## Functional Cases

---

### TC-TAG-042: Admin has full access

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Exercise every row of the matrix as Admin.

**Expected Result:**
- All actions succeed, including Manage Tags and the plugin settings page.

---

### TC-TAG-043: A member with issue-edit rights can assign and remove tags

**User Role:** Developer or equivalent
**Priority:** High
**Steps:**
1. On an issue in a project they belong to, add a tag, create a brand-new tag, and remove a tag.

**Expected Result:**
- All succeed — tag assignment follows the issue-edit permission.

---

### TC-TAG-044: A read-only member can see tags but not change them

**User Role:** Role with view-issues but not edit-issues
**Priority:** High
**Steps:**
1. Open a tagged issue and confirm tags are visible.
2. Confirm the Tags field is not editable and no add/remove control is offered.
3. Send a tag-assign and a tag-remove request directly to their endpoints.

**Expected Result:**
- Legs 1 and 2 as described; **leg 3 both requests rejected with 403**.

---

### TC-TAG-045: A non-admin member cannot rename or delete a tag globally

**User Role:** Manager, Developer, QA, Reporter (each in turn)
**Priority:** High
**Steps:**
1. Confirm no rename/delete control appears anywhere in the project UI.
2. Request the plugin configuration page directly.
3. Send the rename and the delete requests directly to their endpoints, for each role.

**Expected Result:**
- All refused, 403 on every direct request. This is the concrete verification of KB FAQ Q3.
- A role that is refused the settings page but accepted at the rename/delete endpoint is a High-severity defect —
  a single member could rename a tag across every issue on the instance.

---

### TC-TAG-046: Creating a new tag from the issue form is gated by issue-edit, not by admin

**User Role:** Developer
**Priority:** Medium
**Steps:**
1. As a non-admin with edit rights, type a brand-new tag name on an issue and save.

**Expected Result:**
- The tag is created — this is the documented flow.
- Note the asymmetry deliberately: ordinary users can **create** tags globally but not rename or delete them.
  Confirm that a user who can create cannot thereby edit an existing one.

---

### TC-TAG-047: Non-member cannot see tags in a private project

**User Role:** Authenticated non-member
**Priority:** High
**Preconditions:** Project confirmed **not** public — a newly created Redmine project defaults to public.
**Steps:**
1. Request the issue URL directly.
2. Request the tag listing page for a tag used only in that project.

**Expected Result:**
- 403 or not-found on the issue.
- The tag listing returns no rows from that project — no subject, ID or tag-usage count leaks.

---

### TC-TAG-048: Anonymous user cannot see tags in a private project

**User Role:** Anonymous (logged out)
**Priority:** High
**Steps:**
1. Repeat TC-TAG-047 with no session.

**Expected Result:**
- Redirect to login or 403 everywhere. No tag content in any response body.

---

### TC-TAG-049: Anonymous access to a public project follows that project's rules

**User Role:** Anonymous
**Priority:** Medium
**Steps:**
1. On a deliberately public project, open a tagged issue and a tag listing.

**Expected Result:**
- Tags visible read-only if issues are visible to anonymous; never editable.

---

### TC-TAG-050: Tag listing page does not leak across project boundaries

**User Role:** Member of project A only
**Priority:** High
**Preconditions:** Confirm the target tag is genuinely used in two distinct projects and that project B is private
with no membership path for this user — otherwise a passing result proves nothing.
**Steps:**
1. Open the tag listing page as this user.

**Expected Result:**
- Only project A rows. Any project B row is a High-severity cross-project data leak.

---

### TC-TAG-051: Tag filter dropdown does not leak tag names

**User Role:** Member of project A only
**Priority:** High
**Steps:**
1. Open the tag filter dropdown on the global issue list.

**Expected Result:**
- Record whether tags used only in projects the user cannot see are listed.
- Tag names are global by design, so their presence may be expected — but confirm no **counts or issue data** from
  invisible projects are exposed alongside them.

---

### TC-TAG-052: Permission revocation takes effect without re-login

**User Role:** Admin + affected member
**Priority:** Medium
**Steps:**
1. Remove edit-issues from the member's role while they hold an issue edit form open.
2. Have them submit a tag change without logging out.

**Expected Result:**
- Rejected. Permissions are evaluated per request, not cached in the session.

---

### TC-TAG-053: Tag operations on an archived project

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Archive a project containing tagged issues.
2. Attempt to open one of its issues and to open a tag listing that included it.

**Expected Result:**
- The archived project's issues are inaccessible and absent from the tag listing, matching Redmine's own
  archived-project semantics.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
