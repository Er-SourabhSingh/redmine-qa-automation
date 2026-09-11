# Test Cases — Redmineflux Crux — DevOps Agent & Budget Agent (#117162)

> Source: `redmineflux-crux-core/agents/devops.md`, `agents/budget-audit.md` (both full files); `docs/CRUX_FEATURES_LIST.md` per-agent table.
>
> **Execution readiness: BLOCKED — infrastructure, not just the LLM key.** Per dev reply (`REPLY-TO-QA-2026-09-11.md` §5, 2026-09-11): **neither DevOps nor Budget/Audit is actually installed on this MCP instance.** MCP startup log shows 12/14 plugins detected — DevOps needs a connected git repo it doesn't have here, and Budget/Audit isn't detected at all. There is no live tool surface to test against, seed data or no seed data. Dev has flagged this as a **separate infrastructure task** (connect a real repo for DevOps; install/configure Budget/Audit) that must happen before this entire suite is runnable — do not attempt to execute any TC below until that's done, and don't file a "plugin not reachable" result as a product bug against #117162 — it's a known, dev-acknowledged environment gap.
>
> **Note on scope:** unlike the other 7 agents, DevOps and Budget/Audit each have exactly ONE write action (`trigger_build`, `set_budget` respectively) — no create/update/delete exists in their domain, by design. Do not file the absence of CRUD for these two as a gap against #117162; the ticket's own acceptance criteria says "at least one real record type" per agent, and a single write action satisfies that for these two.
>
> **Also still pending from dev** for TC-CRX-102 specifically (`trigger_build` — real CI effect): a confirmed safe test repository/branch. Do not improvise one.

## Plugin
- Name: redmineflux_crux (DevOps Agent + Budget Agent)
- Version: crux-core 0.92.0
- Redmine version: 7.0.0 (local Docker)
- Path: plugins/redmineflux_crux_qa

---

## Positive Cases — DevOps Agent

---

### TC-CRX-101: DevOps read surface — project summary, repos, commits, PRs, builds

**User Role:** Logged-in user with `use_ask_crux` and DevOps plugin access.
**Precondition:** DevOps plugin installed with real repos/builds.

**Steps:**
1. "How's the pipeline doing?" (project summary).
2. "What repositories are tracked?"
3. "Any open PRs on [repo]?"
4. "What's the build status on [repo]?" then "show me build #[N]'s detail."
5. "What builds ran against issue #[N]?"

**Expected Result:**
- Each grounded in a real tool call, citing the real repo/build/PR — never a remembered status.

---

### TC-CRX-102: Trigger a build — real infrastructure effect, confirm-gated

**User Role:** Same as TC-CRX-101.
**Precondition:** A real, named repo/branch the tester is authorized to build.

**Steps:**
1. "Trigger a build for [repo] on branch [branch]."
2. Review the confirm card — verify it names the exact repo/branch.
3. Confirm.
4. Independently verify a real CI run actually started.

**Expected Result:**
- No build starts before Confirm (step 2/3 gap). After Confirm, a genuine CI run starts — verified independently, not just trusted from the chat reply. This has real infrastructure cost/effect — be deliberate about which repo/branch is used for this test.

---

### TC-CRX-103: A vague/speculative build request does NOT produce a trigger proposal

**User Role:** Same as TC-CRX-101.
**Precondition:** None.

**Steps:**
1. Ask a general status question that could be read as implying a build should happen, without naming a specific repo/branch, e.g. "should we build the latest changes?"

**Expected Result:**
- No `trigger_build` proposal is generated — the spec explicitly says "never speculatively, and never as a side effect of a status question." The agent should ask for the specific repo/branch instead.

---

## Positive Cases — Budget Agent

---

### TC-CRX-104: Budget read surface — status, approved-hours audit

**User Role:** Logged-in user with `use_ask_crux` and Budget/Audit plugin access.
**Precondition:** Budget/Audit plugin installed with a real budget cap and approved hours.

**Steps:**
1. "Are we over cap on project [X]?"
2. "What hours were approved this week?"
3. "Show me approval #[N]'s detail."

**Expected Result:**
- Each grounded in a real tool call, citing the real project/figures — never a remembered or estimated number.

---

### TC-CRX-105: Set a budget cap with the exact project/scope and amount

**User Role:** Same as TC-CRX-104.
**Precondition:** A named test project.

**Steps:**
1. "Set the budget cap on project [X] to $[amount]."
2. Review the confirm card for the exact project and amount (no rounding).
3. Confirm.
4. Verify the cap actually changed.

**Expected Result:**
- The confirm card and the resulting cap match exactly what was asked — no rounded/estimated figure at any point.

---

## Negative Cases

---

### TC-CRX-106: Budget Agent never claims a cap changed before confirmation

**User Role:** Same as TC-CRX-104.
**Precondition:** None.

**Steps:**
1. Trigger a `set_budget` proposal.
2. Before confirming, ask "did that budget change go through?"

**Expected Result:**
- The agent correctly reports the change is still pending confirmation, not already applied — per its own explicit "must never" rule.

---

### TC-CRX-107: Unreachable DevOps/Budget plugin tools reported honestly

**User Role:** Same as TC-CRX-101/104.
**Precondition:** Simulate or identify a scenario where the relevant plugin's tools are unreachable, if feasible.

**Steps:**
1. Ask a DevOps or Budget question under that condition.

**Expected Result:**
- Plain statement that the plugin's tools aren't reachable — never an answer from guesswork.

---

## Evidence Map

- Case IDs: TC-CRX-101 through TC-CRX-107
- Screenshots: bugs only.
- Log: —
- Bug reference: —
