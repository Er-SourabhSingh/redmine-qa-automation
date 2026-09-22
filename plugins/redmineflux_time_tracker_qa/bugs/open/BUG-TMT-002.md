# Bug Report

- Bug ID: BUG-TMT-002
- Production Redmine Issue ID: #121076
- Title: "Start Timer" stays visible and clickable on the issue detail page when the project's core "Time tracking" module is disabled, and fails silently with no user-facing error
- Redmine version: 7.0.0 (Docker)
- Plugin name: Redmineflux Time Tracker Plugin
- Plugin version: (record installed version)
- Environment: Local Docker (redmine-docker-700-redmine-1), http://localhost:3010
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-22

## Steps to reproduce

1. Open a project's Settings → Modules and uncheck core Redmine's **Time tracking** module (this plugin does not
   register a module of its own — the core "Time tracking" checkbox is the only relevant toggle a project has).
   Save.
2. Open any open issue in that project. Confirm core's own **Log time** link is correctly absent from the issue
   detail page's action bar.
3. Observe the plugin's own **Start Timer** control (top action bar) is still shown, enabled, with no disabled
   state or tooltip.
4. Click **Start Timer**. If the issue is unassigned, the usual "Assignment Notice" interstitial appears —
   confirm through it ("Got it, Start Timer").
5. Observe the network request and the page for any error feedback.

## Expected result

- With the project's Time tracking module disabled, the plugin's **Start Timer** control should not be offered
  at all on the issue detail page — the same way core Redmine's own **Log time** link correctly disappears there.
- If the control were ever left visible, clicking it must surface a clear, visible message telling the user why
  the action did not happen.

## Actual result

- The plugin's **Start Timer** control remains fully visible and clickable even though the project's core "Time
  tracking" module is disabled — core's own "Log time" link is correctly absent on the same page, confirming the
  module really is off.
- Clicking it proceeds through the normal "Assignment Notice" modal, then:
  - `POST /time_tracker/start_timer` → **422 Unprocessable Content**
  - Response body: `{"status":"error","message":"Time tracking is disabled for this project"}`
- The backend **does** correctly enforce the module check — no time entry is written, so this is **not** a
  data-integrity bypass like `BUG-TMT-001` (the closed-project finding, where the write actually succeeded).
- The defect is purely on the front end: **no error is surfaced to the user anywhere** — no toast, no inline
  message, nothing in the modal. The button simply reverts to its idle "Start Timer" state. From the user's
  point of view, they clicked a live-looking button and nothing happened, with no explanation — this is exactly
  what prompted the original report ("user still able to start time... because start time button available on
  issue detail page").
- Recorded as `TC-TMT-924` in `testcases/TIME_TRACKER_PERMISSIONS.md`.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-TMT-002/module-disabled-start-timer-visible-silent-fail.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-TMT-002/retest-yyyy-mm-dd-pass.png)

### Console / log

- Project `test-project`, issue #1553, core "Time tracking" module unchecked via Settings → Modules → Save.
- `POST /time_tracker/start_timer` → 422, body `{"status":"error","message":"Time tracking is disabled for this project"}`.
- Console: `Failed to load resource: the server responded with a status of 422 (Unprocessable Content)` — no
  application-level error toast/message accompanies it in the UI.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): n/a — checked `bugs/_duplicates.md` and `bugs/_index.md`; distinct from
  `BUG-TMT-001` (that one is a real closed-project write bypass with a 200 success; this one is a visible-but-
  refused control with a 422 and no user feedback). Both share the same root pattern (the plugin's own control
  doesn't take the project's read-only/disabled state into account when deciding what to show), but are separate
  defects with separate fixes (hide-the-control vs. enforce-the-write).

## Reported by

Raised by the user directly ("i found one bug in time tracker when time tracking module disable in project user
still able to start time for because start time button avaiable on issue detail page"), on `localhost:3010`.
Investigated live: the control is indeed left visible (confirming the report), but the underlying write is
actually refused server-side (422) — the real defect is the visible dead control plus the silent failure, not an
unauthorized write.
