# BUG-RDV-074 — No Admin override mechanism for deployment freeze windows

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-RDV-074 |
| **Severity** | High |
| **Status** | Open |
| **Redmine Version** | 6.0.9 (Local Docker) |
| **Plugin** | redmineflux_devops |
| **Found in TC** | TC-RDV-475 |
| **Date** | 2026-05-28 |

## Title
Admin has no "Override Freeze" option — active deployment freeze blocks Admin unconditionally with no override path.

## Steps to Reproduce
1. Create an active deployment freeze for an environment (starts in past, ends in future).
2. Log in as Admin.
3. Navigate to Project → DevOps → Environments.
4. Click the "Deploy" button for the frozen environment (button is disabled by the freeze).
5. Observe whether an "Override Freeze" option is presented to Admin.

## Expected Result
- Admin sees a freeze-active warning in the deploy modal with an "Override Freeze" option.
- Admin can enter a mandatory override reason.
- On confirming, deployment proceeds and the override is recorded in the audit log with: actor, action = `freeze_override`, reason, timestamp, target environment.

## Actual Result
- The Deploy button is disabled (correct behavior for non-Admin users).
- No override option is presented to Admin in the deploy modal.
- The modal shows only "Version / Branch" and "Notes" fields with no mention of the freeze.
- Forcing a submit via API returns HTTP 423: `{"error":"Deployment blocked by freeze: <reason>"}` — no override path available.
- No freeze_override audit log entry is ever created.

## User Role
Admin

## Screenshot
![BUG-RDV-074 — Deploy modal showing no Override Freeze option for Admin](../../screenshots/BUG-RDV-074/bug-rdv-074-deploy-modal-no-override-option.png)
