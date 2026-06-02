# Bug Report

- Bug ID: BUG-RDV-053
- Title: Alert feed has no environment filter — only severity and status filters available
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Severity: Medium
- Date: 2026-05-28 | Retest: 2026-05-29 — STILL OPEN

## Steps to reproduce

1. Navigate to `/projects/phoenix-platform/devops_alerts`.
2. Observe the filter controls above the alert table.

## Expected result

Alert feed includes an environment filter dropdown. Selecting "production" shows only production-tagged alerts.

## Actual result

Only two filters: Severity and Status. No environment filter. `?environment=production` URL parameter shows all alerts unfiltered. Retest 2026-05-29 confirmed: filter selects contain no environment option.

## Evidence

![BUG-RDV-053 — Alert feed with no environment filter](../../screenshots/BUG-RDV-053/bug-rdv-053-no-environment-filter.png)

## Duplicate check

- Duplicate found: No
