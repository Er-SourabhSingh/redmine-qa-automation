# Test Cases — Redmineflux Mentions — Installation, Compatibility & Symbol Configuration

> Source: vendor KB https://www.redmineflux.com/knowledge-base/plugins/mentions-plugin/ — "Version Compatibility",
> "Installation", "Configuration", "How to Customize the Mention Symbol", "Troubleshooting", "Uninstallation".
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Mentions Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time — KB declares 4.0.x–4.2.x, 5.0.x, 5.1.x, 6.0.x)
- Path: plugins/redmineflux_mentions_qa

## Navigation methodology

Administration → Plugins → **Redmineflux Mentions Plugin** → **Configure**. Verify every setting by its effect in
the issue and wiki editors, not by the settings page reporting success.

> **Warning:** the mention symbol is instance-wide. Record its original value and restore it when the suite ends,
> or every later suite runs against a different symbol.

---

## Functional Cases — Installation

---

### TC-MEN-101: Plugin appears in Administration → Plugins

**User Role:** Admin
**Preconditions:** ZIP extracted into `plugins/` under its original folder name, `bundle install` and
`redmine:plugins:migrate` run, server restarted.
**Steps:**
1. Log in as Admin and open Administration → Plugins.

**Expected Result:**
- The Mentions plugin is listed with name, description, author and version, and has a **Configure** link.

---

### TC-MEN-102: Migration completed cleanly

**User Role:** Admin
**Steps:**
1. Run the migrate command, restart, then open an issue and a wiki page.

**Expected Result:**
- Both render without error and `log/production.log` shows no missing-table exception.

---

### TC-MEN-103: Assets load correctly

**User Role:** Any
**Steps:**
1. Open the issue edit form and the wiki editor; inspect the console and Network tab.

**Expected Result:**
- No 404s for the plugin's CSS/JS.
- If assets 404, `RAILS_ENV=production bundle exec rake assets:precompile` plus a restart resolves it (KB note).

---

### TC-MEN-104: Plugin functions on the Redmine version under test

**User Role:** Admin
**Steps:**
1. Record the version from Administration → Information; confirm it is within the KB range.
2. Perform one mention end to end.

**Expected Result:**
- Works on the declared version. Failures outside the declared range are compatibility limitations, recorded
  rather than filed as defects.

---

## Functional Cases — Symbol configuration

---

### TC-MEN-105: Configure page opens and shows the symbol setting

**User Role:** Admin
**Steps:**
1. Administration → Plugins → Mentions → Configure.

**Expected Result:**
- The page loads showing **Select Mention Symbol** with the current value selected, not a blank default.

---

### TC-MEN-106: All six documented symbols are offered

**User Role:** Admin
**Steps:**
1. Open the symbol dropdown and enumerate its options.

**Expected Result:**
- Exactly the six documented options are present: `@`, `$`, `:`, `~`, `!`, `%`.
- A missing option is a defect against the KB; an extra undocumented option is a documentation gap to record.

---

### TC-MEN-107: Changing the symbol takes effect after a restart

**User Role:** Admin
**Steps:**
1. Change the symbol from `@` to `%`; save.
2. **Before** restarting, mention a user with `%username` on an issue and record what happens.
3. Restart Redmine.
4. Repeat the `%username` mention.

**Expected Result:**
- After the restart the `%` mention is recognised and notifies.
- Step 2 establishes whether the restart is genuinely required, as the KB claims. Either answer is useful: if it
  works without a restart the documentation is wrong; if it half-works (saved but not parsed) that is a defect.

---

### TC-MEN-108: The setting persists across a save and reload

**User Role:** Admin
**Steps:**
1. Change the symbol, save, reload the Configure page.

**Expected Result:**
- The new symbol is still selected. A success message that does not actually persist is a defect.

---

### TC-MEN-109: The old symbol stops triggering mentions after a change

**User Role:** Admin + Member
**Steps:**
1. With the symbol set to `%` and the server restarted, type `@username` in a new issue note and save.

**Expected Result:**
- No mention is triggered and no email is sent — `@` is now ordinary text.
- If both symbols still work, the setting is additive rather than exclusive; record this, as it changes the
  meaning of every negative case in this suite.

---

### TC-MEN-110: Content written with the old symbol is not retroactively broken

**User Role:** Member
**Steps:**
1. Create an issue note containing `@username` while the symbol is `@`.
2. Change the symbol to `%`, restart.
3. Reopen the issue.

**Expected Result:**
- The historic note still renders readably. The `@username` text is intact, whether or not it still renders as a
  live mention.
- It must not render as broken markup, an unresolved placeholder, or an exception.

---

## Negative Cases

---

### TC-MEN-111: Plugin folder renamed on disk

**User Role:** Admin
**Steps:**
1. Rename the plugin directory (the KB says not to) and restart.

**Expected Result:**
- Loud, diagnosable failure — not a half-loaded plugin that breaks the issue editor. Restore and confirm recovery.

---

### TC-MEN-112: Migration not run

**User Role:** Admin
**Steps:**
1. Install the files, skip the migration, restart, open an issue.

**Expected Result:**
- A clear error about the pending migration, or the feature simply inert — **not** a 500 on the core issue page,
  which would be High severity.

---

### TC-MEN-113: Configure page is not reachable by a non-admin

**User Role:** Manager, Developer, QA, Reporter (each in turn)
**Steps:**
1. Request `/settings/plugin/<plugin_id>` directly for each role. Do not rely on the Administration menu being
   hidden.

**Expected Result:**
- 403 or redirect to login for every non-admin. A hidden menu link alone does not pass this case.

---

### TC-MEN-114: Symbol that collides with existing Redmine syntax

**User Role:** Admin + Member
**Steps:**
1. Set the symbol to `:` — which also opens Redmine's emoji/textile syntax in some versions.
2. Write content containing `:username`, `:smile:` and a plain time value like `10:30`.

**Expected Result:**
- Only the intended mention is parsed. `10:30` must not become a mention attempt, and emoji/textile rendering must
  not break.
- This is the most collision-prone of the six documented symbols and is worth a careful record either way.

---

### TC-MEN-115: Symbol that collides with Redmine's own wiki links

**User Role:** Member
**Steps:**
1. Set the symbol to `!` and write wiki content containing `!image.png!` (Textile image syntax) alongside
   `!username`.

**Expected Result:**
- Image syntax still renders as an image; the mention still resolves. Neither feature breaks the other.

---

### TC-MEN-116: Symbol left unset

**User Role:** Admin
**Steps:**
1. If the dropdown allows a blank selection, save with nothing chosen.

**Expected Result:**
- Rejected with a validation message, or falls back to a documented default.
- The plugin must not end up in a state where no symbol triggers a mention and no error explains why.

---

## Uninstallation

---

### TC-MEN-117: Clean uninstall

**User Role:** Admin
**Preconditions:** Database backup taken.
**Steps:**
1. Run `bundle exec rake redmine:plugins:migrate NAME=<plugin_name> VERSION=0 RAILS_ENV=production`.
2. Delete the plugin directory and restart.

**Expected Result:**
- Redmine starts cleanly.
- Issues and wiki pages that contained mentions still open and still show the original text.
- The plugin is gone from Administration → Plugins.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
