# BUG-RDV-037 — Multiple concurrent pending_approval deployments accepted for same environment

- Bug ID: BUG-RDV-037
- Title: Pre-flight check does not block a second deploy when an approval-pending deployment already exists for the environment
- Severity: High
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Plugin version: unknown
- Environment: Local Docker (http://localhost:3008)
- Browser: Playwright (Chromium)
- User role: Admin
- Date: 2026-05-25

## Steps to reproduce

1. Configure an environment with `approval_required = true` (e.g., staging, env_id 3).
2. POST a deploy to that environment — first deployment is created with status `pending_approval`. Note the deployment ID.
3. Immediately POST another deploy to the same environment without approving or rejecting the first.
4. Observe the HTTP response and the deployments list.

## Expected result

- The second deploy attempt should be blocked with an error such as: "A deployment is already pending approval for this environment. Approve or reject it before deploying again."
- Only one pending_approval deployment should exist per environment at any time.

## Actual result

- The second deploy returns HTTP 302 redirect to the deployment list, indicating success.
- The deployments list shows multiple deployments with `pending_approval` status for the same environment simultaneously (confirmed: deployments #17, #18, #19 all show staging/pending).
- This can cause approval confusion (which one to approve?), queue buildup, and potential deployment ordering conflicts.

## Evidence

- Screenshot path: screenshots/TC-RDV-183/ (FAIL — multiple pending approvals for staging)
- Log path: —
- Trace/video path: —

## Duplicate check

- Duplicate found: No
- Existing bug reference: —

## Retest

- Date: 2026-05-26
- Environment: Local Docker (http://localhost:3008) — fresh instance
- Result: **NOT TESTABLE**
- No environment in the fresh instance has `approval_required` enabled (checked UAT env_id=4 edit form — checkbox is unchecked). Testing requires enabling `approval_required` on an environment and creating two rapid deployments; this was not set up in this test cycle. Bug status unchanged from original finding.

## Retest — Forge flux-fujhcd9zj49 (2026-05-26)

- Date: 2026-05-26
- Environment: Forge (https://flux-fujhcd9zj49.forge.zehntech.com) — new instance
- Result: **FIXED**
- Staging environment (ID 20) has `approval_required = true`. Clicked Deploy button for staging (ref: "v2.0.0-rc1"). Flash message: "A deployment (#222) is already pending approval for staging. Approve or reject it before deploying again." Pre-flight guard in `DeploymentDispatcher.deploy_from_redmine!` blocks concurrent pending approvals. Screenshot: screenshots/BUG-RDV-037/retest-2026-05-26-fixed.png. Bug closed.
