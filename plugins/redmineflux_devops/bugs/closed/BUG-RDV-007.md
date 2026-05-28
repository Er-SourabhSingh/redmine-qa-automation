# BUG-RDV-007

- Bug ID: BUG-RDV-007
- Title: Webhook background job fails with ActiveRecord::RecordInvalid after returning 202
- Redmine version: 6.0.9 (Forge)
- Plugin name: redmineflux_devops
- Plugin version: 0.1.0
- Environment: Forge + Local Docker (http://localhost:3008)
- Browser: Playwright (headless)
- User role: Unauthenticated (webhook endpoint)
- Severity: Medium
- Date: 2026-05-22

## Steps to reproduce

1. Send a valid GitHub push webhook to `/devops/webhook/github/phoenix-platform` with a correct HMAC-SHA256 signature in `X-Hub-Signature-256`, a unique `X-GitHub-Delivery` ID, and a minimal JSON payload: `{"ref":"refs/heads/main","delivery_id":"<unique-id>"}`.
2. Observe the HTTP response.
3. Wait ~2 seconds for background job processing, then check the DevOps webhook event log at `/projects/phoenix-platform/devops_webhooks`.
4. Inspect the `error_message` column for the newly created event row.

## Expected result

- HTTP 202 returned immediately.
- Background job completes successfully — event record written with `status: "processed"` and `error_message: null`.

## Actual result

- HTTP 202 returned immediately (correct).
- Background job fails with `ActiveRecord::RecordInvalid` — event record shows `error_message: "ActiveRecord::RecordInvalid"` and `status: "error"` (or equivalent failure state).
- The initial event row is written (duplicate detection works), but background enrichment/processing fails with a validation error, indicating a required field is missing or has an invalid value in the model.

## Evidence

- Screenshot path: screenshots/TC-RDV-001/tc-rdv-001-partial.png
- Log path: N/A (error observed via event log UI at /projects/phoenix-platform/devops_webhooks)

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A

## Notes

- The 202 response and initial row insertion are correct — the bug is isolated to the background processing step.
- Duplicate delivery detection (TC-RDV-003) works correctly, confirming the initial record insert succeeds.
- Async timing: the 202 is returned before the background job runs (TC-RDV-005 confirmed ~58 ms response time).
- Likely root cause: background job attempts to update/enrich the event record with a field that has a NOT NULL constraint or presence validation that is not populated for the minimal test payload.

## Retest

- Date: 2026-05-23
- Environment: Local Docker (http://localhost:3008)
- Result: **CONFIRMED** — root cause identified
- Sent minimal push payload (no `repository.html_url`) with valid HMAC → HTTP 202. Background job failed: `ActiveRecord::RecordInvalid: Validation failed: Repo url cannot be blank` (confirmed in docker logs for event ID 135).
- Root cause: background job requires `repository.html_url` in the push payload to populate the `repo_url` field. When absent, the job raises RecordInvalid and the commit record is not persisted.
- When `repository.html_url` is included in the payload, the job succeeds and commit records are created correctly.

## Retest

- Date: 2026-05-26
- Environment: Local Docker (http://localhost:3008) — fresh instance
- Result: **FIXED**
- Push webhook with `repository.html_url` included → HTTP 202 (event_id: 253). After 3s background job processing, commit SHA `abc123def4` ("Fix login bug refs #1") was confirmed present in `/projects/phoenix-platform/devops_commits.json` (total_count rose from prior baseline). Job no longer fails with RecordInvalid. Commit records are now persisted correctly.

## Retest

- Date: 2026-05-26
- Environment: Forge (https://flux-foq1fnz3j49.forge.zehntech.com) — new instance
- Result: **FIXED**
- `POST /devops/webhook/github/agileboard` with valid HMAC-SHA256 (secret `RedmineQA2026!`) and `repository.html_url` → HTTP 202 `{"status":"accepted","event_id":409}`. After 4s background job processing, commit SHA `forge00719e63f643d2` confirmed present in devops_commits (total_count rose from 90 to 91). Background job processes and stores commits correctly on new Forge. Bug does not reproduce.
