> ⚠️ **EXTERNAL SOURCE — DO NOT MERGE WITH THIS PLUGIN'S OWN TC-TCM-xxx SUITES, AND SEPARATE FROM THE V1/RFTC021
> FILES** ⚠️
>
> These test cases verify **production feature #123574** ("rftc-035 — Automation dashboard (all sources)"), part
> of **Testcase Management plugin Release 7.3.0**.
>
> **ID prefix**: every case here is `RFTC035-<n>`.
>
> **Pre-release test DESIGN, not yet independently executed.** The feature's code lives on branch
> `release/7.3.0` (commit `329311d`, not yet merged to `master`) — these cases were authored directly from the
> controller/view/`RollupMath` source and the dev's own unit/functional tests, ahead of an independent QA pass.
> Every `Actual Result` below is explicitly marked "Not Executed" rather than fabricated. The developer's own
> "Quality Gates" note (`backlog/planning/rftc-035-feature-automation-dashboard.md`) already claims a live
> Playwright pass found 0 console errors and real data rendering — that is the DEVELOPER's self-check, not an
> independent QA execution, and does not substitute for one.

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

**Priority:** P1 — the feature's entire reason to exist
**Steps:** Ingest CI results that resolve to two distinct `AutomationSource`s in the same project (e.g. via two
different `testsuite_id`s or two explicit `source` values on the ingest payload, per rftc-018's resolver), with a
different pass/fail mix for each source. Open `/projects/<id>/automation_dashboard`.
**Expected Result:** Both sources appear as separate rows, each with its own correct Executions / Failures / Pass
Rate / Last Seen — Source A's numbers never bleed into Source B's.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC035-2: The explicit "Ungrouped" bucket appears and correctly aggregates `source_id IS NULL` rows

**Priority:** P1 — the spec's own stated guard against silently dropping ungrouped data
**Steps:** Record at least one result via the plain "Add Result" UI (never touches the CI ingest path, so
`source_id` stays `NULL`) in a project that also has genuine CI-ingested, source-tagged results. Open the
Automation Dashboard.
**Expected Result:** A row literally labeled "Ungrouped" (the `label_automation_ungrouped` locale string) appears
alongside the named sources, with the manually-recorded result(s) correctly counted into its own
Executions/Failures/Pass Rate — not merged into any named source, and not silently absent from the page.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC035-3 (SACRED): Latest-per-cell-only counting — a re-tested cell counts once, by its LATEST result only

**Priority:** P1 — directly mirrors the dedup/latest-wins correctness class already proven critical elsewhere in
this plugin (RFTC021-5/6); the dev's own unit test (`test_overview_only_counts_latest_per_cell`) already asserts
this at the `RollupMath` layer — this case re-verifies it end-to-end through the real page
**Steps:** For one source, ingest a Failed result for a test case in a run/environment cell, then ingest a second,
later Passed result for the exact same `(run, issue, environment)` cell under the same source. Open the
Automation Dashboard.
**Expected Result:** That source's Executions count increases by exactly **1** for this cell (not 2), and its
Pass/Fail split reflects only the LATEST (Passed) result — the earlier Failed attempt must not also be counted.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC035-4: A user who genuinely holds `:view_report` can open the dashboard

**Priority:** P1
**Steps:** As a project member whose role has the `:view_report` permission (and no special/admin rights), open
`/projects/<id>/automation_dashboard`.
**Expected Result:** HTTP 200, the page renders with real per-source data (or the empty state if none exists) —
no 403, no 404.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC035-5 (negative): A project member WITHOUT `:view_report` is denied with 403, not a silent redirect or empty page

**Priority:** P1 — the one access-control gate this feature has; the dev's own functional test asserts this exact
status code for a non-member on a public, module-enabled project
**Steps:** As a logged-in user with no role (or a role lacking `:view_report`) on a project that IS visible and
HAS the `testcase_management` module enabled, request `/projects/<id>/automation_dashboard` directly by URL.
**Expected Result:** HTTP 403 (Forbidden) — not a 200 with an empty table, not a redirect, not a 404 (404 would
incorrectly suggest the page doesn't exist rather than that access is denied).
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC035-6 (negative): An invisible/non-existent project id resolves to 404, not 403 or a crash

**Priority:** P2 — distinguishes the "project gate" (`rftc_authorize_project_read!`) from the "permission gate"
(`rftc_require_permission!`), which this controller runs in that exact order
**Steps:** As a logged-in non-admin user, request the dashboard for (a) a project id that does not exist at all,
and (b) a real but private project the user is not a member of and cannot see.
**Expected Result:** Both return HTTP 404 — never a 500 (`@project` is looked up via `find_by`, not `find`, so a
missing id must not raise `RecordNotFound`), never a 403 (403 would leak that the project exists but access is
denied, when the correct behavior for "can't even see it" is to claim it doesn't exist).
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC035-7 (negative): A visible project with the `testcase_management` module DISABLED returns 404

**Priority:** P2 — same `rftc_authorize_project_read!` gate, different failure leg (module-enabled check, not
visibility)
**Steps:** As a member of a project that is visible and where the user otherwise has `:view_report`, but with the
`testcase_management` module switched OFF in Project Settings → Modules, request the dashboard.
**Expected Result:** HTTP 404 — the module-enabled check fires before the permission check ever runs.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC035-8 (negative): An anonymous (logged-out) user is redirected to login, never sees any dashboard data

**Priority:** P1 — baseline auth gate, the dev's own functional test asserts this
**Steps:** Without logging in, request `/projects/<id>/automation_dashboard` for a real, public project with
genuine automation data.
**Expected Result:** A redirect to the login page (not a 200, not a partial/empty render of real project data) —
zero source names, counts, or any other project data appear anywhere in the response.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

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
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC035-10 (SACRED/security): Cross-project isolation — Project A's sources and executions never appear on Project B's dashboard

**Priority:** P1 — the SEC-001-shaped boundary every report in this plugin must hold; the dev's own unit test
(`test_overview_is_scoped_per_project`) already asserts this at the `RollupMath` layer directly
**Steps:** Create an `AutomationSource` and at least one CI-ingested result in Project A. Open the Automation
Dashboard for a completely different Project B that has no automation data of its own.
**Expected Result:** Project B's dashboard shows zero rows referencing Project A's source name, execution counts,
or any other data — a clean empty state (or only Project B's own genuine sources), never a cross-project leak.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC035-11: `last_seen_at` advances on a new ingestion for an existing source — it is not frozen at first-seen time

**Priority:** P2 — a dashboard whose "Last Seen" column never updates would be actively misleading for spotting a
pipeline that stopped reporting
**Steps:** Ingest a result for a source today. Note its Last Seen value. Wait (or simulate a later timestamp) and
ingest a second result for the SAME source. Reload the dashboard.
**Expected Result:** The source's Last Seen value updates to the second, later ingestion's time — it does not
stay pinned to the first ingestion's timestamp.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

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
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC035-13: Sum of all per-source execution counts (including Ungrouped) equals the project's total latest-cell count

**Priority:** P2 — an internal consistency check across the whole page, not just one row
**Steps:** In a project with a mix of CI-ingested (multiple sources) and manually-recorded (Ungrouped) results
across several runs/environments, sum every row's Executions column on the dashboard (named sources +
Ungrouped).
**Expected Result:** The total equals the project's total count of distinct `(run_id, issue_id, environment)`
latest-result cells — i.e. nothing is double-counted across sources and nothing falls through uncounted between
them. (Equivalent, cross-checkable via `RollupMath.set_based_status_tally(project.id)`'s own total row count, or
by summing that method's per-status counts, since both methods partition the exact same cell set.)
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

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
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC035-15: The Ungrouped row always sorts LAST, even if it has the highest execution volume

**Priority:** P3 — a display-ordering guarantee read directly from the code's own sort key
(`[r[:source_id].nil? ? 1 : 0, -r[:total_cells]]`)
**Steps:** Arrange for the Ungrouped bucket to have a larger total execution count than any individual named
source (e.g. many manually-recorded results, only one or two small CI-ingested sources). Open the dashboard.
**Expected Result:** Ungrouped still appears AFTER every named source in the table, regardless of its own volume
— named sources are always sorted first (by descending execution count among themselves), with Ungrouped pinned
to the bottom.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

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
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on
branch `release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

## Not Executed

Every case above is unexecuted as a whole-suite status (see the header note) — this section instead lists what
**cannot be reasoned about from the code alone** and will need deliberate live setup even once execution starts:

- **RFTC035-12's live exploit attempt** — confirming no `alert()` fires requires an actual browser session with a
  dialog listener attached (same methodology as RFTC021-9's original discovery), not just a source-reading
  argument that it's safe.
- **Performance at scale** — `automation_sources_overview` runs one indexed SQL query regardless of project size,
  so it should scale similarly to `set_based_status_tally` (already proven fine at 500+ test cases per
  `TESTCASE_MANAGEMENT_PERFORMANCE.md`), but this was not independently re-measured for this specific query shape.
- **Interaction with a source whose underlying `AutomationSource` row has been deleted** — the spec's own "Out of
  Scope" section notes there is no admin UI to delete/merge a source in this version, but `has_many
  :issue_status_results, dependent: :nullify` suggests a FUTURE admin delete path would null out `source_id` on
  its results, which would then correctly re-bucket into Ungrouped — not yet testable since no deletion UI exists
  to trigger it in this release.

## Coverage Summary

**16 designed scenarios (positive + negative), 0 executed.** This file is a pre-release test design authored
directly from the `release/7.3.0` branch's controller/view/`RollupMath` source and the developer's own
unit/functional test files (`test/unit/rollup_math_automation_overview_test.rb`,
`test/functional/automation_dashboard_controller_test.rb`), ahead of this feature's independent QA cycle.
Core coverage: per-source aggregation, the Ungrouped bucket, latest-per-cell dedup, both legs of the two-step
access-control gate (404 vs 403) plus the positive/anonymous cases, cross-project isolation, `last_seen_at`
freshness, an XSS regression probe grounded in this plugin's own prior chart-XSS incident (BUG-TCM-070), a
whole-page sum-consistency check, and two code-confirmed behavioral/UX notes (Pass Rate's non-binary-status
denominator, and the sidebar's plugin-wide no-permission-gate pattern) flagged for tester awareness rather than
assumed as bugs. No `Actual Result` has been fabricated — every case is explicitly "Not Executed" pending a real
Playwright/live pass against a running `release/7.3.0` instance.
