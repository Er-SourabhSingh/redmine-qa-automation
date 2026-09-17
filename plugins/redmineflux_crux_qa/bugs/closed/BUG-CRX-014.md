# Bug Report Template

- Bug ID: BUG-CRX-014
- Production Redmine Issue ID: #120665
- Title: A follow-up chat turn without a repeated domain prefix silently mis-routes to the Project Manager agent, which then falsely claims no write tools exist for that domain (reproduced 2026-09-16 in the Workload domain too — not CRM-specific)
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

### 2026-09-16 update — confirmed platform-wide: same mis-routing pattern in the Workload domain (Capacity Agent), not just CRM

While executing `CRUX_AGENT_WORKLOAD_CAPACITY.md`, the identical pattern reproduced with the "Workload," prefix and the Capacity Agent instead of "CRM," and the Sales Agent:

```
C: Please create the Kubernetes skill first, then assign it to luna.blossom in the Platform Engineering team.
[no "Workload," prefix -- a direct continuation of the Capacity Agent's own just-asked clarifying question]
-> asking the Project Manager...
The discovered workload tools are all reads -- no write tools for creating skills or assigning them to
users. Skill creation and assignment are not yet supported from chat in this deployment.
```

This claim was immediately disproven by re-prefixing with "Workload," which reached the Capacity Agent and produced a correct `Workload Skill Create` confirm card that completed successfully. This confirms the bug is not CRM-specific — it is a platform-wide follow-up-routing defect affecting every domain agent, reproduced now in two structurally unrelated plugin domains (CRM/Sales Agent and Workload/Capacity Agent). Severity and title scope updated accordingly; production issue #120665 still accurately describes the underlying mechanism, just with a CRM-specific example.

### 2026-09-16 update — reproduced a fourth time, specifically on `send_email`'s own text-based confirmation step (TC-CRX-099)

While executing TC-CRX-099, the Capacity Agent's own `Workload Send Email` proposal used a non-standard, free-text confirmation format instead of the usual structured `WRITE`/Confirm-Cancel button card every other write tool in this session used:

```
C: Workload, yes, workload 1 (Platform Engineering Sprint 1). Send it now.
-> asking the Capacity Agent...
Proposal: Send workload summary email
Workload: Platform Engineering Sprint 1 (workload_id 1)
Recipient: Redmine Admin (user_id 1)
Confirm to send? (Y/N)
```

Replying with exactly what this prompt asked for -- a bare "Y", with no "Workload," prefix -- mis-routed to "the Project Manager", which falsely claimed:

```
R: Y
C: -> asking the Project Manager...
I don't have an email-sending tool available -- the workload tools I can call are read-only
(capacity snapshots, timesheet lists). Sending emails to team members about their workload
falls outside what I can propose on your behalf.
```

This is a particularly dangerous manifestation of the bug: `send_email` is the one action TC-CRX-099's own spec singles out as needing extra care around explicit, unambiguous confirmation (since it notifies real people) -- yet the agent's own confirmation prompt invites exactly the bare "Y" reply that triggers this mis-routing defect, and the fallback response falsely denies the capability exists at all rather than erroring safely or re-prompting. Re-sending with the "Workload," prefix ("Workload, Y, confirm sending that workload summary email now.") immediately produced the expected structured `Workload Send Email` confirm card (Workload: 1, User Ids: [1]), which completed successfully on confirm ("✓ Workload summary email queued for 1 recipient(s)."). Confirms this defect is not confined to write-intent turns generally -- it also breaks a tool's own bespoke confirmation flow when that flow doesn't repeat the domain prefix.

## 2026-09-16 retest — FIXED (core CRM scenario), confirmed live

Dev's `CHANGES.md` handoff updated `chat.py`'s `_still_awaiting_delegated_action()` and `_route()`: the sticky-continuation check now stays delegated to the SAME agent the prior turn actually engaged (recorded via a new `agent_id` field stored on the assistant turn), not a hardcoded PM fallback — and this check is now evaluated inside `_route()` itself, ahead of the generic write-intent/`_ROUTE_WORDS` fallback that previously let a write-verb-containing continuation ("go ahead and create...") get claimed by the PM route before sticky delegation had a chance.

**Retest (exact original repro):** New chat → `CRM, create a contact named Priya Retest at Acme Retest Corp.` → Sales Agent asked the same clarifying question as the original ("Which would you prefer?..."). Sent the follow-up **without** the "CRM," prefix: `Go ahead and create Acme Retest Corp with minimal info, then create Priya as a contact linked to it.`

**Result:** Routed correctly to **"the Sales Agent"** (not the Project Manager), producing a genuine `Crm Create Company: Acme Retest Corp` write proposal with a real Confirm/Cancel card — the opposite of the original false "I cannot create companies or contacts" claim.

**Verdict: FIXED** for the primary CRM scenario this bug was filed against. **Not independently re-verified this session**: the Workload/Capacity Agent variant and the `send_email` bare-"Y" free-text-confirmation variant (both documented in this bug's 2026-09-16 scope-broadening updates) — the fix is in the same shared `_route()`/sticky-delegation mechanism all domains funnel through, so it should generalize, but wasn't separately re-tested live this pass.

## Production report

Reported to production as issue **#120665** (`ztflux`, Tracker Bug, Priority High, assigned to Prashant Chaurasia — user id 410), 2026-09-15. Textile description, no attachments (per updated §4.3a policy). Linked to Run #569, testcase #120490 (`CRUX_AGENT_CRM_SALES.md`, found via TC-CRX-086) — testcase marked Failed.
