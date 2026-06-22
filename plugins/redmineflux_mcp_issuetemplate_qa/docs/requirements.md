# Plugin Requirements — Redmineflux MCP Issue Template

## Overview

The Redmineflux Issue Template plugin allows Redmine administrators and authorized users to create reusable issue templates that can be applied when creating new issues. Templates pre-fill fields such as subject, description, tracker, priority, and custom fields. Templates can be scoped globally (available across all projects) or restricted to specific projects.

## Key Features

- Create global issue templates visible across all projects
- Create project-scoped templates visible only within assigned projects
- Edit and update existing templates (name, content, tracker binding, project assignments)
- Delete templates (admin-only or permission-gated)
- Assign a single template to one or multiple projects
- Set a default template that auto-selects when a user opens the new issue form for a specific tracker
- Permission-based visibility: users only see templates they are allowed to use
- Project membership restriction: non-members of a project cannot access project-scoped templates
- Template validation: required fields enforced on create/update
- Rich text (CKEditor / HTML) content support in template description
- Apply a template to pre-fill issue fields before final submission
- Search/filter templates by project

## Business Workflows

1. **Admin creates a global template** → all users can apply it when creating issues in any project
2. **Admin creates a project template** → only members of that project see and can apply it
3. **User with permission creates a template** → template is available within permitted scope
4. **User without permission attempts to create/edit/delete template** → request is rejected with 403/422
5. **User applies template** → issue form is pre-filled with template content; user can still edit before saving
6. **Admin assigns template to multiple projects** → template becomes visible in all assigned projects

## Permissions Matrix

| Action | Admin | User (with issue-template permission) | User (no issue-template permission) |
|--------|-------|---------------------------------------|--------------------------------------|
| Create global template | ✅ | ❌ | ❌ |
| Create project template | ✅ | ✅ (if permitted in project) | ❌ |
| View/list templates | ✅ | ✅ (scope-limited) | ❌ or limited |
| Apply template | ✅ | ✅ | ❌ |
| Edit template | ✅ | ✅ (own / permitted) | ❌ |
| Delete template | ✅ | ❌ | ❌ |
| Assign template to projects | ✅ | ❌ | ❌ |

## Known Constraints

- Templates are tested via MCP only — no UI interaction in this test cycle
- CKEditor content is passed as raw HTML strings via MCP
- "Clear Form" and "Cancel" are UI-only actions — marked N/A for MCP testing
- Environment: dev-flux.zehntech.com (Forge)
