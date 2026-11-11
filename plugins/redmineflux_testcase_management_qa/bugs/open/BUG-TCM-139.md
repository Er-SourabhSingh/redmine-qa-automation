# Bug Report

- Bug ID: BUG-TCM-139
- Production Redmine Issue ID:
- Title: `GET /knowlegebase_pages_testcase/:id` leaks the foreign project's name/nav on its 404 page to a non-member
- Redmine version: 6.0.11 (Docker, localhost:3000)
- Plugin name: Redmineflux Testcase Management
- Plugin version: branch `master`, commit `9785d2c`
- Environment: Local Docker (Postgres)
- Browser: Chromium (Playwright)
- User role: Developer on Project A (`rftc-016-ci-qa`) only — zero membership on Project B
- Date: 2026-11-11

## Steps to reproduce

1. Log in as `daisy.skye` (Developer on Project A only, no membership on Project B,
   `rftc-121640-project-b`, id=4).
2. Request `GET /knowlegebase_pages_testcase/2?project_id=4` (requirement id 2 belongs to Project B).

## Expected result

A non-member should get a 404 that reveals nothing about Project B — no project name, no working navigation into
Project B — matching the fix already shipped for `GET /runs/:id/edit` (BUG-TCM-134) and for the sibling
`requirement/testcases` and `user_project` endpoints (BUG-TCM-135, both now clean).

## Actual result

- HTTP response is correctly `404 Not Found` — no requirement content, title, or body leaks (the original
  BUG-TCM-135 data leak is fixed).
- However, the page's `<title>` reads `"404 - RFTC-121640 Security Project B - Redmine"`, and the rendered page
  shows Project B's real `<h1>` heading and a full, working project navigation menu (Overview, Activity, Roadmap,
  Issues, Spent time, Gantt, Calendar, News, Documents, Wiki, Files — all linking into
  `/projects/rftc-121640-project-b/...`), to a user with zero membership on Project B.
- The sibling endpoints from the same original ticket (`GET /requirement/testcases?project_id=4`,
  `GET /user_project/4`) do **not** have this leak — their 404 pages show generic, unscoped Redmine navigation.
  Confirms the gap is specific to this one controller action, likely because it assigns `@project` (used by the
  layout) before its visibility/membership check fails.
- Same minor-disclosure shape as BUG-TCM-134's original bug (project identity + working nav leaked via an
  otherwise-correctly-refused request) — just not yet applied to this specific action.

## Evidence

### Screenshot

N/A — confirmed via Playwright page title/snapshot inspection this session (see retest note in BUG-TCM-135.md);
no dedicated screenshot captured yet.

### Console / log

- Page title captured live: `404 - RFTC-121640 Security Project B - Redmine`.
- Page `<h1>`/nav snapshot shows working links to `/projects/rftc-121640-project-b/{activity,roadmap,issues,...}`.
- Sibling requests (`requirement/testcases`, `user_project`) on the same non-member session returned a clean,
  unscoped 404 page for comparison.

## Duplicate check

- Duplicate found: No (related to BUG-TCM-134/135 but a distinct, narrower residual gap on one specific action,
  found during this session's retest of BUG-TCM-135)
- Existing bug reference (if duplicate): N/A
