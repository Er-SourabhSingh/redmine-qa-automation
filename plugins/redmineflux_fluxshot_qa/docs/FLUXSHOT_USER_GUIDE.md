# User Guide — Fluxshot Chrome Extension

> This file must be read before writing any test case. It describes real end-user behaviour and UI flows.
> Source: https://www.redmineflux.com/knowledge-base/plugins/fluxshot-chrome-extension/ (ingested 2026-09-15).
> Confirm each flow against the running instance during the first execution session and correct this file where
> the real UI differs.

## Getting Started

Fluxshot is used entirely from the browser toolbar. Clicking its icon captures the current tab and opens an editor
in a new tab: the screenshot with the Painterro annotation toolbar on the left, and a sidebar on the right with
three tabs — **Add Issue**, **Update Issue** and **Templates**.

The server side must be prepared first: the `redmineflux_fluxshot` plugin installed and the Redmine REST API
enabled.

## Key Screens

| Screen | Where | Purpose |
|--------|-------|---------|
| Login modal | First use of the editor | Base URL, username, password |
| Editor | Opens on capture | Screenshot + annotation toolbar + sidebar |
| Add Issue tab | Sidebar | Create a new Redmine issue |
| Update Issue tab | Sidebar | Attach to and update an existing issue |
| Templates tab | Sidebar | Manage private reusable subject/description pairs |
| Settings panel | ⚙ in the sidebar header | Dark mode, accent colour |

## Step-by-Step Workflows

### Workflow 1: Install and verify

1. **Extension:** Chrome Web Store → search *Fluxshot* → **Add to Chrome** → **Add Extension**. Pin it via the
   puzzle (🧩) icon if the toolbar icon is not visible.
2. **Server plugin:** copy `redmineflux_fluxshot` into `/path/to/redmine/plugins/` without renaming the folder →
   `bundle install` → `RAILS_ENV=production bundle exec rails redmine:plugins:migrate` → restart Redmine.
3. **Enable the REST API:** Administration → Settings → **API** → tick *Enable REST web service*.
4. **Verify:** open `https://your-redmine.com/plugin_info.json`. It should return
   `{ "installed": true, "version": "1.1.0" }`.

### Workflow 2: First login

1. Open any web page and click the Fluxshot icon — the tab is captured and the editor opens.
2. In the login modal enter the **Redmine Base URL**, **Username** and **Password**, then click **Login**.
3. Fluxshot authenticates and stores your API key in local browser storage. You stay logged in until you log out.
4. To log out: click the logout icon (→) in the top-right of the sidebar.

### Workflow 3: Capture, annotate and create an issue

1. Open the page and click the Fluxshot icon.
2. Annotate with the Painterro toolbar: text, rectangle, ellipse, arrow, pencil, highlighter, crop, blur, colour
   picker, eraser.
3. In the sidebar, on **Add Issue**, fill in:
   - **Project** (from your accessible projects), **Tracker**, **Subject** (required),
   - **Description** (rich text editor), **Assignee** (optional), **Issue** (optional parent),
   - **Templates** (optional, pre-fills Subject and Description).
4. Click **Save** — creates the issue, shows a toast with the issue number, closes the editor tab.
   Or **Save & Open** — creates it and navigates to the issue in Redmine.

The annotated version of the screenshot is automatically used as the attachment.

### Workflow 4: Update an existing issue

1. Capture and annotate as above.
2. Open the **Update Issue** tab.
3. Choose the **Project**, filter by **Tracker**, then pick the issue from the searchable **Issues** dropdown
   (shows ID and subject).
4. The **Subject** and **Description** pre-fill from the issue and can be edited.
5. Click **Update** or **Update & Open**. The screenshot is attached to the issue and the changes are saved.

### Workflow 5: Templates

1. Open the **Templates** tab.
2. Enter a **Template Name**, **Subject** and **Description**, then click **Create** — the card appears below.
3. Edit with the pencil (✏) icon and **Update**; delete with the trash (🗑) icon and confirm in the modal.
4. Use one by selecting it in the **Templates** dropdown on the Add Issue tab.

Templates are private — each user sees only their own.

### Workflow 6: Timer capture

1. Click the timer icon (⏱) in the header and choose **3**, **5** or **10** seconds.
2. The extension switches back to the original tab and a full-screen countdown overlay appears.
3. When the countdown reaches zero the screenshot is taken and the editor re-activates with it loaded.
4. Click **Cancel** in the overlay to abort.

### Workflow 7: Copy to clipboard

1. Click the copy icon (⎘) in the header.
2. The current annotated screenshot is copied; a toast confirms *"Screenshot copied to clipboard"*.
3. The editor stays open — you can keep annotating or go on to create an issue.

### Workflow 8: Appearance

1. Click the settings icon (⚙).
2. Toggle **Dark Mode**, or pick an **Accent Color** from Blue, Purple, Green, Orange or Rose.
3. Drag the sidebar's left edge to resize it (260–520 px); Painterro reflows to fill the rest.

All three preferences are saved and restored next session.

## UI Elements Reference

| Element | Where | Notes |
|---------|-------|-------|
| ⏱ Timer | Sidebar header | 3 / 5 / 10 second delayed capture |
| ⎘ Copy | Sidebar header | Copies the annotated screenshot |
| ⚙ Settings | Sidebar header | Dark mode and accent colour |
| → Logout | Sidebar header | Clears stored credentials |
| Painterro toolbar | Left of the screenshot | Ten annotation tools including blur and crop |
| **Save** / **Save & Open** | Add Issue tab | Create; optionally navigate to the issue |
| **Update** / **Update & Open** | Update Issue tab | Attach and save; optionally navigate |
| ✏ / 🗑 on a template card | Templates tab | Edit / delete with confirmation |

## Notes & Known Behaviour

- **The Redmine plugin is required** — without it the extension cannot connect, and login fails with
  "Plugin not found". `plugin_info.json` is the documented way to check.
- **The REST API must be enabled**, or login fails with "Invalid credentials" even when the password is right.
- **Non-admin users see only issues assigned to them** in the Update Issue dropdown.
- **The API key is stored in `chrome.storage.local`** — on the device, never sent to third parties. Logging out
  clears it.
- **Timer capture needs the source tab to stay open** and not navigate while the countdown runs, or the capture
  comes out blank.
- **Copying to clipboard needs the browser's clipboard permission**, and works most reliably with the editor tab
  in focus.
- **Reverting the plugin migration drops `fluxshot_templates`** and every saved template with it — back up first.
- Descriptions are stored as **Redmine-compatible Markdown**.
