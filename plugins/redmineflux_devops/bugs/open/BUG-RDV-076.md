# BUG-RDV-076 — Environment comparison returns 302 redirect for non-existent environment ID instead of 404

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-RDV-076 |
| **Severity** | Medium |
| **Status** | Open |
| **Redmine Version** | 6.0.9 (Local Docker) |
| **Plugin** | redmineflux_devops |
| **Found in TC** | TC-RDV-487 |
| **Date** | 2026-05-28 |

## Title
Compare endpoint returns HTTP 302 (redirect) instead of HTTP 404 when given a non-existent or cross-project environment ID.

## Steps to Reproduce
1. Navigate to (as authenticated user with project access):
   `GET /projects/phoenix-platform/devops_environments/compare?a=1&b=999`
   (where environment ID 999 does not exist or belongs to another project)

## Expected Result
- HTTP 404 response is returned.
- No environment data is exposed.
- No server error (500) occurs.

## Actual Result
- HTTP 302 redirect is returned (redirect to the comparison page or another URL).
- The compare endpoint does not validate that both environment IDs exist and belong to the current project before processing.

## User Role
Admin

## Screenshot
![BUG-RDV-076 — Compare endpoint with non-existent env ID (retest shows 404 — original test observed 302)](../../screenshots/BUG-RDV-076/bug-rdv-076-retest-returns-404.png)

> **Retest note (2026-05-28):** On screenshot capture pass, `compare?a=1&b=999` now returns 404 directly. Original test observation of 302 may need re-investigation with exact original parameters.
