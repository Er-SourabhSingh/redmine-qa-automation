# Helpdesk QA: Own-Fixture Provisioning + Full Automation Build-Out

## Context

This engagement has been driving the `redmineflux_helpdesk` plugin manually through Playwright MCP all session — 294 test cases exist across 12 suite files, 10 bugs have been filed, and a partial `automation/tests/` scaffold already exists (14 page objects, `auth.setup.ts`, `playwright.config.ts`, `env.ts`). The user now wants two things done properly, not ad hoc:

1. **Real, deterministic TypeScript + Playwright automation** for the plugin — not AI-driven MCP clicking — with a genuine Playwright HTML report as the output artifact.
2. **Fixtures we control**, not seed data we can't trust. On the server (Forge), a reseed script runs per rotation and hands out demo accounts with passwords that change every time — so any automation built against "whatever seed users exist" breaks the moment the server reseeds. The user's own words: *"we need to create our user and customer and create data for testing so we can automate properly."* The only thing that reliably exists on any freshly-seeded Redmine instance is the **Admin** login — everything else (Agent role + workflow, Helpdesk projects, named agents, customers, base SLA/Org/Product data) must be created by our own idempotent, UI-driven provisioning, since **there is no backend/docker access on the real server** — only what Admin can click through in the browser.

Sequencing choice already confirmed by the user: **build the provisioning/setup layer first, across all areas**, before diving into any individual test suite.

A real architecture mismatch was found during exploration and must be fixed as part of this work: the existing `automation/utilities/env.ts` / `auth.setup.ts` / `playwright.config.ts` scaffold is built around a **generic** role taxonomy (`admin`/`manager`/`developer`/`qaEngineer`/`client`) reading from the **repo-root** `QA_CREDENTIALS_LOCAL.md` (`localhost:3006`, users like `priya.patel`/`aman.verma`). That has nothing to do with this plugin's real testing — all of this session's actual Helpdesk work happened on `localhost:3012` (`redmine-docker-6`) using named individual agents (`aurora.wren`, `luna.blossom`, ...) and real customers (`alpha.customer`/`beta.customer`), documented in `plugins/redmineflux_helpdesk_qa/docs/HELPDESK_USERS_AND_CUSTOMERS.md`. That scaffold was seemingly set up early (Aug 21) before the plugin's real role model (Admin / Agent / Customer, not Manager/Developer/QA/Client) was even known, and never updated. This plan replaces it.

---

## Phase 1 — Provisioning foundation (build first)

A new Playwright **setup project**, `automation/tests/provision.setup.ts`, run before `auth.setup.ts` in the dependency chain. Logs in as **Admin only** (the one credential we can always trust exists), then idempotently (check-before-create, matching the existing `CLAUDE.md` §13a rule) creates everything else purely through UI clicks — no `docker exec`, no `rails runner`, nothing that wouldn't work against the real Forge server:

0. **Admin login + forced first-time password change** — a brand-new container or a fresh Forge rotation both start with Admin at Redmine's default `admin`/`admin`, which Redmine forces a password change on before allowing any further action. This must be the very first thing the script does, and it must be self-healing across repeated runs (some runs hit a fresh instance, some hit one this same script already provisioned):
   - Attempt login with our fixture's target Admin password first.
   - If that fails, fall back to `admin`/`admin` — if that succeeds and lands on Redmine's forced password-change screen, submit the fixture's target Admin password there to complete the change.
   - Either way, end this step actually logged in as Admin with the fixture's target password active, before touching anything else. `automation/utilities/env.ts`'s `ADMIN_PASSWORD` becomes "the password we want Admin to end up with," not necessarily what's live on a never-before-provisioned instance.
1. **Agent role** — Administration → Roles and permissions → check if an Agent-equivalent role with the needed permissions exists (`view_helpdesk`, `manage_helpdesk`, `export_helpdesk_reports`, `manage_prepaid_support_hours`, `add_kb_page`, `edit_kb_page`, `delete_kb_page`, `view_email_history`); if not, New role (copy a baseline role), check the permission boxes (already confirmed live this session to be real form checkboxes, e.g. `#role_permissions_view_email_history`).
2. **Workflow** — Administration → Workflow → **"Copy workflow from"** tab, a real Redmine core UI feature (pick source tracker/role → target tracker/role(s) → Copy) — this replaces the `WorkflowRule.copy` backend call used earlier in the engagement, which won't be available on the server.
3. **Helpdesk projects** — check for Helpdesk QA Alpha / Beta (or equivalent) via Projects list; if missing, New project, enable the Helpdesk module + Support tracker via that project's own Settings → Modules/Trackers tabs.
4. **Named agents** — check Administration → Users (by login) for each fixture agent. Two cases, not one:
   - **Doesn't exist**: create via New user, set login/first/last name/email/password to our own fixture values.
   - **Already exists** (this matters specifically on Forge — `QA_CREDENTIALS_FORGE.md`'s seed-user list already contains several of these same login names, e.g. `aurora.wren`, `luna.blossom`, `briar.sunset`, `celeste.dawn`, seeded by the server's own reseed script with an unpredictable password and no guaranteed Agent role): **update** that existing user's email and password to our fixture values via Administration → Users → Edit, rather than skip it or error out.
   Either way, then ensure the user is a project Member with the Agent role (add if missing).
5. **Customers** — Helpdesk → Customers → New Customer, one per project, matching our fixture logins/emails/passwords. Same update-if-exists handling as agents applies if a customer login collides with pre-seeded data.
6. **Minimum baseline data** other suites will depend on: one Organization, one SLA, one Support Level, one Product, one Canned Response, one Holiday — enough for CRUD/validation suites to have something real to work against without over-provisioning.

Every step follows the same shape: **check via the list/search UI first, create if absent, update in place if it exists but doesn't match our fixture values** — this is what makes the script safe and correct to re-run against a freshly reseeded server.

## Phase 2 — Rework the credentials/env layer to match

- `automation/utilities/env.ts`: keep `BASE_URL` + `ADMIN_USERNAME`/`ADMIN_PASSWORD` read from environment (`.env`, sourced from whichever `QA_CREDENTIALS_*.md` is active) — that's the only externally-supplied credential now. Agent/Customer credentials stop being "read from a seed file" and become **our own fixture constants** (extending the existing `helpdesk.local.fixtures.ts` pattern — `AGENTS`, `CUSTOMERS`, shared `MAIL_PASSWORD`-style constant) that `provision.setup.ts` both creates/updates and later specs import.
- `automation/tests/auth.setup.ts`: rewritten around the plugin's real 3-tier role model — Admin, Agent (per named agent or one representative), Customer — saving `.auth/admin.json`, `.auth/agent.json`, `.auth/customer.json`. Drop the generic manager/developer/qaEngineer/client roles entirely.
- `automation/playwright.config.ts`: update the `projects` array to match (`admin`/`agent`/`client` — or keep `client` as the label for Customer to match Redmine's own role terminology), with `provision.setup.ts` and `auth.setup.ts` both matched by the existing `testMatch: /.*\.setup\.ts/` pattern so they run in order before the real projects.
- Root `QA_CREDENTIALS_LOCAL.md`: add a note (or a dedicated section) pointing at `localhost:3012` / `HELPDESK_USERS_AND_CUSTOMERS.md` as this plugin's real target, since the existing content (port 3006) is unrelated to Helpdesk testing.

## Phase 3 — Suite automation pattern (applied per suite, starting after provisioning is verified)

For each of the 12 test-case suites, in order once provisioning is solid:

1. **Manually re-confirm every TC in that suite live via Playwright MCP** first (the same real-click, real-verification approach used all session) — update each TC's Expected Result with a `CONFIRMED LIVE` note, file bugs for anything that fails. Per `CLAUDE.md` §13, **only a TC with a confirmed manual PASS gets automated** — this is not optional.
2. Write `automation/tests/<PREFIX>_<suite>.spec.ts`, one `test()` per confirmed-PASS TC, title carrying its TC ID(s) (e.g. `test('TC-HLP-109 - creating a customer flags it as a helpdesk customer', ...)`).
3. Reuse existing page objects (`HelpdeskCustomerPage`, `HelpdeskOrganizationPage`, `HelpdeskTicketListPage`, `HelpdeskSlaPage`, etc.) — extend them with new methods only where a real gap exists, following this session's already-established pattern of confirming real locators live before writing them (as just done for Prepaid Hours and Knowledgebase).
4. No raw selectors in spec files — everything goes through a page object method, per the existing convention.

## Reporting

`playwright.config.ts` already has `reporter: [['html', { open: 'never' }], ['list']]` configured — this already produces a real Playwright HTML report (`npm run report` / `npx playwright show-report`) once specs exist to populate it. No new reporter config is needed; this is the "testcase report using Playwright" the user asked for, and it's distinct from the manual-session `reports/tc-report.html`.

## First suite recommendation (once provisioning is proven)

**Customers & Organizations** — most CRUD/validation-heavy, most foundational (every other suite depends on customers/orgs existing), and already partially live-verified this session (TC-HLP-119, 240, 244, 292, 293/294). Confirm with the user before starting Phase 3, since they haven't picked a suite yet — Phase 1/2 come first regardless.

---

## Verification

- After Phase 1/2: run `npx playwright test --project=setup` against Local (`localhost:3012`) — confirm `provision.setup.ts` completes cleanly on a fresh run AND on a re-run (idempotency check — second run should create nothing new/update nothing further, only confirm existing state matches), then confirm `auth.setup.ts` produces valid `.auth/*.json` sessions.
- `npx tsc --noEmit` inside `automation/` after every file change (established convention this session).
- After the first automated suite (Phase 3): `npm test`, then `npm run report` — confirm the HTML report renders with the suite's TCs, and cross-check a couple of automated results against this session's own manual MCP findings for the same TCs to confirm the automation isn't silently passing on a broken assertion.
