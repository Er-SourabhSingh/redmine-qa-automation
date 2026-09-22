# BUG-HLP-022

- Bug ID: BUG-HLP-022
- Production Redmine Issue ID: 119755
- Title: Deleting an SLA or Support Level that is only referenced by a customer's project-access row (no ticket yet) succeeds silently and orphans that row into an invalid state
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-01)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-01

## Revision History

- **2026-09-01, broadened same day per user follow-up question** ("sla deletion check when only assigned in customer with project"). The original finding only covered **Support Level** deletion. Re-tested the identical scenario for **SLA** deletion specifically isolating the customer-only case (no ticket referencing it) — TC-HLP-361 had only ever tested an SLA also in use by a real ticket, where deletion is correctly blocked ("assigned to one or more issues"). With a fresh SLA referenced **only** by a customer's project-access row (User Count: 1, zero tickets), deletion succeeded just as silently as Support Level's did, confirming the dependency check on both entities looks at ticket/issue usage only, never at `RfProjectCustomer` (customer project-access) usage. Title and scope broadened to cover both entities under one bug, since they share the same root cause. TC-HLP-361's own evidence note in `HELPDESK_SLA_ESCALATION.md` needs a follow-up caveat that its PASS verdict only covered the ticket-in-use case, not this one.

## Steps to reproduce

**Support Level (original finding):**
1. Create a Support Level ("Alpha Delete-Guard Test Level", Level Order 9, assignee No Perm Reporter) on Helpdesk QA Alpha.
2. Edit an existing customer's (`alpha.customer`) Helpdesk QA Alpha project-access row: set Support Level to this new level (SLA field left at its existing real value, "Alpha Escalation Test SLA"). Save.
3. Go to Project → Helpdesk → Settings → Support Level list, click Delete on "Alpha Delete-Guard Test Level", confirm the generic "Are you sure?" modal.
4. Reopen `alpha.customer`'s Edit form and inspect the same project-access row.

**SLA (added on revision):**
1. Create an SLA ("Alpha SLA Delete-Guard Customer-Only Test", 30/30-min targets) on Helpdesk QA Alpha.
2. Edit `retest.customer1`'s Helpdesk QA Alpha project-access row: set SLA Name to this new SLA (Support Level left at its existing real value, L2). Save. Confirm on the SLA list that User Count reads "1" and no ticket currently uses this SLA.
3. Go to Project → Helpdesk → SLA list, click Delete on it, confirm the generic "Are you sure?" modal.
4. Reopen `retest.customer1`'s Edit form and inspect the same project-access row.

## Expected result

Per `HELPDESK_SLA_ESCALATION.md` TC-HLP-361/297 (mirroring the already-fixed BUG-HLP-011 pattern for Organization delete): deletion of an SLA or Support Level that a customer's project-access row currently references should be refused (or require explicit confirmation of the consequence) with a clear message identifying the dependency — the same way deleting an SLA that's in use by a real **ticket** is already correctly refused ("This SLA cannot be deleted because it is currently assigned to one or more issues."). At minimum, if deletion is allowed, the customer's row should not be left in a state the Customer form's own validation would otherwise refuse to save directly.

## Actual result

**Both entities**, when referenced only by a customer's project-access row (no ticket), delete with no warning of any kind — the confirmation modal is the same generic "Are you sure you want to delete... this action cannot be undone" used for uninvolved records, and the actual delete request returns "Successful deletion." with no server-side dependency check at all. This is in direct contrast to SLA deletion when a real **ticket** references it, which correctly blocks — proving the check exists but only looks at `Issue`/ticket associations, never `RfProjectCustomer` (customer project-access) associations, for either entity.

Reopening the affected customer's Edit form afterward shows the row silently corrupted, mirror-image for each entity:
- **Support Level case** (`alpha.customer`): Support Level reset to "None", **SLA Name still set** to a real value ("Alpha Escalation Test SLA").
- **SLA case** (`retest.customer1`): SLA Name reset to "None", **Support Level still set** to a real value ("L2" — reselected before this deletion attempt).

Both are genuinely invalid combinations — confirmed via `HELPDESK_SLA_ESCALATION.md` TC-HLP-342 (tested the same day) that the Customer New/Edit form's own validation refuses to save a row with one of these fields set and the other at "None," in either direction. The deletion path bypasses that validation entirely and produces exactly the state the form itself is designed to prevent, with zero indication to the admin that the customer's entitlement had silently changed.

## Evidence

### Screenshot

![alpha.customer's Edit form after the Support Level deletion — SLA Name still "Alpha Escalation Test SLA", Support Level silently reset to "None"](../../screenshots/BUG-HLP-022/bug-hlp-022-support-level-deleted-silently-orphans-customer-row.png)

*(The SLA-side repro on `retest.customer1` — SLA reset to "None", Support Level still "L2" — was confirmed via direct form inspection at the time but no separate screenshot was captured for that specific pass; the underlying mechanism and resulting row state are identical to the screenshot above, just the two fields swapped.)*

### Console / log

- No error in the browser console for either entity; the delete request returns a plain "Successful deletion." flash message both times, confirming this is not a crash — it is a genuine missing dependency check, and it's consistent between SLA and Support Level.
- Contrast case (SLA correctly blocked, for comparison): deleting an SLA that a real **ticket** uses returns "This SLA cannot be deleted because it is currently assigned to one or more issues." — proving the check mechanism exists and works, it just never considers customer project-access rows as a dependency.

## Duplicate check

- Duplicate found: No (checked `bugs/_duplicates.md` — empty register)
- Existing bug reference (if duplicate): — (related in spirit to the already-closed BUG-HLP-011, which added exactly this kind of dependency warning for Organization delete — neither SLA nor Support Level was ever given the equivalent protection for the customer-project-access-only case)

## Notes

- Found while executing `HELPDESK_SLA_ESCALATION.md` TC-HLP-362 (2026-09-01), then broadened to SLA per a user follow-up question later the same session. The Support Level TC's original precondition (`beta.customer` → AB-L1) turned out to be stale — `beta.customer` does not currently exist on this environment (never recreated after the 2026-08-27 full DB reset), so an initial attempt against the real `AB-L1` level did NOT actually test the in-use case (it had zero real dependents, so its own "Successful deletion" was correct behavior, not a bug — re-scoped in the TC's own evidence note). Rebuilt the test properly with a disposable level genuinely attached to a real customer row before concluding this is a real defect. The SLA-side test used a fresh, dedicated SLA and `retest.customer1` specifically to isolate the customer-only case cleanly (distinct from TC-HLP-361's ticket-in-use case, which correctly blocks).
- Severity judged Medium: matches BUG-HLP-011's original severity rating for the same defect shape on a different entity (Organization), which was fixed. This one silently corrupts a customer's entitlement data rather than crashing, and requires an admin to happen to delete an SLA/Support Level that's still referenced by a customer (but not yet by any ticket) — a real, confirmed data-integrity gap, and arguably *more* likely to occur in practice than the ticket-in-use case, since a customer can be configured with an SLA/level well before their first ticket ever uses it.
- `alpha.customer`'s Support Level was restored to `L1` and `retest.customer1`'s SLA/Support Level restored to `Alpha Escalation Test SLA`/`L2` (their respective original real values) after these tests to leave both fixtures in a clean state for future sessions.

## Retest — PARTIALLY FIXED (2026-09-10)

- Production issue #119755 found marked "In QA" (developer checked in a fix), triggering this retest per the user's request to retest all checked-in Helpdesk bugs on `localhost:3012`.
- **Support Level half: CONFIRMED FIXED.** Created a disposable Support Level ("BUG-HLP-022 retest Support Level", id 11) via `rails runner` (setup only, since the Support Assignees multiselect widget isn't reliably drivable via Playwright MCP — see plugin memory), assigned it to `alpha.customer`'s Helpdesk QA Alpha project-access row via the live Customer Edit form, then clicked Delete on it from the live Support Level list. **Result: blocked** — *"This support level cannot be deleted because it is currently assigned to a customer."* The level remained in the list, undeleted.
- **SLA half: STILL BROKEN.** Created a disposable SLA ("BUG-HLP-022 retest SLA", id 29) via `rails runner`, assigned it to `retest.customer1`'s Helpdesk QA Alpha project-access row via the live Customer Edit form (confirmed User Count showed "1" on the SLA list beforehand), then clicked Delete on it from the live SLA list. **Result: NOT blocked** — "Successful deletion." with no dependency message, identical to the original bug. Reopened `retest.customer1`'s Edit form afterward and confirmed the row is orphaned exactly as originally reported: SLA Name silently reset to "None", Support Level still showing the real value "L2".
- **Verdict: this bug is only half-fixed.** The dependency check was added for Support Level deletion (now correctly considers customer project-access usage, not just ticket usage) but the equivalent check was never added for SLA deletion — the SLA side still has the exact original defect. Recommend re-flagging this issue as not fully resolved before it's marked done upstream.
- Cleanup performed: `retest.customer1`'s SLA field restored to "Alpha Escalation Test SLA"; `alpha.customer`'s Support Level restored to "L1"; disposable Support Level (id 11) deleted (successfully, once no longer referenced); disposable SLA (id 29) no longer exists (deleted by the bug itself during this retest — that's the confirmed-still-broken behavior, not cleanup).
- Per user instruction, production issue #119755's status was left untouched — only this local file and `bugs/_index.md` were updated. This bug stays in `bugs/open/` since it is not fully fixed.

## Retest — Re-verified against developer's note, SLA half confirmed STILL BROKEN (2026-09-10, deliberate re-check)

- The retest above (2026-09-10, "PARTIALLY FIXED") was done *before* the developer's note on production issue #119755 had been read. The developer's note says: *"SLAs already had a safeguard that stops you from deleting one that's currently assigned to a customer. Support Levels never had that same safeguard... Fixed: deleting a Support Level now checks the same thing SLAs already check."* This claims the SLA-side customer-only protection **already existed before this fix** — which, if true, would mean the original SLA-side finding in this bug was itself wrong. That claim was re-verified deliberately, from scratch, rather than assumed correct.
- Created a fresh SLA ("BUG-HLP-022 re-verify SLA customer-only", id 30, live via the New SLA form — not a backend shortcut), assigned it to `retest.customer1`'s Helpdesk QA Alpha project-access row via the live Customer Edit form, confirmed User Count read "1" on the SLA list (no ticket references it), then clicked Delete on it from the live SLA list.
- **Result: "Successful deletion."** — no dependency block, no warning of any kind. This directly contradicts the developer's claim that SLAs "already had a safeguard" for the customer-only case; whatever pre-existing SLA safeguard the developer is referring to only covers the ticket-in-use case (confirmed correctly working elsewhere in this bug's own evidence), not the customer-project-access-only case this bug is actually about.
- Reopened `retest.customer1`'s Edit form afterward: confirmed the row is orphaned in exactly the same way as both the original 2026-09-01 finding and the first 2026-09-10 retest — SLA Name silently reset to "None", Support Level still showing the real value "L2".
- **Verdict unchanged, now independently re-confirmed twice: the SLA half of this bug is still broken.** The developer's note is only accurate for the Support Level half (independently confirmed fixed, see the retest above) — its description of SLA's baseline behavior is not accurate for this specific scenario, and should not be taken at face value when triaging.
- Cleanup: `retest.customer1`'s SLA field restored to "Alpha Escalation Test SLA"; the disposable SLA (id 30) no longer exists (deleted by the bug itself during this retest, not cleanup).
- A follow-up note was added to production issue #119755 documenting this specific contradiction, so the developer has accurate information the next time this is picked up.
- Production issue #119755 updated 2026-09-10: status In QA → **Reopen**, since the SLA half of this bug remains confirmed broken and the fix as checked in does not resolve the full scope of the issue. This bug stays in `bugs/open/`.

## Retest — SLA half CONFIRMED FIXED, both halves now resolved (2026-09-21, production issue #119755 checked in again)

**FIXED — the SLA-side dependency check is now genuinely implemented, matching the Support Level half. Moved to closed/.**

- Created a fresh SLA ("BUG-HLP-022 retest v2 - customer-only delete guard", id 35, live via the New SLA form), assigned it to `retest.customer1`'s Helpdesk QA Alpha project-access row via the live Customer Edit form, confirmed User Count read "1" on the SLA list (no ticket references it), then clicked Delete on it.
- **Result: blocked** — flash message `"This SLA cannot be deleted because it is currently assigned to a customer."`, the exact same message pattern the Support Level half already used. Confirmed directly via `rails runner` (`RfSla.where(id: 35).exists?` → `true`) that the SLA genuinely still exists — this is a real server-side block, not a silently-swallowed error with a misleading success message.
- Both halves of this bug (Support Level, confirmed fixed 2026-09-10; SLA, confirmed fixed today) now correctly refuse deletion when only referenced by a customer's project-access row, matching the already-fixed BUG-HLP-011 pattern for Organization delete that this bug was always meant to mirror.
- Cleanup: `retest.customer1`'s SLA field restored to "Alpha Escalation Test SLA" (her original real value); the disposable SLA (id 35) deleted cleanly once no longer referenced (confirmed via `rails runner`, `RfSla.where(id: 35).exists?` → `false`).
- Production issue #119755 synced 2026-09-21: Status In QA → **Done**, % Done → **100**.
