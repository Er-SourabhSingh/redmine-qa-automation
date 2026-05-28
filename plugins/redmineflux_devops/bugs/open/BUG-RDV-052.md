# Bug Report

- Bug ID: BUG-RDV-052
- Title: Auto-created incidents use "Bug" tracker instead of "Incident" tracker
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Plugin version: (local)
- Environment: Local Docker (http://localhost:3008)
- Browser: Chromium (Playwright)
- User role: Admin
- Date: 2026-05-28
- Severity: High

## Steps to reproduce

1. Send a critical-severity Prometheus AlertManager webhook to `POST /devops/webhook/prometheus/phoenix-platform` with `severity: critical` and `X-DevOps-Token: MonitorToken123`
2. Navigate to `/projects/phoenix-platform/devops_incidents`
3. Note the auto-created incident row — click the linked Redmine issue number
4. Inspect the Tracker and Priority fields on the issue page

## Expected result

- Per rfd-027 and TC-RDV-337: auto-created incident should use tracker = "Incident"
- Issue priority should be "Urgent"
- The "Incident" tracker (ID 3) exists in the Redmine instance

## Actual result

- Auto-created issue uses tracker = "Bug" (ID 4), NOT "Incident" (ID 3)
- Priority IS correctly set to "Urgent"
- Subject format is correct: "[Incident] HighCPUUsage on web-01"
- Description content is correct: source, severity, fired_at, annotation text
- The `AlertIncidentCreator` service hard-codes the "Bug" tracker or defaults to it; it does not look up the "Incident" tracker by name
- Confirmed on issues #34, #35, #37, #38 — all use tracker "Bug"
- Affects TC-RDV-337, TC-RDV-370

## Evidence

![BUG-RDV-052 — Issues list filtered to Bug tracker showing [Incident] auto-created issues](../../screenshots/BUG-RDV-052/bug-rdv-052-incident-issues-use-bug-tracker.png)

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —
