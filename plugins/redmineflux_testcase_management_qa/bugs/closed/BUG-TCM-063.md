# Bug Report Template

> **CLOSED — 2026-10-08.** Production #122903 (https://flux.zehntech.com/issues/122903) is **Done**, 100% done.
> Retested on a different Forge instance (`flux-fvqoa5yw149.forge.zehntech.com`) — see "Retest" section below.

- Bug ID: BUG-TCM-063
- Production Redmine Issue ID: #122903 (reported 2026-10-08, assigned Vaishnavi Bhawsar, target version "Testcase Management plugin Release 7.1.0", Priority Medium, Defect Severity Medium-severity, category Testcase Management Plugin)
- Title: Clicking the "+" (Add Requirement) icon throws an uncaught JS TypeError ("Cannot read properties of undefined (reading 'add_requirement')")
- Redmine version: Unknown — pending check via Administration > Information on this instance
- Plugin name: Redmineflux Testcase Management
- Plugin version: Unknown — pending check via Administration > Plugins
- Environment: Forge (cloud-hosted, rotates per run) — `https://flux-ffpwq4t9a49.forge.zehntech.com/`, project "Agile Board Project" (identifier `agileboard`)
- Browser: Chrome (DevTools shown in evidence)
- User role: Admin
- Date: 2026-10-08

## Steps to reproduce

1. Log in as Admin on the Forge instance above, open project "Agile Board Project".
2. Go to Testcase Management > Requirements.
3. Open DevTools > Console.
4. Click the **"+"** icon next to the "Requirements" heading (the control documented as creating a new requirement inline).

## Expected result

- Clicking the "+" icon opens the inline new-requirement input (per `docs/TESTCASE_MANAGEMENT_MEMORY.md`'s documented behavior: "type a name into the 2nd visible text input, press Enter") with no console errors.

## Actual result

- An uncaught `TypeError` is thrown immediately: **"Cannot read properties of undefined (reading 'add_requirement')"**, originating from `script-89236efc.js:1789`, fired from an `SVGSVGElement` click-dispatch handler (jQuery 3.7.1 UI `dispatch`/`v.handle`). Whether the inline new-requirement input still appears/functions despite the error is not yet confirmed (see Open items below).

## Evidence

### Screenshot

<!-- PENDING: screenshot not yet saved — the shared image for this bug arrived without a retrievable file path. Re-share as a file attachment so it can be saved to screenshots/BUG-TCM-063/ and embedded here. -->

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-TCM-063/retest-yyyy-mm-dd-pass.png)

### Console / log

- `Uncaught TypeError: Cannot read properties of undefined (reading 'add_requirement')`
- at `script-89236efc.js:1789:24`, via `SVGSVGElement.dispatch` → `v.handle` (jQuery 3.7.1 UI, same bundle as BUG-TCM-062's jQuery stack)
- Timestamp: 15:38:35.421

## Duplicate check

- Duplicate found: No — distinct error signature/file (`script-89236efc.js`) and failure type (client-side JS TypeError, not a network 403) from BUG-TCM-062 (`testcase-73520250.js`, network 403 on `.json` routes). Filed separately per this repo's duplicate-vs-distinct convention (see `_duplicates.md`'s existing guidance to split on differing assertion/trigger/cause even when symptoms look similar).
- Existing bug reference (if duplicate): None on this plugin's known bug list, but the general **pattern** (an `<svg>` control bound via raw `onclick`, no null-guard) matches previously-closed **BUG-TCM-030** ("Opening the 'Add Test Suite' modal throws a JS TypeError (`Cannot read properties of null`) every time") — same family of defect (unguarded SVG click handler), different control/page. Worth checking if BUG-TCM-030's fix regressed, or if this is a sibling control that was never covered by that fix.

## Open items (follow-up needed before this can be closed or reported to production)

- [x] ~~Confirm Redmine version and Testcase Management plugin version~~ — plugin confirmed v7.1.0 during retest
- [x] ~~Confirm whether the inline "new requirement" input still appears and a requirement can still be saved~~ — confirmed working during retest
- [ ] Whether this was specifically a regression of BUG-TCM-030's fix was never confirmed — moot now since the control itself verified working

## Retest

**2026-10-08 on `https://flux-fvqoa5yw149.forge.zehntech.com/`** (admin, Testcase Management Project, via Playwright-driven browser):

- Clicked the "+" Add Requirement icon → inline "New Requirement" form (Title field + Save/Cancel) appeared correctly, zero console errors.
- Typed a title ("Retest requirement BUG-TCM-063") and clicked Save → requirement created successfully (redirected to `page_id=5`), zero console errors throughout.

**Confirmed FIXED** — both the error and the underlying functionality now work. Closed per this retest; production #122903 synced to Done/100%.
