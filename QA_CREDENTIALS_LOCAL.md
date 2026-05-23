# QA Credentials - Local

> ACTUAL VALUES ARE IN `QA_CREDENTIALS_PRIVATE.txt` (gitignored — local only).
> This file contains placeholders only and is safe to commit.

---

## Environment

| Configuration | Value |
|---|---|
| Application | Redmine |
| Environment | Local Docker |
| Base URL | `<see QA_CREDENTIALS_PRIVATE.txt>` |

---

## Authentication Rules

1. Always use existing configured users
2. Reuse valid authentication sessions
3. Do not create random users
4. Regenerate expired sessions automatically
5. Stop execution if login fails
6. Capture screenshot and logs on authentication failure

---

## Admin User

| Field | Value |
|---|---|
| Username | `<see QA_CREDENTIALS_PRIVATE.txt>` |
| Password | `<see QA_CREDENTIALS_PRIVATE.txt>` |
| Role | Administrator |

---

## QA Engineer Users

| Username | Password | Role |
|---|---|---|
| priya.patel | `<see private file>` | QA Engineer |
| neha.joshi | `<see private file>` | QA Engineer |

---

## Developer Users

| Username | Password | Role |
|---|---|---|
| aman.verma | `<see private file>` | Developer |
| rohit.mehta | `<see private file>` | Developer |

---

## Manager Users

| Username | Password | Role |
|---|---|---|
| rahul.sharma | `<see private file>` | Manager |
| sneha.kapoor | `<see private file>` | Manager |

---

## Client User

| Username | Password | Role |
|---|---|---|
| client.demo | `<see private file>` | Client |

---

## GitHub Test Repository

| Field | Value |
|---|---|
| Repository | `<see QA_CREDENTIALS_PRIVATE.txt>` |
| GitHub username | `<see QA_CREDENTIALS_PRIVATE.txt>` |
| PAT value | `<see QA_CREDENTIALS_PRIVATE.txt>` |
| Redmine connection ID | 1 (flux-erp-system) |

---

## GitLab Test Repository

| Field | Value |
|---|---|
| Repository | `<see QA_CREDENTIALS_PRIVATE.txt>` |
| PAT value | `<see QA_CREDENTIALS_PRIVATE.txt>` |
| Redmine connection ID | 2 (flux-erp-system) |

---

## Bitbucket Test Repository

| Field | Value |
|---|---|
| Repository | `<see QA_CREDENTIALS_PRIVATE.txt>` |
| Workspace | sourabhworkspace |
| Redmine connection ID | 3 (flux-erp-system) |

---

## Jenkins

| Field | Value |
|---|---|
| Jenkins URL (local) | `<see QA_CREDENTIALS_PRIVATE.txt>` |
| Jenkins URL (tunnel) | `<see QA_CREDENTIALS_PRIVATE.txt>` |
| Credentials | `<see QA_CREDENTIALS_PRIVATE.txt>` |

---

## Cloudflare Tunnel

| Field | Value |
|---|---|
| Tunnel URL | `<see QA_CREDENTIALS_PRIVATE.txt>` |
| Restart command | `<see QA_CREDENTIALS_PRIVATE.txt>` |

---

## Test Project (DevOps)

| Field | Value |
|---|---|
| Project | Flux ERP System |
| Project identifier | `flux-erp-system` |
| DevOps module | Enabled |
| GitHub connection | ID 1 — connected |
| GitLab connection | ID 2 — connected |
| Bitbucket connection | ID 3 — connected |

---

## Session Storage Rules

```
playwright/.auth/
  admin.json
  manager.json
  developer.json
  qa_engineer.json
  client.json
```

---

## Login Validation Rules

Before test case execution:

- Verify local server is running
- Verify login page accessibility
- Verify credentials work successfully
- Verify session persistence
- Verify role permissions after login
