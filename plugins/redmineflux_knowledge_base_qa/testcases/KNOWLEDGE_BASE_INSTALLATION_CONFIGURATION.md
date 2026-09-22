# Test Cases — Redmineflux Knowledge Base — Installation, Module Setup & Plugin Settings

> Source: vendor KB — "Version Compatibility", "Installation", "Configuration" (General / Public Access /
> Templates tabs), "How to Enable the Knowledge Base Module in a Project", "Troubleshooting", "Uninstallation".
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Knowledge Base Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time — KB declares **5.1.x and 6.0.x only**; Ruby 3.0+; `rack-attack ~> 6.7`)
- Path: plugins/redmineflux_knowledge_base_qa

## Navigation methodology

Administration → Plugins → **Redmineflux Knowledgebase Plugin** → **Configure**;
Project → Settings → Modules for the module. Reach the knowledge base by clicking its project-menu entry.

> **Record the environment at the top of every run:** Rails environment (production / development / test) and the
> configured `Rails.cache` store. The rate-limiting cases in the public-URL suite are **invalid** on a development
> instance or with `MemoryStore`, and this is the plugin's own documented caveat.

---

## Functional Cases — Installation

---

### TC-RKB-075: Plugin appears in Administration → Plugins

**User Role:** Admin
**Preconditions:** Plugin placed at `plugins/redmineflux_knowledgebase`, `bundle install` run, migrations run,
server restarted.
**Steps:**
1. Open Administration → Plugins.

**Expected Result:**
- "Redmineflux Knowledgebase Plugin" is listed with name, description, author and version, and has a **Configure**
  link.

---

### TC-RKB-076: Migrations complete cleanly

**User Role:** Admin
**Steps:**
1. Run `RAILS_ENV=production bundle exec rake redmine:plugins:migrate`, restart, open a project's Knowledge Base.

**Expected Result:**
- No missing-table exception in `log/production.log`; the sidebar renders.

---

### TC-RKB-077: Assets load

**User Role:** Any
**Steps:**
1. Open the Knowledge Base view and the page editor; inspect the console and Network tab.

**Expected Result:**
- No 404s for the plugin's CSS/JS. The WYSIWYG editor initialises, the sidebar search responds, and dropdown menus
  open — this plugin is heavily JS-dependent, so confirm by behaviour.
- If assets 404, `rake assets:precompile` plus a restart resolves it (KB note).

---

### TC-RKB-078: Redmine and Ruby version boundary

**User Role:** Admin
**Steps:**
1. Record the Redmine version (Administration → Information) and the Ruby version.

**Expected Result:**
- Redmine is **5.1.x or 6.0.x** and Ruby is **3.0+**.
- Note that this plugin's supported range is narrower than most of the Redmineflux set — it excludes 4.x **and
  5.0.x**. On an out-of-range instance, failures are compatibility limitations to record, not defects to file.

---

### TC-RKB-079: rack-attack dependency is installed

**User Role:** Admin
**Steps:**
1. Confirm `rack-attack ~> 6.7` is present in the bundle.
2. Check `log/production.log` at startup for any missing-gem warning.

**Expected Result:**
- The gem is installed. The KB names it as a hard dependency and lists its absence as a cause of rate limiting not
  working.
- If the gem is missing, the plugin must fail clearly rather than silently serving public URLs **with no throttling
  at all** — that silent-degradation case is a genuine security concern and is worth recording explicitly.

---

## Functional Cases — Project module

---

### TC-RKB-080: Enabling the module adds the project menu entry

**User Role:** Admin or Manager
**Steps:**
1. Project → Settings → **Modules** → tick **Knowledge Base** → Save.

**Expected Result:**
- A **Knowledge Base** entry appears in the project menu.
- Before enabling it is absent — confirm both states.

---

### TC-RKB-081: Disabling the module removes access

**User Role:** Manager
**Steps:**
1. Untick the module and save.
2. Confirm the menu entry is gone.
3. Request the knowledge base URL and a page URL **directly**.
4. If a page had a public URL enabled, retry that public link.

**Expected Result:**
- Menu gone **and** the direct URLs refused.
- **Record what happens to the public link.** A public URL that keeps serving content after the module is disabled
  means the administrator's most obvious "turn it off" action does not actually stop external access — a
  High-severity finding.
- Re-enabling restores everything with no data loss.

---

## Functional Cases — General settings

---

### TC-RKB-082: Configure page shows all three tabs

**User Role:** Admin
**Steps:**
1. Open the plugin's Configure page.

**Expected Result:**
- **General**, **Public Access** and **Templates** tabs are present, per the KB.
- Current values are shown, not blank defaults.

---

### TC-RKB-083: "Mention users" toggle controls @mention support

**User Role:** Admin then Member
**Steps:**
1. Disable **Mention users**; save; open the page editor and type `@`.
2. Re-enable and repeat.

**Expected Result:**
- With it off, no mention dropdown appears and publishing sends no mention emails.
- With it on, both work. The setting's effect must be observable in the editor, not just stored.

---

### TC-RKB-084: "Mention issues" toggle controls #issue linking

**User Role:** Admin then Member
**Steps:**
1. Disable **Mention issues**; save; type `#` in the editor.
2. Publish a page containing an existing `#` reference and check the issue's Related Knowledge Base Pages section.

**Expected Result:**
- With it off, no issue dropdown appears and no new links are created.
- Record whether **existing** links survive the toggle. Silently dropping already-established issue links would be
  a data-loss defect, not a feature toggle.

---

### TC-RKB-085: Public access master toggle

**User Role:** Admin then external visitor
**Steps:**
1. Disable **Enable public access**; save.
2. Retry an existing public URL from an unauthenticated session.
3. Attempt to enable a public URL on a published page.

**Expected Result:**
- The existing public link stops working, and the Enable Public Access action is unavailable.
- This is the master kill switch for the plugin's only unauthenticated surface — it must work immediately and
  completely. Remember the 10-minute browser cache when verifying (use a fresh session).

---

### TC-RKB-086: Rate-limit settings persist and show documented defaults

**User Role:** Admin
**Steps:**
1. On a fresh install, record the default **Requests per minute** and **Aggressive limit per hour**.
2. Change both, save, reload the Configure page.

**Expected Result:**
- Defaults are **30/minute** and **100/hour**, as documented.
- Changed values persist.

---

### TC-RKB-087: Rate-limit changes take effect without a restart

**User Role:** Admin
**Steps:**
1. Change the per-minute limit to a low value, save, and wait 60 seconds.
2. Exercise a public URL past the new limit.

**Expected Result:**
- The new limit applies **within 60 seconds and without a server restart**, exactly as the KB states.
- A change that requires a restart contradicts documented behaviour and matters operationally — an admin
  responding to abuse expects it to take effect immediately.

---

## Negative Cases

---

### TC-RKB-088: Wrong plugin folder name

**User Role:** Admin
**Steps:**
1. Rename the folder away from `redmineflux_knowledgebase` and restart.

**Expected Result:**
- The plugin is absent or fails loudly — not half-loaded with a dead menu entry. Restore and confirm recovery.

---

### TC-RKB-089: Migrations not run

**User Role:** Admin
**Steps:**
1. Install the files, skip the migrations, restart, open a project.

**Expected Result:**
- A clear error or the feature absent. **The project's other pages must still work.**

---

### TC-RKB-090: Configure page is not reachable by a non-admin

**User Role:** Manager, Developer, QA, Reporter (each in turn)
**Steps:**
1. Request the plugin settings URL directly for each role.

**Expected Result:**
- 403 or redirect to login for every non-admin.
- These settings include the public-access master toggle, the IP blocklist and the rate limits — a non-admin able
  to change them could expose or disable the instance's external sharing controls. High severity if reachable.

---

### TC-RKB-091: Invalid rate-limit values

**User Role:** Admin
**Steps:**
1. Enter `0`, a negative number and a non-numeric value for each limit; save.

**Expected Result:**
- Rejected with a validation message, or coerced to a documented value.
- A limit of 0 that silently means "unlimited" rather than "block everything" would be dangerous in exactly the
  wrong direction — record precisely which it does.

---

### TC-RKB-092: Malformed IP allowlist / blocklist entries

**User Role:** Admin
**Steps:**
1. Enter a malformed address, a CIDR range, and an overlapping entry present in **both** lists; save.

**Expected Result:**
- Malformed entries are rejected with a clear message.
- For an IP in both lists, the precedence is deterministic and documented. **Blocklist should win** — an allowlist
  entry silently overriding a block would defeat the purpose of the blocklist. Record the observed precedence
  either way.

---

### TC-RKB-093: Rate limiting environment caveats are understood

**User Role:** Admin
**Steps:**
1. Record the Rails environment and the `Rails.cache` store in use.

**Expected Result:**
- For any throttling result to be meaningful, the instance must be in **production or test** mode with a **shared**
  cache store.
- If either condition fails, mark the rate-limiting cases **Not Executed — environment unsuitable** rather than
  passing them. A "pass" obtained with the limiter switched off is worse than no result, because it records
  protection that is not actually running.

---

## Uninstallation

---

### TC-RKB-094: Clean uninstall

**User Role:** Admin
**Preconditions:** **Database backup taken** — the KB warns that rollback removes all knowledge base tables and
data permanently.
**Steps:**
1. Run `bundle exec rake redmine:plugins:migrate NAME=redmineflux_knowledgebase VERSION=0 RAILS_ENV=production`.
2. Remove `plugins/redmineflux_knowledgebase` and restart.

**Expected Result:**
- Redmine starts cleanly; projects open normally; the Knowledge Base menu entry is gone.
- Issues that had linked KB pages still open, without a broken "Related Knowledge Base Pages" section.
- **Every public URL stops working.** Verify at least one explicitly — a token still serving content after the
  plugin is gone would be a serious finding.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
