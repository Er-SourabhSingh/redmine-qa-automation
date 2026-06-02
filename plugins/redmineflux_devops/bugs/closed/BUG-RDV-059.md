# Bug Report

- Bug ID: BUG-RDV-059
- Title: Developer role can access Security Vulnerabilities page — view_security_scans permission not enforced
- Redmine version: 6.0.9 (Local Docker)
- Plugin name: redmineflux_devops
- Plugin version: current
- Environment: Local Docker (http://localhost:3008)
- Browser: Playwright (headless)
- User role: Developer (dev_user, ID 5)
- Date: 2026-05-28

## Steps to reproduce

1. Use dev_user's API key (`2309f6ea9f3335476ebc78cf241cc27c8da0e12e`) to send a GET request to `/projects/phoenix-platform/devops_vulnerabilities`
2. Observe the HTTP response status
3. Confirm dev_user has only the Developer role in the phoenix-platform project (no `view_security_scans` permission)

## Expected result

- HTTP 403 Forbidden (or redirect to access-denied page) for the Developer role
- The "Security" tab should not appear in the DevOps sub-navigation for Developers
- Only users with `view_security_scans` permission (DevOps Engineer, Manager, Admin) can access the page

## Actual result

- HTTP 200 is returned for dev_user (Developer role) on `/projects/phoenix-platform/devops_vulnerabilities`
- The Security Vulnerabilities page loads successfully for the Developer role
- `view_security_scans` permission is not checked by the controller action
- Developers can view all vulnerability scan results and security compliance data

## Evidence

![BUG-RDV-059 — Developer role can access Security Vulnerabilities page (should return 403)](../../screenshots/TC-RDV-416/tc-rdv-416-pass.png)
- Log path: —

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): — (BUG-RDV-050 covers the same class of issue on devops_metrics; this is a separate endpoint)
