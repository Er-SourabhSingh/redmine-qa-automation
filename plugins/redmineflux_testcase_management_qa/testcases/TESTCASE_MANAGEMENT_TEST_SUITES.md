# Test Cases — Redmineflux Testcase Management — Test Suites

> Source: `docs/TESTCASE_MANAGEMENT_USER_GUIDE.md` Workflows 2–3 and the vendor KB "Test Suite Operations".
> **Status: authored 2026-09-14.** Every TC below already carried live evidence from 2026-10-01, but against a
> different, older instance/project (`test-project`/`tcm-permissions-private-test`) — the banner text itself was
> stale ("not yet executed") despite the TCs all being filled in. **REGRESSED 2026-10-22 against the current
> build** (Docker `localhost:3000`, project `rftc-016-ci-qa`) as part of the CLAUDE.md §27 full-plugin regression.
> All 12 TCs (192–203) re-executed live via Playwright + `rails runner` DB verification. All PASS, no new bugs —
> BUG-TCM-017 (missing Description field), BUG-TCM-018 (3rd-level nesting), and BUG-TCM-022 (new test cases
> defaulting to Bug tracker) all confirmed still genuinely fixed on this build.

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

**REGRESSED 2026-10-22 — PASS, BUG-TCM-017 fix confirmed still holding.** Created `QA-REGRESS-192` via the current
build's Add Test Suite modal with both Name and a real Quill-editor Description ("TC-192 regression description")
filled in. Confirmed via `rails runner`: `Testsuite#description` saved as `"<p>TC-192 regression description</p>"`
— the Description field exists and works on both Name and Description. Suite survived a full page reload.

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

**REGRESSED 2026-10-22 — PASS.** Used suite 28's (`QA-REGRESS-192`) kebab menu → "Add Sub Test Suite" →
created `QA-SUBSUITE-193-REGRESS`. Confirmed via `rails runner`: `Testsuite#parent_id == 28` — correctly nested.

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

**REGRESSED 2026-10-22 — PASS, BUG-TCM-018 fix confirmed still holding.** From suite 29's (`QA-SUBSUITE-193-REGRESS`,
itself nested under 28) own kebab menu, created a 3rd-level suite `QA-SUBSUITE-194-L3-REGRESS`. Confirmed via
`rails runner`: `Testsuite#parent_id == 29` — correctly nested 3 levels deep, not orphaned to top-level. (One
methodology note: the hidden `parent-id-field` populates correctly but only a short moment after the Edit Folder
modal opens — a query issued the instant the click handler returns can read it as still empty; waiting briefly,
or reading it from a screenshot instead, confirms it's genuinely populated, not a real bug in the field itself.)

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

**REGRESSED 2026-10-22 — PASS.** Opened Add Test Suite, submitted with Name empty: server returned `422`
(confirmed via console log), a red inline banner reading **"Name cannot be blank"** appeared in the modal
(confirmed via screenshot), and `rails runner` confirmed zero new suite was created.

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

**REGRESSED 2026-10-22 — PASS.** Created `QA-DUP-REGRESS-196` (id 31), then attempted a second top-level suite
with the identical name: no navigation occurred (stayed on the suite page, consistent with a client-side/server
rejection), and `rails runner` confirmed only 1 suite exists with that name.

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

**REGRESSED 2026-10-22 — PASS on both name AND description (description is now testable — BUG-TCM-017's fix added
the field).** Edited suite 31 (`QA-DUP-REGRESS-196`) via Edit Folder — changed Name to
`QA-DUP-REGRESS-196-EDITED` and Description to "Edited description 197". Confirmed via `rails runner`: both
changes persisted (`name` and `description` columns both updated, `updated_at` advanced). (Methodology note: the
Edit modal's Name field has a different element id — `testsuite_names`, plural — than the Add modal's
`testsuite_name`; querying the wrong one looks like an empty/broken field when it's actually populated correctly,
confirmed via screenshot.)

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

**REGRESSED 2026-10-22 — PASS.** Deleted empty suite 31 (`QA-DUP-REGRESS-196-EDITED`) via the kebab menu's
"Delete Test Suite" — confirmation modal shows "Related testcase counts : 0 / Are you sure you want to delete
this test suite? All its sub-suites and test cases will be deleted too, and any active test runs using them will
be affected. This cannot be undone." Confirmed deletion via `rails runner`. The resulting redirect landed on the
no-suite-selected page (`/test_suites?project_id=...`, no `testsuite_id`) and rendered fine — did **not** trigger
BUG-TCM-092's 500 crash this time, confirming that bug is conditional (depends on unassigned-issue state at the
moment of the request), not deterministic on every visit to that URL shape.

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

**REGRESSED 2026-10-22 — PASS, BUG-TCM-022 fix confirmed still holding.** Created suite 32
(`QA-DELETE-TEST-199-REGRESS`) with two real test cases (#2112, #2113) linked to it. Deleted the suite via Delete
Folder (confirmation correctly showed "Related testcase counts : 2"). Confirmed via `rails runner`: the suite was
deleted, both issues survived, and — unlike the original 2026-10-01 BUG-TCM-019 confusion — both issues are
confirmed on the correct **Testcase** tracker (not Bug), directly verifying BUG-TCM-022's fix still holds.

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

**REGRESSED 2026-10-22 — PASS.** Deleted parent suite 28 (`QA-REGRESS-192`), which had a real 3-level chain
nested under it (29 → 30, from TC-193/194). Confirmation modal explicitly warned "All its sub-suites and test
cases will be deleted too." Confirmed via `rails runner`: all three suites (28, 29, 30) were deleted in the
cascade — no orphaned sub-suite left behind.

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

**REGRESSED 2026-10-22 — PASS.** Toggled `Setting.plugin_redmineflux_testcase_management['show_issue_count']`
directly (admin UI blocked by this session's non-admin test role; confirmed via source the setting's exact
expected value is the string `'true'`, not `'1'`/truthy). Disabled: suite tree names rendered with no count badge
at all. Re-enabled (`'true'`): counts returned, e.g. "CI Ingest 13" — matches its own grid's "(1-13/13)" footer
exactly, and "CI Ingest Sub-Suite 2" matches its own grid's "(1-2/2)" footer. (Methodology note: the count lives
in a sibling `<span class="rf-ts-suite-count-badge">`, not inside the suite-name `<a>` itself — querying just the
link's own text misses it entirely and looks like the feature is broken when it isn't.)

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

**REGRESSED 2026-10-22 — PASS, same behaviour confirmed.** Used the existing real `CI Ingest` (id 3, 13 total
cases) / `CI Ingest Sub-Suite` (id 7, 2 direct cases) pair already on this project. Selecting the sub-suite's grid
shows only its own 2 cases ("(1-2/2)"). Selecting the parent's grid shows all 13 ("(1-13/13)"), i.e. its own plus
every descendant's — same parent-includes-descendants behaviour as the original finding.

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

**REGRESSED 2026-10-22 — PASS.** Confirmed via `rails runner`: `rftc-016-ci-qa` (Project A) and
`rftc-038-multisuite-qa` (Project B) have 6 suites each with zero name overlap. Live-confirmed the read-boundary
direction too — as `qa.limited` (a genuine member of Project A only, zero role on Project B), requesting
`GET /test_suites?project_id=rftc-038-multisuite-qa&testsuite_id=8` returned a clean `404`, consistent with this
session's extensive Security-suite findings on the same project-scoping boundary (TC-TCM-225–230). Suites remain
correctly project-scoped.

---

## Regression — 2026-10-27 (targeted, fast pass per direct user request; Area 4 — Test suite management, BUG-TCM-090/092)

- **BUG-TCM-092 (no-`testsuite_id` 500 crash) — CONFIRMED FIXED, live.** Loaded
  `/test_suites?project_id=rftc-016-ci-qa` (no `testsuite_id` param — the exact crashing condition) on a project
  with many real unassigned test-case issues (confirmed present throughout this session's other fixtures) — page
  loads cleanly, no 500, no `ArgumentError`. This is the real Test Suites page's own version of the bug (distinct
  from the kebab-menu copy on the Add Testcase page, already covered under Area 3).
- **BUG-TCM-090 (kebab menu permission-gating on this page)** — not separately re-run here; the real Test Suites
  page's kebab was already the *correctly-behaving* reference implementation the bug compared the Add Testcase
  page's broken copy against, so no regression risk specific to this page.

**Result: 1 bug freshly live-reproduced. No regressions, no new bugs.**

---

## Evidence Map

| TC ID | Result | Evidence |
|---|---|---|
| TC-TCM-192 | PASS | BUG-TCM-017 fix holds — Name+Description both save |
| TC-TCM-193 | PASS | sub-suite parent_id correctly set |
| TC-TCM-194 | PASS | BUG-TCM-018 fix holds — 3-level nesting works |
| TC-TCM-195 | PASS | 422, visible "Name cannot be blank", nothing created |
| TC-TCM-196 | PASS | duplicate name refused, only 1 row exists |
| TC-TCM-197 | PASS | name + description both persist on edit |
| TC-TCM-198 | PASS | confirmation modal shown, suite deleted |
| TC-TCM-199 | PASS | BUG-TCM-022 fix holds — issues survive on Testcase tracker |
| TC-TCM-200 | PASS | cascade deletes all 3 nested levels |
| TC-TCM-201 | PASS | count badge correct when enabled, absent when disabled |
| TC-TCM-202 | PASS | parent grid includes descendants' cases |
| TC-TCM-203 | PASS | zero suite-name overlap + 404 cross-project read |

**Execution summary 2026-10-22:** 12/12 PASS. No new bugs. BUG-TCM-017, BUG-TCM-018, and BUG-TCM-022 all
re-confirmed genuinely fixed on the current build.

- Screenshots only on failure, to `screenshots/<BUG-ID>/` (`CLAUDE.md` §6).
- TC-TCM-199 and TC-TCM-200 are the highest-risk cases — both probe whether deleting a container destroys data
  it should not own.
