# BUG-MCP-002

- Bug ID: BUG-MCP-002
- Production Redmine Issue ID: #129086
- Title: MCP `create_testcase` returns a bare 500 Internal Server Error whenever `test_suite_id` is passed, on production specifically — not reproducible on the local QA stack
- Redmine version: production `flux.zehntech.com` (reported against); local repro attempts on 6.0-bookworm (local Docker, `C:\crux-redmine`, localhost:3015)
- Plugin name: Redmineflux MCP Server (`redmineflux-mcp`'s `create_testcase` tool — found against the Testcase Management plugin's `apis/mcp_testcase_controller.rb`, but the defect is in the MCP integration layer/tool, not the plugin's own UI/API)
- Plugin version: production version as of 2026-11-19 (exact version not captured — no admin UI access to production from this session)
- Environment: Production MCP server (`redmineflux` server) against `flux.zehntech.com`, project `ztflux` (id 122)
- Browser: N/A (MCP tool call, not a browser session)
- User role: whatever account/API key the production `redmineflux` MCP server authenticates as
- Date: 2026-11-19

## Steps to reproduce (on production)

1. Call `redmineflux_testcases_management_create_testcase` with `project_id=122`, a real `subject`, and
   `test_suite_id=435` (an existing, real suite — "crux-agents", a sub-suite of #374, already holding 23
   testcases).
2. Observe: `Not created: Server error (500): Internal Server Error`.
3. Retry the exact same call 2 more times (ruling out a transient blip) — same 500 every time.
4. Retry with `test_suite_id` entirely omitted (same `project_id`/`subject`) — succeeds immediately: `Testcase
   created: "..." (tracker #7, project #122)`.
5. Work around it: create without `test_suite_id`, find the new testcase's id (via
   `list_unassigned_testcases`/`list_testcases_by_attributes`, since the create response doesn't return an
   id when a plain bulk-create response omits it), then call
   `redmineflux_testcases_management_add_testcases_to_suite(suite_id=435, testcase_ids=[<id>])` separately —
   this succeeds cleanly every time.

## Expected result

- Passing `test_suite_id` to `create_testcase` should create the testcase and add it to the named suite in
  one call, exactly like the workaround achieves in two — matching the tool's own documented behavior
  ("Optional suite to put the new testcase in... The suite is checked before anything is created; the reply
  says whether the case was added to it").

## Actual result

- A bare 500 with no further detail, every time, only when `test_suite_id` is present. This was tested with:
  - A short subject, no description.
  - The real, full production subject/description eventually used (CRUX_AGENT_DEVOPS, ~3,800 characters,
    Textile `h3.` headers, em dashes, `->` sequences).
  - Both content shapes failed identically — the failure is not about description length or content.

## Analysis (source-read, not confirmed against production logs — no log access from this session)

Read `redmineflux-mcp/src/tools/testcases_management.py` (local checkout,
`C:\crux-redmine\services\redmineflux-mcp`) around the `create_testcase` tool implementation (~line 469-548):

- When `test_suite_id` is truthy, the tool does an extra `GET
  /testcase_mcp/test_suites/{test_suite_id}.json?suite_id={test_suite_id}` call **before** creating anything,
  specifically to fetch the suite's name and confirm it exists (comment: "a suite named in the request used
  to be dropped silently. Check it first, so a bad suite never leaves a stray case" — BUG-CRX-081). This GET
  is wrapped in a `try/except RedmineAccessError` — but a RedmineAccessError is presumably only raised for
  4xx-class responses; if the Rails endpoint itself raises an unhandled exception (500), that would surface
  as an uncaught error from `client.get`, which would explain a bare, undetailed 500 reaching the MCP caller
  with none of the tool's own clean error messages ("Testcase ##{id} not found", etc.) — those only fire for
  a clean 404, not a crash. **This is why the defect sits with the MCP tool/integration layer, not the
  Testcase Management plugin's own UI or REST API** — the plugin's screens never hit this particular
  combination the same way, and the MCP tool's own error handling doesn't distinguish a 500 from a 404 here.
- This exactly matches the observed behavior: **only** passing `test_suite_id` adds this extra GET step, and
  only that code path 500s.
- Read the Rails side too (`redmineflux_testcase_management/app/controllers/apis/mcp_testcase_controller.rb`,
  local checkout `C:\crux-redmine\plugins\redmineflux_testcase_management`): the `get_test_suite` action (the
  one this GET hits) uses the `load_suite_only` before_action, which correctly resolves `@project` with a
  identifier-then-id fallback (`Project.find_by(identifier: @suite.project_id) || Project.find_by(id:
  @suite.project_id)` — a fix already present, commented "rftc-012 H1"), then calls `suites_viewable?(@project)`
  — this reads as a working implementation for an admin caller, and should not 500 under normal conditions.
- **I could not reproduce the 500 locally** despite trying: a bare suite (just created, 0 testcases), a nested
  parent/child suite pair, and the real production-identical long description — all three created and added
  to their suite cleanly on the local stack (`localhost:3015`, project #20). This suggests the fault is
  specific to either (a) something about the real state of production's suite #435 itself (23 existing
  testcases accumulated over a long QA history — possibly one of them references a deleted/corrupted
  association that only surfaces when `@suite.issues.pluck(:id)` / `@suite.issues.count` runs against it), or
  (b) a version/patch difference between the local checkout I read and whatever is actually deployed on
  production right now (the "rftc-012 H1" fix might be in the local checkout but not yet deployed live).
- **This needs production server logs (the actual 500 stack trace) to pin down further** — not available
  from this QA session.

## Workaround in use

Create the testcase without `test_suite_id`, then move it into the suite with
`add_testcases_to_suite` as a second call. Confirmed reliable (used successfully for
testcase #129083 / BUG-CRX-218 / BUG-CRX-219 reporting on 2026-11-19).

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —
