# Bug Report

- Bug ID: BUG-CRX-193
- Production Redmine Issue ID: <!-- fill after report_defect approved -->
- Title: `kb_restore_version` always crashes with a raw Python `TypeError` leaked to the caller — version restore is completely non-functional
- Redmine version: 6.0-bookworm
- Plugin name: redmineflux_crux (`redmineflux-mcp` server, Helpdesk Knowledgebase tool group, `kb_restore_version`)
- Plugin version: crux-core 0.130.0 / mcp current local build (2026-11-16)
- Environment: Local Docker, http://localhost:3015, via `redmineflux-local` MCP (localhost:8082)
- Browser: N/A (direct MCP tool call, also reachable from Ask Crux chat via the same tool)
- User role: admin
- Date: 2026-11-16

## Steps to reproduce

1. On a KB page that has at least one saved version (page #1 "VPN Setup Guide Retest", version #1 saved via
   `kb_publish_version` earlier in this session), overwrite its content with
   `kb_update_content(project_id=12, page_id=1, content="TEMP-OVERWRITE-FOR-RESTORE-TEST")`.
2. Call `redmineflux_helpdesk_kb_restore_version(version_id=1)`.
3. Observe the response and then `kb_get_page(project_id=12, page_id=1)` to check whether content was actually
   restored.
4. Repeat step 2 once more to confirm it isn't a one-off/transient failure.

## Expected result

Per the tool's own documented purpose (confirmed reachable and discoverable — this is not a discovery-gap bug
like BUG-CRX-192), calling `kb_restore_version` with a valid, existing `version_id` should restore that
version's content onto the live page, the same way `kb_update_content` genuinely writes content.

## Actual result

Both calls returned the **identical** error, verbatim:

> `"Unexpected error restoring version. Please try again or contact support. (Error: TypeError:
> RedmineClient.post() missing 1 required positional argument: 'json')"`

This is a raw Python implementation bug in the MCP server's own `RedmineClient.post()` call inside the
`kb_restore_version` handler — a required `json` argument is missing from the call site — not a Redmine-side
validation failure or permission issue. The error is 100% reproducible (2/2) and leaks an internal Python
stack-trace-style message directly to the end user/agent, rather than failing with a clean, actionable error.

Native-verified the write never happened either: after both failed restore attempts, `kb_get_page` still
showed the page's content as `"TEMP-OVERWRITE-FOR-RESTORE-TEST"` (the deliberate overwrite from step 1), never
reverting to version #1's real content (`"Updated: Step 1: Download the client from the portal. Step 2: Log in
with SSO."`) — confirming this isn't a misleading-error-on-a-silent-success case, the restore cleanly never
executes at all, every time.

Impact: **the entire version-restore capability of the Knowledgebase is unusable**, for every page, every
version, via chat or direct tool call — a hard implementation bug, not an edge case. Content had to be
manually repaired via a fresh `kb_update_content` call instead, since restore cannot be used as a recovery
mechanism in its current state.

## Evidence

### Console / log

- Call 1: `redmineflux_helpdesk_kb_restore_version(version_id=1)` →
  `"Unexpected error restoring version. Please try again or contact support. (Error: TypeError:
  RedmineClient.post() missing 1 required positional argument: 'json')"`
- Call 2 (retry, identical input): same exact error text.
- `kb_get_page(project_id=12, page_id=1)` after both calls: `Content: TEMP-OVERWRITE-FOR-RESTORE-TEST`
  (unrestored).
- Manual recovery: `kb_update_content(project_id=12, page_id=1, content="Updated: Step 1: Download the client
  from the portal. Step 2: Log in with SSO.")` → `"Knowledgebase page #1 content updated."` (confirms
  `update_content` itself is fine; the defect is isolated to `restore_version`'s own call site).

## Duplicate check

- Duplicate found: No. Checked `bugs/_duplicates.md`/`bugs/_index.md` — no prior bug on `kb_restore_version` or
  this `RedmineClient.post()` missing-argument signature. Distinct from BUG-CRX-192 (filed same session,
  same KB tool group) — that bug is a false *denial* of a working tool (`kb_reorder_page`); this bug is a
  genuinely broken tool (`kb_restore_version`) that the agent could discover and attempt to call, but which
  fails server-side every time due to an implementation defect, not a discovery/denial issue.
