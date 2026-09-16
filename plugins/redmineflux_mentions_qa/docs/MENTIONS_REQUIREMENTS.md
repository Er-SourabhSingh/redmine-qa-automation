# Plugin Requirements — Redmineflux Mentions Plugin

> Source: https://www.redmineflux.com/knowledge-base/plugins/mentions-plugin/ (official vendor knowledge base,
> ingested 2026-09-15). Every claim below traces to that page; anything marked *(to confirm)* is an inference that
> must be verified against the running instance before a test case depends on it.

## Overview

The Mentions plugin lets a user reference another user inside an **issue description**, an **issue note**, or
**wiki content**, and sends the mentioned user a notification email. Its stated purpose is to improve collaboration
by making it easy to refer to a specific person and notify them about relevant content or actions.

## Key Features

1. **Mention inside issue descriptions** — type the mention symbol followed by a username or user identifier.
2. **Mention inside issue notes** — same syntax, via Add notes.
3. **Mention inside wiki content** — same syntax, on any wiki page of a project with the Wiki module enabled.
4. **Configurable mention symbol** — chosen in the plugin configuration from `@`, `$`, `:`, `~`, `!`, `%`.
5. **Email notification on mention** — the mentioned user receives an email when the content is saved.
6. **User lookup by account name** — the KB states mentions display users according to their user account names,
   with no character restriction on the usernames that can be mentioned.
7. **Notification opt-out** — email notification for mentions can be disabled through the email notification
   settings.

## Business Workflows

1. **Notify a colleague on an issue** — open the issue → Edit or Add notes → type the mention symbol + username in
   the description/notes text area → save → the mentioned user is emailed.
2. **Assign responsibility informally** — per the KB FAQ, mentioning a user in a description or note is a
   recognised way of indicating that the mentioned user is responsible for that task; they identify their work
   through the notification.
3. **Notify on a wiki page** — enable the Wiki module in Project Settings → Modules → open the Wiki tab → edit a
   page → mention a user in the text area → save → the mentioned user is emailed.
4. **Change the instance-wide mention symbol** — Administration → Plugins → Mentions → Configure → select the
   symbol → save → restart Redmine so the change takes effect (the KB explicitly calls for a restart).

## Permissions Matrix

The KB does not publish a permissions matrix for this plugin. The matrix below is the one the test suites must
**establish empirically**; leave it blank until execution fills it in.

| Action | Admin | Manager | Developer | QA | Reporter | Non-member | Anonymous |
|--------|-------|---------|-----------|-----|----------|------------|-----------|
| Mention a user in an issue description | | | | | | | |
| Mention a user in an issue note | | | | | | | |
| Mention a user in wiki content | | | | | | | |
| Be mentioned / receive the notification | | | | | | | |
| Change the mention symbol (plugin config) | | | | | | | |

The open question the suites must answer: **can a user be mentioned into visibility of content they otherwise
cannot see?** The KB is silent on this, and it is the plugin's highest-risk behaviour.

## Known Constraints

- **Restart required** after changing the mention symbol (stated in Configuration and again in "How to Customize
  the Mention Symbol"). A symbol change that appears to work without a restart, or that half-works, is worth
  recording either way.
- **Wiki module must be enabled** on the project before wiki mentions are possible; the KB gives the enabling
  steps as part of the wiki mention flow.
- Declared Redmine compatibility: 4.0.x, 4.1.x, 4.2.x, 5.0.x, 5.1.x, 6.0.x.
- Asset issues after install are resolved with `RAILS_ENV=production bundle exec rake assets:precompile` plus a
  restart.
- The KB's troubleshooting section mentions conflicts with "plugins that modify the same fields or interfere with
  the inline editing feature" — the Inline Editor plugin is the obvious candidate to test alongside this one.

## Installation Prerequisites

1. A working Redmine installation.
2. Plugin ZIP extracted to `/path/to/redmine/plugins`, **folder name unchanged**.
3. `bundle install`.
4. `RAILS_ENV=production bundle exec rails redmine:plugins:migrate` (or `development`).
5. Server restart.
6. A working outbound mail configuration — without it, no mention notification can be verified at all. Per the
   repo's global memory, also check Administration → Settings → General → **Host name and path** before testing any
   email flow, on every environment, every session.
