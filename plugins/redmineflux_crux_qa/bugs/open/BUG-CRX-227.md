# Bug Report Template

- Bug ID: BUG-CRX-227
- Production Redmine Issue ID: #129508
- Title: Code Reviewer agent's build lookup only sees builds in a terminal status (Success/Failed) — a genuinely existing Pending/Queued build is invisible, reporting "No builds recorded"
- Redmine version: 7.0.2 (local Docker, `crux-redmine-mcp-binary` stack, localhost:3016)
- Plugin name: redmineflux_crux (Code Reviewer agent) / redmineflux_devops (builds data source)
- Plugin version: current `master` as of 2026-11-27
- Environment: Local Docker, Postgres, binary crux-core/mcp stack (localhost:3016), OpenRouter provider (anthropic/claude-sonnet-4.5)
- Browser: Chromium (Playwright MCP)
- User role: admin
- Date: 2026-11-27

## Steps to reproduce

1. Connect a real GitHub repository (`sourabhzehntech01-star/rftc038-qa-pipeline-test`) to a Redmine project's DevOps module via Providers & keys / `devops_repositories` (real PAT, webhook secret configured).
2. Set up a Cloudflare tunnel exposing the Redmine instance publicly, and point a GitHub webhook (content-type `application/json`, "Send me everything", matching secret) at `<tunnel>/devops/webhook/github/<project-identifier>`. Confirm the webhook's own "Recent Deliveries" shows `Response 202` for each event.
3. On the repo's existing open PR #1 ("Update README.md", branch `sourabhzehntech01-star-patch-1`), add a label to generate a genuine `pull_request.labeled` webhook event — confirm it appears in Redmine's `devops_pull_requests` list with correct title/author/branch.
4. Push a new commit on the PR's branch (edit README.md directly on GitHub) — confirm it appears correctly in Redmine's `devops_commits` list (correct SHA, author, branch, message).
5. Manually trigger the repo's existing GitHub Actions workflow (`workflow_dispatch`) specifically **on the PR's own branch** (`sourabhzehntech01-star-patch-1`), so the resulting build's branch+SHA genuinely match the open PR. Confirm in Redmine's `devops_builds` list: a new build row appears with Status "Pending", the correct branch, and the correct SHA (`dec81e4`) — i.e., the exact commit the PR is built on.
6. In Ask Crux, pin the agent picker to **Code Reviewer** and ask: "Review the open pull request on the DevOps Detection Test project."
7. Observe the agent's answer. Click "Ask again" on the same turn to get a second independent attempt.
8. Set up a real self-hosted GitHub Actions runner (Docker container, `myoung34/github-runner`, registered to the same repo with a genuine registration token from Settings → Actions → Runners → New self-hosted runner) so the queued build can actually execute. Confirm in Redmine's `devops_builds` list that build #8's status has moved from "Pending" to a terminal status ("Failed", in this repro — the job itself failed for unrelated reasons, which is fine; only the status transition matters here).
9. Re-ask the Code Reviewer the exact same question (via "Ask again" a third time) and compare its answer against steps 6-7.

## Expected result

- The Code Reviewer agent should discover and report the real, existing Pending build (branch `sourabhzehntech01-star-patch-1`, SHA `dec81e4`, provider `github_actions`) that is genuinely linked to the PR it was asked to review — either incorporating it into its verdict, or at minimum acknowledging a build exists and is pending (not necessarily waiting for it to finish, since the workflow's `self-hosted` runner requirement means this specific run will never complete — but the build **record** itself exists and is queryable in Redmine right now).

## Actual result

- **While the build was Pending/Queued:** both attempts (the original answer and the "Ask again" retry) returned **"Can't tell — missing build information"**, explicitly stating "No build/CI results available for this PR" and "No builds recorded — I cannot verify if CI/CD ran or passed." This is factually wrong at the time it's stated: a build genuinely exists in Redmine's own `devops_builds` table for this exact project, branch, and commit, visible in the native UI with zero extra steps (just opening `/projects/devops-detect-test/devops_builds`).
- **Once the same build transitioned to Failed** (via a genuine self-hosted runner picking up the queued job — step 8), a third "Ask again" on the identical question correctly produced: **"Needs changes — failing checks"**, with `Checks: Failing ❌` and "Build/checks are failing — PR #1 has failing checks that must be resolved before merge" explicitly cited as finding #1, concluding "Verdict: Not ready to merge." This confirms the agent's build lookup DOES work correctly for terminal-status builds — the gap is specifically scoped to non-terminal (Pending/Queued) builds being invisible to it, not a total failure to query builds data at all.

## Evidence

### Screenshot

![Real build #8 — Pending, correct branch/SHA, in Redmine's native UI](../../screenshots/BUG-CRX-227/redmine-build-8-exists-pending.png)

![Code Reviewer's "No builds recorded" answer, both the original and "Ask again" retry](../../screenshots/BUG-CRX-227/code-reviewer-no-builds-recorded.png)

![Code Reviewer correctly seeing the same build once it transitioned to Failed — "Needs changes — failing checks"](../../screenshots/BUG-CRX-227/code-reviewer-sees-failed-build-correctly.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-CRX-227/retest-yyyy-mm-dd-pass.png)

### Console / log

- Redmine `devops_builds` table, project `devops-detect-test`: build `#8`, Branch `sourabhzehntech01-star-patch-1`, Provider `github_actions`, SHA `dec81e4`, Trigger `manual`, GitHub Actions run URL `https://github.com/sourabhzehntech01-star/rftc038-qa-pipeline-test/actions/runs/45968555344` — Status observed as `Pending` (first two chat turns), then `Failed` (third chat turn, after the self-hosted runner picked up and ran the queued job) — all independently confirmed via direct Redmine UI navigation, not via the agent's own report.
- Chat session `ses-018`, three consecutive turns:
  - `2026-11-27T08:47:49Z` (build Pending) — "Can't tell — missing build information"
  - `2026-11-27T08:49:24Z` (build Pending, "Ask again" retry) — "Can't tell — missing build information and issue context"
  - (build Failed, "Ask again" retry) — "Needs changes — failing checks", `Checks: Failing ❌`, correctly citing the real build failure as finding #1

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A — first finding on Code Reviewer's build-data lookup specifically. Related in shape to the general "agent falsely denies/misses data that genuinely exists" family documented extensively in this suite's `_duplicates.md` (e.g. BUG-CRX-087, BUG-CRX-089, BUG-CRX-090), but this is the first instance scoped to Code Reviewer / DevOps builds data, and the first where the missing data is a **Pending**-status build specifically (worth checking whether the underlying query filters out non-terminal build statuses).
