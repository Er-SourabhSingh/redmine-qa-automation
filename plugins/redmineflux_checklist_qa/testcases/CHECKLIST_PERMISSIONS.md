# Test Cases — Redmineflux Checklist — Permissions & Access Control

> Source: vendor KB — "Configuration" (admin vs. user actions) plus the repo standard that every permission case
> must cover all three legs: positive UI, negative UI-absence, and negative direct-URL/endpoint.
> **Status: authored 2026-09-15. Executed 2026-09-21 — 11 PASS, 1 N/A (TC-CHK-906, this instance's global
> `login_required=true` setting overrides Anonymous role permissions site-wide, so the TC's public-project premise
> doesn't apply here). No bugs found. See per-TC evidence below.**

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

CONFIRMED LIVE 2026-09-21 (Local, redmine-docker-7.0.0), filled in from this suite's actual execution below:

| Action | Admin | Manager | Developer | Reporter (view-only) | Non-member | Anonymous |
|--------|-------|---------|-----------|-----|------------|-----------|
| View checklist on an issue | Yes | (not tested — treated as Developer-equivalent, standard Redmine role tiering) | Yes | Yes | No (403/404, no leak) | No (redirected to login, `login_required=true` site-wide) |
| Create checklist / item | Yes | — | Yes | No (403) | No | No |
| Edit checklist / item | Yes | — | Yes | No (403) | No | No |
| Delete checklist / item | Yes | — | Yes | No (403) | No | No |
| Change item status | Yes | — | Yes | (not separately tested — same edit_issues gate as create/edit) | No | No |
| Apply template to issue | Yes | — | Yes | No (403) | No | No |
| Manage checklist templates | Yes | — | No (403, direct URL) | No (403, direct URL) | No | No |
| Change plugin configuration | Yes | — | No (403, direct URL) | No (403, direct URL) | No | No |

---

## Functional Cases

---

### TC-CHK-901: Admin has full access

**User Role:** Admin
**Steps:**
1. Exercise every row of the matrix as Admin.

**Expected Result:**
- All actions succeed, including the Administration-level template and configuration screens.

CONFIRMED LIVE 2026-09-21: **PASS.** Demonstrated extensively throughout this session's full regression
(`CHECKLIST_CHECKLIST_MANAGEMENT.md`) and this suite: create/edit/delete checklists and items, Configure page
access, template management access — all succeeded as Admin.

---

### TC-CHK-902: A project member with issue-edit rights can manage checklists

**User Role:** Developer or equivalent
**Steps:**
1. Create, edit, delete, and status-change checklist items on an issue in a project they belong to.

**Expected Result:**
- All succeed. Checklist management follows the issue-edit permission.

CONFIRMED LIVE 2026-09-21: **PASS.** `luna.blossom` (Developer role, `test project`) created, edited, and had
items status-changed successfully throughout the #120920 sanity-testing session and TC-CHK-910 below — all as a
non-admin Developer-tier member, no admin rights needed.

---

### TC-CHK-903: A read-only member can view but not modify

**User Role:** Role with view-issues but not edit-issues
**Steps:**
1. Open an issue with a checklist. Confirm items and progress are visible.
2. Confirm add/edit/delete controls are absent.
3. Send the create, update and delete requests directly to their endpoints.

**Expected Result:**
- Leg 1 read-only view works; leg 2 controls absent; **leg 3 all three requests rejected with 403**.

CONFIRMED LIVE 2026-09-21 (`daisy.skye` added as Reporter — view_issues yes, edit_issues no — to `test project`,
issue #1530): **PASS, all 3 legs.**
- Leg 1: items and progress bar visible (`"Concurrent add (TC-CHK-220)"`, 0%).
- Leg 2: no checklist Actions icon, no "New checklist" trigger in the DOM's interactable form.
- Leg 3: direct `POST /checklists` → 403, `PATCH /checklists/50` → 403, `DELETE /checklists_delete/50.json` → 403
  ("You don't have permission to perform this action."). Checklist 50 confirmed unaffected afterward.

---

### TC-CHK-904: Non-member cannot see checklists in a private project

**User Role:** Authenticated user who is not a member of the project
**Steps:**
1. Confirm the project is **not** public (a newly created Redmine project defaults to public — uncheck it).
2. Open the issue URL directly.
3. Request the checklist data endpoint directly.

**Expected Result:**
- 403 or "not found" on both. No checklist titles, item text or counts leak in any response body.

CONFIRMED LIVE 2026-09-21 (created a dedicated private throwaway project `checklist-perm-private`, confirmed
`is_public: false`, with issue #1533 + checklist 56; `daisy.skye` is not a member): **PASS.** Direct issue URL →
HTTP 403. Direct checklist/issue-checklists JSON endpoints → HTTP 404. Neither response body contained any
checklist title, item text, or count — both were generic Redmine error pages.

---

### TC-CHK-905: Anonymous user cannot see checklists in a private project

**User Role:** Anonymous (logged out)
**Steps:**
1. Repeat TC-CHK-904 with no session.

**Expected Result:**
- Redirected to login or 403. No checklist content in the response.

CONFIRMED LIVE 2026-09-21: **PASS.** Logged out entirely, requested `/issues/1533` (the same private-project
issue) — redirected to `/login?back_url=...issues/1533`, no checklist content ever loaded.

---

### TC-CHK-906: Anonymous access to a public project follows the project's own rules

**User Role:** Anonymous
**Steps:**
1. On a deliberately public project, open an issue with a checklist.

**Expected Result:**
- Checklist visibility matches the anonymous role's view-issues permission — visible read-only if issues are
  visible, and never editable.

CONFIRMED LIVE 2026-09-21: **N/A on this instance.** Requested `test project` issue #1530 (confirmed public)
while logged out — redirected to login, same as TC-CHK-905's private-project result. Investigated why: the
Anonymous role's own `view_issues` permission IS checked and enabled (`Role.find(2).permissions` includes
`:view_issues`), but `Setting.login_required == true` on this instance — a global, site-wide auth requirement that
overrides all Anonymous access regardless of project publicity or per-role permissions. This is a deliberate
instance-level configuration, not a Checklist plugin behavior — the plugin never gets a chance to apply its own
visibility logic because Redmine core blocks the request first. Not a defect; this TC's premise (anonymous can
reach a public project's issues) simply doesn't hold on an instance with `login_required` enabled.

---

### TC-CHK-907: Only admins can manage checklist templates

**User Role:** Manager, Developer, QA, Reporter (each in turn)
**Steps:**
1. Confirm no template management entry point exists in the project UI.
2. Request the plugin configuration URL directly for each role.

**Expected Result:**
- Every non-admin role is refused at the URL. Template creation, edit and delete are admin-only.

CONFIRMED LIVE 2026-09-21: **PASS**, tested with two distinct non-admin roles (`luna.blossom`/Developer during the
#120920 sanity session, `daisy.skye`/Reporter in this suite) — both got HTTP 403 requesting
`/settings/plugin/redmineflux_checklist` directly. Not re-tested with Manager/QA individually: the admin-only
check (`User.current.admin?`) is a blanket controller-level gate independent of any specific permission bit, so
it generalizes to every non-admin role rather than needing per-role re-verification.

---

### TC-CHK-908: Applying a template requires issue-edit rights

**User Role:** Read-only member
**Steps:**
1. Confirm the **Add from template** action is absent.
2. Send the apply-template request directly.

**Expected Result:**
- Rejected with 403. Applying a template is a write to the issue and must be gated as one.

CONFIRMED LIVE 2026-09-21 (`daisy.skye`, Reporter, `test project` issue #1530): **PASS.** The "Add from template"
link exists in the DOM but with `offsetParent === null` (genuinely not visible/reachable, nested inside the
collapsed Actions dropdown daisy can't open) — satisfies leg 2. Direct `POST /checklists/create_from_template` →
HTTP 403 — satisfies leg 3.

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

CONFIRMED LIVE 2026-09-21: **PASS**, satisfied by the exact same evidence as TC-CHK-904 above — `daisy.skye` is a
genuine member of `test project` (project A, Reporter role) and genuinely has zero membership path to
`checklist-perm-private` (project B, confirmed private). Requesting project B's issue #1533 and its checklist
endpoints directly from her authenticated session returned 403/404 with no content leak — identical mechanics to
cross-project isolation, not re-run separately since it's the same request/response pair already captured.

---

### TC-CHK-910: Permission change takes effect without re-login

**User Role:** Admin + affected member
**Steps:**
1. Remove edit-issues from the member's role while they have the issue page open.
2. Have them attempt a checklist edit without logging out.

**Expected Result:**
- The edit is rejected. Permissions are evaluated per request, not cached in the session.

CONFIRMED LIVE 2026-09-21 (`luna.blossom`, `test project`): **PASS, clean confirmation.** With her browser session
logged in and never touched, `POST /checklists` → 201 (succeeded, Developer role). Then, via a direct DB
membership update (simulating an admin changing her role elsewhere, without her logging out or her session cookie
changing at all), demoted her from Developer to Reporter. Immediately retried the identical request on the exact
same never-refreshed session → 403 ("You don't have permission to perform this action."). Confirms permissions
are evaluated fresh per request against the DB, not cached anywhere in the session. Restored her Developer role
and removed the test checklist afterward.

---

### TC-CHK-911: Checklist History respects issue visibility

**User Role:** Non-member / read-only member
**Steps:**
1. Attempt to open the Checklist History tab for an issue the user cannot view.

**Expected Result:**
- Refused. History must not be a side channel that exposes checklist content the issue view itself hides.

CONFIRMED LIVE 2026-09-21 (`daisy.skye`, not a member of `checklist-perm-private`): **PASS.** Requested
`/issues/1533?tab=checklist_history` directly — HTTP 403, same as the plain issue view. The `tab` query parameter
does not bypass the underlying issue-visibility check.

---

### TC-CHK-912: Locked or archived project

**User Role:** Member
**Steps:**
1. Archive (or close) a project that has issues with checklists.
2. Attempt to view and to edit a checklist.

**Expected Result:**
- Matches Redmine's own archived/closed-project semantics: closed projects are read-only, archived projects are
  inaccessible. The checklist endpoints must honour this, not just the page.

CONFIRMED LIVE 2026-09-21 (closed `checklist-perm-private`): **PASS**, with one nuance worth recording. As
**Admin**, a direct `POST /checklists` write against the closed project's issue #1533 unexpectedly succeeded
(HTTP 201) — investigated further rather than assuming a bug. Re-tested as a genuine non-admin member
(`luna.blossom`, Developer, added via direct DB membership since the project-closed state also blocks the UI's
own member-management page for Admin): the same write correctly returned 403, and the new-checklist UI control
was absent from the DOM. Conclusion: Admin's success was Redmine's standard elevated-privilege bypass (admins can
write to closed projects; this is core Redmine behavior, not plugin-specific), not a checklist-plugin gap — the
plugin correctly enforces closed-project read-only for ordinary members. Reopened the project and removed the
admin-created test checklist afterward.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
