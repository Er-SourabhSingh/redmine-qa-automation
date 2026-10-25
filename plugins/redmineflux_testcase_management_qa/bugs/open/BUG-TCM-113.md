# BUG-TCM-113

- Bug ID: BUG-TCM-113
- Production Redmine Issue ID: 125091
- Title: `create_milestone`/`edit_milestone`/`delete_milestone` permissions are enforced in code but never declared in `init.rb`, so no non-admin role can ever be granted them
- Severity: High
- Redmine version: 6.0.11.stable (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.2.0
- Environment: Docker `localhost:3000`, project `alpha-web`
- Browser: Chromium (Playwright MCP) / curl (API)
- User role: QA Manager (`qa.manager`, holds every other TCM permission) and Administrator
- Date: 2026-10-24

## Steps to reproduce

1. As an Administrator, open **Administration → Roles and permissions** and inspect the "Redmineflux Testcase
   Management" permission group for any role (e.g. QA Manager's role, or create a role granting every TCM
   checkbox shown).
2. Confirm the full list of grantable TCM tokens does not include anything for milestones.
3. As a user whose role has every TCM permission the UI offers (e.g. `qa.manager`), attempt to create a milestone:
   `POST /projects/alpha-web/testcase_milestones` (web form) or
   `POST /testcase_mcp/projects/alpha-web/milestones.json` (MCP API).

## Expected result

- The Roles/Permissions page offers `create_milestone` / `edit_milestone` / `delete_milestone` as grantable
  checkboxes (they are real, declared permissions per the product's own milestone feature), and a role granted
  them can create/edit/delete milestones.

## Actual result

- `init.rb` declares 18 TCM permission tokens and none of them are milestone-related — `create_milestone`,
  `edit_milestone` and `delete_milestone` do not exist as grantable options anywhere in
  Administration → Roles and permissions, for any role, including a role with every other TCM checkbox ticked.
- Both the milestone web controller (`TestcaseMilestonesController#create/update/destroy`) and the MCP admin-config
  controller (`Apis::MCPAdminConfigController#create_milestone/update_milestone/delete_milestone`) correctly call
  `rftc_require_permission!(:create_milestone, @project)` etc. — the enforcement code is real and correct — but
  since the permission can never be assigned to any role, `rftc_require_permission!` falls through to its
  "not an admin, doesn't hold a permission that doesn't exist" branch for every non-admin user. The net effect:
  **only a site Administrator can ever create, edit, or delete a milestone** — a QA Manager/QA Lead role, no
  matter how it is configured, is permanently locked out of a feature the product's own UI and docs present as
  permission-gated (implying it should be grantable).
- Confirmed live: `qa.manager` (full TCM permission set) gets `403 {"error":"Unauthorized access"}` on the web
  form POST and `403 {"error":"Unauthorized access"}` on the MCP endpoint. Only `admin` succeeds.

## Root cause (confirmed via code read)

`init.rb` permission block (~line 141-159) lists:

```ruby
permission :view_test_suite, {}
permission :create_test_suite, {}
permission :edit_test_suite, {}
permission :delete_test_suite, {}
permission :create_run, {}
permission :edit_run, {}
permission :delete_run, {}
permission :close_run, {}
permission :execute_testcase, {}
permission :view_report, {}
permission :create_report, {}
permission :edit_report, {}
permission :delete_report, {}
permission :view_all_todos, {}
permission :add_requirement, {}
permission :edit_requirement, {}
permission :delete_requirement, {}
permission :manage_environment, {}
```

— no `create_milestone` / `edit_milestone` / `delete_milestone` entries, despite both the web controller and the
MCP admin-config controller referencing those exact symbols in `rftc_require_permission!` calls. The permissions
were apparently intended to be declared (the enforcement code assumes they exist) but the `init.rb` declaration
was never added — likely an omission from the same change that added the enforcement checks.

## Evidence

### API responses

```
POST /projects/alpha-web/testcase_milestones  (qa.manager, full TCM perms)  -> 403 Forbidden (no row created)
POST /testcase_mcp/projects/alpha-web/milestones.json (qa.manager)          -> 403 {"error":"Unauthorized access"}
POST /projects/alpha-web/testcase_milestones  (admin)                      -> 302 (created successfully)
```

### Console / log

- No server error; a correctly-enforced-but-undeclared-permission misconfiguration, not a crash.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing bug covers milestone permissions not being
  declared. Related to, but distinct from, the historical finding that milestone CRUD once had *no* server-side
  check at all (BUG-TCM-038, closed) — that gap has since been fixed; this is a new, different gap (the
  permission exists in enforcement code but nowhere in the grantable permission set).
