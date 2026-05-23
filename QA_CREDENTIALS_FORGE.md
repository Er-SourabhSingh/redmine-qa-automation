# QA Credentials - Forge

> ACTUAL VALUES ARE IN `QA_CREDENTIALS_PRIVATE.txt` (gitignored — local only).
> This file contains placeholders only and is safe to commit.

---

## Environment

| Configuration | Value |
|---|---|
| Application | Redmine |
| Environment | Forge |
| Base URL | `<see QA_CREDENTIALS_PRIVATE.txt>` |

---

## URL Rule

1. Forge URL changes per run.
2. Update Base URL in `QA_CREDENTIALS_PRIVATE.txt` before every test run.
3. If Base URL is blank or placeholder, agent must ask tester for current Forge URL.

---

## Admin User

| Field | Value |
|---|---|
| Username | admin |
| Password | `<see QA_CREDENTIALS_PRIVATE.txt>` |
| Role | Administrator |
| API Key | `<see QA_CREDENTIALS_PRIVATE.txt>` |

---

## Forge Seed Users

| Username | Password | Role |
|---|---|---|
| luna.blossom | `<see private file>` | Test User |
| daisy.skye | `<see private file>` | Test User |
| autumn.grace | `<see private file>` | Test User |
| willow.belle | `<see private file>` | Test User |
| harmony.rose | `<see private file>` | Test User |
| summer.rain | `<see private file>` | Test User |
| violet.ember | `<see private file>` | Test User |
| celeste.dawn | `<see private file>` | Test User |
| serenity.bloom | `<see private file>` | Test User |
| nova.starling | `<see private file>` | Test User |
| aurora.wren | `<see private file>` | Test User |
| ivy.skylark | `<see private file>` | Test User |
| luna.meadow | `<see private file>` | Test User |
| sage.willow | `<see private file>` | Test User |
| marigold.rayne | `<see private file>` | Test User |
| ember.lilac | `<see private file>` | Test User |
| opal.sparrow | `<see private file>` | Test User |
| briar.sunset | `<see private file>` | Test User |
| selene.frost | `<see private file>` | Test User |
| isla.moon | `<see private file>` | Test User |

---

## GitHub Test Repository

| Field | Value |
|---|---|
| Repository | `<see QA_CREDENTIALS_PRIVATE.txt>` |
| GitHub username | `<see QA_CREDENTIALS_PRIVATE.txt>` |
| PAT value | `<see QA_CREDENTIALS_PRIVATE.txt>` |
| Webhook secret | `<see QA_CREDENTIALS_PRIVATE.txt>` |

---

## GitLab Test Repository

| Field | Value |
|---|---|
| Repository | `<see QA_CREDENTIALS_PRIVATE.txt>` |
| PAT value | `<see QA_CREDENTIALS_PRIVATE.txt>` |
| Webhook secret | `<see QA_CREDENTIALS_PRIVATE.txt>` |
| Redmine connection ID | 20 |

---

## Bitbucket Test Repository

| Field | Value |
|---|---|
| Repository | `<see QA_CREDENTIALS_PRIVATE.txt>` |
| Access token | `<see QA_CREDENTIALS_PRIVATE.txt>` |
| Webhook secret | `<see QA_CREDENTIALS_PRIVATE.txt>` |
| Redmine connection ID | 21 |

---

## Jenkins

| Field | Value |
|---|---|
| Jenkins URL (local) | `<see QA_CREDENTIALS_PRIVATE.txt>` |
| Jenkins URL (tunnel) | `<see QA_CREDENTIALS_PRIVATE.txt>` |
| Jenkins job | devops-plugin-test |
| Credentials | `<see QA_CREDENTIALS_PRIVATE.txt>` |

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
