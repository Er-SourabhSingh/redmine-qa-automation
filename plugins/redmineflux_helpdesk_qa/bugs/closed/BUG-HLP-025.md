# BUG-HLP-025

- Bug ID: BUG-HLP-025
- Production Redmine Issue ID: 119772
- Title: Support Level create/edit form requires manually configuring "Escalation To" even though Level Order already defines the escalation sequence
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-01)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Admin (`manage_helpdesk`)
- Date: 2026-09-01

## Steps to reproduce

1. On Helpdesk QA Alpha, a Support Level chain exists: L1 (Level Order 1) → L2 (Level Order 2) → L3 (Level Order 3).
2. Open L1's Edit form (`/projects/1/rf_support_levels/1/edit`).
3. Inspect the **Level Order** field and the **Escalation To** field together on the same form.

## Expected result

Per the user's stated requirement: since Support Levels already carry an explicit **Level Order** (L1=1, L2=2, L3=3 …), the escalation sequence should be automatically derived from that order — L1 escalates to the next-higher-order level (L2), L2 to L3, and so on, with the last (highest-order) level having no further escalation target. The **"Escalation To"** field should not need to be present or required in the Support Level create/edit form at all when escalation is driven by Level Order — a user should not have to manually configure a value that Level Order can already determine on its own.

## Actual result

The Support Level create/edit form has a separate, **required** "Escalation To" `<select>` field, independent of Level Order:

- `Level Order *` is a plain required number input.
- `Escalation To` is a separate required dropdown (`"None (Last Level)"`, `"L2 (Order: 2)"`, `"L3 (Order: 3)"` when editing L1) that the admin must explicitly pick every time a level is created or edited — nothing about it is auto-derived from Level Order.
- The form's own inline help text even confirms Escalation To is manually driven: *"Escalation can only be to higher level support (based on Level Order). For example, Level Order 1 can escalate to Level Order 2 or 3."* — Order is only used to validate/restrict which options Escalation To may pick from, never to compute the value automatically.
- This means every new level in a project's chain requires an extra manual step (explicitly wiring up Escalation To) that is fully redundant with information the form already has (Level Order), and creates room for user error — e.g. an admin could pick a valid-but-unintended jump-target level, or forget to set Escalation To at all, leaving a level that silently never escalates.

## Evidence

### Screenshot

![L1's Edit form: Level Order (required number field) and Escalation To (separate required dropdown) both present and independently configured](../../screenshots/BUG-HLP-025/bug-hlp-025-level-order-and-escalation-to-both-present.png)

### Console / log

- N/A — this is a form-design/UX defect, not a runtime error. Both fields save and function correctly; the issue is that two fields are required where the product's own stated design intent (Level Order defines the sequence) only calls for one.

## Duplicate check

- Duplicate found: No (checked `bugs/_duplicates.md` — empty register)
- Existing bug reference (if duplicate): —

## Notes

- Found while executing `HELPDESK_SLA_ESCALATION.md` TC-HLP-341. The TC's first pass concluded this was intentional, non-redundant design (Escalation To enabling genuine skip-level chains, e.g. L1 → L3 directly). **Per explicit user correction, that is not the issue being raised**: the user is not objecting to skip-level escalation as a capability — the objection is that *when escalation is meant to simply follow Level Order in sequence* (the overwhelmingly common case: L1→L2→L3, one step at a time), the admin still has to manually wire up "Escalation To" for every level, instead of the system deriving "next level by Order" automatically and only asking for manual input in the (presumably rarer) case where a non-sequential/skip-level chain is actually wanted.
- Suggested fix direction (not prescriptive — a product/dev decision): default a new/edited level's Escalation To to "the next level by Order" automatically, and make manually overriding it (for a deliberate skip-level chain) optional rather than mandatory — rather than requiring an explicit choice on every level regardless of whether the sequential default was intended.
- `HELPDESK_SLA_ESCALATION.md` TC-HLP-341 rewritten in the same session to test this corrected requirement directly and re-scored FAIL against it.

## Retest — STILL NOT FIXED (2026-09-10)

- Production issue #119772 found marked "In QA" (developer checked in a fix), triggering this retest per the user's request to retest all checked-in Helpdesk bugs on `localhost:3012`.
- Opened L1's Edit form (`/projects/1/rf_support_levels/1/edit`). **Partial change confirmed**: the "Escalation To" field's label no longer carries a `*` — it is no longer marked required, and a fresh page load shows it client-side pre-selected to the next level by Order (L2) as a visual default.
- However, explicitly selecting "None (Last Level)" and saving **succeeded** ("Successful update") — and the Support Level list afterward showed L1's Escalation To column as literally "None (Last Level)", confirming the field genuinely persisted as unset, not auto-derived. Reopening the edit form after that showed the same client-side "L2" pre-selection again — proving that visual pre-select is just a UI hint on an empty field, not the actual saved value.
- **Verdict: this is not a fix of the reported defect.** The user's expected result was that escalation should work correctly *without* the admin manually setting this field, because Level Order alone should be enough to derive it. What actually shipped is the opposite of an improvement in that direction: the required-field guard was removed, but no auto-derivation was added behind it — so a level can now silently end up with **no** escalation target at all (worse than before, since the form no longer forces the admin to notice and set one). This directly risks the same Admin-fallback behavior confirmed in BUG-HLP-021's retest (`PATH B: Admin fallback — no further escalation level`) happening on a level that was intended to escalate normally, with no warning.
- Cleanup: L1's Escalation To was explicitly re-saved as "L2 (Order: 2)" (its correct original value, load-bearing for BUG-HLP-021/033/034's escalation-chain fixtures) after this test, to leave the fixture chain intact for future sessions.
- Per user instruction, production issue #119772's status was left untouched — only this local file and `bugs/_index.md` were updated. This bug stays in `bugs/open/`.

## Retest — CORRECTED: Confirmed FIXED (2026-09-10)

- **The retest above was flawed and its "STILL NOT FIXED" verdict is superseded.** The developer's note on production issue #119772 explains the actual fix condition: *"The Escalation To field now automatically pre-fills with the next level in the sequence... if an admin just saves the form without touching that field, it now correctly saves the sequential next level instead of 'no escalation'... an admin can still explicitly pick 'None (Last Level)'... nothing gets silently changed on existing, already-configured levels."* The prior retest explicitly *selected* "None (Last Level)" and saved — that exercises the manual-override path, not the actual fix (the untouched-field auto-fill path). Re-verified properly against the developer's own reproduction steps:
- Used the existing "Description Max Length Test" level (id 9, Level Order 96, Escalation To previously "None (Last Level)") rather than creating new fixtures. Opened its Edit form: the Escalation To dropdown showed the next level by Order (the "SSSS…" level, Order 98) **pre-selected**, not "None".
- Saved **without touching** the Escalation To field. Result: the Support Levels list now shows this level's Escalation To as "SSSS… (Level Order: 98)" — genuinely persisted, not just a client-side display artifact.
- Verified the "no silent change to an already-configured level" claim on L1 (Escalation To already set to L2): opened its Edit form, saved without touching anything, list still correctly showed "L2 (Level Order: 2)" afterward — unchanged.
- Manual override (explicitly picking "None (Last Level)" and saving) was already confirmed working in the retest above.
- **All three parts of the developer's fix are now genuinely verified**: (1) blank/untouched Escalation To auto-derives and persists the next level by Order, (2) an already-configured level is left untouched when saved without changes, (3) manual override still works. This is a real fix, not a cosmetic one.
- Cleanup: "Description Max Length Test" was explicitly reset back to "None (Last Level)" afterward to restore its original state.
- Per user instruction, production issue #119772's status was left untouched pending explicit approval — only this local file and `bugs/_index.md` should be updated to Closed.
