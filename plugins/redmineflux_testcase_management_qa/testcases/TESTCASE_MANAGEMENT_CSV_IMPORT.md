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
- **2026-09-02 (external session)**: **FAIL** — mapping was correct but the value was not read during import; the step was wrongly reported as missing and skipped, and the wrong content was silently promoted into its place (test case #1014). Filed as **BUG-TCM-001**.
- **2026-09-11 retest (localhost:3010, Redmine 7.0.0, plugin v7.0.0, admin)**: **PASS** — re-imported the same fixture as test case **#1023**; both steps present with correct content, preview reported 1 correct / 0 warnings / 0 errors. Header is now trimmed consistently at mapping and value-read time. **BUG-TCM-001 closed.**

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
- **2026-09-02 (external session)**: **FAIL** — only the first occurrence's data was kept; the second was silently discarded with no warning or error anywhere in the wizard. Filed as **BUG-TCM-002**.
- **2026-09-11 retest (localhost:3010, Redmine 7.0.0, plugin v7.0.0, admin)**: **PASS** — step 2 of the wizard now shows "Duplicate column names found: Step 1, Expected Result 1 — only the first occurrence of each will be used, the rest will be ignored." before the user confirms. Saved case #1024 matches the warning. **BUG-TCM-002 closed.**

---

### TC-TCM-017: Wide CSV — all-columns Redmine issue export does not overflow the session cookie

**User Role:** Admin / QA (testcase-management create permission)
**Precondition:** A project with many issue custom fields defined, so that an "All Columns" issue export produces a
wide header. This suite's fixture was produced with **15 custom fields** added, giving **45 columns**.
**Regression origin:** production issue **#118789** — step 4 returned a 500 (`ActionDispatch::Cookies::CookieOverflow`,
session cookie 4802 bytes) because `TestcaseImportController` stored `csv_columns` and `field_mappings` directly in
the session. Fixed by moving them to `tmp/import_meta_<user_id>.yml`.

**Steps:**
1. Administration → Custom fields → create enough issue custom fields that an all-columns export is wide
   (note: Redmine caps a custom field **name at 30 characters** — longer names are rejected).
2. Project → **Issues** → filter to all statuses → **CSV** export → select **All Columns** → export.
   (Equivalent URL parameter: `c[]=all_inline`.)
3. Project → **TestCases** → **Import Testcases** → step 1: upload that CSV, set **Encoding** to match the export
   (Redmine exports as Windows-1252 by default here, not UTF-8) → **Next**.
4. Step 2 — review the auto-mapped columns → **Next**.
5. Step 3 — map Status/Priority values → **Next**.
6. Step 4 — observe.

**Expected Result:**
- Step 4 loads and renders the import preview with per-row validation status and importable/warning/error counts.
- **No 500**, and no `CookieOverflow` / `FATAL` in the server log.
- The column and mapping data is written to `tmp/import_meta_<user_id>.yml`; only small values (file paths,
  settings, counts) remain in the session.

**CONFIRMED PASS 2026-09-15** on `localhost:3010` (Redmine 7.0.0, plugin v7.0.0) with a **45-column / 500-row /
121,525-byte** export — 50% wider than the ~30 columns that triggered the original defect. `POST .../step4`
returned `200 OK in 1176ms`; steps 2 and 3 also 200; no `CookieOverflow`. `import_meta_1.yml` held the 45 columns
(2,121 bytes). Evidence: `screenshots/RETEST-118789/step4-renders-preview-no-500.png`,
`logs/RETEST-118789-2026-09-15.log`, fixture `automation/testdata/csv-test-data/18_all_columns_export_118789.csv`.

**CONFIRMED PASS 2026-09-15 on Redmine 6 as well** — repeated end-to-end on `localhost:3012`
(**Redmine 6.1.3**, plugin v7.0.0) after creating 15 custom fields there, giving a **44-column / 727-char-header**
all-columns export. Step 4 rendered the preview (5 rows, 0 errors); no 500. This matters because the original
defect was reported on **Redmine 6.1.1** — so the fix is confirmed on the Redmine major version the bug was
raised against, not only on Redmine 7. Evidence: `screenshots/RETEST-118789/step4-redmine6-1-3-no-500.png`,
fixture `automation/testdata/csv-test-data/19_all_columns_export_118789_redmine6.csv`.

Plugin **7.0.0 is a single release supporting Redmine 5, 6 and 7** — the version renumber was for Redmine 7
compatibility, not a fork. There is no separate 6.x maintenance line, so this one release is what every customer
gets. **All three supported Redmine versions verified:**

| Redmine | Instance | Plugin | Columns | Header chars | Separator / encoding | Step 4 |
|---|---|---|---|---|---|---|
| 7.0.0 | `localhost:3010` | 7.0.0 | 45 | 752 | `,` / Windows-1252 | **200 OK** — preview rendered |
| 6.1.3 | `localhost:3012` | 7.0.0 | 44 | 727 | `,` / UTF-8 | **preview rendered**, no 500 |
| 5.1.12 | `localhost:3011` | 7.0.0 | 38 | 424 | `;` / Windows-1252 | **preview rendered**, no 500 |

Every run is above the ~30 columns that produced the original 4,802-byte cookie overflow, and every run rendered
step 4. Evidence: `screenshots/RETEST-118789/step4-renders-preview-no-500.png`,
`step4-redmine6-1-3-no-500.png`, `step4-redmine5-1-12-no-500.png`.

**Separator/encoding vary by instance and locale — check before importing.** The German-locale Redmine 5 instance
exports **semicolon**-separated cp1252 (Redmine uses `;` where comma is the decimal separator); `localhost:3010`
exports comma-separated Windows-1252; `localhost:3012` comma-separated UTF-8. Step 1's **Field Separator** and
**Encoding** must both match the file or the wizard misreads it.

**Note on the per-row outcomes:** the Redmine 7 and 6 runs reported every row "with warnings", 0 errors. That is expected and not a
defect — an issue export contains no `Step N` / `Expected Result N` columns, so every row warns about missing
steps. The assertion here is that step 4 *renders*, not that the rows import cleanly.

On the German-locale Redmine 5 instance all 25 rows reported **Error / "(no subject)"** instead. That is a
**separate observation, not this defect** — the step-2 auto-mapper matches English column headers, so the German
`Thema` column was not mapped to Subject, and the run was clicked through without correcting the mapping by hand.
Worth a dedicated test case for localized column headers; it does not affect the step-4 rendering assertion here,
which is what #118789 was about.

**Note on encoding:** the two instances exported different encodings — `localhost:3010` produced Windows-1252,
`localhost:3012` produced UTF-8. Check the file and set step 1's **Encoding** accordingly; the wizard defaults to
UTF-8 and mangles content otherwise.

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
| TC-TCM-015 | `automation/testdata/csv-test-data/15_header_case_and_whitespace_variations.csv` | BUG-TCM-001 (closed 2026-09-11) |
| TC-TCM-016 | `automation/testdata/csv-test-data/14_duplicate_step_column_headers.csv` | BUG-TCM-002 (closed 2026-09-11) |
| TC-TCM-017 | `18_all_columns_export_118789.csv` (R7), `19_..._redmine6.csv` (R6), `20_..._redmine5.csv` (R5) — all in `automation/testdata/csv-test-data/` | production #118789 — retest PASS 2026-09-15 on all three supported Redmine versions |

---

## Regression Run — 2026-09-11 (post BUG-TCM-001 / BUG-TCM-002 fix)

Environment: Docker `localhost:3010` (container `redmine-docker-700-redmine-1`), Redmine 7.0.0, plugin v7.0.0,
project `test-project`, user `admin`, Chromium 152. Scope per `SENIOR_QA_STANDARDS.md` §26 (Medium severity → all
TCs in the affected suite). Fixtures: `automation/testdata/csv-test-data/`.

| TC | Fixture | Preview result | Verdict |
|---|---|---|---|
| TC-TCM-001 | 01_legacy_single_step_format.csv | 4 correct / 1 warning / 0 errors; legacy `Steps`/`Expected` auto-mapped | PASS |
| TC-TCM-002 | 01 (row with missing Expected) | row warned & skipped, case still created | PASS |
| TC-TCM-003 | 02_zero_to_fifty_steps_range.csv | 51 correct / 0 / 0; 0-step row imports with no steps | PASS |
| TC-TCM-004 | 02 (50-step row) | step count exact for all 50 cases, 0 mismatches, ordered | PASS |
| TC-TCM-005 | 03_steps_only_no_expected.csv / 04_expected_only_no_steps.csv | 0 correct / 5 warnings / 0 errors each | PASS |
| TC-TCM-006 | 05_mixed_partial_per_row.csv | 2 correct / 4 warnings / 0 errors; mid-sequence gap skips only that step | PASS |
| TC-TCM-006 | 06_varying_step_counts_same_file.csv | 5 correct / 0 / 0; step counts exactly 1, 3, 7, 15, 30 | PASS |
| TC-TCM-007 | 12_non_sequential_step_numbering.csv | 1 correct / 0 / 0; preview shows 1/3/5, saved case #1009 renumbered 1/2/3 with correct content | PASS |
| TC-TCM-008 | 13_special_characters_and_escaping.csv | 2 correct / 0 / 0; quotes, commas, emoji 🚀, café/naïve/日本語/тест and embedded newlines round-trip exactly | PASS |
| TC-TCM-009 | 16_step_columns_without_expected_columns_in_header.csv | 1 warning, 3 sub-warnings "Step N is missing its expected result; this step will be skipped" | PASS |
| TC-TCM-009 | 17_expected_columns_without_step_columns_in_header.csv | mirror: 3 sub-warnings "Step N is missing its step text" | PASS |
| TC-TCM-010 | 08_boundary_2000_vs_2001_chars.csv (2000-char row) | accepted, 1 correct | PASS |
| TC-TCM-011 | 08 (2001-char row) | rejected, 1 error | PASS |
| TC-TCM-012 | 07_oversized_step_text_negative.csv | 0 correct / 0 warnings / 1 error — "Step 1: step content exceeds the maximum length of 2000 characters (got 2500)"; case not imported | PASS |
| TC-TCM-013 | 10_header_only_no_data_rows.csv | blocked at step 2: "The CSV file contains headers but no data rows." | PASS |
| TC-TCM-013 | 11_completely_empty_file.csv | blocked at step 2: "The file does not contain any headers or data." | PASS |
| TC-TCM-014 | 09_large_bulk_import_100_rows.csv | 100 correct / 0 / 0; full wizard in ~544 ms, no timeout | PASS |
| TC-TCM-015 | 15_header_case_and_whitespace_variations.csv | 1 correct / 0 / 0; padded header's value read correctly (case #1023) | PASS (was FAIL) |
| TC-TCM-016 | 14_duplicate_step_column_headers.csv | duplicate-header warning shown before confirm; case #1024 matches it | PASS (was FAIL) |

**Result: 16/16 TCs PASS, zero new failures.** BUG-TCM-001 and BUG-TCM-002 moved to `bugs/closed/`.

Method note: TC-TCM-015 and TC-TCM-016 (the two retests that gate the bug closures) were executed end-to-end
through the real wizard UI, including performing the import and opening the saved test case. The remaining
fixtures were driven through the same four wizard endpoints from the authenticated browser session and asserted
on the rendered step-2 mapping screen and step-4 preview summary.
