# Bug Report Template

- Bug ID: BUG-DSH-011
- Production Redmine Issue ID: #121272
- Title: Turning Auto Refresh off does not cancel the already-scheduled refresh cycle — one more full-dashboard refresh fires after the toggle is switched off
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Analytics Dashboard (`redmineflux_dashboard`)
- Plugin version: 7.0.0
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Browser: Playwright MCP (Chromium)
- User role: Administrator
- Date: 2026-09-24

## Steps to reproduce

1. On a project's Dashboard with several widgets, enable **Auto Refresh** and set the interval to **30 sec**.
2. Confirm the countdown indicator (`.auto-refresh-countdown`) is running.
3. Shortly before the countdown reaches 0 (i.e. with a refresh cycle already in flight/imminently scheduled),
   click the toggle to turn Auto Refresh **off**.
4. Wait at least one more full interval (30+ seconds) and inspect network activity for
   `GET .../widgets/:id/refresh` calls.

## Expected result

- Per the TC's own documented expectation: "Refreshing stops and the countdown disappears. A timer that keeps
  firing after being switched off would keep loading the server indefinitely" — no further automatic
  `.../refresh` calls should occur once the toggle is off.

## Actual result

- The countdown indicator does correctly disappear from view (`offsetParent: null`) immediately on toggling off.
- **However, one additional full-dashboard refresh cycle still fires** — a batch of `GET
  .../widgets/:id/refresh?date_range=...` calls for every widget on the dashboard (~44 requests, one per widget)
  went out roughly 30 seconds after the toggle was switched to off.
- **Precisely timed via `performance.getEntriesByType('resource')`**: widget 75's refresh call fired at
  `startTime: 236701ms` (cycle 1, while Auto Refresh was still on) and again at `startTime: 266694ms` (cycle 2) —
  exactly `29993ms` later, i.e. right on the 30-second schedule. The toggle was switched off **between** these two
  cycles (confirmed via UI state check immediately after clicking, reading `OFF`), yet cycle 2 still fired.
- **This is a bounded leak, not infinite polling**: a further 64-second observation window after cycle 2 (two
  consecutive 32-second waits) showed **zero** additional refresh calls (`refreshCallsLast40s: 0`), and the
  cumulative total (90 refresh calls recorded via the Performance API, consistent with exactly 2 full 44-widget
  cycles plus a handful of individual per-widget saves from earlier settings changes) confirms the timer does
  fully stop — but only after firing one extra, already-scheduled cycle the toggle should have cancelled.
- Root cause is consistent with a `setTimeout`/`setInterval` reference not being cleared on toggle-off — the
  already-pending timer for the next tick fires once before the toggle's own state change takes effect on
  subsequent scheduling.

## Evidence

### Screenshot

![Dashboard with Auto Refresh toggled to OFF](../../screenshots/BUG-DSH-011/auto-refresh-toggle-off-state.png)

### Console / log

- Widget 75 refresh call timestamps (`performance.getEntriesByType('resource')`): `236701.3ms` and `266694.4ms` —
  `29993.1ms` apart, i.e. exactly one more 30-second cycle after the toggle was switched off.
- Post-toggle observation: `refreshCallsLast40s: 0` after two consecutive 32-second waits following cycle 2 —
  confirms no indefinite/repeated leak, just the one extra cycle.
- `document.querySelector('.auto-refresh-countdown').offsetParent === null` immediately after toggling off —
  confirms the visible countdown indicator itself behaves correctly; the leak is purely in the underlying timer.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): n/a — checked against `bugs/_duplicates.md` and `bugs/_index.md`.
