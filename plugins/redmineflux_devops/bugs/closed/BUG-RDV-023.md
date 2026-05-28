# Bug Report

- Bug ID: BUG-RDV-023
- Title: Build badge JS polling uses project identifier string in API call — returns 403, badge never auto-updates
- Severity: High
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Plugin version: 0.1.0
- Environment: Local Docker (http://localhost:3008)
- Browser: Chromium (Playwright)
- User role: Developer (view_devops)
- Date: 2026-05-25

## Steps to reproduce

1. Navigate to an issue in project "phoenix-platform" that has a linked build (e.g., issue #524).
2. Observe the DevOps panel build badge (e.g., `devops-build-badge-failed`).
3. Send a `workflow_run` webhook with `action: completed, conclusion: success` for the linked branch.
4. Wait 30 seconds for the badge to poll `/devops/builds.json` and auto-update.
5. Open browser DevTools → Network tab. Observe the polling request.

## Expected result

- The badge polls `/devops/builds.json?project_id=7&issue_id=524&limit=1` using the numeric project ID.
- The API returns 200 with updated build status.
- The badge updates from "failed" to "success" without a page reload.

## Actual result

- The badge element contains `data-project-id="phoenix-platform"` (string identifier, not numeric ID).
- The polling JS reads this attribute and calls `/devops/builds.json?project_id=phoenix-platform&issue_id=524&limit=1`.
- The REST API rejects the string identifier with HTTP 403.
- The badge never auto-updates; users must manually reload the page to see the updated build status.
- Confirmed in `devops-c9f9559f.js`: polling interval is 30000 ms; the `data-project-id` attribute is used verbatim.

## Evidence

- Screenshot path: screenshots/TC-RDV-095/
- Log path: logs/
- Trace/video path: N/A

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A

## Retest

- Date: 2026-05-26
- Environment: Local Docker (http://localhost:3008) — fresh instance
- Result: **NOT TESTABLE**
- All project issue detail pages return HTTP 500 in the fresh environment (issues #2, #28, #29, #32, #33 all 500). The DevOps build badge rendered via ViewHook cannot be inspected. Testing blocked by environment issue. Original bug remains open pending a stable issue page environment.

## Retest — Forge flux-fujhcd9zj49 (2026-05-26)

- Date: 2026-05-26
- Environment: Forge (https://flux-fujhcd9zj49.forge.zehntech.com) — new instance
- Result: **FIXED**
- Navigated to issue #468 (agileboard). Build badge element present: `data-project-id="7"` (numeric ID, not string identifier "agileboard"). Polling API `GET /devops/builds?project_id=7&issue_id=468&limit=1` → HTTP 200. Both fixes in place: badge uses numeric ID and API accepts both numeric and string identifiers. Screenshot: screenshots/BUG-RDV-023/retest-2026-05-26-fixed.png. Bug closed.
