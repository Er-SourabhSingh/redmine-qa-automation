# Test Cases — Redmineflux Timesheet — Views, Dashboards, Reports & Audit Log

> Source: vendor KB — "How to View Timesheets Across Users, Projects, and Teams", "How to View Timesheet for
> Custom Date Range", "How to View My Dashboard", "Timesheet Reports", "Admin Dashboard", "Audit Log".
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Timesheet Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_timesheet_qa

## Navigation methodology

Timesheet module → the **View** dropdown, the date range picker, and the **Dashboard**, **Report**, **Audit Log**
entries in the left sidebar.

> **Correctness rule:** every number on a dashboard or report is a claim about logged hours — data people are paid
> from. Cross-check each against the underlying timesheets and against core Redmine's spent-time report. A figure
> that looks plausible but is wrong is worse than an obvious error, because nobody questions it.

---

## Functional Cases — Cross-user, team and project views

---

### TC-TMS-601: View another user's timesheet

**User Role:** Member with **Manage Timesheet**
**Steps:**
1. Use the **View** dropdown → select a user → **Apply**.

**Expected Result:**
- That user's timesheet is shown read-only or editable per the permission model, and the data matches what the
  user themselves sees.

---

### TC-TMS-602: View by team

**User Role:** Member with Manage Timesheet
**Steps:**
1. Select a team in the View dropdown and apply.

**Expected Result:**
- Timesheets for that team's members are shown, and the aggregate hours equal the sum of the individual members'
  hours for the period.

---

### TC-TMS-603: View by project

**User Role:** Member with Manage Timesheet
**Steps:**
1. Select a project and apply.

**Expected Result:**
- Only time logged against that project appears, and the total matches core Redmine's spent-time report for the
  same project and range.

---

### TC-TMS-604: Custom date range

**User Role:** Member
**Steps:**
1. Open the date range picker, select a start and end date, apply.
2. Repeat with a range spanning a month boundary and one spanning a year boundary.

**Expected Result:**
- Data refreshes for exactly the selected period, inclusive of both endpoints.
- **Confirm the endpoints are inclusive**: a range that silently drops the last day understates every report built
  on it, and month/year boundaries are where that appears.

---

## Functional Cases — My Dashboard

---

### TC-TMS-605: Dashboard counts are accurate

**User Role:** Member
**Steps:**
1. Open **Dashboard** and compare Total submitted, Approved, Rejected and Total hours with the user's actual
   timesheets.

**Expected Result:**
- All four match. Submitted should account for every timesheet that entered the workflow, with approved and
  rejected as subsets that reconcile against it.

---

### TC-TMS-606: Segmented tabs list the right items

**User Role:** Member
**Steps:**
1. Open each of the submitted, approved and rejected tabs.

**Expected Result:**
- Each lists exactly the timesheets in that state, and the counts match the headline figures.
- A timesheet appearing in two tabs, or in none, indicates a state the dashboard does not model — worth recording.

---

### TC-TMS-607: Dashboard shows only the current user's data

**User Role:** Member
**Steps:**
1. Compare the dashboard against another user's timesheets.

**Expected Result:**
- No other user's hours are included. "My Dashboard" is personal by definition, and an aggregate that quietly
  includes teammates' hours would be both wrong and a disclosure.

---

## Functional Cases — Reports

---

### TC-TMS-608: Submission/Approval Report

**User Role:** Admin
**Steps:**
1. Report → **Submission/Approval Report** → apply filters and a Group By → **Apply**.

**Expected Result:**
- Rows reflect real submission and approval states, with approver and decision visible where applicable.

---

### TC-TMS-609: Timelogs Report

**User Role:** Admin
**Steps:**
1. Report → **Timelogs Report** → apply filters → Apply.

**Expected Result:**
- Rows correspond to actual time entries; totals equal the sum of the listed rows and reconcile with core
  Redmine's spent-time report for the same filters.

---

### TC-TMS-610: Filters constrain results correctly

**User Role:** Admin
**Steps:**
1. Apply user, project, team and date-range filters individually, then in combination.

**Expected Result:**
- Each narrows the result set correctly, and combinations intersect — the combined result is a subset of each
  filter applied alone.

---

### TC-TMS-611: Group By changes grouping, not totals

**User Role:** Admin
**Steps:**
1. Run the same report grouped by user, then by project, then by activity.

**Expected Result:**
- The grand total is **identical** across all three groupings.
- A total that changes with the grouping means rows are being double-counted or dropped — a clear arithmetic
  defect, and this comparison is the cheapest way to detect it.

---

### TC-TMS-612: CSV export matches the on-screen report

**User Role:** Admin
**Steps:**
1. Export the report to CSV and compare row count, column values and totals with the screen.

**Expected Result:**
- Identical data. The export must not silently truncate to the first page of results — exporting is how these
  figures reach payroll and finance, so a partial export is High severity.

---

### TC-TMS-613: CSV formatting integrity

**User Role:** Admin
**Steps:**
1. Export a report whose data contains commas, quotes, newlines in comments, and non-Latin characters.

**Expected Result:**
- Fields are correctly quoted and escaped; the file opens in a spreadsheet with columns intact and characters
  readable.
- A comment containing a comma must not shift every subsequent column — a classic and damaging CSV defect.
- Also check that a value beginning with `=`, `+` or `-` cannot execute as a formula when opened in a spreadsheet;
  a user-supplied comment is the injection vector.

---

## Functional Cases — Admin Dashboard

---

### TC-TMS-614: All documented sections are present

**User Role:** Admin
**Steps:**
1. Open the Admin Dashboard.

**Expected Result:**
- Timesheet Configuration, Workflow Health, Summary Metrics, Late Submission Unlock Queue, Insights and Analytics,
  Reports and Charts, and Quick Access links — all seven, per the KB.

---

### TC-TMS-615: Summary metrics reconcile

**User Role:** Admin
**Steps:**
1. Compare the summary metrics against the underlying timesheets across several users.

**Expected Result:**
- The figures match. Pending counts equal the sum of what sits in approvers' queues.

---

### TC-TMS-616: Late Submission Unlock Queue is actionable

**User Role:** Admin
**Steps:**
1. With a user blocked by a missed deadline, confirm they appear in the queue and unlock them.

**Expected Result:**
- The user appears, the unlock works, and they can then submit (paired with TC-TMS-306).
- A queue that lists blocked users but offers no working unlock leaves them permanently unable to submit.

---

### TC-TMS-617: Quick Access links work

**User Role:** Admin
**Steps:**
1. Follow each quick access link.

**Expected Result:**
- Each reaches the intended screen with the right context.

---

## Functional Cases — Audit Log

---

### TC-TMS-618: Audit Log records approvals and rejections

**User Role:** Admin
**Steps:**
1. Run a full submit → approve → reject → resubmit → approve cycle, then open the Audit Log.

**Expected Result:**
- Every approval and rejection is recorded with actor, timestamp, level and context, in order.
- The log reconstructs the whole sequence with no gaps — this is the plugin's evidentiary record.

---

### TC-TMS-619: Audit Log filters by context

**User Role:** Admin
**Steps:**
1. Filter by project and by team.

**Expected Result:**
- Only that context's workflow activity is shown, per the KB.

---

### TC-TMS-620: Audit entries are immutable

**User Role:** Admin
**Steps:**
1. Look for any edit or delete action on an audit entry; attempt to modify one directly if an endpoint exists.

**Expected Result:**
- No edit or delete is offered and none succeeds.
- **An editable audit log is not an audit log.** If entries can be altered or removed, the record cannot be relied
  on for the governance purpose it exists to serve — worth filing as a design finding even if no endpoint is
  exposed.

---

### TC-TMS-621: Audit Log is admin-only

**User Role:** Every non-admin role in turn, including one with Manage Timesheet
**Steps:**
1. Confirm the Audit Log entry is not offered.
2. Request its URL directly.

**Expected Result:**
- Refused with 403. The KB states the audit log is admin-only.

---

## Negative Cases

---

### TC-TMS-622: Views respect the permission boundary

**User Role:** Member with **View Timesheet** only
**Steps:**
1. Confirm the View dropdown does not offer other users, teams or projects.
2. Request another user's timesheet **directly** by crafting the request.

**Expected Result:**
- Refused, with no hours, project names or entry comments in the response.
- **View Timesheet grants sight of your own timesheets only**, per the KB. Another user's logged hours are personal
  data, so a leak here is High severity rather than a technicality.

---

### TC-TMS-623: Reports respect the permission boundary

**User Role:** Non-admin, including one with Manage Timesheet
**Steps:**
1. Confirm which report scopes are offered.
2. Request the report endpoint directly for a user and a project outside their scope, and attempt a CSV export of
   the same.

**Expected Result:**
- Refused at both the HTML and the export endpoints.
- **The export endpoint is the one most likely to be left unguarded**, because permission checks tend to be written
  against the view. A CSV of the whole instance's hours obtained by a team lead would be a serious disclosure.

---

### TC-TMS-624: Reports with no matching data

**User Role:** Admin
**Steps:**
1. Run each report with filters that match nothing, and export the result.

**Expected Result:**
- A clean empty state and a valid empty CSV with headers — not an error, and not a file containing unfiltered data.

---

### TC-TMS-625: Large report volume

**User Role:** Admin
**Steps:**
1. Run the Timelogs Report across a year for the whole instance, then export it.

**Expected Result:**
- Completes without timeout; the export contains **every** row, not a truncated page.
- Record the row count and the duration.

---

### TC-TMS-626: Dashboard and report figures agree

**User Role:** Admin
**Steps:**
1. For one user and one period, compare: the timesheet grid total, My Dashboard total hours, the Timelogs Report
   total, the Admin Dashboard summary, and core Redmine's spent-time report.

**Expected Result:**
- All five agree.
- **This single reconciliation is the most valuable case in the suite.** Each figure is computed by different code
  over the same data; a divergence pinpoints exactly which view is wrong, and would otherwise go unnoticed because
  each number looks reasonable on its own.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
