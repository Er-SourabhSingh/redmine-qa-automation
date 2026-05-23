# Bug Report

- Bug ID: BUG-RDV-002
- Title: Webhook endpoint accepts payloads over 2 MB — no size limit enforced
- Redmine version: 6.0.9 (Forge)
- Plugin name: redmineflux_devops
- Plugin version: 0.1.0
- Environment: Forge — https://flux-frjrhm25q49.forge.zehntech.com/
- Browser: Playwright (automated)
- User role: System (webhook POST from external client)
- Severity: High
- Date: 2026-05-22
- Discovered in TC: TC-RDV-004

## Steps to reproduce

1. Configure GitHub repository on project `phoenix-platform` with webhook secret `RedmineQA2026!`
2. Construct a JSON payload of 2,097,430 bytes (> 2 MB) — a valid GitHub push event padded with a large `junk` field
3. Compute valid HMAC-SHA256 signature for the oversized payload
4. Send `POST /devops/webhook/github/phoenix-platform` with the valid signature and the oversized body

## Expected result

- HTTP response: `413 Request Entity Too Large`
- No records written to `redmineflux_devops_webhook_events`
- A payload of exactly 2,097,152 bytes (2 MB) should be accepted (at-limit boundary)

## Actual result

- HTTP response: `202 Accepted`
- Response body: `{"status":"accepted","event_id":409}`
- The 2,097,430-byte payload was accepted and processed without any size check
- This exposes the server to DoS via extremely large webhook payloads that could exhaust memory or database storage

## Evidence

- Screenshot path: screenshots/TC-RDV-004/tc-rdv-004-fail.png
- Payload size tested: 2,097,430 bytes

## Duplicate check

- Duplicate found: No

## Retest

- Date: 2026-05-23
- Environment: Local Docker (http://localhost:3008)
- Result: **CONFIRMED**
- 3 MB payload (with valid HMAC-SHA256 using secret `s3cr3tKey`) sent to `POST /devops/webhook/github/phoenix-platform` → HTTP 202 `{"status":"accepted"}`. No 413 returned. Screenshot: screenshots/BUG-RDV-002/retest-2026-05-23-confirmed.png
- Note: Correct webhook secret is `s3cr3tKey` (stored in `redmineflux_devops_repositories.webhook_secret`), not the QA credentials shared secret.
