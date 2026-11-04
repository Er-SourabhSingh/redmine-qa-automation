# Bug Report Template

- Bug ID: BUG-CRX-151
- Production Redmine Issue ID:
- Title: Posting a public reply via Support Agent's `add_conversation` moves the ticket to "Waiting for
  Customer Response" correctly, but does NOT actually pause the SLA clock — the response deadline keeps
  counting down unchanged, contradicting the vendor-documented behavior
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Support Agent, Helpdesk plugin domain — redmineflux_helpdesk)
- Plugin version: 6.2.0 (Redmineflux Helpdesk plugin)
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-04

## Steps to reproduce

1. Fixture: Ticket #28 ("Printer not connecting to network") on project #12, assigned to admin at
   2026-11-04 05:53 AM UTC, which genuinely started its SLA (SLA "Crux Helpdesk Standard SLA" — 60 min first
   response / 4h resolution) — response deadline set to 2026-11-04 06:53 AM UTC, native-verified on the
   ticket's own SLA Information tab (status "✓ On Track").
2. As admin, Support Agent pinned: "Reply to ticket 28: '...' Send this to the customer." — confirm card
   correctly showed `Ticket: 28`, the note text, and `Send Customer Reply: True` (no `private_note` row,
   implying default false — a genuine public reply). Confirmed.
3. Result: "✓ Reply added successfully."
4. Native-verified ticket #28's Status field: genuinely changed to **"Waiting for Customer Response"** — this
   half of the documented behavior works correctly.
5. Checked the SLA state two ways immediately after: (a) native ticket page, SLA Information tab — still
   shows "✓ On Track", "about 1 hour left", "Due: 11/04/2026 06:53 AM (UTC)" — the exact same deadline as
   before the reply, with no pause indicator; (b) asked the Support Agent directly: "What's the SLA status for
   ticket 28 right now, specifically is it paused?" — it called `get_sla_status` and reported: *"Ticket #28's
   SLA is **not paused** — it's **active**. The response deadline is 2026-11-04 06:53:08 UTC (about 1 minute
   of elapsed time so far), and neither response nor resolution has breached yet."*

## Expected result

Per the vendor's own documented automation rule ("An agent's Reply Note sets the ticket to Waiting for
Customer Response and pauses the SLA"), confirming this reply should have both (a) transitioned the status
(it did) AND (b) paused the SLA clock (`is_paused: true`, response/resolution timers frozen until the customer
replies). Both halves of this single documented behavior should be atomic — one should not happen without the
other.

## Actual result

Only the status-transition half of the behavior genuinely works. The SLA pause half silently does not happen:
`get_sla_status` explicitly reports `is_paused: false` / "active" immediately after the reply, with the
original, unpaused deadline unchanged. A ticket sitting in "Waiting for Customer Response" for longer than the
SLA window (here, 60 minutes) would incorrectly accumulate a real SLA breach while genuinely waiting on the
customer to respond — exactly the scenario the pause mechanism exists to prevent. This is reachable both via
the Support Agent (tested here) and, since it's a plugin-level business rule rather than an agent-specific
one, very likely via the native web UI's own reply form too (not independently re-tested natively in this
session, flagged for a follow-up native-UI check in `redmineflux_helpdesk_qa`).

## Evidence

### Console / log

- Confirm card (verbatim): `Ticket: 28`, `Note: "Thanks for reporting this — can you confirm the printer's
  model and whether other devices can reach the WiFi network?"`, `Send Customer Reply: True`.
- Post-confirm result: `✓ Reply added successfully.`
- Native ticket page, Status field: `Waiting for Customer Response` (confirmed changed from `open`/unassigned
  state at ticket creation).
- Native SLA Information tab, immediately after the reply: `✓ On Track`, SLA Journey row 1 ("Initial Stage ●
  Current") shows `⏱ about 1 hour left | Due: 11/04/2026 06:53 AM (UTC)` — unchanged from the deadline set at
  assignment time (05:53 AM + 60 min).
- Agent's own `get_sla_status` tool call result (verbatim): *"Ticket #28's SLA is not paused — it's active.
  The response deadline is 2026-11-04 06:53:08 UTC (about 1 minute of elapsed time so far), and neither
  response nor resolution has breached yet."*

## Duplicate check

- Duplicate found: No. First finding on the Support Agent / Helpdesk plugin domain — this is a new suite
  (`testcases/CRUX_AGENT_HELPDESK.md`, started 2026-11-04). Not related in mechanism to any Workload/KB/
  Invoicing bug found this cycle (BUG-CRX-144 through 150) — this is a distinct plugin's own documented
  automation rule, found to be only half-implemented.
