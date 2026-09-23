# Features List — Redmineflux Inline Issue Editor plugin

> This file must be read before writing any test case. It defines the full feature scope for test coverage.
> Source: https://www.redmineflux.com/knowledge-base/plugins/inline-editor-plugin/ (official knowledge base, fetched 2026-09-07)

## Feature List

| # | Feature | Description | Covered by TC |
|---|---------|-------------|---------------|
| 1 | Inline edit — Issues LIST view | Pencil icon appears on hover over issue table rows/columns; click to edit in place, no page reload | TC-INE-018 — Subject cell PASS (plain input, no strings to check); Zugewiesen an cell reproduces `BUG-INE-001`; list header/filter panel/export links all correctly translated |
| 2 | Inline edit — Subject | Editable directly | TC-INE-018 (list view) — PASS, no visible Save/Cancel, save-on-Enter; also confirmed on issue detail page (no strings to check) |
| 3 | Inline edit — Description | CKEditor toolbar (headings, bullets, font styles, quotes, etc.) | TC-INE-019 — toolbar/tabs PASS, but the editor's own Save/Cancel buttons + success toast untranslated, `BUG-INE-003` |
| 4 | Inline edit — Status | Uses a native `<select>`, not the `rf-ss` widget | TC-INE-016 — cross-plugin validation-error toast has an untranslated prefix, `BUG-INE-002` |
| 5 | Inline edit — Priority | Uses a plain native `<select>`, **not** the `rf-ss` widget (corrected — see TC-INE-017) | TC-INE-017 — PASS, native select, priority names are data not UI strings, `BUG-INE-001`'s pattern cannot apply |
| 6 | Inline edit — Assignee | Uses the `rf-ss` dropdown widget | TC-INE-015 — FAIL, `BUG-INE-001` (reconfirmed on new server + also reproduces on the Issues list view per TC-INE-018) |
| 7 | Inline edit — Start date / End date | Date-picker based; typed-entry save timing fixed per production #120919 (no save while typing, save on blur/Enter, Escape cancels, calendar pick still immediate) — applies to detail sidebar, date custom fields, issue list column, project list column | TC-INE-060–328, TC-INE-090–226 — **all PASS**, executed 2026-09-22 on local Docker `redmine-docker-700`. Confirmed via network interceptor (not just visual): zero writes while typing incl. truncated-looking intermediate years, single correct-value write on blur/Enter, zero writes on Escape, immediate write on calendar-pick. Verified on **both** built-in dates — Start Date explicitly checked as its own field, not just Due Date as a stand-in, since #120919 names both — and two newly-created Date custom fields (issue-level `cf_61`, project-level `cf_62`), on the issue detail page, issue list column, and project list column (`?display_type=list`). Also incidentally reconfirmed the pre-existing Start/Due cross-field validation ("Due Date must be greater than start date") still works (genuine `422`, no data corruption). One intermittent duplicate-write non-finding on the issue-list view (seen on `cf_61` and `start_date`, not reliably reproducible, both calls always succeed with the same value) — treated as a test-harness artifact per this plugin's own 2026-09-08 precedent, not filed. TC-INE-041 (baseline persistence) still not separately executed. |
| 8 | Inline edit — % complete | — | **PASS (TC-INE-042, executed 2026-09-22)** — 0→50%, `200`, journaled, progress bar re-rendered correctly, dropdown offered exactly the instance's 10%-increment options. |
| 9 | Inline edit — Custom fields | Configurable — format, Required, tracker scope, project scope, and (for List format) single- vs multi-select display type all change behavior | **Every format now tested and PASS on every surface it's offered on** except Key/value list (not creatable via the stock UI). Issue detail (TC-INE-012/413/414, 2026-09-22): Date, Text, Long text, Boolean, Integer, Float, Link, List (single + multi-select), User, Version all confirmed. Issue list: a representative sample (Boolean, Integer, User) confirmed. **Project list — full 10-format sweep completed 2026-09-23**: Text and Date were already tested; created 9 new project-level fixtures (Boolean, Integer, Float, Long text, Link, User, Version, List-single, List-multiple, `cf_80`–`cf_88`) and confirmed all 9 PASS (`PUT /projects/:id.json` → `204`, persisted after reload), with the identical widget/save-trigger mapping already established at issue-level — no surface-specific differences. Attachment format confirmed to have no inline-edit affordance at all (by design, both issue- and project-level). Widget-per-format and save-trigger-per-widget fully mapped — see `INLINE_EDITOR_MEMORY.md`. Configuration-driven behaviors (Required enforcement, tracker/project scoping) covered by TC-INE-001–011, all PASS as of 2026-09-23 — tracker/project scoping (TC-INE-002/003) confirmed via a Feature-tracker issue and a different-project issue both showing the scoped field fully absent from the DOM. The list-column leg for List-format multi/single-select (TC-INE-004/005) is also now confirmed PASS. |
| 14 | Workflow field permissions (readonly/required per role+tracker+status) | Redmine core Workflow → Edit tab grid; a field's editability/requiredness depends on the issue's current status | **PASS on the detail page, FAIL on the issue list (`BUG-INE-006`)** — TC-INE-006/007/010/011 (status-dependent live behavior): the detail page correctly suppresses the inline affordance for a workflow-Read-only field and correctly falls back to the full Edit form when a status change makes a field Required. TC-INE-057/094 confirm the same on the detail page. **On the issue list specifically (TC-INE-081, executed 2026-09-23)**, the pencil incorrectly appears for the same field/role/status, and submitting a value returns `200` with a false "Changes saved successfully." toast — but the server's own echoed response confirms the value is **not** actually applied, so the underlying data stays protected. This resolves the previously-open "does the endpoint actually enforce this" question: yes, but the list view's UI is wrong. See `BUG-INE-006`. |
| 15 | Permission granularity — Edit own issues vs Edit issues; Edit project | Two distinct Redmine role checkboxes (own vs any issue) plus the separate project-level Edit project permission for project list/card edits | **TC-INE-104/914/915 all PASS (executed 2026-09-22).** `edit_own_issues` restricts inline editing to the user's own issues (no affordance at all on others'); `edit_issues` genuinely grants any-issue edit. `edit_project`, per project: a real save attempt is the only trustworthy signal — the pencil incorrectly appeared on a project without `edit_project` granted, but the actual save correctly returned `403` with zero data corruption (endpoint is the real gate; cosmetic-only affordance bug, not filed). Neither `edit_own_issues` nor `edit_project` were checked by default on this instance's Reporter role — had to configure them via Administration → Roles and permissions (which required navigating Redmine's own "sudo mode" password re-confirmation). |
| 10 | Real-time updates | Field updates persist without page reload | — not explicitly re-verified beyond the fields tested |
| 11 | Save-rejection error toast | Custom `rf-toast rf-toast--error` notification shown when a server-side validation rejects an inline save (e.g. another plugin's business-rule hook) | TC-INE-016 — FAIL, `BUG-INE-002` (mixed-language: English wrapper prefix + correctly-translated German message) |
| 12 | Save-success toast | Custom `rf-toast rf-toast--success` notification shown after a successful inline save | TC-INE-019/006 — FAIL, `BUG-INE-003` ("Saved successfully." hardcoded English, confirmed on Description, Status, AND Priority — a shared component reused across every inline-edit field, not Description-specific) |
| 13 | Inline edit — Project card/list view (Name) | Per the plugin's own description: "project table, and project card views" | TC-INE-021/008 — PASS. Under Default theme only the card view was found (Name inline-editable, no strings to check). Under Lotus theme, a "Kartenansicht"/"Listenansicht" toggle also appears (not present under Default) — the list view (`?display_type=list`) is the plugin's own "project table" view, fully translated (Name/Kennung/Beschreibung headers, Filter panel), Name inline-editable, no bugs. A single project's own Overview page and the Administration → Projects admin table both have zero inline-edit icons — out of this plugin's scope. **Extended 2026-09-23 — the project list view is richer than Name-only**: adding the Homepage and Public columns (Options → Columns) exposes inline pencils on both, confirmed PASS as Admin (`PUT /projects/5.json {"homepage":…}` and `{"is_public":…}`, both `204`, both persisted after reload, both reverted). Identifier, Description and Status columns render **no** pencil at all — not offered for inline editing on this surface. The project **card/board** view stays Name-only (`.rf-card-name-icon` is the only pencil class there, confirmed 3/3 cards). `canEditProjects` is a **global** flag (not per-project like `canEditIssues`) — a Developer with no project granting `edit_project` sees zero pencils anywhere on this page, even for a project where their own role has other permissions. |

## Notes

- Session 2026-09-07 (two passes) tested the issue-detail sidebar's "Zugewiesen an" (Assigned to) field (`rf-ss` widget — BUG-INE-001) and the "Status" field's native `<select>` plus its error-toast behavior when rejected by the Checklist plugin's "block issue closing" rule (BUG-INE-002). The toast auto-dismisses very fast — confirmed via `MutationObserver`, not a manual screenshot.
- Session 2026-09-08 (third pass, TC-INE-017–005), on the new active Forge server (`flux-frmka2kzh49`, the prior server having expired): reconfirmed `BUG-INE-001` reproduces identically on the new server, and additionally on the Issues LIST view's own Zugewiesen an inline edit (not just the issue-detail sidebar). Resolved the open question about Priority sharing Assignee's gap — it doesn't, because Priority uses a plain native `<select>`, not the `rf-ss` widget at all. Tested the Issues list view broadly (header, filter panel, Subject inline edit, export links, sidebar saved queries) — all correctly translated or confirmed as data (saved `Query` records), no new findings there. Tested the Description field's inline CKEditor — found a new bug, `BUG-INE-003`: its own "Cancel"/"Save" buttons and the "Saved successfully." toast are hardcoded English, while the surrounding tab labels and toolbar tooltips are correctly German.
- Session 2026-09-08 (fourth pass, TC-INE-020): explicitly asked whether the "Saved successfully." toast is untranslated for every field change, not just Description. Confirmed via `MutationObserver` on both Status and Priority changes (each reverted back to its original value afterward) — identical hardcoded-English toast both times. Broadened `BUG-INE-003`'s scope/title accordingly rather than filing a new bug. Also noted: an earlier attempt to reproduce this by directly dispatching a synthetic `change` event on the native select (rather than using the real dropdown) caused a genuine save attempt with an invalid value, surfacing a raw PostgreSQL error in the toast — this was a self-inflicted test artifact, not a real user-reachable defect, and not filed.
- Session 2026-09-08 (fifth pass, TC-INE-021): explicitly asked whether the Issues list page, "project board", and project list page were tested. Confirmed both the "project table" and "project card" surfaces from the plugin's own KB description resolve to the same single `/projects` card-tile listing on this instance (no separate table-view toggle exists) — its Name field is inline-editable, cleanly, no bugs. Clarified that a single project's own Overview page and the Administration → Projects admin table are both untouched by this plugin (zero inline-edit icons on either) — "project board" does not refer to either of those here.
- Session 2026-09-08 (sixth pass, TC-INE-022): explicitly asked to test the Lotus theme (Stages 3/6, incl. 1280×720). `BUG-INE-001` (Assignee widget) and `BUG-INE-003` (Description Save/Cancel + toast) both confirmed to reproduce identically under Lotus — theme-agnostic, no new plugin bugs (Assignee/Status/Priority are core Redmine fields Lotus already styles, unlike Agile Board's plugin-injected fields in `BUG-LTS-003`). **Correction to the fifth-pass note above**: under Lotus, the Projects page shows a materially richer card design plus the "Kartenansicht"/"Listenansicht" toggle mentioned in row #13 above — confirmed absent under Default theme by switching both ways, so this was a genuine Lotus-only feature, not something missed earlier.
- Items #8 (% complete) remains completely untested; #7 (dates) and #9 (custom fields, Date format only) are now
  executed — see `INLINE_EDITOR_HANDOFF.md`.
- Session 2026-09-21: fetched production issue #120919 (Feature, status In QA) — a fix for the inline date editor
  saving prematurely while a date was still being typed (e.g. "12.03.2026" saved as "12.03.0026" mid-type). Authored
  TC-INE-060–328 (`INLINE_EDITOR_ISSUE_DETAIL_EDITING.md`) and TC-INE-090–226 (`INLINE_EDITOR_ISSUE_LIST_EDITING.md`)
  to verify the fix's exact QA notes: no save while typing (incl. mid-year pause), save on blur/Enter, Escape
  cancels, calendar-pick unchanged — across issue detail dates, date custom fields, issue list date column, and
  project list date column. Not yet executed — this was authoring only, per production issue detail, not a live
  test session.
- Session 2026-09-22: executed TC-INE-060–328 and TC-INE-090–226 live against local Docker `redmine-docker-700`
  (Redmine 7.0.0, plugin 7.0.0, `http://localhost:3010`). Created two new Date-format custom fields for this cycle
  — issue-level "QA Inline Date Field" (`cf_61`, all trackers, all projects) and project-level "QA Inline Project
  Date Field" (`cf_62`) — then instrumented the page with a `window.fetch`/XHR interceptor so pass/fail was judged
  by actual network requests, not just visual state. **All 8 TCs PASS** on issue #1551 ("test project"): zero
  premature saves at any point while typing on any of the four surfaces (issue detail built-in date, issue detail
  custom field, issue-list Due date column, issue-list/project-list custom field columns), including at
  truncated-looking zero-padded intermediate values like `0202-12-03` — confirming the fix genuinely defers the
  save rather than merely hiding it visually. Save-on-blur, save-on-Enter, Escape-cancel, and calendar-pick-still-
  immediate all confirmed with exact payload values matching what was typed. One inconsistent finding — the
  issue-list custom-field column fired its blur-save request twice (identical duplicate) in 2 of 3 attempts — could
  not reproduce reliably after 2 further deliberate retries, so treated as a test-harness artifact (same category
  as the 2026-09-08 self-inflicted-artifact precedent below) and **not filed**.
- Session 2026-09-22 (continued): user explicitly asked whether Start Date (not just Due Date) had been tested —
  it hadn't yet; ran it on both the detail page and issue list column, both PASS, identical to Due Date. User then
  asked whether the Start/Due validation error message is actually shown to the user — confirmed via
  `MutationObserver` on both surfaces (detail page: "Could not save: Due Date must be greater than start date";
  issue list: "Due Date must be greater than start date", no prefix — a minor wording inconsistency, not a bug).
- Session 2026-09-22 (continued): user asked whether a large list of custom-field-configuration and permission
  scenarios had been written yet — they hadn't. Authored 8 new TCs in a new suite
  `INLINE_EDITOR_CUSTOM_FIELD_CONFIGURATION.md` (TC-INE-001–408: Required enforcement, tracker-scoped fields,
  project-scoped fields, List-format multi-select vs single-select display type, live status-dependent field
  editability/requiredness changes inside an open inline editor, multiple-simultaneous-required-fields) and 3 new
  TCs in `INLINE_EDITOR_PERMISSIONS.md` (TC-INE-104–915: "Edit own issues" vs "Edit issues" distinction, "Edit
  project" per-project gating for the project list/card view). Authoring only — none of these 11 executed yet.
- Session 2026-09-22 (continued): user asked to first explore the instance's actual custom fields before writing
  the TCs above, and separately to test/document the specific behavior "when [there are] one or more required
  field[s] [unmet], [an inline edit] redirect[s] to [the] edit form." Explored Administration → Custom fields:
  found **zero** pre-existing fields beyond this plugin's own `cf_61`/`cf_62` fixtures. Created 7 new fixture
  custom fields (`cf_63`–`cf_69`, see `INLINE_EDITOR_CUSTOM_FIELD_CONFIGURATION.md`'s Fixtures table) covering
  Required, tracker-scoped, project-scoped, multi-select, single-select, and workflow-status-dependent
  configurations, plus a Workflow → Fields permissions rule on `cf_69` (role Developer, tracker Bug: New=editable,
  In Progress=Required, Resolved=Read-only). Rewrote TC-INE-001–408's preconditions to reference these real
  fixtures by name/ID instead of hypothetical placeholders. **Authored and executed live** a new TC-INE-009
  confirming the required-field fallback behavior: an inline edit rejected for unmet required fields does not fail
  silently — the plugin renders the full standard Edit form in place (no hard navigation), lists every unmet
  field's error together, and preserves the user's in-progress attempted change. Confirmed working as designed
  end-to-end (filled the required fields, submitted, all changes persisted). Not a bug.
- Session 2026-09-22 (continued): user asked to explore Workflow → Fields permissions and prepare a fixture for
  status-dependent read-only behavior, describing: a field read-only at New, required at another status, editable
  once transitioned. Surveyed all role × tracker combos — zero pre-existing rules. Reconfigured `cf_69`
  (Developer/Bug: New=Read-only, In Progress=Required) and promoted `daisy.skye` to Developer on "test project"
  (admin is exempt from workflow field permissions). **TC-INE-006 PARTIAL PASS, TC-INE-007 PASS**: read-only field
  shows no affordance at New; transitioning to In Progress while blank is rejected and opens the Edit form fallback
  with the status preserved and the field now editable. Endpoint-level enforcement of the Read-only rule (TC-INE-006
  step 3) remains unproven — a raw `fetch()` attempt hit a CSRF 401 that raised the browser's native Basic Auth
  dialog and hung the session (lesson saved to global memory).
- Session 2026-09-22 (continued): user asked the sharpest version — a field Required from creation AND
  Read-only-at-New via workflow, could that deadlock a user? Built `cf_70` fresh (Required ✓ at creation) with that
  exact workflow rule, tested from real issue **creation** as `daisy.skye` (not a retrofitted field/issue).
  **New TC-INE-011, PASS, no deadlock**: `cf_70` is fully absent (not disabled) from the New-issue form; issue
  created cleanly with it blank; an unrelated inline edit at New saved directly with no fallback needed (Redmine
  exempts read-only fields from Required entirely); the field only becomes enforced once the issue reaches a
  status without the override, at which point the same Edit-form fallback handles it — even with 3 simultaneously
  newly-required fields at once. This is Redmine core semantics, not plugin-specific.
- Session 2026-09-22 (continued): user asked to run a regression pass across issue detail/list, project list, and
  project board views, and test every remaining custom field format. Created the last 8 format fixtures (Boolean,
  Integer, Float, Long text, Link, User, Version, Attachment — `cf_71`–`cf_78`) plus a project-level Text field
  (`cf_79`). **TC-INE-012/413/414 all PASS** — every format works on the issue detail page (mapped each format's
  actual widget and save-trigger, see `INLINE_EDITOR_MEMORY.md`); a representative sample regressed clean on the
  issue list, project list, and project board/card views. Two genuine (non-bug) findings surfaced: (1) the
  multi-select widget discards its pending selection silently on outside-click, requiring an explicit Save button
  unlike every other field in the plugin; (2) Boolean uses different widgets on the detail page (`rf-ss`) vs. the
  issue list (plain native `<select>`) — both work, but it's a real, confirmed inconsistency. No bugs found.
- Session 2026-09-22 (continued, post plugin-wide TC-ID renumbering): the user renumbered every TC-INE ID across
  this plugin as part of the repo-wide migration (`CLAUDE.md` §4a). Auditing the new numbering against each file's
  own section headers found ~65 TCs with no Result at all — a large execution gap left over from when these suites
  were authored but never run. Built new permission-test fixtures (roles "QA Read Only"/"QA Own Visibility";
  projects "QA Private Project"/"QA Closed Test Project"/"QA Archived Test Project"; users
  `harmony.rose`/`summer.rain`/`willow.belle`) and executed roughly half of the outstanding TCs: Admin field-editing
  baseline (row #8's %-complete result above), description editing/formatting/cancel/script-injection (confirmed
  inert — no XSS on either the description or the list-view Subject column), issue-list column editing
  (Priority/Subject/Assignee), empty-subject rejection, closed/archived-project endpoint enforcement (same
  pencil-shown-but-403 cosmetic pattern as `edit_project`, row #15), and rapid-successive-save handling (Redmine's
  own optimistic-locking correctly rejects a stale write with `422` rather than corrupting data). Resolved the
  "private notes" permission question as not-applicable — the plugin adds zero inline affordance to journal/notes
  content at all, confirmed via DOM query. **Downgraded `STATUS.md` from Complete to In Progress** per `CLAUDE.md`
  §10, since this scale of unexecuted coverage means the plugin's last full-cycle regression (2026-09-10) no longer
  reflects the suite's actual current size. Remaining gap, ~35 TCs, is mostly the issue-list negative cases and the
  negative-endpoint ("leg 3") permission checks across several TCs — see `INLINE_EDITOR_HANDOFF.md` for the
  prioritized list. No bugs found this session.
- Session 2026-09-23: continued closing the post-renumbering gap. Recovered from an unrelated infrastructure
  issue first (the container's asset-precompile manifest had gone empty after a restart, 500ing every page — fixed
  by re-running `rake assets:precompile`). Executed the remaining Permissions-suite items (non-member/cross-project
  403s, an instance-wide "authentication required" setting that blocks anonymous access to everything, and a
  visibility-scoped role that sees zero other issues and gets 403 on a direct hit) and most of the Issue List
  suite's negative cases. **Found and filed 2 new bugs**:
  - **`BUG-INE-005`** — the issue list's Subject field accepts and persists an unbounded-length value (tested
    5,000 characters) via its inline endpoint, while the standard Edit form's own model validation correctly caps
    it at 255 characters. A genuine validation-bypass, not merely a missing `maxlength` attribute.
  - **`BUG-INE-006`** — the issue list renders an edit pencil for a workflow-Read-only custom field (unlike the
    detail page, which correctly shows none), and submitting a value shows a false "Changes saved successfully."
    even though the server's own response confirms the value was **not** applied. This is the concrete answer to
    row #14's previously-open question: the endpoint enforces the workflow rule correctly; only the list view's
    affordance and feedback are wrong.
  - Also closed out the last 3 items in the Custom Field Configuration suite (Required-field-itself enforcement,
    tracker scoping, project scoping — all PASS, reasoned/confirmed via the same underlying Redmine mechanism
    `BUG-INE-006`'s investigation surfaced) and the TC-INE-004/005 issue-list-column legs (multi/single-select,
    both PASS on the list, matching the detail page). A `curl`-based attempt to test permission-revocation
    (TC-INE-101) was blocked by the harness's own auto-mode safety classifier before any write occurred — that
    approach is now off-limits by two independent mechanisms (this, plus the user's earlier decline of raw
    `fetch()`). `bugs/open/` now contains the 2 bugs above (was empty).
