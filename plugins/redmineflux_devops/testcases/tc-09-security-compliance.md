# Test Cases — Security & Compliance — Redmineflux DevOps

| Field | Value |
|-------|-------|
| **Plugin** | redmineflux_devops |
| **Module** | Security & Compliance |
| **TC Range** | TC-RDV-371 to TC-RDV-420 |
| **Total TCs** | 50 |
| **Requirement Coverage** | SEC-001, SEC-002, SEC-003, SEC-004, SEC-005, SEC-006 |

---

### TC-RDV-371 — SonarQube webhook ingests vulnerability scan results

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-028 — Vulnerability Scan Results |
| **Requirement Ref** | SEC-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project "phoenix-platform" has DevOps configured
- A SonarQube webhook is registered at `POST /devops/webhook/sonarqube/{project_identifier}`
- Tester has `view_security_scans` permission

**Test Data:**
- SonarQube webhook payload with 2 critical findings, 3 high, 5 medium, 7 low
- Finding details: CVE IDs, file paths, line numbers, descriptions

**Steps:**
1. Send the SonarQube webhook payload to the endpoint
2. Navigate to `Project > DevOps > Security`
3. Observe the vulnerability list

**Expected Result:**
- The Security tab loads with HTTP 200
- Vulnerabilities ingested from SonarQube appear in the list with scanner="sonarqube"
- Each finding shows: severity badge, title, file path, line number, CVE ID (where present)
- Records are stored in `redmineflux_devops_vulnerabilities` table
- Manual test reference I1 validated

---

### TC-RDV-372 — Snyk webhook ingests vulnerability scan results

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-028 — Vulnerability Scan Results |
| **Requirement Ref** | SEC-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- A Snyk webhook integration is configured for the project

**Test Data:**
- Snyk webhook payload identifying 1 critical dependency CVE and 4 high-severity issues

**Steps:**
1. Send the Snyk webhook payload to `POST /devops/webhook/snyk/{project_identifier}`
2. Navigate to `Project > DevOps > Security`
3. Observe the vulnerability list filtered to show Snyk findings

**Expected Result:**
- Snyk vulnerabilities appear with scanner="snyk"
- Severity levels correctly mapped from Snyk's severity model to critical/high/medium/low
- Dependency name, CVE ID, and fix advice (if provided) are stored and displayed

---

### TC-RDV-373 — Trivy webhook ingests container vulnerability scan results

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-028 — Vulnerability Scan Results |
| **Requirement Ref** | SEC-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- A Trivy CI output (JUnit/JSON) webhook or CI-triggered ingest is configured

**Test Data:**
- Trivy scan output for Docker image containing 2 critical CVEs in base OS packages

**Steps:**
1. Send the Trivy scan output to the ingest endpoint
2. Navigate to `Project > DevOps > Security`

**Expected Result:**
- Trivy findings appear with scanner="trivy"
- Container CVEs are listed with correct severity
- File/package path information is displayed where available

---

### TC-RDV-374 — Vulnerability list groups findings by severity

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-028, rfd-029 — Vulnerability Scan Results, Dependency Alerts |
| **Requirement Ref** | SEC-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Multiple vulnerabilities of all four severities exist in the database

**Test Data:**
- 3 Critical, 5 High, 8 Medium, 12 Low vulnerabilities

**Steps:**
1. Navigate to `Project > DevOps > Security`
2. Observe the organization of the vulnerability list

**Expected Result:**
- Vulnerabilities are grouped or sortable by severity: Critical → High → Medium → Low
- Critical findings appear at the top of the list
- Visual distinction between severity groups (e.g., section headers or colored rows)

---

### TC-RDV-375 — Vulnerability summary badge shows counts per severity

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-029 — Dependency Vulnerability Alerts |
| **Requirement Ref** | SEC-001, SEC-002 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Vulnerabilities exist across all severity levels in the project

**Test Data:**
- Critical: 3, High: 5, Medium: 8, Low: 12, Total: 28

**Steps:**
1. Navigate to `Project > DevOps > Security`
2. Observe the summary badge/bar at the top of the Security tab

**Expected Result:**
- A summary section displays individual counts: Critical: 3, High: 5, Medium: 8, Low: 12
- Total count (28) is also shown
- Badge uses severity-appropriate colors (Critical=red, High=orange, Medium=yellow, Low=blue/gray)
- Manual test reference I2 validated

---

### TC-RDV-376 — Vulnerability list filter by severity: critical

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-028 — Vulnerability Scan Results |
| **Requirement Ref** | SEC-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Vulnerabilities of mixed severities exist in the list

**Test Data:**
- 3 Critical, 5 High, 8 Medium, 12 Low

**Steps:**
1. Navigate to `Project > DevOps > Security`
2. Apply severity filter "Critical"
3. Observe the filtered list

**Expected Result:**
- Only 3 Critical vulnerabilities are displayed
- High, Medium, and Low findings are hidden
- Filter control shows "Critical" as the active selection
- Manual test reference I3 validated

---

### TC-RDV-377 — Vulnerability list filter by severity: high

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-028 — Vulnerability Scan Results |
| **Requirement Ref** | SEC-001 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Vulnerabilities of mixed severities exist

**Test Data:**
- 5 High-severity findings present

**Steps:**
1. Navigate to `Project > DevOps > Security`
2. Apply severity filter "High"

**Expected Result:**
- Exactly 5 high-severity vulnerabilities are displayed
- Other severity levels are filtered out

---

### TC-RDV-378 — Vulnerability list empty state handled gracefully

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-028 — Vulnerability Scan Results |
| **Requirement Ref** | SEC-001 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- No vulnerability records exist for the project in `redmineflux_devops_vulnerabilities`

**Test Data:**
- Empty vulnerabilities table for this project

**Steps:**
1. Navigate to `Project > DevOps > Security`
2. Observe the vulnerability list area

**Expected Result:**
- Page loads without errors (HTTP 200)
- An empty state message is shown (e.g., "No vulnerabilities found. Run a scan to see results.")
- Summary badge shows all zeros: Critical: 0, High: 0, Medium: 0, Low: 0
- No broken table layout or JavaScript errors
- Manual test reference I4 validated

---

### TC-RDV-379 — Security gate blocks deployment when critical vulnerabilities are open

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-090 — Security Gate for Deployments |
| **Requirement Ref** | SEC-003 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- `security_gate_enabled` flag is set to true on the production environment
- At least one CRITICAL vulnerability with status "open" exists for the project
- Tester has deploy permission but NOT `override_security_gate` permission

**Test Data:**
- Vulnerability: severity=critical, status=open, title="Remote Code Execution in log4j"

**Steps:**
1. Navigate to `Project > DevOps > Environments`
2. Select the production environment
3. Attempt to trigger a deployment (click "Deploy" button or send deploy request)
4. Observe the response

**Expected Result:**
- Deployment is blocked with a clear message: "Blocked: N critical vulnerabilities must be resolved first" (or equivalent)
- The Deploy button is disabled or clicking it shows the blocking message
- No deployment record is created in `redmineflux_devops_deployments`
- The `SecurityGate` service is invoked and returns a blocked status

---

### TC-RDV-380 — Security gate does not block deployment when no critical vulnerabilities are open

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-090 — Security Gate for Deployments |
| **Requirement Ref** | SEC-003 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- `security_gate_enabled` is true on the environment
- No CRITICAL vulnerabilities with status "open" exist (all fixed or ignored)
- High/Medium/Low open vulnerabilities may exist

**Test Data:**
- 3 High open vulnerabilities, 0 Critical open vulnerabilities

**Steps:**
1. Navigate to the production environment's deploy page
2. Attempt to trigger a deployment

**Expected Result:**
- Deployment proceeds normally (not blocked by security gate)
- The deploy button is enabled
- High-severity open vulnerabilities do not trigger the security gate (only Critical does)

---

### TC-RDV-381 — Security gate disabled: deployment proceeds even with critical vulnerabilities

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-090 — Security Gate for Deployments |
| **Requirement Ref** | SEC-003 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- `security_gate_enabled` is set to false on the environment
- 2 critical open vulnerabilities exist

**Test Data:**
- Environment: security_gate_enabled = false
- Vulnerabilities: 2 critical, status = open

**Steps:**
1. Navigate to the deploy page for an environment with the gate disabled
2. Attempt to trigger a deployment

**Expected Result:**
- Deployment is not blocked by the security gate (gate is disabled)
- The deploy proceeds (subject to other gates: approval, freeze, etc.)
- No security gate message is shown

---

### TC-RDV-382 — override_security_gate permission allows bypass with reason

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-090 — Security Gate for Deployments |
| **Requirement Ref** | SEC-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- `security_gate_enabled` is true and 1 critical open vulnerability exists
- Tester has the `override_security_gate` permission

**Test Data:**
- Override reason: "Emergency patch for production incident SEV1-20260521. Approved by CISO verbally."

**Steps:**
1. Navigate to the deployment page (which shows "Blocked" due to security gate)
2. Locate the "Override Security Gate" option (visible due to user's permission)
3. Enter the override reason (>= 20 characters)
4. Confirm the override
5. Proceed with the deployment

**Expected Result:**
- Override option is available to users with `override_security_gate` permission
- Deployment proceeds after submitting the reason
- The override is recorded in the DevOps Audit Log with actor, reason, timestamp, and IP
- Users without the permission do NOT see the override option

---

### TC-RDV-383 — Security gate override requires reason of at least 20 characters

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-090 — Security Gate for Deployments |
| **Requirement Ref** | SEC-003 |
| **Priority** | High |
| **Scenario Type** | Validation |

**Preconditions:**
- Tester has `override_security_gate` permission
- Security gate is blocking a deployment

**Test Data:**
- Short reason: "Approved" (8 characters — fails)
- Exactly 19 characters: "Short reason test!!" (fails)
- Exactly 20 characters: "Valid override reason" (passes)

**Steps:**
1. Attempt to submit an override reason with fewer than 20 characters
2. Observe the validation response
3. Submit a reason with exactly 20 characters

**Expected Result:**
- Submission with < 20 characters is rejected with a validation error: "Override reason must be at least 20 characters"
- Submission with exactly 20 characters is accepted
- The form does not submit and the deployment is not created when validation fails

---

### TC-RDV-384 — Security gate override reason is recorded in audit log

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-090, rfd-116 — Security Gate, Audit Trail |
| **Requirement Ref** | SEC-003, SEC-006 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- A valid security gate override was performed with a reason

**Test Data:**
- Override by user "devops_user", reason "Emergency patch approved by security lead."

**Steps:**
1. Perform a security gate override (per TC-RDV-382)
2. Navigate to `Admin > DevOps Audit Log`
3. Search or scroll to find the override event

**Expected Result:**
- Audit log contains an entry with:
  - action: "override_security_gate" (or equivalent)
  - actor: "devops_user"
  - target: deployment or environment identifier
  - reason: "Emergency patch approved by security lead."
  - timestamp: correct time
  - IP address recorded
- The entry is immutable (no delete option in the UI)

---

### TC-RDV-385 — Compliance checklist auto-evaluates PRs merged item

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-091 — Compliance Checklist for Release |
| **Requirement Ref** | SEC-004 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- A release exists for the project with linked issues
- All linked issues have associated PRs with status "merged"

**Test Data:**
- Release v2.0.0 with 5 issues, all with merged PRs

**Steps:**
1. Navigate to `Project > DevOps > Releases`
2. Open release v2.0.0
3. Navigate to the "Compliance" tab or section
4. Observe the compliance checklist

**Expected Result:**
- "PRs Merged" checklist item shows a green checkmark (auto-evaluated as passed)
- The `ComplianceEvaluator` service has checked all linked PRs and found them merged
- Item status is computed automatically without manual input

---

### TC-RDV-386 — Compliance checklist auto-evaluates tests green item

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-091 — Compliance Checklist for Release |
| **Requirement Ref** | SEC-004 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Release is linked to a build with test results
- All tests in the latest build for the release are passing

**Test Data:**
- Build linked to release: status=success, test_results: 150 passed, 0 failed

**Steps:**
1. Navigate to release compliance checklist
2. Observe the "Tests Green" item

**Expected Result:**
- "Tests Green" shows as passed (green checkmark)
- If any tests were failing, this item would show as failed (red)

---

### TC-RDV-387 — Compliance checklist auto-evaluates no critical vulnerabilities item

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-091 — Compliance Checklist for Release |
| **Requirement Ref** | SEC-004 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Release compliance checklist is visible
- Zero critical open vulnerabilities exist for the project

**Test Data:**
- Vulnerability state: 0 Critical open, 2 High open

**Steps:**
1. Navigate to the release compliance checklist
2. Observe the "No Critical Vulnerabilities" item

**Expected Result:**
- "No Critical Vulnerabilities" item shows as passed
- High-severity open vulnerabilities do not affect this specific checklist item

---

### TC-RDV-388 — Compliance checklist auto-evaluates required approvals item

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-091 — Compliance Checklist for Release |
| **Requirement Ref** | SEC-004 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Release approval workflow is configured (Dev Lead → QA → PM)
- All three approval roles have approved the release

**Test Data:**
- Dev Lead approved at 10:00, QA approved at 11:00, PM approved at 12:00

**Steps:**
1. Navigate to the release compliance checklist
2. Observe the "Required Approvals" item

**Expected Result:**
- "Required Approvals" item shows as passed
- All three required approvers are reflected

---

### TC-RDV-389 — Compliance checklist blocks Publish transition when items fail

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-091 — Compliance Checklist for Release |
| **Requirement Ref** | SEC-004 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- A release exists with at least one compliance checklist item failing (e.g., critical vulnerability open)
- Tester has `manage_releases` permission

**Test Data:**
- 1 Critical open vulnerability (causes compliance item to fail)

**Steps:**
1. Navigate to the release page
2. Attempt to click "Publish" or transition the release to "Published" state
3. Observe the result

**Expected Result:**
- The Publish transition is blocked
- An error message indicates which compliance items are failing
- The release status does not change to Published
- The "Publish" button is either disabled or clicking it shows a validation error

---

### TC-RDV-390 — Compliance checklist supports manual items

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-091 — Compliance Checklist for Release |
| **Requirement Ref** | SEC-004 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- A manual compliance checklist item exists (e.g., "Legal review completed")
- Tester has the ability to check/uncheck manual items

**Test Data:**
- Manual item: "Legal review completed" (type=manual, checked=false)

**Steps:**
1. Navigate to the release compliance checklist
2. Locate the manual item "Legal review completed"
3. Check/tick the manual item checkbox
4. Save or auto-save
5. Observe the item state

**Expected Result:**
- Manual item can be checked by an authorized user
- State persists after page reload
- Manual and auto-evaluated items are visually distinguished in the checklist

---

### TC-RDV-391 — SonarQube quality gate stores outcome per commit SHA

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-107 — Code Quality Gate Results |
| **Requirement Ref** | SEC-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- SonarQube webhook handler is configured
- A PR exists with a known commit SHA

**Test Data:**
- SonarQube webhook with `commit_sha: abc1234`, `gate_status: passed`, `project_key: phoenix`

**Steps:**
1. Send the SonarQube quality gate webhook to the ingest endpoint
2. Check the `redmineflux_devops_code_quality_results` table for the stored record
3. Navigate to the PR list and find the PR matching commit SHA `abc1234`

**Expected Result:**
- A record is stored in `redmineflux_devops_code_quality_results` with the correct commit_sha and gate_status
- The PR badge for that commit SHA shows "Quality Gate: Passed"
- The result is matched to the PR via `commit_sha`

---

### TC-RDV-392 — PR badge shows quality gate passed status

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-107 — Code Quality Gate Results |
| **Requirement Ref** | SEC-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- A PR exists linked to a commit SHA with a passing quality gate result

**Test Data:**
- Quality gate result: gate_status=passed, commit_sha matches an open PR

**Steps:**
1. Navigate to `Project > DevOps > Pull Requests`
2. Locate the PR with the matching commit SHA
3. Observe the quality gate badge on the PR card

**Expected Result:**
- Badge shows "Quality Gate: Passed" with a green indicator
- Badge is visible on the PR card without expanding or navigating to a detail page

---

### TC-RDV-393 — PR badge shows quality gate failed status

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-107 — Code Quality Gate Results |
| **Requirement Ref** | SEC-001 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- A PR exists with a failing quality gate result

**Test Data:**
- Quality gate result: gate_status=failed, commit_sha matches a PR

**Steps:**
1. Navigate to `Project > DevOps > Pull Requests`
2. Locate the PR with the failing quality gate

**Expected Result:**
- Badge shows "Quality Gate: Failed" with a red indicator
- Developer is clearly notified of the gate failure

---

### TC-RDV-394 — PR badge shows quality gate warn status

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-107 — Code Quality Gate Results |
| **Requirement Ref** | SEC-001 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- A PR has a quality gate result with warn status (partial pass)

**Test Data:**
- Quality gate result: gate_status=warn, commit_sha matches a PR

**Steps:**
1. Navigate to `Project > DevOps > Pull Requests`
2. Locate the PR with the warn quality gate

**Expected Result:**
- Badge shows "Quality Gate: Warn" with an amber/yellow indicator
- Warn is distinct from both Passed and Failed states

---

### TC-RDV-395 — FOSSA webhook ingests dependency license data

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-115 — License Compliance |
| **Requirement Ref** | SEC-005 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- FOSSA webhook integration is configured for the project
- FOSSA has scanned the project's dependencies

**Test Data:**
- FOSSA webhook payload with dependencies:
  - lodash@4.17.21, license=MIT
  - mysql2@3.0.0, license=GPL-2.0
  - moment@2.29.4, license=MIT
  - some-lgpl-lib@1.0.0, license=LGPL-2.1

**Steps:**
1. Send the FOSSA webhook payload to the ingest endpoint
2. Navigate to `Project > DevOps > Security > Licenses tab`
3. Observe the license list

**Expected Result:**
- All four dependencies appear with their license types
- Records stored in `redmineflux_devops_dependency_licenses` table
- MIT licenses show risk level "Low"
- GPL-2.0 shows risk level "High"
- LGPL-2.1 shows risk level "Medium"

---

### TC-RDV-396 — License risk mapping: GPL is high risk

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-115 — License Compliance |
| **Requirement Ref** | SEC-005 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- A dependency with GPL license has been ingested

**Test Data:**
- Dependency: gpl-library@2.0.0, license=GPL-3.0

**Steps:**
1. Navigate to the Licenses tab
2. Locate gpl-library in the list

**Expected Result:**
- Risk level shows "High" for GPL-3.0
- The `LicenseRiskMapper` YAML-driven config applies GPL → high risk mapping
- High-risk licenses are visually highlighted (e.g., red badge or icon)

---

### TC-RDV-397 — License risk mapping: LGPL is medium risk

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-115 — License Compliance |
| **Requirement Ref** | SEC-005 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- A dependency with LGPL license has been ingested

**Test Data:**
- Dependency: lgpl-lib@1.5.0, license=LGPL-2.1

**Steps:**
1. Navigate to the Licenses tab
2. Locate lgpl-lib in the list

**Expected Result:**
- Risk level shows "Medium" for LGPL-2.1
- Medium-risk indicator uses amber/yellow styling

---

### TC-RDV-398 — License risk mapping: MIT, Apache, BSD are low risk

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-115 — License Compliance |
| **Requirement Ref** | SEC-005 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Dependencies with MIT, Apache-2.0, and BSD-3-Clause licenses have been ingested

**Test Data:**
- react@18.0.0, license=MIT
- spring-boot@3.0.0, license=Apache-2.0
- openssl@3.0.0, license=BSD-3-Clause

**Steps:**
1. Navigate to the Licenses tab
2. Observe risk levels for all three dependencies

**Expected Result:**
- All three show risk level "Low"
- Low-risk licenses display with green or neutral styling
- The mapping covers all three license families (MIT, Apache, BSD)

---

### TC-RDV-399 — Licenses tab filter UI works correctly

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-115 — License Compliance |
| **Requirement Ref** | SEC-005 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Multiple dependency license records exist with different risk levels and license types

**Test Data:**
- Mixed: 5 Low (MIT), 3 Medium (LGPL), 4 High (GPL)

**Steps:**
1. Navigate to `Project > DevOps > Security > Licenses tab`
2. Apply filter for "High Risk" licenses
3. Observe filtered results
4. Apply filter for license type "GPL"
5. Observe filtered results

**Expected Result:**
- Filtering by "High Risk" shows only the 4 GPL dependencies
- Filtering by license type "GPL" also shows the appropriate subset
- Clearing filter restores all 12 records
- Filter state is maintained during the session

---

### TC-RDV-400 — License deduplication on project, dependency name, version, source

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-115 — License Compliance |
| **Requirement Ref** | SEC-005 |
| **Priority** | High |
| **Scenario Type** | Edge |

**Preconditions:**
- A dependency record already exists in `redmineflux_devops_dependency_licenses` for (project_id, dependency_name, version, source)

**Test Data:**
- First ingest: project=phoenix, dependency=lodash, version=4.17.21, source=fossa → creates record
- Second ingest: same (project, dependency, version, source) combination

**Steps:**
1. Ingest the first FOSSA payload for lodash@4.17.21
2. Ingest the same payload again (or a subsequent FOSSA scan with the same dependency)
3. Query the `redmineflux_devops_dependency_licenses` table

**Expected Result:**
- Only one record exists for (phoenix, lodash, 4.17.21, fossa)
- The unique index on (project_id, dependency_name, version, source) prevents duplication
- The second ingest performs an upsert or skip, not an insert

---

### TC-RDV-401 — Audit trail logs deployment action

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-116 — Audit Trail for All DevOps Actions |
| **Requirement Ref** | SEC-006 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Tester is logged in as "devops_user" with deploy permission
- A deployment is triggered to the staging environment

**Test Data:**
- Deployment: version=v1.5.0, environment=staging, actor=devops_user

**Steps:**
1. Trigger a deployment to staging
2. Navigate to `Admin > DevOps Audit Log`
3. Search for events by actor "devops_user"

**Expected Result:**
- An audit log entry exists with:
  - action: "deployment_triggered" (or equivalent)
  - actor: devops_user
  - target: staging environment / deployment reference
  - timestamp: within seconds of the deployment trigger
  - IP address: requester's IP
  - params_digest: SHA256 hash of non-secret parameters

---

### TC-RDV-402 — Audit trail logs approval action

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-116 — Audit Trail for All DevOps Actions |
| **Requirement Ref** | SEC-006 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- A deployment pending approval exists
- Approver "mgr_user" approves it

**Test Data:**
- Approver: mgr_user, deployment ID: 99

**Steps:**
1. Approve the pending deployment as mgr_user
2. Navigate to `Admin > DevOps Audit Log`
3. Find the approval event

**Expected Result:**
- Audit entry: action="deployment_approved", actor=mgr_user, target=deployment#99, timestamp, IP
- The approval comment (if provided) may be included in params_digest or stored separately

---

### TC-RDV-403 — Audit trail logs security gate override

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-116 — Audit Trail for All DevOps Actions |
| **Requirement Ref** | SEC-006 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- A security gate override was performed (per TC-RDV-382)

**Test Data:**
- Override actor: devops_user, reason provided

**Steps:**
1. Perform a security gate override
2. Check the audit log for the override event

**Expected Result:**
- Audit entry: action="security_gate_overridden", actor=devops_user, override reason recorded, timestamp, IP

---

### TC-RDV-404 — Audit trail logs environment lock action

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-116 — Audit Trail for All DevOps Actions |
| **Requirement Ref** | SEC-006 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Tester has permission to lock environments
- An environment is locked

**Test Data:**
- Lock action: actor=devops_user, environment=production, reason="Pre-release freeze"

**Steps:**
1. Lock the production environment with a reason
2. Navigate to `Admin > DevOps Audit Log`
3. Find the lock event

**Expected Result:**
- Audit entry: action="environment_locked", actor=devops_user, target=production, lock_reason noted, timestamp, IP

---

### TC-RDV-405 — Audit trail viewer accessible to admin only

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-116 — Audit Trail for All DevOps Actions |
| **Requirement Ref** | SEC-006 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- Three users exist: admin (admin role), devops_user (DevOps Engineer role), dev_user (Developer role)
- Audit log contains entries

**Test Data:**
- URL: `/admin/devops_audit`

**Steps:**
1. Log in as `devops_user` and navigate to `/admin/devops_audit`
2. Observe the response
3. Log in as `dev_user` and navigate to `/admin/devops_audit`
4. Observe the response
5. Log in as `admin` and navigate to `/admin/devops_audit`
6. Observe the response

**Expected Result:**
- devops_user: receives HTTP 403 or is redirected to access-denied page
- dev_user: receives HTTP 403 or is redirected to access-denied page
- admin: audit log viewer loads successfully with HTTP 200
- Only admin-role users can access the audit log (no delegation to DevOps Engineer per the permissions matrix)

---

### TC-RDV-406 — Audit trail filter by user

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-116 — Audit Trail for All DevOps Actions |
| **Requirement Ref** | SEC-006 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Audit log contains events from multiple users: devops_user, mgr_user, admin

**Test Data:**
- 5 events from devops_user, 3 from mgr_user, 7 from admin

**Steps:**
1. Log in as admin, navigate to `Admin > DevOps Audit Log`
2. Apply user filter for "devops_user"
3. Observe the filtered results

**Expected Result:**
- Exactly 5 events from devops_user are displayed
- Events from mgr_user and admin are hidden
- User filter is applied server-side

---

### TC-RDV-407 — Audit trail filter by action type

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-116 — Audit Trail for All DevOps Actions |
| **Requirement Ref** | SEC-006 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Audit log contains multiple action types: deployments, approvals, overrides, locks

**Test Data:**
- Filter by action type: "deployment_triggered"

**Steps:**
1. Navigate to the audit log viewer
2. Apply action filter "deployment_triggered"
3. Observe filtered results

**Expected Result:**
- Only deployment trigger events are shown
- Other action types (approval, override, lock) are hidden

---

### TC-RDV-408 — Audit trail filter by date range

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-116 — Audit Trail for All DevOps Actions |
| **Requirement Ref** | SEC-006 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Audit log contains events spanning multiple dates

**Test Data:**
- Events on 2026-05-19, 2026-05-20, 2026-05-21
- Filter range: 2026-05-20 to 2026-05-20

**Steps:**
1. Navigate to the audit log viewer
2. Set date range filter: from 2026-05-20 to 2026-05-20
3. Apply the filter

**Expected Result:**
- Only events from 2026-05-20 are shown
- Events from 2026-05-19 and 2026-05-21 are excluded
- Date range boundaries are inclusive

---

### TC-RDV-409 — Audit trail is append-only: no delete option in UI

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-116 — Audit Trail for All DevOps Actions |
| **Requirement Ref** | SEC-006 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- Audit log has entries
- Logged in as admin

**Test Data:**
- N/A

**Steps:**
1. Navigate to `Admin > DevOps Audit Log`
2. Inspect all available UI controls for each audit event row
3. Inspect available buttons/links on the page
4. Attempt to find any delete, archive, or clear action

**Expected Result:**
- No delete button, trash icon, or "Clear Log" action is present in the UI
- Individual audit entries cannot be deleted through the interface
- The audit log is read-only (append-only) per the security model
- The `redmineflux_devops_audit_events` table has no destroy actions exposed

---

### TC-RDV-410 — Audit trail records actor, action, target, timestamp, IP, and params_digest

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-116 — Audit Trail for All DevOps Actions |
| **Requirement Ref** | SEC-006 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- A privileged DevOps action has just been performed

**Test Data:**
- Action: release published, actor: mgr_user, target: release v2.0.0

**Steps:**
1. Publish a release as mgr_user
2. Navigate to the audit log and locate the entry
3. Expand or inspect the full details of the entry

**Expected Result:**
- Entry contains all six required fields:
  1. actor: mgr_user (user ID and/or name)
  2. action: release_published (or equivalent)
  3. target: release identifier
  4. timestamp: exact date-time of the action
  5. IP address: requester's IP
  6. params_digest: SHA256 hash of parameters (secrets excluded)
- Sensitive parameters are NOT shown in plaintext

---

### TC-RDV-411 — SSRF attack attempt on vulnerability scanner URL is rejected

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-028, rfd-033 — Vulnerability Scan Results, SSRF Guard |
| **Requirement Ref** | SEC-001 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- A configuration endpoint allows specifying a scanner URL or callback URL
- SSRF guard is implemented

**Test Data:**
- SSRF attempt URLs:
  - `http://169.254.169.254/latest/meta-data/` (AWS metadata)
  - `http://10.0.0.1/internal-api`
  - `http://localhost:8080/admin`
  - `file:///etc/passwd`

**Steps:**
1. Attempt to configure a vulnerability scanner integration with each SSRF test URL
2. Alternatively, if a webhook callback URL is configurable, attempt to set it to a private IP
3. Trigger a scanner action or save the configuration
4. Observe the system response

**Expected Result:**
- All SSRF attempt URLs are rejected with a clear error message
- No outbound HTTP request is made to any of these addresses
- The SSRF guard checks the resolved IP against private/loopback ranges
- The system returns an appropriate validation error (not a server error/500)

---

### TC-RDV-412 — XSS payload in release notes is sanitized

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-112 — Release Notes Editor |
| **Requirement Ref** | SEC-006 (general security) |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- A release exists with editable release notes
- Tester has `manage_releases` permission

**Test Data:**
- XSS payload: `<script>alert('XSS')</script>`
- Also test: `<img src=x onerror="alert('XSS')">`

**Steps:**
1. Navigate to a release's "Release Notes" tab
2. Enter the XSS payload as release note content and save
3. View the release notes page
4. Inspect the rendered HTML in the browser source

**Expected Result:**
- The script tag and onerror handlers are stripped or escaped
- No JavaScript alert executes in the browser
- The output is sanitized through Redmine's HTML allow-list
- The stored value in the database either has the payload stripped or escaped

---

### TC-RDV-413 — XXE payload in JUnit XML is rejected

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-104 — JUnit Ingestion REST Endpoint |
| **Requirement Ref** | SEC-001 (general security) |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- JUnit XML ingest endpoint is accessible at `POST /devops/builds/:id/test_results`

**Test Data:**
- XXE payload embedded in JUnit XML:
  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
  <testsuites>
    <testsuite name="&xxe;">
    </testsuite>
  </testsuites>
  ```

**Steps:**
1. Send the XXE-laced JUnit XML to `POST /devops/builds/1/test_results`
2. Observe the server response
3. Verify that no file system data was returned or processed

**Expected Result:**
- The request is rejected or the XML is parsed without processing external entity references
- The REXML parser (used per rfd-020) has XXE protection active (REXML is safe by default in Ruby)
- Server returns HTTP 400 or 422 with an appropriate error
- No file system contents are returned to the attacker
- No server-side exception is exposed to the caller

---

### TC-RDV-414 — API tokens displayed as masked password inputs in settings

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-102 — Plugin Settings |
| **Requirement Ref** | SEC-001 (general security) |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- Admin has configured API tokens for monitoring connections (PagerDuty, Datadog, etc.)

**Test Data:**
- PagerDuty API token: "pagerduty-secret-key-12345"
- Datadog API key: "dd-api-key-abcdef"

**Steps:**
1. Navigate to `Admin > Plugins > Configure` for the DevOps plugin (or the project Settings > DevOps > Connections)
2. Observe the API token input fields for monitoring connections
3. Inspect the HTML source of the token fields

**Expected Result:**
- API token fields are rendered as `<input type="password">` (masked)
- The token value is NOT visible in plaintext in the form field or page source
- Sensitive fields (API tokens, keys) consistently use password input rendering per rfd-102
- Tokens are stored AES-256 encrypted in the database, not in plaintext

---

### TC-RDV-415 — Developer user blocked from viewing Security tab

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-003 — Permission Model |
| **Requirement Ref** | SEC-001 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "dev_user" is a Developer in the project
- Developer role does NOT have `view_security_scans` permission (per permissions matrix)

**Test Data:**
- User: dev_user (Developer role)
- URL: `/projects/phoenix-platform/devops_vulnerabilities` (or equivalent Security tab)

**Steps:**
1. Log in as `dev_user`
2. Navigate to `Project > DevOps`
3. Observe whether the "Security" tab is visible in the sub-navigation
4. Attempt to navigate directly to the Security tab URL

**Expected Result:**
- The "Security" tab is not shown in the sub-navigation for the Developer role
- Direct URL access returns HTTP 403 or redirects to access-denied
- Developer cannot see vulnerability data, security scan results, or compliance checklists

---

### TC-RDV-416 — DevOps Engineer can view Security tab

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-003 — Permission Model |
| **Requirement Ref** | SEC-001 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "devops_user" has DevOps Engineer role with `view_security_scans` permission

**Test Data:**
- User: devops_user (DevOps Engineer role)

**Steps:**
1. Log in as `devops_user`
2. Navigate to `Project > DevOps > Security`

**Expected Result:**
- Security tab is visible and accessible
- Vulnerability list loads with HTTP 200
- DevOps Engineer can view all security data

---

### TC-RDV-417 — Compliance checklist all items pass: Publish transition allowed

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-091 — Compliance Checklist for Release |
| **Requirement Ref** | SEC-004 |
| **Priority** | High |
| **Scenario Type** | Workflow |

**Preconditions:**
- All compliance checklist items are passing:
  - PRs merged: yes
  - Tests green: yes
  - No critical vulnerabilities: yes
  - Required approvals: yes
  - All manual items: checked

**Test Data:**
- Release v3.0.0 with all compliance conditions met

**Steps:**
1. Navigate to release v3.0.0
2. Verify all compliance items show green checkmarks
3. Click the "Publish" button

**Expected Result:**
- "Publish" button is enabled
- Clicking Publish transitions the release to "Published" state
- A success notification is shown
- The release status is recorded as published with timestamp

---

### TC-RDV-418 — Vulnerability status can be marked as fixed

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-028 — Vulnerability Scan Results |
| **Requirement Ref** | SEC-001 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- A vulnerability with status "open" exists in the list
- Tester has `view_security_scans` permission and appropriate edit rights

**Test Data:**
- Vulnerability: title="Log4Shell", severity=critical, status=open

**Steps:**
1. Navigate to `Project > DevOps > Security`
2. Locate the Log4Shell vulnerability
3. Mark it as "Fixed" (if UI action is available)
4. Observe the status change

**Expected Result:**
- Vulnerability status updates to "fixed"
- `fixed_at` timestamp is set on the record
- The vulnerability is no longer counted in the "open critical" count for security gate checks
- Summary badge updates accordingly

---

### TC-RDV-419 — Audit log prune rake task does not affect recent entries

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-116 — Audit Trail for All DevOps Actions |
| **Requirement Ref** | SEC-006 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Audit log contains entries from >1 year ago and entries from this week
- The optional retention rake task `prune_audit_events_older_than` is available

**Test Data:**
- Old entries: 500 records from 2025-01-01 to 2025-03-01
- Recent entries: 50 records from 2026-05-01 to 2026-05-21

**Steps:**
1. Run `rake prune_audit_events_older_than[365]` (prune entries older than 365 days)
2. Navigate to `Admin > DevOps Audit Log`
3. Verify which entries remain

**Expected Result:**
- Old entries (from 2025) are removed
- Recent entries (from 2026) remain untouched
- No recent entries are accidentally deleted
- The rake task correctly calculates the cutoff date

---

### TC-RDV-420 — Full security workflow: scan → gate block → override → audit trail

| Field | Value |
|-------|-------|
| **Module** | Security & Compliance |
| **Feature** | rfd-028, rfd-090, rfd-116 — Vulnerability Scan, Security Gate, Audit Trail |
| **Requirement Ref** | SEC-001, SEC-003, SEC-006 |
| **Priority** | High |
| **Scenario Type** | Workflow |

**Preconditions:**
- Security gate is enabled on production environment
- User "devops_user" has `override_security_gate` permission
- Admin user can access the audit log

**Test Data:**
- Trivy scan payload introducing 1 critical vulnerability
- Override reason: "Mitigating controls confirmed by security team."

**Steps:**
1. Send a Trivy webhook introducing a critical vulnerability to the project
2. Navigate to `Project > DevOps > Security` — verify critical vulnerability appears
3. Attempt to deploy to production — verify the security gate blocks it
4. Use the "Override Security Gate" option with the override reason
5. Confirm the deployment proceeds
6. Navigate to `Admin > DevOps Audit Log`
7. Verify the full audit trail: vulnerability ingest event, security gate override event, deployment event

**Expected Result:**
- Step 2: Critical vulnerability visible with correct details
- Step 3: Deployment blocked with clear message citing critical vulnerability
- Step 4: Override accepted (reason has >= 20 characters)
- Step 5: Deployment proceeds and is recorded
- Step 7: Three audit entries exist in chronological order covering all privileged actions in this workflow
- All entries contain: actor, action, target, timestamp, IP, params_digest
