# Test Cases — Redmineflux Checklist — Installation, Compatibility & Global Configuration

> Source: vendor KB https://www.redmineflux.com/knowledge-base/plugins/checklist-plugin/
> sections "Version Compatibility", "Installation", "Configuration", "How to Enable Block Issue Closing feature",
> "Troubleshooting", "Uninstallation of Plugin".
> **Status: authored 2026-09-15. Executed 2026-09-21 — 9 PASS (TC-CHK-054–108, 111), 3 NOT EXECUTED (TC-CHK-063,
> 110, 112 — each requires a disruptive instance-level action on the shared local Docker instance: renaming the
> live plugin folder + restart, running with migrations deliberately skipped, or a full plugin uninstall. Skipped
> pending explicit user approval rather than risking the instance other suites depend on; see notes below each.**

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

### TC-CHK-054: Plugin appears in the Administration → Plugins list after installation

**User Role:** Admin
**Priority:** High
**Preconditions:** Plugin extracted into `/path/to/redmine/plugins` with its original folder name, `bundle install`
and `redmine:plugins:migrate` run, server restarted.
**Steps:**
1. Log in as Admin.
2. Go to Administration → Plugins.

**Expected Result:**
- "Redmineflux Checklist Plugin" is listed with a name, description, author and version.
- A **Configure** link is present next to it.

CONFIRMED LIVE 2026-09-21 (Local, redmine-docker-7.0.0, Administration → Plugins): **PASS.** Listed as
"Redmineflux Checklist Plugin", description, author "Redmineflux - Powered by Zehntech Technologies Inc",
version 7.0.0, Configure link present.

---

### TC-CHK-055: Database migration created the plugin's tables

**User Role:** Admin
**Priority:** High
**Steps:**
1. After running `RAILS_ENV=production bundle exec rails redmine:plugins:migrate`, restart the server.
2. Open any issue and scroll to the Checklist section.

**Expected Result:**
- The Checklist section renders without a 500 error.
- No `relation does not exist` / `Table doesn't exist` error appears in `log/production.log`.

CONFIRMED LIVE 2026-09-21: **PASS**, by extensive existing evidence — every TC executed against issues #1530,
#1531, #1532 this session (dozens of checklist CRUD operations across two suites) rendered and functioned
correctly with no table-missing errors.

---

### TC-CHK-056: Assets load correctly (CSS/JS precompile)

**User Role:** Any
**Priority:** High
**Steps:**
1. Open an issue with a checklist.
2. Inspect the browser console and Network tab.

**Expected Result:**
- No 404s for the plugin's CSS/JS assets.
- The checklist widget is styled (not raw unstyled markup) and its Actions menu opens — i.e. JS is bound.
- If assets 404, `RAILS_ENV=production bundle exec rake assets:precompile` + restart resolves it (KB note).

CONFIRMED LIVE 2026-09-21: **PASS.** Console checked on issue #1530 — zero 404s (the one recurring console error,
"Identifier 'lastJstPreviewed' has already been declared", is a pre-existing, unrelated global JS naming
collision, not a Checklist asset issue). Widget fully styled and its Actions menu/dropdowns worked throughout
dozens of interactions this session.

---

### TC-CHK-057: Plugin loads on each supported Redmine version

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Record the Redmine version under test (Administration → Information).
2. Confirm it falls inside the KB-declared support range.
3. Exercise create/edit/delete of one checklist.

**Expected Result:**
- Plugin loads and basic CRUD works on the declared version.
- **Negative:** on a Redmine version *outside* the declared range, any failure is a documented compatibility
  limitation, not a plugin defect — record the version rather than filing a bug.

CONFIRMED LIVE 2026-09-21: **PASS.** Redmine 7.0.0 (Docker) — full create/edit/delete CRUD for checklists and
items extensively exercised and passing throughout this session's regression (`CHECKLIST_CHECKLIST_MANAGEMENT.md`
TC-CHK-058–222).

---

## Functional Cases — Global configuration

---

### TC-CHK-059: Configure page opens and shows both tabs

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Administration → Plugins → Redmineflux Checklist Plugin → **Configure**.

**Expected Result:**
- The configuration page loads with a **General** tab and a **Checklist templates** tab.
- Current values of every setting are shown (not blank defaults) when settings were previously saved.

CONFIRMED LIVE 2026-09-21 (Administration → Plugins → Redmineflux Checklist Plugin → Configure, required an
Admin sudo-mode password reconfirmation to reach): **PASS.** Both "General" and "Checklist Templates" tabs
present; current checkbox states read correctly from the DOM.

---

### TC-CHK-060: "Block issue closing" setting persists across a save/reload

**User Role:** Admin
**Priority:** High
**Steps:**
1. On the General tab, check **Block issue closing**.
2. Save.
3. Reload the Configure page.

**Expected Result:**
- A success message is shown.
- The checkbox remains checked after reload — the value was actually persisted, not just echoed back.

CONFIRMED LIVE 2026-09-21: **PASS.** Checked "Block issue closing", saved, navigated to the Configure page as a
fresh load — checkbox still checked. Left enabled intentionally (needed by `CHECKLIST_BLOCK_ISSUE_CLOSING.md`).

---

### TC-CHK-061: "Auto-calculate % done from checklist" setting persists

**User Role:** Admin
**Priority:** High
**Steps:**
1. On the General tab, toggle the auto-calculate progress setting.
2. Save and reload.

**Expected Result:**
- Setting persists. (Its functional effect is covered by TC-CHK-083.)

CONFIRMED LIVE 2026-09-21: **PASS.** Same pattern as TC-CHK-060 — checked, saved, reloaded, still checked. Left
enabled intentionally (needed by `CHECKLIST_PROGRESS_TRACKING.md`'s TC-CHK-083).

---

### TC-CHK-062: Settings are instance-wide, not per-project

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Enable **Block issue closing**.
2. Open issues in two different projects.

**Expected Result:**
- The behaviour applies in both projects — the setting is global, matching the KB's Administration-level placement.
- If it silently applies to only one project, that is a defect worth filing.

CONFIRMED LIVE 2026-09-21 (`test project` and `Flux Gantt Project` — a different project, different tracker
context): **PASS.** Created a fresh issue (#1532) in Flux Gantt Project with a checklist containing one incomplete
item, attempted to close it — correctly blocked with "Issue cannot be closed as there are incomplete checklists.",
identical enforcement to `test project`. Setting is genuinely instance-wide, not per-project.

---

## Negative Cases

---

### TC-CHK-063: Plugin folder renamed on disk

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Rename the plugin directory under `plugins/` (the KB explicitly says *do not* change it).
2. Restart the server.

**Expected Result:**
- Failure is loud and diagnosable — a startup error or the plugin simply absent from the Plugins list — **not** a
  half-loaded plugin that renders broken issue pages.
- Restore the original folder name and confirm recovery.

**NOT EXECUTED 2026-09-21.** This requires renaming the live plugin directory on the shared Docker host and
restarting the container — a real risk of leaving the shared instance (which every other suite this session, and
prior sessions, depends on) broken if recovery doesn't go cleanly. Skipped pending explicit user approval; do this
only in a dedicated/disposable environment or with the user watching.

---

### TC-CHK-064: Migration not run

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Install the plugin files but skip `redmine:plugins:migrate`.
2. Restart and open an issue.

**Expected Result:**
- A clear error pointing at the pending migration, or the checklist section absent — not an unhandled 500 that takes
  the whole issue page down. A 500 on the core issue page is a High-severity finding.

**NOT EXECUTED 2026-09-21.** Migrations are already run on this instance; deliberately reverting them
(`VERSION=<N-1>`) to reproduce an un-migrated state risks leaving the shared instance's checklist tables in a bad
state for every other suite. Skipped pending explicit user approval.

---

### TC-CHK-065: Configure page is not reachable by a non-admin

**User Role:** Developer / QA (non-admin)
**Priority:** High
**Steps:**
1. As a non-admin, request the plugin's settings URL directly
   (`/settings/plugin/<plugin_id>`) — do not rely on the Administration menu being hidden.

**Expected Result:**
- 403 Forbidden or a redirect to login — **not** the settings form.
- A hidden menu link alone does not pass this case; the URL itself must be blocked.

CONFIRMED LIVE 2026-09-21: **PASS.** Logged in as `luna.blossom` (non-admin, Developer project role), requested
`/settings/plugin/redmineflux_checklist` directly — HTTP 403 Forbidden, not the settings form.

---

## Uninstallation

---

### TC-CHK-066: Clean uninstall

**User Role:** Admin
**Priority:** Medium
**Preconditions:** Database backup taken.
**Steps:**
1. Run `bundle exec rake redmine:plugins:migrate NAME=<plugin_name> VERSION=0 RAILS_ENV=production`.
2. Delete the plugin directory from `plugins/`.
3. Restart the server.

**Expected Result:**
- Redmine starts cleanly.
- Issues that previously had checklists open without error and show no orphaned checklist markup.
- The plugin is gone from Administration → Plugins.

**NOT EXECUTED 2026-09-21.** A full uninstall would remove the plugin this entire QA folder tests, breaking every
remaining suite this session and future sessions on this shared instance. Skipped pending explicit user approval —
only run this in a disposable/throwaway environment, never on the shared working instance.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
