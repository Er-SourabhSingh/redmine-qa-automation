# Testcase Management — Regression Testing Report — 2026-10-21

> Triggered by BUG-TCM-079's closure (High severity → full affected-suite regression, `SENIOR_QA_STANDARDS.md` §26).
> Scope: the entire CSV Import suite, since the fix touches the shared length-validation code path used by every
> CSV import.

## Test Case Execution

| TC ID | Result |
|-------|--------|
| TC-TCM-021 | PASS |
| TC-TCM-023 | PASS |
| TC-TCM-025 | PASS |
| TC-TCM-026 | PASS |
| TC-TCM-027 | PASS |
| TC-TCM-028 | PASS |
| TC-TCM-029 | PASS |
| TC-TCM-030 | PASS (expected result intentionally changed — see Notes) |
| TC-TCM-031 | PASS (expected result intentionally changed — see Notes) |
| TC-TCM-032 | PASS (expected result intentionally changed — see Notes) |
| TC-TCM-033 | PASS |
| TC-TCM-034 | PASS |
| TC-TCM-035 | PASS |
| TC-TCM-036 | PASS |
| TC-TCM-037 | PASS |
| TC-TCM-275 | PASS |
| TC-TCM-276 | PASS |
| TC-TCM-277 | PASS |
| TC-TCM-279 | PASS |

**Summary:** 19 executed — 19 Pass / 0 Fail / 0 Blocked / 0 Skipped

## Bugs / Defects Found

None — this is a clean regression pass following BUG-TCM-079's fix (see `TCM-Retest-2026-10-21.md` for the bug
closure itself).

## Regression Results

- Re-ran all 18 pre-existing CSV import fixture files (`automation/testdata/csv-test-data/01` through `20`, minus
  one unrelated encoding-dependent variant not touched by this fix) against the fixed build — **zero new
  failures**.
- Added and executed **TC-TCM-279**: created a required custom field on the Testcase tracker, imported a CSV with
  no column for it. Confirmed the plugin's existing, documented design — a missing required custom field produces
  a **warning only** ("Required custom field '...' is missing or empty; importing without it."), and never blocks
  import. All 5 test cases in the test file were created successfully despite the missing field.
- **Intentional, non-regression behavior change** on three pre-existing TCs, caused by BUG-TCM-079's fix itself:
  - TC-TCM-030 (2000-char step, previously the boundary): still PASS, now simply well under the new limit.
  - TC-TCM-031 (2001-char step, previously rejected as "just over the limit"): **now imports successfully** —
    correct, since 2001 is nowhere near the new 40000-char ceiling. This is the exact outcome the client's fix
    request was asking for, not a defect.
  - TC-TCM-032 (2500-char "oversized" step, previously rejected): **now imports successfully** — same reasoning.
  - The real "just over the limit" boundary is now owned by TC-TCM-276 (40000 valid / 40001 rejected).
- No other suite was affected — the fix is scoped entirely to `TestcaseImportController#step3`'s length check.

## Notes / Findings

- Redmine Version: 6.x (Docker)
- Environment: Docker `localhost:3015` (`C:\crux-redmine`), project `test`
- Test Date: 2026-10-21
- Full evidence and per-file breakdown in the "Regression Run — 2026-10-21" table at the bottom of
  `testcases/TESTCASE_MANAGEMENT_CSV_IMPORT.md`.
