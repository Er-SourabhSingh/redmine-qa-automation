# Bug Report

- Bug ID: BUG-RDV-057
- Title: SSRF guard not implemented — private and metadata URLs accepted in sonarqube_host_url field
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Severity: High
- Date: 2026-05-28 | Retest: 2026-05-29 — STILL OPEN (status 200, URL accepted)

## Steps to reproduce

1. Navigate to `Project > DevOps > Settings`.
2. Enter SSRF test URL: `http://169.254.169.254/latest/meta-data/` in the SonarQube Server URL field.
3. Click Save.

## Expected result

URL rejected with HTTP 422 and validation error "URL must not be a private, loopback, or cloud metadata address".

## Actual result

SSRF URL accepted and saved. Server returns HTTP 200. No SSRF guard validation applied. Retest 2026-05-29: POST settings → HTTP 200 (**STILL OPEN**).

## Evidence

![BUG-RDV-057 — SSRF guard absent: private IP accepted](../../screenshots/TC-RDV-411/tc-rdv-411-fail.png)

## Duplicate check

- Duplicate found: No
