# Features List — Redmineflux MCP Issue Template

> This file must be read before writing any test case. It defines the full feature scope for test coverage.

## Feature List

| # | Feature | Description | Covered by TC |
|---|---------|-------------|---------------|
| 1 | Create Global Template | Admin creates a template with global scope (no project restriction) | TC-RIT-090 |
| 2 | Create Project Template | Admin creates a template scoped to a specific project | TC-RIT-091 |
| 3 | Edit Template | Update an existing template's name, description, or other fields | TC-RIT-092 |
| 4 | Delete Template | Remove a template permanently | TC-RIT-093 |
| 5 | Assign Template to Projects | Link a template to one or multiple projects post-creation | TC-RIT-094 |
| 6 | Default Template Auto-Selection by Tracker | A template is pre-selected when creating an issue for a specific tracker | TC-RIT-095 |
| 7 | Template Visibility Based on Permissions | Users only see templates they have permission to use | TC-RIT-096 |
| 8 | Project Membership Restriction | Non-members cannot access project-scoped templates | TC-RIT-097 |
| 9 | Project Filter Search | List templates filtered by a specific project | TC-RIT-098 |
| 10 | Clear Form Functionality | Clear applied template content from the issue form | N/A (UI-only) |
| 11 | Cancel Functionality | Cancel template creation/edit without saving | N/A (UI-only) |
| 12 | Template Validation Rules | Required fields enforced; invalid data rejected | TC-RIT-099 |
| 13 | CKEditor Content Support | Template description accepts and returns HTML/rich text content | TC-RIT-100 |
| 14 | Issue Creation Using Template | Apply a template then create an issue with pre-filled values | TC-RIT-101 |
| 15 | Multiple Project Assignment | Assign one template to several projects simultaneously | TC-RIT-102 |
| 16 | Global vs Project Template Visibility | Global templates visible everywhere; project templates scoped correctly | TC-RIT-103 |
| 17 | Template Data Persistence After Update | Data updated via edit is correctly persisted and retrievable | TC-RIT-104 |
| 18 | Permission-Based Access Control | Full CRUD gated correctly for admin, permitted user, and no-permission user | TC-RIT-105, TC-RIT-106, TC-RIT-107 |

## Notes

- Features 10 (Clear Form) and 11 (Cancel) are UI-only actions and cannot be tested via MCP. Marked N/A.
- All tests use three user contexts: admin, user with permission, user without permission.
- Bug code prefix: RIT
