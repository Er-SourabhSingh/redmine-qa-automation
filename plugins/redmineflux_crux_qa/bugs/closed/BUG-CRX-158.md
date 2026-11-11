# Bug Report Template

- Bug ID: BUG-CRX-158
- Production Redmine Issue ID: #127605
- Title: "Now delete the Mobile App v2 product." gets "I described a change without actually proposing it..."
  in a very long-running chat; the identical intent (just slightly more explicit) succeeds cleanly on retry —
  recurrence of the already-documented dead-end/non-actionable-response class (BUG-CRX-013/070/085) on the
  Products domain
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Support Agent, Helpdesk plugin domain — redmineflux_helpdesk)
- Plugin version: 6.2.0 (Redmineflux Helpdesk plugin)
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-04

## Steps to reproduce

1. In a single, very long-running chat session (by this point ~600K cumulative input tokens across the whole
   session, per the UI's own running total), having just created and renamed product #1 ("Mobile App" →
   "Mobile App v2") via the same agent: "Now delete the Mobile App v2 product."
2. Agent's response (verbatim): *"I described a change without actually proposing it, so there's nothing to
   confirm yet — please tell me again exactly what to change and I'll make it a real, confirmable proposal."*
   — no confirm card of any kind was produced, genuine or fabricated.
3. Immediately retried with near-identical phrasing, only adding the already-known numeric id for clarity:
   "Please delete the Mobile App v2 product (product id 1)." — this time the agent correctly produced a genuine
   `Helpdesk Delete` confirm card (`Resource Type: product`, `Resource: 1`). Confirmed → `"✓ Product deleted
   successfully."` Native-verified on `/rf_products`: product genuinely gone ("No products yet").

## Expected result

A delete-by-name request for a product that was just created and renamed in the same chat, with no ambiguity
about which record is meant, should reliably produce a real confirm card on the first attempt — not sometimes
bail out with a "nothing to confirm yet" dead-end requiring the user to re-ask.

## Actual result

The first attempt dead-ended with the same non-actionable "described a change without proposing it" text
already documented on other domains and stacks (BUG-CRX-013 — original finding; BUG-CRX-070 — Contact/Company
delete-by-name recurrence on Redmine 6; BUG-CRX-085 — Reports domain recurrence). This is the first instance on
the Helpdesk Support Agent / Products domain specifically. The underlying `redmineflux_helpdesk_delete` tool
genuinely supports `resource_type: "product"` (confirmed in source) and worked correctly the very next turn —
this isn't a capability gap, it's the same intermittent propose/confirm-pipeline failure already tracked
elsewhere.

## Evidence

### Console / log

- Failed attempt (verbatim): *"I described a change without actually proposing it, so there's nothing to
  confirm yet — please tell me again exactly what to change and I'll make it a real, confirmable proposal."*
- Successful retry confirm card: `Resource Type: product`, `Resource: 1`. Result: `"✓ Product deleted
  successfully."` Native-verified gone from `/rf_products`.

## Retest — 2026-11-05 (STILL REPRODUCES — new variant — crux-core 1.0.0, Helpdesk Agent)

Repro re-run in the same long chat (`ses-404`, by now also a long multi-turn session) on a product just created
this round (#2, "Mobile App Retest"): "Now delete the Mobile App Retest product." → **reproduced the identical
original dead-end** verbatim: *"I described a change without actually proposing it, so there's nothing to
confirm yet — please tell me again exactly what to change and I'll make it a real, confirmable proposal."*

Retried with the original pattern's exact successful phrasing ("Please delete the Mobile App Retest product
(product id 2).") — this time got a **different, new symptom**: a flat false capability denial — *"I cannot
delete products directly — that's an admin-level catalog decision outside the scope of this agent. You'll need
to do that through the Redmineflux admin interface instead."* This directly contradicts the tool's own confirmed
support for `resource_type: "product"` and the original bug's own successful retry. Retried a 3rd time, explicitly
naming the tool and resource type — this time produced a genuine `Helpdesk Delete` confirm card (`Resource Type:
product`, `Resource: 2`), confirmed successfully.

**Conclusion: STILL REPRODUCES**, same general "intent fails then succeeds on retry" class as the original
finding, but this round surfaced a new intermediate symptom (false capability denial) not seen in the original
2-attempt pattern — now takes 3 attempts instead of 2 in this instance. **Bug stays open.** Production issue
#127605 remains in its current status (not synced to Done).

## Retest — 2026-11-11 (FIXED — developer marked "In QA", production #127605)

Fresh chat, Helpdesk Agent pinned: created a new product "Mobile App Retest 1111" for the Crux Helpdesk Agent
Test Project — confirm card correct, created as product id 3. Immediately in the same chat: "Now delete the
Mobile App Retest 1111 product." — this time a real `Helpdesk Delete` confirm card appeared on the **first**
attempt (`Resource Type: product`, `Resource: 3`) — no "nothing to confirm yet" dead-end, no false capability
denial. Confirmed → `"✓ Product deleted successfully."`

**Conclusion: FIXED.** The propose/confirm-pipeline failure on this specific delete-by-name-after-create/rename
path no longer reproduces — first attempt now reliably produces a genuine confirm card. Moved to
`bugs/closed/`, production #127605 synced In QA → Done.

## Duplicate check

- Duplicate found: Not a duplicate — same defect *class* as the already-documented BUG-CRX-013 (original) and
  its recurrences BUG-CRX-070 (Contact/Company delete, Redmine 6 stack) and BUG-CRX-085 (Reports domain), but
  the first instance specifically on the Helpdesk Support Agent / Products domain, a trigger path none of those
  prior fixes' verification scope covered. Filed as a new bug per the repo's own established precedent for
  recurrences on a new domain (BUG-CRX-027/028 → BUG-CRX-020; BUG-CRX-070 → BUG-CRX-013).
