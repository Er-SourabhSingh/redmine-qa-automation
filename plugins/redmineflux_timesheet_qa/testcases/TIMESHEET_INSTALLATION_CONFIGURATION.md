# Test Cases — Redmineflux Timesheet — Installation, Scheduled Tasks & Settings

> Source: vendor KB — "Version Compatibility", "Installation" (including the two rake tasks), "Configuration"
> (Timesheet Mode, Submission Rules, Past Date Controls, Approval Settings, Email Notifications),
> "Troubleshooting", "Uninstallation".
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Timesheet Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time — KB declares 5.0.x, 5.1.x, 6.0.x; not 4.x)
- Path: plugins/redmineflux_timesheet_qa

## Navigation methodology

Timesheet module → **Settings** in the left sidebar. Every setting must be verified by its **effect** on logging,
submission or approval — not by the settings page reporting a successful save.

> **Warning:** these are instance-wide governance settings. Record every original value before changing it and
> restore them when the suite ends, or every later suite runs against a different policy.

---

## Functional Cases — Installation

---

### TC-TMS-027: Plugin folder name is enforced

**User Role:** Admin
**Preconditions:** Plugin at `redmine/plugins/redmineflux_timesheet`.
**Steps:**
1. Confirm the folder name is unchanged.
2. Run `bundle install` and `RAILS_ENV=production bundle exec rails redmine:plugins:migrate`; restart.
3. Open Administration → Plugins.

**Expected Result:**
- The plugin is listed with name, description, author and version, and the Timesheet entry appears in the main
  navigation.

---

### TC-TMS-028: Migrations complete cleanly

**User Role:** Admin
**Steps:**
1. Run the migration, restart, open the Timesheet module.

**Expected Result:**
- No missing-table exception in `log/production.log`; the timesheet grid renders.

---

### TC-TMS-029: Assets load

**User Role:** Any
**Steps:**
1. Open the timesheet grid and the Log Time modal; inspect the console and Network tab.

**Expected Result:**
- No 404s. The grid, the modal and the date range picker all respond — confirm by behaviour, since a missing asset
  leaves an inert page rather than a visible error.

---

### TC-TMS-030: Redmine version boundary

**User Role:** Admin
**Steps:**
1. Record the Redmine version.

**Expected Result:**
- 5.0.x, 5.1.x or 6.0.x. On Redmine 4.x the plugin is outside declared support — record that rather than filing
  failures as defects.

---

## Functional Cases — Scheduled tasks

---

### TC-TMS-031: `timesheet:send_reminders` runs manually

**User Role:** Admin (shell)
**Steps:**
1. With users holding unsubmitted timesheets past the deadline, run
   `bundle exec rake timesheet:send_reminders RAILS_ENV=production`.

**Expected Result:**
- The task completes without error and reminder emails reach the expected users.
- **Record how the task was invoked alongside the result.** Reminders are not automatic — a "no reminder received"
  result proves nothing unless the task was actually run.

---

### TC-TMS-032: `timesheet:validate_deadlines` runs manually

**User Role:** Admin (shell)
**Steps:**
1. Run `bundle exec rake timesheet:validate_deadlines RAILS_ENV=production` after a deadline has passed.

**Expected Result:**
- The task completes and any deadline consequence (flagging, locking, or appearance in the late-submission unlock
  queue) is applied.

---

### TC-TMS-033: Tasks are idempotent

**User Role:** Admin (shell)
**Steps:**
1. Run each task twice in succession without changing any data.

**Expected Result:**
- No duplicate reminder emails and no double-applied deadline consequences.
- These tasks are intended for cron, so they will be run repeatedly. A task that emails on every invocation
  regardless of state would spam every user hourly once scheduled — a realistic and damaging defect.

---

## Functional Cases — Mode and submission rules

---

### TC-TMS-034: Project Mode

**User Role:** Admin then Member
**Steps:**
1. Set Timesheet Mode to **Project Mode**; save.
2. Open a project's settings and the timesheet grid.

**Expected Result:**
- Timesheets are organised by project, and the **Approval Schema selector appears in project settings** —
  the KB ties that selector's presence to Project Mode.

---

### TC-TMS-035: Team Mode

**User Role:** Admin then Member
**Steps:**
1. Switch to **Team Mode**; save.
2. Re-check project settings and the Team section.

**Expected Result:**
- Timesheets are organised by team; schemas are assigned to **teams**, and the project-level selector is no longer
  offered.
- **Record what happens to timesheets created under the other mode.** Switching an instance-wide organising
  principle with in-flight approvals is the riskiest configuration change in this plugin — data becoming
  unreachable or approvals being orphaned would be High severity.

---

### TC-TMS-036: Weekly submission period

**User Role:** Admin then Member
**Steps:**
1. Set the period to **Weekly**; open the timesheet grid.

**Expected Result:**
- The period runs **Monday to Sunday (ISO week)**, exactly as documented.
- Confirm the week boundary against an ISO calendar, including across a year boundary — a week that starts on
  Sunday, or an off-by-one at week 1, silently misattributes every entry at the edges.

---

### TC-TMS-037: Monthly submission period

**User Role:** Admin then Member
**Steps:**
1. Set the period to **Monthly**; check a 28-day, a 30-day and a 31-day month.

**Expected Result:**
- The period runs from the 1st to the **actual last day** of each month, including February in a leap year.

---

### TC-TMS-038: Submission deadline day

**User Role:** Admin then Member
**Steps:**
1. Set a deadline day; allow it to pass with a timesheet unsubmitted; attempt to submit.

**Expected Result:**
- A deadline message is shown, and submission is blocked or permitted according to the configured settings —
  the KB states both outcomes are possible depending on configuration, so record which applies and under which
  setting.

---

## Functional Cases — Past-date and approval controls

---

### TC-TMS-039: Allowed past days and cutoff time

**User Role:** Admin then Member
**Steps:**
1. Enable **Allow Past Date Timelog**, set **Allowed Past Days** to 3 and **Allowed Time** to a cutoff already
   passed today.
2. Attempt to log time 2 days back, then 5 days back.
3. Repeat before and after the cutoff time.

**Expected Result:**
- 2 days back is allowed; 5 days back is refused with a clear message.
- The daily cutoff behaves as documented — confirm the boundary at exactly the cutoff minute, and record the
  timezone used, since a server/user timezone mismatch here silently shifts everyone's window.

---

### TC-TMS-040: Block Edit/Delete After Allowed Period

**User Role:** Admin then Member
**Steps:**
1. Enable the setting; attempt to edit and then delete an entry outside the allowed window after cutoff.
2. Send both requests **directly** to their endpoints.

**Expected Result:**
- Both refused in the UI **and** at the endpoint. A control that is merely hidden leaves the policy
  unenforced.

---

### TC-TMS-041: Disable Log/Edit After Approval

**User Role:** Admin, Member, Approver
**Steps:**
1. Enable the setting; get a timesheet approved; attempt to add and edit entries in that period, via the UI and
   directly.

**Expected Result:**
- Refused at both legs.
- **This is the integrity guarantee of the whole approval workflow** — an approved timesheet that can still be
  edited makes every approval meaningless. High severity if the endpoint accepts it.
- With the setting disabled, edits are allowed, and the effect on the approved state should be recorded.

---

### TC-TMS-042: Overtime Threshold, including `0`

**User Role:** Admin then Member
**Steps:**
1. Set the threshold to 8; log 10 hours in a day and inspect the overtime indication.
2. Set it to **0** and repeat.

**Expected Result:**
- At 8, hours beyond 8 count as overtime.
- At **0**, overtime calculation is **disabled** — per the KB. It must **not** be read as "everything over zero
  hours is overtime", which would mark every entry on the instance as overtime.

---

### TC-TMS-043: Auto-Approve Threshold, including `0`

**User Role:** Admin then Member
**Steps:**
1. Set the threshold to 10; submit a timesheet totalling 6 hours, then one totalling 20.
2. Set it to **0** and submit a 1-hour timesheet.

**Expected Result:**
- The 6-hour timesheet auto-approves; the 20-hour one enters the normal workflow.
- At **0**, auto-approval is **disabled** and even a 1-hour timesheet requires manual approval.
- **Misreading `0` here would auto-approve every timesheet on the instance**, bypassing the entire approval chain —
  the most severe possible configuration defect in this plugin, and worth testing explicitly rather than assuming.

---

### TC-TMS-044: Email on submission

**User Role:** Admin, Member, Approver
**Preconditions:** Working mail path; **Host name and path** verified.
**Steps:**
1. Enable the setting; submit a timesheet; check the approvers' mailboxes.

**Expected Result:**
- The level-1 approvers are notified, with a working link. Approvers at higher levels are not notified prematurely,
  since they cannot yet act.

---

### TC-TMS-045: Email on approval/rejection

**User Role:** Approver then Member
**Steps:**
1. Enable the setting; approve a timesheet, then reject another; check the submitter's mailbox.

**Expected Result:**
- The submitter is notified for each action, and the rejection email carries the approver's comment — a rejection
  with no reason is unusable.

---

## Negative Cases

---

### TC-TMS-046: Settings page is not reachable by a non-admin

**User Role:** Every non-admin role in turn
**Steps:**
1. Request the Timesheet Settings URL directly and attempt to post a settings change.

**Expected Result:**
- Refused with 403.
- These settings govern approval policy for the whole instance — a non-admin able to disable
  "Disable Log/Edit After Approval", or set Auto-Approve to a high value, could neutralise the approval workflow
  entirely. High severity if reachable.

---

### TC-TMS-047: Invalid setting values

**User Role:** Admin
**Steps:**
1. Enter negative values for Allowed Past Days and both thresholds; a malformed time for the cutoff (`25:99`,
   `abc`); and a deadline day outside a valid range (e.g. 32).

**Expected Result:**
- Each rejected with a clear validation message.
- A malformed cutoff that is silently coerced could open or close the logging window for everyone without anyone
  noticing.

---

### TC-TMS-048: Wrong plugin folder name

**User Role:** Admin
**Steps:**
1. Rename the folder and restart.

**Expected Result:**
- The plugin is absent or fails loudly — not half-loaded with a dead Timesheet menu. Restore and confirm recovery.

---

### TC-TMS-049: Migrations not run

**User Role:** Admin
**Steps:**
1. Install files, skip migrations, restart, open Redmine.

**Expected Result:**
- A clear error or the module absent. **Redmine's own time logging and issue pages must still work** — this plugin
  sits on top of core time entries, so breaking them would be Critical.

---

### TC-TMS-050: Settings change with approvals in flight

**User Role:** Admin
**Steps:**
1. With several timesheets part-way through a multi-level approval, change the submission period type and the
   deadline day.

**Expected Result:**
- In-flight approvals remain coherent — they do not lose their level, get orphaned, or become un-approvable.
- Record the behaviour carefully; a configuration change that strands a timesheet mid-workflow, with no way to
  complete or withdraw it, is a real operational defect.

---

## Uninstallation

---

### TC-TMS-051: Clean uninstall

**User Role:** Admin
**Preconditions:** **Database backup taken.**
**Steps:**
1. Run `bundle exec rails redmine:plugins:migrate NAME=timesheet VERSION=0 RAILS_ENV=production`.
2. Remove the plugin folder and restart.

**Expected Result:**
- Redmine starts cleanly and the Timesheet navigation entry is gone.
- **Core Redmine time entries survive.** Only plugin-owned data (submissions, approvals, teams, schemas, audit log)
  is removed — destroying users' logged hours would be Critical.
- Verify the spent-time reports in core Redmine still show the historical data.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
