# Bug Report Template

- Bug ID: BUG-HLP-013
- Production Redmine Issue ID: 119661
- Title: Portal Preview route (`/rf_customers/:id/portal`) is fully reachable and exposes a customer's project/ticket data, despite Portal Preview not being part of this plugin's intended functionality
- Redmine version: (see QA_CREDENTIALS_LOCAL.md — Local, redmine-docker-6)
- Plugin name: Redmineflux Helpdesk
- Plugin version: —
- Environment: Local (http://localhost:3012, redmine-docker-6)
- Browser: Chromium (Playwright MCP)
- User role: Administrator (admin)
- Date: 2026-08-27 (revised 2026-08-27 same day, per explicit user product-judgment direction — see Revision History below)

## Steps to reproduce

1. Log in as admin, open Customer 360 for `beta.customer` (`/rf_customers/16`).
2. Full DOM scan of every `<a>`/`<button>` on the page (`document.querySelectorAll('a, button')`) — the only customer-specific action present is **Edit** (`/rf_customers/16/edit`). No "View portal", "Preview", or equivalent control exists anywhere on the page, in any menu, dropdown, or icon.
3. Navigate directly to `/rf_customers/16/portal` anyway (the route named in `HELPDESK_USER_GUIDE.md` §11).
4. Result: the route resolves and renders fully. Shows a banner "You are viewing the portal as **Beta Customer** · beta.customer@test.local. Nothing you do here is visible to the customer.", a **Read only** badge, an **Exit preview** link back to Customer 360, a "My Helpdesk" heading captioned "What Beta Customer sees when they open the helpdesk," and correctly lists the customer's actual entitled project (Helpdesk QA Beta, 3 open) with a `View` link to `/rf_customers/16/portal?project_id=4`.
5. Also tested entitlement scoping (TC-HLP-066): forced `/rf_customers/16/portal?project_id=3` (Helpdesk QA Alpha — a project `beta.customer` has zero entitlement to) — correctly returns a clean **403 Forbidden**, not an exposed preview.

## Expected result

Per explicit user product-judgment direction (2026-08-27): **Portal Preview is not considered part of this plugin's intended functionality** (see `HELPDESK_SCOPE.md` Out of Scope), regardless of the fact that it's currently documented in `HELPDESK_USER_GUIDE.md` §11 and listed as Feature #37 in `HELPDESK_FEATURES_LIST.md`. Given that:

- No route for it should exist at all — `/rf_customers/:id/portal` should 404 or otherwise not resolve.
- No customer project/ticket data should be renderable through it by any staff account, since the whole surface shouldn't be present.

## Actual result

- The route is fully reachable and fully functional for any admin/agent session, with no gating at all beyond ordinary login.
- Its internal logic is genuinely well-built — correct read-only rendering, correct "what does this customer actually see" content, and correct per-project entitlement scoping (403 confirmed on an out-of-entitlement project via TC-HLP-066) — which is notable because it means this isn't leftover/abandoned code; real engineering effort went into it. That's evidence the feature was deliberately built at some point, which is worth surfacing to product/dev even though it doesn't change this bug's expected result.
- Zero discoverable UI path exists to it (no button anywhere on Customer 360) — so in practice today it's only reachable by someone who already knows the exact URL pattern. That accidentally limits exposure, but is not the same as the feature not existing, and is not a substitute for the route itself not existing.

## Evidence

### Screenshot

![Customer 360 — no portal entry point](../../screenshots/BUG-HLP-013/customer-360-no-portal-entry-point.png)
![Portal route works when reached directly](../../screenshots/BUG-HLP-013/portal-route-works-when-reached-directly.png)

### Console / log

- No console errors on either page.

## Duplicate check

- Duplicate found: No. Related to BUG-HLP-005 in defect shape (a real route reachable outside the discoverable UI) but a distinct root cause — BUG-HLP-005's routes are reachable via an unlinked *global list page*'s own "New" button; here there is no alternate discoverable path at all.
- Existing bug reference (if duplicate): —

## Recommendation

Since the route's own internal logic is correct and deliberate, this needs a product/dev decision, not just a code fix in one direction:
- **Either** formally remove the `/rf_customers/:id/portal` route (and its controller action) entirely, since Portal Preview is being treated as out of scope, **or**
- Reverse this scope call, keep the route, and add the missing "View portal" entry point to Customer 360 — in which case this reverts to the original framing (a usability gap: working feature, no way to reach it) rather than a scope violation.

## Related

- Corrects TC-HLP-056 and TC-HLP-066's scoring in `HELPDESK_CUSTOMERS_ORGANIZATIONS.md`. TC-HLP-056's expected result was rewritten to match the revised scope call and is now **FAIL** (the route should not be reachable at all, but is). TC-HLP-066 remains a **PASS** for the narrow entitlement-scoping behavior it tests, but is now explicitly secondary — its own correctness doesn't offset TC-117's FAIL once Portal Preview is considered out of scope.

## Retest — 2026-08-31, Local (redmine-docker-6), fresh rebuilt environment

- **Context**: retested against `alpha.customer` (Customer ID 6) on the environment rebuilt earlier this session — zero shared history with the original `beta.customer`/Customer ID 16 repro.
- **Steps**: Customer 360 for `alpha.customer` (`/rf_customers/6`) still shows only an **Edit** action — no "View portal" or equivalent control, matching the original finding. Navigated directly to `/rf_customers/6/portal` (and the query-param variant `/rf_customers/6/portal?project_id=1`) — this is admin route-existence testing, not a customer/agent journey, so direct navigation is the correct method here, same as this bug's own original methodology.
- **Result**: both URLs now return a genuine **HTTP 404 Not Found**. Confirmed the app itself was up and the admin session valid at the same time (`/rf_customers/6` loads normally immediately before and after) — rules out a broader outage being mistaken for a fix. Screenshot: `retest-2026-08-31-portal-route-404.png`.
- **Verdict: RETEST PASS.** This matches exactly the first option in this bug's own Recommendation section: the route has been formally removed rather than gaining a new entry point. TC-HLP-056 (which was rewritten to expect a 404) now genuinely passes as written.

## Closed — 2026-08-31

- Closed per explicit user confirmation, following the clean retest above (the route was formally removed — `/rf_customers/:id/portal` now 404s).
- If a Portal Preview-equivalent surface reappears anywhere without a discoverable entry point, file a new bug rather than reopening this one — this bug specifically covered the removal decision, not the general "hidden route" defect shape.

## Revision History

- **2026-08-27, initial filing:** Framed as "feature works correctly, only its UI entry point is missing" (Medium) — this assumed Portal Preview was legitimate, in-scope functionality per the User Guide/Features List, just missing its trigger button.
- **2026-08-27, same day, revised:** User reviewed and gave explicit product-judgment direction that Portal Preview should not be part of this plugin's functionality at all, regardless of what the User Guide/Features List currently say. Rewrote Title/Expected/Actual result to match: the defect is now that the route exists and is reachable at all, not that it lacks a button. Severity kept at Medium pending product/dev's actual removal-vs-keep decision (see Recommendation) — could reasonably move either direction once that's settled.
