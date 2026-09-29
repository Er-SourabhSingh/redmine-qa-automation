# Bug Report Template

- Bug ID: BUG-CRX-034
- Production Redmine Issue ID: #121332
- Title: Capacity Agent falsely claims Workload team-lifecycle/member-management tools (`team_create`, `member_remove`, `member_update`) aren't available in this deployment, contradicted by the real MCP server's own registered tool catalog
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux (Capacity Agent, Workload plugin domain)
- Plugin version: crux-core 0.92.0
- Environment: Local — `http://localhost:3014`, MCP `crux-redmine-docker-mcp-1`
- Browser: Chromium (Playwright MCP)
- User role: `admin` (Redmine Administrator)
- Date: 2026-09-25

## Steps to reproduce

1. In a fresh Ask Crux session, ask the Capacity Agent to create a team: "Workload, create a team called '<name>'."
2. Observe the response, then retry with a more direct follow-up: "Please create the team now."
3. Separately, in the same or a new session, ask it to remove an existing team member by username: "Workload, remove <username> from the <team> team." Retry with raw numeric IDs: "Remove team member with user ID <N> from team ID <M>."
4. In parallel, ask the same agent to do an unrelated Workload write in the same session (e.g. a leave-request create, or an allocation resize) to confirm the plugin as a whole is reachable.
5. Independently check `docker logs crux-redmine-docker-mcp-1` for the real MCP server's plugin-detection/tool-registration summary line.

## Expected result

- Team creation and member removal/update are real, documented Workload-domain write capabilities (they worked correctly earlier in this same engagement, e.g. BUG-CRX-017/019's original 2026-09-16 fixtures). If the agent genuinely cannot discover these specific tools in a given session, that would itself be a real regression worth surfacing accurately — but it must not be reported as a deployment-wide absence when the tools are in fact registered and available at the MCP-server layer.

## Actual result

- "Workload, create a team called 'Retest 017 Squad'." → *"It looks like the discovery didn't include the team creation tool... the team creation function is not available in this deployment... This means team creation is either not exposed via this API layer in your Redmineflux instance, or restricted to the web UI only."* Retried once more ("Please create the team now.") — same claim, same refusal.
- "Workload, remove luna.blossom from the Retest Squad team." → *"The member removal tool is not available in the discovered set... I cannot remove luna.blossom (Member #5) from Retest Squad because the member removal/update function is not exposed in this deployment's available tools."* Retried with raw numeric IDs ("Remove team member with user ID 5 from team ID 2.") — same claim, explicitly naming `member_remove`/`member_update` as absent.
- **These claims are false.** In the same session, `docker logs crux-redmine-docker-mcp-1` shows: `Loaded plugin: workload — 64 tools (Teams, workloads, allocations, leaves, holiday schemes, capacity reports (69 tools))` and `Redmineflux MCP v0.2.2: 459 tools (98 core + 359 plugin + 2 crux). Detected plugins: workload, ... (10/14).` — the Workload plugin and its 64 tools (which include team/member management, by the same naming convention as every other verified Workload tool in this engagement) are genuinely registered and loaded at the MCP-server layer. The refusal is not a real backend limitation; it is crux-core's own per-turn tool-discovery layer failing to surface these specific tools to the agent.
- **Not a total blackout of the Workload domain**: in the same session, the same agent successfully discovered and executed `Workload Leave Create` (real proposal, real confirm, real persisted leave record verified against `/rf_leaves`) and rendered a real `Workload Allocation Resize` proposal (a separate, pre-existing defect — BUG-CRX-018 — caused *that* write to fail, but the tool itself was discovered and invoked normally). So the gap is scoped specifically to team-lifecycle (`team_create`) and member-management (`member_remove`/`member_update`) tools, not the whole plugin.

## Evidence

### Screenshot

Not captured — confirmed via live chat transcript text plus `docker logs crux-redmine-docker-mcp-1`, which is the authoritative source for what the MCP server has actually registered (contradicting the agent's own claim).

### Console / log

```
C (admin): Workload, create a team called "Retest 017 Squad".
-> asking the Capacity Agent...
It looks like the discovery didn't include the team creation tool... the team creation function
is not available in this deployment... [same claim repeated on retry]

C: Workload, remove luna.blossom from the Retest Squad team.
-> asking the Capacity Agent...
The member removal tool is not available in the discovered set... I cannot remove luna.blossom
(Member #5) from Retest Squad because the member removal/update function is not exposed in this
deployment's available tools.

C: Remove team member with user ID 5 from team ID 2.
-> asking the Capacity Agent...
I don't have the member removal tool available in this deployment. The discovered workload tools
are limited to reads... and do not include the member_remove or member_update functions...

[docker logs crux-redmine-docker-mcp-1, same session]
INFO:redmineflux-mcp:Loaded plugin: workload -- 64 tools (Teams, workloads, allocations, leaves,
holiday schemes, capacity reports (69 tools))
INFO:redmineflux-mcp:Redmineflux MCP v0.2.2: 459 tools (98 core + 359 plugin + 2 crux). Detected
plugins: workload, knowledgebase, timesheet, testcases_management, agile, crm, budget_audit,
invoice, helpdesk, devops (10/14).

[Same session, contrast -- Leave Create worked normally]
C: Workload, create a leave request for luna.blossom from 2026-11-15 to 2026-11-16, leave type
sick, reason "Retest".
-> asking the Capacity Agent...
I'll do this (Workload Leave Create) -- confirm?
[real Confirm/Cancel buttons, confirmed]
"Leave created: #4 | Crux Manager | Sick Leave | 2026-11-15 -> 2026-11-16 (1.0 days) | Status: pending"
[verified real via /rf_leaves Team Approvals tab]
```

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): — Same general *shape* as the fabricated-capability-denial family (BUG-CRX-029, fixed; BUG-CRX-032, new) — an agent claiming a tool/capability doesn't exist when it demonstrably does — but this instance is objectively falsifiable against the real MCP tool catalog (not just against the session's own prior tool use), and is scoped to a specific pair of Workload-domain write tools rather than a whole-deployment claim. Found while attempting to retest BUG-CRX-017 (which remains open/unverifiable as a result — the original "false not-a-member" defect can no longer be reached because this defect blocks the flow earlier).

## 2026-09-28 retest — honesty improved, functional gap NOT fixed

Dev's fix (2026-09-28, `redmineflux-crux-core master @ e333a8e`): a capability-denial reply with no proposal now triggers one bounded retry pre-supplying the agent's own discoverable group's real tool schemas, falling back to an honest "couldn't confirm" message if the retry still finds nothing.

**Retested against the exact repro** (same "Retest Squad" team, luna.blossom still present): "Workload, remove luna.blossom from the Retest Squad team." → *"I apologize — I'm unable to access the member_remove tool at this moment. The tool group discovery isn't returning the workload management write tools..."* — this is the honest-degrade path the fix describes, not the original confident "not available in this deployment" claim, so the specific fabrication this bug reports (a confident false denial) is arguably improved.

**However, the functional defect persists**: 2 more retries (a plain rephrase, then raw numeric IDs) never produced a working `Workload Member Remove` proposal — both instead hit the unrelated BUG-CRX-013-style self-contradiction. Confirmed via `docker logs crux-redmine-docker-mcp-1` that the real MCP server still has all 64 workload tools genuinely registered right now, same as at the original finding — the tool genuinely exists and is available, but 3 consecutive attempts this session never got the agent to actually discover and use it.

**Verdict: wording/honesty improved, but the underlying capability-denial-on-a-real-tool defect is NOT resolved** — a user still cannot remove a team member via chat, and the retry mechanism does not appear to be reliably surfacing `member_remove` even though it's pre-suppliable from the agent's own already-allowed tool list per the dev's own description. Recommend keeping open; flag back to dev that the retry itself may not be firing/working as intended, since the fix's own stated design (pre-supply the agent's own real tool schemas) should make this close to 100% reliable for a tool the agent is already allowed to use.

## 2026-09-28 post-restart retest — NO CHANGE, confirms this is a real gap (not stale code)

Ran the same restart procedure as BUG-CRX-008/032/033 (`crux-core`/`crux-redmine` both restarted, OpenRouter re-provisioned, confirmed working). Unlike those three bugs, this retest reproduces the **same outcome** as the same-day pre-restart retest — ruling out stale code as the explanation here.

**Retest steps:** Same "Retest Squad" team/luna.blossom fixture, new chat session: "Workload, remove luna.blossom from the Retest Squad team." → agent worked through several real tool calls (`redmineflux_workload_members_list`, then attempted to load the workload tool group) but hit **"Stopped at the tool-call limit; the answer above may be partial."** before ever producing a `Workload Member Remove` proposal. Follow-up: "Please try again and remove luna.blossom from the Retest Squad team now." → **"I couldn't confirm whether this action is actually available here — please try again, or ask an administrator to check this deployment's tool configuration."** — the same honest-degrade wording already documented in the pre-restart retest above, not the original confident false denial.

**Verdict: NO CHANGE from the pre-restart retest.** The functional capability-denial gap (a user still cannot remove a team member via chat) persists identically post-restart, confirming this is a genuine unresolved defect rather than a stale-container artifact — unlike BUG-CRX-008/032/033, which all reversed after the restart. No correction needed to the production issue (#121332, currently Reopen/status_id=9) — that status remains accurate.

## 2026-09-28 second post-restart confirmation — dev asked to confirm fresh build; confirmed fresh, defect still reproduces

Dev's follow-up journal note (production #121332, 08:42:23Z) pointed out the previous retest's fallback wording ("I'm unable to access the member_remove tool at this moment...") didn't exactly match the fix's own hardcoded fallback string, and asked for explicit confirmation that (1) `redmineflux-crux-core` was fully replaced from the `Crux-QA-Updates` drop and (2) `crux-core` was actually restarted, before treating this as a fresh functional gap rather than a stale build.

**Confirmed fresh build, independently of any claim**: `docker ps` shows `crux-core` and `crux-redmine` both "Up about an hour" (this session's own restart, performed before this dev note was even read) — not a stale multi-day container. Re-ran the repro twice more in brand-new chat sessions:

1. `team_create` half (not separately retested in the prior post-restart pass): "Workload, create a team called 'Restart Confirm Squad'." → first attempt hit a transient `"I couldn't reach the tool server: MCP session expired (404) — reconnecting on next call"`; retried with "Please create the team now." → agent described what it *would* do (`create_team_or_skill`, resource_type "team", name "Restart Confirm Squad") but never actually produced a real proposal or Confirm/Cancel buttons — the same describe-without-proposing self-contradiction pattern as BUG-CRX-013.
2. `member_remove` half, same fixture, fresh session: "Workload, remove luna.blossom from the Retest Squad team." → agent again described what it *would* propose (Action, Membership ID 5, Team Retest Squad) without ever rendering a real proposal or Confirm/Cancel buttons.

Independently confirmed via `docker logs crux-redmine-docker-mcp-1` that the `workload` plugin is still genuinely loaded (`Detected plugins: agile, testcases_management, workload, ... (10/14)`) with live `GET /api/workload/*` calls succeeding — not a registration/connectivity problem.

**Verdict: confirmed fresh build (containers restarted this session, well after the dev's e333a8e commit), and the functional gap still reproduces** — on both `team_create` and `member_remove`, across 2 more fresh sessions. The exact fallback wording varies turn to turn (an "MCP session expired" transient, a describe-without-proposing self-contradiction, and the fix's own exact "I couldn't confirm..." string all seen across different attempts today) — but in every case, no working write proposal was ever produced for these two specific tools. This directly answers the dev's question: not a stale-build artifact.

## 2026-09-28 third confirmation — second independent restart, still reproduces

Per explicit user instruction ("restart docker server and retest them again"), checked Downloads for a new drop-in first (an item named `redmineflux-mcp 5` appeared, but a full recursive diff against the currently-deployed `redmineflux-mcp` source showed it byte-identical — not a real update, no `Crux-QA-Updates` folder present). Rebuilt the mcp image (all layers cached, confirming no source changes) and restarted `crux-core`/`crux-redmine` again — a second, independent restart beyond the one earlier today. `docker ps` confirmed both containers freshly up. Notably, this time crux-core's OpenRouter provider/key survived the restart intact (unlike the earlier restart today) — verified still genuinely working via "Check remaining credit" ($4.53/$5.00).

**Retest, fresh chat session**: "Workload, remove luna.blossom from the Retest Squad team." → agent worked through tool calls, then produced a **plain-text description** of the removal ("Proposal: Remove luna.blossom from Retest Squad... Would you like me to proceed with this removal?") — not a real Confirm/Cancel proposal card. Replied "Yes, proceed." → *"I apologize for the difficulty. The tool discovery for member removal is not returning the write tools I need. Unfortunately, the `member_remove` write tool is not currently available in my toolset without successful discovery, and I cannot proceed with the removal."*

Independently confirmed via `docker logs crux-redmine-docker-mcp-1` that live `GET /api/workload/*` calls are succeeding right now (not a connectivity/registration problem).

**Verdict: confirmed on a second, independent fresh restart — still reproduces.** Three consecutive fresh-session attempts today (tool-call-limit abort, honest "couldn't confirm" fallback, and now a describe-without-proposing self-contradiction) have each hit a different specific failure shape, but none has ever produced a real, working `Workload Member Remove` proposal. This rules out any remaining stale-build explanation.

## Production report

Reported to production as issue **#121332** (`ztflux`, Tracker Bug, Priority Medium, Defect Severity Medium-severity, Defect priority Medium, assigned to Prashant Chaurasia — user id 410), 2026-09-25. Textile description, no attachments. Linked to Run #569 "Crux QA Run 1", testcase #120491 (`CRUX_AGENT_WORKLOAD_CAPACITY.md`), Environment "Window 11 + Chrome" — testcase marked Failed.
