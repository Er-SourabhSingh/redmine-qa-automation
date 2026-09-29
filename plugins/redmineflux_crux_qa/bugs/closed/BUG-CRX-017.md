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

## 2026-09-25 retest — BLOCKED, original repro not reachable; a different, new defect surfaced instead

Reused the existing "Retest Squad" team (#2, already has luna.blossom/"Crux Manager" as member #5 from the 2026-09-16 fixture) as `admin`. Sent the exact original repro: "Workload, remove luna.blossom from the Retest Squad team."

**Result:** unlike the original bug (a false "not currently a member" claim), the agent this time correctly identified luna.blossom as "Member #5" but refused outright: *"The member removal tool is not available in the discovered set. The workload group tools returned are read-only... I cannot remove luna.blossom (Member #5) from Retest Squad because the member removal/update function is not exposed in this deployment's available tools."* Retried with raw numeric IDs ("Remove team member with user ID 5 from team ID 2.") — same refusal, explicitly naming `member_remove`/`member_update` as absent from the discovered tool set. A separate, unrelated attempt moments earlier ("Workload, create a team called...") got the identical shape of refusal for `create_team_or_skill`.

**This claim is false.** `docker logs crux-redmine-docker-mcp-1` (checked the same session) shows the real MCP server has `workload — 64 tools` registered and loaded (`Loaded plugin: workload — 64 tools ... Detected plugins: workload, ... (10/14)`) — team/member management writes are real, registered tools at the MCP-server layer. The refusal is crux-core's own per-turn tool-discovery layer returning an incomplete tool set for the Workload group's team-lifecycle/member-management tools specifically — not a genuine unavailability. (For contrast: in the same session, `Workload Leave Create` and `Workload Allocation Resize` — different Workload-domain tools — both discovered and worked/attempted normally, so this isn't a total blackout of the plugin, just these specific write tools.)

**Verdict: Cannot reproduce or rule out the original defect this session** — the flow never reaches the point where the original false "not a member" claim would occur, because a different, blocking defect (false capability-denial on `member_remove`/`team_create` specifically) stops it earlier in the same conversation turn. Recommend keeping BUG-CRX-017 open as-is (not provably fixed), and treating this session's finding as a new, separate candidate bug: crux-core's tool-discovery for Workload team-lifecycle/member-management tools incorrectly reports them absent, contradicted by the real MCP tool catalog — not yet filed, pending user decision alongside the other new findings from this sweep (Sales Agent false "no CRM tools", Invoicing Draft-only bypass).

## 2026-09-25 (continued) — dev's actual fix (username display) verified working

The blocked retest above never reached the point of testing the dev's real fix. Read the production journal (#120704) afterward: root cause was `members_list`/`search_members` never surfacing each member's login at all, only display name — so a caller who added someone by username had no way to recognize them again when trying to remove them the same way. Fix: both tools now show the login next to the name.

**Verified live:** "Workload, list the members of the Retest Squad team." → *"1. Member #4 | User #1 — Redmine Admin (admin) ... 2. Member #5 | User #5 — Crux Manager (luna.blossom) ... 3. Member #6 | User #8 — Crux Developer (crux.developer)"* — every member's login now shown in parentheses next to their display name, exactly matching the dev's described fix and directly addressing this bug's documented root cause (the agent previously had no way to match "luna.blossom" against "Crux Manager" because the login was never in the list it saw).

**Verdict: the specific, dev-documented fix for this bug's root cause is confirmed live.** Full end-to-end confirmation (successfully removing a member by username, start to finish) remains blocked — not by this bug's original defect, but by the separate, newly-found BUG-CRX-034 (Capacity Agent falsely denies the `member_remove` tool is available at all). Recommend closing this bug on the strength of the verified root-cause fix, with BUG-CRX-034 tracked separately as the new blocker.

## 2026-09-28 retest — dev's 034 fix improves honesty but doesn't resolve the underlying gap; still can't complete this bug's original repro

Dev's 2026-09-28 fix for BUG-CRX-034 (a bounded retry pre-supplying the agent's own discoverable tool schemas before falling back to an honest "couldn't confirm" message) is live. Retested this bug's exact repro on the same "Retest Squad" fixture (still 3 members, luna.blossom present as "Crux Manager").

"Workload, remove luna.blossom from the Retest Squad team." → *"I apologize — I'm unable to access the member_remove tool at this moment. The tool group discovery isn't returning the workload management write tools (like member_remove)... Ensure the workload management tools are available in this deployment, or remove the member through the Redmineflux UI directly."* (2 real tool calls per `Sources (2)`).

This is an improvement in honesty over BUG-CRX-034's original finding — no longer a confident, unhedged "not available in this deployment" claim — but the practical outcome is unchanged: retried with "Please remove luna.blossom..." (hit the BUG-CRX-013-style self-contradiction) and with raw numeric IDs ("Remove team member with user ID 5 from team ID 2.") — same self-contradiction. **No successful proposal was ever produced across 3 attempts.**

Independently confirmed via `docker logs crux-redmine-docker-mcp-1` that the real MCP server still has all 64 workload tools genuinely registered right now (`Loaded plugin: workload — 64 tools`), same as during the original finding — so this remains a discovery-mechanism gap, not a real backend absence.

**Verdict: this bug's original repro (false "not currently a member" claim) still cannot be reached** — the flow is blocked earlier by the same class of issue BUG-CRX-034 documents, and that fix's retry mechanism did not actually surface `member_remove` to the model in 3 separate attempts this session, despite the tool being genuinely registered. Recommend keeping this bug open, and updating BUG-CRX-034 to reflect that its fix only improved the failure's honesty, not its underlying functionality.

## 2026-09-28 post-restart retest — still blocked by BUG-CRX-034, confirmed not stale code

Restarted `crux-core`/`crux-redmine` properly (same procedure as BUG-CRX-008/032/033/034) to rule out stale code before re-attempting this bug's own repro. Re-ran BUG-CRX-034's identical blocking flow directly (same "Retest Squad" team, luna.blossom/"Crux Manager" fixture, new session): "Workload, remove luna.blossom from the Retest Squad team." → hit a tool-call-limit abort mid-discovery, then on retry the honest-degrade message ("I couldn't confirm whether this action is actually available here..."). See BUG-CRX-034's matching 2026-09-28 post-restart section for the full transcript — this is the same flow this bug's own repro depends on, so it was not repeated a third time.

**Verdict: still blocked, no change.** Unlike BUG-CRX-008/032/033 (all of which reversed post-restart, proving those were stale-code artifacts), BUG-CRX-034's blocking gap persists identically after a proper restart — so this bug's original repro (the false "not currently a member" claim) remains unreachable for the same genuine, non-stale reason as the pre-restart retest. No status change from the 2026-09-25 recommendation: keep open, blocked by BUG-CRX-034.

## 2026-09-28 second confirmation — dev's fresh-build question answered, still blocked

Production #120704 has its own journal entry (611925) from the earlier post-restart retest, already noting the block. Since then, BUG-CRX-034's own production issue (#121332) got a follow-up from the dev (08:42:23Z) asking to confirm the retest ran against a genuinely fresh, restarted build before treating the finding as a real functional gap. Answered that directly on #121332 (see BUG-CRX-034's matching section) with two more fresh-session confirmations covering both `team_create` and `member_remove` — both still fail to produce a working proposal, and `docker ps` independently confirms the containers were restarted this session, not stale.

Since this bug's own original repro (false "not currently a member" claim) is gated entirely behind BUG-CRX-034's `member_remove` gap, that same confirmation applies here: still blocked, not a stale-build artifact.

## 2026-09-28 third confirmation — second independent restart, still blocked

Per explicit user instruction to restart and retest again, a second independent restart was performed (see BUG-CRX-034's matching section for full detail — no real update package found in Downloads, mcp image rebuild fully cached, `crux-core`/`crux-redmine` restarted again, OpenRouter reconfirmed working). The blocking flow (`Workload, remove luna.blossom from the Retest Squad team.`) was retested fresh and again failed to produce a real `Workload Member Remove` proposal — this time via a describe-without-proposing self-contradiction rather than the earlier tool-call-limit or honest-fallback shapes.

**Verdict: still blocked, third consecutive confirmation today.** This bug's own original repro (false "not currently a member" claim) remains unreachable — not from stale code, but because BUG-CRX-034's `member_remove` discovery gap genuinely persists across three independent fresh-session attempts, two of them following separate restarts.

## 2026-09-29 retest — still blocked, dev's real fix (5ea35e3) pulled and confirmed loaded but BUG-CRX-034's gap persists

Dev's 2026-09-28 journal on #121332 explicitly asked to retest this bug's own original scenario ("add by username, remove by the same username") now that the path should be clear, per a second-layer fix (commit `5ea35e3`) shipped for the `member_remove` discovery gap. See BUG-CRX-034's matching 2026-09-29 section for the full process finding: the local `redmineflux-crux-core` git checkout was still on the pre-fix commit `dd29656` going into this session (every prior restart-only retest was running stale source, not just a stale process) — `git pull origin master` brought it to `5ea35e3`, confirmed genuinely loaded in the running container via a direct `grep` inside it.

Re-ran BUG-CRX-034's blocking flow fresh against this confirmed-loaded fix: still no working `Workload Member Remove` proposal — first attempt hit a tool-call-limit abort, retry produced a fresh confident false capability denial. Since this bug's own original repro (add luna.blossom/daisy.skye by username, then remove by the same usernames) requires `member_remove` to actually work at all before the username-matching behavior this bug reports can even be observed, it remains unreachable.

**Verdict: still blocked.** Not attempted again as its own independent repro this session, since BUG-CRX-034's blocking gap is confirmed to persist with the real fix loaded — no point re-running this bug's specific scenario until that's cleared.

## 2026-09-29 (continued) — original repro fully re-run, CONFIRMED FIXED now that BUG-CRX-034's blocking gap is resolved

BUG-CRX-034 was root-caused to a missing deployment config (`CRUX_DISCOVERY_WRITE_GROUPS` unset on this QA stack — see BUG-CRX-034's matching section), now fixed permanently (dev-confirmed, `docker-compose.yml`/`.env` updated, `crux-core` recreated). With `member_remove` now genuinely reachable, re-ran this bug's own original scenario directly (not just the blocking flow) — same "Retest Squad" fixture, luna.blossom present as Member #5/"Crux Manager" from the original 2026-09-16 fixture, never removed since.

"Capacity Agent, remove luna.blossom from the Retest Squad team." → **correctly resolved by username on the first attempt**: *"Found Member #5 (User #5 Crux Manager, luna.blossom) in the Retest Squad team. Confirm removal: I'm about to remove Crux Manager (Member #5, luna.blossom) from the Retest Squad team. Is this correct?"* — no false "not currently a member" claim, exactly the behavior this bug's Expected Result section calls for. (Confirming the write itself then hit BUG-CRX-013's unrelated self-contradiction pattern 2 more times before a working proposal rendered — tracked separately, not this bug's defect.) Once a real `Workload Member Remove` proposal appeared and was confirmed, **independently verified via the native `/rf_teams/2` page**: "Retest Squad" now genuinely shows 2 members (Admin, Crux Developer) — luna.blossom genuinely removed from the real backend.

**Verdict: CONFIRMED FIXED.** The username-matching defect this bug reports (agent unable to recognize "luna.blossom" as the member it had just added/would remove) does not reproduce — the dev's 2026-09-25 fix (showing login alongside display name in `members_list`/`search_members`) is confirmed working end-to-end, not just at the listing level. **Closing this bug.**

## Production report

Reported to production as issue **#120704** (`ztflux`, Tracker Bug, Priority Medium, assigned to Prashant Chaurasia — user id 410), 2026-09-16. Textile description, no attachments (per updated §4.3a policy). Linked to Run #569, testcase #120491 (`CRUX_AGENT_WORKLOAD_CAPACITY.md`, found via TC-CRX-092) — testcase marked Failed.
