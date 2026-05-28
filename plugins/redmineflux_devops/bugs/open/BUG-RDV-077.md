# BUG-RDV-077 — REST API type filter for environments (by_type scope) not exposed

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-RDV-077 |
| **Severity** | Low |
| **Status** | Open |
| **Redmine Version** | 6.0.9 (Local Docker) |
| **Plugin** | redmineflux_devops |
| **Found in TC** | TC-RDV-494 |
| **Date** | 2026-05-28 |

## Title
REST API endpoints for filtering environments by type (`by_type` and `production` named scopes per rfd-032) return 404 — route not implemented.

## Steps to Reproduce
1. `GET /projects/phoenix-platform/devops/environments.json?type=production`
   with `X-Redmine-API-Key: <admin key>`
2. `GET /projects/phoenix-platform/devops/environments.json?type=dev`

## Expected Result
- `type=production` returns only production-flagged environments (e.g., `production`, `prod-eu`).
- `type=dev` returns only dev environments.
- `non_production` scope returns all non-production environments.

## Actual Result
- Both requests return HTTP 404: `Page not found`.
- The route `/devops/environments.json` does not exist.
- The existing route `/devops_environments.json` returns all environments with no type filtering support.

## User Role
Admin

## Screenshot
![BUG-RDV-077 — GET /devops/environments.json?type=production returns 404 route not found](../../screenshots/BUG-RDV-077/bug-rdv-077-api-type-filter-404.png)

## Notes
This is also related to BUG-RDV-072 (no environment_type field). Without a `type` attribute on environments, the by_type scope cannot filter correctly even if the route is added.
