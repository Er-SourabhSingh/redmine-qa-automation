# Bug Report Template

- Bug ID: BUG-CRX-113
- Production Redmine Issue ID: #126603
- Title: Auto-mode fails to route a genuine project-creation request to any domain agent at all, falls back to generic "Crux" persona, which falsely claims it has no tools to create projects — directly contradicted by the Project Setup Agent successfully doing exactly that moments earlier in the same session
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Auto-mode routing)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-10-30

## Steps to reproduce

1. Fresh chat, Crux mode set to Auto. "Create a project for the new mobile app initiative." (lexically
   obvious phrasing) → correctly routes to **Project Setup Agent**, produces a genuine confirm card.
   Cancelled (not confirmed, to isolate the routing check from a real write).
2. Fresh chat, same Auto mode. A more naturally-worded equivalent avoiding the literal words "create" +
   "project" together as the first clear signal: "I need a fresh space in Redmine to start tracking the
   mobile app work."

## Expected result

Per this repo's established Auto-mode routing baseline (and CRC-42's own documented trigger table listing
"create / set up a (new) project" for this exact agent), a differently-worded but semantically identical
request should still route to the Project Setup Agent — or, at worst, misroute to a real domain agent
(Project Manager) the way other Auto-mode misroutes in this QA cycle have (BUG-CRX-094, 096, 109).

## Actual result

**Step 2 did not route to any domain agent at all.** The reply's avatar/name is the generic **"Crux"**
persona (not "Project Setup Agent," not "Project Manager," not any named domain agent), and it falsely
claimed: *"I don't have tools here to create projects or spaces in Redmineflux. To set up a new project for
your mobile app work, you'll need to contact the Project Manager — they can create the project structure
and configure it for you. You can reach them by starting a message with @Project Manager..."*

This is a confident, specific, and **demonstrably false** capability denial — the Project Setup Agent, in
the very same chat session minutes earlier (step 1, and the entire preceding TC-CRX-421 through TC-CRX-430
test pass), genuinely created multiple real projects via `redmineflux_core_create_project` with zero issue.
The generic "Crux" fallback persona apparently has no visibility into — or chooses not to mention — the
Project Setup Agent that already exists, is already pinned/available in this exact UI, and already has this
exact capability. Instead it invents an entirely fictional workaround (`@Project Manager` mention) that
routes to a DIFFERENT agent which, per this repo's own Auto-routing table, is not even the documented owner
of project-creation requests.

This is a more severe failure mode than the previously-documented Auto-routing misroutes (BUG-CRX-094, 096,
109), which always landed on a real, named domain agent (usually Project Manager) that gave an honest
non-answer or asked a clarifying question. Here, Auto-mode fails to route to ANY domain agent and the
resulting generic fallback fabricates a flatly false claim about the platform's own capabilities.

## Evidence

### Console / log

- Step 1 (control, routes correctly): avatar "PS" / "Project Setup Agent", genuine `Create project` confirm
  card (`Name: Mobile App Initiative`, `Identifier: mobile-app-initiative`, real Confirm/Cancel buttons).
- Step 2 (misroute + false denial): avatar "C" / "Crux" (generic, not a named domain agent), verbatim: *"I
  don't have tools here to create projects or spaces in Redmineflux. To set up a new project for your
  mobile app work, you'll need to contact the Project Manager — they can create the project structure and
  configure it for you. You can reach them by starting a message with @Project Manager or asking me again
  that way..."*

## Duplicate check

- Duplicate found: No new root cause filed as its own bug — related in shape to BUG-CRX-094/096/109
  (Auto-mode misrouting to the wrong agent on ambiguous phrasing) but distinct and more severe: those three
  always still reached a real, honest domain agent; this one reaches no domain agent at all and produces an
  outright false capability claim, the first instance of this specific combined failure mode in this QA
  cycle.
