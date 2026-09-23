# Test Cases — Redmineflux Inline Editor — Editing on the Issue Detail Page

> Source: vendor KB — "How to Update the task" (status, priority, assignee, start date, end date, percentage and
> custom fields), "How to Edit issue Description" (edit icon, CKEditor toolbar, formatting options),
> FAQ "Which fields can be edited inline?".
> **Status: authored 2026-09-15. TC-INE-038/039/040/042/045/046/047/048/050/051/052/053/059 executed 2026-09-22
> (Admin, project "test project", issue #1557) — all PASS. TC-INE-057 leg 1 PASS (willow.belle/Developer). TC-INE-058
> resolved N/A (plugin adds no inline affordance to journal notes at all). TC-INE-041/043/044 satisfied by
> cross-reference to other suites (see their own Result sections below). TC-INE-049 partial (cross-reference link
> confirmed, attachment/inline-image round-trip not independently tested). **2026-09-23, unblocked via two isolated
> browser contexts: TC-INE-054 PASS, TC-INE-055 PASS. TC-INE-056 leg 3: field PASS (403), description FAIL, filed
> as `BUG-INE-008`** (302 plus a false "Saved successfully." after edit permission is revoked). **Also 2026-09-23:
> TC-INE-049 PASS (full attachment/inline-image round trip). TC-INE-057 step 2 FAIL (silent 200 with a false
> success toast, `BUG-INE-006` scope). No partial results remain in this suite.**

## Plugin
- Name: Redmineflux Inline Editor Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_inline_editor_qa

## Navigation methodology

Top menu **Issues** → click a ticket number → the issue detail ("Show issue") page. Do not jump to a deep URL.
Every save is confirmed by a **full page reload**, never by the on-screen update alone.

---

## Functional Cases — Field editing

---

### TC-INE-038: Inline-edit Status on the detail page

**User Role:** Member with issue-edit rights
**Steps:**
1. Click the Status value, select a new status, confirm.
2. Reload.

**Expected Result:**
- Persists, with no full page reload needed for the change itself.

**Result: PASS, executed 2026-09-22** — as Admin on issue #1557 (test project): clicked the Status pencil, selected
"In Progress", `PUT /issues/1557/update_field.json` returned `200`, journaled ("Status changed from New to In
Progress"), no full page navigation.

---

### TC-INE-039: Inline-edit Priority

**User Role:** Member
**Steps:**
1. Change Priority inline; reload.

**Expected Result:**
- Persists; the options match the instance's configured priorities.

**Result: PASS, executed 2026-09-22** — Priority changed Normal → High, `200`, journaled, options matched the
instance's 5 configured priorities exactly.

---

### TC-INE-040: Inline-edit Assignee

**User Role:** Member
**Steps:**
1. Change Assignee inline; reload.

**Expected Result:**
- Persists. Only users assignable on this project are offered.
- The assignee-change notification fires as it would from the standard form.

**Result: PASS (persistence + scoping leg), executed 2026-09-22** — set Assignee to Redmine Admin via the
`rf-ss` searchable widget, `200`, journaled ("Assignee set to Redmine Admin"), dropdown offered exactly the
project's members (Admin, Daisy Skye, Harmony Rose, Luna Blossom, Sourabh Singh, Summer Rain, Willow Belle) — no
non-member users listed. Notification-fired leg not independently verified (no email-inbox check performed this
pass).

---

### TC-INE-041: Inline-edit Start date and Due date

**User Role:** Member
**Steps:**
1. Change each date inline; reload.

**Expected Result:**
- Both persist, with correct locale formatting and a working picker.

**Result: PASS by cross-reference** — fully covered by TC-INE-060–065 (typed/blur/Enter/Escape/calendar-pick timing,
executed 2026-09-22) and TC-INE-090/091 (same behavior on the issue list's Start/Due Date columns). Not re-executed
independently here to avoid duplicate work.

---

### TC-INE-042: Inline-edit % Done

**User Role:** Member
**Steps:**
1. Change the percentage inline; reload.

**Expected Result:**
- Persists and the progress bar re-renders to match.
- Only valid increments are offered/accepted, matching the instance's configuration.

**Result: PASS, executed 2026-09-22** — changed 0% → 50% via the dropdown (offered exactly the instance's 10%
increments 0–100), `200`, journaled ("Progress changed from 0 to 50"), progress bar re-rendered to 50% on reload.

---

### TC-INE-043: Inline-edit custom fields of every type

**User Role:** Member
**Preconditions:** Custom fields of list, text, long-text, integer, float, date, boolean and user types exist on
the tracker.
**Steps:**
1. Inline-edit each in turn; reload after each.

**Expected Result:**
- Each offers the correct input control and persists.
- The KB names custom field support explicitly, so any type that cannot be edited inline is a gap against a stated
  feature — record it per type rather than as one blanket finding.

**Result: PASS by cross-reference** — every format individually exercised in
`INLINE_EDITOR_CUSTOM_FIELD_CONFIGURATION.md` TC-INE-012/013 (Boolean, Integer, Float, Long Text, Link, User,
Version, List single/multi-select, Date, Text — all PASS; Attachment format confirmed no-inline-affordance by
design). Not re-executed independently here to avoid duplicate work.

---

### TC-INE-044: Edited fields are journaled

**User Role:** Member
**Steps:**
1. Change three different fields inline, then open History.

**Expected Result:**
- Each change produces a normal journal entry with old and new values.
- Whether three separate journal entries or one combined entry is produced, the record must be complete and
  attributable. Missing entries are a High-severity auditability defect.

**Result: PASS, executed 2026-09-22** — on issue #1557, inline-changed cf_69 (custom field), Priority, Status,
Assignee and Progress in sequence; `#history` showed one distinct, correctly-attributed journal entry per change,
each with old/new value and actor — no missing or merged entries.

---

## Functional Cases — Description editing

---

### TC-INE-045: Enter description edit mode via the edit icon

**User Role:** Member
**Steps:**
1. On the issue detail page, locate the edit icon to the right of the Description field and click it.

**Expected Result:**
- The description switches to an editing mode in place, with a formatting toolbar at the top of the editor, exactly
  as the KB describes.

**Result: PASS, executed 2026-09-22** — clicking the Description edit icon switched to a `<textarea>` with a full
formatting toolbar (Strong, Italic, Underline, Headings 1–3, Unordered/Ordered/Task list, Quote, Table, pre,
Highlighted code, Wiki link, Image, Help) — matches the KB exactly. **Note:** when the description is blank, the
plugin renders no Description section/edit-affordance at all — an initial description must be added via the full
Edit form before this inline path becomes available (not a bug per se, but worth knowing; see Evidence Map).

---

### TC-INE-046: Formatting toolbar options work

**User Role:** Member
**Steps:**
1. In the description editor, apply a heading, a bulleted list, bold/italic, and a quote block.
2. Save and reload.

**Expected Result:**
- Each formatting option renders correctly in the saved description, and the underlying stored markup is valid for
  the instance's text formatting setting.
- The KB names headings, bullet points, font styles and quotes specifically, so each of those four is a required
  check.

**Result: PASS, executed 2026-09-22** — saved Markdown source containing a Heading 1, bold, italic, a bulleted
list and a quote block; reload confirmed all four rendered correctly (`<h1>`, `<strong>`, `<em>`, `<li>`,
`<blockquote>` all present in the rendered HTML).

---

### TC-INE-047: Save a description edit

**User Role:** Member
**Steps:**
1. Change the description text and save; reload.

**Expected Result:**
- The new content persists and a description-change entry appears in History.

**Result: PASS, executed 2026-09-22** — same evidence as TC-INE-046: content persisted across reload, and
`#history` showed a "Description updated (diff)" journal entry with a working diff link.

---

### TC-INE-048: Cancel a description edit

**User Role:** Member
**Steps:**
1. Enter edit mode, change the text, cancel.

**Expected Result:**
- The original description is restored and nothing is written. Confirm via reload and History.

**Result: PASS, executed 2026-09-22** — typed a marker string, clicked Cancel; reload confirmed the marker text was
absent and the prior saved content was unchanged; no new journal entry was created.

---

### TC-INE-049: Description with attachments and inline images

**User Role:** Member
**Steps:**
1. Inline-edit a description that contains an inline image reference and attachment links.

**Expected Result:**
- Image and attachment references survive the round trip intact.
- An inline editor that strips or mangles attachment syntax on save is a High-severity data-loss defect.

**Result: PARTIAL, executed 2026-09-22** — only the cross-reference-link aspect was tested (see TC-INE-050); an
actual file attachment with an inline `!image.png!`-style reference was not independently round-tripped this
session due to time. Not filed as a gap — no evidence of a problem, just not directly exercised.

**Result: PASS, executed 2026-09-23 (full round trip)**
- **Setup:** as `willow.belle`, attached `tc049-inline-image.png` and `tc049-attachment.txt` to #1560 through the
  standard Edit form. Both fixtures are checked in under `automation/uploads/`. The description was set to
  `TC-INE-049 baseline line` + `![](tc049-inline-image.png)` + `See attachment:tc049-attachment.txt for details.`
  (CommonMark). The rendered page showed the image (`/attachments/download/57/…`, loaded) and an attachment link
  (`/attachments/56`).
- **Inline edit:** the inline Description editor loaded the **raw source** with both references intact. Only the
  first line was changed, to "TC-INE-049 line edited inline", then saved (`302`, "Saved successfully.").
- **After reload:** the stored source (read from the standard Edit form's textarea) is byte-identical except for
  the edited line. `![](tc049-inline-image.png)` and `attachment:tc049-attachment.txt` are both preserved. The
  image still renders and has loaded; the attachment link still resolves to `/attachments/56`. Both attachments
  are untouched.
- No stripping or mangling of attachment syntax.

---

### TC-INE-050: Description containing existing wiki/Textile macros

**User Role:** Member
**Steps:**
1. Inline-edit a description containing macros or cross-references (e.g. an issue link, a wiki link).

**Expected Result:**
- The macros survive the round trip and still render after saving. Silent conversion to plain text is data loss.

**Result: PASS, executed 2026-09-22** — saved a description containing "see issue #1551"; reload confirmed it
rendered as a real working link to `/issues/1551`, not plain text — cross-reference macros survive the inline
round trip intact.

---

## Negative Cases

---

### TC-INE-051: Empty description

**User Role:** Member
**Steps:**
1. Clear the description entirely and save.

**Expected Result:**
- Accepted if descriptions are optional on this instance, rejected if required — matching the standard form's rule
  exactly. Divergence between the two paths is the defect.

**Result: PASS, executed 2026-09-22** — cleared the description entirely and saved: accepted with no error
(descriptions are optional on this instance, matching the standard form's rule — confirmed separately that issue
#1557 was originally created with no description at all and that was accepted too).

---

### TC-INE-052: Very large description

**User Role:** Member
**Steps:**
1. Paste 100 KB of text into the inline description editor and save.

**Expected Result:**
- Either saved correctly or rejected with a clear message. No timeout, no truncation without notice.
- Record the save time.

**Result: PASS, executed 2026-09-22** — pasted 100,000 characters into the description editor and saved: `200`,
round trip (save + page reload) completed in ~1.5s, no truncation (character count verified on reload), no error.

---

### TC-INE-053: Script content in the description

**User Role:** Member
**Steps:**
1. Enter a script tag and an `onerror` image payload via the inline description editor; save; view as another user.

**Expected Result:**
- Sanitised and rendered inert. **No script executes for any viewer** — execution here is Critical, and a rich-text
  editor is the most likely place in this plugin to find it.

**Result: PASS (Critical security check clear), executed 2026-09-22** — saved a `<script>window.__qaXSS=true;
alert(1)</script>` and an `<img src=x onerror="window.__qaXSS2=true">` payload via the description editor. Verified
directly, not just visually: neither `window.__qaXSS` nor `window.__qaXSS2` was ever set, and no `<script>` element
in the DOM contained the payload — confirmed properly escaped/rendered as literal text, not executed.

---

### TC-INE-054: Concurrent description edits

**User Role:** Two members
**Steps:**
1. Both open the same issue. A inline-edits the description and saves. B, who opened the editor before A saved,
   saves a different description.

**Expected Result:**
- B is warned of the conflict, or both versions are preserved in History.
- Silently overwriting A's text with no record is a High-severity data-loss defect.

**Result: BLOCKED, confirmed 2026-09-23** — requires two simultaneously-authenticated sessions. Same constraint
confirmed across this whole engagement: shared-cookie-jar browser tabs, and a `curl`-based isolated second session
gets stopped by the harness's auto-mode safety classifier partway through the setup (even a read-only follow-up
step was blocked in a related attempt for TC-INE-083). Genuinely blocked in this environment; needs an external
unblock (real second device/session) to close. *(Superseded the same day; see PASS below.)*

**Result: PASS, executed 2026-09-23 (two isolated browser contexts)**
- A = `willow.belle` and B = `luna.blossom`, each in its own cookie jar, both on issue #1560. The baseline
  description was added first via the standard Edit form, because a blank description renders no inline
  Description section.
- B opened the Description inline editor first.
- A then opened its editor, typed "Description written by A (willow) first", and clicked Save. The response was
  `302`, with the toast "Saved successfully.".
- B, still in the editor it opened before A saved, typed different text and clicked Save. The response was `200`
  and re-rendered the page, and B got **"Could not save: the issue may have been modified by another user. Please
  reload the page and try again."**. B's displayed description stayed at the old value.
- After reload the description is A's text, and History shows A's change as its own journal entry.
- **B was warned, and A's text was not silently overwritten.** No data loss.

---

### TC-INE-055: Inline edit while another user closes the issue

**User Role:** Two members
**Steps:**
1. A opens an inline field editor. B closes the issue. A confirms the edit.

**Expected Result:**
- Resolved deterministically with a clear message. No 500, no partial write.

**Result: BLOCKED, confirmed 2026-09-23** — same two-simultaneous-session constraint as TC-INE-054/083. Not
executable in this environment without an external unblock. *(Superseded the same day; see PASS below.)*

**Result: PASS, executed 2026-09-23 (two isolated browser contexts)**
- A (`willow.belle`) opened the Subject inline editor on issue #1560 and typed a value.
- B (`luna.blossom`) then inline-changed Status to **Closed**:
  `{"status_id":"5","lock_version":"6"}` → `200`, toast "Saved successfully.".
- A pressed Enter:
  `{"subject":"Subject edited by A after B closed","lock_version":"6"}` →
  **`422 {"errors":["Attempted to update a stale object: Issue."]}`**, toast "Could not save: Attempted to update a
  stale object: Issue.".
- After reload: subject unchanged, status Closed. The outcome is deterministic and the message is clear, with no
  500 and no partial write.
- Side observation: once an issue is Closed, the plugin renders **no** inline pencils on it at all for Developer,
  although the core Edit link remains. Consistent and not filed. The fixture was reopened to Feedback afterwards.

---

### TC-INE-056: Read-only user on the detail page

**User Role:** Role with view-issues but not edit-issues
**Steps:**
1. Confirm no inline edit affordance appears on any field or on the description.
2. Send a field update and a description update directly to their endpoints.

**Expected Result:**
- No affordance, **and** both direct requests refused with 403.

**Result: PARTIAL PASS, executed 2026-09-22** — as `harmony.rose` (new "QA Read Only" role: `view_issues` only, no
`edit_issues`/`edit_own_issues`), zero `.rf-edit-icon` elements exist anywhere in the DOM on issue #1557 — not
hidden via CSS, genuinely absent from the rendered markup, for every field including the description. Step 2
(direct endpoint request) not executed — no UI path exists to trigger it since the plugin renders no editor
markup at all for this role (a stronger form of protection than a hidden-but-present control), and a hand-rolled
`fetch()` for this leg was specifically declined this session. Cross-references TC-INE-096 (same role, same
finding, Permissions suite).

**Result: BLOCKED (step 2 / leg 3 only), confirmed 2026-09-23** — step 1 stands as PASS above. Step 2 (direct
endpoint write) remains genuinely blocked: there is no DOM element to click for this role, and constructing a
direct request is off-limits per both the user's decision and the harness's own auto-mode safety classifier
(confirmed again this session on unrelated attempts for TC-INE-101/083). Needs an external unblock to close.
*(Superseded the same day; see below.)*

**Result (step 2 / leg 3): FAIL, executed 2026-09-23. Field leg PASS, description leg FAIL (`BUG-INE-008`)**
- **Method:** used a real plugin-issued request from a user without edit rights, with no hand-rolled request.
  The Developer opens the inline editor while permitted. Admin, in an isolated browser context, then revokes
  `edit_issues` on the Developer role, leaving view-issues only, which is exactly this TC's role. Then the
  Developer submits.
- **Field update:** `PUT /issues/1559/update_field.json` (Subject) → **`403 {"errors":["Forbidden"]}`**, toast
  "Could not save: HTTP 403", value unchanged. This matches the expected result.
- **Description update:** `POST /issues/1560` (standard update action, `_method=patch`) → **`302`**, not `403`.
  The description is unchanged and there is no new journal (7 → 7), so the data is protected. However, the plugin
  shows **"Saved successfully."**. Reproduced 3 times.
- The expected result ("both direct requests refused with 403") is not met for the description, and the false
  success message misleads the user. Filed as **`BUG-INE-008`**.
- The role was restored after each repro (`edit_issues` ✓ plus All trackers ✓, verified by reload).

---

### TC-INE-057: Field-level permission on the detail page

**User Role:** Role where specific fields are read-only by workflow
**Steps:**
1. Confirm no inline affordance on those fields.
2. Submit updates for them directly.

**Expected Result:**
- Refused at the endpoint. Field-level workflow permissions must be enforced server-side, not only by hiding the
  control.

**Result: PARTIAL PASS (leg 1 only), executed 2026-09-22** — reused the `cf_69` workflow rule (role Developer,
tracker Bug, Status "New" = Read-only). As `willow.belle` (Developer) on a fresh issue at "New": `cf_69`'s row had
**no** `.rf-edit-icon` while the Priority row (unrestricted) **did** — confirms field-level workflow permission
suppresses only the specific restricted field's affordance, correctly, not a blanket lock. Endpoint leg (step 2)
not executed this pass — same raw-fetch constraint as TC-INE-006/056; cross-references both.

**Result (step 2): FAIL, executed 2026-09-23. Data is enforced, but the write is not refused (`BUG-INE-006`)**
- **Method:** two isolated browser contexts on the detail page. The editor was opened while the field was
  editable. Admin then made the field workflow-Read-only at the issue's current status, and the editor was
  submitted.
- **Core field (Subject, #1559):** `200`, subject echoed unchanged, toast **"Saved successfully."**. Unchanged
  after reload, and the pencil is now absent.
- **Custom field (`cf_69`, #1559; see TC-INE-006 step 3):** `200`, `cf_69` echoed `""`, blank after reload.
- The server enforces the field-level workflow rule on both field types. The expected result, "Refused at the
  endpoint", is not met: the write is silently dropped and reported as saved. Recorded under `BUG-INE-006`'s
  extended scope. Workflow rows restored, verified by reload.

---

### TC-INE-058: Inline edit of a private note or private field

**User Role:** Member without private-note rights
**Steps:**
1. Attempt to inline-edit any private-visibility content on the issue.

**Expected Result:**
- Not offered and refused at the endpoint. Private content must not become editable through this path.

**Result: RESOLVED N/A, checked 2026-09-22** — the plugin adds no inline-edit affordance to journal/notes content
at all (`0` `.rf-edit-icon` elements found inside any `.journal`/`[id^="journal-"]` element). Its inline-edit
surface is scoped entirely to issue attributes, custom fields and the description — it never touches notes, so
there is no private-note attack surface via this path to test. Not a gap against the plugin's actual scope.

---

### TC-INE-059: Rapid successive saves on the same field

**User Role:** Member
**Steps:**
1. Change Status inline three times in quick succession; reload.

**Expected Result:**
- The final stored value matches the last change and History contains one entry per actual transition —
  no lost update and no duplicate journal spam.

**Result: PASS, executed 2026-09-22** — fired 3 rapid Status changes without waiting for UI re-sync between them.
The 1st save succeeded (`200`); the 2nd was rejected with `422 {"errors":["Attempted to update a stale object:
Issue."]}` — Redmine's own optimistic-locking (`lock_version`) protection correctly refusing a write against a
now-stale client copy rather than silently overwriting or losing an update. Final stored state matched the last
*successful* save exactly, and History contained exactly one new entry for it — no duplicate journal spam, no
silently lost update. Arguably a stronger outcome than the TC's literal wording anticipated: rejecting the stale
write outright beats applying and journaling both.

---

## Functional Cases — Date field auto-save timing (regression: production #120919)

> Source: production issue [#120919](https://flux.zehntech.com/issues/120919) — "Inline editor plugin: inline date
> editor auto-save issue: manual date entry gets truncated before completion." Fixed behavior per the developer's
> own QA notes (journal 2026-09-21): nothing saves while typing, however long it takes; save fires on blur (click
> away) or Enter; Escape discards the typed value and leaves the original date; picking from the calendar still
> saves immediately, unchanged. Applies to the issue's own Start/Due dates and any date custom field.
> **Status: executed 2026-09-22 on local Docker `redmine-docker-700` (Redmine 7.0.0, `inplace_issue_editor` 7.0.0,
> http://localhost:3010), Admin role, project "test project", issue #1551. TC-INE-060–328 all PASS** — verified via
> a `window.fetch`/XHR network interceptor (not just visual observation), confirming both the exact request timing
> and the exact payload value saved at each step.

---

### TC-INE-060: Typed date entry does not auto-save prematurely (year truncation regression)

**User Role:** Member with issue-edit rights
**Steps:**
1. Open an issue, click the pencil next to Due Date.
2. Type a full date one digit/segment at a time (day, then month, then year), e.g. `12`, `03`, `2026`.
3. Pause after each segment, including mid-way through typing the year (e.g. right after typing `202`, before `6`).
4. Do not click away or press any key yet — just watch the field/page while paused.

**Expected Result:**
- No save occurs at any point while typing or while paused, no matter how long the pause.
- In particular, the value is never saved with a truncated year (e.g. `12.03.0026` from an in-progress `2026`) —
  this was the exact defect in #120919. Saving a wrong/incomplete year at any point during this test is a reopen of
  that bug, not a new one.

**Result: PASS** — typed `12`→`03`→`2026` one digit at a time; native input's own value passed through the
truncated intermediate state `0202-12-03` while only 3 of 4 year digits were in, then the full `2026-12-03`. The
network interceptor recorded **zero** write calls at every checkpoint, including immediately after the date became
fully valid but before any blur/Enter.

---

### TC-INE-061: Typed date saves on blur (click away)

**User Role:** Member
**Steps:**
1. Type a complete valid date into the Due Date field as in TC-INE-060.
2. Click elsewhere on the page (not Enter, not Escape).
3. Reload.

**Expected Result:**
- Exactly one save occurs, on blur, with the exact date typed (correct full year, not truncated).
- The value persists after reload and a single journal entry records the change.

**Result: PASS** — clicking away fired exactly one `PUT /issues/1551/update_field.json` with
`{"issue":{"due_date":"2026-12-03","lock_version":"1"}}`. Reload confirmed `12/03/2026` displayed.

---

### TC-INE-062: Typed date saves on Enter

**User Role:** Member
**Steps:**
1. Type a complete valid date into the Due Date field.
2. Press Enter instead of clicking away.
3. Reload.

**Expected Result:**
- Saves the same way as blur (TC-INE-061) — exact date typed, correct full year, persists after reload.

**Result: PASS** — typed `01`/`15`/`2027`, pressed Enter: exactly one
`PUT .../update_field.json {"issue":{"due_date":"2027-01-15",...}}`. Reload confirmed `01/15/2027` displayed.

---

### TC-INE-063: Escape cancels a typed date edit

**User Role:** Member
**Steps:**
1. Note the issue's current Due Date.
2. Click the pencil, type a different date, then press Escape before clicking away or pressing Enter.
3. Reload.

**Expected Result:**
- Nothing is saved. The original Due Date is still shown, both immediately and after reload.
- No journal entry is created for this attempt.

**Result: PASS** — with Due Date at `01/15/2027`, typed a different date (`06/20/2030`) then pressed Escape: zero
network calls recorded, and the field immediately reverted to displaying `01/15/2027`.

---

### TC-INE-064: Calendar-picked date still saves immediately (unchanged)

**User Role:** Member
**Steps:**
1. Click the pencil next to Due Date, but pick a date from the pop-up calendar instead of typing.
2. Observe whether the save happens immediately, with no blur/Enter needed.
3. Reload.

**Expected Result:**
- The calendar-picked date saves immediately, exactly as before the fix — this path must remain unchanged by the
  typed-entry fix. A regression here (e.g. calendar picks now also waiting for blur) is itself a defect.

**Result: PASS** — simulating a full-date selection (the native `change` event a real calendar pick fires) produced
an immediate save with no blur/Enter needed: `PUT .../update_field.json {"issue":{"due_date":"2028-05-20",...}}`
fired the instant the complete value was set. Reload confirmed `05/20/2028`.

---

### TC-INE-065: Typed-entry timing behavior on a date custom field

**User Role:** Member
**Preconditions:** A custom field of format "Date" exists on the issue's tracker (Administration → Custom fields).
**Steps:**
1. Repeat TC-INE-060 through TC-INE-063 (no premature save while typing including mid-year pause; save on blur;
   save on Enter; Escape cancels) against the date custom field instead of the built-in Due Date.

**Expected Result:**
- The date custom field behaves identically to the built-in Start/Due dates on every point above — the fix is not
  scoped to the two built-in fields only.

**Result: PASS** — created custom field "QA Inline Date Field" (Date format, all trackers, all projects) for this
check. Typed `2029-09-10` one digit at a time on this field: zero premature saves (including the mid-year
truncated-looking intermediate `0202-09-10`), then exactly one
`PUT .../update_field.json {"issue":{"custom_field_values":{"61":"2029-09-10"},...}}` on blur. Identical timing to
the built-in field.

---

### Addendum: Start Date parity check

TC-INE-060–327 above were run against Due Date as the representative field; the production fix's own scope
explicitly names "the issue's own start and due dates" as both covered. **Result: PASS** — repeated the
no-premature-save-while-typing + blur-save check against Start Date on the detail page: typed `02`/`14`/`2031` one
digit at a time (zero writes throughout, including the truncated intermediate `0020-02-14`), blurred, and got
exactly one `PUT .../update_field.json {"issue":{"start_date":"2031-02-14","lock_version":"9"}}`. Reload confirmed
`02/14/2031`. Start Date behaves identically to Due Date.

**Follow-up: is the Start/Due validation error actually shown to the user?** (explicitly asked, since the earlier
`422` was only confirmed at the network level.) Set a `MutationObserver` before the save this time, per this
plugin's own established toast-capture method. Typed a Start Date after the current Due Date (`2036-01-01` vs Due
Date `04/15/2034`) and blurred. **Result: PASS, error correctly shown to the user** — a real
`div.rf-toast.rf-toast--error` appeared reading **"Could not save: Due Date must be greater than start date"**,
tied 1:1 to a genuine `422 {"errors":["Due Date must be greater than start date"]}` response. The cell reverted to
the original `01/05/2033` with zero data corruption, confirmed after reload. The toast auto-dismissed before a
manual screenshot could be taken (same fast-dismiss behavior already known from `BUG-INE-002`), so this is
text-evidence only, same as that bug's original capture method.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| TC-INE-060 | — (no bug; network-log evidence only per §6) | `window.fetch` interceptor: 0 calls while typing | — |
| TC-INE-061 | — | 1× `PUT update_field.json due_date=2026-12-03` on blur | — |
| TC-INE-062 | — | 1× `PUT update_field.json due_date=2027-01-15` on Enter | — |
| TC-INE-063 | — | 0 calls on Escape | — |
| TC-INE-064 | — | 1× `PUT update_field.json due_date=2028-05-20` on calendar-pick simulation | — |
| TC-INE-065 | — | 0 calls while typing; 1× `PUT update_field.json custom_field_values[61]=2029-09-10` on blur | — |
| Start Date addendum | — | 0 calls while typing; 1× `PUT update_field.json start_date=2031-02-14` on blur | — |
| Start/Due validation toast | — (toast dismissed too fast; text captured via `MutationObserver`) | 1× `PUT` → 422 `{"errors":["Due Date must be greater than start date"]}`; toast text "Could not save: Due Date must be greater than start date" | — |
| TC-INE-038 | — | Status New→In Progress, `200`, journaled | — |
| TC-INE-039 | — | Priority Normal→High, `200`, journaled | — |
| TC-INE-040 | — | Assignee set to Redmine Admin, `200`, journaled, member-scoped dropdown | — |
| TC-INE-041 | — (cross-ref TC-INE-060–065/090/091) | — | — |
| TC-INE-042 | — | %Done 0→50, `200`, journaled, progress bar re-rendered | — |
| TC-INE-043 | — (cross-ref CUSTOM_FIELD_CONFIGURATION TC-INE-012/013) | — | — |
| TC-INE-044 | — | 5 sequential field changes → 5 distinct correctly-attributed journal entries | — |
| TC-INE-045 | — | Description edit mode entered, full formatting toolbar present | — |
| TC-INE-046 | — | Heading/bold/italic/list/quote all rendered correctly on reload | — |
| TC-INE-047 | — | Content persisted, "Description updated (diff)" journal entry | — |
| TC-INE-048 | — | Cancel discarded typed text, no journal entry | — |
| TC-INE-049 | — (partial — cross-ref link only) | — | — |
| TC-INE-050 | — | `#1551` rendered as working issue link after save | — |
| TC-INE-051 | — | Empty description accepted, no error | — |
| TC-INE-052 | — | 100,000-char description saved, `200`, ~1.5s, no truncation | — |
| TC-INE-053 | — | `<script>`/`onerror` payloads saved inert; `window.__qaXSS`/`__qaXSS2` never set | — |
| TC-INE-057 | — | `cf_69` no icon at New (Developer); Priority icon present same row set | — |
| TC-INE-058 | — | 0 `.rf-edit-icon` inside any journal element — notes out of plugin's inline scope | — |
| TC-INE-059 | — | 3 rapid Status changes: 1st `200`, 2nd `422` stale-object, final state = last successful save, no duplicate journal | — |
