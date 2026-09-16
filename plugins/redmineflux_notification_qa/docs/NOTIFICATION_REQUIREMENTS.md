# Plugin Requirements — Redmineflux Notification Plugin

> Source: https://www.redmineflux.com/knowledge-base/plugins/notification/ (official vendor knowledge base,
> ingested 2026-09-15).

## Overview

An in-app notification system for issue activity, with three delivery paths on top of it: a **notification page
and bell icon** inside Redmine, optional **real-time push via a Faye server**, and **outbound integrations to
Microsoft Teams and Slack**. Notifications can be routed globally or per project, and can be switched off for an
individual project.

The plugin's distinguishing risk is that it **sends Redmine content to external services** — Teams webhooks and
Slack channels — which makes "what exactly is in the message, and who can see that channel" a security question
rather than a formatting one.

## Key Features

1. **Configurable notification events** — Issue added; Issue updated; Issue note added; Issue status updated;
   Issue assigned; Issue priority updated; Issue target version updated.
2. **Recipients** — notified users and watchers. **The user who performed the action never receives a
   notification for their own change.**
3. **Per-user opt-in** — My Account → Preferences → **Notifications** checkbox; the bell icon appears only once
   enabled.
4. **Unread indicator** — a red dot on the bell, cleared once notifications are viewed.
5. **Notification history** — *See All Notifications*, filterable by **New** and **Viewed**, with
   **Mark all as seen**. Opening one marks it viewed and redirects to the issue.
6. **Real-time delivery via Faye** — started with
   `rackup plugins/redmineflux_notification/faye.ru -E production`, and configured by entering the Faye address in
   the plugin settings. **Leaving the address empty turns real-time off**; notifications are still stored and
   visible on the notification page.
7. **Browser desktop notifications** — *Use desktop notifications if my browser supports it*, subject to OS and
   browser permission.
8. **Microsoft Teams integration** — global incoming-webhook URL, with per-project webhooks; options for
   *Display watchers* and *Post issue updates*.
9. **Slack integration** — Slack Web API with a Bot User OAuth Token (`xoxb-`), a signing secret, a default
   channel, a **Verify SSL** toggle, plus the same two display options.
10. **Project-wise routing** — each project may use the global target or its own Teams webhook / Slack channel,
    after enabling the corresponding project module.
11. **Disable notifications per project** — skips **email and notifications** for that project entirely.

## Business Workflows

1. **Enable and receive** — user ticks Notifications in preferences → someone else changes an issue they watch →
   a notification appears on the bell, and in real time if Faye is running.
2. **Review history** — bell → See All Notifications → filter New/Viewed → open one (marks viewed, redirects to
   the issue), or Mark all as seen.
3. **Route a project to its own channel** — admin enables Teams/Slack globally → project manager enables the
   project module → sets the project webhook or channel in Project → Settings.
4. **Silence a project** — project settings → Notifications → **Disable notifications**.

## Permissions Matrix

The KB publishes **no** plugin permission. Access is governed by Redmine's own project and issue visibility, plus
administrator rights for the plugin configuration and project-manager rights for project settings. The matrix
below must be established empirically.

| Action | Admin | Manager | Developer | QA | Reporter | Non-member | Anonymous |
|--------|-------|---------|-----------|-----|----------|------------|-----------|
| Enable notifications in own preferences | | | | | | | |
| See own notification list / history | | | | | | | |
| Receive notifications for a private project's issues | | | | | | | |
| Change plugin configuration (events, Faye, Teams, Slack) | | | | | | | |
| Enable the Teams/Slack project modules | | | | | | | |
| Set a project Teams webhook / Slack channel | | | | | | | |
| Disable notifications for a project | | | | | | | |

The two rows that matter most are **receiving notifications for content the user cannot see** and **who can set a
project's outbound webhook** — the first is an inbound leak, the second an outbound one.

## Known Constraints

- **The actor is never notified of their own action** (FAQ Q6) — the KB lists this as a troubleshooting cause, so
  a "missing notification" is often correct behaviour.
- **Private issues and private notes are not posted to Teams.** The KB states this for Teams explicitly but
  **does not state it for Slack** — that asymmetry is either a documentation gap or a real defect, and it must be
  tested rather than assumed.
- **Faye is optional.** With the address empty, real-time is off but stored notifications still work.
- **Teams routing:** project webhook → else parent project or global webhook → else nothing is sent.
- **Slack routing:** project channel → else the global default channel → else nothing is sent.
  Note the difference: the Teams table mentions a **parent project** fallback and the Slack table does not.
- **The Slack bot must be invited to each target channel**, or posting fails.
- **Disable notifications on a project skips email as well as in-app notifications** — a broader effect than the
  name suggests.
- Declared compatibility: Redmine **5.0.x and 6.0.x** only (not 5.1.x, not 4.x).

## Installation Prerequisites

1. Working Redmine 5.0.x or 6.0.x.
2. Folder `redmineflux_notification` in `plugins/`, name unchanged.
3. `bundle install`; `RAILS_ENV=production bundle exec rails redmine:plugins:migrate`; restart.
4. Optional Faye server for real-time delivery, reachable from both the Redmine server and the browser.
5. For Teams testing: a Teams channel with an incoming webhook, plus a **second** channel to verify per-project
   routing.
6. For Slack testing: a Slack app with `chat:write`, `channels:read` (and `groups:read` for private channels), a
   bot token, and the bot invited to each target channel.
7. At least two users besides the actor — the exclusion rule means testing with a single account produces no
   notifications at all and looks like a defect.
