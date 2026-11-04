# Bug Report Template

- Bug ID: BUG-CRX-153
- Production Redmine Issue ID:
- Title: Support Agent's `update_ticket` cannot resolve "High" priority to a valid id — guesses `priority_id: 2`
  then `3` across 3 attempts, including one genuine tool-check, none of which match the real active
  `IssuePriority` ids (6=low, 7=medium, 8=high, 9=immediate) on this install
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Support Agent, Helpdesk plugin domain — redmineflux_helpdesk)
- Plugin version: 6.2.0 (Redmineflux Helpdesk plugin)
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-04

## Steps to reproduce

1. As admin, Support Agent pinned, in the chat already scoped to ticket #28: "Update the printer ticket's
   (#28) priority to High and add a due date of 2026-01-01." Confirm card: `Priority: 2`, `Ticket: 28`,
   `Due Date: 2026-01-01` — no tool-check indicator shown, meaning this was a pure guess, not a lookup.
   Confirmed → `"Validation error: Priority cannot be blank"` (see BUG-CRX-154 for the agent's handling of this
   failure).
2. Retried with a corrected, future due date (2026-12-01) and the same `priority_id: 2` still unchanged on the
   confirm card. Confirmed → identical `"Validation error: Priority cannot be blank"` — proving the real cause
   was never the date.
3. Told the agent explicitly the date was never the problem and to investigate the real cause. This time it
   showed "Checked 1 thing" (a genuine tool call) and proposed `priority_id: 3` — still wrong.
4. Verified the real active `IssuePriority` enumeration directly via the native REST endpoint
   (`/enumerations/issue_priorities.json`, admin-authenticated): `id=6: low`, `id=7: medium`, `id=8: high`,
   `id=9: immediate` — "High" is genuinely id **8**. None of the agent's three attempts (2, 2, 3) ever matched.

## Expected result

Asking the Support Agent to set a ticket's priority to a named value ("High") should resolve to the real,
currently-active priority id for that name on this install (8), either via a lookup tool call or a correct
static mapping — not a guessed value that happens to not exist at all.

## Actual result

The agent proposed invalid priority ids across all 3 attempts (2, 2, 3) — none of which correspond to any real
`IssuePriority` row on this install (only 6/7/8/9 exist) — causing every attempt to fail server-side with
`"Priority cannot be blank"` (Rails treats a foreign key referencing a nonexistent row as blank for presence
validation purposes). Even the one attempt that visibly performed a genuine tool check still landed on an
invalid id (3), suggesting either the wrong tool/endpoint is being consulted internally, or its result is being
misapplied. Same general shape as the already-documented wrong-ID-hallucination family on other domains
(BUG-CRX-079/102/052/etc.), but the first instance where the agent could not produce a valid id even after an
explicit, pointed correction and a genuine tool check.

## Evidence

### Console / log

- Attempt 1 confirm card: `Priority: 2`, no "Checked" indicator (pure guess).
- Attempt 2 confirm card (after date correction): `Priority: 2` unchanged — identical `"Priority cannot be
  blank"` failure, confirming the date was never the cause.
- Attempt 3 confirm card (after explicit correction request): `"▸ Checked 1 thing"` shown, `Priority: 3`.
- Native ground truth, `/enumerations/issue_priorities.json`: `{"issue_priorities":[{"id":6,"name":"low",...},
  {"id":7,"name":"medium",...},{"id":8,"name":"high",...},{"id":9,"name":"immediate",...}]}`.
- Ticket #28 confirmed unaffected throughout (native-verified): Priority remained `low`, Due Date remained
  empty — no partial/corrupted write occurred since Rails rejected the save each time.

## Duplicate check

- Duplicate found: No. First finding on the Support Agent / Helpdesk plugin domain's priority-resolution path.
  Same general wrong-ID-hallucination defect class as BUG-CRX-079 (QA Agent/Test Case Management) and
  BUG-CRX-102 (Scrum Agent/`create_issue`), but neither of those fixes' scope covers the Helpdesk domain's
  `update_ticket` tool. Filed separately per the repo's established one-bug-per-domain-recurrence convention.
  Not a duplicate of BUG-CRX-154 (same root incident, but that bug is about the agent's false root-cause
  diagnosis of the resulting failure, a distinct mechanism).
