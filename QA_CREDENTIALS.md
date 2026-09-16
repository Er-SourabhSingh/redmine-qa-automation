# QA Credentials

> Single, common source of truth for reusable QA login credentials — used across all plugins and environments. Do not create a per-environment or per-plugin credentials file; add new roles/users here instead, and never duplicate credentials elsewhere. This file intentionally holds no repository, Git, or CI/CD configuration — only login credentials.
>
> Plugin-specific fixture registries (e.g. a plugin's own `automation/testdata/`, or a `docs/*_USERS_AND_CUSTOMERS.md`) are a separate concern — see `CLAUDE.md` §13a — and are not affected by this file. Use this file for the shared accounts below; use a plugin's own fixture registry for accounts/data that only make sense within that plugin's own testing (e.g. Helpdesk's dedicated agents/customers).

---

## Known Environments

| Environment | Base URL | Notes |
|---|---|---|
| Local Docker (default) | `http://localhost:3006` | Default local environment for the users below. |
| Forge | *(rotates per run)* | Cloud-hosted; the URL changes on every rotation — ask the tester for the current URL before testing, and re-verify Admin's password there (a freshly-provisioned instance can force a password change, so don't assume the value below still holds without checking). |

The Seed Users below are shared across BOTH Local and Forge — the same set of names/logins is reused for testing on either environment (not Forge-only), so treat them as one common pool.

Individual plugins may also run against their own dedicated local instance (a different port, with its own seeded projects/users) — that is documented in the plugin's own `docs/` folder, not here.

---

## Authentication Rules

1. Always use the existing configured users below — do not create random/ad hoc users.
2. Reuse a valid authentication session where possible.
3. Regenerate an expired session automatically.
4. Stop test execution if login fails.
5. Capture a screenshot and console/network logs on authentication failure.

---

## Admin User

| Username | Password | Role |
|---|---|---|
| admin | 12345678 | Administrator |

---

## Seed Users

A shared pool of persona names/logins, reused across both Local and Forge testing wherever a plugin needs several interchangeable test accounts (e.g. as a naming convention for a plugin's own dedicated fixtures — see `CLAUDE.md` §13a). One common password for all of them, everywhere — including a plugin's own dedicated fixtures built from this pool (e.g. the Redmineflux Helpdesk plugin's `MAIL_PASSWORD` fixture constant) — so an already-seeded environment never needs its password force-updated to match a plugin-specific value.

| Username | Password | Role |
|---|---|---|
| luna.blossom | 12345678 | Test User |
| daisy.skye | 12345678 | Test User |
| autumn.grace | 12345678 | Test User |
| willow.belle | 12345678 | Test User |
| harmony.rose | 12345678 | Test User |
| summer.rain | 12345678 | Test User |
| violet.ember | 12345678 | Test User |
| celeste.dawn | 12345678 | Test User |
| serenity.bloom | 12345678 | Test User |
| nova.starling | 12345678 | Test User |
| aurora.wren | 12345678 | Test User |
| ivy.skylark | 12345678 | Test User |
| luna.meadow | 12345678 | Test User |
| sage.willow | 12345678 | Test User |
| marigold.rayne | 12345678 | Test User |
| ember.lilac | 12345678 | Test User |
| opal.sparrow | 12345678 | Test User |
| briar.sunset | 12345678 | Test User |
| selene.frost | 12345678 | Test User |
| isla.moon | 12345678 | Test User |

---

## Session Storage Rules

```
playwright/.auth/
  admin.json
  <seed-user-login>.json   e.g. luna.blossom.json
```

---

## Login Validation Rules

Before test case execution:

- Verify the target environment is reachable.
- Verify the login page is accessible.
- Verify credentials work successfully.
- Verify session persistence.
- Verify role permissions after login.

If authentication fails:

- Capture a screenshot and console/network logs.
- Generate an authentication failure report.
- Stop test case execution.
