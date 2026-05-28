# Bug Report

- Bug ID: BUG-RDV-041
- Title: approve_releases permission not enforced — Approve button absent for QA Engineer role
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Plugin version: Local
- Environment: Local Docker (http://localhost:3008)
- Browser: Chromium (Playwright)
- User role: QA Engineer (qa_user)
- Date: 2026-05-25

## Steps to reproduce

1. Navigate to Administration > Roles > QA Engineer
2. Enable the `approve_releases` permission checkbox and save
3. Log in as qa_user (member of Phoenix Platform project with QA Engineer role)
4. Navigate to DevOps > Releases > "v2.0.0 Release"
5. Inspect the "Approval Actions" sidebar section

## Expected result

- "Approve Release" and "Reject Release" buttons are visible and functional for qa_user, since the `approve_releases` permission is granted to the QA Engineer role

## Actual result

- The "Approval Actions" section is not rendered at all for qa_user
- Neither "Approve Release" nor "Reject Release" buttons are visible
- The permission grant in the admin roles UI appears to have no effect on the release approval UI
- Only users with the `manage_releases` permission (e.g., admin) see the Approve/Reject buttons

## Evidence

- Screenshot path: screenshots/TC-RDV-242/tc-rdv-242-fail-no-approve-button-qa-user.png
- Log path: N/A
- Trace/video path: N/A

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A

## Retest

- Date: 2026-05-26
- Environment: Local Docker (http://localhost:3008) — fresh instance
- Result: **NOT TESTABLE**
- `qa_user` was not set up in the fresh instance (password unknown, not created during this test run). The `approve_releases` permission enforcement can only be verified by logging in as a user with that role. Testing blocked. Bug status unchanged from original finding.

## Retest — Forge flux-fujhcd9zj49 (2026-05-26)

- Date: 2026-05-26
- Environment: Forge (https://flux-fujhcd9zj49.forge.zehntech.com) — new instance
- Result: **FIXED**
- Granted `approve_releases` to Developer role. Logged in as daisy.skye (Developer on agileboard). Navigated to release #42 → "Approve Release" and "Reject Release" buttons visible. Removed `approve_releases` from Developer role → buttons hidden. Permission enforcement is bidirectionally correct. Screenshot: screenshots/BUG-RDV-041/retest-2026-05-26-approve-visible-with-permission.png. Bug closed.
