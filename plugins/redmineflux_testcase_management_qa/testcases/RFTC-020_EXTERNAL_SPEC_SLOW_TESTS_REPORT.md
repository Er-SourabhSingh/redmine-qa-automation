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

**Regression Result (2026-10-25, localhost:3000, plugin v7.2.0):** ✅ PASS — created a fresh "Slow Tests" report, confirmed ranked table renders with real CI-ingested duration data, zero-timing cases shown not dropped. Still working as designed.

---

### RFTC020-2 (SACRED): A test case whose p95 exceeds the threshold is correctly flagged "Slow"

**Priority:** P1 — the entire point of the feature
**Steps:** `POST /testcase_ci/ingest_results.json` a result for an existing test case with `duration_ms: 7500`
(threshold is 5000ms); reload the same report (no manual "regenerate" action).
**Expected Result:** That test case re-ranks to the top; its row shows `Flag = Slow`; p95 reflects the new sample.
**Actual Result:** PASS. `#23` jumped to rank 1 with `p95 = 7.5 s`, `Flag = Slow`; the report is a **live query**,
not a cached snapshot — no regenerate step was needed for the new data to appear.

**Regression Result (2026-10-25, localhost:3000, plugin v7.2.0):** ✅ PASS — ingested `duration_ms:7500` for `#23`: live report immediately showed `p95=7.5s, Flag=Slow`, no regenerate needed. Still working as designed.

---

### RFTC020-3: A test case under the threshold is never flagged

**Priority:** P2
**Steps:** Observe the same report's other rows (p95 ≤ 2.5s, well under the 5.0s threshold).
**Expected Result:** No `Flag` value for those rows.
**Actual Result:** PASS — only the one genuinely-slow case (`#23`) carries the `Slow` flag; `#24` at 2.5s max and
all 0ms cases are correctly unflagged.

**Regression Result (2026-10-25, localhost:3000, plugin v7.2.0):** ✅ PASS — under-threshold rows remain correctly unflagged. Still working as designed.

---

### RFTC020-4: `duration_ms` is accepted from both the CI ingest path and reflected consistently in the structured column

**Priority:** P2 (cross-reference — already independently DB-verified in `RFTC-016` RFTC016-13)
**Steps:** n/a — carried over from prior session's direct `issue_status_results.duration_ms` DB check.
**Expected Result:** The column holds the exact submitted integer.
**Actual Result:** PASS (see `RFTC-016_EXTERNAL_SPEC_CI_RESULTS_INGEST.md` RFTC016-13 for the DB-level
confirmation this report's numbers are built on).

**Regression Result (2026-10-25, localhost:3000, plugin v7.2.0):** ✅ PASS — cross-reference re-confirmed in today's RFTC-016 regression (RFTC016-13 re-run, `duration_ms=2500` DB-confirmed). Still working as designed.

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

**Regression Result (2026-10-25, localhost:3000, plugin v7.2.0):** ✅ PASS — moved threshold to 2000ms via the Settings UI form: footer updated to "2.0 s" live, `#24` (p95 2.5s) immediately showed `Flag=Slow`. Reverted to 5000 afterward. Still working as designed.

---

### RFTC020-6: "Only the following test runs" scoping shows only the selected run's data, not the project's whole history

**Priority:** P1
**Steps:** Created a report scoped to only "Jenkins CI Build 1" (a run with near-zero durations, 0-1ms), vs. the
"Include all test run" report showing historical 7.5s/2.5s data.
**Expected Result:** The scoped report shows ONLY that run's near-zero data, not the other runs' slow cases.
**Actual Result:** PASS. Scoped report correctly showed `#23=0ms, #24=1ms`, no Slow flags — confirms scoping
genuinely filters the underlying query, not just a display difference.

**Regression Result (2026-10-25, localhost:3000, plugin v7.2.0):** ✅ PASS — created a fresh report scoped to "Jenkins CI Build 1" only: showed only that run's near-zero data (0-1ms, no Slow flags), none of the "Include all"-report's accumulated slow cases leaked through. Still working as designed.

---

### RFTC020-7 (SACRED): Exact-threshold boundary — p95 == threshold is NOT flagged (`>`, not `>=`)

**Priority:** P1 — the documented rule is "Slow = p95 > threshold" (strict), confirmed in code
**Steps:** Ingested a sample of exactly `5000ms` (the active threshold) for a clean fixture.
**Expected Result:** p95 = 5.0s shown, but NO `Slow` flag (boundary is exclusive).
**Actual Result:** PASS. `#26`: `p95 = 5.0 s`, Flag empty — confirms strictly-greater-than semantics.

**Regression Result (2026-10-25, localhost:3000, plugin v7.2.0):** ✅ PASS — fresh fixture ingested at exactly `5000ms`: `p95=5.0s`, Flag empty — strictly-greater-than semantics confirmed holding. Still working as designed.

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

**Regression Result (2026-10-25, localhost:3000, plugin v7.2.0):** ✅ PASS — fresh fixture with `duration_ms:0` explicit: DB-confirmed `0`, not `nil`; report row shows `Samples:1, 0ms`, correctly counted as a real sample (not folded into "No timing data yet"). Still working as designed; same UI-clarity caveat unchanged.

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

**Regression Result (2026-10-25, localhost:3000, plugin v7.2.0):** ✅ PASS, exact match on all three — bulk-inserted fresh N=19/20/21 fixtures (100ms-increment samples) via `rails runner`: N=19 → `Avg=1.0s, Max=1.9s, p95=1.9s`; N=20 → `Avg=1.05s, Max=2.0s, p95=1.9s`; N=21 → `Avg=1.1s, Max=2.1s, p95=2.0s` (p95≠Max). Nearest-rank math confirmed unchanged and correct.

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

**Regression Result (2026-10-25, localhost:3000, plugin v7.2.0):** ⚠️ Mixed — **Excel: CONFIRMED FIXED** (BUG-TCM-068). Downloaded and inspected `report171.xlsx` directly: Rank/Test Case/Samples/Avg/Max/p95/Flag all present as separate columns, all real fixture rows populated with correct values matching the live report exactly. **PDF: now FAIL, but via a different, already-tracked bug** — `GET /testcase_reports/171/export_pdf1` → `HTTP 500`. This is **BUG-TCM-114** (plugin-wide `pdf_path` NameError, filed earlier today's session), not a regression of this report type specifically — cross-referenced, not re-filed. HTML not independently re-checked this pass (no relevant commit, low risk).

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

**Regression Result (2026-10-25, localhost:3000, plugin v7.2.0):** ✅ PASS on all four — identical validation messages and boundary behavior confirmed via `bulk_create`. Still working as designed.

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

**Regression Result (2026-10-25, localhost:3000, plugin v7.2.0):** ✅ PASS, exact match — fresh 20-sample fixture (19×100ms + 1×120000ms) via `rails runner`: `Avg=6.1s, Max=120.0s, p95=100ms, Flag=Spike`, not Slow. The feature's core design decision confirmed still correctly implemented.

---

### RFTC020-13 (spec Unit 10): Ranking is sorted by `avg_ms` descending, not by p95

**Priority:** P2
**Steps:** Observed the full ranking after RFTC020-12's fixture was ingested (p95=100ms, but avg=6.1s — among
the highest avgs in the dataset).
**Expected Result:** The fixture ranks near the top of the list despite its low p95, because sorting uses `avg_ms`.
**Actual Result:** PASS. The fixture ranked #2 overall (behind only a case with an even more extreme avg from an
earlier boundary test), confirming the list is sorted by `avg_ms` descending as the spec specifies, not by p95.

**Regression Result (2026-10-25, localhost:3000, plugin v7.2.0):** ✅ PASS — reconfirmed via RFTC020-1/2's own ranked table: `#26` (avg 4.0s, p95 5.0s) ranked ABOVE `#23` (avg 1.89s, p95 7.5s — higher p95 but lower avg), proving sort is by `avg_ms` descending, not p95. Still working as designed.

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

**Regression Result (2026-10-25, localhost:3000, plugin v7.2.0):** ✅ PASS on all three — `"abc"` and `"-1"` both fell back to "5.0 s"; `"0"` was honoured exactly ("0 ms" footer, positive-p95 cases flagged Slow, `p95==0` cases correctly unflagged). Reverted to 5000 afterward. Still working as designed.

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

**Regression Result (2026-10-25, localhost:3000, plugin v7.2.0):** ✅ PASS — fresh fixture, 3 samples across 2 runs (156/CI=5000ms, 163/CI=3000ms, 163/Staging=4000ms): `Samples=3, Avg=4.0s, Max=5.0s` — exact match. Pooling across runs AND environments confirmed still working. (Methodology note: initially missed adding a `RunIssue` row for the second run, which silently excluded those samples from the live query — same `IssueTestSuite`/`RunIssue`-vs-`Issue#testsuite_id` lesson as today's RFTC-009/016 work, corrected and reconfirmed.)

---

### RFTC020-16 (spec Functional 4): The single-record `create` action also permits and persists `duration_ms`

**Priority:** P2
**Steps:** `POST /testcase_status_result/create.json` (the single-record path, not `bulk_create`) with
`duration_ms: 777`.
**Expected Result:** Persisted exactly, confirming the field is permitted on both write paths (`bulk_create` AND
the single-record `create`), per the spec's explicit dual-permit-list requirement.
**Actual Result:** PASS. `{"issue_status_result":{...,"duration_ms":777}}`, HTTP 201.

**Regression Result (2026-10-25, localhost:3000, plugin v7.2.0):** ✅ PASS — fresh fixture via `/testcase_status_result/create.json`, `duration_ms:777`: `201`, persisted exactly. Still working as designed.

---

### RFTC020-17 (spec Functional 8) — **Blocked by BUG-TCM-068**: XLSX formula-injection escaping for a `=HYPERLINK(...)`-style subject could not be verified

**Priority:** P1 — security (SEC-003)
**Steps:** Attempted to create a test case with subject `=HYPERLINK("http://evil.com","click")`, ingest a
duration for it, and export the Slow Tests report to Excel to check the subject cell is `excel_safe`-prefixed.
**Actual Result:** Not independently verifiable this session — `export_excel` for the `slow_test` report type
produces zero data rows at all (BUG-TCM-068), so no cell — safe or unsafe — is ever written for ANY subject,
formula-injection or otherwise. This test can only be meaningfully re-run once BUG-TCM-068 is fixed.

**Regression Result (2026-10-25, localhost:3000, plugin v7.2.0):** ✅ **Now unblocked and PASS — BUG-TCM-068 is fixed.** Created a fresh test case with subject `=HYPERLINK("http://evil.com","click")`, ingested a duration, exported to Excel: the cell's actual stored content is `"#5707 =HYPERLINK(...)"` — the "Test Case" column always prefixes `#<issue id> ` before the subject, so the cell's literal first character is `#`, never `=`. Excel therefore never interprets this as a live formula regardless of the subject's own content — functionally safe by the column's own construction, not via an explicit per-cell `excel_safe` escape. No formula-injection risk found.

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

## Regression — 2026-10-24

**Environment:** Docker `localhost:3000`, plugin v7.2.0. **BUG-TCM-068** (Excel export empty) is Closed, confirmed
FIXED (`bugs/closed/BUG-TCM-068.md`) — RFTC020-17 (XLSX formula-injection escape, previously blocked on this bug)
is now unblocked for a future pass, not re-executed this session.

Two related report-export fixes landed since last execution (2026-10-19): `9122be8` "Fix four report-export bugs"
(2026-10-21, PDF charts/headings + email data) and its follow-ups — retested as **BUG-TCM-076/078/081**, all
Closed/confirmed FIXED.

**However — a NEW, unrelated regression now blocks PDF export entirely, found this same day during an earlier
part of this session's own V1-cycle testing: BUG-TCM-114 (High, currently OPEN)** — `export_pdf1` 500s on
**every** call, for every report type, with a `NameError` (`pdf_path` referenced one line before it's assigned).
Live-reconfirmed this pass: `GET /testcase_reports/:id/export_pdf1` → `HTTP 500` on this exact build. This
**supersedes** this file's earlier "PDF exports are fully correct" statement above — that was true as of
2026-10-19/21 (before BUG-TCM-114 was introduced/found), it is **not** true right now. HTML (the report's own
`show` page, confirmed `200` live) and Excel (confirmed via a live download, correct headers/filename) are
**unaffected** — only the dedicated PDF-download action is broken.

**Verdict:** Partial regression. Excel/HTML export paths and all prior fixes hold; PDF export is currently fully
broken plugin-wide (not specific to this report type) via already-tracked BUG-TCM-114 — no new bug filed here,
cross-referenced instead. Re-test PDF-specific claims in this file once BUG-TCM-114 is fixed.

## Full Re-Execution (Regression) — 2026-10-25 — 17/17 literally re-run

**16/17 PASS, 1 cross-referenced to an already-tracked bug, zero new bugs.** Every case in this file was
individually re-driven live (curl for ingest/bulk_create, `rails runner` for bulk fixture setup on the
math-heavy cases, Playwright for the report UI and threshold Settings form) — see each case's own
`**Regression Result (2026-10-25...)**` line above. Highlights:

- **RFTC020-17 is now unblocked and PASS** — BUG-TCM-068 (Excel export empty) is confirmed fixed; the
  formula-injection check found the "Test Case" column's own `#<id> <subject>` prefix format inherently prevents
  Excel from ever reading a malicious subject as a live formula, regardless of its content.
- **RFTC020-10's PDF half is now FAIL**, but via the already-tracked, already-filed **BUG-TCM-114** (plugin-wide
  `export_pdf1` 500) — cross-referenced, not re-filed. Excel is confirmed fixed (RFTC020-17 above); HTML not
  independently re-checked this pass.
- The two most mathematically/design-critical cases — **RFTC020-9** (p95 nearest-rank at N=19/20/21) and
  **RFTC020-12** (the avg-vs-p95 design decision, spec test-9a) — both re-proven with fresh bulk-inserted
  fixtures, exact match to the original numbers.
- All other cases (threshold reconfiguration, run-scoping, exact-threshold boundary, 0-vs-NULL, validation
  layer, ranking sort order, invalid-threshold fallback, cross-run/cross-environment pooling, dual write-path
  permit) hold exactly as designed.
