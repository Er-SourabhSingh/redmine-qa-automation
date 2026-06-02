# Bug Report

- Bug ID: BUG-RDV-028
- Title: Artifact download links show no artifacts for completed builds — NOT TESTABLE without real CI data
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Severity: Medium
- Date: 2026-05-25 | Status: NOT TESTABLE

## Steps to reproduce

1. Navigate to a completed build detail page.
2. Check the "Artifacts" section.

## Expected result

Artifact download links listed for build artifacts (e.g., compiled binaries, test reports) from the CI provider.

## Actual result

"No artifacts available for this build." — GitHub Actions artifact API integration not implemented or artifacts not stored. Cannot be properly tested without real CI pipelines producing artifacts.

## Note

This bug is classified as NOT TESTABLE in the current test environment. No real CI data flows through the local Docker instance. Artifact download links require actual GitHub Actions workflow runs with artifact uploads.

## Duplicate check

- Duplicate found: No
