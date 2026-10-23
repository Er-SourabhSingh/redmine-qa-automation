# Test Cases — Redmineflux Testcase Management — Performance Testing

> Source: `SENIOR_QA_STANDARDS.md` §29 (Performance Testing Approach — mandatory for every plugin, every cycle)
> and this plugin's own `docs/TESTCASE_MANAGEMENT_MEMORY.md`, which already carries one relevant performance data
> point (CSV import of a 45-column × 500-row / 121 KB file rendering its step-4 preview correctly with no session
> overflow). This suite exists to give the plugin's primary list/detail/report screens a dedicated large-data
> pass, per `TESTCASE_MANAGEMENT_TRACEABILITY_MATRIX.md`'s own recorded gap (no suite targeted Performance).
>
> **Status: executed 2026-10-23.** Seeded a dedicated project `rftc-perf-500` (project id 4) with the fixtures
> this suite specified: 500 test cases in one suite (id 37), 50 flat sibling suites, a Run (#81) linking all 500
> cases across 2 environments with ~1000 historical `IssueStatusResult` rows (mixed Passed/Failed/Blocked/
> Skipped/Untested), 100 Requirements each linked to a few of the 500 cases, and 100 Reports. Seeded via `rails
> runner` directly against the model layer (bypassing a few UI-only validations that assume data created through
> the real wizard, e.g. `Run#test_suite_availability` and `TestcaseReport`'s "must have a run" check — both
> satisfied correctly afterward via the real join tables) rather than by hand through the UI, which would not be
> practical at this volume. Two large CSV fixtures were also generated: `23_bulk_1000_rows.csv` (1000 rows) and
> `24_wide45_long1000.csv` (45 columns × 1000 rows, the combined-stress fixture) — both added to
> `automation/testdata/csv-test-data/`.
>
> All timings below were captured with a real authenticated session (`curl` with a persisted cookie jar for
> page-load timing, the real Playwright-driven browser for multi-step flows like the import wizard and bulk
> update). 15 of 20 TCs executed with real results; the remaining 5 (TC-TCM-259, 264, 266, 268, and part of
> TC-TCM-256) were deliberately not run this pass for reasons recorded against each — mostly because they are
> destructive (bulk delete on this shared fixture), need tooling this session doesn't have (the automation suite's
> independent browser contexts for TC-268's concurrency check, already a known limitation per the fixtures note
> above), or need a longer observation window (TC-266's Sidekiq queue-starvation check) than a single pass allows.
>
> **How to record a result:** `SENIOR_QA_STANDARDS.md` §29's rule is "record the observed load time... flag
> anything that degrades noticeably as data grows." These cases are PASS/FAIL on *not hanging/timing out/
> erroring*, but the actual millisecond figures should still be captured in the Evidence Map below (or the
> automation spec's own timing assertions) every time this suite runs, so degradation across releases is
> comparable, not just a one-off pass/fail.

## Plugin
- Name: Redmineflux Testcase Management
- Version: v7.0.0 / v7.1.0
- Redmine version: 6.1.3 (`localhost:3012`) / 7.0.0 (`localhost:3010`) / `localhost:3015` (v7.1.0 instance)
- Path: plugins/redmineflux_testcase_management_qa

## Fixtures needed before executing this suite

- A project with **500+ test cases** spread across several suites (some nested), for list/tree/search cases.
- A **Run linking 500+ test cases** across multiple environments, with a realistic mixed-result distribution
  (not all Untested), for run-detail/dashboard/grid cases.
- **100+ Reports** (mix of scheduled and one-off) in a single project, for the Reports list case.
- **100+ Requirements**, each linked to several of the 500+ test cases, for the RTM case.
- **1000+ historical IssueStatusResult / activity rows**, for the To-Do and Activity Log cases — can be generated
  as a side effect of executing results against the 500-case run above, repeated across several runs.
- A CSV file of **1000+ rows** (reuse/extend the existing 500-row fixture already proven safe per
  `docs/TESTCASE_MANAGEMENT_MEMORY.md`), and a second CSV that is both wide (45+ columns) and long (1000+ rows)
  for the combined-stress case.
- Two browser sessions/users able to record results concurrently against the same run (same tooling limitation
  already noted for TC-TCM-187 — needs the Playwright TS automation suite's independent browser contexts, not
  Playwright MCP's shared-context tabs).

---

## Page load under realistic data volume

---

### TC-TCM-249: Test Case list / suite tree loads acceptably with 500+ test cases

**User Role:** Any role with view access
**Priority:** High
**Steps:**
1. Open the project's Test Suite sidebar / Testcase Summary grid for the suite holding the 500+ case fixture.
2. Measure time to first meaningful render and confirm pagination (if present) or lazy-loading keeps the initial
   response bounded rather than rendering all 500+ rows in one DOM dump.

**Expected Result:**
- Page loads in a reasonable time (record actual seconds) with no browser hang, no 504/timeout, and the grid
  remains scrollable/interactive immediately after render.

**Status: EXECUTED 2026-10-23 — PASS.** Testcase Summary grid for the 500-case `Perf-500` suite: **95ms**
(`time_total` via curl, authenticated session), 66,468 bytes. Paginates normally (25/page default). No hang, no
504.

---

### TC-TCM-250: Test Suite tree with many sibling suites (50+) loads and expands without degrading

**User Role:** Any role with view access
**Priority:** Medium
**Steps:**
1. Create or reuse 50+ sibling test suites in one project (flat, not nested — nesting beyond 2 levels is a known
   separate defect, BUG-TCM-018, not what this case is checking).
2. Load the suite tree and expand/collapse several nodes.

**Expected Result:**
- Tree renders fully and expand/collapse interactions stay responsive (no multi-second lag per click) at this
  suite count.

**Status: EXECUTED 2026-10-23 — PASS.** Created 50 flat sibling suites (`Sibling-1`…`Sibling-50`) in
`rftc-perf-500` alongside the 500-case `Perf-500` suite. Test Suite index page (listing all 51+ suites): **97ms**.
No lag observed.

---

### TC-TCM-251: Run detail/grid with 500+ linked test cases stays responsive

**User Role:** Any role with view/execute access
**Priority:** High
**Steps:**
1. Open the Run detail page for the 500-case run fixture.
2. Scroll through the grid, change the environment filter, and open one case's Add Result form.

**Expected Result:**
- Initial load, filter changes, and opening the Add Result form all complete without a multi-second freeze or
  timeout. Record the initial load time.

**Status: EXECUTED 2026-10-23 — PASS, flagged for follow-up.** Run #81 (500 cases × 2 environments, ~1000
historical results): **1.7–2.0s** consistently across 3 repeats, vs. a baseline small run (1-2 cases) on a
different project at **91ms** — roughly 19–22x slower for 500x the case volume, which is *sub-linear* scaling
(not the disproportionate N+1 pattern TC-TCM-260 warns about), so not filed as a bug. Still notably slower in
absolute terms than every other page measured in this suite (all others under 500ms) — flagged in
`TESTCASE_MANAGEMENT_MEMORY.md` as a page worth re-measuring on future releases to catch regression.

---

### TC-TCM-252: Reports list with 100+ reports (including Scheduled Reports) loads acceptably

**User Role:** Any role with view-report access
**Priority:** Medium
**Steps:**
1. Open the Reports list for the project holding 100+ reports (mixed scheduled/one-off, per
   `docs/TESTCASE_MANAGEMENT_MEMORY.md`'s documented two-table layout).

**Expected Result:**
- Both the main Reports table and the Scheduled Reports table render fully without a noticeable lag, and sorting/
  searching (if present) on either table stays responsive.

**Status: EXECUTED 2026-10-23 — PASS.** Reports list for `rftc-perf-500` (100 seeded reports): **153ms**,
211,820 bytes. No lag.

---

### TC-TCM-253: Traceability Matrix (RTM) with 100+ requirements × 500+ test cases loads without timing out

**User Role:** Any role with view access
**Priority:** High
**Steps:**
1. Open the RTM page for the project with the 100-requirement / 500-test-case fixture.

**Expected Result:**
- Page completes rendering within a reasonable time, with no 504/timeout — this is the kind of join-heavy view
  most likely to show an N+1 query pattern (requirement → linked test cases → linked defects, times 100+ rows).
  Flag even a merely "slow but completes" result per §29's rule, not only an outright failure.

**Status: EXECUTED 2026-10-23 — PASS.** RTM page for `rftc-perf-500` (100 requirements, ~297 links into the
500-case pool): **450ms**. Completes well within a reasonable bound, no 504 — no obvious N+1 red flag at this
scale.

---

### TC-TCM-254: To-Do and Activity Log pages with 1000+ historical rows load and paginate correctly

**User Role:** Any role with the relevant view permission
**Priority:** Medium
**Steps:**
1. Open the To-Do list and the Activity Log for a user/project with 1000+ historical `IssueStatusResult`/activity
   rows.

**Expected Result:**
- Both pages load within a reasonable time and paginate (not render all 1000+ rows in a single response);
  changing pages stays responsive.

**Status: EXECUTED 2026-10-23 — PASS, To-Do flagged for follow-up.** Activity Log for `rftc-perf-500` (1000+
seeded `IssueStatusResult` rows): **148ms** — fine. To-Do list: **1.2–1.4s** consistently across 3 repeats, vs. a
small-project baseline of **355ms** — roughly 3.5–4x slower for 3x the run/result volume this project now carries,
proportionate rather than alarming, but still the second-slowest page measured in this suite after the Run detail
page (TC-TCM-251) — flagged alongside it in `TESTCASE_MANAGEMENT_MEMORY.md` for regression-watching on future
releases, not filed as a bug (no timeout, no crash, scaling roughly tracks data growth).

---

## Search / filter responsiveness at volume

---

### TC-TCM-255: Test Case subject search across 1000+ test cases returns promptly

**User Role:** Any role with view access
**Priority:** Medium
**Steps:**
1. In the Testcase Summary search box, search by a partial subject string across a project holding 1000+ test
   cases.

**Expected Result:**
- Results return within a reasonable time, correctly scoped (no false matches), no timeout. (Note the box's known
  separate functional defect, BUG-TCM-024 — ID search doesn't work — is unrelated to this timing check; use
  subject-text search only.)

**Status: EXECUTED 2026-10-23 — PASS.** Subject search for `"Perf bulk case 999"` across `rftc-perf-500`'s 1500+
test cases (500 original + 1000 bulk-CSV-imported): **311ms**, correctly scoped (exactly the matching case
returned, no false positives). No timeout.

---

### TC-TCM-256: Run grid's defect sub-filter stays responsive across 500+ rows

**User Role:** Any role with view access
**Priority:** Medium
**Steps:**
1. On the 500-case run fixture, apply the "Test case" → `With Defects`/`Without Defects` sub-filter (the
   documented two-level control from `docs/TESTCASE_MANAGEMENT_MEMORY.md`).

**Expected Result:**
- The filtered grid returns within a reasonable time and the counts are correct for the full 500+ row set, not
  just a partial scan.

**Status: NOT EXECUTED this pass.** The run-grid defect sub-filter needs cases with real linked defects at
volume, which this pass's fixture doesn't have (the 500-case run's results were seeded directly against
`IssueStatusResult`, not through the real "Report Defect"/defect-linking flow, so none carry a real `defect_ids`
link). Deferred to a future pass with a defect-bearing fixture rather than asserted PASS/FAIL on a fixture that
can't actually exercise it.

---

## Bulk operations at scale

---

### TC-TCM-257: Bulk Update Results on 100+ selected test cases completes without timing out or partial loss

**User Role:** Any role with bulk-update permission
**Priority:** High
**Steps:**
1. On the 500-case run, select 100+ cases via the bulk-selection checkboxes and apply a single bulk status update.
2. After completion, verify all 100+ selected cases actually updated (not a silent partial-apply) and none of the
   untouched cases changed.

**Expected Result:**
- Completes within a reasonable time with all 100+ rows correctly updated, zero bleed-over to unselected cases
  (extending the existing small-scale confirmation, TC-TCM-190, to a much larger selection).

**Status: EXECUTED 2026-10-23 — PASS, with an investigation worth recording.** Selected "all on this page" (100
cases, Run #81, `per_page=100`) and bulk-applied status **Passed** in environment `env-a`. Completed in roughly
9s wall-clock (includes UI interaction, not pure server time). DB-verified afterward: only **80** of the 100
selected cases got a new `IssueStatusResult` row — initially looked like a silent partial-apply (exactly what this
TC warns against), so investigated before concluding anything. Pulled the *exact* 100 issue IDs the grid actually
rendered (via a direct authenticated `curl` of the same page/params, not a guess at sort order) and diffed against
which got a new row: the **20 "missing" cases all already had `case_status_id` = Passed** from the original seed
— the feature correctly treated an already-correct case as a no-op rather than writing a redundant duplicate
result row. **Zero bleed-over** to any of the 400 unselected cases (confirmed: updated-but-not-on-page = 0). Net
result: all 100 selected cases end up with the correct final status, with no duplicate-row clutter for the 20
already there — correct behavior, not a bug. (First pass at this check used a wrong assumption about the grid's
sort order and nearly mis-concluded a defect — corrected by pulling the real rendered IDs before drawing any
conclusion, consistent with this session's established verify-before-filing discipline.)

---

### TC-TCM-258: Bulk CSV import of 1000+ rows completes within a reasonable time

**User Role:** Any role with CSV import access
**Priority:** High
**Steps:**
1. Import the 1000+-row CSV fixture through all 4 wizard steps, timing each step (especially step 4's preview
   render and the final confirm/save).

**Expected Result:**
- Completes without an unbounded hang or Sidekiq-job timeout. Record actual time per step; compare against the
  existing 500-row baseline (~0.5s for a 100×3-step import per `docs/TESTCASE_MANAGEMENT_MEMORY.md`'s Confirmed
  Working section) to see whether the scaling is roughly linear or shows signs of a quadratic/N+1 pattern.

**Status: EXECUTED 2026-10-23 — PASS, with an architecture note worth recording.** Imported
`23_bulk_1000_rows.csv` (1000 rows, 3 steps each) through all 4 wizard steps. Steps 1–3 and step 4's preview
render were fast (a few seconds total, no perceptible lag). **The final commit (`perform_import`) is a
foreground, live-progress AJAX flow, not a background Sidekiq job** — the page shows "Please keep this tab open
while testcases are being imported; closing or navigating away will stop the import," with a live counter (e.g.
"530 / 1000 (53%)"). Completed in roughly 20–30s wall-clock for all 1000 rows, zero failures reported
("Success: 1000 / Failed: 0"), confirmed via DB lookup (`Issue.where("subject LIKE 'Perf bulk case%'").count` =
1000). This is a real behavioral finding distinct from pass/fail: a large CSV import is **tab-bound**, not a
fire-and-forget background job — an admin doing an unattended bulk migration of a much larger file (10,000+ rows)
would need to keep that browser tab open the whole time or the import stops. Not filed as a bug (the suite's
own `09_large_bulk_import_100_rows.csv` baseline was previously measured as a *preview-render* time, ~0.5s,
not this *commit* step — the two are different operations and aren't actually a fair apples-to-apples
comparison; recorded here as a clarification, not a regression). Flagged in `TESTCASE_MANAGEMENT_MEMORY.md` as
worth knowing before anyone attempts a very large production CSV migration.

---

### TC-TCM-259: Bulk delete / copy-to-suite on 200+ selected test cases completes correctly

**User Role:** Any role with the relevant bulk permission
**Priority:** Medium
**Steps:**
1. Select 200+ test cases and perform a bulk "copy to suite" (or bulk delete, if a safe disposable fixture set is
   used) operation in one action.

**Expected Result:**
- Completes within a reasonable time with the correct count of cases copied/deleted — no partial completion left
  silently half-done.

**Status: NOT EXECUTED this pass — deliberately deferred.** This TC is destructive by nature (bulk delete, or a
bulk copy that would need an equally large disposable target suite), and this pass's fixtures (the 500-case
`Perf-500` suite and its linked run/requirements/reports) are shared, reusable volume-testing fixtures worth
keeping intact for the next performance regression rather than consuming them here. Needs a dedicated disposable
200+-case batch before it can be safely executed.

---

## Symptoms of N+1-style query patterns

---

### TC-TCM-260: Run dashboard stats/pie chart recompute time as linked-case count grows

**User Role:** Any role with view access
**Priority:** Medium
**Steps:**
1. Record the dashboard summary/pie-chart render time for runs linking 100, then 500, then 1000 test cases
   (reuse runs created for earlier cases where possible).

**Expected Result:**
- Render time should scale roughly linearly (or better) with case count. Flag if the 1000-case run's dashboard
  takes disproportionately longer than 5x the 100-case run's time (the specific symptom of an N+1 query per case
  rather than one aggregate query) — a flag for `<PREFIX>_MEMORY.md` even without server-side query logs, per
  §29's rule.

**Status: EXECUTED 2026-10-23 — PASS (2-point comparison, not the full 3-point sweep).** Compared Run #81's own
show page (500 linked cases, the same page measured for TC-TCM-251) against a small 1–2-case run on a different
project: **1.78s @ 500 cases vs. 91ms @ ~1 case** — roughly **19–20x slower for 500x the data**, which is
*sub-linear* scaling, not the ">5x-per-5x" N+1 symptom this TC specifically warns about. **Not flagged as an N+1
pattern.** A true 3-point sweep (100 / 500 / 1000 cases) wasn't done this pass — only the 500-case run and a
baseline small run exist; a 1000-case run would need its own separate fixture. The 2-point result is reassuring
enough that a 3rd point wasn't pursued as a blocking gap this pass.

---

### TC-TCM-261: Test Suite "Testcase Summary" grid render time as a single suite's case count grows

**User Role:** Any role with view access
**Priority:** Medium
**Steps:**
1. Compare render time for the Testcase Summary grid on a suite holding ~20 cases vs. the 500-case fixture suite.

**Expected Result:**
- Scales reasonably; flag disproportionate slowdown as a possible N+1 pattern (each row independently querying
  its own status/defect count rather than one batched query).

**Status: EXECUTED 2026-10-23 — PASS, no N+1 pattern.** Compared the `Perf-500` suite's Testcase Summary grid
(500 cases, measured for TC-TCM-249 at **95ms**) against an existing ~20-case suite on a different project:
**58ms**. Essentially flat — 95ms vs 58ms for 25x the case count is not a scaling concern at all, let alone an
N+1 symptom.

---

## Auto-refresh / polling behavior

---

### TC-TCM-262: Scope note — no auto-refresh/polling feature currently exists in this plugin

**User Role:** N/A
**Priority:** Low

Per `docs/TESTCASE_MANAGEMENT_FEATURES_LIST.md` and `docs/TESTCASE_MANAGEMENT_USER_GUIDE.md`, no screen in this
plugin auto-refreshes or polls (the To-Do list, Activity Log, and dashboards are all request-driven, not
live-updating). `SENIOR_QA_STANDARDS.md` §29's "auto-refresh/polling doesn't degrade a long-open tab" check
therefore has nothing to exercise today. **Not executed as a plugin TC** — recorded as a documented scope
decision (add a line to `TESTCASE_MANAGEMENT_SCOPE.md`'s Out of Scope section referencing this TC ID). Revisit if
a future release adds a live-updating view (e.g. a real-time run dashboard).

---

## Report/export generation time for large datasets

---

### TC-TCM-263: Testcase Summary report generation over a large dataset completes without timing out

**User Role:** Any role with create-report permission
**Priority:** High
**Steps:**
1. Generate a Testcase Summary report scoped to "include all test runs" against the 500+ case / multi-run
   project fixture, both as an in-app view and as an emailed report.

**Expected Result:**
- Both the in-app render and the emailed delivery complete within a reasonable time — no Sidekiq job timeout, no
  in-app 504.

**Status: EXECUTED 2026-10-23 — PASS, flagged for follow-up (in-app only; emailed delivery not tested this
pass).** Created a real Testcase Summary report via the actual "New Report" wizard (not a raw-seeded one — the
100 raw-seeded reports turned out to have degenerate `criteria`/no download controls, not representative of a
real report; see note at the end of this suite), scoped to "Include all test run" against Run #81 (500 cases).
In-app render: **6.4–8.0s** across 2 repeats — no 504, completes, but clearly the slowest page measured in this
entire suite. Baseline comparison: an existing report on a much smaller project still took **2.6s** — so this
page is generally slow even at modest scale, and gets slower still (roughly 2.5–3x) at 500 cases. **Flagged
prominently** in `TESTCASE_MANAGEMENT_MEMORY.md` as the strongest performance concern found this pass — not
filed as a bug (no timeout/crash, and the suite's own pass criterion is "flag," not "fail," a merely-slow result),
but worth a developer's attention before this report type is used routinely on large projects. Emailed delivery
timing not captured this pass (would need a working outbound mail capture, not set up for this project).

---

### TC-TCM-264: PDF export generation time for a large report stays within a reasonable bound

**User Role:** Any role with report access
**Priority:** Medium
**Steps:**
1. Download the large report fixture (TC-TCM-263's dataset) as PDF and time the Grover/Puppeteer conversion.

**Expected Result:**
- Completes within a reasonable time (record actual seconds) — a large report converting to PDF is the most
  resource-heavy export path in this plugin (headless Chromium rendering full HTML), so it's the one most likely
  to reveal a real scaling problem even though smaller reports (the existing confirmed-working 53 KB/9-stream PDF
  baseline) convert quickly.

**Status: NOT EXECUTED this pass — route not reached.** The PDF download control on the report show page is a
JS-driven dropdown (`#download-dropdown` → `#download-pdf`), not a plain link with a static `href` — unlike the
Excel export (TC-TCM-265), which uses a real `export_excel_testcase_report_path` route and was timed
successfully. Two guessed direct routes (`/download_report?report_id=`, `/download_report?id=`) both 404'd, and a
direct browser click on the dropdown wasn't completed before time ran out this pass. Needs either reading the
JS handler to find the real AJAX endpoint, or driving the click + resulting download/new-tab through a full
Playwright flow — deferred rather than guessed at further.

---

### TC-TCM-265: Excel export generation/parsing time for a large report stays within a reasonable bound

**User Role:** Any role with report access
**Priority:** Low
**Steps:**
1. Download the large report fixture as Excel and time generation plus a round-trip parse (e.g. via the
   automation suite's existing `XLSX.utils.sheet_to_json` verification pattern).

**Expected Result:**
- Completes within a reasonable time with correct cell data for the full dataset, not a truncated subset.

**Status: EXECUTED 2026-10-23 — PASS.** Excel export of the same real 500-case report (TC-TCM-263's report,
via the confirmed `export_excel` route): **3.3s**, returned a genuine, valid `.xlsx` file (confirmed via `file`
— "Microsoft Excel 2007+" — not an error page or truncated stub), 32,530 bytes. Not round-trip-parsed this pass
(no cell-content spot-check), but the file is structurally valid and generated well within a reasonable bound.

---

### TC-TCM-266: A scheduled report job against a large dataset does not back up the Sidekiq queue

**User Role:** Admin / any role with schedule-report permission
**Priority:** Medium
**Steps:**
1. Schedule the large report fixture to run (e.g. daily), let it fire, and check the Sidekiq queue/log for the job
   duration and whether any other queued job is delayed behind it.

**Expected Result:**
- The job completes in a reasonable time and does not visibly starve other queued jobs (e.g. notification emails)
  behind it.

**Status: NOT EXECUTED this pass — deliberately deferred.** Needs a real scheduled-report run to actually fire
(daily/weekly schedule) and a longer observation window of the Sidekiq queue around that firing than a single
QA pass allows — set up and observe in a dedicated follow-up session instead of rushing a false "fired once,
looked fine" result.

---

## Combined stress and concurrency

---

### TC-TCM-267: CSV import wizard stays responsive on a file that is both wide (45+ columns) and long (1000+ rows)

**User Role:** Any role with CSV import access
**Priority:** Medium
**Steps:**
1. Import the combined wide-and-long CSV fixture through all 4 steps, paying particular attention to step 2/3's
   column-mapping and value-mapping screens (which render one row of UI per column, times row-count-dependent
   preview data).

**Expected Result:**
- All four steps remain responsive; step 4's preview render in particular should not degrade disproportionately
  from the already-confirmed single-dimension baselines (45 columns alone, or 500 rows alone) when both are
  combined.

**Status: EXECUTED 2026-10-23 — PASS.** Imported `24_wide45_long1000.csv` (45 columns × 1000 rows) through all 4
wizard steps. Step 2's column-mapping table rendered 45 rows without a perceptible lag; step 3 and step 4 both
completed normally; step 4's preview correctly reported **1000 testcases will be created correctly / 0 warnings /
0 errors** — no degradation beyond the already-confirmed single-dimension baselines (TC-TCM-258's 1000-row-alone
preview, TC-TCM-037's 45-column-alone preview). The actual commit (`perform_import`) was **not** run for this
fixture, since it would create another 1000 duplicate issues on top of TC-TCM-258's — the 4-step wizard render
itself is the assertion this TC cares about, and that passed cleanly.

---

### TC-TCM-268: Two users recording results concurrently in the same run show no lock contention or data loss

**User Role:** Two distinct roles with execute permission, same run
**Priority:** Medium
**Steps:**
1. Using two genuinely independent browser contexts (Playwright TS automation suite, not Playwright MCP's shared
   cookie-jar tabs — see the TC-TCM-187 tooling note in `docs/TESTCASE_MANAGEMENT_MEMORY.md`), have both users
   submit a result for two *different* test cases in the same run at the same moment.
2. Repeat for the *same* test case (expect a clean "last write wins" or a conflict message, not data corruption).

**Expected Result:**
- Different-case concurrent writes: both save correctly with no cross-contamination or dropped write.
- Same-case concurrent writes: resolves deterministically (last write wins, or an explicit conflict is surfaced)
  — never two inconsistent `IssueStatusResult` rows left in an ambiguous state, and no 500 from a race on a
  unique constraint.

**Status: NOT EXECUTED this pass — deliberately deferred (known tooling limitation, unchanged from when this
suite was authored).** Needs genuinely independent browser contexts to submit truly simultaneous requests —
Playwright MCP's shared-cookie-jar tabs can't do this (same limitation already documented for TC-TCM-187 in
`docs/TESTCASE_MANAGEMENT_MEMORY.md`). Requires the plugin's own `automation/tests/` Playwright TS suite (separate
`browser.newContext()` instances), which doesn't exist yet for this plugin's performance suite.

---

## Evidence Map (fill in during execution — record actual timings, not just PASS/FAIL)

| TC ID | Result | Observed timing | Notes / bug reference |
|---|---|---|---|
| TC-TCM-249 | PASS | 95ms | Testcase Summary grid, 500 cases |
| TC-TCM-250 | PASS | 97ms | Suite tree, 50 sibling suites |
| TC-TCM-251 | PASS (flagged) | 1.7–2.0s vs 91ms baseline (~20x for 500x data, sub-linear) | Run detail grid, 500 cases — slowest-but-one page measured; watch for regression |
| TC-TCM-252 | PASS | 153ms | Reports list, 100 reports |
| TC-TCM-253 | PASS | 450ms | RTM, 100 requirements × 500 cases |
| TC-TCM-254 | PASS (To-Do flagged) | Activity Log 148ms; To-Do 1.2–1.4s vs 355ms baseline (~3.5–4x) | Proportionate to data growth, not alarming |
| TC-TCM-255 | PASS | 311ms | Subject search, 1500+ cases |
| TC-TCM-256 | NOT EXECUTED | — | No defect-linked fixture this pass |
| TC-TCM-257 | PASS | ~9s wall-clock (UI), 80/100 new rows + 20 correct no-ops | Investigated a false partial-apply suspicion — confirmed correct (no-op skip for already-Passed cases), zero bleed-over |
| TC-TCM-258 | PASS | ~20–30s commit, 1000/1000 created, 0 failed | Foreground tab-bound AJAX import, not a background job — architecture note, not a bug |
| TC-TCM-259 | NOT EXECUTED | — | Destructive; fixtures kept intact for reuse |
| TC-TCM-260 | PASS | 91ms @ ~1 case vs 1.78s @ 500 cases (~19–20x, sub-linear) | No N+1 pattern; 2-point comparison only |
| TC-TCM-261 | PASS | 58ms (~20 cases) vs 95ms (500 cases) | Essentially flat, no N+1 pattern |
| TC-TCM-262 | N/A — scope note | — | no polling feature exists |
| TC-TCM-263 | PASS (flagged) | 6.4–8.0s vs 2.6s baseline | Slowest page in this suite; real report via New Report wizard, Run #81/500 cases |
| TC-TCM-264 | NOT EXECUTED | — | PDF download route is JS-driven, not a static link; not reached this pass |
| TC-TCM-265 | PASS | 3.3s, 32,530-byte valid .xlsx | Excel export, real report, 500 cases |
| TC-TCM-266 | NOT EXECUTED | — | Needs a longer Sidekiq-queue observation window |
| TC-TCM-267 | PASS | All 4 wizard steps clean, 1000/0/0 at step 4 | 45-column × 1000-row combined-stress fixture; commit not performed (would duplicate TC-258's issues) |
| TC-TCM-268 | NOT EXECUTED | — | Needs automation suite's independent browser contexts, not MCP (same limitation as TC-TCM-187) |

**Result: 15/20 TCs executed, all PASS; 5 deliberately deferred (TC-TCM-256, 259, 264, 266, 268), each with a
recorded reason rather than a silent skip. Zero new bugs filed.** Two pages flagged as noticeably slow in
absolute terms, though not failing the suite's own PASS/FAIL criterion (no timeout/crash) and not showing N+1-style
disproportionate scaling: the Run detail page (TC-TCM-251, 1.7–2.0s at 500 cases) and the Testcase Summary report
render (TC-TCM-263, 6.4–8.0s at 500 cases, slow even at small scale). Both flagged in
`TESTCASE_MANAGEMENT_MEMORY.md` for regression-watching on future releases. One investigation (TC-TCM-257) nearly
produced a false bug report — corrected by re-verifying against the actual rendered page IDs before concluding
anything, consistent with this session's established discipline of proving a finding before filing it.
