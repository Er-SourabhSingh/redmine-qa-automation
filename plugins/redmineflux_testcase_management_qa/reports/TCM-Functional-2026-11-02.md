# Redmineflux Testcase Management — Functional Testing Report (CSV Import) — 2026-11-02

> One report per testing type per day (CLAUDE.md §7). Covers the CSV Import suite
> (`testcases/TESTCASE_MANAGEMENT_CSV_IMPORT.md`), run natively with `npx playwright test`
> (`automation/tests/TESTCASE_MANAGEMENT_CSV_IMPORT.spec.ts`, project `admin`, `SKIP_PROVISION=1`).

## Test Case Execution

Final full run: **21 / 21 TCs passed** (22 Playwright tests incl. the auth setup), 2.5 min.

| TC ID | Fixture (csv-test-data/) | Result |
|-------|--------------------------|--------|
| TC-TCM-021 | 01_legacy_single_step_format.csv | Pass |
| TC-TCM-022 | 01_legacy_single_step_format.csv | Pass |
| TC-TCM-023 | generated (Title/Description/Priority only) | Pass |
| TC-TCM-024 | 02_zero_to_fifty_steps_range.csv | Pass |
| TC-TCM-025 | 03, 04, 05 | Pass |
| TC-TCM-026 | 06_varying_step_counts_same_file.csv | **Pass on 3 of 5 full runs, Fail on 2 — BUG-TCM-129** (intermittent) |
| TC-TCM-027 | 12_non_sequential_step_numbering.csv | Pass |
| TC-TCM-028 | 13_special_characters_and_escaping.csv | Pass |
| TC-TCM-029 | 16, 17 | Pass |
| TC-TCM-030 | 08_boundary_2000_vs_2001_chars.csv | Pass |
| TC-TCM-031 | 08 (2001-char row, superseded by 40000 limit) | Pass |
| TC-TCM-032 | 07_oversized_step_text_negative.csv (superseded) | Pass |
| TC-TCM-033 | 10, 11 | Pass |
| TC-TCM-034 | 09_large_bulk_import_100_rows.csv | Pass |
| TC-TCM-035 | 15_header_case_and_whitespace_variations.csv | Pass |
| TC-TCM-036 | 14_duplicate_step_column_headers.csv | Pass |
| TC-TCM-037 | 18, 19, 20 (wide all-columns exports) | Pass |
| TC-TCM-275 | 22_jira_zephyr_migration_long_expected.csv | Pass |
| TC-TCM-276 | 21_boundary_40000_vs_40001_chars.csv | Pass |
| TC-TCM-277 | 01_legacy_single_step_format.csv | Pass |
| TC-TCM-279 | 01 + a required custom field (created and deleted by the test) | Pass |

**Summary:** 21 executed — 21 Pass (final run) / 0 Fail / 0 Blocked / 0 Skipped. TC-TCM-026 failed on 2 earlier full runs (see below).
Not covered by a TC, so not run: fixtures 23 (1000 rows) and 24 (45 columns x 1000 rows).

## Bugs / Defects Found

| Bug ID | Title | Severity | Status | Production Redmine Issue ID |
|--------|-------|----------|--------|------------------------------|
| BUG-TCM-129 | Steps shown in scrambled order on PostgreSQL — `has_many :steps` has no ORDER BY, `steps` has no position column | High | Open | not reported yet |

Caught by TC-TCM-026 ("Step 1" showed the text "Step 24"). Triage: **app bug**, not a test bug — saved rows are correct
(`ORDER BY id`), the association read is unordered. The spec was left asserting the correct behaviour. One test-bug fix was
made along the way: the custom-field page object's checkbox locators (TC-TCM-279), re-run and passing.

## Notes / Findings

- Redmine Version: 7.0 (Docker `redmine:7.0-bookworm`) — plugin branch `release/7.3.0`, commit `acda260`
- Environment: Docker `localhost:3003` (fresh install, PostgreSQL 16, project `pgtest`, Admin)
- Test Date: 2026-11-02
- This instance is a fresh PostgreSQL install, i.e. the exact condition (text columns, `limit = nil`) behind the step 4
  crash reported on 2026-11-02. With commit `acda260` step 4 returns 200 and TC-TCM-275/276 pass, including a 40000-char step
  saved at full length and a 40001-char step rejected with "exceeds the maximum length of 40000 characters (got 40001)".
- Corrective migration `20261103000004` was checked separately: on a database forced back to `varchar(40000)` it converts both
  columns to `text`, keeps the data, and is a no-op on re-run.
- Playwright MCP could not be used (server connection timed out), so the suite was run through the repo's own Playwright runner.
- Open question not tested: on MySQL the column limit is 16777215, so the 40000-char fallback never applies there and a
  40001-char step may pass the preview; whether the import then rejects it was not checked.
