> ⚠️ **EXTERNAL SOURCE — DO NOT MERGE WITH THIS PLUGIN'S OWN TC-TCM-xxx SUITES** ⚠️
>
> These test cases are PLANNED coverage for production feature **#123573** ("rftc-034 — Milestone
> burndown + automatic forecast"), part of **Testcase Management plugin Release 7.3.0**.
>
> **ID prefix**: every case here is `RFTC034-<n>`.
>
> ## ⛔ BLOCKED — feature not yet implemented
>
> Ticket status: **New, 0% done**. No code exists on any branch as of this writing (`release/7.3.0`
> commit `329311d` built 4 of the 7 Release-7.3.0 features — automation sources, flaky-test detection,
> run comparisons, exploratory sessions — but explicitly did NOT touch this one). This file is
> **PLANNED coverage only**, written ahead of implementation. The Open Question below must be resolved
> by the dev/PM before this feature can even be built as literally specced — every test case in this
> file is necessarily speculative until that happens.

# Test Cases — Redmineflux Testcase Management — rftc-034: Milestone Burndown + Automatic Forecast

## Open Question — blocks implementation

This plugin's **Milestones feature was removed entirely**, shortly before this release, by
`db/migrate/20261027000000_remove_testcase_milestones.rb` (on branch `release/7.3.0`). That migration's
own comment says plainly: *"The standalone Milestones feature has been removed entirely (controller,
model, views, MCP endpoints, and its optional link from Test Plans and Reports)."* Concretely, it drops:

- the entire `testcase_milestones` table (which is exactly where a milestone's own **due date** would
  have lived — the one field a burndown chart's X-axis needs most),
- `runs.milestone_id`,
- `testcase_reports.milestone_id`,
- `testplans.testcase_milestone_id`,

and is marked **irreversible** (`down` raises `ActiveRecord::IrreversibleMigration`).

rftc-034 is titled "**Milestone** burndown + automatic forecast" and its description asks for *"a
milestone burndown chart with an automatic completion forecast based on execution velocity, so a lead
can see if the milestone will land on time."* A burndown chart fundamentally needs two things this
plugin no longer has an obvious source for once Milestones are gone: **(a)** a scope's total vs.
remaining item count over time, and **(b)** a target/due date to burn down *toward*. The sibling feature
rftc-029 (Exploratory Sessions, already built on this same branch) explicitly flagged this exact
conflict in its own planning doc: *"rftc-033/034 (milestone summary/burndown reports) were deferred
separately because the Milestone feature itself was removed from this plugin shortly before this
release."*

This is a real, unresolved product question, not something this test file can paper over. Plausible
resolutions, none picked here as "the" answer:

1. **Milestones get reintroduced** in some form (even a lightweight version — just a name + a due date
   — without the full removed feature's other surface area) specifically so a burndown has a due date
   to chart toward.
2. **The report gets redefined** to burn down by something that still carries a due date today — a
   Redmine **Version** already has one (`effective_date`) — in which case "milestone" in the ticket
   title is a stand-in for "Version," not a literal reference to the removed model.
3. **The ticket is deferred again** to a later release, the same way it was pulled out of V2 into V3 —
   it could slip to V4/"Later" if the due-date question isn't resolved in time for 7.3.0.

Every test case below assumes resolution path (2) — burning down against a **Version**'s
`effective_date` — purely because it is the only one buildable with today's schema with no new
migration; this is a documentation convenience for writing concrete steps, **not** a recommendation,
and every case must be re-validated against whatever the dev/PM actually decides.

---

## Plugin

- Name: Redmineflux Testcase Management
- Version: branch `release/7.3.0`, commit `329311d` (**feature itself absent from this commit** —
  only rftc-018/019/022/029/035 were built; rftc-033/034 are untouched)
- Redmine version: 6.x (Docker, Postgres) — same environment as the rest of this release's testing
- Production ticket: **#123573** (ztflux), status **New**, done ratio **0%**

## Feature summary

Per the ticket description: *"A milestone burndown chart with an automatic completion forecast based on
execution velocity, so a lead can see if the milestone will land on time."* The roadmap gap doc
(`documents/testmo-tcm-feature-gap-2026-10-02.html`, row #41) frames it as "Burndown + automatic
forecast... Milestone burndown" — a time-series chart of remaining (not-yet-passed) test-case
executions against a target date, plus a forecast line projecting whether the current pace of execution
("velocity") will clear the remaining count before that date. See Open Question above for why "which
target date" is currently unresolved.

---

### RFTC034-1: Burndown chart renders total vs. remaining count over the scope's date range

**Priority:** P1 — the core visualization the whole ticket is about
**Steps:** With a scope (Version/milestone-equivalent, per the Open Question) that has a start date, a
due/effective date, and a mix of executed (Passed/Failed) and not-yet-executed test cases, open the
Burndown report for it.
**Expected Result:** A chart renders showing the total scope size at the start and a declining
"remaining" line as executions complete over time, ending at or near the due date.
**Actual Result:** Not Executed — feature not implemented (ticket status: New, 0% done). These are
planned test cases for whenever this feature is built, written against the ticket description and this
plugin's existing reporting conventions; they will need to be revised once an actual implementation and
spec exist.

---

### RFTC034-2: Forecast line projects completion date based on recent execution velocity

**Priority:** P1 — "automatic completion forecast based on execution velocity" is the ticket's
differentiator beyond a plain burndown
**Steps:** With enough historical execution data to compute a trend (e.g. several days of varying daily
completion counts), open the Burndown report and inspect the forecast line/date.
**Expected Result:** A forecasted completion date is shown, computed from the actual recent pace of
execution, not a static linear projection from day 1 that ignores recent slowdowns/speedups.
**Actual Result:** Not Executed — feature not implemented (ticket status: New, 0% done). These are
planned test cases for whenever this feature is built, written against the ticket description and this
plugin's existing reporting conventions; they will need to be revised once an actual implementation and
spec exist.

---

### RFTC034-3: Forecast correctly flags "will NOT land on time" when the current pace is too slow

**Priority:** P1 — the ticket's own stated purpose ("so a lead can see if the milestone will land on
time") requires this to be visibly distinguishable from the on-time case, not just a date buried in a
chart tooltip
**Steps:** Construct a scope where the remaining count is large relative to the due date and the recent
velocity, such that the forecasted completion date falls after the due date.
**Expected Result:** A clear visual/textual warning (e.g. a red forecast line, an explicit "at risk" or
"will miss deadline" label) — not just a date a user has to manually compare against the due date
themselves.
**Actual Result:** Not Executed — feature not implemented (ticket status: New, 0% done). These are
planned test cases for whenever this feature is built, written against the ticket description and this
plugin's existing reporting conventions; they will need to be revised once an actual implementation and
spec exist.

---

### RFTC034-4 (negative): Not enough historical data to forecast — explicit "not enough data" state, not a garbage projection

**Priority:** P1 — this plugin's established pattern (e.g. Quality HQ's flaky-tests panel requiring
`flaky_min_runs`, default 4, before a test even qualifies) is to show an explicit empty/insufficient-
data state rather than compute a misleading number from too little evidence; a burndown forecast is
exactly the kind of statistic that produces wild, meaningless projections from 1-2 data points
**Steps:** Open the Burndown report for a scope that was only just created (zero or one day of
execution history).
**Expected Result:** The chart/forecast area shows an explicit "not enough data to forecast yet" message
— never a wildly early/late date computed from a single data point.
**Actual Result:** Not Executed — feature not implemented (ticket status: New, 0% done). These are
planned test cases for whenever this feature is built, written against the ticket description and this
plugin's existing reporting conventions; they will need to be revised once an actual implementation and
spec exist.

---

### RFTC034-5 (negative): Scope already 100% complete — no forecast needed, not an error

**Priority:** P2
**Steps:** Open the Burndown report for a scope where every test case has already been executed
(remaining count = 0).
**Expected Result:** The chart shows the burndown reaching zero; the forecast area shows a "complete"
state (e.g. "Completed on <date>") rather than attempting to project a future completion date or
erroring out.
**Actual Result:** Not Executed — feature not implemented (ticket status: New, 0% done). These are
planned test cases for whenever this feature is built, written against the ticket description and this
plugin's existing reporting conventions; they will need to be revised once an actual implementation and
spec exist.

---

### RFTC034-6 (negative): Scope with zero test cases at all — empty state, not a divide-by-zero crash

**Priority:** P2 — a percentage-based burndown/velocity calculation is a classic divide-by-zero risk
when the denominator (total test cases) is zero
**Steps:** Open the Burndown report for a brand-new scope that has no test cases assigned to it yet.
**Expected Result:** A clean "no test cases in this scope yet" empty state — not a 500, not `NaN%`/
`Infinity` rendered anywhere on the page.
**Actual Result:** Not Executed — feature not implemented (ticket status: New, 0% done). These are
planned test cases for whenever this feature is built, written against the ticket description and this
plugin's existing reporting conventions; they will need to be revised once an actual implementation and
spec exist.

---

### RFTC034-7 (SACRED/security): Cross-project isolation

**Priority:** P1 — every other report in this plugin enforces this boundary; assume this one must too
**Steps:** As a project member with no access to Project B, open Project A's Burndown report for a scope
that happens to share a naming pattern with one of Project B's scopes; confirm Project B's execution
data never appears.
**Expected Result:** Zero data from Project B visible anywhere in Project A's burndown/forecast.
**Actual Result:** Not Executed — feature not implemented (ticket status: New, 0% done). These are
planned test cases for whenever this feature is built, written against the ticket description and this
plugin's existing reporting conventions; they will need to be revised once an actual implementation and
spec exist.

---

### RFTC034-8: Permission gating — reuses `:view_report`, consistent with rftc-020/021/035/044

**Priority:** P1 — every sibling read-only report in this plugin is gated the same way
**Steps:** As a project member WITHOUT `:view_report`, attempt to open the Burndown report directly by
URL.
**Expected Result:** 403 Forbidden, matching `AutomationDashboardController`'s
`rftc_require_permission!(:view_report, @project)` pattern — not a silent empty page, not a 500.
**Actual Result:** Not Executed — feature not implemented (ticket status: New, 0% done). These are
planned test cases for whenever this feature is built, written against the ticket description and this
plugin's existing reporting conventions; they will need to be revised once an actual implementation and
spec exist.

---

### RFTC034-9 (negative): A scope whose due date has already passed, with items still remaining

**Priority:** P1 — a realistic and important state for a "will this land on time" feature: it's already
late, not just "at risk"
**Steps:** Open the Burndown report for a scope whose due date is in the past and which still has
unexecuted test cases.
**Expected Result:** The report clearly indicates the scope is **already overdue**, distinctly from the
"forecast says it will miss the deadline" at-risk state in RFTC034-3 (a date already past vs. a date
projected to be missed are different severities worth distinguishing).
**Actual Result:** Not Executed — feature not implemented (ticket status: New, 0% done). These are
planned test cases for whenever this feature is built, written against the ticket description and this
plugin's existing reporting conventions; they will need to be revised once an actual implementation and
spec exist.

---

### RFTC034-10 (negative, injection): Scope/version name with an HTML-shaped payload renders inert in chart labels

**Priority:** P1 — the same bug class as BUG-TCM-070 (a confirmed chart-rendering XSS on a sibling
rftc-021 report built the same way — ApexCharts rendering a user-supplied label as live HTML instead of
inert text) is a direct risk for any new chart this plugin adds
**Steps:** Give the burndown scope (Version/milestone-equivalent) a name containing an HTML/script-
shaped payload (e.g. `<svg onload=alert(1)>`); open its Burndown report.
**Expected Result:** The name renders as inert, HTML-escaped text wherever it appears (page title, chart
axis/legend labels) — no `alert()` fires.
**Actual Result:** Not Executed — feature not implemented (ticket status: New, 0% done). These are
planned test cases for whenever this feature is built, written against the ticket description and this
plugin's existing reporting conventions; they will need to be revised once an actual implementation and
spec exist.

## Not Executed

Every scenario above is **Not Executed** — the feature does not exist on any branch as of this writing
(ticket #123573 is status New, 0% done). See each case's own Actual Result line for the standard note.

## Coverage Summary

**0/10 executed — 100% planned/speculative.** This file exists to capture test design ahead of
implementation, per explicit instruction to read the production feature and author positive/negative
coverage now. All 10 scenarios are pending the feature actually being built, and — more fundamentally —
pending the dev/PM resolving the Milestone-removal conflict described in "Open Question" above, since
that conflict determines what a burndown chart even has as its due-date axis. This file must be
revisited and almost certainly rewritten once a real spec/implementation exists.
