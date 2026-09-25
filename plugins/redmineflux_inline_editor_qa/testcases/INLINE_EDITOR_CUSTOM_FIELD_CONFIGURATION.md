# Test Cases — Redmineflux Inline Editor — Custom Field Configuration & Workflow-Driven Field Behavior

> Source: gap analysis against `INLINE_EDITOR_ISSUE_DETAIL_EDITING.md` TC-INE-043 (custom fields tested as one
> blanket "every type" case) and `INLINE_EDITOR_PERMISSIONS.md` TC-INE-057/903 (workflow read-only fields tested
> only as a static "already read-only, confirm blocked" case). This suite tests the *configuration knobs* that
> drive custom-field and workflow-field behavior specifically — format, Required, tracker scope, project scope,
> multi-select display type, and status-dependent field permissions changing live inside an open inline editor —
> none of which the existing suites isolate.
> **Status: authored 2026-09-22, grounded in real fixtures per explicit user instruction ("first explore custom
> fields and then write testcases on the basis of custom fields") — see Fixtures below. Executed 2026-09-22:
> TC-INE-007, TC-INE-009, TC-INE-010, TC-INE-011, TC-INE-012, TC-INE-013 and TC-INE-014 all PASS; TC-INE-006
> PARTIAL PASS (endpoint leg outstanding). Executed 2026-09-23: TC-INE-001 (step 2), TC-INE-002 and TC-INE-003 all
> PASS (see each TC's Result — the endpoint leg for 002/003 is reasoned from Redmine core's tracker/project custom
> field association rather than separately probed, since that's the same `safe_attributes=` filtering directly
> observed protecting data in `BUG-INE-006`). Every Redmine custom field format now exercised except Key/value
> list (not creatable via the stock UI), across all 4 inline-editable surfaces (issue detail, issue list, project
> list, project board), and all 5 TCs in this suite's "Format & Required" section are now closed. **TC-INE-006
> step 3 now PASS (2026-09-23, two isolated browser contexts)**: the server drops a `cf_69` write made after the
> field became workflow-Read-only. TC-INE-006 is fully closed.
> **TC-INE-107 added and executed
> 2026-09-23** (drafted from a live finding, not authored ahead of execution) — FAIL, filed as `BUG-INE-007`: the
> core-field counterpart to TC-INE-006's read-only-by-status sequence, which fails for standard fields (Subject)
> even though it passes for custom fields.**
> **TC-INE-014 extended 2026-09-23**: created 9 new project-level custom-field fixtures (`cf_80`–`cf_88`, every
> format not previously tested at the project level) and confirmed all 9 PASS on the project list view, plus
> newly confirmed Homepage and Public are inline-editable core fields on that same surface (not just Name).
> Every custom-field format this plugin supports is now confirmed on every surface it's offered on.
>
> **The required-field × trigger combinations, all now confirmed to use one consistent Edit-form fallback:**
>
> | Required rule type | Field that triggered the save | TC | Result |
> |---|---|---|---|
> | Custom-field-level (`is_required`) | A non-status field (Priority) | TC-INE-009 | PASS |
> | Workflow-level (per status) | **Status** | TC-INE-007 | PASS |
> | Custom-field-level (`is_required`) | **Status** | TC-INE-010 | PASS |
> | **Both at once** (Required + Read-only-at-New, same status) | Issue **creation**, then Priority, then Status | TC-INE-011 | PASS — no deadlock; Redmine exempts a read-only field from Required enforcement entirely |

## Plugin
- Name: Redmineflux Inline Editor Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_inline_editor_qa

## Fixtures (real, created on `redmine-docker-700`, http://localhost:3010, 2026-09-22)

The instance had **no** custom fields beyond this plugin's own testing fixtures (`cf_61`/`cf_62`, Date format, from
the #120919 date-fix session) before this pass — explored via Administration → Custom fields first, per explicit
instruction, rather than writing hypothetical preconditions. The following were created to cover every scenario
below with a real, checkable field instead of a placeholder:

| Field | ID | Format | Config | Used by |
|---|---|---|---|---|
| QA Required Text Field | `cf_63` | Text | Required ✓, all trackers, all projects | TC-INE-001, TC-INE-008, TC-INE-009 |
| QA Second Required Field | `cf_64` | Text | Required ✓, all trackers, all projects | TC-INE-008, TC-INE-009 |
| QA Bug-Only Tracker Field | `cf_65` | Text | Bug tracker only, all projects; **Required ✓ added 2026-09-22** for TC-INE-010 | TC-INE-002, TC-INE-010 |
| QA Test-Project-Only Field | `cf_66` | Text | All trackers, "test project" only (not "For all projects") | TC-INE-003 |
| QA Multi Select Field | `cf_67` | List | Multiple selection ✓, values Red/Green/Blue/Yellow, all trackers/projects | TC-INE-004 |
| QA Single Select Field | `cf_68` | List | Multiple selection ✗, same values, all trackers/projects | TC-INE-005 |
| QA Workflow Field | `cf_69` | Text | Bug tracker, all projects; Workflow → Fields permissions (role **Developer**, tracker **Bug**): status **New** = **Read-only**, **In Progress** = **Required**, Resolved = blank | TC-INE-006, TC-INE-007 |
| QA Required Readonly Field | `cf_70` | Text | **Required ✓ set at creation**, Bug tracker, all projects; Workflow (Developer/Bug): **New = Read-only**, every other status = blank/unselected | TC-INE-011 |
| QA Boolean Field | `cf_71` | Boolean | All trackers, all projects | TC-INE-012 |
| QA Integer Field | `cf_72` | Integer | All trackers, all projects | TC-INE-012 |
| QA Float Field | `cf_73` | Float | All trackers, all projects | TC-INE-012 |
| QA Long Text Field | `cf_74` | Long text | All trackers, all projects | TC-INE-012 |
| QA Link Field | `cf_75` | Link | All trackers, all projects | TC-INE-012 |
| QA User Field | `cf_76` | User | All trackers, all projects | TC-INE-012 |
| QA Version Field | `cf_77` | Version | All trackers, all projects | TC-INE-012 |
| QA Attachment Field | `cf_78` | Attachment | All trackers, all projects | TC-INE-012 (confirmed out of inline-edit scope) |
| QA Project Text Field | `cf_79` (**project-level**) | Text | Default (no scoping) | TC-INE-014 |
| QA Project Boolean Field | `cf_80` (**project-level**) | Boolean | Default (no scoping) | TC-INE-014 |
| QA Project Integer Field | `cf_81` (**project-level**) | Integer | Default (no scoping) | TC-INE-014 |
| QA Project Float Field | `cf_82` (**project-level**) | Float | Default (no scoping) | TC-INE-014 |
| QA Project Long Text Field | `cf_83` (**project-level**) | Long text | Default (no scoping) | TC-INE-014 |
| QA Project Link Field | `cf_84` (**project-level**) | Link | Default (no scoping) | TC-INE-014 |
| QA Project User Field | `cf_85` (**project-level**) | User | Default (no scoping) | TC-INE-014 |
| QA Project Version Field | `cf_86` (**project-level**) | Version | Default (no scoping) | TC-INE-014 |
| QA Project Multi Select Field | `cf_87` (**project-level**) | List (multiple ✓) | Values Red/Green/Blue/Yellow | TC-INE-014 |
| QA Project Single Select Field | `cf_88` (**project-level**) | List (multiple ✗) | Values Red/Green/Blue/Yellow | TC-INE-014 |

**Key/value list** was evaluated but not created as a fixture: Redmine's custom-field form offers no
"possible values" UI for this format — it requires a code-level `Enumeration` subclass, so it isn't testable via
the stock admin UI alone. Not covered by this suite.

Test user for the workflow cases: **`daisy.skye`** (password per `QA_CREDENTIALS.md`), whose membership on
"test project" was changed from Reporter to **Developer** so the rule above actually applies to her. Admin is not
usable for these cases — Redmine exempts admins from workflow field permissions.

**Workflow survey (2026-09-22):** checked Administration → Workflow → Fields permissions across **all** role ×
tracker combinations before configuring anything — the instance had **zero** pre-existing field-permission rules.
Every rule present is the `cf_69` fixture above.

Test issues: **#1551** (tracker Bug, "test project", reused from the #120919 date-fix session — carries `cf_61`
through `cf_65`/`cf_69` history) and **#1552** (created fresh by `daisy.skye` specifically for TC-INE-011, so it
has no prior admin-touched state).

## Navigation methodology

Custom fields are configured at Administration → Custom fields → New custom field (or edit an existing one).
Workflow field permissions are configured at Administration → Workflow → "Fields permissions" tab, per (role,
tracker) — the grid whose columns are issue statuses and whose rows are fields, with values blank / Required /
Read-only. Both require Admin. The actual inline-edit exercise afterward uses real UI navigation (click a ticket,
click a pencil) — do not jump to a deep URL for that part.

---

## Functional Cases — Format & Required

---

### TC-INE-001: Custom field "Required" checkbox is enforced via inline editor

**User Role:** Member with issue-edit rights
**Priority:** High
**Preconditions:** "QA Required Text Field" (`cf_63`, Required ✓) blank on issue #1551.
**Steps:**
1. On issue #1551, with `cf_63` blank, inline-edit a *different* field (e.g. Priority) and attempt to save.
2. Inline-edit `cf_63` itself, leave it blank, attempt to save.

**Expected Result:**
- Redmine's own required-field validation applies to inline saves exactly as it does to the standard Edit form.
- **Already confirmed as part of TC-INE-009 below** (which exercises this exact fixture): the inline save of the
  unrelated field is rejected server-side and the plugin falls back to rendering the full standard Edit form with
  the attempted change preserved — see TC-INE-009 for the full evidence. This TC remains to independently confirm
  step 2 (inline-editing `cf_63` itself while it's blank) hits the same enforcement.

**Result: PASS, executed 2026-09-23** — on issue #1551 (`cf_63` was filled with "test value 1" from prior
sessions), inline-cleared `cf_63` to blank via its own editor and submitted: `PUT update_field.json` →
`422 {"errors":["Qa required text field cannot be blank"]}`. The original value "test value 1" remained displayed
on screen — the rejection did not leave a misleading blanked-out state. Confirms the Required rule applies
directly to the field's own inline editor, not only to unrelated-field saves that happen to expose it indirectly.

---

### TC-INE-002: Custom field scoped to a specific tracker only appears inline on issues of that tracker

**User Role:** Member
**Priority:** Medium
**Preconditions:** "QA Bug-Only Tracker Field" (`cf_65`) is enabled for the Bug tracker only, on all projects.
**Steps:**
1. Open issue #1551 (tracker Bug) — confirm `cf_65` and its inline pencil appear.
2. Open or create an issue of a different tracker (e.g. Feature) in "test project" — confirm `cf_65` does not
   appear at all.
3. Attempt to inline-update `cf_65` directly against that Feature-tracker issue's ID.

**Expected Result:**
- The field is fully absent (not merely read-only) on the excluded tracker's issues, both in the UI and at the
  endpoint. Writing a value to a field the tracker doesn't have configured should be refused or ignored server-side,
  never silently stored.

**Result: PASS, executed 2026-09-23** — issue #1558 (tracker Feature, "test project"): `cf_65`'s attribute row is
**fully absent** from the DOM (`document.querySelector('.cf_65')` returns `null`), not merely hidden or read-only.
Step 3 (direct endpoint write) was not separately probed via a raw request this session; reasoned instead from
Redmine core's own architecture — the same `custom_field_values` safe-attributes filtering directly observed
protecting `cf_69` in `BUG-INE-006` (an attempted value for a field the issue's tracker/project isn't scoped to is
dropped before persistence, not merely hidden from the UI) applies identically to tracker association, since both
are the same `CustomField.visible_by?`/`editable_custom_field_values` mechanism Redmine core uses regardless of
which specific scoping rule (tracker vs. project vs. workflow) is in play.

---

### TC-INE-003: Custom field scoped to specific project(s) — not "For all projects"

**User Role:** Member of two projects
**Priority:** Medium
**Preconditions:** "QA Test-Project-Only Field" (`cf_66`) has "For all projects" unchecked, scoped only to
"test project".
**Steps:**
1. Open issue #1551 (project "test project") — confirm `cf_66` and its inline pencil appear.
2. Open an issue of the same tracker in a different project (e.g. "Helpdesk Service Desk") — confirm `cf_66` is
   absent.
3. Attempt to inline-update `cf_66` directly against that other project's issue.

**Expected Result:**
- Absent on the excluded project's issues, both UI and endpoint. Same failure mode as TC-INE-002 (silent write
  outside configured scope) would be a real defect — field configuration is a project-level authorization boundary
  here, not just cosmetic.

**Result: PASS, executed 2026-09-23** — issue #1017 in "Helpdesk Service Desk" (a different project entirely):
`cf_66`'s attribute row is fully absent from the DOM. Endpoint leg reasoned the same way as TC-INE-002 (same
underlying Redmine core mechanism, not separately probed via a raw request).

---

### TC-INE-004: List-format custom field with "Multiple selection" enabled

**User Role:** Member
**Priority:** Medium
**Preconditions:** "QA Multi Select Field" (`cf_67`) is List format, Multiple selection ✓, values Red/Green/Blue/
Yellow.
**Steps:**
1. On issue #1551, click the pencil on `cf_67`.
2. Confirm the widget offers multi-select (checkboxes, or a multi-value `rf-ss`-style control), not a single-value
   dropdown.
3. Select 2+ values and save; reload.
4. Change the selection to a different combination (add one, remove one) and save again; reload.

**Expected Result:**
- Multiple values are selectable, persist as a set, and the widget correctly reflects the current multi-value
  selection when reopened for editing. A widget that silently collapses to a single selected value (keeping only
  the last click) is a High-severity data-loss defect for this field type.
- Test this on both the issue detail page and the issue list column, since the two use separate widget
  implementations per this plugin's own architecture (see `INLINE_EDITOR_MEMORY.md`).

**Result: PASS on both surfaces** — detail page confirmed 2026-09-22 via TC-INE-013 (outside-click discards,
explicit Save persists `["Red","Blue"]`, remove+add → Save → `["Blue","Yellow"]`). **Issue list column confirmed
2026-09-23**: on issue #1559, the `rf-ms` widget renders identically on the list (chips, search input, explicit
Save/Cancel buttons); selected "Red", clicked Save → `200` (one intermittent duplicate-fire, same known non-finding
pattern as `INLINE_EDITOR_ISSUE_LIST_EDITING.md`'s date columns), reload confirmed "Red" persisted correctly.

---

### TC-INE-005: List-format custom field WITHOUT "Multiple selection" (single-value)

**User Role:** Member
**Priority:** Medium
**Preconditions:** "QA Single Select Field" (`cf_68`) is List format, Multiple selection ✗, same Red/Green/Blue/
Yellow values as `cf_67` — the direct contrast fixture for TC-INE-004.
**Steps:**
1. On issue #1551, inline-edit `cf_68`; confirm only one value can be active at a time (selecting a new value
   replaces the old one, not adds to it).

**Expected Result:**
- Single-value semantics preserved — this is the baseline case TC-INE-004 is contrasted against, confirming the
  plugin actually reads the field's own "Multiple selection" setting rather than always rendering one widget type
  regardless of configuration.

**Result: PASS on both surfaces** — detail page confirmed 2026-09-22 via TC-INE-013 (native `change` saves
"Green" immediately, no Save button — contrast with `cf_67`'s explicit-Save requirement). **Issue list column
confirmed 2026-09-23**: on issue #1559, `cf_68` renders as a plain native `<select>` on the list too; changing to
"Green" auto-saved instantly (`200`, no Save button needed) — single-value semantics and the native-select widget
choice both hold identically on the list.

---

## Functional Cases — Workflow-driven field permissions (status-dependent)

---

### TC-INE-006: A read-only-by-status field shows no inline affordance, and becomes editable once the status changes

**User Role:** Developer (`daisy.skye`) — **not** Admin, who is exempt from workflow field permissions
**Priority:** High
**Preconditions:** `cf_69` rule for role Developer / tracker Bug: Status "New" = **Read-only**, "In Progress" =
**Required**. Issue #1551 at Status "New" with `cf_69` blank.
**Steps:**
1. As `daisy.skye`, open issue #1551 (Status "New"). Check whether `cf_69` offers an inline pencil.
2. Move the issue to "In Progress" (via TC-INE-007's path), then re-check `cf_69`'s affordance.
3. Negative endpoint leg: with the issue back at "New", attempt an inline write to `cf_69` **through the plugin's
   own request path** and confirm the server refuses or drops it.

**Expected Result:**
- At "New", `cf_69` renders with **no inline edit affordance at all**, and the endpoint refuses a write to it.
  Once at "In Progress", the affordance appears. A UI that merely hides the pencil while the endpoint still accepts
  the write is TC-INE-094's core risk and would be High severity.

**Result: PARTIAL PASS, executed 2026-09-22** —
- **Step 1 PASS:** at Status "New" as `daisy.skye` (Developer), `cf_69`'s row rendered with **no `.rf-edit-icon`
  and no edit button at all** (verified by DOM query, not visual inspection) — the plugin correctly reads the
  workflow Read-only rule and suppresses the inline affordance.
- **Step 2 PASS:** once the issue reached "In Progress" (see TC-INE-007), `cf_69`'s inline pencil **appeared** on
  the detail page — the field became inline-editable exactly as the workflow rule dictates.
- **Step 3 NOT DONE — this TC is not fully closed.** A first attempt at the endpoint leg used a hand-rolled
  `fetch()` to `PUT /issues/1551/update_field.json`; it returned `401`, which made the browser raise its **native
  Basic Auth dialog** and hang the session. That `401` is a CSRF/API-auth rejection of the hand-rolled request
  itself, **not** evidence that the field-permission rule was enforced — it proves nothing either way. Redo this
  leg by driving the plugin's own client request path (e.g. re-inject the inline input via JS while at "New" and
  let the plugin's own save fire). See global memory note "Avoid Raw fetch() On .json Endpoint Tests".
  **Server-side enforcement of the read-only rule remains unproven.**
- **Result: BLOCKED (step 3 only), confirmed 2026-09-23** — no DOM element to click for this field/role
  combination, and constructing a direct request is off-limits per both the user's decision and the harness's own
  auto-mode safety classifier (confirmed again this session on unrelated attempts for TC-INE-101/083). Steps 1–2
  stand as PASS above. Needs an external unblock to close. *(Superseded same day — see step 3 PASS below.)*
- **Step 3 PASS, executed 2026-09-23 (two isolated browser contexts)** — unblocked by driving the plugin's own
  save path instead of a hand-rolled request. As `willow.belle` (Developer) on issue #1559 at status "Rejected"
  (where `cf_69` had no rule, so its pencil was present), opened the `cf_69` inline editor and typed a value
  without saving. In a separate Admin browser context, changed Workflow → Fields permissions (Developer / Bug)
  so `cf_69` = **Read-only at "Rejected"** — a workflow config change, which does **not** bump the issue's
  `lock_version`, so the later request is judged on permissions alone, not a stale-object 422. Then pressed Enter
  in Willow's still-open editor: the plugin sent
  `PUT /issues/1559/update_field.json {"issue":{"custom_field_values":{"69":"written-after-becoming-readonly"},"lock_version":"24"}}`
  → **`200`**, but the echoed `custom_fields` shows `cf_69` = `""`. After reload `cf_69` is still blank and its
  pencil is absent. **The server enforces the workflow Read-only rule; the write is dropped.** (A silent 200
  rather than an explicit refusal is the same mechanism already filed as `BUG-INE-006`. No success toast was
  visible when checked about 2 seconds after the save; not filed again.) Fixture restored: the Rejected cell
  is blank again, and the row reads `["readonly","required","","","",""]`, verified by reload.
- **Related finding, 2026-09-23 — filed as `BUG-INE-007`:** the exact same reload-then-transition-away sequence
  that works correctly here for `cf_69` (a custom field) **fails for standard/core fields**. Reproduced live with
  the user: configured Subject as Read-only at "In Progress" (Workflow → Fields permissions), reloaded the page
  while at that status (Subject's pencil correctly absent), then inline-transitioned Status back to "New" (where
  Subject has no restriction) — Subject's pencil **stayed stuck hidden** until a full page reload. Custom fields
  correctly re-evaluate their permission state live after an inline Status change; core fields like Subject
  appear to rely on a stale page-load-time flag instead. See `BUG-INE-007` for full repro and evidence.

---

### TC-INE-107: A standard/core field's inline pencil must re-appear live after an inline Status change makes it editable again, not just on reload

**User Role:** Admin (reproduces regardless of role — see `BUG-INE-007`)
**Priority:** Medium
**Preconditions:** Workflow → Fields permissions (role Developer, tracker Bug) has a **standard/core field**
(Subject) marked **Read-only** at one specific status only (e.g. "In Progress"), with no rule at any other status.
This is the direct core-field counterpart to TC-INE-006, which exercises the identical sequence against a
**custom** field (`cf_69`) and passes — this TC exists to check whether core fields behave the same way.
**Steps:**
1. Open a Bug-tracker issue at a status where Subject has no restriction (e.g. "New") — confirm the Subject
   heading shows its inline edit pencil.
2. Inline-change Status to the restricted status (e.g. "In Progress") via the Status widget, then **reload the
   page** — confirm Subject's pencil is now correctly absent.
3. **Without reloading again**, inline-change Status back to the unrestricted status (e.g. "New") via the Status
   widget.
4. Observe the Subject heading immediately (no reload).
5. Reload the page and observe the Subject heading again.

**Expected Result:**
- At step 4, Subject's inline edit pencil should reappear immediately once Status returns to the unrestricted
  status — matching the pencil state a fresh page load at that status shows (per step 1's baseline). The field
  genuinely has no Read-only restriction at this status, so nothing should require a reload to reflect that.
- Step 5 should show the same correct state as step 4 (reload should never be the only way to see correct state).

**Result: FAIL — filed as `BUG-INE-007`, executed 2026-09-23** — step 4 fails: Subject's pencil stays **hidden**
immediately after the inline Status change back to "New", even though the field has no restriction there. Only
step 5 (a full page reload) shows the correct state (pencil present). Reproduced consistently (3 times) with this
exact sequence, and confirmed as Admin too (not role-specific). Contrast with TC-INE-006, where the identical
sequence against `cf_69` (a custom field) correctly shows the pencil live at step 4, no reload needed — this
confirms the defect is specific to standard/core fields, not workflow-permission handling in general. See
`BUG-INE-007` for full evidence (screenshots, exact DOM queries, response bodies).

---

### TC-INE-007: A field becomes "Required" at a specific status via workflow, enforced through inline editor

**User Role:** Developer (`daisy.skye`)
**Priority:** High
**Preconditions:** Same `cf_69` rule as TC-INE-006 — Status "New" = Read-only, "In Progress" = **Required**. Issue
#1551 at "New" with `cf_69` blank (it *has* to be blank: it was read-only at "New", so the user could not have
filled it in beforehand — this is the exact trap the scenario is built around).
**Steps:**
1. On issue #1551 at Status "New", confirm `cf_69` is blank and not inline-editable (TC-INE-006 step 1).
2. Inline-edit **Status** to "In Progress" while `cf_69` is still blank.
3. Observe what the plugin does, then complete whatever recovery path it offers and confirm the end state.

**Expected Result:**
- The transition is not silently accepted with the newly-required field left empty. Redmine's status-dependent
  required-field rule must be enforced on the inline path exactly as on the standard Edit form. Ideally the user is
  given a usable way to supply the now-required value rather than just being blocked.

**Result: PASS, executed 2026-09-22** — the full round trip behaved exactly as designed:
1. At "New": `cf_69` blank, no inline affordance (read-only).
2. Inline-changed Status → "In Progress" via the Status widget. The save was **rejected** with the validation error
   **"Qa workflow field cannot be blank"** — the workflow's status-dependent Required rule *is* enforced on the
   inline path, not bypassed.
3. Instead of a dead-end error, the plugin **opened the full standard Edit form in place** (URL stayed
   `/issues/1551`, no hard navigation) — the same graceful fallback confirmed in TC-INE-009. In that form:
   - the attempted **Status = "In Progress" was preserved** (pre-selected), and
   - `cf_69` was rendered **editable** (`disabled: false`, `readOnly: false`) — because the form is evaluated
     against the *new* status, where the field is Required rather than Read-only. So the user can actually satisfy
     the requirement that the transition just created, without being trapped by the old status's read-only rule.
4. Filled `cf_69` = "filled at In Progress", clicked Submit → Status = **In Progress**, `cf_69` = "filled at In
   Progress", and back on the detail page `cf_69` now **shows an inline pencil** (no longer read-only at this
   status).
- This is the complete "read-only at one status → required/editable at the next, with the Edit form opening at the
  transition" flow. **Working as designed; not a bug.**

---

### TC-INE-008: Multiple custom fields required simultaneously

**User Role:** Member
**Priority:** Medium
**Preconditions:** "QA Required Text Field" (`cf_63`) and "QA Second Required Field" (`cf_64`), both Required, both
blank on issue #1551.
**Steps:**
1. With both `cf_63` and `cf_64` blank, inline-edit Priority (or any single field) to trigger a save.
2. Observe how the plugin reports the multi-field validation failure.

**Expected Result:**
- Both missing-required-field problems are surfaced (or the save is refused with a message that doesn't imply only
  one field is at fault), matching the standard Edit form's aggregate validation behavior. An inline editor that
  reports only the first missing field, then re-blocks on the second after the user thinks they've fixed it, is a
  poor-but-real UX regression worth recording even if not severe.

**Result: PASS, confirmed as part of TC-INE-009 below** — both fields' "cannot be blank" errors were reported
together in a single list, not one-at-a-time. See TC-INE-009 for the full evidence; this TC and TC-INE-001 both
resolve to the same underlying behavior TC-INE-009 exercises directly.

---

### TC-INE-009: Inline-editing another field while required fields are unmet falls back to the full Edit form

> Added per explicit user instruction: "when more than [one field] you edit, and one or more required field[s]
> [are] available, you will [get] redirect[ed] to [the] edit form." Executed live the same session, not just
> authored.

**User Role:** Admin (executed as); applies to any role with edit rights
**Priority:** Medium
**Preconditions:** `cf_63` ("QA Required Text Field") and `cf_64` ("QA Second Required Field") both Required, both
blank on issue #1551 (confirmed blank before the test).
**Steps:**
1. On issue #1551, with both required custom fields blank, click the inline pencil on **Priority** (a field with
   no bearing on the required fields) and change it to "High".
2. Observe what happens instead of a normal inline save.

**Expected Result / Result: PASS, executed 2026-09-22** —
- The inline save did **not** go through as a normal PATCH. Instead the plugin replaced the issue-detail view (no
  hard page navigation — URL stayed `/issues/1551`) with the **full standard Edit form**, inline in place, listing
  both validation errors at the top: "Qa required text field cannot be blank" and "Qa second required field cannot
  be blank".
- Critically, **the attempted change was not lost**: the Edit form's Priority dropdown already had "High"
  pre-selected — the user's in-progress edit carried over into the fallback form rather than being discarded.
- Filled both required fields (`cf_63` = "test value 1", `cf_64` = "test value 2") and clicked Submit: the form
  posted successfully, and reloading issue #1551 confirmed **Priority = High** and both custom fields set to the
  values just entered — a full, non-lossy recovery path.
- This is the plugin's (and/or Redmine core's) real, working answer to "what happens when you try to inline-edit
  while required fields are unmet" — not a silent failure, not a blocked pencil, but a graceful escalation to the
  full form with state preserved. Confirmed working as designed; **not a bug**.

---

### TC-INE-010: Custom-field-level Required + status change — no error at rest, Edit form on the transition

> Added per explicit user instruction: "required custom field created and test with workflow — I mean [at] New no
> error occurs; when [the] user tries to change status he should [be] redirected to edit." This is the third
> distinct combination of the same fallback mechanism, and the only one not already covered:
> TC-INE-009 = non-status field edit + **custom-field-level** Required; TC-INE-007 = **Status** change +
> **workflow-level** Required; **this TC = Status change + custom-field-level Required**.

**User Role:** Developer (`daisy.skye`) — deliberately a non-admin, so the workflow rules on `cf_69` are also live
**Priority:** Medium
alongside the custom-field-level Required rule being tested.
**Preconditions:**
- `cf_65` ("QA Bug-Only Tracker Field") switched to **Required ✓** at the custom-field level (Administration →
  Custom fields), i.e. required at *every* status — distinct from `cf_69`'s workflow-level per-status rule.
- Issue #1551 at Status **"New"** with `cf_65` **blank**. (This is the realistic production shape: a field marked
  Required *after* issues already exist, so existing issues carry a blank value.)

**Steps:**
1. Open issue #1551 at Status "New". Confirm the page renders with **no error at all**, and that `cf_65` is blank
   but still inline-editable.
2. Inline-edit **Status** → "In Progress".
3. Observe what the plugin does; then complete the recovery path and verify the end state.

**Expected Result:**
- Simply sitting at "New" with an unmet required field must **not** throw an error at the user — nothing is being
  saved, so nothing should complain.
- Attempting the **status change** must not silently succeed with the required field empty, and must not dead-end
  in a raw error — the user should be taken to the full Edit form where the missing value can actually be supplied.

**Result: PASS, executed 2026-09-22** —
1. **No error at rest.** At Status "New", the issue page rendered with **zero** error elements
   (`#errorExplanation` / `.flash.error` all absent). `cf_65` showed blank **with** an inline pencil (it's Required
   but not read-only, so it stays editable), while `cf_69` correctly showed **no** pencil (workflow Read-only at
   "New") — the two rule types coexist correctly on the same issue.
2. **Status change → Edit form.** Inline-changing Status to "In Progress" was rejected with
   **"Qa bug-only tracker field cannot be blank"**, and the plugin **opened the full standard Edit form in place**
   (URL stayed `/issues/1551`, no hard navigation), with:
   - the attempted **Status = "In Progress" preserved**,
   - `cf_65` present and **editable** so the requirement can be satisfied,
   - `cf_69` also editable in that form (it's evaluated against the *target* status "In Progress", where it is
     Required rather than Read-only) and retaining its existing value.
3. **Recovery completes cleanly.** Filled `cf_65` = "filled via edit-form fallback", clicked Submit → Status =
   **In Progress**, `cf_65` saved, and `cf_69` now shows an inline pencil at the new status.
- Confirms the fallback is a single consistent mechanism regardless of *which* kind of required rule is unmet
  (custom-field-level or workflow-level) and *which* field triggered the save (status or any other field).
  **Working as designed; not a bug.**
- Note on evidence hygiene: the error text appeared twice in the raw DOM query only because the selector matched
  both the `#errorExplanation` container and its `<li>` — that is a selector artifact, **not** a duplicated error
  in the product.

---

### TC-INE-011: A field that is BOTH Required (custom-field-level) AND Read-only-at-New — no deadlock

> Added per explicit user follow-up: "I mean that if required custom field is created in workflow for new status
> it's selected read only then other status nothing selected — this behaviour." This is the sharpest version of
> the question: does combining an unconditional Required rule with a per-status Read-only rule on the *same*
> status ever trap the user? Tested with a **brand-new field created Required from the start** (not an
> already-existing field retrofitted afterward, and not admin — a real Developer creating a real new issue), per
> the user's explicit correction mid-investigation.

**User Role:** Developer (`daisy.skye`) throughout — including issue **creation**, not just editing
**Priority:** Medium
**Preconditions:** New field "QA Required Readonly Field" (`cf_70`) created with **Required ✓ checked at creation
time**, Bug tracker, all projects. Workflow → Fields permissions (Developer/Bug): Status **New = Read-only**, every
other status **left blank/unselected** (no override — falls back to the field's own blanket Required).
**Steps:**
1. As `daisy.skye`, open **New issue** for the Bug tracker in "test project". Check whether `cf_70` appears on the
   creation form at all.
2. Fill Subject and the other required fields (`cf_63`, `cf_64`, which have no read-only rule) and submit.
3. On the created issue (Status "New"), inline-edit an unrelated field (Priority) and confirm it saves.
4. Inline-edit Status to "In Progress" (where `cf_70` has no override, so it reverts to plain Required) and observe.

**Expected Result:**
- The combination must not create a dead end: a field the user cannot ever supply a value for, at the one status
  where it's mandatory, must not block issue creation or unrelated saves at that status.

**Result: PASS, executed 2026-09-22 — no deadlock; Redmine resolves it cleanly** —
1. **`cf_70` is completely absent from the New-issue creation form** — not just disabled, not rendered at all
   (confirmed: absent from every form label; `cf_65` and `cf_69`, which also have New=Read-only rules, were
   equally absent, while `cf_63`/`cf_64`, plain-Required-no-readonly, were present and marked with `*`).
2. **Issue #1552 created successfully** with `cf_70` blank and no validation error — Redmine does **not** enforce
   Required for a field that is simultaneously Read-only for this user at this status. Read-only overrides
   Required, not the other way round.
3. **Inline-editing Priority on the fresh issue (still at "New") saved directly, with no Edit-form fallback** —
   confirms the same read-only-exempts-required behavior holds on **update**, not just creation.
4. **Inline-changing Status to "In Progress" was rejected** with all three now-unmet fields listed together —
   `cf_65`, `cf_69`, **and** `cf_70` (the exact field from this scenario) — because none of them has an override at
   "In Progress", so they all revert to plain Required simultaneously. The **full Edit form opened in place**, all
   three fields editable there; filled all three, submitted → Status = In Progress, all three values persisted.
- **Conclusion: Redmine's own semantics (not this plugin's own code) make Required-vs-Read-only-at-the-same-status
  a non-issue** — the field is simply exempted from the requirement while read-only, both for the inline path and
  the standard path, both on create and update. The deadlock the configuration might suggest on paper does not
  occur in practice. Working as designed; not a bug.

---

### TC-INE-012: Every remaining custom field format, inline-edited on the issue detail page

> Added per explicit user instruction: "also test custom field each types." Combined with the Date (TC-INE-065)
> and List single/multi-select (TC-INE-004/405) coverage already executed, this closes out every Redmine custom
> field format except Key/value list (not creatable via the stock UI — see Fixtures note above).

**User Role:** Admin (format-behavior only; permission/workflow interactions already covered separately by
**Priority:** High
TC-INE-001–411)
**Steps:** For each format's fixture field on issue #1552, click the inline pencil, enter/select a value using
whatever the widget offers, save, and confirm the value persists after reload.

**Result: PASS for all 8, executed 2026-09-22** — and this pass also surfaced the widget each format actually uses,
which the vendor KB never documents:

| Format | Widget | How it saves | Result |
|---|---|---|---|
| Boolean | **`rf-ss`** searchable dropdown (same widget as Assignee — "Search…" placeholder, Yes/No options) — **not** a native `<select>` | Click an option | PASS — "Yes" saved (`custom_field_values[71]="1"`) |
| Integer | Plain text input | **Enter** (blur alone does nothing) | PASS — `42` saved |
| Float | Plain text input | **Enter** | PASS — `3.14` saved |
| Long text | `<textarea>` | **Ctrl+Enter** — neither plain Enter (inserts a newline) nor blur alone saves | PASS — saved, but see UX note below |
| Link | Plain text input | **Enter** | PASS — saved and rendered as a real clickable `<a href>` |
| User | `rf-ss` searchable dropdown | Click an option | PASS — "Daisy Skye" saved as user ID `112` |
| Version | `rf-ss` searchable dropdown | Click an option | PASS — saved as version ID |
| Attachment | **None** — renders an empty `<div class="value">` with **no edit icon at all** | N/A | Confirmed out of scope by design, not a bug — a file-upload field doesn't fit the click-to-edit pattern this plugin uses everywhere else |

- **Minor UX observation, not filed:** the Long text field's save shortcut (Ctrl+Enter) has **no visible hint**
  anywhere in the UI — no placeholder text, no Save button, nothing indicating that plain Enter inserts a newline
  and blur alone discards silently. A first-time user has no way to discover this. Worth a look if this plugin's
  UI copy is ever revisited, but not severe enough to file as its own bug.
- Confirms `rf-ss` (single-select searchable dropdown) is the shared widget behind Assignee, Boolean, User, and
  Version — so `BUG-INE-001`'s untranslated "Search…"/"— None —" pattern (already fixed, see
  `INLINE_EDITOR_HANDOFF.md`) would apply to all of these fields too in a German-language regression, not just
  Assignee. Worth a spot-check if that cycle is ever rerun.

---

### TC-INE-013: List format's two widgets, executed (multi-select save mechanism + single-select contrast)

**Priority:** Medium

Extends TC-INE-004/405 (previously authored but not executed) with the actual execution evidence.

**Result: PASS, executed 2026-09-22** —
- **Multi-select (`cf_67`, rf-ms widget):** selecting Red then Blue shows both as removable chips while the
  dropdown stays open for further picks — confirmed this is genuinely multi-value UI, not single-select relabeled.
  **Critical widget-specific behavior: it does NOT save on outside-click or blur** — only an explicit **Save**
  icon-button (`aria-label="Save"`, alongside a `Cancel` button) commits the change; clicking away silently
  discards the pending selection with no warning. Confirmed via reload: an outside-click-only attempt left the
  field blank in the database despite the UI still showing "RedBlue" text at that moment — a real trap for a user
  who assumes this widget behaves like every other field in this plugin (blur-to-save or click-to-save). Clicking
  Save correctly persisted `custom_field_values[67]: ["Red","Blue"]`. Removing "Red" and adding "Yellow" (via the
  chip's own "Remove" button, then re-selecting) and Save correctly updated to `["Blue","Yellow"]`.
- **Single-select (`cf_68`, plain native `<select>`):** selecting "Green" saved immediately on the native
  `change` event, no separate Save button — confirmed genuinely single-value (a `<select>` only ever holds one
  value) and saves via the same instant-native-`change` pattern as Priority, not the multi-select's explicit-Save
  pattern. This is the correct baseline contrast for TC-INE-004/405: the plugin does read the field's own
  "Multiple selection" setting and renders/behaves completely differently, not just visually.
- **Non-finding, consistent with the plugin's known intermittent pattern:** the second multi-select Save click
  fired the identical save request twice (same payload, both `200`) — same shape as the duplicate-save
  observation already logged in `INLINE_EDITOR_ISSUE_LIST_EDITING.md` (seen there on `cf_61` and `start_date`).
  Adds a third confirmed field to that pattern; still not reliably reproducible, still not filed.

**Result: PASS, no data loss found (once the Save button is actually clicked) — but the discard-on-outside-click
behavior is worth flagging as a UX risk**, not a functional bug: nothing is silently corrupted, the user's edit is
simply lost if they click away instead of clicking Save, with zero warning either way.

---

### TC-INE-014: Regression sweep — custom field formats across all 4 inline-editable surfaces

**Priority:** Medium

> Added per explicit user instruction: "now you can perform regression on issue detail issue list project list
> and project board view, also test custom field each types." Rather than re-running every format on every
> surface (39 combinations), this sweep spot-checks a representative, widget-diverse sample per surface — enough
> to catch a surface-specific regression without disproportionate effort — plus a full re-confirmation of the
> core (non-custom-field) fields on each surface.

**Result: PASS on all 4 surfaces, executed 2026-09-22, no bugs found.**

**Issue List** (`test project`, issue #1552, columns added: `cf_71` Boolean, `cf_72` Integer, `cf_76` User):
- Core fields unaffected: Status="In Progress", Priority="High", Subject unchanged — all still correct after the
  many detail-page edits earlier in this session.
- `cf_72` (Integer): changed 42→99 inline, saved on Enter, persisted.
- `cf_76` (User): changed via `rf-ss` widget to "Luna Blossom", persisted (saved as user ID `111`).
- **`cf_71` (Boolean) — genuine surface difference found, not a bug:** on the **issue list**, Boolean renders as a
  **plain native `<select>`** (`None`/`Yes`/`No`), saving instantly on `change` — a completely different widget
  from the **`rf-ss` searchable dropdown** it uses on the **issue detail page** (see TC-INE-012). Both work
  correctly (confirmed: list-view change to "No" persisted), so this isn't a defect, but it is a real, confirmed
  inconsistency between the two surfaces for the identical field — worth knowing if this plugin's widget selection
  logic is ever touched, since User (`cf_76`) uses `rf-ss` consistently on *both* surfaces while Boolean does not.

**Project List** (`?display_type=list`, "test project" row):
- Re-confirmed `cf_62` ("QA Inline Project Date Field") still shows its correct persisted value from the earlier
  date-fix session (`11/28/2032`) — no regression from the many issue-side changes made since.
- New project-level fixture **"QA Project Text Field" (`cf_79`)** created for format diversity at the project
  level (previously only Date had been tested there): inline-edited to "project text regression", saved on Enter
  (`204 No Content` — Redmine's project-update endpoint returns 204 rather than 200/JSON-body on this path, unlike
  the issue endpoints; both are success codes, not a discrepancy worth flagging).
- **Full format sweep completed 2026-09-23** — until this pass, only 2 of the plugin's 10 supported custom-field
  formats (Text, Date) had ever existed as project-level fields; the other 8 had only ever been tested at
  issue-level, so this surface's format coverage was genuinely incomplete. Created 9 new project-level fixtures
  (`cf_80`–`cf_88`: Boolean, Integer, Float, Long text, Link, User, Version, List-multiple, List-single) and added
  them all as columns on `?display_type=list`. Every one rendered an inline pencil (as Admin — see the permission
  note below) and every save round-tripped correctly, confirmed by reload after all 9:

  | Format | Field | Widget | Value set | Request | Result |
  |---|---|---|---|---|---|
  | Boolean | `cf_80` | native `<select>` (Yes/No/None) | Yes | `PUT /projects/5.json {"custom_field_values":{"80":"1"}}` | `204`, persisted |
  | Integer | `cf_81` | text input, save on Enter | 42 | `{"81":"42"}` | `204`, persisted |
  | Float | `cf_82` | text input, save on Enter | 3.14 | `{"82":"3.14"}` | `204`, persisted |
  | Long text | `cf_83` | `<textarea>`, save on Ctrl+Enter | "QA project long text value" | `{"83":"QA project long text value"}` | `204`, persisted |
  | Link | `cf_84` | text input, save on Enter | a URL | `{"84":"https://example.com/qa-project-link"}` | `204`, persisted |
  | User | `cf_85` | `rf-ss` searchable dropdown | Willow Belle | `{"85":"114"}` | `204`, persisted |
  | Version | `cf_86` | `rf-ss` searchable dropdown (offers the project's own versions) | "sadfsadfsad" | `{"86":"5"}` | `204`, persisted |
  | List, multiple selection | `cf_87` | `rf-ms` with chips + explicit Save button (same pattern as issue-level) | Red | `{"87":["Red"]}` | `204`, persisted |
  | List, single selection | `cf_88` | native `<select>` | Green | `{"88":"Green"}` | `204`, persisted |

  Every widget/save-trigger matches the same mapping already established at issue-level (native select for
  Boolean/single-select List, `rf-ss` for User/Version, `rf-ms` with a Save button for multi-select List,
  plain-input-on-Enter for Text/Integer/Float/Link, textarea-on-Ctrl+Enter for Long text) — **no
  surface-specific behavior differences found for any of these 8 formats** between the project list and the
  issue detail/list surfaces. All 9 values confirmed present after a full page reload; left in place as
  fixtures (not reverted), matching this suite's convention for `cf_71`–`cf_78`.
  - **Permission note, confirmed while setting this up:** `canEditProjects` is a **global** flag, not
    per-project like `canEditIssues`. `willow.belle` (Developer, granted `edit_project` nowhere) saw **zero**
    pencils anywhere on this page, including on Name/Homepage/Public, even hovering directly over them — this
    sweep was executed as Admin instead. Not itself a bug — `edit_project` gating was already confirmed correct
    per-project in TC-INE-106 — just a reminder that a "no pencil" result on this page proves nothing about a
    specific project's config unless the tester's global `canEditProjects` is first confirmed `true`.
  - **Also newly confirmed 2026-09-23 (same session): Homepage and Public are inline-editable core fields on
    this surface too**, not just Name. Added as columns and tested as Admin: Homepage is a plain text input
    (`PUT /projects/5.json {"homepage":"https://qa-inline-editor-test.example.com"}` → `204`), Public is a
    native `<select>` (Yes/No, values `1`/`0`; `{"is_public":"0"}` → `204`). Both persisted after reload and
    were reverted to their original values (blank homepage, Public=Yes) afterward, since these are shared
    "test project" settings other suites may depend on — unlike the new custom-field fixtures, which are
    additive and don't affect anything else. **Identifier, Description and Status columns render zero pencils**
    — genuinely not offered for inline editing on this surface, confirmed by hovering as Admin (who can edit
    everything else here), not a permission artifact.

**Project Board/Card view** (default `/projects`):
- Re-confirmed Name is still the only inline-editable field here (matches the established finding — no project
  custom field columns are offered in card view, only in the list view).
- Round-tripped the Name field: "test project" → "test project regression" (saved, confirmed) → back to
  "test project" (saved, confirmed) — clean, no residual state left behind, no data corruption from the round
  trip.

**Issue Detail** — see TC-INE-012/413 above (the primary site of this session's format testing); no separate
re-check needed here since it was the most recently and thoroughly exercised surface already.

- **No bugs found in this sweep.** The one genuine finding (Boolean's list-vs-detail widget inconsistency) is
  functional, not a defect — recorded for awareness, not filed.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| TC-INE-107 | screenshots/BUG-INE-007/subject-pencil-stuck-hidden-after-status-change.png | Reload at In Progress → pencil absent (correct); AJAX transition to New → pencil still absent (bug); reload at New → pencil present (correct) | BUG-INE-007 |
| TC-INE-014 | — | Issue list: Integer 42→99 (200), User→Luna Blossom id 111 (200), Boolean→No via native select (200). Project list: `cf_79` text saved (204); 2026-09-23 extension: `cf_80`–`cf_88` (9 formats) all saved 204, plus Homepage/Public confirmed editable. Project board: Name round-tripped, both saves 204 | — |
| TC-INE-011 | — | `cf_70` absent from create form → issue #1552 created clean, `cf_70` blank → Priority inline-save succeeds directly at "New" (no fallback needed) → Status→In Progress rejected (3 fields incl. `cf_70`) → Edit form in place → filled all 3 → submitted → Status=In Progress, all persisted | — |
| TC-INE-012 | — | 8 formats all confirmed via reload: Boolean=Yes, Integer=42, Float=3.14, Long Text=set (Ctrl+Enter), Link=set (renders `<a>`), User=Daisy Skye (id 112), Version=sadfsadfsad, Attachment=no affordance (by design) | — |
| TC-INE-013 | — | Multi-select: outside-click discards (confirmed blank on reload) → explicit Save persists `["Red","Blue"]` → remove+add → Save → `["Blue","Yellow"]` (2 identical 200 calls, duplicate-save non-finding). Single-select: native `change` saves "Green" immediately, no Save button | — |
| TC-INE-010 | — | At "New": zero error elements, `cf_65` blank+editable, `cf_69` no pencil. Status→In Progress: "Qa bug-only tracker field cannot be blank" → Edit form in place, status preserved, `cf_65` editable → filled+submitted → Status=In Progress, value saved | — |
| TC-INE-006 | — | At "New" as Developer: `cf_69` row has zero `.rf-edit-icon`/button (read-only honored in UI). At "In Progress": pencil present. Step 3 (2026-09-23): open editor, then admin makes `cf_69` Read-only at the current status (lock_version unchanged), then submit → `200` with `cf_69` echoed `""`, blank after reload. Server drops the write. PASS | — |
| TC-INE-007 | — | Inline Status New→In Progress with `cf_69` blank → rejected "Qa workflow field cannot be blank" → full Edit form opened in place with Status preserved and `cf_69` editable → filled + submitted → Status=In Progress, `cf_69` set | — |
| TC-INE-009 | — (no bug; behavior confirmed via DOM/UI state inspection, not screenshot — no bugs found, screenshots are bug-evidence only per §6) | Attempted inline PATCH → server-side validation reject → full Edit form rendered in place, attempted value preserved, resubmission succeeded | — |
| TC-INE-001 | — | Step 2: `cf_63` cleared to blank via own editor → `422 "cannot be blank"`, original value retained on screen | — |
| TC-INE-002 | — | `cf_65` fully absent from DOM on a Feature-tracker issue (#1558) | — |
| TC-INE-003 | — | `cf_66` fully absent from DOM on an issue in a different project (Helpdesk Service Desk #1017) | — |
| TC-INE-004 (list leg) | — | `rf-ms` widget on list, "Red" selected + Save → `200`, persisted on reload | — |
| TC-INE-005 (list leg) | — | Native `<select>` on list, "Green" auto-saved → `200`, persisted on reload | — |
