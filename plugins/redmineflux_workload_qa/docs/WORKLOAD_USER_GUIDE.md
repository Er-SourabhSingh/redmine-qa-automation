# User Guide — Redmineflux Workload Plugin

> This file must be read before writing any test case. It describes real end-user behaviour and UI flows.
> Source: https://www.redmineflux.com/knowledge-base/plugins/workload-plugin/ (ingested 2026-09-15).
> Confirm each flow against the running instance during the first execution session and correct this file where
> the real UI differs.

## Getting Started

**Workloads** appears in the top menu for logged-in users. Inside it, a plugin sidebar reaches **Workloads**,
**Dashboard** (administrators only), **Teams**, **Skills**, **Leaves** and **Settings** (administrators only).

The global Workloads page lists active, upcoming and completed workloads. Non-admin users see only workloads for
teams they belong to.

## Key Screens

| Screen | Path | Purpose |
|--------|------|---------|
| Workloads | Top menu → Workloads | Active / upcoming / completed workloads |
| Workload detail | A workload name | Members, capacity, issues, allocations, Gantt |
| Dashboard | Sidebar → Dashboard (admin) | KPIs, trends, heatmap, conflicts, forecast |
| Teams | Sidebar → Teams | Teams, members, per-team permission flags |
| Skills | Sidebar → Skills | Skills, user proficiency, find-by-skill |
| Leaves | Sidebar → Leaves | My Leaves and the approval queue |
| Settings | Sidebar → Settings (admin) | Working hours, overload, holiday schemes, holidays |

## Step-by-Step Workflows

### Workflow 1: Configure capacity (admin)

1. Open **Workloads** → **Settings**.
2. Set **Working Hours Per Day** (default `8.0`).
3. Enable or disable **Allow Workload Overload**.
4. Manage holiday schemes and holidays from the same area.
5. **Save**.

These settings drive capacity in team availability, workload detail, allocation timelines and dashboard metrics.

### Workflow 2: Build a team

1. Sidebar → **Teams** → **New Team** → name, optional description → **Create**.
2. Click the team name; in **Members**, choose users, select a Redmine role, click **Add Member**.
3. For each member, set the two permission fields:
   - **Manage workload** — may create and manage workloads for this team.
   - **Can approve leave** — may approve or reject leave for this team's members.
4. Save. These are **team-specific** — the same user may have them in one team and not another.

### Workflow 3: Skills

1. Sidebar → **Skills** → **New Skill** → name → **Create**.
2. Click the skill name → **Add User to Skill** → select users → choose a **proficiency level** → **Add User**.
3. Use **Find Team Members by Skill** to search by skill and review matching users and their proficiency.

### Workflow 4: Leave

1. Sidebar → **Leaves** → **Request Leave** → leave type, start date, end date, reason → submit.
   The request appears under **My Leaves** as pending.
2. An approver opens **Leaves**, reviews the approval queue, opens a pending request and clicks **Approve**
   (with optional notes) or **Reject** (with a reason), then confirms.
3. To withdraw: find the request under My Leaves and click **Cancel**.

Approved leave reduces available capacity on those dates; cancelled leave does not.

### Workflow 5: Holidays

1. **Settings** → holiday schemes → **New Holiday Scheme** → name, optional description, **Active** flag →
   **Create**.
   Activating a scheme deactivates the previously active one.
2. Select the scheme → **Add Holiday** → name, start date, optional end date, type, description, recurring flag →
   **Add Holiday**.
3. For yearly holidays: **Holidays** section → choose the year → **Generate Recurring Holidays**.

Only holidays in the **active** scheme reduce capacity.

### Workflow 6: Plan a workload

1. **Workloads** → **Create Workload** → select the team, enter a name, set start and end dates, select members,
   optionally set a custom working hours per day → **Create**.
2. Open the workload and add issues using the issue search or the eligible-issues list → **Add Issue**.
3. Enter planned hours per issue per user.
4. Review utilization, remaining capacity and overbooked hours. With overload disabled, planned hours must stay
   within available capacity.

### Workflow 7: Use the Gantt timeline

1. On the workload detail page, open the Gantt view.
2. Drag an allocation to move it; drag its edge to resize; reorder a user's allocations.
3. Use the **split** action to schedule one issue across separate date ranges.
4. Review daily distribution and overlapping conflicts.

### Workflow 8: Recalculate and communicate

1. After changing hours, dates, membership, holidays or leave, click **Recalculate Capacity** on the workload
   detail page and review the updated values.
2. Use the workload email action to send the workload, team, issue and allocation details.

## UI Elements Reference

| Element | Where | Notes |
|---------|-------|-------|
| **Create Workload** | Workloads page | Team, name, dates, members, optional hours/day |
| **Add Member** | Team detail | With a Redmine role |
| **Manage workload** / **Can approve leave** | Team member row | Per-team flags |
| **Add User to Skill** | Skill detail | With a proficiency level |
| **Request Leave** / **Cancel** | Leaves | My Leaves |
| **Approve** / **Reject** | Leaves approval queue | Reject requires a reason |
| **Generate Recurring Holidays** | Settings → Holidays | Per target year |
| **Recalculate Capacity** | Workload detail | After any capacity input changes |
| Gantt allocation bar | Workload detail | Drag, resize, reorder, split |

## Notes & Known Behaviour

- **Capacity is derived, never typed.** It is working hours per day, minus weekends, minus active-scheme holidays,
  minus approved leave. If a number looks wrong, the KB's own advice is to check those inputs and then
  **Recalculate Capacity**.
- **Weekends are always excluded.**
- **Only one holiday scheme is active at a time**, and only the active one affects capacity — holidays sitting in
  an inactive scheme do nothing, which is the KB's stated explanation for "holidays are not reducing capacity".
- **The two team flags are per membership.** A user can manage workloads for one team and not another, and the
  same is true of leave approval.
- **Deleting a workload removes its users, issue links and allocation data**; deleting a team removes its related
  team data. Review associated workloads before deleting a team.
- **A user can join many teams but only once per team.**
- The **Dashboard is administrators only**.
- The **Workloads menu is hidden from anonymous visitors**.
