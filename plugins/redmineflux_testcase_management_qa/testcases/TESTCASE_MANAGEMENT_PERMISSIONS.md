# Test Cases — Redmineflux Testcase Management — Roles & Permissions

> Source: `docs/TESTCASE_MANAGEMENT_REQUIREMENTS.md` (Permissions Matrix) and the vendor KB Roles & Permissions
> section. Covers all 16 plugin permissions across 6 groups.
>
> **Status: authored 2026-09-14, not yet executed.** No TC below carries live evidence.

## Plugin
- Name: Redmineflux Testcase Management
- Version: v7.0.0
- Redmine version: 6.1.3 (`localhost:3012`) / 7.0.0 (`localhost:3010`)
- Path: plugins/redmineflux_testcase_management_qa

## Methodology — three legs per permission

Per root `MEMORY.md` ("Permission TC Needs UI + URL Both Sides", "Verify Hidden UI Implies Blocked Access"), a
permission is only proven when **all three** legs are covered. A hidden menu link is *not* evidence the URL is
blocked.

| Leg | What it proves |
|---|---|
| **A — positive UI** | A role *with* the permission can reach and complete the action through real navigation. |
| **B — negative UI** | A role *without* it does not see the control. |
| **C — negative endpoint** | A role *without* it is refused when the URL/endpoint is requested **directly** (expect 403 / redirect, never a rendered page or a successful write). |

Leg C is mandatory. A finding of "UI hidden but URL works" is a security defect, not a cosmetic one.

**Precondition for every case:** a project with the TestCases module enabled; one user per role (Admin, Manager,
Developer, QA, Client, plus a logged-in non-member); the plugin's permissions configured per the matrix in
`docs/TESTCASE_MANAGEMENT_REQUIREMENTS.md`. Record the actual role→permission mapping found, since the KB does
not prescribe one.

---

## Test Suite Management

---

### TC-TCM-046: Create Test Suite — granted role can create

**User Role:** Admin, Manager, QA
**Steps:**
1. Log in as the role under test. Open the project → **TestCases** → **Test Suite** sidebar icon.
2. Click the **Add Test Suite** icon.
3. Enter a unique **Test Suite Name** and **Description**; click **Create**.

**Expected Result:**
- The suite is created and appears in the suite tree.
- No permission error at any point.

---

### TC-TCM-047: Create Test Suite — denied role sees no control

**User Role:** Client, non-member (and Developer if not granted)
**Steps:**
1. Log in as the denied role. Open the project → **TestCases** → **Test Suite** sidebar.
2. Inspect the sidebar and suite tree for an **Add Test Suite** control.

**Expected Result:**
- No **Add Test Suite** icon/entry is rendered.

---

### TC-TCM-048: Create Test Suite — denied role blocked at the endpoint

**User Role:** Client, non-member
**Steps:**
1. Log in as the denied role.
2. Request the suite-creation URL directly (`/test_suites/new?project_id=<id>`, and the POST target
   `/test_suites`), rather than through the UI.

**Expected Result:**
- The request is refused — 403 Forbidden or a redirect to login/project with an error.
- **No suite is created.** Confirm by re-checking the suite tree as an Admin afterwards.
- A rendered creation form or a successful write is a **failure** and is a security defect.

---

### TC-TCM-049: Edit Test Suite — granted vs denied (all three legs)

**User Role:** granted (Admin/Manager/QA) and denied (Client/non-member)
**Steps:**
1. As a granted role, open a suite's action menu, rename it, save.
2. As a denied role, confirm the edit control is absent.
3. As a denied role, request the edit URL directly (`/test_suites/<id>/edit`) and attempt the update.

**Expected Result:**
- Granted role: rename persists.
- Denied role: no control; direct URL refused; suite name unchanged when re-checked as Admin.

---

### TC-TCM-050: Delete Test Suite — granted vs denied (all three legs)

**User Role:** granted (Admin/Manager) and denied (Client/non-member/Developer)
**Steps:**
1. As a granted role, delete an empty suite via its action menu and confirm.
2. As a denied role, confirm the delete control is absent.
3. As a denied role, issue the delete request directly against `/test_suites/<id>`.

**Expected Result:**
- Granted role: suite is removed from the tree.
- Denied role: no control; direct request refused; **suite still exists** when re-checked as Admin.

---

### TC-TCM-051: Deleting a suite that contains test cases

**User Role:** Admin
**Steps:**
1. Create a suite and add at least two test cases to it.
2. Delete the suite and confirm.
3. Open the Testcase Summary and search for those cases.

**Expected Result:**
- The plugin either blocks the delete with a clear message, or deletes the suite while **leaving the test case
  issues intact** (they are Redmine issues and must not be silently destroyed).
- Record which of the two behaviours occurs — silent loss of issues would be a High-severity defect.

---

## Test Run Management

---

### TC-TCM-052: Create Run — granted role can create

**User Role:** Admin, Manager, QA
**Steps:**
1. Open **Runs & Results** → **Add Run**.
2. Complete Run Name, Note, Run State, Start/End Date, Environment, Assignee; select test cases; click **Create**.

**Expected Result:**
- Run is created and listed under the **Active** tab with the values entered.

---

### TC-TCM-053: Create Run — denied role, UI and endpoint

**User Role:** Client, non-member
**Steps:**
1. Confirm **Add Run** is not rendered on Runs & Results.
2. Request `/runs/new?project_id=<id>` directly, and attempt the POST to `/runs`.

**Expected Result:**
- Control absent; direct request refused; no run created.

---

### TC-TCM-054: Edit Run — granted vs denied (all three legs)

**User Role:** granted (Admin/Manager/QA) and denied (Client/non-member)
**Steps:**
1. Granted: open a run's action menu → edit, change the Note and End Date, save.
2. Denied: confirm the edit control is absent.
3. Denied: request `/runs/<id>/edit` directly and attempt the update.

**Expected Result:**
- Granted: changes persist. Denied: no control, request refused, run unchanged.

---

### TC-TCM-055: Close Run — granted role

**User Role:** Admin, Manager, QA
**Steps:**
1. Open **Runs & Results**, locate an Active run, click its **Action Button** → **Close Run**, confirm.
2. Check the **Closed** tab.

**Expected Result:**
- The run moves from **Active** to **Closed**.

---

### TC-TCM-056: Close Run — denied role, UI and endpoint

**User Role:** Developer, Client, non-member
**Steps:**
1. Confirm **Close Run** is absent from the run's action menu.
2. Issue the close request directly against the run's close endpoint.

**Expected Result:**
- Option absent; direct request refused; run remains in **Active** when re-checked as Admin.

---

### TC-TCM-057: Delete Run — granted vs denied (all three legs)

**User Role:** granted (Admin/Manager) and denied (Developer/Client/non-member)
**Steps:**
1. Granted: delete a run via its action menu and confirm.
2. Denied: confirm the delete control is absent.
3. Denied: issue the delete request directly against `/runs/<id>`.

**Expected Result:**
- Granted: run disappears from both tabs. Denied: refused; run still present as Admin.

---

### TC-TCM-058: Execution results survive run deletion appropriately

**User Role:** Admin
**Steps:**
1. Create a run, execute at least two cases with results and notes.
2. Delete the run.
3. Open one of those test cases and view its execution history.

**Expected Result:**
- Behaviour is consistent and documented — either the results are removed with the run, or retained as history.
- Record which. An orphaned/partial state (history referencing a missing run and erroring) is a defect.

---

## Test Execution

---

### TC-TCM-059: Execute Testcase — granted role can record a result

**User Role:** Admin, Manager, Developer, QA
**Steps:**
1. Open a run → select an **Environment** → click the **Result** field for a case.
2. Choose **Passed**, add a note, click **Save**.

**Expected Result:**
- The result is saved and the grid shows **Passed** for that case in that environment.

---

### TC-TCM-060: Execute Testcase — denied role, UI and endpoint

**User Role:** Client, non-member
**Steps:**
1. Confirm the **Result** field is not actionable (no Add Result modal opens).
2. Request `/issue_status_results/new?...` directly, and attempt the result-create POST.

**Expected Result:**
- No modal; direct request refused; no result row created.

---

### TC-TCM-061: Execute permission does not imply run management

**User Role:** Developer (Execute only)
**Steps:**
1. As a Developer with **Execute Testcase** but no run permissions, open a run.
2. Attempt to edit, close and delete the run — via UI, then via direct URLs.

**Expected Result:**
- Execution works; **Edit/Close/Delete Run are all refused** in both UI and endpoint.
- Confirms the permissions are independent rather than bundled.

---

## Reporting

---

### TC-TCM-062: View Report — granted role can view but not create

**User Role:** Developer (View Report only)
**Steps:**
1. Open **Reports** and open an existing report.
2. Look for **+ New report**, edit and delete controls.
3. Request `/projects/<id>/testcase_reports/new` directly.

**Expected Result:**
- The report renders. Create/edit/delete controls are absent, and the direct new-report URL is refused.

---

### TC-TCM-063: Create Report — granted vs denied (all three legs)

**User Role:** granted (Admin/Manager/QA) and denied (Client/non-member)
**Steps:**
1. Granted: create a report of any type and confirm it appears in the list.
2. Denied: confirm **+ New report** is absent.
3. Denied: request the new-report URL and attempt the POST directly.

**Expected Result:**
- Granted: report created. Denied: control absent, request refused, no report created.

---

### TC-TCM-064: Edit Report — granted vs denied (all three legs)

**User Role:** granted (Admin/Manager/QA) and denied (Client/non-member)
**Steps:**
1. Granted: edit a report's name via the pencil icon and save.
2. Denied: confirm the pencil icon is absent.
3. Denied: request `/projects/<id>/testcase_reports/<id>/edit` directly and attempt the update.

**Expected Result:**
- Granted: change persists. Denied: refused; report unchanged.

---

### TC-TCM-065: Delete Report — granted vs denied (all three legs)

**User Role:** granted (Admin/Manager) and denied (Developer/Client/non-member)
**Steps:**
1. Granted: delete a report via the bin icon and confirm.
2. Denied: confirm the bin icon is absent.
3. Denied: issue the delete request directly.

**Expected Result:**
- Granted: report removed. Denied: refused; report still listed as Admin.

---

### TC-TCM-066: Report content does not leak cross-project data

**User Role:** QA who is a member of Project A only
**Steps:**
1. As Admin, create runs and test cases in Project A and Project B.
2. As the Project-A-only QA, generate a Testcase Summary and a Defect Summary in Project A.
3. Inspect the generated report for any Project B run, case or defect.

**Expected Result:**
- The report contains **only** Project A data. Any Project B row is a data-exposure defect (High).

---

## To-Do Management

---

### TC-TCM-067: To-Do shows only own items without "View All To-Do's"

**User Role:** QA without the permission
**Steps:**
1. As Admin, assign test execution work to two different users.
2. Log in as one of them, open the **To-Do** sidebar area.

**Expected Result:**
- Only that user's own assigned items are listed; the other user's items are absent.

---

### TC-TCM-068: "View All To-Do's" widens visibility

**User Role:** Manager with the permission
**Steps:**
1. With the same data as TC-TCM-067, log in as a role holding **View All To-Do's** and open **To-Do**.

**Expected Result:**
- Items assigned to all users are listed.

---

### TC-TCM-069: To-Do endpoint respects the permission

**User Role:** QA without **View All To-Do's**
**Steps:**
1. Request `/testcase_todos?project_id=<id>` with any parameter that would widen scope to all users
   (e.g. a user/assignee filter naming another user).

**Expected Result:**
- The response still contains only the requesting user's items — the filter must not override the permission.

---

## Requirement Management

---

### TC-TCM-070: Add Requirement — granted vs denied (all three legs)

**User Role:** granted (Admin/Manager/QA) and denied (Client/non-member)
**Steps:**
1. Granted: open **Requirements** → create a requirement document; confirm it lists.
2. Denied: confirm the add control is absent.
3. Denied: request `/requirements/new?project_id=<id>` directly and attempt the POST.

**Expected Result:**
- Granted: created. Denied: control absent, request refused, nothing created.

---

### TC-TCM-071: Edit Requirement — granted vs denied (all three legs)

**User Role:** granted and denied
**Steps:**
1. Granted: edit a requirement's title/body and save.
2. Denied: confirm the edit control is absent.
3. Denied: request the edit URL directly and attempt the update.

**Expected Result:**
- Granted: change persists. Denied: refused; requirement unchanged.

---

### TC-TCM-072: Delete Requirement — granted vs denied (all three legs)

**User Role:** granted (Admin/Manager) and denied (Developer/Client/non-member)
**Steps:**
1. Granted: delete a requirement and confirm.
2. Denied: confirm the delete control is absent.
3. Denied: issue the delete request directly.

**Expected Result:**
- Granted: removed. Denied: refused; requirement still present as Admin.

---

### TC-TCM-073: Deleting a requirement linked to test cases

**User Role:** Admin
**Steps:**
1. Link at least two test cases to a requirement.
2. Delete the requirement.
3. Open those test cases and the RTM.

**Expected Result:**
- Either the delete is blocked with a clear message, or it succeeds and the test cases survive with their
  requirement link cleanly cleared.
- The RTM must not error or show a dangling reference. Record the actual behaviour.

---

## Negative / Cross-cutting Cases

---

### TC-TCM-074: Non-member cannot reach any plugin area of a private project

**User Role:** logged-in non-member
**Steps:**
1. With the project set **private** (see root `MEMORY.md` — a new project defaults to Public; uncheck it
   explicitly or this test falsely passes).
2. Request each plugin URL directly: `/test_suites?project_id=`, `/runs/new?project_id=`,
   `/projects/<id>/testcase_reports`, `/requirements?project_id=`, `/traceability_rtms?project_id=`,
   `/testcase_todos?project_id=`, `/projects/<id>/testcase_environment`.

**Expected Result:**
- **Every** URL is refused (403 or redirect). No project data is rendered in any response.
- Any URL returning content is a data-exposure defect (High).

---

### TC-TCM-075: Anonymous user cannot reach any plugin area

**User Role:** not logged in
**Steps:**
1. Log out. Request the same URL list as TC-TCM-074.

**Expected Result:**
- All refused or redirected to login; no project data rendered.

---

### TC-TCM-076: Permission revocation takes effect immediately

**User Role:** QA
**Steps:**
1. As QA with Create Run, confirm **Add Run** is available.
2. As Admin, revoke Create Run from the QA role.
3. As the still-logged-in QA user, reload Runs & Results, then attempt the create URL directly.

**Expected Result:**
- The control disappears on reload and the direct request is refused — no stale session grace period.

---

### TC-TCM-077: Module disabled removes all access

**User Role:** Admin, then QA
**Steps:**
1. Disable the TestCases module in Project Settings → Modules.
2. As QA, confirm the **TestCases** tab is gone, then request the plugin URLs directly.

**Expected Result:**
- Tab absent and every plugin URL refused while the module is disabled.

---

## Evidence Map

| TC range | Area | Bug reference |
|---|---|---|
| TC-TCM-046 – 806 | Test Suite Management | — |
| TC-TCM-052 – 813 | Test Run Management | — |
| TC-TCM-059 – 816 | Test Execution | — |
| TC-TCM-062 – 821 | Reporting | — |
| TC-TCM-067 – 824 | To-Do Management | — |
| TC-TCM-070 – 828 | Requirement Management | — |
| TC-TCM-074 – 832 | Negative / cross-cutting | — |

- Screenshot: capture only on failure, to `screenshots/<BUG-ID>/` (`CLAUDE.md` §6).
- Log: for leg C, capture the HTTP status and response of the direct request as evidence — a screenshot of a
  rendered page is not sufficient proof of refusal.
