# Plugin Memory — Redmineflux DevOps

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

- The plugin has 7 permissions in code but the user-guide lists 10 permission entries (some are sub-permissions or aliases). QA tests use the 7 canonical permission names from requirements.md: `view_devops`, `manage_devops_settings`, `trigger_builds`, `approve_deployments`, `manage_releases`, `manage_incidents`, `view_security_scans`.
- "DevOps Engineer" is a custom role that must be created manually in Redmine — it is not a built-in role. Test setup must create this role if it does not exist.
- Token encryption uses AES-256-GCM; token fields in the plugin settings UI are write-only (cannot be read back after save). Test validation: save token, then verify it is not displayed in plaintext anywhere on the page.
- HMAC-SHA256 webhook signature is validated via `X-Hub-Signature-256` header (not `X-Hub-Signature`). Tests that send malformed webhooks must use this exact header name.
- Deployment freeze window blocks ALL deployments including those with `approve_deployments` permission — only admin can override.
- DORA metric recalculation is not always real-time; allow up to 60 seconds after a deployment event before asserting metric values in tests.
- The SSRF guard blocks webhook callback URLs pointing to private IP ranges (10.x, 172.16-31.x, 192.168.x, 127.x). Tests for SSRF guard should use these ranges as negative cases.
- Flaky test detection requires ≥3 consecutive alternating pass/fail results to flag a test as flaky. Single failures are not flagged.
- The "Covered by TC" column in features-list.md is intentionally blank — QA engineers fill it in after test execution.
- SUPPORTED_PROVIDERS = [github, gitlab, bitbucket, jenkins, sonarqube, fossa, prometheus, datadog, zabbix, pagerduty] — NOT snyk, trivy, or argocd (those return 400). TC-RDV-006 test data was incorrect for those 3.
- Auth header map per provider: github→X-Hub-Signature-256 (HMAC), gitlab→X-Gitlab-Token (plain), bitbucket→X-Hub-Signature (HMAC), jenkins→X-Jenkins-Token (plain, from global setting), sonarqube→X-Sonar-Webhook-HMAC-SHA256 (HMAC, global setting — BUG-RDV-003), fossa→X-FOSSA-Signature (HMAC, repo setting — BUG-RDV-004), prometheus/datadog/zabbix/pagerduty→X-DevOps-Token (plain, global setting).
- webhook_secret is stored and returned in plaintext in the Edit Repository form (only api_token_plain is encrypted). This is an observation — not confirmed as a bug.
- New connection initial status is `pending` — it only changes to `connected` after the Test Connection button is clicked (TC-RDV-011). TC-RDV-009 expected "connected" immediately; that expectation was incorrect.
- repo_name field in the Add/Edit Repository form must be "owner/repo" format (e.g., "Er-SourabhSingh/devops-plugin-test") NOT just the repo name alone. The server-side test_connection builds the GitHub API URL as `https://api.github.com/repos/#{repo_name}` — if owner is missing it returns a non-200 and the connection is marked "error". This was the root cause of repeated Test Connection failures in Session 3.
- Delete confirmation modal is #devops-repository-delete-modal (class "devops-repodel-backdrop"), not a native <dialog>. The confirm button is an `input[type=submit]` inside a Rails form with _method=delete. JS clicking visible buttons on the page can accidentally re-trigger row-level Delete buttons; use form.submit() on #devops-repository-delete-form directly.
- Developer role (ID 7) had view_devops added during Session 3 for TC-RDV-017 testing. It was NOT removed at session end — current state: Developer has view_devops.
- Flash message on connection creation is "Repository connection created successfully." (not "Connection saved successfully.") — minor wording difference from TC expectation.
- Test Connection button (TC-RDV-011): POST to /projects/<id>/devops_repositories/<repo_id>/test_connection returns {"status":"connected","message":"Connection verified — API access confirmed"}. Status badge updates to "connected" on page reload.
- Flash message on connection update is "Repository connection updated successfully." (verified TC-RDV-012).
- The DevOps roles admin panel shows 10 permissions, not 7. The 3 extras are: "Trigger deployments", "Approve releases", "Override security gate" — filed as BUG-RDV-006. All 7 documented permissions are present alongside them.
- Permission check order: trigger_builds check is done BEFORE resource lookup (TC-RDV-018 confirmed 403 returned without DB query). approve_deployments check may be AFTER resource lookup — 404 returned for non-existent build ID (TC-RDV-017).
- Build records in phoenix-platform (as of 2026-05-22): Build #42 (ID 451, github_actions, failed, master branch), Build #1 (ID 452, jenkins, pending). No deployment records exist.
- REST API endpoint /devops/builds.json returns 403 for unauthenticated (no cookie + no key) and for invalid API key (TC-RDV-019, TC-RDV-020). Use credentials:'omit' in fetch tests to strip session cookie.
- luna.blossom = Manager role on phoenix-platform (full DevOps access). daisy.skye = Developer (no DevOps permissions by default; view_devops was NOT added). autumn.grace = QA role (view_devops added for TC-RDV-016/017/018 testing).
- Developer role (ID 7) has no DevOps permissions by default. QA role (ID 11) had view_devops added during session 2 to enable TC-RDV-016 testing.

- Webhook background job throws ActiveRecord::RecordInvalid for minimal GitHub push payloads — event row is created (duplicate detection works) but enrichment step fails. Filed as BUG-RDV-007.
- TC-RDV-009 confirmed flash wording: "Repository connection created successfully." New connection initial status is "pending". Test connection created (ID 24) and deleted during session 4 — environment restored to 3 connections (IDs 19, 20, 21).
- TC-RDV-008 confirmed: event log caps at exactly 100 rows after 105 webhooks sent (scope :recent working correctly).

## Confirmed Working

- Webhook receiver: GitHub, GitLab, Bitbucket, Jenkins, Prometheus, Datadog, Zabbix, PagerDuty all accept valid payloads with 202 (TC-RDV-001, TC-RDV-006)
- HMAC replay protection: duplicate delivery_id returns 200 with `{"status":"ok","duplicate":true}` — no double-insert (TC-RDV-003)
- Async response: 202 returned in <100 ms before background job completes (TC-RDV-005, measured 59 ms)
- Event log `.recent` scope correctly limits display to 100 rows ordered by received_at DESC (TC-RDV-008)
- Token encryption: edit form renders token field empty with type=password and placeholder "(unchanged)"; raw PAT not in HTML source (TC-RDV-010)
- Connection Manager: Add Repository form creates connections for GitHub/GitLab/Bitbucket; flash "Repository connection created successfully." on success (TC-RDV-009)
- Plugin global settings: Jenkins webhook token and Monitoring webhook token saved correctly (masked with "•••••• (set — leave blank to keep)" after save)
- Test Connection button: correctly verifies PAT/API access against provider; flash "Connection test successful." on success; status updates to "connected" (TC-RDV-011, Session 3)
- Test Connection with invalid token: flash "Connection test failed. Check your credentials." (generic — does not include specific HTTP status); status updates to "error" (TC-RDV-012, Session 3)
- Edit Repository: updates persisted correctly, token remains masked, flash "Repository connection updated successfully." (TC-RDV-012 old session / TC-RDV-011)
- Delete Repository: admin can delete connections; row removed from list; confirmation dialog uses custom JS modal (#devops-repository-delete-modal) with Rails _method=delete form inside (TC-RDV-014)
- Role-based access control: users without DevOps permissions get 403 on all DevOps pages (TC-RDV-013)
- Non-member of private project gets 403 on all DevOps endpoints (TC-RDV-016)
- Developer with view_devops can access Deployments page (200); no Approve/Reject buttons shown when no deployment records exist (TC-RDV-017)
- trigger_builds permission: correctly blocks POST /devops_builds/{id}/trigger with 403 before resource lookup (TC-RDV-018)
- REST API: 403 returned for unauthenticated and invalid-key requests (TC-RDV-019, TC-RDV-020)
- All 6 original bugs (BUG-RDV-001 to BUG-RDV-006) confirmed present on new Forge (Session 3)
- BUG-RDV-007 confirmed on new Forge (Session 4) — webhook background job ActiveRecord::RecordInvalid

- REST API IDOR confirmed (BUG-RDV-008): daisy.skye (phoenix-platform only) reads builds from agileboard and commits from mobileappdev using her API key. All 9 non-member projects tested — all return 200 with data. Project membership check is completely absent from REST API controllers.
- DORA metrics route missing (BUG-RDV-009): GET /devops/metrics/dora.json → 404. All other 9 REST endpoints return 200. Only this route is absent.
- ActivityProvider not registered (BUG-RDV-010): No DevOps activity filters appear for any user in /projects/<id>/activity sidebar. Affects TC-RDV-024, TC-RDV-026, TC-RDV-038. ViewHook-based DevOps panel on issue pages (TC-RDV-025) is a separate mechanism and works correctly.
- Webhook event log access control incorrect (BUG-RDV-011): /projects/<id>/devops_webhooks returns 200 for Developer with view_devops only — should require manage_devops_settings. Controller uses wrong permission check.
- Notification preferences (/my/devops_notifications): save/persist works; flash text is "DevOps preferences updated." (not "Notification preferences saved." per spec). Slack/Teams notification channels absent from UI — only email and in-app available.
- Plugin settings page: stale_pr_threshold field not rendered in /settings/plugin/redmineflux_devops. Validator logic confirmed working on fields that do exist.
- Admin audit log (/admin/devops_audit): 270 events visible to Admin; non-admin redirected to /login. Confirmed working correctly.
- Build trigger endpoint returns 422 when Jenkins is not connected — rate limit logic (60 req/min) is never reached in this state.
- REST API pagination structure confirmed: builds.json returns total_count, limit, offset fields correctly. Data is 0 due to BUG-RDV-007 but response structure is valid.

## Recurring Issues

- HTTP status code semantics are wrong in two places: 401 returned for signature failure (should be 403), and 400 returned for unsupported provider (should be 404) — BUG-RDV-001, BUG-RDV-005
- SonarQube and FOSSA integrations are completely blocked due to missing UI configuration points — BUG-RDV-003, BUG-RDV-004
- Access control gaps at REST API layer: project-scoped authorisation absent (BUG-RDV-008) and wrong permission check on webhook event log (BUG-RDV-011)
- ActivityProvider not registered — all activity stream TCs fail for the same root cause (BUG-RDV-010)

## Environment Notes

- Forge environment credentials: QA_CREDENTIALS_FORGE.md
- Local environment credentials: QA_CREDENTIALS_LOCAL.md
- Never hardcode credentials or base URLs in test files or test case steps
- For webhook tests: the Redmine instance must be reachable from the CI tool's network (or use a local tunnel for local testing)
- Source plugin code location: c:\redmine\plugins\redmineflux_devops\
- Source RFD files: c:\redmine\plugins\redmineflux_devops\backlog\done\ (121 files: 81 features, 33 bugs, 7 tasks)
- Source docs location: c:\redmine\plugins\redmineflux_devops\docs\
- Local Docker environment: http://localhost:3008 (container xenodochial_heisenberg, port 3008→3000)
- Cloudflare tunnel (ephemeral): https://verbal-arms-daisy-vienna.trycloudflare.com → restart command: `& "$env:TEMP\cloudflared.exe" tunnel --url http://localhost:3008`
- Bitbucket auth quirk: plugin uses `Bearer #{api_token}` but Atlassian scoped API tokens require `Basic base64(email:token)` auth. Test Connection always fails for Bitbucket on this environment. Webhook delivery still works via X-Hub-Signature. Bitbucket workspace is `sourabhworkspace` (not `sourabhworkspace-admin`). Repo: sourabhworkspace/devops-plugin-test.
- Local env connection IDs: GitHub ID 1 (connected), GitLab ID 2 (connected), Bitbucket ID 3 (error — expected due to auth mismatch). All on project flux-erp-system.
