# BUG-RDV-078 — Notification matrix missing 7 required DevOps event types

## Summary

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-RDV-078 |
| **Severity** | Medium |
| **Suite** | 12 (System Settings & Notifications) |
| **Requirement** | SYS-006 (rfd-101) |
| **Redmine Version** | 6.0.9 |
| **Environment** | Local Docker (http://localhost:3008) |
| **Found by** | TC-RDV-501 |
| **Status** | Open |

## Description

The DevOps notification preferences matrix at `/my/devops_notifications` only renders 7 event type rows. The requirement (rfd-101) specifies a minimum of 10 DevOps event types covering the full plugin scope. Seven event types covering deployments, incidents, releases, alerts, and security are entirely absent from the matrix.

## Steps to Reproduce

1. Log in as any user.
2. Navigate to `http://localhost:3008/my/devops_notifications`.
3. Count and list the event type rows in the notification matrix.

## Expected Result

- Matrix contains at minimum 10 event type rows including:
  - `build_failure` / Build failed
  - `build_recovered` / Build recovered
  - `deployment_success` / Deployment succeeded
  - `deployment_failed` / Deployment failed
  - `incident_created` / Incident created
  - `incident_escalated` / Incident escalated
  - `incident_resolved` / Incident resolved
  - `release_published` / Release published
  - `alert_fired` / Alert fired
  - `security_gate_blocked` / Security gate blocked
- All rows have human-readable labels and checkboxes for Email, Slack, Teams (and In-app).

## Actual Result

- Only **7 event type rows** are present:
  1. Code review requested
  2. Daily code review digest
  3. Incident escalation
  4. Build failed
  5. Build recovered
  6. Build succeeded
  7. Pull request merged
- **Missing (7 types):** deployment_success, deployment_failed, incident_created, incident_resolved, release_published, alert_fired, security_gate_blocked.
- Users cannot configure notifications for deployments, alert firing, new incident creation, incident resolution, release publishing, or security gate events.

## Screenshot

![BUG-RDV-078 — Notification matrix showing only 7 event types (7 required types missing)](../../screenshots/BUG-RDV-078/bug-rdv-078-notification-matrix-missing-event-types.png)
