# Bug Report Template

- Bug ID: BUG-CRX-014
- Production Redmine Issue ID: #120665
- Title: A follow-up chat turn without a repeated "CRM," prefix silently mis-routes to the Project Manager agent, which then falsely claims no CRM write tools exist
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux
- Plugin version: 0.39.0 (plugin) / crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP)
- User role: `luna.blossom` (with real CRM plugin access, per TC-CRX-085 precondition)
- Date: 2026-09-15

## Steps to reproduce

1. In an Ask Crux chat session, send a first message explicitly prefixed "CRM," (e.g. "CRM, create a contact named Priya Sharma at Acme Corp.") — this correctly routes to "the Sales Agent."
2. Send a follow-up turn continuing the same request/intent WITHOUT repeating the "CRM," prefix, e.g.:
   - "Go ahead and create Acme Corp with minimal info, then create Priya Sharma as a contact linked to it." (a direct continuation of the Sales Agent's own prior question)
   - "Use priya.sharma@acmecorp.test as her email." (correcting a validation failure on the Sales Agent's own pending proposal)
3. Observe which agent answers and what it claims about tool availability.

## Expected result

- A follow-up turn that is clearly continuing/correcting an in-progress conversation with a specific domain agent should either (a) stay routed to that same agent, or (b) if routing genuinely resets per-turn, tell the user explicitly that they need to re-address the domain agent — never silently answer via a different agent while presenting its answer as authoritative.
- The answering agent must never claim a false absence of capability that a sibling agent in the very same product demonstrably has and uses successfully moments earlier/later in the same session.

## Actual result

- Reproduced 3 times in one session (TC-CRX-086), each time on a follow-up turn sent without the "CRM," prefix:
  1. After the Sales Agent asked "Which would you prefer? ... Or just say 'go ahead and create Acme Corp'...", replying "Go ahead and create Acme Corp with minimal info, then create Priya Sharma as a contact linked to it." (no prefix) routed to **"the Project Manager"** instead, which responded: *"The discovery returned only read tools — the CRM write tools (create_company, create_contact, etc.) aren't surfaced through discovery... I can read CRM data, but I cannot create companies or contacts."*
  2. After the Sales Agent's own confirm card failed validation ("Validation error: Email cannot be blank; Email is invalid"), replying "Use priya.sharma@acmecorp.test as her email." (no prefix) again routed to a response claiming: *"there are no CRM write tools (create_contact, update_contact, etc.) discoverable in the CRM group. I cannot create the contact from chat."*
- Both claims are demonstrably false: the Sales Agent, reached explicitly with a fresh "CRM," prefix immediately afterward, successfully produced real, correctly-filled write confirm cards for the exact same actions (`Crm Create Company`, `Crm Create Contact`) using the exact same tool set — proving the write tools are available and discoverable, just not to whichever agent this mis-routed to.
- This is worse than a routing inconvenience: the false "no write tools available / cannot create" claim is stated with full confidence and no hedge, and would mislead a real user into believing the CRM plugin's chat write capability doesn't exist at all, when it works perfectly when addressed correctly.
- Workaround (used throughout this session to make progress): always re-prefix every single turn with "CRM," even when obviously continuing the same in-progress domain conversation.

## Evidence

### Screenshot

Not captured — confirmed via live chat transcript text (session ses-141, 2026-09-15).

### Console / log

```
C: Go ahead and create Acme Corp with minimal info, then create Priya Sharma as a contact linked to it.
→ asking the Project Manager…
The discovery returned only read tools — the CRM write tools (create_company, create_contact, etc.) aren't
surfaced through discovery. That means they're not available for me to call from chat.
I can read CRM data, but I cannot create companies or contacts.
...

C: CRM, please create Acme Corp as a company with minimal info.
→ asking the Sales Agent…
I'll do this (Crm Create Company) — confirm?
[real confirm card, confirmed successfully: "✓ Company 'Acme Corp' created (ID: 1)."]

C: Use priya.sharma@acmecorp.test as her email.
[no prefix — this was a direct correction of the Sales Agent's own pending confirm card, which had just
shown a validation error]
The available tools are all read-only — there are no CRM write tools (create_contact, update_contact, etc.)
discoverable in the CRM group. I cannot create the contact from chat.
...

C: CRM, create a contact named Priya Sharma at Acme Corp with email priya.sharma@acmecorp.test.
→ asking the Sales Agent…
I'll do this (Crm Create Contact) — confirm?
[real confirm card with all fields correct, confirmed successfully: "✓ Contact 'Priya Sharma' created (ID: 1)."]
```

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): — (related to, but distinct from, the already-filed BUG-CRX-007 "domain-inference chat routing never fires on a bare domain question" — that bug is about a FIRST turn with no domain signal at all failing to reach any tool-equipped agent; this bug is about a FOLLOW-UP turn in an already-established domain conversation being silently re-routed away from the correct agent to one that then makes a false capability claim)

## Production report

Reported to production as issue **#120665** (`ztflux`, Tracker Bug, Priority High, assigned to Prashant Chaurasia — user id 410), 2026-09-15. Textile description, no attachments (per updated §4.3a policy). Linked to Run #569, testcase #120490 (`CRUX_AGENT_CRM_SALES.md`, found via TC-CRX-086) — testcase marked Failed.
