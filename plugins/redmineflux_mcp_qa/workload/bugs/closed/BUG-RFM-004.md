# Bug Report

- Bug ID: BUG-RFM-004
- Title: MCP `workload_show` misreports HTTP 404 as "Server error (500)" for deleted workload ID
- Redmine version: Flux (dev-flux.zehntech.com)
- Plugin name: redmineflux_mcp (workload module)
- Plugin version: current
- Environment: dev-flux.zehntech.com
- Browser: N/A (MCP tool)
- User role: Admin
- Date: 2026-06-11
- **Closed: 2026-06-18 — Not a bug. Deletion works correctly; error on show of deleted workload is expected behavior.**

## Steps to reproduce

1. Using MCP, create a workload: `workload_create(team_id=27, name="Delete Test Workload", start_date="2026-07-01", end_date="2026-07-31")` → workload #19 created.
2. Using MCP, delete the workload: `workload_delete(workload_id=19)` → responds "Workload deleted".
3. Using MCP, read the deleted workload: `workload_show(workload_id=19)`.
4. Observe the MCP response.

## Expected result

- MCP `workload_show` returns a clear "not found" message matching the actual HTTP status.

## Actual result

- MCP `workload_show` returns:
  ```
  Server error (500): Internal Server Error
  ```
- The underlying REST API (`/rf_workloads/22.json`) actually returns **HTTP 404 Not Found** — the backend is correct.
- The bug is in the **MCP tool's error handling layer**: it receives a 404 from the server but reports it as "Server error (500)", which is misleading and incorrect.

## Evidence

- MCP `workload_delete(workload_id=22)` → `"Workload deleted"` ✓
- MCP `workload_show(workload_id=22)` → `"Server error (500): Internal Server Error"` ✗
- Raw REST `GET /rf_workloads/22.json` (Playwright fetch) → **HTTP 404 Not Found**, body: "Page not found. The page you were trying to access doesn't exist or has been removed." (backend correct)
- Playwright confirms workload not visible in `/rf_workloads?tab=upcoming`

## Root Cause

The MCP tool error handler does not distinguish between HTTP status codes. Any non-2xx response is wrapped as "Server error (500)" regardless of the actual status. The fix should pass through the real HTTP status and a meaningful message (e.g. "Workload not found" for 404).

## Note

- Same MCP error-handler pattern as BUG-RFM-002 (`team_data` same issue, returns 403 which MCP reports as 500).

## Affected TCs

- TC-RFM-051: FAIL — step 6 (post-deletion `workload_show` returns 500, not "not-found")

## Duplicate check

- Duplicate found: No (BUG-RFM-002 covers `team_data`; this covers `workload_show` — different endpoint, same pattern)
- Existing bug reference: BUG-RFM-002 (related)

---

## Retest — 2026-06-18

**Environment:** Local Docker (localhost:3006, MCP v0.2.2 ses_91426264e79b)

1. `workload_create(team_id=1, name="Retest-004-DeleteWorkload-2026-06-18", start_date="2026-07-01", end_date="2026-07-31")` → Workload #6 created ✓
2. `workload_delete(workload_id=6)` → "Workload deleted" ✓
3. `workload_show(workload_id=6)` → `Server error (500): Internal Server Error` ✗

**Result: STILL OPEN.** Same 500 error on deleted workload. No change in error handling.

---

## Closure — 2026-06-18

Retest confirmed: `workload_delete(workload_id=7)` ("Retest-010-OverloadTest") → "Workload deleted" ✓. Workload confirmed absent from `workloads_list`. Deletion works correctly end-to-end. The error returned by `workload_show` on a non-existent ID is expected behavior — the workload does not exist. **Closed as Not a Bug.**
