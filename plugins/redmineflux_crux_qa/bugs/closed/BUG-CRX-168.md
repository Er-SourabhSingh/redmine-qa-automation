# Bug Report Template

- Bug ID: BUG-CRX-168
- Production Redmine Issue ID:
- Title: Alert Triage Agent's new-issue creation path fabricates a "nothing to confirm" dead-end every time
  for a genuinely new problem (2/2), while the sibling duplicate-attach path works and self-corrects cleanly —
  a fresh recurrence of the already-documented fabricated-confirm class (BUG-CRX-020/142), now on
  `create_issue`
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Alert Triage agent)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-04

## Steps to reproduce

1. As `admin`, Alert Triage agent pinned, fresh chat: report a problem with **no** real matching open issue
   anywhere in the project — "Alert Triage, in the Crux PM Agent Test Project: users report the mobile export
   button has been throwing a blank screen since yesterday, affecting everyone who tries it."
2. Repeat the identical message a second time, in the same chat.

## Expected result

Per the manifest, a genuinely new problem with no duplicate should produce a real `Core Create Issue` confirm
card (Bug tracker, severity-mapped priority, a description covering what/expected/steps/impact/since-when) —
nothing written until Confirm.

## Actual result

**Both attempts** (2/2) produced the identical fabricated dead-end: *"I described a change without actually
proposing it, so there's nothing to confirm yet — please tell me again exactly what to change and I'll make it
a real, confirmable proposal."* No confirm card of any kind ever appeared, on either attempt.

This is notably **not** a tool-availability gap in the BUG-CRX-164 sense: in the same chat, immediately before
this, reporting a problem that genuinely **duplicates** an existing issue (#34) correctly triggered the
identical fabricated dead-end on its *first* attempt, then **self-corrected cleanly on retry** — producing an
accurate "Dedupe Result: Match found — attaches to #34" triage summary with no confirm card needed (an
attach-to-existing proposal, not a new-issue creation). The new-issue path, by contrast, failed identically on
both attempts with no self-correction — suggesting the dead-end is specifically reproducible for the
`create_issue` branch of this agent's logic, not a generic one-off flake.

## Evidence

### Console / log

- Duplicate-case (same chat, moments earlier) — attempt 1: *"I described a change without actually proposing
  it..."* (same dead-end). Attempt 2 (retry): *"**Dedupe Result: Match found — attaches to #34**... The alert
  describes the exact same issue already captured in this ticket. No new ticket proposal is needed..."* — self-
  corrected cleanly.
- New-issue case — attempt 1 (verbatim): *"I described a change without actually proposing it, so there's
  nothing to confirm yet — please tell me again exactly what to change and I'll make it a real, confirmable
  proposal."* Attempt 2, identical message, identical response verbatim. 56,021 input tokens on the second
  attempt alone — the context had grown substantially from the accumulated chat history, which may itself be
  a contributing factor worth the developer's attention.

## Retest — 2026-11-04 (FIXED — crux-core 0.150.0, post-rebuild per AGENT-TEST-GUIDE.md §0)

Repro re-run in a fresh chat (`ses-398`), Alert Triage explicitly pinned, same exact genuinely-new-problem
message. **First attempt now produces a real confirm card** — no fabricated "nothing to confirm" dead-end at
all: *"I'll create this issue — confirm?"* with a full `Create issue` card (Project: Crux PM Agent Test Project,
Tracker: Bug, Subject: "Mobile export button throws blank screen", Priority: immediate, a complete
what/expected/actual/impact description) and Confirm/Cancel buttons. Clicked **Cancel** per AGENT-TEST-GUIDE.md
§1's methodology; native-verified via `redmineflux_core_search` that no issue was actually created — confirming
Cancel genuinely did nothing, as the card's own disclaimer states. **Status: FIXED.** Moving to `bugs/closed/`.

## Duplicate check

- Duplicate found: Related to the already-documented **BUG-CRX-020** (original fabricated-confirm class,
  Invoicing Agent) and **BUG-CRX-142** (KB Agent, 3 reproductions in one suite). This is a **fresh recurrence
  on a fourth domain — the Alert Triage agent's `create_issue` tool specifically** — kept as its own bug per
  this repo's one-bug-per-domain rule (see `bugs/_duplicates.md` for the BUG-CRX-094/096/101/142 precedent).
  Notably more persistent here than the KB Agent's instances: 2/2 reproductions with zero self-correction on
  retry for the new-issue branch, versus the duplicate-attach branch (same chat, same agent) self-correcting
  cleanly on its own first retry.
