# Bug Report Template

- Bug ID: BUG-CRX-025
- Production Redmine Issue ID: #120758
- Title: Budget Agent's `get_budget_status` enforces no permission check at all — a user with zero Budget/Audit permissions can read real approved-hours and spend figures via chat
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux (Budget Agent, Budget and Audit plugin domain)
- Plugin version: crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP)
- User role: `luna.blossom` (Manager role, `Use Ask Crux` granted, but confirmed **zero** "Manage approved hours" permission — the only permission this plugin defines, unchecked for every role including Manager per Administration → Roles → Permissions report)
- Date: 2026-09-17

## Steps to reproduce

1. Confirm the Manager role lacks "Manage approved hours" (Administration → Roles → Permissions report — unchecked for every role except the built-in admin bypass).
2. Log in as `luna.blossom`.
3. Open Ask Crux, send: "Budget Agent, are we over budget on crux-qa (project 1)?"
4. Observe the response.

## Expected result

- A user with no Budget/Audit permission at all should be refused, the same way the Invoicing Agent and Sales Agent (CRM) correctly refused equivalent requests in the same session under identical conditions — this plugin's data is explicitly financial/hours-tracking and gated by its own permission for exactly this reason.

## Actual result

The Budget Agent answered with real, specific financial data, no refusal at all:

> "No, crux-qa (project 1) is not over budget. | Total Approved | 37.5h | | Total Spent | 0.0h | | Remaining | 37.5h | All 37.5 hours are allocated to the Development - Quality Assurance & Testing category, with no hours spent yet."

A real tool call (`redmineflux_budget_audit_get_budget_status`) was made and returned real, specific figures (37.5h approved, category-level breakdown) — this is the most concrete of three sibling findings this session (see also BUG-CRX-023, BUG-CRX-024) since it exposes genuinely real financial/hours data to a user with zero permission in the plugin, not an honestly-empty result.

## Evidence

### Screenshot

Not captured — confirmed via live chat transcript text, cross-checked against Administration → Roles → Permissions report confirming `luna.blossom`'s Manager role lacks "Manage approved hours".

### Console / log

```
C (luna.blossom, zero Budget/Audit permissions): Budget Agent, are we over budget on crux-qa (project 1)?
-> asking the Budget Agent...
No, crux-qa (project 1) is not over budget.
| Total Approved | 37.5h | Total Spent | 0.0h | Remaining | 37.5h |
All 37.5 hours are allocated to the Development - Quality Assurance & Testing category...
Sources (1) calling redmineflux_budget_audit_get_budget_status...
```

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): — Same defect *class* as BUG-CRX-023/024 (this same session), BUG-CRX-003/012 (fixed), BUG-CRX-022 (open) — missing permission enforcement on a Crux-exposed read, distinct code location (`redmineflux_budget_audit_get_budget_status`). This is the sixth confirmed instance of this exact defect class across the engagement.

## Production report

Reported to production as issue **#120758** (`ztflux`, Tracker Bug, Priority High, assigned to Prashant Chaurasia — user id 410), 2026-09-17. Textile description, no attachments. Linked to Run #569 "Crux QA Run 1", testcase **#120492** (`CRUX_AGENT_DEVOPS_AND_BUDGET.md`), Environment "Window 11 + Chrome" — testcase marked Failed.
