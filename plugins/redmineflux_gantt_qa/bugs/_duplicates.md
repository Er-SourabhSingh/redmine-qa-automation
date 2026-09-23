# Duplicate Bug Register — Redmineflux Gantt Chart

> Check this before creating any new bug.

| Duplicate Finding | Root Cause | Original Bug ID |
|-------------------|------------|-----------------|
| BUG-GNT-009 considered against closed BUG-GNT-002 | Same failure pattern (`overflow:hidden`/`text-overflow:ellipsis` declared but not rendering, raw mid-word cut instead of "…") — but different elements (custom-field column headers vs. the original "Erledigt %"/"Gesch. Stunden"/timeline week-header cells). Filed as a new bug, not a reopen, per BUG-GNT-002's own precedent of only folding in variants that are the *same* elements. | BUG-GNT-002 (closed) — not a duplicate |
