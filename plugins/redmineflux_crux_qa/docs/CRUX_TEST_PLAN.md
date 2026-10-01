# Test Plan — Redmineflux Crux

| | |
|---|---|
| **Plugin** | redmineflux_crux (+ redmineflux-crux-core, redmineflux-mcp) |
| **Doc prefix** | CRUX |
| **Tickets under test** | #116773 (CRX-9/12/35/46 write chain), #117162 (full CRUD for 9 bundled agents + Keep/Session Artifacts/Share) |
| **Version drafted against** | crux-core 0.92.0 |
| **Status** | Living document — updated as the cycle progresses |
| **Last updated** | 2026-10-01 |
| **Author** | QA (Claude + Playwright MCP), reviewed by Sourabh Singh |

---

## 1. Introduction

**Crux** is an agentic layer bolted onto Redmineflux/Redmine: a chat assistant ("Ask Crux") backed by a fleet of per-plugin AI agents that read live data from every installed Redmineflux plugin and — behind a mandatory human confirm click — propose real writes back to those plugins. It spans three coordinating components:

```
redmineflux_crux (Ruby plugin — UI only)
       │ REST/SSE
redmineflux-crux-core (Python service — business logic, Work Packages, gates, chat runtime)
       │ MCP + Redmine REST
redmineflux-mcp → Flux (Redmine, all installed plugins' data)
```

This test plan covers the `redmineflux_crux` QA folder's full scope: the plugin's own UI (dashboard, chat, pipeline board, agent roster, admin surfaces) and the behavior of its 9 bundled per-plugin AI agents operating against 9 separate Redmineflux domain plugins (CRM, Workload, DevOps, Budget/Audit, Agile, Testcase Management, Timesheet, Invoice, Knowledge Base).

Full feature inventory: [`CRUX_FEATURES_LIST.md`](CRUX_FEATURES_LIST.md). Full requirements detail: [`CRUX_REQUIREMENTS.md`](CRUX_REQUIREMENTS.md).

## 2. Objectives

- Verify the governed write path (CRX-9) and confirm-before-execute gate (CRX-35) hold under every write path across all 9 bundled agents — a write must never execute without an explicit, attributed human Confirm click.
- Verify each of the 9 bundled agents' read and write (full CRUD, where domain-applicable) tool coverage against its real underlying Redmineflux plugin.
- Verify the permission model (`view_crux`, `approve_crux_gates`, `use_ask_crux`, `manage_crux_agents`, `manage_crux_pipelines`, and per-domain plugin permissions) is enforced consistently at every layer — UI visibility, direct URL access, and chat-tool-call level.
- Verify the agent layer is honest: it must never fabricate success, invent figures, claim a write succeeded when it didn't, or claim data doesn't exist when it's merely out of the caller's permission scope.
- Verify Keep, Session Artifacts, and Share behave per their documented contract — Share in particular must never let a read-only viewer trigger a write.
- Drive every confirmed defect through to a verified fix via the project's standard retest/regression discipline (`SENIOR_QA_STANDARDS.md` §26–27).

## 3. Scope

### 3.1 In Scope

- Functional testing
- Permission testing
- Workflow testing
- Negative testing
- UI validation
- Security testing (`SENIOR_QA_STANDARDS.md` §28)
- Performance testing (`SENIOR_QA_STANDARDS.md` §29)
- Code quality review (`SENIOR_QA_STANDARDS.md` §30)

### 3.2 Out of Scope

- Multi-language testing (deferred — not yet planned).
- The 17 agents outside #117162's named 9 (Project Manager, Improver, Research, Reviewer, Root Cause, Monitor, Digest, Docs Writer, Alert Triage, Auto-Fixer, Intake Clarifier, Work Package Planner, Project Setup, Run Reporter, Test Author, Crux Guide, Code Reviewer, Helpdesk).
- CRX-35 increment 2 (dynamic tool discovery, batched multi-step proposals) — explicitly not built in #116773.
- Feedback (thumbs up/down) per Improve suggestion — explicitly not built in #116773.
- The 9 underlying domain plugins' own native configuration surfaces (approval-schema builder, holiday-scheme editor, PDF/email template editor, etc.) — this folder's scope is *how well Crux's AI-agent layer reads/writes against an already-configured plugin*, never the plugin's own native config UI. Testing that would require separate, dedicated QA folders per plugin.

Full detail: [`CRUX_SCOPE.md`](CRUX_SCOPE.md).

## 4. Test Approach

### 4.1 Methodology

- **Manual/exploratory testing**: Claude driving a real Chromium browser via Playwright MCP against the live local stack, session by session. This is the primary method for this engagement — discovering bugs, verifying agent honesty, and exercising the chat-driven write-confirm flow exactly as a real user would (natural phrasing, no pre-supplied internal IDs).
- **Automated regression** (where TCs have a confirmed manual PASS): a self-contained Playwright + TypeScript suite under `automation/`, following `testcases/*.md` as its source of truth. Not yet built out for this plugin as of this document's last update — see `automation/` folder status.
- Both methods follow the plugin's own doc prefix and TC-ID conventions defined in the repo root `CLAUDE.md`.

### 4.2 Test Levels

| Level | Approach |
|---|---|
| Functional | Full CRUD per bundled agent, against real backend state — never trust the chat's own success claim without independent verification (native UI, DB query, or a second read call). |
| Permission | Three-leg check per permission boundary: positive UI access, negative UI-absence, negative direct-URL/endpoint access — per `feedback_permission_tc_needs_ui_and_url_both_sides` standing rule. |
| Workflow | End-to-end flows: create → confirm → verify; multi-step approval chains (e.g. Timesheet's 2-level schema); cross-agent handoff. |
| Negative | Invalid values, vague/ambiguous requests, deletion without explicit naming, double-confirm, double-click. |
| UI | Native rendering, toast/flash message styling, modal lifecycle, responsive layout. |
| Security | Unauthenticated/under-privileged direct access sweeps, stored-input safety (script/HTML payloads), ID-enumeration checks, session isolation. |
| Performance | Response time under realistic data volume, no unbounded N+1 patterns in list/report views. |
| Code quality | Source-level review when a live finding warrants tracing root cause (pattern established throughout this engagement — most filed bugs include a source citation, not just a behavioral description). |

### 4.3 Honesty-first testing principle

A recurring theme specific to this plugin: because every bundled agent is an LLM-backed layer, a "PASS" on the chat's own stated outcome is never sufficient on its own — every write claim is independently verified against the real underlying Redmineflux plugin (native UI, DB query, or audit log) before being accepted. This discipline directly produced several of this engagement's most severe findings (BUG-CRX-011 Critical, BUG-CRX-012 Critical, BUG-CRX-020 Critical) and remains the standing methodology for all future retests.

## 5. Test Environment

| | |
|---|---|
| Redmine version | 7.0.0 (Docker `redmine:7.0.0` image) |
| Stack | `C:\Crux-Redmine-Docker` — dedicated instance, separate from other local redmine-docker-* stacks |
| Redmine URL | `http://localhost:3014` |
| crux-core | `http://localhost:8787` |
| MCP (via nginx) | `http://localhost:8082` |
| Test project | `CRUX_PROJECT=crux-qa` |
| Browser | Chromium via Playwright MCP |
| crux-core version | 0.92.0 |

**Known environment constraints** (see [`CRUX_MEMORY.md`](CRUX_MEMORY.md) for live status):
- LLM provider key (Anthropic/OpenAI/Gemini) required for real chat/write-proposal testing — without one, chat only returns a canned echo fallback.
- `CRUX_REQUIRE_USER_KEY` defaults to `0` (shared key) — must be flipped to `1` + stack restarted to test CRX-12's fail-closed behavior.
- `CRUX_DISCOVERY_WRITE_GROUPS` must list every bundled-agent group or that agent's config-management write tools silently report as "not available" (root cause of BUG-CRX-034/017, since resolved).
- A `git pull` is required before any dev-fix retest — `docker restart` alone does not fetch new commits on any of the 4 repos (crux-core, redmineflux_crux, redmineflux_timesheet, redmineflux_testcase_management).

## 6. Entry Criteria

- Requirements, features list, and user-facing behavior documented in `docs/` before any test case is written.
- Target Redmine instance reachable and the 9 domain plugins installed + migrated.
- LLM provider configured and verified live (`Test connection` returns `ok`) before any agent-CRUD suite is executed.
- Fixture users and projects available per suite precondition (built live via native UI — the redmineflux MCP server is never used to build local fixtures, only to report confirmed bugs to production).

## 7. Exit Criteria

Per repo root `CLAUDE.md` §10, this plugin's status is **Complete** only when both are true:
1. `bugs/open/` is empty (all bugs fixed and moved to `bugs/closed/`).
2. A full final-cycle regression has been run and passed (`SENIOR_QA_STANDARDS.md` §27), with a matching Run History row in [`CRUX_HANDOFF.md`](CRUX_HANDOFF.md).

**Current status (2026-10-01): In Progress.** All 16 suites / 176 test cases have a definitive execution pass (see §9 and the companion [`CRUX_TRACEABILITY_MATRIX.md`](CRUX_TRACEABILITY_MATRIX.md)), but 6 bugs remain open and no final-cycle regression has run yet.

## 8. Defect Management

### 8.1 Bug ID convention

`BUG-CRX-<NNN>` — one continuous sequence, per repo root `CLAUDE.md` §4/§4a. 46 bugs filed to date (40 closed, 6 open as of this document's last update).

### 8.2 Severity definitions

| Severity | Definition |
|---|---|
| Critical | Data loss, security bypass, or a write executing without a genuine human confirm — the gate's "sacred rule" broken. |
| High | A documented write capability is completely blocked, or a permission boundary is bypassed without data-exposure severity reaching Critical. |
| Medium | A feature behaves incorrectly or dishonestly but doesn't block the core workflow or expose data beyond scope. |
| Low | Cosmetic, wording, or audit-trail completeness gaps with no functional or security impact. |

### 8.3 Current open defects (2026-10-01)

| Bug ID | Title (short) | Severity | Found via |
|---|---|---|---|
| BUG-CRX-041 | Time Agent `submit` has no self-service team-ID discovery path | High | TC-CRX-083 gap sweep |
| BUG-CRX-042 | Empty-week `submit` failure message falsely implies data corruption | Medium | TC-CRX-083 gap sweep |
| BUG-CRX-043 | Sales Agent `update_deal_stage` — nested vs. flat parameter mismatch | High | BUG-CRX-013 retest |
| BUG-CRX-044 | Timesheet-lookup tools report fabricated definitive absence | Medium | TC-CRX-171/172 |
| BUG-CRX-045 | Time Agent `submit` silently substitutes the wrong user's data | Medium | TC-CRX-175 |
| BUG-CRX-046 | Timesheet `withdraw` has no Audit Log entry | Low | TC-CRX-173 |

Full history: [`bugs/_index.md`](../bugs/_index.md).

### 8.4 Production reporting

Confirmed bugs are reported to the production Redmine instance (`flux.zehntech.com`, project `ztflux`) via the `redmineflux` MCP server, per [`REDMINEFLUX-MCP-SETUP.md`](../../../REDMINEFLUX-MCP-SETUP.md) — every production write requires fresh, explicit user approval, with no standing/blanket authorization.

## 9. Test Suite Summary

16 suites, 176 test cases total, spanning TC-CRX-001 through TC-CRX-176 (numbering is plugin-wide and non-contiguous by design — see `CRUX_FEATURES_LIST.md`'s Suite Index). **All 16 suites have a full execution pass as of 2026-10-01.**

| # | Suite file | TC range | TC count | Status |
|---|---|---|---|---|
| 1 | `CRUX_NAVIGATION_AND_PERMISSIONS.md` | 132–144 | 13 | Fully executed, 13/13 PASS |
| 2 | `CRUX_ASK_CRUX_CHAT_CORE.md` | 102–112 | 11 | Fully executed |
| 3 | `CRUX_WRITE_CONFIRM_GATE.md` | 161–170 | 10 | Fully executed |
| 4 | `CRUX_PER_USER_KEY_CRX12.md` | 145–150 | 6 | Fully executed, 6/6 PASS |
| 5 | `CRUX_PROJECT_CREATION_AND_IMPROVE_WAND.md` | 151–160 | 10 | Fully executed |
| 6 | `CRUX_CHAT_CAPABILITIES_KEEP_SHARE_ARTIFACTS.md` | 113–120 | 8 | Fully executed (2 TCs gated out-of-scope by an unmet precondition) |
| 7 | `CRUX_DASHBOARD_GRAPH_PIPELINE.md` | 121–131 | 11 | Fully executed |
| 8 | `CRUX_AGENT_ROSTER_ADMIN.md` | 064–076 | 13 | Fully executed |
| 9 | `CRUX_AGENT_CRM_SALES.md` | 010–022 | 13 | Fully executed |
| 10 | `CRUX_AGENT_WORKLOAD_CAPACITY.md` | 089–101 | 13 | Fully executed |
| 11 | `CRUX_AGENT_DEVOPS_AND_BUDGET.md` | 023–033 | 11 | Fully executed |
| 12 | `CRUX_AGENT_AGILE_SCRUM.md` | 001–009 | 9 | Fully executed |
| 13 | `CRUX_AGENT_QA_TESTCASES.md` | 053–063 | 11 | Fully executed |
| 14 | `CRUX_AGENT_TIMESHEET.md` | 077–088, 171–176 | 18 | Fully executed |
| 15 | `CRUX_AGENT_INVOICE_BILLING.md` | 034–043 | 10 | Fully executed |
| 16 | `CRUX_AGENT_KNOWLEDGE_BASE.md` | 044–052 | 9 | Fully executed, 9/9 PASS |

Full per-TC results and defect linkage: [`CRUX_TRACEABILITY_MATRIX.md`](CRUX_TRACEABILITY_MATRIX.md).

**Note on "fully executed"**: as of 2026-10-01, all 174 in-scope TCs have a definitive PASS/FAIL/BLOCKED verdict (TC-CRX-032/033/063 — the last 3 permission-probe gaps — executed live that day, all PASS, no new bugs). The only 2 TCs with no verdict, TC-CRX-116/117 (Session Artifacts write-leg), are not pending — they were retired as explicitly out-of-scope per dev confirmation 2026-09-11 (attach-to-Flux is a deliberate v1 cut), replaced by TC-CRX-115. See the Traceability Matrix for full per-TC evidence.

## 10. Roles & Responsibilities

| Role | Responsibility |
|---|---|
| QA (Claude + Playwright MCP) | Test case design, execution, bug filing, retest, regression, report generation |
| Sourabh Singh | Session owner, production-write approval authority, scope/priority decisions |
| Prashant Chaurasia | Development — fix implementation for all `redmineflux-crux-*` and related repos |

## 11. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| LLM provider outage/credit exhaustion blocks all chat-driven testing | Treated as infrastructure, not a plugin defect — TCs marked BLOCKED, resumed once resolved; happened twice this engagement (2026-09-16, 2026-09-17). |
| `docker restart` silently running stale (pre-fix) code | Standing discipline: always `git pull`/`git fetch` and verify the target commit is present (`docker exec ... grep`) before trusting any retest against a dev-claimed fix. |
| An agent's own "success" claim is unreliable by construction (LLM-generated) | Every write claim independently verified against real backend state before being accepted as PASS — see §4.3. |
| Shared fixture data (e.g. `rf_teams` shared between Timesheet and Workload) causes cross-suite side effects | Documented explicitly in `CRUX_MEMORY.md`; fixture changes in one domain agent's suite are cross-checked against the other before being assumed isolated. |
| Production writes are irreversible and visible to the real dev team | Every single production write — bug report, close, link — requires its own fresh, explicit user approval; no session-wide or blanket authorization is ever assumed. |

## 12. Deliverables

- Test cases: `testcases/CRUX_*.md` (16 files, 176 TCs)
- Bug reports: `bugs/open/`, `bugs/closed/`, `bugs/_index.md`
- Daily/per-type reports: `reports/CRX-<TestingType>-<date>.md`
- This test plan: `docs/CRUX_TEST_PLAN.md`
- Traceability matrix: `docs/CRUX_TRACEABILITY_MATRIX.md`
- Session handoff: `docs/CRUX_HANDOFF.md`
- Plugin memory: `docs/CRUX_MEMORY.md`
- Time log entries: root `TIME_LOG.md`, filtered to `redmineflux_crux`

## 13. Schedule (actuals to date)

| Date | Milestone |
|---|---|
| 2026-09-10 | Cycle 1 start — requirements/features/scope drafted, first suite (`CRUX_NAVIGATION_AND_PERMISSIONS.md`) execution-ready |
| 2026-09-11 to 2026-09-14 | Navigation/permissions, chat core, write-confirm gate, dashboard/graph/pipeline suites executed |
| 2026-09-15 to 2026-09-17 | Remaining agent-CRUD suites executed (first pass); major fix-verification pass against dev's first `CHANGES.md` handoff; gap-TC sweep across all 9 agent suites |
| 2026-09-25 to 2026-09-29 | Multiple retest/regression passes against successive dev fix batches; root-caused and resolved 2 infrastructure-masquerading-as-defect findings (missing `CRUX_DISCOVERY_WRITE_GROUPS` env var) |
| 2026-10-01 | 7 "In QA" production bugs retested and closed; final 6 gap TCs (TC-CRX-171–176) executed, completing 100% suite coverage; this test plan and the companion traceability matrix published |

Status remains **In Progress** pending the 6 currently-open bugs' resolution and a final-cycle regression pass.

## 14. References

- [`CRUX_REQUIREMENTS.md`](CRUX_REQUIREMENTS.md)
- [`CRUX_FEATURES_LIST.md`](CRUX_FEATURES_LIST.md)
- [`CRUX_SCOPE.md`](CRUX_SCOPE.md)
- [`CRUX_MEMORY.md`](CRUX_MEMORY.md)
- [`CRUX_HANDOFF.md`](CRUX_HANDOFF.md)
- [`CRUX_TRACEABILITY_MATRIX.md`](CRUX_TRACEABILITY_MATRIX.md)
- Repo root `CLAUDE.md`, `SENIOR_QA_STANDARDS.md`, `REDMINEFLUX-MCP-SETUP.md`
