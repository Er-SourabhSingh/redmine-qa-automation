> ⚠️ **EXTERNAL SOURCE — DO NOT MERGE WITH THIS PLUGIN'S OWN TC-TCM-xxx SUITES, AND SEPARATE FROM THE V1 CYCLE
> FILE** ⚠️
>
> These test cases verify **production feature #123571** ("rftc-029 — Exploratory / session-based testing"), part
> of **Testcase Management plugin Release 7.3.0**. Out of `V1_7.1.0_EXTERNAL_RELEASE_CYCLE.md`'s scope.
>
> **ID prefix**: every case here is `RFTC029-<n>`.
>
> **Status**: pre-release **test DESIGN**, authored ahead of independent QA execution, directly from the feature's
> source code (controller/model/views/migrations/routes/permissions) and its own unit/functional test files on
> branch `release/7.3.0` (commit `329311d`) — **not yet merged to `master`**. Every case's Actual Result is
> intentionally "Not Executed"; this file has not been live-verified independently of the developer's own
> "Quality Gates" note in `backlog/planning/rftc-029-feature-exploratory-session-testing.md`.

# Test Cases — Redmineflux Testcase Management — rftc-029: Exploratory / Session-Based Testing

## Plugin
- Name: Redmineflux Testcase Management
- Version: branch `release/7.3.0`, commit `329311d` ("Add four roadmap features: automation sources, flaky-test
  detection, run comparisons, and exploratory sessions")
- Redmine version: 6.x (plugin's standard Docker target, `localhost:3000`)
- Production ticket: #123571 (ztflux), done ratio 90%, status "In QA", Target Version "Testcase Management plugin
  Release 7.3.0"

## Feature summary

A new first-class `TestcaseSession` model for informal/exploratory testing, distinct from a scripted Run. A
session has a real lifecycle — **start → in-progress → close-with-outcome** — modeled on `TestcaseEnvironment`'s
project-scoping convention but extended with `Run`-like state (`is_closed`, `outcome`, `started_at`/`ended_at`).

**Notes are a child table, not a single re-saved column.** `TestcaseSessionNote` is append-only: each note gets
its own immutable `created_at` and author, ordered oldest-first. The spec doc is explicit about why: a single
`notes` text column (the pattern `runs.notes`/`issue_status_results.notes` already use) would silently lose
earlier entries on every re-save — a real lost-update risk if a tester edits from two tabs — whereas a child table
can never destroy an earlier observation.

**Permissions are a 4-way split**, mirroring `Run`'s `create_run`/`edit_run`/`delete_run`/`close_run` shape rather
than `Environment`'s single `manage_environment` gate, because a Session has a real lifecycle like Run:
`create_session`, `edit_session`, `delete_session`, `close_session`. Adding a note is deliberately **not** a 5th
permission — the controller gates `add_note` behind `edit_session` (treated as an edit). Viewing (`index`/`show`)
requires only ordinary project read access (`rftc_authorize_project_read!` — module enabled + project visibility),
no session-specific permission.

**Zero dependency on the Milestone model, deliberately** — the Milestone feature itself was removed from this
plugin shortly before this release (`db/migrate/20261027000000_remove_testcase_milestones.rb`), so rftc-033/034
(milestone summary/burndown) were split off separately, and this ticket's own "unified reporting" requirement is
satisfied without ever referencing a milestone.

**"Unified reporting alongside Runs and automation" uses two additive mechanisms, both already generic:**
1. The existing `TestcaseActivity` feed — `TestcaseSession` writes `Created`/`Closed` activity rows in the exact
   same shape `Run`/`Testsuite`/`IssueStatusResult` already use, so `TestcaseActivitiesController` needed zero
   changes, just one new `trackable_type` branch in the view to resolve a friendly label and deep link.
2. A new "Sessions" block on the project **Overview** page (`test_suites#releases`), right next to the existing
   "Test Runs" block — `@recent_sessions = TestcaseSession.where(project_id:).order(id: :desc).limit(3)`.

**Two bugs were caught and fixed during the build, before any commit** (per the spec doc's own account, not
independently reproduced yet by this QA pass):
1. `Project` had no `has_many :testcase_sessions` — missing this raised a live `NoMethodError` on
   `/testcase_sessions`. Fixed by adding it to `lib/testcase_management/patches/project_patch.rb`.
2. `TestcaseSessionsController#show` originally built `@note` via `@session.testcase_session_notes.new`, which in
   Rails appends the unsaved blank record into the already-loaded `has_many` association's in-memory target — so
   the view's `@session.testcase_session_notes.each` rendered a phantom empty note row on every page view, even
   with zero real notes. Fixed by building `@note = TestcaseSessionNote.new(testcase_session: @session)` directly,
   which sets the `belongs_to` side without touching the parent's loaded collection.

**Confirmed from source (not just the spec doc's prose):**
- `title` max length 255; `charter` max length 2000; `outcome` must be one of `passed`/`failed`/`inconclusive`
  (`TestcaseSession::OUTCOMES`), `allow_nil: true` while open but **required once `is_closed` is true**
  (`outcome_required_when_closed` validation).
- `display_title` fallback chain, read directly from the model: `title.presence || charter.to_s.truncate(60).presence || "Exploratory Session ##{id}"`.
- `issue_id` is optional; if set, `issue_belongs_to_same_project` rejects an issue from a different project.
- The Close form's `<select>` (`TestcaseSession::OUTCOMES` only, no blank option) makes it **impossible to submit
  an empty outcome through the real UI** — the blank-outcome negative case can only be exercised by posting
  directly to the `close` endpoint (`outcome: ''`), not by clicking through the form.
- `add_note`'s body is rendered via `simple_format(note.body)`, which HTML-escapes by default; `display_title` and
  `charter` are rendered through plain `<%= %>` (Rails auto-escapes) everywhere they appear — index, show, the
  Activity feed, and the Overview "Sessions" block.
- `close`/`add_note`/`create`/`update` all support both `format.js` (used by the in-page AJAX forms — success
  re-loads the page via injected JS, failure renders `form_error.js.erb` which escapes every message through
  `content_tag`) and a `format.html` fallback (full-page redirect/re-render) — confirmed by the controller's own
  test file, which exercises both for `create`.
- `destroy` cascades to notes (`has_many :testcase_session_notes, dependent: :destroy`) and to the session's own
  `TestcaseActivity` rows (`before_destroy :delete_activity`).
- Cross-project isolation: `find_session` resolves via `@project.testcase_sessions.find(params[:id])` (scoped
  through the association, not a bare `TestcaseSession.find`), so a session id from another project 404s
  (`ActiveRecord::RecordNotFound` → Redmine's standard not-found page), confirmed by the controller test's own
  SEC-001 holdout.

---

### RFTC029-1: Start a session with a title only — minimal happy path

**Priority:** P1
**Steps:** As a user with `create_session`, open Project → TestCases sidebar → "Sessions" → "Start Session".
Fill only Title (e.g. "Login edge cases"), leave Charter and Issue blank, submit.
**Expected Result:** Session is created, `is_closed = false`, `started_at` set automatically, `user_id` defaults to
the current user; redirected to the session's own show page; the index list shows it as "Open" with no outcome.
**Actual Result:** Not Executed — test design authored ahead of independent QA execution; feature lives on branch
`release/7.3.0`, not yet live-verified independently of the developer's own Quality Gates note.

---

### RFTC029-2: Start a session with a charter and a linked issue, no title

**Priority:** P1
**Steps:** Start Session with Title left blank, Charter filled ("Explore the new checkout flow end to end"), and
Issue set to a real issue in the same project.
**Expected Result:** Session saves; its `display_title` on the index/show pages falls back to the charter text
(truncated at 60 chars if longer); the show page's info panel displays the charter text and a working link to the
linked issue (`#<id> <subject>`).
**Actual Result:** Not Executed.

---

### RFTC029-3: A session with neither title nor charter falls back to "Exploratory Session #<id>"

**Priority:** P2 — exact fallback chain confirmed in `test_display_title_falls_back_to_charter_then_id`
**Steps:** Create a session via the API or a minimal form submission with both Title and Charter blank.
**Expected Result:** `display_title` renders as `Exploratory Session #<id>` (or the localized equivalent) wherever
shown — index, show, Activity feed, Overview block.
**Actual Result:** Not Executed.

---

### RFTC029-4 (REGRESSION): `/testcase_sessions` loads cleanly on a project with zero prior sessions

**Priority:** P1 — directly re-proves the pre-commit bug (missing `has_many :testcase_sessions` on `Project`)
stays fixed
**Steps:** Open the Sessions index page on a project that has never had a session created.
**Expected Result:** Page renders the empty state ("No sessions yet" / `text_no_sessions`) with zero errors — no
`NoMethodError`, no 500. The "Start Session" button is visible for a user with `create_session`.
**Actual Result:** Not Executed.

---

### RFTC029-5 (REGRESSION): A session's show page with zero real notes renders no phantom empty note

**Priority:** P1 — directly re-proves the pre-commit bug (`.new` on an already-loaded `has_many` association
injecting a phantom blank entry) stays fixed
**Steps:** Open the show page of a freshly created session that has never had a note added.
**Expected Result:** The Notes panel shows the genuine empty state (`text_no_session_notes`), not an empty `<li>`/
entry rendered with a blank author and timestamp. The add-note textbox is present and empty, separate from the
notes list.
**Actual Result:** Not Executed.

---

### RFTC029-6: Add multiple notes over time — append-only, correct chronological order, no mutation of earlier notes

**Priority:** P1 — core value proposition of the child-table design
**Steps:** On an open session, add 3 notes in sequence: "First observation", "Second observation", "Third
observation", each via the in-page Add Note form.
**Expected Result:** All 3 notes persist and render in the panel in the order added (oldest first, per
`has_many :testcase_session_notes, -> { order(created_at: :asc) }`), each showing its own author and its own
`created_at` timestamp. Adding note 2 does not alter or remove note 1's text/timestamp; adding note 3 does not
alter notes 1 or 2.
**Actual Result:** Not Executed.

---

### RFTC029-7: Blank note body is rejected, both via format.js and format.html

**Priority:** P1 — confirmed directly in `test_blank_body_rejected`/the controller's own blank-body test
**Steps:** Submit the Add Note form with an empty body (format.js, the real in-page path); separately, hit
`add_note` with `format: :html` and a blank body.
**Expected Result:** Both reject with a validation error ("can't be blank") — format.js: the form's error banner
(`#session_form_flash_error`) is populated via the shared `form_error.js.erb` partial, no page reload, no note
created; format.html: flash error set, redirected back to the show page, no note created.
**Actual Result:** Not Executed.

---

### RFTC029-8: Close a session with each valid outcome value

**Priority:** P1
**Steps:** For 3 separate open sessions, close one each with outcome = Passed, Failed, Inconclusive via the
in-page Close form (select + submit).
**Expected Result:** Each session's `is_closed` becomes `true`, `outcome` matches the selection, `ended_at` is set.
The show page's status tag reflects the outcome (success/danger/warning styling per outcome), and the Close
form/section disappears once closed. The index list's Outcome column shows the correct tag.
**Actual Result:** Not Executed.

---

### RFTC029-9 (SACRED/negative): Closing with no outcome is rejected and does NOT close the session

**Priority:** P1 — the real UI's `<select>` has no blank option, so this must be exercised by posting directly to
the endpoint, not by a UI click; confirmed directly in `test "close without an outcome fails validation..."`
**Steps:** POST directly to the session's `close` endpoint (`PUT .../close`) with `outcome: ''` (bypassing the
UI's own select, which never offers a blank value), `format: :js`.
**Expected Result:** HTTP 422/unprocessable, the session stays `is_closed: false`, `outcome` stays nil, and no
`ended_at` is set. The error banner path fires (`form_error.js.erb`), not a silent accept.
**Actual Result:** Not Executed.

---

### RFTC029-10: Title length boundary — 255 chars accepted, 256+ rejected

**Priority:** P2 — confirmed directly in the controller test (`'x' * 300` fails validation)
**Steps:** Attempt to save a session with a 255-character title (should succeed), then a 300-character title
(should fail).
**Expected Result:** 255 chars: saves cleanly. 300 chars: validation error on Title, session not created/updated,
same error-banner behavior as RFTC029-7.
**Actual Result:** Not Executed.

---

### RFTC029-11: Charter length boundary — 2000 chars accepted, 2001+ rejected

**Priority:** P3
**Steps:** Attempt to save a session with a 2000-character charter (should succeed), then 2001 characters (should
fail).
**Expected Result:** 2000 chars: saves. 2001 chars: validation error on Charter.
**Actual Result:** Not Executed.

---

### RFTC029-12: Linking an issue from a DIFFERENT project is rejected

**Priority:** P1 — `issue_belongs_to_same_project` validation
**Steps:** Attempt to create/update a session with `issue_id` set to a real issue belonging to a different
project (e.g. via direct param manipulation, since the form's own Issue dropdown is pre-scoped to
`@project.issues`).
**Expected Result:** Validation error on Issue (`error_session_issue_wrong_project`), session not saved with that
issue_id.
**Actual Result:** Not Executed.

---

### RFTC029-13: `create_session` permission — a user WITH only this permission can start a session but nothing else

**Priority:** P1
**Steps:** Grant a test role ONLY `create_session` (no edit/delete/close). As that user: (a) confirm "Start
Session" is reachable and works; (b) open an existing session's show page and confirm Edit/Delete links/buttons
are absent, no Close form is shown, and the Add Note textbox is absent (add_note needs `edit_session`); (c) hit
`edit`/`update`/`destroy`/`close`/`add_note` directly by URL/params and confirm each denies access
(`deny_access`, not the action performed).
**Expected Result:** Create succeeds; every other session action is both UI-hidden and endpoint-denied for this
user.
**Actual Result:** Not Executed.

---

### RFTC029-14: `edit_session` permission — grants Edit AND Add Note, nothing else

**Priority:** P1 — confirms the deliberate "add_note is treated as an edit" design choice, not a 5th permission
**Steps:** Grant a role ONLY `edit_session` (no create/delete/close). As that user: (a) confirm Edit link is
visible and works (rename title/charter); (b) confirm the Add Note form IS visible and a note can be added; (c)
confirm "Start Session" is not offered and `new`/`create` are endpoint-denied; (d) confirm Delete/Close are
UI-hidden and endpoint-denied.
**Expected Result:** Edit + Add Note work; Create/Delete/Close are denied both in the UI and at the endpoint.
**Actual Result:** Not Executed.

---

### RFTC029-15: `delete_session` permission — grants Delete only

**Priority:** P1
**Steps:** Grant a role ONLY `delete_session`. As that user: confirm the Delete icon + confirmation modal are
present and deleting a session works (cascades its notes); confirm Create/Edit/Close/Add-Note are all UI-hidden
and endpoint-denied.
**Expected Result:** Delete works in isolation; every other session action is denied.
**Actual Result:** Not Executed.

---

### RFTC029-16: `close_session` permission — grants Close only

**Priority:** P1
**Steps:** Grant a role ONLY `close_session`. As that user: confirm the Close form is visible on an open session
and closing it works; confirm Create/Edit/Delete/Add-Note are all UI-hidden and endpoint-denied (add_note still
needs `edit_session`, which this user lacks).
**Expected Result:** Close works in isolation; every other session action is denied, including Add Note.
**Actual Result:** Not Executed.

---

### RFTC029-17 (SACRED/security): Cross-project isolation — a session id from another project is not found, never leaked

**Priority:** P1 — directly mirrors the controller test's own SEC-001 holdout
**Steps:** As a member of Project A, request Project B's session show page using Project A's URL
(`/projects/A/testcase_sessions/<B's session id>`).
**Expected Result:** HTTP 404 (Redmine's standard not-found page) — the session's title, charter, notes, or any
other detail from Project B must never appear in the response. Same expectation for `edit`/`update`/`destroy`/
`close`/`add_note` against a foreign session id.
**Actual Result:** Not Executed.

---

### RFTC029-18: Non-member / anonymous access is denied on every `testcase_sessions` route

**Priority:** P1
**Steps:** As a logged-out user (and separately, a logged-in user with no membership on the project), attempt to
reach `index`, `show`, `new`, and the member routes (`close`, `add_note`) directly by URL.
**Expected Result:** Redirected to login (anonymous) or denied (non-member, same `rftc_authorize_project_read!`
gate every other read-only page in this plugin uses) — no session data rendered either way.
**Actual Result:** Not Executed.

---

### RFTC029-19 (security/XSS): Session title, charter, and note body containing a script payload render inert everywhere

**Priority:** P1 — this plugin has a real history of exactly this class of bug (BUG-TCM-070 chart XSS,
BUG-TCM-093 Requirements sidebar XSS), and this feature newly introduces 3 more free-text render surfaces
**Steps:** Create a session with Title = `<img src=x onerror=alert('title-xss')>`, Charter =
`<svg onload=alert('charter-xss')>`, and a note body = `<script>alert('note-xss')</script>`. View the session on:
the Sessions index, the session's own show page, the project Overview page's "Sessions" block, and the project
Activity feed (both the Created and Closed entries).
**Expected Result:** All three payloads render as inert, HTML-escaped text everywhere they appear — no `alert()`
fires on any of the 4 surfaces. `display_title` goes through plain `<%= %>` (Rails auto-escape) on index/show/
Overview/Activity; the note body goes through `simple_format` (HTML-escapes by default) on show.
**Actual Result:** Not Executed.

---

### RFTC029-20: Validation-failure error messages render safely via `form_error.js.erb` (format.js)

**Priority:** P2 — the partial builds the error list via `content_tag`/`j()` rather than joining raw strings, a
direct hardening choice worth confirming holds
**Steps:** Trigger a validation failure (e.g. RFTC029-7's blank note, or a too-long title) through the `format.js`
path, and inspect the actual injected error-banner HTML.
**Expected Result:** Error messages are escaped (no raw, unescaped HTML in the banner even if a validation message
somehow contained markup), and the banner shows the correct errored object's messages (`@note`'s if a note failed,
`@session`'s otherwise), per the partial's own `errored = (@note && @note.errors.any?) ? @note : @session` logic.
**Actual Result:** Not Executed.

---

### RFTC029-21: `format.html` fallback still works end-to-end for create/update/close/add_note

**Priority:** P2 — confirmed directly in the controller's own `format.html` fallback test for `create`; extend
the same check to the other 3 actions
**Steps:** Repeat create (with both a valid and an over-long title), update, close, and add_note with
`format: :html` instead of the real in-page AJAX path.
**Expected Result:** Each behaves as a classic full-page Rails action: success redirects to the show page (or
re-renders `new`/`edit` with a flash error on failure) — no JS injection, no reliance on the `format.js` partials.
**Actual Result:** Not Executed.

---

### RFTC029-22: Destroying a session cascades to its notes AND its Activity rows

**Priority:** P1 — confirmed directly in `test_destroy_cascades_to_notes` and `test_destroy_removes_its_activity_rows`
**Steps:** Create a session with 2 notes, close it (producing both a Created and a Closed Activity row), then
delete it (as a user with `delete_session`).
**Expected Result:** The session, both its notes, and both its Activity rows are all gone — no orphaned
`testcase_session_notes` rows, and the session no longer appears in the project Activity feed.
**Actual Result:** Not Executed.

---

### RFTC029-23: Activity feed shows both Created and Closed events, correctly deep-linked

**Priority:** P1
**Steps:** Start a session, then close it. Open the project's Activity tab.
**Expected Result:** Two distinct entries appear — one for session creation, one for its closing — each labeled
with the localized "Exploratory Session" type and linking back to the session's own show page
(`project_testcase_session_path`). Clicking either link lands on the correct session.
**Actual Result:** Not Executed.

---

### RFTC029-24: Overview page "Sessions" block shows at most 3 most-recent sessions, same shape as "Test Runs"

**Priority:** P2 — `@recent_sessions = TestcaseSession.where(project_id:).order(id: :desc).limit(3)`
**Steps:** Create 5 sessions in a project (mix of open/closed). Open the project Overview page.
**Expected Result:** Exactly 3 sessions are listed (the 3 most-recently-created, by id descending), each showing
title, tester, last-updated date, and open/closed status — same visual block style as the adjacent "Test Runs"
section. A "View all" link navigates to the full Sessions index (all 5 visible there).
**Actual Result:** Not Executed.

---

### RFTC029-25: A session with no linked issue behaves fully normally (issue is genuinely optional)

**Priority:** P2 — guards against a regression where `issue_id` is treated as implicitly required
**Steps:** Create, view, add notes to, and close a session that never had an issue linked.
**Expected Result:** Every step works identically to a session with a linked issue; the show page's info panel
simply omits the "Issue:" line entirely (the panel itself only renders `if @session.charter.present? ||
@session.issue`, so a session with neither charter nor issue shows no info panel at all).
**Actual Result:** Not Executed.

---

## Not Executed

- **Multi-tester assignment on one session** — explicitly out of scope per the spec doc (v1 is one owning tester,
  set to whoever started it); not a coverage gap.
- **Attachments/screenshots on a session** — explicitly out of scope per the spec doc; not a coverage gap.
- **Session templates/charter library** — explicitly out of scope per the spec doc; not a coverage gap.
- **Any Milestone association** — explicitly and deliberately excluded by design (Milestones were removed from
  this plugin shortly before this release); not a coverage gap.
- **The plugin's own Minitest suite has not actually been run** — per the spec doc's own "Known gap" note, the
  dev's container had no network access to install the `test` Gemfile group, so `test/unit/testcase_session_test.rb`,
  `test/unit/testcase_session_note_test.rb`, and `test/functional/testcase_sessions_controller_test.rb` are
  written and `ruby -c` syntax-checked but **not yet executed by the actual test runner**. This QA pass read those
  files as ground truth for expected behavior, but has not independently re-run them — running
  `bundle exec rails test plugins/redmineflux_testcase_management/test/unit/testcase_session_test.rb` (and the
  note/functional siblings) in a properly provisioned environment, before this branch merges, should be an early
  step of actual execution.
- **Live Playwright execution of every case above** — this file is a pre-release test design; the developer's own
  "Quality Gates" note claims an end-to-end Playwright pass was already done once during the build, but that has
  not been independently repeated by this QA session. Executing all 25 cases live against a running instance on
  this branch is the natural next step.

## Coverage Summary

**25 test cases designed, 0 executed yet (pre-release design pass).** Covers: full happy-path lifecycle (start →
notes → close) across both minimal and fully-populated fixtures (RFTC029-1/2/3), both pre-commit bugs re-proven as
regression-shaped tests (RFTC029-4/5), the append-only/chronological note design (RFTC029-6/7), every outcome
value plus the UI-unreachable blank-outcome negative (RFTC029-8/9), both length boundaries (RFTC029-10/11), the
cross-project issue-link guard (RFTC029-12), all 4 permissions independently in both directions (RFTC029-13
through 16), the SACRED cross-project session-isolation holdout (RFTC029-17), anonymous/non-member denial
(RFTC029-18), a 3-surface XSS probe given this plugin's real history of exactly this bug class (RFTC029-19), safe
error-message escaping (RFTC029-20), the format.html fallback (RFTC029-21), full destroy cascade (RFTC029-22), the
Activity feed integration (RFTC029-23), the Overview page's 3-item limit (RFTC029-24), and the issue-optional
negative-space case (RFTC029-25). Everything above was derived directly from the controller, both models, every
view, both migrations, `init.rb`'s permission block, `config/routes.rb`, and the feature's own (not-yet-executed)
unit/functional test files — not guessed from the ticket description alone.

## Live Verification Pass — 2026-11-02 (localhost:3000, branch release/7.3.0, commit 329311d)

Strong live verification performed this session (full happy-path + both pre-commit regressions + XSS + the
UI gap, executed end-to-end on project `rftc-016-ci-qa`):

- **PASS — regression 1 (missing `has_many :testcase_sessions`)**: `/testcase_sessions` on a project with zero
  prior sessions loads a clean "No exploratory sessions yet" empty state, zero `NoMethodError`.
- **PASS — full happy-path lifecycle**: started a session with a title and charter (both deliberately containing
  XSS-shaped payloads, see below), added 2 timestamped notes over time, closed it with outcome **Failed** —
  final state correctly showed a red "Closed · Failed" badge.
- **PASS — regression 2 (phantom empty note row)**: the freshly-started session's show page correctly displayed
  "No notes yet" with zero phantom `<li>` rows, confirming `TestcaseSessionNote.new(testcase_session: @session)`
  (not `.testcase_session_notes.new`) holds.
- **PASS — notes append-only ordering**: both notes rendered in correct chronological order, each with its own
  author ("Redmine Admin") and timestamp, neither note altering or removing the other.
- **PASS — XSS safety, two different sanitization strategies, both safe**: the session **title**
  (`<img src=x onerror=alert('session-xss')>`) and **charter**
  (`Exploring <script>alert('charter-xss')</script> the new automation dashboard...`) both rendered as literal
  escaped text (tags visible as text, zero `alert()` fired) on the show page, Overview "Sessions" block, and
  Activity feed. A **note** body containing a second `<script>alert('note-xss')</script>` payload was instead
  **tag-stripped** (the `<script>` tags themselves were removed, leaving only "alert('note-xss')" as inert text)
  — a different sanitization approach (allow-list stripping vs. HTML-escaping) but equally safe; zero `alert()`
  fired either way. No XSS vulnerability found anywhere in this feature.
- **CONFIRMED (not a bug, a UI gap)**: the Close Session Outcome `<select>` has exactly 3 options (Passed,
  Failed, Inconclusive) with no blank option — "close with no outcome" genuinely cannot be exercised through the
  real UI, only by posting directly to the `close` endpoint (not attempted this pass). Matches the design-review
  finding exactly.
- **PASS — Overview page integration**: the project Overview page's new "Sessions" block showed the session's
  title (XSS-escaped), tester, date, and "Closed" status, linked correctly to the session.
- **PASS — Activity feed integration**: both "Created by Redmine Admin" and "Closed by Redmine Admin" events
  appeared, correctly deep-linked to the session.
- **FAIL → BUG-TCM-126 (Open, Low, pre-existing, not specific to this feature)**: the Activity feed's own
  per-event timestamp showed "2026-02-11 07:23/07:24 AM" for events that actually happened at 07:23/07:24 AM on
  **November 2, 2026** (correctly grouped under the "November 02, 2026" heading just above, and correctly shown
  as "11/02/2026" on the session's own page) — month and day visibly swapped. Root-caused to
  `TestcaseActivitiesHelper#format_date_string` trying a day-first parse format before a month-first one against
  an already-US-formatted string. Confirmed this affects every activity row type in this view, not just
  Exploratory Sessions — see `bugs/open/BUG-TCM-126.md`.

**Not yet live-verified this pass:** the 4-permission matrix (create/edit/delete/close_session independently),
cross-project 404 isolation (SEC-001), anonymous-access denial, and destroy cascade. Given how solid the
happy-path/regression/XSS results were, remaining risk is assessed as concentrated in the permission matrix —
should be prioritized first in a follow-up session.
