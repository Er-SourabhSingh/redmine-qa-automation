# Bug Report

- Bug ID: BUG-RDV-083
- Title: Empty state messages absent on Builds, Alerts, and Deployments tabs
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Severity: Medium
- Date: 2026-05-29 | Retest: 2026-05-29 — STILL OPEN (alerts tab blank; builds/deployments show filters only)

## Steps to reproduce

1. Create a new project with DevOps module enabled but no data (use test-project-tc561).
2. Navigate to Project → DevOps → Builds.
3. Observe the content area.
4. Repeat for Alerts and Deployments tabs.

## Expected result

Descriptive empty state messages on each tab: "No builds recorded yet.", "No alerts received.", "No deployments recorded yet."

## Actual result

Retest 2026-05-29:
- **Builds**: Shows filter controls only (Period/From/To/Branch/Status) — no "No builds" message
- **Alerts**: Completely blank content area — no message, no filters
- **Deployments**: Shows filter controls only — no "No deployments" message
- Security tab shows "0 critical / 0 high..." zero counts (partial fix)

Note: **Incidents empty state is now FIXED** (moved to closed) — this bug now covers Builds, Alerts, and Deployments only.

## Evidence

![BUG-RDV-083 — Empty Alerts tab: blank content area](../../screenshots/BUG-RDV-083/bug-rdv-083-empty-alerts.png)

![BUG-RDV-083 — Empty Builds tab: filter controls but no message](../../screenshots/BUG-RDV-083/bug-rdv-083-empty-builds.png)

## Duplicate check

- Duplicate found: No
- Related: BUG-RDV-071 (FIXED — incidents empty state)
