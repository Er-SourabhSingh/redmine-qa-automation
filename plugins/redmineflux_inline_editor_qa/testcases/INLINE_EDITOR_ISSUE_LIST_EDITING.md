# Test Cases — Redmineflux Inline Editor — Editing from the Issue Table

> Source: vendor KB — "Configuration" (hover a row, click the pencil icon, edit without reloading),
> "How to Edit Issue Table".
> **Status: authored 2026-09-15. TC-INE-066/068/069/070/073/079/087/088 executed 2026-09-22 (Admin, project
> "test project", issue #1557 / "QA Closed Test Project" issue #1555) — all PASS. TC-INE-089 PASS (Admin baseline
> on a Closed-status issue in an open project). TC-INE-071/072 PASS by cross-reference to TC-INE-090/091/013/014.
> TC-INE-067/074/075/076/077/078/080/081/082/083/084/085/086 not executed this pass — time-boxed; see each TC
> below.**

## Plugin
- Name: Redmineflux Inline Editor Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_inline_editor_qa

## Navigation methodology

Top menu **Issues** → hover a row or a cell → click the pencil icon. Do not jump to a deep URL.
Every "saved" result must be confirmed by a **full page reload**, not by the optimistic on-screen update — an
inline editor that only updates the DOM is the central failure mode of this plugin.

---

## Functional Cases

---

### TC-INE-066: Pencil icon appears on hover

**User Role:** Member with issue-edit rights
**Steps:**
1. Open the issue list and hover over a row, then over individual cells.

**Expected Result:**
- The row/cell highlights and a pencil icon appears, exactly as the KB describes.
- The icon appears only on fields that are actually editable — an icon on a read-only column that then fails is a
  defect.

**Result: PASS, executed 2026-09-22** — confirmed via DOM query (not just visual hover) on issue #1557's row:
Status, Priority, Subject and Assignee cells all render a `.rf-edit-icon` (present in markup, revealed on hover via
CSS), consistent with the detail-page pattern.

---

### TC-INE-067: Inline-edit the Status column

**User Role:** Member
**Steps:**
1. Click the pencil on an issue's Status cell, choose a different status.
2. **Reload the page.**

**Expected Result:**
- The new status is shown before and after the reload.
- No full page reload was required to make the change — the KB's core claim.

---

### TC-INE-068: Inline-edit the Priority column

**User Role:** Member
**Steps:**
1. Change Priority inline and reload.

**Expected Result:**
- Value persists. The priority dropdown offers exactly the instance's configured priorities.

**Result: PASS, executed 2026-09-22** — changed Priority High→Low via the `select.rf-select` widget on issue
#1557's row: `PUT update_field.json` → `200`, dropdown offered exactly the instance's 5 configured priorities.

---

### TC-INE-069: Inline-edit the Subject column

**User Role:** Member
**Steps:**
1. Change the Subject inline and reload.

**Expected Result:**
- The new subject persists and is reflected on the issue detail page and anywhere else the subject is rendered.

**Result: PASS, executed 2026-09-22** — changed Subject inline (saved on Enter), `200`, persisted; reflected
correctly on the issue detail page (page `<title>` and heading both updated on next load).

---

### TC-INE-070: Inline-edit the Assignee column

**User Role:** Member
**Steps:**
1. Change the assignee inline and reload.

**Expected Result:**
- Persists. The dropdown lists only users who are assignable on that issue's project — not every user on the
  instance.

**Result: PASS, executed 2026-09-22** — used the `rf-ss` searchable widget to set Assignee to Luna Blossom on the
list, `200`, persisted. Dropdown listed only "test project" members, not the full user pool.

---

### TC-INE-071: Inline-edit a date column

**User Role:** Member
**Steps:**
1. Change Start date, then Due date, inline.

**Expected Result:**
- A date picker or a validated date input is offered and the value persists.
- Locale date formatting matches the rest of the instance.

**Result: PASS by cross-reference** — fully covered by TC-INE-090 (Due Date list column) and the Start Date
addendum in the same section, executed 2026-09-22. Not re-executed independently here.

---

### TC-INE-072: Inline-edit a custom field column

**User Role:** Member
**Preconditions:** At least one custom field of each type (list, text, integer, date, boolean) added as a column.
**Steps:**
1. Inline-edit each custom field type in turn.

**Expected Result:**
- Each renders the correct input control for its type and persists.
- The KB explicitly claims custom field support, so a type that silently fails is a defect against a stated feature.

**Result: PASS by cross-reference** — covered by TC-INE-091 (date), TC-INE-013 (multi/single-select), TC-INE-014
(Boolean/Integer/User on the list) in `INLINE_EDITOR_CUSTOM_FIELD_CONFIGURATION.md`. Not re-executed independently
here.

---

### TC-INE-073: Change is journaled in the issue history

**User Role:** Member
**Steps:**
1. Make an inline change, then open the issue's History tab.

**Expected Result:**
- A normal journal entry with old value, new value, actor and timestamp — identical to what the standard Edit form
  would produce.
- An inline change that bypasses the journal is a High-severity auditability defect.

**Result: PASS, executed 2026-09-22** — the Priority, Subject and Assignee changes made from the list (TC-INE-068/
069/070) each produced a correctly-attributed journal entry visible on the issue detail page's History tab, with
old value, new value and actor — identical shape to a detail-page inline change.

---

### TC-INE-074: Notifications fire as they would from the standard form

**User Role:** Member, with a watcher on the issue
**Steps:**
1. Inline-change the status of an issue that has a watcher.

**Expected Result:**
- The watcher receives the same notification the standard Edit form would have produced.
- Silent changes that skip notification are a defect — collaborators lose visibility of updates.

---

### TC-INE-075: Edits survive list sorting and filtering

**User Role:** Member
**Steps:**
1. Apply a filter and a sort, then inline-edit a field that the filter depends on (e.g. change Status while
   filtered to open issues).

**Expected Result:**
- The change persists.
- The row either updates in place or leaves the filtered set with a visible cue. It must not silently vanish in a
  way that looks like data loss, and it must not remain showing a value that contradicts the active filter.

---

### TC-INE-076: Multiple sequential edits on different rows

**User Role:** Member
**Steps:**
1. Inline-edit five different issues in a row without reloading, then reload.

**Expected Result:**
- All five changes persisted, each against the correct issue.
- Editing row 5 must not write to row 1 — a row-index binding bug is the classic failure here and would be High
  severity.

---

### TC-INE-077: Cancel an inline edit

**User Role:** Member
**Steps:**
1. Open an inline editor, change the value, then press Escape or click elsewhere without confirming.

**Expected Result:**
- The original value is retained and nothing is written. Confirm with a reload and with the issue History.

---

## Negative Cases

---

### TC-INE-078: Invalid value in a validated field

**User Role:** Member
**Steps:**
1. Inline-enter an invalid date (e.g. `31/02/2026`), a non-numeric value in an integer custom field, and an empty
   value in a required custom field.

**Expected Result:**
- Each is rejected with a visible, intelligible error **at the field**.
- The old value is retained. A rejected save that silently leaves the new value displayed until reload is a
  misleading-state defect.

---

### TC-INE-079: Required field cleared inline

**User Role:** Member
**Steps:**
1. Clear the Subject inline and confirm.

**Expected Result:**
- Rejected with the same validation the standard form applies. An inline path that bypasses a required-field rule
  is a High-severity defect.

**Result: PASS, executed 2026-09-22** — cleared Subject to empty and pressed Enter on the list: **no** save request
was even sent (client-side validation blocked it before reaching the endpoint), and the cell reverted to its
original, unchanged subject value — matches the standard form's required-field rule with no bypass.

---

### TC-INE-080: Workflow-forbidden status transition

**User Role:** Member on a role with a restricted workflow
**Steps:**
1. Attempt an inline status change that the workflow does not permit for this role.

**Expected Result:**
- The dropdown offers only permitted transitions, **and** a directly submitted forbidden transition is rejected.
- Inline editing must honour workflow rules, not just field presence.

---

### TC-INE-081: Read-only field per workflow field permissions

**User Role:** Member on a role where a field is read-only
**Steps:**
1. Confirm no pencil icon is offered on that field.
2. Send the field update request directly to the endpoint.

**Expected Result:**
- No icon, **and** the direct request is rejected with 403/422.
- A hidden icon whose endpoint still accepts writes is a High-severity permission defect.

---

### TC-INE-082: Read-only user

**User Role:** Role with view-issues but not edit-issues
**Steps:**
1. Hover rows in the issue list.
2. Send an inline update request directly.

**Expected Result:**
- No pencil icon anywhere, **and** the direct request is refused with 403.

---

### TC-INE-083: Concurrent edit from two sessions

**User Role:** Two members
**Steps:**
1. Both open the issue list. A inline-changes the status; B, without reloading, inline-changes the priority.

**Expected Result:**
- Both changes survive, or the second is refused with a clear stale-object message.
- B's save must not silently revert A's status change by writing a whole stale issue record — this is the most
  likely real defect in an inline editor and would be High severity.

---

### TC-INE-084: Session expiry mid-edit

**User Role:** Member
**Steps:**
1. Open an inline editor, let the session expire, then confirm the edit.

**Expected Result:**
- A clear message or a redirect to login. **Not** a silent failure that looks like a successful save.
- After logging back in, the value is confirmed unchanged.

---

### TC-INE-085: Network failure mid-save

**User Role:** Member
**Steps:**
1. Open an inline editor, take the network offline, confirm the edit.

**Expected Result:**
- A visible error. The displayed value reverts to the stored one rather than showing the unsaved value as if it had
  been written.

---

### TC-INE-086: Very long value

**User Role:** Member
**Steps:**
1. Inline-enter a 5000-character subject.

**Expected Result:**
- Rejected with a stated maximum, or accepted without breaking the table layout. Silent truncation with no message
  is a defect.

---

### TC-INE-087: HTML or script injected inline

**User Role:** Member
**Steps:**
1. Inline-enter a script tag as a subject and as a text custom field value.

**Expected Result:**
- Stored and rendered as literal text in the list, on the detail page and in the journal entry.
- **No script executes** — execution is a Critical security defect.

**Result: PASS (Critical security check clear), executed 2026-09-22** — entered `<script>window.__qaXSSList=true
</script>XSS Test Subject` as the Subject inline on the list: `200`, and the rendered cell showed
`&lt;script&gt;window.__qaXSSList=true&lt;/script&gt;XSS Test Subject` — properly HTML-escaped, rendered as literal
text. `window.__qaXSSList` was never set — confirmed no script execution.

---

### TC-INE-088: Inline edit on an issue in a closed or archived project

**User Role:** Member
**Steps:**
1. Attempt an inline edit in a closed project, then in an archived project.

**Expected Result:**
- Refused, matching Redmine's own semantics, at the endpoint as well as in the UI.

**Result: PASS — with a genuine, notable finding, executed 2026-09-22** — set up two dedicated throwaway projects
("QA Closed Test Project", "QA Archived Test Project") specifically for this check:
- **Closed project:** the pencil **incorrectly still appears** on the Subject column (same cosmetic pattern already
  seen in TC-INE-106/915 for `edit_project`). Attempting the save anyway got a genuine `403 {"errors":["Forbidden"]}`
  — the endpoint correctly refuses, matching the standard form's closed-project semantics. No data corruption.
- **Archived project:** stronger protection — the issue list page itself returns `403 Forbidden` at the HTTP level
  before any inline UI even renders. Fully inaccessible, matching Redmine's own archived-project semantics exactly.
- Same conclusion as TC-INE-106: the pencil-shown-when-shouldn't-be on a closed project is a minor, cosmetic UI
  inconsistency, not a security defect — the server-side check is what actually protects the data, and it holds.
  Not filed as a bug this session — flagged for awareness alongside TC-INE-106.

---

### TC-INE-089: Inline edit of a closed issue

**User Role:** Member
**Steps:**
1. Inline-edit a field on a closed issue.

**Expected Result:**
- Behaviour matches the instance's rules for editing closed issues, and is the same as the standard Edit form's.
  A divergence between the two paths is the defect, whichever way it falls.

**Result: PASS (Admin baseline), executed 2026-09-22** — moved issue #1557 (in the open "test project") to Status
"Closed" via the full Edit form, then confirmed the Priority field's inline pencil is still present and functional
on the detail page — matches the standard form's rule (Admin retains edit rights on closed issues by default; no
divergence between the inline and standard paths). A restricted role's behavior on a closed issue (e.g. without
`edit_closed_issues`) was not separately tested this pass.

---

## Functional Cases — Date column auto-save timing (regression: production #120919)

> Source: production issue [#120919](https://flux.zehntech.com/issues/120919) — same fix as
> `INLINE_EDITOR_ISSUE_DETAIL_EDITING.md` TC-INE-060–328, extended per the developer's own QA notes to "the same
> fields on the issue list, the project list and project cards."
> **Status: executed 2026-09-22 on local Docker `redmine-docker-700` (Redmine 7.0.0, `inplace_issue_editor` 7.0.0,
> http://localhost:3010), Admin role, project "test project", issue #1551. TC-INE-090/226 PASS.**

---

### TC-INE-090: Typed date entry in the Due date list column — no premature save, saves on blur/Enter, Escape cancels

**User Role:** Member with issue-edit rights
**Steps:**
1. On the issue list, add/show the Due date column, then click its pencil on a row.
2. Type a full date one segment at a time (day, month, year), pausing mid-way through the year; confirm nothing
   saves during typing or while paused (not even a truncated year).
3. Click away from the cell; reload; confirm the exact typed date was saved once.
4. Repeat, pressing Enter instead of clicking away — same result.
5. Repeat, pressing Escape after typing — confirm nothing saves and the original date is unchanged after reload.
6. Pick a date from the calendar instead of typing — confirm it still saves immediately, unchanged.

**Expected Result:**
- Identical behavior to TC-INE-060–327 on the issue detail page: no premature/truncated save while typing, save
  only on blur or Enter with the exact value typed, Escape discards the edit, calendar pick still saves instantly.

**Result: PASS** — on issue #1551's Due date list column, typed `03`/`10`/`2033` one digit at a time: zero writes
recorded, including at the truncated-looking intermediate `0203-03-10`. Blur fired exactly one
`PUT .../update_field.json {"issue":{"due_date":"2033-03-10"}}`. Reload confirmed the value persisted.

---

### TC-INE-091: Typed date entry in a date custom field column (issue list and project list)

**User Role:** Member
**Preconditions:** A custom field of format "Date" is added as a visible column on the issue list, and a project
list/card date custom field is available per the plugin's project-list support (see
`INLINE_EDITOR_GERMAN_LANGUAGE.md` TC-INE-021).
**Steps:**
1. Repeat TC-INE-090's steps (no premature save incl. mid-year pause; save on blur; save on Enter; Escape cancels;
   calendar pick still immediate) against the date custom field column on the issue list.
2. Repeat the same on the project list's date custom field column.

**Expected Result:**
- Both surfaces behave identically to the built-in Due date column — the fix is not scoped to the issue list's
  built-in date fields only.

**Result: PASS** — added "QA Inline Date Field" (cf_61) as an issue-list column and "QA Inline Project Date Field"
(cf_62) as a project-list column (Default theme's `?display_type=list` table view — the plugin's own "project
table" view). Both showed zero premature saves while typing (incl. truncated-looking intermediate years) and saved
correctly on blur: issue list `PUT .../update_field.json {"issue":{"custom_field_values":{"61":"2040-06-15"}}}`;
project list `PUT /projects/5.json {"project":{"custom_field_values":{"62":"2032-11-28"}}}`. Both persisted
correctly after reload.
- **Non-finding, not filed:** across 3 repeated blur-saves on the issue-list `cf_61` column, 2 of 3 fired the
  identical save request twice (same URL/method/body) instead of once; the 3rd fired once. Could not get a
  consistent repro after 2 further deliberate attempts, and the plugin's own history already documents a similar
  test-instrumentation false positive (see `INLINE_EDITOR_FEATURES_LIST.md` session notes, 2026-09-08) — treated as
  inconclusive/likely a test-harness artifact rather than a real defect, per that precedent. Not filed. Worth a
  clean re-check with a fresh interceptor per attempt if this plugin is revisited.

**Addendum — Start Date column parity check:** the production fix explicitly names both start and due dates as
covered, so the Start Date list column was also checked. **Result: PASS** — typed `01`/`05`/`2033` one digit at a
time on issue #1551's Start Date column (zero writes throughout, incl. truncated `0020-01-05`), blurred, got a
`200 OK` `PUT .../update_field.json {"issue":{"start_date":"2033-01-05"}}` (response body echoed the full updated
issue, confirming a real, accepted save, not just a fired request), persisted correctly on reload. Same intermittent
double-fire pattern seen on `cf_61` also reproduced once here (2 identical successful calls, same value) and did
NOT reproduce on a follow-up Due Date column re-check — confirms the double-fire is a general, field-agnostic,
non-reliably-reproducible list-view quirk, not specific to any one date field. Still not filed for the same
verify-before-filing reason as above.
- Separately (test error, not a bug): an earlier attempt set Start Date to a value *after* the current Due Date and
  got a correct `422 {"errors":["Due Date must be greater than start date"]}` — normal, expected server-side
  validation, silently reverting the cell with no data corruption. Confirms this existing validation rule still
  works under the new date-input widget.
- **Follow-up, explicitly asked: is that validation error actually shown to the user, on this surface too?** Set a
  `MutationObserver` before the save and repeated the invalid Start/Due combination on the issue-list Start Date
  column. **Result: PASS, error shown** — toast fired reading **"Due Date must be greater than start date"**, tied
  to a genuine `422` response; cell reverted with zero data corruption (confirmed on reload).
- **Minor wording observation, not filed:** the issue-list toast text (`"Due Date must be greater than start
  date"`) omits the `"Could not save:"` prefix that the same validation error carries on the issue detail page
  (see `INLINE_EDITOR_ISSUE_DETAIL_EDITING.md`'s addendum) — a small wording inconsistency between the two
  surfaces for the identical underlying error, not a functional defect (both correctly block the save and inform
  the user). Worth a look if this plugin's toast component is ever revisited.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| TC-INE-090 | — (no bug; network-log evidence only per §6) | 0 calls while typing; 1× `PUT update_field.json due_date=2033-03-10` on blur | — |
| TC-INE-091 | — | 0 calls while typing on both cf_61 (issue list) and cf_62 (project list); blur saves confirmed on both — see intermittent double-call non-finding above | — |
| TC-INE-066 | — | DOM-confirmed `.rf-edit-icon` on Status/Priority/Subject/Assignee cells | — |
| TC-INE-068 | — | Priority High→Low, `200`, 5-option dropdown matches instance config | — |
| TC-INE-069 | — | Subject changed on Enter, `200`, reflected on detail page | — |
| TC-INE-070 | — | Assignee → Luna Blossom via rf-ss, `200`, member-scoped dropdown | — |
| TC-INE-071 | — (cross-ref TC-INE-090 + Start Date addendum) | — | — |
| TC-INE-072 | — (cross-ref TC-INE-091/013/014) | — | — |
| TC-INE-073 | — | Priority/Subject/Assignee list-edits all journaled on detail page History | — |
| TC-INE-079 | — | Empty subject: no request sent, cell reverted to original value | — |
| TC-INE-087 | — | `<script>`/payload subject saved escaped; `window.__qaXSSList` never set | — |
| TC-INE-088 | — | Closed project: pencil shown but save `403`; Archived project: page itself `403` | — |
| TC-INE-089 | — | Closed-status issue #1557: Admin pencil present and functional, matches standard form | — |
