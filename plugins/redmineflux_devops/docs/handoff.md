# Handoff — Redmineflux DevOps

## Last Session

- Date: 2026-05-28 (Session 23 — Suite 14 execution on Local Docker)
- Redmine Version: 6.0.9 (Local — http://localhost:3008)
- Environment: Local Docker, project phoenix-platform (ID=1)

## Completed This Session

- Executed Suite 14 (End-to-End Business Workflows, TC-RDV-546 to TC-RDV-560, 15 TCs) on Local Docker
- Results: 2 PASS, 7 PARTIAL, 6 BLOCKED, 0 FAIL
- 0 new bugs filed — all issues are pre-existing open bugs
- Updated tc-report.html, defects-summary.html, final-bug-report.md
- Updated docs/changelog.md, docs/memory.md, docs/handoff.md, STATUS.md

## Session 23 Suite 14 Results (Local Docker — 2026-05-28)

| Result | Count | TCs |
|--------|-------|-----|
| PASS | 2 | TC-555, TC-560 |
| PARTIAL | 7 | TC-548, TC-549, TC-551, TC-552, TC-554, TC-557, TC-558 |
| BLOCKED | 6 | TC-546 (no GitHub), TC-547 (no GitHub), TC-550 (no Trivy), TC-553 (BUG-026), TC-556 (no GitHub), TC-559 (no GitHub) |
| FAIL | 0 | — |

## Session 22 Suite 13 Results (Local Docker — 2026-05-28)

| Result | Count | TCs |
|--------|-------|-----|
| PASS | 19 | TC-521, 522, 523, 524, 525, 526, 527, 528, 529, 530, 531, 532, 533, 534, 535, 538, 539, 540, 541 |
| PARTIAL | 3 | TC-536 (Security tab link visible in nav for Developer — BUG-RDV-059), TC-537 (permission matrix renders correct access but nav leaks Security tab — BUG-RDV-059), TC-544 (Manager export 200 ✓; QA export 403 ✗ — BUG-RDV-050/079) |
| FAIL | 1 | TC-545 (BUG-RDV-079: export.md and export.html return 403 for dev_user and qa_user) |
| BLOCKED | 2 | TC-542 (override_security_gate route 404 — feature not implemented), TC-543 (same) |

## Session 21 Suite 12 Results (Local Docker — 2026-05-28)

| Result | Count | TCs |
|--------|-------|-----|
| PASS | 20 | TC-496, 497, 498, 499, 500, 502, 503, 504, 505, 508, 509, 510, 511, 512, 513, 514, 515, 516, 517, 518 |
| PARTIAL | 2 | TC-506 (sonarqube_webhook_token masked but token content unverified), TC-507 (gauge threshold fields present; cross-field warn>critical validation absent) |
| FAIL | 1 | TC-501 (BUG-RDV-078: notification matrix only 7 rows — 7 required types missing) |
| BLOCKED | 2 | TC-519 (rate limit — 5 req/min — cannot hit limit cleanly via Playwright), TC-520 (service degradation — 503 response path not reachable without infra change) |

## Session 20 Suite 11 Results (Local Docker — 2026-05-28)

| Result | Count | TCs |
|--------|-------|-----|
| PASS | 17 | TC-462, 463, 473, 474, 476, 477, 478, 479, 480, 481, 485, 488, 489, 490, 492, 493, 495 |
| PARTIAL | 2 | TC-472 (single-instance freeze created; active-block not verifiable without clock), TC-483 (button hidden; API returns 500 not 403) |
| FAIL | 8 | TC-461, 464, 465, 468, 475, 482, 487, 494 |
| BLOCKED | 8 | TC-466, 467, 469, 470, 471, 484, 486, 491 |

## Session 14 Retest Summary (Forge flux-fujhcd9zj49 — 2026-05-26)

| Result | Count | Bugs |
|--------|-------|------|
| FIXED | 15 | 008,010,014,015,019,023,027,031,037,041,042,043,044,045,046 |
| CONFIRMED open | 6 | 009,011,017,026,029,035 |
| NOT TESTABLE | 1 | 028 |

## Current Open Bugs (40 total — priority order)

| Bug ID | Severity | Title |
|--------|----------|-------|
| BUG-RDV-058 | High | XSS payload in release description not sanitized — script executes on release detail page |
| BUG-RDV-057 | High | SSRF guard not implemented — private and metadata URLs accepted in sonarqube_host_url field |
| BUG-RDV-059 | High | Developer role can access Security Vulnerabilities page — view_security_scans permission not enforced |
| BUG-RDV-065 | High | Developer role can access New Incident form — manage_incidents permission not enforced |
| BUG-RDV-072 | High | Environment add/edit form missing "Type" dropdown — environment_type field not rendered |
| BUG-RDV-073 | High | No "Check Now" button for manual health status trigger — health check feature absent from UI |
| BUG-RDV-074 | High | Admin has no "Override Freeze" option — active deployment freeze blocks Admin unconditionally |
| BUG-RDV-075 | High | Environment Request submission causes 500 error; no custom fields or auto-assignment |
| BUG-RDV-056 | High | FOSSA license ingestion stores all licenses as "NOASSERTION" / "unknown" risk regardless of payload |
| BUG-RDV-009 | High | DORA metrics REST endpoint returns 404 — route not implemented |
| BUG-RDV-011 | High | Webhook event log accessible to users with only view_devops |
| BUG-RDV-017 | High | PR Review Dashboard and Commits page return 200 without view_devops |
| BUG-RDV-026 | High | JUnit ingestion endpoint returns 422 — missing rexml gem |
| BUG-RDV-029 | High | Pipeline stage breakdown not implemented |
| BUG-RDV-035 | High | No issue-deployment linkage on deployment detail or issue pages |
| BUG-RDV-047 | High | Test duration monitoring REST endpoint returns 404 — route not implemented |
| BUG-RDV-048 | High | Test coverage tracking feature not implemented |
| BUG-RDV-050 | High | QA Engineer role can access DORA Metrics page — RBAC not enforced |
| BUG-RDV-052 | High | Auto-created incidents use "Bug" tracker instead of "Incident" tracker |
| BUG-RDV-054 | High | On-call schedule feature not implemented |
| BUG-RDV-055 | High | Infrastructure resource usage gauges not implemented |
| BUG-RDV-060 | High | Incident creation form deviates from INC-001: no standalone Title field |
| BUG-RDV-061 | High | No dedicated "Linked Alerts" section on incident detail page |
| BUG-RDV-062 | High | No "Add Entry" button for manual timeline entries on incident detail page |
| BUG-RDV-063 | High | Incident Timeline REST API returns 404 for all URL patterns |
| BUG-RDV-064 | High | Incidents JSON REST API returns HTTP 406 Not Acceptable |
| BUG-RDV-076 | Medium | Environment comparison endpoint returns HTTP 302 instead of 404 for non-existent/cross-project IDs |
| BUG-RDV-078 | Medium | Notification matrix missing 7 required DevOps event types |
| BUG-RDV-079 | Medium | Export Release Notes (MD/HTML) returns HTTP 403 for roles without manage_releases |
| BUG-RDV-028 | Medium | Artifact download links show no artifacts (NOT TESTABLE — no real CI data) |
| BUG-RDV-049 | Medium | DORA metric cards show "0" instead of "N/A" when no data |
| BUG-RDV-051 | Medium | Dashboard shared flag update returns HTTP 200 instead of 403 |
| BUG-RDV-053 | Medium | Alert feed has no environment filter |
| BUG-RDV-066 | Medium | "Assigned To" column missing from incidents list page |
| BUG-RDV-067 | Medium | Deployment correlation override creates no timeline or audit entry |
| BUG-RDV-068 | Medium | Post-mortem Root Cause section shows placeholder, not pre-filled from incident root_cause field |
| BUG-RDV-069 | Medium | No journal or timeline entry created after sending communication template |
| BUG-RDV-070 | Medium | Blank affected_service accepted on incident creation, defaults to "Unknown Service" |
| BUG-RDV-071 | Low | Incidents empty state shows blank area with no informative message |
| BUG-RDV-077 | Low | REST API type filter for environments not exposed — /devops/environments.json?type= returns 404 |

## Current State

### Local Docker (last active 2026-05-28)
- URL: http://localhost:3008
- Admin login: admin / admin123
- Admin API key: `aa7237bfcded9fad580ad16198c78769731522ca`
- Webhook secret: `s3cr3tKey`
- phoenix-platform project ID: 1 | identifier: phoenix-platform
- Environments: dev (1), staging (2), production (3, LOCKED), uat (4), qa (5), staging-main (9, LOCKED)
- staging-main (env 9): LOCKED, reason "QA is running regression suite", locked_until 2026-05-29 12:00
- production (env 3): LOCKED, reason "Pre-demo freeze: investor presentation…", locked_until 2026-06-01 16:00
- Freeze windows: "Weekly Release Window Freeze" (ID 2, recurring Fri 17:00–23:59 UTC, all environments)
- Issue #40: Environment Request issue — HTTP 500 on detail page (BUG-RDV-075)
- dev_user: ID 5, API key `2309f6ea9f3335476ebc78cf241cc27c8da0e12e` (Developer role, password unknown on Local)
- devops_engineer: ID 13, login devops_engineer, password TestPass123!, API key `6c1407ae276e5f449d0e6bd88b3bd9f93c32a852` (DevOps role)
- non_member user: ID 11, API key `2eb365ddee77713a9fb0fd66d31be0e2cec3e774`
- v2.0.0 Release: ID 1, status=Ready, description="Second major release" (XSS payload cleaned), compliance 3/5

### Forge (flux-fujhcd9zj49) — last tested 2026-05-26
- URL: https://flux-fujhcd9zj49.forge.zehntech.com
- Admin login: admin / 12345678
- Admin API key: `5d310678d004cee56dda8597266cf81d32d80c3e`
- daisy.skye API key: `eabeffbcd64b524ebd1f61f328a0474de071b336` (Developer, ID 6, agileboard member)
- Project: agileboard (ID 7)
- Staging environment ID: 20 (approval_required = true)
- Developer role ID: 7
- Release #42: "2026.6 Atlas" (used for release testing)

## Blockers (Remaining)

- **BUG-RDV-026**: JUnit ingestion broken (rexml missing) — all flaky test detection blocked
- **BUG-RDV-035**: Issue-deployment linking not implemented
- **BUG-RDV-029**: Pipeline stage breakdown not implemented
- **BUG-RDV-009**: DORA metrics route missing
- **BUG-RDV-058**: XSS in release description — CRITICAL security bug (stored XSS, affects all viewers)
- **Suite 05**: No connected git repo for phoenix-platform — blocks all git-tag and hotfix TCs

## Next Session Start Point

**Suite 14 complete (2026-05-28, Local). Next: Suite 15 — tc-15-multilanguage-ui-validation.md**

Start with Local Docker for Suite 15. Read the tc-15 test case file before executing.

If the plugin is updated before Suite 15, priority retest order:
1. **BUG-RDV-079** — verify export.md and export.html return 200 for dev_user (Developer) and qa_user (QA Engineer) who have view_devops; confirm Manager (manage_releases) still works; confirm non_member still gets 403
2. **BUG-RDV-078** — verify notification matrix contains all 10 required event types including deployment_success/failed, incident_created/resolved, release_published, alert_fired, security_gate_blocked
2. **BUG-RDV-075** — verify Environment Request detail page returns HTTP 200; custom_fields populated; auto-assignment works
2. **BUG-RDV-072** — verify "Type" dropdown present on Add/Edit Environment form (dev/staging/prod/custom options)
3. **BUG-RDV-073** — verify "Check Now" button appears on environment rows; AJAX status update without page reload
4. **BUG-RDV-074** — verify Admin deploy modal shows "Override Freeze" option with mandatory reason; audit log entry created
5. **BUG-RDV-076** — verify compare endpoint returns 404 (not 302) for non-existent/cross-project env IDs
6. **BUG-RDV-077** — verify /devops/environments.json?type=production returns filtered results
7. **BUG-RDV-058** — verify XSS in release description is fixed (HTML sanitizer applied)
2. **BUG-RDV-057** — verify SSRF guard blocks private/metadata URLs on sonarqube_host_url
3. **BUG-RDV-059** — verify Developer role gets 403 on /devops_vulnerabilities
4. **BUG-RDV-065** — verify Developer role gets 403 on /devops_incidents/new (manage_incidents enforced)
5. **BUG-RDV-056** — verify LicenseRiskMapper extracts SPDX ID correctly (MIT→Low, GPL→High)
6. **BUG-RDV-052** — verify AlertIncidentCreator uses "Incident" tracker (ID 3), not "Bug" (ID 4)
7. **BUG-RDV-060** — verify Title field added to incident creation form (separate from affected_service)
8. **BUG-RDV-061** — verify "Linked Alerts" section visible on incident detail page
9. **BUG-RDV-062** — verify "Add Entry" button present in incident timeline section
10. **BUG-RDV-063** — verify incident timeline REST endpoint returns JSON (timeline.json route exists)
11. **BUG-RDV-064** — verify /devops_incidents.json returns HTTP 200 with JSON array
12. **BUG-RDV-026** — verify `gem 'rexml'` added to Gemfile (unblocks all 27 Suite 06 JUnit TCs)
13. **BUG-RDV-047** — verify `test_duration_stats.json` route exists
14. **BUG-RDV-048** — verify coverage tracking routes and codecov webhook
15. **BUG-RDV-009** — verify DORA endpoint `/devops/metrics/dora.json` returns data
16. **BUG-RDV-053** — verify environment filter control appears on alert feed page
17. **BUG-RDV-050** — verify QA Engineer role is blocked from `/devops_metrics`
18. **BUG-RDV-051** — verify unauthorized PATCH to shared dashboard returns HTTP 403
19. **BUG-RDV-049** — verify zero-data state shows "N/A" instead of "0 low" / "0 elite"
20. **BUG-RDV-035** — verify "Issues Included" section on deployment detail page
21. **BUG-RDV-029** — verify "Pipeline Stages" section on build detail page
22. **BUG-RDV-011 / BUG-RDV-017** — verify authorization guards added to webhook log, PR dashboard, Commits page controllers
23. **BUG-RDV-066–071** — verify minor/medium incident management UI improvements

Local Docker credentials:
- URL: http://localhost:3008
- Admin login: admin / admin123
- Admin API key: `aa7237bfcded9fad580ad16198c78769731522ca`
- phoenix-platform project ID: 1 | identifier: phoenix-platform
- non_member user (ID 11, API key: 2eb365ddee77713a9fb0fd66d31be0e2cec3e774) — confirmed non-member
- devops_engineer user (ID 13, API key: 6c1407ae276e5f449d0e6bd88b3bd9f93c32a852) — DevOps role

Forge (flux-fujhcd9zj49 — last tested 2026-05-26):
- Admin login: admin / 12345678
- Admin API key: `5d310678d004cee56dda8597266cf81d32d80c3e`
- daisy.skye API key: `eabeffbcd64b524ebd1f61f328a0474de071b336`
