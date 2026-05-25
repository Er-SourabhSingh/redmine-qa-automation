# BUG-RDV-032 — Deploy button not disabled when environment is locked or frozen

- Bug ID: BUG-RDV-032
- Title: Deploy button remains enabled in UI when environment is locked or has an active freeze window
- Severity: Medium
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Plugin version: unknown
- Environment: Local Docker (http://localhost:3008)
- Browser: Playwright (Chromium)
- User role: Admin
- Date: 2026-05-25

## Steps to reproduce

1. Lock an environment (e.g., production) with a reason and locked_until date.
2. Navigate to `/projects/phoenix-platform/devops_environments`.
3. Observe the Deploy button on the locked environment card.
4. Alternatively, create an active freeze window for the environment and repeat step 2.

## Expected result

- The Deploy button (or trigger) on the environment card should be visually disabled (grayed out, `disabled` attribute, or hidden) with a tooltip indicating the environment is locked or frozen.
- This provides immediate user feedback before an attempt is made.

## Actual result

- The Deploy button remains fully enabled in the UI for both locked and frozen environments.
- The server correctly enforces the block (returns HTTP 423 for freeze, flash "Deployment blocked — environment is locked" for lock), but the UI gives no pre-emptive indication.
- Users must attempt a deploy to discover the block, which is a poor UX and could mislead users into thinking the deploy was accepted.

## Evidence

- Screenshot path: screenshots/TC-RDV-181/tc-rdv-181-pass.png (freeze block HTTP 423 confirmed)
- Log path: —
- Trace/video path: —

## Duplicate check

- Duplicate found: No
- Existing bug reference: —
