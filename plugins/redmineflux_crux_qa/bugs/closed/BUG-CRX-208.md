# Bug Report Template

- Bug ID: BUG-CRX-208
- Production Redmine Issue ID: #128967 (reported 2026-11-18, linked to Test Case #120496 / Run #607 / Environment "Window 11 + Chrome", marked Failed, assigned to Prashant Chaurasia, category Crux Plugin)
- Title: generate_invoice silently bills a line item at rate 0 (not the documented DEF-2 fallback of 12/hr) when no team rate or project billing rate is configured — the MCP tool's own fallback-rate warning is now permanently dead code
- Redmine version: 6.0-bookworm
- Plugin name: redmineflux_crux (Invoice Agent) + redmineflux_invoice (native plugin, root cause) + redmineflux-mcp (stale detection logic)
- Plugin version: crux-core 747af39
- Environment: localhost:3015 (local Docker)
- Browser: Chromium (Playwright MCP)
- User role: admin
- Date: 2026-11-18

## Steps to reproduce

Executing TC-CRX-486 (previously BLOCKED on a missing precondition — no customer linked to the project;
that has since been resolved, a customer "Autumn Grace" is now linked via the project's own Billing
Settings page):

1. Confirmed precondition natively: `/projects/crux-invoice-agent-test-project/invoices/billing` shows
   Customer = "Autumn Grace" (linked) and **Project Billing Rate = 0.0** (unset). Team Rates
   (`list_team_rates(project_id=10)`) show rates for 2 other members (Luna Blossom, Daisy Skye) but none
   for `admin` (user_id 1).
2. Confirmed a real time entry exists: 5.0h logged by `admin` on issue #25, 2026-11-03
   (`list_time_entries`).
3. Invoice Agent pinned, fresh chat: "Generate an invoice for the Crux Invoice Agent Test Project covering
   2026-11-01 to 2026-11-05." → confirm card showed `Project`, `Date From: 2026-11-01`, `Date To:
   2026-11-05`. Confirmed.
4. Response: *"✓ Invoice generated: #14 — INV-2026-0014 Client: Autumn Grace
   <autumn.grace@testco-crmtest.local> Period: 2026-11-01 → 2026-11-05 Items: 1 line item(s) Subtotal: 0.0
   Tax: 0.0 Total: 0.0 Status: draft..."* — **no DEF-2 warning anywhere**.
5. Native-verified via `get_invoice(project_id=10, invoice_id=14)`: `Line Items (1): Services by Redmine
   Admin qty:5.0 × 0.0 = 0.0` — the real, persisted line item rate is genuinely **0.0**, not 12.0.

## Expected result

Per the MCP tool's own documented behavior (`redmineflux-mcp/src/tools/invoice.py`, lines 874–887, comment
"DEF-2: detect and warn about the hardcoded 12/hr fallback rate... When no team rates are configured, the
plugin silently bills at 12/hr"), a line item with no team rate should resolve to rate 12.0 and trigger a
`⚠️ WARNING (DEF-2)` block in the response.

## Actual result

- **Root cause, confirmed via direct source read of the native plugin**
  (`redmineflux_invoice/app/controllers/invoices_controller.rb#generate` →
  `TeamRate.rate_for(project_id, user_id)` in `app/models/team_rate.rb`): the fallback chain is no longer
  "team rate, else hardcoded 12.0." It is now:
  1. the user's team rate if one is configured and > 0;
  2. else the project's own `project_billing_rate` if set and > 0;
  3. else **`0.0`**.

  There is no `12.0` anywhere in this method — the hardcoded fallback the MCP tool's comment describes has
  been replaced by this 3-tier chain at some point since that comment was written, and nobody updated the
  MCP side to match.
- Because the real resolved rate here is `0.0`, not `12.0`, the MCP tool's own detection
  (`_fallback_items = [i for i in items if float(i.get("rate", 0)) == _fallback_rate]` with
  `_fallback_rate = 12.0`) can never match it — **this warning code is now permanently dead** for this
  specific failure mode. It would only still fire in the one specific case where a project's billing rate
  happens to be configured to exactly `12.0`, by coincidence, not as a fallback indicator at all anymore.
- **Net effect, and arguably worse than the original DEF-2**: a real, client-facing draft invoice (#14) was
  created for a real 5-hour time entry, billed at **$0 total**, with **zero warning of any kind** — not
  even an inaccurate one. A user relying on the agent's own "✓ Invoice generated... Total: 0.0" message has
  no signal that anything is wrong; DEF-2's original (if confusing) 12/hr at least produced a nonzero,
  noticeably-off number a human might question. A silently-zero invoice is easy to send as-is.

## Evidence

### Console / log

- Chat response (verbatim): `"✓ Invoice generated: #14 — INV-2026-0014 Client : Autumn Grace
  <autumn.grace@testco-crmtest.local> Period : 2026-11-01 → 2026-11-05 Items : 1 line item(s) Subtotal:
  0.0 Tax : 0.0 Total : 0.0 Status : draft Use redmineflux_invoice_send_invoice to mark as sent."`
- Native verification: `redmineflux_invoice_get_invoice(project_id=10, invoice_id=14)` →
  `Line Items (1): Services by Redmine Admin qty:5.0 × 0.0 = 0.0`.
- Native ground truth, Billing Settings page: `Project Billing Rate: 0.0` (spinbutton value, unset);
  `list_team_rates(project_id=10)`: only Luna Blossom (75/hr) and Daisy Skye (90/hr), no entry for admin.
- Source: `redmineflux_invoice/app/models/team_rate.rb`, `rate_for` (lines 17–32) — the real 3-tier
  fallback chain, confirming no `12.0` constant exists anywhere in the current rate-resolution path.
- Source: `redmineflux-mcp/src/tools/invoice.py`, lines 874–887 — the MCP tool's own comment and
  hardcoded `_fallback_rate = 12.0` check, now stale relative to the native code it describes.

## Duplicate check

- Duplicate found: No.
- Existing bug reference: Distinct from the original DEF-2 finding this TC was written to regression-check
  (that finding is about the native plugin itself billing at an undocumented, confusing 12/hr — the code
  path that produced it no longer exists). This is a new, two-part finding: (1) the native fallback chain
  changed to resolve to 0.0 in this configuration, a silent-zero-billing defect in its own right; (2) the
  MCP tool's DEF-2 detection logic is now stale and can never catch this specific failure mode, since it
  only ever checks for the old hardcoded value.

## Retest — 2026-11-18 (FIXED — developer marked "In QA", production #128967)

Developer moved 12 bugs to "In QA." Pulled latest code, rebuilt crux-core/mcp, restarted redmine (full infra
details in BUG-CRX-204's Retest section). Repeated the exact original repro against the same fixture (ticket
#25, 5h logged, still no team/project billing rate configured): "Generate an invoice for the Crux Invoice
Agent Test Project covering 2026-11-01 to 2026-11-05." The response now carries a genuine, specific warning
naming the line item billed at 0/hr, explaining neither a team rate nor a project billing rate is set, and
telling the user to set one and regenerate before sending -- the MCP tool's detection logic has been updated
to match the native plugin's current fallback chain, matching the pulled RMCP-047 backlog spec. Deleted the
resulting draft invoice (#15, $0 total) afterward to leave the fixture clean.

Conclusion: FIXED. Moved to bugs/closed/, production #128967 synced In QA -> Done.
