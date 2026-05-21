# Senior QA Testing Approach & Bug Management Standards

## Overview

This document defines the senior QA testing approach, execution standards, validation strategy, bug reporting rules, and failure management process for plugin testing using:

- Microsoft Playwright
- MCP automation
- Claude AI-assisted testing
- Redmine plugin ecosystem

This document focuses only on:

- Testing approach
- Validation strategy
- Bug creation standards
- Duplicate bug prevention
- Screenshot evidence handling

---

## Configuration References

> All credential, server, and session configuration must be read from the dedicated environment credential file before any test execution begins.

| Config Type | File |
|---|---|
| Forge server URL, admin user, Forge seed users, session rules | [`QA_CREDENTIALS_FORGE.md`](QA_CREDENTIALS_FORGE.md) |
| Local server URL, role-based users, session rules | [`QA_CREDENTIALS_LOCAL.md`](QA_CREDENTIALS_LOCAL.md) |

**Rule:** Never hardcode credentials or base URLs in test files. Always load them from the active environment credential file.

---

## 1. Senior QA Testing Philosophy

Testing must simulate real business behavior instead of only validating technical functionality.

The framework must validate:

- Real user workflows
- Real permission behavior
- Real project operations
- Real approval flows
- Real cross-user interactions
- Real business restrictions

Testing should behave like a senior manual QA engineer with automation capabilities.

---

## 2. Testing Approach Standards

### Core Testing Areas

The framework must cover:

- Functional testing
- Regression testing
- Permission testing
- Workflow testing
- UI testing
- Multi-language testing
- Integration testing
- Negative testing
- Upgrade compatibility testing

---

## 3. Real Business Scenario Testing

Automation must validate real-world workflows.

### Required Coverage

Validate:

- Multi-user operations
- Cross-role workflows
- Approval chains
- Rejection flows
- Resubmission flows
- Cross-project behavior
- Large datasets
- Bulk operations

Avoid unrealistic dummy-only testing.

---

## 4. Permission Testing Approach

Every feature must be validated using multiple user roles.

### Required Roles

- Admin
- Manager
- Developer
- QA Engineer
- Client
- Non-member
- Read-only user

### Required Validations

Validate:

- View permissions
- Create permissions
- Edit permissions
- Delete permissions
- Approval permissions
- Workflow restrictions
- Self-action restrictions
- Cross-user restrictions

---

## 5. Workflow Testing Approach

Workflow validation must include:

- Status transitions
- Approval sequence
- Rejection handling
- Reopen behavior
- Final approver logic
- Admin override behavior
- Invalid transition prevention

---

## 6. Multi-language Testing Approach

Validate:

- Translation consistency
- UI alignment
- Text truncation
- Broken layouts
- Incorrect meanings
- Tooltip translations
- Placeholder translations
- Button labels

### Translation Validation Rule

**DO NOT create bugs when:**

- Wording differs
- Meaning remains correct

**Create bugs ONLY when:**

- Meaning changes
- Action becomes misleading
- Translation breaks workflow understanding

---

## 7. Negative Testing Approach

Always validate:

- Invalid permissions
- Unauthorized actions
- Invalid workflows
- Empty field submissions
- Duplicate data handling
- Cross-user conflicts
- Invalid transitions
- Backend validation failures

---

## 8. UI Validation Standards

Validate:

- Button visibility
- Field visibility
- Form validation
- Popup behavior
- Table rendering
- Pagination
- Filters
- Search functionality
- Responsive layout stability

---

## 9. Browser & Network Validation

Every execution must validate:

### Browser Console

- JavaScript errors
- Vue/React rendering issues
- Missing assets
- Console exceptions

### Network

- Failed API calls
- 404 requests
- 500 responses
- Unauthorized requests
- Permission-denied responses

---

## 10. Test Execution Standards

Before execution, load server and credential details from the active environment file ([`QA_CREDENTIALS_FORGE.md`](QA_CREDENTIALS_FORGE.md) or [`QA_CREDENTIALS_LOCAL.md`](QA_CREDENTIALS_LOCAL.md)), then verify:

- Verify target server is running at the configured base URL
- Verify login page accessibility
- Verify authentication works using configured credentials
- Verify required plugin is installed
- Verify setup configuration is loaded

If startup validation fails:

- Stop execution immediately
- Generate setup failure log
- Do not continue test case execution

---

## 11. Authentication Testing Rules

When login is required, always use users from setup configuration.

Do not create random users if setup users already exist.

### Credential & Server Source

All credentials and server details must be sourced exclusively from:

- **[`QA_CREDENTIALS_FORGE.md`](QA_CREDENTIALS_FORGE.md)** for Forge runs
- **[`QA_CREDENTIALS_LOCAL.md`](QA_CREDENTIALS_LOCAL.md)** for local runs

These files contain:

- Base URL
- Admin credentials
- Environment-specific users
- Session storage paths (`playwright/.auth/`)
- Login validation and failure handling rules

**Never define credentials inline in test code.** Always load from the active environment file.

---

## 12. Bug Creation Standards

Whenever a bug is found, the following are mandatory:

- Create bug report
- Include Redmine version
- Attach failure screenshot
- Include reproduction steps
- Include expected result
- Include actual result
- Include environment details
- Include browser information
- Include user role information

---

## 13. Screenshot Evidence Rules

Every bug report must contain:

- Failure screenshot
- Visible failure area
- Relevant page state
- Browser timestamp if available

Screenshots must clearly demonstrate the issue.

---

## 14. Duplicate Bug Prevention Rules

Before creating a bug, validate:

- Existing open bugs
- Existing reported failures
- Existing screenshots
- Existing test case failure logs
- Existing error messages

**DO NOT create duplicate bugs for:**

- Same root cause
- Same validation issue
- Same UI issue
- Same permission issue
- Same workflow failure

Instead:

- Reuse existing bug reference
- Append additional evidence if needed

---

## 15. Bug Deduplication Logic

A bug must be treated as duplicate when:

- Same functionality fails
- Same root cause exists
- Same API failure exists
- Same UI rendering issue exists
- Same permission validation fails
- Same workflow transition fails

Even if:

- Different users reproduce it
- Different browsers reproduce it
- Different test cases trigger it

---

## 16. Bug Closure & Retest Rules

### Rule: Move bug file when fix is confirmed

When a bug is retested and confirmed **FIXED**, the bug file **must** be moved from `bugs/open/` to `bugs/closed/` before the session ends.

**A bug file must never remain in `bugs/open/` after its retest result is PASS.**

### Steps on every fix + retest

1. Complete retest — confirm the fix across every TC that was BLOCKED by this bug
2. Update the bug file: set `Status → FIXED`, add `Fix Date`, `Retest Date`, `Retest Result`
3. **Copy the updated file to `bugs/closed/BUG-<CODE>-XXX.md`**
4. **Delete the original file from `bugs/open/BUG-<CODE>-XXX.md`** — the open folder must never retain a fixed bug
5. Update `bugs/_index.md` — change Status to `Closed`, update File Path to `bugs/closed/BUG-<CODE>-XXX.md`
6. Update `reports/final-bug-report.md` — move bug entry from Open Bugs → Closed Bugs section
7. Update `reports/defects-summary.html` — decrement Open count, increment Closed count, mark bug FIXED ✓
8. Update `reports/tc-report.html` — change BLOCKED → PASS for every TC blocked by this bug; add a `fix-ref` note with bug ID and retest date
9. Update `docs/changelog.md` — add a row for the fix retest session
10. Update `docs/handoff.md` — remove the bug from the Blockers section

### Bug folder states

| State | Folder | Example |
|-------|--------|---------|
| Open — confirmed, not yet fixed | `bugs/open/` | `bugs/open/BUG-RAF-001.md` |
| Closed — fix confirmed by retest PASS | `bugs/closed/` | `bugs/closed/BUG-RAF-001.md` |
| Duplicate / not reproducible | `bugs/_duplicates.md` | entry in the log |

**The `bugs/open/` folder must be empty when all bugs for the current cycle are fixed.**

---

## 17. Bug Title Standards

All bug titles must use **sentence case**.

**Correct example:**

> User able to move workload task to another user causing duplicate validation error

**Do NOT use title case.**

---

## 18. Failure Artifact Collection

On failure automatically capture:

- Screenshot
- Video
- Trace
- Console logs
- Network logs

Preserve artifacts for debugging and reporting.

---

## 19. Reporting Standards

Execution reports must include:

- Passed test cases
- Failed test cases
- Skipped test cases
- Bug references
- Screenshot references
- Failure summaries
- Environment details

---

## 20. AI-Assisted Testing Standards

When using AI-generated automation, the framework must:

- Follow existing business workflows
- Reuse setup configuration
- Avoid duplicate logic
- Avoid duplicate bug creation
- Capture proper evidence
- Generate readable logs
- Follow stable testing practices

---

## 21. Final Senior QA Rules

These rules are mandatory for all future plugin testing:

- Always validate real business workflows
- Always validate permissions
- Always validate workflows
- Always validate browser console errors
- Always validate network failures
- Always attach screenshots to bugs
- Always prevent duplicate bug creation
- Always use stable automation practices
- Always validate authentication stability
- Always use setup-configured users and data
- Always preserve debugging artifacts
- Always follow senior QA reporting standards

---

## Final Goal

The final QA automation system should behave like a senior QA engineer:

- Business-aware
- Workflow-aware
- Permission-aware
- Failure-aware
- Reporting-aware
- Stable
- Maintainable
- Scalable

The framework must prioritize:

- Accurate validation
- Reliable automation
- Clear reporting
- Strong evidence collection
- Duplicate bug prevention
- Real-world workflow testing

---

## 22. Screenshots Rules

### Folder structure

```
screenshots/
├── TC-RAF-001/          ← one subfolder per test case executed
│   └── tc-raf-001-pass.png
├── TC-RAF-002/
│   └── tc-raf-002-pass.png
├── BUG-RAF-001/         ← one subfolder per bug found
│   ├── bug-raf-001-alert-fired.png
│   └── retest-2026-05-21-fixed.png
└── BUG-RAF-002/
    ├── bug-raf-002-validation-error.png
    └── retest-2026-05-21-pass.png
```

### TC screenshots

- **Take one screenshot per test case** — capture the final state that confirms PASS or FAIL.
- Save under `screenshots/<TC-ID>/` using the naming pattern `<tc-id>-<result>.png`
  - PASS example: `screenshots/TC-RAF-001/tc-raf-001-pass.png`
  - FAIL example: `screenshots/TC-RAF-001/tc-raf-001-fail.png`
- Screenshot must show the relevant page state that proves the TC result.

### Bug screenshots

- Take a screenshot **at the exact moment the bug is observed** — show the failure area clearly.
- Save under `screenshots/<BUG-ID>/` using a descriptive name (e.g. `bug-raf-001-alert-fired.png`).
- For retest evidence, save under the same `screenshots/<BUG-ID>/` folder with a retest prefix (e.g. `retest-2026-05-21-fixed.png`).

### Summary

| Screenshot type | Folder | Naming |
|-----------------|--------|--------|
| TC execution (PASS/FAIL) | `screenshots/<TC-ID>/` | `<tc-id>-pass.png` / `<tc-id>-fail.png` |
| Bug evidence | `screenshots/<BUG-ID>/` | descriptive name of the failure |
| Bug retest | `screenshots/<BUG-ID>/` | `retest-<date>-<result>.png` |

---

## 23. Reporting Rules

At the end of every test run, generate:

| Report | Location | Trigger |
|--------|----------|---------|
| `tc-report.html` | `plugins/<plugin>/reports/` | Auto — end of every test run |
| `defects-summary.html` | `plugins/<plugin>/reports/` | Auto — end of every test run |
| `final-bug-report.md` | `plugins/<plugin>/reports/` | Auto — generated from all files in `bugs/open/` |
| `final-bug-report.pdf` | `plugins/<plugin>/reports/` | **Manual only** — generated ONLY when user explicitly requests it |

**Never auto-generate the PDF.** Always ask the user: "Testing is complete. Do you want me to generate the final PDF bug report?"

---

## 24. Plugin Memory Rules

Two levels of memory are maintained:

| Level | File | Scope |
|-------|------|-------|
| Global | `MEMORY.md` (root) | Rules applying to ALL plugins |
| Plugin | `plugins/<plugin>/docs/memory.md` | Plugin-specific quirks, observations, recurring issues |

Always update the plugin-level `memory.md` after a test run with new observations.
Only update root `MEMORY.md` when a rule applies globally across all plugins.
