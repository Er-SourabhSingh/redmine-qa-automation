# Test Cases — Redmineflux Checklist — Permissions & Access Control

> Source: vendor KB — "Configuration" (admin vs. user actions) plus the repo standard that every permission case
> must cover all three legs: positive UI, negative UI-absence, and negative direct-URL/endpoint.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Checklist Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_checklist_qa

## Methodology — mandatory for every case in this suite

A hidden menu link is **not** evidence that access is blocked. Each case must be checked three ways:

1. **Positive UI** — the permitted role reaches the function through real navigation and it works.
2. **Negative UI** — the denied role does not see the control.
3. **Negative endpoint** — the denied role is refused when the URL or API endpoint is requested **directly**.

Leg 3 is where real leaks are found. A case verified only by legs 1 and 2 is not complete.

---

## Permissions matrix to confirm

| Action | Admin | Manager | Developer | QA | Reporter | Non-member | Anonymous |
|--------|-------|---------|-----------|-----|----------|------------|-----------|
| View checklist on an issue | | | | | | | |
| Create checklist / item | | | | | | | |
| Edit checklist / item | | | | | | | |
| Delete checklist / item | | | | | | | |
| Change item status | | | | | | | |
| Apply template to issue | | | | | | | |
| Manage checklist templates | | | | | | | |
| Change plugin configuration | | | | | | | |

Fill this in during execution from observed behaviour, not from assumption.

---

## Functional Cases

---

### TC-CHK-901: Admin has full access

**User Role:** Admin
**Steps:**
1. Exercise every row of the matrix as Admin.

**Expected Result:**
- All actions succeed, including the Administration-level template and configuration screens.

---

### TC-CHK-902: A project member with issue-edit rights can manage checklists

**User Role:** Developer or equivalent
**Steps:**
1. Create, edit, delete, and status-change checklist items on an issue in a project they belong to.

**Expected Result:**
- All succeed. Checklist management follows the issue-edit permission.

---

### TC-CHK-903: A read-only member can view but not modify

**User Role:** Role with view-issues but not edit-issues
**Steps:**
1. Open an issue with a checklist. Confirm items and progress are visible.
2. Confirm add/edit/delete controls are absent.
3. Send the create, update and delete requests directly to their endpoints.

**Expected Result:**
- Leg 1 read-only view works; leg 2 controls absent; **leg 3 all three requests rejected with 403**.

---

### TC-CHK-904: Non-member cannot see checklists in a private project

**User Role:** Authenticated user who is not a member of the project
**Steps:**
1. Confirm the project is **not** public (a newly created Redmine project defaults to public — uncheck it).
2. Open the issue URL directly.
3. Request the checklist data endpoint directly.

**Expected Result:**
- 403 or "not found" on both. No checklist titles, item text or counts leak in any response body.

---

### TC-CHK-905: Anonymous user cannot see checklists in a private project

**User Role:** Anonymous (logged out)
**Steps:**
1. Repeat TC-CHK-904 with no session.

**Expected Result:**
- Redirected to login or 403. No checklist content in the response.

---

### TC-CHK-906: Anonymous access to a public project follows the project's own rules

**User Role:** Anonymous
**Steps:**
1. On a deliberately public project, open an issue with a checklist.

**Expected Result:**
- Checklist visibility matches the anonymous role's view-issues permission — visible read-only if issues are
  visible, and never editable.

---

### TC-CHK-907: Only admins can manage checklist templates

**User Role:** Manager, Developer, QA, Reporter (each in turn)
**Steps:**
1. Confirm no template management entry point exists in the project UI.
2. Request the plugin configuration URL directly for each role.

**Expected Result:**
- Every non-admin role is refused at the URL. Template creation, edit and delete are admin-only.

---

### TC-CHK-908: Applying a template requires issue-edit rights

**User Role:** Read-only member
**Steps:**
1. Confirm the **Add from template** action is absent.
2. Send the apply-template request directly.

**Expected Result:**
- Rejected with 403. Applying a template is a write to the issue and must be gated as one.

---

### TC-CHK-909: Cross-project isolation of templates and checklists

**User Role:** Member of project A only
**Steps:**
1. Note an issue ID in project B that has a checklist.
2. From project A's session, request that issue and its checklist endpoint directly.

**Expected Result:**
- Refused. No checklist content from project B is returned.
- Before filing any finding here, confirm project B is genuinely private and the user genuinely has no membership
  path to it — otherwise the result is expected, not a leak.

---

### TC-CHK-910: Permission change takes effect without re-login

**User Role:** Admin + affected member
**Steps:**
1. Remove edit-issues from the member's role while they have the issue page open.
2. Have them attempt a checklist edit without logging out.

**Expected Result:**
- The edit is rejected. Permissions are evaluated per request, not cached in the session.

---

### TC-CHK-911: Checklist History respects issue visibility

**User Role:** Non-member / read-only member
**Steps:**
1. Attempt to open the Checklist History tab for an issue the user cannot view.

**Expected Result:**
- Refused. History must not be a side channel that exposes checklist content the issue view itself hides.

---

### TC-CHK-912: Locked or archived project

**User Role:** Member
**Steps:**
1. Archive (or close) a project that has issues with checklists.
2. Attempt to view and to edit a checklist.

**Expected Result:**
- Matches Redmine's own archived/closed-project semantics: closed projects are read-only, archived projects are
  inaccessible. The checklist endpoints must honour this, not just the page.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
