# redmineflux_devops Plugin — Complete Feature Inventory

> **Document Type**: QA Feature Inventory  
> **Plugin**: redmineflux_devops  
> **Source**: All RFD files in `backlog/done/` (rfd-001 through rfd-121, excluding .gitkeep)  
> **Date Generated**: 2026-05-21  
> **Total RFD Files Processed**: 121  

---

## Feature Categories

| # | Category | RFD Range |
|---|----------|-----------|
| 1 | Foundation / Core Infrastructure | rfd-001 to rfd-005 |
| 2 | SCM Integration (Commits, PRs, Branches) | rfd-006 to rfd-009, rfd-073 to rfd-075, rfd-105, rfd-106 |
| 3 | CI/CD — Build Management | rfd-010 to rfd-013, rfd-076 to rfd-079, rfd-104, rfd-108, rfd-109 |
| 4 | Deployments | rfd-014 to rfd-016, rfd-080 to rfd-083, rfd-110, rfd-111 |
| 5 | Release Management | rfd-017 to rfd-019, rfd-084 to rfd-086, rfd-112, rfd-113 |
| 6 | Test Results & Quality | rfd-020 to rfd-021, rfd-087 to rfd-089, rfd-114 |
| 7 | DORA Metrics | rfd-022 to rfd-025 |
| 8 | Monitoring & Alerting | rfd-026 to rfd-027, rfd-092, rfd-093, rfd-117, rfd-118 |
| 9 | Security Scanning & Compliance | rfd-028 to rfd-029, rfd-090, rfd-091, rfd-107, rfd-115, rfd-116 |
| 10 | Incidents | rfd-030 to rfd-031, rfd-094 to rfd-096, rfd-119 |
| 11 | Environments | rfd-032 to rfd-033, rfd-099, rfd-100, rfd-121 |
| 12 | Flow Metrics | rfd-097, rfd-098 |
| 13 | System / Settings / Notifications | rfd-101, rfd-102 |
| 14 | Custom Dashboard & Widgets | rfd-120 |

---

## Feature List

---

### Category 1 — Foundation / Core Infrastructure

| # | RFD | Feature | Description | Covered by TC |
|---|-----|---------|-------------|---------------|
| 1 | rfd-001 | Webhook Receiver | Single POST endpoint `/devops/webhook/:provider/:project_id` accepting webhooks from GitHub, GitLab, Jenkins, Prometheus, Zabbix, Datadog, SonarQube, Snyk, Trivy, ArgoCD, FOSSA. HMAC-SHA256 signature validation. Stores raw events in `redmineflux_devops_webhook_events` table for audit. Routes to provider-specific handler. |  |
| 2 | rfd-002 | Connection Manager | CRUD UI to manage SCM/CI connections per project. AES-256-CBC encrypted tokens stored in `redmineflux_devops_repositories`. Supports GitHub, GitLab, Bitbucket (SCM) and Jenkins (CI). |  |
| 3 | rfd-003 | Permission Model | 7 Redmine permissions: `view_devops`, `manage_devops_settings`, `trigger_builds`, `approve_deployments`, `manage_releases`, `manage_incidents`, `view_security_scans`. Plugin menu entry. 3 activity providers registered with `default: false`. |  |
| 4 | rfd-004 | REST API | JSON API with `accept_api_auth` authentication. Limit/offset pagination across all resource endpoints. |  |
| 5 | rfd-005 | Activity Stream | ViewHook `view_issues_show_details_bottom` renders a DevOps panel on the Redmine issue detail page showing related CI/CD and deployment activity. |  |

---

### Category 2 — SCM Integration (Commits, PRs, Branches)

| # | RFD | Feature | Description | Covered by TC |
|---|-----|---------|-------------|---------------|
| 1 | rfd-006 | Commit History | Push webhook handlers for GitHub and GitLab. Parses issue references from commit messages. Stores commit data in `redmineflux_devops_commits` table. |  |
| 2 | rfd-007 | PR / MR Tracking | Handles GitHub Pull Request and GitLab Merge Request webhook events. Stores records in `redmineflux_devops_pull_requests` with reviewers serialized as JSON. |  |
| 3 | rfd-008 | Branch Status Badges | Populates `checks_status` on pull request records from `check_suite` webhook events. Displays branch CI status as a badge. |  |
| 4 | rfd-009 | Auto Issue Transition on PR Merge | Per-project configurable auto-transition of linked Redmine issues when a PR/MR is merged. Uses `new_statuses_allowed_to` check to respect workflow guards. |  |
| 5 | rfd-073 | Branch Creation from Issue | `BranchCreator` service creates a branch directly from a Redmine issue page. Configurable naming template (default `feature/{issue_id}-{subject-slug}`). Supports GitHub and GitLab APIs. |  |
| 6 | rfd-074 | PR Review Dashboard | Widget listing all open PRs across the project's connected repositories. Displayed oldest-first. Configurable stale threshold. Reviewer avatar/pill display. |  |
| 7 | rfd-075 | Code Review Reminders | Handles `review_requested` webhook events. Maps reviewer GitHub/GitLab logins to Redmine users via `reviewer_login_map` project setting. Sends email notifications via `DevopsReviewMailer`. Daily digest available via rake task. |  |
| 8 | rfd-105 | Deterministic Multi-Repo Selection | Per-project default repository configuration. Three-step repository resolution precedence: params → project default setting → smallest ID. Rejects cross-project repository references with 404. `resolve_repository` helper shared across controllers. |  |
| 9 | rfd-106 | Commit Statistics per Project | `CommitStats` service computing daily and weekly aggregations. Top-N contributors list capped at 10. Configurable time window. Protected by `:view_devops_data` permission. |  |

---

### Category 3 — CI/CD — Build Management

| # | RFD | Feature | Description | Covered by TC |
|---|-----|---------|-------------|---------------|
| 1 | rfd-010 | Build Status on Issues | Shows the latest build status linked to a Redmine issue. `latest_for_issue` class method. Status badge with JavaScript polling every 30 seconds. |  |
| 2 | rfd-011 | Build History Timeline | Enhanced builds index page with date range filters and failure streak highlighting. |  |
| 3 | rfd-012 | Build Log Viewer | `BuildLogFetcher` service retrieves build logs from Jenkins/GitLab. Enforces a 10 MB cap on log size. Displays the last 200 lines by default. |  |
| 4 | rfd-013 | Trigger Build | `BuildTrigger` service initiates builds. Rate limited to 5 triggers per hour per project. |  |
| 5 | rfd-076 | Failed Build Auto-Comment | `FailedBuildCommenter` service. `after_save` callback on the Build model. Automatically adds a journal entry to linked Redmine issues when a build fails. |  |
| 6 | rfd-077 | Build Queue Status | `BuildQueueFetcher` service queries Jenkins/GitLab for queue depth. Result cached for 60 seconds. Computes median wait estimate. SsrfGuard applied to all outbound HTTP requests. |  |
| 7 | rfd-078 | Artifact Download Links | `redmineflux_devops_artifacts` table. `ArtifactFetcher` service retrieves artifact metadata from CI. Auth-gated proxy for downloads. Redirects to direct URL for artifacts above 50 MB. 15-minute freshness window for cached metadata. |  |
| 8 | rfd-079 | Flaky Test Detection | `FlakyTestScorer` service computes a flip-flop score (range 0.05–0.95) requiring a minimum of 10 runs over the last 50 builds. Tests with a score in this range are flagged as flaky. Exposed via `DevopsFlakyTestsController`. |  |
| 9 | rfd-104 | JUnit Ingestion REST Endpoint | REST endpoint `POST /devops/builds/:id/test_results` for webhook-triggered JUnit XML ingestion. `TestResultIngester` service. Idempotency enforced via `ingestion_key` SHA256 digest. Rate limited to 10 events per 60 seconds per project. Also exposes `rake ingest_junit` task. |  |
| 10 | rfd-108 | Pipeline Stage Breakdown | `redmineflux_devops_build_stages` table. `BuildStageIngestor` service handles stage data from GitHub Actions, GitLab CI, and Jenkins. Idempotent upsert on `(build_id, name)`. Stage timeline rendered on build detail page. |  |
| 11 | rfd-109 | Build Notifications — Email & Webhook | `BuildNotifier` service classifying build outcomes as failed, recovered, or succeeded. Sends email and Slack notifications (via `RedminefluxSlack.speak`) and Microsoft Teams notifications (via `RedminefluxTeams::TeamsMessage`). One-hour deduplication cache prevents duplicate notifications. Extends the rfd-101 notification framework. |  |

---

### Category 4 — Deployments

| # | RFD | Feature | Description | Covered by TC |
|---|-----|---------|-------------|---------------|
| 1 | rfd-014 | Deployment Tracking | Introduces two tables: `redmineflux_devops_environments` and `redmineflux_devops_deployments`. Records deployment events per environment. |  |
| 2 | rfd-015 | Environment Dashboard | Card layout showing all environments for a project. Auto-refreshes every 60 seconds. Uses GROUP BY aggregation to display deployment summary stats per environment. |  |
| 3 | rfd-016 | Deployment–Issue Linking | `deployment_issues` join table links deployments to Redmine issues. Issues are identified by analysing the commit range between deployments. |  |
| 4 | rfd-080 | Deployment Approval Gate | `approval_required` flag per environment. Requires dual authorisation (permission check + role membership). `DeploymentDispatcher` service enforces gate before dispatching. `:approve_deployments` permission. |  |
| 5 | rfd-081 | Rollback Tracking | Adds `is_rollback`, `reverts_deployment_id`, and `rollback_reason` columns to deployments. `ChangeFailureRate` DORA metric counts rollbacks in its failure denominator. |  |
| 6 | rfd-082 | Deployment Lock | `locked`, `locked_by_id`, `lock_reason`, and `locked_until` columns on environments. `DevopsEnvironmentLocksController` for CRUD. `unexpired_locks` scope used by all deployment dispatch paths. |  |
| 7 | rfd-083 | Post-Deployment Health Check | `DevopsPostDeployHealthJob` ActiveJob polls environment health every 30 seconds for up to 5 minutes after a deployment. Reuses `EnvironmentHealthChecker`. Automatically creates an incident if health check returns down. |  |
| 8 | rfd-110 | Canary / Progressive Rollout Status | Adds `rollout_percent`, `rollout_strategy`, and `rollout_status` columns to deployments. Handles ArgoCD webhook events (identified by User-Agent header). Progress bar rendered on deployment detail page. `rollout_percent` clamped to 0–100. |  |
| 9 | rfd-111 | Deploy from Redmine | `DeploymentDispatcher` triggers deployments via GitHub Actions `workflow_dispatch`, GitLab CI `play`, or Jenkins parameterised build from within Redmine. Environment-level `deploy_provider`, `deploy_workflow`, `deploy_ref_param` configuration columns. `:trigger_devops_deployment` permission. Pre-flight checks enforce freeze windows, deployment locks, and pending approvals. Rate limited to 5 triggers per hour. |  |

---

### Category 5 — Release Management

| # | RFD | Feature | Description | Covered by TC |
|---|-----|---------|-------------|---------------|
| 1 | rfd-017 | Release Management Dashboard | `releases` and `release_issues` tables. Dashboard listing all releases per project. IDOR protection: all lookups scoped to `@project`. |  |
| 2 | rfd-018 | Release Notes Generator | `ReleaseNotesGenerator` service produces Markdown-formatted release notes from linked issues and commits. Supports export to file. |  |
| 3 | rfd-019 | Release Approval Workflow | `release_approvals` table. `fully_approved?` helper. Approval records are immutable (no destroy). `:approve_release` permission. |  |
| 4 | rfd-084 | Semantic Version Suggestion | `SemverSuggester` service analyses Conventional Commits in the commit range and suggests the next MAJOR, MINOR, or PATCH version with a human-readable rationale. |  |
| 5 | rfd-085 | Release Blockers | `ReleaseBlockerFinder` service detects blocker issues via custom field or priority-based heuristic. Prevents approval transition when blockers are present. |  |
| 6 | rfd-086 | Git Tag Management | `GitTagger` service creates annotated tags via GitHub and GitLab APIs on release publish. Adds `tagged_at` and `tagged_by_id` audit columns to releases. |  |
| 7 | rfd-112 | Release Notes Editor | Adds `notes_html` and `notes_published_at` columns to releases. CKEditor WYSIWYG editor embedded in the release edit page. "Reset from Changelog" action regenerates notes from the `ReleaseNotesGenerator`. Output sanitised via Redmine's HTML allow-list. |  |
| 8 | rfd-113 | Hotfix Workflow | `HotfixCreator` service forks a hotfix branch from the release tag via GitHub/GitLab API. Suggests the next patch semver automatically. Auto-creates a linked issue in the Hotfix tracker. |  |

---

### Category 6 — Test Results & Quality

| # | RFD | Feature | Description | Covered by TC |
|---|-----|---------|-------------|---------------|
| 1 | rfd-020 | Test Results Integration | `test_results` table. JUnit XML parser using REXML. Bulk insert in batches of 500 records. |  |
| 2 | rfd-021 | Test Coverage Tracking | `coverage_reports` table. `CoverageTrend` service. SVG sparkline chart rendered on the project coverage page. |  |
| 3 | rfd-087 | Failed Test Auto-Create Issue | `redmineflux_devops_test_issue_links` table. From a failed test result, provides a pre-fill redirect to the Redmine new-issue form. Deduplication: if a linked issue already exists, shows it rather than offering to create another. |  |
| 4 | rfd-088 | Test–Requirement Traceability | `TestTagParser` service parses issue IDs embedded in test name tags. `issue_tags` CSV column on test results. Generates a traceability matrix with CSV export. Formula injection prevention (delimiter-wrapped `",123,"` format). |  |
| 5 | rfd-089 | Test Execution History | Per-test history page showing pass/fail over the last 30 builds (`HISTORY_LIMIT = 30`). SVG sparkline. Duration displayed with 99th-percentile capping to suppress outlier distortion. |  |
| 6 | rfd-114 | Test Duration Monitoring | `TestDurationStats` service computing suite duration trend and slowest-N test list. Test suites that have become more than 50% slower than their baseline are highlighted. Dedicated REST endpoint for programmatic access. |  |

---

### Category 7 — DORA Metrics

| # | RFD | Feature | Description | Covered by TC |
|---|-----|---------|-------------|---------------|
| 1 | rfd-022 | Deployment Frequency | `BaseMetric` class. DORA Elite/High/Medium/Low classification. `is_production` boolean column on environments to filter production-only deployments. |  |
| 2 | rfd-023 | Lead Time for Changes | Calculates lead time by correlating `deployment.commit_sha` with `commit.committed_at` from `redmineflux_devops_commits`. |  |
| 3 | rfd-024 | Change Failure Rate | `caused_incident` boolean on deployments. Failure rate denominator includes failed, rolled-back, and incident-causing deployments as a percentage of total. |  |
| 4 | rfd-025 | Mean Time to Recovery | Uses `redmineflux_devops_incidents` table duration data. `format_value` and `format_unit` helpers for human-readable output. |  |

---

### Category 8 — Monitoring & Alerting

| # | RFD | Feature | Description | Covered by TC |
|---|-----|---------|-------------|---------------|
| 1 | rfd-026 | Monitoring Alert Feed | `redmineflux_devops_alerts` table. Three webhook handlers: Prometheus AlertManager, Zabbix, and Datadog. Fingerprint-based deduplication prevents duplicate alert records. |  |
| 2 | rfd-027 | Alert Auto-Create Incident | `AlertIncidentCreator` service. Automatically creates an incident when a received alert meets or exceeds the configured severity threshold (SEC-004 requirement). |  |
| 3 | rfd-092 | Uptime Dashboard | `redmineflux_devops_health_samples` table. `UptimeCalculator` service computing 30-day and 90-day uptime percentages. Rendered as a dashboard widget. Optional retention rake task to prune old samples. |  |
| 4 | rfd-093 | On-Call Schedule | Fetches current on-call schedule from PagerDuty and Opsgenie APIs. Results cached for 15 minutes. Displayed as a sidebar widget on the project DevOps page. API tokens stored using AEAD encryption. |  |
| 5 | rfd-117 | Performance Metrics | `redmineflux_devops_monitoring_connections` table. `DatadogAdapter` and `PrometheusAdapter` classes. Project Performance tab showing 3 line charts (latency p50/p95, error rate, RPS) for the last 24 hours with vertical deployment markers. 60-second server-side cache. SSRF guard on all outbound adapter HTTP calls. |  |
| 6 | rfd-118 | Infrastructure Resource Usage | Extends monitoring connections with per-environment `cpu_query`, `memory_query`, and `disk_query` columns. Gauge component on environment cards showing current CPU/memory/disk percentage. Color thresholds: green < 70%, amber < 90%, red >= 90%. 60-second cache. Missing query renders as N/A rather than zero. |  |

---

### Category 9 — Security Scanning & Compliance

| # | RFD | Feature | Description | Covered by TC |
|---|-----|---------|-------------|---------------|
| 1 | rfd-028 | Vulnerability Scan Results | `redmineflux_devops_vulnerabilities` table. Three webhook handlers: SonarQube, Snyk, and Trivy. Ingests vulnerability findings from scanner webhooks. |  |
| 2 | rfd-029 | Dependency Vulnerability Alerts | `VulnerabilitySummary` service aggregates vulnerability counts by severity. Summary badge displayed on the project security dashboard. |  |
| 3 | rfd-090 | Security Gate for Deployments | `SecurityGate` service checks for CRITICAL severity vulnerabilities before allowing deployment. `security_gate_enabled` flag per environment. `:override_security_gate` permission allows bypassing the gate with a mandatory reason of 20+ characters. |  |
| 4 | rfd-091 | Compliance Checklist for Release | `redmineflux_devops_release_compliance_items` table. Automatic items (PRs merged, tests green, no critical vulnerabilities, required approvals) evaluated by `ComplianceEvaluator` service. Manual checklist items. Blocks the Publish transition until all items pass. |  |
| 5 | rfd-107 | Code Quality Gate Results | `redmineflux_devops_code_quality_results` table. SonarQube webhook handler stores gate outcomes. PR badge shows passed/failed/warn status. Results matched to PRs via `commit_sha`. |  |
| 6 | rfd-115 | License Compliance | `redmineflux_devops_dependency_licenses` table. FOSSA webhook handler ingests dependency license data. `LicenseRiskMapper` with YAML-driven risk config (GPL=high, LGPL=medium, MIT/Apache/BSD=low). Licenses tab with filter UI. Deduplication on `(project_id, dependency_name, version, source)`. |  |
| 7 | rfd-116 | Audit Trail for All DevOps Actions | `redmineflux_devops_audit_events` bigint table (append-only; no UI delete). `Auditable` concern mixed into all privileged DevOps controllers. Records actor, action, target, timestamp, IP, and `params_digest` (SHA256 of params with secrets excluded). Admin-only viewer at `/admin/devops_audit` with filters for user, action, and date range. Optional retention rake task `prune_audit_events_older_than`. |  |

---

### Category 10 — Incidents

| # | RFD | Feature | Description | Covered by TC |
|---|-----|---------|-------------|---------------|
| 1 | rfd-030 | Incident Tracker | Extends `redmineflux_devops_incidents` table with `affected_service` and `root_cause` columns. `has_many :alerts` association links monitoring alerts to incidents. |  |
| 2 | rfd-031 | Incident Timeline | `redmineflux_devops_incident_events` table. `IncidentTimelineBuilder` service aggregates events from 4 sources: alerts, deployments, status changes, and manual entries. Supports manual timeline entry via UI. REST API endpoint for programmatic access. |  |
| 3 | rfd-094 | Incident–Deployment Correlation | `related_deployment_id` foreign key on incidents. `IncidentDeployCorrelator` service identifies the most recent deployment within a configurable time window preceding the incident. Manual override available via UI. |  |
| 4 | rfd-095 | Post-Mortem Template | `PostMortemGenerator` service renders an ERB template into a Redmine wiki page. `post_mortem_wiki_page_id` stored on the incident. Versioned regeneration appends `-v2`, `-v3`, etc. to avoid overwriting prior versions. |  |
| 5 | rfd-096 | Escalation Rules | `DevopsIncidentEscalatorJob` ActiveJob. Adds `acknowledged_at`, `escalated_at`, and `escalation_level` columns to incidents. Per-severity timeout configuration. Targets a configured user or role. Auto-assigns linked issue on escalation. Escalation level incremented monotonically. |  |
| 6 | rfd-119 | Incident Communication Templates | `redmineflux_devops_incident_comm_templates` table. Four default templates (Initial detection, Investigating, Mitigated, Resolved) seeded at installation. `IncidentCommunicator` service performs variable substitution (`{{title}}`, `{{severity}}`, `{{started_at}}`, `{{status}}`, `{{affected_service}}`, `{{eta}}`). All substituted values run through `CGI.escapeHTML`. Unknown variables passed through literally. Dispatches via email (`deliver_later`) and Slack/Teams (reusing rfd-109 dispatcher). Appends a journal entry to the incident on send. Unique index prevents duplicate template names within a project. |  |

---

### Category 11 — Environments

| # | RFD | Feature | Description | Covered by TC |
|---|-----|---------|-------------|---------------|
| 1 | rfd-032 | Environment Registry Enhancements | Adds `environment_type` column (values: dev, staging, prod, custom) and `owner_id` column to `redmineflux_devops_environments`. `ENVIRONMENT_TYPES` constant. Named scopes: `by_type`, `production`, `non_production`. Auto-position ordering based on environment type. |  |
| 2 | rfd-033 | Environment Health Status | `EnvironmentHealthChecker` service. SSRF prevention using `Resolv.getaddress` + private IP blocking + DNS rebinding prevention (connects directly to resolved IP). Manual "Check Now" AJAX trigger. Lazy polling limited to a maximum of 5 stale environments simultaneously. |  |
| 3 | rfd-099 | Deployment Freeze Windows | `redmineflux_devops_freezes` table. Supports single-instance and weekly recurring freeze windows. `DeploymentDispatcher` checks for active freezes before dispatching. Full CRUD controller. |  |
| 4 | rfd-100 | Environment Provisioning Request | Migration auto-installs an "Environment Request" Redmine tracker with 5 custom fields. `DevopsEnvRequestsController`. `:provision_environment` permission. Auto-assigns requests and notifies watchers. 8 tests passing. |  |
| 5 | rfd-121 | Environment Comparison | `EnvironmentComparator` service (`lib/redmineflux_devops/services/environment_comparator.rb`). Compare endpoint `GET /projects/:project_id/devops_environments/compare?a=:env_a&b=:env_b`. Side-by-side view of env A and env B showing latest successful deployment version, SHA, and deploy time. Issue-diff computed from `redmineflux_devops_commits` in the time window between the two deployments (same heuristic as DORA lead-time calculator). Result cached 60 seconds keyed on both SHAs. Cross-project env IDs rejected with 404. No new tables. 11 tests / 38 assertions, all passing. |  |

---

### Category 12 — Flow Metrics

| # | RFD | Feature | Description | Covered by TC |
|---|-----|---------|-------------|---------------|
| 1 | rfd-097 | Cycle Time | `CycleTimeCalculator` service. Measures time from issue creation (`issue.created_on`) to first production deployment via the `deployment_issues` join. Computes mean, median, and P95 in days. Histogram bucket visualisation. |  |
| 2 | rfd-098 | Throughput | `ThroughputCalculator` service. Counts Redmine issues closed per week over a 12-week rolling window. Uses `DATE_TRUNC('week', closed_on)` GROUP BY query. Results displayed with a sparkline chart. |  |

---

### Category 13 — System / Settings / Notifications

| # | RFD | Feature | Description | Covered by TC |
|---|-----|---------|-------------|---------------|
| 1 | rfd-101 | Notification Configuration | `redmineflux_devops_notification_prefs` table. Matrix UI at `/my/devops_notifications` allowing each user to configure which DevOps events they receive notifications for (email, Slack, Teams). `upsert_matrix_for` bulk-upsert helper. Lazy defaults: no record until user saves. Self-service only (users manage their own preferences). |  |
| 2 | rfd-102 | Plugin Settings | Admin settings page under `Admin -> Plugins -> Configure`. `settings_partial` renders the DevOps configuration form. `SettingsValidator` enforces valid values. Sensitive fields (API tokens, keys) rendered as password inputs. Full suite: 990 runs, 2401 assertions, 0 failures. |  |

---

### Category 14 — Custom Dashboard & Widgets

| # | RFD | Feature | Description | Covered by TC |
|---|-----|---------|-------------|---------------|
| 1 | rfd-120 | Custom Metrics Dashboard | `redmineflux_devops_dashboards` table storing per-user layout as `layout_json` (array of `{widget_key, x, y, w, h, params}`). `Widgets` registry module with config-driven registration (one file per widget under `lib/redmineflux_devops/widgets/`). 8 starter widgets: `dora.deployment_frequency`, `dora.lead_time`, `dora.change_failure_rate`, `dora.mean_time_to_recovery`, `flow.cycle_time`, `flow.throughput`, `tests.flaky`, `security.vulnerabilities`. Native HTML5 drag-and-drop builder (no external JS dependency). Layout validated server-side against JSON schema (max 50 widgets, 12-column grid, integer coordinates, registered widget keys, params must be a Hash). Per-user layout persistence. `shared` flag allows a dashboard to be visible to all project members (requires `:manage_devops_settings`). Backwards-compatible: existing fixed dashboards untouched. 28 tests / 74 assertions, all passing. |  |

---

## Summary

| Metric | Count |
|--------|-------|
| Total features documented | 81 |

### Feature Breakdown by Category

| Category | Feature Count |
|----------|---------------|
| 1. Foundation / Core Infrastructure | 5 |
| 2. SCM Integration | 9 |
| 3. CI/CD — Build Management | 11 |
| 4. Deployments | 9 |
| 5. Release Management | 8 |
| 6. Test Results & Quality | 6 |
| 7. DORA Metrics | 4 |
| 8. Monitoring & Alerting | 6 |
| 9. Security Scanning & Compliance | 7 |
| 10. Incidents | 6 |
| 11. Environments | 5 |
| 12. Flow Metrics | 2 |
| 13. System / Settings / Notifications | 2 |
| 14. Custom Dashboard & Widgets | 1 |
| **Total Features** | **81** |

---

## Notes

1. **"Covered by TC" column** is intentionally left blank in all tables. This column is reserved for QA engineers to fill in with corresponding test case IDs from the test management system.

2. **Feature status notes**: rfd-117 (Performance Metrics) and rfd-118 (Infrastructure Resource Usage) have test cases listed as "pending" in their source files; all objectives checkboxes are unchecked. All three quality gates are listed as passed. Both are included as implemented features per their `status: Done` header.

6. **Database tables introduced** (cumulative across all RFDs): `redmineflux_devops_webhook_events`, `redmineflux_devops_repositories`, `redmineflux_devops_commits`, `redmineflux_devops_pull_requests`, `redmineflux_devops_environments`, `redmineflux_devops_deployments`, `redmineflux_devops_deployment_issues`, `redmineflux_devops_releases`, `redmineflux_devops_release_issues`, `redmineflux_devops_release_approvals`, `redmineflux_devops_test_results`, `redmineflux_devops_coverage_reports`, `redmineflux_devops_incidents`, `redmineflux_devops_alerts`, `redmineflux_devops_vulnerabilities`, `redmineflux_devops_incident_events`, `redmineflux_devops_artifacts`, `redmineflux_devops_build_stages`, `redmineflux_devops_freezes`, `redmineflux_devops_health_samples`, `redmineflux_devops_code_quality_results`, `redmineflux_devops_dependency_licenses`, `redmineflux_devops_audit_events`, `redmineflux_devops_monitoring_connections`, `redmineflux_devops_dashboards`, `redmineflux_devops_incident_comm_templates`, `redmineflux_devops_notification_prefs`, `redmineflux_devops_test_issue_links`, `redmineflux_devops_release_compliance_items`.

7. **Security patterns** applied consistently across the plugin: HMAC-SHA256 webhook signature validation; AES-256-GCM token encryption; SsrfGuard for all outbound HTTP; `secure_compare` for timing-safe comparison; project-scoped ActiveRecord lookups (IDOR prevention); `h()` / `ERB::Util.html_escape` / `CGI.escapeHTML` at all output points; append-only audit log.
