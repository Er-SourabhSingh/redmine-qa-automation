# BUG-TCM-099

- Bug ID: BUG-TCM-099
- Production Redmine Issue ID: #124714 (https://flux.zehntech.com/issues/124714)
- Title: Pressing Escape anywhere on a Testcase Management page throws an uncaught JS error from the plugin's own onboarding-tour script, even when no tour is active
- Redmine version: master (post-pull, pre-7.2.0)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.2.0
- Environment: Docker `localhost:3000`, project `rftc-016-ci-qa`
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-10-23 (found while thoroughly testing the Requirements page's content editor)

## Steps to reproduce

1. Open any Testcase Management page that loads the plugin's onboarding-tour script (e.g. `/requirements?project_id=<id>`).
2. Do not start/open the onboarding tour at all.
3. Press the **Escape** key anywhere on the page (e.g. to close an unrelated popup, such as the content editor's slash-command block-type menu).
4. Open the browser console.

## Expected result

- Escape closes whatever transient UI it's meant to close (e.g. the editor's block-type popover) with no JS error, since no tour is active.

## Actual result

- Every single Escape press throws an uncaught `TypeError` in the browser console:
  ```
  TypeError: Cannot read properties of undefined (reading 'wrapper')
      at ztTour.destroyTour (http://localhost:3000/assets/plugin_assets/redmineflux_testcase_management/testcase-tour-c6e112e1.js:841:17)
      at ztTour.onKeyUp (http://localhost:3000/assets/plugin_assets/redmineflux_testcase_management/testcase-tour-c6e112e1.js:86:16)
  ```
- Reproduced **2/2** times, back-to-back, with no other action in between. The tour's own global `keyup` listener (`ztTour.onKeyUp`) unconditionally calls `destroyTour()` on every Escape press, and `destroyTour()` reads `.wrapper` off of something that is `undefined` whenever no tour is currently open — there is no guard checking "is a tour actually active" before attempting to tear one down.
- No visible functional breakage was observed alongside it in this session's testing (the editor's own popover still closed correctly) — this is a clean, isolated JS error, not a UI failure. However, it fires on an extremely common user action (Escape) across what is likely every page this tour script is loaded on, which pollutes the console and could mask or interfere with real error monitoring/automated test assertions that check for zero console errors.

## Evidence

### Screenshot

(no screenshot — purely a console-level JS error, not a visual defect; see Console / log below for the exact reproduction)

### Console / log

```
TypeError: Cannot read properties of undefined (reading 'wrapper')
    at ztTour.destroyTour (http://localhost:3000/assets/plugin_assets/redmineflux_testcase_management/testcase-tour-c6e112e1.js:841:17)
    at ztTour.onKeyUp (http://localhost:3000/assets/plugin_assets/redmineflux_testcase_management/testcase-tour-c6e112e1.js:86:16)
```
(Confirmed reproducible 2/2 consecutive Escape presses, console error count incrementing by exactly 1 each time.)

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): n/a

## Suggested fix

In `ztTour.onKeyUp` (or inside `destroyTour` itself), guard against calling `destroyTour()` when no tour instance/wrapper currently exists — e.g. `if (!this.tour?.wrapper) return;` before accessing `.wrapper`, or simply check an `isActive`/`isOpen` flag before tearing anything down.

## Retest Result (2026-10-26)

**CONFIRMED FIXED.** Live-verified: pressing Escape on the Requirements page produced 0 console errors (previously threw an uncaught TypeError from the onboarding-tour script every time).
