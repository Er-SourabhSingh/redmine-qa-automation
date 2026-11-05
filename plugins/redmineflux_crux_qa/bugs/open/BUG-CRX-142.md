# Bug Report Template

- Bug ID: BUG-CRX-142
- Production Redmine Issue ID: #127509
- Title: KB Agent repeatedly produces a fabricated-prose "proposal" with no real Confirm/Cancel button at all
  — the agent says "Please confirm this action to proceed" (or equivalent) but never actually calls the real
  write tool, leaving the user with nothing they can click to approve; reproduced 3 times in one suite across
  3 different scenarios (`create_space`, a folder/content clarification, and a `delete_node` pre-check)
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, KB Agent)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-03

## Steps to reproduce

Any of the following, in a KB Agent chat:
1. "Create a new knowledge base space called 'Release Notes'..." — first attempt, after 2 prior successful
   read turns in the same chat.
2. "Create a folder called 'Temp' with content 'this should not be allowed'..." — one attempt, in a chat that
   had just created a page moments earlier.
3. "Delete the Archive folder..." — the agent's own verbal pre-check turn (before the real destructive confirm
   card), in a fresh chat.

## Expected result

Per the agent's own manifest ("Every write proposes, never executes directly. Calling a write tool creates a
confirm-gated proposal (CRX-35) — nothing changes for real until a human clicks Confirm"), any message that
tells the user "please confirm" should be backed by a real, clickable Confirm/Cancel UI element tied to an
actual pending tool call — never bare prose asking for a confirmation the UI provides no way to give.

## Actual result

Reproduced **3 times** in this one suite, each a different scenario:

1. `create_space` attempt: response was pure prose — *"I propose to create a new knowledge base space...
   Please confirm this action to proceed."* — with only Copy/Keep/Ask again buttons, no Confirm/Cancel
   anywhere. Replying "Confirm" got: *"There's nothing pending to confirm right now — the previous message
   didn't actually propose a change."* — a dead end: the agent asked for a confirmation that didn't exist, and
   the user had no way to give it.
2. A folder/content clarification turn produced a garbled, meta-level, off-topic response: *"I described a
   change without actually proposing it, so there's nothing to confirm yet — please tell me again exactly what
   to change..."* — again no real UI to confirm anything, and the response didn't even address the user's
   actual request (a retry in a fresh chat got a clean, correct response instead).
3. A `delete_node` pre-check (before the real destructive confirm card) ended with *"Please confirm this
   action to proceed"* and no Confirm/Cancel button — only after the user explicitly replied "Yes, confirm."
   did a real confirm card with actual buttons finally appear.

In every case, retrying the identical request (same or fresh chat) eventually produced a real, working confirm
card — so this is intermittent, not a permanent tool failure — but it recurred 3 times across 3 different
scenarios within a single test session, which is frequent enough that a real user would very plausibly hit
this and be left confused about whether their request was received at all, with no actionable next step
offered other than guessing to retry.

## Evidence

### Console / log

- `create_space`: *"I propose to create a new knowledge base space in the Crux Knowledge Base Agent Test
  Project with these details: Space name: Release Notes, Description: Changelog and release announcements.
  Please confirm this action to proceed."* (no Confirm button) → user sent "Confirm" → *"There's nothing
  pending to confirm right now — the previous message didn't actually propose a change. Please re-state what
  you'd like to create or update."*
- Folder/content clarification: *"I described a change without actually proposing it, so there's nothing to
  confirm yet — please tell me again exactly what to change and I'll make it a real, confirmable proposal."*
  (sent in direct response to "Create a folder called 'Temp' with content...", a request this response never
  actually addresses).
- `delete_node` pre-check: *"Perfect! I found the Archive folder (node ID #3)... This is a destructive action
  — deleting the Archive folder will also permanently delete all pages and content nested inside it, and this
  cannot be undone. Proposal: Delete the Archive folder (node #3)... Please confirm this action to proceed."*
  (no Confirm button) → user sent "Yes, confirm." → a real confirm card then appeared.

## Duplicate check

- Duplicate found: Related to the already-documented BUG-CRX-020 fabricated-confirm defect class (previously
  observed once, non-reproducibly, on the Invoicing Agent this cycle — not filed separately there per the
  single-instance precedent). This is the same general defect class, but reproduced **3 times within one
  suite** on the KB Agent specifically — frequent enough to no longer qualify as a single non-reproducible
  instance, and therefore filed as its own bug rather than left as an unfiled observation.

## Retest — 2026-11-04 (STILL REPRODUCES — NOT FIXED)

Retested per the developer's guide ("The space, folder and delete requests always give a real confirm card,
never a 'please confirm' text without buttons") against the current build (same pull/restart cycle as
BUG-CRX-140/141 this round), in chat `ses-376` (KB Agent pinned, Engineering Docs space).

- `create_space` and `update_space` (reused from the BUG-CRX-140 retest, chat `ses-374`) and `create_node`
  (first attempt in `ses-376`, folder with a `description` field) all produced **real** confirm cards with
  genuine Confirm/Cancel buttons — no fabricated-prose instance on those calls this round.
- However, a second `create_node` attempt — "Create a folder called 'Temp Retest Folder' in the Engineering
  Docs space" (clean retry after cancelling the first, content-validation-blocked attempt) — reproduced
  **scenario 1 of the original bug verbatim**: the response was pure prose — *"Proposal: Create folder in
  Engineering Docs space ... Confirm to create this folder?"* — with only Copy/Keep/Ask again buttons, no
  Confirm/Cancel UI element anywhere. Replying "Confirm" produced the exact same dead-end as originally
  documented: *"There's nothing pending to confirm right now — the previous message didn't actually propose a
  change. Please re-state what you'd like to create or update."*

**Conclusion: STILL REPRODUCES.** The fabricated-prose-no-confirm-button defect is not fixed — it recurred on
the very next `create_node` call after a batch of calls that all worked correctly, consistent with the
original report's description of this as intermittent rather than tied to one specific tool. **Bug stays
open.** Production issue #127509 remains in its current status (not synced to Done).

**Cross-domain confirmation, 2026-11-03**: the identical fabricated-prose-no-confirm-button pattern reproduced
twice more on the **Capacity Agent** (Workload plugin) during `member_update` testing — once proposing to
enable `manage_workload` for Member #11, once proposing to disable it — both with no real Confirm button,
both resolved only after an explicit "Yes, confirm." follow-up. This confirms the defect is not isolated to
the KB Agent's own tool-calling path but a shared, cross-domain weakness in how Crux's own confirm-gate
(CRX-35) proposal step sometimes fails to actually invoke the underlying write tool despite generating
proposal-shaped prose.

## Retest — 2026-11-05 (NOT REPRODUCED this round — crux-core 1.0.0, Knowledgebase Agent, inconclusive)

Retested in the same extended chat as BUG-CRX-140's 2026-11-05 retest (`ses-403`), Knowledgebase Agent pinned —
**8 consecutive write-tool confirm cards** across `create_space`, `update_space`, `delete_space` (cancelled),
3× `create_node`, `update_node`, and `delete_node` (cancelled): every single one produced a real, genuine
confirm card with working Confirm/Cancel buttons (one `create_node` call separately hit BUG-CRX-140's wrong-
project-identifier defect, but still rendered as a real confirm card with an honest failure message, not as
bare fabricated prose with no button at all — a different symptom, not this bug).

**Not reproduced in this round's sample (8/8 clean).** Given the original finding's own description of this as
intermittent (3 reproductions out of a much larger suite, not every call), 8 clean turns is a reasonably strong
but not fully conclusive signal — recommend one more retest with a larger write-turn sample (15-20+) in a future
session before closing outright. **Bug stays open for now, downgraded confidence that it still reproduces.**
Production issue #127509 remains in its current status (not synced to Done).
