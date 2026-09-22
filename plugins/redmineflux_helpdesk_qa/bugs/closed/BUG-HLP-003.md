# Bug Report Template

- Bug ID: BUG-HLP-003
- Production Redmine Issue ID: 119555
- Title: Active checkbox cannot be unchecked via Edit on Organization, SLA, and Canned Response (all fully confirmed via real repro) — a working list-level toggle exists as a workaround for Organization/SLA, but Canned Response has no way to deactivate at all. **CORRECTED 2026-08-24: Product and Support Level are NOT affected — both entities' Edit-form checkboxes correctly persist an uncheck on save, confirmed via real repro. (An earlier same-session finding claiming Support Level had a distinct, more severe "silently deactivates on any save" defect was a testing artifact — a clean, careful re-test with the Edit form reached via its actual UI link, not a direct URL, showed Support Level behaves correctly. That finding and its draft BUG-HLP-006 are retracted — see the CORRECTION section below.)**
- Redmine version: (see QA_CREDENTIALS_FORGE.md — originally Forge flux-fw2qhf0ux49; re-verified 2026-08-24 on flux-fudbk2hlu49, see "Re-verification" section below)
- Plugin name: Redmineflux Helpdesk
- Plugin version: —
- Environment: Forge (https://flux-fw2qhf0ux49.forge.zehntech.com/, originally)
- Browser: Chromium (Playwright MCP)
- User role: Administrator (admin)
- Date: 2026-08-24

## Steps to reproduce

1. Create a Canned Response with Active left checked (the default)
2. Open its Edit form
3. Uncheck the **Active** checkbox
4. Save

**Root cause (confirmed via DOM inspection, not just behavioral guessing):** the Active checkbox's underlying `<input type="checkbox" name="rf_canned_response[active]">` has **no companion hidden `<input type="hidden" name="...[active]" value="0">`** — the standard Rails pattern that guarantees a value is always submitted for a checkbox, since browsers omit an unchecked checkbox from form submission entirely. Without that hidden fallback, unchecking the box and submitting sends **no `active` param in the POST body at all**. The Edit/Update controller action evidently only updates the `active` attribute when the param key is present, so with the key entirely absent, `active` is silently left at its previous value (`true`) instead of being set to `false`.

This exact defect was reproduced twice independently for Canned Response — once via a raw DOM `.click()` on the checkbox, once via a genuine Playwright UI click — both times the checkbox showed `checked = false` immediately after clicking (confirmed via evaluate) and immediately after Save was still `checked = true` when the Edit page was reloaded. The Canned Responses list also continued to show "Active" for the record both times. **This full create→edit→uncheck→save→reload reproduction was only actually executed on Canned Response.**

**Scope beyond Canned Response — DOM structure only, NOT independently reproduced end-to-end:** the identical missing-hidden-field structure was also found on Organization (`name="rf_organization[active]"`) and SLA (`name="sla[active]"`) via direct DOM inspection of their New forms. For Organization specifically, I additionally confirmed that **creating** a new organization with Active unchecked from the start correctly produces an inactive record (Active column renders blank) — but I did **not** test editing an already-active organization and unchecking it, since no pre-existing active organization existed on this fresh server to test that against. For SLA, only the DOM check was done — no create or edit behavior was tested at all. Support Level and Product were not checked in any way this session.

Given the shared root cause (identical missing-hidden-field pattern) and that the Edit/Update behavior is almost certainly driven by the same generic controller logic across these entities, it is **likely** the same failure reproduces on Organization/SLA/Support Level/Product too — but this is an inference from the shared markup pattern, not a confirmed reproduction. **Before closing this bug, actually execute the edit→uncheck→save→reload steps (not just the DOM check) on Organization, SLA, Support Level, and Product**, the same way it was done for Canned Response.

**UPDATE 2026-08-24, second pass — Organization's Edit-form bug IS now independently confirmed, but Organization has a WORKING WORKAROUND that Canned Response does not:**
- Repeated the full repro on a real "Acme Corp" organization: edited it via `/rf_organizations/:id/edit`, unchecked Active, saved — reloading Edit afterward showed Active still checked. **Confirmed: the Edit form's Active checkbox is broken on Organization too, identically to Canned Response.**
- However, Organization's **list view** (`/rf_organizations`) renders its Active column as a **live, independently-wired AJAX toggle checkbox** (`<input type="checkbox" class="organization-active-toggle" data-url="/rf_organizations/:id/toggle_active">`), completely separate from the Edit form. Clicking this toggle **does work correctly** — verified by toggling it off, reloading the page fresh, confirming it stayed off (and the Edit form's checkbox then correctly reflected `false` too), then toggling it back on and reconfirming persistence.
- **Canned Response's list view has no equivalent toggle** — its Active column is a static, non-interactive badge (`<span class="rf_helpdesk_badge rf_helpdesk_badge_success">Active</span>`), not a checkbox. So for Canned Response, the broken Edit-form checkbox is genuinely the **only** UI path to deactivate, and BUG-HLP-003 is a complete, unmitigated blocker there. For Organization, the same Edit-form bug exists but a working alternative already exists in the list view, so the practical impact is lower (a confusing/broken control that a user should simply avoid, not a total feature loss).
**UPDATE 2026-08-24, third pass — list-toggle workaround confirmed for SLA, Support Level, and Product (markup/behavior of the TOGGLE only, not yet the Edit-form checkbox itself for these three):**
- **SLA**: `input.sla-active-toggle`, `data-url="/rf_slas/:id/toggle_active"` — toggled off/on, confirmed persisted across fresh reloads both directions.
- **Support Level**: `input.support-level-active-toggle`, `data-url="/rf_support_levels/:id/toggle_active"` — toggled off/on, confirmed persisted across fresh reloads both directions.
- **Product**: `input.product-active-toggle`, `data-url="/rf_products/:id/toggle_active"` — confirmed present via markup inspection at the time (matches the same pattern exactly).

At this point, the Edit-form checkbox defect itself had only been independently, fully reproduced (create/edit→uncheck→save→reload) for **Canned Response** and **Organization**. For SLA/Support Level/Product, only DOM structure (Organization/SLA) or "no reason to expect otherwise" (Support Level/Product) supported the inference that they shared the same Edit-form defect — **this inference turned out to be wrong for two of the three, see the 2026-08-24 correction below.**

## CORRECTION — 2026-08-24, same-day re-verification actually executed the Edit-form uncheck→save→reload cycle for SLA, Support Level, and Product (not just the list-toggle)

This is the first time the actual Edit-form defect (not the list-toggle workaround, and not just DOM structure) was tested end-to-end for these three entities.

**First pass (unreliable — see retraction below):** navigating directly to `/rf_support_levels/1/edit?project_id=9` via URL, the Active checkbox appeared unchecked on load despite the record being genuinely active, and clicking Save without touching it appeared to silently deactivate the record. This was drafted as a new, more severe bug (BUG-HLP-006).

**Retraction, same session:** a clean re-test — reaching the exact same Edit form via its real UI link (list row's "Edit" link, not a typed URL) — showed the checkbox correctly `checked` on load, and repeating the Save-without-touching-it action left the record correctly Active. Actually unchecking the box and saving then correctly persisted it as inactive, matching Product's behavior. Repeated this clean sequence twice with consistent, correct results both times. **The "always renders unchecked" / "silently deactivates on any save" finding does not hold up and was a testing artifact** (most likely a stale DOM read taken before a direct-URL navigation had fully settled, since a raw `fetch()` of the server-rendered HTML for the same record correctly included `checked="checked"` — this is plain server-rendered Rails HTML, not an async/JS-hydrated field, so the server-side rendering itself was never actually wrong). **BUG-HLP-006 is retracted in full** — no such bug file or screenshot evidence was kept.

| Entity | Checkbox reflects true Active state on Edit-form load? | Uncheck → Save → reload persists as inactive? | Root cause |
|---|---|---|---|
| Organization | Yes | **No — silent no-op, stays Active** | No hidden fallback input for `active` at all |
| SLA | Yes | **No — silent no-op, stays Active** (newly confirmed via real repro, not just DOM) | No hidden fallback input for `active` at all — confirmed via DOM: `input[name="sla[active]"]` is the ONLY `active`-related input on the form |
| Canned Response | Yes | **No — silent no-op, stays Active** | No hidden fallback input for `active` at all |
| Support Level | Yes (confirmed on clean re-test) | **YES — persists correctly. NOT a bug.** | Has a working hidden fallback (`hidden[name="support_level[active]"]=0`) AND the checkbox correctly reflects state |
| Product | Yes | **YES — persists correctly. NOT a bug.** | Has a working hidden fallback (`hidden[name="rf_product[active]"]=0`) AND the checkbox correctly reflects state |

**Final scope summary (corrected):** Organization, SLA, and Canned Response share the identical Edit-form Active-checkbox defect (missing hidden fallback → silent no-op on uncheck) — a working list-level toggle workaround exists for Organization and SLA; **Canned Response has no workaround at all (static badge, no toggle) and is the only entity where this bug is a complete, unmitigated block.** **Product and Support Level are both NOT affected — their Edit forms correctly persist a deactivation.** Customer was not checked (its form/list has no Active/deactivate concept at all — customers are Login-based Redmine users, not toggled entities).

## Expected result

- Unchecking Active on an existing entity's Edit form and saving should persist the entity as inactive — matching `HELPDESK_USER_GUIDE.md` §14's explicit documented behavior for Canned Responses: *"Deactivate a response instead of deleting it and it stops being offered while its history stays intact."*
- The deactivated entity should then be excluded from wherever "active only" listings are offered (e.g. the ticket reply's Canned Response dropdown, per TC-HLP-033).

## Actual result

- **Canned Response:** unchecking Active on the Edit form and saving has **no effect** — the entity remains Active indefinitely. There is **no alternative UI path** (no list-level toggle exists for this entity), so this is a **complete block** — a canned response can only ever be inactive if created that way from the start.
- **Organization:** the identical Edit-form bug is confirmed (unchecking Active and saving has no effect, reproduced independently on a real "Acme Corp" record, and again on "jgh" during re-verification) — but a **working alternative exists**: the Organizations list page has its own inline AJAX toggle checkbox per row that correctly activates/deactivates and persists across reloads. So Organization is NOT fully blocked, just has one broken control alongside one working one.
- **SLA:** identical to Organization — unchecking Active on the Edit form and saving has no effect (confirmed via real repro on "Standard" during re-verification, not just DOM inspection), but the list-level toggle workaround works correctly.
- **Product:** does NOT reproduce this bug — the Edit form's Active checkbox correctly reflects true state and correctly persists an uncheck on save (confirmed via real repro on a throwaway "Reverify Test Product"). Removed from this bug's scope.
- **Support Level:** does NOT reproduce this bug either — the Edit form's Active checkbox correctly reflects true state and correctly persists an uncheck on save (confirmed via a clean repro on "L1", reached via its real UI Edit link). An earlier same-session finding suggesting a different, worse defect here was a testing artifact and has been retracted — see the CORRECTION section above.
- TC-HLP-033 ("Deactivating a canned response removes it from the dropdown but keeps past usage intact") cannot pass as written — Step 1 of that TC ("Deactivate the canned response") never actually succeeds, and there is no workaround for this specific entity.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-HLP-003/bug-hlp-003-active-checkbox-cannot-deactivate.png)

### Console / log

- No console errors — this is a silent server-side no-op, not a JS exception. Confirmed via direct DOM inspection: `document.querySelector('#rf_canned_response_active').checked` reads `false` right after clicking, `true` again after Save + page reload.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Re-verification — 2026-08-24, new Forge instance (`flux-fudbk2hlu49`)

Re-ran the full repro on this new server rotation to confirm the bug still exists and its scope hasn't changed:

- **Organization**: edited existing org "jgh" (id=1), unchecked Active, saved — "Successful update." shown, but the list still showed Active checked immediately after and after a fresh page reload. DOM inspection reconfirmed the root cause is unchanged: `document.querySelector('input[name="rf_organization[active]"]')` has no companion hidden fallback input. **The list-level AJAX toggle workaround still works correctly** — toggled it off, reloaded fresh, confirmed it persisted unchecked, then toggled it back on and reconfirmed. Bug and workaround both behave identically to the original finding.
- **Canned Response**: created a fresh throwaway "Reverify Test Response" (Active checked by default), confirmed its list row's Active column is still a **static text cell** ("Active"), not a checkbox — no workaround exists, as originally found. Edited it, unchecked Active, saved — "Successful creation"-style flow completed normally, but a fresh reload of the list showed the Active cell still reading "Active". **Complete block reconfirmed** — deleted the throwaway entity afterward (standard JS delete-confirmation modal, worked normally).

**Conclusion (initial pass): BUG-HLP-003 fully reproduces on this Forge rotation exactly as originally scoped.** — this held for Organization and Canned Response specifically. See the "CORRECTION" section above: a follow-up same-day pass actually executed the Edit-form uncheck→save→reload cycle for SLA, Support Level, and Product for the first time (previously only inferred/list-toggle-tested), which corrected the scope — **Product and Support Level are both not affected** (a same-session finding to the contrary for Support Level was a testing artifact and has been retracted). SLA's inclusion in this bug is now fully confirmed via real repro, not just DOM inspection.

## Retest — 2026-08-27, Local (redmine-docker-6), fresh rebuilt environment

Re-ran the exact create/edit→uncheck→save→reload cycle for all three affected entities, on the environment rebuilt earlier this session (see `bugs/closed/BUG-HLP-014.md`) — zero shared history with any prior repro.

| Entity | Uncheck → Save → reload Edit form | List display |
|---|---|---|
| **SLA** ("Alpha Standard SLA", pre-existing real fixture) | Checkbox correctly shows **unchecked** on reload | List-level toggle correctly shows unchecked |
| **Organization** ("Alpha Org Retest", throwaway) | Checkbox correctly shows **unchecked** on reload | List-level toggle correctly shows unchecked |
| **Canned Response** ("Retest Response BUG-HLP-003", throwaway) | Checkbox correctly shows **unchecked** on reload | Static badge correctly flipped from "Active" to **"Inactive"** |

- All three entities now correctly persist a deactivation through the Edit form — the missing-hidden-fallback-field defect (`no <input type="hidden" name="...[active]" value="0">` companion) described in the Root Cause section above no longer reproduces for any of them.
- Restored "Alpha Standard SLA" back to Active afterward (it's a real fixture other suites depend on, not throwaway). Deleted the throwaway "Alpha Org Retest" organization and "Retest Response BUG-HLP-003" canned response via the standard confirmation-modal delete flow.
- Screenshots: `retest-2026-08-27-sla-uncheck-persisted.png`, `retest-2026-08-27-organization-uncheck-persisted.png`, `retest-2026-08-27-canned-response-uncheck-persisted.png`.
- **Verdict: RETEST PASS for all three entities.** Combined with Product and Support Level already confirmed unaffected (see CORRECTION section above), this bug no longer reproduces anywhere in its documented scope on Local.

## Closed — 2026-08-27

- Closed per explicit user confirmation, following the clean retest above (all three affected entities — SLA, Organization, Canned Response — now correctly persist a deactivation via the Edit form).
- If the missing-hidden-fallback-field pattern reappears on any entity (including ones not in this bug's original scope), file a new bug rather than reopening this one.
