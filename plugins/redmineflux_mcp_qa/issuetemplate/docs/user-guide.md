# User Guide — Redmineflux MCP Issue Template

> This file must be read before writing any test case. It describes real end-user behavior and UI flows translated to MCP operations.

## Getting Started

The Issue Template plugin is tested exclusively via the Redmineflux MCP server. Three separate MCP server instances are configured in `~/.claude/settings.json`:

| MCP Server Name | User Context | API Key |
|-----------------|-------------|---------|
| `redmineflux` | Admin | `d8ff92a06082fbf9efc0adfead1616aa1ba7198d` |
| `redmineflux_user_perm` | User with issue template permission | `fe13c2422e3c5b20c017d15b5d83ad79e7a5da22` |
| `redmineflux_user_noperm` | User without issue template permission | `78a9c27f135c31087a360ec3017ad9f241bf065b` |

Base URL: `https://dev-flux.zehntech.com`

## MCP Tools Reference

| Tool | Description |
|------|-------------|
| `redmineflux_issue_template_create_template` | Create a new issue template |
| `redmineflux_issue_template_list_templates` | List all accessible templates (optionally filtered by project) |
| `redmineflux_issue_template_get_template` | Get a single template by ID |
| `redmineflux_issue_template_update_template` | Update an existing template |
| `redmineflux_issue_template_delete_template` | Delete a template by ID |
| `redmineflux_issue_template_apply_template` | Apply a template to pre-fill issue fields |

## Key Screens

N/A — MCP testing only (no UI interaction this cycle).

## Step-by-Step Workflows

### Workflow 1: Create and apply a global template (Admin)

1. Call `redmineflux_issue_template_create_template` with `is_global: true`, name, description, tracker_id
2. Call `redmineflux_issue_template_list_templates` — verify template appears
3. Call `redmineflux_issue_template_get_template` with the returned ID — verify fields match
4. Call `redmineflux_issue_template_apply_template` with the template ID and a target project
5. Call `redmineflux_core_create_issue` using the pre-filled values from the apply response

### Workflow 2: Create a project-scoped template (Admin)

1. Call `redmineflux_issue_template_create_template` with `project_id` set (and `is_global: false`)
2. List templates filtering by that project — template must appear
3. List templates filtering by a different project — template must NOT appear

### Workflow 3: Permission boundary test

1. As `redmineflux_user_noperm` — attempt `create_template` → expect 403 or error
2. As `redmineflux_user_perm` — attempt `create_template` → expect success
3. As `redmineflux_user_noperm` — attempt `delete_template` → expect 403 or error
4. As admin — attempt `delete_template` → expect success

### Workflow 4: Edit and verify persistence

1. Admin creates template with name "Template A", description "Original content"
2. Admin calls `update_template` with new description "Updated content"
3. Admin calls `get_template` — verify description is "Updated content"

### Workflow 5: Multiple project assignment

1. Admin creates a template
2. Admin calls `update_template` or equivalent to assign it to Project A and Project B
3. List templates for Project A — template must appear
4. List templates for Project B — template must appear

## UI Elements Reference

N/A — MCP testing only.

## Notes & Known Behavior

- Global templates (`is_global: true`) should be visible to all authenticated users regardless of project
- Project-scoped templates are only visible to project members with appropriate permissions
- The `apply_template` tool returns pre-filled field values; actual issue creation is a separate MCP call
- HTML content in template description should be accepted and returned verbatim
- "Cancel" and "Clear Form" features are UI-only and cannot be tested via MCP
