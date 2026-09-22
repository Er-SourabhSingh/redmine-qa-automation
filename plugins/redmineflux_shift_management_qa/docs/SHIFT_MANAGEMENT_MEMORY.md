# Plugin Memory — Redmineflux Shift Management

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

- The plugin's JS asset (`shift_management-*.js`) is loaded on EVERY page of the Redmine instance via the
  plugin-asset mechanism, not just its own feature pages — confirmed via `document.scripts` filtered to
  `plugin_assets` on an unrelated core admin page (Custom Fields).
- That same JS re-implements `[data-confirm]` click handling with an unscoped
  `document.querySelectorAll('[data-confirm]')`, duplicating Rails UJS's own native handling. Result: every
  native confirm dialog anywhere in the instance needs two accepts instead of one before the action proceeds.
  See `BUG-SFM-001`.

## Confirmed Working

- (none yet — no feature testing done)

## Recurring Issues

## Environment Notes

- Plugin source (read-only from this QA session) at
  `C:/redmine-docker-7.0.0/plugins/redmineflux_shift_management/` on the Docker host.
