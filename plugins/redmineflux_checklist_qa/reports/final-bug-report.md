# Final Bug Report — Redmineflux Checklist

> Generated from bugs/open/. PDF only on explicit user request.

## Summary

| Total | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|
| 3 | 1 | 1 | 1 | 0 |

## Open Bugs

### BUG-CHK-002 — Checklist/sub-item title containing a `<script>` tag executes on creation

- Severity: Critical
- Production Redmine Issue ID: not yet reported
- Found during the regression pass for #120920 (TC-CHK-031), not caused by that feature's own changes.
- Client-side self-XSS in `checklist.js`'s creation AJAX handlers (unescaped raw HTML interpolation); not a
  stored XSS for other viewers (server-rendered page loads are safely escaped).
- Full detail: `bugs/open/BUG-CHK-002.md`

### BUG-CHK-004 — Toggling a sub-checklist item's checkbox writes duplicate Checklist History journal entries

- Severity: Medium
- Production Redmine Issue ID: not yet reported
- Found during `CHECKLIST_PROGRESS_TRACKING.md` TC-CHK-091 (rapid toggling).
- Root cause identified in `checklist_checkbox-0fb4baca.js`: a single click on a sub-item's checkbox fires two
  separate AJAX PATCH requests to two different endpoints (`toggle_completed` and `update_state`) for the same
  state change, each independently writing a journal entry — confirmed via the Network tab on a single click,
  not only under rapid clicking (which compounds it further).
- The checklist's own functional state (checkbox, completion %) is unaffected — this is an audit-trail /
  data-integrity defect in the Checklist History log, not data loss.
- Full detail: `bugs/open/BUG-CHK-004.md`

### BUG-CHK-005 — Checklist CRUD is not blocked on a closed/read-only project

- Severity: High
- Production Redmine Issue ID: not yet reported
- Found live while investigating a user-reported console 403 on "Add from template" for a closed project.
- Confirmed with network evidence on the same closed project/issue: `POST /checklists` → 201, `PATCH
  /checklists/:id/toggle_completed` → 200, `DELETE /checklists_delete/:id.json` → 200 — all succeed. Only `GET
  /checklists/new_from_template` is blocked (403), and even that gives no user-facing feedback (console-only).
- The plugin does not apply a uniform "project closed = read-only" guard across its controllers, unlike Redmine
  core. Should follow core's approach and block all checklist-mutating actions consistently on a closed project.
- Full detail: `bugs/open/BUG-CHK-005.md`

## Environment

- Redmine Version: 7.0.0 (Docker, localhost:3010)
- Environment: Local Docker (redmine-docker-700-redmine-1)
- Test Date: 2026-09-22
