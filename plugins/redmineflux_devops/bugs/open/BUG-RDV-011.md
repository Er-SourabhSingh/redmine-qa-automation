# BUG-RDV-011

- Bug ID: BUG-RDV-011
- Title: Webhook event log accessible to users with only view_devops — manage_devops_settings not enforced
- Redmine version: 6.0.9 (Forge)
- Plugin name: redmineflux_devops
- Plugin version: 0.1.0
- Environment: Forge — https://flux-fhcnclfvk49.forge.zehntech.com/
- Browser: Playwright (headless)
- User role: Developer (daisy.skye — has view_devops, does NOT have manage_devops_settings)
- Severity: High
- Date: 2026-05-22

## Steps to reproduce

1. Ensure `daisy.skye` has the `Developer` role on project `phoenix-platform`.
2. Ensure `Developer` role has `view_devops` permission but NOT `manage_devops_settings`.
3. Log in as `daisy.skye`.
4. Navigate to `/projects/phoenix-platform/devops_webhooks`.
5. Observe the HTTP response and page content.

## Expected result

- HTTP 403 Forbidden. The webhook event log should only be accessible to users with `manage_devops_settings` permission (or Admin).
- The "View Webhook Event Log" link should not appear in the DevOps navigation for `daisy.skye`.

## Actual result

- HTTP 200. The webhook event log page loads fully and displays all webhook events (provider, event type, status, timestamp) for the project.
- `daisy.skye` can view the full webhook event log including payload metadata.
- The page is accessible despite the user not having `manage_devops_settings`.

## Evidence

- Screenshot path: screenshots/TC-RDV-040/
- Confirmed: `daisy.skye` is Developer role (ID 7) with view_devops only. manage_devops_settings was never granted.

## Duplicate check

- Duplicate found: No

## Notes

- The webhook event log controller likely checks `view_devops` instead of `manage_devops_settings` before rendering the page.
- Requirements define webhook log access as requiring `manage_devops_settings`. Only Admins and DevOps Engineers (who have `manage_devops_settings`) should see the webhook log.
- This exposes internal webhook payload metadata to lower-privileged users.

## Retest

- Date: 2026-05-23
- Environment: Local Docker (http://localhost:3008)
- Result: **CONFIRMED**
- Logged in as `dev_user` (Developer role, has view_devops, does NOT have manage_devops_settings). Navigated to `/projects/phoenix-platform/devops_webhooks` → HTTP 200, full webhook event log displayed. Confirmed in TC-RDV-040 execution. Screenshot: screenshots/TC-RDV-040/
