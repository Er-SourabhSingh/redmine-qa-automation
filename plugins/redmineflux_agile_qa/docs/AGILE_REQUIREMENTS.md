# Plugin Requirements — Redmineflux Agile Board

> Source: https://www.redmineflux.com/knowledge-base/plugins/agile-board/ (official knowledge base, fetched 2026-09-08)
> Live plugin identity confirmed via Administration > Plugins: "Redmineflux Agile Board" (internal name `agile_board`), version 7.0.0.

## Overview

Agile Board provides Kanban/Scrum-style issue management: a project-scoped board, a Global Agile Board across projects, a personal Kanban block on My Page, and a Backlog view for sprint/version planning. Cards support drag-and-drop between status columns, double-click inline editing, quick-add, configurable card fields, per-column WIP limits, grouping, and optional Story Points.

## Key Features

- **Board views**: Project Agile Board, Global Agile Board (multi-project), My Page Agile Board (personal), Backlog (sprint/version planning).
- **Board modes**: Kanban mode; Scrum mode with sprint filtering.
- **Card interactions**: drag-and-drop between status columns (with workflow-transition validation), double-click to edit subject/description inline, quick-add issue per column, column reordering.
- **Board configuration**: enable/disable status columns, customize visible card fields (Issue ID, Subject, Tracker, Priority, Assignee, Author, Start/Due date, Estimated/Spent time, Done ratio, Parent task, Subtask count, Description, Last comment, Tags, Category, Target version, Comment/Attachment count, Story Points), per-column WIP limits, Kanban/Scrum board-type toggle.
- **Search & filtering**: subject search, member filter, query-based filters, sprint filter (Scrum), backlog filters.
- **Grouping**: None, Project, Tracker, Priority, Author, Assignee, Category, Target version, Parent task.
- **Sprint management**: create (Name, Description, Start/End date, Duration, Status, Sharing option), edit, delete sprints; assign issues via drag-drop or bulk update.
- **Version planning (Backlog)**: versions as backlog columns, drag issues into version columns, separate "unassigned issues" display.
- **Custom/saved boards**: save board configuration (filters, columns, card settings) as a named board; edit/delete saved boards; visibility/sharing rules.
- **Story Points**: plugin-level enable/disable toggle (disabled by default), configurable point values, shown on cards and as column/board totals.
- **Icon customization**: tracker and priority icons with color options, configured in Administration > Plugins.
- **My Page block**: shows assigned issues across active projects, optional totals (estimated/spent time, Story Points), WIP indicators, per-user preference storage, "load more" for large columns.

## Business Workflows

1. **Work a Kanban board**: open a project's Agile Board → drag a card between status columns (validated against the issue's workflow transitions for the current user's role) → card updates immediately.
2. **Quick-edit a card**: double-click a card → edit subject/description inline → save.
3. **Quick-add an issue**: use the column's quick-add control → new issue created directly in that status.
4. **Configure a board**: open board settings → toggle visible columns/statuses, pick card fields, set WIP limits, choose grouping, toggle Kanban/Scrum.
5. **Plan a sprint (Scrum/Backlog)**: create a sprint (name/dates/status/sharing) → drag issues from the backlog into the sprint or a version column → adjust via bulk update as needed.
6. **Save a custom board**: configure filters/columns/fields → save as a named board → reload/share it later; edit or delete it from a board-management list.
7. **Global/My Page boards**: view a Kanban across all projects (Global) or just issues assigned to the current user (My Page), with the same drag-and-drop and WIP-indicator behavior.

## Permissions Matrix

| Action | Admin | Manager | Developer | QA | Client | Non-member |
|--------|-------|---------|-----------|-----|--------|------------|
| View Agile Board | ✓ | ? | ? | ? | ? | ✗ (permission-gated, verify live) |
| Drag-move a card (edit issue) | ✓ | ? | ? | ? | ? | ✗ |
| Manage sprints | ✓ | ? | ? | ? | ? | ✗ |

> Exact role-level permission names ("View Agile Board", "Edit issues", "Manage sprints" per the KB) and which built-in roles have them by default not yet confirmed live — check Administration > Roles and permissions during testing.

## Known Constraints

- Requires the project module enabled (Settings > Modules) — confirm exact module name live (likely "Agile Board", similar to Flux Gantt's own module-enable requirement).
- Story Points are disabled by default at the plugin level — must be enabled via Administration > Plugins > Configure before any Story-Points-related UI appears.
- Drag-and-drop card moves are validated against workflow transitions — an invalid move (no transition available for the current role/status pair) should be rejected; confirm the exact rejection behavior/message live.
- Supported Redmine versions per KB: 5.0.x/5.1.x/6.0.x — this environment runs 7.0.1.stable, so watch for any version-mismatch quirks.
