# Test Cases — Redmineflux MCP — Permissions, Authentication & Key Handling

> Source: vendor KB — "Permissions Setup in Redmine" (the required-permission table), "API Key User Best
> Practices", Troubleshooting ("You do not have permission", "Authentication failed"), FAQ Q1, Q2, Q6.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux MCP Server (hosted)
- MCP server version: (record via `redmineflux_system_version`)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_mcp_qa

## The single claim this suite exists to test

> *"The AI can only perform actions permitted by the Redmine user whose API key is configured."* — FAQ Q6

That sentence is the **entire** security model. There is no separate MCP permission layer: the server calls the
Redmine REST API with one key, and whatever that key can do, the assistant can do by being asked in plain English.

Two consequences shape every case below:

1. **Any action the server performs beyond the key's own permissions is a Critical privilege escalation**, and it
   is reachable by anyone who can type a request — no exploit required.
2. **The key is the whole boundary.** It sits in plain text in client config files, it carries the user's full
   rights, and `Reset` is the only revocation mechanism.

## Test accounts required

- **AdminKey** — an administrator's key.
- **ScopedKey** — a role holding some of the KB's listed permissions but deliberately **not** others (notably
  **without** `delete_issues` and **without** `approve_timesheets`).
- **ReadOnlyKey** — `view_issues` and `view_time_entries` only.
- **LockedKey** — a key belonging to a locked account.
- **OtherProjectKey** — a user who is a member of project A but not private project B.

The permission cases are untestable with a single admin key, and an admin key makes them all pass for the wrong
reason.

---

## Permissions matrix to establish

| Action via MCP | AdminKey | ScopedKey | ReadOnlyKey | LockedKey | No key |
|---|---|---|---|---|---|
| List projects / issues | | | | | |
| Create an issue | | | | | |
| Update an issue | | | | | |
| Delete an issue | | | | | |
| Log time | | | | | |
| View others' time entries | | | | | |
| Approve a timesheet | | | | | |
| Manage sprints / board settings | | | | | |
| Manage tags | | | | | |
| Manage helpdesk configuration | | | | | |
| Read a project the user is not a member of | | | | | |
| Write to a project the user is not a member of | | | | | |

---

## Functional Cases

---

### TC-RFM-031: Each request is authenticated as its own key's user

**User Role:** ScopedKey
**Steps:**
1. Create an issue and log time via MCP.
2. Check the author of the issue and the user on the time entry in Redmine.

**Expected Result:**
- Both are attributed to **ScopedKey's user**, not to a service account or the admin.
- Attribution is what makes AI-driven changes auditable; a change recorded against the wrong user would make the
  journal misleading.

---

### TC-RFM-032: Two keys on one server stay separate

**User Role:** ScopedKey and OtherProjectKey, connected to the same MCP server URL
**Steps:**
1. Each asks for their projects, their issues, and their time entries.

**Expected Result:**
- Each sees only their own, per FAQ Q2.
- **Cross-contamination here would be Critical** and is only detectable with two genuinely different keys
  (paired with TC-RFM-009).

---

### TC-RFM-033: Read permissions are enforced

**User Role:** ReadOnlyKey
**Steps:**
1. List issues and time entries — expect success.
2. Ask to create an issue, update one, log time, and approve a timesheet.

**Expected Result:**
- Reads succeed; **all four writes are refused** with the documented permission message.
- A read-only key that can write is the plainest possible violation of the model.

---

### TC-RFM-034: Each listed permission gates its own capability

**User Role:** ScopedKey, reconfigured per step
**Steps:**
1. For each row of the KB's permission table, remove the permission, attempt the matching MCP action, then restore
   it and retry: `view_issues`, `add_issues`, `edit_issues`, `delete_issues`, `log_time`, `view_time_entries`,
   `edit_project`, `view_agile_board`, `manage_agile_board_settings`, `manage_sprints`, the tag permissions, the
   issue-template permissions, `manage_helpdesk`, `approve_timesheets`, `manage_deals`.

**Expected Result:**
- Each action fails without its permission and succeeds with it.
- **Record a result per permission.** The KB publishes this mapping as a specification, so any row where the
  action succeeds *without* the permission is a defect against documented behaviour — and a blanket "permissions
  work" result would hide exactly one such row.

---

### TC-RFM-035: `delete_issues` is genuinely gated

**User Role:** ScopedKey without `delete_issues`
**Steps:**
1. Ask the assistant to delete an issue.

**Expected Result:**
- Refused.
- Deletion is irreversible and reachable in one sentence, so this row deserves its own case rather than being one
  entry in TC-RFM-034.

---

### TC-RFM-036: `approve_timesheets` is genuinely gated

**User Role:** ScopedKey without `approve_timesheets`
**Steps:**
1. Ask *"Approve timesheet for user <name>"* for a real pending submission.

**Expected Result:**
- Refused.
- **This is the highest-impact permission in the table.** Timesheet approval is a financial and governance
  control with a documented multi-level sequence; an MCP path that performs it without the permission bypasses
  that whole design — and the request is a single plain-English sentence.
- Also confirm that **with** the permission, the Timesheet plugin's own sequencing rules still apply
  (TC-RFM-065): holding the permission must not allow approving out of order or at the wrong level.

---

### TC-RFM-037: Project scoping is enforced on reads

**User Role:** OtherProjectKey
**Preconditions:** **Confirm project B is genuinely private** — a newly created Redmine project has "Public"
checked by default; uncheck it explicitly or this case falsely passes.
**Steps:**
1. Ask for project B's issues by name and by identifier, and ask for a specific issue ID inside it.

**Expected Result:**
- Refused, and **no issue subjects, project names or counts appear in the response**.
- Note the AI-specific risk: the assistant may summarise rather than reproduce, so check the returned content for
  leaked detail even when the answer reads like a refusal.

---

### TC-RFM-038: Project scoping is enforced on writes

**User Role:** OtherProjectKey
**Steps:**
1. Ask to create an issue in project B and to update an existing issue there.

**Expected Result:**
- Both refused. Writing into a project the user cannot see would be Critical.

---

### TC-RFM-039: Issue-visibility-scoped roles

**User Role:** A key whose role limits issue visibility to issues the user created
**Steps:**
1. List issues in a shared project and compare against the Redmine UI as that user.
2. Attempt to update another user's issue in the same project.

**Expected Result:**
- Only visible issues are returned, and the update is refused.
- Visibility-scoped roles are the subtlest tier, and an integration that checks only the project-level permission
  would return everything.

---

### TC-RFM-040: Document what an administrator key permits

**User Role:** AdminKey
**Steps:**
1. Exercise a representative destructive or sensitive action from each area — delete an issue, approve a
   timesheet, change helpdesk configuration, archive a project.

**Expected Result:**
- All succeed, as expected for an administrator.
- **Record this explicitly as a risk statement rather than a pass.** The KB's own tip — *"for full access without
  per-permission setup, grant the user Administrator access"* — is offered as convenience, but an administrator
  key given to an AI assistant means every capability on the instance is reachable through conversation, with no
  confirmation step and no scoping. That belongs in the plugin memory file and in the handoff, because teams will
  follow the tip without weighing it.

---

## Negative Cases — key handling

---

### TC-RFM-041: The key is stored in plain text in client config

**User Role:** Any
**Steps:**
1. Inspect `claude_desktop_config.json`, `.claude/mcp.json` and `~/.claude.json` after configuring.

**Expected Result:**
- Confirm the key is present in plain text — this is the documented design.
- **`.claude/mcp.json` lives inside a project folder**, which makes it a realistic candidate for an accidental
  commit. Check whether the project's `.gitignore` covers it, and record the exposure: a committed key grants
  whoever reads the repository the same Redmine access as its owner.
- The KB warns against committing it; this case turns that warning into a checked condition.

---

### TC-RFM-042: A leaked key can be revoked

**User Role:** Any
**Steps:**
1. Reset the key in My Account and retry a request with the old one.

**Expected Result:**
- The old key stops working immediately (paired with TC-RFM-003).
- **Reset is the only revocation path available.** If it does not take effect promptly, a leaked key cannot be
  withdrawn at all — High severity.

---

### TC-RFM-043: A locked account loses access

**User Role:** LockedKey
**Steps:**
1. Lock the Redmine user and retry a previously working request.

**Expected Result:**
- Refused.
- **Locking is how an organisation offboards someone.** If their key still works through MCP, their access
  outlives their account — and nothing in Redmine's UI would show it (paired with TC-RFM-026).

---

### TC-RFM-044: Key material does not appear in responses or logs

**User Role:** Any
**Steps:**
1. Inspect assistant responses, error messages and any accessible logs after a failed authentication.

**Expected Result:**
- The API key is never echoed back, in full or in part.
- An error that quotes the supplied key would place a live credential into a conversation transcript, which is
  then stored and potentially shared.

---

### TC-RFM-045: Permission changes take effect without reconnecting

**User Role:** Admin + ScopedKey
**Steps:**
1. Remove a permission from the key's role mid-session and immediately retry the matching action.

**Expected Result:**
- Refused promptly.
- **Record any caching window.** If permissions are cached at connection time, a revoked permission stays usable
  until the client reconnects — which means an urgent access removal does not actually take effect, and nobody
  would know.

---

### TC-RFM-046: Data handling claim

**User Role:** Any
**Steps:**
1. Perform a request returning sensitive content, then inspect what the MCP layer retains — session history,
   caches, logs — as far as the hosted service exposes it.

**Expected Result:**
- Consistent with FAQ Q1: data is passed through for the request and **not stored by the MCP server itself**.
- This is a hosted service, so verification is limited to what is observable; record what could and could not be
  confirmed rather than marking it passed on the strength of the documentation alone. An unverifiable claim
  recorded as verified is worse than an open question.

---

### TC-RFM-047: Cross-account isolation

**User Role:** A key from Redmineflux account A against account B's MCP URL
**Steps:**
1. Configure the client with account B's server URL and account A's key.

**Expected Result:**
- Refused.
- **A key authenticating against another account's MCP server would be a multi-tenancy breach** — one customer's
  credentials reaching another customer's Redmine. Critical (paired with TC-RFM-028).

---

### TC-RFM-048: Least-privilege setup works end to end

**User Role:** A dedicated `mcp-bot` user with only the permissions a team actually needs
**Steps:**
1. Follow the KB's own best-practice setup and exercise the intended operations, then attempt several outside the
   granted set.

**Expected Result:**
- The intended operations work and the others are refused.
- This case validates that the vendor's recommended safe configuration is actually viable — if least privilege
  breaks ordinary use, teams will fall back to the administrator shortcut in TC-RFM-040, and the recommendation
  is worthless in practice.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
