# Bug Report Template

- Bug ID: BUG-PLT-029
- Production Redmine Issue ID: #121862
- Title: A Workload's own member capacity list is a stale snapshot taken at creation time — removing a member from the shared Team afterward does not remove them from the Workload, which keeps showing their full capacity as if they were still on the team
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_workload
- Plugin version: `redmineflux_platform` branch, current tip
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance, post-upgrade)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-10-01

## Steps to reproduce

1. Create a Workload for a Team with several members (e.g. `PLT-BASELINE-QA Squad`, 5 members at the time: Redmine Admin, Luna Blossom, Daisy Skye, Nova Starling, Aurora Wren).
2. Confirm the Workload's Team Capacity view shows all 5 members with their capacity figures.
3. Remove one member (e.g. Nova Starling) from the Team itself (Workload's own `/rf_teams/1` page, or any of Timesheet's/Shift Management's team screens, since Team is one shared row).
4. Reload the Workload's own page (`/rf_teams/1/rf_workloads/1`) and the org-wide Workload Intelligence Dashboard.

## Expected result

- The removed member should no longer appear as part of the Workload's team capacity — this is the exact scenario `PLATFORM_CROSS_PLUGIN_CONSISTENCY.md` TC-PLT-104 exists to verify ("Workload's calculations correctly reflect the current team membership, not a stale snapshot from when the allocation was first made").

## Actual result

- The removed member (Nova Starling) **still appears** on the Workload's Team Capacity view with her full original capacity (80h) and "5 of 5 members visible" — even though she was successfully removed from the Team (confirmed: `team.team_memberships.exists?(user_id: nova.id)` → `false`).
- Confirmed via direct DB query that this isn't a caching/rendering artifact — it's a genuinely stale row:
  ```
  Team current members: Redmine Admin, Luna Blossom, Daisy Skye, Aurora Wren
  Workload rf_workload_users (snapshot): Redmine Admin, Luna Blossom, Daisy Skye, Nova Starling, Aurora Wren
  Nova still in team_memberships? false
  Nova still in rf_workload_users? true
  ```
- The org-wide `/workload_intelligence_dashboard` team filter shows the same stale figure (Active Users: 5, Total Capacity: 384.0h) both before and after the removal — unchanged, because it's summing the same stale `rf_workload_users` rows.

### Root cause (confirmed from source)

`app/models/rf_workload.rb` has `has_many :rf_workload_users` and `has_many :users, through: :rf_workload_users` — `RfWorkloadUser` (table `rf_workload_users`) is a **separate join table from the Team's own `team_memberships`**, populated once when a Workload is created (snapshotting whichever users were on the team at that moment) and never re-synced afterward. There is no `after_remove`/`after_destroy` hook on the Team-membership side that cleans up or updates existing `RfWorkloadUser` rows when a member leaves the team, and no fallback that computes "current members" live from the team instead of from this snapshot table.

This is a real, reachable, and arguably severe usability+accuracy gap: once any Workload exists, capacity planning figures for it silently drift from the team's true membership and never self-correct — an admin reviewing "5 of 5 members visible" / "384h capacity" after Nova Starling has left the team (e.g. reassigned, offboarded) has no way to know from this screen that one of those 5 "members" is no longer actually on the team at all.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-PLT-029/workload-shows-removed-team-member.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-029/retest-yyyy-mm-dd-pass.png)

### Console / log

- No JS error — confirmed via direct Rails-console DB query, not just UI observation.

## Duplicate check

- Duplicate found: No — distinct from `BUG-PLT-013`/`BUG-PLT-014`/`BUG-PLT-015`/`BUG-PLT-016` (those are about team-membership CRUD itself not syncing across consumer plugins' own screens); this is about Workload's own capacity-planning feature not tracking a team's live membership at all once a Workload has been created.

## Production report

Reported to production `ztflux` as **#121862** on 2026-10-01, assigned to Prashant Chaurasia. Linked via `report_defect` against testcase #121476 ("Cross-Plugin Consistency", Feature #120043) and run #586, environment "Win + Chrome + Ver6" — testcase marked Failed. Priority: Medium (priority_id 2); Defect custom fields: Type=Functional, Severity=Medium-severity, Priority=Medium.
