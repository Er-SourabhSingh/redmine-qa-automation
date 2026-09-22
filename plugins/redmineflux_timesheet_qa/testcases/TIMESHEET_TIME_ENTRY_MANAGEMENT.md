# Test Cases — Redmineflux Timesheet — Logging, Updating & Deleting Time Entries

> Source: vendor KB — "How to View Timesheet", "How to Add Time Entries", "How to Update Time Entries",
> "How to Remove Time Entries", plus the Past Date and Approval settings they interact with.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Timesheet Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_timesheet_qa

## Navigation methodology

Main navigation → **Timesheet**. Do not type URLs.

> **Cross-check rule:** every entry created, changed or deleted here must be confirmed against **core Redmine's own
> spent-time view** for the same user and issue. This plugin writes ordinary Redmine time entries; a grid that
> shows hours the core report does not (or vice versa) is the defect class this suite targets, and it is invisible
> if only the grid is checked.

---

## Functional Cases — Viewing

---

### TC-TMS-125: The weekly grid renders the correct period

**User Role:** Member with View Timesheet
**Steps:**
1. Open Timesheet and inspect the default view.

**Expected Result:**
- A weekly calendar/timesheet grid for the current period, with day columns matching the configured period type
  (Monday–Sunday in Weekly mode).
- Existing entries appear in the correct day cells.

---

### TC-TMS-126: Totals are accurate

**User Role:** Member
**Steps:**
1. Compare the grid's daily and period totals against the sum of the individual entries, and against core
   Redmine's spent-time report for the same range.

**Expected Result:**
- All three agree. A rounding or timezone discrepancy at a day boundary shows up here and nowhere else.

---

## Functional Cases — Adding entries

---

### TC-TMS-127: Log time via the Log Time modal

**User Role:** Member
**Steps:**
1. Click **Log Time**; select a date and activity, enter hours, add a comment; **Save Time Entry**.

**Expected Result:**
- The entry appears in the correct cell and persists after a reload.
- It exists as a normal Redmine time entry with exactly those values.

---

### TC-TMS-128: Log time by hovering a task cell

**User Role:** Member
**Steps:**
1. Hover the relevant task cell and log time through that route.

**Expected Result:**
- Identical result to the modal route. Both documented paths must produce the same record.

---

### TC-TMS-129: Activity list matches the project's configuration

**User Role:** Member
**Steps:**
1. Compare the activity dropdown against Administration → Enumerations and the project's own activity overrides.

**Expected Result:**
- Only activities valid for that project are offered — an activity disabled for the project must not be selectable.

---

### TC-TMS-130: Required fields are enforced

**User Role:** Member
**Preconditions:** The instance requires a comment on time entries, and/or has required time-entry custom fields.
**Steps:**
1. Attempt to save an entry omitting each required field.

**Expected Result:**
- Refused with a message naming the field.
- **The plugin must not create time entries that core Redmine's own form would reject** — those records surface
  later as unsaveable entries and are a High-severity data-integrity defect.

---

## Functional Cases — Updating entries

---

### TC-TMS-131: Expand a task row to see its entries

**User Role:** Member
**Steps:**
1. Double-click a task row; hover a target date cell.

**Expected Result:**
- Existing entries for that task are revealed with their details, per the KB.

---

### TC-TMS-132: Update an entry's fields

**User Role:** Member
**Steps:**
1. Change the date, activity, hours and comment; click **Update Time Entry**; reload.

**Expected Result:**
- All four changes persist and are reflected in core Redmine's spent-time view.
- Changing the **date** moves the entry to the correct cell — and if it moves outside the current period, that is
  visible rather than appearing as data loss.

---

### TC-TMS-133: Multiple entries for the same issue and activity

**User Role:** Member
**Steps:**
1. Create two entries for the same issue, activity and date; then edit one.

**Expected Result:**
- The user is prompted to choose the specific entry, exactly as the KB describes.
- **The edit applies to the chosen entry only.** Silently editing the wrong one, or merging the two, would be a
  real data defect — and this ambiguity is precisely why the prompt exists.

---

### TC-TMS-134: Cancelling an update writes nothing

**User Role:** Member
**Steps:**
1. Begin an update, change values, then cancel.

**Expected Result:**
- The original values are retained; confirm by reload.

---

## Functional Cases — Deleting entries

---

### TC-TMS-135: Delete an entry

**User Role:** Member
**Steps:**
1. Expand the task, select the entry, click **Delete**, confirm.

**Expected Result:**
- The entry is removed from the grid and from core Redmine's spent-time data; totals recalculate.

---

### TC-TMS-136: Cancel a deletion

**User Role:** Member
**Steps:**
1. Trigger the delete and cancel the confirmation.

**Expected Result:**
- The entry still exists after a reload.

---

## Negative Cases — policy enforcement

---

### TC-TMS-137: Logging outside the allowed past-date window

**User Role:** Member
**Preconditions:** Allowed Past Days = 3.
**Steps:**
1. Log time 3 days back (boundary, expect allowed), 4 days back (expect refused).
2. Send the 4-days-back request **directly** to the endpoint.

**Expected Result:**
- The boundary behaves as documented and the out-of-window request is refused at the endpoint too.
- Test the exact boundary day, not just an obviously-old date — off-by-one on "allowed past days" is the likely
  defect and silently gives or removes a day from everyone.

---

### TC-TMS-138: Logging after the daily cutoff time

**User Role:** Member
**Steps:**
1. With a cutoff of, say, 18:00, attempt a past-date log before and after that moment.

**Expected Result:**
- Permitted before the cutoff, refused afterwards, with a clear message.
- Record the timezone the cutoff is evaluated in — server time versus user time changes who is locked out and when.

---

### TC-TMS-139: Past-date logging disabled entirely

**User Role:** Admin then Member
**Steps:**
1. Disable **Allow Past Date Timelog**; attempt to log any past date, through the UI and directly.

**Expected Result:**
- Refused at both. Only the current date is loggable.

---

### TC-TMS-140: Future-dated entries

**User Role:** Member
**Steps:**
1. Attempt to log time for tomorrow and for next month.

**Expected Result:**
- Behaviour is explicit and consistent — refused with a message, or allowed deliberately.
- Record which. Future logging is not mentioned in the KB at all, and silently accepting it would let users submit
  a period before it has happened, which undermines the deadline model.

---

### TC-TMS-141: Editing and deleting outside the allowed window

**User Role:** Member
**Preconditions:** **Block Edit/Delete After Allowed Period** enabled.
**Steps:**
1. Attempt to edit, then delete, an entry outside the window, through the UI and directly.

**Expected Result:**
- Both refused at both legs (paired with TC-TMS-040).

---

### TC-TMS-142: Editing after approval

**User Role:** Member
**Preconditions:** **Disable Log/Edit After Approval** enabled; the period is approved.
**Steps:**
1. Attempt to add, edit and delete entries in the approved period, through the UI and directly.

**Expected Result:**
- All refused at the endpoint.
- **An approved timesheet that can still be modified voids the approval record** — the approver signed off on
  figures that no longer exist. High severity if any of the three succeeds.

---

### TC-TMS-143: Overtime is flagged at the threshold boundary

**User Role:** Member
**Preconditions:** Overtime Threshold = 8.
**Steps:**
1. Log exactly 8 hours in a day, then 8.25.

**Expected Result:**
- 8 is not overtime; 8.25 is. The boundary is inclusive of the threshold, and consistent between the grid display
  and any report that counts overtime.

---

### TC-TMS-144: Invalid hours values

**User Role:** Member
**Steps:**
1. Enter `0`, a negative number, `abc`, `25` hours in one day, and a value with excessive decimal places.

**Expected Result:**
- Each is rejected or normalised with a clear message.
- More than 24 hours logged against a single day is worth flagging even if core Redmine permits it — it is a
  reliable sign of a mis-keyed entry and it corrupts every downstream report.

---

### TC-TMS-145: Script content in a comment

**User Role:** Member
**Steps:**
1. Save an entry whose comment contains a script tag; view it in the grid, in the approver's review view, in the
   reports, and in the CSV export.

**Expected Result:**
- Escaped and rendered literally in all four. **No script executes.**
- The approver's review view matters most: a submitter's comment is rendered into a manager's screen, so execution
  there would be a stored-XSS path targeting exactly the higher-privileged user.

---

### TC-TMS-146: Editing another user's entries

**User Role:** Member
**Steps:**
1. Attempt to edit and delete another user's time entry through the grid and by sending the requests directly.

**Expected Result:**
- Refused at both legs unless the role explicitly grants it.
- A member able to alter a colleague's submitted hours through the endpoint is a High-severity defect —
  it corrupts both payroll-grade data and the audit trail.

---

### TC-TMS-147: Concurrent edits to the same entry

**User Role:** Two users with rights over the same entry
**Steps:**
1. Both open it; A changes the hours; B, without reloading, changes the comment and saves.

**Expected Result:**
- No lost update, or a clear stale-state message. After both reload, the values are consistent.

---

### TC-TMS-148: Logging against an issue in a closed or archived project

**User Role:** Member
**Steps:**
1. Attempt to log time in a closed project, then an archived one, through the UI and directly.

**Expected Result:**
- Matches Redmine's own semantics, enforced at the endpoint. The plugin must not become a route to log time where
  core Redmine would refuse it.

---

### TC-TMS-149: Entries persist correctly across a period boundary

**User Role:** Member
**Steps:**
1. Log time on the last day of one period and the first day of the next; view both periods.

**Expected Result:**
- Each entry appears in exactly one period, in the right one.
- **Check this across a month/week boundary and across a year boundary.** A boundary error here places hours in the
  wrong submission period, so they are approved by the wrong timesheet — a subtle defect with real consequences.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
