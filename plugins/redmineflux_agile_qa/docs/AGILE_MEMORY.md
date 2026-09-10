# Plugin Memory — Redmineflux Agile Board

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

- "Story Points" is a **plugin-level feature toggle** ("Story Points aktivieren" checkbox on Administration → Plugins → Redmineflux Agile Board's own configuration page), NOT a core-Redmine custom field — `/custom_fields` will never show it, checking there to determine availability gives a false negative. It is OFF by default on a fresh Forge server; enabling it is the user's call (a global feature toggle, not something to flip unprompted), but once enabled it's a simple settings checkbox, not a data-model change.
- Kanban cards on the board aren't natively `draggable` — dragging (status-change or reordering) requires a real `page.mouse` down/move/up sequence with `waitForTimeout` pauses between steps, not `browser_drag` or synthetic `dispatchEvent`. Same technique needed for the dependency-handle-style interactions on other Redmineflux plugins.
- The My Page Agile Board block is not present by default on a fresh account — add it via the "Hinzufügen" dropdown ("Agile Board" option) when it's needed for a retest, and remove it again afterward (via the block's own "Löschen" link, not a direct `/my/remove_block?block=...` GET request — that 404s) to avoid leaving unrequested state on the account.

## Confirmed Working

- As of 2026-09-10 (Forge `flux-f3lnytazd49`), **all 8 of this plugin's found bugs are fixed and closed** (BUG-AGB-001 through 008). Plugin marked `Complete`. The Board-Settings checkbox-list fix and the Story Points field-name fix (all surfaces, including the "Sichtbare Kartenfelder" checkbox and the board-config form's "Tags" checkbox) have been reconfirmed across four consecutive fresh servers.
- Drag-and-drop status-change toast now renders fully German ("Ticket #<id> wurde nach <STATUS> verschoben"), confirmed via `MutationObserver` capture (the toast itself dismisses too fast for a reliable still screenshot, same limitation as other plugins' toasts on this codebase family). The draggable element is `.jira-card` (a jQuery UI Sortable handle, class `ui-sortable-handle`) — dragging from the `<a>` issue-number link inside it does not trigger the sortable handler; grab the `.jira-card` container itself.
- Story Points now correctly renders "Story-Points" (hyphenated, matching German loanword convention for agile terms like "Sprint") everywhere: Board-Einstellungen (both groups), Global Board, My Page block, New Issue form, issue detail page, issue edit form, and the board-config form.
- The full custom/saved board-config lifecycle (create → edit → delete, including flash messages "Erfolgreich angelegt."/"Erfolgreich aktualisiert." and the delete-confirmation modal's dynamically-interpolated board name) is fully translated and functions correctly.

## Recurring Issues

- None currently — all known translation gaps are fixed. The custom/saved board-config form (`/projects/<id>/board_configs/new`) maintains its own separate copy of the "Sichtbare Kartenfelder" checkbox list (`c[]` values), distinct from the quick-panel/My-Page-block variant (`board[visible_card_fields][]`) — if a new translation gap is ever reported on one, check the other independently rather than assuming a shared fix.

## Environment Notes

- This plugin's testing has moved across several Forge servers as they've been provisioned/expired: `flux-frmka2kzh49` → `flux-f04qohdte49` → `flux-fdrk6suoj49` → `flux-fhhcov1xf49` → `flux-f3lnytazd49`. Always reconfirm existing (closed) bugs on a new server before assuming they're still fixed there — and re-check whether a needed fixture (Story Points feature toggle, My Page block, specific sprints) exists fresh each time, since server provisioning doesn't carry fixtures forward.
- A fresh server's default theme is not always Standard — one instance (`flux-f3lnytazd49`) defaulted to Redmineflux Scarlet. Always verify the active theme (`document.querySelector('#settings_ui_theme').value` or check for a themed `<link>`) after attempting to set it — a form-submit that appears to succeed can silently fail to persist if the wrong submit control was clicked.
