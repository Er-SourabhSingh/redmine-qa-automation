# Test Cases — Redmineflux Inline Editor — Installation, Compatibility & Environment

> Source: vendor KB https://www.redmineflux.com/knowledge-base/plugins/inline-editor-plugin/ —
> "Version Compatibility", "Editor Compatibility", "Installation", "Configuration", "Troubleshooting",
> FAQ on browser/OS compatibility, "Uninstallation of Plugin".
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Inline Editor Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time — KB declares 4.0.x–4.2.x, 5.0.x, 5.1.x, 6.0.x)
- Path: plugins/redmineflux_inline_editor_qa

## Navigation methodology

This plugin has no configuration page of its own in the KB — it activates on the issue list and issue detail pages.
Reach them through real navigation: top menu **Issues** → hover a row, or click a ticket number.

---

## Functional Cases — Installation

---

### TC-INE-024: Plugin appears in Administration → Plugins

**User Role:** Admin
**Preconditions:** ZIP extracted into `plugins/` under its original folder name, `bundle install` and
`redmine:plugins:migrate` run, server restarted.
**Steps:**
1. Log in as Admin and open Administration → Plugins.

**Expected Result:**
- The Inline Editor plugin is listed with name, description, author and version.

---

### TC-INE-025: Migration completed cleanly

**User Role:** Admin
**Steps:**
1. Run the migration, restart, then open the issue list and an issue detail page.

**Expected Result:**
- Both render without error; no missing-table exception in `log/production.log`.

---

### TC-INE-026: Assets load correctly — the plugin is JS-dependent

**User Role:** Any
**Steps:**
1. Open the issue list and inspect the console and Network tab.
2. Hover an issue row.

**Expected Result:**
- No 404s for the plugin's CSS/JS.
- The pencil icon appears on hover — this plugin is entirely JavaScript-driven, so a missing asset makes the whole
  feature silently absent rather than visibly broken. Confirm by behaviour, not by the absence of an error.
- If assets 404, `RAILS_ENV=production bundle exec rake assets:precompile` plus a restart resolves it (KB note).

---

### TC-INE-027: Plugin functions on the Redmine version under test

**User Role:** Admin
**Steps:**
1. Record the version; confirm it is inside the KB range; perform one inline edit end to end.

**Expected Result:**
- Inline editing works on the declared version. Failures outside the declared range are compatibility limitations,
  recorded rather than filed.

---

### TC-INE-028: CKEditor integration

**User Role:** Member
**Preconditions:** CKEditor configured on the instance. The KB states the plugin is "fully compatible with
CKEditor" and that the customer supplies their own CKEditor licence.
**Steps:**
1. Open an issue and inline-edit the description.

**Expected Result:**
- The CKEditor toolbar loads inside the inline editing area.
- Formatting controls (headings, bullets, font styles, quotes) are present and functional, as the KB describes.
- No JavaScript error from a CKEditor/Redmine version mismatch.

---

### TC-INE-029: Behaviour with CKEditor absent

**User Role:** Member
**Preconditions:** Instance using Redmine's stock text formatting (Textile/Markdown) rather than CKEditor.
**Steps:**
1. Inline-edit a description.

**Expected Result:**
- Editing still works, falling back to a plain textarea with the instance's normal formatting rules.
- The plugin must not hard-require CKEditor and must not render a broken empty toolbar in its absence.

---

## Functional Cases — Cross-browser and environment

---

### TC-INE-030: Cross-browser compatibility

**User Role:** Member
**Steps:**
1. Perform the same inline edit (a status change and a description edit) in Chrome, Firefox and Edge.

**Expected Result:**
- Identical behaviour in all three, as claimed by the KB FAQ.
- Record any browser where the pencil icon does not appear or a save silently fails.

---

### TC-INE-031: Behaviour at narrow viewport widths

**User Role:** Member
**Steps:**
1. Repeat an inline edit on the issue list at 1280×720 and at a narrow/mobile width.

**Expected Result:**
- The hover affordance and the editing control remain reachable and do not overlap adjacent columns.
- Record any width at which the editor is clipped or unusable.

---

### TC-INE-032: Interaction with other Redmineflux plugins on the same page

**User Role:** Member
**Steps:**
1. On an issue that also carries Checklist, Tags and Agile Board widgets, perform inline edits of several fields.

**Expected Result:**
- No layout collision, z-index conflict, or double-binding of the same field.
- The KB's troubleshooting section explicitly calls out conflicts with "plugins that modify the same fields", so a
  conflict here is an anticipated finding — file it against whichever plugin intrudes.
- Note for triage: error toasts raised by *other* plugins but surfaced through this plugin's inline save wrapper
  belong to this plugin only if the wrapper itself mangles the message.

---

## Negative Cases

---

### TC-INE-033: Plugin folder renamed on disk

**User Role:** Admin
**Steps:**
1. Rename the plugin directory (the KB says not to) and restart.

**Expected Result:**
- Loud, diagnosable failure — not a half-loaded plugin that leaves the issue list partly interactive.
  Restore and confirm recovery.

---

### TC-INE-034: Migration not run

**User Role:** Admin
**Steps:**
1. Install the files, skip the migration, restart, open the issue list.

**Expected Result:**
- A clear error, or the feature simply inert — **not** a 500 on the core issue list, which would be High severity.

---

### TC-INE-035: JavaScript disabled in the browser

**User Role:** Member
**Steps:**
1. Disable JavaScript and open the issue list and an issue.

**Expected Result:**
- Redmine's own pages still work and the standard Edit form is still reachable.
- The plugin degrades to absent, not to broken controls that do nothing when clicked.

---

### TC-INE-036: Stale cache after a plugin change

**User Role:** Admin
**Steps:**
1. After updating the plugin, load a page without clearing caches, then clear and restart as the KB advises.

**Expected Result:**
- Any stale-asset symptom is resolved by the documented cache-clear and restart. Record what the symptom looked
  like, since this is the KB's first troubleshooting instruction.

---

## Uninstallation

---

### TC-INE-037: Clean uninstall

**User Role:** Admin
**Preconditions:** Database backup taken.
**Steps:**
1. Run `bundle exec rake redmine:plugins:migrate NAME=<plugin_name> VERSION=0 RAILS_ENV=production`.
2. Delete the plugin directory and restart.

**Expected Result:**
- Redmine starts cleanly. The issue list and issue detail pages revert to stock behaviour with the normal Edit form.
- No orphaned pencil icons or dead click targets remain.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
