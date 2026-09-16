# User Guide — Redmineflux Notification Plugin

> This file must be read before writing any test case. It describes real end-user behaviour and UI flows.
> Source: https://www.redmineflux.com/knowledge-base/plugins/notification/ (ingested 2026-09-15).
> Confirm each flow against the running instance during the first execution session and correct this file where
> the real UI differs.

## Getting Started

Each user opts in individually: **My Account → Preferences → Notifications**. Once saved, a bell icon appears in
the top-right of Redmine near the username, carrying a red dot when there is something unread.

Administrators configure what generates notifications, and whether they also go out to Teams or Slack.

## Key Screens

| Screen | Path | Purpose |
|--------|------|---------|
| My Account preferences | My Account → Preferences | Per-user opt-in and desktop notifications |
| Bell icon / dropdown | Top-right of Redmine | Recent notifications, unread indicator |
| Notification history | Bell → **See All Notifications** | Filter New / Viewed, Mark all as seen |
| Plugin configuration | Administration → Plugins → Redmineflux Notifications plugin → Configure | Three tabs |
| Project Teams settings | Project → Settings → Teams Notifications | Project webhook and options |
| Project Slack settings | Project → Settings → Slack Notifications | Project channel and options |
| Project notification switch | Project → Settings → Notifications | **Disable notifications** |

## Step-by-Step Workflows

### Workflow 1: Turn notifications on (each user)

1. Open **My Account** → **Preferences**.
2. Tick **Notifications**.
3. Optionally tick **Use desktop notifications if my browser supports it**.
4. **Save**. The bell icon appears near the username.

### Workflow 2: Choose which events notify (admin)

1. Administration → **Plugins** → Redmineflux Notifications plugin → **Configure**.
2. On the **Redmine Notifications** tab, tick the events to notify on:
   Issue added, Issue updated, Issue note added, Issue status updated, Issue assigned, Issue priority updated,
   Issue target version updated.
3. **Apply**.

Notifications go to notified users and watchers. **The person who made the change is never notified of it.**

### Workflow 3: Read notifications

1. Click the bell icon. A red dot indicates unread items; it clears once they are viewed.
2. Click **See All Notifications**.
3. Filter by **New Notifications** or **Viewed Notifications** and click **Filter**.
4. Click an individual notification — it is marked viewed and you are redirected to the issue.
5. Use **Mark all as seen** to clear everything unread.

### Workflow 4: Turn on real-time delivery (admin)

1. Start the Faye server:
   `rackup plugins/redmineflux_notification/faye.ru -E production`
2. Configure → **Redmine Notifications** tab → enter the address in **Address of faye server**, for example
   `http://your_server_ip_or_domain:9292/faye`.
3. **Apply**.

Leave the field empty to turn real-time off — notifications are still stored and visible on the notification page.

### Workflow 5: Microsoft Teams (admin, then project manager)

1. In Teams, create an **Incoming Webhook** on the target channel and copy its URL.
2. Configure → **Teams Notifications** → enable **Microsoft Teams notifications** → paste the URL into
   **Global Teams Webhook URL** → set *Display watchers* and *Post issue updates* → **Apply**.
3. For a project-specific channel: Project → **Settings** → **Modules** → enable **Teams Notifications** → Save.
4. Project → **Settings** → **Teams Notifications** → enable project-specific Teams → enter the project webhook →
   choose the two options → **Save**.

**Routing:** project webhook → otherwise the parent project or global webhook → otherwise nothing is sent.

### Workflow 6: Slack (admin, then project manager)

1. Create a Slack app, add bot scopes (`chat:write`, `channels:read`, and `groups:read` for private channels),
   install it, and copy the **Bot User OAuth Token** (`xoxb-…`).
2. Configure → **Slack Notifications** → enable → paste the token → enter the **Signing Secret** if required →
   set the **Default Slack Channel** → keep **Verify SSL** on → **Apply**.
3. **Invite the bot to every channel** Redmine should post to.
4. For a project channel: Project → **Settings** → **Modules** → enable **Slack Notifications** → Save; then
   Project → **Settings** → **Slack Notifications** → enable → enter the channel → choose the options → **Save**.

**Routing:** project channel → otherwise the global default channel → otherwise nothing is sent.

### Workflow 7: Silence a project

1. Open the project → **Settings** → the **Notifications** section.
2. Enable **Disable notifications** → Save.

This skips **email and notifications** for that project.

## UI Elements Reference

| Element | Where | Notes |
|---------|-------|-------|
| **Notifications** checkbox | My Account → Preferences | Per-user opt-in; the bell appears only after this |
| Bell icon + red dot | Top-right | Dot clears once notifications are viewed |
| **See All Notifications** | Bell dropdown | Opens the history page |
| **New / Viewed** filters + **Filter** | History page | |
| **Mark all as seen** | History page | Bulk clear |
| **Address of faye server** | Config → Redmine Notifications | Empty = real-time off |
| **Global Teams Webhook URL** | Config → Teams Notifications | Fallback for projects without their own |
| **Slack Bot Token** / **Default Slack Channel** / **Verify SSL** | Config → Slack Notifications | |
| **Disable notifications** | Project → Settings → Notifications | Skips email too |

## Notes & Known Behaviour

- **You never get notified about your own changes.** This is the most common cause of a "notifications are not
  working" report, and the KB lists it as a troubleshooting item.
- **Private issues and private notes are not posted to Teams.** The KB does **not** make the same statement about
  Slack — treat that as unverified and check it explicitly before assuming either behaviour.
- **Faye is a separate process.** If it is not running, real-time delivery silently does not happen while stored
  notifications continue to work normally.
- **Desktop notifications need three things**: the Redmine preference, browser permission for the site, and OS
  notification permission. All three are documented, and any one of them will silently block delivery.
- **The Slack bot must be a member of the target channel**, otherwise posting fails — check `production.log` for
  `[SLACK]` errors, and for `Teams notification error` on the Teams side.
- **Disabling notifications for a project also stops its email.**
