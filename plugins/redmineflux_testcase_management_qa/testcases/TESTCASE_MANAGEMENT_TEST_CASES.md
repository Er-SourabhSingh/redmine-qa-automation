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
