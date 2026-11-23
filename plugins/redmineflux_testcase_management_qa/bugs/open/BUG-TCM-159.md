# Bug Report Template

- Bug ID: BUG-TCM-159
- Production Redmine Issue ID: #129223
- Title: `GET /projects/:id/get_testcases.json` leaks the assignee's `hashed_password` and `salt` in the JSON response
- Redmine version: 6.0.12.stable
- Plugin name: redmineflux_testcase_management
- Plugin version: commit `f10faff` (2026-11-20)
- Environment: `redmine6-happyflow-mariadb` (MariaDB), `localhost:3023`, project `happyflow-mariadb` (id=1)
- Browser: N/A (pure API finding, via `curl`)
- User role: admin (API key) — the vulnerable endpoint only requires project-read access (`rftc_authorize_project_read!`), not admin, so any project member's API key triggers the same leak
- Date: 2026-11-23

## Steps to reproduce

1. As any API key holder with read access to a project (not necessarily admin), call:
   `GET /projects/<project_id>/get_testcases.json?subject=<any substring matching at least one assigned testcase>`
2. Inspect the JSON response for any returned testcase that has an `assigned_to`.

## Expected result

- The response should include only safe, public-facing fields for the assignee (e.g. `id`, `login`,
  `firstname`, `lastname`) — matching how every other Redmine/plugin API endpoint serializes an associated
  User.

## Actual result

- The full `assigned_to` object includes `hashed_password`, `salt`, `twofa_totp_key`,
  `twofa_totp_last_used_at`, and other internal/sensitive User columns, verbatim from the AR model — e.g.:
  ```json
  "assigned_to":{"id":1,"login":"admin","hashed_password":"1be86fb2b39f95b5a68b2e50e7d2899975ac1b9e",
  "firstname":"Redmine","lastname":"Admin","admin":true,"status":1,"last_login_on":"...",
  "language":"","auth_source_id":null,"created_on":"...","updated_on":"...","mail_notification":"all",
  "salt":"e238a96f5770060e1c42e9f17e50ee13","must_change_passwd":false,"passwd_changed_on":"...",
  "twofa_scheme":null,"twofa_totp_key":null,"twofa_totp_last_used_at":null,"twofa_required":false}
  ```
- Root cause (confirmed via source, `app/controllers/runs_controller.rb:1383-1403`,
  `get_testcases_attribute`): `render json: @test_cases, include: [:status, :priority, :assigned_to]` passes
  `:assigned_to` to Rails' default `as_json`/`include` serialization with no `:only`/`:except` scoping, so the
  full `User` AR object (every column) is serialized, not a safe subset. This is a real offline-password-
  cracking exposure: any project member with API access can harvest other users' password hashes and salts
  for every testcase that has an assignee.

## Evidence

### Console / log

Request:
```
curl -H "X-Redmine-API-Key: $KEY" "http://localhost:3023/projects/1/get_testcases.json?subject=Login"
```
Response (truncated to the relevant fragment, full response captured in session transcript):
```json
{"id":19,...,"assigned_to":{"id":1,"login":"admin","hashed_password":"1be86fb2b39f95b5a68b2e50e7d2899975ac1b9e","salt":"e238a96f5770060e1c42e9f17e50ee13",...}}
```

No screenshot — pure API finding, not a UI defect.

## Duplicate check

- Duplicate found: No — checked `bugs/_duplicates.md` and `bugs/_index.md`; no existing bug references
  `hashed_password`, `salt`, or this endpoint's over-serialization. Not confused with BUG-TCM-131 (that bug
  was about this controller's sibling `get_testcases` ignoring pagination, a performance issue — unrelated
  code path, different defect class).
- Existing bug reference (if duplicate): —

## Note on ID assignment

- Originally filed in this session as `BUG-TCM-174`, picked via a naive text-grep of the highest
  `BUG-TCM-NNN` substring anywhere in the repo. That grep matched a **lone prose mention** of
  "BUG-TCM-173" inside `testcases/TESTCASE_MANAGEMENT_SECURITY_REVIEW_121640.md` (a stray/typo reference,
  no actual bug file ever existed for 159–173) — not a real filed bug. Corrected to **159**, the genuine
  next number after the last real file (`bugs/*/BUG-TCM-158.md`), per user correction 2026-11-23.
