# Test Cases — Redmineflux Testcase Management — Performance Testing

> Source: `SENIOR_QA_STANDARDS.md` §29 (Performance Testing Approach — mandatory for every plugin, every cycle)
> and this plugin's own `docs/TESTCASE_MANAGEMENT_MEMORY.md`, which already carries one relevant performance data
> point (CSV import of a 45-column × 500-row / 121 KB file rendering its step-4 preview correctly with no session
> overflow). This suite exists to give the plugin's primary list/detail/report screens a dedicated large-data
> pass, per `TESTCASE_MANAGEMENT_TRACEABILITY_MATRIX.md`'s own recorded gap (no suite targeted Performance).
>
> **Status: authored 2026-10-06, not yet executed.** Every case needs a real large-data fixture before it can run
> — this suite cannot be executed against the plugin's existing small QA fixtures (a handful of test cases/runs
> per project) without first seeding the volumes each case specifies. Seeding scripts/fixtures should be added to
> `automation/testdata/` once this suite's specs are written (per `CLAUDE.md` §13), not created by hand each time.
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

---

### TC-TCM-261: Test Suite "Testcase Summary" grid render time as a single suite's case count grows

**User Role:** Any role with view access
**Priority:** Medium
**Steps:**
1. Compare render time for the Testcase Summary grid on a suite holding ~20 cases vs. the 500-case fixture suite.

**Expected Result:**
- Scales reasonably; flag disproportionate slowdown as a possible N+1 pattern (each row independently querying
  its own status/defect count rather than one batched query).

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

---

### TC-TCM-265: Excel export generation/parsing time for a large report stays within a reasonable bound

**User Role:** Any role with report access
**Priority:** Low
**Steps:**
1. Download the large report fixture as Excel and time generation plus a round-trip parse (e.g. via the
   automation suite's existing `XLSX.utils.sheet_to_json` verification pattern).

**Expected Result:**
- Completes within a reasonable time with correct cell data for the full dataset, not a truncated subset.

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

---

## Evidence Map (fill in during execution — record actual timings, not just PASS/FAIL)

| TC ID | Result | Observed timing | Notes / bug reference |
|---|---|---|---|
| TC-TCM-249 | | | |
| TC-TCM-250 | | | |
| TC-TCM-251 | | | |
| TC-TCM-252 | | | |
| TC-TCM-253 | | | |
| TC-TCM-254 | | | |
| TC-TCM-255 | | | |
| TC-TCM-256 | | | |
| TC-TCM-257 | | | |
| TC-TCM-258 | | | baseline: ~0.5s/100 rows (3-step) per TESTCASE_MANAGEMENT_MEMORY.md |
| TC-TCM-259 | | | |
| TC-TCM-260 | | | |
| TC-TCM-261 | | | |
| TC-TCM-262 | N/A — scope note | — | no polling feature exists |
| TC-TCM-263 | | | |
| TC-TCM-264 | | | |
| TC-TCM-265 | | | |
| TC-TCM-266 | | | |
| TC-TCM-267 | | | |
| TC-TCM-268 | | | needs automation suite, not MCP |
