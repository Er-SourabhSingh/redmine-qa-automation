# Final Bug Report — Redmineflux Agile Board

> Generated from bugs/open/. PDF only on explicit user request.

## Summary

| Total | Critical | High | Medium | Low |
|-------|----------|------|--------|-----|
| 0     | 0        | 0    | 0      | 0   |

## Open Bugs

None. `bugs/open/` is empty as of 2026-09-21.

## Recently Closed (this cycle)

### BUG-AGB-011 — High — Closed 2026-09-21

**Backlog story-points badge goes wrong (including negative) after dragging a card between sprint/version columns, without a page reload**

- **Production Redmine Issue ID:** #120990 (ztflux, assigned to Prashant Chaurasia) — synced to In QA → Done, 100%.
- **Fix:** commits `32141ba` and `50a8a76` ("Keep the backlog points badge true while cards are dragged" / "Move story points with a dragged card on every board"), released as plugin **7.1.0** on branch `master`.
- **Retest:** dragged a 5-pt card between sprint columns — both badges updated live and correctly, instantly, no reload (`13/18→13/13`, `5/21→5/26`). Extended to version columns — same correct live behavior (`3/8→3/13`, `23/199→23/194`). Then edited the moved card's points inline without reloading (`5/26→5/29`, correct) — a reload matched exactly.
- Production testcase #120941/run #577 (which had been marked Failed against this bug) updated back to Passed.
- Full detail, root-cause trace, reproduction table, evidence, and retest record: `bugs/closed/BUG-AGB-011.md`

### BUG-AGB-010 — Medium — Closed 2026-09-21

**A `query_id` parameter on the Agile Board / Backlog controller crashed with a 500 (FrozenError on a frozen string literal) — not reachable via any current UI link**

- **Production Redmine Issue ID:** #120986 (ztflux, assigned to Prashant Chaurasia) — synced to In QA → Done, 100%.
- **Fix:** commit `f3ba81b` ("Stop a query_id from crashing the board and the backlog"), released as plugin **7.1.0** on branch `master`.
- **Retest:** `?query_id=1` on both `/backlog` and `/agile_board` now returns a clean 404 (`ActiveRecord::RecordNotFound`) instead of the unhandled 500; server log confirms no `FrozenError`.
- Full detail, stack trace, evidence, and retest record: `bugs/closed/BUG-AGB-010.md`

## Environment

- Redmine Version: 7.0.0
- Plugin: Redmineflux Agile Board 7.0.0 → **7.1.0** (branch `master`, merged from `feature/backlog-sprint-points`)
- Environment: Local Docker `redmine-docker-700` (http://localhost:3010)
- Test Date: 2026-09-18 (sanity), 2026-09-21 (regression, BUG-AGB-011 found, both bugs fixed and retested, post-fix regression)

## Outstanding

A full plugin-wide final-cycle regression (`SENIOR_QA_STANDARDS.md` §27, every suite — not just Feature #120436) is still required before `STATUS.md` can move to `Complete`. Only the Feature #120436 suite (`AGILE_BACKLOG_AND_SPRINTS.md`) was regressed this session, by explicit user scope choice.
