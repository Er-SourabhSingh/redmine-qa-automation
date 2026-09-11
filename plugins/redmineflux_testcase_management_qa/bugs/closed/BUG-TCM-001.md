# BUG-TCM-001

- Bug ID: BUG-TCM-001
- Production Redmine Issue ID: <!-- never reported to production; nothing to sync on close -->
- Status: **Closed — fixed, retest PASS 2026-09-11**
- Title: CSV import silently drops the value of a step column whose header has leading/trailing whitespace
- Redmine version: 7.0.0 (retest); originally found on an unrecorded version
- Plugin name: Redmineflux Testcase Management
- Plugin version: v7.0.0
- Environment: Docker (`localhost:3010`, project `test-project`)
- Browser: (fill from environment)
- User role: QA / Manager (testcase-management create permission)
- Date: (external session — exact date not recorded; see `docs/TESTCASE_MANAGEMENT_CSV_IMPORT_REPORT.md`)

## Steps to reproduce

1. Testcase Management → Import → CSV
2. Upload a CSV whose header row contains a step column with leading/trailing whitespace, e.g. `" Step 1 "` instead of `"Step 1"` (with a correctly-named `Expected Result 1` pair)
3. Step 2 of the wizard (column mapping) — observe the padded header correctly auto-maps to the Step 1 field
4. Complete value mapping and preview
5. Confirm import
6. Open the created test case and inspect its Step 1 content

## Expected result

- Since the column correctly matched during mapping, its value should be read and saved like any normally-named column — the step should be present with its actual CSV content.

## Actual result

- The step's value is not read during actual import processing, despite the header being correctly matched in the mapping UI.
- The step is wrongly reported as "missing" and skipped in the preview.
- The final saved test case ends up with the **wrong step content silently promoted into its place** (i.e. a different step's content shifts into this step's position), rather than either the correct content or a clean omission.
- Non-padded headers (any letter case, internal double-spacing) are unaffected — only leading/trailing whitespace on the header triggers this.

## Evidence

### Screenshot — before the fix

Test case **#1014**, imported from the same fixture on 2026-09-02, shows the defect: only **one** step exists,
and it holds Step 2's content. The padded ` step 1 ` column's value was dropped and the next step was promoted
into its place.

![Before fix - test case 1014 has one step holding the wrong content](../../screenshots/BUG-TCM-001/before-fix-1014-step1-wrong-content.png)

```
#1014 (before fix):
  Step 1: Action under a double-spaced header   <-- Step 2's content, wrongly promoted
  Expected Result: Result under a lowercase header
  (no second step - the padded column's value was lost)
```

### Retest screenshot — PASS 2026-09-11

Same fixture re-imported as test case **#1023**. Both steps present, both correct, in the right positions.

![Retest 2026-09-11 PASS - test case 1023 has both steps with correct content](../../screenshots/BUG-TCM-001/retest-2026-09-11-pass.png)

```
#1023 (after fix):
  Step 1: Action under a lowercase/padded header   <-- padded " step 1 " column, read correctly
  Expected Result: Result under an uppercase header
  Step 2: Action under a double-spaced header
  Expected Result: Result under a lowercase header
```

Import preview reported **1 testcase will be created correctly, 0 warnings, 0 errors** — the step is no longer
wrongly reported as missing.

Observed fix behaviour: the header is now trimmed consistently at both mapping and value-read time. On the
step-2 mapping screen the CSV column ` step 1 ` is presented under the normalised key `step 1` and maps to the
`Step 1` field, and the value is read from that same normalised key at import time.

## Retest & regression

- **Retested:** 2026-09-11, Docker `localhost:3010`, Redmine 7.0.0, plugin v7.0.0, admin, Chromium 152.
- **Fixture used:** `automation/testdata/csv-test-data/15_header_case_and_whitespace_variations.csv`
  (headers ` step 1 `, `EXPECTED RESULT 1`, `Step  2`, `expected result 2`) — covers the padded-header case plus
  the case-variation and internal-double-space cases in one file.
- **TC-TCM-015:** FAIL → **PASS**.
- **Regression (`SENIOR_QA_STANDARDS.md` §26, Medium → all TCs in the affected suite):** full CSV Import suite
  re-run on 2026-09-11 — all 17 fixtures / 16 TCs (TC-TCM-001 … TC-TCM-016) **PASS**, zero new failures. See the
  Run History row in `docs/TESTCASE_MANAGEMENT_HANDOFF.md`.

### Console / log

- Found during CSV Import feature testing (external session); tracked in this repo as BUG-TCM-001.
- Retest produced no console or server errors.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Notes

- Found via `testcases/TESTCASE_MANAGEMENT_CSV_IMPORT.md` TC-TCM-015, fixture `automation/uploads/padded-header.csv` (paste in when available).
- Root-cause hypothesis (from external session): the mapping-resolution step trims/normalizes the header for matching purposes, but the value-read step later looks up the cell by the raw (untrimmed) header key, which no longer matches — so the lookup silently misses instead of erroring.
