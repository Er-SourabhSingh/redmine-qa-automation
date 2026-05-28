# BUG-RDV-063 — Incident Timeline REST API returns 404 for all URL patterns

## Summary

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-RDV-063 |
| **Severity** | High |
| **Suite** | 10 (Incident Management) |
| **Requirement** | INC-002 (rfd-031) |
| **Redmine Version** | 6.0.9 |
| **Environment** | Local Docker (http://localhost:3008) |
| **Found by** | TC-RDV-430, TC-RDV-456 |
| **Status** | Open |

## Description

All REST API URL patterns for fetching incident timeline entries return HTTP 404. The timeline REST endpoint is not routed/implemented. Tested patterns include both project-scoped and global paths.

## Steps to Reproduce

1. Authenticate as admin (API key: `aa7237bfcded9fad580ad16198c78769731522ca`).
2. Send GET request to:
   - `http://localhost:3008/projects/phoenix-platform/devops_incidents/1/timeline.json`
   - `http://localhost:3008/devops_incidents/1/timeline.json`
   - `http://localhost:3008/projects/phoenix-platform/devops_incidents/1/entries.json`
3. Observe HTTP response code.

## Expected Result

- A `GET /projects/:project_id/devops_incidents/:id/timeline.json` endpoint exists and returns HTTP 200.
- Response body is JSON array of timeline entry objects, each with: `id`, `event_type`, `message`, `created_at`, `user` (id + name).

## Actual Result

- All tested URL patterns return **HTTP 404 Not Found**.
- Route is not defined in the plugin's routing configuration.
- Timeline data is only visible via the UI page render (not via REST).

## Screenshot

![BUG-RDV-063 — Incident timeline REST API returns 404 for all URL patterns](../../screenshots/BUG-RDV-063/bug-rdv-063-timeline-api-404.png)
