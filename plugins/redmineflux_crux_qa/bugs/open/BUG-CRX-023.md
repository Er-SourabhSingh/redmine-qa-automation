# Bug Report Template

- Bug ID: BUG-CRX-023
- Production Redmine Issue ID: #120756
- Title: KB Agent's `list_spaces` enforces no Knowledge Base permission check — a user with zero KB permissions can read real space/page data via chat
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux (KB Agent, Knowledge Base plugin domain)
- Plugin version: crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP)
- User role: `luna.blossom` (Manager role, `Use Ask Crux` granted, but confirmed **zero** Knowledge Base permissions — neither "Manage knowledgebase spaces" nor "Manage knowledgebase content" — per Administration → Roles → Permissions report)
- Date: 2026-09-17

## Steps to reproduce

1. Confirm the Manager role has zero Knowledge Base permissions (Administration → Roles → Permissions report — "Manage knowledgebase spaces"/"Manage knowledgebase content" both unchecked for Manager).
2. Log in as `luna.blossom`.
3. Open Ask Crux, send: "KB Agent, what spaces exist for crux-qa (project 1)?"
4. Observe the response.

## Expected result

- Per the Knowledge Base plugin's own documented permission model (a `view_knowledgebase`-equivalent permission gates viewing spaces/pages — see the plugin's own knowledge base page), a user with no Knowledge Base permission at all should be refused, the same way the Invoicing Agent and Sales Agent (CRM) correctly refused equivalent requests in the same session under identical conditions.

## Actual result

The KB Agent answered with real data, no refusal at all:

> "The crux-qa project (id=1) has one knowledge-base space: Documentation (space id=1) – contains 1 node. Would you like me to drill into what pages or folders exist in the Documentation space?"

A real tool call (`redmineflux_kb_list_spaces`) was made and returned real data — confirmed via the response's `Sources (1) — calling redmineflux_kb_list_spaces…` citation. No permission check was applied anywhere in this path.

Contrast, same session, same user, moments earlier: `Invoicing Agent, show me the invoice dashboard for crux-qa.` → correctly refused: *"I don't have permission to view the invoice dashboard for crux-qa (project id=1). Your Redmine administrator needs to grant you the `view_invoices` permission..."* — proving the write-confirm/read-permission layer is capable of a proper refusal when the underlying plugin's proxy tool actually checks for it; the KB Agent's tool simply doesn't.

## Evidence

### Screenshot

Not captured — confirmed via live chat transcript text, cross-checked against Administration → Roles → Permissions report confirming `luna.blossom`'s Manager role has zero KB permissions.

### Console / log

```
C (luna.blossom, zero KB permissions): KB Agent, what spaces exist for crux-qa (project 1)?
-> asking the KB Agent...
The crux-qa project (id=1) has one knowledge-base space:
Documentation (space id=1) -- contains 1 node
Would you like me to drill into what pages or folders exist in the Documentation space?
Sources (1) calling redmineflux_kb_list_spaces...
```

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): — Same defect *class* as BUG-CRX-003 (fixed), BUG-CRX-012 (fixed), and BUG-CRX-022 (open) — missing permission enforcement on a Crux-exposed read — but a distinct code location (`redmineflux_kb_list_spaces` / the KB plugin's own proxy layer, not the dashboard or agents-page controllers those bugs covered).

## Production report

Reported to production as issue **#120756** (`ztflux`, Tracker Bug, Priority High, assigned to Prashant Chaurasia — user id 410), 2026-09-17. Textile description, no attachments. Linked to Run #569 "Crux QA Run 1", testcase **#120497** (`CRUX_AGENT_KNOWLEDGE_BASE.md`), Environment "Window 11 + Chrome" — testcase marked Failed.
