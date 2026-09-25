# Bug Report Template

- Bug ID: BUG-CRX-024
- Production Redmine Issue ID: #120757
- Title: QA Agent's `list_test_suites` enforces no Testcase Management permission check — a user with zero permissions there can query real test-suite data via chat
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux (QA Agent, Testcase Management plugin domain)
- Plugin version: crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP)
- User role: `luna.blossom` (Manager role, `Use Ask Crux` granted, but confirmed **zero** Testcase Management permissions — every permission in that group unchecked per Administration → Roles → Permissions report)
- Date: 2026-09-17

## Steps to reproduce

1. Confirm the Manager role has zero Testcase Management permissions (Administration → Roles → Permissions report — the entire "Redmineflux Testcase Management" group unchecked for Manager).
2. Log in as `luna.blossom`.
3. Open Ask Crux, send: "QA Agent, what test suites exist for crux-qa (project 1)?"
4. Observe the response.

## Expected result

- Per the Testcase Management plugin's own granular permission model (documented per-action permissions for suites/runs/reports/etc.), a user with none of those permissions should be refused reading test-suite data, the same way the Invoicing Agent and Sales Agent (CRM) correctly refused equivalent requests in the same session under identical conditions.

## Actual result

The QA Agent answered with a real (if honestly empty) result, no refusal at all:

> "The crux-qa project (id=1) currently has no test suites defined. This means there are no test suite containers set up yet for organizing test cases. Would you like me to: 1. Create a new test suite... 2. List any existing test cases... 3. Check the project details..."

A real tool call (`redmineflux_testcases_management_list_test_suites`) was made — confirmed via the response's citation. Today there happens to be no real suite data to leak, but the mechanism is confirmed broken and would expose real test-suite/plan data once any exists, exactly as BUG-CRX-023 does for Knowledge Base data.

## Evidence

### Screenshot

Not captured — confirmed via live chat transcript text, cross-checked against Administration → Roles → Permissions report confirming `luna.blossom`'s Manager role has zero Testcase Management permissions.

### Console / log

```
C (luna.blossom, zero Testcase Mgmt permissions): QA Agent, what test suites exist for crux-qa (project 1)?
-> asking the QA Agent...
The crux-qa project (id=1) currently has no test suites defined...
Sources (1) calling redmineflux_testcases_management_list_test_suites...
```

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): — Same defect *class* as BUG-CRX-023 (this same session), BUG-CRX-003/012 (fixed), BUG-CRX-022 (open) — missing permission enforcement on a Crux-exposed read, distinct code location (`redmineflux_testcases_management_list_test_suites`).

## 2026-09-25 retest — FIXED, live-confirmed

Same exact repro: `luna.blossom` (Manager, zero Testcase Management permissions confirmed unchanged), same question "QA Agent, what test suites exist for crux-qa (project 1)?". **Result:** honest refusal — *"You don't have permission to view test suites for project 1 (crux-qa). Your Redmine administrator needs to grant you the view_test_suite permission for that project."* — with a real `Sources (1)` citation.

**Verdict: FIXED, live-confirmed.** Ready to close pending user approval (production sync required).

## Production report

Reported to production as issue **#120757** (`ztflux`, Tracker Bug, Priority Medium, assigned to Prashant Chaurasia — user id 410), 2026-09-17. Textile description, no attachments. Linked to Run #569 "Crux QA Run 1", testcase **#120494** (`CRUX_AGENT_QA_TESTCASES.md`), Environment "Window 11 + Chrome" — testcase marked Failed.
