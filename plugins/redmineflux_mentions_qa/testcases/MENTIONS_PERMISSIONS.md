# Test Cases — Redmineflux Mentions — Permissions & Access Control

> Source: the vendor KB publishes **no** permissions matrix for this plugin. This suite exists to establish one
> empirically, and to answer the plugin's highest-risk open question: whether a mention can expose content the
> mentioned user is not entitled to see.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Mentions Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_mentions_qa

## Methodology — mandatory for every case in this suite

A hidden control is **not** evidence that access is blocked. Each case is checked three ways:

1. **Positive UI** — the permitted role performs the action through real navigation and it works.
2. **Negative UI** — the denied role does not see the control.
3. **Negative endpoint** — the denied role is refused when the URL or API endpoint is requested **directly**.

For this plugin there is a fourth leg that matters more than the others:

4. **Negative content leg** — what actually arrives in the mentioned user's mailbox, and what they can open by
   following it. A plugin that respects the UI but mails private content has still leaked it.

---

## Permissions matrix to establish

| Action | Admin | Manager | Developer | QA | Reporter | Non-member | Anonymous |
|--------|-------|---------|-----------|-----|----------|------------|-----------|
| Mention a user in an issue description | | | | | | | |
| Mention a user in an issue note | | | | | | | |
| Mention a user in wiki content | | | | | | | |
| Receive a mention notification | | | | | | | |
| See other users in an autocomplete (if one exists) | | | | | | | |
| Change the mention symbol | | | | | | | |

Fill in from observed behaviour during execution, not from assumption.

---

## Functional Cases

---

### TC-MEN-901: Admin has full access

**User Role:** Admin
**Steps:**
1. Exercise every row of the matrix as Admin, including the plugin configuration page.

**Expected Result:**
- All actions succeed.

---

### TC-MEN-902: Mentioning follows the underlying edit permission

**User Role:** Developer (can edit issues), then a read-only role
**Steps:**
1. As Developer, add a note containing a mention — expect success.
2. As the read-only role, confirm no Edit/Add-notes control is offered.
3. As the read-only role, POST the note directly to the endpoint.

**Expected Result:**
- The mention capability is exactly the issue-edit capability — it grants nothing extra.
- Leg 3 is rejected with 403. A read-only user who can inject a note by hitting the endpoint is a High-severity
  defect that has nothing to do with mentions but would be found here.

---

### TC-MEN-903: Wiki mentioning follows the wiki-edit permission

**User Role:** Role without wiki-edit rights
**Steps:**
1. Confirm no wiki Edit control is offered.
2. Send the wiki update request directly.

**Expected Result:**
- Refused with 403 at the endpoint, not merely hidden in the UI.

---

### TC-MEN-904: Only an admin can change the mention symbol

**User Role:** Manager, Developer, QA, Reporter (each in turn)
**Steps:**
1. Confirm no symbol setting is reachable from the project UI.
2. Request the plugin settings URL directly for each role.
3. Attempt to POST a symbol change directly.

**Expected Result:**
- All refused with 403. The symbol is instance-wide; a non-admin able to change it could silently disable
  mentions for every user on the instance.

---

### TC-MEN-905: Mentioning a non-member of a private project does not grant access

**User Role:** Member of private project A mentions a user who is not a member
**Preconditions:** **Confirm project A is genuinely private.** A newly created Redmine project has "Public"
checked by default; uncheck it explicitly or this case will falsely pass.
**Steps:**
1. Mention the non-member in an issue in project A and save.
2. As the mentioned user, follow any link received and request the issue URL directly.

**Expected Result:**
- The mentioned user is **still refused** the issue with a 403 or not-found.
- The mention must not add them as a watcher, a member, or otherwise widen their access.
- Any access granted by a mention alone is a High-severity privilege-escalation defect.

---

### TC-MEN-906: Notification content does not leak private data

**User Role:** As TC-MEN-905
**Steps:**
1. Inspect the **full body and subject** of whatever email the non-member received.

**Expected Result:**
- No issue subject, description, note text, project name or attachment name from the private project appears in
  the email.
- This is the case most likely to find a real defect in this plugin, because the UI check in TC-MEN-905 can pass
  while the email still carries the content.

---

### TC-MEN-907: Autocomplete (if present) does not enumerate users

**User Role:** Reporter or a low-privilege member
**Preconditions:** Only applicable if TC-MEN-209 established that a picker exists.
**Steps:**
1. Type the mention symbol and inspect the suggestion list.

**Expected Result:**
- It offers only users this role is entitled to see under the instance's "Users visibility" setting.
- A picker that lists every account on the instance to any logged-in user is a user-enumeration finding.

---

### TC-MEN-908: Anonymous users cannot mention

**User Role:** Anonymous (logged out)
**Steps:**
1. On a public project that allows anonymous issue viewing, attempt to add a note with a mention.
2. Send the request directly with no session.

**Expected Result:**
- Refused. An unauthenticated visitor must never be able to make the instance send mail to named users — that is
  an outbound-spam vector and would be High severity.

---

### TC-MEN-909: Non-member cannot mention into a private project

**User Role:** Authenticated non-member
**Steps:**
1. Send a note-create request containing a mention directly to an issue in a private project.

**Expected Result:**
- 403. No note is created and no mail is sent.

---

### TC-MEN-910: Permission revocation takes effect without re-login

**User Role:** Admin + affected member
**Steps:**
1. Remove the member's edit rights while they hold an open Add-notes form containing a mention.
2. Have them submit without logging out.

**Expected Result:**
- Rejected, and no notification email is sent. Permissions are evaluated per request, not cached in the session.

---

### TC-MEN-911: Mentions in an archived or closed project

**User Role:** Member
**Steps:**
1. Close a project and attempt a mention; then archive it and repeat.

**Expected Result:**
- Closed projects are read-only and archived projects inaccessible, matching Redmine's own semantics, at the
  endpoint as well as in the UI. No mail is generated from either.

---

### TC-MEN-912: Mentioning a user across project boundaries

**User Role:** Member of project A only
**Preconditions:** Confirm the target user is genuinely a member of project B and not of project A, so the
scenario is real rather than synthetic.
**Steps:**
1. Mention that user on an issue in project A.

**Expected Result:**
- Record the behaviour. Mentioning a user who cannot see project A reduces to TC-MEN-905/906 and must satisfy both:
  no access granted, and no project A content in the email.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
