# BUG-RDV-064 — Incidents JSON REST API returns HTTP 406 Not Acceptable

## Summary

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-RDV-064 |
| **Severity** | High |
| **Suite** | 10 (Incident Management) |
| **Requirement** | INC-001 (rfd-030) |
| **Redmine Version** | 6.0.9 |
| **Environment** | Local Docker (http://localhost:3008) |
| **Found by** | TC-RDV-437 |
| **Status** | Open |

## Description

The incidents REST API endpoint returns **HTTP 406 Not Acceptable** when requesting JSON format. The route exists (`/projects/:project_id/devops_incidents.json`) but the controller action does not respond to JSON format, making programmatic access to incident data impossible.

## Steps to Reproduce

1. Authenticate as admin (API key: `aa7237bfcded9fad580ad16198c78769731522ca`).
2. Send GET request:
   ```
   GET http://localhost:3008/projects/phoenix-platform/devops_incidents.json
   X-Redmine-API-Key: aa7237bfcded9fad580ad16198c78769731522ca
   ```
3. Observe HTTP response code.

## Expected Result

- `GET /projects/:project_id/devops_incidents.json` returns HTTP 200.
- Response body is a JSON array of incident objects with fields: `id`, `affected_service`, `severity`, `status`, `started_at`, `acknowledged_by`, `linked_issue_id`.

## Actual Result

- Response: **HTTP 406 Not Acceptable**.
- The controller action for `index` does not include a `respond_to` block for `:json` format.
- Only the HTML format is rendered; JSON format is not implemented.

## Screenshot

![BUG-RDV-064 — Incidents JSON REST API returns HTTP 406 Not Acceptable](../../screenshots/BUG-RDV-064/bug-rdv-064-incidents-json-api-406.png)
