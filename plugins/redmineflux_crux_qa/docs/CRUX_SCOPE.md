# Test Scope — Redmineflux Crux

## In Scope

- [x] Functional testing
- [x] Permission testing
- [x] Workflow testing
- [x] Negative testing
- [x] UI validation
- [ ] Multi-language testing (not yet planned — revisit once core scope is covered)

Tickets under test: **#116773** (CRX-9/12/35/46 write chain) and **#117162** (full CRUD for 9 bundled agents + Keep/Session Artifacts/Share regression).

## Out of Scope

- Multi-language testing, for now.
- The 17 agents outside #117162's named 9 (Project Manager, Improver, Research, Reviewer, Root Cause, Monitor, Digest, Docs Writer, Alert Triage, Auto-Fixer, Intake Clarifier, Work Package Planner, Project Setup, Run Reporter, Test Author, Crux Guide, Code Reviewer, Helpdesk) — not named in either ticket under test.
- CRX-35 increment 2 (dynamic tool discovery, batched multi-step proposals) — explicitly called out as NOT built in #116773.
- Feedback (thumbs up/down) per Improve suggestion — explicitly called out as NOT built in #116773.

## Redmine Version

7.0.0 (Docker `redmine:7.0.0` image, `crux-redmine` container — a dedicated instance, separate from other redmine-docker-* stacks on this machine).

## Environment

**Local** — full stack at `C:\Crux-Redmine-Docker` (see `docs/CRUX_MEMORY.md` for full component breakdown):
- Redmine: `http://localhost:3014`
- crux-core: `http://localhost:8787`
- MCP (via nginx, required): `http://localhost:8082`
- `CRUX_PROJECT=crux-qa`

**Known env gaps blocking parts of the scope** (see `docs/CRUX_HANDOFF.md` for current status):
- No LLM provider key configured → blocks real Ask Crux chat/write-proposal testing (echo fallback only).
- `CRUX_REQUIRE_USER_KEY=0` (default) and only one (admin/shared) API key exists → blocks CRX-12 per-user enforcement testing until flipped to `1` and a second, restricted-privilege test user is created.

## Test Cycle

Cycle 1 — started 2026-09-10. First suite: `testcases/CRUX_NAVIGATION_AND_PERMISSIONS.md` (execution-ready now, no env gaps). Remaining suites (agent CRUD via chat, Improve wand, CRX-12) to follow once the two env gaps above are resolved and the dev team responds to the outstanding QA note on #116773/#117162.
