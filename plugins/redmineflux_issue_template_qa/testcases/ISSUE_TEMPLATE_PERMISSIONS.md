# Test Cases — Redmineflux Issue Template — Permissions & Access Control

> Source: the vendor KB publishes no permissions matrix. It states only that global templates are created by an
> administrator, and that the project-level Project list is "restricted … to display only the projects for which
> the user is a member". This suite establishes the matrix empirically and proves that restriction at the endpoint.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Issue Template Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_issue_template_qa

## Methodology — mandatory for every case in this suite

A hidden tab or a filtered dropdown is **not** evidence that access is blocked. Each case is checked three ways:

1. **Positive UI** — the permitted role reaches the function through real navigation and it works.
2. **Negative UI** — the denied role does not see the control.
3. **Negative endpoint** — the denied role is refused when the URL or request is sent **directly**.

Leg 3 is where real leaks are found. For this plugin it is especially important: the KB's membership restriction is
described as a property of the *rendered list*, which is exactly the shape of restriction that is commonly not
re-checked on submit.

---

## Permissions matrix to establish

| Action | Admin | Manager | Developer | QA | Reporter | Non-member | Anonymous |
|--------|-------|---------|-----------|-----|----------|------------|-----------|
| Open Administration → Issue Template | | | | | | | |
| Create a global template | | | | | | | |
| Edit / delete a global template | | | | | | | |
| Open a project's Issue Template tab | | | | | | | |
| Create a project template | | | | | | | |
| Edit / delete a project template | | | | | | | |
| Edit / delete a **global** template from inside a project | | | | | | | |
| See non-member projects in the Project list | | | | | | | |
| Use a template on New Issue | | | | | | | |

Fill in from observed behaviour, not from assumption. Where the UI and the endpoint disagree for a role, that row
is a bug, not a matrix entry.

---

## Functional Cases

---

### TC-RIT-059: Admin has full access

**User Role:** Admin
**Steps:**
1. Exercise every row of the matrix as Admin, at both the global and project levels.

**Expected Result:**
- All actions succeed.

---

### TC-RIT-060: Establish which role gates project template management

**User Role:** Manager, Developer, QA, Reporter (each in turn)
**Steps:**
1. For each role, record whether the project's Issue Template tab is visible.
2. Request the tab URL directly.
3. Send a template-create request directly.

**Expected Result:**
- A consistent gating rule emerges, and the UI and the endpoint agree for every role.
- Record the gating permission by name — the KB never states it, and every other case in this suite depends on
  knowing it.

---

### TC-RIT-061: Non-admins cannot reach the global template administration page

**User Role:** Every non-admin role in turn
**Steps:**
1. Confirm no Administration → Issue Template entry point is offered.
2. Request that URL directly.
3. Send a global-template create request directly.

**Expected Result:**
- All refused with 403. Global templates are instance-wide; a non-admin able to create one would inject content
  into projects they have no relationship with.

---

### TC-RIT-062: Non-admins cannot edit or delete a global template from inside a project

**User Role:** Project member with template rights
**Steps:**
1. On the project's Issue Template page, locate a global template row.
2. Attempt to edit it, then delete it, through the UI.
3. Send the edit and delete requests directly.

**Expected Result:**
- Refused at the endpoint, not only hidden in the UI.
- **This is the highest-impact case in the suite.** A project member deleting a global template would remove it
  from every other project bound to it — a cross-project destructive action available to a low-privilege user.

---

### TC-RIT-063: The Project list restriction holds at the endpoint

**User Role:** Non-admin member of projects A and B, not of private project C
**Preconditions:** **Confirm project C is genuinely private and this user has no membership path to it.** A newly
created Redmine project has "Public" checked by default; uncheck it explicitly or this case falsely passes.
**Steps:**
1. Confirm project C is absent from the rendered Project list (this repeats TC-RIT-074).
2. Submit a template-create request that **explicitly includes project C's ID** in the project list parameter.
3. Check whether the template appears on project C's Issue Template page and in its New Issue form.

**Expected Result:**
- The request is rejected, or the C binding is silently dropped — and the template must **not** become available
  in project C.
- The KB's claim is about what the list *displays*; this case proves whether the restriction is real. If the
  binding succeeds, an ordinary user can push content into any project on the instance, which is High severity.

---

### TC-RIT-064: Non-member cannot open a project's template page

**User Role:** Authenticated non-member
**Steps:**
1. Request the private project's Issue Template URL directly.
2. Request the edit URL of one of its templates directly.

**Expected Result:**
- 403 or not-found on both. No template name, subject or description appears in either response body, including
  error pages.

---

### TC-RIT-065: Anonymous user has no access

**User Role:** Anonymous (logged out)
**Steps:**
1. Request the Administration page, a private project's template page, and a template edit URL with no session.

**Expected Result:**
- Redirect to login or 403 for all three. No content in any response.

---

### TC-RIT-066: Anonymous access to a public project follows that project's rules

**User Role:** Anonymous
**Steps:**
1. On a deliberately public project, request the Issue Template tab and the New Issue form.

**Expected Result:**
- Template management is never available to anonymous users, regardless of project visibility.
- If anonymous issue creation is enabled, record whether templates apply — and confirm no template from a private
  project is offered.

---

### TC-RIT-067: Cross-project template edit via a crafted request

**User Role:** Member of project A only
**Steps:**
1. Obtain the ID of a template scoped to private project B.
2. Send an edit request and then a delete request for that template ID from A's session.

**Expected Result:**
- Both refused. The endpoint must authorise the **target template's** project, not merely that the caller holds
  template rights somewhere.
- A successful edit or delete here is a Critical cross-project defect.

---

### TC-RIT-068: Template visibility on New Issue matches project membership

**User Role:** Member of A only
**Steps:**
1. Open New Issue in project A and enumerate every template offered.

**Expected Result:**
- Only templates bound to A appear. No names or descriptions from other projects' templates leak into the selector.

---

### TC-RIT-069: Permission revocation takes effect without re-login

**User Role:** Admin + affected member
**Steps:**
1. Remove the member's template rights (or their project membership) while they hold a template edit form open.
2. Have them submit without logging out.

**Expected Result:**
- Rejected. Permissions are evaluated per request, not cached in the session.

---

### TC-RIT-070: Closed and archived projects

**User Role:** Member
**Steps:**
1. Close a project, then attempt to view, create and edit its templates, at the UI and the endpoint.
2. Archive it and repeat.

**Expected Result:**
- Closed projects are read-only and archived projects inaccessible, matching Redmine's own semantics, at the
  endpoint as well as in the UI.
- An archived project must not still be offered as a binding target on the creation form (see TC-RIT-081).

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
