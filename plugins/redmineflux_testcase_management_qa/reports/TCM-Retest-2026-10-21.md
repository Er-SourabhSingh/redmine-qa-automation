# Testcase Management — Retest Testing Report — 2026-10-21

## Test Case Execution

| TC ID | Result |
|-------|--------|
| TC-TCM-275 | PASS |
| TC-TCM-276 | PASS |
| TC-TCM-277 | PASS |

**Summary:** 3 executed — 3 Pass / 0 Fail / 0 Blocked / 0 Skipped

## Bugs / Defects Found

| Bug ID | Title | Severity | Status | Production Redmine Issue ID |
|--------|-------|----------|--------|------------------------------|
| BUG-TCM-079 | CSV Import still hard-rejects any step/expected-result content over 2000 characters | High | Closed — retest PASS | #124155 → Done, 100% |

## Fix Verification / Retesting

- **Fix:** `TestcaseImportController#step3` no longer hard-codes `2000` — it now reads the real limit dynamically
  from the column definition (`Step.columns_hash['step'/'expected'].limit`) and uses it in both the length
  comparisons and the error message text. Matches this bug's own Suggested Fix exactly, so it can never drift out
  of sync with the column migration again.
- Restarted `C:\crux-redmine` to pick up the fix, confirmed the source change directly.
- **TC-TCM-275** (Jira/Zephyr migration CSV — 5,000/15,000/35,000-char expected, plus a 12,000-char step): all 4
  rows now show **OK**, 0 errors. Completed the import and confirmed via direct DB query
  (`length(step)`/`length(expected)`) that every value was saved at its exact original length — zero truncation.
- **TC-TCM-276** (exact 40000/40001-char boundary): the exactly-40,000-char row is now **OK** (DB-confirmed
  `length(step) = 40000`), and the 40,001-char row is still correctly **rejected** — now with the corrected error
  message (`"...exceeds the maximum length of 40000 characters (got 40001)"` instead of the stale "2000
  characters").
- **TC-TCM-277** (baseline short-content regression, legacy format): unchanged — 4 correct / 1 expected warning /
  0 errors, identical to the pre-fix and original 2026-09-11 baseline. No regression.
- **Verdict: FIXED.** The client's actual motivating use case (migrating long Jira/Zephyr test cases via CSV
  import) now works end to end, at every length tested from 5,000 up to and including the exact new 40,000-char
  ceiling, with zero truncation and zero regression to ordinary short-content imports.
- `BUG-TCM-079` moved to `bugs/closed/`; production **#124155 synced to Done/100%** with a retest-confirmation
  note citing the fix and all three retested scenarios.

## Notes / Findings

- Redmine Version: 6.x (Docker)
- Environment: Docker `localhost:3015` (`C:\crux-redmine`), project `test`
- Test Date: 2026-10-21
- Full CSV Import suite regression triggered by this closure (High severity → whole affected suite, per
  `SENIOR_QA_STANDARDS.md` §26) — see `TCM-Regression-2026-10-21.md`.
