# QA Credentials - Local

---

## Environment

| Configuration | Value |
|---|---|
| Application | Redmine |
| Environment | Local Docker |
| Base URL | `http://localhost:3006` |

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
| Username | admin |
| Password | 12345678 |
| Role | Administrator |

---

## QA Engineer Users

| Username | Password | Role |
|---|---|---|
| priya.patel | 12345678 | QA Engineer |
| neha.joshi | 12345678 | QA Engineer |

---

## Developer Users

| Username | Password | Role |
|---|---|---|
| aman.verma | 12345678 | Developer |
| rohit.mehta | 12345678 | Developer |

---

## Manager Users

| Username | Password | Role |
|---|---|---|
| rahul.sharma | 12345678 | Manager |
| sneha.kapoor | 12345678 | Manager |

---

## Client User

| Username | Password | Role |
|---|---|---|
| client.demo | 12345678 | Client |

---

## GitHub Test Repository

| Field | Value |
|---|---|
| Repository | `<not configured>` |
| GitHub username | `<not configured>` |
| PAT value | `<not configured>` |
| Redmine connection ID | 1 (flux-erp-system) |

---

## GitLab Test Repository

| Field | Value |
|---|---|
| Repository | `<not configured>` |
| PAT value | `<not configured>` |
| Redmine connection ID | 2 (flux-erp-system) |

---

## Bitbucket Test Repository

| Field | Value |
|---|---|
| Repository | `<not configured>` |
| Workspace | sourabhworkspace |
| Redmine connection ID | 3 (flux-erp-system) |

---

## Jenkins

| Field | Value |
|---|---|
| Jenkins URL (local) | `<not configured>` |
| Jenkins URL (tunnel) | `<not configured>` |
| Credentials | `<not configured>` |

---

## Cloudflare Tunnel

| Field | Value |
|---|---|
| Tunnel URL | `<not configured>` |
| Restart command | `<not configured>` |

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
