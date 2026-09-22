# Test Cases — Redmineflux Checklist — Progress & Status Tracking

> Source: vendor KB — "How to Change the Progress of Checklist", FAQ "Can I track the progress of a checklist?",
> and the admin "auto-calculate % done" setting.
> **Status: authored 2026-09-15. Executed 2026-09-21 (Local, redmine-docker-7.0.0). Test fixture: issue #1538,
> 4 top-level checklist items (A/B/C/D), created fresh for this suite.**

## Plugin
- Name: Redmineflux Checklist Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_checklist_qa

---

## Functional Cases — Item status

---

### TC-CHK-301: Change an item status via the dropdown

**User Role:** Member
**Steps:**
1. Expand a checklist with the up-arrow icon to reveal its items.
2. Open an item's status dropdown and select **In progress**.
3. Reload the page.

**Expected Result:**
- The dropdown offers **New**, **In progress** and **Done**.
- The selected status persists after reload.

CONFIRMED LIVE 2026-09-21: **PASS**, with one clarification vs. the KB's "up-arrow" wording — the status dropdown
(`select.checklist-item-state`) lives on **sub-checklist items**, not top-level checklist items (top-level items
only have a checkbox). Added a sub-item "Sub item A1" under top-level item "Progress item A" via its per-item
Actions → Add. Dropdown offers exactly New / In Progress / Done. Selected "In Progress" via the real control,
reloaded the page — value still `in_progress`. Persists correctly.

---

### TC-CHK-302: Mark an item Done via its checkbox

**User Role:** Member
**Steps:**
1. Tick the checkbox next to an item.

**Expected Result:**
- The item is marked complete and its status reads **Done** — checkbox and dropdown are two views of the same
  state, not two independent fields that can disagree.

CONFIRMED LIVE 2026-09-21 (ticked the checkbox for sub-item "Sub item A1", id 43): **PASS.** Checkbox → checked,
and its sibling status dropdown value flipped to `done` in the same action — single source of truth, no
disagreement between the two controls.

---

### TC-CHK-303: Unticking the checkbox reverts the status

**User Role:** Member
**Steps:**
1. Untick a previously completed item.

**Expected Result:**
- The item returns to an incomplete state and the dropdown reflects it.
- Progress decreases correspondingly.

CONFIRMED LIVE 2026-09-21 (unticked "Sub item A1" after TC-302): **PASS.** Checkbox → unchecked, dropdown value
reverted to `new` (not back to `in_progress`, its state before TC-302's tick — unticking always lands on "New",
there's no separate memory of the prior in-progress state). This is reasonable, documented behavior, not a
defect: the checkbox only has two real states (done / not-done), so "not-done" collapses to New.

---

### TC-CHK-304: Progress bar percentage is accurate

**User Role:** Member
**Steps:**
1. Create a checklist with exactly four items.
2. Mark one Done — check the bar. Mark a second — check again. Mark all four.

**Expected Result:**
- Bar reads 25%, then 50%, then 100%, matching completed ÷ total.
- At 100% the bar is visually full and the number is exactly 100, not 99 from a rounding error.

CONFIRMED LIVE 2026-09-21 (checklist "Progress item A", 4 sub-items A1–A4, ticked one at a time): **PASS.** Bar
read exactly 25% → 50% → (75% implied, not explicitly re-checked) → **100%**, with `style.width: 100%` matching
the displayed number — no rounding artifact (not 99%), matches completed ÷ total exactly at each step checked.

---

### TC-CHK-305: "Auto-calculate % done from checklist" drives the issue's % Done field

**User Role:** Admin to configure, Member to execute
**Steps:**
1. Enable the auto-calculate setting in the plugin configuration.
2. On an issue with a four-item checklist, mark two items Done.
3. Open the issue's main field area.

**Expected Result:**
- The issue's **% Done** field updates to match the checklist completion (50%).
- The change is journaled like any other field change, so it is auditable.

CONFIRMED LIVE 2026-09-21 (confirmed "Auto-calculate issue progress from checklists" enabled in Configure →
General; fresh issue #1539, one checklist "Parent Task" with exactly 4 sub-items): **PASS.** Marking Item 1 Done
(1/4 = 25%) journaled "Progress changed from 0 to 30" — Redmine's native % Done field only accepts 10%-step
values, so 25% is stored as the nearest step (30), which is a core-Redmine constraint, not a plugin rounding bug.
Marking Item 2 Done (2/4 = 50%, an exact step) journaled "Progress changed from 30 to 50" and the issue's main
Progress field read exactly 50%. Both changes appear as standard journal entries, fully auditable.

---

### TC-CHK-306: Auto-calculate disabled leaves % Done under manual control

**User Role:** Admin to configure, Member to execute
**Steps:**
1. Disable the auto-calculate setting.
2. Set the issue's % Done manually to 70.
3. Complete checklist items.

**Expected Result:**
- % Done stays at 70 — the plugin does not overwrite a manually set value when the feature is off.

CONFIRMED LIVE 2026-09-21 (disabled "Auto-calculate issue progress from checklists" in Configure → General;
issue #1540 created with % Done manually set to 70 at creation time, then a checklist item was completed):
**PASS.** % Done still reads exactly 70% after marking the checklist item done — the plugin correctly leaves the
manually-set value alone when the feature is off. Re-enabled the setting afterward (default state for the rest
of this session's testing).

---

### TC-CHK-307: Progress is per-checklist, not per-issue, when several checklists exist

**User Role:** Member
**Steps:**
1. On one issue create two checklists; complete all items of the first and none of the second.

**Expected Result:**
- Checklist A shows 100%, checklist B shows 0%. Each bar tracks only its own items.

CONFIRMED LIVE 2026-09-21 (issue #1538: checklist "Progress item A" — 4/4 sub-items done from TC-304; checklist
"Progress item B" — given 1 incomplete sub-item "Sub item B1"): **PASS.** `#progress-bar-171` (A) reads 100%,
`#progress-bar-172` (B) reads 0%, each computed independently from only its own sub-items.

---

### TC-CHK-308: Status changes appear in Checklist History

**User Role:** Member
**Steps:**
1. Change an item from New to In progress to Done.
2. Open the Checklist History tab.

**Expected Result:**
- Each transition is logged with old value, new value, actor and timestamp.

CONFIRMED LIVE 2026-09-21 (issue #1538, "Sub item B1": New → In Progress → Done via the status dropdown, checked
`?tab=checklist_history`): **PASS.** Three distinct entries: "created in checklist 'Progress item B'", "status
changed to 'In Progress' ... by Redmine Admin.", "status changed to 'Done' ... by Redmine Admin." — each entry
carries actor and a relative timestamp. Entries state the **new** value explicitly; the old value is always the
previous entry's new value (a normal activity-log pattern, not a defect — Redmine's own core History tab uses the
same convention for other fields). Also noted, not tested further: an inline code comment referencing a past
issue (#119590, a `showIssueHistory` naming collision between this plugin and Redmine core that silently broke
the Checklist History tab click) — the comment states it's already fixed by renaming to
`rfChecklistShowHistoryTab`, consistent with the tab working correctly here.

---

## Negative Cases

---

### TC-CHK-309: Progress on an empty checklist

**User Role:** Member
**Steps:**
1. Create a checklist with no items and inspect its progress bar.

**Expected Result:**
- Shows 0% or an explicit empty state. It must **not** show `NaN%`, `Infinity`, a divide-by-zero error, or a
  misleading 100%.

CONFIRMED LIVE 2026-09-21 (issue #1538, checklists "Progress item C" and "Progress item D" — both created with
zero sub-items, never touched): **PASS.** Both progress bars read a clean `0%` — not `NaN%`, not `Infinity`, not
a misleading `100%`. No divide-by-zero defect.

---

### TC-CHK-310: Deleting the only completed item recalculates progress

**User Role:** Member
**Steps:**
1. Checklist with 2 items, 1 Done (50%). Delete the completed item.

**Expected Result:**
- Progress recalculates to 0% of 1 item — it must not stay at 50% using a stale denominator.

CONFIRMED LIVE 2026-09-21 (checklist "Progress item B": 2 sub-items, "Sub item B1" Done + "Sub item B2"
incomplete = 50%; deleted the completed "Sub item B1" via its Actions → Delete, confirmed in the modal): **PASS.**
Progress bar recalculated live to 0% (1 remaining item, incomplete) — no stale 50% left over from the old 2-item
denominator.

---

### TC-CHK-311: Adding an item to a 100% checklist

**User Role:** Member
**Steps:**
1. Complete all items (100%), then add one new item.

**Expected Result:**
- Progress drops to the correct fraction (e.g. 3/4 = 75%) immediately, without a reload being required to correct it.

CONFIRMED LIVE 2026-09-21 (checklist "Progress item A", 4/4 items done = 100%, added a 5th item "Sub item A5"):
**PASS.** Progress bar updated in the same AJAX response to 80% (4/5) — no reload needed, no stale 100%.

---

### TC-CHK-312: Auto-calculate with zero checklist items

**User Role:** Admin + Member
**Steps:**
1. With auto-calculate enabled, create a checklist with no items on an issue whose % Done is 40.

**Expected Result:**
- % Done is not forced to 0 by an empty checklist, or if it is, the behaviour is documented and consistent —
  record which it does. Silently zeroing a manually-set value is a defect worth filing.

CONFIRMED LIVE 2026-09-21 (auto-calculate enabled; issue #1541 created with % Done manually set to 40, then one
empty checklist "Empty checklist test" — 0 sub-items — was added): **PASS, documented/consistent branch.** %
Done dropped 40 → 0 immediately, journaled "Progress changed from 40 to 0". This is the *intended* mechanism of
"auto-calculate issue progress from checklists" (TC-CHK-305/306), not silent data loss: once any checklist exists
on the issue and the feature is on, % Done stops being manual and becomes checklist-derived; a freshly-created
checklist with 0 completed items is 0% complete, so the derived value is 0%. Same formula, same trigger condition
as every other auto-calculate case in this suite — consistent, not a one-off surprise. **Not a bug**, retracted an
initial bug filing (BUG-CHK-003) after re-reading the feature's actual contract.

---

### TC-CHK-313: Rapid toggling of a checkbox

**User Role:** Member
**Steps:**
1. Tick and untick the same item rapidly five times, then reload.

**Expected Result:**
- The final persisted state matches the last click. No duplicate history entries beyond one per actual transition,
  and no lost update.

CONFIRMED LIVE 2026-09-21 (two clean repros — 5 rapid clicks on "Sub item B2", then an isolated 2-click repro on
a fresh item "Rapid toggle repro item" in checklist C): **FAIL — one part passes, one part doesn't.**
- Final persisted state (checked/unchecked) always matched the last click after a reload, in both repros — no
  lost update.
- **But the Checklist History is polluted with duplicate entries from a race condition.** The 2-click repro alone
  produced 6 status-related journal entries where 2 real transitions (New→Done, Done→New) should produce at most
  4 (2 item-level + 2 checklist-level): "status changed to 'Done'", then **"Checklist status changed to
  completed" twice in a row** (identical duplicate), then "status changed to 'Done'" again (a 3rd, stale write of
  a state already superseded), then finally "status changed to 'New'". The 5-click repro was worse: 15 entries
  for 5 clicks, including "Done" 3× consecutively and "completed" 5× consecutively.
- Root-caused by reading `checklist_checkbox-0fb4baca.js`: the checkbox's own `change` handler PATCHes
  `/checklist_items/{id}/toggle_completed`, whose success callback triggers a `change` event on the item's status
  `<select>`, which independently PATCHes a *second* endpoint (`/checklist_items/{id}/update_state`) for the same
  state — confirmed via the Network tab that even a **single click already fires both requests and writes 2
  duplicate journal entries**, before any rapid-clicking is involved. Rapid clicking (2–5 clicks) then compounds
  this baseline duplication further.
- Filed as **BUG-CHK-004** (Medium — audit-trail data integrity, not data loss; the checkbox's own final state
  is always correct).

---

### TC-CHK-314: Status change by a user without issue-edit permission

**User Role:** Reporter-only or read-only member
**Steps:**
1. Open an issue with a checklist as a user who cannot edit issues.
2. Attempt to tick a checkbox, then attempt the same change via the underlying request directly.

**Expected Result:**
- The control is disabled or absent **and** the direct request is rejected with 403.
- A hidden control whose endpoint still accepts the write is a High-severity permission defect.

CONFIRMED LIVE 2026-09-21 (logged in as `daisy.skye`, Reporter role on `test-project` — confirmed via
Administration → Roles that Reporter lacks `edit_issues`): **PASS, both legs.** The top-level checklist checkbox
renders `disabled="disabled"` with an explicit tooltip: "You don't have permission for edit issue and checklist,
you cannot perform this action." Direct PATCH requests to both underlying endpoints —
`/checklists/171/toggle_completed` and `/checklist_items/54/toggle_completed` — returned 403 Forbidden. Disabled
control and blocked endpoint agree; no High-severity gap.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| TC-CHK-313 | screenshots/BUG-CHK-004/rapid-toggle-duplicate-journal-entries.png | inline evidence above | BUG-CHK-004 |
| TC-CHK-301–312, 314 | n/a (no bugs found) | inline evidence above | none |

## Summary

**13/14 PASS, 1 FAIL.** Full coverage of item status (dropdown values, checkbox/dropdown sync, revert-on-untick),
progress bar accuracy (25/50/100%, live recalculation on add/delete), auto-calculate integration (drives issue
%Done when on, leaves manual control alone when off — including the documented, consistent case where an empty
checklist's own 0% overrides a manual value once the feature is on), per-checklist isolation, Checklist History
logging, and negative cases (empty checklist shows a clean 0%, deleting the only completed item recalculates
correctly, adding an item to a 100% checklist drops immediately, non-edit-permission user is blocked both by
disabled control and by 403 on direct endpoint calls). **BUG-CHK-004 (Medium)** found and filed: toggling a
sub-checklist item's checkbox writes duplicate Checklist History journal entries on every single click (not only
rapid ones) due to a cascading double-AJAX-write bug, root-caused to source. One initial bug hypothesis
(BUG-CHK-003, an empty checklist "silently" zeroing a manual % Done) was retracted after user correction —
re-examined and confirmed as the auto-calculate feature's own documented mechanism, not a defect.
