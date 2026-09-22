# Test Cases — Redmineflux Mentions — Email Notifications

> Source: vendor KB — "How to send an email mentioning users", FAQ "How can I disable email notifications for
> mentioned users?", and the Introduction's claim that the plugin "provides notification emails to the mentioned
> users".
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Mentions Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_mentions_qa

## Preconditions for the whole suite — do not skip

1. **Check Administration → Settings → General → "Host name and path" first**, on this environment, this session.
   A wrong value produces emails whose links are unusable and invalidates most of the results below.
2. A working outbound mail path. The repo's local Postfix/Dovecot stack (domain `test.local`, webmail at
   `127.0.0.1:8081`) is the intended target for local runs.
3. Each test user has a **distinct, reachable** email address, so "who received it" is unambiguous.
4. Record Administration → Settings → Email notifications state before the run and restore it afterwards.

---

## Functional Cases

---

### TC-MEN-001: Mentioned user receives an email

**User Role:** Member mentions another Member
**Steps:**
1. Mention user B in an issue note and submit.
2. Open user B's mailbox.

**Expected Result:**
- An email arrives for user B.
- It identifies the issue, who mentioned them, and contains a working link back to the issue.
- This is the plugin's core promise; failure here is High severity regardless of anything else passing.

---

### TC-MEN-002: Email arrives for a description mention

**User Role:** Member
**Steps:**
1. Mention user B in an issue **description** (not a note) and save.

**Expected Result:**
- Email arrives. Both documented entry points behave the same.

---

### TC-MEN-003: Email arrives for a wiki mention

**User Role:** Member
**Steps:**
1. Mention user B on a wiki page and save.

**Expected Result:**
- Email arrives and links to the wiki page, not to an issue.

---

### TC-MEN-004: Each mentioned user gets exactly one email

**User Role:** Member
**Steps:**
1. Mention users B, C and D in one note.

**Expected Result:**
- Three emails, one per recipient. No duplicates, and no recipient receives another recipient's copy.
- Check the To/Cc headers: putting all three in a single visible To line exposes addresses to each other and is a
  privacy finding worth recording.

---

### TC-MEN-005: Email content links back correctly

**User Role:** Member
**Steps:**
1. Open the link in the received email while logged in as the mentioned user.

**Expected Result:**
- It lands on the exact issue or wiki page containing the mention.
- A link built from a wrong host name is the failure this suite's precondition 1 exists to prevent.

---

### TC-MEN-006: Mention email is distinguishable from Redmine's standard notification

**User Role:** Member
**Steps:**
1. Trigger a mention on an issue the recipient is already a watcher of.

**Expected Result:**
- Record whether they get one email or two, and whether the mention is identifiable in the content.
- Two indistinguishable emails for one event is a usability finding; the recipient cannot tell why they were
  contacted.

---

### TC-MEN-007: Mention email respects the user's language preference

**User Role:** Member with a non-English UI language
**Steps:**
1. Set user B's language to a non-English locale and mention them.

**Expected Result:**
- The email is rendered in user B's language, consistent with Redmine's own notification behaviour.
- Untranslated fragments mixed into an otherwise translated mail are a Low/Medium finding.

---

## Functional Cases — Opt-out

---

### TC-MEN-008: Disabling mention notifications stops the emails

**User Role:** Admin
**Steps:**
1. Disable the mention notification in the email notification settings; save.
2. Trigger a mention.

**Expected Result:**
- No email is sent, while the mention itself still parses and renders in the content.
- The KB's FAQ claims this is supported, so a setting that saves but does not stop the mail is a defect.

---

### TC-MEN-009: Re-enabling restores the emails

**User Role:** Admin
**Steps:**
1. Re-enable the setting and trigger a mention again.

**Expected Result:**
- Email delivery resumes without a restart.

---

### TC-MEN-010: Per-user notification preference is honoured

**User Role:** Member
**Steps:**
1. Set user B's own notification preference to "no events" (or the narrowest available option).
2. Mention user B.

**Expected Result:**
- Record whether the mention overrides the user's own preference.
- Either behaviour can be defensible, but it must be consistent and it must be documented — a plugin that mails a
  user who has switched all notifications off is a spam defect worth filing.

---

## Negative Cases

---

### TC-MEN-011: Mail delivery unavailable

**User Role:** Member
**Steps:**
1. Stop the mail server (or point Redmine at an unreachable SMTP host).
2. Trigger a mention and save.

**Expected Result:**
- The **save still succeeds**. The content is never lost because mail failed.
- The failure is logged. A silently swallowed delivery failure is a defect — the repo has already seen exactly
  this pattern cost a whole feature elsewhere.

---

### TC-MEN-012: Mentioned user has no email address on file

**User Role:** Member
**Steps:**
1. Mention a user account with no email address configured.

**Expected Result:**
- Save succeeds, no exception, failure logged rather than raised.

---

### TC-MEN-013: Mentioned user is locked

**User Role:** Member
**Steps:**
1. Mention a locked account.

**Expected Result:**
- No email is sent to a locked account, and no error is raised on save.

---

### TC-MEN-014: Non-existent username generates no mail

**User Role:** Member
**Steps:**
1. Mention a username that does not exist.

**Expected Result:**
- Nothing is sent and nothing is queued. No bounce is generated to any address.

---

### TC-MEN-015: Mention of a user who cannot see the content

**User Role:** Member
**Steps:**
1. On an issue in a **private** project (confirm it is genuinely private — new Redmine projects default to public),
   mention a user who is not a member.
2. Inspect what that user receives.

**Expected Result:**
- Either no email, or an email containing **no** subject, description or note content from the private issue.
- Mailing private content to a non-member is a High-severity data leak, and is the most important case here.
- Also confirm the mention does not grant them access when they follow the link — they should hit a 403.

---

### TC-MEN-016: Repeated edits do not resend

**User Role:** Member
**Steps:**
1. Save a note mentioning user B, then edit the same note five times without changing the mention.

**Expected Result:**
- User B receives exactly one email in total, from the original save.

---

### TC-MEN-017: Bulk mention volume

**User Role:** Member
**Steps:**
1. Mention 50 users in one save and time the request.

**Expected Result:**
- The request returns promptly; mail is queued rather than delivered synchronously.
- All 50 emails eventually arrive, one per user. Record both the request time and the delivery lag.

---

### TC-MEN-018: Mention inside content that is later deleted

**User Role:** Member + Manager
**Steps:**
1. Mention a user, then immediately delete the issue before the mail is processed.

**Expected Result:**
- No exception in the mail path. Any email that does go out must not link to a now-404 issue without explanation,
  and must not include content from the deleted record beyond what the recipient was entitled to.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
