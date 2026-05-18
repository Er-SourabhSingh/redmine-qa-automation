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

## 16. Bug Title Standards

All bug titles must use **sentence case**.

**Correct example:**

> User able to move workload task to another user causing duplicate validation error

**Do NOT use title case.**

---

## 17. Failure Artifact Collection

On failure automatically capture:

- Screenshot
- Video
- Trace
- Console logs
- Network logs

Preserve artifacts for debugging and reporting.

---

## 18. Reporting Standards

Execution reports must include:

- Passed test cases
- Failed test cases
- Skipped test cases
- Bug references
- Screenshot references
- Failure summaries
- Environment details

---

## 19. AI-Assisted Testing Standards

When using AI-generated automation, the framework must:

- Follow existing business workflows
- Reuse setup configuration
- Avoid duplicate logic
- Avoid duplicate bug creation
- Capture proper evidence
- Generate readable logs
- Follow stable testing practices

---

## 20. Final Senior QA Rules

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
