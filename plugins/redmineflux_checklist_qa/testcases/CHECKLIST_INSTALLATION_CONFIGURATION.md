# Test Cases — Redmineflux Checklist — Installation, Compatibility & Global Configuration

> Source: vendor KB https://www.redmineflux.com/knowledge-base/plugins/checklist-plugin/
> sections "Version Compatibility", "Installation", "Configuration", "How to Enable Block Issue Closing feature",
> "Troubleshooting", "Uninstallation of Plugin".
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Checklist Plugin
- Version: (record the installed version at execution time)
- Redmine version: (record at execution time — KB claims 4.0.x–4.2.x, 5.0.x, 5.1.x, 6.0.x)
- Path: plugins/redmineflux_checklist_qa

## Navigation methodology

Administration → Plugins → **Redmineflux Checklist Plugin** → **Configure**. Every setting change must be verified by
its *effect* in the issue UI, not by the settings page reporting a successful save.

> **Warning:** these cases change instance-wide settings. Record the original values first and restore them
> afterwards, or later suites will run against an altered configuration.

---

## Functional Cases — Installation & compatibility

---

### TC-CHK-101: Plugin appears in the Administration → Plugins list after installation

**User Role:** Admin
**Preconditions:** Plugin extracted into `/path/to/redmine/plugins` with its original folder name, `bundle install`
and `redmine:plugins:migrate` run, server restarted.
**Steps:**
1. Log in as Admin.
2. Go to Administration → Plugins.

**Expected Result:**
- "Redmineflux Checklist Plugin" is listed with a name, description, author and version.
- A **Configure** link is present next to it.

---

### TC-CHK-102: Database migration created the plugin's tables

**User Role:** Admin
**Steps:**
1. After running `RAILS_ENV=production bundle exec rails redmine:plugins:migrate`, restart the server.
2. Open any issue and scroll to the Checklist section.

**Expected Result:**
- The Checklist section renders without a 500 error.
- No `relation does not exist` / `Table doesn't exist` error appears in `log/production.log`.

---

### TC-CHK-103: Assets load correctly (CSS/JS precompile)

**User Role:** Any
**Steps:**
1. Open an issue with a checklist.
2. Inspect the browser console and Network tab.

**Expected Result:**
- No 404s for the plugin's CSS/JS assets.
- The checklist widget is styled (not raw unstyled markup) and its Actions menu opens — i.e. JS is bound.
- If assets 404, `RAILS_ENV=production bundle exec rake assets:precompile` + restart resolves it (KB note).

---

### TC-CHK-104: Plugin loads on each supported Redmine version

**User Role:** Admin
**Steps:**
1. Record the Redmine version under test (Administration → Information).
2. Confirm it falls inside the KB-declared support range.
3. Exercise create/edit/delete of one checklist.

**Expected Result:**
- Plugin loads and basic CRUD works on the declared version.
- **Negative:** on a Redmine version *outside* the declared range, any failure is a documented compatibility
  limitation, not a plugin defect — record the version rather than filing a bug.

---

## Functional Cases — Global configuration

---

### TC-CHK-105: Configure page opens and shows both tabs

**User Role:** Admin
**Steps:**
1. Administration → Plugins → Redmineflux Checklist Plugin → **Configure**.

**Expected Result:**
- The configuration page loads with a **General** tab and a **Checklist templates** tab.
- Current values of every setting are shown (not blank defaults) when settings were previously saved.

---

### TC-CHK-106: "Block issue closing" setting persists across a save/reload

**User Role:** Admin
**Steps:**
1. On the General tab, check **Block issue closing**.
2. Save.
3. Reload the Configure page.

**Expected Result:**
- A success message is shown.
- The checkbox remains checked after reload — the value was actually persisted, not just echoed back.

---

### TC-CHK-107: "Auto-calculate % done from checklist" setting persists

**User Role:** Admin
**Steps:**
1. On the General tab, toggle the auto-calculate progress setting.
2. Save and reload.

**Expected Result:**
- Setting persists. (Its functional effect is covered by TC-CHK-305.)

---

### TC-CHK-108: Settings are instance-wide, not per-project

**User Role:** Admin
**Steps:**
1. Enable **Block issue closing**.
2. Open issues in two different projects.

**Expected Result:**
- The behaviour applies in both projects — the setting is global, matching the KB's Administration-level placement.
- If it silently applies to only one project, that is a defect worth filing.

---

## Negative Cases

---

### TC-CHK-109: Plugin folder renamed on disk

**User Role:** Admin
**Steps:**
1. Rename the plugin directory under `plugins/` (the KB explicitly says *do not* change it).
2. Restart the server.

**Expected Result:**
- Failure is loud and diagnosable — a startup error or the plugin simply absent from the Plugins list — **not** a
  half-loaded plugin that renders broken issue pages.
- Restore the original folder name and confirm recovery.

---

### TC-CHK-110: Migration not run

**User Role:** Admin
**Steps:**
1. Install the plugin files but skip `redmine:plugins:migrate`.
2. Restart and open an issue.

**Expected Result:**
- A clear error pointing at the pending migration, or the checklist section absent — not an unhandled 500 that takes
  the whole issue page down. A 500 on the core issue page is a High-severity finding.

---

### TC-CHK-111: Configure page is not reachable by a non-admin

**User Role:** Developer / QA (non-admin)
**Steps:**
1. As a non-admin, request the plugin's settings URL directly
   (`/settings/plugin/<plugin_id>`) — do not rely on the Administration menu being hidden.

**Expected Result:**
- 403 Forbidden or a redirect to login — **not** the settings form.
- A hidden menu link alone does not pass this case; the URL itself must be blocked.

---

## Uninstallation

---

### TC-CHK-112: Clean uninstall

**User Role:** Admin
**Preconditions:** Database backup taken.
**Steps:**
1. Run `bundle exec rake redmine:plugins:migrate NAME=<plugin_name> VERSION=0 RAILS_ENV=production`.
2. Delete the plugin directory from `plugins/`.
3. Restart the server.

**Expected Result:**
- Redmine starts cleanly.
- Issues that previously had checklists open without error and show no orphaned checklist markup.
- The plugin is gone from Administration → Plugins.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
