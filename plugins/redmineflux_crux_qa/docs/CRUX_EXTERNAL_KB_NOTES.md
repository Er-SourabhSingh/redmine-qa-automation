# External Knowledge Base Cross-Reference — Redmineflux Crux

> Source: https://www.redmineflux.com/knowledge-base/plugins/ (fetched 2026-09-16). This is the
> **official public documentation for the underlying Redmineflux plugins** Crux's 9 domain agents
> act against — a different, external source of truth from this repo's own `CRUX_REQUIREMENTS.md`
> (which documents Crux's own behavior). Used here to find domain-plugin business rules,
> constraints, and edge cases that a Crux domain agent must respect but that this suite's existing
> TCs may not yet exercise.
>
> **Gap in public docs:** the redmineflux.com KB index lists 19 plugins + 3 themes total but has
> **no page at all for DevOps or Budget/Audit** (2 of the 9 #117162-scoped domain agents). Those
> two agents' edge cases can only be sourced from `CLAUDE.md`/this repo's own docs and the agent
> manifest files themselves — flagged per-agent below.

---

## How to read this file

For each of the 9 domain plugins: the KB's own documented rules, then **Crux cross-reference** —
whether the corresponding domain agent's `allowed_tools` (in
`redmineflux-crux-core/agents/<id>.md`) can even exercise that rule, and whether this suite's
existing `testcases/CRUX_AGENT_*.md` file already covers it. A "**GAP**" marker means: real
documented behavior, tool exists to exercise it, but no existing TC does — a genuine candidate for
a new testcase to be drafted (directly in the main session, not via a subagent).

---

## 1. Timesheet (`redmineflux_timesheet_*` — Time Agent, `timesheet.md`)

**KB-documented rules:**
- Two permissions: `View Timesheet` (own only) vs `Manage Timesheet` (others', team-scoped, subject to approval schema rules).
- **"Each team member must have a role that exists in the selected approval schema"** — a member without a schema-matching role can't be part of the approval flow at all.
- **Strict sequential approval**: "Higher-level approver cannot act before lower-level decision", "No approval level can be skipped".
- **Self-approval edge case**: "If submitter is final-level approver, only admin can complete approval/rejection" — i.e. a submitter who is also the last approver is blocked from self-approving; only admin can close the loop.
- Withdrawal only permitted "before minimum approval level is approved".
- `Disable Log/Edit After Approval` setting: once on, "users cannot add or edit entries after approval."
- `Auto-Approve Threshold`: timesheets below a configured hour count bypass manual review entirely.

**Crux cross-reference:**
- Time Agent has `approve`/`reject`/`submit`/`withdraw` tools — can exercise all of the above.
- Existing `CRUX_AGENT_TIMESHEET.md` suite tests submit/approve/reject at a basic level but has **no TC for the sequential-approval-order constraint**, **no TC for the self-approval-blocked-for-final-approver edge case** (this is the exact scenario the dev's own 2026-09-11 sweep specifically exercised per `CRUX_HANDOFF.md` — "timesheet's `approve` correctly refused a self-approval" — worth a real TC, not just a changelog mention), **no TC for withdrawal-after-minimum-approval-refused**, **no TC for `Disable Log/Edit After Approval` blocking a chat-driven edit attempt**, **no TC for the Auto-Approve threshold bypassing the Time Agent's own `approve` proposal** (does the agent even detect/mention an already-auto-approved timesheet correctly, or does a stale "pending" claim surface?). **GAP × 5.**

---

## 2. Workload (`redmineflux_workload_*` — Capacity Agent, `workload-capacity.md`)

**KB-documented rules:**
- Core gateway permission `Manage teams and skills` for most admin actions; separate per-team grants `manage workload` / `can approve leave`.
- **"Each user can be added only once to the same team"** — duplicate-add should be rejected.
- **Holiday scheme activation is exclusive**: "Activating a new scheme deactivates the previous active" one; "holidays in inactive schemes are not used for capacity calculations."
- `Allow Workload Overload` toggle: when disabled, "planned hours must stay within available capacity" — an allocation attempt exceeding capacity should be refused/blocked.
- Weekends always excluded from capacity math, regardless of settings.
- Dashboard is "available to administrators" only.

**Crux cross-reference:**
- Capacity Agent has `member_add`, `holiday_scheme_activate`, `allocation_resize`/`update_planned_hours`, `dashboard` tools — can exercise all of the above.
- Existing `CRUX_AGENT_WORKLOAD_CAPACITY.md` already covers a lot (allocation resize is where BUG-CRX-018 was found, leave-create is where BUG-CRX-019 was found), but has **no TC for the duplicate-team-membership rejection via chat**, **no TC for holiday-scheme-activation's exclusivity (does the agent warn the user a different scheme is about to be silently deactivated, or propose it silently?)**, **no TC for the overload-disabled refusal path when the Capacity Agent proposes an allocation that would exceed capacity**, and **no TC for a non-admin user asking the Capacity Agent for the dashboard view specifically** (admin-only per KB — does the agent honestly refuse, or proxy through with elevated access the same class of gap as BUG-CRX-012?). **GAP × 4**, with the last one flagged **High** — it's the same permission-bypass defect class already found twice this session (BUG-CRX-003/BUG-CRX-012).

---

## 3. CRM (`redmineflux_crm_*` — Sales Agent, `crm-sales.md`)

**KB-documented rules:**
- `Manage Contacts/Companies/Deals/Leads` do **not** include delete — `Delete CRM Data` is a separate permission.
- **Activity deletion rule**: "Users can delete only activities they authored; administrators bypass this restriction."
- Deal currency immutable after creation; Won/Lost stages can't be removed from config; **Won/Lost deals can't be moved via drag-drop** (UI-specific, N/A to chat).
- Lost Reason mandatory when a deal moves to Lost stage.
- Probability 0–100, drives forecasted value.
- Converted-lead deletion prohibited; Converted status is system-reserved, can't be set manually.
- Privacy: non-admins see public records + own private + assigned private only.

**Crux cross-reference:**
- Sales Agent has `delete_activity`, `update_deal`(stage/Lost), `delete_lead`, `create_lead`(status) tools — can exercise all of the above.
- Existing `CRUX_AGENT_CRM_SALES.md` covers deal-stage-update self-contradiction (BUG-CRX-013) and link-contact-to-deal (BUG-CRX-015), but has **no TC for the activity-deletion-authorship rule** (does the Sales Agent correctly refuse when a non-admin user asks it to delete someone *else's* logged activity — real Redmine-layer refusal, or does it fabricate success?), **no TC for a Lost-stage update missing a Lost Reason** (does the agent ask for one, or does the update silently fail/succeed with a blank reason?), **no TC for attempting to set `status: Converted` directly on a lead via chat** (system-reserved — should be refused), **no TC for the CRM privacy visibility rule from a non-admin's chat session** (can a restricted user ask the Sales Agent about a private deal/contact they're not the creator/assignee of, and does it honestly refuse or leak it — same defect class as BUG-CRX-012 again). **GAP × 4**, privacy one flagged **High**.

---

## 4. Invoice (`redmineflux_invoice_*` — Invoicing Agent, `invoice-billing.md`)

**KB-documented rules:**
- Three permissions: `view_invoices` (project), `manage_invoices` (project, full CRUD), `manage_customers` (global).
- **"Only invoices in Draft status are editable"** — one-way lifecycle Draft → Sent → Paid → Cancelled; editing locked after Sent.
- One customer per project; a project-linked customer can't be deleted without unlinking first.
- Rate fallback chain: user rate → project rate → manual override (zero default).
- Stripe webhook can auto-record payments; manual recording otherwise.

**Crux cross-reference:**
- Invoicing Agent has `update_invoice`, `delete_customer`, `set_team_rate` tools — can exercise all of the above.
- Existing `CRUX_AGENT_INVOICE_BILLING.md` covers set_team_rate + wrong-project-ID (BUG-CRX-021), but has **no TC for attempting to `update_invoice` on an already-Sent invoice via chat** (does the Invoicing Agent honestly refuse the edit, citing the Draft-only rule, or does it fabricate/attempt an update Redmine's own layer then rejects silently?), **no TC for deleting a customer still linked to a project** (should be refused), **no TC for the rate-fallback chain being correctly reflected when the agent reports "what rate applies to X"** — does it cite the real resolved rate (user → project → 0) or just the raw team-rate row. **GAP × 3.**

---

## 5. Knowledge Base (`redmineflux_kb_*` — KB Agent, `knowledge-base.md`)

**KB-documented rules:**
- Three permissions: `view_knowledgebase`, `manage_knowledgebase_spaces`, `manage_knowledgebase_pages`.
- **Draft visibility**: a first-version draft is visible only to its author + users with `manage_knowledgebase_pages` — NOT to a plain `view_knowledgebase` user.
- **Structural rule**: "Folders cannot have page-type nodes as parents. Pages cannot contain children."
- Sub-projects inherit parent project spaces as **read-only**.
- One knowledge base per project.

**Crux cross-reference:**
- KB Agent has `create_node`(draft), `get_node`, `create_space` tools — can exercise all of the above.
- Existing `CRUX_CHAT_CAPABILITIES_KEEP_SHARE_ARTIFACTS.md`/other suites don't specifically target KB Agent structural rules. **No TC for a plain `view_knowledgebase` (no manage_pages) user asking the KB Agent to read a page that's still in first-draft state** — this is a direct privacy-boundary test, same shape as the CRM/Workload ones above, and the KB doc is explicit that this should be refused. **No TC for attempting `create_node` with an invalid parent (a page node as the new node's parent)** — should be refused by the plugin's own structural constraint; does the KB Agent surface a real error or fabricate acceptance? **GAP × 2**, the draft-visibility one flagged **High** (same permission-bypass class as above).

---

## 6. Testcase Management (`redmineflux_testcases_management_*` — QA Agent, `testcases-qa.md`)

**KB-documented rules:**
- Granular permissions per action (Create/Edit/Delete Test Suite, Create/Edit/Delete/Close Run, Execute Testcase, Create/Edit/Delete/View Report, Add/Edit/Delete Requirement).
- **Test cases are scoped to their suite immutably** — "test cases created within a suite remain scoped to that suite; they cannot appear outside it," and "test case scope is immutable once assigned to a suite."
- **Defect reporting only available for Failed or Blocked** statuses.
- Removing cases from a suite fails if the suite is linked to an active run.
- Deleting a test suite is irreversible.

**Crux cross-reference:**
- QA Agent has `report_defect`, `remove_testcases_from_suite`, `delete_test_suite` tools — can exercise all of the above. This suite is also this session's most heavily-used redmineflux MCP surface (Run #569 sync).
- Existing `CRUX_AGENT_QA_TESTCASES.md` was largely blocked by BUG-CRX-020 this cycle so has thin coverage. **No TC for `report_defect` attempted against a Passed testcase** (KB says defect reporting is Failed/Blocked-only — does the QA Agent refuse or does the underlying tool silently accept a status mismatch?), **no TC for `remove_testcases_from_suite` when that suite is linked to an active run** (should fail per KB), **no TC for attempting to move/copy a test case "outside" its suite via chat in a way that violates the immutable-scope rule.** **GAP × 3.**

---

## 7. Agile Board (`redmineflux_agile_*` — Scrum Agent, `agile-scrum.md`)

**KB-documented rules:**
- "Issue movement still follows normal Redmine permissions and workflow transitions" — a `move_issue`/`update_card` attempt is still gated by real Redmine workflow rules, not just Agile's own.
- **Workflow validation blocks invalid transitions** during drag-drop (chat equivalent: an invalid status move should be refused, not silently coerced).
- Story Points hidden entirely if disabled at plugin level — a question about story points on a plugin instance with them disabled should get an honest "not enabled" answer, not a fabricated number.
- My Page board only shows issues assigned to the logged-in user.

**Crux cross-reference:**
- Scrum Agent has `move_issue`/`update_card`, `create_issue` tools — can exercise all of the above. This is the agent most affected by BUG-CRX-020 (fabricated-confirm) this cycle.
- Existing `CRUX_AGENT_AGILE_SCRUM.md` is mostly re-testable once BUG-CRX-020's fix is confirmed (it now is, per this session's retest). **No TC for an invalid workflow-transition move attempted via chat** (does the Scrum Agent honestly surface Redmine's real workflow-transition refusal, or does it claim success?), **no TC asking about Story Points on this instance** (need to confirm whether Story Points are actually enabled/disabled here first, then test the honest-disabled-answer path). **GAP × 2.**

---

## 8. DevOps (`redmineflux_devops_*` — DevOps Agent, `devops.md`) — no public KB page

No redmineflux.com KB page exists for this plugin (confirmed via the full 19-plugin index fetch, 2026-09-16). Edge cases can only be sourced internally:
- `trigger_build` is explicitly called out in the agent's own manifest as needing "the specific repo/branch to build — never speculatively." **No TC exists for a vague trigger request ("kick off a build") being refused/clarified rather than guessed at** — worth drafting directly from the manifest's own stated rule, KB-independent.
- `CRUX_AGENT_DEVOPS_AND_BUDGET.md`'s TC-CRX-024 (a real build trigger) remains BLOCKED pending a dev-provided safe test repo — still true, not resolved by this pass.

## 9. Budget & Audit (`redmineflux_budget_audit_*` — Budget Agent, `budget-audit.md`) — no public KB page

No redmineflux.com KB page exists for this plugin either. From the agent's own manifest:
- `set_budget` "Only propose it with the exact project/scope and amount the user named — never round or estimate." **No TC exists for a vague budget-setting request (no exact amount named) being refused/clarified rather than the agent guessing/rounding a figure** — draftable directly from the manifest.

---

## Summary table

| Domain agent | KB page found? | New GAP TCs identified | Flagged High (permission-bypass class) |
|---|---|---|---|
| Time Agent (Timesheet) | Yes | 5 | — |
| Capacity Agent (Workload) | Yes | 4 | 1 (dashboard admin-only) |
| Sales Agent (CRM) | Yes | 4 | 1 (privacy visibility) |
| Invoicing Agent (Invoice) | Yes | 3 | — |
| KB Agent (Knowledge Base) | Yes | 2 | 1 (draft visibility) |
| QA Agent (Testcase Mgmt) | Yes | 3 | — |
| Scrum Agent (Agile) | Yes | 2 | — |
| DevOps Agent | No (no public page) | 1 | — |
| Budget Agent | No (no public page) | 1 | — |
| **Total** | 7/9 | **25** | **3** |

These 25 candidate TCs, plus the live per-domain-agent permission matrix (see
`CRUX_AGENT_PERMISSION_MATRIX.md`, being built alongside this), are the input for
`testcase-gap-writer` to draft into the existing `testcases/CRUX_AGENT_*.md` suite files.
