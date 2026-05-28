# Bug Report

- Bug ID: BUG-RDV-054
- Title: On-call schedule feature not implemented — no widget on any DevOps page
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Plugin version: (local)
- Environment: Local Docker (http://localhost:3008)
- Browser: Chromium (Playwright)
- User role: Admin
- Date: 2026-05-28
- Severity: High

## Steps to reproduce

1. Navigate to any DevOps page: `/projects/phoenix-platform/devops_builds`, `/devops_environments`, `/devops_alerts`, `/devops_incidents`
2. Search for an on-call schedule widget, sidebar widget, or on-call section

## Expected result

- Per rfd-093 and TC-RDV-342/343/366: an on-call schedule sidebar widget should appear on the project DevOps page
- The widget should display the current on-call person's name and shift end time
- Configurable for PagerDuty or Opsgenie via API token
- On-call data should be cached for 15 minutes (TC-RDV-344)
- Stale cached data shown when API is unavailable (TC-RDV-345)

## Actual result

- No on-call schedule widget or section exists on any DevOps page
- HTML source of devops_builds, devops_environments, devops_incidents, and devops_alerts pages contain no reference to "on-call", "on_call", "oncall", "pagerduty", or "opsgenie"
- The rfd-093 On-Call Schedule feature (PagerDuty/Opsgenie integration with 15-min cache) is entirely absent
- Affects TC-RDV-342, TC-RDV-343, TC-RDV-344, TC-RDV-345, TC-RDV-366 (all BLOCKED)

## Evidence

![BUG-RDV-054 — Alerts page with no on-call schedule widget present anywhere](../../screenshots/BUG-RDV-054/bug-rdv-054-no-on-call-schedule-widget.png)

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —
