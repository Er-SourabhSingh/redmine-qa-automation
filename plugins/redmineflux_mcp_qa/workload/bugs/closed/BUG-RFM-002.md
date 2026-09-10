# Bug Report — CLOSED (Not a Bug)

> **Closed 2026-06-18** — Rejected as expected behavior. Calling `team_data` on a deleted team ID is invalid usage; the caller already knows the team was deleted. Same ruling as BUG-RFM-008.

- Bug ID: BUG-RFM-002
- Title: MCP `team_data` misreports HTTP 403 as "Server error (500)" for deleted team ID
- **Status: Closed — Not a Bug**
- Redmine version: Flux (dev-flux.zehntech.com)
- Plugin name: redmineflux_mcp (team management module)
- Plugin version: current
- Environment: dev-flux.zehntech.com
- Browser: N/A (MCP tool)
- User role: Admin
- Date: 2026-06-11

## Steps to reproduce

1. Using MCP, create a team: `team_create(name="Delete Test Team")` → team #28 created.
2. Using MCP, delete the team: `team_delete(team_id=28)` → responds "Team deleted successfully".
3. Using MCP, read the deleted team: `team_data(team_id=28)`.
4. Observe the MCP response.

## Expected result

- MCP `team_data` returns a clear "not found" or "team does not exist" message matching the actual HTTP status.

## Actual result

- MCP `team_data` returns:
  ```
  Server error (500): Internal Server Error
  ```
- The underlying REST API (`/rf_teams/38.json`) actually returns **HTTP 403 Forbidden** — the backend is correct.
- The bug is in the **MCP tool's error handling layer**: it receives a 403 from the server but reports it as "Server error (500)", which is misleading and incorrect.

## Evidence

- MCP `team_delete(team_id=38)` → `"Team deleted successfully"` ✓
- MCP `team_data(team_id=38)` → `"Server error (500): Internal Server Error"` ✗
- Raw REST `GET /rf_teams/38.json` (Playwright fetch) → **HTTP 403 Forbidden** (backend correct)
- Playwright confirms team is not visible in `/rf_teams` list

## Root Cause

The MCP tool error handler does not distinguish between HTTP status codes. Any non-2xx response from the backend is wrapped as "Server error (500)" regardless of the actual status (403, 404, etc.). The fix should pass through the real HTTP status and a meaningful message (e.g. "Team not found" for 404, "Access denied" for 403).

## Duplicate check

- Duplicate found: No
- Existing bug reference: BUG-RFM-004 (same MCP error-handler pattern, different endpoint)

---

## Retest — 2026-06-18

**Environment:** Local Docker (localhost:3006, MCP v0.2.2 ses_91426264e79b)

1. `team_create(name="Retest-002-DeleteTeam-2026-06-18")` → Team #3 created ✓
2. `team_delete(team_id=3)` → "Team deleted successfully" ✓
3. `team_data(team_id=3)` → `Server error (500): Internal Server Error` ✗

**Result: STILL OPEN.** Same 500 error on deleted team. No change in error handling.
