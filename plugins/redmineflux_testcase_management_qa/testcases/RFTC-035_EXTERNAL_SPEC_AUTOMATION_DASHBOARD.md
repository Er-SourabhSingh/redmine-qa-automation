> **CROSS-DB (MariaDB) — 2026-11-20:** happy-flow pass, `redmine6-happyflow-mariadb` (`localhost:3023`), project
> `happyflow-mariadb`/1. All 7 happy-flow RFTC035 TCs confirmed PASS, closing this suite on all 4 DB-engine
> legs. (Earlier same-day attempt had been blocked: the browser session had logged out, and this container's
> plugin checkout was still pre-BUG-TCM-155-fix at the time. The coordinator restored a working admin login and
> separately pulled/restarted this container onto commit `97576f0`, which includes BUG-TCM-155's fix — both
> confirmed directly before re-running this suite.)
> - **RFTC035-1**: ingested real CI results resolving to two distinct AutomationSources via
>   `ingest_results.json` (SourceAlpha id=2: issue 19 Passed + issue 22 Failed+auto_defect; SourceBeta id=3:
>   issue 20 Passed) — confirmed the fix is live (`source_id` resolved correctly this time, not NULL). Live
>   dashboard page showed 4 Sources / 61 Executions / 19.67% Pass Rate, with SourceAlpha (2/2/0.0%), SourceGamma
>   (1/0/100.0%, from an earlier probe ingest), SourceBeta (1/0/100.0%) and Ungrouped (57/4/17.54%) each as
>   independent, non-bleeding rows — exact match against a direct MariaDB read mirroring
>   `RollupMath.automation_sources_overview`'s own latest-per-cell query.
> - **RFTC035-2**: the same live page's "Ungrouped" row (57 executions, 4 failures, 17.54%) correctly aggregates
>   every pre-existing manually-recorded (`source_id IS NULL`) result, not merged into any named source.
> - **RFTC035-3 (SACRED)**: retested the exact same `(run=12, issue=19, environment=CI)` cell under SourceAlpha
>   (Passed, then a later Failed+auto_defect) — `total_cells` for SourceAlpha stayed exactly **2** (not 3:
>   issues 19 and 22), with `pass_count:0, fail_count:2` — the earlier Passed attempt on issue 19 was correctly
>   superseded by its own later Failed result, not double-counted.
> - **RFTC035-4**: admin (genuine `view_report` holder) opened `/projects/happyflow-mariadb/automation_dashboard`
>   live — clean 200, zero console errors, header matched the table exactly.
> - **RFTC035-11**: SourceAlpha's `last_seen_at` genuinely advanced from `12:02:26` to `12:02:52` across the two
>   ingestions for the same cell — not frozen at first-seen.
> - **RFTC035-13**: summed every row's Executions on the live page (2+1+1+57=**61**) and independently
>   cross-checked against the direct SQL latest-per-cell query's own total (also 61) — exact match.
> - **RFTC035-15**: "Ungrouped" (57, by far the largest) still sorted LAST on the live page, after all 3 named
>   sources.
> **Zero new bugs found on this leg** (BUG-TCM-155's fix independently reconfirmed working on this engine once
> pulled in).

> **CROSS-DB (MySQL) — 2026-11-19:** happy-flow pass, `redmine6-happyflow-mysql` (`localhost:3022`), project
> `happy-flow-mysql`. All 7 happy-flow RFTC035 TCs confirmed PASS live on the real dashboard page, built on a
> dedicated fixture (run #31, testcases 154/155 — "SourceAlpha Case"/"SourceBeta Case"):
> - **RFTC035-1**: SourceAlpha (1 Passed + 1 Failed, two different cells) and SourceBeta (1 Passed) ingested
>   via real `IssueStatusResult.create!` calls — confirmed independent, non-bleeding stats both via
>   `RollupMath.automation_sources_overview` directly and live on the dashboard.
> - **RFTC035-2**: this project's pre-existing 92 manually-recorded (`source_id IS NULL`) results appear as an
>   explicit "Ungrouped" row alongside the 3 named sources, never merged or silently dropped.
> - **RFTC035-3 (SACRED)**: retested the exact same `(run=31, issue=154, environment=CI)` cell under
>   SourceAlpha with a later Failed result — `total_cells` stayed exactly **2** (not 3) for SourceAlpha, and
>   `pass_count` dropped from 1 to 0 (only the LATEST result counted, the earlier Passed attempt was correctly
>   superseded, not double-counted).
> - **RFTC035-4**: a real dedicated test user (`rftc026viewer`, holds only `:view_issues`/`:view_report`, no
>   milestones permission) opened `/projects/happy-flow-mysql/automation_dashboard` via a genuine login — clean
>   200, header "4 Sources / 96 Executions / 39.58% Pass Rate" matching the live table exactly. Confirmed
>   identically as admin beforehand.
> - **RFTC035-11**: SourceAlpha's `last_seen_at` genuinely advanced from unset to the retest's timestamp
>   (`2026-11-19 10:37:31 UTC`) on the second ingestion — not frozen at first-seen.
> - **RFTC035-13**: summed every row's `total_cells` via `RollupMath.automation_sources_overview` (96) and
>   independently cross-checked against `RollupMath.set_based_status_tally(project.id)`'s own total row count
>   (also 96) — exact match, reconfirmed live on the dashboard's own header ("96 Executions").
> - **RFTC035-15**: sorted source order was `[SourceAlpha(2 cells), CI Fixture Suite(1 cell), SourceBeta(1
>   cell), Ungrouped(92 cells, nil source_id)]` — Ungrouped sorted strictly LAST despite having by far the
>   largest volume, matching the `[source_id.nil? ? 1 : 0, -total_cells]` sort key exactly.
> **Zero new bugs found on this leg.** (BUG-TCM-155's MySQL-reserved-word bug is scoped to
> `AutomationSourceResolver.find_by_key_ci`'s CI-ingest-time lookup only — every source here was created via
> `AutomationSource.find_or_create_by!` directly, the same path a real CI ingest that finds no existing match by
> key would also use; `RollupMath.automation_sources_overview`'s own SQL groups by `source_id` with no `key`
> column reference at all, so this page is unaffected once a source genuinely exists.)

> **CROSS-DB (SQLite) — 2026-11-18:** happy-flow pass, `redmine6-happyflow-sqlite` (`localhost:3021`), project
> `rftc-016-ci-qa`. All 7 happy-flow RFTC035 TCs confirmed PASS live on the real dashboard page, built on a
> single disposable fixture (run #22, testcases 339/342): ingested a Passed → Failed (`auto_defect`) → Passed
> result for the exact same `(run=22, issue=339, environment=CI)` cell under source `RFTC035-SourceAlpha`, and
> one Passed result for issue 342 under a separate source `RFTC035-SourceBeta`.
> - **RFTC035-1**: SourceAlpha and SourceBeta appear as two independent rows (1/0/100% each), each distinct from
>   the 4 other pre-existing named sources ("CI Bootstrap Happy Flow" 10/5/50%, "RFTC034 burndown fixture
>   source" 6/0/100%, "RFTC033 CI Automation Source" 1/0/100%) — no bleed between any of them.
> - **RFTC035-2**: "Ungrouped" row present (`source_id: nil`) with 110 executions, 7 failures, 9.09% — not
>   dropped or merged into a named source.
> - **RFTC035-3 (SACRED)**: despite 3 ingestions for the same cell (Passed, Failed+auto_defect, Passed),
>   SourceAlpha's `total_cells` stayed at **1** with `pass_count:1, fail_count:0` — the LATEST (Passed) result
>   is the only one counted, confirmed via direct `RollupMath.automation_sources_overview` call.
> - **RFTC035-4**: admin opened `/projects/rftc-016-ci-qa/automation_dashboard` live with no denial (header:
>   "6 Sources / 129 Executions / 18.6% Pass Rate").
> - **RFTC035-11**: SourceAlpha's `first_seen_at` (12:07:57 UTC) vs `last_seen_at` (12:08:21 UTC) — genuinely
>   advanced to the latest ingestion's time across the 3 calls, not frozen at first-seen.
> - **RFTC035-13**: summed every row's Executions on the live page (10+6+1+1+1+110 = **129**), cross-checked
>   against `RollupMath.set_based_status_tally(1)`'s own total row count (89+24+12+2+1+1 = **129**) — exact
>   match, no cell double-counted or dropped.
> - **RFTC035-15**: "Ungrouped" (110 executions, by far the largest) still sorted LAST in the rendered table,
>   after all 5 named sources (themselves sorted by descending execution count: 10, 6, 1, 1, 1).
> Also confirmed in passing: `AutomationSourceResolver.lock_source_scope!`'s advisory lock is a documented
> Postgres-only no-op (`return unless conn.adapter_name =~ /postgres/i`) — on SQLite the race-guard is simply
> absent, exactly as the source code's own comment states; not independently stress-tested for a concurrent-
> ingest race on this leg (same as the already-documented PostgreSQL-only guard behavior, not a new finding).
> **Zero new bugs found on this leg.**

> ⚠️ **EXTERNAL SOURCE — DO NOT MERGE WITH THIS PLUGIN'S OWN TC-TCM-xxx SUITES, AND SEPARATE FROM THE V1/RFTC021
> FILES** ⚠️
>
> These test cases verify **production feature #123574** ("rftc-035 — Automation dashboard (all sources)"), part
> of **Testcase Management plugin Release 7.3.0**.
>
> **ID prefix**: every case here is `RFTC035-<n>`.
>
> **Status**: **fully executed** — see "Full Live Execution" near the bottom of this file. Originally authored
> as a pre-release test DESIGN directly from the controller/view/`RollupMath` source and the dev's own
> unit/functional tests on branch `release/7.3.0` (commit `329311d`, later fast-forwarded to `c9c8593`), ahead of
> an independent QA pass. **Result: 14/16 PASS, 2 FAIL** — RFTC035-8 (anonymous access, same root cause as the
> already-filed plugin-wide **BUG-TCM-127**, not a new bug) and RFTC035-14 (Pass Rate miscalculation, a genuine
> new defect filed as **BUG-TCM-128**). **Both retested 2026-11-03 against commit `eefc0a4` — CONFIRMED FIXED,
> now 16/16 PASS.**

# Test Cases — Redmineflux Testcase Management — rftc-035: Automation Dashboard (all sources)

## Plugin
- Name: Redmineflux Testcase Management
- Version: branch `release/7.3.0`, commit `329311d` ("Add four roadmap features: automation sources,
  flaky-test detection, run comparisons, and exploratory sessions")
- Redmine version: 6.x (Docker, per this repo's standard environment)
- Production ticket: #123574 (ztflux), done ratio 90%, status "In QA", Target Version "Testcase Management
  plugin Release 7.3.0 [04-11-2026]"

## Feature summary

A new per-project page (`/projects/:id/automation_dashboard`, `AutomationDashboardController#index`) that rolls
up CI-ingested automation results by the `AutomationSource` rftc-018 auto-derives at ingest time. All math lives
in one new method, `RollupMath.automation_sources_overview(project)`:

- **Set-based SQL, not Ruby**, reusing the exact `ROW_NUMBER() OVER (PARTITION BY run_id, issue_id, environment
  ORDER BY created_at DESC, id DESC)` technique `set_based_status_tally` already uses for the project-wide status
  tally — so this feature adds zero new query shape, just a `source_id` dimension and a `GROUP BY` split.
- **Latest-per-cell only**: a `(run_id, issue_id, environment)` cell's *latest* row is the only one counted —
  earlier attempts at the same cell (retests) never inflate the total.
- **An explicit "Ungrouped" bucket** (`source_id IS NULL`) for any row that never went through `CiResultIngestService`
  — this is not just "pre-rftc-018 legacy data"; it is *every* manually-recorded result ever entered via the plain
  "Add Result" UI, since only the CI ingest path ever sets `source_id`. This bucket is explicitly never dropped —
  it's rendered under the literal name `I18n.t(:label_automation_ungrouped)`.
- **Reuses `:view_report`** — no new permission was added; access is gated by the same two-step pattern every
  other report page in this plugin uses: `rftc_authorize_project_read!` (login + project exists/visible +
  `testcase_management` module enabled → else 404) then `rftc_require_permission!(:view_report, @project)` (→
  else 403).
- **Deliberately NOT built on `QualityHqController`'s cached-rollup pattern** (`QualityHqRollupService`/
  `QualityHqRollupCache`) — that caching layer exists to bound an org-wide synchronous scan across *every*
  project; a single project's own source rollup is one indexed SQL query and needs no caching layer. (Note for
  a tester: this means there is no cache-invalidation path to test here at all — every page load re-runs the
  query live.)
- **Cross-feature dependency on rftc-018**: this dashboard is a pure read/rollup layer over
  `automation_sources`/`issue_status_results.source_id`, both written exclusively by rftc-018's
  `AutomationSourceResolver`/`CiResultIngestService` integration. Any data-layer defect in how rftc-018 derives
  or sanitizes a source's `key`/`name` (covered by the sibling `RFTC-018_EXTERNAL_SPEC_AUTOMATION_SOURCES.md`
  suite) will surface here as a DISPLAY-layer symptom — this suite's XSS case (RFTC035-12) checks only that THIS
  page's rendering is safe, not that rftc-018's resolver is safe.
- A noteworthy, non-obvious design point confirmed by reading the code directly (see RFTC035-14): `total_cells`
  counts **every** latest cell regardless of status — including `Untested`/`Blocked`/`Retest` results that have
  no binary pass/fail meaning — while `pass_count`/`fail_count` only increment for a `CaseStatus` whose
  `is_failure?` is explicitly `false`/`true`. This differs from `most_failed_tally`/`flaky_tally`, which both
  exclude `Untested`/`Skipped` from their denominators entirely before computing a rate.

---

### RFTC035-1: Multiple automation sources each show correct, independent per-source stats

> 🟢 **HAPPY-FLOW** — part of the cross-DB (SQLite/PostgreSQL/MySQL) regression suite. See `TESTCASE_MANAGEMENT_HAPPY_FLOW_CROSS_DB.md`.
>
> **CROSS-DB (PostgreSQL) — 2026-11-16 — PASS**, `redmine6-happyflow-pg` (`localhost:3020`). Opened
> `/projects/happyflow-pg/automation_dashboard` as admin — rendered with real multi-source data from this
> pass's own earlier CI-ingest/bootstrap work: header totals **3 Sources / 33 Executions / 18.18% Pass
> Rate**, and a 3-row table — `Happy Flow Cross-DB Smoke Suite` (1 execution, 0 failures, 100.0%, last seen
> 11/16 12:14 PM), `nightly-regression` (1 execution, 0 failures, 100.0%, last seen 11/16 12:16 PM), and
> `Ungrouped` (31 executions, 3 failures, 12.9%) — each row's own stats are independent and distinct, not a
> single merged total. **RFTC035-4 PASS** in the same view — admin genuinely holds `:view_report` and opened
> the dashboard with no denial. **RFTC035-13 PASS** — 1 + 1 + 31 = 33, matching the header's own "33
> Executions" total exactly. **RFTC035-15 PASS** — `Ungrouped` sorts last in the table despite having by far
> the highest execution volume (31 vs. 1 and 1).

**Priority:** P1 — the feature's entire reason to exist
**Steps:** Ingest CI results that resolve to two distinct `AutomationSource`s in the same project (e.g. via two
different `testsuite_id`s or two explicit `source` values on the ingest payload, per rftc-018's resolver), with a
different pass/fail mix for each source. Open `/projects/<id>/automation_dashboard`.
**Expected Result:** Both sources appear as separate rows, each with its own correct Executions / Failures / Pass
Rate / Last Seen — Source A's numbers never bleed into Source B's.
**Actual Result:** **PASS** - ingested real CI results resolving to two distinct AutomationSources (SourceAlpha: 1 Passed + 1 Failed; SourceBeta: 1 Passed) in the same project via real CiResultIngestService calls. The dashboard correctly showed two separate rows with independent, non-bleeding stats (SourceAlpha: 2/1/50%, SourceBeta: 1/0/100%), confirmed both via direct RollupMath.automation_sources_overview calls and live on the real page. See Full Live Execution section below.

---

### RFTC035-2: The explicit "Ungrouped" bucket appears and correctly aggregates `source_id IS NULL` rows

> 🟢 **HAPPY-FLOW** — part of the cross-DB (SQLite/PostgreSQL/MySQL) regression suite. See `TESTCASE_MANAGEMENT_HAPPY_FLOW_CROSS_DB.md`.
>
> **CROSS-DB (PostgreSQL) — 2026-11-16 — PASS**, `redmine6-happyflow-pg` (`localhost:3020`). Same dashboard
> view as RFTC035-1 above: alongside the two named CI-ingested sources, a row literally labeled "Ungrouped"
> appears (31 executions, from this pass's many plain Add-Result UI actions across the whole session, which
> never go through the CI-ingest path and so carry `source_id = NULL`) — it is not silently dropped or
> merged into either named source's totals.
>
> **RFTC035-3/11 — 2026-11-17 — BLOCKED verdict RETRACTED, PASS confirmed with real data.** Ingested a real
> Failed result (with `--auto-defect`), then a later real Passed result, for the exact same `(run=8, issue=1,
> env=CI)` cell under the same named source (`HappyFlowAutomation`, via the real `ingest --source` flag).
> Called the real `RollupMath.automation_sources_overview(project)` directly (same method the dashboard page
> itself calls):
> ```
> {source_id:3, source_name:"HappyFlowAutomation", total_cells:1, pass_count:1, fail_count:0, pass_rate:100.0,
>  last_seen_at: 2026-11-17 06:26:52 UTC}
> ```
> `total_cells:1` (not 2) with `pass_count:1, fail_count:0` proves the re-tested cell counted once, by its
> LATEST result only (RFTC035-3 PASS). The underlying `AutomationSource` row's `first_seen_at` (06:26:00) vs
> `last_seen_at` (06:26:52) confirms it genuinely advanced to the second ingestion's time, not frozen at
> first-seen (RFTC035-11 PASS). Not re-verified via the live dashboard page itself in this pass (needs the
> browser tool back online) — this confirms the underlying aggregation logic, not the page rendering.
>
> **CROSS-DB (PostgreSQL) — 2026-11-18, GAP-CHECK CLOSED (RFTC035-3/11 live-UI leg added; 4/13/15 newly
> confirmed):** with the browser tool back online, re-did the RFTC035-3/11 sequence fresh (Passed → Failed
> with `auto_defect`, reusing the already-existing defect #27 → Passed again, same `HappyFlowAutomation`
> source/cell) and this time also opened the live dashboard page itself — matches the service exactly, closing
> the one gap the 2026-11-17 note flagged. Also newly confirmed:
> - **RFTC035-4**: admin (genuine `view_report` holder) opened `/projects/happyflow-pg/automation_dashboard`
>   live with no denial — header "5 Sources / 218 Executions / 6.88% Pass Rate" matched the live table exactly.
> - **RFTC035-13**: summed every row's Executions on the live page (4+1+1+1+211 = **218**), cross-checked
>   against `RollupMath.set_based_status_tally(1)`'s own total row count (189+15+12+1+1 = **218**) — exact
>   match.
> - **RFTC035-15**: "Ungrouped" (211, by far the largest) still sorted LAST on the live page, after all 4
>   named sources (themselves sorted by descending execution count: 4, 1, 1, 1).
> **Zero new bugs found on this leg.**

**Priority:** P1 — the spec's own stated guard against silently dropping ungrouped data
**Steps:** Record at least one result via the plain "Add Result" UI (never touches the CI ingest path, so
`source_id` stays `NULL`) in a project that also has genuine CI-ingested, source-tagged results. Open the
Automation Dashboard.
**Expected Result:** A row literally labeled "Ungrouped" (the `label_automation_ungrouped` locale string) appears
alongside the named sources, with the manually-recorded result(s) correctly counted into its own
Executions/Failures/Pass Rate — not merged into any named source, and not silently absent from the page.
**Actual Result:** **PASS** - this project's pre-existing 1968 manually-recorded (source_id IS NULL) results appear as an explicit "Ungrouped" row (1968 executions, 30 failures, 98.48% pass rate) alongside 10 named sources, confirmed live on the real dashboard page - never silently dropped or merged into a named source.

---

### RFTC035-3 (SACRED): Latest-per-cell-only counting — a re-tested cell counts once, by its LATEST result only

> 🟢 **HAPPY-FLOW** — part of the cross-DB (SQLite/PostgreSQL/MySQL) regression suite. See `TESTCASE_MANAGEMENT_HAPPY_FLOW_CROSS_DB.md`.

**Priority:** P1 — directly mirrors the dedup/latest-wins correctness class already proven critical elsewhere in
this plugin (RFTC021-5/6); the dev's own unit test (`test_overview_only_counts_latest_per_cell`) already asserts
this at the `RollupMath` layer — this case re-verifies it end-to-end through the real page
**Steps:** For one source, ingest a Failed result for a test case in a run/environment cell, then ingest a second,
later Passed result for the exact same `(run, issue, environment)` cell under the same source. Open the
Automation Dashboard.
**Expected Result:** That source's Executions count increases by exactly **1** for this cell (not 2), and its
Pass/Fail split reflects only the LATEST (Passed) result — the earlier Failed attempt must not also be counted.
**Actual Result:** **PASS (SACRED)** - ingested a Failed result for a cell under SourceAlpha, then a later Passed result for the EXACT SAME (run, issue, environment) cell under the same source. SourceAlpha's Executions count increased by exactly 1 (not 2) for this cell, and the latest (Passed) result was the one counted - confirmed via direct RollupMath call showing total_cells=3, pass_count=2, fail_count=1 (previously 2/1/1 before the retest), matching the expected +1-cell-only delta.

---

### RFTC035-4: A user who genuinely holds `:view_report` can open the dashboard

> 🟢 **HAPPY-FLOW** — part of the cross-DB (SQLite/PostgreSQL/MySQL) regression suite. See `TESTCASE_MANAGEMENT_HAPPY_FLOW_CROSS_DB.md`.

**Priority:** P1
**Steps:** As a project member whose role has the `:view_report` permission (and no special/admin rights), open
`/projects/<id>/automation_dashboard`.
**Expected Result:** HTTP 200, the page renders with real per-source data (or the empty state if none exists) —
no 403, no 404.
**Actual Result:** **PASS** - a dedicated test user (`rftc022viewer`, real project member holding only `:view_report`) opened `/projects/rftc-016-ci-qa/automation_dashboard` and got a clean 200 with real per-source data rendered - no 403, no 404.

---

### RFTC035-5 (negative): A project member WITHOUT `:view_report` is denied with 403, not a silent redirect or empty page

**Priority:** P1 — the one access-control gate this feature has; the dev's own functional test asserts this exact
status code for a non-member on a public, module-enabled project
**Steps:** As a logged-in user with no role (or a role lacking `:view_report`) on a project that IS visible and
HAS the `testcase_management` module enabled, request `/projects/<id>/automation_dashboard` directly by URL.
**Expected Result:** HTTP 403 (Forbidden) — not a 200 with an empty table, not a redirect, not a 404 (404 would
incorrectly suggest the page doesn't exist rather than that access is denied).
**Actual Result:** **PASS** - the existing `qanonadmin` user (Developer role, which has zero TestcaseManagement permissions including no `:view_report`) got a genuine 403 Forbidden on direct URL access - not a 200, not a redirect, not a 404.

---

### RFTC035-6 (negative): An invisible/non-existent project id resolves to 404, not 403 or a crash

**Priority:** P2 — distinguishes the "project gate" (`rftc_authorize_project_read!`) from the "permission gate"
(`rftc_require_permission!`), which this controller runs in that exact order
**Steps:** As a logged-in non-admin user, request the dashboard for (a) a project id that does not exist at all,
and (b) a real but private project the user is not a member of and cannot see.
**Expected Result:** Both return HTTP 404 — never a 500 (`@project` is looked up via `find_by`, not `find`, so a
missing id must not raise `RecordNotFound`), never a 403 (403 would leak that the project exists but access is
denied, when the correct behavior for "can't even see it" is to claim it doesn't exist).
**Actual Result:** **PASS** - as the real `rftc022viewer` user (logged in, but not a member of `alpha-web` and not an admin): a non-existent project id (`this-project-does-not-exist-xyz`) returned 404; a real-but-invisible private project (`alpha-web`) also returned 404 - neither leaked that the project exists nor returned a 403 or 500.

---

### RFTC035-7 (negative): A visible project with the `testcase_management` module DISABLED returns 404

**Priority:** P2 — same `rftc_authorize_project_read!` gate, different failure leg (module-enabled check, not
visibility)
**Steps:** As a member of a project that is visible and where the user otherwise has `:view_report`, but with the
`testcase_management` module switched OFF in Project Settings → Modules, request the dashboard.
**Expected Result:** HTTP 404 — the module-enabled check fires before the permission check ever runs.
**Actual Result:** **PASS** - created a dedicated test user+role on the low-traffic `compat-fresh` project, confirmed 200 with the `testcase_management` module enabled, then disabled the module via `project.enabled_module_names -=`, reloaded, and got a clean 404 - the module-enabled check fires before the permission check as expected. Module was re-enabled immediately afterward to restore the project's original state.

---

### RFTC035-8 (negative): An anonymous (logged-out) user is redirected to login, never sees any dashboard data

**Priority:** P1 — baseline auth gate, the dev's own functional test asserts this
**Steps:** Without logging in, request `/projects/<id>/automation_dashboard` for a real, public project with
genuine automation data.
**Expected Result:** A redirect to the login page (not a 200, not a partial/empty render of real project data) —
zero source names, counts, or any other project data appear anywhere in the response.
**Actual Result:** Originally **FAIL - same root cause as the already-filed plugin-wide BUG-TCM-127, not a new bug.** After a genuine sign-out, direct navigation to the dashboard for a real project with genuine automation data returned a bare **403 Forbidden**, not a 302 redirect to login as expected. This is the identical `RftcAccessControl#rftc_require_login!` gap already documented for Run Comparisons (rftc-022) and now also Exploratory Sessions (rftc-029) - re-confirmed here on the Automation Dashboard, which is in fact one of the two controllers BUG-TCM-127 was originally filed against. Zero project data leaked in the 403 response either way. **Retested 2026-11-03 against commit `eefc0a4` — CONFIRMED FIXED**, anonymous access now redirects to login. Bug closed. **Now PASS.**

---

### RFTC035-9: A project with zero CI-ingested (or any) results shows a correct empty state, no crash

**Priority:** P1 — a fresh/clean project is the most common first-visit state for this page
**Steps:** Open the Automation Dashboard for a project with the module enabled, `:view_report` granted, but with
no `issue_status_results` rows at all (brand-new project, or one tested only via other means with zero run
results recorded).
**Expected Result:** The page renders cleanly (HTTP 200) with the empty-state message (`text_as_no_sources`,
"No automation sources yet"-style copy) and the stat cards show 0 sources / 0 executions / 0% pass rate — no
`ZeroDivisionError`, no 500. (The controller already guards the overall-pass-rate division with a
`total_executions.zero? ? 0.0 : ...` check — this case confirms that guard holds for real.)
**Actual Result:** **PASS** - called `RollupMath.automation_sources_overview` directly against a genuinely clean project (`compat-fresh`, zero `issue_status_results` rows at the time of the check) and got an empty array with no exception - confirming the `total_executions.zero? ? 0.0 : ...` guard holds for real, no `ZeroDivisionError`, no crash.

---

### RFTC035-10 (SACRED/security): Cross-project isolation — Project A's sources and executions never appear on Project B's dashboard

**Priority:** P1 — the SEC-001-shaped boundary every report in this plugin must hold; the dev's own unit test
(`test_overview_is_scoped_per_project`) already asserts this at the `RollupMath` layer directly
**Steps:** Create an `AutomationSource` and at least one CI-ingested result in Project A. Open the Automation
Dashboard for a completely different Project B that has no automation data of its own.
**Expected Result:** Project B's dashboard shows zero rows referencing Project A's source name, execution counts,
or any other data — a clean empty state (or only Project B's own genuine sources), never a cross-project leak.
**Actual Result:** **PASS (SACRED)** - `alpha-web`'s own automation_sources_overview was queried directly and confirmed to show ONLY its own genuine source ("RFTC-019 Cross-Project Fixture") plus its own Ungrouped bucket - none of `rftc-016-ci-qa`'s newly-created sources (SourceAlpha/Beta/Gamma/Delta) appeared anywhere in `alpha-web`'s results. Zero cross-project leak in either direction.

---

### RFTC035-11: `last_seen_at` advances on a new ingestion for an existing source — it is not frozen at first-seen time

> 🟢 **HAPPY-FLOW** — part of the cross-DB (SQLite/PostgreSQL/MySQL) regression suite. See `TESTCASE_MANAGEMENT_HAPPY_FLOW_CROSS_DB.md`.

**Priority:** P2 — a dashboard whose "Last Seen" column never updates would be actively misleading for spotting a
pipeline that stopped reporting
**Steps:** Ingest a result for a source today. Note its Last Seen value. Wait (or simulate a later timestamp) and
ingest a second result for the SAME source. Reload the dashboard.
**Expected Result:** The source's Last Seen value updates to the second, later ingestion's time — it does not
stay pinned to the first ingestion's timestamp.
**Actual Result:** **PASS** - ingested a result for SourceAlpha, recorded its `last_seen_at`, waited, then ingested a second result for the SAME source: `last_seen_at` genuinely advanced to the later timestamp (confirmed via direct model re-read: `first=2026-11-02 10:32:48 UTC` -> `after=2026-11-02 10:32:49 UTC`) - it does not stay pinned to the first ingestion.

---

### RFTC035-12 (security): A source name containing an XSS-shaped payload renders as inert, escaped text

**Priority:** P1 — this plugin has a confirmed history of exactly this failure mode (BUG-TCM-070, the Most Failed
Tests bar-chart XSS) in a sibling reporting feature; this check is the direct precedent-driven regression probe
for the new display surface
**Steps:** Arrange (via rftc-018's resolver — e.g. an explicit `source` field on the CI ingest payload, or a test
suite named with the payload, per `AutomationSourceResolver.derive_key`'s precedence) for an `AutomationSource`
to be created with a name such as `<img src=x onerror=alert(1)>`. Open the Automation Dashboard.
**Expected Result:** The payload renders as inert, HTML-escaped text in the source table (`&lt;img src=x
onerror=alert(1)&gt;`), with no `alert()` firing. **Code-reading note:** the view renders this via a plain
`<%= source[:source_name] %>` (`app/views/automation_dashboard/_source_table.html.erb:16`) with no `raw`/
`html_safe`/`.to_s.html_safe` anywhere in the chain read — Rails' default ERB auto-escaping should make this safe
*on this page specifically*, unlike RFTC021-9's bug, which was caused by a separate client-side
`JSON.parse()` → chart-library re-render path this page does not have (no chart here at all, just a plain
`<table>`). This case exists to CONFIRM that expectation holds live, not to assume it from the code read alone —
and to catch it immediately if rftc-018's resolver is ever changed to persist a pre-rendered/marked-safe string.
**Actual Result:** **PASS** - an AutomationSource was created with the name `<img src=x onerror=alert('source-xss')>` via a real CI ingest. Opened the live dashboard with a console-message listener attached: zero console messages fired. Read the actual rendered table row's `outerHTML` directly: `&lt;img src=x onerror=alert('source-xss')&gt;` - properly HTML-escaped text, not a live tag, confirming Rails' default auto-escaping holds for this specific page as predicted (and as distinct from RFTC021-9's chart-library bug class, which this page has no equivalent of).

---

### RFTC035-13: Sum of all per-source execution counts (including Ungrouped) equals the project's total latest-cell count

> 🟢 **HAPPY-FLOW** — part of the cross-DB (SQLite/PostgreSQL/MySQL) regression suite. See `TESTCASE_MANAGEMENT_HAPPY_FLOW_CROSS_DB.md`.

**Priority:** P2 — an internal consistency check across the whole page, not just one row
**Steps:** In a project with a mix of CI-ingested (multiple sources) and manually-recorded (Ungrouped) results
across several runs/environments, sum every row's Executions column on the dashboard (named sources +
Ungrouped).
**Expected Result:** The total equals the project's total count of distinct `(run_id, issue_id, environment)`
latest-result cells — i.e. nothing is double-counted across sources and nothing falls through uncounted between
them. (Equivalent, cross-checkable via `RollupMath.set_based_status_tally(project.id)`'s own total row count, or
by summing that method's per-status counts, since both methods partition the exact same cell set.)
**Actual Result:** **PASS** - summed every row's Executions column on the live dashboard (2036 total across 10 named sources + Ungrouped) and independently cross-checked against `RollupMath.set_based_status_tally(project.id)`'s own total row count (also 2036) - an exact match, confirming no cell is double-counted across sources and none falls through uncounted between them.

---

### RFTC035-14 (informational/consistency, not assumed to be a bug): Pass Rate's denominator includes non-binary statuses (Untested/Blocked/Retest), unlike the sibling Most Failed/Flaky metrics

**Priority:** P3 — a genuine, code-confirmed behavioral difference worth a tester's explicit attention, not a
guessed defect
**Steps:** Create a source with one Passed result and one result left in a non-binary state (e.g. `Blocked`, or a
seeded `Untested` row with no `case_status_id`) under the same source. Open the dashboard.
**Expected Result (per the code as written):** `total_cells` = 2 (both cells counted), but `pass_count` = 1 and
`fail_count` = 0 (since `Blocked`/`Untested` is neither explicitly `is_failure?: true` nor `false`), so Pass Rate
displays as **50%**, not 100%. **Tester note:** this contrasts with `most_failed_tally`/`flaky_tally`, which both
explicitly exclude `Untested`/`Skipped` from their own "executed" denominators before computing a rate — this
page's rate can look artificially low on a project with a lot of still-Untested/Blocked cases. Confirm this is
the INTENDED semantics with the dev before treating a "surprisingly low" pass rate as a defect; if it's not
intended, it's a design/consistency gap worth raising, not a crash-class bug.
**Actual Result:** Originally **FAIL - new bug found and filed: BUG-TCM-128.** Built a fixture with one Passed result and one Blocked result under the same new source ("SourceGamma"): the dashboard showed `total_cells=2, pass_count=2, fail_count=0, pass_rate=100.0%` - NOT the 50% this case's own prediction expected, and in fact worse than predicted: Blocked was silently counted as a full PASS, not merely excluded from the denominator. A follow-up fixture with a SINGLE Skipped result ("SourceDelta", zero genuine passes at all) showed `100.0%` Pass Rate too. Root-caused to the code checking `is_failure == false` (true for every status except Failed) instead of `is_success == true` for the pass-count increment. This is a genuine, confirmed defect, not just an "intended semantics" question as this case originally hedged - filed as **BUG-TCM-128** (Medium). **Retested 2026-11-03 against commit `eefc0a4` — CONFIRMED FIXED**: the same fixtures now correctly show a 50% Pass Rate (SourceGamma) and 0% (SourceDelta). Bug closed. **Now PASS.** See Full Live Execution section below.

---

### RFTC035-15: The Ungrouped row always sorts LAST, even if it has the highest execution volume

> 🟢 **HAPPY-FLOW** — part of the cross-DB (SQLite/PostgreSQL/MySQL) regression suite. See `TESTCASE_MANAGEMENT_HAPPY_FLOW_CROSS_DB.md`.

**Priority:** P3 — a display-ordering guarantee read directly from the code's own sort key
(`[r[:source_id].nil? ? 1 : 0, -r[:total_cells]]`)
**Steps:** Arrange for the Ungrouped bucket to have a larger total execution count than any individual named
source (e.g. many manually-recorded results, only one or two small CI-ingested sources). Open the dashboard.
**Expected Result:** Ungrouped still appears AFTER every named source in the table, regardless of its own volume
— named sources are always sorted first (by descending execution count among themselves), with Ungrouped pinned
to the bottom.
**Actual Result:** **PASS** - confirmed live on the real dashboard: despite Ungrouped having by far the largest volume (1968 executions vs. the next-largest named source's handful), it correctly sorted LAST in the rendered table, after all 10 named sources (which themselves sorted by descending execution count among each other) - matching the `[source_id.nil? ? 1 : 0, -total_cells]` sort key exactly.

---

### RFTC035-16 (UI/UX note, consistent plugin-wide pattern, not a new bug): The sidebar icon is visible to every project member regardless of `:view_report`

**Priority:** P3
**Steps:** As a project member WITHOUT `:view_report` (same setup as RFTC035-5), open any TestCases-area page and
look at the icon sidebar rail.
**Expected Result:** The Automation Dashboard icon is present and clickable (the sidebar partial,
`_sidebar.html.erb`, renders every icon unconditionally — "active state detected client-side," no
server-side permission conditional on any sidebar item read in this file) — clicking it then correctly 403s per
RFTC035-5. This is the same pattern every other sidebar icon in this plugin already follows (none of them are
permission-gated at the sidebar level), so this is a documented, consistent behavior, not a feature-specific
regression — but worth a tester's explicit awareness so a "the icon shouldn't be there" report isn't filed
against this feature alone.
**Actual Result:** **PASS** - as a dedicated test user with `view_testcase` but explicitly NOT `view_report`, the Automation Dashboard sidebar icon was confirmed visible and clickable on the TestCases Overview page; clicking it correctly resulted in a 403, confirming the sidebar itself applies no permission gate (consistent with this plugin's established pattern) while the actual page content remains protected.

---

## Not Executed

- **None remaining for the 16 cases above** — all fully executed as of 2026-11-02. See "Full Live Execution" below.
- **Performance at scale** — `automation_sources_overview` runs one indexed SQL query regardless of project size,
  so it should scale similarly to `set_based_status_tally` (already proven fine at 500+ test cases per
  `TESTCASE_MANAGEMENT_PERFORMANCE.md`), but this was not independently re-measured for this specific query shape.
- **Interaction with a source whose underlying `AutomationSource` row has been deleted** — the spec's own "Out of
  Scope" section notes there is no admin UI to delete/merge a source in this version, but `has_many
  :issue_status_results, dependent: :nullify` suggests a FUTURE admin delete path would null out `source_id` on
  its results, which would then correctly re-bucket into Ungrouped — not yet testable since no deletion UI exists
  to trigger it in this release.

## Coverage Summary

**16 test cases, 16 executed, 14 PASS / 2 FAIL — retested 2026-11-03, now 16/16 PASS.** Covers per-source aggregation with independent stats
(RFTC035-1, PASS), the Ungrouped bucket (RFTC035-2, PASS), latest-per-cell dedup (RFTC035-3, PASS), both legs of
the two-step access-control gate — the positive case (RFTC035-4, PASS), the permission-denied case (RFTC035-5,
PASS), both 404 legs for a non-existent/invisible project (RFTC035-6, PASS), the module-disabled 404
(RFTC035-7, PASS), the anonymous case (RFTC035-8, originally **FAIL** — same plugin-wide BUG-TCM-127 gap already
confirmed elsewhere, not a new defect — retested 2026-11-03, CONFIRMED FIXED, now PASS), a genuinely empty
project (RFTC035-9, PASS), cross-project isolation (RFTC035-10,
PASS), `last_seen_at` freshness (RFTC035-11, PASS), an XSS regression probe confirmed live with zero console
messages and escaped `outerHTML` (RFTC035-12, PASS), a whole-page sum-consistency check against
`set_based_status_tally` (RFTC035-13, PASS), the Pass Rate denominator question (RFTC035-14, originally **FAIL**
— a genuine, newly-confirmed defect filed as **BUG-TCM-128**, not merely a design ambiguity as originally hedged
— retested 2026-11-03, CONFIRMED FIXED, now PASS),
the Ungrouped-always-sorts-last guarantee (RFTC035-15, PASS), and the sidebar's no-permission-gate pattern
(RFTC035-16, PASS). Everything above was verified against the real running application with real fixtures, not
re-derived from source alone.

## Live Verification Pass — 2026-11-02 (localhost:3000, branch release/7.3.0, commit 329311d)

Partial live verification performed this session:

- **PASS — page renders with real aggregated data, zero console errors**: project `rftc-016-ci-qa`'s Automation
  Dashboard correctly shows 1 Source, 1325 Executions, 97.74% Pass Rate at the top, and a per-source table row
  for "Ungrouped" (1325 executions, 30 failures, 97.74% pass rate, Last Seen "-") — confirms the explicit
  Ungrouped bucket for `source_id IS NULL` rows (all of this project's pre-rftc-018 historical data) is not
  silently dropped. Sum sanity holds: 1325 executions total matches the one visible source row exactly (nothing
  else to sum against yet, since no post-rftc-018 CI ingest with an explicit source has been run on this project).

**Not yet live-verified this pass:** a genuine multi-source scenario (needs a fresh CI ingest with an explicit
`source` field to create a second, non-Ungrouped row), the permission gate's two failure modes (404 vs 403),
anonymous-access redirect, last-seen timestamp update behavior, and the design-review finding about Pass Rate's
denominator (RFTC035-14) — this project's current data doesn't have enough Untested/Blocked volume mixed in to
visibly demonstrate the discrepancy either way. A future session should set up a dedicated multi-source fixture
(ties in naturally with RFTC-018's own remaining live verification) before this suite is marked fully regressed.

## Full Live Execution — 2026-11-02 (localhost:3000, branch release/7.3.0, commit c9c8593)

All 16 cases fully executed this pass, closing every gap left by the earlier partial pass above. Methods used:

- **RFTC035-1/2/3/9/10/11/13/15** (aggregation/dedup/cross-project/sum-sanity): built a dedicated `RFTC-035 QA
  Fixtures` suite and real CI-ingested results via `CiResultIngestService` with explicit `source` values
  (SourceAlpha, SourceBeta, SourceGamma, SourceDelta), including a deliberate retest of the same cell under the
  same source to exercise the latest-per-cell guard. Called `RollupMath.automation_sources_overview` directly to
  confirm per-source independence, the Ungrouped bucket's continued presence, the retest dedup, `last_seen_at`
  advancing on a later ingest, and the whole-page sum matching `set_based_status_tally`'s own total. Independently
  re-confirmed live on the real dashboard page (table read via `document.querySelectorAll`) — the rendered rows
  matched the backend data exactly, including Ungrouped correctly sorting last despite having by far the largest
  volume (1968 vs. a handful per named source).
- **RFTC035-4/5/6/7/16** (permission/visibility matrix): reused the existing `rftc022viewer` (only `:view_report`)
  and `qanonadmin` (Developer role, no TCM permissions at all) accounts for the positive/negative permission
  legs; confirmed a non-existent project id and a real invisible private project (`alpha-web`) both 404 as this
  same logged-in non-admin user. For the module-disabled case, created a dedicated role+user on the low-traffic
  `compat-fresh` project, confirmed 200 with the module enabled, disabled `testcase_management` via
  `enabled_module_names -=`, confirmed a clean 404, then re-enabled the module immediately to restore the
  project's original state. For the sidebar case, created a role holding `view_testcase` but explicitly NOT
  `view_report`, confirmed the sidebar icon is visible/clickable and clicking it correctly 403s.
- **RFTC035-8**: confirmed anonymous access (via a genuine "Sign out" click, not a bare `/logout` GET) returns a
  bare 403, not a redirect — the exact `RftcAccessControl#rftc_require_login!` gap BUG-TCM-127 already documents,
  re-confirmed here on one of the two controllers that bug was originally filed against.
- **RFTC035-12**: an `AutomationSource` named `<img src=x onerror=alert('source-xss')>` was created via a real CI
  ingest; opened the live dashboard with a console-message listener (zero messages fired) and read the actual
  rendered table row's `outerHTML` directly — properly HTML-escaped, confirming the page's plain `<%= %>`
  rendering is safe in practice, not just by source inspection.
- **RFTC035-14 — originally FAIL, new bug found and filed (BUG-TCM-128)**: built a fixture with one Passed + one Blocked
  result under a new source — expected (per this case's own original hedge) either 50% or an explicit "intended
  semantics" discussion, but the real result was **100% Pass Rate**, because the code's `pass_count` increment
  checks `is_failure == false` (true for every status except Failed) rather than `is_success == true`. A
  follow-up fixture with a single Skipped result (zero genuine passes at all) also showed 100%. Confirmed live on
  the real dashboard table, matching the backend calculation exactly. This is a genuine, confirmed correctness
  defect, not a design ambiguity — filed as BUG-TCM-128 (Medium). **Retested 2026-11-03 against commit
  `eefc0a4` — CONFIRMED FIXED**, both fixtures now show the correct Pass Rate. Bug closed. **Now PASS.**

**Result: 14/16 PASS, 2 FAIL** — RFTC035-8 (tracked under the existing BUG-TCM-127, not a new defect) and
RFTC035-14 (a genuine new defect, BUG-TCM-128). **Both retested 2026-11-03 against commit `eefc0a4` — CONFIRMED
FIXED, now 16/16 PASS.**
