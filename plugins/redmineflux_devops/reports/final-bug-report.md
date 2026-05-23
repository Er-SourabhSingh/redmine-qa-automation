# Final Bug Report — Redmineflux DevOps

> Generated from bugs/open/. PDF only on explicit user request.

## Summary

| Total | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|
| 13    | 1        | 7    | 3      | 2   |

> **Re-verification note (2026-05-23):** All 13 bugs re-verified on Local Docker. 11 confirmed on local. BUG-RDV-008 and BUG-RDV-009 do NOT reproduce on local (Forge-specific). All 13 remain open pending Forge re-verification.

## Environment

- Plugin: redmineflux_devops v0.1.0
- Redmine Version: 6.0.9
- Environment: Local Docker (http://localhost:3008) + Forge (https://flux-fhcnclfvk49.forge.zehntech.com/)
- Test Suite: tc-01-foundation-infrastructure.md (TC-RDV-001 to TC-RDV-040)
- Test Date: 2026-05-23 | Re-verification Date: 2026-05-23
- Total TCs: 40 | Pass: 26 | Fail: 10 | Skip: 1 | Blocked: 3

---

## Open Bugs

### BUG-RDV-008 — [CRITICAL] REST API returns DevOps data from all projects (IDOR)

- **TC:** TC-RDV-022
- **Severity:** Critical
- **Environment:** Forge only (does NOT reproduce on Local Docker — 403 returned correctly on local)
- A user with API access can retrieve DevOps builds, commits, and pull requests from projects they are not a member of by specifying `project_id` in REST API requests. Authorization is not enforced at the data layer.
- **Re-verified:** 2026-05-23 — local: does not reproduce. Forge: unverified since re-verification (originally confirmed 2026-05-22).
- **File:** bugs/open/BUG-RDV-008.md

---

### BUG-RDV-002 — [HIGH] Webhook endpoint accepts payloads over 2 MB

- **TC:** TC-RDV-003
- **Severity:** High
- **Environment:** Forge + Local
- No payload size limit is enforced on `POST /devops/webhook/:provider/:project`. Payloads well over 2 MB are accepted and processed. Risk: memory exhaustion / DoS.
- **File:** bugs/open/BUG-RDV-002.md

---

### BUG-RDV-003 — [HIGH] SonarQube webhook token not configurable in settings UI

- **TC:** TC-RDV-009
- **Severity:** High
- **Environment:** Forge + Local
- The plugin settings page does not provide a SonarQube webhook token field. The spec (rfd-102) states all provider tokens should be configurable from Administration > Plugins > Configure.
- **File:** bugs/open/BUG-RDV-003.md

---

### BUG-RDV-004 — [HIGH] FOSSA missing from Add Repository connection form

- **TC:** TC-RDV-009
- **Severity:** High
- **Environment:** Forge + Local
- The "Add Repository" form only offers GitHub, GitLab, and Bitbucket providers. FOSSA is not present despite being documented as a supported provider.
- **File:** bugs/open/BUG-RDV-004.md

---

### BUG-RDV-007 — [HIGH] Webhook background job fails with ActiveRecord::RecordInvalid

- **TC:** TC-RDV-015
- **Severity:** High
- **Environment:** Forge + Local
- After the webhook endpoint returns 202 Accepted, the background job that processes the payload and creates commit/build records raises `ActiveRecord::RecordInvalid`. As a result, commit records are not persisted. The webhook event log records the delivery, but data is lost.
- **File:** bugs/open/BUG-RDV-007.md

---

### BUG-RDV-009 — [HIGH] DORA metrics REST endpoint returns 404

- **TC:** TC-RDV-023
- **Severity:** High
- **Environment:** Forge only (does NOT reproduce on Local Docker — HTTP 200 with DORA data returned correctly on local)
- `GET /projects/:id/devops_metrics.json` (DORA metrics) returns HTTP 404. The route is not registered in the plugin's routing table, despite being documented in the REST API specification.
- **Re-verified:** 2026-05-23 — local: does not reproduce (route exists and returns 200). Forge: unverified since re-verification (originally confirmed 2026-05-22).
- **File:** bugs/open/BUG-RDV-009.md

---

### BUG-RDV-010 — [HIGH] DevOps activity events absent from Redmine activity stream

- **TC:** TC-RDV-024, TC-RDV-026
- **Severity:** High
- **Environment:** Forge + Local
- **Re-verified:** 2026-05-23 — CONFIRMED on local
- The plugin does not register a Redmine `ActivityProvider`. DevOps events (commits, builds, deployments) never appear in the project activity stream. No DevOps filter category is present in the activity sidebar for any user role.
- **File:** bugs/open/BUG-RDV-010.md

---

### BUG-RDV-011 — [HIGH] Webhook event log accessible without manage_devops_settings

- **TC:** TC-RDV-040
- **Severity:** High
- **Environment:** Forge + Local
- `/projects/:id/devops_webhooks` is accessible to any user with `view_devops` permission. The spec requires `manage_devops_settings`. Users in the Developer role (view_devops only) can view the complete webhook event log including payload metadata.
- **File:** bugs/open/BUG-RDV-011.md

---

### BUG-RDV-013 — [HIGH] Five of ten REST API endpoints return HTTP 406

- **TC:** TC-RDV-023
- **Severity:** High
- **Environment:** Local
- The following documented REST endpoints do not support JSON format and return HTTP 406:
  - `/projects/:id/devops_environments.json`
  - `/projects/:id/devops_incidents.json`
  - `/projects/:id/devops_vulnerabilities.json`
  - `/projects/:id/devops_releases.json`
  - `/projects/:id/devops_alerts.json`
- **File:** bugs/open/BUG-RDV-013.md

---

### BUG-RDV-006 — [MEDIUM] Three undocumented permissions in Roles admin panel

- **TC:** TC-RDV-007
- **Severity:** Medium
- **Environment:** Forge + Local
- The Roles & Permissions admin panel shows 10 DevOps permissions. The spec documents 7. Three extra permissions (`manage_incidents`, `view_security_scans`, `override_security_gate`) appear without documentation or specification reference.
- **File:** bugs/open/BUG-RDV-006.md

---

### BUG-RDV-012 — [MEDIUM] Commits REST API ignores the limit parameter

- **TC:** TC-RDV-021
- **Severity:** Medium
- **Environment:** Local
- `GET /projects/:id/devops_commits.json?limit=5&page=1` returns all records on page 1 regardless of the `limit` value. The `page`/offset parameter is respected, but `limit` has no effect. No `total_count` field is present in the response.
- **File:** bugs/open/BUG-RDV-012.md

---

### BUG-RDV-001 — [LOW] Webhook signature rejection returns 401 instead of 403

- **TC:** TC-RDV-002
- **Severity:** Low
- **Environment:** Forge + Local
- When a webhook is received with an invalid HMAC-SHA256 signature, the response is `HTTP 401 Unauthorized` instead of `HTTP 403 Forbidden`. The request is correctly rejected; only the status code is semantically incorrect per RFC.
- **File:** bugs/open/BUG-RDV-001.md

---

### BUG-RDV-005 — [LOW] Webhook unknown provider returns 400 instead of 404

- **TC:** TC-RDV-004
- **Severity:** Low
- **Environment:** Forge + Local
- `POST /devops/webhook/unknown_provider/phoenix-platform` returns `HTTP 400 Bad Request` instead of `HTTP 404 Not Found`. The spec expects 404 for unrecognized providers.
- **File:** bugs/open/BUG-RDV-005.md
