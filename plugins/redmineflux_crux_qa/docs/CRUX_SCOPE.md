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
- **The 9 underlying domain plugins' own native configuration surfaces** (Timesheet's approval-schema builder, Workload's holiday-scheme editor, Invoice's PDF/email template editor, Knowledge Base's space/permission setup, Testcase Management's tracker/custom-status configuration, Agile Board's column/workflow setup, CRM's deal-stage/territory/lead-status list editor, DevOps's repo connection setup, Budget's threshold setup, etc.) — **explicit scope decision, 2026-09-16**, made after the user directly questioned whether the existing suites covered "all functionality" and configuration specifically. Confirmed at that point: no standalone QA folder exists anywhere in this repo for any of these 9 plugins (`plugins/redmineflux_*_qa` glob returns nothing for them), and only 4 of the 9 domain agents (Workload, Timesheet, CRM, and Testcase Management's `set_tracker` only) even have a settings/config tool in `allowed_tools` — the other 5 (Invoice, Knowledge Base, Agile Board, DevOps, Budget/Audit) structurally cannot configure their plugin via chat at all. This folder's scope stays **how well Crux's AI-agent layer reads/writes against an already-configured plugin** — never whether the plugin's own native configuration UI itself works correctly. Testing that would require new, separate QA folders per plugin (`redmineflux_workload_qa`, `redmineflux_timesheet_qa`, etc.), built the same way this one was — a distinct, larger undertaking the user explicitly deferred rather than folding into this engagement.

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
