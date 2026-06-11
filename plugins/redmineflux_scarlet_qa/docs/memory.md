# Plugin Memory — Redmineflux Scarlet Theme

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

- Core Gantt on `ztflux` returns 403 — the Gantt module is disabled on that project. Not a theme bug. Core Gantt works fine when the module is enabled (confirmed on `easosrt`).
- `ztflux` project has these modules **disabled**: News, Documents, Wiki, Forums, Gantt. Use `easosrt` for testing those modules.
- `easosrt` (identifier) = "Scarlet Theme QA Test" project — created 2026-06-04 with all modules enabled for theme testing.
- New Project form requires custom fields "Start Date" and "Delivery Date" — both mandatory. Must fill before submitting.
- `activity.css` is referenced on every page but missing from assets — BUG-RSC-001
- `lastJstPreviewed` JS variable conflict on all pages with JsToolbar RTE — BUG-RSC-002
- Priority SVG icons missing from `/plugin_assets/redmineflux_scarlet/images/` — BUG-RSC-003
- Tribute (@-mention) bound twice to textarea on RTE pages — BUG-RSC-004

## Confirmed Working

- Login page: custom scarlet theme, logo, form layout, branded header ✓
- My Page: issue blocks, add/remove block dropdown ✓
- Projects list ✓
- New Project form (after filling required date custom fields) ✓
- Issues list (layout, filters, pagination — priority icons broken) ✓
- New Issue form (all fields, RTE) ✓
- Issue detail (attributes, notes, history, tabs) ✓
- Bulk edit: right-click context menu shows all actions (Edit, Status, Priority, Assignee, etc.) ✓
- Bulk edit form ✓
- Administration panel ✓
- Settings — all tabs (General, Display, Auth, API, Issues, Notifications) ✓
- Trackers, Issue Statuses, Custom Fields, Workflows, Enumerations, Roles, Groups ✓
- Calendar ✓
- Roadmap ✓
- Core Gantt (when module enabled) ✓
- My Account ✓
- Search results ✓
- Time Entries list ✓
- New Time Entry form ✓
- Files module ✓
- Wiki (empty state, edit page with toolbar) ✓
- Forums list ✓
- News list ✓
- Documents module ✓
- Admin Users list, New User form ✓

## Recurring Issues

- `activity.css` 404 — appears on every single page load
- `lastJstPreviewed` JS error — appears on every page with JsToolbar RTE
- `Tribute was already bound` warning — appears on every page with textarea

## Environment Notes

- Redmine: 6.1.2.stable.24650
- redmineflux_scarlet: 1.0.0
- Forge URL: https://dev-flux.zehntech.com/
- Test user: sourabh.singh (Administrator)
- Test project: easosrt (all modules enabled)
