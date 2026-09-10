# BUG-LTS-005

- Bug ID: BUG-LTS-005
- Production Redmine Issue ID: 120220
- Severity: Medium
- Title: The Redmineflux Lotus theme's own "Konfigurieren" (Configure) link on Administration → Plugins leads to a genuine 404 — the plugin declares a settings page but the route/view doesn't exist
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Lotus Theme (redmineflux_lotus)
- Plugin version: 7.0.0
- Environment: Forge — `https://flux-frmka2kzh49.forge.zehntech.com/`
- Theme: (reproduces regardless of active theme — see Actual Result)
- Language: German (Deutsch)
- Browser: Chromium (Playwright MCP)
- Resolution: 1920×1080
- User role: Admin
- Date: 2026-09-08

## Preconditions

- German language active, logged in as Admin.
- Redmineflux Lotus plugin installed and listed at Administration → Plugins.

## Steps to reproduce

1. Navigate to Administration → Plugins.
2. Locate the "Redmineflux Lotus plugin" row.
3. Click its "Konfigurieren" (Configure) link.

## Expected result

- Either a working plugin-settings page should load (consistent with every other Redmineflux plugin tested this cycle — Agile Board, Gantt, Dashboards, Inline Editor, Checklist, Tags all have functioning Configure pages), or, if this plugin genuinely has no configurable settings, the "Konfigurieren" link should not be shown at all.

## Actual result

Confirmed via direct navigation and via the real "Konfigurieren" link (`href="https://<host>/settings/plugin/redmineflux_lotus"`, verified from the DOM, not guessed) — the page returns a genuine Rails 404 ("Die angefragte Seite existiert nicht oder wurde entfernt."), not a settings form. The 404 page itself is correctly translated (core Redmine's own error page), so this is purely a missing/broken route or view for this one plugin's settings, not a translation defect. This reproduces identically regardless of which theme is currently active (Lotus or Default), since it's a server-side routing failure, not a rendering/CSS issue.

## Severity rationale

Medium: this is the plugin's only administrative entry point for any settings it might expose (theme-wide options, if any are intended), and it is completely non-functional — every other Redmineflux plugin in this test cycle has a working Configure page, making this a conspicuous, 100%-reproducible gap for the one plugin actively being tested throughout this session.

## Fix verified — 2026-09-09

Retested on Forge server `https://flux-fhggkobjh49.forge.zehntech.com/`, Admin role. Navigated to Administration → Plugins → Redmineflux Lotus plugin's "Konfigurieren" link (`/settings/plugin/redmineflux_lotus`): page now loads a working settings page with three functioning tabs — "Tracker-Rahmenfarben", "Prioritätssymbole", "Logo" — no 404. FIXED — moving to `bugs/closed/`.

## Evidence

### Screenshot

![404 page reached via the Lotus plugin's own "Konfigurieren" link](../../screenshots/BUG-LTS-005/configure-link-404.png)

### Retest screenshot

![Configure page now loads correctly, server 2](../../screenshots/BUG-LTS-005/retest-2026-09-09-server2-pass.png)

### Console / log

- HTTP 404 response confirmed via Playwright navigation (`HTTP status: 404`), not just a visual "not found" message — a genuine unmatched route.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A
