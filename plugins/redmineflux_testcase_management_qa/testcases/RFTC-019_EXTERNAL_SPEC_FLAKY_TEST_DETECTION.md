> ⚠️ **EXTERNAL SOURCE — DO NOT MERGE WITH THIS PLUGIN'S OWN TC-TCM-xxx SUITES, AND SEPARATE FROM THE V1 CYCLE
> FILE** ⚠️
>
> These test cases verify **production feature #123569** ("rftc-019 — Flaky-test detection"), part of
> **Testcase Management plugin Release 7.3.0**. Out of `V1_7.1.0_EXTERNAL_RELEASE_CYCLE.md`'s scope.
>
> **ID prefix**: every case here is `RFTC019-<n>`.
>
> **Pre-release test DESIGN, not yet independently executed.** This feature's code lives on branch
> `release/7.3.0` (commit `329311d`) — **not yet merged to `master`**. The developer's own planning doc
> (`backlog/planning/rftc-019-feature-flaky-test-detection.md`) records a "Quality Gates: manually verified
> live via Playwright" pass by the developer themselves, but that is not independent QA execution. Every case
> below was authored from a direct read of `lib/.../reporting/rollup_math.rb` (`each_result_timeline_cell`,
> `flaky_tally`, `flaky_min_runs`), `app/controllers/quality_hq_controller.rb`, `app/views/quality_hq/_flaky.html.erb`,
> `app/views/settings/_testcase_configuration.html.erb`, `config/locales/en.yml`, and the shipped
> `test/unit/rollup_math_timeline_test.rb` / `test/functional/quality_hq_controller_test.rb` — not executed
> against a running instance this session. **Actual Result is "Not Executed" on every case** until an
> independent live pass is run.

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
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC019-2 (P1): A consistently always-Passed (or always-Failed) test case across many runs never appears, at any rank

**Priority:** P1 — `flip_count.positive?` is a hard filter, not a sort-to-bottom
**Steps:** Record Passed in 5 consecutive runs for one test case (0 flips by construction). Open Quality HQ.
**Expected Result:** This test case is **absent** from the Flaky Tests panel entirely — not present even at
the last rank with `flip_count = 0`.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC019-3 (SACRED, P1): `flaky_min_runs` threshold — exactly (min_runs − 1) executed entries excludes the case even with real flips present

**Priority:** P1 — the exact off-by-one boundary the spec calls out
**Steps:** With `flaky_min_runs` at its default (4), give a test case exactly 3 executed results with a real
flip inside them (e.g. Pass, Fail, Pass across 3 runs). Open Quality HQ.
**Expected Result:** The test case does **not** appear — 3 < 4, excluded regardless of the real flip it
contains.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC019-4 (SACRED, P1): Exactly `min_runs` executed entries, with a flip, is included

**Priority:** P1 — the other side of RFTC019-3's boundary
**Steps:** Same setup as RFTC019-3 but add one more run (4 total executed results, still containing at least
one flip). Open Quality HQ.
**Expected Result:** The test case now **appears**, ranked, with the correct `flip_count`/`executed_count`.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC019-5 (P1): An Untested run in the middle of a sequence does not break flip-counting — Pass → Untested → Fail still counts as a flip

**Priority:** P1 — confirms Untested is transparently removed, not treated as a sequence reset or a neutral
non-flip step
**Steps:** Set `flaky_min_runs` to 2. Create 3 runs; record Passed in run 1, leave the test case genuinely
Untested in run 2 (no result recorded at all), Failed in run 3. Open Quality HQ.
**Expected Result:** The `executed` sequence for this cell, after Untested is filtered out, is `[Pass, Fail]`
— a flip (`flip_count = 1`), with `executed_count = 2` (the Untested run does not count toward
`executed_count` either).
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC019-6 (P2): A Skipped result behaves identically to Untested — filtered out before flip-counting, not itself a flip

**Priority:** P2 — same exclusion class as RFTC019-5, different status
**Steps:** Same as RFTC019-5 but record the middle run's result as explicitly **Skipped** (not left untested).
**Expected Result:** Identical outcome to RFTC019-5 — `executed = [Pass, Fail]`, `flip_count = 1`.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

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
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

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
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC019-8 (SACRED/security, P1): Cross-project isolation — a flaky test case in one project never appears for a viewer without `:view_report` on that project

**Priority:** P1 — same SEC-001 boundary class as RFTC021-4/RFTC020's equivalents, now for the live-computed
flaky ranking; mirrors the shipped `test_flaky_respects_project_isolation` functional test exactly
**Steps:** Build a genuinely flaky test case (flips, qualifies past `min_runs`) inside Project B. Log in as a
user with `:view_report` on Project A only (not Project B). Open Quality HQ.
**Expected Result:** Project B's project name, the flaky issue's subject, and its row are **all absent** from
the response — not filtered client-side, never present in the HTML at all.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC019-9 (SACRED/security, P1): A private issue's flip history does not leak to a viewer without visibility into that issue, even within a project they can otherwise see

**Priority:** P1 — distinct boundary from RFTC019-8 (same-project private-issue visibility, not
cross-project), same class as RFTC021-7
**Steps:** Make a flaky, qualifying test case's issue `is_private: true` inside a project the viewer IS a
member of. Log in as a non-admin member with no private-issue visibility (e.g. a genuine Reporter-role user,
not a role with private-issue visibility by default). Open Quality HQ.
**Expected Result:** The private issue's subject/row never appears for this viewer, while any other
non-private flaky issue in the same project still does.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC019-10 (P2): Lowering `flaky_min_runs` includes previously-excluded cases; raising it excludes previously-included ones

**Priority:** P2 — confirms the setting genuinely drives the query, not just a display cap
**Steps:** With a test case that has exactly 3 executed results including a flip (excluded at the default
threshold of 4, per RFTC019-3): lower `flaky_min_runs` to 3 in plugin settings, reload Quality HQ — case now
appears. Then raise it back to 5, reload — case disappears again (3 < 5).
**Expected Result:** The ranking changes live with the setting, in both directions, with no caching lag (this
panel is explicitly documented as computed live per-request, never cached).
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

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
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC019-12 (P2, negative): Zero qualifying flaky test cases anywhere renders the correct empty state, not an error

**Priority:** P2
**Steps:** On a project (or across all permitted projects) with no test case meeting the flip+threshold
criteria, open Quality HQ.
**Expected Result:** The Flaky Tests panel shows the standard `text_qhq_metric_unavailable` empty-state
message — the same empty-state component the Most Failed / Slow Tests panels already use — not a blank
table, not an exception.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC019-13 (P3): Ranking is fully deterministic on a tie — `issue_id` ASC is the final tie-break, not an undefined order

**Priority:** P3 — correcting a plausible-but-wrong assumption that a flip-count tie might be ambiguous;
`flaky_tally`'s own `.sort_by { [-flip_count, -flakiness_rate, issue_id] }` is a complete, deterministic chain
**Steps:** Construct two test cases with identical `flip_count` and identical `flakiness_rate` (same
executed_count too, so the rate ties exactly), differing only in issue id. Open Quality HQ twice (reload).
**Expected Result:** The lower-`issue_id` case consistently ranks above the higher-`issue_id` one, on every
reload — no flapping order between page loads.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

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
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

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
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

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
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC019-17 (P3, boundary): With `flaky_min_runs` lowered to 1, a test case with only a single executed result never appears (needs ≥ 2 to register any flip)

**Priority:** P3 — confirms the threshold gate alone isn't sufficient to produce a spurious single-point
"flaky" result; `each_cons(2)` on a 1-element array yields no pairs regardless of the threshold
**Steps:** Set `flaky_min_runs` to 1. Give a test case exactly one executed result (Passed) in one run, in one
environment, with no other history anywhere. Open Quality HQ.
**Expected Result:** The test case does not appear in the Flaky panel — `executed.size == 1 >= 1` passes the
gate, but `flip_count` stays 0 (no consecutive pair exists), and the `.select { flip_count.positive? }` filter
excludes it regardless.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

## Not Executed

Every case above — this entire file is a pre-release test design, not an executed pass. In addition, the
following could not be reasoned about from a source read alone and need a live pass:

- Exact on-screen rendering/number formatting of `flakiness_rate` (e.g. whether `100.0%` or `100%` is shown
  for a round number) — `round(2)` in Ruby can return an integer-valued float; the view's literal
  `<%= row[:flakiness_rate] %>%` interpolation behavior for that case should be visually confirmed.
- Interaction with the `QHQ_INLINE_FALLBACK_CAP` (10) / `QHQ_RANKED_LIST_LIMIT` (10) caps on an instance with
  more than 10 permitted projects or more than 10 qualifying flaky cases in one project — not practical to
  construct from a source read alone, needs a live instance with that much fixture data.
- The plugin's own shipped `test/unit/rollup_math_timeline_test.rb` and the two new functional tests have
  **not been run by the actual Minitest runner** in this branch's build container (per the developer's own
  "Known gap" note in the sibling rftc-029 doc, which applies to all five of this commit's features) — an
  independent CI/test run of that suite is still owed before merge, separate from this manual test design.

## Coverage Summary

**17 scenarios designed (0 executed)** — positive core behavior (flip detection, threshold boundaries,
Untested/Skipped transparency, multi-environment aggregation), both SACRED security boundaries (cross-project
isolation, same-project private-issue visibility), a mandatory XSS check given this plugin's confirmed history
on an adjacent ranked table, a sibling-panel regression guard called for by the developer's own planning-doc
note, and a negative/boundary cluster (min-runs off-by-one in both directions, server-side setting validation,
empty state, deterministic tie-break, single-data-point non-flakiness). No PASS/FAIL recorded — this is a
design-only file, authored from `lib/.../reporting/rollup_math.rb`, `quality_hq_controller.rb`, the shipped
views/locale strings, and the shipped (not-yet-CI-run) unit/functional tests on branch `release/7.3.0`
(commit `329311d`). An independent live execution pass (once this branch is merged/deployed to the QA
environment) is required before any of these can be marked Pass/Fail, and before this feature can be
considered genuinely QA-verified rather than developer-self-verified.
