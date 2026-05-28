# Bug Report

- Bug ID: BUG-RDV-039
- Title: Release creation form missing Redmine version/milestone dropdown
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Plugin version: Local
- Environment: Local Docker (http://localhost:3008)
- Browser: Chromium (Playwright)
- User role: Administrator
- Date: 2026-05-25

## Steps to reproduce

1. Navigate to DevOps > Releases for project "Phoenix Platform"
2. Click "New Release"
3. Inspect the form fields available

## Expected result

- A dropdown field "Linked Redmine Version/Milestone" is present, listing versions defined under the project's Versions settings (e.g., "v2.0.0")
- Selected version is stored and displayed on the release card

## Actual result

- No version/milestone dropdown is present in the New Release form
- The form only contains: Release Name, Description, Status, Target Date, Git Tag, Commit SHA
- It is not possible to link a release to a Redmine version/milestone

## Evidence

- Screenshot path: screenshots/TC-RDV-211/ (not captured — no dropdown visible in form)
- Log path: N/A
- Trace/video path: N/A

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A

## Retest

- Date: 2026-05-26
- Environment: Local Docker (http://localhost:3008) — fresh instance
- Result: **FIXED**
- Navigated to `/projects/phoenix-platform/devops_releases/new`. Release form now includes `name="redmineflux_devops_release[version_id]"` field — the Redmine version/milestone dropdown is present. Bug no longer reproduces.
