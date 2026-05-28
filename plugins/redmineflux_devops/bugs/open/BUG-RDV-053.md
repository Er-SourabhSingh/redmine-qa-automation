# Bug Report

- Bug ID: BUG-RDV-053
- Title: Alert feed has no environment filter — only severity and status filters available
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Plugin version: (local)
- Environment: Local Docker (http://localhost:3008)
- Browser: Chromium (Playwright)
- User role: Admin
- Date: 2026-05-28
- Severity: Medium

## Steps to reproduce

1. Navigate to `/projects/phoenix-platform/devops_alerts`
2. Observe the filter controls above the alert table

## Expected result

- Per rfd-026 and TC-RDV-332: alert feed should include an environment filter control (dropdown or filter pill)
- Selecting "production" should show only alerts tagged with the "production" environment label
- Clearing the filter should restore all alerts

## Actual result

- The alert feed page only has two filter controls: "Severity" and "Status"
- No environment filter exists — alerts from all environments are shown together with no way to filter by environment
- The `environment` label IS included in webhook payloads (Prometheus alerts include `environment: production` in labels), but no environment filter is exposed in the UI or queryable via URL parameter (`?environment=production` shows all alerts unfiltered)
- Affects TC-RDV-332

## Evidence

![BUG-RDV-053 — Alert feed with no environment filter control](../../screenshots/BUG-RDV-053/bug-rdv-053-no-environment-filter.png)

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —
