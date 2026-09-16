# Test Plan & Strategy — Redmineflux Helpdesk

> The master reference for how this plugin is tested. Read this before starting any new testing session, alongside `HELPDESK_HANDOFF.md` (session-to-session state) and `HELPDESK_MEMORY.md` (accumulated quirks/findings). `HELPDESK_EMAIL_TEST_PLAN.md` is a focused sub-plan under this one, specific to the email/Sidekiq work on the local environment.

---

## 1. Objective

Verify the Redmineflux Helpdesk plugin's 54 documented features (`HELPDESK_FEATURES_LIST.md`, categories A–K) work correctly across functional, permission, workflow, negative, UI, and multi-language dimensions, on every supported Redmine version, and build a regression-safety net (Playwright automation) for behavior once it's confirmed working — so future plugin changes can be re-verified quickly instead of manually from scratch every time.

---

## 2. Scope

### In scope

- **Functional testing** — every feature in `HELPDESK_FEATURES_LIST.md` (A. Setup through K. Rake tasks).
- **Permission testing** — the 7-permission set (`view_helpdesk`, `manage_helpdesk`, `export_helpdesk_reports`, `manage_prepaid_support_hours`, `add_kb_page`, `edit_kb_page`, `delete_kb_page`) across role combinations, including negative cases (a role with none of them).
- **Workflow testing** — ticket status lifecycle (New → In Progress → Waiting for Customer Response → Resolved → Feedback → Closed → Rejected), SLA start/pause/resume/breach/escalation lifecycle, prepaid-hours consumption/enforcement lifecycle.
- **Negative testing** — invalid input, duplicate-name rejection, cross-project data leakage, unauthorized access attempts.
- **UI validation** — field validations, list filters/search/column pickers, dashboard KPIs, restricted customer views.
- **Email testing** — outbound notifications (per-project SMTP) and inbound email-to-ticket/reply-to-note (per-project IMAP via Sidekiq's `email_checker` job). See `HELPDESK_EMAIL_TEST_PLAN.md` for the detailed sub-plan.
- **Multi-language testing** — plugin UI strings under non-English Redmine locales (not yet started — see Open Items).
- **Regression** — via the `automation/` Playwright + TypeScript suite, once a test case has a confirmed manual PASS (per `CLAUDE.md` §13).

### Out of scope

- Redmine core functionality not modified by this plugin (tested only incidentally, where the plugin touches it — e.g. issue statuses, project modules).
- Load/performance testing.
- Security penetration testing (beyond permission-boundary functional checks already in scope).
- Real external email delivery (Gmail, other real providers) — deliberately excluded per the local mail server's original design constraint (see root `MEMORY.md` / `reference_docker_mail_server` memory); all email testing uses the local Docker mail server or Forge's own sandbox, never a real inbox.

---

## 3. Redmine Versions

Supported per the plugin's own documentation: **5.0.x, 5.1.x, 6.0.x, 6.1.x**. Testing to date has run on:

| Version | Where | Status |
|---|---|---|
| 6.x (Forge-hosted, exact point release varies by rotation) | Forge | Primary execution environment to date — 8 sessions, 6 bugs found |
| 6 (`redmine-docker-6`, local Docker) | Local | Newly stood up 2026-08-25/26 specifically for email/Sidekiq testing (real mail server access Forge can't provide) |

Not yet tested on: 5.0.x, 5.1.x, 6.1.x. No local containers exist for those versions yet under this QA repo (only `redmine-docker-5`, `-6`, `-700` exist on the host per `docker ps`, and only `-6` has this plugin installed).

---

## 4. Environments

### 4.1 Forge

- Base URL rotates per run — always re-verify the current value before starting (see the Forge row under `QA_CREDENTIALS.md`'s **Known Environments** section).
- Cannot receive or send real email (no route to any real inbox, including this project's own local Docker mail server) — this is *why* the local environment exists as a second track. Email-flow test cases must run on Local, not Forge.
- Primary environment for everything else — richest test data built up here across 8 sessions (2 Organizations, 4 SLAs, 5 Support Levels across 2 escalation chains, 4 Products, 4 Canned Responses, 4 Customers, Support Packages + Prepaid Budgets). See `HELPDESK_TESTDATA_FORGE.xlsx` and `automation/testdata/helpdesk.fixtures.ts` for the exact current roster.
- Data does **not** survive a Forge rotation — treat every new Forge URL as a fresh instance; the fixtures above describe "the current rotation," not a permanent state.

### 4.2 Local

- `http://localhost:3012` (container `redmine-docker-6-redmine-1`) — the only local container with this plugin installed.
- The only environment where real inbound/outbound email can be tested end-to-end, via the local Docker mail server (`local-mail-server` / `local-mail-webmail`, domain `test.local`).
- Redis + Sidekiq are **not started automatically** and must be started manually every session (detached `docker exec`) — see `HELPDESK_EMAIL_TEST_PLAN.md` §3 for the exact commands. This is the single most likely thing to be silently wrong at the start of a new session on this environment.
- Was reset to a clean slate (0 projects, 0 non-admin users, 0 custom fields) on 2026-08-25 and rebuilt specifically for the email-testing project/agent/customer matrix — see `HELPDESK_EMAIL_TEST_PLAN.md` for its current data.
- `QA_CREDENTIALS_LOCAL.md`'s Base URL field still says `localhost:3006`, which is stale/never valid for this container — needs correcting to `localhost:3012` (tracked in Open Items below, not yet fixed since that file also carries other local containers' credentials that shouldn't be blindly overwritten).

---

## 5. Preconditions (both environments)

Before executing **any** test case:

1. Confirm the target environment's base URL is reachable (Forge: re-check current rotation URL; Local: confirm `localhost:3012` responds).
2. Confirm admin login works.
3. Confirm the Helpdesk module is enabled on the project(s) under test.
4. Confirm **Administration → Settings → General → Host name and path** matches the real host:port being tested — required before any test that involves an email link, on every environment, every session (see root `MEMORY.md` "Email Testing Preconditions").
5. **Local only:** confirm Redis and Sidekiq are running (`ps aux | grep -E 'redis|sidekiq'` inside the container) before any test that depends on background jobs (SLA monitor, email poller, auto-close) — neither survives a container restart.
6. Confirm the environment's test-data registry (`automation/testdata/HELPDESK_TESTDATA_<ENV>.xlsx`) reflects current reality — re-verify rather than trust a stale row, especially after a Forge rotation.

---

## 6. Test Data Strategy

- One `.xlsx` registry per environment (`HELPDESK_TESTDATA_FORGE.xlsx`, `HELPDESK_TESTDATA_LOCAL.xlsx`) tracking what currently exists on that specific server — see `CLAUDE.md` §13a for the full convention (Status column legend, update-immediately rule, ticket-ID volatility warning).
- One TypeScript fixtures file per environment for automation to import typed constants from, kept in manual sync with its `.xlsx` counterpart: `automation/testdata/helpdesk.fixtures.ts` (Forge), `automation/testdata/helpdesk.local.fixtures.ts` (Local).
- Never hardcode a ticket number, and never assume a fixture from one environment exists on the other — a Forge rotation or a local reset invalidates prior assumptions instantly.
- Test personas follow a consistent naming pattern across both environments where possible (flower-themed names — Luna Blossom, Aurora Wren, etc. — borrowed originally from Forge's seed user list) so cross-environment findings stay easy to cross-reference, without implying the underlying accounts are actually shared (they are not — separate Users on separate servers).

---

## 7. Test Case Inventory

227 test cases across 12 suite files in `testcases/`, one suite per feature-list category grouping, all traceable back to a specific line in `HELPDESK_USER_GUIDE.md`:

| Suite file | Features covered | TC range |
|---|---|---|
| `HELPDESK_PLUGIN_INSTALLATION.md` | A. Setup & prerequisites (#1–4) | TC-001–012 |
| `HELPDESK_NAVIGATION_WORKSPACES.md` | B. Navigation/workspaces (#5–8) + filter/KPI gap-closure TCs | TC-060–074, 274–275 |
| `HELPDESK_TICKET_LIFECYCLE.md` | C. Tickets — core (#9–17) | TC-013–041 |
| `HELPDESK_TICKET_LIST_FILTERS_COLUMNS.md` | C. Tickets — list/filters (#18–21) | TC-042–059 |
| `HELPDESK_SLA_ESCALATION.md` | D. SLA/service levels (#22–32) + filter gap-closure TCs | TC-075–107, 276–278 |
| `HELPDESK_CUSTOMERS_ORGANIZATIONS.md` | E. Customers & organizations (#33–37) + filter/scoping gap-closure TCs | TC-108–124, 279–280, 283–284 |
| `HELPDESK_PREPAID_HOURS.md` | F. Billing — prepaid hours (#38–40) | TC-125–142 |
| `HELPDESK_EMAIL.md` | G. Email (#41–44) | TC-143–156 |
| `HELPDESK_CONTENT_TEMPLATES.md` | H. Content & templates (#45–47) + filter/scoping gap-closure TCs | TC-157–180, 281–282, 285 |
| `HELPDESK_REPORTING_AUTOMATION.md` | I. Reporting & automation (#48–51) | TC-181–203 |
| `HELPDESK_PERMISSIONS.md` | J. Permissions (#52–53) | TC-204–214 |
| `HELPDESK_RAKE_TASKS.md` | K. Rake tasks (#54) | TC-215–227 |

All 227 were written before any execution began (2026-08-21). Execution has been partial and Forge-only to date — see §10 Current Status.

---

## 8. Automation Strategy

- Framework: Playwright + TypeScript, self-contained under `automation/` (see `CLAUDE.md` §13 for full conventions: POM, fixtures, credential loading via `env.ts`, file naming).
- **Rule: only automate a TC after it has a confirmed manual PASS.** Automation locks in verified behavior; it is not how new behavior gets discovered.
- Status as of this plan: all 17 page objects exist and compile clean (`npx tsc --noEmit`), rewired to click through real navigation rather than `page.goto()`-only shortcuts (2026-08-25 refactor). **Zero `.spec.ts` files exist yet.** Writing the first real specs is the next major automation milestone, planned against the Forge test-data matrix built the same session (SLA/Support Level/Product/Customer suites first, since those page objects and that data were both freshly verified together).
- Two distinct regression triggers govern when automation must run (not just when it's convenient) — see `CLAUDE.md` §13 "Two regression triggers" and `SENIOR_QA_STANDARDS.md` §26/§27: a bug retested as FIXED (scoped regression) vs. `bugs/open/` reaching empty (full-plugin regression, required before `STATUS.md` can say `Complete`).

---

## 9. Defect Management

- Bug ID format: `BUG-HLP-NNN` (code `HLP` per `CLAUDE.md` §4).
- Filed to `bugs/open/<ID>.md` using `templates/bug-template.md`; check `bugs/_duplicates.md` and `bugs/_index.md` first, always.
- Screenshots only for bugs (never routine PASS evidence), embedded in the bug file per `CLAUDE.md` §6.
- **Current state (see `bugs/_index.md`): 6 open, 0 closed** — all found on Forge, none yet retested on Local or against a fix:

| Bug | Severity | One-line summary |
|---|---|---|
| BUG-HLP-001 | Medium | New Customer form's Login field shows a stuck validation message unrelated to actual outcome |
| BUG-HLP-002 | Low (re-scoped as a symptom of BUG-HLP-005) | Escalation To dropdown unscoped only via BUG-HLP-005's bypass route |
| BUG-HLP-003 | High | Active checkbox can't be unchecked via Edit on Organization/SLA/Canned Response; Canned Response has no workaround at all |
| BUG-HLP-004 | Low | Customer form's cross-project SLA/Support Level options are disabled but not hidden (CSS defeats the plugin's own `hidden` attribute) |
| BUG-HLP-005 | Medium | SLA/Support Level have unlinked global bypass routes; for SLA this produces a permanently orphaned record |
| BUG-HLP-006 | **Critical** | Customer cannot open their own ticket — the link targets `/issues/:id`, which the Customer role can't access |

- **Unresolved investigation, not yet filed as a bug**: whether a paused SLA can ever resume once BUG-HLP-006 blocks the customer's own reply path — the working theory is that an *email* reply (not the blocked portal reply) is the intended resume mechanism, which is exactly what the local email-testing track (§4.2, `HELPDESK_EMAIL_TEST_PLAN.md`) exists to answer. See `HELPDESK_MEMORY.md` "Recurring Issues" for the full SLA lifecycle finding.

---

## 10. Current Status Summary

*(Snapshot as of 2026-08-26 — always prefer `HELPDESK_HANDOFF.md`'s Run History table over this section for anything more recent.)*

- Docs complete: `HELPDESK_REQUIREMENTS.md`, `HELPDESK_FEATURES_LIST.md` (54 features), `HELPDESK_USER_GUIDE.md`.
- All 227 test cases written across 12 suites; execution has covered a meaningful subset on Forge (CRUD verification for Organization/SLA/Support Level/Holiday/Customer/Product/Canned Response, multi-project customer access, ticket reply/SLA-start/auto-assign flow) but **not** a full pass through every suite yet.
- 6 bugs open, 0 closed — none yet retested.
- Automation framework infrastructure complete; zero specs written.
- Local environment newly built out (2026-08-25/26) specifically to unblock email/Sidekiq testing, which Forge structurally cannot support. Currently blocked on Support Level's "Support Assignees" widget appearing to render with zero options (see `HELPDESK_EMAIL_TEST_PLAN.md` §6) — needs root-causing before Customer records (and therefore customer-initiated ticket flows) can be created on Local.
- Multi-language testing: not started.

---

## 11. Open Items / Risks

- **Support Level widget on Local renders empty** — blocks Customer creation on Local, in turn blocking every customer-initiated email test case. Highest-priority next step for the email track.
- **SLA-resume mechanism unconfirmed** — see §9's unresolved investigation. This could turn out to be a 7th bug (possibly tied to or superseding BUG-HLP-006) once the email-reply path is actually tested.
- **`QA_CREDENTIALS_LOCAL.md`'s Base URL is stale** (`localhost:3006`, never valid for `redmine-docker-6`) — correct it without disturbing other local containers' credentials also recorded in that file.
- **No test execution yet on Redmine 5.0.x, 5.1.x, or 6.1.x** — only 6.x has been exercised, on both Forge and Local.
- **Multi-language testing not started** — in scope per `HELPDESK_SCOPE.md` but zero test cases written or executed against a non-English locale yet.
- **Forge data is ephemeral** — every rotation invalidates the previous session's fixtures; the test-data matrix described in §6/§10 is real only for whichever Forge URL is current when read, not a permanent baseline.
