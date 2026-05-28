# BUG-RDV-061 — No dedicated "Linked Alerts" section on incident detail page

## Summary

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-RDV-061 |
| **Severity** | High |
| **Suite** | 10 (Incident Management) |
| **Requirement** | INC-001 (rfd-030) |
| **Redmine Version** | 6.0.9 |
| **Environment** | Local Docker (http://localhost:3008) |
| **Found by** | TC-RDV-426 |
| **Status** | Open |

## Description

Incident detail pages have no dedicated **"Linked Alerts"** section. When an alert fires and auto-creates an incident (e.g. incidents #1–5), the alert linkage is only visible as a single timeline entry ("Alert fired — Alert 'X' triggered incident creation"). There is no panel showing the triggering alert's source, severity, and `fired_at` timestamp as a separate structured section.

## Steps to Reproduce

1. Navigate to `http://localhost:3008/projects/phoenix-platform/devops_incidents/1` (auto-created by Prometheus alert "HighCPUUsage on web-01").
2. Observe page content and search for a "Linked Alerts" section.

## Expected Result

- A **"Linked Alerts"** section is visible on the incident detail page.
- Contains a row per linked alert showing: alert title, source (Prometheus), severity (critical), and `fired_at` timestamp.
- Each alert row links to the alert feed entry.

## Actual Result

- No "Linked Alerts" section anywhere on the page.
- DOM search confirms: `body.includes('Linked Alert')` → false.
- Alert info only appears in the Timeline as text: "Alert 'HighCPUUsage on web-01' triggered incident creation".

## Screenshot

![BUG-RDV-061 — Incident detail page with no Linked Alerts section](../../screenshots/TC-RDV-426/tc-rdv-426-fail.png)
