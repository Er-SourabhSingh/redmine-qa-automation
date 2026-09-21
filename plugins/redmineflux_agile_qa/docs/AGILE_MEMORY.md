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

- **`BUG-AGB-009` FIXED and closed 2026-09-21** (commit `288d293`). `settings[story_point_values]` used to be
  rendered only while Enable Story Points was checked, so a disable-then-save followed by an enable-then-save wiped
  it to `""`. Now the field is always rendered and hidden with CSS (`display: none`) instead of being removed from
  the DOM, and it reappears immediately when the checkbox is re-ticked, before any save. Retested against the
  exact repro: value survives the full off/on cycle on both the Configure page and the issue form dropdown.
  Still worth remembering: the field previously showed the default list as a **placeholder** when empty, which
  looked identical to a populated field at a glance - if a similar always-vs-conditionally-rendered field issue
  ever comes up elsewhere, read `.value`, not the rendered text.

- **`BUG-AGB-011` (open, High) - Backlog story-points badge goes wrong (incl. negative) after a drag, without a
  reload.** Found within Feature #120436's own delivered code, discovered right after that ticket was marked Done
  on production. Root cause: `backlog.html.erb`'s sortable `update` handler updates the card count
  (`updateSingleColumnCount`) on drop but never touches `.backlog-column-story-points` - that badge is only
  rendered at initial page load (`backlog_story_points_badge`, `rf_boards_helper.rb`). A subsequent inline point
  edit (`rf_story_points.js`'s `updateBadges`) then applies its delta on top of the stale, drag-desynced badge,
  compounding the error - repeated drags/edits in one session can drive the number arbitrarily wrong, including
  negative. **Purely client-side**: a plain reload always shows the correct total, nothing is written wrong to
  `story_points` server-side. **Testing-methodology lesson**: this only shows up when a drag and an inline point
  edit happen back-to-back in the same page load, no reload in between - exactly real sprint-planning behavior,
  but not a scenario this suite's TC-by-TC (each followed by a check/reload) execution ever exercised. If this
  plugin gets any other "live badge/count" feature in the future, test it the same combined way, not just as
  isolated single-action TCs. Reported to production 2026-09-21 as **#120990** (assigned Prashant Chaurasia,
  user id 410 — project memberships list is the reliable way to resolve a numeric user id when `list_users`
  is permission-blocked for this API key). Companion action: production **#120436** reopened (Done/100% ->
  In QA/90%) pending this fix and retest.

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

- **`BUG-AGB-010` (open, Medium - downgraded from an initial High)**: a `query_id` parameter on the Agile
  Board/Backlog controller crashes 500 with `FrozenError (can't modify frozen String: "project_id IS NULL")`
  in `RfBoardsController#retrieve_rf_agile_query` (rf_boards_controller.rb:1596). Cause: the file has
  `# frozen_string_literal: true` and the method builds a SQL condition with a mutating `cond << " OR ..."` on
  a frozen literal. Hits the project Kanban board too (shared before_action across 10 action entry points) -
  almost certainly Global board and My Page block as well, though only Backlog and the project board were
  directly confirmed. **Checked every view in the plugin for a `query_id` link into Backlog/Agile Board: none
  exists** - the Issues sidebar's own saved-query links only ever point at `issues?query_id=N`. So there is no
  button or link that reaches this crash; it requires manually editing the URL, which is why severity was
  revised down after the initial filing. Still a real, intentionally-handled input from the controller's own
  code (not dead code), so worth fixing regardless. Workaround: use `set_filter=1` with explicit `f[]`/`op[]`
  params instead of `query_id` on these pages. **TC-AGB-541 ("a saved query overrides the setting") is marked N/A, not blocked** - there is no UI feature to load a saved query on the Backlog or Agile Board pages at all, so the TC describes something the product never built; this bug is an independent side-finding, not the reason the TC can't run.
- **Fractional Story Points are rejected by design, not a gap.** The Story Point Values input has client-side
  validation ("Story points must be positive integers only (no decimals or negative numbers)"); an invalid
  submission (e.g. "2.5") is safely ignored server-side too, leaving the prior valid config untouched rather
  than corrupting it.
- **Redmine's REST API on this instance requires `X-Redmine-API-Key`/`?key=`, and even a valid admin key 403'd**
  on the Agile Board plugin's `/api/v1/projects/:id/backlog` endpoint with "Filter chain halted as
  `:check_if_login_required` rendered or redirected" - i.e. Redmine core's own login-required filter fires
  before the plugin's custom API-key check gets a chance to run. Not root-caused; worth investigating with more
  time before assuming it's a real defect.
- **The Backlog page's "Board Settings" panel has two separate submit buttons in the same form — don't confuse
  them.** The filter panel's own "Apply" button sits right next to the Board Settings panel's "**Apply Settings**"
  button; only the latter submits `board[visible_card_fields][]`. Clicking the wrong one looks identical (both
  reload the Backlog) but never touches card-field visibility, which briefly looked like a persistence bug
  during TC-AGB-537 until the right button was used — it persists correctly. Once `story_points` is checked
  and saved via "Apply Settings", every card renders a `[data-points]` button; clicking it inserts a
  `<select class="rf-points-select">` next to the button (`rf_story_points.js`) that creates/updates/removes the
  column badge live, matching a reload exactly. The Kanban board's own settings panel uses a different, separate
  scheme (`show_story_points` boolean) that doesn't map onto Backlog cards — that one genuinely is a different
  mechanism, not a bug.
- **To test as a non-admin project member, use the pre-seeded `testuser100` / `testuser<N>` accounts** (password
  `12345678`, set via Administration > Users since they aren't in the shared QA_CREDENTIALS.md pool) rather than
  the `luna.blossom`-style seed users - the latter don't exist as Redmine users on this particular local
  instance, only the `testuser1`-`testuser100` fixtures from a separate dummy-data seed do. The Developer role on
  this instance does **not** have "View Agile Board" granted by default - grant it temporarily for a
  non-admin Agile Board test and revert it afterward, so other suites' permission fixtures aren't disturbed.
