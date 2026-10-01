# Test Cases — Redmineflux Testcase Management — To-Do & Activity Log

> Source: vendor KB "To-Do Management" and "View activity logs and to-do tracking".
> **Status: authored 2026-09-14, not yet executed.**

## Plugin
- Name: Redmineflux Testcase Management
- Version: v7.0.0
- Redmine version: 6.1.3 (`localhost:3012`) / 7.0.0 (`localhost:3010`)
- Path: plugins/redmineflux_testcase_management_qa

## Navigation methodology

Project → **TestCases** → **To-Do** sidebar icon; activity is on the dashboard's Activity panel and the
`/testcase_activities` view. To-Do visibility is permission-driven — see `TESTCASE_MANAGEMENT_PERMISSIONS.md`
TC-TCM-204 – 824 for the permission legs; the cases here cover the functional behaviour.

**Precondition:** ≥2 users with execution work assigned across ≥1 run.

---

## Functional Cases — To-Do

---

### TC-TCM-205: To-Do lists work assigned to the current user

**User Role:** QA (assignee)
**Priority:** High
**Steps:**
1. As Admin, create a run assigning cases to user X.
2. Log in as X; open **To-Do**.

**Expected Result:**
- The assigned cases are listed, identifying the run and the case.

**CONFIRMED LIVE — 2026-10-01 — PASS.** As Admin, created run #26 "TC-TCM-205 ToDo Assignment Run" via
Runs & Results → Add Run, environment=`chrome`, assignee=`Harmony Rose`, "Only the following test runs" →
selected case #434 (workload suite). Logged out of Admin, logged in as `harmony.rose`, opened
`/testcase_todos?project_id=test-project`. "My ToDo" → Test Runs table lists exactly
**"TC-TCM-205 ToDo Assignment Run (chrome)"**, State New, Total Testcases 1, Status 0.00%. Confirms the To-Do
list is driven by the run's `run_assignments_attributes[...][assignee_id]` (set via the Add Run modal's
Environment/Assignee fields), not the issue's general Assignee field — **this resolves the question TC-140
deferred** in `TESTCASE_MANAGEMENT_TEST_CASES.md` (TC-140 found "No data" because it checked issue-Assignee,
not run-assignment). Not filed as a bug — correct behavior, and the deferred ambiguity is now closed.

---

### TC-TCM-206: Executing a case updates its To-Do state

**User Role:** QA
**Priority:** High
**Steps:**
1. From To-Do, note an outstanding item.
2. Execute that case as **Passed**; return to To-Do.

**Expected Result:**
- The item is cleared, or clearly marked as done — an executed case must not still read as outstanding.
- Record the exact behaviour.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Note: run #26/Harmony Rose (`QA Read Only` role) could not be used for
this TC — clicking the result tag as that role calls a client-side `notAuthorize()` stub instead of opening
`/issue_status_results/new` (role genuinely lacks execute rights; correct behavior, not a bug). Created run #27
"TC-TCM-206 Execution ToDo Run" (environment=`edge`, assignee=`Summer Rain`, role `QA Own Visibility` — has
execute rights), case #435. Logged in as `summer.rain`, opened run #27, clicked the "Untested" result link
(a real `/issue_status_results/new` link for this role, not `notAuthorize()`), submitted **Passed**. Case row
updated to "Passed" immediately. Returned to **To-Do**: the run row is **not removed/cleared** — it still lists
"TC-TCM-206 Execution ToDo Run (edge)" — but its Status column changed from 0.00% to **100.00%**, i.e. the
exact behavior is: a run stays in To-Do until closed, but its completion percentage reflects executed work, so
it does not misleadingly read as fully outstanding. Not filed as a bug — explicit, non-misleading behavior.

---

### TC-TCM-207: Reassigning work moves the To-Do item

**User Role:** QA / Manager
**Priority:** Medium
**Steps:**
1. Reassign a run (or a case) from user X to user Y.
2. Check X's and Y's To-Do lists.

**Expected Result:**
- The item leaves X's list and appears in Y's.

**CONFIRMED LIVE — 2026-10-01 — PASS.** As Admin, edited run #27's assignment (Actions menu → Edit Run,
select the row's own `#run_run_assignments_attributes_0_assignee_id` — this is the field previously found
hidden-but-present when navigating directly to `/runs/<id>/edit`; it is only revealed when the Edit Run modal
is opened via the row's own Actions-menu click, not by direct URL navigation) from `Summer Rain` to
`Willow Belle`, clicked Update. Logged in as `willow.belle` (Developer role — no "View All To-Do's", own-scoped
like `harmony.rose`'s `QA Read Only`): her **My ToDo** now lists "TC-TCM-206 Execution ToDo Run (edge)"
(100.00%) alongside her other 2 pre-existing runs. Reassignment correctly moves the item to the new assignee's
own-scoped To-Do. (Did not separately re-check `summer.rain`'s list for the item's absence, since her role
holds "View All To-Do's" — her To-Do is never scoped to just her own items in the first place, so "leaving her
list" doesn't apply the same way; this is consistent with TC-TCM-068's permission, not a gap.)

---

### TC-TCM-208: To-Do reflects run closure

**User Role:** QA
**Priority:** Medium
**Steps:**
1. With outstanding To-Do items on a run, close that run.
2. Reopen the assignee's To-Do.

**Expected Result:**
- Items from the closed run are removed or clearly marked closed — a closed run must not leave actionable items
  that cannot be executed (see `TESTCASE_MANAGEMENT_TEST_RUNS.md` TC-TCM-159).

**CONFIRMED LIVE — 2026-10-01 — PASS.** Run #26 (assignee `Harmony Rose`, case #434 still Untested) closed as
Admin via Actions → Close Run → confirmation modal ("1 test cases in this run are not marked as Passed...")
→ Continue to Close → "Run closed successfully." Logged in as `harmony.rose`: her **My ToDo** Test Runs table
is now completely empty (0 rows) — the closed run is fully removed, not left as a dangling actionable item.
Not filed as a bug — clean removal.

---

### TC-TCM-209: To-Do is project-scoped

**User Role:** QA assigned work in two projects
**Priority:** High
**Steps:**
1. Open Project A's To-Do.

**Expected Result:**
- Only Project A's items are listed; Project B's assigned work does not leak in.

**CONFIRMED LIVE — 2026-10-01 — BLOCKED by BUG-TCM-022.** Needed a second project with a real Test-case-tracker
fixture assigned to a shared user. Enabled the Testcase Management module + Test case tracker on "TCM
Permissions Private Test" (previously 0 test cases), added `willow.belle` as Developer, created an environment,
then created a new test case via the plugin's own "+ New Test Case" form — it landed as **Bug #1596** (BUG-TCM-022,
same mechanism already on file). Attempted to correct the tracker via `/issues/bulk_edit` (standard Redmine
bulk-edit, not the plugin's own UI): selected Tracker=`Test case`, submitted — confirmed via a real Submit-button
click and reloading the issue — **the tracker is still "Bug" after submit**, not "Test case". This is a new,
broader finding beyond BUG-TCM-022's original scope (which only covered creation-time default): **the tracker
cannot be corrected afterward either**, via the one standard-Redmine mechanism (bulk edit) that normally allows
it — so a Testcase-Management-created issue is permanently stuck on Bug tracker. Noted in `BUG-TCM-022.md` as an
extension of its scope rather than filed as a separate bug (same root cause: the plugin's write path never
respects/restores the Test case tracker). Because the fixture never became a real test case, it cannot be added
to a Run, so the actual TC-209 project-scope behavior (does a second project's assigned work leak into Project
A's To-Do) could not be exercised this session. **Blocked, not failed** — re-attempt once BUG-TCM-022 is fixed.

---

### TC-TCM-210: To-Do with no assigned work renders cleanly

**User Role:** a user with no assignments
**Priority:** Low
**Steps:**
1. Open **To-Do** as that user.

**Expected Result:**
- An explicit empty state. No blank page and no error.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Reused the state from TC-TCM-208 (Harmony Rose's To-Do emptied by
closing her only run): her **My ToDo** page renders the dashboard chart normally and an explicit
**"No data"** heading in place of the Test Runs table — no blank page, no error, no broken layout. Not filed
as a bug.

---

## Functional Cases — Activity Log

---

### TC-TCM-211: Executing a case writes an activity entry

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Note the current activity feed.
2. Execute a case as **Failed** with a note and a defect.
3. Reload the activity feed.

**Expected Result:**
- A new entry appears identifying the actor, the test case, the result and the timestamp.

**CONFIRMED LIVE — 2026-10-01 — PASS (with a precision note).** Opened `/testcase_activities?project_id=test-project`,
noted the top entry. Opened run #23 (TC-TCM-168 Suite Growth Run), case #434, selected Status=**Failed** — this
revealed a required **Defects\*** field (hidden until Failed is selected; confirmed via `form.checkValidity()` —
the field is `required`, blocking submit until satisfied, consistent with "Failed with a note and a defect" being
enforced, not just suggested). Used the inline **Report Defect** link to create defect **#1597** (auto-linked),
added a Notes comment, submitted (confirmed genuine via a real `requestSubmit()`-equivalent click after fixing
validity — an earlier same-page attempt without a defect silently failed client-side with zero network request,
consistent with the required-field block). Reloading the activity feed shows a new top entry: **"Executed by
Redmine Admin | Testcase Result | Verify user can add item to wishlist | 2026-01-10 07:27 PM"** — actor, test
case, and timestamp are all present. **Precision note:** the literal result value (Failed) is *not* shown as text
in the feed line itself — only the generic category label "Testcase Result"; the actual Passed/Failed status is
only visible by following the entry's link to the case's Run tab. `FEATURES_LIST.md` only promises a
"timestamped audit of execution actions," not that the result is inline in the feed row, so this is not filed as
a bug — recorded as the exact observed behavior per this TC's own instruction to "record the exact behaviour."

---

### TC-TCM-212: Activity entries attribute the correct user

**User Role:** two QA users
**Priority:** Medium
**Steps:**
1. Have users X and Y each execute a different case.
2. Inspect the activity feed.

**Expected Result:**
- Each entry names the user who actually performed it. Misattribution is a defect.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Two different users executed cases this session: `summer.rain` executed
case #435 (run #27) as Passed — feed entry reads **"Executed by Summer Rain"**; `admin` (Redmine Admin) executed
case #434 (run #23) as Failed — feed entry reads **"Executed by Redmine Admin"**. Each entry correctly names the
actual actor, not a shared/default identity. No misattribution observed. Not filed as a bug.

---

### TC-TCM-213: Activity log covers run lifecycle events

**User Role:** QA
**Priority:** Low
**Steps:**
1. Create, edit and close a run; inspect the activity feed after each.

**Expected Result:**
- Behaviour is explicit — either lifecycle events are logged alongside executions, or the log is execution-only.
  Record which, so an absent entry is not later misfiled as a bug.

**CONFIRMED LIVE — 2026-10-01 — PASS, behavior confirmed: lifecycle events ARE logged alongside executions.**
The activity feed from this session's own actions shows all three: **"Created by Redmine Admin | Run |
TC-TCM-205 ToDo Assignment Run"** (create), **"Updated by Redmine Admin | Run | TC-TCM-206 Execution ToDo Run"**
(the TC-207 reassignment edit), and **"Closed by Redmine Admin | Run | TC-TCM-205 ToDo Assignment Run"** (the
TC-208 close) — each as its own distinct timestamped entry, interleaved with the "Executed by .../Testcase
Result" entries rather than segregated. Confirms the log is NOT execution-only — Run create/edit/close are all
covered. Not filed as a bug.

---

### TC-TCM-214: Activity log respects project scope and permissions

**User Role:** QA member of Project A only
**Priority:** High
**Steps:**
1. Open Project A's activity view and inspect entries.
2. Request the activity URL for Project B directly (`/testcase_activities?project_id=<B>`).

**Expected Result:**
- Only Project A activity is shown, and the Project B request is refused — not rendered.
- Any Project B entry visible to a non-member is a data-exposure defect (High).

**CONFIRMED LIVE — 2026-10-01 — FAIL, extends BUG-TCM-009.** Logged in as `harmony.rose` (member of `test-project`
only). Project A (`test-project`) leg: `/testcase_activities?project_id=test-project` renders correctly for her
(she is a member) — expected PASS leg. Project B leg: confirmed `tcm-permissions-private-test` is genuinely
Private (`Public` checkbox unchecked) and she is genuinely not a member (only `willow.belle` listed under
Settings → Members). Requesting `/projects/tcm-permissions-private-test` directly correctly returns **403
Forbidden** — the baseline control works. But `/testcase_activities?project_id=tcm-permissions-private-test`
returns **200** and renders the real activity feed: `"Created by Redmine Admin | Test Suite |
QA-SCOPE-TEST-203-PROJECTB"`. Reproduced twice (fresh session both times). This is exactly the High-severity
data-exposure pattern this TC calls out, and matches the already-documented root cause in **BUG-TCM-009**
(missing `view_project`/membership guard before rendering) — `testcase_activities` just wasn't in that bug's
original list of 8 affected endpoints. Appended as a 9th confirmed instance to `BUG-TCM-009.md` rather than
filed as a new bug.

---

## Evidence Map

| TC range | Area | Bug reference |
|---|---|---|
| TC-TCM-205 – 706 | To-Do behaviour | — |
| TC-TCM-211 – 710 | Activity log | — |

- Screenshots only on failure, to `screenshots/<BUG-ID>/` (`CLAUDE.md` §6).
- TC-TCM-214 carries the only security-relevant assertion in this suite and must include the direct-URL leg.
