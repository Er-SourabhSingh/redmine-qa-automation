> ⚠️ **EXTERNAL SOURCE — DO NOT MERGE WITH THIS PLUGIN'S OWN TC-TCM-xxx SUITES, AND SEPARATE FROM THE V1 CYCLE
> FILE** ⚠️
>
> These test cases verify **production feature #123570** ("rftc-022 — Compare automation suites across runs"),
> part of **Testcase Management plugin Release 7.3.0**. Out of `V1_7.1.0_EXTERNAL_RELEASE_CYCLE.md`'s scope.
>
> **ID prefix**: every case here is `RFTC022-<n>`.
>
> **Status**: **fully executed** — see "Full Live Execution — 2026-11-02" near the bottom of this file. Originally
> authored 2026-10-31 as a pre-release test DESIGN from the production ticket, the dev's own
> `backlog/planning/rftc-022-feature-suite-comparison.md` spec doc, and a direct read of the actual
> implementation on branch `release/7.3.0` (commit `329311d`, later fast-forwarded to `c9c8593`) — **not yet
> merged to `master`**. **Result: 17/18 PASS, 1 FAIL → BUG-TCM-127** (plugin-wide anonymous-access 403-not-redirect
> gap, confirmed on both this feature and rftc-035's Automation Dashboard) — **retested 2026-11-03 against
> commit `eefc0a4`, CONFIRMED FIXED, now 18/18 PASS.**

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
**Actual Result:** **PASS** - confirmed in the earlier partial pass (2026-11-02): page rendered cleanly with only the picker form, no diff, no empty-state message, with neither param submitted.

---

### RFTC022-2: "New Failure" bucket — passing in base, now failing in compare

**Priority:** P1
**Steps:** Fixture: one test case, one environment, executed Passed in the base run, executed Failed in the
compare run (same issue, same environment, different runs). Select both runs and Compare.
**Expected Result:** The case appears under "New Failures" with `base_status = Passed`, `compare_status =
Failed`; does not appear in any other bucket.
**Actual Result:** **PASS** - fixture case A (QA-RFTC022-A-NewFailure): base Passed, compare Failed via real CiResultIngestService calls; RollupMath.suite_diff placed it in new_failure only, base_status=Passed/compare_status=Failed. Re-confirmed live on the real Run Comparisons page (tile count 1, table row shown). See Full Live Execution section below.

---

### RFTC022-3: "Newly Fixed" bucket — failing in base, now passing in compare

**Priority:** P1
**Steps:** Fixture: a case executed Failed in the base run, executed Passed in the compare run (same
issue+environment).
**Expected Result:** Appears under "Newly Fixed" only, `base_status = Failed`, `compare_status = Passed`.
**Actual Result:** **PASS** - fixture case B (QA-RFTC022-B-NewlyFixed): base Failed, compare Passed. Landed in newly_fixed only, base_status=Failed/compare_status=Passed, confirmed via suite_diff and live on the real page. See Full Live Execution section below.

---

### RFTC022-4: "Still Failing" bucket — failing in both runs

**Priority:** P1
**Steps:** Fixture: a case executed Failed in both the base and compare runs (same issue+environment).
**Expected Result:** Appears under "Still Failing" only.
**Actual Result:** **PASS** - fixture case C (QA-RFTC022-C-StillFailing): base Failed, compare Failed. Landed in still_failing only. Confirmed via suite_diff and live on the real page. See Full Live Execution section below.

---

### RFTC022-5: "Still Passing" bucket — passing in both runs, AND its `<details>` panel is collapsed by default

**Priority:** P2
**Steps:** Fixture: a case executed Passed in both runs. Run the comparison and inspect the rendered page's
"Still Passing" `<details>` element specifically (not just its row count).
**Expected Result:** The case appears under "Still Passing." Per `_diff_table.html.erb`'s
`<%= 'open' unless key == :still_passing %>`, the "Still Passing" panel is the ONLY one of the six that renders
**collapsed** (no `open` attribute) by default — every other non-empty bucket's `<details>` renders expanded.
**Actual Result:** **PASS** - fixture case D (QA-RFTC022-D-StillPassing): base Passed, compare Passed, landed in still_passing only. Confirmed via document.querySelectorAll('details') that Still Passing is the ONLY bucket rendered with open: false - every other non-empty bucket (New Failures, Newly Fixed, Still Failing, New Tests, No Longer Run) rendered open: true. Exact match to the code trace. See Full Live Execution section below.

---

### RFTC022-6: "New Tests" bucket — not executed in base, executed in compare

**Priority:** P1
**Steps:** Fixture: a case with NO result at all in the base run (not even Untested — simply never touched in
that run) but a real Passed (or Failed) result in the compare run, same environment.
**Expected Result:** Appears under "New Tests" with `base_status = "-"` (nil, rendered as the table's `-`
fallback) and a real `compare_status`.
**Actual Result:** **PASS** - fixture case E (QA-RFTC022-E-NewTest): no RunIssue/result at all in the base run, Passed in the compare run. Landed in new_test with base_status=nil (rendered as "-" in the real table). Confirmed via suite_diff and live on the real page. See Full Live Execution section below.

---

### RFTC022-7: "No Longer Run" bucket — executed in base, not executed in compare

**Priority:** P1
**Steps:** Fixture: a case with a real result in the base run, but entirely absent from the compare run (not in
that run's suite/issue set at all, or untouched there).
**Expected Result:** Appears under "No Longer Run" with a real `base_status` and `compare_status = "-"`.
**Actual Result:** **PASS** - fixture case F (QA-RFTC022-F-NoLongerRun): Passed in the base run, RunIssue/result removed entirely from the compare run. Landed in no_longer_run with compare_status=nil ("-" in the real table). Confirmed via suite_diff and live on the real page. See Full Live Execution section below.

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
**Actual Result:** **PASS** - fixture case G (QA-RFTC022-G-EnvKeyed): executed Passed under environment "Chrome" only in the base run, executed Passed under environment "Firefox" only in the compare run (same issue). The same issue appeared TWICE in the diff - once in no_longer_run (the (issue, Chrome) cell) and once in new_test (the (issue, Firefox) cell), each with its own correct environment label, confirmed both via direct suite_diff inspection and live on the real page's table rows ("Chrome" row in No Longer Run, "Firefox" row in New Tests). Not collapsed, not dropped - exactly as predicted. See Full Live Execution section below.

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
**Actual Result:** **PASS** - re-confirmed via a direct suite_diff(base_run, base_run, project:, user:) call this pass (in addition to the earlier live-UI self-comparison pass): zero entries in new_failure/newly_fixed/new_test/no_longer_run; every genuinely-executed cell landed in still_failing/still_passing as predicted by the Array#find-returns-first-match code trace. No crash. See Full Live Execution section below.

---

### RFTC022-10 (Negative): Only `base_run_id` is given, `compare_run_id` is blank — correct partial-picker state, no crash

**Priority:** P2
**Steps:** Navigate directly to `/projects/<id>/run_comparisons?base_run_id=<valid-id>` (no `compare_run_id` at
all).
**Expected Result:** No 500. Since `params[:base_run_id].present?` is true, the result block is entered, but
`@compare_run` is `nil` (unresolved), so the view falls into the `@base_run.nil? || @compare_run.nil?` branch and
shows "Pick a base run and a compare run to see the difference" — not a diff, not a crash. The Base run dropdown
should show the submitted run pre-selected (`options_from_collection_for_select(..., @base_run&.id)`).
**Actual Result:** **PASS** - live Playwright navigation to /projects/rftc-016-ci-qa/run_comparisons?base_run_id=244 (no compare_run_id): no 500, shown the "Pick a base run and a compare run to see the difference" empty state, and the Base run select's value/selected option confirmed (via element.value) to be 244 / RFTC022-Base-Run - pre-selected exactly as expected. See Full Live Execution section below.

---

### RFTC022-11 (Negative): Only `compare_run_id` is given, `base_run_id` is blank — same correct partial-picker state

**Priority:** P2
**Steps:** Navigate to `/projects/<id>/run_comparisons?compare_run_id=<valid-id>` (no `base_run_id`).
**Expected Result:** Same as RFTC022-10 mirrored — "Pick a base run and a compare run" empty state, no crash, no
diff computed.
**Actual Result:** **PASS** - live Playwright navigation to /projects/rftc-016-ci-qa/run_comparisons?compare_run_id=245 (no base_run_id): identical empty-state result, no crash, mirroring RFTC022-10. See Full Live Execution section below.

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
**Actual Result:** **PASS** - confirmed in the earlier partial pass (2026-11-02): a real run id (94, "CI Build 1423") from a genuinely different project (alpha-web) passed as compare_run_id on rftc-016-ci-qa's own URL correctly reset to the empty "pick two runs" state - zero leak of the foreign project's run name or data, confirming @runs.find_by scoping holds.

---

### RFTC022-13 (Negative): A run with zero issues/results at all, compared against a run with real data

**Priority:** P2
**Steps:** Create (or reuse) a run with no test cases added to it and zero `IssueStatusResult` rows at all;
compare it against an existing run with real executed results.
**Expected Result:** No crash (the empty run simply contributes no entries to `each_result_timeline_cell`'s
hash). Every cell that only exists in the non-empty run is correctly classified: "New Tests" if the empty run is
selected as Base, "No Longer Run" if the empty run is selected as Compare. The diff summary tiles for "Still
Failing"/"Still Passing"/"New Failures"/"Newly Fixed" are all 0.
**Actual Result:** **PASS** - a genuine zero-issue run (RFTC022-Empty-Run, bootstrapped via CiRunBootstrapService with no suites attached, zero IssueStatusResult rows) compared as Base against the populated compare run: no crash; all 7 cells present only in the non-empty run correctly classified as new_test (empty run selected as Base); zero entries in new_failure/newly_fixed/still_failing/still_passing/no_longer_run. See Full Live Execution section below.

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
**Actual Result:** **PASS** - created a real minimal custom role (RFTC022 ViewReportOnly, permissions [:view_issues, :view_report] only, no other TCM permission) and a dedicated project-member test user (rftc022viewer): page loaded successfully (200) for them. Separately, logged in as the existing qanonadmin user (Developer role, which lacks :view_report on this project) and confirmed a 403. Confirms this page needs no permission beyond :view_report, same gate as rftc-035's Automation Dashboard. See Full Live Execution section below.

---

### RFTC022-15 (Negative/permission): An anonymous (logged-out) user is redirected to login

**Priority:** P2 — matches the dev's own functional test's "anonymous user is redirected to login" case;
re-verify independently.
**Steps:** Without logging in, navigate directly to `/projects/<id>/run_comparisons`.
**Expected Result:** Redirected to the login page (302), not a 403 or a crash — same as every other
`rftc_authorize_project_read!`-gated page in this plugin.
**Actual Result:** Originally **FAIL - new bug filed: BUG-TCM-127.** After a genuine sign-out (clicking the real "Sign out" button, not a bare GET to /logout which does NOT end the session - see Memory), direct navigation to the page returned a bare **403 Forbidden**, not a 302 redirect to /login as expected - and as the developer's own functional test explicitly asserts (assert_response :redirect). Root-caused to RftcAccessControl#rftc_require_login! always rendering :forbidden for an anonymous user. Confirmed plugin-wide (not rftc-022-specific) by reproducing the identical 403 on /projects/rftc-016-ci-qa/automation_dashboard (rftc-035, same shared concern). **Retested 2026-11-03 against commit `eefc0a4` — CONFIRMED FIXED**, anonymous access now correctly redirects to /login. See `bugs/closed/BUG-TCM-127.md`. **Now PASS.**

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
**Actual Result:** **PASS** - a test case with subject <img src=x onerror=alert('rc-xss')> was executed (Failed in compare, absent in base - landed in New Tests) and the comparison opened with a console-message listener attached: **zero console messages**, confirming no alert() fired. The rendered issue link's outerHTML was read directly: &lt;img src=x onerror=alert('rc-xss')&gt; - properly HTML-escaped text, not a live tag. See Full Live Execution section below.

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
**Actual Result:** **PASS** - built a fixture covering all six buckets plus the environment-keyed case and a multi-suite case (10 distinct (issue, environment) cells total after all sub-scenarios accumulated on the same base/compare run pair). Summary tile sum (1 New Failures + 1 Newly Fixed + 1 Still Failing + 1 Still Passing + 4 New Tests + 2 No Longer Run = 10) matched the true distinct cell count exactly, confirmed both via direct suite_diff bucket-size summation and live on the real page's rendered tiles (1/1/1/1/4/2). No cell silently dropped. See Full Live Execution section below.

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
**Actual Result:** **PASS** - fixture case H (QA-RFTC022-H-MultiSuite) added to TWO different suites of the SAME base run (two RunIssue rows), with one real result recorded there and a different result recorded in the compare run. The case appeared **exactly once** across all six buckets (landed in New Tests, per its actual result pattern) - not twice - confirming each_latest_result_cell's .distinct guard holds for this engine, same class of check as BUG-TCM-097/RFTC021-5. See Full Live Execution section below.

---

## Not Executed

- **None** — all 18 cases are fully executed as of 2026-11-02. See "Full Live Execution" below.
- **N-run trend view** — explicitly out of scope for v1 per the dev's own planning doc (`suite_diff`'s fixed
  2-argument arity); not a gap to test against this ticket.
- **Minitest suite confirmation** — the dev's own Quality Gates note states
  `test/functional/run_comparisons_controller_test.rb` and the shared `test/unit/rollup_math_timeline_test.rb`
  were written and `ruby -c` syntax-checked but **not run by the actual test runner** in the dev's own build
  environment (no network access to the `test` Gemfile group). This QA pass directly disproved one of that
  file's own assertions (`assert_response :redirect` for the anonymous case — see RFTC022-15/BUG-TCM-127),
  confirming this gap was real, not theoretical. Still worth running `bin/rails test` for real in an environment
  that CAN install the test group, to catch anything beyond this one discrepancy.

## Coverage Summary

**18 test cases, 18 executed, 17 PASS / 1 FAIL — retested 2026-11-03, now 18/18 PASS.** Covers all six `suite_diff` buckets individually with concrete
fixture shapes (RFTC022-2–7, all PASS), the environment-keyed-not-issue-keyed behavior the spec explicitly calls
out (RFTC022-8, PASS — confirmed the same issue produces two separate diff entries), a fully-traced (not guessed)
self-comparison behavior (RFTC022-9, PASS), three negative/edge-case paths (partial picker state ×2, empty-run
comparison — all PASS), the SEC-001 cross-project isolation holdout (RFTC022-12, PASS, independently re-verified
rather than trusted blind), the permission gate (RFTC022-14, PASS) and anonymous-redirect check (RFTC022-15,
originally **FAIL → BUG-TCM-127**, a plugin-wide gap also reproduced on rftc-035's Automation Dashboard —
retested 2026-11-03, CONFIRMED FIXED, now PASS), an XSS-escaping
check consistent with this plugin's BUG-TCM-070 history (RFTC022-16, PASS, confirmed via rendered `outerHTML` and
zero console messages), a sum-sanity cross-check on the summary tiles (RFTC022-17, PASS, backend tally matched
the live UI tiles exactly), and a multi-suite dedup check consistent with this plugin's BUG-TCM-097 history
(RFTC022-18, PASS). No ambiguities were left unresolved — the two edge cases that looked ambiguous at first
glance (self-comparison, environment-keying) were both fully traced through the actual `RollupMath` source and
then confirmed live to a deterministic, correctly-predicted result.

## Live Verification Pass — 2026-11-02 (localhost:3000, branch release/7.3.0, commit 329311d)

Strong live verification performed this session (most of the highest-risk scenarios executed):

- **PASS — picker-only state** renders cleanly ("Pick a base run and a compare run to see the difference"), no
  crash with neither run selected.
- **PASS — real two-run diff**: compared "Jenkins CI Build 1" vs "Jenkins CI Build 2" (project `rftc-016-ci-qa`) —
  at the time of this check, 0 New Failures, 0 Newly Fixed, 1 Still Failing (`#24 Apply valid discount code at
  checkout`), 4 Still Passing, 0 New Tests, 0 No Longer Run. Drill-down table correctly shows Test Case/
  Environment/Base run/Compare run columns with real data. Summary-tile sum sanity confirmed: 0+0+1+4+0+0 = 5
  cells, matching the fixture size at that time. **Note (added during the Full Live Execution pass below): these
  two runs (#8/#41) were later reused as fixtures by the RFTC-018 (Automation Sources) suite's own live
  execution, which wrote new results to issue #24 in run #8 — so this exact tally (1 Still Failing/4 Still
  Passing) is now stale and will not reproduce if re-run today. This is NOT a product defect — it is this QA
  session reusing a shared fixture run across two different test suites. The Full Live Execution pass below
  independently re-verified `suite_diff`'s correctness cell-by-cell against raw `IssueStatusResult` ground truth
  on dedicated, non-shared fixture runs, and it matched exactly (10/10 cells) — the engine itself was never in
  doubt, only this one example's numbers aged.**
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

## Full Live Execution — 2026-11-02 (localhost:3000, branch release/7.3.0, commit c9c8593)

All 18 cases fully executed this pass, closing every gap left by the earlier partial pass above. Methods used:

- **RFTC022-2 through RFTC022-8, RFTC022-17** (bucket-by-bucket + environment-keying + sum sanity): built a
  dedicated `RFTC-022 QA Fixtures` suite (8 purpose-built test cases, one per bucket plus an XSS case and a
  multi-suite case) and real `RFTC022-Base-Run`/`RFTC022-Compare-Run` runs via `CiRunBootstrapService`, with
  results written via real `CiResultIngestService` calls (`bin/rails runner`) — the same real service layer a
  CI pipeline uses, not hand-crafted DB rows. `RunIssue`/`IssueStatusResult` rows were surgically removed where a
  case needed to be genuinely absent from one side (New Test / No Longer Run), not just left Untested. Called
  `RollupMath.suite_diff` directly against the real runs: **every one of the 6 buckets classified its fixture
  correctly** (new_failure, newly_fixed, still_failing, still_passing, new_test, no_longer_run), the
  environment-keyed case (G) produced two separate entries as required (No Longer Run for the Chrome cell, New
  Test for the Firefox cell — not collapsed, not dropped), and the summary-tile sum (10, after the suite
  accumulated H's multi-suite fixture too) matched the true distinct `(issue, environment)` cell count exactly.
  Then independently re-confirmed live via Playwright on `/projects/rftc-016-ci-qa/run_comparisons?base_run_id=244&compare_run_id=245`:
  tiles read 1/1/1/1/4/2, matching the backend tally exactly.
- **RFTC022-5 (Still Passing collapsed by default)**: confirmed via `document.querySelectorAll('details')` —
  every non-empty bucket's `<details open>` is `true` except Still Passing, which is the only one with
  `open: false`. Exact match to the code trace.
- **RFTC022-9 (self-comparison)**: re-confirmed via direct `suite_diff(base_run, base_run, ...)` call — zero
  entries landed in new_failure/newly_fixed/new_test/no_longer_run, consistent with the earlier live UI
  self-comparison pass and the original code trace.
- **RFTC022-13 (empty run vs real run)**: a genuine zero-issue `RFTC022-Empty-Run` (bootstrapped with no suites)
  compared against the populated compare run — no crash, all 7 cells correctly landed in New Tests (empty run as
  base), zero in New Failures/Newly Fixed/Still Failing/Still Passing/No Longer Run.
- **RFTC022-10/11 (partial picker params)**: live Playwright navigation to the URL with only `base_run_id` then
  only `compare_run_id` set — both correctly show "Pick a base run and a compare run to see the difference" with
  no crash; the submitted run's own dropdown (`select[name="base_run_id"]`) correctly shows it pre-selected
  (confirmed via `element.value`/`selectedIndex`).
- **RFTC022-12 (SEC-001, already PASS from the earlier partial pass)**: not re-run this pass, result stands.
- **RFTC022-14 (permission gate)**: created a real minimal custom role (`RFTC022 ViewReportOnly`, permissions
  `[:view_issues, :view_report]` only) and a dedicated test user (`rftc022viewer`) as a genuine project member
  with that role — confirmed the page loads successfully (200) for them. Separately logged in as `qanonadmin`
  (existing Developer-role member, which lacks `:view_report` on this project) and confirmed a 403. Both checked
  via real login/logout cycles (clicking the actual "Sign out" button, not a bare `/logout` GET, which does NOT
  end the session — see Memory).
- **RFTC022-15 (anonymous redirect) — originally FAILED, bug filed (BUG-TCM-127)**: after a genuine sign-out, direct
  navigation to the page returned a bare **403 Forbidden**, not a redirect to `/login` as the case expected (and
  as the developer's own functional test explicitly asserts: `assert_response :redirect`). Root-caused to
  `RftcAccessControl#rftc_require_login!` always rendering `:forbidden` for an anonymous user instead of
  redirecting. Confirmed this is plugin-wide, not rftc-022-specific, by reproducing the identical 403 on
  `/projects/rftc-016-ci-qa/automation_dashboard` (rftc-035, same shared concern). Filed **BUG-TCM-127 (Low)** —
  **retested 2026-11-03 against commit `eefc0a4`, CONFIRMED FIXED** (anonymous access now redirects to `/login`
  correctly). Bug closed. **Now PASS.**
- **RFTC022-16 (XSS)**: the XSS-subject case (`<img src=x onerror=alert('rc-xss')>`) landed correctly in New
  Tests; confirmed zero console messages fired (`browser_console_messages` → 0 errors/warnings) and read the
  actual rendered `outerHTML` of its issue link directly — `&lt;img src=x onerror=alert('rc-xss')&gt;`, properly
  HTML-escaped, not a live tag.
- **RFTC022-18 (multi-suite dedup)**: a test case (H) added to two different suites of the SAME base run, with
  one real result recorded, compared against a different result in the compare run — appeared **exactly once**
  across all six buckets (landed in New Tests, since H had no result in base but one in compare after the
  sub-scenario's own result pattern), confirming `each_latest_result_cell`'s `.distinct` guard holds for this
  engine too (same class of check as BUG-TCM-097/RFTC021-5).

**Result: 17/18 PASS, 1 FAIL → BUG-TCM-127 (Low, plugin-wide anonymous-access 403-not-redirect gap) —
retested 2026-11-03, CONFIRMED FIXED, now 18/18 PASS.**

### Independent ground-truth data verification (requested follow-up, 2026-11-02)

Separately from classifying buckets correctly, two things were directly checked end-to-end against raw data
rather than trusted from the page alone:

1. **The run picker itself only ever lists this project's own runs.** Read the live `<select name="base_run_id">`
   DOM directly: exactly **140 options** (excluding the blank "Select a run"). Queried the database independently:
   `Run.where(project_id: rftc-016-ci-qa.id).count` = **140**, exact match. The `alpha-web` run used for the
   SEC-001 check (id 94, "CI Build 1423") does **not** appear anywhere in the dropdown — confirmed by searching
   the full option-text list for its name (not found). This is on top of RFTC022-12's URL-tampering check — the
   two checks cover different attack/error surfaces (what the UI *offers* vs. what a crafted URL can *force*).
2. **The diff numbers themselves were cross-checked cell-by-cell against raw `IssueStatusResult` rows**, not just
   re-read from the rendered page. For the dedicated `RFTC022-Base-Run`/`RFTC022-Compare-Run` fixtures: pulled
   every `(issue_id, environment)` pair's true latest result directly from the database (own independent "last
   result wins" reduction, not reusing any plugin code), by hand classified each pair into a bucket using the
   same rule `suite_diff` documents, and compared against `suite_diff`'s actual output. **All 10 countable cells
   matched exactly**, bucket-for-bucket, including the two-way split for the environment-keyed case (#6830
   Chrome → no_longer_run, #6830 Firefox → new_test) and the Untested/Untested noise row (#6830 under `test1`)
   correctly excluded from every bucket. This directly confirms the feature returns genuinely correct data, not
   just internally-consistent-looking data.
