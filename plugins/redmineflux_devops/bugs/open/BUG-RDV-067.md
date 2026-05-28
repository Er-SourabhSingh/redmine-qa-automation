# BUG-RDV-067 — Deployment correlation override creates no timeline or audit entry

## Summary

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-RDV-067 |
| **Severity** | Medium |
| **Suite** | 10 (Incident Management) |
| **Requirement** | INC-003 (rfd-094) |
| **Redmine Version** | 6.0.9 |
| **Environment** | Local Docker (http://localhost:3008) |
| **Found by** | TC-RDV-433 |
| **Status** | Open |

## Description

When a user manually overrides the deployment correlation on an incident detail page (using the "Save Correlation" button in the "Related Deployment" field), no timeline entry or audit log entry is created. The override is saved to the database, but there is no record in the incident timeline showing who made the change, when, or what value was set. This makes it impossible to audit deployment-incident correlation changes.

## Steps to Reproduce

1. Navigate to `http://localhost:3008/projects/phoenix-platform/devops_incidents/6`.
2. In the incident detail panel, locate the "Related Deployment" field.
3. Enter a deployment ID or select a deployment and click "Save Correlation".
4. After the page reloads/updates, check the incident timeline.

## Expected Result

- A timeline entry is created: "Deployment correlation updated — Deployment #X linked by [user] at [timestamp]".
- The entry is visible in the incident timeline immediately after saving.

## Actual Result

- The Related Deployment field updates with the selected value.
- No timeline entry is created for the deployment correlation change.
- No audit log entry exists for the override action.

## Screenshot

![BUG-RDV-067 — Deployment correlation saved with no timeline or audit entry created](../../screenshots/TC-RDV-433/tc-rdv-433-fail.png)
