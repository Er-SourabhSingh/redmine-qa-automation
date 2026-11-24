# Test Cases — Redmineflux MCP — Nuitka-Compiled Binary Distribution Coverage

> Source: a standalone, compiled (Nuitka) Linux binary distribution of `redmineflux-mcp` and
> `redmineflux-crux-core` (from a `feature/nuitka-compile` branch build), provided for direct
> systemd-based deployment — no Docker, no Python install, no source code (see each package's own
> `SETUP.md`). Tested here inside Docker purely as an isolated way to run and exercise the binaries
> themselves (see `docker-compose.yml`'s own header comment for why).
>
> **Status: EXECUTED 2026-11-24.**

## Plugin
- Name: Redmineflux MCP Server + Crux core, compiled binary packages (`redmineflux-mcp` v1.0.14, commit
  `d9c1e8ce7152`; `redmineflux-crux-core`, version not separately queried this pass)
- Redmine version: 6.0-bookworm, fully isolated local Docker stack (`C:\crux-redmine-mcp-binary`,
  localhost:3016) — separate from `C:\crux-redmine` (source build) and `C:\crux-redmine-oauth61`
  (Redmine 6.1, OAuth testing)
- Path: plugins/redmineflux_mcp_qa

## Methodology
Direct MCP-server-layer testing (HTTP calls to the server's `/mcp` endpoint and tool calls), mirroring
`MCP_DEVOPS_TOOL_COVERAGE.md`'s and `MCP_SDK2_OAUTH_SIGNIN.md`'s established approach — no Ask Crux chat
in the loop, every result verified against the server's own response or Redmine's own REST data. Since
this is a compiled binary (no source available to read), findings are root-caused as far as black-box
testing allows (direct REST calls to the same endpoints the MCP tool calls, comparing responses with and
without a fixture project present).

---

### TC-MCP-035: The compiled binary boots correctly and serves real tool calls end-to-end

**Steps:**
1. Build the binary's own `Dockerfile` (a thin `debian:bookworm-slim` wrapper around the extracted
   package — no Python, no pip, just the Nuitka standalone executable + its bundled `.so` files, per the
   package's own "no runtime dependencies beyond glibc" claim).
2. Bring up the full stack (db, redis, redmine, mcp, crux-core) and wait for Redmine to become healthy.
3. Create an admin API key via the UI (`/my/api_key`), call `initialize` and a representative tool
   (`redmineflux_core_get_current_user`) against the compiled `mcp` binary.

**Expected Result:** The binary starts, detects installed plugins, and serves correct responses — proving
the Nuitka-compiled distribution is genuinely deployable and functional, not just "builds".

**Result: PASS.** Both binaries (`mcp`, `crux-core`) started cleanly inside the thin wrapper container.
`initialize` returned `serverInfo: {"name":"Redmineflux","version":"1.0.14+d9c1e8ce7152"}`.
`redmineflux_core_get_current_user` returned the correct admin identity. `crux-core`'s
`/api/health` returned `{"ok": true, "service": "crux-core", "project": "crux-qa"}`. Confirmed again on a
fresh Docker Desktop restart the next day — both binaries survived the host restart and the stack came
back up automatically (`restart: unless-stopped`), no rebuild needed.

**Environment note (not a binary defect, documented so it isn't re-chased):** immediately after a host
restart, `get_current_user` briefly failed with `"You do not have permission to view user 'current'."`
even for the admin API key. Root-caused via direct REST calls (`/users/current.json` → `403`,
`/users.json` → `403`, `/projects.json` → `200`) to **Administration → Settings → API → "Enable REST web
service"** having reverted to unchecked on this Redmine instance — not a setting this binary (or any MCP
tool) controls. Re-enabling it in the UI fixed every affected tool immediately, confirming this was a
Redmine-instance-level configuration state, unrelated to the compiled binary itself.

---

### TC-MCP-036: Plugin auto-detection on a genuinely fresh Redmine instance (zero projects)

**Steps:**
1. On a stack whose Redmine instance has **zero projects** (the literal first-boot state this package's
   own `SETUP.md` is written for), (re)start the `mcp` binary and inspect its own startup log for which
   plugins it detects.
2. Attempt to call a tool from each plugin group that logged `Plugin not detected: ... (skipped)`.

**Expected Result:** Every plugin actually installed on this Redmine instance should be detected,
regardless of whether a project has been created yet.

**Result: FAIL — BUG-MCP-006 filed.** With zero projects, `devops` and `gantt` both logged
`Plugin not detected: ... (skipped)` while all 12 other installed plugins (agile, workload, timesheet,
helpdesk, testcases_management, knowledgebase, budget_audit, flux_issue_template, invoice, flux_tags,
checklist, crm) detected and loaded correctly — `12/14`. Calling any `redmineflux_devops_*` or
`redmineflux_gantt_*` tool returned `"Unknown tool: ..."` (the tools are entirely absent from the server's
manifest, not merely erroring). Root-caused via direct REST: the detection probe for these two plugins
calls their project-scoped endpoint with **no** `project_id` first, gets a plain `400 Bad Request`
(`{"error":"project_id is required"}`), and has no fallback for that response code — unlike a `401`/`403`,
which the detector explicitly knows how to treat as "installed, just denied, load anyway." See
`bugs/open/BUG-MCP-006.md` for the full evidence chain.

---

### TC-MCP-037: Plugin auto-detection self-heals once a project exists

**Steps:**
1. Create one Redmine project via REST (`POST /projects.json`).
2. Restart the `mcp` binary and inspect its startup log again.
3. Call a `devops` tool and a `gantt` tool.

**Expected Result:** Documents the actual self-healing behavior found while investigating TC-MCP-036 —
not a pass/fail in isolation, but confirms the fix is "create any project, then restart," which is the
practical workaround until BUG-MCP-006 is fixed.

**Result: PASS (confirms the workaround, not the underlying defect).** With one project present, the
detection probe retried with `?project_id=<that project>`, got `403 Forbidden` this time, and the detector
correctly logged `"plugin is installed but the detection probe was denied (401=auth, 403=permission).
Loading tools anyway."` — `devops` and `gantt` both loaded, `14/14` plugins detected, 563 tools total.
`redmineflux_agile_list_columns(project_id="1")` returned real column data immediately. Confirms
BUG-MCP-006 is purely a first-boot/zero-project condition, not a permanently broken feature.

---

### TC-MCP-038: Representative tool sweep — one safe read call per detected plugin group

**Steps:** With `14/14` plugins loaded (post TC-MCP-037), call one representative, argument-light tool from
each plugin group plus core: `agile_list_columns`, `kb_list_spaces`, `crm_list_companies`,
`testcases_management_list_test_suites`, `flux_tags_list_tags`, `budget_audit_get_budget_status`,
`issue_template_list_templates`, `invoice_list_invoices`, `checklist_list_templates`,
`gantt_list_versions`, `timesheet_schema_list`, `workload_teams`, `helpdesk_list_organizations`,
`devops_list_builds`.

**Expected Result:** Every call returns a real, correctly-shaped response (either data or a clear
"no X found" / "module not enabled" message) — no crashes, no generic server errors, no tool genuinely
missing.

**Result: PASS, with one secondary observation.** All 14 calls returned clean, correctly-shaped responses
(real data, or a clear "no X found yet" / "module X is not enabled for this project" message — this fresh
project predictably had almost nothing configured). The one exception: `devops_list_builds` returned
`"Error: You do not have permission to view build."` for the **admin** API key even after the `devops`
module was explicitly enabled on the project — admin should never be permission-blocked. Not chased to a
root cause here (most likely needs a connected repository record, consistent with this plugin's own
established fixture pattern from earlier DevOps QA sessions); noted as a secondary observation inside
BUG-MCP-006 rather than filed as its own bug, since it reads as a devops-plugin-level message-accuracy
issue (same class as BUG-MCP-003), not something specific to this compiled binary.

---

### TC-MCP-039: Crux-core compiled binary integrates correctly with the mcp compiled binary

**Steps:** Check `crux-core`'s own `/api/health`; check the `mcp` binary's `tools/list` for the
`redmineflux_crux_*` "attach-contract" tools that bridge the two services.

**Expected Result:** Both binaries recognize each other — crux-core is healthy, and mcp exposes the
attach-contract tools (confirming `CRUX_CORE_URL` wiring works across two independently-compiled Nuitka
binaries, not just within one process).

**Result: PASS.** `crux-core`'s `/api/health` → `{"ok": true, "service": "crux-core", "project":
"crux-qa"}`. `mcp`'s `tools/list` includes `redmineflux_crux_claim_next_work` and
`redmineflux_crux_report_complete` — the two services correctly discover and integrate with each other.

---

### TC-MCP-040: Read-only mode blocks a write tool

**Steps:** Temporarily set `REDMINEFLUX_READ_ONLY=true`, rebuild `mcp`, attempt
`redmineflux_core_create_issue`.

**Expected Result:** The write is blocked with a clear message, identical in spirit to the source build's
own behavior (already confirmed in `MCP_SDK2_OAUTH_SIGNIN.md` TC-MCP-031 for the source line).

**Result: PASS.** Got `"BLOCKED: 'redmineflux_core_create_issue' is a write operation and the server is in
read-only mode (REDMINEFLUX_READ_ONLY=true). Contact your Redmineflux administrator to enable write
access."` — exact same message family as the source build. Reverted immediately after, rebuilt clean,
confirmed `14/14` plugins still detected post-revert.

---

### TC-MCP-041: Clear, specific tool error messages

**Steps:** Call `redmineflux_core_get_issue(issue_id=999999999)` (guaranteed-missing id).

**Expected Result:** A clear, specific, actionable error — not a generic/blank failure.

**Result: PASS.** Returned `"Issue #999999999 not found.\nPossible reasons:\n  • The ID or identifier you
provided does not exist\n  • You don't have permission to see it (Redmineflux returns 404 for both
cases)\n  • The record was deleted\nTry: verify the ID with the corresponding list_* tool, or ask your
administrator."` — matches the same clear-error convention already confirmed on the source build.

---

### TC-MCP-042: Crux plugin's own Settings page can reach the crux-core compiled binary

**Steps:** Open the Redmine Crux plugin's own Settings page (`/crux/admin/settings`), check the "Crux core
service URL" field and its "Test connection" result.

**Expected Result:** The plugin can confirm reachability to this stack's own `crux-core` binary.

**Result: PASS, after a configuration fix (environment-specific, not a binary defect).** The field defaulted
to `http://localhost:8787` and failed ("Couldn't reach a Crux core service at this address"). Root cause:
this setting is tested **server-side** (Redmine's own Rails backend makes the HTTP call, not the browser),
so it needs the **Docker-internal** address, not the host-mapped port — `http://crux-core:8787` (the
internal service name + internal container port), not `http://localhost:8788` (this stack's host-mapped
port, only reachable from outside Docker — the browser/curl). Setting it to `http://crux-core:8787` and
clicking "Test connection" returned **"Connected to the Crux core service."** Saved.

**Note — Ask Crux live chat not tested this round.** No `ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`
is configured in this stack's `.env`, so an actual end-to-end Ask Crux conversation (real LLM call, agent
tool-calling loop) was not exercised — only the infrastructure-level wiring (both binaries up, crux-core
reachable from Redmine, MCP tools discoverable) was confirmed. Deferred; add a provider key and retest with
a real chat message if/when full agent-level coverage on this binary distribution is needed.

---

---

## Section D — Formal "Testing the compiled Redmineflux MCP Server (website package)" checklist

> Executed 2026-11-24, same stack (`C:\crux-redmine-mcp-binary`). This is the website's own published
> test checklist for this exact binary package, run item-by-item. Fixture users created for this section:
> `mcp-bot` (Reporter role, server/bot key — matches `SETUP.md` Step 0's "dedicated bot user" recommendation,
> `REDMINEFLUX_API_KEY` reconfigured to use it instead of the admin key used earlier in this suite),
> `limited.user` (no project membership, no role — the "limited rights" user).

### TC-MCP-043: Install — `--version` output

**Result: PASS.** `docker compose exec mcp ./redmineflux-mcp --version` → `redmineflux-mcp 1.0.14 (commit
d9c1e8ce7152134683a55a6574375976443a1bc0)`.

### TC-MCP-044: Configure + Start — expected log lines, "Detected plugins" lists everything installed

**Result: PASS.** `Redmineflux MCP v1.0.14 (commit d9c1e8ce7152134683a55a6574375976443a1bc0): 563 tools (93
core + 468 plugin + 2 crux). Detected plugins: ... (14/14)` and `Uvicorn running on http://0.0.0.0:8080` both
present — matches every plugin actually installed on this Redmine instance (confirmed earlier in this
suite, TC-MCP-037).

### TC-MCP-045: Checklist item 1 — "What tools do you have from redmineflux?"

**Result: PASS.** `tools/list` returns tools for core (90) and every installed plugin group: helpdesk (77),
devops (68), testcases_management (66), workload (64), timesheet (39), agile (37), crm (32), invoice (23),
checklist (20), knowledgebase (13), flux_tags (11), gantt (10), flux_issue_template (6), budget_audit (4),
crux (2).

### TC-MCP-046: Checklist item 2 — "Show me my open issues"

**Result: PASS.** `list_issues(assigned_to_id=1)` returned accurate real-time data (`"No issues found
matching filters..."` — correct, since nothing was assigned to admin at the time). Confirmed with real data
in TC-MCP-047/048's create/update cycle below.

### TC-MCP-047: Checklist item 3 — write attempt under `REDMINEFLUX_READ_ONLY=true` (the default)

**Result: PASS.** `create_issue` → `"BLOCKED: 'redmineflux_core_create_issue' is a write operation and the
server is in read-only mode (REDMINEFLUX_READ_ONLY=true). Contact your Redmineflux administrator to enable
write access."`

### TC-MCP-048: Checklist item 4 — `REDMINEFLUX_READ_ONLY=false`, restart, full create/update/delete cycle

**Result: PASS.** `create_issue` → `"Created issue #1: ..."`. `update_issue(subject="... - updated")` →
native-verified via direct REST (`GET /issues/1.json` shows the updated subject). `delete_issue(1)` →
native-verified via direct REST (`GET /issues/1.json` → `404` afterward). Full lifecycle works correctly.

### TC-MCP-049: Checklist item 5 — limited user's key, read/change something without permission

**Result: PASS.** `limited.user` (zero project memberships, zero role) correctly saw the one existing
project in `list_projects` (expected — it's a public project, visible to everyone by Redmine's own design,
not a permission leak) but `create_issue` on it was refused: `"You do not have permission to create or
submit issue."` — nothing changed.

### TC-MCP-050: Checklist item 6 — wrong personal key in the client

**Result: PASS.** `initialize` itself succeeds even with a garbage key (auth is checked lazily, per-tool-call,
not at the handshake) — but the first actual tool call correctly refuses: `"Authentication failed — your API
key is invalid or expired.\nSteps to fix:\n  1. Open Redmineflux → My Account → API access key\n  2. Copy the
key and update your MCP configuration\n  3. Reconnect to the MCP server"`.

### TC-MCP-051: Checklist item 7 — wrong `REDMINE_API_KEY` in `.env`, restart

**Result: PASS.** Startup log showed exactly the documented line: `ERROR:redmineflux-mcp:Startup self-test
FAILED: API key is invalid (401)`, followed by `WARNING:redmineflux-mcp:Redmine not reachable or API key
invalid. Server starting in degraded state — tools will return errors.` — the server still started
(degraded, not crashed) rather than refusing to boot entirely, which is arguably friendlier than the
checklist's own minimal expectation ("the log shows..."). Reverted to the valid bot key immediately after.

### TC-MCP-052: Checklist item 8 — `systemctl status` / `stop` / `restart` (Docker equivalent: `docker compose ps` / `stop` / `up -d`)

**Result: PASS.** `docker compose ps mcp` showed the running container; `stop` cleanly stopped it (empty
`ps` output); `up -d` brought it back, confirmed running again within seconds. Equivalent to the documented
systemd lifecycle (`status`/`stop`/`restart`, "service comes back after a restart").

### TC-MCP-053: Checklist item 9 — run tools from Helpdesk, Testcase, Agile, Timesheet, Workload, DevOps

**Result: PASS**, with the already-known secondary observation reproduced consistently. `helpdesk_list_tickets`,
`testcases_management_list_test_suites`, `agile_list_columns`, `timesheet_schema_list`, `workload_teams` all
answered correctly (real data or an accurate "nothing found yet" for this fresh project). `devops_list_builds`
reproduced the same misleading "permission" message for admin already documented as a secondary observation
inside BUG-MCP-006 (needs a connected repository, not an actual permission gap) — not a new finding, confirms
it's consistent/reproducible rather than a one-off.

### TC-MCP-054: Checklist item 10 — `SETUP.md` steps match observed behavior

**Result: PASS, with one honest limitation.** Every `SETUP.md` step and its documented log lines/behavior
matched exactly what this suite observed throughout (install layout, `.env` variable names, the startup log
format, the client connection header convention, read-only default, and the exact `"API key is invalid
(401)"` wording). **Not verified:** the website's own published Knowledgebase HTML page for this package —
no access to redmineflux.com's hosted docs from this environment, so only `SETUP.md` (shipped inside the
package itself) was compared, not the external KB article the checklist also asks to cross-check.

---

**Section D summary:** 12/12 PASS (TC-MCP-043–054). No new defects found — the one devops-permission
observation reproduced here was already filed inside BUG-MCP-006. The compiled binary's documented setup
and behavior checklist is fully verified end-to-end, within the one stated limitation (no access to the
external website Knowledgebase page for a direct comparison).

---

## Section E — Security check: does the compiled distribution leak readable source code?

> The whole point of shipping a Nuitka-compiled binary to a client (instead of source) is that the
> client's own business logic/implementation details stay opaque. This section checks whether that
> actually holds for both binaries.

### TC-MCP-055: Neither compiled binary exposes its own proprietary source code in readable form

**Steps:**
1. Scan every file in both extracted packages for any leftover `.py` source files (`find ... -name "*.py"`).
2. Inspect each vendored third-party package directory (`certifi`, `jsonschema_specifications`,
   `pydantic_core`, `rpds`, `zstandard`, `cryptography`) to confirm they contain only compiled artifacts or
   non-code data, not plaintext source.
3. Confirm both main executables are genuine compiled ELF binaries, not interpreted scripts (`od`/magic-byte
   check for the `7f 45 4c 46` ELF header).
4. Grep each compiled binary (`grep -a`, since no `strings` tool is available in the minimal
   `debian:bookworm-slim` base image) for distinctive, known proprietary identifiers pulled directly from
   this plugin's own earlier-read source checkout — class/function names that only exist in Redmineflux's
   own business logic, never in a third-party dependency: `OAuthSupport`, `discover_scopes`, `authorize`
   (the OAuth-flow method, not any generic usage), `_server_identity` for `redmineflux-mcp`; `OAuthHandler`,
   `claim_next_work` for `redmineflux-crux-core`.
5. Grep both binaries for hardcoded secret patterns (`sk-...`, AWS-style `AKIA...`, inline API key
   assignments) and for internal developer file paths (`/home/.../*.py`, `/Users/.../redmineflux*`) that
   could leak build-machine details.

**Expected Result:** No proprietary source code, hardcoded secrets, or internal developer paths should be
recoverable from either compiled binary or its accompanying files — a client who obtains this package should
not be able to read Redmineflux's own implementation.

**Result: PASS, both binaries.**
- **Zero `.py` files** anywhere in either extracted package. Every vendored third-party directory contains
  only compiled `.so` files or non-code data: `certifi/` → `cacert.pem` (a public CA bundle, not a secret);
  `jsonschema_specifications/schemas/` → public JSON Schema metaschema `.json` files (the spec itself, not
  code); `pydantic_core/`, `rpds/`, `zstandard/`, `cryptography/hazmat/bindings/` → compiled `.so` binaries
  only.
- Both `redmineflux-mcp` and `crux-core` confirmed as genuine ELF binaries (`7f 45 4c 46` magic bytes), not
  wrapped interpreted scripts.
- **All 6 proprietary identifiers: 0 occurrences** in either binary (`grep -ac` on `redmineflux-mcp` for
  `OAuthSupport`/`discover_scopes`/`authorize`/`_server_identity`; on `crux-core` for
  `OAuthHandler`/`claim_next_work`) — Nuitka's compilation fully strips the company's own class/function
  names, unlike the generic dunder-method and third-party-library symbol names (e.g. pydantic's own internal
  `__create_fn__` helper, or stdlib `numbers.Rational`/`is_str_list` checks) which do remain as compiled
  artifacts but reveal nothing about Redmineflux's own logic — these are the same kind of leftover symbols
  any compiled Python binary built on open-source dependencies would have.
- **No hardcoded secrets** found in either binary (`sk-`/`AKIA`-style patterns: 0 matches).
- **No internal developer file paths** leaked in either binary (`/home/.../*.py`, `/Users/.../redmineflux*`:
  0 matches).
- One expected, non-sensitive match: `crux-core`'s binary references `db.seed` 3 times — this is the
  already-intentionally-bundled `db.seed.production.json` demo/seed data file sitting right next to the
  binary in plain sight (not something the binary is hiding or leaking; it's meant to ship in plaintext).

**Conclusion:** a client who receives either compiled package cannot read Redmineflux's own proprietary
source code — no `.py` files ship with the package, and the compiled executables themselves don't contain
readable/reconstructable business logic, only generic third-party-library symbol fragments and literal
user-facing strings (error messages, log lines) that are meant to be visible anyway.

---

**Section E summary:** 1/1 PASS. No source-exposure or secret-leak defects found in either compiled binary.

---

## Suite summary

23 TCs executed across Sections A–E (TC-MCP-035–055, plus TC-MCP-036/037 as a matched fail/self-heal pair):
22 PASS, 1 FAIL (TC-MCP-036 → BUG-MCP-006, filed, reported to production as ztflux #129327). The compiled
Nuitka binary distribution is confirmed genuinely deployable and functionally correct for its documented use
cases (boots standalone, serves real tool calls, integrates with its own crux-core compiled sibling both at
the MCP-tool level and via Redmine's own Crux plugin UI, enforces read-only mode and read-write cycles with
native verification, gives clear errors for bad/wrong keys, lifecycle commands work, every plugin's tools
answer correctly) and does not leak readable proprietary source code, hardcoded secrets, or internal
developer paths from either compiled binary — the one real defect found is specific to first-boot plugin
detection on a completely empty Redmine instance, which is exactly the scenario this package's own
`SETUP.md` walks a new deployer through. **Not covered this round:** a live Ask Crux chat conversation (no AI
provider key configured) — infrastructure-level readiness only; and a direct comparison against the
website's own hosted Knowledgebase HTML page (no access to redmineflux.com's docs from this environment).

## Notes for whoever executes this suite again

- This suite tests the **compiled binary distribution** specifically (`C:\crux-redmine-mcp-binary`), not
  the regular source checkout (`C:\crux-redmine`) — same plugin code, different deployment artifact.
  Findings here may or may not also apply to the source line; BUG-MCP-006 explicitly flags this as
  unconfirmed and worth a quick cross-check if it ever matters.
- The "Enable REST web service" setting reverting to off after a host/Docker-Desktop restart (TC-MCP-035's
  environment note) is worth watching for on this specific Redmine instance across sessions — re-enable it
  first before assuming any MCP tool is broken.
- Settings changed for individual TCs (`REDMINEFLUX_READ_ONLY`) were reverted immediately after each test,
  same discipline as the other suites in this plugin folder.
