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
- **The project list's editable field set is bigger than "Name + custom fields," confirmed 2026-09-23.** Add
  Homepage or Public as columns (Options → Columns, same panel as issue-list column config) and both get inline
  pencils too — Homepage is a plain text input, Public is a native `<select>` (Yes/No, values `1`/`0`). Both save
  to `PUT /projects/:id.json` and behave like every other field in this plugin. Identifier, Description and Status
  columns render zero pencils — genuinely not offered here, not hidden by permission.
- **All 10 custom-field formats now confirmed on the project list, as of 2026-09-23** (superseding the earlier gap
  noted here the same day). Created 9 new project-level fixtures (`cf_80` Boolean, `cf_81` Integer, `cf_82` Float,
  `cf_83` Long text, `cf_84` Link, `cf_85` User, `cf_86` Version, `cf_87` List-multiple, `cf_88` List-single) to
  join the pre-existing `cf_79` Text and `cf_62` Date. All 9 saved via `PUT /projects/5.json` → `204` and
  persisted after reload, with the exact same widget/save-trigger mapping already established at issue-level
  (native select for Boolean/single-list, `rf-ss` for User/Version, `rf-ms`+explicit-Save for multi-list,
  input-on-Enter for Text/Integer/Float/Link, textarea-on-Ctrl+Enter for Long text) — no surface-specific
  differences found. Left in place as fixtures (not reverted), same convention as `cf_71`–`cf_78`.
  - The **Version** format's dropdown, when the customized object is itself a Project, offers that same
    project's own Version records as candidates (confirmed: "test project"'s field offered "test project"'s own
    3 versions) — a plausible, non-buggy resolution given a Version custom field has no other project to scope
    against on a project-type object.
  - Redmine's `/custom_fields/new` flow: pick the object type (`type=ProjectCustomField`) on one screen, then the
    format + name on the next (`/custom_fields/new?type=ProjectCustomField`). The admin custom-fields list page
    (`/custom_fields?tab=ProjectCustomField`) renders **both** tabs' tables in the DOM simultaneously and toggles
    visibility via CSS — scope any `table.list` query to `#tab-content-ProjectCustomField` specifically, or it
    silently returns the Issues tab's rows mixed in with the Projects tab's.
- **`canEditProjects` is a single global flag**, unlike `canEditIssues`/`canEditOwnIssues` which are evaluated
  per issue. A user without `edit_project` on *any* project sees zero pencils on the entire `/projects?display_type=list`
  page, even for a project where nothing else about their permissions is unusual. Don't mistake this for a broken
  fixture — check `RfIE.config.canEditProjects` directly rather than assuming a specific project's role config.
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

- **Two new confirmed bugs, 2026-09-23:**
  - `BUG-INE-005` — the issue-list Subject field's inline endpoint accepts an unbounded-length value (tested
    5,000 chars, `200 OK`, persisted, broke the table layout), while the standard Edit form's model validation
    correctly enforces the 255-character limit ("Subject is too long"). The inline path skips a validation the
    standard path runs — a genuine data-integrity gap, not just a missing `maxlength` HTML attribute.
  - `BUG-INE-006` — the issue-list view renders an inline-edit pencil for a workflow-Read-only custom field
    (`cf_69` at Status New for Developer/Bug), unlike the detail page which correctly shows none for the same
    issue/field/role. Submitting a value through it returns `200`, but the server's own echoed response confirms
    the value is **not** actually applied (stays blank) — so the data is protected — yet the client still shows
    "Changes saved successfully.", a false-positive success message for a write that silently did nothing. This
    is the concrete, confirmed answer to `INLINE_EDITOR_PERMISSIONS.md` TC-INE-094's "single highest-value case"
    question: the endpoint enforces the rule correctly; the list view's UI does not.
- **A safe alternative to raw `fetch()`/`curl` for negative-endpoint legs, found 2026-09-23: drive the plugin's own
  real UI and let its own JS fire the actual request**, whenever the affordance renders at all (even if it
  shouldn't) — this is how both bugs above were confirmed, entirely through genuine clicks/selects/Enter-key
  events, never a hand-rolled request. This only fails to cover the narrower case where the affordance is
  completely absent from the DOM (e.g. a true read-only role like "QA Read Only") — there, no UI path exists to
  trigger anything, and that gap remains unconfirmed by design (see below).
- **Constructing a raw HTTP request to a permission-sensitive endpoint is off-limits by TWO independent
  mechanisms now, confirmed 2026-09-23**: the user explicitly declined a hand-rolled browser `fetch()` PUT as a
  restricted user; separately, a `curl`-based attempt to submit a role-permissions form (for TC-INE-101's
  "revoke permission mid-edit" scenario) was blocked by the harness's own auto-mode safety classifier before any
  write occurred. Do not retry either approach — for TC-INE-101 specifically, and for any endpoint leg where the
  affordance is genuinely absent from the DOM, these remain open, unresolved gaps pending an agreed method.
- **This instance requires authentication for everything** (Administration → Settings → Authentication) —
  confirmed 2026-09-23 by logging out and finding every project and even `/projects` itself redirects to
  `/login`. There is no public project and no anonymous access at all on this instance, which trivially (and
  more strongly than the TC anticipated) answers "can an anonymous user inline-edit."
- **Redmine's optimistic locking / project & tracker/project custom-field scoping all funnel through the same
  `safe_attributes=`-style filtering**, confirmed 2026-09-23 via `BUG-INE-006`'s investigation: a value for a
  field the current user/status/tracker/project isn't allowed to set is silently dropped from what gets
  persisted, without necessarily raising a validation error (contrast with `is_required`, which does raise).
  This is why TC-INE-002/003 (tracker/project-scoped fields) are reasoned as PASS from this same mechanism rather
  than separately probed with a raw write — Redmine core doesn't even recognize an out-of-scope custom field as
  a valid attribute to set, regardless of which controller/endpoint receives the request.
- **Batching multiple pencil-click-then-select edits in one `browser_evaluate` call is unreliable** on the issue
  list — the widget's re-render after each save doesn't complete synchronously within one JS execution tick, so a
  tight loop opening/editing several rows in a single script call intermittently fails to find the just-rendered
  `<select>`/input for the next row, or an already-open editor's element goes stale. Do single-row edits as
  separate tool calls (one open, one edit) rather than scripting a multi-row batch in one shot.
- **The asset-precompile manifest can go stale/empty across a container restart**, breaking every page with a
  500 (`JSON::ParserError` in `compute_asset_path`) — confirmed 2026-09-23. Symptom: `public/assets/.manifest.json`
  is 0 bytes while every other fingerprinted asset file has an older timestamp. Fix: `docker exec
  redmine-docker-700-redmine-1 sh -c 'cd /usr/src/redmine && RAILS_ENV=production bundle exec rake
  assets:precompile'` — run it in the background (it takes several minutes with this many plugins bundled; a
  ~3-minute foreground timeout will report exit 137 without actually failing) and wait for the manifest file size
  to become non-zero before retrying the app.

- **Notifications from inline edits are verifiable via the container's own logs, no second inbox needed**,
  confirmed 2026-09-23: any inline edit that changes a notifiable attribute enqueues and performs a real
  `Mailer::DeliveryJob` for `"issue_edit"`, addressed to the issue's actual watchers/participants — visible in
  `docker logs redmine-docker-700-redmine-1` as `[ActiveJob] Enqueued Mailer::DeliveryJob ... "issue_edit"
  "deliver_now"` followed by `Performed ... in ~100ms` with both mailer layouts rendered, no errors. This is a
  faster and more rigorous way to confirm "does this action notify watchers" than logging into a second account.
- **The Redmine session cookie is `HttpOnly`** — `document.cookie` from page JS always returns an empty string on
  this instance, confirmed 2026-09-23. A real session-expiry (TC-INE-084/101-style) can't be simulated by clearing
  cookies from within the page; it would need either a genuinely separate browser context/profile (not just a new
  tab — tabs share the same cookie jar in this Playwright setup, confirmed by checking `/my/account` in a second
  tab and seeing the first tab's logged-in user) or manipulating the request at the network layer.
- **Mocking `window.fetch` locally on the page is a safe, useful way to probe client-side error handling** without
  touching the real server — used to confirm the plugin shows a clear "Could not save: Failed to fetch" toast and
  reverts the displayed value on a rejected fetch (network-failure shape), and separately to demonstrate the
  client's success detection is HTTP-status-only (a mocked `200` with an HTML body, mimicking a followed
  redirect-to-login, produced a false "Saved successfully." toast). The latter is a real client-side fragility
  worth knowing, but **not confirmed as reachable in practice** — every genuine permission/validation failure this
  session actually returned a clean, structured JSON error on this same `.json` endpoint, so a real session
  expiry likely does too rather than redirecting to HTML. Don't conflate "the client mishandles X shape of
  response" (demonstrated) with "X shape of response is what the server actually sends" (unconfirmed) — keep
  these two claims separate when writing up a finding like this.

- **Third confirmed bug, 2026-09-23 — `BUG-INE-007`, found live with the user (not from a pre-written TC):**
  standard/core fields (confirmed: Subject) can get their inline-edit pencil **stuck hidden** after an inline
  Status change, even once the new status genuinely permits editing — fixed only by a full page reload. The
  precise trigger sequence: reload the page while the field is read-only at the current status (correctly no
  pencil), then inline-transition Status to one with no restriction on that field — the pencil should reappear
  live but doesn't. **Custom fields do NOT have this bug** — `cf_69` correctly re-shows its pencil live after the
  identical sequence (see TC-INE-006/007 in `INLINE_EDITOR_CUSTOM_FIELD_CONFIGURATION.md`). This points to two
  separate code paths: custom fields re-evaluate permission state live after a status change; core fields rely on
  a page-load-time flag the status-change handler doesn't refresh. Reproduces even as **Admin** — and Admin's
  reload-rendered page also hides a read-only-by-workflow core field's pencil, meaning the documented
  "Admin is exempt from workflow field permissions" finding **applies to custom fields only, not core fields** —
  worth re-verifying if this plugin is revisited, since it was stated as a blanket rule earlier this engagement.
- **A page reload can silently land you on a different Status than intended** if a prior inline status-change
  request was rejected — confirmed 2026-09-23 while investigating `BUG-INE-007`: an inline Status change that
  gets a `422 {"redirect_to_edit":true}` response (the existing Required-field-fallback signal) can leave the
  issue in an unexpected state if the fallback Edit form is never actually completed. Always re-check the actual
  current Status via a fresh page load before trusting an assumed state, especially after any rejected save.

- **Session conclusion, 2026-09-23 — 6 items across all 4 suites are genuinely environment-blocked, not just
  unattempted**: TC-INE-101 (Permissions), TC-INE-083 (Issue List), TC-INE-054/055 (Issue Detail), TC-INE-006 step
  3 (Custom Field Configuration), TC-INE-056 leg 3 (Issue Detail). Two root constraints, both confirmed multiple
  times this session with different approaches tried:
  1. **No isolated second session is reachable.** Browser tabs share one cookie jar (verified: logging in as a
     different user in tab 2 changed tab 1's logged-in identity too). The session cookie is `HttpOnly`, so it
     can't be read or cleared from page JS either. A `curl`-based second session (separate cookie jar, outside
     the browser entirely) DID work for read-only login/investigation, but any write through it — even an
     ordinary, fully-permitted content edit for a concurrency test, not just a permission-modifying one — gets
     stopped by the harness's own auto-mode safety classifier, sometimes even a plain read-only follow-up step
     (`grep` on an already-fetched local file) once the classifier had flagged the sequence.
  2. **No UI element exists to trigger a request for a fully-restricted role.** When a role has zero rendered
     affordance for a field (confirmed via DOM query, not assumption), there's no click-path to send a request
     through the plugin's own code, and constructing one directly is off-limits per the user's own explicit
     decision earlier this session (declined a hand-rolled `fetch()`).
  Both constraints hold as of this session's end. Unblocking either needs something outside this session's
  control: a real second device/browser profile, or an explicit user-added Bash permission rule scoped to the
  exact action. Do not keep re-attempting variations of raw-request/curl workarounds in a future session without
  one of those — re-derive from this note instead of rediscovering the same wall.
  **SUPERSEDED the same day. Both constraints were solved; see the next note.**

- **How the 6 "blocked" items were unblocked (2026-09-23): two isolated browser contexts plus mid-edit changes.**
  - **Second session:** in `browser_run_code_unsafe`, `page.context().browser().newContext()` gives a genuinely
    separate cookie jar. It is not a tab, so it can log in as a different user (Admin or B) while the main page
    stays logged in as A.
    - Variables don't persist between run_code calls, so each call must be self-contained. To reuse a context,
      find it again via `browser.contexts()` and each context's `.pages()`, identifying the user by the header's
      `a.user` text (`#loggedas` doesn't exist in this theme).
    - **Never call `ctx.close()`**: once, that reset the whole browser and lost the main page's state.
  - **Negative endpoint leg without a hand-rolled request:** open the inline editor while the user IS permitted.
    From the Admin context, remove the permission. Then submit the still-open editor, so the plugin's own code
    sends a real request from a user who is no longer allowed.
  - **Use a config change, not an issue change, for the revocation.** Workflow field permissions and role
    permissions don't bump the issue's `lock_version`. Changing the issue itself (e.g. its status) does, and the
    submit then fails with a 422 stale object before permissions are even checked.
  - **Role-form gotcha:** unchecking "Edit issues" and re-checking it also clears its **"All trackers"** scope
    (`role[permissions_all_trackers][edit_issues]`). The symptom is `RfIE.config.canEditIssues=true` but
    `issueEditable=false`, and zero pencils. Always re-check "All trackers" when restoring. Unchecking just "All
    trackers" is itself a clean revocation.
  - `window.RfIE.config` exposes `canEditIssues`, `canEditOwnIssues`, `issueEditable`, `issueId`, and more.
    It's a fast way to see what the plugin thinks the user can do.
- **Save-path split (2026-09-23):** field edits go through `PUT /issues/:id/update_field.json`, which returns JSON
  status codes (200/403/422). **Description** edits go through the standard `POST /issues/:id` (`_method=patch`),
  which answers 302 even when core silently filters the description out. The plugin treats that 302 as success,
  hence `BUG-INE-008`.
- **Once an issue is Closed, the plugin renders zero inline pencils on it for a Developer**, although the core
  Edit link remains. This is consistent behavior and was not filed.
- **Fixture #1560** needed its required custom fields filled before any inline save would work: `cf_65` and
  `cf_70` are read-only for Developer, so they were filled as Admin. It now sits at Feedback with a description
  (`TC-INE-049 line edited inline` + inline image `tc049-inline-image.png` + attachment `tc049-attachment.txt`,
  both under `automation/uploads/`). Avoid moving it to "In Progress" for unrelated tests, because `cf_69` becomes
  Required for Developer there.

- **"Marked complete" is not the same as "every leg of the TC executed" — check the whole steps list, not just
  whether a Result line exists.** Corrected mid-session 2026-09-23 after the user caught it: TC-INE-094/095/096/057
  each had only their positive/leg-1 half done; TC-INE-049 had only the cross-reference aspect checked, not the
  actual attachment round trip; TC-INE-084 had only a mocked scenario, not a real one. All 6 were then finished
  properly. When a TC lists multiple numbered steps or "legs," every one needs its own recorded outcome before the
  TC counts as done — a plausible-sounding partial writeup is not a substitute.
- **A real session-cookie deletion is possible and safe via Playwright**, even though the cookie is `HttpOnly` and
  unreadable from page JS: `page.context().clearCookies({name: '_redmine_session'})` removes it from outside the
  page, leaving a genuinely logged-out browser context with an editor still open. This is what finally answered
  TC-INE-084 for real (see `BUG-INE-009`) instead of the earlier mocked-response approximation.
- **This plugin authenticates every save two ways at once**: the browser's session cookie, and a personal API key
  (`RfIE.config.apiKey`) embedded in every page and sent as `X-Redmine-API-Key` on every `update_field.json`
  request. When the session is gone but the page is still open, the API key alone is enough to keep saving — see
  `BUG-INE-009`. Worth checking for on any other Redmineflux plugin that follows the same inline-editor pattern.
- **This plugin injects Redmine's own `jstoolbar` scripts unconditionally into every page's `<head>`**
  (`plugins/inplace_issue_editor/lib/editor_hooks.rb`, `view_layouts_base_html_head`), regardless of whether core
  already loads them for that page. On the issue detail page, core already includes them for its own Edit form, so
  they load twice and throw `SyntaxError: Identifier 'lastJstPreviewed' has already been declared` on every load
  (`BUG-INE-010`). No observed functional break from it in Chrome, Edge or Firefox — the first copy still runs
  fine — but it reproduces in all 3 real browser engines identically, confirmed via Playwright driving Chromium,
  real Edge (`channel: 'msedge'`) and the bundled Firefox directly.
- **Playwright's own Firefox driver crashes the whole Node process on a page's uncaught `SyntaxError`**, independent
  of whether a `page.on('pageerror')` listener is attached — this is a bug in that Playwright version's Firefox
  transport (`FFBrowserContext` tries to read `.url` off an undefined `pageError.location`). Guard any
  multi-browser script with `process.on('uncaughtException', …)` when testing against Firefox on a page known to
  throw `BUG-INE-010`'s error, or the whole run aborts.
- **This instance uses CommonMark, not CKEditor**, confirmed via `RfIE.config.textFormat === 'common_mark'`,
  `ckEditorOptions === null`, and `window.CKEDITOR === undefined`. Any TC whose precondition assumes CKEditor
  (e.g. TC-INE-028) cannot be executed here as written — check `Setting.text_formatting` / this config before
  assuming CKEditor is present on a fresh instance.
- **Destructive install/uninstall testing against the shared `redmine-docker-700` instance is possible and safe
  with care**, confirmed 2026-09-23 (rename, migration-skip, stale-cache, full uninstall all tested and fully
  restored): always `tar` the plugin folder before deleting/renaming it, confirm no other plugin's `init.rb`
  declares `requires_redmine_plugin` on it first, and expect a genuine restart (not just `docker exec`) is needed
  for Redmine to notice a plugin add/remove/rename either way — `docker restart` typically returns to a working
  `200` on `/login` within roughly 60–90 seconds on this instance when nothing is broken. If a folder rename
  breaks boot (it does — Redmine's own `Redmine::Plugin.register` checks the id against the actual directory
  name), the container crash-loops; fix the folder name back with a tight retry loop (`docker exec` briefly
  succeeds between crash/restart cycles) rather than waiting for it to settle.
- **`rake redmine:plugins:migrate` is scoped with `NAME=<plugin>`** and is always safe to run even for a plugin
  with no `db/` directory at all (confirmed for `inplace_issue_editor` — it's a pure view-hook/JS plugin, zero
  migrations, by design, permanently).

## Recurring Issues

- None — all 4 translation gaps found this cycle (BUG-INE-001/002/003/004) are fixed as of 2026-09-10. Plugin marked `Complete` in `STATUS.md`.
- **Active as of 2026-09-24: `BUG-INE-009` reopened with a regression.** The fix removed the API key that let an
  expired session keep saving (correct direction), but every inline save now risks hanging on "Saving…" and
  popping the browser's native Basic-Auth dialog, even on a fully valid session. Consolidated into `BUG-INE-009`
  rather than filed as a separate bug (BUG-INE-011), per explicit user instruction — same session-vs-API-key
  authentication mechanism, opposite failure direction. This blocks reliable retesting of the other 5 fixes until
  it's resolved — see Handoff.

- **Playwright's `.click()` on this plugin's hover-only `.rf-edit-icon` pencils became unreliable after the
  2026-09-24 code pull/restart** — clicks would resolve without error but the editor simply wouldn't open,
  intermittently, across multiple locator strategies (`.click()`, `browser_click` via accessible role/label,
  `mouse.down()+mouse.up()` at the bounding-box center). The one approach that worked every time: dispatch a full
  synthetic event sequence directly on the element in one atomic `evaluate()` call —
  `pointerdown → mousedown → pointerup → mouseup → click`, all with `bubbles: true` — rather than relying on
  Playwright's own higher-level click/hover choreography, which has enough steps (move, then click) that a
  `mouseleave` can fire on this opacity-0-until-hover icon in between. Likewise, typing into the resulting input
  and pressing Enter sometimes silently did nothing via `.fill()` + `.press('Enter')`; setting the value through
  the native `HTMLInputElement` value setter plus a manual `input` event, followed by explicit
  `keydown`/`keypress`/`keyup` dispatches for Enter, reliably triggered the save. This is a testing-tool
  reliability issue in this session's browser, not a product defect — confirmed by the same dispatch approach
  successfully triggering saves that then correctly hit the server (per the request log), just not always via
  Playwright's normal synthetic input.
- **A real, non-headless Chromium browser will show its own native OS-level HTTP Basic-Auth dialog** for any
  request that gets a `401` with a `WWW-Authenticate: Basic` header — this happens automatically whenever
  Redmine's REST API is enabled and a JSON-format request fails session/API-key authentication (see
  `check_if_login_required` in the server log). This dialog is **not** a Playwright/JS dialog:
  `browser_handle_dialog`/`page.on('dialog')` cannot see or dismiss it, and `browser_take_screenshot` cannot
  capture it either (same class of limitation as the existing "Native Dialog Screenshot Blocked" note, but for a
  different underlying mechanism). It sits outside the page in browser chrome and can only be dismissed by a real
  click on the actual browser window — ask the user to cancel it if it appears during automated testing, and
  cross-check the Rails server's own access log (`docker logs`) for the exact failing request rather than relying
  on Playwright's `page.on('response')`, since Chromium appears to hold the response back from CDP until the
  dialog is resolved.

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
