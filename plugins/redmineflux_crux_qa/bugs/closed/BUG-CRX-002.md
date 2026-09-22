# Bug Report

- Bug ID: BUG-CRX-002
- Production Redmine Issue ID: #120515 (ztflux, flux.zehntech.com — reported 2026-09-11, linked to testcase #120489 in run #569 "Crux QA Run 1")
- Title: 6 of 9 bundled agents' chat-picker persona descriptions falsely claim read-only behavior, contradicting their real CRUD tool access (#117162)
- Redmine version: 7.0.0 (local Docker, `crux-redmine`)
- Plugin name: redmineflux_crux (Crux settings page, "Chat agents" picker)
- Plugin version: crux-core 0.92.0 / plugin 0.39.0
- Environment: Local — `http://localhost:3014/crux/admin/settings`
- Browser: Chromium (Playwright MCP)
- User role: Administrator
- Date: 2026-09-11

## Steps to reproduce

1. Log in as Administrator.
2. Navigate: Crux (top menu) → Settings → "Chat agents" section.
3. Read each of the 9 #117162-scoped agents' persona description text shown next to its checkbox.
4. Compare against that same agent's real `allowed_tools:` list in `redmineflux-crux-core/agents/*.md`.

## Expected result

- A persona description shown to admins choosing which agents appear in the chat switcher should accurately reflect what the agent can actually do — especially whether it can write, since that's safety-relevant information for whoever enables it.

## Actual result

6 of the 9 agents' descriptions explicitly claim read-only/never-writes behavior that is false per their actual tool manifests (confirmed by reading each `agents/*.md` file in full earlier this session) and per the dev's own 2026-09-10/11 live verification sweep (`REPLY-TO-QA-2026-09-11.md`, which specifically confirmed all 9 agents' CRUD is shipped and tested end-to-end, including Timesheet's `approve`):

| Agent | UI persona text (as shown) | Contradicted by |
|---|---|---|
| DevOps Agent | "reads build and repo state, **never triggers a build**" | Has `trigger_build`; dev's sweep didn't test this one but the tool is present |
| Budget Agent | "reports spend vs cap, **never sets a new one**" | Has `set_budget` |
| Scrum Agent | "reads the board and backlog, **never moves a card**" | Has `move_issue`, `update_card`, `create_sprint`, `delete_sprint`, etc. |
| Time Agent | "reports hours and approval status, **never approves one**" | Has `approve`/`reject`/`submit`/`withdraw`; dev's own sweep specifically exercised `approve` (refused only for a self-approval business rule, not because the agent can't approve) |
| Invoicing Agent | "reports invoices and rates, **never sends one**" | Has `send_invoice`, `generate_invoice`; dev's sweep tested `create_invoice` |
| Capacity Agent | "reports allocation, **never reassigns it — a human decides**" | Has `add_issue`, `allocation_resize`, `allocation_update_dates`, etc.; dev's sweep tested `workload_create` |

The remaining 3 (Sales Agent, KB Agent, QA Agent) do not have this problem — QA Agent's text ("manages testcases, suites, runs, and results end-to-end — creates, updates, and executes on request") correctly reflects full CRUD; Sales/KB Agent's text is neutral and doesn't make a false claim either way.

This looks like leftover copy from before the #117162 CRUD work landed on these 6 agents, never updated to match.

## Expected result vs. impact

- **Impact:** an admin deciding which agents to expose in the chat switcher is actively misled about 6 agents' write capability — could reasonably enable "DevOps Agent" believing it's safely read-only, not realizing it can actually propose a real `trigger_build` (still gated by human confirm, but the persona text implies the capability doesn't exist at all, which is a trust/expectations problem independent of the confirm-gate safety net).

## Evidence

### Screenshot

N/A — not yet captured; this was found reading the accessibility snapshot during TC-CRX-072 (Crux settings page) execution. Capture a screenshot of the "Chat agents" section on retest/regression.

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-CRX-002/retest-yyyy-mm-dd-pass.png)

### Console / log

Playwright accessibility snapshot of `http://localhost:3014/crux/admin/settings`, "Chat agents" section, captured 2026-09-11 — relevant checkbox labels quoted verbatim:

```
"DevOps Agent reads build and repo state, never triggers a build"
"Budget Agent reports spend vs cap, never sets a new one"
"Scrum Agent reads the board and backlog, never moves a card"
"Time Agent reports hours and approval status, never approves one"
"Invoicing Agent reports invoices and rates, never sends one"
"Capacity Agent reports allocation, never reassigns it — a human decides"
"QA Agent manages testcases, suites, runs, and results end-to-end — creates, updates, and executes on request"
```

Cross-referenced against `redmineflux-crux-core/agents/devops.md`, `budget-audit.md`, `agile-scrum.md`, `timesheet.md`, `invoice-billing.md`, `workload-capacity.md` (each read in full this session) — all 6 have real write tools in `allowed_tools:` contradicting their own displayed persona text.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## 2026-09-16 retest — FIXED, confirmed live

Dev's `CHANGES.md` handoff updated `db.seed.json`/`db.seed.production.json`'s `persona` field for all 6 affected agents, replacing the false "never..." claims with accurate capability descriptions:

| Agent | New persona text |
|---|---|
| Capacity Agent | "reports allocation, and reassigns, resizes, or splits it on request" |
| DevOps Agent | "reads build and repo state, and can trigger a build on request" |
| Budget Agent | "reports spend vs cap, and can set a new one on request" |
| Scrum Agent | "reads the board and backlog, and moves cards or manages sprints on request" |
| Time Agent | "reports hours and approval status, and can approve or reject one on request" |
| Invoicing Agent | "reports invoices and rates, and can send one on request" |

**Retest:** Already live-confirmed via the real `/crux/admin/settings` "Chat agents" section (visited earlier this same session for BUG-CRX-005 verification) — the rendered checkbox labels matched this corrected text exactly, no false "never" claims remaining for any of the 6 agents.

**Verdict: FIXED.**

## Notes

- Reported to production 2026-09-11 as issue **#120515** in `ztflux`, via `redmineflux_testcases_management_report_defect` (user approval obtained). Linked to testcase #120489, Run #569 "Crux QA Run 1", Environment "Window 11 + Chrome". Testcase #120489 marked Failed in the run.
- Suggested fix direction (not prescriptive): update each of the 6 agents' `description:` front-matter (or wherever this UI text is sourced from — likely `db.seed.production.json` or the agent registry, not necessarily the `agents/*.md` files themselves) to reflect real CRUD capability, consistent with QA Agent's already-correct text.
