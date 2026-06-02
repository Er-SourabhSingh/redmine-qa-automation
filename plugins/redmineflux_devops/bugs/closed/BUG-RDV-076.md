# Bug Report

- Bug ID: BUG-RDV-076
- Title: Environment comparison endpoint returns wrong status for non-existent environment IDs
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Severity: Medium
- Date: 2026-05-28 | Retest: 2026-05-29 — STILL OPEN (returns 403 instead of 404)

## Steps to reproduce

1. Send `GET /projects/phoenix-platform/devops_environments/compare?a=1&b=999` (env ID 999 does not exist).

## Expected result

HTTP 404 response. No environment data exposed.

## Actual result

Original: HTTP 302 redirect. Retest 2026-05-29: HTTP 403 Forbidden. Neither 302 nor 403 is the correct response — should be 404 when an environment ID does not exist or belongs to another project.

## Evidence

![BUG-RDV-076 — Compare endpoint returns wrong status](../../screenshots/BUG-RDV-076/bug-rdv-076-retest-returns-404.png)

## Duplicate check

- Duplicate found: No
