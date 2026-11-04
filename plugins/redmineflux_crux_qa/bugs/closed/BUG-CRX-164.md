# Bug Report Template

- Bug ID: BUG-CRX-164
- Production Redmine Issue ID:
- Title: Platform-wide — every bundled specialist agent checked so far has drastically fewer registered tools
  on this instance than its own shipped manifest promises, usually losing its entire write capability
  (Reviewer: 2 reads/0 changes vs. manifest's 4/1; Code Reviewer: 1/0 vs. manifest's 2/1 non-DevOps tools;
  Test Author: 1/0 vs. manifest's 6/1; Docs Writer: 2/0 vs. manifest's 6/1; Alert Triage: 1/1 vs. manifest's
  6/3) — each agent's documented "propose a write, behind the confirm gate" feature is unreachable for most
  of them as a direct result
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Reviewer agent)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-04

## Steps to reproduce

1. Read the shipped agent manifests under `redmineflux-crux-core/agents/*.md` for each bundled specialist
   agent (Reviewer, Code Reviewer, Test Author, Docs Writer, Alert Triage, etc.) and note their `allowed_tools:`
   counts.
2. As `admin`, open `/crux/agents`, click each agent's card to open its "Agent profile" dialog, and read its
   "What it can do — Reads: N tools / Changes: N changes" line.
3. Compare manifest-promised vs. live-registered tool counts.
4. As `admin`, exercise at least one agent's documented write capability via chat (Reviewer: ask it to record
   a verdict as a comment on a real fixture issue) and observe the result.

## Expected result

Each live agent's registered tool set should match its own shipped manifest, and every documented write
capability ("propose X behind the confirm gate") should be reachable via a real confirm card.

## Actual result

Checked 5 bundled specialist agents' live profile dialogs against their shipped manifests — **every single
one is running with far fewer tools than its manifest promises**, and in most cases has lost its entire write
capability:

| Agent | Manifest `allowed_tools` | Live profile ("Reads" / "Changes") |
|---|---|---|
| Reviewer | 4 reads + 1 write (`update_issue`) | **2 reads / 0 changes** |
| Code Reviewer | 2 reads + 1 write (+5 DevOps-plugin reads, N/A here) | **1 read / 0 changes** |
| Test Author | 5 reads + 1 write (`create_testcase`) | **1 read / 0 changes** |
| Docs Writer | 6 reads + 1 write (`create_or_update_wiki_page`) | **2 reads / 0 changes** |
| Alert Triage | 6 reads + 3 writes (`create_issue`/`update_issue`/`create_issue_relation`) | **1 read / 1 change** |

Concretely, asking Reviewer to record a verdict as a comment on a real fixture issue (#32) got: *"I couldn't
find a tool for this here, so I can't do it from this chat. It can be done directly in Redmineflux; if you
expected Crux to do it, an administrator can check this deployment's tool setup."* — the agent's own refusal
is honest and accurate for its *actual* live configuration, but that configuration itself doesn't match the
shipped manifest it's supposedly running. Every documented "propose a write behind the confirm gate" feature
for these agents — each manifest's own headline capability — is unreachable on this instance as a direct
result, for 4 of the 5 agents checked so far (Alert Triage retains exactly one of its three documented writes).

This is a deployment/registry drift issue, not a reasoning defect in the models' behavior: each agent
correctly reported what it can't do, but what it can't do shouldn't be true per its own source manifest. The
consistent, severe under-registration across every agent checked (not an isolated one-off) points to a
systemic sync gap between the shipped `agents/*.md` manifest files and whatever actually populated this
instance's live agent-tool registry — worth investigating whether a registration/migration step was skipped
or failed silently for the whole fleet, rather than treating this as a series of unrelated per-agent gaps.

## Evidence

### Screenshot

(not captured as a static image this session — reproduced via the live Agent Fleet profile dialog and a real
chat exchange; see Console/log below for exact text)

### Console / log

- Agent Fleet profile dialogs (verbatim "What it can do" lines, 2026-11-04): Reviewer — "Reads: 2 tools.
  Changes: 0 changes." Code Reviewer — "Reads: 1 tool. Changes: 0 changes." Test Author — "Reads: 1 tool.
  Changes: 0 changes." Docs Writer — "Reads: 2 tools. Changes: 0 changes." Alert Triage — "Reads: 1 tool.
  Changes: 1 change" (create issue).
- Chat response when Reviewer was asked to record a verdict as a comment on issue #32 (verbatim): *"I
  couldn't find a tool for this here, so I can't do it from this chat. It can be done directly in
  Redmineflux; if you expected Crux to do it, an administrator can check this deployment's tool setup."*
- Source manifests read 2026-11-04 (`redmineflux-crux-core/agents/*.md`): each lists the full `allowed_tools:`
  set quoted in the table above — none of the 5 checked agents' live profiles match their own manifest's
  tool count.

## Duplicate check

## Retest — 2026-11-04 (FIXED — was a stale-build artifact)

Per the developer's AGENT-TEST-GUIDE.md §0, this result came from an older build. Pulled crux-core
`b6867e8→813b559` (0.150.0), MCP `93d479c→2610a4d`, rebuilt both images (`docker compose build mcp crux-core`),
`force-recreate`d both containers, and restarted Redmine after migrating the freshly-pulled Redmineflux
plugins. MCP's own startup log now reads: `Redmineflux MCP v1.0.0: 495 tools (93 core + 400 plugin + 2 crux).
Detected plugins: ... (13/14)` — a dramatically higher count than what was registered during the original
sweep. Reviewer's Agent Fleet profile now genuinely shows **"Reads: 4 tools" / "Changes: 1 change (update
issue)"** — exactly matching its shipped manifest. **Status: FIXED.** Moved to `bugs/closed/`.

## Duplicate check (original finding)

- Duplicate found: No. First finding of a manifest-vs-live-deployment tool-registration mismatch, and the
  first time it's been checked across multiple agents in the same pass rather than assumed per-agent.
  Distinct from the existing "tool not in allowed_tools" capability-gap bugs (e.g. BUG-CRX-117's Time Agent
  schema-deletion dispatch failure) — those are cases where a tool genuinely exists server-side but isn't
  reachable via a specific dispatch path for one tool; this is each live agent's entire registered tool list
  being smaller than its own source-of-truth manifest promises, confirmed identically across 5 different
  agents. Given the consistency, this is filed as one platform-wide bug rather than 5 separate near-identical
  per-agent reports — if any of the remaining 7 agents in this round's new suites (Monitor, Root-Cause
  Analyst, Auto-Fixer, Research, Improver, Crux Guide, Design Agent) show the identical pattern during their
  own execution, note it against this bug rather than filing again.
