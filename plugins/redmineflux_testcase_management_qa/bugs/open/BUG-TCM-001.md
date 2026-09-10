# BUG-TCM-001

- Bug ID: BUG-TCM-001
- Title: CSV import silently drops the value of a step column whose header has leading/trailing whitespace
- Redmine version: (fill from environment)
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

### Screenshot

![Bug evidence](../../screenshots/BUG-TCM-001/descriptive-name.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-TCM-001/retest-yyyy-mm-dd-pass.png)

### Console / log

- Found during CSV Import feature testing (external session); tracked in this repo as BUG-TCM-001.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Notes

- Found via `testcases/TESTCASE_MANAGEMENT_CSV_IMPORT.md` TC-TCM-015, fixture `automation/uploads/padded-header.csv` (paste in when available).
- Root-cause hypothesis (from external session): the mapping-resolution step trims/normalizes the header for matching purposes, but the value-read step later looks up the cell by the raw (untrimmed) header key, which no longer matches — so the lookup silently misses instead of erroring.
