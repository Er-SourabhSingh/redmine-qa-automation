# Bug Report

- Bug ID: BUG-RDV-056
- Title: FOSSA license ingestion stores all licenses as "NOASSERTION" / "unknown" risk regardless of payload
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Severity: High
- Date: 2026-05-28 | Retest: 2026-05-29 — STILL OPEN (webhook 404, NOASSERTION still present)

## Steps to reproduce

1. POST to `/projects/phoenix-platform/devops/fossa_webhook` with payload `{"dependencies":[{"name":"lodash","version":"4.17.21","license":"MIT"}]}`.
2. Check `/projects/phoenix-platform/devops_licenses`.

## Expected result

License name "MIT" stored correctly. Risk level = "Low".

## Actual result

Retest 2026-05-29: FOSSA webhook endpoint returns HTTP 404. Existing license records still show `license_name = "NOASSERTION"` and `risk_level = "unknown"`. LicenseRiskMapper not fixed. Feature remains non-functional.

## Evidence

![BUG-RDV-056 — FOSSA licenses showing NOASSERTION](../../screenshots/TC-RDV-395/tc-rdv-395-fail.png)

## Duplicate check

- Duplicate found: No
