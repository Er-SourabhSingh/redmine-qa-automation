# BUG-RDV-036 — Original deployment detail does not show "Reverted by" reference after rollback

- Bug ID: BUG-RDV-036
- Title: After rollback, original deployment detail page shows no "Reverted by" link to the rollback deployment
- Severity: Medium
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Plugin version: unknown
- Environment: Local Docker (http://localhost:3008)
- Browser: Playwright (Chromium)
- User role: Admin
- Date: 2026-05-25

## Steps to reproduce

1. Navigate to a successful deployment (e.g., deployment #5, version v1.2.0).
2. Create a rollback from that deployment using `/projects/phoenix-platform/devops_deployments/5/create_rollback` with a valid `rollback_reason`.
3. Confirm the rollback deployment is created (new deployment record in list).
4. Navigate back to the original deployment detail page (deployment #5).

## Expected result

- The original deployment detail page should display a "Reverted by" or "Rolled back by" section referencing the rollback deployment ID/link.
- This provides a complete audit trail: the rollback can link back to the original, and the original links forward to the rollback.

## Actual result

- The original deployment detail page (deployment #5) shows no "Reverted by" section or link.
- Only the rollback deployment's detail shows a "Rollback of" reference (linking to the original).
- The bi-directional linkage is incomplete — tracing from original to rollback is not possible from the UI.

## Evidence

- Screenshot path: screenshots/TC-RDV-176/ (FAIL — no reverted-by link on original deployment)
- Log path: —
- Trace/video path: —

## Duplicate check

- Duplicate found: No
- Existing bug reference: —
