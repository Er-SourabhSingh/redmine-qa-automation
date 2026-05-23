# Test Cases — CI/CD & Build Management — Redmineflux DevOps

| Field | Value |
|-------|-------|
| **Plugin** | redmineflux_devops |
| **Module** | CI/CD & Build Management |
| **TC Range** | TC-RDV-091 to TC-RDV-150 |
| **Total TCs** | 60 |
| **Requirement Coverage** | CICD-001, CICD-002, CICD-003, CICD-004, CICD-005, CICD-006, CICD-007, CICD-008, CICD-009, CICD-010 |

---

### TC-RDV-091 — Build status badge displays blue spinner when build is running

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build Status on Issues (rfd-010) |
| **Requirement Ref** | CICD-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project "phoenix-platform" is connected to a GitHub repository
- Issue #201 is linked to branch `feature/201-user-auth`
- User is logged in as Developer (has `view_devops` permission)
- A GitHub Actions workflow has been triggered for branch `feature/201-user-auth`

**Test Data:**
- Issue ID: #201
- Branch: `feature/201-user-auth`
- Build number: #512
- Webhook payload: `{"status": "in_progress", "run_id": "512", "branch": "feature/201-user-auth"}`

**Steps:**
1. Navigate to Project "phoenix-platform" → issue #201.
2. Scroll to the "DevOps" panel at the bottom of the issue detail page.
3. Observe the build status badge at the top of the DevOps panel.
4. While build #512 is still running, send a `workflow_run` webhook event with status `in_progress` to `POST /devops/webhook/github/phoenix-platform`.
5. Refresh the issue page (or wait for the badge to update via the 30-second JavaScript poll).
6. Observe the badge color and icon.

**Expected Result:**
- The build badge displays a blue animated spinner icon.
- The badge label reads "Build #512 running" (or equivalent running state text).
- The badge links to the GitHub Actions run URL for build #512.
- No error messages are shown in the DevOps panel.

---

### TC-RDV-092 — Build status badge displays green check when build passes

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build Status on Issues (rfd-010) |
| **Requirement Ref** | CICD-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project "phoenix-platform" is connected to GitHub
- Issue #202 is linked to branch `feature/202-payment-gateway`
- Build #513 for this branch previously had status "running"

**Test Data:**
- Issue ID: #202
- Branch: `feature/202-payment-gateway`
- Build number: #513
- Webhook payload: `{"status": "success", "run_id": "513", "branch": "feature/202-payment-gateway", "duration_seconds": 187}`

**Steps:**
1. Navigate to Project "phoenix-platform" → issue #202.
2. Confirm the DevOps panel shows build #513 in running (blue) state.
3. Send a `workflow_run` webhook event with status `success` and duration 187 seconds to `POST /devops/webhook/github/phoenix-platform`.
4. Wait up to 30 seconds for JavaScript polling to refresh the badge, or manually refresh the page.
5. Observe the build badge.

**Expected Result:**
- The badge updates to a green check icon.
- The badge label reads "Build #513 passed (3m 7s)" or equivalent.
- Build duration (187 seconds) is displayed alongside the badge.
- The badge remains a clickable link to the build URL.

---

### TC-RDV-093 — Build status badge displays red X when build fails

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build Status on Issues (rfd-010) |
| **Requirement Ref** | CICD-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project "phoenix-platform" is connected to GitHub
- Issue #203 is linked to branch `feature/203-search-api`
- Build #514 has just completed with a failure

**Test Data:**
- Issue ID: #203
- Branch: `feature/203-search-api`
- Build number: #514
- Webhook payload: `{"status": "failure", "run_id": "514", "branch": "feature/203-search-api", "duration_seconds": 93}`

**Steps:**
1. Send a `workflow_run` webhook event with status `failure` to `POST /devops/webhook/github/phoenix-platform` for build #514 on branch `feature/203-search-api`.
2. Navigate to Project "phoenix-platform" → issue #203.
3. Observe the build status badge in the DevOps panel.

**Expected Result:**
- The badge shows a red X icon.
- The badge label reads "Build #514 failed (1m 33s)" or equivalent.
- The badge is a clickable link to the failed build.
- No other issue data is altered.

---

### TC-RDV-094 — Build status badge displays gray when no builds exist for the issue branch

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build Status on Issues (rfd-010) |
| **Requirement Ref** | CICD-001 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- Project "phoenix-platform" exists with a connected GitHub repository
- Issue #205 has been created but no branch named `feature/205-*` has ever had a build

**Test Data:**
- Issue ID: #205
- No builds exist in `redmineflux_devops_builds` for issue_id = 205

**Steps:**
1. Navigate to Project "phoenix-platform" → issue #205.
2. Scroll to the DevOps panel.
3. Observe the build status badge.

**Expected Result:**
- The badge is gray (not blue, green, or red).
- The badge label reads "No builds" or equivalent neutral text.
- The badge is not a broken link; it either shows no link or a link to the project Builds page.
- No error is thrown; the DevOps panel renders without a 500 error.

---

### TC-RDV-095 — Build status badge updates via webhook without page reload (real-time)

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build Status on Issues (rfd-010) |
| **Requirement Ref** | CICD-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Issue #206 is open in a browser tab showing the DevOps panel
- Build #515 is currently in `running` state (blue badge visible)
- The page's JavaScript 30-second polling interval is active

**Test Data:**
- Issue ID: #206
- Build: #515
- Transition: running → success

**Steps:**
1. Keep the browser on issue #206's page without refreshing.
2. Trigger a `workflow_run` webhook event with status `success` for build #515 on branch `feature/206-notifications`.
3. Wait up to 35 seconds (one polling cycle).
4. Observe the badge without manually refreshing the page.

**Expected Result:**
- The badge transitions from blue (running) to green (passed) within one polling cycle (30 seconds maximum).
- No full page reload occurs; only the badge DOM element is updated.
- The update is driven by the webhook event being received by Redmine, not by the CI tool being polled directly.

---

### TC-RDV-096 — Non-member cannot view build status badge on issue

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build Status on Issues (rfd-010) |
| **Requirement Ref** | CICD-001 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- Project "phoenix-platform" is a private project
- User "external_user@example.com" is NOT a member of "phoenix-platform"
- Issue #201 has existing build data

**Test Data:**
- User role: Non-member (not in project)
- Project visibility: Private

**Steps:**
1. Log in as external_user@example.com.
2. Attempt to navigate directly to `/projects/phoenix-platform/issues/201`.
3. Observe the response.

**Expected Result:**
- The application returns HTTP 403 Forbidden or redirects to the login/access-denied page.
- No DevOps panel or build badge is displayed.
- No build data is exposed to the non-member user.

---

### TC-RDV-097 — Build history timeline loads with all columns for a project

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build History Timeline (rfd-011) |
| **Requirement Ref** | CICD-002 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project "phoenix-platform" has at least 10 builds recorded across multiple branches
- User is logged in as DevOps Engineer with `view_devops` permission

**Test Data:**
- Project: phoenix-platform
- Builds available: #500–#514 across branches `main`, `feature/201-user-auth`, `feature/202-payment-gateway`

**Steps:**
1. Navigate to Project "phoenix-platform" → "DevOps" tab → "Builds" sub-tab.
2. Observe the builds timeline table.

**Expected Result:**
- The Builds tab loads with HTTP 200 and no JavaScript errors.
- Each row shows: build number, branch, trigger type (push/PR/manual/schedule), status icon (green/red/blue/gray), duration, and timestamp.
- Builds are displayed in reverse chronological order (most recent first).
- At least the 10 most recent builds are visible.

---

### TC-RDV-098 — Build history filter by branch returns correct subset

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build History Timeline (rfd-011) |
| **Requirement Ref** | CICD-002 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project "phoenix-platform" has builds on branches `main`, `feature/201-user-auth`, and `feature/202-payment-gateway`
- User is logged in as Developer

**Test Data:**
- Filter: branch = `main`
- Builds on `main`: #500, #505, #510 (3 builds)
- Builds on `feature/201-user-auth`: #501, #503, #507 (3 builds)

**Steps:**
1. Navigate to Project "phoenix-platform" → DevOps → Builds.
2. Locate the branch filter dropdown.
3. Select `main` from the branch filter.
4. Submit or observe the filtered results.

**Expected Result:**
- Only builds for branch `main` are listed (builds #500, #505, #510).
- Builds for `feature/201-user-auth` and `feature/202-payment-gateway` are NOT shown.
- The filter selection persists visually in the dropdown.
- A "Clear filters" or reset option is available.

---

### TC-RDV-099 — Build history filter by status shows only failed builds

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build History Timeline (rfd-011) |
| **Requirement Ref** | CICD-002 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project "phoenix-platform" has a mix of passed and failed builds
- Failed builds: #501, #503, #506
- Passed builds: #502, #504, #505

**Test Data:**
- Filter: status = `failed`

**Steps:**
1. Navigate to Project "phoenix-platform" → DevOps → Builds.
2. Open the status filter and select "Failed."
3. Observe the displayed build list.

**Expected Result:**
- Only failed builds (#501, #503, #506) are displayed.
- Passed builds (#502, #504, #505) are not shown.
- Each row clearly shows a red failure icon.
- Result count matches the number of known failed builds.

---

### TC-RDV-100 — Build history filter by date range returns correct results

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build History Timeline (rfd-011) |
| **Requirement Ref** | CICD-002 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Builds exist across a date range from 2026-05-01 to 2026-05-20
- Builds on 2026-05-10: #508, #509
- Builds before 2026-05-10 and after 2026-05-15 exist

**Test Data:**
- Date range from: 2026-05-10
- Date range to: 2026-05-15

**Steps:**
1. Navigate to Project "phoenix-platform" → DevOps → Builds.
2. Set the "From" date filter to 2026-05-10.
3. Set the "To" date filter to 2026-05-15.
4. Apply the filter.
5. Review the results.

**Expected Result:**
- Only builds with `started_at` between 2026-05-10 00:00:00 and 2026-05-15 23:59:59 are displayed.
- Builds outside this date range are excluded.
- The selected date range is displayed in the filter fields.

---

### TC-RDV-101 — Consecutive failures are highlighted distinctly in build history

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build History Timeline (rfd-011) |
| **Requirement Ref** | CICD-002 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Project "phoenix-platform" has builds #507, #508, #509, #510 all failed consecutively on branch `main`
- Build #511 is the first success after the streak

**Test Data:**
- Consecutive failures: #507 (failed), #508 (failed), #509 (failed), #510 (failed)
- Next build: #511 (passed)
- Branch: `main`

**Steps:**
1. Navigate to Project "phoenix-platform" → DevOps → Builds.
2. Filter by branch `main`.
3. Observe builds #507–#510 and #511.

**Expected Result:**
- Builds #507, #508, #509, and #510 are visually distinguished from non-consecutive failures (e.g., highlighted row background, orange/red streak indicator, or a "4 consecutive failures" label).
- Build #511 (passed) does not carry the streak highlight.
- The consecutive failure indicator makes the streak immediately visible without counting rows manually.

---

### TC-RDV-102 — Build history paginates at 50 records per page

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build History Timeline (rfd-011) |
| **Requirement Ref** | CICD-002 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- Project "phoenix-platform" has exactly 75 builds recorded
- User is logged in as DevOps Engineer

**Test Data:**
- Total builds: 75
- Expected pages: 2 (50 on page 1, 25 on page 2)

**Steps:**
1. Navigate to Project "phoenix-platform" → DevOps → Builds (no filters active).
2. Count the number of build rows displayed on page 1.
3. Click the "Next page" or page 2 pagination link.
4. Count the number of build rows on page 2.

**Expected Result:**
- Page 1 displays exactly 50 builds.
- Page 2 displays the remaining 25 builds.
- Pagination controls show at least "Page 1 of 2" or equivalent.
- The total count "75 builds" is displayed somewhere on the page.

---

### TC-RDV-103 — Build log viewer displays last 200 lines by default

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build Log Viewer (rfd-012) |
| **Requirement Ref** | CICD-003 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project "phoenix-platform" has a failed build #514 on branch `feature/203-search-api` with a log containing 850 lines
- User is logged in as Developer with `view_devops` permission
- The connected CI provider is GitHub Actions

**Test Data:**
- Build ID: #514
- Total log lines: 850
- Default display: last 200 lines only

**Steps:**
1. Navigate to Project "phoenix-platform" → DevOps → Builds.
2. Click on build #514 to open the build detail page.
3. Click "View Log" or expand the log viewer section.
4. Count the number of lines displayed in the initial load.

**Expected Result:**
- The log viewer displays exactly 200 lines (lines 651–850 of the full log).
- A "Load More" or "Show Full Log" button is visible below the log output.
- The log is rendered in monospace font with proper line breaks preserved.
- No error messages are shown (the log fetches successfully from GitHub Actions on demand).

---

### TC-RDV-104 — Build log enforces 10 MB cap and truncates oversized logs

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build Log Viewer (rfd-012) |
| **Requirement Ref** | CICD-003 |
| **Priority** | High |
| **Scenario Type** | Edge |

**Preconditions:**
- Build #516 on branch `feature/204-data-export` has a log of 12 MB on Jenkins
- The `BuildLogFetcher` service is configured with a 10 MB cap

**Test Data:**
- Build ID: #516
- Full log size: 12 MB
- Cap: 10 MB

**Steps:**
1. Navigate to Project "phoenix-platform" → DevOps → Builds → Build #516.
2. Click "View Log" to open the log viewer.
3. Observe what is displayed and look for any truncation notice.

**Expected Result:**
- The log viewer displays only up to 10 MB of log content.
- A visible notice appears stating the log was truncated (e.g., "Log truncated: showing first 10 MB of 12 MB").
- No server error (500) occurs from attempting to load the oversized log.
- The "Show Full Log" button, if present, should link to the full log on Jenkins directly rather than proxying the oversized content through Redmine.

---

### TC-RDV-105 — Error lines are highlighted in red in the build log viewer

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build Log Viewer (rfd-012) |
| **Requirement Ref** | CICD-003 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Build #514 (failed) has a log that includes lines starting with "ERROR:", "error:", or "[error]"
- The log contains 5 distinct error lines among 200 lines of output

**Test Data:**
- Build ID: #514
- Error lines: lines 102, 150, 151, 152, 199 contain "ERROR: compilation failed", "[error] Missing dependency: libssl", etc.

**Steps:**
1. Navigate to build #514's detail page.
2. Open the log viewer.
3. Scan the log output for lines 102, 150–152, and 199.
4. Observe the visual styling of those lines vs. non-error lines.

**Expected Result:**
- Lines containing error patterns ("ERROR:", "[error]", "FATAL:", etc.) are rendered with red text or a red background highlight.
- Non-error lines are rendered in the default monospace color (white-on-dark or black-on-light).
- The visual distinction is clear enough to locate errors without reading every line.

---

### TC-RDV-106 — Build log viewer works for GitLab CI builds

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build Log Viewer (rfd-012) |
| **Requirement Ref** | CICD-003 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project "atlas-backend" is connected to a GitLab repository using GitLab CI
- Build #60 (provider: gitlab_ci) has failed with a log available via GitLab API
- User is logged in as Developer

**Test Data:**
- Project: atlas-backend
- Build #60, provider: gitlab_ci
- GitLab API token is configured and valid

**Steps:**
1. Navigate to Project "atlas-backend" → DevOps → Builds → Build #60.
2. Click "View Log."
3. Observe that the log content loads successfully.

**Expected Result:**
- The log viewer fetches and displays the build log from GitLab CI.
- The same 200-line default, monospace formatting, and error-line highlighting apply regardless of provider.
- No error indicating "provider not supported" is shown.

---

### TC-RDV-107 — Build log viewer works for Jenkins builds

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build Log Viewer (rfd-012) |
| **Requirement Ref** | CICD-003 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Project "legacy-service" is connected to a Jenkins instance
- Jenkins build #77 (provider: jenkins) has a log available via Jenkins REST API
- Jenkins API token and URL are configured in the project connections

**Test Data:**
- Project: legacy-service
- Build #77, provider: jenkins
- Jenkins URL: https://jenkins.example.com/job/legacy-service/77/

**Steps:**
1. Navigate to Project "legacy-service" → DevOps → Builds → Build #77.
2. Click "View Log."
3. Observe the log viewer output.

**Expected Result:**
- The log viewer fetches and displays build output from the Jenkins Console Output API.
- Log lines are displayed in monospace font.
- Error lines are highlighted in red where applicable.
- No provider-specific error message is displayed; the experience is identical to GitHub Actions and GitLab CI.

---

### TC-RDV-108 — Rebuild button is visible only to users with trigger_builds permission

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Trigger Build (rfd-013) |
| **Requirement Ref** | CICD-004 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- Build #514 exists for project "phoenix-platform"
- Three users exist with different roles:
  - alice@example.com — Developer (has `trigger_builds` permission)
  - bob@example.com — QA Engineer (does NOT have `trigger_builds` permission)
  - carol@example.com — Admin (has `trigger_builds` permission)

**Test Data:**
- Build: #514
- User roles: Developer (alice), QA (bob), Admin (carol)

**Steps:**
1. Log in as alice@example.com (Developer).
2. Navigate to build #514 detail page.
3. Note whether the "Rebuild" button is visible.
4. Log out; log in as bob@example.com (QA Engineer).
5. Navigate to the same build #514 detail page.
6. Note whether the "Rebuild" button is visible.
7. Log out; log in as carol@example.com (Admin).
8. Navigate to build #514 detail page.
9. Note whether the "Rebuild" button is visible.

**Expected Result:**
- alice (Developer): "Rebuild" button IS visible.
- bob (QA): "Rebuild" button is NOT visible; no disabled/greyed-out button — the element should be completely absent.
- carol (Admin): "Rebuild" button IS visible.

---

### TC-RDV-109 — Rebuild succeeds and shows confirmation with link to new build

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Trigger Build (rfd-013) |
| **Requirement Ref** | CICD-004 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Build #514 exists for branch `feature/203-search-api` on project "phoenix-platform"
- User is logged in as Developer (alice@example.com) with `trigger_builds` permission
- The user has triggered 0 builds in the current hour (under the 5/hr rate limit)
- GitHub Actions workflow_dispatch API is responsive

**Test Data:**
- Build to rebuild: #514
- Branch: `feature/203-search-api`
- Expected new build: #517

**Steps:**
1. Navigate to build #514 detail page as alice@example.com.
2. Click the "Rebuild" button.
3. If a confirmation dialog appears, confirm the action.
4. Observe the page response.

**Expected Result:**
- A success flash message appears: "Build triggered successfully" or equivalent.
- A link to the newly created build #517 (or its Redmine record) is shown in the message.
- The new build #517 appears in the Builds list with status "running" (blue badge).
- The original build #514 record is unchanged.

---

### TC-RDV-110 — Sixth rebuild attempt within one hour is rejected with rate limit error

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Trigger Build (rfd-013) |
| **Requirement Ref** | CICD-004 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- User alice@example.com (Developer) has already triggered 5 builds within the current hour window
- Build #514 is available for rebuild

**Test Data:**
- Rate limit: 5 per hour per user
- Attempts already made this hour: 5
- Attempt being tested: the 6th attempt

**Steps:**
1. Log in as alice@example.com.
2. Navigate to any build detail page (e.g., build #514).
3. Click "Rebuild" for the 6th time within the same 1-hour window.
4. Observe the response.

**Expected Result:**
- The rebuild is rejected; no new build is triggered in the CI provider.
- An error flash message is displayed: "Rate limit exceeded: you can trigger at most 5 builds per hour. Please try again after [time]." or equivalent.
- HTTP 429 (Too Many Requests) is returned if attempted via the REST API.
- The Rebuild button may be disabled or the error message is shown inline.

---

### TC-RDV-111 — Rate limit applies per project (20 per hour) and blocks the 21st project-level trigger

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Trigger Build (rfd-013) |
| **Requirement Ref** | CICD-004 |
| **Priority** | Medium |
| **Scenario Type** | Negative |

**Preconditions:**
- Project "phoenix-platform" has accumulated 20 build triggers from various users in the current hour
- A new user david@example.com (Developer) attempts the 21st project-level trigger

**Test Data:**
- Project-level rate limit: 20 triggers per hour
- Triggers already used by the project this hour: 20
- Triggering user: david@example.com (0 personal triggers this hour)

**Steps:**
1. Log in as david@example.com.
2. Navigate to any build in project "phoenix-platform" and click "Rebuild."
3. Observe the response.

**Expected Result:**
- The rebuild is rejected even though david has not personally exceeded the 5/hr user limit.
- An error message indicates the project-level rate limit has been reached.
- The build is not triggered in GitHub Actions / GitLab / Jenkins.

---

### TC-RDV-112 — Failed build auto-comment is posted as journal entry on the linked issue

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Failed Build Auto-Comment (rfd-076) |
| **Requirement Ref** | CICD-005 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Issue #203 in project "phoenix-platform" is linked to branch `feature/203-search-api`
- Build #514 is linked to issue #203 and to branch `feature/203-search-api`
- The `FailedBuildCommenter` service is enabled for this project
- The build log has a first error line: "ERROR: Cannot find module './search.service'"

**Test Data:**
- Issue: #203
- Build: #514 (status: failed)
- First error line: "ERROR: Cannot find module './search.service'"
- Build log URL: https://github.com/example/phoenix-platform/actions/runs/514

**Steps:**
1. Trigger a build failed webhook event for build #514 on branch `feature/203-search-api`.
2. Navigate to issue #203 in project "phoenix-platform."
3. Scroll to the Journal/Activity section.
4. Observe whether a new comment has been added automatically.

**Expected Result:**
- A new journal entry (comment) appears on issue #203 authored by the system/bot.
- The comment text includes: "Build #514 failed on branch feature/203-search-api."
- The comment includes the first error line: "ERROR: Cannot find module './search.service'."
- The comment includes a clickable link to the full build log.
- The comment was added automatically without any manual action.

---

### TC-RDV-113 — Failed build auto-comment is NOT posted when build succeeds

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Failed Build Auto-Comment (rfd-076) |
| **Requirement Ref** | CICD-005 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- Issue #202 in project "phoenix-platform" is linked to branch `feature/202-payment-gateway`
- Build #513 for this branch has just succeeded

**Test Data:**
- Issue: #202
- Build: #513 (status: success)

**Steps:**
1. Send a build success webhook event for build #513 on branch `feature/202-payment-gateway`.
2. Navigate to issue #202.
3. Check the Journal/Activity section for any automatically added comments.

**Expected Result:**
- No new journal entry is posted to issue #202 as a result of the successful build.
- The existing journal entries remain unchanged.
- The build badge on the issue updates to green, but no noise comment is added.

---

### TC-RDV-114 — Failed build auto-comment includes first error line from log

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Failed Build Auto-Comment (rfd-076) |
| **Requirement Ref** | CICD-005 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Issue #207 is linked to build #518 which has failed
- The build log contains multiple error lines; the first error line is on log line 45: "FATAL: Test suite failed to run: Jest encountered an unexpected token"

**Test Data:**
- Issue: #207
- Build: #518
- First error line (line 45): "FATAL: Test suite failed to run: Jest encountered an unexpected token"
- Subsequent error lines also exist in the log

**Steps:**
1. Trigger a build failure webhook for build #518 linked to issue #207.
2. Open issue #207 in Redmine.
3. Read the auto-generated journal entry.
4. Confirm which error line is quoted in the comment.

**Expected Result:**
- The auto-comment quotes exactly the first error line from the log: "FATAL: Test suite failed to run: Jest encountered an unexpected token."
- Subsequent error lines are NOT included in the comment body (only the first one).
- The comment still includes the full log link.

---

### TC-RDV-115 — Build queue status widget shows queue depth and wait estimate

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build Queue Status (rfd-077) |
| **Requirement Ref** | CICD-006 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Project "phoenix-platform" is connected to Jenkins
- Jenkins currently has 4 builds queued
- The median wait time based on recent history is approximately 8 minutes
- User is a DevOps Engineer with `view_devops` permission

**Test Data:**
- Queue depth: 4 builds
- Median wait estimate: 8 minutes

**Steps:**
1. Navigate to Project "phoenix-platform" → DevOps dashboard widget area.
2. Locate the "Build Queue" widget.
3. Observe the displayed information.

**Expected Result:**
- The widget shows "Build Queue: 4 waiting, ~8 min estimated" or equivalent text.
- The queue depth (4) and median wait estimate (~8 min) are clearly shown.
- The data is retrieved from the `BuildQueueFetcher` service (not stale).

---

### TC-RDV-116 — Build queue status is served from cache for 60 seconds

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build Queue Status (rfd-077) |
| **Requirement Ref** | CICD-006 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- The build queue was last fetched 40 seconds ago (within the 60-second cache window)
- The Jenkins queue has changed since the last fetch (now 6 builds queued, was 4)

**Test Data:**
- Cache TTL: 60 seconds
- Time since last fetch: 40 seconds
- Actual current queue: 6 builds
- Cached queue value: 4 builds

**Steps:**
1. Navigate to the Build Queue widget.
2. Observe the queue depth shown.
3. Wait until 65 seconds have passed since the last fetch.
4. Reload or re-observe the widget.

**Expected Result:**
- At the 40-second mark: the widget still shows "4 waiting" (the cached value).
- After 65 seconds: the widget refreshes and shows the updated "6 waiting."
- No HTTP call is made to Jenkins during the 60-second cache window (verify via server logs or network monitoring if possible).

---

### TC-RDV-117 — Artifact download links section shows artifacts on build detail page

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Artifact Download Links (rfd-078) |
| **Requirement Ref** | CICD-007 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Build #513 (passed) for project "phoenix-platform" has two artifacts:
  - `app-v2.3.1.apk` (28 MB)
  - `test-report.html` (1.2 MB)
- The CI provider's artifact API returns valid metadata for these files

**Test Data:**
- Build: #513
- Artifact 1: app-v2.3.1.apk, 28 MB
- Artifact 2: test-report.html, 1.2 MB

**Steps:**
1. Navigate to build #513 detail page.
2. Locate the "Artifacts" section.
3. Observe the listed artifacts.

**Expected Result:**
- Both artifacts are listed: app-v2.3.1.apk and test-report.html.
- File sizes are displayed next to each artifact name.
- Download links are visible for both artifacts.
- The "Artifacts" section renders without a 500 error.

---

### TC-RDV-118 — Artifact below 50 MB is proxied through auth-gated download endpoint

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Artifact Download Links (rfd-078) |
| **Requirement Ref** | CICD-007 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Build #513 has artifact `test-report.html` at 1.2 MB (below 50 MB threshold)
- User is logged in as QA Engineer with `view_devops` permission

**Test Data:**
- Artifact: test-report.html, 1.2 MB
- Download threshold: 50 MB

**Steps:**
1. Navigate to build #513 detail page → Artifacts section.
2. Click the download link for `test-report.html`.
3. Observe the URL and HTTP response.

**Expected Result:**
- The download is served through Redmine's auth-gated proxy endpoint (URL is internal to Redmine, e.g., `/projects/phoenix-platform/devops/builds/513/artifacts/test-report.html`).
- The file downloads successfully with the correct content.
- The proxy requires a valid Redmine session or API key; an unauthenticated request is rejected with 401/403.

---

### TC-RDV-119 — Artifact above 50 MB is redirected to direct CI download URL

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Artifact Download Links (rfd-078) |
| **Requirement Ref** | CICD-007 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- Build #513 has artifact `app-v2.3.1.apk` at 28 MB — this test requires an artifact above 50 MB
- Build #520 has artifact `full-db-dump.sql.gz` at 72 MB (above 50 MB threshold)

**Test Data:**
- Artifact: full-db-dump.sql.gz, 72 MB
- Threshold: 50 MB
- Direct CI URL: https://github.com/example/phoenix-platform/releases/download/v2.4.0/full-db-dump.sql.gz

**Steps:**
1. Navigate to build #520 detail page → Artifacts section.
2. Click the download link for `full-db-dump.sql.gz`.
3. Observe the HTTP response and URL behavior.

**Expected Result:**
- The browser is redirected (HTTP 302) to the direct artifact URL on the CI provider (GitHub/GitLab/Jenkins).
- The file is NOT proxied through Redmine's server (to avoid memory/bandwidth issues).
- The redirect happens immediately; no large file content passes through Redmine's application server.

---

### TC-RDV-120 — Flaky test detection flags tests with flip-flop score between 0.05 and 0.95

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Flaky Test Detection (rfd-079) |
| **Requirement Ref** | CICD-008 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Project "phoenix-platform" has test results from at least 50 recent builds ingested
- Test "UserAuthServiceSpec#login_with_valid_credentials" has failed in 15 out of the last 50 runs (flip-flop score = 0.30, within 0.05–0.95 range)
- Test "PaymentGatewaySpec#charge_card" has always passed (score = 0.00, outside range)
- Test "SearchApiSpec#returns_results" has always failed (score = 1.00, outside range, that is a consistent failure not flaky)

**Test Data:**
- Flaky candidate: UserAuthServiceSpec#login_with_valid_credentials, score = 0.30
- Stable passing test: PaymentGatewaySpec#charge_card, score = 0.00
- Consistently failing: SearchApiSpec#returns_results, score = 1.00

**Steps:**
1. Navigate to Project "phoenix-platform" → DevOps → (Flaky Tests section or dedicated tab).
2. Observe the list of detected flaky tests.

**Expected Result:**
- "UserAuthServiceSpec#login_with_valid_credentials" is listed as flaky with a flip-flop score of 0.30.
- "PaymentGatewaySpec#charge_card" is NOT listed (score 0.00 is below 0.05 threshold).
- "SearchApiSpec#returns_results" is NOT listed as flaky (score 1.00 is above 0.95 threshold — it is a consistent failure, not a flaky one).
- The flaky score (0.30) is displayed for the detected test.

---

### TC-RDV-121 — Flaky test detection requires minimum 10 runs in last 50 builds

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Flaky Test Detection (rfd-079) |
| **Requirement Ref** | CICD-008 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- Test "NewFeatureSpec#edge_case" has only appeared in 7 out of the last 50 builds (below the 10-run minimum)
- The test alternates pass/fail whenever it runs (high flip-flop behavior)

**Test Data:**
- Test: NewFeatureSpec#edge_case
- Runs in last 50 builds: 7 (below minimum of 10)
- Apparent flip-flop rate: 57% (would score as flaky if eligible)

**Steps:**
1. Navigate to the Flaky Tests page for the project.
2. Search or look for "NewFeatureSpec#edge_case" in the flaky test list.

**Expected Result:**
- "NewFeatureSpec#edge_case" is NOT listed as flaky because it has fewer than 10 runs in the last 50 builds.
- The minimum run threshold (10) prevents false flaky detections for rarely-executed tests.

---

### TC-RDV-122 — JUnit ingestion endpoint accepts valid JUnit XML and creates test results

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | JUnit Ingestion REST Endpoint (rfd-104) |
| **Requirement Ref** | CICD-008 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Build #513 exists for project "phoenix-platform"
- A valid JUnit XML payload is ready for ingestion
- API key for the project's DevOps service account is available

**Test Data:**
- Endpoint: `POST /devops/builds/513/test_results`
- ingestion_key: `sha256("build-513-test-suite-run-001")` = `a3f2...`
- JUnit XML: 3 tests, 1 failed, 2 passed

```xml
<testsuite name="UserAuthTests" tests="3" failures="1">
  <testcase name="login_success" classname="UserAuthSpec" time="0.032"/>
  <testcase name="login_invalid_password" classname="UserAuthSpec" time="0.045">
    <failure message="Expected 401, got 200"/>
  </testcase>
  <testcase name="logout_success" classname="UserAuthSpec" time="0.011"/>
</testsuite>
```

**Steps:**
1. Send a POST request to `/devops/builds/513/test_results` with the JUnit XML payload and ingestion_key header.
2. Include `X-Redmine-API-Key` authentication header.
3. Observe the HTTP response status and body.
4. Navigate to build #513 detail page → Test Results section.

**Expected Result:**
- HTTP 201 Created is returned.
- The response body includes a summary: `{"total": 3, "passed": 2, "failed": 1, "skipped": 0}`.
- On build #513's detail page, the Test Results section shows 3 tests: 2 passed, 1 failed.
- The failed test "login_invalid_password" shows the failure message "Expected 401, got 200."

---

### TC-RDV-123 — JUnit ingestion is idempotent: duplicate submission returns same result, not an error

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | JUnit Ingestion REST Endpoint (rfd-104) |
| **Requirement Ref** | CICD-008 |
| **Priority** | High |
| **Scenario Type** | Edge |

**Preconditions:**
- The JUnit payload from TC-RDV-122 was already ingested with ingestion_key `a3f2...`
- The same payload is submitted again with the same ingestion_key

**Test Data:**
- Same payload and ingestion_key as TC-RDV-122
- ingestion_key SHA256: `a3f2...`

**Steps:**
1. Submit the exact same JUnit XML payload to `POST /devops/builds/513/test_results` a second time, using the same ingestion_key.
2. Observe the HTTP response status and body.
3. Check that the test result count on build #513 has not changed.

**Expected Result:**
- HTTP 200 OK (or 201) is returned on the duplicate submission — NOT 409 Conflict or 500 Error.
- The response body returns the same summary as the first submission: `{"total": 3, "passed": 2, "failed": 1, "skipped": 0}`.
- No duplicate test result records are created; the count on build #513 remains 3 tests.

---

### TC-RDV-124 — JUnit ingestion endpoint is rate-limited to 10 events per 60 seconds per project

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | JUnit Ingestion REST Endpoint (rfd-104) |
| **Requirement Ref** | CICD-008 |
| **Priority** | Medium |
| **Scenario Type** | Negative |

**Preconditions:**
- 10 JUnit ingestion requests have been sent to project "phoenix-platform" within the last 60 seconds
- An 11th request is attempted

**Test Data:**
- Rate limit: 10 events per 60 seconds per project
- Requests already made: 10

**Steps:**
1. Send 10 JUnit ingestion requests to project "phoenix-platform" within a 60-second window using valid but different ingestion_keys.
2. Immediately send an 11th request.
3. Observe the HTTP response for the 11th request.

**Expected Result:**
- The 11th request receives HTTP 429 Too Many Requests.
- The response body includes a message such as "Rate limit exceeded: maximum 10 JUnit ingestion events per 60 seconds per project."
- A `Retry-After` header is included indicating when the rate limit resets.

---

### TC-RDV-125 — Pipeline stage breakdown shows Build, Test, Deploy stages on build detail page

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Pipeline Stage Breakdown (rfd-108) |
| **Requirement Ref** | CICD-009 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Build #521 for project "phoenix-platform" (GitHub Actions) has 3 stages:
  - Build: success, 45 seconds
  - Test: failed, 120 seconds
  - Deploy: skipped
- Webhook events for all three stages have been received

**Test Data:**
- Build: #521
- Stage 1: Build, status=success, duration=45s
- Stage 2: Test, status=failed, duration=120s
- Stage 3: Deploy, status=skipped

**Steps:**
1. Navigate to build #521 detail page.
2. Locate the "Pipeline Stages" or "Stages" section.
3. Observe the visual timeline of stages.

**Expected Result:**
- Three stages are displayed in order: Build → Test → Deploy.
- Build stage shows a green check with "45s."
- Test stage shows a red X with "120s."
- Deploy stage shows a gray "Skipped" indicator.
- The stages are laid out as a linear timeline (left-to-right or top-to-bottom sequential flow).

---

### TC-RDV-126 — Pipeline stage breakdown is idempotent on duplicate stage webhook events

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Pipeline Stage Breakdown (rfd-108) |
| **Requirement Ref** | CICD-009 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- Build #521 already has stage data ingested (Test stage: failed, 120s)
- A duplicate webhook for the Test stage of build #521 arrives with identical data

**Test Data:**
- Build: #521
- Duplicate stage event: stage=Test, build_id=521, status=failed

**Steps:**
1. Send a duplicate stage webhook event for build #521's Test stage.
2. Navigate to build #521 detail page.
3. Count the number of Test stage entries displayed.

**Expected Result:**
- Only one Test stage entry is shown (no duplicate row).
- The `BuildStageIngestor` service performs an idempotent upsert on `(build_id, name)`.
- No 500 error or database unique constraint violation is raised.

---

### TC-RDV-127 — Build notification is sent via email on build failure

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build Notifications (rfd-109) |
| **Requirement Ref** | CICD-010 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Project "phoenix-platform" has build notifications configured: email ON, Slack ON, Teams ON
- Developer alice@example.com has the project role and has subscribed to build failure notifications
- Build #514 transitions from running to failed

**Test Data:**
- Build: #514 (failure)
- Notification recipients: alice@example.com
- Outcome type: "failed" (first failure)

**Steps:**
1. Trigger a build failure webhook for build #514 on branch `feature/203-search-api`.
2. Wait for the `BuildNotifier` service to process the event.
3. Check alice@example.com's inbox for a build failure notification.

**Expected Result:**
- alice@example.com receives an email notification with subject containing "Build #514 failed" or equivalent.
- The email includes the build number, branch name, and a link to the build detail page.
- The email is sent within a reasonable time (under 5 minutes of the webhook receipt).

---

### TC-RDV-128 — Build notification is sent via Slack on build failure

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build Notifications (rfd-109) |
| **Requirement Ref** | CICD-010 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Project "phoenix-platform" has Slack notification configured via `RedminefluxSlack.speak`
- Slack webhook URL is configured in the project's DevOps notification settings
- Build #514 fails

**Test Data:**
- Build: #514 (failure)
- Slack channel: #devops-builds
- BuildNotifier outcome: "failed"

**Steps:**
1. Trigger a build failure webhook for build #514.
2. Wait for the `BuildNotifier` service to dispatch the Slack message.
3. Check the #devops-builds Slack channel.

**Expected Result:**
- A Slack message appears in #devops-builds indicating "Build #514 failed on phoenix-platform / feature/203-search-api."
- The message includes a link to the build detail page in Redmine.
- The message is dispatched by the `RedminefluxSlack.speak` method.

---

### TC-RDV-129 — Build recovery notification is sent when build passes after a failure

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build Notifications (rfd-109) |
| **Requirement Ref** | CICD-010 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Build #514 failed and triggered a failure notification (TC-RDV-127)
- Build #517 (the rebuild of the same branch) succeeds

**Test Data:**
- Build #517 (success, same branch as #514)
- BuildNotifier outcome: "recovered" (previous build on same branch was a failure)

**Steps:**
1. Trigger a build success webhook for build #517 on branch `feature/203-search-api`.
2. Check alice@example.com's inbox and the configured Slack channel.

**Expected Result:**
- A "build recovered" notification is sent.
- The email subject reads "Build recovered: phoenix-platform / feature/203-search-api" or equivalent.
- The Slack message indicates the branch has recovered from failure.
- The notification clearly distinguishes "recovery" from a plain "success" notification.

---

### TC-RDV-130 — Build notifications are deduplicated within a 1-hour window

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build Notifications (rfd-109) |
| **Requirement Ref** | CICD-010 |
| **Priority** | High |
| **Scenario Type** | Edge |

**Preconditions:**
- Build #514 failed 30 minutes ago and a failure notification was sent
- Build #518 also fails on the same branch `feature/203-search-api` within the same hour

**Test Data:**
- First failure: Build #514, notification sent at T+0
- Second failure: Build #518, attempted notification at T+30 minutes
- Deduplication window: 1 hour

**Steps:**
1. Confirm that a failure notification was sent for build #514 (T+0).
2. Trigger another build failure for build #518 on the same branch 30 minutes later (T+30).
3. Check whether a second notification is sent to alice@example.com or Slack.

**Expected Result:**
- No duplicate notification is sent for build #518 within the 1-hour deduplication window.
- The one-hour deduplication cache prevents the second notification.
- After the 1-hour window expires, the next failure on the same branch WOULD send a new notification.

---

### TC-RDV-131 — Build notifications are sent via Microsoft Teams on build failure

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build Notifications (rfd-109) |
| **Requirement Ref** | CICD-010 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Project "phoenix-platform" has a Microsoft Teams webhook configured via `RedminefluxTeams::TeamsMessage`
- Teams webhook URL is valid and the channel is accessible
- Build #519 fails

**Test Data:**
- Build: #519 (failure)
- Teams channel: DevOps Alerts (configured webhook URL)

**Steps:**
1. Trigger a build failure webhook for build #519 on branch `feature/205-batch-processor`.
2. Check the configured Microsoft Teams channel.

**Expected Result:**
- A Teams notification card appears in the configured channel.
- The card includes build number (#519), project (phoenix-platform), branch, and failure status.
- The card includes a link to the build detail page in Redmine.
- The notification is dispatched via `RedminefluxTeams::TeamsMessage`.

---

### TC-RDV-132 — QA Engineer can view build list but cannot click Rebuild

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Trigger Build (rfd-013) |
| **Requirement Ref** | CICD-004 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User bob@example.com has the QA Engineer role in project "phoenix-platform"
- QA Engineer role does NOT have `trigger_builds` permission
- QA Engineer role DOES have `view_devops` permission
- Build #514 exists for the project

**Test Data:**
- User: bob@example.com (QA role)
- Target: build #514

**Steps:**
1. Log in as bob@example.com.
2. Navigate to Project "phoenix-platform" → DevOps → Builds.
3. Verify the build list loads.
4. Click on build #514 to open the detail page.
5. Look for the "Rebuild" button.

**Expected Result:**
- The Builds list loads successfully (HTTP 200); bob can view all build records.
- The build #514 detail page loads with full information.
- The "Rebuild" button is completely absent from the page (not just disabled).
- No 403 error is raised from viewing builds (only triggering is restricted).

---

### TC-RDV-133 — Build history summary statistics bar is visible above the build list

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build History Timeline (rfd-011) |
| **Requirement Ref** | CICD-002 |
| **Priority** | Low |
| **Scenario Type** | Positive |

**Preconditions:**
- Project "phoenix-platform" has builds from the last 30 days
- Last 30 days: 42 total builds — 35 passed, 7 failed

**Test Data:**
- Total builds (last 30 days): 42
- Passed: 35 (83%)
- Failed: 7 (17%)

**Steps:**
1. Navigate to Project "phoenix-platform" → DevOps → Builds (no filters).
2. Observe the area above or near the build list for a summary/statistics bar.

**Expected Result:**
- A summary bar is visible showing: total builds, pass count (or pass rate), fail count (or fail rate).
- The data reflects the last 30 days of build activity (or all-time if no date range is set).
- Duration trend information (e.g., average build time) is optionally shown.

---

### TC-RDV-134 — Build duration bars are displayed relative to each other in the build list

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build History Timeline (rfd-011) |
| **Requirement Ref** | CICD-002 |
| **Priority** | Low |
| **Scenario Type** | Positive |

**Preconditions:**
- Five recent builds with varying durations:
  - #510: 90 seconds (shortest)
  - #511: 180 seconds
  - #512: 270 seconds
  - #513: 360 seconds
  - #514: 450 seconds (longest)

**Test Data:**
- Builds: #510–#514 with durations 90s, 180s, 270s, 360s, 450s

**Steps:**
1. Navigate to Project "phoenix-platform" → DevOps → Builds.
2. Observe the duration column or inline duration bar visualization.

**Expected Result:**
- Build #514 (450s) has the longest bar, spanning the full width of the duration column.
- Build #510 (90s) has the shortest bar (approximately 1/5 the width of #514).
- The bars provide a quick visual comparison of relative build durations.
- Exact durations are also shown as text (e.g., "7m 30s").

---

### TC-RDV-135 — Unauthenticated rebuild request via REST API returns HTTP 401

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Trigger Build (rfd-013) |
| **Requirement Ref** | CICD-004 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- Build #514 exists for project "phoenix-platform"
- No authentication header or API key is provided

**Test Data:**
- Endpoint: `POST /devops/builds/514/trigger.json`
- Authorization: none

**Steps:**
1. Send a POST request to `/devops/builds/514/trigger.json` without any `X-Redmine-API-Key` header.
2. Observe the HTTP response code and body.

**Expected Result:**
- HTTP 401 Unauthorized is returned.
- The response body contains an error message such as "Authentication required."
- No build is triggered in the CI provider.
- The request is logged in the webhook event log with status "unauthorized."

---

### TC-RDV-136 — Build status badge shows correct latest build for multi-branch issue

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build Status on Issues (rfd-010) |
| **Requirement Ref** | CICD-001 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- Issue #210 has two branches linked: `feature/210-v1` and `feature/210-v2`
- `feature/210-v1` has build #495 (failed, older)
- `feature/210-v2` has build #516 (passed, most recent)

**Test Data:**
- Issue: #210
- Branch feature/210-v1: last build #495, status=failed
- Branch feature/210-v2: last build #516, status=success

**Steps:**
1. Navigate to issue #210.
2. Observe the build status badge in the DevOps panel.

**Expected Result:**
- The badge shows the status of the most recent build across all linked branches (#516, passed = green).
- The badge label identifies which branch it represents (feature/210-v2).
- The older failed build (#495) is not shown as the primary badge.

---

### TC-RDV-137 — Build log viewer full log button loads all lines beyond the default 200

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build Log Viewer (rfd-012) |
| **Requirement Ref** | CICD-003 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Build #514 has a log of 850 lines
- The viewer initially shows the last 200 lines (651–850)

**Test Data:**
- Build: #514
- Total log lines: 850
- Default display: last 200 lines

**Steps:**
1. Navigate to build #514 → View Log (200 lines visible).
2. Click the "Show Full Log" button.
3. Observe the log content.

**Expected Result:**
- The log viewer expands to show all 850 lines.
- Lines 1–650 (previously hidden) are now visible above the original 200 lines.
- A "Collapse" or "Show Last 200 Lines" option appears to allow collapsing back to the default view.
- The full log is subject to the 10 MB cap (does not apply here as the log is within limits).

---

### TC-RDV-138 — Admin can view build log even without explicit trigger_builds permission

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build Log Viewer (rfd-012) |
| **Requirement Ref** | CICD-003 |
| **Priority** | Medium |
| **Scenario Type** | Permission |

**Preconditions:**
- User carol@example.com is a Redmine Administrator
- Build #514 detail page includes the log viewer

**Test Data:**
- User: carol@example.com (Admin role)
- Viewing: build #514 log

**Steps:**
1. Log in as carol@example.com (Admin).
2. Navigate to build #514 detail page.
3. Click "View Log."

**Expected Result:**
- The log viewer opens and displays the last 200 lines of the build log.
- No permission error is shown; Admin can always view build logs.
- The "Rebuild" button is also visible for Admin per the permissions matrix.

---

### TC-RDV-139 — Webhook with invalid HMAC signature is rejected with HTTP 401

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build Status on Issues / Webhook (rfd-010, rfd-001) |
| **Requirement Ref** | CICD-001 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- Project "phoenix-platform" has a GitHub webhook configured with a secret token
- A webhook payload is sent with an incorrect HMAC-SHA256 signature in the `X-Hub-Signature-256` header

**Test Data:**
- Webhook endpoint: `POST /devops/webhook/github/phoenix-platform`
- Correct secret: `correct_secret_token_xyz`
- Payload signed with: `wrong_secret_token_abc`

**Steps:**
1. Construct a valid GitHub build webhook payload.
2. Sign it using `wrong_secret_token_abc` instead of the configured secret.
3. Send the POST request to `/devops/webhook/github/phoenix-platform`.
4. Observe the HTTP response.

**Expected Result:**
- HTTP 401 Unauthorized (or 403 Forbidden) is returned.
- The payload is NOT processed; no build record is created or updated.
- The webhook event is logged in the webhook event log with status "signature_invalid."
- The build status badge on any linked issue does NOT change.

---

### TC-RDV-140 — Build history all-filter cleared shows all builds again

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build History Timeline (rfd-011) |
| **Requirement Ref** | CICD-002 |
| **Priority** | Low |
| **Scenario Type** | Positive |

**Preconditions:**
- User has applied a branch filter ("main") that shows 3 builds
- 15 total builds exist in the project

**Test Data:**
- Total builds: 15
- Filtered result (branch=main): 3 builds

**Steps:**
1. Apply the branch filter "main" on the Builds page (3 results visible).
2. Click "Clear Filters" or reset the branch dropdown to "All branches."
3. Observe the build list.

**Expected Result:**
- All 15 builds are displayed after clearing the filter.
- No filter criteria persist after clearing.
- Pagination adjusts to reflect all 15 builds (no pagination needed if below 50).

---

### TC-RDV-141 — Build status badge on issue links to the external CI build URL

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build Status on Issues (rfd-010) |
| **Requirement Ref** | CICD-001 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Build #513 (passed) for issue #202 has URL: `https://github.com/example/phoenix-platform/actions/runs/513`

**Test Data:**
- Issue: #202
- Build: #513
- Build URL: https://github.com/example/phoenix-platform/actions/runs/513

**Steps:**
1. Navigate to issue #202.
2. Click the green build badge in the DevOps panel.
3. Observe the destination URL.

**Expected Result:**
- The browser navigates to (or opens a new tab for) `https://github.com/example/phoenix-platform/actions/runs/513`.
- The link opens the CI provider's run page, not an internal Redmine page.
- The link opens in a new tab (`target="_blank"`) if configured.

---

### TC-RDV-142 — Failed build auto-comment does not contain HTML injection from error line

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Failed Build Auto-Comment (rfd-076) |
| **Requirement Ref** | CICD-005 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- Build #522 fails and its first error line contains potentially dangerous HTML:
  `ERROR: <script>alert('xss')</script> compilation failed`

**Test Data:**
- Build: #522
- First error line: `ERROR: <script>alert('xss')</script> compilation failed`
- Linked issue: #211

**Steps:**
1. Trigger a build failure webhook for build #522 with the above error message in the payload.
2. Navigate to issue #211.
3. Read the auto-generated journal entry.
4. Inspect the raw HTML of the comment.

**Expected Result:**
- The comment is displayed with the error text safely escaped: `ERROR: &lt;script&gt;alert('xss')&lt;/script&gt; compilation failed`.
- The `<script>` tag does NOT execute in the browser.
- The journal entry content is rendered as plain text, not rendered HTML.

---

### TC-RDV-143 — Build notifications not sent for cancelled build (only failure, recovery, success)

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build Notifications (rfd-109) |
| **Requirement Ref** | CICD-010 |
| **Priority** | Low |
| **Scenario Type** | Edge |

**Preconditions:**
- Build #523 is cancelled mid-run (status transitions to "cancelled")
- alice@example.com is subscribed to build notifications

**Test Data:**
- Build: #523
- Status: cancelled
- BuildNotifier outcome classification: not "failed", "recovered", or "succeeded"

**Steps:**
1. Trigger a build cancelled webhook event for build #523.
2. Check alice@example.com's inbox for any notification.
3. Check the configured Slack channel.

**Expected Result:**
- No notification is sent for the cancelled build (the `BuildNotifier` classifies outcomes as failed/recovered/succeeded; "cancelled" does not trigger a notification).
- alice@example.com does not receive a cancellation email.
- The build badge on the linked issue updates to reflect the cancelled state (gray or strikethrough), but no journal comment is posted.

---

### TC-RDV-144 — Jenkins provider build stage timeline renders correctly

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Pipeline Stage Breakdown (rfd-108) |
| **Requirement Ref** | CICD-009 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Project "legacy-service" is connected to Jenkins
- Build #77 (Jenkins) has 4 pipeline stages:
  - Checkout: success, 8 seconds
  - Build: success, 120 seconds
  - Test: success, 240 seconds
  - Deploy: failed, 30 seconds

**Test Data:**
- Build: #77 (jenkins provider)
- Stages: Checkout (8s, success), Build (120s, success), Test (240s, success), Deploy (30s, failed)

**Steps:**
1. Navigate to Project "legacy-service" → DevOps → Builds → Build #77.
2. Locate the Pipeline Stages section.
3. Verify each stage is shown.

**Expected Result:**
- Four stages are shown in the correct order: Checkout → Build → Test → Deploy.
- Each stage shows its status icon (green/red) and duration.
- The "Deploy" stage shows a red icon with "30s."
- The overall build status is "failed" reflecting the failed Deploy stage.

---

### TC-RDV-145 — Flaky test score of exactly 0.05 is included (boundary inclusive)

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Flaky Test Detection (rfd-079) |
| **Requirement Ref** | CICD-008 |
| **Priority** | Low |
| **Scenario Type** | Edge |

**Preconditions:**
- Test "BoundarySpec#edge_min" has a computed flip-flop score of exactly 0.05
- It has run in exactly 10 of the last 50 builds (meets the minimum requirement)

**Test Data:**
- Test: BoundarySpec#edge_min
- Score: 0.05 (boundary minimum of the flaky range)
- Runs: 10 (boundary minimum)

**Steps:**
1. Navigate to the Flaky Tests page for the project.
2. Look for "BoundarySpec#edge_min" in the flaky tests list.

**Expected Result:**
- "BoundarySpec#edge_min" IS listed as flaky (score 0.05 is inclusive of the lower boundary).
- The score displayed is 0.05.

---

### TC-RDV-146 — Flaky test score of exactly 0.95 is included (boundary inclusive)

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Flaky Test Detection (rfd-079) |
| **Requirement Ref** | CICD-008 |
| **Priority** | Low |
| **Scenario Type** | Edge |

**Preconditions:**
- Test "BoundarySpec#edge_max" has a computed flip-flop score of exactly 0.95
- It has run in 15 of the last 50 builds (above the minimum requirement)

**Test Data:**
- Test: BoundarySpec#edge_max
- Score: 0.95 (boundary maximum of the flaky range)
- Runs: 15

**Steps:**
1. Navigate to the Flaky Tests page.
2. Look for "BoundarySpec#edge_max."

**Expected Result:**
- "BoundarySpec#edge_max" IS listed as flaky (score 0.95 is inclusive of the upper boundary).
- A score above 0.95 (e.g., 0.96) would NOT be flagged as flaky (it's a consistently failing test).

---

### TC-RDV-147 — Build detail page does not expose another project's build data (IDOR check)

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build History Timeline / REST API (rfd-011, rfd-004) |
| **Requirement Ref** | CICD-002 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- Project "phoenix-platform" and Project "atlas-backend" both exist
- User eve@example.com is a member of "phoenix-platform" only
- Build #999 belongs to "atlas-backend"

**Test Data:**
- User: eve@example.com (member of phoenix-platform only)
- Cross-project build: #999 (belongs to atlas-backend)

**Steps:**
1. Log in as eve@example.com.
2. Navigate directly to `/projects/phoenix-platform/devops/builds/999` (build that belongs to atlas-backend).
3. Observe the HTTP response.

**Expected Result:**
- HTTP 404 Not Found is returned (the build does not exist within the scope of "phoenix-platform").
- No data from "atlas-backend" is exposed to eve@example.com.
- The cross-project reference is rejected, demonstrating IDOR protection.

---

### TC-RDV-148 — Pipeline stage breakdown from GitLab CI renders three stages correctly

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Pipeline Stage Breakdown (rfd-108) |
| **Requirement Ref** | CICD-009 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Project "atlas-backend" is connected to GitLab CI
- GitLab CI pipeline #88 has 3 stages: build (success), test (success), deploy (success)

**Test Data:**
- Pipeline: #88 (gitlab_ci provider)
- Stage 1: build, success, 60s
- Stage 2: test, success, 180s
- Stage 3: deploy, success, 45s

**Steps:**
1. Navigate to Project "atlas-backend" → DevOps → Builds → Build #88.
2. Locate the Stages section.
3. Verify all three stages are shown with correct data.

**Expected Result:**
- All three stages (build, test, deploy) are displayed.
- All show green check icons with their respective durations.
- The overall build status is "passed" (green).
- GitLab CI-specific stage data (e.g., job names from GitLab) is rendered correctly.

---

### TC-RDV-149 — JUnit ingestion without authentication returns HTTP 401

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | JUnit Ingestion REST Endpoint (rfd-104) |
| **Requirement Ref** | CICD-008 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- Build #513 exists in project "phoenix-platform"
- A valid JUnit XML payload is prepared
- No API key or authentication is provided

**Test Data:**
- Endpoint: `POST /devops/builds/513/test_results`
- Authentication: none
- JUnit payload: valid XML

**Steps:**
1. Send a POST request to `/devops/builds/513/test_results` with a valid JUnit XML body but NO `X-Redmine-API-Key` header.
2. Observe the HTTP response.

**Expected Result:**
- HTTP 401 Unauthorized is returned.
- No test results are created in the database.
- The endpoint enforces the same authentication requirement as all other REST API endpoints.

---

### TC-RDV-150 — Build badge on issue panel shows build duration alongside status

| Field | Value |
|-------|-------|
| **Module** | CI/CD & Build Management |
| **Feature** | Build Status on Issues (rfd-010) |
| **Requirement Ref** | CICD-001 |
| **Priority** | Low |
| **Scenario Type** | Validation |

**Preconditions:**
- Build #513 for issue #202 succeeded with duration_seconds = 187 (3 minutes 7 seconds)

**Test Data:**
- Issue: #202
- Build: #513
- Duration: 187 seconds = 3m 7s

**Steps:**
1. Navigate to issue #202.
2. Observe the build badge in the DevOps panel.
3. Read the full badge label text.

**Expected Result:**
- The badge label includes the duration: "Build #513 passed (3m 7s)" or equivalent human-readable format.
- Duration is formatted in minutes and seconds (not raw seconds) for readability.
- The badge label does NOT show `duration_seconds: 187` as raw database output.
