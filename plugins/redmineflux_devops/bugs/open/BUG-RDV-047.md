# Bug Report

- Bug ID: BUG-RDV-047
- Title: Test duration monitoring REST endpoint returns 404 — route not implemented
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Plugin version: current (local Docker 2026-05-28)
- Environment: Local Docker (http://localhost:3008)
- Browser: Chromium (Playwright)
- User role: Admin
- Date: 2026-05-28

## Steps to reproduce

1. Authenticate with a valid admin API key (`X-Redmine-API-Key` header)
2. Send `GET /projects/phoenix-platform/devops/test_duration_stats.json`
3. Observe the HTTP response

## Expected result

- HTTP 200 response
- JSON body containing suite duration trend data (array of build durations) and slowest-N test list
- Endpoint suitable for programmatic access (per rfd-114)

## Actual result

- HTTP 404 "Page not found" returned for both authenticated and unauthenticated requests
- All alternate URL patterns also return 404:
  - `/projects/phoenix-platform/devops/test_duration.json`
  - `/projects/phoenix-platform/devops_test_duration_stats.json`
  - `/devops/test_duration_stats.json`
  - `/projects/phoenix-platform/devops/builds/test_duration_stats.json`
- The route is entirely absent from the plugin routing table

## Evidence

![BUG-RDV-047 — Test duration stats endpoint returns 404](../../screenshots/BUG-RDV-047/bug-rdv-047-test-duration-stats-404.png)
- Log path: —
- Trace/video path: —

## Affected test cases

- TC-RDV-273 (BLOCKED) — TestDurationStats suite duration trend and slowest-N tests
- TC-RDV-274 (BLOCKED) — Test suites 50% slower than baseline highlighted
- TC-RDV-275 (FAIL) — Test duration monitoring REST endpoint returns programmatic data
- TC-RDV-285 (FAIL) — Test duration REST endpoint requires authentication

## Duplicate check

- Duplicate found: No
- Existing bug reference: None (BUG-RDV-009 covers DORA metrics 404; this is a separate unimplemented feature — Test Duration Monitoring, rfd-114)
