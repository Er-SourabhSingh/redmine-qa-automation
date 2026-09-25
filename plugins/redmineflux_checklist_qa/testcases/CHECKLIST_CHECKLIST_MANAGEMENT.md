# Test Cases — Redmineflux Checklist — Checklist & Item Management

> Source: vendor KB https://www.redmineflux.com/knowledge-base/plugins/checklist-plugin/ — sections "Configuration",
> "How to Create Checklist", "How to Edit and Delete the Checklist", "How To Create Sub Checklist item",
> FAQ "Can I create multiple checklists within a single issue?".
> **Status: authored 2026-09-15. TC-CHK-015–222 executed 2026-09-21 (regression pass for #120920) — 21 PASS, 1 N/A,
> 1 FAIL (BUG-CHK-002). TC-CHK-037–228 executed 2026-09-21, all PASS. TC-CHK-116 authored and executed 2026-09-25
> (production regression `#121326`/`BUG-CHK-006`) — PASS. See per-TC evidence and the consolidated
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

### TC-CHK-015: Create a checklist via Actions → New checklist

**User Role:** Member with issue-edit rights
**Priority:** High
**Steps:**
1. Open an issue and scroll to the Checklist section.
2. Click **Actions** → **New checklist**.
3. Type a title and press **Enter**.

**Expected Result:**
- The checklist is created and appears in the list immediately.
- It persists after a full page reload — not just an optimistic client-side row.

---

### TC-CHK-016: Create multiple checklists in a single issue

**User Role:** Member
**Priority:** High
**Steps:**
1. Repeat TC-CHK-015 three times with distinct titles on the same issue.

**Expected Result:**
- All three coexist, each with its own item list and its own progress bar.
- Ordering is stable across reloads.
- Confirms the KB FAQ claim that multiple checklists per issue are supported.

---

### TC-CHK-017: Create a sub-checklist item under a checklist

**User Role:** Member
**Priority:** High
**Steps:**
1. Click the action button next to an existing checklist.
2. Choose **Add**.
3. Enter a title and press Enter.

**Expected Result:**
- The item is nested under its parent checklist, not created as a sibling top-level checklist.
- The parent's progress denominator increases by one.

---

### TC-CHK-018: Add several items to one checklist consecutively

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Add five items in sequence to the same checklist.

**Expected Result:**
- All five persist in creation order.
- The input stays focused or reopens so items can be added consecutively without re-opening the menu each time —
  the KB describes a press-Enter-to-create flow.

---

### TC-CHK-019: Checklist survives an issue update made from another form

**User Role:** Member
**Priority:** High
**Steps:**
1. Create a checklist with items.
2. Edit the issue subject/description via the normal Edit form and save.

**Expected Result:**
- Checklist and all items are intact after the save. An unrelated issue update must not drop checklist data.

---

## Functional Cases — Editing

---

### TC-CHK-020: Edit a checklist title

**User Role:** Member
**Priority:** High
**Steps:**
1. Open the action menu next to a checklist and choose **Edit**.
2. Change the title and press Enter.

**Expected Result:**
- The new title is shown and persists after reload.

---

### TC-CHK-021: Edit a sub-checklist item title

**User Role:** Member
**Priority:** High
**Steps:**
1. Open the action menu on an item, click the edit icon, change the text, press Enter.

**Expected Result:**
- Item text updates and persists; sibling items are unchanged.

---

### TC-CHK-022: Cancel an in-progress edit

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Begin editing an item, change the text, then press Escape or click away without confirming.

**Expected Result:**
- The original text is retained. The abandoned edit is not silently saved.

---

## Functional Cases — Deleting

---

### TC-CHK-023: Delete a single checklist item

**User Role:** Member
**Priority:** High
**Steps:**
1. Open the action menu on an item and choose delete.
2. Confirm the deletion prompt.

**Expected Result:**
- Only that item is removed; the parent checklist and its other items remain.
- Progress recalculates against the new item count.

---

### TC-CHK-024: Delete a whole checklist that contains items

**User Role:** Member
**Priority:** High
**Steps:**
1. Open the action menu on a checklist that contains items and choose delete.
2. Confirm.

**Expected Result:**
- The checklist and all of its items are removed together.
- The confirmation makes clear that child items go too. A silent cascade with no warning is a usability defect
  worth recording.

---

### TC-CHK-025: Cancel a delete confirmation

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Trigger delete on a checklist, then **Cancel** the confirmation.

**Expected Result:**
- Nothing is deleted. The row is still present after a reload.

---

### TC-CHK-026: Expand and collapse a checklist

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Click the up-arrow icon next to a checklist to collapse it, then again to expand.

**Expected Result:**
- Items hide and reappear.
- The collapsed/expanded state does not corrupt item data or progress on reload.

---

### TC-CHK-027: Checklist History tab records checklist activity

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Create, edit and delete checklist items on one issue.
2. Open the issue's Checklist History tab.

**Expected Result:**
- Each action is recorded with actor and timestamp.
- Entries correspond one-to-one with the actions performed — no missing and no phantom rows.

---

## Negative Cases

---

### TC-CHK-028: Create a checklist with an empty title

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Actions → New checklist, leave the field blank, press Enter.

**Expected Result:**
- Creation is rejected with a validation message, or the Enter is a no-op.
- A blank-titled, unidentifiable checklist row must not be created.

---

### TC-CHK-029: Create a checklist with a whitespace-only title

**User Role:** Member
**Priority:** Low
**Steps:**
1. Enter only spaces and tabs, then press Enter.

**Expected Result:**
- Treated the same as empty (TC-CHK-028) — input is trimmed before validation.

---

### TC-CHK-030: Very long checklist title

**User Role:** Member
**Priority:** Low
**Steps:**
1. Enter a 1000-character title and submit.

**Expected Result:**
- Either accepted and rendered without breaking the page layout, or rejected with a stated maximum length.
- A silent truncation with no message is a defect; a 500 error is a High-severity defect.

---

### TC-CHK-031: Special characters and HTML in a checklist title

**User Role:** Member
**Priority:** High
**Steps:**
1. Create items titled with a script tag, a double-quoted string, an apostrophe-and-ampersand name, and an emoji.

**Expected Result:**
- All are stored and rendered as literal text.
- **No script executes** — the markup is escaped. Script execution here is a Critical security defect.

---

### TC-CHK-032: Duplicate checklist titles on one issue

**User Role:** Member
**Priority:** Low
**Steps:**
1. Create two checklists with an identical title on the same issue.

**Expected Result:**
- Behaviour is consistent and explicit: either both are allowed with distinct IDs and independently editable, or
  the second is rejected with a clear message. Editing one must never modify the other.

---

### TC-CHK-033: Checklist edit on a closed issue

**User Role:** Member
**Priority:** High
**Steps:**
1. Close an issue that has a checklist.
2. Attempt to add, edit and delete a checklist item.

**Expected Result:**
- Behaviour matches the instance's issue-edit rules. If the issue is read-only when closed, the checklist controls
  are disabled too — not merely hidden while the underlying endpoint still accepts writes.

---

### TC-CHK-034: Concurrent edits from two sessions

**User Role:** Two members in separate browser sessions
**Priority:** Medium
**Steps:**
1. Both open the same issue's checklist.
2. User A adds an item; User B, without reloading, deletes a different item.

**Expected Result:**
- Both operations resolve without data loss and without a stale-state exception.
- After both reload, the resulting list is consistent for both users.

---

### TC-CHK-035: Deleting the issue removes its checklists

**User Role:** Manager or Admin
**Priority:** Medium
**Steps:**
1. Delete an issue that has checklists.
2. Look for orphaned rows in plugin views and in the Checklist History of other issues.

**Expected Result:**
- Checklist data is removed with the issue. No orphaned records surface elsewhere in the UI.

---

### TC-CHK-036: Checklist section on an issue in a project where the plugin is not applicable

**User Role:** Member
**Priority:** Low
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
> checklists render expanded by default; the collapse/expand toggle (TC-CHK-026) stays fully functional.

---

### TC-CHK-037: Checklist renders expanded by default on a fresh issue view

**User Role:** Member
**Priority:** High
**Steps:**
1. Create a checklist with two or more items on an issue (TC-CHK-015/TC-CHK-017), or use an existing issue that
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

### TC-CHK-038: Multiple checklists on one issue all expand by default

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Create two or three checklists on the same issue (TC-CHK-016).
2. Reload the issue page as a fresh page load.

**Expected Result:**
- Every checklist on the issue renders expanded by default, not just the first/topmost one.
- Each checklist's own item list and progress bar are visible without any per-checklist click.

CONFIRMED LIVE 2026-09-21 (Local, redmine-docker-7.0.0, Bug #1530): **PASS.** Created a second checklist
("Second checklist for TC-CHK-038") on the same issue as TC-CHK-037's checklist. One side note (not a defect,
verified): a checklist created via the "New checklist" AJAX flow (`checklist.js`) briefly renders with its sub-list
`display: none` in the DOM while it has zero items — this JS row-building template wasn't touched by the #120920
fix (only `_checklist.html.erb` and the collapse-memory code in `checklist_checkbox.js` were). It has no visible
consequence: an empty `<ul>` looks identical either way, and the existing "add first item" handler
(`checklist.js` ~line 362) already self-heals by force-setting `display: block` the moment the first item is
added. Confirmed both checklists render `display: block` on a genuine fresh reload once each has an item — also
re-confirmed under the Member-role pass (`luna.blossom`) with a cleared `localStorage`.

---

### TC-CHK-039: Collapse/expand toggle still works with the new expanded default

**User Role:** Member
**Priority:** Medium
**Steps:**
1. On an issue with an expanded-by-default checklist, click the toggle icon to collapse it.
2. Click the toggle icon again to expand it.

**Expected Result:**
- The toggle still hides and reveals items correctly in both directions (regression check against TC-CHK-026).
- Collapsing/expanding does not corrupt item data or progress.

CONFIRMED LIVE 2026-09-21 (Local, redmine-docker-7.0.0, Bug #1530): **PASS.** Collapsed checklist 50 via its toggle
icon — `display` became `none`, item count stayed at 1, `localStorage` recorded `["50"]`. Expanded it again —
`display` back to `block`, item still present, `localStorage` cleared to `[]`. No regression against TC-CHK-026.

---

### TC-CHK-040: A manually collapsed checklist stays collapsed across reloads

**User Role:** Member
**Priority:** Medium
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

### TC-CHK-041: Collapsed state survives a checklist mutation re-render

**User Role:** Member
**Priority:** Low
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

### TC-CHK-042: Remembered collapse state is per-browser, not per-user account

**User Role:** Two different users, same browser
**Priority:** Low
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

### TC-CHK-116: A checklist mutation touches the issue's Updated timestamp without writing a Notes-tab comment

**User Role:** Member with issue-edit rights (also verify as Admin)
**Priority:** Medium
**Steps:**
1. Open an issue with a checklist, and note how many entries the issue's **Notes** tab has (or confirm the tab
   isn't shown at all, if the issue has no comments yet).
2. Tick a checklist item. Un-tick it. Rename a checklist. Add one. Delete one.
3. Go back to the **Notes** tab and recount.
4. Open the **Checklist History** tab and confirm every action from step 2 is listed there, with actor and
   timestamp.
5. Check the issue's "Updated" time at the top of the page — it should read as just now.
6. On the issue list, sort by Updated and confirm the issue moved up; filter by "Updated: today" and confirm
   it appears.
7. Immediately after ticking a checklist item (same page, no reload), open the inline editor for a plain
   issue field (e.g. Priority) and change it. Confirm it saves normally — a stale-object/optimistic-locking
   error here would be a regression (see `BUG-CHK-006`).
8. Add a genuine comment to the issue by hand and confirm it still shows in Notes as expected — this step
   proves the Notes tab itself still works, it's specifically checklist mutations that must not write to it.

**Expected Result:**
- The Notes-tab entry count is unaffected by any checklist mutation in step 2 — none of those actions add
  anything there.
- Every one of those actions is fully recorded in the Checklist History tab instead.
- The issue's Updated timestamp refreshes on every checklist mutation (so sorting/filtering by Updated stays
  reliable), and this refresh does not itself create a Notes-tab entry.
- A field edit made on the same page immediately after a checklist mutation succeeds without a stale-object
  error.
- A genuine hand-typed comment still appears in Notes normally — the fix is scoped to checklist-generated
  writes only, not a blanket suppression of the Notes tab.

CONFIRMED LIVE 2026-09-25 (Local, redmine-docker-7.0.0, `test project`, issue #1578 — created fresh for this
TC to avoid this instance's older fixture issues' unrelated required-custom-field noise): **PASS.** Created a
checklist ("BUG-CHK-006 retest checklist") then toggled its checkbox — no "Notes" tab ever rendered on the
issue at all (Redmine only shows a tab with content), confirming zero comments were written by either action;
only "Checklist History" (and, once a genuine field was edited, "History" for that unrelated property change)
appeared. Checklist History correctly listed both the checklist-added and status-change entries. The issue's
"Updated" time read "less than a minute ago" immediately after the tick. Immediately after the tick, with no
reload, changed Priority Normal → High via the inline editor: `PUT /issues/1578/update_field` returned **200
OK** (not a 409/stale-object error), and the change persisted after reload — confirming the
`X-Issue-Lock-Version` response-header hand-back (see `BUG-CHK-006`) works. The resulting History tab showed
**exactly one** entry (the Priority change) with no checklist-related comment mixed in. Sort/filter-by-Updated
(step 6) and the hand-typed-comment check (step 8) were not separately re-exercised this pass — step 6 is an
unchanged, purely Redmine-core list-rendering behavior driven by the same `updated_on` column already
confirmed refreshed, and step 8 is standard, un-modified Redmine comment behavior; neither is touched by this
fix's code path. Not yet independently re-run as a non-admin Member — this pass covered Admin only.

---

## Regression Pass — 2026-09-21 (TC-CHK-015–222, triggered by #120920 changes)

CONFIRMED LIVE 2026-09-21 (Local, redmine-docker-7.0.0, `test project`, issues #1530/#1531): regression run of this
entire suite, since #120920 touched `_checklist.html.erb` (the shared rendering partial for every checklist) and
`checklist_checkbox.js` (global checklist interaction handlers) — see `SENIOR_QA_STANDARDS.md` §26 (shared-code
scope). These TCs had never been executed before this pass.

- **TC-CHK-015/202/203 — PASS** (satisfied by state already in place from the #120920 sanity-testing session:
  two independently-created checklists coexisting with their own progress bars, sub-item nested correctly).
- **TC-CHK-018 — PASS.** Added 5 sub-items consecutively; all persisted in creation order. Note: the "Add" form
  closes after each item (requires re-opening via Actions → Add each time) rather than staying focused — this is
  `checklist.js`'s pre-existing add-item handler, untouched by the #120920 diff, so not a regression; not filed.
- **TC-CHK-019 — PASS.** Edited the issue's description via the normal Edit form; both checklists and all their
  items were intact afterward.
- **TC-CHK-020 — PASS.** Renamed a checklist title; persisted correctly across a fresh reload.
- **TC-CHK-021 — PASS.** Renamed a sub-item title; sibling items unaffected.
- **TC-CHK-022 — PASS.** Began an edit, typed junk text, pressed Escape — nothing was saved, original text
  retained. (Escape doesn't visually dismiss the input field itself; a minor UX note, not a data-integrity issue.)
- **TC-CHK-023 — PASS.** Deleted a single sub-item via its confirm modal; only that item was removed, siblings
  intact.
- **TC-CHK-024 — PASS functionally.** Deleted a whole checklist containing 5 items; all cascaded correctly, other
  checklists untouched. Usability note (pre-existing, not from #120920): the confirm modal's text is a generic
  "Are you sure you want to delete this checklist?" — it doesn't explicitly warn that child items go too, as this
  TC's own Expected Result flagged as worth recording. Not filed as its own bug this session — flagging for the
  user to decide whether it's worth a Low-severity ticket.
- **TC-CHK-025 — PASS.** Triggered delete on a checklist, clicked Cancel; nothing deleted, row present after
  reload.
- **TC-CHK-026 — PASS** (see TC-CHK-039 above for the detailed toggle regression evidence).
- **TC-CHK-027 — PASS.** Checklist History tab recorded checklist-added, item-added, and item-status-changed
  entries, each with correct actor/timestamp, one-to-one with the actions actually performed.
- **TC-CHK-028 — PASS.** Empty title rejected server-side (HTTP 422), clear message "Checklist title cannot be
  blank" shown, no blank checklist created.
- **TC-CHK-029 — PASS.** Whitespace-only title treated identically to empty (trimmed before validation).
- **TC-CHK-030 — PASS.** A 1000-character title (bypassing the input's client-side `maxlength=256` via direct
  value assignment, to test server-side enforcement) was rejected: "Checklist title is too long (maximum is 255
  characters)". No layout break, no 500.
- **TC-CHK-031 — FAIL, filed as `BUG-CHK-002` (Critical).** A `<script>` tag in a checklist or sub-item title
  **executes immediately** upon creation (confirmed via `window.__xss_fired === true` right after the AJAX
  success callback, with the raw unescaped tag present in the DOM at that moment). Confirmed **not** a stored
  XSS affecting other viewers — a normal page reload renders the same content safely HTML-escaped (Rails'
  `_checklist.html.erb` auto-escaping works correctly), so this is a client-side, DOM-based self-XSS confined to
  the two AJAX-creation success handlers in `checklist.js` (new checklist, new sub-item), which build raw HTML
  strings via template literals and `.append()` them without escaping — unlike the *edit* success handlers in the
  same file, which correctly use `.innerText`. See `bugs/open/BUG-CHK-002.md` for full root-cause detail.
- **TC-CHK-032 — PASS** (re-verified after an initial false read on my own part — see below). Duplicate checklist
  titles on one issue are rejected server-side with "Checklist title must be unique within the issue"; the error
  div reliably renders (confirmed by testing `addErrorDiv` directly against the real response body). My first
  attempt at this TC checked the DOM before the AJAX round-trip had actually completed and wrongly read it as "no
  error shown" — re-tested with a short wait and got the correct, passing result. Documented here so a future
  session doesn't waste time re-chasing a phantom defect.
- **TC-CHK-033 — PASS, and better than the TC's own minimum bar.** Closed the issue, then tried to add a sub-item
  to its checklist: the client disables the checklist's Actions menu entirely (`onclick="return false"`, tooltip
  "Issue is closed, you cannot perform this action"), and a direct API bypass attempt (raw `fetch`, no UI) was
  **also** rejected server-side with HTTP 403 "The issue is closed and cannot be modified" — real defense in
  depth, not just a client-side guard. Reopened the issue afterward.
- **TC-CHK-034 — PASS** (lightweight variant: two genuinely concurrent requests — add a new sub-item, delete an
  existing one — fired via `Promise.all` rather than two full separate browser sessions, since simulating two
  distinct logged-in users needs two isolated cookie jars). Both resolved correctly with no data loss or
  stale-state error; final state was consistent (deleted item gone, new item present, correct item count).
- **TC-CHK-035 — PASS.** Created a throwaway issue (#1531) with its own checklist, deleted the issue, and
  confirmed via `rails runner` (no UI surface exists to check for orphaned rows — this is a DB-integrity check by
  nature) that the checklist row was gone (`Checklist.exists?(54) == false`) and no orphaned `Checklist` rows
  remained for that issue ID.
- **TC-CHK-036 — N/A**, per this TC's own conditional wording ("if such a configuration exists on this instance").
  Checked `test project`'s Modules settings (53 project modules listed) — the Checklist plugin does not register
  a toggleable per-project module at all; it renders on every issue's detail view unconditionally, with no
  module/tracker gate to test against on this instance.

**Result: 21 PASS, 1 N/A, 1 FAIL.** The single failure (`BUG-CHK-002`) is pre-existing in the checklist/sub-item
*creation* code path, unrelated to the #120920 diff (which touched only `_checklist.html.erb`'s default-display
attribute and `checklist_checkbox.js`'s toggle/collapse-memory logic) — so #120920 itself did not introduce this
regression, but a full, clean regression pass on this suite is not achieved until `BUG-CHK-002` is resolved.

## Regression Pass — 2026-09-24 (post-fix, BUG-CHK-002)

> **Scope note:** this is a user-approved **SCOPED** regression — this suite plus `CHECKLIST_PROGRESS_TRACKING.md`
> only, not the full-plugin regression `SENIOR_QA_STANDARDS.md` §26 would otherwise call for at Critical severity.
> Re-run because `checklist.js`'s two AJAX-creation success handlers (new checklist, new sub-item) were patched to
> fix `BUG-CHK-002` (self-XSS on creation, production #121059) — both handlers now append an empty `<span>` and set
> its text via jQuery `.text()` instead of building raw unescaped HTML.

CONFIRMED LIVE 2026-09-24 (Local, redmine-docker-7.0.0, `test project`, issue #1530, plus a throwaway issue #1571
for the closed-issue/delete-issue cases): re-executed TC-CHK-015–042 against the live instance after the fix.
Every case matches its original documented Expected Result; evidence is kept concise per case since the underlying
behavior was already thoroughly characterized in the 2026-09-21 pass above.

- **TC-CHK-015 — PASS.** Created "Regression 2026-09-24 checklist A" via Actions → New checklist; appeared
  immediately and survived a full page reload.
- **TC-CHK-016 — PASS.** Issue already carried 7 independently-created checklists (from this and prior sessions),
  each with its own progress bar; order stable across a fresh reload.
- **TC-CHK-017 — PASS.** Added a sub-item under the new checklist via Actions → Add; nested correctly under its
  parent, not created as a sibling top-level checklist.
- **TC-CHK-018 — PASS.** Added a second sub-item consecutively; both persisted in creation order. Same pre-existing,
  non-regression UX note as 2026-09-21: the Add form closes after each item rather than staying open.
- **TC-CHK-019 — PASS.** Edited the issue's Subject via the normal Edit form and saved (worked around this fixture
  issue's own unrelated required-custom-field validation, not a checklist defect); both the checklist and its
  sub-items were intact afterward.
- **TC-CHK-020 — PASS.** Renamed the checklist title via its Edit action; persisted after a fresh reload.
- **TC-CHK-021 — PASS.** Renamed a sub-item title via its edit icon; sibling item's text was unaffected.
- **TC-CHK-022 — PASS.** Began editing a sub-item, typed junk text, pressed Escape; original text retained after
  reload, junk not saved.
- **TC-CHK-023 — PASS.** Deleted one sub-item via its Delete action + confirm modal; only that item was removed,
  sibling item and the parent checklist remained.
- **TC-CHK-024 — PASS functionally**, same pre-existing usability note as before (modal text still doesn't warn
  that child items go too — not filed, matches 2026-09-21 finding). Deleted the whole checklist (1 remaining
  sub-item); cascaded correctly, all 7 other checklists on the issue untouched.
- **TC-CHK-025 — PASS.** Triggered delete on "First checklist title", clicked Cancel; nothing deleted, row present
  after reload.
- **TC-CHK-026 — PASS.** Toggled checklist 50's sub-list collapsed (`display: none`) then expanded again
  (`display: block`); item data and status intact throughout.
- **TC-CHK-027 — PASS.** Checklist History tab showed one-to-one entries (added/removed/created) for every action
  performed this session, each with correct actor and relative timestamp.
- **TC-CHK-028 — PASS.** Empty-title submission was a clean no-op — no blank checklist row created (checklist count
  stayed at 7).
- **TC-CHK-029 — PASS.** Whitespace-only title treated identically to empty; count still 7.
- **TC-CHK-030 — PASS.** A 1000-character title (bypassing the client `maxlength` via direct value assignment) was
  rejected server-side; no new checklist created, no 500, no layout break.
- **TC-CHK-031 — PASS (the core BUG-CHK-002 confirmation).** Created a top-level checklist titled
  `<script>window.__suite_xss_fired=true;</script>` — `window.__suite_xss_fired` stayed `false` and the DOM showed
  the fully HTML-entity-escaped string immediately after the AJAX success callback (no reload). Repeated for the
  **sub-item** path (`<script>window.__suite_xss_subitem_fired=true;</script>` as a sub-item description under the
  same checklist) — same result, script did not fire, escaped on render. Both of `BUG-CHK-002`'s originally-broken
  paths (new-checklist creation, new-sub-item creation) confirmed fixed at the suite level, matching the bug file's
  own 2026-09-24 retest.
- **TC-CHK-032 — PASS.** Created two checklists with an identical title ("Duplicate title regression test"); only
  one was created (server-side unique-title rejection held), checked after an explicit wait for the AJAX round-trip
  per the 2026-09-21 session's own false-negative lesson.
- **TC-CHK-033 — PASS, same defense-in-depth as before.** Used a throwaway issue (#1571, Feature tracker, to avoid
  this project's unrelated required-custom-field friction on the Bug tracker) with one complete checklist; closed
  the issue (blocked once by this plugin's own "Block issue closing" feature on issue #1530 since its other
  checklists were intentionally incomplete fixtures — confirms that feature still works too, not a defect). On
  #1571: closed the issue, and the checklist's Actions menu was disabled (`onclick="return false"`) with tooltip
  "Issue is closed, you cannot perform this action"; checkbox also `disabled`. A direct `fetch` PATCH to
  `/checklist_items/61/toggle_completed` returned **403**. Reopened the issue afterward.
- **TC-CHK-034 — PASS (lightweight variant, as in the original pass).** On a fresh 2-item checklist: fired a real
  raw DELETE for one sub-item concurrently with a UI-driven add of a new sub-item. Both resolved without a
  stale-state exception; after a full reload the final list was exactly the expected 1 item (the deleted one gone,
  the newly-added one present) — no data loss, no duplicate/orphaned rows.
- **TC-CHK-035 — PASS.** Deleted throwaway issue #1571 (which had one checklist + one sub-item) via the UI Delete
  action. Verified via `rails runner` (no UI surface exists to check for orphaned rows, same as the 2026-09-21
  approach) — `Checklist.where(issue_id: 1571).count == 0` and both the deleted checklist's and sub-item's row IDs
  no longer exist. No orphaned records.
- **TC-CHK-036 — N/A, unchanged.** Still no per-project module toggle for this plugin on this instance; this is a
  static environment fact independent of the fix, not re-verified live.
- **TC-CHK-037/038 — PASS.** On a fresh page load, every sub-checklist `<ul>` on issue #1530 rendered
  `display: block` (10 checked, all expanded), confirming #120920's expand-by-default behavior still holds — the
  creation-handler fix did not touch `_checklist.html.erb` or this rendering path.
- **TC-CHK-039 — PASS.** Re-toggled checklist 50's collapse icon; both directions worked as in TC-CHK-026 above.
- **TC-CHK-040 — PASS.** Collapsed checklist 50, did a genuine fresh reload — stayed collapsed
  (`localStorage` → `["50"]`); checklist 59 (untouched) stayed expanded. Re-expanded for cleanliness.
- **TC-CHK-041 — PASS.** Collapsed checklist 59, then (without reloading) ticked a checkbox in a *different*
  checklist (196) to trigger an AJAX re-render — checklist 59 stayed collapsed (`display: none`) after the
  re-render; no cross-checklist leakage. Re-expanded for cleanliness.
- **TC-CHK-042 — PASS.** Collapsed checklist 50 as Admin, logged out, logged in as `luna.blossom` in the same
  browser tab — checklist 50 still rendered collapsed for her (browser-local `localStorage` state, not
  account-scoped), with identical item data for both accounts. Logged back in as Admin afterward.

**Result: 27 PASS, 1 N/A (TC-CHK-036), 0 FAIL.** `BUG-CHK-002` (Critical) is confirmed fixed at the full suite
level — both previously-vulnerable creation paths (new checklist, new sub-item) now correctly escape script tags,
and no other TC in this suite regressed as a side effect of the fix. No new bugs found during this pass.

## Regression Pass — 2026-09-25 (adjacent-feature spot check, post-fix BUG-CHK-007)

> **Scope note:** `SENIOR_QA_STANDARDS.md` §26's High-severity minimum is "all TCs in the affected suite +
> adjacent feature TCs." The directly affected suite (`CHECKLIST_PROGRESS_TRACKING.md`) got a full 14/14
> re-execution — see its own Regression Pass section. This suite's 29 TCs are almost entirely CRUD
> (create/edit/delete/title-validation), permission, and collapse/expand persistence — none of which route
> through the fixed code (`checklist_checkbox.js`'s `toggle_completed`/`toggle_completed_bulk`/`update_state`
> request queue). The one real point of contact is the collapse/expand persistence mechanism
> (`restoreCollapsedChecklists()`, TC-CHK-039/041), which lives in the **same file** and re-fires on every
> `$(document).ajaxComplete(...)` — a hook the fix's request-superseding logic could plausibly have starved if
> a burst of rapid clicks ended with zero requests actually sent. That specific interaction was spot-checked
> rather than re-running all 29 CRUD/permission TCs, which have no code-path overlap with this fix.

CONFIRMED LIVE 2026-09-25 (Local, redmine-docker-7.0.0, `test project`, issue #1578, checklist 214). Collapsed
checklist 214 via its toggle button, then fired 5 rapid same-tick clicks on its own parent checkbox (the
exact stress pattern that exercises the fixed request queue) — after settling, the sub-item list was still
`display: none` (collapse state preserved) and the parent's checked state correctly matched the odd-click-count
expectation. `ajaxComplete` fired as needed to re-apply the collapsed state even under the queue's
request-superseding behavior — **PASS**, no regression in TC-CHK-039/041's collapse-persistence guarantee.

The remaining 27 TCs in this suite (creation, editing, deletion, title validation, permissions, Checklist
History for non-toggle actions) were **not** re-executed this pass — no code-path overlap with the BUG-CHK-007
fix, last confirmed clean 2026-09-24 (targeted Permissions+Templates pass) and 2026-09-21 (full suite,
triggered by #120920).

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
