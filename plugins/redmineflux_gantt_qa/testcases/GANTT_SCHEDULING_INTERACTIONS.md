# Test Cases — Redmineflux Gantt Chart — Drag, Resize & Inline Editing

> Source: vendor KB — "How to Edit Issues Inline", "How to Reschedule Tasks with Drag and Drop",
> "How to Resize Task Bars", "How Progress Is Calculated", Troubleshooting ("If drag or resize does not work"),
> FAQ Q3 and Q4.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Gantt Chart Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_gantt_qa

## Navigation methodology

Project → **Flux Gantt**. Drags and resizes must be performed as **real mouse interactions** on the bar and its
edges, not simulated by calling an endpoint — the point of these cases is the interaction plus its server round
trip.

> **The central behaviour under test:** the KB states the interface uses **optimistic updates** — the bar moves
> immediately and "reverts automatically if the server rejects the change". Every case below therefore has two
> assertions: what the bar does, and what the **issue record** actually holds afterwards. Confirm the record on the
> issue's own page or after a full reload. A bar that stays moved while the issue did not change is the most
> important defect class in this suite.

---

## Functional Cases — Drag and drop

---

### TC-GNT-301: Drag an issue bar to a new date

**User Role:** Member with View Flux Gantt and editable issue dates
**Steps:**
1. Drag an issue bar two weeks to the right and drop it.
2. Reload the chart, then open the issue page.

**Expected Result:**
- Start and due dates both shift by the same offset; duration is unchanged.
- The issue record matches the new bar position after reload.
- The change is journaled on the issue like any other date change.

---

### TC-GNT-302: Drag preserves duration

**User Role:** Member
**Steps:**
1. Note an issue's duration in days, drag it, and re-measure.

**Expected Result:**
- Duration is identical before and after. A drag that silently stretches or shrinks the bar is a defect.

---

### TC-GNT-303: Rejected drag reverts the bar

**User Role:** Member
**Steps:**
1. Drag a subtask outside its parent's date range — a violation the KB names explicitly.

**Expected Result:**
- The server rejects it, the bar **returns to its original position**, and a failure toast explains why —
  exactly as KB FAQ Q4 describes.
- Confirm the issue's dates are unchanged. A bar that reverts visually while the write actually succeeded, or one
  that stays moved while the write failed, are both High-severity defects.

---

### TC-GNT-304: Drag on a derived parent is refused

**User Role:** Member
**Steps:**
1. Drag a parent bar whose dates are derived from its subtasks.

**Expected Result:**
- Refused with the read-only-dates message, and the bar reverts. The KB documents this as expected behaviour.

---

### TC-GNT-305: Drag respects release boundaries

**User Role:** Member
**Steps:**
1. Drag an issue past the end of its release window.

**Expected Result:**
- Either accepted with the issue still correctly associated with its release, or refused with a boundary message
  and a reverting bar. Record which — the KB lists release boundaries among the reasons a drag can fail.

---

## Functional Cases — Resizing

---

### TC-GNT-306: Left-edge resize changes the start date only

**User Role:** Member
**Steps:**
1. Drag the left edge of a bar earlier by a week; reload; open the issue.

**Expected Result:**
- Start date moves; **due date is unchanged**; duration grows. The KB states this mapping explicitly.

---

### TC-GNT-307: Right-edge resize changes the due date only

**User Role:** Member
**Steps:**
1. Drag the right edge later by a week; reload; open the issue.

**Expected Result:**
- Due date moves; start date unchanged.

---

### TC-GNT-308: Resize past the opposite edge is rejected

**User Role:** Member
**Steps:**
1. Drag the right edge to a date before the start date.

**Expected Result:**
- Refused — "start date must be before or equal to due date" is a stated server-side rule — and the bar reverts.
- The rejection must come from the server, not only from the client: confirm the record afterwards.

---

### TC-GNT-309: Subtask resize is constrained by the parent

**User Role:** Member
**Steps:**
1. Resize a subtask so it would extend beyond its parent's dates.

**Expected Result:**
- Refused with an intelligible message and a reverting bar, per the KB's stated validation.

---

### TC-GNT-310: Resize a single-day task

**User Role:** Member
**Steps:**
1. Resize an issue whose start and due date are the same day, in both directions.

**Expected Result:**
- Handled correctly at the one-day boundary. A zero-width or negative-width bar is a rendering defect.

---

## Functional Cases — Inline edit modal

---

### TC-GNT-311: Double-click opens the edit modal

**User Role:** Member
**Steps:**
1. Double-click an issue bar, then an issue row in the left panel.

**Expected Result:**
- The in-app edit modal opens from both, as the KB describes, without leaving the timeline.

---

### TC-GNT-312: Edit subject, assignee, dates, progress and custom fields

**User Role:** Member
**Steps:**
1. Change each of those fields in the modal and save.
2. Reload and open the issue page.

**Expected Result:**
- Every change persists and is journaled.
- The chart re-renders to match — a saved date change that does not move the bar until a manual reload is a defect.

---

### TC-GNT-313: Modal validation matches Redmine's own

**User Role:** Member
**Steps:**
1. Clear a required field and save; enter an invalid date; enter a progress value outside the allowed increments.

**Expected Result:**
- Each is rejected at the field with an intelligible message and nothing is written.
- Validation must match the standard issue form's. A modal that accepts what the standard form refuses is a
  High-severity defect, because it writes invalid records.

---

### TC-GNT-314: Cancel the modal

**User Role:** Member
**Steps:**
1. Open the modal, change several fields, cancel.

**Expected Result:**
- Nothing is written. Confirm via reload and the issue's History.

---

### TC-GNT-315: Delete an issue from the modal

**User Role:** Member with delete rights
**Steps:**
1. Use the modal's delete action and confirm.

**Expected Result:**
- The issue and its bar are removed, with a confirmation step before the delete.
- Cancelling the confirmation leaves the issue intact — verify by reload, not by the chart's rendering alone.

---

### TC-GNT-316: Workflow rules are enforced in the modal

**User Role:** Member on a role with a restricted workflow
**Steps:**
1. Attempt a status transition the workflow forbids, and edit a field the workflow marks read-only.

**Expected Result:**
- Both refused. The modal must honour workflow transitions and field permissions exactly as the standard form does.

---

## Negative Cases

---

### TC-GNT-317: Drag or resize without edit permission

**User Role:** Member whose role lacks View Flux Gantt
**Steps:**
1. Confirm drag handles and mutation buttons are absent, as the KB states they are hidden.
2. Send the date-update request **directly** to the chart's endpoint.

**Expected Result:**
- No handles, **and** the direct request refused. The KB claims "direct API requests enforce permission checks" —
  this case verifies that claim rather than trusting it.
- A hidden handle whose endpoint still accepts writes is a High-severity defect.

---

### TC-GNT-318: Network failure mid-drag

**User Role:** Member
**Steps:**
1. Take the network offline, then drag a bar and drop it.

**Expected Result:**
- The optimistic move reverts and a failure message appears. The bar must not be left showing an unsaved position
  that looks committed — this is precisely the risk the optimistic-update design creates.

---

### TC-GNT-319: Session expiry mid-interaction

**User Role:** Member
**Steps:**
1. Let the session expire, then drag a bar.

**Expected Result:**
- A clear message or a redirect to login, and the bar reverts. Not a silent no-op that reads as success.

---

### TC-GNT-320: Concurrent edits to the same issue

**User Role:** Two members
**Steps:**
1. Both have the chart open on the same issue. A drags the bar; B, without reloading, edits the dates in the modal
   and saves.

**Expected Result:**
- The second write either wins cleanly or is refused with a stale-object message. Both users see consistent dates
  after reload.
- Silently discarding A's change with no record is a High-severity data-loss defect.

---

### TC-GNT-321: Rapid successive drags

**User Role:** Member
**Steps:**
1. Drag the same bar three times in quick succession, then reload.

**Expected Result:**
- The final stored dates match the last drop. No interleaved request writes an intermediate position, and the
  issue History shows no phantom transitions.

---

### TC-GNT-322: Drag onto a non-working day in Work Days mode

**User Role:** Member
**Steps:**
1. In **Work Days** display mode, drop a bar so it would start on a weekend.

**Expected Result:**
- Behaviour is deterministic and explained — snapped to the next working day, or accepted as-is. Record which.
- The stored dates must match what the bar shows after the operation settles.

---

### TC-GNT-323: Drag an issue in a closed or archived project

**User Role:** Member
**Steps:**
1. Attempt a drag in a closed project, then in an archived project, and send the update directly in each case.

**Expected Result:**
- Refused at both the UI and the endpoint, matching Redmine's own closed/archived semantics.

---

### TC-GNT-324: Optimistic update after a server-side validation the client cannot know

**User Role:** Member
**Steps:**
1. Configure a workflow rule that blocks a date change for this role, then drag the bar.

**Expected Result:**
- The bar moves optimistically, the server refuses, the bar reverts, and the toast explains the workflow reason
  rather than showing a generic failure.
- The KB directs users to "review the toast message shown by the chart", so a generic or empty toast here defeats
  the documented troubleshooting path and is a defect in its own right.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
