# Bug Report

- Bug ID: BUG-RDV-026
- Title: JUnit ingestion endpoint returns 422 — missing rexml XML parser gem dependency
- Severity: High
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Plugin version: 0.1.0
- Environment: Local Docker (http://localhost:3008)
- Browser: Chromium (Playwright)
- User role: Admin (API key)
- Date: 2026-05-25

## Steps to reproduce

1. POST a valid JUnit XML payload to `/devops/builds/3/test_results` with header `X-Redmine-API-Key: <admin-key>` and `Content-Type: application/xml`.
2. Payload:
   ```xml
   <testsuite name="UserAuthTests" tests="3" failures="1">
     <testcase name="login_success" classname="UserAuthSpec" time="0.032"/>
     <testcase name="login_invalid_password" classname="UserAuthSpec" time="0.045">
       <failure message="Expected 401, got 200"/>
     </testcase>
     <testcase name="logout_success" classname="UserAuthSpec" time="0.011"/>
   </testsuite>
   ```
3. Observe the HTTP response status and body.

## Expected result

- HTTP 201 Created.
- Response body: `{"total": 3, "passed": 2, "failed": 1, "skipped": 0}`.
- Test results stored and visible on the build detail page.

## Actual result

- HTTP 422 Unprocessable Entity.
- Response body: `{"error":"XML parser dependency missing: cannot load such file -- rexml/document","code":"parse_error"}`.
- The plugin attempts to `require 'rexml/document'` but the `rexml` gem is not bundled as a plugin dependency.
- JUnit ingestion is completely broken — no test results can be ingested.
- Downstream features (flaky test detection, TC-RDV-120, TC-RDV-121) are also blocked.

## Evidence

- Screenshot path: screenshots/TC-RDV-122/
- Log path: logs/
- Trace/video path: N/A

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A

## Retest

- Date: 2026-05-26
- Environment: Local Docker (http://localhost:3008) — fresh instance
- Result: **CONFIRMED**
- `POST /devops/builds/1/test_results` with JUnit XML payload → HTTP 422 `{"error":"XML parser dependency missing: cannot load such file -- rexml/document","code":"parse_error"}`. `rexml` gem still not bundled. JUnit ingestion still broken. Bug persists.

## Retest — Forge flux-fujhcd9zj49 (2026-05-26)

- Date: 2026-05-26
- Environment: Forge (https://flux-fujhcd9zj49.forge.zehntech.com) — new instance
- Result: **CONFIRMED**
- `POST /devops/builds/346/test_results` with JUnit XML payload → HTTP 422 `{"error":"XML parser dependency missing: cannot load such file -- rexml/document","code":"parse_error"}`. `rexml` gem still not bundled on Forge. JUnit ingestion broken. Bug persists.
