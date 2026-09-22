# Final Bug Report — Redmineflux Lotus Theme

> Generated from bugs/open/. PDF only on explicit user request.

## Summary

| Total | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|
| 1 | 0 | 0 | 1 | 0 |

## Open Bugs

### BUG-LTS-007 — Project Overview page shows the "closed and read-only" warning twice under the Lotus theme

- Severity: Medium
- Production Redmine Issue ID: not yet reported
- Found incidentally while investigating a Checklist-plugin test fixture project, not part of a planned Lotus
  test pass.
- Root cause: `redmineflux_lotus/app/views/projects/show.html.erb` overrides Redmine core's Project Overview
  view and independently reimplements the closed-project warning in both of its internal branches (fallback and
  Lotus-active), duplicating the warning core already renders once, globally, via the base layout. Not tied to
  the active Theme setting — reproduces even when "Default" (not Lotus) is selected, since the plugin's view
  still participates in Rails' view lookup once installed.
- Full detail: `bugs/open/BUG-LTS-007.md`

## Environment

- Redmine Version: 7.0.0 (Docker, localhost:3010)
- Environment: Local Docker (redmine-docker-700-redmine-1)
- Test Date: 2026-09-22
