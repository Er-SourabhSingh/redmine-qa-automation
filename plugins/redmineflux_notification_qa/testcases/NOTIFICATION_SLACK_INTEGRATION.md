# Test Cases — Redmineflux Notification — Slack Integration

> Source: vendor KB — "Slack Notification Configuration", "Recommended Slack Bot Scopes",
> "Slack Notification Options", "Slack Notification Behavior",
> "How to Configure Project-Wise Slack Notifications", "Slack Routing Rules", Troubleshooting,
> FAQ Q10, Q11, Q13.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Notification Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_notification_qa

## The gap this suite exists to close

The KB describes Teams and Slack in parallel throughout — same options, same behaviours, same routing structure.
But it states the privacy rule for **only one of them**:

> *"Private issues and private notes are not posted to Teams."*

There is **no equivalent statement for Slack.** Either the documentation is incomplete, or the exclusion was
implemented on one path and not the other. **TC-NTF-093 is the most important case in this entire plugin**, and it
must be executed before any Slack integration is considered fit for production use.

The consequences are asymmetric: a Slack workspace typically has far wider membership than a Redmine project, and
a posted message cannot be recalled.

## Preconditions

- A Slack app with `chat:write`, `channels:read` (plus `groups:read` for private channels), installed to the
  workspace, with its **Bot User OAuth Token** (`xoxb-…`).
- The bot **invited** to every target channel.
- A **second** channel, also with the bot invited, for the project-routing cases.
- `production.log` accessible — the KB directs the reader to `[SLACK]` errors there.

---

## Functional Cases — Global configuration

---

### TC-NTF-079: Enable Slack globally

**User Role:** Admin
**Priority:** High
**Steps:**
1. Configure → **Slack Notifications** → enable → paste the bot token → enter the signing secret if required →
   set the **Default Slack Channel** → leave **Verify SSL** on → **Apply**.

**Expected Result:**
- Settings persist across a reload.

---

### TC-NTF-080: A new issue posts to Slack

**User Role:** Member
**Priority:** High
**Steps:**
1. Create an issue in a project with no project-specific channel.

**Expected Result:**
- A message appears in the default Slack channel.

---

### TC-NTF-081: Notes and field changes post to Slack

**User Role:** Member
**Priority:** Medium
**Preconditions:** **Post issue updates** enabled.
**Steps:**
1. Add a note; then change status, priority, assignee, category, target version and a custom field in separate
   updates.

**Expected Result:**
- Each produces a message naming what changed — the KB lists all six field types, so verify each rather than
  generalising from one.

---

### TC-NTF-082: Message content is complete and correct

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Compare a Slack message against the issue it describes.

**Expected Result:**
- Project link, issue link, author or updater, status, priority, assignee, watchers (when enabled), and the notes
  or changed fields.
- **Follow both links** — a link built from a misconfigured host name is unusable, which is the most common defect
  in outbound integrations.

---

### TC-NTF-083: Verify SSL

**User Role:** Admin
**Priority:** Low
**Steps:**
1. With **Verify SSL** enabled, confirm messages post normally.
2. Disable it and confirm messages still post.

**Expected Result:**
- Both work against a valid Slack endpoint.
- **Record that disabling SSL verification removes protection against an intercepted connection** — the bot token
  travels on that request. The KB advises keeping it on unless the environment requires otherwise, and that advice
  should be reflected in the plugin memory file.

---

### TC-NTF-084: Display watchers and Post issue updates

**User Role:** Admin then Member
**Priority:** Medium
**Steps:**
1. Toggle each option and trigger the corresponding events.

**Expected Result:**
- Watchers appear in messages only when enabled; updates post only when **Post issue updates** is enabled, while
  new-issue messages continue regardless.
- Enabling watcher display publishes **who is watching an issue** into a workspace channel — worth noting, since
  Slack membership is usually broader than the project's.

---

### TC-NTF-085: Bot posts only where it is a member

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Configure a channel the bot has **not** been invited to and trigger a notification.
2. Invite the bot and retry.

**Expected Result:**
- The first attempt fails and is logged with a `[SLACK]` error naming the cause — the KB lists an uninvited bot as
  a specific troubleshooting item.
- **The issue still saves normally** in both cases.
- After the invite, messages arrive.

---

### TC-NTF-086: Private Slack channels

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Configure a **private** Slack channel as the target, with the bot invited and `groups:read` granted.

**Expected Result:**
- Messages are delivered.
- Without `groups:read`, the failure is logged clearly rather than silently swallowed — the KB names this scope
  specifically for private channels.

---

## Functional Cases — Project-wise routing

---

### TC-NTF-087: Enable the Slack Notifications project module

**User Role:** Manager
**Priority:** Medium
**Steps:**
1. Project → Settings → **Modules** → enable **Slack Notifications** → Save.

**Expected Result:**
- A **Slack Notifications** section appears in the project's settings; before enabling it is absent.

---

### TC-NTF-088: Configure a project-specific channel

**User Role:** Manager
**Priority:** Medium
**Steps:**
1. Invite the bot to the second channel.
2. Project → Settings → Slack Notifications → enable project-specific Slack → enter the channel → set the two
   options → Save.

**Expected Result:**
- The settings persist.

---

### TC-NTF-089: Project channel wins over the default

**User Role:** Member
**Priority:** High
**Steps:**
1. Trigger a notification in that project and check **both** channels.

**Expected Result:**
- The message arrives in the **project** channel only.
- **Confirm it did not also reach the default channel.** Duplicate delivery would push the project's activity back
  into the channel it was deliberately routed away from.

---

### TC-NTF-090: Falling back to the default channel

**User Role:** Manager then Member
**Priority:** Medium
**Steps:**
1. Disable project-specific Slack; trigger a notification.

**Expected Result:**
- The message goes to the global default channel, per the routing table.

---

### TC-NTF-091: Sub-project behaviour

**User Role:** Member
**Priority:** Medium
**Preconditions:** A parent project with its own Slack channel and a sub-project with none.
**Steps:**
1. Trigger a notification in the sub-project and observe which channel receives it.

**Expected Result:**
- Record the result precisely.
- **The Teams routing table names a parent-project fallback; the Slack table does not.** Either the two behave
  differently — an undocumented asymmetry worth reporting — or the Slack documentation is incomplete. A
  sub-project's activity landing in an unexpected channel is a quiet misrouting that surfaces only when the wrong
  audience reads it.

---

### TC-NTF-092: No channel configured anywhere

**User Role:** Member
**Priority:** Low
**Steps:**
1. With neither a project nor a default channel, trigger a notification.

**Expected Result:**
- **No Slack notification is sent and nothing else breaks** — the issue saves and in-app notifications still work,
  per the routing table's third row.

---

## Negative Cases

---

### TC-NTF-093: Private issues and private notes must not reach Slack

**User Role:** Member
**Priority:** High
**Steps:**
1. Create a **private issue**; update it; add a note to it.
2. Separately, add a **private note** to a public issue.
3. Inspect the Slack channel after each of the four actions.

**Expected Result:**
- **No private issue content and no private note text appears in Slack.**
- **This is the highest-priority case in the plugin.** The KB guarantees this exclusion for Teams and is silent
  about Slack, so the behaviour is genuinely unknown until tested. If private content is posted, it is a
  **Critical** leak — the content has left Redmine, reached a workspace whose membership Redmine does not control,
  and cannot be withdrawn.
- Whatever the result, record it explicitly in the plugin memory file and, if the exclusion does hold, note that
  the vendor documentation should say so.

---

### TC-NTF-094: Invalid bot token

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Configure a malformed token, then a well-formed but revoked one; trigger a notification.

**Expected Result:**
- **The issue still saves.** An outbound failure must never block a user's work.
- The failure is logged as a `[SLACK]` error, as the KB's troubleshooting describes. Silent failure would leave an
  admin believing the channel is receiving updates when it is not.

---

### TC-NTF-095: Non-existent channel

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Configure a channel name that does not exist; trigger a notification.

**Expected Result:**
- Logged clearly; the issue saves; nothing is posted elsewhere as a fallback.
- A misconfigured channel name must not silently redirect the message to a different channel — that would put the
  content in front of the wrong audience.

---

### TC-NTF-096: Slack disabled globally

**User Role:** Admin then Member
**Priority:** Medium
**Steps:**
1. Disable **Slack Notifications** globally while a project still has its own channel configured; trigger a
   notification.

**Expected Result:**
- Nothing is posted. The global toggle overrides project configuration and is a genuine kill switch.

---

### TC-NTF-097: Slack unreachable

**User Role:** Member
**Priority:** High
**Steps:**
1. Block outbound access to the Slack API and trigger a notification.

**Expected Result:**
- The issue saves promptly — the outbound call must not block the save while it times out.
- Record the save duration; a synchronous external call on the issue-save path makes every update as slow as the
  slowest external service.

---

### TC-NTF-098: Rate limiting at volume

**User Role:** Member
**Priority:** Low
**Steps:**
1. Bulk-update 20 issues in one action.

**Expected Result:**
- The bulk edit completes and messages are delivered.
- Slack rate-limits `chat.postMessage`; record whether throttled messages are retried, queued, or **silently
  dropped**. Silent loss creates gaps in the channel's record that nobody notices, which is worse than a visible
  failure.

---

### TC-NTF-099: Special characters and markup

**User Role:** Member
**Priority:** High
**Steps:**
1. Create an issue whose subject and note contain Slack formatting characters (`*`, `_`, backticks, `<>`), an
   `@here`-style mention, and a script tag.

**Expected Result:**
- Text renders intact without breaking the message layout.
- **An `@here` or `@channel` string in an issue subject must not become a real Slack mention** — that would let any
  Redmine user notify an entire workspace channel simply by naming an issue, which is both disruptive and a small
  privilege escalation across system boundaries.

---

### TC-NTF-100: Project settings access

**User Role:** Non-manager member
**Priority:** High
**Steps:**
1. Confirm the project's Slack Notifications settings are not offered.
2. Request the settings URL directly and attempt to post a channel change.

**Expected Result:**
- Refused with 403.
- **Anyone who can set a project's channel can redirect that project's entire issue activity to a channel of their
  choosing.** High severity if reachable.

---

### TC-NTF-101: Disabled project notifications override Slack

**User Role:** Manager then Member
**Priority:** High
**Steps:**
1. Enable **Disable notifications** for a project with a Slack channel configured; trigger a change.

**Expected Result:**
- Nothing is posted to Slack.
- Confirm the project-level switch really does stop the outbound integration and not only in-app notifications and
  email (paired with TC-NTF-123).

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
