# Bug Report Template

- Bug ID: BUG-CRX-124
- Production Redmine Issue ID: #126696
- Title: Time Agent's Timesheet Team Update Member proposal consistently resolves the requested role "Manager" to "Developer" instead — reproduced 2/2 with different phrasings, Team and User both correct
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Time Agent)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: `admin`
- Date: 2026-10-30

## Steps to reproduce

1. As `admin`, with team "Crux Team Test" (ID 4) having a member "Sage Willow" (real Redmine user ID 18, current role Reporter), in a chat pinned to the Time Agent, ask: "In team 4, change user ID 18's (Sage Willow's) role to Manager."
2. Inspect the proposed `Timesheet Team Update Member` write's confirm table before clicking Confirm.
3. Cancel, then retry with different phrasing: "Update team 4's member with user ID 18 so that their role becomes Manager."
4. Inspect the second proposal's confirm table.

## Expected result

- Both proposals should show `Role: Manager` (Redmine role ID 4, confirmed via `/roles`: Developer=3, Manager=4, Reporter=5).

## Actual result

- **Both attempts** showed **`Role: Developer`** in the confirm table, not "Manager" — despite `Team: Crux Team Test` and `User: 18` both being correct in every attempt. This reproduced identically (2/2) across two different phrasings of the same request, ruling out a one-off parsing fluke tied to specific wording.
- Neither proposal was confirmed/executed (both cancelled by the tester once the mismatch was spotted), so no bad write reached the database — but had either been confirmed (the normal user flow, since nothing in the agent's own "I'll do this — confirm?" framing suggested anything was wrong), Sage Willow's role would have been silently set to Developer instead of the requested Manager.
- This is a third distinct ID/value-resolution defect found in this same testing pass on the Team Update Member flow (after BUG-CRX-122's wrong team ID and BUG-CRX-123's wrong user), but isolated to the **role value** specifically this time, with team and user both resolved correctly — suggesting the tool's role-name-to-role-ID mapping itself may be hardcoded or defaulting incorrectly, rather than every field in this flow being generally unreliable.

## Evidence

### Console / log

- Attempt 1 confirm table: `Team: Crux Team Test`, `User: 18`, `Role: Developer` (requested: Manager).
- Attempt 2 (different phrasing) confirm table: `Team: Crux Team Test`, `User: 18`, `Role: Developer` (requested: Manager) — identical wrong result.
- Native role ID mapping confirmed via `/roles`: Developer = role ID 3, Manager = role ID 4, Reporter = role ID 5.

## Duplicate check

- Duplicate found: No new root cause — related to BUG-CRX-122 and BUG-CRX-123 (all three surfaced from the same Team Update Member testing pass, on the same team/user) but each isolates a different field (team ID, user ID, role value respectively) and none share a demonstrated common cause. Kept as its own bug per the one-bug-per-concrete-finding convention.
