# Plugin Flow — Redmineflux MCP Issue Template

## Flow 1: Create global template → apply → create issue

1. Admin calls `create_template` with `is_global: true`, name, description, tracker_id
2. MCP returns created template with ID
3. Any user calls `list_templates` — global template appears
4. User calls `apply_template` with template ID and project_id
5. MCP returns pre-filled issue fields (subject, description, tracker, priority)
6. User calls `core_create_issue` with the pre-filled fields + project_id
7. Issue is created successfully with template content

## Flow 2: Create project template → visibility check

1. Admin calls `create_template` with `project_id` set, `is_global: false`
2. Member of that project calls `list_templates` for that project — template appears
3. User without project membership calls `list_templates` for that project — template does NOT appear

## Flow 3: Edit template → verify persistence

1. Admin calls `create_template` — get template ID
2. Admin calls `update_template` with changed fields
3. Admin calls `get_template` — verify changes persisted correctly

## Flow 4: Permission boundary — no-permission user

1. `redmineflux_user_noperm` calls `create_template` → expect 403/error
2. `redmineflux_user_noperm` calls `delete_template` on existing template → expect 403/error
3. `redmineflux_user_noperm` calls `list_templates` → expect empty or 403

## Flow 5: Delete template

1. Admin calls `create_template` — get ID
2. Admin calls `delete_template` with ID
3. Admin calls `get_template` with same ID → expect 404 or not found
4. Admin calls `list_templates` — deleted template no longer appears
