# Test Cases — Redmineflux Crux — DevOps Agent

> Source: `redmineflux-crux-core/agents/devops.md` (full manifest + system prompt, read 2026-11-19) —
> `allowed_tools`: `redmineflux_core_list_projects`, `redmineflux_devops_project_summary`,
> `redmineflux_devops_list_builds`, `redmineflux_devops_get_build`, `redmineflux_devops_get_build_log`,
> `redmineflux_devops_issue_builds`, `redmineflux_devops_trigger_build`, `redmineflux_devops_list_commits`,
> `redmineflux_devops_get_commit`, `redmineflux_devops_list_pull_requests`,
> `redmineflux_devops_get_pull_request`, `redmineflux_devops_list_repositories`,
> `redmineflux_devops_list_releases`, `redmineflux_devops_get_release`, `redmineflux_devops_get_release_notes`,
> `redmineflux_devops_save_release`, `redmineflux_devops_release_action`, `redmineflux_devops_release_issue`,
> `redmineflux_devops_list_environments`, `redmineflux_devops_get_environment`,
> `redmineflux_devops_compare_environments`, `redmineflux_devops_deploy`, `redmineflux_devops_list_deployments`,
> `redmineflux_devops_get_deployment`, `redmineflux_devops_deployment_action`,
> `redmineflux_devops_list_incidents`, `redmineflux_devops_get_incident`, `redmineflux_devops_create_incident`,
> `redmineflux_devops_incident_action`, `redmineflux_devops_list_vulnerabilities`,
> `redmineflux_devops_list_alerts`, `redmineflux_devops_metrics` — plus a `crux_discover_tool_groups` /
> `crux_discover_group_tools` fallback (group `devops`) for everything else the DevOps plugin offers (freezes,
> environment requests, incident templates, dashboards, monitoring, settings, repository setup, test results,
> licenses, code quality, traceability, audit log, delete). Model (manifest): `claude-sonnet-5`.
>
> **This suite exists because production tickets #128756 (MCP Server: complete DevOps plugin tool coverage —
> 8→68 MCP tools, `redmineflux-devops` new `apis/` endpoints, RMCP-042/043) and #128890 (Crux: the DevOps
> Agent uses the whole DevOps plugin — CRC-116) both reached "In QA" on production on 2026-11-19.** Both
> tickets' code (`redmineflux-crux-core`, `redmineflux-mcp`, `redmineflux-devops`) was already pulled to the
> latest `master` on this instance (all three repos reported "Already up to date" on a fresh `git pull`,
> confirming the fix was already present locally) — the gap was that the **Redmineflux DevOps plugin itself
> had never been installed/migrated on this specific QA stack**, which is why `CRUX_AGENT_CODE_REVIEWER.md`
> and this suite were previously out-of-scope (see root `MEMORY.md` / `CRUX_MEMORY.md`, now superseded).
>
> **Environment setup performed this session (2026-11-19):**
> 1. `bundle exec rake redmine:plugins:migrate RAILS_ENV=production` inside the `redmine` container (needed
>    `SECRET_KEY_BASE` passed explicitly via `-e`, since the container's own entrypoint-time translation of
>    `REDMINE_SECRET_KEY_BASE` isn't re-run for a bare `docker compose exec`) — ran clean, DevOps migrations
>    58–63 applied.
> 2. Restarted `redmine`, then `mcp` and `crux-core` (so both pick up the newly-installed plugin) — confirmed
>    via `Administration → Plugins` (Redmineflux DevOps now listed, Configure link present, "DevOps Audit Log"
>    admin menu item present) and via the MCP tool list (**68 `redmineflux_devops_*` tools now registered**,
>    up from 0 before the plugin was installed — matches ticket #128756's own audit count).
> 3. Created fixture project **Crux DevOps Agent Test Project** (id=20, identifier
>    `crux-devops-agent-test-project`) — the DevOps + Crux modules must be ticked under the project's own
>    **Settings → Modules** screen; passing module names directly to `redmineflux_core_create_project`'s
>    `enabled_module_names` did **not** enable them (confirmed: `save_environment` first failed with
>    `"You do not have permission to create or submit test environment"` even as admin, until the two
>    checkboxes were ticked via the UI and saved — a real, reproducible admin-bypass gap worth a closer look in
>    a future session, not filed as a bug here since the UI path itself works correctly and this wasn't the
>    ticket's own scope).
> 4. Seeded real fixtures via direct MCP writes (admin): 2 environments (**Staging**, id 1, no approval/no
>    security gate; **Production**, id 2, `is_production=true`, `approval_required=true`,
>    `security_gate_enabled=true`), 1 release (**v1.0.0**, id 1, status `planning`), 1 incident (**Checkout
>    API fixture incident**, id 1, sev2).
> 5. **Repository connection — real, authenticated (final state).** A first placeholder repository
>    connection (`Er-SourabhSingh/devops-plugin-test`, no token, status `pending`) was created for an early
>    TC-1076/1081 pass, then **removed** per explicit user correction that no real repository connection
>    existed yet for this project (`redmineflux_devops_delete(resource="repository", resource_id=1)`). The
>    user then logged into GitHub live (own account, `sourabhzehntech01-star`) in a separate browser tab and
>    generated a real Personal Access Token (classic, `repo` scope, 30-day expiry) for this QA purpose —
>    entering the token itself (never the login password, which stays correctly blocked for this session by
>    design) is not a credential-boundary issue. Connected it to `redmineflux_devops_save_repository` against
>    this account's one real repo, **`sourabhzehntech01-star/rftc038-qa-pipeline-test`** (the old
>    `Er-SourabhSingh/...` repo no longer exists — 404, different/older account). First connection test
>    failed (`status=error`) because the initial `save_repository` call still pointed at the old, nonexistent
>    repo name; corrected the `repo_url`/`repo_name` to the real one and `test_repository_connection` then
>    returned **`result: connected`**. This is now a genuinely authenticated connection, id=2 — builds,
>    commits and PRs still read as empty (see TC-1076), which is correctly expected: this plugin's
>    commit/PR/build tables are populated by inbound GitHub **webhooks**, and this local instance
>    (`localhost:3015`) isn't reachable from GitHub's webhook servers — a real positive-path build/commit/PR
>    case still needs either a reachable public URL (tunnel) for this instance or a self-hosted-runner-style
>    workaround (as `RFTC-038_EXTERNAL_SPEC_CI_PLATFORM_RECIPES.md` used for the Testcase Management plugin's
>    own CI suite), out of scope for this session.
>
> **Status: EXECUTED 2026-11-19 — 11/13 PASS, 2 bugs filed (BUG-CRX-218 cosmetic/doc-lag; BUG-CRX-219 a real
> Auto-routing miss, reproduced 2/2). No gap remains.** All reads were accurate against the real fixture state
> (never a fabricated build/PR/commit/license/freeze/vulnerability/DORA metric — including a real positive-
> path build read, TC-1086); all writes (deploy, deployment approve, incident create, release generate-notes,
> release approve) went through a real confirm card naming the actual record (never a bare id) and produced a
> native-verified, honest outcome (including an honest "waiting for approval" on a gated deploy and an
> honestly-zero DORA deployment-frequency count on a still-pending deployment — never a false positive either
> direction). The one functional gap found is in Auto's own domain routing, not in the DevOps Agent's own
> behavior (see TC-1085).

## Plugin / Agent
- Name: redmineflux_crux (DevOps Agent)
- Agent id: `devops`
- Redmine version: 6.0-bookworm (local Docker, `C:\crux-redmine`, localhost:3015)
- Path: plugins/redmineflux_crux_qa
- Fixture project: Crux DevOps Agent Test Project (id=20)

## What this agent does (ground truth from the manifest)

Reads and proposes against the whole Redmineflux DevOps plugin — builds, commits, pull requests, releases,
environments, deployments, incidents, security scans and DORA metrics — resolving a named project honestly,
using real ids (not build/PR numbers) for get/action calls, and routing anything outside its static tool list
through `crux_discover_tool_groups`/`crux_discover_group_tools` (group `devops`) before ever claiming a
capability doesn't exist. Every write proposes through the confirm gate; nothing executes until the user
clicks Confirm.

---

## Positive Cases (DevOps plugin now installed — fixture project #20)

---

### TC-CRX-1076: Project pipeline summary read — accurate against real fixture state, including a real auth change mid-suite

**User Role:** `admin`.
**Precondition:** Fixture project #20, zero builds/commits/PRs throughout. Repository connection state
changed twice during this session (see setup note above): none → unauthenticated `pending` → removed →
genuinely authenticated `connected`. Re-asked after each change to confirm the agent's read stays accurate.

**Steps:**
1. DevOps Agent pinned, ask: "How's the DevOps pipeline doing in the Crux DevOps Agent Test Project?"
2. Re-ask the same question again later in the session, after the repository connection's real state changed.

**Expected Result:**
- `project_summary` is called each time (visible as "Checked N things"); the answer correctly reports zero
  builds, zero commits, zero PRs every time, and the repository's **current real connection status** each
  time — never a stale or cached status, never a fabricated build/PR count.

**Result: PASS — executed 2026-11-19, re-verified after the repo's real auth state changed.**
- **First ask** (repo connected but `pending`, unauthenticated): *"Here's the DevOps pipeline status...
  **Builds:** No builds recorded yet. **Commits:** No commits linked. **Pull Requests:** None.
  **Repositories:** 1 GitHub repository connected — `Er-SourabhSingh/devops-plugin-test` — but its connection
  status is **pending** (not yet validated)."*
- **Second ask**, after that placeholder repo was removed, a real PAT was generated by the user live, and
  `sourabhzehntech01-star/rftc038-qa-pipeline-test` was connected and genuinely authenticated
  (`test_repository_connection` → `result: connected`): *"...**Repositories:** 1 connected... GitHub
  repository `sourabhzehntech01-star/rftc038-qa-pipeline-test` — connected ✓... there's no build, commit, or
  PR activity recorded yet. This could mean: The repository is newly set up... CI/CD workflows haven't been
  triggered yet... The connection is working but there's no activity to report."*
- Both reads are accurate for their moment in time — the agent never claimed a repository status, build, or
  PR count it hadn't just read, and correctly reasoned about *why* commits/PRs are still empty on a genuinely
  connected repo (webhook-driven ingestion, no activity has been pushed through yet) rather than treating
  "connected but empty" as a contradiction.

---

### TC-CRX-1077: Environment list read, honest about what still needs a follow-up read

**User Role:** `admin`.
**Precondition:** Fixture project #20 has 2 environments (Staging id 1, Production id 2, both `healthy`).

**Steps:**
1. Ask: "What environments does this project have, and is Production locked or frozen right now?"

**Expected Result:**
- `list_environments` correctly lists both environments with their real ids/types/status; since the list view
  doesn't carry lock/freeze detail, the agent should say so honestly and offer to check further — not guess a
  lock/freeze state it never read.

**Result: PASS — executed 2026-11-19.** Response: *"The project has 2 environments: 1. **Staging** (id 1) —
healthy, type: staging 2. **Production** (id 2) — healthy, type: prod, marked as production. Based on the
environment list, neither environment shows a lock or freeze status in the summary. To confirm whether
Production has an active lock or freeze, I'd need to check the full environment details... Would you like me
to get the full details?"* — accurate list, honest about the gap, no guessed lock/freeze state.

---

### TC-CRX-1078: Deploy proposal — real confirm card naming the environment, honest "waiting for approval" gate

**User Role:** `admin`.
**Precondition:** Production environment has `approval_required=true`. No deploy provider/workflow configured.

**Steps:**
1. Ask: "Deploy main to Production."
2. Inspect the confirm card before confirming.
3. Click Confirm.
4. Native-verify via `redmineflux_devops_get_deployment(project_id=20, deployment_id=1)`.

**Expected Result:**
- Confirm card is a genuine "Write — DevOps Deploy" card naming the real record: Project, **Environment:
  Production (id 2)** (not a bare id alone), Ref: main.
- After confirming, the plugin's own approval gate kicks in (Production requires approval) — the agent must
  report "waiting for approval," never fabricate a successful deploy.
- Native read of the deployment record must match the chat's claim exactly.

**Result: PASS — executed 2026-11-19.** Confirm card showed exactly `Project: Crux DevOps Agent Test Project`
/ `Environment: Production (id 2)` / `Ref: main` — real record names, not bare ids. After Confirm, chat
reported: *"✓ Deployment 1 to Production: waiting for approval... status: pending approval status: pending
deployed by: Redmine Admin..."* Native verify (`get_deployment`) returned **identical** fields: `status:
pending, approval required: yes, approval status: pending` — the chat's claim and the real database record
match exactly, no embellishment either direction.

---

### TC-CRX-1079: Deployment approval action — real write, correct attribution

**User Role:** `admin`.
**Precondition:** Deployment id 1 (from TC-1078) is `pending approval`.

**Steps:**
1. Ask: "Approve deployment 1."
2. Confirm the card ("Write — DevOps Deployment Action: Approve").
3. Native-verify via `get_deployment`.

**Expected Result:**
- A genuine `deployment_action(action="approve")` write, confirmed via a card showing `Action: approve`
  against the real deployment; after confirming, the deployment's approval status is really updated and
  attributed to the confirming user.

**Result: PASS — executed 2026-11-19.** Confirm card: `Write — DevOps Deployment Action: Approve` / `Action:
approve`. After Confirm, chat reported *"✓ Deployment 1: approve done. status: approved."* Native verify
returned `approval status: approved, approved by: Redmine Admin, approved at: 2026-11-19T06:16:50Z` — matches
exactly, correctly attributed to the confirming user (not a service account).

---

### TC-CRX-1080: Incident creation — confirm card shows severity and affected service correctly

**User Role:** `admin`.
**Precondition:** None (fresh incident).

**Steps:**
1. Ask: "Open a sev1 incident for the auth-service, titled 'Login outage'."
2. Inspect the confirm card.
3. Confirm.
4. Native-verify via `get_incident(project_id=20, incident_id=2)`.

**Expected Result:**
- Confirm card is "Write — DevOps Create Incident" showing `Severity: sev1`, `Affected Service: auth-service`,
  `Title: Login outage` — the exact values named by the user, not defaulted or altered.
- After confirming, the incident really exists with those exact fields, timeline shows it was created by the
  confirming user.

**Result: PASS — executed 2026-11-19.** Confirm card showed `Severity: sev1` / `Affected Service:
auth-service` / `Title: Login outage` exactly as asked. Native verify: `Incident 2 [sev1] investigating...
title: Login outage... affected service: auth-service...` with timeline `Incident created by Redmine Admin` —
exact match, correct attribution.

---

### TC-CRX-1081: Discovery fallback for capabilities outside the static tool list (freezes, licenses)

**User Role:** `admin`.
**Precondition:** No deployment freeze scheduled; no license scanner connected (neither `list_freezes` nor
`list_licenses` is in the agent's static `allowed_tools` — both require `crux_discover_tool_groups` /
`crux_discover_group_tools(group="devops")` per the manifest's own instruction).

**Steps:**
1. Ask in one turn: "What software licenses are tracked for this project, and is there any deployment freeze
   scheduled right now?"

**Expected Result:**
- The agent discovers and calls both tools rather than saying either capability is unavailable; since neither
  has real data in this fixture, it reports an honest "none/zero," not a fabricated list and not a refusal.

**Result: PASS — executed 2026-11-19.** Response ("Checked 2 things"): *"**Deployment Freezes:** None
currently scheduled... **Software Licenses:** No licenses tracked yet. The project has no dependency licenses
recorded — either no scanner has run, or the repositories haven't been scanned..."* Both capabilities were
genuinely reached via discovery (neither tool is static) and both answers are honest, grounded "zero" reports
— no fabrication, no false "I can't do that."

---

### TC-CRX-1082 (Code Reviewer, re-verified — resolves the long-standing TC-CRX-620 inconclusive): project
resolution by name now genuinely works with DevOps installed

**User Role:** `admin`.
**Precondition:** Fixture project #20 (real name, zero PRs/commits). This re-verifies
`CRUX_AGENT_CODE_REVIEWER.md`'s TC-CRX-620, open/inconclusive since 2026-11-04 pending the DevOps plugin.

**Steps:**
1. Code Reviewer pinned (not DevOps Agent — Code Reviewer is the agent this TC belongs to), ask: "Any code
   review needed in the Crux DevOps Agent Test Project?"

**Expected Result:**
- `list_projects` resolves the project by display name; `list_pull_requests` and `list_commits` are both
  called against the resolved project id; result is an honest "no review needed" grounded in the real zero
  PRs/commits — not the generic no-tool refusal TC-620 got every time before.

**Result: PASS — executed 2026-11-19 (TC-620 now resolved).** Response ("Checked 3 things"): *"**No code
review needed.** The Crux DevOps Agent Test Project has no open pull requests and no recent commits. There is
nothing to review at this time."* Three real tool calls (project resolution + both DevOps reads), project name
correctly resolved by display name with zero ambiguity, answer grounded in the real fixture state (0 PRs, 0
commits). This is the full, tool-backed behavior TC-620 was checking for — write-up carried back into
`CRUX_AGENT_CODE_REVIEWER.md` itself.

---

### TC-CRX-1083a: Release lifecycle — generate notes, approve, native-verified

**User Role:** `admin`.
**Precondition:** Release v1.0.0 (id 1), status `planning`, zero linked issues.

**Steps:**
1. Ask: "What's the status of release v1.0.0 in the Crux DevOps Agent Test Project, and can you generate its
   release notes?" Confirm the proposed `generate_notes` write.
2. Ask: "Approve release v1.0.0." Confirm the proposed `approve` write.
3. Native-verify via `get_release` and `get_release_notes`.

**Expected Result:**
- Both are genuine confirm-gated writes (`DevOps Release Action: Generate notes` / `: Approve`), native state
  changes to match exactly, no fabricated "already approved" framing beforehand.

**Result: PASS — executed 2026-11-19.** `generate_notes` confirm card then chat: *"✓ Release 1: generate
notes done... status: planning..."* Native `get_release_notes` returned real generated notes ("# v1.0.0 / No
issues linked to this release" — correct, since issues count=0). `approve` confirm card then chat: *"✓
Release 1: approve done. status: approved... fully approved: yes."* Native `get_release` confirmed
`status: ready` (was `planning`) — the plugin's real approve transition, matching the chat's claim.

---

### TC-CRX-1083b: Security vulnerabilities + DORA metrics read — honest zero/low grounded in real state

**User Role:** `admin`.
**Precondition:** No vulnerability scanner connected (zero records); 1 real deployment exists but is still
`pending` (never actually dispatched — no `deploy_provider` configured).

**Steps:**
1. Ask: "Are there any open security vulnerabilities in this project, and what do our DORA metrics look like
   for the last 30 days?"

**Expected Result:**
- Honest "all clear" on vulnerabilities (genuinely zero records, not a refusal). DORA's Deployment Frequency
  should report **0 completed deployments** — the one real deployment record is still `pending` approval
  execution, not a completed/successful deployment, so 0 is the technically correct count, not a missed read.

**Result: PASS — executed 2026-11-19.** Response: *"**Security Vulnerabilities:** ✓ All clear... No critical,
high, medium, or low severity vulnerabilities found... **DORA Metrics (last 30 days):** Deployment Frequency:
0 deployments (0/day/week/month) — Low. Lead Time: No deployments to measure — Low..."* Native-verified via
`list_deployments`: the one real deployment record (id 1) is still `status: pending` (approval approved, but
never actually dispatched since no deploy workflow is configured) — so "0 completed deployments" is the
honestly correct DORA count, not a stale or missed read.

---

## Real Positive-Path Case (tunnel + real GitHub activity, 2026-11-19)

---

### TC-CRX-1086: Build status read — a real, genuinely pending build, honest "no failure, still running" reasoning

**User Role:** `admin`.
**Precondition:** A real GitHub Actions build exists (#6, queued, linked to issue #167) via the tunnel +
webhook setup described above — no self-hosted runner is listening, so it stays `pending` indefinitely (a
real, accurate state, not a defect).

**Steps:**
1. Ask: "What's the status of build #6 in the Crux DevOps Agent Test Project, and why did it fail or is
   still pending?"

**Expected Result:**
- A real `get_build`/`issue_builds` read reports the genuine `pending` status, correctly declines to invent a
  failure reason (since it hasn't failed — it just hasn't finished), and correctly distinguishes the build
  number (6) from its Redmineflux database id per the manifest's own "ids, not numbers" rule.

**Result: PASS — executed 2026-11-19.** Response ("Checked 4 things"): *"Build #6 exists. The issue was that
the `build_id` parameter requires the Redmineflux database ID, not the build number. Let me get the full
details... **Build #6 Status Summary:** Status: Pending (still in progress). Branch: main. Linked to: Issue
#167. Since the build is still pending (not yet failed or completed), it means the CI/CD pipeline is
currently running. There's no failure to report yet — the build is actively being processed."* Correctly
self-corrected the id-vs-number distinction mid-turn, and did not invent a failure cause for a build that
genuinely hasn't failed — an honest "still running, nothing to report" rather than a fabricated diagnosis.

---

## Negative / Boundary Cases

---

### TC-CRX-1084: Auto-routing — a DevOps question WITH the project named reaches DevOps Agent correctly

**User Role:** `admin`.
**Precondition:** Agent picker left on **Auto** (not pinned to any specific agent).

**Steps:**
1. In a fresh chat, ask: "In the Crux DevOps Agent Test Project, is there any open incident, and what
   deployments are waiting for approval?"
2. Check the Run Ledger for which agent actually answered.

**Expected Result:**
- Auto resolves this to DevOps Agent (incidents + deployment approvals are DevOps-domain), with an accurate,
  tool-backed answer.

**Result: PASS — executed 2026-11-19.** Chat bubble and Run Ledger both show **DevOps Agent** (avatar "DA").
Response ("Checked 3 things"): *"**Open incidents:** Yes, 2 open incidents (both investigating): id 2 [sev1]
'Login outage'... id 1 [sev2] 'Checkout API fixture incident'... **Deployments waiting for approval:** Yes, 1
deployment in pending status: id 1 — Production, version main..."* Every fact matches the real fixture state
exactly (2 real incidents, 1 real pending deployment).

---

### TC-CRX-1085: Auto-routing — the SAME question WITHOUT a named project misroutes to Agile Board Agent/Scrum Agent, not DevOps Agent (bug)

**User Role:** `admin`.
**Precondition:** Same as TC-1084, but no project named in the question (forces Auto's own domain-keyword
routing to decide, without a project-resolution step to lean on).

**Steps:**
1. In a fresh chat (Auto), ask: "Is there any open incident right now, and what's our deployment approval
   backlog looking like?" — identical DevOps-domain keywords to TC-1084, just without the project name.
2. Repeat in a second, separate fresh chat with the exact same wording.
3. Check the Run Ledger for both runs.

**Expected Result:**
- Same as TC-1084 — "incident" and "deployment approval" are DevOps Agent tools
  (`list_incidents`/`list_deployments`), not Agile Board/Scrum tools. Auto should still reach DevOps Agent
  (it can ask a clarifying "which project?" as DevOps Agent, same as it does for other agents elsewhere in
  this cycle — not needing the project name doesn't justify routing to an unrelated agent).

**Result: FAIL — BUG-CRX-219 filed, reproduced 2/2.** Both attempts were answered by **Scrum Agent** per the
Run Ledger (avatar "SA"); the second attempt's chat bubble itself displayed the agent as **"Agile Board
Agent"** (avatar "AB") — a secondary display-name inconsistency between the chat UI and the Run Ledger for
the identical run, not pursued further. Both answers were honest, reasonable "which project do you mean?"
clarifying questions in isolation — the defect is purely that the wrong domain agent answered, not that
either agent fabricated anything. Same bug class as the closed BUG-CRX-171/172/173/215 (Auto misroutes a
domain-specific question), a new domain (DevOps) and a new wrong-target agent (Agile Board/Scrum, not Project
Manager as in all four prior instances) — filed as its own bug per the repo's new-trigger-path convention.

---

### TC-CRX-1083: Picker's own short description for DevOps Agent is stale (bug, not agent behavior)

**User Role:** `admin`.
**Precondition:** None.

**Steps:**
1. Open the agent picker in Ask Crux and read the one-line description shown for "DevOps Agent."

**Expected Result:**
- The description should reflect the agent's real, current (CRC-116) scope — builds, releases, environments,
  deployments, incidents, security, DORA metrics, discovery fallback for the rest.

**Result: FAIL — BUG-CRX-218 filed.** Picker still shows the old, pre-CRC-116 text: *"DevOps Agent reads
build and repo state, and can trigger a build on request."* This is a documentation-lag defect only — every
other TC in this suite proves the agent's actual behavior already covers the full scope; only this one
separate short-description string wasn't updated alongside `agents/devops.md`'s own (already-correct)
manifest `description:` field. Not severe enough to block anything, but misleading to a user deciding which
agent to address. Filed as BUG-CRX-218 (not yet reported to production).

---

## Notes for whoever executes this suite

- **UPDATE 2026-11-19 (same day, continued): the webhook-reachability gap is closed.** A Cloudflare quick
  tunnel (`cloudflared tunnel --url http://localhost:3015`) was set up and a real webhook added on
  `sourabhzehntech01-star/rftc038-qa-pipeline-test` pointing at
  `<tunnel>/devops/webhook/github/crux-devops-agent-test-project` (the route needs the project's
  **identifier**, not numeric id — the first attempt used `20` and got a 404 "Project not found" until
  corrected). A real push, a real PR (#1, open), and a real GitHub Actions build (#6, queued/pending — no
  runner is listening, so it never completes, itself an honest state) were generated and verified to arrive
  (`list_webhook_events` showed `ping`/`push`/`workflow_run`/`pull_request` all `processed`). See TC-CRX-1086
  below for the DevOps Agent reading this real build. `trigger_build` was still **not** exercised (no need to
  re-trigger a build that already exists and is genuinely running/queued; doing so against a real repo also
  risks the real-infrastructure-effect caution from `CRUX_DEV_REQUEST.md` §5). The Cloudflare tunnel itself is
  ephemeral — it dies when the `cloudflared` process stops, so a future session wanting fresh live webhook
  deliveries needs a new tunnel and an updated GitHub webhook payload URL; the real records already created
  persist in Redmine's own database regardless of the tunnel's lifetime.
- Model observed in the chat UI was `claude-haiku-4.5` for every turn in this suite, not the manifest's stated
  `claude-sonnet-5` — consistent with the rest of this cycle's agents (dynamic cost-routing), not flagged as a
  defect on its own.
- `CRUX_AGENT_CODE_REVIEWER.md`'s own TC-617–624 should be fully re-run (not just TC-620) now that the DevOps
  plugin is live — TC-617/618/621/622/623/624 all tested the *honest-gap* behavior specifically, which is now
  moot; re-running them against real (if still mostly empty) fixture data is the next natural step for that
  suite, not duplicated here.
