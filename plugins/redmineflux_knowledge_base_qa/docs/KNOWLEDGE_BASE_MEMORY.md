# Plugin Memory — Redmineflux Knowledge Base Plugin

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

- The KB editor renders two separate toolbars for the same selection — a sticky (main) toolbar and a
  floating/bubble toolbar that appears lower on the page. Their Font Size dropdowns can go out of sync: applying
  a size via the sticky toolbar updates it correctly, but the bubble toolbar's own dropdown keeps showing the
  previous value until the text is reselected. See BUG-RKB-001 (production #119878, reopened 2026-11-24).
- Font Family is still applied via the legacy `<font face="...">` tag, not CSS — unlike Font Size, which was
  migrated to real inline `font-size` CSS (with backward-compat rendering for pre-existing legacy `<font size="n">`
  content). Not a bug against #119878's own scope (that ticket only mandated the Size migration), but worth a
  follow-up ticket if full consistency is wanted.

## Confirmed Working

- Heading / Font Family / Font Size dropdowns no longer show a blank placeholder option — confirmed 2026-11-24.
- Font Size is a real numeric point-size control (8–48pt presets), applied via inline CSS, with correct reload
  persistence and correct backward-compatible rendering of legacy `<font size="n">` markup — confirmed 2026-11-24.

## Recurring Issues

- (none recorded yet beyond BUG-RKB-001 above — this is the plugin's first filed bug)

## Environment Notes

- Vendor KB source: https://www.redmineflux.com/knowledge-base/plugins/knowledge-base-plugin/
- KB ingested 2026-09-15. Re-check the KB for revisions before each new cycle; the vendor revises these pages.
