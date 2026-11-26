# Plugin Memory — Redmineflux Knowledge Base Plugin

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

- The KB editor renders two separate toolbars for the same selection — a sticky (main) toolbar and a
  floating/bubble toolbar that appears lower on the page. These were out of sync on Font Size until rkb-103
  (PR #12, pulled 2026-11-26) — see "Confirmed Working" below; this is now fixed, not an open quirk.
- Font Family is still applied via the legacy `<font face="...">` tag, not CSS — unlike Font Size, which was
  migrated to real inline `font-size` CSS (with backward-compat rendering for pre-existing legacy `<font size="n">`
  content). Not a bug against #119878's own scope (that ticket only mandated the Size migration), but worth a
  follow-up ticket if full consistency is wanted.

## Confirmed Working

- Heading / Font Family / Font Size dropdowns no longer show a blank placeholder option — confirmed 2026-11-24.
- Font Size is a real numeric point-size control (8–48pt presets), applied via inline CSS, with correct reload
  persistence and correct backward-compatible rendering of legacy `<font size="n">` markup — confirmed 2026-11-24.
- Sticky/floating toolbar Font Size sync (rkb-103, PR #12) — confirmed fixed 2026-11-26: both toolbars now read
  and update together without needing to reselect text, text selection survives a size/Heading change (it used
  to be dropped, which was the actual root cause), and legacy `<font>` content still renders/reads correctly
  with no regression. BUG-RKB-001 / production #119878 closed, all 7 acceptance criteria now PASS.

## Recurring Issues

- (none recorded yet beyond BUG-RKB-001 above — this is the plugin's first filed bug)

## Environment Notes

- Vendor KB source: https://www.redmineflux.com/knowledge-base/plugins/knowledge-base-plugin/
- KB ingested 2026-09-15. Re-check the KB for revisions before each new cycle; the vendor revises these pages.
