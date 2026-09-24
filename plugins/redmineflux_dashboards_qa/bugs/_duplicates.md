# Duplicate Bug Register — Redmineflux Dashboards

> Check this before creating any new bug.

| Duplicate Finding | Root Cause | Original Bug ID |
|-------------------|------------|-----------------|

## Retracted findings — not bugs (check before re-filing)

> These were filed as real bugs, then retracted the same day. Retired bug IDs — do not reuse them for a new bug,
> and do not re-file these findings.

| Finding | Why retracted | Retired Bug ID |
|---------|----------------|-----------------|
| Project Progress (Gauge) widget doesn't change when the global date-range filter changes | **Intentional design**, confirmed by the product owner — the Gauge is deliberately an all-time metric, not scoped to the date-range filter. | `BUG-DSH-009` (retracted 2026-09-24) |
| "Our Queries" tab — a custom Chart Title typed in Add Chart appears not to apply | **False positive — a testing error, not a product defect.** The investigation targeted the wrong DOM element, `#chartTitleInput` (a hidden Settings-panel field that happens to share a similar id), instead of the real create-time field, `#chartTitle`. Once targeted correctly via genuine `browser_select_option`/`browser_type`/`browser_click`, the title applies exactly as expected. See `DASHBOARDS_MEMORY.md`. | `BUG-DSH-010` (retracted 2026-09-24) |
| Saved-query widgets (Add Chart → Saved Queries tab) don't change when the global filter bar (Date Range/Tracker) changes | **Intentional design**, confirmed by the product owner — saved-query widgets are deliberately governed solely by their own saved query's own criteria, never further constrained by the dashboard's global filter bar. | `BUG-DSH-012` (retracted 2026-09-24) |
