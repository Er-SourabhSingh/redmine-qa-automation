# Plugin Memory — Redmineflux Agile Board

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

- "Story Points" is a **plugin-level feature toggle** ("Story Points aktivieren" checkbox on Administration → Plugins → Redmineflux Agile Board's own configuration page), NOT a core-Redmine custom field — `/custom_fields` will never show it, checking there to determine availability gives a false negative. It is OFF by default on a fresh Forge server; enabling it is the user's call (a global feature toggle, not something to flip unprompted), but once enabled it's a simple settings checkbox, not a data-model change.
- Kanban cards on the board aren't natively `draggable` — dragging (status-change or reordering) requires a real `page.mouse` down/move/up sequence with `waitForTimeout` pauses between steps, not `browser_drag` or synthetic `dispatchEvent`. Same technique needed for the dependency-handle-style interactions on other Redmineflux plugins.
- The My Page Agile Board block is not present by default on a fresh account — add it via the "Hinzufügen" dropdown ("Agile Board" option) when it's needed for a retest, and remove it again afterward (via the block's own "Löschen" link, not a direct `/my/remove_block?block=...` GET request — that 404s) to avoid leaving unrequested state on the account.

- **Feature #120436 (Backlog story points), verified working 2026-09-18.** The Backlog column badge renders as
  `<closed> / <total> SP` (e.g. `2 / 18 SP`) with a `title` of "<closed> of <total> story points closed", in
  `span.backlog-column-story-points`. It is gated on **Enable Story Points** and is omitted entirely - not shown
  as `0 / 0 SP` - when a column carries no points. Two new **global** settings live in a `Backlog` section of the
  plugin Configure page, both default off: `backlog_show_closed_issues` and `backlog_wide_unassigned_column`
  (the latter adds `.backlog-column-wide`, 440px, only above 1024px).
- **A sprint column's card count and its points badge are scoped differently** while *Show completed issues in
  Backlog* is off: the count reflects only the drawn (open) cards, the badge covers every issue in the sprint
  including hidden closed ones. Expected - requirement 2 could not work otherwise - but the two numbers on one
  header can look inconsistent, so don't file it as a mismatch bug without re-reading this note.
- **The Checklist plugin can block closing an issue** ("Issue cannot be closed as there are incomplete
  checklists") - hit on issue #1528 on the local Redmine 7 instance. When building a closed-issue fixture for any
  story-point or status test, check the error block after submitting; pick a different issue rather than assuming
  the Agile Board form failed.
- **Setting a Redmine issue-form `<select>` via JS `.value = ...` + a synthetic `change` event does not reliably
  persist** on submit - two fixture edits silently saved nothing this way. Use a real `selectOption` interaction.
- On the local Redmine 7 instance, **Resolved is NOT a closed status**; only **Closed** and **Rejected** carry the
  "Issue closed" flag. That makes Resolved/Rejected a good pair for proving a closed-points calculation follows the
  flag rather than the status name.

- **`settings[story_point_values]` is only rendered while Enable Story Points is checked**, so a disable-then-save
  followed by an enable-then-save wipes it to `""` (`BUG-AGB-009`). The field then shows the default list as a
  **placeholder**, which looks identical to a populated field at a glance - always read `.value`, never the
  rendered text, when checking whether the scale is configured. With the setting blank the issue form falls back
  to the built-in 11-value default, so a wrong dropdown is the visible symptom.

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

- **Local Docker Redmine 7** (`redmine-docker-700`, `http://localhost:3010`, compose at `C:\redmine-docker-7.0.0`)
  is where Feature #120436 was sanity-tested. Redis + Sidekiq do not survive a container restart - run
  `bash start-background-jobs.sh` after every `docker restart`. On this instance **no project had the Agile Board
  module enabled**; it was switched on for "test project" via Settings > Modules. Fixtures created there for
  #120436: sprint "SP Sanity Sprint 120436" and issues #1530 (New, 8 SP), #1529 (Resolved, 5 SP), #1528 (New, no
  SP), #1527 (Rejected, 2 SP), #1526 (In Progress, 3 SP) - all in that sprint. "test project" holds ~1180 issues,
  which also makes it a usable fixture for the lazy-load case TC-AGB-536.
