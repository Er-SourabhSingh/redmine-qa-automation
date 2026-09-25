# Test Cases — Redmineflux Notification — In-App Notifications & History

> Source: vendor KB — "Redmine Notification Configuration", "How to View Notification Plugin",
> "How to Test Notification Settings", "How to View Notification History",
> Troubleshooting ("Notifications Are Not Showing"), FAQ Q5, Q6.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Notification Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_notification_qa

## Test accounts required

- **Actor** — makes the changes.
- **Watcher** — watches the issue, notifications enabled.
- **Notified user** — assignee or otherwise notified, notifications enabled.
- **Uninvolved member** — notifications enabled but neither watcher nor notified.

> **Do not test with one account.** The plugin never notifies the person who made the change, so a single-account
> run produces no notifications at all and looks exactly like a broken plugin. Every case below drives the change
> as **Actor** and observes as someone else.

---

## Functional Cases — Events

---

### TC-NTF-017: Issue added

**User Role:** Actor creates, Watcher observes
**Priority:** High
**Preconditions:** **Issue added** enabled in plugin settings.
**Steps:**
1. Actor creates an issue with Watcher as assignee or watcher.

**Expected Result:**
- The recipient gets a notification identifying the issue and the author, and the bell shows a red dot.

---

### TC-NTF-018: Issue updated

**User Role:** Actor updates, Watcher observes
**Priority:** High
**Steps:**
1. Actor edits the issue's description.

**Expected Result:**
- The recipient is notified of the update.

---

### TC-NTF-019: Issue note added

**User Role:** Actor adds a note
**Priority:** High
**Steps:**
1. Actor adds a note to a watched issue.

**Expected Result:**
- The recipient is notified, and the notification is distinguishable from a plain field update.

---

### TC-NTF-020: Issue status updated

**User Role:** Actor changes status
**Priority:** High
**Steps:**
1. Actor changes only the status.

**Expected Result:**
- The recipient is notified and the notification reflects a status change specifically.

---

### TC-NTF-021: Issue assigned

**User Role:** Actor reassigns
**Priority:** High
**Steps:**
1. Actor assigns the issue to the Notified user.

**Expected Result:**
- The **new assignee** is notified. Confirm they are notified even if they were not previously a watcher —
  becoming the assignee is the event.

---

### TC-NTF-022: Issue priority updated

**User Role:** Actor changes priority
**Priority:** Medium
**Steps:**
1. Actor changes only the priority.

**Expected Result:**
- The recipient is notified.

---

### TC-NTF-023: Issue target version updated

**User Role:** Actor changes target version
**Priority:** Medium
**Steps:**
1. Actor changes only the target version.

**Expected Result:**
- The recipient is notified.
- All seven documented events must be verified individually; a blanket "notifications work" result would hide one
  event that never fires.

---

## Functional Cases — Recipients

---

### TC-NTF-024: The actor is never notified of their own change

**User Role:** Actor
**Priority:** High
**Steps:**
1. Actor, who is also a watcher of the issue, makes each kind of change.

**Expected Result:**
- The Actor receives **no** notification for any of their own actions, per the KB and FAQ Q6.
- This is documented behaviour, not a defect. Verify it deliberately so that later "missing notification" reports
  can be triaged correctly rather than being filed against the plugin.

---

### TC-NTF-025: Watchers are notified

**User Role:** Actor + Watcher
**Priority:** High
**Steps:**
1. Add Watcher as a watcher only (not assignee); Actor makes a change.

**Expected Result:**
- Watcher is notified.

---

### TC-NTF-026: Uninvolved members are not notified

**User Role:** Uninvolved member
**Priority:** High
**Steps:**
1. With notifications enabled but no relationship to the issue, observe after a change.

**Expected Result:**
- No notification. The plugin notifies **notified users and watchers**, not everyone in the project — indiscriminate
  notification would make the feature unusable within days.

---

## Functional Cases — Per-user opt-in and the bell

---

### TC-NTF-027: Enabling notifications reveals the bell icon

**User Role:** Member
**Priority:** High
**Steps:**
1. My Account → Preferences → tick **Notifications** → Save.

**Expected Result:**
- A bell icon appears in the top-right near the username, per the KB.

---

### TC-NTF-028: Disabling notifications hides the bell and stops delivery

**User Role:** Member
**Priority:** High
**Steps:**
1. Untick the preference and Save; have the Actor make a change on a watched issue.

**Expected Result:**
- The bell disappears and no new notification is created for that user.
- **Record whether previously stored notifications survive** and return when the preference is re-enabled —
  silently deleting a user's history because they toggled a preference would be a data-loss defect.

---

### TC-NTF-029: The preference is per user

**User Role:** Two members
**Priority:** Medium
**Steps:**
1. One enables the preference, the other does not; the Actor makes a change affecting both.

**Expected Result:**
- Only the opted-in user receives a notification; the other is unaffected.

---

### TC-NTF-030: The red dot appears for unread notifications

**User Role:** Watcher
**Priority:** Medium
**Steps:**
1. Receive a new notification and observe the bell.

**Expected Result:**
- A red dot appears next to the icon, per the KB.

---

### TC-NTF-031: The red dot clears once notifications are viewed

**User Role:** Watcher
**Priority:** Medium
**Steps:**
1. View the notifications, then re-check the bell.

**Expected Result:**
- The dot disappears and does not reappear on reload without a new notification.
- A dot that never clears makes the indicator worthless; one that clears without the user seeing anything means
  notifications are silently marked read.

---

## Functional Cases — History

---

### TC-NTF-032: See All Notifications opens the history

**User Role:** Member
**Priority:** High
**Steps:**
1. Click the bell → **See All Notifications**.

**Expected Result:**
- The history page lists notifications with their issue, actor and timestamp, newest first.

---

### TC-NTF-033: New Notifications filter

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Apply the **New Notifications** filter and click **Filter**.

**Expected Result:**
- Only unread notifications are listed, and the count matches the unread indicator.

---

### TC-NTF-034: Viewed Notifications filter

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Apply the **Viewed Notifications** filter.

**Expected Result:**
- Only already-viewed notifications are listed.
- New and Viewed are disjoint and together equal the unfiltered list — a notification appearing in both, or in
  neither, indicates a state the page does not model.

---

### TC-NTF-035: History persists across sessions

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Log out and back in, then reopen the history.

**Expected Result:**
- Previously received notifications are still listed. Storage is server-side, not per browser.

---

### TC-NTF-036: Mark all as seen

**User Role:** Member
**Priority:** Medium
**Steps:**
1. With several unread notifications, click **Mark all as seen**.

**Expected Result:**
- All move to Viewed, the red dot clears, and **nothing is deleted** — they remain visible under the Viewed filter.

---

### TC-NTF-037: Opening a notification marks it viewed and redirects

**User Role:** Member
**Priority:** High
**Steps:**
1. Click an individual notification.

**Expected Result:**
- The user is redirected to the **related issue** and the notification is marked viewed, per the KB.
- The destination is the correct issue — a redirect to the wrong issue, or to a generic list, defeats the purpose.

---

## Negative Cases

---

### TC-NTF-038: Notifications for an issue the recipient can no longer see

**User Role:** Watcher whose project access is then removed
**Priority:** High
**Preconditions:** **Confirm the project is genuinely private** — a newly created Redmine project has "Public"
checked by default; uncheck it explicitly or this case falsely passes.
**Steps:**
1. Watcher receives notifications for issues in project P.
2. Remove their membership of P.
3. Open the notification history and attempt to open one of those notifications.

**Expected Result:**
- The notification either disappears or reveals **no issue subject or content**, and following it gives 403.
- **A notification list is a cached copy of issue titles.** If it keeps displaying subjects from a project the
  user has lost access to, it becomes a persistent leak that survives the permission change — a realistic defect,
  because the history is rendered from the plugin's own table rather than from the issue.

---

### TC-NTF-039: Notification content respects private notes

**User Role:** Watcher without permission to view private notes
**Priority:** High
**Steps:**
1. Actor adds a **private** note to a watched issue.

**Expected Result:**
- Either no notification, or a notification containing **none of the private note's text**.
- Showing a private note's content in a notification list would expose it to exactly the users it was hidden from.

---

### TC-NTF-040: Private issues

**User Role:** Member without access to a private issue
**Priority:** High
**Steps:**
1. Actor creates and updates a private issue.

**Expected Result:**
- No notification, and no issue subject anywhere in the recipient's history.

---

### TC-NTF-041: Script content in an issue subject or note

**User Role:** Actor
**Priority:** High
**Steps:**
1. Create an issue whose subject contains a script tag and add a note containing one; observe the recipient's
   bell dropdown, history page and desktop notification.

**Expected Result:**
- Escaped and rendered literally in all three. **No script executes.**
- The notification dropdown renders content authored by another user into every recipient's page, which makes it a
  genuine stored-XSS surface — and one that reaches users who never opened the issue.

---

### TC-NTF-042: Very high notification volume

**User Role:** Member
**Priority:** Low
**Steps:**
1. Generate several hundred notifications for one user, then open the bell dropdown and the history page.

**Expected Result:**
- The dropdown shows a bounded recent set; the history paginates. Neither hangs the browser.
- Record the load time and whether the unread count remains accurate at volume.

---

### TC-NTF-043: Bulk issue updates

**User Role:** Actor
**Priority:** Medium
**Steps:**
1. Bulk-edit 20 watched issues in one action.

**Expected Result:**
- Notifications are generated correctly and the save completes promptly.
- Record whether the recipient gets 20 separate notifications; that is defensible, but if the write blocks while
  they are created, bulk editing becomes slow for everyone — a performance finding worth quantifying.

---

### TC-NTF-044: Notification after the issue is deleted

**User Role:** Actor + Watcher
**Priority:** Medium
**Steps:**
1. Generate a notification, then delete the issue, then open the notification.

**Expected Result:**
- A clean "no longer available" outcome rather than a 500, and the stale entry does not break the history page.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
