# BUG-TCM-049

> **CLOSED — 2026-10-07.** Production #122674 (https://flux.zehntech.com/issues/122674) is **Done**, 100% done.
> Closed on production by Sourabh Singh after retest — see "Production history" below. Local file synced from production on 2026-10-08.
> The original local bug file was lost (system reformatted before it was pushed); this file is rebuilt from the
> production issue's description and journal.

- Bug ID: BUG-TCM-049
- Production Redmine Issue ID: #122674 (https://flux.zehntech.com/issues/122674) — created 2026-10-06, assigned to Vaishnavi Bhawsar, Priority Low, Defect Severity Low-severity
- Title: Defect ID's column shows the full subject with no bound, breaking row height on long subjects — should show only the defect ID
- Severity: Low
- Redmine version: 6.x (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.1.0
- Target version: Testcase Management plugin Release 7.1.0 [07-10-2026]
- Defect Type: Usability
- Defect priority: Low
- Reported by: Sourabh Singh
- Date: 2026-10-06
- Status: Closed (production: Done, 2026-10-07)

## Summary

The Run execution grid's "Defect ID's" column (`_linked_defects.html.erb`) renders each linked defect's full, untruncated subject with no length cap and no CSS bound anywhere in the plugin's stylesheets:

```
link_to "##{defect.id} #{defect.subject}", issue_path(defect.id)
```

A defect whose subject happens to be long wraps across many lines inside the grid cell, inflating that single row's height to several times its neighbors' — visually breaking the grid's layout, especially once 2+ defects are linked to the same execution.

**Resolution (per product/user direction):** rather than truncating, the column should show **only the defect ID** (e.g. just "#105"), not the subject at all. This both matches the intended simplified display and eliminates the unbounded-row-height problem at the source, with no truncation/CSS work required.

## Steps to reproduce

1. Link a defect whose subject is unusually long (40+ characters) to a test case execution in a Run.
1. View that Run's execution grid.

## Expected result

The "Defect ID's" column shows only the defect ID, e.g. `link_to "##{defect.id}", issue_path(defect.id)` — no subject text, consistent row height regardless of the linked defect's subject length.

## Actual result

Live-confirmed: a defect with subject "sfdgsdf sdkfhskadlflkhsadkl fhksldahfkl jhsdakljhf kjlsdahf khasdfh asdf" renders completely unwrapped across 6 lines in one grid cell, making that row many times taller than its single-line neighbors.

## Suggested fix

In `app/views/issue_status_results/_linked_defects.html.erb`, change the link text to id-only:
```
link_to "##{defect.id}", issue_path(defect.id)
```

## Environment

Docker `localhost:3015` (project `qa-demo`), plugin v7.1.0, Chromium (Playwright MCP) / user-reported via Chrome screenshot.

---

## Production history (synced from #122674 on 2026-10-08)

### 2026-10-06 14:05 UTC — Vaishnavi Bhawsar

Fixed. The Defect ID's column now shows just the defect's number (e.g. "#15"), not its full title -- a long title could previously stretch that row to several times the height of its neighbours. Hovering the number still shows the full title as a tooltip, so that information isn't lost, just no longer inline.

Verified on the live grid: a defect that previously showed as "#15 Password reset email is not delivered" now shows simply as "#15". Screenshot attached.

For QA: open a Run's execution grid with at least one linked defect and confirm the Defect ID's column shows only the defect's number, with row heights consistent across rows regardless of the linked defect's title length.

### 2026-10-07 06:59 UTC — Sourabh Singh

Retested on master `4b5a7a7` (commit "Simplify defect display: just the ID in the run grid, no reverse panel on the defect"). Confirmed live across multiple rows in a run's execution grid: the Defect ID's column now renders ID-only (e.g. #92, #105, #106) with no subject text at all, eliminating the unbounded-row-height problem at the source. Closing.
