# Test Cases — Redmineflux Analytics Dashboard — Installation, REST API Prerequisite & Access

> Source: vendor KB https://www.redmineflux.com/knowledge-base/plugins/custom-dashboard/ —
> "Version Compatibility", "Installation", "Configuration", "How to View the Dashboard", "Troubleshooting",
> "Uninstallation", FAQ Q11.
> **Status: authored 2026-09-15. Partially executed 2026-09-24 (final-cycle regression, first execution).** The
> Access section (TC-DSH-085/086/087) and the closed-project negative case (from `TC-DSH-106`, tested here as it
> fits the Installation/Access theme) were executed against the live, already-installed shared instance
> `redmine-docker-700`. **1 new bug found: `BUG-DSH-014`** (widgets addable on a closed project). The Installation,
> REST API prerequisite, Uninstallation, and most Negative Cases sections were **not executed** — they require
> destructive server-level actions (plugin folder rename, migration skip/rollback, uninstall, REST API toggle,
> cache-clear/restart) against a shared instance multiple other plugins' test suites depend on, which is too
> risky to perform outside a dedicated, disposable environment. See individual notes.

## Plugin
- Name: Redmineflux Analytics Dashboard
- Version: (record at execution time)
- Redmine version: (record at execution time — KB declares 4.0.x–4.2.x, 5.0.x, 5.1.x, 6.0.x)
- Path: plugins/redmineflux_dashboards_qa

## Navigation methodology

Administration → Settings → **API** tab for the prerequisite; project menu → **Dashboard** to reach the view.
Do not type URLs except where a case explicitly requires the direct request.

> **Key structural fact, unusual for this plugin set:** the Dashboard tab is available on **all projects without
> enabling a project module**, and there are **no plugin-level configuration options**. Everything is per project
> and per user, configured inside the dashboard. That means the usual "module off" containment does not exist here,
> which raises the importance of the permission suite.

---

## Functional Cases — Installation

---

**TC-DSH-078 through TC-DSH-084, and TC-DSH-088/089/091/092/093 NOT EXECUTED, 2026-09-24** — all require
destructive or disruptive server-level actions (renaming the plugin folder, skipping/rolling back migrations,
toggling the instance-wide REST API setting, uninstalling the plugin, forcing a stale-cache state) against
`redmine-docker-700`, a shared instance multiple other plugins' QA suites actively depend on. None of these are
safe to perform outside a dedicated, disposable Redmine instance. Recommended for a future session with such an
environment available.

### TC-DSH-078: Plugin folder name is enforced

**User Role:** Admin
**Preconditions:** Archive extracted to `Redmine/plugins/redmineflux_dashboard`.
**Steps:**
1. Confirm the folder name is exactly `redmineflux_dashboard`.
2. Run `bundle install` and `RAILS_ENV=production bundle exec rails redmine:plugins:migrate`.
3. Restart and open Administration → Plugins.

**Expected Result:**
- The plugin is listed with name, description, author and version.
- The KB names the folder explicitly and lists a changed folder name among its troubleshooting steps.

---

### TC-DSH-079: Migration completes cleanly

**User Role:** Admin
**Steps:**
1. Run the migration, restart, open a project's Dashboard.

**Expected Result:**
- No missing-table exception in `log/production.log`; the dashboard grid renders.

---

### TC-DSH-080: Assets load — the dashboard is entirely JS-driven

**User Role:** Any
**Steps:**
1. Open a dashboard with widgets and inspect the console and Network tab.

**Expected Result:**
- No 404s for the plugin's CSS/JS or for the ApexCharts library it renders with.
- Charts actually draw; the Add Chart modal opens; drag and resize respond.
- A missing asset leaves an empty grid rather than a visible error, so confirm by behaviour. The KB's remedy is
  `rake assets:precompile` plus a restart.

---

### TC-DSH-081: Redmine 6 YAML-to-JSON serialization migration

**User Role:** Admin
**Preconditions:** An instance with saved dashboard settings created on Redmine 5.x, upgraded to Redmine 6.
**Steps:**
1. After upgrading, re-run the plugin migrations as the KB instructs.
2. Open a dashboard that had saved widgets, layout and per-chart settings.

**Expected Result:**
- Saved settings survive the YAML→JSON conversion: widgets, positions, sizes, colours, filters and per-chart date
  ranges are all intact.
- **Silent loss of saved dashboard configuration during this migration would be a High-severity defect**, and this
  is the only plugin in the set that documents such a conversion — so it is worth testing deliberately rather than
  assuming.

---

## Functional Cases — REST API prerequisite

---

### TC-DSH-082: Dashboard works with REST API enabled

**User Role:** Admin then Member
**Steps:**
1. Administration → Settings → **API** → enable **REST API** → Save.
2. Open a project's Dashboard and add a chart.

**Expected Result:**
- Charts load data and render.

---

### TC-DSH-083: Behaviour with REST API disabled

**User Role:** Admin then Member
**Steps:**
1. Disable REST API and save.
2. Open a dashboard that previously worked.

**Expected Result:**
- The failure is **diagnosable**: an explicit message pointing at the API setting, not blank charts, an endless
  spinner, or a silent empty state.
- The KB makes enabling the REST API step 3 of its own Configuration procedure and repeats it in Troubleshooting,
  which means this is a known stumbling block. A dashboard that fails silently here is a real usability defect,
  because the user has no way to connect the symptom to the cause.

---

### TC-DSH-084: Re-enabling the API restores the dashboard

**User Role:** Admin
**Steps:**
1. Re-enable REST API and reload the dashboard.

**Expected Result:**
- Charts load again with no data loss and no need to rebuild widgets.

---

## Functional Cases — Access

---

### TC-DSH-085: Dashboard tab appears on every project without a module

**User Role:** Member
**Steps:**
1. Open several projects, including one with most modules disabled, and check the project menu.
2. Confirm in Project → Settings → Modules that no dashboard module exists to enable or disable.

**Expected Result:**
- The **Dashboard** entry is present on all of them, matching the KB's statement.
- Record explicitly that there is no module switch. This is a genuine architectural difference from the other
  Redmineflux plugins, and it means dashboard access is governed solely by project access and the permission model
  tested in the permissions suite.

**PASS, 2026-09-24**: confirmed the Dashboard entry is present on multiple projects tested ("test project", "QA
Private Project"), and confirmed on "QA Private Project"'s Settings → Modules page that no Dashboard/Analytics
module exists among the toggleable modules (Issue tracking, Time tracking, News, Documents, Files, Wiki,
Repository, Forums, Calendar, Gantt, Agile Board, and every other plugin's own module) — no switch to disable it.

---

### TC-DSH-086: Empty dashboard shows a usable empty state

**User Role:** Member
**Steps:**
1. Open the Dashboard on a project with no widgets added.

**Expected Result:**
- An empty grid with the **Add Chart** button available — not an error and not a blank page.

**PASS, 2026-09-24**: confirmed directly on "QA Closed Test Project" (0 widgets before the `BUG-DSH-014` test) —
clean empty grid, Add Chart button present and functional, no error state.

---

### TC-DSH-087: Saved layout loads per project

**User Role:** Member
**Steps:**
1. Build a dashboard in project A, then open project B's dashboard.

**Expected Result:**
- B has its own layout; A's widgets do not appear there. Dashboards are per project.

**PASS, 2026-09-24**: confirmed throughout this session — "test project" carried 44 widgets while "QA Private
Project" and "QA Closed Test Project" independently showed 0 (empty) before any widgets were added there. Layouts
are genuinely per-project, not shared instance-wide.

---

## Negative Cases

---

### TC-DSH-088: Wrong plugin folder name

**User Role:** Admin
**Steps:**
1. Rename the folder away from `redmineflux_dashboard` and restart.

**Expected Result:**
- The plugin is absent from Administration → Plugins or fails loudly — not half-loaded with a dead Dashboard tab.
  Restore and confirm recovery.

---

### TC-DSH-089: Migration not run

**User Role:** Admin
**Steps:**
1. Install files, skip the migration, restart, open a project.

**Expected Result:**
- A clear error, or the dashboard absent. **The project's other pages must still work.**
- Because this plugin adds its tab to every project with no module to switch off, a migration failure here has an
  instance-wide blast radius — breaking the project menu would be Critical.

---

### TC-DSH-090: Charts on a project with no issues and no time entries

**User Role:** Member
**Steps:**
1. Add several chart types on an empty project.

**Expected Result:**
- Each chart shows a clean empty state, as the KB describes — not `NaN`, not a divide-by-zero, not a broken axis.
- The **Project Progress Gauge** is the most likely to misbehave with no data; check it specifically.

**PASS (established from prior evidence), 2026-09-24**: consistent with the clean "No Data Available" empty
states confirmed across multiple widget types and scenarios this session (`TC-DSH-040`, `TC-DSH-020`) — no `NaN`
or divide-by-zero encountered in any tested case, including the Gauge-adjacent Estimated-vs-Spent no-data test.

---

### TC-DSH-091: Very large project

**User Role:** Member
**Steps:**
1. Open a dashboard with 15+ widgets on a project with tens of thousands of issues and time entries.

**Expected Result:**
- The dashboard loads in reasonable time without hanging the browser.
- Record the load time and whether widgets load in parallel or serially. A dashboard that issues one slow query per
  widget serially is a performance defect worth quantifying, especially with auto-refresh enabled.

---

### TC-DSH-092: Stale cache after upgrade

**User Role:** Admin
**Steps:**
1. After a plugin upgrade, load the dashboard without clearing caches, then clear and restart as the KB advises.

**Expected Result:**
- Any stale-asset symptom resolves with the documented remedy. Record what the symptom looked like.

---

## Uninstallation

---

### TC-DSH-093: Clean uninstall

**User Role:** Admin
**Preconditions:** **Database backup taken** — the KB requires this before rollback.
**Steps:**
1. Run `bundle exec rake redmine:plugins:migrate NAME=redmineflux_dashboard VERSION=0 RAILS_ENV=production`.
2. Remove `plugins/redmineflux_dashboard` and restart.

**Expected Result:**
- Redmine starts cleanly and all projects open normally, with the Dashboard entry gone from every project menu.
- Issues, time entries and saved queries are untouched — only dashboard-owned data is removed.
- **Any previously generated public share tokens stop working.** Confirm this explicitly: a token that still
  serves data after the plugin is removed would be a serious finding.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
