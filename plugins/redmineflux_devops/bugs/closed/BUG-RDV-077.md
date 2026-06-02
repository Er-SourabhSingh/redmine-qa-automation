# Bug Report

- Bug ID: BUG-RDV-077
- Title: REST API type filter for environments not exposed — /devops/environments.json?type= returns 404
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Severity: Low
- Date: 2026-05-28 | Retest: 2026-05-29 — STILL OPEN (404)

## Steps to reproduce

1. `GET /projects/phoenix-platform/devops/environments.json?type=production`

## Expected result

Returns only production-flagged environments.

## Actual result

HTTP 404. Route `/devops/environments.json` does not exist. Retest 2026-05-29: still returns 404.

## Notes

Also related to BUG-RDV-072 — without an `environment_type` field on environments, type filtering is functionally meaningless even if the route is added.

## Duplicate check

- Duplicate found: No
