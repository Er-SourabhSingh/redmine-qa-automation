# Bug Report

- Bug ID: BUG-RSC-003
- Title: Priority icon SVG assets missing (404) on issues list — priority indicators not displayed
- Redmine version: 6.1.2.stable.24650
- Plugin name: redmineflux_scarlet
- Plugin version: 1.0.0
- Environment: Forge — https://dev-flux.zehntech.com/
- Browser: Chrome
- User role: Administrator (sourabh.singh)
- Date: 2026-06-04

## Steps to reproduce

1. Login to https://dev-flux.zehntech.com/
2. Open browser DevTools → Console tab (or Network tab, filter by 404)
3. Navigate to any project's Issues list: /projects/ztflux/issues

## Expected result

- Priority icons (Medium, High, Blocker) render as coloured SVG icons in the issue rows
- No 404 errors for priority SVG assets in the console

## Actual result

- Three priority SVG icon files return 404:
  - `https://dev-flux.zehntech.com/plugin_assets/redmineflux_scarlet/images/priority_medium.svg`
  - `https://dev-flux.zehntech.com/plugin_assets/redmineflux_scarlet/images/priority_high.svg`
  - `https://dev-flux.zehntech.com/plugin_assets/redmineflux_scarlet/images/priority_blocker.svg`
- Priority column on the Issues list shows broken/missing icons instead of visual indicators
- Users cannot visually distinguish issue priority at a glance

## Evidence

### Screenshot

![Priority icons missing on issues list](../../screenshots/BUG-RSC-003/bug-rsc-003-priority-icons-missing-issues-list.png)

### Console / log

- `[ERROR] Failed to load resource: 404 @ /plugin_assets/redmineflux_scarlet/images/priority_medium.svg`
- `[ERROR] Failed to load resource: 404 @ /plugin_assets/redmineflux_scarlet/images/priority_high.svg`
- `[ERROR] Failed to load resource: 404 @ /plugin_assets/redmineflux_scarlet/images/priority_blocker.svg`

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —
