# Bug Report

- Bug ID: BUG-RDV-051
- Title: Dashboard shared flag update returns HTTP 200 instead of HTTP 403 when user lacks manage_devops_settings
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Plugin version: (local)
- Environment: Local Docker (http://localhost:3008)
- Browser: Chromium (Playwright)
- User role: Developer (dev_user)
- Date: 2026-05-28
- Severity: Medium

## Steps to reproduce

1. Log in as `dev_user` (Developer role — no `manage_devops_settings` permission)
2. Create a new dashboard at `/projects/phoenix-platform/devops/dashboards/new` (created as ID 2)
3. Send a direct PATCH request to `/projects/phoenix-platform/devops/dashboards/2` with `redmineflux_devops_dashboard[shared]=1` and a valid CSRF token

## Expected result

- Per rfd-120: "shared flag allows a dashboard to be visible to all project members (requires `:manage_devops_settings`)"
- The server should return HTTP 403 Forbidden when an unauthorized user attempts to set `shared: true`
- The dashboard's shared flag should remain `false` in the database

## Actual result

- The PATCH request returns HTTP 200 (not 403)
- The shared flag is silently ignored and NOT saved (flag remains false in the database — data protection is correct)
- The edit form for dev_user does not show the shared checkbox — this part is correct
- However, a direct PATCH bypass should be rejected with HTTP 403, not silently succeeded with HTTP 200
- Affects TC-RDV-316

## Evidence

![BUG-RDV-051 — Dashboards page (PATCH shared flag returns 200 for unpermissioned user)](../../screenshots/BUG-RDV-051/bug-rdv-051-dashboard-shared-flag-200-not-403.png)

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —
