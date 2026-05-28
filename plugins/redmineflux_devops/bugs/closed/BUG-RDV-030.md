# Bug Report

- Bug ID: BUG-RDV-030
- Title: Slack and Microsoft Teams notification channels absent from DevOps notification preferences
- Severity: Medium
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Plugin version: 0.1.0
- Environment: Local Docker (http://localhost:3008)
- Browser: Chromium (Playwright)
- User role: Admin
- Date: 2026-05-25

## Steps to reproduce

1. Navigate to `/my/devops_notifications`.
2. Observe the notification channel columns in the preference table.

## Expected result

- Notification preferences table has columns for: Email, In-app, Slack, Microsoft Teams.
- Users can toggle Slack and Teams notifications on/off per event type (build failed, build recovered, etc.).
- Slack and Teams channels are configured via the plugin's global settings (webhook URLs).

## Actual result

- The notification preferences table has only two columns: Email and In-app.
- Slack and Microsoft Teams channels are completely absent from the UI.
- Users cannot configure Slack or Teams notifications regardless of channel availability.
- The `RedminefluxSlack.speak` and `RedminefluxTeams::TeamsMessage` dispatch methods referenced in the spec are not surfaced in the preferences UI.
- TC-RDV-128 (Slack on build failure) and TC-RDV-131 (Teams on build failure) both FAIL.

## Evidence

- Screenshot path: screenshots/TC-RDV-128/
- Log path: logs/
- Trace/video path: N/A

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A

## Retest

- Date: 2026-05-26
- Environment: Local Docker (http://localhost:3008) — fresh instance
- Result: **FIXED**
- Navigated to `/my/devops_notifications` as admin. Notification preferences table headers now include: Event, Email, In-app, Slack, Teams. Slack and Teams columns are present. Bug no longer reproduces.
