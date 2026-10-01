# Bug Report Template

- Bug ID: BUG-CRX-041
- Production Redmine Issue ID: #121827
- Title: Time Agent's `submit` doesn't auto-infer the team/project context from the user's own filled, unsubmitted time entries — instead demands a numeric team ID an ordinary team member has no legitimate way to discover, making "submit my timesheet" unusable end-to-end
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux (Time Agent, Timesheet plugin domain)
- Plugin version: crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP)
- User role: `daisy.skye` (Crux Reporter — team role "Reporter": holds `view_timesheets` + `use_ask_crux`, does NOT hold `manage_timesheet`)
- Date: 2026-09-29

## Steps to reproduce

1. As an ordinary team member (view-only, not a manager/admin), with a real logged, unsubmitted time entry for the current period.
2. In Ask Crux chat, ask naturally: "Time Agent, please submit my timesheet for this week." (no team ID mentioned — matching how a real end user would phrase it).
3. When the agent asks for a `context type` and numeric `context ID`, respond naturally by team **name**: "It's for my team, 'Retest Squad'."
4. When the agent says it can't resolve the name and needs the numeric ID, try asking it to infer the team from the user's own membership instead: "I don't know the ID. I'm only on one team — can you figure out which team that is?"
5. Separately, as this same user, try to find the team's numeric ID anywhere in the native UI (e.g. `/timesheet/teams`, the Timesheet Dashboard, or any other page reachable without `manage_timesheet`).

## Expected result

- If the user has a real, filled (time-logged), unsubmitted timesheet, "submit my timesheet" should just work — the agent should determine the project/team context itself from the user's own logged time entries (it already has read access to `time_entries`/`list` for this exact data) and submit directly, without asking the user for any team/project ID or name at all. Requiring an ordinary user to supply an internal numeric ID — or even a name — for a routine action like submitting their own already-filled timesheet is an unreasonable UX gap: the agent has everything it needs to resolve this itself from the user's own data.
- As a fallback only if genuinely ambiguous (e.g. the user has filled, unsubmitted time under more than one team/project simultaneously), the agent may ask which one — but it should never fail to identify the correct context/ID when there is exactly one clear answer determinable from the user's own real data.

## Actual result

- Step 2 (no team mentioned): the agent asked for `context type` and the raw numeric `context ID`, offering no name-based option at all: *"1. Context type: Is this for a `project` or a `team`? 2. Context ID: What is the numeric ID of that project or team?"*
- Step 3 (team name given): the agent explicitly could not resolve it: *"I need the numeric team ID for 'Retest Squad' to submit your timesheet. The Timesheet plugin's tools don't have a team-name lookup, so I can't proceed without it."* (Note: this is an honest refusal, not the silent fabrication seen in BUG-CRX-038 for the same underlying gap — worth noting as inconsistent behavior across sessions/attempts for the same root defect.)
- Step 4 (asked to infer from own membership): also refused: *"I don't have permission to look up teams in this Redmine instance. You'll need to provide the numeric team ID for 'Retest Squad' directly, or ask your Redmine administrator to grant you access to view team information."*
- Step 5 (native UI lookup): `/timesheet/teams` returns a real HTTP 403 Forbidden for this user (Teams management is gated to `manage_timesheet`, not `view_timesheets`). The Timesheet Dashboard (`/timesheets/dashboard`) and the weekly grid page show no team name or ID anywhere in their content either.
- **Net effect**: this class of user — an ordinary team member who can log time and is meant to be able to submit it, per the plugin's own basic documented workflow — has **no legitimate path** to submit their own timesheet via chat, and must get the raw numeric team ID from an administrator out-of-band every time, which is not a reasonable expectation for a routine, everyday action.

## Evidence

### Screenshot

Not captured — confirmed via live chat transcript text and direct navigation to `/timesheet/teams` (real 403).

### Console / log

```
[Logged in as daisy.skye / Crux Reporter (Reporter team role: view_timesheets + use_ask_crux only,
 no manage_timesheet). Real time entry logged for week of 2026-10-12.]

C (daisy.skye): Time Agent, please submit my timesheet for this week.
-> asking the Time Agent...
I need to know the context for your timesheet submission. Please tell me:
1. Context type: Is this for a project or a team?
2. Context ID: What is the numeric ID of that project or team?
Once you provide those, I'll submit your timesheet for this week (September 29 - October 5, 2026).

C: It's for my team, "Retest Squad". And I mean the week of October 12 to 18, not this week.
-> asking the Time Agent...
I need the numeric team ID for "Retest Squad" to submit your timesheet. The Timesheet plugin's
tools don't have a team-name lookup, so I can't proceed without it. Could you provide the team ID
for Retest Squad?

C: I don't know the ID. I'm only on one team -- can you figure out which team that is and submit
for it, for the week of October 12 to 18?
-> asking the Time Agent...
I don't have permission to look up teams in this Redmine instance. You'll need to provide the
numeric team ID for "Retest Squad" directly, or ask your Redmine administrator to grant you access
to view team information. Once you have the team ID, I can submit your timesheet for the week of
October 12-18.

[Verification -- native UI, same user]
GET /timesheet/teams -> 403 Forbidden (Teams page requires manage_timesheet, not view_timesheets)
/timesheets/dashboard -> no team name/ID shown anywhere on the page
```

## 2026-09-29 — clinching evidence: the agent already has the data needed to auto-resolve, and doesn't use it

Per explicit user feedback ("agent ko pata hona chahiye ki kis project/team ke liye submit kar raha hai, bina pooche" — the agent should already know which project/team it's submitting for, without asking), tested whether the data needed for auto-inference genuinely exists and is accessible to the agent, in the same session:

"What time have I logged that isn't submitted yet?" → *"You have **3.0 hours** logged for the week of October 12–18 that aren't submitted yet: 2026-10-12: Crux Reporter — 3.0h on 'Crux QA: TC-CRX-083 fixture' (project: Crux QA). To submit these hours, I still need the numeric team ID for 'Retest Squad'."*

This is conclusive: in the very same turn, the agent correctly read and reported the user's real logged time, including the correct project ("Crux QA") — proving the underlying `time_entries`/`list` read tool genuinely surfaces enough context to identify what to submit. It then immediately re-demanded the numeric team ID anyway, for the exact same data it had just used to answer the question. This is not a data-availability gap — it's the `submit` tool's own logic never attempting to resolve `context_id` from the data already available to the agent in the same conversation, even when there's exactly one unambiguous answer.

## Duplicate check

- Duplicate found: No — related to BUG-CRX-038 (same underlying team-name-resolution gap in `submit`) but a distinct, broader finding: BUG-CRX-038 is about the agent *fabricating* a wrong value when a name is given; this bug is about the complete, real-world absence of *any* legitimate path — chat or native UI — for an ordinary team member to discover their own team's ID at all, making the feature unusable end-to-end for this common user tier.
- Existing bug reference (if duplicate): BUG-CRX-038 (same root gap — no team-name lookup — different, narrower symptom)

## Production report

Reported to production 2026-10-01 as **#121827** (Priority High, Defect Type Functional, Defect Severity High-severity, Defect priority High, Category Crux Plugin, assigned Prashant Chaurasia). Linked via `report_defect` to testcase #120495 (`CRUX_AGENT_TIMESHEET`) / Run #569 "Crux QA Run 1" / Suite #374, Environment "Window 11 + Chrome" — testcase marked Failed.
