# Test Cases — Redmineflux Testcase Management — Test Suites

> Source: `docs/TESTCASE_MANAGEMENT_USER_GUIDE.md` Workflows 2–3 and the vendor KB "Test Suite Operations".
> **Status: authored 2026-09-14, not yet executed.**

## Plugin
- Name: Redmineflux Testcase Management
- Version: v7.0.0
- Redmine version: 6.1.3 (`localhost:3012`) / 7.0.0 (`localhost:3010`)
- Path: plugins/redmineflux_testcase_management_qa

## Navigation methodology

Project → **TestCases** → **Test Suite** sidebar icon. Suite changes must be re-verified by reloading the tree,
since the tree is rendered client-side and a stale view can look like a successful save.

---

## Functional Cases

---

### TC-TCM-201: Create a test suite

**User Role:** QA / Manager
**Steps:**
1. **Test Suite** sidebar → **Add Test Suite** icon.
2. Enter **Test Suite Name** and **Description**; click **Create**.
3. Reload the page.

**Expected Result:**
- The suite appears in the tree with the entered name and survives the reload.

---

### TC-TCM-202: Create a sub-test suite

**User Role:** QA
**Steps:**
1. Click the **action icon** next to an existing suite → **Add Sub-folder**.
2. Enter a name and description; **Create**; reload.

**Expected Result:**
- The sub-suite is nested under its parent and is expandable/collapsible from the parent node.

---

### TC-TCM-203: Multi-level nesting

**User Role:** QA
**Steps:**
1. Create a sub-suite inside a sub-suite (three levels deep); reload.

**Expected Result:**
- All three levels render in the correct hierarchy.
- If the plugin imposes a depth limit, it is stated clearly rather than failing silently. Record the behaviour.

---

### TC-TCM-204: Suite name is mandatory

**User Role:** QA
**Steps:**
1. **Add Test Suite**, leave the name empty, **Create**.

**Expected Result:**
- Refused with a visible validation message; nothing created.

---

### TC-TCM-205: Duplicate suite name at the same level

**User Role:** QA
**Steps:**
1. Create two suites with identical names under the same parent.

**Expected Result:**
- Either refused with a clear message, or permitted and both remain distinguishable in the tree.
- Record which — two identically-named sibling suites that cannot be told apart would make case assignment ambiguous.

---

### TC-TCM-206: Edit a suite name and description

**User Role:** QA / Manager
**Steps:**
1. Edit an existing suite; change name and description; save; reload.

**Expected Result:**
- Both changes persist; test cases inside the suite remain associated with it.

---

### TC-TCM-207: Delete an empty suite

**User Role:** Manager / Admin
**Steps:**
1. Delete a suite containing no cases and no sub-suites; confirm; reload.

**Expected Result:**
- The suite is removed from the tree.

---

### TC-TCM-208: Delete a suite containing test cases

**User Role:** Admin
**Steps:**
1. Create a suite, add ≥2 test cases to it.
2. Delete the suite; confirm.
3. Search the Testcase Summary for those cases and check the Redmine issue list.

**Expected Result:**
- Either the delete is blocked with a clear message, or the suite is deleted while the **test case issues survive**
  (they are Redmine issues and must not be silently destroyed).
- Silent loss of issues would be a High-severity defect. Record the actual behaviour.

---

### TC-TCM-209: Delete a suite containing sub-suites

**User Role:** Admin
**Steps:**
1. Delete a parent suite that has sub-suites; confirm.
2. Inspect the tree.

**Expected Result:**
- Behaviour is explicit — either blocked, or cascaded with a clear warning stating that children will be removed.
- Orphaned sub-suites left unreachable in the tree would be a defect.

---

### TC-TCM-210: Testcase count display toggle

**User Role:** Admin
**Precondition:** Suites containing a known number of cases.

**Steps:**
1. Administration → Plugins → Testcase Management → Configure → enable **Show testcase count in test suites**; save.
2. Reload the suite tree and note the counts.
3. Disable the setting; reload.

**Expected Result:**
- Enabled: each suite shows a count matching the real number of cases it holds.
- Disabled: no counts are shown.

---

### TC-TCM-211: Suite tree state and selection

**User Role:** QA
**Steps:**
1. Expand several nodes and select a suite.
2. Confirm the case grid filters to that suite's cases.
3. Select the parent suite.

**Expected Result:**
- Selecting a suite shows its cases. Record whether a parent shows only its own cases or also its descendants',
  and confirm the behaviour is consistent across the tree.

---

### TC-TCM-212: Suites are project-scoped

**User Role:** QA
**Steps:**
1. Create suite `SUITE-A` in Project A; open Project B's suite tree.

**Expected Result:**
- `SUITE-A` does not appear in Project B.

---

## Evidence Map

| TC range | Area | Bug reference |
|---|---|---|
| TC-TCM-201 – 212 | Suite CRUD, nesting, deletion semantics | — |

- Screenshots only on failure, to `screenshots/<BUG-ID>/` (`CLAUDE.md` §6).
- TC-TCM-208 and TC-TCM-209 are the highest-risk cases — both probe whether deleting a container destroys data
  it should not own.
