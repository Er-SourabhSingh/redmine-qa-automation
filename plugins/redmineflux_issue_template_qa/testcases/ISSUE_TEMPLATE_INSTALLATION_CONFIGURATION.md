# Test Cases — Redmineflux Issue Template — Installation, Compatibility & Environment

> Source: vendor KB https://www.redmineflux.com/knowledge-base/plugins/issue-template-plugin/ —
> "Version Compatibility", "Editor Compatibility", "Installation", "Configuration", "Troubleshooting",
> "Uninstallation of Plugin".
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Issue Template Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time — KB declares 4.0.x–4.2.x, 5.0.x, 5.1.x, 6.0.x)
- Path: plugins/redmineflux_issue_template_qa

## Navigation methodology

Reach the two entry points through real navigation: **Administration → Issue Template** for global templates, and
**Project → Issue Template tab** for project ones. Do not jump straight to a deep URL.

---

## Functional Cases — Installation

---

### TC-RIT-101: Plugin appears in Administration → Plugins

**User Role:** Admin
**Preconditions:** ZIP extracted into `plugins/` under its original folder name, `bundle install` and
`redmine:plugins:migrate` run, server restarted.
**Steps:**
1. Log in as Admin and open Administration → Plugins.

**Expected Result:**
- The Issue Template plugin is listed with name, description, author and version.

---

### TC-RIT-102: Both entry points appear after installation

**User Role:** Admin
**Steps:**
1. Open the Administration area and look for an **Issue Template** section.
2. Open any project and look for an **Issue Template** tab.

**Expected Result:**
- Both are present. The plugin adds navigation at two levels, and a build where only one appears is a defect that
  blocks half the feature set.
- If the project tab is missing, check whether it is gated behind a project module first and record that — the KB
  does not mention a module, so a hidden module requirement is itself a documentation gap.

---

### TC-RIT-103: Assets load correctly

**User Role:** Any
**Steps:**
1. Open the Add Issue Template form and inspect the console and Network tab.

**Expected Result:**
- No 404s for the plugin's CSS/JS.
- The Project list renders as an interactive multi-select with working keypress auto-scroll — i.e. JS is bound.
- If assets 404, `RAILS_ENV=production bundle exec rake assets:precompile` plus a restart resolves it (KB note).

---

### TC-RIT-104: Plugin functions on the Redmine version under test

**User Role:** Admin
**Steps:**
1. Record the version from Administration → Information; confirm it is inside the KB range.
2. Create, apply and delete one template end to end.

**Expected Result:**
- The full cycle works on the declared version. Failures outside the declared range are compatibility limitations,
  recorded rather than filed.

---

## Functional Cases — Editor compatibility

---

### TC-RIT-105: CKEditor renders in the Issue description field

**User Role:** Admin
**Preconditions:** CKEditor configured on the instance.
**Steps:**
1. Open the Add Issue Template form and click into **Issue description**.

**Expected Result:**
- The CKEditor toolbar loads and formatting controls work.
- Formatting applied here survives into the template and then onto the created issue (covered end to end by
  TC-RIT-507).

---

### TC-RIT-106: Behaviour with CKEditor absent

**User Role:** Admin
**Preconditions:** Instance using Redmine's stock Textile/Markdown formatting.
**Steps:**
1. Open the Add Issue Template form and enter a description.

**Expected Result:**
- A usable plain textarea with the instance's normal formatting rules.
- The plugin must not hard-require CKEditor, and must not render an empty broken toolbar in its absence.
- The KB makes the CKEditor licence the customer's responsibility, so an instance without it is a supported
  configuration, not an edge case.

---

## Negative Cases

---

### TC-RIT-107: Plugin folder renamed on disk

**User Role:** Admin
**Steps:**
1. Rename the plugin directory (the KB says not to) and restart.

**Expected Result:**
- Loud, diagnosable failure — not a half-loaded plugin that leaves a dead Issue Template tab. Restore and confirm
  recovery.

---

### TC-RIT-108: Migration not run

**User Role:** Admin
**Steps:**
1. Install the files, skip the migration, restart, then open the Issue Template page and the New Issue form.

**Expected Result:**
- A clear error about the pending migration, or the feature simply absent.
- **The New Issue form must still work.** A plugin that breaks core issue creation because its own tables are
  missing is a Critical defect — issue creation is the most important flow in Redmine.

---

### TC-RIT-109: Administration section is not reachable by a non-admin

**User Role:** Manager, Developer, QA, Reporter (each in turn)
**Steps:**
1. Request the Administration → Issue Template URL directly for each role. Do not rely on the menu being hidden.

**Expected Result:**
- 403 or redirect to login for every non-admin. A hidden Administration link proves nothing on its own.

---

### TC-RIT-110: Stale cache after a plugin change

**User Role:** Admin
**Steps:**
1. After updating the plugin, load a page without clearing caches, then clear caches and restart as the KB advises.

**Expected Result:**
- Any stale-asset symptom resolves with the documented cache-clear and restart. Record what the symptom was.

---

### TC-RIT-111: Conflicts with other plugins on the New Issue form

**User Role:** Member
**Preconditions:** Checklist, Tags and Inline Editor plugins also installed.
**Steps:**
1. Open New Issue and confirm the template pre-selection coexists with the other plugins' fields.

**Expected Result:**
- No layout collision and no plugin overwriting another's pre-filled values.
- The template's pre-filled description must not be clobbered by another plugin's own description handling —
  this is the most likely cross-plugin failure on this form.

---

### TC-RIT-112: Template data survives a Redmine upgrade path

**User Role:** Admin
**Steps:**
1. If a minor Redmine upgrade is available in the test environment, re-run the plugin migration afterwards and
   reopen the template list.

**Expected Result:**
- Existing templates are intact and still applicable. Record the before/after template count.

---

### TC-RIT-113: Behaviour when all trackers are deleted or renamed

**User Role:** Admin
**Steps:**
1. Rename a tracker that a template is bound to, then reopen the template list and the New Issue form.

**Expected Result:**
- The template follows the tracker by ID, not by name, and still pre-selects correctly.
- If a tracker bound to a template is deleted, the template must not orphan into a state that breaks the template
  list or the New Issue form. Record exactly what happens — an unhandled orphan here would break issue creation.

---

## Uninstallation

---

### TC-RIT-114: Clean uninstall

**User Role:** Admin
**Preconditions:** Database backup taken.
**Steps:**
1. Run `bundle exec rake redmine:plugins:migrate NAME=<plugin_name> VERSION=0 RAILS_ENV=production`.
2. Delete the plugin directory and restart.

**Expected Result:**
- Redmine starts cleanly and the New Issue form works normally.
- Issues previously created from templates are unaffected — their subject and description are their own data.
- Both the Administration section and the project tab are gone.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
