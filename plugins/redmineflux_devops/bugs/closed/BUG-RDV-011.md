# Bug Report

- Bug ID: BUG-RDV-011
- Title: Webhook event log accessible to users with only view_devops — manage_devops_settings not enforced
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Severity: High
- Date: 2026-05-22 | Retest: 2026-05-29 — STILL OPEN (returns 406 via API key, still accessible)

## Steps to reproduce

1. Authenticate as dev_user (Developer role, API key: 2309f6ea9f3335476ebc78cf241cc27c8da0e12e).
2. Send `GET /projects/phoenix-platform/devops_webhooks`.
3. Observe HTTP response.

## Expected result

HTTP 403 Forbidden — webhook event log requires `manage_devops_settings` permission.

## Actual result

Returns HTTP 406 (wrong accept format via API) but page is accessible via browser for users with only `view_devops`. The `manage_devops_settings` permission check is absent from the webhooks controller.

## Evidence

![BUG-RDV-011 — Webhook log accessible without manage_devops_settings](../../screenshots/BUG-RDV-011/bug-rdv-011-webhook-log-access.png)

## Duplicate check

- Duplicate found: No
