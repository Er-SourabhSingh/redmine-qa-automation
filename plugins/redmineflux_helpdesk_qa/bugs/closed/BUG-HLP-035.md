# BUG-HLP-035

- Bug ID: BUG-HLP-035
- Production Redmine Issue ID: 120074
- Title: A Support Package can never be created or edited as Inactive — the Active checkbox has no hidden fallback input, so unchecking it submits nothing and the record silently saves/stays Active regardless
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-03)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-03

## Steps to reproduce

1. Command Center → Helpdesk Settings → Support Packages → New Support Package.
2. Enter a Name, uncheck the **Active** checkbox (confirmed via direct DOM inspection that `.checked` is genuinely `false` at the moment of submission — not a stale UI state).
3. Save.
4. Reopen the same package via Edit — observe the Active checkbox is checked again. Uncheck it a second time (again confirmed `false` right before Save), Save again.
5. Check the Support Packages list.

## Expected result

A Support Package created (or later edited) with Active unchecked should save and display as **Inactive** — matching every other entity in this plugin with the same Name/Description/Active shape (Organization, Product, SLA, Support Level, Canned Response all correctly persist an unchecked Active).

## Actual result

The package shows as **Active** (green "Active" badge) every time, regardless of the checkbox's state at submission — reproduced on **three separate attempts**:

1. "Standard Support" — created with Active explicitly unchecked → saved Active.
2. "Standard Support" — same package, later Edited with Active explicitly unchecked again → "Successful update" flash shown, but still saved Active.
3. "Inactive Test Package" — a fresh package, created with Active explicitly unchecked, its checked-state re-verified via `el.checked === false` in the same tool call immediately before clicking Create → still saved Active.

**Root cause, confirmed via direct DOM inspection of the form**: the Active checkbox has no accompanying hidden fallback input.

```html
<input type="checkbox" name="rf_helpdesk_support_package[active]" id="rf_helpdesk_support_package_active" value="1" checked="checked">
```

This is the only `active`-named input anywhere in the form (`New` and `Edit` both confirmed identical) — there is no `<input type="hidden" name="rf_helpdesk_support_package[active]" value="0">` immediately before it, which is the standard Rails checkbox pattern needed so an *unchecked* box still submits an explicit `"0"`. Without that hidden fallback, an unchecked checkbox submits **no `active` key in the request at all** — and the server evidently treats a missing key as "leave/set Active = true" (either a model default, or `params[:active].nil? ? true : ...`-style logic) rather than "false". The practical result: there is currently **no way, through this UI, to ever create or edit a Support Package into an Inactive state.**

## Evidence

### Screenshot

![Support Packages list — all 3 packages ("Inactive Test Package", "Premium Support", "Standard Support") show a green "Active" badge, even though the first and third were both explicitly unchecked before saving (twice, for "Standard Support")](../../screenshots/BUG-HLP-035/bug-hlp-035-all-packages-show-active.png)

### Console / log

- Form HTML (`New Support Package` and `Edit Support Package`, both identical): `<input type="checkbox" name="rf_helpdesk_support_package[active]" id="rf_helpdesk_support_package_active" value="1" checked="checked">` — confirmed via `document.querySelector('input[type=checkbox]').outerHTML` and a full-form scan for any `input[name*="active"]`, which returned only this one element (no hidden sibling).
- "Standard Support" Edit form re-opened after the second unchecked-and-saved attempt: still shows `checked` — confirmed via `browser_find` + a direct `.checked` DOM read, both prior to and immediately after the click, and again on reload after Save.

## Duplicate check

- Duplicate found: No (checked `bugs/_duplicates.md` — empty register)
- Existing bug reference (if duplicate): — (a different defect shape from BUG-HLP-003, which was "Active checkbox can't be unchecked via Edit" for Organization/SLA/Canned Response — that one was fixed and closed 2026-08-27. This is the same *symptom* recurring on a newer, previously-untested entity; worth flagging that Support Packages may have been built without reusing the same form partial/fix that resolved BUG-HLP-003 elsewhere.)

## Notes

- Found while executing `HELPDESK_PREPAID_HOURS.md` TC-HLP-368 (Creating a Support Package with every field filled, including Active unchecked, in one Save) — expanded into a dedicated repro since the same symptom reproduced identically via Edit too (not just Create).
- Severity judged **Medium**: not a crash or data-corruption bug, but a real, total loss of an entire documented-by-implication field's functionality — the Active checkbox exists, is rendered, and looks fully interactive, but has zero effect in the "make inactive" direction on this entity. This also **blocks TC-HLP-371** (verifying a deactivated Support Package is excluded from the prepaid-hours top-up dialog) from being tested via the normal UI path — there is currently no way to produce a real Inactive Support Package fixture through the UI to test against.
- Given BUG-HLP-003's precedent (same "Active checkbox effectively can't be unchecked" symptom, fixed by adding the correct hidden-fallback/handling for Organization/SLA/Canned Response), recommend checking whether Support Packages was implemented via a copy-paste of an older form partial that predates that fix, rather than the corrected one.

## Retest — Confirmed FIXED (2026-09-10)

- Production issue #120074 found marked "In QA" (developer checked in a fix), triggering this retest per the user's request to retest all checked-in Helpdesk bugs on `localhost:3012`.
- Opened Edit on "Standard Support (Edited v2 - TC-HLP-391)" (Support Package #2, previously always saved Active regardless of the checkbox), unchecked Active, Save. **Result: "Successful update"**, and the Support Packages list now shows this package as **Inactive**.
- Re-opened its Edit form: the Active checkbox correctly loads unchecked (persisted state), confirming this isn't a list-display-only fix — the underlying record is genuinely Inactive.
- Restored the package back to Active afterward to leave the environment in its original state.
- Production issue #120074 synced 2026-09-10: status In QA → Done, % done → 100 (approved).
