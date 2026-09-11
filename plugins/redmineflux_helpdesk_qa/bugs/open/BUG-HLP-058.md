# BUG-HLP-058

- Bug ID: BUG-HLP-058
- Production Redmine Issue ID: 120540
- Title: REST API's ticket "conversations" reply endpoint correctly triggers the SLA First-Response side effect, but the reply itself is invisible in the customer-facing Helpdesk Conversion log — it lands as a plain Note instead, the opposite of how a genuine UI-driven agent reply behaves
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-11)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: N/A (REST API call, verified via Playwright/UI afterward)
- User role: Administrator (via API key)
- Date: 2026-09-11

## Steps to reproduce

1. Pick an existing ticket with an active SLA and a support level (e.g. #301 — L2, response already breached once, "Waiting for Customer Response").
2. Note its current "Helpdesk Conversion" tab count and SLA Journey/Activity Log state.
3. `POST /helpdesk/api/v1/tickets/301/conversations` with `{"note": "...", "is_private": false}` and a valid API key.
4. Reload the ticket and check the Helpdesk Conversion tab, the Notes tab, and the SLA Information tab's Activity Log.

## Expected result

Per `HELPDESK_REPORTING_AUTOMATION.md` TC-HLP-190, adding a reply via the API should appear "both via the API and in the UI, with the same side effects as a UI-driven reply (status change, SLA pause) where applicable" — i.e. behave like the real branded Reply box, not like a generic Redmine note. Per `HELPDESK_USER_GUIDE.md`/BUG-HLP-015's own established distinction, a genuine agent reply is correctly excluded from the plain Notes tab and reflected in the customer-facing Helpdesk Conversion history instead.

## Actual result

The API call succeeded (`201`, `{"message":"Reply added successfully."}`) and did trigger one real, correct SLA side effect: the ticket's SLA Activity Log gained a genuine new entry — `✓ First Response Given ... Customer notified · Resolution deadline: 09/16/2026 10:25 AM (UTC)` — exactly the kind of side effect TC-190 expects.

**But the reply's own visibility is backwards from a real UI reply**: it does **not** appear in the Helpdesk Conversion tab at all (count stayed at exactly 2, unchanged before/after), and instead shows up as a plain Note under the standard Notes tab — the opposite of the established rule from BUG-HLP-015, where a genuine agent Reply is correctly excluded from Notes and a genuine customer email reply is what's supposed to log to Conversion. The API's reply is neither: it's invisible in the customer-facing communication log a real agent reply would appear in, yet visible in the internal Notes tab a real agent reply is supposed to be excluded from — while still correctly moving the SLA clock forward as if it were a real customer-facing response.

## Evidence

### Console / log

- Before: ticket #301, Helpdesk Conversion tab reads "(2)"; SLA Activity Log has 2 entries (SLA Started, Escalated → L2).
- API call: `POST /helpdesk/api/v1/tickets/301/conversations` `{"note":"TC-HLP-190 API reply test","is_private":false}` → `201` `{"data":{"id":499,"notes":"TC-HLP-190 API reply test","private_notes":false,...},"message":"Reply added successfully."}`
- After, via UI: Helpdesk Conversion tab still reads "(2)" — unchanged. Notes tab (`/issues/301?tab=notes`) shows the new note "TC-HLP-190 API reply test" verbatim. SLA Information tab's Activity Log gained a real 3rd entry: `✓ First Response Given ... Customer notified · Resolution deadline: 09/16/2026 10:25 AM (UTC)`.

## Duplicate check

- Duplicate found: No (checked `bugs/_index.md`/`bugs/_duplicates.md` — distinct from BUG-HLP-015, which is about a customer's own email reply being double-logged; this is about the REST API's reply endpoint landing in the wrong log entirely, for an admin-initiated reply)
- Existing bug reference (if duplicate): —

## Notes

- Found while executing `HELPDESK_REPORTING_AUTOMATION.md` TC-HLP-190 (REST API conversations list/reply).
- Severity judged **Medium**: the SLA mechanics work correctly (the higher-stakes half), but a customer contacting support and getting a reply logged via the API (e.g. through an integration) would never see that reply in their own Helpdesk Conversion history — while an internal Notes viewer would see it as if it were a private/internal note, not a customer-facing reply. This is a real visibility/audit-trail inconsistency, not just a cosmetic one.
- Recommend: route the API's `conversations` reply creation through the same code path the branded UI Reply box uses (which correctly logs to Helpdesk Conversion and excludes Notes), rather than a plain `Issue#init_journal`/notes save that happens to also trigger the SLA first-response hook.
