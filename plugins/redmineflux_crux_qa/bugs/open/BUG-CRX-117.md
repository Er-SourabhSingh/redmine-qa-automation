# Bug Report Template

- Bug ID: BUG-CRX-117
- Production Redmine Issue ID: #126687
- Title: Time Agent cannot delete a Timesheet approval schema via chat at all — reproduced 2/2 with two different failure modes, despite the underlying `schema_delete` MCP tool existing
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Time Agent)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: `admin`
- Date: 2026-10-30

## Steps to reproduce

1. As `admin`, in a chat pinned to the Time Agent, with at least one disposable approval schema already existing (e.g. "Crux No-Level Schema", ID 3), ask: "Delete the approval schema 'Crux No-Level Schema'."
2. Observe the response (no confirmable proposal is produced).
3. In the same chat, retry with a simpler phrasing: "Please delete schema ID 3."
4. Observe the response again.

## Expected result

- The Time Agent should propose a `Timesheet Schema Delete` write (consistent with how `Timesheet Schema Create`, `Timesheet Schema Update`, and `Timesheet Toggle Schema Active` all worked cleanly earlier in the same session), present a Confirm/Cancel gate, and delete the schema on confirmation — or, if deletion is genuinely out of scope for this agent, say so consistently and immediately rather than attempting and failing.

## Actual result

- **Attempt 1** ("Delete the approval schema..."): the agent responded: *"I apologize — I'm unable to load the schema delete tool from the available discovery groups. The schema management tools (including `schema_delete`) are beyond my current tool list and the discovery mechanism isn't returning the correct group name."* Cost: 65,075 input tokens / 498 output tokens / $0.02, for zero actual action.
- **Attempt 2** ("Please delete schema ID 3."): a different, equally non-actionable failure: *"I described a change without actually proposing it, so there's nothing to confirm yet — please tell me again exactly what to change and I'll make it a real, confirmable proposal."* Cost: 53,563 input tokens / 326 output tokens / $0.01, again zero action.
- In both cases, the schema was **not** deleted (confirmed still present on `/approval_schemas`). The tool `redmineflux_timesheet_schema_delete` genuinely exists in the MCP server's tool list — this is not a case of the capability not existing, but of the Time Agent's own tool-discovery/dispatch mechanism never successfully reaching it. This is a confirmed, reproducible (2/2) functional gap: schema deletion is advertised/plausible but effectively unusable via chat.

## Evidence

### Console / log

- Attempt 1 response text quoted above verbatim, 65,075 in / 498 out / $0.02.
- Attempt 2 response text quoted above verbatim, 53,563 in / 326 out / $0.01.
- Schema ID 3 confirmed still present (undeleted) on `/approval_schemas` after both attempts.

## Duplicate check

- Duplicate found: No — this is a new, previously untested capability (schema delete) failing on its own distinct mechanism (tool-discovery dispatch failure), not a recurrence of an existing filed defect class.
