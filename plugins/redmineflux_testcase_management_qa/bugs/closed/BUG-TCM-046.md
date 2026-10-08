# BUG-TCM-046

> **CLOSED — 2026-10-07.** Production #122672 (https://flux.zehntech.com/issues/122672) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.
> The original local bug file was lost (system reformatted before it was pushed); this file is rebuilt from the
> production issue's description and journal.

- Bug ID: BUG-TCM-046
- Production Redmine Issue ID: #122672 (https://flux.zehntech.com/issues/122672) — created 2026-10-06, assigned to Vaishnavi Bhawsar, Priority Low, Defect Severity Low-severity
- Title: "Testcase Tracker not configured" is correctly refused, but renders as a generic Redmine "500" error page instead of a clean validation message
- Severity: Low
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.1.0
- Target version: Testcase Management plugin Release 7.1.0 [07-10-2026]
- Defect Type: Functional
- Defect priority: Low
- Reported by: Sourabh Singh
- Date: 2026-10-06
- Status: Closed (production: Done, 2026-10-07)

## Summary

Found while retesting BUG-TCM-010 (production #121700) against the latest master. The actual reported defect — a test case silently landing on the Bug tracker when the plugin's "Testcase Tracker" setting is blank — is genuinely fixed: the create action is now refused outright with a clear message, and no issue is created.

However, the refusal is implemented via Redmine core's generic `render_error(...)` helper, which defaults the response's HTTP status **and** the page's own visible heading to "500" — the same heading/status Redmine uses for a genuine unhandled server crash. A real user sees a page literally titled "500," indistinguishable at a glance from a crash, instead of a friendly "please configure this setting" message.

Not a regression — the same `render_error` pattern already existed elsewhere in this controller for an analogous condition before this fix; the fix simply reused an existing, not-particularly-friendly UX pattern.

## Steps to reproduce

1. As Admin, go to Administration > Plugins > Redmineflux Testcase Management > Configuration.
1. Clear "Select Tracker As Testcase" (blank option) and save.
1. In any project with the module enabled, navigate to `/projects/<id>/issue_testcase/new`.

## Expected result

A clear, normally-styled validation/configuration message — ideally without the page being headed "500" or returning an HTTP 500 status, since this is an expected, handled condition, not a server fault.

## Actual result

Page renders Redmine's generic error template: heading "500", HTTP status 500, with only the message text itself ("No tracker is associated to this project. Please check the Project settings.") distinguishing it from an actual crash page.

## Environment

Docker `localhost:3015` (project `qa-demo`), plugin v7.1.0, Chromium (Playwright MCP).

---

## Production history (synced from #122672 on 2026-10-08)

### 2026-10-06 14:04 UTC — Vaishnavi Bhawsar

Fixed. The missing-tracker check was already correctly refusing the page, but it was using a generic error call that defaults to a "500" heading and status, making a normal, expected configuration message look exactly like a real server crash. It now shows the same message with a proper 422 status and heading.

Verified: with the Testcase Tracker setting cleared, opening the New Test Case page now shows a clean page headed "422" with the plain message "No tracker is associated to this project. Please check the Project settings." -- not a "500" page. Setting restored afterward; normal test case creation confirmed unaffected.

For QA: clear the plugin's Testcase Tracker setting, open a project's New Test Case page, and confirm the page is headed "422" (not "500") with the same clear message as before.

### 2026-10-07 06:58 UTC — Sourabh Singh

Retested on master `4b5a7a7`. Reproduced the original scenario (tracker setting temporarily cleared, then restored immediately after) -- the page now returns a proper 422 with a normal page, not the generic "500" crash page. Closing.
