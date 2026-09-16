# Plugin Requirements — Redmineflux Workload Plugin

> Source: https://www.redmineflux.com/knowledge-base/plugins/workload-plugin/ (official vendor knowledge base,
> ingested 2026-09-15).

## Overview

A capacity-planning plugin. It adds a **Workloads** top menu and lets managers build workloads for a team over a
date range, add Redmine issues to them, and allocate planned hours per member on a Gantt timeline. Its defining
characteristic is that **available capacity is calculated**, not entered: working hours per day, minus weekends,
minus holidays from the active holiday scheme, minus approved leave.

That calculation is the heart of the plugin, and almost every consequential defect will be a capacity number that
is wrong.

## Key Features

1. **Settings** — Working Hours Per Day (default `8.0`) and **Allow Workload Overload**.
2. **Teams** — create, edit, delete, bulk delete; add members with a Redmine role; a user may join many teams but
   only once per team.
3. **Per-team member permissions** — **Manage workload** and **Can approve leave**, stored on the team membership,
   so they differ per team for the same user.
4. **Skills** — create, edit, delete, bulk delete; assign users with a **proficiency level**; find team members by
   skill.
5. **Leave** — request (type, start, end, reason), approve, reject with a reason, cancel. **Approved leave reduces
   capacity**; cancelled leave stops reducing it.
6. **Holiday schemes** — create with an Active flag; **only one scheme is active**, and activating a new one
   deactivates the previous. Only the active scheme affects capacity.
7. **Holidays** — name, start date, optional end date for multi-day, type, description, recurring flag; plus
   **Generate Recurring Holidays** for a chosen year.
8. **Workloads** — create for a team with a name, date range, selected members, and an optional custom working
   hours per day; edit; delete (which removes workload users, issue links and allocation data).
9. **Issues in a workload** — search or pick from eligible issues; add and remove.
10. **Planned hours allocation** — per user per issue, against calculated capacity, showing utilization, remaining
    capacity and overbooked hours.
11. **Gantt view** — drag to move, resize to change duration, reorder a user's allocations, review daily
    distribution, identify overlapping conflicts.
12. **Split an allocation** — schedule one issue across separate date ranges.
13. **Recalculate Capacity** — after changing hours, dates, membership, holidays or leave.
14. **Workload email** — sends workload, team, issue and allocation details.
15. **Dashboard (administrators only)** — KPI summary, capacity and planned-work trends, team capacity
    distribution, workload matrix, user availability heatmap, cross-workload conflicts, forecast, allocation
    drilldown; filtered by date range, team, workload, user and status.

## Permissions Matrix

The plugin adds **one** Redmine role permission — **Manage teams and skills** — and then layers **two per-team
membership flags** on top of it. That hybrid is unusual and is the source of most of the access-control risk.

| Capability | Gate |
|---|---|
| Create/edit/delete/bulk-delete teams; add, update, remove members; assign Redmine roles; grant the two membership flags; create/edit/delete/bulk-delete skills; assign skills and proficiency; create and manage workloads **for teams where they have workload access** | **Manage teams and skills** (role permission) |
| Create and manage workloads for a specific team | **Manage workload** (per-team membership flag) or admin |
| Approve or reject leave for a team's members | **Can approve leave** (per-team membership flag) or admin |
| Workload Dashboard, plugin settings, holiday schemes and holidays, all teams and workloads | **Administrator** |
| See workloads for their own teams; view and manage their own leave | Any logged-in member |

| Action | Admin | Manage teams and skills | Manage workload (team A) | Can approve leave (team A) | Plain member | Non-member | Anonymous |
|--------|-------|------------------------|--------------------------|----------------------------|--------------|------------|-----------|
| Open Workloads | | | | | | | |
| Create/edit/delete a team | | | | | | | |
| Create/edit/delete a skill | | | | | | | |
| Create a workload for team A | | | | | | | |
| Create a workload for team B | | | | | | | |
| Approve leave for team A | | | | | | | |
| Approve leave for team B | | | | | | | |
| Request own leave | | | | | | | |
| View the Dashboard | | | | | | | |
| Change settings / holidays | | | | | | | |

The two rows that matter most are the **team B** rows: the KB states the flags are per-team, so a user with
Manage workload on team A must be refused on team B.

## Known Constraints

- **Weekends are excluded** from capacity (FAQ Q3).
- **Only the active holiday scheme counts.** Holidays in inactive schemes do not reduce capacity — the KB names
  this as a troubleshooting cause, so it is a known point of confusion.
- **Activating a scheme deactivates the previous one** — there is never more than one active.
- **Approved leave reduces capacity; cancelled leave does not.**
- **Overload is permitted only when Allow Workload Overload is enabled**; otherwise planned hours must stay within
  available capacity.
- **Deleting a workload removes its users, issue links and allocation data.** Deleting a team removes its related
  team data.
- A user can be added to a team **only once**, but can belong to many teams.
- The **Workloads menu is only visible to logged-in users**.
- Declared compatibility: Redmine **5.0.x, 6.0.x, 6.1.x** — note this list **skips 5.1.x**, unlike every other
  plugin in the set. Worth confirming on the instance under test rather than assuming it is a typo.

## Installation Prerequisites

1. Working Redmine.
2. `redmineflux_workload` uploaded to `Redmine/plugins`, folder name unchanged.
3. `bundle install`; `RAILS_ENV=production bundle exec rails redmine:plugins:migrate`; restart.
4. Test users covering: an admin; a user with Manage teams and skills; a user with Manage workload on team A only;
   a user with Can approve leave on team A only; and a plain member. The per-team flags cannot be tested without
   two teams and a user whose flags differ between them.
5. A holiday scheme with holidays inside a workload's date range, and at least one approved leave record — without
   both, the capacity calculation cannot be meaningfully verified.
