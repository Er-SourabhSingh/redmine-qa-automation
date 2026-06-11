# Bug Report

- Bug ID: BUG-RSC-002
- Title: JavaScript error — identifier 'lastJstPreviewed' has already been declared on pages with rich text editor
- Redmine version: 6.1.2.stable.24650
- Plugin name: redmineflux_scarlet
- Plugin version: 1.0.0
- Environment: Forge — https://dev-flux.zehntech.com/
- Browser: Chrome
- User role: Administrator (sourabh.singh)
- Date: 2026-06-04

## Steps to reproduce

1. Login to https://dev-flux.zehntech.com/
2. Open browser DevTools → Console tab
3. Navigate to any of the following pages:
   - New Issue: /projects/ztflux/issues/new
   - Issue detail: /issues/115019
   - New Project: /projects/new

## Expected result

- No JavaScript errors in the console
- Rich text editor (JsToolbar / Textile) initialises correctly

## Actual result

- Console shows: `Identifier 'lastJstPreviewed' has already been declared`
- The `lastJstPreviewed` variable is declared more than once, indicating a JS file is being loaded twice or two conflicting scripts both declare the same global
- Could prevent the rich text editor preview from functioning correctly

## Evidence

### Screenshot

![lastJstPreviewed error — New Issue page](../../screenshots/BUG-RSC-002/bug-rsc-002-lastjstpreviewed-new-issue.png)

### Console / log

- `Identifier 'lastJstPreviewed' has already been declared`

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —
