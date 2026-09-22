# Plugin Requirements — Redmineflux Shift Management

> Scaffolded incidentally 2026-09-22 after an ad-hoc, site-wide bug finding (see `SHIFT_MANAGEMENT_HANDOFF.md`) —
> not a full onboarding pass. Requirements below are minimal, gathered only from what was directly observed; a
> proper requirements-gathering session (vendor KB, user guide) is still needed before writing test cases.

## Overview

Shift-Based Attendance and Leave Management System for Redmine (per its own Administration → Plugins listing).

## Key Features

- (not yet documented — requires a proper requirements pass)

## Business Workflows

- (not yet documented)

## Permissions Matrix

| Action | Admin | Manager | Developer | QA | Client | Non-member |
|--------|-------|---------|-----------|-----|--------|------------|

## Known Constraints

- The plugin's site-wide JS (`shift_management-*.js`) attaches its own `click` listener to **every**
  `[data-confirm]` element on **every page of the instance**, not scoped to the plugin's own UI — see
  `BUG-SFM-001`. Any future JS added to this plugin must be scoped to the plugin's own DOM (e.g. inside a
  container with a plugin-specific class/id), never a bare `document.querySelectorAll('[data-confirm]')` or
  similar unscoped site-wide selector.
