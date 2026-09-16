# Test Cases — Redmineflux Testcase Management — Requirements & Traceability Matrix

> Source: vendor KB "Requirements & Configuration" and "Access traceability matrix".
> **Status: authored 2026-09-14, not yet executed.**

## Plugin
- Name: Redmineflux Testcase Management
- Version: v7.0.0
- Redmine version: 6.1.3 (`localhost:3012`) / 7.0.0 (`localhost:3010`)
- Path: plugins/redmineflux_testcase_management_qa

## Navigation methodology

Project → **TestCases** → **Requirements** sidebar icon, and → **Traceability (RTM)** icon. Coverage figures must
be cross-checked against the underlying run results, not accepted from the matrix alone.

**Precondition:** the **Feature Tracker** is configured; ≥1 run with executed results exists.

---

## Functional Cases — Requirements

---

### TC-TCM-601: Create a requirement document

**User Role:** QA / Manager
**Steps:**
1. **Requirements** → add a requirement.
2. Enter a title and body; save; reload the list.

**Expected Result:**
- The requirement is created and listed with the title entered.

---

### TC-TCM-602: Requirement title is mandatory

**User Role:** QA
**Steps:**
1. Create a requirement with an empty title; save.

**Expected Result:**
- Refused with a visible validation message; nothing created.

---

### TC-TCM-603: Link a test case to a requirement at creation

**User Role:** QA
**Steps:**
1. Create a test case selecting the requirement from the **Requirement** dropdown; save; open the requirement.

**Expected Result:**
- The requirement shows the linked case; the case shows the requirement.

---

### TC-TCM-604: Link an existing test case to a requirement

**User Role:** QA
**Steps:**
1. Edit an existing case and set its requirement; save; open the requirement.

**Expected Result:**
- The link is reflected on both sides.

---

### TC-TCM-605: Link multiple test cases to one requirement

**User Role:** QA
**Steps:**
1. Link three cases to requirement R1 (individually or by bulk assign); open R1.

**Expected Result:**
- All three cases are listed against R1, with no duplicates.

---

### TC-TCM-606: Unlink a test case from a requirement

**User Role:** QA
**Steps:**
1. Clear a case's requirement; save; open the requirement and the RTM.

**Expected Result:**
- The case no longer appears against the requirement, and the RTM coverage figure decreases accordingly.

---

### TC-TCM-607: Edit a requirement

**User Role:** QA / Manager
**Steps:**
1. Change a requirement's title and body; save; reload; check linked cases.

**Expected Result:**
- Changes persist; existing case links are unaffected by the edit.

---

### TC-TCM-608: Delete an unlinked requirement

**User Role:** Manager / Admin
**Steps:**
1. Delete a requirement with no linked cases; confirm; reload.

**Expected Result:**
- Removed from the list and no longer offered in the test case Requirement dropdown.

---

### TC-TCM-609: Delete a requirement that has linked test cases

**User Role:** Admin
**Steps:**
1. Link two cases to a requirement, then delete it.
2. Open those cases, the RTM, and a Requirement Coverage report.

**Expected Result:**
- Either the delete is blocked with a clear message, or it succeeds and the **test cases survive** with their
  requirement link cleanly cleared.
- The RTM and the coverage report must not error or show a dangling reference. Record the behaviour.

---

### TC-TCM-610: Requirements are project-scoped

**User Role:** QA
**Steps:**
1. Create requirement `REQ-A` in Project A; open Project B's requirement list and the test case Requirement dropdown.

**Expected Result:**
- `REQ-A` does not appear in Project B.

---

## Functional Cases — Traceability Matrix

---

### TC-TCM-611: RTM lists requirements against their test cases

**User Role:** QA
**Steps:**
1. With ≥2 requirements each holding ≥2 linked cases, open the **Traceability (RTM)** view.

**Expected Result:**
- Every requirement is shown with exactly its linked cases; no case appears under a requirement it is not linked to.

---

### TC-TCM-612: RTM reflects execution results

**User Role:** QA
**Steps:**
1. Note a requirement's coverage in the RTM.
2. Execute one of its linked cases as **Passed** and another as **Failed**.
3. Reload the RTM.

**Expected Result:**
- The matrix reflects the new statuses and any pass/fail counts match the run grid exactly.

---

### TC-TCM-613: RTM shows uncovered requirements

**User Role:** QA
**Steps:**
1. Create a requirement with no linked test cases; open the RTM.

**Expected Result:**
- The requirement is listed and visibly identified as having no coverage — it must not be silently omitted, since
  uncovered requirements are the main thing an RTM exists to reveal.

---

### TC-TCM-614: RTM shows unlinked test cases

**User Role:** QA
**Steps:**
1. With ≥1 case linked to no requirement, open the RTM.

**Expected Result:**
- Behaviour is explicit — orphan cases are either shown in an "unlinked" grouping or documented as out of scope.
  Record which.

---

### TC-TCM-615: RTM coverage agrees with the Requirement Coverage report

**User Role:** QA
**Steps:**
1. For the same requirement, compare the RTM's coverage against a freshly generated Requirement Coverage report.

**Expected Result:**
- Both give the same tested/untested counts. A discrepancy between the two views is a defect.

---

### TC-TCM-616: RTM with no requirements renders cleanly

**User Role:** QA
**Steps:**
1. Open the RTM in a project with the module enabled but no requirements.

**Expected Result:**
- An explicit empty state renders. No blank page, no error, no `NaN`/`undefined`.

---

## Evidence Map

| TC range | Area | Bug reference |
|---|---|---|
| TC-TCM-601 – 610 | Requirement CRUD and linking | — |
| TC-TCM-611 – 616 | Traceability matrix | — |

- Screenshots only on failure, to `screenshots/<BUG-ID>/` (`CLAUDE.md` §6).
- TC-TCM-609, 613 and 615 are the highest-value cases — data-loss semantics, the RTM's core purpose, and
  cross-view consistency respectively.
