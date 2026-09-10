# Features List — Redmineflux Testcase Management

> This file must be read before writing any test case. It defines the full feature scope for test coverage.

## Feature List

| # | Feature | Description | Covered by TC |
|---|---------|-------------|---------------|
| 1 | CSV Import — Test Steps & Expected Results | 4-step wizard (upload → column mapping → value mapping → preview/confirm) importing test cases from CSV, supporting both the legacy single `Steps`/`Expected` column pair and numbered `Step N`/`Expected Result N` columns, with per-step validation (missing pair → warning + skip, >2000 chars → error). | TC-TCM-001 – TC-TCM-016 (`testcases/TESTCASE_MANAGEMENT_CSV_IMPORT.md`) |

## Notes

- Feature #1's requirements/full field schema still need to be written up in `TESTCASE_MANAGEMENT_REQUIREMENTS.md` and `TESTCASE_MANAGEMENT_USER_GUIDE.md` — the coverage above came from an external test report, not a full requirements pass.
