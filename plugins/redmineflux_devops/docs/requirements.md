# Plugin Requirements — Redmineflux DevOps

---

| Field | Value |
|-------|-------|
| **Document ID** | DEVOPS-CONSOLIDATED-001 |
| **Source Documents** | DEVOPS-REQ-001, DEVOPS-RES-001, MANUAL-TEST-PLAN |
| **Prepared By** | QA Documentation (consolidated from Mahendra Patidar originals) |
| **Original Date** | 2026-03-27 / 2026-03-30 |
| **Total Features Documented** | 80 (33 P0, 31 P1, 16 P2) |
| **Target Market** | SMEs (10–200 developers), self-hosted Redmine |

---

## Overview

The Redmineflux DevOps plugin turns Redmineflux into a **DevOps hub** — not just a project tracker, but the central place where code, builds, deployments, tests, incidents, and metrics all connect to your issues and projects.

The plugin is designed for small-to-medium enterprises (10–200 developers) using self-hosted Redmine. It covers the full DevOps lifecycle (Plan → Code → Build → Test → Release → Deploy → Operate → Monitor) and connects each stage back to Redmine issues and projects.

### Strategic Position

**Self-hosted. Modular. AI-agent-ready. Affordable.**

Unlike Jira (cloud-only, per-seat pricing) or Easy8/EasyRedmine (monolithic, €6.90/user/month), Redmineflux DevOps is:
- A Redmine plugin (self-hosted, data sovereignty)
- Modular (install only what you need)
- MCP-enabled (AI agents can trigger builds, check deployments, manage releases)
- Priced as part of the Redmineflux platform (no per-seat charges)
- **Bidirectional** — not just reads data from GitHub/GitLab, but triggers actions FROM Redmine

### The Gap Being Filled

| What exists today | What is missing |
|-------------------|----------------|
| AlphaNodes Redmine DevOps plugin | Read-only dashboard — cannot trigger builds or deployments from Redmine |
| Easy8/EasyRedmine DevOps solution | Expensive (€6.90/user/month), monolithic, not modular |
| Jira + Atlassian DevOps suite | Excellent but expensive, cloud-only, per-seat pricing |
| Azure DevOps | Enterprise-focused, overkill for SMEs |
| Plain Redmine | Repository browser exists but no CI/CD, no deployment tracking, no DORA metrics |

---

## Version Compatibility

- **Target platform:** Self-hosted Redmine
- **Pricing model:** Platform fee (no per-seat charge), part of the Redmineflux platform
- The plugin is designed to work alongside other Redmineflux plugins (Agile Board, Gantt, Workload, Dashboard, Testcase Management)
- The PLAN stage of the DevOps lifecycle is already covered by existing Redmineflux plugins; the DevOps plugin connects to those

---

## Key Features

The plugin covers 11 functional categories across 80 features:

| Category | Code | Total Features | P0 (Must-Have MVP) | P1 (Should-Have) | P2 (Nice-to-Have) |
|----------|------|:--------------:|:------------------:|:----------------:|:-----------------:|
| Source Code Management | SCM | 10 | 4 | 4 | 2 |
| CI/CD Pipeline | CICD | 10 | 4 | 4 | 2 |
| Deployment Tracking | DEP | 9 | 3 | 4 | 2 |
| Release Management | REL | 8 | 3 | 3 | 2 |
| Test Integration | TEST | 6 | 2 | 3 | 1 |
| Security & Compliance | SEC | 6 | 2 | 2 | 2 |
| Monitoring & Alerts | MON | 6 | 2 | 2 | 2 |
| Incident Management | INC | 6 | 2 | 3 | 1 |
| DevOps Metrics | MET | 7 | 4 | 2 | 1 |
| Environment Management | ENV | 5 | 2 | 2 | 1 |
| System / Infrastructure | SYS | 7 | 5 | 2 | 0 |
| **Total** | | **80** | **33** | **31** | **16** |

### UI Navigation

The DevOps section is accessible via a top-level "DevOps" tab within a Redmine project. Clicking the tab reveals a sub-navigation bar with **12 tabs**:

1. Builds
2. Commits
3. Pull Requests (PRs)
4. Deployments
5. Environments
6. Releases
7. Alerts
8. Security
9. Incidents
10. Metrics
11. Repos (Repositories)
12. Settings

Each tab loads a dedicated page (HTTP 200, no errors). The active tab is highlighted with a blue underline.

---

## Business Workflows

### Workflow 1: Developer Pushes Code — Automated Tracking

1. Developer pushes commits referencing issue IDs (e.g., `Fixes #123`, `refs #123`)
2. Webhook from GitHub/GitLab fires → Redmine records the commit linked to the issue
3. Commit appears in the issue's DevOps panel under "Commits"
4. Build is triggered in CI; GitHub Actions/GitLab CI/Jenkins fires a build webhook to Redmine
5. Build status badge updates on the issue in real time (blue=running, green=passed, red=failed)
6. If build fails: a journal entry (comment) is automatically posted on the issue with the first error line and a link to the full build log

### Workflow 2: Pull Request Lifecycle

1. Developer creates a PR/MR with the issue ID in the branch name or PR title
2. PR webhook fires → Redmine records the PR linked to the issue
3. PR card appears on the issue page with status badge (Open/Draft/Merged/Closed), reviewer names, approval status, and CI check results
4. When PR is merged: Redmine optionally auto-transitions the issue status (e.g., "In Review" → "Ready for QA") — configurable per project
5. Auto-transition adds a journal entry: "Status changed by DevOps integration (PR #45 merged)"

### Workflow 3: Deployment to Production

1. DevOps engineer initiates deployment (from CI/CD tool or from Redmine via DEP-009 button)
2. If the environment requires approval (configurable), a deployment request appears in Redmine with "Approve" / "Reject" buttons and a comment field
3. Authorized approvers (configurable roles) review and approve; rejected deployments are logged but not executed
4. Approved deployment proceeds; Redmine records the deployment event with version, commit SHA, environment, deployer, start/finish time, and status
5. The deployment is linked to issues included (parsed from commit range)
6. Post-deployment health checks fire; health status (Healthy/Degraded/Down) appears on the deployment card
7. Issues that are deployed get a badge: "Deployed to staging (v1.2.3)"

### Workflow 4: Release Management

1. PM creates a release linked to a Redmine version/milestone
2. Release Planning View shows issue counts (done / in-progress / blocked) with progress bars
3. Issues marked "Release Blocker" prevent the release from being published until resolved
4. PM clicks "Generate Changelog" / "Generate Notes" — changelog is auto-generated from closed issues and merged PRs, grouped by tracker type (Features, Bug Fixes, Security, Internal)
5. Notes are editable before publishing; can be exported as Markdown (.md) or HTML (.html)
6. Release approval workflow: Dev Lead → QA → PM (multi-role approval sequence)
7. After all approvals: DevOps engineer creates a git tag from Redmine ("Create Tag" button)

### Workflow 5: Incident Management

1. Monitoring alert fires from Prometheus/Zabbix/Datadog/PagerDuty → webhook received by Redmine
2. Alert appears in the alert feed on the project dashboard
3. Critical alerts automatically create a Redmine issue with tracker "Incident", priority "Urgent", pre-filled with alert details
4. Incident is assigned severity (SEV1 through SEV4) and tracked with a timeline
5. If incident is not acknowledged within a configurable timeout, escalation rules fire (configurable per severity)
6. Incident is correlated with recent deployments (incident timestamp vs. deployment timestamp)
7. After resolution: post-mortem is generated from incident data (pre-filled template with timeline, root cause section, action items)
8. MTTR (Mean Time to Recover) is auto-calculated and feeds into DORA metrics

### Workflow 6: AI Agent (MCP) Interaction

An AI agent can interact with the plugin through MCP tools:

```
Developer: "I just merged PR #45. Can you deploy it to staging and let me know when it's healthy?"

Agent:
  1. redmineflux_devops_list_pipelines  → checks build for PR #45 (passed)
  2. redmineflux_devops_deploy(env="staging", version="from-pr-45")  → triggers deploy
  3. (waits for webhook callback)
  4. redmineflux_devops_environment_status(env="staging")  → health check passed
  5. "PR #45 is deployed to staging and all health checks passed. Staging URL: https://staging.example.com"
```

---

## Permissions Matrix

The plugin adds the following Redmine role-based permissions. Roles referenced are standard Redmine roles; "DevOps" refers to a user with DevOps engineer responsibilities (may be mapped to Manager or a custom role).

| Permission / Action | Admin | Manager / Lead | Developer | QA | DevOps Engineer | Non-member |
|---------------------|:-----:|:--------------:|:---------:|:--:|:---------------:|:----------:|
| view_devops (see all DevOps data) | Yes | Yes | Yes | Yes | Yes | No |
| manage_devops_settings (configure connections, webhooks) | Yes | No | No | No | Yes | No |
| trigger_builds (rebuild from Redmine) | Yes | No | Yes | No | Yes | No |
| approve_deployments (approve production deploys) | Yes | Yes | No | No | Yes | No |
| manage_releases (create/approve releases) | Yes | Yes | No | No | No | No |
| manage_incidents (create/update incidents) | Yes | Yes | No | No | Yes | No |
| view_security_scans (see vulnerability data) | Yes | Yes | No | No | Yes | No |
| View Builds list | Yes | Yes | Yes | Yes | Yes | No |
| View Build logs | Yes | Yes | Yes | Yes | Yes | No |
| Click "Rebuild" button | Yes | No | Yes | No | Yes | No |
| View Commits | Yes | Yes | Yes | Yes | Yes | No |
| View Pull Requests | Yes | Yes | Yes | Yes | Yes | No |
| Create Branch from Issue | Yes | No | Yes | No | Yes | No |
| View Deployments | Yes | Yes | Yes | Yes | Yes | No |
| Approve Deployment | Yes | Yes | No | No | Yes | No |
| Lock / Unlock Environment | Yes | Yes | No | No | Yes | No |
| Trigger Deploy (DEP-009) | Yes | No | Yes | No | Yes | No |
| View Environments | Yes | Yes | Yes | Yes | Yes | No |
| View Releases | Yes | Yes | Yes | Yes | Yes | No |
| Create / Edit Release | Yes | Yes | No | No | No | No |
| Approve Release | Yes | Yes (Lead) | No | Yes | No | No |
| Generate Changelog / Release Notes | Yes | Yes | No | No | No | No |
| Export Release Notes (MD/HTML) | Yes | Yes | Yes | Yes | Yes | No |
| Create Git Tag | Yes | No | No | No | Yes | No |
| View Alerts | Yes | Yes | Yes | Yes | Yes | No |
| View Security / Vulnerabilities | Yes | Yes | No | No | Yes | No |
| View Incidents | Yes | Yes | Yes | Yes | Yes | No |
| Create Incident | Yes | Yes | Yes | No | Yes | No |
| View DORA Metrics | Yes | Yes | Yes | No | Yes | No |
| View Repositories | Yes | Yes | Yes | Yes | Yes | No |
| Add / Edit Repository Connection | Yes | No | No | No | Yes | No |
| View DevOps Settings | Yes | No | No | No | Yes | No |
| Save DevOps Settings | Yes | No | No | No | Yes | No |
| View Webhook Event Log | Yes | No | No | No | Yes | No |
| View DevOps Audit Log | Yes | No | No | No | No | No |
| Configure Escalation Rules | Yes | No | No | No | Yes | No |

**Note:** The exact role mapping (Manager vs. Lead vs. DevOps) is configurable via Redmine's Roles and Permissions admin panel under the "DevOps" section added by the plugin.

---

## Functional Requirements

### Category A: Source Code Management (SCM)

---

#### SCM-001: Commit History in Issue Activity — P0

**As a** developer, **I want to** see recent commits linked to my issue directly in the issue timeline, **so that** I can track code changes without switching to GitHub.

| Field | Value |
|-------|-------|
| Roles | Dev, QA, Lead |
| Integration | Webhook (GitHub/GitLab push event → Redmine) |
| UI | Issue sidebar tab "Commits" — shows last 20 commits with author, message, SHA link, diff stats |
| Redmine Link | Commit message contains issue ID (e.g., `Fixes #123` or `refs #123`) |

**Acceptance Criteria:**
- Commits appear in real-time when pushed (webhook-driven)
- Shows author avatar, commit message (first line), SHA (short + link), files changed count
- Clickable SHA links to GitHub/GitLab commit page
- Supports GitHub AND GitLab commit message formats
- Filters by branch

**Data Model:**
```
redmineflux_devops_commits: id, issue_id, project_id, repo_url, commit_sha, author_name, author_email, message, branch, files_changed, additions, deletions, committed_at, created_at
Index: issue_id, project_id, commit_sha (unique)
```

**Manual Test Coverage:** C1 (Commits list), C2 (SHA links), C3 (Branch filter)

---

#### SCM-002: Pull/Merge Request Tracking — P0

**As a** team lead, **I want to** see PR/MR status for each issue, **so that** I know where code review stands.

| Field | Value |
|-------|-------|
| Roles | Dev, QA, Lead, PM |
| Integration | Webhook (PR opened/updated/merged/closed events) |
| UI | Issue sidebar tab "Pull Requests" — PR card with status badge, reviewers, comments count |
| Redmine Link | PR branch name or title contains issue ID |

**Acceptance Criteria:**
- Shows PR title, author, status (Open/Draft/Merged/Closed), reviewer names and approval status
- Shows CI check results on the PR (pass/fail badges)
- Clickable link to PR on GitHub/GitLab
- When PR is merged, can optionally auto-update issue status (configurable: e.g., "In Review" → "Ready for QA")
- Supports multiple PRs per issue

**Data Model:**
```
redmineflux_devops_pull_requests: id, issue_id, project_id, external_id, repo_url, title, author, status (open/merged/closed/draft), url, branch_source, branch_target, reviewers (text/json), checks_status, merged_at, created_at, updated_at
Index: issue_id, external_id+repo_url (unique)
```

**Manual Test Coverage:** D1 (PR list), D2 (Status badges), D3 (PR detail)

---

#### SCM-003: Branch Status Badges — P0

**As a** developer, **I want to** see if my feature branch is mergeable and checks are passing, **so that** I know if I need to fix anything before requesting review.

| Field | Value |
|-------|-------|
| Roles | Dev |
| Integration | API (Redmine polls GitHub/GitLab branch status) or Webhook |
| UI | Issue sidebar — small badge next to branch name: green (mergeable + checks pass), yellow (behind main), red (conflicts or checks failing) |
| Redmine Link | Branch name contains issue ID (e.g., `feature/123-login-redesign`) |

**Acceptance Criteria:**
- Green/yellow/red badge with tooltip explaining status
- Shows number of commits ahead/behind default branch
- Links to PR if one exists for this branch
- Updates within 5 minutes of status change

---

#### SCM-004: Auto Issue Status on PR Merge — P0

**As a** PM, **I want** issues to automatically move to "Ready for QA" when the PR is merged, **so that** QA knows what to test without manual updates.

| Field | Value |
|-------|-------|
| Roles | PM, QA, Dev (all benefit) |
| Integration | Webhook (PR merged event) |
| UI | Project settings → DevOps → "Auto-transition rules" — configurable: PR merged → issue moves to [status] |
| Redmine Link | PR linked to issue → issue status changes |

**Acceptance Criteria:**
- Configurable per project: which source status → which target status on PR merge
- Can be disabled per project
- Adds journal entry: "Status changed by DevOps integration (PR #45 merged)"
- Only fires for PRs linked to issues (not unlinked PRs)

**Manual Test Coverage:** M1 (Settings page), M2 (Save settings — auto-transition checkbox and status dropdown)

---

#### SCM-005: Repository Connection Manager — P1

**As a** DevOps engineer, **I want to** connect GitHub/GitLab repos to Redmine projects through a UI, **so that** I don't need to edit config files.

| Field | Value |
|-------|-------|
| Roles | DevOps, Admin |
| Integration | OAuth or API token configuration |
| UI | Project settings → DevOps → "Repositories" — add repo URL, select provider, enter token |
| Redmine Link | Each repo linked to one or more projects |

**Acceptance Criteria:**
- Support GitHub (token or OAuth), GitLab (token or OAuth), Bitbucket (token)
- Test connection button — verifies API access
- Shows connection status (connected/error)
- Can link multiple repos to one project
- Stores tokens encrypted (not plaintext)

**Data Model:**
```
redmineflux_devops_repositories: id, project_id, provider (github/gitlab/bitbucket), repo_url, repo_name, api_token_encrypted, webhook_secret, status (connected/error), last_sync_at, created_at
Index: project_id, repo_url (unique per project)
```

**Manual Test Coverage:** L1 (Repo list), L2 (Provider badges), L3 (Connection status), L4 (Add repository form)

---

#### SCM-006: Branch Creation from Issue — P1

**As a** developer, **I want to** create a feature branch directly from a Redmine issue, **so that** the branch is automatically named with the issue ID.

| Field | Value |
|-------|-------|
| Roles | Dev |
| Integration | Bidirectional (Redmine calls GitHub/GitLab API to create branch) |
| UI | Button on issue page: "Create Branch" → creates `feature/{issue_id}-{slug}` from default branch |
| Redmine Link | Branch name includes issue ID |

**Acceptance Criteria:**
- Creates branch from default branch (main/master)
- Branch name format: `feature/{issue_id}-{subject-slug}` (configurable template)
- Shows success/error notification
- Branch immediately appears in SCM-003 badges

---

#### SCM-007: PR Review Dashboard Widget — P1

**As a** team lead, **I want** a dashboard widget showing all open PRs across my projects, **so that** I can spot review bottlenecks.

| Field | Value |
|-------|-------|
| Roles | Lead, PM |
| Integration | API (queries GitHub/GitLab for open PRs) |
| UI | Project dashboard widget — table: PR title, author, age, reviewers, checks status |
| Redmine Link | PRs linked to project repos |

**Acceptance Criteria:**
- Shows all open PRs for project repos, sorted by age (oldest first)
- Highlights PRs older than 2 days (configurable threshold)
- Shows reviewer approval status
- Click to open PR on GitHub/GitLab

---

#### SCM-008: Code Review Reminders — P1

**As a** developer, **I want** reminders when a PR assigned to me is waiting for review, **so that** I don't block my teammates.

| Field | Value |
|-------|-------|
| Roles | Dev |
| Integration | Webhook (review_requested event) + Redmine notification |
| UI | Redmine notification: "You have 3 pending code reviews" |
| Redmine Link | Notification links to issue associated with the PR |

---

#### SCM-009: Commit Statistics Per Project — P2

**As a** PM, **I want** to see commit activity graphs for my project, **so that** I can understand development velocity.

| Field | Value |
|-------|-------|
| Roles | PM, Lead |
| Integration | Aggregation from redmineflux_devops_commits table |
| UI | Project dashboard widget — commit frequency chart (daily/weekly), top contributors |

---

#### SCM-010: Code Quality Gate Results — P2

**As a** team lead, **I want** SonarQube quality gate results shown on PRs, **so that** I know if code quality standards are met before merging.

| Field | Value |
|-------|-------|
| Roles | Lead, Dev |
| Integration | Webhook (SonarQube → Redmine) or API |
| UI | Badge on PR card: "Quality Gate: Passed/Failed" with metrics (bugs, vulnerabilities, code smells, coverage) |

---

### Category B: CI/CD Pipeline (CICD)

---

#### CICD-001: Build Status on Issues — P0

**As a** developer, **I want to** see the build status for my issue's branch directly on the issue page, **so that** I know if my code is building successfully.

| Field | Value |
|-------|-------|
| Roles | Dev, QA |
| Integration | Webhook (GitHub Actions/GitLab CI/Jenkins build events) |
| UI | Issue sidebar — build status badge: running (blue spinner), passed (green check), failed (red X), with link to build |
| Redmine Link | Build linked to issue via branch name or commit SHA |

**Acceptance Criteria:**
- Real-time update via webhook (no polling delay)
- Shows latest build for the issue's linked branch
- Badge color: blue (running), green (passed), red (failed), gray (no builds)
- Click badge → opens build detail page (either in Redmine or external CI)
- Shows build duration

**Data Model:**
```
redmineflux_devops_builds: id, project_id, issue_id, repo_url, build_number, external_id, provider (github_actions/gitlab_ci/jenkins), status (pending/running/success/failed/cancelled), branch, commit_sha, started_at, finished_at, duration_seconds, url, trigger (push/pr/manual/schedule), created_at
Index: project_id, issue_id, external_id+provider (unique)
```

**Manual Test Coverage:** N3 (Build badge on issue page), B1–B10 (Builds section)

---

#### CICD-002: Build History Timeline — P0

**As a** DevOps engineer, **I want** a build history view for each project, **so that** I can spot patterns in failures.

| Field | Value |
|-------|-------|
| Roles | DevOps, Lead |
| Integration | Aggregation from redmineflux_devops_builds table |
| UI | Project page → "Builds" tab — timeline of builds with pass/fail icons, duration, branch, trigger type |

**Acceptance Criteria:**
- Filterable by branch, status, date range
- Shows build duration trend (getting slower? faster?)
- Highlights consecutive failures
- Pagination (50 builds per page)

**Manual Test Coverage:** B1 (Builds list), B2 (Date range filter), B3 (Branch filter), B4 (Status filter), B5 (Summary stats bar), B6 (Duration bars), B7 (Pagination)

---

#### CICD-003: Build Log Viewer — P0

**As a** developer, **I want to** view build logs directly in Redmine when a build fails, **so that** I don't need to switch to Jenkins/GitHub to debug.

| Field | Value |
|-------|-------|
| Roles | Dev, DevOps |
| Integration | API (fetch logs from CI tool on demand) |
| UI | Build detail page → expandable log viewer (last 200 lines by default, "Show Full Log" button) |

**Acceptance Criteria:**
- Fetches logs on demand (not stored permanently — too large)
- Shows last 200 lines by default with "Load More" / "Full Log" options
- Error lines highlighted in red
- Monospace font, proper formatting preserved
- Works for GitHub Actions, GitLab CI, and Jenkins

**Manual Test Coverage:** B9 (View Build Log)

---

#### CICD-004: Trigger Build from Redmine — P0

**As a** developer, **I want to** trigger a rebuild from Redmine when a build fails due to flakiness, **so that** I don't need to open GitHub/Jenkins just to click "Rebuild."

| Field | Value |
|-------|-------|
| Roles | Dev, DevOps |
| Integration | Bidirectional (Redmine calls GitHub Actions workflow_dispatch / Jenkins build API / GitLab pipeline trigger) |
| UI | "Rebuild" button on build cards and build detail page |

**Acceptance Criteria:**
- Button visible only to users with DevOps (trigger_builds) permission
- Triggers build on the same branch/commit
- Shows "Build triggered" confirmation with link to new build
- Rate-limited (max 5 manual triggers per hour per user)

**Manual Test Coverage:** B10 (Rebuild button visible for admin, shows confirmation dialog)

---

#### CICD-005: Failed Build Auto-Comment on Issue — P1

**As a** developer, **I want** a comment automatically posted on my issue when the build fails, **so that** I know immediately without checking CI.

| Field | Value |
|-------|-------|
| Roles | Dev (notified) |
| Integration | Webhook (build failed event) |
| UI | Journal entry on issue: "Build #456 failed on branch feature/123-login. Error: [first error line]. [Link to full log]" |

**Acceptance Criteria:**
- Only comments on failure (not on success — too noisy)
- Includes first error line from log (if available)
- Includes link to full build log
- Configurable: can disable per project

---

#### CICD-006: Build Queue Status — P1

**As a** DevOps engineer, **I want to** see how many builds are queued and estimated wait times, **so that** I can manage CI capacity.

| Field | Value |
|-------|-------|
| Roles | DevOps |
| Integration | API (Jenkins queue API, GitHub Actions pending runs) |
| UI | Project dashboard widget — "Build Queue: 3 waiting, ~5 min estimated" |

---

#### CICD-007: Artifact Download Links — P1

**As a** QA engineer, **I want** download links for build artifacts (APK, binary, Docker image tag), **so that** I can test the latest build.

| Field | Value |
|-------|-------|
| Roles | QA, Dev |
| Integration | API (CI artifact APIs) |
| UI | Build detail page → "Artifacts" section with download links |

---

#### CICD-008: Flaky Test Detection — P1

**As a** lead, **I want** the system to detect tests that intermittently fail, **so that** we can prioritize fixing them.

| Field | Value |
|-------|-------|
| Roles | Lead, QA |
| Integration | Analysis of redmineflux_devops_builds + redmineflux_devops_test_results |
| UI | Project page → "Flaky Tests" — table showing tests that failed in >10% of recent builds |

---

#### CICD-009: Pipeline Stage Breakdown — P2

**As a** developer, **I want to** see which stage of the pipeline failed (build, test, lint, deploy), **so that** I know where to look.

| Field | Value |
|-------|-------|
| Roles | Dev |
| Integration | Webhook (CI stage events — GitHub Actions jobs, GitLab CI stages) |
| UI | Build detail → stage list: Build ✓ → Test ✗ → Deploy (skipped) |

**Data Model:**
```
redmineflux_devops_build_stages: id, build_id, name, status, started_at, finished_at, duration_seconds, log_url
Index: build_id
```

---

#### CICD-010: Build Notifications via Email/Webhook — P2

**As a** developer, **I want** configurable build notifications, **so that** I get alerted through my preferred channel.

| Field | Value |
|-------|-------|
| Roles | Dev, DevOps |
| Integration | Redmine email + webhook to Slack/Teams |
| UI | User settings → DevOps Notifications → toggle: email/Slack/none for each event type |

---

### Category C: Deployment Tracking (DEP)

---

#### DEP-001: Deployment History Per Environment — P0

**As a** QA engineer, **I want to** see what's deployed to staging right now and when it was deployed, **so that** I know what to test.

| Field | Value |
|-------|-------|
| Roles | QA, Dev, DevOps, PM |
| Integration | Webhook (deploy events from CI/CD or ArgoCD) |
| UI | Project page → "Deployments" tab — table: environment, version, deployer, time, status |

**Acceptance Criteria:**
- Shows current version per environment (dev, staging, production)
- Full deployment history with rollback indicators
- Filterable by environment and date range
- Deployment linked to issues (via commits in the deployed version)

**Data Model:**
```
redmineflux_devops_deployments: id, project_id, environment_id, version, commit_sha, deployed_by, status (success/failed/rolling_back/rolled_back), url, started_at, finished_at, created_at
redmineflux_devops_environments: id, project_id, name, url, current_version, status (healthy/degraded/down), last_deploy_at, created_at
Index: project_id+environment_id, environment_id
```

**Manual Test Coverage:** E1 (Deployments list), E2 (Environment filter), E3 (Status filter), E4 (Deployment detail)

---

#### DEP-002: Environment Dashboard — P0

**As a** PM, **I want** a single view showing all environments with their current deployed version and health status, **so that** I know the state of the system at a glance.

| Field | Value |
|-------|-------|
| Roles | PM, DevOps, Lead |
| Integration | Aggregation from redmineflux_devops_environments + redmineflux_devops_deployments |
| UI | Project dashboard widget — cards per environment: name, version, status light (green/yellow/red), last deploy time |

**Manual Test Coverage:** F1 (Environment cards), F2 (Status light colors), F3 (Deploy stats)

---

#### DEP-003: Deployment-to-Issue Linking — P0

**As a** PM, **I want** to know which issues are included in a deployment, **so that** I can track what shipped.

| Field | Value |
|-------|-------|
| Roles | PM, QA |
| Integration | Commit parsing (deployment commit range → extract issue IDs from commit messages) |
| UI | Deployment detail page → "Issues Included" — list of issues with links |
| Also | Issue page shows badge: "Deployed to staging (v1.2.3)" |

**Manual Test Coverage:** E5 (Issues included on deployment detail)

---

#### DEP-004: Deployment Approval Gate — P1

**As a** DevOps engineer, **I want** production deployments to require approval in Redmine, **so that** we don't deploy without sign-off.

| Field | Value |
|-------|-------|
| Roles | DevOps, Lead, PM |
| Integration | Bidirectional (Redmine holds deployment until approved, then triggers deploy) |
| UI | Deployment request page with "Approve" / "Reject" buttons + comment field |

**Acceptance Criteria:**
- Configurable: which environments require approval (typically only production)
- Configurable: which roles can approve
- Audit trail: who approved, when, with what comment
- Rejected deployments are logged but not executed

---

#### DEP-005: Rollback Tracking — P1

**As a** DevOps engineer, **I want** rollback events recorded with reason, **so that** we have a history of what went wrong.

| Field | Value |
|-------|-------|
| Roles | DevOps |
| Integration | Webhook (rollback event) or manual entry |
| UI | Deployment timeline — rollback events marked with red revert icon + reason |

---

#### DEP-006: Deployment Lock — P1

**As a** developer, **I want to** check if someone else is deploying or if there's a deployment freeze, **so that** I don't deploy during a critical time.

| Field | Value |
|-------|-------|
| Roles | Dev, DevOps |
| Integration | Internal (Redmine-managed) |
| UI | "Deploy" button disabled when lock is active, shows who locked and why. "Can I deploy?" status on environment dashboard. |

---

#### DEP-007: Post-Deployment Health Check — P1

**As a** DevOps engineer, **I want** health check results shown after deployment, **so that** I know if the deployment is healthy.

| Field | Value |
|-------|-------|
| Roles | DevOps, QA |
| Integration | Webhook (health check callback) or API (custom health endpoint) |
| UI | Deployment card shows health status: Healthy / Degraded / Down |

---

#### DEP-008: Canary/Progressive Rollout Status — P2

**As a** DevOps engineer, **I want to** see canary deployment progress (10% → 50% → 100%), **so that** I can monitor gradual rollouts.

| Field | Value |
|-------|-------|
| Roles | DevOps |
| Integration | ArgoCD API / custom webhook |
| UI | Progress bar on deployment card showing rollout percentage |

---

#### DEP-009: Deploy from Redmine — P2

**As a** developer, **I want to** trigger a deployment to staging from Redmine, **so that** I don't need to access the CI/CD tool.

| Field | Value |
|-------|-------|
| Roles | Dev, DevOps |
| Integration | Bidirectional (Redmine triggers deployment pipeline) |
| UI | Environment card → "Deploy" button → select version/branch → confirm |

---

### Category D: Release Management (REL)

---

#### REL-001: Release Planning View — P0

**As a** PM, **I want** a release planning view showing which issues are targeted for the next release, their status, and blockers, **so that** I can track release readiness.

| Field | Value |
|-------|-------|
| Roles | PM, Lead |
| Integration | Redmine versions + redmineflux_devops_deployments |
| UI | Project page → "Releases" tab — release timeline with issue counts (done/in-progress/blocked) |

**Manual Test Coverage:** G1 (Release timeline — split view: Upcoming with progress bars + Past releases), G2 (Progress bars), G3 (Issue counts showing done/blocked), G4 (Release detail), G5 (Issues table), G6 (Blocked issues highlighted)

---

#### REL-002: Auto-Generated Changelog — P0

**As a** PM, **I want** changelogs auto-generated from closed issues and merged PRs, **so that** I don't manually compile release notes.

| Field | Value |
|-------|-------|
| Roles | PM, Lead |
| Integration | Redmine issues + redmineflux_devops_pull_requests + git tags |
| UI | Release detail page → "Generate Changelog" button → markdown output grouped by: Features, Bug Fixes, Security, Internal |

**Acceptance Criteria:**
- Groups issues by tracker type (Feature, Bug, Task, Security)
- Includes PR links for each issue
- Editable before publishing
- Export as markdown or HTML
- Links to Redmine version/milestone

**Manual Test Coverage:** G7 (Generate Notes button), G8 (Notes display — markdown formatted), G9 (Export Markdown — downloads .md), G10 (Export HTML — downloads .html)

---

#### REL-003: Release Approval Workflow — P0

**As a** PM, **I want** releases to require multi-role approval (Dev Lead → QA → PM) before being published, **so that** nothing ships without sign-off.

| Field | Value |
|-------|-------|
| Roles | PM, Lead, QA |
| Integration | Internal (Redmine roles + custom workflow) |
| UI | Release page → approval status bar showing who approved/pending |

---

#### REL-004: Semantic Version Suggestion — P1

**As a** developer, **I want** the system to suggest the next version number based on commit types, **so that** we follow semver consistently.

| Field | Value |
|-------|-------|
| Roles | Dev, DevOps |
| Integration | Conventional Commits parsing from git log |
| UI | Release creation form → suggested version with explanation: "v1.3.0 (MINOR — 2 features, 3 fixes)" |

---

#### REL-005: Release Blockers — P1

**As a** PM, **I want** issues marked "Release Blocker" to prevent release until resolved, **so that** critical bugs don't ship.

| Field | Value |
|-------|-------|
| Roles | PM, QA |
| Integration | Redmine issue custom field or priority |
| UI | Release page → "Blockers (2)" section with blocker issues listed |

---

#### REL-006: Git Tag Management — P1

**As a** DevOps engineer, **I want to** create git tags from Redmine when a release is approved, **so that** the tagged version matches the release.

| Field | Value |
|-------|-------|
| Roles | DevOps |
| Integration | Bidirectional (Redmine calls GitHub/GitLab tag API) |
| UI | Release page → "Create Tag" button after all approvals |

---

#### REL-007: Release Notes Editor — P2

**As a** PM, **I want** a rich text editor for release notes pre-populated from the changelog, **so that** I can polish the notes before publishing.

| Field | Value |
|-------|-------|
| Roles | PM |
| Integration | Internal (Redmine wiki integration) |
| UI | Release page → "Release Notes" tab with WYSIWYG editor |

---

#### REL-008: Hotfix Workflow — P2

**As a** developer, **I want** a streamlined hotfix workflow that creates a branch from the latest release tag, **so that** emergency fixes are fast.

| Field | Value |
|-------|-------|
| Roles | Dev, DevOps |
| Integration | Bidirectional (create branch from tag via GitHub/GitLab API) |
| UI | Release page → "Create Hotfix" button → creates `hotfix/v1.2.1` branch |

**Manual Test Coverage:** G11 (Create release — New Release form), G12 (Edit release — edit form pre-filled)

---

### Category E: Test Integration (TEST)

---

#### TEST-001: Automated Test Results Display — P0

**As a** QA engineer, **I want to** see automated test pass/fail results from CI builds inside Redmine, **so that** I know what's passing.

| Field | Value |
|-------|-------|
| Roles | QA, Dev |
| Integration | Webhook (JUnit XML / CI test reports) |
| UI | Build detail page → "Test Results" — X passed, Y failed, Z skipped. Expandable list of failed tests with error messages. |

**Data Model:**
```
redmineflux_devops_test_results: id, build_id, test_name, test_class, status (passed/failed/skipped/error), duration_ms, error_message, stack_trace, created_at
Index: build_id, status
```

---

#### TEST-002: Test Coverage Trend — P0

**As a** lead, **I want to** see code coverage percentage and trend over time, **so that** I know if coverage is improving or declining.

| Field | Value |
|-------|-------|
| Roles | Lead, QA |
| Integration | Webhook (Codecov, Coveralls, CI coverage output) |
| UI | Project dashboard widget — coverage % with trend arrow (up/down) and sparkline chart |

---

#### TEST-003: Failed Test → Auto-Create Issue — P1

**As a** QA engineer, **I want** an option to auto-create a Redmine issue from a failed test, **so that** bugs are tracked automatically.

| Field | Value |
|-------|-------|
| Roles | QA |
| Integration | Internal (redmineflux_devops_test_results → Redmine issue API) |
| UI | Failed test row → "Create Issue" button → pre-fills subject, description with error + stack trace |

---

#### TEST-004: Test-to-Requirement Traceability — P1

**As a** QA lead, **I want** to see which tests cover which requirements/issues, **so that** I know our test coverage gaps.

| Field | Value |
|-------|-------|
| Roles | QA, Lead |
| Integration | Connects with Testcase Management plugin |
| UI | Traceability matrix: Issue → Test Cases → Latest Results |

---

#### TEST-005: Test Execution History — P1

**As a** developer, **I want** to see how a specific test has performed over the last 30 builds, **so that** I can identify flaky tests.

| Field | Value |
|-------|-------|
| Roles | Dev, QA |
| Integration | Aggregation from redmineflux_devops_test_results |
| UI | Test detail page → execution history chart (pass/fail per build) |

---

#### TEST-006: Test Duration Monitoring — P2

**As a** DevOps engineer, **I want** to track test suite execution time trends, **so that** I can catch tests that are getting slower.

| Field | Value |
|-------|-------|
| Roles | DevOps |
| Integration | Aggregation from redmineflux_devops_test_results |
| UI | Project dashboard widget — test duration trend chart |

---

### Category F: Security & Compliance (SEC)

---

#### SEC-001: Vulnerability Scan Results — P0

**As a** security person, **I want** SAST/DAST scan results shown per project, **so that** I can track security posture.

| Field | Value |
|-------|-------|
| Roles | Security, Lead, DevOps |
| Integration | Webhook (SonarQube, Snyk, Trivy scan results) |
| UI | Project page → "Security" tab — vulnerability list with severity (Critical/High/Medium/Low), file location, description |

**Data Model:**
```
redmineflux_devops_vulnerabilities: id, project_id, build_id, scanner (sonarqube/snyk/trivy), severity (critical/high/medium/low), title, description, file_path, line_number, cve_id, status (open/fixed/ignored), found_at, fixed_at
Index: project_id, severity, status
```

**Manual Test Coverage:** I1 (Vulnerability list), I2 (Summary counts — critical/high/medium/low/total), I3 (Severity filter), I4 (Empty state)

---

#### SEC-002: Dependency Vulnerability Alerts — P0

**As a** developer, **I want** alerts when my project has known CVEs in dependencies, **so that** I can update before attackers exploit them.

| Field | Value |
|-------|-------|
| Roles | Dev, Security |
| Integration | Snyk, Dependabot, GitLab dependency scanning |
| UI | Project dashboard widget — "3 Critical, 5 High vulnerabilities" badge |

---

#### SEC-003: Security Gate on Deployments — P1

**As a** security person, **I want** deployments blocked when critical vulnerabilities are open, **so that** insecure code doesn't reach production.

| Field | Value |
|-------|-------|
| Roles | Security, DevOps |
| Integration | Internal (check redmineflux_devops_vulnerabilities before allowing deploy) |
| UI | Deploy button → "Blocked: 2 critical vulnerabilities must be resolved first" |

---

#### SEC-004: Compliance Checklist Per Release — P1

**As a** PM, **I want** a compliance checklist for each release (code review done? tests pass? security scan clear? approval obtained?), **so that** nothing ships incomplete.

| Field | Value |
|-------|-------|
| Roles | PM, QA, Security |
| Integration | Aggregation from all other DevOps data |
| UI | Release page → "Compliance" — checklist with auto-checked items from data + manual checkboxes |

---

#### SEC-005: License Compliance — P2

**As a** legal/compliance person, **I want** to see open-source licenses used in the project, **so that** we don't violate license terms.

| Field | Value |
|-------|-------|
| Roles | Security, PM |
| Integration | FOSSA, Snyk license scanning |
| UI | Project page → "Licenses" — list of dependencies with license type and risk level |

---

#### SEC-006: Audit Trail for All DevOps Actions — P2

**As an** admin, **I want** a complete audit log of who triggered builds, approved deployments, created releases, **so that** we have accountability.

| Field | Value |
|-------|-------|
| Roles | Admin, Security |
| Integration | Internal (all DevOps actions logged) |
| UI | Admin → "DevOps Audit Log" — filterable by user, action type, date |

---

### Category G: Monitoring & Alerts (MON)

---

#### MON-001: Monitoring Alert Feed — P0

**As a** DevOps engineer, **I want** production alerts from Prometheus/Zabbix/Datadog shown in Redmine, **so that** I see them alongside my project work.

| Field | Value |
|-------|-------|
| Roles | DevOps, Lead |
| Integration | Webhook (Prometheus AlertManager, Zabbix, PagerDuty, Datadog) |
| UI | Project dashboard widget — alert feed with severity, source, time, status (firing/resolved) |

**Data Model:**
```
redmineflux_devops_alerts: id, project_id, source (prometheus/zabbix/datadog/pagerduty), severity (critical/warning/info), title, description, status (firing/resolved), alert_url, fired_at, resolved_at, created_at
Index: project_id, status, severity
```

**Manual Test Coverage:** H1 (Alerts list — table with severity/title/source/status/times), H2 (Summary bar — X firing, Y critical, Z resolved today), H3 (Empty state)

---

#### MON-002: Alert → Auto-Create Incident — P0

**As a** DevOps engineer, **I want** critical alerts to automatically create a Redmine incident issue, **so that** incidents are tracked without manual work.

| Field | Value |
|-------|-------|
| Roles | DevOps |
| Integration | Webhook (alert fires) → internal (create Redmine issue) |
| UI | Auto-created issue with tracker "Incident", priority "Urgent", pre-filled with alert details |

---

#### MON-003: Uptime Dashboard — P1

**As a** PM, **I want** a service uptime dashboard showing availability percentage per service, **so that** I can report to stakeholders.

| Field | Value |
|-------|-------|
| Roles | PM, DevOps |
| Integration | UptimeRobot, Pingdom, custom health endpoints |
| UI | Project dashboard widget — service name + uptime % (e.g., "API: 99.95%") |

---

#### MON-004: On-Call Schedule Display — P1

**As a** team member, **I want** to see who's currently on-call for my project, **so that** I know who to contact during an incident.

| Field | Value |
|-------|-------|
| Roles | All |
| Integration | PagerDuty, Opsgenie API |
| UI | Project sidebar widget — "On-Call: [Name] (until 9am Monday)" |

---

#### MON-005: Performance Metrics — P2

**As a** DevOps engineer, **I want** application performance metrics (response time, error rate, throughput) visible in Redmine, **so that** I correlate performance with deployments.

| Field | Value |
|-------|-------|
| Roles | DevOps |
| Integration | Datadog, Prometheus/Grafana API |
| UI | Project page → "Performance" — line charts with deployment markers |

---

#### MON-006: Infrastructure Resource Usage — P2

**As a** DevOps engineer, **I want** CPU/memory/disk usage per environment shown in Redmine, **so that** I can plan capacity.

| Field | Value |
|-------|-------|
| Roles | DevOps |
| Integration | Prometheus, CloudWatch, Datadog |
| UI | Environment dashboard → resource usage gauges |

---

### Category H: Incident Management (INC)

---

#### INC-001: Incident Tracker — P0

**As a** DevOps engineer, **I want** a dedicated incident tracker with severity levels and timeline, **so that** incidents are managed properly.

| Field | Value |
|-------|-------|
| Roles | DevOps, Lead |
| Integration | Redmine custom tracker "Incident" + custom fields |
| UI | Project page → "Incidents" tab — table with severity, status, MTTR, assigned to |

**Acceptance Criteria:**
- Custom Redmine tracker: "Incident" with custom fields: severity, affected_service, started_at, resolved_at, root_cause
- Severity levels: SEV1 (critical), SEV2 (major), SEV3 (minor), SEV4 (low)
- Timeline view showing incident duration
- Auto-calculates MTTR

**Manual Test Coverage:** J1 (Incidents list), J2 (Incident detail), J4 (Empty state)

---

#### INC-002: Incident Timeline — P0

**As a** DevOps engineer, **I want** an incident timeline showing every action taken during resolution, **so that** we have a complete record.

| Field | Value |
|-------|-------|
| Roles | DevOps |
| Integration | Internal (Redmine journal entries + DevOps events) |
| UI | Incident issue page → "Timeline" tab — chronological: alert fired → incident created → team notified → investigation started → fix deployed → resolved |

**Manual Test Coverage:** J3 (Timeline on incident detail)

---

#### INC-003: Incident-to-Deployment Correlation — P1

**As a** lead, **I want** incidents automatically linked to the deployment that caused them, **so that** we can track change failure rate.

| Field | Value |
|-------|-------|
| Roles | Lead, DevOps |
| Integration | Correlation: incident timestamp vs deployment timestamp |
| UI | Incident page → "Related Deployment" section |

---

#### INC-004: Post-Mortem Template — P1

**As a** DevOps engineer, **I want** a post-mortem template auto-generated after an incident is resolved, **so that** we learn from every incident.

| Field | Value |
|-------|-------|
| Roles | DevOps, Lead |
| Integration | Internal (generates wiki page from incident data) |
| UI | Incident page → "Create Post-Mortem" button → pre-filled template with timeline, root cause section, action items |

---

#### INC-005: Escalation Rules — P1

**As a** DevOps manager, **I want** incidents to auto-escalate if not acknowledged within X minutes, **so that** critical issues don't go unnoticed.

| Field | Value |
|-------|-------|
| Roles | DevOps, Admin |
| Integration | Internal (timer-based escalation) |
| UI | Project settings → DevOps → "Escalation Rules" — configure timeouts per severity |

---

#### INC-006: Incident Communication Template — P2

**As a** PM, **I want** pre-built communication templates for status updates during incidents, **so that** stakeholders get timely, consistent updates.

| Field | Value |
|-------|-------|
| Roles | PM |
| Integration | Email/Slack notification with template |
| UI | Incident page → "Send Update" → choose template → customize → send |

---

### Category I: DevOps Metrics (MET)

---

#### MET-001: Deployment Frequency — P0

**As a** lead, **I want to** see how often we deploy to production, **so that** I can measure our delivery speed (DORA metric).

| Field | Value |
|-------|-------|
| Roles | Lead, PM, DevOps |
| Integration | Aggregation from redmineflux_devops_deployments |
| UI | Project dashboard widget — "Deployments/week: 3.2" with trend chart |

**Manual Test Coverage:** K2 (Deployment Frequency card — deploys/week with classification badge: elite/high/medium/low)

---

#### MET-002: Lead Time for Changes — P0

**As a** lead, **I want to** see the average time from first commit to production deploy, **so that** I can measure our pipeline efficiency (DORA metric).

| Field | Value |
|-------|-------|
| Roles | Lead, PM |
| Integration | redmineflux_devops_commits (first commit timestamp) → redmineflux_devops_deployments (production deploy timestamp) |
| UI | Dashboard widget — "Lead Time: 2.3 days" with trend |

**Manual Test Coverage:** K3 (Lead Time card — hours median with classification)

---

#### MET-003: Change Failure Rate — P0

**As a** lead, **I want to** see what percentage of deployments cause incidents, **so that** I can measure our quality (DORA metric).

| Field | Value |
|-------|-------|
| Roles | Lead, PM |
| Integration | redmineflux_devops_deployments + redmineflux_devops_incidents correlation |
| UI | Dashboard widget — "Change Failure Rate: 8%" with trend |

**Manual Test Coverage:** K4 (Change Failure Rate card — % with classification)

---

#### MET-004: Mean Time to Recover (MTTR) — P0

**As a** lead, **I want to** see the average time from incident start to resolution, **so that** I can measure our resilience (DORA metric).

| Field | Value |
|-------|-------|
| Roles | Lead, PM |
| Integration | Aggregation from incident tracker (started_at → resolved_at) |
| UI | Dashboard widget — "MTTR: 45 minutes" with trend |

**Manual Test Coverage:** K5 (MTTR card — hours with classification), K6 (Period filter recalculates metrics), K7 (Legend: Elite/High/Medium/Low badge colors)

---

#### MET-005: Cycle Time — P1

**As a** PM, **I want to** see the average time from issue creation to production deploy, **so that** I can measure end-to-end delivery speed.

| Field | Value |
|-------|-------|
| Roles | PM |
| Integration | Redmine issue (created_at) → redmineflux_devops_deployments (deployed_at for prod) |
| UI | Dashboard widget — "Cycle Time: 5.2 days" with distribution chart |

---

#### MET-006: Throughput — P1

**As a** PM, **I want to** see how many issues are completed per week/sprint, **so that** I can measure team productivity.

| Field | Value |
|-------|-------|
| Roles | PM |
| Integration | Redmine issue status changes |
| UI | Dashboard widget — "Issues Closed/Week: 12" with trend |

---

#### MET-007: Custom Metrics Dashboard — P2

**As a** lead, **I want** to build a custom DevOps dashboard combining any metrics, **so that** I can create views tailored to my team.

| Field | Value |
|-------|-------|
| Roles | Lead, PM |
| Integration | Connects with Dashboard plugin |
| UI | Dashboard builder with drag-and-drop DevOps widgets |

---

#### MET-008: Build Success Rate — (Research List, No Separate ID in REQ-001)

**As a** lead, **I want to** see the percentage of builds that pass over time, **so that** I can track CI stability.

| Field | Value |
|-------|-------|
| Roles | Lead, DevOps |
| Integration | Aggregation from redmineflux_devops_builds |
| UI | Build success rate trend chart (referenced in DEVOPS-RES-001 as M08) |

---

#### MET-009: Developer Velocity — (Research List, No Separate ID in REQ-001)

**As a** lead, **I want to** see commits, PRs, and deployments per developer, **so that** I can understand individual contribution levels.

| Field | Value |
|-------|-------|
| Roles | Lead (optional — noted as potentially sensitive) |
| Integration | Aggregation from git + CI data |
| UI | Developer activity chart (referenced in DEVOPS-RES-001 as M07) |

**Note:** Source document explicitly flags this metric as optional and potentially sensitive.

---

### Category J: Environment Management (ENV)

---

#### ENV-001: Environment Registry — P0

**As a** DevOps engineer, **I want** a registry of all environments per project, **so that** everyone knows what exists and how to access it.

| Field | Value |
|-------|-------|
| Roles | All |
| Integration | Internal (manual setup + auto-populated from deployments) |
| UI | Project settings → DevOps → "Environments" — add name, URL, type (dev/staging/prod), owner |

**Manual Test Coverage:** F5 (Add environment — form with name, URL, description, status, sort order), F6 (Edit environment — edit form pre-filled)

---

#### ENV-002: Environment Health Status — P0

**As a** developer, **I want to** see if staging is healthy before I test my feature, **so that** I don't waste time debugging environment issues.

| Field | Value |
|-------|-------|
| Roles | Dev, QA |
| Integration | Health endpoint polling or webhook |
| UI | Environment cards show green/yellow/red status with last check time |

**Manual Test Coverage:** F1 (Environment cards with status lights), F2 (Status light colors: green = healthy, red = down, gray = unknown), F4 (History link → deployments filtered by environment)

---

#### ENV-003: Deployment Freeze / Lock — P1

**As a** PM, **I want** to lock deployments during a freeze period (e.g., before a major demo), **so that** nothing breaks at a critical time.

| Field | Value |
|-------|-------|
| Roles | PM, DevOps |
| Integration | Internal |
| UI | Environment → "Lock" button with reason and unlock time. Blocks DEP-009 deploy button. |

---

#### ENV-004: Environment Provisioning Request — P1

**As a** developer, **I want to** request a new test environment through Redmine, **so that** DevOps gets a tracked request.

| Field | Value |
|-------|-------|
| Roles | Dev |
| Integration | Creates Redmine issue with tracker "Environment Request" |
| UI | Project page → "Request Environment" button → form with specs |

---

#### ENV-005: Environment Comparison — P2

**As a** DevOps engineer, **I want** to compare what's deployed across environments, **so that** I can verify staging matches what's going to production.

| Field | Value |
|-------|-------|
| Roles | DevOps |
| Integration | redmineflux_devops_deployments comparison |
| UI | Side-by-side view: staging v1.2.3 vs production v1.2.2 → diff of issues included |

---

### Category K: System / Infrastructure (SYS)

---

#### SYS-001: Webhook Receiver — P0

**As a** DevOps engineer, **I want** a built-in webhook endpoint that receives events from GitHub, GitLab, Jenkins, etc., **so that** data flows into Redmine automatically.

| Field | Value |
|-------|-------|
| Roles | DevOps, Admin |
| Integration | All external tools send events here |
| UI | Admin → DevOps → "Webhooks" — shows URL, secret, event log |

**Acceptance Criteria:**
- Single endpoint: `POST /devops/webhook/{provider}/{project_identifier}`
- Validates webhook signatures (GitHub HMAC-SHA256, GitLab token, Jenkins auth)
- Parses events by type (push, PR, build, deploy, alert)
- Routes to appropriate handler
- Event log with last 100 events (viewable in admin)

**Data Model:**
```
redmineflux_devops_webhook_events: id, project_id, provider, event_type, payload_hash, processed (bool), error_message, received_at
Index: project_id, provider, received_at
```

**Manual Test Coverage:** P1 (Webhook log — navigate to `/projects/phoenix-platform/devops_webhooks` — table of events with provider, type, status, date)

---

#### SYS-002: Connection Manager — P0

**As an** admin, **I want** a UI to configure external tool connections per project, **so that** setup is easy.

| Field | Value |
|-------|-------|
| Roles | Admin, DevOps |
| Integration | Stores credentials for all external tools |
| UI | Project settings → DevOps → "Connections" — add/edit/test connections |

---

#### SYS-003: Permission Model — P0

**As an** admin, **I want** Redmine role-based permissions for DevOps actions, **so that** only authorized people can trigger builds or approve deployments.

| Field | Value |
|-------|-------|
| Roles | Admin |
| Integration | Redmine role/permission system |
| UI | Admin → Roles and Permissions → DevOps section |

**Permissions defined by this feature:**
- `view_devops` — see DevOps data
- `manage_devops_settings` — configure connections and webhooks
- `trigger_builds` — rebuild from Redmine
- `approve_deployments` — approve production deployments
- `manage_releases` — create/approve releases
- `manage_incidents` — create/update incidents
- `view_security_scans` — see vulnerability data

---

#### SYS-004: REST API for All DevOps Data — P0

**As a** MCP server developer, **I want** REST API endpoints for all DevOps data, **so that** AI agents can interact with DevOps features.

| Field | Value |
|-------|-------|
| Roles | API consumers (MCP server, CLI, external tools) |
| Integration | Accept Redmine API key authentication |

**API Endpoints:**
- `GET /devops/builds.json` — list builds
- `POST /devops/builds/{id}/trigger.json` — trigger rebuild
- `GET /devops/commits.json` — list commits
- `GET /devops/pull_requests.json` — list pull requests
- `GET /devops/deployments.json` — list deployments
- `GET /devops/environments.json` — list environments
- `GET /devops/incidents.json` — list incidents
- `GET /devops/metrics/dora.json` (also `/devops/metrics/summary.json`) — DORA metrics
- `GET /devops/vulnerabilities.json` — security scan results
- `GET /devops/releases.json` — list releases
- `GET /devops/alerts.json` — list alerts

**Authentication:** Redmine API key (`X-Redmine-API-Key` header). Requests without a valid key must return HTTP 401 or 403.

**Manual Test Coverage:** O1–O10 (REST API tests for all endpoints, including no-auth → 403)

---

#### SYS-005: Activity Stream Integration — P0

**As a** user, **I want** DevOps events (commits, builds, deploys, incidents) in Redmine's activity feed, **so that** I see everything in one timeline.

| Field | Value |
|-------|-------|
| Roles | All |
| Integration | Redmine activity provider |
| UI | Project activity page shows: "Raj pushed 3 commits", "Build #456 passed", "v1.2.3 deployed to staging", "Incident SEV2 resolved" |

---

#### SYS-006: Notification Configuration — P1

**As a** user, **I want** to configure which DevOps events I get notified about, **so that** I'm not overwhelmed.

| Field | Value |
|-------|-------|
| Roles | All |
| Integration | Redmine notification system |
| UI | User settings → DevOps Notifications → toggle per event type (build failure, deployment, incident, etc.) |

---

#### SYS-007: Plugin Settings — P1

**As an** admin, **I want** global DevOps plugin settings, **so that** defaults are configured once.

| Field | Value |
|-------|-------|
| Roles | Admin |
| Integration | Redmine plugin settings |
| UI | Admin → Plugins → Redmineflux DevOps → Configure |

---

### Issue Panel — DevOps Section (Cross-cutting)

Every Redmine issue that has associated DevOps data displays a "DevOps" section below the issue fields. This section includes:

- **Build badge** — prominent color-coded badge at the top: "Build #X [status] ([duration])"
- **Collapsible sections** — Builds, Pull Requests, Commits — each collapsed by default showing count + inline preview
- **Expand behavior** — clicking a section header expands it to show a table with up to 10 items
- **"View all" link** — when more than 10 items exist, a "View all N →" link appears at the bottom of the expanded section

**Manual Test Coverage:** N1–N6

---

## Non-Functional Requirements

### Performance

- Build status badges must update in real-time via webhook (no polling delay)
- Branch status badges (SCM-003) must update within 5 minutes of a status change
- Build log viewer fetches logs on demand (logs are not stored permanently due to size)
- Build log shows last 200 lines by default; "Load More" / "Full Log" options are available

### Security

- API tokens for external tool connections are stored encrypted (not plaintext)
- Webhook signatures are validated: GitHub uses HMAC-SHA256, GitLab uses token verification, Jenkins uses auth credentials
- REST API requires Redmine API key authentication; unauthenticated requests receive HTTP 401 or 403
- Deployments can be blocked automatically when critical security vulnerabilities are open (SEC-003)
- Rebuild action is rate-limited: maximum 5 manual triggers per hour per user (CICD-004)

### Scalability

- Build history pagination: 50 builds per page (CICD-002)
- Webhook event log retains last 100 events viewable in admin (SYS-001)
- Commit linking is driven by webhooks (not by polling repositories)

### Audit & Accountability

- All DevOps actions are logged in the DevOps Audit Log (SEC-006) — filterable by user, action type, date
- Deployment approvals include audit trail: who approved, when, with what comment (DEP-004)
- Auto-transitions add journal entries to issues (SCM-004)

---

## Integration Requirements

### External Tool Integration Matrix

| External Tool | Category | Connection Method | Data Received / Actions |
|--------------|----------|-------------------|------------------------|
| **GitHub** | SCM + CI | OAuth + Webhooks + REST API | Repos, commits, PRs, branches, GitHub Actions (builds), Releases, Deploy events |
| **GitLab** | SCM + CI | OAuth + Webhooks + REST API | Projects, commits, MRs, pipelines, environments, releases |
| **Bitbucket** | SCM + CI | OAuth + Webhooks + REST API | Repos, commits, PRs, Pipelines |
| **Jenkins** | CI/CD | API Token + Webhooks | Jobs, builds, stages, logs, queue, artifacts |
| **GitHub Actions** | CI/CD | Included in GitHub integration | Workflow runs, jobs, logs, artifacts |
| **GitLab CI** | CI/CD | Included in GitLab integration | Pipelines, jobs, logs, artifacts |
| **ArgoCD** | Deployment | REST API + Webhooks | Applications, sync status, rollout/canary status |
| **SonarQube** | Code Quality | REST API + Webhooks | Quality gates, issues, coverage, duplications |
| **Snyk** | Security | REST API + Webhooks | Vulnerabilities, dependency issues, fix advice |
| **Trivy** | Security | CI output parsing (JUnit/JSON) | Container/IaC vulnerabilities |
| **Zabbix** | Monitoring | REST API | Hosts, triggers, problems |
| **Prometheus** | Monitoring | REST API (PromQL) | Metrics, alerts (via AlertManager webhooks) |
| **PagerDuty** | Incidents + On-Call | REST API + Webhooks | Incidents, on-call schedules, escalations |
| **Datadog** | Monitoring | REST API + Webhooks | Metrics, alerts, dashboards |
| **Docker Hub** | Registry | REST API | Image tags, pull counts, vulnerability scans |
| **Codecov / Coveralls** | Test Coverage | Webhooks | Coverage percentage per build |
| **FOSSA** | License Compliance | REST API | Dependency license types and risk levels |
| **UptimeRobot / Pingdom** | Uptime | REST API | Service availability percentages |
| **Opsgenie** | On-Call | REST API | On-call schedules |

### Webhook Receiver

- Single inbound endpoint: `POST /devops/webhook/{provider}/{project_identifier}`
- Routes events by type: push, PR/MR, build, deploy, alert
- Validates signatures per provider before processing

### MCP Agent Integration

The plugin exposes MCP tools that allow AI agents to interact with all DevOps features. This is described as the plugin's **unique differentiator** — no competitor offers this capability.

**MCP Tools (from DEVOPS-REQ-001 — REST API / MCP mapping):**

| MCP Tool | Capability | Feature Mapping |
|----------|-----------|----------------|
| `redmineflux_devops_list_builds` | List builds for a project | CICD-002 |
| `redmineflux_devops_get_build_log` | Get build log content | CICD-003 |
| `redmineflux_devops_trigger_build` | Trigger a rebuild | CICD-004 |
| `redmineflux_devops_list_deployments` | List deployments by environment | DEP-001 |
| `redmineflux_devops_environment_status` | Check environment health | ENV-002 |
| `redmineflux_devops_deploy` | Trigger deployment to environment (with approval gate) | DEP-009 |
| `redmineflux_devops_rollback` | Rollback production to previous version | DEP-005 |
| `redmineflux_devops_list_incidents` | List open incidents | INC-001 |
| `redmineflux_devops_create_incident` | Create an incident | INC-001 |
| `redmineflux_devops_dora_metrics` | Get DORA metrics | MET-001 to MET-004 |
| `redmineflux_devops_generate_changelog` (also `redmineflux_devops_changelog`) | Generate release changelog | REL-002 |
| `redmineflux_devops_list_vulnerabilities` (also `redmineflux_devops_security_scan`) | List security vulnerabilities | SEC-001 |
| `redmineflux_devops_create_release` | Create a release | REL-001 |
| `redmineflux_devops_approve_deploy` | Approve a pending deployment | DEP-004 |
| `redmineflux_devops_lock_environment` | Lock/unlock deployments | ENV-003 |
| `redmineflux_devops_list_pipelines` | Show build status for all branches | CICD-001 |

### Internal Plugin Integrations

- **Redmineflux Dashboard plugin** — DevOps widgets render inside the Dashboard builder (MET-007)
- **Redmineflux Testcase Management plugin** — Test-to-requirement traceability matrix (TEST-004)
- **Redmineflux Agile Board, Gantt, Workload** — The PLAN stage; DevOps plugin connects to these but does not replace them

---

## Database Schema

| Table | Purpose | Key Relations |
|-------|---------|--------------|
| `redmineflux_devops_repositories` | Connected SCM repos per project | project_id |
| `redmineflux_devops_commits` | Commit history | issue_id, project_id, repo |
| `redmineflux_devops_pull_requests` | PR/MR tracking | issue_id, project_id, repo |
| `redmineflux_devops_builds` | CI/CD build records | project_id, issue_id |
| `redmineflux_devops_build_stages` | Pipeline stage breakdown | build_id |
| `redmineflux_devops_test_results` | Automated test pass/fail | build_id |
| `redmineflux_devops_environments` | Environment registry | project_id |
| `redmineflux_devops_deployments` | Deployment history | project_id, environment_id |
| `redmineflux_devops_releases` | Release records with approvals | project_id, version_id |
| `redmineflux_devops_vulnerabilities` | Security scan findings | project_id, build_id |
| `redmineflux_devops_alerts` | Monitoring alerts | project_id |
| `redmineflux_devops_incidents` | Incident records | project_id (uses Redmine issues with custom tracker) |
| `redmineflux_devops_webhook_events` | Webhook event log | project_id |
| `redmineflux_devops_connections` | External tool credentials (encrypted) | project_id |

---

## Implementation Phases

### Phase 1 — MVP (P0 features, Weeks 1–12)

All 33 P0 features form the MVP, grouped by sprint:

| Sprint | Weeks | Features |
|--------|-------|---------|
| Sprint 1 — Foundation + SCM | 1–3 | SYS-001, SYS-002, SYS-003, SYS-004, SYS-005, SCM-001, SCM-002, SCM-003, SCM-004, SCM-005 |
| Sprint 2 — CI/CD + Deployments | 4–6 | CICD-001, CICD-002, CICD-003, CICD-004, DEP-001, DEP-002, DEP-003 |
| Sprint 3 — Releases + Testing + Metrics | 7–9 | REL-001, REL-002, REL-003, TEST-001, TEST-002, MET-001, MET-002, MET-003, MET-004 |
| Sprint 4 — Monitoring + Incidents + Security | 10–12 | MON-001, MON-002, SEC-001, SEC-002, INC-001, INC-002, ENV-001, ENV-002 |

### Phase 2 — Deployments + Releases Expansion (Weeks 13–18)

DEP-004, DEP-005, DEP-006, DEP-007, REL-004, REL-005, REL-006; GitLab integration expansion; Jenkins integration

### Phase 3 — Metrics + Security + Incidents (Weeks 19–24)

MET-005, MET-006, MET-007, MET-008, MET-009, SEC-003, SEC-004, INC-003, INC-004, INC-005, MON-003, MON-004

### Phase 4 — MCP + Advanced Features (Weeks 25–28)

All MCP tools, CICD-004 (bidirectional trigger), DEP-009 (deploy from Redmine), ArgoCD integration, Feature flags (planned)

**Grand Total Effort Estimates (from research document):**

| Phase | Duration | Estimated Effort |
|-------|----------|-----------------|
| Phase 1 | 8 weeks | ~128 hours |
| Phase 2 | 6 weeks | ~112 hours |
| Phase 3 | 6 weeks | ~112 hours |
| Phase 4 | 4 weeks | ~76 hours |
| **Total** | **~24 weeks** | **~428 hours** |

---

## Known Constraints

1. **Plan stage is out of scope** — The DevOps plugin does not replace existing Redmineflux Agile Board, Gantt, or Workload plugins; it connects to them.
2. **Build logs are not stored permanently** — Logs are fetched on demand from the CI tool due to size constraints; only last 200 lines shown by default.
3. **Rebuild rate limit** — Maximum 5 manual build triggers per hour per user (CICD-004).
4. **Webhook event log retention** — Only last 100 events are retained in the admin view (SYS-001).
5. **Canary/Progressive rollout status (DEP-008)** requires ArgoCD or Kubernetes API; not available with basic Jenkins/GitHub Actions setups.
6. **Feature flags integration** — Mentioned as "Planned" in the research document; no feature ID or detailed requirements are documented yet.
7. **License compliance (SEC-005)** requires FOSSA or Snyk license scanning to be set up externally.
8. **SonarQube quality gate (SCM-010)** requires SonarQube to be installed and configured with the project separately.
9. **Test-to-requirement traceability (TEST-004)** requires the Redmineflux Testcase Management plugin to be installed.
10. **Custom metrics dashboard (MET-007)** requires the Redmineflux Dashboard plugin to be installed.
11. **AlphaNodes incompatibility** — If AlphaNodes DevOps plugin is already installed, it provides read-only overlapping data; both plugins running simultaneously may present conflicting UI elements (not explicitly documented but implied by competitive positioning).
12. **Bitbucket support** — Bitbucket is listed as a supported provider (API token only; no OAuth mentioned), but detailed acceptance criteria for Bitbucket-specific behavior are not provided.

---

## Unclear / Incomplete Items

The following items were found to be unclear, underdocumented, or inconsistent across the three source files:

1. **MCP tool name discrepancy** — DEVOPS-REQ-001 lists `redmineflux_devops_generate_changelog` and `redmineflux_devops_list_vulnerabilities`, while DEVOPS-RES-001 uses `redmineflux_devops_changelog` and `redmineflux_devops_security_scan` for the same capabilities. The canonical names are not confirmed.

2. **API endpoint discrepancy** — DEVOPS-REQ-001 specifies `/devops/metrics/dora.json` for DORA metrics, while the manual test plan (O7) uses `/devops/metrics/summary.json`. Both are documented here; the authoritative route is unclear.

3. **MET-008 (Build Success Rate) and MET-009 (Developer Velocity)** — These metrics appear in the research document (DEVOPS-RES-001 as M08 and M07) but have no corresponding feature ID in DEVOPS-REQ-001's structured feature list. Developer velocity is flagged as optional and potentially sensitive but has no acceptance criteria.

4. **Permissions matrix — role definitions** — The source documents reference roles "Dev, QA, Lead, PM, DevOps, Security, Admin" but these are not mapped to Redmine's built-in role names (Manager, Developer, Reporter). The actual Redmine role configuration is left to the implementer.

5. **Client / Non-member roles** — The original template requested a permissions column for "Client" and "Non-member" roles. The source documents do not define any DevOps permissions for these roles; all DevOps data appears to require project membership.

6. **Hotfix workflow UI** — REL-008 states the "Create Hotfix" button creates a `hotfix/v1.2.1` branch. The version number format for the hotfix branch is not specified in detail (e.g., how it increments from the last release tag).

7. **Deployment Freeze vs. Deployment Lock** — DEP-006 (Deployment Lock) and ENV-003 (Deployment Freeze/Lock) describe overlapping functionality from different user perspectives but are documented as separate features. Their relationship (whether they are one feature or two separate mechanisms) is not clearly delineated.

8. **`redmineflux_devops_incidents` table** — The database schema summary notes this table uses "Redmine issues with custom tracker" but also lists it as a separate table. Whether incident data lives in Redmine's issues table or a separate plugin table is architecturally ambiguous.

9. **Semantic versioning suggestion (REL-004)** — The requirement states "Enforce semver based on commit types (feat/fix/breaking)" in the research document, but DEVOPS-REQ-001 uses the word "suggest" (not "enforce"). It is unclear whether the system blocks releases that do not follow the suggested version or only offers a suggestion.

10. **Manual test plan scope** — The manual test plan covers 78 test cases and references sprint numbers (Sprint 1–4), but several features in DEVOPS-REQ-001 (particularly P1 and P2 features like INC-004 Post-Mortem, SEC-003 Security Gate, ENV-004 Provisioning Request) have no corresponding manual test cases documented.

11. **Feature flags integration** — Listed as "Planned" in the competitive comparison table (DEVOPS-RES-001) with a reference to LaunchDarkly but no feature ID, description, or requirements exist anywhere in the source documents.

12. **Redmine version compatibility** — No minimum Redmine version is specified in any source document.
