# Test Cases — Redmineflux Notification — Installation & Plugin Configuration

> Source: vendor KB — "Version Compatibility", "Installation", "Configuration",
> "Redmine Notification Configuration", "Troubleshooting", "Uninstallation", FAQ Q2, Q3.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Notification Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time — KB declares **5.0.x and 6.0.x only**)
- Path: plugins/redmineflux_notification_qa

## Navigation methodology

Administration → Plugins → **Redmineflux Notifications plugin** → **Configure**. Every setting must be verified by
the notification it does or does not produce, never by the configuration page reporting a successful Apply.

> **Warning:** these settings are instance-wide and include outbound webhook and token credentials. Record the
> originals and restore them when the suite ends.

---

## Functional Cases — Installation

---

### TC-NTF-001: Plugin folder name is enforced

**User Role:** Admin
**Preconditions:** Folder `redmineflux_notification` in `plugins/`.
**Steps:**
1. Confirm the folder name is exactly `redmineflux_notification`.
2. Run `bundle install` and `RAILS_ENV=production bundle exec rails redmine:plugins:migrate`; restart.
3. Open Administration → Plugins.

**Expected Result:**
- The plugin is listed with a **Configure** link.
- The KB names the exact folder and tells the reader not to change it, so verify the negative too: rename,
  restart, confirm a loud failure rather than a half-loaded state, then restore.

---

### TC-NTF-002: Migrations complete cleanly

**User Role:** Admin
**Steps:**
1. Run the migration, restart, open an issue and the notification page.

**Expected Result:**
- No missing-table exception in `log/production.log`.

---

### TC-NTF-003: Assets load

**User Role:** Any
**Steps:**
1. With notifications enabled in preferences, inspect the console and Network tab on any page.

**Expected Result:**
- No 404s. The bell icon renders and its dropdown opens — the indicator is JS-driven, so confirm by behaviour.
- If assets 404, `rake assets:precompile` plus a restart resolves it (KB note).

---

### TC-NTF-004: Redmine version boundary

**User Role:** Admin
**Steps:**
1. Record the Redmine version from Administration → Information.

**Expected Result:**
- 5.0.x or 6.0.x, per the KB's compatibility table.
- **This plugin's range is narrower than most of the set — it omits 5.1.x.** On any other version, record the
  version and treat failures as compatibility findings rather than defects.

---

## Functional Cases — Configuration page

---

### TC-NTF-005: All three configuration tabs are present

**User Role:** Admin
**Steps:**
1. Open the Configure page.

**Expected Result:**
- **Redmine Notifications**, **Teams Notifications** and **Slack Notifications** tabs, per the KB.
- Current values are shown, not blank defaults.

---

### TC-NTF-006: All seven notification events are offered

**User Role:** Admin
**Steps:**
1. On the Redmine Notifications tab, enumerate the event checkboxes.

**Expected Result:**
- Exactly the seven documented events: Issue added, Issue updated, Issue note added, Issue status updated,
  Issue assigned, Issue priority updated, Issue target version updated.
- A missing event is a defect against the documentation; an extra undocumented one is a documentation gap to
  record.

---

### TC-NTF-007: Event selections persist

**User Role:** Admin
**Steps:**
1. Enable a subset of events, Apply, reload the page.

**Expected Result:**
- Exactly that subset is still ticked. A success message that does not persist is a defect.

---

### TC-NTF-008: Disabling an event stops its notifications

**User Role:** Admin, then two members
**Steps:**
1. Disable **Issue priority updated** but leave **Issue updated** enabled; Apply.
2. As user A, change only the priority of an issue user B watches.

**Expected Result:**
- Record precisely what B receives.
- The interesting question is whether a priority change still produces a generic "issue updated" notification. Both
  answers are defensible, but the behaviour must be consistent — an event checkbox that cannot actually suppress
  its event is misleading, and the KB presents these as independent controls.

---

### TC-NTF-009: Settings changes take effect without a restart

**User Role:** Admin, then two members
**Steps:**
1. Change the event selection and immediately trigger a matching change.

**Expected Result:**
- The new selection applies at once.
- If a restart or cache clear is needed, record it — the KB's troubleshooting suggests clearing the cache after
  configuration changes, so this may be expected behaviour worth documenting rather than a defect.

---

## Negative Cases

---

### TC-NTF-010: Configure page is not reachable by a non-admin

**User Role:** Manager, Developer, QA, Reporter (each in turn)
**Steps:**
1. Request the plugin settings URL directly for each role, and attempt to post a settings change.

**Expected Result:**
- 403 or redirect to login for every non-admin.
- **This page holds the Slack bot token, the Slack signing secret and the Teams webhook URLs.** A non-admin who can
  read it obtains credentials that let them post into the organisation's Teams and Slack channels from outside
  Redmine entirely. Treat any access here as High severity — this is not a routine permission gap.

---

### TC-NTF-011: Credentials are not exposed in the rendered page

**User Role:** Admin
**Steps:**
1. On the Configure page, inspect the HTML source for the Slack bot token, the signing secret and the webhook
   URLs.

**Expected Result:**
- Record whether they are rendered in plain text, masked, or write-only.
- A bot token echoed back into the page is visible to anything that can read the admin's screen or page source.
  Masking is the expected handling for a secret of this kind, and its absence is worth reporting even though the
  page itself is admin-only.

---

### TC-NTF-012: Invalid configuration values

**User Role:** Admin
**Steps:**
1. Enter a malformed Faye address, a non-URL Teams webhook, and a Slack token that is not in `xoxb-` form; Apply.

**Expected Result:**
- Rejected with a clear message, or accepted and then failing **visibly** at the point of use with a diagnosable
  error in the log (`[SLACK]` / `Teams notification error`, per the KB's troubleshooting).
- Silent failure is the worst outcome here: notifications simply stop arriving with nothing to explain why, which
  is precisely the situation the KB's troubleshooting section exists to resolve.

---

### TC-NTF-013: No configuration at all

**User Role:** Admin, then members
**Steps:**
1. With Teams and Slack disabled and no Faye address, trigger notification events.

**Expected Result:**
- In-app notifications still work and are visible on the notification page. The integrations and real-time
  delivery are optional add-ons, not prerequisites.

---

### TC-NTF-014: Plugin conflicts

**User Role:** Admin
**Steps:**
1. With other plugins that customise issue notifications, issue hooks or project settings installed, trigger a
   notification event.

**Expected Result:**
- Notifications fire normally and Redmine's own email notifications are unaffected.
- The KB explicitly suggests disabling such plugins when diagnosing problems, so record which are present — this
  plugin hooks the same issue lifecycle as the Timesheet, Helpdesk and Mentions plugins.

---

### TC-NTF-015: Migrations not run

**User Role:** Admin
**Steps:**
1. Install the files, skip the migration, restart, open an issue.

**Expected Result:**
- A clear error or the feature inert. **Core issue pages and Redmine's own email notifications must still work** —
  this plugin sits on the issue-save path, so breaking it would be Critical.

---

## Uninstallation

---

### TC-NTF-016: Clean uninstall

**User Role:** Admin
**Preconditions:** **Database backup taken** — the KB requires this before rollback.
**Steps:**
1. Run `RAILS_ENV=production bundle exec rake redmine:plugins:migrate NAME=redmineflux_notification VERSION=0`.
2. Remove `plugins/redmineflux_notification` and restart. Stop the Faye process if it was running.

**Expected Result:**
- Redmine starts cleanly; the bell icon is gone; issue pages and project settings work normally.
- **Redmine's own email notifications resume unaffected** — verify this explicitly, since the plugin can suppress
  email on a per-project basis and that suppression must not outlive it.
- The Teams and Slack project settings disappear from project settings without leaving broken sections.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
