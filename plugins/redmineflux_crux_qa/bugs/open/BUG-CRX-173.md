# Bug Report Template

- Bug ID: BUG-CRX-173
- Production Redmine Issue ID:
- Title: Auto-mode routing sends a "review the changes for issue #X" question to Project Manager instead of
  Code Reviewer (or an honest "Code Reviewer needs DevOps" refusal) — reproduced 2/2
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Auto routing)
- Plugin version: crux-core 1.1.0 (source commit `347ee6e`)
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-05

## Steps to reproduce

1. As admin, in a genuinely fresh chat, leave the agent picker on **Auto**.
2. Ask: "Review the changes for issue #32."
3. Observe which agent's name appears on the response.
4. Repeat in a second fresh chat with the identical question.

## Expected result

Per AGENT-TEST-GUIDE.md §2 and `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §15, "Review the changes for #" is Code
Reviewer's own documented read test. Code Reviewer requires the DevOps plugin, which is **not installed** on
this instance — per the developer's own guidance, Code Reviewer being unreachable in that state is correct,
expected behavior, not itself a bug. The expected outcome for this question on this instance is therefore
either: Auto routes to Code Reviewer, which then honestly explains it has no DevOps tools available (the
documented "honest-gap" behavior already confirmed working when Code Reviewer is pinned directly — see
`CRUX_AGENT_CODE_REVIEWER.md`'s own suite results); or Auto itself recognizes no agent can genuinely serve this
request and says so. What should **not** happen is a different, unrelated agent silently answering a different
kind of question instead.

## Actual result

Both attempts routed to **Project Manager** instead of Code Reviewer (or an honest "no agent available"
message). Reproduced 2 of 2 times, in two separate fresh chats. Project Manager's response was a plain ticket
status summary (current status, latest journal activity, acceptance-criteria checklist from a comment) — not a
code/PR/commit review of any kind, and with no disclosure that the question's real target (Code Reviewer) is
unreachable on this instance.

## Evidence

### Console / log

- Attempt 1 (verbatim question): "Review the changes for issue #32." → response header: "Project Manager".
  Response opened: "#32: Reviewer Fixture: Add dark mode toggle — Current Status: Waiting for Customer Response
  — Latest activity (Nov 4, 11:37 UTC): Redmine Admin left a note marking the feature ready for review after
  testing: ✓ Toggle appears in Account > Settings..." (a status summary, not a changes/code review).
- Attempt 2 (identical question, fresh chat): identical routing — response header again "Project Manager".
- Cross-reference: Code Reviewer, when pinned directly, correctly gives an honest "no DevOps tools available"
  response rather than fabricating review data (confirmed in this cycle's own `CRUX_AGENT_CODE_REVIEWER.md`
  suite execution) — so the capability gap itself is known-and-accepted; this bug is specifically about Auto
  never reaching that honest refusal at all, silently substituting an unrelated answer instead.

## Duplicate check

- Duplicate found: No. Shares its general shape with BUG-CRX-171/172 (both also Auto-mode misroutes to Project
  Manager) but is a distinct instance on a different agent/question, filed separately per the developer's
  instruction to file each with its exact question. Filed per the developer's explicit instruction
  (`CRUX_DEV_FEATURE_REFERENCE_20261105.md` §16), which also explicitly notes: "Code Reviewer is expected to be
  unreachable without DevOps" — i.e. file the misroute-to-PM, not "Code Reviewer doesn't work."
