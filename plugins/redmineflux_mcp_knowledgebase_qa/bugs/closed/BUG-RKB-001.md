# BUG-RKB-001 — All MCP write operations fail with TypeError (post/put params keyword argument)

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-RKB-001 |
| **Severity** | Critical |
| **Status** | **Closed — Fixed** |
| **Plugin** | redmineflux_knowledgebase (MCP server) |
| **Redmine Version** | 5.x (localhost:3006) |
| **Found During** | TC-RKB-001, TC-RKB-004 to TC-RKB-006, TC-RKB-009 to TC-RKB-012, TC-RKB-014, TC-RKB-017, TC-RKB-020 to TC-RKB-022, TC-RKB-025 to TC-RKB-027, TC-RKB-029, TC-RKB-033, TC-RKB-036, TC-RKB-038 |
| **Found By** | QA MCP execution — 2026-06-19 |
| **Closed By** | QA (code fix + retest) — 2026-06-19 |
| **Environment** | Local — localhost:3006, MCP server via Docker (redmineflux-mcp container) |

---

## Summary

All MCP write operations (create, update, publish, unpublish, restore) for the knowledgebase plugin failed with a Python `TypeError`. Only read (GET) and delete (DELETE) operations worked. **Fixed in Session 2.**

---

## Affected MCP Tools (all 3 servers — admin, manager, developer)

| Tool | HTTP Method | Error |
|------|-------------|-------|
| `redmineflux_kb_create_space` | POST | `TypeError: RedmineClient.post() got an unexpected keyword argument 'params'` |
| `redmineflux_kb_update_space` | PUT | `TypeError: RedmineClient.put() got an unexpected keyword argument 'params'` |
| `redmineflux_kb_create_node` | POST | `TypeError: RedmineClient.post() got an unexpected keyword argument 'params'` |
| `redmineflux_kb_update_node` | PUT | `TypeError: RedmineClient.put() got an unexpected keyword argument 'params'` |
| `redmineflux_kb_publish_node` | POST | `TypeError: RedmineClient.post() got an unexpected keyword argument 'params'` |
| `redmineflux_kb_unpublish_node` | POST | `TypeError: RedmineClient.post() got an unexpected keyword argument 'params'` |
| `redmineflux_kb_restore_version` | POST | `TypeError: RedmineClient.post() got an unexpected keyword argument 'params'` |

**Working tools (GET + DELETE, unaffected):**
`list_spaces`, `get_space`, `list_nodes`, `get_node`, `list_versions`, `delete_node`, `delete_space`

---

## Steps to Reproduce (historical)

1. Connect to `mcp__redmineflux_admin__*` (or manager/developer)
2. Call any write operation, e.g. `mcp__redmineflux_admin__redmineflux_kb_create_space`:
   ```json
   { "project_id": "test-project", "name": "My Space" }
   ```
3. Observe error immediately — no HTTP request reaches Redmine

---

## Expected Result

Space is created; response includes `id`, `name`, `project_id`.

---

## Actual Result (before fix)

```
Unexpected error creating space: TypeError: RedmineClient.post() got an unexpected keyword argument 'params'
```

---

## Root Cause Analysis

`knowledgebase.py` calls `client.post(url, json=body, params={"project_id": project_id})` for all write operations. `RedmineClient.post()` and `put()` in `redmine_client.py` did not accept a `params` keyword argument — their signatures were:

```python
async def post(self, path: str, json: dict[str, Any]) -> dict:
async def put(self, path: str, json: dict[str, Any]) -> dict | None:
```

The `params` kwarg passed by `knowledgebase.py` had no corresponding parameter, causing Python to raise `TypeError` before any HTTP call was made.

---

## Fix Applied (2026-06-19)

**File:** `c:\redmine\plugins\redmineflux-mcp\src\redmine_client.py`

Added optional `params: dict[str, Any] | None = None` to both `post()` and `put()`, forwarding to `_request_with_retry()`:

```python
# BEFORE
async def post(self, path: str, json: dict[str, Any]) -> dict:
    response = await self._request_with_retry("post", path, json=json)

async def put(self, path: str, json: dict[str, Any]) -> dict | None:
    response = await self._request_with_retry("put", path, json=json)

# AFTER
async def post(self, path: str, json: dict[str, Any], params: dict[str, Any] | None = None) -> dict:
    response = await self._request_with_retry("post", path, params=params, json=json)

async def put(self, path: str, json: dict[str, Any], params: dict[str, Any] | None = None) -> dict | None:
    response = await self._request_with_retry("put", path, params=params, json=json)
```

**Deployment:** File edited on host then copied into running Docker container:
```
docker cp "c:\redmine\plugins\redmineflux-mcp\src\redmine_client.py" "redmineflux-mcp:/app/src/redmine_client.py"
docker restart redmineflux-mcp
```

---

## Retest Result (Session 2 — 2026-06-19)

All 19 previously-blocked TCs re-run via MCP tools. All 19 PASS:

| TC | Tool | Role | Result |
|----|------|------|--------|
| TC-RKB-001 | create_space | Admin | ✅ PASS |
| TC-RKB-004 | update_space | Admin | ✅ PASS |
| TC-RKB-005 | create_node (folder) | Admin | ✅ PASS |
| TC-RKB-006 | create_node (page) | Admin | ✅ PASS |
| TC-RKB-009 | update_node | Admin | ✅ PASS |
| TC-RKB-010 | publish_node | Admin | ✅ PASS |
| TC-RKB-011 | unpublish_node | Admin | ✅ PASS |
| TC-RKB-012 | update+publish (v2) | Admin | ✅ PASS |
| TC-RKB-014 | restore_version | Admin | ✅ PASS |
| TC-RKB-017 | create_space | Manager | ✅ PASS |
| TC-RKB-020 | update_space | Manager | ✅ PASS |
| TC-RKB-021 | create_node (folder) | Manager | ✅ PASS |
| TC-RKB-022 | create_node (page) | Manager | ✅ PASS |
| TC-RKB-025 | update_node | Manager | ✅ PASS |
| TC-RKB-026 | publish_node | Manager | ✅ PASS |
| TC-RKB-027 | unpublish_node | Manager | ✅ PASS |
| TC-RKB-029 | restore_version | Manager | ✅ PASS |
| TC-RKB-033 | create_space → 403 | Developer | ✅ PASS |
| TC-RKB-036 | create_node → 403 | Developer | ✅ PASS |
| TC-RKB-038 | publish_node → 403 | Developer | ✅ PASS |

**Bug closed. All 39 TCs PASS via MCP tools.**

---

## Impact (resolved)

- All 14 knowledgebase MCP tools now functional
- Permission enforcement (403) correctly surfaced for Developer role after fix
- No workaround needed
