# User Guide — Redmineflux Scarlet Theme

> This file must be read before writing any test case. It describes real end-user behavior and UI flows.

## Getting Started

The Scarlet theme is selected in Administration → Settings → Display → Theme. Once set, all users see the scarlet design on every page. No per-user configuration is needed.

## Key Screens

- Login page: `/login`
- My Page: `/my/page`
- Projects list: `/projects`
- Issues list: `/projects/<id>/issues`
- New Issue: `/projects/<id>/issues/new`
- Administration: `/admin`
- Gantt: `/projects/<id>/issues/gantt`
- Calendar: `/projects/<id>/issues/calendar`
- Roadmap: `/projects/<id>/roadmap`
- Wiki: `/projects/<id>/wiki`
- Forums: `/projects/<id>/boards`
- Time Reports: `/time_entries`
- Search: `/search`

## Step-by-Step Workflows

### Workflow 1: Login and verify theme on home page

1. Navigate to https://dev-flux.zehntech.com/
2. Verify login page uses scarlet theme styling
3. Enter credentials and login
4. Verify My Page loads with scarlet theme applied

### Workflow 2: Create a project

1. Click Projects → New Project
2. Fill Name, Identifier, enable modules
3. Submit → verify success notice styled correctly
4. Verify project settings page opens with all tabs visible

### Workflow 3: Create and edit an issue

1. Navigate to project → Issues → New Issue
2. Fill all fields (Tracker, Subject, Priority, Assignee, dates)
3. Submit → verify success flash message
4. Edit the issue → change status → save
5. Verify history tab shows the change

### Workflow 4: Bulk edit issues

1. Open Issues list
2. Select multiple issues via checkboxes
3. Click Edit → bulk change status/priority
4. Verify success message

### Workflow 5: Administration → Settings tabs

1. Navigate to Administration → Settings
2. Click each tab: General, Display, Authentication, API, Projects, Issues, Time Tracking, Notifications
3. Verify each tab renders without layout issues

## UI Elements Reference

| Element | Expected Behavior |
|---------|------------------|
| Buttons (primary) | Scarlet/red fill, white text |
| Buttons (secondary) | Outlined or grey |
| Flash success notice | Green-accented bar at top |
| Flash error notice | Red-accented bar at top |
| Sidebar links | Active state highlighted in scarlet |
| Top nav | Scarlet background, white links |
| Tables | Striped rows, bordered headers |
| Modals / popups | Centered, proper backdrop, close button visible |
| Date pickers | Calendar popup opens, selectable dates |
| Pagination | Previous/Next and page numbers visible |
| Breadcrumbs | Path shown below top nav |

## Notes & Known Behavior

- The theme only changes visuals — all Redmine core business rules remain unchanged
- Testing environment: https://dev-flux.zehntech.com/ (Forge)
- Login: sourabh.singh / 12345678
- Test should cover Chrome, Firefox, Edge
- Bug code prefix: RSC
