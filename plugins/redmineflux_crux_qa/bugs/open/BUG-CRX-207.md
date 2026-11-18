# Bug Report Template

- Bug ID: BUG-CRX-207
- Production Redmine Issue ID: <!-- not yet reported -->
- Title: Test Author proposes 2 near-duplicate login testcases without ever flagging the already-existing, semantically identical testcase in the same suite
- Redmine version: 6.0-bookworm
- Plugin name: redmineflux_crux (Test Author agent)
- Plugin version: crux-core 747af39
- Environment: localhost:3015 (local Docker)
- Browser: Chromium (Playwright MCP)
- User role: admin
- Date: 2026-11-18

## Steps to reproduce

Executing TC-CRX-632 (deferred pending a pre-existing testcase fixture; built one):

1. Native ground truth, project #3 (Crux QA Agent Test Project), suite #1 "Login and Auth": testcase #11
   "Verify login with valid credentials" already exists (confirmed via
   `redmineflux_testcases_management_list_testcases(project_id=3, tracker_id=4)`).
2. Created a fresh fixture issue (#155, "Login page should accept valid credentials") with acceptance
   criteria describing the exact same scenario: "A user with valid credentials is logged in and redirected
   to the dashboard."
3. Test Author pinned: "Test Author, write and create test cases for issue #155 in the Login and Auth
   suite."
4. The agent genuinely called `Get issue`, `List test suites`, `List testcases`, `List projects`, and
   `List testcases in suite` (5 real tool calls, all shown in the "Checked 5 things" disclosure) — so the
   duplicate-check step the persona file requires (`list_testcases` before proposing) WAS executed, not
   skipped.
5. Despite that, the resulting 5-item confirm card proposed **"User logs in with valid email and
   password"** and **"User logs in with valid username and password"** as two brand-new testcases — both
   semantically identical to the already-existing #11 "Verify login with valid credentials" — with zero
   mention of #11 anywhere in the response.

## Expected result

Per this TC's own expectation (and the persona file's `list_testcases`-before-proposing step): the
duplicate-check should actually prevent proposing a second, near-identical case — the agent should flag
the existing #11 instead of silently proposing 2 duplicate confirm-card entries for the same scenario.

## Actual result

- The duplicate-check tool calls were genuinely made (`list_testcases`, `list_testcases in suite`) — this
  is not a missing-tool-call defect.
- The check's *result* was never acted on: the confirm card proposed 2 cases covering the exact same
  "valid credentials → logged in" scenario as #11, with no disclosure that a matching case already exists,
  no "should I skip this one," nothing.
- Cancelled before confirming — no actual duplicate was created; this is a proposal-stage defect, not a
  data-integrity one.

## Evidence

### Console / log

- Confirm card entries 1–2 (verbatim subjects): `"User logs in with valid email and password"`,
  `"User logs in with valid username and password"` — both project `Crux QA Agent Test Project`, suite `1`.
- Native ground truth before the ask: `redmineflux_testcases_management_list_testcases(project_id=3,
  tracker_id=4)` → `#11 ... Verify login with valid credentials` already present.
- Tool-call disclosure (verbatim): `✓ Get issue`, `✓ List test suites`, `✓ List testcases`, `✓ List
  projects`, `✓ List testcases in suite` — 5 genuine calls, confirming the lookup step ran.

## Duplicate check

- Duplicate found: No.
- Existing bug reference: First finding on the Test Author agent's duplicate-detection logic specifically.
  Distinct from BUG-CRX-187 (wrong-project resolution) and BUG-CRX-206 (module-enablement gap) — this is
  a semantic-matching gap: the lookup runs, but its results are never compared against the newly-drafted
  cases before they're proposed.
