# Bug Report

- Bug ID: BUG-CHK-004
- Production Redmine Issue ID: #121060
- Title: Toggling a sub-checklist item's checkbox writes duplicate Checklist History journal entries — cascading AJAX calls on every click, worse under rapid clicking
- Redmine version: 7.0.0 (Docker)
- Plugin name: Redmineflux Checklist Plugin
- Plugin version: 7.0.0
- Environment: Local Docker (redmine-docker-700-redmine-1), http://localhost:3010
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-21

## Steps to reproduce

1. On an issue, add a checklist with one sub-item (e.g. via Actions → Add on a checklist entry).
2. Click the sub-item's checkbox **exactly once** (tick it).
3. Open the browser's Network tab (or the issue's own Checklist History) and observe the requests fired / journal entries written by that single click.

**Amplified variant:** rapidly click the same checkbox several more times in quick succession (no delay between clicks) — the same issue compounds further.

## Expected result

- One click = one logical state transition = one PATCH request = one journal entry (plus, separately, one checklist-level "completed" journal entry only when the parent checklist's overall completion state actually changes).

## Actual result

- **A single click already fires two separate PATCH requests to two different endpoints for the same item**, confirmed via the Network tab:
  - `PATCH /checklist_items/55/toggle_completed` → 200 OK
  - `PATCH /checklist_items/55/update_state` → 200 OK
- Both requests independently write a "status changed to 'Done'" journal entry, so **one click produces two identical item-level journal entries** plus the expected checklist-level "completed" entry — 3 entries total for 1 real transition:
  1. "Checklist Item 'Single click test item' status changed to 'Done' in checklist 'Progress item D' by Redmine Admin." *(from `toggle_completed`)*
  2. "Checklist 'Progress item D' status changed to completed by Redmine Admin." *(checklist-level, correct)*
  3. "Checklist Item 'Single click test item' status changed to 'Done' in checklist 'Progress item D' by Redmine Admin." *(from `update_state` — exact duplicate of #1)*
- **Root cause, found by reading `checklist_checkbox-0fb4baca.js`:** the checkbox's `change` handler PATCHes `/checklist_items/{id}/toggle_completed`; that request's `success` callback then sets the item's status `<select>` value and calls `$select.trigger('change')` — which fires a **separate** `.checklist-item-state` `change` handler that PATCHes a second endpoint, `/checklist_items/{id}/update_state`, for the exact same item and the exact same resulting state. Each PATCH independently logs its own journal entry server-side. This double-write happens on every ordinary click, not only rapid ones.
- **Rapid clicking compounds it further:** 2 rapid clicks (tick, untick) on a different item produced 6 journal entries instead of the already-inflated baseline of ~4; 5 rapid clicks on another item produced 15 entries, with "Done" appearing 3× consecutively and the parent checklist's "completed" status appearing 5× consecutively — consistent with unsequenced overlapping requests stacking on top of the baseline double-write. (The same file's code comments show the author already fixed one closely related race — parallel bulk sub-item toggle vs. parent-checklist toggle, serialized via `.always()` to avoid an optimistic-locking 409 — but the checkbox→select cascade above is a separate, unfixed path.)
- Impact: the checklist's own functional state (checkbox, completion %) is not affected — this is an **audit-trail / data-integrity defect in the Checklist History log**, not data loss. A reviewer reading the history for any item would see a permanently inflated, misleading number of transitions on every single click.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-CHK-004/rapid-toggle-duplicate-journal-entries.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-CHK-004/retest-yyyy-mm-dd-pass.png)

### Console / log

- Network tab: `PATCH /checklist_items/55/toggle_completed` (200) immediately followed by `PATCH /checklist_items/55/update_state` (200) from one click on issue #1538's "Single click test item" (checklist "Progress item D").
- Checklist History tab (`/issues/1538?tab=checklist_history`) entries #51–#53 for that single-click repro; entries #44–#49 for a 2-click repro on "Rapid toggle repro item" (checklist "Progress item C"); entries #28–#42 for a 5-click repro on "Sub item B2" (checklist "Progress item B") — all on local issue #1538, project `test-project`.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): n/a — checked `bugs/_duplicates.md` and `bugs/_index.md` before filing.
