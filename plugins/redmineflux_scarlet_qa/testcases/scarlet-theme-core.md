# Test Cases — Redmineflux Scarlet Theme — Core Module Coverage

> Redmine version: 6.1.2.stable.24650 | Plugin: redmineflux_scarlet 1.0.0 | Environment: Forge | Tested by: sourabh.singh

---

## Session 1 — 2026-06-04

### Suite: Login & Navigation

| TC ID | Title | Priority | Result | Bug Ref |
|-------|-------|--------|---------|----------|
| TC-RSC-001 | Login page renders with scarlet theme | High | PASS | — |
| TC-RSC-002 | My Page loads with scarlet theme — blocks, add dropdown | High | PASS | BUG-RSC-001 (console) |

### Suite: Projects

| TC ID | Title | Priority | Result | Bug Ref |
|-------|-------|--------|---------|----------|
| TC-RSC-003 | Projects list renders correctly | High | PASS | — |
| TC-RSC-004 | New Project form renders | Medium | PASS | BUG-RSC-002 (console) |

### Suite: Issues

| TC ID | Title | Priority | Result | Bug Ref |
|-------|-------|--------|---------|----------|
| TC-RSC-005 | Issues list renders — priority icons visible | High | FAIL | BUG-RSC-003 |
| TC-RSC-006 | New Issue form renders — all fields and RTE | High | PASS | BUG-RSC-002 (console) |
| TC-RSC-007 | Issue detail page — attributes, tabs, watchers | High | PASS | BUG-RSC-002 (console) |

### Suite: Administration

| TC ID | Title | Priority | Result | Bug Ref |
|-------|-------|--------|---------|----------|
| TC-RSC-008 | Administration panel renders | High | PASS | — |
| TC-RSC-009 | Settings — General tab renders | Medium | PASS | — |

### Suite: Calendar, Roadmap, My Account, Search

| TC ID | Title | Priority | Result | Bug Ref |
|-------|-------|--------|---------|----------|
| TC-RSC-010 | Core Gantt on ztflux project | Low | INFO | Module disabled on ztflux |
| TC-RSC-011 | Calendar renders — month grid, navigation | Medium | PASS | — |
| TC-RSC-012 | My Account page renders | Medium | PASS | — |
| TC-RSC-013 | Roadmap renders — versions, progress bars | Medium | PASS | — |
| TC-RSC-014 | Search results page renders | Medium | PASS | — |

---

## Session 2 — 2026-06-04

### Suite: Time Tracking

| TC ID | Title | Priority | Result | Bug Ref |
|-------|-------|--------|---------|----------|
| TC-RSC-015 | Time Entries list renders — filters, table, pagination | Medium | PASS | — |
| TC-RSC-016 | New Time Entry form renders | Medium | PASS | — |

### Suite: Files, Wiki, Forums, News, Documents

| TC ID | Title | Priority | Result | Bug Ref |
|-------|-------|--------|---------|----------|
| TC-RSC-017 | Files module renders | Medium | PASS | — |
| TC-RSC-018 | Wiki module renders (empty state) | Low | PASS | BUG-RSC-004 (warning) |
| TC-RSC-019 | Wiki edit page renders — toolbar, textarea, preview | Medium | PASS | BUG-RSC-004 (warning) |
| TC-RSC-020 | Forums list renders | Low | PASS | — |
| TC-RSC-021 | News list renders | Low | PASS | — |
| TC-RSC-022 | Documents module renders | Low | PASS | — |

### Suite: Gantt (Core — module enabled)

| TC ID | Title | Priority | Result | Bug Ref |
|-------|-------|--------|---------|----------|
| TC-RSC-023 | Core Gantt renders with scarlet theme | Medium | PASS | — |

### Suite: Administration — Users, Roles, Config

| TC ID | Title | Priority | Result | Bug Ref |
|-------|-------|--------|---------|----------|
| TC-RSC-024 | Admin Users list renders | Medium | PASS | — |
| TC-RSC-025 | Admin New User form renders | Medium | PASS | — |
| TC-RSC-026 | Admin Roles list renders | Medium | PASS | — |
| TC-RSC-027 | Admin Custom Fields renders | Low | PASS | — |
| TC-RSC-028 | Admin Workflows renders | Medium | PASS | — |
| TC-RSC-029 | Admin Enumerations renders | Low | PASS | — |
| TC-RSC-030 | Admin Trackers renders | Low | PASS | — |
| TC-RSC-031 | Admin Issue Statuses renders | Low | PASS | — |
| TC-RSC-032 | Admin Groups renders | Low | PASS | — |

### Suite: Settings Tabs

| TC ID | Title | Priority | Result | Bug Ref |
|-------|-------|--------|---------|----------|
| TC-RSC-033 | Settings — Display tab (theme confirmed active) | High | PASS | — |
| TC-RSC-034 | Settings — Authentication tab renders | Low | PASS | — |
| TC-RSC-035 | Settings — API tab renders | Low | PASS | — |
| TC-RSC-036 | Settings — Issues tab renders | Low | PASS | — |
| TC-RSC-037 | Settings — Notifications tab renders | Low | PASS | — |

### Suite: Issue Bulk Edit

| TC ID | Title | Priority | Result | Bug Ref |
|-------|-------|--------|---------|----------|
| TC-RSC-038 | Bulk Edit — context menu appears with all actions on multi-select | Medium | PASS | — |
| TC-RSC-039 | Bulk Edit form renders — all fields visible | Medium | PASS | — |
