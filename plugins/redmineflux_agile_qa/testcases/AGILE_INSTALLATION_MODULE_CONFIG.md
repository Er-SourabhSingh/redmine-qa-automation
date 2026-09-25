# Test Cases — Redmineflux Agile Board — Installation, Module Setup & Plugin Configuration

> Source: vendor KB https://www.redmineflux.com/knowledge-base/plugins/agile-board/ — "Version Compatibility",
> "Installation", "Configuration", "How to Configure Tracker and Priority Icons", "Troubleshooting",
> "Uninstallation", FAQ Q8.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Agile Board
- Version: (record at execution time)
- Redmine version: (record at execution time — KB declares 5.0.x, 5.1.x, 6.0.x only; **this plugin does not claim
  Redmine 4.x support**)
- Path: plugins/redmineflux_agile_qa

## Navigation methodology

Administration → Plugins → **Redmineflux Agile Board** → **Configure** for plugin-level settings;
Project → Settings → Modules for the module. Reach boards by clicking their menu entries, not by URL.

> **Warning:** the plugin-level settings here (maximum WIP, Story Points, icons) are instance-wide and change the
> behaviour of every other Agile suite. Record the original values and restore them when this suite ends.

---

## Functional Cases — Installation

---

### TC-AGB-148: Plugin folder name is enforced

**User Role:** Admin
**Priority:** Medium
**Preconditions:** Archive extracted to `Redmine/plugins/agile_board`.
**Steps:**
1. Confirm the folder is named exactly `agile_board`.
2. Run `bundle install` and `RAILS_ENV=production bundle exec rails redmine:plugins:migrate`.
3. Restart Redmine and open Administration → Plugins.

**Expected Result:**
- "Redmineflux Agile Board" is listed with name, description, author and version.
- The KB names the folder explicitly and lists a wrong location among its troubleshooting steps, so this is a real
  prerequisite.

---

### TC-AGB-149: Migration completes cleanly

**User Role:** Admin
**Priority:** High
**Steps:**
1. Run the migration, restart, open a project with the module enabled.

**Expected Result:**
- No missing-table exception in `log/production.log`; the board renders.

---

### TC-AGB-150: Assets load — the board is entirely JS-driven

**User Role:** Any
**Priority:** High
**Steps:**
1. Open a board and inspect the console and Network tab.

**Expected Result:**
- No 404s for the plugin's CSS/JS.
- Cards render, the Settings icon opens the panel, and drag-and-drop responds.
- A missing asset yields an empty container rather than a visible error, so confirm by behaviour. The KB's remedy
  is `rake assets:precompile` plus a restart.

---

### TC-AGB-151: Redmine version support boundary

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Record the Redmine version from Administration → Information.

**Expected Result:**
- It is 5.0.x, 5.1.x or 6.0.x; FAQ Q8 confirms Redmine 6 support.
- On Redmine 4.x this plugin is **outside declared support** — record that rather than filing failures as defects.
- If the instance is Redmine 6, also confirm the KB's note about Rails 7-compatible `serialize` declarations: a
  plugin-load error in the log on Redmine 6 points at exactly that, and is a real upgrade-blocking defect.

---

## Functional Cases — Module and navigation

---

### TC-AGB-152: Enabling the module adds both tabs

**User Role:** Admin
**Priority:** High
**Steps:**
1. Project → Settings → **Modules** → tick **Agile Board** → Save.

**Expected Result:**
- The project menu now shows an **Agile Board** tab **and** a **Backlog** tab — the KB states both appear.
- Before enabling, neither is present. Confirm both states.
- A build where enabling the module produces only one of the two tabs is a defect that silently removes the whole
  planning half of the plugin.

---

### TC-AGB-153: Global Agile Board appears in the top menu

**User Role:** Logged-in member
**Priority:** Medium
**Steps:**
1. With the module enabled somewhere, check the top navigation menu.

**Expected Result:**
- An **Agile Board** entry is available to logged-in users, per the KB.

---

### TC-AGB-154: Disabling the module removes access

**User Role:** Manager
**Priority:** High
**Steps:**
1. Untick the module and save.
2. Confirm both tabs are gone.
3. Request the project board URL and the Backlog URL **directly**.

**Expected Result:**
- Both tabs gone **and** both direct URLs refused.
- Re-enabling restores the board with its custom boards, sprints and settings intact — no data lost while disabled.

---

## Functional Cases — Plugin-level configuration

---

### TC-AGB-155: Configure page loads with all five settings

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Administration → Plugins → Redmineflux Agile Board → Configure.

**Expected Result:**
- The page shows **Maximum WIP limit**, the **Story Points** toggle, **Story Point values**, **Tracker icons** and
  **Priority icons** — the five areas the KB lists.
- Current values are shown, not blank defaults.

---

### TC-AGB-156: Maximum WIP limit caps per-column WIP values

**User Role:** Admin then Member
**Priority:** Medium
**Steps:**
1. Set the plugin-level maximum WIP to 5 and save.
2. On a board, open Settings → Board Columns and attempt to set a column WIP of 10.

**Expected Result:**
- The board-level value is capped or rejected with a message naming the instance maximum.
- A plugin-level maximum that has no effect on what a board will accept is a defect — the setting exists only to
  constrain this.

---

### TC-AGB-157: Tracker icons appear on cards

**User Role:** Admin then Member
**Priority:** Low
**Steps:**
1. Assign a distinct icon to each tracker and save.
2. Open a board containing issues of several trackers.

**Expected Result:**
- Each card shows its tracker's configured icon.
- Icons are also correct on the Global board and the My Page block, not only the project board.

---

### TC-AGB-158: Priority icons appear on cards

**User Role:** Admin then Member
**Priority:** Low
**Steps:**
1. Assign icons to each priority and save; open a board.

**Expected Result:**
- Each card shows its priority's icon, consistently across all board surfaces.

---

### TC-AGB-159: Text-symbol icons accept a colour

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Choose a text-symbol icon for one tracker and set its colour; save; view a card.

**Expected Result:**
- The symbol renders in the chosen colour, per the KB's note that colour is settable for text symbols.
- The colour is legible against the card background — a white symbol on a white card is a real usability defect.

---

### TC-AGB-160: Settings persist across save and reload

**User Role:** Admin
**Priority:** High
**Steps:**
1. Change every setting, save, reload the Configure page.

**Expected Result:**
- All values persist. A success message that does not persist is a defect.

---

## Negative Cases

---

### TC-AGB-161: Wrong plugin folder name

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Rename the folder away from `agile_board` and restart.

**Expected Result:**
- The plugin is absent from Administration → Plugins or fails loudly — not half-loaded with dead tabs.
  Restore and confirm recovery.

---

### TC-AGB-162: Migration not run

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Install files, skip the migration, restart, open a project.

**Expected Result:**
- A clear error or the feature absent. **The project's other pages must still work** — breaking the project
  overview would be Critical.

---

### TC-AGB-163: Configure page is not reachable by a non-admin

**User Role:** Manager, Developer, QA, Reporter (each in turn)
**Priority:** High
**Steps:**
1. Request the plugin settings URL directly for each role. Do not rely on the menu being hidden.

**Expected Result:**
- 403 or redirect to login for every non-admin. These settings are instance-wide — a non-admin able to disable
  Story Points would remove the field from every board on the instance.

---

### TC-AGB-164: Invalid maximum WIP value

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Enter `0`, a negative number, and a non-numeric value as the maximum WIP; save each.

**Expected Result:**
- Rejected with a validation message, or coerced to a documented value.
- A maximum of 0 that silently makes every column permanently over-limit is a defect.

---

### TC-AGB-165: Invalid Story Point values

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Enter non-numeric, negative, and duplicate values in the Story Point values list; save.

**Expected Result:**
- Rejected or normalised with a clear message. Duplicates must not produce two identical options in the card's
  Story Points selector.

---

### TC-AGB-166: Removing an icon reverts to a default

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Clear a tracker's configured icon and save; view a card.

**Expected Result:**
- The card renders with a sensible default or no icon — not a broken image placeholder and not a missing card
  layout.

---

### TC-AGB-167: Tracker or priority deleted after icons were configured

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Configure an icon for a tracker, then delete that tracker in Administration.
2. Reopen the plugin Configure page and a board.

**Expected Result:**
- The orphaned icon configuration is dropped cleanly. Not a 500 on the Configure page and not a broken card render.

---

### TC-AGB-168: Board on a project with no issues

**User Role:** Member
**Priority:** Low
**Steps:**
1. Open the Agile Board on an empty project.

**Expected Result:**
- Columns render with clean empty states and the quick-add control is available — not an error or a blank page.

---

## Uninstallation

---

### TC-AGB-169: Clean uninstall

**User Role:** Admin
**Priority:** Medium
**Preconditions:** **Database backup taken** — the KB requires this before rollback.
**Steps:**
1. Run `bundle exec rails redmine:plugins:migrate NAME=agile_board VERSION=0 RAILS_ENV=production`.
2. Remove `plugins/agile_board` and restart.

**Expected Result:**
- Redmine starts cleanly and projects open normally.
- Issues survive untouched; only plugin-owned data (sprints, custom boards, per-user board settings, Story Point
  values) is removed.
- The Agile Board and Backlog tabs and the top-menu entry are gone, and My Page no longer offers the block.
- **Issues that had been assigned to sprints must still open without error** — a dangling sprint reference that
  breaks the issue page after uninstall would be a Critical defect.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
