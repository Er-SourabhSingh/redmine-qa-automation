# Bug Report

- Bug ID: BUG-RDV-012
- Title: Commits REST API ignores the limit parameter — all records returned on page 1
- Redmine version: 6.0.9 (Local Docker)
- Plugin name: redmineflux_devops
- Plugin version: 0.1.0
- Environment: Local — http://localhost:3008
- Browser: Playwright (automated) / PowerShell Invoke-RestMethod
- User role: Administrator
- Severity: Medium
- Date: 2026-05-23
- Discovered in TC: TC-RDV-021

## Steps to reproduce

1. Create 25 or more commit records via the API or DB seeding (project `phoenix-platform`).
2. Send `GET /projects/7/devops_commits.json?limit=5&page=1` with a valid API key.
3. Observe the number of records returned.
4. Send `GET /projects/7/devops_commits.json?limit=5&page=2` and observe.

## Expected result

- Page 1 returns exactly 5 records (respecting `limit=5`).
- Page 2 returns the next 5 records.
- Response includes a `total_count` field to enable client-side pagination.

## Actual result

- Page 1 returns all 25 records regardless of the `limit` value.
- Page 2 returns records starting at offset 5 (the `offset`/`page` parameter is respected but `limit` is not).
- No `total_count` field is present in the commits response (unlike the deployments endpoint which does include it).
- Setting `limit=5` has no effect on the number of records returned.

## Evidence

- Screenshot path: screenshots/TC-RDV-021/
- Log path: —

## Duplicate check

- Duplicate found: No

## Retest

- Date: 2026-05-23
- Environment: Local Docker (http://localhost:3008)
- Result: **CONFIRMED** (originally discovered in this session)
- `GET /projects/7/devops_commits.json?limit=3&page=1` → 26 records returned (all records, limit parameter ignored). Original discovery confirmed.
