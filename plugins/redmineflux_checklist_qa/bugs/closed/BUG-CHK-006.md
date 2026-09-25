# Bug Report

- Bug ID: BUG-CHK-006
- Production Redmine Issue ID: #121326
- Title: Checklist changes wrote a comment onto the issue's Notes tab again — regression of #87932
- Redmine version: 7.0.0 (Docker)
- Plugin name: Redmineflux Checklist Plugin
- Plugin version: 7.0.0
- Environment: Local Docker (redmine-docker-700-redmine-1), http://localhost:3010
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-25

## Steps to reproduce

1. Open an issue that has a checklist on it, and note how many entries the issue's **Notes** tab has.
2. Tick a checklist item (or un-tick, rename a checklist, add one, delete one — any checklist mutation).
3. Go back to the **Notes** tab.

## Expected result

- Nothing new appears in the Notes tab — that tab is for what people write. The checklist change belongs in
  the **Checklist History** tab, which exists specifically for it. (Original ask from #87932.)

## Actual result (before fix, commit `be748c4`)

- A new entry appeared in the Notes tab for every checklist tick/rename/create/delete, formatted exactly like
  a comment typed by the ticking user — complete with Quote, Edit and Delete buttons, since Redmine treated it
  as a genuine note.
- Root cause: commit `be748c4` (2026-08-11) added "touch parent issue's `updated_on`/journal on every
  checklist mutation" to fix a real, separate problem — an issue with active checklist work never surfaced
  when sorting/filtering by Updated, because nothing about a checklist change touched the issue itself. The
  fix for that problem was implemented by writing a **comment** on the issue for every checklist change, and a
  comment is exactly what the Notes tab renders — reintroducing the exact defect #87932 had already fixed
  once. Filed as a new ticket (`#121326`) rather than reopening #87932, since #87932 is attached to a closed
  release (Checklist Plugin 1.0.3) that Redmine won't allow reopening, and the cause this time was a different,
  much later change.

## Fix (commit `f51af5b`)

- The issue is still marked as updated (via `Issue#touch`) whenever a checklist changes, so sorting/filtering
  by Updated keeps working exactly as it has since the August fix. It just no longer writes a comment — what
  each checklist change actually was is recorded in full in the Checklist History tab on the same page, same
  as before `be748c4`.
- Source: `lib/redmineflux_checklist/concerns/issue_journal_touch.rb`'s `touch_issue` calls `issue.touch`
  (bumps `updated_on` and `lock_version`, no journal/comment created), not `issue.init_journal` or any
  comment-creating path. The module's own header comment explicitly documents this history (cites #87932 and
  the regression).
- A related side effect fixed in the same commit: touching the issue also bumps its `lock_version`, which used
  to make the issue page's *cached* `lock_version` go stale the instant a checklist mutation ran — so the next
  status/field change from that same page (inline editor or the full edit form) failed with Redmine's
  optimistic-locking "stale object" error until a reload. The fix hands the new `lock_version` back to the
  browser via an `X-Issue-Lock-Version` response header (`set_issue_lock_version_header`), an `after_action` in
  the checklist controllers, so a subsequent inline edit on the same page succeeds without a reload.
- One documented behavior change from #87932's original ask: #87932's Expected Result asked for checklist
  updates to appear under the general **History** tab. They now appear under **Checklist History** instead —
  Redmine's own History tab only lists journal entries (comments and issue-field changes), and a checklist
  change is neither; putting them there again is what caused this regression both times. A future request for
  checklist changes to *also* appear in the general History tab would need a different approach and its own
  ticket (noted by the dev, not something this fix attempts).

## Evidence

### Screenshot

![Retest evidence — Notes tab absent, Checklist History and issue Updated timestamp both correctly reflecting the change](../../screenshots/BUG-CHK-006/retest-2026-09-25-pass.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-CHK-006/retest-2026-09-25-pass.png)

### Console / log

- Network: `PATCH /checklist_items/208/toggle_completed` → 200; immediately followed by `PUT
  /issues/1578/update_field` (Priority change, same page, no reload in between) → **200 OK**, not a
  409/stale-object error.

## Retest — 2026-09-25

- **Result: PASS (FIXED).** Retested live via Playwright on a fresh issue (#1578, `test project`, created
  specifically for this retest to avoid this instance's own unrelated required-custom-field noise on its
  older fixture issues).
- **Notes tab:** created a checklist, then toggled its checkbox. No "Notes" tab ever appeared on the issue at
  all (Redmine only renders a tab that has content) — confirming zero comments were written by either
  checklist action. Only a "Checklist History" tab (and, once a genuine field was edited, a "History" tab for
  that unrelated property change) appeared.
- **Checklist History tab:** both actions — "Checklist added: BUG-CHK-006 retest checklist" and the
  status-change tick — are correctly recorded there, each with who did it and when.
- **Issue "Updated" timestamp:** refreshed to "less than a minute ago" immediately after the checklist tick
  (was several hours old beforehand on the original retest fixture, issue #1538, before switching to the
  clean #1578 fixture).
- **Stale-object check:** immediately after ticking the checklist (same page, no reload), opened the inline
  Priority editor and changed Normal → High. `PUT /issues/1578/update_field` returned **200 OK** and the
  change persisted (confirmed "High" after reload) — no stale-object/lock_version error, confirming the
  `X-Issue-Lock-Version` header hand-back works.
- **History tab content check:** after the Priority change, the History tab showed **exactly one** entry (the
  Priority property change) — no checklist-related comment mixed in, confirming the fix is fully contained to
  the checklist mutation paths and doesn't affect or get affected by ordinary issue-field history.
- Note: an earlier attempt at the stale-object check on issue #1538 (this instance's long-lived test fixture)
  returned a 422 from unrelated pre-existing unfilled required custom fields on that issue (`QA Required Text
  Field`, etc.) — a data-quality artifact of that fixture's history, not a symptom of this bug. Switched to a
  freshly created, minimal issue (#1578) to get a clean read; the 422 does not appear there.
- Not yet independently retested as a non-admin member (dev's own "For QA" checklist asks for this) — this
  session covered Admin only. The touch/lock-version mechanism is role-agnostic (it runs for any user who can
  mutate a checklist), so no role-specific difference is expected, but this is flagged as not yet directly
  confirmed.

## Duplicate check

- Duplicate found: No — checked `bugs/_duplicates.md` and `bugs/_index.md`. Related to, but not a duplicate
  of, `BUG-CHK-004` (duplicate journal *entries* from a double-AJAX-write cascade — a different mechanism
  entirely; that bug was about the Checklist History log itself having duplicate rows, not about anything
  leaking into the Notes tab).

## Closed — 2026-09-25

Filed and retested PASS in the same session — the fix (commit `f51af5b`) was already live on this instance
before this bug file was written, confirmed via source inspection and live retest. Filed directly to
`bugs/closed/` rather than `bugs/open/` → `bugs/closed/`, since no window existed where this was open-and-unfixed
locally. **Production issue #121326 was NOT touched this session** (still "In QA" on production, 90% done,
with the dev's own verification table already attached) — no status/percent-done sync was made, pending
explicit direction on whether to do so.
