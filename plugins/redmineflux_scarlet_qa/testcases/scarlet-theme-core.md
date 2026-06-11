# Test Cases — Redmineflux Scarlet Theme — Core Module Coverage

> Redmine version: 6.1.2.stable.24650 | Plugin: redmineflux_scarlet 1.0.0 | Environment: Forge | Tested by: sourabh.singh

---

## Session 1 — 2026-06-04

### Suite: Login & Navigation

| TC ID | Title | Result | Bug Ref |
|-------|-------|--------|---------|
| TC-RSC-001 | Login page renders with scarlet theme | PASS | — |
| TC-RSC-002 | My Page loads with scarlet theme — blocks, add dropdown | PASS | BUG-RSC-001 (console) |

### Suite: Projects

| TC ID | Title | Result | Bug Ref |
|-------|-------|--------|---------|
| TC-RSC-003 | Projects list renders correctly | PASS | — |
| TC-RSC-004 | New Project form renders | PASS | BUG-RSC-002 (console) |

### Suite: Issues

| TC ID | Title | Result | Bug Ref |
|-------|-------|--------|---------|
| TC-RSC-005 | Issues list renders — priority icons visible | FAIL | BUG-RSC-003 |
| TC-RSC-006 | New Issue form renders — all fields and RTE | PASS | BUG-RSC-002 (console) |
| TC-RSC-011 | Issue detail page — attributes, tabs, watchers | PASS | BUG-RSC-002 (console) |

### Suite: Administration

| TC ID | Title | Result | Bug Ref |
|-------|-------|--------|---------|
| TC-RSC-007 | Administration panel renders | PASS | — |
| TC-RSC-008 | Settings — General tab renders | PASS | — |

### Suite: Calendar, Roadmap, My Account, Search

| TC ID | Title | Result | Bug Ref |
|-------|-------|--------|---------|
| TC-RSC-009 | Core Gantt on ztflux project | INFO | Module disabled on ztflux |
| TC-RSC-010 | Calendar renders — month grid, navigation | PASS | — |
| TC-RSC-012 | My Account page renders | PASS | — |
| TC-RSC-013 | Roadmap renders — versions, progress bars | PASS | — |
| TC-RSC-014 | Search results page renders | PASS | — |

---

## Session 2 — 2026-06-04

### Suite: Time Tracking

| TC ID | Title | Result | Bug Ref |
|-------|-------|--------|---------|
| TC-RSC-015 | Time Entries list renders — filters, table, pagination | PASS | — |
| TC-RSC-016 | New Time Entry form renders | PASS | — |

### Suite: Files, Wiki, Forums, News, Documents

| TC ID | Title | Result | Bug Ref |
|-------|-------|--------|---------|
| TC-RSC-017 | Files module renders | PASS | — |
| TC-RSC-018 | Wiki module renders (empty state) | PASS | BUG-RSC-004 (warning) |
| TC-RSC-019 | Wiki edit page renders — toolbar, textarea, preview | PASS | BUG-RSC-004 (warning) |
| TC-RSC-020 | Forums list renders | PASS | — |
| TC-RSC-021 | News list renders | PASS | — |
| TC-RSC-022 | Documents module renders | PASS | — |

### Suite: Gantt (Core — module enabled)

| TC ID | Title | Result | Bug Ref |
|-------|-------|--------|---------|
| TC-RSC-023 | Core Gantt renders with scarlet theme | PASS | — |

### Suite: Administration — Users, Roles, Config

| TC ID | Title | Result | Bug Ref |
|-------|-------|--------|---------|
| TC-RSC-024 | Admin Users list renders | PASS | — |
| TC-RSC-025 | Admin New User form renders | PASS | — |
| TC-RSC-026 | Admin Roles list renders | PASS | — |
| TC-RSC-027 | Admin Custom Fields renders | PASS | — |
| TC-RSC-028 | Admin Workflows renders | PASS | — |
| TC-RSC-029 | Admin Enumerations renders | PASS | — |
| TC-RSC-035 | Admin Trackers renders | PASS | — |
| TC-RSC-036 | Admin Issue Statuses renders | PASS | — |
| TC-RSC-037 | Admin Groups renders | PASS | — |

### Suite: Settings Tabs

| TC ID | Title | Result | Bug Ref |
|-------|-------|--------|---------|
| TC-RSC-030 | Settings — Display tab (theme confirmed active) | PASS | — |
| TC-RSC-031 | Settings — Authentication tab renders | PASS | — |
| TC-RSC-032 | Settings — API tab renders | PASS | — |
| TC-RSC-033 | Settings — Issues tab renders | PASS | — |
| TC-RSC-034 | Settings — Notifications tab renders | PASS | — |

### Suite: Issue Bulk Edit

| TC ID | Title | Result | Bug Ref |
|-------|-------|--------|---------|
| TC-RSC-038 | Bulk Edit — context menu appears with all actions on multi-select | PASS | — |
| TC-RSC-039 | Bulk Edit form renders — all fields visible | PASS | — |
