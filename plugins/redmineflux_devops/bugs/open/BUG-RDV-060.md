# BUG-RDV-060 — Incident creation form deviates from INC-001: no standalone Title field; affected_service is sole identifier

## Summary

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-RDV-060 |
| **Severity** | High |
| **Suite** | 10 (Incident Management) |
| **Requirement** | INC-001 (rfd-030) |
| **Redmine Version** | 6.0.9 |
| **Environment** | Local Docker (http://localhost:3008) |
| **Found by** | TC-RDV-421, TC-RDV-425 |
| **Status** | Open |

## Description

The New Incident form (`/projects/phoenix-platform/devops_incidents/new`) does not have a standalone **Title** field as required by INC-001. The `affected_service` field serves as the sole incident identifier/name. When an incident is created, the `affected_service` value is rendered as the h2 page heading (e.g. "Payment API") with no separate "Title" concept.

The incident detail summary panel (`<dl>`) also lacks a dedicated **"Affected Service:"** term/definition label. The value is only shown as the h2 heading, not as a labeled field in the incident detail section.

## Steps to Reproduce

1. Navigate to `http://localhost:3008/projects/phoenix-platform/devops_incidents/new`.
2. Observe the form fields available.

## Expected Result

- Form contains a **Title** field (required, per INC-001) separate from the Affected Service field.
- Incident detail page shows a labeled **"Affected Service:"** row in the summary panel alongside Acknowledged By, Redmine Issue, Post-Mortem, Related Deployment.

## Actual Result

- Form fields: Severity, Status, Affected service, Started at, Linked issue, Root cause, "Create Redmine issue" checkbox — **no Title field**.
- Incident detail summary panel shows: Acknowledged By, Redmine Issue, Post-Mortem, Related Deployment — **no Affected Service label**.
- `affected_service` value is displayed only as the incident's h2 heading.

## Screenshot

![BUG-RDV-060 — New Incident form with no standalone Title field](../../screenshots/TC-RDV-421/tc-rdv-421-fail.png)
