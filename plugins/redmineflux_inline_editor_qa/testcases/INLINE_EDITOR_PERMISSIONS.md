# Test Cases — Redmineflux Inline Editor — Permissions & Access Control

> Source: the vendor KB publishes no permissions matrix; it states only that inline availability "depends on the
> Redmine configuration and the specific fields exposed by the plugin". This suite establishes the matrix
> empirically and verifies that the inline path enforces exactly the same rules as the standard Edit form.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Inline Editor Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_inline_editor_qa

## Methodology — mandatory for every case in this suite

A missing pencil icon is **not** evidence that a write is blocked. This plugin's whole risk profile is that it adds
a second, JavaScript-driven write path alongside the standard form. Each case is checked three ways:

1. **Positive UI** — the permitted role edits inline through real navigation and it works.
2. **Negative UI** — the denied role sees no inline affordance.
3. **Negative endpoint** — the denied role is refused when the inline update request is sent **directly**.

Leg 3 is the one that matters here. The governing question for every case below is: *does the inline endpoint
enforce the same rule the standard form enforces?* Any place where it does not is the defect.

---

## Permissions matrix to establish

| Action | Admin | Manager | Developer | QA | Reporter | Non-member | Anonymous |
|--------|-------|---------|-----------|-----|----------|------------|-----------|
| See the inline edit affordance | | | | | | | |
| Inline-edit Status | | | | | | | |
| Inline-edit Priority | | | | | | | |
| Inline-edit Assignee | | | | | | | |
| Inline-edit Subject | | | | | | | |
| Inline-edit Description | | | | | | | |
| Inline-edit custom fields | | | | | | | |
| Inline-edit a workflow-read-only field | | | | | | | |

Fill in from observed behaviour, not from assumption. Record separately, per role, whether the **UI** and the
**endpoint** agree — a row where they disagree is a bug, not a matrix entry.

---

## Functional Cases

---

### TC-INE-901: Admin can inline-edit every exposed field

**User Role:** Admin
**Steps:**
1. Exercise every row of the matrix as Admin, on the issue list and the detail page.

**Expected Result:**
- All succeed and all are journaled.

---

### TC-INE-902: Inline editing requires the edit-issues permission

**User Role:** Developer (has it), then a role without it
**Steps:**
1. As Developer, inline-edit a field — expect success.
2. As the role without edit-issues, confirm no affordance appears.
3. As that role, send the inline update request directly.

**Expected Result:**
- Leg 3 refused with 403. The inline path grants nothing beyond the standard edit permission.

---

### TC-INE-903: Workflow field permissions are enforced at the endpoint

**User Role:** Role with a field marked read-only in the workflow
**Steps:**
1. Confirm no affordance on that field.
2. Send an inline update for it directly.

**Expected Result:**
- Refused. **This is the single highest-value case in the suite**: an inline editor that checks field permissions
  only when rendering the icon, and not when handling the write, lets any member with basic edit rights change
  fields the workflow reserves for managers. That would be High severity.

---

### TC-INE-904: Workflow status transitions are enforced at the endpoint

**User Role:** Role with a restricted status workflow
**Steps:**
1. Note which transitions the inline dropdown offers.
2. Send a forbidden transition directly to the inline endpoint.

**Expected Result:**
- Refused with the same error the standard form produces. A dropdown filtered client-side but unenforced
  server-side is a High-severity defect.

---

### TC-INE-905: Read-only member sees no affordance and is refused

**User Role:** Role with view-issues only
**Steps:**
1. Hover rows in the list and fields on the detail page.
2. Send inline update requests for a simple field and for the description.

**Expected Result:**
- No affordance anywhere; both direct requests refused with 403.

---

### TC-INE-906: Non-member cannot inline-edit in a private project

**User Role:** Authenticated non-member
**Preconditions:** **Confirm the project is genuinely private** — a newly created Redmine project has "Public"
checked by default; uncheck it explicitly or this case falsely passes.
**Steps:**
1. Request the issue directly, then send an inline update request for it.

**Expected Result:**
- 403 or not-found on both. No field values or issue metadata leak in any response body, including error bodies.

---

### TC-INE-907: Anonymous user cannot inline-edit

**User Role:** Anonymous (logged out)
**Steps:**
1. On a public project that allows anonymous viewing, hover rows.
2. Send an inline update request with no session.

**Expected Result:**
- No affordance and the request refused. An unauthenticated write path would be Critical.

---

### TC-INE-908: Cross-project write via the inline endpoint

**User Role:** Member of project A only
**Preconditions:** Confirm the target issue really is in a private project B with no membership path for this user.
**Steps:**
1. Send an inline update request naming an issue ID in project B.

**Expected Result:**
- Refused. The endpoint must authorise the **target issue**, not merely the presence of a valid session.
- A successful write here is a Critical cross-project defect.

---

### TC-INE-909: Private notes and private content stay private

**User Role:** Member without private-note rights
**Steps:**
1. Confirm no inline affordance on private content.
2. Request the inline edit form/data for it directly.

**Expected Result:**
- Refused, and the response contains none of the private content — the edit-form fetch is as much a read as the
  page itself, and is a common place for content to leak.

---

### TC-INE-910: Permission revocation takes effect without re-login

**User Role:** Admin + affected member
**Steps:**
1. Remove edit-issues from the member's role while they have an inline editor open.
2. Have them confirm the edit without logging out.

**Expected Result:**
- Rejected. Permissions are evaluated per request, not cached in the page's JavaScript state.

---

### TC-INE-911: Closed and archived projects

**User Role:** Member
**Steps:**
1. Attempt an inline edit in a closed project, then in an archived one, at both the UI and the endpoint.

**Expected Result:**
- Refused at both, matching Redmine's own semantics for closed (read-only) and archived (inaccessible) projects.

---

### TC-INE-912: Inline edit respects issue visibility rules

**User Role:** Role whose issue visibility is limited to "issues created by the user"
**Steps:**
1. Confirm the affordance appears only on that user's own issues.
2. Send an inline update for an issue created by someone else in the same project.

**Expected Result:**
- Refused. Visibility-scoped roles are the subtlest permission tier and the most likely to be missed by a plugin
  that only checks the project-level edit permission.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
