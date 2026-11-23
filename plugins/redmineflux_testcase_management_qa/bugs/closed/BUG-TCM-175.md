# Bug Report Template

- Bug ID: BUG-TCM-175
- Production Redmine Issue ID: #124338
- Title: Testcase Management MCP `list_test_suites`/`get_test_suite` refused every non-admin with "Permission denied: view_test_suite" after the plugin team silently renamed the permission to `view_testcase`, even for roles with full suite/run/execute rights
- Redmine version: 6.0-bookworm (local Docker, `C:\crux-redmine`, localhost:3015)
- Plugin name: redmineflux_testcase_management
- Plugin version: master, commit `acf042b` (fix landed in `028663a`, carried through `f10faff`)
- Environment: Local Docker QA stack
- Browser: Chromium (Playwright MCP) + direct API calls
- User role: Admin (setup), two dedicated non-admin test users (retest)
- Date: 2026-11-23

## Steps to reproduce

1. Originally reported on flux.zehntech.com (#124338, author Nidhi Singh, 2026-10-22): `list_test_suites`
   refused with "Permission denied: view_test_suite permission required", even though the same project's
   suites were visible in the web UI and other MCP calls (`list_runs`, `list_issues`) succeeded for the same
   account.
2. Root cause (per developer journal on #124338): the plugin team renamed the suite-view permission from
   `view_test_suite` to `view_testcase` on 2026-10-27 (BUG-CRX-024), but no role anywhere was ever granted the
   new permission — every non-admin was refused regardless of their actual suite/run/execute rights.
3. Retest setup (this session): pulled `redmineflux_testcase_management` to `acf042b` (includes the fix at
   `028663a`). Created a new role "TCM Execute Only" (only `execute_testcase`, explicitly NOT `view_testcase`)
   and added user `zeropermtest` to project "Crux QA Agent Test Project" with it. Reused the existing
   `daisy.skye` membership on the same project (role "QA No Access" — zero Testcase Management permissions at
   all).
4. Called the underlying endpoint directly with each user's own API key (not admin's), exactly as the MCP
   tool does internally: `GET /testcase_mcp/projects/crux-qa-agent-test-project/test_suites.json`.

## Expected result

- A user with `execute_testcase` (but not `view_testcase`) should now be able to list suites, per the fix's
  stated behavior ("`list_test_suites`/`get_test_suite` now allow any user who can view, create, edit or
  delete suites, or execute test cases, or create/edit runs").
- A user with zero Testcase Management permission at all should still be refused, but with a clearer message
  naming exactly where to grant it.

## Actual result

- **zeropermtest** (role "TCM Execute Only" — `execute_testcase` only, no `view_testcase`): `200 OK`, real
  suite data returned — `{"test_suites":[{"id":1,"name":"Login and Auth",...},{"id":2,"name":"Password
  Reset",...}],"total_count":2}`. Matches the fix exactly.
- **daisy.skye** (role "QA No Access" — zero Testcase Management permission): `403`, with the new message —
  *"Permission denied: viewing test suites needs the 'View testcase' permission in project 'Crux QA Agent Test
  Project'. An administrator can grant it under Administration → Roles and permissions → [your role] →
  Testcase management → View testcase."* — the clearer, actionable message the fix promised, not the old bare
  "view_test_suite permission required."
- Both outcomes exactly match the developer's own described fix and "Verified locally" claims on #124338's
  journal. CONFIRMED FIXED.

## Evidence

### Console / log

- `curl -H "X-Redmine-API-Key: <zeropermtest's key>" http://localhost:3015/testcase_mcp/projects/crux-qa-agent-test-project/test_suites.json` → `200`, 2 real suites.
- `curl -H "X-Redmine-API-Key: <daisy.skye's key>" http://localhost:3015/testcase_mcp/projects/crux-qa-agent-test-project/test_suites.json` → `403`, the new clear message quoted above.
- Fixture left in place, reusable: role "TCM Execute Only" (id 11, `execute_testcase` only) and `zeropermtest`'s
  membership on "Crux QA Agent Test Project" (id 3) with that role; `daisy.skye`'s existing "QA No Access"
  membership on the same project was reused unchanged.

## Duplicate check

- Duplicate found: No — this is a retest of an existing production bug (#124338), not a newly-found defect.
- Existing bug reference: #124338 (production, reported by Nidhi Singh 2026-10-22)
