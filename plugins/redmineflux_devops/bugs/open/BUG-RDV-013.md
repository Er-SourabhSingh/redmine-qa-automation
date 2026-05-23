# Bug Report

- Bug ID: BUG-RDV-013
- Title: Five of ten documented REST API endpoints return HTTP 406 — JSON format not supported
- Redmine version: 6.0.9 (Local Docker)
- Plugin name: redmineflux_devops
- Plugin version: 0.1.0
- Environment: Local — http://localhost:3008
- Browser: PowerShell Invoke-RestMethod / curl
- User role: Administrator
- Severity: High
- Date: 2026-05-23
- Discovered in TC: TC-RDV-023

## Steps to reproduce

1. Authenticate as admin with API key `a0d031712f66a866cf9a5251232dc75abd27cbe2`.
2. Send `GET /projects/phoenix-platform/devops_environments.json` with `Content-Type: application/json`.
3. Repeat for each of the following endpoints:
   - `GET /projects/phoenix-platform/devops_incidents.json`
   - `GET /projects/phoenix-platform/devops_vulnerabilities.json`
   - `GET /projects/phoenix-platform/devops_releases.json`
   - `GET /projects/phoenix-platform/devops_alerts.json`
4. Observe the HTTP response status code for each.

## Expected result

- All 10 documented DevOps REST API endpoints respond with HTTP 200 and a JSON body when called with `.json` format.
- The spec documents all 10 endpoints as REST-accessible.

## Actual result

- Only 5 of 10 endpoints support JSON format and return HTTP 200:
  - `/projects/:id/devops_builds.json` ✓
  - `/projects/:id/devops_commits.json` ✓
  - `/projects/:id/devops_pull_requests.json` ✓
  - `/projects/:id/devops_deployments.json` ✓
  - `/projects/:id/devops_metrics.json` ✓
- The following 5 endpoints return **HTTP 406 Not Acceptable**:
  - `/projects/:id/devops_environments.json` ✗
  - `/projects/:id/devops_incidents.json` ✗
  - `/projects/:id/devops_vulnerabilities.json` ✗
  - `/projects/:id/devops_releases.json` ✗
  - `/projects/:id/devops_alerts.json` ✗
- The 406 response indicates these controllers do not register a JSON responder — only HTML format is supported.

## Evidence

- Screenshot path: screenshots/TC-RDV-023/
- Log path: —

## Duplicate check

- Duplicate found: No

## Retest

- Date: 2026-05-23
- Environment: Local Docker (http://localhost:3008)
- Result: **CONFIRMED** (originally discovered in this session)
- All 5 failing endpoints verified: devops_environments, devops_incidents, devops_vulnerabilities, devops_releases, devops_alerts → HTTP 406 Not Acceptable. Original discovery confirmed.
