# Bug Report

- Bug ID: BUG-INE-010
- Production Redmine Issue ID: #121124 (ztflux, https://flux.zehntech.com/issues/121124) — linked as a defect to Test Case #121042, Run #577, Test Suite #146, Environment "Window 11 + Chrome"
- Title: Issue detail page loads Redmine's jstoolbar scripts twice, throwing "Identifier 'lastJstPreviewed' has already been declared" on every load
- Redmine version: 7.0.0
- Plugin name: Redmineflux Inline Editor
- Plugin version: 7.0.0
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Browser: Chromium (Playwright MCP)
- User role: Any logged-in user (confirmed as Developer `willow.belle` and Admin)
- Date: 2026-09-23

## Steps to reproduce

1. Log in as any user and open the browser console.
2. Open any issue's detail page (e.g. #1560).
3. Look at the console, and list the page's `<script src>` tags.

## Expected result

- Each script is loaded once, and the console shows no JavaScript errors on a normal page load.

## Actual result

- The console shows `SyntaxError: Identifier 'lastJstPreviewed' has already been declared` on **every** issue
  detail page load.
- `jstoolbar/jstoolbar-*.js`, `jstoolbar/common_mark-*.js` and `jstoolbar/lang/jstoolbar-en-*.js` are each
  included **twice**. `attachments-*.js` is also included twice; that source was not traced.
- Cause, from the plugin source (`plugins/inplace_issue_editor/lib/editor_hooks.rb`,
  `view_layouts_base_html_head`): the plugin unconditionally injects `javascript_include_tag('jstoolbar/jstoolbar')`,
  the formatter script and the language script into `<head>` on every page for logged-in users. The core issue
  detail page already loads the same scripts for its own Edit form, so the second copy re-declares a top-level
  `let`/`const` and throws.
- Scope: the issue list, My page and Projects pages load a single copy with no error. Only pages where core
  already loads jstoolbar are affected (confirmed: issue detail).
- No user-visible breakage was observed. The first copy runs normally, and the inline description toolbar,
  preview and save all work (TC-INE-029). The second copy aborts at parse time. Hence Low severity. It is still a
  real double-load, it pollutes the console on every issue page, and it could mask other errors or break if a
  future jstoolbar version runs side effects before the failing declaration.

## Evidence

### Screenshot

- Console-only defect; there is no visible UI symptom to screenshot. Evidence is the captured page error and
  script list below.

### Retest screenshot (fill after fix is verified)

- n/a (verify via console/script list)

### Console / log

- `page.on('pageerror')` on reload of `/issues/1560`: `SyntaxError: Identifier 'lastJstPreviewed' has already been declared`.
- Duplicate `<script src>` entries: `/assets/jstoolbar/jstoolbar-d7c21366.js` ×2, `/assets/jstoolbar/common_mark-8a9a868d.js` ×2,
  `/assets/jstoolbar/lang/jstoolbar-en-85c9edfe.js` ×2, `/assets/attachments-86902eac.js` ×2.
- Per-page comparison: `/projects/test-project/issues` 1 copy, no error; `/issues/1560` 2 copies, error;
  `/my/page` 1 copy, no error; `/projects` 1 copy, no error.
- Plugin source, `lib/editor_hooks.rb` lines 13–23: `content << javascript_include_tag('jstoolbar/jstoolbar')`,
  `…('jstoolbar/common_mark')`, `…("jstoolbar/lang/jstoolbar-#{locale}")`, with no check for whether core
  already included them.

## Notes

- Found during TC-INE-032 (interaction with other scripts on the same page: "no … double-binding"). Suggested
  fix: skip the injection on pages that already call `heads_for_wiki_formatter`, or guard the injected scripts.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Production report

- Reported on `flux.zehntech.com` (project `ztflux`) as issue **#121124**, 2026-09-23.
- Linked as a defect to Test Case **#121042**, Run **#577**, Test Suite **#146**, Environment "Window 11 + Chrome"
  — verified via `get_run_testcases`.
- Priority: Low | Defect Severity: Low-severity | Defect priority: Low | Defect Type: Compatibility | Assignee: Vaishnavi Bhawsar.
