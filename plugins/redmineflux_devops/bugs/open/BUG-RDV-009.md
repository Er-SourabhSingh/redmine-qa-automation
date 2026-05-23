# BUG-RDV-009

- Bug ID: BUG-RDV-009
- Title: DORA metrics REST endpoint returns 404 — route not implemented
- Redmine version: 6.0.9 (Forge)
- Plugin name: redmineflux_devops
- Plugin version: 0.1.0
- Environment: Forge only — https://flux-fhcnclfvk49.forge.zehntech.com/ (does NOT reproduce on Local Docker)
- Browser: Playwright (headless)
- User role: Admin
- Severity: High
- Date: 2026-05-22

## Steps to reproduce

1. Log in as Admin (valid API key).
2. Send `GET /devops/metrics/dora.json?project_id=phoenix-platform` with header `X-Redmine-API-Key: <admin_key>`.
3. Observe the HTTP response.

## Expected result

- HTTP 200 with a JSON body containing DORA metric data (deployment frequency, lead time, MTTR, change failure rate) for the project.

## Actual result

- HTTP 404 Not Found.
- The endpoint `/devops/metrics/dora.json` is not routed — the route does not exist in the plugin.

## Evidence

- Screenshot path: screenshots/TC-RDV-023/
- All other 9 documented REST endpoints return 200 (builds, commits, pull_requests, deployments, environments, incidents, vulnerabilities, releases, alerts).

## Duplicate check

- Duplicate found: No

## Notes

- The DORA metrics feature is listed in requirements.md (rfd-007) and the user-guide documents the DORA dashboard.
- The REST API documentation specifies `GET /devops/metrics/dora.json` as a supported endpoint.
- The route is simply missing from the plugin's routes configuration.

## Retest

- Date: 2026-05-23
- Environment: Local Docker (http://localhost:3008)
- Result: **DOES NOT REPRODUCE on local**
- `GET /projects/7/devops_metrics.json` → HTTP 200 with DORA data (deployment_frequency, lead_time_for_changes, mean_time_to_restore, change_failure_rate). Route `resources :devops_metrics, only: [:index]` exists in local routes.rb.
- Bug remains open as Forge-specific. The route appears to be present in the local build but missing or misconfigured on the Forge deployment. Requires re-verification on Forge.
