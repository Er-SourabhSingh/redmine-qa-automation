# Bug Report

- Bug ID: BUG-RDV-009
- Title: DORA metrics REST endpoint returns 404 — route not implemented
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Severity: High
- Date: 2026-05-22 | Retest: 2026-05-29 — STILL OPEN (404)

## Steps to reproduce

1. Authenticate with admin API key.
2. Send `GET /projects/phoenix-platform/devops/metrics/dora.json`.
3. Observe the HTTP response.

## Expected result

HTTP 200 with JSON containing DORA metric data (deployment_frequency, lead_time, change_failure_rate, mean_time_to_recovery).

## Actual result

HTTP 404 — route entirely absent from the plugin routing table. Confirmed on both Forge (2026-05-22) and Local Docker (retest 2026-05-29).

## Evidence

![BUG-RDV-009 — DORA endpoint 404](../../screenshots/BUG-RDV-009/bug-rdv-009-dora-404.png)

## Affected test cases

- TC-RDV-302, TC-RDV-303, TC-RDV-318, TC-RDV-323 (all BLOCKED)

## Duplicate check

- Duplicate found: No
