# BUG-HLP-023

- Bug ID: BUG-HLP-023
- Production Redmine Issue ID: 119771
- Title: ~~Deleting a Holiday currently attached to an SLA's Holidays field succeeds with no dependency warning~~ — **CLOSED: Not a Bug, per explicit user product-judgment review (see Resolution below)**
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-01)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-01
- Closed: 2026-09-03 (per explicit user product-judgment review)

## Steps to reproduce

1. Holiday "Alpha Founders Day 2026" is attached to SLA "Alpha CRUD Test SLA Full (Required-Only Edit)"'s Holidays field.
2. Go to Project → Helpdesk → Settings → Holiday tab, click Delete on "Alpha Founders Day 2026", confirm the generic "Are you sure?" modal.
3. Reopen the SLA's detail page and check its Holiday field.

## Expected result

Per `HELPDESK_SLA_ESCALATION.md` TC-HLP-364 (mirroring the already-fixed BUG-HLP-011 pattern for Organization delete): deletion should be refused, or the confirmation modal should identify the dependency ("this holiday is attached to N SLA(s)") before the admin confirms — not a plain generic warning identical to deleting an unattached record.

## Actual result

Deletion succeeded immediately ("Successful deletion.") with the same generic confirmation modal used for the already-unattached holiday deleted moments earlier in the same session — no distinction, no dependency count, no warning that an SLA references it. Reopening the SLA's detail page afterward showed its Holiday field silently changed from "Alpha Founders Day 2026" to **"-"** — a graceful clear rather than a dangling/broken reference (Holiday is not a required SLA field, so this doesn't produce an invalid record the way BUG-HLP-022 did for Support Level), but the admin has no way to know this happened without independently reopening every SLA that might have referenced it.

## Resolution — CLOSED, Not a Bug (2026-09-03)

**Determined to be acceptable behavior, per explicit user product-judgment review.** Rationale:

- Holiday is an **optional** field on an SLA, not a required one — unlike Support Level (BUG-HLP-022), which a customer's project-access row cannot function without, an SLA missing its Holiday reference is still a fully valid, fully functional record. The working-hours clock simply stops excluding that holiday's dates; nothing breaks, no invalid state results, no other feature silently misbehaves.
- The delete already degrades gracefully — confirmed in the original finding — the SLA's Holiday field cleanly clears to "-" rather than pointing at a now-nonexistent record. There is no dangling reference, no orphaned foreign key, no broken UI state anywhere downstream.
- Given both of those, a warning modal here would be defending against a scenario that has no real consequence: the admin loses a convenience notice, not correctness or data integrity. The user's own framing: since deleting an optional, gracefully-clearing field doesn't cause any actual issue, this doesn't rise to the level of a defect worth a warning gate — it's consistent, low-risk, expected behavior for an optional dependency.
- Contrast deliberately kept in mind: BUG-HLP-022 (Support Level delete, same missing-warning shape) stays open, because Support Level is a required field and its silent deletion does produce an invalid customer project-access row — a materially different, worse outcome than this Holiday case.

## Evidence

### Console / log

- Delete request returned a plain "Successful deletion." flash message; no error. SLA #6's own detail page confirmed the Holiday field reads "-" immediately afterward.

## Duplicate check

- Duplicate found: No (checked `bugs/_duplicates.md` — empty register)
- Existing bug reference (if duplicate): — (same defect *shape* as BUG-HLP-022, which stays open — Support Level is a required field, Holiday is not, hence the different outcome here)

## Notes

- Found while executing `HELPDESK_SLA_ESCALATION.md` TC-HLP-364 (2026-09-01), immediately after confirming the same unattached-holiday-deletes-cleanly half of the same TC (PASS).
- Originally filed at Low severity, itself already noting "the SLA gracefully shows 'no holiday' rather than a broken reference, and Holiday was never a required field" — the same reasoning the user's closure decision confirms should have been weighed as a full "not a bug" outcome from the start, not just a severity-lowering note.
