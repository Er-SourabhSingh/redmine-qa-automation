# Bug Report Template

- Bug ID: BUG-CRX-084
- Production Redmine Issue ID: #125492
- Title: QA Agent has no way to resolve a Requirement by name at all — there is no `list_requirements`/`get_requirement`/search MCP tool, so "link test case to requirement X" always ends in the agent asking the user to supply the requirement's numeric ID, violating the real-user-phrasing expectation that a user should never need to know or supply this ID
- Redmine version: 6.0-bookworm (new local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, QA Agent, Test Case Management plugin domain)
- Plugin version: redmineflux_testcase_management 7.2.0 / crux-core 0.128.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: non-admin (`luna.blossom`, "QA Full Access" role — `add_requirement`/`edit_requirement`/`delete_requirement` genuinely granted)
- Date: 2026-10-27

## Steps to reproduce

1. As `luna.blossom`, create a real requirement via the plugin's native UI (`/requirements?project_id=...`, a Confluence-like page-based record, NOT a Redmine issue — confirmed via DB: the `requirements` table is its own entity, joined to testcase issues only via a separate `requirement_issues` table). Example: requirement #1, "User must be able to reset password via email," in "Crux QA Agent Test Project".
2. In Ask Crux chat (QA Agent): "in the Crux QA Agent Test Project, can you create a test case titled 'Verify password reset email is sent' and link it to the 'User must be able to reset password via email' requirement?" — the user names the requirement by its real, human-readable title only, exactly as a real user would (per this suite's standing real-user-phrasing rule: only Run ID and Issue/Testcase ID are ever shown to a user in this plugin's UI; Requirement — like Suite and Environment — has no ID visible anywhere a user would see it in normal use).
3. Observe the reply.

## Expected result

The agent should resolve "User must be able to reset password via email" to its real requirement ID automatically — the same way it resolves project names, suite names, and environment names elsewhere in this suite — using some `list_requirements`/search-by-title tool, then proceed straight to a `create_testcase(requirement_ids=[...])` confirm card. The user should never need to know or supply a numeric requirement ID.

## Actual result

The agent replied: *"Let me proceed with creating the test case. I'll create it first and then link the requirement by its ID if you can provide it, or you can provide the requirement issue ID now: What is the numeric issue ID of the 'User must be able to reset password via email' requirement? ... Alternatively, if you'd like me to just create the test case now without the requirement link..."* — it never attempted to look up the requirement by name and instead asked the user to supply the ID directly, offering to silently drop the requested link as a fallback.

Root cause confirmed via MCP server source inspection (`testcases_management.py`, all 64 `@mcp.tool` entries): **there is no `list_requirements`, `get_requirement`, or any other requirement-lookup/search tool at all** in this plugin's MCP surface. The only requirement-related capability that exists is the `requirement_ids: list[int]` parameter on `redmineflux_testcases_management_create_testcase` — which requires the caller to already know the numeric ID, and whose own docstring misleadingly calls these "requirement issue IDs" even though Requirements are confirmed via DB to be a distinct entity (`requirements` table), not Redmine issues at all (linked to issues only through the separate `requirement_issues` join table). The agent's behavior here is honest given the tooling it has, but the underlying capability gap is real: it is architecturally impossible for this agent to fulfill a "link to requirement X" request by name, for any value of X, without first asking the user for an ID a real user would never see in the plugin's own UI (the Requirements page shows pages by title, not by a visible numeric ID in its default view).

## Evidence

### Console / log

- Exact reply (verbatim): `"Let me proceed with creating the test case. I'll create it first and then link the requirement by its ID if you can provide it, or you can provide the requirement issue ID now: What is the numeric issue ID of the \"User must be able to reset password via email\" requirement? Once I have that, I can create the test case and link them together. Alternatively, if you'd like me to just create the test case now without the requirement link, I can do that immediately and you can link it manually afterward."`
- MCP source check: `grep -n '@mcp.tool' testcases_management.py` → 64 matches, none named for requirement list/get/search; `grep -n 'requirement' -i` combined with `def `/`@mcp.tool` → 0 matches.
- DB schema check: `requirements` (id, title, project_id, ...), `requirement_issues` (id, requirement_id, issue_id, project_id) — confirms Requirements are a separate page-like entity, not issues, despite `create_testcase`'s own docstring calling the link parameter "requirement issue IDs."

## New repro — 2026-10-27, Create Run as a permission-less user (Suite/Testcase/User IDs, not just Requirement IDs)

Same class, a different trigger: as `daisy.skye` (QA No Access, genuinely lacking `view_test_suite`), asking the QA Agent to create a run "including all test cases from the 'Login and Auth' suite" produced: *"I don't have permission to view test suites... I need the following information from you: 1. Suite ID... 2. Testcase IDs... 3. User ID..."* — three identifiers a real non-admin user has no way to see anywhere in this plugin's UI, asked for the same reason as the original Requirement-ID finding (no permission/tool to resolve the name). Supplying the raw IDs directly was tested as a security probe: the actual `create_run` write was still genuinely rejected server-side ("Unauthorized access"), confirming **no privilege-escalation path exists** — the permission check is enforced at the tool/API layer regardless of how the IDs were obtained. The defect is purely that the agent asks for IDs a real user in this position could never have, not a security bypass.

## Note for triage

This is a different shape from every other finding in this suite's wrong-ID-hallucination family (BUG-CRX-015/019/038/043/050/052/079): those bugs are about the agent **guessing a wrong value** for a field it should resolve via an available lookup tool. Here, **no lookup tool exists at all**, so there is nothing to guess correctly — this is a capability gap, closest in shape to BUG-CRX-072 (CRM "Add deal stage" — tool exists in theory per the plugin's own permission system, but isn't actually reachable/usable via chat). Per the explicit project instruction that only Run ID and Issue/Testcase ID may ever be asked of a real user, and that the agent asking for any other ID (Suite, Environment, Requirement) should itself be flagged — this is exactly that case for Requirements, and it is structurally guaranteed to recur on every single "link to requirement X by name" request until a requirement-lookup tool is added to the MCP server.

## Duplicate check

- Duplicate found: No — first instance of a request type that is architecturally unfulfillable by name due to a missing lookup tool, as distinct from a tool existing but being miscalled (the wrong-ID family) or a tool existing but being unreachable (BUG-CRX-072).
