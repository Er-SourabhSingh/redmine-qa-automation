# Test Cases — Redmineflux MCP — DevOps Tool Coverage

> Source: production ticket #128756 ("MCP Server: Complete DevOps plugin tool coverage") — its own acceptance
> criteria, read directly from the production issue description. Written because the companion ticket #128890
> (Crux DevOps Agent) was tested extensively through Ask Crux chat, but that only exercises the DevOps MCP
> tools **indirectly**, through whatever subset the agent's own chat reasoning happens to reach — it never
> directly verifies #128756's own acceptance criteria (permission denial, read-only mode, the `Error:` prefix
> convention, API-endpoint permission parity with the plugin's own screens, and most of the 68 tools that the
> DevOps Agent's chat sessions never touched). This suite tests the MCP tool layer **directly** — no chat, no
> agent reasoning in between — exactly the methodology `MCP_TOOL_OPERATIONS.md` already establishes for this
> plugin ("every result must be verified in Redmine itself, not in the assistant's reply").
>
> **Status: EXECUTED 2026-11-19 — 9/10 PASS, 1 new bug filed (BUG-MCP-003).** Fixture: project "Crux DevOps
> Agent Test Project" (id 20), issue #167, a genuinely authenticated GitHub repository
> (`sourabhzehntech01-star/rftc038-qa-pipeline-test`) with real build/commit/PR activity (see
> `plugins/redmineflux_crux_qa/testcases/CRUX_AGENT_DEVOPS.md` for how that fixture was built — a Cloudflare
> tunnel + corrected webhook).

## Plugin
- Name: Redmineflux MCP Server (`redmineflux-mcp`, DevOps tools in `src/tools/devops.py`)
- MCP server version: local checkout 2026-11-19 (RMCP-042/043, 68 DevOps tools)
- Redmine version: 6.0-bookworm (local Docker, `C:\crux-redmine`, localhost:3015)
- Path: plugins/redmineflux_mcp_qa

## Methodology

Every tool below is called **directly**, not through Ask Crux chat — this is deliberately a layer below
`CRUX_AGENT_DEVOPS.md`. Reads are checked against what was independently known to be true (fixtures created
earlier in this QA cycle); writes are checked by reading the record back afterward.

---

## Functional Cases

---

### TC-MCP-001: DevOps tool group is detected and all 68 tools register once the plugin is installed

**Precondition:** Redmineflux DevOps plugin installed and migrated on this Redmine instance.

**Steps:**
1. Restart the `mcp` container after the plugin is installed.
2. Search the registered tool list for `redmineflux_devops_*`.

**Expected Result:** All DevOps tools from the audit (68 per ticket #128756 / RMCP-042) are registered; before
the plugin was installed, zero were registered (confirmed earlier this session: 0 → 68 after plugin install +
container restart).

**Result: PASS — executed 2026-11-19.** Confirmed via this session's own tool-search: 0 `redmineflux_devops_*`
tools visible before the plugin was installed/migrated, 68 visible immediately after restarting `mcp`.

---

### TC-MCP-002: A project without the DevOps module / a user without DevOps permission gets a clear, actionable refusal — no data

**Precondition:** Project #1 ("Crux PM Agent Test Project") does not have the DevOps module enabled.

**Steps:**
1. Call `redmineflux_devops_project_summary(project_id=1)`.

**Expected Result:** No DevOps data returned; the message names what's missing and how to fix it (per
ticket's own criterion: "no data is returned and the message names what is missing").

**Result: PASS — executed 2026-11-19.** Response: *"You do not have permission to view build. To fix this,
ask your Redmineflux administrator to: Grant you the required role/permission for this action; Check:
Administration → Roles and Permissions → [your role]."* No data leaked, clear actionable guidance.

---

### TC-MCP-003: Read-only mode blocks a DevOps write tool, with a clear reason

**Precondition:** `REDMINEFLUX_READ_ONLY=true` set on the `mcp` container (temporarily, for this test only;
reverted to `false` immediately after).

**Steps:**
1. Restart `mcp` with `REDMINEFLUX_READ_ONLY=true`.
2. Call `redmineflux_devops_create_incident(project_id=20, severity="sev3", affected_service="read-only-test")`.
3. Call a DevOps **read** tool (`list_incidents`) to confirm reads still work.
4. Revert `REDMINEFLUX_READ_ONLY` to `false` and restart `mcp` again.

**Expected Result:** The write is blocked with a message naming read-only mode as the reason (per ticket's
own criterion: "any DevOps write tool is called, then the call is blocked"); reads are unaffected.

**Result: PASS — executed 2026-11-19.** Write attempt: `BLOCKED: 'redmineflux_devops_create_incident' is a
write operation and the server is in read-only mode (REDMINEFLUX_READ_ONLY=true). Contact your Redmineflux
administrator to enable write access.` Read tool (`list_incidents`) succeeded normally in the same read-only
state, returning the 2 real incidents correctly. Reverted afterward; confirmed writes work again
(`create_incident` succeeded, incident id 3).

---

### TC-MCP-004: A plugin-refused write starts with "Error:" and gives the plugin's real reason

**Precondition:** A real release (id 1) already `approved`; a real deployment (id 1) already `approved`.

**Steps:**
1. Call `redmineflux_devops_release_action(project_id=20, release_id=1, action="bogus_action_xyz")`.
2. Call `redmineflux_devops_deployment_action(project_id=20, deployment_id=1, action="rollback")` (no
   `reason` — a required field).
3. Call `redmineflux_devops_deployment_action(project_id=20, deployment_id=1, action="approve")` again (the
   deployment is already decided).
4. Call `redmineflux_devops_trigger_build(project_id=20, build_id=99999)` (a nonexistent build).

**Expected Result:** Every refusal starts with `Error:` and states the plugin's real reason (per ticket's own
criterion: "the answer starts with 'Error:' and gives the plugin's reason").

**Result: PASS — executed 2026-11-19.** All 4:
1. `Error: action must be one of: generate_notes, create_tag, create_hotfix, approve, reject,
   refresh_compliance, toggle_compliance, publish_notes, import_version_issues.`
2. `Error: reason is required to roll back.`
3. `Error: Deployment already decided`
4. `Error: Build not found (If you expected this build #99999 to exist, verify the ID with the corresponding
   list_* tool.)`

---

### TC-MCP-005: The 8 pre-existing DevOps tools still work with no regression against the now-expanded plugin

**Precondition:** Real builds/commits/PRs/repositories exist in project #20.

**Steps:**
1. Call `list_builds`, `issue_builds`, `list_commits`, `list_pull_requests`, `list_repositories`,
   `project_summary` (6 of the original 8 — `get_build`/`trigger_build` covered separately above/below).

**Expected Result:** All 6 return accurate data matching the real fixture state, no regression from the
tool-coverage expansion.

**Result: PASS — executed 2026-11-19.** All 6 returned data matching independently-known fixture state (1
build #6 pending, 2 commits, 1 open PR #1, 1 connected repository, correct `project_summary` rollup).

---

### TC-MCP-006 — TC-MCP-010: Representative sweep of previously-untouched read tools

**Precondition:** Fixture project #20 (mostly empty for these specific categories — no alerts, code quality,
dashboards, freezes, licenses, env requests configured).

**Steps:** Call directly: `list_alerts`, `list_code_quality`, `list_dashboards`, `list_freezes`,
`list_licenses`, `audit_log`, `performance`, `stats` (`report="commits"`), `traceability`, `get_settings`,
`get_notification_prefs`, `compare_environments`, `get_repository`, `list_env_requests`.

**Expected Result:** Every tool that's genuinely empty says so honestly (no fabricated rows); every tool with
real data reports it accurately against independently-known state.

**Result: PASS — executed 2026-11-19.** All empty categories (`alerts`, `code_quality`, `dashboards`,
`freezes`, `licenses`, `env_requests`, `performance` — "No monitoring connection is set up") reported
genuinely empty, no fabrication. Tools with real data matched exactly: `audit_log` showed the real
`environment.deploy` event from earlier in this session; `stats(report="commits")` showed 2 real commits by
`sourabhzehntech01-star`; `get_settings` returned real project settings (escalation rules, branch template);
`get_notification_prefs` returned a real per-event channel map; `get_repository` matched the real connected
repo exactly; `compare_environments` correctly reported 0 differences (both environments have no real
deploy yet).

---

## Negative / Boundary Cases

---

### TC-MCP-011: `list_builds`/`list_commits` never expose the id their own `get_*` tool requires — bug

**Precondition:** A real build (provider number #6) and 2 real commits exist, linked via the fixture
described in `CRUX_AGENT_DEVOPS.md`.

**Steps:**
1. Call `list_builds(project_id=20)`, note the only identifier shown (`#6`).
2. Call `get_build(project_id=20, build_id=6)`.
3. Call `list_commits(project_id=20)`, note the only identifier shown (a SHA).
4. Call `get_commit` with a guessed small integer.

**Expected Result:** Per the DevOps Agent's own manifest instruction ("Builds, commits and pull requests have
a Redmineflux id... Use the id from the list"), the list tool's output should include that id.

**Result: FAIL — BUG-MCP-003 filed.** `get_build(build_id=6)` → `Error: Build not found` (6 is the provider's
build number, not the Redmineflux id). The real id (1) only exists by guessing/brute force — `list_builds`
never shows it. Same gap confirmed for `list_commits`/`get_commit`. `get_pull_request`'s equivalent output
*does* show both ids cleanly (`id: 1`, `external id: 1`) — proving the fix pattern already exists elsewhere in
this same tool family, just not applied to builds/commits.

---

## Notes for whoever executes this suite

- **Not covered this pass** (genuinely open, not just deferred): direct `/api/devops` endpoint permission
  parity with the plugin's own screens (ticket #128756's own criterion: "applies the same permission checks
  as the plugin's screens") — this needs a real non-admin test user with a scoped API key, which wasn't set
  up this session. A future pass should create one (see `QA_CREDENTIALS.md` conventions) and compare a
  permission-denied screen action against the matching API call as that same user.
- The remaining ~45 of 68 DevOps tools not explicitly called this pass (write tools like `save_dashboard`,
  `save_freeze`, `save_incident_comm_template`, `save_performance_connection`, `update_notification_prefs`,
  `update_settings`, `update_vulnerability`, `upload_test_results`, `create_branch`, `create_env_request`,
  `create_test_failure_issue`, `environment_lock`, `create_deployment`, `test_report`,
  `release_issue_candidates`, `list_incident_comm_templates`, `check_environment_health`) are a reasonable
  next-pass target — none are expected to behave differently from the patterns already confirmed here
  (honest-empty reads, `Error:`-prefixed refusals, read-only-mode blocking), but none have been directly
  exercised.
- `trigger_build` was deliberately not exercised against the real connected repository (real CI/infrastructure
  effect, per the long-standing caution in `CRUX_DEV_REQUEST.md` §5) — only exercised against a nonexistent
  build id (TC-MCP-004, step 4), a safe negative case.
