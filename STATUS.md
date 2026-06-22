# QA Status Dashboard

| Plugin | Last Tested | Redmine Version | Open Bugs | Status |
|--------|-------------|-----------------|-----------|--------|
| testcase-management-plugin | 2026-05-20 | 6.2.0 | 1 | In Progress |
| redmineflux_advanced_field | 2026-05-21 | 6.0.9.stable | 0 | In Progress (51/51 positive TCs PASS, 2 bugs fixed & closed; workflow TCs TC-RAF-051–054 pending) |
| redmineflux_scarlet | 2026-06-04 | 6.1.2.stable.24650 | 4 | In Progress — Sessions 1+2 complete. 39 TCs total: 37 PASS, 1 FAIL (TC-RSC-005 priority icons), 1 INFO (Gantt on ztflux — module disabled). All core modules covered. 4 open bugs: BUG-RSC-001 activity.css 404 (Medium), BUG-RSC-002 lastJstPreviewed JS (Medium), BUG-RSC-003 priority SVG icons 404 (High), BUG-RSC-004 Tribute double-bind (Low). Remaining optional: issue attachments, saved queries, Wiki/Forum/News CRUD, project archive/delete, admin CRUD flows. |
| redmineflux_mcp | 2026-06-18 | Flux (dev-flux.zehntech.com) | 3 | In Progress — BUG-RFM-002 closed (not a bug — invalid to call team_data on deleted ID). 3 open: BUG-RFM-004 workload_show 500 on deleted ID (Medium), BUG-RFM-009 team author not shown (Low), BUG-RFM-010 Gantt overload clip UI-only (High). BUG-RFM-011 closed (fixed). 3 TCs still blocked (083/085/086). |
| redmineflux_mcp_issuetemplate | 2026-06-16 | Flux (dev-flux.zehntech.com) | 2 | In Progress — Sessions 1+2. 27 TCs: 22 PASS, 3 FAIL, 0 PENDING, 2 N/A. All 5 permissions verified for test1 in ztflux: View✓ Create✓ Edit✓ Apply✓ Delete✓. 2 open bugs: BUG-RIT-001 list_templates 500 on project_id filter (High); BUG-RIT-002 all template ops bypass project-level permission — server uses ANY-project check not per-target-project (High, found via test1 in gdaplt with no template perms). |
| redmineflux_mcp_checklist | — | — | 0 | Not Started |
| redmineflux_mcp_knowledgebase | 2026-06-19 | 5.x (localhost:3006) | 0 | **Complete** — Sessions 1+2+3: 39/39 TCs PASS via MCP tools. BUG-RKB-001 (Critical — MCP POST/PUT TypeError) found, fixed, and closed. Fix: added `params` kwarg to `RedmineClient.post()/put()`. All 14 KB MCP tools verified: spaces CRUD, folders, pages, publish/unpublish, version history, restore, permission enforcement (403 for developer writes). 0 open bugs. |
| redmineflux_devops | 2026-06-02 | 6.0.9 (Local) | 0 | Complete — ALL 86 bugs resolved and closed. BUG-028 FIXED: handle_workflow_run now calls find_matching_github_repository() to link build to correct repo connection so ArtifactFetcher uses the right API token. Verified: build-output + test-results artifacts show with Download links on build detail page. GitHub repo: Er-SourabhSingh/devops-plugin-test. Total closed: 85. Changes: devops_webhooks_controller.rb (BUG-011+056), shared/_oncall_widget.html.erb (BUG-084), incidents controller (BUG-085 locale keys), all 10 locale files (BUG-084/085/086), DB migration ran (title+assigned_to columns added). New fixes: BUG-009 (DORA endpoint 200), BUG-048 (coverage page), BUG-053 (alert env filter), BUG-054 (on-call widget), BUG-074 (admin override freeze), BUG-076 (compare 404), BUG-080 (locale strings fixed), BUG-082 (tooltip translated), BUG-083 (alerts empty state). Open (18): 011,017,026,028,029,050,051,052,056,057,060,067,069,073,077,084,085,086. Total closed: 67. |

## How to update

Update this file after every test run. One row per plugin.

**Status values:** `Not Started` / `In Progress` / `Complete`
