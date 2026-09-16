# Test Cases — Redmineflux Time Tracker — Permissions & Access Control

> Source: vendor KB — "Roles and Permissions" (View Time Tracker Activity, View Time Tracker Reports,
> Manage Time Tracker Tags) and the Troubleshooting checklist, which also names "View others' time entries".
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Time Tracker Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_time_tracker_qa

## The access model under test

The KB names three plugin permissions:

| Permission | What it covers |
|---|---|
| **View Time Tracker Activity** | Access the activity module |
| **View Time Tracker Reports** | Access all reports in the plugin |
| **Manage Time Tracker Tags** | Create, edit and delete tags |

Plus core Redmine's **View others' time entries**, which the Troubleshooting section tells administrators to check.

**The significant gap: no permission is listed for running the timer or logging time itself.** Presumably that
follows Redmine's own *Log spent time* permission — but the KB never says so, and that assumption needs confirming
(TC-TMT-921). If the plugin gates time logging on nothing more than project membership, then a role deliberately
denied *Log spent time* in core Redmine could still record hours through the tracker, which is a real bypass.

The second thing that makes this plugin's permission testing unusual: **location data**. The map plots where people
physically were. Who can see it is a privacy question, and a leak there is High severity rather than a routine
permission gap.

## Methodology — mandatory for every case

1. **Positive UI** — the permitted role reaches the function through real navigation and it works.
2. **Negative UI** — the denied role sees no control.
3. **Negative endpoint** — the denied role is refused when the request is sent **directly**, including the
   **export endpoints** (PDF / CSV / XML) and the **map data** endpoint, which are the two most likely to be
   unguarded.

---

## Permissions matrix to establish

| Action | Admin | Manager | Developer | QA | Reporter | Non-member | Anonymous |
|--------|-------|---------|-----------|-----|----------|------------|-----------|
| Open Time Tracker | | | | | | | |
| Start / stop the timer | | | | | | | |
| Log time manually | | | | | | | |
| Edit own entries | | | | | | | |
| Edit others' entries | | | | | | | |
| View Activity | | | | | | | |
| See others' locations on the map | | | | | | | |
| View Reports | | | | | | | |
| Export reports (PDF/CSV/XML) | | | | | | | |
| Manage Tags | | | | | | | |
| Change plugin configuration | | | | | | | |

Fill in from observed behaviour. Record, per row, whether the UI and the endpoint agree — a disagreement is a bug,
not a matrix entry.

---

## Functional Cases

---

### TC-TMT-911: Admin has full access

**User Role:** Admin
**Steps:**
1. Exercise every row of the matrix.

**Expected Result:**
- All actions succeed, including plugin configuration.

---

### TC-TMT-912: View Time Tracker Activity gates the activity module

**User Role:** Member without the permission
**Steps:**
1. Confirm the Activity tab is not offered.
2. Request the activity URL, its data endpoint, and the **map data** endpoint directly.

**Expected Result:**
- All three refused with 403.
- The map endpoint matters most: it carries location coordinates, and it is the one a developer is most likely to
  leave ungated because it is a secondary data call rather than a page.

---

### TC-TMT-913: View Time Tracker Reports gates reports **and exports**

**User Role:** Member without the permission
**Steps:**
1. Confirm the Reports section is not offered.
2. Request each report URL directly.
3. Request each export endpoint — PDF, CSV and XML — directly.

**Expected Result:**
- All refused with 403.
- **Leg 3 is the decisive one.** An open export endpoint would let any member pull a complete extract of the
  instance's time data in a single request, and it would never show up in UI testing (paired with TC-TMT-901).

---

### TC-TMT-914: Manage Time Tracker Tags gates tag management

**User Role:** Member without the permission
**Steps:**
1. Confirm no tag create/edit/delete controls.
2. Send tag create, edit and delete requests directly.
3. Confirm the user can still **select** existing tags when running the timer.

**Expected Result:**
- Management refused at the endpoint; using existing tags still works.
- Managing and consuming tags are different capabilities — a user who cannot create tags should still be able to
  tag their own time.

---

### TC-TMT-915: Others' time entries are gated by the core permission

**User Role:** Member without core **View others' time entries**
**Steps:**
1. Confirm the entry list and calendar show only their own entries.
2. Request another user's entries directly, and check the Activity view's payload.

**Expected Result:**
- Only their own data, in the rendered views **and** in the underlying responses.
- The KB's own troubleshooting names this permission, so it is expected to be honoured here; a plugin view that
  ignores it becomes a route around a core Redmine restriction.

---

### TC-TMT-916: Editing others' entries is refused

**User Role:** Member
**Steps:**
1. Attempt to edit, duplicate and delete another user's entry — through the list, through the calendar, and by
   sending each request directly.

**Expected Result:**
- Refused on all paths.
- The **calendar** is the easiest path to forget, because its drag-and-drop writes go through a different endpoint
  from the list's inline edits. Altering a colleague's recorded hours is a High-severity integrity defect.

---

### TC-TMT-917: Location data is not exposed to other users

**User Role:** Member without View Time Tracker Activity, and a member with it but without others'-entries rights
**Steps:**
1. For each, open any view that could carry location data and inspect the **response payloads**.

**Expected Result:**
- No coordinates belonging to other users appear in any payload.
- **Treat any exposure here as High severity.** This is employee location history; unlike an hours total, it
  cannot be un-disclosed, and a client-side-filtered map leaks it completely while looking correct
  (paired with TC-TMT-508).

---

### TC-TMT-918: Non-member cannot access a private project's data

**User Role:** Authenticated non-member
**Preconditions:** **Confirm the project is genuinely private** — a newly created Redmine project has "Public"
checked by default; uncheck it explicitly or this case falsely passes.
**Steps:**
1. Request the activity, report, export and map endpoints scoped to that project directly.
2. Attempt to start a timer against one of its issues.

**Expected Result:**
- All refused, with no issue subjects, user names, hours or coordinates in any response body.

---

### TC-TMT-919: Anonymous has no access

**User Role:** Anonymous (logged out)
**Steps:**
1. Request the Time Tracker page, the timer start endpoint, the report exports and the map data with no session.

**Expected Result:**
- Redirect to login or 403 for all. An anonymous timer-start endpoint would let an unauthenticated caller write
  time entries — Critical.

---

### TC-TMT-920: The browser extension's API key confers no extra authority

**User Role:** Member
**Steps:**
1. Using the extension's API key directly against the plugin's endpoints, attempt an action the same user is
   refused in the web UI — editing another user's entry, or starting a timer in an inaccessible project.

**Expected Result:**
- Refused identically.
- An API key is a convenience credential for the same user, not an elevation. A key-authenticated path that
  bypasses the UI's checks would be Critical, and the extension makes such a path routinely available.

---

### TC-TMT-921: Establish what gates time logging itself

**User Role:** A role with core **Log spent time** removed
**Steps:**
1. Attempt to start the timer, stop it, and create a manual entry — through the UI and directly.

**Expected Result:**
- Refused, consistent with core Redmine's own restriction.
- **This is the KB's undocumented gap.** If the plugin lets a user record time that core Redmine would refuse, the
  tracker is a bypass of a deliberate policy decision, and the finding belongs in both the bug report and the
  plugin memory file regardless of the plugin's intent.

---

### TC-TMT-922: Permission revocation takes effect without re-login

**User Role:** Admin + affected member
**Steps:**
1. Remove a permission while the member has the Time Tracker page open with a timer running.
2. Have them stop the timer and attempt a report export without logging out.

**Expected Result:**
- Refused where appropriate and evaluated per request.
- The user must still be able to **stop their timer and preserve the elapsed work** — revoking a reporting
  permission should not strand someone with an unstoppable timer (paired with TC-TMT-116).

---

### TC-TMT-923: Closed and archived projects

**User Role:** Member
**Steps:**
1. Close a project: attempt to start a timer, log manually, and edit an existing entry, at the UI and the endpoint.
2. Archive it and repeat; also check whether its entries still appear in the Activity view and reports.

**Expected Result:**
- Closed projects behave read-only; archived projects are inaccessible, endpoints included.
- An archived project's entries still appearing in the activity view or reports is a defect — archiving is
  expected to remove them from view.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
