# Final Bug Report — Redmineflux Agile Board

> Generated from bugs/open/. PDF only on explicit user request.

## Summary

| Total | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|
| 2     | 0        | 1    | 1      | 0   |

## Open Bugs

### BUG-AGB-011 — High

**Backlog story-points badge goes wrong (including negative) after dragging a card between sprint/version columns, without a page reload**

- **Production Redmine Issue ID:** #120990 (ztflux, assigned to Prashant Chaurasia, reported 2026-09-21). Companion action: production #120436 reopened (Done/100% → In QA/90%) pending this fix and retest.
- **Found during:** live-testing after Feature #120436 was marked Done on production 2026-09-21; user reported a screenshot showing a nonsensical `13 / -74 SP` total, then confirmed "after refresh it show correct value"
- **Summary:** Dragging a card between Backlog sprint/version columns updates the card count live but never the story-points badge, which is only rendered at initial page load. A subsequent inline point edit then applies its delta on top of that stale badge value, compounding the error — repeated drags/edits in one session can drive the displayed total arbitrarily wrong, including negative.
- **Root cause:** `backlog.html.erb`'s jQuery UI Sortable `update` handler only calls `updateSingleColumnCount()` (card count only) on drop; `.backlog-column-story-points` is never read or written anywhere in the drag/drop path. `rf_story_points.js`'s `updateBadges()` is correctly wired to the inline-edit save handler but has no knowledge the badge may already be drag-stale.
- **Client-side only:** confirmed no stored `story_points` data is corrupted — a plain page reload always shows the correct total.
- **Relationship to Feature #120436:** squarely within the feature's own delivered code (the `closed/total SP` badge display #120436 introduced) — unlike BUG-AGB-010, which is pre-existing/unrelated infrastructure. This corrects the regression cycle's earlier sign-off, which had reported zero defects in the feature's own code.
- **Not caught during the regression pass** because drag (TC-AGB-545) and inline-edit (TC-AGB-537) TCs were each tested in isolation with a check/reload in between, rather than back-to-back in one page load — the actual real-world sprint-planning workflow.
- Full detail, root-cause trace, reproduction table, and evidence: `bugs/open/BUG-AGB-011.md`

### BUG-AGB-010 — Medium

**A `query_id` parameter on the Agile Board / Backlog controller crashes with a 500 (FrozenError on a frozen string literal) — not reachable via any current UI link**

- **Production Redmine Issue ID:** #120986 (ztflux, assigned to Prashant Chaurasia, reported 2026-09-21)
- **Found during:** regression pass on Feature #120436, as a side-finding while checking TC-AGB-541's premise (that TC is itself N/A — see below)
- **Summary:** Every Agile Board controller action that accepts a `query_id` parameter (project Kanban board, Backlog, and — sharing the same code path — almost certainly the Global board and My Page block) crashes with an unhandled 500 (`FrozenError: can't modify frozen String: "project_id IS NULL"`) the moment `query_id` is present, due to a frozen string literal being mutated in `RfBoardsController#retrieve_rf_agile_query`.
- **Reachability:** checked every view in the plugin — no button or link anywhere generates a `query_id`-carrying URL for the Backlog or Agile Board pages. Reproducing requires manually constructing the URL. Severity was downgraded from an initial High to Medium once this was confirmed. The parameter is still explicitly, intentionally handled elsewhere in the controller, so it is not dead code — just currently code-only.
- **Relationship to Feature #120436:** pre-existing shared plugin infrastructure, not touched by #120436's own changes (the story-point badge and the two new Backlog settings). Does not block any of #120436's four requirements, all of which are independently verified PASS.
- **Fix:** trivial — replace the frozen literal with a mutable string (`String.new(...)`, `.dup`, or build with `+`/array-join instead of `<<`).
- Full detail, stack trace, and evidence: `bugs/open/BUG-AGB-010.md`

## Environment

- Redmine Version: 7.0.0
- Environment: Local Docker `redmine-docker-700` (http://localhost:3010)
- Test Date: 2026-09-18 (sanity), 2026-09-21 (regression + BUG-AGB-011 found)
