# Test Cases — Foundation / Infrastructure — Redmineflux DevOps

| Field | Value |
|-------|-------|
| **Plugin** | redmineflux_devops |
| **Module** | Foundation / Infrastructure |
| **TC Range** | TC-RDV-001 to TC-RDV-040 |
| **Total TCs** | 40 |
| **Requirement Coverage** | SYS-001, SYS-002, SYS-003, SYS-004, SYS-005, SYS-006, SYS-007 |
| **Feature Coverage** | rfd-001, rfd-002, rfd-003, rfd-004, rfd-005, rfd-101, rfd-102 |

---

## SYS-001 — Webhook Receiver (rfd-001)

---

### TC-RDV-001 — GitHub push webhook accepted with valid HMAC-SHA256 signature

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-001 Webhook Receiver |
| **Requirement Ref** | SYS-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Redmineflux DevOps plugin is installed and enabled
- A project with identifier `phoenix-platform` exists in Redmine
- A GitHub repository is configured for project `phoenix-platform` with webhook secret `s3cr3tKey`
- The webhook URL `POST /devops/webhook/github/phoenix-platform` is accessible from the test client

**Test Data:**
- Provider: `github`
- Project identifier: `phoenix-platform`
- Event type: `push`
- Webhook secret: `s3cr3tKey`
- Payload: standard GitHub push event JSON (branch: `main`, 2 commits)
- HMAC-SHA256 signature: computed from `s3cr3tKey` + raw payload body → placed in `X-Hub-Signature-256` header as `sha256=<hex>`

**Steps:**
1. Construct a valid GitHub push event JSON payload referencing project `phoenix-platform`.
2. Compute `HMAC-SHA256(key="s3cr3tKey", message=<raw payload bytes>)` and format as `sha256=<hex_digest>`.
3. Send `POST /devops/webhook/github/phoenix-platform` with:
   - Header `X-Hub-Signature-256: sha256=<computed_hex>`
   - Header `X-GitHub-Event: push`
   - Header `Content-Type: application/json`
   - Body: the push event JSON payload.
4. Observe the HTTP response status code.
5. Navigate to Admin > DevOps > Webhooks for project `phoenix-platform` and inspect the event log.

**Expected Result:**
- HTTP response is `202 Accepted` (returned immediately, before processing completes).
- A new row appears in the webhook event log showing provider `github`, event type `push`, status `processed`, and a timestamp within the last 60 seconds.
- The raw payload is stored in `redmineflux_devops_webhook_events` with `processed = true` and no `error_message`.

---

### TC-RDV-002 — Webhook rejected when HMAC-SHA256 signature is invalid

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-001 Webhook Receiver |
| **Requirement Ref** | SYS-001 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- Same setup as TC-RDV-001.
- Webhook secret configured on the Redmine side is `s3cr3tKey`.

**Test Data:**
- Same GitHub push payload as TC-RDV-001.
- Deliberate wrong HMAC: `sha256=0000000000000000000000000000000000000000000000000000000000000000`

**Steps:**
1. Construct a valid GitHub push event JSON payload.
2. Deliberately set the `X-Hub-Signature-256` header to an incorrect value: `sha256=0000000000000000000000000000000000000000000000000000000000000000`.
3. Send `POST /devops/webhook/github/phoenix-platform` with the incorrect signature header.
4. Observe the HTTP response status code and body.
5. Check the webhook event log in Admin > DevOps > Webhooks.

**Expected Result:**
- HTTP response is `403 Forbidden`.
- Response body contains an error message such as `{"error":"signature_invalid"}` or equivalent.
- No commit or build records are created in the database from this payload.
- The event log entry (if written) shows `processed = false` with `error_message` indicating signature failure.

---

### TC-RDV-003 — Webhook replay protection rejects duplicate delivery_id

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-001 Webhook Receiver |
| **Requirement Ref** | SYS-001 |
| **Priority** | High |
| **Scenario Type** | Edge |

**Preconditions:**
- Same setup as TC-RDV-001.
- A valid webhook delivery has already been processed (delivery_id `abc-123-xyz` is stored in `redmineflux_devops_webhook_events.payload_hash`).

**Test Data:**
- GitHub push event payload with `X-GitHub-Delivery: abc-123-xyz` (same delivery ID as the already-processed event).
- Valid HMAC-SHA256 signature for this payload.

**Steps:**
1. Send the same valid GitHub push webhook that was already processed, using identical delivery ID `abc-123-xyz` in the `X-GitHub-Delivery` header.
2. Compute a valid HMAC-SHA256 signature for the payload.
3. Send `POST /devops/webhook/github/phoenix-platform` with the valid signature and the duplicate delivery ID.
4. Observe the HTTP response status code.
5. Query `redmineflux_devops_webhook_events` to count records with `payload_hash` matching the delivery ID.

**Expected Result:**
- HTTP response is `200 OK` or `202 Accepted` (idempotent acknowledgement — do not re-trigger 403).
- No duplicate record is created; exactly one row exists for this delivery ID.
- No duplicate commit or build records are created.
- The event log shows the event was recognised as a duplicate and skipped.

---

### TC-RDV-004 — Webhook body over 2 MB rejected with HTTP 413

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-001 Webhook Receiver |
| **Requirement Ref** | SYS-001 |
| **Priority** | High |
| **Scenario Type** | Boundary / Negative |

**Preconditions:**
- Redmineflux DevOps plugin is installed and the webhook endpoint is accessible.

**Test Data:**
- Oversized payload: a JSON body of exactly 2,097,153 bytes (2 MB + 1 byte).
- Valid HMAC-SHA256 signature computed for that oversized body.

**Steps:**
1. Construct a JSON payload whose byte size is 2,097,153 bytes (padding a valid GitHub push event with a large `junk` field).
2. Compute a valid HMAC-SHA256 signature for this body.
3. Send `POST /devops/webhook/github/phoenix-platform` with the valid signature and the oversized body.
4. Observe the HTTP response status code.

**Expected Result:**
- HTTP response is `413 Request Entity Too Large`.
- No records are written to `redmineflux_devops_webhook_events` for this request.
- A payload of exactly 2,097,152 bytes (2 MB) is accepted (boundary check: at-limit is allowed).

---

### TC-RDV-005 — Webhook returns 202 immediately (async processing)

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-001 Webhook Receiver |
| **Requirement Ref** | SYS-001 |
| **Priority** | High |
| **Scenario Type** | Positive / Performance |

**Preconditions:**
- Plugin installed. Project `phoenix-platform` configured with a GitHub repo and webhook secret.
- A valid GitHub Actions build-completion event payload is prepared.

**Test Data:**
- GitHub `workflow_run` event (build completed, result: `failure`).
- Valid HMAC-SHA256 signature.

**Steps:**
1. Record the current time (T0) at millisecond precision.
2. Send `POST /devops/webhook/github/phoenix-platform` with the valid build event payload and signature.
3. Record the time the HTTP response is received (T1).
4. Calculate response latency: T1 - T0.

**Expected Result:**
- HTTP response code is `202 Accepted`.
- Response latency (T1 - T0) is under 500 milliseconds (the endpoint acknowledges immediately before processing).
- The payload is placed onto an async processing queue; the issue journal entry for build failure is written within a reasonable window (e.g., 10 seconds) but does not block the HTTP response.

---

### TC-RDV-006 — Webhook accepted from all supported providers

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-001 Webhook Receiver |
| **Requirement Ref** | SYS-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project `phoenix-platform` is configured with connections for each provider listed below.
- Each provider connection has a configured webhook secret or token.

**Test Data:**
- One minimal valid payload per provider: GitHub, GitLab, Jenkins, Prometheus (AlertManager), Zabbix, Datadog, SonarQube, Snyk, Trivy, ArgoCD, FOSSA.
- Valid signatures/tokens for each provider per their respective auth scheme.

**Steps:**
1. For each provider in the list [github, gitlab, jenkins, prometheus, zabbix, datadog, sonarqube, snyk, trivy, argocd, fossa]:
   a. Prepare a minimal valid payload for that provider.
   b. Compute the correct auth credential (HMAC-SHA256 for GitHub; token header for GitLab; basic auth for Jenkins; etc.).
   c. Send `POST /devops/webhook/{provider}/phoenix-platform`.
   d. Record the HTTP response status.
2. Review the webhook event log for all 11 provider entries.

**Expected Result:**
- All 11 webhook requests return `202 Accepted`.
- All 11 entries appear in the webhook event log with `processed = true`.
- No 404, 422, or 500 responses occur for any supported provider.

---

### TC-RDV-007 — Webhook for unknown provider returns 404

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-001 Webhook Receiver |
| **Requirement Ref** | SYS-001 |
| **Priority** | Medium |
| **Scenario Type** | Negative |

**Preconditions:**
- Plugin installed.

**Test Data:**
- Provider name: `unknownprovider` (not a valid registered provider).
- Project identifier: `phoenix-platform`.

**Steps:**
1. Send `POST /devops/webhook/unknownprovider/phoenix-platform` with any JSON body.
2. Observe the HTTP response.

**Expected Result:**
- HTTP response is `404 Not Found`.
- No records are written to the webhook event log.

---

### TC-RDV-008 — Webhook event log retains last 100 events and Admin can view them

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-001 Webhook Receiver |
| **Requirement Ref** | SYS-001 |
| **Priority** | Medium |
| **Scenario Type** | Positive / Boundary |

**Preconditions:**
- Plugin installed. Admin user is logged in.
- 105 prior webhook events have been received for project `phoenix-platform`.

**Test Data:**
- 105 valid GitHub push webhook deliveries, each with a unique `X-GitHub-Delivery` ID.

**Steps:**
1. Log in as Admin.
2. Navigate to the webhook event log page for project `phoenix-platform` (URL: `/projects/phoenix-platform/devops_webhooks`).
3. Count the total number of visible event rows on the page.
4. Verify the most recent 100 events are listed.
5. Confirm that event number 101 (the oldest, over the 100-event cap) is not listed.

**Expected Result:**
- The event log displays exactly 100 rows.
- The oldest 5 events (events 101–105) are not shown (purged or hidden past the 100-event retention limit).
- The page is accessible only to Admin and DevOps Engineer roles (non-Admin users see a 403 or are redirected).

---

## SYS-002 — Connection Manager (rfd-002)

---

### TC-RDV-009 — Admin can add a new GitHub connection with valid token

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-002 Connection Manager |
| **Requirement Ref** | SYS-002 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Admin or DevOps Engineer is logged in.
- Project `phoenix-platform` exists.
- A valid GitHub personal access token `ghp_XXXXXXXXXXXXXXXXXXXX` with `repo` scope is available.

**Test Data:**
- Provider: `github`
- Repository URL: `https://github.com/acme/phoenix-api`
- API token: `ghp_XXXXXXXXXXXXXXXXXXXX`
- Webhook secret: `webhook_s3cr3t`

**Steps:**
1. Log in as Admin.
2. Navigate to Project Settings > DevOps > Connections.
3. Click "Add Connection".
4. Select provider `GitHub`.
5. Enter repository URL `https://github.com/acme/phoenix-api`.
6. Enter API token `ghp_XXXXXXXXXXXXXXXXXXXX`.
7. Enter webhook secret `webhook_s3cr3t`.
8. Click "Save".
9. Observe the connections list.

**Expected Result:**
- The new connection appears in the list with provider badge `GitHub` and status `connected`.
- The API token field displays as masked/asterisked (not shown in plaintext).
- The record in `redmineflux_devops_repositories` stores `api_token_encrypted` using AES-256-GCM, not the raw token value.
- A success flash message is displayed: "Connection saved successfully."

---

### TC-RDV-010 — Token is stored encrypted and not visible in UI

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-002 Connection Manager |
| **Requirement Ref** | SYS-002 |
| **Priority** | High |
| **Scenario Type** | Security / Validation |

**Preconditions:**
- A GitHub connection has been saved with token `ghp_XXXXXXXXXXXXXXXXXXXX` (from TC-RDV-009).

**Test Data:**
- Token value: `ghp_XXXXXXXXXXXXXXXXXXXX`

**Steps:**
1. Log in as Admin.
2. Navigate to Project Settings > DevOps > Connections.
3. Click "Edit" on the GitHub connection created in TC-RDV-009.
4. Inspect the token input field value in the rendered HTML (use browser DevTools to view the field's `value` attribute).
5. Query the `redmineflux_devops_repositories` table directly for the `api_token_encrypted` column value.

**Expected Result:**
- The token input field in the edit form shows a masked placeholder (e.g., `••••••••••••••••••••`) or is empty, not the raw token.
- The `api_token_encrypted` column in the database contains an AES-256-GCM ciphertext, not the plaintext `ghp_XXXXXXXXXXXXXXXXXXXX` string.
- A search for the raw token string `ghp_XXXXXXXXXXXXXXXXXXXX` in the HTML page source returns zero results.

---

### TC-RDV-011 — Test Connection button verifies API access and shows status

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-002 Connection Manager |
| **Requirement Ref** | SYS-002 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- A GitHub connection for `https://github.com/acme/phoenix-api` exists with a valid token.

**Test Data:**
- N/A (uses the saved connection)

**Steps:**
1. Log in as Admin.
2. Navigate to Project Settings > DevOps > Connections.
3. Click the "Test Connection" button on the GitHub connection row.
4. Wait for the test result to appear.

**Expected Result:**
- A loading indicator appears while the test is in progress.
- A success message appears: "Connection verified — API access confirmed" (or equivalent).
- The connection status badge updates to `connected` (green).
- The test result is not cached for more than 60 seconds (clicking "Test Connection" again re-validates).

---

### TC-RDV-012 — Test Connection shows error when token is invalid

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-002 Connection Manager |
| **Requirement Ref** | SYS-002 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- A GitHub connection exists with an intentionally invalid token `ghp_INVALIDTOKEN`.

**Test Data:**
- Repository URL: `https://github.com/acme/phoenix-api`
- Invalid API token: `ghp_INVALIDTOKEN`

**Steps:**
1. Log in as Admin.
2. Edit the existing connection, replacing the token with `ghp_INVALIDTOKEN`, and save.
3. Click the "Test Connection" button.
4. Observe the result.

**Expected Result:**
- The test returns an error status: "Connection failed — GitHub API returned 401 Unauthorized."
- The connection status badge updates to `error` (red).
- No sensitive token data is exposed in the error message.

---

### TC-RDV-013 — Developer cannot add or edit repository connections

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-002 Connection Manager |
| **Requirement Ref** | SYS-002, SYS-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- A user `dev_user` exists with the `Developer` role on project `phoenix-platform`.
- The `Developer` role does NOT have `manage_devops_settings` permission.

**Test Data:**
- Login: `dev_user`

**Steps:**
1. Log in as `dev_user` (Developer role).
2. Navigate to Project Settings > DevOps > Connections.
3. Attempt to access `GET /projects/phoenix-platform/devops_connections/new`.
4. Attempt to submit a POST request to create a new connection.

**Expected Result:**
- Step 2: The "Connections" settings page is not accessible; user sees a 403 Forbidden or is redirected to the project overview with an "Access denied" message.
- Step 3: HTTP 403 is returned for the new connection form.
- Step 4: HTTP 403 is returned for the create POST.
- The "Add Connection" button is not visible in the UI for the Developer role.

---

### TC-RDV-014 — Admin can delete a connection

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-002 Connection Manager |
| **Requirement Ref** | SYS-002 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- A GitHub connection for project `phoenix-platform` exists.
- Admin is logged in.

**Test Data:**
- N/A

**Steps:**
1. Navigate to Project Settings > DevOps > Connections.
2. Click "Delete" on the GitHub connection.
3. Confirm the deletion in the confirmation dialog.
4. Observe the connections list.

**Expected Result:**
- The connection is removed from the list.
- A success flash message is shown: "Connection deleted."
- The corresponding row is removed from `redmineflux_devops_repositories`.
- No orphaned encrypted token data remains in the database.

---

## SYS-003 — Permission Model (rfd-003)

---

### TC-RDV-015 — All 7 DevOps permissions appear in Roles and Permissions admin panel

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-003 Permission Model |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Redmineflux DevOps plugin is installed.
- Admin user is logged in.

**Test Data:**
- Expected permissions: `view_devops`, `manage_devops_settings`, `trigger_builds`, `approve_deployments`, `manage_releases`, `manage_incidents`, `view_security_scans`

**Steps:**
1. Log in as Admin.
2. Navigate to Administration > Roles and Permissions.
3. Click on the `Developer` role to open its permission settings.
4. Scroll to the "DevOps" section.
5. Verify the presence and labels of each of the 7 defined DevOps permissions.

**Expected Result:**
- A "DevOps" section is present in the Roles and Permissions page.
- All 7 permissions are listed: `view_devops`, `manage_devops_settings`, `trigger_builds`, `approve_deployments`, `manage_releases`, `manage_incidents`, `view_security_scans`.
- Each permission has a checkbox that can be toggled independently per role.
- No extra undocumented DevOps permissions appear in this section.

---

### TC-RDV-016 — Non-member cannot see DevOps data for a private project

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-003 Permission Model |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Permission / Negative |

**Preconditions:**
- Project `phoenix-platform` is configured as private (non-public).
- User `external_user` is NOT a member of project `phoenix-platform`.
- `external_user` is logged in.

**Test Data:**
- Login: `external_user` (no project membership)
- Target URL: `/projects/phoenix-platform/devops_builds`

**Steps:**
1. Log in as `external_user`.
2. Attempt to navigate to `GET /projects/phoenix-platform/devops_builds`.
3. Attempt to navigate to `GET /projects/phoenix-platform/devops_commits`.
4. Attempt to navigate to `GET /projects/phoenix-platform/devops_environments`.

**Expected Result:**
- All three requests return HTTP 403 Forbidden or redirect to the login/access-denied page.
- No DevOps data is visible.
- The "DevOps" tab does not appear on the project navigation bar.

---

### TC-RDV-017 — Developer has view_devops but cannot approve deployments

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-003 Permission Model |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User `dev_user` has the `Developer` role on project `phoenix-platform`.
- `Developer` role has `view_devops` permission enabled.
- `Developer` role does NOT have `approve_deployments` permission.
- A deployment request is pending approval for environment `production`.

**Test Data:**
- Login: `dev_user`
- Pending deployment ID: any deployment record with status `pending_approval`

**Steps:**
1. Log in as `dev_user`.
2. Navigate to Project > DevOps > Deployments.
3. Verify that the deployments list page loads (HTTP 200).
4. Open the pending deployment detail page.
5. Look for "Approve" and "Reject" buttons.
6. Attempt to POST an approval via `POST /projects/phoenix-platform/devops_deployments/{id}/approve`.

**Expected Result:**
- Step 3: Page loads successfully (view_devops is granted).
- Step 5: "Approve" and "Reject" buttons are NOT visible to `dev_user`.
- Step 6: HTTP 403 Forbidden is returned.
- The deployment status remains `pending_approval` and is not changed.

---

### TC-RDV-018 — QA role cannot trigger builds

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-003 Permission Model |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Permission / Negative |

**Preconditions:**
- User `qa_user` has the `QA` role on project `phoenix-platform`.
- `QA` role has `view_devops` permission but NOT `trigger_builds`.
- A completed build record exists with ID `build-456`.

**Test Data:**
- Login: `qa_user`
- Build ID: `build-456`

**Steps:**
1. Log in as `qa_user`.
2. Navigate to Project > DevOps > Builds.
3. Click on build `build-456` to open the build detail page.
4. Look for the "Rebuild" button on the build detail page.
5. Attempt `POST /projects/phoenix-platform/devops_builds/build-456/trigger`.

**Expected Result:**
- The Builds list and build detail page load (view_devops granted).
- The "Rebuild" button is NOT visible in the UI for `qa_user`.
- Step 5: HTTP 403 Forbidden is returned.
- No new build is triggered.

---

## SYS-004 — REST API (rfd-004)

---

### TC-RDV-019 — REST API returns 401 when API key is missing

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-004 REST API |
| **Requirement Ref** | SYS-004 |
| **Priority** | High |
| **Scenario Type** | Negative / Security |

**Preconditions:**
- Plugin installed. At least one build record exists in project `phoenix-platform`.

**Test Data:**
- No API key header included in the request.

**Steps:**
1. Send `GET /devops/builds.json?project_id=phoenix-platform` with NO `X-Redmine-API-Key` header and no `key` query parameter.
2. Observe the HTTP response status and body.

**Expected Result:**
- HTTP response is `401 Unauthorized` or `403 Forbidden`.
- Response body is `{"error":"You need to be logged in."}` or equivalent.
- No build data is returned in the response body.

---

### TC-RDV-020 — REST API returns 401 when API key is invalid

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-004 REST API |
| **Requirement Ref** | SYS-004 |
| **Priority** | High |
| **Scenario Type** | Negative / Security |

**Preconditions:**
- Plugin installed.

**Test Data:**
- Invalid API key: `INVALID_API_KEY_12345678`

**Steps:**
1. Send `GET /devops/builds.json?project_id=phoenix-platform` with header `X-Redmine-API-Key: INVALID_API_KEY_12345678`.
2. Observe the HTTP response status and body.

**Expected Result:**
- HTTP response is `401 Unauthorized` or `403 Forbidden`.
- No DevOps data is returned.

---

### TC-RDV-021 — REST API returns paginated results with limit and offset

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-004 REST API |
| **Requirement Ref** | SYS-004 |
| **Priority** | High |
| **Scenario Type** | Positive / Boundary |

**Preconditions:**
- User `admin_user` with a valid API key has `view_devops` permission on project `phoenix-platform`.
- Exactly 25 commit records exist in `redmineflux_devops_commits` for project `phoenix-platform`.

**Test Data:**
- Valid API key: `<admin_api_key>`
- Request 1: `limit=10&offset=0`
- Request 2: `limit=10&offset=10`
- Request 3: `limit=10&offset=20`

**Steps:**
1. Send `GET /devops/commits.json?project_id=phoenix-platform&limit=10&offset=0` with header `X-Redmine-API-Key: <admin_api_key>`.
2. Record the number of commits returned and the IDs.
3. Send `GET /devops/commits.json?project_id=phoenix-platform&limit=10&offset=10`.
4. Record the count and IDs.
5. Send `GET /devops/commits.json?project_id=phoenix-platform&limit=10&offset=20`.
6. Record the count and IDs.

**Expected Result:**
- Request 1 returns 10 commits (offset 0–9).
- Request 2 returns 10 commits (offset 10–19).
- Request 3 returns 5 commits (offset 20–24, the remaining records).
- No commit ID appears in more than one response.
- All responses include total count metadata: `{"total_count": 25, ...}`.
- All responses return HTTP 200.

---

### TC-RDV-022 — REST API enforces project-scoped access (IDOR prevention)

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-004 REST API |
| **Requirement Ref** | SYS-004 |
| **Priority** | High |
| **Scenario Type** | Security / Negative |

**Preconditions:**
- User `dev_user` has `view_devops` on project `phoenix-platform` but is NOT a member of project `secret-project`.
- Build records exist for both projects.

**Test Data:**
- Valid API key for `dev_user`.
- Project identifier for the inaccessible project: `secret-project`.

**Steps:**
1. Authenticate as `dev_user` (valid API key).
2. Send `GET /devops/builds.json?project_id=secret-project` with `dev_user`'s API key.
3. Observe the HTTP response.

**Expected Result:**
- HTTP response is `403 Forbidden` or `404 Not Found`.
- No build records from `secret-project` are returned.
- Build records from `phoenix-platform` are not inadvertently included.

---

### TC-RDV-023 — REST API responds to all documented endpoints with HTTP 200

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-004 REST API |
| **Requirement Ref** | SYS-004 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Admin user with valid API key and `view_devops` permission on `phoenix-platform`.
- At least one record exists for each data type (builds, commits, pull requests, deployments, environments, incidents, vulnerabilities, releases, alerts).

**Test Data:**
- Valid API key: `<admin_api_key>`
- All requests scoped to `phoenix-platform`.

**Steps:**
1. For each endpoint, send the GET request with the admin API key:
   - `GET /devops/builds.json?project_id=phoenix-platform`
   - `GET /devops/commits.json?project_id=phoenix-platform`
   - `GET /devops/pull_requests.json?project_id=phoenix-platform`
   - `GET /devops/deployments.json?project_id=phoenix-platform`
   - `GET /devops/environments.json?project_id=phoenix-platform`
   - `GET /devops/incidents.json?project_id=phoenix-platform`
   - `GET /devops/metrics/dora.json?project_id=phoenix-platform`
   - `GET /devops/vulnerabilities.json?project_id=phoenix-platform`
   - `GET /devops/releases.json?project_id=phoenix-platform`
   - `GET /devops/alerts.json?project_id=phoenix-platform`
2. Record the HTTP status for each response.

**Expected Result:**
- All 10 endpoints return HTTP 200.
- Each response body is valid JSON containing an array of records (may be empty if no data, but still 200 with empty array).
- Each response includes `Content-Type: application/json`.

---

## SYS-005 — Activity Stream Integration (rfd-005)

---

### TC-RDV-024 — DevOps commit event appears in project activity feed

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-005 Activity Stream |
| **Requirement Ref** | SYS-005 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- A GitHub push webhook has been received and processed for project `phoenix-platform` (TC-RDV-001 has run).
- User `dev_user` has `view_devops` permission on the project.

**Test Data:**
- Push event with commit message: `Fixes #101 — implement user login`
- Author: `raj.kumar`

**Steps:**
1. Log in as `dev_user`.
2. Navigate to Project > Activity (the standard Redmine activity feed page).
3. Ensure the "DevOps" activity filter checkbox is enabled.
4. Look for the commit event in the feed.

**Expected Result:**
- An activity entry appears with text similar to: "raj.kumar pushed 1 commit to main".
- The entry is timestamped accurately and links to the commit detail or GitHub commit URL.
- The entry appears under the DevOps activity category (not incorrectly categorised as an issue note).

---

### TC-RDV-025 — DevOps panel renders on issue detail page

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-005 Activity Stream |
| **Requirement Ref** | SYS-005 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Issue `#101` in project `phoenix-platform` exists.
- At least one commit referencing `#101` has been received via webhook.
- At least one build linked to issue `#101` is present in `redmineflux_devops_builds`.
- User `dev_user` has `view_devops` permission.

**Test Data:**
- Issue ID: 101
- Commit SHA: `abc1234`
- Build status: `success`

**Steps:**
1. Log in as `dev_user`.
2. Navigate to Issue #101's detail page.
3. Scroll to the bottom of the issue page to find the "DevOps" section.
4. Verify the presence of the Builds, Pull Requests, and Commits collapsible sections.
5. Click on the "Commits" section header to expand it.
6. Click on the "Builds" section header to expand it.

**Expected Result:**
- A "DevOps" panel is rendered below the standard issue fields (via `view_issues_show_details_bottom` ViewHook).
- The panel shows a build status badge at the top (green for `success`).
- Collapsed sections display a count: "Commits (1)", "Builds (1)", "Pull Requests (0)".
- Expanding "Commits" shows a table with SHA `abc1234`, author, message, and a clickable link.
- Expanding "Builds" shows the build number, status badge, duration, and a link.

---

### TC-RDV-026 — Activity stream DevOps events filtered by type work correctly

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-005 Activity Stream |
| **Requirement Ref** | SYS-005 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Project `phoenix-platform` has recent events of types: commit, build (passed), deployment (to staging), incident (resolved).
- 3 DevOps activity providers are registered with `default: false`.

**Test Data:**
- N/A

**Steps:**
1. Navigate to Project > Activity.
2. Check only the "DevOps Commits" filter checkbox; deselect all others. Click Apply.
3. Verify that only commit events appear.
4. Check only the "DevOps Builds" filter checkbox. Click Apply.
5. Verify that only build events appear.
6. Enable all DevOps activity checkboxes. Click Apply.
7. Verify that all DevOps event types appear together.

**Expected Result:**
- Step 3: Only commit-type DevOps events are displayed.
- Step 5: Only build-type DevOps events are displayed.
- Step 7: Commits, builds, deployments, and incidents all appear.
- Activity provider filter checkboxes for DevOps are defaulted to unchecked (per `default: false` configuration).

---

## SYS-006 — Notification Configuration (rfd-101)

---

### TC-RDV-027 — User can configure notification preferences per event type

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-101 Notification Configuration |
| **Requirement Ref** | SYS-006 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- User `dev_user` is logged in.
- The notification preferences page is available at `/my/devops_notifications`.

**Test Data:**
- Event types to configure: `build_failed`, `deployment_completed`, `incident_created`, `pr_merged`
- Channels: `email`, `slack`, `teams`

**Steps:**
1. Log in as `dev_user`.
2. Navigate to My Account > DevOps Notifications (or directly to `/my/devops_notifications`).
3. In the notification matrix, enable `email` for event type `build_failed`.
4. Disable `slack` for event type `deployment_completed`.
5. Enable `teams` for event type `incident_created`.
6. Click "Save Preferences".
7. Navigate away and return to the preferences page.

**Expected Result:**
- Step 6: A success flash message is shown: "Notification preferences saved."
- Step 7: The saved preferences are reflected correctly — `email` checked for `build_failed`, `slack` unchecked for `deployment_completed`, `teams` checked for `incident_created`.
- Preferences are stored in `redmineflux_devops_notification_prefs` scoped to `dev_user`'s user ID.
- Other users' preferences are unaffected.

---

### TC-RDV-028 — Notification preferences are user-self-service only

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-101 Notification Configuration |
| **Requirement Ref** | SYS-006 |
| **Priority** | High |
| **Scenario Type** | Permission / Security |

**Preconditions:**
- User `dev_user` and user `other_user` both have accounts.
- `dev_user` has saved notification preferences.

**Test Data:**
- `dev_user` user ID: `42`
- `other_user` user ID: `43`

**Steps:**
1. Log in as `other_user`.
2. Attempt to access `GET /my/devops_notifications` (this always shows the current user's own preferences).
3. Attempt to directly access `GET /users/42/devops_notifications` (another user's preferences URL, if such a route exists).
4. Attempt to POST changes to `dev_user`'s preferences via `/users/42/devops_notifications`.

**Expected Result:**
- Step 2: `other_user` sees their own notification preferences, not `dev_user`'s.
- Step 3: Either redirected to own preferences or HTTP 403 Forbidden.
- Step 4: HTTP 403 Forbidden; `dev_user`'s preferences are not altered.
- Self-service: users can only manage their own preferences.

---

### TC-RDV-029 — Lazy default: no preference record until user saves for first time

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-101 Notification Configuration |
| **Requirement Ref** | SYS-006 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- Brand new user `new_user` has never visited the DevOps notification preferences page.

**Test Data:**
- Login: `new_user`

**Steps:**
1. Log in as `new_user`.
2. Query `SELECT * FROM redmineflux_devops_notification_prefs WHERE user_id = <new_user_id>` — confirm zero rows.
3. Navigate to `/my/devops_notifications`.
4. Verify the page loads without error.
5. Without saving anything, navigate away.
6. Re-query the database for `new_user`'s preferences.

**Expected Result:**
- Step 2: Zero rows in `redmineflux_devops_notification_prefs` for `new_user`.
- Step 4: The preferences page loads successfully with all checkboxes in their default unchecked state (or system-configured defaults).
- Step 6: Still zero rows — visiting the page without saving does not create records (lazy initialisation).
- When a build fails, `new_user` receives the system-default notification (if any default is configured) and no error is thrown because of the missing preference record.

---

### TC-RDV-030 — User receives email notification when build fails (notification enabled)

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-101 Notification Configuration |
| **Requirement Ref** | SYS-006 |
| **Priority** | High |
| **Scenario Type** | Positive / Workflow |

**Preconditions:**
- User `dev_user` has email notification enabled for `build_failed` event type.
- A build linked to issue `#102` (assigned to `dev_user`) is in `running` status.
- Email delivery is configured in Redmine test environment.

**Test Data:**
- Build ID: `build-789`
- Build status transition: `running` → `failed`

**Steps:**
1. Simulate a GitHub Actions webhook that marks build `build-789` as `failed`.
2. Wait up to 30 seconds for background job processing.
3. Check the email inbox of `dev_user`.

**Expected Result:**
- `dev_user` receives exactly one email with subject containing "Build #build-789 failed".
- The email body includes the branch name, build number, first error line (if available), and a link to the build.
- A second identical webhook delivery (duplicate) within the 1-hour deduplication window does NOT produce a second email.

---

## SYS-007 — Plugin Settings (rfd-102)

---

### TC-RDV-031 — Admin can access and save plugin settings page

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-102 Plugin Settings |
| **Requirement Ref** | SYS-007 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Redmineflux DevOps plugin is installed.
- Admin user is logged in.

**Test Data:**
- Settings to configure: webhook default secret, default stale PR threshold (days): `3`, auto-transition default: `enabled`

**Steps:**
1. Log in as Admin.
2. Navigate to Administration > Plugins.
3. Find "Redmineflux DevOps" in the plugin list.
4. Click "Configure" next to the plugin.
5. Verify the settings form loads with current values.
6. Change "Stale PR threshold" to `3` days.
7. Click "Apply" or "Save".
8. Navigate away and return to the settings page.

**Expected Result:**
- Step 4: The settings page loads at `Admin -> Plugins -> Configure` (HTTP 200).
- Step 7: A success flash message is shown.
- Step 8: "Stale PR threshold" shows `3`, confirming persistence.
- Sensitive fields (API tokens, secret keys) are rendered as `<input type="password">` elements.

---

### TC-RDV-032 — Non-Admin user cannot access plugin settings page

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-102 Plugin Settings |
| **Requirement Ref** | SYS-007 |
| **Priority** | High |
| **Scenario Type** | Permission / Negative |

**Preconditions:**
- User `dev_user` has `Developer` role in Redmine (not an admin).

**Test Data:**
- Login: `dev_user`
- Settings URL: `/settings/plugin/redmineflux_devops`

**Steps:**
1. Log in as `dev_user`.
2. Attempt to navigate to `/settings/plugin/redmineflux_devops`.
3. Observe the HTTP response.

**Expected Result:**
- HTTP 403 Forbidden is returned, or `dev_user` is redirected to the home page with an "Access denied" message.
- The plugin settings page is not rendered.
- `dev_user` cannot change any global plugin settings.

---

### TC-RDV-033 — SettingsValidator rejects invalid values

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-102 Plugin Settings |
| **Requirement Ref** | SYS-007 |
| **Priority** | Medium |
| **Scenario Type** | Validation / Negative |

**Preconditions:**
- Admin is logged in. Plugin settings page is accessible.

**Test Data:**
- Invalid stale PR threshold: `-1` (negative number)
- Invalid webhook body size limit: `abc` (non-numeric)

**Steps:**
1. Navigate to Administration > Plugins > Configure (Redmineflux DevOps).
2. Enter `-1` in the "Stale PR threshold (days)" field.
3. Click "Save".
4. Observe validation messages.
5. Enter `abc` in the "Max webhook body size (MB)" field.
6. Click "Save".
7. Observe validation messages.

**Expected Result:**
- Step 3: Form is NOT saved. Validation error displayed: "Stale PR threshold must be a positive integer."
- Step 6: Form is NOT saved. Validation error displayed: "Max webhook body size must be a number."
- Settings remain unchanged at their previous valid values.

---

## Cross-Cutting Foundation Tests

---

### TC-RDV-034 — DevOps tab is visible for project members and hidden for non-members

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-003 Permission Model |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- Project `phoenix-platform` is private.
- User `member_dev` has `Developer` role with `view_devops` permission.
- User `non_member` has no membership in the project.

**Test Data:**
- N/A

**Steps:**
1. Log in as `member_dev`.
2. Navigate to project `phoenix-platform` overview page.
3. Observe the project navigation tabs.
4. Log out.
5. Log in as `non_member`.
6. Navigate to project `phoenix-platform` overview page.
7. Observe the project navigation tabs.

**Expected Result:**
- Step 3: A "DevOps" tab is visible in the project navigation bar for `member_dev`.
- Step 7: The "DevOps" tab is NOT visible for `non_member`. The project overview may not even load (403 for private project).

---

### TC-RDV-035 — Plugin menu entry appears in top-level Redmine navigation after installation

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-003 Permission Model |
| **Requirement Ref** | SYS-003 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Plugin is freshly installed and the `db:migrate` task has been run.
- Admin user is logged in.

**Test Data:**
- N/A

**Steps:**
1. Log in as Admin.
2. Navigate to any Redmine project page.
3. Observe the top-level navigation tabs.

**Expected Result:**
- The project navigation includes a "DevOps" tab.
- Clicking the "DevOps" tab navigates to the DevOps overview for the project.
- The tab has a blue underline indicator when the DevOps section is active.

---

### TC-RDV-036 — Webhook endpoint rejects non-POST HTTP methods

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-001 Webhook Receiver |
| **Requirement Ref** | SYS-001 |
| **Priority** | Medium |
| **Scenario Type** | Negative / Validation |

**Preconditions:**
- Plugin installed. Webhook endpoint is accessible.

**Test Data:**
- HTTP methods to test: GET, PUT, PATCH, DELETE

**Steps:**
1. Send `GET /devops/webhook/github/phoenix-platform`.
2. Send `PUT /devops/webhook/github/phoenix-platform` with a JSON body.
3. Send `DELETE /devops/webhook/github/phoenix-platform`.

**Expected Result:**
- All three requests return HTTP 404 Not Found or 405 Method Not Allowed.
- No records are created in the webhook event log.
- Only POST is accepted on the webhook endpoint.

---

### TC-RDV-037 — REST API trigger-build endpoint is rate limited to 5 per hour

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-004 REST API, rfd-013 Trigger Build |
| **Requirement Ref** | SYS-004 |
| **Priority** | High |
| **Scenario Type** | Boundary / Negative |

**Preconditions:**
- User `dev_user` has `trigger_builds` permission on project `phoenix-platform`.
- `dev_user` has a valid API key.
- A build record with ID `build-100` exists.

**Test Data:**
- 6 consecutive POST requests to trigger a rebuild within the same 60-minute window.

**Steps:**
1. Send `POST /devops/builds/build-100/trigger.json` with `dev_user`'s API key. Record response (attempt 1).
2. Repeat 4 more times (attempts 2–5). Record each response.
3. Send a 6th POST request (attempt 6). Record the response.

**Expected Result:**
- Attempts 1 through 5: HTTP 200 or 202, each triggering a build.
- Attempt 6 (the 6th within the same hour): HTTP 429 Too Many Requests.
- Response body for attempt 6 includes: `{"error":"Rate limit exceeded. Maximum 5 build triggers per hour."}` or equivalent.
- The rate limit counter is per-project, per-user (not global).

---

### TC-RDV-038 — Activity stream respects view_devops permission before showing DevOps events

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-005 Activity Stream, rfd-003 Permission Model |
| **Requirement Ref** | SYS-005, SYS-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User `reporter_user` has `Reporter` role on `phoenix-platform`.
- `Reporter` role does NOT have `view_devops` permission.
- Multiple DevOps events (commits, builds) have been processed for `phoenix-platform`.

**Test Data:**
- Login: `reporter_user`

**Steps:**
1. Log in as `reporter_user`.
2. Navigate to Project > Activity.
3. Check whether DevOps activity filter options are available.
4. Inspect whether any DevOps events appear in the activity feed.

**Expected Result:**
- DevOps activity filter checkboxes are NOT visible in the activity filter panel for `reporter_user`.
- No DevOps events (commit pushes, builds, deployments) appear in the activity feed.
- Standard Redmine activity events (issues created, notes added) still appear normally.

---

### TC-RDV-039 — Admin can view DevOps audit log; Developer cannot

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-002, rfd-003 |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- Admin user has full permissions including `view_devops_audit_log`.
- User `dev_user` has `Developer` role with `view_devops` but NOT `view_devops_audit_log`.
- Several DevOps audit events (e.g., connection created, deployment approved) have been logged.

**Test Data:**
- Audit log URL: `/admin/devops_audit`

**Steps:**
1. Log in as Admin.
2. Navigate to `/admin/devops_audit`.
3. Verify the page loads and shows audit events with columns: actor, action, target, timestamp, IP.
4. Log out.
5. Log in as `dev_user`.
6. Navigate to `/admin/devops_audit`.
7. Observe the response.

**Expected Result:**
- Step 3: Audit log loads for Admin showing all logged DevOps actions. Filters for user, action type, and date range are present.
- Step 7: HTTP 403 Forbidden for `dev_user`. Audit log is not accessible.
- DevOps Engineer role also has no `view_devops_audit_log` permission (only Admin sees the audit log per the permissions matrix).

---

### TC-RDV-040 — Webhook event log is visible to Admin and DevOps Engineer but not Developer

| Field | Value |
|-------|-------|
| **Module** | Foundation / Infrastructure |
| **Feature** | rfd-001 Webhook Receiver, rfd-003 Permission Model |
| **Requirement Ref** | SYS-001, SYS-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User `devops_engineer` has `DevOps Engineer` role on project `phoenix-platform` (has `manage_devops_settings` permission, which includes webhook log access).
- User `dev_user` has `Developer` role on `phoenix-platform` (does NOT have `manage_devops_settings`).
- Several webhook events have been logged for `phoenix-platform`.

**Test Data:**
- Webhook log URL: `/projects/phoenix-platform/devops_webhooks`

**Steps:**
1. Log in as `devops_engineer`.
2. Navigate to `/projects/phoenix-platform/devops_webhooks`.
3. Verify the page loads with the list of webhook events.
4. Log out.
5. Log in as `dev_user`.
6. Navigate to `/projects/phoenix-platform/devops_webhooks`.
7. Observe the response.

**Expected Result:**
- Step 3: Page loads (HTTP 200) for `devops_engineer`. Event log shows provider, event type, status (processed/error), received_at timestamp for each event.
- Step 7: HTTP 403 Forbidden for `dev_user`. The webhook event log is not accessible.
- The "View Webhook Event Log" link does not appear in the DevOps Settings navigation for `dev_user`.
