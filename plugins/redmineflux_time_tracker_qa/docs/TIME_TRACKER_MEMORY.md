# Plugin Memory — Redmineflux Time Tracker Plugin

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

- The "Stop Timer & Log Time" save modal enforces a **client-side 1-minute minimum** before "Stop & Save" will
  actually submit ("Timer must run for at least 1 minute before saving") — if retesting anything in this flow,
  budget real wall-clock wait time for the timer to clear this floor, it can't be bypassed by editing the
  displayed duration.
- Starting a timer on an issue with no assignee shows an interstitial "Assignment Notice" modal ("This issue is
  currently unassigned. You can still track time...") with its own confirm button ("Got it, Start Timer") before
  the timer actually starts — expected UX, not a bug, but affects automation/testing flows that click "Start
  Timer" and expect the timer to begin immediately.

## Confirmed Working

- (none confirmed yet — every planned test case in `testcases/` is still unexecuted; only the ad-hoc
  `TC-TMT-055` closed-project finding below has been run)

## Recurring Issues

- **The plugin's own "Start Timer" control on the issue detail page does not respect a project's closed/
  read-only state**, even though Redmine core's own "Log time" link on the same page correctly disappears for a
  closed project. Confirmed 2026-09-22 (`BUG-TMT-001`, High, first live finding for this plugin): starting a
  timer, running it past the 1-minute minimum, and saving via "Stop Timer & Log Time" all succeed
  (`start_timer` → 200, `save_time_entry_with_custom_fields` → 200), and the issue's Spent time total genuinely
  increases. Same category of gap as the Checklist plugin's `BUG-CHK-005` found the same session — a plugin
  provides its own write path on the issue detail page that skips the project-closed check Redmine core already
  enforces for its own equivalent action on that page. If retesting after a fix, also check the archived-project
  half of `TC-TMT-055` and its "edit an existing entry" / direct-endpoint sub-steps, none of which have been run
  yet.
- **The plugin registers no project module of its own** — Project Settings → Modules has no "Time Tracker" entry
  (unlike Helpdesk, Invoice, Knowledgebase, etc. on this instance, which each add their own module checkbox).
  The only relevant toggle a project has is core Redmine's own **"Time tracking"** checkbox.
- Same "control ignores a state core already enforces" pattern as `BUG-TMT-001`, but a **different half of the
  same UI bug + a different backend outcome**: when core's "Time tracking" module is disabled for a project, the
  plugin's **Start Timer** control stays fully visible (core's "Log time" correctly disappears on the same page),
  but the backend **does** refuse the write server-side — `start_timer` → **422**,
  `{"status":"error","message":"Time tracking is disabled for this project"}`. So this one is **not** a real
  data-integrity bypass. The actual defect is that the failure is completely silent — no toast, no inline
  message — so the control looks broken/dead rather than gated. Filed as `BUG-TMT-002` (Medium). Confirmed
  2026-09-22, `TC-TMT-056`, project `test-project` / issue #1553.

## Environment Notes

- Vendor KB source: https://www.redmineflux.com/knowledge-base/plugins/time-tracker/
- KB ingested 2026-09-15. Re-check the KB for revisions before each new cycle; the vendor revises these pages.
