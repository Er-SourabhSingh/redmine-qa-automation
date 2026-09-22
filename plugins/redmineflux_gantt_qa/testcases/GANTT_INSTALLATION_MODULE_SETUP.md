# Test Cases — Redmineflux Gantt Chart — Installation, Module Setup & Plugin Settings

> Source: vendor KB https://www.redmineflux.com/knowledge-base/plugins/gantt-chart/ — "Version Compatibility",
> "Installation", "Configuration", "How to Enable Flux Gantt for a Project", "How to Open Project Flux Gantt",
> "Troubleshooting", "Uninstallation", FAQ Q1 and Q10.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Gantt Chart Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time — KB declares 5.0.x, 5.1.x, 6.0.x only; **note this plugin does not
  claim Redmine 4.x support**, unlike most other Redmineflux plugins)
- Path: plugins/redmineflux_gantt_qa

## Navigation methodology

Administration → Plugins → **Redmineflux Gantt Plugin** → **Configure** for plugin-level settings;
Project → Settings → Modules for the module. Reach the chart by clicking **Flux Gantt** in the project menu or the
top menu, never by typing the URL.

---

## Functional Cases — Installation

---

### TC-GNT-077: Plugin folder name is enforced

**User Role:** Admin
**Preconditions:** Archive extracted to `Redmine/plugins/redmineflux_gantt_plugin`.
**Steps:**
1. Confirm the folder is named exactly `redmineflux_gantt_plugin`.
2. Run `bundle install` and the plugin migration with `NAME=redmineflux_gantt_plugin`.
3. Restart (e.g. `touch tmp/restart.txt`).
4. Open Administration → Plugins.

**Expected Result:**
- "Redmineflux Gantt Plugin" is listed with name, description, author and version.
- The KB names the folder explicitly and lists a wrong folder name as the **first** troubleshooting step, so this
  is a real prerequisite, not boilerplate.

---

### TC-GNT-078: Named migration runs cleanly

**User Role:** Admin
**Steps:**
1. Run `RAILS_ENV=production bundle exec rake redmine:plugins:migrate NAME=redmineflux_gantt_plugin`.
2. Restart and open a project.

**Expected Result:**
- Migration completes without error and no missing-table exception appears in `log/production.log`.

---

### TC-GNT-079: Assets load — the chart is entirely JS-driven

**User Role:** Any
**Steps:**
1. Open a Flux Gantt view and inspect the console and Network tab.

**Expected Result:**
- No 404s for the plugin's CSS/JS.
- The chart renders bars and the toolbar responds. A missing asset leaves an empty container rather than a visible
  error, so confirm by behaviour.
- If assets 404, `RAILS_ENV=production bundle exec rake assets:precompile` plus a restart resolves it (KB note).

---

### TC-GNT-080: Redmine version support boundary

**User Role:** Admin
**Steps:**
1. Record the Redmine version from Administration → Information.

**Expected Result:**
- It is 5.0.x, 5.1.x or 6.0.x. The KB's FAQ Q10 confirms Redmine 6 is supported.
- **On a Redmine 4.x instance this plugin is out of declared support** — record that fact rather than filing
  failures as defects. This differs from the other Redmineflux plugins and is easy to get wrong.

---

## Functional Cases — Module and menu

---

### TC-GNT-081: Enable the Flux Gantt Chart module on a project

**User Role:** Admin or a user with project-settings permission
**Steps:**
1. Open a project → Settings → **Modules**.
2. Tick **Flux Gantt Chart** and save.

**Expected Result:**
- The project menu now shows **Flux Gantt**.
- Before enabling, the menu entry is absent — confirm both states, not just the enabled one.

---

### TC-GNT-082: Project Flux Gantt opens from the project menu

**User Role:** Member with View Flux Gantt
**Steps:**
1. Click **Flux Gantt** in the project menu.

**Expected Result:**
- The chart loads with the left panel and the timeline grid.
- The KB documents two paths, `/projects/:project_id/flux_gantt` and `/projects/:project_id/project_gantt`;
  confirm the menu link reaches a working view and record which path it uses.

---

### TC-GNT-083: Releases load first, issues lazy-load on expand

**User Role:** Member
**Steps:**
1. Open the project Gantt on a project with several releases and many issues.
2. Watch the Network tab while expanding one release.

**Expected Result:**
- The initial load returns releases only; issues are fetched when a release is expanded, as the KB describes.
- This is a stated performance design, so a first load that pulls every issue is a defect worth recording on a
  large project.

---

### TC-GNT-084: Flux Gantt does not replace Redmine's native Gantt

**User Role:** Member
**Steps:**
1. With the module enabled, look for both the native Gantt and the Flux Gantt entries.

**Expected Result:**
- Both exist independently, as KB FAQ Q1 states. The native Gantt still works.

---

### TC-GNT-085: Disabling the module removes access

**User Role:** Manager
**Steps:**
1. Untick **Flux Gantt Chart** in Project → Settings → Modules and save.
2. Confirm the menu entry is gone.
3. Request the project Gantt URL **directly**.

**Expected Result:**
- The menu entry is gone **and** the direct URL is refused. A hidden menu whose URL still serves the chart is a
  real access defect, not a cosmetic one.
- Re-enabling the module restores the view with its releases and baselines intact — no data lost while disabled.

---

## Functional Cases — Plugin-level settings

---

### TC-GNT-086: Configure page loads and shows "Show closed projects"

**User Role:** Admin
**Steps:**
1. Administration → Plugins → Redmineflux Gantt Plugin → Configure.

**Expected Result:**
- The page loads showing the **Show closed projects** setting and the note that most display options live in the
  chart's own settings panel.
- The current value is shown, not a blank default.

---

### TC-GNT-087: "Show closed projects" controls Global Gantt contents

**User Role:** Admin
**Preconditions:** At least one closed project with the module enabled.
**Steps:**
1. With the setting off, open Global Flux Gantt and note whether the closed project appears.
2. Enable the setting, save, reopen Global Flux Gantt.

**Expected Result:**
- The closed project appears only when the setting is enabled.
- The KB lists this setting as the explanation for "Global Gantt shows no projects", so its effect must be
  observable — a setting that saves but changes nothing is a defect.

---

### TC-GNT-088: Setting persists across save and reload

**User Role:** Admin
**Steps:**
1. Toggle the setting, save, reload the Configure page.

**Expected Result:**
- The new value is still selected.

---

## Negative Cases

---

### TC-GNT-089: Wrong plugin folder name

**User Role:** Admin
**Steps:**
1. Rename the folder away from `redmineflux_gantt_plugin` and restart.

**Expected Result:**
- The plugin is absent from Administration → Plugins, or fails loudly.
- It must not half-load into a state where the menu entry exists but the chart 500s. Restore the name and confirm
  recovery.

---

### TC-GNT-090: Migration not run

**User Role:** Admin
**Steps:**
1. Install the files, skip the migration, restart, open a project and the project Gantt.

**Expected Result:**
- A clear error or the feature absent — **the project's other pages must still work.** A plugin whose missing
  tables break the project overview is a Critical defect.

---

### TC-GNT-091: Configure page is not reachable by a non-admin

**User Role:** Manager, Developer, QA, Reporter (each in turn)
**Steps:**
1. Request the plugin settings URL directly for each role. Do not rely on the menu being hidden.

**Expected Result:**
- 403 or redirect to login for every non-admin. "Show closed projects" is instance-wide.

---

### TC-GNT-092: Module enabled but no releases exist

**User Role:** Member
**Steps:**
1. Open the Gantt on a project with no versions at all.

**Expected Result:**
- A clean empty state with the **Add Release** action available, not an error or a blank page.
- This is the KB's documented "chart loads but no releases appear" scenario.

---

### TC-GNT-093: Module enabled but the role lacks View Flux Gantt

**User Role:** Member of a role without the permission
**Steps:**
1. Confirm no Flux Gantt menu entry appears.
2. Request the project Gantt URL directly.
3. Request the chart's data endpoint directly.

**Expected Result:**
- All three refused. The KB states directly that users without View Flux Gantt "cannot view or mutate chart data"
  and that direct API requests enforce permission checks — this case verifies that claim rather than assuming it.

---

### TC-GNT-094: Chart on a project with a very large number of issues

**User Role:** Member
**Steps:**
1. Open the Gantt on a project with several thousand issues and expand all releases.

**Expected Result:**
- The view remains usable; lazy loading keeps the initial render responsive.
- Record initial load time and expand-all time. A browser hang is a performance defect against the KB's explicit
  "keeps large projects responsive" claim.

---

## Uninstallation

---

### TC-GNT-095: Clean uninstall

**User Role:** Admin
**Preconditions:** **Database backup taken** — the KB requires this before rollback.
**Steps:**
1. Run `bundle exec rake redmine:plugins:migrate NAME=redmineflux_gantt_plugin VERSION=0 RAILS_ENV=production`.
2. Remove `plugins/redmineflux_gantt_plugin` and restart.

**Expected Result:**
- Redmine starts cleanly and projects open normally.
- Versions and issues are untouched — only plugin-owned data (baselines, per-user chart settings) is removed.
- The Flux Gantt menu entries are gone from both the project and top menus.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
