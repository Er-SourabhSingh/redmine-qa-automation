# Test Cases — Redmineflux Checklist — Progress & Status Tracking

> Source: vendor KB — "How to Change the Progress of Checklist", FAQ "Can I track the progress of a checklist?",
> and the admin "auto-calculate % done" setting.
> **Status: authored 2026-09-15. Not yet executed.**

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

---

### TC-CHK-302: Mark an item Done via its checkbox

**User Role:** Member
**Steps:**
1. Tick the checkbox next to an item.

**Expected Result:**
- The item is marked complete and its status reads **Done** — checkbox and dropdown are two views of the same
  state, not two independent fields that can disagree.

---

### TC-CHK-303: Unticking the checkbox reverts the status

**User Role:** Member
**Steps:**
1. Untick a previously completed item.

**Expected Result:**
- The item returns to an incomplete state and the dropdown reflects it.
- Progress decreases correspondingly.

---

### TC-CHK-304: Progress bar percentage is accurate

**User Role:** Member
**Steps:**
1. Create a checklist with exactly four items.
2. Mark one Done — check the bar. Mark a second — check again. Mark all four.

**Expected Result:**
- Bar reads 25%, then 50%, then 100%, matching completed ÷ total.
- At 100% the bar is visually full and the number is exactly 100, not 99 from a rounding error.

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

---

### TC-CHK-306: Auto-calculate disabled leaves % Done under manual control

**User Role:** Admin to configure, Member to execute
**Steps:**
1. Disable the auto-calculate setting.
2. Set the issue's % Done manually to 70.
3. Complete checklist items.

**Expected Result:**
- % Done stays at 70 — the plugin does not overwrite a manually set value when the feature is off.

---

### TC-CHK-307: Progress is per-checklist, not per-issue, when several checklists exist

**User Role:** Member
**Steps:**
1. On one issue create two checklists; complete all items of the first and none of the second.

**Expected Result:**
- Checklist A shows 100%, checklist B shows 0%. Each bar tracks only its own items.

---

### TC-CHK-308: Status changes appear in Checklist History

**User Role:** Member
**Steps:**
1. Change an item from New to In progress to Done.
2. Open the Checklist History tab.

**Expected Result:**
- Each transition is logged with old value, new value, actor and timestamp.

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

---

### TC-CHK-310: Deleting the only completed item recalculates progress

**User Role:** Member
**Steps:**
1. Checklist with 2 items, 1 Done (50%). Delete the completed item.

**Expected Result:**
- Progress recalculates to 0% of 1 item — it must not stay at 50% using a stale denominator.

---

### TC-CHK-311: Adding an item to a 100% checklist

**User Role:** Member
**Steps:**
1. Complete all items (100%), then add one new item.

**Expected Result:**
- Progress drops to the correct fraction (e.g. 3/4 = 75%) immediately, without a reload being required to correct it.

---

### TC-CHK-312: Auto-calculate with zero checklist items

**User Role:** Admin + Member
**Steps:**
1. With auto-calculate enabled, create a checklist with no items on an issue whose % Done is 40.

**Expected Result:**
- % Done is not forced to 0 by an empty checklist, or if it is, the behaviour is documented and consistent —
  record which it does. Silently zeroing a manually-set value is a defect worth filing.

---

### TC-CHK-313: Rapid toggling of a checkbox

**User Role:** Member
**Steps:**
1. Tick and untick the same item rapidly five times, then reload.

**Expected Result:**
- The final persisted state matches the last click. No duplicate history entries beyond one per actual transition,
  and no lost update.

---

### TC-CHK-314: Status change by a user without issue-edit permission

**User Role:** Reporter-only or read-only member
**Steps:**
1. Open an issue with a checklist as a user who cannot edit issues.
2. Attempt to tick a checkbox, then attempt the same change via the underlying request directly.

**Expected Result:**
- The control is disabled or absent **and** the direct request is rejected with 403.
- A hidden control whose endpoint still accepts the write is a High-severity permission defect.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
