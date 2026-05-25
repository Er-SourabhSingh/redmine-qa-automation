# Bug Report

- Bug ID: BUG-RDV-029
- Title: Pipeline stage breakdown not implemented — no stages section on build detail page
- Severity: High
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Plugin version: 0.1.0
- Environment: Local Docker (http://localhost:3008)
- Browser: Chromium (Playwright)
- User role: Admin
- Date: 2026-05-25

## Steps to reproduce

1. Navigate to Project "phoenix-platform" → DevOps → Builds.
2. Click any build (e.g., build #514).
3. Look for a "Pipeline Stages" or "Stages" section on the build detail page.

## Expected result

- A "Pipeline Stages" section is visible on the build detail page.
- It shows a linear timeline of stages (Build → Test → Deploy) with status icons and durations.
- Supported for GitHub Actions, GitLab CI, and Jenkins providers (rfd-108 / CICD-009).

## Actual result

- The build detail page contains only: build metadata (branch, commit, trigger, duration, started, finished), "Failed Tests" section, and "Artifacts" section.
- No "Pipeline Stages" or "Stages" section exists anywhere on the page.
- The `BuildStageIngestor` service and associated routes/views are not implemented.
- TC-RDV-125 (GitHub Actions stages), TC-RDV-126 (idempotent stages), TC-RDV-144 (Jenkins stages), TC-RDV-148 (GitLab CI stages) all FAIL.

## Evidence

- Screenshot path: screenshots/TC-RDV-125/
- Log path: logs/
- Trace/video path: N/A

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A
