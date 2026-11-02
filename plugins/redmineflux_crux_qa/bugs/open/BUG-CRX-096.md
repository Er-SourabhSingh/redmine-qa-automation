# Bug Report Template

- Bug ID: BUG-CRX-096
- Production Redmine Issue ID: #125962
- Title: Auto-mode router sends an ambiguously-phrased CRM deal-stage-move request to Project Manager instead of Sales Agent, which then falsely claims no tool exists for it
- Redmine version: 6.0-bookworm (new local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Auto-routing / "Crux (auto)" mode, CRM plugin domain)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-10-29

## Steps to reproduce

1. Set the Ask Crux agent picker to **Auto**.
2. Fresh chat: "can you move the 'EUR Currency Test Deal' to the Qualified stage?" (no "CRM" word, no project named).
3. Observe the reply and routing.
4. **Contrast retest**, fresh chat: "CRM: can you move the 'EUR Currency Test Deal' to the Qualified stage?" (identical request, domain word added).

## Expected result

Auto mode should route a CRM deal-stage-move request to **Sales Agent** (which genuinely has `crm_update_deal_stage`) regardless of whether the user happens to type the word "CRM" — a real salesperson asking to "move a deal" has no reason to know or type the internal domain/agent name every time.

## Actual result

**Without "CRM:" prefix:** Auto routed straight to **Project Manager**, no hand-off card shown at all. Project Manager replied: *"I couldn't find a tool for this here, so I can't do it from this chat. It can be done directly in Redmineflux; if you expected Crux to do it, an administrator can check this deployment's tool setup."* — a false capability denial; the tool genuinely exists and is exposed to Sales Agent.

**With "CRM:" prefix (contrast retest):** Auto routed correctly to **Sales Agent**, which produced a fully correct confirm card (`Write — Crm Update Deal Stage`, `Deal: 2`, `Stage: Qualified`) — confirming the capability genuinely exists and the only variable is which agent Auto hands the request to.

## Evidence

### Console / log

- Without prefix (verbatim): *"I couldn't find a tool for this here, so I can't do it from this chat. It can be done directly in Redmineflux; if you expected Crux to do it, an administrator can check this deployment's tool setup."* — answered by Project Manager.
- With "CRM:" prefix (verbatim): *"I'll do this (Crm Update Deal Stage) — confirm?"* with confirm card `Deal: 2, Stage: Qualified` — answered by Sales Agent.
- DB verified (`rf_crm_deals`): deal id=2 is genuinely "EUR Currency Test Deal", stage "New" — the Sales-Agent-answered confirm card correctly resolved it from the name alone.

## Duplicate check

- Duplicate found: Related but not identical to the already-**closed** `BUG-CRX-014` ("domain-agent mis-routing to the Project Manager, false 'no write tools' claim") from the old Redmine 7.0.0 / crux-core 0.92.0 stack — that bug was fixed/closed on the old environment; this is a new recurrence of the same defect class on the current Redmine 6 / crux-core 0.130.0 stack, CRM domain specifically. The Testcase-Management-domain recurrence of the identical Auto-routing defect class is filed separately as **BUG-CRX-094** (different plugin domain, different fixture, kept in its own file per explicit user instruction rather than one combined bug).

## Retest — 2026-11-02 — STILL OPEN (not fixed)

CRC-71's fix table lists gated Auto-routes only for 094 (QA), 109 (Budget) and 113 (Project Setup) — CRM/Sales
routing (096) is not in its per-bug table, so no fix was expected here. Confirmed still broken: fresh chat, Auto
mode, admin: "can you move the 'EUR Currency Test Deal' to the Qualified stage?" (no "CRM" word) — routed to
**Project Manager**, which replied: *"I don't have tools to manage CRM deals or pipeline stages in this chat...
ask an admin whether there's a CRM agent available in Ask Crux for that task."* — still a false/uncertain
capability denial, still never reaches Sales Agent. **Not fixed.**

## Retest — 2026-11-02 (3rd round) — STILL OPEN (not fixed)

Pulled crux-core `3812e0f→65053f8` (CRC-74, "agent audit — Auto routing gaps..."). CRC-74's own changelog lists
"Show me the sales pipeline" as the one CRM-routing fix in this batch — "move the deal to X stage" phrasing is not
among its 46 re-tested questions. Re-ran the exact original repro, Auto mode, admin, fresh chat: "can you move the
'EUR Currency Test Deal' to the Qualified stage?" — still routes to **Project Manager**, now with a flatter
denial than before: *"I couldn't find a tool for this here, so I can't do it from this chat..."* Never reaches
Sales Agent. **Not fixed.**
