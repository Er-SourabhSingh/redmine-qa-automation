# Final Bug Report — Redmineflux Dashboards

> Generated from bugs/open/. PDF only on explicit user request.

## Summary

| Total | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|
| 2 | 0 | 0 | 1 | 1 |

## Open Bugs

### BUG-DSH-002 (Medium)
Chart-template query widget's Settings panel is missing Legend Position and Data Labels controls (#120914 part 3). Only Chart Color Palette + Top Accent Color are present; #120914 explicitly requires all three (palette, legend position, data labels) to become available for a query widget drawn as a chart. See `bugs/open/BUG-DSH-002.md`.

### BUG-DSH-004 (Low)
Grouping-dimension selector offers "QA Multi Select Field", a genuine multi-select custom field, as a groupable dimension — #120914's Out-of-scope section explicitly excludes multi-select custom fields from grouping. See `bugs/open/BUG-DSH-004.md`.

## Environment

- Redmine Version: 7.0.1.stable
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Test Date: 2026-09-23
