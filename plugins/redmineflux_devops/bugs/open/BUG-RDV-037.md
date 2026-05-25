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
