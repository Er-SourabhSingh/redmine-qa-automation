# Test Cases — Redmineflux Workload — Installation & Capacity Settings

> Source: vendor KB — "Version Compatibility", "Installation", "Configuration",
> "How to Configure Workload Settings", "Troubleshooting", "Uninstallation of Plugin", FAQ Q6.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Workload Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time — KB declares **5.0.x, 6.0.x, 6.1.x**; note it omits 5.1.x)
- Path: plugins/redmineflux_workload_qa

## Navigation methodology

Top menu → **Workloads** → the **Settings** icon in the plugin sidebar. Every setting must be verified by its
effect on a **calculated capacity figure**, not by the settings page reporting a successful save.

> **Warning:** these settings change capacity arithmetic instance-wide. Record the originals and restore them when
> the suite ends, or every later suite computes against a different baseline.

---

## Functional Cases — Installation

---

### TC-WKL-031: Plugin folder name is enforced

**User Role:** Admin
**Preconditions:** `redmineflux_workload` uploaded to `Redmine/plugins`.
**Steps:**
1. Confirm the folder name is unchanged.
2. Run `bundle install` and `RAILS_ENV=production bundle exec rails redmine:plugins:migrate`; restart.
3. Open Administration → Plugins.

**Expected Result:**
- The plugin is listed with name, description, author and version.
- **Workloads** appears in the top menu.

---

### TC-WKL-032: Migrations complete cleanly

**User Role:** Admin
**Steps:**
1. Run the migration, restart, open Workloads.

**Expected Result:**
- No missing-table exception in the log; the Workloads page renders.

---

### TC-WKL-033: Assets load

**User Role:** Any
**Steps:**
1. Open a workload detail page with its Gantt timeline; inspect the console and Network tab.

**Expected Result:**
- No 404s. The Gantt renders and allocations respond to dragging — this plugin's timeline is entirely JS-driven,
  so confirm by behaviour.
- If assets 404, `rake assets:precompile` plus a restart resolves it (KB note).

---

### TC-WKL-034: Redmine version boundary

**User Role:** Admin
**Steps:**
1. Record the Redmine version from Administration → Information.

**Expected Result:**
- It is 5.0.x, 6.0.x or 6.1.x.
- **The KB's list omits 5.1.x**, which every other Redmineflux plugin supports. If the instance is 5.1.x, record
  that the version is outside the declared range and treat failures as compatibility findings — but also flag the
  omission itself, since it is more likely a documentation gap than a real exclusion.

---

### TC-WKL-035: The Workloads menu is only visible to logged-in users

**User Role:** Anonymous, then a logged-in member
**Steps:**
1. Visit Redmine logged out and inspect the top menu.
2. Log in and re-check.

**Expected Result:**
- Absent when anonymous, present when logged in, exactly as the KB states.
- Also request the Workloads URL directly while anonymous — a hidden menu item is not access control
  (see TC-WKL-082).

---

## Functional Cases — Capacity settings

---

### TC-WKL-036: Working Hours Per Day default

**User Role:** Admin
**Steps:**
1. On a fresh install, open Settings and read **Working Hours Per Day**.

**Expected Result:**
- `8.0`, the documented default.

---

### TC-WKL-037: Working Hours Per Day drives capacity everywhere

**User Role:** Admin
**Steps:**
1. Note a member's available capacity for a workload spanning exactly 5 working days — expect 40 hours at 8.0/day.
2. Change the setting to `6.0`, save, and **Recalculate Capacity** on the workload.
3. Re-check the figure in: team availability, the workload detail page, the allocation timeline, and the dashboard.

**Expected Result:**
- Capacity becomes 30 hours, and **all four surfaces agree**.
- The KB states this setting affects all four, so a change reflected in one view but not another means two
  different calculations exist — a real defect, because managers would be planning against inconsistent numbers.

---

### TC-WKL-038: Allow Workload Overload enabled

**User Role:** Admin then a workload manager
**Steps:**
1. Enable **Allow Workload Overload**; save.
2. Allocate planned hours exceeding a member's available capacity.

**Expected Result:**
- The allocation is accepted and the excess is clearly reported as **overbooked hours** rather than silently
  absorbed. Overload being permitted is not the same as overload being invisible.

---

### TC-WKL-039: Allow Workload Overload disabled

**User Role:** Admin then a workload manager
**Steps:**
1. Disable the setting; save.
2. Attempt to allocate planned hours exceeding available capacity, through the UI.
3. Send the same allocation **directly** to the endpoint.

**Expected Result:**
- Refused at both legs with a message naming the available capacity.
- **Leg 3 is the one that matters.** If the client blocks over-allocation while the server accepts it, the setting
  is decorative and the plugin's stated purpose — identifying overload before it affects delivery — does not hold.
  High severity.

---

### TC-WKL-040: Settings persist across save and reload

**User Role:** Admin
**Steps:**
1. Change both settings, save, reload the Settings page.

**Expected Result:**
- Both values persist.

---

## Negative Cases

---

### TC-WKL-041: Invalid Working Hours Per Day

**User Role:** Admin
**Steps:**
1. Enter `0`, a negative number, a non-numeric value, and an implausible value such as `30`; save each.

**Expected Result:**
- Each rejected with a clear validation message, or bounded to a documented range.
- **`0` deserves specific attention**: it would make every member's capacity zero, so every allocation becomes
  overload and, with overload disabled, no work could be planned at all. That state must not be reachable
  silently.
- More than 24 hours per day is nonsensical and should be refused rather than quietly producing impossible
  capacity figures.

---

### TC-WKL-042: Fractional working hours

**User Role:** Admin
**Steps:**
1. Set `7.5` and verify a five-day capacity figure.

**Expected Result:**
- 37.5 hours, calculated and displayed without floating-point artefacts such as `37.499999`.
- Fractional daily hours are entirely normal in real organisations, so rounding behaviour here should be checked
  rather than assumed.

---

### TC-WKL-043: Settings page is not reachable by a non-admin

**User Role:** A user with **Manage teams and skills**, and a plain member
**Steps:**
1. Confirm the Settings icon is not offered.
2. Request the settings URL directly and attempt to post a change, as each user.

**Expected Result:**
- Refused with 403 for both.
- Note the deliberate boundary: **Manage teams and skills is a broad permission but it does not include plugin
  settings or holiday schemes**, which the KB reserves for administrators. A holder of that permission able to
  change Working Hours Per Day would silently alter capacity for every team on the instance.

---

### TC-WKL-044: Changing settings mid-plan

**User Role:** Admin + workload manager
**Steps:**
1. With workloads fully allocated to exactly 100% utilization, reduce Working Hours Per Day.
2. Review those workloads before and after **Recalculate Capacity**.

**Expected Result:**
- The workloads remain coherent and their members are now shown as overbooked.
- **Record whether the change applies before recalculation or only after it.** If stale figures persist until
  someone remembers to recalculate, managers will act on numbers they believe are current — the KB's own
  troubleshooting implies recalculation is manual, so this behaviour should be documented in the plugin memory
  file either way.

---

### TC-WKL-045: Wrong plugin folder name

**User Role:** Admin
**Steps:**
1. Rename the folder and restart.

**Expected Result:**
- The plugin is absent or fails loudly — not half-loaded with a dead Workloads menu. Restore and confirm recovery.

---

### TC-WKL-046: Migrations not run

**User Role:** Admin
**Steps:**
1. Install the files, skip the migration, restart, open Redmine.

**Expected Result:**
- A clear error or the menu absent. **Redmine's own pages must still work.**

---

## Uninstallation

---

### TC-WKL-047: Clean uninstall

**User Role:** Admin
**Preconditions:** **Database backup taken** — the KB warns that uninstalling removes the plugin's tables and data.
**Steps:**
1. Run `RAILS_ENV=production bundle exec rails redmine:plugins:migrate NAME=redmineflux_workload VERSION=0`.
2. Remove `plugins/redmineflux_workload` and restart.

**Expected Result:**
- Redmine starts cleanly and the Workloads menu is gone.
- **Issues, time entries and project data are untouched** — only plugin-owned data (teams, skills, leave,
  holidays, workloads, allocations) is removed. The plugin allocates against real Redmine issues, so any change to
  those issues during rollback would be Critical.
- Verify a sample of the issues that had allocations still open normally.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
