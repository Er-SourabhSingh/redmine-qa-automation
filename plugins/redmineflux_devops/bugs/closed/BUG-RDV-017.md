# Bug Report

- Bug ID: BUG-RDV-017
- Title: PR Review Dashboard and Commits page return HTTP 200 to users without view_devops permission
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Severity: High
- Date: 2026-05-25 | Retest: 2026-05-29 — STILL OPEN (200 for dev_user)

## Steps to reproduce

1. Authenticate as dev_user (Developer role, API key: 2309f6ea9f3335476ebc78cf241cc27c8da0e12e).
2. Send `GET /projects/phoenix-platform/devops_commits`.
3. Send `GET /projects/phoenix-platform/devops_pull_requests`.
4. Observe HTTP response codes.

## Expected result

HTTP 403 Forbidden for users without `view_devops` permission (or non-members).

## Actual result

Both endpoints return HTTP 200 and render full page content for dev_user (Developer role). The `before_action` permission guard (`require_permission :view_devops`) is absent from the commits and pull requests controllers.

## Retest 2026-05-29

- `devops_commits` as dev_user → 200 (**STILL OPEN**)
- `devops_pull_requests` as dev_user → 200 (**STILL OPEN**)

## Evidence

![BUG-RDV-017 — Commits/PR page accessible without view_devops](../../screenshots/BUG-RDV-017/bug-rdv-017-commits-no-auth.png)

## Duplicate check

- Duplicate found: No
