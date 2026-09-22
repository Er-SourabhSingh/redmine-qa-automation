# Test Cases — Redmineflux Mentions — Mentions in Wiki Content

> Source: vendor KB — "How to Mention Users on Wiki Page" (including the Wiki-module enabling prerequisite).
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Mentions Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_mentions_qa

## Navigation methodology

Project → **Wiki** tab → **Edit**. If the Wiki tab is absent, enable it first via Project → **Settings** →
**Modules** → tick **Wiki** → Save, exactly as the KB describes. Reach the page by clicking the tab, not by URL.

---

## Functional Cases

---

### TC-MEN-070: Enable the Wiki module, then mention a user

**User Role:** Manager (to enable) then Member
**Steps:**
1. Confirm the project has no Wiki tab.
2. Project → Settings → Modules → tick **Wiki** → Save.
3. Open the Wiki tab, click **Edit**, type the mention symbol plus a username, save.

**Expected Result:**
- The Wiki tab appears after the module is enabled.
- The page saves and the mention renders as a reference to that user.
- The mentioned user is notified.

---

### TC-MEN-071: Mention on a newly created wiki page

**User Role:** Member with wiki-edit rights
**Steps:**
1. Create a brand-new wiki page whose initial content contains a mention; save.

**Expected Result:**
- The mention parses on first save, not only on a subsequent edit. The user is notified.

---

### TC-MEN-072: Mention several users on one wiki page

**User Role:** Member
**Steps:**
1. Mention three users in one page body and save.

**Expected Result:**
- All three parse and all three are notified exactly once.

---

### TC-MEN-073: Editing a wiki page notifies only newly added mentions

**User Role:** Member
**Steps:**
1. A page already mentions user A. Edit it to also mention user B; save.

**Expected Result:**
- Only user B is notified. Re-notifying A on every subsequent edit of the page is a spam defect.

---

### TC-MEN-074: Mention is preserved across wiki versions

**User Role:** Member
**Steps:**
1. Save a page with a mention, edit it again, then view the page History and an older version.

**Expected Result:**
- The historic version still shows the mention text intact and renders without error.
- Viewing an old version does **not** re-send a notification.

---

### TC-MEN-075: Wiki module disabled after mentions exist

**User Role:** Manager
**Steps:**
1. Disable the Wiki module on a project whose pages contain mentions.
2. Re-enable it and reopen the page.

**Expected Result:**
- No data loss. The page and its mentions return intact after re-enabling.
- While disabled, the wiki URLs are refused rather than serving content.

---

### TC-MEN-076: Mention in a wiki page comment / annotation

**User Role:** Member
**Steps:**
1. If the build supports wiki page comments, add one containing a mention.

**Expected Result:**
- Record the behaviour. The KB covers only the page body; if comments do not parse mentions, that is a documented
  limitation to note, not a defect.

---

## Negative Cases

---

### TC-MEN-077: Mention in wiki markup that should stay literal

**User Role:** Member
**Steps:**
1. Save a page containing a mention inside a code block, inside `<pre>`, and inside a Textile link label.

**Expected Result:**
- Code and preformatted blocks render the mention verbatim and send nothing.
- Nothing about the surrounding markup breaks.

---

### TC-MEN-078: Symbol collision with wiki syntax

**User Role:** Member
**Steps:**
1. With the symbol set to `!`, save a page containing `!attached.png!` alongside `!username`.
2. Repeat with the symbol set to `:` and page content containing `http://host:8080` and `:username`.

**Expected Result:**
- Image syntax still renders as an image; the port number is not read as a mention; the real mention still resolves.
- These two symbols are the highest-collision choices and the results belong in the plugin memory file whatever
  they are.

---

### TC-MEN-079: Mention a non-existent user on a wiki page

**User Role:** Member
**Steps:**
1. Mention a username that does not exist and save.

**Expected Result:**
- Page saves, text kept literal, no email, no error.

---

### TC-MEN-080: Mention a user with no access to the project

**User Role:** Member
**Steps:**
1. On a **private** project's wiki page, mention a user who is not a member. Confirm the project is genuinely
   private first — a new Redmine project defaults to public.
2. Check what the mentioned user receives and what they can then open.

**Expected Result:**
- Either no notification is sent, or the notification contains no wiki content the user is not entitled to read.
- Being emailed the body of a private project's wiki page, or being granted access by the mention, is a
  High-severity data leak. This is the single most important case in this suite.

---

### TC-MEN-081: Mention on a protected wiki page

**User Role:** Member without edit rights on a protected page
**Steps:**
1. Attempt to add a mention to a protected page through the UI, then send the update request directly.

**Expected Result:**
- Refused at both legs with 403. Page protection must gate the mention path too.

---

### TC-MEN-082: Very long wiki page with many mentions

**User Role:** Member
**Steps:**
1. Save a page of several thousand words containing 50 mentions.

**Expected Result:**
- Saves without timeout; every mentioned user notified exactly once; page renders in reasonable time.
- Record the wall-clock time for the save.

---

### TC-MEN-083: Mention in a wiki page title

**User Role:** Member
**Steps:**
1. Create a wiki page whose **title** contains the mention symbol plus a username.

**Expected Result:**
- No notification is triggered from the title, and the page is still reachable by its URL without breaking.
- Record whether the symbol is stripped or escaped in the generated page slug.

---

### TC-MEN-084: Deleting a wiki page that contained a mention

**User Role:** Manager
**Steps:**
1. Delete a page containing mentions and check for orphaned notification or reference records.

**Expected Result:**
- Deletion succeeds cleanly. No notification is sent on deletion and nothing orphaned surfaces in the UI.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
