# Final Bug Report — Redmineflux Gantt Chart

> Generated from bugs/open/ + bugs/closed/. Regenerated 2026-09-24 — all 9 bugs found to date are now fixed and closed.

## Summary

| Total | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|
| 9     | 0        | 0    | 5      | 4   |

## Open Bugs

_None. `bugs/open/` is empty as of 2026-09-24._

## Closed Bugs (all fixed and verified)

| Bug ID | Title | Peak Severity | Final Status |
|--------|-------|----------------|--------------|
| BUG-GNT-001 | "Today" marker label was hardcoded English CSS-generated content, structurally untranslatable | Low | Fixed & Closed |
| BUG-GNT-002 | Timeline week-range header cells and left-panel column headers ("% erledigt"/"Gesch. Stunden") clipped/bled into each other under Lotus theme and at 1280×720 | Low | Fixed & Closed |
| BUG-GNT-003 | "Show Critical Path" checkbox untranslated in Settings panel, unlike its 4 sibling checkboxes | Low | Fixed & Closed |
| BUG-GNT-004 | Narrowing a Version's date range hid already-assigned issues from the Flux Gantt view while core Redmine still counted them correctly | Medium | Fixed & Closed |
| BUG-GNT-005 | Dependency-link-type popup ("Link as:" / "Relates" / "Precedes") was entirely untranslated | Medium | Fixed & Closed |
| BUG-GNT-006 | Settings gear for personal Flux Gantt view options required "Manage versions", contradicting issue #120913's stated permission relaxation | Medium | Fixed & Closed |
| BUG-GNT-007 | "Show Milestone Markers" was stored per-user instead of staying project-wide/shared, contradicting issue #120913's explicit requirement | Medium | Fixed & Closed |
| BUG-GNT-008 | Custom Range date picker's Cancel/Apply buttons rendered below the visible fold at 1280×720, with no auto-scroll or reposition to keep them reachable | Low | Fixed & Closed |
| BUG-GNT-009 | Custom-field column headers hard-truncated mid-word with no ellipsis when many columns were enabled — same defect class as BUG-GNT-002, different elements | Medium | Fixed & Closed |

## Environment

- Redmine Version: local dev build carrying issue #120913 (pre-release) — historical closed bugs 001–005 were found/fixed on 7.0.1.stable (Forge)
- Environment: Local Docker `localhost:3010` (current cycle) — Forge (multiple servers, historical cycle, see `docs/GANTT_HANDOFF.md` Run History)
- Test Date: 2026-09-23–24 (current cycle, issue #120913 batch + 2 user-reported UI bugs, all retested and closed 2026-09-24) — 2026-09-07 through 2026-09-09 (historical German-language cycle)
