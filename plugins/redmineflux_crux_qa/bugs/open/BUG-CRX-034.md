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

## Production report

Reported to production as issue **#121332** (`ztflux`, Tracker Bug, Priority Medium, Defect Severity Medium-severity, Defect priority Medium, assigned to Prashant Chaurasia — user id 410), 2026-09-25. Textile description, no attachments. Linked to Run #569 "Crux QA Run 1", testcase #120491 (`CRUX_AGENT_WORKLOAD_CAPACITY.md`), Environment "Window 11 + Chrome" — testcase marked Failed.
