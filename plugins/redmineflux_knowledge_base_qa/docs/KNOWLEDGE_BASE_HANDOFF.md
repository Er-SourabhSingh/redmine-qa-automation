# Handoff — Redmineflux Knowledge Base Plugin

## Last Session

- Date: 2026-11-26
- Redmine Version: 6.0-bookworm (local Docker instance, `C:\crux-redmine`, localhost:3015)
- Environment: Local Docker, Postgres

## Completed This Session

- Final retest of production ticket #119878 (KB Editor toolbar Heading/Font Family/Font Size dropdowns):
  pulled `redmineflux_knowledgebase` from master (`65f89f9` → `df12beb`, PR #12 / commit `4caf859`, "rkb-103:
  Sync Font Size between the sticky and floating toolbars"), restarted `redmine`, cleared the browser cache per
  the developer's own retest note.
- Followed the developer's exact retest steps on a fresh KB page: all 7 steps PASS (baseline sync, sticky→24/48
  no-reselect, floating→36 no-reselect, Heading 1→20 both, save+reload+reselect→24 both, legacy `<font
  size="5">` content saved+reloaded+reselected→24 both). AC#6 (toolbar sync) is now genuinely fixed — this
  closes the one remaining gap from the 2026-11-24 retest.
- **All 7 of #119878's acceptance criteria now PASS.** Updated `BUG-RKB-001.md`, moved it from `bugs/open/` to
  `bugs/closed/`, updated `bugs/_index.md`. Posted the final retest result as a production journal comment and
  closed #119878: status In QA → Done, done_ratio → 100 (per explicit user approval).

## In Progress

- Everything else in `testcases/` (the 205 authored TCs from the 2026-09-15 session) remains unexecuted.

## Blockers

- None.

## Next Session Start Point

- `bugs/open/` is now empty for this plugin — BUG-RKB-001 was the only one filed. Continue with the
  installation/configuration suite, then the permissions suite (it provisions the roles the other suites
  assume), then the functional suites in file order — per the original plan.

## Open Bugs Found

- None — BUG-RKB-001 closed this session (production #119878 Done/100%).

## Run History

> One row per test run / regression pass.

| Date | Redmine Version | Environment | Tested By | Summary |
|------|-----------------|-------------|-----------|---------|
| 2026-09-15 | — | — | Claude | Authoring only — test cases written from the vendor KB, nothing executed. |
| 2026-11-24 | 6.0-bookworm | Local Docker, Postgres (localhost:3015) | Claude | Retested production #119878 (toolbar dropdown fixes) — 6/7 AC PASS, AC#6 (toolbar sync) FAIL. Filed BUG-RKB-001, reopened #119878 on production. |
| 2026-11-26 | 6.0-bookworm | Local Docker, Postgres (localhost:3015) | Claude | Final retest of #119878/BUG-RKB-001 after PR #12 (rkb-103) landed — all 7 of the developer's own retest steps PASS. 7/7 acceptance criteria now PASS. Closed BUG-RKB-001, production #119878 marked Done/100%. |
