# BUG-RDV-008

- Bug ID: BUG-RDV-008
- Title: REST API returns DevOps data from all projects regardless of user's project membership (IDOR)
- Redmine version: 6.0.9 (Forge)
- Plugin name: redmineflux_devops
- Plugin version: 0.1.0
- Environment: Forge only — https://flux-fhcnclfvk49.forge.zehntech.com/ (does NOT reproduce on Local Docker)
- Browser: Playwright (headless)
- User role: Developer (daisy.skye — member of phoenix-platform only)
- Severity: Critical
- Date: 2026-05-22

## Steps to reproduce

1. Obtain the API key for user `daisy.skye` (Developer role, member of `phoenix-platform` only).
2. Send `GET /devops/builds.json?project_id=agileboard` with header `X-Redmine-API-Key: <daisy_key>`. (`agileboard` is a project daisy.skye has NO membership in.)
3. Observe the HTTP response status and body.
4. Repeat for `GET /devops/commits.json?project_id=mobileappdev`.

## Expected result

- HTTP 403 Forbidden for both requests.
- No DevOps data from projects the user is not a member of is returned.

## Actual result

- HTTP 200 returned for both requests.
- Full DevOps data is returned: `agileboard` returns real build records (e.g., build_number "2249", provider "gitlab_ci", status "cancelled"). `mobileappdev` returns real commit records (SHA, message, author).
- A user with membership in only one project can read DevOps data from ALL other projects via the REST API.

## Evidence

- Screenshot path: screenshots/TC-RDV-022/
- API response body (agileboard): `{"builds":[{"id":350,"build_number":"2249","external_id":"rflxd-build-7-50","provider":"gitlab_ci","status":"cancelled","branch":"main","commit_sha":"7238f0..."...}]}`
- API response body (mobileappdev commits): `{"commits":[{"id":117,"sha":"1260064...","message":"refs #307 Cache user permissions per request..."...}]}`

## Duplicate check

- Duplicate found: No

## Notes

- All 9 non-phoenix-platform projects tested — all return 200 with data for daisy.skye (Forge).
- This is a classic Insecure Direct Object Reference (IDOR) / broken access control vulnerability.
- Root cause: the REST API controllers likely perform authentication but not project-scoped authorisation before returning data.
- Impact: any authenticated Redmine user can exfiltrate DevOps data (builds, commits, deployments, etc.) from all projects via the REST API.

## Retest

- Date: 2026-05-23
- Environment: Local Docker (http://localhost:3008)
- Result: **DOES NOT REPRODUCE on local**
- Tested with `non_member` user (not a member of project 7). `GET /projects/7/devops_builds.json` → HTTP 403. `GET /projects/7/devops_commits.json` → HTTP 403. Authorization is correctly enforced on local.
- Bug remains open as Forge-specific. May have been fixed in the local Docker build or may be a Forge-specific configuration difference. Requires re-verification on Forge to determine if patched.

## Retest

- Date: 2026-05-26
- Environment: Local Docker (http://localhost:3008) — fresh instance
- Result: **NOT TESTABLE on local** (Forge-specific bug)
- Verified: `GET /projects/atlas-backend/devops_builds.json` with dev_user API key (member of phoenix-platform only) → HTTP 403 (empty body). Project-scoped authorization is correctly enforced on local Docker. IDOR does not reproduce on local. Forge-specific retest required.

## Retest

- Date: 2026-05-26
- Environment: Forge (https://flux-foq1fnz3j49.forge.zehntech.com) — new instance
- Result: **CONFIRMED** — IDOR still present on new Forge
- User: `daisy.skye` (ID 6, Developer role on `agileboard` only, API key `adefe71bded04463c1be837a343cdbb6a67118ba`, `view_devops` permission granted).
- `GET /devops/commits.json?project_id=agileboard` → HTTP 200, total_count=90 (own project, expected).
- `GET /devops/builds.json?project_id=mobileappdev` → HTTP 200, total_count=50, provider=gitlab_ci (NOT a member — IDOR confirmed).
- `GET /devops/commits.json?project_id=hrmngmt` → HTTP 200, total_count=90 (NOT a member — IDOR confirmed).
- Cross-project REST API access is still unrestricted on Forge. A user with membership in one project reads DevOps data from all other projects. Root cause unchanged.

## Retest — Forge flux-fujhcd9zj49 (2026-05-26)

- Date: 2026-05-26
- Environment: Forge (https://flux-fujhcd9zj49.forge.zehntech.com) — new instance
- Result: **FIXED**
- User: daisy.skye (Developer, member of agileboard only; confirmed not a member of mobileappdev).
- `GET /devops/builds.json?project_id=mobileappdev` with daisy.skye API key → HTTP 403 Forbidden.
- `GET /devops/commits.json?project_id=hrmngmt` with daisy.skye API key → HTTP 403 Forbidden.
- Project-scoped authorization is now correctly enforced. IDOR does not reproduce on new Forge. Bug closed.
