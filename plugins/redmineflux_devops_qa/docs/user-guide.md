# User Guide — Redmineflux DevOps

> This file must be read before writing any test case. It describes real end-user behavior and UI flows.
> Source: DEVOPS_USER_GUIDE.md (Redmineflux DevOps plugin)

---

## Introduction

RedmineFlux DevOps is a plugin for Redmine that brings your delivery work into one place. It connects Redmine with the tools your team already uses for code, builds, deployments, and monitoring, so you can see everything from one screen.

If you have ever opened five tabs to check a ticket, a build, a deployment, and an alert, this plugin is meant to remove that. You stay inside Redmine and see the same picture as your developers and your operations team.

This guide is for project managers, team leads, release managers, and anyone who wants to track delivery without learning command-line tools. You do not need to be a developer to use it.

---

## Version Compatibility

Supported Redmine versions:

- 5.0.x
- 5.1.x
- 6.0.x
- 6.1.x

---

## Installation

To install the RedmineFlux DevOps plugin:

1. Make sure Redmine is already installed and working.
2. Extract the plugin archive.
3. Upload the folder to `Redmine/plugins/redmineflux_devops`.
4. Do not rename the plugin folder.
5. Install required gems:

```bash
bundle install
```

6. Run database migrations.

For production:

```bash
RAILS_ENV=production bundle exec rails redmine:plugins:migrate
```

For development:

```bash
RAILS_ENV=development bundle exec rails redmine:plugins:migrate
```

7. Restart Redmine.

Example:

```bash
bundle exec rails server
```

---

## Configuration

To enable DevOps for a project:

1. Log in as Administrator.
2. Open the target project.
3. Go to Settings.
4. Open the Modules tab.
5. Enable Redmineflux DevOps.
6. Save the changes.

After enabling the module:

- The project shows a DevOps tab.
- A sub-navigation bar appears with all DevOps sections (Builds, Commits, Releases, and others).
- Project members with the right permissions can use these sections.

To configure plugin-level options:

1. Go to Administration.
2. Open Plugins.
3. Find Redmineflux DevOps.
4. Click Configure.

From plugin configuration, administrators can manage:

- Encryption key for stored tokens
- Webhook tokens for Jenkins and monitoring tools
- The system user used for automated comments
- Rate limits for incoming events
- Retention period for health samples and webhook events
- Default global settings used by every project

---

## DevOps Plugin Overview

The plugin is organised into clear sections. Each section opens from the DevOps sub-navigation bar inside a project.

Main sections:

1. **Builds** — See every build from your CI tools.
2. **Commits** — See every code change made in connected repositories.
3. **Pull Requests** — See review work waiting for your team.
4. **Code Quality** — See code health reports from SonarQube and similar tools.
5. **Deployments** — See what was deployed where and by whom.
6. **Environments** — See live status of staging, production, and other environments.
7. **Freezes** — Block deployments during sensitive periods.
8. **Releases** — Plan releases and track readiness.
9. **Alerts** — See alerts coming from monitoring systems.
10. **Licenses** — Track open-source license compliance.
11. **Security (Vulnerabilities)** — See vulnerabilities found by scanners.
12. **Incidents** — Manage incidents end-to-end.
13. **Metrics** — Track delivery health using DORA metrics.
14. **Performance** — See live performance charts for each environment.
15. **Dashboards** — Build your own DevOps dashboard.
16. **Flaky Tests** — Find tests that pass sometimes and fail other times.
17. **Traceability** — Connect requirements (issues) to automated test results.
18. **Env Requests** — Request access or changes to environments.
19. **Repositories** — Connect GitHub, GitLab, and Jenkins.
20. **Settings** — Per-project plugin behaviour.

You can switch between sections using the bar shown at the top of every DevOps page.

---

## Key Screens

### How to Open the DevOps Section

To open the DevOps section for a project:

1. Open the project.
2. Click DevOps from the project menu.

The plugin opens on the default landing page (usually Builds). Use the sub-navigation bar to switch to other sections.

---

## Step-by-Step Workflows

### Workflow 1: How to Connect a Repository

You need at least one connected repository before commits, builds, and pull requests start to appear.

To connect a GitHub or GitLab repository:

1. Open the project.
2. Click DevOps.
3. Open the Repositories section from the sub-navigation bar.
4. Click Add Repository.
5. Choose the provider (GitHub, GitLab, or Bitbucket).
6. Enter the Repository Name.
7. Enter the access token and webhook secret.
8. Save the connection.

The plugin tests the connection. After it is saved:

- A webhook URL is shown that you (or your administrator) must paste into the provider.
- Once the provider sends its first event, you will see commits, pull requests, and builds appear in the matching sections.

Notes:

- Tokens are stored in encrypted form.
- Webhook signatures are validated when a secret is set.
- A connection can be edited or removed at any time.

---

### Workflow 2: How to Use the Builds Section

The Builds section shows every build from connected CI tools (GitHub Actions, GitLab CI, Jenkins).

What you can do:

- Filter by branch, status, period, or repository.
- See duration trends and failing builds.
- Open the build log directly from Redmine.
- Download artifacts attached to a build.
- Trigger a rebuild without leaving Redmine.

To open a build:

1. Open the Builds section.
2. Click a build entry.
3. Use the tabs to view logs, artifacts, or test history.

---

### Workflow 3: How to Use the Commits Section

The Commits section shows every code change pushed to a connected repository.

What you can do:

- See commits grouped by author or branch.
- Open the file diff inline.
- Jump to the linked issue if the commit message contains a reference like `#123` or `fixes #45`.
- On the commit show page you can see the change history of the files changed in that commit, and open the file diff for each change.

The plugin reads the commit message and links the commit back to the matching Redmine issue automatically.

---

### Workflow 4: How to Use the Pull Requests Section

The Pull Requests section shows pull requests across the project.

What you can do:

- See pull requests sorted oldest first.
- Highlight stale reviews.
- See reviewer state (approved, requested changes, pending).
- Send daily review reminders to reviewers.

This is useful for team leads who want to keep review cycles short.

---

### Workflow 5: How to Create a Branch from an Issue

You can start coding work directly from a Redmine issue.

To create a branch from an issue:

1. Open the issue.
2. Find the DevOps panel on the right side.
3. Click Create branch.
4. Choose the repository.
5. Confirm the branch name (the plugin suggests one based on the issue ID and subject).
6. Save.

The plugin creates the branch in the chosen repository and links it back to the issue.

---

### Workflow 6: How to Use the Releases Section

A release groups together everything that goes out at the same time.

To create a release:

1. Open the Releases section.
2. Click New release.
3. Enter:
   - Release name
   - Target version
   - Start date
   - Planned date
   - Linked issues
4. Save.

After the release is saved:

- The release page shows readiness metrics (linked issues, blockers, progress bar).
- You can write release notes using a rich-text editor.
- You can generate a changelog from linked issues.
- You can require approval before deployment.

To create a hotfix release from an existing release:

1. Open the Releases section.
2. Open the source release.
3. Click Hotfix.
4. The plugin creates a hotfix branch and a tracker issue, linked back to the original release.

---

### Workflow 7: How to Use Approval Gates

Approval gates make sure the right people sign off before a deployment.

To enable approval for an environment:

1. Open the Environments section.
2. Open the environment.
3. Open Approval rules.
4. Choose roles allowed to approve.
5. Save.

When a deployment is requested for that environment:

- The deployment waits until approvers act.
- Approvers see a list of pending approvals.
- Each approval or rejection is recorded in the audit log with the comment.

---

### Workflow 8: How to Manage Deployments

The Deployments section shows what was deployed, where, and when.

To start a deployment from Redmine:

1. Open the Deployments section.
2. Click New deployment.
3. Choose:
   - Application
   - Environment
   - Version or build
4. Submit.

The plugin runs the deployment through your CI tool. You can:

- See the deployment status.
- See post-deployment health checks.
- See the deployment marked on the performance chart.
- Roll back or trigger a new deployment if needed.

---

### Workflow 9: How to Use Environments

The Environments section shows the health of each environment in one view.

For each environment, you see:

- Status light (healthy, degraded, down)
- Recent deployments
- Success rate
- Uptime trend
- CPU, memory, and disk gauges

To lock an environment:

1. Open the environment.
2. Click Lock.
3. Enter a reason.
4. Choose an expiry time.
5. Save.

While the environment is locked, deployments to it are blocked, and a clear notice appears on the page.

---

### Workflow 10: How to Use Deployment Freezes

Freezes are useful during weekends, big sales periods, or audits, when you want to stop deployments.

To create a freeze:

1. Open the Freezes section.
2. Click New freeze.
3. Choose:
   - One-time or recurring (weekly)
   - Start and end time
   - Environments affected (or all)
   - Reason
4. Save.

While a freeze is active:

- A clear alert is shown on the deployment screens.
- Deployments to frozen environments are blocked.
- Administrators can override with a written reason (kept in the audit log).

---

### Workflow 11: How to Use the Incidents Section

The Incidents section helps your team handle production issues calmly.

To open an incident:

1. Open the Incidents section.
2. Click New incident.
3. Enter:
   - Title
   - Severity (SEV1 to SEV4)
   - Affected service or environment
   - Short description
4. Save.

After the incident is saved:

- Escalation rules notify the right people based on severity.
- You can post stakeholder updates from preset templates with an estimated time of recovery.
- Related deployments are suggested automatically so you can spot a likely cause.
- You can generate a post-mortem as a Redmine wiki page when the incident is resolved.

---

### Workflow 12: How to Use Alerts

The Alerts section shows alerts from monitoring tools (Prometheus, Datadog, Zabbix, PagerDuty).

What you see:

- Currently firing alerts
- Critical alerts
- Resolved alerts and their duration

You can filter by severity or by environment, and open the upstream tool from any alert.

---

### Workflow 13: How to Use the Metrics Section (DORA)

DORA metrics describe how your delivery is doing.

You see four numbers:

- Deployment Frequency
- Lead Time for Changes
- Change Failure Rate
- Mean Time to Recovery

The plugin classifies your team as Elite, High, Medium, or Low for each metric, based on industry benchmarks.

You also see:

- Cycle time distribution
- Throughput trend (issues closed per week)
- Deployment markers on a timeline

This is useful for managers who want a clear view of delivery health.

---

### Workflow 14: How to Use the Performance Section

The Performance section shows live charts for each environment.

You see:

- Response latency
- Error rate
- Throughput

Each chart includes deployment markers, so you can quickly see whether a recent deployment caused a change in performance.

The data comes from Datadog or Prometheus, depending on your setup.

---

### Workflow 15: How to Use the Code Quality Section

The Code Quality section shows code health from SonarQube or a similar tool.

You see, per repository or per commit:

- Bugs found
- Vulnerabilities
- Code smells
- Coverage trend

This helps managers track code health alongside delivery work.

---

### Workflow 16: How to Use the Security Section

The Security section shows vulnerabilities found in your code or dependencies.

You see:

- Vulnerabilities grouped by severity
- CVE references
- Affected file paths
- Source scanner (FOSSA, Snyk, SonarQube)

You can:

- Open the linked issue or external scanner page.
- Block deployments while open critical vulnerabilities exist.
- Override the security gate with a written reason (kept in the audit log).

---

### Workflow 17: How to Use the Licenses Section

The Licenses section shows open-source license usage in your project.

You see:

- License names (SPDX format)
- Risk level grouping
- Components using each license

This is useful for compliance officers and for legal review before a release.

---

### Workflow 18: How to Use the Flaky Tests Section

Flaky tests are tests that pass sometimes and fail other times. They slow down delivery and reduce trust.

The Flaky Tests section automatically scores tests based on their recent results and surfaces unstable ones.

You see:

- Test name
- Pass rate
- Latest builds
- Suite the test belongs to

This helps QA leads pick the next test to fix.

---

### Workflow 19: How to Use the Traceability Section

The Traceability section connects automated test results back to Redmine issues.

For every test tagged with an issue reference (`#issue_id`, `[issue-id]`, or `@issue(id)` in the test name), the plugin:

- Shows the latest test result.
- Links the result back to the matching issue.

This makes it easy to answer the question: "is this requirement covered and passing?"

---

### Workflow 20: How to Use Env Requests

Env Requests are a simple way to request changes or access for an environment.

To open a request:

1. Open the Env Requests section.
2. Click New request.
3. Enter:
   - Environment
   - Type of request (access, configuration, scale, other)
   - Description
4. Save.

The administrator reviews the request and approves or rejects it. The request stays in the section as a record.

---

### Workflow 21: How to Build a Custom Dashboard

The Dashboards section lets you build your own DevOps view.

To create a dashboard:

1. Open the Dashboards section.
2. Click New dashboard.
3. Drag widgets from the palette into the layout (DORA charts, build history, alerts, environment health, releases, and more).
4. Save the dashboard.

You can:

- Keep the dashboard private (just for you).
- Share the dashboard with the project.
- Edit and reorder widgets later.

The dashboards are useful for:

- Engineering managers
- Release managers
- SRE leads
- Executive read-outs

---

### Workflow 22: How to Use the Audit Log

Every privileged action is captured in an audit log.

You see:

- Action (deployment, approval, security override, environment lock, release, post-mortem)
- Actor (who did it)
- Project
- IP address
- Timestamp
- Parameters digest

Use the filters at the top to narrow by actor, action, project, or time window. This is useful for compliance reviews.

---

## UI Elements Reference

### Permissions

The plugin includes ten permissions that you can assign per role:

| Permission | Description |
|------------|-------------|
| View DevOps data | See all DevOps sections |
| Manage DevOps connections | Add/edit/remove repository and CI connections |
| Trigger builds | Start a build from Redmine |
| Manage deployments | Create and submit deployments |
| Approve deployments | Approve or reject deployment requests |
| Manage releases | Create and manage releases |
| Manage incidents | Create and manage incidents |
| Manage environments | Create and configure environments |
| Override security gates | Bypass a security gate with a written reason |
| Manage DevOps settings | Change per-project plugin settings |

To set up permissions:

1. Go to Administration.
2. Open Roles and permissions.
3. Edit a role.
4. Find the DevOps section.
5. Tick the permissions you want this role to have.
6. Save.

**Typical permission setup:**

| Role | Permissions |
|------|-------------|
| Developer | View DevOps data, Trigger builds |
| Team lead | + Manage releases |
| Release manager | + Approve deployments, Manage deployments |
| SRE / on-call | + Manage incidents, Manage environments |
| Administrator | All permissions |

---

## Internationalization

The plugin is available in 11 languages:

- English
- German
- French
- Spanish
- Dutch
- Portuguese (Portugal)
- Brazilian Portuguese
- Polish
- Japanese
- Russian
- Simplified Chinese

Redmine picks the language based on the user's profile or the global default. No extra setup is needed.

---

## Notes & Known Behavior

### Troubleshooting

If you face issues with the plugin, try the following:

1. Clear browser cache and reload the page.
2. Restart the Redmine application.
3. Make sure the plugin is installed in `plugins/redmineflux_devops`.
4. Re-run plugin migrations:

```bash
bundle exec rails redmine:plugins:migrate RAILS_ENV=production
```

5. Confirm the Redmine version is supported.
6. Verify the project module is enabled in project settings.
7. Check user permissions for:
   - View DevOps data
   - Manage DevOps connections
   - Trigger builds
   - Manage deployments
8. Verify the connection token is still valid in the provider.
9. Verify the webhook URL has been added to the provider.
10. Review Redmine logs for plugin load or controller errors.

If commits, pull requests, or builds do not appear:

- Check Repositories section to confirm the connection is active.
- Check the webhook events log for delivery errors.
- Push a small change to trigger a fresh event.

If alerts or performance charts are empty:

- Confirm the monitoring webhook token in plugin configuration.
- Check the upstream tool is sending data.

### Known Limitations

- Very large build logs may show a truncation notice and a link to the upstream CI tool.
- License data depends on the connected scanner running and reporting in SPDX format.
- DORA metrics need at least 4 weeks of deployment history before classification stabilises.
- Some advanced provider features (GitHub Enterprise SAML, GitLab self-managed SSO) may need extra setup steps from your administrator.

---

## Frequently Asked Questions

**Q1. Do I need to be a developer to use this plugin?**

No. Most sections are made for project managers and team leads. You only need a developer or administrator to set up the first connection.

**Q2. Does the plugin work without GitHub or GitLab?**

Yes. You can use Releases, Incidents, Environments, Freezes, and Dashboards without any source control connection. You get more value once at least one repository is connected.

**Q3. What CI tools are supported?**

GitHub Actions, GitLab CI, and Jenkins are supported out of the box.

**Q4. What monitoring tools are supported?**

Datadog, Prometheus, Zabbix, and PagerDuty are supported. Webhook delivery is the standard way to send data into the plugin.

**Q5. Are tokens stored safely?**

Yes. Tokens are stored using AES-256 encryption. Webhook deliveries are validated using HMAC signatures when a secret is set.

**Q6. Can I customise dashboards per user?**

Yes. Each user can build a private dashboard, and administrators can build shared project dashboards.

**Q7. Can I block deployments during a release freeze?**

Yes. Use the Freezes section to create one-time or recurring freezes. Deployments to frozen environments are blocked while the freeze is active.

**Q8. Does the plugin support post-mortems?**

Yes. From an incident, you can generate a post-mortem as a Redmine wiki page. The page is pre-filled with incident details and links.

**Q9. Where do I find the audit log?**

Open Administration > Plugins > Redmineflux DevOps, or use the Audit log link from the DevOps menu (visible to administrators only).

**Q10. Does the plugin support Redmine 6?**

Yes. The current plugin supports Redmine 6.x.

---

## Uninstallation

To uninstall the plugin:

1. Go to the Redmine installation directory.
2. Remove the plugin folder: `plugins/redmineflux_devops`
3. If you want to roll back database changes, run:

```bash
bundle exec rails redmine:plugins:migrate NAME=redmineflux_devops VERSION=0 RAILS_ENV=production
```

4. Restart Redmine.

Take a database backup before rollback or uninstallation.
