# Plugin Memory — Redmineflux Shift Management

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

- The plugin's JS asset (`shift_management-*.js`) is loaded on EVERY page of the Redmine instance via the
  plugin-asset mechanism, not just its own feature pages — confirmed via `document.scripts` filtered to
  `plugin_assets` on an unrelated core admin page (Custom Fields).
- That same JS re-implements `[data-confirm]` click handling with an unscoped
  `document.querySelectorAll('[data-confirm]')`, duplicating Rails UJS's own native handling. Result: every
  native confirm dialog anywhere in the instance needs two accepts instead of one before the action proceeds.
  See `BUG-SFM-001`. **Fixed in plugin commit `d29e480` (rsm-093), retest PASS 2026-09-25** — handler removed;
  served asset fingerprint changed `-02242f4f.js` → `-c2dd912b.js`. Checking the served asset content for the
  old snippet is a quick way to tell whether a server actually has the fix.

## Confirmed Working

- Single-click native confirm on `data-confirm` links, both core (Custom Fields Delete) and the plugin's own
  (Attendance detail → Delete, "Delete this record?") — 2026-09-25.

## Recurring Issues

## Environment Notes

- Manual attendance entry (Attendance → + Manual Entry) requires Employee, Date, Punch In AND Punch Out; the
  default Status is Absent. The attendance detail page `/shift_management/attendance/:id` (the only page with
  a `data-confirm` Delete link) has no inbound link in the UI — the calendar opens an edit modal instead.
- Other plugin deletes (departments, teams, holidays, holiday schemas) use in-page modals, not `data-confirm`.

- Plugin source (read-only from this QA session) at
  `C:/redmine-docker-7.0.0/plugins/redmineflux_shift_management/` on the Docker host.
