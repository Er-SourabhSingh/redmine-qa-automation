# Agent Capabilities Reference — Redmineflux Crux

> Source: full read of every file in `redmineflux-crux-core/agents/*.md` (2026-10-09, via subagent research pass — see `CRUX_HANDOFF.md` for how this was commissioned). This is the authoritative, current-as-of-read capability list for every bundled agent — write test cases against THIS, not against memory or an older partial read. Re-read the live `.md` file before trusting this for a specific TC if more than a few weeks have passed, since these files are the actual source of truth and can drift (see `agents_registry/bundled.py`'s own docstring on this exact risk).

---

## ⚠️ Critical: only 24 of the 27 bundled agent files are real Ask-Crux chat agents

Of the 27 `.md` files in `redmineflux-crux-core/agents/` (excluding `AGENT-TEMPLATE.md`), **3 are NOT Ask-Crux chat agents at all**:

| File | Why it's different |
|---|---|
| `intake-clarifier.md` | Claude-Code-subagent frontmatter (`name`/`tools: Bash, Read, Write, Grep, Glob, WebFetch`/`model: sonnet`) — not Crux's `id`/`allowed_tools` format. Reads Flux via raw `curl` + a hardcoded personal keyfile path, bypassing MCP entirely. Writes a local file only, never Flux. |
| `run-reporter.md` | Same alien frontmatter (`tools: Bash, Read`/`model: haiku`). Writes via a local `report_run.py` script; `--redmine` flag makes a REAL Flux write with **no confirm-card gate at all** — gated only by a procedural instruction, not a technical one. |
| `work-package-planner.md` | Same alien frontmatter (`tools: Bash, Read, Write, Grep, Glob`/`model: opus`). Writes to a separate agent-ops JSON-DB + local plan file, optionally `curl`s `/api/workpackage` directly — bypassing MCP/CRX-35 too. |

These 3 belong to the **frozen `redmineflux-agent-ops` prototype** (per crux-core's own `CLAUDE.md`), not the live Ask Crux product. **Do not write "address via Ask Crux chat, confirm-gated write" test cases for these 3** — they have no `id`, no chat persona, no MCP tool loop, and aren't reachable from the chat bubble/switcher at all. If asked to test them, that would need a completely different methodology (direct script/file inspection), out of scope for the chat-based suites.

**The remaining 24 are genuine chat agents** — `project-manager` (own suite: `CRUX_AGENT_PROJECT_MANAGER.md`) plus the 23 below.

---

## Agent categories (for scoping future suites)

| Category | Agents | Pattern |
|---|---|---|
| **Full-CRUD "per-plugin reference" (10, +Project Manager = 11)** | agile-scrum, budget-audit, crm-sales, devops, helpdesk, invoice-billing, knowledge-base, testcases-qa, timesheet, workload-capacity | Static "everyday" tool list + `crux_discover_tool_groups`/`crux_discover_group_tools` for the rest. Every write confirm-gated (CRX-35), never executed directly. These 9 (+ PM) are the original #117162 scope — already have suites except PM. |
| **Narrow/pipeline agents (8)** | alert-triage, auto-fixer, code-reviewer, docs-writer, monitor, reviewer, root-cause, test-author | Mostly read-only, fixed 1-2 tool lists, no discovery mechanism. Each owns one stage of the Wave-2 bug-fix pipeline or a software pipeline's review/test gate. |
| **Wand/setup specialists (2)** | improver, project-setup | `improver` = CRX-46 wand (strict machine-readable output, no prose). `project-setup` = project scaffolding, static tools, no discovery. |
| **Zero/near-zero-tool conversational (3)** | digest, research, crux-guide | `digest`/`research` = CRX-26 `@crux <verb>` mention-router agents, empty tool list, grounded-only. `crux-guide` = product doc-store only (`crux_list_docs`/`crux_read_doc`), never touches Flux. |
| **NOT chat agents (3)** | intake-clarifier, run-reporter, work-package-planner | See warning above — exclude from chat-suite planning. |

---

## Per-agent detail

### agile-scrum — Scrum Agent
- **allowed_tools**: `get_backlog`, `get_board`, `get_board_grouped`, `get_board_group_cards`, `get_global_board`, `get_global_board_group_cards`, `get_my_page_board`, `get_sprint`, `list_sprints`, `list_epics`, `backlog_load_more`, `board_load_more`, `create_issue`, `create_sprint`, `update_sprint`, `delete_sprint`, `assign_to_sprint`, `move_issue`, `global_move_issue`, `my_page_move_issue`, `update_card`, `update_backlog_issue`, `update_issue_field` — discoverable group `agile`: board/column config CRUD.
- Writes: create_issue, sprint CRUD, assign_to_sprint, card/issue moves+updates; discoverable column/board-config CRUD.
- Hard limits: no project-name lookup (numeric id only — wrong id silently shows a DIFFERENT project's board); never deletes without a named target.
- ⚠️ **Live finding (old env, not yet filed)**: fabricated a fully invented "backlog empty, 0 items" answer with **zero tool calls** when the Agile Board plugin was undetected server-side — directly violates its own "say so plainly" rule.

### alert-triage — Alert Triage
- **allowed_tools**: `get_issue`, `create_issue` (only 2 — fixed list, no discovery).
- Writes: create_issue only.
- Persona: Wave-2 pipeline stage 2 — severity + dedupe + propose a bug ticket. Routes, never fixes. Must `get_issue`-dedupe before ever proposing new.

### auto-fixer — Auto-Fixer
- **allowed_tools**: `get_issue` (read-only).
- Writes: none via Redmine tools — "writes" = opening an external PR via a separate Tier-3 coding fleet (Claude Code/Codex), never merges/deploys.
- Model: claude-opus-4-8. Broad/unfamiliar errors escalate to a human, never attempted blind.

### budget-audit — Budget Agent
- **allowed_tools**: `get_budget_status`, `list_approved_hours`, `get_approved_hour`, `set_budget` (4 — smallest static surface of any full-CRUD agent, no discovery documented).
- Writes: `set_budget` only (exact project/scope/amount, confirm-gated).
- ⚠️ **Live finding (old env, not yet filed)**: `get_budget_status` has **no permission check at all**.

### code-reviewer — Code Reviewer
- **allowed_tools**: `get_issue`.
- Writes: none via Redmine — comments/status on an external review surface only.
- Only reviews a diff literally present in context (no git/PR tool wired) — stops rather than inventing a review.

### crm-sales — Sales Agent
- **allowed_tools**: `dashboard`, `list/get_contact`, `list/get_company`, `list/get_deal`, `pipeline`, `list/get_lead`, `reports`, `create/update_contact`, `create/update_company`, `create/update_deal`, `update_deal_stage`, `create/update_lead`, `convert_lead`, `log_activity`, `delete_activity`, `delete(entity_type,id)`, `link`, `unlink`, `settings_get`, `crux_create_work_package` — discoverable group `crm`: `audit_log`, `list_activities`, 4× `export_*`, `settings_update`, 4× bulk `import_*`.
- Writes: extensive — contact/company/deal/lead CRUD, stage moves, convert_lead, activity log/delete, link/unlink to a Redmine issue, settings_update, `crux_create_work_package(outcome_type: "lead-to-deal")`.
- `settings_update` REPLACES the whole stage/status/source list (read-then-append, never blind-overwrite). `link`/`unlink` only connects a CRM record to a Redmine ISSUE, never CRM-to-CRM.

### crux-guide — Crux Guide
- **allowed_tools**: `crux_list_docs`, `crux_read_doc` (the product's own internal doc store — not Redmine/MCP at all).
- Writes: none. Never invents a feature/button/page that doesn't exist; never guesses a live number (zero Flux access); redirects live-data questions to Project Manager.
- Good candidate for a "documentation drift" test suite rather than a Redmine-state one.

### devops — DevOps Agent
- **allowed_tools**: `project_summary`, `list_repositories`, `list_commits`, `list_pull_requests`, `list_builds`, `get_build`, `issue_builds`, `trigger_build`.
- Writes: `trigger_build` only (named repo/branch required, confirm-gated). Never triggers speculatively.
- ⚠️ **Live finding (old env, not filed — 1/3 reproduction, flaky)**: "project summary" answers were inconsistent across 3 same-session attempts — one fabricated CRM figures it has zero tool access to.

### digest — Digest
- **allowed_tools**: none (`[]`).
- Persona: CRX-26 `@crux summarize` mention-verb — crisp ticket-thread summary + open questions, grounded only in given material. Never manufactures an "open question" if none exist.

### docs-writer — Docs Writer
- **allowed_tools**: `get_issue`, `list_issues`.
- Writes: proposes a doc replacement only (human accepts externally) — not a Redmine write tool at all. Never documents an API/flag/behavior not actually in the code; never silently overwrites an existing doc.

### helpdesk — Support Agent (display name; chat-addressed and `id` both stay "helpdesk" — deliberate CRX-63 mismatch)
- **allowed_tools**: `list/get/create/update_ticket`, `merge_ticket`, `list/add_conversation`, `list/get_email_history`, `get_sla_status`, `pause/resume/escalate_sla`, `sla_analytics`, `list/get_sla`, `prepaid_support_hours_status`, `list/get/create/update_customer`, `list/get/create/update_canned_response`, `process_canned_response_macros`, `delete(resource_type,id)`, `kb_list_pages`, `kb_get_page`, `kb_search`, `crux_create_work_package` — discoverable group `helpdesk`: organizations CRUD, support levels/products/packages, holidays, email configuration, full KB write CRUD, prepaid rule/enforcement config.
- Writes: extensive; discoverable group adds org/product/package/holiday writes.
- Must call `get_sla_status` BEFORE every escalate/pause/resume_sla even on an explicit named request. `kb_update_content` replaces full content (no append). `set_prepaid_enforcement` default is "off" when unset — never guess "hard." No Products delete tool (deliberate admin-only decision).

### improver — Improver (CRX-46 "Improve with Crux" wand)
- **allowed_tools**: `get_issue`, `list_issues`, `create_issue`, `update_issue`.
- Writes: proposes create_issue (chosen subtasks) / update_issue (description rewrite) via the wand's own confirm flow.
- **Unique strict output contract**: breakdown must be ONLY a raw JSON array (no prose); description rewrite must be ONLY the new text (no commentary/fence/preamble — UI renders it as a diff). No filler tasks ("investigate"/"misc"/"cleanup").

### invoice-billing — Invoicing Agent
- **allowed_tools**: `core_get_project` (id resolution), `invoice_dashboard`, `list/get_customer`, `list/get_invoice`, `list_project_invoices`, `list_team_rates`, `get_time_report`, `create/update/delete_customer`, `create/update/delete_invoice`, `generate_invoice`, `send_invoice`, `record_payment`, `delete_payment`, `get_pdf_link`, `crux_create_work_package` — discoverable group `invoice`: team-rate set/update/delete/bulk_update.
- Writes: extensive financial CRUD incl. `crux_create_work_package(outcome_type: "billing")`.
- `get_pdf_link` never returns raw bytes, only a path. Never sends an invoice without explicit "send now" intent.
- **Unique cross-plugin redirect**: when CRM is also installed, Invoice's own customer endpoints 403 and this agent must silently retry through `redmineflux_crm_*` tools — for writes, the redirect surfaces only after the FIRST proposal is confirmed, needing a second fresh confirm. No other agent has this live tool-substitution behavior — worth its own TC.

### knowledge-base — KB Agent
- **allowed_tools**: `list/get_space`, `list/get_node`, `list_versions`, `create/update/delete_space`, `create/update/delete_node`, `toggle_publish(published)`, `restore_version`.
- Writes: space/node CRUD, publish toggle, version restore. No project-name lookup (numeric id only). Never answers from "general knowledge" — only a real `kb_*` read this turn.
- ⚠️ **Live finding (old env, not yet filed)**: `list_spaces` has **no permission check at all**.

### monitor — Monitor
- **allowed_tools**: none (`[]`).
- Persona: Wave-2 pipeline stage 1 — raises exactly one structured alert from a handed-to-it signal. Model: claude-haiku-4-5 (cheapest in the roster, tuned for volume). Explicit "honest gap": no live log/metrics integration wired, never pretends to have polled a source.

### project-setup — Project Setup Agent
- **allowed_tools**: `list_projects`, `list_users`, `get_user`, `list_enumeration(kind)`, `create_project`, `create_issue`, `crux_create_work_package`.
- Writes: create_project, batched create_issue calls, `crux_create_work_package` (only when gated tracking is genuinely wanted).
- Fully static tool list, **no discovery mechanism** — narrower than it looks despite superficial similarity to Project Manager. Never guesses a numeric user id from a name; never invents members/modules the org data doesn't support.

### research — Research
- **allowed_tools**: none (`[]`).
- Persona: CRX-26 `@crux research` mention-verb — grounded/cited findings. Never invents a statistic/source/quote.
- **Open QA question flagged by the subagent**: the file is told to handle "a URL" but grants no actual URL-fetch tool — worth testing whether it ever falsely claims to have browsed one, or always honestly defers.

### reviewer — Reviewer
- **allowed_tools**: `get_issue`, `list_issues`.
- Writes: none — verdict only (PASS/BLOCK), a human still merges/advances.
- **Unique rule: no self-confirm** — cannot approve its own proposed work, must refuse the verdict if reviewing its own output. An unjudgeable criterion is a BLOCK, never a guess-pass. Good targeted TC: have it "review" its own prior output.

### root-cause — Root-Cause Analyst
- **allowed_tools**: `get_issue`, `list_issues`.
- Writes: none — notably, not even `update_issue` for its own "annotate the incident" step (worth checking whether/how that annotation actually persists anywhere).
- Model: claude-opus-4-8. A probable cause must be LABELLED probable, never asserted as fact; must always state a confidence level.

### test-author — Test Author
- **allowed_tools**: `get_issue`.
- Writes: none — produces test code as output text only. Never claims coverage/a passing test it didn't actually write/run; a test that can't fail on broken code is explicitly forbidden. Cleanest agent for a "never claims false coverage" TC.

### testcases-qa — QA Agent
- **allowed_tools**: `list/get_testcase`, `list_testcases_by_attributes`, `list_unassigned_testcases`, `list/get_test_suite`, `list_testcases_in_suite`, `list/get_run`, `get_run_testcases`, `list_testcase_results`, `list/get_milestone`, `list/get_report`, `core_list_projects`, `core_get_project`, `create/update/delete_testcase`, `bulk_delete_testcases`, `create/update/delete_test_suite`, `add/remove/copy_testcases_to_suite`, `create/update/delete_run`, `bulk_delete_runs`, `close_run`, `create_status_result`, `bulk_create_status_results`, `attach_to_result`, `report_defect` — discoverable group `testcases`: milestones/environments/case-statuses/run-statuses/run-types/reports/email-templates CRUD, `cancel_report_scheduling`, `set_active_email_template`, `set_tracker`.
- Writes: very extensive, incl. `report_defect` (files a real defect from a failed result).
- No project tools of its own — must use `core_list_projects`/`get_project`. Never bulk/single-deletes without named records.
- ⚠️ **Live finding (old env, not yet filed)**: `list_test_suites` has **no permission check at all**.

### timesheet — Time Agent
- **allowed_tools**: `list`, `show`, `report`, `time_entries`, `admin_dashboard`, `approval_dashboard`, `approval_review`, `audit_log`, `audit_log_show`, `audit_log_stats`, `audit_log_export`, `submit`, `approve`, `reject`, `withdraw`, `delete`, `withdraw_bulk(context)`, `toggle_deadline_lock` — discoverable group `timesheet`: schema/team/settings reads+writes.
- Writes: submit/approve/reject/withdraw/delete, withdraw_bulk, toggle_deadline_lock; discoverable schema/team/settings writes.
- **Richest bug-citation density of any agent file — a ready-made regression-TC source.** Named fixes baked in as guardrails: BUG-CRX-038 (`context_id` must be real numeric, never slugified-guessed), BUG-CRX-041 (`team_list` now works for any caller — no excuse to guess a team id), BUG-CRX-044 (`approval_dashboard` is scoped to caller's own queue — empty ≠ "doesn't exist"), BUG-CRX-042 (check `time_entries` before a submit proposal), BUG-CRX-045 (`submit` always acts on the CALLER's own entries — must refuse, never silently substitute, when asked to submit someone else's). **Re-verify each of these still holds on the new Redmine 6 build before assuming the old fix carried over.**

### workload-capacity — Capacity Agent
- **allowed_tools**: `dashboard`, `teams`, `team_data`, `workloads_list`, `workload_show`, `capacity`, `conflicts`, `gantt`, `team_on_leave`, `members_list`, `permissions`, `search_issues`/`members`/`projects`/`unassigned_issues`/`users`, `add_issue`, `remove_issue`, `allocation_reorder`/`reset`/`resize`/`split`/`update_dates`, `update_planned_hours`, `leave_create`/`update`/`action` — discoverable group `workload`: `hours_report`, `hours_table`, `eligible_issues`, holiday/scheme CRUD, skill taxonomy, roster mgmt, `leaves_list`/`leave_show`/`leave_calculate_days`, `settings_get`/`update`, `recalculate`/`refresh_gantt`, `workload_create`/`update`/`delete`, `send_email`.
- Writes: extensive daily-allocation + leave-action writes; discoverable roster/holiday/settings/email writes.
- **Largest tool surface of any agent (70-tool plugin).** `member_remove`/`member_update` take a `membership_id` (the "Member #" column), NEVER the `user_id` ("User #" column) on the same row — a live agent already conflated these and wrongly declared a real member nonexistent (matches historical BUG-CRX-017/034). `leave_action`'s `reason` is required for `'reject'`.

---

## Candidate bugs surfaced by this research pass (from `CRUX_AGENT_PERMISSION_MATRIX.md`, old Redmine-7 environment — NOT yet re-verified on the new Redmine 6 instance, NOT yet filed)

1. **KB Agent's `list_spaces`, QA Agent's `list_test_suites`, Budget Agent's `get_budget_status`** — all have **zero permission checks** (same defect class as the already-fixed-twice BUG-CRX-003/012, refiled as BUG-CRX-022). 3 more instances of a recurring pattern.
2. **Scrum Agent** fabricated a "backlog empty, 0 items" answer with **zero tool calls** when the Agile Board plugin was undetected server-side — violates its own "say so plainly" rule. High severity if reproducible.
3. **Capacity Agent**'s honest permission-denial refusal was cosmetically styled with the misleading success "✓" (same pattern as the already-tracked BUG-CRX-018).
4. **DevOps Agent** fabricated CRM figures in 1 of 3 "project summary" reproductions (flaky — not independently confirmed).

**These are old-environment findings, carried in `CRUX_AGENT_PERMISSION_MATRIX.md` since before this new Redmine 6 cycle started.** Before filing any of these as new bugs, they need to be reproduced live on `localhost:3015` (plugin v0.62.0) — a fix confirmed or a defect found on the old build is not automatically still true here. Flagged in `CRUX_MEMORY.md`'s pending-test-ideas for whichever suite ends up covering KB/QA/Budget/Scrum/DevOps agents next.
