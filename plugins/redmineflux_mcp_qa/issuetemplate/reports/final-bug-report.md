# Final Bug Report — Redmineflux MCP Issue Template

> Generated from bugs/open/. PDF only on explicit user request.

## Summary

| Total | Critical | High | Medium | Low | Open | Closed |
|-------|----------|------|--------|-----|------|--------|
| 2 | 0 | 2 | 0 | 0 | 2 | 0 |

## Open Bugs

### BUG-RIT-001 — list_templates returns 500 internal server error when project_id filter is applied

- **Severity:** High
- **Status:** Open
- **Found In TC:** TC-RIT-006, TC-RIT-018
- **Feature:** Project Filter Search
- **Description:** `list_templates` returns 500 for any `project_id` value (identifier or numeric). All other filters (is_global, is_active, tracker_id) work correctly. Blocks project-scoped visibility testing for all users. Reproduced as admin and as test1 user.
- **File:** [bugs/open/BUG-RIT-001.md](../bugs/open/BUG-RIT-001.md)

### BUG-RIT-002 — Issue template operations bypass project-level permission check

- **Severity:** High
- **Status:** Open
- **Found In TC:** TC-RIT-018, TC-RIT-025
- **Feature:** Permission-Based Access Control / Project Membership Restriction
- **Description:** All MCP issue template operations (Create, Edit, Delete, Apply) succeed for a user with **zero** issue template permissions in the target project. The server grants access based on whether the user has permission in **any** project, not the specific project being operated on. Test1 (@Aurora Grace) has all template permissions in ztflux but none in gdaplt — yet can create/edit/delete/apply templates scoped to gdaplt via the ztflux role. All 5 template MCP tools are affected.
- **Impact:** Complete bypass of project-level permission enforcement. Any user with template access in one project can manage templates for ALL projects they are a member of, regardless of their role in those projects.
- **File:** [bugs/open/BUG-RIT-002.md](../bugs/open/BUG-RIT-002.md)

## Environment

- Redmine Version: Flux (dev-flux.zehntech.com)
- Environment: Forge
- Test Date: 2026-06-16
- Sessions: 1+2
