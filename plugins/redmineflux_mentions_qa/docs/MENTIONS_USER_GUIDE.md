# User Guide — Redmineflux Mentions Plugin

> This file must be read before writing any test case. It describes real end-user behaviour and UI flows.
> Source: https://www.redmineflux.com/knowledge-base/plugins/mentions-plugin/ (ingested 2026-09-15).
> Steps below are the vendor's described flow. Confirm each against the running instance during the first
> execution session and correct this file where the real UI differs.

## Getting Started

The plugin adds no new menu item and no new page. It works inside text areas that already exist: the issue
description, the issue notes field, and the wiki editor. The only new screen is the plugin's configuration page in
Administration.

## Key Screens

| Screen | Path | What it is for |
|--------|------|----------------|
| Plugin configuration | Administration → Plugins → Redmineflux Mentions Plugin → Configure | Choose the mention symbol |
| Issue detail / Edit | Issues → *an issue* → Edit | Mention inside the description |
| Issue notes | Issues → *an issue* → Add notes | Mention inside a note |
| Wiki editor | Project → Wiki → Edit | Mention inside wiki content |
| Email notification settings | Administration → Settings → Email notifications | Turn mention emails off |

## Step-by-Step Workflows

### Workflow 1: Choose the mention symbol

1. Log in as an administrator.
2. Click **Administration** in the top menu.
3. Open the **Plugins** section.
4. Find the Redmineflux Mentions Plugin and click **Configure**.
5. In **Select Mention Symbol**, pick one of `@`, `$`, `:`, `~`, `!`, `%`.
6. Click **Save** / **Apply**.
7. **Restart Redmine** so the change takes effect — the KB calls for this explicitly.

### Workflow 2: Mention a user on an issue

1. Open the issue where you want to mention someone.
2. Click **Edit**, or **Add notes**.
3. Put the cursor in the description text area, or the notes text area.
4. Type the mention symbol immediately followed by the username or user identifier — for example `@username` or
   `@user123`.
5. Save / submit.
6. The mentioned user receives a notification email.

### Workflow 3: Mention a user on a wiki page

1. Make sure the project's Wiki module is enabled. If the Wiki tab is not visible:
   1. Open the project → **Settings** → **Modules**.
   2. Tick **Wiki**.
   3. Save.
2. Open the project's **Wiki** tab.
3. Click **Edit** on the page.
4. In the text area, type the mention symbol followed by the username.
5. Save.
6. The mentioned user receives a notification email.

### Workflow 4: Stop receiving mention emails

1. Go to the email notification settings.
2. Disable the mention notification.
3. Save the change.

## UI Elements Reference

| Element | Where | Notes |
|---------|-------|-------|
| **Select Mention Symbol** dropdown | Plugin configuration | Six documented options: `@ $ : ~ ! %` |
| Mention text token | Description, notes, wiki body | Typed inline as symbol + account name |
| Notification email | Recipient's mailbox | Triggered on save of the containing content |

## Notes & Known Behaviour

- The mention is **plain typed text**, not a widget. The KB describes no picker, no chip and no autocomplete —
  confirm during execution whether the build offers one.
- Users are matched on their **account name**. The KB states there is no character restriction on usernames that
  can be mentioned, which makes usernames containing spaces, dots or the mention symbol itself the interesting
  boundary cases.
- A **restart is required** after a symbol change. Content saved with the old symbol before a restart is the
  scenario most likely to expose stale-parsing bugs.
- Changing the symbol is **instance-wide and retroactive in effect**: existing content containing the old symbol
  does not change, so what a historic `@name` renders as after switching to `%` is an explicit thing to check, not
  an edge case.
- Before testing any email flow on any environment, check **Administration → Settings → General → Host name and
  path** — a wrong value produces emails with unusable links and wastes a whole session.
