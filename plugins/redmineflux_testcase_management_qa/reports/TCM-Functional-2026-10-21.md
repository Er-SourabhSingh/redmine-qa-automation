# Testcase Management — Functional Testing Report — 2026-10-21

> Covers the client-reported "expected field limited to 2000 chars" fix verification — the discovery half, before
> the dev's CSV Import fix landed. See `TCM-Retest-2026-10-21.md` for the same-day retest after the fix.

## Test Case Execution

| TC ID | Result |
|-------|--------|
| TC-TCM-275 | FAIL |
| TC-TCM-276 | FAIL |
| TC-TCM-277 | PASS |

**Summary:** 3 executed — 1 Pass / 2 Fail / 0 Blocked / 0 Skipped

## Bugs / Defects Found

| Bug ID | Title | Severity | Status | Production Redmine Issue ID |
|--------|-------|----------|--------|------------------------------|
| BUG-TCM-079 | CSV Import still hard-rejects any step/expected-result content over 2000 characters, even though the step/expected columns were migrated to a 40000-char limit | High | Open (same day, later closed — see Retest report) | #124155 |

## Notes / Findings

- Client reported the `expected` field in the `steps` table was limited to 2000 characters, blocking migration of
  existing Jira/Zephyr test cases (long expected-result text) into Redmine. Dev provided a fixed build on
  `C:\crux-redmine` with migration `20261021000000_increase_step_and_expected_column_length_in_steps.rb`.
- Confirmed the DB/model/view layer fix works correctly: live DB schema shows `steps.step`/`steps.expected` as
  `varchar(40000)`; a direct UI test case create with a 35,000-char expected result saved with zero truncation.
- However, **CSV Import — the exact migration path the client's request is about — was never updated to match.**
  `TestcaseImportController#step3` still hard-coded the old 2000-char ceiling independently of the column
  migration, silently excluding any row over 2000 chars from import (including the new 40,000-char limit itself).
  Filed as BUG-TCM-079 (High) with full evidence (screenshots, new CSV test data
  `21_boundary_40000_vs_40001_chars.csv` / `22_jira_zephyr_migration_long_expected.csv`).
- Baseline CSV import regression (short-content, legacy format) re-confirmed clean (TC-TCM-277 PASS) — the defect
  is isolated to the length check, not a wider import regression.
- Redmine Version: 6.x (Docker)
- Environment: Docker `localhost:3015` (`C:\crux-redmine`), project `test`
- Test Date: 2026-10-21
