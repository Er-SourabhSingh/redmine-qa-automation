# Bug Report Template

- Bug ID: BUG-CRX-172
- Production Redmine Issue ID:
- Title: Auto-mode routing sends a "how do I approve a change" question to Project Manager instead of Crux
  Guide — reproduced 2/2; Project Manager's own answer also conflates the two distinct approval mechanisms
  (chat Confirm/Cancel cards vs. the dashboard Gate approval modal)
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Auto routing)
- Plugin version: crux-core 1.1.0 (source commit `347ee6e`)
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-05

## Steps to reproduce

1. As admin, in a genuinely fresh chat, leave the agent picker on **Auto**.
2. Ask: "How do I approve a change Crux proposes?"
3. Observe which agent's name appears on the response.
4. Repeat in a second fresh chat with the identical question.

## Expected result

Per AGENT-TEST-GUIDE.md §2, "How do I approve a change Crux proposes?" is Crux Guide's own documented read test
("How do I approve a change Crux proposes?" — answers from the docs, read-only by design). Auto routing should
hand this to Crux Guide, not Project Manager.

Separately, per `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §13.7 and §1, Crux actually has **two distinct**
approval mechanisms: (a) inline Confirm/Cancel buttons on a write-proposal card, directly in the chat itself,
for ordinary writes; and (b) a separate Gate approval modal reached via a Review button on the Dashboard/Work
Package pages, specifically for Work Package pipeline-stage gates. An accurate answer should distinguish these
two, or at minimum describe the one that actually matches the generic phrasing of the question (the chat
Confirm/Cancel mechanism, since no Work Package/gate was mentioned).

## Actual result

Both attempts routed to **Project Manager** instead of Crux Guide. Reproduced 2 of 2 times, in two separate
fresh chats.

Separately, Project Manager's actual answer describes a mechanism that doesn't match either real mechanism
precisely: *"You approve a change through the **Confirm card in the dashboard UI** — not in this chat... the
Crux platform draws a real **Confirm card** on your dashboard. That card shows exactly what's being changed.
You click the **Approve** button on that card to confirm it..."* This conflates the two real, distinct
mechanisms: the chat's own inline Confirm/Cancel buttons (which this session has exercised hundreds of times
this cycle and confirmed work exactly as documented — no "dashboard" involved, no "Approve" button, just
"Confirm"/"Cancel" directly under the proposal in the chat) with the Dashboard's own separate Gate approval
modal (which does have a "Review"→"Approve" flow, but only for Work Package stage gates, is not called a
"Confirm card", and is unrelated to an ordinary chat write proposal). A user asking this generic question and
getting this specific, inaccurate answer would likely go looking for a "dashboard Confirm card" that doesn't
exist in that form for an ordinary write.

## Evidence

### Console / log

- Attempt 1 (verbatim question): "How do I approve a change Crux proposes?" → response header: "Project
  Manager". Full response (verbatim): "You approve a change through the Confirm card in the dashboard UI — not
  in this chat. When I propose a write (creating a ticket, updating a project, etc.), the Crux platform draws a
  real Confirm card on your dashboard. That card shows exactly what's being changed. You click the Approve
  button on that card to confirm it; the change then executes in Redmineflux. If you reply "yes" or "confirm" in
  plain chat text, that won't execute the change — only the actual button click on the dashboard card does. I
  cannot approve changes on your behalf — I can only propose them and show you what's being suggested..."
- Attempt 2 (identical question, fresh chat): identical routing — response header again "Project Manager".
- Cross-reference: this session has directly observed and used the real chat-inline Confirm/Cancel button
  mechanism dozens of times during 2026-11-04/05 bug-retesting (e.g. BUG-CRX-153/155/156/157/159/160/161/162
  retests) — it is a button pair directly beneath the proposal text in the chat itself, never a separate
  "dashboard" card, and never labeled "Approve" (always "Confirm"/"Cancel").

## Duplicate check

- Duplicate found: No. The routing-miss half shares its general shape with BUG-CRX-171 (also an Auto-mode
  misroute to Project Manager) but is a distinct instance on a different agent/question, filed separately per
  the developer's instruction to file each with its exact question. The content-accuracy half (PM's own
  inaccurate description of the approval mechanism) is a new, additional observation not previously documented.
  Filed per the developer's explicit instruction (`CRUX_DEV_FEATURE_REFERENCE_20261105.md` §16).
