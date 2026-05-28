# Bug Report

- Bug ID: BUG-RDV-056
- Title: FOSSA license ingestion stores all licenses as "NOASSERTION" / "unknown" risk regardless of payload
- Redmine version: 6.0.9 (Local Docker)
- Plugin name: redmineflux_devops
- Plugin version: current
- Environment: Local Docker (http://localhost:3008)
- Browser: Playwright (headless)
- User role: Admin
- Date: 2026-05-28

## Steps to reproduce

1. Configure FOSSA webhook secret on the project DevOps settings page
2. Send a POST request to `POST /projects/phoenix-platform/devops/fossa_webhook` with a valid HMAC-SHA256 signature
3. Use payload format A: `{"dependencies": [{"name": "lodash", "version": "4.17.21", "license": "MIT", ...}]}`
4. Check the license record created in `redmineflux_devops_dependency_licenses` (via `/projects/phoenix-platform/devops_licenses`)
5. Repeat with payload format B using `packages[].licenses[].spdxId` format with "GPL-3.0"
6. Check the license records

## Expected result

- License name extracted correctly from payload (e.g., "MIT", "GPL-3.0")
- Risk level mapped based on license: GPL-3.0 → High, LGPL-2.1 → Medium, MIT/Apache/BSD → Low
- Records show correct license names and risk ratings

## Actual result

- All license records stored with `license_name = "NOASSERTION"` regardless of payload content
- All records show `risk_level = "unknown"`
- `LicenseRiskMapper` fails to extract the SPDX identifier from either payload format (`dependencies[].license` or `packages[].licenses[].spdxId`)
- Risk-level filters (High/Medium/Low) all return zero results

## Evidence

![BUG-RDV-056 — FOSSA licenses all stored as NOASSERTION/unknown risk](../../screenshots/TC-RDV-395/tc-rdv-395-fail.png)

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —
