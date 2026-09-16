# User Guide — Redmineflux Time Tracker Plugin

> This file must be read before writing any test case. It describes real end-user behaviour and UI flows.
> Source: https://www.redmineflux.com/knowledge-base/plugins/time-tracker/ (ingested 2026-09-15).
> Confirm each flow against the running instance during the first execution session and correct this file where
> the real UI differs.

## Getting Started

**Time Tracker** appears in the top navigation after login. The main page carries the timer, the manual-entry
action and a scrollable list of current and previous entries. A left sidebar reaches the Calendar, Activity,
Reports and Tags sections.

## Key Screens

| Screen | Path | Purpose |
|--------|------|---------|
| Time Tracker main | Top nav → Time Tracker | Timer, manual entry, entry list |
| Calendar | Sidebar → Calendar icon | Visual logging, resizing, moving entries |
| Activity | Time Tracker → Activity tab | All users' logs, filters, Map View |
| Reports | Sidebar → Reports | Summary, Detailed, Weekly |
| Tags | Sidebar → Tags | Create, edit, delete, filter Used/Unused |
| Plugin configuration | Administration → Plugins → Redmineflux Time Tracker → Configure | Location, manual entry, Maps key, layout |

## Step-by-Step Workflows

### Workflow 1: Configure the plugin (admin)

1. Administration → **Plugins** → **Redmineflux Time Tracker** → **Configure**.
2. Set the options:
   - **Require Location Permission** — users must allow location access to start or stop the timer. Named users can
     be selected; **leaving the selection empty applies it to all users.**
   - **Enable Manual Time Entry** — allows manual entries with custom start and end times.
   - **Google Maps API Key** — needed for the map view.
   - **Time Tracker Page Design** — Modern Card, Compact Layout or Detailed Expanded; each can be previewed.
3. Click **Apply**.

### Workflow 2: Run the timer

1. Open **Time Tracker** from the navigation.
2. Select the **Project**, **Issue**, **Tag** and **Activity**.
3. Click **Start**. The timer runs and a **Stop** button appears.
4. To finish: click **Stop**, enter a comment if Redmine requires one, fill any required custom fields, and click
   **Stop** again to save the entry.

> If location tracking is required and the user denies location access, **the timer will not start**.

### Workflow 3: Log time manually

1. On the Time Tracker page click **Manual Time Log**.
2. Select the project, issue and required fields.
3. Enter **Start Time**, **End Time** and **Date**.
4. Click **Add**.

> Manual entry must be enabled by an administrator first.

### Workflow 4: Edit an entry inline

1. Click the field to change — comment, tag, activity, start time, end time or date.
2. Update the value.
3. Press **Enter** to save.

### Workflow 5: Duplicate or delete an entry

1. Click the entry's context menu (three vertical dots).
2. Choose **Duplicate** or **Delete** and confirm.

> Entries with the same data on the same day are automatically combined.

### Workflow 6: Use the calendar

1. Sidebar → **Calendar** icon.
2. **Add Time Entry**, fill the fields, and click **Log Time** to save for the selected range.
3. Drag the start or end of an entry to extend or shorten it.
4. Double-click an entry to edit its details.
5. Drag and drop an entry to move it to another date.

### Workflow 7: View activity and the map

1. Open the **Activity** tab.
2. Filter by **Project**, **User** and a **custom date range**.
3. Switch to **Map View** to see user locations where location data is available.

### Workflow 8: Reports

1. Sidebar → **Reports**.
2. **Summary** — group by Project, User or Activity; view charts; export to **PDF, CSV or XML**.
3. **Detailed** — full entry data, filtered by project, user and activity.
4. **Weekly** — weekly totals, filtered by user and project.

### Workflow 9: Browser extension

1. Click the Time Tracker extension icon in the browser.
2. Enter the **Base URL** of the Redmine instance and your **API Key**.
3. Click **Test Connection**; on success, **Save Settings**.
4. Select a **Project** and click **Start**. The timer runs in the background and the extension can be closed.
5. Reopen the extension and click **Stop** to record the entry.

## UI Elements Reference

| Element | Where | Notes |
|---------|-------|-------|
| **Start** / **Stop** | Timer bar | Stop opens the comment / custom field prompt |
| **Manual Time Log** | Time Tracker page | Only present when enabled by an admin |
| Three-dot context menu | Each entry row | Duplicate, Delete |
| Calendar entry | Calendar view | Draggable edges, double-click to edit, drag to move |
| **Map View** toggle | Activity tab | Requires a Google Maps API key and location data |
| **Used / Unused** filter | Tags section | Distinguishes tags in use from orphans |

## Notes & Known Behaviour

- **A denied location permission blocks the timer entirely.** This is the plugin's hardest failure mode from a
  user's point of view — they simply cannot record work until the browser permission is granted.
- **An empty user selection on Require Location Permission means "everyone"**, not "nobody".
- **Manual entry is invisible until enabled** — its absence is configuration, not a defect.
- **Duplicating an entry may merge rather than add**, when the duplicate matches an existing same-day entry
  exactly.
- The **Map View needs both a valid Google Maps API key and stored location data**; either missing produces an
  empty or non-functional map rather than an error.
- Browsers block geolocation on insecure origins, so location features should be tested over HTTPS.
- Changing the Redmine domain requires updating the domain in the Redmineflux account's Order section and
  re-entering the License Key and Security Key.
