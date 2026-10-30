# Bug Report Template

- Bug ID: BUG-CRX-123
- Production Redmine Issue ID: #126695
- Title: Time Agent resolves "Sage Willow" to the wrong user entirely (luna.blossom, ID 5, a different team's member) instead of Sage Willow's real user ID (18) when updating a team member's role
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Time Agent)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: `admin`
- Date: 2026-10-30

## Steps to reproduce

1. As `admin`, with team "Crux Team Test" (ID 4) having a member "Sage Willow" (real Redmine user ID 18, login `sage.willow`, role Reporter — added two turns earlier in the same chat via a confirmed `Timesheet Team Add Members` write), in a chat pinned to the Time Agent, ask: "In team 4, change Sage Willow's role from Reporter to Manager."
2. On the first attempt, the agent failed with a discovery-group error (see Evidence) — retried via "Ask again."
3. On the second attempt, inspect the proposed `Timesheet Team Update Member` write's confirm table **before** clicking Confirm.

## Expected result

- The proposed write should target Sage Willow's real user ID (18) — the same user the agent itself had just added to this exact team two turns earlier in the same conversation.

## Actual result

- The confirm table showed **`User: 5`** — not 18. User ID 5 is **Luna Blossom** (`luna.blossom`), a completely different person who is a member of a different team ("Retest Squad") used extensively elsewhere in this same QA session, not a member of "Crux Team Test" at all. The write was never confirmed/executed (cancelled by the tester once the mismatch was spotted), so no bad write reached the database — but had it been confirmed, it would have changed Luna Blossom's role in a team she isn't even a member of (likely erroring, or worse, silently creating/altering an unintended membership record), while leaving Sage Willow's role in "Crux Team Test" completely untouched, contrary to what the user asked for and what the agent claimed it would do.
- This is a different, more severe variant of BUG-CRX-122 (wrong TEAM ID): here the **team ID resolved correctly** (`Team: Crux Team Test`), but the **user identity itself** was resolved to an entirely unrelated person from a different context the same long-running chat session had touched earlier — suggesting the agent's name-to-ID resolution step can bleed context from unrelated parts of the same conversation history rather than looking up the name fresh against the actual team's current membership.
- Also notable: this request required 2 attempts — the first failed with the same "discovery group isn't loading properly" class of error already seen in BUG-CRX-117 (schema delete) and the team-create/add-member flakiness noted during this same testing pass, reinforcing that tool-discovery for Timesheet team-management tools is broadly unreliable, not isolated to one specific tool.

## Evidence

### Console / log

- First attempt response: *"I apologize — I'm unable to access the team management tools I need to look up Sage Willow's membership ID in team 4 and propose the role change. The team configuration tools are in a discovery group that isn't loading properly for me at the moment. You may need to make this change through the Redmineflux web interface directly, or contact your Redmineflux administrator."*
- Second attempt (via "Ask again") confirm table: `Team: Crux Team Test`, `User: 5`, `Role: Manager`.
- Independently verified: Sage Willow's real user ID is 18 (`/users/18/edit`, login `sage.willow`); user ID 5 is Luna Blossom (`/users/5`, login `luna.blossom`), confirmed via this same session's earlier native-UI exploration of "Retest Squad"'s membership.

## Duplicate check

- Duplicate found: No new root cause filed as a separate class from BUG-CRX-122 — both are ID-resolution failures from the same test pass on the same team — but kept as its own bug because the failure mode is materially different and more severe: BUG-CRX-122 resolved to a stale but *plausible* team ID (a team that existed earlier in the session), whereas this resolves to a *completely unrelated person* from a different team's context, which could silently affect a bystander user's data rather than merely fail against a non-existent record. Also distinct from BUG-CRX-106 (Budget Agent/project ID) and BUG-CRX-117 (schema delete discovery failure) in both domain and entity type.
