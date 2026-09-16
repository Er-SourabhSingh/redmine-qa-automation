# User Guide — Redmineflux Timesheet Plugin

> This file must be read before writing any test case. It describes real end-user behaviour and UI flows.
> Source: https://www.redmineflux.com/knowledge-base/plugins/timesheet/ (ingested 2026-09-15).
> Confirm each flow against the running instance during the first execution session and correct this file where
> the real UI differs.

## Getting Started

**Timesheet** appears in the main navigation. Inside it, a left sidebar gives access to the timesheet grid,
Dashboard, Approval Dashboard, Report, Team, Approval Schema, Audit Log and Settings — which of these are visible
depends on the user's permissions and whether they are an administrator.

## Key Screens

| Screen | Path | Purpose |
|--------|------|---------|
| My Timesheet | Timesheet (default view) | Weekly calendar grid; log, edit, delete, submit |
| My Dashboard | Timesheet → Dashboard icon | Counts of submitted/approved/rejected, total hours |
| Approval Dashboard | Timesheet → Approval Dashboard | Approvers review, approve and reject |
| Report | Timesheet → Report | Submission/Approval and Timelogs reports; CSV export |
| Admin Dashboard | Timesheet (admin) | Configuration, workflow health, unlock queue, insights |
| Team | Timesheet → Team | Create and configure teams |
| Approval Schema | Timesheet → Approval Schema | Define ordered approval levels by role |
| Audit Log | Timesheet → Audit Log | Admin-only record of approval/rejection actions |
| Settings | Timesheet → Settings | All plugin configuration |
| Project schema selector | Project → Settings → Timesheet | Choose the schema (Project Mode only) |

## Step-by-Step Workflows

### Workflow 1: Configure the plugin (admin)

1. Log in as an administrator and open the **Timesheet** module.
2. Click **Settings** in the left sidebar.
3. Set **Timesheet Mode** — *Project Mode* or *Team Mode*.
4. Set **Submission Period Type** — *Weekly* (ISO, Monday–Sunday) or *Monthly* (1st to last day).
5. Set the **Submission Deadline Day**.
6. Configure past-date controls: **Allow Past Date Timelog**, **Allowed Past Days Timelog**,
   **Allowed Time (HH:MM)** cutoff, and **Block Edit/Delete After Allowed Period**.
7. Configure approval settings: **Disable Log/Edit After Approval**, **Overtime Threshold** (`0` disables),
   **Auto-Approve Threshold** (`0` disables).
8. Enable the two email notification options as required.

### Workflow 2: Log time

1. Open **Timesheet** from the navigation; the weekly grid appears.
2. Click **Log Time**, or hover the relevant task cell.
3. Choose the date and the activity, enter the hours, and add an optional comment.
4. Click **Save Time Entry**.

### Workflow 3: Update or delete an entry

1. **Double-click a task row** to reveal its existing entries.
2. Hover the target date cell to see entry details.
3. Change date, activity, hours or comment and click **Update Time Entry**.
   - If several entries exist for the same issue and activity, you may be prompted to pick the specific one.
4. To delete: open the task's entries, select one, click **Delete**.

### Workflow 4: Submit and withdraw

1. Verify the period's entries — hours, activities, comments.
2. Click **Submit** and confirm. The timesheet enters the approval workflow and approvers are notified.
3. To undo: open the submitted timesheet and click **Withdraw Timesheet**.
   - This works **only before the minimum approval level has approved**. Once that level has approved, withdrawal
     is no longer available.

### Workflow 5: Approve or reject (approver)

1. Open **Approval Dashboard** from the sidebar.
2. Review the highlights: pending approvals, urgent approvals, pending hours, recent actions.
3. Find the user under **Pending Approvals** and click **Review**, **Approve** or **Reject**.
4. Add comments and confirm. The submitter receives an email.

### Workflow 6: Set up teams and schemas (admin)

1. **Approval Schema** → **New Schema** → name, description, enabled status → add one or more approval levels,
   each mapped to a role → Save.
2. **Team** → **New Team** → name → create → open the team → assign the approval schema, add members and assign
   each member a role.
3. In **Project Mode**, instead open Project → Settings → Timesheet and choose the Approval Schema there.

### Workflow 7: Report

1. Open **Report** from the sidebar (admin).
2. Choose **Submission/Approval Report** or **Timelogs Report**.
3. Apply filters and a **Group By** option, then click **Apply**.
4. Export to **CSV**.

## UI Elements Reference

| Element | Where | Notes |
|---------|-------|-------|
| **Log Time** | Timesheet grid | Opens the entry modal |
| Task row | Timesheet grid | Double-click expands existing entries |
| **Submit** / **Withdraw Timesheet** | Timesheet grid | State-dependent |
| **Review / Approve / Reject** | Approval Dashboard | Comments supported |
| **View** dropdown | Timesheet | Switch between user, team and project views |
| Date range picker | Timesheet | Custom period |
| **New Team** / **New Schema** | Team / Approval Schema sections | Admin |
| **Lock** | Approval Schema list | Deactivates rather than deletes |

## Notes & Known Behaviour

- **Approval is strictly sequential.** A higher-level approver cannot act before the level below has decided, and
  no level can be skipped.
- **An approver's own timesheet routes to the next level.** If the submitter *is* the final-level approver, only an
  administrator can complete the approval or rejection — this exists to prevent self-approval deadlock.
- **Withdrawal is a narrow window**: it closes as soon as the minimum approval level approves.
- **`0` disables**, for both Overtime Threshold and Auto-Approve Threshold. It does not mean "zero hours".
- **A schema that is assigned to a team or project cannot be deleted** — use Lock to deactivate it instead.
- **The Approval Schema selector only appears on projects when the plugin is in Project Mode.** In Team Mode,
  schemas are attached to teams instead.
- **Reminders and deadline validation are rake tasks**, not background jobs. Nothing is sent or enforced
  automatically unless `timesheet:send_reminders` and `timesheet:validate_deadlines` are scheduled via cron or
  Windows Task Scheduler.
- Before testing any email behaviour, check Administration → Settings → General → **Host name and path**, or the
  links in the notifications will be unusable.
