# Test Cases — Redmineflux Time Tracker — Calendar, Activity View & Map

> Source: vendor KB — "How to Log Time from the Calendar", "How to Edit Time Entries from the Calendar",
> "How to View Activity in the Time Tracker Plugin", FAQ Q6.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Time Tracker Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_time_tracker_qa

## Navigation methodology

Time Tracker → **Calendar** icon in the sidebar; Time Tracker → **Activity** tab. Do not type URLs.
Every calendar drag or resize must be confirmed by a **full reload** and against core Redmine's spent-time data —
a visual change that did not persist is the defect this suite targets.

> **Privacy note for the Map View cases:** the map plots where employees physically were when they tracked time.
> Treat anything that exposes one user's location to another as a High-severity finding rather than a routine
> permission gap, and be deliberate about which account each observation is made from.

---

## Functional Cases — Calendar

---

### TC-TMT-001: Calendar opens and shows existing entries

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Open the Calendar from the sidebar.

**Expected Result:**
- Entries appear on their correct dates, positioned at the correct times of day, with durations matching their
  recorded hours.
- Cross-check three entries against the list view — a calendar that renders an entry an hour off is a timezone
  defect that misrepresents when work happened.

---

### TC-TMT-002: Add a time entry from the calendar

**User Role:** Member
**Priority:** High
**Steps:**
1. Click **Add Time Entry**, fill the required fields, and click **Log Time** for the selected range.

**Expected Result:**
- The entry is created for that exact time range and appears in the list view and in core Redmine.

---

### TC-TMT-003: Resize an entry by dragging its edges

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Drag the **end** of an entry to extend it by an hour; reload.
2. Drag the **start** to shorten it; reload.

**Expected Result:**
- The start or end time changes as dragged, the recorded hours update to match, and both persist.
- **The opposite edge must not move** — dragging the end must not shift the start.

---

### TC-TMT-004: Double-click to edit an entry

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Double-click a calendar entry and change its fields; save; reload.

**Expected Result:**
- The edit dialog opens with the current values and all changes persist.

---

### TC-TMT-005: Drag an entry to another date

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Drag an entry from one date to another; reload; check the list view.

**Expected Result:**
- The entry's date changes and its duration is preserved.
- The change is journaled. Moving an entry between days moves hours between reporting periods, so it must be
  recorded like any other edit.

---

### TC-TMT-006: Calendar changes respect validation

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Resize an entry to zero length; drag one so it would end before it starts; extend one past midnight.

**Expected Result:**
- Each is refused with a clear message and the entry snaps back to its previous position.
- A visual change that is rejected server-side must not remain on screen looking saved — this is the classic
  drag-and-drop defect and it is easy to miss without a reload.

---

### TC-TMT-007: Calendar respects the same rules as the list

**User Role:** Member
**Priority:** High
**Steps:**
1. Attempt, from the calendar, an action the list view refuses — editing another user's entry, or logging into a
   closed project.

**Expected Result:**
- Refused identically. The calendar is a second write path onto the same data and must not be a route around the
  rules enforced elsewhere.

---

### TC-TMT-008: Calendar across week and month boundaries

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Navigate across a week boundary, a month boundary and a year boundary; drag an entry across each.

**Expected Result:**
- Entries render in the correct period throughout, and a cross-boundary move lands on the intended date.

---

## Functional Cases — Activity view

---

### TC-TMT-009: Activity tab lists logs

**User Role:** Member with **View Time Tracker Activity**
**Priority:** Medium
**Steps:**
1. Open the Activity tab.

**Expected Result:**
- Activity logs render, showing who logged what and when.

---

### TC-TMT-010: Filter by project

**User Role:** Member with the permission
**Priority:** Medium
**Steps:**
1. Apply a project filter.

**Expected Result:**
- Only that project's activity is shown, and the totals reconcile with the project's spent-time report.

---

### TC-TMT-011: Filter by user

**User Role:** Member with the permission
**Priority:** Medium
**Steps:**
1. Apply a user filter.

**Expected Result:**
- Only that user's activity is shown.

---

### TC-TMT-012: Filter by custom date range

**User Role:** Member with the permission
**Priority:** Medium
**Steps:**
1. Apply a custom date range, including one spanning a month boundary.

**Expected Result:**
- Only activity inside the range appears, with both endpoints inclusive.
- Confirm inclusivity explicitly — a range that silently drops the final day understates every figure derived
  from it.

---

### TC-TMT-013: Filters combine

**User Role:** Member with the permission
**Priority:** Medium
**Steps:**
1. Apply project, user and date-range filters together.

**Expected Result:**
- The result is the intersection — a subset of each filter applied alone.

---

## Functional Cases — Map View

---

### TC-TMT-014: Map renders locations where data exists

**User Role:** Member with View Time Tracker Activity
**Priority:** Medium
**Preconditions:** A valid Google Maps API key configured, and entries recorded with location data.
**Steps:**
1. Switch to **Map View**.

**Expected Result:**
- Markers appear at the recorded locations, associated with the right users and entries.

---

### TC-TMT-015: Map without an API key

**User Role:** Member
**Priority:** Low
**Steps:**
1. Clear the API key and open Map View.

**Expected Result:**
- A clear message explaining that a Maps API key is required — not a blank panel or a raw Google error
  (paired with TC-TMT-033).

---

### TC-TMT-016: Map shows only locations the viewer is entitled to see

**User Role:** A member **without** permission to view others' time entries
**Priority:** High
**Steps:**
1. Open Map View and enumerate the markers.
2. Inspect the **underlying response payload**, not only the rendered map.

**Expected Result:**
- Only this user's own locations are present, in the rendered map **and in the response data**.
- **This is the most important case in the suite.** Location markers are personal data about employees'
  physical whereabouts. A map that fetches all users' coordinates and filters them in the browser leaks them
  entirely — invisible from the UI and only detectable by reading the payload. High severity.

---

### TC-TMT-017: Entries without location data

**User Role:** Member
**Priority:** Low
**Steps:**
1. View a period containing entries logged without location (manual entries, or with the requirement disabled).

**Expected Result:**
- Those entries simply have no marker, with no error and no marker placed at coordinates `0,0`.
- A null-island marker would falsely place a user off the coast of Africa, which is worse than no marker at all.

---

### TC-TMT-018: Location accuracy and attribution

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Start a timer with location granted; compare the recorded marker against the actual location.
2. Confirm the marker is attributed to the correct user and entry.

**Expected Result:**
- The location corresponds to where the timer was started, and it is attached to the right user and entry.
- A location attributed to the wrong user would be both a data defect and a disclosure.

---

## Negative Cases

---

### TC-TMT-019: Activity view without the permission

**User Role:** Member without **View Time Tracker Activity**
**Priority:** High
**Steps:**
1. Confirm the Activity tab is not offered.
2. Request the activity URL and its data endpoint **directly**.
3. Request the map data endpoint directly.

**Expected Result:**
- All three refused with 403.
- The KB names this permission as gating "the activity module", so the endpoints must enforce it — the map
  endpoint especially, since it carries location data.

---

### TC-TMT-020: Activity view respects issue and project visibility

**User Role:** Member of project A only
**Priority:** High
**Preconditions:** **Confirm project B is genuinely private** — a newly created Redmine project defaults to public.
**Steps:**
1. Open the Activity view and look for any project B activity.
2. Apply a filter deliberately targeting project B.

**Expected Result:**
- No project B rows, and the filter cannot be used to reach them.
- A filter that widens visibility is the classic leak in an aggregate view.

---

### TC-TMT-021: Activity filters do not enumerate users

**User Role:** Low-privilege member
**Priority:** High
**Steps:**
1. Open the user filter dropdown.

**Expected Result:**
- Only users this role is entitled to see under the instance's user-visibility setting.
- A filter list that enumerates every account on the instance is a minor but real disclosure.

---

### TC-TMT-022: Calendar performance with many entries

**User Role:** Member
**Priority:** Low
**Steps:**
1. Open the calendar on a month containing several hundred entries.

**Expected Result:**
- Renders in reasonable time and remains usable for dragging. Record the render time.

---

### TC-TMT-023: Map performance with many markers

**User Role:** Member with the permission
**Priority:** Low
**Steps:**
1. Open Map View over a range containing several hundred located entries.

**Expected Result:**
- Markers cluster or paginate rather than rendering individually to the point of freezing the browser.
  Record the behaviour and timing.

---

### TC-TMT-024: Concurrent calendar edits

**User Role:** Two sessions of the same user
**Priority:** Medium
**Steps:**
1. Drag the same entry to different dates in each session without reloading.

**Expected Result:**
- No lost update, or a clear stale-state message. After both reload, the entry is on exactly one date.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
