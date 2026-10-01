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

### TC-TCM-192: Create a test suite

**User Role:** QA / Manager
**Priority:** High
**Steps:**
1. **Test Suite** sidebar → **Add Test Suite** icon.
2. Enter **Test Suite Name** and **Description**; click **Create**.
3. Reload the page.

**Expected Result:**
- The suite appears in the tree with the entered name and survives the reload.

**CONFIRMED LIVE — 2026-10-01 — PASS on name/persistence, FAIL on Description — filed as BUG-TCM-017.** Clicked
the "Add Test Suite" icon (`#add-testsuite`); the modal that opens has **only a Name field** — no Description
field exists at all, despite `TESTCASE_MANAGEMENT_USER_GUIDE.md` Workflow 2 step 4 documenting "Enter Test Suite
Name and Description." Created `QA-AUTOSUITE-192` (Name only, id 9) — it appeared immediately in the tree and
survived a full page reload (name/persistence half genuinely PASSes). Also found the Edit Folder modal for the
same suite has the identical gap (no Description field either — `testsuite[name]` is the only editable field).
Both modals additionally throw a real console error every time they open
(`TypeError: Cannot read properties of null (reading 'addEventListener')`, from dead code assuming a `.ql-editor`
rich-text field exists). Filed **BUG-TCM-017** (Low).

---

### TC-TCM-193: Create a sub-test suite

**User Role:** QA
**Priority:** High
**Steps:**
1. Click the **action icon** next to an existing suite → **Add Sub-folder**.
2. Enter a name and description; **Create**; reload.

**Expected Result:**
- The sub-suite is nested under its parent and is expandable/collapsible from the parent node.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Used the parent suite's action icon → **Add Sub Test Suite**, created
`QA-SUBSUITE-193` under `QA-AUTOSUITE-192` (confirmed `testsuite[parent_id]=9` on the create form, resulting id
10). After a full reload, the sub-suite was correctly hidden until the parent's collapsible arrow was clicked,
then appeared nested beneath it — expand/collapse works as expected.

---

### TC-TCM-194: Multi-level nesting

**User Role:** QA
**Priority:** Low
**Steps:**
1. Create a sub-suite inside a sub-suite (three levels deep); reload.

**Expected Result:**
- All three levels render in the correct hierarchy.
- If the plugin imposes a depth limit, it is stated clearly rather than failing silently. Record the behaviour.

**CONFIRMED LIVE — 2026-10-01 — FAIL, filed as BUG-TCM-018.** Created suite `QA-AUTOSUITE-192` (id 9, top-level),
then a sub-suite `QA-SUBSUITE-193` under it (id 10, correctly `parent_id:9`, confirmed via `GET
/test_suites/10/edit`). Attempted a 3rd level — "Add Sub Test Suite" from suite 10's own action menu, named
`QA-SUBSUITE-194-L3` — and confirmed via `GET /test_suites/11/edit` that it landed with **`parent_id: null`**, a
silently-orphaned new top-level suite, not nested under 10 at all. Root-caused: the "Add Sub Test Suite" form's
hidden `#parent-id-field` is correctly pre-filled when opened from a top-level suite, but is left **empty** when
opened from an already-nested (level-2) suite — reproduced directly by inspecting the form's HTML in both cases.
No error, warning, or depth-limit message of any kind — exactly the silent-failure risk this TC calls out. Filed
**BUG-TCM-018** (Medium). Left `QA-SUBSUITE-194-L3` (id 11) in place as the reproduction artifact.

---

### TC-TCM-195: Suite name is mandatory

**User Role:** QA
**Priority:** Low
**Steps:**
1. **Add Test Suite**, leave the name empty, **Create**.

**Expected Result:**
- Refused with a visible validation message; nothing created.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Opened Add Test Suite, left Name empty, clicked Create: a visible inline
error **"Name cannot be blank"** appeared, the modal stayed open, and no new suite was created (no navigation, no
new id).

---

### TC-TCM-196: Duplicate suite name at the same level

**User Role:** QA
**Priority:** Low
**Steps:**
1. Create two suites with identical names under the same parent.

**Expected Result:**
- Either refused with a clear message, or permitted and both remain distinguishable in the tree.
- Record which — two identically-named sibling suites that cannot be told apart would make case assignment ambiguous.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Created `QA-DUP-NAME-196` (id 12) at the top level, then attempted a
second top-level suite with the identical name: refused with a clear inline error, **"Name has already been
taken"** — no ambiguous duplicate was created.

---

### TC-TCM-197: Edit a suite name and description

**User Role:** QA / Manager
**Priority:** Medium
**Steps:**
1. Edit an existing suite; change name and description; save; reload.

**Expected Result:**
- Both changes persist; test cases inside the suite remain associated with it.

**CONFIRMED LIVE — 2026-10-01 — PASS on name, FAIL on description (already BUG-TCM-017, no new bug filed).**
Edited suite 12 (`QA-DUP-NAME-196` → `QA-DUP-NAME-196-EDITED`) via Edit Folder; confirmed persisted via
`GET /test_suites/12/edit` returning the new name (`updated_at` advanced accordingly). The description half
cannot be tested at all since no Description field exists anywhere on this form — already covered by BUG-TCM-017,
not a separate defect. No test cases existed in this disposable suite, so the "cases remain associated" half is
N/A for this fixture.

---

### TC-TCM-198: Delete an empty suite

**User Role:** Manager / Admin
**Priority:** Medium
**Steps:**
1. Delete a suite containing no cases and no sub-suites; confirm; reload.

**Expected Result:**
- The suite is removed from the tree.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Deleted empty suite 12 (`QA-DUP-NAME-196-EDITED`) via **Delete Folder**
(a custom in-page confirmation, not a native `confirm()` — "Related testcase counts : 0. Really delete this
folder including all its subfolders and all test cases? This cannot be undone and also affects all active test
runs."). Confirmed removed: `GET /test_suites/12/edit` now returns **404**.

---

### TC-TCM-199: Delete a suite containing test cases

**User Role:** Admin
**Priority:** High
**Steps:**
1. Create a suite, add ≥2 test cases to it.
2. Delete the suite; confirm.
3. Search the Testcase Summary for those cases and check the Redmine issue list.

**Expected Result:**
- Either the delete is blocked with a clear message, or the suite is deleted while the **test case issues survive**
  (they are Redmine issues and must not be silently destroyed).
- Silent loss of issues would be a High-severity defect. Record the actual behaviour.

**CONFIRMED LIVE — 2026-10-01 — PASS on "issues survive the delete"; corrected after an initial misattribution
(BUG-TCM-019 filed then retracted).** Created suite `QA-DELETE-TEST-199` (id 13) with two real test cases inside
it (#1587, #1588). Deleted the suite via Delete Folder (explicit confirmation shown: "Related testcase counts : 2
... and all test cases? This cannot be undone"). The suite itself was removed (`GET /test_suites/13/edit` → 404)
and neither issue was deleted — **both survived**, satisfying this TC's core expectation.

Initially filed BUG-TCM-019 claiming the delete action itself retrackered #1587/#1588 from Test case to Bug,
based on their presence in the suite's own "Testcase Summary" grid *before* deletion. That grid turned out **not
to filter by tracker at all** (confirmed later by finding known Bug-tracker issues still listed in it) — so their
grid presence never actually proved they were Test case tracker to begin with. Direct checks (not performed
before the original filing) show #1587/#1588 were almost certainly **already** on the Bug tracker from the
moment they were created, a few minutes earlier in this same TC — a separate, broader, and more severe defect
(every New Test Case creation lands on Bug regardless of suite activity), filed as **BUG-TCM-022** (Critical) and
cross-referenced from `TESTCASE_MANAGEMENT_TEST_CASES.md` TC-TCM-128. BUG-TCM-019 retracted and deleted.

---

### TC-TCM-200: Delete a suite containing sub-suites

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Delete a parent suite that has sub-suites; confirm.
2. Inspect the tree.

**Expected Result:**
- Behaviour is explicit — either blocked, or cascaded with a clear warning stating that children will be removed.
- Orphaned sub-suites left unreachable in the tree would be a defect.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Deleted parent suite 9 (`QA-AUTOSUITE-192`), which still had its real
child suite 10 (`QA-SUBSUITE-193`) nested under it. The confirmation dialog explicitly states "including all its
subfolders," and the cascade worked exactly as warned: both `GET /test_suites/9/edit` and `GET
/test_suites/10/edit` returned 404 afterward. As a control, suite 11 (the orphaned `QA-SUBSUITE-194-L3` from
BUG-TCM-018, which never actually got nested under 9 due to that bug) correctly remained untouched (still 200) —
confirming the cascade only follows real parent/child links, not a broader sweep.

---

### TC-TCM-201: Testcase count display toggle

**User Role:** Admin
**Priority:** Low
**Precondition:** Suites containing a known number of cases.

**Steps:**
1. Administration → Plugins → Testcase Management → Configure → enable **Show testcase count in test suites**; save.
2. Reload the suite tree and note the counts.
3. Disable the setting; reload.

**Expected Result:**
- Enabled: each suite shows a count matching the real number of cases it holds.
- Disabled: no counts are shown.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Disabled **Show Testcase Count In Test Suites**
(`settings[show_issue_count]`) and reloaded the tree: suite names rendered with no counts at all (e.g.
"workload" instead of "workload (52)"). Re-enabled and reloaded: counts returned correctly, and spot-checked one
against ground truth — "dfsogsdfjgdsfg dsfg (1)" matches its own grid's pagination footer "(1-1/1)" exactly.

---

### TC-TCM-202: Suite tree state and selection

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Expand several nodes and select a suite.
2. Confirm the case grid filters to that suite's cases.
3. Select the parent suite.

**Expected Result:**
- Selecting a suite shows its cases. Record whether a parent shows only its own cases or also its descendants',
  and confirm the behaviour is consistent across the tree.

**CONFIRMED LIVE — 2026-10-01 — PASS (behaviour recorded).** Built a controlled parent/child pair:
`QA-TREE-PARENT-202` (id 14, one direct case #1590) with `QA-TREE-CHILD-202` (id 15, correctly nested
`parent_id:14`, one direct case #1591). Selecting the **child** suite's grid shows only its own case (#1591).
Selecting the **parent** suite's grid shows **both** #1590 (its own) and #1591 (the child's) — a parent's view
includes its descendants' cases, not just its own direct ones. This is the expected/intended behaviour for a
hierarchical tree, not a defect.

---

### TC-TCM-203: Suites are project-scoped

**User Role:** QA
**Priority:** High
**Steps:**
1. Create suite `SUITE-A` in Project A; open Project B's suite tree.

**Expected Result:**
- `SUITE-A` does not appear in Project B.

**CONFIRMED LIVE — 2026-10-01 — PASS, both directions.** Checked `test-project`'s own suites
(`QA-TREE-PARENT-202`, `QA-TREE-CHILD-202`, etc.) against `tcm-permissions-private-test`'s suite tree — none
appeared there. Then created a fresh suite (`QA-SCOPE-TEST-203-PROJECTB`, id 16) directly inside
`tcm-permissions-private-test` and confirmed it does **not** appear back in `test-project`'s tree. Suites are
correctly project-scoped in both directions.

---

## Evidence Map

| TC range | Area | Bug reference |
|---|---|---|
| TC-TCM-192 – 212 | Suite CRUD, nesting, deletion semantics | — |

- Screenshots only on failure, to `screenshots/<BUG-ID>/` (`CLAUDE.md` §6).
- TC-TCM-199 and TC-TCM-200 are the highest-risk cases — both probe whether deleting a container destroys data
  it should not own.
