# Bug Report

- Bug ID: BUG-RFM-003
- Title: `member_update` and `member_add` accept `role` parameter but do not apply it
- Redmine version: Flux (dev-flux.zehntech.com)
- Plugin name: redmineflux_mcp (team management module)
- Plugin version: current
- Environment: dev-flux.zehntech.com
- Browser: Chromium (Playwright for verification)
- User role: Admin
- Date: 2026-06-11
- **Status: CLOSED — Fixed (verified 2026-06-12)**

## Steps to reproduce (original)

### Reproduce via member_update:
1. Add a user to a team: `member_add(team_id=27, user_id=14)` → membership #347 created, Role: None.
2. Update the role: `member_update(team_id=27, membership_id=347, role="Role - Team Lead")` → responds "Member updated: #347 | Ajay Joshi | manage_workload=False, can_approve_leave=False".
3. Verify via MCP: `team_data(team_id=27)` → shows `Ajay Joshi | Role: None`.
4. Verify via Playwright: navigate to `/rf_teams/27` → Role column for Ajay Joshi shows "-".

### Reproduce via member_add:
1. Add a user with role: `member_add(team_id=27, user_id=347, role="Role - Team Lead")`.
2. Observe the MCP response: `"Member added: #348 | User #347 Aditi Jain | Role: None"`.
3. Verify via Playwright: navigate to `/rf_teams/27` → Role column for Aditi Jain shows "-".

## Actual result (at time of filing)

- Both tools silently accepted and ignored the `role` (string) parameter.
- `team_data` and Playwright both confirmed role remained None / "-".

## Retest — 2026-06-12 — FIXED

The MCP tool schema changed: `role` (string) → `role_id` (integer).

**member_update retest:**
- `member_update(team_id=27, membership_id=347, role_id=5)` → "Member updated: #347 | Ajay Joshi | manage_workload=False, can_approve_leave=False"
- `team_data(team_id=27)` → `#14 Ajay Joshi | Role: Role - QA Tester` ✓ — role applied

**member_add retest:**
- Created temp team #33, then `member_add(team_id=33, user_id=14, role_id=13)` → "Member added: #368 | User #14 Ajay Joshi | Role: Role - Team Lead" ✓ — role applied at creation
- Temp team #33 deleted after verification.

**Result: FIXED** — `role_id` (integer) parameter correctly applies the role in both `member_add` and `member_update`. The original test used `role` (string) which was an incorrect parameter name.

## Affected TCs

- TC-RFM-030: PASS (retest) — `member_update` with role_id now applies role
- TC-RFM-031: PASS (retest) — `member_add` with role_id now assigns role at creation
- TC-RFM-034: PASS (retest)

## Duplicate check

- Duplicate found: No
- Existing bug reference: N/A
