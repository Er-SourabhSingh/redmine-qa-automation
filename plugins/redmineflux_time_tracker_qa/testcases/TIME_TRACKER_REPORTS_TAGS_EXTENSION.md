# Test Cases — Redmineflux Time Tracker — Reports, Tags & Browser Extension

> Source: vendor KB — "Reports in the Time Tracker Plugin" (Summary, Detailed, Weekly),
> "Managing Tags in the Time Tracker Plugin", "How to Use the Time Tracker Browser Extension", FAQ Q7, Q8.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Time Tracker Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_time_tracker_qa

## Navigation methodology

Time Tracker → **Reports** and **Tags** in the sidebar. The extension is exercised from the browser toolbar.

> **Correctness rule for the reports:** every figure is a claim about hours people worked and may be billed from.
> Cross-check totals against the entry list and against core Redmine's spent-time report. A number that looks
> plausible but is wrong is worse than an obvious error, because nobody questions it.

---

## Functional Cases — Summary Report

---

### TC-TMT-057: Summary Report groups by Project, User and Activity

**User Role:** Member with **View Time Tracker Reports**
**Priority:** Medium
**Steps:**
1. Run the Summary Report grouped by Project, then by User, then by Activity.

**Expected Result:**
- Each grouping renders with a chart and correct per-group totals.
- **The grand total is identical across all three groupings.** A total that changes with the grouping means rows
  are being double-counted or dropped — the cheapest possible detection of an arithmetic defect.

---

### TC-TMT-058: Summary totals reconcile with source data

**User Role:** Member with the permission
**Priority:** High
**Steps:**
1. For one project and period, compare the Summary total with the entry list and core Redmine's spent-time report.

**Expected Result:**
- All three agree exactly.

---

### TC-TMT-059: Charts match the tabular data

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Compare each chart segment against the corresponding row.

**Expected Result:**
- Proportions and labels match the numbers. A chart that disagrees with its own table is a defect, and it is the
  half people actually look at.

---

### TC-TMT-060: Export to PDF, CSV and XML

**User Role:** Member with the permission
**Priority:** High
**Steps:**
1. Export the same Summary Report in each of the three documented formats.

**Expected Result:**
- All three export successfully and contain the **same data and totals** as the screen.
- **No format truncates to the first page.** A partial export is High severity, since these files are what leave
  the system and get used downstream.

---

### TC-TMT-061: Export formatting integrity

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Export data containing commas, quotes, newlines in comments, and non-Latin characters.

**Expected Result:**
- CSV fields are correctly quoted and escaped so columns stay aligned; XML is well-formed and parses; the PDF
  renders the characters rather than showing placeholders.
- Also confirm a comment beginning with `=`, `+` or `-` cannot execute as a formula when the CSV is opened in a
  spreadsheet — a user-supplied comment is the injection vector.

---

## Functional Cases — Detailed and Weekly Reports

---

### TC-TMT-062: Detailed Report

**User Role:** Member with the permission
**Priority:** Medium
**Steps:**
1. Open the Detailed Report and filter by project, user and activity, individually and combined.

**Expected Result:**
- Rows show full entry detail; each filter narrows correctly and combinations intersect.
- Row-level values match the entries they represent.

---

### TC-TMT-063: Weekly Report

**User Role:** Member with the permission
**Priority:** Medium
**Steps:**
1. Open the Weekly Report and filter by user and project; check a week spanning a month boundary.

**Expected Result:**
- Weekly totals equal the sum of that week's entries, and a week crossing a month end is attributed to one week
  only, without double counting.

---

### TC-TMT-064: Reports with no matching data

**User Role:** Member
**Priority:** Low
**Steps:**
1. Run each report with filters matching nothing, and export the result.

**Expected Result:**
- A clean empty state and valid empty exports with headers — not an error, and not a file containing unfiltered
  data.

---

### TC-TMT-065: Large report volume

**User Role:** Member
**Priority:** Low
**Steps:**
1. Run the Detailed Report across a year for the whole instance, then export it.

**Expected Result:**
- Completes without timeout and the export contains every row. Record the row count and duration.

---

## Functional Cases — Tags

---

### TC-TMT-066: Create a tag

**User Role:** Member with **Manage Time Tracker Tags**
**Priority:** Medium
**Steps:**
1. Tags section → enter a name → **Add**.

**Expected Result:**
- The tag is created and becomes selectable on the timer and on entries.

---

### TC-TMT-067: Edit a tag

**User Role:** Member with the permission
**Priority:** Medium
**Steps:**
1. Rename a tag that is in use on several entries.

**Expected Result:**
- The new name appears on all of those entries, and the association is preserved — no entry loses its tag.

---

### TC-TMT-068: Delete an unused tag

**User Role:** Member with the permission
**Priority:** Low
**Steps:**
1. Delete a tag with no entries against it.

**Expected Result:**
- Removed from the list and from the timer's tag picker.

---

### TC-TMT-069: Delete a tag that is in use

**User Role:** Member with the permission
**Priority:** Medium
**Steps:**
1. Delete a tag attached to several entries; then open those entries.

**Expected Result:**
- The consequence is stated before the deletion, and afterwards the entries themselves survive intact with only
  the tag removed.
- **The time entries must not be deleted with the tag.** Any loss of logged hours here is Critical.

---

### TC-TMT-070: Used / Unused filter

**User Role:** Member
**Priority:** Low
**Steps:**
1. Filter the tag list by **Used**, then by **Unused**.

**Expected Result:**
- Each returns exactly the right set, and the two are disjoint and together equal the full list.
- Attaching a tag to an entry moves it from Unused to Used on the next load.

---

### TC-TMT-071: Duplicate tag names

**User Role:** Member with the permission
**Priority:** Low
**Steps:**
1. Create two tags with the same name.

**Expected Result:**
- Either rejected, or both distinguishable. Two identical entries in the timer's tag picker make correct tagging
  impossible.

---

### TC-TMT-072: Tag name validation

**User Role:** Member with the permission
**Priority:** High
**Steps:**
1. Create tags with a blank name, a whitespace-only name, a 500-character name, and one containing a script tag.

**Expected Result:**
- Blank and whitespace-only are rejected. Long names are capped or truncated without breaking the layout.
- **Script content is escaped everywhere the tag renders** — entry list, calendar, activity view, reports and
  exports. No script executes.

---

### TC-TMT-073: Tag management requires the permission

**User Role:** Member **without** Manage Time Tracker Tags
**Priority:** High
**Steps:**
1. Confirm no create/edit/delete controls are offered.
2. Send tag create, edit and delete requests **directly**.

**Expected Result:**
- All refused with 403.
- Tags are shared vocabulary across every user's entries — an unenforced delete endpoint would let any user strip
  tags from the whole instance's time records.

---

## Functional Cases — Browser extension

---

### TC-TMT-074: Configure the extension

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Open the extension, enter the **Base URL** and **API Key**, click **Test Connection**, then **Save Settings**.

**Expected Result:**
- Test Connection reports success and the settings save.

---

### TC-TMT-075: Test Connection fails clearly on bad input

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Test with: a wrong Base URL, a valid URL with an invalid API key, and an unreachable host.

**Expected Result:**
- Each failure is distinguishable and actionable — "cannot reach the server" versus "the key was rejected".
  A single generic failure message makes the setup step unusable.

---

### TC-TMT-076: Start the timer from the extension

**User Role:** Member
**Priority:** High
**Steps:**
1. Select a project in the extension and click **Start**; then open the Time Tracker page in Redmine.

**Expected Result:**
- The same running timer is visible in the web UI — one timer, one source of truth, not two independent ones.

---

### TC-TMT-077: Timer runs with the extension closed

**User Role:** Member
**Priority:** High
**Steps:**
1. Start from the extension, close the extension popup, wait, reopen it.

**Expected Result:**
- The timer is still running with the correct elapsed time, per the KB's statement that it runs in the background.

---

### TC-TMT-078: Stop from the extension records the entry

**User Role:** Member
**Priority:** High
**Steps:**
1. Reopen the extension and click **Stop**; check the Time Tracker page and core Redmine.

**Expected Result:**
- A time entry is saved with the correct duration, project and user.

---

### TC-TMT-079: Extension and web UI act on the same timer

**User Role:** Member
**Priority:** High
**Steps:**
1. Start a timer in the **web UI**, then stop it from the **extension**.
2. Then start from the extension and stop in the web UI.
3. Then start in the web UI and attempt to start a second timer from the extension.

**Expected Result:**
- Both surfaces control one shared timer in both directions.
- The second start is refused or stops the first — **two concurrent timers would produce overlapping entries and
  double-count the same wall-clock hours** (paired with TC-TMT-090). This is the most likely real defect in the
  extension integration, because the two clients are easy to build independently.

---

### TC-TMT-080: Extension respects required fields

**User Role:** Member
**Priority:** Medium
**Preconditions:** The instance requires a comment or a custom field on time entries.
**Steps:**
1. Stop a timer from the extension.

**Expected Result:**
- Either the extension prompts for the required values, or the entry is held for completion in the web UI with a
  clear message.
- **It must not silently create an entry that violates the instance's validation**, and it must not discard the
  elapsed time because it cannot collect a required field.

---

### TC-TMT-081: Extension API key scope

**User Role:** Member
**Priority:** High
**Steps:**
1. Configure the extension with user A's API key and confirm entries are attributed to A.
2. Attempt to start a timer against a project A cannot access.

**Expected Result:**
- Entries are attributed to the key's owner, and inaccessible projects are neither offered nor accepted.
- The API key is a full credential — confirm the extension stores it locally and does not expose it in any page,
  log or network request to a third party.

---

## Negative Cases

---

### TC-TMT-082: Reports require View Time Tracker Reports

**User Role:** Member without the permission
**Priority:** High
**Steps:**
1. Confirm the Reports section is not offered.
2. Request each report URL directly.
3. Request each **export** endpoint (PDF, CSV, XML) directly.

**Expected Result:**
- All refused with 403.
- **Test the export endpoints separately from the report views.** Permission checks are commonly written against
  the HTML action and omitted on the export, which would hand any member a full extract of the instance's time
  data (FAQ Q8 states reports are permission-gated, so an open export contradicts the documentation).

---

### TC-TMT-083: Reports respect per-user visibility

**User Role:** Member with report access but without permission to view others' time entries
**Priority:** High
**Steps:**
1. Run each report and check whose data appears; then export.

**Expected Result:**
- Only permitted data is included, in the screen **and** in the exports.
- A report that aggregates colleagues' hours for a user who cannot see them individually is still a disclosure.

---

### TC-TMT-084: Reports respect project visibility

**User Role:** Member of project A only
**Priority:** High
**Preconditions:** **Confirm project B is genuinely private.**
**Steps:**
1. Run each report and attempt to filter to project B.

**Expected Result:**
- No project B data appears and the filter cannot reach it.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
