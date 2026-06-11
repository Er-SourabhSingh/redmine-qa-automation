# Bug Report

- Bug ID: BUG-RSC-004
- Title: Tribute mention library bound twice to textarea on pages with rich text editor
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
3. Navigate to any page with a rich text textarea, e.g.:
   - Wiki edit: /projects/easosrt/wiki/Wiki/edit
   - New Issue: /projects/ztflux/issues/new
   - Issue detail: /issues/115019

## Expected result

- Tribute (the @-mention library) is initialised once per textarea
- No duplicate binding warnings in the browser console

## Actual result

- Console warning: `Tribute was already bound to TEXTAREA`
- The Tribute library (`tribute-5.1.3.min`) is being bound to the same textarea element twice
- Symptom: mention dropdown (@user autocomplete) may fire duplicate events or show twice when triggered
- Caused by the `flux_mentions` plugin and/or the scarlet theme both registering Tribute on the same element

## Evidence

### Screenshot

![Tribute double-bind warning — Wiki edit page](../../screenshots/BUG-RSC-004/bug-rsc-004-tribute-double-bind-wiki.png)

### Console / log

- `[WARNING] Tribute was already bound to TEXTAREA @ tribute-5.1.3.min-6c16c47a.js:0`

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —
