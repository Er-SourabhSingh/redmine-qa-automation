# Plugin Memory — Redmineflux MCP Issue Template

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

- `list_templates` with `project_id` filter (identifier or numeric) returns 500 — BUG-RIT-001. Unfiltered list works fine.
- `tracker_id: 0` is caught by MCP client-side validation ("must be a positive integer") before hitting the server.
- Blank `name` is caught server-side with a clear error message ("template name cannot be blank").
- `apply_template` returns pre-filled fields ready for `core_create_issue`; it does NOT create the issue automatically.
- HTML tags (h2, ul, li, ol, strong, p) are stored and returned verbatim — CKEditor content fully supported via MCP.
- Template #68 = global Bug template (QA test data, Session 1)
- Template #69 = project Task template assigned to wiftsep + flxcyb (QA test data, Session 1)
- Issue #115344 = created via template apply in TC-RIT-100 (QA test data, clean up if needed)

## Confirmed Working

- create_template (global + project-scoped)
- get_template (full field retrieval, HTML preserved)
- list_templates (unfiltered) 
- update_template (name, description, is_active, project_ids multi-assignment)
- delete_template (returns 404 on subsequent get)
- apply_template (returns pre-filled fields correctly)
- core_create_issue using apply_template output

## Recurring Issues

- list_templates with project_id filter → 500 on ALL project identifiers (wiftsep, flxcyb, ztflux, 370). Isolated to the project_id filter code path. Other filters (is_global, is_active, tracker_id) work fine. BUG-RIT-001 open (High).

## Environment Notes

- Three MCP servers configured in `~/.claude/settings.json`:
  - `redmineflux` (admin) — active from session start
  - `redmineflux_user_perm` (with permission) — requires session restart to activate
  - `redmineflux_user_noperm` (no permission) — requires session restart to activate
- TC-RIT-105, TC-RIT-106, TC-RIT-107 are pending session restart
