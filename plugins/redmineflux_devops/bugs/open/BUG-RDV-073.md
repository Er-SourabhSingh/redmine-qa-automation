# BUG-RDV-073 — No "Check Now" button for manual environment health status trigger

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-RDV-073 |
| **Severity** | High |
| **Status** | Open |
| **Redmine Version** | 6.0.9 (Local Docker) |
| **Plugin** | redmineflux_devops |
| **Found in TC** | TC-RDV-466, TC-RDV-467, TC-RDV-468, TC-RDV-469, TC-RDV-470, TC-RDV-471 |
| **Date** | 2026-05-28 |

## Title
No "Check Now" button on the Environments page — manual health status trigger not implemented (rfd-033).

## Steps to Reproduce
1. Navigate to Project → DevOps → Environments.
2. Look for a "Check Now" button on each environment card.
3. Also test routes: `POST /projects/{proj}/devops_environments/{id}/check_health` and `/health_check`.

## Expected Result
- Each environment card has a "Check Now" button.
- Clicking it triggers an AJAX health check without page reload.
- Status light updates in place; spinner appears on button during check.
- Routes `/check_health` and `/health_check` return meaningful responses.

## Actual Result
- No "Check Now" button exists on any environment card.
- Health status is background-only (lazy polling on page load).
- `POST .../check_health` and `.../health_check` return HTTP 404.
- Users cannot manually trigger a health check.

## User Role
Admin

## Screenshot
![BUG-RDV-073 — Environments list with no Check Now button on any card](../../screenshots/BUG-RDV-073/bug-rdv-073-no-check-now-button.png)
