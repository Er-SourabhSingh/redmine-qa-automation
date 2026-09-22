# Test Cases — Redmineflux Time Tracker — Timer, Manual Entry & Entry Management

> Source: vendor KB — "How to View the Time Tracker", "How to Run the Timer",
> "How to Update Time Entries from the Time Tracker", "How to Log Time Manually",
> "How to Duplicate a Time Entry", "How to Delete a Time Entry", FAQ Q3 – Q6.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Time Tracker Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_time_tracker_qa

## Navigation methodology

Top navigation → **Time Tracker**. Do not type URLs.

> **Cross-check rule:** every entry created or changed here must be confirmed against **core Redmine's spent-time
> view** for the same user and issue. This plugin writes ordinary Redmine time entries; a tracker list that shows
> hours the core report does not — or vice versa — is the defect class this suite exists to catch.

---

## Functional Cases — The page

---

### TC-TMT-085: Time Tracker page renders

**User Role:** Member
**Steps:**
1. Open Time Tracker from the navigation.

**Expected Result:**
- The timer controls, the manual entry action (if enabled) and a scrollable list of current and previous entries
  are all present.

---

### TC-TMT-086: Entry list shows the user's own entries accurately

**User Role:** Member
**Steps:**
1. Compare the listed entries against core Redmine's spent-time report for the same user.

**Expected Result:**
- Same entries, same hours, same dates. Scrolling loads older entries without duplicating or skipping any.

---

## Functional Cases — Running the timer

---

### TC-TMT-087: Start the timer with all fields selected

**User Role:** Member with log-time rights
**Steps:**
1. Select Project, Issue, Tag and Activity; click **Start**.

**Expected Result:**
- The timer begins counting and a **Stop** button appears, per the KB.
- The elapsed display advances in real time.

---

### TC-TMT-088: Issue list is scoped to the selected project

**User Role:** Member
**Steps:**
1. Select a project and open the issue picker; change the project and re-check.

**Expected Result:**
- Only issues from the selected project are offered, and only those the user can see.
- An issue picker that lists issues from projects the user cannot access is a disclosure, not just a usability
  problem.

---

### TC-TMT-089: Start without an issue

**User Role:** Member
**Steps:**
1. Attempt to start with a project but no issue selected.

**Expected Result:**
- Behaviour is explicit — refused with a message, or started as project-level time if Redmine permits it on this
  instance. Record which.

---

### TC-TMT-090: Only one timer runs at a time

**User Role:** Member
**Steps:**
1. Start a timer, then attempt to start a second one against a different issue.

**Expected Result:**
- The second start is refused, or the first is stopped and saved first with a clear prompt.
- **Two concurrent timers for one user would produce overlapping time entries** — hours counted twice for the same
  wall-clock period, which corrupts every report built on them. Record precisely what happens.

---

### TC-TMT-091: Stop the timer and save the entry

**User Role:** Member
**Steps:**
1. Let the timer run a measurable interval; click **Stop**; enter a comment and any required custom fields;
   click **Stop** to save.

**Expected Result:**
- A time entry is created with **hours matching the elapsed interval**, on the right issue and activity.
- Confirm the duration against the observed elapsed time and against the core spent-time report — a timer that
  rounds or truncates silently is a defect worth quantifying.

---

### TC-TMT-092: Required comment and custom fields are enforced

**User Role:** Member
**Preconditions:** The instance requires a comment and has a required time-entry custom field.
**Steps:**
1. Stop the timer leaving each required field blank in turn.

**Expected Result:**
- Refused with a message naming the field — and **the elapsed time is not lost** while the user corrects it.
- Discarding the running total because a required field was missing would destroy real recorded work; this is the
  most likely place in the plugin for that to happen.

---

### TC-TMT-093: Cancel a stop

**User Role:** Member
**Steps:**
1. Click Stop, then dismiss the prompt without saving.

**Expected Result:**
- Behaviour is explicit: either the timer keeps running, or the entry is saved.
- It must not silently discard the elapsed time. Record which it does.

---

## Functional Cases — Location gating

---

### TC-TMT-094: Timer starts when location is granted

**User Role:** Member subject to the location requirement
**Steps:**
1. With **Require Location Permission** on, start the timer and grant browser location access.

**Expected Result:**
- The timer starts and a location is recorded against the session.

---

### TC-TMT-095: Timer does not start when location is denied

**User Role:** Member subject to the requirement
**Steps:**
1. Deny browser location access and attempt to start.

**Expected Result:**
- The timer does **not** start, per the KB, and the message explains that location access is required.
- A silent failure here is a defect in its own right: the user has no way to know why nothing happened, and the
  KB's own troubleshooting relies on them understanding it.

---

### TC-TMT-096: Stopping also requires location

**User Role:** Member subject to the requirement
**Steps:**
1. Start with location granted, then revoke it in the browser and click Stop.

**Expected Result:**
- The documented behaviour applies to stop as well as start — but the user must not be left with an unstoppable
  timer and unrecoverable hours (paired with TC-TMT-040).

---

### TC-TMT-097: Behaviour on an insecure origin

**User Role:** Member
**Steps:**
1. Access the instance over plain HTTP with the location requirement enabled and attempt to start.

**Expected Result:**
- The message distinguishes "the browser blocked geolocation" from "you denied access".
- Browsers refuse geolocation on insecure origins, so without a clear message an admin would waste a long time
  debugging a plugin that is behaving correctly.

---

## Functional Cases — Timer persistence

---

### TC-TMT-098: Timer survives navigation

**User Role:** Member
**Steps:**
1. Start a timer, navigate to another Redmine page, and return.

**Expected Result:**
- The timer is still running with the correct elapsed time.

---

### TC-TMT-099: Timer survives a page reload

**User Role:** Member
**Steps:**
1. Start a timer and hard-reload the page.

**Expected Result:**
- Still running, with elapsed time computed from the server-side start, not restarted from zero.

---

### TC-TMT-100: Timer survives closing the browser

**User Role:** Member
**Steps:**
1. Start a timer, close the browser entirely, wait, reopen and log back in.

**Expected Result:**
- The timer is still running and the elapsed time includes the closed period.
- The browser extension documentation states the timer runs in the background, which implies server-side state —
  a timer that only lives in the page would lose everything here.

---

### TC-TMT-101: Timer across session expiry

**User Role:** Member
**Steps:**
1. Start a timer, let the session expire, log back in and stop it.

**Expected Result:**
- Either the timer is recoverable and stoppable, or the elapsed work is preserved another way.
- Losing a long-running timer to a session timeout is a realistic daily scenario and would cost users real hours.

---

## Functional Cases — Inline editing

---

### TC-TMT-102: Edit each inline field

**User Role:** Member
**Steps:**
1. On an existing entry, edit in turn: comment, tag, activity, start time, end time and date; press Enter after
   each.
2. Reload.

**Expected Result:**
- All six documented fields are editable inline and all six persist, per FAQ Q5.
- Record a result per field; a single non-persisting field would be hidden by a blanket pass.

---

### TC-TMT-103: Editing start/end time recalculates the duration

**User Role:** Member
**Steps:**
1. Change the end time to extend the entry by an hour.

**Expected Result:**
- The recorded hours update to match, and the core spent-time report agrees.
- A duration that does not follow its own start and end times is an arithmetic defect that silently misreports
  logged work.

---

### TC-TMT-104: Cancel an inline edit

**User Role:** Member
**Steps:**
1. Begin editing a field, change the value, then click away or press Escape without pressing Enter.

**Expected Result:**
- The original value is retained. Confirm by reload — an inline editor that saves on blur while documenting
  Enter-to-save is a surprise that causes accidental edits.

---

### TC-TMT-105: Inline edits are journaled

**User Role:** Member
**Steps:**
1. Make an inline change and check the entry's history or the Activity view.

**Expected Result:**
- The change is recorded with actor and timestamp, as any time-entry edit would be.

---

## Functional Cases — Manual entry, duplication, deletion

---

### TC-TMT-106: Log time manually

**User Role:** Member
**Preconditions:** Manual entry enabled.
**Steps:**
1. **Manual Time Log** → project, issue, required fields, Start Time, End Time, Date → **Add**.

**Expected Result:**
- The entry is created with hours equal to the end-minus-start interval, and appears in core Redmine.

---

### TC-TMT-107: Manual entry validation

**User Role:** Member
**Steps:**
1. Enter an end time **before** the start time; then identical start and end times; then a 30-hour span.

**Expected Result:**
- Each is rejected with a clear message. A negative or zero-length entry must never be created, and a span
  exceeding 24 hours in a day is a clear sign of a mis-keyed entry.

---

### TC-TMT-108: Manual entry overlapping an existing entry

**User Role:** Member
**Steps:**
1. Create a manual entry whose time range overlaps one that already exists for the same user.

**Expected Result:**
- Record the behaviour. Overlap means the same wall-clock hour is billed twice; whether it is refused or allowed,
  it should at least be visible rather than silent.

---

### TC-TMT-109: Manual entry for a past date

**User Role:** Member
**Steps:**
1. Create a manual entry dated last week, and one dated next week.

**Expected Result:**
- Consistent with the instance's rules. If another plugin (Timesheet) restricts past-date logging, that
  restriction must apply here too — otherwise this plugin is a route around it.

---

### TC-TMT-110: Duplicate an entry

**User Role:** Member
**Steps:**
1. Context menu → **Duplicate** → confirm on an entry whose data differs from every other entry that day.

**Expected Result:**
- A second entry is created with the same values, and the day's total increases accordingly.

---

### TC-TMT-111: Duplicate that matches an existing same-day entry

**User Role:** Member
**Steps:**
1. Duplicate an entry so the result is identical to another entry on the same day.
2. Compare the day's total before and after, and check the core spent-time report.

**Expected Result:**
- The entries are **automatically combined**, per the KB.
- **Verify the combination is arithmetically correct** — the combined entry's hours must equal the sum of the two.
  Silently discarding one instead of adding them would lose logged work while appearing to behave as documented.

---

### TC-TMT-112: Duplicate preserves the tag and activity

**User Role:** Member
**Steps:**
1. Duplicate an entry with a tag and a non-default activity.

**Expected Result:**
- Both carry over to the duplicate.

---

### TC-TMT-113: Delete an entry

**User Role:** Member
**Steps:**
1. Context menu → **Delete** → confirm.

**Expected Result:**
- Removed from the list and from core Redmine's spent-time data; totals recalculate.

---

### TC-TMT-114: Cancel a deletion

**User Role:** Member
**Steps:**
1. Trigger the delete and cancel.

**Expected Result:**
- The entry still exists after a reload.

---

## Negative Cases

---

### TC-TMT-115: Script content in a comment

**User Role:** Member
**Steps:**
1. Save an entry whose comment contains a script tag; view it in the entry list, the Activity view, the reports,
   and each export format.

**Expected Result:**
- Escaped and rendered literally everywhere. **No script executes.**
- The Activity view matters most, since it renders one user's comments into every other viewer's screen.

---

### TC-TMT-116: Editing another user's entry

**User Role:** Member
**Steps:**
1. Attempt to edit and delete another user's entry through the UI and by sending the requests directly.

**Expected Result:**
- Refused at both legs unless the role explicitly permits it. Altering a colleague's recorded hours is a
  High-severity integrity defect.

---

### TC-TMT-117: Concurrent edits from two sessions

**User Role:** Member in two browsers
**Steps:**
1. Edit the same entry's comment in one session and its duration in the other, without reloading.

**Expected Result:**
- No lost update, or a clear stale-state message.

---

### TC-TMT-118: Timer against an issue that is deleted mid-run

**User Role:** Member + Manager
**Steps:**
1. Start a timer on an issue; have the issue deleted; then stop the timer.

**Expected Result:**
- Handled cleanly with a clear message. **The elapsed time is not silently discarded** — ideally it can still be
  saved against the project. Not a 500.

---

### TC-TMT-119: Timer against a closed or archived project

**User Role:** Member
**Steps:**
1. Attempt to start a timer in a closed project, then an archived one, via the UI and directly.
2. Also archive a project while a timer against it is running, then stop.

**Expected Result:**
- Starting is refused consistently with Redmine's own semantics, enforced at the endpoint.
- The running-timer case resolves without trapping the user or losing the elapsed time.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
