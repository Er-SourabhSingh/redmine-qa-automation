# Bug Report Template

- Bug ID: BUG-CRX-013
- Production Redmine Issue ID: #120664
- Title: Sales Agent can never produce a confirm proposal for moving a deal's stage — `update_deal_stage` intent always self-contradicts with "I described a change without actually proposing it"
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux
- Plugin version: 0.39.0 (plugin) / crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP)
- User role: `luna.blossom` (with real CRM plugin access, per TC-CRX-085 precondition)
- Date: 2026-09-15

## Steps to reproduce

1. In an Ask Crux chat session, create a real deal (confirmed working — e.g. "CRM, create a deal called Zenith Corp Upgrade worth $18500 at stage Qualified..." produces a correct confirm card and, on confirm, a real deal).
2. In the same session, ask the Sales Agent to move that deal to a different valid stage, e.g. "CRM, move the Zenith Corp Upgrade deal to the Proposal stage."
3. Observe the response — no confirm card is produced.
4. Retry with different phrasings of the same intent:
   - "CRM, please move the Zenith Corp Upgrade deal (ID:3) to the Proposal stage."
   - "CRM, update deal stage for Zenith Corp Upgrade to Proposal."

## Expected result

- Per TC-CRX-087 and the Sales Agent's own spec, a stage-move request should produce a `Crm Update Deal Stage` (or equivalent) confirm proposal — using `update_deal_stage` specifically rather than a generic field update — which the user can then Confirm to genuinely change the deal's stage.

## Actual result

- Every single attempt (3/3, all routed correctly to "the Sales Agent" per the "CRM," prefix) produced the exact same self-contradictory response instead of a confirm card:

  > "I described a change without actually proposing it, so there's nothing to confirm yet — please tell me again exactly what to change and I'll make it a real, confirmable proposal."

- This is not a routing problem (the Sales Agent was reached correctly each time — confirmed by the "→ asking the Sales Agent…" prefix) and not a phrasing problem (three materially different phrasings all failed identically, while create-deal, create-contact, create-company, and create-lead requests all produced correct confirm cards earlier in the very same session using comparable natural-language phrasing).
- The deal's stage was never changed — deal ID:3 ("Zenith Corp Upgrade") still shows stage "Qualified" on the real `/deals` page after all three attempts.
- This completely blocks a documented, spec'd write capability (`update_deal_stage`) for every phrasing tested. The agent's own error message is also internally confusing — it claims to have "described a change" when in fact nothing resembling a proposal was shown to the user at all, just this bare apology-and-retry message.
- The same self-contradictory response pattern was also seen once during TC-CRX-086 for the first "create a lead" attempt (before a retry succeeded), suggesting this is a broader intermittent failure mode in how the agent decides whether to actually call a write tool vs. just describe an intended change — but for `update_deal_stage` specifically, it was 100% reproducible (3/3) with no successful retry found.

## Evidence

### Screenshot

Not captured — confirmed via live chat transcript text (see Console / log) and cross-checked against the real `/deals` list still showing "Qualified" for Zenith Corp Upgrade after all three attempts.

### Console / log

Chat transcript (session ses-141, 2026-09-15, all three consecutive attempts):

```
C: CRM, move the Zenith Corp Upgrade deal to the Proposal stage.
→ asking the Sales Agent…
I described a change without actually proposing it, so there's nothing to confirm yet — please tell me again exactly what to change and I'll make it a real, confirmable proposal.
(anthropic/claude-haiku-4.5 · 17,681 in / 33 out · $0.0143 est.)

C: CRM, please move the Zenith Corp Upgrade deal (ID:3) to the Proposal stage.
→ asking the Sales Agent…
I described a change without actually proposing it, so there's nothing to confirm yet — please tell me again exactly what to change and I'll make it a real, confirmable proposal.
(anthropic/claude-haiku-4.5 · 17,607 in / 33 out · $0.0142 est.)

C: CRM, update deal stage for Zenith Corp Upgrade to Proposal.
→ asking the Sales Agent…
I described a change without actually proposing it, so there's nothing to confirm yet — please tell me again exactly what to change and I'll make it a real, confirmable proposal.
(anthropic/claude-haiku-4.5 · 17,602 in / 33 out · $0.0142 est.)
```

Real `/deals` page state after all three attempts: row 1, "Zenith Corp Upgrade", USD 18,500.00, Stage "Qualified" (unchanged), Contact "Priya Sharma".

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): — (related to, but distinct from, the domain-routing issue tracked as BUG-CRX-014 — that bug is about reaching the WRONG agent; this bug is about the CORRECT agent, the Sales Agent, failing to produce a real proposal for this specific intent)

## Production report

Reported to production as issue **#120664** (`ztflux`, Tracker Bug, Priority High, assigned to Prashant Chaurasia — user id 410), 2026-09-15. Textile description, no attachments (per updated §4.3a policy). Linked to Run #569, testcase #120490 (`CRUX_AGENT_CRM_SALES.md`, found via TC-CRX-087) — testcase marked Failed.
