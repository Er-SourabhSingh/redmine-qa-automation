# Features List — Redmineflux Timesheet Plugin

> This file must be read before writing any test case. It defines the full feature scope for test coverage.
> Source: https://www.redmineflux.com/knowledge-base/plugins/timesheet/ (ingested 2026-09-15).

## Feature List

| # | Feature | Description | Covered by TC |
|---|---------|-------------|---------------|
| 1 | Installation | Folder `redmineflux_timesheet`, `bundle install`, migrate, restart | TC-TMS-101 – 104 |
| 2 | Scheduled rake tasks | `timesheet:send_reminders`, `timesheet:validate_deadlines`, via cron/Task Scheduler | TC-TMS-105 – 107 |
| 3 | Timesheet Mode | Project Mode vs Team Mode | TC-TMS-108, 109 |
| 4 | Submission period type | Weekly (ISO, Mon–Sun) or Monthly (1st–last) | TC-TMS-110, 111 |
| 5 | Submission deadline day | Deadline for the previous period; message and optional blocking | TC-TMS-112, 305 – 307 |
| 6 | Allow Past Date Timelog | Allowed past days + daily cutoff time (HH:MM) | TC-TMS-113, 213 – 216 |
| 7 | Block Edit/Delete After Allowed Period | Locks entries outside the window after cutoff | TC-TMS-114, 217 |
| 8 | Disable Log/Edit After Approval | Blocks changes once approved | TC-TMS-115, 218 |
| 9 | Overtime Threshold | Hours/day after which entries count as overtime; `0` disables | TC-TMS-116, 219 |
| 10 | Auto-Approve Threshold | Timesheets under N hours auto-approve; `0` disables | TC-TMS-117, 412 |
| 11 | Email on submission | Notifies approvers | TC-TMS-118, 308 |
| 12 | Email on approval/rejection | Notifies the submitter | TC-TMS-119, 409 |
| 13 | Timesheet view | Weekly calendar/timesheet grid | TC-TMS-201, 202 |
| 14 | Add time entry | Log Time: date, activity, hours, comment | TC-TMS-203 – 206 |
| 15 | Update time entry | Double-click task row, hover cell, edit fields; multi-entry disambiguation prompt | TC-TMS-207 – 210 |
| 16 | Delete time entry | From the expanded task row | TC-TMS-211, 212 |
| 17 | Submit timesheet | Verify entries, Submit, confirm | TC-TMS-301 – 304 |
| 18 | Withdraw timesheet | Only before the minimum approval level approves | TC-TMS-309 – 312 |
| 19 | Approver dashboard | Pending, urgent, pending hours, recent actions | TC-TMS-401 – 403 |
| 20 | Approve / reject with comments | Review, Approve, Reject | TC-TMS-404 – 408 |
| 21 | Strict sequential approval | No level skipped; higher level cannot pre-empt lower | TC-TMS-410, 411 |
| 22 | Self-submission routing | Approver's own timesheet routes to the next level | TC-TMS-413 |
| 23 | Final-approver deadlock rule | If the submitter is the final approver, **only an admin** can complete it | TC-TMS-414 |
| 24 | Cross user/team/project view | View dropdown, permission-scoped | TC-TMS-601 – 603 |
| 25 | Custom date range view | Date range picker | TC-TMS-604 |
| 26 | My Dashboard | Submitted/approved/rejected counts, total hours, tabs | TC-TMS-605 – 607 |
| 27 | Reports | Submission/Approval and Timelogs reports; filters; Group By; CSV export | TC-TMS-608 – 613 |
| 28 | Admin Dashboard | Config, workflow health, metrics, late-submission unlock queue, insights, charts | TC-TMS-614 – 617 |
| 29 | Teams | Create, configure (schema + members + roles), edit, delete, manage members | TC-TMS-501 – 509 |
| 30 | Approval schemas | Create (name, description, enabled, levels by role), edit, delete, lock | TC-TMS-510 – 518 |
| 31 | Schema-in-use protection | A schema assigned to a team/project cannot be deleted | TC-TMS-517 |
| 32 | Project schema selection | Project settings selector, shown only in Project Mode | TC-TMS-519, 520 |
| 33 | Audit log | Admin-only; approval/rejection actions and workflow activity | TC-TMS-618 – 621 |
| 34 | Permissions | View Timesheet, Manage Timesheet, plus schema-role derivation | TC-TMS-901 – 914 |
| 35 | Uninstallation | Migrate `VERSION=0`, remove the folder, restart | TC-TMS-120 |

## Notes

- **Not yet executed.** Every TC was authored 2026-09-15 from the vendor KB; none has been run.
- **The approval workflow is where the real risk sits.** Four of its rules are stated explicitly and are all
  falsifiable: strict sequence, no skipped levels, self-submission routing, and the final-approver deadlock rule.
  TC-TMS-410, 411, 413 and 414 exist for exactly those, and each must be verified **at the endpoint**, not just by
  observing that the UI hides a button. An approval endpoint that accepts an out-of-order decision silently voids
  the entire governance model the plugin exists to provide.
- **TC-TMS-414 needs a specific account** — a user who is both a submitter and the final-level approver. Without
  it the deadlock rule is untestable, and it is the rule most likely to be missing, because it only manifests in an
  organisation small enough for one person to occupy both ends of the chain.
- **`0` means "disabled" for both thresholds**, not "zero hours". A build that treats Overtime Threshold `0` as
  "everything is overtime", or Auto-Approve `0` as "approve everything automatically", would be a severe defect —
  the second would auto-approve every timesheet on the instance. TC-TMS-116 and TC-TMS-117 test this boundary
  deliberately.
- **Reminders and deadline validation do nothing on their own.** They are rake tasks. If a test of reminder
  behaviour is run without the task being invoked, the result is meaningless — record how the task was triggered
  alongside every result in TC-TMS-105 – 107.
- **Withdrawal timing is a race with approval** (TC-TMS-312): the rule "only before the minimum level approves" has
  an obvious concurrency edge that is worth exercising rather than assuming.
- The plugin's permissions interact with **approval schema role mappings**, so authority cannot be read off the
  permission list alone. The permissions suite establishes the combined model.
