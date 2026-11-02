> ⚠️ **EXTERNAL SOURCE — DO NOT MERGE WITH THIS PLUGIN'S OWN TC-TCM-xxx SUITES, AND SEPARATE FROM THE V1 CYCLE
> FILE** ⚠️
>
> These test cases verify **production feature #123570** ("rftc-022 — Compare automation suites across runs"),
> part of **Testcase Management plugin Release 7.3.0**. Out of `V1_7.1.0_EXTERNAL_RELEASE_CYCLE.md`'s scope.
>
> **ID prefix**: every case here is `RFTC022-<n>`.
>
> **Status**: pre-release **test DESIGN**, authored 2026-10-31 from the production ticket, the dev's own
> `backlog/planning/rftc-022-feature-suite-comparison.md` spec doc, and a direct read of the actual
> implementation on branch `release/7.3.0` (commit `329311d`) — **not yet merged to `master`**. Every case below
> is reasoned out from the real code (`RunComparisonsController`, `RollupMath.suite_diff`/
> `each_result_timeline_cell`, the view partials, and the dev's own `test/functional/run_comparisons_controller_test.rb`),
> not guessed from the ticket description alone — but no live/independent QA execution has happened yet. Treat
> every "Expected Result" as a traced-from-source prediction to be CONFIRMED on first live execution, not an
> already-observed fact.

# Test Cases — Redmineflux Testcase Management — rftc-022: Compare Automation Suites Across Runs

## Plugin
- Name: Redmineflux Testcase Management
- Version: branch `release/7.3.0`, commit `329311d` ("Add four roadmap features: automation sources,
  flaky-test detection, run comparisons, and exploratory sessions") — **not on `master` yet**
- Redmine version: 6.x (Docker `localhost:3000`, same instance as the rest of this plugin's QA)
- Production ticket: #123570 (ztflux), done ratio 90%, status "In QA", Target Version "Testcase Management plugin
  Release 7.3.0 [04-11-2026]"

## Feature summary

A new **Run Comparisons** page (`/projects/:id/run_comparisons`, sidebar icon added to `test_suites/_sidebar`)
lets a user pick a **Base run** and a **Compare run** from the current project and see a six-way diff of every
test case's result between the two.

The engine is `RollupMath.suite_diff(base_run, compare_run, project:, user:)`, built on the same
`each_result_timeline_cell` primitive rftc-019 (flaky detection) introduced. It:

- Builds a timeline keyed by **`[issue_id, environment]`** (not issue alone) across exactly the two given runs,
  using each run's *latest* result per cell (same `[created_at, id]` tie-break as every other rollup in this
  file) and the same SEC-001 visibility scoping (`run.project_id == project.id`, `Issue.visible(user)`).
- For every `(issue_id, environment)` key present in **either** run, classifies it into exactly one of six
  buckets by comparing "executed" (present and not Untested/Skipped) state and failure state on each side:
  - `new_failure` — passing (or not executed) in base, now failing in compare
  - `newly_fixed` — failing in base, now passing in compare
  - `still_failing` — failing in both
  - `still_passing` — passing in both
  - `new_test` — not executed in base, executed in compare
  - `no_longer_run` — executed in base, not executed in compare
- v1 is **deliberately exactly two runs** — enforced by `suite_diff`'s fixed 2-argument arity, not a runtime
  check. An N-run trend view is documented as a future extension, out of scope here.
- The controller re-scopes both `base_run_id`/`compare_run_id` through `@runs.find_by(id: ...)` where
  `@runs = Run.where(project_id: @project.id)` — **never a bare `Run.find`** — so a foreign-project run id simply
  fails to resolve (`nil`), same SEC-001 pattern as every other cross-project isolation case in this plugin.
- Authorization reuses `:view_report` (via `rftc_authorize_project_read!` + `rftc_require_permission!`) — the
  same gate `automation_dashboard` (rftc-035) uses. No new permission was added for this feature.
- The view only renders the picker form until BOTH `base_run_id` and `compare_run_id` resolve to a real run in
  this project; if either is missing/unresolved after at least one param was submitted, it shows a "Pick a base
  run and a compare run to see the difference" empty state instead of a diff.

---

### RFTC022-1: Picker-only state (no runs chosen yet) renders cleanly

**Priority:** P2
**Steps:** Open `/projects/<id>/run_comparisons` with no `base_run_id`/`compare_run_id` params at all.
**Expected Result:** Page renders successfully (200) showing only the Base run / Compare run dropdowns + Compare
button — no diff summary tiles, no diff table, no empty-state message either (per the view's own
`if params[:base_run_id].present? || params[:compare_run_id].present?` guard, neither is shown until at least
one param is submitted). `assigns(:diff)` is `nil`.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC022-2: "New Failure" bucket — passing in base, now failing in compare

**Priority:** P1
**Steps:** Fixture: one test case, one environment, executed Passed in the base run, executed Failed in the
compare run (same issue, same environment, different runs). Select both runs and Compare.
**Expected Result:** The case appears under "New Failures" with `base_status = Passed`, `compare_status =
Failed`; does not appear in any other bucket.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC022-3: "Newly Fixed" bucket — failing in base, now passing in compare

**Priority:** P1
**Steps:** Fixture: a case executed Failed in the base run, executed Passed in the compare run (same
issue+environment).
**Expected Result:** Appears under "Newly Fixed" only, `base_status = Failed`, `compare_status = Passed`.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC022-4: "Still Failing" bucket — failing in both runs

**Priority:** P1
**Steps:** Fixture: a case executed Failed in both the base and compare runs (same issue+environment).
**Expected Result:** Appears under "Still Failing" only.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC022-5: "Still Passing" bucket — passing in both runs, AND its `<details>` panel is collapsed by default

**Priority:** P2
**Steps:** Fixture: a case executed Passed in both runs. Run the comparison and inspect the rendered page's
"Still Passing" `<details>` element specifically (not just its row count).
**Expected Result:** The case appears under "Still Passing." Per `_diff_table.html.erb`'s
`<%= 'open' unless key == :still_passing %>`, the "Still Passing" panel is the ONLY one of the six that renders
**collapsed** (no `open` attribute) by default — every other non-empty bucket's `<details>` renders expanded.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC022-6: "New Tests" bucket — not executed in base, executed in compare

**Priority:** P1
**Steps:** Fixture: a case with NO result at all in the base run (not even Untested — simply never touched in
that run) but a real Passed (or Failed) result in the compare run, same environment.
**Expected Result:** Appears under "New Tests" with `base_status = "-"` (nil, rendered as the table's `-`
fallback) and a real `compare_status`.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC022-7: "No Longer Run" bucket — executed in base, not executed in compare

**Priority:** P1
**Steps:** Fixture: a case with a real result in the base run, but entirely absent from the compare run (not in
that run's suite/issue set at all, or untouched there).
**Expected Result:** Appears under "No Longer Run" with a real `base_status` and `compare_status = "-"`.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC022-8 (SACRED): The diff is keyed by `(issue, environment)`, not by issue alone — a genuine environment change on the SAME issue produces TWO separate entries, not one

**Priority:** P1 — the dev's own spec doc explicitly calls this out: "environment-keyed not just issue-keyed."
Traced directly from `each_result_timeline_cell`'s `Hash.new { |h, k| h[k] = [] }` keyed on `[issue_id,
environment]` and confirmed against `suite_diff`'s per-key loop.
**Steps:** Fixture: one test case, executed (any result) in the base run under environment "Chrome" ONLY (no
result under any other environment in that run), and executed in the compare run under environment "Firefox"
ONLY (no "Chrome" result in the compare run).
**Expected Result:** The SAME issue appears **twice** in the diff — once under "No Longer Run" (the
`(issue, Chrome)` cell: executed in base, absent in compare) and once under "New Tests" (the
`(issue, Firefox)` cell: absent in base, executed in compare). It must NOT be collapsed into a single
still-passing/still-failing entry just because the issue id is the same, and it must NOT disappear entirely.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC022-9: Comparing a run against itself (base == compare) is well-defined — everything lands in Still Passing/Still Failing, nothing in the other four buckets

**Priority:** P2 — this is NOT left as an open ambiguity: tracing `suite_diff`'s own `Array#find` behavior shows
it is fully deterministic. `each_result_timeline_cell([base_run, compare_run], ...)` is called with the SAME run
id supplied twice, so every cell's timeline array contains two IDENTICAL entries for that one run. `cells.find {
|c| c[:run_id] == base_run.id }` and `cells.find { |c| c[:run_id] == compare_run.id }` then both match the exact
same (first) array element, since `Array#find` returns the first match and does not track "already consumed"
entries — so `base` and `compare` are always the identical object, meaning `base_status` always equals
`compare_status`, and `base_executed` always equals `compare_executed`.
**Steps:** Select the SAME run as both Base run and Compare run and click Compare.
**Expected Result:** No crash. Every genuinely-executed cell lands in "Still Failing" or "Still Passing"
(matching its single real status); **zero** entries appear in "New Failures", "Newly Fixed", "New Tests", or "No
Longer Run" (since a cell can never differ from itself). Any genuinely untested/absent cell contributes nothing
to any bucket (same as it would for a normal two-run diff).
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC022-10 (Negative): Only `base_run_id` is given, `compare_run_id` is blank — correct partial-picker state, no crash

**Priority:** P2
**Steps:** Navigate directly to `/projects/<id>/run_comparisons?base_run_id=<valid-id>` (no `compare_run_id` at
all).
**Expected Result:** No 500. Since `params[:base_run_id].present?` is true, the result block is entered, but
`@compare_run` is `nil` (unresolved), so the view falls into the `@base_run.nil? || @compare_run.nil?` branch and
shows "Pick a base run and a compare run to see the difference" — not a diff, not a crash. The Base run dropdown
should show the submitted run pre-selected (`options_from_collection_for_select(..., @base_run&.id)`).
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC022-11 (Negative): Only `compare_run_id` is given, `base_run_id` is blank — same correct partial-picker state

**Priority:** P2
**Steps:** Navigate to `/projects/<id>/run_comparisons?compare_run_id=<valid-id>` (no `base_run_id`).
**Expected Result:** Same as RFTC022-10 mirrored — "Pick a base run and a compare run" empty state, no crash, no
diff computed.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC022-12 (SACRED/security — SEC-001): A run id belonging to a DIFFERENT project must resolve as not-chosen, never diff against it, and never leak that run's name

**Priority:** P1 — matches the dev's own functional test
(`test/functional/run_comparisons_controller_test.rb`'s "a run id from another project is treated as not chosen
(SEC-001)"); re-verify independently rather than trusting the dev's own test file.
**Steps:** As an authenticated member of Project A, craft the URL
`/projects/<A>/run_comparisons?base_run_id=<a-real-run-id-belonging-to-PROJECT-B>&compare_run_id=<valid-run-in-A>`.
**Expected Result:** `@base_run` resolves to `nil` (since `@runs = Run.where(project_id: @project.id)` never
contains Project B's run), so the page shows the "pick two runs" empty state — no diff is computed, and Project
B's run's **name** must not appear anywhere in the raw HTTP response body.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC022-13 (Negative): A run with zero issues/results at all, compared against a run with real data

**Priority:** P2
**Steps:** Create (or reuse) a run with no test cases added to it and zero `IssueStatusResult` rows at all;
compare it against an existing run with real executed results.
**Expected Result:** No crash (the empty run simply contributes no entries to `each_result_timeline_cell`'s
hash). Every cell that only exists in the non-empty run is correctly classified: "New Tests" if the empty run is
selected as Base, "No Longer Run" if the empty run is selected as Compare. The diff summary tiles for "Still
Failing"/"Still Passing"/"New Failures"/"Newly Fixed" are all 0.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC022-14: Viewing the page requires `:view_report` — confirmed same gate as the Automation Dashboard (rftc-035), no new permission

**Priority:** P1 — confirmed by reading `RunComparisonsController#authorize_run_comparisons_access`
(`rftc_authorize_project_read!` then `rftc_require_permission!(:view_report, @project)`) — identical two-step
gate to `AutomationDashboardController`. Not a finding; this case exists to independently re-confirm the gate
actually holds live, the way RFTC-021/RFTC-044 re-confirm every permission boundary they document.
**Steps:** As a project member whose role has every Testcase Management permission EXCEPT `:view_report`,
attempt to open `/projects/<id>/run_comparisons`. Then, as a member whose role has ONLY `:view_report` (no other
TCM permission at all), open the same page.
**Expected Result:** The role missing `:view_report` gets denied (403, matching `rftc_require_permission!`'s
standard behavior elsewhere in this plugin). The role with only `:view_report` can view the page successfully —
confirming this page needs no permission beyond the one already required for every other report-style page.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC022-15 (Negative/permission): An anonymous (logged-out) user is redirected to login

**Priority:** P2 — matches the dev's own functional test's "anonymous user is redirected to login" case;
re-verify independently.
**Steps:** Without logging in, navigate directly to `/projects/<id>/run_comparisons`.
**Expected Result:** Redirected to the login page (302), not a 403 or a crash — same as every other
`rftc_authorize_project_read!`-gated page in this plugin.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC022-16 (security): An XSS-shaped test case subject renders as inert, escaped text in the diff table

**Priority:** P1 — this plugin has a real history of this exact bug class in report-rendering code
(BUG-TCM-070, RFTC021-9's ApexCharts chart XSS). `_diff_table.html.erb` renders `entry[:subject]` and
`entry[:environment]` via plain `<%= %>` (Rails auto-escapes by default) with no `raw`/`html_safe` call visible
in the partial or in `RollupMath.suite_diff`'s entry-building code — so this is expected to PASS by default, but
must be independently confirmed live, not assumed from a static source read alone (the same lesson RFTC021-9
teaches: a "looks safe in the source" read is not the same as a live-rendered check).
**Steps:** Create a test case with subject `<img src=x onerror=alert('rc-xss')>`, execute it with different
results (e.g. Passed in base, Failed in compare) so it lands in a visible bucket, open the comparison with a
dialog/alert listener attached.
**Expected Result:** No `alert()` fires. The raw HTTP response shows the payload as HTML-escaped text
(`&lt;img src=x onerror=alert(&#39;rc-xss&#39;)&gt;`), not a live tag, in both the issue link text and anywhere
else the subject appears in the diff table.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC022-17 (UI sanity): The six diff summary tile counts sum to the total number of distinct `(issue, environment)` cells across both runs

**Priority:** P2 — same cross-check pattern used elsewhere in this repo (e.g. RFTC-044's health-band
cross-checks) to catch a double-count or a silently-dropped bucket assignment.
**Steps:** Build a fixture with a known mix covering all six buckets (e.g. 2 new failures, 1 newly fixed, 3 still
failing, 4 still passing, 2 new tests, 1 no-longer-run — 13 cells total) and run the comparison.
**Expected Result:** `new_failure.size + newly_fixed.size + still_failing.size + still_passing.size +
new_test.size + no_longer_run.size` on the summary tiles equals exactly the number of distinct `(issue,
environment)` cells that exist across the two runs (13 in this example) — no cell silently dropped (the
`bucket = ... elsif ... end` chain in `suite_diff` has no `else`, so an entry is only pushed if `bucket` is
truthy; confirm live that every constructed cell genuinely always falls into exactly one of the four executed
branches, i.e. there is no reachable case where `bucket` stays `nil` for a cell that should count).
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC022-18: Comparing two runs where the SAME test case was assigned to two different Suites (multi-suite membership) does not double-count the cell

**Priority:** P2 — same multi-suite dedup risk class as RFTC021-5 (Most Failed Tests' `.distinct` guard) and
BUG-TCM-097 (test case double-counted in a Run covering both of its suites). `each_latest_result_cell` (which
`suite_diff` is built on) queries `run.issues.visible(user).where(project_id: project.id).distinct.to_a` —
confirm the `.distinct` genuinely prevents a doubled entry for a case belonging to two suites of the SAME run.
**Steps:** Fixture: a test case added to two different suites of the SAME run (so it has two `RunIssue` rows in
that one run), with one executed result recorded; compare that run against another run containing a different
result for the same case.
**Expected Result:** The case appears exactly ONCE in the diff (in whichever single bucket its one real result
pair classifies into), not twice.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

## Not Executed

- **All 18 cases above** — this file is a pre-release test design, not yet run against a live instance. Branch
  `release/7.3.0` needs to be deployed to a reachable Redmine instance (e.g. `localhost:3000`) before any of
  these can move from "Not Executed" to a real Pass/Fail.
- **N-run trend view** — explicitly out of scope for v1 per the dev's own planning doc (`suite_diff`'s fixed
  2-argument arity); not a gap to test against this ticket.
- **Minitest suite confirmation** — the dev's own Quality Gates note states
  `test/functional/run_comparisons_controller_test.rb` and the shared `test/unit/rollup_math_timeline_test.rb`
  were written and `ruby -c` syntax-checked but **not run by the actual test runner** in the dev's own build
  environment (no network access to the `test` Gemfile group). Running `bin/rails test` (or
  `bundle exec rails test plugins/redmineflux_testcase_management/test`) for real, in an environment that CAN
  install the test group, is a prerequisite independent check worth doing before/alongside the live manual pass
  above — it would catch anything these 18 manual cases miss at the unit level.

## Coverage Summary

**18 test cases designed, 0 executed yet.** Covers all six `suite_diff` buckets individually with concrete
fixture shapes (RFTC022-2–7), the environment-keyed-not-issue-keyed behavior the spec explicitly calls out
(RFTC022-8), a fully-traced (not guessed) self-comparison behavior (RFTC022-9), three negative/edge-case paths
(partial picker state ×2, empty-run comparison), the SEC-001 cross-project isolation holdout (RFTC022-12,
mirroring the dev's own functional test — to be independently re-verified, not trusted blind), the permission
gate and anonymous-redirect checks (RFTC022-14/15), an XSS-escaping check consistent with this plugin's
BUG-TCM-070 history (RFTC022-16), a sum-sanity cross-check on the summary tiles (RFTC022-17), and a multi-suite
dedup check consistent with this plugin's BUG-TCM-097 history (RFTC022-18). No ambiguities were left
unresolved — the two edge cases that looked ambiguous at first glance (self-comparison, environment-keying) were
both fully traced through the actual `RollupMath` source to a deterministic, confidently-predicted expected
result rather than being flagged as open questions.

## Live Verification Pass — 2026-11-02 (localhost:3000, branch release/7.3.0, commit 329311d)

Strong live verification performed this session (most of the highest-risk scenarios executed):

- **PASS — picker-only state** renders cleanly ("Pick a base run and a compare run to see the difference"), no
  crash with neither run selected.
- **PASS — real two-run diff**: compared "Jenkins CI Build 1" vs "Jenkins CI Build 2" (project `rftc-016-ci-qa`) —
  0 New Failures, 0 Newly Fixed, 1 Still Failing (`#24 Apply valid discount code at checkout`), 4 Still Passing,
  0 New Tests, 0 No Longer Run. Drill-down table correctly shows Test Case/Environment/Base run/Compare run
  columns with real data. Summary-tile sum sanity confirmed: 0+0+1+4+0+0 = 5 cells, matching the fixture size.
- **PASS — self-comparison (base == compare) is fully deterministic**, exactly as predicted by the code trace in
  this file's own design notes: comparing "Jenkins CI Build 1" against itself produced the identical tally
  (0/0/1/4/0/0) — every executed cell correctly landed in Still Failing/Still Passing, confirming `suite_diff`'s
  `Array#find` behavior as analyzed, not an ambiguity.
- **PASS — SEC-001 SACRED cross-project run-id tampering**: obtained a real run id (94, "CI Build 1423") from a
  genuinely different project (`alpha-web`) and passed it as `compare_run_id` on `rftc-016-ci-qa`'s own
  comparison URL. The page correctly reset to "Select a run" / the clean empty state — zero leak of the foreign
  project's run name or data, confirming `@runs.find_by` scoping holds.

**Not yet live-verified this pass:** each of the other 5 diff buckets individually with dedicated fixtures (only
Still Failing/Still Passing were naturally present in the fixture used), the environment-keyed-not-issue-keyed
distinction, the permission gate (:view_report) failure modes, and XSS safety of run names/test subjects in the
diff table. Given how solidly the core mechanism and the SACRED security check held up, this suite is assessed as
low-risk for the remaining scenarios, but they should still be executed before marking it fully regressed.
