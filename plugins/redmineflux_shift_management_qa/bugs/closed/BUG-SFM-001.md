# Bug Report Template

- Bug ID: BUG-SFM-001
- Production Redmine Issue ID: #121065
- Title: Shift Management's global JS double-binds `[data-confirm]` handling, requiring every native confirm dialog site-wide to be accepted/dismissed twice
- Redmine version: 7.0.0
- Plugin name: redmineflux_shift_management
- Plugin version: (see Administration → Plugins → Shift Management)
- Environment: localhost:3010 (redmine-docker-700-redmine-1)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-22

## Steps to reproduce

1. Log in as Admin (or any role) on any Redmine page — the Shift Management plugin's JS asset
   (`shift_management-*.js`) is loaded globally on every page, not only the plugin's own screens
   (confirmed via `document.scripts` filtered to `plugin_assets` on the unrelated Custom Fields admin page —
   14 plugin scripts load there, including this one).
2. Go to Administration → Custom fields → Issues (`/custom_fields?tab=IssueCustomField`).
3. Create a disposable test custom field (any Format/Name) and click "Create" — this is only to have a
   `[data-confirm]`-protected Delete link to exercise; not itself part of the bug.
4. Click the "Delete" link (`.icon-del`, `data-confirm="Are you sure?"`) next to the test field.
5. A native browser confirm dialog appears ("Are you sure?"). Click OK / accept it once.
6. Observe: the identical confirm dialog reappears instead of the delete proceeding.
7. Click OK / accept it a second time.
8. Only now does the deletion actually go through and the page navigates to the updated Custom fields list.

This is not limited to Custom Fields — any `[data-confirm]`-driven action anywhere in the instance (deleting
an issue, a project, a document, unlinking a relation, etc.) is affected, since the offending handler is
attached globally, not scoped to Shift Management's own UI.

## Expected result

- A single click/accept on the native confirm dialog should either proceed with the action (if confirmed) or
  cancel it (if dismissed) — exactly once, matching Redmine core / Rails UJS's own native `data-confirm`
  behavior used everywhere else in the product.

## Actual result

- Every `[data-confirm]` dialog on every page of the instance requires two accepts before the guarded action
  actually executes (or two dismisses before it's actually cancelled) — the first accept/dismiss appears to
  do nothing except make the identical dialog reappear.

## Root cause

`redmineflux_shift_management/assets/javascripts/shift_management-02242f4f.js` (loaded on every page via the
plugin-asset/view-hook mechanism) re-implements confirm-dialog handling with an **unscoped**
`document.querySelectorAll('[data-confirm]')`:

```js
// Confirm dialogs driven by data-confirm attr (Redmine handles most,
// but ensure plugin buttons are covered too).
document.querySelectorAll('[data-confirm]').forEach(function (el) {
  el.addEventListener('click', function (e) {
    if (!window.confirm(el.getAttribute('data-confirm'))) {
      e.preventDefault();
    }
  });
});
```

This binds a second, independent `click` listener to **every** `[data-confirm]` element on **every** page of
the Redmine instance — not scoped to Shift Management's own UI, despite the comment's stated intent to only
"ensure plugin buttons are covered." Rails UJS already delegates native handling for `[data-confirm]`
site-wide; this plugin's handler duplicates it, so a single click fires `window.confirm()` twice in sequence
(once from each handler), and the action only proceeds once both confirms are accepted.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-SFM-001/deleted-after-second-accept.png)

_(Native browser `confirm()` dialogs are OS-level modals rendered outside the page — Playwright's screenshot
tool cannot capture the dialog itself while it is open, and blocks with "does not handle the modal state"
during the reproduction. The sequence was instead verified programmatically: `browser_handle_dialog(accept:
true)` was called once — the dialog was confirmed still open/blocking afterward — then called a second time,
after which the page finally navigated and the deletion completed, shown in the attached screenshot of the
resulting Custom Fields list.)_

### Retest screenshot

![Retest 2026-09-25 PASS — custom field deleted after a single accept](../../screenshots/BUG-SFM-001/retest-2026-09-25-pass.png)

### Console / log

- `document.scripts` on `/custom_fields` (unrelated to Shift Management) lists
  `.../plugin_assets/redmineflux_shift_management/javascripts/shift_management-02242f4f.js` among 14 plugin
  scripts loaded on that page — confirming the JS runs site-wide, not just on Shift Management's own screens.
- Reproduction sequence (Playwright MCP `browser_handle_dialog`):
  1. Click "Delete" → modal state reports `"confirm" dialog with message "Are you sure?"`.
  2. `browser_handle_dialog(accept: true)` → tool result still reports the same modal state pending
     (dialog reappeared rather than the action proceeding).
  3. `browser_handle_dialog(accept: true)` again → page navigates, deletion completes.

## Production report

- Reported to `ztflux` as issue #121065, 2026-09-22.
- Priority: High (3); Defect Severity: High-severity; Defect priority: High; Defect Type: Functional.
- Category: Shift Management (5888).
- Assigned to: Sheetal Sharma (397).

## Retest — 2026-09-25 — PASS (FIXED)

- Environment: localhost:3010 (redmine-docker-700-redmine-1), Redmine 7.0.0, Chromium (Playwright MCP), Admin.
- Fix under test: plugin commit `d29e480` "rsm-093: fix site-wide confirm dialogs requiring two clicks"
  (Sheetal Sharma, 2026-09-22), which removes the unscoped `document.querySelectorAll('[data-confirm]')` handler
  from `assets/javascripts/shift_management.js` entirely and relies on Rails UJS.
- Deployed-asset check: the served asset is now `shift_management-c2dd912b.js` (was `-02242f4f.js`), and its
  content no longer contains `querySelectorAll('[data-confirm]')` — the running server serves the fixed build.

| # | Check | Result |
|---|-------|--------|
| 1 | Original repro — Administration → Custom fields → Issues, created disposable field "QA SFM-001 Retest Disposable" (#92), clicked Delete, **dismissed once** | Dialog closed after one dismiss, no reappearance; field still present — PASS |
| 2 | Same Delete link, **accepted once** | Page navigated immediately, flash "Successful deletion.", field gone — PASS |
| 3 | Plugin's own `data-confirm` link (the only one — Attendance detail → Delete, "Delete this record?") on a disposable manual attendance entry (#1, Redmine Admin, 2026-09-24): **dismissed once** | Dialog still appears (UJS covers it), closed after one dismiss, record kept — PASS |
| 4 | Same Attendance Delete link, **accepted once** | Redirected to Attendance, flash "Successful deletion." — PASS |

- Regression note (SENIOR_QA_STANDARDS §26): checks 3–4 cover the side of the fix most at risk — that removing
  the handler didn't leave the plugin's own delete link without a confirm. The plugin's other delete actions
  (departments, teams, holidays, holiday schemas) use their own in-page modals, not `data-confirm`, so they
  are unaffected by this change.
- The Attendance detail page (`/shift_management/attendance/:id`) has no inbound link anywhere in the UI
  (the calendar only opens an edit modal), so it was reached by direct URL — the only way to reach it.
- Both disposable fixtures (custom field #92, attendance #1) were deleted during the retest itself.

## Closure — 2026-09-25

- Production #121065 updated In QA → **Done**, % done 0 → **100** (user-approved 2026-09-25).
- Local file moved `bugs/open/` → `bugs/closed/`.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate):
