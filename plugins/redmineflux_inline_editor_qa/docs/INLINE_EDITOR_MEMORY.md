# Plugin Memory — Redmineflux Inline Editor

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

- The `rf-ss` searchable-dropdown widget (used by Assignee, and likely other fields) hardcodes "Search…" and "— None —" — not routed through Redmine's i18n. Priority does NOT use this widget (plain native `<select>`), so don't assume every dropdown-like field shares this gap — check which widget it actually renders first.
- Icon-only edit triggers use `class="rf-edit-icon"` with `aria-label="Edit"` and no visible text — per standing convention, aria-label-only untranslated strings are out of scope for this visual German-language cycle.
- Success/error toasts use `div.rf-toast.rf-toast--success` / `.rf-toast--error` and auto-dismiss very fast — always capture via a `MutationObserver` injected before triggering the action, not a manual screenshot round-trip. A static screenshot of the toast itself IS achievable (unlike Agile Board's drag-toast) with a tight polling loop — check `document.body.innerText.includes(...)` every ~50ms in the same script that triggers the save, and fire `page.screenshot()` the instant it's true.

## Confirmed Working

- Subject inline edit (both issue detail page and Issues list view): plain text input, no separate Save/Cancel buttons, saves on Enter/cancels on Escape — no translatable strings in this control.
- Priority inline edit: plain native `<select>`, option values are admin-configured priority names (data, not UI strings).
- Description CKEditor's tab labels ("Bearbeiten"/"Vorschau"), toolbar tooltips, and the "Zitieren" (Quote) link are all correctly translated.

## Recurring Issues

- None — all 4 translation gaps found this cycle (BUG-INE-001/002/003/004) are fixed as of 2026-09-10. Plugin marked `Complete` in `STATUS.md`.

## Environment Notes

- This plugin's testing started on Forge server `flux-fczk00paf49`, which later expired; testing resumed on `flux-frmka2kzh49`, then `flux-f04qohdte49`, then `flux-fdrk6suoj49`, then `flux-fhhcov1xf49` — always reconfirm existing bugs on a new server before extending coverage, since a prior server's findings can't be assumed to still be reachable.
- 2026-09-09 (first retest, `flux-f04qohdte49`): all 3 open bugs (BUG-INE-001/002/003) still reproduced byte-for-byte — no fix had landed for this plugin yet, unlike several other plugins retested the same day (Gantt, Agile Board, Dashboards) which had partial/full fixes.
- 2026-09-09 (second retest, `flux-fdrk6suoj49`, later same date-labeled session): all 3 confirmed FIXED. The final success/error toasts ("Erfolgreich gespeichert.", "Konnte nicht gespeichert werden: ...") are now German, but a previously-unnoticed interim "Saving…" loading indicator shown just before those toasts is still hardcoded English — filed as new `BUG-INE-004`. Worth checking for similarly-adjacent untranslated strings around any toast/indicator when a fix lands, not just the specific string a bug documented.
- 2026-09-10 (`flux-fhhcov1xf49`): `BUG-INE-004` confirmed fixed — "Wird gespeichert…" now shown, both on Priority and Status changes. Full final-cycle regression across all 9 TCs, all PASS, no new bugs. This closes out the plugin's German-language test cycle.
- Redmineflux Checklist Plugin's "Ticket-Schließung blockieren" setting defaults to OFF on a fresh Forge server — must be enabled to reproduce/retest BUG-INE-002, then reverted afterward to avoid leaving a global behavior change for unrelated future testing. Confirmed again on `flux-fhhcov1xf49`.
