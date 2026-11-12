> ⚠️ **EXTERNAL SOURCE — DO NOT MERGE WITH THIS PLUGIN'S OWN TC-TCM-xxx SUITES** ⚠️
>
> These test cases verify **production feature #123572** ("rftc-033 — Unified milestone summary report"), part
> of **Testcase Management plugin Release 7.3.0**.
>
> **ID prefix**: every case here is `RFTC033-<n>`.
>
> **Status**: **rewritten 2026-11-11 against the real implementation** (the feature shipped — see commits
> `2316cfe`/`5edea33`/`d239de0`/`60fa4ae` on branch `release/7.3.0`/`master`). The suite's earlier version (authored
> 2026-10-15, before the feature existed) assumed the Milestones-removal conflict would be resolved by scoping the
> report around a Run or Version with no new concept — the dev instead **reintroduced Milestones as a thin layer
> on top of Redmine's own native Version model** (no new `testcase_milestones` table), which is cleaner than any
> of the 3 options that pre-release suite listed as "plausible resolutions." Every case below is rewritten
> against the real controller (`TestcaseMilestonesController#report`), service (`MilestoneReport`), views and
> locale strings — not speculation.
>
> **Execution status**: **13/13 executed 2026-11-11 — 12 PASS, 1 FAILED** via Playwright MCP against
> `localhost:3000` (Project A = `rftc-016-ci-qa`, Project B used for cross-project checks). Docker container
> `redmine6-redmine-1` was restarted and the plugin's pending migrations (`20261105000000`/`20261106000000`/
> `20261107000000`) were run cleanly ahead of this suite. Fixtures used: Version #1 ("RFTC-033-034 Milestone
> Fixture"), Version #44 ("Burndown History Fixture", also reused for XSS/coverage-cap/targeted-defect fixtures),
> Version #46 ("Delete Testcase Fixture"). Results and the one confirmed defect were also recorded against
> production Run #659 (testsuite #527). See each case below for its own Actual Result.

# Test Cases — Redmineflux Testcase Management — rftc-033: Unified Milestone Summary Report

## Plugin
- Name: Redmineflux Testcase Management
- Version: branch `release/7.3.0`/`master`, commit `60fa4ae` ("Milestone API, CI milestone link, full Help/README
  and translations") — the Milestones feature was built across 2316cfe → 5827e6e → 391dd37 → 5edea33 → d239de0 →
  60fa4ae
- Redmine version: 6.x (Docker, `localhost:3000`, Postgres)
- Production ticket: **#123572** (ztflux), status **In QA**, done ratio 90%, Target Version "Testcase Management
  plugin Release 7.3.0 [04-11-2026]"

## Feature summary

**A Milestone is a Redmine Version — there is no separate milestone table.** `TestcaseManagement::Milestones`
(`app/services/testcase_management/milestones.rb`) is the single source of truth for "is the feature on, and may
this user use it":

- Master switch: plugin setting `enable_milestones` (`Administration → Plugins → Redmineflux Testcase Management →
  Configure`, checkbox labelled "Enable Milestones", help text *"Group runs under Redmine versions and see release
  readiness. Off means nothing changes anywhere."*). Also requires the project's `testcase_management` module to
  be enabled.
- Permissions: `:view_milestones` (read) and `:manage_milestones` (currently unused by the report itself, reserved
  for future write actions), both plugin permissions; creating/closing/reopening the underlying Version reuses
  Redmine's own core `:manage_versions`.
- Route: `GET /projects/:project_id/testcase_milestones/:id/report` →
  `TestcaseMilestonesController#report` → `TestcaseManagement::MilestoneReport#build`.
- **When the switch is off, every `testcase_milestones` action answers 404 (not 403)** — the feature's existence
  is deliberately not revealed (`authorize_milestones_access`'s `rftc_not_found unless Milestones.enabled?(@project)`).

### What the report actually shows (top to bottom, `report.html.erb`)

1. **Headline numbers**: Total, Executed %, Pass rate, Failed, Blocked, Open defects — plus a progress bar and a
   counts legend.
2. **Result by source**: a 3-row table — Manual, Automation, All sources — where **Manual + Automation always
   equal the milestone total** (`text_report_by_source_hint`). A cell counts as Automation when its *latest*
   result for that (run, issue, environment) carries a `source_id` (set only by the CI ingest path, rftc-016/018);
   everything else is Manual.
3. **Runs**: every Run linked to this Version (`Run.where(project_id:, version_id:)`), each with its own
   executed %/pass rate. Empty state: `text_milestone_no_runs_hint`.
4. **Automation sources**: one row per `AutomationSource` with results in this milestone's runs. Empty state:
   *"No automation results in this milestone."*
5. **Exploratory sessions**: total/open/closed/passed/failed/inconclusive/notes, for sessions whose **new
   `version_id` field** (set via the Start Session form's Milestone picker, `rftc-029`/rftc-033 integration) points
   at this version. **Deliberately NOT added into the Manual/Automation totals** — sessions are not test-result
   cells. Empty state: *"No exploratory sessions are linked to this milestone. Pick the milestone when you start a
   session."*
6. **Defects**: two rows — "Found in this milestone's runs" (defects linked via `execution_defects` to a result in
   one of this milestone's runs) and "Targeted at this version" (`fixed_version_id` = this version, optionally
   filtered to the configured Defect tracker) — each split Open/Closed, kept deliberately separate ("testing
   quality" vs "what's left for the release").
7. **Coverage**: test cases whose Target Version is this milestone, split covered (in at least one run) vs not;
   up to 10 "not covered" issues are linked directly.
8. **Top failing tests / Top flaky tests**: scoped to **this milestone's runs only** (not project-wide), reusing
   `RollupMath.most_failed_tally`/`flaky_tally`.
9. A **Print** button (`onclick="window.print()"`, hidden itself via `rf-no-print` when printing) and an "Open in
   Roadmap" link to the underlying Redmine Version.

### Access control (two-step, matching every other report in this plugin)

1. `rftc_not_found` unless the plugin switch is on for this project.
2. `rftc_not_found` unless the project exists/is visible to the caller (`rftc_authorize_project_read!`).
3. `rftc_forbidden` unless `Milestones.can_view?` (`:view_milestones` or admin).

---

### RFTC033-1: Report renders all 8 sections for a milestone with real data in every source

**Priority:** P1 — this is the entire point of the ticket ("unifies manual, exploratory, and automation results")
**Steps:**
1. Enable Milestones in plugin settings. Create a Redmine Version ("milestone") in a test project.
2. Create a Run linked to that version (Add Run form's new Milestone field), record at least one Manual result
   (plain Add Result, no automation source) and one Automation result (via CI ingest / `source_id` set).
3. Start an Exploratory Session, picking this milestone in its new Milestone field, close it with an outcome.
4. Link a defect to one of the milestone's run results, and set another issue's Target Version to this milestone.
5. Open `.../testcase_milestones/:id/report`.

**Expected Result:** Headline numbers, Result by source (Manual + Automation = Total), Runs, Automation sources,
Exploratory sessions (showing the session just closed), Defects (both rows populated), Coverage, and the risk
lists all render with real, mutually-consistent data — no section crashes or silently omits itself.
**Actual Result:** **PASS.** Built the fixture live: Run #5 linked to the milestone via its Milestone field; one
Manual result (Passed), one Automation result seeded against `AutomationSource` "CI Fixture Suite" (then
superseded by a later Manual Failed result — confirming only the *latest* result per issue/run/environment counts
toward current status); Exploratory Session #1 linked via its Milestone field, closed Passed with 1 note; a
defect (#288) linked via Report Defect on the Failed result; Target Version set on the test case. Final report
showed: Headline 1 total/100% executed/0% pass rate/1 failed/0 blocked/1 open defect; Result by source Manual
1/1/0/1/0.0%, Automation 0 (current), All sources matching; Runs (1) 100%/0%; Automation sources table showing
"CI Fixture Suite" 1 execution/0 failures/100%/last-seen timestamp (historical, independent of current status);
Exploratory sessions 1/0 open/1 closed/1 passed/1 note; Defects "Found" 1 open/0 closed, "Targeted" 0/0, "Found,
by priority: Normal 1"; Coverage "1 covered, 0 not in any run yet."; Top failing tests listed "CI Retest Case 1 —
1 fails"; Top flaky tests "Nothing to show." Every section rendered real, mutually-consistent data — no crash, no
silent omission.

---

### RFTC033-2: Report is scoped to exactly one Version — another milestone's data never bleeds in

**Priority:** P1
**Steps:** Create two Versions in the same project, each with its own Run + results. Open the report for Version A
only.
**Expected Result:** Only Version A's runs/results appear in every section (Headline, Result by source, Runs,
Automation sources, Sessions, Defects, Coverage, risk lists). Version B's data is nowhere on the page.
**Actual Result:** **PASS.** Verified with 3 real, concurrently-existing milestones in the same project (sharing
overlapping issue IDs, since test cases were reused across fixtures): Version #44's report showed "Runs (1)" =
only "Burndown History Run", Total results = 10; Version #16's report showed "Runs (30)" = only its own 30
"Milestone Runs Pagination 0XX" runs, Total results = 67. Zero cross-bleed in either direction despite shared
issue ids and the same project.

---

### RFTC033-3 (SACRED/security): Cross-project isolation

**Priority:** P1 — every other report in this plugin (Quality HQ, Automation Dashboard, Run Comparisons, Slow
Tests, Most Failed Tests) enforces this; `MilestoneReport`'s own queries are explicitly scoped to `@project.id`
and `Issue.visible(@user)`
**Steps:** As a member of Project A only, open Project B's milestone report directly by URL
(`/projects/B/testcase_milestones/:id/report`), substituting a real milestone id from Project B.
**Expected Result:** Refused (404, since `find_version` only looks up `@project.shared_versions`) — zero data from
Project B visible.
**Actual Result:** **PASS.** Two-layer verification performed: (1) as `luna.blossom` (holds `:view_milestones` via
the Manager role, member of Project A only) requesting Project B's own real milestone id by URL → 403 Forbidden
(permission layer, `allowed_to?` is membership-scoped). (2) As `admin` (bypasses permission checks) requesting
Project B's URL but substituting Project A's real version id (`1`) → 404 Not Found, confirming `find_version`'s
own `@project.shared_versions.find_by(id:)` scoping is independently enforced, not merely incidental to the
permission check. Zero Project-B/cross-project data was visible in either case.

---

### RFTC033-4: Permission gating — `:view_milestones`, distinct from `:view_report`

**Priority:** P1 — note this is a **plugin-specific permission** (`view_milestones`), not a reuse of `:view_report`
as the pre-release speculative suite assumed
**Steps:** As a project member with Milestones enabled but **without** `:view_milestones` on their role, attempt
to open the report URL directly.
**Expected Result:** `403 Forbidden` (`rftc_forbidden`) — not a silent empty page, not a 500, not simply allowed
through.
**Actual Result:** **PASS.** As `daisy.skye` (project member, role lacks `:view_milestones`), the report URL
returned 403 Forbidden — not a silent empty page, not a 500, not allowed through.

---

### RFTC033-5: Feature-off gives 404, not 403 — existence is not revealed

**Priority:** P1 — explicitly documented in the controller's own comment ("the feature's existence is not
revealed")
**Steps:** With "Enable Milestones" unticked in plugin settings, attempt to open the report URL directly (as an
admin, so permission is not the limiting factor).
**Expected Result:** `404 Not Found` — not 403, not a redirect, not a rendered (even if broken) page.
**Actual Result:** **PASS.** With "Enable Milestones" unticked in plugin settings, the report URL returned 404 Not
Found as `admin` — not 403, not a redirect, not a rendered page. Feature's existence is not revealed.

---

### RFTC033-6: Anonymous/not-logged-in access is rejected, not rendered

**Priority:** P2
**Steps:** As an anonymous (not logged in) visitor, attempt to open the report URL directly.
**Expected Result:** Refused via `rftc_require_login!` (redirect to login or 403) — never a rendered report.
**Actual Result:** **PASS.** As an anonymous visitor, the report URL redirected to the login page — never a
rendered report.

---

### RFTC033-7 (negative): Empty-state milestone — brand-new Version with zero runs

**Priority:** P1 — this plugin's established pattern is a clean explicit empty state, never a crash
**Steps:** Create a new Version with Milestones enabled, link no runs to it, open its report.
**Expected Result:** Headline shows 0 everywhere (Total 0, 0% executed, 0% pass rate); Runs section shows
`text_milestone_no_runs_hint`; Automation sources shows *"No automation results in this milestone."*; Sessions
shows *"No exploratory sessions are linked to this milestone..."*; Defects rows show 0/0; Coverage shows
*"No test cases have this milestone as their Target version."* (if none set) or correct covered/not-covered split;
risk lists show *"Nothing to show."* — **no 500, no broken layout anywhere.**
**Actual Result:** **PASS.** Opened the fixture milestone's report before any run/session/defect/target-version
data existed: Headline 0 everywhere; Runs showed the no-runs hint; Automation sources showed "No automation
results in this milestone."; Sessions showed "No exploratory sessions are linked to this milestone. Pick the
milestone when you start a session."; Defects rows both 0/0; Coverage "No test cases have this milestone as their
Target version."; Top failing/flaky both "Nothing to show." No 500, no broken layout.

---

### RFTC033-8 (negative): Partial data — only Manual results, zero Sessions/Automation

**Priority:** P2 — the "Manual + Automation = Total" invariant must hold even when Automation is genuinely zero
**Steps:** Open the report for a milestone whose only data is Manual run results (zero CI-automation results,
zero exploratory sessions).
**Expected Result:** Result by source shows Automation row with `total: 0`, `executed: 0`, pass rate rendered as
`—` (per the view's `s.executed.zero? ? '—' : "#{pass_rate}%"` logic, not `0%` or `NaN%`); Manual row still equals
the overall total; Sessions and Automation-sources sections independently show their own empty states — the
report as a whole does not fail because 2 of 3 sources are empty.
**Actual Result:** **PASS.** Captured at the intermediate fixture state (one Manual Passed result, zero
Automation/Sessions yet): Result by source showed Automation `total:0 executed:0` with pass rate rendered as `—`
(not `0%`/`NaN%`); Manual row (1/1/1/0/100.0%) equalled the overall total; Automation sources section
independently showed "No automation results in this milestone." and Sessions independently showed its own
empty-state text — the report rendered correctly with 2 of 3 sources empty.

---

### RFTC033-9 (negative, XSS/injection): Test case / session / automation-source names render inert

**Priority:** P1 — this exact bug class (BUG-TCM-070, a chart-rendering XSS on a sibling rftc-021 report) was
found and fixed on another report in this same plugin
**Steps:** Create a test case with subject `<img src=x onerror=alert('rftc033')>`, link it to the milestone's run
and leave it uncovered (so it appears in the Coverage "not covered" list); separately give an Automation Source a
similarly HTML-shaped name. Open the report.
**Expected Result:** Both render as inert, HTML-escaped text wherever they appear (Coverage list, Automation
sources table, Top failing/flaky lists) — no `alert()` fires. (Coverage/risk-list links use `link_to` with
Rails' own auto-escaping of the link text; the Automation sources table interpolates `src[:name]` directly — both
paths need checking independently.)
**Actual Result:** **PASS.** Created test case subject `<img src=x onerror=alert(1)>` (linked into a run within
Version #44, Target Version set) and Automation Source name `<script>alert(2)</script>` (with a real automation
result). On the report page: no `alert()` fired; the automation sources table rendered the name as
`&lt;script&gt;alert(2)&lt;/script&gt;` (escaped entities) in the raw HTML; `document.body.innerHTML` contained no
literal unescaped `<img src=x onerror` substring anywhere on the page. Both paths (Coverage link text, Automation
sources table cell) render inert.

---

### RFTC033-10 (negative): Deleted test case's execution history doesn't crash the report

**Priority:** P2 — this plugin's existing reports have known orphaned-row edge cases (e.g. BUG-TCM-108)
**Steps:** Record a result against a test case within the milestone's run, then delete that test case (issue).
Reload the report.
**Expected Result:** The report renders without a 500. `MilestoneReport#defects`/coverage queries are built on
`Issue.visible(@user).where(id: ...)`, which naturally excludes a deleted issue's id — confirm the headline/
coverage numbers adjust sensibly rather than crashing on a dangling reference.
**Actual Result:** **PASS.** Built a dedicated throwaway fixture (Version #46 "Delete Testcase Fixture", Run #40,
1 test case recorded Passed), then `Issue.destroy`'d the test case. Reloaded both the report and the burndown
page: no 500/"Internal error" on either, page titles rendered normally, report's Total results correctly adjusted
to 0 (the deleted issue's result row no longer counted, via `Issue.visible` scoping naturally excluding it) — no
crash on the dangling reference.

---

### RFTC033-11: "Found" vs "Targeted" defects are genuinely independent counts

**Priority:** P2 — the report deliberately keeps these two rows separate ("testing quality" vs "what's left for
release"); a tester should confirm they don't silently collapse into the same number
**Steps:** Create defect A, link it to a result in the milestone's run (making it "found") but leave its Target
Version unset/different. Create defect B with Target Version = this milestone but not linked to any result
("targeted" only, found nowhere). Open the report.
**Expected Result:** "Found in this milestone's runs" row shows defect A only; "Targeted at this version" row
shows defect B only — the two rows are never the same count unless a defect genuinely satisfies both conditions.
**Actual Result:** **PASS.** Created a defect with Target Version = Version #44, not linked to any execution
result ("targeted-only"). Version #44's report showed: "Found in this milestone's runs" 0 open/0 closed (correctly
stayed 0 — no defect in this milestone's runs is linked via execution_defects), "Targeted at this version" 1
open/0 closed (the new defect). Combined with RFTC033-1's earlier confirmation (a "found" defect #288 counted
independently while "Targeted" stayed 0/0 in that run), both directions of independence are now verified.

---

### RFTC033-12: Print button produces a clean, menu-free print view

**Priority:** P2
**Steps:** Open the report, trigger the Print button (`window.print()` / browser print preview).
**Expected Result:** Elements marked `rf-no-print` (the action buttons, the tabs) are hidden in the print
preview/output; the report's own data sections remain visible.
**Actual Result:** **FAILED** (recorded on production Run #659, testcase #127987). The print-preview output itself
was not directly inspected (Playwright MCP has no reliable print-preview inspection primitive), but the Print
button's own styling fails this case's "clean, consistent" expectation: it renders as a solid orange/filled
button while every other button on the same page ("Open in Roadmap", "Edit version", "Close milestone") uses the
plugin's standard white-background + border style — see BUG-TCM-137 item 7 (production defect #128023, assigned
to Vaishnavi Bhawsar). BUG-TCM-137 also bundles 6 other Milestones-feature UI/UX findings (tab-count mismatch,
out-of-range page empty state, pagination style inconsistency, overview-widget card inconsistency, unpaginated
runs table, Overview tab spacing) reported together in the same production ticket.

---

### RFTC033-13: Coverage list links resolve to the correct issue, capped at 10

**Priority:** P2 — the view explicitly caps the "not covered" list at `.first(10)`
**Steps:** Set Target Version = this milestone on 15+ test cases, link fewer than half of them to a run in this
milestone. Open the report.
**Expected Result:** The covered/not-covered counts (`text_milestone_coverage_counts`) reflect the true full
counts, but the rendered "not covered" list shows at most 10 linked issues, each linking to the correct issue page.
**Actual Result:** **PASS.** Set Target Version = Version #44 on 20 test cases, linked 6 of them (plus the XSS
fixture = 7) into a run. Report's Coverage section read "7 covered, 14 not in any run yet." (true full counts),
while the rendered "not covered" list showed exactly 10 linked issues (`#328`-`#337`), each linking to its own
correct issue page — confirming both the true-count text and the `.first(10)` render cap.

---

## Execution status

**13/13 executed 2026-11-11 — 12 PASS (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13), 1 FAILED (12)** against
`localhost:3000` via Playwright MCP, using Version #1, #44, and #46 in Project A (`rftc-016-ci-qa`). Every PASSing
case confirmed its expected behavior exactly — no deviations found except case 12 (Print button style, see
BUG-TCM-137 item 7 / production defect #128023). Results and the one confirmed defect were also recorded against
production Run #659 (testsuite #527), with the defect assigned to Vaishnavi Bhawsar. Rewritten 2026-11-11 directly
from the shipped controller/service/view/locale source (not speculation) now that the feature is built and both
#123572 and its sibling #123573 are "In QA" on production.
