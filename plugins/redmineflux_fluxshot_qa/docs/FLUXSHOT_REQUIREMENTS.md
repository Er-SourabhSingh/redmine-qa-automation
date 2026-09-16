# Plugin Requirements — Fluxshot Chrome Extension (+ redmineflux_fluxshot plugin)

> Source: https://www.redmineflux.com/knowledge-base/plugins/fluxshot-chrome-extension/ (official vendor knowledge
> base, ingested 2026-09-15).

## Overview

Fluxshot is a **two-part product**: a Chrome extension that captures and annotates browser screenshots, and a
`redmineflux_fluxshot` Redmine plugin that exposes the API endpoints the extension calls. Users capture the current
tab, annotate it, and create a new Redmine issue or attach the screenshot to an existing one — without leaving the
page.

This is the only item in the Redmineflux set whose primary interface is **outside Redmine**, which changes how it
must be tested: the browser, the extension's local storage, and the server plugin are three separate surfaces, and
a defect can live in any of them.

## Key Features

1. **One-click capture** — clicking the toolbar icon captures the current tab immediately and opens the editor in
   a new tab.
2. **Painterro annotation** — text, rectangle, ellipse, arrow, pencil/brush, highlighter, crop, **blur**, colour
   picker, eraser.
3. **Add Issue tab** — project, tracker, subject (required), description, assignee, parent issue, template.
4. **Update Issue tab** — project, tracker, searchable issue dropdown, pre-filled subject and description; attaches
   the screenshot to the chosen issue.
5. **Save / Save & Open** and **Update / Update & Open** action pairs.
6. **Templates** — private per user; name, subject, description; create, edit, delete with a confirmation modal;
   selectable from the Add Issue tab to pre-fill.
7. **Rich description editor** — H1, H2, bold, italic, underline, bullet and numbered lists, link. Saved as
   **Redmine-compatible Markdown**.
8. **Timer capture** — 3 / 5 / 10 second delay with a full-screen countdown overlay and a Cancel button, for
   capturing hover states and dropdowns.
9. **Copy to clipboard** — copies the annotated screenshot without creating anything in Redmine.
10. **Dark mode** and a **five-colour accent theme** (Blue, Purple, Green, Orange, Rose), both persisted.
11. **Resizable sidebar** — 260 px minimum, 520 px maximum, persisted; Painterro resizes to fill the rest.
12. **Login** — Redmine base URL, username and password; the extension authenticates and stores the resulting
    **API key in `chrome.storage.local`**. Logout clears stored credentials.

## Permissions Matrix

The KB publishes **no** plugin permission for the server side. Authority comes from the authenticated user's own
Redmine permissions, applied through the API. One behavioural note is given: *"Non-admin users see only issues
assigned to them"* in the Update Issue dropdown.

| Action | Admin | Manager | Developer | QA | Reporter | Non-member | Anonymous |
|--------|-------|---------|-----------|-----|----------|------------|-----------|
| Log in from the extension | | | | | | | |
| See a project in the Project dropdown | | | | | | | |
| Create an issue via the extension | | | | | | | |
| See an issue in the Update dropdown | | | | | | | |
| Update an issue / attach a screenshot | | | | | | | |
| Create and use own templates | | | | | | | |
| See another user's templates | | | | | | | |

The two rows worth the most attention: whether the **project and issue dropdowns** are scoped to what the user may
actually see, and whether **templates are genuinely private** as the KB claims.

## Known Constraints

- **The Redmine plugin is mandatory.** Without it the extension cannot function; `plugin_info.json` returning 404
  is the documented symptom, and `{"installed": true, "version": "..."}` is the success check.
- **The Redmine REST API must be enabled** (Administration → Settings → API), or login fails with
  "Invalid credentials".
- **The API key lives in `chrome.storage.local`** — on the device, inside the browser, and per the KB never sent
  to any third party.
- **Templates are private per user** and are stored server-side in a `fluxshot_templates` table, which the
  migration rollback drops.
- **Sidebar width is bounded to 260–520 px.**
- Timer capture requires the source tab to remain open and not navigating when the countdown fires.
- Declared compatibility: Redmine 4.0.x–4.2.x, 5.0.x, 5.1.x, 6.0.x **and 6.1.x** — the widest range in the set.
  Chrome 88+ (Manifest V3); Chromium browsers such as Edge and Brave also supported.

## Installation Prerequisites

1. **Server side:** `redmineflux_fluxshot` extracted into `plugins/` with its folder name unchanged;
   `bundle install`; `RAILS_ENV=production bundle exec rails redmine:plugins:migrate`; restart.
2. **REST API enabled** in Administration → Settings → API.
3. Verify with `https://<redmine>/plugin_info.json`.
4. **Client side:** Fluxshot installed from the Chrome Web Store on Chrome 88 or later.
5. Test accounts across several permission levels, plus at least two users for the template-privacy cases —
   a single account cannot demonstrate privacy.
6. A page containing visibly sensitive-looking content, for the blur-tool cases.
