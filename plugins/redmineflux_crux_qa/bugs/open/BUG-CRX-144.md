# Bug Report Template

- Bug ID: BUG-CRX-144
- Production Redmine Issue ID:
- Title: Capacity Agent falsely claims team/member-management tools "aren't available in my current toolset"
  and that "discovery isn't finding the expected group" — a regression of the historical BUG-CRX-034 defect
  class — reproduced specifically in a chat with several prior turns, not in a fresh chat's first message
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Capacity Agent) / redmineflux_workload (native plugin)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-03

## Steps to reproduce

1. In a single chat, Capacity Agent pinned, run a sequence of several real read-tool calls first — e.g. "What
   teams exist?" → "Show me the Crux Capacity Agent Test Team." → "Show me the Gantt for the Crux Capacity
   Sprint 1 workload." → "Any scheduling conflicts on that workload?" → "Who's on leave today?" → "List the
   members of the Crux Capacity Agent Test Team with their member IDs." (all genuinely static, always-allowed
   tools per the agent's own manifest).
2. In the same, now-several-turns-deep chat: "Update member 11 on the Crux Capacity Agent Test Team to enable
   manage workload." (requires `member_update`, a tool listed in the persona's own manifest as reachable only
   via `crux_discover_tool_groups` → `crux_discover_group_tools(group="workload")` — NOT one of the 27
   statically-allowed tools).
3. The agent first responds with fabricated prose proposing the change but no real Confirm button (see
   BUG-CRX-142 — same defect class, now also reproduced on the Capacity Agent). Reply "Yes, confirm." to push
   past that.

## Expected result

Per the persona file's own explicit instruction ("For anything beyond your everyday list... call
`crux_discover_tool_groups` then `crux_discover_group_tools` with group `workload` first (one call restores
all of them, reads and writes together)... Every one is a real, callable tool once discovered... Only refuse
once discovery has confirmed nothing exists"), `member_update` should be discovered and called successfully —
it is a real, implemented tool (`redmineflux_workload_member_update` in `workload.py`).

## Actual result

After "Yes, confirm.", the agent responded: *"I apologize — I'm unable to load the member update tool needed
to complete this change. The member management tools aren't available in my current toolset, and discovery
isn't finding the expected group. You'll need to make this permission update directly in the Redmineflux
admin interface or contact your system administrator."*

This is factually false — `member_update` is a real tool, genuinely implemented and registered server-side.
This is the exact historical defect shape already documented and closed as **BUG-CRX-034** ("Capacity Agent
falsely claims Workload team-lifecycle/member-management tools aren't available in this deployment,
contradicted by the real MCP tool catalog") — reproducing here as a regression.

**Context-dependence confirmed**: the identical request ("Update member 11 on the Crux Capacity Agent Test
Team to enable manage workload.") was retried immediately afterward in a **fresh chat, first message**, and
succeeded cleanly — correct discovery, correct confirm card (`Team`, `Membership: Daisy Skye`, `Manage
Workload: True`), correct result (*"✓ Member updated: #11 | Daisy Skye | manage_workload=True,
can_approve_leave=False"*). The failure is therefore not a permanent tool-catalog gap but appears tied to
chat length/turn depth — the same general "later-turn state corruption" shape as the already-documented
context-carryover defects on other domains this cycle (BUG-CRX-080/093/101/133 wrong-project-resolution family,
BUG-CRX-140 identifier-corruption family on the KB Agent) — here manifesting as the tool-discovery mechanism
itself apparently failing or not being re-attempted correctly once several prior turns have already used up
part of the agent's available tool-call budget in that chat.

## Evidence

### Console / log

- Failing attempt (6th+ turn in an established chat, verbatim): *"I apologize — I'm unable to load the member
  update tool needed to complete this change. The member management tools aren't available in my current
  toolset, and discovery isn't finding the expected group. You'll need to make this permission update directly
  in the Redmineflux admin interface or contact your system administrator."*
- Successful retry (fresh chat, first message, verbatim): confirm card `Team: Crux Capacity Agent Test Team
  (#7)`, `Membership: Daisy Skye (now Reporter)`, `Manage Workload: True` → *"✓ Member updated: #11 | Daisy
  Skye | manage_workload=True, can_approve_leave=False."*

## Duplicate check

- Duplicate found: No new root cause filed as a separate class from the historical, closed **BUG-CRX-034** —
  this is an explicit regression of that exact defect shape (false claim that real team/member-management
  tools "aren't available"). Kept as its own bug (not reopening the closed BUG-CRX-034) per this repo's
  convention of filing fresh regressions as new bug numbers, with the added nuance — not previously documented
  on BUG-CRX-034 — that the failure is context/chat-length-dependent, not a permanent unavailability.
