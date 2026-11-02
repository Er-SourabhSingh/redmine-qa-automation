> ⚠️ **EXTERNAL SOURCE — DO NOT MERGE WITH THIS PLUGIN'S OWN TC-TCM-xxx SUITES** ⚠️
>
> These test cases are PLANNED coverage for production feature **#123572** ("rftc-033 — Unified
> milestone summary report"), part of **Testcase Management plugin Release 7.3.0**.
>
> **ID prefix**: every case here is `RFTC033-<n>`.
>
> ## ⛔ BLOCKED — feature not yet implemented
>
> Ticket status: **New, 0% done**. No code exists on any branch as of this writing (`release/7.3.0`
> commit `329311d` built 4 of the 7 Release-7.3.0 features — automation sources, flaky-test detection,
> run comparisons, exploratory sessions — but explicitly did NOT touch this one). This file is
> **PLANNED coverage only**, written ahead of implementation. The Open Question below must be resolved
> by the dev/PM before this feature can even be built as literally specced — every test case in this
> file is necessarily speculative until that happens.

# Test Cases — Redmineflux Testcase Management — rftc-033: Unified Milestone Summary Report

## Open Question — blocks implementation

This plugin's **Milestones feature was removed entirely**, shortly before this release, by
`db/migrate/20261027000000_remove_testcase_milestones.rb` (on branch `release/7.3.0`). That migration's
own comment says plainly: *"The standalone Milestones feature has been removed entirely (controller,
model, views, MCP endpoints, and its optional link from Test Plans and Reports)."* Concretely, it drops:

- the entire `testcase_milestones` table,
- `runs.milestone_id`,
- `testcase_reports.milestone_id`,
- `testplans.testcase_milestone_id`,

and is marked **irreversible** (`down` raises `ActiveRecord::IrreversibleMigration`).

rftc-033 is titled "**Milestone** summary report" and its own description says *"A single milestone
summary report that unifies manual, exploratory, and automation results."* There is currently **no
milestone concept anywhere in this plugin to summarize by** — a Run has no `milestone_id` column
to query, and there is no `TestcaseMilestone` model to scope a report around. The sibling feature
rftc-029 (Exploratory Sessions, already built on this same branch) explicitly flagged this exact
conflict in its own planning doc: *"rftc-033/034 (milestone summary/burndown reports) were deferred
separately because the Milestone feature itself was removed from this plugin shortly before this
release."*

This is a real, unresolved product question, not something this test file can paper over. Plausible
resolutions, none picked here as "the" answer:

1. **Milestones get reintroduced** in some form (even a lightweight version, e.g. just a name + date
   range, without the full removed feature's surface) specifically so this report has something to
   scope by.
2. **The report gets redefined** to summarize by something that still exists — most naturally a
   **Run** or a Redmine **Version/Release** (the plugin already has both concepts) — in which case the
   ticket's title is stale and the actual scoping unit is different from what's literally written.
3. **The ticket is deferred again** to a later release, the same way it was pulled out of V2 into V3 —
   it could slip to V4/"Later" if the Milestone question isn't resolved in time for 7.3.0.

Every test case below assumes resolution path (2) — scoping by **Run or Version** — purely because it
is the only one buildable with today's schema with no new migration; this is a documentation
convenience for writing concrete steps, **not** a recommendation, and every case must be re-validated
against whatever the dev/PM actually decides.

---

## Plugin

- Name: Redmineflux Testcase Management
- Version: branch `release/7.3.0`, commit `329311d` (**feature itself absent from this commit** —
  only rftc-018/019/022/029/035 were built; rftc-033/034 are untouched)
- Redmine version: 6.x (Docker, Postgres) — same environment as the rest of this release's testing
- Production ticket: **#123572** (ztflux), status **New**, done ratio **0%**

## Feature summary

Per the ticket description: *"A single milestone summary report that unifies manual, exploratory, and
automation results. Today this is only partial; V3 makes it one coherent report."* The roadmap gap doc
(`documents/testmo-tcm-feature-gap-2026-10-02.html`, row #40) frames it the same way: "Milestone
summary report (unified)... Manual+exploratory+automation" — i.e. one report that rolls together
results from all three of this plugin's execution mechanisms:

1. **Scripted Runs** (manual/scripted test-case execution — the plugin's original mechanism),
2. **Exploratory Sessions** (rftc-029, just shipped this same release — free-form sessions with an
   outcome of Passed/Failed/Inconclusive),
3. **CI automation results** (rftc-016 ingest, now additionally grouped by rftc-018's Automation
   Sources).

Today these three live in separate, disconnected views (Runs & Results, the new Sessions page, the new
Automation Dashboard) — this feature's stated goal is one coherent report spanning all three, scoped to
some unit of work ("milestone" per the ticket — see Open Question above for why that's unresolved).

---

### RFTC033-1: Report aggregates all three result sources into one view

**Priority:** P1 — this is the entire point of the ticket ("unifies manual, exploratory, and automation
results")
**Steps:** With a project containing at least one scripted Run result, one closed Exploratory Session,
and one CI-ingested automation result (all within the same scope/date range the report will use), open
the Milestone/Unified Summary report for that scope.
**Expected Result:** All three sources appear represented in the summary (e.g. separate rows/sections
or a combined tally that visibly includes contributions from Runs, Sessions, and CI-ingested results) —
not just one of the three.
**Actual Result:** Not Executed — feature not implemented (ticket status: New, 0% done). These are
planned test cases for whenever this feature is built, written against the ticket description and this
plugin's existing reporting conventions; they will need to be revised once an actual implementation and
spec exist.

---

### RFTC033-2: Report is scoped to a real unit of work (Run/Version, per the Open Question's assumed path)

**Priority:** P1
**Steps:** Create two separate scopes (e.g. two Versions, or two groups of Runs) each with their own
results; open the summary report for only one of them.
**Expected Result:** Only the selected scope's results are summarized — the other scope's data does not
bleed in.
**Actual Result:** Not Executed — feature not implemented (ticket status: New, 0% done). These are
planned test cases for whenever this feature is built, written against the ticket description and this
plugin's existing reporting conventions; they will need to be revised once an actual implementation and
spec exist.

---

### RFTC033-3 (SACRED/security): Cross-project isolation

**Priority:** P1 — every other report in this plugin (Quality HQ, Automation Dashboard, Run
Comparisons, Slow Tests, Most Failed Tests) enforces this boundary; assume this one must too
**Steps:** As a project member with no access to Project B, open Project A's Milestone Summary report;
confirm Project B's Runs/Sessions/automation results never appear.
**Expected Result:** Zero data from Project B visible anywhere in Project A's report.
**Actual Result:** Not Executed — feature not implemented (ticket status: New, 0% done). These are
planned test cases for whenever this feature is built, written against the ticket description and this
plugin's existing reporting conventions; they will need to be revised once an actual implementation and
spec exist.

---

### RFTC033-4: Permission gating — reuses `:view_report`, consistent with rftc-020/021/035/044

**Priority:** P1 — every sibling read-only report in this plugin (Slow Tests, Most Failed Tests,
Automation Dashboard, Quality HQ) is gated the same way; this one should match, not introduce a new
permission out of convention
**Steps:** As a project member WITHOUT `:view_report`, attempt to open the Milestone Summary report
directly by URL.
**Expected Result:** 403 Forbidden (matching `AutomationDashboardController`'s
`rftc_require_permission!(:view_report, @project)` pattern) — not a silent empty page, not a 500.
**Actual Result:** Not Executed — feature not implemented (ticket status: New, 0% done). These are
planned test cases for whenever this feature is built, written against the ticket description and this
plugin's existing reporting conventions; they will need to be revised once an actual implementation and
spec exist.

---

### RFTC033-5: Anonymous/not-logged-in access is rejected, not rendered

**Priority:** P2
**Steps:** As an anonymous (not logged in) visitor, attempt to open the Milestone Summary report URL
directly.
**Expected Result:** Redirected to login (matching every other `before_action :require_login` /
`rftc_authorize_project_read!` gated page in this plugin) — never a rendered report.
**Actual Result:** Not Executed — feature not implemented (ticket status: New, 0% done). These are
planned test cases for whenever this feature is built, written against the ticket description and this
plugin's existing reporting conventions; they will need to be revised once an actual implementation and
spec exist.

---

### RFTC033-6 (negative): Empty-state when a scope has zero results in all three sources

**Priority:** P1 — this plugin's established pattern (RFTC021-4/RFTC020's reports) is a clean explicit
empty state, never a crash, when a scope has no data
**Steps:** Open the Milestone Summary report for a brand-new scope (Version/Run group) that has no
Runs, no Sessions, and no CI results recorded against it yet.
**Expected Result:** A clear "no data yet" empty state for each of the three sources (or the report as a
whole) — not a 500, not a blank/broken layout.
**Actual Result:** Not Executed — feature not implemented (ticket status: New, 0% done). These are
planned test cases for whenever this feature is built, written against the ticket description and this
plugin's existing reporting conventions; they will need to be revised once an actual implementation and
spec exist.

---

### RFTC033-7 (negative): Partial data — only one or two of the three sources have results

**Priority:** P2 — the ticket explicitly says today's state is "only partial," so a scope with e.g. only
scripted-Run results and zero Sessions/automation must still render sensibly, not assume all three are
always present
**Steps:** Open the report for a scope that has scripted-Run results but zero Exploratory Sessions and
zero CI-ingested automation results.
**Expected Result:** The Run data displays correctly; the Sessions and automation sections show their
own empty states independently, rather than the whole report failing because two of three sources are
missing.
**Actual Result:** Not Executed — feature not implemented (ticket status: New, 0% done). These are
planned test cases for whenever this feature is built, written against the ticket description and this
plugin's existing reporting conventions; they will need to be revised once an actual implementation and
spec exist.

---

### RFTC033-8 (negative, XSS/injection): Test case / session / source names with HTML-shaped payloads render inert

**Priority:** P1 — this exact class of bug (BUG-TCM-070, a chart-rendering XSS on a sibling rftc-021
report) was found and fixed on another report in this same plugin; a brand-new aggregate report
touching the same kind of user-supplied subject/title text is a natural place for the same bug class to
reappear
**Steps:** Include a scripted-Run test case, an Exploratory Session title, and a CI automation-source
name that each contain an HTML/script-shaped payload (e.g. `<img src=x onerror=alert(1)>`); open the
summary report.
**Expected Result:** All three render as inert, HTML-escaped text everywhere they appear in the report
(table, chart labels if any) — no `alert()` fires.
**Actual Result:** Not Executed — feature not implemented (ticket status: New, 0% done). These are
planned test cases for whenever this feature is built, written against the ticket description and this
plugin's existing reporting conventions; they will need to be revised once an actual implementation and
spec exist.

---

### RFTC033-9 (negative): A deleted/no-longer-visible issue's execution history doesn't crash the summary

**Priority:** P2 — this plugin's existing reports have known orphaned-row edge cases (e.g. BUG-TCM-108's
root cause was a dangling `RunIssue` with `issue_id=0`); a new aggregate report should be checked for
the same class of gap
**Steps:** Delete a test case that has an existing scripted-Run result recorded against it, within a
scope the summary report will cover; reload the report.
**Expected Result:** The report renders without a 500 — either silently excludes the orphaned result or
shows a graceful placeholder, matching this plugin's established "never crash on a missing issue"
pattern.
**Actual Result:** Not Executed — feature not implemented (ticket status: New, 0% done). These are
planned test cases for whenever this feature is built, written against the ticket description and this
plugin's existing reporting conventions; they will need to be revised once an actual implementation and
spec exist.

---

### RFTC033-10: Export formats (if offered) contain the same unified data as the on-screen view

**Priority:** P2 — every other report type in this plugin offers HTML/PDF/Excel export, and at least two
siblings (Slow Tests, Most Failed Tests — BUG-TCM-068/071) shipped with an Excel exporter that didn't
recognize the new report type at first; this is a documented recurring gap class worth checking for
proactively if/when export is offered here
**Steps:** If the implemented feature offers a Download menu, export all offered formats and inspect
each file's actual contents (not just that a file downloads).
**Expected Result:** Every offered export format contains the same unified manual/exploratory/
automation data as the on-screen report — no "Unknown Report Type" placeholder, no silently-missing
section.
**Actual Result:** Not Executed — feature not implemented (ticket status: New, 0% done). These are
planned test cases for whenever this feature is built, written against the ticket description and this
plugin's existing reporting conventions; they will need to be revised once an actual implementation and
spec exist.

## Not Executed

Every scenario above is **Not Executed** — the feature does not exist on any branch as of this writing
(ticket #123572 is status New, 0% done). See each case's own Actual Result line for the standard note.

## Coverage Summary

**0/10 executed — 100% planned/speculative.** This file exists to capture test design ahead of
implementation, per explicit instruction to read the production feature and author positive/negative
coverage now. All 10 scenarios are pending the feature actually being built, and — more fundamentally —
pending the dev/PM resolving the Milestone-removal conflict described in "Open Question" above, since
that conflict determines what this report can even be scoped by. This file must be revisited and almost
certainly rewritten once a real spec/implementation exists.
