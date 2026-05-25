# BUG-RDV-034 — Deployment detail missing commit SHA hyperlink and deployment URL field

- Bug ID: BUG-RDV-034
- Title: Deployment detail page shows no clickable commit SHA link and no deployment URL field
- Severity: Medium
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Plugin version: unknown
- Environment: Local Docker (http://localhost:3008)
- Browser: Playwright (Chromium)
- User role: Admin
- Date: 2026-05-25

## Steps to reproduce

1. Send a GitHub `deployment_status` webhook event with a valid `deployment.sha` and `deployment_status.target_url` payload (e.g., TC-RDV-195 webhook payload).
2. Navigate to the resulting deployment detail page at `/projects/phoenix-platform/devops_deployments/<id>`.
3. Inspect the COMMIT and URL fields on the detail page.

## Expected result

- The COMMIT field should display the commit SHA as a clickable hyperlink pointing to the remote repository's commit URL (e.g., `https://github.com/owner/repo/commit/<sha>`).
- A URL / Deployment URL field should be visible, showing the `target_url` from the webhook payload.

## Actual result

- The COMMIT field on the detail page shows a dash "—" even when a `commit_sha` was stored in the database (confirmed via TC-RDV-195: webhook populated `commit_sha` correctly server-side but it is not displayed).
- There is no "URL" or "Deployment URL" field visible on the detail page at all.
- Users cannot navigate to the remote commit or the deployment environment URL from within Redmine.

## Evidence

- Screenshot path: screenshots/TC-RDV-169/ (deployment detail — commit field blank)
- Log path: —
- Trace/video path: —

## Duplicate check

- Duplicate found: No
- Existing bug reference: —
