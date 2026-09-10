# Plugin Memory — Redmineflux Tags

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

- Tag names get whitespace/hyphens stripped on creation via the inline "Markierungen hinzufügen" widget (e.g. typing "retest-tag-alignment" saved as "retesttagalignment") — not a bug, just how the widget normalizes input; use single unbroken words for test tag names to avoid confusion when cross-referencing screenshots.
- The admin Manage Tags delete action is AJAX-driven (`DELETE /tags` with body `tag_ids[]=<id>`) — checking a row's checkbox does NOT queue it for deletion by itself; only clicking that row's own "Löschen"/"Delete" link fires the request, and (as of the 2026-09-09 fix) it now sends only that row's own id regardless of which other checkboxes are ticked. Verify via `browser_network_request` (request-body) for definitive proof, not just the visible result.

## Confirmed Working

- As of 2026-09-09 (Forge `flux-fdrk6suoj49`), all 7 bugs found during this plugin's German-language cycle are fixed and closed, and the full final-cycle regression (all 9 TCs) passed with zero new failures — see `TAGS_HANDOFF.md` Run History for the full retest breakdown.
- Issue detail "Markierungen:" field now uses the standard `.attribute` wrapper markup (`<div class="tags attribute">`) and renders inline with its label in both view and edit mode, matching every sibling field — this was `BUG-TAG-007`'s root cause and is now fixed.

## Recurring Issues

## Environment Notes

- This plugin's testing has moved across several Forge servers as they've been provisioned/expired: `flux-fczk00paf49` → `flux-fyqnqkoqg49` → `flux-frtsiofsm49` → `flux-fdrk6suoj49`. Always reconfirm existing (closed) bugs on a new server before assuming they're still fixed there, since server provisioning is independent of code branch state in some cases.
- System default theme on a fresh Forge server is not always "Standard" — this server (`flux-fdrk6suoj49`) defaulted to "Redmineflux scarlet" and English; always explicitly set both Design-Stil and Standardsprache on `/settings/edit?tab=display`, don't assume defaults.
