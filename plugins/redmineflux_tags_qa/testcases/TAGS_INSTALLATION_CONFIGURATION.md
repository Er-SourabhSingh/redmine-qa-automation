# Test Cases — Redmineflux Tag Plugin — Installation, Compatibility & Configuration

> Source: vendor KB https://www.redmineflux.com/knowledge-base/plugins/tag-plugin/ — sections
> "Version Compatibility", "Installation", "Configuration", "Troubleshooting", "Uninstallation of Plugin".
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Tag Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time — KB declares 4.0.x–4.2.x, 5.0.x, 5.1.x, 6.0.x)
- Path: plugins/redmineflux_tags_qa

## Navigation methodology

Administration → Plugins → **Redmineflux Tag Plugin** → **Configure**. Verify each setting by its effect in the
issue UI, not by the settings page reporting success.

> **Warning:** these cases change instance-wide settings. Record original values and restore them afterwards.

---

## Functional Cases — Installation

---

### TC-TAG-028: Plugin appears in Administration → Plugins after installation

**User Role:** Admin
**Priority:** High
**Preconditions:** ZIP extracted into `plugins/` under its original folder name, `bundle install` and
`redmine:plugins:migrate` run, server restarted.
**Steps:**
1. Log in as Admin and open Administration → Plugins.

**Expected Result:**
- The Tag Plugin is listed with name, description, author and version, and has a **Configure** link.

---

### TC-TAG-029: Migration created the tag tables

**User Role:** Admin
**Priority:** High
**Steps:**
1. After migrating and restarting, open the New Issue form.

**Expected Result:**
- The **Tags** field renders without error and no missing-table exception appears in `log/production.log`.

---

### TC-TAG-030: Assets load correctly

**User Role:** Any
**Priority:** High
**Steps:**
1. Open the New Issue form and inspect the browser console and Network tab.

**Expected Result:**
- No 404s for the plugin's CSS/JS.
- The Tags field behaves as a tag input (autocomplete, chips, Enter-to-add), not a plain text box — i.e. JS bound.
- If assets 404, `rake assets:precompile` plus a restart resolves it, per the KB note.

---

### TC-TAG-031: Plugin functions on the Redmine version under test

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Record the Redmine version from Administration → Information.
2. Confirm it is inside the KB-declared range and exercise one tag create/assign/remove cycle.

**Expected Result:**
- Basic tagging works on the declared version. Failures outside the declared range are compatibility limitations,
  recorded rather than filed.

---

## Functional Cases — Configuration

---

### TC-TAG-032: Configure page opens and shows tag settings

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Administration → Plugins → Tag Plugin → Configure.

**Expected Result:**
- The configuration page loads and shows the **Tag Color** default setting and the **Manage Tags** section.
- Previously saved values are shown, not blank defaults.

---

### TC-TAG-033: Default Tag Color setting persists and applies

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Set the default Tag Color to a distinctive value; save.
2. Reload the Configure page.
3. Create a **new** tag on an issue without assigning it a specific colour.

**Expected Result:**
- The setting persists across the reload.
- The new tag renders in the configured default colour on the issue page and in the issue list column.

---

### TC-TAG-034: Tags with an explicit colour are not overridden by the default

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Assign a specific colour to one tag.
2. Change the instance default colour to something different.

**Expected Result:**
- The explicitly coloured tag keeps its own colour. Only tags without one follow the default —
  matching the KB's description of the setting.

---

### TC-TAG-035: Colour change is visible everywhere a tag renders

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Change a tag's colour, then view it on the issue detail page, in the issue list Tag column, in the filter
   dropdown, and on the tag's own entity-listing page.

**Expected Result:**
- The colour is consistent in all four places. A colour that applies in one view but not another is a defect.

---

## Negative Cases

---

### TC-TAG-036: Invalid colour value

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Enter an invalid colour (e.g. `notacolour`, `#GGGGGG`, an empty string) as the default and save.

**Expected Result:**
- Rejected with a validation message, or safely coerced to a documented fallback.
- Tags must never render invisible (e.g. white-on-white) or break the page CSS as a result.

---

### TC-TAG-037: Plugin folder renamed on disk

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Rename the plugin directory (the KB explicitly says not to) and restart.

**Expected Result:**
- Failure is loud and diagnosable, not a half-loaded plugin that breaks the issue form. Restore and confirm recovery.

---

### TC-TAG-038: Migration not run

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Install files but skip the migration; restart; open an issue.

**Expected Result:**
- A clear error about the pending migration, or the Tags field simply absent — **not** a 500 that takes down the
  core issue page. A 500 here is High severity.

---

### TC-TAG-039: Configure page is not reachable by a non-admin

**User Role:** Developer / QA / Reporter
**Priority:** High
**Steps:**
1. Request `/settings/plugin/<plugin_id>` directly as each non-admin role. Do not rely on the menu being hidden.

**Expected Result:**
- 403 or redirect to login for every non-admin. This is the leg that matters — a hidden Administration link proves
  nothing on its own.

---

### TC-TAG-040: Conflicting plugin check

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. With other plugins that render on the issue form installed (Checklist, Agile Board, Inline Editor), open an
   issue and inspect the layout of the Tags field.

**Expected Result:**
- No overlap, clipping or z-index collision between the tag input/autocomplete and other plugins' widgets.
- Record any layout conflict against the plugin whose element intrudes.

---

## Uninstallation

---

### TC-TAG-041: Clean uninstall

**User Role:** Admin
**Priority:** Medium
**Preconditions:** Database backup taken.
**Steps:**
1. Run `bundle exec rake redmine:plugins:migrate NAME=<plugin_name> VERSION=0 RAILS_ENV=production`.
2. Delete the plugin directory and restart.

**Expected Result:**
- Redmine starts cleanly. Previously tagged issues open without error and show no orphaned tag markup.
- The plugin is gone from Administration → Plugins.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
