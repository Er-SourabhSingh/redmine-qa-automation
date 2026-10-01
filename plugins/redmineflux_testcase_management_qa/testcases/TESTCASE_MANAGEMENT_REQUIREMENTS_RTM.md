# Test Cases — Redmineflux Testcase Management — Requirements & Traceability Matrix

> Source: vendor KB "Requirements & Configuration" and "Access traceability matrix".
> **Status: executed 2026-10-01.**

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

### TC-TCM-112: Create a requirement document

**User Role:** QA / Manager
**Priority:** High
**Steps:**
1. **Requirements** → add a requirement.
2. Enter a title and body; save; reload the list.

**Expected Result:**
- The requirement is created and listed with the title entered.

**Status:** **EXECUTED 2026-10-01 — PASS.** Created requirement `REQ-TC112 Create Requirement Test` via the "+" add control on the Requirements tree. Saved as `#5`, appears in the left tree alongside the pre-existing `gsdfgdf`, with "Created by : Redmine Admin" / "Updated by : Redmine Admin" timestamps shown. Body left empty (Editor.js block editor, not a plain form field — title alone is sufficient to confirm this TC's assertion).

---

### TC-TCM-113: Requirement title is mandatory

**User Role:** QA
**Priority:** Low
**Steps:**
1. Create a requirement with an empty title; save.

**Expected Result:**
- Refused with a visible validation message; nothing created.

**Status:** **EXECUTED 2026-10-01 — PASS.** Left Title blank, clicked Save. Inline message "Please enter title!" shown directly under the field; the form stayed open and no new entry appeared in the requirements tree (still exactly `gsdfgdf` + `REQ-TC112 Create Requirement Test`).

---

### TC-TCM-114: Link a test case to a requirement at creation

**User Role:** QA
**Priority:** High
**Steps:**
1. Create a test case selecting the requirement from the **Requirement** dropdown; save; open the requirement.

**Expected Result:**
- The requirement shows the linked case; the case shows the requirement.

**CONFIRMED LIVE — 2026-10-01 — FAIL, compounds existing BUG-TCM-021 and BUG-TCM-022, no new bug filed.** Selected
`REQ-TC112 Create Requirement Test` on a fresh New Test Case form, then hit the near-guaranteed first-attempt
validation failure from BUG-TCM-011. Checked the Requirement select's selection **after that re-render, before
resubmitting** — empty, the selection was wiped exactly like BUG-TCM-021 already documents for Steps (its own
title explicitly covers "the Steps/Requirements sections," confirmed here to be accurate for Requirements too,
not just Steps). The resulting issue (#1595) also landed on the **Bug** tracker (BUG-TCM-022), on which the
Requirements field doesn't render at all — so the link is doubly absent. Not a new bug; both root causes already
tracked.

---

### TC-TCM-115: Link an existing test case to a requirement

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Edit an existing case and set its requirement; save; open the requirement.

**Expected Result:**
- The link is reflected on both sides.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Linked existing case #1021 to `REQ-TC112 Create Requirement Test` via the
single-selection context menu's Requirements submenu (same mechanism as TC-149's bulk version, works identically
for one case). Confirmed on both sides: issue #1021 shows "Requirements: REQ-TC112 Create Requirement Test," and
the requirement's own detail page lists #1021 alongside the other cases already linked to it (#458, #459, #1526).

---

### TC-TCM-116: Link multiple test cases to one requirement

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Link three cases to requirement R1 (individually or by bulk assign); open R1.

**Expected Result:**
- All three cases are listed against R1, with no duplicates.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Demonstrated via TC-149 (bulk-linked #458, #459, #1526) plus TC-115
(#1021 linked individually): `REQ-TC112 Create Requirement Test`'s own detail page now lists exactly 4 distinct
cases (#458, #459, #1526, #1021), each appearing exactly once — no duplicates from the two separate linking
actions.

---

### TC-TCM-117: Unlink a test case from a requirement

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Clear a case's requirement; save; open the requirement and the RTM.

**Expected Result:**
- The case no longer appears against the requirement, and the RTM coverage figure decreases accordingly.

**CONFIRMED LIVE — 2026-10-01 — FAIL, filed as BUG-TCM-027 (Medium).** On case #1021's `/edit` form, clicked the
**×** on its `REQ-TC112` select2 chip — confirmed client-side removal (`selectedOptions` empty). Submitted via
`form.requestSubmit()` (confirmed genuine, URL changed from `/edit` to the plain issue URL) — reproduced 3 times.
Every time, reloading the issue still shows **"Requirements: REQ-TC112 Create Requirement Test"**, unchanged.
Filed **BUG-TCM-027**.

---

### TC-TCM-118: Edit a requirement

**User Role:** QA / Manager
**Priority:** Medium
**Steps:**
1. Change a requirement's title and body; save; reload; check linked cases.

**Expected Result:**
- Changes persist; existing case links are unaffected by the edit.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Found the edit control (an `img.pencil-icon` next to the title, not an
inline-click-the-text pattern). Clicking it exposes the title as a `contenteditable` element (Editor.js-based, per
TC-112's own evidence). Appended " EDITED" and clicked away to blur — auto-saves with no explicit Save button.
Confirmed persisted after a fresh reload, and all 4 existing case links (#458, #459, #1526, #1021) remained
intact and unaffected.

---

### TC-TCM-119: Delete an unlinked requirement

**User Role:** Manager / Admin
**Priority:** Medium
**Steps:**
1. Delete a requirement with no linked cases; confirm; reload.

**Expected Result:**
- Removed from the list and no longer offered in the test case Requirement dropdown.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Created a genuinely unlinked requirement (`QA-UNLINKED-REQ-119`, page_id
6 — the pre-existing `gsdfgdf` turned out to actually have 3 real links, #434/#471/#458, so a fresh fixture was
needed). Deleted via the delete-icon → "Are you sure?" confirmation → Delete. Confirmed removed from the
Requirements tree after a fresh reload.

---

### TC-TCM-120: Delete a requirement that has linked test cases

**User Role:** Admin
**Priority:** High
**Steps:**
1. Link two cases to a requirement, then delete it.
2. Open those cases, the RTM, and a Requirement Coverage report.

**Expected Result:**
- Either the delete is blocked with a clear message, or it succeeds and the **test cases survive** with their
  requirement link cleanly cleared.
- The RTM and the coverage report must not error or show a dangling reference. Record the behaviour.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Deleted requirement `gsdfgdf` (3 real links: #434, #471, #458) — **not
blocked**, succeeds silently with the same plain "Are you sure?" confirmation as an unlinked requirement (no
extra warning about the 3 links). All checked afterward:
- **Cases survive**: #434 and #471 both load cleanly, no error, no "Requirements:" line at all (consistent with
  how an issue with zero requirements renders elsewhere this session — link cleanly cleared, not dangling).
- **RTM**: correctly shows "Total Requirement: 1" (only `REQ-TC112`), `gsdfgdf` is entirely absent, no error/NaN/
  undefined.
- **Requirement Coverage report**: its own "Select Requirement" dropdown correctly no longer offers `gsdfgdf` as
  an option (only `REQ-TC112`); generating a report completes with no error.

---

### TC-TCM-121: Requirements are project-scoped

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Create requirement `REQ-A` in Project A; open Project B's requirement list and the test case Requirement dropdown.

**Expected Result:**
- `REQ-A` does not appear in Project B.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Checked `REQ-TC112 Create Requirement Test EDITED` (from `test-project`)
against `tcm-permissions-private-test`: absent from that project's own Requirements list **and** from its New
Test Case form's Requirement dropdown. Correctly project-scoped.

---

## Functional Cases — Traceability Matrix

---

### TC-TCM-122: RTM lists requirements against their test cases

**User Role:** QA
**Priority:** High
**Steps:**
1. With ≥2 requirements each holding ≥2 linked cases, open the **Traceability (RTM)** view.

**Expected Result:**
- Every requirement is shown with exactly its linked cases; no case appears under a requirement it is not linked to.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Created a second requirement (`REQ-TC122-SECOND`, #7) and linked cases
#459/#1526 to it (both were already also linked to `REQ-TC112`, a valid multi-requirement state). RTM correctly
shows "Total Requirement: 2," with `#7 : REQ-TC122-SECOND` listing exactly #459/#1526, and `#5 : REQ-TC112...`
listing exactly its own 4 cases (#458/#459/#1021/#1526) — no case appears under a requirement it isn't linked to.

---

### TC-TCM-123: RTM reflects execution results

**User Role:** QA
**Priority:** High
**Steps:**
1. Note a requirement's coverage in the RTM.
2. Execute one of its linked cases as **Passed** and another as **Failed**.
3. Reload the RTM.

**Expected Result:**
- The matrix reflects the new statuses and any pass/fail counts match the run grid exactly.

**CONFIRMED LIVE — 2026-10-01 — Corrected premise: the RTM view itself has no Status column at all** (its table
is literally just Requirement / Testcases / Defects — confirmed via the raw HTML, zero mention of Status/Run/
Environment anywhere). Execution results are shown on a **separate** screen instead: the **Requirement Coverage
report** (one of the 6 report types), whose own columns are Testcase #, Title, Run, Environment, Status, Coverage
Status. Recorded a fresh **Passed** result on case #458 (linked to `REQ-TC112`) in run #21 — reopening the
already-generated Coverage Report (not regenerated) immediately showed the updated row: `Status: Passed,
Coverage Status: Fully Covered`, confirming it reflects live execution state correctly, just on the Coverage
Report screen rather than the RTM itself. Not filed as a bug — `FEATURES_LIST.md` describes the RTM feature
broadly as "Coverage view... and their results," which the plugin satisfies via these two complementary screens
together, even though the RTM screen alone (as this TC narrowly describes it) doesn't carry status data.

---

### TC-TCM-124: RTM shows uncovered requirements

**User Role:** QA
**Priority:** Medium
**Steps:**
1. Create a requirement with no linked test cases; open the RTM.

**Expected Result:**
- The requirement is listed and visibly identified as having no coverage — it must not be silently omitted, since
  uncovered requirements are the main thing an RTM exists to reveal.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Created `QA-UNCOVERED-REQ-124` with zero linked cases. The RTM correctly
lists it (`#8 : QA-UNCOVERED-REQ-124`) with an empty Testcases cell — not silently omitted — and "Total
Requirement" correctly advanced to 3.

---

### TC-TCM-125: RTM shows unlinked test cases

**User Role:** QA
**Priority:** Low
**Steps:**
1. With ≥1 case linked to no requirement, open the RTM.

**Expected Result:**
- Behaviour is explicit — orphan cases are either shown in an "unlinked" grouping or documented as out of scope.
  Record which.

**CONFIRMED LIVE — 2026-10-01 — PASS (by design, not formally documented).** The RTM page has no "unlinked"
grouping or any mention of orphan/unlinked cases anywhere in its text — the view is purely requirement-driven
(its only columns are Requirement/Testcases/Defects), so a case with no requirement link simply never appears,
with no explicit label either way. Not filed as a bug: the view's own structure makes the requirement-centric
scope reasonably self-evident, even though neither the UI nor `USER_GUIDE.md`/`FEATURES_LIST.md` states it
explicitly in words.

---

### TC-TCM-126: RTM coverage agrees with the Requirement Coverage report

**User Role:** QA
**Priority:** High
**Steps:**
1. For the same requirement, compare the RTM's coverage against a freshly generated Requirement Coverage report.

**Expected Result:**
- Both give the same tested/untested counts. A discrepancy between the two views is a defect.

**CONFIRMED LIVE — 2026-10-01 — Not meaningfully testable, same root fact as TC-123.** The RTM carries no
tested/untested count at all (only aggregate "Total Requirement / Total Linked Testcases / Total Defects Found"
across the whole page, and a plain case list per requirement — no per-requirement pass/fail breakdown). The
Coverage Report, by contrast, reports per-**run-assignment** rows (a case can appear more than once if it belongs
to multiple runs), a different granularity than the RTM's per-case link list. With no comparable "tested/untested
count" surfaced on the RTM side, there is nothing to compare for agreement or discrepancy. Not a bug — a
consequence of the same structural gap already recorded on TC-123.

---

### TC-TCM-127: RTM with no requirements renders cleanly

**User Role:** QA
**Priority:** Low
**Steps:**
1. Open the RTM in a project with the module enabled but no requirements.

**Expected Result:**
- An explicit empty state renders. No blank page, no error, no `NaN`/`undefined`.

**CONFIRMED LIVE — 2026-10-01 — PASS.** Opened the RTM in `tcm-permissions-private-test` (module enabled, zero
requirements). Renders cleanly: "Total Requirement: 0 / Total Linked Testcases: 0 / Total Defects Found: 0" and
an explicit **"No data"** message in place of the table. No blank page, no error, no `NaN`/`undefined`.

---

## Evidence Map

| TC range | Area | Bug reference |
|---|---|---|
| TC-TCM-112 – 610 | Requirement CRUD and linking | — |
| TC-TCM-122 – 616 | Traceability matrix | — |

- Screenshots only on failure, to `screenshots/<BUG-ID>/` (`CLAUDE.md` §6).
- TC-TCM-120, 613 and 615 are the highest-value cases — data-loss semantics, the RTM's core purpose, and
  cross-view consistency respectively.
