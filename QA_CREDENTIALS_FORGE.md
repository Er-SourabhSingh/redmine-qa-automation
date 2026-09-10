# QA Credentials - Forge

---

## Environment

| Configuration | Value |
|---|---|
| Application | Redmine |
| Environment | Forge |
| Base URL | `https://flux-frmka2kzh49.forge.zehntech.com/` |

---

## URL Rule

1. Forge URL changes per run.
2. Update Base URL above before every test run.
3. If Base URL is blank or placeholder, agent must ask tester for current Forge URL.

---

## Admin User

| Field | Value |
|---|---|
| Username | admin |
| Password | 12345678 (default was `admin`, forced change on new server flux-frmka2kzh49) |
| Role | Administrator |
| API Key | `<not configured>` |

---

## Forge Seed Users

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

## GitHub Test Repository

| Field | Value |
|---|---|
| Repository | `<not configured>` |
| GitHub username | `<not configured>` |
| PAT value | `<not configured>` |
| Webhook secret | `<not configured>` |

---

## GitLab Test Repository

| Field | Value |
|---|---|
| Repository | `<not configured>` |
| PAT value | `<not configured>` |
| Webhook secret | `<not configured>` |
| Redmine connection ID | 20 |

---

## Bitbucket Test Repository

| Field | Value |
|---|---|
| Repository | `<not configured>` |
| Access token | `<not configured>` |
| Webhook secret | `<not configured>` |
| Redmine connection ID | 21 |

---

## Jenkins

| Field | Value |
|---|---|
| Jenkins URL (local) | `<not configured>` |
| Jenkins URL (tunnel) | `<not configured>` |
| Jenkins job | devops-plugin-test |
| Credentials | `<not configured>` |

---

## Session Storage Rules

```
playwright/.auth/
  admin.json
  forge_user.json
```

---

## Login Validation Rules

Before test case execution:

- Verify current Forge URL is reachable
- Verify admin login
- Verify seed user login
- Verify session persistence

If authentication fails:

- Capture screenshot
- Capture console logs
- Capture network logs
- Generate authentication failure report
- Stop test case execution
