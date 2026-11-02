# Bug Report Template

- Bug ID: BUG-CRX-122
- Production Redmine Issue ID: #126694
- Title: Time Agent resolves "Crux Team Test" to a stale, already-deleted team ID (2) instead of its real, just-created ID (4) when adding a member — wrong-team-ID resolution confirmed via direct ID comparison before the write was ever confirmed
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Time Agent)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: `admin`
- Date: 2026-10-30

## Steps to reproduce

1. As `admin`, in a chat pinned to the Time Agent, ask: "Please make a new timesheet team called 'Crux Team Test'." Confirm the proposed `Timesheet Team Create` write.
2. Note the "created" confirmation's real team ID (in this run: "✓ Team 'Crux Team Test' created (ID: 4)." — confirmed accurate on `/timesheet/teams`, which at the time of this test showed exactly 2 teams: "Crux Team Test" at `/timesheet/teams/4` and "Retest Squad" at `/timesheet/teams/1`; team ID 2, an earlier disposable test team from this same session, had already been deleted).
3. In the same chat, immediately ask: "Add Sage Willow to the 'Crux Team Test' team with role Reporter."
4. Inspect the proposed `Timesheet Team Add Members` write's confirm table **before** clicking Confirm.

## Expected result

- The proposed write should target team ID 4 (the real, just-created "Crux Team Test"), matching the team the agent itself had just reported creating one turn earlier in the same chat.

## Actual result

- The confirm table showed **`Team: 2`** — not 4. Team ID 2 ("Delete-Test Team," an earlier disposable team from this same session) had already been deleted and did not exist on `/timesheet/teams` at the time of this proposal. The proposed write was never confirmed/executed (cancelled by the tester once the mismatch was spotted), so no bad write reached the database — but had it been confirmed blindly (the normal user flow, since the agent itself had just reported the correct ID moments earlier and gave no reason to suspect a mismatch), it would have either failed outright (team 2 no longer exists) or, in a deployment where IDs get reused, silently written to the wrong record.
- The user-resolution half of the same proposal was correct: `User Ids: 18` genuinely matches Sage Willow's real Redmine user ID (verified via `/users/18/edit`, login `sage.willow`). This isolates the defect specifically to team-ID resolution, not a broader resolution failure.
- This is the same defect shape as BUG-CRX-106 (Budget Agent silently guessing a wrong project ID), now confirmed on the Time Agent's team-member-add flow, and is especially concerning here because the correct ID had been stated by the agent itself in the immediately preceding turn of the same conversation — this is not a case of the agent never having the right information, it had it and used a different, stale value instead.

## Evidence

### Console / log

- Turn 1 response: "✓ Team 'Crux Team Test' created (ID: 4)." — confirmed accurate against `/timesheet/teams` (2 teams listed: ID 4 "Crux Team Test", ID 1 "Retest Squad"; no team with ID 2 exists).
- Turn 2 confirm table (quoted structure): `Team: 2`, `User Ids: 18`, `Role: Reporter` — `Team: 2` does not match any existing team; `User Ids: 18` independently verified correct.

## Duplicate check

- Duplicate found: No new root cause — same general class as **BUG-CRX-106** (Budget Agent, wrong project ID resolved silently with high confidence) but on a different domain agent (Time Agent) and a different entity (team ID, not project ID), and notably the first instance where the correct value was available in the SAME chat's own immediately preceding turn, ruling out "the agent never knew the right ID" as an explanation. Kept as its own bug per the one-bug-per-domain-defect rule, consistent with how BUG-CRX-106 itself was filed separately from the Testcase-Management domain's earlier instances of the same root-cause class (BUG-CRX-080/093/101).

## Retest — 2026-11-02 — NOT RETESTED (deferred — blocked by a separate, new team_create discovery failure)

Developer commits (CRC-72/73 range) pulled + containers restarted. Could not reproduce the original two-turn
repro (create a team, then immediately add a member) because `Timesheet Team Create` itself now fails with a
false "I'm encountering an issue discovering the team management tools... team_create may not be available"
denial — reproduced across 3 attempts (one reused chat, one "Ask again" retry, one fresh chat), each with
slightly different wording but the same underlying false denial. This blocks reconstructing this bug's specific
stale-ID trigger condition. As a substitute check (not the same repro), added a new member ("Willow Belle") to
the existing, real "Crux Team Test" (ID 4) in a fresh chat: the confirm card correctly showed `Team: Crux Team
Test` (resolved by name, not a raw ID this time) and `User Ids: 8` (independently verified correct — user 8 is
genuinely `willow.belle`) — no wrong-team-id substitution observed in this simpler case. Given the new
`team_create` regression blocks the original two-turn stale-ID repro, this bug's own verdict is left
**undetermined** — it may be fixed, but could not be confirmed under its original conditions this round. The new
`team_create` false-denial regression is noted here for follow-up but not filed as its own bug (overlaps the
already-documented discovery-flakiness class, e.g. BUG-CRX-117/123's first-attempt failures).
