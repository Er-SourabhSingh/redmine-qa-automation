> ⚠️ **EXTERNAL SOURCE — DO NOT MERGE WITH THIS PLUGIN'S OWN TC-TCM-xxx SUITES** ⚠️
>
> These test cases verify **production feature #123573** ("rftc-034 — Milestone burndown + automatic forecast"),
> part of **Testcase Management plugin Release 7.3.0**.
>
> **ID prefix**: every case here is `RFTC034-<n>`.
>
> **Status**: **rewritten 2026-11-11 against the real implementation** (branch `release/7.3.0`/`master`, commit
> `5edea33` "Add a burndown chart with a finish-date forecast to each milestone", later `60fa4ae`). The feature
> shares its "Milestone = Redmine Version" model and access-control pattern with sibling rftc-033 — see that
> suite's own header for the full resolution story of the pre-release Milestones-removal conflict.
>
> **Execution status**: **13/13 executed 2026-11-11 — all PASS** via Playwright MCP against `localhost:3000`
> (plus 2 cases verified via a direct call to the real, shipped `MilestoneBurndown.forecast` class method — see
> cases 7/8). Fixtures used: Version #1 ("RFTC-033-034 Milestone Fixture"), #44 ("Burndown History Fixture",
> multi-day backdated execution history via `rails runner`), #45 ("Snapshot Mechanism Fixture"), #46 ("Delete
> Testcase Fixture"), #47 ("No Data Forecast Fixture"). Docker container `redmine6-redmine-1` was restarted and
> the plugin's pending migrations were run cleanly ahead of this suite (including
> `20261106000000_create_testcase_milestone_snapshots`, the table this feature's daily history depends on). See
> each case below for its own Actual Result.

# Test Cases — Redmineflux Testcase Management — rftc-034: Milestone Burndown + Automatic Forecast

## Plugin
- Name: Redmineflux Testcase Management
- Version: branch `release/7.3.0`/`master`, commit `60fa4ae`
- Redmine version: 6.x (Docker, `localhost:3000`, Postgres)
- Production ticket: **#123573** (ztflux), status **In QA**, done ratio 90%, Target Version "Testcase Management
  plugin Release 7.3.0 [04-11-2026]"

## Feature summary

A per-milestone (per-Redmine-Version) burndown chart with an automatic completion forecast, implemented in
`TestcaseManagement::MilestoneBurndown` (`app/services/testcase_management/milestone_burndown.rb`) and served by
`TestcaseMilestonesController#burndown` (`GET /projects/:project_id/testcase_milestones/:id/burndown`). Same
access-control pattern and `enable_milestones`/`:view_milestones` gating as the sibling Summary Report
(rftc-033) — see that suite for the full detail; not repeated here except where burndown-specific.

### The math (exact, from source — use these to construct precise test fixtures)

- **scope(day)** — count of test-result "cells" (run × test case × environment) in the milestone's runs, as of
  that day. Read from the daily snapshot (`TestcaseMilestoneSnapshot`) where one exists for that exact date;
  otherwise **estimated** from each run's `created_at` date (the plugin never recorded exactly when a run was
  attached to a version, so history before snapshots began is an estimate — the page says so,
  `text_burndown_estimated`).
- **executed(day)** — cells whose *first* non-Untested/non-Skipped result was created on or before that day. A
  retested cell is counted once (by its first executed date, not its latest).
- **remaining(day)** = scope(day) − executed(day).
- **ideal(day)** — straight line from the scope at the start date down to 0 on the due date. Only computed when
  `due_on` is set and `due_on > start_on`.
- **velocity** = distinct cells whose first-executed date falls in the trailing 7 calendar days (today − 6 .. today),
  divided by 7. **Note: the denominator is always 7**, even if fewer than 7 days of history exist yet.
- **forecast_on** = today + `ceil(remaining_today / velocity)` days.
- **State** (`MilestoneBurndown.forecast`, independently unit-testable without a DB):
  - `remaining <= 0` → **`:done`** ("All tests of this milestone are executed.")
  - `velocity <= 0` OR fewer than **3 distinct days** have an execution → **`:no_data`** ("not enough data")
  - no `due_on` set → **`:no_due`** (forecast shown, but no on-track/late judgement)
  - `due_on` set: `late_days = forecast_on − due_on`
    - `today > due_on` → **`:late`** (due date has already passed)
    - `late_days <= 0` → **`:on_track`**
    - `0 < late_days <= 3` → **`:at_risk`**
    - `late_days > 3` → **`:late`**
  - Milestone closed → **`:closed`** regardless of the above (forecast suppressed: *"This milestone is closed, so
    no forecast is shown."*)
- **Snapshot write-on-view**: opening the burndown page writes **today's** snapshot row (one per project+version+day,
  unique-indexed) for any **open** milestone with at least one run — `calculator.snapshot!`, called unconditionally
  on every page view, is how history accumulates with no scheduled job.
- **`:no_runs` state** — a milestone with zero linked runs shows no chart at all:
  *"Link a run to this milestone to see the burndown."*

### Page elements to verify

- A readiness chip (shared with the Summary report / Milestones list).
- A one-sentence forecast summary matching the computed state exactly (`text_burndown_on_track` /
  `_at_risk` / `_late` / `_done` / `_closed` / `_no_runs`), with the speed (tests/day), date and days-late correctly
  interpolated.
- An SVG chart with 4 series: remaining (blue, solid), ideal (grey, dashed), scope (orange, solid), forecast
  (orange, dotted) — plus vertical markers for "today" and the due date.
- 3 stat cards: Remaining (today), Speed (tests/day), Forecast finish date.
- A collapsible **"Show as table"** (`<details>`/`<summary>`) with one row per day (scope / executed / remaining /
  ideal), reverse-chronological, only for days that have a `remaining` value (i.e. up to today).
- An "estimated history" hint line, shown only when the earliest-recorded snapshot date is *after* the
  computed start date (meaning part of the chart's own history is estimated, not snapshot-backed).

---

### RFTC034-1: Chart renders correctly for a milestone with real run history and a future due date

**Priority:** P1 — this is the entire point of the ticket
**Steps:**
1. Enable Milestones. Create a Version with a due date a few weeks out. Link a Run to it with several test
   cases, and record executed results across at least 3 distinct days (to clear the `MIN_HISTORY_DAYS` floor) —
   e.g. execute a few cases today, a few more "yesterday" by backdating `issue_status_results.created_at` via
   `rails runner` if the UI doesn't allow backdating directly.
2. Open the Burndown tab.

**Expected Result:** Chart renders with all 4 series; the sentence states a plausible speed/date; the state label
(On track / At risk / Late, based on whether the computed forecast date is before/after/well-after the due date)
matches the forecast math above; the 3 stat cards show consistent numbers; "Show as table" expands to a matching
day-by-day table.
**Actual Result:** **PASS.** Built Version #44 ("Burndown History Fixture", due +10 days) with a Run of 10 test
cases, backdating `issue_status_results.created_at` across 6 distinct days (today-6 .. today-1) via `rails
runner` (8 of 10 executed, 2 remaining). Burndown rendered: "On track" chip, sentence "At the current speed (1.1
tests a day) this milestone finishes on 11/13/2026, in time for the due date.", chart with all 4 series
(Remaining blue solid dropping from 8→2, Ideal grey dashed, Scope orange solid flat at 10, Forecast orange
dotted from today), Today/Due vertical markers, 3 consistent stat cards (Remaining today=2, Speed=1.1/day,
Forecast finish=11/13/2026).

---

### RFTC034-2 (negative): Milestone with zero linked runs

**Priority:** P1 — explicit `:no_runs` state in the service
**Steps:** Create a new Version, Milestones enabled, link no runs to it. Open its Burndown tab.
**Expected Result:** No chart is rendered; the page shows *"Link a run to this milestone to see the burndown."* —
no 500, no empty/broken chart area.
**Actual Result:** **PASS.** On a milestone with zero linked runs, the Burndown tab rendered no chart and showed
the "Link a run to this milestone to see the burndown." text — no 500, no broken chart area.

---

### RFTC034-3 (negative): Not enough history yet → "not enough data", never a guessed forecast

**Priority:** P1 — the service explicitly refuses to guess under `MIN_HISTORY_DAYS` (3) distinct execution days
or zero velocity
**Steps:** Link a run to a milestone and execute test cases, but all on the **same single day** (so
`history_days == 1`, below the floor of 3). Open the Burndown tab the same day.
**Expected Result:** State is `:no_data`; the sentence reads the "not enough data" message, not a fabricated
date/speed. Remaining/scope-today stat cards may still show real numbers, but no forecast date is claimed.
**Actual Result:** **PASS.** Built Version #47 ("No Data Forecast Fixture") with a Run of 3 test cases, only 1
executed (today), 2 left Untested — `history_days=1` (below the floor of 3). Burndown showed "Not enough data"
chip and the sentence "Not enough data to forecast yet. A forecast needs at least 3 days with executions and a
speed above zero." — no fabricated date; the chart still rendered with real scope/remaining numbers.

---

### RFTC034-4: Closed milestone shows no forecast regardless of remaining work

**Priority:** P1 — `:closed` state short-circuits the forecast calculation entirely, even if the milestone still
has real history/velocity that WOULD otherwise forecast on_track or late
**Steps:** Take a milestone with real execution history (from RFTC034-1) and Close it (via the Milestones list's
Close action, or Redmine's own Version status). Reopen the Burndown tab.
**Expected Result:** *"This milestone is closed, so no forecast is shown."* — the chart's historical data may
still render, but no on-track/at-risk/late judgement or forecast date is shown.
**Actual Result:** **PASS.** Closed Version #44 (which has real multi-day execution history from RFTC034-1) via
direct status update. Burndown showed "Closed" chip and the sentence "This milestone is closed, so no forecast is
shown." — the chart's 17 historical points still rendered, but `forecast_on` was `nil` and no on-track/at-risk/
late judgement was shown. Reopened afterward so other cases could continue using the fixture.

---

### RFTC034-5: `:done` state when remaining is zero (every test case executed)

**Priority:** P1
**Steps:** On a milestone with a small, fully-executed scope (every cell has a non-Untested/Skipped result),
open the Burndown tab.
**Expected Result:** *"All tests of this milestone are executed."* — remaining_today is 0, no forecast date
attempted even if velocity/history would otherwise be sufficient.
**Actual Result:** **PASS.** With the fixture's single test case executed (Manual Passed), the Burndown tab showed
the "Done" readiness chip, the sentence "All tests of this milestone are executed.", chart with 1 data point
("11/11/2026: Remaining 0, Executed 1, Scope 1"), Remaining today = 0, Speed 0.1/day, and Forecast finish = "—"
(no forecast date attempted despite velocity being present).

---

### RFTC034-6: `:no_due` state when the milestone has no due date set

**Priority:** P2 — forecast math still runs (a date is still computed), but there is nothing to compare it
against for on-track/at-risk/late
**Steps:** Create a Version with **no** effective (due) date, link a run with real execution history across 3+
distinct days. Open the Burndown tab.
**Expected Result:** A forecast date is still shown (and the ideal line is never drawn — `ideal` is only computed
"if due_on && day <= due_on && due_on > start_on"), but no On track/At risk/Late judgement/late-days count is
claimed since there's nothing to be on-time or late against.
**Actual Result:** **PASS.** Temporarily nilled Version #44's `effective_date` (which has real 6-day execution
history from RFTC034-1). Burndown showed "No due date" chip, sentence "Set a due date on the Redmine version to
compare with the forecast. At the current speed (1.1 tests a day) it finishes on 11/13/2026." — forecast date
still shown, no on-track/at-risk/late judgement or late-days count claimed. Restored the due date afterward.

---

### RFTC034-7: Boundary — exactly at-risk vs late (the 3-day cutoff)

**Priority:** P2 — the forecast state math has a hard `<= AT_RISK_DAYS (3)` boundary worth proving precisely
**Steps:** Using `rails runner` (or direct DB manipulation in the test fixture) construct two milestones whose
velocity/remaining/due-date combination yields `late_days` of exactly 3 (should be **At risk**) and exactly 4
(should be **Late**) respectively. Open each Burndown tab.
**Expected Result:** The 3-day case shows At risk; the 4-day case shows Late — confirming the `<=` (inclusive)
boundary in `MilestoneBurndown.forecast` is implemented as documented, not off-by-one.
**Actual Result:** **PASS.** Called the real shipped `MilestoneBurndown.forecast` class method directly via `rails
runner` (DB-free, exactly as the suite's own note suggests): `forecast(remaining: 3, velocity: 1.0, due_on: today,
today: today, history_days: 5)` → `[:at_risk, today+3, 3]` (forecast lands exactly 3 days after due → At risk, not
Late). `forecast(remaining: 4, velocity: 1.0, due_on: today, today: today, history_days: 5)` → `[:late, today+4,
4]` (exactly 4 days late → Late). Confirms the `<=` inclusive boundary at exactly 3 is implemented as documented,
not off-by-one.

---

### RFTC034-8: `today > due_on` is always Late, even with a tiny remaining/high velocity

**Priority:** P2 — the state rule checks `today > due_on` BEFORE the `late_days` math, so an overdue milestone is
Late even if the forecast date would otherwise land before the due date (a due date in the past, by definition,
cannot be "on track")
**Steps:** Create a milestone whose due date is in the past, with recent high-velocity execution such that
`remaining / velocity` alone would suggest finishing "soon" (small `late_days` if computed naively against
today). Open the Burndown tab.
**Expected Result:** State is Late (never On track/At risk) purely because `today > due_on`, confirming this
check takes priority.
**Actual Result:** **PASS.** Called the real shipped `MilestoneBurndown.forecast` class method directly:
`forecast(remaining: 1, velocity: 10.0, due_on: today-5, today: today, history_days: 5)` — despite a tiny
remaining count and very high velocity (which would naively forecast finishing almost immediately,
`today+ceil(1/10)` = `today+1`, well before a due date 5 days in the past) → `[:late, today+1, 6]`. State is
Late purely because `today > due_on`, confirming this check takes priority over the `late_days` math.

---

### RFTC034-9: Snapshot is written once per day, on page view, open milestones only

**Priority:** P1 — this is the mechanism the whole feature's history depends on (no scheduled job)
**Steps:**
1. Open a fresh milestone's Burndown page for the first time today; via `rails runner` (or the MCP API)
   confirm a `TestcaseMilestoneSnapshot` row now exists for (project, version, today).
2. Reload the Burndown page several more times the same day.
3. Separately, close the milestone and reload its Burndown page.

**Expected Result:** Step 1: exactly one snapshot row for today exists after the first view. Step 2: no duplicate
row is created on repeat views (the unique index on `[project_id, version_id, snapshot_on]` plus the service's own
`record!` must not raise or silently duplicate). Step 3: no new snapshot row is written for a closed milestone
(`snapshot!` returns early when `Milestones.closed?(@version)`).
**Actual Result:** **PASS.** Built Version #45 ("Snapshot Mechanism Fixture") with 0 pre-existing snapshot rows.
Step 1: opened its Burndown page once → `TestcaseMilestoneSnapshot.where(project_id:, version_id:).count` went
from 0 to exactly 1 (row for today). Step 2: reloaded the page 3 more times → count stayed at 1 (no duplicate,
no raise). Step 3: closed the milestone, reloaded Burndown again → count stayed at 1 (no new row written for a
closed milestone, confirming `snapshot!`'s early return).

---

### RFTC034-10 (negative, cross-project SACRED): Snapshot/history/forecast never leak across projects

**Priority:** P1
**Steps:** As a member of Project A only, attempt to open Project B's burndown page directly by URL, substituting
a real version id from Project B.
**Expected Result:** Refused (404, same `find_version`/`@project.shared_versions` scoping as the Summary report) —
no chart, no numbers, no snapshot history from Project B visible.
**Actual Result:** **PASS.** Same two-layer verification as RFTC033-3: a Project-A-only member holding
`:view_milestones` got 403 on Project B's own milestone id; `admin` substituting Project A's version id into
Project B's URL got 404 via `find_version` scoping. No chart, numbers, or snapshot history from Project B was
visible in either case.

---

### RFTC034-11: Permission gating — `:view_milestones`, and feature-off gives 404

**Priority:** P1 — identical pattern to RFTC033-4/5, verified independently on this page since it's a separate
controller action
**Steps:** (a) As a member without `:view_milestones`, open the Burndown URL directly. (b) With "Enable
Milestones" off, open the same URL as an admin.
**Expected Result:** (a) 403 Forbidden. (b) 404 Not Found.
**Actual Result:** **PASS.** (a) As `daisy.skye` (lacks `:view_milestones`), the Burndown URL returned 403
Forbidden. (b) With "Enable Milestones" off, the same URL as `admin` returned 404 Not Found.

---

### RFTC034-12: "Show as table" numbers match the chart exactly

**Priority:** P2 — the two are meant to be the same data, rendered twice
**Steps:** On a milestone with several days of real history, open the Burndown tab, read the chart's hover
values (or the 3 stat cards) for today, then expand "Show as table" and compare today's row.
**Expected Result:** Today's scope/executed/remaining in the table exactly match the Remaining-today stat card
and the chart's own today-marker values — no discrepancy between the two renderings of the same `points` array.
**Actual Result:** **PASS.** On Version #44 (6 days of real history), expanded "Show as table": today's row
(11/11/2026) read Scope=10, Executed=8, Remaining=2, Ideal=6 — exactly matching the "Remaining today" stat card
(2) and the chart's own today-marker point. No discrepancy between the two renderings of the same `points` array.

---

### RFTC034-13 (negative): Estimated-history hint only appears when genuinely needed

**Priority:** P2 — `b.estimated_until && b.estimated_until > b.start_on` is a specific, checkable condition
**Steps:** (a) On a brand-new milestone whose history starts the same day snapshots began (no backdated/estimated
days), open Burndown. (b) On a milestone with run history going back further than its first recorded snapshot
(an "old" milestone opened in the burndown view for the first time long after runs started), open Burndown.
**Expected Result:** (a) No "estimated" hint shown. (b) The "estimated" hint appears, naming the correct first
snapshot date, since part of the chart predates real snapshot data.
**Actual Result:** **PASS.** (a) Confirmed on a fresh fixture with no backdated history — no "estimated" hint
appeared. (b) On Version #44, whose Run was backdated to `created_at` = today-6 with execution history going
back to day -6, but whose first-ever Burndown view (and thus first snapshot) happened only today: the page
correctly showed "Scope history before 11/11/2026 is estimated from the dates the runs were created." —
`estimated_until` (today) > `start_on` (today-6), naming the correct boundary date.

---

## Execution status

**13/13 executed 2026-11-11 — all 13 PASS.** Cases 1-6 and 9-13 verified live through the real UI/DB against
`localhost:3000` via Playwright MCP, using Version #1, #44 ("Burndown History Fixture" — 10 test cases with
`issue_status_results.created_at` backdated across 6 distinct days via `rails runner`), #45 ("Snapshot Mechanism
Fixture"), and #47 ("No Data Forecast Fixture") in Project A (`rftc-016-ci-qa`). Cases 7 and 8 (the exact
boundary-day and overdue-priority rules) were verified via a direct call to the real, shipped
`MilestoneBurndown.forecast` class method with literal parameters — DB-free, as the suite's own note suggested,
and still execution of the actual shipped code rather than a mock. Every case confirmed its expected behavior
exactly — no deviations found anywhere in this suite. Rewritten 2026-11-11 directly from the shipped
`MilestoneBurndown` service source (not speculation).
