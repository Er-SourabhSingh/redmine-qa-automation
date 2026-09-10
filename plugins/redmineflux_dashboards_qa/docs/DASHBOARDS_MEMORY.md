# Plugin Memory — Redmineflux Dashboards

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

- "Diagramm kopieren" (Copy Chart) copies chart config to the clipboard, it does NOT create a duplicate chart card on the dashboard — no cleanup needed after clicking it.
- The "Chart Information" (ℹ) icon's popover did not open via either `browser_click` or a scripted `page.mouse.move` hover in one session (2026-09-09) — may need a slower/staged real hover sequence or a different trigger than assumed. Not a confirmed plugin bug, just a testing-tool limitation observed once.
- The "Add" chart is a genuinely separate action from "Diagramm hinzufügen" (dashboard-level) vs the modal's own primary button (was "Add"/now "Hinzufügen") — don't confuse the two when checking translation coverage.

## Confirmed Working

- As of 2026-09-09 (Forge `flux-fdrk6suoj49`), `BUG-DSH-001` — this plugin's only bug, originally covering a near-total absence of German i18n across almost the entire UI — is fully fixed and closed. A final-cycle regression across all 5 TCs passed with zero new failures.
- The public Share Link view (`/public/analytics_dashboard/<token>`) mirrors live dashboard state faithfully and is a genuinely separate i18n surface from the authenticated view — always check both when retesting a dashboard-plugin translation bug, not just the one the user mentions.

## Recurring Issues

## Environment Notes

- This plugin's testing has moved across several Forge servers as they've been provisioned/expired: `flux-f6nlrqpvk49` → `flux-f04qohdte49` → `flux-fdrk6suoj49`. Always reconfirm existing (closed) bugs on a new server before assuming they're still fixed there.
