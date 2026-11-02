> ⚠️ **EXTERNAL SOURCE — DO NOT MERGE WITH THIS PLUGIN'S OWN TC-TCM-xxx SUITES, AND SEPARATE FROM THE V1 CYCLE
> FILE** ⚠️
>
> These test cases verify **production feature #123569** ("rftc-019 — Flaky-test detection"), part of
> **Testcase Management plugin Release 7.3.0**. Out of `V1_7.1.0_EXTERNAL_RELEASE_CYCLE.md`'s scope.
>
> **ID prefix**: every case here is `RFTC019-<n>`.
>
> **FULLY EXECUTED 2026-11-02 — 18/18 PASS, zero bugs found.** The branch (`release/7.3.0`, commit `329311d`)
> was checked out into the local Docker instance (`localhost:3000`), migrations run, app restarted. All 18
> scenarios were independently executed this session: RFTC019-1 through 7b, 11, 13, 16, 17 via real fixture
> data (genuine `Run`/`IssueStatusResult` rows created through `CiRunBootstrapService`/`CiResultIngestService`,
> the same real code path a CI pipeline uses) and a direct call to the real
> `RedminefluxTestcaseManagement::Reporting::RollupMath.flaky_tally` against that data via `bin/rails runner`;
> RFTC019-8/9 (SACRED SEC-001) and RFTC019-10/12/14/15 via live Playwright sessions as both `admin` and a
> genuine `Reporter`-role non-admin user on the real `/quality_hq` page. This is independent QA execution, not
> the developer's own "Quality Gates" self-check recorded in
> `backlog/planning/rftc-019-feature-flaky-test-detection.md`.

# Test Cases — Redmineflux Testcase Management — rftc-019: Flaky-Test Detection

## Plugin
- Name: Redmineflux Testcase Management
- Version: branch `release/7.3.0`, commit `329311d` ("Add four roadmap features: automation sources,
  flaky-test detection, run comparisons, and exploratory sessions") — **not yet on `master`**
- Redmine version: 6.x (Docker `localhost:3000`, Postgres) — same environment as the rest of this release's
  RFTC files, once this branch is deployed there
- Production ticket: #123569 (ztflux), done ratio 90%, status "In QA", Target Version "Testcase Management
  plugin Release 7.3.0 [04-11-2026]"

## Feature summary

Every other cross-run metric in this plugin (`most_failed_tally`, `slow_test_tally`) collapses straight to a
tally and throws away the actual sequence of results across runs. Flaky detection needs that sequence, so
rftc-019 adds one new shared primitive, `RollupMath.each_result_timeline_cell(runs, project:, user:)`: for
every `(issue_id, environment)` cell, it preserves the full list of each run's latest result, **in the order
`runs` was given** (the caller, `QualityHqController#flaky_rows`, explicitly passes
`Run.where(project_id: project.id).order(:created_at, :id)` — chronological by creation, not by run name or
due date, since `flaky_tally` is sequence-sensitive unlike its siblings).

`RollupMath.flaky_tally` then, per `(issue_id, environment)` timeline:
1. Filters out `Untested` and `Skipped` entries entirely — the remaining `executed` list has these gaps
   closed up, i.e. a real `Pass → Untested → Fail` sequence becomes a 2-element `[Pass, Fail]` executed
   sequence (an untested run does not "reset" anything; it is transparently removed before flip-counting).
2. Requires `executed.size >= flaky_min_runs` (Setting `flaky_min_runs`, default 4, same blank/garbage/
   negative→4 fallback pattern as `slow_test_threshold_ms`) — a cell below this is **excluded from the
   output entirely**, not shown with a flip count of 0.
3. Counts a "flip" for every consecutive pair in `executed` whose `is_failure?` differs
   (`executed.each_cons(2)`) — a flip is only ever between two **different runs'** latest results for the
   same cell, never between two attempts inside one run (there is only one "latest" per run per cell to
   begin with).
4. **Aggregates by `issue_id` only, not by `(issue_id, environment)`** — if the same issue qualifies in two
   different environments, both environments' `flip_count`/`executed_count` are **summed into one combined
   per-issue row** (each environment's own flip sequence is still counted independently before the sum, but
   the threshold gate and the final ranked row are per-issue, matching `most_failed_tally`'s existing
   per-issue shape, not a new per-cell shape).
5. Only cases with `flip_count > 0` are kept in the final ranked output (`.select { flip_count.positive? }`)
   — an always-pass or always-fail case with 0 flips never appears, at any rank.
6. Ranked `flip_count` DESC, `flakiness_rate` DESC (`flip_count / (executed_count - 1) * 100`), **`issue_id`
   ASC as a full, deterministic tie-break** — there is no undefined ordering case.

`QualityHqController#flaky_rows` applies the exact same per-project `:view_report` scoping and
first-10-projects-alphabetically cap as `most_failed_rows`/`slow_tests_rows`, and `each_result_timeline_cell`
itself reuses `each_latest_result_cell`'s SEC-001 scoping (`run.project_id == project.id`,
`Issue.visible(user)`). The ranked table (`_flaky.html.erb`) renders the subject via `link_to "##{issue_id}
#{subject}", issue_path(...)` — Rails auto-escapes this by default, the same escaping class already fixed
for the Most Failed Tests table (BUG-TCM-070 was specifically the **chart**, not the table).

A new Setting, `flaky_min_runs` (Administration → Plugin settings → this plugin's Configuration tab), has a
`min: 2` **client-side only** HTML attribute — the server-side reader (`RollupMath.flaky_min_runs`) accepts
any positive integer and only falls back to 4 on blank, non-numeric, or non-positive input.

---

### RFTC019-1 (P1): A test case with a genuine Pass → Fail → Pass sequence across 3 runs is ranked with flip_count = 2

**Priority:** P1 — the core feature
**Steps:** Set `flaky_min_runs` to 2 (or use 3+ runs with the default 4). Create 3 runs in chronological order
for one project; for one test case, record Passed in run 1, Failed in run 2, Passed in run 3 (same
environment). Open Quality HQ.
**Expected Result:** The test case appears in the Flaky Tests panel with `flip_count = 2`, `executed_count =
3`, `flakiness_rate = (2 / (3-1)) * 100 = 100.0%`.
**Actual Result:** ✅ **PASS** (2026-11-02, real fixture via `CiRunBootstrapService`/`CiResultIngestService`,
3 real runs, `flaky_tally(..., min_runs: 2)`). Result: `flip_count=2, executed_count=3, flakiness_rate=100.0`
— exact match.

---

### RFTC019-2 (P1): A consistently always-Passed (or always-Failed) test case across many runs never appears, at any rank

**Priority:** P1 — `flip_count.positive?` is a hard filter, not a sort-to-bottom
**Steps:** Record Passed in 5 consecutive runs for one test case (0 flips by construction). Open Quality HQ.
**Expected Result:** This test case is **absent** from the Flaky Tests panel entirely — not present even at
the last rank with `flip_count = 0`.
**Actual Result:** ✅ **PASS** (2026-11-02, real fixture, 5 real runs all Passed, `flaky_tally(..., min_runs:
2)`). The case was genuinely absent from the result set — hard filter confirmed, not a sort-to-bottom.

---

### RFTC019-3 (SACRED, P1): `flaky_min_runs` threshold — exactly (min_runs − 1) executed entries excludes the case even with real flips present

**Priority:** P1 — the exact off-by-one boundary the spec calls out
**Steps:** With `flaky_min_runs` at its default (4), give a test case exactly 3 executed results with a real
flip inside them (e.g. Pass, Fail, Pass across 3 runs). Open Quality HQ.
**Expected Result:** The test case does **not** appear — 3 < 4, excluded regardless of the real flip it
contains.
**Actual Result:** ✅ **PASS** (2026-11-02, real fixture, 3 real runs Pass/Fail/Pass, `flaky_tally(...,
min_runs: 4)`). Absent — 3 < 4 correctly excluded despite containing 2 real flips.

---

### RFTC019-4 (SACRED, P1): Exactly `min_runs` executed entries, with a flip, is included

**Priority:** P1 — the other side of RFTC019-3's boundary
**Steps:** Same setup as RFTC019-3 but add one more run (4 total executed results, still containing at least
one flip). Open Quality HQ.
**Expected Result:** The test case now **appears**, ranked, with the correct `flip_count`/`executed_count`.
**Actual Result:** ✅ **PASS** (2026-11-02, same fixture + 1 more run, `flaky_tally(..., min_runs: 4)`).
Appeared with `executed_count=4, flip_count=3` (Pass,Fail,Pass,Fail — 3 real transitions).

---

### RFTC019-5 (P1): An Untested run in the middle of a sequence does not break flip-counting — Pass → Untested → Fail still counts as a flip

**Priority:** P1 — confirms Untested is transparently removed, not treated as a sequence reset or a neutral
non-flip step
**Steps:** Set `flaky_min_runs` to 2. Create 3 runs; record Passed in run 1, leave the test case genuinely
Untested in run 2 (no result recorded at all), Failed in run 3. Open Quality HQ.
**Expected Result:** The `executed` sequence for this cell, after Untested is filtered out, is `[Pass, Fail]`
— a flip (`flip_count = 1`), with `executed_count = 2` (the Untested run does not count toward
`executed_count` either).
**Actual Result:** ✅ **PASS** (2026-11-02, real fixture: run 2 genuinely left seeded-Untested, no ingest
call made for it). Result: `flip_count=1, executed_count=2` — Untested run transparently removed, not a
reset, not counted.

---

### RFTC019-6 (P2): A Skipped result behaves identically to Untested — filtered out before flip-counting, not itself a flip

**Priority:** P2 — same exclusion class as RFTC019-5, different status
**Steps:** Same as RFTC019-5 but record the middle run's result as explicitly **Skipped** (not left untested).
**Expected Result:** Identical outcome to RFTC019-5 — `executed = [Pass, Fail]`, `flip_count = 1`.
**Actual Result:** ✅ **PASS** (2026-11-02, real fixture, run 2 explicitly ingested as `status: 'skipped'`).
Identical result to RFTC019-5: `flip_count=1, executed_count=2`.

---

### RFTC019-7 (P1, notable real behavior — not "independent per environment" as the ticket's casual wording might suggest): Two environments of the SAME issue are aggregated into one combined per-issue row, not kept as two separate rows

**Priority:** P1 — directly contradicts a plausible but wrong assumption ("flakiness is tracked per
environment"); confirmed from `flaky_tally`'s source: `per_issue` is keyed by `issue_id` alone, and each
qualifying environment's own `executed`/`flip_count` are summed into that one record
**Steps:** With `flaky_min_runs` = 2: for one issue, environment "Chrome" gets Pass→Fail (1 flip, 2 executed,
qualifies); environment "Firefox" (same issue) gets Pass→Fail→Pass (2 flips, 3 executed, qualifies). Open
Quality HQ.
**Expected Result:** The Flaky Tests panel shows **one row** for this issue with `flip_count = 3` (1 + 2
summed across both environments) and `executed_count = 5` (2 + 3 summed) — not two separate rows, and not
just one environment's numbers.
**Actual Result:** ✅ **PASS** (2026-11-02, real fixture: same issue, Chrome Pass→Fail + Firefox
Pass→Fail→Pass, 5 real runs). Exactly ONE row returned: `flip_count=3, executed_count=5` — both
environments genuinely summed into one per-issue record, confirmed via `tally.count { subject == ... } == 1`.

---

### RFTC019-7b (P2, companion to RFTC019-7): An environment that individually falls below `min_runs` contributes nothing, even if the issue's OTHER environment qualifies

**Priority:** P2 — confirms the threshold gate is applied per-`(issue, environment)` cell, before the
per-issue summing in RFTC019-7, not against the combined total
**Steps:** With `flaky_min_runs` = 4: environment "Chrome" gets 4 executed results with a flip (qualifies on
its own); environment "Firefox" (same issue) gets only 2 executed results, also with a flip (does not
individually qualify). Open Quality HQ.
**Expected Result:** The issue appears with `flip_count`/`executed_count` reflecting **only** the Chrome
environment's numbers — Firefox's 2 executed results and its flip are not summed in, since Firefox's own
cell never cleared the 4-run gate.
**Actual Result:** ✅ **PASS** (2026-11-02, real fixture: Chrome 4 executed Pass/Fail/Pass/Fail, Firefox only
2 executed Pass/Fail, `min_runs: 4`). Result: `flip_count=3, executed_count=4` — exactly Chrome's own
numbers; Firefox's cell never cleared the per-environment gate so contributed nothing to the sum.

---

### RFTC019-8 (SACRED/security, P1): Cross-project isolation — a flaky test case in one project never appears for a viewer without `:view_report` on that project

**Priority:** P1 — same SEC-001 boundary class as RFTC021-4/RFTC020's equivalents, now for the live-computed
flaky ranking; mirrors the shipped `test_flaky_respects_project_isolation` functional test exactly
**Steps:** Build a genuinely flaky test case (flips, qualifies past `min_runs`) inside Project B. Log in as a
user with `:view_report` on Project A only (not Project B). Open Quality HQ.
**Expected Result:** Project B's project name, the flaky issue's subject, and its row are **all absent** from
the response — not filtered client-side, never present in the HTML at all.
**Actual Result:** ✅ **PASS** (2026-11-02, live Playwright). Built a genuine qualifying flaky case
(`QA-RFTC019-CrossProject`, 2 real runs) in `alpha-web`. Logged in as `qa.limited` (has `:view_report` on
`rftc-016-ci-qa` only, confirmed `false` on `alpha-web`). Reloaded `/quality_hq`: "Projects Tracked" dropped
from 7 to 2, "Alpha Web Platform" absent from every panel and the project table entirely — not filtered
client-side, genuinely never scanned since it's excluded from `permitted_projects` before `flaky_rows` ever
runs.

---

### RFTC019-9 (SACRED/security, P1): A private issue's flip history does not leak to a viewer without visibility into that issue, even within a project they can otherwise see

**Priority:** P1 — distinct boundary from RFTC019-8 (same-project private-issue visibility, not
cross-project), same class as RFTC021-7
**Steps:** Make a flaky, qualifying test case's issue `is_private: true` inside a project the viewer IS a
member of. Log in as a non-admin member with no private-issue visibility (e.g. a genuine Reporter-role user,
not a role with private-issue visibility by default). Open Quality HQ.
**Expected Result:** The private issue's subject/row never appears for this viewer, while any other
non-private flaky issue in the same project still does.
**Actual Result:** ✅ **PASS** (2026-11-02, live Playwright). Built a genuine qualifying flaky case
(`QA-RFTC019-Private`, `is_private: true`, 2 real runs) in `rftc-016-ci-qa`. Added the plugin's own seed user
`reporter` to this project with a genuine **Reporter** role (not Manager, which has private-issue visibility
by default) and confirmed `view_report: true`. Logged in as `reporter`, reloaded `/quality_hq`:
`QA-RFTC019-Private` never appeared in the Flaky Tests table, while every other non-private flaky fixture
from the same project (F1, F3, F7, F7b, F16, the XSS case) all correctly appeared for this same viewer —
proving the boundary is specifically private-issue visibility, not a blanket project-level block.

---

### RFTC019-10 (P2): Lowering `flaky_min_runs` includes previously-excluded cases; raising it excludes previously-included ones

**Priority:** P2 — confirms the setting genuinely drives the query, not just a display cap
**Steps:** With a test case that has exactly 3 executed results including a flip (excluded at the default
threshold of 4, per RFTC019-3): lower `flaky_min_runs` to 3 in plugin settings, reload Quality HQ — case now
appears. Then raise it back to 5, reload — case disappears again (3 < 5).
**Expected Result:** The ranking changes live with the setting, in both directions, with no caching lag (this
panel is explicitly documented as computed live per-request, never cached).
**Actual Result:** ✅ **PASS** (2026-11-02, live Playwright via the real Admin → Plugin Settings UI). With
`flaky_min_runs=2`, all this session's low-`executed_count` fixtures ranked. Changed the real setting field
to `7` and reloaded `/quality_hq` immediately: every fixture below 7 executed results vanished instantly,
replaced by other real historical cases with ≥7 executions (e.g. `#24 Apply valid discount code`, 10
executed) — genuine live recomputation, zero caching lag, confirmed with no server restart between the
setting change and the reload.

---

### RFTC019-11 (P3, negative): The settings field's `min: 2` HTML attribute is client-side only — the server still accepts 1, and falls back to 4 on 0/negative/garbage

**Priority:** P3 — the boundary the UI tries to prevent but the backend doesn't itself enforce the same way
**Steps:** Bypass the number-input's spinner restriction (direct form POST or `browser_evaluate` to set the
field's value) and save `flaky_min_runs = 1`; confirm via a fixture needing only 1 executed result. Then save
`flaky_min_runs = 0`, then `-5`, then `abc`.
**Expected Result:** `1` is honestly accepted and used (a single-execution cell can qualify, though it can
never show a flip since `each_cons(2)` needs ≥2 entries — see RFTC019-17). `0`, `-5`, and `abc` all silently
fall back to the default of 4 (`value.positive? ? value : 4`, with the non-numeric guard first) — no error,
no crash, just the documented fallback.
**Actual Result:** ✅ **PASS** (2026-11-02, `bin/rails runner`, bypassing the UI's `min="2"` client-side
attribute by writing the Setting hash directly). `'1'` → `flaky_min_runs == 1`; `'0'` → `4`; `'-5'` → `4`;
`'abc'` → `4`. All 4 cases matched exactly, no error, no crash on any input.

---

### RFTC019-12 (P2, negative): Zero qualifying flaky test cases anywhere renders the correct empty state, not an error

**Priority:** P2
**Steps:** On a project (or across all permitted projects) with no test case meeting the flip+threshold
criteria, open Quality HQ.
**Expected Result:** The Flaky Tests panel shows the standard `text_qhq_metric_unavailable` empty-state
message — the same empty-state component the Most Failed / Slow Tests panels already use — not a blank
table, not an exception.
**Actual Result:** ✅ **PASS** (2026-11-02, live Playwright). Set `flaky_min_runs` to `1000` via the real
Admin UI (high enough that zero cases anywhere qualify) and reloaded `/quality_hq`: the Flaky Tests panel
showed exactly **"This metric isn't available yet."** — the identical empty-state message the feature
showed before rftc-019 existed — no blank table, no exception, no stack trace.

---

### RFTC019-13 (P3): Ranking is fully deterministic on a tie — `issue_id` ASC is the final tie-break, not an undefined order

**Priority:** P3 — correcting a plausible-but-wrong assumption that a flip-count tie might be ambiguous;
`flaky_tally`'s own `.sort_by { [-flip_count, -flakiness_rate, issue_id] }` is a complete, deterministic chain
**Steps:** Construct two test cases with identical `flip_count` and identical `flakiness_rate` (same
executed_count too, so the rate ties exactly), differing only in issue id. Open Quality HQ twice (reload).
**Expected Result:** The lower-`issue_id` case consistently ranks above the higher-`issue_id` one, on every
reload — no flapping order between page loads.
**Actual Result:** ✅ **PASS** (2026-11-02, real fixture: 2 issues, each Pass→Fail across 2 real runs,
identical `flip_count=1`/`executed_count=2`/`flakiness_rate=100.0`). The issue created first (lower
`issue_id`) consistently ranked first — `tally.index` confirmed the order matched `issue_id` ASC exactly.

---

### RFTC019-14 (P1, security): An XSS-shaped test case subject renders as inert escaped text in the Flaky ranking table

**Priority:** P1 — this plugin has a real, confirmed history of a ranking-table/chart XSS (BUG-TCM-070 on the
sibling Most Failed Tests report), so this is mandatory, not optional, for any new ranked table that renders
a subject
**Steps:** Create a qualifying flaky test case whose subject is `<img src=x onerror=alert('flaky-xss')>`.
Open Quality HQ with a dialog/alert listener attached.
**Expected Result:** No `alert()` fires. The raw HTTP response shows the payload HTML-escaped
(`&lt;img src=x onerror=...`) inside the `link_to` anchor text, not as a live tag — `link_to`'s default
auto-escaping should hold, matching the already-fixed table-side escaping class for Most Failed Tests.
**Actual Result:** ✅ **PASS** (2026-11-02, real fixture + live Playwright with a console-message listener).
Created `<img src=x onerror=alert('flaky-xss')>` as a real qualifying flaky case (5 flips, 6 executed, ranked
#1). Loaded `/quality_hq`: zero console messages/errors, the accessibility tree showed the literal text
`"#6815 <img src=x onerror=alert('flaky-xss')>"` as the link's name (proof it rendered as inert escaped text,
not a live `<img>` element, which would show as an image role) — confirmed again visually in a screenshot,
rendered as plain text in both the Flaky Tests and Most Failed Tests tables. No `alert()` fired.

---

### RFTC019-15 (P2, regression guard): Most Failed Tests and Slow Tests panels still render correctly on the same Quality HQ page alongside the new Flaky panel

**Priority:** P2 — the dev's own planning doc flags that `scanned_projects`'s computation had to be
reordered earlier in `#index` to make it available to `flaky_rows`, and explicitly calls this "a genuine
ordering bug caught and fixed during this build, before any commit" — worth independently re-confirming
there's no sibling regression left behind
**Steps:** On a project/account with real Most Failed Tests and Slow Tests data already present, open Quality
HQ after this feature is deployed.
**Expected Result:** Both pre-existing panels still render their real ranked data exactly as before, with 0
console errors — the `scanned_projects` reordering did not silently drop or duplicate project scanning for
either sibling metric.
**Actual Result:** ✅ **PASS** (2026-11-02, live Playwright, every `/quality_hq` load this session). Most
Failed Tests and Slow Tests both rendered full real ranked data (10 rows each) on every single reload
throughout this entire test pass, alongside the new Flaky Tests panel, with 0 console errors recorded at any
point — no sibling regression from the `scanned_projects` reordering.

---

### RFTC019-16 (P3): The flip sequence follows run **creation order** (`created_at`, `id`), not the run's display name or due date

**Priority:** P3 — `flaky_tally` is explicitly sequence-sensitive, and `flaky_rows` feeds it
`Run.order(:created_at, :id)`; a run named to visually suggest it came "first" but created later must not
reorder the sequence
**Steps:** Create Run B first (chronologically), then Run A second, but name them so "Run A" sorts earlier
alphabetically/by a human skimming the list (e.g. "Run A — Build 1" created second, "Run B — Build 2" created
first). Record Passed in the chronologically-first run (named "Run B"), Failed in the chronologically-second
run (named "Run A"), for the same test case.
**Expected Result:** The flip sequence is `[Pass (Run B, created first), Fail (Run A, created second)]` — by
actual `created_at` order, not by the misleading name order.
**Actual Result:** ✅ **PASS** (2026-11-02, real fixture, 3 runs with names deliberately scrambled relative to
creation order: created `QA19-F16-RunB`[Pass] → `QA19-F16-RunA`[Fail] → `QA19-F16-RunC`[Fail]). Queried via
`Run.order(:created_at, :id)` exactly as `flaky_rows` does: `flip_count=1`, matching the real chronological
sequence `[Pass,Fail,Fail]` — NOT the alphabetical-by-name sequence `[Fail,Pass,Fail]` (RunA,RunB,RunC)
which would have produced `flip_count=2`. The two orderings were deliberately designed to diverge (a simple
reversal can't distinguish them, since reversing never changes a flip count), so this result is conclusive.

---

### RFTC019-17 (P3, boundary): With `flaky_min_runs` lowered to 1, a test case with only a single executed result never appears (needs ≥ 2 to register any flip)

**Priority:** P3 — confirms the threshold gate alone isn't sufficient to produce a spurious single-point
"flaky" result; `each_cons(2)` on a 1-element array yields no pairs regardless of the threshold
**Steps:** Set `flaky_min_runs` to 1. Give a test case exactly one executed result (Passed) in one run, in one
environment, with no other history anywhere. Open Quality HQ.
**Expected Result:** The test case does not appear in the Flaky panel — `executed.size == 1 >= 1` passes the
gate, but `flip_count` stays 0 (no consecutive pair exists), and the `.select { flip_count.positive? }` filter
excludes it regardless.
**Actual Result:** ✅ **PASS** (2026-11-02, real fixture, exactly 1 real run/result, `flaky_tally(...,
min_runs: 1)`). Absent from the result set — the threshold gate alone was not sufficient to produce a
spurious single-point "flaky" result, exactly as predicted.

---

## Not Executed

Nothing — all 18 scenarios were independently executed 2026-11-02 (see each case's own Actual Result above).
One formatting question from the original design is now resolved by observation: `flakiness_rate` always
rendered with one decimal place (`100.0%`, `75.0%`, `80.0%`), never a bare integer `100%`, across every
fixture observed this session. The `QHQ_INLINE_FALLBACK_CAP`/`QHQ_RANKED_LIST_LIMIT` (10) interaction was
also incidentally observed: this session's own fixtures regularly pushed the Flaky Tests table to its full
10-row cap, requiring a couple of fixtures (the XSS case) to be deliberately boosted to a higher flip count
to climb back into the visible top 10 — confirming the cap is real and genuinely limits the ranked list to 10
rows, consistent with the documented behavior. The plugin's own shipped Minitest suite still has not been run
by an actual test runner in this branch's container (a pre-existing environment gap noted across all five
7.3.0 features, not specific to this one) — that remains owed separately from this independent manual pass.

## Coverage Summary

**18/18 scenarios executed — 18 PASS, zero bugs found.** All core behavior confirmed correct: flip detection
against known fixtures, both threshold boundaries (3 < 4 excluded, 4 ≥ 4 included), Untested and Skipped both
transparently removed before flip-counting, multi-environment aggregation into one per-issue row (with
correct per-environment gating before the sum), both SACRED security boundaries (cross-project isolation via
`permitted_projects`, same-project private-issue visibility), the mandatory XSS check (safe, matching the
already-fixed table-escaping class), the sibling-panel regression guard (Most Failed/Slow Tests unaffected),
and the full negative/boundary cluster (settings fallback on blank/zero/negative/garbage input, the correct
empty state, a conclusively deterministic tie-break, and single-data-point non-flakiness). This is a
materially stronger result than the sibling RFTC-018 suite (17/18, 1 confirmed bug) — rftc-019 shipped with
no defects found across a thorough independent pass.

## Live Verification Pass — 2026-11-02 (localhost:3000, branch release/7.3.0, commit 329311d)

Full execution pass, superseding the earlier partial pass recorded in this section. Environment: branch
`release/7.3.0`, migrations run, app restarted (see RFTC-018's own Live Verification Pass section for the
shared environment-setup detail). Methods used:

- **RFTC019-1 through 7b, 11, 13, 16, 17** (13 scenarios): real fixture data created via
  `CiRunBootstrapService`/`CiResultIngestService` (the same real code path a CI pipeline uses) against a
  dedicated `RFTC-019 QA Fixtures` test suite in project `rftc-016-ci-qa`, then
  `RedminefluxTestcaseManagement::Reporting::RollupMath.flaky_tally` called directly via `bin/rails runner`
  with explicit `min_runs:` overrides per scenario (bypassing the global Setting for precision, except for
  RFTC019-11 itself which specifically tests the Setting-reading layer).
- **RFTC019-8/9** (SACRED SEC-001): live Playwright sessions. RFTC019-8 built a qualifying flaky fixture in a
  genuinely different project (`alpha-web`) and logged in as `qa.limited` (no `:view_report` there) —
  confirmed the whole project vanished from Quality HQ, not just its flaky row. RFTC019-9 built a private,
  qualifying flaky fixture in the SAME project and logged in as a genuine `Reporter`-role seed user
  (`reporter`, newly added as a project member for this check) — confirmed the private issue alone was
  hidden while every sibling non-private fixture stayed visible.
- **RFTC019-10/12** (settings live-adjustment, empty state): live Playwright via the real Admin → Plugin
  Settings UI, changing `flaky_min_runs` to `7` then `1000` and reloading `/quality_hq` each time, confirming
  immediate recomputation and the correct empty-state message respectively. Restored to `4` (the documented
  default) afterward.
- **RFTC019-14** (XSS): a real qualifying flaky fixture with an `<img onerror=...>` subject, confirmed
  rendering as inert text via both a console-message listener (zero messages) and the accessibility tree
  (literal escaped text, not a live `img` element), then independently re-confirmed visually in a screenshot.
- **RFTC019-15** (regression guard): observed directly on every `/quality_hq` reload throughout this pass —
  Most Failed Tests and Slow Tests both rendered full real data alongside Flaky Tests every time, 0 console
  errors.

Full detail recorded inline against each case above. Summary: **18 PASS, 0 FAIL** — no bugs found in rftc-019.

## Addendum — Purely manual, zero-CI/zero-API proof that flip detection is source-agnostic (2026-11-02)

User explicitly asked to verify (in Hindi): "flaky ka data CI/CD pe depend karta hai na?" — i.e., confirm flaky
detection does not require CI/CD or API involvement, using real UI clicks only (no `CiRunBootstrapService`,
no `CiResultIngestService`, no `bin/rails runner` fixture creation this time).

**Method — entirely through the browser, zero backend shortcuts:**
1. Created Run #242 "MANUAL-NoCI-Demo-Run1" via the real "Add Run" UI modal (environment `test1`, suite
   "RFTC-019 QA Fixtures", 14 cases).
2. Recorded **Passed** for issue #6789 (QA-RFTC019-F1) via the genuine "Add Result" AJAX popup (clicked the
   "Untested" link on the Run page — not a direct URL to `/issue_status_results/new`, which loads as a broken
   standalone page where the dynamic Defects field never reveals).
3. Created Run #243 "MANUAL-NoCI-Demo-Run2" the same way.
4. Recorded **Failed** for the same issue #6789 in Run #243 via the same proper Add Result popup. Selecting
   "Failed" correctly revealed "Report Defect" + a "Defects*" field; clicked "Report Defect", filled the Add
   Defect modal's Subject, clicked Create — new defect #6823 was created and auto-populated into the parent
   popup's Defects* field — then Submit finalized the Failed result.

**Verification — read directly from the live server, not just the UI:**
```ruby
proj = Project.find_by(identifier: 'rftc-016-ci-qa')
runs = Run.where(project_id: proj.id)
timelines = RedminefluxTestcaseManagement::Reporting::RollupMath.each_result_timeline_cell(runs, project: proj, user: User.find(1))
timelines[[6789, 'test1']]
# => [{run: 242, status: "Passed", is_failure: false}, {run: 243, status: "Failed", is_failure: true}]
```
This is the exact same `RollupMath` timeline engine that processes CI-ingested rows — it picked up both
manually-created rows identically, registering one genuine Pass→Fail flip.

**Why it doesn't appear on Quality HQ's "Flaky Tests" top-10 panel:** `flaky_min_runs` (plugin setting,
`Setting.plugin_redmineflux_testcase_management['flaky_min_runs']`, default **4** — see RFTC019-10/12 above)
requires at least 4 executed results per issue+environment before an issue is ranked as flaky at all. Our 2
manual results are below that threshold, so the panel correctly withholds judgment per the code's own
documented intent ("too little history is not evidence either way") — this is expected behavior, not a bug,
and is consistent with RFTC019-1's original design-only case.

**Conclusion:** Flaky-test detection reads `IssueStatusResult` rows from the database regardless of how they
were created — manual UI click, CI ingest, or direct API call. The only gate is the row-count threshold
(`flaky_min_runs`), which applies identically no matter the source. No CI/CD or API call was made anywhere in
this addendum's verification.
