# Bug Report

- Bug ID: BUG-RDV-001
- Title: Webhook signature rejection returns 401 instead of 403
- Redmine version: 6.0.9 (Forge)
- Plugin name: redmineflux_devops
- Plugin version: 0.1.0
- Environment: Forge — https://flux-frjrhm25q49.forge.zehntech.com/
- Browser: Playwright (automated)
- User role: System (webhook POST from external client)
- Severity: Low
- Date: 2026-05-22
- Discovered in TC: TC-RDV-002

## Steps to reproduce

1. Configure GitHub repository on project `phoenix-platform` with webhook secret `RedmineQA2026!`
2. Send `POST /devops/webhook/github/phoenix-platform` with:
   - Header `X-Hub-Signature-256: sha256=0000000000000000000000000000000000000000000000000000000000000000` (deliberately wrong)
   - Header `X-GitHub-Event: push`
   - Header `Content-Type: application/json`
   - Body: any valid GitHub push event JSON
3. Observe the HTTP response status code

## Expected result

- HTTP response status: `403 Forbidden`
- Response body: `{"error":"signature_invalid"}` or equivalent message indicating the signature was rejected

## Actual result

- HTTP response status: `401 Unauthorized`
- Response body: `{"error":"Invalid signature"}`
- Functional behavior is correct — the request is rejected and no data is stored — but the HTTP status code is semantically incorrect. `401` implies authentication failure (missing/invalid credentials), whereas `403` implies the server understood the request but refused it due to a policy (signature mismatch). RFC semantics favor `403` for HMAC signature validation failures.

## Evidence

- Screenshot path: screenshots/TC-RDV-002/tc-rdv-002-commits-check.png
- Log path: —

## Duplicate check

- Duplicate found: No

## Retest

- Date: 2026-05-23
- Environment: Local Docker (http://localhost:3008)
- Result: **CONFIRMED**
- `POST /devops/webhook/github/phoenix-platform` with invalid signature (zeroed HMAC) → HTTP 401 `{"error":"Invalid signature"}`. Bug reproduces on local. Screenshot: screenshots/BUG-RDV-001/retest-2026-05-23-confirmed.png

## Retest

- Date: 2026-05-26
- Environment: Local Docker (http://localhost:3008) — fresh instance
- Result: **FIXED**
- `POST /devops/webhook/github/phoenix-platform` with zeroed HMAC → HTTP 403 `{"error":"signature_invalid"}`. Correct status code 403 is now returned. Bug no longer reproduces.

## Retest

- Date: 2026-05-26
- Environment: Forge (https://flux-foq1fnz3j49.forge.zehntech.com) — new instance
- Result: **FIXED**
- `POST /devops/webhook/github/agileboard` with invalid HMAC `sha256=badbadbadbad000000000000` → HTTP 403 `{"error":"signature_invalid"}`. Correct status code confirmed on new Forge. Bug does not reproduce.
