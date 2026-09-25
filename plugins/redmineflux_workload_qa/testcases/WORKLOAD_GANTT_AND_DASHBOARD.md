# Test Cases — Redmineflux Workload — Gantt Timeline & Workload Dashboard

> Source: vendor KB — "How to Use the Gantt View", "How to Split an Allocation",
> "How to View the Workload Dashboard", Troubleshooting ("Dashboard data does not match expected results"),
> FAQ Q7.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Workload Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_workload_qa

## Navigation methodology

Gantt: workload detail page → the timeline. Dashboard: Workloads → **Dashboard** icon (administrators only).

> **Gantt rule:** every drag, resize, reorder and split is confirmed by a **full page reload** and against the
> allocation figures. A bar that moved on screen while the stored allocation did not is the defect class this
> suite exists to catch, and it is invisible without the reload.

---

## Functional Cases — Gantt timeline

---

### TC-WKL-001: Timeline renders allocations across the workload range

**User Role:** Workload manager
**Priority:** Medium
**Steps:**
1. Open the Gantt view on a workload with several members and issues.

**Expected Result:**
- Allocations appear on the correct dates for the correct users, spanning the workload's date range.
- Bar positions match the allocation dates — check three against the underlying figures, since an off-by-one here
  misrepresents when work is scheduled.

---

### TC-WKL-002: Weekends, holidays and leave are visible as unavailable

**User Role:** Workload manager
**Priority:** High
**Steps:**
1. With a holiday and an approved leave record inside the range, inspect the timeline.

**Expected Result:**
- Non-working days and leave days are distinguishable from available days, per the KB's statement that capacity,
  approved leave, holidays and weekends are considered when reviewing timeline availability.
- A timeline that lets a manager schedule onto a day the capacity model has already excluded is misleading in
  exactly the situation the plugin exists to prevent.

---

### TC-WKL-003: Drag an allocation to new dates

**User Role:** Workload manager
**Priority:** High
**Steps:**
1. Drag an allocation later by a week; **reload**; re-check the allocation data.

**Expected Result:**
- The dates change and persist. The **duration and total planned hours are unchanged** by a move.

---

### TC-WKL-004: Resize an allocation

**User Role:** Workload manager
**Priority:** High
**Steps:**
1. Drag one edge to extend the allocation, then the other to shorten it; reload after each.

**Expected Result:**
- The date range changes as dragged and the opposite edge stays put.
- Record whether resizing changes the **planned hours** or only spreads the same hours over more days — both are
  defensible, but the daily distribution shown must be consistent with whichever it is.

---

### TC-WKL-005: Reorder a user's allocations

**User Role:** Workload manager
**Priority:** Medium
**Steps:**
1. Reorder allocations within one user's row; reload.

**Expected Result:**
- The new order persists and no allocation's dates or hours change as a side effect.

---

### TC-WKL-006: Daily allocation distribution

**User Role:** Workload manager
**Priority:** Medium
**Steps:**
1. Review the daily distribution for a member with several overlapping allocations.

**Expected Result:**
- The per-day totals equal the sum of that day's allocations, and they are compared against that day's available
  hours rather than against the whole-period capacity.
- A member can be within their period capacity while being badly overloaded on a single day; if the timeline
  cannot show that, the daily view adds nothing.

---

### TC-WKL-007: Overlapping conflicts are identified

**User Role:** Workload manager
**Priority:** High
**Steps:**
1. Create allocations that overlap in time for the same user.

**Expected Result:**
- The conflict is visibly flagged on the timeline, per the KB.

---

### TC-WKL-008: Rejected drags revert

**User Role:** Workload manager
**Priority:** High
**Steps:**
1. With overload disabled, drag an allocation onto a period where it would exceed available capacity.
2. Drag one outside the workload's date range.

**Expected Result:**
- Refused with an intelligible message and **the bar returns to its original position**.
- A bar left in the new position after a server-side rejection reads as a successful change and would have a
  manager planning against hours that were never saved.

---

### TC-WKL-009: Split an allocation

**User Role:** Workload manager
**Priority:** Medium
**Steps:**
1. Use the split action on an allocation, choose the split point, save; reload.

**Expected Result:**
- Two allocations exist for that issue and user, in separate date ranges.
- **Their planned hours sum to the original total** — a split must redistribute hours, never create or destroy
  them. This is the single most important assertion in the Gantt suite, because a split that duplicates the full
  hours into both halves would double that person's committed work invisibly.

---

### TC-WKL-010: Edit the halves of a split independently

**User Role:** Workload manager
**Priority:** Medium
**Steps:**
1. Move and resize each half separately.

**Expected Result:**
- Each behaves as an independent allocation; changing one does not alter the other.

---

### TC-WKL-011: Split at a boundary

**User Role:** Workload manager
**Priority:** Low
**Steps:**
1. Attempt to split a single-day allocation, and to split exactly at the first or last day.

**Expected Result:**
- Refused with a clear message, or handled sensibly. No zero-length allocation is created.

---

### TC-WKL-012: Cross-workload conflicts

**User Role:** Workload manager
**Priority:** High
**Steps:**
1. Allocate the same user in two different workloads over overlapping dates.

**Expected Result:**
- The conflict is detected and surfaced, per the KB's cross-workload conflict feature.
- **This is the plugin's strongest claim** — a person allocated at 100% in two workloads is 200% committed, and
  only cross-workload detection catches it. Confirm the detection actually accounts for the other workload's
  hours, not merely the overlap of dates.

---

## Functional Cases — Dashboard

---

### TC-WKL-013: Dashboard is available to administrators

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Workloads → **Dashboard**.

**Expected Result:**
- The dashboard loads, per FAQ Q7.

---

### TC-WKL-014: All documented sections are present

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Inspect the dashboard for each documented section.

**Expected Result:**
- KPI summary, capacity and planned-work trends, team capacity distribution, workload matrix, user availability
  heatmap, cross-workload conflicts, forecast data and allocation drilldown — all eight, per the KB.
- Record a result per section; a blanket "dashboard loads" pass would hide a missing one.

---

### TC-WKL-015: KPI figures reconcile with the workloads

**User Role:** Admin
**Priority:** High
**Steps:**
1. For one team and date range, compare the dashboard KPIs against the sum of the underlying workloads' capacity
   and planned hours.

**Expected Result:**
- They match exactly.
- These are the numbers managers rebalance teams from, so a plausible-but-wrong figure is more damaging than an
  obvious error.

---

### TC-WKL-016: Team capacity distribution

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Compare the distribution chart against each team's calculated capacity.

**Expected Result:**
- Proportions match the underlying figures, and the chart and its table agree.

---

### TC-WKL-017: User availability heatmap

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Check a user with known leave and holidays against the heatmap.

**Expected Result:**
- Their unavailable days are shown as unavailable on exactly the right dates.

---

### TC-WKL-018: Cross-workload conflicts on the dashboard

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. With a user allocated in two overlapping workloads, check the dashboard's conflicts section.

**Expected Result:**
- The conflict is listed, naming the user and both workloads (paired with TC-WKL-012).

---

### TC-WKL-019: Workload matrix

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Review the matrix against the actual workloads and their members.

**Expected Result:**
- Every workload and member combination is represented accurately, with no missing or phantom cells.

---

### TC-WKL-020: Allocation drilldown

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Drill into a summary figure to see the allocations behind it.

**Expected Result:**
- The listed allocations sum to the figure drilled from.
- **This cross-validates the dashboard's own arithmetic** — if the summary says 120 hours and the drilldown lists
  95, one of the two is wrong, and this is the cheapest way to find out.

---

### TC-WKL-021: Forecast

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Enable forecast and review the projected data.

**Expected Result:**
- The basis of the forecast is explainable and consistent between runs with the same inputs.
- Record what it projects from; an unexplained forecast number invites decisions nobody can audit.

---

### TC-WKL-022: Trends over a date range

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Review capacity and planned-work trends over a multi-month range.

**Expected Result:**
- The series are continuous with no missing periods, and the per-period values match the underlying workloads.

---

## Functional Cases — Dashboard filters

---

### TC-WKL-023: Each filter narrows the data

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Apply the date range, team, workload, user and status filters individually.

**Expected Result:**
- Each narrows every dashboard section consistently — a filter that applies to the KPIs but not the heatmap makes
  the page internally contradictory.

---

### TC-WKL-024: Filters combine

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Apply several filters together.

**Expected Result:**
- The result is the intersection. The KB names filters as the first thing to check when "dashboard data does not
  match expected results", so their behaviour must be predictable and visible.

---

### TC-WKL-025: Active filters are clearly indicated

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Apply filters, navigate away and return.

**Expected Result:**
- Any persisted filter is **visibly indicated**.
- A silently retained filter is the documented cause of confusing dashboards — the data looks wrong when it is
  simply narrowed, and the user has no cue.

---

## Negative Cases

---

### TC-WKL-026: Dashboard is not reachable by non-admins

**User Role:** A user with **Manage teams and skills**, a workload manager, and a plain member
**Priority:** High
**Steps:**
1. Confirm the Dashboard icon is not offered to any of them.
2. Request the dashboard URL and its data endpoints **directly** for each.

**Expected Result:**
- All refused with 403.
- The dashboard aggregates **every team's** capacity, allocations and leave-driven availability. A workload
  manager reaching it would see the whole organisation's planning data, including teams they have no relationship
  with — High severity.

---

### TC-WKL-027: Dashboard with no data

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Open the dashboard with filters that match nothing, and on an instance with no workloads.

**Expected Result:**
- Clean empty states in every section — no `NaN`, no divide-by-zero in utilization, and no broken charts.
- Utilization is planned ÷ capacity, so a zero-capacity selection is the obvious division hazard.

---

### TC-WKL-028: Gantt changes without permission

**User Role:** A member of the team **without** the Manage workload flag
**Priority:** High
**Steps:**
1. Confirm allocations are not draggable.
2. Send drag, resize, reorder and **split** requests directly.

**Expected Result:**
- All refused with 403. A read-only team member must not be able to re-plan the team's work through the timeline
  endpoints.

---

### TC-WKL-029: Dashboard and workload figures agree

**User Role:** Admin
**Priority:** High
**Steps:**
1. For one team and period, compare: the workload detail capacity, the Gantt daily distribution totals, the
   dashboard KPI, and the allocation drilldown.

**Expected Result:**
- All four agree.
- **This is the most valuable reconciliation in the plugin.** Each figure is produced by different code over the
  same data; a divergence pinpoints which view is wrong, and each number looks entirely reasonable on its own.

---

### TC-WKL-030: Large-scale performance

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Open the Gantt on a workload with 20 members and several hundred allocations, then the dashboard across a
   year with many teams.

**Expected Result:**
- Both render in reasonable time and remain interactive. Record the timings.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
