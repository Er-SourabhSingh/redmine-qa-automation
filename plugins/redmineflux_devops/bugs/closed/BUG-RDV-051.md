# Bug Report

- Bug ID: BUG-RDV-051
- Title: Dashboard shared flag update returns wrong HTTP status when user lacks manage_devops_settings
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Severity: Medium
- Date: 2026-05-28 | Retest: 2026-05-29 — STILL OPEN (returns 422 instead of 403)

## Steps to reproduce

1. Authenticate as dev_user (Developer, no manage_devops_settings).
2. PATCH `/projects/phoenix-platform/devops/dashboards/2` with `{redmineflux_devops_dashboard: {shared: 1}}`.
3. Observe HTTP status.

## Expected result

HTTP 403 Forbidden — user lacks `manage_devops_settings` to set shared flag.

## Actual result

Original: HTTP 200 (shared flag silently ignored). Retest 2026-05-29: HTTP 422 (unprocessable entity). Neither 200 nor 422 is correct — should be 403.

## Evidence

![BUG-RDV-051 — Dashboard shared flag wrong status](../../screenshots/BUG-RDV-051/bug-rdv-051-dashboard-shared-flag-200-not-403.png)

## Duplicate check

- Duplicate found: No
