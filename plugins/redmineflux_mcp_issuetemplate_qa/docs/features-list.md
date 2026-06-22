# Features List — Redmineflux MCP Issue Template

> This file must be read before writing any test case. It defines the full feature scope for test coverage.

## Feature List

| # | Feature | Description | Covered by TC |
|---|---------|-------------|---------------|
| 1 | Create Global Template | Admin creates a template with global scope (no project restriction) | TC-RIT-001 |
| 2 | Create Project Template | Admin creates a template scoped to a specific project | TC-RIT-002 |
| 3 | Edit Template | Update an existing template's name, description, or other fields | TC-RIT-003 |
| 4 | Delete Template | Remove a template permanently | TC-RIT-004 |
| 5 | Assign Template to Projects | Link a template to one or multiple projects post-creation | TC-RIT-005 |
| 6 | Default Template Auto-Selection by Tracker | A template is pre-selected when creating an issue for a specific tracker | TC-RIT-006 |
| 7 | Template Visibility Based on Permissions | Users only see templates they have permission to use | TC-RIT-007 |
| 8 | Project Membership Restriction | Non-members cannot access project-scoped templates | TC-RIT-008 |
| 9 | Project Filter Search | List templates filtered by a specific project | TC-RIT-009 |
| 10 | Clear Form Functionality | Clear applied template content from the issue form | N/A (UI-only) |
| 11 | Cancel Functionality | Cancel template creation/edit without saving | N/A (UI-only) |
| 12 | Template Validation Rules | Required fields enforced; invalid data rejected | TC-RIT-010 |
| 13 | CKEditor Content Support | Template description accepts and returns HTML/rich text content | TC-RIT-011 |
| 14 | Issue Creation Using Template | Apply a template then create an issue with pre-filled values | TC-RIT-012 |
| 15 | Multiple Project Assignment | Assign one template to several projects simultaneously | TC-RIT-013 |
| 16 | Global vs Project Template Visibility | Global templates visible everywhere; project templates scoped correctly | TC-RIT-014 |
| 17 | Template Data Persistence After Update | Data updated via edit is correctly persisted and retrievable | TC-RIT-015 |
| 18 | Permission-Based Access Control | Full CRUD gated correctly for admin, permitted user, and no-permission user | TC-RIT-016, TC-RIT-017, TC-RIT-018 |

## Notes

- Features 10 (Clear Form) and 11 (Cancel) are UI-only actions and cannot be tested via MCP. Marked N/A.
- All tests use three user contexts: admin, user with permission, user without permission.
- Bug code prefix: RIT
