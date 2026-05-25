# Bug Index — Redmineflux DevOps

| Bug ID | Title | Status | Severity | Redmine Version | File Path |
|--------|-------|--------|----------|-----------------|-----------|
| BUG-RDV-001 | Webhook signature rejection returns 401 instead of 403 | Open | Low | 6.0.9 (Forge) | bugs/open/BUG-RDV-001.md |
| BUG-RDV-002 | Webhook endpoint accepts payloads over 2 MB — no size limit enforced | Open | High | 6.0.9 (Forge) | bugs/open/BUG-RDV-002.md |
| BUG-RDV-003 | SonarQube webhook token not configurable via Admin plugin settings UI | Open | High | 6.0.9 (Forge) | bugs/open/BUG-RDV-003.md |
| BUG-RDV-004 | FOSSA provider cannot be added as repository connection — missing from Add Repository form | Open | High | 6.0.9 (Forge) | bugs/open/BUG-RDV-004.md |
| BUG-RDV-005 | Webhook endpoint returns HTTP 400 instead of HTTP 404 for unknown provider | Open | Low | 6.0.9 (Forge) | bugs/open/BUG-RDV-005.md |
| BUG-RDV-006 | Three undocumented DevOps permissions present in Roles administration panel | Open | Medium | 6.0.9 (Forge) | bugs/open/BUG-RDV-006.md |
| BUG-RDV-007 | Webhook background job fails with ActiveRecord::RecordInvalid after returning 202 | Open | Medium | 6.0.9 (Forge) | bugs/open/BUG-RDV-007.md |
| BUG-RDV-008 | REST API returns DevOps data from all projects regardless of user's project membership (IDOR) | Open | Critical | 6.0.9 (Forge) | bugs/open/BUG-RDV-008.md |
| BUG-RDV-009 | DORA metrics REST endpoint returns 404 — route not implemented | Open | High | 6.0.9 (Forge) | bugs/open/BUG-RDV-009.md |
| BUG-RDV-010 | DevOps activity events do not appear in Redmine activity stream — ActivityProvider not registered | Open | High | 6.0.9 (Forge) | bugs/open/BUG-RDV-010.md |
| BUG-RDV-011 | Webhook event log accessible to users with only view_devops — manage_devops_settings not enforced | Open | High | 6.0.9 (Local + Forge) | bugs/open/BUG-RDV-011.md |
| BUG-RDV-012 | Commits REST API ignores the limit parameter — all records returned on page 1 | Open | Medium | 6.0.9 (Local) | bugs/open/BUG-RDV-012.md |
| BUG-RDV-013 | Five of ten documented REST API endpoints return HTTP 406 — JSON format not supported | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-013.md |
| BUG-RDV-014 | PR reviewer names and approval status not displayed on PR card | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-014.md |
| BUG-RDV-015 | Auto-transition journal text format wrong and attributed to real user instead of system actor | Open | Medium | 6.0.9 (Local) | bugs/open/BUG-RDV-015.md |
| BUG-RDV-016 | PR Review Dashboard shows all statuses (not just open) and sorts by updated date instead of age | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-016.md |
| BUG-RDV-017 | PR Review Dashboard and Commits page return HTTP 200 to users without view_devops permission | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-017.md |
| BUG-RDV-018 | Commit statistics route returns 404 — daily/weekly aggregation and top contributors not implemented | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-018.md |
| BUG-RDV-019 | PR linked to multiple issues via "refs #N" only updates first referenced issue | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-019.md |
| BUG-RDV-020 | GitLab commit SHA links use /commit/ instead of /-/commit/ URL pattern | Open | Low | 6.0.9 (Local) | bugs/open/BUG-RDV-020.md |
| BUG-RDV-021 | Auto-transition rules UI missing per-rule configuration (Add Rule, Source Status, Trigger type) | Open | Medium | 6.0.9 (Local) | bugs/open/BUG-RDV-021.md |
| BUG-RDV-022 | Multi-commit push webhook stores no commits — background job silently fails | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-022.md |
| BUG-RDV-023 | Build badge JS polling uses project identifier string in API call — returns 403, badge never auto-updates | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-023.md |
| BUG-RDV-024 | Build history date filter has no custom date range — only preset period dropdown | Open | Medium | 6.0.9 (Local) | bugs/open/BUG-RDV-024.md |
| BUG-RDV-026 | JUnit ingestion endpoint returns 422 — missing rexml XML parser gem dependency | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-026.md |
| BUG-RDV-027 | Build queue status widget missing — dashboards page shows placeholder only | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-027.md |
| BUG-RDV-028 | Artifact download links section shows no artifacts for completed builds | Open | Medium | 6.0.9 (Local) | bugs/open/BUG-RDV-028.md |
| BUG-RDV-029 | Pipeline stage breakdown not implemented — no stages section on build detail page | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-029.md |
| BUG-RDV-030 | Slack and Microsoft Teams notification channels absent from DevOps notification preferences | Open | Medium | 6.0.9 (Local) | bugs/open/BUG-RDV-030.md |
| BUG-RDV-031 | Build run duration not stored or displayed — webhook run_duration_ms field silently ignored | Open | Medium | 6.0.9 (Local) | bugs/open/BUG-RDV-031.md |

| BUG-RDV-032 | Deploy button not disabled when environment is locked or frozen | Open | Medium | 6.0.9 (Local) | bugs/open/BUG-RDV-032.md |
| BUG-RDV-033 | ArgoCD provider not supported — canary/progressive rollout TCs entirely blocked | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-033.md |
| BUG-RDV-034 | Deployment detail missing commit SHA hyperlink and deployment URL field | Open | Medium | 6.0.9 (Local) | bugs/open/BUG-RDV-034.md |
| BUG-RDV-035 | No issue-deployment linkage on deployment detail or issue pages | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-035.md |
| BUG-RDV-036 | Original deployment detail shows no "Reverted by" link after rollback | Open | Medium | 6.0.9 (Local) | bugs/open/BUG-RDV-036.md |
| BUG-RDV-037 | Multiple concurrent pending_approval deployments accepted for same environment | Open | High | 6.0.9 (Local) | bugs/open/BUG-RDV-037.md |
| BUG-RDV-038 | Environment cards not ordered by type (dev→staging→production) | Open | Low | 6.0.9 (Local) | bugs/open/BUG-RDV-038.md |

## Notes
- Open bugs: bugs/open/
- Closed bugs: bugs/closed/
- Screenshots: screenshots/<BUG-ID>/
