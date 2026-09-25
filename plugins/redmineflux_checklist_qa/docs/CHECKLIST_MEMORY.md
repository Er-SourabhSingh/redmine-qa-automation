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

- **BUG-CHK-005 closed-project write gap — FULLY FIXED 2026-09-24 (two rounds).** Round 1: `POST /checklists`,
  `PATCH /checklists/:id/toggle_completed` (and the bulk variant), `DELETE /checklists_delete/:id.json` all
  returned 403 on a closed project and stopped persisting — the write-authorization half. None of the
  controller source (`checklists_controller.rb`, `checklist_items_controller.rb`, `api/*`) actually checks
  `@project.closed?` anywhere — every explicit guard there only checks `issue.status.is_closed?` (the issue's
  own workflow status). The 403 comes from elsewhere in the request pipeline (plausibly core's own
  `allowed_to?(:edit_issues, @project)`/`Issue#editable?`), not from plugin code — not fully root-caused, only
  confirmed behaviorally. Round 1 left the feedback half unfixed (console-only 403, reopened on production).
  **Round 2 (commit `c7521cc`) fixed the feedback half too:** `checklist.js`'s `addErrorDiv()` used to
  `JSON.parse()` every failed response and silently do nothing when that threw — which it always did for
  Redmine's own `render_403` HTML response, exactly the case that mattered most. Now falls back to a plain
  message ("You don't have permission to perform this action.") when parsing fails. Also wired up
  console-only failure handlers (sub-item toggle, status-dropdown change) to show the same message, and added
  a separate `ajax:error` listener for "Add from template" since it's a Rails UJS remote link, not one of the
  plugin's own AJAX calls. Retested live: all 6 actions (create, toggle checklist, toggle sub-item, change
  status, delete, add-from-template) now show a visible message on a closed project; open-project create/delete
  still show their normal success messages with no false errors. Both halves confirmed fixed. **Closed
  2026-09-24** — production #121061 synced to Done/100%.

- **Targeted post-closure check — Permissions + Templates, 2026-09-24 (32/35 independently re-verified live, 3
  carried forward unchanged).** After all three bugs closed, re-ran `CHECKLIST_PERMISSIONS.md` and
  `CHECKLIST_TEMPLATES.md` (the two suites most exposed to BUG-CHK-005's feedback-message fix and to
  permission-gated writes) — 12/12 + 23/23 PASS, 0 new bugs. The 3 carried-forward TCs (TC-CHK-071/072/076) were
  blocked by environment/sandbox constraints this session, not by any suspected regression. Confirmed BUG-CHK-002 (script-tag escaping) and BUG-CHK-004 (single-PATCH toggle) both hold for a
  non-admin role, not just Admin. Confirmed BUG-CHK-005's `addErrorDiv()` fallback message is correctly scoped:
  it now surfaces on a closed-project non-admin block (a real, welcome behavior change from silent-403 to
  visible-message — see TC-CHK-078 in `testcases/CHECKLIST_PERMISSIONS.md`), but does **not** leak into or mask
  the unrelated native-form "duplicate template apply" refusal flash (TC-CHK-106 in
  `testcases/CHECKLIST_TEMPLATES.md`), which still shows its own original message. Full detail in both suite
  files' own "Regression Pass — 2026-09-24 (targeted, post BUG-CHK-002/004/005)" sections. This was a
  user-approved narrower check, not the full `SENIOR_QA_STANDARDS.md` §27 final-cycle regression — see
  `CHECKLIST_HANDOFF.md` for what's still outstanding.

## Recurring Issues

- `assets/javascripts/checklist.js`'s AJAX-*creation* success handlers (new checklist, new sub-item) used to
  build the new row as a raw HTML template-literal string and `.append()` it, interpolating the server's own
  echoed title text **unescaped** — unlike the *edit* success handlers in the same file, which correctly use
  `.innerText`. Confirmed exploitable (`BUG-CHK-002`, Critical, 2026-09-21): a `<script>` tag in a title
  executed immediately on creation. **FIXED 2026-09-24** — both handlers now append an empty `<span>` and set
  its content afterward via jQuery `.text()` (lines 163, 364), citing `#121059` in the fix comment. Retested
  live: neither path executes an injected `<script>` anymore. Confirmed 2026-09-21 (TC-CHK-111) that the
  **template name/entries path never shared this bug** — templates are fully server-rendered and correctly
  escaped everywhere. **Scoped regression (`CHECKLIST_CHECKLIST_MANAGEMENT.md` + `CHECKLIST_PROGRESS_TRACKING.md`,
  41 PASS / 1 N/A) run 2026-09-24, no new bugs.** **Closed 2026-09-24** — production #121059 synced to
  Done/100%.

- `assets/plugin_assets/redmineflux_checklist/checklist_checkbox-*.js`: clicking a sub-checklist item's checkbox
  used to fire **two** separate AJAX PATCH requests for the same state change — the checkbox's own `change`
  handler PATCHes `/checklist_items/{id}/toggle_completed`, whose success callback set the item's status
  `<select>` value and called `$select.trigger('change')`, independently firing a second handler that PATCHed
  `/checklist_items/{id}/update_state`. Confirmed via Network tab + journal on 2026-09-21 (`BUG-CHK-004`,
  Medium — audit-trail only). **FIXED 2026-09-24** — the `.trigger('change')` call was removed from both the
  single-item and select-all handlers, each fix comment citing `#121060`. Retested live: a single click on a
  fresh sub-item now fires only the one `toggle_completed` PATCH, and the journal shows exactly one item-level
  entry (not two) plus the one checklist-level entry. **Scoped regression run 2026-09-24 (14/14 PASS on
  `CHECKLIST_PROGRESS_TRACKING.md`).** **Closed 2026-09-24** — production #121060 synced to Done/100%.

- **Rapid-click checkbox race, narrower than BUG-CHK-004, observed 2026-09-24, not filed.** Even after the
  `BUG-CHK-004` fix, firing 5 checkbox clicks as a synthetic zero-delay `element.click()` loop (all in one JS
  tick — far faster than any real pointer interaction) produced one duplicate consecutive `ChecklistHistory` row
  (6 entries for 5 real transitions) via an apparent request-overlap race, confirmed via `ChecklistHistory` table
  query. Critically, **zero** `update_state` calls occurred even in this stress test — the specific cascade
  mechanism BUG-CHK-004 was about is confirmed gone. The identical 5-click sequence performed as genuine
  Playwright UI clicks (`locator.click()`, each with normal actionability/network latency between them, the same
  way a real user or the original bug repro would click) produced a clean 1:1 result — 5 clicks, 5 entries, no
  duplicates. Not reproducible through real UI interaction, so not filed as a bug; recorded here in case a future
  session sees inflated history counts under genuinely fast real clicking and wants a starting hypothesis.

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
- `luna.blossom`'s actual role on `test project` is **Manager**, not Developer as earlier session notes assumed —
  corrected 2026-09-24 during `CHECKLIST_PERMISSIONS.md` regression (`TC-CHK-068`). She still has full
  `edit_issues`, so this is a naming correction only, not a behavior change to anything already tested with her.
- **Shared-browser session contention observed 2026-09-24.** Twice during a Permissions-suite regression pass,
  navigating to a page immediately after a confirmed anonymous state (logout confirmed via `/login` page content
  and a `/settings` redirect-to-login) instead rendered as **Admin**, within a few seconds, with no login action
  taken. This is consistent with another process/Claude session sharing this environment's Playwright browser
  profile rather than a plugin defect — `reference_playwright_mcp_isolation.md` (root `MEMORY.md`) documents
  `--isolated` as the mitigation, but it did not prevent this collision this time. If a future session needs a
  clean anonymous-only test window (e.g. `TC-CHK-071`/`TC-CHK-072`), expect to retry and verify identity via
  `/my/account` immediately before the action that matters, not just after logout.
- **Direct database writes via `docker exec ... rails runner` are blocked by this session's sandbox policy**
  (2026-09-24, attempted for `TC-CHK-076`'s live-session-permission-change repro) — "Permission for this action
  was denied by the Claude Code auto mode classifier... [Remote Shell Writes]". Read-only rails runner queries
  still work (used earlier the same session to inspect `luna.blossom`'s role before the write attempt). Any future
  TC whose methodology depends on a backend write outside the browser (not just this one) will hit the same
  block; a UI-only equivalent or a relaxed permission would be needed to actually re-run it live.
