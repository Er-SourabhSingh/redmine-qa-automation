# Handoff — Redmineflux Mentions Plugin

## Last Session

- Date: 2026-09-29
- Redmine Version: (not recorded — check Administration → Information on next full session)
- Environment: Forge (`flux-fxly6nkbd49.forge.zehntech.com`)

## Completed This Session

- Ad hoc verification (not the authored suite) of a developer-reported performance fix: N+1 `email_addresses`
  query in `app/views/wiki/_form.html.erb`, reported by customer Simon Goličnik. Confirmed functionally correct
  on a fresh Forge instance — see `MENTIONS_MEMORY.md` "Confirmed Working" for full detail. No defect found.

## In Progress

- The authored suite (`testcases/MENTIONS_*.md`, TC-MEN-019 onward) is still fully unexecuted — this session only
  touched the wiki-mention path narrowly, for the specific fix reported.

## Blockers

- None. Execution requires a running instance with the plugin installed and the roles named in the permissions
  suite provisioned.

## Next Session Start Point

- Start with the installation/configuration suite, then the permissions suite (it provisions the roles the other
  suites assume), then the functional suites in file order — the full authored suite is still unexecuted.

## Open Bugs Found

- None yet.

## Run History

> One row per test run / regression pass.

| Date | Redmine Version | Environment | Tested By | Summary |
|------|-----------------|-------------|-----------|---------|
| 2026-09-15 | — | — | Claude | Authoring only — test cases written from the vendor KB, nothing executed. |
| 2026-09-29 | — | Forge (flux-fxly6nkbd49) | Claude | Ad hoc: verified dev-reported wiki mentions N+1 query fix (`_form.html.erb`) functionally — autocomplete, save, and rendering all correct on a 21-user project. Environment too small to confirm the query-count reduction itself. No defect found; authored suite still unexecuted. |
