# Bug Index — Redmineflux DevOps

| Bug ID | Title | Status | Severity | Redmine Version | File Path |
|--------|-------|--------|----------|-----------------|-----------|
| BUG-RDV-001 | Webhook signature rejection returns 401 instead of 403 | **Closed** | Low | 6.0.9 (Forge) | bugs/closed/BUG-RDV-001.md |
| BUG-RDV-002 | Webhook endpoint accepts payloads over 2 MB — no size limit enforced | **Closed** | High | 6.0.9 (Forge) | bugs/closed/BUG-RDV-002.md |
| BUG-RDV-003 | SonarQube webhook token not configurable via Admin plugin settings UI | **Closed** | High | 6.0.9 (Forge) | bugs/closed/BUG-RDV-003.md |
| BUG-RDV-004 | FOSSA provider cannot be added as repository connection — missing from Add Repository form | **Closed** | High | 6.0.9 (Forge) | bugs/closed/BUG-RDV-004.md |
| BUG-RDV-005 | Webhook endpoint returns HTTP 400 instead of HTTP 404 for unknown provider | **Closed** | Low | 6.0.9 (Forge) | bugs/closed/BUG-RDV-005.md |
| BUG-RDV-006 | Three undocumented DevOps permissions present in Roles administration panel | **Closed (Invalid)** | Medium | 6.0.9 (Forge) | bugs/closed/BUG-RDV-006.md |
| BUG-RDV-007 | Webhook background job fails with ActiveRecord::RecordInvalid after returning 202 | **Closed** | Medium | 6.0.9 (Forge) | bugs/closed/BUG-RDV-007.md |
| BUG-RDV-008 | REST API returns DevOps data from all projects regardless of user's project membership (IDOR) | **Closed** | Critical | 6.0.9 (Forge) | bugs/closed/BUG-RDV-008.md |
| BUG-RDV-009 | DORA metrics REST endpoint returns 404 — route not implemented | Open | High | 6.0.9 (Forge) | bugs/QA/BUG-RDV-009.md |
| BUG-RDV-010 | DevOps activity events do not appear in Redmine activity stream — ActivityProvider not registered | **Closed** | High | 6.0.9 (Forge) | bugs/closed/BUG-RDV-010.md |
| BUG-RDV-011 | Webhook event log accessible to users with only view_devops — manage_devops_settings not enforced | Open | High | 6.0.9 (Local + Forge) | bugs/QA/BUG-RDV-011.md |
| BUG-RDV-012 | Commits REST API ignores the limit parameter — all records returned on page 1 | **Closed** | Medium | 6.0.9 (Local) | bugs/closed/BUG-RDV-012.md |
| BUG-RDV-013 | Five of ten documented REST API endpoints return HTTP 406 — JSON format not supported | **Closed** | High | 6.0.9 (Local) | bugs/closed/BUG-RDV-013.md |
| BUG-RDV-014 | PR reviewer names and approval status not displayed on PR card | **Closed** | High | 6.0.9 (Local) | bugs/closed/BUG-RDV-014.md |
| BUG-RDV-015 | Auto-transition journal text format wrong and attributed to real user instead of system actor | **Closed** | Medium | 6.0.9 (Local) | bugs/closed/BUG-RDV-015.md |
| BUG-RDV-016 | PR Review Dashboard shows all statuses (not just open) and sorts by updated date instead of age | **Closed** | High | 6.0.9 (Local) | bugs/closed/BUG-RDV-016.md |
| BUG-RDV-017 | PR Review Dashboard and Commits page return HTTP 200 to users without view_devops permission | Open | High | 6.0.9 (Local) | bugs/QA/BUG-RDV-017.md |
| BUG-RDV-018 | Commit statistics route returns 404 — daily/weekly aggregation and top contributors not implemented | **Closed** | High | 6.0.9 (Local) | bugs/closed/BUG-RDV-018.md |
| BUG-RDV-019 | PR linked to multiple issues via "refs #N" only updates first referenced issue | **Closed** | High | 6.0.9 (Local) | bugs/closed/BUG-RDV-019.md |
| BUG-RDV-020 | GitLab commit SHA links use /commit/ instead of /-/commit/ URL pattern | **Closed** | Low | 6.0.9 (Local) | bugs/closed/BUG-RDV-020.md |
| BUG-RDV-021 | Auto-transition rules UI missing per-rule configuration (Add Rule, Source Status, Trigger type) | **Closed** | Medium | 6.0.9 (Local) | bugs/closed/BUG-RDV-021.md |
| BUG-RDV-022 | Multi-commit push webhook stores no commits — background job silently fails | **Closed** | High | 6.0.9 (Local) | bugs/closed/BUG-RDV-022.md |
| BUG-RDV-023 | Build badge JS polling uses project identifier string in API call — returns 403, badge never auto-updates | **Closed** | High | 6.0.9 (Local) | bugs/closed/BUG-RDV-023.md |
| BUG-RDV-024 | Build history date filter has no custom date range — only preset period dropdown | **Closed** | Medium | 6.0.9 (Local) | bugs/closed/BUG-RDV-024.md |
| BUG-RDV-026 | JUnit ingestion endpoint returns 422 — missing rexml XML parser gem dependency | Open | High | 6.0.9 (Local) | bugs/QA/BUG-RDV-026.md |
| BUG-RDV-027 | Build queue status widget missing — dashboards page shows placeholder only | **Closed** | High | 6.0.9 (Local) | bugs/closed/BUG-RDV-027.md |
| BUG-RDV-028 | Artifact download links section shows no artifacts for completed builds | Open | Medium | 6.0.9 (Local) | bugs/QA/BUG-RDV-028.md |
| BUG-RDV-029 | Pipeline stage breakdown not implemented — no stages section on build detail page | Open | High | 6.0.9 (Local) | bugs/QA/BUG-RDV-029.md |
| BUG-RDV-030 | Slack and Microsoft Teams notification channels absent from DevOps notification preferences | **Closed** | Medium | 6.0.9 (Local) | bugs/closed/BUG-RDV-030.md |
| BUG-RDV-031 | Build run duration not stored or displayed — webhook run_duration_ms field silently ignored | **Closed** | Medium | 6.0.9 (Local) | bugs/closed/BUG-RDV-031.md |
| BUG-RDV-032 | Deploy button not disabled when environment is locked or frozen | **Closed** | Medium | 6.0.9 (Local) | bugs/closed/BUG-RDV-032.md |
| BUG-RDV-033 | ArgoCD provider not supported — canary/progressive rollout TCs entirely blocked | **Closed** | High | 6.0.9 (Local) | bugs/closed/BUG-RDV-033.md |
| BUG-RDV-034 | Deployment detail missing commit SHA hyperlink and deployment URL field | **Closed** | Medium | 6.0.9 (Local) | bugs/closed/BUG-RDV-034.md |
| BUG-RDV-035 | No issue-deployment linkage on deployment detail or issue pages | Open | High | 6.0.9 (Local) | bugs/QA/BUG-RDV-035.md |
| BUG-RDV-036 | Original deployment detail shows no "Reverted by" link after rollback | **Closed** | Medium | 6.0.9 (Local) | bugs/closed/BUG-RDV-036.md |
| BUG-RDV-037 | Multiple concurrent pending_approval deployments accepted for same environment | **Closed** | High | 6.0.9 (Local) | bugs/closed/BUG-RDV-037.md |
| BUG-RDV-038 | Environment cards not ordered by type (dev→staging→production) | **Closed** | Low | 6.0.9 (Local) | bugs/closed/BUG-RDV-038.md |
| BUG-RDV-039 | Release creation form missing Redmine version/milestone dropdown | **Closed** | Medium | 6.0.9 (Local) | bugs/closed/BUG-RDV-039.md |
| BUG-RDV-040 | Release HTML export does not convert markdown to HTML and omits linked issue URLs | **Closed** | High | 6.0.9 (Local) | bugs/closed/BUG-RDV-040.md |
| BUG-RDV-041 | approve_releases permission not enforced — Approve button absent for QA Engineer role | **Closed** | High | 6.0.9 (Local) | bugs/closed/BUG-RDV-041.md |
| BUG-RDV-042 | Deployments list has no per-environment current-version summary row | **Closed** | Medium | 6.0.9 (Local) | bugs/closed/BUG-RDV-042.md |
| BUG-RDV-043 | Deployments history list has no date range filter | **Closed** | Medium | 6.0.9 (Local) | bugs/closed/BUG-RDV-043.md |
| BUG-RDV-044 | Environment card relative timestamp duplicates the word "days" | **Closed** | Low | 6.0.9 (Local) | bugs/closed/BUG-RDV-044.md |
| BUG-RDV-045 | Release notes editor uses Quill.js instead of CKEditor as specified | **Closed** | Medium | 6.0.9 (Local) | bugs/closed/BUG-RDV-045.md |
| BUG-RDV-046 | New Release form not pre-populated with SemverSuggester output | **Closed** | Medium | 6.0.9 (Local) | bugs/closed/BUG-RDV-046.md |

| BUG-RDV-047 | Test duration monitoring REST endpoint returns 404 — route not implemented | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-047.md |
| BUG-RDV-048 | Test coverage tracking feature not implemented — no coverage page, webhook, or trend widget | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-048.md |
| BUG-RDV-049 | DORA metric cards show classification badges and "0" instead of "N/A" when no deployment or incident data exists | Open | Medium | 6.0.9 (Local) | bugs/open/BUG-RDV-049.md |
| BUG-RDV-050 | QA Engineer role can access DORA Metrics page — role-based access control not enforced | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-050.md |
| BUG-RDV-051 | Dashboard shared flag update returns HTTP 200 instead of HTTP 403 when user lacks manage_devops_settings | Open | Medium | 6.0.9 (Local) | bugs/open/BUG-RDV-051.md |

| BUG-RDV-052 | Auto-created incidents use "Bug" tracker instead of "Incident" tracker | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-052.md |
| BUG-RDV-053 | Alert feed has no environment filter — only severity and status filters available | Open | Medium | 6.0.9 (Local) | bugs/open/BUG-RDV-053.md |
| BUG-RDV-054 | On-call schedule feature not implemented — no widget on any DevOps page | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-054.md |
| BUG-RDV-055 | Infrastructure resource usage gauges not implemented — no CPU/Memory/Disk on environment cards | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-055.md |

| BUG-RDV-056 | FOSSA license ingestion stores all licenses as "NOASSERTION" / "unknown" risk regardless of payload | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-056.md |
| BUG-RDV-057 | SSRF guard not implemented — private and metadata URLs accepted in sonarqube_host_url field | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-057.md |
| BUG-RDV-058 | XSS payload in release description not sanitized — script executes on release detail page | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-058.md |
| BUG-RDV-059 | Developer role can access Security Vulnerabilities page — view_security_scans permission not enforced | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-059.md |

| BUG-RDV-060 | Incident creation form deviates from INC-001: no standalone Title field; affected_service is sole identifier | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-060.md |
| BUG-RDV-061 | No dedicated "Linked Alerts" section on incident detail page | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-061.md |
| BUG-RDV-062 | No "Add Entry" button for manual timeline entries on incident detail page | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-062.md |
| BUG-RDV-063 | Incident Timeline REST API returns 404 for all URL patterns | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-063.md |
| BUG-RDV-064 | Incidents JSON REST API returns HTTP 406 Not Acceptable | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-064.md |
| BUG-RDV-065 | Developer role can access New Incident form — manage_incidents permission not enforced | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-065.md |
| BUG-RDV-066 | "Assigned To" column missing from incidents list page | Open | Medium | 6.0.9 (Local) | bugs/open/BUG-RDV-066.md |
| BUG-RDV-067 | Deployment correlation override creates no timeline or audit entry | Open | Medium | 6.0.9 (Local) | bugs/open/BUG-RDV-067.md |
| BUG-RDV-068 | Post-mortem Root Cause section shows placeholder text, not pre-filled from incident root_cause field | Open | Medium | 6.0.9 (Local) | bugs/open/BUG-RDV-068.md |
| BUG-RDV-069 | No journal or timeline entry created after sending communication template | Open | Medium | 6.0.9 (Local) | bugs/open/BUG-RDV-069.md |
| BUG-RDV-070 | Blank affected_service accepted on incident creation, defaults to "Unknown Service" | Open | Medium | 6.0.9 (Local) | bugs/open/BUG-RDV-070.md |
| BUG-RDV-071 | Incidents empty state shows blank area with no informative message | Open | Low | 6.0.9 (Local) | bugs/open/BUG-RDV-071.md |

| BUG-RDV-072 | Environment form missing `environment_type` field (dev/staging/prod/custom) | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-072.md |
| BUG-RDV-073 | No "Check Now" button for manual environment health status trigger | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-073.md |
| BUG-RDV-074 | No Admin override mechanism for deployment freeze windows | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-074.md |
| BUG-RDV-075 | Environment Request submission causes 500 error; no custom fields or auto-assignment | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-075.md |
| BUG-RDV-076 | Environment comparison returns 302 redirect for non-existent env ID instead of 404 | Open | Medium | 6.0.9 (Local) | bugs/open/BUG-RDV-076.md |
| BUG-RDV-077 | REST API type filter for environments (by_type scope) not exposed | Open | Low | 6.0.9 (Local) | bugs/open/BUG-RDV-077.md |

| BUG-RDV-078 | Notification matrix missing 7 required DevOps event types | Open | Medium | 6.0.9 (Local) | bugs/open/BUG-RDV-078.md |
| BUG-RDV-079 | Export Release Notes (MD/HTML) blocked for Developer/QA roles — gated on manage_releases instead of view_devops | Open | Medium | 6.0.9 (Local) | bugs/open/BUG-RDV-079.md |

## Notes
- Open bugs (40): bugs/QA/ — BUG-RDV-009, 011, 017, 026, 028, 029, 035 | bugs/open/ — BUG-RDV-047–079
- Not testable (1): bugs/QA/ — BUG-RDV-028 (pending real CI artifact data)
- Closed bugs: bugs/closed/ (38 bugs: 37 FIXED + BUG-RDV-006 closed as Invalid)
- Screenshots: screenshots/<BUG-ID>/
- Last retest: 2026-05-26 (Forge flux-fujhcd9zj49) — 15 bugs fixed and closed this cycle
- Suite 6 run: 2026-05-28 (Local) — 2 new bugs filed (BUG-RDV-047, BUG-RDV-048)
- Suite 7 run: 2026-05-28 (Local) — 3 new bugs filed (BUG-RDV-049, BUG-RDV-050, BUG-RDV-051)
- Suite 8 run: 2026-05-28 (Local) — 4 new bugs filed (BUG-RDV-052, BUG-RDV-053, BUG-RDV-054, BUG-RDV-055)
- Suite 9 run: 2026-05-28 (Local) — 4 new bugs filed (BUG-RDV-056, BUG-RDV-057, BUG-RDV-058, BUG-RDV-059)
- Suite 10 run: 2026-05-28 (Local) — 12 new bugs filed (BUG-RDV-060 through BUG-RDV-071)
- Suite 11 run: 2026-05-28 (Local) — 6 new bugs filed (BUG-RDV-072 through BUG-RDV-077)
- Suite 12 run: 2026-05-28 (Local) — 1 new bug filed (BUG-RDV-078)
- Suite 13 run: 2026-05-28 (Local) — 1 new bug filed (BUG-RDV-079)
