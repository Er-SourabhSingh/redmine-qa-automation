# Plugin Requirements — Redmineflux Scarlet Theme

## Overview

Redmineflux Scarlet is a custom UI theme for Redmine. It replaces the default Redmine theme with a scarlet-branded visual design. The theme must apply consistently across every Redmine core page, module, and workflow without breaking layout, functionality, or usability.

## Key Features

- Custom scarlet color scheme applied globally
- Styled navigation menus (top nav, sidebar, project menu)
- Styled forms, buttons, inputs, dropdowns, date pickers
- Styled tables, pagination, filters
- Styled modals, popups, confirmation dialogs
- Styled rich text editor (CKEditor/Textile toolbar)
- Styled Gantt chart, calendar, roadmap views
- Responsive layout preserved across screen sizes
- No broken CSS, no overlapping elements, no hidden controls

## Business Workflows

The theme wraps all Redmine core workflows:
- Issue lifecycle (create → assign → update → close)
- Project management (create → configure → archive → delete)
- User & role administration
- Time tracking and reporting
- Wiki, forums, news, documents, files
- Search across all modules

## Permissions Matrix

| Action | Admin | Manager | Developer | QA | Client | Non-member |
|--------|-------|---------|-----------|-----|--------|------------|
| View all pages | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Admin panel | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Manage projects | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Create issues | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Edit issues | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Delete issues | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |

## Known Constraints

- Theme is purely visual — no plugin-specific business logic is introduced
- All Redmine core functionality must remain fully operational under the theme
- Theme must not interfere with other installed plugins' UI elements
- Testing environment: https://dev-flux.zehntech.com/
