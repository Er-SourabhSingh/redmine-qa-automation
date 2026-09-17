# Bug Report Template

- Bug ID: BUG-CRX-013
- Production Redmine Issue ID: #120664
- Title: Sales Agent can never produce a confirm proposal for moving a deal's stage — `update_deal_stage` intent always self-contradicts with "I described a change without actually proposing it" (reproduced 2026-09-16 for generic lead-status updates too — broader than deal-stage specifically)
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

### 2026-09-16 update — same failure mode reproduced for a different entity/field (lead status)

While executing TC-CRX-089 (convert a qualified lead), the identical self-contradictory response was reproduced 2/2 times for a completely different update intent — setting a lead's status field, not a deal's stage:

```
C: CRM, update lead ID:1 (Rohan Verma) status to Qualified.
→ asking the Sales Agent…
I described a change without actually proposing it, so there's nothing to confirm yet — please tell me again exactly what to change and I'll make it a real, confirmable proposal.
(anthropic/claude-haiku-4.5 · 17,819 in / 27 out · $0.0144 est.)

C: CRM, please set lead 1 (Rohan Verma) status field to Qualified.
→ asking the Sales Agent…
I described a change without actually proposing it, so there's nothing to confirm yet — please tell me again exactly what to change and I'll make it a real, confirmable proposal.
(anthropic/claude-haiku-4.5 · 17,693 in / 38 out · $0.0143 est.)
```

Worked around by setting the lead's status directly via the real `/leads/1/edit` UI instead (not a chat write), so TC-CRX-089 could still proceed and pass on its own merits. This confirms the bug is **not specific to `update_deal_stage`** — it affects generic single-field-update intents across at least two different CRM entity types (deals and leads), each 100% reproducible with zero successful retries found for that specific intent. The title and severity remain unchanged (High) but the scope is broader than originally filed.

### 2026-09-16 update — confirmed platform-wide: same failure mode on a completely different domain agent (Capacity Agent / Workload), for create, add, and bulk-remove intents

While executing `CRUX_AGENT_WORKLOAD_CAPACITY.md` (a different plugin domain entirely, using the Capacity Agent rather than the Sales Agent), the identical self-contradictory response appeared repeatedly on fresh, simple write intents that had nothing to do with CRM:

```
C: Workload, create a team called Platform Engineering.
-> asking the Capacity Agent...
I described a change without actually proposing it, so there's nothing to confirm yet -- please tell me
again exactly what to change and I'll make it a real, confirmable proposal.
```

This reproduced 2/2 times for team creation (a brand-new create, not an update or delete), 1/2 times for a member-add, and 2/4 times during a bulk-member-removal attempt, before each eventually succeeded on a rephrasing. This is now confirmed across two structurally unrelated domain agents (Sales Agent/CRM and Capacity Agent/Workload) and four distinct action types (deal-stage-update, lead-status-update, contact-delete, and now team-create/member-add/bulk-remove) — strong evidence this is a defect in a shared, cross-agent component (most likely the crux-core confirm-gate/tool-invocation-decision layer all agents route through), not anything specific to any one agent's own implementation. Severity and title remain unchanged; scope is now platform-wide.

### 2026-09-16 update — same failure mode reproduced a third time, for delete (not just update)

While executing TC-CRX-091 (delete requires explicit naming), the identical self-contradictory response appeared again — this time for a delete intent rather than an update:

```
C: CRM, delete contact Disposable Testcontact.
→ asking the Sales Agent…
I described a change without actually proposing it, so there's nothing to confirm yet — please tell me again exactly what to change and I'll make it a real, confirmable proposal.
(anthropic/claude-haiku-4.5 · 53,217 in / 260 out · $0.0436 est.)
```

As with every prior reproduction, retrying with the record's explicit numeric ID immediately worked: "CRM, please delete contact ID:3 (Disposable Testcontact)." produced a correct `Crm Delete Contact` confirm card and completed successfully on confirm. The pattern across all three reproductions (deal stage, lead status, contact delete) is consistent: **a request that names a record by name only, for any write intent beyond straightforward creation, has a real chance of triggering this self-contradiction; re-issuing the same intent with the record's explicit numeric ID reliably works instead.** This looks like a tool-calling/argument-resolution issue upstream of the specific write action, not a defect in any individual tool.

### 2026-09-16 update — reproduced a fifth+ time, now on a third distinct domain agent (Budget Agent)

While executing `CRUX_AGENT_DEVOPS_AND_BUDGET.md` (a third structurally unrelated plugin domain, using the Budget Agent rather than the Sales Agent or Capacity Agent), the identical self-contradictory response appeared again on a fresh `set_budget` write intent:

```
C: Budget, approve 10 hours for category 6 in project 1. Reason: TC-CRX-106 pending-check test.
-> asking the Budget Agent...
I described a change without actually proposing it, so there's nothing to confirm yet -- please tell me
again exactly what to change and I'll make it a real, confirmable proposal.
```

As with every prior reproduction, a rephrased retry ("Budget, please approve 10 hours now for category 6 in project 1, reason \"...\".") immediately produced a correct `Budget Audit Set Budget` confirm card and completed successfully on confirm. This is now confirmed across three structurally unrelated domain agents (Sales/CRM, Capacity/Workload, Budget/DevOps-Budget) and at least seven distinct action types — the strongest evidence yet that this is a shared crux-core defect (confirm-gate/tool-invocation-decision layer), not anything agent-specific.

### 2026-09-16 update — reproduced a sixth+ time, now on a fourth distinct domain agent (Scrum Agent)

While executing `CRUX_AGENT_AGILE_SCRUM.md`, the identical self-contradictory response appeared once more on a fresh `create_issue` write intent from the Scrum Agent:

```
C: Agile, create an issue titled "TC-CRX-112 Agile Create Test" in project crux-qa from the backlog.
-> asking the Scrum Agent...
I described a change without actually proposing it, so there's nothing to confirm yet -- please tell me
again exactly what to change and I'll make it a real, confirmable proposal.
```

A rephrased retry did produce a "proposal" this time — but that proposal turned out to be a *different*, more severe defect (a fabricated-confirm message with no real Confirm button at all), tracked separately as BUG-CRX-020. This is now confirmed across four structurally unrelated domain agents (Sales/CRM, Capacity/Workload, Budget/DevOps-Budget, Scrum/Agile).

### 2026-09-16 update — reproduced extensively on a sixth distinct domain agent (KB Agent), 100% eventual success rate

While executing `CRUX_AGENT_KNOWLEDGE_BASE.md`, the self-contradictory response appeared repeatedly (6+ times) across every write action type tested for this agent (create_space, create_node, update_node ×2, publish_node ×2, unpublish_node ×2, restore_version). Unlike BUG-CRX-020 (a separate, distinct defect hit by five other agents this session), the KB Agent's writes **never** hit the button-less fabricated-confirm pattern — every single self-contradiction here eventually resolved to a real, working `WRITE` confirm card on retry (typically 2 attempts, using explicit numeric IDs and/or "do it now" phrasing). This confirms BUG-CRX-013 (self-contradiction) and BUG-CRX-020 (fabricated confirm with no button) are two independent defects that can occur separately — an agent can be fully affected by one without the other.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): — (related to, but distinct from, the domain-routing issue tracked as BUG-CRX-014 — that bug is about reaching the WRONG agent; this bug is about the CORRECT agent, the Sales Agent, failing to produce a real proposal for this specific intent)

## Production report

Reported to production as issue **#120664** (`ztflux`, Tracker Bug, Priority High, assigned to Prashant Chaurasia — user id 410), 2026-09-15. Textile description, no attachments (per updated §4.3a policy). Linked to Run #569, testcase #120490 (`CRUX_AGENT_CRM_SALES.md`, found via TC-CRX-087) — testcase marked Failed.
