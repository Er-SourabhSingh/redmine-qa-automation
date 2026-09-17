# Bug Report Template

- Bug ID: BUG-CRX-017
- Production Redmine Issue ID: #120704
- Title: Capacity Agent's bulk-member-removal falsely reports two real team members as "not currently members" — using their own login usernames right after listing those same usernames' display names as the team's current members
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux (Capacity Agent, Workload plugin domain)
- Plugin version: crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP)
- User role: `admin` (Redmine Administrator)
- Date: 2026-09-16

## Steps to reproduce

1. Create a team (e.g. "Platform Engineering") via chat.
2. Add two real users to it by their login usernames (e.g. "Workload, add luna.blossom to the Platform Engineering team as a member." then the same for "daisy.skye") — each succeeds and the agent's own confirmation shows their real display names (e.g. "Member added: #2 | User #5 Crux Manager", "Member added: #3 | User #6 Crux Reporter").
3. In the same session, ask to remove both by the same usernames used to add them: "Workload, remove luna.blossom and daisy.skye from the Platform Engineering team."
4. Observe the response.

## Expected result

- The agent should resolve "luna.blossom" and "daisy.skye" to the same two real members it just added under those exact usernames, and produce a `Workload Members Bulk Remove` (or per-member removal) confirm proposal targeting them.

## Actual result

- The agent responded with a false negative: "Neither luna.blossom nor daisy.skye are currently members of the Platform Engineering team, so there's nothing to remove. The team currently has only 3 members: Redmine Admin, Crux Manager, and Crux Reporter."
- This is internally self-contradictory: "Crux Manager" is luna.blossom's own Redmine display name, and "Crux Reporter" is daisy.skye's own Redmine display name — the exact same two users the agent had just added to this exact team using these exact usernames, moments earlier in the same chat session. The agent's own member-listing tool call correctly returned their display names, but its username-matching logic against the remove request failed to recognize "luna.blossom" as "Crux Manager" (or "daisy.skye" as "Crux Reporter"), so it concluded — falsely — that they were never added.
- Follow-up attempts referencing the members by their local team-member IDs ("#2 (Crux Manager / luna.blossom)") and by their raw Redmine user IDs ("user 5 and user 6") did not immediately fix it either — those instead triggered the separate self-contradictory "I described a change without actually proposing it" failure (tracked as BUG-CRX-013, reproduced here for the third distinct action type). Only a fourth rephrasing, dropping usernames/display-names entirely in favor of "bulk remove members with user IDs 5 and 6 from team ID 1", finally produced a correct confirm card and succeeded.
- **Impact**: a real user following the natural, obvious workflow — add someone by username, later remove them by the same username — is told the person was never a member at all, which is both confusing and simply incorrect. The workaround (raw numeric team-member or user IDs, in exactly the right phrasing) is not discoverable by a normal user without already knowing to avoid usernames for this specific action.

## Evidence

### Screenshot

Not captured — confirmed via live chat transcript text, cross-checked against the real `/rf_teams/1` member list at each step (2 members present before removal, 1 after).

### Console / log

```
C: Workload, add luna.blossom to the Platform Engineering team as a member.
-> asking the Capacity Agent...
I'll do this (Workload Member Add) -- confirm?
[confirmed] Member added: #2 | User #5 Crux Manager | Role: None

C: Workload, please add daisy.skye as a member of the Platform Engineering team.
-> asking the Capacity Agent...
I'll do this (Workload Member Add) -- confirm?
[confirmed] Member added: #3 | User #6 Crux Reporter | Role: None

C: Workload, remove luna.blossom and daisy.skye from the Platform Engineering team.
-> asking the Capacity Agent...
Neither luna.blossom nor daisy.skye are currently members of the Platform Engineering team, so there's
nothing to remove. The team currently has only 3 members: Redmine Admin, Crux Manager, and Crux Reporter.
Did you mean to remove different users, or did you want me to check a different team?
```

Real `/rf_teams/1` page immediately before this exchange: Members table showing 3 rows — Redmine Admin, and (per the team's own member-add history) Crux Manager and Crux Reporter, i.e. luna.blossom and daisy.skye.

Real `/rf_teams/1` page after the eventual successful bulk removal (via numeric IDs): Members table showing exactly 1 row — Redmine Admin only.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): — (related to, but distinct from, BUG-CRX-015's contact/lead by-name lookup false negatives in the CRM domain — this is the same class of username/display-name resolution failure, but in the Workload/Capacity domain's team-membership removal path specifically, and uniquely self-contradicts by naming the very members it claims don't exist)

## 2026-09-16 retest — STILL REPRODUCES, not fixed

Not part of today's `CHANGES.md` — no Workload/Capacity agent files (`agents/workload-capacity.md`) or related tool code were touched by this handoff.

**Retest:** Created a fresh team ("Retest Squad", #2), added `luna.blossom` as a member (confirmed: `✓ Member added: #5 | User #5 Crux Manager`), then in the same session asked `Workload, remove luna.blossom from the Retest Squad team.`

**Result:** Same self-contradictory pattern as the original bug: *"I don't see luna.blossom in the Retest Squad team members list. The current members are: Redmine Admin (ID 1, membership ID 1), Crux Manager (ID 5, membership ID not shown in detail)."* — "Crux Manager (ID 5)" is luna.blossom's own display name/user ID, the exact member just added under that username moments earlier.

**Verdict: NOT FIXED.** No change needed to this bug's status; remains open.

## Production report

Reported to production as issue **#120704** (`ztflux`, Tracker Bug, Priority Medium, assigned to Prashant Chaurasia — user id 410), 2026-09-16. Textile description, no attachments (per updated §4.3a policy). Linked to Run #569, testcase #120491 (`CRUX_AGENT_WORKLOAD_CAPACITY.md`, found via TC-CRX-096) — testcase marked Failed.
