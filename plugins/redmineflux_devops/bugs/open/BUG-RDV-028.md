# Bug Report

- Bug ID: BUG-RDV-028
- Title: Artifact download links section shows no artifacts for completed builds
- Severity: Medium
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Plugin version: 0.1.0
- Environment: Local Docker (http://localhost:3008)
- Browser: Chromium (Playwright)
- User role: Admin
- Date: 2026-05-25

## Steps to reproduce

1. Navigate to Project "phoenix-platform" → DevOps → Builds.
2. Click on build #513 (status: success, github_actions provider).
3. Scroll to the "Artifacts" section.

## Expected result

- The Artifacts section lists artifact files (name, size, download link) for the completed build.
- For build #513 with GitHub Actions, artifacts such as `app-v2.3.1.apk` and `test-report.html` should be listed.
- Files below 50 MB are proxied through Redmine; files above 50 MB redirect to the CI provider URL.

## Actual result

- The Artifacts section displays: "No artifacts available for this build."
- The plugin does not fetch artifact metadata from the GitHub Actions API.
- No download links are shown for any build, regardless of provider or build status.
- TC-RDV-117 (artifact list), TC-RDV-118 (proxied download), TC-RDV-119 (redirected download) all FAIL/BLOCKED.

## Evidence

- Screenshot path: screenshots/TC-RDV-117/
- Log path: logs/
- Trace/video path: N/A

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A
