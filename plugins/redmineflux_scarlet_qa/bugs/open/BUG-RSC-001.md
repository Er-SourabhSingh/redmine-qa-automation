# Bug Report

- Bug ID: BUG-RSC-001
- Title: Theme asset activity.css returns 404 on every page
- Redmine version: 6.1.2.stable.24650
- Plugin name: redmineflux_scarlet
- Plugin version: 1.0.0
- Environment: Forge — https://dev-flux.zehntech.com/
- Browser: Chrome
- User role: Administrator (sourabh.singh)
- Date: 2026-06-04

## Steps to reproduce

1. Login to https://dev-flux.zehntech.com/ with any user
2. Open browser DevTools → Console tab
3. Navigate to any page (Home, My Page, Issues, Admin, etc.)

## Expected result

- All theme CSS assets load with HTTP 200
- No 404 errors in the browser console for scarlet theme assets

## Actual result

- Console shows: `Failed to load resource: the server responded with a status of 404 (Not Found) @ https://dev-flux.zehntech.com/assets/plugin_assets/redmineflux_scarlet/activity.css`
- The error appears on every page load
- Secondary JS log: `Activity container not found` — the Activity page JS also fails to initialize because the CSS is missing
- Any page using the activity component will render unstyled

## Evidence

### Screenshot

![activity.css 404 — My Page console](../../screenshots/BUG-RSC-001/bug-rsc-001-activity-css-404.png)

### Console / log

- `[ERROR] Failed to load resource: 404 @ /assets/plugin_assets/redmineflux_scarlet/activity.css`
- `[LOG] Activity container not found @ activity_page-dbda6cf0.js:30`

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —
