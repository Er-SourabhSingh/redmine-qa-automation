# BUG-RIT-001 — list_templates returns 500 internal server error when project_id filter is applied

| Field | Value |
|-------|-------|
| Bug ID | BUG-RIT-001 |
| Title | list_templates returns 500 internal server error when project_id filter is applied |
| Status | Open |
| Severity | High |
| Redmine Version | Flux (dev-flux.zehntech.com) |
| Test Case | TC-RIT-006 |
| Found By | Admin (Sourabh Singh, ID: 683) |
| Date Found | 2026-06-16 |

---

## Steps to Reproduce

1. Connect to `https://dev-flux.zehntech.com` via Redmineflux MCP server (admin API key)
2. Call `redmineflux_issue_template_list_templates` with a valid project identifier

**MCP Call:**
```
Tool: redmineflux_issue_template_list_templates
Params:
  project_id: "wiftsep"
  limit: 25
```

**Also reproduced with:**
- `project_id: "flxcyb"` → 500
- `project_id: "ztflux"` → 500
- `project_id: "370"` (numeric) → 500

All valid project identifiers and numeric IDs consistently return 500.

---

## Expected Result

- A filtered list of issue templates assigned to the specified project is returned
- HTTP 200 response with matching templates
- Example: calling with `project_id: "wiftsep"` should return template #69 (QA Project Task Template) which is assigned to `wiftsep`

---

## Actual Result

```
Server error (500): Internal Server Error
```

- No templates returned
- No descriptive error message
- Reproducible 100% of the time across all tested project identifiers

---

## Scope of Failure

| Call | Result |
|------|--------|
| `list_templates` (no filter) | ✅ Works — returns all 55 templates |
| `list_templates` with `is_global: "true"` | ✅ Works — filters by scope |
| `list_templates` with `is_active: "true"` | ✅ Works — filters by status |
| `list_templates` with `tracker_id: 3` | ✅ Works — filters by tracker |
| `list_templates` with `project_id: "wiftsep"` | ❌ 500 error |
| `list_templates` with `project_id: "370"` | ❌ 500 error |
| `list_templates` with `project_id: "flxcyb"` | ❌ 500 error |
| `list_templates` with `project_id: "ztflux"` | ❌ 500 error |

The bug is isolated to the **project_id filter code path** on the server side.

---

## Root Cause Analysis

The unfiltered list works correctly, indicating the template listing logic itself is fine. The 500 is triggered only when a `project_id` is passed, pointing to a server-side exception in the project lookup or filter logic — likely an unhandled nil reference or ActiveRecord exception when resolving the project identifier to apply the WHERE clause.

---

## Impact

- **Feature "Project Filter Search" (TC-RIT-006) is completely broken**
- Users and admins cannot retrieve templates scoped to a specific project via MCP
- Affects all projects — not isolated to one project identifier
- The Project Template Visibility test (TC-RIT-014) is partially impacted

---

## Environment

- Server: https://dev-flux.zehntech.com
- MCP Server: `redmineflux` (admin, API key: d8ff92a06082fbf9efc0adfead1616aa1ba7198d)
- User: Sourabh Singh (Admin, ID: 683)
- Date: 2026-06-16

---

## Screenshot

*MCP-only test — no browser screenshot. Error confirmed via direct MCP response across 4 different project identifiers.*
