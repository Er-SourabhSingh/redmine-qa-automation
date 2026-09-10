# Plugin Memory — Redmine Flux MCP Knowledgebase

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

- `view_knowledgebase` is declared `public: true` in `init.rb` — **all project members** receive this permission automatically, regardless of role configuration. Do NOT expect 403 for Developer read operations. Revise test expectations accordingly.
- The Redmine KB API uses **nested params**: spaces need `{"rf_knowledgebase_space":{"name":"..."}}` and nodes need `{"rf_knowledgebase_node":{...}}`. Flat JSON body returns 400.
- `project_id` must be passed as a **query parameter** (`?project_id=test-project`), not in the request body.
- Publish requires page to be in `draft` status — calling publish on an already-published page returns `{"success":false,"message":"Page must be in draft status to publish"}`.
- After unpublishing, `explicitly_unpublished = true` is set, which means even if a published version exists, the page is hidden from regular members until re-published.
- Version history is only created on `publish!()` and `restore_version!()` — not on save/update alone.

## Confirmed Working (all 14 MCP tools — Session 2 retest after BUG-RKB-001 fix)

**Admin and Manager (full read + write):**
- `list_spaces` ✅
- `get_space` ✅
- `create_space` ✅ (fixed — BUG-RKB-001)
- `update_space` ✅ (fixed — BUG-RKB-001)
- `delete_space` ✅
- `list_nodes` ✅
- `get_node` ✅
- `create_node` ✅ (fixed — BUG-RKB-001)
- `update_node` ✅ (fixed — BUG-RKB-001)
- `delete_node` ✅
- `publish_node` ✅ (fixed — BUG-RKB-001)
- `unpublish_node` ✅ (fixed — BUG-RKB-001)
- `list_versions` ✅
- `restore_version` ✅ (fixed — BUG-RKB-001)

**Developer (read-only — write operations correctly return 403):**
- All read tools: list_spaces, get_space, list_nodes, get_node, list_versions ✅
- All write tools: 403 returned with descriptive error message ✅

## Bugs

- **BUG-RKB-001** — CLOSED (2026-06-19). `RedmineClient.post()` and `put()` lacked `params` parameter. Fixed by adding `params: dict[str, Any] | None = None` to both methods. Patched via `docker cp` into running container.

## API URL Format (critical)

- POST/PATCH to KB API **requires `.json` extension**: `/api/knowledgebase/spaces.json`, `/api/knowledgebase/nodes.json`, `/api/knowledgebase/nodes/:id.json`, etc.
- Without `.json`, Rails CSRF middleware intercepts and returns HTTP 422 with empty body (even with X-Redmine-API-Key header and X-CSRF-Token)
- GET requests work without `.json` extension

## Environment Notes

- Redmine: localhost:3006, admin password: `12345678`
- Admin API key: `7d81d2f4918cba2a43a8f6e9db14d4bcc9dca045`
- Manager (priya.patel) API key: `e75cc2a2e036e785c3010840b7e79c584f71f1cc`
- Developer (rahul.sharma) API key: `8e0e970568c5e38d580949209b46a6a1ced97186`
- MCP server: Docker container `redmineflux-mcp`, nginx on port 80
- Test project identifier: `test-project` (project ID=1)
- Source files are **baked into Docker image** (not mounted volumes). Changes require `docker cp` into running container + restart.
- Container restart drops SSE connection — VS Code MCP servers must be reloaded (Ctrl+Shift+P → "Claude Code: Reload MCP Servers") after restart.
