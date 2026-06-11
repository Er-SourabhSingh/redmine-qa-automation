# Handoff — Redmineflux Scarlet Theme

## Last Session

- Date: 2026-06-04 (Sessions 1 & 2 — same day)
- Redmine Version: 6.1.2.stable.24650
- Plugin Version: redmineflux_scarlet 1.0.0
- Environment: Forge — https://dev-flux.zehntech.com/
- Browser: Chrome
- Test project created: `easosrt` (Scarlet Theme QA Test) — all modules enabled

## Completed This Session

**Session 1 (14 TCs):** Login, My Page, Projects list, New Project, Issues list, New Issue, Issue Detail, Admin panel, Settings General, Calendar, Roadmap, My Account, Search, Gantt (INFO — module disabled on ztflux)

**Session 2 (25 TCs):** Time Entries list, New Time Entry, Files, Wiki, Wiki edit, Forums, News, Documents, Core Gantt (PASS on easosrt), Admin Users list, New User form, Roles, Custom Fields, Workflows, Enumerations, Trackers, Issue Statuses, Groups, Settings Display/Auth/API/Issues/Notifications, Bulk Edit context menu, Bulk Edit form

**Total: 39 TCs — 37 PASS, 1 FAIL (TC-RSC-005), 1 INFO (TC-RSC-009)**

**4 bugs filed:** BUG-RSC-001, BUG-RSC-002, BUG-RSC-003, BUG-RSC-004

## In Progress

Nothing — all planned modules covered.

## Blockers

None.

## Next Session Start Point

All core modules covered. Remaining optional scope:
- Issue relations tab (add/remove related issue)
- Issue watchers tab (add/remove watcher)
- Issue attachments (upload file on new issue)
- Saved queries (save, edit, delete public/private)
- Wiki history and compare versions
- Forum new topic, reply, quote, delete
- News comment add/delete
- Document upload attachment
- Project archive / unarchive / delete flow (using test project `easosrt`)
- Admin → create/edit/delete tracker, role, custom field, group (CRUD flows, not just list views)

If next session required: start with **Issue attachments** → then **Saved queries** → then **Wiki CRUD**.

## Open Bugs Found

| Bug ID | Title | Severity |
|--------|-------|----------|
| BUG-RSC-001 | Theme asset activity.css returns 404 on every page | Medium |
| BUG-RSC-002 | JavaScript error — 'lastJstPreviewed' already declared on RTE pages | Medium |
| BUG-RSC-003 | Priority SVG icons missing (404) on issues list | **High** |
| BUG-RSC-004 | Tribute mention library bound twice to textarea | Low |
