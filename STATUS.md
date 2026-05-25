# QA Status Dashboard

| Plugin | Last Tested | Redmine Version | Open Bugs | Status |
|--------|-------------|-----------------|-----------|--------|
| testcase-management-plugin | 2026-05-20 | 6.2.0 | 1 | In Progress |
| redmineflux_advanced_field | 2026-05-21 | 6.0.9.stable | 0 | In Progress (51/51 positive TCs PASS, 2 bugs fixed & closed; workflow TCs TC-RAF-051–054 pending) |
| redmineflux_devops | 2026-05-25 | 6.0.9 (Local) | 37 | In Progress (Suites 01–04 complete — 210 TCs: 90 Pass, 61 Fail, 4 Skip, 55 Blocked. 37 open bugs: 1 Critical IDOR, 20 High, 12 Medium, 4 Low. Key blockers: BUG-RDV-007/022 commit storage failure, BUG-RDV-008 IDOR, BUG-RDV-026 rexml/JUnit broken, BUG-RDV-033 ArgoCD missing, BUG-RDV-035 issue-deployment linking absent. Next: Suite 05+ OR Forge re-run OR bug fix verification starting with BUG-RDV-026/033/035/037.) |

## How to update

Update this file after every test run. One row per plugin.

**Status values:** `Not Started` / `In Progress` / `Complete`
