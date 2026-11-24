# BUG-MCP-006

**Status: CLOSED 2026-11-24 — CONFIRMED FIXED.** Developer fix `RMCP-055` + `RMCP-056` (redmineflux-mcp commit
`ce420d1` + `a8fc38c`, 1.1.16) pulled onto `C:\crux-redmine`'s mcp service and retested on a dedicated,
genuinely-zero-project Redmine instance (deleted the 2 fixture projects on `C:\crux-redmine-oauth61`, copied
the fixed source into that stack's `mcp` service, rebuilt). Confirmed: with zero projects, `devops` now
returns `400 Bad Request` (no `project_id`) and is correctly read as "installed (no project needed)"; `gantt`
probes project id `0`, gets `404 Not Found`, same treatment — both load, **14/14** plugins detected (up from
12/14). Also retested the secondary observation (RMCP-056): `list_builds` on a project with the DevOps
module off now returns "The DevOps module is not enabled on project ... this applies to administrators too.
A project manager or administrator can turn it on in Project → Settings → Modules → 'Redmineflux DevOps'."
— accurate and specific, replacing the old misleading "permission denied" message.


- Bug ID: BUG-MCP-006
- Production Redmine Issue ID: #129327 — "BUG-MCP-006: devops/gantt plugin auto-detection silently fails on a Redmine instance with zero projects" (reported, assigned to Prashant Chaurasia)
- Title: Plugin auto-detection silently fails for `devops` and `gantt` on a Redmine instance with zero projects — their probe's project-scoped fallback has no project id to retry with
- Redmine version: 6.0-bookworm (local Docker, `C:\crux-redmine-mcp-binary`, localhost:3016)
- Plugin name: Redmineflux MCP Server — Nuitka-compiled binary distribution (`feature/nuitka-compile` branch build), `redmineflux-mcp` v1.0.14 (commit `d9c1e8ce7152`)
- Plugin version: compiled binary package, SETUP.md header says "v1.0.0" but `serverInfo.version` reports `1.0.14+d9c1e8ce7152` (also worth noting as a minor doc/version-string mismatch — see Notes)
- Environment: Local Docker QA stack, fully isolated from `C:\crux-redmine` and `C:\crux-redmine-oauth61`
- Browser: N/A (direct MCP protocol calls via curl + Playwright for Redmine UI verification)
- User role: Admin
- Date: 2026-11-24

## Steps to reproduce

1. Stand up a completely fresh Redmine instance (zero projects, zero issues) with the `redmineflux-mcp` binary pointed at it.
2. Start/restart the `mcp` service and watch its startup logs for plugin detection.
3. Observe: `Plugin not detected: devops (skipped)` and `Plugin not detected: gantt (skipped)`, while every other installed plugin (agile, workload, timesheet, helpdesk, knowledgebase, crm, testcases_management, flux_tags, budget_audit, flux_issue_template, invoice, checklist) detects and loads correctly — `12/14` (or `13/14` if `gantt` genuinely isn't installed on a given server).
4. Call any `redmineflux_devops_*` or `redmineflux_gantt_*` tool — refused with `"Unknown tool: ..."` (the tools are entirely absent from the server's tool manifest, not just erroring).
5. Create one Redmine project (`POST /projects.json`), then restart the `mcp` service.
6. Startup logs now show: `GET http://redmine:3000/devops/builds.json "HTTP/1.1 400 Bad Request"` (no `project_id`) immediately followed by `GET http://redmine:3000/devops/builds.json?project_id=1 "HTTP/1.1 403 Forbidden"` and `Plugin devops probe returned 403 — plugin is installed but the detection probe was denied (401=auth, 403=permission). Loading tools anyway.` — `devops` (and `gantt`) now load correctly, `14/14`.

## Expected result

Plugin auto-detection should not depend on the target Redmine instance already having at least one project. A brand-new/fresh Redmine instance (the exact scenario this compiled-binary distribution's own `SETUP.md` is written for — "Quick test without systemd", first-time deployment) should detect every installed plugin correctly regardless of whether any project has been created yet, the same way the other 12 plugin groups already do (their own probes evidently don't require a project id to get a non-ambiguous response).

## Actual result

- With **zero projects**, `devops`'s (and `gantt`'s) detection probe calls the project-scoped endpoint with no `project_id`, gets a plain `400 Bad Request` (`{"error":"project_id is required"}`), and the detection logic has no fallback path for this response — it is treated as "plugin not installed" and the plugin (68 tools for devops, more for gantt) is silently skipped. The only trace is an `INFO`-level log line, not a warning — easy to miss entirely, and invisible to anyone using the compiled binary's own documented log line convention (`SETUP.md`'s own "Look for lines like these" instructions only mention the final tool-count summary, not per-plugin skip lines).
- With **at least one project present**, the SAME probe retries with `?project_id=<first project>`, gets `403 Forbidden` this time (no permission granted on that specific project yet — expected, since no role/module was configured), and this response IS handled gracefully ("plugin is installed but the detection probe was denied ... Loading tools anyway").
- Net effect: deploying this binary against a genuinely fresh Redmine instance — the exact first-time setup scenario `SETUP.md` walks through — silently loses the entire DevOps (and Gantt) toolset, with no clear signal to the operator beyond a buried INFO log line, until someone happens to create a project and restart the service.

## Secondary observation (same investigation, smaller, not the main finding)

Once the `devops` module was explicitly enabled on the fixture project and the tool genuinely loaded, calling `redmineflux_devops_list_builds(project_id="1")` as **admin** still returned `"Error: You do not have permission to view build."` — a misleading message, since admin should never be permission-blocked, and the project's `devops` module *was* enabled. This is most likely because this DevOps plugin's build/commit tools additionally require a connected repository record on the project (consistent with this repo's own established fixture pattern from earlier `MCP_DEVOPS_TOOL_COVERAGE.md` testing — a real repository always had to be connected before `list_builds` returned anything meaningful), and the "permission" wording is the wrong message for a "no repository configured" condition. Not chased further here since connecting a real repository is out of scope for a binary-packaging smoke test — flagging for whoever picks up DevOps-plugin-level QA, since it's the same "misleading error message instead of the real cause" class of issue as BUG-MCP-003.

## Severity

Medium — doesn't corrupt data and self-heals the moment any project exists, but on literal first-time setup (this package's own primary documented use case) it silently drops two entire plugin's worth of tools with no actionable operator-facing signal.

## Evidence

```
# Zero projects:
Plugin not detected: devops (skipped)
...
Redmineflux MCP v1.0.14 (commit d9c1e8ce7152134683a55a6574375976443a1bc0): 485 tools (93 core + 390 plugin + 2 crux). Detected plugins: agile, workload, timesheet, helpdesk, testcases_management, knowledgebase, budget_audit, flux_issue_template, invoice, flux_tags, checklist, crm (12/14).

# After creating one project + restarting mcp:
INFO:httpx:HTTP Request: GET http://redmine:3000/devops/builds.json "HTTP/1.1 400 Bad Request"
INFO:httpx:HTTP Request: GET http://redmine:3000/devops/builds.json?project_id=1 "HTTP/1.1 403 Forbidden"
INFO:redmineflux-mcp:Plugin devops probe returned 403 — plugin is installed but the detection probe was denied (401=auth, 403=permission). Loading tools anyway.
INFO:redmineflux-mcp:Loaded plugin: devops — 68 tools (...)
Redmineflux MCP v1.0.14 (commit d9c1e8ce7152134683a55a6574375976443a1bc0): 563 tools (93 core + 468 plugin + 2 crux). Detected plugins: ... devops ... gantt ... (14/14).
```

Direct REST confirmation of the raw probe response with zero projects:
```
GET /devops/builds.json  ->  400 Bad Request  {"error":"project_id is required"}
```

## Duplicate check

- Duplicate found: No — first finding on plugin auto-detection's project-count dependency. Related in spirit (not a duplicate) to BUG-MCP-003's "misleading message instead of the real cause" pattern, noted above as a secondary observation.
- Scope note: found while testing the Nuitka-compiled binary distribution specifically (`C:\crux-redmine-mcp-binary`); not yet confirmed whether the regular source-built `redmineflux-mcp` (`C:\crux-redmine`, `C:\crux-redmine-oauth61`) has the identical project-count-dependent detection logic, since both of those stacks already had projects by the time they were first tested this cycle. Worth a quick cross-check if this ever needs confirming as binary-specific vs. a general product behavior.
