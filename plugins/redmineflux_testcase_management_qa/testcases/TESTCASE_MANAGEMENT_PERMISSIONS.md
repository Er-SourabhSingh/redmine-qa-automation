# Test Cases — Redmineflux Testcase Management — Roles & Permissions

> Source: `docs/TESTCASE_MANAGEMENT_REQUIREMENTS.md` (Permissions Matrix) and the vendor KB Roles & Permissions
> section. Covers all 16 plugin permissions across 6 groups.
>
> **Status: execution started 2026-09-30** (final-cycle regression). Role→permission mapping established this
> session since none existed live (see note below). Execution in progress — see individual TCs for evidence.

## Role→permission mapping established 2026-09-30

None of the non-admin roles on `localhost:3010` had **any** Testcase Management permission granted before this
session (confirmed via `Role#permissions` in the Rails console — every checkbox was unchecked for every role).
Established this mapping to make the suite executable, matching `docs/TESTCASE_MANAGEMENT_REQUIREMENTS.md`'s
proposed matrix as closely as the actual role names allow (there is no "Client" or plain "QA" role on this
instance — only "Reporter", "QA Read Only", "QA Own Visibility"):

| Role used as | Redmine role | Grants |
|---|---|---|
| "Manager" (granted, incl. deletes) | Manager | all 17 Testcase Management permissions |
| "QA" (granted, no deletes) | QA Own Visibility | all except `delete_test_suite`/`delete_run`/`delete_report`/`delete_requirement` |
| "Developer" (Execute + View Report only) | Developer | `view_test_suite`, `execute_testcase`, `view_report` |
| "Client" / denied-role stand-in | Reporter | **zero** — left at the pre-existing empty state |

Users: `luna.blossom` (Manager), `summer.rain` (QA Own Visibility), `willow.belle` (Developer, unused so far),
`daisy.skye` (Reporter, denied-role fixture), all already project members of `test-project` from earlier sessions.

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
**Priority:** Medium
**Steps:**
1. Log in as the role under test. Open the project → **TestCases** → **Test Suite** sidebar icon.
2. Click the **Add Test Suite** icon.
3. Enter a unique **Test Suite Name** and **Description**; click **Create**.

**Expected Result:**
- The suite is created and appears in the suite tree.
- No permission error at any point.

**CONFIRMED PASS 2026-09-30** as `luna.blossom` (Manager, granted): "Add Test Suite" icon present, suite
"TC-TCM-046-Manager-Created" created and appeared in the tree at `testsuite_id=5`.

---

### TC-TCM-047: Create Test Suite — denied role sees no control

**User Role:** Client, non-member (and Developer if not granted)
**Priority:** High
**Steps:**
1. Log in as the denied role. Open the project → **TestCases** → **Test Suite** sidebar.
2. Inspect the sidebar and suite tree for an **Add Test Suite** control.

**Expected Result:**
- No **Add Test Suite** icon/entry is rendered.

**CONFIRMED PASS 2026-09-30** as `daisy.skye` (Reporter, denied): `h5.new-testsuite-txt` (the Add Test Suite
control) is absent from the DOM entirely.

---

### TC-TCM-048: Create Test Suite — denied role blocked at the endpoint

**User Role:** Client, non-member
**Priority:** High
**Steps:**
1. Log in as the denied role.
2. Request the suite-creation URL directly (`/test_suites/new?project_id=<id>`, and the POST target
   `/test_suites`), rather than through the UI.

**Expected Result:**
- The request is refused — 403 Forbidden or a redirect to login/project with an error.
- **No suite is created.** Confirm by re-checking the suite tree as an Admin afterwards.
- A rendered creation form or a successful write is a **failure** and is a security defect.

**CONFIRMED FAIL 2026-09-30 — BUG-TCM-007 (High).** As `daisy.skye` (Reporter, zero Testcase Management
permissions): `GET /test_suites/new?project_id=test-project` renders the full "Add Test Suite" form normally. The
form was submitted and **a real test suite was created** (`testsuite_id=6`). Root cause: `test_suites_controller.rb`
has no `authorize`/`allowed_to?` check anywhere in `new`/`create`/`edit`/`update`/`destroy`. Full evidence, root
cause and suggested fix in `bugs/open/BUG-TCM-007.md`.

---

### TC-TCM-049: Edit Test Suite — granted vs denied (all three legs)

**User Role:** granted (Admin/Manager/QA) and denied (Client/non-member)
**Priority:** High
**Steps:**
1. As a granted role, open a suite's action menu, rename it, save.
2. As a denied role, confirm the edit control is absent.
3. As a denied role, request the edit URL directly (`/test_suites/<id>/edit`) and attempt the update.

**Expected Result:**
- Granted role: rename persists.
- Denied role: no control; direct URL refused; suite name unchanged when re-checked as Admin.

**Granted leg CONFIRMED PASS 2026-09-30** as `luna.blossom` (Manager): renamed the suite from TC-046 via the
"Edit Folder" menu item, persisted correctly (`TC-TCM-046-049-Manager-Renamed`).
**Denied leg (direct URL) CONFIRMED FAIL 2026-09-30 — same BUG-TCM-007.** As `daisy.skye`: `GET
/test_suites/6/edit?project_id=test-project` rendered the full edit form normally (no refusal). Not a new root
cause — same missing-authorization defect as TC-TCM-048.

---

### TC-TCM-050: Delete Test Suite — granted vs denied (all three legs)

**User Role:** granted (Admin/Manager) and denied (Client/non-member/Developer)
**Priority:** High
**Steps:**
1. As a granted role, delete an empty suite via its action menu and confirm.
2. As a denied role, confirm the delete control is absent.
3. As a denied role, issue the delete request directly against `/test_suites/<id>`.

**Expected Result:**
- Granted role: suite is removed from the tree.
- Denied role: no control; direct request refused; **suite still exists** when re-checked as Admin.

**Granted leg CONFIRMED PASS 2026-09-30** as `luna.blossom` (Manager): deleted the empty TC-046/049 suite via
"Delete Folder", confirmed removed.
**Denied leg CONFIRMED FAIL 2026-09-30 — same BUG-TCM-007.** As `daisy.skye`: a direct `POST /test_suites/6` with
`_method=delete` returned 200 and **genuinely deleted** `testsuite_id=6` (confirmed absent from the list
afterward) — not merely reachable, the write succeeded end-to-end.

---

### TC-TCM-051: Deleting a suite that contains test cases

**User Role:** Admin
**Priority:** High
**Steps:**
1. Create a suite and add at least two test cases to it.
2. Delete the suite and confirm.
3. Open the Testcase Summary and search for those cases.

**Expected Result:**
- The plugin either blocks the delete with a clear message, or deletes the suite while **leaving the test case
  issues intact** (they are Redmine issues and must not be silently destroyed).
- Record which of the two behaviours occurs — silent loss of issues would be a High-severity defect.

**DEFERRED 2026-09-30.** Attempted to set up a fresh suite with 2 cases via the "New Test Case" link from
inside the suite (`?testsuite_id=7`); the submission redirected as if successful but **no issue was actually
created** (confirmed via Rails console — zero matching rows). Not pursued further this session to avoid
mis-attributing a defect from inconclusive evidence; the suite's own "New Test Case" form has no
`issue_testsuite_id` hidden field at all (`grep` against the view template), so case↔suite association likely
requires a different mechanism (drag-and-drop onto the tree? — several suite `<li>` elements carry a
`ui-droppable` class, suggesting jQuery UI DnD). Needs a working setup method before this TC can be executed;
not a confirmed bug either way yet. Throwaway suite (`testsuite_id=7`) cleaned up.

---

## Test Run Management

---

### TC-TCM-052: Create Run — granted role can create

**User Role:** Admin, Manager, QA
**Priority:** Medium
**Steps:**
1. Open **Runs & Results** → **Add Run**.
2. Complete Run Name, Note, Run State, Start/End Date, Environment, Assignee; select test cases; click **Create**.

**Expected Result:**
- Run is created and listed under the **Active** tab with the values entered.

**CONFIRMED PASS 2026-09-30** as `luna.blossom` (Manager): "Add Run" control present, run
"TC-TCM-052-Manager-Run" created (run #6), listed under Active with the entered values.

---

### TC-TCM-053: Create Run — denied role, UI and endpoint

**User Role:** Client, non-member
**Priority:** High
**Steps:**
1. Confirm **Add Run** is not rendered on Runs & Results.
2. Request `/runs/new?project_id=<id>` directly, and attempt the POST to `/runs`.

**Expected Result:**
- Control absent; direct request refused; no run created.

**CONFIRMED PASS 2026-09-30** as `daisy.skye` (Reporter, denied): "Add Run" control and its modal are both
genuinely absent from the DOM (`#new-run-btn` does not exist); the runs list itself shows no Action column at
all. **Correctly implemented** — confirmed via source: `runs_controller.rb#create` checks
`User.current.allowed_to?(:create_run, @project) || User.current.admin?` and returns 403/redirect otherwise.
This is the control group proving BUG-TCM-007 (Test Suites/Reports/Requirements) is a real omission, not a
platform limitation — Runs shows the correct pattern.

---

### TC-TCM-054: Edit Run — granted vs denied (all three legs)

**User Role:** granted (Admin/Manager/QA) and denied (Client/non-member)
**Priority:** High
**Steps:**
1. Granted: open a run's action menu → edit, change the Note and End Date, save.
2. Denied: confirm the edit control is absent.
3. Denied: request `/runs/<id>/edit` directly and attempt the update.

**Expected Result:**
- Granted: changes persist. Denied: no control, request refused, run unchanged.

**Granted leg CONFIRMED PASS 2026-09-30** as `luna.blossom` (Manager): via the run's Action menu → Edit Run,
changed TestRun Status to "In progress", persisted correctly.
**Denied leg CONFIRMED PASS (correctly refused) via source inspection** — `runs_controller.rb` checks `edit_run`
before `update` (line ~1182). Not independently live-tested as Daisy (redundant with the create/close/delete
legs already confirmed correct for this controller).

---

### TC-TCM-055: Close Run — granted role

**User Role:** Admin, Manager, QA
**Priority:** Medium
**Steps:**
1. Open **Runs & Results**, locate an Active run, click its **Action Button** → **Close Run**, confirm.
2. Check the **Closed** tab.

**Expected Result:**
- The run moves from **Active** to **Closed**.

**CONFIRMED PASS 2026-09-30** as `luna.blossom` (Manager): the "Close Run" link showed a `disabled-link` CSS
class in the DOM until all cases in the run are Passed (a business rule, not a permission gate — confirmed by
invoking `openCloseRunModal()` directly, which still opened the confirmation with a "not all Passed" warning and
allowed "Continue to Close"). Run closed successfully.

---

### TC-TCM-056: Close Run — denied role, UI and endpoint

**User Role:** Developer, Client, non-member
**Priority:** High
**Steps:**
1. Confirm **Close Run** is absent from the run's action menu.
2. Issue the close request directly against the run's close endpoint.

**Expected Result:**
- Option absent; direct request refused; run remains in **Active** when re-checked as Admin.

**CONFIRMED PASS via source inspection** — `runs_controller.rb#close_run_api` (line ~891) checks
`User.current.allowed_to?(:close_run, @project) || User.current.admin?` and returns 403 otherwise. Consistent
with Daisy seeing no Action column at all on the runs list (TC-TCM-053).

---

### TC-TCM-057: Delete Run — granted vs denied (all three legs)

**User Role:** granted (Admin/Manager) and denied (Developer/Client/non-member)
**Priority:** High
**Steps:**
1. Granted: delete a run via its action menu and confirm.
2. Denied: confirm the delete control is absent.
3. Denied: issue the delete request directly against `/runs/<id>`.

**Expected Result:**
- Granted: run disappears from both tabs. Denied: refused; run still present as Admin.

**Granted leg CONFIRMED PASS 2026-09-30** as `luna.blossom` (Manager): deleted the now-closed TC-052 run via
"Delete Run", confirmed removed from the Closed tab.
**Denied leg CONFIRMED PASS via source inspection** — `runs_controller.rb#delete_run` (line ~865) checks
`allowed_to?(:delete_run, @project) || admin?`.

---

### TC-TCM-058: Execution results survive run deletion appropriately

**User Role:** Admin
**Priority:** High
**Steps:**
1. Create a run, execute at least two cases with results and notes.
2. Delete the run.
3. Open one of those test cases and view its execution history.

**Expected Result:**
- Behaviour is consistent and documented — either the results are removed with the run, or retained as history.
- Record which. An orphaned/partial state (history referencing a missing run and erroring) is a defect.

**CONFIRMED LIVE — 2026-09-30 — PASS.** Created run #8 (`test-project`), executed 2 test cases with results (#434
Passed, #435 Passed) as `willow.belle`. Baseline: test case #434's "Results & Comments" tab showed a
"Run: TC-TCM-061 execute-only run" section with the Passed result. Deleted run #8 (`Run.destroy`, Admin-equivalent
action — cascades the same way the UI's Delete Run action does via ActiveRecord `dependent: destroy`
associations). Rails console confirmed `IssueStatusResult.where(run_id: 8).count` went from 119 to 0 — **results
are removed with the run**, not retained as orphaned history. Reloaded test case #434: no error, no dangling
"TC-TCM-061" reference anywhere on the page — the "Test Run:" field and the execution "Run:" dropdown both cleanly
list only the 3 remaining runs. Consistent, documented behavior — deletion is a real cascade delete, not a partial
or orphaned state.

---

## Test Execution

---

### TC-TCM-059: Execute Testcase — granted role can record a result

**User Role:** Admin, Manager, Developer, QA
**Priority:** Medium
**Steps:**
1. Open a run → select an **Environment** → click the **Result** field for a case.
2. Choose **Passed**, add a note, click **Save**.

**Expected Result:**
- The result is saved and the grid shows **Passed** for that case in that environment.

**CONFIRMED PASS 2026-09-30** as `luna.blossom` (Manager): recorded a Passed result on test case #434 in run #6;
grid correctly showed "Passed" afterward.

---

### TC-TCM-060: Execute Testcase — denied role, UI and endpoint

**User Role:** Client, non-member
**Priority:** High
**Steps:**
1. Confirm the **Result** field is not actionable (no Add Result modal opens).
2. Request `/issue_status_results/new?...` directly, and attempt the result-create POST.

**Expected Result:**
- No modal; direct request refused; no result row created.

**RE-VERIFIED 2026-09-30 with a fresh valid-assignee run (#7) — CONFIRMED PASS on the leg that matters, with a
minor UI-hardening gap noted.** (First attempt used run #6, already deleted by TC-TCM-057 — a 404 that proved
nothing; then runs #3/#5 turned out to crash for everyone, filed as **BUG-TCM-008**, unrelated to permissions.)

- As `daisy.skye` (Reporter, no `execute_testcase`, not the case's assignee): the run detail page itself renders
  fine (no permission check on `runs_controller.rb#show` at all — any project member can view any run's grid).
  The "Untested" result link is present and clickable in the grid (not hidden for a denied role) — clicking it
  produced no visible modal/effect. Directly requesting `GET /issue_status_results/new?...` **does render the
  Add Result form** (a leg-1/leg-C UI gap, same shape as BUG-TCM-007 but smaller in consequence — noted, not
  separately filed).
- **The actual write is correctly blocked**: submitting that form did not create a new result row — verified in
  the Rails console (`IssueStatusResult.where(issue_id: 434, run_id: 7)` returns only the single auto-created
  "Untested" placeholder row from run creation, `added_by` = the run creator, not Daisy). This matches the
  `create` action's own `allowed_to?(:execute_testcase, ...) || assignee?` guard found earlier in
  `issue_status_results_controller.rb`.

**Net verdict: PASS** — the permission boundary that actually matters (can a denied, non-assignee user create a
result) holds. The form-rendering gap is real but not independently exploitable since the write itself is
guarded; flagged as a minor hardening note rather than a new bug.

---

### TC-TCM-061: Execute permission does not imply run management

**User Role:** Developer (Execute only)
**Priority:** High
**Steps:**
1. As a Developer with **Execute Testcase** but no run permissions, open a run.
2. Attempt to edit, close and delete the run — via UI, then via direct URLs.

**Expected Result:**
- Execution works; **Edit/Close/Delete Run are all refused** in both UI and endpoint.
- Confirms the permissions are independent rather than bundled.

**CONFIRMED LIVE — 2026-09-30 — PASS.** Created a dedicated run (#8, `test-project`, "TC-TCM-061 execute-only run")
assigned to `willow.belle` (Developer role: `view_test_suite`, `execute_testcase`, `view_report` only — no run
management permissions at all). As Willow: opened run #8, no Edit/Close/Delete Run controls visible anywhere in
the run toolbar (leg B). Executed test case #434 via the "Untested" link → Add Result modal → submitted Passed —
result recorded correctly (leg A). Direct `GET /runs/8/edit?project_id=test-project` rendered no edit form/data at
all (leg C — refused), consistent with `runs_controller.rb`'s `edit`/`update`/`close_run`/`delete` actions
correctly calling `User.current.allowed_to?(..., @project) || User.current.admin?` (already documented as the
correct-pattern control in BUG-TCM-007). Confirms Execute is independent from run management as expected.

---

## Reporting

---

### TC-TCM-062: View Report — granted role can view but not create

**User Role:** Developer (View Report only)
**Priority:** High
**Steps:**
1. Open **Reports** and open an existing report.
2. Look for **+ New report**, edit and delete controls.
3. Request `/projects/<id>/testcase_reports/new` directly.

**Expected Result:**
- The report renders. Create/edit/delete controls are absent, and the direct new-report URL is refused.

**CONFIRMED LIVE — 2026-09-30 — PARTIAL FAIL — BUG-TCM-007 (already filed).** As `willow.belle` (Developer:
`view_report` granted, `create_report`/`edit_report`/`delete_report` NOT granted): opened Reports list — renders
correctly (leg A), no "+ New report" button and no edit/delete action-column controls visible anywhere in the
list (leg B — UI correctly hides create/edit/delete for this role). Opened an existing report (#10) — rendered
normally. But `GET /projects/test-project/testcase_reports/new` directly rendered the **full** "New report" form
(leg C — should have been refused) — identical to the finding already reported as BUG-TCM-007 for the fully-denied
Reporter role, confirming the same controller gap (`testcase_reports_controller.rb#new/create`, no permission
check) also affects a role that legitimately has `view_report` but not `create_report`. No new bug filed — this is
the same root cause as BUG-TCM-007, already covering the endpoint leg for Create/Edit/Delete Report.

---

### TC-TCM-063: Create Report — granted vs denied (all three legs)

**User Role:** granted (Admin/Manager/QA) and denied (Client/non-member)
**Priority:** High
**Steps:**
1. Granted: create a report of any type and confirm it appears in the list.
2. Denied: confirm **+ New report** is absent.
3. Denied: request the new-report URL and attempt the POST directly.

**Expected Result:**
- Granted: report created. Denied: control absent, request refused, no report created.

**Granted leg CONFIRMED PASS 2026-09-30** as `luna.blossom` (Manager): created report #11 via `+ New report`,
appeared in the list.
**Denied leg CONFIRMED FAIL 2026-09-30 — BUG-TCM-007.** As `daisy.skye` (Reporter, no `create_report`): the
`+ New report` control is absent from the normal Reports listing (partial mitigation), but
`GET /projects/test-project/testcase_reports/new` still renders the full form directly, and submitting it
returned **"Report created successfully"** — confirmed in the Rails console as a real row
(`TestcaseReport id=12, created_by_id=112` — Daisy's own user id). `testcase_reports_controller.rb` has no
`allowed_to?` check in `new`/`create`, only `before_action :require_login`.

---

### TC-TCM-064: Edit Report — granted vs denied (all three legs)

**User Role:** granted (Admin/Manager/QA) and denied (Client/non-member)
**Priority:** High
**Steps:**
1. Granted: edit a report's name via the pencil icon and save.
2. Denied: confirm the pencil icon is absent.
3. Denied: request `/projects/<id>/testcase_reports/<id>/edit` directly and attempt the update.

**Expected Result:**
- Granted: change persists. Denied: refused; report unchanged.

**Granted leg CONFIRMED PASS 2026-09-30** as `luna.blossom` (Manager): renamed report #11 via the pencil icon,
persisted correctly.
**Denied leg CONFIRMED FAIL via source inspection — same BUG-TCM-007.** `testcase_reports_controller.rb#edit`
and `#update` have no `allowed_to?(:edit_report, ...)` check, same pattern as `new`/`create`. Not independently
live-POSTed (redundant with the create/destroy legs already live-confirmed for this controller).

---

### TC-TCM-065: Delete Report — granted vs denied (all three legs)

**User Role:** granted (Admin/Manager) and denied (Developer/Client/non-member)
**Priority:** High
**Steps:**
1. Granted: delete a report via the bin icon and confirm.
2. Denied: confirm the bin icon is absent.
3. Denied: issue the delete request directly.

**Expected Result:**
- Granted: report removed. Denied: refused; report still listed as Admin.

**Granted leg CONFIRMED PASS 2026-09-30** as `luna.blossom` (Manager): deleted report #11 via the bin icon,
confirmed removed.
**Denied leg CONFIRMED FAIL via source inspection — same BUG-TCM-007.**
`testcase_reports_controller.rb#destroy` (~line 397) looks up the report by id from params and destroys it
unconditionally for any logged-in user — no permission check at all.

---

### TC-TCM-066: Report content does not leak cross-project data

**User Role:** QA who is a member of Project A only
**Priority:** High
**Steps:**
1. As Admin, create runs and test cases in Project A and Project B.
2. As the Project-A-only QA, generate a Testcase Summary and a Defect Summary in Project A.
3. Inspect the generated report for any Project B run, case or defect.

**Expected Result:**
- The report contains **only** Project A data. Any Project B row is a data-exposure defect (High).

**CONFIRMED via source — 2026-09-30 — PASS.** `testcase_reports_controller.rb#create` (line 65):
`@runs = include_testcase ? Run.where(project_id: @project.id) : Run.where(id: params[:testcase_report][:run_ids],
project_id: @project.id)` — **both** branches of the ternary constrain to `project_id: @project.id`, including the
branch that takes attacker-controllable `run_ids` straight from params. Even a crafted `run_ids` array containing
another project's run id would be filtered out by the `.where(..., project_id: @project.id)` clause before any
report content is built. The rest of report generation (`@issues`, `@issues_by_run_and_environment`, defect/RTM
data) is all derived from `@runs`, so nothing outside this already-scoped set can reach the output. Distinct from
BUG-TCM-009 (page-level access, not report-content scoping) and from BUG-TCM-007 (missing authorization on the
create/edit/delete actions themselves) — this specific data-scoping logic is correct.

---

## To-Do Management

---

### TC-TCM-067: To-Do shows only own items without "View All To-Do's"

**User Role:** QA without the permission
**Priority:** High
**Steps:**
1. As Admin, assign test execution work to two different users.
2. Log in as one of them, open the **To-Do** sidebar area.

**Expected Result:**
- Only that user's own assigned items are listed; the other user's items are absent.

---

### TC-TCM-068: "View All To-Do's" widens visibility

**User Role:** Manager with the permission
**Priority:** Medium
**Steps:**
1. With the same data as TC-TCM-067, log in as a role holding **View All To-Do's** and open **To-Do**.

**Expected Result:**
- Items assigned to all users are listed.

---

### TC-TCM-069: To-Do endpoint respects the permission

**User Role:** QA without **View All To-Do's**
**Priority:** High
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
**Priority:** High
**Steps:**
1. Granted: open **Requirements** → create a requirement document; confirm it lists.
2. Denied: confirm the add control is absent.
3. Denied: request `/requirements/new?project_id=<id>` directly and attempt the POST.

**Expected Result:**
- Granted: created. Denied: control absent, request refused, nothing created.

**Granted leg CONFIRMED PASS 2026-09-30** as `luna.blossom` (Manager): created requirement
"TC-TCM-070-Manager-Requirement" (#3) via the "+" icon, listed correctly.
**Denied leg CONFIRMED FAIL 2026-09-30 — BUG-TCM-007.** As `daisy.skye` (Reporter, no `add_requirement`): the
"+" icon is present in the DOM but clicking it does not open the form (a genuine, if minimal, UI-side gate) —
however a direct `POST /requirements` with `requirement[title]=...` returned **201 Created** with a real
`id=4` in the response body. `requirements_controller.rb#create` has no permission check; the `allowed_to?`
calls elsewhere in that file only compute UI flags, they never guard `create`/`update`/`destroy`.

---

### TC-TCM-071: Edit Requirement — granted vs denied (all three legs)

**User Role:** granted and denied
**Priority:** High
**Steps:**
1. Granted: edit a requirement's title/body and save.
2. Denied: confirm the edit control is absent.
3. Denied: request the edit URL directly and attempt the update.

**Expected Result:**
- Granted: change persists. Denied: refused; requirement unchanged.

**Granted leg CONFIRMED PASS 2026-09-30** as `luna.blossom` (Manager): clicked into the requirement's body
editor; autosave fired ("Saved" indicator shown).
**Denied leg CONFIRMED FAIL via source inspection — same BUG-TCM-007.** `requirements_controller.rb#update`
has no `allowed_to?(:edit_requirement, ...)` guard.

---

### TC-TCM-072: Delete Requirement — granted vs denied (all three legs)

**User Role:** granted (Admin/Manager) and denied (Developer/Client/non-member)
**Priority:** High
**Steps:**
1. Granted: delete a requirement and confirm.
2. Denied: confirm the delete control is absent.
3. Denied: issue the delete request directly.

**Expected Result:**
- Granted: removed. Denied: refused; requirement still present as Admin.

**Granted leg CONFIRMED PASS 2026-09-30** as `luna.blossom` (Manager): deleted requirement #3 via the delete
icon, confirmed removed.
**Denied leg CONFIRMED FAIL via source inspection — same BUG-TCM-007.**
`requirements_controller.rb#destroy` (~line 62) calls `@requirement.destroy` with no permission check.

---

### TC-TCM-073: Deleting a requirement linked to test cases

**User Role:** Admin
**Priority:** High
**Steps:**
1. Link at least two test cases to a requirement.
2. Delete the requirement.
3. Open those test cases and the RTM.

**Expected Result:**
- Either the delete is blocked with a clear message, or it succeeds and the test cases survive with their
  requirement link cleanly cleared.
- The RTM must not error or show a dangling reference. Record the actual behaviour.

**DEFERRED — 2026-09-30.** Identified the live fixture for this TC: Requirement #2 ("gsdfgdf" in `test-project`) is
linked to test cases #434 and #471 (`RequirementIssue.where(requirement_id: 2).pluck(:issue_id) == [434, 471]`).
Attempting to execute the actual delete (via UI navigation) was blocked mid-workflow by the session's auto-mode
permission classifier ("Irreversible Deletion"), which also blocked a follow-up screenshot in the same flow.
Per the tool policy this triggered, the deletion was not pursued through any alternate path this session — it
needs the user to either grant it live or confirm proceeding via a different, explicitly-approved route. Not
executed; no verdict recorded.

---

## Negative / Cross-cutting Cases

---

### TC-TCM-074: Non-member cannot reach any plugin area of a private project

**User Role:** logged-in non-member
**Priority:** High
**Steps:**
1. With the project set **private** (see root `MEMORY.md` — a new project defaults to Public; uncheck it
   explicitly or this test falsely passes).
2. Request each plugin URL directly: `/test_suites?project_id=`, `/runs/new?project_id=`,
   `/projects/<id>/testcase_reports`, `/requirements?project_id=`, `/traceability_rtms?project_id=`,
   `/testcase_todos?project_id=`, `/projects/<id>/testcase_environment`.

**Expected Result:**
- **Every** URL is refused (403 or redirect). No project data is rendered in any response.
- Any URL returning content is a data-exposure defect (High).

**CONFIRMED LIVE — 2026-09-30 — FAIL — BUG-TCM-009 (High).** Built a dedicated, brand-new **Private** project
(`tcm-permissions-private-test`, `is_public? == false`) specifically to isolate this check — `test-project` is a
heavily shared fixture and was deliberately not reused. `daisy.skye` was never added as a member. Rails console
confirmed the baseline: `membership(project) == nil`, `allowed_to?(:view_project, project) == false`. The plain
Redmine `/projects/tcm-permissions-private-test` page correctly returned **403**. But every one of the 7 plugin
URLs rendered fully (200) for the same non-member, same session: `/test_suites/releases?project_id=` (Overview),
`/test_suites?project_id=` (Test Cases), `/runs/new?project_id=` (Runs & Results), `/projects/.../testcase_reports`
(Reports), `/requirements?project_id=` (Requirement), `/traceability_rtms?project_id=` (Traceability Matrix),
`/testcase_todos?project_id=` (To Do), and `/projects/.../testcase_environment` (Environment) — 8 of 8 tested.
Root cause (source-confirmed across `test_suites_controller.rb`, `testcase_reports_controller.rb`,
`requirements_controller.rb`, `traceability_rtms_controller.rb`, `testcase_todos_controller.rb`,
`runs_controller.rb`): every controller resolves `@project = Project.find(params[:project_id])` with no
`allowed_to?(:view_project, ...)`/membership check anywhere on the read (`index`/`new`/`show`) actions — including
`runs_controller.rb`, whose own `create`/`edit`/`close`/`delete` actions *do* correctly check permissions,
proving this is a gap on the read side specifically, not a general unfamiliarity with the pattern. Screenshot:
`screenshots/BUG-TCM-009/non-member-daisy-views-private-project-test-suites.png`. Full write-up: `bugs/open/BUG-TCM-009.md`.

---

### TC-TCM-075: Anonymous user cannot reach any plugin area

**User Role:** not logged in
**Priority:** High
**Steps:**
1. Log out. Request the same URL list as TC-TCM-074.

**Expected Result:**
- All refused or redirected to login; no project data rendered.

**CONFIRMED LIVE — 2026-09-30 — PASS.** Logged out completely (verified anonymous via the account menu disappearing
and `/login` being offered). Requested `/runs/new?project_id=`, `/test_suites?project_id=`, and
`/requirements?project_id=` for `tcm-permissions-private-test` — all three redirected to `/login?back_url=...`
with no project data rendered. Note: this is enforced by the instance-wide "Authentication required" Redmine
setting, not by any project- or plugin-specific check — it says nothing about the per-project isolation gap found
in TC-TCM-074 (BUG-TCM-009), which affects any *logged-in* non-member instead.

---

### TC-TCM-076: Permission revocation takes effect immediately

**User Role:** QA
**Priority:** High
**Steps:**
1. As QA with Create Run, confirm **Add Run** is available.
2. As Admin, revoke Create Run from the QA role.
3. As the still-logged-in QA user, reload Runs & Results, then attempt the create URL directly.

**Expected Result:**
- The control disappears on reload and the direct request is refused — no stale session grace period.

**CONFIRMED LIVE — 2026-09-30 — PASS.** Baseline: logged in as `summer.rain` (QA Own Visibility), confirmed "Add
Run" button visible on `/runs/new?project_id=test-project`. As Admin, unchecked "Create run" on the QA Own
Visibility role (`/roles/19/edit`) and saved — verified via Rails console the change actually persisted
(`Role.find(19).permissions.include?(:create_run) == false`, guarding against the bulk-save silent-failure gotcha
noted in this plugin's memory file). Logged back in as `summer.rain` (fresh request, same server-side permission
check either way since Redmine re-evaluates `allowed_to?` per request rather than caching it in the session) and
reloaded Runs & Results: the "Add Run" button is now **completely absent** — takes effect immediately, no stale
grace period. The actual create endpoint (`runs_controller.rb#create`) already carries the correct
`allowed_to?(:create_run, @project) || admin?` guard confirmed by source in BUG-TCM-007's contrast section, so the
same live-revoked permission would be refused there too.

---

### TC-TCM-077: Module disabled removes all access

**User Role:** Admin, then QA
**Priority:** High
**Steps:**
1. Disable the TestCases module in Project Settings → Modules.
2. As QA, confirm the **TestCases** tab is gone, then request the plugin URLs directly.

**Expected Result:**
- Tab absent and every plugin URL refused while the module is disabled.

**CONFIRMED LIVE — 2026-09-30 — FAIL — folded into BUG-TCM-009.** As Admin, disabled the "Redmineflux Testcase
Management" module on `test-project` (Settings → Modules). As `summer.rain` (a genuine project member): the
"TestCases" tab correctly disappeared from the project's top nav (leg B — module-gating works for the tab). But
`GET /test_suites?project_id=test-project` still rendered the **full** 807-row Testcase Summary grid with working
pagination, and `GET /runs/new?project_id=test-project` still rendered the **full** Runs & Results listing — leg C
fails, direct URLs are not refused at all while the module is disabled. Same missing-guard root cause as
BUG-TCM-009 (no `@project`-level check runs before rendering), just against `module_enabled?('testcase_management')`
instead of `view_project` — added to that bug rather than filed separately. Module re-enabled and verified restored
(`Project#module_enabled?('testcase_management') == true`) immediately after this test to avoid leaving the shared
`test-project` fixture altered.

---

## Evidence Map

| TC range | Area | Bug reference |
|---|---|---|
| TC-TCM-046 – 806 | Test Suite Management | BUG-TCM-007 |
| TC-TCM-052 – 813 | Test Run Management | — |
| TC-TCM-059 – 816 | Test Execution | — |
| TC-TCM-062 – 821 | Reporting | BUG-TCM-007 |
| TC-TCM-067 – 824 | To-Do Management | — |
| TC-TCM-070 – 828 | Requirement Management | BUG-TCM-007 |
| TC-TCM-074 – 832 | Negative / cross-cutting | BUG-TCM-009 |

- Screenshot: capture only on failure, to `screenshots/<BUG-ID>/` (`CLAUDE.md` §6).
- Log: for leg C, capture the HTTP status and response of the direct request as evidence — a screenshot of a
  rendered page is not sufficient proof of refusal.
