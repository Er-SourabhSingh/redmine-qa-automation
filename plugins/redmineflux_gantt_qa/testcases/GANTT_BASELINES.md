# Test Cases — Redmineflux Gantt Chart — Baselines

> Source: vendor KB — "How to Use Baselines", "Permissions and Access Control" (baselines require core
> Manage versions), Troubleshooting ("If baseline controls do not appear"), FAQ Q8.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Gantt Chart Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_gantt_qa

## Navigation methodology

Project → **Flux Gantt** → baseline controls (exposed through the settings panel's baseline display fields).
Managing baselines requires Redmine's core **Manage versions** permission — grant it before running this suite.

---

## Functional Cases

---

### TC-GNT-001: Baseline controls appear when enabled

**User Role:** Member with Manage versions
**Priority:** Medium
**Steps:**
1. Open the settings panel and enable the baseline controls / baseline display fields.

**Expected Result:**
- Baseline controls become visible on the chart.
- This is the KB's documented remedy for "baseline controls do not appear", so the toggle must actually reveal
  them.

---

### TC-GNT-002: Create a baseline

**User Role:** Member with Manage versions
**Priority:** High
**Steps:**
1. Open baseline controls, click **Create Baseline**, enter a name, save.

**Expected Result:**
- The baseline is created and selectable in the baseline list.
- A success message is shown.

---

### TC-GNT-003: Baseline captures the timeline as it was at creation

**User Role:** Member
**Priority:** High
**Steps:**
1. Note several issues' dates, create a baseline named `B1`.
2. Reschedule two of those issues by dragging.
3. Select `B1` and enable baseline display.

**Expected Result:**
- Overlay bars show the **original** dates from creation time, next to the current bars.
- The drift between planned and current is visible for exactly the two issues that moved, and not for the others.
- This is the feature's whole purpose (FAQ Q8); a baseline that tracks current dates instead of the snapshot is a
  High-severity defect that makes the feature silently useless.

---

### TC-GNT-004: Multiple baselines coexist

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Create `B1`, reschedule work, create `B2`, reschedule again.
2. Switch the selection between `B1` and `B2`.

**Expected Result:**
- Each shows its own distinct snapshot. Switching updates the overlay without a reload.

---

### TC-GNT-005: Clear the baseline selection

**User Role:** Member
**Priority:** Medium
**Steps:**
1. With a baseline displayed, clear the selection.

**Expected Result:**
- Overlay bars disappear; current bars are unaffected.
- The baseline itself still exists and can be re-selected.

---

### TC-GNT-006: Delete a baseline

**User Role:** Member with Manage versions
**Priority:** High
**Steps:**
1. Select a baseline, click **Delete**, confirm.

**Expected Result:**
- It is removed from the list and its overlay data is gone — the KB states baseline data is removed on deletion.
- **The issues themselves are untouched.** Deleting a baseline must never alter real dates; any date change here
  would be a Critical defect.

---

### TC-GNT-007: Cancel a baseline deletion

**User Role:** Member
**Priority:** Low
**Steps:**
1. Trigger the delete and cancel the confirmation.

**Expected Result:**
- The baseline still exists after a reload and can still be displayed.

---

### TC-GNT-008: Baseline overlay across zoom levels and display modes

**User Role:** Member
**Priority:** Medium
**Steps:**
1. With a baseline displayed, switch zoom levels and toggle Work Days / Full Week.

**Expected Result:**
- Overlay bars stay correctly aligned with the grid at every scale and remain visually distinguishable from the
  current bars.

---

### TC-GNT-009: Baseline is per project

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Create a baseline in project A and open project B's chart.

**Expected Result:**
- A's baseline is not offered in B. Baselines are project-scoped snapshots.

---

## Negative Cases

---

### TC-GNT-010: Baseline name cannot be blank

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Create a baseline leaving the name blank.

**Expected Result:**
- Rejected with a clear validation message. The KB states this as a required behaviour, so a blank-named baseline
  is a defect against a documented rule — and an unnamed entry in the list is unselectable in practice.

---

### TC-GNT-011: Duplicate baseline names

**User Role:** Member
**Priority:** Low
**Steps:**
1. Create two baselines with the same name in one project.

**Expected Result:**
- Either rejected with a uniqueness message, or allowed with both distinguishable (e.g. by creation date).
- Two identical entries with no way to tell them apart is a usability defect, because deleting the wrong one is
  irreversible.

---

### TC-GNT-012: Very long baseline name

**User Role:** Member
**Priority:** Low
**Steps:**
1. Create a baseline with a 500-character name.

**Expected Result:**
- Rejected with a stated maximum, or rendered with truncation that does not break the baseline control layout.

---

### TC-GNT-013: Script content in a baseline name

**User Role:** Member
**Priority:** High
**Steps:**
1. Name a baseline with a script tag and view it in the selector and any overlay legend.

**Expected Result:**
- Escaped and rendered literally. **No script executes** — Critical if it does.

---

### TC-GNT-014: Baseline management without Manage versions

**User Role:** Member with View Flux Gantt but **not** Manage versions
**Priority:** High
**Steps:**
1. Confirm baseline create/delete controls are absent.
2. Send baseline create, update and delete requests directly to their endpoints.

**Expected Result:**
- No controls, **and** all three direct requests refused.
- The KB states plainly that baseline management requires core Manage versions and that "direct API requests
  enforce permission checks". A hidden control whose endpoint still accepts the write is a High-severity defect —
  and deletion is irreversible, which raises the stakes.

---

### TC-GNT-015: Baseline on an empty project

**User Role:** Member
**Priority:** Low
**Steps:**
1. Create a baseline on a project with no releases or issues.

**Expected Result:**
- Either refused with an explanation, or created as an empty snapshot that displays without error.
- Not a crash and not a baseline that appears to contain data it never captured.

---

### TC-GNT-016: Baseline after issues are deleted

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Create a baseline, then delete some of the issues it captured.
2. Display the baseline.

**Expected Result:**
- The overlay handles missing issues gracefully — either omitting them or showing them as removed.
- No orphaned overlay bar floating with no corresponding row, and no console error on render.

---

### TC-GNT-017: Baseline after new issues are added

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Create a baseline, add three new issues, then display the baseline.

**Expected Result:**
- New issues have no overlay bar, since they did not exist at snapshot time. That absence is correct and must be
  visually distinguishable from "unchanged", not silently ambiguous.

---

### TC-GNT-018: Concurrent baseline operations

**User Role:** Two members with Manage versions
**Priority:** Low
**Steps:**
1. A displays baseline `B1`; B deletes `B1`. A then interacts with the overlay.

**Expected Result:**
- A gets a clear message and the overlay clears. No 500 and no stale overlay claiming to show deleted data.

---

### TC-GNT-019: Baseline data is removed on plugin uninstall

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. With baselines present, roll back the plugin migration (`VERSION=0`) as covered in TC-GNT-095.

**Expected Result:**
- Baseline tables and data are removed cleanly; issues and versions survive untouched.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
