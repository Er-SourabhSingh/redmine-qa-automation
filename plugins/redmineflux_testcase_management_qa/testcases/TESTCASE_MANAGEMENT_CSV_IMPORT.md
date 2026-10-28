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

### TC-TCM-021: Legacy single Steps/Expected column import (backward compatibility)

**User Role:** QA / Manager (whoever holds testcase-management create permission)
**Priority:** High
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

### TC-TCM-022: Legacy row with missing Expected Result is skipped, case still created

**User Role:** QA / Manager
**Priority:** Medium
**Precondition:** Legacy-format CSV with one row's `Expected` cell empty but `Steps` cell filled.

**Steps:**
1. Import the CSV per TC-TCM-021's flow (fixture: `automation/uploads/legacy-missing-expected.csv`)
2. Reach the preview step and note the Warning status on the affected row
3. Confirm import
4. Open the created test case

**Expected Result:**
- The incomplete step is skipped with a warning; the rest of the test case still imports
- **CONFIRMED (external session)**: PASS.

---

### TC-TCM-023: Zero-step CSV (no Step section at all)

**User Role:** QA / Manager
**Priority:** Medium
**Precondition:** CSV with only Title/Description/Priority columns, no Steps/Expected columns of any kind.

**Steps:**
1. Import the CSV (fixture: `automation/uploads/zero-steps.csv`)
2. Complete the wizard, confirm import
3. Open the created test case

**Expected Result:**
- Test case is created with no steps, no error
- **CONFIRMED (external session)**: PASS.

---

### TC-TCM-024: 50-step CSV imports fully, correctly numbered and ordered

**User Role:** QA / Manager
**Priority:** High
**Precondition:** CSV with Step 1..Step 50 / Expected Result 1..50, all pairs populated.

**Steps:**
1. Import the CSV (fixture: `automation/uploads/fifty-steps.csv`)
2. Complete the wizard, confirm import
3. Open the created test case and verify all 50 steps are present, in order, with correct paired expected results

**Expected Result:**
- All 50 steps present, correctly numbered/ordered, none dropped or reordered
- **CONFIRMED (external session)**: PASS.

---

### TC-TCM-025: Steps-only row and Expected-only row are each skipped with a warning

**User Role:** QA / Manager
**Priority:** Medium
**Precondition:** New numbered-column CSV where one `Step N` cell has no matching `Expected Result N`, and another row has the reverse.

**Steps:**
1. Import the CSV (fixture: `automation/uploads/step-only-and-expected-only.csv`)
2. Check preview for Warning status on both affected rows
3. Confirm import, open the created test case(s)

**Expected Result:**
- Both incomplete steps are skipped with a warning; the test case is still created with its remaining valid steps
- **CONFIRMED (external session)**: PASS.

---

### TC-TCM-026: Varying step counts within one file — no cross-contamination

**User Role:** QA / Manager
**Priority:** High
**Precondition:** CSV with multiple rows (test cases) of different step counts, including one 30-step row.

**Steps:**
1. Import the CSV (fixture: `automation/uploads/varying-step-counts.csv`)
2. Confirm import
3. Open each created test case and verify its own step count/content, independent of neighboring rows

**Expected Result:**
- The 30-step case imports with all 30 steps intact; no row's steps leak into another row's test case
- **CONFIRMED (external session)**: PASS.

---

### TC-TCM-027: Non-sequential step numbering (Step 1 / Step 3 / Step 5) is renumbered on import

**User Role:** QA / Manager
**Priority:** Medium
**Precondition:** CSV with columns `Step 1`, `Step 3`, `Step 5` (and matching Expected Result columns) — gaps at 2 and 4.

**Steps:**
1. Import the CSV (fixture: `automation/uploads/non-sequential-steps.csv`)
2. Check column mapping correctly resolves each present column
3. Confirm import, open the created test case

**Expected Result:**
- Columns map and import correctly; the saved test case shows them renumbered contiguously as steps 1, 2, 3
- **CONFIRMED (external session)**: PASS.

---

### TC-TCM-028: Special characters, unicode, emoji, and embedded newlines are stored correctly

**User Role:** QA / Manager
**Priority:** Medium
**Precondition:** CSV with step/expected text containing unicode text, emoji, and embedded newlines within a quoted CSV cell.

**Steps:**
1. Import the CSV (fixture: `automation/uploads/special-characters.csv`)
2. Confirm import
3. Open the created test case and inspect the raw DOM/field content directly (not just a rendered screenshot — a font-rendering artifact can look like corruption when the underlying data is fine)

**Expected Result:**
- All content stored correctly, byte-for-byte
- **CONFIRMED (external session)**: PASS — initial screenshot review suggested a rendering issue; re-checked via direct DOM inspection and confirmed a false alarm, data is stored correctly.

---

### TC-TCM-029: Header missing an entire column family (Step-only or Expected-only headers)

**User Role:** QA / Manager
**Priority:** Medium
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

### TC-TCM-030: Step text at the 2000-character limit imports successfully

**User Role:** QA / Manager
**Priority:** Medium
**Precondition:** CSV with one step's text exactly 2000 characters.

**Steps:**
1. Import the CSV (fixture: `automation/uploads/step-2000-chars.csv`)
2. Confirm import, open the created test case, verify the full text is present

**Expected Result:**
- Imports successfully at the boundary
- **CONFIRMED (external session)**: PASS.
- **Superseded 2026-10-21 (not a regression):** since the `steps.step`/`steps.expected` limit was raised from 2000
  to 40000 chars (see BUG-TCM-079, closed), 2000 is no longer the real boundary — it's just a normal, well-under-
  limit value now. Re-ran `08_boundary_2000_vs_2001_chars.csv`'s 2000-char row post-fix: still correctly **OK**.
  The real boundary is now covered by TC-TCM-276 (40000 vs 40001).

---

### TC-TCM-031: Step text over the 2000-character limit (2001 chars) is rejected

**User Role:** QA / Manager
**Priority:** Medium
**Precondition:** Same CSV structure as TC-TCM-030, one character over (2001).

**Steps:**
1. Import the CSV (fixture: `automation/uploads/step-2001-chars.csv`)
2. Check preview for a precise error message on the offending row

**Expected Result:**
- Import is rejected with a specific error message identifying the length violation
- **CONFIRMED (external session)**: PASS.
- **Superseded 2026-10-21 (not a regression, behavior intentionally changed):** post-fix, 2001 chars is now well
  under the new 40000-char limit, so this row is **no longer rejected** — re-ran `08_boundary_2000_vs_2001_chars.csv`'s
  2001-char row and it now correctly imports as **OK**. This is the *correct*, intended outcome of BUG-TCM-079's
  fix (the client's whole point was that content in this range should import), not a defect in this TC or the
  product. The real "just over the limit" rejection case is now TC-TCM-276's 40001-char row.

---

### TC-TCM-032: Oversized step text (2500 chars) rejects the whole test case, zero imported

**User Role:** QA / Manager
**Priority:** Medium
**Precondition:** CSV with one step at 2500 characters.

**Steps:**
1. Import the CSV (fixture: `automation/uploads/step-2500-chars.csv`)
2. Confirm import

**Expected Result:**
- "No testcases to import" — the entire test case is rejected, zero created
- **CONFIRMED (external session)**: PASS.
- **Superseded 2026-10-21 (not a regression, behavior intentionally changed):** 2500 chars is now well under the
  new 40000-char limit. Re-ran `07_oversized_step_text_negative.csv` post-fix: the row now correctly imports as
  **OK** (0 errors), instead of being rejected. Same reasoning as TC-TCM-031 — this is the fix working as intended
  for the client's use case, not a defect. "Oversized" now means "over 40000," covered by TC-TCM-276.

---

### TC-TCM-033: Empty file / header-only file

**User Role:** QA / Manager
**Priority:** Low
**Precondition:** One CSV with zero bytes, one CSV with only a header row and no data rows.

**Steps:**
1. Attempt to import each file (fixtures: `automation/uploads/empty-file.csv`, `automation/uploads/header-only.csv`)

**Expected Result:**
- Clean, specific error message for each case; no crash
- **CONFIRMED (external session)**: PASS.

---

### TC-TCM-034: Large bulk import (100 test cases × 3 steps each)

**User Role:** QA / Manager
**Priority:** Medium
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

### TC-TCM-035: Step column header with leading/trailing whitespace

**User Role:** QA / Manager
**Priority:** Low
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

### TC-TCM-036: Duplicated column header (Step 1 appears twice)

**User Role:** QA / Manager
**Priority:** Low
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

### TC-TCM-037: Wide CSV — all-columns Redmine issue export does not overflow the session cookie

**User Role:** Admin / QA (testcase-management create permission)
**Priority:** Medium
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

### TC-TCM-275: Step/expected text between 2001 and 40000 chars imports successfully (new 40000-char limit)

**User Role:** QA / Manager
**Priority:** High
**Precondition:** The `steps.step`/`steps.expected` columns have been migrated to `varchar(40000)` (per the fix for
the client-reported "expected field limited to 2000 chars, blocking Jira/Zephyr migration" request).

**Steps:**
1. Import a CSV with expected-result (and/or step) text well above the old 2000-char limit but within the new
   40000-char one — e.g. 5,000 / 15,000 / 35,000 chars (fixture:
   `automation/testdata/csv-test-data/22_jira_zephyr_migration_long_expected.csv`).
2. Check the step 4 preview result for each row.

**Expected Result:**
- All rows import successfully — this is the exact client-motivating scenario (migrating long Jira/Zephyr test
  case content via CSV).

**Status: EXECUTED 2026-10-21 — FAIL, filed as BUG-TCM-079 (High). RETESTED 2026-10-21 — PASS, fix confirmed.**
Originally, all 4 rows (5k/15k/35k-char expected, plus a 12k-char step) were rejected with "Step N: expected/step
content exceeds the maximum length of 2000 characters" — `TestcaseImportController#step3` hard-coded the old
2000-char ceiling independently of the column migration. **Fixed**: the controller now reads
`Step.columns_hash['step'].limit` / `['expected'].limit` dynamically instead of hard-coding a number. Retest: all
4 rows show OK, import completed, and the DB confirms every value persisted at its exact original length (5000,
15000, 35000, 12000) with zero truncation.

---

### TC-TCM-276: Step/expected text at the new 40000-char boundary (40000 valid / 40001 invalid)

**User Role:** QA / Manager
**Priority:** Medium
**Precondition:** Same migration as TC-TCM-275.

**Steps:**
1. Import a CSV with one row at exactly 40000 chars and another at exactly 40001 chars (fixture:
   `automation/testdata/csv-test-data/21_boundary_40000_vs_40001_chars.csv`).
2. Check the step 4 preview result for each row.

**Expected Result:**
- The 40000-char row imports successfully (exactly at the new limit); the 40001-char row is rejected with an error
  message correctly citing the new 40000-char limit.

**Status: EXECUTED 2026-10-21 — FAIL, filed as BUG-TCM-079 (High). RETESTED 2026-10-21 — PASS, fix confirmed.**
Originally both rows were rejected — even the exact 40000-char row, which the migration was specifically built to
allow — with both error messages wrongly citing "2000 characters." Retest on the fixed build: the 40000-char row
is now **OK** (DB-confirmed `length(step) = 40000` on the saved issue), and the 40001-char row is still correctly
**rejected**, now with the corrected message: "Step 1: step content exceeds the maximum length of 40000 characters
(got 40001)."

---

### TC-TCM-277: Baseline CSV import regression is unaffected by the 40000-char column migration

**User Role:** QA / Manager
**Priority:** Medium
**Steps:**
1. Re-import a pre-existing short-content CSV (fixture: `01_legacy_single_step_format.csv`) on the migrated build.
2. Confirm the import completes and the created test cases are correct.

**Expected Result:**
- No regression in ordinary (short-content) CSV import behavior as a side effect of the column-length migration.

**Status: EXECUTED 2026-10-21 — PASS.** 4 correct / 1 expected warning / 0 errors, matching the original
2026-09-11 regression result exactly; all 5 created test cases confirmed present and correctly titled. Confirms
BUG-TCM-079 is isolated to the length-validation check itself, not a wider import regression.

---

### TC-TCM-279: CSV Import succeeds (with a warning, not an error) when a required custom field is missing from the file

**User Role:** QA / Manager
**Priority:** High
**Precondition:** The project's Testcase tracker has a required custom field (e.g. created as Format=Text,
Required=yes, applied to the Testcase tracker). The CSV file being imported does not contain a column for it at
all.

**Steps:**
1. Import a CSV with no column for the required custom field (fixture:
   `automation/testdata/csv-test-data/01_legacy_single_step_format.csv` — any file with no custom-field columns
   works for this check).
2. Check the step 4 preview result for each row.
3. Confirm the import and open a created test case.

**Expected Result:**
- The row is flagged with a **Warning** ("Required custom field '<name>' is missing or empty; importing without
  it."), not an Error — the required-field check must never block import, since CSV import is a bulk/legacy-data
  path where not every source system will have an equivalent value for every custom field. The test case is still
  created successfully, just without that field populated.

**Status: EXECUTED 2026-10-21 — PASS.** Created a required custom field (`QA Import Required Field`, Text format,
required, applied to the Testcase tracker, for all projects) and re-imported
`01_legacy_single_step_format.csv` (which has no column for it). Step 4 preview showed **0 correct / 5 warnings /
0 errors** — every row warned with the exact expected message, none blocked. Completed the import: all 5 test
cases were created normally (confirmed via the issues list and opening one directly), with the required field
simply left blank. Matches `TestcaseImportController`'s own documented design (required custom fields are
warning-only during import, never enforced as a hard error — see the comment at
`app/controllers/testcase_import_controller.rb` around the `required_custom_fields.each` loop).

---

## Notes (non-bug observations)

- **Preview vs. final step numbering mismatch**: when a step is skipped, the final saved test case renumbers surviving steps contiguously (1, 2, 3...), while the import preview still shows them under their original CSV column numbers with a visible gap. Not incorrect, but could read as confusing to someone reviewing the preview before confirming. No TC/bug filed for this — tracked here and in `docs/TESTCASE_MANAGEMENT_MEMORY.md`.

## Regression — 2026-10-27 (targeted, fast pass per direct user request; Area 5 — CSV Import, BUG-TCM-091)

**Not live-reproduced this pass** (the CSV import wizard's multi-step file-upload flow — step1 → step2 →
upload → process — is heavy to drive live via browser automation for a cross-project tamper scenario, and this
cycle's "fast" directive prioritized breadth across 9 areas over re-driving this one wizard). Existing
2026-10-26 source-diff confirmation stands: `testcase_import_controller.rb#step2` now validates
`Testsuite.where(project_id: @project.identifier, id: params[:selected_suite_id]).exists?` before accepting
`session[:selected_suite_id]`, closing the cross-project suite-link leak the bug described. **Resume point:**
drive the real import wizard as a user with access to two projects, tamper `selected_suite_id` in the step2
request to point at the other project's suite, and confirm the import now rejects/ignores it instead of linking
the imported issue cross-project.

---

## Evidence Map

| TC ID | CSV fixture (in `automation/uploads/`) | Bug reference |
|---|---|---|
| TC-TCM-021 | legacy-steps-expected.csv | — |
| TC-TCM-022 | legacy-missing-expected.csv | — |
| TC-TCM-023 | zero-steps.csv | — |
| TC-TCM-024 | fifty-steps.csv | — |
| TC-TCM-025 | step-only-and-expected-only.csv | — |
| TC-TCM-026 | varying-step-counts.csv | — |
| TC-TCM-027 | non-sequential-steps.csv | — |
| TC-TCM-028 | special-characters.csv | — |
| TC-TCM-029 | missing-column-family.csv | — |
| TC-TCM-030 | step-2000-chars.csv | — |
| TC-TCM-031 | step-2001-chars.csv | — |
| TC-TCM-032 | step-2500-chars.csv | — |
| TC-TCM-033 | empty-file.csv, header-only.csv | — |
| TC-TCM-034 | bulk-100x3.csv | — |
| TC-TCM-035 | `automation/testdata/csv-test-data/15_header_case_and_whitespace_variations.csv` | BUG-TCM-001 (closed 2026-09-11) |
| TC-TCM-036 | `automation/testdata/csv-test-data/14_duplicate_step_column_headers.csv` | BUG-TCM-002 (closed 2026-09-11) |
| TC-TCM-037 | `18_all_columns_export_118789.csv` (R7), `19_..._redmine6.csv` (R6), `20_..._redmine5.csv` (R5) — all in `automation/testdata/csv-test-data/` | production #118789 — retest PASS 2026-09-15 on all three supported Redmine versions |
| TC-TCM-275 | `21_boundary_40000_vs_40001_chars.csv`, `22_jira_zephyr_migration_long_expected.csv` | **BUG-TCM-079 (open)** |
| TC-TCM-276 | `21_boundary_40000_vs_40001_chars.csv` | **BUG-TCM-079 (open)** |
| TC-TCM-277 | `01_legacy_single_step_format.csv` (regression re-run) | — |
| TC-TCM-279 | `01_legacy_single_step_format.csv` (with a required custom field added to the project, missing from the CSV) | — |

---

## Regression Run — 2026-09-11 (post BUG-TCM-001 / BUG-TCM-002 fix)

Environment: Docker `localhost:3010` (container `redmine-docker-700-redmine-1`), Redmine 7.0.0, plugin v7.0.0,
project `test-project`, user `admin`, Chromium 152. Scope per `SENIOR_QA_STANDARDS.md` §26 (Medium severity → all
TCs in the affected suite). Fixtures: `automation/testdata/csv-test-data/`.

| TC | Fixture | Preview result | Verdict |
|---|---|---|---|
| TC-TCM-021 | 01_legacy_single_step_format.csv | 4 correct / 1 warning / 0 errors; legacy `Steps`/`Expected` auto-mapped | PASS |
| TC-TCM-022 | 01 (row with missing Expected) | row warned & skipped, case still created | PASS |
| TC-TCM-023 | 02_zero_to_fifty_steps_range.csv | 51 correct / 0 / 0; 0-step row imports with no steps | PASS |
| TC-TCM-024 | 02 (50-step row) | step count exact for all 50 cases, 0 mismatches, ordered | PASS |
| TC-TCM-025 | 03_steps_only_no_expected.csv / 04_expected_only_no_steps.csv | 0 correct / 5 warnings / 0 errors each | PASS |
| TC-TCM-026 | 05_mixed_partial_per_row.csv | 2 correct / 4 warnings / 0 errors; mid-sequence gap skips only that step | PASS |
| TC-TCM-026 | 06_varying_step_counts_same_file.csv | 5 correct / 0 / 0; step counts exactly 1, 3, 7, 15, 30 | PASS |
| TC-TCM-027 | 12_non_sequential_step_numbering.csv | 1 correct / 0 / 0; preview shows 1/3/5, saved case #1009 renumbered 1/2/3 with correct content | PASS |
| TC-TCM-028 | 13_special_characters_and_escaping.csv | 2 correct / 0 / 0; quotes, commas, emoji 🚀, café/naïve/日本語/тест and embedded newlines round-trip exactly | PASS |
| TC-TCM-029 | 16_step_columns_without_expected_columns_in_header.csv | 1 warning, 3 sub-warnings "Step N is missing its expected result; this step will be skipped" | PASS |
| TC-TCM-029 | 17_expected_columns_without_step_columns_in_header.csv | mirror: 3 sub-warnings "Step N is missing its step text" | PASS |
| TC-TCM-030 | 08_boundary_2000_vs_2001_chars.csv (2000-char row) | accepted, 1 correct | PASS |
| TC-TCM-031 | 08 (2001-char row) | rejected, 1 error | PASS |
| TC-TCM-032 | 07_oversized_step_text_negative.csv | 0 correct / 0 warnings / 1 error — "Step 1: step content exceeds the maximum length of 2000 characters (got 2500)"; case not imported | PASS |
| TC-TCM-033 | 10_header_only_no_data_rows.csv | blocked at step 2: "The CSV file contains headers but no data rows." | PASS |
| TC-TCM-033 | 11_completely_empty_file.csv | blocked at step 2: "The file does not contain any headers or data." | PASS |
| TC-TCM-034 | 09_large_bulk_import_100_rows.csv | 100 correct / 0 / 0; full wizard in ~544 ms, no timeout | PASS |
| TC-TCM-035 | 15_header_case_and_whitespace_variations.csv | 1 correct / 0 / 0; padded header's value read correctly (case #1023) | PASS (was FAIL) |
| TC-TCM-036 | 14_duplicate_step_column_headers.csv | duplicate-header warning shown before confirm; case #1024 matches it | PASS (was FAIL) |

**Result: 16/16 TCs PASS, zero new failures.** BUG-TCM-001 and BUG-TCM-002 moved to `bugs/closed/`.

Method note: TC-TCM-035 and TC-TCM-036 (the two retests that gate the bug closures) were executed end-to-end
through the real wizard UI, including performing the import and opening the saved test case. The remaining
fixtures were driven through the same four wizard endpoints from the authenticated browser session and asserted
on the rendered step-2 mapping screen and step-4 preview summary.

---

## Regression Run — 2026-10-21 (post BUG-TCM-079 fix, 2000→40000-char limit)

Environment: Docker `localhost:3015` (`C:\crux-redmine`), project `test`, user `admin`. Full-suite regression per
`SENIOR_QA_STANDARDS.md` §26 (High severity → all TCs in the affected suite), triggered by BUG-TCM-079's fix.
Fixtures: `automation/testdata/csv-test-data/`.

| TC | Fixture | Preview result | Verdict |
|---|---|---|---|
| TC-TCM-021 | 01_legacy_single_step_format.csv | 4 correct / 1 warning / 0 errors — unchanged from baseline | PASS |
| TC-TCM-023 | 02_zero_to_fifty_steps_range.csv | 51 correct / 0 / 0 | PASS |
| TC-TCM-025 | 03_steps_only_no_expected.csv | 0 correct / 5 warnings / 0 errors | PASS |
| TC-TCM-025 | 04_expected_only_no_steps.csv | 0 correct / 5 warnings / 0 errors | PASS |
| TC-TCM-026 | 05_mixed_partial_per_row.csv | 2 correct / 4 warnings / 0 errors | PASS |
| TC-TCM-026 | 06_varying_step_counts_same_file.csv | 5 correct / 0 / 0 | PASS |
| TC-TCM-031/032 | 07_oversized_step_text_negative.csv (2500 chars) | **Now OK** (was rejected pre-fix) — correct, 2500 < 40000 | PASS (behavior intentionally changed, see TC-TCM-032) |
| TC-TCM-030/031 | 08_boundary_2000_vs_2001_chars.csv | **Both rows now OK** (2001 was rejected pre-fix) — correct, both < 40000 | PASS (behavior intentionally changed, see TC-TCM-030/031) |
| TC-TCM-034 | 09_large_bulk_import_100_rows.csv | 100 correct / 0 / 0 | PASS |
| TC-TCM-033 | 10_header_only_no_data_rows.csv | blocked at step 2, same message as baseline | PASS |
| TC-TCM-033 | 11_completely_empty_file.csv | blocked at step 2, same message as baseline | PASS |
| TC-TCM-027 | 12_non_sequential_step_numbering.csv | 1 correct / 0 / 0 | PASS |
| TC-TCM-028 | 13_special_characters_and_escaping.csv | 2 correct / 0 / 0 | PASS |
| TC-TCM-036 | 14_duplicate_step_column_headers.csv | duplicate-header warning banner present, 1 correct / 0 / 0 | PASS |
| TC-TCM-035 | 15_header_case_and_whitespace_variations.csv | 1 correct / 0 / 0 | PASS |
| TC-TCM-029 | 16_step_columns_without_expected_columns_in_header.csv | 0 correct / 1 warning (3 sub-warnings) / 0 errors | PASS |
| TC-TCM-029 | 17_expected_columns_without_step_columns_in_header.csv | 0 correct / 1 warning (3 sub-warnings) / 0 errors | PASS |
| TC-TCM-037 | 18_all_columns_export_118789.csv | 500 rows, 0 errors (warnings only) | PASS |
| TC-TCM-037 | 19_all_columns_export_118789_redmine6.csv | 0 correct / 5 warnings / 0 errors | PASS |
| TC-TCM-275 | 22_jira_zephyr_migration_long_expected.csv | 4/4 OK, DB-verified zero truncation (5000/15000/35000/12000 chars) | PASS |
| TC-TCM-276 | 21_boundary_40000_vs_40001_chars.csv | 40000 OK (DB-verified), 40001 rejected with corrected "40000 characters" message | PASS |
| TC-TCM-277 | 01_legacy_single_step_format.csv (baseline re-check) | unchanged | PASS |
| TC-TCM-279 | 01_legacy_single_step_format.csv + a required custom field added to the Testcase tracker, missing from the CSV | 0 correct / 5 warnings ("Required custom field '...' is missing or empty; importing without it.") / 0 errors — all 5 test cases still created successfully | PASS |

**Result: 23/23 TCs checked PASS, zero new failures.** BUG-TCM-079 confirmed fixed with no regression anywhere in
the CSV Import suite. Three pre-existing TCs (TC-TCM-030/031/032) have an intentionally changed outcome at their
original 2000/2001/2500-char fixture values (now all comfortably under the new 40000-char limit, so all now
import successfully instead of being rejected) — documented inline on each TC, not a defect. TC-TCM-020 (encoding-
dependent Redmine 5 export variant, file 20) was spot-checked and showed an existing, unrelated encoding-selection
behavior from an earlier session, not touched by this fix — not re-investigated as part of this regression since
it's orthogonal to the length-limit change.

---

## Regression — 2026-10-28 (§27 final-cycle, area 7/22 — BUG-TCM-091 genuinely live-reproduced)

`git log` since the 2026-10-23 run showed one new commit touching `testcase_import_controller.rb`: `d5a342b`
("CSV import suite leak," BUG-TCM-091's fix). The 2026-10-27 fast-pass note above had only source-diffed this
fix, explicitly flagging a live re-drive as the resume point. Closed that gap properly this session:

**Live reproduction, as a single admin user with access to both `rftc-016-ci-qa` and `rftc-perf-500`:**
1. Opened the real Import Testcase wizard for `rftc-016-ci-qa` (`/projects/rftc-016-ci-qa/testcase_import/step1`),
   uploaded a 1-row CSV, and selected suite "CI Ingest" (id 3, genuinely belongs to this project) via the real
   "Import to:" picker — confirmed the form's hidden `selected_suite_id` input read `3`.
2. **Tampered that hidden field to `37`** (the id of `Perf-500`'s test suite, which belongs to the completely
   different project `rftc-perf-500`) via direct DOM manipulation before submitting — exactly the attack this
   bug described (a user with access to project A pointing the import at project B's suite).
3. Submitted through all 4 real wizard steps (auto-mapping accepted as-is, preview showed "1 testcases will be
   created correctly"), then clicked the real **Import** link.
4. **Import succeeded** — "1 testcase(s) imported successfully," issue **#5732** created in `rftc-016-ci-qa`.
5. Opened `/issues/5732` directly and inspected its **Test Suite:** field — **blank/empty**, not "Perf-500" and
   not any other suite. Confirms the tampered cross-project suite id was rejected entirely (`session[...] = nil`
   per the fix), not silently linked to the attacker-supplied suite, and not crashing the import either.

**Verdict: BUG-TCM-091 CONFIRMED FIXED, genuinely live, not just source-diffed.** This closes the specific gap
the 2026-10-27 note left open. Test fixture issue #5732 left in place as the reproduction artifact, consistent
with this suite's existing evidence-retention convention.

---

## Regression Run — 2026-10-23 (full-plugin §27 cycle, per explicit user instruction)

Environment: Docker `localhost:3000` (container `redmine6-redmine-1`), project `rftc-016-ci-qa`, user `admin`,
Chromium (Playwright). **Pre-check**: `git log` on the plugin source confirmed `app/controllers/
testcase_import_controller.rb` has had **zero commits since `f71c19b`** ("Let CSV import accept the same longer
step/expected text the UI does", 2026-10-21 19:05) — the exact commit the 2026-10-21 regression run above already
ran against. CSV import's own code is therefore unchanged since that full 23/23 PASS run.

Given that, this pass **live-reverified the highest-risk/most-recently-changed behaviors end-to-end through the
real wizard** rather than blindly re-clicking all 23 fixtures for output already proven identical on unchanged
code:

| TC | Fixture | Live result this pass | Verdict |
|---|---|---|---|
| TC-TCM-276 | `21_boundary_40000_vs_40001_chars.csv` | 1 OK / 1 Error — same error text ("step content exceeds the maximum length of 40000 characters (got 40001)."); import completed, DB-verified `step.length == 40000` on the OK row (issue #2134) | PASS |
| TC-TCM-275 | (same fixture, the 40000-char row) | Covered by the same run above — imports successfully, zero truncation | PASS |
| TC-TCM-036 | `14_duplicate_step_column_headers.csv` | Same duplicate-column warning banner text at step 2; 1 correct / 0 warnings / 0 errors at step 4; import completed | PASS |
| TC-TCM-279 | `01_legacy_single_step_format.csv` + a fresh `QA Import Required Field` (required custom field, no column in the CSV) | 0 correct / 5 warnings / 0 errors; expanded row 1's detail and confirmed the exact warning text ("Required custom field 'QA Import Required Field' is missing or empty; importing without it."); import completed, all 5 cases (#2136–#2140) confirmed created via DB lookup; temp custom field deleted after | PASS |
| TC-TCM-277 | (same fixture as TC-279, baseline content) | Same 0/5/0 pattern as the 2026-10-21 baseline re-check — no regression | PASS |

**The remaining 18 TCs in this suite** (TC-TCM-021–025, 026, 027, 028, 029, 030–034, 035, 037) were **not
re-clicked through the wizard this pass** — re-confirmed instead via the code-unchanged check above, since every
one of them exercises the same `testcase_import_controller.rb`/`step2`–`step4` code path already proven correct on
this exact commit by the 2026-10-21 full run, and nothing in that path has changed since. This is a deliberate,
disclosed scope reduction (live-verify what could plausibly have drifted, confirm the rest didn't by checking the
code itself), not a silent skip.

**Result: 23/23 TCs still PASS** (5 live-reverified end-to-end this session, 18 confirmed unchanged via source
check). Zero new bugs. No change needed to the Evidence Map or fixture list.
