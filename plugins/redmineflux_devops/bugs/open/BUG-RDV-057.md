# Bug Report

- Bug ID: BUG-RDV-057
- Title: SSRF guard not implemented — private and metadata URLs accepted in sonarqube_host_url field
- Redmine version: 6.0.9 (Local Docker)
- Plugin name: redmineflux_devops
- Plugin version: current
- Environment: Local Docker (http://localhost:3008)
- Browser: Playwright (headless)
- User role: Admin
- Date: 2026-05-28

## Steps to reproduce

1. Navigate to `Project > DevOps > Settings`
2. In the "SonarQube Server URL" field, enter an SSRF test URL: `http://169.254.169.254/latest/meta-data/`
3. Click Save
4. Reload the settings page and inspect the field value

## Expected result

- The URL is rejected with a validation error: "URL must not be a private, loopback, or cloud metadata address"
- The field value is not saved
- The server returns an appropriate validation error (HTTP 422), not HTTP 200

## Actual result

- The SSRF URL `http://169.254.169.254/latest/meta-data/` is accepted and saved without any error
- The settings page reloads with success state
- The field value persists as the saved value on reload
- No SSRF guard validation is applied to the `sonarqube_host_url` field

## Evidence

![BUG-RDV-057 — SSRF guard absent: private IP accepted in sonarqube_host_url](../../screenshots/TC-RDV-411/tc-rdv-411-fail.png)

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —
