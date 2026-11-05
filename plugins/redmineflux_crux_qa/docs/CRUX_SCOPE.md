# Test Scope — Redmineflux Crux

> **Rewritten 2026-11-05** to reflect the current build. The previous version of this file (Redmine 7.0.0,
> `C:\Crux-Redmine-Docker`, crux-core 0.92.0, tickets #116773/#117162) described an environment this repo stopped
> using on 2026-10-09 when a dedicated Redmine 6 stack was stood up. That old content is preserved in git history;
> nothing here carries it forward verbatim without re-checking it against the current build first.

## In Scope

- [x] Functional testing
- [x] Permission testing
- [x] Workflow testing
- [x] Negative testing
- [x] UI validation
- [ ] Multi-language testing (not yet planned — revisit once core scope is covered)
- [x] Security testing (mandatory — `SENIOR_QA_STANDARDS.md` §28)
- [ ] Performance testing (mandatory — not yet started for this plugin)
- [ ] Code quality review (mandatory — not yet started for this plugin)

**Two distinct halves of this scope, tracked separately:**

1. **The 24 bundled chat agents** (Ask Crux's per-domain specialists) — this half has real, substantial
   coverage: `CRUX_AGENT_*.md` suite files, 23 production testcases in suite #435 "crux-agents", and an active
   bug-retest cycle (see `CRUX_HANDOFF.md`/`bugs/_index.md` for current status). This is the work this repo has
   actually been doing most recently.
2. **Crux's own platform surface — everything that isn't "chat with an agent"** — this half has **drastically
   less current coverage** than the agent half. See the gap table below.

## Out of Scope

- Multi-language testing, for now.
- **The domain plugins' own native configuration surfaces** (Timesheet's approval-schema builder, Workload's
  holiday-scheme editor, Invoice's PDF/email template editor, Knowledge Base's space/permission setup, Testcase
  Management's tracker/custom-status configuration, Agile Board's column/workflow setup, CRM's deal-stage/
  territory/lead-status list editor, Helpdesk's SLA/support-level/package setup, DevOps's repo connection setup,
  Budget's threshold setup, etc.) — **standing scope decision, originally made 2026-09-16, reaffirmed
  2026-11-05.** This folder's scope is how well Crux's AI-agent layer reads/writes against an already-configured
  plugin — never whether the plugin's own native configuration UI itself works correctly. Testing that would
  need separate QA folders per plugin (several already exist: `redmineflux_helpdesk_qa`, `redmineflux_crm_qa`,
  `redmineflux_invoice_qa`, etc. — check `plugins/` before assuming one doesn't exist for a given domain).
- The 3 non-chat prototype agent files (`intake-clarifier.md`, `run-reporter.md`, `work-package-planner.md`) —
  a separate, frozen `redmineflux-agent-ops` prototype, not reachable from the Ask Crux chat picker at all.
- DevOps Agent — out of scope per the developer's explicit 2026-11-04/05 instruction ("not yet properly
  developed"); don't test it, don't file bugs for it.

## Gap table — Crux platform surface, current coverage status

> **Moved 2026-11-05 (later same day)** to `CRUX_FEATURES_LIST.md` Part B — that file is now the single
> authoritative copy (37 rows as of the developer-reference correction pass), kept alongside
> `CRUX_DEV_FEATURE_REFERENCE_20261105.md` (the developer's own complete, source-derived feature list). Keeping
> two copies of this table in two files drifted out of sync within the same day it was written, so this file no
> longer duplicates it — read `CRUX_FEATURES_LIST.md` Part B for the current gap list.
>
> Auto-mode routing's 3 misroutes (Root-Cause Analyst, Crux Guide, Code Reviewer → Project Manager) were
> confirmed deterministic (2/2 each) and filed as BUG-CRX-171/172/173 per the developer's explicit instruction.

## Redmine Version

6.0-bookworm (Docker `redmine:6.0-bookworm` image, `crux-redmine6` container stack).

## Environment

**Local** — `C:\crux-redmine` (see `docs/CRUX_MEMORY.md` for full component breakdown):
- Redmine: `http://localhost:3015`
- crux-core: `http://crux-core:8787` (internal Docker network) / `http://localhost:8787` (host)
- MCP: `http://localhost:8082`
- Admin login: `admin` / `12345678` (standing convention for this stack)
- crux-core version as of 2026-11-05: **1.0.0**

## Test Cycle

**Current cycle** (started 2026-10-09 on this Redmine 6 stack, ongoing): agent-by-agent CRUD + bug-retest work,
most recently a full rebuild to crux-core 1.0.0 and a retest sweep of every open bug (2026-11-04/05). See
`CRUX_HANDOFF.md`'s Run History for the detailed session-by-session log.

**Next planned phase** (per explicit user decision, 2026-11-05): close the platform-surface gap identified in
the table above — starting with `CRUX_FEATURES_LIST.md`'s rewrite (done alongside this file), then fresh TCs for
each "not re-verified" / "no TC at all" row, prioritized by the user once the gap list is in front of them.

**Historical cycle** (2026-09-10 to 2026-10-09, old Redmine 7.0.0 stack `C:\Crux-Redmine-Docker`, crux-core
0.92.0–~0.95.0): produced the 14 suites now living in `testcases/old_suites/`, plus this plugin's original
`CRUX_REQUIREMENTS.md`/`CRUX_FEATURES_LIST.md`/`CRUX_USER_GUIDE.md` drafts (all now stale — `REQUIREMENTS.md`
and `USER_GUIDE.md` still describe the 0.92.0-era 9-agent roster and have not yet been refreshed; refresh them
before relying on either for anything beyond rough orientation).
