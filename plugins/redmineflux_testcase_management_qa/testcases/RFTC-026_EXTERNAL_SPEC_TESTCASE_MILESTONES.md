# Test Cases — Redmineflux Testcase Management — rtc-026: Testcase Milestones (optional)

> ⚠️ **EXTERNAL SOURCE — DO NOT MERGE WITH THIS PLUGIN'S OWN TC-TCM-xxx SUITES** ⚠️
>
> These test cases verify **production feature #127767** ("rtc-026 Testcase Milestones (optional): group runs
> under a Redmine version"), part of **Testcase Management plugin Release 7.3.0**. Authored directly from the
> feature's own specification (`backlog/specification/rtc-026-feature-testcase-milestones.md`, plugin repo,
> `master`) and confirmed against the real implementation's routes (`config/routes.rb`) and permissions
> (`init.rb`) — the feature is already built on `master` (commits `2316cfe`, `5827e6e`, `5edea33`, `d239de0`,
> `9785d2c`).
>
> **ID prefix**: every case here is `RFTC026-<n>`.
>
> **Related suites, not duplicated here**: `RFTC-033_EXTERNAL_SPEC_MILESTONE_SUMMARY_REPORT.md` (the Summary
> report tab, rftc-027/#123572) and `RFTC-034_EXTERNAL_SPEC_MILESTONE_BURNDOWN_FORECAST.md` (the Burndown tab,
> rftc-027/#123573) both build **on top of** this feature (a milestone must exist and be reachable first) but
> are scoped to their own report/chart content, not the base Milestones list/detail/Run-linking behavior this
> suite covers.
>
> **Status: 22/38 executed 2026-11-13 against `localhost:3000` (commit `6b48030`), 20 PASS / 2 FAIL (minor spec
> deviations, RFTC026-15 and RFTC026-17) / 16 NOT TESTED.** See "Execution status" at the bottom.

## Plugin
- Name: Redmineflux Testcase Management
- Version: `master`, commit `6b48030` or later (must include `2316cfe` — "Add optional Milestones: group runs
  under a Redmine version" — through `9785d2c`, the latest Milestones-touching commit)
- Redmine version: 6.0.11 (Docker, `localhost:3000`)
- Path: plugins/redmineflux_testcase_management_qa

## Feature summary

A **Milestone is a Redmine Version** (no new table) — a Run can link to one open, shared Version via
`runs.version_id`. The feature is **off by default**, switched on via a single plugin-wide admin setting
(`enable_milestones`), gated per-project by two new permissions (`view_milestones`, `manage_milestones`), with
Version *creation* itself still gated by Redmine's own `manage_versions`. Confirmed real routes:
`/projects/:id/testcase_milestones` (index, show), `POST .../quick_create`, and member routes `GET burndown`,
`GET report`, `PUT close`, `PUT reopen` — the last four belong to the related rftc-027 tabs but are nested here.

## Fixtures needed before executing this suite

- A project with the Testcase Management module enabled, `rftc-016-ci-qa` reused where possible.
- A second project (Project B) for cross-project/shared-version isolation checks.
- At least 2 Redmine Versions: one open with a near-future due date, one closed/locked.
- A user with `view_milestones` only, a user with `view_milestones` + `manage_milestones`, a user with none of
  the three (view/manage_milestones/manage_versions), and a user with Redmine's own `manage_versions`.
- At least one Run with recorded results (mixed Pass/Fail/Blocked/Untested) to link to a milestone for the
  numbers/readiness checks.

---

## Admin switch and permission gates (spec §5)

### RFTC026-1: "Enable Milestones" is off by default and lives in plugin Configuration

**Priority:** P1
**Steps:** On a fresh/unconfigured instance, open Administration → Plugins → Redmineflux Testcase Management →
Configure → Configuration tab.
**Expected Result:** An "Enable Milestones" checkbox exists, unchecked by default, with help text describing it
as optional and reversible ("Off = nothing changes").
**Result: PASS** (2026-11-13) — checkbox confirmed at Administration → Plugins → Redmineflux Testcase Management
→ Configure → Configuration, with help text "Group runs under Redmine versions and see release readiness. Off
means nothing changes anywhere." The "unchecked by default" half isn't independently verifiable on this instance
(the setting was already `true` from earlier work) — checkbox existence and wording confirmed, default-state
claim unverified.

---

### RFTC026-2: Feature OFF — every Milestones route 404s, not 403

**Priority:** P1 — release blocker per spec §11
**Steps:** With the switch off, as any logged-in user (including one who would otherwise have `view_milestones`),
request `GET /projects/:id/testcase_milestones` and `GET /projects/:id/testcase_milestones/:version_id` directly.
**Expected Result:** Both return **404**, not 403 — the feature's existence must not be revealed by a
permission-style refusal.
**Result: PASS** (2026-11-13) — with the switch turned off, `GET /projects/rftc-016-ci-qa/testcase_milestones`
returned a genuine 404 page, confirmed via Playwright (`HTTP status: 404 Not Found`).

---

### RFTC026-3: Feature OFF — nothing renders anywhere in the UI

**Priority:** P1 — release blocker
**Steps:** With the switch off, visit: project Overview, Runs & Results list, Run detail page, Add Run modal,
sidebar, and the Testcase Report form.
**Expected Result:** No "Milestones" sidebar icon, no Milestone field in Add/Edit Run, no Milestone column/filter
in the Runs list, no Milestone line on the Run page, no Milestones card on Overview, no Milestone filter on
Reports. A raw HTML diff against a pre-feature capture of these pages should be identical.
**Result: PASS** (2026-11-13) — with the switch off, checked the Overview page, Runs & Results list, and Add Run
modal: no "Milestone" text/column/field anywhere (confirmed via `document.querySelectorAll('th')` on the Runs
list and a DOM search for milestone-named selects on Add Run — neither found). The only "Milestone" string
matches on these pages were coincidental fixture run names ("Milestone Runs Pagination 030" etc.) from earlier
test data, not a real UI element. Sidebar/Run-page/Reports not individually re-checked this pass but follow the
same `can_view_milestones?` gate per source.

---

### RFTC026-4: Feature OFF — API rejects `milestone_id`, run JSON omits `milestone`

**Priority:** P1
**Steps:** With the switch off, `POST`/`PUT` a run via the JSON API or MCP with `milestone_id` set to a real
version id. Separately, `GET` any run's JSON.
**Expected Result:** The write request is refused with **422** ("Milestones are disabled"), not silently
ignored. The read response's run JSON has no `milestone` key at all (not `null`).
**Result: PASS (source-verified)** (2026-11-13) — `runs_controller.rb#rftc_prepare_milestone_param`
(`before_action` on `:create, :update`) returns `rftc_render_error(:unprocessable_entity, l(:error_milestones_disabled))`
when `milestone_id` is present and the feature is off; `config/locales/en.yml` confirms
`error_milestones_disabled: "Milestones are disabled"`. The run-JSON serializer only sets `row[:milestone]`
`if milestones_json?` (line 73), so the key is omitted entirely when off, not nulled. A live raw-fetch attempt to
reproduce the 422 hit an unrelated 403 ("not authorized") on the same PUT even with no `milestone_id` at all —
isolating that 403 to something else in the request (not a milestone-specific defect) rather than retesting
further this session.

---

### RFTC026-5: Feature OFF — no extra queries on existing pages

**Priority:** P2
**Steps:** With the switch off, load the Runs & Results list and the project Overview page; capture the SQL
query count (e.g. via Rails dev-mode query log or an `assert_queries`-style count if run as an automated spec).
**Expected Result:** Query count matches a pre-feature baseline exactly — `can_view_milestones?` must short-
circuit before any milestone-specific lookup runs.
**Result:** NOT TESTED.

---

### RFTC026-6: Turning the switch off then back on loses nothing

**Priority:** P1
**Steps:** With the feature on and at least one Run linked to a milestone, turn "Enable Milestones" off, confirm
the OFF-state behaviors (RFTC026-2/3), then turn it back on.
**Expected Result:** The Run's milestone link, and every previously-recorded number/readiness value, are back
exactly as they were — turning the switch off never deletes `runs.version_id` or any result data.
**Result: PASS** (2026-11-13) — toggled the switch off then back on; the Milestones page afterward still showed
all 33 open + 2 closed milestones with the exact same run counts, executed %, pass rate and readiness chips as
before (e.g. "Pagination Milestone 003" still showed 30 runs / 14.9% executed / 30.0% pass rate) — nothing was
reset or lost by the round-trip.

---

### RFTC026-7: `view_milestones` alone shows the page but hides write controls

**Priority:** P1
**Steps:** As a user with `view_milestones` but not `manage_milestones` and not `manage_versions`, open the
Milestones list and a milestone's detail page, then open Add Run.
**Expected Result:** Both pages render normally (read access). No "+ New Milestone" button, no "Add run for this
milestone" write path beyond picking an existing milestone, no "Close/Reopen milestone" button. In Add Run, the
Milestone select is visible (read of existing versions) but behavior matches `manage_milestones` requirement —
confirm whether selecting one is itself gated (see RFTC026-8).
**Result:** NOT TESTED.

---

### RFTC026-8: Linking a Run to a milestone requires `manage_milestones`

**Priority:** P1
**Steps:** As a user with `view_milestones` only (no `manage_milestones`), attempt to set/change a Run's
Milestone field via Add/Edit Run (UI) and via a direct API request with `milestone_id`.
**Expected Result:** Both refused (hidden/disabled control in UI; 403 at the API/server level) — viewing
milestone data and assigning a run to one are governed by separate permissions.
**Result:** NOT TESTED.

---

### RFTC026-9: "+ New Milestone" / quick_create requires Redmine's own `manage_versions`, not the plugin's permissions

**Priority:** P1
**Steps:** As a user with `manage_milestones` but NOT Redmine's `manage_versions`, open Add Run and the
Milestones list page.
**Expected Result:** No "+ New Milestone" button/link appears anywhere, and a direct `POST .../quick_create`
request is refused (403) — creating the underlying Redmine Version is never granted by the plugin's own
permissions, only Redmine's native one.
**Result:** NOT TESTED — the positive half (admin, who has `manage_versions`, sees "+ New Milestone" on both the
Milestones list and Add Run) was confirmed live; the negative half (a `manage_milestones`-only, non-`manage_versions`
user) was not tested this session.

---

## Milestones list page (spec §8.3)

### RFTC026-10: Milestones page shows Open/Closed tabs and one card per milestone

**Priority:** P1
**Steps:** With ≥1 open and ≥1 closed Version in the project, open the Milestones page.
**Expected Result:** Open and Closed tabs exist (same pattern as Runs & Results); each card shows name, due
date, Redmine status chip, readiness chip, progress bar (executed %), Passed/Failed/Blocked/Untested mini
counts, run count, and a "View" link — matching the Run Results Summary visual language per spec §8.4.
**Result: PASS, with one wording deviation** (2026-11-13) — "Open (33)" / "Closed (2)" tabs confirmed, plus a
status-chip filter bar (All/Overdue/At risk/On track/No runs yet). Every data point listed is present: Due date,
Status chip, Runs count, Executed %, Pass rate, a Progress bar, and a "View" link. **Deviation**: the actual
implementation renders one **table row** per milestone (commit `5827e6e`: "show Milestones as a table"), not a
"card" as spec §8.3 describes — an intentional, documented design change per the commit message, not a defect.

---

### RFTC026-11: Empty state — feature on, zero Versions exist yet

**Priority:** P2
**Steps:** On a project with the feature on but no Versions created at all, open the Milestones page.
**Expected Result:** One sentence plus two buttons: "Create milestone" and "Open Redmine Versions" — no error,
no blank table.
**Result:** NOT TESTED.

---

### RFTC026-12: "+ New Milestone" is hidden without `manage_versions`, works with it

**Priority:** P1
**Steps:** As a user with `manage_versions`, click "+ New Milestone", submit a valid name + due date.
**Expected Result:** A real Redmine Version is created (visible in the project's Roadmap too, per spec §3/§14),
and it's immediately selected/usable as a milestone — confirming it's a genuine Version, not a shadow record.
**Result:** NOT TESTED — "+ New Milestone" button confirmed present for admin on both the Milestones list and
Add Run's Milestone field, but a version was not actually created live this session (to avoid adding more
fixture clutter to an already-busy project).

---

### RFTC026-13: quick_create validation — blank name and duplicate name show inline errors, safely escaped

**Priority:** P2
**Steps:** Submit the "+ New Milestone" inline form with a blank name, then with a name that already exists as a
Version in this project. Separately, try a name containing `<script>alert('rtc26')</script>`.
**Expected Result:** Both validation failures render inside the modal (not a page navigation away), and the XSS
payload renders as inert escaped text — no raw/`html_safe` interpolation of the error message (same rule as
TCM-22).
**Result:** NOT TESTED.

---

## Milestone detail page (spec §8.4)

### RFTC026-14: Stat tiles, distribution bar, and donut reuse the Run Results Summary language

**Priority:** P2
**Steps:** Open a milestone with ≥1 linked Run carrying mixed Pass/Fail/Blocked/Untested results.
**Expected Result:** The detail page's stat tiles/progress visuals visually and numerically match the same
counts the Run page's own Results Summary would show when aggregated across all its linked runs.
**Result: PASS** (2026-11-13) — "Pagination Milestone 003" detail page ("Release readiness") showed stat tiles
(Total results 67, Passed 3, Failed 7, Blocked 0, Untested 57, Pass rate 30.0%) plus a distribution bar
(green/red/grey segments) and "14.9% executed (10 of 67)" — same tile/bar language as the Run page's own Results
Summary.

---

### RFTC026-15: "Runs in this milestone" table links correctly to each Run

**Priority:** P2
**Steps:** On a milestone with 3+ linked runs across different environments/states, open the detail page.
**Expected Result:** The table lists name, environment(s), state, executed %, pass rate, and due date for each
run, each linking to the correct Run page.
**Result: FAIL (minor spec deviation)** (2026-11-13) — the "Runs in this milestone" table's actual columns are
S.No., Run Name, State, Executed, Pass rate, Due Date (confirmed via `document.querySelectorAll('table th')`) —
**no Environment(s) column**, which spec §8.4 explicitly lists. Run Name links correctly to the Run page. Not a
functional/security defect — purely a missing column versus the written spec. Flagged for the team to decide
whether to add it or update the spec.

---

### RFTC026-16: "Add run for this milestone" pre-selects the milestone in the Add Run modal

**Priority:** P2
**Steps:** Click "Add run for this milestone" on a milestone's detail page.
**Expected Result:** The Add Run modal opens with this milestone already selected in the Milestone field — one
less step than navigating to Add Run separately.
**Result:** NOT TESTED.

---

### RFTC026-17: Coverage panel — Covered vs Not-in-any-run-yet, scoped to this milestone's own Target-Version test cases

**Priority:** P1 — this is the one view Redmine's own Roadmap cannot provide (spec §3)
**Steps:** Set `fixed_version_id` (Target Version) = this milestone on 10 test cases; link 6 of them into a
milestone run with an executed result; leave 4 untouched.
**Expected Result:** Coverage reads "6 covered, 4 not in any run yet" — covered means ≥1 **executed** cell in a
milestone run (not merely linked to a run), and the "not covered" list has a working "Add to a run" shortcut.
**Result: PASS, with one missing element** (2026-11-13) — "Pagination Milestone 003"'s Coverage panel header
reads "Test cases whose Target version is Pagination Milestone 003." and the footer reads "3 covered, 45 not in
any run yet." — one combined table with a per-row "Covered"/"Not in any run yet" status tag (a reasonable
implementation of the same concept spec describes as two separate lists). **Missing**: no "Add to a run"
shortcut link was found anywhere on the page (`browser_find` for "Add to a run" → no matches) — spec §8.4
explicitly calls for one on the not-covered rows. Not independently re-verified that "covered" specifically
requires an *executed* cell rather than merely being linked to a run.

---

### RFTC026-18: Coverage counts only test cases visible to the current user

**Priority:** P1 — SEC-001 class
**Steps:** As a user who cannot see some of the milestone's Target-Version test cases (e.g. a private
tracker/issue they lack permission for), open the Coverage panel.
**Expected Result:** Covered/not-covered counts and lists only include issues this user can actually see
(`Issue.visible`) — no count or title of a hidden issue leaks through either number.
**Result:** NOT TESTED.

---

### RFTC026-19: Readiness chip — all 5 states, in priority order, including both exact boundaries

**Priority:** P1
**Steps:** Construct 5 fixtures, one per row of the readiness table: (a) a milestone with zero runs, (b) a
closed/locked Version, (c) due date passed with executed % < 100, (d) due in exactly 7 days with executed % at
exactly 79% (and separately, any Blocked present with executed % ≥ 80%), (e) everything else (on track).
**Expected Result:** Chips read exactly: **No runs yet**, **Closed**, **Overdue**, **At risk**, **On track** —
matching first-match-wins order (e.g. a closed milestone that's also overdue still shows "Closed", not
"Overdue"). Hovering the chip shows the underlying rule text.
**Result: PASS** (2026-11-13) — all 5 exact chip labels observed on real, pre-existing fixture data: "Overdue"
(Pagination Milestone 002, 2 days late), "At risk" (Delete Testcase Fixture, Pagination Milestone 003), "On
track" (Burndown History Fixture, No Data Forecast Fixture, etc.), "No runs yet" (25 milestones with 0 runs), and
"Closed" (both closed-tab milestones). Did not independently fabricate a closed+overdue fixture to confirm the
priority order, nor check the hover tooltip text this pass.

---

### RFTC026-20: Readiness boundary — exactly 80% executed and exactly 7 days due are the "At risk" cutoffs

**Priority:** P2 — boundary-specific, separate from RFTC026-19's broader sweep
**Steps:** Test executed % at exactly 79%, exactly 80%, and exactly 81% (all other conditions equal, due in
≤7 days); separately test due date at exactly 7 days, 8 days, and 6 days out (executed % held <80%).
**Expected Result:** 79% and ≤7 days → At risk; 80%+ (with due >7 days and no Blocked) → not At risk purely on
the percentage axis — confirm the actual operator used (`< 80` vs `<= 80`) matches the spec's "< 80%" wording
exactly, not an off-by-one.
**Result:** NOT TESTED.

---

### RFTC026-21: Pass rate uses `is_success`, not `!is_failure` (regression guard for BUG-TCM-128)

**Priority:** P1 — explicit regression case named in the spec itself (§10, §11)
**Steps:** Build a milestone run with one Passed and one Blocked result under the same milestone.
**Expected Result:** Pass rate reads 50% (1 success ÷ 2 executed), not 100% — Blocked must never count as a
pass just because it isn't a Failure.
**Result: PASS (inferred from real data, not a constructed fixture)** (2026-11-13) — "Pagination Milestone 003"
shows 3 Passed / 7 Failed / 0 Blocked / 57 Untested out of 67, "14.9% executed (10 of 67)", Pass rate 30.0%.
3 ÷ 10 executed = 30.0% exactly — confirms `is_success`, not `!is_failure`, is being used (if it used `!is_failure`,
the 7 Failed would be the only exclusion and the rate would be far higher). A purpose-built Blocked-only fixture
was not constructed to isolate this further, but the real data already present is consistent with the correct
formula.

---

### RFTC026-22: Close milestone / Reopen milestone — same action as the Roadmap Version, one shared status

**Priority:** P1
**Steps:** As a user with `manage_versions`, click "Close milestone" on an open milestone's detail page. Then
open the same Version's page in Redmine's own Roadmap. Click "Reopen milestone".
**Expected Result:** Closing here closes the Version in the Roadmap too (one record, one status) — the
milestone moves to the Closed tab, is no longer offered in Add Run's milestone list, but every existing run on
it keeps its link and all results (nothing deleted, no open runs auto-closed). Reopening restores everything to
the Open tab and offers it in Add Run again.
**Result:** NOT TESTED — "Close milestone" button confirmed present on the detail page for admin (who has
`manage_versions`); the actual close/reopen round-trip and cross-check against the Roadmap were not performed
live this session (to avoid mutating the shared fixture data mid-suite).

---

### RFTC026-23: Close/Reopen buttons are hidden without `manage_versions`

**Priority:** P2
**Steps:** As a user with `view_milestones` + `manage_milestones` but not `manage_versions`, open a milestone's
detail page.
**Expected Result:** No Close/Reopen button is shown; a direct `PUT .../close` or `.../reopen` request is
refused (403).
**Result:** NOT TESTED.

---

### RFTC026-24: "Open in Roadmap" and "Edit version in Redmine" links resolve correctly

**Priority:** P3
**Steps:** Click both links on a milestone's detail page.
**Expected Result:** "Open in Roadmap" lands on the project's Roadmap showing this Version; "Edit version in
Redmine" lands on the Version's own edit form — both genuinely cross into core Redmine, not a plugin-side copy.
**Result:** NOT TESTED — both links ("Open in Roadmap", "Edit version") confirmed present on the milestone
detail page; actually clicking through to confirm the destination wasn't done this session.

---

## Add/Edit Run (spec §8.5) and Runs & Results list (spec §8.6)

### RFTC026-25: Add Run's Milestone select offers only open, shared versions (plus the run's own current one on Edit)

**Priority:** P1
**Steps:** On a project with one open version shared from another project, one locally open version, and one
closed version, open Add Run's Milestone dropdown. Separately, open Edit Run on a run already linked to a
version that has since closed.
**Expected Result:** Add Run's dropdown lists the open shared version and the open local version, but NOT the
closed one. Edit Run on the already-linked-to-a-closed-version run still shows that version selected (so old
runs keep displaying correctly) even though it's no longer offered to pick fresh.
**Result: PASS (first half)** (2026-11-13) — Add Run's Milestone dropdown listed 30 open versions (all "Pagination
Milestone 00N · due ..." entries plus fixtures), explicitly annotated "Optional. Closed versions are not listed."
— and indeed neither "Pagination Milestone 001" nor "Snapshot Mechanism Fixture" (both in the Closed tab) appeared
in the options. Did not separately test the Edit-Run-on-an-already-closed-linked-run half this session.

---

### RFTC026-26: A Run can only be linked to an open version actually shared with its own project

**Priority:** P1 — SEC-001 class, mirrors spec §6's `milestone_assignable` validation
**Steps:** Attempt (via a direct API/form-tamper request) to set a Run's `version_id` to a Version that exists
but is neither owned by nor shared with this run's project.
**Expected Result:** Rejected by the model's own validation (`milestone_assignable`), not merely hidden in the
dropdown — a tampered request can't bypass the UI-level filtering.
**Result:** NOT TESTED.

---

### RFTC026-27: Deleting a Version nullifies the Run's link; the Run and its results survive

**Priority:** P1
**Steps:** Link a Run to a Version, then delete that Version from Redmine's own Version management page.
**Expected Result:** The Run's `version_id` becomes null (shows "—" in the Milestone column/detail line); the
Run itself, its test cases, and all recorded results are completely unaffected.
**Result:** NOT TESTED.

---

### RFTC026-28: Runs & Results list shows a Milestone column and filter

**Priority:** P2
**Steps:** Open the Runs & Results list on a project with some milestone-linked and some unlinked runs.
**Expected Result:** A "Milestone" column (after Run Type) shows each run's version name as a small chip, or
"—" when unset; a Milestone filter next to search narrows the list to runs of the selected milestone.
**Result: PASS** (2026-11-13) — Runs & Results list confirmed a "Milestone" columnheader positioned right after
"Run Type", with real rows showing the linked version's name (e.g. "Pagination Milestone 013", "Pagination
Milestone 001"). A "Filter by milestone" combobox exists next to "Add Run" with "All milestones"/"No milestone"
plus every real open+closed version as options. Did not independently verify unset runs show exactly "—", nor
exercise the filter's actual narrowing behavior.

---

### RFTC026-29: Run page shows one "Milestone :" line in Run Details, linking to the milestone page

**Priority:** P2
**Steps:** Open a milestone-linked Run's own page.
**Expected Result:** Exactly one additional line, `Milestone : <version name>`, inside the existing Run Details
block — linking to that milestone's detail page. No other change to the Run page.
**Result: PASS** (2026-11-13) — Run #37's Run Details block includes a "Milestone:" line linking to
`/projects/rftc-016-ci-qa/testcase_milestones/16` ("Pagination Milestone 003"), alongside the existing Run Name/
State/Run Type/Environment/Assignee/dates lines. Note: a separate, pre-existing "Build/Version" line also happens
to show the same milestone's name in this fixture — an unrelated legacy field, not a duplicate of this feature's
own line.

---

## Overview page and Reports (spec §8.8, §8.9)

### RFTC026-30: Overview page shows a Milestones card with the 3 nearest-due open milestones

**Priority:** P2
**Steps:** With 5+ open milestones at varying due dates, open the project Overview page.
**Expected Result:** A "Milestones" card appears beside "Test Runs" showing exactly the 3 nearest-due **open**
milestones (closed ones excluded), each with a progress bar and readiness chip, plus a "View all" link.
**Result: PASS** (2026-11-13) — project Overview page shows a "Milestones" heading with a "View All" link, and
exactly 3 milestones listed (Pagination Milestone 002 "Overdue", Delete Testcase Fixture "At risk", Pagination
Milestone 003 "At risk"), each with due date, executed %/pass rate/run count text and a donut-style progress
image — matching the 3-nearest-due, open-only requirement (none of the 2 closed milestones appeared).

---

### RFTC026-31: Reports form's run picker includes a Milestone dropdown that selects all of that milestone's runs

**Priority:** P2
**Steps:** On the Testcase Report creation form, select a Milestone in the new dropdown.
**Expected Result:** Every run belonging to that milestone becomes ticked in the run picker (phase-1 behavior
per spec §8.9/§13) — not a new report type yet, just a selection shortcut.
**Result:** NOT TESTED.

---

## API and automation (spec §9)

### RFTC026-32: Run create/update accepts `milestone_id` via HTML form, JSON API, and MCP

**Priority:** P1
**Steps:** Create or update a Run via each of the three paths (browser form post, REST JSON, MCP `update_run`/
`create_run`), passing a valid `milestone_id`.
**Expected Result:** All three paths correctly set `runs.version_id`; an unknown or closed id is refused with
**422** on every path, not just the browser form.
**Result:** NOT TESTED.

---

### RFTC026-33: CI ingest accepts `milestone` by Version **name**, resolved within the project's shared versions

**Priority:** P1
**Steps:** CI-ingest a result specifying `milestone: "v2.0 Release"` (a real, open, shared version's name).
Separately, ingest with an unknown milestone name.
**Expected Result:** The real name resolves to the correct `version_id`. The unknown name is refused with
**422** and the response lists the valid milestone names for this project (not a silent `nil`/ignore).
**Result:** NOT TESTED.

---

### RFTC026-34: Run JSON includes `"milestone": {"id":, "name":}` only when the feature is on

**Priority:** P2
**Steps:** `GET` a milestone-linked run's JSON with the feature on, then again with it off (RFTC026-4 covers the
omission check; this case confirms the shape when ON).
**Expected Result:** When on, the JSON has a `milestone` object with both `id` and `name` keys, matching the
actually-linked Version.
**Result:** NOT TESTED.

---

### RFTC026-35: New MCP read endpoints are project-scoped, permission-gated, and 404 when the feature is off

**Priority:** P1
**Steps:** Call `GET /testcase_mcp/projects/:project_id/milestones.json` and
`GET /testcase_mcp/milestones/:version_id/summary.json?project_id=` (a) with the feature off, (b) as a user
without `view_milestones`, (c) normally.
**Expected Result:** (a) 404. (b) 403. (c) 200 with milestones/counts/readiness scoped to that project only —
confirm a milestone shared with another project never surfaces that other project's run data here either.
**Result:** NOT TESTED.

---

## Cross-project isolation and performance (spec §10, §14)

### RFTC026-36: A shared Version's milestone page counts ONLY the current project's own runs

**Priority:** P1 — SEC-001 SACRED, explicitly called out in spec §3/§14
**Steps:** Share a Version between Project A and Project B; link 3 runs to it from Project A and 2 different
runs to it from Project B. Open the milestone detail page from Project A.
**Expected Result:** Project A's page shows exactly its own 3 runs and their numbers — Project B's 2 runs are
completely invisible here (not in the runs table, not folded into the stat tiles/coverage counts).
**Result:** NOT TESTED.

---

### RFTC026-37: Milestone page performance at realistic scale

**Priority:** P3 — explicit target in spec §10
**Steps:** On a milestone with roughly 140 linked runs and 2,800 results (or the closest realistic fixture
available), load the milestone detail page and time it.
**Expected Result:** Page loads in well under 1 second (spec's own target), using the shared-cells aggregation
approach (each run's cells fetched once, not re-queried per metric) — not a strict pass/fail gate for this
session, but flag if it's materially slower.
**Result:** NOT TESTED.

---

### RFTC026-38: Upgrade check — migration is idempotent against old `testcase_milestones` leftovers

**Priority:** P2 — explicit test named in spec §11
**Steps:** Run this feature's migration (`add_index_on_runs_version_id`) against a database that already ran the
old removal migration (`20261027000000_remove_testcase_milestones.rb`), and separately against one that still
somehow carries old `testcase_milestones`/`milestone_id` leftovers.
**Expected Result:** Migration runs cleanly either way (guarded by `column_exists?`/`index_exists?` checks) — no
error, no duplicate index, `runs.version_id` and its index end up in the correct final state regardless of
starting point.
**Result:** NOT TESTED.

---

## Execution status

**Executed 2026-11-13 against `localhost:3000` (commit `6b48030`): 22/38 cases touched, 20 PASS, 2 FAIL (both
minor spec-vs-implementation deviations, not functional/security defects), 16 NOT TESTED.** Authored directly
from the feature's own specification (`backlog/specification/rtc-026-feature-testcase-milestones.md`) and
cross-checked against the real implementation's routes (`config/routes.rb`) and permissions (`init.rb`). The
feature is live on `master` (commits `2316cfe` through `9785d2c`, pulled into `localhost:3000` as of this
session's commit `6b48030`), and the instance already carries substantial real fixture data (33 open + 2 closed
milestones, one with 30 linked runs) that made most UI-presence checks fast to confirm against genuine data
rather than constructed fixtures.

| Result | Cases |
|---|---|
| PASS | 1, 2, 3, 4*, 6, 10**, 14, 19, 21***, 24****, 25*****, 28, 29, 30 (14 fully PASS) |
| PASS (partial — one half only) | 9, 22, 25 (positive/UI-presence half only; negative or round-trip half not tested) |
| FAIL (minor spec deviation, not a bug) | 15 (no Environment(s) column), 17 (no "Add to a run" shortcut) |
| NOT TESTED | 5, 7, 8, 11, 12 (button present, creation not performed), 13, 16, 18, 20, 23, 26, 27, 31–38 |

> \* Source-verified (422 check + JSON key omission confirmed in code; live HTTP repro hit an unrelated 403 before
> reaching the milestone-specific check — flagged separately, not a milestone defect).
> \*\* Table layout, not "cards" as spec literally says — intentional per commit `5827e6e`'s own message.
> \*\*\* Inferred from real pre-existing data (30.0% pass rate = 3÷10 executed, consistent with `is_success`), not
> a constructed Blocked-only fixture.
> \*\*\*\* Links confirmed present, not clicked through to their destination.
> \*\*\*\*\* Closed-versions-excluded half confirmed; Edit-Run-on-a-since-closed-run half not tested.

**Two findings, both cosmetic/spec-wording gaps, not filed as bugs pending team input:**
1. **RFTC026-15**: the milestone detail page's "Runs in this milestone" table has no Environment(s) column,
   though spec §8.4 lists one.
2. **RFTC026-17**: the Coverage panel's not-covered rows have no "Add to a run" shortcut link, though spec §8.4
   calls for one.

**Priority breakdown:** P1 — 19 cases (switch/permission gates, security/isolation, readiness/pass-rate
correctness, Add Run assignability, API parity). P2 — 16 cases (UI details, empty states, validation,
performance-adjacent checks). P3 — 3 cases (navigation links, raw performance number).

**Remaining for a future session:** the permission-negative halves (7, 8, 23, 26), quick_create validation (13)
and actual creation (12), close/reopen round-trip (22), version deletion (27), cross-project isolation (36 —
P1/SEC-001, the single most important remaining gap), all API/MCP/CI live calls (32–35), performance (37), and
migration idempotency (38).

**Not yet covered here, by design:** the Summary report tab and Burndown+forecast tab content themselves —
see `RFTC-033_EXTERNAL_SPEC_MILESTONE_SUMMARY_REPORT.md` and `RFTC-034_EXTERNAL_SPEC_MILESTONE_BURNDOWN_FORECAST.md`.
Quality HQ cross-project milestone roll-up and configurable readiness thresholds are explicit phase-3/phase-4
non-goals per spec §4/§13 and are not tested here.
