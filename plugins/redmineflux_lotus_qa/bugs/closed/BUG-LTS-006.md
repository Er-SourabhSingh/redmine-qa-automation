# BUG-LTS-006

- Bug ID: BUG-LTS-006
- Production Redmine Issue ID: 120326
- Severity: N/A — FIXED, closed 2026-09-10
- Title: [FIXED] Issue detail page's "Untergeordnete Tickets" (subtasks) and "Zugehörige Tickets" (related tickets) tables rendered far wider than their container at 1280×720, spilling into/overlapping the adjacent Historie/Notizen column — confirmed now scrolling within their own contained wrapper instead
- Redmine version: 7.0.1.stable
- Plugin name: Redmineflux Lotus Theme (redmineflux_lotus) — the issue detail page layout is owned by this plugin's theme markup; the wide table itself is populated by core Redmine plus multiple installed plugins each contributing a column (see Actual Result)
- Plugin version: 7.0.0
- Environment: Forge — `https://flux-fhggkobjh49.forge.zehntech.com/`
- Theme: Redmineflux lotus
- Language: German (Deutsch)
- Browser: Chromium (Playwright MCP)
- Resolution: 1280×720
- User role: Admin
- Date: 2026-09-09

## Preconditions

- German language active, Lotus theme active.
- An issue with at least one subtask and one related ticket (e.g. issue #266 — child Bug #267, related Bug #260).
- Viewport: 1280×720.

## Steps to reproduce

1. Set theme to Redmineflux lotus, browser viewport to 1280×720.
2. Open an issue detail page that has at least one subtask and one related ticket (e.g. `/issues/266`).
3. Scroll to the "Untergeordnete Tickets" and "Zugehörige Tickets" sections.

## Expected result

- The subtask/related-ticket tables should fit within their column (the left/main content column, not the full page width), either by showing a reduced, sensible column set for this embedded context or by scrolling within their own container — consistent with the rest of the issue detail page respecting the two-column (main content + Historie/Notizen sidebar) layout.

## Actual result

Confirmed via computed layout: the table (`table.list.issues.odd-even`) renders at **2001px wide** inside a container that is only **548px wide** (`overflow-x: visible` on the container — it does not scroll or clip, it simply spills outward). Visually (see screenshot), the table's later columns bleed rightward past the main content column and overlap the right-hand Historie/Notizen sidebar panel, and the row wraps character-by-character in its narrowest column ("Bug #267: dfdasfsd" renders as a single letter per line).

The table renders 32 columns for a single subtask row, including columns contributed by multiple different installed plugins/core areas: `subject`, `status`, `assigned_to`, `start_date`, `due_date`, `done_ratio`, `project`, `parent`/`parent-subject`, `priority`, `author`, `watcher_users`, `updated_on`, `category`, `fixed_version`, `estimated_hours`, `estimated_remaining_hours`, `total_estimated_hours`, `spent_hours`, `total_spent_hours`, `created_on`, `closed_on`, `last_updated_by`, `relations`, `attachments`, `is_private`, `sprint_craft`, `story_points`, `tags`, plus checkbox/buttons columns. This is the full list-view column set (as configured for the main Tickets list), reused verbatim for the much narrower embedded subtask/relations table on the issue detail page, with no column reduction or width constraint applied for this context.

**Confirmed theme-agnostic**: reproduces identically under the Default (Standard) theme, same issue, same resolution, same column set — the underlying "too many columns, no width constraint" defect is not caused by Lotus's CSS. It is filed here (rather than against a single contributing plugin) because: (a) no single installed plugin is uniquely responsible — many plugins each contribute one column to the shared list-view column set; and (b) it was found during this test cycle's issue-detail-page coverage under Lotus, at the user's explicit direction to file it against the plugin covering the "core issue detail page" for this cycle.

## Severity rationale

Medium: purely a display/layout defect (all data remains present and functional, e.g. via the horizontal scrollbar it forces on the page), but it visibly breaks the issue detail page's layout — the subtask/relations table content overlaps the adjacent sidebar panel — on any issue that has subtasks or relations, at the 1280×720 resolution this test cycle explicitly covers.

## Evidence

### Screenshot

![Subtask/relations table overflowing into the Historie/Notizen column under Lotus at 1280x720](../../screenshots/BUG-LTS-006/subtask-relations-table-overflow-lotus-1280x720.png)

### Screenshot — Default theme, same issue/resolution (confirms theme-agnostic)

![Same overflow reproduces under Default theme](../../screenshots/BUG-LTS-006/subtask-relations-table-overflow-default-theme-comparison.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-LTS-006/retest-yyyy-mm-dd-pass.png)

### Console / log

- No related console errors; this is a CSS/layout defect.

## Fix verified — 2026-09-10, new Forge server (flux-f3lnytazd49)

Retested at 1280×720, Lotus theme, German language, Admin role, fresh test issue #267 with one subtask and one related ticket (both deleted afterward, cascade-deleted with the parent).

Confirmed via computed layout that the table's containing structure has changed: a new wrapper, `div.rf_issue_section_row`, now sits between the table and the issue-detail layout with **`overflow-x: auto`** (`clientWidth: 703px`, `scrollWidth: 1896px`) — the table itself still renders wide (1872px) inside its inner `.subtasks-wrapper`, but that wrapper is now correctly clipped and independently horizontally-scrollable within the 703px-wide section row, with a visible scrollbar/chevron affordance directly under each table (see screenshot).

Bounding-box check confirms **no overlap** between this scroll container (`x:116.7–819.8`) and the Historie/Notizen sidebar (`x:856.4+`) — a clean ~37px gap. The table content no longer bleeds into or overlaps the sidebar panel; it scrolls within its own bounds instead, exactly matching this bug's original "Expected result."

**FIXED.** Moving to `bugs/closed/`.

### Retest screenshot — 2026-09-10

![Subtask/related-tickets tables now scroll within their own container, no sidebar overlap](../../screenshots/BUG-LTS-006/retest-2026-09-10-fixed-scrollable-container.png)

## Duplicate check

- Duplicate found: No (checked `bugs/_duplicates.md` — empty register; distinct from `BUG-LTS-002`'s tab-strip clipping and `BUG-LTS-003`'s Sprint/Story-Points overlap, which are different containers on the same page)
- Existing bug reference (if duplicate): N/A
