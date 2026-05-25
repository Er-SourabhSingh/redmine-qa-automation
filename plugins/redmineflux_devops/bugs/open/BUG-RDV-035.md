# BUG-RDV-035 — No issue-deployment linkage on deployment detail or issue pages

- Bug ID: BUG-RDV-035
- Title: Deployment detail shows no linked issues; issue pages show no deployment badge or history
- Severity: High
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Plugin version: unknown
- Environment: Local Docker (http://localhost:3008)
- Browser: Playwright (Chromium)
- User role: Admin
- Date: 2026-05-25

## Steps to reproduce

1. Send a GitHub `push` webhook referencing an issue number in the commit message (e.g., "Fix #3 login error").
2. Navigate to the deployment detail page at `/projects/phoenix-platform/devops_deployments/<id>`.
3. Navigate to the referenced Redmine issue (e.g., `/issues/3`).

## Expected result

- The deployment detail page should show an "Issues Included" section listing Redmine issues resolved or referenced in this deployment.
- The issue detail page should show a "Deployments" section or badge indicating which deployments included a fix for this issue.

## Actual result

- The deployment detail page has no "Issues Included" section. The page only shows: VERSION, ENVIRONMENT, DEPLOYED BY, COMMIT, PROVIDER, DURATION, STARTED, FINISHED, POST-DEPLOY HEALTH, DESCRIPTION.
- Redmine issue pages show no deployment-related badge, widget, or sidebar section.
- TC-RDV-197 and TC-RDV-207 both FAIL because the feature is not implemented.

## Evidence

- Screenshot path: screenshots/TC-RDV-197/ (FAIL — no issues section on deployment detail)
- Log path: —
- Trace/video path: —

## Duplicate check

- Duplicate found: No
- Existing bug reference: —
