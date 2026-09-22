# Test Cases — Fluxshot — Installation, Server Plugin, Login & Session

> Source: vendor KB — "Version Compatibility", "Installation" (extension and Redmine plugin), "Configuration &
> First Login", Troubleshooting (login failures, extension not working), FAQ on API key storage and logout,
> "Uninstallation".
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Fluxshot Chrome Extension + `redmineflux_fluxshot` Redmine plugin
- Version: (record both at execution time)
- Redmine version: (record — KB declares 4.0.x–4.2.x, 5.0.x, 5.1.x, 6.0.x, 6.1.x)
- Browser: (record — Chrome 88+ / Edge / Brave)
- Path: plugins/redmineflux_fluxshot_qa

## Methodology note

This product has **three surfaces**: the Chrome extension, the browser's local storage, and the Redmine plugin's
API. Every result should name which surface the observation was made on — capture and UI problems are
extension-side, while permission and data problems are almost always server-side.

---

## Functional Cases — Installation

---

### TC-FSX-024: Install the extension from the Chrome Web Store

**User Role:** Any browser user
**Steps:**
1. Chrome Web Store → search **Fluxshot** → **Add to Chrome** → confirm **Add Extension**.

**Expected Result:**
- The extension installs and its icon appears in the toolbar.

---

### TC-FSX-025: Pin the extension when the icon is hidden

**User Role:** Any
**Steps:**
1. Click the puzzle (🧩) icon, find Fluxshot, pin it.

**Expected Result:**
- The icon stays visible in the toolbar — the KB's documented remedy for a missing icon.

---

### TC-FSX-026: Install the Redmine plugin

**User Role:** Admin
**Steps:**
1. Copy `redmineflux_fluxshot` into `plugins/` **without renaming the folder**.
2. `bundle install`; `RAILS_ENV=production bundle exec rails redmine:plugins:migrate`; restart.
3. Open Administration → Plugins.

**Expected Result:**
- The plugin is listed.

---

### TC-FSX-027: Migrations create the templates table

**User Role:** Admin
**Steps:**
1. After migrating, create a template from the extension (see the templates suite).

**Expected Result:**
- It saves without a missing-table exception in `log/production.log` — the KB names `fluxshot_templates` as the
  table the migration creates.

---

### TC-FSX-028: REST API must be enabled

**User Role:** Admin, then an extension user
**Steps:**
1. Disable **Enable REST web service** in Administration → Settings → API.
2. Attempt to log in from the extension.
3. Re-enable and retry.

**Expected Result:**
- With the API off, login fails — and, per the KB, the symptom is **"Invalid credentials"**.
- **Record whether the message distinguishes a disabled API from a wrong password.** It does not, according to the
  documentation, which sends users to check their password when the real cause is a server setting. That is a
  genuine diagnosability defect worth filing, because the two causes need completely different fixes.

---

### TC-FSX-029: `plugin_info.json` confirms installation

**User Role:** Any
**Steps:**
1. Visit `https://<redmine>/plugin_info.json`.

**Expected Result:**
- Returns `{"installed": true, "version": "..."}`, per the KB's verification step.

---

### TC-FSX-030: `plugin_info.json` when the plugin is absent

**User Role:** Any
**Steps:**
1. With the plugin removed, request the same URL, then attempt to log in from the extension.

**Expected Result:**
- 404 on the endpoint, and the extension reports **"Plugin not found"** — the KB's documented pairing, and a good
  example of an error message that actually names its cause.
- Confirm the endpoint discloses **nothing else** about the instance: it is unauthenticated, so it should carry
  only the installed flag and version.

---

### TC-FSX-031: Browser compatibility

**User Role:** Any
**Steps:**
1. Repeat one full capture-and-create cycle in Chrome, Edge and Brave.

**Expected Result:**
- Identical behaviour in all three, per the KB's Chromium compatibility claim. Record the versions used.

---

### TC-FSX-032: Redmine version range

**User Role:** Admin
**Steps:**
1. Record the Redmine version.

**Expected Result:**
- Within 4.0.x–6.1.x. **This is the widest declared range in the whole Redmineflux set**, including 6.1.x which
  most of the other plugins do not claim — worth noting, since a shared test instance may suit this plugin and not
  its siblings.

---

## Functional Cases — Login

---

### TC-FSX-033: First-use login modal

**User Role:** New extension user
**Steps:**
1. Click the Fluxshot icon on any page.

**Expected Result:**
- The tab is captured, the editor opens, and a login modal asks for Base URL, Username and Password.

---

### TC-FSX-034: Successful login

**User Role:** Valid Redmine user
**Steps:**
1. Enter the correct base URL and credentials; click **Login**.

**Expected Result:**
- Authentication succeeds and the sidebar appears with the **Add Issue**, **Update Issue** and **Templates** tabs.

---

### TC-FSX-035: Wrong credentials

**User Role:** Any
**Steps:**
1. Enter a valid base URL with a wrong password.

**Expected Result:**
- Login is refused with a clear message, and **no credentials are stored** — confirm by reopening the editor and
  checking the modal reappears.

---

### TC-FSX-036: Wrong or unreachable base URL

**User Role:** Any
**Steps:**
1. Enter a malformed URL; then a valid URL pointing at a host that is not Redmine; then an unreachable host.

**Expected Result:**
- Each fails with a distinguishable, actionable message rather than one generic error. The three causes need
  different fixes, and the user has no other diagnostic available.

---

### TC-FSX-037: Locked or inactive Redmine account

**User Role:** A locked account
**Steps:**
1. Attempt to log in.

**Expected Result:**
- Refused. A locked Redmine account must not be able to create issues through the extension.

---

### TC-FSX-038: The API key is stored locally

**User Role:** Logged-in user
**Steps:**
1. After logging in, inspect `chrome.storage.local` for the extension.

**Expected Result:**
- The API key is present there, per the KB's stated design.

---

### TC-FSX-039: The API key is not exposed to web pages

**User Role:** Logged-in user
**Steps:**
1. On an ordinary web page, check whether the key is reachable from page scripts, `window`, `localStorage`, or
   the DOM.
2. Inspect the extension's network requests to confirm the key goes **only** to the configured Redmine host.

**Expected Result:**
- Not reachable from page context, and transmitted only to the user's own Redmine server.
- **A Redmine API key is a full credential.** If any visited page could read it, every site the user browses could
  act as them in Redmine — Critical. The KB states the key "is never sent to any third-party server", and this
  case is what verifies that claim rather than trusting it.

---

### TC-FSX-040: The key is not sent over an insecure connection

**User Role:** Logged-in user
**Steps:**
1. Configure an `http://` base URL and inspect the request.

**Expected Result:**
- Record whether plain HTTP is permitted. If it is, the API key travels unencrypted on every request — worth
  recording as a finding, and ideally warned about at login.

---

### TC-FSX-041: Session persists until logout

**User Role:** Logged-in user
**Steps:**
1. Close the editor tab, close Chrome, reopen and capture again.

**Expected Result:**
- No re-login is required, per the KB.

---

### TC-FSX-042: Logout returns to the login screen

**User Role:** Logged-in user
**Steps:**
1. Click the logout icon (→).

**Expected Result:**
- The login screen returns and the sidebar is no longer usable.

---

### TC-FSX-043: Logout clears the stored credentials

**User Role:** Logged-in user
**Steps:**
1. After logging out, inspect `chrome.storage.local` again.

**Expected Result:**
- **No API key remains.** The KB states logout "clears all stored credentials".
- A key left behind after logout on a shared or handed-over machine gives the next person full API access as the
  previous user — the whole point of logging out, and a High-severity defect if it survives.

---

## Negative Cases

---

### TC-FSX-044: Extension works without admin rights on Redmine

**User Role:** An ordinary member
**Steps:**
1. Log in and create an issue.

**Expected Result:**
- Works within that user's own permissions. Nothing about the extension requires administrator access.

---

### TC-FSX-045: Plugin folder renamed

**User Role:** Admin
**Steps:**
1. Rename the plugin folder, restart, and check `plugin_info.json` and extension login.

**Expected Result:**
- The endpoint 404s and login reports "Plugin not found" — a loud, diagnosable failure rather than a half-working
  extension. Restore and confirm recovery.

---

### TC-FSX-046: Extension disabled or cache stale

**User Role:** Any
**Steps:**
1. Disable the extension at `chrome://extensions` and click the toolbar icon.
2. Re-enable, then reload the extension with the ↺ button as the KB advises.

**Expected Result:**
- Nothing happens while disabled; normal behaviour returns after re-enabling and reloading.

---

### TC-FSX-047: Conflicting extensions

**User Role:** Any
**Steps:**
1. With other screenshot or ad-blocking extensions active, run a full capture-and-create cycle.

**Expected Result:**
- Fluxshot still captures and submits. Record any extension that interferes — the KB names extension conflicts as
  a troubleshooting step.

---

## Uninstallation

---

### TC-FSX-048: Remove the Chrome extension

**User Role:** Any
**Steps:**
1. Right-click the icon → **Remove from Chrome** → confirm.

**Expected Result:**
- The extension and its local storage — including the stored API key — are removed. Verify the key is gone.

---

### TC-FSX-049: Remove the Redmine plugin

**User Role:** Admin
**Preconditions:** **Database backup taken** — the KB warns that reverting drops `fluxshot_templates` and every
saved template.
**Steps:**
1. `bundle exec rake redmine:plugins:migrate NAME=redmineflux_fluxshot VERSION=0 RAILS_ENV=production`.
2. Remove the plugin folder and restart.

**Expected Result:**
- Redmine starts cleanly and `plugin_info.json` 404s.
- **Issues and attachments created through Fluxshot survive untouched** — they are ordinary Redmine issues and
  attachments, and losing them would be Critical.
- Templates are gone, as documented.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
