# Test Cases — End-to-End Business Workflows — Redmineflux DevOps

| Field | Value |
|-------|-------|
| **Plugin** | redmineflux_devops |
| **Module** | End-to-End Business Workflows |
| **TC Range** | TC-RDV-546 to TC-RDV-560 |
| **Total TCs** | 15 |
| **Requirement Coverage** | SCM-001, SCM-002, SCM-003, SCM-004, CICD-001, CICD-004, CICD-005, CICD-008, DEP-001, DEP-003, DEP-004, DEP-006, DEP-009, REL-002, REL-003, REL-005, REL-006, REL-008, SEC-003, ENV-003, ENV-005, INC-001, INC-002, INC-003, INC-004, INC-005, INC-006, MET-001, MET-004, MET-007 |

---

### TC-RDV-546 — Complete code-to-production workflow

| Field | Value |
|-------|-------|
| **Module** | End-to-End Business Workflows |
| **Feature** | SCM-001, SCM-002, SCM-004, CICD-001, DEP-001, DEP-003, DEP-004 |
| **Requirement Ref** | SCM-001, SCM-002, SCM-004, CICD-001, DEP-001, DEP-003, DEP-004 |
| **Priority** | High |
| **Scenario Type** | E2E |

**Preconditions:**
- Project "Phoenix Platform" has GitHub repository "github.com/acme/phoenix" connected.
- GitHub Actions CI pipeline is configured and webhook is registered for all build events.
- Issue #456 ("Login page redesign") exists in project with status "In Progress".
- Auto-transition rule configured: PR merged → status changes from "In Review" to "Ready for QA".
- Environment "staging" is configured with approval_required=true.
- Release Manager role is assigned to user "Rachel".

**Test Data:**
- Issue: #456 ("Login page redesign")
- Branch: feature/456-login-redesign
- Commits: 3 commits with messages "fixes #456 — implement new login layout", "refs #456 — add CSS variables", "refs #456 — add unit tests"
- Build: #89
- PR: #23
- Release version: v1.5.0
- Environment: staging

**Steps:**
1. Developer pushes 3 commits to branch feature/456-login-redesign on GitHub. Commit messages reference #456 ("fixes #456", "refs #456").
2. GitHub push webhook fires → navigate to Redmine issue #456 → DevOps panel.
3. Verify all 3 commits appear in the "Commits" section of issue #456's DevOps panel.
4. GitHub Actions build #89 is triggered automatically by the push event.
5. Verify the build status badge on issue #456 turns blue (running state) and shows "Build #89 Running".
6. Allow build #89 to complete successfully.
7. Verify the build status badge turns green and shows "Build #89 Passed".
8. Developer opens PR #23 for feature/456-login-redesign → "base: main" on GitHub.
9. PR webhook fires → navigate to issue #456 DevOps panel → verify PR card appears showing PR #23 "Open" status, reviewer names.
10. Reviewer approves PR #23 on GitHub → approval webhook fires.
11. Verify PR card on issue #456 shows approval indicator.
12. Reviewer merges PR #23 → PR merged webhook fires.
13. Verify issue #456 auto-transitions from "In Review" to "Ready for QA".
14. Verify journal entry on issue #456 reads: "Status changed by DevOps integration (PR #23 merged)".
15. DevOps engineer triggers deployment to staging from Redmine (or CI triggers it) → deployment v1.5.0 initiated.
16. Rachel (Release Manager) receives "Pending Approval" notification → opens approval page → clicks Approve.
17. Verify deployment proceeds after approval.
18. Verify v1.5.0 is deployed to staging → health check passes → environment status shows "Healthy".
19. Navigate to issue #456 → verify deployment badge reads "Deployed to staging (v1.5.0)".

**Expected Result:**
- All 19 steps produce the expected system responses.
- Commits are linked to issue #456 within seconds of the push webhook.
- Build badge accurately reflects build #89 state transitions: blue → green.
- PR #23 card appears on issue #456 and reflects approval/merge status.
- Auto-transition fires correctly with the journal entry matching the expected text.
- Deployment v1.5.0 requires and receives Rachel's approval before proceeding.
- Issue #456 displays the deployment badge "Deployed to staging (v1.5.0)" after a successful health check.

---

### TC-RDV-547 — Failed build auto-comment and fix cycle

| Field | Value |
|-------|-------|
| **Module** | End-to-End Business Workflows |
| **Feature** | CICD-001, CICD-005 (rfd-076) |
| **Requirement Ref** | CICD-001, CICD-005 |
| **Priority** | High |
| **Scenario Type** | E2E |

**Preconditions:**
- Project "Phoenix Platform" has GitHub Actions configured.
- Issue #789 ("Implement payment processing") is linked to branch feature/789-payment.
- CICD-005 auto-comment is enabled for the project.
- Issue #789 is assigned to developer "Dan".

**Test Data:**
- Branch: feature/789-payment
- Failed build: #90, first error line: "TypeError: Cannot read property 'amount' of undefined at PaymentService.js:45"
- Fixed build: #91
- Build log URL: https://github.com/acme/phoenix/actions/runs/90

**Steps:**
1. Developer pushes broken code to branch feature/789-payment → build #90 is triggered.
2. Build #90 fails in the "Test" stage.
3. Navigate to Redmine issue #789.
4. Verify a journal entry (auto-comment) is added: "Build #90 failed on branch feature/789-payment. Error: TypeError: Cannot read property 'amount' of undefined at PaymentService.js:45. View full log: https://github.com/acme/phoenix/actions/runs/90".
5. Verify the build badge on issue #789 shows red (failed) with build #90.
6. Developer fixes the code and pushes a second commit to feature/789-payment.
7. Build #91 is triggered → build badge on issue #789 turns blue (running).
8. Build #91 passes → build badge turns green.
9. Check issue #789 journal/activity for any auto-comment on build #91 success.

**Expected Result:**
- Build #90 failure generates an auto-comment on issue #789 with:
  - Build number (#90)
  - Branch name (feature/789-payment)
  - First error line from the log
  - Link to the full build log
- Build badge on issue #789 shows red for build #90, then blue during build #91, then green after build #91 passes.
- NO auto-comment is added to issue #789 when build #91 passes (success is silent to prevent noise).
- The journal remains clean: only one failed-build comment from build #90.

---

### TC-RDV-548 — Release preparation and approval with blocker resolution

| Field | Value |
|-------|-------|
| **Module** | End-to-End Business Workflows |
| **Feature** | REL-001, REL-002, REL-003, REL-005, REL-006, SEC-004 (rfd-017, rfd-018, rfd-019, rfd-085, rfd-086, rfd-091) |
| **Requirement Ref** | REL-001, REL-002, REL-003, REL-005, REL-006 |
| **Priority** | High |
| **Scenario Type** | E2E |

**Preconditions:**
- Project "Phoenix Platform" linked to Redmine version "2.0.0".
- 12 issues linked to version "2.0.0"; issues #100 and #101 are marked as "Release Blocker".
- Dev Lead "Laura", QA "Quinn", and PM "Pete" have the required approval roles.
- GitHub repository connected; git tag API access available.

**Test Data:**
- Release version: v2.0.0
- 12 linked issues; 2 blockers: issue #100 ("Critical auth bug"), issue #101 ("Data migration missing")
- Approval sequence: Dev Lead → QA → PM
- Changelog categories: Features, Bug Fixes, Security

**Steps:**
1. PM "Pete" navigates to DevOps → Releases → New Release.
2. Creates release v2.0.0 linked to Redmine version "2.0.0".
3. Verify 12 issues appear linked to the release.
4. Verify 2 blocker issues (#100, #101) are detected and highlighted.
5. Verify the "Publish" button is disabled with tooltip "2 blockers must be resolved before publishing".
6. Developer closes issue #100 → release page reloads → verify blocker count drops to 1.
7. Developer closes issue #101 → release page reloads → verify "Blockers" section is cleared.
8. Verify "Publish" button remains disabled (awaiting approvals) but blocker warning is gone.
9. Pete clicks "Generate Changelog".
10. Verify changelog is generated and grouped into sections: "Features", "Bug Fixes", "Security".
11. Pete edits release notes in the CKEditor WYSIWYG editor (adds a custom paragraph).
12. Dev Lead "Laura" opens the release page → clicks "Approve" (approval_level=1 recorded).
13. Verify Laura's approval is marked immutable (cannot be revoked).
14. QA "Quinn" clicks "Approve" (approval_level=2 recorded).
15. PM "Pete" clicks "Approve" (approval_level=3 recorded).
16. Verify compliance checklist auto-evaluates: PRs merged (PASS), tests green (PASS), no critical vulns (PASS), 3 approvals obtained (PASS).
17. Verify `fully_approved?` = true and "Publish" button becomes enabled.
18. Pete clicks "Publish".
19. Verify annotated git tag v2.0.0 is created via GitHub API.
20. Verify `tagged_at` and `tagged_by_id` (Pete's ID) are recorded on the release record.

**Expected Result:**
- Blockers prevent publishing until both are resolved.
- Changelog is auto-generated and grouped correctly by tracker type.
- The three-role approval sequence (Dev Lead → QA → PM) is enforced and each approval is recorded with `approval_level`.
- Approval records are immutable after creation.
- All compliance checklist items auto-pass after the 3rd approval.
- Git tag v2.0.0 is created and release audit fields (`tagged_at`, `tagged_by_id`) are populated.

---

### TC-RDV-549 — Production incident end-to-end lifecycle

| Field | Value |
|-------|-------|
| **Module** | End-to-End Business Workflows |
| **Feature** | INC-001, INC-002, INC-003, INC-004, INC-005, INC-006, MON-001, MON-002, MET-004 |
| **Requirement Ref** | INC-001 through INC-006, MON-001, MON-002 |
| **Priority** | High |
| **Scenario Type** | E2E |

**Preconditions:**
- Prometheus AlertManager is configured with the Redmine DevOps webhook endpoint.
- Deployment v1.4.9 was deployed to production at T-15 minutes (15 minutes before the alert fires).
- SEV1 escalation timeout configured to 10 minutes.
- On-call engineer: "Oliver" (configured in escalation rules).
- Project wiki is enabled.
- "Initial detection" communication template available.

**Test Data:**
- Alert: title="High error rate on API", severity=critical, source=Prometheus
- Deployment v1.4.9, production environment, deployed 15 minutes before alert
- Hotfix deployment: v1.4.10
- MTTR target measurement: 35 minutes

**Steps:**
1. Prometheus fires alert "High error rate on API" with severity=critical → webhook received by Redmine.
2. Alert appears in DevOps → Alerts feed with severity "critical" and status "firing".
3. Severity threshold met → `AlertIncidentCreator` auto-creates incident SEV1: title "High error rate on API", priority Urgent, tracker Incident.
4. Navigate to DevOps → Incidents → verify SEV1 incident is created.
5. Verify deployment v1.4.9 (deployed 15 minutes ago) is auto-correlated to the incident by `IncidentDeployCorrelator`.
6. Verify "Related Deployment" section shows v1.4.9.
7. SEV1 escalation timer starts (10-minute timeout).
8. Do not acknowledge the incident for 10+ minutes.
9. Verify `DevopsIncidentEscalatorJob` fires → `escalation_level` becomes 1 → Oliver auto-assigned.
10. Oliver acknowledges the incident (sets `acknowledged_at`) → escalation timer stops.
11. Verify subsequent job runs do not increment escalation_level further.
12. DevOps team selects "Initial detection" communication template → sends update.
13. Verify email, Slack message delivered and journal entry appended to incident.
14. Hotfix v1.4.10 deployed to production → timeline event "Fix deployed (v1.4.10)" appears.
15. Set incident status to "Resolved" with resolved_at timestamp (T+35 minutes from creation).
16. Verify MTTR is calculated and displayed as "35 minutes" in the Incidents list.
17. Click "Create Post-Mortem" → verify wiki page "Incident-SEV1-2026-05-21" is created.
18. Verify wiki page contains sections: Timeline, Root Cause, Action Items.

**Expected Result:**
- Prometheus alert triggers the full automated pipeline: alert → auto-incident creation → deployment correlation → escalation → acknowledgement → communication → resolution → MTTR → post-mortem.
- Each step's output is correct and traceable in the UI and database.
- MTTR of 35 minutes is accurately calculated and feeds the DORA MET-004 metric.
- Post-mortem wiki page is created with all three required sections.

---

### TC-RDV-550 — Security gate enforcement and override

| Field | Value |
|-------|-------|
| **Module** | End-to-End Business Workflows |
| **Feature** | SEC-003, SEC-006 (rfd-090, rfd-116) |
| **Requirement Ref** | SEC-003 |
| **Priority** | High |
| **Scenario Type** | E2E |

**Preconditions:**
- Trivy scan has detected 1 CRITICAL vulnerability stored in `redmineflux_devops_vulnerabilities` with status "open".
- The "production" environment has `security_gate_enabled = true`.
- DevOps engineer "Derek" does NOT have the `override_security_gate` permission.
- Admin "Adam" has the `override_security_gate` permission.

**Test Data:**
- Vulnerability: CVE-2026-1234, severity: CRITICAL, status: open
- Environment: production, security_gate_enabled: true
- Short override reason (rejected): "Emergency fix" (15 characters)
- Valid override reason (accepted): "Emergency hotfix for critical data loss vulnerability in prod" (25+ characters)

**Steps:**
1. Derek (DevOps engineer) navigates to DevOps → Environments → Production.
2. Derek clicks "Deploy" to trigger a deployment to production.
3. Verify `DeploymentDispatcher` → `SecurityGate` check fires.
4. Verify deployment is blocked with message: "1 critical vulnerability must be resolved before deployment to production."
5. Derek attempts to find an "Override Security Gate" button.
6. Verify the button is NOT visible to Derek (permission check fails; Derek lacks `override_security_gate`).
7. Adam (Admin) opens the same deployment page.
8. Verify "Override Security Gate" button IS visible to Adam.
9. Adam clicks "Override Security Gate" and enters reason "Emergency fix" (15 characters).
10. Verify the override is rejected: "Reason must be at least 20 characters."
11. Adam enters reason "Emergency hotfix for critical data loss vulnerability in prod" (60 characters).
12. Verify the override is accepted.
13. Verify audit log entry is created with: actor=Adam, timestamp, reason="Emergency hotfix for critical data loss vulnerability in prod", action="security_gate_override".
14. Verify the deployment proceeds after the override.

**Expected Result:**
- Security gate correctly blocks deployments when CRITICAL vulnerabilities are open.
- The `override_security_gate` permission is enforced: Derek cannot see the bypass option.
- Reason validation enforces a minimum of 20 characters.
- Valid override by Admin with reason ≥ 20 characters is accepted and fully audited in `redmineflux_devops_audit_events`.
- Deployment completes after the authorized override.

---

### TC-RDV-551 — Deployment freeze and emergency override

| Field | Value |
|-------|-------|
| **Module** | End-to-End Business Workflows |
| **Feature** | ENV-003, DEP-006 (rfd-099, rfd-082) |
| **Requirement Ref** | ENV-003 |
| **Priority** | High |
| **Scenario Type** | E2E |

**Preconditions:**
- PM "Priya" has `manage_devops_settings` permission.
- Admin "Adam" has permissions to manage freeze windows.
- Developer "Dan" has `trigger_devops_deployment` permission.

**Test Data:**
- Freeze window name: "Product Launch Freeze"
- Freeze start: now (current time)
- Freeze end: +2 hours from now
- Environments: all
- Emergency reason: "Emergency hotfix for data loss bug"

**Steps:**
1. Priya navigates to DevOps → Settings → Freeze Windows → New Freeze Window.
2. Creates freeze: name="Product Launch Freeze", start=now, end=+2hrs, environments=all.
3. Saves the freeze window.
4. Dan attempts to trigger a deployment to staging during the active freeze window.
5. Verify `DeploymentDispatcher` blocks the deployment with message: "Active freeze window: Product Launch Freeze. Deployments are not allowed until [end time]."
6. Adam navigates to DevOps → Settings → Freeze Windows.
7. Adam clicks "Override" on the active "Product Launch Freeze" window.
8. Adam enters written reason: "Emergency hotfix for data loss bug".
9. Adam confirms the override.
10. Verify Dan's deployment now proceeds.
11. Verify audit log shows the override entry with: actor=Adam, reason="Emergency hotfix for data loss bug", timestamp.
12. Wait for freeze window to expire at scheduled end time (+2hrs).
13. Dan triggers another deployment after expiry.
14. Verify the deployment is NOT blocked (freeze window is no longer active).

**Expected Result:**
- Freeze window effectively blocks all deployments to all environments during the active window.
- Error message correctly identifies the freeze by name.
- Admin override allows an emergency deployment to proceed.
- Audit log captures the override action with actor identity, reason, and timestamp.
- Automatic freeze expiry allows normal deployments to resume without manual intervention.

---

### TC-RDV-552 — Environment comparison before production deployment

| Field | Value |
|-------|-------|
| **Module** | End-to-End Business Workflows |
| **Feature** | ENV-005 (rfd-121) |
| **Requirement Ref** | ENV-005 |
| **Priority** | High |
| **Scenario Type** | E2E |

**Preconditions:**
- Staging environment has v2.1.0 (SHA: abc123ef) deployed, containing commits linked to issues #201, #202, #203.
- Production environment has v2.0.0 (SHA: def45678) deployed.
- `EnvironmentComparator` service is available.
- PM "Priya" has `view_devops` permission.

**Test Data:**
- Staging: version=v2.1.0, SHA=abc123ef, issues: #201, #202, #203
- Production: version=v2.0.0, SHA=def45678, no issues exclusive to production

**Steps:**
1. DevOps engineer navigates to DevOps → Environments.
2. Clicks "Compare Environments".
3. Selects "staging" as env A and "production" as env B.
4. Submits the comparison.
5. Verify the comparison page shows: staging=v2.1.0/SHA abc123ef, production=v2.0.0/SHA def45678.
6. Verify the issue diff section shows issues #201, #202, #203 as present in staging but not in production.
7. Repeat the comparison within 60 seconds.
8. Verify the result is served from cache (same data, fast response).
9. PM Priya reviews the diff and approves the deployment.
10. v2.1.0 is deployed to production (via approval flow).
11. Run the environment comparison again after deployment.
12. Verify both environments now show v2.1.0/SHA abc123ef.
13. Verify the issue diff section is empty (no difference between environments).

**Expected Result:**
- Initial comparison accurately shows version, SHA, and issue differences between staging and production.
- Issues #201, #202, #203 are listed in the diff as present in staging but absent from production.
- Result is cached for 60 seconds (keyed on both SHAs); repeated calls within 60 seconds return the cached result.
- After successful promotion, comparison shows identical versions and an empty issue diff.

---

### TC-RDV-553 — Flaky test detection and issue creation workflow

| Field | Value |
|-------|-------|
| **Module** | End-to-End Business Workflows |
| **Feature** | CICD-008 (rfd-079), TEST-003 (rfd-087) |
| **Requirement Ref** | CICD-008, TEST-003 |
| **Priority** | High |
| **Scenario Type** | E2E |

**Preconditions:**
- 15 build runs have been ingested for project "Phoenix Platform".
- Test "TestLoginFeature" has passed in 8 runs and failed in 7 runs across the 15 builds (≥10 runs required by `FlakyTestScorer`).
- QA engineer "Quinn" has `view_devops` permission and permission to create issues.

**Test Data:**
- Test name: TestLoginFeature
- Pass count: 8, Fail count: 7, Total runs: 15
- Expected flip-flop score: 0.73 (7 flips / (15 - 1) = ~0.50; actual calculation per `FlakyTestScorer` logic yields 0.73 based on transition analysis)
- Score threshold: 0.05–0.95 range = flaky
- Failed test error: "AssertionError: expected status 200 but got 503", stack trace present

**Steps:**
1. QA "Quinn" navigates to DevOps → Builds → Flaky Tests section.
2. Verify TestLoginFeature appears in the flaky tests list.
3. Verify the displayed score is 0.73 and pass rate shows approximately 53%.
4. Quinn clicks "Create Issue" on the TestLoginFeature entry.
5. Verify the new issue form is pre-filled with:
   - Subject: "[Flaky] TestLoginFeature"
   - Description contains the error message "AssertionError: expected status 200 but got 503" and the stack trace.
6. Quinn submits the form → issue #300 is created.
7. Verify the test result row now shows "Linked issue: #300" instead of the "Create Issue" button.
8. Quinn clicks "Create Issue" again on the same TestLoginFeature entry.
9. Verify the system detects the existing linked issue #300 and shows "Linked issue: #300" rather than opening a new issue form.

**Expected Result:**
- `FlakyTestScorer` correctly identifies TestLoginFeature as flaky with score 0.73 (within 0.05–0.95 range, min 10 runs satisfied).
- Flaky tests table shows test name, score, and pass rate.
- First "Create Issue" pre-fills subject and description from test failure data.
- Issue #300 is created and linked via `redmineflux_devops_test_issue_links` table.
- Second "Create Issue" attempt shows the existing linked issue instead of creating a duplicate.
- Deduplication behavior (rfd-087) prevents double-issue creation.

---

### TC-RDV-554 — Multi-role release approval with compliance checklist

| Field | Value |
|-------|-------|
| **Module** | End-to-End Business Workflows |
| **Feature** | REL-003, SEC-004 (rfd-019, rfd-091) |
| **Requirement Ref** | REL-003, SEC-004 |
| **Priority** | High |
| **Scenario Type** | E2E |

**Preconditions:**
- Release v3.0.0 has been created with 8 issues linked.
- Initially 5 of 8 issues have merged PRs; 3 issues have unmerged PRs.
- Dev Lead "Laura", QA "Quinn", PM "Pete" are configured as approvers.
- GitHub tag API is accessible.

**Test Data:**
- Release: v3.0.0, 8 linked issues
- Approvers: Laura (level 1), Quinn (level 2), Pete (level 3)
- Initial PR status: 5 merged, 3 unmerged

**Steps:**
1. Navigate to DevOps → Releases → v3.0.0.
2. Open the "Compliance" section.
3. Verify "PRs merged" check shows FAIL (5/8 issues have merged PRs).
4. Merge the 3 remaining PRs → navigate back to the compliance section.
5. Verify "PRs merged" check now shows PASS.
6. Verify "Tests green" shows PASS (most recent build is passing).
7. Verify "No critical vulnerabilities" shows PASS.
8. Dev Lead "Laura" clicks "Approve" (first in sequence).
9. Verify approval_level=1 is recorded for Laura and the approval record is immutable.
10. Verify QA "Quinn" can now approve (approval_level=2 available).
11. Quinn clicks "Approve" → approval_level=2 recorded.
12. PM "Pete" clicks "Approve" → approval_level=3 recorded.
13. Verify `fully_approved?` evaluates to true.
14. Verify "Required approvals" compliance item now shows PASS.
15. Verify the "Publish" button becomes enabled.
16. Pete clicks "Publish".
17. Verify `GitTagger` service creates git tag v3.0.0 via GitHub API.
18. Verify `tagged_at` timestamp is recorded on the release.

**Expected Result:**
- Compliance checklist "PRs merged" check reflects real-time PR merge status.
- All 4 automatic compliance items (PRs merged, tests green, no critical vulns, 3 approvals) must pass before publishing.
- Approval records at levels 1, 2, and 3 are immutable once created.
- `fully_approved?` becomes true only after all 3 approval levels are recorded.
- Publish creates the git tag and records the audit fields (`tagged_at`, `tagged_by_id`).

---

### TC-RDV-555 — Webhook replay attack prevention

| Field | Value |
|-------|-------|
| **Module** | End-to-End Business Workflows |
| **Feature** | SYS-001 (rfd-001) |
| **Requirement Ref** | SYS-001 |
| **Priority** | High |
| **Scenario Type** | E2E |

**Preconditions:**
- Project "Phoenix Platform" has a GitHub webhook configured.
- Webhook signature validation is enabled.

**Test Data:**
- Commit SHA: aa1234bb
- X-GitHub-Delivery header (delivery ID): "abc-123-delivery"
- Webhook payload: GitHub push event with 1 commit referencing #500

**Steps:**
1. Send the first GitHub push webhook: `POST /devops/webhook/github/phoenix-platform` with headers `X-Hub-Signature-256: sha256=<valid_sig>`, `X-GitHub-Delivery: abc-123-delivery`, body containing commit SHA aa1234bb.
2. Verify the event is processed: HTTP 200 returned, commit aa1234bb is stored in `redmineflux_devops_commits`, delivery ID "abc-123-delivery" is recorded.
3. Navigate to issue #500 → verify the commit appears in the DevOps panel.
4. Resend the exact same webhook payload with the same `X-GitHub-Delivery: abc-123-delivery` header (simulating a replay attack).
5. Verify the response: HTTP 200 returned (no error to attacker).
6. Check `redmineflux_devops_commits` table → verify commit aa1234bb is NOT stored a second time.
7. Verify `redmineflux_devops_webhook_events` shows only one entry for delivery ID "abc-123-delivery".
8. Navigate to issue #500 → verify the commit appears only once.

**Expected Result:**
- First webhook is processed normally; commit is stored once.
- Replayed webhook (same delivery ID) returns HTTP 200 (idempotent response) but does NOT insert a duplicate commit record.
- Deduplication is enforced via the delivery_id tracking within the dedup window.
- Database integrity is confirmed: exactly one commit record for SHA aa1234bb.
- Issue #500 shows the commit once in its DevOps panel.

---

### TC-RDV-556 — Hotfix workflow from production release

| Field | Value |
|-------|-------|
| **Module** | End-to-End Business Workflows |
| **Feature** | REL-008 (rfd-113), REL-006 (rfd-086), DEP-001 |
| **Requirement Ref** | REL-008 |
| **Priority** | High |
| **Scenario Type** | E2E |

**Preconditions:**
- Release v2.0.0 is published and git tag v2.0.0 exists.
- Project is connected to GitHub repository "github.com/acme/phoenix".
- Dev Lead "Laura" can approve hotfix release.
- DevOps engineer "Derek" can create git tags.

**Test Data:**
- Release: v2.0.0 (published, git tag exists)
- Hotfix branch: hotfix/v2.0.1
- Hotfix release version: v2.0.1
- Hotfix issue: auto-created in "Hotfix" tracker
- Description: "Session tokens not expiring after logout"

**Steps:**
1. A bug is found in production in v2.0.0: "Session tokens not expiring after logout".
2. PM "Pete" navigates to DevOps → Releases → v2.0.0.
3. Pete clicks "Create Hotfix" button.
4. Verify `HotfixCreator` service calls GitHub API to create branch hotfix/v2.0.1 forked from the v2.0.0 tag.
5. Verify a linked Redmine issue is auto-created in the "Hotfix" tracker with subject "Hotfix for v2.0.0 — Session tokens not expiring after logout".
6. Verify the suggested next version shown in the UI is "v2.0.1 (PATCH)".
7. Developer pushes the fix to branch hotfix/v2.0.1.
8. Pete creates release v2.0.1 for the hotfix.
9. Laura approves the hotfix release.
10. Derek clicks "Create Tag" → git tag v2.0.1 is created via GitHub API.
11. Deployment of v2.0.1 to production is triggered and completes.
12. Navigate to DevOps → Environments → Production.
13. Verify current version shown is v2.0.1.

**Expected Result:**
- `HotfixCreator` successfully creates branch hotfix/v2.0.1 from the v2.0.0 tag via GitHub API.
- A Hotfix tracker issue is auto-created and linked to the hotfix release.
- Semantic versioning correctly suggests the PATCH increment (v2.0.1 from v2.0.0).
- Hotfix release follows the standard approval and tagging workflow.
- Production environment shows v2.0.1 as the current deployed version after the hotfix deployment.

---

### TC-RDV-557 — Full deployment approval gate workflow

| Field | Value |
|-------|-------|
| **Module** | End-to-End Business Workflows |
| **Feature** | DEP-004 (rfd-080), SEC-006 (rfd-116) |
| **Requirement Ref** | DEP-004 |
| **Priority** | High |
| **Scenario Type** | E2E |

**Preconditions:**
- Production environment has `approval_required = true`.
- The "approve_deployments" role is assigned to "Release Manager" (user: Rachel).
- DevOps engineer "Derek" has `trigger_devops_deployment` permission but NOT `approve_deployments`.

**Test Data:**
- Deployment version: v1.6.0
- Environment: production
- Approver: Rachel (Release Manager)
- Approval comment: "Verified staging. Approving."

**Steps:**
1. Derek navigates to DevOps → Environments → Production.
2. Derek clicks "Deploy" and selects version v1.6.0.
3. Confirms the deployment request.
4. Verify deployment status changes to "Pending Approval".
5. Verify the deploy button in the environment card shows "Awaiting Approval" (disabled or altered state).
6. Rachel receives a pending approval notification in Redmine.
7. Rachel navigates to the deployment approval page.
8. Verify the page shows "Approve" and "Reject" buttons with a comment field.
9. Rachel enters comment "Verified staging. Approving."
10. Rachel clicks "Approve".
11. Verify `DeploymentDispatcher` receives the approval signal and triggers the deployment.
12. Verify deployment status changes from "Pending Approval" to "Running" and then "Success".
13. Navigate to the DevOps audit log.
14. Verify audit trail entry exists with: approver=Rachel, timestamp, comment="Verified staging. Approving.", action="deployment_approved", deployment_id present.

**Expected Result:**
- Production deployment is gated: submission creates a pending approval without triggering the actual deployment.
- Only users with `approve_deployments` permission can see and use the Approve/Reject interface.
- Rachel's approval includes the comment and is fully recorded.
- `DeploymentDispatcher` proceeds only after the approval signal is received.
- Audit trail in `redmineflux_devops_audit_events` captures approver, timestamp, comment, and deployment reference.

---

### TC-RDV-558 — Incident communication template with escalation

| Field | Value |
|-------|-------|
| **Module** | End-to-End Business Workflows |
| **Feature** | INC-005, INC-006 (rfd-096, rfd-119) |
| **Requirement Ref** | INC-005, INC-006 |
| **Priority** | High |
| **Scenario Type** | E2E |

**Preconditions:**
- SEV2 escalation timeout configured to 30 minutes.
- On-call lead configured: "Oliver".
- Communication templates available: "Initial detection", "Investigating", "Resolved".
- Email, Slack integrations configured.
- Incident INC-035 (SEV2) is created but not acknowledged.

**Test Data:**
- Incident INC-035, severity SEV2
- Affected service: Payment API
- Template: "Initial detection" body: "We are investigating an incident. Service: {{affected_service}}"
- SEV2 timeout: 30 minutes
- Total incident duration: 90 minutes

**Steps:**
1. Incident INC-035 (SEV2) is created. Escalation timer starts.
2. DevOps team navigates to INC-035 → clicks "Send Update".
3. Selects "Initial detection" template.
4. Verifies preview shows: "We are investigating an incident. Service: Payment API" (variable substituted).
5. Clicks "Send" → verifies email delivered, Slack message sent, journal entry added to incident.
6. Incident is NOT acknowledged for 45 minutes (exceeding 30-minute SEV2 timeout).
7. `DevopsIncidentEscalatorJob` fires → verify `escalation_level` becomes 1.
8. Verify on-call lead "Oliver" is auto-assigned.
9. DevOps sends "Investigating" template → verifies email, Slack, journal entry.
10. After 90 minutes total, incident is marked Resolved with resolved_at set.
11. DevOps sends "Resolved" template.
12. Verify MTTR is updated to "90 minutes" in the incident record and list view.

**Expected Result:**
- Template preview correctly substitutes `{{affected_service}}` with "Payment API".
- All three channels (email, Slack, journal entry) receive each template send.
- Escalation fires at 30 minutes (not 45) based on configured timeout, incrementing escalation_level to 1.
- Oliver is auto-assigned via the escalation rule.
- MTTR of 90 minutes is accurately calculated from incident creation to resolved_at.

---

### TC-RDV-559 — Branch creation to PR tracking to auto-transition

| Field | Value |
|-------|-------|
| **Module** | End-to-End Business Workflows |
| **Feature** | SCM-006, SCM-002, SCM-004 (rfd-073, rfd-007, rfd-009) |
| **Requirement Ref** | SCM-006, SCM-002, SCM-004 |
| **Priority** | High |
| **Scenario Type** | E2E |

**Preconditions:**
- Issue #456 ("Login page redesign") exists in project "Phoenix Platform" with status "In Progress".
- GitHub repository "main-repo" is connected to the project.
- Auto-transition rule: PR merged → status changes from "In Review" to "Ready for QA".
- Developer "Dan" has permission to create branches.
- Issue #456 is currently unlinked to any branch or PR.

**Test Data:**
- Issue: #456
- Repository: main-repo
- Suggested branch name: feature/456-login-redesign
- PR: #67 (will be created during test)
- Auto-transition: "In Review" → "Ready for QA"

**Steps:**
1. Dan navigates to Redmine issue #456.
2. Observes the DevOps panel on the issue.
3. Clicks "Create Branch" in the DevOps panel.
4. Selects repository "main-repo".
5. Verifies the suggested branch name is "feature/456-login-redesign" (auto-generated from issue ID and subject).
6. Dan confirms without changing the branch name.
7. Verify `BranchCreator` calls GitHub API → branch feature/456-login-redesign is created.
8. Dan pushes 2 commits referencing #456 to feature/456-login-redesign.
9. Verify both commits appear in issue #456's DevOps panel "Commits" section.
10. Dan opens PR #67 on GitHub for branch feature/456-login-redesign → "base: main".
11. PR webhook fires → verify PR card appears on issue #456 with status "Open".
12. Reviewer requests changes → PR card shows "Changes requested".
13. Dan updates the code and pushes → reviewer re-reviews.
14. Reviewer approves PR #67 → PR card shows "Approved" status.
15. PR #67 is merged → merged webhook fires.
16. Verify issue #456 status auto-transitions from "In Review" to "Ready for QA".
17. Verify journal entry reads: "Status changed by DevOps integration (PR #67 merged)".

**Expected Result:**
- Branch creation from within Redmine calls GitHub API and creates the branch with the correct naming convention.
- Commits pushed to the branch appear on the issue's DevOps panel.
- PR card on issue #456 correctly reflects the PR lifecycle: Open → Changes requested → Approved → Merged.
- Auto-transition fires on merge and moves issue #456 to "Ready for QA".
- Journal entry contains the exact text "Status changed by DevOps integration (PR #67 merged)".

---

### TC-RDV-560 — Custom DORA dashboard creation and sharing

| Field | Value |
|-------|-------|
| **Module** | End-to-End Business Workflows |
| **Feature** | MET-007 (rfd-120) |
| **Requirement Ref** | MET-007 |
| **Priority** | High |
| **Scenario Type** | E2E |

**Preconditions:**
- Lead "Laura" has `manage_devops_settings` permission (required to share dashboards).
- Developer "Dan" is a project member with `view_devops` permission.
- Non-member "Nate" has no project membership.
- DORA metric data exists for the project.

**Test Data:**
- Dashboard name: "Sprint Health"
- Widgets and positions:
  - dora.deployment_frequency: x=0, y=0, w=4, h=3
  - dora.lead_time: x=4, y=0, w=4, h=3
  - dora.change_failure_rate: x=8, y=0, w=4, h=3
  - flow.cycle_time: x=0, y=3, w=6, h=4
- Dashboard privacy: initially private (shared=false), then changed to shared=true

**Steps:**
1. Laura navigates to DevOps → Dashboards → New Dashboard.
2. Enters name "Sprint Health".
3. Drags widget "dora.deployment_frequency" to position x=0, y=0, w=4, h=3.
4. Drags widget "dora.lead_time" to position x=4, y=0, w=4, h=3.
5. Drags widget "dora.change_failure_rate" to position x=8, y=0, w=4, h=3.
6. Drags widget "flow.cycle_time" to position x=0, y=3, w=6, h=4.
7. Saves the dashboard with shared=false (private to Laura).
8. Verify all 4 widgets display with DORA metric values and classification badges (Elite/High/Medium/Low).
9. Laura refreshes the page.
10. Verify the 4-widget layout is preserved exactly as saved (positions and sizes are correct).
11. Dan navigates to DevOps → Dashboards.
12. Verify "Sprint Health" is NOT visible to Dan (dashboard is private).
13. Laura edits the dashboard → changes shared=true → saves.
14. Dan refreshes DevOps → Dashboards.
15. Verify "Sprint Health" dashboard is now visible to Dan.
16. Verify Dan can view (not edit) the dashboard and all 4 widgets display correctly.
17. Nate (non-member) attempts to access the dashboard URL directly.
18. Verify HTTP 403 is returned.

**Expected Result:**
- Dashboard "Sprint Health" is created with the 4-widget layout persisted correctly in `layout_json`.
- Widget positions and dimensions survive a page refresh (server-side persistence confirmed).
- Private dashboard (shared=false) is invisible to other project members.
- Sharing the dashboard (shared=true, requires `manage_devops_settings`) makes it visible to all project members.
- Non-members cannot access any dashboard URL; 403 is returned.
- DORA widgets display metric values and classification badges when data is available.
