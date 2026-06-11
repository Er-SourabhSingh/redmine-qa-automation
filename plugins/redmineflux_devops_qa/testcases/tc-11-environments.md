# Test Cases — Environments — Redmineflux DevOps

| Field | Value |
|-------|-------|
| **Plugin** | redmineflux_devops |
| **Module** | Environment Management |
| **TC Range** | TC-RDV-461 to TC-RDV-495 |
| **Total TCs** | 35 |
| **Requirement Coverage** | ENV-001, ENV-002, ENV-003, ENV-004, ENV-005 |
| **Feature Coverage** | rfd-032, rfd-033, rfd-099, rfd-100, rfd-121 |

---

## ENV-001 — Environment Registry (rfd-032)

---

### TC-RDV-461 — Add a new environment with all fields populated

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Environment Registry (rfd-032) |
| **Requirement Ref** | ENV-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- User is logged in with `manage_environments` permission (DevOps Engineer or Admin role)
- Project "Phoenix Platform" exists with the DevOps plugin enabled
- DevOps tab is visible and navigable

**Test Data:**
- Environment Name: `staging-us-east`
- URL: `https://staging.phoenix-platform.example.com`
- Type: `staging`
- Owner: user ID of a valid project member (e.g., "alice@example.com")

**Steps:**
1. Navigate to Project "Phoenix Platform" → DevOps tab → Environments sub-tab.
2. Click "Add Environment" button.
3. Enter Name: `staging-us-east`.
4. Enter URL: `https://staging.phoenix-platform.example.com`.
5. Select Type: `staging` from the dropdown.
6. Select Owner from the member list.
7. Click "Save".

**Expected Result:**
- HTTP 200 or redirect to environment list; no error banner displayed.
- New environment `staging-us-east` appears in the environment list.
- Displayed type is "Staging" and owner column shows the selected user.
- Row position in list reflects auto-ordering: dev environments appear before staging, staging before prod.

---

### TC-RDV-462 — Edit an existing environment's name and URL

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Environment Registry (rfd-032) |
| **Requirement Ref** | ENV-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Environment `staging-us-east` exists in project "Phoenix Platform".
- User has `manage_environments` permission.

**Test Data:**
- Updated Name: `staging-us-east-v2`
- Updated URL: `https://staging-v2.phoenix-platform.example.com`

**Steps:**
1. Navigate to Project → DevOps → Environments.
2. Click the "Edit" action for `staging-us-east`.
3. Change Name to `staging-us-east-v2`.
4. Change URL to `https://staging-v2.phoenix-platform.example.com`.
5. Click "Save".

**Expected Result:**
- Environment list reflects the updated name `staging-us-east-v2` and the new URL.
- No other environment records are affected.
- Audit log (Admin → DevOps Audit Log) contains an entry recording the change, the actor, and the timestamp.

---

### TC-RDV-463 — Delete an environment

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Environment Registry (rfd-032) |
| **Requirement Ref** | ENV-001 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Environment `staging-us-east-v2` exists and has no active deployments or locks.
- User has `manage_environments` permission.

**Test Data:**
- Environment to delete: `staging-us-east-v2`

**Steps:**
1. Navigate to Project → DevOps → Environments.
2. Click the "Delete" action for `staging-us-east-v2`.
3. Confirm the deletion in the confirmation dialog.

**Expected Result:**
- Environment `staging-us-east-v2` no longer appears in the list.
- HTTP 200 response after confirmation; no 500 error.
- Associated health check records are soft-deleted or orphaned per retention policy.

---

### TC-RDV-464 — Auto-position ordering: dev < staging < prod environments

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Environment Registry (rfd-032) |
| **Requirement Ref** | ENV-001 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Project has no existing environments.
- User has `manage_environments` permission.

**Test Data:**
- Environment A: Name `prod-eu`, Type `prod`
- Environment B: Name `dev-local`, Type `dev`
- Environment C: Name `staging-main`, Type `staging`
- Environment D: Name `perf-test`, Type `custom`

**Steps:**
1. Create environment `prod-eu` (type: prod).
2. Create environment `dev-local` (type: dev).
3. Create environment `staging-main` (type: staging).
4. Create environment `perf-test` (type: custom).
5. Navigate to Project → DevOps → Environments.
6. Observe the display order.

**Expected Result:**
- Environments are ordered: `dev-local` (dev) → `staging-main` (staging) → `prod-eu` (prod) → `perf-test` (custom).
- Order is determined by the `ENVIRONMENT_TYPES` constant auto-position logic defined in rfd-032.
- Manual sort order is not required by the user; ordering is automatic.

---

### TC-RDV-465 — All four environment types are selectable on the add form

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Environment Registry (rfd-032) |
| **Requirement Ref** | ENV-001 |
| **Priority** | Low |
| **Scenario Type** | Validation |

**Preconditions:**
- User has `manage_environments` permission and is on the "Add Environment" form.

**Test Data:**
- N/A

**Steps:**
1. Navigate to Project → DevOps → Environments → Add Environment.
2. Inspect the "Type" dropdown options.

**Expected Result:**
- Dropdown contains exactly four options: `dev`, `staging`, `prod`, `custom`.
- No additional options are present.
- Default selection is unset (user must choose) or defaults to `dev` as per implementation — either way, no blank/null value is accepted on save.

---

## ENV-002 — Environment Health Status (rfd-033)

---

### TC-RDV-466 — Environment health status shows green when endpoint returns 200

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Environment Health Status (rfd-033) |
| **Requirement Ref** | ENV-002 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Environment `staging-main` exists with URL `https://staging.example.com/health`.
- The health endpoint is reachable and returns HTTP 200.
- Health checker polling is enabled.

**Test Data:**
- Health URL: `https://staging.example.com/health` (returns `{"status":"ok"}`, HTTP 200)

**Steps:**
1. Navigate to Project → DevOps → Environments.
2. Observe the status light column for `staging-main`.
3. Wait up to 2 minutes for the lazy polling cycle to execute, or click "Check Now" to force an immediate check.

**Expected Result:**
- Status light for `staging-main` is green.
- Tooltip or status text reads "Healthy" or equivalent.
- "Last check time" is updated to a timestamp within the past few minutes.

---

### TC-RDV-467 — Environment health status shows red when endpoint is unreachable

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Environment Health Status (rfd-033) |
| **Requirement Ref** | ENV-002 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- Environment `prod-eu` exists with a URL that is not reachable (e.g., offline server or wrong port).
- Health URL: `https://prod-eu.example.com:9999/health` (connection refused or timeout)

**Test Data:**
- Health URL: `https://prod-eu.example.com:9999/health` — unreachable

**Steps:**
1. Navigate to Project → DevOps → Environments.
2. Click "Check Now" for `prod-eu`.
3. Observe status light after check completes.

**Expected Result:**
- Status light changes to red.
- Status text reads "Down" or "Unreachable".
- Last check time is updated.
- No unhandled 500 error in the application; the failure is captured gracefully.

---

### TC-RDV-468 — Manual "Check Now" AJAX trigger updates status without page reload

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Environment Health Status (rfd-033) |
| **Requirement Ref** | ENV-002 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Environment `staging-main` exists with a valid health URL.
- User is viewing the Environments tab.

**Test Data:**
- N/A

**Steps:**
1. Navigate to Project → DevOps → Environments.
2. Note the current status light color and last-check timestamp for `staging-main`.
3. Click the "Check Now" button for `staging-main`.
4. Observe behavior without manually refreshing the page.

**Expected Result:**
- An AJAX spinner appears on the "Check Now" button while the check is in progress.
- The status light color and last-check timestamp update in place via AJAX without a full page reload.
- No browser navigation occurs; the URL does not change.

---

### TC-RDV-469 — SSRF prevention: health check URL targeting private IP is rejected

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Environment Health Status (rfd-033) |
| **Requirement Ref** | ENV-002 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- User has `manage_environments` permission.
- `EnvironmentHealthChecker` uses `Resolv.getaddress` + private IP blocking as per rfd-033.

**Test Data:**
- Malicious health URL attempt 1: `http://192.168.1.1/health` (private IPv4)
- Malicious health URL attempt 2: `http://10.0.0.1/admin` (private IPv4)
- Malicious health URL attempt 3: `http://localhost/secret` (loopback)
- Malicious health URL attempt 4: `http://169.254.169.254/latest/meta-data` (AWS metadata endpoint)

**Steps:**
1. Navigate to Project → DevOps → Environments.
2. Edit an existing environment and set the URL to `http://192.168.1.1/health`.
3. Click "Check Now".
4. Repeat for each malicious URL in test data.

**Expected Result:**
- Each check is rejected before any outbound HTTP request is made.
- The status light shows an error state (e.g., gray or red with "SSRF blocked" message).
- No HTTP request is dispatched to the private/loopback address.
- Application logs record the blocked attempt.
- Application does not return a 500 error; behavior is graceful.

---

### TC-RDV-470 — SSRF prevention: DNS rebinding is prevented

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Environment Health Status (rfd-033) |
| **Requirement Ref** | ENV-002 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- `EnvironmentHealthChecker` uses DNS-to-IP resolution before connecting, with connection made directly to the resolved IP (rfd-033: "connects directly to resolved IP").
- A DNS rebinding test domain is available (e.g., a domain that resolves to a private IP like `192.168.1.1`).

**Test Data:**
- Rebind URL: `http://rebind-test.attacker.example.com/health` (DNS resolves to `192.168.1.1`)

**Steps:**
1. Configure environment health URL to `http://rebind-test.attacker.example.com/health`.
2. Trigger a health check via "Check Now".
3. Observe whether the system connects to the resolved IP or uses the domain name for connection.

**Expected Result:**
- The `EnvironmentHealthChecker` resolves the DNS name first and validates the resolved IP.
- If the resolved IP falls in the private range (RFC 1918), the request is blocked.
- The system connects directly to the resolved IP, not via re-resolution at connection time, preventing rebinding attacks.
- The check is aborted with a SSRF-blocked error message; no private network request is made.

---

### TC-RDV-471 — Lazy polling does not exceed 5 stale environments simultaneously

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Environment Health Status (rfd-033) |
| **Requirement Ref** | ENV-002 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- Project has 8 environments all with stale health check status (last check > polling interval).
- Server-side lazy polling limit is set to 5 (per rfd-033).

**Test Data:**
- 8 environments: `env-1` through `env-8`, all stale

**Steps:**
1. Navigate to Project → DevOps → Environments.
2. Observe the automatic polling behavior on page load.
3. Monitor server-side HTTP requests (via proxy or application logs).

**Expected Result:**
- At most 5 concurrent health check requests are dispatched per polling cycle.
- Remaining 3 stale environments are queued for the next cycle, not ignored permanently.
- UI does not freeze; page remains responsive while polling occurs.

---

## ENV-003 — Deployment Freeze / Lock (rfd-082, rfd-099)

---

### TC-RDV-472 — Create a single-instance deployment freeze window

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Deployment Freeze Windows (rfd-099) |
| **Requirement Ref** | ENV-003 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- User has `manage_environments` permission.
- Project "Phoenix Platform" has at least one environment: `prod-eu`.

**Test Data:**
- Freeze Name: `Pre-Demo Freeze`
- Start: 2026-06-10 18:00 UTC
- End: 2026-06-11 09:00 UTC
- Recurrence: None (single instance)
- Environments: `prod-eu`

**Steps:**
1. Navigate to Project → DevOps → Environments → "Manage Freeze Windows".
2. Click "Add Freeze Window".
3. Enter Name: `Pre-Demo Freeze`.
4. Set start datetime: `2026-06-10 18:00 UTC`.
5. Set end datetime: `2026-06-11 09:00 UTC`.
6. Leave recurrence as "None".
7. Select environment `prod-eu`.
8. Click "Save".

**Expected Result:**
- Freeze window `Pre-Demo Freeze` appears in the freeze windows list.
- Start and end times are displayed correctly.
- During the freeze window, attempting to deploy to `prod-eu` results in a blocked message from `DeploymentDispatcher`.

---

### TC-RDV-473 — Create a weekly recurring deployment freeze window

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Deployment Freeze Windows (rfd-099) |
| **Requirement Ref** | ENV-003 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- User has `manage_environments` permission.

**Test Data:**
- Freeze Name: `Weekly Release Window Freeze`
- Day: Friday
- Start time: 17:00 UTC
- End time (same day): 23:59 UTC
- Recurrence: Weekly
- Environments: All (leave environment field blank or select "All")

**Steps:**
1. Navigate to Project → DevOps → Environments → "Manage Freeze Windows".
2. Click "Add Freeze Window".
3. Enter Name: `Weekly Release Window Freeze`.
4. Select Recurrence: `Weekly`.
5. Select Day: `Friday`.
6. Set start time: `17:00 UTC`, end time: `23:59 UTC`.
7. Leave environments unspecified (applies to all).
8. Click "Save".

**Expected Result:**
- Weekly freeze appears in the list with "Recurring: Weekly on Friday 17:00–23:59 UTC".
- Every Friday between 17:00 and 23:59 UTC, `DeploymentDispatcher` blocks deployments to all environments.
- Outside this window, deployments are not affected by this freeze.

---

### TC-RDV-474 — Active freeze blocks deployment via DeploymentDispatcher

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Deployment Freeze Windows (rfd-099) |
| **Requirement Ref** | ENV-003 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- A single-instance freeze window is active RIGHT NOW (current time falls within the freeze window's start–end range).
- Environment `prod-eu` is targeted by the active freeze window.
- User with `trigger_devops_deployment` permission attempts a deployment.

**Test Data:**
- Active freeze: `Pre-Demo Freeze` (currently active)
- Target environment: `prod-eu`
- Version to deploy: `v2.5.1`

**Steps:**
1. Log in as a user with the `trigger_devops_deployment` permission (Developer role).
2. Navigate to Project → DevOps → Environments → `prod-eu`.
3. Click "Deploy" for version `v2.5.1`.
4. Observe the response.

**Expected Result:**
- The "Deploy" button is disabled and shows a freeze-active indicator (e.g., lock icon with tooltip "Deployment freeze active until 2026-06-11 09:00 UTC").
- Clicking the button (if not disabled at UI level) or calling the API results in a rejection message: "Deployment blocked: active freeze window 'Pre-Demo Freeze'."
- No deployment record is created with status "dispatched" or "running".
- The freeze block is recorded in the application audit log.

---

### TC-RDV-475 — Admin overrides freeze with written reason — reason saved to audit log

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Deployment Freeze Windows (rfd-099) |
| **Requirement Ref** | ENV-003 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- An active freeze window blocks deployments to `prod-eu`.
- User is logged in as Admin.

**Test Data:**
- Override reason: `Emergency hotfix for critical payment processing bug reported by ops team. Approved by CTO via incident call #IC-2026-0042.`
- Version to deploy: `v2.5.2-hotfix`

**Steps:**
1. Log in as Admin.
2. Navigate to Project → DevOps → Environments → `prod-eu` → Deploy.
3. System presents freeze-active warning with an "Override" option available to Admin.
4. Click "Override Freeze".
5. Enter override reason in the mandatory text field: (reason as above).
6. Click "Confirm Override and Deploy".

**Expected Result:**
- Deployment proceeds despite the active freeze window.
- A deployment record is created with status progressing normally.
- The Admin → DevOps Audit Log contains an entry with:
  - Actor: Admin user name
  - Action: `freeze_override`
  - Reason: the full override reason text entered
  - Timestamp: current time
  - Target environment: `prod-eu`
- No data loss or double-deployment occurs.

---

### TC-RDV-476 — Expired freeze does not block deployment

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Deployment Freeze Windows (rfd-099) |
| **Requirement Ref** | ENV-003 |
| **Priority** | High |
| **Scenario Type** | Edge |

**Preconditions:**
- A freeze window exists for `prod-eu` but its end time has already passed (e.g., ended 2 hours ago).
- User has `trigger_devops_deployment` permission.

**Test Data:**
- Expired freeze end time: 2 hours before current time
- Version to deploy: `v2.5.3`

**Steps:**
1. Verify the freeze window's end time is in the past.
2. Navigate to Project → DevOps → Environments → `prod-eu`.
3. Click "Deploy" for version `v2.5.3`.
4. Confirm deployment.

**Expected Result:**
- The "Deploy" button is enabled; no freeze warning is shown.
- Deployment proceeds normally; `DeploymentDispatcher` does not return a freeze-blocked error.
- The expired freeze record is still visible in the freeze window list (not auto-deleted), but it is not active.

---

### TC-RDV-477 — Freeze window with no environments specified blocks all environments

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Deployment Freeze Windows (rfd-099) |
| **Requirement Ref** | ENV-003 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- An active freeze window exists with no specific environments listed (applies to all).
- Project has environments: `dev-local`, `staging-main`, `prod-eu`.

**Test Data:**
- Freeze: `Global maintenance window`, no specific environments
- Current time is within the freeze window

**Steps:**
1. Attempt deployment to `dev-local` during the active global freeze.
2. Attempt deployment to `staging-main` during the active global freeze.
3. Attempt deployment to `prod-eu` during the active global freeze.

**Expected Result:**
- All three deployment attempts are blocked by `DeploymentDispatcher`.
- The freeze-active message references the global freeze by name.
- Blocking applies regardless of environment type (dev, staging, prod).

---

### TC-RDV-478 — Deployment lock: locked_until expiry auto-releases lock

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Deployment Lock (rfd-082) |
| **Requirement Ref** | ENV-003 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Environment `staging-main` has a deployment lock set with `locked_until` = 1 minute in the future.
- `unexpired_locks` scope is used by all dispatch paths per rfd-082.

**Test Data:**
- Lock reason: `QA is running regression suite`
- locked_by: user "bob@example.com"
- locked_until: current_time + 1 minute

**Steps:**
1. Navigate to Project → DevOps → Environments → `staging-main`.
2. Observe the lock indicator while the lock is active.
3. Attempt a deployment while the lock is active — confirm it is blocked.
4. Wait for the `locked_until` time to pass (or advance test clock by 2 minutes).
5. Attempt the deployment again.

**Expected Result:**
- While lock is active: deployment is blocked; UI shows lock reason and locked-by user name.
- After `locked_until` time passes: lock is no longer active (auto-released without manual action).
- Second deployment attempt succeeds; no manual unlock step is required.
- The `unexpired_locks` scope correctly returns no records after expiry.

---

### TC-RDV-479 — Lock reason and locked_by_id are visible in the UI

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Deployment Lock (rfd-082) |
| **Requirement Ref** | ENV-003 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Environment `prod-eu` has an active deployment lock set by user "carol@example.com".

**Test Data:**
- locked_by: carol@example.com (display name: "Carol Smith")
- lock_reason: `Waiting for DB migration approval before next deploy`
- locked_until: 2 hours from now

**Steps:**
1. Navigate to Project → DevOps → Environments.
2. Observe the `prod-eu` environment card.
3. Click on `prod-eu` to view its detail page.

**Expected Result:**
- Environment list shows a lock icon next to `prod-eu`.
- Environment detail page shows:
  - "Locked by: Carol Smith"
  - "Reason: Waiting for DB migration approval before next deploy"
  - "Locked until: [datetime]"
- The locked_by user's display name (not internal ID) is shown.

---

### TC-RDV-480 — Environment lock blocks deployment even for Admin unless overridden

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Deployment Lock (rfd-082) |
| **Requirement Ref** | ENV-003 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- Environment `prod-eu` has an active deployment lock (not expired).
- User is logged in as Admin.

**Test Data:**
- Active lock on `prod-eu`, no expiry override

**Steps:**
1. Log in as Admin.
2. Navigate to Project → DevOps → Environments → `prod-eu` → Deploy.
3. Attempt to initiate a deployment to `prod-eu` WITHOUT explicitly using an override mechanism.

**Expected Result:**
- Even Admin is blocked by an active deployment lock.
- The blocked message indicates the lock is active and shows the lock reason.
- An "Override Lock" option may be presented to Admin separately, but the default deployment action is blocked.
- This confirms that lock enforcement is not role-bypassed by default.

---

### TC-RDV-481 — manage_environments permission is required to lock/unlock environments

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Deployment Lock (rfd-082) |
| **Requirement Ref** | ENV-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "dev-user" has Developer role with `view_devops` but NOT `manage_environments` permission.
- Environment `staging-main` exists in the project.

**Test Data:**
- User: dev-user (Developer role, no manage_environments)

**Steps:**
1. Log in as dev-user.
2. Navigate to Project → DevOps → Environments → `staging-main`.
3. Attempt to click "Lock Environment".
4. Alternatively, attempt to send `POST /projects/phoenix-platform/devops_environments/1/lock` via API with dev-user's API key.

**Expected Result:**
- "Lock Environment" button is not visible to dev-user in the UI.
- Direct API call returns HTTP 403 Forbidden.
- No lock record is created.

---

## ENV-004 — Environment Provisioning Request (rfd-100)

---

### TC-RDV-482 — Create an Environment Request issue via the provisioning form

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Environment Provisioning Request (rfd-100) |
| **Requirement Ref** | ENV-004 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- User has `provision_environment` permission.
- The "Environment Request" tracker with 5 custom fields has been auto-installed by the plugin migration.
- Project "Phoenix Platform" has the DevOps tab enabled.

**Test Data:**
- Request title: `New performance testing environment for v3.0 load tests`
- Environment type requested: `custom`
- Expected team size: `5 developers`
- Required date: `2026-07-01`
- Stack/notes: `Docker-based, PostgreSQL 15, 4 vCPU, 16 GB RAM`

**Steps:**
1. Log in as a user with `provision_environment` permission.
2. Navigate to Project → DevOps → Environments.
3. Click "Request Environment".
4. Fill in the form with the test data above (populating all 5 custom fields).
5. Click "Submit Request".

**Expected Result:**
- A new Redmine issue is created with tracker "Environment Request".
- Issue title matches the entered title.
- All 5 custom fields are populated.
- Issue is auto-assigned to the configured DevOps owner/queue.
- Configured watchers receive an email notification.
- User is redirected to the newly created issue.

---

### TC-RDV-483 — User without provision_environment permission cannot submit an environment request

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Environment Provisioning Request (rfd-100) |
| **Requirement Ref** | ENV-004 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "readonly-user" has `view_devops` but NOT `provision_environment` permission.

**Test Data:**
- User: readonly-user

**Steps:**
1. Log in as readonly-user.
2. Navigate to Project → DevOps → Environments.
3. Observe whether the "Request Environment" button is visible.
4. Attempt to access `POST /projects/phoenix-platform/devops_env_requests` directly via API.

**Expected Result:**
- "Request Environment" button is hidden from readonly-user.
- Direct API call returns HTTP 403.
- No issue is created.

---

### TC-RDV-484 — Environment Request auto-assigns and notifies watchers

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Environment Provisioning Request (rfd-100) |
| **Requirement Ref** | ENV-004 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- The "Environment Request" tracker is configured with a default assignee and configured watchers.
- User has `provision_environment` permission.
- Email notifications are enabled in Redmine.

**Test Data:**
- Default assignee: devops-lead@example.com
- Configured watchers: [infra-team@example.com]

**Steps:**
1. Submit a new environment request (as per TC-RDV-482 steps 1–5).
2. Check the email inbox of devops-lead@example.com.
3. Check the email inbox of infra-team@example.com.
4. Check the created issue's assignee and watchers fields.

**Expected Result:**
- The issue's "Assigned to" field shows devops-lead@example.com.
- Both devops-lead@example.com and infra-team@example.com receive a notification email.
- The watcher list on the issue shows infra-team@example.com.

---

## ENV-005 — Environment Comparison (rfd-121)

---

### TC-RDV-485 — Side-by-side comparison shows version, SHA, and deploy time for both environments

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Environment Comparison (rfd-121) |
| **Requirement Ref** | ENV-005 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project has two environments: `staging-main` (latest successful deploy: v2.5.0, SHA abc123ef) and `prod-eu` (latest successful deploy: v2.4.9, SHA de12bc90).
- Both have successful deployment records.

**Test Data:**
- Env A: `staging-main`, version v2.5.0, SHA abc123ef, deployed 2026-05-20 14:00 UTC
- Env B: `prod-eu`, version v2.4.9, SHA de12bc90, deployed 2026-05-18 10:00 UTC

**Steps:**
1. Navigate to Project → DevOps → Environments.
2. Click "Compare Environments".
3. Select Env A: `staging-main`, Env B: `prod-eu`.
4. Click "Compare".

**Expected Result:**
- Side-by-side table is displayed.
- Left column (staging-main): version v2.5.0, SHA abc123ef, deploy time 2026-05-20 14:00 UTC.
- Right column (prod-eu): version v2.4.9, SHA de12bc90, deploy time 2026-05-18 10:00 UTC.
- An "Issue Diff" section shows issues included in staging-main's commits that are not yet in prod-eu.

---

### TC-RDV-486 — Issue-diff is computed from commits in the time window between deployments

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Environment Comparison (rfd-121) |
| **Requirement Ref** | ENV-005 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Env A: `staging-main`, deployed 2026-05-20; commits in this window reference issues #101, #102, #103.
- Env B: `prod-eu`, deployed 2026-05-18; commits in this window reference issues #99, #100.
- The time window between the two deployment timestamps is 2026-05-18 to 2026-05-20.

**Test Data:**
- Issues unique to staging window: #101, #102, #103
- Issues already in prod: #99, #100

**Steps:**
1. Run the environment comparison for `staging-main` vs `prod-eu` (as in TC-RDV-485).
2. Observe the "Issue Diff" section.

**Expected Result:**
- Issue Diff section shows issues #101, #102, #103 as "in staging but not yet in production".
- Issues #99 and #100 are NOT listed (they are already deployed to prod).
- Each issue in the diff is a clickable link to the Redmine issue.

---

### TC-RDV-487 — Cross-project environment IDs are rejected with 404

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Environment Comparison (rfd-121) |
| **Requirement Ref** | ENV-005 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- Project "Phoenix Platform" (ID: phoenix-platform) has environment ID 10 (`staging-main`).
- Project "Backend Services" (ID: backend-services) has environment ID 20 (`staging-backend`).
- User is a member of "Phoenix Platform" but NOT "Backend Services".

**Test Data:**
- Cross-project compare URL: `GET /projects/phoenix-platform/devops_environments/compare?a=10&b=20`

**Steps:**
1. Log in as a member of "Phoenix Platform" only.
2. Attempt to access: `/projects/phoenix-platform/devops_environments/compare?a=10&b=20`
   (where env ID 20 belongs to "Backend Services").

**Expected Result:**
- HTTP 404 response is returned.
- No environment data from "Backend Services" is exposed.
- No server error (500) occurs; the 404 is clean and intentional.

---

### TC-RDV-488 — Comparison result is cached for 60 seconds keyed on both SHAs

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Environment Comparison (rfd-121) |
| **Requirement Ref** | ENV-005 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Environment comparison is available for `staging-main` (SHA: abc123ef) and `prod-eu` (SHA: de12bc90).
- Cache is empty (or cleared before test).

**Test Data:**
- Env A SHA: abc123ef
- Env B SHA: de12bc90

**Steps:**
1. Execute the comparison for `staging-main` vs `prod-eu`. Note the server response time T1.
2. Immediately execute the same comparison again. Note response time T2.
3. Trigger a new deployment to `staging-main` to change its SHA (new SHA: ff00aa11).
4. Execute the comparison again.

**Expected Result:**
- Second request (T2) is significantly faster than T1, indicating a cache hit.
- The cache key includes both SHAs; when the staging SHA changes (step 3), the cache is invalidated.
- After SHA change, the third comparison retrieves fresh data (not the 60-second-old cached result).

---

### TC-RDV-489 — Comparison shows "no diff" when both environments are on the same version

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Environment Comparison (rfd-121) |
| **Requirement Ref** | ENV-005 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- Both `staging-main` and `prod-eu` have been successfully deployed at the same version: v2.5.0, SHA abc123ef.

**Test Data:**
- Both environments: version v2.5.0, SHA abc123ef

**Steps:**
1. Run environment comparison for `staging-main` vs `prod-eu`.
2. Observe the Issue Diff section.

**Expected Result:**
- The side-by-side view shows identical version, SHA, and deploy information on both sides.
- Issue Diff section shows an empty state: "No differences — both environments are on the same version."
- No errors or exceptions are thrown when both SHAs are identical.

---

### TC-RDV-490 — Compare endpoint requires view_devops permission

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Environment Comparison (rfd-121) |
| **Requirement Ref** | ENV-005 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- A non-member user (no project membership) attempts to access the compare endpoint.

**Test Data:**
- Non-member user: outsider@example.com with a valid Redmine API key
- URL: `GET /projects/phoenix-platform/devops_environments/compare?a=1&b=2`

**Steps:**
1. Log in as outsider@example.com (no project membership).
2. Attempt to navigate to `/projects/phoenix-platform/devops_environments/compare?a=1&b=2`.

**Expected Result:**
- HTTP 403 Forbidden is returned.
- No environment data is exposed.

---

## Additional Edge and Integration Cases

---

### TC-RDV-491 — Health check status turns yellow for degraded response (non-200, non-5xx)

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Environment Health Status (rfd-033) |
| **Requirement Ref** | ENV-002 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- Environment `staging-main` health URL returns HTTP 503 with a specific response body indicating "degraded" state.

**Test Data:**
- Health URL returns: HTTP 503 `{"status":"degraded","details":"DB replication lag > 30s"}`

**Steps:**
1. Configure the health endpoint mock to return HTTP 503.
2. Navigate to Project → DevOps → Environments.
3. Click "Check Now" for `staging-main`.

**Expected Result:**
- Status light shows yellow (degraded) rather than red (down).
- Tooltip or detail text shows "Degraded" status.
- Last check time is updated.
- No unhandled exception in the application logs.

---

### TC-RDV-492 — Environment list is scoped per project (no cross-project leakage)

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Environment Registry (rfd-032) |
| **Requirement Ref** | ENV-001 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- Project A "Phoenix Platform" has environments: `dev-local`, `staging-main`, `prod-eu`.
- Project B "Backend Services" has environments: `staging-backend`, `prod-backend`.
- User is a member of both projects.

**Test Data:**
- N/A

**Steps:**
1. Log in as a user who is a member of both projects.
2. Navigate to Project "Phoenix Platform" → DevOps → Environments.
3. Observe the environment list.
4. Navigate to Project "Backend Services" → DevOps → Environments.
5. Observe the environment list.

**Expected Result:**
- Phoenix Platform list shows only: `dev-local`, `staging-main`, `prod-eu`.
- Backend Services list shows only: `staging-backend`, `prod-backend`.
- No cross-contamination between projects.

---

### TC-RDV-493 — Freeze window admin: edit and delete operate correctly

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Deployment Freeze Windows (rfd-099) |
| **Requirement Ref** | ENV-003 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Freeze window `Pre-Demo Freeze` (inactive — scheduled for future date) exists.
- User has `manage_environments` permission.

**Test Data:**
- Updated freeze name: `Pre-Demo Freeze (Updated)`
- Updated start: 2026-06-12 18:00 UTC

**Steps:**
1. Navigate to freeze windows list.
2. Click "Edit" on `Pre-Demo Freeze`.
3. Update name and start time as above.
4. Click "Save".
5. Confirm the changes appear in the list.
6. Click "Delete" on the updated freeze window.
7. Confirm deletion.

**Expected Result:**
- After edit: freeze window shows updated name and start time.
- After delete: freeze window no longer appears in the list.
- No orphaned records remain in the `redmineflux_devops_freezes` table.

---

### TC-RDV-494 — Named scopes by_type and production filter correctly

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Environment Registry (rfd-032) |
| **Requirement Ref** | ENV-001 |
| **Priority** | Low |
| **Scenario Type** | Positive |

**Preconditions:**
- Project has 4 environments: `dev-local` (dev), `staging-main` (staging), `prod-eu` (prod), `perf-test` (custom).

**Test Data:**
- N/A (uses named scopes defined in rfd-032)

**Steps:**
1. Via REST API: `GET /projects/phoenix-platform/devops/environments.json?type=production`
2. Via REST API: `GET /projects/phoenix-platform/devops/environments.json?type=dev`

**Expected Result:**
- Type=production returns only `prod-eu`.
- Type=dev returns only `dev-local`.
- non_production scope (if exposed) returns `dev-local`, `staging-main`, `perf-test`.

---

### TC-RDV-495 — Environment with no deployment history shows empty state gracefully

| Field | Value |
|-------|-------|
| **Module** | Environment Management |
| **Feature** | Environment Registry (rfd-032), Environment Comparison (rfd-121) |
| **Requirement Ref** | ENV-001, ENV-005 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- A new environment `qa-sandbox` (type: custom) has been created but has never had a deployment.

**Test Data:**
- Environment: `qa-sandbox` — no deployments, no health check history

**Steps:**
1. Navigate to Project → DevOps → Environments.
2. Click on `qa-sandbox` to view its detail page.
3. Attempt to run environment comparison: `qa-sandbox` vs `staging-main`.

**Expected Result:**
- Detail page shows empty state for "Deployments": "No deployments recorded yet."
- Health status shows gray/"Unknown" (not green, yellow, or red).
- Comparison with `qa-sandbox` shows "No deployment data for qa-sandbox" in the left column; no server error is thrown.
- HTTP 200 is returned for both the detail page and the comparison endpoint.
