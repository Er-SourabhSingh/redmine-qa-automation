# Bug Report

- Bug ID: BUG-RDV-029
- Title: Pipeline stage breakdown not implemented — no stages section on build detail page
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Severity: High
- Date: 2026-05-25 | Retest: 2026-05-29 — STILL OPEN

## Steps to reproduce

1. Navigate to a build detail page (e.g., `/projects/phoenix-platform/devops_builds/1`).
2. Look for a "Pipeline Stages" section.

## Expected result

A "Pipeline Stages" section shows individual stage names, durations, and statuses (e.g., Build → Test → Deploy).

## Actual result

Build detail page shows: Build #, Failed Tests, Artifacts — no Pipeline Stages section. `BuildStageIngestor` service not implemented. Retest 2026-05-29 confirms sections on page: "Build #", "Failed Tests", "Artifacts" — no stages.

## Evidence

![BUG-RDV-029 — Build detail with no pipeline stages section](../../screenshots/BUG-RDV-029/bug-rdv-029-no-stages.png)

## Duplicate check

- Duplicate found: No
