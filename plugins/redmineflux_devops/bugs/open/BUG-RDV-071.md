# BUG-RDV-071 — Incidents empty state shows blank area with no informative message

## Summary

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-RDV-071 |
| **Severity** | Low |
| **Suite** | 10 (Incident Management) |
| **Requirement** | INC-001 (rfd-030) |
| **Redmine Version** | 6.0.9 |
| **Environment** | Local Docker (http://localhost:3008) |
| **Found by** | TC-RDV-454 |
| **Status** | Open |

## Description

When no incidents exist for a project, the incidents list page (`/projects/:project_id/devops_incidents`) displays a blank content area with no empty-state message. A user visiting the page for a project with no incidents has no indication of whether the feature is configured, whether they have the correct permissions, or how to create their first incident.

## Steps to Reproduce

1. Create a new project or use a project with no incidents.
2. Navigate to `/projects/<project-id>/devops_incidents`.
3. Observe the page content area where incidents would be listed.

## Expected Result

- An informative empty-state message is shown, e.g. "No incidents found. Create the first incident to get started."
- Optionally, a "New Incident" button/link is displayed within the empty state area.

## Actual Result

- The page renders with an empty content area (blank table body or empty container).
- No message, icon, or call-to-action is shown.
- Users with no incidents cannot easily distinguish a "no data" state from a page load failure.

## Screenshot

![BUG-RDV-071 — Incidents empty state shows blank content area with no message](../../screenshots/TC-RDV-454/tc-rdv-454-fail.png)
