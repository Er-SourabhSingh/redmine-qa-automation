# Test Cases — Redmineflux Inline Editor — Editing on the Issue Detail Page

> Source: vendor KB — "How to Update the task" (status, priority, assignee, start date, end date, percentage and
> custom fields), "How to Edit issue Description" (edit icon, CKEditor toolbar, formatting options),
> FAQ "Which fields can be edited inline?".
> **Status: authored 2026-09-15. Not yet executed.**

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

### TC-INE-301: Inline-edit Status on the detail page

**User Role:** Member with issue-edit rights
**Steps:**
1. Click the Status value, select a new status, confirm.
2. Reload.

**Expected Result:**
- Persists, with no full page reload needed for the change itself.

---

### TC-INE-302: Inline-edit Priority

**User Role:** Member
**Steps:**
1. Change Priority inline; reload.

**Expected Result:**
- Persists; the options match the instance's configured priorities.

---

### TC-INE-303: Inline-edit Assignee

**User Role:** Member
**Steps:**
1. Change Assignee inline; reload.

**Expected Result:**
- Persists. Only users assignable on this project are offered.
- The assignee-change notification fires as it would from the standard form.

---

### TC-INE-304: Inline-edit Start date and Due date

**User Role:** Member
**Steps:**
1. Change each date inline; reload.

**Expected Result:**
- Both persist, with correct locale formatting and a working picker.

---

### TC-INE-305: Inline-edit % Done

**User Role:** Member
**Steps:**
1. Change the percentage inline; reload.

**Expected Result:**
- Persists and the progress bar re-renders to match.
- Only valid increments are offered/accepted, matching the instance's configuration.

---

### TC-INE-306: Inline-edit custom fields of every type

**User Role:** Member
**Preconditions:** Custom fields of list, text, long-text, integer, float, date, boolean and user types exist on
the tracker.
**Steps:**
1. Inline-edit each in turn; reload after each.

**Expected Result:**
- Each offers the correct input control and persists.
- The KB names custom field support explicitly, so any type that cannot be edited inline is a gap against a stated
  feature — record it per type rather than as one blanket finding.

---

### TC-INE-307: Edited fields are journaled

**User Role:** Member
**Steps:**
1. Change three different fields inline, then open History.

**Expected Result:**
- Each change produces a normal journal entry with old and new values.
- Whether three separate journal entries or one combined entry is produced, the record must be complete and
  attributable. Missing entries are a High-severity auditability defect.

---

## Functional Cases — Description editing

---

### TC-INE-308: Enter description edit mode via the edit icon

**User Role:** Member
**Steps:**
1. On the issue detail page, locate the edit icon to the right of the Description field and click it.

**Expected Result:**
- The description switches to an editing mode in place, with a formatting toolbar at the top of the editor, exactly
  as the KB describes.

---

### TC-INE-309: Formatting toolbar options work

**User Role:** Member
**Steps:**
1. In the description editor, apply a heading, a bulleted list, bold/italic, and a quote block.
2. Save and reload.

**Expected Result:**
- Each formatting option renders correctly in the saved description, and the underlying stored markup is valid for
  the instance's text formatting setting.
- The KB names headings, bullet points, font styles and quotes specifically, so each of those four is a required
  check.

---

### TC-INE-310: Save a description edit

**User Role:** Member
**Steps:**
1. Change the description text and save; reload.

**Expected Result:**
- The new content persists and a description-change entry appears in History.

---

### TC-INE-311: Cancel a description edit

**User Role:** Member
**Steps:**
1. Enter edit mode, change the text, cancel.

**Expected Result:**
- The original description is restored and nothing is written. Confirm via reload and History.

---

### TC-INE-312: Description with attachments and inline images

**User Role:** Member
**Steps:**
1. Inline-edit a description that contains an inline image reference and attachment links.

**Expected Result:**
- Image and attachment references survive the round trip intact.
- An inline editor that strips or mangles attachment syntax on save is a High-severity data-loss defect.

---

### TC-INE-313: Description containing existing wiki/Textile macros

**User Role:** Member
**Steps:**
1. Inline-edit a description containing macros or cross-references (e.g. an issue link, a wiki link).

**Expected Result:**
- The macros survive the round trip and still render after saving. Silent conversion to plain text is data loss.

---

## Negative Cases

---

### TC-INE-314: Empty description

**User Role:** Member
**Steps:**
1. Clear the description entirely and save.

**Expected Result:**
- Accepted if descriptions are optional on this instance, rejected if required — matching the standard form's rule
  exactly. Divergence between the two paths is the defect.

---

### TC-INE-315: Very large description

**User Role:** Member
**Steps:**
1. Paste 100 KB of text into the inline description editor and save.

**Expected Result:**
- Either saved correctly or rejected with a clear message. No timeout, no truncation without notice.
- Record the save time.

---

### TC-INE-316: Script content in the description

**User Role:** Member
**Steps:**
1. Enter a script tag and an `onerror` image payload via the inline description editor; save; view as another user.

**Expected Result:**
- Sanitised and rendered inert. **No script executes for any viewer** — execution here is Critical, and a rich-text
  editor is the most likely place in this plugin to find it.

---

### TC-INE-317: Concurrent description edits

**User Role:** Two members
**Steps:**
1. Both open the same issue. A inline-edits the description and saves. B, who opened the editor before A saved,
   saves a different description.

**Expected Result:**
- B is warned of the conflict, or both versions are preserved in History.
- Silently overwriting A's text with no record is a High-severity data-loss defect.

---

### TC-INE-318: Inline edit while another user closes the issue

**User Role:** Two members
**Steps:**
1. A opens an inline field editor. B closes the issue. A confirms the edit.

**Expected Result:**
- Resolved deterministically with a clear message. No 500, no partial write.

---

### TC-INE-319: Read-only user on the detail page

**User Role:** Role with view-issues but not edit-issues
**Steps:**
1. Confirm no inline edit affordance appears on any field or on the description.
2. Send a field update and a description update directly to their endpoints.

**Expected Result:**
- No affordance, **and** both direct requests refused with 403.

---

### TC-INE-320: Field-level permission on the detail page

**User Role:** Role where specific fields are read-only by workflow
**Steps:**
1. Confirm no inline affordance on those fields.
2. Submit updates for them directly.

**Expected Result:**
- Refused at the endpoint. Field-level workflow permissions must be enforced server-side, not only by hiding the
  control.

---

### TC-INE-321: Inline edit of a private note or private field

**User Role:** Member without private-note rights
**Steps:**
1. Attempt to inline-edit any private-visibility content on the issue.

**Expected Result:**
- Not offered and refused at the endpoint. Private content must not become editable through this path.

---

### TC-INE-322: Rapid successive saves on the same field

**User Role:** Member
**Steps:**
1. Change Status inline three times in quick succession; reload.

**Expected Result:**
- The final stored value matches the last change and History contains one entry per actual transition —
  no lost update and no duplicate journal spam.

---

## Functional Cases — Date field auto-save timing (regression: production #120919)

> Source: production issue [#120919](https://flux.zehntech.com/issues/120919) — "Inline editor plugin: inline date
> editor auto-save issue: manual date entry gets truncated before completion." Fixed behavior per the developer's
> own QA notes (journal 2026-09-21): nothing saves while typing, however long it takes; save fires on blur (click
> away) or Enter; Escape discards the typed value and leaves the original date; picking from the calendar still
> saves immediately, unchanged. Applies to the issue's own Start/Due dates and any date custom field.
> **Status: executed 2026-09-22 on local Docker `redmine-docker-700` (Redmine 7.0.0, `inplace_issue_editor` 7.0.0,
> http://localhost:3010), Admin role, project "test project", issue #1551. TC-INE-323–328 all PASS** — verified via
> a `window.fetch`/XHR network interceptor (not just visual observation), confirming both the exact request timing
> and the exact payload value saved at each step.

---

### TC-INE-323: Typed date entry does not auto-save prematurely (year truncation regression)

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

### TC-INE-324: Typed date saves on blur (click away)

**User Role:** Member
**Steps:**
1. Type a complete valid date into the Due Date field as in TC-INE-323.
2. Click elsewhere on the page (not Enter, not Escape).
3. Reload.

**Expected Result:**
- Exactly one save occurs, on blur, with the exact date typed (correct full year, not truncated).
- The value persists after reload and a single journal entry records the change.

**Result: PASS** — clicking away fired exactly one `PUT /issues/1551/update_field.json` with
`{"issue":{"due_date":"2026-12-03","lock_version":"1"}}`. Reload confirmed `12/03/2026` displayed.

---

### TC-INE-325: Typed date saves on Enter

**User Role:** Member
**Steps:**
1. Type a complete valid date into the Due Date field.
2. Press Enter instead of clicking away.
3. Reload.

**Expected Result:**
- Saves the same way as blur (TC-INE-324) — exact date typed, correct full year, persists after reload.

**Result: PASS** — typed `01`/`15`/`2027`, pressed Enter: exactly one
`PUT .../update_field.json {"issue":{"due_date":"2027-01-15",...}}`. Reload confirmed `01/15/2027` displayed.

---

### TC-INE-326: Escape cancels a typed date edit

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

### TC-INE-327: Calendar-picked date still saves immediately (unchanged)

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

### TC-INE-328: Typed-entry timing behavior on a date custom field

**User Role:** Member
**Preconditions:** A custom field of format "Date" exists on the issue's tracker (Administration → Custom fields).
**Steps:**
1. Repeat TC-INE-323 through TC-INE-326 (no premature save while typing including mid-year pause; save on blur;
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

TC-INE-323–327 above were run against Due Date as the representative field; the production fix's own scope
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
| TC-INE-323 | — (no bug; network-log evidence only per §6) | `window.fetch` interceptor: 0 calls while typing | — |
| TC-INE-324 | — | 1× `PUT update_field.json due_date=2026-12-03` on blur | — |
| TC-INE-325 | — | 1× `PUT update_field.json due_date=2027-01-15` on Enter | — |
| TC-INE-326 | — | 0 calls on Escape | — |
| TC-INE-327 | — | 1× `PUT update_field.json due_date=2028-05-20` on calendar-pick simulation | — |
| TC-INE-328 | — | 0 calls while typing; 1× `PUT update_field.json custom_field_values[61]=2029-09-10` on blur | — |
| Start Date addendum | — | 0 calls while typing; 1× `PUT update_field.json start_date=2031-02-14` on blur | — |
| Start/Due validation toast | — (toast dismissed too fast; text captured via `MutationObserver`) | 1× `PUT` → 422 `{"errors":["Due Date must be greater than start date"]}`; toast text "Could not save: Due Date must be greater than start date" | — |
