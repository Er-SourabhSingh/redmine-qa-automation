# Helpdesk Agents & Customers — Local Credentials

> Full credential reference for the local email-testing environment (`redmine-docker-6`, `http://localhost:3012`) built out per `HELPDESK_EMAIL_TEST_PLAN.md`. Every account below has **two separate passwords that happen to share the same value** in this environment: the Redmine login password and the mailbox (Roundcube/IMAP/SMTP) password. Both are called out explicitly so nothing has to be inferred.
>
> Webmail: `http://127.0.0.1:8081/` — log in with the full email address as username.
> Mail domain: `test.local`.

---

## Agents (Role: Agent, id 6)

| Name | Redmine Login | Redmine Password | Email | Email Password | Project | User ID |
|---|---|---|---|---|---|---|
| Luna Blossom | `luna.blossom` | `Test@12345` | `luna.blossom@test.local` | `Test@12345` | Helpdesk QA Alpha | 9 |
| Autumn Grace | `autumn.grace` | `Test@12345` | `autumn.grace@test.local` | `Test@12345` | Helpdesk QA Alpha | 10 |
| Willow Belle | `willow.belle` | `Test@12345` | `willow.belle@test.local` | `Test@12345` | Helpdesk QA Alpha | 11 |
| Aurora Wren | `aurora.wren` | `Test@12345` | `aurora.wren@test.local` | `Test@12345` | Helpdesk QA Beta | 12 |
| Briar Sunset | `briar.sunset` | `Test@12345` | `briar.sunset@test.local` | `Test@12345` | Helpdesk QA Beta | 13 |
| Celeste Dawn | `celeste.dawn` | `Test@12345` | `celeste.dawn@test.local` | `Test@12345` | Helpdesk QA Beta | 14 |

- 3 agents per project, real Redmine Users, real mailboxes on the local Docker mail server.
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
| `beta.customer` | `Test@12345` | `beta.customer@test.local` | `Test@12345` | Helpdesk QA Beta | Beta Standard SLA | AB-L1 | Beta Org |

## Support inboxes (project-level, not a personal agent/customer account)

| Project | Email | Password | Used for |
|---|---|---|---|
| Helpdesk QA Alpha | `alpha.support@test.local` | `Test@12345` | Project's own SMTP (outgoing) + IMAP (incoming, polled by Sidekiq's `email_checker`) |
| Helpdesk QA Beta | `beta.support@test.local` | `Test@12345` | Same, for Beta |

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
