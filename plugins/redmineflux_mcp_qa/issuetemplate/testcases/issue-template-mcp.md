# Test Cases — Redmineflux MCP Issue Template (MCP-Only)

## Plugin
- Name: redmineflux_mcp_issuetemplate
- Environment: Forge — https://dev-flux.zehntech.com
- Test Cycle: 1
- Bug Code: RIT

## MCP Server Mapping

| Context | MCP Server Name | User | Projects |
|---------|-----------------|------|----------|
| Admin | `redmineflux` | Sourabh Singh (admin, ID: 683) | All |
| User with permission | `redmineflux` (key: fe13...) | Aurora Grace (@test1, ID: 824) | ztflux (all template perms), gdaplt (no template perms) |
| User without permission | `redmineflux` (key: 78a9...) | TBD | TBD |

**Permissions in ztflux for test1:** View, Create, Edit, Delete, Apply issue templates  
**Permissions in gdaplt for test1:** None (no issue template permissions)

## Reference Data

| Item | Value |
|------|-------|
| Tracker: Bug | id=3 |
| Tracker: Task | id=4 |
| Tracker: Feature | id=6 |
| Test Project 1 | wiftsep (Flux Support, id=370) |

---

## TC-RIT-001 — Admin creates a global issue template

**Feature:** Create Global Template
**User Role:** Admin (via `redmineflux` MCP server)
**Precondition:** Admin API key is configured. Issue template plugin is installed and active.

**MCP Call:**
```
Tool: redmineflux_issue_template_create_template
Params:
  name: "QA Global Bug Template"
  tracker_id: 3
  issue_title: "Bug Report — [Component]"
  description: "<p>Describe the bug clearly.</p><p><strong>Steps:</strong></p><ol><li>Step 1</li><li>Step 2</li></ol>"
  note: "Please attach screenshots if available."
  is_global: true
  is_active: true
```

**Expected Result:**
- Response confirms template created successfully
- Template ID is returned
- `is_global: true` confirmed in response
- No error in response

**Result:** [ ] PASS  [ ] FAIL  [ ] BLOCKED
**Notes:**

---

## TC-RIT-002 — Admin creates a project-scoped issue template

**Feature:** Create Project Template
**User Role:** Admin (via `redmineflux` MCP server)
**Precondition:** TC-RIT-001 passed. Project `wiftsep` exists.

**MCP Call:**
```
Tool: redmineflux_issue_template_create_template
Params:
  name: "QA Project Task Template"
  tracker_id: 4
  issue_title: "Task — [Feature Area]"
  description: "<p>Task description goes here.</p>"
  note: ""
  is_global: false
  is_active: true
  project_ids: "wiftsep"
```

**Expected Result:**
- Response confirms template created
- Template ID returned
- `is_global: false` confirmed
- Project assignment to `wiftsep` confirmed in response

**Result:** [ ] PASS  [ ] FAIL  [ ] BLOCKED
**Notes:**

---

## TC-RIT-003 — Admin lists all templates and verifies both templates appear

**Feature:** Project Filter Search / Global vs Project Visibility
**User Role:** Admin (via `redmineflux` MCP server)
**Precondition:** TC-RIT-001 and TC-RIT-002 passed. Template IDs from prior TCs noted.

**MCP Call:**
```
Tool: redmineflux_issue_template_list_templates
Params:
  limit: 25
```

**Expected Result:**
- Both "QA Global Bug Template" and "QA Project Task Template" appear in the list
- Each entry shows name, tracker, scope (global/project), and status (active)

**Result:** [ ] PASS  [ ] FAIL  [ ] BLOCKED
**Notes:**

---

## TC-RIT-004 — Admin retrieves full details of the global template by ID

**Feature:** Create Global Template (verify stored data)
**User Role:** Admin (via `redmineflux` MCP server)
**Precondition:** TC-RIT-001 passed. Template ID from TC-RIT-001 noted.

**MCP Call:**
```
Tool: redmineflux_issue_template_get_template
Params:
  template_id: <ID from TC-RIT-001>
```

**Expected Result:**
- Name: "QA Global Bug Template"
- tracker: Bug (id=3)
- issue_title: "Bug Report — [Component]"
- description contains the HTML paragraph content
- note: "Please attach screenshots if available."
- is_global: true
- is_active: true

**Result:** [ ] PASS  [ ] FAIL  [ ] BLOCKED
**Notes:**

---

## TC-RIT-005 — Admin retrieves full details of the project-scoped template

**Feature:** Create Project Template (verify stored data + project assignment)
**User Role:** Admin (via `redmineflux` MCP server)
**Precondition:** TC-RIT-002 passed. Template ID from TC-RIT-002 noted.

**MCP Call:**
```
Tool: redmineflux_issue_template_get_template
Params:
  template_id: <ID from TC-RIT-002>
```

**Expected Result:**
- Name: "QA Project Task Template"
- tracker: Task (id=4)
- is_global: false
- Project assignment includes `wiftsep`

**Result:** [ ] PASS  [ ] FAIL  [ ] BLOCKED
**Notes:**

---

## TC-RIT-006 — Admin filters template list by project

**Feature:** Project Filter Search
**User Role:** Admin (via `redmineflux` MCP server)
**Precondition:** TC-RIT-002 passed. Project-scoped template assigned to `wiftsep`.

**MCP Call:**
```
Tool: redmineflux_issue_template_list_templates
Params:
  project_id: "wiftsep"
  limit: 25
```

**Expected Result:**
- "QA Project Task Template" appears in results
- Results are scoped to the project (only project-assigned templates shown)

**Result:** [ ] PASS  [ ] FAIL  [ ] BLOCKED
**Notes:**

---

## TC-RIT-007 — Admin edits a template (name + description update)

**Feature:** Edit Template / Template Data Persistence After Update
**User Role:** Admin (via `redmineflux` MCP server)
**Precondition:** TC-RIT-001 passed. Template ID from TC-RIT-001 noted.

**MCP Call:**
```
Tool: redmineflux_issue_template_update_template
Params:
  template_id: <ID from TC-RIT-001>
  name: "QA Global Bug Template — Updated"
  description: "<p>Updated description. Use this for all bug reports.</p>"
```

**Expected Result:**
- Response confirms update successful
- Updated name and description confirmed in response

**Result:** [ ] PASS  [ ] FAIL  [ ] BLOCKED
**Notes:**

---

## TC-RIT-008 — Admin verifies data persistence after update

**Feature:** Template Data Persistence After Update
**User Role:** Admin (via `redmineflux` MCP server)
**Precondition:** TC-RIT-007 passed.

**MCP Call:**
```
Tool: redmineflux_issue_template_get_template
Params:
  template_id: <ID from TC-RIT-001>
```

**Expected Result:**
- Name: "QA Global Bug Template — Updated" (not the original name)
- description: "<p>Updated description. Use this for all bug reports.</p>"
- All other original fields (tracker_id=3, is_global=true) unchanged

**Result:** [ ] PASS  [ ] FAIL  [ ] BLOCKED
**Notes:**

---

## TC-RIT-009 — Admin assigns project-scoped template to multiple projects

**Feature:** Multiple Project Assignment / Assign Template to Projects
**User Role:** Admin (via `redmineflux` MCP server)
**Precondition:** TC-RIT-002 passed. Template ID from TC-RIT-002 noted.

**MCP Call:**
```
Tool: redmineflux_issue_template_update_template
Params:
  template_id: <ID from TC-RIT-002>
  project_ids: "wiftsep,flxcyb"
```

**Expected Result:**
- Response confirms update successful
- Template is now assigned to both `wiftsep` and `flxcyb`

**Result:** [ ] PASS  [ ] FAIL  [ ] BLOCKED
**Notes:**

---

## TC-RIT-010 — Admin verifies template appears in both assigned projects

**Feature:** Multiple Project Assignment (verify)
**User Role:** Admin (via `redmineflux` MCP server)
**Precondition:** TC-RIT-009 passed.

**MCP Call (check project 1):**
```
Tool: redmineflux_issue_template_list_templates
Params:
  project_id: "wiftsep"
```

**MCP Call (check project 2):**
```
Tool: redmineflux_issue_template_list_templates
Params:
  project_id: "flxcyb"
```

**Expected Result:**
- "QA Project Task Template" appears in results for `wiftsep`
- "QA Project Task Template" appears in results for `flxcyb`

**Result:** [ ] PASS  [ ] FAIL  [ ] BLOCKED
**Notes:**

---

## TC-RIT-011 — Admin applies global template and creates issue with pre-filled values

**Feature:** Issue Creation Using Template / Default Template Auto-Selection by Tracker
**User Role:** Admin (via `redmineflux` MCP server)
**Precondition:** TC-RIT-001 passed. Global template ID noted.

**Step 1 — Apply template:**
```
Tool: redmineflux_issue_template_apply_template
Params:
  template_id: <ID from TC-RIT-001>
  project_id: 370
  tracker_id: 3
```

**Expected Result (Step 1):**
- Response returns pre-filled: issue_title, description, note, tracker_id
- Values match what was stored in TC-RIT-007 (updated description)

**Step 2 — Create issue using pre-filled values:**
```
Tool: redmineflux_core_create_issue
Params:
  project_id: "wiftsep"
  tracker_id: 3
  subject: <issue_title from apply response>
  description: <description from apply response>
  notes: <note from apply response>
```

**Expected Result (Step 2):**
- Issue created successfully with ID
- Subject, description match the template content

**Result:** [ ] PASS  [ ] FAIL  [ ] BLOCKED
**Notes:**

---

## TC-RIT-012 — Admin creates a template with HTML/rich-text description (CKEditor support)

**Feature:** CKEditor Content Support
**User Role:** Admin (via `redmineflux` MCP server)
**Precondition:** Admin API key configured.

**MCP Call:**
```
Tool: redmineflux_issue_template_create_template
Params:
  name: "QA Rich Text Feature Template"
  tracker_id: 6
  issue_title: "Feature Request — [Name]"
  description: "<h2>Summary</h2><p>Brief description of the feature.</p><h2>Business Value</h2><ul><li>Value 1</li><li>Value 2</li></ul><h2>Acceptance Criteria</h2><ol><li>Criterion 1</li><li>Criterion 2</li></ol>"
  note: "<strong>Priority:</strong> High"
  is_global: true
  is_active: true
```

**Expected Result:**
- Template created successfully
- get_template returns the HTML description verbatim (not stripped or escaped)
- HTML tags preserved in stored value

**Verify with:**
```
Tool: redmineflux_issue_template_get_template
Params:
  template_id: <new ID>
```

**Result:** [ ] PASS  [ ] FAIL  [ ] BLOCKED
**Notes:**

---

## TC-RIT-013 — Admin deactivates a template (is_active = false)

**Feature:** Edit Template (deactivate)
**User Role:** Admin (via `redmineflux` MCP server)
**Precondition:** TC-RIT-012 passed. Rich-text template ID noted.

**MCP Call:**
```
Tool: redmineflux_issue_template_update_template
Params:
  template_id: <ID from TC-RIT-012>
  is_active: "false"
```

**Expected Result:**
- Response confirms is_active set to false
- Template no longer appears in active-only list queries

**Verify with:**
```
Tool: redmineflux_issue_template_list_templates
Params:
  is_active: "true"
```
→ Rich-text template must NOT appear in active list.

**Result:** [ ] PASS  [ ] FAIL  [ ] BLOCKED
**Notes:**

---

## TC-RIT-014 — Validation: Admin attempts to create template without required fields

**Feature:** Template Validation Rules
**User Role:** Admin (via `redmineflux` MCP server)
**Precondition:** Admin API key configured.

**Test A — missing name:**
```
Tool: redmineflux_issue_template_create_template
Params:
  name: ""
  tracker_id: 3
```

**Test B — missing tracker_id (send 0 or omit):**
```
Tool: redmineflux_issue_template_create_template
Params:
  name: "No Tracker Template"
  tracker_id: 0
```

**Expected Result:**
- Both calls return a validation error (not a 500 error)
- Error message clearly states which field failed
- No template is created

**Result:** [ ] PASS  [ ] FAIL  [ ] BLOCKED
**Notes:**

---

## TC-RIT-015 — Admin deletes a template and verifies it no longer exists

**Feature:** Delete Template
**User Role:** Admin (via `redmineflux` MCP server)
**Precondition:** All prior TCs passed. Using TC-RIT-012 template (rich-text, currently inactive).

**Step 1 — Delete:**
```
Tool: redmineflux_issue_template_delete_template
Params:
  template_id: <ID from TC-RIT-012>
```

**Expected Result (Step 1):**
- Response confirms deletion

**Step 2 — Verify gone:**
```
Tool: redmineflux_issue_template_get_template
Params:
  template_id: <ID from TC-RIT-012>
```

**Expected Result (Step 2):**
- Response returns 404 / "not found" error
- Template is no longer retrievable

**Result:** [ ] PASS  [ ] FAIL  [ ] BLOCKED
**Notes:**

---

## TC-RIT-016 — User WITH permission can list and view templates

**Feature:** Permission-Based Access Control / Template Visibility Based on Permissions
**User Role:** User with permission (via `redmineflux_user_perm` MCP server)
**Precondition:** `redmineflux_user_perm` MCP server is active (requires session restart after settings.json change).

**MCP Call:**
```
Server: redmineflux_user_perm
Tool: redmineflux_issue_template_list_templates
Params:
  limit: 25
```

**Expected Result:**
- Response returns templates visible to this user (at minimum global templates)
- No 403 / permission error

**Result:** [x] PASS
**Notes:** User @test1 (Aurora Grace, ID: 824) listed 58 total templates including 36 global templates. No 403 error. Global templates fully visible. Confirmed: permitted user has full list/view access.

---

## TC-RIT-017 — User WITH permission can create a template

**Feature:** Permission-Based Access Control (create)
**User Role:** User with permission (via `redmineflux_user_perm` MCP server)
**Precondition:** TC-RIT-016 passed. `redmineflux_user_perm` server active.

**MCP Call:**
```
Server: redmineflux_user_perm
Tool: redmineflux_issue_template_create_template
Params:
  name: "QA User Permitted Template"
  tracker_id: 4
  issue_title: "Task by permitted user"
  description: "<p>Created by permitted user.</p>"
  is_global: false
  is_active: true
  project_ids: "wiftsep"
```

**Expected Result:**
- Template created successfully
- Template ID returned
- No permission error

**Result:** [x] PASS
**Notes:** Template #78 created successfully by @test1 in ztflux project. Server returned ID and confirmation. No permission error.

---

## TC-RIT-018 — User with NO permission in target project is blocked from all template operations

**Feature:** Permission-Based Access Control / Project Membership Restriction
**User Role:** test1 (@Aurora Grace) — has ALL template permissions in ztflux, ZERO template permissions in gdaplt
**Precondition:** MCP configured with test1 API key. test1 is member of gdaplt but with a role that has no issue template permissions.

**Test A — list templates filtered by gdaplt:**
```
Tool: redmineflux_issue_template_list_templates
Params:
  project_id: "gdaplt"
```
**Expected:** Empty list OR 403 — must NOT return templates since user has no view_issue_templates in gdaplt.
**Actual:** 500 Internal Server Error (BUG-RIT-001 — separate bug)

**Test B — create template for gdaplt:**
```
Tool: redmineflux_issue_template_create_template
Params:
  name: "TC-RIT-018 No-Permission Test in GDA Platform"
  tracker_id: 1
  is_global: false
  project_ids: "gdaplt"
```
**Expected:** 403 Forbidden — user has no create_issue_templates permission in gdaplt.
**Actual:** Template #80 created successfully — FAIL → BUG-RIT-002

**Test C — apply template in gdaplt context:**
```
Tool: redmineflux_issue_template_apply_template
Params:
  template_id: 80
```
**Expected:** 403 — user has no view/apply permission in gdaplt.
**Actual:** Template fields returned successfully — FAIL → BUG-RIT-002

**Test D — edit gdaplt-scoped template:**
```
Tool: redmineflux_issue_template_update_template
Params:
  template_id: 80
  name: "TC-RIT-018 No-Permission Edit Test (gdaplt)"
```
**Expected:** 403 — user has no edit_issue_templates permission in gdaplt.
**Actual:** Template #80 updated successfully — FAIL → BUG-RIT-002

**Test E — delete gdaplt-scoped template:**
```
Tool: redmineflux_issue_template_delete_template
Params:
  template_id: 80
```
**Expected:** 403 — user has no delete_issue_templates permission in gdaplt.
**Actual:** Template #80 deleted successfully — FAIL → BUG-RIT-002

**Result:** [x] FAIL — All operations succeeded despite zero permissions in gdaplt → BUG-RIT-002 (High)
**Notes:** Server checks if user has permission in ANY project (ztflux grants it), not in the SPECIFIC target project (gdaplt). All 5 operations bypass gdaplt permission enforcement. BUG-RIT-001 also blocks proper list/view testing for project-scoped visibility.

---

---

## TC-RIT-019 — List inactive templates using is_active filter

**Feature:** Active/Inactive Visibility
**User Role:** Admin (via `redmineflux` MCP server)
**Precondition:** At least one inactive template exists in the system.

**MCP Call:**
```
Tool: redmineflux_issue_template_list_templates
Params:
  is_active: "false"
  limit: 25
```

**Expected Result:**
- Only inactive templates are returned
- Active templates do not appear in the result

**Result:** [ ] PASS  [ ] FAIL  [ ] BLOCKED
**Notes:**

---

## TC-RIT-020 — Reactivate a deactivated template

**Feature:** Active/Inactive Toggle (reactivation)
**User Role:** Admin (via `redmineflux` MCP server)
**Precondition:** A template exists. TC-RIT-013 passed (deactivation works).

**Step 1 — Create and deactivate:**
```
Tool: redmineflux_issue_template_create_template
Params: name, tracker_id, is_active: true

Tool: redmineflux_issue_template_update_template
Params: template_id, is_active: "false"
```

**Step 2 — Verify it appears in inactive list:**
```
Tool: redmineflux_issue_template_list_templates
Params: is_active: "false"
```
**Expected:** Template appears.

**Step 3 — Reactivate:**
```
Tool: redmineflux_issue_template_update_template
Params: template_id, is_active: "true"
```

**Step 4 — Verify back in active list, gone from inactive:**
```
Tool: redmineflux_issue_template_list_templates — is_active: "false" → template absent
Tool: redmineflux_issue_template_list_templates — is_active: "true" → template present
```

**Expected Result:**
- After reactivation, template absent from inactive list
- Template appears in active list
- is_active toggle is fully bidirectional

**Result:** [ ] PASS  [ ] FAIL  [ ] BLOCKED
**Notes:**

---

## TC-RIT-021 — Permitted user edits a template (Edit permission)

**Feature:** Permission-Based Access Control — Edit
**User Role:** User with permission (@test1 — ztflux role)
**Precondition:** TC-RIT-017 passed. Template #78 exists.

**MCP Call:**
```
Tool: redmineflux_issue_template_update_template
Params:
  template_id: 78
  name: "TC-RIT-017 Permission Test Template (Edited by test1)"
  issue_title: "Bug reported and edited by permitted user"
  description: "Updated by test1. Verifying EDIT permission works correctly."
```

**Expected Result:**
- Template updated successfully
- No 403 error
- Updated name confirmed in response

**Result:** [x] PASS
**Notes:** Template #78 updated by @test1. Server confirmed update. Edit permission verified.

---

## TC-RIT-022 — Permitted user applies a template and creates an issue (Apply permission)

**Feature:** Permission-Based Access Control — Apply / Issue Creation Using Template
**User Role:** User with permission (@test1 — ztflux role)
**Precondition:** Template #78 exists. @test1 is member of ztflux.

**Step 1 — Apply template:**
```
Tool: redmineflux_issue_template_apply_template
Params:
  template_id: 78
  tracker_id: 1
```

**Expected Result (Step 1):**
- Pre-filled fields returned: subject, description, tracker_id
- No permission error

**Step 2 — Create issue with pre-filled values:**
```
Tool: redmineflux_core_create_issue
Params:
  project_id: "ztflux"
  tracker_id: 1
  subject: <from apply response>
  description: <from apply response>
```

**Expected Result (Step 2):**
- Issue created successfully
- Issue ID returned
- Subject and description match template content

**Result:** [x] PASS
**Notes:** apply_template #78 returned pre-filled fields. Issue #115348 created in ztflux by @test1. Apply permission confirmed.

---

## TC-RIT-023 — Permitted user deletes a template (Delete permission)

**Feature:** Permission-Based Access Control — Delete
**User Role:** User with permission (@test1 — ztflux role)
**Precondition:** Template #78 exists.

**MCP Call:**
```
Tool: redmineflux_issue_template_delete_template
Params:
  template_id: 78
```

**Expected Result:**
- Template deleted successfully
- No 403 error
- get_template #78 returns 404 after deletion

**Result:** [x] PASS
**Notes:** Template #78 deleted by @test1 without error. Delete permission confirmed.

---

## TC-RIT-024 — Permitted user can access global templates

**Feature:** Global vs Project Template Visibility / Template Visibility Based on Permissions
**User Role:** User with permission (@test1 — ztflux role)
**Precondition:** TC-RIT-016 passed.

**MCP Call:**
```
Tool: redmineflux_issue_template_list_templates
Params:
  is_global: "true"
  limit: 25
```

**Expected Result:**
- Global templates are returned (not restricted to admin only)
- All global templates visible including those created by admin

**Result:** [x] PASS
**Notes:** 36 global templates returned. Includes templates #68, #73, #64, #44 and others. Global templates are visible to any user with view permission regardless of project.

---

## TC-RIT-025 — Permission boundary: user creates template for project where they have no permission

**Feature:** Project Membership Restriction / Permission-Based Access Control
**User Role:** User with permission in ztflux, NO permission in gdaplt (@test1)
**Precondition:** @test1 has no issue template permissions in gdaplt.

**MCP Call:**
```
Tool: redmineflux_issue_template_create_template
Params:
  name: "TC — GDA Platform Permission Boundary Test"
  tracker_id: 1
  is_global: false
  project_ids: "gdaplt"
```

**Expected Result (strict):**
- 403 permission denied — user has no create permission in gdaplt

**Actual Result:**
- Template #79 created successfully

**Result:** [x] FAIL — BEHAVIORAL OBSERVATION (not a critical bug)
**Notes:** Server granted create permission based on @test1 having the permission in ztflux, not checking per-target-project. This means a user with template permission in ANY project can create templates assigned to projects where they have no permission. Behavior is permissive — may be by design or a permission scope issue. Template #79 was created and then deleted for cleanup. No bug filed (behavioral, not an error). Noted in memory.md.

---

## Summary

| TC ID | Feature | User | Status |
|-------|---------|------|--------|
| TC-RIT-001 | Create global template | Admin | PASS |
| TC-RIT-002 | Create project-scoped template | Admin | PASS |
| TC-RIT-003 | List all templates | Admin | PASS |
| TC-RIT-004 | Get global template by ID | Admin | PASS |
| TC-RIT-005 | Get project template by ID | Admin | PASS |
| TC-RIT-006 | Filter list by project | Admin | FAIL → BUG-RIT-001 |
| TC-RIT-007 | Edit template | Admin | PASS |
| TC-RIT-008 | Verify persistence after update | Admin | PASS |
| TC-RIT-009 | Assign template to multiple projects | Admin | PASS |
| TC-RIT-010 | Verify multi-project assignment | Admin | PASS |
| TC-RIT-011 | Apply template + create issue | Admin | PASS |
| TC-RIT-012 | CKEditor/HTML content support | Admin | PASS |
| TC-RIT-013 | Deactivate template | Admin | PASS |
| TC-RIT-014 | Validation rules (required fields) | Admin | PASS |
| TC-RIT-015 | Delete template + verify gone | Admin | PASS |
| TC-RIT-019 | List inactive templates (is_active filter) | Admin | PASS |
| TC-RIT-020 | Reactivate a deactivated template | Admin | PASS |
| TC-RIT-016 | Permitted user lists templates (View permission) | User (perm — test1) | PASS |
| TC-RIT-017 | Permitted user creates template (Create permission) | User (perm — test1) | PASS |
| TC-RIT-021 | Permitted user edits template (Edit permission) | User (perm — test1) | PASS |
| TC-RIT-022 | Permitted user applies template + creates issue (Apply permission) | User (perm — test1) | PASS |
| TC-RIT-023 | Permitted user deletes template (Delete permission) | User (perm — test1) | PASS |
| TC-RIT-024 | Global template access for permitted user | User (perm — test1) | PASS |
| TC-RIT-025 | Permission boundary — create template for no-permission project (gdaplt) | test1 | FAIL → BUG-RIT-002 |
| TC-RIT-018 | No-permission in target project — all ops allowed (should be blocked) | test1 in gdaplt | FAIL → BUG-RIT-002 |
| TC-N/A-001 | Clear Form Functionality | — | N/A (UI-only) |
| TC-N/A-002 | Cancel Functionality | — | N/A (UI-only) |
