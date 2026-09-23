# Bug Report

- Bug ID: BUG-GNT-009
- Production Redmine Issue ID: 121144
- Title: Custom-field column headers hard-truncate mid-word with no ellipsis when many columns are enabled — `overflow:hidden`/`text-overflow:ellipsis` declared but not taking effect, same defect class as the fixed BUG-GNT-002
- Redmine version: local dev build (#120913)
- Plugin name: Redmineflux Gantt Chart
- Plugin version: local dev build (#120913, not yet a tagged release)
- Environment: Local Docker `http://localhost:3010`
- Browser: Chromium (Playwright MCP), 1280×720 viewport
- User role: Admin (layout-only, not role-dependent)
- Date: 2026-09-23

## Steps to reproduce

1. Open a project's Flux Gantt view with several custom fields configured to show as columns (this fixture has 14: "QA Inline Date Field", "QA Required Text Field", "QA Second Required Field", "QA Bug-Only Tracker Field", etc.).
2. Widen the left panel via its resize splitter (drag `.rf-gantt-panel-splitter__grip`) so enough of these columns are visible at once that several exceed their own individual column width.
3. Look at the column header row for those custom-field columns.

## Expected result

- Each column header should either show its full label if there's room, or ellipsis-truncate cleanly (e.g. "QA Inline D…") per the `text-overflow: ellipsis` already declared on these cells — consistent with the fix already verified and closed for the other header surfaces in `BUG-GNT-002`.

## Actual result

- Header labels are hard-cut mid-word with **no ellipsis dots at all**: "QA Inline Date Field" renders as "QA INLINE DATE FIEL", "QA Required Text Field" as "QA REQUIRED TEXT I", "QA Second Required Field" as "QA SECOND REQUIR" — confirmed via a zoomed screenshot crop, not just a compressed/low-res read.
- DOM inspection confirms this is the same failure mode as `BUG-GNT-002`'s original root cause: each column span (`.rf-gantt-left__col-cf`) has `overflow: hidden`, `text-overflow: ellipsis`, `white-space: nowrap` correctly declared, and a `title` attribute with the full field name (so a hover tooltip does reveal the full name — a partial mitigation) — but the ellipsis is not actually rendering; the text just gets clipped raw at the cell's fixed 130px width regardless of how much of the label overflows (`scrollWidth` measured 147–202px across the different QA field headers, all overflowing by 17–72px).
- Root cause of *why* the columns are narrow enough to trigger this: the panel's data-row container (`.rf-gantt-left`) has `overflow-x: hidden` at a fixed resizable width — so once enough columns are enabled to exceed that width, every extra column's header text overflows its own 130px cell and hits this non-functional clipping.
- Secondary, related finding: the header container (`.rf-gantt-left__header`) has `overflow-x: visible` while the body/row container (`.rf-gantt-left`) has `overflow-x: hidden` — an inconsistency between the two. In the narrow (unresized) default panel width, this makes header cells for the trailing columns geometrically extend past the panel's right edge (into the timeline's screen region) while the actual data cells for those same columns are simply clipped/invisible with no scrollbar to reach them — though visually the timeline's own opaque header currently paints over this, so no visible garbling was observed at the default width (only once the panel is widened, as in the reported screenshot, does the truncation itself become visible without that mitigating overlap).

## Evidence

### Screenshot

![User-reported repro — QA field headers hard-cut with no ellipsis, next to the Name/+Add Issue header](../../screenshots/BUG-GNT-009/user-reported-header-overlap.png)

![Reproduced live with a real splitter drag to widen the panel — same hard-cut headers](../../screenshots/BUG-GNT-009/qa-columns-real-drag-header.png)

![Zoomed crop confirming zero ellipsis dots at the cut point](../../screenshots/BUG-GNT-009/qa-field-header-zoomed.png)

### Console / log

- No console errors — pure CSS/layout rendering defect, same class as `BUG-GNT-002` (see that closed bug's history for the identical failure pattern on different header elements, fixed 2026-09-09). This is a **new** bug, not a reopen — it affects a different component (dynamically-rendered custom-field headers) that the BUG-GNT-002 fix evidently did not cover.

## Duplicate check

- Duplicate found: No (same root-cause *pattern* as the closed `BUG-GNT-002`, but a different set of elements — filed separately per that bug's own precedent of documenting same-root-cause variants only when they're the *same* elements/surface)
- Existing bug reference (if duplicate): n/a — see `BUG-GNT-002` (closed) for the related historical pattern
