# Test Cases — Deployments — Redmineflux DevOps

| Field | Value |
|-------|-------|
| **Plugin** | redmineflux_devops |
| **Module** | Deployments |
| **TC Range** | TC-RDV-151 to TC-RDV-210 |
| **Total TCs** | 60 |
| **Requirement Coverage** | DEP-001, DEP-002, DEP-003, DEP-004, DEP-005, DEP-006, DEP-007, DEP-008, DEP-009 |

---

### TC-RDV-151 — Deployment history shows current version per environment

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deployment History (rfd-014) |
| **Requirement Ref** | DEP-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project "phoenix-platform" has three environments: dev, staging, production
- Each environment has at least one successful deployment recorded
  - dev: version v2.3.2, deployed 2026-05-20 09:00
  - staging: version v2.3.1, deployed 2026-05-19 14:30
  - production: version v2.3.0, deployed 2026-05-18 11:00
- User is logged in as QA Engineer with `view_devops` permission

**Test Data:**
- Environment dev: current version v2.3.2
- Environment staging: current version v2.3.1
- Environment production: current version v2.3.0

**Steps:**
1. Navigate to Project "phoenix-platform" → DevOps tab → Deployments sub-tab.
2. Observe the deployment list table.

**Expected Result:**
- The Deployments page loads with HTTP 200.
- A summary row or pinned header per environment shows the current deployed version.
- dev shows v2.3.2, staging shows v2.3.1, production shows v2.3.0.
- The "current version" row is visually distinct from historical deployment entries.

---

### TC-RDV-152 — Deployment history shows full history with rollback indicators

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deployment History (rfd-014) |
| **Requirement Ref** | DEP-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project "phoenix-platform" production environment has the following deployment history:
  - Deploy #10: v2.3.0, success, 2026-05-18 (is_rollback = false)
  - Deploy #9: v2.2.9, failed, 2026-05-17 (is_rollback = false)
  - Deploy #8: v2.2.8, rolled_back, 2026-05-16 (is_rollback = true, rollback_reason = "API errors after deploy")
  - Deploy #7: v2.2.7, success, 2026-05-15 (is_rollback = false)

**Test Data:**
- Environments: production
- Deployment history as described above

**Steps:**
1. Navigate to Project "phoenix-platform" → DevOps → Deployments.
2. Filter by environment: production.
3. Observe the full list of deployments.

**Expected Result:**
- All 4 historical deployments are listed in reverse chronological order.
- Deploy #8 is marked with a distinct rollback indicator (red revert icon or "Rollback" label).
- Deploy #8's rollback reason "API errors after deploy" is visible (inline or on hover/detail page).
- Deploy #9 (failed) is shown with a red failure icon.
- Deploy #10 (success, current) is shown with a green success icon.

---

### TC-RDV-153 — Deployment history filter by environment returns correct subset

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deployment History (rfd-014) |
| **Requirement Ref** | DEP-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project "phoenix-platform" has deployments across dev (5 records), staging (3 records), and production (4 records)

**Test Data:**
- Filter: environment = staging
- Expected results: 3 records (staging only)

**Steps:**
1. Navigate to Project "phoenix-platform" → DevOps → Deployments.
2. Open the environment filter dropdown.
3. Select "staging."
4. Observe the filtered results.

**Expected Result:**
- Exactly 3 deployment records are shown — all for the staging environment.
- dev and production deployment records are not displayed.
- The filter label shows "staging" as the active filter.
- A "Clear" option allows returning to all environments.

---

### TC-RDV-154 — Deployment history filter by date range excludes out-of-range records

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deployment History (rfd-014) |
| **Requirement Ref** | DEP-001 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Deployments across all environments from 2026-05-01 to 2026-05-20
- Deployments within 2026-05-15 to 2026-05-17: Deploy #7 (staging), Deploy #8 (prod), Deploy #9 (prod) — 3 records

**Test Data:**
- Date range from: 2026-05-15
- Date range to: 2026-05-17
- Expected records in range: 3

**Steps:**
1. Navigate to Project "phoenix-platform" → DevOps → Deployments.
2. Set the "From" date filter to 2026-05-15.
3. Set the "To" date filter to 2026-05-17.
4. Apply the filter.
5. Count the results.

**Expected Result:**
- Exactly 3 deployment records are returned (Deploy #7, #8, #9).
- Deployments before 2026-05-15 and after 2026-05-17 are excluded.
- The date range is shown in the filter UI.

---

### TC-RDV-155 — Deployment detail page shows issues included in the deployment

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deployment–Issue Linking (rfd-016) |
| **Requirement Ref** | DEP-003 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Deploy #10 (v2.3.0) to production includes commits referencing issues #195, #196, and #199
- These issue references are parsed from commit messages in the commit range between deploy #9 and deploy #10

**Test Data:**
- Deployment: #10 (v2.3.0, production)
- Included issues: #195, #196, #199

**Steps:**
1. Navigate to Project "phoenix-platform" → DevOps → Deployments.
2. Click on deploy #10 to open the deployment detail page.
3. Locate the "Issues Included" section.
4. Observe the listed issues.

**Expected Result:**
- Issues #195, #196, and #199 are listed in the "Issues Included" section.
- Each issue is shown with its ID, subject, and status (linked to the Redmine issue page).
- The section title reads "Issues Included" or "Issues in this deployment."

---

### TC-RDV-156 — Issue page shows "Deployed to staging" badge after deployment

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deployment–Issue Linking (rfd-016) |
| **Requirement Ref** | DEP-003 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Issue #196 is included in deploy #8 (v2.2.8) to staging environment
- The deployment record links issue #196 via the `deployment_issues` join table

**Test Data:**
- Issue: #196
- Deployment: #8 (v2.2.8, staging)
- Expected badge: "Deployed to staging (v2.2.8)"

**Steps:**
1. Navigate to issue #196 in project "phoenix-platform."
2. Scroll to the DevOps panel on the issue detail page.
3. Observe any deployment badge or deployment status indicator.

**Expected Result:**
- A deployment badge is visible on the issue: "Deployed to staging (v2.2.8)" or equivalent.
- If the issue has been deployed to multiple environments, multiple badges are shown (e.g., "Deployed to staging (v2.2.8)" and "Deployed to production (v2.3.0)").
- Each badge links to the corresponding deployment detail page.

---

### TC-RDV-157 — Environment dashboard shows cards for each environment with health status lights

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Environment Dashboard (rfd-015) |
| **Requirement Ref** | DEP-002 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project "phoenix-platform" has three environments registered: dev, staging, production
- dev: status=healthy (green)
- staging: status=degraded (yellow)
- production: status=healthy (green)
- User is logged in as PM with `view_devops` permission

**Test Data:**
- Environments: dev (healthy), staging (degraded), production (healthy)

**Steps:**
1. Navigate to Project "phoenix-platform" → DevOps → Environments sub-tab.
2. Observe the environment cards layout.

**Expected Result:**
- Three environment cards are displayed: dev, staging, production.
- dev card: green status light, current version v2.3.2, last deploy time shown.
- staging card: yellow status light, current version v2.3.1.
- production card: green status light, current version v2.3.0.
- Each card shows the environment name, current version, health status light, and last deployment timestamp.

---

### TC-RDV-158 — Environment dashboard auto-refreshes every 60 seconds

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Environment Dashboard (rfd-015) |
| **Requirement Ref** | DEP-002 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- The Environments page is open in a browser tab
- staging environment's health changes from degraded to healthy during the test

**Test Data:**
- Environment: staging
- Initial status: degraded (yellow)
- Updated status (after health check): healthy (green)

**Steps:**
1. Open Project "phoenix-platform" → DevOps → Environments.
2. Observe staging environment showing a yellow (degraded) status light.
3. Do NOT manually refresh the page.
4. Wait 65 seconds.
5. Observe the staging card again.

**Expected Result:**
- Within 65 seconds, the staging environment card's status light updates from yellow to green without a manual page reload.
- The auto-refresh is driven by a client-side timer that re-fetches environment status every 60 seconds.
- Other cards are also updated during the auto-refresh cycle.

---

### TC-RDV-159 — Environment dashboard shows "down" status as red light

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Environment Dashboard (rfd-015) |
| **Requirement Ref** | DEP-002 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- dev environment health check returns "down" (HTTP health endpoint returns 503)
- The `EnvironmentHealthChecker` has set dev's status to "down"

**Test Data:**
- Environment: dev
- Status: down

**Steps:**
1. Navigate to Project "phoenix-platform" → DevOps → Environments.
2. Observe the dev environment card.

**Expected Result:**
- The dev environment card displays a red status light.
- A "Down" label or red indicator text is clearly visible.
- This is visually distinct from the yellow "degraded" light and green "healthy" light.

---

### TC-RDV-160 — Non-member cannot access the Deployments page

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deployment History (rfd-014) |
| **Requirement Ref** | DEP-001 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User extern@example.com is NOT a member of project "phoenix-platform"
- The project is private

**Test Data:**
- User: extern@example.com (non-member)
- Target: `/projects/phoenix-platform/devops_deployments`

**Steps:**
1. Log in as extern@example.com.
2. Navigate directly to `/projects/phoenix-platform/devops_deployments`.
3. Observe the HTTP response.

**Expected Result:**
- HTTP 403 Forbidden or a redirect to the access-denied page is returned.
- No deployment data is visible to the non-member.
- The error message does not reveal project details.

---

### TC-RDV-161 — Deployment approval gate holds deployment until approved

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deployment Approval Gate (rfd-080) |
| **Requirement Ref** | DEP-004 |
| **Priority** | High |
| **Scenario Type** | Workflow |

**Preconditions:**
- Environment "production" has `approval_required = true`
- DeploymentDispatcher has received a deploy request for version v2.3.1 to production
- No approval has been granted yet

**Test Data:**
- Environment: production
- Version: v2.3.1
- Approval required: true
- Status: pending approval

**Steps:**
1. Trigger a deployment via webhook or REST API to the production environment (version v2.3.1).
2. Navigate to Project "phoenix-platform" → DevOps → Deployments.
3. Observe the new deployment record.

**Expected Result:**
- A new deployment record appears with status "pending_approval" or "awaiting_approval."
- The deployment has NOT been dispatched to the CI/CD provider yet.
- An "Approve" button and "Reject" button with a comment field are visible on the deployment detail page.
- The deployment is blocked from proceeding until an authorized approver acts.

---

### TC-RDV-162 — Only users with approve_deployments permission can approve a deployment

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deployment Approval Gate (rfd-080) |
| **Requirement Ref** | DEP-004 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- Deployment #11 is awaiting approval for production
- Three users:
  - alice@example.com — Developer (no `approve_deployments` permission)
  - bob@example.com — Manager (has `approve_deployments` permission)
  - carol@example.com — Admin (has `approve_deployments` permission)

**Test Data:**
- Deployment: #11 (awaiting approval, production)
- Users and permissions as described

**Steps:**
1. Log in as alice@example.com (Developer).
2. Navigate to deployment #11 detail page.
3. Observe whether the "Approve" button is visible.
4. Log out; log in as bob@example.com (Manager).
5. Navigate to deployment #11 detail page.
6. Observe whether the "Approve" button is visible.

**Expected Result:**
- alice (Developer): The "Approve" and "Reject" buttons are NOT visible (or not clickable).
- Attempting approval via the REST API as alice returns HTTP 403 Forbidden.
- bob (Manager): The "Approve" and "Reject" buttons ARE visible and functional.
- carol (Admin): The "Approve" and "Reject" buttons ARE visible and functional.

---

### TC-RDV-163 — Approved deployment proceeds and audit trail is recorded

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deployment Approval Gate (rfd-080) |
| **Requirement Ref** | DEP-004 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Deployment #11 is in "pending_approval" state for production
- User bob@example.com (Manager) is logged in and has `approve_deployments` permission

**Test Data:**
- Deployment: #11 (v2.3.1, production)
- Approver: bob@example.com
- Approval comment: "Verified QA sign-off received. Approving for production."
- Approval timestamp: 2026-05-21 10:45:00

**Steps:**
1. Log in as bob@example.com.
2. Navigate to deployment #11 detail page.
3. Enter the approval comment in the comment field.
4. Click the "Approve" button.
5. Observe the page response and deployment status.
6. Navigate to the deployment's audit trail.

**Expected Result:**
- The deployment status changes from "pending_approval" to "running" or "dispatched."
- The CI/CD provider (GitHub Actions/GitLab/Jenkins) receives the deployment trigger.
- The audit trail shows:
  - Approver: bob@example.com
  - Timestamp: 2026-05-21 10:45:00
  - Comment: "Verified QA sign-off received. Approving for production."
- A success flash message: "Deployment approved and dispatched."

---

### TC-RDV-164 — Rejected deployment is logged but not executed

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deployment Approval Gate (rfd-080) |
| **Requirement Ref** | DEP-004 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- Deployment #12 (v2.3.2, production) is in "pending_approval" state
- bob@example.com (Manager) decides to reject the deployment

**Test Data:**
- Deployment: #12 (v2.3.2, production)
- Rejector: bob@example.com
- Rejection reason: "Release blocker #211 is still open. Cannot deploy."

**Steps:**
1. Log in as bob@example.com.
2. Navigate to deployment #12 detail page.
3. Enter the rejection reason in the comment field.
4. Click the "Reject" button.
5. Observe the deployment status and CI/CD provider activity.

**Expected Result:**
- The deployment status changes to "rejected."
- NO deployment is dispatched to the CI/CD provider (GitHub Actions/GitLab/Jenkins).
- The audit trail records:
  - Rejector: bob@example.com
  - Timestamp: (current)
  - Comment: "Release blocker #211 is still open. Cannot deploy."
- A message confirms the deployment was rejected and logged.

---

### TC-RDV-165 — Deployment approval audit trail captures approver, timestamp, and comment

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deployment Approval Gate (rfd-080) |
| **Requirement Ref** | DEP-004 |
| **Priority** | High |
| **Scenario Type** | Validation |

**Preconditions:**
- Deployment #11 was approved by bob@example.com as per TC-RDV-163

**Test Data:**
- Deployment: #11
- Expected audit fields: approver = bob@example.com, timestamp = 2026-05-21 10:45:00, comment = "Verified QA sign-off received. Approving for production."

**Steps:**
1. Navigate to deployment #11 detail page.
2. Locate the "Approval History" or "Audit Trail" section.
3. Review all fields in the approval record.

**Expected Result:**
- The audit trail entry is immutable (no edit/delete button is visible for approval records).
- The record shows exactly: who approved (bob@example.com), when (2026-05-21 10:45:00 UTC), and the comment.
- The audit trail is accessible only to authorized users (Admin, DevOps Engineer, Manager).

---

### TC-RDV-166 — Rollback deployment is recorded with is_rollback flag and rollback reason

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Rollback Tracking (rfd-081) |
| **Requirement Ref** | DEP-005 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Production environment has deploy #10 (v2.3.0) as the current version
- A rollback to deploy #7 (v2.2.7) is initiated due to production errors

**Test Data:**
- Deployment being rolled back: #10 (v2.3.0)
- Rollback to: #7 (v2.2.7)
- Rollback reason: "Regression in checkout flow causing 500 errors"
- New deployment record: #13 (is_rollback = true, reverts_deployment_id = 10)

**Steps:**
1. Trigger a rollback deployment via webhook or REST API with `is_rollback=true`, `reverts_deployment_id=10`, and `rollback_reason="Regression in checkout flow causing 500 errors"`.
2. Navigate to Project "phoenix-platform" → DevOps → Deployments.
3. Observe deployment #13.

**Expected Result:**
- Deployment #13 appears in the history with a rollback icon (red revert arrow) and label.
- The `is_rollback` flag is true and `rollback_reason` = "Regression in checkout flow causing 500 errors" is displayed.
- The record links to deployment #10 (the deployment being reverted).
- The production environment's current version reverts to v2.2.7.

---

### TC-RDV-167 — Rollback is counted in DORA Change Failure Rate denominator

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Rollback Tracking (rfd-081) |
| **Requirement Ref** | DEP-005 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- In the last 30 days, production has 10 total deployments:
  - 8 successful (no rollback, no incident)
  - 1 rollback (#13, is_rollback = true)
  - 1 failed (status = failed)
- Change Failure Rate = (1 rollback + 1 failed) / 10 total = 20%

**Test Data:**
- Total deployments: 10
- Failures in denominator: 2 (1 rollback + 1 failed)
- Expected Change Failure Rate: 20%

**Steps:**
1. Navigate to Project "phoenix-platform" → DevOps → Metrics (or DORA dashboard).
2. Observe the Change Failure Rate metric.

**Expected Result:**
- Change Failure Rate shows 20%.
- The rollback (#13) is counted in the failure denominator.
- The DORA metric classification is displayed (e.g., "Medium" for 20%).

---

### TC-RDV-168 — Deployment lock can be created with reason and expiry

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deployment Lock (rfd-082) |
| **Requirement Ref** | DEP-006 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Production environment "phoenix-platform/production" is currently unlocked
- User is a DevOps Engineer (has `manage_devops_settings` or Lock/Unlock permission)

**Test Data:**
- Environment: production
- Lock reason: "Pre-demo freeze: investor presentation on 2026-05-22 at 14:00"
- Lock expiry: 2026-05-22 16:00:00

**Steps:**
1. Navigate to Project "phoenix-platform" → DevOps → Environments.
2. Click on the production environment card.
3. Click the "Lock" button.
4. Enter the lock reason and expiry time.
5. Confirm the lock.
6. Observe the production environment card.

**Expected Result:**
- The production environment card shows a lock icon with the lock reason.
- The lock expiry time is displayed: "Locked until 2026-05-22 16:00."
- The "Deploy" button is disabled or hidden while the lock is active.
- The lock creator's name is shown (e.g., "Locked by devops@example.com").

---

### TC-RDV-169 — Deploy button is disabled while deployment lock is active

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deployment Lock (rfd-082) |
| **Requirement Ref** | DEP-006 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- Production environment has an active deployment lock (reason: "Pre-demo freeze", expiry: 2026-05-22 16:00)
- User david@example.com (Developer) attempts to deploy

**Test Data:**
- Environment: production
- Lock active: true, not expired
- Attempting user: david@example.com

**Steps:**
1. Log in as david@example.com.
2. Navigate to the production environment card.
3. Attempt to click "Deploy" or navigate to the deploy workflow.

**Expected Result:**
- The "Deploy" button is disabled (greyed out) or completely absent.
- Hovering over the disabled button shows a tooltip: "Deployment locked: Pre-demo freeze: investor presentation on 2026-05-22 at 14:00. Locked until 2026-05-22 16:00."
- Attempting to deploy via the REST API returns HTTP 423 Locked (or 422 Unprocessable Entity) with a message indicating the lock.

---

### TC-RDV-170 — Expired deployment lock does not block deployment

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deployment Lock (rfd-082) |
| **Requirement Ref** | DEP-006 |
| **Priority** | High |
| **Scenario Type** | Edge |

**Preconditions:**
- A deployment lock existed on production with `locked_until = 2026-05-21 08:00:00`
- The current time is 2026-05-21 09:30:00 (lock has expired)

**Test Data:**
- Environment: production
- Lock expiry: 2026-05-21 08:00:00 (in the past)
- Current time: 2026-05-21 09:30:00

**Steps:**
1. Navigate to the production environment card at current time 09:30.
2. Observe whether the lock indicator is shown.
3. Attempt to initiate a deployment to production.

**Expected Result:**
- The lock is NOT shown as active (the `unexpired_locks` scope correctly excludes expired locks).
- The "Deploy" button is enabled.
- The deployment proceeds without encountering a lock error.
- The expired lock may still appear in the lock history for audit purposes, but does not block operations.

---

### TC-RDV-171 — Only authorized roles can create or remove a deployment lock

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deployment Lock (rfd-082) |
| **Requirement Ref** | DEP-006 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- Production environment is currently unlocked
- Three users:
  - alice@example.com — Developer (cannot lock/unlock)
  - bob@example.com — Manager (can lock/unlock per permissions matrix)
  - devops@example.com — DevOps Engineer (can lock/unlock)

**Test Data:**
- Attempting to lock: Developer alice, Manager bob, DevOps devops

**Steps:**
1. Log in as alice@example.com and attempt to lock the production environment.
2. Log out; log in as bob@example.com and attempt to lock production.
3. Log out; log in as devops@example.com and attempt to lock production.

**Expected Result:**
- alice: The "Lock" button is not visible; direct API attempt returns HTTP 403.
- bob: The "Lock" button is visible; locking succeeds.
- devops@example.com: The "Lock" button is visible; locking succeeds.

---

### TC-RDV-172 — Post-deployment health check polls every 30 seconds for up to 5 minutes

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Post-Deployment Health Check (rfd-083) |
| **Requirement Ref** | DEP-007 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Deploy #10 to production (v2.3.0) was just completed with status "success"
- The production environment has a health check URL configured: `https://api.phoenix-platform.com/health`
- The `DevopsPostDeployHealthJob` ActiveJob is enabled

**Test Data:**
- Deployment: #10 (production, v2.3.0)
- Health endpoint: https://api.phoenix-platform.com/health
- Health polling interval: 30 seconds
- Max polling duration: 5 minutes (10 polls)

**Steps:**
1. Complete a successful deployment to production (deploy #10).
2. Monitor the deployment #10 detail page over the next 5 minutes.
3. Observe the health check status updates.

**Expected Result:**
- The health check starts automatically after deploy #10 completes.
- Health status updates every 30 seconds on the deployment card.
- After the first health check returns "healthy," the deployment card shows green health status.
- If the health endpoint consistently returns healthy, the card remains green after 5 minutes and health polling stops.
- The deployment detail page shows the health check history (time of each check, result).

---

### TC-RDV-173 — Post-deployment health check auto-creates incident when health returns "down"

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Post-Deployment Health Check (rfd-083) |
| **Requirement Ref** | DEP-007 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Deploy #14 to production (v2.3.2) was just completed
- The health endpoint `https://api.phoenix-platform.com/health` returns HTTP 503 on all health check polls
- The `DevopsPostDeployHealthJob` detects a "down" response

**Test Data:**
- Deployment: #14 (production, v2.3.2)
- Health endpoint response: HTTP 503 (down)
- Expected action: auto-create incident

**Steps:**
1. Trigger deploy #14 to production.
2. Confirm the health endpoint returns 503 on the next poll.
3. Navigate to Project "phoenix-platform" → DevOps → Incidents.
4. Check for an automatically created incident.

**Expected Result:**
- An incident is automatically created in the Incidents tracker with:
  - Tracker: Incident
  - Priority: Urgent
  - Subject: "Post-deployment health check failed: production v2.3.2" (or equivalent)
  - Description includes deployment #14 details and the failed health check timestamp.
- The incident is linked to deployment #14.
- The production environment status is updated to "down" (red light on the environment dashboard).

---

### TC-RDV-174 — Canary rollout progress bar shows rollout_percent as 0–100

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Canary / Progressive Rollout (rfd-110) |
| **Requirement Ref** | DEP-008 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Project "phoenix-platform" is connected to ArgoCD
- Deploy #15 is a canary deployment to production with rollout_percent currently at 25%
- An ArgoCD webhook event has updated the rollout progress

**Test Data:**
- Deployment: #15 (canary, production)
- rollout_percent: 25
- rollout_strategy: canary
- rollout_status: in_progress

**Steps:**
1. Send an ArgoCD webhook event (identified by User-Agent header) for deployment #15 with rollout_percent = 25.
2. Navigate to deployment #15 detail page.
3. Observe the rollout progress display.

**Expected Result:**
- A progress bar is shown on deployment #15's detail card.
- The progress bar is at 25% width with a label "25% rolled out."
- The rollout strategy is shown as "Canary."
- The rollout status is "In Progress."

---

### TC-RDV-175 — Canary rollout_percent is clamped to 0 minimum and 100 maximum

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Canary / Progressive Rollout (rfd-110) |
| **Requirement Ref** | DEP-008 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- An ArgoCD webhook arrives for deployment #15 with rollout_percent = 110 (out of valid range)

**Test Data:**
- Deployment: #15
- Incoming rollout_percent: 110 (invalid, over 100)

**Steps:**
1. Send an ArgoCD webhook event for deployment #15 with `rollout_percent: 110`.
2. Navigate to deployment #15 detail page.
3. Observe the rollout_percent displayed.

**Expected Result:**
- The stored rollout_percent is clamped to 100 (not 110).
- The progress bar shows 100% width.
- No database error or 500 occurs from receiving an out-of-range value.
- Similarly, a negative value (e.g., -5) would be clamped to 0.

---

### TC-RDV-176 — ArgoCD webhook events are correctly identified by User-Agent header

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Canary / Progressive Rollout (rfd-110) |
| **Requirement Ref** | DEP-008 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- An ArgoCD instance sends rollout updates via webhook
- The webhook is received at `POST /devops/webhook/argocd/phoenix-platform`
- User-Agent header contains "ArgoCD" identifier

**Test Data:**
- Webhook endpoint: `POST /devops/webhook/argocd/phoenix-platform`
- User-Agent: "ArgoCD/2.9.0"
- Payload: rollout update for deployment #15

**Steps:**
1. Send a POST request to `/devops/webhook/argocd/phoenix-platform` with the ArgoCD User-Agent header and a valid rollout payload.
2. Navigate to deployment #15 detail page.

**Expected Result:**
- The webhook is correctly routed to the ArgoCD handler (identified by User-Agent).
- The rollout progress is updated on deployment #15.
- No "unrecognized provider" error is returned.

---

### TC-RDV-177 — Deploy from Redmine triggers GitHub Actions workflow_dispatch

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deploy from Redmine (rfd-111) |
| **Requirement Ref** | DEP-009 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Staging environment is configured with:
  - `deploy_provider: github_actions`
  - `deploy_workflow: deploy.yml`
  - `deploy_ref_param: ref`
- User david@example.com (Developer) has `trigger_devops_deployment` permission
- No locks, freeze windows, or pending approvals on staging
- No more than 4 deploy triggers have been used in the current hour

**Test Data:**
- Environment: staging
- Version/branch to deploy: v2.3.2 (branch: main, ref: refs/heads/main)
- Provider: github_actions

**Steps:**
1. Log in as david@example.com.
2. Navigate to Project "phoenix-platform" → DevOps → Environments.
3. Click "Deploy" on the staging environment card.
4. Select version "v2.3.2" (or branch "main").
5. Click "Confirm Deploy."
6. Observe the response.

**Expected Result:**
- Redmine's `DeploymentDispatcher` calls the GitHub Actions `workflow_dispatch` API for `deploy.yml` on branch `refs/heads/main`.
- A success message: "Deployment triggered to staging (v2.3.2)."
- A new deployment record #16 is created in the database with status "running."
- The staging environment card updates to show a deployment in progress.

---

### TC-RDV-178 — Deploy from Redmine triggers GitLab CI play endpoint

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deploy from Redmine (rfd-111) |
| **Requirement Ref** | DEP-009 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project "atlas-backend" staging environment is configured with:
  - `deploy_provider: gitlab_ci`
  - `deploy_workflow: 56789` (GitLab pipeline ID to play)
- User has `trigger_devops_deployment` permission
- No pre-flight blockers

**Test Data:**
- Environment: staging (atlas-backend)
- Provider: gitlab_ci
- GitLab pipeline job ID: 56789

**Steps:**
1. Log in as a user with `trigger_devops_deployment` permission.
2. Navigate to Project "atlas-backend" → DevOps → Environments.
3. Click "Deploy" on the staging card.
4. Confirm the deploy action.

**Expected Result:**
- Redmine calls the GitLab CI "play" endpoint for pipeline job 56789.
- A deployment record is created for atlas-backend/staging.
- A success confirmation message is displayed.

---

### TC-RDV-179 — Deploy from Redmine triggers Jenkins parameterized build

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deploy from Redmine (rfd-111) |
| **Requirement Ref** | DEP-009 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project "legacy-service" production environment is configured with:
  - `deploy_provider: jenkins`
  - `deploy_workflow: legacy-service-deploy`
  - `deploy_ref_param: BRANCH`
- User has `trigger_devops_deployment` permission
- Production requires approval — approval has already been granted

**Test Data:**
- Environment: production (legacy-service)
- Provider: jenkins
- Jenkins job: legacy-service-deploy
- Branch param: main

**Steps:**
1. Log in with `trigger_devops_deployment` permission.
2. Navigate to Project "legacy-service" → DevOps → Environments → production.
3. Click "Deploy," choose version "main."
4. Confirm deploy.

**Expected Result:**
- Redmine dispatches a parameterized Jenkins build for job `legacy-service-deploy` with `BRANCH=main`.
- A deployment record is created.
- Success confirmation is displayed.

---

### TC-RDV-180 — Deploy from Redmine requires trigger_devops_deployment permission

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deploy from Redmine (rfd-111) |
| **Requirement Ref** | DEP-009 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- Staging environment is unlocked with no freeze window
- User qa_user@example.com is a QA Engineer (does NOT have `trigger_devops_deployment` permission)
- User devops@example.com is a DevOps Engineer (DOES have `trigger_devops_deployment` permission)

**Test Data:**
- Users: qa_user (QA, no deploy permission), devops (DevOps, has deploy permission)

**Steps:**
1. Log in as qa_user@example.com.
2. Navigate to the staging environment card.
3. Look for the "Deploy" button.
4. Log out; log in as devops@example.com.
5. Navigate to the staging environment card.
6. Observe the "Deploy" button.

**Expected Result:**
- qa_user: The "Deploy" button is absent or disabled; API attempt returns HTTP 403.
- devops@example.com: The "Deploy" button is visible and clickable.

---

### TC-RDV-181 — Deploy from Redmine pre-flight check blocks deployment during active freeze window

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deploy from Redmine (rfd-111) |
| **Requirement Ref** | DEP-009 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- A freeze window is active for production: "Sprint end freeze" from 2026-05-21 17:00 to 2026-05-22 08:00
- Current time is 2026-05-21 18:30 (within the freeze)
- User devops@example.com attempts to deploy to production

**Test Data:**
- Freeze window: 2026-05-21 17:00–2026-05-22 08:00 (active)
- Current time: 2026-05-21 18:30
- Deployment target: production

**Steps:**
1. Log in as devops@example.com.
2. Navigate to production environment card.
3. Click "Deploy."
4. Confirm the deployment in the dialog.
5. Observe the pre-flight check result.

**Expected Result:**
- The deployment is blocked by the `DeploymentDispatcher` pre-flight check.
- Error message: "Deployment blocked: active freeze window 'Sprint end freeze' is in effect until 2026-05-22 08:00."
- No deployment is dispatched to the CI/CD provider.
- The freeze window reason and expiry are clearly shown in the error.

---

### TC-RDV-182 — Deploy from Redmine is blocked when environment is locked

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deploy from Redmine (rfd-111) |
| **Requirement Ref** | DEP-009 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- Production environment has an active lock (reason: "Pre-demo freeze", locked by bob@example.com, locked_until = 2026-05-22 16:00)
- devops@example.com attempts to deploy

**Test Data:**
- Lock: active on production, locked_until = future
- Deploying user: devops@example.com

**Steps:**
1. Log in as devops@example.com.
2. Attempt to deploy to the locked production environment.

**Expected Result:**
- The pre-flight check fails with a lock error.
- Error message: "Deployment blocked: environment 'production' is locked by bob@example.com until 2026-05-22 16:00. Reason: Pre-demo freeze."
- No dispatch occurs.

---

### TC-RDV-183 — Deploy from Redmine is blocked when required approval is pending

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deploy from Redmine (rfd-111) |
| **Requirement Ref** | DEP-009 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- Production environment requires deployment approval (`approval_required = true`)
- A deployment request for v2.3.2 is in "pending_approval" state
- A second deployment request for v2.3.3 is attempted without waiting for the first to be resolved

**Test Data:**
- Deployment #16: v2.3.2, pending_approval
- Attempted deployment: v2.3.3

**Steps:**
1. Log in as devops@example.com.
2. Attempt to trigger a deployment of v2.3.3 to production while #16 is still pending approval.

**Expected Result:**
- The pre-flight check fails.
- Error message: "Deployment blocked: a deployment to production is already pending approval (Deployment #16). Approve or reject it before initiating a new deployment."
- No new deployment is dispatched.

---

### TC-RDV-184 — Deploy from Redmine is blocked when CRITICAL security vulnerabilities are open (security gate enabled)

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deploy from Redmine (rfd-111) |
| **Requirement Ref** | DEP-009 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- Production environment has `security_gate_enabled = true`
- Project "phoenix-platform" has 2 open CRITICAL severity vulnerabilities in `redmineflux_devops_vulnerabilities`
- devops@example.com does NOT have `override_security_gate` permission

**Test Data:**
- Open CRITICAL vulnerabilities: 2 (CVE-2026-1234, CVE-2026-5678)
- security_gate_enabled: true on production
- Attempting user: devops@example.com (no override permission)

**Steps:**
1. Log in as devops@example.com.
2. Attempt to deploy to production.
3. Observe the pre-flight check result.

**Expected Result:**
- The deployment is blocked by the `SecurityGate` service.
- Error message: "Deployment blocked: 2 CRITICAL vulnerabilities must be resolved before deploying to production. CVE-2026-1234, CVE-2026-5678."
- No deployment is dispatched.

---

### TC-RDV-185 — Deploy from Redmine is rate-limited to 5 triggers per hour

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deploy from Redmine (rfd-111) |
| **Requirement Ref** | DEP-009 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- devops@example.com has already triggered 5 deployments from Redmine in the current hour
- All 5 were to different environments (dev × 3, staging × 2)

**Test Data:**
- Rate limit: 5 deploy triggers per hour
- Triggers already used: 5
- 6th attempt: deploy to staging

**Steps:**
1. Log in as devops@example.com.
2. Attempt to trigger a 6th deployment from Redmine within the same hour.
3. Observe the response.

**Expected Result:**
- HTTP 429 (or equivalent error flash message): "Rate limit exceeded: maximum 5 deployment triggers per hour."
- The 6th deployment is not dispatched.
- The user is informed when the rate limit resets.

---

### TC-RDV-186 — Deployment history detail page shows all metadata fields

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deployment History (rfd-014) |
| **Requirement Ref** | DEP-001 |
| **Priority** | Medium |
| **Scenario Type** | Validation |

**Preconditions:**
- Deploy #10 (v2.3.0, production) has the following recorded metadata:
  - version: v2.3.0
  - commit_sha: a1b2c3d4e5
  - deployed_by: devops@example.com
  - started_at: 2026-05-18 10:55:00
  - finished_at: 2026-05-18 11:03:00
  - status: success
  - url: https://deploy.example.com/runs/10

**Test Data:**
- Deployment: #10 as described above

**Steps:**
1. Navigate to deployment #10 detail page.
2. Verify all metadata fields are displayed.

**Expected Result:**
- All 7 metadata fields are visible: version, commit SHA (as short SHA + link), deployed_by name, start time, finish time, status badge, and deployment URL.
- The duration is calculated and shown: "8 minutes."
- The commit SHA links to the source commit on GitHub/GitLab.

---

### TC-RDV-187 — Environment dashboard shows "unknown" health for environments with no health check configured

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Environment Dashboard (rfd-015) |
| **Requirement Ref** | DEP-002 |
| **Priority** | Low |
| **Scenario Type** | Edge |

**Preconditions:**
- A new environment "uat" has been added to project "phoenix-platform"
- No health check URL is configured for the "uat" environment

**Test Data:**
- Environment: uat
- Health check URL: not configured
- Expected status: unknown

**Steps:**
1. Navigate to Project "phoenix-platform" → DevOps → Environments.
2. Observe the "uat" environment card.

**Expected Result:**
- The uat card displays a gray status light (unknown status).
- The card does NOT show "down" or "degraded" for an unconfigured health endpoint.
- The status label reads "Unknown" or equivalent neutral text.

---

### TC-RDV-188 — Multiple environments per project are all displayed on the environment dashboard

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Environment Dashboard (rfd-015) |
| **Requirement Ref** | DEP-002 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Project "phoenix-platform" has 5 environments: dev, qa, staging, uat, production

**Test Data:**
- Environments: dev, qa, staging, uat, production (5 total)

**Steps:**
1. Navigate to Project "phoenix-platform" → DevOps → Environments.
2. Count the environment cards displayed.

**Expected Result:**
- All 5 environment cards are visible.
- Cards are ordered logically (e.g., dev → qa → staging → uat → production, following the `auto-position ordering based on environment type` from rfd-032).
- Each card shows environment name, type badge (dev/staging/prod/custom), current version, and health status.

---

### TC-RDV-189 — Deployment linked issues count is zero when commit range has no issue references

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deployment–Issue Linking (rfd-016) |
| **Requirement Ref** | DEP-003 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- Deploy #17 to staging included commits with no issue ID references in their messages (no "Fixes #X" or "refs #X" patterns)

**Test Data:**
- Deployment: #17 (staging)
- Commits in range: 3 commits, none reference Redmine issue IDs

**Steps:**
1. Navigate to deployment #17 detail page.
2. Locate the "Issues Included" section.

**Expected Result:**
- The "Issues Included" section shows 0 issues (or a message: "No issues linked to this deployment").
- No error occurs; the section renders cleanly with an empty state message.
- The deployment itself is unaffected by the absence of issue links.

---

### TC-RDV-190 — Deployment approval can only be performed once per deployment (immutable)

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deployment Approval Gate (rfd-080) |
| **Requirement Ref** | DEP-004 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- Deployment #11 was approved by bob@example.com and is in "dispatched" state
- bob attempts to approve or modify the approval record again

**Test Data:**
- Deployment: #11 (already approved)
- Action: attempt second approval or retraction

**Steps:**
1. Log in as bob@example.com.
2. Navigate to deployment #11 detail page.
3. Observe whether an "Approve" or "Reject" button is still present.
4. If present, attempt a second approval action.

**Expected Result:**
- The "Approve" and "Reject" buttons are no longer available after the deployment has been approved and dispatched.
- Attempting a second approval via the REST API returns HTTP 422 or 409 with message "Deployment has already been approved."
- The original approval record is immutable and cannot be deleted.

---

### TC-RDV-191 — Health check result "degraded" updates environment card to yellow

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Post-Deployment Health Check (rfd-083) |
| **Requirement Ref** | DEP-007 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Deploy #18 to staging completed successfully
- Staging health endpoint returns HTTP 200 with a degraded signal (e.g., slow response or partial degradation)
- `EnvironmentHealthChecker` interprets this as "degraded"

**Test Data:**
- Deployment: #18 (staging)
- Health response: 200 with degraded flag
- Expected environment status: degraded (yellow)

**Steps:**
1. Complete deploy #18 to staging.
2. Wait for the first health poll (within 30 seconds).
3. Navigate to the Environments dashboard.
4. Observe the staging card's status light.

**Expected Result:**
- The staging environment card shows a yellow status light.
- The status label reads "Degraded."
- No auto-incident is created (incident creation is reserved for "down" status only).

---

### TC-RDV-192 — Health check stops after 5 minutes (10 polls × 30 seconds) if health never returns healthy

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Post-Deployment Health Check (rfd-083) |
| **Requirement Ref** | DEP-007 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- Deploy #19 to production completed
- Health endpoint has been returning "down" for every 30-second poll over 5 minutes (10 polls)

**Test Data:**
- Deployment: #19
- Health check polls: 10 × 30s = 300 seconds (5 minutes)
- Each poll result: down

**Steps:**
1. Complete deploy #19 to production.
2. Ensure the health endpoint returns "down" consistently.
3. Wait 5 minutes and 30 seconds.
4. Observe whether additional health polls continue beyond the 5-minute window.

**Expected Result:**
- The `DevopsPostDeployHealthJob` stops polling after 10 attempts (5 minutes total).
- No further health checks are made after the 10th poll.
- The auto-created incident (from TC-RDV-173) remains open.
- The deployment card's health status shows "Down" as the final state.

---

### TC-RDV-193 — Canary deployment progress updates from 25% to 50% on next ArgoCD webhook

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Canary / Progressive Rollout (rfd-110) |
| **Requirement Ref** | DEP-008 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Deployment #15 has rollout_percent = 25 (from TC-RDV-174)
- ArgoCD sends an update with rollout_percent = 50

**Test Data:**
- Deployment: #15
- Previous rollout_percent: 25
- New rollout_percent from webhook: 50

**Steps:**
1. Send an ArgoCD webhook event for deployment #15 with rollout_percent = 50.
2. Navigate to deployment #15 detail page.
3. Observe the progress bar.

**Expected Result:**
- The progress bar updates to 50%.
- The label reads "50% rolled out."
- The deployment status remains "in_progress."

---

### TC-RDV-194 — Canary deployment at 100% shows as fully deployed

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Canary / Progressive Rollout (rfd-110) |
| **Requirement Ref** | DEP-008 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Deployment #15 has been progressing through canary rollout
- ArgoCD sends a final webhook with rollout_percent = 100 and rollout_status = "healthy"

**Test Data:**
- Deployment: #15
- rollout_percent: 100
- rollout_status: healthy

**Steps:**
1. Send an ArgoCD webhook for deployment #15 with rollout_percent = 100 and rollout_status = "healthy."
2. Navigate to deployment #15 detail page.

**Expected Result:**
- The progress bar shows 100%.
- The deployment card shows the rollout as complete.
- The deployment status updates to "success" (or the rollout_status "healthy" is displayed).
- The production environment card updates to show v2.3.2 as the current version.

---

### TC-RDV-195 — Deployment record is created with all required fields on successful webhook

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deployment History (rfd-014) |
| **Requirement Ref** | DEP-001 |
| **Priority** | High |
| **Scenario Type** | Validation |

**Preconditions:**
- A deployment webhook event is received for project "phoenix-platform" / staging environment

**Test Data:**
- Webhook payload fields:
  - version: v2.3.1
  - commit_sha: b7c8d9e0f1
  - deployed_by: devops@example.com
  - environment: staging
  - status: success
  - url: https://staging.phoenix-platform.com

**Steps:**
1. Send a deployment success webhook to `POST /devops/webhook/github/phoenix-platform` with the above fields.
2. Navigate to Project "phoenix-platform" → DevOps → Deployments.
3. Open the new deployment detail page.

**Expected Result:**
- A new deployment record is created with all fields populated:
  - version = v2.3.1
  - commit_sha = b7c8d9e0f1
  - deployed_by = devops@example.com
  - environment = staging
  - status = success
  - url = https://staging.phoenix-platform.com
  - started_at and finished_at are recorded
- The record appears at the top of the Deployments list.

---

### TC-RDV-196 — Developer role cannot approve production deployments

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deployment Approval Gate (rfd-080) |
| **Requirement Ref** | DEP-004 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- Deployment #20 (v2.4.0, production) is pending approval
- alice@example.com is a Developer (no `approve_deployments` permission)

**Test Data:**
- Deployment: #20 (pending_approval)
- User: alice@example.com (Developer role)
- API endpoint: `POST /projects/phoenix-platform/devops_deployments/20/approve`

**Steps:**
1. Log in as alice@example.com.
2. Navigate to deployment #20 detail page.
3. Attempt approval via the UI (if button appears) or directly via the REST API endpoint.
4. Observe the response.

**Expected Result:**
- UI: No "Approve" button is rendered for alice.
- REST API: HTTP 403 Forbidden is returned.
- The deployment remains in "pending_approval" state.
- An unauthorized attempt is logged in the DevOps audit log.

---

### TC-RDV-197 — Deployment issue badges are shown on multiple issues linked to the same deployment

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deployment–Issue Linking (rfd-016) |
| **Requirement Ref** | DEP-003 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Deploy #10 is linked to issues #195, #196, and #199
- All three issues are open in project "phoenix-platform"

**Test Data:**
- Deployment: #10 (v2.3.0, production)
- Linked issues: #195, #196, #199

**Steps:**
1. Navigate to issue #195.
2. Observe the deployment badge.
3. Navigate to issue #196.
4. Observe the deployment badge.
5. Navigate to issue #199.
6. Observe the deployment badge.

**Expected Result:**
- All three issues (#195, #196, #199) each display a "Deployed to production (v2.3.0)" badge in their DevOps panel.
- The badge on each issue links to deployment detail #10.
- No badge appears on issue #197 (not included in the deployment).

---

### TC-RDV-198 — Deploy from Redmine confirms pre-flight passes before dispatching

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deploy from Redmine (rfd-111) |
| **Requirement Ref** | DEP-009 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Staging environment has all pre-flight checks passing:
  - No active freeze window
  - No active lock
  - No pending approval required
  - No CRITICAL vulnerabilities (or security gate disabled)
  - User has `trigger_devops_deployment` permission
  - Under rate limit (< 5 triggers this hour)

**Test Data:**
- Environment: staging
- All pre-flight checks: pass
- Version: v2.3.2

**Steps:**
1. Log in as devops@example.com.
2. Navigate to staging environment → click "Deploy."
3. Select version v2.3.2 and confirm.
4. Observe the sequence of events.

**Expected Result:**
- All pre-flight checks pass silently (no warning shown).
- The deployment is dispatched to the configured CI provider.
- Deployment record #21 is created with status "running."
- The staging environment card immediately shows a deployment in progress indicator.
- A success flash message is shown.

---

### TC-RDV-199 — Deployment history correctly shows rollback with reverts_deployment_id reference

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Rollback Tracking (rfd-081) |
| **Requirement Ref** | DEP-005 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Deployment #13 is a rollback that reverts deployment #10 (as per TC-RDV-166)

**Test Data:**
- Deployment #13: is_rollback = true, reverts_deployment_id = 10

**Steps:**
1. Navigate to deployment #13 detail page.
2. Locate the rollback information section.
3. Click the link to the reverted deployment (#10).

**Expected Result:**
- Deployment #13's detail page shows: "This is a rollback. Reverts: Deployment #10 (v2.3.0)."
- Clicking the link navigates to deployment #10's detail page.
- Deployment #10's detail page also shows: "Reverted by: Deployment #13."
- The bidirectional relationship between #10 and #13 is visible.

---

### TC-RDV-200 — Environment card shows "Deploy in progress" indicator during active deployment

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Environment Dashboard (rfd-015) |
| **Requirement Ref** | DEP-002 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Deploy #21 to staging is currently in "running" status
- The environment dashboard auto-refresh is active

**Test Data:**
- Deployment: #21 (staging, status=running)

**Steps:**
1. Trigger deploy #21 (via TC-RDV-198 scenario or equivalent).
2. Within 60 seconds (one auto-refresh cycle), navigate to the Environments dashboard.
3. Observe the staging card.

**Expected Result:**
- The staging card shows a "Deployment in progress" indicator (animated spinner or progress bar).
- The card shows the version being deployed (v2.3.2) alongside the current version (v2.3.1).
- The health status light is replaced or supplemented by the in-progress indicator.

---

### TC-RDV-201 — Deploy is blocked when environment has both a lock AND a freeze window active

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deploy from Redmine (rfd-111) |
| **Requirement Ref** | DEP-009 |
| **Priority** | Medium |
| **Scenario Type** | Negative |

**Preconditions:**
- Production has an active deployment lock AND an active freeze window simultaneously
- devops@example.com attempts to deploy

**Test Data:**
- Lock: active, reason = "Pre-release freeze"
- Freeze window: active, "Sprint end freeze"
- User: devops@example.com

**Steps:**
1. Ensure both a lock and freeze window are active on production.
2. Log in as devops@example.com.
3. Attempt to deploy to production.
4. Observe the error message.

**Expected Result:**
- The deployment is blocked.
- The error message should mention at least the lock (as it is the first check in the pre-flight sequence, or both are mentioned).
- No deployment is dispatched.

---

### TC-RDV-202 — QA Engineer can view deployment history but cannot trigger deployment

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deployment History / Deploy from Redmine |
| **Requirement Ref** | DEP-001, DEP-009 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- bob@example.com is a QA Engineer (has `view_devops` but NOT `trigger_devops_deployment` permission)

**Test Data:**
- User: bob@example.com (QA role)

**Steps:**
1. Log in as bob@example.com.
2. Navigate to Project "phoenix-platform" → DevOps → Deployments.
3. Verify the deployment list loads.
4. Click on deployment #10 to view the detail page.
5. Navigate to the Environments tab.
6. Look for "Deploy" buttons on environment cards.

**Expected Result:**
- The Deployments list and deployment detail pages load successfully (HTTP 200).
- bob can read all deployment data.
- The "Deploy" button on environment cards is absent (not disabled, not visible at all).
- No 403 error on viewing deployment data.

---

### TC-RDV-203 — Deployment lock expiry is enforced by the unexpired_locks scope

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deployment Lock (rfd-082) |
| **Requirement Ref** | DEP-006 |
| **Priority** | High |
| **Scenario Type** | Validation |

**Preconditions:**
- Database contains a lock record: locked_until = 2026-05-20 10:00:00 (in the past)
- Current time: 2026-05-21 09:00:00

**Test Data:**
- Lock expiry: 2026-05-20 10:00:00 (expired yesterday)
- Current time: 2026-05-21 09:00:00

**Steps:**
1. Verify the lock record exists in the database with the past expiry.
2. Navigate to the production environment card.
3. Attempt to deploy to production.

**Expected Result:**
- The `unexpired_locks` scope returns 0 records (the expired lock is filtered out).
- The "Deploy" button is enabled.
- The deployment pre-flight check passes the lock validation step.
- The expired lock does not appear as an active lock on the environment card.

---

### TC-RDV-204 — Rollback reason is required field when recording a rollback deployment

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Rollback Tracking (rfd-081) |
| **Requirement Ref** | DEP-005 |
| **Priority** | Medium |
| **Scenario Type** | Validation |

**Preconditions:**
- devops@example.com attempts to record a rollback deployment without providing a rollback_reason

**Test Data:**
- Deployment: rollback to v2.2.7
- is_rollback: true
- rollback_reason: (empty / omitted)

**Steps:**
1. Attempt to create a rollback deployment record via the REST API or UI with `is_rollback=true` but `rollback_reason` left blank.
2. Observe the response.

**Expected Result:**
- The system rejects the rollback record if no rollback_reason is provided.
- Validation error: "Rollback reason is required for rollback deployments."
- The record is not saved.
- HTTP 422 Unprocessable Entity is returned for API requests.

---

### TC-RDV-205 — Deploy from Redmine: concurrent deploys to same environment are blocked

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deploy from Redmine (rfd-111) |
| **Requirement Ref** | DEP-009 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- Deploy #21 to staging is currently in "running" state
- devops@example.com attempts to trigger another deployment to staging while #21 is running

**Test Data:**
- Active deployment: #21 (staging, status=running)
- Attempted new deployment: staging, v2.3.3

**Steps:**
1. Confirm deploy #21 is in "running" state.
2. Attempt to trigger a new deployment to staging via the Deploy button.
3. Observe the pre-flight result.

**Expected Result:**
- The second deployment is blocked.
- Error message: "A deployment to staging is already in progress (Deployment #21). Wait for it to complete before triggering a new one."
- No duplicate concurrent deployment is created.

---

### TC-RDV-206 — Environment cards are ordered by environment type (dev → staging → production)

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Environment Dashboard (rfd-015) |
| **Requirement Ref** | DEP-002 |
| **Priority** | Low |
| **Scenario Type** | Positive |

**Preconditions:**
- Project has environments: production (added first), dev (added second), staging (added third)
- The `auto-position ordering based on environment type` from rfd-032 applies

**Test Data:**
- Environments added in order: production, dev, staging
- Expected display order: dev, staging, production

**Steps:**
1. Navigate to Project "phoenix-platform" → DevOps → Environments.
2. Observe the order of environment cards.

**Expected Result:**
- Cards are displayed in logical type order: dev first, staging second, production last — regardless of creation order.
- The auto-positioning based on environment_type (dev=1, staging=2, prod=3, custom=4) is applied.

---

### TC-RDV-207 — Deployment issue link badge shows correct version for each environment separately

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deployment–Issue Linking (rfd-016) |
| **Requirement Ref** | DEP-003 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Issue #196 is included in:
  - Deploy #8 to staging: v2.2.8
  - Deploy #10 to production: v2.3.0

**Test Data:**
- Issue: #196
- Staging deployment: v2.2.8
- Production deployment: v2.3.0

**Steps:**
1. Navigate to issue #196.
2. Observe the deployment badges in the DevOps panel.

**Expected Result:**
- Two deployment badges are shown:
  - "Deployed to staging (v2.2.8)"
  - "Deployed to production (v2.3.0)"
- Both badges link to their respective deployment detail pages.
- The versions are correct per environment (staging shows v2.2.8, not v2.3.0).

---

### TC-RDV-208 — Freeze window created as recurring weekly prevents deploy on each occurrence

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deploy from Redmine / Deployment Freeze Windows (rfd-099, rfd-111) |
| **Requirement Ref** | DEP-009 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- A recurring weekly freeze window is configured: "Every Friday 17:00–Monday 08:00"
- The current time falls within the freeze window (e.g., Saturday 2026-05-23 12:00)

**Test Data:**
- Freeze window type: recurring weekly
- Schedule: Friday 17:00 – Monday 08:00
- Current time: Saturday 2026-05-23 12:00 (within freeze)

**Steps:**
1. Set the current time to Saturday 2026-05-23 12:00.
2. Attempt to deploy to the production environment.
3. Observe the pre-flight result.

**Expected Result:**
- The deployment is blocked by the recurring freeze window.
- Error message: "Deployment blocked: recurring freeze window 'Every Friday 17:00–Monday 08:00' is currently active."
- The same block will occur every weekend without needing to manually recreate the freeze window.

---

### TC-RDV-209 — Deployment detail page is scoped to project and rejects cross-project access (IDOR check)

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Deployment History (rfd-014) |
| **Requirement Ref** | DEP-001 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- Deployment #50 belongs to project "atlas-backend"
- User eve@example.com is a member of "phoenix-platform" ONLY

**Test Data:**
- Cross-project deployment: #50 (belongs to atlas-backend)
- Attacking user: eve@example.com (member of phoenix-platform only)
- URL to access: `/projects/phoenix-platform/devops_deployments/50`

**Steps:**
1. Log in as eve@example.com.
2. Navigate directly to `/projects/phoenix-platform/devops_deployments/50`.
3. Observe the HTTP response.

**Expected Result:**
- HTTP 404 Not Found is returned.
- No data from "atlas-backend" is exposed.
- The `project_id` scoping on all ActiveRecord lookups prevents IDOR access.

---

### TC-RDV-210 — Environment health status "healthy" after post-deployment check does not create incident

| Field | Value |
|-------|-------|
| **Module** | Deployments |
| **Feature** | Post-Deployment Health Check (rfd-083) |
| **Requirement Ref** | DEP-007 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- Deploy #22 to staging completed successfully
- Staging health endpoint returns HTTP 200 on the first post-deployment poll
- `DevopsPostDeployHealthJob` receives a "healthy" result

**Test Data:**
- Deployment: #22 (staging)
- Health endpoint response: HTTP 200 (healthy)

**Steps:**
1. Complete deploy #22 to staging.
2. Wait for the first 30-second health poll.
3. Navigate to Project "phoenix-platform" → DevOps → Incidents.
4. Check whether any new incident was created.

**Expected Result:**
- No incident is auto-created (incident creation is only triggered by "down" health status).
- The staging environment card shows a green health status.
- The deployment #22 detail page shows "Health: Healthy" after the first successful poll.
- The Incidents list is unchanged (no new records for this deployment).
