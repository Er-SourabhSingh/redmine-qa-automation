# Handoff — Redmineflux Knowledge Base Plugin

## Last Session

- Date: 2026-11-24
- Redmine Version: 6.0-bookworm (local Docker instance, `C:\crux-redmine`, localhost:3015)
- Environment: Local Docker, Postgres

## Completed This Session

- First real execution session for this plugin: retested production ticket #119878 (KB Editor toolbar
  Heading/Font Family/Font Size dropdown fixes) against the current master build.
- 6 of 7 acceptance criteria confirmed PASS (placeholder removal on all 3 dropdowns, numeric point-size Font Size
  control, CSS-based font-size with legacy `<font>` backward compatibility, reload persistence).
- 1 acceptance criterion (AC#6 — sticky/floating toolbar Font Size sync without reselecting) reproduced as still
  FAILING. Filed `BUG-RKB-001.md` — first local bug file for this plugin.
- Posted the full retest summary as a production journal comment (#639541) and reopened #119878 (In QA -> Reopen)
  per explicit user instruction, since the ticket isn't fully resolved.

## In Progress

- Everything else in `testcases/` (the 205 authored TCs from the 2026-09-15 session) remains unexecuted.

## Blockers

- None currently open for this bug. AC#6 needs a dev fix before it can be retested again.

## Next Session Start Point

- Once #119878/BUG-RKB-001's AC#6 fix lands, retest the toolbar-sync behavior specifically.
- Otherwise continue with the installation/configuration suite, then the permissions suite (it provisions the
  roles the other suites assume), then the functional suites in file order — per the original plan.

## Open Bugs Found

- BUG-RKB-001 (Open) — production #119878 reopened, AC#6 toolbar sync still failing.

## Run History

> One row per test run / regression pass.

| Date | Redmine Version | Environment | Tested By | Summary |
|------|-----------------|-------------|-----------|---------|
| 2026-09-15 | — | — | Claude | Authoring only — test cases written from the vendor KB, nothing executed. |
| 2026-11-24 | 6.0-bookworm | Local Docker, Postgres (localhost:3015) | Claude | Retested production #119878 (toolbar dropdown fixes) — 6/7 AC PASS, AC#6 (toolbar sync) FAIL. Filed BUG-RKB-001, reopened #119878 on production. |
