# Features List — Redmineflux Crux

> This file must be read before writing any test case. It defines the full feature scope for test coverage.
> **Rewritten 2026-11-05** against the current build (crux-core 1.0.0, Redmine 6.0-bookworm, `crux-redmine6`
> stack) — the previous version (drafted 2026-09-10, crux-core 0.92.0, old Redmine 7.0.0 stack) is preserved in
> git history. Every row below was either confirmed live on the current build on 2026-11-05, or is explicitly
> marked as carried over from the old environment and not yet re-verified — never read a row's description as
> current fact without checking that marker first.

## Part A — The 24 bundled chat agents

This half has real, current coverage. Full detail lives in `CRUX_AGENT_CAPABILITIES_REFERENCE.md` (per-agent
tool catalog) and `CRUX_TRACEABILITY_MATRIX.md` (per-TC coverage) — this section is a pointer, not a duplicate.

**New agent names (2026-11-04/05 AGENT-TEST-GUIDE.md), superseding old names used in earlier suite files:**

| Current name | Old name | Plugin domain |
|---|---|---|
| Timesheet Agent | Time Agent | Timesheet |
| CRM Agent | Sales Agent | CRM |
| Helpdesk Agent | Support Agent | Helpdesk |
| Testcase Agent | QA Agent | Test Case Management |
| Agile Board Agent | Scrum Agent | Agile Board |
| Workload Agent | Capacity Agent | Workload |
| Budget Agent | Budget and Audit Agent | Budget and Audit |
| Invoice Agent | Invoicing Agent | Invoice |
| Knowledgebase Agent | KB Agent | Knowledgebase |

**Core agents (no extra plugin needed):** Project Manager, Project Setup Agent, Crux Guide, Reviewer, Test
Author, Docs Writer, Monitor, Alert Triage, Root-Cause Analyst, Auto-Fixer, Design Agent, Research, Improver,
Code Reviewer (needs DevOps plugin installed to have any tools, but the agent itself is core).

**Plugin agents:** Timesheet Agent, CRM Agent, Helpdesk Agent, Testcase Agent, Agile Board Agent, Workload
Agent, Budget Agent, Invoice Agent, Knowledgebase Agent.

**Out of scope:** DevOps Agent (developer's explicit instruction, not yet properly developed). 3 non-chat
prototype files (`intake-clarifier.md`, `run-reporter.md`, `work-package-planner.md`) are not real Ask-Crux
agents at all — don't write TCs for them.

**Current state (2026-11-05):** All 24 in-scope agents have at least one production testcase (suite #435
"crux-agents", 23 testcases — Project Manager/CRM/Scrum/Budget/Timesheet/Invoice/Project-Setup/Knowledgebase/
Workload/Helpdesk/QA from earlier cycles, plus 12 new ones added 2026-11-04 for Reviewer/Test
Author/Docs-Writer/Monitor/Alert-Triage/Root-Cause/Auto-Fixer/Research/Improver/Crux-Guide/Design/Code-Reviewer).
Several of the 12 newer suites have only partial TC execution (many drafted TCs skipped per explicit user
instruction to prioritize breadth over depth this round) — see each suite file's own "Suite status" line and
`CRUX_HANDOFF.md`'s Next Session Start Point for exactly which TCs remain unexecuted.

**Auto-mode routing** — a cross-cutting mechanic, not one agent's feature. Spot-checked 2026-11-05: 9/12 of the
newer agents route correctly from a natural, un-prefixed question; Root-Cause Analyst, Crux Guide, and Code
Reviewer all misrouted to Project Manager on their first attempt. Not yet retried for consistency (intermittent
vs. deterministic unknown) or filed as a bug — flagged in `CRUX_HANDOFF.md`, pending user decision.

## Part B — Crux's own platform surface (not "chat with an agent")

This half has drastically less current coverage than Part A. The table below is the authoritative gap list —
`CRUX_SCOPE.md`'s own copy of this table is kept in sync; update both together.

| # | Feature | What's there (confirmed live, 2026-11-05) | Covered by TC |
|---|---------|--------------------------------------------|----------------|
| 1 | Crux dashboard | `/crux` — 5 widgets: Needs your attention (gates + failed runs), Agents (online/paused/busiest), Work in progress (Work Package stage bars), Live activity (run feed), Ready for agents (queue count) | Historical only (`testcases/old_suites/CRUX_DASHBOARD_GRAPH_PIPELINE.md`) — **not re-verified on current build** |
| 2 | Work packages list + detail | `/crux/work_packages` — list view; per-package click-through to stage detail | Historical only — **not re-verified**; 0 active Work Packages on this instance as of 2026-11-05, so even a fresh look needs a WP created first |
| 3 | Ready queue | `/crux/queue` — `readyforagent`-tagged tickets, claimed-by status | **No TC at all** |
| 4 | Run ledger | `/crux/runs` — filter by Agent / Outcome (Success/Failed/Degraded) | **No TC at all**; 0 runs recorded on this instance as of 2026-11-05 |
| 5 | Agent fleet admin — views | `/crux/agents` — Cards/Teams/List toggle, search | Historical only (`CRUX_AGENT_ROSTER_ADMIN.md`) — **not re-verified**; the Teams grouping view is new since the old suite was written and has never been tested at all |
| 6 | Agent fleet admin — create/upload | `/crux/agents` — **+ New Agent**, **Upload Agent** | Historical only — BUG-CRX-048 (agent create 100% broken) was found+fixed on the *old* stack; **never re-verified on crux-core 1.0.0** |
| 7 | Agent fleet admin — pause/resume/retire | `/crux/agents` list/card actions | Historical only (`CRUX_AGENT_ROSTER_ADMIN.md` TC-CRX-064–076) — **not re-verified** |
| 8 | Pipelines — browse | `/crux/pipelines` — built-in templates as stage+gate chip cards (e.g. "Software feature": clarify→plan→develop→test→holdout→review→deliver, 3 gates), View for built-ins | Historical only, and only the old board-list shape — **the current card-based UI with gate-chip display was never covered at all** |
| 9 | Pipelines — create/edit | `/crux/pipelines` — **+ New Pipeline**, Duplicate-to-edit for built-ins, presumed Edit/Delete for custom ones (not yet confirmed which actions a custom pipeline actually offers) | **No TC at all** |
| 10 | Providers & keys | `/crux/admin/keys` — provider CRUD, key CRUD (masked after save), Test connection | Historical only (`CRUX_AGENT_ROSTER_ADMIN.md` TC-CRX-068–080, 084) — **not re-verified** |
| 11 | Settings — Core | `/crux/admin/settings#crux-set-core` — service URL field + Test connection | Historical only (TC-CRX-072) — **not re-verified** |
| 12 | Settings — Chat budget | `/crux/admin/settings#crux-set-budget` — org-wide daily $ cap per user, immediate effect, separate from a user's own personal (warn-only) limit | **No TC at all**, historical or current |
| 13 | Settings — Navigation | `/crux/admin/settings#crux-set-nav` — show/hide Crux & Agents top-menu links (cosmetic only, not access control — confirmed by the page's own copy), custom top-menu caption | **No TC at all**, historical or current (the *access-control* angle on this was tested as BUG-CRX-047, since fixed — but the settings-page toggle itself, as a UI feature, was not) |
| 14 | Settings — Ask Crux bubble | `/crux/admin/settings#crux-set-bubble` — position (bottom-left/right), panel size (comfortable/compact), icon (chat/wand/spark), accent color, greeting text, up to 5 comma-separated suggested prompts, default agent, launch teaser, live preview | **No TC at all**, historical or current |
| 15 | Settings — Chat agents | `/crux/admin/settings#crux-set-agents` — restrict which agents appear in the Ask Crux picker (keeps ops agents like Monitor/Auto-Fixer out by default) | **No TC at all**, historical or current — worth checking against the "ops agents kept out of picker" claim specifically, since Monitor and Auto-Fixer were both directly reachable via the picker during this cycle's own agent testing |
| 16 | Frozen rules — browse | `/crux/admin/frozen_rules` — object-level unconditional write blocks, distinct from gates (govern objects, not workflow); none configured on this instance | Historical only (`CRUX_WRITE_CONFIRM_GATE.md` TC-CRX-167, `CRUX_NAVIGATION_AND_PERMISSIONS.md` TC-CRX-139) — **not re-verified** |
| 17 | Frozen rules — create ("+ Freeze something") | `/crux/admin/frozen_rules` | **No TC at all**, historical or current — even the old suite's TCs describe checking the admin page, not exercising the actual freeze-creation flow |
| 18 | Activity log | `/crux/admin/logs` — filter by Level (DEBUG/INFO/WARN/ERROR), Component (5 options incl. `core.askcrux.chat`/`llm_router`/`mcp`/`proposals`), Activity id, free-text Search, row Limit (50/200/500) | Historical only (TC-CRX-071) — **not re-verified**, and the Component filter's 5 options were never enumerated/tested individually even on the old build |
| 19 | Help & setup guide | `/crux/help` | **No TC at all**, historical or current — page content not yet reviewed this cycle |
| 20 | Ask Crux chat — agent picker (Direct) | `/crux/ask` — pick an agent by name, or type `@AgentName` | Covered extensively as a side effect of Part A's agent-by-agent testing — not a standalone gap |
| 21 | Ask Crux chat — Auto routing | `/crux/ask`, picker on Auto | Partially spot-checked 2026-11-05 (see Part A) — 3/12 misroutes found, not yet resolved |
| 22 | Ask Crux chat — confirm/cancel gate | Inline Confirm/Cancel buttons per proposed write | Exercised heavily this cycle via agent bug-retesting (hundreds of confirm/cancel clicks) — functionally well-covered as a side effect, though never as its own dedicated TC suite on the current build |
| 23 | Ask Crux chat — Keep | Pin a reply to the chat | Historical only (`CRUX_CHAT_CAPABILITIES_KEEP_SHARE_ARTIFACTS.md` TC-CRX-113–054) — **not re-verified**; the "Keep" button has been visible throughout this cycle's testing but never clicked/verified |
| 24 | Ask Crux chat — Share | Read-only live-session viewing for a teammate | Historical only (TC-CRX-118–060) — **not re-verified** |
| 25 | Ask Crux chat — Session Artifacts | Agent output saved, attachable to a project/ticket | Historical only (TC-CRX-115–057 — implementation status itself was unconfirmed even on the old build) — **not re-verified** |
| 26 | Ask Crux chat — per-chat cost tracking | "$X this chat" shown on every response, and in each `Confirm` card | Observed throughout this cycle's testing as accurate-looking, never independently verified against actual token counts |
| 27 | Per-user Redmine key passthrough (`CRUX_REQUIRE_USER_KEY`) | Chat runs under the asking user's own API key instead of a shared one, when enabled | Historical only (`CRUX_PER_USER_KEY_CRX12.md`) — **not re-verified**; current instance has `CRUX_REQUIRE_USER_KEY=0` (shared-key mode, confirmed via `.env` read earlier this cycle) |
| 28 | Improve wand (issue-page quick action) | Description rewrite + work-breakdown-into-subtasks, both gated, from an issue page's own wand icon | Historical only (`CRUX_PROJECT_CREATION_AND_IMPROVE_WAND.md`) — **not re-verified**; distinct from the Improver *chat agent*, which has been tested this cycle |
| 29 | `@`-mention delegation in ticket comments | `@AgentName` inside a native Redmine ticket comment should act on that ticket | **No TC at all**, historical or current |
| 30 | Gate approval click | A Work Package's gate, approved via a dashboard click, always attributable to the real approving user | Historical only — **not re-verified**; needs an active Work Package fixture first (none exist currently) |
| 31 | Project creation from chat | "create a project for X" → confirm card → real project | Covered as part of Project Manager / Project Setup Agent's own agent-suite testing (Part A) — not a standalone platform gap |

## Notes

- Full per-agent tool catalog: `CRUX_AGENT_CAPABILITIES_REFERENCE.md` (last confirmed current as of the
  0.92.0-era draft — spot-check against a live agent's profile page before trusting a specific tool count or
  name, since several agents' tool catalogs have changed materially since then, e.g. BUG-CRX-164's
  tool-registration-gap finding and fix).
- `CRUX_REQUIREMENTS.md` and `CRUX_USER_GUIDE.md` are **not yet rewritten** for the current build — both still
  describe the 0.92.0-era 9-agent roster. Refresh them before relying on either for anything beyond rough
  orientation. Not done as part of this 2026-11-05 pass; flagged for a future session.
- `CRUX_TRACEABILITY_MATRIX.md` needs a corresponding update once Part B gets its first real TCs — right now it
  only tracks Part A (the agent suites).
- Historical 14-suite index (old Redmine 7.0.0 stack, `testcases/old_suites/`) for reference when writing a
  fresh TC against a Part B row: `CRUX_NAVIGATION_AND_PERMISSIONS.md`, `CRUX_ASK_CRUX_CHAT_CORE.md`,
  `CRUX_WRITE_CONFIRM_GATE.md`, `CRUX_PER_USER_KEY_CRX12.md`, `CRUX_PROJECT_CREATION_AND_IMPROVE_WAND.md`,
  `CRUX_CHAT_CAPABILITIES_KEEP_SHARE_ARTIFACTS.md`, `CRUX_DASHBOARD_GRAPH_PIPELINE.md`,
  `CRUX_AGENT_ROSTER_ADMIN.md`, plus 6 old per-agent suites superseded by Part A's current ones. Treat every
  number/detail in them as a starting hypothesis to re-verify, never as current fact — the build has changed
  materially (crux-core 0.92.0 → 1.0.0, Redmine 7.0.0 → 6.0-bookworm, a different Docker stack entirely).
