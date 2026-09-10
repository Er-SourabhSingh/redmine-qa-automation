# Bug Report

- Bug ID: BUG-RFM-009
- Title: MCP `team_data` does not return `created_by` or `created_on` fields
- Redmine version: Flux (dev-flux.zehntech.com)
- Plugin name: redmineflux_mcp (team management module)
- Plugin version: current
- Environment: dev-flux.zehntech.com
- Browser: Chromium (Playwright)
- User role: Admin
- Date: 2026-06-12
- Last Retested: 2026-06-17
- **Closed: 2026-06-18 — Not a bug. `created_by`/`created_on` are not fields accepted by MCP `team_create`; MCP not returning them is out of scope.**

## Steps to reproduce

1. Using MCP, create a team as admin: `team_create(name="BUG009 Retest Team")` → team #54 created.
2. Using MCP, read the team: `team_data(team_id=54)`.
3. Navigate to `/rf_teams/54` in the browser.
4. Compare fields returned by MCP vs fields shown in the UI.

## Expected result

- MCP `team_data` should include a `created_by` field showing the name of the user who created the team.
- MCP `team_data` should include a `created_on` field showing the creation timestamp.
- Both fields are present in the database (UI reads them correctly).

## Actual result

**MCP `team_data(54)` response — both fields missing:**
```
Team: BUG009 Retest Team (#54)
  Your role: Member
  ✓ Can manage workloads
  ✓ Can approve leaves

Members (1):
  #683 Sourabh Singh | Role: None [WL,AL]

Workloads (0):
```
Neither `created_by` nor `created_on` is returned.

**UI team detail page (`/rf_teams/54`) — both fields present:**
```
BUG009 Retest Team
Created on: 17.06.2026 12:42   ✓ shown
Created by: Sourabh Singh      ✓ shown
```

## Missing fields summary

| Field | UI (`/rf_teams/:id`) | MCP `team_data` |
|-------|----------------------|-----------------|
| `created_by` | ✓ Sourabh Singh | ✗ Missing |
| `created_on` | ✓ 17.06.2026 12:42 | ✗ Missing |

## Retest history

| Date | Team Used | MCP created_by | MCP created_on | UI created_by | UI created_on | Result |
|------|-----------|----------------|----------------|---------------|---------------|--------|
| 2026-06-12 | #39 Bug-Check Author Team | ✗ Missing | ✗ Missing | ✗ Missing | ✓ Present | FAIL |
| 2026-06-17 | #54 BUG009 Retest Team | ✗ Missing | ✗ Missing | ✓ Fixed | ✓ Present | UI FIXED, MCP STILL OPEN |

## Scope update (2026-06-17)

The UI team detail page now correctly shows both "Created by" and "Created on" — that part is **fixed**.

The bug now applies **only to MCP `team_data`** — both fields are still absent from the MCP response even though the server has the data.

## Root cause

The `team_data` MCP tool does not include `created_by` and `created_on` in its response serialization. The data exists on the server (the UI reads it correctly from the same record). The fix is to add these two fields to the MCP tool's response formatter.

## Duplicate check

- Duplicate found: No
- Existing bug reference: N/A

---

## Retest — 2026-06-18

**Environment:** Local Docker (localhost:3006, MCP v0.2.2 ses_91426264e79b)

1. `team_create(name="Retest-009-AuthorCheck-2026-06-18")` → Team #4 created ✓
2. `team_data(team_id=4)` response:
   ```
   Team: Retest-009-AuthorCheck-2026-06-18 (#4)
     Your role: Member
     ✓ Can manage workloads
     ✓ Can approve leaves
   Members (1):
     #1 Redmine Admin | Role: None [WL,AL]
   Workloads (0):
   ```

Neither `created_by` nor `created_on` present in the response.

**Result: STILL OPEN.** Both fields still missing from MCP `team_data` response.

---

## Retest — 2026-06-18 (3rd retest)

**Environment:** Local Docker (localhost:3006)

1. `team_create(name="Retest-009-AuthorCheck-2026-06-18-B")` → Team #10 created ✓
2. `team_data(team_id=10)` response:
   ```
   Team: Retest-009-AuthorCheck-2026-06-18-B (#10)
     Your role: Member
     ✓ Can manage workloads
     ✓ Can approve leaves
   Members (1):
     #1 Redmine Admin | Role: None [WL,AL]
   Workloads (0):
   ```

Neither `created_by` nor `created_on` present in the response.

**Result: STILL OPEN.** Both fields still missing from MCP `team_data` response.

---

## Closure — 2026-06-18

`created_by` and `created_on` are not fields accepted by MCP `team_create`. Per QA scope rules, MCP `show` not returning a field is only a bug if MCP `create` accepted that field. Since `team_create` never takes `created_by`/`created_on` as input, their absence from `team_data` is out of scope. **Closed as Not a Bug.**
