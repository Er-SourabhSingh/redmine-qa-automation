# Features List — Redmineflux Crux

> This file must be read before writing any test case. It defines the full feature scope for test coverage.
> Drafted 2026-09-10 from `agents/*.md` tool manifests, `redmineflux-crux-core/docs/API.md`, and `redmineflux_crux/README.md` in the dev-provided QA stack (`C:\Crux-Redmine-Docker`). Each agent's "Write tools" column is read directly from its `allowed_tools:` front-matter — not yet exercised live.

## Feature List

| # | Feature | Description | Covered by TC |
|---|---------|-------------|---------------|
| 1 | Ask Crux chat — read | Ask any bundled agent a plain-language question; reply streams via SSE, cites real tool-call data, never invents figures | `CRUX_ASK_CRUX_CHAT_CORE.md` TC-CRX-102–021 |
| 2 | Ask Crux chat — write proposal + confirm gate | Any write implied by chat becomes a pending proposal (confirm card); executes once, only on explicit human Confirm (CRX-35) | `CRUX_WRITE_CONFIRM_GATE.md` TC-CRX-161–032 |
| 3 | Governed write path | Every write checked against Work Package autonomy + gate state before executing; suggest-only WP can never write (CRX-9) | `CRUX_WRITE_CONFIRM_GATE.md` TC-CRX-164 |
| 4 | Per-user Redmine key passthrough | Chat/Improve run under the asking user's own API key when `CRUX_REQUIRE_USER_KEY=1`; refused (401) without one; refused by Redmine itself if the user lacks real permission (CRX-12) | `CRUX_PER_USER_KEY_CRX12.md` TC-CRX-145–042 |
| 5 | Project creation from chat | "@crux create a project for X" → confirm card → real project (CRX-35 increment 1) | `CRUX_PROJECT_CREATION_AND_IMPROVE_WAND.md` TC-CRX-151–045 |
| 6 | Improve the description (wand) | Issue-page wand action suggests a rewritten description, before/after preview, one gated write on Apply (CRX-46) | `CRUX_PROJECT_CREATION_AND_IMPROVE_WAND.md` TC-CRX-154, 048–050, 052 |
| 7 | Improve — work breakdown (wand) | Issue-page wand action suggests subtasks; only the selected ones are created as gated child issues | `CRUX_PROJECT_CREATION_AND_IMPROVE_WAND.md` TC-CRX-155 |
| 8 | Keep | Pin a chat reply to the chat card | `CRUX_CHAT_CAPABILITIES_KEEP_SHARE_ARTIFACTS.md` TC-CRX-113–054 |
| 9 | Session Artifacts | Agent-produced output during a turn is saved and can be attached to a project/ticket | `CRUX_CHAT_CAPABILITIES_KEEP_SHARE_ARTIFACTS.md` TC-CRX-115–057 (implementation status itself unconfirmed — TC-CRX-115 exists to determine this) |
| 10 | Share | A teammate watches a live session read-only; sees confirm cards/outcomes but can never trigger the write themselves | `CRUX_CHAT_CAPABILITIES_KEEP_SHARE_ARTIFACTS.md` TC-CRX-118–060 |
| 11 | Crux dashboard | Merged Flux + Crux-store snapshot: issues, agents, runs, dispatch, blockers, aggregates, outcomes, Work Packages; scoped by `?project=` | `CRUX_DASHBOARD_GRAPH_PIPELINE.md` TC-CRX-121–064 |
| 12 | Project work graph | Per-project work graph of nodes/edges (CRX-24) | `CRUX_DASHBOARD_GRAPH_PIPELINE.md` TC-CRX-124 |
| 13 | Pipeline board | List / author / edit pipeline templates (`crux-pipeline/v1`) | `CRUX_DASHBOARD_GRAPH_PIPELINE.md` TC-CRX-125–069 |
| 14 | Agent roster + pause | View bundled + customer agent manifests; pause/resume an agent | `CRUX_AGENT_ROSTER_ADMIN.md` TC-CRX-064–076 |
| 15 | Agent provision identity | Give an agent a real Redmine identity, confirm-gated, honest partial reports (CRX-48) | `CRUX_AGENT_ROSTER_ADMIN.md` TC-CRX-067 |
| 16 | LLM provider/key admin | CRUD for LLM providers + live credential test; managed model keys, always masked, one default per provider | `CRUX_AGENT_ROSTER_ADMIN.md` TC-CRX-068–080, 084 |
| 17 | Structured log viewer | Admin-only structured log ring buffer | `CRUX_AGENT_ROSTER_ADMIN.md` TC-CRX-071 |
| 18 | Crux settings page | Set the core service URL from the Crux nav rail (no Administration section needed), merge-not-replace | `CRUX_AGENT_ROSTER_ADMIN.md` TC-CRX-072 |
| 19 | Gate approval click | `POST /api/gate` — a human approval `{wp_id, gate_id, approver}`, always attributable | `CRUX_WRITE_CONFIRM_GATE.md` TC-CRX-165–030; `CRUX_NAVIGATION_AND_PERMISSIONS.md` TC-CRX-136 |
| 20 | @-mention delegation | `@`-mentions in ticket comments act on the ticket, reply-only, visible delegation (CRX-26) | `CRUX_ASK_CRUX_CHAT_CORE.md` TC-CRX-105 (chat `@mention`); ticket-comment `@mention` (CRX-26 specifically) not yet covered — add if distinct from chat addressing |
| 21 | Frozen rules (object-level write blocks) | Admin-only page + enforcement layer above the standard gate (CRX-39) | `CRUX_WRITE_CONFIRM_GATE.md` TC-CRX-167; `CRUX_NAVIGATION_AND_PERMISSIONS.md` TC-CRX-139 |
| 22 | Full CRUD — Sales Agent (CRM) | Contacts, companies, deals, leads, activities, settings | `CRUX_AGENT_CRM_SALES.md` TC-CRX-010–092, 158–162 (gap coverage: activity-deletion authorship, Lost Reason, Converted-status lockout, privacy visibility, no-perm chat probe) |
| 23 | Full CRUD — Capacity Agent (Workload) | Allocations, teams, members, skills, leave, holidays | `CRUX_AGENT_WORKLOAD_CAPACITY.md` TC-CRX-089–100, 153–157 (gap coverage: duplicate-membership rejection, holiday-scheme exclusivity, overload-disabled refusal, admin-only dashboard, permission-denial ✓-prefix regression check) |
| 24 | Write — DevOps Agent | `trigger_build` only (domain-appropriate single action) | `CRUX_AGENT_DEVOPS_AND_BUDGET.md` TC-CRX-023–103, 107, 177, 179 (gap coverage: vague-trigger clarification, no-perm probe) |
| 25 | Write — Budget Agent | `set_budget` only (domain-appropriate single action) | `CRUX_AGENT_DEVOPS_AND_BUDGET.md` TC-CRX-026–107, 178, 180 (gap coverage: vague-amount clarification, no-perm probe) |
| 26 | Full CRUD — Scrum Agent (Agile) | Boards, sprints, columns, cards, board config | `CRUX_AGENT_AGILE_SCRUM.md` TC-CRX-001–113, 174–176 (gap coverage: invalid workflow-transition refusal, Story Points honesty, no-perm probe) |
| 27 | Full CRUD — QA Agent (Test Case Mgmt) | Test cases, suites, runs, results, reference data, defect reporting | `CRUX_AGENT_QA_TESTCASES.md` TC-CRX-053–120, 170–173 (gap coverage: defect-report status gating, active-run suite lock, immutable suite scope, no-perm probe) |
| 28 | Full CRUD — Time Agent (Timesheet) | Submit/approve/reject/withdraw, deadlines, schemas, teams | `CRUX_AGENT_TIMESHEET.md` TC-CRX-077–126, 147–152 (gap coverage: sequential approval order, self-approval lockout, withdrawal-after-approval refusal, edit-lock-after-approval, auto-approve threshold, no-perm dashboard probe) |
| 29 | Full CRUD — Invoicing Agent (Invoice) | Customers, invoices, payments, team rates, PDF link | `CRUX_AGENT_INVOICE_BILLING.md` TC-CRX-034–132, 163–166 (gap coverage: Sent-invoice edit lockout, linked-customer delete refusal, rate-fallback chain, no-perm probe) |
| 30 | Full CRUD — KB Agent (Knowledge Base) | Spaces, pages, publish/unpublish, version restore | `CRUX_AGENT_KNOWLEDGE_BASE.md` TC-CRX-044–138, 167–169 (gap coverage: draft-visibility privacy, invalid-parent structural rule, no-perm probe) |

**Suite index (16 files, TC-CRX-132–180 — some numbers intentionally unused across suite boundaries, not a gap to fill):**
1. `CRUX_NAVIGATION_AND_PERMISSIONS.md` (001–010, 139–141) — executable now
2. `CRUX_ASK_CRUX_CHAT_CORE.md` (011–021) — blocked on LLM key (mostly)
3. `CRUX_WRITE_CONFIRM_GATE.md` (025–032) — blocked on LLM key (mostly)
4. `CRUX_PER_USER_KEY_CRX12.md` (037–042) — blocked on LLM-key-flip + 2nd test user
5. `CRUX_PROJECT_CREATION_AND_IMPROVE_WAND.md` (043–052) — blocked on LLM key
6. `CRUX_CHAT_CAPABILITIES_KEEP_SHARE_ARTIFACTS.md` (053–060) — partially blocked
7. `CRUX_DASHBOARD_GRAPH_PIPELINE.md` (062–069, 142–144) — executable now
8. `CRUX_AGENT_ROSTER_ADMIN.md` (074–084, 145–146) — executable now
9. `CRUX_AGENT_CRM_SALES.md` (085–092, 158–162) — blocked on LLM key; 158–161 also blocked on OpenRouter credit (2026-09-16), 162 needs a temp `daisy.skye` grant
10. `CRUX_AGENT_WORKLOAD_CAPACITY.md` (093–100, 153–157) — blocked on LLM key; 153–157 also blocked on OpenRouter credit (2026-09-16)
11. `CRUX_AGENT_DEVOPS_AND_BUDGET.md` (101–107, 177–180) — blocked on LLM key; 177–180 also blocked on OpenRouter credit (2026-09-16)
12. `CRUX_AGENT_AGILE_SCRUM.md` (108–113, 174–176) — blocked on LLM key; 174–176 also blocked on OpenRouter credit (2026-09-16)
13. `CRUX_AGENT_QA_TESTCASES.md` (114–120, 170–173) — blocked on LLM key; 170–173 also blocked on OpenRouter credit (2026-09-16)
14. `CRUX_AGENT_TIMESHEET.md` (121–126, 147–152) — blocked on LLM key; 147–152 also blocked on OpenRouter credit (2026-09-16)
15. `CRUX_AGENT_INVOICE_BILLING.md` (127–132, 163–166) — blocked on LLM key; 163–166 also blocked on OpenRouter credit (2026-09-16)
16. `CRUX_AGENT_KNOWLEDGE_BASE.md` (133–138, 167–169) — blocked on LLM key; 167–169 also blocked on OpenRouter credit (2026-09-16)

### Per-agent CRUD coverage (the 9 agents named in #117162)

| Agent | Plugin domain | Read tools | Write tools (per `allowed_tools:`) |
|---|---|---|---|
| Sales Agent | CRM | dashboard, contacts, companies, deals, pipeline, leads, reports, audit log | create/update/delete contact, company, deal, lead; update deal stage; convert lead; link/unlink contact & deal; log/delete activity; settings update; import/export (4 entity types) |
| Capacity Agent | Workload | dashboard, teams, workloads, capacity, conflicts, gantt, reports, holidays, leave, members, skills, search | add/remove issue; allocation reorder/reset/resize/split/update-dates; update planned hours; recalculate; refresh gantt; workload create/update *(full team/member/holiday/leave CRUD present in tool catalog per MCP tool list — verify which are actually on this agent's `allowed_tools` line-by-line during testing, file list was truncated in the draft read)* |
| DevOps Agent | DevOps | project summary, repositories, commits, PRs, builds, issue builds | **trigger_build only** — no create/update/delete (domain has no such concept) |
| Budget Agent | Budget/Audit | budget status, approved-hours list/get | **set_budget only** — no create/update/delete |
| Scrum Agent | Agile | backlog, board (+grouped/global/my-page variants), sprints, epics, columns, board configs | create issue; create/update/delete sprint; assign to sprint; create/update/delete column; reorder columns; create/update/delete board config; update board settings; move/update card (incl. global & my-page variants); update backlog issue; update issue field |
| QA Agent | Test Case Management | testcases, suites, runs, results, milestones, reports, projects, environments, statuses, email templates | create/update/delete testcase (+ bulk delete); create/update/delete test suite; add/remove/copy testcases to suite; create/update/delete run (+ bulk delete); close run; create status result (+ bulk); attach to result; **report_defect**; create milestone *(list continues past line 50 in source — re-read full file before writing TCs)* |
| Time Agent | Timesheet | list, show, report, time entries, admin/approval dashboards, audit log, schemas, teams, settings | submit/approve/reject/withdraw timesheet (+ withdraw by project/team); delete timesheet; deadline lock/unlock; schema create/update/delete/activate/deactivate/assign-team/unassign-team; project-schema assign/unassign; team create/update/delete/add-members/remove-member/update-member; settings update |
| Invoicing Agent | Invoice | dashboard, customers, invoices, project invoices, team rates, time report | create/update/delete customer; create/update/delete invoice; generate/send invoice; record/delete payment; set/update/delete/bulk-update team rate; get PDF link; + `crux_create_work_package` (gated multi-step tracking, local tool) |
| KB Agent | Knowledge Base | list/get spaces, nodes, versions | create/update/delete space; create/update/delete node/page; publish/unpublish node; restore version |

**QA implication:** 7 of the 9 agents (all except DevOps and Budget/Audit) already carry full create/update/delete tool access in their spec files on this checkout, at crux-core v0.92.0 — this appears substantially further along than the #117162 ticket description's own "Not started — planning/spec stage" line suggests (matches the tracker's Status = In QA / 70% done better). Confirm live, per agent, before treating any of this as verified — a tool being *listed* in `allowed_tools` is not the same as it working end-to-end through the confirm gate.

## Notes

- Full tool catalog source: `redmineflux-crux-core/agents/*.md` front-matter (`allowed_tools:`) — always re-check the live file before writing a TC, this list may change between now and execution.
- Some individual agent files were only partially read while drafting this list (Capacity Agent, QA Agent) — re-open the full files before finalizing test coverage so no write tool is missed or misattributed.
- The broader ~26-agent roster (`db.seed.production.json`) includes agents outside #117162's 9 (Project Manager, Improver, Research, Reviewer, Root Cause, Monitor, Digest, Docs Writer, Alert Triage, Auto-Fixer, Intake Clarifier, Work Package Planner, Project Setup, Run Reporter, Test Author, Crux Guide, Code Reviewer, Helpdesk) — out of scope for #117162 specifically but may be relevant to #116773's chat/write-chain testing (Improver = CRX-46).
