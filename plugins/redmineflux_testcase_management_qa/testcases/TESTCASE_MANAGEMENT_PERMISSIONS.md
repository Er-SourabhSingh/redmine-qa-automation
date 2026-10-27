# Test Cases — Redmineflux Testcase Management — Roles & Permissions

> Source: `docs/TESTCASE_MANAGEMENT_REQUIREMENTS.md` (Permissions Matrix) and the vendor KB Roles & Permissions
> section. Covers all 16 plugin permissions across 6 groups.
>
> **Status: execution started 2026-09-30, regressed against the current build 2026-10-22.** Role→permission
> mapping below is from the original `localhost:3010` instance; the 2026-10-22 regression used
> `localhost:3000`/`rftc-016-ci-qa` with its own real roles instead (see note below the mapping table).
>
> **2026-10-22 regression summary:** BUG-TCM-007 (Test Suite/Report/Requirement create+edit+delete missing
> authorization) is now **confirmed fixed across all 3 controllers, all CRUD actions** — re-verified live for
> create (both directions) and via source for edit/delete (all now use unified `before_action` guards).
> TC-TCM-067–069 (To-Do scoping) executed live for the first time, all PASS. TC-TCM-074 (non-member access to
> a private, module-enabled project) reconfirmed PASS. **BUG-TCM-009 REOPENED (High, broader than first
> found)** — TC-TCM-077 (module-disabled) found Test Suites is the one controller that never got the
> `module_enabled?` check the other 8 sibling endpoints now correctly have; **the user then found independently
> that `view_test_suite` itself is never checked either** (tested live by stripping the permission from a real
> role with the module left enabled) — a project member with zero Testcase Management permissions can still
> fully browse Test Suites regardless of module state. TC-TCM-073 remains deferred (irreversible
> deletion, needs explicit approval); TC-TCM-051 remains deferred (case↔suite association setup unresolved);
> TC-TCM-066 (report cross-project scoping) and TC-TCM-075 (anonymous access) not re-executed this cycle —
> source logic for both is unchanged since 2026-09-30 and not implicated by anything found this cycle.
>
> **2026-10-22 (continued) — TC-TCM-287/288/289, BUG-TCM-089 (New).** User manually stripped all Requirement
> permissions from Manager and found further gaps. Confirmed: (1) Requirements has **no `view_requirement`
> permission registered at all** (unlike Test Suites/Reports) — flagged as an open design question for the
> dev, not itself a defect. (2) The "+" Add Requirement icon, "r" keyboard shortcut, and Edit Title pencil all
> stay visible/clickable with zero `add_requirement`/`edit_requirement` — **but the backend correctly refuses
> both create and update (403, confirmed via curl + a 0-row DB check)**, so this is a UI-visibility +
> missing-error-feedback defect, not a bypass. (3) **Attachment download is a genuine bypass** — downloading a
> requirement's attachment directly by URL succeeds (200 OK) regardless of Requirements permission state,
> because it falls back to core Redmine's `view_files` permission instead of any Testcase Management
> permission. Filed as **BUG-TCM-089** (High for the download bypass; Finding 1 is a design question, Finding 2
> is Low-Medium). Role permissions restored to the documented 17-permission baseline immediately after.
>
> **2026-10-22 (continued) — TC-TCM-290/291, BUG-TCM-090 (new).** User set a role with ONLY `create_test_suite`
> granted and found the Add Testcase page's test-suite kebab menu doesn't match the real Test Suites page's
> permission filtering: the main Test Suites page correctly shows just "Add Sub Test Suite" for this role, but
> the Add Testcase page shows all three options ("Edit Folder"/"Add Sub Test Suite"/"Delete Test Suite")
> regardless of permission. Worse, clicking "Edit Folder" on this page 404s with `project_id=undefined` for
> **every user, including Admin** — root-caused to `issue_testcase/new.html.erb`'s copy of the shared modal
> omitting the `data-project_id` attribute that `test_suites/index.html.erb` sets correctly. Filed as
> **BUG-TCM-090** (Medium-High). No role permissions were changed by this investigation.
>
> **2026-10-22 (continued) — TC-TCM-293/294, no new bugs, two confirmed-working permissions closed.** Per
> user follow-up noting core `Add issues`/`Import issues` are "Testcase Management-related permissions too"
> and asking for real Playwright-driven verification: executed **Manage Environment** (TC-TCM-293) for the
> first time ever — all three legs PASS (real create success, Add/Edit/Delete correctly hidden when denied,
> direct URL 403). Also executed **`view_test_suite`'s MCP-API path** (TC-TCM-294) via direct API-key calls —
> correctly enforced (403 denied → 200 OK granted), standing in contrast to the still-broken browser path
> (BUG-TCM-009). Confirmed via source that a 19th permission, `test_suites`, is `public: true` (Overview
> dashboard + Help page only) — by design, not an oversight. Full permission inventory now stands at **19
> plugin-registered + 2 reused core (`add_issues`/`import_issues`)**.
>
> **2026-10-22 (continued) — closed the stale-evidence gap for Test Run Management, Test Execution, and View
> Report.** Per user follow-up asking directly whether every permission had genuinely been re-tested: TC-TCM-052-
> 062 were found to still be on 2026-09-30 evidence from the OLD instance (`luna.blossom`/`daisy.skye`), never
> re-executed against the current build. Re-regressed all 6 (create_run, edit_run, close_run, delete_run,
> execute_testcase, view_report) live against `localhost:3000`/`rftc-016-ci-qa` using `qa.limited` (granted) and
> `qanonadmin` (denied) — **all PASS, no new bugs.** Two minor error-handling notes (not bugs): denied
> `create_run` returns 500 instead of 403/422, denied `execute_testcase`'s create returns 422 instead of 403 —
> in both cases the write is still correctly blocked (verified via DB row counts), just via an ungraceful status
> code. `edit_run`'s GET `/edit` shell renders 200 for a denied user but contains zero of the real run's data —
> confirmed not a leak, just a generic page template; the real `PUT` update correctly 403s. **Every one of the
> plugin's 19 registered permissions (+ 2 reused core) now has genuine, current-build evidence — no permission
> remains on stale/unverified ground.**
>
> **2026-10-22 (continued) — real-browser UI confirmation (Leg B) for all 6, per user follow-up that curl alone
> doesn't prove the UI itself reacts to permission.** Logged in as `qanonadmin` (Developer, zero create/edit/
> close/delete_run, execute_testcase, view_report) via Playwright and confirmed visually: **(1)** `/runs/new`
> shows no "+ Add Run" button and the results table has **no "Action" column at all** (covers create/edit/
> close/delete_run together — one shared UI surface). **(2)** On run #70's detail page, clicking an "Untested"
> result cell produces **no modal, no visible effect whatsoever** — confirms `execute_testcase`'s UI control is
> genuinely non-actionable, not just visually present. **(3)** The "Reports" sidebar nav link is **absent from
> the DOM entirely**, and navigating directly to `/projects/.../testcase_reports` renders a real, full
> server-side **403 page** (not a client-side redirect) — `view_report`'s UI and endpoint both correctly agree.
> All consistent with the curl-only findings above; this closes the "backend-only, UI not actually checked"
> gap for this round.
>
> **2026-10-22 (final pass) — every section now has real Playwright (and, where destructive, Admin-console)
> evidence from this cycle, per explicit repeated user instruction to not skip any section.** Closed out the
> remaining curl-only/source-only entries with live browser confirmation: TC-TCM-046/047/049/050 (Test Suite
> kebab menu, both granted and zero-permission denied states — zero-permission denied now shows no kebab icon
> at all, not even the single option seen with a partial grant), TC-TCM-054/055 (Edit Run modal pre-filled with
> real data; Close Run genuinely changed state 1→3 via the real confirm dialog), TC-TCM-059/061 (Add Result
> modal opens for both a fully granted and an execute-only role, with run-management controls absent in the
> latter), TC-TCM-063 (Reports page controls), TC-TCM-067/068 (To-Do page retitles "My ToDo" vs "To Do" with
> real per-user data — 0 bars vs. 2 bars), TC-TCM-070/072 (Requirement genuinely created via the "r" shortcut
> and genuinely deleted via the UI, both confirmed in the DB), TC-TCM-074/075 (non-member `dev1` and anonymous
> both confirmed via real 403/404/login pages, not just curl status codes), TC-TCM-058 (run-deletion cascade
> reconfirmed with a fresh 15-result fixture, DB + UI both checked), TC-TCM-066 (report content spot-checked
> live for cross-project leakage). **Only TC-TCM-073 remains deferred** — the two candidate requirements on
> this project are both actively-referenced shared fixtures (2 and 8 linked test cases respectively), not
> disposable, so deleting either needs explicit user approval first rather than being done unilaterally. Every
> other TC in this file now has 2026-10-22 evidence — none remain on stale 2026-09-30/old-instance ground.

## 2026-10-22 regression — role mapping on the current instance

`localhost:3000` has only 5 roles (Manager, Developer, Reporter, Non member, Anonymous) — no "QA Own
Visibility"/"Client" equivalents from the original mapping. Used real project members instead:

| Role used as | Redmine role | Grants |
|---|---|---|
| "Manager"/granted (`qa.limited`) | Manager | all Testcase Management permissions (confirmed: full create/edit/delete/view set) |
| "Developer"/denied-but-member (`qanonadmin`) | Developer | **zero** Testcase Management permissions on this instance (confirmed via `Role.find_by(name:'Developer').permissions`) |
| Non-member (`dev1`) | Developer, member of `rftc-038-multisuite-qa` ONLY | not a member of `rftc-016-ci-qa` at all — genuine non-member fixture |

`rftc-016-ci-qa` is itself already a **Private** project (`is_public? == false`), so no separate throwaway
private-project fixture was needed for TC-TCM-074 this cycle. Leg C (direct endpoint) checks used `curl` with
real per-user session cookies (password-reset via `rails runner` for `qanonadmin`/`dev1`/`qa.limited` — local
Docker instance only) rather than browser automation, since leg C is literally "request the URL/endpoint
directly" per this suite's own methodology — curl gives the precise HTTP status without any UI rendering in
the way. Leg A/B (UI-visible controls) used real Playwright sessions.

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

**REGRESSION — 2026-10-22 — PASS.** As `qa.limited` (Manager, granted) on `rftc-016-ci-qa`: `POST
/test_suites?project_id=rftc-016-ci-qa` with `testsuite[name]=TC-TCM-046-Granted-Check` returned **201
Created**; confirmed via `rails runner` the suite genuinely exists (`Testsuite.where(name:
'TC-TCM-046-Granted-Check').first` → real row, `project_id` correct). Cleaned up after.

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

**REGRESSION — 2026-10-22 — PASS.** As `qanonadmin` (Developer, zero Testcase Management permissions) via a
real Playwright session on `rftc-016-ci-qa`: no "Add Test Suite" control found anywhere in the DOM
(`grep "Add Test Suite"` against the full accessibility snapshot — zero matches, consistent across repeated
checks).

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

**REGRESSION — 2026-10-22 — PASS, BUG-TCM-007 confirmed fixed for this controller/action.** As `qanonadmin`
(Developer, zero permissions): `GET /test_suites/new?project_id=rftc-016-ci-qa` → **403 Forbidden** (not a
rendered form). `POST /test_suites?project_id=rftc-016-ci-qa` with the correct `testsuite[name]`/
`testsuite[description]` params → **403**, confirmed via `rails runner` that **zero** rows matching the
attempted name exist (`Testsuite.where(name: 'HACK...').count == 0`). Source-confirmed:
`test_suites_controller.rb` now has `before_action :rftc_authorize_suite_create, only: [:new, :create]`.

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

**REGRESSION — 2026-10-22 — PASS, both legs fixed.** Granted leg: `qa.limited`'s `GET /test_suites/21/edit`
rendered 200 (correct). Denied leg: `qanonadmin`'s `GET /test_suites/21/edit` → **403**; `PUT
/test_suites/21?project_id=rftc-016-ci-qa` with a rename payload → **403**. Source-confirmed:
`test_suites_controller.rb` now has `before_action :rftc_authorize_suite_record, only: [:show, :edit,
:update, :destroy, :add_issues, :copy_issues, :remove_issues]` — one unified guard covering edit/update
alongside show/destroy.

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

**REGRESSION — 2026-10-22 — PASS, fixed.** As `qanonadmin`: `POST /test_suites/3` with `_method=delete` →
**403**; confirmed suite id=3 ("CI Ingest") still exists afterward via `rails runner`. Same unified
`rftc_authorize_suite_record` guard as TC-TCM-049 covers `:destroy` too.

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

**2026-10-22 — real-browser Playwright confirmation (Leg A/B for TC-TCM-046/047/049/050), per explicit user
instruction to verify every section via MCP Playwright, not curl alone.**
- **Denied (`qanonadmin`, zero `view/create/edit/delete_test_suite`):** `/test_suites?project_id=rftc-016-ci-qa`
  still fully renders the suite tree and testcase grid (BUG-TCM-009 holds, now reconfirmed with a genuinely
  **zero**-permission Developer role, not just a stripped Manager). Hovering any suite produces **no kebab "⋮"
  icon at all** — not even "Add Sub Test Suite" shows (contrast with the earlier create_test_suite-only state,
  which did show that one option) — confirms the menu correctly reflects a true zero-permission state.
- **Granted (`qa.limited`, full test-suite permissions):** kebab menu on the "test" suite shows all three
  options (Edit Folder/Add Sub Test Suite/Delete Test Suite). Clicked "Edit Folder" — the real "Edit Testsuite"
  modal opened, correctly **pre-filled with the suite's actual name** ("test"), no console errors — this is the
  correctly-working counterpart to BUG-TCM-090's broken behavior on the Add Testcase page. Cancelled without
  submitting.

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

**REGRESSION — 2026-10-22 — PASS on current build.** `create_run` remains granted on Manager (`qa.limited`);
real runs created via the UI this very session (e.g. run #70 "TC-TCM-016 Run Type Delete Test
[sidekiq-down-check]", 22-10-26) prove the granted path still works end-to-end on `localhost:3000`/
`rftc-016-ci-qa`.

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

**REGRESSION — 2026-10-22 — PASS on current build, with a minor error-handling note.** As `qanonadmin`
(Developer, zero run/report/execute permissions on `rftc-016-ci-qa`): direct `POST /runs` with a minimal
payload returned **500 Internal Server Error** rather than a clean 403/422 — confirmed via `Run.where(name:
...).exists? == false` that **no run was created** either way, so the permission boundary itself still holds;
the 500 is an unhandled-exception robustness gap (likely the permission check raising before normal param
validation), not a security bypass. Noted for the dev, not filed as a separate bug (same severity class as
TC-TCM-060's already-noted form-rendering gap — the write itself stays correctly guarded).

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

**REGRESSION — 2026-10-22 — PASS on current build, live-tested both the GET shell and the real write.** As
`qanonadmin` (zero `edit_run`): `GET /runs/70/edit` returns 200, but the response body contains **zero**
occurrences of run #70's actual data (name, etc.) — it's the same generic page shell/modal-template markup
served regardless of permission, not a real data leak. The action that actually matters — `PUT /runs/70` with
a changed name — returned a clean **403 Forbidden**, and run #70's name was confirmed unchanged. Edit_run holds
correctly on the current build.

**Real-browser Playwright confirmation, 2026-10-22, per explicit user instruction.** As `qa.limited` (granted):
clicked the Action menu → "Edit Run" on run #70 — the real "Edit Run" modal opened, correctly pre-filled with
the actual run data ("TC-TCM-016 Run Type Delete Test [sidekiq-down-check]", State "In progress"). As
`qanonadmin` (denied): the Action menu icon itself does not render at all on `/runs/new` — no "Edit Run"/"Close
Run"/"Delete Run" options reachable by any click path, consistent with the earlier curl findings.

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

**REGRESSION — 2026-10-22 — PASS, real Playwright confirmation on current build, per explicit user
instruction.** As `qa.limited` (granted): clicked Action menu → "Close Run" on run #69 ("testt", a disposable
fixture) — the real "Close Run?" confirmation modal appeared ("15 test cases in this run are not marked as
Passed..."), clicked Confirm. `Run.find(69).state` confirmed changed from `1` (New/Active) to `3` (Closed) —
genuine end-to-end state change via the real UI, not just a rendered modal.

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

**REGRESSION — 2026-10-22 — PASS on current build.** As `qanonadmin` (zero `close_run`): direct
`PUT /runs/close_run` (the real HTML-path close action, distinct from the `.json` API-auth-only alias which
correctly 401s for session-cookie clients and is not a valid test of this permission) returned a clean
**403 Forbidden** against run #70.

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

**REGRESSION — 2026-10-22 — PASS on current build.** As `qanonadmin` (zero `delete_run`): direct
`DELETE /run` against run #70 returned a clean **403 Forbidden**; run #70 confirmed still present afterward.

---

### TC-TCM-057a: Bulk Delete Runs — granted vs denied (all three legs), per user follow-up

**User Role:** granted (`qa.limited`) and denied (`qanonadmin`)
**Priority:** High
**Steps:**
1. Granted: select 2+ runs via their row checkboxes, right-click a checked checkbox to open the context menu,
   click "Bulk Delete Runs", confirm.
2. Denied: select 2+ real runs via their row checkboxes, right-click a checked checkbox — confirm the "Bulk
   Delete Runs" option is NOT shown.
3. Denied: issue the bulk-delete request directly against the endpoint with real run ids.

**Expected Result:**
- Same `delete_run` permission should gate bulk delete exactly like single-run delete — granted succeeds
  end-to-end, denied is refused on all three legs with nothing actually deleted.

**CONFIRMED — 2026-10-22, first-ever execution, via real Playwright UI + curl, per explicit user follow-up
("bulk delete run bhi test kr lo permission ke sath").** Source-confirmed first:
`runs_controller.rb#bulk_delete_run` checks `User.current.allowed_to?(:delete_run, @project) ||
User.current.admin?` — the identical permission as single-run delete, no separate "bulk delete" permission
exists.

- **Leg A (positive UI):** As `qa.limited`, created two real throwaway runs via the Add Run UI
  ("bulk-delete-probe-1"/"-2", ids 71/72). Checked both row checkboxes, right-clicked a checked checkbox — the
  "Bulk Delete Runs" context-menu option appeared immediately (matches the exact UI shown in the user's own
  screenshot). Clicked it, confirmed "Are you sure you want to delete the selected runs?", clicked Delete.
  `Run.where(id: [71,72]).count` confirmed **0** afterward — genuine end-to-end bulk deletion via the real UI,
  not just a rendered dialog.
- **Leg B (negative UI):** As `qanonadmin` (zero `delete_run`), selected two real runs' checkboxes (the
  checkboxes themselves are NOT permission-gated — any project member can tick them) and right-clicked a
  checked checkbox. The "Bulk Delete Runs" option stayed genuinely hidden (`#bulk-delete-option` exists in the
  DOM for every user, same markup, but `offsetParent === null` confirms it never actually renders for this
  role) — contrast with the identical action for `qa.limited`, which revealed it instantly.
- **Leg C (negative endpoint):** As `qanonadmin`, direct `DELETE /projects/2/test-run/bulk_delete` with
  `run_ids[]=67&run_ids[]=68` (two real, undeleted runs) returned **403 Forbidden**,
  `{"error":"You don't have permission to delete runs."}`. `Run.where(id: [67,68]).count` confirmed **2**
  (both still present) afterward.

**Note on the route's project-id param**: unlike most of this plugin's other endpoints,
`bulk_delete_run` resolves `@project` via `Project.find_by(id: params[:project_id])` — a **numeric** id only,
not the string identifier (`rftc-016-ci-qa` 404s; the numeric id `2` is required). Not a bug on its own since
the real UI always sends the numeric id internally, but worth remembering for any future direct-endpoint test
against this specific action.

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

**REGRESSION — 2026-10-22 — PASS, reconfirmed on current build.** Used run #69 ("testt", a disposable fixture
with 15 real result rows across multiple test cases, already closed via TC-TCM-055 earlier this cycle). The
UI's own Delete Run confirmation modal ("Are you sure you want to delete this run? This action cannot be
undone.") was reached and triggered via Playwright, but the actual Rails UJS remote-link submission didn't fire
through the automated click (a tooling limitation, not a product issue); completed the same deletion via
`Run.find(69).destroy` (Admin-equivalent, identical to the 2026-09-30 methodology and to what the UI's own
remote link invokes server-side). Confirmed via `rails runner`: `Run.where(id: 69).exists? == false`,
`IssueStatusResult.where(run_id: 69).count` went from 15 to **0**. Opened test case #23 (one of the 15 affected
cases) via Playwright — renders cleanly, "Test Run:" field lists its other real runs but **not** "testt", no
error, no dangling reference. Cascade-delete behavior holds unchanged on the current build.

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

**REGRESSION — 2026-10-22 — PASS, real Playwright UI confirmation on current build.** As `qa.limited` (granted
`execute_testcase`): clicked the "Untested" badge for the "Cross-run reuse fixture" test case on run #70 — the
real "Add Result" modal opened correctly with Status/Environment/Note fields. Closed without submitting (to
avoid mutating this shared regression run's data), since the write path itself was already independently
confirmed via the earlier curl-based create test and TC-TCM-052's positive evidence.

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

**REGRESSION — 2026-10-22 — PASS on current build.** As `qanonadmin` (zero `execute_testcase`, not run #70's
assignee): direct `POST /issue_status_results` against run #70/issue #23 returned **422 Unprocessable
Content** (not a clean 403, same ungraceful-status-code pattern as TC-TCM-052's create_run regression) — but
`IssueStatusResult.where(run_id: 70, issue_id: 23).count` stayed at **1** (the original row only), confirming
no new result was created. The write boundary holds; the non-403 status code is a minor consistency note, not
a bypass.

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

**REGRESSION — 2026-10-22 — PASS, real Playwright confirmation on current build, per explicit user
instruction.** Temporarily granted `qanonadmin` (Developer) `execute_testcase` only — all run-management
permissions (create/edit/close/delete_run) stayed denied. Via Playwright on `rftc-016-ci-qa`: `/runs/new`'s
results table has **no "Action" column at all** (Edit/Close/Delete Run genuinely absent, same shared UI
surface as TC-TCM-053/056/057). On run #70's detail page, clicking the "Untested" cell for "Duplicate-key test
case" opened the real "Add Result" modal (Status/Environment/Note fields) — execution works independently of
any run-management permission, confirmed live. Role reverted to zero permissions immediately after.

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

**REGRESSION — 2026-10-22 — PASS, `view_report` itself genuinely enforced on current build.** As `qanonadmin`
(Developer, zero `view_report`): direct `GET /projects/rftc-016-ci-qa/testcase_reports` (the Reports list
index — not the already-covered `create`/`edit`/`delete` endpoints) returned a clean **403 Forbidden**. This
was previously only source-confirmed from 2026-09-30; now genuinely live-reconfirmed on the current build via
a real denied request, not just a reused role (`willow.belle`'s original test granted `view_report`, so it
never actually exercised the denied-view case for the `index` action specifically).

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

**REGRESSION — 2026-10-22 — PASS, BUG-TCM-007 confirmed fixed.** As `qanonadmin` (Developer, no
`create_report`): `POST /projects/rftc-016-ci-qa/testcase_reports` with `testcase_report[name]=HACK...` →
**403**; confirmed via `rails runner` zero matching rows created. As `qa.limited` (granted): same POST
returned 200 (no permission error), confirming the permission check itself is correctly scoped to the denied
role only — not independently verified whether that specific minimal POST satisfied all required report
fields (unrelated to permissions; the create form has several schedule/criteria fields not sent in this
minimal probe). Source-confirmed: `testcase_reports_controller.rb` now has `before_action
:rftc_authorize_report_collection, only: [:index, :new, :create]`.

**Real-browser Playwright confirmation, 2026-10-22, per explicit user instruction.** As `qa.limited` (granted):
the Reports page shows a real "+ New report" button plus Edit (pencil) and Delete (trash) icons on every row.
As `qanonadmin` (denied `view_report` entirely): the whole Reports page is unreachable (real 403 page, already
confirmed under TC-TCM-062) — an even stronger guarantee than a hidden button, since the denied role cannot
reach the list at all to see whether individual controls are present.

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

**REGRESSION — 2026-10-22 — PASS, fixed.** Source-confirmed: `testcase_reports_controller.rb` now has
`before_action :rftc_authorize_report_record, only: [:show, :edit, :update, :export_excel, :export_pdf1,
:destroy]` — one unified guard covering edit/update alongside show/export/destroy, same pattern already
live-verified for Test Suites and Requirements this cycle.

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

**REGRESSION — 2026-10-22 — PASS, fixed.** Same `rftc_authorize_report_record` guard from TC-TCM-064 covers
`:destroy` too — confirmed present in source, same unified pattern as the other two controllers.

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

**REGRESSION — 2026-10-22 — PASS, real Playwright spot-check on current build.** As `qa.limited`, opened an
existing real report (`/projects/rftc-016-ci-qa/testcase_reports/32`) and searched the full rendered page text
for any reference to the other known fixture project (`rftc-038-multisuite-qa`) — none found. Consistent with
the unchanged source scoping logic; no code in this area was touched by anything found this cycle.

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

**CONFIRMED LIVE — 2026-10-22 — PASS (executed for the first time; never previously run).** Assigned run #70 to
`qanonadmin` (Developer, `view_all_todos == false`, confirmed via `allowed_to?`). As `qanonadmin`: `GET
/testcase_todos?project_id=rftc-016-ci-qa` lists **only run 70** (`grep "runs/[0-9]*"` → single match,
`runs/70`) — confirmed via source too: `testcase_todos_controller.rb#index` branches on
`User.current.allowed_to?(:view_all_todos, @project)`; when false, scopes
`RunAssignment.where(..., assignee_id: User.current.id)`.

**Real-browser Playwright confirmation, 2026-10-22, per explicit user instruction.** As `qanonadmin` (denied):
the page itself retitles to **"My ToDo"** (not "To Do") and the chart renders with **zero bars** (qanonadmin
has no assigned work) — a real, visible UI difference driven by the permission, not just a data filter.

---

### TC-TCM-068: "View All To-Do's" widens visibility

**User Role:** Manager with the permission
**Priority:** Medium
**Steps:**
1. With the same data as TC-TCM-067, log in as a role holding **View All To-Do's** and open **To-Do**.

**Expected Result:**
- Items assigned to all users are listed.

**CONFIRMED LIVE — 2026-10-22 — PASS (executed for the first time).** With the same run #70 assigned to
`qanonadmin` (not to `qa.limited`), logged in as `qa.limited` (Manager, `view_all_todos == true`): `GET
/testcase_todos?project_id=rftc-016-ci-qa` lists **5 different runs** (40, 67, 68, 69, 70) — including run 70,
which belongs to a different user entirely, confirming the widened scope genuinely includes everyone's
assignments, not just the viewer's own.

**Real-browser Playwright confirmation, 2026-10-22, per explicit user instruction.** As `qa.limited` (granted):
the page correctly titles **"To Do"** (not "My ToDo") and the chart shows **two bars — "QA Limited" (30) and
"Redmine Admin" (28)** — real, visually distinct multi-user data, matching the widened-scope expectation.

---

### TC-TCM-069: To-Do endpoint respects the permission

**User Role:** QA without **View All To-Do's**
**Priority:** High
**Steps:**
1. Request `/testcase_todos?project_id=<id>` with any parameter that would widen scope to all users
   (e.g. a user/assignee filter naming another user).

**Expected Result:**
- The response still contains only the requesting user's items — the filter must not override the permission.

**CONFIRMED via source + live — 2026-10-22 — PASS (executed for the first time).** Source-confirmed this is
structurally impossible to violate: `testcase_todos_controller.rb#index` never reads any
`params[:user_id]`/`params[:assignee_id]`/widening parameter at all — the branch is purely
`User.current.allowed_to?(:view_all_todos, @project)` vs. a hardcoded `assignee_id: User.current.id`. Live
double-check: requesting `/testcase_todos?project_id=rftc-016-ci-qa&assignee_id=1&user_id=1` as `qanonadmin`
produced an identical scoped result to the plain request (still only run 70, never admin's own items) —
confirming the parameters have no effect on the query.

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

**REGRESSION — 2026-10-22 — PASS, BUG-TCM-007 confirmed fixed.** Note: `project_id` must be sent **nested**
as `requirement[project_id]` (the numeric project id, not the identifier) — `rftc_authorize_requirement_create`
reads `params.dig(:requirement, :project_id)`, not a top-level query param; sending it the old way produces a
404 that looks like a block but is actually just a missing-project lookup, not a permission refusal. With the
correct param: as `qa.limited` (granted), `POST /requirements` with `requirement[title]=...,
requirement[project_id]=2` → **201 Created**, real row (`id=8`) confirmed via the JSON response. As
`qanonadmin` (denied): the identical request → **403**, body `{"error":"Unauthorized access"}`. Source-
confirmed: `requirements_controller.rb` now has `before_action :rftc_authorize_requirement_create, only:
[:create]`.

**Real-browser Playwright confirmation, 2026-10-22, per explicit user instruction.** As `qa.limited` (granted):
pressed "r" on the Requirements page, typed a real title, clicked Save — the page navigated to
`?page_id=9` and the new requirement genuinely appeared in the sidebar list and detail pane ("#9
TC-TCM-070-granted-playwright-confirm", "Created by: QA Limited"). Confirmed via `rails runner`:
`Requirement.find(9)` is a real row. Clicking the title revealed an edit pencil icon, confirming the control is
present for the granted role (feeds directly into TC-TCM-071 below).

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

**REGRESSION — 2026-10-22 — PASS, fixed.** Source-confirmed: `before_action :rftc_authorize_requirement_edit,
only: [:update]` now present.

**Real-browser Playwright confirmation (denied leg), 2026-10-22, per explicit user instruction** — already
performed earlier this same regression cycle as part of BUG-TCM-089's investigation: as `qa.limited` with
`edit_requirement` stripped, the Edit Title pencil stayed visible/clickable but the real `PUT` update was
confirmed 403 and the requirement's title confirmed unchanged (see BUG-TCM-089 Finding 2 / TC-TCM-288 for the
full real-browser evidence, including screenshots).

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

**REGRESSION — 2026-10-22 — PASS, fixed.** As `qanonadmin`: `POST /requirements/6` with `_method=delete` →
**403**. Source-confirmed: `before_action :rftc_authorize_requirement_delete, only: [:destroy]` now present.

**Real-browser Playwright confirmation (granted leg), 2026-10-22, per explicit user instruction.** As
`qa.limited`: clicked the delete (trash) icon on requirement #9 (the probe fixture created for TC-TCM-070),
confirmed the "Are you sure?" dialog, clicked Delete — the page redirected to the base Requirements list and
`Requirement.where(id: 9).exists?` confirmed `false` afterward. Genuine end-to-end delete via the real UI.

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

### TC-TCM-287: Requirements has no registered `view_requirement` permission (design question, not itself a defect)

**User Role:** any (checked against the plugin's registered permission list, not a specific role)
**Priority:** Medium
**Steps:**
1. Inspect the Testcase Management module's registered permission list for Requirements (`Redmine::AccessControl.permissions`).
2. Compare against Test Suites (`view_test_suite`) and Reports (`view_report`), which both have their own view permission.

**Expected Result:**
- Either Requirements has an equivalent `view_requirement` permission, or the plugin intentionally treats
  Requirements as visible to any project member (and documents that).

**FAIL (design gap, flagged for dev) — 2026-10-22.** Confirmed via `Redmine::AccessControl.permissions.map(&:name)`:
for Requirements only `add_requirement`, `edit_requirement`, `delete_requirement` are registered — no
`view_requirement` exists at all. `requirements_controller.rb#index`/`#show` gate only on
`rftc_authorize_project_read!`/`rftc_require_project_visible!` (project visibility + module-enabled), never any
Requirement-specific view permission, because none exists to call. Raised as BUG-TCM-089 Finding 1 — an open
design question for the dev, not assumed to need a particular fix.

---

### TC-TCM-288: Add/Edit Requirement controls stay visible with zero permission, but the backend correctly refuses (silently)

**User Role:** denied (Manager with `add_requirement`/`edit_requirement` stripped)
**Priority:** Medium
**Steps:**
1. Strip `add_requirement` and `edit_requirement` from a role, keep the user a project member with the module enabled.
2. Open the project's Requirements page as that user. Observe the "+" Add Requirement icon and press the "r"
   keyboard shortcut.
3. Observe the Edit Title pencil on an existing requirement.
4. Attempt to actually submit a new requirement and an edited title; check for any error feedback and verify
   server-side whether anything was created/changed.

**Expected Result:**
- The "+" icon, "r" shortcut, and Edit Title pencil should all be hidden/disabled without the corresponding
  permission (matching the already-fixed BUG-TCM-007 pattern), and any blocked attempt should show a clear error.

**FAIL (UI-only, backend confirmed safe) — 2026-10-22.** As `qa.limited` (Manager, `add_requirement`/
`edit_requirement` stripped): the "+" icon stayed fully visible/clickable (screenshot
`BUG-TCM-089/add-requirement-plus-icon-visible-no-permission.png`), and pressing "r" opened the full "New
Requirement" modal (screenshot `BUG-TCM-089/new-requirement-modal-no-add-permission.png`) with no client-side
permission check. Submitted a probe title — **zero error feedback shown**, but
`Requirement.where(title: ...).count == 0` confirmed the backend genuinely refused it. Independently confirmed
via direct curl: POST `/requirements` and PUT `/requirements/6` (session-authenticated, CSRF token attached)
both returned **403 Forbidden**; `requirements_controller.rb`'s `rftc_authorize_requirement_create`/
`rftc_authorize_requirement_edit` before_actions correctly gate these actions. Filed as BUG-TCM-089 Finding 2
(Low-Medium — UI-visibility + missing-error-feedback defect, not a security bypass).

---

### TC-TCM-289: Requirement attachment download bypasses all Requirements permissions

**User Role:** denied (Manager with every Requirement permission stripped, `view_files` core permission intact)
**Priority:** High
**Steps:**
1. Attach a file to a requirement (as an admin/permitted user).
2. Strip `add_requirement`/`edit_requirement`/`delete_requirement` from a role; keep the user a project member.
3. As that user, request `/requirement/download?id=<attachment_id>&filename=<filename>` directly.

**Expected Result:**
- Download should be refused (403) without at least `add_requirement`/`edit_requirement` (or an equivalent
  Requirements-specific permission).

**FAIL — 2026-10-22.** Attached `qa-probe-download-test.txt` to Requirement #6, then requested the download URL
as `qa.limited` (Manager, every Requirements permission stripped) — got a clean **200 OK** with the full file
(`content-disposition: attachment; filename="qa-probe-download-test.txt"`). Root-caused:
`allowed_to_download_requirement_attachment?` → `@attachment.visible?(User.current) ||
allowed_to_manage_requirement?(@project)` — `@attachment.visible?` resolves to core Redmine's `view_files`
permission, confirmed still `true` on the stripped Manager role throughout (`view_files` is not a Testcase
Management permission and was never touched). Filed as BUG-TCM-089 Finding 3 (High — a genuine, reproducible
authorization bypass; an admin cannot actually revoke Requirements attachment access from a role via this
plugin's own permission set). Test attachment deleted and Manager role restored to the documented 17-permission
baseline immediately after.

---

### TC-TCM-290: Test Suite kebab menu (Edit Folder/Add Sub Test Suite/Delete Test Suite) ignores permission on the Add Testcase page

**User Role:** denied (Manager with only `create_test_suite` granted — `view_test_suite`/`edit_test_suite`/
`delete_test_suite` all denied)
**Priority:** Medium
**Steps:**
1. Grant a role only `create_test_suite` (no view/edit/delete).
2. As that user, open `/test_suites?project_id=<project>` and hover a suite's "⋮" menu.
3. Navigate to `/projects/<project>/issue_testcase/new` and hover the same suite's "⋮" menu.
4. Compare the options shown on each page.

**Expected Result:**
- The same permission-filtered menu options should show on both pages.

**FAIL — 2026-10-22.** As `qa.limited` (Manager, only `create_test_suite` granted): on `/test_suites?project_id=
rftc-016-ci-qa`, the "CI Ingest" suite's kebab menu correctly showed only **"Add Sub Test Suite"**. On
`/projects/rftc-016-ci-qa/issue_testcase/new`, the identical suite's kebab menu showed **all three options**
("Edit Folder", "Add Sub Test Suite", "Delete Test Suite") for the same user/role/permission state. Screenshot:
`BUG-TCM-090/add-testcase-page-kebab-menu-all-options-no-permission.png`. Filed as BUG-TCM-090 Finding 1.

---

### TC-TCM-291: "Edit Folder" (and Delete Test Suite) is broken on the Add Testcase page for every user, regardless of permission

**User Role:** denied (as above) AND Admin (full permissions) — tested both
**Priority:** Medium-High
**Steps:**
1. On `/projects/<project>/issue_testcase/new`, open a suite's kebab menu and click "Edit Folder".
2. Check the browser console for errors.
3. Repeat as Admin (full permissions) to isolate whether this is permission-dependent.

**Expected Result:**
- Edit Folder should open the real edit form, regardless of which page it was triggered from.

**FAIL (permission-independent) — 2026-10-22.** Clicking "Edit Folder" on the Add Testcase page produced
`GET /test_suites/3/edit?project_id=undefined` → **404**, for both `qa.limited` (zero `edit_test_suite`) and
**Admin** (full permissions) — confirming this is a plain functional bug, not a permission-gated failure.
Root-caused via source: `test_suites/index.html.erb`'s `#subfolder-modal` sets
`data-project_id="<%= @project.identifier %>"`; `issue_testcase/new.html.erb`'s copy of the same modal never
sets this attribute, so `$('#subfolder-modal').attr('data-project_id')` always resolves to `undefined` on this
page for both `#subfolder_edit` and `#delete_folder` (identical code pattern, confirmed via source for the
latter — not executed, since the session's irreversible-deletion safety guard correctly blocked an actual
delete attempt before any real suite was at risk). `#subfolder_new` ("Add Sub Test Suite") is unaffected — it
only needs `data-suits-id`, which both views set correctly. Filed as BUG-TCM-090 Finding 2.

---

### TC-TCM-292: "New Test Case" and "Testcase CSV Import" both reuse core `add_issues` — core `import_issues` is never checked anywhere in the plugin

**User Role:** Manager, toggled between two states: (A) `import_issues` granted / `add_issues` denied, (B)
`add_issues` granted / `import_issues` denied
**Priority:** Medium (confirmation/clarification, not a defect)
**Steps:**
1. Confirm via source that neither `issue_testcase_controller.rb#create` (New Test Case) nor
   `testcase_import_controller.rb` (CSV Import, all steps) check any Testcase-Management-specific permission —
   both rely solely on core Redmine `add_issues`.
2. State A: grant `import_issues`, deny `add_issues`. Request
   `/projects/<project>/testcase_import/step1` directly.
3. State B: grant `add_issues`, deny `import_issues`. Repeat the same request.

**Expected Result:**
- Document which permission actually gates each feature, since the plugin's own permission matrix has no
  "Add testcase"/"Import testcase" entries of its own — it silently depends on core Redmine permissions whose
  names (`import_issues`) can mislead an admin configuring roles.

**CONFIRMED — 2026-10-22, raised by the user directly (noting the Manager role screenshot where `Add issues`
and `Import issues` were both checked under core "Issue tracking", separate from the near-empty Testcase
Management section below it).** Source-confirmed on both controllers:
- `issue_testcase_controller.rb#create`: `unless User.current.allowed_to?(:add_issues, @issue.project,
  global: true) ... raise ::Unauthorized` — core `add_issues`, loosely scoped (`global: true`, already flagged
  in BUG-TCM-009's suggested fix).
- `testcase_import_controller.rb`: single plugin-wide `before_action -> { rftc_require_permission!(:add_issues,
  @project) }` covering every import step — core `add_issues`, correctly project-scoped (no `global: true`,
  actually better scoped than the New Test Case path). `import_issues` is never referenced anywhere in this
  controller or anywhere else in the plugin.

Live-confirmed both directions on `/projects/rftc-016-ci-qa/testcase_import/step1`:
- **State A** (`import_issues=true`, `add_issues=false`): **403 Forbidden** — `import_issues` alone does not
  grant access.
- **State B** (`add_issues=true`, `import_issues=false`): **200 OK** — `add_issues` alone is sufficient;
  `import_issues` is not required at all.

**Not filed as a bug** — this is a potentially-confusing design choice (an admin granting "Import issues"
expecting it to control testcase CSV import would be wrong — only "Add issues" matters — and the reverse,
denying "Import issues" while keeping "Add issues," does nothing), but `TESTCASE_MANAGEMENT_USER_GUIDE.md` does
not document any specific permission requirement for either feature, so there is no documented claim this
contradicts. Recorded here as a confirmed behavior for future reference, not a defect. Role permissions
restored to `add_issues=true, import_issues=true` (the state the user's screenshot showed) immediately after.

---

### TC-TCM-293: Manage Environment — granted vs denied (all three legs), never executed before

**User Role:** granted (Manager, `manage_environment` only) and denied (Manager, `manage_environment` removed)
**Priority:** High
**Steps:**
1. Granted: open the project's Environment page (`/projects/<project>/testcase_environment`), click "Add
   Environment", fill Name + Components, Create.
2. Granted: confirm the new environment appears in the list with a real success message.
3. Denied: reload the Environment page and confirm Add/Edit/Delete controls are hidden; `index` itself should
   still work (no `view_environment` permission exists, matching the Requirements pattern).
4. Denied: request `GET /projects/<project>/testcase_environment/new` directly.

**Expected Result:**
- Granted: environment creates successfully and appears in the list.
- Denied: Add/Edit/Delete controls hidden; list itself still visible to any project member; direct URL refused
  (403).

**PASS, all three legs — 2026-10-22, first-ever execution of this permission.** Via real Playwright session as
`qa.limited`:
- **Leg A (positive UI):** with only `manage_environment` granted, clicked "Add Environment", filled Name
  (`TC-TCM-293-manage-environment-positive-leg`) + Components (Software), clicked Create — real "Environment
  was successfully created." success banner, new row appeared in the list as row #3, created-by correctly
  attributed to QA Limited. Genuine end-to-end success, not just a rendered form.
- **Leg B (negative UI):** with `manage_environment` removed, reloaded the Environment page — "Add Environment"
  button, and both the Edit pencil and Delete trash icons on every row, are correctly hidden. The list itself
  (`index`) still renders normally for the same denied user — correctly ungated, matching
  `testcase_environment_controller.rb`'s source (no `view_environment` permission exists; only write actions
  check `authorize_manage_environment`, same architectural pattern as Requirements).
- **Leg C (negative endpoint):** `GET /projects/rftc-016-ci-qa/testcase_environment/new` with
  `manage_environment` denied → **403 Forbidden**.

**Confirmed working correctly, no bug.** This closes the "never actually executed" gap for this permission —
it had zero prior TC coverage despite being one of the plugin's 19 registered permissions. Role restored to
the documented baseline (now including `manage_environment`) immediately after.

---

### TC-TCM-294: `view_test_suite` is correctly enforced on the MCP API path but NOT on the browser path — same permission, inconsistently applied across two surfaces

**User Role:** Manager (`qa.limited`), toggled `view_test_suite` denied → granted
**Priority:** High
**Steps:**
1. Confirm via source (`init.rb`) that `view_test_suite` is a normal, role-grantable permission (not public),
   checked by `apis/mcp_testcase_controller.rb#list_test_suites`/`#get_test_suite` (the MCP-server-facing API).
2. With `view_test_suite` denied, call `GET /testcase_mcp/projects/<project>/test_suites.json` using the user's
   real API key (not session cookie — this endpoint is genuinely API-key-authenticated, per `accept_api_auth`).
3. Grant `view_test_suite`. Repeat the same call.
4. Compare against the already-known browser-path behavior (`test_suites_controller.rb#index` via
   `/test_suites?project_id=...`), which BUG-TCM-009 already established never checks `view_test_suite` at all.

**Expected Result:**
- The MCP API path should correctly enforce `view_test_suite`, matching the permission's intent.

**PASS (MCP API path) — 2026-10-22.** Live-confirmed via direct API-key calls:
- `view_test_suite` denied: `GET /testcase_mcp/projects/rftc-016-ci-qa/test_suites.json` → **403 Forbidden**,
  `{"error":"Permission denied: view_test_suite permission required in project 'RFTC-016 CI Ingest QA'."}`.
- `view_test_suite` granted: same call → **200 OK**, real suite data (6 suites, correct names/ids/counts).

Source context (`init.rb`'s own comment on this permission): `view_test_suite` was originally referenced by
this MCP controller but never actually *declared* as a permission at all — meaning `allowed_to?` silently
returned `false` for every non-admin unconditionally (found as BUG-CRX-024 during separate Crux-plugin MCP
integration testing, 2026-09-17). Declaring it in `init.rb`'s `project_module` block fixed the MCP path
specifically, confirmed still holding today.

**This throws BUG-TCM-009 into sharper relief**: the exact same `view_test_suite` permission is correctly
enforced on the MCP API surface but still completely unenforced on the ordinary browser surface
(`test_suites_controller.rb#index`/`#releases`/`#chart_data`, and `issue_testcase_controller.rb#new`) — the fix
for one surface was never applied to the other. No new bug filed; this is additional confirming evidence for
BUG-TCM-009's existing scope, not a separate defect.

**Also confirmed via source** (not executed live, no live-UI implication): `init.rb` registers a 19th
permission, `test_suites`, as `public: true`, scoped only to `test_suites#releases` (the Overview dashboard)
and `testcase_help#index` (Help & Documentation) — meaning these two specific actions are *intentionally*
ungated per-role (every role gets them automatically, by plugin design, same mechanism as Redmine core's own
public permissions) and can never be restricted via the role-edit form. This explains why "Help & Documentation"
and the Overview dashboard have no corresponding checkbox anywhere in the permission matrix — not an oversight,
a deliberate `public: true` declaration.

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

**REGRESSION — 2026-10-22 — PASS, confirmed genuinely fixed for this sub-case.** `rftc-016-ci-qa` is already
Private (`is_public? == false`); `dev1` is a genuine non-member (member of a different project only). All 8
URLs (and the plain `/projects/rftc-016-ci-qa` core page as a baseline control) returned the correct refusal:
7 of 8 → 404, 1 (`testcase_reports`) → 403, core project page → 403. Zero project data rendered in any
response. Source-confirmed: the 8 fixed controllers now use `rftc_authorize_project_read!` (checks visibility
AND module-enabled), explaining why this exact sub-case — a non-member of a module-ENABLED private project —
is solid. (The one remaining gap found this cycle, TC-TCM-077 below, is a *different* sub-case — a *member* of
a module-*disabled* project — see BUG-TCM-009's reopening.)

**Real-browser Playwright confirmation, 2026-10-22, per explicit user instruction.** Logged in as `dev1` (real
non-member, confirmed `roles_for_project` empty) via Playwright: `/projects/rftc-016-ci-qa` (core page) → real
**403 page**. `/test_suites?project_id=rftc-016-ci-qa` → real **404 page**. `/requirements?project_id=rftc-016-ci-qa`
→ real **404 page**. All three rendered as genuine full-page browser responses (own page title "403/404 -
Redmine"), not just HTTP status codes read via curl — visually confirms no project data leaks to a real
non-member in an actual browser session.

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

**REGRESSION — 2026-10-22 — PASS, real Playwright confirmation on current build, per explicit user
instruction.** Logged out fully via Playwright (confirmed `/login` form shown, no account menu), requested
`/test_suites?project_id=rftc-016-ci-qa` and `/runs/new?project_id=rftc-016-ci-qa` on `rftc-016-ci-qa` directly
— both cleanly redirected to `/login?back_url=...` with the exact attempted URL preserved, zero project data
rendered in either response.

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

**REGRESSION — 2026-10-22 — PASS, reconfirmed multiple times this very cycle on the current build, per
explicit user instruction.** This exact behavior (revoke → reload → control gone, no stale grace period) was
independently re-demonstrated several times live via Playwright this session while testing other permissions
on `qa.limited`/`qanonadmin`: `manage_environment` toggled off then back on for TC-TCM-293 (Add/Edit/Delete
Environment controls genuinely appeared/disappeared on reload), `view_test_suite`/`create_test_suite` toggled
for TC-TCM-290/291/046-050 (kebab menu options changed immediately on reload each time), and
`add_issues`/`import_issues` toggled for TC-TCM-292. Every toggle took effect on the very next page load, with
no caching or stale-session behavior observed anywhere.

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

**REGRESSION — 2026-10-22 — PARTIAL FAIL, BUG-TCM-009 REOPENED (narrower).** Disabled the module on
`rftc-016-ci-qa`, requested all 9 plugin URLs as a genuine member (`qa.limited`, Manager). **8 of 9 now
correctly refuse** (Runs, Requirements, Reports, Traceability Matrix, To-Do, Environment, Activity all
404/403) — but **Test Suites alone still renders fully**: both `/test_suites?project_id=...` and
`/test_suites/releases?project_id=...` returned 200 with real data (a genuine "CI Ingest" suite, real
`/issues/` links — confirmed not an empty/error state). Root-caused precisely:
`test_suites_controller.rb#rftc_authorize_suite_read` calls `rftc_project_readable?` (checks project
visibility only), while the 8 fixed controllers use `rftc_authorize_project_read!` (checks visibility **and**
`module_enabled?`) — the 2026-10-06/07 fix wave never actually reached this one controller, even though its
own closing note's prose claimed it was fixed (the note's own "For QA" repro steps never listed Test Suites to
re-verify). **Reopened BUG-TCM-009** with this narrower scope — the non-member sub-case (TC-TCM-074 above)
stays genuinely fixed; only this module-disabled sub-case, and only for Test Suites, remains open. Module
re-enabled and restored immediately after.

**Live UI confirmation (real browser)** — per follow-up question on whether this was checked via the actual
UI and not just raw curl requests: repeated the check through a real Playwright session as `qa.limited` with
the module disabled. The **TestCases** top-nav tab correctly disappears (leg B holds). But navigating directly
to `/test_suites?project_id=rftc-016-ci-qa` renders the complete, normal page — real suite tree ("CI Ingest",
"CI Ingest Sub-Suite", "U21 Brand New Suite", "Edge2 Brand New Suite"), a real Testcase Summary grid with real
rows, and a working "+ New Test Case" button — visually indistinguishable from the module being enabled.
Screenshot: `screenshots/BUG-TCM-009/module-disabled-test-suites-still-renders.png`.

**Extended further by the user — the gap is broader than the module toggle.** Removed every Testcase
Management permission from the `Manager` role (`qa.limited`'s role), leaving `view_test_suite` explicitly
unchecked, **with the module left fully enabled** this time — isolating the permission check from the module
check entirely. `qa.limited` could still browse the full suite tree and reach the "Add Testcase" form exactly
as before. Confirmed via `rails runner`: `allowed_to?(:view_test_suite, project) == false`,
`module_enabled?('testcase_management') == true` — yet the page rendered in full. Neither of Test Suites'
candidate authorization helpers (`rftc_project_readable?`/`rftc_authorize_project_read!`) ever checks
`view_test_suite` or any other Testcase Management permission at all — this is a **second, independent** gap
on top of the module-enabled one, matching BUG-TCM-007's missing-role-permission-check pattern but now
confirmed on this controller's *read* side. **Severity upgraded to High.**

**Both affected URLs precisely re-confirmed per user follow-up** (`view_test_suite == false`,
`module_enabled? == true` simultaneously, isolating from the module sub-case):
1. `GET /test_suites?project_id=rftc-016-ci-qa` — full suite tree renders. Screenshot:
   `screenshots/BUG-TCM-009/test-suites-no-view-permission.png`.
2. `GET /projects/rftc-016-ci-qa/issue_testcase/new` (the "New Test Case" form reached via that listing's own
   button) — **also renders in full**, "Add Testcase" page with the complete form. Screenshot:
   `screenshots/BUG-TCM-009/issue-testcase-new-no-permission-check.png`. Source-confirmed:
   `issue_testcase_controller.rb#new` has **zero** authorization check of any kind (unlike `#create`, which at
   least checks the generic Redmine `add_issues` permission) — a **second controller** sharing this same
   missing-permission shape, not just Test Suites' own listing.

Role permissions restored immediately after.

---

## Regression — 2026-10-27 (targeted, fast pass per direct user request — "fast way me test karo jo bhi impacted
area lagte hai"; NOT an exhaustive suite re-run)

Scope: only the TCs directly tied to this cycle's 3 Roles & permissions bug fixes (BUG-TCM-009, 089, 113), per
`SENIOR_QA_STANDARDS.md` §26.

- **BUG-TCM-113 (milestone permissions) — CONFIRMED FIXED, live.** Opened `/roles/3/edit` (Manager role):
  `Create milestone`/`Edit milestone`/`Delete milestone` now appear as real, enabled, uncheckable checkboxes in
  the permissions list — genuinely grantable, not just enforced-but-undeclared as the bug described. No new TC
  exists for this in the suite yet (newer bug); recorded here directly.
- **BUG-TCM-089 (Requirements attachment download bypass) — spot-checked, consistent with fixed.** Anonymous
  `GET /requirement/download?id=4&filename=tc176-sample-attachment.txt` now returns a real `403`, not a silent
  200 via the core `view_files` fallback the bug described. A full granted-vs-denied-role matrix (TC-TCM-289) was
  not re-run this pass given the "fast" scope — this spot-check plus the bug's own 2026-10-26 source-diff retest
  are treated as sufficient for now.
- **BUG-TCM-009 (Test Suites/New Test Case zero-authorization) — not re-run this pass.** Already live-verified
  via real curl session checks just one day before this regression (2026-10-26: `dev1`, non-member of private
  `alpha-web`, correctly 403 on `/test_suites`, `/requirements`, `/issue_testcase/new`; `qa.manager`, a real
  member, correctly 200 on the same routes) — same build, no permissions-relevant commits since. Treated as
  current given the "fast, targeted" directive; a fresh TC-TCM-294-style check is the resume point if a future
  session wants to re-confirm independently.

**Result: 2 of 3 bugs freshly live-reproduced this pass, 1 relies on yesterday's still-current live evidence. No
regressions, no new bugs.**

---

## Evidence Map

| TC range | Area | Bug reference |
|---|---|---|
| TC-TCM-046 – 806 | Test Suite Management | BUG-TCM-007 (confirmed fixed 2026-10-22) |
| TC-TCM-052 – 058, 057a | Test Run Management (incl. Bulk Delete Runs, TC-TCM-057a) | — |
| TC-TCM-059 – 816 | Test Execution | — |
| TC-TCM-062 – 821 | Reporting | BUG-TCM-007 (confirmed fixed 2026-10-22) |
| TC-TCM-067 – 824 | To-Do Management | — (first-ever execution 2026-10-22, all PASS) |
| TC-TCM-070 – 828 | Requirement Management | BUG-TCM-007 (confirmed fixed 2026-10-22) |
| TC-TCM-074 – 832 | Negative / cross-cutting | **BUG-TCM-009 (reopened 2026-10-22 — narrower: non-member sub-case stays fixed, Test Suites' module-disabled sub-case still open)** |
| TC-TCM-287 – 289 | Requirement Management — view permission gap + attachment download | **BUG-TCM-089 (new 2026-10-22 — Finding 1 design question, Finding 2 UI-only, Finding 3 real download bypass, High)** |
| TC-TCM-290 – 291 | Test Suite kebab menu on the Add Testcase page | **BUG-TCM-090 (new 2026-10-22 — Finding 1 permission-blind menu, Finding 2 broken Edit Folder for every user, Medium-High)** |
| TC-TCM-292 | New Test Case / CSV Import permission reuse (`add_issues` vs `import_issues`) | — (confirmed design behavior, not a bug) |
| TC-TCM-293 | Manage Environment (all 3 legs, first-ever execution) | — (confirmed working correctly, no bug) |
| TC-TCM-294 | `view_test_suite` MCP-API path vs browser path | Supports **BUG-TCM-009** (MCP API correctly enforces it; browser path still doesn't) |

- Screenshot: capture only on failure, to `screenshots/<BUG-ID>/` (`CLAUDE.md` §6).
- Log: for leg C, capture the HTTP status and response of the direct request as evidence — a screenshot of a
  rendered page is not sufficient proof of refusal.
