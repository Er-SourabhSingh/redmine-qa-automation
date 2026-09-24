# Bug Report

- Bug ID: BUG-GNT-008
- Production Redmine Issue ID: 121143
- Title: Custom Range date picker's Cancel/Apply buttons render below the visible fold at 1280×720, with no auto-scroll or reposition to keep them reachable
- Redmine version: local dev build (#120913)
- Plugin name: Redmineflux Gantt Chart
- Plugin version: local dev build (#120913, not yet a tagged release)
- Environment: Local Docker `http://localhost:3010`
- Browser: Chromium (Playwright MCP), viewport tested at 1280×720 and a reduced-chrome-equivalent 1280×580
- User role: Admin (issue is layout-only, not role-dependent)
- Date: 2026-09-23

## Steps to reproduce

1. Open a project's Flux Gantt view (`/projects/<id>/flux_gantt`).
2. Click the **Date From/To** dropdown button in the toolbar.
3. Click **Custom Range** in the preset list to open the two-month calendar picker.
4. Observe the popup's own **Cancel** and **Apply** buttons at the bottom of the picker, on a browser window sized to 1280×720 (a real desktop browser window at this resolution, including its own tab bar/address bar/OS taskbar chrome — not a bare 1280×720 content area).

## Expected result

- Cancel and Apply remain visible and reachable without the user needing to discover that the whole page (not the popup) scrolls — e.g. the popup should cap its own height with an internal scroll region, or flip/reposition upward when there isn't enough room below, the way well-behaved dropdown/popover components do.

## Actual result

- The popup always renders downward from the Date From/To button with a fixed layout (two calendar months stacked + preset list + button row), needing ~649px of vertical space measured from the top of the page. On a real 1280×720 browser window, the usable content height (after tab bar/address bar/taskbar chrome) is well under that — confirmed via a reduced 1280×580 content-height repro, where Cancel/Apply's bounding box (`top:615, bottom:649`) falls entirely outside the 580px-tall viewport, i.e. **0 visible pixels of either button**.
- The buttons are not permanently lost — scrolling the **whole page** down by ~94px brings them into view (`bottom:555`) — but there is no visible scrollbar affordance on the popup itself, and the page's own scrollbar is the only cue. A user who doesn't think to scroll the page (a reasonable assumption, since it's a small popup, not obviously a page taller than the viewport) has no visible way to Cancel or Apply a custom range.
- Confirmed via `getBoundingClientRect()` that the popup does not reposition/flip itself based on available space — its position is identical regardless of viewport height; only the visible/clipped portion changes.
- At a bare 1280×720 **content** viewport (no chrome subtracted, e.g. a pure Playwright viewport resize) the buttons do fit with ~71px to spare — so the defect specifically manifests once real browser chrome is accounted for at this resolution, which is exactly the scenario reported.

## Evidence

### Screenshot

![Reported repro — buttons appear cut off at the bottom of the popup](../../screenshots/BUG-GNT-008/user-reported-1280x720-cutoff.png)

![Reduced-content-height repro — buttons entirely below the fold, 0 visible pixels](../../screenshots/BUG-GNT-008/repro-1280x580-buttons-below-fold.png)

![Same state after scrolling the whole page down ~94px — buttons become visible](../../screenshots/BUG-GNT-008/repro-1280x580-after-scroll-buttons-visible.png)

![Control: bare 1280x720 content viewport — buttons fit with room to spare](../../screenshots/BUG-GNT-008/repro-1280x720-datepicker-buttons.png)

### Console / log

- No console errors associated with this — pure layout/positioning defect. DOM evidence: `Cancel` rect `{top:615, bottom:649}` and `Apply` rect `{top:615, bottom:649}` unchanged across viewport heights (580px vs 720px), confirming the popup itself never adapts to available space.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): n/a

## Retest — 2026-09-24, FIXED

- Dev build redeployed (same rebuild as BUG-GNT-006/007's retest).
- Reproduced the exact original repro conditions: resized to a 1280×580 content viewport (simulating real browser chrome inside a 1280×720 window), opened Custom Range.
- **Cancel/Apply now render fully inside the viewport** — bounding box `top:520, bottom:554`, well within the 580px height (previously `top:615, bottom:649`, entirely below the fold at this same reduced height).
- Root cause of the fix: the popup now has its **own internal scroll region** (visible scrollbar on the popup's right edge in the screenshot) that caps its total height, rather than relying on the whole page growing taller — exactly the fix recommended in this bug's Expected Result.
- **Fixed.** Moving to `bugs/closed/`.

### Retest screenshot

![Retest — Cancel/Apply fully visible at reduced 1280x580 content height, popup has its own internal scrollbar](../../screenshots/BUG-GNT-008/retest-2026-09-24-pass.png)

### Production status sync — 2026-09-24

- Production issue #121143 updated: In QA → **Done**, % done → **100**.
