# Test Cases — Redmineflux Time Tracker — Installation & Plugin Configuration

> Source: vendor KB — "Version Compatibility", "Installation", "Configuration" (Require Location Permission,
> Enable Manual Time Entry, Google Maps API Key, Page Design), "Troubleshooting", "Uninstallation", FAQ Q9.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Time Tracker Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time — KB declares 5.0.x, 5.1.x, 6.0.x; not 4.x)
- Path: plugins/redmineflux_time_tracker_qa

## Navigation methodology

Administration → Plugins → **Redmineflux Time Tracker** → **Configure**. Every setting must be verified by its
effect on the Time Tracker page, not by the configuration page reporting a successful Apply.

> **Test over HTTPS.** Browsers refuse the geolocation API on insecure origins, so location cases run on plain
> HTTP will fail for reasons that have nothing to do with the plugin. Record the scheme used.
>
> **Warning:** these settings are instance-wide. Record the originals and restore them when the suite ends.

---

## Functional Cases — Installation

---

### TC-TMT-025: Plugin folder name is enforced

**User Role:** Admin
**Preconditions:** Plugin folder uploaded to `Redmine/plugins` with its original name.
**Steps:**
1. Confirm the folder name is unchanged.
2. Run `bundle install` and `RAILS_ENV=production bundle exec rails redmine:plugins:migrate`; restart.
3. Open Administration → Plugins.

**Expected Result:**
- The plugin is listed, and **Time Tracker** appears in the top navigation.
- The KB explicitly names a changed folder name as a reason the plugin fails to load, so verify the negative too:
  rename it, restart, confirm a loud failure rather than a half-loaded state, then restore.

---

### TC-TMT-026: Migrations complete cleanly

**User Role:** Admin
**Steps:**
1. Run the migration, restart, open the Time Tracker page.

**Expected Result:**
- No missing-table exception in the log; the timer bar and entry list render.

---

### TC-TMT-027: Assets load

**User Role:** Any
**Steps:**
1. Open the Time Tracker page and the Calendar; inspect the console and Network tab.

**Expected Result:**
- No 404s. The timer ticks, the context menus open, and the calendar renders — this plugin is heavily JS-driven,
  so confirm by behaviour rather than by the absence of a visible error.

---

### TC-TMT-028: Redmine version boundary

**User Role:** Admin
**Steps:**
1. Record the Redmine version.

**Expected Result:**
- 5.0.x, 5.1.x or 6.0.x. On 4.x the plugin is outside declared support — record rather than file.

---

## Functional Cases — Location permission setting

---

### TC-TMT-029: Location required for a named user

**User Role:** Admin then the named Member
**Steps:**
1. Enable **Require Location Permission** and select one specific user; Apply.
2. As that user, attempt to start the timer and grant location access.
3. As a **different** user, start the timer.

**Expected Result:**
- The named user is prompted for location and the timer starts once granted.
- The other user is **not** prompted and can start normally.

---

### TC-TMT-030: Empty user selection applies to everyone

**User Role:** Admin then several Members
**Steps:**
1. Enable **Require Location Permission** but select **no** users; Apply.
2. Attempt to start the timer as three different users.

**Expected Result:**
- **All three are required to grant location access**, per the KB's explicit statement.
- This is the opposite of the intuitive reading of an empty selection, and it is the most likely configuration
  mistake an administrator will make — an empty list silently enrolls the whole instance into location tracking.
  Confirm it behaves as documented and record it prominently in the plugin memory file.

---

### TC-TMT-031: Disabling the setting removes the requirement

**User Role:** Admin then Member
**Steps:**
1. Disable **Require Location Permission**; Apply.
2. Start the timer with browser location **denied**.

**Expected Result:**
- The timer starts normally. No location prompt and no block.

---

## Functional Cases — Other settings

---

### TC-TMT-032: Enable Manual Time Entry

**User Role:** Admin then Member
**Steps:**
1. Disable the setting; Apply; open the Time Tracker page.
2. Enable it; Apply; reload.
3. With it disabled, send the manual-entry create request **directly**.

**Expected Result:**
- The **Manual Time Log** action is absent when disabled and present when enabled.
- The direct request is **refused** while disabled. A hidden button whose endpoint still accepts manual entries
  means the setting is cosmetic — and manual entry with arbitrary start/end times is exactly what an admin might
  disable deliberately to keep time records honest.

---

### TC-TMT-033: Google Maps API Key

**User Role:** Admin
**Steps:**
1. Save a valid key; Apply; open Activity → Map View.
2. Clear the key and reopen Map View.
3. Enter an invalid key and reopen.

**Expected Result:**
- With a valid key the map renders.
- With no key or an invalid one, a clear message explains that a Maps key is required — not a blank panel, a
  console-only error, or a Google watermark error the user cannot interpret.

---

### TC-TMT-034: Page design — Modern Card

**User Role:** Admin then Member
**Steps:**
1. Select **Modern Card**; Apply; open the Time Tracker page.

**Expected Result:**
- The layout matches the preview, and the timer, manual entry and entry list all remain fully functional.

---

### TC-TMT-035: Page design — Compact Layout and Detailed Expanded

**User Role:** Admin then Member
**Steps:**
1. Repeat TC-TMT-034 for each of the other two layouts.

**Expected Result:**
- Each renders correctly and **all functionality remains available in every layout** — start/stop, inline editing,
  the context menu, and the entry list.
- A control that is reachable in one layout but missing or clipped in another is a real defect; the KB offers these
  as equivalent presentations, not as feature tiers. Test each layout at a narrow viewport too, since Compact is
  the most likely to clip.

---

### TC-TMT-036: Layout preview matches the applied result

**User Role:** Admin
**Steps:**
1. Preview each design, then apply it and compare.

**Expected Result:**
- The applied layout matches its preview. A preview that misrepresents the result makes the choice meaningless.

---

## Negative Cases

---

### TC-TMT-037: Configure page is not reachable by a non-admin

**User Role:** Manager, Developer, QA, Reporter (each in turn)
**Steps:**
1. Request the plugin settings URL directly for each role, and attempt to post a settings change.

**Expected Result:**
- 403 or redirect to login for every non-admin.
- These settings control whether **employee location is tracked** across the instance. A non-admin able to enable
  location tracking for all users — or to disable it for themselves — would be a serious defect, not a routine
  permission gap.

---

### TC-TMT-038: Invalid configuration values

**User Role:** Admin
**Steps:**
1. Enter a malformed Google Maps API key and a value in any numeric field outside a sensible range; Apply.

**Expected Result:**
- Rejected with a clear message, or accepted and then failing gracefully at the point of use with an explanatory
  message.

---

### TC-TMT-039: Settings persist across save and reload

**User Role:** Admin
**Steps:**
1. Change every setting, Apply, reload the Configure page.

**Expected Result:**
- All values persist, including the selected user list for location tracking. A user list that silently empties on
  save would widen location tracking to everyone (see TC-TMT-030) — a quiet and serious failure.

---

### TC-TMT-040: Location requirement changed while a timer is running

**User Role:** Admin + Member
**Steps:**
1. Member starts a timer with the requirement off.
2. Admin enables **Require Location Permission** for that user.
3. Member clicks **Stop** with location denied.

**Expected Result:**
- The user must not be trapped with an unstoppable timer. Either the stop is permitted, or a clear route out is
  offered.
- **A running timer that cannot be stopped, with no way to recover the elapsed work, is the worst outcome this
  plugin can produce** — the user loses the record of hours they actually worked.

---

### TC-TMT-041: Conflicts with other time-related plugins

**User Role:** Member
**Preconditions:** The Redmineflux Timesheet plugin also installed.
**Steps:**
1. Log time through the Time Tracker and confirm it appears in the Timesheet grid and in core Redmine's
   spent-time report.

**Expected Result:**
- Both plugins read the same underlying Redmine time entries, with no duplication and no divergence in totals.
- These two plugins are plausibly installed together, and a mismatch between them would corrupt whichever one
  feeds approvals.

---

## Uninstallation

---

### TC-TMT-042: Clean uninstall

**User Role:** Admin
**Preconditions:** **Database backup taken.**
**Steps:**
1. Run `bundle exec rake redmine:plugins:migrate NAME=<plugin_name> VERSION=0`.
2. Delete the plugin folder and restart.

**Expected Result:**
- Redmine starts cleanly; the Time Tracker navigation entry is gone.
- **Core Redmine time entries survive** — only plugin-owned data (tags, location records, running timers) is
  removed. Losing users' logged hours would be Critical.
- Verify core Redmine's spent-time report still shows the historical data.
- Confirm no stored location data remains, since it is personal data and should not outlive the plugin.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
