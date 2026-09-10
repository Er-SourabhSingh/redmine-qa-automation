# BUG-HLP-011

- Bug ID: BUG-HLP-011
- Production Redmine Issue ID: 119657
- Title: An organization linked to a customer can be deleted with only a generic "are you sure" prompt — no warning that a customer is linked, silently clearing the customer's Organization reference
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-08-27)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-08-27

## Steps to reproduce

1. Create an organization (reproduced: "Gamma Corp", id=4).
2. Create a customer with a project-access row referencing that organization (reproduced: `gamma.customer`, Helpdesk QA Beta / Beta Standard SLA / AB-L1 / Gamma Corp).
3. From the Organization list, click **Delete** on that organization.
4. Confirm the modal that appears.
5. Open the customer's own detail page (Customer 360) and its project-access row.

## Expected result

- Per the plugin's own intended behavior (this is what the correlated test case, TC-HLP-120, was written to verify): deleting an organization that customers are linked to should either be refused outright, or the confirmation should explicitly warn about the consequence (e.g. "This organization has 1 linked customer — deleting it will remove that association"). At minimum, a real user should not be able to accidentally destroy this link with the same generic confirmation used for an organization with zero customers.

## Actual result

- The delete confirmation modal is completely generic regardless of linkage: **"Delete Organization? Are you sure you want to delete 'Gamma Corp'? This action cannot be undone."** — identical wording whether the organization has 0 or 1+ customers/tickets attached. Confirming it deletes the organization outright — flash message "Successful deletion."
- The linked customer's record does **not** crash or show a broken/dangling reference (this part is graceful) — but its Organization Name silently becomes **"—"** both in the Customer 360 identity block and in the Projects & Entitlements row for that project, with zero warning beforehand that this specific, real consequence was about to happen.
- Net effect: a real support-org's customer roster association can be permanently destroyed by one accidental double-click on Delete, with a confirmation dialog that gives no indication anything beyond the empty organization record itself is at stake.

## Evidence

### Screenshot

(None — the failure state is a silent data change, not a visible error/crash screen; the evidence is the before/after DOM state captured in Console/log below.)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-HLP-011/retest-yyyy-mm-dd-pass.png)

### Console / log

- Delete confirmation modal (any organization, tested on "Gamma Corp" with User Count=1): `Delete Organization? Are you sure you want to delete "Gamma Corp"? This action cannot be undone.` — no mention of linked customers.
- Post-delete flash: `Successful deletion.`
- `gamma.customer`'s Customer 360 (`/rf_customers/17`) after deletion: `Organization Name: —` (identity block); Projects & Entitlements row for Helpdesk QA Beta: `Organization Name: —` (was "Gamma Corp"), SLA (`Beta Standard SLA`) and Support Level (`AB-L1`) both correctly preserved — only the Organization reference was cleared.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Retest — 2026-08-31, Local (redmine-docker-6), fresh rebuilt environment

- **Steps, matching the original repro exactly**: created a fresh Organization "Gamma Corp", linked it to `alpha.customer`'s existing Helpdesk QA Alpha project-access row (SLA: Alpha Standard SLA, Support Level: L1), confirmed User Count = 1 on the Organizations list, then clicked Delete on Gamma Corp.
- **Result**: the confirmation modal is no longer generic — it now reads **"Are you sure you want to delete 'Gamma Corp'? This action cannot be undone. This organization has 1 linked customer(s) — deleting it will remove that association."** This is exactly the consequence-aware warning the bug's Expected Result asked for. Screenshot: `retest-2026-08-31-delete-modal-now-warns.png`.
- Confirmed the deletion to check the rest of the flow still behaves gracefully: "Successful deletion." flash shown; `alpha.customer`'s Customer 360 now shows Organization Name **"—"** in both the identity block and the Projects & Entitlements row, with SLA (Alpha Standard SLA) and Support Level (L1) correctly preserved — matching the original repro's "graceful, not a crash" finding exactly, just now with the warning shown first.
- **Verdict: RETEST PASS.** The specific gap this bug reported — a generic confirmation with zero warning about the linked customer — no longer exists.

## Closed — 2026-08-31

- Closed per explicit user confirmation, following the clean retest above (delete confirmation now explicitly warns about the linked customer before deletion).
- If the warning is ever missing again on a differently-linked entity (e.g. a linked ticket instead of a customer), file a new bug rather than reopening this one.

## Notes

- Found while executing TC-HLP-120 ("An organization linked to customers cannot be silently deleted") — the TC's own name states the requirement this violates.
- Distinguish from BUG-HLP-010 (Website/Phone uniqueness): that one was filed as a product-judgment call against behavior that matches documented spec. This one is different — TC-HLP-120 explicitly documents the *expected* protective behavior (refusal or consequence-aware confirmation) as the correct behavior per the test suite's own design intent, and the actual behavior falls short of it, making this a more conventional QA-confirmed gap.
- Recommend Medium severity: not data corruption (the customer record itself stays healthy, and SLA/Support Level survive) but a real, silent loss of a real association with no recovery path once deleted, on a plugin entity users are likely to delete/clean up periodically.
