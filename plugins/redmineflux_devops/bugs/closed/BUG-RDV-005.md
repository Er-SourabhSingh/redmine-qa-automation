# Bug Report

- Bug ID: BUG-RDV-005
- Title: Webhook endpoint returns HTTP 400 instead of HTTP 404 for unknown provider
- Redmine version: 6.0.9 (Forge)
- Plugin name: redmineflux_devops
- Plugin version: 0.1.0
- Environment: Forge + Local Docker (http://localhost:3008)
- Browser: Playwright (automated)
- User role: System (webhook POST from external client)
- Severity: Low
- Date: 2026-05-22
- Discovered in TC: TC-RDV-007

## Steps to reproduce

1. Send `POST /devops/webhook/unknownprovider/phoenix-platform` with any JSON body
2. Observe the HTTP response status code and body

## Expected result

- HTTP response: `404 Not Found`
- Response body: `{"error":"provider not found"}` or equivalent
- The URL `/devops/webhook/unknownprovider/...` represents a non-existent resource

## Actual result

- HTTP response: `400 Bad Request`
- Response body: `{"error":"Unsupported provider"}`
- Also confirmed for other unregistered provider names (e.g., `trivy`, `argocd`, `snyk`)

## Root cause

The controller checks `SUPPORTED_PROVIDERS.include?(provider)` and returns `status: :bad_request` (400) when the provider is not found. Semantically, 404 is more appropriate here because the webhook endpoint for an unregistered provider does not exist as a resource. 400 implies the request body or parameters are malformed, which is misleading. This is the same class of HTTP status code semantic issue as BUG-RDV-001.

## Evidence

- Response for `POST /devops/webhook/unknownprovider/phoenix-platform`: HTTP 400 `{"error":"Unsupported provider"}`
- Screenshot path: screenshots/TC-RDV-007/tc-rdv-007-fail.png

## Duplicate check

- Duplicate found: No

## Retest

- Date: 2026-05-23
- Environment: Local Docker (http://localhost:3008)
- Result: **CONFIRMED**
- `POST /devops/webhook/unknown_provider/phoenix-platform` (no signature header) → HTTP 400 `{"error":"Unsupported provider"}`. Note: signature check runs before provider check; omitting signature header bypasses the 401 and hits the provider-not-found path. Screenshot: screenshots/BUG-RDV-005/retest-2026-05-23-confirmed.png

## Retest

- Date: 2026-05-26
- Environment: Local Docker (http://localhost:3008) — fresh instance
- Result: **FIXED**
- `POST /devops/webhook/unknown_provider/phoenix-platform` (no signature) → HTTP 404 `{"error":"provider not found"}`. Response status changed from 400 to 404 (better semantic for a missing route/resource). Bug no longer reproduces.

## Retest

- Date: 2026-05-26
- Environment: Forge (https://flux-foq1fnz3j49.forge.zehntech.com) — new instance
- Result: **FIXED**
- `POST /devops/webhook/unknownprovider999/agileboard` → HTTP 404 `{"error":"provider not found"}`. Correct 404 returned on new Forge. Bug does not reproduce.
