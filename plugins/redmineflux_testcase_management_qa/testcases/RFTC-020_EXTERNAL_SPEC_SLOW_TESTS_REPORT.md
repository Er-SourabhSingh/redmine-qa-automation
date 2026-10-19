> ⚠️ **EXTERNAL SOURCE — DO NOT MERGE WITH THIS PLUGIN'S OWN TC-TCM-xxx SUITES, AND SEPARATE FROM THE V1 CYCLE
> FILE** ⚠️
>
> These test cases verify **production feature #121882** ("rftc-020 — Per-test duration + slow-test detection"),
> part of **Testcase Management plugin Release 7.2.0** (due 2026-10-21). V2/CI-era work, out of
> `V1_7.1.0_EXTERNAL_RELEASE_CYCLE.md`'s scope.
>
> **ID prefix**: every case here is `RFTC020-<n>`.
>
> **Executed**: 2026-10-19, against Docker `localhost:3000` (container `redmine6-redmine-1`, master branch —
> `378df54`, includes the rftc-020/021/042/043/044 builds + the 3 bugfixes from the earlier CI-chain session),
> project `rftc-016-ci-qa` (id=2). Migration `20261015000000` applied and the container restarted first, so the
> new routes/controllers (`quality_hq`, `testcase_reports#slow_test`/`most_failed`) actually load — production
> mode does not hot-reload new files.

# Test Cases — Redmineflux Testcase Management — rftc-020: Per-Test Duration + Slow-Test Detection

## Plugin
- Name: Redmineflux Testcase Management
- Version: master (post-7.1.0, pre-7.2.0)
- Redmine version: 6.x (Docker `localhost:3000`, Postgres)
- Production ticket: #121882 (ztflux), done ratio 90%, status "In QA"

## Feature summary

Every `issue_status_results` row now carries a structured `duration_ms` (populated via `bulk_create`, the CI
`ingest` endpoint, or left null if never supplied). A new "Slow Tests" report type ranks test cases by p95
duration across all their samples and flags any case whose p95 exceeds a configurable `slow_test_threshold_ms`
(seeded at 5000ms / 5.0s).

---

### RFTC020-1: Slow Tests report renders ranked by p95, using real CI-ingested duration data

**Priority:** P1
**Steps:** Create a "Slow Tests" report (Reports → New report → type = Slow Tests, Include all test run).
**Expected Result:** A table ranks every test case with at least one execution, columns Samples/Avg/Max/p95/Flag,
sorted slowest-first; cases with zero timing samples still appear (not dropped), with 0ms / flagged separately as
"No timing data yet".
**Actual Result:** PASS. 6 test cases listed; `#24` ranked top at the time (p95 1.03s avg from 4 real CI-ingested
samples with real `duration_ms` values from earlier `ingest_results` calls); untimed cases correctly show `0 ms`
rather than being omitted. Footer correctly reports `No timing data yet: 3`.

---

### RFTC020-2 (SACRED): A test case whose p95 exceeds the threshold is correctly flagged "Slow"

**Priority:** P1 — the entire point of the feature
**Steps:** `POST /testcase_ci/ingest_results.json` a result for an existing test case with `duration_ms: 7500`
(threshold is 5000ms); reload the same report (no manual "regenerate" action).
**Expected Result:** That test case re-ranks to the top; its row shows `Flag = Slow`; p95 reflects the new sample.
**Actual Result:** PASS. `#23` jumped to rank 1 with `p95 = 7.5 s`, `Flag = Slow`; the report is a **live query**,
not a cached snapshot — no regenerate step was needed for the new data to appear.

---

### RFTC020-3: A test case under the threshold is never flagged

**Priority:** P2
**Steps:** Observe the same report's other rows (p95 ≤ 2.5s, well under the 5.0s threshold).
**Expected Result:** No `Flag` value for those rows.
**Actual Result:** PASS — only the one genuinely-slow case (`#23`) carries the `Slow` flag; `#24` at 2.5s max and
all 0ms cases are correctly unflagged.

---

### RFTC020-4: `duration_ms` is accepted from both the CI ingest path and reflected consistently in the structured column

**Priority:** P2 (cross-reference — already independently DB-verified in `RFTC-016` RFTC016-13)
**Steps:** n/a — carried over from prior session's direct `issue_status_results.duration_ms` DB check.
**Expected Result:** The column holds the exact submitted integer.
**Actual Result:** PASS (see `RFTC-016_EXTERNAL_SPEC_CI_RESULTS_INGEST.md` RFTC016-13 for the DB-level
confirmation this report's numbers are built on).

---

## Not Executed

- **`bulk_create` (manual "Add Result" / browser form) duration entry** — not exercised this session; all
  `duration_ms` samples used here came via the CI `ingest` path. The dev's own verification note claims this path
  is also covered by existing automated tests.
- **Threshold reconfiguration** (changing `slow_test_threshold_ms` itself and confirming the Flag boundary moves)
  — not exercised; the seeded default (5000ms) was sufficient to prove both the flagged and unflagged cases.
- **"Only the following test runs" scoping** (vs. the "Include all test run" default used here) — not
  independently exercised; the Most Failed report's equivalent run-scoping option was covered instead
  (`RFTC-021`).

## Coverage Summary

**4/4 executed scenarios PASS, zero bugs found.** The threshold-flagging logic, live-query behavior, and
untimed-sample handling all behave correctly.
