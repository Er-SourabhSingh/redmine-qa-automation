# Test Cases — Redmineflux Notification — Project Settings & Access Control

> Source: vendor KB — "Project-Wise Notification Settings", "How to Disable Notifications for a Project",
> FAQ Q12; plus the fact that the KB publishes **no** plugin permission, so the access model must be established
> empirically.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Notification Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_notification_qa

## Methodology — mandatory for every case

1. **Positive UI** — the permitted user reaches the function through real navigation and it works.
2. **Negative UI** — the denied user sees no control.
3. **Negative endpoint** — the denied user is refused when the request is sent **directly**.

For this plugin there is a fourth question that matters as much as the first three:

4. **What is actually delivered?** A notification, a Teams card or a Slack message is a *copy* of issue content
   that travels outside the issue's own access control. Checking who can open a page is not enough; check what
   arrives in each recipient's bell, mailbox and channel.

---

## Permissions matrix to establish

| Action | Admin | Manager | Developer | QA | Reporter | Non-member | Anonymous |
|--------|-------|---------|-----------|-----|----------|------------|-----------|
| Enable notifications in own preferences | | | | | | | |
| View own notification history | | | | | | | |
| Receive notifications for a private project | | | | | | | |
| Enable the Teams / Slack project modules | | | | | | | |
| Set a project Teams webhook | | | | | | | |
| Set a project Slack channel | | | | | | | |
| Enable **Disable notifications** for a project | | | | | | | |
| Change plugin configuration | | | | | | | |

The three rows in the middle are the ones with real consequences: whoever holds them controls **where a project's
issue activity is sent**.

---

## Functional Cases — Disable notifications for a project

---

### TC-NTF-045: Disable notifications for a project

**User Role:** Manager
**Steps:**
1. Project → **Settings** → the **Notifications** section → enable **Disable notifications** → Save.

**Expected Result:**
- The setting persists.

---

### TC-NTF-046: Both in-app notifications and email are suppressed

**User Role:** Manager then two members
**Steps:**
1. With the setting enabled, trigger every notification event in that project.
2. Check the recipient's bell and notification history.
3. Check the recipient's **mailbox** for Redmine's own issue notification emails.

**Expected Result:**
- No in-app notifications **and no emails** — the KB states the switch skips both.
- **Verify the email half explicitly.** It is broader than the control's name suggests: a manager silencing a
  noisy project may not realise Redmine's own mail has stopped too, and if it has not, the documentation is wrong.

---

### TC-NTF-047: Other projects are unaffected

**User Role:** Member
**Steps:**
1. With project A silenced, trigger events in project B.

**Expected Result:**
- Project B's notifications and emails arrive normally. The setting is strictly per project.

---

### TC-NTF-048: Re-enabling restores delivery

**User Role:** Manager then Member
**Steps:**
1. Disable the setting and trigger an event.

**Expected Result:**
- Notifications and email resume immediately, with no restart required.

---

### TC-NTF-049: Existing notifications are not deleted

**User Role:** Member
**Steps:**
1. With notifications already in a user's history for project A, silence project A and reload the history.

**Expected Result:**
- Previously received notifications remain visible.
- Silencing future delivery must not retroactively erase history — that would be data loss disguised as a setting.

---

### TC-NTF-050: The switch overrides every delivery path

**User Role:** Manager then Member
**Preconditions:** The project has a Teams webhook, a Slack channel, and Faye running.
**Steps:**
1. Enable **Disable notifications** and trigger events.
2. Check the bell, email, the Teams channel, the Slack channel, and real-time delivery.

**Expected Result:**
- **Nothing is delivered on any of the five paths.**
- This is the case that establishes whether the switch is a true kill switch or only covers the two paths its name
  mentions. A project deliberately silenced that still posts to Slack is a defect with an external audience
  (paired with TC-NTF-123 and TC-NTF-101).

---

## Functional Cases — Project settings access

---

### TC-NTF-051: Project modules gate the integration settings

**User Role:** Manager
**Steps:**
1. With the Teams and Slack project modules disabled, confirm neither settings section appears.
2. Enable each module and confirm its section appears.
3. With a module disabled but a webhook previously configured, trigger a notification.

**Expected Result:**
- The sections follow their modules.
- Step 3 matters: disabling the module must also **stop delivery**, not merely hide the settings. A hidden webhook
  that keeps posting is worse than a visible one, because there is no longer any UI showing where the data goes.

---

## Negative Cases — access control

---

### TC-NTF-052: Only admins can change plugin configuration

**User Role:** Manager, Developer, QA, Reporter (each in turn)
**Steps:**
1. Request the plugin configuration URL directly.
2. Attempt to post changes to the event list, the Faye address, the Teams webhook and the Slack token.

**Expected Result:**
- All refused with 403.
- **The Slack bot token and the Teams webhook URLs are credentials.** A non-admin who can read or change them can
  post into the organisation's channels from outside Redmine entirely, or redirect every project's activity
  elsewhere. High severity (paired with TC-NTF-010).

---

### TC-NTF-053: Project integration settings require project-admin rights

**User Role:** Developer, QA, Reporter (each in turn)
**Steps:**
1. Confirm the Teams and Slack settings sections and the Notifications section are not offered.
2. Request the project settings URLs directly.
3. Send webhook-change, channel-change and disable-notifications requests directly.

**Expected Result:**
- All refused with 403.
- Two distinct risks here: a member who can **set a webhook** redirects the project's issue activity to a channel
  of their choosing, and a member who can **enable Disable notifications** silently stops the whole team being
  told about anything. Both are High severity.

---

### TC-NTF-054: Notifications respect issue visibility

**User Role:** A member who can see the project but not certain issues
**Preconditions:** A role with issue visibility limited to their own issues, or private issues present.
**Steps:**
1. Have another user create and update issues the recipient cannot see.
2. Inspect the recipient's bell, history and desktop notifications.

**Expected Result:**
- No notification, and **no issue subject** anywhere in their history.
- A notification list stores its own copy of the subject, so the visibility check has to be applied when the
  notification is created **and** when the list is rendered. Missing either is a leak.

---

### TC-NTF-055: Notifications respect project membership changes

**User Role:** A member removed from a project after receiving notifications
**Preconditions:** **Confirm the project is genuinely private** — a newly created Redmine project has "Public"
checked by default; uncheck it explicitly or this case falsely passes.
**Steps:**
1. Remove the user's membership, then open their notification history and click an old notification.

**Expected Result:**
- Historic subjects from the now-inaccessible project are no longer displayed, and following one gives 403
  (paired with TC-NTF-038).

---

### TC-NTF-056: Non-members receive nothing

**User Role:** Authenticated non-member
**Steps:**
1. Trigger every event in a private project and check the non-member's bell and history.
2. Request the notification history endpoint directly and inspect the payload.

**Expected Result:**
- Nothing delivered and nothing in the payload.

---

### TC-NTF-057: Anonymous users have no access

**User Role:** Anonymous (logged out)
**Steps:**
1. Request the notification history page, its data endpoint, and the mark-as-seen endpoint with no session.

**Expected Result:**
- Redirect to login or 403 for all three.

---

### TC-NTF-058: One user cannot read another's notifications

**User Role:** Member
**Steps:**
1. Request the notification history endpoint with another user's identifier, and attempt to mark another user's
   notification as seen.

**Expected Result:**
- Both refused.
- The notification list is inherently per user; an endpoint that accepts a user parameter without authorising it
  would expose one person's entire activity feed to another. Test it explicitly rather than assuming the
  identifier is taken from the session.

---

### TC-NTF-059: Permission revocation takes effect without re-login

**User Role:** Admin + affected member
**Steps:**
1. Remove a member's project access while they have the notification history open.
2. Have them refresh the list and open a notification from that project without logging out.

**Expected Result:**
- Refused. Visibility is evaluated per request, not cached in the stored notification.

---

### TC-NTF-060: Closed and archived projects

**User Role:** Member
**Steps:**
1. Close a project and trigger a change where possible; then archive it.
2. Check whether notifications, emails, Teams and Slack messages are produced, and whether historic notifications
   for that project remain visible.

**Expected Result:**
- Archived projects produce no new notifications on any path, and their existing entries no longer disclose issue
  subjects.
- An archived project still posting to an external channel would be a clear defect — archiving is expected to stop
  activity entirely.

---

### TC-NTF-061: Preferences cannot be changed for another user

**User Role:** Member
**Steps:**
1. Attempt to change another user's notification preference by sending the preferences update directly with their
   identifier.

**Expected Result:**
- Refused. A user able to disable a colleague's notifications could silently cut them out of every issue update
  they rely on — a quiet and hard-to-diagnose form of interference.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
