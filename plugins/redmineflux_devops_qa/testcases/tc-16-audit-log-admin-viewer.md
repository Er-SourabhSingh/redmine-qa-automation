# Test Cases — Centralized Audit Log Admin Viewer — Redmineflux DevOps

| Field | Value |
|-------|-------|
| **Plugin** | redmineflux_devops |
| **Module** | Centralized Audit Log Admin Viewer |
| **TC Range** | TC-RDV-576 to TC-RDV-595 |
| **Total TCs** | 20 |
| **Requirement Coverage** | rfd-125 — Centralized audit log for devops actions with admin viewer |
| **Redmine Issue** | #113706 |

---

> **Scope note:** rfd-116 tests (TC-RDV-401–407) cover *individual action logging* (what gets written when a specific action fires). These cases focus on the **centralized admin viewer**, completeness across *all* controller types, tamper-evidence guarantees, filter combination, and edge cases that rfd-116 does not address.

---

## SEC-010 — Centralized Audit Log Admin Viewer (rfd-125)

---

### TC-RDV-576 — Admin viewer loads and displays the full audit event list

| Field | Value |
|-------|-------|
| **Module** | Centralized Audit Log Admin Viewer |
| **Feature** | rfd-125 — Centralized audit log for devops actions with admin viewer |
| **Requirement Ref** | rfd-125 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- At least 5 audit events exist in `redmineflux_devops_audit_events` (covering different action types: build, deployment, release, hotfix, freeze)
- Tester is logged in as `admin`

**Test Data:**
- URL: `Admin > DevOps Audit Log` (or `/admin/devops_audit_log`)

**Steps:**
1. Log in as `admin`
2. Navigate to `Admin > DevOps Audit Log`
3. Observe the page load and content

**Expected Result:**
- Page loads with HTTP 200
- A table/list of audit events is visible
- Each row shows: actor (user), action type, target, timestamp, IP address
- All 5 seeded events are present in the list
- No error messages or blank states

---

### TC-RDV-577 — Each audit event record contains all required fields

| Field | Value |
|-------|-------|
| **Module** | Centralized Audit Log Admin Viewer |
| **Feature** | rfd-125 — Centralized audit log for devops actions with admin viewer |
| **Requirement Ref** | rfd-125 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- A deployment approval was performed by `mgr_user` on deployment #10 to the staging environment

**Test Data:**
- Actor: mgr_user
- Action: deployment_approved
- Target: deployment #10 / staging

**Steps:**
1. Log in as `admin`
2. Navigate to `Admin > DevOps Audit Log`
3. Locate the approval event for mgr_user
4. Expand or inspect the event detail row

**Expected Result:**
- The event record contains all of the following fields:
  - `actor`: mgr_user (linked to the Redmine user)
  - `action`: deployment_approved (human-readable label)
  - `target`: deployment #10 or staging environment reference
  - `timestamp`: date and time of the action (UTC)
  - `ip_address`: IP of the request that triggered the action
  - `params_digest`: SHA-256 hash of non-secret parameters

---

### TC-RDV-578 — Build trigger action is recorded in the audit log

| Field | Value |
|-------|-------|
| **Module** | Centralized Audit Log Admin Viewer |
| **Feature** | rfd-125 — Centralized audit log for devops actions with admin viewer |
| **Requirement Ref** | rfd-125 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- `devops_user` has permission to trigger builds
- Project "phoenix-platform" has a CI pipeline configured

**Test Data:**
- Actor: devops_user, build: pipeline "main", branch: main

**Steps:**
1. Log in as `devops_user` and trigger a build on the "main" pipeline
2. Log in as `admin` and navigate to `Admin > DevOps Audit Log`
3. Search or scroll to find the build trigger event

**Expected Result:**
- An audit entry exists with action `build_triggered` (or equivalent), actor `devops_user`, target referencing the pipeline and branch
- Timestamp is within seconds of the trigger action
- IP address is recorded

---

### TC-RDV-579 — Release publish action is recorded in the audit log

| Field | Value |
|-------|-------|
| **Module** | Centralized Audit Log Admin Viewer |
| **Feature** | rfd-125 — Centralized audit log for devops actions with admin viewer |
| **Requirement Ref** | rfd-125 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- `devops_user` has release management permission
- A release v2.1.0 is published for project "phoenix-platform"

**Test Data:**
- Actor: devops_user, release: v2.1.0, project: phoenix-platform

**Steps:**
1. Log in as `devops_user` and publish release v2.1.0
2. Log in as `admin` and navigate to `Admin > DevOps Audit Log`
3. Locate the release publish event

**Expected Result:**
- An audit entry exists with action `release_published` (or equivalent)
- Actor: devops_user, target: release v2.1.0 / phoenix-platform
- Timestamp and IP address are present

---

### TC-RDV-580 — Hotfix branch creation is recorded in the audit log

| Field | Value |
|-------|-------|
| **Module** | Centralized Audit Log Admin Viewer |
| **Feature** | rfd-125 — Centralized audit log for devops actions with admin viewer |
| **Requirement Ref** | rfd-125 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- `devops_user` creates a hotfix branch from release tag v2.0.0

**Test Data:**
- Actor: devops_user, source tag: v2.0.0, new branch: hotfix/v2.0.1

**Steps:**
1. Log in as `devops_user` and create a hotfix branch from tag v2.0.0
2. Log in as `admin` and navigate to `Admin > DevOps Audit Log`
3. Locate the hotfix branch creation event

**Expected Result:**
- An audit entry exists with action `hotfix_branch_created` (or equivalent)
- Actor: devops_user, target: branch hotfix/v2.0.1, source: tag v2.0.0
- Timestamp and IP address are present

---

### TC-RDV-581 — Deployment freeze / environment lock is recorded in the audit log

| Field | Value |
|-------|-------|
| **Module** | Centralized Audit Log Admin Viewer |
| **Feature** | rfd-125 — Centralized audit log for devops actions with admin viewer |
| **Requirement Ref** | rfd-125 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- `devops_user` locks the production environment with reason "Pre-release freeze"

**Test Data:**
- Actor: devops_user, environment: production, reason: "Pre-release freeze"

**Steps:**
1. Log in as `devops_user` and lock the production environment
2. Log in as `admin` and navigate to `Admin > DevOps Audit Log`
3. Locate the environment lock event

**Expected Result:**
- An audit entry exists with action `environment_locked` (or equivalent)
- Actor: devops_user, target: production environment, lock reason noted
- Timestamp and IP address are present

---

### TC-RDV-582 — Environment access request is recorded in the audit log

| Field | Value |
|-------|-------|
| **Module** | Centralized Audit Log Admin Viewer |
| **Feature** | rfd-125 — Centralized audit log for devops actions with admin viewer |
| **Requirement Ref** | rfd-125 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- `dev_user` submits an environment access request for staging

**Test Data:**
- Actor: dev_user, environment: staging, request type: access

**Steps:**
1. Log in as `dev_user` and submit an environment access request
2. Log in as `admin` and navigate to `Admin > DevOps Audit Log`
3. Locate the environment request event

**Expected Result:**
- An audit entry exists with action `environment_access_requested` (or equivalent)
- Actor: dev_user, target: staging environment
- Timestamp and IP address are present

---

### TC-RDV-583 — Filter by actor (user) returns only that user's events

| Field | Value |
|-------|-------|
| **Module** | Centralized Audit Log Admin Viewer |
| **Feature** | rfd-125 — Centralized audit log for devops actions with admin viewer |
| **Requirement Ref** | rfd-125 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Audit log contains: 4 events from `devops_user`, 3 events from `mgr_user`, 2 events from `dev_user`

**Test Data:**
- Filter actor: devops_user

**Steps:**
1. Log in as `admin` and navigate to `Admin > DevOps Audit Log`
2. Apply the user/actor filter for "devops_user"
3. Observe the filtered result list

**Expected Result:**
- Exactly 4 events from `devops_user` are shown
- Events from `mgr_user` and `dev_user` are hidden
- Filter is applied server-side (not client-side JS filtering)
- Page count / total reflects only the filtered set

---

### TC-RDV-584 — Filter by action type returns only that action's events

| Field | Value |
|-------|-------|
| **Module** | Centralized Audit Log Admin Viewer |
| **Feature** | rfd-125 — Centralized audit log for devops actions with admin viewer |
| **Requirement Ref** | rfd-125 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Audit log contains: 3 `build_triggered`, 2 `deployment_approved`, 4 `environment_locked` events

**Test Data:**
- Filter action type: build_triggered

**Steps:**
1. Log in as `admin` and navigate to `Admin > DevOps Audit Log`
2. Apply the action type filter for "build_triggered"
3. Observe the filtered result list

**Expected Result:**
- Exactly 3 `build_triggered` events are shown
- Deployment and lock events are hidden
- Action filter dropdown or input is visibly applied

---

### TC-RDV-585 — Filter by date range returns only events within the range

| Field | Value |
|-------|-------|
| **Module** | Centralized Audit Log Admin Viewer |
| **Feature** | rfd-125 — Centralized audit log for devops actions with admin viewer |
| **Requirement Ref** | rfd-125 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Audit log contains events spanning multiple days:
  - 3 events on 2026-05-01
  - 5 events on 2026-05-10
  - 2 events on 2026-05-20

**Test Data:**
- Date range: 2026-05-08 to 2026-05-12

**Steps:**
1. Log in as `admin` and navigate to `Admin > DevOps Audit Log`
2. Set date range filter: from 2026-05-08 to 2026-05-12
3. Observe the filtered result list

**Expected Result:**
- Exactly 5 events (those from 2026-05-10) are shown
- Events from 2026-05-01 and 2026-05-20 are excluded
- Filter is applied server-side

---

### TC-RDV-586 — Combined filter (user + action type + date range) narrows results correctly

| Field | Value |
|-------|-------|
| **Module** | Centralized Audit Log Admin Viewer |
| **Feature** | rfd-125 — Centralized audit log for devops actions with admin viewer |
| **Requirement Ref** | rfd-125 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Audit log contains:
  - devops_user / build_triggered / 2026-05-10: 2 events
  - devops_user / deployment_approved / 2026-05-10: 1 event
  - mgr_user / build_triggered / 2026-05-10: 3 events

**Test Data:**
- Filter: actor=devops_user, action=build_triggered, date=2026-05-10

**Steps:**
1. Log in as `admin` and navigate to `Admin > DevOps Audit Log`
2. Apply all three filters: actor=devops_user, action=build_triggered, date=2026-05-10
3. Observe the result

**Expected Result:**
- Exactly 2 events are shown (devops_user + build_triggered + 2026-05-10 match)
- Events from mgr_user and the deployment_approved event for devops_user are excluded

---

### TC-RDV-587 — Clearing all filters restores the full unfiltered audit log

| Field | Value |
|-------|-------|
| **Module** | Centralized Audit Log Admin Viewer |
| **Feature** | rfd-125 — Centralized audit log for devops actions with admin viewer |
| **Requirement Ref** | rfd-125 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Audit log contains 15 events total
- A user filter is currently applied showing 4 events

**Steps:**
1. Log in as `admin` and navigate to `Admin > DevOps Audit Log` with a filter active
2. Click the "Clear" / "Reset Filters" button (or clear all filter inputs manually)
3. Observe the result

**Expected Result:**
- All 15 events are shown after clearing filters
- Filter inputs are visibly cleared / reset to default state
- URL reflects no active filter parameters

---

### TC-RDV-588 — Non-admin user (Developer role) cannot access the audit log viewer

| Field | Value |
|-------|-------|
| **Module** | Centralized Audit Log Admin Viewer |
| **Feature** | rfd-125 — Centralized audit log for devops actions with admin viewer |
| **Requirement Ref** | rfd-125 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- `dev_user` has the Developer role (no admin privileges)

**Test Data:**
- URL: `/admin/devops_audit_log`

**Steps:**
1. Log in as `dev_user`
2. Navigate directly to `/admin/devops_audit_log`
3. Observe the response

**Expected Result:**
- HTTP 403 Forbidden or redirect to access-denied page
- No audit data is visible to `dev_user`
- The Admin menu does not show a "DevOps Audit Log" link for this user

---

### TC-RDV-589 — DevOps Engineer role cannot access the audit log viewer

| Field | Value |
|-------|-------|
| **Module** | Centralized Audit Log Admin Viewer |
| **Feature** | rfd-125 — Centralized audit log for devops actions with admin viewer |
| **Requirement Ref** | rfd-125 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- `devops_user` has the DevOps Engineer role (project-level, not Redmine admin)

**Test Data:**
- URL: `/admin/devops_audit_log`

**Steps:**
1. Log in as `devops_user`
2. Navigate directly to `/admin/devops_audit_log`
3. Observe the response

**Expected Result:**
- HTTP 403 Forbidden or redirect to access-denied page
- No audit data is visible to `devops_user`
- The Admin menu does not expose the audit log link for non-admins

---

### TC-RDV-590 — Audit log entries cannot be deleted through the UI

| Field | Value |
|-------|-------|
| **Module** | Centralized Audit Log Admin Viewer |
| **Feature** | rfd-125 — Centralized audit log for devops actions with admin viewer |
| **Requirement Ref** | rfd-125 |
| **Priority** | High |
| **Scenario Type** | Tamper-Evidence |

**Preconditions:**
- Audit log contains entries
- Tester is logged in as `admin`

**Steps:**
1. Log in as `admin` and navigate to `Admin > DevOps Audit Log`
2. Inspect each audit event row for any delete, remove, or clear button
3. Check the page source / DOM for hidden delete actions
4. Attempt to send a DELETE request to the audit log entry endpoint manually

**Expected Result:**
- No delete or remove control is present in the audit log viewer UI
- A manual DELETE HTTP request to the entry endpoint returns HTTP 404 or 405 (Method Not Allowed)
- No event is removed from the `redmineflux_devops_audit_events` table

---

### TC-RDV-591 — Audit log entries cannot be edited through the UI

| Field | Value |
|-------|-------|
| **Module** | Centralized Audit Log Admin Viewer |
| **Feature** | rfd-125 — Centralized audit log for devops actions with admin viewer |
| **Requirement Ref** | rfd-125 |
| **Priority** | High |
| **Scenario Type** | Tamper-Evidence |

**Preconditions:**
- Audit log contains entries
- Tester is logged in as `admin`

**Steps:**
1. Log in as `admin` and navigate to `Admin > DevOps Audit Log`
2. Inspect each audit event row for any edit or modify button
3. Attempt to send a PATCH/PUT request to the audit log entry endpoint manually

**Expected Result:**
- No edit control is present in the audit log viewer UI (read-only view)
- A manual PATCH/PUT request to the entry endpoint returns HTTP 404 or 405 (Method Not Allowed)
- The entry in `redmineflux_devops_audit_events` table remains unchanged

---

### TC-RDV-592 — params_digest is a SHA-256 hash and does not expose raw parameters

| Field | Value |
|-------|-------|
| **Module** | Centralized Audit Log Admin Viewer |
| **Feature** | rfd-125 — Centralized audit log for devops actions with admin viewer |
| **Requirement Ref** | rfd-125 |
| **Priority** | Medium |
| **Scenario Type** | Tamper-Evidence |

**Preconditions:**
- A deployment approval was recorded with known parameters

**Test Data:**
- Known params: `{ "deployment_id": 10, "environment": "production", "approved_by": "mgr_user" }`

**Steps:**
1. Log in as `admin` and navigate to `Admin > DevOps Audit Log`
2. Locate the deployment approval event
3. Inspect the `params_digest` field value

**Expected Result:**
- `params_digest` is a 64-character hex string (SHA-256 format)
- Raw parameter values (API keys, tokens, passwords) are NOT displayed in the UI
- The digest can be independently verified by hashing the known non-secret parameters

---

### TC-RDV-593 — Audit log viewer paginates when event count exceeds page limit

| Field | Value |
|-------|-------|
| **Module** | Centralized Audit Log Admin Viewer |
| **Feature** | rfd-125 — Centralized audit log for devops actions with admin viewer |
| **Requirement Ref** | rfd-125 |
| **Priority** | Medium |
| **Scenario Type** | Edge Case |

**Preconditions:**
- `redmineflux_devops_audit_events` contains more events than the page limit (e.g., 150 events, page limit = 25)

**Steps:**
1. Log in as `admin` and navigate to `Admin > DevOps Audit Log`
2. Observe the page for pagination controls
3. Click "Next Page" and observe the result
4. Navigate to the last page

**Expected Result:**
- Pagination controls (next / previous / page numbers) are visible
- Each page shows up to the configured limit of events
- Navigating pages displays the correct slice of results
- Total event count is shown (e.g., "150 events")

---

### TC-RDV-594 — Audit log shows empty state when no events exist

| Field | Value |
|-------|-------|
| **Module** | Centralized Audit Log Admin Viewer |
| **Feature** | rfd-125 — Centralized audit log for devops actions with admin viewer |
| **Requirement Ref** | rfd-125 |
| **Priority** | Low |
| **Scenario Type** | Edge Case |

**Preconditions:**
- `redmineflux_devops_audit_events` table is empty (freshly installed or cleared for test)

**Steps:**
1. Log in as `admin` and navigate to `Admin > DevOps Audit Log`
2. Observe the page content

**Expected Result:**
- Page loads with HTTP 200 (no server error)
- An empty state message is shown (e.g., "No audit events recorded yet")
- No blank table with headers only — a user-friendly empty state is displayed

---

### TC-RDV-595 — Filter with no matching results shows a no-results message

| Field | Value |
|-------|-------|
| **Module** | Centralized Audit Log Admin Viewer |
| **Feature** | rfd-125 — Centralized audit log for devops actions with admin viewer |
| **Requirement Ref** | rfd-125 |
| **Priority** | Low |
| **Scenario Type** | Negative |

**Preconditions:**
- Audit log contains events only from `devops_user` and `mgr_user`

**Test Data:**
- Filter actor: `nonexistent_user`

**Steps:**
1. Log in as `admin` and navigate to `Admin > DevOps Audit Log`
2. Apply the user filter for `nonexistent_user`
3. Observe the result

**Expected Result:**
- Page returns HTTP 200 (no error)
- A "No results found" or equivalent message is displayed
- No table rows are rendered
- The applied filter is still visible in the filter inputs
