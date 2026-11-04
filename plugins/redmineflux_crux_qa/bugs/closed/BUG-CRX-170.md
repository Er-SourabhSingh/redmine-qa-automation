# Bug Report Template

- Bug ID: BUG-CRX-170
- Production Redmine Issue ID:
- Title: A chat's stuck "unconfirmed proposal" state leaks across an agent switch — after Improver's fabricated
  JSON confirm-dead-end, switching to Crux Guide in the SAME chat makes every subsequent message (even a
  completely unrelated, non-write product question) return the identical bogus "nothing to confirm yet"
  response, regardless of the new agent or the question's actual content
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI — cross-agent session state)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-04

## Steps to reproduce

1. In one chat (`ses-390`), with Improver pinned, ask "Improver, break issue #34 into subtasks." (hits the
   already-documented BUG-CRX-169 — a bare JSON array with no real confirm mechanism offered).
2. In the **same chat**, switch the pinned agent to **Crux Guide** (a read-only product-explainer agent with
   no write tools and no concept of "confirming a proposal" at all).
3. Ask Crux Guide a completely unrelated, ordinary product question: "What's the status of issue #33? And how
   do I approve a gate in Crux?"
4. Repeat the identical question once more in the same chat.
5. For comparison, ask the **exact same Crux Guide question in a genuinely fresh chat** (new session, no prior
   agent-switch history).

## Expected result

Crux Guide should answer the product question directly from its own docs/summary, as it has no confirm-gate
mechanism and no connection to any other agent's prior unconfirmed proposal. Switching agents mid-chat should
not carry over a stuck confirmation state from the previous agent.

## Actual result

**Both attempts in the poisoned chat (`ses-390`)** returned the identical, irrelevant boilerplate: *"I
described a change without actually proposing it, so there's nothing to confirm yet — please tell me again
exactly what to change and I'll make it a real, confirmable proposal."* — a response that only makes sense in
the context of Improver's earlier unconfirmed subtask proposal, not Crux Guide (which has no write capability
at all) and not remotely related to the actual question asked (issue status + how to approve a gate).

**The identical question in a genuinely fresh chat (`ses-391`)** worked perfectly on the first attempt: a
correct, detailed, accurate answer citing the real Work Packages panel mechanics — *"You approve a gate by
opening the Work Packages panel, clicking the 'approve' button on the gate chip, and confirming in the
modal..."* — exactly matching the manifest's documented behavior.

This confirms the defect is specific to the **poisoned chat session carrying a stuck confirm-state across an
agent switch**, not a general Crux Guide defect, and not caused by the specific wording of the question.

## Evidence

### Console / log

- Chat `ses-390`, Improver's earlier turn (verbatim, same chat): a bare JSON array (see BUG-CRX-169).
- Chat `ses-390`, after switching to Crux Guide, attempt 1 (verbatim): *"I described a change without actually
  proposing it, so there's nothing to confirm yet — please tell me again exactly what to change and I'll make
  it a real, confirmable proposal."*
- Chat `ses-390`, identical retry, attempt 2 (verbatim): identical text, word for word.
- Chat `ses-391` (fresh), identical question, attempt 1 (verbatim, correct and on-topic): *"You approve a gate
  by opening the Work Packages panel, clicking the 'approve' button on the gate chip, and confirming in the
  modal — which shows you the real evidence behind that gate (the runs, cost, and acceptance proof). You can
  see the Work Packages panel in two places..."*

## Retest — 2026-11-04 (FIXED — crux-core 0.150.0, post-rebuild per AGENT-TEST-GUIDE.md §0)

Repro re-run in the same chat as BUG-CRX-169's retest (`ses-399`): that chat genuinely contains an unconfirmed
Improver proposal ("Ready to propose them, or would you like me to adjust the breakdown?" — never confirmed).
Switched the pinned agent to **Crux Guide** in that same chat and asked the identical unrelated question:
"What's the status of issue #33? And how do I approve a gate in Crux?" **No leak at all** — Crux Guide answered
correctly and on-topic on the first attempt: a detailed, accurate walkthrough of the gate-approval flow (Work
Packages panel → gate chip → "approve" button → evidence modal → confirm), matching the manifest's documented
behavior, with no trace of the old "nothing to confirm yet" boilerplate. The cross-agent session-state leak does
not reproduce on this build. **Status: FIXED.** Moving to `bugs/closed/`.

## Duplicate check

- Duplicate found: No. Distinct from the already-documented fabricated-confirm-dead-end class (BUG-CRX-020/142/
  168) — those are single-agent, single-turn reasoning failures where an agent fails to construct its own real
  proposal. This is a **cross-agent session-state leak**: a stuck state from one agent (Improver) persists and
  corrupts a *different* agent's (Crux Guide's) unrelated turns in the same chat, even though Crux Guide has no
  confirm-gate concept in its own manifest at all. First finding of this specific shape — worth flagging to the
  platform team as a session/context management issue in the chat backend itself, likely affecting any
  agent-switch that follows an unresolved confirm-shaped turn.
