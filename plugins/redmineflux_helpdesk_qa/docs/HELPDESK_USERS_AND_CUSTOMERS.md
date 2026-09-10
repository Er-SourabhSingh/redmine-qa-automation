# Helpdesk Agents & Customers — Local Credentials

> Full credential reference for the local email-testing environment (`redmine-docker-6`, `http://localhost:3012`) built out per `HELPDESK_EMAIL_TEST_PLAN.md`. Every account below has **two separate passwords that happen to share the same value** in this environment: the Redmine login password and the mailbox (Roundcube/IMAP/SMTP) password. Both are called out explicitly so nothing has to be inferred.
>
> Webmail: `http://127.0.0.1:8081/` — log in with the full email address as username.
> Mail domain: `test.local`.

---

## ⚠ CURRENT STATE (2026-08-27, post full DB reset)

On 2026-08-27 the Local database was fully reset (`db:drop` → `db:create` → `db:migrate` → `redmine:load_default_data` → `redmine:plugins:migrate`) at explicit user request, wiping **every** fixture described below. Everything past this section (Agents, Manager fixture, BUG-HLP-014 repro fixture, Customers, mailboxes) describes the **pre-reset** environment and is kept for reference/rebuild-template purposes only — none of it currently exists on Local unless re-created.

**What actually exists on Local right now**, rebuilt via UI-only provisioning immediately after the reset:

| Entity | Value |
|---|---|
| Project | Helpdesk QA Alpha (identifier `helpdesk-qa-alpha`, Is Public unchecked, Redmineflux Helpdesk module + Support tracker enabled) |
| Role | Agent (workflow copied from Manager; permissions: `view_helpdesk`, Edit issues, Manage subtasks, Edit own notes, View private notes, Set notes as private, Log spent time, Edit own time logs — plus the Redmine defaults View/Add Issues, Add notes) |
| Agent user | `luna.blossom` / `Test@12345` / `luna.blossom@test.local` — User ID 5, project Member of Helpdesk QA Alpha with role Agent |
| SLA | Alpha Standard SLA (First Response 60 min, Resolution 480 min, working hours 09:00–17:00 UTC, Mon–Fri) |
| Support Level | L1 (Level Order 1, assignee Luna Blossom) |
| Customer | `alpha.customer` / `Test@12345` / `alpha.customer@test.local` — User ID 6, Customer ID 6, project access to Helpdesk QA Alpha / Alpha Standard SLA / L1 |
| Tickets | #1 "Unable to access customer portal after password reset", #2 "Second verification ticket for BUG-HLP-014 retest" — both created by `alpha.customer`, used to retest BUG-HLP-014 (PASS) |
| Admin | `admin` / `12345678` (password set post-reset via forced change flow) |

**Additional negative-permission fixtures created 2026-08-31** (for `HELPDESK_TICKET_LIFECYCLE.md` TC-033/034/036/040 — not real customer-facing accounts, purely for permission-boundary testing):

| Entity | Value |
|---|---|
| User | `no.perm.reporter` / `Test@12345` / `no.perm.reporter@test.local` — User ID 9. **Currently** a project Member of Helpdesk QA Alpha with role **"Agent No LogTime"** (was briefly **Reporter** for TC-033, swapped in place for TC-036 — if reused, check its current role first rather than assuming). |
| Role | **Reporter** (Redmine's built-in default) — confirmed zero helpdesk permissions checked; used to prove TC-033 (no Helpdesk tab, `/helpdesk/new` 403s for a Member with no helpdesk permission at all). |
| Role | **"Agent No LogTime"** (custom, ID 7) — `View helpdesk` checked, Redmine's `Log spent time` deliberately left unchecked, default `View Issues`/`Add issues`/`Add notes` otherwise. Built for TC-036 (confirms the reply form's Time spent block is absent without `log_time`, while the rest of the reply UI still works). Also has `View private notes` checked as of the TC-040 experiment (2026-08-31) — left in this state since the role itself is a disposable test fixture, not a real environment role; don't assume it matches Agent's own permission set if reused elsewhere. |
| Ticket fixture | #12 "TC-HLP-025 duplicate A", #13 "TC-HLP-025 duplicate B" — two genuine duplicate tickets, kept in place as ready-made fixtures for retesting **BUG-HLP-017** (Merge feature) once fixed. |

**Second project rebuilt 2026-08-27 to retest BUG-HLP-004** (needs two projects, each with its own SLA/Support Level, to test cross-project dropdown scoping):

| Entity | Value |
|---|---|
| Project | Helpdesk QA Beta (identifier `helpdesk-qa-beta`, Is Public unchecked, Redmineflux Helpdesk module enabled) |
| Agent membership | `luna.blossom` added as a Beta project Member with role Agent (in addition to her existing Alpha membership) — required because the Support Level's Support Assignees picker only offers actual project members |
| SLA | Beta Standard SLA (First Response 60 min, Resolution 480 min, Monday working day) |
| Support Level | AB-L1 (Level Order 1, assignee Luna Blossom) |

No Beta customer, no Beta tickets, no other agents/customers (`celeste.dawn`, `ivy.sterling`, `delta.customer`, `beta.customer` still don't exist) — rebuild them the same way (UI-only, admin session) if/when needed, following the same naming convention documented below. `aurora.wren` was created later this engagement — see the 2026-09-03 fixture block below.

**Additional fixtures created 2026-09-02** (for `HELPDESK_NAVIGATION_WORKSPACES.md` permission-tier testing — kept as reusable fixtures, not cleaned up):

| Entity | Value |
|---|---|
| User | `zero.perm.user` / `Test@12345` / `zero.perm.user@test.local` — User ID 15. **Zero project memberships anywhere** (deliberately never added to any project) — used to confirm "Helpdesk" is absent from the top menu for a genuinely no-permission user (TC-HLP-070). |
| User | `manage.helpdesk.test` / `Test@12345` / `manage.helpdesk.test@test.local` — User ID 16. Project Member of Helpdesk QA Alpha with the new custom role below. Used to test the Command Center/project-Helpdesk-tab experience as a real `manage_helpdesk`-holding Agent (not admin, whose `admin?` bypass could mask a permission-specific behavior). |
| Role | **"Agent ManageHelpdesk Test"** (custom, copied from Agent + `manage_helpdesk` additionally checked) — the only fixture role on this environment with `manage_helpdesk`, since `ivy.sterling` (the old Manager-role fixture with `manage_helpdesk`) did not survive the 2026-08-27 DB reset and was never recreated. |
| Product | Product id 1, "Nav Test Product" (NAVTEST) on Helpdesk QA Alpha — created since no product existed yet, used to test that a product's detail view stays in Command Center chrome when opened from the global Products list (TC-HLP-069). |
| Organization budget | "Alpha Minimal Fields Test Org" given a 10h prepaid budget on Helpdesk QA Alpha (Organization → Prepaid Support Hours → Add/top up hours) — no organization on Alpha had a budget before this, needed to confirm the project dashboard's "Prepaid Support Hours" table actually renders once real data exists (TC-HLP-067). |

**Additional fixture created 2026-09-03** (for `HELPDESK_SLA_ESCALATION.md` TC-HLP-366 — verifying escalation agent-selection when 2+ agents are eligible at the level being escalated *into*, specifically L2→L3, since no other unassigned agent existed to pair with Willow Belle at L3 — everyone else already holds L1 or L2 and a user can only hold one Support Level per project):

| Entity | Value |
|---|---|
| User | `aurora.wren` / `Test@12345` / `aurora.wren@test.local` — User ID 30. Project Member of Helpdesk QA Alpha with the Agent role. Added to Support Level **L3** alongside `willow.belle`, making L3 genuinely multi-agent for the first time (previously single-agent, Willow Belle only). No real mailbox created on the Docker mail server for this fixture — not needed, since escalation-recipient confirmation for this TC used the Sidekiq log / code-path reasoning rather than opening a live inbox. |
| Support Level | L3 now reads "Willow Belle, Aurora Wren" (2 assignees) — kept as a reusable fixture for any future multi-agent-escalation testing at L3. Confirmed: escalation into L3 always selects **Willow Belle** (User ID 11, the lower ID) — see TC-HLP-366 for the full source-level and live-behavior explanation. |

**Confirmed via this batch**: `luna.blossom`'s Agent role (`view_helpdesk` only, no `manage_helpdesk`) does NOT get the "Helpdesk" top-menu link, and only sees 3 of the project Helpdesk tab's 6 sub-tabs (Dashboard/Tickets/Knowledgebase — missing SLA/Organization/Settings) — see BUG-HLP-027 and TC-HLP-065's evidence for the full permission-tier writeup. If reusing `luna.blossom` (or `autumn.grace`/`briar.sunset`/`willow.belle`, all the same Agent role) for future Command-Center-level or SLA/Organization/Settings-tab testing, use `manage.helpdesk.test` instead — the Agent role alone is not sufficient for those screens.

---

## Agents (Role: Agent, id 6)

| Name | Redmine Login | Redmine Password | Email | Email Password | Project | User ID |
|---|---|---|---|---|---|---|
| Luna Blossom | `luna.blossom` | `Test@12345` | `luna.blossom@test.local` | `Test@12345` | Helpdesk QA Alpha | 9 |
| Autumn Grace | `autumn.grace` | `Test@12345` | `autumn.grace@test.local` | `Test@12345` | Helpdesk QA Alpha | 10 |
| Willow Belle | `willow.belle` | `Test@12345` | `willow.belle@test.local` | `Test@12345` | Helpdesk QA Alpha | 11 |
| Aurora Wren | `aurora.wren` | `Test@12345` | `aurora.wren@test.local` | `Test@12345` | Helpdesk QA Beta | 12 |
| Briar Sunset | `briar.sunset` | `Test@12345` | `briar.sunset@test.local` | `Test@12345` | Helpdesk QA Alpha (**not** Beta — see 2026-09-01 note below) | 13 |
| Celeste Dawn | `celeste.dawn` | `Test@12345` | `celeste.dawn@test.local` | `Test@12345` | Helpdesk QA Beta | 14 |

- 3 agents per project, real Redmine Users, real mailboxes on the local Docker mail server.
- **2026-09-01 update**: `autumn.grace`, `briar.sunset`, and `willow.belle` were (re-)created/added as **Helpdesk QA Alpha** project Members with role Agent to build a real 3-level SLA escalation chain for `HELPDESK_SLA_ESCALATION.md` testing — see that suite and `HELPDESK_MEMORY.md`'s 2026-09-01 section for the full chain (L1 Luna Blossom → L2 Autumn Grace + Briar Sunset (multi-agent) → L3 Willow Belle → admin fallback). `briar.sunset` is currently an Alpha Member, **not** Beta as the table previously implied — verify her actual current membership before relying on this table if Beta-side testing is resumed, since her membership may have moved sessions.
- **2026-09-01 update**: the Redmine `admin` user's Mail field was found still set to the out-of-the-box placeholder `admin@example.net`, which silently broke Critical Breach Alert email delivery — fixed to the real `admin@test.local` via Administration → Users → admin → Edit. **This will not survive a future full DB reset** — re-check/re-set it as part of any future environment rebuild, same class of gotcha as the Host name/path setting (see `feedback_email_testing_host_name_precondition` memory).
- Login to Redmine at `http://localhost:3012/login` with the Redmine Login/Password columns.
- Login to webmail at `http://127.0.0.1:8081/` with the Email/Email Password columns.

## Scoped Manager fixture (Role: Manager, id 3)

| Name | Redmine Login | Redmine Password | Email | Project (ONLY) | Permissions |
|---|---|---|---|---|---|
| Ivy Sterling | `ivy.sterling` | `Test@12345` | `ivy.sterling@test.local` | Helpdesk QA Alpha only | `manage_helpdesk`, `export_helpdesk_reports`, `manage_prepaid_support_hours`, `view_helpdesk`, `view_email_history` |

- Created 2026-08-27 specifically to unblock TC-HLP-121 (project-scoped-manager isolation testing) — the pre-existing "Manager" role had zero Helpdesk permissions checked until this session added them.
- **Deliberately NOT a Member of Helpdesk QA Beta** — verified via Administration → Users → `ivy.sterling` → Projects tab (exactly one membership row). This single-project scoping is the entire point of the fixture; do not add a Beta membership to this user.
- No mailbox created for this fixture (not needed — TC-121 is a permission-scoping test, not an email test).

## BUG-HLP-014 repro fixture

| Login | Redmine Password | Email | Project | SLA | Support Level | Organization | User ID | Customer ID |
|---|---|---|---|---|---|---|---|---|
| `delta.customer` | `Test@12345` | `delta.customer@test.local` | Helpdesk QA Alpha | Alpha Standard SLA | L1 | None | 19 | 19 |

- Created 2026-08-27 specifically to confirm BUG-HLP-014 (customer's own Tickets list shows 0 tickets) generalizes beyond `alpha.customer` — it does. Has one real ticket, **#77**, and zero Redmine Memberships (by design — see `bugs/open/BUG-HLP-014.md` Root Cause).
- No mailbox created for this fixture (not needed for this repro).

## Customers (real Customer records)

| Login | Redmine Password | Email | Email Password | Project | SLA | Support Level | Organization |
|---|---|---|---|---|---|---|---|
| `alpha.customer` | `Test@12345` | `alpha.customer@test.local` | `Test@12345` | Helpdesk QA Alpha | Alpha Standard SLA | L1 | Alpha Org |
| `beta.customer` | `Test@12345` | `beta.customer@test.local` | `Test@12345` | **Two rows, order matters (see addendum below) — currently Helpdesk QA Beta (first/lower-ID, Beta Standard SLA / AB-L1) + Helpdesk QA Alpha (second, Alpha Standard SLA / L1 / Alpha Minimal Fields Test Org)** | — | — |
| `delta.customer` | `Test@12345` | `delta.customer@test.local` | (no mailbox account exists on the mail server) | **Two rows** — Helpdesk QA Alpha (first, Alpha Standard SLA / L2 / Alpha Minimal Fields Test Org) + Helpdesk QA Beta (second, Beta Standard SLA / AB-L1) | — | — |
| `retest.customer1` | `Test@12345` | `retest.customer1@test.local` | (no mailbox created) | Helpdesk QA Alpha | Alpha Escalation Test SLA | L2 (Customer ID 7 — was temporarily flipped to L3 and back 2026-09-01 for an admin-email verification, see `HELPDESK_MEMORY.md`) | None |

**Rebuilt 2026-09-09 for TC-HLP-402 (email-to-project routing, BUG-HLP-045)**: `beta.customer` did not previously exist as a Redmine record on this instance (only her mailbox account survived from an earlier rotation) — recreated fresh as customer id 32, this time deliberately with **two** project-access rows (Alpha first, Beta second) rather than Beta-only, specifically to test whether an email sent to Beta's own mailbox lands on Beta or gets misrouted to her first row (Alpha) — confirmed live it's the latter, a real bug. `delta.customer` also gained a second (Beta) row during initial troubleshooting, before discovering she has no real mailbox account on the mail server (unlike `beta.customer`) and so can't be used to send real test email — kept in place regardless as a second, harmless multi-project fixture. **`beta.customer` is the one with a real, working mailbox — use her, not `delta.customer`, for any future email-sending test that needs a multi-project customer.**

**Follow-up control test, same day**: to confirm BUG-HLP-045 is specific to multi-project entitlement (not a blanket "always defaults to Alpha" defect), `beta.customer`'s Alpha row was temporarily removed (leaving her Beta-only) — a fresh email to `beta.support@test.local` then correctly routed to Beta (ticket #63), confirming single-project routing works fine. Her Alpha row was added back afterward, but since her original Beta row was never deleted (only Alpha's was), **the row order is now the reverse of the original setup**: Beta is her first/lower-ID row, Alpha her second. Don't assume "Alpha first" if reusing this fixture — check live which row actually comes first before relying on it for a routing test.

## Support inboxes (project-level, not a personal agent/customer account)

| Project | Email | Password | Used for |
|---|---|---|---|
| Helpdesk QA Alpha | `alpha.support@test.local` | `Test@12345` | Project's own SMTP (outgoing) + IMAP (incoming, polled by Sidekiq's `email_checker`) |
| Helpdesk QA Beta | `beta.support@test.local` | `Test@12345` | Same, for Beta — **the Redmine-side Email Configuration for this was only actually wired up 2026-09-09** (see addendum below); the mailbox account itself existed on the mail server earlier but Beta's `RfHelpdeskEmailConfig` row did not exist until then, so Beta was never actually polled before this date despite this table listing the mailbox. |

### Addendum — Beta Email Configuration wired up, `beta.customer` recreated as a genuine multi-project customer (2026-09-09, for TC-HLP-402 / BUG-HLP-045)

Confirmed live before this date: Helpdesk QA Beta had **zero** `RfHelpdeskEmailConfig` row (`RfHelpdeskEmailConfig.for_project(beta) == nil`), and `beta.customer` did not exist as a Redmine `User`/Customer record at all (only her mailbox account survived on the mail server from an earlier rotation). Both fixed via the real UI:

- **Beta's Email Configuration** (Helpdesk → Helpdesk Settings → Email Configuration → Helpdesk QA Beta) now has real outgoing (SMTP) and incoming (IMAP) settings pointing to `beta.support@test.local` / `Test@12345`, Identifier Keywords `ticket, issue, request`, matching Alpha's pattern. Auto Close Ticket Days left blank (disabled).
- **`beta.customer`** recreated (customer id 32), this time deliberately with **two** project-access rows rather than one: Alpha first (Alpha Standard SLA / L1 / Alpha Minimal Fields Test Org), Beta second (Beta Standard SLA / AB-L1) — built specifically to test cross-project email routing (see BUG-HLP-045). She is the customer to use for any future email-sending test needing multi-project entitlement, since her mailbox genuinely works.
- `delta.customer` also picked up a second (Beta) project-access row during initial troubleshooting of this same investigation, before discovering she has no real mailbox account on the mail server — kept in place as a secondary, harmless multi-project fixture, but she can't send real test email; use `beta.customer` instead for that.

## Other mailboxes on the same mail server (not Helpdesk-specific)

| Email | Password | Purpose |
|---|---|---|
| `admin@test.local` | `Test@12345` | Redmine admin's registered email (core outbound SMTP sender / test-email recipient) |
| `qa@test.local` | `Test@12345` | Spare / earlier general-purpose test account |
| `developer@test.local` | `Test@12345` | Spare / earlier general-purpose test account |
| `customer@test.local` | `Test@12345` | Spare / earlier general-purpose test account |

---

## Machine-readable copy

`automation/testdata/helpdesk.local.fixtures.ts` exports the same data as typed constants (`AGENTS`, `CUSTOMERS`, `PROJECTS`, `MAIL_PASSWORD`) for automation specs to import instead of hardcoding — keep both files in sync manually if either changes.

## Notes

- Every password here is `Test@12345` — a throwaway fixture value for this local-only environment, not a real secret.
- Redmine admin account: `admin` / `12345678` (separate password, see `HELPDESK_EMAIL_TEST_PLAN.md` §2).
- None of these accounts exist on Forge — this file is Local-environment only. Forge's own seed users/customers are documented separately in `automation/testdata/helpdesk.fixtures.ts` and `HELPDESK_TESTDATA_FORGE.xlsx`.
