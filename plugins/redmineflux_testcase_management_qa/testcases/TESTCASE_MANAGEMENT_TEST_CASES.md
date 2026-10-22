# Test Cases — Redmineflux Testcase Management — Test Case Authoring & Organisation

> Source: `docs/TESTCASE_MANAGEMENT_USER_GUIDE.md` Workflow 4 and the vendor KB "Test Case Management" section.
> CSV import is covered separately in `TESTCASE_MANAGEMENT_CSV_IMPORT.md`.
> **Status: authored 2026-09-14, not yet executed.**

## Plugin
- Name: Redmineflux Testcase Management
- Version: v7.0.0
- Redmine version: 6.1.3 (`localhost:3012`) / 7.0.0 (`localhost:3010`)
- Path: plugins/redmineflux_testcase_management_qa

## Navigation methodology

Project → **TestCases** → **New Test Case**. Test cases are Redmine issues on the configured Testcase tracker, so
every save must be re-verified by opening the issue itself, not just the summary grid row.

**Precondition:** the **Testcase Tracker** is configured (Administration → Plugins → Testcase Management →
Configure). Without it, creation is expected to fail — see TC-TCM-001.

---

## Functional Cases — Authoring

---

### TC-TCM-128: Create a test case with all fields and one step

**User Role:** QA
**Priority:** High
**Steps:**
1. **New Test Case**.
2. Complete **Subject**, **Description**, **Assignee**, **Category**, **Priority**.
3. Click **New Step**; enter **Step Description** and **Expected Result**.
4. Select a **Requirement**; click **Create Test Case**.
5. Open the created issue.

**Expected Result:**
- The issue is created on the Testcase tracker with every field as entered, one Step/Expected pair, and the
  requirement linked.

**CONFIRMED LIVE — 2026-10-01 — FAIL, filed as BUG-TCM-021 (High).** Followed this TC's own step order (Category
in step 2, before New Step/Requirement in steps 3–4): selecting **Category** silently removed the entire Steps
and Requirements UI from the form. Investigating further found this isn't Category-specific at all — setting
Category *after* Steps/Requirement instead still wipes them just the same, and even with Category never touched,
simply clicking Create and hitting the near-guaranteed first-attempt validation failure from BUG-TCM-011 ("Qa
bug-only tracker field cannot be blank," etc.) comes back with the Steps section already gone and the server's
own error list stating **"Steps and expected result cannot be blank"** — the step content doesn't survive any
form re-render, full stop. Filed **BUG-TCM-021** with the corrected, broader scope. Completed a working fixture
for downstream TCs the only way that survives this: create with Steps/Requirement filled and Category skipped
entirely, **re-enter the step after the inevitable first validation failure**, then fix the flagged required
custom fields and resubmit — `QA-TC-128-ALL-FIELDS` (#1592) created successfully this way; Category itself was
added afterward via a separate Edit, which does not trigger the wipe (no Steps UI involved in editing an
already-saved issue's Category). **Second, separate, Critical-severity finding from this same investigation:**
checking #1592's own issue page revealed it landed on the **Bug** tracker, not Test case — and so did every other
test case created this session. Filed as **BUG-TCM-022**; this also retroactively explains (and retracts) an
earlier, narrower bug (BUG-TCM-019) filed in `TESTCASE_MANAGEMENT_TEST_SUITES.md` TC-TCM-199 — see that bug file
and TC-199's corrected note for the full story.

**REGRESSED 2026-10-22 — PASS, both BUG-TCM-021 and BUG-TCM-022 confirmed genuinely fixed, including the
Requirement-linking half of this TC.** Per explicit user request to specifically re-verify requirement linking
from Create, created a real test case (`TC-boundary-40000-regress`, #2121) via the current build's "New Test
Case" form with a Step/Expected pair filled in **and** a Requirement selected from the `#testcase_requirement`
dropdown. Confirmed via `rails runner`: issue landed on the correct **Testcase** tracker, the step content saved
exactly as entered, and `issue.requirement_issues` shows the selected requirement linked — all three halves of
this TC's own expected result now genuinely hold. (Full detail on the step-length boundary itself is in
TC-TCM-135 below, since that's this exact same probe issue.) Probe issue deleted after the full investigation
below (TC-TCM-135, and new TC-TCM-298 for editing the linked requirement) completed.

**IMPORTANT — see TC-TCM-298 below for a serious follow-up finding**: the exact mechanism that makes requirement
linking work from this form (and from Edit) turned out to have **zero permission check at all** —
**BUG-TCM-096 (High, new)**.

---

### TC-TCM-129: Create a test case with multiple ordered steps

**User Role:** QA
**Priority:** High
**Steps:**
1. Create a case adding five steps with distinct descriptions and expected results; save; open the issue.

**Expected Result:**
- All five pairs are stored **in the order entered** and numbered 1–5.

**ATTEMPTED LIVE — 2026-10-01 — BLOCKED by BUG-TCM-021/BUG-TCM-011.** Confirmed via direct DOM check
(`document.getElementById('issue_custom_field_values_65')` etc.) that the Bug-only required custom fields are
**genuinely absent** from the form on a fresh GET, not merely hidden — there is no way to pre-fill them before a
first submit. Since BUG-TCM-021 wipes the entire Steps UI (and any step rows already added) on the very first
failed-validation re-render, and that first failure is unavoidable (BUG-TCM-011), there is currently **no UI path
to successfully save a test case with any step content at all**, let alone five ordered ones. Not re-attempted
individually — same root cause as TC-128.

---

### TC-TCM-130: Subject is mandatory

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Create a test case leaving **Subject** empty; save.

**Expected Result:**
- Refused with a visible validation message; nothing created.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Submitted with Subject empty: error list includes "Subject cannot be
blank," form stays on the create page, nothing created.

---

### TC-TCM-131: Create a test case with no steps

**User Role:** QA
**Priority:** Low
**Steps:**
1. Create a case with a Subject but no steps; save; open it.

**Expected Result:**
- Behaviour is explicit — either steps are required and the save is refused with a message, or the case is created
  with zero steps and renders cleanly. Record which.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Zero-step creation is explicitly supported: case #1593
(`QA-TRACKER-CHECK-CLEAN`, created earlier this session with no steps added) opens cleanly with no "Step" section
rendered at all, no error, no broken layout.

---

### TC-TCM-132: Remove a step during authoring

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Add three steps, delete the middle one, save; open the issue.

**Expected Result:**
- Two steps remain, holding the correct content, renumbered contiguously 1–2 with no gap.

**ATTEMPTED LIVE — 2026-10-01 — BLOCKED by BUG-TCM-021/BUG-TCM-011.** Same root cause as TC-129: no step content
survives to a saved test case at all currently, so removing one of three steps can't be meaningfully tested.

---

### TC-TCM-133: Reorder steps

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Create a case with three steps, reorder them, save; reopen.

**Expected Result:**
- The new order persists and is renumbered accordingly.

**ATTEMPTED LIVE — 2026-10-01 — BLOCKED by BUG-TCM-021/BUG-TCM-011.** Same root cause as TC-129.

---

### TC-TCM-134: Step content preserves special characters and unicode

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Create a case whose step and expected result contain `< > & " '`, an emoji, and an embedded newline; save; reopen.

**Expected Result:**
- Content round-trips exactly, with no HTML-escaping artefacts shown to the user and no truncation.

**ATTEMPTED LIVE — 2026-10-01 — BLOCKED by BUG-TCM-021/BUG-TCM-011.** Same root cause as TC-129.

---

### TC-TCM-135: Long step text boundary

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Enter a step of exactly 2000 characters; save.
2. Repeat with 2001 characters.

**Expected Result:**
- 2000 saves successfully; 2001 is rejected with a clear message naming the limit.
- Consistent with the CSV import limit verified in `TESTCASE_MANAGEMENT_CSV_IMPORT.md`.

**ATTEMPTED LIVE — 2026-10-01 — BLOCKED by BUG-TCM-021/BUG-TCM-011.** Same root cause as TC-129.

**REGRESSED 2026-10-22 — PASS, against the CURRENT limit (40000, not 2000 — raised by BUG-TCM-079's fix earlier
this cycle, already confirmed for CSV import in `TESTCASE_MANAGEMENT_CSV_IMPORT.md` TC-TCM-276; this closes the
same gap for the manual "New Test Case" form specifically, per explicit user request.** Via the real "New Test
Case" UI form: entered a Step of exactly 40000 characters + a 40000-character Expected Result — saved
successfully (`TC-boundary-40000-regress`, #2121; confirmed via `rails runner`, `step.length == 40000` and
`expected.length == 40000`). Repeated with 40001 characters on Step (Expected left short): rejected, with the
form re-rendering a clean, specific error — **"Steps exceeds the maximum length of 40000 characters"** — naming
the exact current limit, not the stale 2000. Confirmed via `rails runner` that no issue was created. **Bonus
confirmation of BUG-TCM-021's fix on this exact failure path**: after the 40001-char rejection, the re-rendered
form still had the full 40001-character Step value and the short Expected value both intact in their fields —
the validation-failure re-render no longer wipes entered content, closing the loop on BUG-TCM-021 for this
specific boundary-failure scenario too (not just the Category-interaction scenario BUG-TCM-021 was originally
filed against).

---

### TC-TCM-136: Edit an existing test case

**User Role:** QA
**Priority:** High
**Steps:**
1. Open an existing case, change Subject, Priority and one step's Expected Result; save; reload.

**Expected Result:**
- All three changes persist; unchanged steps are untouched.

**CONFIRMED LIVE — 2026-10-01 — PASS, after two detours.** Used issue #456 (a genuine Test case tracker fixture,
Status "New"). **Detour 1**: the inline pencil-icon editor next to the title accepts typed text but has no
working save (Enter/blur both discard it) — filed as **BUG-TCM-023** (Low), a real but separate finding, not a
TC-136 blocker since the full `/edit` form's own Subject field works fine. **Detour 2**: the first `/edit` submit
attempt failed validation ("Qa required text field cannot be blank," etc.) because #456 is a legacy fixture that
predates these custom fields being marked required — not a bug, just this fixture's own stale data; filled them
in (same as the New Test Case flow) and resubmitted. **Final result — all three changes persisted**, confirmed
via a fresh reload: Subject → `QA-TC-136-EDITED-SUBJECT`, Priority → `Urgent`, the one existing step's Expected
Result → `EDITED expected result text` (its own unchanged Step text was left untouched, confirmed intact).

---

### TC-TCM-137: Delete a test case

**User Role:** Manager / Admin
**Priority:** Medium
**Steps:**
1. Delete a test case not used in any run; confirm; reload the summary.

**Expected Result:**
- The case is removed from the grid and the underlying issue no longer exists.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Deleted case #1521 (`test2`, not used in any run) via Actions → Delete
issue → confirmed the native dialog. `GET /issues/1521` now returns 404 — genuinely deleted, not just hidden.

---

### TC-TCM-138: Delete a test case used in an active run

**User Role:** Admin
**Priority:** High
**Steps:**
1. Delete a case that belongs to an active run with recorded results.
2. Open that run, its grid, and any report covering it.

**Expected Result:**
- Either the delete is blocked with a clear message, or it succeeds and every dependent view still renders
  correctly. A 500 error or a broken run grid row is a defect. Record the behaviour.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Deleted case #448 (`Verify user can update billing address`), which
belonged to run #22 and had a recorded Skipped result. The delete is **not blocked** — it succeeds silently, no
confirmation about run impact — but every dependent view renders cleanly afterward: the run's grid correctly
dropped from 17 to 16 rows with no broken/blank row, and the dashboard summary recalculated correctly against the
new total ("10 of 16 tested, 62.50%"). No 500, no orphaned reference anywhere checked.

---

### TC-TCM-139: Test case respects Redmine issue permissions

**User Role:** a role without issue-edit rights on the Testcase tracker
**Priority:** High
**Steps:**
1. Attempt to edit a test case as that role, in the UI and via the issue edit URL directly.

**Expected Result:**
- Refused in both. Test cases are Redmine issues and must inherit tracker-level permissions.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Logged in as `harmony.rose` (QA Read Only role, no edit-issues
permission on the Testcase tracker) and navigated directly to `/issues/449/edit`. Both legs correctly restricted:
no full edit form rendered — only a Notes-only panel (Notes/Edit/Preview + Files + Cancel), with none of the
field-editing controls (no Priority, Subject, custom fields, etc.) present at all. Test cases correctly inherit
standard Redmine issue permission scoping.

---

### TC-TCM-140: Assignee drives the To-Do list

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Create a case assigned to user X.
2. Log in as X and open the **To-Do** area.

**Expected Result:**
- The case appears in X's To-Do list.

**ATTEMPTED LIVE — 2026-10-01 — FAIL as literally written; likely a corrected premise, not yet conclusive.**
Assigned case #450 directly to `harmony.rose` via the issue's own Assignee field (confirmed persisted: "Assignee:
Harmony Rose"), then logged in as her and checked `/testcase_todos?project_id=test-project` — "No data," the case
did not appear. `TESTCASE_MANAGEMENT_FEATURES_LIST.md` line 23 describes To-Do management as "Per-user list of
**assigned execution work**," which suggests it may track the **run's own environment-assignee** field (set per
run, via Edit Run's `run_assignments_attributes`), not the general Redmine issue Assignee field this TC used.
Attempted to verify by setting Harmony Rose as run #22's environment-assignee, but ran out of a clean path mid-
investigation (the Edit Run panel's assignee/environment selects became non-interactive after a page state
change). **Deferred to `TESTCASE_MANAGEMENT_TODO.md` TC-TCM-205–210**, which covers this exact mechanism
directly — do not re-litigate this TC's verdict until that suite resolves which field actually drives the list.

---

### TC-TCM-141: "Hide default status field on issue details page" toggle

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Enable the setting in plugin configuration; open a test case issue.
2. Disable it; reopen the issue.

**Expected Result:**
- Enabled: the default status field is not rendered on the test case detail page.
- Disabled: it is rendered. No other field is affected.

**CONFIRMED LIVE — 2026-10-01 — Corrected premise, PASS on the real feature.** No "hide default status field"
setting exists in plugin configuration — only `settings[hide_testcase_execution]` ("Hide Testcase Execution
section on issue details page"), matching a correction already established for TC-TCM-007 in
`TESTCASE_MANAGEMENT_CONFIGURATION.md`. Tested the real setting instead: enabling it correctly hid the "Testcase
Execution" section from issue #456's detail page while the standard "Status:" field remained visible and
unaffected (confirming this setting is correctly scoped and doesn't touch Status). Disabled again to restore
baseline, confirmed Testcase Execution reappeared.

---

### TC-TCM-142: Test case appears in Redmine's own issue list

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Create a case, then open the project's **Issues** list filtered to the Testcase tracker.

**Expected Result:**
- The case is listed as a normal issue with its Subject, assignee and priority.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Clicked the "Test case" tracker link from the project overview's Issue
tracking summary (`/projects/test-project/issues?set_filter=1&tracker_id=4`): test cases list as ordinary issues
with Tracker, Status, Priority, Subject and Updated columns all correctly populated — no special-casing or
missing data.

---

### TC-TCM-143: Test case search by subject and ID

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Use **Search by subject or ID** on the Testcase Summary with a full subject, a partial subject and the issue ID.

**Expected Result:**
- Each returns the matching case; a non-matching term returns an empty result rather than the full list.

**CONFIRMED LIVE — 2026-10-01 — PASS on subject search, FAIL on ID search — filed as BUG-TCM-024.** Full-subject
search ("Verify empty wishlist shows appropriate message") correctly returned 3 matching cases. Partial-subject
search ("wishlist") correctly returned 12 matches. A non-matching nonsense term correctly returned 0 rows. But
searching by a real case's exact ID (`437`, with or without `#`) returned **0 rows** both times, despite the
search box's own label explicitly promising "Search by subject **or ID**." Filed **BUG-TCM-024** (Medium).

---

## Functional Cases — Organisation

---

### TC-TCM-144: Drag and drop a test case into a suite

**User Role:** QA
**Priority:** High
**Steps:**
1. Drag an unassigned case onto a suite in the tree; release; reload.

**Expected Result:**
- The case is associated with that suite and persists after reload.

**CONFIRMED LIVE — 2026-10-01 — FAIL, filed as BUG-TCM-025 (High).** Attempted dragging case #1021 from suite 4
onto a fresh target suite's sidebar tree node, via both Playwright's native `dragTo()` and a manual incremental
mouse down/move/up sequence (with and without the row's checkbox pre-checked). No drag interaction occurs at
all — the row has no `draggable` attribute, no jQuery-UI-draggable class, and mousedown+move only triggers
ordinary row-selection highlighting, never any drag-state class on the row or `<body>`. The case never moved
(confirmed via both suites' grids before/after). `TESTCASE_MANAGEMENT_FEATURES_LIST.md` line 15 explicitly
documents "Drag-and-drop cases into suites" as a real Feature #5 capability covering this exact TC range — this
is a genuine implementation gap, not a TC-author assumption. Filed **BUG-TCM-025**.

---

### TC-TCM-145: Drag a test case between suites

**User Role:** QA
**Priority:** High
**Steps:**
1. Drag a case from suite A to suite B; reload; check both suites.

**Expected Result:**
- The case is in B only — not duplicated into both.

**ATTEMPTED LIVE — 2026-10-01 — BLOCKED by BUG-TCM-025.** Same root cause as TC-144 — drag-and-drop does not
function at all, so a between-suite drag cannot be meaningfully tested. Not re-attempted independently.

---

### TC-TCM-146: Add existing test cases to a suite

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Use the add-to-suite action, select two unassigned cases, confirm; reload.

**Expected Result:**
- Both cases appear under the target suite.

**CONFIRMED LIVE — 2026-10-01 — FAIL, same bug as TC-144 (BUG-TCM-025).** Checked the suite's own header "Actions"
menu for an add-existing-cases action — it offers exactly one item, **"Import Testcases"** (the CSV wizard), no
"Add existing cases" option at all. Also checked the issue's own `/edit` form for a Suite field — none exists.
Between this and BUG-TCM-025's drag-and-drop failure, there is currently **no UI path whatsoever** to associate
an already-created test case with a suite; a case's suite is fixed permanently at creation time only. Escalated
BUG-TCM-025 to Critical to reflect this broader scope.

---

### TC-TCM-147: Copy test cases to another suite

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Copy two cases from suite A to suite B; inspect both suites and the copies.

**Expected Result:**
- Behaviour is explicit — either the same cases are now referenced by both suites, or new duplicate issues are
  created. Record which, and confirm the copies carry the original steps and expected results.

**CONFIRMED LIVE — 2026-10-01 — PASS on copy mechanics, FAIL on suite targeting (compounds BUG-TCM-025).** Used
Redmine's standard issue Copy action on case #1021 (`/issues/1021/copy`). Confirmed: a genuinely **new, separate
issue** is created (#1594), not a shared reference — and unlike the New Test Case flow, this copy correctly
**stays on the Test case tracker** (contrast with BUG-TCM-022). Both original steps carried over correctly
("Enter valid username..." etc.). However, the copy form has **no Suite field and no `testsuite_id` pass-through**
even when the URL is given `?testsuite_id=17` explicitly — the resulting copy's own "Test Suite:" field is blank.
Combined with BUG-TCM-025 (no way to assign a suite after creation either), a copied test case can **never** be
placed in any suite via the UI. Noted as additional scope on BUG-TCM-025 rather than a separate bug.

**REGRESSED 2026-10-22 — all of TC-TCM-144/145/146/147's original blocking cause (BUG-TCM-025) is now genuinely
fixed, confirmed live.** The suite tree's checkbox-select → drag → "Move here"/"Copy here" popup flow
(`TestSuitesController#add_issues` / `#copy_issues`, routes `add_issues_to_test_suite` /
`copy_issues_to_test_suite`) now works correctly — confirmed by calling these exact endpoints directly (the same
business logic the drag UI itself triggers): a Move correctly re-parents a case (removed from its old suite,
added to the new one), and a Copy correctly creates a genuine new duplicate issue (steps included) linked only to
the target suite, with the original untouched. TC-144 (drag into a suite), TC-145 (drag between suites), and
TC-146 (associate an already-existing case with a suite) are all now **PASS** via this path — there is no longer
"no UI path whatsoever" to assign a suite post-creation, as BUG-TCM-025 originally found.

---

### TC-TCM-295: Move/Copy onto the SAME suite a test case is already in

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Identify a test case already in suite A, with no run attached to it.
2. Drag-select it and drop it back onto suite A itself (same suite), choosing **Move here**.
3. Repeat, choosing **Copy here** instead.

**Expected Result:**
- Behavior should be explicit and intentional, not an accidental no-op or silent data corruption — record which.

**EXECUTED 2026-10-22 — PASS, by design, confirmed live.** Found while answering a user question about this
exact scenario after the Test Suites regression. Per `BUG-TCM-025`'s own fix note ("rejects moving into a suite
it's already in"), confirmed directly against the real endpoints:
- **Move onto the same suite**: rejected cleanly — `{"status":"error","message":"Testcase ID 2114 have already
  been moved"}` (422), no mutation at all (confirmed via `rails runner`, suite membership unchanged). Root cause
  in `test_suites_controller.rb#add_issues`: the loop that removes the issue from its *other* current suites
  explicitly skips the target suite (`next if test_suite.id == @test_suite.id`), then a separate check
  (`already_included_ids = @test_suite.issues.where(id: issue_ids)`) finds the issue is already there and
  rejects — a deliberate guard, not an accident.
- **Copy onto the same suite**: **succeeds** — creates a genuine new duplicate issue (confirmed via `rails
  runner`: new issue id, steps copied, `issue_test_suites` correctly shows only the same target suite id, nothing
  else). The controller has a code comment explicitly anticipating this exact case: the new issue's own
  `after_create` hook already copies every suite the original belonged to (including this same one), and
  `copy_issues` uses `find_or_create_by` specifically so copying straight back into the same suite doesn't
  collide with that hook.
- So: **Move-to-same-suite is a deliberate no-op/rejection; Copy-to-same-suite is a deliberate, intentional
  duplicate-creation path** — not the same behavior, and neither is an accident. Probe duplicate issue deleted
  immediately after confirmation.

---

### TC-TCM-296: After a successful Move/Copy, the page redirects to the target suite

**User Role:** QA
**Priority:** Low
**Steps:**
1. While viewing suite A's page, checkbox-select a test case and drag it onto suite B, choosing **Move here**.
2. Observe the resulting URL/page.
3. Repeat choosing **Copy here** instead (on a different case, to a different suite).

**Expected Result:**
- Behavior should be explicit — record whether the page stays on suite A, redirects to suite B, or does
  something else.

**EXECUTED 2026-10-22 — PASS, confirmed via source and live.** Found while answering a user question. The
checkbox multi-select Move/Copy popup's success handler (`testcase.js`, `#moveLink`/`#copyLink` click handlers —
this is the real working path behind the screenshot's "Move here / Copy here" popup) explicitly calls
`redirectToTestSuite(tempData.testSuiteId)` on success, which does
`window.location.href = '/test_suites?project_id=...&testsuite_id=<TARGET suite id>'` — a genuine full-page
navigation to the **target** suite, not a silent in-place DOM update. Confirmed live: moved a real test case
(`TC-redirect-probe`) from suite 3 to suite 7 via the real endpoint, then navigated to suite 7's page and
confirmed the moved case is genuinely listed there — matching exactly what the redirect would show the user.
(On a rejected Move/Copy — e.g. the same-suite case in TC-TCM-295 — the error handler calls `location.reload()`
instead, reloading the **current** page, not redirecting anywhere.) The separate single-row drag path
(`moveTestcase()`/`copyTestcase()`, BUG-TCM-033's fix) does **not** redirect at all — it only removes the row
from the current view and shows an inline flash notice, staying on whichever page you were already on; this is a
real, intentional difference between the two UI entry points for the same underlying move/copy action, not a
regression in either one.

---

### TC-TCM-297: New Test Case created from inside an open suite lands in that same suite

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Open a specific suite's page (not the no-suite-selected default view).
2. Click **New Test Case**.
3. Fill in Subject and Create.

**Expected Result:**
- The created test case should be associated with the suite that was open when "New Test Case" was clicked —
  record whether it actually is, or whether it lands unassigned/elsewhere.

**EXECUTED 2026-10-22 — PASS, confirmed live.** Found while answering a user question. The "New Test Case" link
on an open suite's page carries `?testsuite_id=<that suite's id>` (confirmed:
`/projects/rftc-016-ci-qa/issue_testcase/new?testsuite_id=7` while suite 7 was open).
`issue_testcase_controller.rb#create` reads this same `params[:testsuite_id]`, resolves the `Testsuite` record,
and links the newly-created issue to it. Live-confirmed: created a real test case
(`TC-newcase-in-open-suite-probe`) from suite 7's own page — the new issue (`#2120`) was linked to **suite 7
only** (`issue_test_suites` → `[7]`), and the Create action itself redirected back to suite 7's own page
afterward. Probe issue deleted immediately after confirmation.

---

### TC-TCM-148: Remove test cases from a suite

**User Role:** QA
**Priority:** High
**Steps:**
1. Remove a case from a suite; reload; search for the case in the Testcase Summary and the Redmine issue list.

**Expected Result:**
- The case leaves the suite but the **issue still exists** — "remove from suite" must not delete the test case.

**CONFIRMED LIVE — 2026-10-01 — FAIL, filed as BUG-TCM-026 (High).** Found the real action after some digging: the
row's Actions menu → "Remove Testcase" (`#single-remove-link`, a `class="submenu"` trigger) reveals a separate
"Confirm Removal" popup (`#custom-confirmation-popup`) with its own Remove/Cancel buttons — not an inline
confirm/toast. Clicking **Remove** fires `POST /remove_issues_to_test_suite` with the exact correct payload
(`test_suite_id=14&issue_ids[]=1591`) and the server returns **200 OK** — but the case **remains in the suite's
grid** after a cache-busted reload, reproduced twice identically. The issue itself does survive (not deleted),
satisfying half the expectation, but the removal itself silently never happens despite a success response. Filed
**BUG-TCM-026**.

---

### TC-TCM-149: Bulk-assign a requirement to multiple test cases

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Select three cases, bulk-assign a requirement; reload; open each case and the RTM.

**Expected Result:**
- All three show the requirement, and all three appear against it in the traceability matrix.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Selected 3 cases (#458, #459, #1526) in the Testcase Summary, used the
multi-select context menu's **Requirements** submenu (another `class="submenu"` reveal, same pattern as
BUG-TCM-026's Remove Testcase — needs a real click to expose the nested requirement-option list, not just a JS
dispatch) → **REQ-TC112 Create Requirement Test**. Confirmed via both issues' own pages (#458, #459 both show
"Requirements: REQ-TC112 Create Requirement Test") and the **Traceability Matrix**, which correctly lists all
three cases (#458, #459, #1526) against `#5 : REQ-TC112 Create Requirement Test`.

**REGRESSED 2026-10-22 — PASS on the mechanism, new Low bug found on permission UX.** As `qa.limited`
(`edit_requirement` granted), confirmed the same `POST /requirement_issues/assign_requirement` endpoint this
context-menu action calls still correctly links a requirement to an issue (`302` success, confirmed via `rails
runner`). **While investigating this per explicit user question about permission handling here**, found the
Requirements submenu in `context_menus/issues.html.erb` is the *only* submenu in that entire file that never
passes `:disabled` based on permission — every sibling submenu (Status, Tracker, Priority, etc.) greys itself out
via `:disabled => !@can[:edit]`, but Requirements always renders fully clickable regardless of whether the user
actually has `edit_requirement`. Confirmed live as `qanonadmin` (core `edit_issues` granted, `edit_requirement`
denied): the option is NOT disabled in the rendered menu, but clicking it `403`s with no explanation and creates
no row. The server-side gate itself is correct and intentional (same permission the single-issue
`RequirementIssuesController#create` path already requires) — this is a UI-consistency gap only. Filed as
**BUG-TCM-095** (Low).

---

### TC-TCM-150: Bulk-assign replaces or adds predictably

**User Role:** QA
**Priority:** Low
**Steps:**
1. Bulk-assign requirement R1 to a case that already has requirement R2; open the case.

**Expected Result:**
- Behaviour is explicit — either R2 is replaced by R1, or both are held. Record which; silent loss of an existing
  requirement link without warning is a defect.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Case #458 already held `REQ-TC112 Create Requirement Test` (from TC-149).
Bulk-assigned a second requirement, `gsdfgdf`, via the same context-menu mechanism. Reopened #458: both are held
— **"Requirements: REQ-TC112 Create Requirement Test , gsdfgdf"** — the new assignment adds rather than replaces,
with no silent loss of the existing link.

**REGRESSED 2026-10-22 — PASS, same behavior confirmed.** Issue #2121 already held requirement 3 (assigned via
Edit, see TC-TCM-298 below). Bulk-assigned a second requirement (id 6) to it via the same
`assign_requirement_to_issues` endpoint as `qa.limited`. Confirmed via `rails runner`:
`issue.requirement_issues.map(&:requirement_id) == [3, 6]` — both held, add-not-replace behavior still correct.

---

### TC-TCM-298: Change a test case's linked Requirement from the Edit form

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Open an existing test case (with a Requirement already linked) for Edit.
2. Change the Requirement dropdown to a different requirement; Save.
3. Reopen the issue.

**Expected Result:**
- The new requirement replaces the old one (single-select dropdown semantics) and persists.

**EXECUTED 2026-10-22 — PASS.** Found while answering a user question about whether requirement linking works
from the Edit form specifically, not just Create. Opened `TC-boundary-40000-regress` (#2121, created with
requirement 6 linked via TC-TCM-128's regression) for Edit — confirmed the `#testcase_requirement` select2
dropdown correctly pre-populated with the existing link (`selectedOptions` → `["6"]`). Changed it to requirement
3 and saved. Confirmed via `rails runner`: `issue.requirement_issues.map(&:requirement_id) == [3]` — the old link
(6) was replaced, not left dangling alongside the new one, consistent with a genuine single-select Edit-form
field (as opposed to the bulk context-menu path in TC-TCM-149/150, which adds rather than replaces — a real,
intentional difference between the two entry points, not a contradiction).

**FOLLOW-UP FINDING, same day — BUG-TCM-096 (High, new).** The user asked a sharp follow-up after BUG-TCM-095: if
this Edit-form Requirement field already lets a user link a requirement, shouldn't the Issues-list bulk action
require the same (weaker) permission instead of `edit_requirement`? Checking precisely found something more
serious: **this Edit-form path has no permission check on the Requirement field at all.** Root-caused to
`lib/redmineflux_testcase_management/hooks/model_issue_hook.rb#controller_issues_edit_after_save` — a Redmine
hook fired after every plain `IssuesController#update` save, which processes `params[:issue][:requirement_ids]`
and creates/destroys `RequirementIssue` rows with zero `allowed_to?(:edit_requirement, ...)` check anywhere in
the method (confirmed by reading the whole file — the Bulk Edit equivalent,
`controller_issues_bulk_edit_before_save`, has the identical gap). Live-confirmed as `qanonadmin` (core
`edit_issues` granted, `edit_requirement` explicitly denied, verified via `User#allowed_to?` beforehand): created
a fresh probe issue, opened it for Edit, selected a requirement in the dropdown, saved — a genuine
`RequirementIssue` row was created (`rails runner` confirmed `requirement_issues.pluck(:requirement_id) ==
[6]`). This is a real authorization bypass, not a cosmetic gap — every *other* path that performs this same
mutation (`RequirementIssuesController#create`, the bulk context-menu's `assign_requirement`) correctly requires
`edit_requirement`; this one, reached through the ordinary Issue Edit form every `edit_issues` holder already has
access to, requires nothing beyond that. Filed as **BUG-TCM-096** (High). Probe issue deleted immediately after
confirmation.

---

### TC-TCM-151: A test case in multiple suites

**User Role:** QA
**Priority:** Low
**Steps:**
1. Add the same case to two suites, if permitted, and run a report covering both.

**Expected Result:**
- Either multi-suite membership is refused cleanly, or it is supported and the case is **not double-counted** in
  report totals. Double counting would be a reporting defect.

**ATTEMPTED LIVE — 2026-10-01 — BLOCKED by BUG-TCM-025.** There is no working UI path to add an already-existing
case to even one suite (drag-and-drop broken, no add-existing action, no Suite field on Edit) — a case can only
ever end up in the single suite it was created under. Multi-suite membership therefore cannot be tested at all
under the current state.

---

## Evidence Map

| TC range | Area | Bug reference |
|---|---|---|
| TC-TCM-128 – 316 | Authoring, editing, deletion | — |
| TC-TCM-144 – 324 | Suite organisation, requirement assignment | — |

- Screenshots only on failure, to `screenshots/<BUG-ID>/` (`CLAUDE.md` §6).
- TC-TCM-138, 321 and 324 are the highest-risk cases — they probe data loss and double counting.
