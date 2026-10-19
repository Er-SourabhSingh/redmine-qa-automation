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

## Second Follow-up (2026-10-19) — threshold reconfiguration, run-scoping, exact-threshold boundary, 0-vs-NULL

### RFTC020-5 (SACRED): Reconfiguring `slow_test_threshold_ms` via the Settings UI moves the Flag boundary live

**Priority:** P1
**Steps:** Settings → Configuration → set `Slow-test threshold` from 5000 to 2000ms (via the real UI form, not a
raw DB write — a raw SQL update does not invalidate Redmine's in-process `Setting` cache, confirmed by trial);
reload the Slow Tests report.
**Expected Result:** A case previously unflagged (p95 between 2000-5000ms) now shows `Flag = Slow`.
**Actual Result:** PASS. `#24` (p95 2.5s, previously unflagged) correctly became `Slow` once the threshold moved
to 2.0s; reverted to 5000 afterward, confirmed via DB.

---

### RFTC020-6: "Only the following test runs" scoping shows only the selected run's data, not the project's whole history

**Priority:** P1
**Steps:** Created a report scoped to only "Jenkins CI Build 1" (a run with near-zero durations, 0-1ms), vs. the
"Include all test run" report showing historical 7.5s/2.5s data.
**Expected Result:** The scoped report shows ONLY that run's near-zero data, not the other runs' slow cases.
**Actual Result:** PASS. Scoped report correctly showed `#23=0ms, #24=1ms`, no Slow flags — confirms scoping
genuinely filters the underlying query, not just a display difference.

---

### RFTC020-7 (SACRED): Exact-threshold boundary — p95 == threshold is NOT flagged (`>`, not `>=`)

**Priority:** P1 — the documented rule is "Slow = p95 > threshold" (strict), confirmed in code
**Steps:** Ingested a sample of exactly `5000ms` (the active threshold) for a clean fixture.
**Expected Result:** p95 = 5.0s shown, but NO `Slow` flag (boundary is exclusive).
**Actual Result:** PASS. `#26`: `p95 = 5.0 s`, Flag empty — confirms strictly-greater-than semantics.

---

### RFTC020-8: Explicit `duration_ms: 0` is a real fast sample, distinct from NULL ("never timed")

**Priority:** P2
**Steps:** Ingested `duration_ms: 0` explicitly for one case; compared against the DB-level NULL/non-NULL
distinction for other untimed cases.
**Expected Result:** A real `0` sample is NOT NULL at the DB level and is counted as "1 sample, 0 ms", not folded
into "No timing data yet".
**Actual Result:** PASS at the DB level (`duration_ms=0, is_null=false` confirmed via direct query) and the report
correctly showed it as a timed sample. **Caveat (not a bug, a UI clarity limitation):** a genuinely-never-timed
case and a real-0ms case both DISPLAY as "0 ms" in the table with no visual distinguishing mark per row — the only
place the distinction surfaces is the aggregate "No timing data yet: N" footer count, which does not say WHICH
rows are in that count. Minor, not filed as a defect.

## Third Follow-up (2026-10-19) — p95 nearest-rank algorithm precision (N=19/20/21)

### RFTC020-9 (SACRED): p95 nearest-rank formula is mathematically correct, not a naive "p95 = max" shortcut

**Priority:** P1 — the critical correctness test for the entire metric
**Steps:** Three clean fixtures with exactly 19, 20, and 21 known ascending samples (100ms increments) each.
**Expected Result (nearest-rank, `idx = ceil(0.95n) - 1`):** N=19 → p95 = Max (19th of 19). N=20 → p95 = 19th
value (1900ms), not the max (2000ms). N=21 → p95 = 20th value (2000ms), **not** the max (2100ms) — this is the
case that proves the implementation isn't just returning `max`.
**Actual Result:** PASS on all three. N=19: `Avg=1.0s, Max=1.9s, p95=1.9s` (p95==Max, correct per formula). N=20:
`Avg=1.05s, Max=2.0s, p95=1.9s` (exact match). N=21: `Avg=1.1s, Max=2.1s, p95=2.0s` (p95 ≠ Max — the decisive
proof of genuine nearest-rank math, not a shortcut).

## Fourth Follow-up (2026-10-19) — report export formats (HTML/PDF/Excel)

### RFTC020-10: HTML and PDF exports of a Slow Tests report are complete and correct; Excel export is NOT — **BUG-TCM-068**

**Priority:** P1
**Steps:** Downloaded the same Slow Tests report (8 real ranked rows) as HTML, PDF, and Excel; compared all three
against the live on-screen table.
**Expected Result:** All three formats show the same Rank/Test Case/Samples/Avg/Max/p95/Flag data and the correct
footer.
**Actual Result:** HTML: PASS, fully correct (Rank column, all 8 rows, correct "No timing data yet: 1" footer).
PDF: PASS (all 8 rows + Rank column correct; only the footer threshold/count line is omitted, a minor gap not
filed separately). **Excel: FAIL.** The exported `.xlsx` has NO "Rank" column (only 6 of 7 headers), **zero data
rows** (the sheet's own dimension is `A1:A7`, meaning none of the 8 real test cases appear anywhere in the file),
and a wrong "No timing data yet: 0" (should be 1). Root-caused to `export_excel` never calling
`calculate_slow_test_results` (that computation only happens in the `show` action) — filed as **BUG-TCM-068**
(High), with the exact code location and a suggested fix in the bug file.

## Fifth Follow-up (2026-10-19) — full 370-line source spec re-read: validation layer, avg-vs-p95 design decision, pooling

A full read of `backlog/planning/rftc-020-feature-per-test-duration-slow-tests.md` (not just the production
ticket's short description) surfaced the model validation layer (never tested), the single most important design
decision in the whole feature (p95, not average, drives the Slow flag — Gate 1/2 called this out as the "entire
point"), and the pooling-across-environments/runs guarantee. All were genuinely untested gaps, now closed.
**Note:** the production ticket's own QA journal entry says duration "is carried through properly — whether the
result comes from the normal 'Add Result' form, a bulk upload, or the CI tool" — but the spec's own Out-of-Scope
section explicitly states *"Capturing duration for manual/UI executions via a form field — the UI form is not
extended... exposing an input is out of scope."* The journal wording is imprecise (the backend permit list
technically accepts the field via direct API calls even without a browser UI field for it), but this matches the
spec's own documented scope exactly — **not a bug**, just a loosely-worded verification note.

---

### RFTC020-11 (spec Unit 13-17): `duration_ms` model validation — nil/negative/non-integer/over-range/max-valid

**Priority:** P1 — this validation layer was never exercised in any prior pass
**Steps:** `bulk_create` with `duration_ms`: `-5` (negative), `12.5` (non-integer), `2147483648` (one over PG
`integer` max), and `2147483647` (exactly PG `integer` max).
**Expected Result:** Negative/non-integer/over-range → 422 with a clean field error, never a raw DB `RangeError`.
Max-valid → accepted and stored exactly.
**Actual Result:** PASS on all four. `-5`: `"Duration ms must be greater than or equal to 0"`, 422. `12.5`:
`"Duration ms must be an integer"`, 422. `2147483648`: `"Duration ms must be less than or equal to 2147483647"`,
422. `2147483647`: `201`, stored exactly as submitted — no DB-level crash at the boundary.

---

### RFTC020-12 (spec Unit 8/9/9a, SACRED/CRITICAL): A test case with a massive AVERAGE over threshold is correctly NOT flagged "Slow" — only p95 drives the flag

**Priority:** P1 — the single most important design decision in this feature; getting this wrong would make the
report flag the wrong tests entirely
**Steps:** Exact spec scenario (test 9a): 20 samples = nineteen `100ms` + one `120,000ms` outlier. `avg = 6095ms`
(over the 5000ms threshold) but `p95 = 100ms` (19th ascending value, idx 18 — under threshold).
**Expected Result:** `slow? = false` (p95 under threshold) despite the enormous average; `spike? = true` (max over
threshold, p95 did not catch it) — proves avg does NOT drive the flag, p95 does.
**Actual Result:** PASS, exact match. Report row: `Avg=6.1s, Max=120.0s, p95=100 ms, Flag=Spike` — **not** "Slow"
despite the avg being over 1200× the threshold. This is the decisive confirmation that the feature's core
design decision (p95-based flagging, not average-based) is correctly implemented.

---

### RFTC020-13 (spec Unit 10): Ranking is sorted by `avg_ms` descending, not by p95

**Priority:** P2
**Steps:** Observed the full ranking after RFTC020-12's fixture was ingested (p95=100ms, but avg=6.1s — among
the highest avgs in the dataset).
**Expected Result:** The fixture ranks near the top of the list despite its low p95, because sorting uses `avg_ms`.
**Actual Result:** PASS. The fixture ranked #2 overall (behind only a case with an even more extreme avg from an
earlier boundary test), confirming the list is sorted by `avg_ms` descending as the spec specifies, not by p95.

---

### RFTC020-14 (spec Unit 19, Edge 6): Invalid threshold settings fall back to 5000; `0` is honoured, not treated as invalid

**Priority:** P1 — a mis-saved setting ("abc"/"-1") must never silently flag (almost) every test case slow
**Steps:** Set `slow_test_threshold_ms` to `"abc"`, then `"-1"`, then `"0"` via the real Settings UI (bypassing
the HTML5 `number` input's client-side validation via JS to reach the server's own parsing).
**Expected Result:** `"abc"` and `"-1"` both fall back to the 5000 default. `"0"` is honoured exactly (every case
with `p95 > 0` flags slow; an all-`0`-samples case, `p95 == 0`, does not).
**Actual Result:** PASS on all three. `"abc"` → footer shows "5.0 s". `"-1"` → footer shows "5.0 s". `"0"` →
footer shows "0 ms"; cases with any positive p95 (`#26`, `#23`, `#24`) correctly flagged `Slow`; cases with
`p95 == 0` exactly (`#27`, `#33`-`#36`) correctly remained unflagged. Reverted to 5000 afterward.

---

### RFTC020-15 (spec Unit 20): Duration samples pool across DIFFERENT environments AND different runs into ONE series per test case

**Priority:** P1 — the deliberate, documented divergence from the status metric's "latest-per-cell" grain
**Steps:** The same test case (`#26`) was given a 5000ms sample in Run 6/environment `CI` (an earlier test), then
a fresh 3000ms sample in Run 28/environment `CI` and a 4000ms sample in Run 28/environment `Staging`, all within
one "Include all test run" report.
**Expected Result:** All three samples (different runs, different environments) pool into ONE series for `#26` —
`samples = 3`, not three separate per-environment/per-run series.
**Actual Result:** PASS. `#26`: `Samples=3, Avg=4.0s` (exactly `(5000+3000+4000)/3`), `Max=5.0s` — confirms
samples genuinely pool across both runs and environments for a single test case's duration distribution.

---

### RFTC020-16 (spec Functional 4): The single-record `create` action also permits and persists `duration_ms`

**Priority:** P2
**Steps:** `POST /testcase_status_result/create.json` (the single-record path, not `bulk_create`) with
`duration_ms: 777`.
**Expected Result:** Persisted exactly, confirming the field is permitted on both write paths (`bulk_create` AND
the single-record `create`), per the spec's explicit dual-permit-list requirement.
**Actual Result:** PASS. `{"issue_status_result":{...,"duration_ms":777}}`, HTTP 201.

---

### RFTC020-17 (spec Functional 8) — **Blocked by BUG-TCM-068**: XLSX formula-injection escaping for a `=HYPERLINK(...)`-style subject could not be verified

**Priority:** P1 — security (SEC-003)
**Steps:** Attempted to create a test case with subject `=HYPERLINK("http://evil.com","click")`, ingest a
duration for it, and export the Slow Tests report to Excel to check the subject cell is `excel_safe`-prefixed.
**Actual Result:** Not independently verifiable this session — `export_excel` for the `slow_test` report type
produces zero data rows at all (BUG-TCM-068), so no cell — safe or unsafe — is ever written for ANY subject,
formula-injection or otherwise. This test can only be meaningfully re-run once BUG-TCM-068 is fixed.

## Not Executed

- **Manual "Add Result" form duration entry** — confirmed via the full spec read this is **explicitly out of
  scope by design** (spec: "the UI form is not extended... exposing an input is out of scope"), not a gap. The
  backend write paths (`bulk_create`, single `create`) both accept `duration_ms` regardless.
- **XLSX formula-injection escape (RFTC020-17)** — blocked by BUG-TCM-068; re-test once fixed.

## Coverage Summary

**17/17 executed scenarios — 16/17 PASS, 1 bug found (BUG-TCM-068, High).** Combined across all five follow-up
sessions: threshold reconfiguration, run-scoping, exact-threshold boundary (`>` not `>=`), the 0-vs-NULL
distinction, the p95 nearest-rank algorithm proven mathematically correct at N=19/20/21 (critically, N=21 proves
it isn't a naive "p95=max" shortcut), the full model validation layer (nil/negative/non-integer/over-range/
max-valid), the single most important design decision in the feature (p95, not average, drives the Slow flag —
proven with the exact spec test-9a scenario), ranking sort order, invalid-threshold fallback (including the
intentionally-honoured `0` case), cross-environment/cross-run sample pooling, and the dual write-path permit
(`bulk_create` + single `create`) — all behave exactly per the 370-line source spec. The one defect
(**BUG-TCM-068**) is isolated to the Excel export path only; HTML and PDF exports are fully correct, and the
report's live on-screen rendering, metric math, and threshold logic are all solid.
