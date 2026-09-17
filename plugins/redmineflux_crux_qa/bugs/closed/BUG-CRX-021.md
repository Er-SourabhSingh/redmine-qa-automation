# Bug Report Template

- Bug ID: BUG-CRX-021
- Production Redmine Issue ID: #120712
- Title: Invoicing Agent resolves project "crux-qa" to the wrong, nonexistent numeric ID (#10 instead of the real #1)
- Redmine version: 7.0.0 (local Docker)
- Plugin name: redmineflux_crux (Invoicing Agent, Invoice plugin domain)
- Plugin version: crux-core 0.92.0
- Environment: Local — `http://localhost:3014`
- Browser: Chromium (Playwright MCP)
- User role: `admin` (Redmine Administrator)
- Date: 2026-09-16

## Steps to reproduce

1. In an Ask Crux chat session, ask the Invoicing Agent about project "crux-qa" by name (e.g. "Invoice, what are our current team rates for crux-qa?" or "Invoice, set the rate for user 1 to $75/hr on crux-qa.").
2. Observe how the agent labels the project's numeric ID in its response.
3. Independently verify the project's real numeric ID via the real Redmine UI (a settings-page form's `action` attribute, e.g. `/approved_hour?project_id=N`, reliably exposes it).

## Expected result

- The Invoicing Agent should resolve "crux-qa" to its real Redmine project ID (1, confirmed via `/projects/crux-qa/settings` → `/approved_hour?project_id=1` form action, and cross-checked against `crux-qa-private` resolving correctly to ID 2) — every other domain agent tested this entire engagement (Budget, Workload, CRM, etc.) correctly resolves crux-qa to ID 1.

## Actual result

- The Invoicing Agent consistently labels crux-qa as **project #10** — reproduced 4/4 times across two different write/read exchanges in the same session ("Team Rates for crux-qa (Project #10)", and a `Proposed Team Rate` confirm-attempt table showing "Project | crux-qa (#10)"). Project #10 does not exist in this Redmine instance at all — this instance has exactly 2 real projects, crux-qa (ID 1) and crux-qa-private (ID 2); ID 10 corresponds to nothing (it happens to collide with a real Redmine *issue* ID — #10, an unrelated Agile Board fixture created earlier in this session — suggesting the agent may be confusing an issue ID with a project ID somewhere in its context).
- This is currently masked from having any real-world effect because the same write attempt also hit BUG-CRX-020 (no real Confirm button ever renders, so the write never executes) — but if BUG-CRX-020 is fixed independently, this defect would cause every Invoicing Agent write to silently target the wrong (nonexistent) project, either failing outright or — worse — succeeding against unrelated project #10 data if such a project is ever created with that ID in a different environment.

## Evidence

### Screenshot

Not captured — confirmed via live chat transcript text, cross-checked against the real `/projects/crux-qa/settings` and `/projects/crux-qa-private/settings` pages' form `action` attributes (`/approved_hour?project_id=1` and `/approved_hour?project_id=2` respectively).

### Console / log

```
C: Invoice, what are our current team rates for crux-qa?
-> asking the Invoicing Agent...
Team Rates for crux-qa (Project #10):
No team rates are currently configured for project crux-qa...

C: Invoice, set the rate for user 1 to $75/hr on crux-qa.
-> asking the Invoicing Agent...
Proposed Team Rate:
| Setting | Value |
|---------|-------|
| Project | crux-qa (#10) |
| User ID | 1 |
| Hourly Rate | $75.00 |
This proposal is now pending your confirmation. Click Confirm to set the rate.

[Real /projects/crux-qa/settings form actions confirm project_id=1, not 10]
[Real /projects/crux-qa-private/settings form actions confirm project_id=2]
```

## 2026-09-16 retest — FIXED, confirmed live

Not part of today's `CHANGES.md`, but resolved nonetheless (likely as a side effect of another fix in the same Invoicing Agent prompt/tooling, or a data/context change since the original finding — root cause in the agent's own resolution logic not independently traced this session).

**Retest (exact original repro):**
1. `Invoice, what are our current team rates for crux-qa?` → *"...for the crux-qa project (id=1)."* — correct ID, not #10.
2. `Invoice, set the rate for user 1 to $75/hr on crux-qa.` → real `Invoice Set Team Rate` proposal, `Project: Crux QA` (display name, no bogus ID shown) → confirmed → `"✓ Team rate set: Redmine Admin → 75.0/hr on project #1 (rate_id: #1)"` — genuinely targeted the real project #1.

**Verdict: FIXED.** Bonus: this retest also independently re-confirms BUG-CRX-020's fix — a real `WRITE` card with functioning Confirm/Cancel buttons rendered for the Invoicing Agent, the same agent/action pair where BUG-CRX-020 was originally reproduced.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): — (distinct from BUG-CRX-020, which was hit on the same exchange but is about the missing Confirm button; this is a separate, independent defect in the agent's own name-to-ID resolution)

## Production report

Reported to production as issue **#120712** (`ztflux`, Tracker Bug, Priority High, assigned to Prashant Chaurasia — user id 410), 2026-09-16. Textile description, no attachments (per updated §4.3a policy). Found via TC-CRX-127/130 (`CRUX_AGENT_INVOICE_BILLING.md`) — testcase marked Failed.
