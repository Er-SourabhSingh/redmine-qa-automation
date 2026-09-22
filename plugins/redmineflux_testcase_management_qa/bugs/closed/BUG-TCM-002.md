# BUG-TCM-002

- Bug ID: BUG-TCM-002
- Production Redmine Issue ID: <!-- never reported to production; nothing to sync on close -->
- Status: **Closed — fixed, retest PASS 2026-09-11**
- Title: CSV import silently discards the second occurrence of a duplicated column header with no warning
- Redmine version: 7.0.0 (retest); originally found on an unrecorded version
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

### Retest screenshot — PASS 2026-09-11

Step 2 of the wizard now shows an explicit warning banner **before** the user can confirm the import:

> ⚠ **Duplicate column names found: Step 1, Expected Result 1 — only the first occurrence of each will be used,
> the rest will be ignored.**

![Retest 2026-09-11 PASS - duplicate column warning shown on the mapping step](../../screenshots/BUG-TCM-002/retest-2026-09-11-pass.png)

This satisfies the Expected Result: the discard is still first-occurrence-wins, but it is no longer silent — the
user is told which columns are duplicated and exactly what will happen, while they can still cancel.

Completing the import produced test case **#1024** with the documented outcome, matching the warning:

```
#1024:
  Step 1: First occurrence action
  Expected Result: First occurrence expected
  (second occurrence ignored, exactly as the banner stated)
```

## Retest & regression

- **Retested:** 2026-09-11, Docker `localhost:3010`, Redmine 7.0.0, plugin v7.0.0, admin, Chromium 152.
- **Fixture used:** `automation/testdata/csv-test-data/14_duplicate_step_column_headers.csv`
  (header row carries `Step 1` and `Expected Result 1` twice each).
- **TC-TCM-036:** FAIL → **PASS**.
- **Regression (`SENIOR_QA_STANDARDS.md` §26, Medium → all TCs in the affected suite):** full CSV Import suite
  re-run on 2026-09-11 — all 17 fixtures / 16 TCs (TC-TCM-021 … TC-TCM-036) **PASS**, zero new failures. See the
  Run History row in `docs/TESTCASE_MANAGEMENT_HANDOFF.md`.

### Console / log

- Found during CSV Import feature testing (external session); tracked in this repo as BUG-TCM-002.
- Retest produced no console or server errors.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Notes

- Found via `testcases/TESTCASE_MANAGEMENT_CSV_IMPORT.md` TC-TCM-036, fixture `automation/uploads/duplicate-header.csv` (paste in when available).
- Related to BUG-TCM-001 in that both stem from header-matching/lookup edge cases in the same column-mapping code path, but the failure mode is distinct (silent overwrite/discard vs. mismatched lookup) — filed separately per the source report.
