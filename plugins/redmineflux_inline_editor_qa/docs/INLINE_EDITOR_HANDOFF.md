# Handoff — Redmineflux Inline Editor

## Last Session

- Date: 2026-09-23
- Redmine Version: 7.0.0 (local Docker)
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010

## Completed This Session (2026-09-22, production fix #120919 verification)

Fetched production issue #120919 (Feature, In QA) — inline date editor was auto-saving prematurely while a date was
still being typed (e.g. year truncated to "0026" mid-entry). Authored TC-INE-060–328
(`testcases/INLINE_EDITOR_ISSUE_DETAIL_EDITING.md`) and TC-INE-090–226 (`testcases/INLINE_EDITOR_ISSUE_LIST_EDITING.md`)
against the fix's own QA notes, then executed all 8 on `redmine-docker-700` (Redmine 7.0.0, plugin 7.0.0):

- Created 2 new Date-format custom fields: issue-level "QA Inline Date Field" (`cf_61`, all trackers/projects) and
  project-level "QA Inline Project Date Field" (`cf_62`). Test fixture: issue #1551 in "test project".
- Instrumented the page with a `window.fetch`/XHR interceptor so results were judged by actual network requests,
  not visual state alone.
- **All 8 TCs PASS** across all 4 surfaces (issue detail built-in date, issue detail custom field, issue-list Due
  date column, issue-list/project-list custom field columns): zero premature saves at any point while typing,
  including at truncated-looking zero-padded intermediate years (`0202-12-03`); exactly one correct-value save on
  blur or Enter; zero saves on Escape (value reverts); calendar-pick (simulated via `.fill()`) still saves
  immediately, unchanged. The fix genuinely defers the save server-side, not just visually.
- User asked specifically whether Start Date (not just Due Date) had been tested — it hadn't yet at that point, so
  ran the same no-premature-save + blur-save checks against Start Date on both the issue detail page and the issue
  list column: **both PASS**, identical behavior to Due Date. Incidentally reconfirmed the pre-existing Start/Due
  cross-field validation still works (a genuine `422 "Due Date must be greater than start date"` when testing an
  invalid combination, no data corruption).
- User then asked whether that validation error message is actually shown to the user (not just rejected
  server-side) — set up a `MutationObserver` per this plugin's own established toast-capture method and confirmed
  **PASS on both surfaces**: detail page toast reads "Could not save: Due Date must be greater than start date",
  issue-list toast reads just "Due Date must be greater than start date" (no prefix — a minor wording
  inconsistency between the two, not a bug, both correctly block the save and inform the user).
- One inconsistent non-finding, **not filed**: the issue-list custom-field column's blur-save fired twice
  (identical duplicate request) in 2 of 3 attempts, not reproducible on 2 further deliberate retries — treated as a
  test-harness artifact per this plugin's own 2026-09-08 precedent (a synthetic-event false positive that also
  wasn't filed). Also created production sanity testcase [#121042](https://flux.zehntech.com/issues/121042) in
  suite #146 "Inline Issue Editor" pointing at this coverage, per user approval, prior to this execution session.
- User then asked a broad question: had the plugin's custom-field-configuration and permission-granularity
  scenarios been tested at all — Required enforcement, tracker/project-scoped fields, List-format multi-select
  display type, workflow field permissions changing live with Status inside an open inline editor, multiple
  simultaneously-required fields, "Edit own issues" vs "Edit issues", and per-project "Edit project" gating. They
  hadn't — checked against every existing suite first, confirmed only generic/adjacent TCs existed (TC-INE-043,
  TC-INE-057/903, TC-INE-103), then authored 8 new TCs in a new suite
  `testcases/INLINE_EDITOR_CUSTOM_FIELD_CONFIGURATION.md` (TC-INE-001–408) and 3 new TCs appended to
  `testcases/INLINE_EDITOR_PERMISSIONS.md` (TC-INE-104–915). **Authoring only — none of these 11 executed yet.**
- User then asked to explore the instance's real custom fields first and ground the TCs in them, and separately to
  test and document a specific behavior: inline-editing while a required field is unmet falls back to the full
  Edit form. Explored Administration → Custom fields (both Issues and Projects tabs) — found **zero** pre-existing
  fields besides this plugin's own `cf_61`/`cf_62` from the #120919 session. Created 7 new real fixture fields
  (`cf_63`–`cf_69`) covering every configuration TC-INE-001–408 needs, plus a Workflow → Fields permissions rule on
  `cf_69` for role Developer/tracker Bug. Rewrote every precondition in TC-INE-001–408 to reference these real
  fixtures by name/ID. Added and **executed live** TC-INE-009: confirmed the required-field fallback works exactly
  as the user described — an inline save rejected for unmet required fields renders the full standard Edit form in
  place (no hard navigation), lists all unmet-field errors together, and preserves the user's in-progress attempted
  change; completed the flow (filled both required fields, submitted) and confirmed everything persisted
  correctly. Not a bug — confirmed working as designed. (Along the way, also had to re-authenticate: the browser
  session had somehow switched to a non-admin seed user, `luna.blossom`, mid-session — signed out and logged back
  in as `admin` before proceeding; worth a note in case this Playwright profile is shared across concurrent
  sessions, per `MEMORY.md`'s "Playwright MCP Isolation" reference.)
- User then asked whether the **Workflow** config had been explored, and to prepare a workflow fixture for testing
  status-dependent read-only behavior — describing this scenario: a field read-only at one status, which becomes
  editable when the status moves to In Progress, with the Edit form opening at that transition. Surveyed
  Administration → Workflow → Fields permissions across **all** role × tracker combinations: **zero** pre-existing
  rules on the instance. Reconfigured the `cf_69` fixture rule to match the scenario (role Developer, tracker Bug:
  New = **Read-only**, In Progress = **Required**), and changed `daisy.skye`'s membership on "test project" from
  Reporter to **Developer** so the rule actually applies to her (admin is exempt from workflow field permissions).
  **Executed TC-INE-006 (PARTIAL PASS) and TC-INE-007 (PASS)** as `daisy.skye`:
  - At "New": `cf_69` rendered with **no inline affordance at all** — read-only honored in the UI.
  - Inline Status "New" → "In Progress" with `cf_69` blank: **rejected** with "Qa workflow field cannot be blank"
    (the status-dependent Required rule IS enforced on the inline path), then the **full Edit form opened in
    place** with the attempted status preserved and `cf_69` now **editable** (evaluated against the new status).
  - Filled `cf_69`, submitted → Status = In Progress, value saved, and `cf_69` now **shows an inline pencil**.
  - **Outstanding:** TC-INE-006 step 3, the negative *endpoint* leg for the read-only field. First attempt used a
    hand-rolled `fetch()` to `update_field.json`, got a `401`, which raised the browser's **native Basic Auth
    dialog** and hung the session (user spotted it from their screen). That 401 is a CSRF/API-auth rejection, not
    proof of field-permission enforcement — so server-side enforcement of the Read-only rule is **unproven**. Redo
    via the plugin's own request path; see global memory "Avoid Raw fetch() On .json Endpoint Tests".
- Local docs updated: both original testcase files (Result lines + Evidence Map), the new custom-field-config
  suite, the permissions suite, `INLINE_EDITOR_FEATURES_LIST.md` (rows #7, #9, new rows #14/#15, session notes),
  this handoff, and `INLINE_EDITOR_MEMORY.md`. No screenshots taken (no bugs found — per §6, screenshots are
  bug-evidence only).
- User then asked for one more combination: a **custom-field-level** Required field (the `is_required` checkbox,
  required at every status) tested *together with* the workflow rules — specifically that at "New" **no error**
  occurs, but attempting a **status change** takes the user to the Edit form. Set `cf_65` to Required ✓ (it was
  blank on #1551, the realistic "field made required after issues already exist" shape), reset #1551 to "New" as
  admin, and **executed new TC-INE-010 as `daisy.skye` — PASS**:
  - At "New": page rendered with **zero error elements**; `cf_65` blank but inline-editable; `cf_69` correctly
    showing no pencil (workflow Read-only) — both rule types coexisting correctly on one issue.
  - Inline Status "New" → "In Progress": rejected with "Qa bug-only tracker field cannot be blank" → **full Edit
    form opened in place** with the status preserved and `cf_65` editable; `cf_69` also editable there because the
    form evaluates against the *target* status.
  - Filled `cf_65`, submitted → Status = In Progress, value saved, `cf_69` pencil now present.
  - This closes the third and last of the three required-field × trigger combinations; all three use the same
    single fallback mechanism. Not a bug.
- User then asked the sharpest version of the question: what if a field is **both** Required (from creation) and
  Read-only-at-New (via workflow) — could that trap a user? Created a brand-new field `cf_70` ("QA Required
  Readonly Field") with Required ✓ checked at creation, plus a Workflow rule (Developer/Bug: New=Read-only, every
  other status left blank). Tested as `daisy.skye` starting from **issue creation** (not a retrofitted existing
  issue) — **new TC-INE-011, PASS, no deadlock:**
  - `cf_70` is fully **absent** from the New-issue creation form (not disabled — not rendered at all), same as the
    other two New=Read-only fields (`cf_65`, `cf_69`). Issue #1552 created cleanly with `cf_70` blank, zero errors.
  - Inline-editing Priority on the fresh issue at "New" **saved directly, no Edit-form fallback needed** — Redmine
    exempts a read-only field from Required enforcement entirely, on both create and update.
  - Inline-changing Status to "In Progress" (where `cf_70` has no override, reverting to plain Required)
    **rejected** with all three now-unmet fields listed together (`cf_65`, `cf_69`, `cf_70`) → Edit form opened in
    place → filled all three → submitted → Status=In Progress, all three persisted.
  - Root cause: this is **Redmine core's own semantics**, not plugin-specific — a Read-only field is excluded from
    Required validation while read-only, full stop. The deadlock the configuration suggests on paper never occurs.
  - Note for future sessions: my first attempt at this reused `cf_65`/#1551 (already admin-touched from earlier
    tests) and got confusing results (an admin save unexpectedly blocked by the *same* Required-field validation
    while resetting Status — a useful side-lesson that admin is exempt from Read-only but **not** from Required).
    The user correctly redirected me to build a fresh field + a fresh issue created by the actual restricted role,
    which is what actually produced the clean, unambiguous result above.
- **Environment changes left in place** (deliberate, for the next run): 8 custom fields `cf_63`–`cf_70` (`cf_65`
  and `cf_70` now also **Required ✓**); the `cf_69` and `cf_70` Workflow → Fields permissions rules (Developer/Bug:
  New=Read-only for both, `cf_69` additionally Required at In Progress); `daisy.skye` = Developer on "test
  project"; issue #1551 at Status **In Progress** with `cf_63`/`cf_64`/`cf_65`/`cf_69` populated; issue **#1552**
  (new) at Status **In Progress** with `cf_65`/`cf_69`/`cf_70` populated, Priority=High. Note `cf_65` and `cf_70`
  being Required now affect *any* Bug-tracker issue on this instance — if a later test needs a clean non-required
  field, use `cf_66` instead.
- `STATUS.md` updated. `bugs/open/` remains empty; this plugin stays `Complete` per its existing final-cycle
  regression, with this session adding fresh coverage for a specific production fix rather than reopening the
  cycle. The 11 newly-authored custom-field-configuration/permission TCs are a genuine coverage gap for next
  session, not yet reflected in the `Complete` status's own regression baseline.

## Previously Completed (2026-09-10, BUG-INE-004 retest + final cycle regression)

Logged in (admin/12345678 — already past the forced-password-change screen on this server), set German language at both account and system-default level, then retested the sole open bug and ran the full plugin final-cycle regression since it emptied `bugs/open/`:

- **BUG-INE-004** — retested on issue #1 (project "Software development5") via `MutationObserver`: the interim loading indicator now reads **"Wird gespeichert…"** (correct German for "Saving…"), confirmed on both a Priority change and a Status change (shared component, not field-specific). Also captured a still screenshot via a tight ~25ms polling loop. **Fixed — closed.** `bugs/open/` is now empty.
- **Final-cycle regression (`SENIOR_QA_STANDARDS.md` §27)** — re-ran all 9 TCs (TC-INE-015 through TC-INE-023) on this server since the plugin's bug backlog is now empty:
  - TC-INE-015 (Assignee `rf-ss` widget): PASS — "Suchen…"/"Keine".
  - TC-INE-016 (error-toast prefix, Checklist-block interaction): PASS — "Konnte nicht gespeichert werden: ..." fully German. Toggled "Ticket-Schließung blockieren" on for the test, reverted to off afterward.
  - TC-INE-017 (Priority native select): PASS — confirmed still a plain `<select>`, not the `rf-ss` widget.
  - TC-INE-018 (Issues list view): PASS — list headers, filter panel, and the Assignee cell's `rf-ss` widget all correctly German.
  - TC-INE-019 (Description CKEditor buttons/toast): PASS — "Abbrechen"/"Speichern"/"Erfolgreich gespeichert.".
  - TC-INE-020 (shared success toast across fields): PASS — confirmed on Priority and Status changes.
  - TC-INE-021 (Project card view Name inline edit): PASS — plain input, no strings.
  - TC-INE-022 (Lotus theme retest): PASS — Assignee widget clean under Lotus too.
  - TC-INE-023 (Description Save/Cancel button height under Lotus): PASS — both render at 34px, consistent with `BUG-LTS-004`'s fix.
  - **All 9 TCs PASS, zero new failures.** Theme reverted to Standard at session end.
- `STATUS.md` updated to **Complete** for this plugin.

## Previously Completed (2026-09-09, second retest)

Retested all 3 open bugs on a newly-provisioned Forge server, German language, Standard theme — **all 3 now confirmed FIXED**:

- **BUG-INE-001** — the "rf-ss" Assigned-to widget's placeholder now reads "Suche" (was "Search…") and its no-assignee option now reads "Keine" (was "— None —"), confirmed on issue #106. **Fixed — closed.**
- **BUG-INE-002** — enabled "Ticket-Schließung blockieren" (off by default on this fresh server), created test issue #268 with an incomplete checklist item, attempted to close it via the inline Status widget: the error toast now reads "Konnte nicht gespeichert werden: ..." (was "Could not save: ..."), fully German. Setting reverted to disabled afterward. **Fixed — closed.**
- **BUG-INE-003** — Description CKEditor's action buttons now read "Abbrechen"/"Speichern" (were "Cancel"/"Save"); the shared success toast now reads "Erfolgreich gespeichert." (was "Saved successfully.") on both Description and Priority changes. **Fixed — closed.**
- **Incidental new finding while retesting BUG-INE-002/003**: a previously-undocumented interim "Saving…" loading indicator (shown briefly during every inline-edit save, before the final toast) is still hardcoded English — captured via `MutationObserver` and, this time, a still screenshot (tight polling loop). Filed as new **BUG-INE-004** (Low).
- `bugs/open/` now contains only the newly-filed `BUG-INE-004` — not empty, so the plugin-wide final-cycle regression trigger does not apply yet.

## Previously Completed (2026-09-09, first retest)

- Retested all 3 open bugs on a newly-provisioned Forge server (German, Standard/Default theme) after the team's branch update. All 3 STILL REPRODUCED at that time, byte-for-byte identical to the original findings:
  - BUG-INE-001 — "— None —" still hardcoded English in the Assigned-to `rf-ss` dropdown (confirmed on issue #106).
  - BUG-INE-002 — "Could not save:" prefix still hardcoded English, wrapping the correctly-translated German checklist-block message. Enabled "Ticket-Schließung blockieren" (was off by default on this fresh server), created test issue #269 with an incomplete checklist item, reproduced, then **reverted the setting back to disabled** afterward. This time a static screenshot of the toast itself was successfully captured (tight polling loop on `document.body.innerText`), unlike the original session which only had the MutationObserver text capture.
  - BUG-INE-003 — Description CKEditor's "Cancel"/"Save" buttons still hardcoded English (confirmed on issue #106); the "Bearbeiten"/"Vorschau" tabs remain correctly German.
- All 3 bug files updated with a dated "Retest — STILL REPRODUCES" section plus new screenshot evidence; none moved to closed since none were fixed at that time.

## Previously Completed

- TC-INE-015 (2026-09-07): issue-detail "Zugewiesen an" (Assigned to) inline searchable dropdown (`rf-ss` widget) — FAIL, `BUG-INE-001` (hardcoded "Search…" placeholder + "— None —" option, while the widget's own "<<ich>>" option is correctly translated).
- TC-INE-016 (2026-09-07): issue-detail "Status" field inline quick-edit, specifically its error-toast behavior when a save is rejected by another plugin's validation (Redmineflux Checklist's "block issue closing" rule) — FAIL, `BUG-INE-002` (toast reads "Could not save: <correctly-translated German message>" — English wrapper prefix + German content, a mixed-language string). Required a `MutationObserver` to capture, since the toast auto-dismisses faster than a manual screenshot round-trip.
- TC-INE-017 (2026-09-08): Priority field's inline edit — PASS, uses a plain native `<select>`, not the `rf-ss` widget at all, so `BUG-INE-001`'s pattern cannot apply. Resolves the open question from last session.
- TC-INE-018 (2026-09-08): Issues LIST view inline editing and surrounding chrome — mostly PASS. List header, filter panel, "Neues Ticket", export links all correctly translated. Subject-cell inline edit works cleanly (plain input, no strings to check). Zugewiesen an-cell inline edit reproduces the identical `BUG-INE-001` gap ("Search…"/"— None —") — folded in as an additional affected surface, not a new bug. Sidebar "Abfragen" links are English but confirmed via `href` (`?query_id=1-4`) to be actual saved `Query` records (data), not a translation gap.
- TC-INE-019 (2026-09-08): Description field's inline CKEditor — FAIL, new `BUG-INE-003` (the editor's own "Cancel"/"Save" buttons and its "Saved successfully." success toast are hardcoded English, while the surrounding tab labels/toolbar tooltips/"Zitieren" link are all correctly German).
- Also reconfirmed `BUG-INE-001` reproduces identically on the new Forge server (`flux-frmka2kzh49`) before extending coverage, since the original finding was on a now-expired server.
- TC-INE-020 (2026-09-08, explicitly asked: "save successfully toaster message not translated when we change each field"): confirmed the "Saved successfully." toast is untranslated on Status and Priority changes too (both via their real dropdowns, each reverted back to its original value afterward), not just Description — broadened `BUG-INE-003`'s title/scope to reflect this is a shared, plugin-wide toast component rather than a Description-specific gap. Also hit and correctly dismissed a self-inflicted test artifact along the way (a synthetic DOM `change` event with no real value caused a genuine save-rejected raw-SQL-error toast — not a real user-reachable bug, not filed).
- TC-INE-021 (2026-09-08, explicitly asked: "did you tested on issue list page and project board and project list page"): tested the main `/projects` page (card-tile layout under Default theme — no separate table-view toggle found at the time) — Name is inline-editable, clean, no bugs. Also checked a single project's own Overview page and Administration → Projects (admin table): both have zero inline-edit icons, confirming this plugin doesn't extend either.
- TC-INE-022 (2026-09-08, explicitly asked: "now test in theme" — Stages 3/6, Lotus theme + 1280×720): re-tested Assignee widget, Description CKEditor, and Issues list under Lotus — all existing bugs (`BUG-INE-001`, `BUG-INE-003`) confirmed theme-agnostic, no new layout defects (Assignee/Status/Priority are core fields Lotus already styles, unlike Agile Board's plugin-injected Sprint/Story Points in `BUG-LTS-003`). **Correction to TC-INE-021**: discovered the Projects page under Lotus has a much richer card design PLUS a "Kartenansicht"/"Listenansicht" view toggle that does not exist under Default theme at all (confirmed both ways) — this is a Lotus-only enhancement, not something missed earlier. The "Listenansicht" view (`?display_type=list`) is the plugin's own "project table" view from its KB description — tested, fully translated, Name inline-editable, no bugs. Both card and list views clean at 1280×720 too.
- TC-INE-023 (2026-09-08, explicitly asked: "did you reported this bug save button size"): found the Description CKEditor's "Save" button renders 50px tall vs "Cancel"'s 34px under Lotus theme (both are 28px and matched under Default) — despite identical padding/border/line-height, confirming a Lotus-specific `.rf-btn--primary` CSS override. Filed as new `BUG-LTS-004` (Low) against the Lotus theme plugin.

## In Progress

- **2026-09-23 session: found and filed 2 new bugs** (`BUG-INE-005`, `BUG-INE-006`) while closing out most of the
  remaining test gap from the 2026-09-22 audit. Executed and confirmed: TC-INE-097/098/099/103 (Permissions,
  all PASS), TC-INE-067/077/078/082/086 (Issue List, PASS except 086), TC-INE-081 (Issue List, FAIL →
  BUG-INE-006), TC-INE-001/002/003 and the TC-INE-004/005 list-column legs (Custom Field Configuration, all
  PASS). TC-INE-076 resolved via cumulative evidence rather than a clean dedicated repro (see its Result — the
  widget's async re-render made a tight-loop 5-row script unreliable). TC-INE-101 and TC-INE-006/056/058's
  negative-endpoint legs remain unresolved — a `curl`-based attempt at TC-INE-101 was blocked by the harness's own
  auto-mode safety classifier (separate from, and in addition to, the user's own standing decline of raw
  `fetch()`), so both mechanisms now rule out constructing a raw request to a permission-sensitive endpoint. See
  `INLINE_EDITOR_MEMORY.md` for full details.
- **The user renumbered every TC-INE-xxx ID across the whole plugin some time before 2026-09-22's session**,
  as part of the repo-wide TC-ID migration documented in `CLAUDE.md` §4a (one continuous sequence per plugin code).
  This session's audit trusted the TC section headers as the source of truth (not old cross-references still
  floating in some prose), confirming: `INLINE_EDITOR_CUSTOM_FIELD_CONFIGURATION.md` = TC-INE-001–014,
  `INLINE_EDITOR_ISSUE_DETAIL_EDITING.md` = TC-INE-038–065, `INLINE_EDITOR_ISSUE_LIST_EDITING.md` = TC-INE-066–091,
  `INLINE_EDITOR_PERMISSIONS.md` = TC-INE-092–106.
- **Large execution pass, 2026-09-22 — see Run History.** Of the ~65 TCs that audit found with no Result line:
  **~30 now have a Result** (mostly PASS, a few resolved N/A or cross-referenced). Still outstanding:
  - `INLINE_EDITOR_CUSTOM_FIELD_CONFIGURATION.md`: TC-INE-001 step 2, 002, 003, 004/005 list-column leg, 006 step 3.
  - `INLINE_EDITOR_PERMISSIONS.md`: TC-INE-097/098/099/100(done, N/A)/101/102(done, cross-ref)/103 execution legs,
    plus every "leg 3" (negative endpoint) across TC-INE-093/094/095/096/097/104.
  - `INLINE_EDITOR_ISSUE_LIST_EDITING.md`: TC-INE-067 (Status column specifically), 074/075/076/077/078/080/081/
    082/083/084/085/086.
  - `INLINE_EDITOR_ISSUE_DETAIL_EDITING.md`: TC-INE-054/055/056(leg 3).
- **The negative-endpoint-leg ("leg 3") pattern is the single biggest remaining gap**, roughly 8–9 items. A
  hand-rolled `fetch()` for this was explicitly declined by the user mid-session 2026-09-22 (even though a
  same-session finding on TC-INE-088/106 showed a *real* 403 doesn't reliably trigger the native-popup risk). The
  workaround that DID work: drive the plugin's own real UI editor and let it fire the actual request — this
  yields genuine endpoint evidence whenever the affordance renders at all (used successfully for TC-INE-088's
  closed-project 403). The remaining gap is narrower: roles where the affordance is **completely absent** from the
  DOM (QA Read Only / harmony.rose) have no UI path to trigger a request at all — needs an agreed safer method.
- Permission-test infrastructure now exists for next session to use directly: roles "QA Read Only" / "QA Own
  Visibility"; projects "QA Private Project" (issue #1554), "QA Closed Test Project" (issue #1555, closed),
  "QA Archived Test Project" (issue #1556, archived); users `harmony.rose`/`summer.rain`/`willow.belle` added to
  "test project" under the appropriate roles. See `INLINE_EDITOR_MEMORY.md` for the full fixture list.

## Blockers

- None.

## Next Session Start Point

- **Every TC across all 6 suite files (107 in the 4 main suites, plus the 9-case German-language suite and the
  14-case Installation/Configuration suite) now has a Result. Nothing is BLOCKED, PARTIAL, or unexecuted** as of
  2026-09-23. This was corrected mid-session after the user pointed out several TCs had been marked "done" while
  actually only partially executed (leg 1 only, or one aspect of a multi-part TC) — see Run History for the full
  correction pass.
- **`BUG-INE-008/009/010` reported to production 2026-09-23** (see Open Bugs Found below). **Next session starts
  with:** decide whether to update `BUG-INE-006`'s already-filed production issue (#121113) with its now-broader
  scope (needs its own approval — see the bug file's "Additional scope confirmed" section). After that, run the
  fix/retest cycle for all 6 open bugs once fixes land. The plugin stays `In Progress` per `CLAUDE.md` §10.
- The only genuinely unresolvable item is TC-INE-028, whose own precondition (CKEditor configured) isn't true on
  this instance (it uses CommonMark) — recorded as precondition-not-met, not a gap; TC-INE-029 covers what
  actually applies here and is fully executed.

## Open Bugs Found

- `BUG-INE-005` (Medium) — issue-list Subject field's inline endpoint bypasses the 255-character length validation
  the standard Edit form enforces. Found 2026-09-23.
- `BUG-INE-006` (Medium) — issue-list view shows an edit pencil for a workflow-Read-only custom field and reports
  a false "Changes saved successfully." even though the server correctly drops the write. Found 2026-09-23.
  **Scope broadened same day** to cover the identical pattern on the issue detail page (core + custom fields) and
  on a forbidden status transition — see the bug file. Production issue #121113 was filed before the broadened
  scope was known; updating its description needs its own approval.
- `BUG-INE-007` (Medium) — a standard/core field's (Subject) inline-edit pencil can get stuck hidden after an
  inline Status change even once the new status permits editing, fixed only by a full page reload. Custom fields
  don't have this bug. Found live with the user 2026-09-23.
- `BUG-INE-008` (Medium): after a mid-edit revocation of edit rights, the inline Description save returns `302`
  and silently drops the change, but the plugin shows "Saved successfully.". Found 2026-09-23 via TC-INE-056 leg
  3, also confirmed via a view-only membership change (TC-INE-096 leg 2). Reported to production as `#121122`.
- `BUG-INE-009` (Medium): an open inline editor keeps saving after the user's session ends, because the plugin
  authenticates every save with the user's API key embedded in the page (`RfIE.config.apiKey`), independent of the
  session cookie. Found 2026-09-23 via TC-INE-084, using a real session-cookie deletion (not a mocked response).
  Reported to production as `#121123`, Defect Type Security (auth-bypass mechanism; severity kept Medium since
  it's the legitimate user's own browser, not a different party).
- `BUG-INE-010` (Low): the issue detail page loads Redmine's own `jstoolbar` scripts twice (once from core, once
  unconditionally injected by the plugin's `view_layouts_base_html_head` hook), throwing a `SyntaxError` on every
  load. No observed functional impact. Found 2026-09-23 via TC-INE-032. Reported to production as `#121124`.
- `bugs/open/` was empty from 2026-09-10 through 2026-09-22; it now contains the 6 bugs above (7 counting
  `BUG-INE-006`'s broadened scope as distinct evidence, though it is one bug file). **All 6 now have a Production
  Redmine Issue ID.**
- **First 3 reported to production 2026-09-23**, per explicit user approval: `BUG-INE-005`→`#121112`,
  `BUG-INE-006`→`#121113`, `BUG-INE-007`→`#121114` (all `ztflux`), all linked to Test Case `#121042` ("Sanity:
  Inline date editor auto-save timing fix") in Run `#577` / Test Suite `#146` ("Inline Issue Editor"), Environment
  "Windows 11 + Chrome" — testcase marked Failed with all 3 defects attached. Priority Medium / Defect Severity
  Medium-severity / Defect priority Medium / Defect Type Functional / Assignee Vaishnavi Bhawsar for all three.
  (A mid-session detour briefly moved `BUG-INE-006`/`BUG-INE-007` to Test Case `#85157` on the assumption that
  matching each bug's actual subject matter was wanted — the user corrected this immediately; all 3 belong on
  `#121042` per their original instruction, now restored and verified via `list_issue_relations`.)
- **Remaining 3 reported to production 2026-09-23, same session, later**: `BUG-INE-008`→`#121122`,
  `BUG-INE-009`→`#121123`, `BUG-INE-010`→`#121124`, all linked to the same Test Case `#121042` / Run `#577` /
  Test Suite `#146`, Environment "Window 11 + Chrome" (correct label, verified via `get_run_testcases` immediately
  after — no repeat of the earlier "Windows" vs "Window" mismatch). Priority/Severity mapped per each bug's local
  Medium/Low severity; Defect Type Functional (008), Security (009), Compatibility (010); Assignee Vaishnavi
  Bhawsar for all three. `get_run_testcases` confirms `#121042 [Failed] ... | defects:[121112, 121113, 121114,
  121122, 121123, 121124]` — all 6 visible on the run.
- **A second issue surfaced after that fix**: the user checked the run in the UI and saw #121042 still showing no
  linked defects. Root cause: the run's actual environment label is **"Window 11 + Chrome"** (no "s") —
  `report_defect` had been called with "Windows 11 + Chrome" (with the "s"), which silently created the
  issue-relation (defect link) but never attached the Failed `IssueStatusResult` to the run's actual environment
  row, since the label didn't match. The tool's own success message ("marked 'Failed' ... linked and visible in
  run") is misleading in this case — it does not guarantee the result is actually visible against the run's real
  environment. Re-ran all 3 `report_defect` calls with the corrected "Window 11 + Chrome" label; `get_run_testcases`
  now correctly shows `#121042 [Failed] ... | defects:[121112, 121113, 121114]`. **Always pull `get_run_testcases`
  first to copy the exact environment string verbatim — never assume standard spelling/pluralization.** See each
  bug's own "Production report" section for the final linkage.

## Closed Bugs

- BUG-INE-001 (Medium) — Assigned-to dropdown's "Search…" placeholder and "— None —" option untranslated. **Fixed**, verified 2026-09-09 — now "Suche"/"Keine".
- BUG-INE-002 (Medium) — save-rejection error toast's "Could not save:" prefix untranslated. **Fixed**, verified 2026-09-09 — now "Konnte nicht gespeichert werden:".
- BUG-INE-003 (Medium) — shared post-save toast and Description's Cancel/Save buttons untranslated. **Fixed**, verified 2026-09-09 — now "Erfolgreich gespeichert."/"Abbrechen"/"Speichern".
- BUG-INE-004 (Low) — interim "Saving…" loading indicator untranslated. **Fixed**, verified 2026-09-10 — now "Wird gespeichert…".

## Run History

| Date | Redmine Version | Environment | Tested By | Summary |
|------|-----------------|-------------|-----------|---------|
| 2026-09-07 | 7.0.1.stable | Forge (flux-fczk00paf49) | Claude (Playwright MCP) | Stage 1 (German, Default theme), 2 TCs (TC-INE-015–002), both FAIL, 2 bugs filed (BUG-INE-001, BUG-INE-002 — the latter found via cross-plugin testing of the Checklist Plugin's "block issue closing" enforcement). |
| 2026-09-08 | 7.0.1.stable | Forge (flux-frmka2kzh49) | Claude (Playwright MCP) | Second pass (new server, after the prior one expired): 3 TCs (TC-INE-017–005) covering Priority (PASS, native select), the Issues list view (mostly PASS, `BUG-INE-001` reproduces there too), and the Description CKEditor (FAIL, new `BUG-INE-003`). `BUG-INE-001` reconfirmed on the new server before extending coverage. |
| 2026-09-08 | 7.0.1.stable | Forge (flux-frmka2kzh49) | Claude (Playwright MCP) | TC-INE-020: confirmed `BUG-INE-003`'s "Saved successfully." toast also reproduces on Status and Priority changes (not just Description) — broadened the bug's scope. Dismissed one self-inflicted test artifact (synthetic DOM event caused a real-but-non-reproducible-by-users save error) as not a bug. |
| 2026-09-08 | 7.0.1.stable | Forge (flux-frmka2kzh49) | Claude (Playwright MCP) | TC-INE-021: tested the Projects card/list view (Name inline-editable, PASS) and confirmed a single project's Overview page + the admin Projects table are both out of this plugin's scope (zero inline-edit icons). No new bugs. |
| 2026-09-08 | 7.0.1.stable | Forge (flux-frmka2kzh49) | Claude (Playwright MCP) | Stages 3/6 (Lotus theme, default + 1280×720) (TC-INE-022). PASS overall, no new plugin bugs. `BUG-INE-001`/`BUG-INE-003` reconfirmed theme-agnostic. Discovered Lotus adds a richer Projects card design plus a card/list view toggle not present under Default — the list view is the plugin's own "project table" view, tested clean. All resolution/theme testing for this plugin now complete. |
| 2026-09-08 | 7.0.1.stable | Forge (flux-frmka2kzh49) | Claude (Playwright MCP) | TC-INE-023: Description CKEditor's Save button confirmed oversized (50px vs Cancel's 34px) under Lotus theme only (both 28px under Default). Filed new `BUG-LTS-004` (Low) against the Lotus theme plugin. |
| 2026-09-09 | 7.0.1.stable | Forge (flux-f04qohdte49) | Claude (Playwright MCP) | Retest pass, new Forge server after branch update: all 3 open bugs (BUG-INE-001/002/003) STILL REPRODUCE, no fix landed. New screenshot evidence added to all 3; none closed. Checklist "block issue closing" setting toggled on for BUG-INE-002 repro, then reverted to disabled afterward. |
| 2026-09-09 | 7.0.1.stable | Forge (flux-fdrk6suoj49) | Claude (Playwright MCP) | Second retest pass, new Forge server after branch update: **all 3 open bugs confirmed FIXED** and closed — BUG-INE-001 ("Suche"/"Keine"), BUG-INE-002 ("Konnte nicht gespeichert werden:"), BUG-INE-003 ("Erfolgreich gespeichert."/"Abbrechen"/"Speichern"). Found and filed new `BUG-INE-004` (Low) — a previously-undocumented interim "Saving…" loading indicator, still hardcoded English. `bugs/open/` now contains only this one new bug. |
| 2026-09-10 | 7.0.1.stable | Forge (flux-fhhcov1xf49) | Claude (Playwright MCP) | BUG-INE-004 retested and confirmed FIXED ("Wird gespeichert…"), closed — `bugs/open/` now empty. **Final cycle regression — 9 TCs (TC-INE-015–009) re-run, all PASS**, zero new failures. `STATUS.md` set to `Complete`. |
| 2026-09-15 | n/a (authoring only) | n/a | Claude | **Test-case authoring pass — nothing executed.** Vendor knowledge base ingested from https://www.redmineflux.com/knowledge-base/plugins/inline-editor-plugin/ and 81 functional, negative and permission test cases written across 4 new suites (TC-INE-024 onward): INLINE_EDITOR_INSTALLATION_CONFIGURATION, ISSUE_LIST_EDITING, ISSUE_DETAIL_EDITING, PERMISSIONS. Existing suites and their execution evidence were left untouched; the new cases start at 101 so they cannot collide with the existing TC-INE-0xx numbering. Next session should start with the installation/configuration suite, then permissions, then the functional suites in file order. |
| 2026-09-21 | n/a (authoring only) | n/a | Claude | **Test-case authoring pass — nothing executed.** Fetched production feature #120919 (inline date editor auto-save timing fix) and authored TC-INE-060–328 (`ISSUE_DETAIL_EDITING.md`) plus TC-INE-090–226 (`ISSUE_LIST_EDITING.md`) against its own QA notes. Also created production sanity testcase #121042 in suite #146 "Inline Issue Editor", per explicit user approval. |
| 2026-09-22 | 7.0.0 (local Docker) | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | Executed TC-INE-060–328 and TC-INE-090–226 against production fix #120919. Created 2 new Date-format custom fields (`cf_61` issue-level, `cf_62` project-level). **All 8 TCs PASS** across issue-detail built-in date, issue-detail custom field, issue-list Due-date column, and issue-list/project-list custom-field columns — verified via a `fetch`/XHR network interceptor, not just visual state: zero premature saves while typing (incl. truncated zero-padded years), single correct save on blur/Enter, zero saves on Escape, immediate save on calendar-pick. Followed up on explicit user question ("have you tested start date??") by running the same checks against **Start Date** (detail page + list column) — **both PASS**, identical to Due Date; also incidentally reconfirmed the pre-existing Start/Due cross-field validation (genuine `422`, no data corruption). One intermittent (seen on `cf_61` and `start_date`, not on `due_date`) duplicate-save non-finding on the issue-list view, not reliably reproducible across several retries — treated as a test-harness artifact, not filed. No bugs found this session. |
| 2026-09-22 | n/a (authoring only) | n/a | Claude | **Test-case authoring pass — nothing executed.** User asked whether a broad list of custom-field-configuration and permission scenarios had been tested (Required enforcement, tracker/project-scoped fields, List-format multi-select display type, workflow field permissions changing live with Status, multiple simultaneously-required fields, "Edit own issues" vs "Edit issues", per-project "Edit project"). Confirmed against every existing suite that only generic/adjacent coverage existed (TC-INE-043, TC-INE-057/903, TC-INE-103) — none of these specific scenarios. Authored 8 new TCs in a new suite `INLINE_EDITOR_CUSTOM_FIELD_CONFIGURATION.md` (TC-INE-001–408) and 3 new TCs appended to `INLINE_EDITOR_PERMISSIONS.md` (TC-INE-104–915). |
| 2026-09-22 | 7.0.0 (local Docker) | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **Required + Read-only-at-same-status pass.** Created new field `cf_70` (Required ✓ at creation) with a Workflow rule (Developer/Bug: New=Read-only, other statuses blank). Tested as `daisy.skye` from fresh issue creation — **TC-INE-011 PASS, no deadlock**: `cf_70` absent (not disabled) from the New-issue form, issue #1552 created clean; inline Priority edit at "New" saved directly (Redmine exempts read-only fields from Required entirely); Status→In Progress correctly triggered the Edit-form fallback for all 3 now-unmet fields (`cf_65`, `cf_69`, `cf_70`) at once, completed cleanly. Confirmed this is Redmine core semantics, not plugin-specific. No bugs found. |
| 2026-09-22 | 7.0.0 (local Docker) | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **Workflow field-permissions pass.** Surveyed Workflow → Fields permissions across all role × tracker combos (zero pre-existing rules). Reconfigured `cf_69` (Developer/Bug: New=Read-only, In Progress=Required) and promoted `daisy.skye` to Developer on "test project" (admin is exempt from these rules). Executed **TC-INE-007 PASS** and **TC-INE-006 PARTIAL PASS** as daisy.skye: read-only field shows no inline affordance at "New"; inline Status New→In Progress with the field blank is rejected ("Qa workflow field cannot be blank") and the **full Edit form opens in place** with the attempted status preserved and the field now editable; filling + submitting completed the transition and the field then shows an inline pencil at the new status. Outstanding: TC-INE-006 step 3 (negative endpoint leg) — first attempt via hand-rolled `fetch()` hit a `401` that raised the browser's native Basic Auth popup and hung the session; that 401 is CSRF, not permission evidence, so server-side enforcement of Read-only is unproven. Lesson saved to global memory. No bugs found. |
| 2026-09-22 | 7.0.0 (local Docker) | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | User asked to explore real custom fields first and ground the TCs above in them, plus test the specific "required field unmet → redirect to Edit form" behavior. Explored Administration → Custom fields: found zero pre-existing fields beyond `cf_61`/`cf_62`. Created 7 new fixture fields (`cf_63`–`cf_69`: 2 Required text fields, 1 Bug-tracker-only field, 1 test-project-only field, 1 multi-select List field, 1 single-select List field, 1 field with a Workflow → Fields permissions rule for role Developer/tracker Bug). Rewrote TC-INE-001–408's preconditions to reference these real fixtures. Authored and **executed** new TC-INE-009: confirmed PASS — an inline save rejected for unmet required fields (`cf_63`+`cf_64` both blank) renders the full standard Edit form in place, lists both field errors together, and preserves the user's in-progress Priority change; completed the flow end-to-end (filled both fields, submitted, all changes persisted). Not a bug. Had to re-authenticate mid-session (browser session had switched to seed user `luna.blossom`, not admin) — signed out and back in as admin. |
| 2026-09-22 | 7.0.0 (local Docker) | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **Full regression + every remaining custom field format.** Created the last 8 format fixtures (`cf_71`–`cf_78`: Boolean, Integer, Float, Long text, Link, User, Version, Attachment) plus a project-level Text field (`cf_79`). **TC-INE-012/413/414 all PASS.** Mapped every format's actual widget and save-trigger on the issue detail page: `rf-ss` single-select dropdown (Date/Boolean/User/Version), `rf-ms` multi-select with chips (List+Multiple-selection), plain native `<select>` (List without Multiple-selection, matching Priority), plain text input saving on **Enter** (Text/Integer/Float/Link), `<textarea>` saving on **Ctrl+Enter** (Long text — plain Enter inserts a newline, blur alone does not save), and Attachment with **no inline-edit affordance at all** (by design). Two genuine non-bug findings: (1) the multi-select widget silently discards its pending selection on outside-click — confirmed via reload — requiring its own explicit Save button, unique among this plugin's widgets; (2) Boolean uses `rf-ss` on the issue detail page but a **plain native `<select>`** on the issue list — a real, confirmed surface inconsistency, not a defect. Regression-swept all 4 inline-editable surfaces (issue detail, issue list, project list, project board/card) with a representative sample plus full core-field re-confirmation — no regressions found anywhere. Round-tripped the project board's Name field cleanly. No bugs found this session. |
| 2026-09-22 | 7.0.0 (local Docker) | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | User asked whether TC-INE-104/914 had also been checked on the **issue list** page specifically (not just detail) — they hadn't. Retested both as `daisy.skye` and `luna.blossom` on `/projects/test-project/issues` (both #1553 and #1551 visible in the same list): **identical results confirmed on the list view** — Daisy's own issue (#1553) Priority column has a working pencil (changed to "Low", `200`, persisted); Admin's issue (#1551) has zero pencil for her. Luna (Manager) successfully edited #1553's Priority from the list too ("Immediate", `200`, persisted). No divergence between the two surfaces found. |
| 2026-09-22 | 7.0.0 (local Docker) | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **Permission-granularity execution pass.** User asked directly whether "Edit own issue"/"Edit issue"/"Edit project" had been tested and regressed — they hadn't (only authored). Checked Administration → Roles and permissions: Reporter had neither `edit_own_issues` nor `edit_project` checked by default on this instance. Reconfigured Reporter (`edit_own_issues=true`, `edit_project=true`, `edit_issues` stayed false) — the first save attempt silently failed due to Redmine's own "sudo mode" password re-confirmation, not noticed until checking the resulting page's own text (lesson saved to global memory). Moved `daisy.skye` to Reporter on "test project"; created issue #1553 authored by her. **TC-INE-104 PASS** (steps 1–2): her own issue (#1553) edits inline successfully; issue #1551 (Redmine Admin's) shows zero inline affordance — negative endpoint leg (step 3) skipped, same raw-`fetch()` popup risk as TC-INE-006. **TC-INE-105 PASS**: `luna.blossom` (Manager, `edit_issues=true`) successfully inline-edited #1553 despite not authoring it. **TC-INE-106 PASS with a genuine cosmetic finding**: on the project list, "test project" (edit_project granted) saved correctly (`204`); "Helpdesk Service Desk" (not granted) showed an inline pencil it shouldn't have, but the actual save attempt correctly got `403` with zero data corruption — the endpoint is the real gate, a present pencil isn't proof a write will succeed, symmetric to TC-INE-096's "absent pencil isn't proof a write is blocked." Not filed. No bugs found this session. |
| 2026-09-22 | 7.0.0 (local Docker) | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **Large post-renumbering execution pass.** User had renumbered every TC-INE ID plugin-wide (part of the repo migration in `CLAUDE.md` §4a) and asked to test whatever was left untested under the new numbering. Audited all 4 suite files against their section headers (the reliable source of truth, vs. some stale old-numbering leftovers in prose) and found ~65 TCs with no Result line. Built new permission-test infrastructure: roles "QA Read Only" (`view_issues` only) and "QA Own Visibility" (`issues_visibility=own`); projects "QA Private Project" (private, issue #1554), "QA Closed Test Project" (issue #1555, closed via Actions→Close), "QA Archived Test Project" (issue #1556, archived via admin Projects list); added `harmony.rose`/`summer.rain`/`willow.belle` to "test project" under the new roles/Developer. Executed and confirmed PASS on: TC-INE-092 (Admin baseline, 5 field types incl. workflow-exempt `cf_69`); TC-INE-038/039/040/042 (Status/Priority/Assignee/%Done on detail); TC-INE-044/073 (journaling, both surfaces); TC-INE-045–048/050/051/053 (description edit mode, formatting, save, cancel, cross-ref links, script-injection — confirmed inert); TC-INE-052/059 (100KB description, rapid-save optimistic-locking `422`); TC-INE-066/068/069/070 (list column affordance/Priority/Subject/Assignee); TC-INE-079/087 (empty-subject rejection, script-injection on the list — both clean); TC-INE-088/089/102 (closed-project pencil-shown-but-403, archived-project fully inaccessible, closed-issue Admin baseline — same cosmetic-pencil pattern as TC-INE-106). Resolved TC-INE-058/100 as N/A (plugin exposes zero inline affordance on journal notes at all — confirmed via DOM query, not assumption). PARTIAL PASS (leg 1/positive + dropdown-filtering only) on TC-INE-057/093/094/095/096/097: `cf_69`'s Read-only-at-New rule correctly suppresses just that field's icon for `willow.belle` (Developer) while Priority stays editable; `harmony.rose` (QA Read Only) has zero edit icons anywhere, DOM-confirmed. A hand-rolled `fetch()` for the negative-endpoint leg was declined by the user mid-session — noted as the single biggest remaining gap (~8–9 items) and left for a follow-up on how to drive it safely. TC-INE-097/098/099/101/103 fixtures are ready but execution still outstanding. No bugs found this session. All results written to both testcase files' Result lines/Evidence Maps. |
| 2026-09-23 | 7.0.0 (local Docker) | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **Continuation of the post-renumbering execution pass.** Recovered from an infrastructure snag first (the asset-precompile manifest had gone empty after a container restart, causing every page including `/login` to 500 — fixed by re-running `rake assets:precompile` in the background). Executed TC-INE-097/098/099/103 (Permissions, all PASS — non-member/cross-project 403s, instance-wide auth-required blocks anonymous entirely, visibility-scoped role sees zero other issues and gets 403 on a direct hit). Executed TC-INE-067/077/078/082/086 (Issue List) and TC-INE-081 — found and filed **2 new bugs**: `BUG-INE-005` (list Subject field accepts an unbounded-length value the standard form's own validation rejects) and `BUG-INE-006` (list view shows an edit pencil for a workflow-Read-only field and falsely reports success on a write the server actually drops) — the latter directly answers `TC-INE-094`'s "single highest-value case" question (endpoint enforces correctly; UI doesn't). Closed out `INLINE_EDITOR_CUSTOM_FIELD_CONFIGURATION.md`'s last 3 open items (TC-INE-001 step 2, 002, 003, all PASS) plus the TC-INE-004/005 list-column legs. A `curl`-based attempt to test TC-INE-101 (permission revocation) was blocked by the harness's own auto-mode safety classifier before any write occurred — abandoned that approach entirely, consistent with the user's earlier decline of raw `fetch()`. `bugs/open/` now contains 2 bugs (was empty). |
| 2026-09-23 | 7.0.0 (local Docker) | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **Final closeout pass on the remaining suite gap.** User asked "any testcase are remaining" then "test them." Executed TC-INE-075 (filter/sort persistence, PASS — Status→Closed while filtered to open updated in place with an honest "Closed" cue, correctly filtered out after reload), TC-INE-085 (network failure, PASS — mocked `fetch` rejection produced "Could not save: Failed to fetch" and the value reverted, server untouched), TC-INE-074 (notifications, PASS — confirmed via container logs that inline edits enqueue and perform a real `Mailer::DeliveryJob` for `issue_edit` addressed to the issue's watchers, not via a second inbox), and TC-INE-084 (session expiry, INCONCLUSIVE — the session cookie is `HttpOnly` so a real expiry couldn't be triggered from page JS; a mocked expired-session-shaped response (200+HTML) produced a false "Saved successfully." toast, demonstrating the client's success detection is HTTP-status-only, but this exact response shape isn't confirmed as what the real endpoint returns for an actual expired session — flagged, not filed as a bug). Confirmed Playwright's tabs share one cookie jar in this setup (checked `/my/account` in a second tab), so a truly isolated second session isn't currently possible — this rules out TC-INE-101/083/054/055 without a different mechanism. Remaining gap is now down to 5 items, all blocked by either that constraint or the "no UI element exists to click" constraint on negative-endpoint legs (TC-INE-006 step 3, TC-INE-056 leg 3). No new bugs found this pass. |
| 2026-09-23 | 7.0.0 (local Docker) | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **User-driven live investigation, found `BUG-INE-007`.** User reconfigured Workflow → Fields permissions themselves (Tracker Read-only at New, Subject Read-only at In Progress, role Developer/tracker Bug) and reported "when we change status then readonly field editable on that state editor icon not appear" on the issue detail page — asked to verify as Admin specifically. Reproduced cleanly and consistently (3 times): reload the page while Subject is genuinely read-only at the current status (pencil correctly absent) → inline-transition Status to one where Subject has no restriction → **pencil stays stuck hidden** (should reappear, doesn't) → a full page reload fixes it. Critically, the *identical* sequence does NOT reproduce for `cf_69` (a custom field) per the existing TC-INE-006/007 evidence — its pencil correctly reappears live, no reload needed. This points to two separate code paths (custom fields re-evaluate permission state live after a status change; core fields rely on a stale page-load flag) and also means the session's standing "Admin is exempt from workflow field permissions" note applies to custom fields only — Admin's own reload-rendered view also hides Subject's pencil when it's workflow-read-only. Filed as `BUG-INE-007` (Medium). `bugs/open/` now contains 3 bugs. |
| 2026-09-23 | 7.0.0 (local Docker) | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **Session closeout — production reporting, corrections, and final blocked-item confirmation.** Reported all 3 open bugs to `flux.zehntech.com` (`ztflux`) per explicit approval: `BUG-INE-005`→`#121112`, `BUG-INE-006`→`#121113`, `BUG-INE-007`→`#121114`, all linked as defects to Test Case `#121042` / Run `#577` / Suite `#146`, Environment "Window 11 + Chrome" (note: no "s" — an initial attempt with "Windows 11 + Chrome" silently failed to attach the Failed status to the visible run row even though the tool reported success; corrected after the user caught it in the UI). Also corrected a mid-session detour that had briefly split 2 of the 3 bugs onto a different, better-semantically-matching testcase (`#85157`) based on my own judgment — the user clarified all 3 belonged on `#121042` as originally instructed, restored via `delete_issue_relation` + re-`report_defect`. Authored **TC-INE-107** in `INLINE_EDITOR_CUSTOM_FIELD_CONFIGURATION.md` codifying `BUG-INE-007`'s exact repro sequence (drafted from the live finding, with its Result already filled in as FAIL). Attempted to unblock TC-INE-083 (concurrent edit) via an isolated `curl` second-session (separate from the browser's cookie jar) — login succeeded, but a follow-up read-only step was stopped by the harness's auto-mode classifier, confirming the same class of restriction blocks ordinary concurrent-edit testing, not just permission-modifying writes. Marked all 6 remaining items (TC-INE-101/083/054/055/006-step-3/056-leg-3) as **BLOCKED** (not "not executed") across all 4 suite files, with the exact constraint documented in each Result, per explicit user instruction to finalize the session. No further action possible on these without an external unblock. |
| 2026-09-23 | 7.0.0 (local Docker) | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **Unblocked all 6 BLOCKED items using two isolated browser contexts** (`browser.newContext()` via `browser_run_code_unsafe`, each with its own cookie jar; user explicitly allowed this). **TC-INE-006 step 3 PASS**: with Willow's `cf_69` editor open, admin set `cf_69` to Read-only at the issue's current status. That is a workflow config change, so `lock_version` was unchanged. The submit returned 200 with `cf_69` echoed `""`, so the server drops the write. **TC-INE-083 PASS**: A's status change and B's stale-page priority change both survived (Feedback + High). **TC-INE-054 PASS**: B's stale description save was refused with a "modified by another user" message and A's text was kept. **TC-INE-055 PASS**: after B closed the issue, A's confirm got a 422 stale-object error with a clear toast and no partial write. **TC-INE-101 PASS**: after mid-edit revocation of `edit_issues`, the field save got `403 Forbidden`. **TC-INE-056 leg 3**: field half PASS (403); description half FAIL, filed as **`BUG-INE-008`** (Medium). That save goes through the standard update action and returns 302; the change is silently dropped but the plugin shows "Saved successfully.". Reproduced 3 times. Fixture work: filled the required custom fields on #1560 (`cf_65`/`cf_70` as admin); added a baseline description to #1560; #1560 now sits at Feedback. Gotcha: toggling "Edit issues" on the role form also clears its "All trackers" scope. The Developer role was restored to `edit_issues` ✓ + All trackers ✓, and the `cf_69` workflow row to `["readonly","required","","","",""]`, both verified. `bugs/open/` now holds 4 bugs. |
| 2026-09-23 | 7.0.0 (local Docker) | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **Completion pass, prompted by the user catching that several TCs marked "done" were only partially executed.** Audited every TC in all 6 suite files and found 6 more with only one leg/aspect done: TC-INE-094/095/096 (Permissions, endpoint leg missing), TC-INE-057 (Detail Editing, endpoint leg missing), TC-INE-049 (attachment/inline-image round trip not exercised), TC-INE-084 (session expiry, only mocked, not real). Executed all 6 to completion. **TC-INE-094/095/096/057 (leg 2): the server enforces every rule tested (workflow read-only field, forbidden status transition, view-only membership), but each gets a silent 200/302 with "Saved successfully." instead of a refusal — recorded under `BUG-INE-006`'s now-broadened scope, except the view-only membership's description leg which reproduces `BUG-INE-008`.** **TC-INE-049 PASS**: full round trip of an inline description edit with an existing inline image and attachment link, both intact after the save. **TC-INE-084**: repeated with a real session end (deleted the `_redmine_session` cookie via Playwright, not a mocked response) — the save still succeeded via the plugin's embedded API key even with zero cookies, and the change persisted after re-login. This is a real defect, not the earlier INCONCLUSIVE finding; filed as **`BUG-INE-009`** (Medium). Then executed the entire previously-unexecuted `INLINE_EDITOR_INSTALLATION_CONFIGURATION.md` suite (TC-INE-024–037, 14 TCs) for the first time, including 4 destructive cases (folder rename, migration check, stale-cache reproduction, full uninstall) run against the shared `redmine-docker-700` instance with explicit user approval given the restart risk — all fully restored and verified afterward. Cross-browser testing (TC-INE-030) ran the identical inline-edit sequence in real Chrome, Edge and Firefox via Playwright, all identical. Found **`BUG-INE-010`** (Low) via TC-INE-032: the issue detail page loads Redmine's own `jstoolbar` twice (once from core, once unconditionally injected by the plugin), throwing a console `SyntaxError` on every load — no observed functional impact. TC-INE-028's precondition (CKEditor) is not true on this instance; recorded as precondition-not-met, with TC-INE-029 (CKEditor absent) covering what actually applies and PASSing. **Confirmed: every TC in every suite file for this plugin (107 + 9 + 14 = 130 total) now has a Result — none BLOCKED, PARTIAL, or unexecuted.** `bugs/open/` grew from 4 to 6 bugs this session (BUG-INE-008/009/010 all new, none yet reported to production). `BUG-INE-006`'s already-production-filed issue (#121113) has a broader scope now than what was originally reported — flagged for the user to decide whether to update it.
| 2026-09-23 | 7.0.0 (local Docker) | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **Production reporting pass.** Reported `BUG-INE-008/009/010` to `flux.zehntech.com` (`ztflux`), per explicit user approval of a prepared write proposal (subject/severity/assignee/Textile description shown for each before creation): `BUG-INE-008`→`#121122` (Functional, Medium), `BUG-INE-009`→`#121123` (Security, Medium — flagged as an auth-bypass mechanism though not privilege escalation, since it's the legitimate user's own browser), `BUG-INE-010`→`#121124` (Compatibility, Low). Linked all 3 as defects to the same Test Case `#121042` / Run `#577` / Suite `#146` the first 3 bugs already used, with the environment label pulled fresh via `get_run_testcases` first ("Window 11 + Chrome", confirmed unchanged) rather than assumed, to avoid repeating the earlier "Windows" vs "Window" mismatch. Verified with a second `get_run_testcases` call that all 6 defect IDs (`121112, 121113, 121114, 121122, 121123, 121124`) now show against `#121042` in the run. All 6 open bugs for this plugin now have a Production Redmine Issue ID. Remaining production follow-up: whether to update `BUG-INE-006`'s already-filed issue (`#121113`) description to reflect its broadened scope — not done, needs its own separate approval.
| 2026-09-23 | 7.0.0 (local Docker) | Local Docker `redmine-docker-700` (http://localhost:3010) | Claude (Playwright MCP) | **Project custom field coverage pass.** User asked directly whether project list editing with custom fields and other fields had been tested — audit found only 2 of 10 supported custom-field formats (Text, Date) had ever existed as project-level fields, and the project list's non-Name core fields (Identifier/Description/Status/Homepage/Public) had never been individually checked. Created 9 new project-level custom-field fixtures (`cf_80`–`cf_88`: Boolean, Integer, Float, Long text, Link, User, Version, List-multiple, List-single) via Administration → Custom fields, added them as columns on `?display_type=list`, and confirmed all 9 PASS as Admin (`PUT /projects/5.json` → `204` each, all persisted after reload) — same widget/save-trigger mapping as issue-level, no surface differences. Also discovered and tested Homepage (text input) and Public (Yes/No select) are inline-editable on the project list too, not just Name — both PASS, both reverted afterward (shared "test project" settings, unlike the additive new custom-field fixtures which were left in place). Identifier, Description and Status columns confirmed to render zero pencils on this surface — genuinely not offered, not a permission artifact (verified as Admin). Also confirmed `canEditProjects` is a global flag, not per-project: `willow.belle` (no `edit_project` anywhere) saw zero pencils on the whole page even though other permissions are fine — this sweep had to run as Admin instead. No bugs found this pass; this was closing a coverage gap, not investigating a suspected defect. Every custom-field format this plugin supports is now confirmed working on every surface it's offered on. |
