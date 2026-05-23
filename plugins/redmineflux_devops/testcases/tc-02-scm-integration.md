# Test Cases — SCM Integration — Redmineflux DevOps

| Field | Value |
|-------|-------|
| **Plugin** | redmineflux_devops |
| **Module** | SCM Integration |
| **TC Range** | TC-RDV-041 to TC-RDV-090 |
| **Total TCs** | 50 |
| **Requirement Coverage** | SCM-001, SCM-002, SCM-003, SCM-004, SCM-005, SCM-006, SCM-007, SCM-008, SCM-009, SCM-010 |
| **Feature Coverage** | rfd-006, rfd-007, rfd-008, rfd-009, rfd-073, rfd-074, rfd-075, rfd-105, rfd-106 |

---

## SCM-001 — Commit History (rfd-006)

---

### TC-RDV-041 — GitHub push webhook links commit to issue via "Fixes #123" in message

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-006 Commit History |
| **Requirement Ref** | SCM-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project `phoenix-platform` exists with a connected GitHub repository.
- Issue `#123` exists in project `phoenix-platform` with status `In Progress`.
- A webhook secret is configured. The endpoint is: `POST /devops/webhook/github/phoenix-platform`.

**Test Data:**
- Commit SHA: `a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2`
- Commit message: `Fixes #123 — implement password reset endpoint`
- Author name: `raj.kumar`
- Author email: `raj@example.com`
- Branch: `feature/123-password-reset`
- Files changed: 3, additions: 45, deletions: 12

**Steps:**
1. Construct a GitHub `push` event JSON payload containing one commit with the message `Fixes #123 — implement password reset endpoint` and SHA `a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2`.
2. Compute a valid HMAC-SHA256 signature.
3. Send `POST /devops/webhook/github/phoenix-platform` with the payload and signature.
4. Navigate to issue `#123` in project `phoenix-platform`.
5. Scroll to the DevOps panel and expand the "Commits" section.

**Expected Result:**
- HTTP response is `202 Accepted`.
- A row appears in `redmineflux_devops_commits` with `issue_id = 123`, `commit_sha = a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2`, `author_name = raj.kumar`.
- On issue `#123` DevOps panel, the Commits section shows: "Commits (1)".
- Expanding reveals: SHA `a1b2c3` (short, clickable link), author `raj.kumar`, message `Fixes #123 — implement password reset endpoint`, branch `feature/123-password-reset`, files changed: 3, +45/-12.

---

### TC-RDV-042 — GitLab push webhook links commit to issue via "refs #123" in message

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-006 Commit History |
| **Requirement Ref** | SCM-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project `phoenix-platform` has a connected GitLab repository.
- GitLab webhook token is configured in the connection.
- Issue `#123` exists.

**Test Data:**
- Commit message: `refs #123 — add unit tests for password reset`
- Commit SHA: `b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3`
- Author: `priya.sharma`
- GitLab `X-Gitlab-Token` header: `gitlab_webhook_token`

**Steps:**
1. Construct a GitLab `Push Hook` JSON payload containing the commit with message `refs #123 — add unit tests for password reset`.
2. Set `X-Gitlab-Token: gitlab_webhook_token` in the request headers.
3. Set `X-Gitlab-Event: Push Hook`.
4. Send `POST /devops/webhook/gitlab/phoenix-platform`.
5. Navigate to issue `#123` DevOps panel.

**Expected Result:**
- HTTP response is `202 Accepted`.
- The commit is stored in `redmineflux_devops_commits` linked to `issue_id = 123`.
- The commit appears in the issue DevOps panel Commits section with SHA, author `priya.sharma`, and the message.
- The commit link points to the GitLab commit URL, not a GitHub URL.

---

### TC-RDV-043 — Commit with no issue reference is stored but not linked to any issue

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-006 Commit History |
| **Requirement Ref** | SCM-001 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- Project `phoenix-platform` has a connected GitHub repository.

**Test Data:**
- Commit message: `chore: update dependencies` (no issue reference)
- Commit SHA: `c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4`

**Steps:**
1. Send a valid GitHub push webhook with commit message `chore: update dependencies` (no `#` reference).
2. Check `redmineflux_devops_commits` for the new commit.
3. Check whether any issue's DevOps panel shows this commit.

**Expected Result:**
- The commit row is stored in `redmineflux_devops_commits` with `issue_id = NULL`.
- No issue's DevOps panel displays this commit.
- No error is raised; the webhook returns `202 Accepted`.

---

### TC-RDV-044 — Commit SHA uniqueness: same SHA can appear in multiple projects via composite index

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-006 Commit History |
| **Requirement Ref** | SCM-001 |
| **Priority** | High |
| **Scenario Type** | Edge / Data Integrity |

**Preconditions:**
- Two projects: `project-alpha` and `project-beta`, both connected to the same GitHub monorepo or a shared commit SHA.
- Same commit SHA `d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5` is referenced in both projects.

**Test Data:**
- Commit SHA: `d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5`
- Issue `#10` in `project-alpha`, Issue `#20` in `project-beta`

**Steps:**
1. Send a GitHub push webhook to `phoenix-platform` (representing `project-alpha`) containing commit SHA `d4e5f6...` with message `Fixes #10`.
2. Send a GitHub push webhook to `project-beta` containing the same commit SHA with message `refs #20`.
3. Query `redmineflux_devops_commits` for rows with `commit_sha = 'd4e5f6...'`.

**Expected Result:**
- Two rows exist in `redmineflux_devops_commits`, each with a different `project_id` and `issue_id`.
- No unique constraint violation occurs (the unique index is composite: `commit_sha + project_id`, not `commit_sha` alone).
- Issue `#10` in `project-alpha` and issue `#20` in `project-beta` each show the commit in their DevOps panels.

---

### TC-RDV-045 — Commits list on issue shows last 20 commits; "View all" link appears for more

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-006 Commit History |
| **Requirement Ref** | SCM-001 |
| **Priority** | Medium |
| **Scenario Type** | Boundary |

**Preconditions:**
- Issue `#123` has 25 commits linked to it in `redmineflux_devops_commits`.

**Test Data:**
- 25 commit records for issue_id 123.

**Steps:**
1. Navigate to issue `#123` DevOps panel.
2. Expand the "Commits" section.
3. Count the number of commit rows displayed.
4. Look for a "View all 25 →" link at the bottom of the section.

**Expected Result:**
- The Commits section shows exactly 10 commit rows (per the "up to 10 items" rule for inline DevOps panel display).
- A "View all 25 →" link appears at the bottom of the section.
- Clicking the link navigates to the full commits list page filtered for issue `#123`.

---

### TC-RDV-046 — Branch filter on commits list shows only commits from selected branch

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-006 Commit History |
| **Requirement Ref** | SCM-001 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Issue `#123` has 5 commits on branch `feature/123-login` and 3 commits on branch `hotfix/security-patch`.

**Test Data:**
- Branch filter value: `feature/123-login`

**Steps:**
1. Navigate to the full commits list for project `phoenix-platform` (DevOps > Commits tab).
2. Apply the branch filter: select `feature/123-login`.
3. Count the commits displayed.
4. Switch filter to `hotfix/security-patch`.
5. Count the commits displayed.

**Expected Result:**
- Step 3: Exactly 5 commits displayed, all with `branch = feature/123-login`.
- Step 5: Exactly 3 commits displayed, all with `branch = hotfix/security-patch`.
- No commits from other branches appear when a filter is active.

---

## SCM-002 — Pull Request / MR Tracking (rfd-007)

---

### TC-RDV-047 — GitHub PR opened webhook creates PR card on linked issue

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-007 PR / MR Tracking |
| **Requirement Ref** | SCM-002 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project `phoenix-platform` has a connected GitHub repository.
- Issue `#123` exists in the project.

**Test Data:**
- PR external ID: `45`
- PR title: `[#123] Add password reset endpoint`
- PR author: `raj.kumar`
- PR status: `open`
- Source branch: `feature/123-password-reset`
- Target branch: `main`
- Reviewers: `["priya.sharma", "arjun.dev"]`
- GitHub event: `pull_request` with action `opened`

**Steps:**
1. Construct a GitHub `pull_request` webhook payload with action `opened`, PR ID `45`, title `[#123] Add password reset endpoint`, source branch `feature/123-password-reset`.
2. Send `POST /devops/webhook/github/phoenix-platform` with valid signature.
3. Navigate to issue `#123` DevOps panel.
4. Expand the "Pull Requests" section.

**Expected Result:**
- HTTP response is `202 Accepted`.
- A row is created in `redmineflux_devops_pull_requests` with `issue_id = 123`, `external_id = 45`, `status = open`.
- The PR card on issue `#123` shows:
  - Title: `[#123] Add password reset endpoint` (clickable link to GitHub PR)
  - Status badge: `Open` (green)
  - Author: `raj.kumar`
  - Reviewers: `priya.sharma`, `arjun.dev`
- No duplicate PR record exists (unique on `external_id + repo_url`).

---

### TC-RDV-048 — PR status badges display correctly for all four states

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-007 PR / MR Tracking |
| **Requirement Ref** | SCM-002 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project `phoenix-platform` has 4 PRs linked to issue `#124`, one in each status.

**Test Data:**
- PR A: status `open`, external_id `50`
- PR B: status `draft`, external_id `51`
- PR C: status `merged`, external_id `52`
- PR D: status `closed`, external_id `53`

**Steps:**
1. Insert 4 PR records into `redmineflux_devops_pull_requests` for issue `#124` with the above statuses.
2. Navigate to issue `#124` DevOps panel.
3. Expand the Pull Requests section.
4. Observe the status badge for each PR card.

**Expected Result:**
- PR A (`open`): status badge shows `Open` in green.
- PR B (`draft`): status badge shows `Draft` in gray.
- PR C (`merged`): status badge shows `Merged` in purple.
- PR D (`closed`): status badge shows `Closed` in red.
- Each badge is clearly colour-coded and labelled distinctly.

---

### TC-RDV-049 — GitLab MR webhook creates MR record linked to issue

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-007 PR / MR Tracking |
| **Requirement Ref** | SCM-002 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project `phoenix-platform` has a connected GitLab repository.
- Issue `#125` exists.

**Test Data:**
- GitLab event: `Merge Request Hook`
- MR IID: `12`
- MR title: `Resolve #125: add OAuth login`
- MR state: `opened`
- Source branch: `feature/125-oauth`
- Target branch: `main`

**Steps:**
1. Construct a GitLab `Merge Request Hook` payload with title `Resolve #125: add OAuth login`.
2. Set `X-Gitlab-Token: <configured_token>` and `X-Gitlab-Event: Merge Request Hook`.
3. Send `POST /devops/webhook/gitlab/phoenix-platform`.
4. Navigate to issue `#125` DevOps panel and expand Pull Requests.

**Expected Result:**
- HTTP response is `202 Accepted`.
- An MR record is created in `redmineflux_devops_pull_requests` with `issue_id = 125`, `external_id = 12`, `status = open`.
- The PR card on issue `#125` shows the MR title, a link to GitLab, and status badge `Open`.
- The system correctly identifies the issue reference from the GitLab-style `Resolve #125:` prefix.

---

### TC-RDV-050 — Reviewer names and approval status are displayed on PR card

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-007 PR / MR Tracking |
| **Requirement Ref** | SCM-002 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- PR `#45` is linked to issue `#123` with reviewers stored as JSON: `[{"login":"priya.sharma","approved":true},{"login":"arjun.dev","approved":false}]`.

**Test Data:**
- Reviewer 1: `priya.sharma` — approved: true
- Reviewer 2: `arjun.dev` — approved: false (pending)

**Steps:**
1. Navigate to issue `#123` DevOps panel.
2. Expand the Pull Requests section.
3. Open PR card for PR `#45`.
4. Observe the reviewer section.

**Expected Result:**
- Reviewer `priya.sharma` is shown with an `Approved` checkmark badge (green).
- Reviewer `arjun.dev` is shown with a `Pending` badge (yellow or gray).
- The total review count is shown: "1 of 2 reviewers approved."

---

## SCM-003 — Branch Status Badges (rfd-008)

---

### TC-RDV-051 — Branch badge shows green when CI checks pass and branch is mergeable

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-008 Branch Status Badges |
| **Requirement Ref** | SCM-003 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- PR `#45` exists for issue `#123`, linked to branch `feature/123-password-reset`.
- A GitHub `check_suite` webhook event with `conclusion = success` is received for this branch.

**Test Data:**
- GitHub `check_suite` event: `action = completed`, `conclusion = success`, branch: `feature/123-password-reset`

**Steps:**
1. Send a GitHub `check_suite` webhook with `conclusion = success` for branch `feature/123-password-reset`.
2. Navigate to issue `#123` DevOps panel.
3. Locate the branch status badge next to `feature/123-password-reset`.

**Expected Result:**
- The `checks_status` field on the PR record is updated to `success`.
- The branch status badge is green.
- Tooltip on the badge reads: "All checks passed."

---

### TC-RDV-052 — Branch badge shows red when CI checks fail

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-008 Branch Status Badges |
| **Requirement Ref** | SCM-003 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- PR `#45` exists for branch `feature/123-password-reset`.

**Test Data:**
- GitHub `check_suite` event: `action = completed`, `conclusion = failure`

**Steps:**
1. Send a GitHub `check_suite` webhook with `conclusion = failure` for `feature/123-password-reset`.
2. Navigate to issue `#123` DevOps panel and find the branch status badge.

**Expected Result:**
- The `checks_status` field on the PR record updates to `failure`.
- The branch status badge is red.
- Tooltip reads: "1 or more checks failed."

---

### TC-RDV-053 — Branch badge shows yellow when branch is behind the default branch

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-008 Branch Status Badges |
| **Requirement Ref** | SCM-003 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- PR `#46` for branch `feature/126-settings` has CI checks passing but the branch is 3 commits behind `main`.

**Test Data:**
- `checks_status = success`
- `commits_behind_default = 3`

**Steps:**
1. Update the PR record to reflect `checks_status = success` and `commits_behind = 3`.
2. Navigate to the issue DevOps panel with this PR.
3. Observe the branch status badge.

**Expected Result:**
- Badge is yellow (warning state).
- Tooltip reads: "Checks pass but branch is 3 commits behind main."

---

## SCM-004 — Auto Issue Transition on PR Merge (rfd-009)

---

### TC-RDV-054 — PR merged webhook auto-transitions issue to configured target status

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-009 Auto Issue Transition on PR Merge |
| **Requirement Ref** | SCM-004 |
| **Priority** | High |
| **Scenario Type** | Positive / Workflow |

**Preconditions:**
- Project `phoenix-platform` has auto-transition configured: "On PR Merge, move issue from `In Review` to `Ready for QA`".
- Issue `#123` is currently in status `In Review`.
- PR `#45` is linked to issue `#123`.
- The Redmine workflow permits the transition from `In Review` to `Ready for QA` for the `Developer` role.

**Test Data:**
- GitHub PR event: `action = closed`, `merged = true`, PR number `45`

**Steps:**
1. Send a GitHub `pull_request` webhook with `action = closed` and `merged = true` for PR `#45`.
2. Wait for the webhook to be processed (up to 10 seconds).
3. Navigate to issue `#123` and check its status.
4. Check the issue journal/history.

**Expected Result:**
- Issue `#123` status changes from `In Review` to `Ready for QA`.
- A journal entry is automatically added to issue `#123`:
  `"Status changed by DevOps integration (PR #45 merged by raj.kumar)"`
- The journal entry is timestamped within seconds of the webhook receipt.
- The change is attributed to a system actor (e.g., "DevOps Integration"), not a human user.

---

### TC-RDV-055 — Auto-transition adds correct journal entry text

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-009 Auto Issue Transition on PR Merge |
| **Requirement Ref** | SCM-004 |
| **Priority** | High |
| **Scenario Type** | Positive / Workflow |

**Preconditions:**
- Auto-transition is configured on `phoenix-platform`.
- PR `#47` (merged) is linked to issue `#130`.
- Issue `#130` was in status `In Review`.

**Test Data:**
- PR merge event for PR `#47`, branch `feature/130-reports`

**Steps:**
1. Send the PR merged webhook for PR `#47`.
2. Open issue `#130`.
3. Scroll to the journal/history section.
4. Inspect the auto-generated journal entry.

**Expected Result:**
- The journal entry reads exactly: `"Status changed by DevOps integration (PR #47 merged)"`.
- The status change entry shows `In Review → Ready for QA`.
- No other unexpected fields or changes are recorded in the journal.

---

### TC-RDV-056 — Auto-transition respects workflow guards — blocked transition is not applied

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-009 Auto Issue Transition on PR Merge |
| **Requirement Ref** | SCM-004 |
| **Priority** | High |
| **Scenario Type** | Negative / Workflow |

**Preconditions:**
- Project `phoenix-platform` has auto-transition configured: `In Review → Ready for QA`.
- Issue `#131` is currently in status `New` (NOT `In Review`).
- The Redmine workflow does NOT permit a direct transition from `New` to `Ready for QA`.
- PR `#48` is linked to issue `#131`.

**Test Data:**
- PR `#48` merged event.
- Issue `#131` current status: `New`.

**Steps:**
1. Send the PR merged webhook for PR `#48` linked to issue `#131`.
2. Wait for processing.
3. Check issue `#131` status.
4. Check the issue journal for any auto-transition attempts.

**Expected Result:**
- Issue `#131` status remains `New` (transition not applied because `New → Ready for QA` is not an allowed workflow step).
- The `new_statuses_allowed_to` guard check prevents the transition.
- No journal entry about "Status changed by DevOps integration" appears on this issue.
- The webhook is processed without error (202 returned); the auto-transition simply does nothing.

---

### TC-RDV-057 — Auto-transition can be disabled per project

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-009 Auto Issue Transition on PR Merge |
| **Requirement Ref** | SCM-004 |
| **Priority** | High |
| **Scenario Type** | Negative / Workflow |

**Preconditions:**
- Project `project-beta` has auto-transition disabled (toggle set to off in DevOps settings).
- Issue `#200` in `project-beta` is in status `In Review`.
- PR `#60` is linked to issue `#200`.

**Test Data:**
- Auto-transition setting for `project-beta`: `disabled`

**Steps:**
1. Confirm that DevOps Settings for `project-beta` shows auto-transition as `Disabled`.
2. Send a GitHub PR merged webhook for PR `#60` linked to issue `#200`.
3. Wait for processing.
4. Check issue `#200` status.

**Expected Result:**
- Issue `#200` status remains `In Review` (unchanged).
- No journal entry "Status changed by DevOps integration" appears.
- The webhook is accepted (202) but the auto-transition logic is skipped for this project.

---

### TC-RDV-058 — Auto-transition does not fire for unlinked PRs

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-009 Auto Issue Transition on PR Merge |
| **Requirement Ref** | SCM-004 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- Auto-transition is enabled on `phoenix-platform`.
- PR `#61` is merged but its title is `Update README` (no issue reference in title or branch name).

**Test Data:**
- PR merged event for PR `#61`, title: `Update README`, branch: `docs/update-readme`

**Steps:**
1. Send a GitHub PR merged webhook for PR `#61` with no issue reference.
2. Verify no issues are auto-transitioned.
3. Verify no journal entries are created.

**Expected Result:**
- No Redmine issues are modified.
- No journal entries are created.
- The webhook is processed without error.

---

## SCM-005 — Repository Connection Manager (rfd-002)

---

### TC-RDV-059 — Multiple repositories can be linked to one project

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-002 Connection Manager, SCM-005 |
| **Requirement Ref** | SCM-005 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Admin is logged in.
- Project `phoenix-platform` exists.

**Test Data:**
- Repo 1: `https://github.com/acme/phoenix-api` (GitHub)
- Repo 2: `https://github.com/acme/phoenix-frontend` (GitHub)
- Repo 3: `https://gitlab.com/acme/phoenix-worker` (GitLab)

**Steps:**
1. Navigate to Project Settings > DevOps > Connections.
2. Add repo 1 (`phoenix-api`, GitHub) and save.
3. Add repo 2 (`phoenix-frontend`, GitHub) and save.
4. Add repo 3 (`phoenix-worker`, GitLab) and save.
5. View the connections list.

**Expected Result:**
- Three connections are listed, each with the correct provider badge (GitHub/GitHub/GitLab) and status `connected`.
- All three repos receive webhooks independently on subsequent pushes.
- No error about duplicate repos (each has a unique `repo_url`).

---

### TC-RDV-060 — Duplicate repo URL for the same project is rejected

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-002 Connection Manager |
| **Requirement Ref** | SCM-005 |
| **Priority** | Medium |
| **Scenario Type** | Negative / Validation |

**Preconditions:**
- A GitHub connection for `https://github.com/acme/phoenix-api` already exists on `phoenix-platform`.

**Test Data:**
- Duplicate repo URL: `https://github.com/acme/phoenix-api`

**Steps:**
1. Navigate to Project Settings > DevOps > Connections.
2. Attempt to add a new connection with the same URL `https://github.com/acme/phoenix-api`.
3. Click Save.

**Expected Result:**
- A validation error is displayed: "Repository URL already exists for this project."
- No duplicate record is created in `redmineflux_devops_repositories`.
- The unique constraint on `(project_id, repo_url)` prevents the duplicate.

---

## SCM-006 — Branch Creation from Issue (rfd-073)

---

### TC-RDV-061 — Developer can create a branch from issue page using default naming template

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-073 Branch Creation from Issue |
| **Requirement Ref** | SCM-006 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- User `dev_user` has `Developer` role with `trigger_builds` or equivalent create-branch permission.
- Issue `#123` has subject `Implement password reset endpoint`.
- Project `phoenix-platform` is connected to `https://github.com/acme/phoenix-api` with a valid token.
- The default branch of the repo is `main`.

**Test Data:**
- Issue subject: `Implement password reset endpoint`
- Expected branch name: `feature/123-implement-password-reset-endpoint`

**Steps:**
1. Log in as `dev_user`.
2. Navigate to issue `#123`.
3. Click the "Create Branch" button in the DevOps panel (or issue sidebar).
4. Confirm the pre-filled branch name: `feature/123-implement-password-reset-endpoint`.
5. Click "Create".
6. Wait for the success/error notification.

**Expected Result:**
- A success notification appears: "Branch `feature/123-implement-password-reset-endpoint` created successfully."
- The branch is created from `main` in the GitHub repo via the GitHub API.
- The branch is immediately visible in the branch status badge area on the issue.
- The branch name format follows: `feature/{issue_id}-{subject-slug}` (slug is lowercased, spaces replaced with hyphens, special characters stripped).

---

### TC-RDV-062 — Branch naming template is configurable per project

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-073 Branch Creation from Issue |
| **Requirement Ref** | SCM-006 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Admin has configured the branch naming template for `phoenix-platform` to: `issues/{issue_id}/{subject-slug}`.

**Test Data:**
- Issue `#130` subject: `Fix login timeout`
- Custom template: `issues/{issue_id}/{subject-slug}`
- Expected branch name: `issues/130/fix-login-timeout`

**Steps:**
1. Navigate to Project Settings > DevOps > SCM Settings.
2. Set the branch name template to `issues/{issue_id}/{subject-slug}`.
3. Save the setting.
4. Navigate to issue `#130`.
5. Click "Create Branch".
6. Observe the pre-filled branch name.

**Expected Result:**
- The "Create Branch" form pre-fills with `issues/130/fix-login-timeout`.
- After creation, the branch `issues/130/fix-login-timeout` appears in the connected GitHub/GitLab repository.

---

### TC-RDV-063 — Non-member cannot create a branch from issue page

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-073 Branch Creation from Issue |
| **Requirement Ref** | SCM-006 |
| **Priority** | High |
| **Scenario Type** | Permission / Negative |

**Preconditions:**
- User `external_user` is not a member of project `phoenix-platform`.

**Test Data:**
- Issue ID: 123

**Steps:**
1. Log in as `external_user`.
2. Attempt to navigate to issue `#123`.
3. Attempt `POST /projects/phoenix-platform/issues/123/devops_create_branch`.

**Expected Result:**
- Step 2: Issue `#123` is not accessible to `external_user` for a private project (403).
- Step 3: HTTP 403 Forbidden.
- No branch is created in any SCM repository.
- The "Create Branch" button is not rendered in the UI for users without the required permission.

---

### TC-RDV-064 — Branch creation fails gracefully when SCM API returns an error

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-073 Branch Creation from Issue |
| **Requirement Ref** | SCM-006 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- Project `phoenix-platform` has a GitHub connection with an expired token (API returns 401).
- Issue `#123` exists.

**Test Data:**
- GitHub API response: 401 Unauthorized (token expired)

**Steps:**
1. Log in as `dev_user`.
2. Navigate to issue `#123`.
3. Click "Create Branch".
4. Click "Create" to confirm.
5. Observe the result notification.

**Expected Result:**
- An error notification appears: "Branch creation failed — GitHub API returned 401 Unauthorized. Please check the connection token."
- No branch is created.
- Issue `#123` remains unchanged.
- The error does not expose the raw token or internal stack trace in the UI.

---

## SCM-007 — PR Review Dashboard (rfd-074)

---

### TC-RDV-065 — PR Review Dashboard shows all open PRs sorted oldest first

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-074 PR Review Dashboard |
| **Requirement Ref** | SCM-007 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project `phoenix-platform` has 5 open PRs in `redmineflux_devops_pull_requests`.
- PR ages (time since opened): PR-A: 6 days, PR-B: 1 day, PR-C: 3 days, PR-D: 10 days, PR-E: 2 days.
- User `lead_user` has `Manager` role with `view_devops` permission.

**Test Data:**
- Expected order (oldest first): PR-D (10d), PR-A (6d), PR-C (3d), PR-E (2d), PR-B (1d)

**Steps:**
1. Log in as `lead_user`.
2. Navigate to Project > DevOps > Pull Requests (or the PR Review Dashboard widget).
3. Observe the order of PR rows.

**Expected Result:**
- PRs are listed in ascending order by age: PR-D first (oldest at 10 days), PR-B last (newest at 1 day).
- Each row shows: PR title, author, age (e.g., "10 days ago"), reviewer names, CI check status badge.
- Closed and merged PRs are not shown in this view.

---

### TC-RDV-066 — Stale PRs are highlighted when older than configured threshold

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-074 PR Review Dashboard |
| **Requirement Ref** | SCM-007 |
| **Priority** | High |
| **Scenario Type** | Positive / Boundary |

**Preconditions:**
- The stale PR threshold is configured to `2 days` for `phoenix-platform`.
- PR-D is 10 days old. PR-A is 6 days old. PR-C is 3 days old. PR-E is exactly 2 days old. PR-B is 1 day old.

**Test Data:**
- Stale threshold: 2 days
- PRs older than threshold: PR-D (10d), PR-A (6d), PR-C (3d), PR-E (exactly 2d — boundary)

**Steps:**
1. Log in as `lead_user`.
2. Navigate to the PR Review Dashboard for `phoenix-platform`.
3. Observe row highlighting for each PR.

**Expected Result:**
- PR-D, PR-A, and PR-C rows are highlighted with a visual indicator (e.g., yellow background or orange age badge).
- PR-E (exactly at threshold, 2 days): marked stale if the threshold is "older than 2 days" (exclusive) — verify boundary behaviour against spec.
- PR-B (1 day old) is NOT highlighted.
- A "stale" tooltip or label appears on highlighted rows: "This PR has been open for N days without review."

---

### TC-RDV-067 — PR Review Dashboard is not accessible to non-project members

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-074 PR Review Dashboard |
| **Requirement Ref** | SCM-007 |
| **Priority** | High |
| **Scenario Type** | Permission / Negative |

**Preconditions:**
- User `external_user` is not a member of `phoenix-platform`.

**Test Data:**
- Dashboard URL: `/projects/phoenix-platform/devops_pull_requests`

**Steps:**
1. Log in as `external_user`.
2. Attempt to navigate to `/projects/phoenix-platform/devops_pull_requests`.

**Expected Result:**
- HTTP 403 Forbidden.
- No PR data is returned.
- The URL is not accessible without project membership and `view_devops` permission.

---

## SCM-008 — Code Review Reminders (rfd-075)

---

### TC-RDV-068 — Reviewer receives email notification when review is requested

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-075 Code Review Reminders |
| **Requirement Ref** | SCM-008 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- GitHub user `priya.sharma` is mapped to Redmine user `priya.s` via the `reviewer_login_map` project setting.
- User `priya.s` has an email address configured in Redmine.
- PR `#50` has been opened for issue `#135`.

**Test Data:**
- GitHub event: `pull_request` with action `review_requested`
- Reviewer login: `priya.sharma`
- PR title: `Add OAuth login for issue #135`

**Steps:**
1. Configure `reviewer_login_map` for `phoenix-platform`: `priya.sharma → priya.s`.
2. Send a GitHub `pull_request` webhook with `action = review_requested` and `requested_reviewer.login = priya.sharma` for PR `#50`.
3. Wait up to 30 seconds.
4. Check `priya.s`'s email inbox.

**Expected Result:**
- `priya.s` receives an email notification with subject: "Code review requested: Add OAuth login for issue #135."
- The email body includes a link to the PR on GitHub and a link to Redmine issue `#135`.
- The email is sent via `DevopsReviewMailer`.
- No notification is sent to reviewers not mapped in `reviewer_login_map`.

---

### TC-RDV-069 — Reviewer not mapped in reviewer_login_map receives no notification

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-075 Code Review Reminders |
| **Requirement Ref** | SCM-008 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- `reviewer_login_map` for `phoenix-platform` only contains `priya.sharma → priya.s`.
- Reviewer `unknown.dev` is NOT in the map.

**Test Data:**
- Review requested from `unknown.dev` on PR `#51`.

**Steps:**
1. Send a `review_requested` webhook with `requested_reviewer.login = unknown.dev`.
2. Observe system logs and email deliveries.

**Expected Result:**
- No email notification is sent (no Redmine user to send it to).
- No error is raised; the webhook is processed and returns `202 Accepted`.
- A warning log entry is created: "Reviewer login 'unknown.dev' not found in reviewer_login_map. Notification skipped."

---

## SCM-009 — Commit Statistics per Project (rfd-106)

---

### TC-RDV-070 — Commit statistics show daily aggregation for the configured time window

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-106 Commit Statistics per Project |
| **Requirement Ref** | SCM-009 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- 30 commits are stored in `redmineflux_devops_commits` for `phoenix-platform` over the last 7 days (days 1–7).
- Day 1: 5 commits; Day 2: 3; Day 3: 7; Day 4: 2; Day 5: 8; Day 6: 1; Day 7: 4.
- User has `view_devops` permission (protected by `:view_devops_data`).

**Test Data:**
- Time window: `7 days`

**Steps:**
1. Navigate to Project > DevOps > Commits (or the commit stats widget).
2. Set time window to "Last 7 days".
3. Observe the daily commit frequency chart.

**Expected Result:**
- A bar chart or table shows one entry per day for the last 7 days.
- Each bar/row reflects the correct commit count per day.
- Total across 7 days: 30 commits.
- The data is correctly aggregated by `CommitStats` service.

---

### TC-RDV-071 — Top-10 contributors list is correctly ordered

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-106 Commit Statistics per Project |
| **Requirement Ref** | SCM-009 |
| **Priority** | Medium |
| **Scenario Type** | Positive / Boundary |

**Preconditions:**
- 15 authors have committed to `phoenix-platform`. The top contributor has 50 commits; the 10th has 5; the 11th has 4.

**Test Data:**
- Author commit counts: [50, 40, 30, 25, 20, 15, 12, 10, 7, 5, 4, 3, 2, 1, 1]

**Steps:**
1. Navigate to the commit statistics page for `phoenix-platform`.
2. View the "Top Contributors" section.
3. Count the number of contributors listed.
4. Verify the order.

**Expected Result:**
- Exactly 10 contributors are listed (top-N cap is 10, per `CommitStats` service spec).
- The contributor with 50 commits is ranked #1, the contributor with 5 commits is ranked #10.
- The contributor with 4 commits (rank #11) does NOT appear.
- Contributors are sorted in descending order by commit count.

---

### TC-RDV-072 — Commit stats page requires view_devops permission

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-106 Commit Statistics per Project |
| **Requirement Ref** | SCM-009 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User `reporter_user` has `Reporter` role without `view_devops` permission.

**Test Data:**
- Stats URL: `/projects/phoenix-platform/devops_commit_stats`

**Steps:**
1. Log in as `reporter_user`.
2. Navigate to the commit statistics URL.

**Expected Result:**
- HTTP 403 Forbidden.
- No commit data is returned.

---

## SCM-010 — Code Quality Gate Results (rfd-107)

---

### TC-RDV-073 — SonarQube webhook stores quality gate result and shows badge on PR

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-107 Code Quality Gate Results |
| **Requirement Ref** | SCM-010 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project `phoenix-platform` has a SonarQube connection configured.
- PR `#45` is linked to issue `#123` via commit SHA `a1b2c3d4...`.
- SonarQube sends a webhook after analysis.

**Test Data:**
- SonarQube webhook payload:
  - `status = PASSED`
  - `commit_sha = a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2`
  - Metrics: `bugs = 0`, `vulnerabilities = 0`, `code_smells = 3`, `coverage = 82%`

**Steps:**
1. Send a SonarQube webhook to `POST /devops/webhook/sonarqube/phoenix-platform` with the quality gate payload for commit SHA `a1b2c3d4...`.
2. Navigate to issue `#123` DevOps panel and expand Pull Requests.
3. Observe the quality gate badge on PR `#45`.

**Expected Result:**
- A record is created in `redmineflux_devops_code_quality_results` linked to PR `#45` via `commit_sha`.
- PR `#45` card shows a badge: "Quality Gate: Passed" (green).
- Badge tooltip or detail shows: bugs: 0, vulnerabilities: 0, code smells: 3, coverage: 82%.

---

### TC-RDV-074 — SonarQube quality gate failed shows red badge on PR

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-107 Code Quality Gate Results |
| **Requirement Ref** | SCM-010 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- Same setup as TC-RDV-073.

**Test Data:**
- SonarQube webhook: `status = FAILED`, `bugs = 5`, `vulnerabilities = 2`, `coverage = 45%`

**Steps:**
1. Send a SonarQube webhook with `status = FAILED` for the same commit SHA as PR `#45`.
2. Navigate to issue `#123` Pull Requests panel.

**Expected Result:**
- PR `#45` badge shows: "Quality Gate: Failed" (red).
- Badge tooltip shows: bugs: 5, vulnerabilities: 2, coverage: 45%.

---

## SCM Multi-Repo (rfd-105)

---

### TC-RDV-075 — Cross-project repository reference is rejected with 404

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-105 Deterministic Multi-Repo Selection |
| **Requirement Ref** | SCM-005 |
| **Priority** | High |
| **Scenario Type** | Security / Negative |

**Preconditions:**
- Repository `repo-A` (ID: 10) belongs to project `project-alpha`.
- Repository `repo-B` (ID: 20) belongs to project `project-beta`.
- User `dev_user` is a member of both projects.

**Test Data:**
- Request: create branch on `project-alpha` but passing `repository_id = 20` (which belongs to `project-beta`).

**Steps:**
1. Log in as `dev_user`.
2. Navigate to issue `#150` in `project-alpha`.
3. Attempt to trigger branch creation specifying `repository_id = 20` (a repo from `project-beta`) in the POST request body.

**Expected Result:**
- HTTP 404 Not Found is returned.
- No branch is created.
- The `resolve_repository` helper correctly rejects cross-project repository IDs that do not belong to the current project scope.

---

### TC-RDV-076 — Project default repository is used when no repository_id is specified

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-105 Deterministic Multi-Repo Selection |
| **Requirement Ref** | SCM-005 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project `phoenix-platform` has 3 repositories: IDs 5, 7, 9.
- The project default repository is configured to ID `7` in DevOps settings.

**Test Data:**
- Branch creation request with no `repository_id` parameter.

**Steps:**
1. Navigate to issue `#155` in `phoenix-platform`.
2. Click "Create Branch" without selecting a specific repository.
3. Confirm branch creation.

**Expected Result:**
- The branch is created in repository ID `7` (the project-configured default).
- The resolution precedence is followed: params (none) → project default setting (ID 7) → smallest ID (not reached).

---

### TC-RDV-077 — When no default is set, repository with smallest ID is used as fallback

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-105 Deterministic Multi-Repo Selection |
| **Requirement Ref** | SCM-005 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- Project `phoenix-platform` has 2 repositories: IDs 5 and 9.
- No default repository has been configured in project DevOps settings.

**Test Data:**
- Branch creation request with no `repository_id`.

**Steps:**
1. Navigate to issue `#156` in `phoenix-platform`.
2. Click "Create Branch" without specifying a repository.
3. Confirm branch creation.

**Expected Result:**
- The branch is created in repository ID `5` (smallest ID fallback).
- No error occurs; the system deterministically selects the fallback without ambiguity.

---

## Additional SCM Integration Tests — Permission, Workflow, Edge Cases

---

### TC-RDV-078 — QA user can view commits and PRs but cannot create branches

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-006, rfd-007, rfd-073 |
| **Requirement Ref** | SCM-001, SCM-002, SCM-006 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User `qa_user` has `QA` role on `phoenix-platform` with `view_devops` permission.
- `QA` role does NOT have the permission to create branches (per permissions matrix: `Create Branch from Issue` is Admin/Developer/DevOps Engineer only).

**Test Data:**
- Login: `qa_user`

**Steps:**
1. Log in as `qa_user`.
2. Navigate to issue `#123` DevOps panel.
3. Verify Commits section is visible and expandable.
4. Verify Pull Requests section is visible and expandable.
5. Look for the "Create Branch" button.
6. Attempt `POST /projects/phoenix-platform/issues/123/devops_create_branch`.

**Expected Result:**
- Steps 3–4: Commits and PR sections are visible and load data (view_devops is granted).
- Step 5: "Create Branch" button is NOT visible.
- Step 6: HTTP 403 Forbidden.

---

### TC-RDV-079 — PR linked to multiple issues updates each issue's DevOps panel

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-007 PR / MR Tracking |
| **Requirement Ref** | SCM-002 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- PR `#55` title: `Fixes #140 and refs #141 — combined auth fix`.
- Issues `#140` and `#141` both exist in `phoenix-platform`.

**Test Data:**
- PR opened event for PR `#55`.

**Steps:**
1. Send a GitHub PR `opened` webhook for PR `#55` with title `Fixes #140 and refs #141 — combined auth fix`.
2. Navigate to issue `#140` DevOps panel.
3. Expand Pull Requests.
4. Navigate to issue `#141` DevOps panel.
5. Expand Pull Requests.

**Expected Result:**
- PR `#55` card appears on BOTH issue `#140` and issue `#141` DevOps panels.
- Two records are created in `redmineflux_devops_pull_requests` (one per linked issue).
- Each record correctly references the PR external ID `55`.

---

### TC-RDV-080 — PR card shows CI check results inline

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-007, rfd-008 |
| **Requirement Ref** | SCM-002, SCM-003 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- PR `#45` for issue `#123` exists.
- A `check_suite` webhook has been received with `conclusion = success`.

**Test Data:**
- PR checks status: `success` (all checks passed)

**Steps:**
1. Navigate to issue `#123` DevOps panel.
2. Expand Pull Requests section.
3. Inspect the CI check status on the PR card.

**Expected Result:**
- The PR card shows a CI check badge: "Checks: Passed" (green checkmark).
- This badge reflects the `checks_status` field populated by the `check_suite` webhook handler.

---

### TC-RDV-081 — Auto-transition journal entry is attributed to DevOps integration actor, not a user

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-009 Auto Issue Transition on PR Merge |
| **Requirement Ref** | SCM-004 |
| **Priority** | High |
| **Scenario Type** | Workflow / Audit |

**Preconditions:**
- Auto-transition is configured for `phoenix-platform`.
- PR merge event is sent for a PR linked to issue `#123`.

**Test Data:**
- PR `#45` merged.

**Steps:**
1. Send the PR merged webhook.
2. Navigate to issue `#123` history/journal.
3. Inspect the author of the auto-generated journal entry.

**Expected Result:**
- The journal entry "Status changed by DevOps integration (PR #45 merged)" is authored by a system actor — NOT attributed to any real Redmine user account.
- The author is displayed as e.g. "DevOps Integration" or a designated system user.
- This prevents the auto-transition from falsely appearing in any user's activity log as a manual change.

---

### TC-RDV-082 — Commit SHA link on issue panel opens correct GitHub/GitLab URL

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-006 Commit History |
| **Requirement Ref** | SCM-001 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Issue `#123` has a linked commit with SHA `a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2` from GitHub repo `https://github.com/acme/phoenix-api`.
- `repo_url` is stored as `https://github.com/acme/phoenix-api`.

**Test Data:**
- Full SHA: `a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2`
- Expected commit URL: `https://github.com/acme/phoenix-api/commit/a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2`

**Steps:**
1. Navigate to issue `#123` DevOps panel.
2. Expand Commits section.
3. Click the short SHA link `a1b2c3`.

**Expected Result:**
- The link `href` is `https://github.com/acme/phoenix-api/commit/a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2`.
- Clicking opens the GitHub commit page in a new tab.
- For GitLab commits, the URL uses the pattern `https://gitlab.com/{namespace}/{project}/-/commit/{sha}`.

---

### TC-RDV-083 — PR merged event updates PR record status to "merged"

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-007 PR / MR Tracking |
| **Requirement Ref** | SCM-002 |
| **Priority** | High |
| **Scenario Type** | Positive / Workflow |

**Preconditions:**
- PR `#45` is stored in `redmineflux_devops_pull_requests` with `status = open`.

**Test Data:**
- GitHub `pull_request` event: `action = closed`, `merged = true`, PR number `45`, `merged_at = <timestamp>`

**Steps:**
1. Send a GitHub webhook for PR `#45` with `action = closed` and `merged = true`.
2. Query `redmineflux_devops_pull_requests` for PR `external_id = 45`.
3. Navigate to issue `#123` DevOps panel and expand Pull Requests.

**Expected Result:**
- The PR record's `status` field is updated to `merged`.
- The `merged_at` timestamp is stored.
- The PR card on issue `#123` shows status badge `Merged` (purple).
- The `updated_at` timestamp on the PR record is refreshed.

---

### TC-RDV-084 — PR closed without merge updates PR status to "closed"

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-007 PR / MR Tracking |
| **Requirement Ref** | SCM-002 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- PR `#46` is stored with `status = open`.

**Test Data:**
- GitHub event: `action = closed`, `merged = false`

**Steps:**
1. Send a GitHub webhook for PR `#46` with `action = closed` and `merged = false`.
2. Check the PR record and the issue DevOps panel.

**Expected Result:**
- PR `#46` status updates to `closed` (not `merged`).
- The PR card shows badge `Closed` (red).
- No auto-transition fires (auto-transition only triggers on merge, not on close-without-merge).

---

### TC-RDV-085 — Commits list shows diff stats (additions and deletions)

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-006 Commit History |
| **Requirement Ref** | SCM-001 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Commit `a1b2c3d...` for issue `#123` has: `files_changed = 4`, `additions = 60`, `deletions = 20`.

**Test Data:**
- Commit fields: files_changed = 4, additions = 60, deletions = 20

**Steps:**
1. Navigate to issue `#123` DevOps panel.
2. Expand the Commits section.
3. Locate the row for commit `a1b2c3d`.
4. Observe the diff statistics column.

**Expected Result:**
- The commit row displays: `4 files changed`, `+60` (green), `-20` (red).
- These match the stored `files_changed`, `additions`, and `deletions` fields.

---

### TC-RDV-086 — Weekly commit aggregation is correct in commit statistics

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-106 Commit Statistics |
| **Requirement Ref** | SCM-009 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- 28 commits over the last 4 weeks: Week 1: 10, Week 2: 5, Week 3: 8, Week 4: 5.

**Test Data:**
- Time window: 4 weeks (28 days)

**Steps:**
1. Navigate to Project > DevOps > Commit Statistics.
2. Set the time window to "Last 4 weeks" (weekly view).
3. Observe the weekly totals.

**Expected Result:**
- Four weekly data points are shown.
- Week 1: 10, Week 2: 5, Week 3: 8, Week 4: 5 (matching the stored commit data).
- The `CommitStats` service correctly groups commits using weekly aggregation.

---

### TC-RDV-087 — Multiple PRs on one issue are all displayed (no single-PR limit)

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-007 PR / MR Tracking |
| **Requirement Ref** | SCM-002 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- Issue `#123` has 3 PRs linked: PR `#45` (open), PR `#46` (merged), PR `#47` (closed).

**Test Data:**
- 3 PR records, all with `issue_id = 123`.

**Steps:**
1. Navigate to issue `#123` DevOps panel.
2. Expand the Pull Requests section.
3. Count the PR cards displayed.

**Expected Result:**
- All 3 PR cards are displayed.
- Each shows its correct status badge: PR `#45` Open, PR `#46` Merged, PR `#47` Closed.
- The requirement states "Supports multiple PRs per issue" — this is validated.

---

### TC-RDV-088 — Admin can configure auto-transition rules per project in DevOps settings

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-009 Auto Issue Transition |
| **Requirement Ref** | SCM-004 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Admin or DevOps Engineer is logged in.
- Project `phoenix-platform` exists.
- Redmine statuses available: `New`, `In Progress`, `In Review`, `Ready for QA`, `Resolved`.

**Test Data:**
- Auto-transition rule: Source status = `In Review`, Target status = `Ready for QA`, Trigger = `PR Merged`

**Steps:**
1. Navigate to Project Settings > DevOps > Auto-Transition Rules.
2. Click "Add Rule".
3. Set Source Status to `In Review`.
4. Set Target Status to `Ready for QA`.
5. Set Trigger to `PR Merged`.
6. Click Save.
7. Verify the rule appears in the rules list.

**Expected Result:**
- The rule is saved and displayed: `On PR Merge: In Review → Ready for QA`.
- Only Admin and DevOps Engineer roles can access this settings page (Developer receives 403).
- A `Developer` user attempting to POST the settings form receives HTTP 403.

---

### TC-RDV-089 — GitHub push event with multiple commits links each commit referencing an issue

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-006 Commit History |
| **Requirement Ref** | SCM-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project `phoenix-platform` is connected to a GitHub repo.
- Issues `#110` and `#111` both exist.

**Test Data:**
- Push event containing 3 commits:
  - Commit 1 SHA: `aaa001`, message: `Fixes #110 — fix null pointer`
  - Commit 2 SHA: `bbb002`, message: `refs #111 — add unit tests`
  - Commit 3 SHA: `ccc003`, message: `chore: bump version`

**Steps:**
1. Send a GitHub push webhook containing all 3 commits in a single payload.
2. Navigate to issue `#110` DevOps panel > Commits.
3. Navigate to issue `#111` DevOps panel > Commits.

**Expected Result:**
- Issue `#110` DevOps panel shows commit `aaa001`.
- Issue `#111` DevOps panel shows commit `bbb002`.
- Commit `ccc003` (no issue reference) is stored but not linked to any issue.
- All 3 commits are stored in `redmineflux_devops_commits` for `phoenix-platform`.
- Only one webhook response (202) is returned for the single push event payload.

---

### TC-RDV-090 — PR review reminder daily digest is sent via rake task

| Field | Value |
|-------|-------|
| **Module** | SCM Integration |
| **Feature** | rfd-075 Code Review Reminders |
| **Requirement Ref** | SCM-008 |
| **Priority** | Medium |
| **Scenario Type** | Positive / Workflow |

**Preconditions:**
- User `priya.s` has 2 pending PR reviews assigned (PRs #50 and #52) as of today.
- The `reviewer_login_map` correctly maps `priya.sharma` to `priya.s`.
- Redmine email delivery is configured.

**Test Data:**
- PRs with review_requested for `priya.sharma`: PR `#50` (3 days old), PR `#52` (1 day old).

**Steps:**
1. Run the rake task: `bundle exec rake redmineflux_devops:send_review_digests`.
2. Wait for the task to complete.
3. Check `priya.s`'s email inbox.

**Expected Result:**
- `priya.s` receives exactly one digest email with subject: "You have 2 pending code reviews."
- The email body lists both PRs: PR `#50` and PR `#52`, with links and ages.
- No separate individual emails are sent (only the digest).
- If `priya.s` has zero pending reviews, no email is sent (no empty digest emails).
