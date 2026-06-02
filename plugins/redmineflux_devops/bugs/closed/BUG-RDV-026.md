# Bug Report

- Bug ID: BUG-RDV-026
- Title: JUnit test results ingestion endpoint broken — returns 404 (was 422 with rexml error)
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Severity: High
- Date: 2026-05-25 | Retest: 2026-05-29 — STILL OPEN (now returns 404)

## Steps to reproduce

1. Authenticate with admin API key.
2. POST valid JUnit XML to `/projects/phoenix-platform/devops/builds/1/test_results` with `Content-Type: application/xml`.
3. Observe response.

## Expected result

HTTP 202 Accepted — JUnit results ingested, test cases stored in `redmineflux_devops_test_results`.

## Actual result

**Original (2026-05-25):** HTTP 422 with error `{"error":"XML parser dependency missing: cannot load such file -- rexml/document","code":"parse_error"}` — `rexml` gem not in Gemfile.

**Retest (2026-05-29):** HTTP 404 — route appears to have been removed or path changed. The endpoint `/devops/builds/:id/test_results` no longer routes. JUnit ingestion still entirely non-functional.

## Evidence

![BUG-RDV-026 — JUnit ingestion endpoint broken](../../screenshots/BUG-RDV-026/bug-rdv-026-junit-404.png)

## Affected test cases

- All 27 Suite 06 JUnit-dependent TCs blocked.

## Duplicate check

- Duplicate found: No
