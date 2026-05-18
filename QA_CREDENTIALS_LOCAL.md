# QA Credentials - Local

## Environment

| Configuration | Value |
|---|---|
| Application | Redmine |
| Environment | Local Docker |
| Base URL | http://localhost:3006 |

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
| Password | admin123 |
| Role | Administrator |

---

## QA Engineer Users

| Username | Password | Role |
|---|---|---|
| priya.patel | Priya@123 | QA Engineer |
| neha.joshi | Neha@123 | QA Engineer |

---

## Developer Users

| Username | Password | Role |
|---|---|---|
| aman.verma | Aman@123 | Developer |
| rohit.mehta | Rohit@123 | Developer |

---

## Manager Users

| Username | Password | Role |
|---|---|---|
| rahul.sharma | Rahul@123 | Manager |
| sneha.kapoor | Sneha@123 | Manager |

---

## Client User

| Username | Password | Role |
|---|---|---|
| client.demo | Client@123 | Client |

---

## Session Storage Rules

Authentication sessions must be stored separately:

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

If authentication fails:

- Capture screenshot
- Capture console logs
- Capture network logs
- Generate authentication failure report
- Stop test case execution
