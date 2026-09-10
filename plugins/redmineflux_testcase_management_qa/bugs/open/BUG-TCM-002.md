# BUG-TCM-002

- Bug ID: BUG-TCM-002
- Title: CSV import silently discards the second occurrence of a duplicated column header with no warning
- Redmine version: (fill from environment)
- Plugin name: Redmineflux Testcase Management
- Plugin version: v7.0.0
- Environment: Docker (`localhost:3010`, project `test-project`)
- Browser: (fill from environment)
- User role: QA / Manager (testcase-management create permission)
- Date: (external session — exact date not recorded; see `docs/TESTCASE_MANAGEMENT_CSV_IMPORT_REPORT.md`)

## Steps to reproduce

1. Testcase Management → Import → CSV
2. Upload a CSV whose header row contains the same column name twice, e.g. `Step 1` appearing in two separate columns (with different data in each)
3. Step through column mapping, value mapping, and preview — observe no warning or error about the duplicate header anywhere in the wizard
4. Confirm import
5. Open the created test case and inspect its Step 1 content

## Expected result

- Either both values are handled explicitly in some defined way, or the user is warned that one column's data will be discarded before they confirm the import.

## Actual result

- Only the **first** occurrence's data is kept.
- The second occurrence's data is silently discarded — no warning, no error, at any point in the wizard (mapping, value mapping, or preview).
- A user has no way to know data was dropped short of manually diffing the source CSV against the saved test case.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-TCM-002/descriptive-name.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-TCM-002/retest-yyyy-mm-dd-pass.png)

### Console / log

- Found during CSV Import feature testing (external session); tracked in this repo as BUG-TCM-002.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Notes

- Found via `testcases/TESTCASE_MANAGEMENT_CSV_IMPORT.md` TC-TCM-016, fixture `automation/uploads/duplicate-header.csv` (paste in when available).
- Related to BUG-TCM-001 in that both stem from header-matching/lookup edge cases in the same column-mapping code path, but the failure mode is distinct (silent overwrite/discard vs. mismatched lookup) — filed separately per the source report.
