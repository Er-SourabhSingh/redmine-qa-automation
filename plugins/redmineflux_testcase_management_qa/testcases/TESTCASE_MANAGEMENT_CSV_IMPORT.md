# Test Cases — Redmineflux Testcase Management — CSV Import (Steps & Expected Results)

> Source: `docs/TESTCASE_MANAGEMENT_CSV_IMPORT_REPORT.md`. Covers the 4-step CSV import wizard (upload → column mapping → value mapping → preview/confirm) for both the legacy single `Steps`/`Expected` column pair and the new numbered `Step N`/`Expected Result N` columns.
>
> Evidence for these TCs was gathered in an external session before this suite existed in-repo. Each TC below is marked **CONFIRMED (external session)** rather than the usual live-in-session marker — reproduce locally when convenient to upgrade to a full in-session confirmation. Paste each CSV fixture into `automation/uploads/` using the filename noted in that TC's Evidence line, and bug screenshots into `screenshots/BUG-TCM-00X/` (see `bugs/open/`).

## Plugin
- Name: Redmineflux Testcase Management
- Version: v7.0.0
- Redmine version: (fill from environment)
- Path: plugins/redmineflux_testcase_management_qa

## Navigation methodology

All cases below go through the plugin's own CSV Import wizard (Testcase Management → Import → CSV), not a direct API call — every row's final saved state must be confirmed by opening the created test case afterward, not just trusted from the wizard's preview screen.

---

## Functional Cases

---

### TC-TCM-001: Legacy single Steps/Expected column import (backward compatibility)

**User Role:** QA / Manager (whoever holds testcase-management create permission)
**Precondition:** A CSV using only the legacy `Steps` / `Expected` column pair (no numbered `Step N` columns).

**Steps:**
1. Testcase Management → Import → CSV
2. Upload a legacy-format CSV (suggested fixture name: `automation/uploads/legacy-steps-expected.csv`)
3. Step through column mapping (auto-map should resolve `Steps`→Steps, `Expected`→Expected Result), value mapping, and preview
4. Confirm import
5. Open the created test case and inspect its Steps/Expected Result content directly

**Expected Result:**
- Test case imports unchanged from the legacy format
- **CONFIRMED (external session)**: PASS — legacy columns import unchanged.

---

### TC-TCM-002: Legacy row with missing Expected Result is skipped, case still created

**User Role:** QA / Manager
**Precondition:** Legacy-format CSV with one row's `Expected` cell empty but `Steps` cell filled.

**Steps:**
1. Import the CSV per TC-TCM-001's flow (fixture: `automation/uploads/legacy-missing-expected.csv`)
2. Reach the preview step and note the Warning status on the affected row
3. Confirm import
4. Open the created test case

**Expected Result:**
- The incomplete step is skipped with a warning; the rest of the test case still imports
- **CONFIRMED (external session)**: PASS.

---

### TC-TCM-003: Zero-step CSV (no Step section at all)

**User Role:** QA / Manager
**Precondition:** CSV with only Title/Description/Priority columns, no Steps/Expected columns of any kind.

**Steps:**
1. Import the CSV (fixture: `automation/uploads/zero-steps.csv`)
2. Complete the wizard, confirm import
3. Open the created test case

**Expected Result:**
- Test case is created with no steps, no error
- **CONFIRMED (external session)**: PASS.

---

### TC-TCM-004: 50-step CSV imports fully, correctly numbered and ordered

**User Role:** QA / Manager
**Precondition:** CSV with Step 1..Step 50 / Expected Result 1..50, all pairs populated.

**Steps:**
1. Import the CSV (fixture: `automation/uploads/fifty-steps.csv`)
2. Complete the wizard, confirm import
3. Open the created test case and verify all 50 steps are present, in order, with correct paired expected results

**Expected Result:**
- All 50 steps present, correctly numbered/ordered, none dropped or reordered
- **CONFIRMED (external session)**: PASS.

---

### TC-TCM-005: Steps-only row and Expected-only row are each skipped with a warning

**User Role:** QA / Manager
**Precondition:** New numbered-column CSV where one `Step N` cell has no matching `Expected Result N`, and another row has the reverse.

**Steps:**
1. Import the CSV (fixture: `automation/uploads/step-only-and-expected-only.csv`)
2. Check preview for Warning status on both affected rows
3. Confirm import, open the created test case(s)

**Expected Result:**
- Both incomplete steps are skipped with a warning; the test case is still created with its remaining valid steps
- **CONFIRMED (external session)**: PASS.

---

### TC-TCM-006: Varying step counts within one file — no cross-contamination

**User Role:** QA / Manager
**Precondition:** CSV with multiple rows (test cases) of different step counts, including one 30-step row.

**Steps:**
1. Import the CSV (fixture: `automation/uploads/varying-step-counts.csv`)
2. Confirm import
3. Open each created test case and verify its own step count/content, independent of neighboring rows

**Expected Result:**
- The 30-step case imports with all 30 steps intact; no row's steps leak into another row's test case
- **CONFIRMED (external session)**: PASS.

---

### TC-TCM-007: Non-sequential step numbering (Step 1 / Step 3 / Step 5) is renumbered on import

**User Role:** QA / Manager
**Precondition:** CSV with columns `Step 1`, `Step 3`, `Step 5` (and matching Expected Result columns) — gaps at 2 and 4.

**Steps:**
1. Import the CSV (fixture: `automation/uploads/non-sequential-steps.csv`)
2. Check column mapping correctly resolves each present column
3. Confirm import, open the created test case

**Expected Result:**
- Columns map and import correctly; the saved test case shows them renumbered contiguously as steps 1, 2, 3
- **CONFIRMED (external session)**: PASS.

---

### TC-TCM-008: Special characters, unicode, emoji, and embedded newlines are stored correctly

**User Role:** QA / Manager
**Precondition:** CSV with step/expected text containing unicode text, emoji, and embedded newlines within a quoted CSV cell.

**Steps:**
1. Import the CSV (fixture: `automation/uploads/special-characters.csv`)
2. Confirm import
3. Open the created test case and inspect the raw DOM/field content directly (not just a rendered screenshot — a font-rendering artifact can look like corruption when the underlying data is fine)

**Expected Result:**
- All content stored correctly, byte-for-byte
- **CONFIRMED (external session)**: PASS — initial screenshot review suggested a rendering issue; re-checked via direct DOM inspection and confirmed a false alarm, data is stored correctly.

---

### TC-TCM-009: Header missing an entire column family (Step-only or Expected-only headers)

**User Role:** QA / Manager
**Precondition:** CSV whose header row has `Step N` columns but no `Expected Result N` columns at all (or vice versa) — a structural mismatch, not just a per-row gap.

**Steps:**
1. Import the CSV (fixture: `automation/uploads/missing-column-family.csv`)
2. Check preview
3. Confirm import, open the created test case

**Expected Result:**
- All steps in the affected family are skipped gracefully; the test case is still created
- **CONFIRMED (external session)**: PASS.

---

## Boundary / Negative Cases

---

### TC-TCM-010: Step text at the 2000-character limit imports successfully

**User Role:** QA / Manager
**Precondition:** CSV with one step's text exactly 2000 characters.

**Steps:**
1. Import the CSV (fixture: `automation/uploads/step-2000-chars.csv`)
2. Confirm import, open the created test case, verify the full text is present

**Expected Result:**
- Imports successfully at the boundary
- **CONFIRMED (external session)**: PASS.

---

### TC-TCM-011: Step text over the 2000-character limit (2001 chars) is rejected

**User Role:** QA / Manager
**Precondition:** Same CSV structure as TC-TCM-010, one character over (2001).

**Steps:**
1. Import the CSV (fixture: `automation/uploads/step-2001-chars.csv`)
2. Check preview for a precise error message on the offending row

**Expected Result:**
- Import is rejected with a specific error message identifying the length violation
- **CONFIRMED (external session)**: PASS.

---

### TC-TCM-012: Oversized step text (2500 chars) rejects the whole test case, zero imported

**User Role:** QA / Manager
**Precondition:** CSV with one step at 2500 characters.

**Steps:**
1. Import the CSV (fixture: `automation/uploads/step-2500-chars.csv`)
2. Confirm import

**Expected Result:**
- "No testcases to import" — the entire test case is rejected, zero created
- **CONFIRMED (external session)**: PASS.

---

### TC-TCM-013: Empty file / header-only file

**User Role:** QA / Manager
**Precondition:** One CSV with zero bytes, one CSV with only a header row and no data rows.

**Steps:**
1. Attempt to import each file (fixtures: `automation/uploads/empty-file.csv`, `automation/uploads/header-only.csv`)

**Expected Result:**
- Clean, specific error message for each case; no crash
- **CONFIRMED (external session)**: PASS.

---

### TC-TCM-014: Large bulk import (100 test cases × 3 steps each)

**User Role:** QA / Manager
**Precondition:** CSV with 100 data rows, each with 3 populated step/expected pairs.

**Steps:**
1. Import the CSV (fixture: `automation/uploads/bulk-100x3.csv`)
2. Complete the wizard, confirm import
3. Spot-check several created test cases

**Expected Result:**
- Completes in one pass, no timeout, no crash, all 100 test cases created correctly
- **CONFIRMED (external session)**: PASS.

---

## Defect Cases (filed as bugs)

---

### TC-TCM-015: Step column header with leading/trailing whitespace

**User Role:** QA / Manager
**Precondition:** CSV with a header like `" Step 1 "` (leading/trailing spaces) instead of `"Step 1"`.

**Steps:**
1. Import the CSV (fixture: `automation/uploads/padded-header.csv`)
2. Check column mapping — the padded header correctly matches to the Step 1 field
3. Confirm import, open the created test case

**Expected Result:**
- The step's value should be read and saved like any other correctly-mapped column
- **CONFIRMED (external session)**: **FAIL** — mapping is correct but the value is not read during import; the step is wrongly reported as missing and skipped, and the wrong content is silently promoted into its place. Non-padded headers (any case, internal double-spacing) are unaffected. Filed as **BUG-TCM-001**.

---

### TC-TCM-016: Duplicated column header (Step 1 appears twice)

**User Role:** QA / Manager
**Precondition:** CSV whose header row has `Step 1` listed twice (two separate columns, same name).

**Steps:**
1. Import the CSV (fixture: `automation/uploads/duplicate-header.csv`)
2. Check column mapping and preview for any warning about the duplicate
3. Confirm import, open the created test case

**Expected Result:**
- Either both values are handled explicitly, or the user is warned that one will be discarded
- **CONFIRMED (external session)**: **FAIL** — only the first occurrence's data is kept; the second is silently discarded with no warning or error anywhere in the wizard. Filed as **BUG-TCM-002**.

---

## Notes (non-bug observations)

- **Preview vs. final step numbering mismatch**: when a step is skipped, the final saved test case renumbers surviving steps contiguously (1, 2, 3...), while the import preview still shows them under their original CSV column numbers with a visible gap. Not incorrect, but could read as confusing to someone reviewing the preview before confirming. No TC/bug filed for this — tracked here and in `docs/TESTCASE_MANAGEMENT_MEMORY.md`.

## Evidence Map

| TC ID | CSV fixture (in `automation/uploads/`) | Bug reference |
|---|---|---|
| TC-TCM-001 | legacy-steps-expected.csv | — |
| TC-TCM-002 | legacy-missing-expected.csv | — |
| TC-TCM-003 | zero-steps.csv | — |
| TC-TCM-004 | fifty-steps.csv | — |
| TC-TCM-005 | step-only-and-expected-only.csv | — |
| TC-TCM-006 | varying-step-counts.csv | — |
| TC-TCM-007 | non-sequential-steps.csv | — |
| TC-TCM-008 | special-characters.csv | — |
| TC-TCM-009 | missing-column-family.csv | — |
| TC-TCM-010 | step-2000-chars.csv | — |
| TC-TCM-011 | step-2001-chars.csv | — |
| TC-TCM-012 | step-2500-chars.csv | — |
| TC-TCM-013 | empty-file.csv, header-only.csv | — |
| TC-TCM-014 | bulk-100x3.csv | — |
| TC-TCM-015 | padded-header.csv | BUG-TCM-001 |
| TC-TCM-016 | duplicate-header.csv | BUG-TCM-002 |
