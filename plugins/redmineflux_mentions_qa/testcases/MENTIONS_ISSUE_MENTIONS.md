# Test Cases — Redmineflux Mentions — Mentions on Issues

> Source: vendor KB — "How to Mention Users on Issues", FAQ on username characters and on using mentions to
> indicate responsibility.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Mentions Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_mentions_qa

## Navigation methodology

Top menu **Issues** → an issue → **Edit** (description) or **Add notes** (note). Do not jump straight to a deep URL.
The active mention symbol is whatever the plugin configuration currently holds — record it at the top of the run.

---

## Functional Cases

---

### TC-MEN-036: Mention a user in an issue description

**User Role:** Member with issue-edit rights
**Priority:** High
**Steps:**
1. Open an issue and click **Edit**.
2. In the description, type the mention symbol immediately followed by an existing username.
3. Save.

**Expected Result:**
- The issue saves successfully.
- The mention is rendered in the saved description as a reference to that user, not as raw unparsed text.
- A notification email is generated for the mentioned user (detail in the email suite).

---

### TC-MEN-037: Mention a user in an issue note

**User Role:** Member
**Priority:** High
**Steps:**
1. On an issue, click **Add notes**, type the mention symbol plus a username, submit.

**Expected Result:**
- The note is added and the mention renders as a reference in the journal entry.
- The mentioned user is notified.

---

### TC-MEN-038: Mention a user while creating a new issue

**User Role:** Member with issue-create rights
**Priority:** High
**Steps:**
1. On the New issue form, include a mention in the description and create the issue.

**Expected Result:**
- The mention is parsed on creation, not only on a later edit. The user is notified about the new issue.

---

### TC-MEN-039: Mention renders as a link to the user

**User Role:** Member
**Priority:** Medium
**Steps:**
1. View a saved mention and click it, if it is rendered as a link.

**Expected Result:**
- Record what the mention renders as. If it is a link it should reach that user's profile; if it is styled plain
  text that is an acceptable documented behaviour. A mention that renders as a **broken** link or as raw markup is
  a defect.

---

### TC-MEN-040: Editing a description to add a mention notifies only the newly mentioned user

**User Role:** Member
**Priority:** High
**Steps:**
1. Issue description already mentions user A. Edit it to also mention user B.

**Expected Result:**
- User B is notified.
- User A is **not** re-notified for a mention that was already there. Re-notifying on every subsequent edit is a
  spam defect worth filing.

---

### TC-MEN-041: Mention typed through the Inline Editor plugin

**User Role:** Member
**Priority:** Medium
**Preconditions:** Inline Editor plugin installed and active.
**Steps:**
1. Add a note containing a mention using the inline editor rather than the standard form.

**Expected Result:**
- The mention parses and notifies identically to the standard path.
- The KB's troubleshooting section explicitly flags conflicts with plugins that interfere with inline editing, so
  a difference here is an expected-risk finding, not a surprise.

---

### TC-MEN-042: Several users mentioned in one save

**User Role:** Member
**Priority:** High
**Steps:**
1. Mention three different users in a single note and submit.

**Expected Result:**
- All three are parsed and all three are notified — exactly once each.

---

### TC-MEN-043: Mention a username containing dots, hyphens or underscores

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Create users with account names such as `first.last`, `first-last`, `first_last` and mention each.

**Expected Result:**
- Each resolves to the correct user. The KB claims no character restriction on mentionable usernames, so any
  failure here directly contradicts it and is a defect.

---

### TC-MEN-044: Determine whether a user picker / autocomplete exists

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Type the mention symbol in the notes field and pause.

**Expected Result:**
- Record the observed behaviour. The KB never claims an autocomplete exists, so absence is a documented limitation
  to note in the features list, not a bug.
- If a picker **does** appear, it must list only users the current user is permitted to see (covered by TC-MEN-064).

---

### TC-MEN-045: Mention in a private note

**User Role:** Member with private-note rights
**Priority:** High
**Steps:**
1. Add a **private** note mentioning a user who cannot see private notes.

**Expected Result:**
- Either no notification is sent, or the notification carries no content from the private note.
- Mailing the body of a private note to someone who cannot read it in the UI is a High-severity data leak.

---

## Negative Cases

---

### TC-MEN-046: Mention a non-existent username

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Type the symbol followed by a username that does not exist and save.

**Expected Result:**
- The save succeeds and the text is kept as-is. No email is sent, no error is raised, and no placeholder user is
  created.

---

### TC-MEN-047: Symbol with nothing after it

**User Role:** Member
**Priority:** Low
**Steps:**
1. Save a note containing only the bare mention symbol, and another with the symbol followed by a space.

**Expected Result:**
- Treated as ordinary text. No parse error, no empty notification.

---

### TC-MEN-048: Username containing the mention symbol itself

**User Role:** Member
**Priority:** Low
**Steps:**
1. With the symbol set to `@`, mention a user whose account name contains `@` (for instance an email-style login).

**Expected Result:**
- Behaviour is deterministic and documented: either the full account name resolves, or it does not resolve and no
  wrong user is notified.
- **Notifying the wrong user** because of a partial match is the real failure mode to watch for, and is
  High severity.

---

### TC-MEN-049: Ambiguous prefix matching

**User Role:** Member
**Priority:** High
**Steps:**
1. With users `john` and `johnsmith` both existing, mention `@john`.

**Expected Result:**
- Exactly the user `john` is notified. `johnsmith` must not be notified, and the reverse must also hold when
  mentioning `@johnsmith`.
- Greedy or partial matching that notifies the wrong person is a High-severity defect.

---

### TC-MEN-050: Mention embedded in other text without whitespace

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Save content containing `email me at name@example.com`, `a@b`, and `see@username` with the symbol set to `@`.

**Expected Result:**
- An email address in prose must **not** trigger a mention — this is the single most likely false-positive and
  would mail strangers on every issue that contains an email address.
- Record precisely which of the three forms parse.

---

### TC-MEN-051: Mention inside a code block or preformatted text

**User Role:** Member
**Priority:** Low
**Steps:**
1. Put a mention inside a `<pre>` / code block in the description and save.

**Expected Result:**
- Code blocks are literal by convention, so the mention should render verbatim and send no notification.
- Record the actual behaviour; parsing inside code blocks is a defect worth filing.

---

### TC-MEN-052: Mention a locked or registered-but-inactive user

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Mention a locked user account, then a registered-not-yet-activated account.

**Expected Result:**
- No exception on save. No email to a locked account.
- The mention text itself remains readable in the content.

---

### TC-MEN-053: Mention a group name

**User Role:** Member
**Priority:** Low
**Steps:**
1. Mention a Redmine **group** rather than a user.

**Expected Result:**
- Record the behaviour. If groups are not supported, the text stays literal and nothing is sent — that is a
  documented limitation. Silently mailing every group member without the feature being documented is worth
  recording as a surprise, and mailing *some* members is a defect.

---

### TC-MEN-054: Self-mention

**User Role:** Member
**Priority:** Low
**Steps:**
1. Mention yourself in your own note.

**Expected Result:**
- No self-notification email, or one consistent with Redmine's own "notify me about my own changes" preference.
  Unconditionally emailing the author is a spam defect.

---

### TC-MEN-055: Very many mentions in one save

**User Role:** Member
**Priority:** Low
**Steps:**
1. Mention 50 users in a single note and submit.

**Expected Result:**
- The save completes without timeout and every mentioned user is notified exactly once.
- Record the wall-clock time; a save that blocks for minutes on mail delivery is a performance defect — mail should
  be queued rather than sent inline.

---

### TC-MEN-056: HTML or script in place of a username

**User Role:** Member
**Priority:** High
**Steps:**
1. Save content where the symbol is followed by a script tag.

**Expected Result:**
- Escaped and rendered literally. **No script executes** — execution is a Critical security defect.

---

### TC-MEN-057: Mention removed by a later edit

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Save a note mentioning user A, then edit the note to remove the mention.

**Expected Result:**
- No new notification is generated by the removal, and the earlier one is not retracted or duplicated.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
