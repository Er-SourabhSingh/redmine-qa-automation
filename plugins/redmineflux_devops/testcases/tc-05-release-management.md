# Test Cases — Release Management — Redmineflux DevOps

| Field | Value |
|-------|-------|
| **Plugin** | redmineflux_devops |
| **Module** | Release Management |
| **TC Range** | TC-RDV-211 to TC-RDV-255 |
| **Total TCs** | 45 |
| **Requirement Coverage** | REL-001, REL-002, REL-003, REL-004, REL-005, REL-006, REL-007, REL-008 |
| **Feature Coverage** | rfd-017, rfd-018, rfd-019, rfd-084, rfd-085, rfd-086, rfd-112, rfd-113 |

---

## TC-RDV-211 — Create release linked to a Redmine version/milestone

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Release Management Dashboard (rfd-017) |
| **Requirement Ref** | REL-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- User has the `manage_releases` permission
- Project "Phoenix Platform" exists with at least one Redmine version (e.g., "v2.0.0") defined under the Versions settings
- At least one repository is connected to the project

**Test Data:**
- Release name: "v2.0.0 Release"
- Linked Redmine version: "v2.0.0"
- Description: "Second major release"

**Steps:**
1. Navigate to the project DevOps tab and click "Releases"
2. Click "New Release"
3. Enter Release name "v2.0.0 Release"
4. Select the linked Redmine version "v2.0.0" from the dropdown
5. Enter a brief description
6. Click "Create Release"

**Expected Result:**
- Release record is created and persisted in `redmineflux_devops_releases` scoped to the project
- The new release appears in the Releases dashboard list
- The linked Redmine version/milestone name is displayed on the release card
- No cross-project version IDs are selectable in the dropdown (IDOR protection)

---

## TC-RDV-212 — Release planning view shows issue counts with progress bars

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Release Management Dashboard (rfd-017) |
| **Requirement Ref** | REL-001 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- A release "v2.0.0 Release" exists linked to Redmine version "v2.0.0"
- Redmine version "v2.0.0" has issues assigned: 5 closed (done), 3 in-progress, 2 with "Release Blocker" custom field set

**Test Data:**
- Release: "v2.0.0 Release"
- Issue breakdown: 5 done, 3 in-progress, 2 blocked

**Steps:**
1. Navigate to DevOps > Releases
2. Click on the "v2.0.0 Release" entry to open the release detail page

**Expected Result:**
- Issue count summary shows: Done: 5, In-Progress: 3, Blocked: 2
- A progress bar reflects completed work relative to total (5/10 = 50%)
- Blocked issues are visually highlighted (e.g., red label or icon)
- Progress bar percentage matches the done count divided by total issue count

---

## TC-RDV-213 — Split view shows upcoming vs past releases

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Release Management Dashboard (rfd-017) |
| **Requirement Ref** | REL-001 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- At least one release with a future target date exists (status: draft/pending)
- At least one release with a past target date exists (status: published)

**Test Data:**
- Upcoming release: "v2.1.0", target date: next month
- Past release: "v1.9.0", published date: last month

**Steps:**
1. Navigate to DevOps > Releases

**Expected Result:**
- The releases list is split into two sections: "Upcoming Releases" and "Past Releases"
- "v2.1.0" appears in the Upcoming section with progress bar
- "v1.9.0" appears in the Past section with its published date
- Each section renders with correct column headers

---

## TC-RDV-214 — Release blockers prevent the publish transition

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Release Blockers (rfd-085) |
| **Requirement Ref** | REL-005 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- Release "v2.0.0 Release" exists with all approvals complete
- Two issues have the "Release Blocker" custom field set to true (or priority = "Urgent/Critical")
- Both blocker issues are still open

**Test Data:**
- Blocker issues: #101 (open, Release Blocker = true), #102 (open, Release Blocker = true)

**Steps:**
1. Navigate to DevOps > Releases > "v2.0.0 Release"
2. Click "Publish Release"

**Expected Result:**
- Publish action is blocked
- Error message displayed: "Cannot publish: 2 release blocker(s) must be resolved first"
- Blocker issues #101 and #102 are listed with links
- Release status remains in pre-published state

---

## TC-RDV-215 — Blocker detected via custom field

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Release Blockers (rfd-085) |
| **Requirement Ref** | REL-005 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- `ReleaseBlockerFinder` service is active
- A custom field "Release Blocker" (boolean) is defined for issues in the project
- Issue #105 has "Release Blocker" = true and is open
- Release "v2.0.0 Release" is linked to the version containing issue #105

**Test Data:**
- Issue #105: status=open, Release Blocker custom field = true

**Steps:**
1. Navigate to DevOps > Releases > "v2.0.0 Release"
2. Observe the "Blockers" section on the release detail page

**Expected Result:**
- The "Blockers (1)" section is displayed with issue #105 listed
- Issue #105 link is clickable and navigates to the issue page
- The count "(1)" matches the number of open blocker issues

---

## TC-RDV-216 — Blocker detected via issue priority

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Release Blockers (rfd-085) |
| **Requirement Ref** | REL-005 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Issue #107 has priority = "Urgent" and is open, linked to the release version
- No "Release Blocker" custom field exists (priority-based heuristic applies)

**Test Data:**
- Issue #107: priority=Urgent, status=open

**Steps:**
1. Navigate to DevOps > Releases > "v2.0.0 Release"
2. Observe the "Blockers" section

**Expected Result:**
- Issue #107 appears in the Blockers section (detected via priority-based heuristic)
- Publish action is blocked while #107 remains open

---

## TC-RDV-217 — Auto-generated changelog grouped by category

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Release Notes Generator (rfd-018) |
| **Requirement Ref** | REL-002 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Release "v2.0.0 Release" is linked to Redmine version "v2.0.0"
- Closed issues in this version: 3 Feature tracker, 2 Bug tracker, 1 Security tracker, 1 Task tracker
- At least 2 merged PRs are linked to the closed issues

**Test Data:**
- Features: #10 "Dark mode", #11 "API v2", #12 "Bulk export"
- Bugs: #20 "Fix null pointer", #21 "Fix login redirect"
- Security: #30 "XSS patch"
- Internal/Task: #40 "Refactor auth"

**Steps:**
1. Navigate to DevOps > Releases > "v2.0.0 Release"
2. Click "Generate Changelog"

**Expected Result:**
- Changelog is generated and displayed on the page
- Content is grouped into sections: "Features", "Bug Fixes", "Security", "Internal"
- Each issue appears under the correct section header
- Each entry includes a link to the Redmine issue
- PR links are included alongside the issue entries where merged PRs exist

---

## TC-RDV-218 — Changelog is editable before publishing

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Release Notes Generator (rfd-018) |
| **Requirement Ref** | REL-002 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Changelog has been generated for "v2.0.0 Release"

**Test Data:**
- Existing changelog text generated from closed issues

**Steps:**
1. Navigate to DevOps > Releases > "v2.0.0 Release"
2. After generating the changelog, click "Edit Notes" or click directly within the notes text area
3. Modify a feature description (e.g., add "now with keyboard shortcuts" to the dark mode entry)
4. Click "Save"

**Expected Result:**
- Modified text is saved successfully
- The updated content is reflected when viewing the release detail page
- Release remains in draft state (not auto-published on save)

---

## TC-RDV-219 — Export changelog as Markdown (.md)

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Release Notes Generator (rfd-018) |
| **Requirement Ref** | REL-002 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Changelog has been generated and saved for "v2.0.0 Release"
- User has at least `view_devops` permission (export is available to all members per permissions matrix)

**Test Data:**
- Generated changelog with at least 2 sections (Features, Bug Fixes)

**Steps:**
1. Navigate to DevOps > Releases > "v2.0.0 Release"
2. Click "Export Markdown" (or "Export .md")

**Expected Result:**
- A file download is initiated
- File name follows the pattern "CHANGELOG-v2.0.0.md" or similar
- Downloaded file is a valid Markdown document with grouped sections
- Content matches the changelog visible on the release page

---

## TC-RDV-220 — Export changelog as HTML (.html)

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Release Notes Generator (rfd-018) |
| **Requirement Ref** | REL-002 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Changelog has been generated and saved for "v2.0.0 Release"

**Test Data:**
- Generated changelog with Features, Bug Fixes, and Security sections

**Steps:**
1. Navigate to DevOps > Releases > "v2.0.0 Release"
2. Click "Export HTML" (or "Export .html")

**Expected Result:**
- A file download is initiated
- File extension is `.html`
- Downloaded file renders correctly in a browser with headings, lists, and hyperlinks
- All links in the HTML file point to valid Redmine issue URLs

---

## TC-RDV-221 — Release notes editor renders CKEditor WYSIWYG

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Release Notes Editor (rfd-112) |
| **Requirement Ref** | REL-007 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Release "v2.0.0 Release" exists
- User has `manage_releases` permission

**Test Data:**
- N/A

**Steps:**
1. Navigate to DevOps > Releases > "v2.0.0 Release" > "Release Notes" tab
2. Click "Edit"

**Expected Result:**
- CKEditor WYSIWYG editor loads in the browser without JavaScript errors
- Toolbar shows formatting options (bold, italic, lists, headings, links)
- Editor area is editable and accepts text input
- `notes_html` column is used to persist the editor content

---

## TC-RDV-222 — "Reset from Changelog" regenerates release notes

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Release Notes Editor (rfd-112) |
| **Requirement Ref** | REL-007 |
| **Priority** | Medium |
| **Scenario Type** | Workflow |

**Preconditions:**
- Release notes have been manually edited and saved
- A new issue was closed and added to the release version after manual editing

**Test Data:**
- Manually edited notes: custom text added
- New issue #55 "Add dark mode toggle" closed and targeted to release version

**Steps:**
1. Navigate to DevOps > Releases > "v2.0.0 Release" > "Release Notes" tab
2. Click "Reset from Changelog"
3. Confirm the regeneration prompt

**Expected Result:**
- Release notes are regenerated from the current set of closed issues and merged PRs
- Issue #55 now appears in the regenerated notes under the correct section
- Previous manual edits are replaced with the regenerated content
- A confirmation prompt warns the user that manual edits will be overwritten

---

## TC-RDV-223 — Release notes HTML is sanitized

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Release Notes Editor (rfd-112) |
| **Requirement Ref** | REL-007 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- Release "v2.0.0 Release" exists with an editable notes field

**Test Data:**
- Malicious input: `<script>alert('XSS')</script><b>Bold Text</b>`

**Steps:**
1. Navigate to DevOps > Releases > "v2.0.0 Release" > "Release Notes" tab
2. Click "Edit"
3. In the CKEditor, paste the malicious input: `<script>alert('XSS')</script><b>Bold Text</b>`
4. Click "Save"
5. View the release notes page

**Expected Result:**
- The `<script>` tag is stripped by Redmine's HTML allow-list sanitizer
- No JavaScript alert fires
- The `<b>Bold Text</b>` portion is preserved (allowed tag)
- Saved `notes_html` contains no `<script>` elements

---

## TC-RDV-224 — Release approval workflow: Dev Lead approves first

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Release Approval Workflow (rfd-019) |
| **Requirement Ref** | REL-003 |
| **Priority** | High |
| **Scenario Type** | Workflow |

**Preconditions:**
- Release "v2.0.0 Release" is in "Pending Approval" state
- Users: alice (Dev Lead role), bob (QA role), carol (PM/Manager role)
- Multi-role approval sequence configured: Dev Lead → QA → PM

**Test Data:**
- Approver step 1: alice (Dev Lead)

**Steps:**
1. Log in as alice (Dev Lead)
2. Navigate to DevOps > Releases > "v2.0.0 Release"
3. Click "Approve" in the approval status bar
4. Submit the approval

**Expected Result:**
- Alice's approval is recorded in `release_approvals` table with timestamp
- The approval status bar shows "Dev Lead: Approved ✓ | QA: Pending | PM: Pending"
- Release state has not changed to published (still awaiting QA and PM)

---

## TC-RDV-225 — Release approval workflow: full multi-role sequence completes

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Release Approval Workflow (rfd-019) |
| **Requirement Ref** | REL-003 |
| **Priority** | High |
| **Scenario Type** | Workflow |

**Preconditions:**
- Dev Lead approval already recorded (from TC-RDV-224)
- Users: bob (QA), carol (PM)
- No release blockers exist

**Test Data:**
- QA approver: bob | PM approver: carol

**Steps:**
1. Log in as bob (QA), navigate to the release, click "Approve"
2. Log in as carol (PM), navigate to the release, click "Approve"

**Expected Result:**
- After bob's approval: "Dev Lead: Approved ✓ | QA: Approved ✓ | PM: Pending"
- After carol's approval: "Dev Lead: Approved ✓ | QA: Approved ✓ | PM: Approved ✓"
- `fully_approved?` returns true
- "Publish Release" button becomes active for users with `manage_releases` permission

---

## TC-RDV-226 — Approval record cannot be deleted

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Release Approval Workflow (rfd-019) |
| **Requirement Ref** | REL-003 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- At least one approval record exists for "v2.0.0 Release"
- User has Admin access

**Test Data:**
- Approval record ID: any existing record in `release_approvals`

**Steps:**
1. As admin, attempt to delete an approval record via the REST API: `DELETE /devops/releases/{release_id}/approvals/{approval_id}.json`

**Expected Result:**
- HTTP 405 (Method Not Allowed) or HTTP 404 is returned
- The approval record remains in the database (immutable — no destroy action defined)
- The approval record is still visible in the approval status bar

---

## TC-RDV-227 — `fully_approved?` required before publish

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Release Approval Workflow (rfd-019) |
| **Requirement Ref** | REL-003 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- Release "v2.0.0 Release" has only Dev Lead approval (QA and PM approvals are pending)
- No release blockers exist

**Test Data:**
- Approval state: Dev Lead ✓, QA pending, PM pending

**Steps:**
1. Log in as a user with `manage_releases` permission
2. Navigate to DevOps > Releases > "v2.0.0 Release"
3. Attempt to click "Publish Release"

**Expected Result:**
- "Publish Release" button is disabled or clicking it shows an error
- Error message: "Cannot publish: all required approvals must be obtained first"
- Release status remains in pre-published/pending state

---

## TC-RDV-228 — Semantic version suggestion for MINOR bump

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Semantic Version Suggestion (rfd-084) |
| **Requirement Ref** | REL-004 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Repository is connected and has commits in the range since last release tag "v1.2.0"
- Commits include: 2 `feat:` (Conventional Commits), 3 `fix:`, 0 `feat!:` or `BREAKING CHANGE:`

**Test Data:**
- Last release tag: v1.2.0
- Commit log: `feat: add dark mode`, `feat: add bulk export`, `fix: resolve login redirect`, `fix: correct timezone`, `fix: null pointer on empty list`

**Steps:**
1. Navigate to DevOps > Releases > "New Release"
2. Observe the "Suggested Version" section populated by `SemverSuggester`

**Expected Result:**
- Suggested version is "v1.3.0" (MINOR bump due to 2 new features, no breaking changes)
- Rationale displayed: "MINOR — 2 new features, 3 bug fixes detected since v1.2.0"
- User can accept the suggestion or override with a custom version number

---

## TC-RDV-229 — Semantic version suggestion for MAJOR bump

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Semantic Version Suggestion (rfd-084) |
| **Requirement Ref** | REL-004 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Last release tag: v1.2.0
- Commits include at least one `feat!:` (breaking change) or a commit with "BREAKING CHANGE:" footer

**Test Data:**
- Commit: `feat!: remove deprecated v1 API endpoints`

**Steps:**
1. Navigate to DevOps > Releases > "New Release"
2. Observe the "Suggested Version" section

**Expected Result:**
- Suggested version is "v2.0.0" (MAJOR bump due to breaking change)
- Rationale displayed: "MAJOR — 1 breaking change detected since v1.2.0"

---

## TC-RDV-230 — Semantic version suggestion for PATCH bump

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Semantic Version Suggestion (rfd-084) |
| **Requirement Ref** | REL-004 |
| **Priority** | Low |
| **Scenario Type** | Positive |

**Preconditions:**
- Last release tag: v1.2.0
- Commits include only `fix:`, `chore:`, `docs:` — no features or breaking changes

**Test Data:**
- Commits: `fix: correct header alignment`, `chore: update dependencies`

**Steps:**
1. Navigate to DevOps > Releases > "New Release"
2. Observe the "Suggested Version" section

**Expected Result:**
- Suggested version is "v1.2.1" (PATCH bump)
- Rationale displayed: "PATCH — 1 bug fix, 1 chore since v1.2.0"

---

## TC-RDV-231 — Git tag created on release publish

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Git Tag Management (rfd-086) |
| **Requirement Ref** | REL-006 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Release "v2.0.0 Release" is fully approved (`fully_approved?` = true)
- No release blockers exist
- Compliance checklist all items passed
- Connected GitHub repository is accessible with a valid token
- User has DevOps Engineer role (can create git tags per permissions matrix)

**Test Data:**
- Release version string: "v2.0.0"
- Target commit SHA: "abc1234"

**Steps:**
1. Navigate to DevOps > Releases > "v2.0.0 Release"
2. Click "Publish Release" (or "Create Tag")
3. Confirm the action

**Expected Result:**
- `GitTagger` service calls the GitHub/GitLab API to create an annotated tag "v2.0.0" pointing to commit "abc1234"
- `tagged_at` and `tagged_by_id` columns are recorded on the release record
- Release status changes to "Published"
- Tag name "v2.0.0" is displayed on the release page with the creation timestamp and tagger name

---

## TC-RDV-232 — Git tag creation failure shows error

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Git Tag Management (rfd-086) |
| **Requirement Ref** | REL-006 |
| **Priority** | Medium |
| **Scenario Type** | Negative |

**Preconditions:**
- Release "v2.0.0 Release" is fully approved
- The connected GitHub repository API token has expired or is invalid

**Test Data:**
- Repository token: intentionally revoked

**Steps:**
1. Navigate to DevOps > Releases > "v2.0.0 Release"
2. Click "Publish Release"

**Expected Result:**
- An error message is displayed: "Failed to create git tag: API authentication error"
- Release status does NOT change to "Published"
- `tagged_at` and `tagged_by_id` remain null
- User can retry after fixing the token

---

## TC-RDV-233 — Hotfix workflow creates branch from release tag

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Hotfix Workflow (rfd-113) |
| **Requirement Ref** | REL-008 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Release "v2.0.0 Release" is published with git tag "v2.0.0" existing in the connected repository
- User has Developer or DevOps Engineer role

**Test Data:**
- Source tag: "v2.0.0"
- Expected hotfix branch: "hotfix/v2.0.1"

**Steps:**
1. Navigate to DevOps > Releases > "v2.0.0 Release"
2. Click "Create Hotfix"
3. Confirm the suggested hotfix version "v2.0.1"

**Expected Result:**
- `HotfixCreator` service calls GitHub/GitLab API to fork a new branch "hotfix/v2.0.1" from tag "v2.0.0"
- A new Redmine issue is auto-created with tracker "Hotfix", linked to the hotfix branch
- The suggested patch semver "v2.0.1" is pre-populated in the form
- Success notification: "Hotfix branch hotfix/v2.0.1 created successfully"

---

## TC-RDV-234 — Hotfix auto-creates Hotfix tracker issue

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Hotfix Workflow (rfd-113) |
| **Requirement Ref** | REL-008 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- "Create Hotfix" has been triggered for "v2.0.0 Release" (from TC-RDV-233)
- "Hotfix" tracker exists in Redmine

**Test Data:**
- Expected issue: tracker=Hotfix, subject="Hotfix v2.0.1", linked branch="hotfix/v2.0.1"

**Steps:**
1. After creating the hotfix branch, navigate to the project Issues list
2. Filter by tracker "Hotfix"

**Expected Result:**
- A new Redmine issue appears with tracker "Hotfix" and subject containing "v2.0.1"
- The issue is linked to the "hotfix/v2.0.1" branch in the DevOps panel
- Issue is assigned to the user who triggered the hotfix

---

## TC-RDV-235 — Compliance checklist auto-items evaluated

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Compliance Checklist for Release (rfd-091) |
| **Requirement Ref** | REL-003, REL-005 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Release "v2.0.0 Release" exists
- All PRs for linked issues are merged
- Latest build is green (tests pass)
- No CRITICAL severity vulnerabilities open
- All required approvals obtained

**Test Data:**
- Auto-items: PRs merged ✓, Tests green ✓, No critical vulns ✓, Approvals complete ✓

**Steps:**
1. Navigate to DevOps > Releases > "v2.0.0 Release" > "Compliance" tab

**Expected Result:**
- `ComplianceEvaluator` evaluates all auto-items
- All 4 auto-items show a green checkmark: "PRs merged", "Tests green", "No critical vulnerabilities", "Required approvals"
- Publish transition is not blocked by compliance (assuming no manual items remaining)

---

## TC-RDV-236 — Compliance checklist blocks publish when items incomplete

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Compliance Checklist for Release (rfd-091) |
| **Requirement Ref** | REL-005 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- Release "v2.0.0 Release" exists with full approvals
- One CRITICAL severity vulnerability is still open in the project

**Test Data:**
- Open vulnerability: CVE-2024-1234, severity=CRITICAL

**Steps:**
1. Navigate to DevOps > Releases > "v2.0.0 Release"
2. Click "Publish Release"

**Expected Result:**
- Publish is blocked
- Error or alert shown: "Cannot publish: Compliance checklist incomplete — No critical vulnerabilities item is failing"
- The compliance tab shows the "No critical vulnerabilities" auto-item with a red X
- Release status remains unchanged

---

## TC-RDV-237 — Manual compliance checklist items must all be checked

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Compliance Checklist for Release (rfd-091) |
| **Requirement Ref** | REL-005 |
| **Priority** | Medium |
| **Scenario Type** | Negative |

**Preconditions:**
- Release "v2.0.0 Release" has 2 manual checklist items added: "Performance test completed" and "Stakeholder sign-off received"
- Only 1 of the 2 manual items is checked

**Test Data:**
- Manual item 1: "Performance test completed" — checked
- Manual item 2: "Stakeholder sign-off received" — unchecked

**Steps:**
1. Navigate to DevOps > Releases > "v2.0.0 Release"
2. Click "Publish Release"

**Expected Result:**
- Publish is blocked
- Error displayed indicating the unchecked manual compliance item
- User must check "Stakeholder sign-off received" before publish is allowed

---

## TC-RDV-238 — IDOR protection: release lookup scoped to project

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Release Management Dashboard (rfd-017) |
| **Requirement Ref** | REL-001 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- Project A has release ID 10, Project B has release ID 20
- User belongs to Project A only

**Test Data:**
- Cross-project release URL: `/projects/project-a/devops_releases/20`

**Steps:**
1. As a member of Project A, navigate directly to `/projects/project-a/devops_releases/20` (which belongs to Project B)

**Expected Result:**
- HTTP 404 response is returned
- No release data from Project B is visible
- No error leaks project B's information

---

## TC-RDV-239 — Non-manage_releases user cannot create a release

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Release Management Dashboard (rfd-017) |
| **Requirement Ref** | REL-001 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "dev_user" has Developer role (does NOT have `manage_releases` permission per permissions matrix)
- Project has existing releases

**Test Data:**
- User: dev_user (Developer role)

**Steps:**
1. Log in as dev_user
2. Navigate to DevOps > Releases
3. Observe whether a "New Release" button is visible
4. Attempt to access `/projects/phoenix-platform/devops_releases/new` directly

**Expected Result:**
- "New Release" button is not rendered in the UI for Developer role
- Direct URL access returns HTTP 403 (Forbidden)
- No release is created

---

## TC-RDV-240 — Publish blocked when blockers exist (full workflow)

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Release Blockers (rfd-085), Release Approval Workflow (rfd-019) |
| **Requirement Ref** | REL-005, REL-003 |
| **Priority** | High |
| **Scenario Type** | Workflow |

**Preconditions:**
- Release "v2.0.0 Release" is fully approved
- Issue #99 is open with "Release Blocker" = true

**Test Data:**
- Approvals: all three roles approved
- Blocker: issue #99 open

**Steps:**
1. Navigate to DevOps > Releases > "v2.0.0 Release"
2. Observe approval status bar — all approvals shown complete
3. Click "Publish Release"

**Expected Result:**
- Despite full approval, publish is blocked by the open blocker issue #99
- Error: "Cannot publish: 1 release blocker must be resolved"
- After closing issue #99, return to the release and click "Publish Release"
- Publish now succeeds (tag is created, status changes to Published)

---

## TC-RDV-241 — View Releases page accessible to QA engineer

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Release Management Dashboard (rfd-017) |
| **Requirement Ref** | REL-001 |
| **Priority** | Medium |
| **Scenario Type** | Permission |

**Preconditions:**
- User "qa_user" has QA role (has `view_devops` permission)
- Project has existing releases

**Test Data:**
- User: qa_user (QA role)

**Steps:**
1. Log in as qa_user
2. Navigate to DevOps > Releases

**Expected Result:**
- Releases list page loads with HTTP 200
- All releases are visible
- "New Release" button is NOT present (QA cannot create releases)
- "Approve" button is present for releases pending QA approval
- Export buttons (Export MD / Export HTML) are present

---

## TC-RDV-242 — QA engineer can approve a release

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Release Approval Workflow (rfd-019) |
| **Requirement Ref** | REL-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- Release "v2.0.0 Release" is pending QA approval (Dev Lead already approved)
- User "qa_user" has QA role

**Test Data:**
- Approver: qa_user (QA role)

**Steps:**
1. Log in as qa_user
2. Navigate to DevOps > Releases > "v2.0.0 Release"
3. Click "Approve" in the QA approval step

**Expected Result:**
- Approval is recorded with qa_user's name and timestamp
- Approval status bar updates: "QA: Approved ✓"
- PM approval step remains pending

---

## TC-RDV-243 — Developer cannot approve a release

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Release Approval Workflow (rfd-019) |
| **Requirement Ref** | REL-003 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- Release "v2.0.0 Release" is pending approvals
- User "dev_user" has Developer role

**Test Data:**
- User: dev_user (Developer role)

**Steps:**
1. Log in as dev_user
2. Navigate to DevOps > Releases > "v2.0.0 Release"

**Expected Result:**
- No "Approve" button is visible for dev_user
- Attempting `POST /projects/.../devops_releases/{id}/approve` returns HTTP 403
- Approval state is unchanged

---

## TC-RDV-244 — Release notes notes_published_at recorded on publish

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Release Notes Editor (rfd-112) |
| **Requirement Ref** | REL-007 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Release "v2.0.0 Release" passes all preconditions for publishing (full approvals, no blockers, compliance all green)
- Notes have been saved in the CKEditor

**Test Data:**
- N/A

**Steps:**
1. Navigate to DevOps > Releases > "v2.0.0 Release"
2. Click "Publish Release"
3. After publish, check the release record

**Expected Result:**
- `notes_published_at` column is set to the current UTC timestamp on the release record
- Published release shows the publication date on its detail page
- Status changes to "Published"

---

## TC-RDV-245 — SemverSuggester rationale is human-readable

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Semantic Version Suggestion (rfd-084) |
| **Requirement Ref** | REL-004 |
| **Priority** | Low |
| **Scenario Type** | Positive |

**Preconditions:**
- A commit range exists since the last release tag with a mix of feat and fix commits

**Test Data:**
- Commits: `feat: user profile page`, `fix: broken pagination`, `fix: date format`

**Steps:**
1. Navigate to New Release form
2. Observe the "Suggested Version" widget

**Expected Result:**
- Rationale text is displayed in plain English (not a code string)
- Example: "Suggested: v1.3.0 — MINOR bump (1 new feature, 2 bug fixes since v1.2.0)"
- Rationale is visible without needing to expand or click anything

---

## TC-RDV-246 — Changelog generation with no merged PRs still works

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Release Notes Generator (rfd-018) |
| **Requirement Ref** | REL-002 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- Release "v2.0.0 Release" is linked to a version with 5 closed issues
- No PRs are linked to any of the closed issues

**Test Data:**
- Closed issues: 3 Feature, 2 Bug — all without associated PRs

**Steps:**
1. Navigate to DevOps > Releases > "v2.0.0 Release"
2. Click "Generate Changelog"

**Expected Result:**
- Changelog is generated successfully without errors
- Features and Bug Fixes sections are populated from closed issues
- No PR links are shown (gracefully omitted — no broken references)

---

## TC-RDV-247 — Release with zero issues still creates successfully

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Release Management Dashboard (rfd-017) |
| **Requirement Ref** | REL-001 |
| **Priority** | Low |
| **Scenario Type** | Edge |

**Preconditions:**
- A Redmine version "v3.0.0" exists with no issues assigned
- User has `manage_releases` permission

**Test Data:**
- Version: "v3.0.0" with 0 issues

**Steps:**
1. Navigate to DevOps > Releases > "New Release"
2. Link to version "v3.0.0"
3. Click "Create Release"

**Expected Result:**
- Release is created without errors
- Release detail shows: Done: 0, In-Progress: 0, Blocked: 0
- Progress bar shows 0% or is absent
- Generate Changelog button is present but produces an empty changelog with no sections

---

## TC-RDV-248 — Hotfix suggests next patch semver correctly

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Hotfix Workflow (rfd-113) |
| **Requirement Ref** | REL-008 |
| **Priority** | Medium |
| **Scenario Type** | Edge |

**Preconditions:**
- Latest published release tag is "v2.0.0"

**Test Data:**
- Source tag: v2.0.0
- Expected suggestion: v2.0.1

**Steps:**
1. Navigate to DevOps > Releases > "v2.0.0 Release"
2. Click "Create Hotfix"
3. Observe the suggested hotfix version

**Expected Result:**
- `HotfixCreator` auto-suggests "v2.0.1" (next patch increment from v2.0.0)
- User can override the suggested version before confirming

---

## TC-RDV-249 — Annotated tag contains correct message and tagger info

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Git Tag Management (rfd-086) |
| **Requirement Ref** | REL-006 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Release "v2.0.0 Release" is fully approved, no blockers, compliance passed
- GitHub repository connected with valid write-access token

**Test Data:**
- Tag name: "v2.0.0", tagger: admin user

**Steps:**
1. Navigate to DevOps > Releases > "v2.0.0 Release"
2. Click "Publish Release"
3. Verify the tag in the connected GitHub repository

**Expected Result:**
- Tag "v2.0.0" appears in GitHub as an annotated tag (not a lightweight tag)
- Tag message contains release name and tagger information
- `tagged_by_id` on the release record matches the admin user's Redmine ID
- `tagged_at` timestamp matches the creation time (within 60 seconds)

---

## TC-RDV-250 — Export release notes unavailable to non-members

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Release Notes Generator (rfd-018) |
| **Requirement Ref** | REL-002 |
| **Priority** | High |
| **Scenario Type** | Permission |

**Preconditions:**
- User "anonymous_user" is not a member of the project
- Project is set to private

**Test Data:**
- User: anonymous (not logged in, or not a project member)

**Steps:**
1. As anonymous, attempt to access `/projects/phoenix-platform/devops_releases/{id}/export.md`

**Expected Result:**
- HTTP 403 (Forbidden) or redirect to login page
- No file download is initiated
- No release notes content is exposed

---

## TC-RDV-251 — Compliance auto-item "Tests green" evaluated correctly

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Compliance Checklist for Release (rfd-091) |
| **Requirement Ref** | REL-003 |
| **Priority** | High |
| **Scenario Type** | Positive |

**Preconditions:**
- Release "v2.0.0 Release" exists
- Latest build for the release version is successful (all tests pass)

**Test Data:**
- Latest build status: success, test results: 150 passed, 0 failed

**Steps:**
1. Navigate to DevOps > Releases > "v2.0.0 Release" > "Compliance" tab

**Expected Result:**
- "Tests green" auto-item shows a green checkmark
- `ComplianceEvaluator` reads the latest build status for the linked version's commit

---

## TC-RDV-252 — Compliance auto-item "Tests green" fails when tests fail

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Compliance Checklist for Release (rfd-091) |
| **Requirement Ref** | REL-003 |
| **Priority** | High |
| **Scenario Type** | Negative |

**Preconditions:**
- Release "v2.0.0 Release" exists
- Latest build has 3 failed tests

**Test Data:**
- Latest build status: failed, test results: 147 passed, 3 failed

**Steps:**
1. Navigate to DevOps > Releases > "v2.0.0 Release" > "Compliance" tab

**Expected Result:**
- "Tests green" auto-item shows a red X
- Publish is blocked by this compliance failure
- Error details indicate the build failure status

---

## TC-RDV-253 — Compliance auto-item "PRs merged" evaluated correctly

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Compliance Checklist for Release (rfd-091) |
| **Requirement Ref** | REL-003 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- All issues linked to the release version have their associated PRs merged
- No open PRs are linked to release issues

**Test Data:**
- PRs: #55 (merged), #60 (merged), #65 (merged)

**Steps:**
1. Navigate to DevOps > Releases > "v2.0.0 Release" > "Compliance" tab

**Expected Result:**
- "PRs merged" auto-item shows a green checkmark
- Item label shows the count: "PRs merged (3/3)"

---

## TC-RDV-254 — Hotfix branch name format follows convention

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Hotfix Workflow (rfd-113) |
| **Requirement Ref** | REL-008 |
| **Priority** | Medium |
| **Scenario Type** | Positive |

**Preconditions:**
- Published release "v2.3.7 Release" exists with git tag "v2.3.7"

**Test Data:**
- Source tag: v2.3.7
- Expected branch: hotfix/v2.3.8

**Steps:**
1. Navigate to DevOps > Releases > "v2.3.7 Release"
2. Click "Create Hotfix"
3. Accept the default suggested version

**Expected Result:**
- Branch "hotfix/v2.3.8" is created from tag "v2.3.7"
- Branch name follows the `hotfix/v{semver}` convention
- The branch is visible in the connected GitHub/GitLab repository

---

## TC-RDV-255 — Release creation form is pre-populated with SemverSuggester output

| Field | Value |
|-------|-------|
| **Module** | Release Management |
| **Feature** | Semantic Version Suggestion (rfd-084), Release Management Dashboard (rfd-017) |
| **Requirement Ref** | REL-001, REL-004 |
| **Priority** | Low |
| **Scenario Type** | Positive |

**Preconditions:**
- A previous release tag "v1.5.2" exists in the connected repository
- Commits since v1.5.2 include one `feat:` commit

**Test Data:**
- Previous tag: v1.5.2
- Commit: `feat: add CSV export`

**Steps:**
1. Navigate to DevOps > Releases > "New Release"
2. Observe the version name field and suggestion widget on page load

**Expected Result:**
- Suggestion widget loads automatically and displays "v1.6.0 (MINOR)"
- The version name input field is pre-populated with "v1.6.0"
- User can clear and type a custom version number without errors
- Rationale text is displayed beneath the version field
