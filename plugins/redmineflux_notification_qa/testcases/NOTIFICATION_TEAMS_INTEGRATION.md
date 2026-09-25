# Test Cases — Redmineflux Notification — Microsoft Teams Integration

> Source: vendor KB — "Microsoft Teams Notification Configuration", "Teams Notification Options",
> "Teams Notification Behavior", "How to Configure Project-Wise Microsoft Teams Notifications",
> "Teams Routing Rules", Troubleshooting, FAQ Q8, Q9, Q14.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Notification Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_notification_qa

## Why this suite carries more weight than its size suggests

This integration **sends Redmine issue content out of Redmine** to a Microsoft Teams channel. Two consequences
follow, and they shape every case below:

- A Teams channel usually has **different, and often wider, membership** than the Redmine project. Content that is
  correctly restricted inside Redmine can be entirely public inside Teams.
- **A Teams message cannot be retracted.** Anything posted in error has already been delivered.

The KB states one protective rule explicitly: *"Private issues and private notes are not posted to Teams."*
TC-NTF-102 and TC-NTF-110 exist to verify it, and they are the most important cases here.

## Preconditions

- A Teams channel with an **Incoming Webhook**, and a **second** channel with its own webhook for the
  project-routing cases.
- `production.log` accessible — the KB directs the reader to look for `Teams notification error` there.

---

## Functional Cases — Global configuration

---

### TC-NTF-103: Enable Teams globally with a webhook

**User Role:** Admin
**Priority:** High
**Steps:**
1. Configure → **Teams Notifications** → enable **Microsoft Teams notifications** → paste the webhook into
   **Global Teams Webhook URL** → **Apply**.

**Expected Result:**
- The settings persist across a reload.

---

### TC-NTF-104: A new issue posts to Teams

**User Role:** Member
**Priority:** High
**Steps:**
1. Create an issue in a project with no project-specific webhook.

**Expected Result:**
- A message appears in the global Teams channel, per the KB's behaviour list.

---

### TC-NTF-105: A note posts to Teams

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Add a note to an existing issue.

**Expected Result:**
- The note is posted, with its text included as the KB describes.

---

### TC-NTF-106: Field changes post to Teams

**User Role:** Member
**Priority:** Medium
**Preconditions:** **Post issue updates** enabled.
**Steps:**
1. Change, in separate updates: status, priority, assignee, category, target version, and a custom field.

**Expected Result:**
- Each produces a message naming the changed field with its old and new values — the KB lists all six of these
  field types explicitly, so verify each rather than testing one and generalising.

---

### TC-NTF-107: Post issue updates disabled

**User Role:** Admin then Member
**Priority:** Medium
**Steps:**
1. Disable **Post issue updates**; update an existing issue; then create a new one.

**Expected Result:**
- The update is **not** posted; the new issue **is** — the setting governs updates only, per the KB.

---

### TC-NTF-108: Display watchers option

**User Role:** Admin then Member
**Priority:** Low
**Steps:**
1. Enable **Display watchers**, trigger a notification on an issue with several watchers; then disable and repeat.

**Expected Result:**
- Watchers are listed in the message when enabled and absent when disabled.
- Note the privacy dimension: enabling this publishes **who is watching an issue** into a channel that may have
  wider membership than the project.

---

### TC-NTF-109: Message content is complete and correct

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Inspect a Teams message against the issue it describes.

**Expected Result:**
- Project name, a working issue link, author or updater, status, priority, assignee, watchers (when enabled), and
  the notes or changed fields — all present and accurate.
- **Follow the issue link** and confirm it resolves. A link built from a misconfigured host name is unusable, and
  it is the most common defect in outbound integrations.

---

## Functional Cases — The privacy rule

---

### TC-NTF-102: Private issues are not posted to Teams

**User Role:** Member
**Priority:** High
**Steps:**
1. Create a **private** issue, then update it, then add a note to it.

**Expected Result:**
- **Nothing reaches the Teams channel** for any of the three actions — not the subject, not the description, not
  the note.
- The KB states this rule plainly. **A private issue posted into a Teams channel is a Critical leak**: the content
  has left Redmine entirely, reached an audience defined outside it, and cannot be recalled. This is the single
  most consequential case in the whole plugin.

---

### TC-NTF-110: Private notes are not posted to Teams

**User Role:** Member
**Priority:** High
**Steps:**
1. Add a **private note** to an otherwise public issue.

**Expected Result:**
- Either no message, or a message that contains **none of the private note's text**.
- Note the subtle failure mode worth checking specifically: a message that correctly omits the note body but still
  announces "a note was added" is defensible; one that includes the body is Critical. Record exactly which.

---

## Functional Cases — Project-wise routing

---

### TC-NTF-111: Enable the Teams Notifications project module

**User Role:** Manager
**Priority:** Medium
**Steps:**
1. Project → Settings → **Modules** → enable **Teams Notifications** → Save.

**Expected Result:**
- A **Teams Notifications** section appears in the project's settings.
- Before enabling, it is absent — confirm both states.

---

### TC-NTF-112: Configure a project-specific webhook

**User Role:** Manager
**Priority:** Medium
**Steps:**
1. Project → Settings → Teams Notifications → enable project-specific Teams → enter the **second** channel's
   webhook → set the two options → Save.

**Expected Result:**
- The settings persist.

---

### TC-NTF-113: Project webhook wins over the global one

**User Role:** Member
**Priority:** High
**Steps:**
1. Trigger a notification in the project.
2. Check **both** Teams channels.

**Expected Result:**
- The message arrives in the **project** channel only, per the routing table.
- **Confirm it did not also go to the global channel.** Duplicate delivery would push the project's activity into
  a channel the project deliberately routed away from — which is the whole point of configuring a project webhook.

---

### TC-NTF-114: Falling back to the global webhook

**User Role:** Manager then Member
**Priority:** Medium
**Steps:**
1. Disable project-specific Teams for the project; trigger a notification.

**Expected Result:**
- The message goes to the global channel, per the routing table.

---

### TC-NTF-115: Parent project fallback

**User Role:** Member
**Priority:** Medium
**Preconditions:** A parent project with its own Teams webhook and a sub-project with none.
**Steps:**
1. Trigger a notification in the sub-project.

**Expected Result:**
- It reaches the **parent project's** channel, which is what the KB's routing table specifies.
- This inheritance is stated for Teams but **not** for Slack, so confirm it rather than assuming symmetry —
  a sub-project's activity landing in the wrong channel is a quiet misrouting that nobody notices until the wrong
  audience reads it.

---

### TC-NTF-116: No webhook configured anywhere

**User Role:** Member
**Priority:** Low
**Steps:**
1. With neither a project nor a global webhook, trigger a notification.

**Expected Result:**
- **No Teams notification is sent, and nothing else breaks** — the issue saves normally and in-app notifications
  still work, per the routing table's third row.

---

## Negative Cases

---

### TC-NTF-117: Invalid webhook URL

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Configure a malformed URL, and separately a valid-looking URL that returns an error; trigger a notification.

**Expected Result:**
- **The issue still saves.** An outbound integration failure must never block a user's work.
- The failure is logged as `Teams notification error`, which is exactly what the KB's troubleshooting tells the
  reader to look for. A silently swallowed failure leaves an admin believing notifications are being delivered
  when they are not.

---

### TC-NTF-118: Teams disabled globally

**User Role:** Admin then Member
**Priority:** Medium
**Steps:**
1. Disable **Microsoft Teams notifications** globally while a project still has its own webhook configured;
   trigger a notification.

**Expected Result:**
- Nothing is posted. The global toggle is a genuine kill switch that overrides project configuration.
- A project webhook that keeps posting after the administrator has disabled the integration would make the
  organisation-wide control meaningless.

---

### TC-NTF-119: Teams unreachable

**User Role:** Member
**Priority:** High
**Steps:**
1. Block outbound access to the webhook host and trigger a notification.

**Expected Result:**
- The issue saves promptly — the request must not block the save while it times out.
- Record the save duration. A synchronous outbound call on the issue-save path makes every issue update as slow as
  the slowest external service, which is a real performance defect.

---

### TC-NTF-120: Notification volume

**User Role:** Member
**Priority:** Low
**Steps:**
1. Bulk-update 20 issues in one action.

**Expected Result:**
- Messages are delivered without the bulk edit timing out, and without Teams rate-limiting causing silent losses.
- Record whether any messages were dropped — a rate-limit response that is not retried or logged is an invisible
  gap in the channel's record.

---

### TC-NTF-121: Script and markup in issue content

**User Role:** Member
**Priority:** High
**Steps:**
1. Create an issue whose subject and note contain markup, a script tag, and Teams-specific formatting characters.

**Expected Result:**
- The message renders safely in Teams with the text intact and no broken card layout.
- Malformed content must not prevent the message from being delivered at all.

---

### TC-NTF-122: Project settings access

**User Role:** Non-manager member
**Priority:** High
**Steps:**
1. Confirm the project's Teams Notifications settings are not offered.
2. Request the settings URL directly and attempt to post a webhook change.

**Expected Result:**
- Refused with 403.
- **Anyone who can set a project's webhook can redirect that project's entire issue activity to a channel of their
  choosing** — including one outside the organisation. Treat access here as High severity, not a routine
  permission gap.

---

### TC-NTF-123: Disabled project notifications override Teams

**User Role:** Manager then Member
**Priority:** High
**Steps:**
1. Enable **Disable notifications** for a project that has a Teams webhook; trigger a change.

**Expected Result:**
- Nothing is posted to Teams.
- The KB says the project switch skips email and notifications; confirm it also stops the outbound integration.
  If Teams messages continue after a project has been explicitly silenced, the switch does not do what its name
  promises — worth filing either way.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
