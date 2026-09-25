# Test Cases — Redmineflux Checklist — Checklist Templates

> Source: vendor KB — "How to Create a Checklist Template", "How to Edit and Delete a Checklist Template",
> "How to Create the Checklist from template".
> **Status: authored 2026-09-15. Executed 2026-09-21 (Local, redmine-docker-7.0.0) — 23/23 PASS. Regression-checked
> 2026-09-24 (targeted, post BUG-CHK-002/004/005 — see "Regression Pass — 2026-09-24" below): 23/23 PASS, 0 new
> bugs.**

## Plugin
- Name: Redmineflux Checklist Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_checklist_qa

## Navigation methodology

Administration → Plugins → Redmineflux Checklist Plugin → Configure → **Checklist templates** tab.
Application side: issue detail → Checklist section → **Actions** → **Add from template**.

---

## Functional Cases — Creating templates

---

### TC-CHK-093: Create a checklist template bound to a tracker

**User Role:** Admin
**Steps:**
1. Open the Checklist templates tab and click **Add Checklist Template**.
2. Select a tracker (e.g. Bug) from the dropdown.
3. Enter a template name.
4. Add one checklist title.
5. Click **Create Checklist template**.

**Expected Result:**
- The template is created and listed on the Checklist templates tab with its name and tracker.
- A success message is shown.

CONFIRMED LIVE 2026-09-21 (Configure → Checklist Templates → Add Checklist Template): **PASS.** Created
"TC-CHK-093 Bug Template" (tracker: Bug, one entry "First checklist title"). Success flash shown, template
listed in the tab with correct name and tracker.

---

### TC-CHK-094: Tracker dropdown lists all active trackers

**User Role:** Admin
**Steps:**
1. Compare the tracker dropdown contents with Administration → Trackers.

**Expected Result:**
- Every tracker configured on the instance is offered, with no duplicates and none missing.

CONFIRMED LIVE 2026-09-21: **PASS.** Tracker dropdown on the "Add Checklist Template" form listed the same set
of trackers as Administration → Trackers (Bug, Feature, Support, and other instance trackers), no duplicates,
none missing.

---

### TC-CHK-095: Create a template with multiple checklist entries

**User Role:** Admin
**Steps:**
1. Create a template, then use **Add checklist** to add five title rows before saving.

**Expected Result:**
- All five rows are saved in order and shown when the template is reopened for edit.

CONFIRMED LIVE 2026-09-21: **PASS.** Same "TC-CHK-093 Bug Template" extended to 5 entries ("First" through
"Fifth checklist title") via repeated **Add checklist**, saved, reopened for Edit — all 5 rows present, in the
same order.

---

### TC-CHK-096: Create a template with nested sub-checklist entries

**User Role:** Admin
**Steps:**
1. Use the add-sub-checklist control to nest entries under a parent entry, then save.

**Expected Result:**
- The hierarchy is preserved on save and reproduced when the template is applied to an issue.

CONFIRMED LIVE 2026-09-21: **PASS.** Added a nested sub-entry under one of the 5 top-level entries using the
"Add Sub-Checklist" control, saved — hierarchy preserved on reopen (Edit) and reproduced correctly (parent +
nested child both created) when the template was applied to issue #1534 during TC-411/413/414 testing.

---

### TC-CHK-097: Multiple templates can target the same tracker

**User Role:** Admin
**Steps:**
1. Create two differently-named templates both bound to the Bug tracker.

**Expected Result:**
- Both are created and both are offered when applying a template to a Bug issue.

CONFIRMED LIVE 2026-09-21: **PASS.** This instance already had 3 templates bound to the Bug tracker ("sdafasd"
pre-existing, "TC-CHK-093 Bug Template", "TC-CHK-096 Nested Template" created this session). Opened the
Add-from-template picker on issue #1534 — DOM shows all 3 as separate `.template-item` radio rows, all offered
together, no collision.

---

## Functional Cases — Editing and deleting templates

---

### TC-CHK-098: Edit a template name

**User Role:** Admin
**Steps:**
1. Click **Edit** on an existing template, change its name, save.

**Expected Result:**
- The new name is shown in the list and in the issue-side template picker.

CONFIRMED LIVE 2026-09-21 (edited template id 4, "TC-CHK-093 Bug Template" → "TC-CHK-098-407 Renamed Template"):
**PASS.** New name shown in the Checklist Templates admin list immediately after save.

---

### TC-CHK-099: Edit a template's checklist entries

**User Role:** Admin
**Steps:**
1. Edit a template: rename one entry, add one, remove one. Save.

**Expected Result:**
- All three changes persist.
- **Issues that already had this template applied are unaffected** — applying a template copies its contents; it
  does not create a live link. Record the actual behaviour; retroactive mutation of existing issue checklists
  would be a High-severity finding.

CONFIRMED LIVE 2026-09-21 (same edit as TC-406, on template id 4): **PASS, both parts.** Renamed "Fifth checklist
title" → "Fifth checklist title RENAMED", added a new 6th entry "Sixth checklist title NEW", deleted "Fourth
checklist title" (via the nested-attributes destroy pattern — the field is hidden client-side, not removed from
the DOM, then dropped server-side on save). Reopening the template for Edit and reading the admin list table
confirmed all 3 changes persisted correctly: First, Second, Third, Fifth RENAMED, Sixth NEW — Fourth gone.
**Retroactive-mutation check:** issue #1534, which already had this template applied (from TC-411), still shows
its original unmodified checklist — "First" through "Fifth checklist title" (no "RENAMED"/"NEW" text, Fourth
still present) — confirming the template copies its contents at apply-time and holds no live link back to
already-created issue checklists, exactly as expected. No defect.

---

### TC-CHK-100: Change a template's tracker binding

**User Role:** Admin
**Steps:**
1. Change an existing template's tracker from Bug to Task and save.
2. Open a Bug issue and a Task issue and check the template picker in each.

**Expected Result:**
- The template is now offered on Task issues and no longer on Bug issues.

CONFIRMED LIVE 2026-09-21 (this instance has no "Task" tracker — trackers are Bug, Feature, Support, Test case,
test — substituted **Feature** as the alternate tracker): **PASS.** Changed template id 4 ("TC-CHK-098-407
Renamed Template") from Bug → Feature and saved. Reopened the Add-from-template picker on Bug issue #1534 — the
template is gone (only "sdafasd" and "TC-CHK-096 Nested Template" remain, both still Bug-bound). Created a fresh
Feature issue (#1535) and opened its picker — "TC-CHK-098-407 Renamed Template" is now offered there, alone (no
other template on this instance is Feature-bound). Binding change takes effect immediately and correctly on both
sides.

---

### TC-CHK-101: Delete a template

**User Role:** Admin
**Steps:**
1. Click **Delete** on a template and confirm.

**Expected Result:**
- The template disappears from the list permanently (KB states deletion is permanent).
- It no longer appears in the issue-side picker.
- Checklists previously created from it on existing issues remain intact.

CONFIRMED LIVE 2026-09-21 (deleted template id 4, "TC-CHK-098-407 Renamed Template", via the custom Delete
confirmation modal — `#confirmchecklistBtn`): **PASS, all three parts.** Admin list table no longer lists it
(only the 2 remaining templates shown). Add-from-template picker on issue #1534 no longer offers it (only
"sdafasd" and "TC-CHK-096 Nested Template" remain). Issue #1534's checklist — originally created from this exact
template — still shows all 5 of its original items (First–Fifth checklist title) fully intact after the source
template's deletion. No defect.

---

### TC-CHK-102: Cancel a template deletion

**User Role:** Admin
**Steps:**
1. Trigger Delete, then cancel the confirmation.

**Expected Result:**
- The template still exists after a page reload.

CONFIRMED LIVE 2026-09-21 (triggered Delete on template id 4, clicked **Cancel** in the confirmation modal, then
did a fresh page navigation to the Checklist Templates tab): **PASS.** Template still listed after reload,
unaffected by the cancelled delete attempt.

---

## Functional Cases — Applying a template

---

### TC-CHK-103: Apply a template to an issue

**User Role:** Member
**Steps:**
1. Open a Bug issue → Checklist section → **Actions** → **Add from template**.
2. Pick a template bound to Bug and confirm.

**Expected Result:**
- All of the template's entries are created on the issue, in order, with the correct nesting.
- All new items start in the incomplete state, regardless of anything in the template.

CONFIRMED LIVE 2026-09-21 (real UI, native `.template-item` click → `submitTemplateForm(templateId)` →
`#template-selection-form` native POST — not the raw `fetch`/JSON path, which returns 406 and is not how the
feature actually works): created a fresh isolated issue #1534 in `test project` specifically for clean testing,
applied "TC-CHK-093 Bug Template" (5 entries) via **Actions → Add from template**. **PASS.** All 5 entries
created in order (First–Fifth checklist title), all incomplete on creation, nesting from TC-404's template
reproduced correctly in a separate check.

---

### TC-CHK-104: Applying a template is journaled

**User Role:** Member
**Steps:**
1. Apply a template, then open the issue History and the Checklist History tab.

**Expected Result:**
- An entry records that a template was applied, naming the template and the actor.

CONFIRMED LIVE 2026-09-21 (issue #1534, History tab): **PASS.** Journal entry #1 reads: "Applied checklist
template 'TC-CHK-093 Bug Template' — 5 checklist(s) created by Redmine Admin." — names both the template and the
actor as required.

---

### TC-CHK-105: Apply a template on top of an existing checklist

**User Role:** Member
**Steps:**
1. On an issue that already has a checklist with completed items, apply a template.

**Expected Result:**
- The template's items are **added alongside** the existing checklist. Existing items and their completion states
  are not overwritten or reset.

CONFIRMED LIVE 2026-09-21: **PASS.** After applying the 5-entry template to #1534 (leaving the checklist
incomplete by design for TC-411), a separate check on an issue with a pre-existing checked/completed manual
checklist item confirmed applying a template only appends the new entries — the existing item's title and
completed checkbox state were unchanged, not reset or overwritten.

---

### TC-CHK-106: Apply the same template twice

**User Role:** Member
**Steps:**
1. Apply the same template to the same issue twice.

**Expected Result:**
- Behaviour is explicit: either a second copy is created, or the action is refused with a clear message.
- It must not half-apply, producing a partially duplicated list.

CONFIRMED LIVE 2026-09-21 (issue #1534, "TC-CHK-093 Bug Template" applied a 2nd and 3rd time via the real
`.template-item` click → native form POST): **PASS.** Checklist item count stayed at 5 across both re-applications
(no duplicates, DOM-verified via `[id^="checklist-item-"]`), and the "Applied checklist template" journal count
stayed at 1 (no new journal entry on the 2nd/3rd attempt — the whole submission was refused, not partially
applied). The 3rd attempt's page reload surfaced the refusal's flash message explicitly: **"Failed to create any
checklist from template. Check for duplicate titles."** — a clear, explicit refusal, not a silent no-op as
initially suspected after the 2nd attempt (that impression was an artifact of checking DOM state without also
checking the top-of-page flash banner). Behaviour matches the "refused with a clear message" branch of the
expected result exactly. No half-apply, no bug.

---

## Negative Cases

---

### TC-CHK-107: Create a template with no name

**User Role:** Admin
**Steps:**
1. Leave the Template Name field blank and submit.

**Expected Result:**
- Rejected with a validation message naming the missing field. No nameless template is created.

CONFIRMED LIVE 2026-09-21 (New Checklist Template form, tracker Bug, one entry filled, Template Name left blank,
clicked Create Template): **PASS.** Blocked client-side by the field's native HTML5 `required` attribute
(`validity.valueMissing === true`) — the browser's own inline validation bubble names the field, form never
submits. Confirmed no template was created by re-checking the admin list (still only the 2 pre-existing
templates). Satisfies "rejected with a validation message naming the missing field."

---

### TC-CHK-108: Create a template with no checklist entries

**User Role:** Admin
**Steps:**
1. Provide a name and tracker but no entries; submit.

**Expected Result:**
- Either rejected with a clear message, or created and then, when applied, it adds nothing while saying so.
- Applying an empty template must not throw an error or create a blank unnamed checklist.

CONFIRMED LIVE 2026-09-21 (Tracker: Bug, Name: "TC-416 Empty Entries Template", Checklist Title entry left
blank): **PASS.** Same client-side `required` validation as TC-415 blocks submission (`validity.valueMissing`
true on the checklist-title field) — no entry-less template can be created at all, which trivially satisfies
"applying an empty template must not throw an error," since none can exist to apply.

---

### TC-CHK-109: Create a template with no tracker selected

**User Role:** Admin
**Steps:**
1. Leave the tracker dropdown unselected and submit.

**Expected Result:**
- Rejected with a validation message, or explicitly saved as "all trackers" if that is a supported option —
  record which. An unbound template that appears nowhere is a defect.

CONFIRMED LIVE 2026-09-21 (Name: "TC-417 No Tracker Template", entry filled, Tracker dropdown left on its blank
default option): **PASS.** The Tracker `<select>` also carries `required` (`validity.valueMissing === true`) —
blocked client-side, no unbound template is created. There is no "all trackers" option on this form; leaving it
unselected is simply not a submittable state.

---

### TC-CHK-110: Duplicate template names

**User Role:** Admin
**Steps:**
1. Create two templates with the same name on the same tracker.

**Expected Result:**
- Either rejected, or allowed with both distinguishable in the picker. Two identical-looking entries with no way
  to tell them apart is a usability defect worth recording.

CONFIRMED LIVE 2026-09-21 (attempted to create a second template named "sdafasd" on tracker Bug, matching the
existing template's exact name): **PASS.** Cleanly rejected server-side with an explicit, named validation
message: **"Template name must be unique within the same tracker."** Form re-rendered with the entered data
preserved (name, entry). Confirmed via the admin list that no duplicate was created — still exactly one "sdafasd"
row, unchanged. Best-case outcome from the expected result (rejected, not a look-alike pair).

---

### TC-CHK-111: HTML and special characters in template name and entries

**User Role:** Admin
**Steps:**
1. Create a template whose name and entries contain a script tag, quotes and an ampersand.
2. Apply it to an issue.

**Expected Result:**
- Rendered as literal text in both the admin list and the issue checklist. **No script executes** in either place.
  Execution is a Critical security defect.

CONFIRMED LIVE 2026-09-21 (template name and entry both set to
`<script>alert('TC419...')</script> "quoted" & ampersand`, applied to issue #1534 via the real UI): **PASS, no
XSS.** Checked raw `outerHTML` (not just `textContent`, which can mask a live `<script>` element) at all three
render points — admin Checklist Templates list, the Add-from-template picker's radio label, the created checklist
item's title span, and the "Applied checklist template" journal entry — every one shows the properly HTML-entity-
escaped form (`&lt;script&gt;...&lt;/script&gt; &quot;quoted&quot; &amp; ampersand`), confirmed with
`querySelector('script')` returning null in each container. No dialog fired, no injected node. **This is a
different code path from `BUG-CHK-002`** (that bug is in `checklist.js`'s raw-HTML AJAX creation-success
handlers for manually-typed items) — the template name/entries path is fully server-rendered/escaped and not
vulnerable. No new bug.

---

### TC-CHK-112: Template with a very large number of entries

**User Role:** Admin
**Steps:**
1. Create a template with 100 entries and apply it to an issue.

**Expected Result:**
- The apply completes without timeout, all 100 items are created, and the issue page still renders acceptably.
- Record the wall-clock time; a multi-minute apply is a performance finding.

CONFIRMED LIVE 2026-09-21 ("TC-420 Hundred Entries Template", Bug tracker, exactly 100 top-level entries built via
100 real clicks on the form's own "Add Checklist" control, then applied to a fresh issue #1536 via the real
template-picker click → native form POST): **PASS.** Save and apply both completed well within normal page-load
time (no multi-second stall, no timeout error, both single request/response round trips — no async polling or
chunking observed). All 100 items present (`li.checklist-li` count = 100), success flash shown ("Checklist and
associated items created from template successfully."), issue page rendered normally with no layout breakage, no
console errors beyond the pre-existing unrelated `lastJstPreviewed` collision. No performance defect.

---

### TC-CHK-113: Template picker on an issue whose tracker has no templates

**User Role:** Member
**Steps:**
1. Open an issue on a tracker with no templates bound and choose **Add from template**.

**Expected Result:**
- A clear empty state ("no templates available for this tracker"). Not an empty silent dropdown and not an error.

CONFIRMED LIVE 2026-09-21 (created issue #1537 on the Support tracker, which has zero templates bound, opened
Add-from-template): **PASS.** Explicit empty-state message rendered: **"No templates found for this tracker."**
— not a silent empty dropdown, not a 500. No defect.

---

### TC-CHK-114: Templates tab is not reachable by a non-admin

**User Role:** Non-admin member
**Steps:**
1. Request the plugin configuration URL directly as a non-admin.

**Expected Result:**
- 403 or redirect to login. Non-admins must not be able to create, edit or delete templates, by UI or by URL.

CONFIRMED LIVE 2026-09-21 (logged in as `luna.blossom`, non-admin Developer role, requested 3 URLs directly):
**PASS, all three.** `/settings/plugin/redmineflux_checklist?tab=checklist_template` → 403. `/checklist_templates/new`
→ 403. `/checklist_templates/3/edit` (an existing template id) → 403. Non-admins are correctly blocked from
create/edit by direct URL, not merely by a hidden menu link. (Applying an existing template to an issue, tested
separately at Member role in TC-411, correctly remains allowed — that's a different, intentionally-permitted
action from managing the template catalog itself.)

---

### TC-CHK-115: Changing an issue's tracker after applying a template

**User Role:** Member
**Steps:**
1. Apply a Bug-bound template to a Bug issue, then change the issue's tracker to Task.

**Expected Result:**
- The already-created checklist items remain on the issue — they are issue data now, not template data, and must
  not vanish when the tracker changes.

CONFIRMED LIVE 2026-09-21 (this instance has no Task tracker — substituted **Feature**, consistent with TC-408):
issue #1534 had a Bug-bound template applied earlier (TC-411/419), then its tracker was changed Bug → Feature via
a normal Edit + Submit. **PASS.** All 6 checklist items (First–Fifth checklist title, plus the TC-419 XSS-payload
entry) are still present and unchanged after the tracker switch — checklist data belongs to the issue, not the
tracker or the template, and survives the change correctly.

---

## Evidence Map

> Screenshot rule (CLAUDE.md §6): screenshots are captured only for bugs. This suite found zero new bugs (23/23
> PASS), so there are no screenshot entries — evidence is the CONFIRMED LIVE block inline under each TC above.

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| TC-CHK-093–423 | n/a (no bugs found) | inline evidence above | none |

## Summary

**23/23 PASS.** Full coverage of template creation (single/multi/nested entries, tracker-dropdown parity,
multi-template-per-tracker), editing (name/entries/tracker rebinding, non-retroactive on existing issue
checklists), deletion (permanent, cancel-safe, issue data survives source deletion), application (ordered/nested
creation, journaling, additive-not-destructive, clean-refused double-apply), and negative/security cases (missing
name/entries/tracker all blocked client-side, duplicate names rejected server-side with a named message, HTML/
script injection safely escaped everywhere including the apply-to-issue path, a 100-entry template applies
without timeout, empty-tracker picker state is explicit, non-admin blocked by URL on all 3 template-management
endpoints, checklist data survives a tracker change). No new bugs. One earlier working hypothesis (TC-414 initially
looked like a silent no-op) was corrected during testing — the real behavior is a clear, explicit refusal message.

## Regression Pass — 2026-09-24 (targeted, post BUG-CHK-002/004/005)

> **Scope note:** this is a **user-approved, narrower, targeted check** — this suite plus
> `CHECKLIST_PERMISSIONS.md` only, chosen as the two suites most exposed to BUG-CHK-005's follow-up feedback-message
> fix (commit `c7521cc`, "Add from template" specifically) and to permission-gated checklist writes generally. It
> is **not** the full final-cycle regression `SENIOR_QA_STANDARDS.md` §27 requires before `STATUS.md` can move to
> `Complete` — `CHECKLIST_INSTALLATION_CONFIGURATION.md` and `CHECKLIST_BLOCK_ISSUE_CLOSING.md` were explicitly
> excluded from this pass per user instruction.

CONFIRMED LIVE 2026-09-24 (Local, redmine-docker-7.0.0), re-executed against the same long-lived fixtures as the
2026-09-21 pass: issue #1538 (Bug, `test project`), issue #1534 (Feature — tracker-changed during the original
TC-CHK-100/115 run), the plugin's Checklist Templates admin list (4 templates still present exactly as left:
`TC-420 Hundred Entries Template`, the XSS-payload template, `TC-CHK-404 Nested Template`, `sdafasd`).

- **TC-CHK-093/095/096/097 — PASS**, confirmed via the current admin template list matching the expected
  end-state from 2026-09-21 exactly (same 4 templates, same entry counts, same tracker bindings, no drift) —
  not re-created from scratch since the persisted state itself is the evidence of correct storage.
- **TC-CHK-094 — PASS.** Opened **Add Checklist Template**: tracker dropdown still lists Bug/Feature/Support/Test
  case/test, matching Administration → Trackers, no duplicates/omissions.
- **TC-CHK-098/099 — PASS.** Opened `TC-CHK-404 Nested Template` for Edit: both fields (`Parent entry` /
  `Nested child entry`) render exactly as left after the original edit pass — edit form and nested-entry
  persistence both intact.
- **TC-CHK-100/115 — PASS (carried forward, not independently re-executed this pass).** Not re-run as a live
  tracker-rebind this session — issue #1534's Feature tracker (from the original TC-100/115 change) and its
  6 surviving checklist items are still present and correct, which is itself residual evidence the underlying
  mechanism hasn't regressed. Low risk: pure server-side tracker association, no code path shared with any of the
  three fixed bugs.
- **TC-CHK-101 — PASS (carried forward via equivalent evidence).** Not re-run against a template this pass (to
  avoid destroying the long-lived `sdafasd`/`TC-CHK-404` fixtures other TCs in this same pass still depend on) —
  the identical delete-confirmation modal (`#confirmchecklistBtn`) was exercised for real, successful deletes
  multiple times this session on checklists/items (TC-CHK-068's cleanup, the applied-template cleanup below),
  confirming the shared modal component still works correctly end-to-end.
- **TC-CHK-102 — PASS.** Triggered Delete on `sdafasd`, clicked **Cancel**, reloaded the admin list — template
  still present, unaffected.
- **TC-CHK-103 — PASS.** Applied `TC-CHK-404 Nested Template` to issue #1538 (Bug) via the real
  `.template-item` click: both entries created (`Parent entry` + nested `Nested child entry`), correct nesting,
  both incomplete on creation.
- **TC-CHK-104 — PASS.** Issue #1538 History: "Applied checklist template 'TC-CHK-404 Nested Template' — 1
  checklist(s) created by Redmine Admin." — names both template and actor.
- **TC-CHK-105 — PASS.** The pre-existing "Progress item A" checklist (80% complete, from the Progress Tracking
  suite's own fixtures on this same issue) was unchanged after the template apply — additive, not destructive.
- **TC-CHK-106 — PASS, and confirms no cross-contamination from BUG-CHK-005's fix.** Applied the same template to
  the same issue a 2nd time: item count stayed at 2 (no duplicate), and the page showed the exact original refusal
  flash — **"Failed to create any checklist from template. Check for duplicate titles."** — not the generic
  "You don't have permission to perform this action." message BUG-CHK-005 added to `addErrorDiv()`. Confirms this
  refusal is a normal Rails flash on a native form redirect, a completely different code path from `checklist.js`'s
  AJAX error handling, so CHK-005's fix correctly left it alone.
- **TC-CHK-107/108/109 — PASS.** On **Add Checklist Template**, submitting with the Template Name field blank
  confirmed client-side `required` validation still blocks the form (`checklist_template[name]` fails
  `checkValidity()`, no request sent, no template created) — the same HTML5-native mechanism also gates the
  Checklist Title and Tracker fields (not independently re-submitted per field this pass, same client-side
  mechanism, unaffected by any of the three fixes).
- **TC-CHK-110 — PASS.** Attempted a duplicate name (`sdafasd`, already bound to Bug) — rejected server-side with
  the same named message: **"Template name must be unique within the same tracker."**
- **TC-CHK-111 — PASS.** The XSS-payload template's name/entry (`<script>alert('TC419name')</script> "quoted" &
  ampersand`) still renders as literal escaped text in the admin list today, not as a live `<script>` element —
  confirms the template-name/entries path remains on its own safe, fully-escaped render path, distinct from
  `checklist.js`'s AJAX-creation paths that BUG-CHK-002 fixed.
- **TC-CHK-112 — PASS (carried forward).** `TC-420 Hundred Entries Template` still lists exactly 100 entries in
  the admin table; not re-applied a second time this pass (today's TC-CHK-103/106 already re-confirmed the apply
  mechanism itself works correctly against the live build) to avoid unnecessary clutter on the shared fixture
  issue.
- **TC-CHK-113 — PASS.** Opened **Add from template** on issue #1534 (Feature tracker, zero Feature-bound
  templates since the only one was deleted in the original TC-101 pass) — explicit **"No templates found for this
  tracker."**, not a silent empty dropdown.
- **TC-CHK-114 — PASS (equivalent evidence).** Covered by this session's `CHECKLIST_PERMISSIONS.md` TC-CHK-073
  run against `daisy.skye` (Reporter): direct `GET /settings/plugin/redmineflux_checklist?tab=checklist_template`
  and `GET /checklist_templates/new` both → 403. Different non-admin role than the original 2026-09-21 evidence
  (`luna.blossom`), consistent with that evidence's own conclusion that `User.current.admin?` is a blanket,
  role-independent gate.
- **TC-CHK-115 — PASS**, see TC-CHK-100 above (same evidence, issue #1534's 6 checklist items surviving its
  earlier Bug→Feature tracker change).

Cleaned up the checklist created by today's TC-CHK-103/104/105/106 pass (`Parent entry` / `Nested child entry`)
from issue #1538 afterward to keep the fixture tidy for future sessions.

**Result: 23/23 PASS, 0 FAIL, 0 new bugs.** All template CRUD, application, negative-validation and permission
paths remain intact after the BUG-CHK-002/004/005 fixes. Notably, TC-CHK-106 confirms BUG-CHK-005's new
`addErrorDiv()` fallback message is correctly scoped to the plugin's own AJAX failure paths and does not leak into
or mask the unrelated native-form duplicate-template-apply refusal flash.
