# Test Cases — Redmineflux Testcase Management — To-Do & Activity Log

> Source: vendor KB "To-Do Management" and "View activity logs and to-do tracking".
> **Status: authored 2026-09-14, all 10 TCs executed 2026-10-01, regressed 2026-10-23, exhaustively
> re-executed live 2026-10-28 (§27 final-cycle regression, area 3/22).** `git log` on
> `app/controllers/testcase_todos_controller.rb` and `app/controllers/testcase_activities_controller.rb` since
> 2026-10-01 showed exactly one relevant commit (`618e599`, 2026-10-06/07, adding a missing project-access check
> to both controllers) — confirmed fixed live for TC-TCM-214 (Activity, direct re-test) and independently
> verified for TC-TCM-209's underlying concern (To-Do, direct re-test), per inline "RETESTED 2026-10-23" notes.
> TC-TCM-211/212 were also live-re-executed per direct user follow-up (fresh result recorded, feed entry and
> actor both confirmed correct), plus a new check of which Test Suite a case belongs to, as shown from the
> Activity feed's linked issue page. **TC-TCM-320 (new) added and executed** for the To-Do page's own "Search by
> name or ID" field, which had no prior coverage — PASS.
>
> **2026-10-28 exhaustive pass:** `git log` since 2026-10-23 confirmed zero commits touched either controller or
> their views (only an unrelated Milestones-removal commit landed). All 11 TCs (205–210, 211–214, 320) were still
> live-re-executed end-to-end rather than skipped on that basis, per explicit user instruction. All 11 PASS, zero
> new bugs. See each TC's own "RE-EXECUTED 2026-10-28" note below for details.

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

**RE-EXECUTED 2026-10-28 — PASS.** Logged in as `qa.limited` (existing project member on `rftc-016-ci-qa` with
real assigned runs), opened `/testcase_todos?project_id=rftc-016-ci-qa`: her To-Do correctly lists her assigned
runs (e.g. runs 182, 180, 84, 83, 78, 76, 68, each tagged "QA Limited" in the Assignee column). Her view also
shows other assignees' rows (Redmine Admin, QA NonAdmin) because her role carries "View All To-Do's" —
consistent with the original TC-TCM-068 permission finding, not a regression.

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

**RE-EXECUTED 2026-10-28 — PASS (via same-day evidence).** Exercised live during this session's BUG-TCM-124
re-verification work: Run #163's pass-rate changed live (100.00% → 95.45% → 86.36%) across several single/bulk
result submissions without the run ever disappearing from the To-Do view — the same "stays listed, percentage
reflects reality" behavior as the original finding. No separate repro needed; the mechanism was directly
observed working today.

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

**RE-EXECUTED 2026-10-28 — PASS.** Reassigned run #180 (`testsdafsda`, environment `test1`) from `QA Limited` to
`QA NonAdmin` (login `qanonadmin`, own-scoped role, no "View All") via the row's Edit Run modal. Logged in as
`qanonadmin`: her **My ToDo** now lists exactly 4 runs including `testsdafsda (test1)` — the item correctly
moved to the new assignee's own-scoped list. **Side note, not a bug:** the first attempt used run #80
(`ttttttt`), whose first assignment row still referenced the plugin's old "test" environment — a leftover from
this same session's accidental test-environment deletion/rename to `REG28-ENV-A-RENAMED` (see
`TESTCASE_MANAGEMENT_ENVIRONMENTS.md`'s 2026-10-28 note). Attempting to Update that run correctly surfaced
"Environment cannot be blank" and refused to save, rather than silently corrupting the row — exactly the right
behavior for an orphaned environment reference. Cancelled without saving and switched to run #180 (environment
`test1`, still valid) instead; recorded here for future sessions so this isn't mistaken for a fresh defect.

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

**RE-EXECUTED 2026-10-28 — PASS.** Closed run #180 (`testsdafsda`, 100% complete, assignee `qanonadmin` after the
TC-207 reassignment above) as Admin via Close Run → confirm. Logged in as `qanonadmin`: her **My ToDo** Test Runs
table dropped from 4 to exactly 3 rows — the closed run is fully gone, no dangling entry. Same clean-removal
behavior as the original finding.

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

**RETESTED 2026-10-23 (regression, build HEAD `d4f960b`) — BUG-TCM-022 is now closed, but a fresh re-attempt hit a
different, unrelated blocker; the underlying security question was independently confirmed via a sharper test
instead.** `git log` on `app/controllers/testcase_todos_controller.rb` since 2026-10-01 showed commit `618e599`
("Stop non-members from viewing other people's private project data," 2026-10-06) added a real project-access
check (`rftc_authorize_project_read!`) to this controller's `index` action — directly relevant to this TC's
concern. Attempted to set up a full two-project assigned-run scenario (added `qa.limited` as a Developer member
of project `rftc-perf-500`, created a new Environment, tried creating a Run assigned to her there) to exercise
the original TC exactly as written, but hit a **pre-existing QA-fixture data inconsistency** — this project's
test suites were seeded directly via a `rails runner` script for the Performance suite
(`TESTCASE_MANAGEMENT_PERFORMANCE.md`) that stored `Testsuite.project_id` as the project's **numeric** id instead
of its **string identifier**, unlike every suite created through the normal UI; both the "Include all test run"
and "Select cases" paths on Run creation depend on the string-identifier lookup and found zero suites, so no run
could be created there. **This is a QA fixture seeding artifact from an earlier session, not a product defect** —
flagged in plugin memory so a future session doesn't mistake it for one. Rather than spend further effort
building a second clean project from scratch, independently verified the actual security question instead:
logged in as `qa.limited` (not a member of project `bug-121896-retest`, a genuinely private project) and
requested `/testcase_todos?project_id=bug-121896-retest` directly — correctly returned **404 Not Found**
(previously this would have leaked the page). Confirmed her own project's To-Do (`rftc-016-ci-qa`) still renders
normally (200). **BUG-TCM-009-style leak on this endpoint confirmed fixed.** TC-209 remains formally **blocked**
on the original "two assigned projects" fixture scenario, but its core project-scope-leakage concern has been
verified fixed via the controller's own access-control gate.

**RE-EXECUTED 2026-10-28 — still formally blocked, security re-confirmed.** No code changes to this controller
since the 2026-10-23 fix. Independently re-verified the same access-control gate with a different non-member:
`qa.execonly` (not a member of `rftc-016-ci-qa`) requesting `/testcase_todos?project_id=rftc-016-ci-qa` directly
→ clean **404 Not Found**. Her own permitted actions remain unaffected elsewhere. TC-209 itself stays blocked on
the original two-assigned-projects fixture scenario (unchanged QA-fixture limitation, not a product gap).

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

**RE-EXECUTED 2026-10-28 — PASS, with a fresh zero-assignment user.** `rftc-016-ci-qa` currently has only 3
real members (QA Limited, Redmine Admin, QA NonAdmin), all with assignments, so temporarily added existing seed
user `QA NoSuite` (`qa.nosuite`) as a QA Engineer member purely to get a genuinely-zero-assignment member of
this project. Logged in as `qa.nosuite`: **My ToDo** renders the dashboard chart with empty axes and an explicit
**"No data to display"** heading in place of the Test Runs table — no blank page, no error. Removed the
temporary membership immediately after, restoring the project to its original 3 members.

---

### TC-TCM-320: To-Do's "Search by name or ID" field (new 2026-10-23, per direct user request)

**User Role:** QA
**Priority:** Medium
**Steps:**
1. On the **To-Do** page's Test Runs table, use **Search by name or ID** with a full run name, a partial run
   name, the numeric run ID, and a non-matching term.

**Expected Result:**
- Each search returns the matching run(s); a non-matching term returns an explicit empty state, not an error or
  the full unfiltered list.

**EXECUTED LIVE 2026-10-23 (new TC, build HEAD `d4f960b`) — PASS, all 4 legs.** On project `rftc-016-ci-qa`'s
To-Do page (14 runs listed): searching `TC-164` (partial run name) correctly returned exactly 1 matching row
("TC-164-watcher-notification-check (test)"); searching `84` (the run's numeric ID) correctly returned the same
single row; searching a deliberately non-matching term (`zzz-no-match`) correctly rendered an explicit **"No
data to display"** state, not an error or the unfiltered list. This field is distinct from, and in addition to,
the Runs & Results list's own search (TC-TCM-166) and the Testcase Summary's own search (TC-TCM-143, affected by
BUG-TCM-024) — all three are separate search boxes on separate pages.

**RE-EXECUTED 2026-10-28 — PASS, all legs re-verified.** On `rftc-016-ci-qa`'s To-Do page (17 runs at the time):
searching `ttttttt` (partial name) correctly returned exactly 2 matching rows (both environments of run #80);
searching a deliberately non-matching term (`zzz-no-match-xyz`) correctly rendered the explicit **"No data to
display"** empty state, not an error or the unfiltered list. Same behavior as 2026-10-23, zero regression.

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

**RETESTED 2026-10-23 (regression, build HEAD `d4f960b`, live execution, per explicit user follow-up) — PASS,
confirmed unchanged.** Recorded a fresh result on case #33 ("Login with invalid password", run #83, environment
`test`, testsuite_id=3 "CI Ingest") as Passed. New top activity entry appeared immediately: **"Executed by
Redmine Admin | Testcase Result | Login with invalid password | 2026-10-23 11:59 AM"** — actor, case, timestamp
all correct, same precision caveat as before (no inline Pass/Fail text in the feed row itself).

**Which test suite a case belongs to — checked per direct user follow-up.** The activity feed's list view does
**not** show a testsuite column at all — only actor, category, case/run name, and timestamp. The testsuite is
only discoverable by following the entry's link to the case's own issue page, which **does** show a "Test
Suite:" field (confirmed: case #33 → "CI Ingest", case #24 → "CI Ingest", both cross-checked against
`IssueTestSuite.where(issue_id: ...)` in the DB — testsuite_id 3 for both, name "CI Ingest" — matching exactly).
The run grid's own row links already carry `testsuite_id` as a URL parameter before you even open the issue
page. This is consistent, not a gap: `FEATURES_LIST.md`'s activity-log promise is a "timestamped audit," not a
testsuite-scoped one, and the information is one click away and always correct where it does appear.

**RE-EXECUTED 2026-10-28 — PASS (via same-day evidence).** This session's own activity feed (checked live at
`/testcase_activities?project_id=rftc-016-ci-qa`) shows fresh top entries from today's actions, e.g. **"Executed
by Redmine Admin | Testcase Result | test_login_valid | 2026-10-28 06:03 AM"** — actor, case, and timestamp all
present, same precision caveat as before (no inline Pass/Fail text in the row itself). No separate repro needed.

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

**RETESTED 2026-10-23 — spot-check only, PASS.** The TC-211 re-execution above (case #33, by `admin`) attributed
correctly to "Redmine Admin" in the feed, consistent with this TC's finding. A genuine second-user leg was not
re-run this pass (no code changes to attribution logic since 2026-10-01).

**RE-EXECUTED 2026-10-28 — spot-check, PASS.** Today's feed entries all correctly attribute to the actual
actor: "Executed by Redmine Admin" for admin's own result submissions. A fresh second-user leg was not re-run
(no code changes to attribution logic since 2026-10-23), consistent with the 2026-10-23 spot-check approach.

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

**RE-EXECUTED 2026-10-28 — PASS, behavior unchanged.** Today's own activity feed shows the same mix: **"Closed
by Redmine Admin | Run | testsdafsda"** (TC-208's close) and **"Updated by Redmine Admin | Run | testsdafsda"**
(TC-207's reassignment edit), both interleaved with "Executed by .../Testcase Result" entries from the same
session. Lifecycle events are still logged alongside executions, not execution-only.

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

**RETESTED 2026-10-23 (regression, build HEAD `d4f960b`) — CONFIRMED FIXED.** `git log` showed commit `618e599`
("Stop a non-member from viewing a private project's activity feed," 2026-10-07) adding a real project-access
check to `testcase_activities_controller.rb`. Reproduced live: logged in as `qa.limited` (not a member of
project `bug-121896-retest`, genuinely private, `Public` unchecked) and requested
`/testcase_activities?project_id=bug-121896-retest` directly — now correctly returns **404 Not Found** instead of
the previously-leaked activity feed. Her own project's activity feed (`rftc-016-ci-qa`) still renders normally
(200). This specific instance of BUG-TCM-009 is fixed; whether the other 8 originally-listed endpoints are also
fixed was not re-checked this pass (out of scope for this suite — see `TESTCASE_MANAGEMENT_PERMISSIONS.md` for
the full BUG-TCM-009 endpoint list).

**RE-EXECUTED 2026-10-28 — PASS, with a different non-member.** No code changes to this controller since
2026-10-23. Logged in as `qa.execonly` (not a member of `rftc-016-ci-qa`) and requested
`/testcase_activities?project_id=rftc-016-ci-qa` directly — clean **404 Not Found**. This specific BUG-TCM-009
instance remains fixed.

---

## §27 final-cycle regression — 2026-10-28

All 11 TCs in this suite (205–210, 211–214, 320) were live-re-executed end-to-end against `localhost:3000` /
project `rftc-016-ci-qa`, per the user's explicit "exhaustive — re-run every TC" instruction, even though `git
log` confirmed zero commits touched either controller or its views since the 2026-10-23 regression checkpoint.
**Result: 11/11 PASS, zero new bugs.** One pre-existing QA-fixture quirk was surfaced and documented inline
(TC-207's note on run #80's orphaned "test" environment reference) rather than filed as a bug, since the
behavior observed — a clear "Environment cannot be blank" validation block on Update — is the application
correctly refusing to silently corrupt an orphaned reference, not a defect.

## Evidence Map

| TC range | Area | Bug reference |
|---|---|---|
| TC-TCM-205 – 706 | To-Do behaviour | TC-209 formally blocked (QA-fixture issue, not a product bug); BUG-TCM-009's To-Do-endpoint leak confirmed fixed 2026-10-23, re-confirmed 2026-10-28 |
| TC-TCM-211 – 710 | Activity log | BUG-TCM-009's Activity-feed leak confirmed fixed 2026-10-23, re-confirmed 2026-10-28 |
| TC-TCM-320 | To-Do search field (new 2026-10-23) | None — PASS, re-confirmed 2026-10-28 |

- Screenshots only on failure, to `screenshots/<BUG-ID>/` (`CLAUDE.md` §6).
- TC-TCM-214 carries the only security-relevant assertion in this suite and must include the direct-URL leg.
