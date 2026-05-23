# Test Cases — Permissions & Roles — Redmineflux DevOps

| Field | Value |
|-------|-------|
| **Plugin** | redmineflux_devops |
| **Module** | Permissions & Roles |
| **TC Range** | TC-RDV-521 to TC-RDV-545 |
| **Total TCs** | 25 |
| **Requirement Coverage** | SYS-003 (Permission Model) |
| **Feature Coverage** | rfd-003 (Permission Model) |

---

## Permission 1 — view_devops

---

### TC-RDV-521 — User WITH view_devops can see the DevOps tab on a project

| Field | Value |
|-------|-------|
| **Module** | Permissions & Roles |
| **Feature** | Permission Model (rfd-003) |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "dev-user" has Developer role in project "Phoenix Platform".
- Developer role has `view_devops` permission enabled.

**Test Data:**
- User: dev-user (Developer, view_devops = enabled)

**Steps:**
1. Log in as dev-user.
2. Navigate to Project "Phoenix Platform".
3. Observe the project navigation tabs.

**Expected Result:**
- A "DevOps" tab is visible in the project navigation bar.
- Clicking the tab navigates to the DevOps landing page (HTTP 200).
- Sub-navigation shows all permitted tabs: Builds, Commits, Pull Requests, Deployments, Environments, Releases, Alerts, Security (if view_security_scans), Incidents, Metrics, Repos, Settings.

---

### TC-RDV-522 — Non-member cannot see the DevOps tab or any DevOps data

| Field | Value |
|-------|-------|
| **Module** | Permissions & Roles |
| **Feature** | Permission Model (rfd-003) |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "outsider" has no membership in project "Phoenix Platform".
- The project has the DevOps plugin enabled.

**Test Data:**
- User: outsider (non-member)

**Steps:**
1. Log in as outsider.
2. Navigate to Project "Phoenix Platform" (if publicly accessible).
3. Observe the project navigation.
4. Attempt to access `/projects/phoenix-platform/devops/builds` directly.

**Expected Result:**
- The "DevOps" tab is NOT visible to outsider.
- Direct URL access returns HTTP 403 Forbidden.
- No DevOps data (builds, deployments, environments, etc.) is exposed.

---

### TC-RDV-523 — Non-member gets 403 on DevOps REST API call with a valid API key

| Field | Value |
|-------|-------|
| **Module** | Permissions & Roles |
| **Feature** | Permission Model (rfd-003) |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "outsider" has a valid Redmine API key but is NOT a member of project "Phoenix Platform".

**Test Data:**
- API key: outsider's valid API key
- Request: `GET /devops/builds.json?project_id=phoenix-platform`

**Steps:**
1. Send a `GET /devops/builds.json?project_id=phoenix-platform` request with `X-Redmine-API-Key: <outsider_api_key>` header.
2. Observe the HTTP response code.

**Expected Result:**
- HTTP 403 Forbidden is returned.
- Response body does not contain any build records.
- The valid API key does not grant access without project membership.

---

## Permission 2 — manage_devops_settings

---

### TC-RDV-524 — Developer cannot see the "Add Repository" button

| Field | Value |
|-------|-------|
| **Module** | Permissions & Roles |
| **Feature** | Permission Model (rfd-003) |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "dev-user" has Developer role in project "Phoenix Platform".
- Developer role does NOT have `manage_devops_settings` permission.

**Test Data:**
- User: dev-user (Developer, manage_devops_settings = disabled)

**Steps:**
1. Log in as dev-user.
2. Navigate to Project "Phoenix Platform" → DevOps → Repos tab.

**Expected Result:**
- The "Add Repository" button is NOT visible to dev-user.
- The repository list is visible (read-only) if `view_devops` is granted.
- Any direct POST attempt to add a repository returns HTTP 403.

---

### TC-RDV-525 — DevOps Engineer CAN configure connections and webhooks

| Field | Value |
|-------|-------|
| **Module** | Permissions & Roles |
| **Feature** | Permission Model (rfd-003) |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "devops-eng" has DevOps Engineer role with `manage_devops_settings` permission.

**Test Data:**
- User: devops-eng (DevOps Engineer, manage_devops_settings = enabled)

**Steps:**
1. Log in as devops-eng.
2. Navigate to Project "Phoenix Platform" → DevOps → Settings tab.
3. Observe available actions.
4. Navigate to Project → DevOps → Repos.
5. Observe the "Add Repository" button.

**Expected Result:**
- DevOps Settings tab is accessible; configuration form is displayed.
- "Add Repository" button is visible and functional.
- Webhook configuration options are available.

---

## Permission 3 — trigger_builds

---

### TC-RDV-526 — Developer CAN click the Rebuild button when trigger_builds is granted

| Field | Value |
|-------|-------|
| **Module** | Permissions & Roles |
| **Feature** | Permission Model (rfd-003) |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "dev-user" has Developer role with `trigger_builds` permission enabled.
- A failed build (#789) exists in project "Phoenix Platform".

**Test Data:**
- User: dev-user (Developer, trigger_builds = enabled)
- Build: #789 (failed, branch: feature/123-login)

**Steps:**
1. Log in as dev-user.
2. Navigate to Project → DevOps → Builds → Build #789.
3. Observe the "Rebuild" button.
4. Click "Rebuild" and confirm.

**Expected Result:**
- "Rebuild" button is visible on the build detail page.
- Clicking "Rebuild" shows a confirmation dialog.
- After confirmation, a "Build triggered" notification appears with a link to the new build.
- A new build record is created.

---

### TC-RDV-527 — Developer CANNOT click Rebuild if trigger_builds is NOT granted

| Field | Value |
|-------|-------|
| **Module** | Permissions & Roles |
| **Feature** | Permission Model (rfd-003) |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "qa-user" has QA role with `view_devops` but WITHOUT `trigger_builds` permission.
- A failed build (#789) exists.

**Test Data:**
- User: qa-user (QA role, trigger_builds = disabled)

**Steps:**
1. Log in as qa-user.
2. Navigate to Project → DevOps → Builds → Build #789.
3. Observe the "Rebuild" button.
4. Attempt to POST to `/devops/builds/789/trigger.json` via API with qa-user's API key.

**Expected Result:**
- "Rebuild" button is NOT visible to qa-user.
- Direct API call returns HTTP 403.
- No new build is triggered.

---

## Permission 4 — approve_deployments

---

### TC-RDV-528 — Manager/Lead CAN approve a pending production deployment

| Field | Value |
|-------|-------|
| **Module** | Permissions & Roles |
| **Feature** | Permission Model (rfd-003) |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "manager-user" has Manager role with `approve_deployments` permission.
- A deployment to `prod-eu` is pending approval (status: awaiting_approval).

**Test Data:**
- User: manager-user (Manager, approve_deployments = enabled)
- Pending deployment: version v2.5.1 to prod-eu

**Steps:**
1. Log in as manager-user.
2. Navigate to Project → DevOps → Deployments → find the pending deployment.
3. Click "Approve".
4. Add a comment: "Approved after successful staging validation."
5. Click "Confirm Approval".

**Expected Result:**
- Deployment status changes from "Awaiting Approval" to "Approved" / "In Progress".
- Audit trail records: approver = manager-user, timestamp, comment.
- Deployment proceeds to dispatch by `DeploymentDispatcher`.

---

### TC-RDV-529 — Developer CANNOT approve a deployment (approve_deployments not granted)

| Field | Value |
|-------|-------|
| **Module** | Permissions & Roles |
| **Feature** | Permission Model (rfd-003) |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "dev-user" has Developer role WITHOUT `approve_deployments` permission.
- A deployment is pending approval.

**Test Data:**
- User: dev-user (Developer, approve_deployments = disabled)

**Steps:**
1. Log in as dev-user.
2. Navigate to Project → DevOps → Deployments.
3. Observe the pending deployment.
4. Attempt to access the approval action.

**Expected Result:**
- "Approve" and "Reject" buttons are NOT visible to dev-user on the pending deployment.
- Direct POST to the approve endpoint returns HTTP 403.
- Deployment remains in "Awaiting Approval" state.

---

## Permission 5 — manage_releases

---

### TC-RDV-530 — Manager CAN create and edit a release

| Field | Value |
|-------|-------|
| **Module** | Permissions & Roles |
| **Feature** | Permission Model (rfd-003) |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "manager-user" has Manager role with `manage_releases` permission.

**Test Data:**
- User: manager-user
- New release: v3.0.0, linked to Redmine version "3.0 Release"

**Steps:**
1. Log in as manager-user.
2. Navigate to Project → DevOps → Releases.
3. Click "New Release".
4. Fill in release name: `v3.0.0`, link to version "3.0 Release".
5. Click "Save".

**Expected Result:**
- Release `v3.0.0` is created successfully.
- manager-user is directed to the release detail page.
- "Edit" button is available on the release for manager-user.

---

### TC-RDV-531 — Developer CANNOT create or edit a release

| Field | Value |
|-------|-------|
| **Module** | Permissions & Roles |
| **Feature** | Permission Model (rfd-003) |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "dev-user" has Developer role WITHOUT `manage_releases` permission.

**Test Data:**
- User: dev-user

**Steps:**
1. Log in as dev-user.
2. Navigate to Project → DevOps → Releases.
3. Observe the page.
4. Attempt to access the "New Release" form directly.

**Expected Result:**
- "New Release" button is NOT visible to dev-user.
- Direct navigation to the new release form returns HTTP 403.
- Existing releases are still visible (view access is governed by `view_devops`).

---

### TC-RDV-532 — QA user CAN approve a release (approve_releases permission)

| Field | Value |
|-------|-------|
| **Module** | Permissions & Roles |
| **Feature** | Permission Model (rfd-003) |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "qa-user" has QA role with `approve_release` permission (per rfd-019 — `:approve_release` permission).
- Release `v3.0.0` has a pending QA approval step in its multi-role approval workflow.

**Test Data:**
- User: qa-user (QA role, approve_release = enabled)
- Release: v3.0.0, awaiting QA approval

**Steps:**
1. Log in as qa-user.
2. Navigate to Project → DevOps → Releases → v3.0.0.
3. Observe the approval status bar.
4. Click "Approve" for the QA step.
5. Add comment: "QA sign-off complete — all regression tests passed."
6. Submit approval.

**Expected Result:**
- QA approval is recorded in `release_approvals` table.
- Approval status bar shows qa-user's step as "Approved".
- Release moves to the next approval step (PM approval).
- Approval record is immutable (no destroy option shown).

---

## Permission 6 — manage_incidents

---

### TC-RDV-533 — DevOps Engineer CAN create and update incidents

| Field | Value |
|-------|-------|
| **Module** | Permissions & Roles |
| **Feature** | Permission Model (rfd-003) |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "devops-eng" has DevOps Engineer role with `manage_incidents` permission.

**Test Data:**
- User: devops-eng
- New incident: severity SEV2, affected service: "Payment Gateway"

**Steps:**
1. Log in as devops-eng.
2. Navigate to Project → DevOps → Incidents.
3. Click "New Incident".
4. Fill in: severity SEV2, affected service "Payment Gateway", description "Elevated error rate in payment processing."
5. Click "Save".

**Expected Result:**
- Incident is created with tracker "Incident", priority "Urgent" (or equivalent for SEV2), pre-filled fields.
- devops-eng is listed as the creator.
- Incident appears in the Incidents tab list.

---

### TC-RDV-534 — QA user CANNOT create an incident

| Field | Value |
|-------|-------|
| **Module** | Permissions & Roles |
| **Feature** | Permission Model (rfd-003) |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "qa-user" has QA role WITHOUT `manage_incidents` permission.

**Test Data:**
- User: qa-user

**Steps:**
1. Log in as qa-user.
2. Navigate to Project → DevOps → Incidents.
3. Observe available actions.
4. Attempt to access the "New Incident" form directly.

**Expected Result:**
- "New Incident" button is NOT visible to qa-user.
- Direct URL access to the incident creation form returns HTTP 403.
- Existing incidents are still visible (view_devops permission).

---

## Permission 7 — view_security_scans

---

### TC-RDV-535 — User WITH view_security_scans CAN see the Security/Vulnerabilities tab

| Field | Value |
|-------|-------|
| **Module** | Permissions & Roles |
| **Feature** | Permission Model (rfd-003) |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "devops-eng" has DevOps Engineer role with `view_security_scans` permission.
- The Security tab contains vulnerability data.

**Test Data:**
- User: devops-eng

**Steps:**
1. Log in as devops-eng.
2. Navigate to Project → DevOps sub-navigation.
3. Observe the "Security" tab.
4. Click the "Security" tab.

**Expected Result:**
- "Security" tab is visible in the DevOps sub-navigation.
- Clicking the tab loads the vulnerability list (HTTP 200).
- Vulnerability data (severity, title, file, CVE) is displayed.

---

### TC-RDV-536 — Developer CANNOT see the Security/Vulnerabilities tab

| Field | Value |
|-------|-------|
| **Module** | Permissions & Roles |
| **Feature** | Permission Model (rfd-003) |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "dev-user" has Developer role WITHOUT `view_security_scans` permission.

**Test Data:**
- User: dev-user

**Steps:**
1. Log in as dev-user.
2. Navigate to Project → DevOps sub-navigation.
3. Look for the "Security" tab.
4. Attempt to access `/projects/phoenix-platform/devops/security` directly.

**Expected Result:**
- "Security" tab is NOT visible in the DevOps sub-navigation for dev-user.
- Direct URL access returns HTTP 403.
- No vulnerability data is exposed.

---

## Role Combination and Cross-Role Tests

---

### TC-RDV-537 — Developer role has correct default permissions for all DevOps views

| Field | Value |
|-------|-------|
| **Module** | Permissions & Roles |
| **Feature** | Permission Model (rfd-003) |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "dev-user" has Developer role with standard DevOps permissions as per the Permissions Matrix.
- Developer-allowed: view_devops, trigger_builds, (view Builds, Commits, PRs, Deployments, Environments, Releases, Alerts, Incidents, Metrics, Repos).
- Developer-blocked: manage_devops_settings, approve_deployments, manage_releases, manage_incidents (create), view_security_scans.

**Test Data:**
- User: dev-user (Developer)

**Steps:**
1. Log in as dev-user.
2. Navigate to Project → DevOps.
3. Verify each tab is accessible or restricted as per the matrix:
   - Builds tab: accessible
   - Commits tab: accessible
   - Pull Requests tab: accessible
   - Deployments tab: accessible (read-only, no approve button)
   - Environments tab: accessible (no lock/manage buttons)
   - Releases tab: accessible (no new/edit buttons)
   - Alerts tab: accessible
   - Security tab: NOT accessible (hidden)
   - Incidents tab: accessible (read-only)
   - Metrics tab: accessible
   - Repos tab: accessible (no add/edit connection buttons)
   - Settings tab: NOT accessible or empty

**Expected Result:**
- Each tab's accessibility matches the Developer row of the Permissions Matrix.
- No tab that should be blocked shows actionable buttons (add, edit, delete, approve) for dev-user.
- Accessible tabs load with HTTP 200.

---

### TC-RDV-538 — Admin has all permissions across all DevOps features

| Field | Value |
|-------|-------|
| **Module** | Permissions & Roles |
| **Feature** | Permission Model (rfd-003) |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "admin" is a Redmine Administrator and has Admin role in project.

**Test Data:**
- User: admin

**Steps:**
1. Log in as admin.
2. Navigate to Project → DevOps.
3. Verify each tab and action is available:
   - All 12 DevOps sub-tabs visible.
   - "Rebuild" button visible on builds.
   - "Approve Deployment" button visible on pending deployments.
   - "New Release" button visible.
   - "New Incident" button visible.
   - "Security" tab visible with vulnerability data.
   - "Add Repository" button visible.
   - DevOps Settings tab accessible.
4. Navigate to Admin → DevOps Audit Log.

**Expected Result:**
- All 12 tabs visible.
- All action buttons visible and functional.
- Admin → DevOps Audit Log is accessible (HTTP 200).
- Admin is the only role with access to the Audit Log.

---

### TC-RDV-539 — Only Admin can view the DevOps Audit Log

| Field | Value |
|-------|-------|
| **Module** | Permissions & Roles |
| **Feature** | Permission Model (rfd-003), Audit Trail (rfd-116) |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- Multiple roles exist: Admin, Manager, Developer, QA, DevOps Engineer.
- DevOps Audit Log is at `/admin/devops_audit`.

**Test Data:**
- Users: admin, manager-user, dev-user, qa-user, devops-eng

**Steps:**
1. Log in as admin → navigate to `/admin/devops_audit` → confirm HTTP 200.
2. Log in as manager-user → navigate to `/admin/devops_audit` → observe response.
3. Log in as dev-user → navigate to `/admin/devops_audit` → observe response.
4. Log in as devops-eng → navigate to `/admin/devops_audit` → observe response.

**Expected Result:**
- Admin: HTTP 200, audit log visible with full filter options.
- manager-user: HTTP 403 Forbidden.
- dev-user: HTTP 403 Forbidden.
- devops-eng: HTTP 403 Forbidden.
- Only the global Admin role has access to the audit log.

---

### TC-RDV-540 — DevOps Engineer CAN lock environment; Developer CANNOT

| Field | Value |
|-------|-------|
| **Module** | Permissions & Roles |
| **Feature** | Permission Model (rfd-003), Deployment Lock (rfd-082) |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "devops-eng" has DevOps Engineer role with `manage_environments` permission.
- User "dev-user" has Developer role WITHOUT `manage_environments` permission.
- Environment `staging-main` exists.

**Test Data:**
- devops-eng: lock environment → should succeed
- dev-user: lock environment → should fail

**Steps:**
1. Log in as devops-eng.
2. Navigate to Project → DevOps → Environments → `staging-main`.
3. Click "Lock Environment", enter reason, confirm → observe success.
4. Unlock the environment.
5. Log in as dev-user.
6. Navigate to Project → DevOps → Environments → `staging-main`.
7. Observe the presence of the "Lock Environment" button.
8. Attempt a direct POST to the lock endpoint with dev-user's API key.

**Expected Result:**
- devops-eng: Lock succeeds; environment shows "Locked" state.
- dev-user: Lock button not visible; API call returns HTTP 403.
- Environment is never locked by dev-user.

---

### TC-RDV-541 — User with multiple roles gets the union of permissions

| Field | Value |
|-------|-------|
| **Module** | Permissions & Roles |
| **Feature** | Permission Model (rfd-003) |
| **Requirement Ref** | SYS-003 |
| **Priority** | Medium |
| **Scenario Type** | Permission |

**Preconditions:**
- User "multi-role-user" has BOTH Developer role AND Manager role in "Phoenix Platform".
- Developer role has: trigger_builds (but not approve_deployments).
- Manager role has: approve_deployments (but not trigger_builds by default).

**Test Data:**
- User: multi-role-user (Developer + Manager)

**Steps:**
1. Log in as multi-role-user.
2. Navigate to Project → DevOps → Builds → a failed build.
3. Observe "Rebuild" button.
4. Navigate to Project → DevOps → Deployments → a pending deployment.
5. Observe "Approve" button.

**Expected Result:**
- "Rebuild" button IS visible (inherited from Developer role).
- "Approve" button IS visible (inherited from Manager role).
- User gets the union of permissions from all assigned roles.
- No permissions are subtracted by having multiple roles.

---

### TC-RDV-542 — override_security_gate permission: user with permission can bypass with reason

| Field | Value |
|-------|-------|
| **Module** | Permissions & Roles |
| **Feature** | Permission Model (rfd-003), Security Gate (rfd-090) |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "devops-eng" has `override_security_gate` permission (per rfd-090).
- Environment `prod-eu` has `security_gate_enabled = true`.
- A CRITICAL vulnerability is open for the project: "CVE-2026-12345 — SQL Injection in login form."
- A deployment to `prod-eu` is blocked by the security gate.

**Test Data:**
- User: devops-eng (override_security_gate = enabled)
- Override reason: `Emergency revenue fix for checkout bug. CVE patched in this release. Security lead approval: incident INC-2026-0087. Reason length exceeds 20 characters.`

**Steps:**
1. Log in as devops-eng.
2. Navigate to Project → DevOps → Environments → `prod-eu` → Deploy version v2.5.2.
3. System shows: "Blocked: 1 critical vulnerability (CVE-2026-12345) must be resolved."
4. Click "Override Security Gate".
5. Enter override reason (as above).
6. Confirm override.

**Expected Result:**
- Override is accepted (reason is ≥ 20 characters, per rfd-090 requirement).
- Deployment proceeds despite the open critical vulnerability.
- Audit log records: actor = devops-eng, action = `security_gate_override`, reason = full override reason text, timestamp, target environment, CVE reference.
- The overridden critical vulnerability is still flagged as "open" — the override does not resolve it.

---

### TC-RDV-543 — User WITHOUT override_security_gate cannot bypass the security gate

| Field | Value |
|-------|-------|
| **Module** | Permissions & Roles |
| **Feature** | Permission Model (rfd-003), Security Gate (rfd-090) |
| **Requirement Ref** | SYS-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "dev-user" has Developer role WITHOUT `override_security_gate` permission.
- Same blocking scenario as TC-RDV-542 (critical vulnerability open, security gate enabled).

**Test Data:**
- User: dev-user (override_security_gate = disabled)

**Steps:**
1. Log in as dev-user.
2. Navigate to Project → DevOps → Environments → `prod-eu` → Deploy.
3. System shows security gate blocked message.
4. Observe the "Override Security Gate" option.

**Expected Result:**
- "Override Security Gate" button/option is NOT displayed to dev-user.
- Direct API call to override endpoint returns HTTP 403.
- Deployment remains blocked.
- The blocked state is clearly communicated with CVE details.

---

### TC-RDV-544 — Manager role can view DevOps Metrics; QA cannot view DORA metrics

| Field | Value |
|-------|-------|
| **Module** | Permissions & Roles |
| **Feature** | Permission Model (rfd-003) |
| **Requirement Ref** | SYS-003 |
| **Priority** | Medium |
| **Scenario Type** | Permission |

**Preconditions:**
- User "manager-user" has Manager role — can view DORA Metrics per the Permissions Matrix.
- User "qa-user" has QA role — CANNOT view DORA Metrics per the Permissions Matrix.

**Test Data:**
- manager-user: View DORA Metrics → should succeed
- qa-user: View DORA Metrics → should fail

**Steps:**
1. Log in as manager-user → navigate to Project → DevOps → Metrics → confirm HTTP 200 and data visible.
2. Log in as qa-user → navigate to Project → DevOps → Metrics.

**Expected Result:**
- manager-user: Metrics tab loads; DORA data (Deployment Frequency, Lead Time, Change Failure Rate, MTTR) is displayed.
- qa-user: Metrics tab is not visible or returns HTTP 403.
- Metrics data is not exposed to QA role.

---

### TC-RDV-545 — Generate Changelog and Export Release Notes: role-based access

| Field | Value |
|-------|-------|
| **Module** | Permissions & Roles |
| **Feature** | Permission Model (rfd-003) |
| **Requirement Ref** | SYS-003 |
| **Priority** | Medium |
| **Scenario Type** | Permission |

**Preconditions:**
- Release `v3.0.0` exists in project "Phoenix Platform".
- Users: manager-user (Manager, manage_releases), dev-user (Developer), qa-user (QA).

**Test Data:**
- Generate Changelog: Manager allowed; Developer blocked
- Export Release Notes (MD/HTML): All project members allowed (per permissions matrix)

**Steps:**
1. Log in as manager-user → navigate to Release v3.0.0 → click "Generate Changelog" → confirm success.
2. Log in as dev-user → navigate to Release v3.0.0 → attempt "Generate Changelog".
3. Log in as qa-user → navigate to Release v3.0.0 → attempt "Export Release Notes" (Markdown).
4. Log in as dev-user → navigate to Release v3.0.0 → attempt "Export Release Notes" (HTML).

**Expected Result:**
- manager-user: "Generate Changelog" succeeds; changelog is rendered on the release page.
- dev-user: "Generate Changelog" button is NOT visible; direct POST returns HTTP 403.
- qa-user: "Export Release Notes" (MD) succeeds; file downloads correctly.
- dev-user: "Export Release Notes" (HTML) succeeds; file downloads correctly.
- Export is available to all roles with `view_devops`; Generate/Edit is restricted to manage_releases.
