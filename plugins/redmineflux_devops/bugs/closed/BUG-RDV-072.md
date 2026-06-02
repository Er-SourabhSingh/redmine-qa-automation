# BUG-RDV-072 — Environment form missing `environment_type` field (dev/staging/prod/custom)

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-RDV-072 |
| **Severity** | High |
| **Status** | Open |
| **Redmine Version** | 6.0.9 (Local Docker) |
| **Plugin** | redmineflux_devops |
| **Found in TC** | TC-RDV-461, TC-RDV-464, TC-RDV-465 |
| **Date** | 2026-05-28 |

## Title
Environment creation and edit form is missing the `environment_type` dropdown (dev / staging / prod / custom) required by rfd-032.

## Steps to Reproduce
1. Navigate to Project → DevOps → Environments.
2. Click "Add Environment".
3. Observe the form fields.

## Expected Result
- Form contains an `environment_type` dropdown with options: `dev`, `staging`, `prod`, `custom`.
- Selecting "prod" auto-assigns `is_production = true`.
- The environments list is sorted by type in the order: prod → staging → dev → custom.

## Actual Result
- No `environment_type` dropdown exists on the Add or Edit Environment form.
- Only a boolean `is_production` checkbox is available.
- The list is not ordered by environment type.
- Environments cannot be categorised as dev / staging / custom.

## User Role
Admin

## Screenshot
![BUG-RDV-072 — Add Environment form with no Type dropdown](../../screenshots/BUG-RDV-072/bug-rdv-072-no-type-dropdown.png)
