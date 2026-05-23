# Handoff — Redmineflux DevOps

## Last Session

- Date: 2026-05-23 (Session 6 — Full local re-run TC-RDV-001 to TC-RDV-040)
- Redmine Version: 6.0.9 (Local Docker — http://localhost:3008)
- Environment: Local — container xenodochial_heisenberg

## Completed This Session

- Executed TC-RDV-027 to TC-RDV-040 (completing the full 40-TC suite on local)
- Filed BUG-RDV-012 (Medium — commits REST API ignores limit parameter)
- Filed BUG-RDV-013 (High — 5/10 REST API endpoints return 406)
- Updated _index.md with BUG-RDV-012, BUG-RDV-013; marked BUG-RDV-011 as Local+Forge
- Generated tc-report.html, defects-summary.html, final-bug-report.md

## TC-RDV-027 to TC-RDV-040 Results (Session 6 — Local)

| TC | Title | Result |
|----|-------|--------|
| TC-RDV-027 | User can configure DevOps notification preferences | PASS (deviations: no Slack/Teams; flash="Account was successfully updated.") |
| TC-RDV-028 | Notification preferences are user-self-service only | PASS (/users/:id/devops_notifications → 404) |
| TC-RDV-029 | Lazy default — no record until user saves | PASS (0 rows before and after page visit without save) |
| TC-RDV-030 | User receives email notification on build fail | SKIP (no SMTP in local Docker) |
| TC-RDV-031 | Admin can access and save plugin settings | PASS (settings save and persist; actual fields differ from spec) |
| TC-RDV-032 | Non-admin cannot access plugin settings | PASS (HTTP 403 for dev_user) |
| TC-RDV-033 | SettingsValidator rejects invalid values | PASS (−1 → validation error; non-numeric → HTTP 422) |
| TC-RDV-034 | DevOps tab visible for members, hidden for non-members | PASS (admin: tab visible; non_member: 403 on private project) |
| TC-RDV-035 | Plugin menu entry in top-level navigation | PASS (DevOps tab present, links to devops_builds) |
| TC-RDV-036 | Webhook rejects non-POST methods | PASS (GET/PUT/PATCH/DELETE → 404) |
| TC-RDV-037 | Rate limit on trigger-build (5/hour) | BLOCKED (GitHub API 404 prevents builds; counter never increments) |
| TC-RDV-038 | Activity stream respects view_devops permission | PASS (no DevOps events for reporter_user; consistent with BUG-RDV-010) |
| TC-RDV-039 | Admin sees audit log; Developer blocked | PASS (admin: audit log loads; dev_user: 403) |
| TC-RDV-040 | Webhook log requires manage_devops_settings | FAIL (dev_user sees log — BUG-RDV-011 confirmed on local) |

Session 6 totals: 11 Pass | 1 Fail | 1 Skip | 1 Blocked

## Combined Totals (Local — Session 6, all 40 TCs)

- TC-RDV-001–040: 40 TCs | 26 Pass | 10 Fail | 1 Skip | 3 Blocked | 13 Open Bugs

## Current State (Local Docker)

- Container: xenodochial_heisenberg (http://localhost:3008)
- Repository connections: GitHub ID 4 (connected), GitLab ID 5 (pending)
- phoenix-platform project ID: 7
- Admin API key: a0d031712f66a866cf9a5251232dc75abd27cbe2
- dev_user API key: 1fcebf93baf850a94cec9f501d29bb5b396b7aed
- All user passwords reset to Admin1234! (dev_user, qa_user, reporter_user, non_member, devops_engineer, new_test_user)
- Plugin settings rate_limit_per_minute set to 15 (changed during TC-RDV-031)
- 13 open bugs: BUG-RDV-001 to BUG-RDV-013

## Blockers

- BUG-RDV-007: webhook background job fails — commits not persisted; affects TC-RDV-001/015/021/025 data assertions
- BUG-RDV-008 (Critical IDOR): REST API has no project-scoped authorization
- TC-RDV-030: email delivery requires SMTP configuration
- TC-RDV-037: rate limit untestable without live CI workflow (GitHub Actions 404 for all trigger attempts)

## Next Session Start Point

**Start execution at TC-RDV-041** (Suite 02 — SCM Integration)

1. Read session start checklist (CLAUDE.md §11)
2. Read this handoff.md before doing anything else
3. Confirm target environment (Local or Forge) and update QA_CREDENTIALS accordingly
4. Begin at TC-RDV-041 — SCM Integration suite

## Open Bugs

| Bug ID | Severity | Title |
|--------|----------|-------|
| BUG-RDV-008 | Critical | REST API returns DevOps data from all projects regardless of user's project membership (IDOR) |
| BUG-RDV-002 | High | Webhook endpoint accepts payloads over 2 MB — no size limit enforced |
| BUG-RDV-003 | High | SonarQube webhook token not configurable via Admin plugin settings UI |
| BUG-RDV-004 | High | FOSSA provider cannot be added as repository connection |
| BUG-RDV-007 | High | Webhook background job fails with ActiveRecord::RecordInvalid after returning 202 |
| BUG-RDV-009 | High | DORA metrics REST endpoint returns 404 — route not implemented |
| BUG-RDV-010 | High | DevOps activity events do not appear in Redmine activity stream — ActivityProvider not registered |
| BUG-RDV-011 | High | Webhook event log accessible to users with only view_devops — manage_devops_settings not enforced |
| BUG-RDV-013 | High | Five of ten documented REST API endpoints return HTTP 406 — JSON format not supported |
| BUG-RDV-006 | Medium | Three undocumented DevOps permissions present in Roles administration panel |
| BUG-RDV-012 | Medium | Commits REST API ignores the limit parameter — all records returned on page 1 |
| BUG-RDV-001 | Low | Webhook signature rejection returns 401 instead of 403 |
| BUG-RDV-005 | Low | Webhook endpoint returns HTTP 400 instead of HTTP 404 for unknown provider |
