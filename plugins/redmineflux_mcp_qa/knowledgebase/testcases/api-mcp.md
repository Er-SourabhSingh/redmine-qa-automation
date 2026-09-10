# Test Suite: MCP Knowledgebase API
<!-- Suite: api-mcp | Plugin: redmineflux_mcp_knowledgebase | Code: RKB -->

## Plugin
- Name: redmineflux_knowledgebase
- Redmine version: 5.x (localhost:3006)
- Environment: Local
- Test Project: `test-project`
- Session 1 Run Date: 2026-06-19
- Session 2 Run Date: 2026-06-19 (BUG-RKB-001 fixed — all blocked TCs re-run)

## Users Under Test

| Role | Login | Permissions |
|------|-------|-------------|
| Admin | admin | Redmine administrator — full access |
| Manager | priya.patel | manage_knowledgebase_spaces + manage_knowledgebase_content |
| Developer | rahul.sharma | No explicit KB permissions (view_knowledgebase is public: true — auto-granted to all project members) |

## MCP Servers
- `mcp__redmineflux_admin__*` — admin API key
- `mcp__redmineflux_manager__*` — priya.patel API key
- `mcp__redmineflux_developer__*` — rahul.sharma API key

## Key Discovery
> `view_knowledgebase` is declared `public: true` in `init.rb` — **all project members get this permission automatically**, regardless of role configuration. Developer (rahul.sharma) CAN read KB data as a project member. Only write operations are gated by manage permissions.

## Fix Applied (Session 2)
> **BUG-RKB-001 FIXED** — Added optional `params` keyword argument to `RedmineClient.post()` and `put()` in `src/redmine_client.py`. Patched file copied into Docker container (`docker cp`), container restarted. All 14 KB MCP tools now work correctly for both GET and POST/PUT operations.

## Result Key
| Symbol | Meaning |
|--------|---------|
| ✅ PASS | Actual matches expected |
| ❌ FAIL | Actual differs from expected — bug filed |

## Run Summary

| Role | Total | PASS | FAIL |
|------|-------|------|------|
| Admin | 16 | 16 | 0 |
| Manager | 15 | 15 | 0 |
| Developer | 8 | 8 | 0 |
| **Total** | **39** | **39** | **0** |

**All 39 TCs PASS after BUG-RKB-001 fix.**

---

## Section A — Admin: Space Management

### TC-RKB-001 — Admin: Create a knowledgebase space

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_admin__redmineflux_kb_create_space` |
| **Role** | Admin |
| **Priority** | High |

**Input:** `{ "project_id": "test-project", "name": "Admin Test Space", "description": "..." }`

**Expected:** Space object returned with id, name, project_id.

**Actual Result:**
```
Space created: #5 'Admin Test Space' in project 'test-project'.
```
**Status:** ✅ PASS

---

### TC-RKB-002 — Admin: List all spaces in project

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_admin__redmineflux_kb_list_spaces` |
| **Role** | Admin |

**Actual Result:**
```
KB Spaces — project 'test-project' (1 total):
  #5 Admin Test Space [0 nodes] — project #1
```
**Status:** ✅ PASS

---

### TC-RKB-003 — Admin: Get a single space by ID

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_admin__redmineflux_kb_get_space` |
| **Role** | Admin |

**Actual Result:**
```
Space #5 — Admin Test Space
  Description : Space created by admin via MCP — BUG-RKB-001 fix verification
  Nodes       : 0
  Created     : 2026-06-19
```
**Status:** ✅ PASS

---

### TC-RKB-004 — Admin: Update space name and description

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_admin__redmineflux_kb_update_space` |
| **Role** | Admin |

**Actual Result:**
```
Space #5 updated. Name: 'Admin Test Space (Updated)'.
```
**Status:** ✅ PASS *(was ❌ FAIL in Session 1 — BUG-RKB-001)*

---

## Section B — Admin: Node Management

### TC-RKB-005 — Admin: Create a folder node inside space

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_admin__redmineflux_kb_create_node` |
| **Role** | Admin |

**Actual Result:**
```
Node created: #9 [folder] 'Admin Folder' in space #5 (slug: admin-folder).
```
**Status:** ✅ PASS *(was ❌ FAIL in Session 1 — BUG-RKB-001)*

---

### TC-RKB-006 — Admin: Create a page node (draft) inside folder

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_admin__redmineflux_kb_create_node` |
| **Role** | Admin |

**Actual Result:**
```
Node created: #10 [page] 'Admin Page' in space #5 (slug: admin-page). — use redmineflux_kb_publish_node to make it visible to readers.
```
**Status:** ✅ PASS *(was ❌ FAIL in Session 1 — BUG-RKB-001)*

---

### TC-RKB-007 — Admin: List nodes in space

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_admin__redmineflux_kb_list_nodes` |
| **Role** | Admin |

**Actual Result:**
```
KB Nodes — project 'test-project' (2 total, page 1):
  📁 #9 [folder/published] Admin Folder — space #5
  ○ #10 [page/draft] Admin Page (parent #9) — space #5
```
**Status:** ✅ PASS

---

### TC-RKB-008 — Admin: Get a single node by ID

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_admin__redmineflux_kb_get_node` |
| **Role** | Admin |

**Actual Result:**
```
Node #10 [page]
  Title  : Admin Page  |  Status : draft  |  Versions: 0
--- Content ---
<h1>Admin Page</h1><p>Draft page created by admin via MCP after BUG-RKB-001 fix.</p>
```
**Status:** ✅ PASS

---

### TC-RKB-009 — Admin: Update node content

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_admin__redmineflux_kb_update_node` |
| **Role** | Admin |

**Actual Result:**
```
Node #10 'Admin Page (Revised)' updated. Run redmineflux_kb_publish_node to publish the changes.
```
**Status:** ✅ PASS *(was ❌ FAIL in Session 1 — BUG-RKB-001)*

---

## Section C — Admin: Publish Workflow

### TC-RKB-010 — Admin: Publish a draft page

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_admin__redmineflux_kb_publish_node` |
| **Role** | Admin |

**Actual Result:**
```
✓ Page #10 published. Version: v1.
```
**Status:** ✅ PASS *(was ❌ FAIL in Session 1 — BUG-RKB-001)*

---

### TC-RKB-011 — Admin: Unpublish a published page

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_admin__redmineflux_kb_unpublish_node` |
| **Role** | Admin |

**Actual Result:**
```
✓ Page #10 unpublished and set to draft.
```
**Status:** ✅ PASS *(was ❌ FAIL in Session 1 — BUG-RKB-001)*

---

### TC-RKB-012 — Admin: Re-publish to create second version

| Field | Value |
|-------|-------|
| **MCP Tool** | `update_node` + `publish_node` (sequential) |
| **Role** | Admin |

**Steps:** update_node (content change) → publish_node → v2 created.

**Actual Result:**
```
Node #10 'Admin Page (Revised)' updated.
✓ Page #10 published. Version: v2.
```
**Status:** ✅ PASS *(was ❌ FAIL in Session 1 — BUG-RKB-001)*

---

## Section D — Admin: Version History

### TC-RKB-013 — Admin: List versions of a page

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_admin__redmineflux_kb_list_versions` |
| **Role** | Admin |

**Actual Result:**
```
Version history — node #10 (2 versions, newest first):
  v2 #11 by Redmine Admin on 2026-06-19 — published
  v1 #10 by Redmine Admin on 2026-06-19 — published
```
**Status:** ✅ PASS

---

### TC-RKB-014 — Admin: Restore a previous version

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_admin__redmineflux_kb_restore_version` |
| **Role** | Admin |

**Input:** `{ "project_id": "test-project", "node_id": 10, "version_id": 10 }`

**Actual Result:**
```
✓ Page #10 restored from version #10. New version: v3.
```
**Status:** ✅ PASS *(was ❌ FAIL in Session 1 — BUG-RKB-001)*

---

## Section E — Admin: Cleanup

### TC-RKB-015 — Admin: Delete a node

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_admin__redmineflux_kb_delete_node` |
| **Role** | Admin |

**Actual Result:** `✓ Node #10 deleted.`
**Status:** ✅ PASS

---

### TC-RKB-016 — Admin: Delete a space

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_admin__redmineflux_kb_delete_space` |
| **Role** | Admin |

**Actual Result:** `✓ Space deleted. All folders, pages, and version history within the space have been permanently removed.`
**Status:** ✅ PASS

---

## Section F — Manager: Space Management

### TC-RKB-017 — Manager: Create a knowledgebase space

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_manager__redmineflux_kb_create_space` |
| **Role** | Manager (priya.patel) |

**Actual Result:**
```
Space created: #6 'Manager Test Space' in project 'test-project'.
```
**Status:** ✅ PASS *(was ❌ FAIL in Session 1 — BUG-RKB-001)*

---

### TC-RKB-018 — Manager: List spaces in project

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_manager__redmineflux_kb_list_spaces` |
| **Role** | Manager |

**Actual Result:**
```
KB Spaces — project 'test-project' (1 total):
  #6 Manager Test Space [0 nodes] — project #1
```
**Status:** ✅ PASS

---

### TC-RKB-019 — Manager: Get space by ID

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_manager__redmineflux_kb_get_space` |
| **Role** | Manager |

**Actual Result:**
```
Space #6 — Manager Test Space
  Description : Space created by manager (priya.patel) via MCP
  Nodes       : 0
```
**Status:** ✅ PASS

---

### TC-RKB-020 — Manager: Update space

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_manager__redmineflux_kb_update_space` |
| **Role** | Manager |

**Actual Result:**
```
Space #6 updated. Name: 'Manager Test Space (Updated)'.
```
**Status:** ✅ PASS *(was ❌ FAIL in Session 1 — BUG-RKB-001)*

---

## Section G — Manager: Node Management

### TC-RKB-021 — Manager: Create a folder node

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_manager__redmineflux_kb_create_node` |
| **Role** | Manager |

**Actual Result:**
```
Node created: #11 [folder] 'Manager Folder' in space #6 (slug: manager-folder).
```
**Status:** ✅ PASS *(was ❌ FAIL in Session 1 — BUG-RKB-001)*

---

### TC-RKB-022 — Manager: Create a page node

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_manager__redmineflux_kb_create_node` |
| **Role** | Manager |

**Actual Result:**
```
Node created: #12 [page] 'Manager Page' in space #6 (slug: manager-page).
```
**Status:** ✅ PASS *(was ❌ FAIL in Session 1 — BUG-RKB-001)*

---

### TC-RKB-023 — Manager: List nodes in space

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_manager__redmineflux_kb_list_nodes` |
| **Role** | Manager |

**Actual Result:**
```
KB Nodes — project 'test-project' (2 total, page 1):
  📁 #11 [folder/published] Manager Folder — space #6
  ○ #12 [page/draft] Manager Page (parent #11) — space #6
```
**Status:** ✅ PASS

---

### TC-RKB-024 — Manager: Get node by ID

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_manager__redmineflux_kb_get_node` |
| **Role** | Manager |

**Actual Result:**
```
Node #12 [page]  |  Title: Manager Page  |  Status: draft  |  Author ID: 5  |  Versions: 0
```
**Status:** ✅ PASS

---

### TC-RKB-025 — Manager: Update node content

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_manager__redmineflux_kb_update_node` |
| **Role** | Manager |

**Actual Result:**
```
Node #12 'Manager Page (Revised)' updated. Run redmineflux_kb_publish_node to publish the changes.
```
**Status:** ✅ PASS *(was ❌ FAIL in Session 1 — BUG-RKB-001)*

---

## Section H — Manager: Publish Workflow

### TC-RKB-026 — Manager: Publish a page

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_manager__redmineflux_kb_publish_node` |
| **Role** | Manager |

**Actual Result:**
```
✓ Page #12 published. Version: v1.
```
**Status:** ✅ PASS *(was ❌ FAIL in Session 1 — BUG-RKB-001)*

---

### TC-RKB-027 — Manager: Unpublish a page

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_manager__redmineflux_kb_unpublish_node` |
| **Role** | Manager |

**Actual Result:**
```
✓ Page #12 unpublished and set to draft.
```
**Status:** ✅ PASS *(was ❌ FAIL in Session 1 — BUG-RKB-001)*

---

## Section I — Manager: Version History

### TC-RKB-028 — Manager: List versions of a page

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_manager__redmineflux_kb_list_versions` |
| **Role** | Manager |

**Actual Result:**
```
Version history — node #12 (2 versions, newest first):
  v2 #14 by Priya Patel on 2026-06-19 — published
  v1 #13 by Priya Patel on 2026-06-19 — published
```
**Status:** ✅ PASS

---

### TC-RKB-029 — Manager: Restore a previous version

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_manager__redmineflux_kb_restore_version` |
| **Role** | Manager |

**Input:** `{ "project_id": "test-project", "node_id": 12, "version_id": 13 }`

**Actual Result:**
```
✓ Page #12 restored from version #13. New version: v3.
```
**Status:** ✅ PASS *(was ❌ FAIL in Session 1 — BUG-RKB-001)*

---

## Section J — Manager: Cleanup

### TC-RKB-030 — Manager: Delete a node

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_manager__redmineflux_kb_delete_node` |
| **Role** | Manager |

**Actual Result:** `✓ Node #12 deleted.`
**Status:** ✅ PASS

---

### TC-RKB-031 — Manager: Delete a space

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_manager__redmineflux_kb_delete_space` |
| **Role** | Manager |

**Actual Result:** `✓ Space deleted. All folders, pages, and version history within the space have been permanently removed.`
**Status:** ✅ PASS

---

## Section K — Developer: Permission Enforcement

> **Note:** `view_knowledgebase` is `public: true` in `init.rb`. All project members receive it automatically. Developer CAN read KB data. Only write operations require explicit manage permissions and return 403.

### TC-RKB-032 — Developer: List spaces

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_developer__redmineflux_kb_list_spaces` |
| **Role** | Developer |

**Expected (revised):** Returns spaces — view_knowledgebase is public.

**Actual Result:**
```
KB Spaces — project 'test-project' (1 total):
  #6 Manager Test Space (Updated) [2 nodes] — project #1
```
**Status:** ✅ PASS (by design — view permission is public: true)

---

### TC-RKB-033 — Developer: Create space → must be denied

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_developer__redmineflux_kb_create_space` |
| **Role** | Developer |

**Expected:** 403 — no manage_knowledgebase_spaces permission.

**Actual Result:**
```
You do not have permission to manage knowledgebase spaces.
To fix this, ask your Redmine administrator to: Grant you the required role/permission...
```
**Status:** ✅ PASS — 403 returned correctly *(was ❌ FAIL in Session 1 — TypeError masked the 403)*

---

### TC-RKB-034 — Developer: Get space by ID

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_developer__redmineflux_kb_get_space` |
| **Role** | Developer |

**Actual Result:**
```
Space #6 — Manager Test Space (Updated)  |  Nodes: 2
```
**Status:** ✅ PASS (by design)

---

### TC-RKB-035 — Developer: List nodes

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_developer__redmineflux_kb_list_nodes` |
| **Role** | Developer |

**Actual Result:**
```
KB Nodes — project 'test-project' (2 total, page 1):
  📁 #11 [folder/published] Manager Folder — space #6
  ✓ #12 [page/published] Manager Page (Revised) (parent #11) — space #6
```
**Status:** ✅ PASS (by design)

---

### TC-RKB-036 — Developer: Create node → must be denied

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_developer__redmineflux_kb_create_node` |
| **Role** | Developer |

**Actual Result:**
```
You do not have permission to manage knowledgebase pages.
To fix this, ask your Redmine administrator to: Grant you the required role/permission...
```
**Status:** ✅ PASS — 403 returned correctly *(was ❌ FAIL in Session 1 — TypeError masked the 403)*

---

### TC-RKB-037 — Developer: Get node by ID

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_developer__redmineflux_kb_get_node` |
| **Role** | Developer |

**Actual Result:**
```
Node #12 [page]  |  Title: Manager Page (Revised)  |  Status: published  |  Versions: 3
```
**Status:** ✅ PASS (by design)

---

### TC-RKB-038 — Developer: Publish node → must be denied

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_developer__redmineflux_kb_publish_node` |
| **Role** | Developer |

**Actual Result:**
```
You do not have permission to manage knowledgebase pages.
To fix this, ask your Redmine administrator to: Grant you the required role/permission...
```
**Status:** ✅ PASS — 403 returned correctly *(was ❌ FAIL in Session 1 — TypeError masked the 403)*

---

### TC-RKB-039 — Developer: List versions

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_developer__redmineflux_kb_list_versions` |
| **Role** | Developer |

**Actual Result:**
```
Version history — node #12 (3 versions, newest first):
  v3 #15 by Priya Patel on 2026-06-19 — restored:1
  v2 #14 by Priya Patel on 2026-06-19 — published
  v1 #13 by Priya Patel on 2026-06-19 — published
```
**Status:** ✅ PASS (by design)

---

### TC-RKB-039b — Developer: Delete node → must be denied

| Field | Value |
|-------|-------|
| **MCP Tool** | `mcp__redmineflux_developer__redmineflux_kb_delete_node` |
| **Role** | Developer |

**Actual Result:**
```
You do not have permission to manage knowledgebase pages.
To fix this, ask your Redmine administrator to: Grant you the required role/permission...
```
**Status:** ✅ PASS — permission enforcement works correctly

---

## Evidence Map

| TC ID | Role | Tool | Session 1 | Session 2 |
|-------|------|------|-----------|-----------|
| TC-RKB-001 | Admin | create_space | ❌ FAIL | ✅ PASS |
| TC-RKB-002 | Admin | list_spaces | ✅ PASS | ✅ PASS |
| TC-RKB-003 | Admin | get_space | ✅ PASS | ✅ PASS |
| TC-RKB-004 | Admin | update_space | ❌ FAIL | ✅ PASS |
| TC-RKB-005 | Admin | create_node (folder) | ❌ FAIL | ✅ PASS |
| TC-RKB-006 | Admin | create_node (page) | ❌ FAIL | ✅ PASS |
| TC-RKB-007 | Admin | list_nodes | ✅ PASS | ✅ PASS |
| TC-RKB-008 | Admin | get_node | ✅ PASS | ✅ PASS |
| TC-RKB-009 | Admin | update_node | ❌ FAIL | ✅ PASS |
| TC-RKB-010 | Admin | publish_node | ❌ FAIL | ✅ PASS |
| TC-RKB-011 | Admin | unpublish_node | ❌ FAIL | ✅ PASS |
| TC-RKB-012 | Admin | update+publish (v2) | ❌ FAIL | ✅ PASS |
| TC-RKB-013 | Admin | list_versions | ✅ PASS | ✅ PASS |
| TC-RKB-014 | Admin | restore_version | ❌ FAIL | ✅ PASS |
| TC-RKB-015 | Admin | delete_node | ✅ PASS | ✅ PASS |
| TC-RKB-016 | Admin | delete_space | ✅ PASS | ✅ PASS |
| TC-RKB-017 | Manager | create_space | ❌ FAIL | ✅ PASS |
| TC-RKB-018 | Manager | list_spaces | ✅ PASS | ✅ PASS |
| TC-RKB-019 | Manager | get_space | ✅ PASS | ✅ PASS |
| TC-RKB-020 | Manager | update_space | ❌ FAIL | ✅ PASS |
| TC-RKB-021 | Manager | create_node (folder) | ❌ FAIL | ✅ PASS |
| TC-RKB-022 | Manager | create_node (page) | ❌ FAIL | ✅ PASS |
| TC-RKB-023 | Manager | list_nodes | ✅ PASS | ✅ PASS |
| TC-RKB-024 | Manager | get_node | ✅ PASS | ✅ PASS |
| TC-RKB-025 | Manager | update_node | ❌ FAIL | ✅ PASS |
| TC-RKB-026 | Manager | publish_node | ❌ FAIL | ✅ PASS |
| TC-RKB-027 | Manager | unpublish_node | ❌ FAIL | ✅ PASS |
| TC-RKB-028 | Manager | list_versions | ✅ PASS | ✅ PASS |
| TC-RKB-029 | Manager | restore_version | ❌ FAIL | ✅ PASS |
| TC-RKB-030 | Manager | delete_node | ✅ PASS | ✅ PASS |
| TC-RKB-031 | Manager | delete_space | ✅ PASS | ✅ PASS |
| TC-RKB-032 | Developer | list_spaces | ✅ PASS | ✅ PASS |
| TC-RKB-033 | Developer | create_space → 403 | ❌ FAIL | ✅ PASS |
| TC-RKB-034 | Developer | get_space | ✅ PASS | ✅ PASS |
| TC-RKB-035 | Developer | list_nodes | ✅ PASS | ✅ PASS |
| TC-RKB-036 | Developer | create_node → 403 | ❌ FAIL | ✅ PASS |
| TC-RKB-037 | Developer | get_node | ✅ PASS | ✅ PASS |
| TC-RKB-038 | Developer | publish_node → 403 | ❌ FAIL | ✅ PASS |
| TC-RKB-039 | Developer | list_versions | ✅ PASS | ✅ PASS |
| TC-RKB-039b | Developer | delete_node → 403 | ✅ PASS | ✅ PASS |
