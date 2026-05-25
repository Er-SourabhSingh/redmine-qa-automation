# Final Bug Report — Redmineflux DevOps

> Generated from bugs/open/. PDF only on explicit user request.

## Summary

| Total | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|
| 37    | 1        | 20   | 12     | 4   |

> **Suite 01 (2026-05-23):** 13 bugs (BUG-RDV-001–013). **Suite 02 (2026-05-25):** 9 new bugs (BUG-RDV-014–022). **Suite 03 (2026-05-25):** 8 new bugs (BUG-RDV-023, 024, 026–031; BUG-RDV-025 not filed). **Suite 04 (2026-05-25):** 7 new bugs (BUG-RDV-032–038). All 37 remain open.

## Environment

- Plugin: redmineflux_devops v0.1.0
- Redmine Version: 6.0.9
- Environment: Local Docker (http://localhost:3008) + Forge (https://flux-fhcnclfvk49.forge.zehntech.com/)
- Suites: tc-01-foundation-infrastructure.md (TC-001–040) + tc-02-scm-integration.md (TC-041–090) + tc-03-cicd-builds.md (TC-091–150) + tc-04-deployments.md (TC-151–210)
- Test Dates: 2026-05-23 (Suite 01), 2026-05-25 (Suites 02–04)
- Total TCs: 210 | Pass: 90 | Fail: 61 | Skip: 4 | Blocked: 55

---

## Open Bugs

### BUG-RDV-008 — [CRITICAL] REST API returns DevOps data from all projects (IDOR)

- **TC:** TC-RDV-022 | **Env:** Forge only
- A user with API access retrieves DevOps data from projects they are not a member of. No project-scoped authorization at the data layer.
- **File:** bugs/open/BUG-RDV-008.md

---

### BUG-RDV-002 — [HIGH] Webhook endpoint accepts payloads over 2 MB

- **TC:** TC-RDV-003 | **Env:** Forge + Local
- No size limit enforced — oversized payloads accepted with HTTP 202.
- **File:** bugs/open/BUG-RDV-002.md

---

### BUG-RDV-003 — [HIGH] SonarQube webhook token not configurable via Admin plugin settings UI

- **TC:** TC-RDV-009 | **Env:** Forge + Local
- SonarQube token field absent from plugin settings; blocks TC-RDV-073/074.
- **File:** bugs/open/BUG-RDV-003.md

---

### BUG-RDV-004 — [HIGH] FOSSA provider missing from Add Repository form

- **TC:** TC-RDV-009 | **Env:** Forge + Local
- FOSSA is not available as a provider option when adding a repository connection.
- **File:** bugs/open/BUG-RDV-004.md

---

### BUG-RDV-007 — [HIGH] Webhook background job fails with ActiveRecord::RecordInvalid

- **TC:** TC-RDV-015 | **Env:** Forge + Local
- Webhook returns 202 immediately but background job raises RecordInvalid and rolls back. Commits are never stored. Blocks all commit-linked issue panel assertions.
- **File:** bugs/open/BUG-RDV-007.md

---

### BUG-RDV-009 — [HIGH] DORA metrics REST endpoint returns 404

- **TC:** TC-RDV-023 | **Env:** Forge only
- DORA metrics route not implemented; endpoint returns 404.
- **File:** bugs/open/BUG-RDV-009.md

---

### BUG-RDV-010 — [HIGH] DevOps activity events not in Redmine activity stream

- **TC:** TC-RDV-024 | **Env:** Forge + Local
- ActivityProvider not registered; no DevOps events appear in the activity stream.
- **File:** bugs/open/BUG-RDV-010.md

---

### BUG-RDV-011 — [HIGH] Webhook event log accessible without manage_devops_settings

- **TC:** TC-RDV-040 | **Env:** Forge + Local
- Users with only `view_devops` permission can access the webhook event log. `manage_devops_settings` not enforced.
- **File:** bugs/open/BUG-RDV-011.md

---

### BUG-RDV-013 — [HIGH] Five of ten documented REST API endpoints return 406

- **TC:** TC-RDV-023 | **Env:** Local
- environments, incidents, vulnerabilities, releases, alerts endpoints return 406 (JSON format not supported).
- **File:** bugs/open/BUG-RDV-013.md

---

### BUG-RDV-014 — [HIGH] PR reviewer names and approval status not displayed on PR card

- **TC:** TC-RDV-050 | **Env:** Local
- After `pull_request_review` webhook (202), reviewer and approval data is not stored or rendered on the PR card.
- **File:** bugs/open/BUG-RDV-014.md

---

### BUG-RDV-016 — [HIGH] PR Review Dashboard shows all statuses; wrong sort order

- **TC:** TC-RDV-065 | **Env:** Local
- Dashboard shows merged, closed, draft, open PRs instead of open-only. Sort is Updated desc instead of age asc.
- **File:** bugs/open/BUG-RDV-016.md

---

### BUG-RDV-017 — [HIGH] PR Dashboard and Commits page return HTTP 200 without view_devops

- **TC:** TC-RDV-067, TC-RDV-072 | **Env:** Local
- Non-members and users without `view_devops` receive HTTP 200 with full PR and commit data.
- **File:** bugs/open/BUG-RDV-017.md

---

### BUG-RDV-018 — [HIGH] Commit statistics route returns 404 — not implemented

- **TC:** TC-RDV-070, TC-RDV-071 | **Env:** Local
- `/devops_commit_stats` returns 404. No daily/weekly chart, no top contributors, no time window filter.
- **File:** bugs/open/BUG-RDV-018.md

---

### BUG-RDV-019 — [HIGH] PR linked to multiple issues only updates first referenced issue

- **TC:** TC-RDV-079 | **Env:** Local
- PR title "Fixes #518 and refs #519" — only issue #518 gets the PR card. Issue #519 receives nothing.
- **File:** bugs/open/BUG-RDV-019.md

---

### BUG-RDV-022 — [HIGH] Multi-commit push webhook stores no commits

- **TC:** TC-RDV-089 | **Env:** Local
- Push webhook with 3 commits returns 202 but 0 commits stored (background job silent failure — same root as BUG-RDV-007).
- **File:** bugs/open/BUG-RDV-022.md

---

### BUG-RDV-006 — [MEDIUM] Three undocumented DevOps permissions in Roles panel

- **TC:** TC-RDV-007 | **Env:** Forge + Local
- 10 permissions visible; spec defines 7. Three have no documentation.
- **File:** bugs/open/BUG-RDV-006.md

---

### BUG-RDV-012 — [MEDIUM] Commits REST API ignores limit parameter

- **TC:** TC-RDV-021 | **Env:** Local
- `?limit=5` ignored — all records returned on page 1.
- **File:** bugs/open/BUG-RDV-012.md

---

### BUG-RDV-015 — [MEDIUM] Auto-transition journal text wrong and attributed to real user

- **TC:** TC-RDV-055, TC-RDV-081 | **Env:** Local
- Journal text: "[DevOps] Status changed automatically — PR merged" (spec: "Status changed by DevOps integration (PR #N merged)"). Author: "Redmine Admin" (spec: system/DevOps actor).
- **File:** bugs/open/BUG-RDV-015.md

---

### BUG-RDV-021 — [MEDIUM] Auto-transition rules UI missing per-rule configuration

- **TC:** TC-RDV-088 | **Env:** Local
- Only global enable checkbox + single target status select. No Add Rule, Source Status, or Trigger type controls.
- **File:** bugs/open/BUG-RDV-021.md

---

### BUG-RDV-001 — [LOW] Webhook signature rejection returns 401 instead of 403

- **TC:** TC-RDV-002 | **Env:** Forge + Local
- Invalid signature rejected with HTTP 401; spec requires 403.
- **File:** bugs/open/BUG-RDV-001.md

---

### BUG-RDV-005 — [LOW] Webhook returns 400 instead of 404 for unknown provider

- **TC:** TC-RDV-004 | **Env:** Forge + Local
- Unknown provider (e.g. `fossa`) returns 400 Bad Request; spec requires 404.
- **File:** bugs/open/BUG-RDV-005.md

---

### BUG-RDV-020 — [LOW] GitLab commit SHA links use /commit/ instead of /-/commit/

- **TC:** TC-RDV-082 | **Env:** Local
- GitLab links: `https://gitlab.com/ns/repo/commit/sha` — missing `/-/` per GitLab URL standard.
- **File:** bugs/open/BUG-RDV-020.md

---

## Suite 03 Bugs (CI/CD & Build Management)

---

### BUG-RDV-023 — [HIGH] Build badge JS polling uses project identifier string → returns 403, badge never auto-updates

- **TC:** TC-RDV-095 | **Env:** Local
- `data-project-id` attribute contains string identifier ("phoenix-platform"), not numeric ID. JS polling calls `/devops/builds.json?project_id=phoenix-platform` → 403. Badge never auto-updates without manual page reload.
- **File:** bugs/open/BUG-RDV-023.md

---

### BUG-RDV-024 — [MEDIUM] Build history date filter has no custom date range — only preset period dropdown

- **TC:** TC-RDV-100 | **Env:** Local
- Filter form has only "Last 7/30/90 days / All time" preset dropdown. No custom `date_from`/`date_to` date pickers as spec requires.
- **File:** bugs/open/BUG-RDV-024.md

---

### BUG-RDV-026 — [HIGH] JUnit ingestion endpoint returns 422 — missing rexml XML parser gem dependency

- **TC:** TC-RDV-122 | **Env:** Local
- `POST /devops/builds/3/test_results` with valid JUnit XML returns HTTP 422: `{"error":"XML parser dependency missing: cannot load such file -- rexml/document"}`. All JUnit-dependent features blocked.
- **File:** bugs/open/BUG-RDV-026.md

---

### BUG-RDV-027 — [HIGH] Build queue status widget missing — dashboards page shows placeholder only

- **TC:** TC-RDV-115, TC-RDV-116 | **Env:** Local
- `/projects/phoenix-platform/devops/dashboards` shows "No custom dashboards yet." No built-in Build Queue widget as specified in rfd-077 / CICD-006.
- **File:** bugs/open/BUG-RDV-027.md

---

### BUG-RDV-028 — [MEDIUM] Artifact download links section shows no artifacts for completed builds

- **TC:** TC-RDV-117 | **Env:** Local
- Build #513 (success) shows "No artifacts available for this build." Artifact fetch from GitHub Actions API not implemented. TC-RDV-118 and TC-RDV-119 blocked.
- **File:** bugs/open/BUG-RDV-028.md

---

### BUG-RDV-029 — [HIGH] Pipeline stage breakdown not implemented — no stages section on build detail page

- **TC:** TC-RDV-125, TC-RDV-144, TC-RDV-148 | **Env:** Local
- No "Pipeline Stages" section on any build detail page for GitHub Actions, Jenkins, or GitLab CI. `BuildStageIngestor` service not implemented.
- **File:** bugs/open/BUG-RDV-029.md

---

### BUG-RDV-030 — [MEDIUM] Slack and Microsoft Teams notification channels absent from DevOps notification preferences

- **TC:** TC-RDV-128, TC-RDV-131 | **Env:** Local
- `/my/devops_notifications` shows only Email and In-app columns. Slack and Teams channels are not implemented in the notification preferences UI.
- **File:** bugs/open/BUG-RDV-030.md

---

### BUG-RDV-031 — [MEDIUM] Build run duration not stored or displayed — webhook run_duration_ms field silently ignored

- **TC:** TC-RDV-134, TC-RDV-150 | **Env:** Local
- Webhook payloads with `run_duration_ms: 187000` result in build records showing "N/A" duration. Duration column in builds list shows "-". Badge shows no duration text.
- **File:** bugs/open/BUG-RDV-031.md

---

## Suite 04 Bugs (Deployments)

---

### BUG-RDV-032 — [MEDIUM] Deploy button not disabled when environment is locked or frozen

- **TC:** TC-RDV-169, TC-RDV-181 | **Env:** Local
- Deploy button remains fully enabled in UI for locked and frozen environments. Server correctly blocks with HTTP 423 (freeze) or flash message (lock), but UI gives no pre-emptive visual indication.
- **File:** bugs/open/BUG-RDV-032.md

---

### BUG-RDV-033 — [HIGH] ArgoCD provider not supported — canary/progressive rollout entirely blocked

- **TC:** TC-RDV-174, TC-RDV-193, TC-RDV-194 | **Env:** Local
- SUPPORTED_PROVIDERS = [github, gitlab, bitbucket, jenkins, sonarqube, fossa, prometheus, datadog, zabbix, pagerduty]. ArgoCD absent. POSTing `provider=argocd` returns HTTP 400. All canary rollout and progressive deployment features are untestable.
- **File:** bugs/open/BUG-RDV-033.md

---

### BUG-RDV-034 — [MEDIUM] Deployment detail missing commit SHA hyperlink and deployment URL field

- **TC:** TC-RDV-186 | **Env:** Local
- COMMIT field shows "—" even when `commit_sha` is stored. No "Deployment URL" field visible. Users cannot navigate to the remote commit or deployment environment URL from Redmine.
- **File:** bugs/open/BUG-RDV-034.md

---

### BUG-RDV-035 — [HIGH] No issue-deployment linkage on deployment detail or issue pages

- **TC:** TC-RDV-155, TC-RDV-156, TC-RDV-189, TC-RDV-197, TC-RDV-207 | **Env:** Local
- Deployment detail page has no "Issues Included" section. Redmine issue pages show no deployment badge, widget, or sidebar section. Feature not implemented.
- **File:** bugs/open/BUG-RDV-035.md

---

### BUG-RDV-036 — [MEDIUM] Original deployment detail shows no "Reverted by" link after rollback

- **TC:** TC-RDV-199 | **Env:** Local
- After rollback, the original deployment detail page shows no "Reverted by" reverse link. Only the rollback record links back to the original. Bi-directional audit trail incomplete.
- **File:** bugs/open/BUG-RDV-036.md

---

### BUG-RDV-037 — [HIGH] Multiple concurrent pending_approval deployments accepted for same environment

- **TC:** TC-RDV-183 | **Env:** Local
- A second deploy POST to an approval-gated environment with an existing `pending_approval` deployment returns HTTP 302 success. Multiple simultaneous pending approvals allowed per environment — causes approval queue confusion.
- **File:** bugs/open/BUG-RDV-037.md

---

### BUG-RDV-038 — [LOW] Environment cards not ordered by type (dev → staging → production)

- **TC:** TC-RDV-206 | **Env:** Local
- Environments shown in creation order (production, uat, dev, staging) not pipeline hierarchy (dev→staging→uat→production). Same incorrect order appears in the deployments filter dropdown.
- **File:** bugs/open/BUG-RDV-038.md
