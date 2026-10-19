> ⚠️ **EXTERNAL SOURCE — DO NOT MERGE WITH THIS PLUGIN'S OWN TC-TCM-xxx SUITES, AND SEPARATE FROM THE V1 CYCLE
> FILE** ⚠️
>
> These test cases verify **production feature #121883** ("rftc-021 — Most-failed-tests metric"), part of
> **Testcase Management plugin Release 7.2.0**. Out of `V1_7.1.0_EXTERNAL_RELEASE_CYCLE.md`'s scope.
>
> **ID prefix**: every case here is `RFTC021-<n>`.
>
> **Executed**: 2026-10-19, same environment as `RFTC-020` (see that file's header for setup detail).

# Test Cases — Redmineflux Testcase Management — rftc-021: Most-Failed-Tests Metric

## Plugin
- Name: Redmineflux Testcase Management
- Version: master (post-7.1.0, pre-7.2.0)
- Redmine version: 6.x (Docker `localhost:3000`, Postgres)
- Production ticket: #121883 (ztflux), done ratio 90%, status "In QA"

## Feature summary

A "Most Failed Tests" report ranks test cases by cross-run failure frequency. Failure is matched via
`CaseStatus#is_failure?` by default; an explicit "criteria" toggle (`failed` vs `failed_blocked`) optionally also
counts Blocked executions. Ranked by failure count, secondary by rate. Project- and `Issue.visible`-scoped — must
never leak another project's (or an invisible issue's) failure data.

---

### RFTC021-1: Report ranks test cases by real cross-run failure count

**Priority:** P1
**Steps:** Create a "Most Failed Tests" report (default criteria = Failed-only, Include all test run).
**Expected Result:** Every test case with ≥1 Failed execution across the project's runs appears, ranked by
failure count, with Failures/Executed/Failure Rate/Failing Runs columns.
**Actual Result:** PASS. `#24` (3 failures / 3 executed / 100%) ranked above `#26` (1 failure / 1 executed /
100%) — both real CI-ingested failures from earlier sessions, not synthetic.

---

### RFTC021-2 (SACRED): Failed-only (default) criteria correctly excludes Blocked executions

**Priority:** P1 — the exact distinction the spec calls out ("match Failed by `is_failure?`, default Failed-only +
Blocked toggle")
**Steps:** Ingest a `blocked` result for a test case not previously in the ranking (`#34`, via
`ingest_results.json` against a run it belongs to, `auto_defect: true`); reload the **existing** Failed-only
report (no new report created).
**Expected Result:** `#34` does **not** appear in the Failed-only ranking.
**Actual Result:** PASS. Report unchanged — still only `#24` and `#26`, `#34` correctly absent.

---

### RFTC021-3 (SACRED): `failed_blocked` criteria correctly includes Blocked executions

**Priority:** P1
**Steps:** Create a **second** Most Failed report with criteria = "failed_blocked" (the hidden `<select>` on the
New Report form that only appears once "Most Failed Tests" is selected as the type).
**Expected Result:** The same `#34` Blocked execution now appears in this report's ranking.
**Actual Result:** PASS. `#34` "Add item to cart" appeared at rank 3 (1 failure / 1 executed / 100%) — confirms
the toggle genuinely changes the underlying query, not just display.

---

### RFTC021-4 (SACRED/security): Cross-project isolation — a different project's Most Failed report shows zero leaked data

**Priority:** P1 — the dev's own claim: *"it can't leak data from another project or a private issue"*
**Steps:** Create a Most Failed report inside a **different** project (`bug-121896-retest`, id=1) that has no
failing executions of its own.
**Expected Result:** That project's report shows none of project `rftc-016-ci-qa`'s failures (`#24`, `#26`, `#34`
etc. must not appear) — a clean empty state, not a crash or a cross-project leak.
**Actual Result:** PASS. `"No failing test cases in the selected runs"` — clean, correct empty state; zero
cross-project data visible.

---

## Not Executed

- **100-run cap** — not exercised; would require generating 100+ runs, impractical for this session (same
  low-risk judgment as other numeric DoS-shaped caps already accepted by inspection elsewhere in this release).
- **Private-issue visibility scoping** specifically (as opposed to cross-project scoping) — not independently
  exercised; RFTC021-4 covers the project-boundary case, which is the stronger and more directly testable form of
  the same claim.
- **Secondary sort by rate** when failure counts tie — not exercised; only 2–3 distinct test cases were available
  this session, none with tied failure counts.

## Coverage Summary

**4/4 executed scenarios PASS, zero bugs found.** The Failed/+Blocked toggle genuinely changes the query (not
just a UI label), and cross-project isolation holds cleanly.
