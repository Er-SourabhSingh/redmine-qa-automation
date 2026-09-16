# Plugin Requirements — Redmineflux Timesheet Plugin

> Source: https://www.redmineflux.com/knowledge-base/plugins/timesheet/ (official vendor knowledge base, ingested
> 2026-09-15). Anything marked *(to confirm)* is an inference that must be verified on the running instance before
> a test case depends on it.

## Overview

A time tracking **and approval** plugin. Users log time into a weekly or monthly timesheet, submit it, and it then
passes through a **multi-level approval workflow** defined by an approval schema. Around that core sit team and
schema administration, submission-deadline enforcement, past-date logging controls, dashboards, reports and an
admin-only audit log.

The approval workflow is what distinguishes this plugin from ordinary Redmine time logging, and it is where the
consequential behaviour lives.

## Key Features

1. **Two organising modes** — **Project Mode** (timesheets tied to projects) or **Team Mode** (tied to teams).
2. **Submission periods** — Weekly (ISO week, Monday–Sunday) or Monthly (1st to last day).
3. **Submission deadline day** — the day by which the previous period must be submitted; late submission shows a
   deadline message and **can be blocked** depending on settings.
4. **Past-date logging controls** — Allow Past Date Timelog, Allowed Past Days, a daily cutoff time (HH:MM), and
   Block Edit/Delete After Allowed Period.
5. **Approval settings** — Disable Log/Edit After Approval; Overtime Threshold (hours/day, `0` disables);
   Auto-Approve Threshold (hours, `0` disables).
6. **Email notifications** — on submission (to approvers) and on approval/rejection (to the submitter).
7. **Time entry management** — add, update and delete entries from the timesheet grid.
8. **Submit and withdraw** — withdrawal is allowed **only before the minimum approval level is approved**.
9. **Approver dashboard** — pending approvals, urgent approvals, pending hours, recent actions; Review/Approve/
   Reject with comments.
10. **Strict sequential approval** — no level may be skipped; a higher-level approver cannot act before a lower
    level has decided.
11. **Self-submission routing** — an approver's own timesheet routes to the next level; if the submitter is the
    final-level approver, **only an admin** can complete it.
12. **Cross-user/team/project viewing** via a View dropdown, subject to permissions.
13. **Custom date range** viewing.
14. **My Dashboard** — submitted / approved / rejected counts, total hours, with segmented tabs.
15. **Reports** — Submission/Approval Report and Timelogs Report, with filters, Group By, and **CSV export**.
16. **Admin Dashboard** — configuration, workflow health, summary metrics, late-submission unlock queue, insights,
    reports and charts, quick access.
17. **Teams** — create, configure (assign approval schema, add members with roles), edit, delete, manage members.
18. **Approval schemas** — create with name/description/enabled status and one or more approval levels **by role**;
    edit; delete; lock (deactivate). A schema assigned to a team or project **cannot be deleted**.
19. **Project-level schema selection** — appears in project settings when Timesheet mode is **Project Mode**.
20. **Audit log** — admin-only; records approval and rejection actions and workflow activity by context.
21. **Scheduled tasks** — `timesheet:send_reminders` and `timesheet:validate_deadlines`, run manually or via
    cron / Task Scheduler.

## Business Workflows

1. **Log and submit** — open Timesheet → Log Time for each day → verify the period → **Submit** → the timesheet
   enters the approval workflow and approvers are emailed.
2. **Approve** — approver opens the Approval Dashboard → finds the pending user → Review / Approve / Reject with a
   comment → the submitter is emailed. Each level acts in strict order.
3. **Correct a mistake before approval** — the submitter opens the submitted timesheet and clicks **Withdraw
   Timesheet**, which is only possible before the minimum approval level has approved.
4. **Configure governance** — admin sets mode, period, deadline day, past-date window, overtime and auto-approve
   thresholds, and notification toggles.
5. **Set up approvals** — admin creates an approval schema with ordered levels by role, then assigns it to a team
   (Team Mode) or a project (Project Mode).

## Permissions Matrix

The KB names two plugin permissions and one important rule:

| Permission | What it covers |
|---|---|
| **View Timesheet** | View your own timesheets |
| **Manage Timesheet** | View timesheets of other users in the same project/team context, and review/manage them where the approval schema rules allow |

**Rule stated by the vendor:** *"Each team member must have a role that exists in the selected approval schema.
Only users whose role includes Manage Timesheet can manage others' timesheets."*

That single sentence is the crux of the plugin's access model and the source of its most likely defects: approval
authority is derived from **the intersection of the permission and the schema's level-to-role mapping**, not from
the permission alone. The matrix below must be established empirically per level.

| Action | Admin | Level-1 approver | Level-2 approver | Submitter | Other member | Non-member |
|--------|-------|------------------|------------------|-----------|--------------|------------|
| View own timesheet | | | | | | |
| View another user's timesheet | | | | | | |
| Submit own timesheet | | | | | | |
| Withdraw own submitted timesheet | | | | | | |
| Approve/reject at level 1 | | | | | | |
| Approve/reject at level 2 | | | | | | |
| Manage teams / schemas | | | | | | |
| View reports / admin dashboard / audit log | | | | | | |

## Known Constraints

- **A schema assigned to a team or project cannot be deleted** — only locked/deactivated.
- **Withdrawal closes once the minimum approval level is approved.**
- **No approval level can be skipped**, and a higher level cannot act before a lower one has decided.
- **If the submitter is the final-level approver, only an admin can complete the approval or rejection** — the
  deadlock-avoidance rule, and an obvious candidate for a real defect if unimplemented.
- `0` is a **disabling** value for both Overtime Threshold and Auto-Approve Threshold, not a literal limit.
- The Approval Schema selector on a project appears **only in Project Mode**.
- Reminders and deadline validation are **rake tasks**, not in-app schedulers — nothing happens automatically
  unless cron or Task Scheduler is configured.
- Declared compatibility: Redmine 5.0.x, 5.1.x, 6.0.x (not 4.x).

## Installation Prerequisites

1. Working Redmine 5.0+.
2. Plugin at `redmine/plugins/redmineflux_timesheet`, folder name unchanged.
3. `bundle install`; `RAILS_ENV=production bundle exec rails redmine:plugins:migrate`; restart.
4. Cron / Task Scheduler entries for `timesheet:send_reminders` and `timesheet:validate_deadlines` if the
   reminder and deadline features are in scope.
5. **Test users covering every approval level plus a submitter and a non-participant**, and at least one user who
   is simultaneously a submitter and the final-level approver — without that account, the deadlock rule cannot be
   tested at all.
6. A working outbound mail path, and a verified Administration → Settings → General → **Host name and path**,
   before any notification testing.
