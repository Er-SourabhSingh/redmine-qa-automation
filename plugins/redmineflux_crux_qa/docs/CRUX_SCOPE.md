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

## Gap table — Crux platform surface, current coverage status (2026-11-05)

> Every row below was walked live on the current build (crux-core 1.0.0, Redmine 6.0-bookworm, `crux-redmine6`
> stack) on 2026-11-05 to confirm what the page actually contains before writing this table — not copied from
> the old environment's docs. "Historical suite" means a suite exists in `testcases/old_suites/` written against
> the old Redmine 7.0.0 stack and has not been re-verified here; treat its content as a starting reference only,
> not as current fact.

| Section | URL | What's there (confirmed live, 2026-11-05) | Current TC coverage |
|---|---|---|---|
| Crux dashboard | `/crux` | "Needs your attention" (gates + failed runs), Agents widget (online/paused, busiest), Work in progress (Work Package stage bars), Live activity (run feed), Ready for agents (queue count) | Historical suite only (`CRUX_DASHBOARD_GRAPH_PIPELINE.md`) — **not re-verified on current build** |
| Work packages | `/crux/work_packages` | List of in-progress Work Packages; click-through to per-package stage detail | Historical suite only — **not re-verified**; list was empty on this instance as of 2026-11-05 (no active Work Packages) |
| Ready queue | `/crux/queue` | Tickets tagged `readyforagent`, claimed-by status once an agent picks one up | **No TC at all**, historical or current |
| Run ledger | `/crux/runs` | Filterable by Agent / Outcome (Success/Failed/Degraded); empty on this instance as of 2026-11-05 | **No TC at all**, historical or current |
| Agent fleet (admin side) | `/crux/agents` | Cards/Teams/List views, search, **+ New Agent**, **Upload Agent** (custom agent creation — historically broken, BUG-CRX-048, since fixed on the old stack; never re-verified on crux-core 1.0.0) | Historical suite only (`CRUX_AGENT_ROSTER_ADMIN.md`) — **custom-agent-create/upload not re-verified** |
| Pipelines | `/crux/pipelines` | Built-in pipeline templates (e.g. "Software feature": clarify→plan→develop→test→holdout→review→deliver, 3 approval gates) shown as stage+gate chip cards; View/Duplicate for built-ins; **+ New Pipeline**; editable Edit/Delete presumably exist for custom pipelines (not yet confirmed) | Historical suite only (`CRUX_DASHBOARD_GRAPH_PIPELINE.md`'s pipeline-board rows) — **not re-verified**, and the new build's richer pipeline-card UI (gate chips, Duplicate-to-edit) was never covered by the old TCs at all |
| Providers & keys | `/crux/admin/keys` | Provider CRUD (+ Add Provider), Key CRUD (+ Add Key, masked after save, Test connection — spends a fraction of a cent on providers with a models endpoint) | Historical suite only (`CRUX_AGENT_ROSTER_ADMIN.md` TC-CRX-068–080, 084) — **not re-verified** |
| Settings | `/crux/admin/settings` | 5 sections: **Core** (service URL + Test connection), **Chat budget** (org-wide daily $ cap per user), **Navigation** (show/hide Crux & Agents top-menu links, custom caption), **Ask Crux bubble** (position, panel size, icon, accent color, greeting, up to 5 suggested prompts, default agent, launch teaser — with a live preview), **Chat agents** (restrict which agents appear in the chat picker) | Historical suite only, and only partially — old TC-CRX-072 covered just the Core-service-URL field; **the Chat budget, Navigation, Ask Crux bubble, and Chat agents sections have never been tested at all**, historical or current |
| Frozen rules | `/crux/admin/frozen_rules` | Object-level unconditional write blocks ("agents never touch tracker Support") — distinct from gates, which govern workflow not objects; **+ Freeze something**; none configured on this instance as of 2026-11-05 | Historical suite only (`CRUX_WRITE_CONFIRM_GATE.md` TC-CRX-167, `CRUX_NAVIGATION_AND_PERMISSIONS.md` TC-CRX-139) — **not re-verified**, and the actual rule-creation flow (`+ Freeze something`) was never exercised even on the old build per those TCs' own descriptions |
| Activity log | `/crux/admin/logs` | Structured log viewer: filter by Level (DEBUG/INFO/WARN/ERROR), Component (`core.api.server`, `core.askcrux.chat`, `core.askcrux.llm_router`, `core.askcrux.mcp`, `core.askcrux.proposals`), Activity id, free-text Search, row Limit (50/200/500) | Historical suite only (`CRUX_AGENT_ROSTER_ADMIN.md` TC-CRX-071) — **not re-verified** |
| Help & setup guide | `/crux/help` | Not yet opened this session | **No TC at all**, historical or current |
| Ask Crux core chat mechanics | `/crux/ask` | Agent picker (Direct vs. Auto routing), confirm/cancel gate per write, Keep, Share, Session Artifacts, per-chat cost tracking, daily-cap enforcement | Historical suites exist (`CRUX_ASK_CRUX_CHAT_CORE.md`, `CRUX_WRITE_CONFIRM_GATE.md`, `CRUX_CHAT_CAPABILITIES_KEEP_SHARE_ARTIFACTS.md`, `CRUX_PER_USER_KEY_CRX12.md`) — **not re-verified on current build**, though the confirm/cancel gate mechanic itself has been exercised heavily and found working correctly as a side effect of this cycle's agent-bug retesting (2026-11-04/05) |
| Improve wand (issue-page quick action) | issue page, wand icon | Description rewrite, work-breakdown-into-subtasks, both gated | Historical suite only (`CRUX_PROJECT_CREATION_AND_IMPROVE_WAND.md`) — **not re-verified**; note the Improver *chat* agent (a related but distinct surface) has been tested this cycle (BUG-CRX-169, confirmed fixed 2026-11-05) |
| `@`-mention delegation in ticket comments | any ticket comment | `@AgentName` in a native Redmine comment should act on that ticket, reply-only | **No TC at all**, historical or current — the old `CRUX_FEATURES_LIST.md` flagged this as a gap even then |
| Gate approval click | Work Package detail view | `POST /api/gate` human-approval click, always attributable | Historical suite only — **not re-verified**; no active Work Package exists on the current instance to test against as of 2026-11-05 (would need one created first) |

**Auto-mode chat routing** (`/crux/ask`, picker left on Auto) was partially spot-checked 2026-11-05 as a
cross-cutting concern, not a dedicated section: 9 of 12 newer agents (Reviewer, Test Author, Docs Writer,
Monitor, Alert Triage, Auto-Fixer, Design Agent, Research, Improver) routed correctly on a single representative
question each; 3 (Root-Cause Analyst, Crux Guide, Code Reviewer) all misrouted to Project Manager on their first
attempt — not yet retried for consistency or filed as a bug. See `CRUX_HANDOFF.md` for the raw finding.

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
