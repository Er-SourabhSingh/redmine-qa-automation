# Test Scope — Redmineflux Helpdesk

> See `HELPDESK_TEST_PLAN.md` for the full strategy this scope declaration belongs to — objectives, test data strategy, automation strategy, defect management, and current status.

## In Scope

- [x] Functional testing
- [x] Permission testing
- [x] Workflow testing
- [x] Negative testing
- [x] UI validation
- [ ] Multi-language testing — in scope, not yet started (no test cases written or executed against a non-English locale)
- [x] Email testing (outbound notifications + inbound email-to-ticket/reply-to-note) — Local environment only, see `HELPDESK_EMAIL_TEST_PLAN.md`
- [x] Regression automation (Playwright + TypeScript, `automation/`) — infrastructure complete, zero specs written yet

## Out of Scope

- Redmine core functionality not modified by this plugin
- Load/performance testing
- Security penetration testing beyond permission-boundary functional checks
- Real external email delivery (Gmail, other real providers) — only the local Docker mail server or Forge's own sandbox are used
- **Portal Preview (agent-facing "View portal" / `/rf_customers/:id/portal`)** — per explicit user product-judgment direction (2026-08-27), this is **not considered part of this plugin's intended functionality**, despite being documented as Feature #37 in `HELPDESK_FEATURES_LIST.md` and described in `HELPDESK_USER_GUIDE.md` §11. The route exists, is fully implemented (read-only rendering, correct per-project entitlement scoping including a 403 on out-of-entitlement projects), and is reachable directly — but has no discoverable UI entry point anywhere (Customer 360 has no "View portal" button). Since the route works correctly and is well-scoped, this reads as deliberately-built functionality, not leftover/dead code — but the product call is that it should not be part of this plugin regardless of implementation quality. See `bugs/open/BUG-HLP-013.md` and TC-HLP-117/124 in `HELPDESK_CUSTOMERS_ORGANIZATIONS.md` for the full reasoning and evidence. Flag to product/dev: either formally remove the route, or reverse this scope call and add the missing entry point.

## Redmine Version

Supported per plugin documentation: 5.0.x, 5.1.x, 6.0.x, 6.1.x. Tested to date: 6.x only (both Forge and Local). Not yet tested: 5.0.x, 5.1.x, 6.1.x.

## Environment

- **Forge** — rotates per run, always re-verify current URL against `QA_CREDENTIALS.md`. Cannot test email (no route to any real inbox). Primary environment for everything else.
- **Local** — `http://localhost:3012` (`redmine-docker-6-redmine-1`). The only environment that can test real email end-to-end (local Docker mail server, domain `test.local`). Requires Redis + Sidekiq started manually every session (do not survive a container restart).

## Test Cycle

Ongoing, multi-session. 227 test cases written (2026-08-21) across 12 suites; execution partial on Forge to date, not yet a full pass through every suite. See `HELPDESK_TEST_PLAN.md` §10 for the current status snapshot and `HELPDESK_HANDOFF.md`'s Run History for the latest.
