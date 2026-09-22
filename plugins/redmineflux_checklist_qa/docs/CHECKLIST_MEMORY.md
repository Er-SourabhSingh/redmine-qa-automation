# Plugin Memory — Redmineflux Checklist

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

- A checklist created via the "New checklist" AJAX flow (`assets/javascripts/checklist.js`, not
  `_checklist.html.erb`) briefly renders its sub-list with `display: none` in the DOM while it has zero items —
  this file wasn't touched by the #120920 "expanded by default" fix. No visible consequence: an empty `<ul>` looks
  identical either way, and the existing "add first item" handler (`checklist.js` ~line 362) already force-sets
  `display: block` the moment the first item is added. Not a bug — verified 2026-09-21, see TC-CHK-038 evidence.

## Confirmed Working

- **Expand-by-default (#120920), 2026-09-21:** checklists render expanded on a fresh page load, for every
  checklist on an issue, under both Admin and a non-admin Member role. Collapse/expand toggle still works. A
  manually collapsed checklist is remembered via `localStorage` (`redmineflux_checklist_collapsed`), survives
  reload and AJAX re-renders triggered by mutations on *other* checklists, and clears correctly on re-expand (no
  stuck/accumulating state). The remembered state is scoped to the browser, not the Redmine account — confirmed
  by switching accounts in the same browser tab; no checklist item data leaked or differed between accounts, only
  the cosmetic expand/collapse view. Full detail: `testcases/CHECKLIST_CHECKLIST_MANAGEMENT.md` TC-CHK-037–228.

- **Checklist Templates suite (23/23 TCs), 2026-09-21:** full CRUD (create/edit/delete/cancel-delete), tracker
  binding and rebinding, apply-to-issue (ordered, nested, additive not destructive, journaled, clean refusal on
  a duplicate re-apply — NOT a silent no-op), a 100-entry template applies without timeout, empty-tracker picker
  state is explicit ("No templates found for this tracker."), non-admin blocked by direct URL on all 3
  template-management endpoints, and checklist data survives both a source-template deletion and an issue
  tracker change. No bugs. Full detail: `testcases/CHECKLIST_TEMPLATES.md`.

- **Block Issue Closing (13/14 TCs, 1 not executed), 2026-09-21:** blocks the full Edit form, bulk edit (clear
  itemized "Failed to save N issue(s)..." message, nothing silently closed), and the Inline Editor plugin's
  quick-edit path (message correctly identifies the cause, just wrapped in that *other* plugin's own generic
  "Could not save:" prefix — cosmetic, tracked as `BUG-INE-002`, not this plugin). Applies to every closed status
  on the instance (Closed, Rejected), requires *every* checklist on the issue complete (not just one), doesn't
  affect non-closed transitions, doesn't retroactively invalidate issues closed before the setting was enabled,
  re-evaluates live (deleting the blocking item unblocks immediately), and the error message is fully localized
  (confirmed in German: "Ticket kann nicht geschlossen werden, da unvollständige Checklisten vorhanden sind.").
  **TC-CHK-011 finding:** a parent issue with an open subtask doesn't even offer closed statuses in its Status
  dropdown — this is Redmine's own core/workflow-level "no closing a parent with an open child" rule, completely
  independent of this plugin's checklist state (confirmed: the subtask's checklist being complete didn't change
  it, only the subtask itself being closed did). So the Checklist plugin's block-closing feature never gets a
  chance to interact with that scenario on this instance. **TC-CHK-010 (REST API bypass) not executed** — needs
  a real API key supplied out-of-band in a future session (see Progress Tracking suite note below for why).

- **The plugin does not apply a uniform "project closed = read-only" guard across its controllers.** Confirmed
  2026-09-22 (`BUG-CHK-005`, High) on project `checklist-perm-private` (closed): `POST /checklists` → 201,
  `PATCH /checklists/:id/toggle_completed` → 200, `DELETE /checklists_delete/:id.json` → 200 all succeed on a
  closed/read-only project. **Only** `GET /checklists/new_from_template` enforces the closed-project check (403)
  — and even that gives no user-facing feedback, just a console-only error. If retesting after a fix, check
  every checklist-mutating endpoint (create checklist, create item, toggle, delete, update_state), not just the
  one that already works — the fix needs to be applied consistently, not just to the one endpoint that already
  had it.

## Recurring Issues

- `assets/javascripts/checklist.js`'s AJAX-*creation* success handlers (new checklist, new sub-item) build the
  new row as a raw HTML template-literal string and `.append()` it, interpolating the server's own echoed title
  text **unescaped** — unlike the *edit* success handlers in the same file, which correctly use `.innerText`.
  Confirmed exploitable (`BUG-CHK-002`, Critical, 2026-09-21): a `<script>` tag in a title executes immediately
  on creation. Not a stored XSS for other viewers — a normal reload renders it safely escaped via
  `_checklist.html.erb`'s Rails auto-escaping — but a real client-side self-XSS. Check this exact pattern
  (raw-HTML-string + `.append()`/`.html()` vs `.text()`/`.innerText`) in any future `checklist.js` change.
  Confirmed 2026-09-21 (TC-CHK-111) that the **template name/entries path does not share this bug** — templates
  are fully server-rendered and correctly escaped everywhere (admin list, apply-picker, applied issue checklist,
  journal), including the raw `<script>` payload test. So this is specific to the manual-item creation AJAX
  handlers, not templates.

- `assets/plugin_assets/redmineflux_checklist/checklist_checkbox-*.js`: clicking a sub-checklist item's checkbox
  fires **two** separate AJAX PATCH requests for the same state change — the checkbox's own `change` handler
  PATCHes `/checklist_items/{id}/toggle_completed`, and that request's success callback sets the item's status
  `<select>` value and calls `$select.trigger('change')`, which independently fires a second handler that
  PATCHes `/checklist_items/{id}/update_state`. Each write logs its own Checklist History journal entry, so
  **every single click** (not only rapid ones) writes a duplicate entry; rapid clicking compounds it further via
  unsequenced overlapping requests. Confirmed via Network tab + journal on 2026-09-21 (`BUG-CHK-004`, Medium —
  audit-trail only, the checkbox's actual final state is always correct). Note the same file already has a fix
  for a *different*, closely related race (parallel bulk sub-item toggle vs. parent-checklist toggle, serialized
  via `.always()` to dodge an optimistic-locking 409 on `Issue#lock_version` — see the file's own code comments)
  — the checkbox→select cascade above is a separate, still-open path.

- **Progress & Status Tracking (13/14 TCs, 1 FAIL → BUG-CHK-004), 2026-09-21:** item status dropdown (New/In
  Progress/Done) lives on **sub-checklist items**, not top-level items (which only have a checkbox) — checkbox
  and dropdown are kept in sync as one state. Progress bar is exact (25/50/75/100%, no rounding artifacts) and
  per-checklist (each top-level entry tracks only its own sub-items). Auto-calculate correctly drives the
  issue's core % Done field when on and leaves it alone when off, live, no restart. **Auto-calculate quirk,
  confirmed correct not a bug:** once any checklist exists on an issue and the feature is on, % Done becomes
  checklist-derived instead of manual — a freshly-created empty checklist is 0% complete, so % Done can drop
  immediately on checklist creation. This looked like a bug at first (a bug hypothesis, BUG-CHK-003, was filed
  and then retracted) but it's the feature's own intended mechanism, consistent with every other auto-calculate
  case in the suite. 25%-type fractions land on the nearest 10% step in the issue's native % Done field (a core
  Redmine constraint, not a plugin rounding bug). Deleting the only completed item / adding an item to a 100%
  checklist both recalculate live and correctly. Empty checklist shows a clean 0%, never NaN/Infinity.
  Non-edit-permission users (Reporter role) are blocked by both a disabled, tooltip-explained checkbox and a 403
  on the direct endpoint. Full detail: `testcases/CHECKLIST_PROGRESS_TRACKING.md`.

## Environment Notes

- Local Redmine 7 Docker instance (`redmine-docker-700-redmine-1`, `localhost:3010`) now auto-starts Redis +
  Sidekiq on every restart via a custom Dockerfile — see root `MEMORY.md` → "Redmine 7 Auto-Starts Redis+Sidekiq".
  Gem changes on this instance need an image rebuild (`docker compose up -d --build redmine`), not just a restart.
- This instance's seed-user pool (`QA_CREDENTIALS.md`) was not present until 2026-09-21 — imported all 20 users
  via Administration → Users → Import (CSV), except `aurora.wren`, which already existed here as a real identity
  (Sourabh Singh, user id 5), not a generic test persona.
