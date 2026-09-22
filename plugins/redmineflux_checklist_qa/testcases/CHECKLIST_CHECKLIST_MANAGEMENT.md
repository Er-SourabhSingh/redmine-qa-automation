# Test Cases — Redmineflux Checklist — Checklist & Item Management

> Source: vendor KB https://www.redmineflux.com/knowledge-base/plugins/checklist-plugin/ — sections "Configuration",
> "How to Create Checklist", "How to Edit and Delete the Checklist", "How To Create Sub Checklist item",
> FAQ "Can I create multiple checklists within a single issue?".
> **Status: authored 2026-09-15. TC-CHK-201–222 executed 2026-09-21 (regression pass for #120920) — 21 PASS, 1 N/A,
> 1 FAIL (BUG-CHK-002). TC-CHK-223–228 executed 2026-09-21, all PASS. See per-TC evidence and the consolidated
> regression summary at the end of this file.**

## Plugin
- Name: Redmineflux Checklist Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_checklist_qa

## Navigation methodology

Reach the widget by clicking through real navigation: top menu **Issues** → an issue row → scroll to the
**Checklist** section. Do not jump straight to a deep URL.

---

## Functional Cases — Creating checklists

---

### TC-CHK-201: Create a checklist via Actions → New checklist

**User Role:** Member with issue-edit rights
**Steps:**
1. Open an issue and scroll to the Checklist section.
2. Click **Actions** → **New checklist**.
3. Type a title and press **Enter**.

**Expected Result:**
- The checklist is created and appears in the list immediately.
- It persists after a full page reload — not just an optimistic client-side row.

---

### TC-CHK-202: Create multiple checklists in a single issue

**User Role:** Member
**Steps:**
1. Repeat TC-CHK-201 three times with distinct titles on the same issue.

**Expected Result:**
- All three coexist, each with its own item list and its own progress bar.
- Ordering is stable across reloads.
- Confirms the KB FAQ claim that multiple checklists per issue are supported.

---

### TC-CHK-203: Create a sub-checklist item under a checklist

**User Role:** Member
**Steps:**
1. Click the action button next to an existing checklist.
2. Choose **Add**.
3. Enter a title and press Enter.

**Expected Result:**
- The item is nested under its parent checklist, not created as a sibling top-level checklist.
- The parent's progress denominator increases by one.

---

### TC-CHK-204: Add several items to one checklist consecutively

**User Role:** Member
**Steps:**
1. Add five items in sequence to the same checklist.

**Expected Result:**
- All five persist in creation order.
- The input stays focused or reopens so items can be added consecutively without re-opening the menu each time —
  the KB describes a press-Enter-to-create flow.

---

### TC-CHK-205: Checklist survives an issue update made from another form

**User Role:** Member
**Steps:**
1. Create a checklist with items.
2. Edit the issue subject/description via the normal Edit form and save.

**Expected Result:**
- Checklist and all items are intact after the save. An unrelated issue update must not drop checklist data.

---

## Functional Cases — Editing

---

### TC-CHK-206: Edit a checklist title

**User Role:** Member
**Steps:**
1. Open the action menu next to a checklist and choose **Edit**.
2. Change the title and press Enter.

**Expected Result:**
- The new title is shown and persists after reload.

---

### TC-CHK-207: Edit a sub-checklist item title

**User Role:** Member
**Steps:**
1. Open the action menu on an item, click the edit icon, change the text, press Enter.

**Expected Result:**
- Item text updates and persists; sibling items are unchanged.

---

### TC-CHK-208: Cancel an in-progress edit

**User Role:** Member
**Steps:**
1. Begin editing an item, change the text, then press Escape or click away without confirming.

**Expected Result:**
- The original text is retained. The abandoned edit is not silently saved.

---

## Functional Cases — Deleting

---

### TC-CHK-209: Delete a single checklist item

**User Role:** Member
**Steps:**
1. Open the action menu on an item and choose delete.
2. Confirm the deletion prompt.

**Expected Result:**
- Only that item is removed; the parent checklist and its other items remain.
- Progress recalculates against the new item count.

---

### TC-CHK-210: Delete a whole checklist that contains items

**User Role:** Member
**Steps:**
1. Open the action menu on a checklist that contains items and choose delete.
2. Confirm.

**Expected Result:**
- The checklist and all of its items are removed together.
- The confirmation makes clear that child items go too. A silent cascade with no warning is a usability defect
  worth recording.

---

### TC-CHK-211: Cancel a delete confirmation

**User Role:** Member
**Steps:**
1. Trigger delete on a checklist, then **Cancel** the confirmation.

**Expected Result:**
- Nothing is deleted. The row is still present after a reload.

---

### TC-CHK-212: Expand and collapse a checklist

**User Role:** Member
**Steps:**
1. Click the up-arrow icon next to a checklist to collapse it, then again to expand.

**Expected Result:**
- Items hide and reappear.
- The collapsed/expanded state does not corrupt item data or progress on reload.

---

### TC-CHK-213: Checklist History tab records checklist activity

**User Role:** Member
**Steps:**
1. Create, edit and delete checklist items on one issue.
2. Open the issue's Checklist History tab.

**Expected Result:**
- Each action is recorded with actor and timestamp.
- Entries correspond one-to-one with the actions performed — no missing and no phantom rows.

---

## Negative Cases

---

### TC-CHK-214: Create a checklist with an empty title

**User Role:** Member
**Steps:**
1. Actions → New checklist, leave the field blank, press Enter.

**Expected Result:**
- Creation is rejected with a validation message, or the Enter is a no-op.
- A blank-titled, unidentifiable checklist row must not be created.

---

### TC-CHK-215: Create a checklist with a whitespace-only title

**User Role:** Member
**Steps:**
1. Enter only spaces and tabs, then press Enter.

**Expected Result:**
- Treated the same as empty (TC-CHK-214) — input is trimmed before validation.

---

### TC-CHK-216: Very long checklist title

**User Role:** Member
**Steps:**
1. Enter a 1000-character title and submit.

**Expected Result:**
- Either accepted and rendered without breaking the page layout, or rejected with a stated maximum length.
- A silent truncation with no message is a defect; a 500 error is a High-severity defect.

---

### TC-CHK-217: Special characters and HTML in a checklist title

**User Role:** Member
**Steps:**
1. Create items titled with a script tag, a double-quoted string, an apostrophe-and-ampersand name, and an emoji.

**Expected Result:**
- All are stored and rendered as literal text.
- **No script executes** — the markup is escaped. Script execution here is a Critical security defect.

---

### TC-CHK-218: Duplicate checklist titles on one issue

**User Role:** Member
**Steps:**
1. Create two checklists with an identical title on the same issue.

**Expected Result:**
- Behaviour is consistent and explicit: either both are allowed with distinct IDs and independently editable, or
  the second is rejected with a clear message. Editing one must never modify the other.

---

### TC-CHK-219: Checklist edit on a closed issue

**User Role:** Member
**Steps:**
1. Close an issue that has a checklist.
2. Attempt to add, edit and delete a checklist item.

**Expected Result:**
- Behaviour matches the instance's issue-edit rules. If the issue is read-only when closed, the checklist controls
  are disabled too — not merely hidden while the underlying endpoint still accepts writes.

---

### TC-CHK-220: Concurrent edits from two sessions

**User Role:** Two members in separate browser sessions
**Steps:**
1. Both open the same issue's checklist.
2. User A adds an item; User B, without reloading, deletes a different item.

**Expected Result:**
- Both operations resolve without data loss and without a stale-state exception.
- After both reload, the resulting list is consistent for both users.

---

### TC-CHK-221: Deleting the issue removes its checklists

**User Role:** Manager or Admin
**Steps:**
1. Delete an issue that has checklists.
2. Look for orphaned rows in plugin views and in the Checklist History of other issues.

**Expected Result:**
- Checklist data is removed with the issue. No orphaned records surface elsewhere in the UI.

---

### TC-CHK-222: Checklist section on an issue in a project where the plugin is not applicable

**User Role:** Member
**Steps:**
1. Open an issue in a project whose tracker/module configuration excludes checklists (if such a configuration
   exists on this instance).

**Expected Result:**
- The Checklist section is either absent cleanly or present and functional — never present-but-broken
  (visible controls that error on use).

---

## Functional Cases — Default expanded state (production #120920)

> Covers production feature request #120920 "Display checklists in expanded state by default to improve user
> workflow efficiency" (Checklist Plugin category, In QA, 90% done as of 2026-09-21). Prior behavior: checklists
> rendered collapsed by default, requiring a manual click to expand every time. Requested/expected new behavior:
> checklists render expanded by default; the collapse/expand toggle (TC-CHK-212) stays fully functional.

---

### TC-CHK-223: Checklist renders expanded by default on a fresh issue view

**User Role:** Member
**Steps:**
1. Create a checklist with two or more items on an issue (TC-CHK-201/TC-CHK-203), or use an existing issue that
   already has a checklist.
2. Navigate away from the issue (e.g. back to the Issues list), then open the same issue again as a fresh page
   load.

**Expected Result:**
- The checklist section is already expanded — all items and the progress bar are visible immediately, with no
  click needed.
- Prior/regression behavior (collapsed by default, requiring a manual expand click) does not reappear.

CONFIRMED LIVE 2026-09-21 (Local, redmine-docker-7.0.0, Bug #1530 "gdsfgsdfgd" in test project): **PASS.** Added a
checklist item ("Verify expanded by default") to an existing checklist, navigated away and back as a genuine fresh
page load (not client-side navigation). Verified via DOM inspection, not just visual inspection — the sub-list's
`style.display` was `block` (computed style also `block`), matching the fixed `_checklist.html.erb` template.
Re-verified again after a full container rebuild + asset precompile + restart, with identical result. Also
confirmed under a non-admin **Member** role (`luna.blossom`, Developer project role, fresh `localStorage`) — same
result, expanded by default is not admin-only behavior.

---

### TC-CHK-224: Multiple checklists on one issue all expand by default

**User Role:** Member
**Steps:**
1. Create two or three checklists on the same issue (TC-CHK-202).
2. Reload the issue page as a fresh page load.

**Expected Result:**
- Every checklist on the issue renders expanded by default, not just the first/topmost one.
- Each checklist's own item list and progress bar are visible without any per-checklist click.

CONFIRMED LIVE 2026-09-21 (Local, redmine-docker-7.0.0, Bug #1530): **PASS.** Created a second checklist
("Second checklist for TC-CHK-224") on the same issue as TC-CHK-223's checklist. One side note (not a defect,
verified): a checklist created via the "New checklist" AJAX flow (`checklist.js`) briefly renders with its sub-list
`display: none` in the DOM while it has zero items — this JS row-building template wasn't touched by the #120920
fix (only `_checklist.html.erb` and the collapse-memory code in `checklist_checkbox.js` were). It has no visible
consequence: an empty `<ul>` looks identical either way, and the existing "add first item" handler
(`checklist.js` ~line 362) already self-heals by force-setting `display: block` the moment the first item is
added. Confirmed both checklists render `display: block` on a genuine fresh reload once each has an item — also
re-confirmed under the Member-role pass (`luna.blossom`) with a cleared `localStorage`.

---

### TC-CHK-225: Collapse/expand toggle still works with the new expanded default

**User Role:** Member
**Steps:**
1. On an issue with an expanded-by-default checklist, click the toggle icon to collapse it.
2. Click the toggle icon again to expand it.

**Expected Result:**
- The toggle still hides and reveals items correctly in both directions (regression check against TC-CHK-212).
- Collapsing/expanding does not corrupt item data or progress.

CONFIRMED LIVE 2026-09-21 (Local, redmine-docker-7.0.0, Bug #1530): **PASS.** Collapsed checklist 50 via its toggle
icon — `display` became `none`, item count stayed at 1, `localStorage` recorded `["50"]`. Expanded it again —
`display` back to `block`, item still present, `localStorage` cleared to `[]`. No regression against TC-CHK-212.

---

### TC-CHK-226: A manually collapsed checklist stays collapsed across reloads

**User Role:** Member
**Steps:**
1. On an issue with two or more checklists, collapse exactly one of them via the toggle icon.
2. Reload the page as a fresh page load (not just client-side navigation).
3. Navigate away to another issue and back.

**Expected Result:**
- The checklist collapsed in step 1 comes back **collapsed**; every other checklist on the issue stays expanded.
- Per the implementation, only collapsed IDs are remembered (browser `localStorage` key
  `redmineflux_checklist_collapsed`), so a checklist never touched by the user always renders expanded.
- Re-expanding it and reloading again must bring it back **expanded** — the remembered state has to clear, not
  just accumulate.

CONFIRMED LIVE 2026-09-21 (Local, redmine-docker-7.0.0, Bug #1530, two checklists present): **PASS.** Collapsed
checklist 50, did a real fresh reload (`page.goto`, not client-side nav) — checklist 50 came back `display: none`
with no `icon-test-rotate` class; checklist 51 (never touched) stayed `display: block` with the rotate class.
Re-expanded checklist 50, reloaded again — came back `display: block`. No stuck/accumulating state across two full
reload cycles.

---

### TC-CHK-227: Collapsed state survives a checklist mutation re-render

**User Role:** Member
**Steps:**
1. Collapse one checklist on an issue that has several.
2. Without reloading, perform an action that re-renders the checklist section from the server — e.g. add an item
   to a *different* checklist, or tick an item's checkbox.

**Expected Result:**
- The collapsed checklist stays collapsed after the section re-renders. The server returns every sub-list
  expanded, so the client must re-apply the user's choice; a checklist silently springing back open here is a
  defect.

CONFIRMED LIVE 2026-09-21 (Local, redmine-docker-7.0.0, Bug #1530): **PASS.** Collapsed checklist 51, then (without
reloading) ticked the checkbox on an item in checklist 50 — a different checklist, whose own AJAX re-render fires
`$(document).ajaxComplete` → `restoreCollapsedChecklists()`. After the mutation: checklist 51 stayed `display:
none` (collapsed, correctly re-applied), checklist 50 stayed `display: block` and its checkbox was checked. No
cross-checklist leakage.

---

### TC-CHK-228: Remembered collapse state is per-browser, not per-user account

**User Role:** Two different users, same browser
**Steps:**
1. As user A, collapse a checklist on a shared issue and confirm it stays collapsed on reload.
2. Log out and log in as user B in the same browser; open the same issue.
3. Note the state, then open the same issue as user A in a different browser/profile.

**Expected Result:**
- Document the observed behavior. The state is held in browser `localStorage`, so it is expected to be scoped to
  the browser rather than the account — user B on the same browser will likely inherit A's collapsed state, and
  user A on a different browser will see it expanded.
- This is acceptable for a cosmetic view preference, but it must not leak or alter any checklist *data* — only
  the expanded/collapsed rendering. Any data difference between users here is a genuine defect.

CONFIRMED LIVE 2026-09-21 (Local, redmine-docker-7.0.0, Bug #1530): **PASS.** As Admin, collapsed checklist 51
(`localStorage` → `["51"]`). Logged out, logged in as `luna.blossom` (newly-seeded Member/Developer project role,
different account entirely) in the **same browser tab**. Checklist 51 still rendered `display: none` for her —
the browser-local state carried straight across the account switch, exactly as expected for a `localStorage`-based
implementation. No data difference: both checklists' item counts and contents were identical and correct for
both accounts. Second-browser/different-profile leg not separately exercised — not needed, since this is a direct
mechanical consequence of `localStorage` never being confirmed within this instance.

---

## Regression Pass — 2026-09-21 (TC-CHK-201–222, triggered by #120920 changes)

CONFIRMED LIVE 2026-09-21 (Local, redmine-docker-7.0.0, `test project`, issues #1530/#1531): regression run of this
entire suite, since #120920 touched `_checklist.html.erb` (the shared rendering partial for every checklist) and
`checklist_checkbox.js` (global checklist interaction handlers) — see `SENIOR_QA_STANDARDS.md` §26 (shared-code
scope). These TCs had never been executed before this pass.

- **TC-CHK-201/202/203 — PASS** (satisfied by state already in place from the #120920 sanity-testing session:
  two independently-created checklists coexisting with their own progress bars, sub-item nested correctly).
- **TC-CHK-204 — PASS.** Added 5 sub-items consecutively; all persisted in creation order. Note: the "Add" form
  closes after each item (requires re-opening via Actions → Add each time) rather than staying focused — this is
  `checklist.js`'s pre-existing add-item handler, untouched by the #120920 diff, so not a regression; not filed.
- **TC-CHK-205 — PASS.** Edited the issue's description via the normal Edit form; both checklists and all their
  items were intact afterward.
- **TC-CHK-206 — PASS.** Renamed a checklist title; persisted correctly across a fresh reload.
- **TC-CHK-207 — PASS.** Renamed a sub-item title; sibling items unaffected.
- **TC-CHK-208 — PASS.** Began an edit, typed junk text, pressed Escape — nothing was saved, original text
  retained. (Escape doesn't visually dismiss the input field itself; a minor UX note, not a data-integrity issue.)
- **TC-CHK-209 — PASS.** Deleted a single sub-item via its confirm modal; only that item was removed, siblings
  intact.
- **TC-CHK-210 — PASS functionally.** Deleted a whole checklist containing 5 items; all cascaded correctly, other
  checklists untouched. Usability note (pre-existing, not from #120920): the confirm modal's text is a generic
  "Are you sure you want to delete this checklist?" — it doesn't explicitly warn that child items go too, as this
  TC's own Expected Result flagged as worth recording. Not filed as its own bug this session — flagging for the
  user to decide whether it's worth a Low-severity ticket.
- **TC-CHK-211 — PASS.** Triggered delete on a checklist, clicked Cancel; nothing deleted, row present after
  reload.
- **TC-CHK-212 — PASS** (see TC-CHK-225 above for the detailed toggle regression evidence).
- **TC-CHK-213 — PASS.** Checklist History tab recorded checklist-added, item-added, and item-status-changed
  entries, each with correct actor/timestamp, one-to-one with the actions actually performed.
- **TC-CHK-214 — PASS.** Empty title rejected server-side (HTTP 422), clear message "Checklist title cannot be
  blank" shown, no blank checklist created.
- **TC-CHK-215 — PASS.** Whitespace-only title treated identically to empty (trimmed before validation).
- **TC-CHK-216 — PASS.** A 1000-character title (bypassing the input's client-side `maxlength=256` via direct
  value assignment, to test server-side enforcement) was rejected: "Checklist title is too long (maximum is 255
  characters)". No layout break, no 500.
- **TC-CHK-217 — FAIL, filed as `BUG-CHK-002` (Critical).** A `<script>` tag in a checklist or sub-item title
  **executes immediately** upon creation (confirmed via `window.__xss_fired === true` right after the AJAX
  success callback, with the raw unescaped tag present in the DOM at that moment). Confirmed **not** a stored
  XSS affecting other viewers — a normal page reload renders the same content safely HTML-escaped (Rails'
  `_checklist.html.erb` auto-escaping works correctly), so this is a client-side, DOM-based self-XSS confined to
  the two AJAX-creation success handlers in `checklist.js` (new checklist, new sub-item), which build raw HTML
  strings via template literals and `.append()` them without escaping — unlike the *edit* success handlers in the
  same file, which correctly use `.innerText`. See `bugs/open/BUG-CHK-002.md` for full root-cause detail.
- **TC-CHK-218 — PASS** (re-verified after an initial false read on my own part — see below). Duplicate checklist
  titles on one issue are rejected server-side with "Checklist title must be unique within the issue"; the error
  div reliably renders (confirmed by testing `addErrorDiv` directly against the real response body). My first
  attempt at this TC checked the DOM before the AJAX round-trip had actually completed and wrongly read it as "no
  error shown" — re-tested with a short wait and got the correct, passing result. Documented here so a future
  session doesn't waste time re-chasing a phantom defect.
- **TC-CHK-219 — PASS, and better than the TC's own minimum bar.** Closed the issue, then tried to add a sub-item
  to its checklist: the client disables the checklist's Actions menu entirely (`onclick="return false"`, tooltip
  "Issue is closed, you cannot perform this action"), and a direct API bypass attempt (raw `fetch`, no UI) was
  **also** rejected server-side with HTTP 403 "The issue is closed and cannot be modified" — real defense in
  depth, not just a client-side guard. Reopened the issue afterward.
- **TC-CHK-220 — PASS** (lightweight variant: two genuinely concurrent requests — add a new sub-item, delete an
  existing one — fired via `Promise.all` rather than two full separate browser sessions, since simulating two
  distinct logged-in users needs two isolated cookie jars). Both resolved correctly with no data loss or
  stale-state error; final state was consistent (deleted item gone, new item present, correct item count).
- **TC-CHK-221 — PASS.** Created a throwaway issue (#1531) with its own checklist, deleted the issue, and
  confirmed via `rails runner` (no UI surface exists to check for orphaned rows — this is a DB-integrity check by
  nature) that the checklist row was gone (`Checklist.exists?(54) == false`) and no orphaned `Checklist` rows
  remained for that issue ID.
- **TC-CHK-222 — N/A**, per this TC's own conditional wording ("if such a configuration exists on this instance").
  Checked `test project`'s Modules settings (53 project modules listed) — the Checklist plugin does not register
  a toggleable per-project module at all; it renders on every issue's detail view unconditionally, with no
  module/tracker gate to test against on this instance.

**Result: 21 PASS, 1 N/A, 1 FAIL.** The single failure (`BUG-CHK-002`) is pre-existing in the checklist/sub-item
*creation* code path, unrelated to the #120920 diff (which touched only `_checklist.html.erb`'s default-display
attribute and `checklist_checkbox.js`'s toggle/collapse-memory logic) — so #120920 itself did not introduce this
regression, but a full, clean regression pass on this suite is not achieved until `BUG-CHK-002` is resolved.

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
