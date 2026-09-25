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
| A view-only/read-only role can add, delete, reposition, or reconfigure dashboard widgets | **Intentional design, confirmed via the vendor KB (fetched directly 2026-09-25)**: "any user with access to the project can open the dashboard," with no documented granular permission for any dashboard action — equal capabilities across all project roles is the documented model, not a gap. Every local doc (`DASHBOARDS_REQUIREMENTS.md`'s Permissions Matrix, `FEATURES_LIST.md`, `SCOPE.md`) already marked this as an open "?" rather than a stated restriction. | `BUG-DSH-015` (retracted 2026-09-25) |
| An invalid global custom date range (end before start) appears to be silently rejected with no error message | **False positive — a testing error, not a product defect.** A `toast-notification toast-error` ("End date cannot be earlier than start date") does appear, but auto-dismisses fast enough that a static/delayed DOM check misses it — confirmed present via a `MutationObserver` attached before the triggering click, the same technique already used for other fast-dismissing toasts in this plugin (see `BUG-DSH-053`-era notes in `DASHBOARDS_MEMORY.md`). | `BUG-DSH-017` (retracted 2026-09-25) |
| A restricted-visibility user's public share link shows the project's full, unrestricted data rather than the sharer's own scope | **Intentional design (by consistency), not filed as its own defect** — this plugin shows project-wide, unscoped data regardless of viewer everywhere else already established this session (`BUG-DSH-013`, still open as its own internal-session finding), and the vendor KB doesn't state or imply public sharing should be scoped any differently. Confirmed with the user (product owner) 2026-09-25 that this consistency argument is accepted; do not re-file the public-sharing angle of this finding specifically (the underlying data-scoping gap itself, `BUG-DSH-013`, remains open and should still be pursued/fixed there). | `BUG-DSH-022` (retracted 2026-09-25) |
