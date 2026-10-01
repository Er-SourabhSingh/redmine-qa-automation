# Traceability Matrix — Redmineflux Crux

> Companion to [`CRUX_TEST_PLAN.md`](CRUX_TEST_PLAN.md). Maps every documented feature to its covering test suite(s), and every individual test case to its result and any linked defect(s). Source: `testcases/CRUX_*.md` (16 files), `docs/CRUX_FEATURES_LIST.md`, `bugs/_index.md`. Compiled 2026-10-01.
>
> **Result legend**: PASS · FAIL · CRITICAL-FAIL (Critical-severity defect) · BLOCKED (precondition/environment, not a defect) · INCONCLUSIVE · NOT EXECUTED.
> Where a TC's own file text and `bugs/_index.md` disagree on which bug a finding was filed as, `bugs/_index.md` is treated as authoritative (it is the master bug ledger) and a footnote explains the discrepancy.

---

## Part 1 — Feature-to-Suite Matrix

Maps each of the 30 documented features (`CRUX_FEATURES_LIST.md`) to its covering suite and a rollup verdict.

| # | Feature | Suite | TC Range | Suite Verdict |
|---|---|---|---|---|
| 1 | Ask Crux chat — read | `CRUX_ASK_CRUX_CHAT_CORE.md` | TC-CRX-102–112 | 10 PASS, 1 FAIL (TC-104 → BUG-CRX-007, closed), 1 INCONCLUSIVE |
| 2 | Ask Crux chat — write proposal + confirm gate | `CRUX_WRITE_CONFIRM_GATE.md` | TC-CRX-161–170 | 8 PASS, 2 FAIL (TC-164 Critical → BUG-CRX-008; TC-165 → BUG-CRX-003) |
| 3 | Governed write path | `CRUX_WRITE_CONFIRM_GATE.md` | TC-CRX-164 | FAIL → BUG-CRX-008 (Critical, closed) |
| 4 | Per-user Redmine key passthrough | `CRUX_PER_USER_KEY_CRX12.md` | TC-CRX-145–150 | 6/6 PASS |
| 5 | Project creation from chat | `CRUX_PROJECT_CREATION_AND_IMPROVE_WAND.md` | TC-CRX-151–152 | 2/2 PASS |
| 6 | Improve the description (wand) | `CRUX_PROJECT_CREATION_AND_IMPROVE_WAND.md` | TC-CRX-154, 156–158, 160 | 4 PASS, 1 FAIL (TC-158 → BUG-CRX-009) |
| 7 | Improve — work breakdown (wand) | `CRUX_PROJECT_CREATION_AND_IMPROVE_WAND.md` | TC-CRX-155 | PASS |
| 8 | Keep | `CRUX_CHAT_CAPABILITIES_KEEP_SHARE_ARTIFACTS.md` | TC-CRX-113–114 | 2/2 PASS |
| 9 | Session Artifacts | `CRUX_CHAT_CAPABILITIES_KEEP_SHARE_ARTIFACTS.md` | TC-CRX-115 | FAIL (TC-115 → BUG-CRX-010); TC-116/117 retired, out of scope (2026-09-11 dev decision) |
| 10 | Share | `CRUX_CHAT_CAPABILITIES_KEEP_SHARE_ARTIFACTS.md` | TC-CRX-118–120 | 1 PASS, 2 FAIL (TC-119 Critical → BUG-CRX-011; TC-120 → BUG-CRX-012) |
| 11 | Crux dashboard | `CRUX_DASHBOARD_GRAPH_PIPELINE.md` | TC-CRX-121–123 | 3/3 PASS |
| 12 | Project work graph | `CRUX_DASHBOARD_GRAPH_PIPELINE.md` | TC-CRX-124 | PASS |
| 13 | Pipeline board | `CRUX_DASHBOARD_GRAPH_PIPELINE.md` | TC-CRX-125–128 | 3 PASS, 1 BLOCKED |
| 14 | Agent roster + pause | `CRUX_AGENT_ROSTER_ADMIN.md` | TC-CRX-064–066 | 3/3 PASS |
| 15 | Agent provision identity | `CRUX_AGENT_ROSTER_ADMIN.md` | TC-CRX-067 | PASS |
| 16 | LLM provider/key admin | `CRUX_AGENT_ROSTER_ADMIN.md` | TC-CRX-068–070, 074 | 3 PASS, 1 FAIL (TC-068 → BUG-CRX-001) |
| 17 | Structured log viewer | `CRUX_AGENT_ROSTER_ADMIN.md` | TC-CRX-071 | PASS (filter correctness) → BUG-CRX-006 (separate defect found) |
| 18 | Crux settings page | `CRUX_AGENT_ROSTER_ADMIN.md` | TC-CRX-072 | PASS |
| 19 | Gate approval click | `CRUX_WRITE_CONFIRM_GATE.md` / `CRUX_NAVIGATION_AND_PERMISSIONS.md` | TC-CRX-166, 136 | PASS / PASS (TC-136 → BUG-CRX-003 found, separate) |
| 20 | @-mention delegation | `CRUX_ASK_CRUX_CHAT_CORE.md` | TC-CRX-105 | PASS |
| 21 | Frozen rules (object-level write blocks) | `CRUX_WRITE_CONFIRM_GATE.md` / `CRUX_NAVIGATION_AND_PERMISSIONS.md` | TC-CRX-167, 139 | 2/2 PASS |
| 22 | Full CRUD — Sales Agent (CRM) | `CRUX_AGENT_CRM_SALES.md` | TC-CRX-010–022 | 11 PASS, 2 FAIL (TC-012, 013) |
| 23 | Full CRUD — Capacity Agent (Workload) | `CRUX_AGENT_WORKLOAD_CAPACITY.md` | TC-CRX-089–101 | 10 PASS, 1 FAIL, 1 BLOCKED/INCONCLUSIVE, 1 source-inconsistent (TC-101) |
| 24 | Write — DevOps Agent | `CRUX_AGENT_DEVOPS_AND_BUDGET.md` | TC-CRX-023–025, 029–030, 032 | 5 PASS, 1 BLOCKED |
| 25 | Write — Budget Agent | `CRUX_AGENT_DEVOPS_AND_BUDGET.md` | TC-CRX-026–028, 031, 033 | 5 PASS |
| 26 | Full CRUD — Scrum Agent (Agile) | `CRUX_AGENT_AGILE_SCRUM.md` | TC-CRX-001–009 | 4 PASS, 5 FAIL (TC-002–005 all → BUG-CRX-020; TC-007 → BUG-CRX-031) |
| 27 | Full CRUD — QA Agent (Test Case Mgmt) | `CRUX_AGENT_QA_TESTCASES.md` | TC-CRX-053–063 | 8 PASS, 3 FAIL |
| 28 | Full CRUD — Time Agent (Timesheet) | `CRUX_AGENT_TIMESHEET.md` | TC-CRX-077–088, 171–176 | 9 PASS, 2 FAIL, 6 BLOCKED (resolved 2026-10-01 via TC-171–176 re-coverage) |
| 29 | Full CRUD — Invoicing Agent (Invoice) | `CRUX_AGENT_INVOICE_BILLING.md` | TC-CRX-034–043 | 6 PASS, 2 FAIL, 2 BLOCKED |
| 30 | Full CRUD — KB Agent (Knowledge Base) | `CRUX_AGENT_KNOWLEDGE_BASE.md` | TC-CRX-044–052 | 9/9 PASS |

---

## Part 2 — Full Test Case Traceability Matrix (176 TCs)

### Suite: `CRUX_AGENT_AGILE_SCRUM.md` (Feature #26 — 9 TCs)

| TC ID | Title | Result | Defect(s) |
|---|---|---|---|
| TC-CRX-001 | Read surface — board, backlog, sprints, epics, board config | PASS | — |
| TC-CRX-002 | Move/update a card across all three board-view variants | FAIL | BUG-CRX-020 (closed) |
| TC-CRX-003 | Create a sprint, assign a card, then update and delete it | FAIL | BUG-CRX-020 (closed) |
| TC-CRX-004 | Column and board-config management | FAIL | BUG-CRX-020 (closed) |
| TC-CRX-005 | Create an issue directly from Agile context | FAIL | BUG-CRX-020 (closed), BUG-CRX-013 (closed) |
| TC-CRX-006 | Deleting a sprint/column/board-config without naming it is refused | PASS | — |
| TC-CRX-007 | Invalid workflow-transition move is honestly refused | FAIL | BUG-CRX-031 (closed) |
| TC-CRX-008 | Story Points question answered honestly per feature-enabled state | PASS | — |
| TC-CRX-009 | Permission matrix — Scrum Agent, no-domain-permission probe | PASS | BUG-CRX-018, BUG-CRX-031 (referenced, both closed) |

### Suite: `CRUX_AGENT_CRM_SALES.md` (Feature #22 — 13 TCs)

| TC ID | Title | Result | Defect(s) |
|---|---|---|---|
| TC-CRX-010 | Sales Agent read surface — dashboard, pipeline, records, reports, audit log | PASS | — |
| TC-CRX-011 | Create a contact, company, deal, and lead — each fully specified | PASS | BUG-CRX-013, BUG-CRX-014 (referenced, both closed) |
| TC-CRX-012 | Update a deal's stage via `update_deal_stage`, not a generic update | FAIL | BUG-CRX-013 (closed; new BUG-CRX-043 found on 2026-10-01 retest, open) |
| TC-CRX-013 | Link/unlink a contact and a deal; log an activity | FAIL | BUG-CRX-015, BUG-CRX-016 (closed), BUG-CRX-004 (recurrence), BUG-CRX-014 |
| TC-CRX-014 | Convert a qualified lead | PASS | BUG-CRX-015, BUG-CRX-013 (referenced, both closed) |
| TC-CRX-015 | Settings — read before update, full-list replacement semantics | PASS | — |
| TC-CRX-016 | Delete requires the user to name the specific record | PASS | BUG-CRX-013 (referenced, closed) |
| TC-CRX-017 | Invalid stage/status/source value is rejected, not silently coerced | PASS | — |
| TC-CRX-018 | Activity deletion is restricted to its own author (non-admins) | PASS | BUG-CRX-018 (secondary finding, closed) |
| TC-CRX-019 | Moving a deal to Lost stage without a Lost Reason | PASS | — |
| TC-CRX-020 | Setting lead status to Converted directly is refused | PASS | BUG-CRX-027 (worked around, closed) |
| TC-CRX-021 | CRM privacy visibility from a non-admin's chat session (High) | PASS | BUG-CRX-003, BUG-CRX-012 (contrast refs, both closed) |
| TC-CRX-022 | Permission matrix — Sales Agent, no-domain-permission probe | PASS | BUG-CRX-012, 023, 024, 025 (referenced, all closed) |

### Suite: `CRUX_AGENT_DEVOPS_AND_BUDGET.md` (Features #24, #25 — 11 TCs)

| TC ID | Title | Result | Defect(s) |
|---|---|---|---|
| TC-CRX-023 | DevOps read surface — project summary, repos, commits, PRs, builds | PASS (data-limited, no repo connected) | — |
| TC-CRX-024 | Trigger a build — real infrastructure effect, confirm-gated | BLOCKED | — (no dev-confirmed safe test repo) |
| TC-CRX-025 | A vague/speculative build request does not produce a trigger proposal | PASS | — |
| TC-CRX-026 | Budget read surface — status, approved-hours audit | PASS | — |
| TC-CRX-027 | Set a budget cap with the exact project/scope and amount | PASS | — |
| TC-CRX-028 | Budget Agent never claims a cap changed before confirmation | PASS | BUG-CRX-013 (reproduced, closed) |
| TC-CRX-029 | Unreachable DevOps/Budget plugin tools reported honestly | PASS | — |
| TC-CRX-030 | DevOps — a vague `trigger_build` request is clarified, never guessed | PASS | — |
| TC-CRX-031 | Budget — a vague `set_budget` request is clarified, never guessed | PASS | — |
| TC-CRX-032 | Permission matrix — DevOps Agent, no-domain-permission probe | PASS (2026-10-01) | — |
| TC-CRX-033 | Permission matrix — Budget Agent, no-domain-permission probe | PASS (2026-10-01) | — |

### Suite: `CRUX_AGENT_KNOWLEDGE_BASE.md` (Feature #30 — 9 TCs)

| TC ID | Title | Result | Defect(s) |
|---|---|---|---|
| TC-CRX-044 | Read surface — spaces, nodes/pages, version history | PASS | — |
| TC-CRX-045 | Create a space and a page with grounded content | PASS | BUG-CRX-013 (reproduced, closed) |
| TC-CRX-046 | Update a page, publish it, then unpublish it | PASS | — |
| TC-CRX-047 | Restore an earlier version | PASS | BUG-CRX-013 (reproduced, closed) |
| TC-CRX-048 | Delete (space or page) requires the specific one named | PASS | — |
| TC-CRX-049 | A question about a nonexistent space/page is answered honestly | PASS | — |
| TC-CRX-050 | Draft-visibility — non-privileged user cannot read a draft (High) | PASS | BUG-CRX-003, 012, 023 (contrast refs, all closed) |
| TC-CRX-051 | `create_node` with an invalid parent is refused | PASS | — |
| TC-CRX-052 | Permission matrix — KB Agent, no-domain-permission probe | PASS | BUG-CRX-018 (4th instance, closed) |

### Suite: `CRUX_AGENT_QA_TESTCASES.md` (Feature #27 — 11 TCs)

| TC ID | Title | Result | Defect(s) |
|---|---|---|---|
| TC-CRX-053 | Read surface — testcases, suites, runs, results, milestones, reports | PASS | — |
| TC-CRX-054 | Create a test case and a test suite, then organize between them | FAIL | BUG-CRX-020 (closed) |
| TC-CRX-055 | Create a run, record results, close it, and report a defect | PASS (retested 2026-09-29) | BUG-CRX-020 (closed), BUG-CRX-013 (referenced, closed) |
| TC-CRX-056 | Reference-data management (milestone, environment, case status, run type) | FAIL | BUG-CRX-020 (closed) |
| TC-CRX-057 | Bulk operations target only the named records | PASS (retested 2026-09-29) | BUG-CRX-020 (closed) |
| TC-CRX-058 | No delete without the user naming the specific record(s) | PASS | — |
| TC-CRX-059 | `report_defect` is never claimed successful before confirmation | PASS | BUG-CRX-020 (upstream block, closed) |
| TC-CRX-060 | `report_defect` against a Passed result is refused | PASS (retested 2026-09-29) | BUG-CRX-027, 028, 029 (closed), BUG-CRX-020 |
| TC-CRX-061 | `remove_testcases_from_suite` fails when suite linked to an active run | FAIL (retested 2026-09-29, then CONFIRMED FIXED 2026-10-01) | BUG-CRX-036 (closed) |
| TC-CRX-062 | Moving a test case out of its suite's immutable scope | FAIL | BUG-CRX-030 (closed, Won't Fix — doc error, not code) |
| TC-CRX-063 | Permission matrix — QA Agent, no-domain-permission probe | PASS (2026-10-01) | — |

### Suite: `CRUX_AGENT_WORKLOAD_CAPACITY.md` (Feature #23 — 13 TCs)

| TC ID | Title | Result | Defect(s) |
|---|---|---|---|
| TC-CRX-089 | Read surface — dashboard, capacity, teams, gantt, conflicts, leave | PASS | — |
| TC-CRX-090 | Allocation writes — add/remove issue, resize, update dates/hours | FAIL | BUG-CRX-018 (closed), BUG-CRX-013, 014 (reproduced) |
| TC-CRX-091 | Leave lifecycle — create, approve, reject, cancel | PASS (2 bug findings) | BUG-CRX-019 (closed), BUG-CRX-013 (reproduced) |
| TC-CRX-092 | Team/member/skill management, including bulk removal | PASS | BUG-CRX-013, 014 (reproduced), BUG-CRX-017 (closed) |
| TC-CRX-093 | Holidays and holiday schemes — full lifecycle | PASS | BUG-CRX-013 (reproduced, closed) |
| TC-CRX-094 | `refresh_gantt`/`recalculate` are explicit-ask-only | PASS | — |
| TC-CRX-095 | `send_email` requires clear, explicit intent before proposing | PASS (1 bug finding) | BUG-CRX-013, 014 (new evidence) |
| TC-CRX-096 | Delete requires the specific record named | PASS | BUG-CRX-014 (documented risk) |
| TC-CRX-097 | Duplicate-team-membership add is rejected via chat | PASS | — |
| TC-CRX-098 | Holiday-scheme activation discloses its exclusivity side effect | FAIL | BUG-CRX-028 (folded in, closed) |
| TC-CRX-099 | Overload-disabled refusal on an over-capacity allocation | BLOCKED/INCONCLUSIVE | BUG-CRX-028 (folded in, closed) |
| TC-CRX-100 | Non-admin asking the Capacity Agent for the dashboard (High) | PASS | BUG-CRX-003, 012 (contrast refs, closed) |
| TC-CRX-101 | Permission matrix — Capacity Agent, permission-denial response | PASS *(source-text says "NOT YET EXECUTED (as a formal regression TC)" but the same block's evidence paragraph describes a complete live-executed test — file itself needs a wording correction)* | BUG-CRX-018 (referenced, closed) |

### Suite: `CRUX_AGENT_TIMESHEET.md` (Feature #28 — 18 TCs)

| TC ID | Title | Result | Defect(s) |
|---|---|---|---|
| TC-CRX-077 | Read surface — list, report, approval dashboard, audit log | PASS | — |
| TC-CRX-078 | Submit, approve, reject, withdraw — each naming the exact target | BLOCKED | BUG-CRX-020 (closed) |
| TC-CRX-079 | Deadline lock/unlock for a specific period | BLOCKED | BUG-CRX-020 (closed) |
| TC-CRX-080 | Schema and team management — full lifecycle | FAIL | BUG-CRX-020 (reproduced, closed) |
| TC-CRX-081 | `delete` (timesheet) requires the specific one named | PASS | — |
| TC-CRX-082 | `settings_update` requires clear confirmation of intent | PASS (gating) / FAIL (confirm mechanism) | BUG-CRX-020 (closed) |
| TC-CRX-083 | Sequential approval order — higher level cannot act before lower | BLOCKED (2026-09-17 infra outage) | — |
| TC-CRX-084 | Self-approval blocked when submitter is the final-level approver | BLOCKED (2026-09-17 infra outage) | — |
| TC-CRX-085 | Withdrawal refused once minimum approval level has approved | BLOCKED (2026-09-17 infra outage) | — |
| TC-CRX-086 | `Disable Log/Edit After Approval` blocks a chat-driven edit attempt | BLOCKED (2026-09-17 infra outage) | — |
| TC-CRX-087 | Auto-Approve Threshold reflected correctly in `approve` proposal | BLOCKED (2026-09-17 infra outage) | — |
| TC-CRX-088 | Permission matrix — Time Agent, no-domain approval-dashboard probe | BLOCKED (2026-09-17 infra outage) | — |
| TC-CRX-171 | Permission tier — view-only cannot approve others | PASS, with a caveat (2026-10-01) | BUG-CRX-044 (open) |
| TC-CRX-172 | Permission tier — `manage_timesheet` holder can approve within scope | PASS (2026-10-01) | BUG-CRX-044 (open, jointly with TC-171) |
| TC-CRX-173 | Basic withdraw — user withdraws own submitted timesheet | PASS, with a minor gap noted (2026-10-01) | BUG-CRX-046 (open) |
| TC-CRX-174 | Edit-after-approval allowed when the setting is OFF | PASS (2026-10-01) | — |
| TC-CRX-175 | Permission boundary on `submit` — cannot submit for another user | PASS on the core security bar (2026-10-01) | BUG-CRX-045 (open), BUG-CRX-039 (referenced, closed) |
| TC-CRX-176 | No tool to log/edit a time entry via chat — architecture boundary | PASS (2026-10-01) | — |

*TC-171/172/173/175: each TC's own file text understates its bug linkage ("not filed as a new bug" / no inline ID) — `bugs/_index.md` is authoritative and confirms BUG-CRX-044/045/046 were filed directly from these TCs' findings.*

### Suite: `CRUX_AGENT_INVOICE_BILLING.md` (Feature #29 — 10 TCs)

| TC ID | Title | Result | Defect(s) |
|---|---|---|---|
| TC-CRX-034 | Read surface — dashboard, customers, invoices, team rates, time report | PASS | BUG-CRX-007 (minor reproduction, closed) |
| TC-CRX-035 | Create a customer, generate an invoice, record a payment | FAIL (inferred) | BUG-CRX-020 (closed) |
| TC-CRX-036 | Send an invoice — real communication effect | BLOCKED | BUG-CRX-020 (closed) |
| TC-CRX-037 | Team rates — set, update, bulk-update, delete | FAIL | BUG-CRX-021 (closed), BUG-CRX-020 (reproduced) |
| TC-CRX-038 | PDF link — path only, never raw bytes | PASS (retested 2026-09-29) | BUG-CRX-020 (closed) |
| TC-CRX-039 | Delete and Send both require the specific record named | PASS | — |
| TC-CRX-040 | `update_invoice` on an already-Sent invoice is refused | FAIL | BUG-CRX-028 (closed), BUG-CRX-020/027 (referenced) |
| TC-CRX-041 | Deleting a customer still linked to a project is refused | PASS | — |
| TC-CRX-042 | Agent cites the real resolved rate per the fallback chain | BLOCKED | — (precondition unachievable on this instance) |
| TC-CRX-043 | Permission matrix — Invoicing Agent, no-domain-permission probe | PASS | — |

### Suite: `CRUX_ASK_CRUX_CHAT_CORE.md` (Feature #1, #20 — 11 TCs)

| TC ID | Title | Result | Defect(s) |
|---|---|---|---|
| TC-CRX-102 | Chat streams a reply via SSE | PASS | — |
| TC-CRX-103 | User identity is known without asking (CRC-31) | PASS | — |
| TC-CRX-104 | Domain-specific question routes to the correct bundled agent | FAIL | BUG-CRX-007 (closed) |
| TC-CRX-105 | Explicit `@mention` addresses a named agent directly | PASS | BUG-CRX-007 (contrast case, closed) |
| TC-CRX-106 | A hand-off between agents requires a confirm card (CRC-30) | INCONCLUSIVE | — |
| TC-CRX-107 | Domain-matching questions skip the hand-off card entirely | PASS (qualified) | BUG-CRX-007 (cross-ref, closed) |
| TC-CRX-108 | Non-English question still routes correctly | PASS | BUG-CRX-007 (referenced, closed) |
| TC-CRX-109 | Chat sessions — list, create, rename | PASS | — |
| TC-CRX-110 | Empty/unavailable plugin data is reported honestly, never guessed | PASS | — |
| TC-CRX-111 | Unreachable plugin tools are reported honestly | PASS (pre-migration baseline) | — |
| TC-CRX-112 | Chat never fabricates a figure it didn't just read | PASS | BUG-CRX-007 (referenced, closed) |

### Suite: `CRUX_CHAT_CAPABILITIES_KEEP_SHARE_ARTIFACTS.md` (Features #8, #9, #10 — 8 TCs)

| TC ID | Title | Result | Defect(s) |
|---|---|---|---|
| TC-CRX-113 | Keep pins a plain read-turn reply | PASS | — |
| TC-CRX-114 | Keep on a write-enabled turn | PASS | — |
| TC-CRX-115 | Session Artifacts — core-leg only (save, list, read, version) | FAIL (partial) | BUG-CRX-010 (closed) |
| TC-CRX-116 | Agent-produced artifact saves/attaches to a project/ticket | **RETIRED — out of scope** (dev confirmed 2026-09-11, `REPLY-TO-QA-2026-09-11.md` Q2: attach-to-Flux is a deliberate v1 cut, no ETA; replaced by TC-115) | — |
| TC-CRX-117 | A write-turn's artifact still saves/attaches correctly | **RETIRED — out of scope** (same 2026-09-11 dev confirmation) | — |
| TC-CRX-118 | A shared session is visible read-only to the invited viewer | PASS (visibility/read-only confirmed) | — |
| TC-CRX-119 | A shared viewer can never trigger the write themselves (CRITICAL) | **CRITICAL-FAIL** | BUG-CRX-011 (Critical, closed) |
| TC-CRX-120 | Share does not leak data the viewer wouldn't otherwise have access to | FAIL | BUG-CRX-012 (Critical, closed, broader than Share) |

### Suite: `CRUX_DASHBOARD_GRAPH_PIPELINE.md` (Features #11, #12, #13 — 11 TCs)

| TC ID | Title | Result | Defect(s) |
|---|---|---|---|
| TC-CRX-121 | Dashboard shows a merged Flux + Crux-store snapshot | PASS | — |
| TC-CRX-122 | Dashboard scopes correctly by `?project=` | PASS | — |
| TC-CRX-123 | Global dashboard does not actually require `view_crux` | PASS (counted) | — |
| TC-CRX-124 | Project work graph renders nodes/edges for a real project | PASS (`days=` sub-check inconclusive, not a failure) | — |
| TC-CRX-125 | Create, edit, and delete a pipeline template | PASS (counted) | — |
| TC-CRX-126 | Pipeline templates are global, not per-project | PASS (by architecture) | — |
| TC-CRX-127 | A user without `manage_crux_pipelines` cannot save/delete | PASS (counted) | — |
| TC-CRX-128 | Deleting a pipeline template in active use is handled gracefully | BLOCKED | — (not executable with current environment data) |
| TC-CRX-129 | Run Ledger "View All" (global) — any logged-in user can view | PASS | — |
| TC-CRX-130 | Run Ledger "View All" (project-scoped) — requires `view_crux` + membership | PASS | — |
| TC-CRX-131 | Crux module disabled — project tab and routes hidden/blocked | PASS | — |

### Suite: `CRUX_NAVIGATION_AND_PERMISSIONS.md` (Feature #19, #21 — 13 TCs)

| TC ID | Title | Result | Defect(s) |
|---|---|---|---|
| TC-CRX-132 | Ask Crux chat bubble appears for a user with `use_ask_crux` | PASS | — |
| TC-CRX-133 | Top-menu "Crux" entry opens the dashboard | PASS | — |
| TC-CRX-134 | Top-menu "Agents" entry is hidden by default | PASS | — |
| TC-CRX-135 | Project-level "Crux" tab appears per-project, gated by `view_crux` | PASS | — |
| TC-CRX-136 | `approve_crux_gates` on the GLOBAL dashboard does not actually require it | PASS (counted) | BUG-CRX-003 (closed) |
| TC-CRX-137 | `use_ask_crux` does not require project membership | PASS, no data leak | BUG-CRX-004 (infra bug, closed) |
| TC-CRX-138 | `manage_crux_agents`/`manage_crux_pipelines` are global permissions | PASS | — |
| TC-CRX-139 | Admin-only Crux pages are Administrator-gated regardless of role | PASS | — |
| TC-CRX-140 | Crux settings page (core URL) reachable outside Administration | PASS | — |
| TC-CRX-141 | A user with no Crux permissions sees no Ask Crux bubble/wand | PASS | — |
| TC-CRX-142 | Bubble/wand/mention-poll/WP badge visibility, consistent across surfaces | PASS | — |
| TC-CRX-143 | `crux_ask`'s page action and JSON actions fail differently when unauth | PASS | — |
| TC-CRX-144 | `crux/gate_evidence` requires the same check as `approve_gate` | PASS | — |

### Suite: `CRUX_PER_USER_KEY_CRX12.md` (Feature #4 — 6 TCs)

| TC ID | Title | Result | Defect(s) |
|---|---|---|---|
| TC-CRX-145 | `CRUX_REQUIRE_USER_KEY=1` refuses a request with no per-user key | PASS | — |
| TC-CRX-146 | A restricted user's own key is honored; Redmine enforces the ceiling | PASS | — |
| TC-CRX-147 | Admin key still works normally under `CRUX_REQUIRE_USER_KEY=1` | PASS | — |
| TC-CRX-148 | `CRUX_REQUIRE_USER_KEY=0` (default) — shared key still used | PASS | — |
| TC-CRX-149 | Write attribution reflects the real acting user, not the shared account | PASS | — |
| TC-CRX-150 | Toggling the env var mid-session does not silently downgrade enforcement | PASS, no gap found | — |

### Suite: `CRUX_PROJECT_CREATION_AND_IMPROVE_WAND.md` (Features #5, #6, #7 — 10 TCs)

| TC ID | Title | Result | Defect(s) |
|---|---|---|---|
| TC-CRX-151 | "@crux create a project for X" produces a confirm card and a real project | PASS | — |
| TC-CRX-152 | A user without project-creation permission cannot create via chat either | PASS | — |
| TC-CRX-153 | Increment-2 gaps are confirmed NOT built — not a bug | PASS | — |
| TC-CRX-154 | Improve the description — suggest, preview, apply | PASS | — |
| TC-CRX-155 | Improve — work breakdown (subtasks), only selected ones created | PASS | — |
| TC-CRX-156 | Improve write is replay-safe and retryable on failure | PASS | — |
| TC-CRX-157 | Cancel on the Improve preview writes nothing | PASS | — |
| TC-CRX-158 | Known-fixed bug class — re-verify honest failure reporting | FAIL | BUG-CRX-009 (closed) |
| TC-CRX-159 | No feedback (thumbs up/down) control exists yet | FAIL (doc staleness, not a product defect) | — |
| TC-CRX-160 | A user without edit permission on the issue cannot Apply Improve | PASS | BUG-CRX-009 (referenced, closed) |

### Suite: `CRUX_WRITE_CONFIRM_GATE.md` (Features #2, #3, #19, #21 — 10 TCs)

| TC ID | Title | Result | Defect(s) |
|---|---|---|---|
| TC-CRX-161 | A proposed write never executes until Confirm is clicked | PASS | — |
| TC-CRX-162 | Cancel discards the proposal — nothing is written | PASS | — |
| TC-CRX-163 | A write executes exactly once, even if Confirm is clicked twice | PASS (UI + server-side) | — |
| TC-CRX-164 | Suggest-only Work Package can never write ("sacred rule") | **CRITICAL-FAIL** | BUG-CRX-008 (Critical, closed) |
| TC-CRX-165 | Gate approval requires project membership | FAIL (upgrades BUG-CRX-003) | BUG-CRX-003 (closed) |
| TC-CRX-166 | Gate approval is always attributable | PASS | — |
| TC-CRX-167 | Frozen rules block a specific write even when gate-approved | PASS | — |
| TC-CRX-168 | A write's failure (403/404/409/422) is reported honestly | PASS | — |
| TC-CRX-169 | Regression — confirm-fabrication guard is case-insensitive | PASS (forced reproduction) | — |
| TC-CRX-170 | Regression — confirm-fabrication guard catches trailing commentary | PASS (forced reproduction) | — |

### Suite: `CRUX_AGENT_ROSTER_ADMIN.md` (Features #14–18 — 13 TCs)

| TC ID | Title | Result | Defect(s) |
|---|---|---|---|
| TC-CRX-064 | Agent roster lists bundled + customer agents | PASS | — |
| TC-CRX-065 | Pause and resume an agent | PASS (Expected Result corrected against contract) | BUG-CRX-005 (referenced pattern, closed) |
| TC-CRX-066 | A user without `manage_crux_agents` cannot pause/create/retire/upload | PASS, both legs | — |
| TC-CRX-067 | Provision a real Redmine identity for an agent (CRX-48) | PASS, all 3 sub-cases | — |
| TC-CRX-068 | Add an LLM provider key and verify it with the live credential test | PASS on add/verify; "Test connection" itself FAIL | BUG-CRX-001 (High, closed) |
| TC-CRX-069 | Keys are always masked in the UI/API | PASS | — |
| TC-CRX-070 | Delete a provider key | PASS | — |
| TC-CRX-071 | Structured log viewer filters correctly | PASS on filtering; separate bug found | BUG-CRX-006 (Medium, closed) |
| TC-CRX-072 | Set the core service URL from the Crux nav rail | PASS, caught a real misconfig (not filed) | — |
| TC-CRX-073 | Non-admin cannot reach providers & keys, logs, or settings pages | PASS (cross-referenced) | — |
| TC-CRX-074 | Invalid/expired provider key fails its live test honestly | PASS (positive counterpart to BUG-CRX-001) | — |
| TC-CRX-075 | Retire an agent — one-way, permanent, locks paired Redmine user | PASS, all 4 sub-checks | — |
| TC-CRX-076 | Upload a customer-authored agent definition (CRX-23) | PASS, all 3 sub-checks | — |

---

## Part 3 — Summary Statistics

| Metric | Count |
|---|---|
| Total test cases | 176 |
| PASS (incl. qualified/partial-PASS) | ~151 |
| FAIL (incl. Critical-FAIL) | ~20 |
| BLOCKED (environment/precondition, not a defect) | 11 |
| RETIRED — out of scope (not counted as executed or pending) | 2 (TC-116, 117) |
| INCONCLUSIVE | 2 |
| Total defects traced from these TCs | 46 (40 closed, 6 open) |
| Critical-severity defects found via this matrix | 3 (BUG-CRX-008, 011, 012 — all closed) |

**2026-10-01 update:** TC-CRX-032, 033, 063 (the three remaining permission-probe gaps) executed live as `luna.blossom` — all 3 PASS, all honest permission-layer refusals (DevOps `view` permission, Budget `manage_approved_hours`, QA Agent `view_test_suite`), no new bugs found. This closes out the "never executed" category entirely — the only items left outside a definitive PASS/FAIL/BLOCKED verdict are TC-116/117 (legitimately retired, not a gap) and the TC-101 documentation inconsistency below.

**Open items requiring follow-up** (beyond the 6 open bugs tracked in `CRUX_TEST_PLAN.md` §8.3):
- TC-CRX-101's own file text contains a self-contradictory Result line (says "NOT YET EXECUTED" directly above a paragraph describing full live execution) — needs a documentation fix in `CRUX_AGENT_WORKLOAD_CAPACITY.md` itself, independent of the matrix.

## References

- [`CRUX_TEST_PLAN.md`](CRUX_TEST_PLAN.md)
- [`CRUX_FEATURES_LIST.md`](CRUX_FEATURES_LIST.md)
- [`bugs/_index.md`](../bugs/_index.md)
- `testcases/CRUX_*.md` (16 source files)
