# Plugin Memory — Redmineflux Inline Editor

> Plugin-specific observations only. Global rules live in root MEMORY.md.

## Known Quirks

- The `rf-ss` searchable-dropdown widget (used by Assignee, and likely other fields) hardcodes "Search…" and "— None —" — not routed through Redmine's i18n. Priority does NOT use this widget (plain native `<select>`), so don't assume every dropdown-like field shares this gap — check which widget it actually renders first.
- Icon-only edit triggers use `class="rf-edit-icon"` with `aria-label="Edit"` and no visible text — per standing convention, aria-label-only untranslated strings are out of scope for this visual German-language cycle.
- Success/error toasts use `div.rf-toast.rf-toast--success` / `.rf-toast--error` and auto-dismiss very fast — always capture via a `MutationObserver` injected before triggering the action, not a manual screenshot round-trip. A static screenshot of the toast itself IS achievable (unlike Agile Board's drag-toast) with a tight polling loop — check `document.body.innerText.includes(...)` every ~50ms in the same script that triggers the save, and fire `page.screenshot()` the instant it's true.

## Confirmed Working

- Subject inline edit (both issue detail page and Issues list view): plain text input, no separate Save/Cancel buttons, saves on Enter/cancels on Escape — no translatable strings in this control.
- Priority inline edit: plain native `<select>`, option values are admin-configured priority names (data, not UI strings).
- Description CKEditor's tab labels ("Bearbeiten"/"Vorschau"), toolbar tooltips, and the "Zitieren" (Quote) link are all correctly translated.
- Date fields (built-in Start date AND Due date, plus Date-format custom fields, on the issue detail page, issue
  list column, and project list column) use a native `<input type="date">`. Confirmed 2026-09-22 against production
  fix #120919: no save fires while typing (even mid-year, even while paused), save fires once on blur or Enter with
  the exact typed value, Escape discards the edit, and picking a full date (calendar-pick or programmatic `.fill()`)
  still saves immediately — all verified via a `window.fetch`/XHR network interceptor, not just visual state. Both
  Start Date and Due Date were explicitly checked (not just Due Date as a stand-in) since the production fix names
  both by name.
- The Start/Due date cross-field validation ("Due Date must be greater than start date") still works correctly
  under this widget — confirmed via a genuine `422` response when testing an invalid combination. A rejected save
  reverts the cell with no data corruption; the error toast itself auto-dismisses too fast to catch without a
  `MutationObserver` set up in advance (same pattern as `BUG-INE-002`'s toast). **Confirmed the error IS actually
  shown to the user** (not just rejected server-side) on both the issue detail page and the issue list column, via
  `MutationObserver` text capture. Minor wording inconsistency (not a bug): the detail page wraps it as "Could not
  save: Due Date must be greater than start date", the issue list shows just "Due Date must be greater than start
  date" (no prefix) — same underlying error, both correctly block the save.
- The issue-list view's inline save occasionally (not reliably — seen on `cf_61` and on `start_date`, not on
  `due_date` in the same session) fires the identical save `PUT` twice instead of once. Both calls succeed (`200`,
  same value) so no data corruption results, and it could not be reproduced on demand across several retries —
  logged as an inconclusive, unfiled observation rather than a bug (see `INLINE_EDITOR_ISSUE_LIST_EDITING.md`).
- **Confirmed working (not a bug), 2026-09-22:** when a user inline-edits any field while one or more Required
  custom fields on the issue are blank, the inline PATCH is rejected server-side and the plugin gracefully falls
  back to rendering the full standard Edit form **inline in place** (no hard page navigation, URL stays
  `/issues/:id`), listing every unmet-required-field error together (not one-at-a-time), with the user's
  in-progress attempted change (e.g. a Priority selection) already pre-filled in the fallback form rather than
  discarded. Filling the required fields and submitting completes successfully with all changes applied. This is
  the real, working answer to "what happens with an unmet required field during inline edit" — see
  `INLINE_EDITOR_CUSTOM_FIELD_CONFIGURATION.md` TC-INE-009 for full evidence.
- The instance had **zero** custom fields configured before this plugin's own testing began — every custom field
  used across this plugin's suites (`cf_61`–`cf_69`) is a QA-created fixture, not pre-existing server data. Always
  check Administration → Custom fields first (both the Issues and Projects tabs) before writing a TC precondition
  that assumes a field exists — see `INLINE_EDITOR_CUSTOM_FIELD_CONFIGURATION.md`'s Fixtures table for the current
  full list and what each one is for. The same is true of **Workflow → Fields permissions**: surveyed across all
  role × tracker combinations 2026-09-22, it had **zero** pre-existing rules; the only rule on the instance is the
  `cf_69` fixture (role Developer / tracker Bug: New = Read-only, In Progress = Required).
- **Admin is exempt from workflow field permissions** — read-only/required-per-status rules have no effect when
  logged in as `admin`. Any workflow field-permission test must run as a non-admin user holding the exact role the
  rule targets. Fixture for this: `daisy.skye`'s membership on "test project" was changed from Reporter to
  **Developer** on 2026-09-22 specifically so the `cf_69` rule applies to her (left in place for future runs).
- **Confirmed working (not a bug), 2026-09-22 — the full status-dependent field lifecycle:** a field that is
  Read-only at status A and Required at status B renders with *no inline affordance at all* at A; inline-changing
  Status A→B while it's blank is **rejected** ("<field> cannot be blank" — the workflow rule IS enforced on the
  inline path), and the plugin then **opens the full Edit form in place** with the attempted status change
  preserved and the field now **editable** (evaluated against the new status), so the user can satisfy the
  requirement the transition just created. After submitting, the field shows an inline pencil at the new status.
  Same fallback mechanism as the always-required case (TC-INE-009). See
  `INLINE_EDITOR_CUSTOM_FIELD_CONFIGURATION.md` TC-INE-006/407.
- **The Edit-form fallback is one consistent mechanism**, confirmed 2026-09-22 across all three combinations:
  (a) custom-field-level Required unmet + editing a non-status field (TC-INE-009); (b) workflow-level per-status
  Required unmet + changing Status (TC-INE-007); (c) custom-field-level Required unmet + changing Status
  (TC-INE-010). In every case: inline save rejected with the real validation message → full Edit form rendered in
  place (URL unchanged) → attempted change preserved → field editable → submit completes normally. Also confirmed:
  merely *sitting on* an issue with an unmet required field produces **no error at all** — nothing is being saved,
  so nothing complains. Both rule types coexist correctly on the same issue (a custom-field-Required field stays
  inline-editable while a workflow-Read-only field on the same issue shows no pencil).
- In the fallback Edit form, fields are evaluated against the **target** status, not the current one — so a field
  that is workflow-Read-only at the current status renders **editable** in the form opened by a transition to a
  status where it isn't. That's what makes the recovery path actually usable.
- Workflow **status transition** rules also apply (separately from field permissions): as Developer, In Progress →
  New was simply absent from the inline Status dropdown. Use admin (exempt) to reset a fixture issue's status.
- **Still unproven:** whether the *endpoint* enforces a workflow Read-only field, or only the UI hides the pencil.
  See TC-INE-006 step 3 — and read the global memory note "Avoid Raw fetch() On .json Endpoint Tests" before
  attempting it, since the obvious approach hangs the browser on a native Basic Auth popup.
- **Every custom field format's widget, confirmed 2026-09-22 (issue detail page)**: Date/Boolean/User/Version use
  the `rf-ss` single-select searchable dropdown ("Search…" placeholder); List-with-Multiple-selection uses a
  distinct `rf-ms` widget with removable chips; List-without-Multiple-selection and Priority/Status use a plain
  native `<select>`; Text/Integer/Float/Link use a plain text input; Long text uses a `<textarea>`; Attachment has
  **no inline-edit affordance at all** (by design — a file-upload field doesn't fit a click-to-edit pattern).
- **Per-format save trigger, confirmed 2026-09-22** — this plugin does NOT use one universal save mechanism:
  - Native `<select>` and `rf-ss` (single-select): saves instantly on selection/`change`.
  - Plain text input (Text/Integer/Float/Link): saves on **Enter**; blur alone does **not** save.
  - `<textarea>` (Long text, and Description's CKEditor separately): saves on **Ctrl+Enter**; plain Enter inserts
    a newline, blur alone does **not** save. No visible UI hint anywhere that Ctrl+Enter is the shortcut — a minor
    discoverability gap, not filed as a bug.
  - `rf-ms` (multi-select): requires clicking an explicit **Save** icon-button (a Cancel button sits next to it);
    clicking away discards the pending selection **silently, with no warning** — confirmed via reload that an
    outside-click-only attempt left the field blank in the database. This is the one widget in the whole plugin
    that behaves this way; every other field type in this plugin either auto-saves or saves on Enter/blur.
  - Date fields (native `<input type=date>`): saves on blur or Enter (see #120919 fix — `INLINE_EDITOR_ISSUE_DETAIL_EDITING.md`).
- **Widget choice is not always consistent between issue-detail and issue-list surfaces for the same field**,
  confirmed 2026-09-22: Boolean uses `rf-ss` on the detail page but a **plain native `<select>`** on the issue
  list. User (`rf-ss` on both) does not have this inconsistency. Both are functionally correct — not a bug, but
  worth knowing before assuming "whatever widget the detail page uses" when writing a list-view TC.
- **Permission-granularity trio confirmed 2026-09-22 (TC-INE-104/914/915), all PASS — on BOTH the issue detail
  page and the issue list view** (user explicitly asked whether the list page specifically had been checked; it
  hadn't at first — always check both surfaces for a permission TC in this plugin, they're separate widget
  implementations and either could diverge):
  - `edit_own_issues` (without `edit_issues`) genuinely restricts to the user's own issues: no inline affordance
    at all on someone else's issue, on either surface. Fixture: Reporter role reconfigured
    (`edit_own_issues=true`, `edit_issues` stayed false), `daisy.skye` moved to Reporter on "test project".
  - `edit_issues` (Manager, `luna.blossom`) genuinely grants any-issue edit on both surfaces, not silently
    narrowed to "own".
  - On the issue list specifically, the own/others distinction was confirmed to hold for **every** editable
    column (Status, Subject, Assignee, Priority), not just Priority — checked after being asked "all thing
    working as expected on issue list page??" following an initial check that had only exercised Priority. No
    console errors observed under the restricted role.
  - `edit_project`, per-project: on the project **list** view, a real save attempt is the only trustworthy signal
    — the inline pencil **incorrectly appeared** on a project where `edit_project` was NOT granted (Helpdesk
    Service Desk), but the actual save correctly got a `403` with zero data corruption. The endpoint is the real
    gate; a *present* pencil is not evidence a write will succeed, same as a missing one isn't evidence it's
    blocked (TC-INE-096's methodology, now confirmed to run in both directions). Cosmetic-only, not filed.
  - **Reporter role had neither `edit_own_issues` nor `edit_project` checked by default on this instance** — do
    not assume stock Redmine role defaults; always check Administration → Roles and permissions first.
  - **Redmine's own "sudo mode"** (a password re-confirmation interstitial) can silently swallow a role-permission
    save that otherwise looks successful — see the dedicated reference memory "Redmine Sudo Mode On Admin Saves".
    Always reload and re-check the actual checkbox state after saving a role, not just the redirect.
- **Regression baseline confirmed 2026-09-22 across all 4 inline-editable surfaces** (issue detail, issue list,
  project list, project board/card): every already-tested field on every surface still works correctly after the
  extensive custom-field/workflow fixture-building this session — no regressions found. Project board/card view
  remains Name-only (no custom field columns offered there, only in the project list `?display_type=list` view).
- **Confirmed working (not a bug), 2026-09-22 — Required + Read-only at the SAME status does not deadlock:** a
  field created Required from the start, with a workflow rule making it Read-only at Status "New" for a role, is
  simply **excluded from Required enforcement entirely while it's read-only** — this is Redmine core semantics, not
  plugin-specific. Concretely: the field is fully absent (not just disabled) from the New-issue creation form; a
  Developer can create the issue and make unrelated inline edits at "New" with zero errors; the field only becomes
  enforced once the issue moves to a status where it no longer has a read-only override (at which point the usual
  Edit-form fallback handles it, same as any other newly-required field, even when several such fields trip at
  once — see TC-INE-011). Always build this exact combination (`is_required` ✓ at creation + a workflow Read-only
  rule on the same status) with a **brand-new field created Required from the start** and test via issue
  **creation** by the actual restricted role — retrofitting Required onto an already-existing, already-admin-
  touched field/issue doesn't exercise the same path cleanly (confirmed the hard way: reusing `cf_65`/#1551 after
  earlier admin edits muddied the state before this was redone properly with `cf_70`/#1552 fresh from `daisy.skye`).

- **Server-side optimistic locking (Redmine core, not this plugin) correctly guards rapid successive inline
  saves**, confirmed 2026-09-22: firing 3 Status changes back-to-back without waiting for UI re-sync got a `200` on
  the first and a `422 {"errors":["Attempted to update a stale object: Issue."]}` on the second — the stale write is
  refused outright rather than silently overwriting or losing data. Final state and journal both matched exactly
  the last *successful* save; no duplicate entries, no lost update.
- **The plugin's inline-edit surface never touches journal/notes content at all** — confirmed 2026-09-22 via DOM
  query (`0` `.rf-edit-icon` elements inside any journal element). This resolves the "private notes" permission
  question cleanly: there's no attack surface to test, because the plugin doesn't expose notes for inline editing
  in the first place. Relevant to any future TC about notes/private content on this plugin.
- **When a description is blank, the plugin renders no Description section/edit-affordance at all** — not hidden,
  genuinely absent from the DOM. An initial description has to be added via the full standard Edit form before the
  inline path becomes available on that issue. Worth knowing before writing a TC precondition that assumes the
  inline description pencil is always present.
- **The "pencil shown but endpoint correctly refuses" cosmetic pattern (first seen in TC-INE-106 for `edit_project`)
  also holds for closed projects**, confirmed 2026-09-22: a closed project's issue-list Subject pencil still
  renders, but the actual save attempt gets a clean `403 {"errors":["Forbidden"]}` with zero data corruption. An
  **archived** project is stronger — the issue list page itself 403s before any inline UI renders at all. Neither
  is filed as a bug; the server-side check is what actually protects the data in both cases.
- **Permission-test infrastructure built 2026-09-22, reusable for future sessions on this instance:**
  - Two new roles: **"QA Read Only"** (`view_issues` only — nothing else) and **"QA Own Visibility"**
    (`view_issues`+`edit_issues`+`add_issues`, `issues_visibility` = `own`).
  - `harmony.rose` added to "test project" under "QA Read Only"; `summer.rain` added under "QA Own Visibility";
    `willow.belle` added under **Developer** (kept separate from `daisy.skye`, who stays on **Reporter** for the
    TC-INE-104/106 fixtures — don't reuse `daisy.skye` for a Developer-role check without first confirming her
    current role, since it's been reconfigured multiple times this engagement).
  - Project **"QA Private Project"** (`qa-private-project`, genuinely private — `is_public` explicitly unchecked
    and confirmed via DOM read) with issue #1554 (tracker Feature — Bug tracker triggers this instance's
    Bug-only-tracker/Required custom-field fixtures unnecessarily for a permission-only fixture).
  - Two throwaway projects for closed/archived testing: **"QA Closed Test Project"** (`qa-closed-test-project`,
    issue #1555, closed via Actions → Close) and **"QA Archived Test Project"** (`qa-archived-test-project`,
    issue #1556, archived via Administration → Projects → Actions → Archive). `willow.belle` is a Developer member
    of both (added before closing/archiving).
- **Raw `fetch()` for a negative-endpoint leg was explicitly declined by the user mid-session (2026-09-22)** — even
  though a prior same-session finding (TC-INE-106) showed a *real* 403 doesn't always trigger the native Basic Auth
  popup risk, the user's preference is to avoid this pattern entirely for now. **Alternative that DOES work and was
  used successfully instead:** drive the plugin's own real UI editor and let it fire the actual request — this
  still yields genuine endpoint-level evidence (e.g. TC-INE-088's closed-project `403`) without the popup risk,
  whenever the affordance renders at all. The only gap this leaves unconfirmed is the narrower case where the
  affordance is completely absent from the DOM (no UI path exists to trigger a request at all) — that specific
  server-side check remains unverified for TC-INE-093/094/095/096/097 leg 3 until a safer method is agreed.

## Recurring Issues

- None — all 4 translation gaps found this cycle (BUG-INE-001/002/003/004) are fixed as of 2026-09-10. Plugin marked `Complete` in `STATUS.md`.

## Environment Notes

- This plugin's testing started on Forge server `flux-fczk00paf49`, which later expired; testing resumed on `flux-frmka2kzh49`, then `flux-f04qohdte49`, then `flux-fdrk6suoj49`, then `flux-fhhcov1xf49` — always reconfirm existing bugs on a new server before extending coverage, since a prior server's findings can't be assumed to still be reachable.
- 2026-09-09 (first retest, `flux-f04qohdte49`): all 3 open bugs (BUG-INE-001/002/003) still reproduced byte-for-byte — no fix had landed for this plugin yet, unlike several other plugins retested the same day (Gantt, Agile Board, Dashboards) which had partial/full fixes.
- 2026-09-09 (second retest, `flux-fdrk6suoj49`, later same date-labeled session): all 3 confirmed FIXED. The final success/error toasts ("Erfolgreich gespeichert.", "Konnte nicht gespeichert werden: ...") are now German, but a previously-unnoticed interim "Saving…" loading indicator shown just before those toasts is still hardcoded English — filed as new `BUG-INE-004`. Worth checking for similarly-adjacent untranslated strings around any toast/indicator when a fix lands, not just the specific string a bug documented.
- 2026-09-10 (`flux-fhhcov1xf49`): `BUG-INE-004` confirmed fixed — "Wird gespeichert…" now shown, both on Priority and Status changes. Full final-cycle regression across all 9 TCs, all PASS, no new bugs. This closes out the plugin's German-language test cycle.
- Redmineflux Checklist Plugin's "Ticket-Schließung blockieren" setting defaults to OFF on a fresh Forge server — must be enabled to reproduce/retest BUG-INE-002, then reverted afterward to avoid leaving a global behavior change for unrelated future testing. Confirmed again on `flux-fhhcov1xf49`.
- 2026-09-22: this plugin's testing has moved off the rotating Forge servers onto the shared local Docker instance
  `redmine-docker-700` (Redmine 7.0.0, `http://localhost:3010`, admin/12345678) — the same instance other plugins
  in this repo are currently using (Agile Board, Checklist). Plugin confirmed still installed there at v7.0.0.
  Verified production fix #120919 (inline date auto-save timing) on this instance — see `INLINE_EDITOR_FEATURES_LIST.md`
  and the two `testcases/` files for full results. Two new Date-format custom fields created for this cycle and
  left in place: "QA Inline Date Field" (issue-level, `cf_61`, all trackers/projects) and "QA Inline Project Date
  Field" (project-level, `cf_62`) — reuse these rather than creating duplicates if this plugin is revisited on this
  instance. Test fixture: issue #1551 in "test project".
- **Reproducing "type digit-by-digit into a native `<input type=date>`" via Playwright**: use `browser_press_key`
  once per digit (not `browser_type`, which fills the whole value atomically and skips the intermediate states this
  fix cares about). The element's own `.value` getter DOES return a live zero-padded partial value while the year
  is incomplete (e.g. `0202-12-03` after typing only 3 of 4 year digits) — useful for asserting the exact
  in-progress state a test needs to check. To simulate a **calendar pick** (as opposed to typing), use
  `browser_fill_form`/`.fill()` with a complete ISO value — it sets the value atomically and fires `change`
  immediately, which is what a real calendar selection does, unlike segment-by-segment typing.
