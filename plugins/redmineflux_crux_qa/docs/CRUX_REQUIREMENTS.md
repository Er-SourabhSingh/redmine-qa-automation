# Plugin Requirements — Redmineflux Crux

> Drafted 2026-09-10 from source material in the dev-provided QA stack (`C:\Crux-Redmine-Docker`): `redmineflux-crux-core/README.md` + `docs/API.md` + `RELEASE-NOTES.md`, `redmineflux_crux/README.md`, and all 9 bundled `agents/*.md` specs. Not yet reviewed/confirmed by the dev team — update once they respond to the QA note on #116773/#117162.

## Overview

**Crux** is an agentic layer bolted onto Redmineflux/Redmine: a chat assistant ("Ask Crux") backed by a fleet of per-plugin agents that can read live data from every installed Redmineflux plugin and — behind a mandatory human confirm click — propose real writes back to those plugins. It is not a single plugin; it's three coordinating components:

```
redmineflux_crux (Ruby plugin — UI only, deployed as plugins/redmineflux_crux)
       │ REST/SSE
redmineflux-crux-core (Python service — all business logic, Work Packages, gates, chat runtime)
       │ MCP + Redmine REST
redmineflux-mcp → Flux (Redmine, all installed plugins' data)
```

- **redmineflux_crux** (the Redmine plugin under test in this QA folder): renders the Crux dashboard, the Ask Crux chat (bubble + full drawer), the pipeline board, agent roster, provider/key admin, and gate-approval clicks. Contains **zero business logic** — proxies everything to crux-core.
- **redmineflux-crux-core**: the "brain" — Work Packages, pipeline templates, gates + autonomy + budget caps, the agent dispatcher, run ledger, agent registry, and the Ask Crux chat runtime (streaming, model-agnostic: Anthropic/OpenAI/Gemini/echo fallback).
- **redmineflux-mcp**: the MCP tool server both crux-core and (for its own separate QA folder) other plugins' agents call against to reach real Redmine/plugin data.

Current crux-core version at draft time: **0.92.0** (2026-09-10), 860 tests passing.

## Key Features

1. **Ask Crux chat** (`POST /api/chat`, SSE streaming) — a chat panel (bubble + full drawer) in the Redmine UI. Routes a question to the right per-plugin agent or a general Project Manager agent; supports per-user chat sessions, `@`-mention delegation in ticket comments, and agent personas.
2. **Governed write path (CRX-9)** — every Flux write (claim-note, result-note, status-move, and now full per-agent CRUD) is bound to its Work Package's autonomy + gate state before it executes, via a governed MCP client rather than a direct Redmine PUT. A suggest-only Work Package can never write, gate or no gate — a "sacred rule."
3. **Confirm-before-execute gate (CRX-35)** — a model-proposed write is NEVER executed inside the chat loop. It becomes a pending proposal (a confirm card in the UI) that runs exactly once, only after an explicit, attributed human click via `POST /api/chat/confirm`.
4. **Per-user Redmine key passthrough (CRX-12)** — Ask Crux and the Improve wand can run under the asking user's own Redmine API key (forwarded via `X-Redmine-API-Key`) instead of a shared service key, so writes are correctly attributed and permission-scoped to that user. Gated by env var `CRUX_REQUIRE_USER_KEY` (default OFF — fail-open/shared-key unless explicitly turned on per deployment).
5. **9 bundled per-plugin agents**, each with full read + write (create/update/delete, per domain) tool access to its own Redmineflux plugin's MCP tools, all writes routed through the same confirm gate:
   - **Sales Agent** (CRM) — contacts, companies, deals, leads, activities, import/export
   - **Capacity Agent** (Workload) — teams, allocations, leave, holidays, skills
   - **DevOps Agent** — build/deploy status, repos, commits, PRs; single write action: trigger a build
   - **Budget Agent** (Budget/Audit) — spend vs. cap, approved-hours audit; single write action: set a budget cap
   - **Scrum Agent** (Agile) — backlog, boards, sprints, cards, columns
   - **QA Agent** (Test Case Management) — test cases, suites, runs, milestones, defect reports
   - **Time Agent** (Timesheet) — timesheets, approvals, teams, schemas
   - **Invoicing Agent** (Invoice) — customers, invoices, payments, team rates
   - **KB Agent** (Knowledge Base) — spaces, pages/nodes, publish/unpublish, version restore

   (Plus a broader roster of ~26 total agents in `db.seed.production.json`, including a Project Manager agent, Improver, Research, Reviewer, etc. — the 9 above are specifically the ones named in #117162.)
6. **"Improve with Crux" wand (CRX-46)** — an issue-page action that suggests either a work breakdown (subtasks) or an improved description; user picks what to apply, one gated write, before/after preview.
7. **Project creation from chat (CRX-35 increment 1)** — "@crux create a project for X" produces a confirm card and a real project via the same gate.
8. **Keep, Session Artifacts, Share** — three existing chat capabilities: pinning a reply (Keep), saving/attaching agent-produced output to a project/ticket (Session Artifacts), and a read-only teammate watching a live session (Share — must never be able to trigger a write themselves).
9. **Admin surfaces**: agent roster + pause, LLM provider/key CRUD with live credential test, structured log viewer, Crux settings page (core URL, merge-not-replace).
10. **Project work graph** (CRX-24) and dashboard — merged Flux + Crux-store snapshot of issues, agents, runs, dispatch, blockers, outcomes, work packages, scoped by `?project=`.

## Business Workflows

**Ask Crux read/write turn:**
1. User opens the Ask Crux chat bubble/drawer in Redmine and asks a question (plain language, may `@mention` a specific agent).
2. Crux routes to the matching per-plugin agent (or Project Manager for cross-domain/ambiguous asks) and streams a reply, citing real tool-call data.
3. If the ask implies a write (create/update/delete a record, trigger a build, set a budget, create a project, hand off to another agent), the agent produces a **proposal**, not an executed change — rendered as a confirm card.
4. User reviews the card and clicks Confirm (or Cancel). Only on Confirm does `POST /api/chat/confirm` execute the write exactly once, attributed to that user.
5. Result (success or an honest failure/refusal reason) is reported back in the chat.

**Improve with Crux (issue page):**
1. User opens an issue, clicks the wand, picks "Improve the description" or the breakdown/checklist action.
2. Crux suggests content (free, no write yet) with a before/after preview.
3. User applies or cancels; Apply triggers exactly one gated write through the same confirm mechanism.

**Per-user key enforcement (CRX-12, when `CRUX_REQUIRE_USER_KEY=1`):**
1. Every `/api/chat`, `/api/chat/confirm`, `/api/improve`, `/api/improve/confirm` request must carry the asking user's own Redmine API key (via the plugin's `X-Redmine-API-Key` header, injected server-side from `User.current.api_key`, never from the browser).
2. Missing key → refused with 401 at the HTTP gate.
3. A restricted user's own key is refused by Redmine itself for actions beyond their real permissions — Crux does not grant privilege beyond what the user's own Redmine account already has.

## Permissions Matrix

Redmine role-based permissions defined by `redmineflux_crux/init.rb` (Administration → Roles). Read directly from source, not yet exercised live:

| Permission | Controllers/actions gated | Scope | Redmine requirement |
|---|---|---|---|
| `view_crux` | `crux_dashboard` (index/data/runs/runs_data), `crux_project` (index/graph/graph_data/runs/runs_data), `crux_pipelines` (index/list) | Read-only (`read: true`) | Assignable per project role |
| `approve_crux_gates` | `crux_dashboard#approve_gate` — the accountable human confirm click | Per-project | `require: :member` — must be a **project member**, not just logged in |
| `use_ask_crux` | `crux_ask` (index/message/sessions/session_create/session_show), `crux_ask_stream#message` | Per-project | `require: :loggedin` — **membership NOT required**, any logged-in user with the permission on their role |
| `manage_crux_agents` | `crux_agents` (create/pause/provision) | **Global** (org-wide fleet, not per-project) | `require: :loggedin, global: true` — a global permission, not project-scoped |
| `manage_crux_pipelines` | `crux_pipelines` (save/destroy) | **Global** (org-wide templates, not per-project) | `require: :loggedin, global: true` — a global permission, not project-scoped |

Admin-only pages (gated by `require_admin` in the controller, not a role permission — always Administrator-only regardless of role checkboxes):
- Administration → Crux — providers & keys (`crux_admin_keys`, CRX-29/49)
- Administration → Crux — logs (`crux_admin_logs`, CRX-45)
- Administration → Crux — frozen rules (`crux_frozen_rules`, CRX-39 — object-level agent-write blocks)

**Notable QA angle:** `use_ask_crux` deliberately does not require project membership — a logged-in user could potentially chat about a project they aren't a member of if their role has the permission and `view_crux`/data-scoping doesn't independently block it. Worth a specific negative test: a logged-in, non-member user asking Ask Crux about a project they don't belong to — confirm whether the agent's actual data access is still correctly scoped by the user's own Redmine permissions (per CRX-12's "never more than the user's own Redmine permissions" invariant) even though the *chat UI* itself doesn't require membership.

Actual admin/manager/developer/QA/client/non-member role-checkbox defaults on the target Redmine instance are not yet confirmed — fill in during permission test case execution rather than assuming a default.

**UPDATE 2026-09-11:** per dev reply (`docs/CRUX_DEV_REQUEST.md` Q4, answered in `REPLY-TO-QA-2026-09-11.md` in the local QA stack folder), this is confirmed to be a real product decision requiring direct dev input, not inferable from code — dev will send the actual intended default matrix separately. **Do not treat this matrix as confirmed until that follow-up arrives.**

## Known Constraints

- **`view_crux` only actually restricts access at the PROJECT scope, not globally.** Confirmed 2026-09-11 by reading `CruxDashboardController`, `CruxPipelinesController`, `CruxAgentsController` (all only `before_action :require_login` for their read/index actions, each with an explicit code comment stating "any logged-in user can look") versus `CruxProjectController` (uses Redmine's standard `before_action :authorize`, genuinely membership + `view_crux` scoped). In other words: the global dashboard, pipeline board, and agent roster are viewable by ANY logged-in Redmine user regardless of role — `view_crux` only matters for the per-project "Crux" tab, project graph, and project-scoped run ledger. This is stated as deliberate in the source comments, not flagged as a gap by the dev team — but worth an explicit confirmation from dev before treating it as permanently correct, since it means `view_crux` as a role checkbox does almost nothing in practice today.
- **Several write actions are enforced via custom controller methods, not Redmine's declarative `permission` block in `init.rb`** — meaning they don't appear in the Administration → Roles checkbox list at all, even though they require a real permission: `crux_ask#confirm`/`session_share`/`session_unshare`/`artifact_create`/`artifacts_list`/`artifact_show`, `crux_improve#suggest`/`confirm`/`feedback`, `crux_mentions#poll`, `crux_issue#work_package` (all check `use_ask_crux` via a duplicated `authorize_ask_crux` method present in 4 separate controllers), and `crux_agents#retire`/`upload` (check `manage_crux_agents` via `require_manage_agents`, alongside `create`/`pause`/`provision` which ARE declared). Functionally consistent as of this read, but worth periodic re-verification since 4 independent copies of the same check is a real risk of future drift.

- **LLM provider key required for real testing.** `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GEMINI_API_KEY` are all unset in the current QA `.env` — without one, chat only returns a canned "echo" fallback reply, not real agent reasoning/tool calls. See [CRUX_MEMORY.md](CRUX_MEMORY.md).
- **`CRUX_REQUIRE_USER_KEY` defaults to OFF** (shared service key) in this deployment — must be explicitly set to `1` and the stack restarted to test CRX-12's fail-closed per-user behavior.
- **crux-core / mcp reconnect gotcha**: if the `mcp` container is rebuilt/restarted after `crux-core` already connected once, `crux-core` must also be restarted or every tool call 404s (stale MCP client session).
- **`CRUX_COMPONENT_CF` / `CRUX_COMPONENT_CF_IDS`** must match the real "Crux Capability" custom field ID in the target Redmine (verified = `1` on the current QA stack) — a mismatch silently empties every ticket's capability list and breaks agent work-pickup.
- **A write never happens on the model's word alone** — this is stated as an architectural invariant in both the plugin and core READMEs, not just a feature; worth specifically trying to break as a security/correctness test (e.g. can a proposal ever auto-execute without a fresh confirm click?).
- **DevOps and Budget/Audit agents intentionally have a narrower write surface** than the other 7 (DevOps: only `trigger_build`; Budget: only `set_budget`) — this is a real domain constraint (you don't "create" a build or "delete" an audit record), not a gap to file as a bug.
- Redmine version / target environment for production Redmineflux (flux.zehntech.com) may differ from this local QA stack (Redmine 7.0.0 via Docker) — confirm which environment #116773/#117162 are actually meant to be verified against before final sign-off.
