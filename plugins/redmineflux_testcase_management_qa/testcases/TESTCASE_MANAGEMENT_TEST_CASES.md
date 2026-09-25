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

---

### TC-TCM-129: Create a test case with multiple ordered steps

**User Role:** QA
**Priority:** High
**Steps:**
1. Create a case adding five steps with distinct descriptions and expected results; save; open the issue.

**Expected Result:**
- All five pairs are stored **in the order entered** and numbered 1–5.

---

### TC-TCM-130: Subject is mandatory

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Create a test case leaving **Subject** empty; save.

**Expected Result:**
- Refused with a visible validation message; nothing created.

---

### TC-TCM-131: Create a test case with no steps

**User Role:** QA
**Priority:** Low
**Steps:**
1. Create a case with a Subject but no steps; save; open it.

**Expected Result:**
- Behaviour is explicit — either steps are required and the save is refused with a message, or the case is created
  with zero steps and renders cleanly. Record which.

---

### TC-TCM-132: Remove a step during authoring

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Add three steps, delete the middle one, save; open the issue.

**Expected Result:**
- Two steps remain, holding the correct content, renumbered contiguously 1–2 with no gap.

---

### TC-TCM-133: Reorder steps

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Create a case with three steps, reorder them, save; reopen.

**Expected Result:**
- The new order persists and is renumbered accordingly.

---

### TC-TCM-134: Step content preserves special characters and unicode

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Create a case whose step and expected result contain `< > & " '`, an emoji, and an embedded newline; save; reopen.

**Expected Result:**
- Content round-trips exactly, with no HTML-escaping artefacts shown to the user and no truncation.

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

---

### TC-TCM-136: Edit an existing test case

**User Role:** QA
**Priority:** High
**Steps:**
1. Open an existing case, change Subject, Priority and one step's Expected Result; save; reload.

**Expected Result:**
- All three changes persist; unchanged steps are untouched.

---

### TC-TCM-137: Delete a test case

**User Role:** Manager / Admin
**Priority:** Medium
**Steps:**
1. Delete a test case not used in any run; confirm; reload the summary.

**Expected Result:**
- The case is removed from the grid and the underlying issue no longer exists.

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

---

### TC-TCM-139: Test case respects Redmine issue permissions

**User Role:** a role without issue-edit rights on the Testcase tracker
**Priority:** High
**Steps:**
1. Attempt to edit a test case as that role, in the UI and via the issue edit URL directly.

**Expected Result:**
- Refused in both. Test cases are Redmine issues and must inherit tracker-level permissions.

---

### TC-TCM-140: Assignee drives the To-Do list

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Create a case assigned to user X.
2. Log in as X and open the **To-Do** area.

**Expected Result:**
- The case appears in X's To-Do list.

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

---

### TC-TCM-142: Test case appears in Redmine's own issue list

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Create a case, then open the project's **Issues** list filtered to the Testcase tracker.

**Expected Result:**
- The case is listed as a normal issue with its Subject, assignee and priority.

---

### TC-TCM-143: Test case search by subject and ID

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Use **Search by subject or ID** on the Testcase Summary with a full subject, a partial subject and the issue ID.

**Expected Result:**
- Each returns the matching case; a non-matching term returns an empty result rather than the full list.

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

---

### TC-TCM-145: Drag a test case between suites

**User Role:** QA
**Priority:** High
**Steps:**
1. Drag a case from suite A to suite B; reload; check both suites.

**Expected Result:**
- The case is in B only — not duplicated into both.

---

### TC-TCM-146: Add existing test cases to a suite

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Use the add-to-suite action, select two unassigned cases, confirm; reload.

**Expected Result:**
- Both cases appear under the target suite.

---

### TC-TCM-147: Copy test cases to another suite

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Copy two cases from suite A to suite B; inspect both suites and the copies.

**Expected Result:**
- Behaviour is explicit — either the same cases are now referenced by both suites, or new duplicate issues are
  created. Record which, and confirm the copies carry the original steps and expected results.

---

### TC-TCM-148: Remove test cases from a suite

**User Role:** QA
**Priority:** High
**Steps:**
1. Remove a case from a suite; reload; search for the case in the Testcase Summary and the Redmine issue list.

**Expected Result:**
- The case leaves the suite but the **issue still exists** — "remove from suite" must not delete the test case.

---

### TC-TCM-149: Bulk-assign a requirement to multiple test cases

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Select three cases, bulk-assign a requirement; reload; open each case and the RTM.

**Expected Result:**
- All three show the requirement, and all three appear against it in the traceability matrix.

---

### TC-TCM-150: Bulk-assign replaces or adds predictably

**User Role:** QA
**Priority:** Low
**Steps:**
1. Bulk-assign requirement R1 to a case that already has requirement R2; open the case.

**Expected Result:**
- Behaviour is explicit — either R2 is replaced by R1, or both are held. Record which; silent loss of an existing
  requirement link without warning is a defect.

---

### TC-TCM-151: A test case in multiple suites

**User Role:** QA
**Priority:** Low
**Steps:**
1. Add the same case to two suites, if permitted, and run a report covering both.

**Expected Result:**
- Either multi-suite membership is refused cleanly, or it is supported and the case is **not double-counted** in
  report totals. Double counting would be a reporting defect.

---

## Evidence Map

| TC range | Area | Bug reference |
|---|---|---|
| TC-TCM-128 – 316 | Authoring, editing, deletion | — |
| TC-TCM-144 – 324 | Suite organisation, requirement assignment | — |

- Screenshots only on failure, to `screenshots/<BUG-ID>/` (`CLAUDE.md` §6).
- TC-TCM-138, 321 and 324 are the highest-risk cases — they probe data loss and double counting.
