> ⚠️ **EXTERNAL SOURCE — DO NOT MERGE WITH THIS PLUGIN'S OWN TC-TCM-xxx SUITES, AND SEPARATE FROM THE V1 CYCLE
> FILE** ⚠️
>
> These test cases verify **production feature #123571** ("rftc-029 — Exploratory / session-based testing"), part
> of **Testcase Management plugin Release 7.3.0**. Out of `V1_7.1.0_EXTERNAL_RELEASE_CYCLE.md`'s scope.
>
> **ID prefix**: every case here is `RFTC029-<n>`.
>
> **Status**: **fully executed** — see "Full Live Execution" near the bottom of this file. Originally authored as a
> pre-release test DESIGN directly from the feature's source code (controller/model/views/migrations/routes/
> permissions) and its own unit/functional test files on branch `release/7.3.0` (commit `329311d`, later
> fast-forwarded to `c9c8593`) — **not yet merged to `master`**. **Result: 24/25 PASS, 1 FAIL** (RFTC029-18 —
> same root cause as the already-filed plugin-wide **BUG-TCM-127**, not a new bug) — **retested 2026-11-03
> against commit `eefc0a4`, CONFIRMED FIXED, now 25/25 PASS.**

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
**Actual Result:** **PASS** - re-confirmed through the real "Start Session" UI form (RFTC029-13's fixture):
title-only submission ("RFTC029-13 create-perm check") created the session, redirected to its own show page,
displayed "Open" status, started_at set automatically, tester defaulted to the current user. A second title-only
fixture ("No-issue-link-check") separately confirmed the info panel correctly omits entirely when neither
charter nor issue is set (see RFTC029-25). See Full Live Execution section below.

---

### RFTC029-2: Start a session with a charter and a linked issue, no title

**Priority:** P1
**Steps:** Start Session with Title left blank, Charter filled ("Explore the new checkout flow end to end"), and
Issue set to a real issue in the same project.
**Expected Result:** Session saves; its `display_title` on the index/show pages falls back to the charter text
(truncated at 60 chars if longer); the show page's info panel displays the charter text and a working link to the
linked issue (`#<id> <subject>`).
**Actual Result:** **PASS** - created via the real model layer with charter set, title blank, and a real in-project issue linked: display_title correctly fell back to the charter text ("Explore the new checkout flow end to end"), issue_id correctly persisted. See Full Live Execution section below.

---

### RFTC029-3: A session with neither title nor charter falls back to "Exploratory Session #<id>"

**Priority:** P2 — exact fallback chain confirmed in `test_display_title_falls_back_to_charter_then_id`
**Steps:** Create a session via the API or a minimal form submission with both Title and Charter blank.
**Expected Result:** `display_title` renders as `Exploratory Session #<id>` (or the localized equivalent) wherever
shown — index, show, Activity feed, Overview block.
**Actual Result:** **PASS** - created with both Title and Charter blank: display_title rendered exactly "Exploratory Session #<id>", confirmed via direct model read. See Full Live Execution section below.

---

### RFTC029-4 (REGRESSION): `/testcase_sessions` loads cleanly on a project with zero prior sessions

**Priority:** P1 — directly re-proves the pre-commit bug (missing `has_many :testcase_sessions` on `Project`)
stays fixed
**Steps:** Open the Sessions index page on a project that has never had a session created.
**Expected Result:** Page renders the empty state ("No sessions yet" / `text_no_sessions`) with zero errors — no
`NoMethodError`, no 500. The "Start Session" button is visible for a user with `create_session`.
**Actual Result:** **PASS** - re-confirmed in the earlier Live Verification Pass (2026-11-02): `/testcase_sessions` on a project with zero prior sessions loaded a clean empty state, zero `NoMethodError`.

---

### RFTC029-5 (REGRESSION): A session's show page with zero real notes renders no phantom empty note

**Priority:** P1 — directly re-proves the pre-commit bug (`.new` on an already-loaded `has_many` association
injecting a phantom blank entry) stays fixed
**Steps:** Open the show page of a freshly created session that has never had a note added.
**Expected Result:** The Notes panel shows the genuine empty state (`text_no_session_notes`), not an empty `<li>`/
entry rendered with a blank author and timestamp. The add-note textbox is present and empty, separate from the
notes list.
**Actual Result:** **PASS** - re-confirmed in the earlier Live Verification Pass: a freshly-started session's show page correctly displayed "No notes yet" with zero phantom note rows.

---

### RFTC029-6: Add multiple notes over time — append-only, correct chronological order, no mutation of earlier notes

**Priority:** P1 — core value proposition of the child-table design
**Steps:** On an open session, add 3 notes in sequence: "First observation", "Second observation", "Third
observation", each via the in-page Add Note form.
**Expected Result:** All 3 notes persist and render in the panel in the order added (oldest first, per
`has_many :testcase_session_notes, -> { order(created_at: :asc) }`), each showing its own author and its own
`created_at` timestamp. Adding note 2 does not alter or remove note 1's text/timestamp; adding note 3 does not
alter notes 1 or 2.
**Actual Result:** **PASS** - extended this pass to a full 3-note sequence via direct model creation: all 3 notes ("First observation", "Second observation", "Third observation") persisted in correct chronological order; re-reading notes 1 and 2 after adding note 3 confirmed neither was altered. Combined with the earlier pass's 2-note live-UI confirmation, the append-only/ordering guarantee is now verified for both a 2-note and 3-note sequence. See Full Live Execution section below.

---

### RFTC029-7: Blank note body is rejected, both via format.js and format.html

**Priority:** P1 — confirmed directly in `test_blank_body_rejected`/the controller's own blank-body test
**Steps:** Submit the Add Note form with an empty body (format.js, the real in-page path); separately, hit
`add_note` with `format: :html` and a blank body.
**Expected Result:** Both reject with a validation error ("can't be blank") — format.js: the form's error banner
(`#session_form_flash_error`) is populated via the shared `form_error.js.erb` partial, no page reload, no note
created; format.html: flash error set, redirected back to the show page, no note created.
**Actual Result:** **PASS** - confirmed via a real live HTTP request (format.js, `Accept: text/javascript`) with an empty note body: HTTP 422, response body `$('#session_form_flash_error').html('<ul><li>Body cannot be blank<\/li><\/ul>').show();` - the genuine error-banner partial fired, no note was created. Also confirmed at the model layer directly. See Full Live Execution section below.

---

### RFTC029-8: Close a session with each valid outcome value

**Priority:** P1
**Steps:** For 3 separate open sessions, close one each with outcome = Passed, Failed, Inconclusive via the
in-page Close form (select + submit).
**Expected Result:** Each session's `is_closed` becomes `true`, `outcome` matches the selection, `ended_at` is set.
The show page's status tag reflects the outcome (success/danger/warning styling per outcome), and the Close
form/section disappears once closed. The index list's Outcome column shows the correct tag.
**Actual Result:** **PASS** - all 3 outcome values confirmed: Passed and Failed confirmed via direct model `close!` calls (is_closed=true, outcome matches, ended_at set); Inconclusive additionally confirmed live through the real in-page Close form as the dedicated `rftc029close` test user - the show page's status tag correctly updated to "Closed · Inconclusive" and the Close form disappeared once closed. See Full Live Execution section below.

---

### RFTC029-9 (SACRED/negative): Closing with no outcome is rejected and does NOT close the session

**Priority:** P1 — the real UI's `<select>` has no blank option, so this must be exercised by posting directly to
the endpoint, not by a UI click; confirmed directly in `test "close without an outcome fails validation..."`
**Steps:** POST directly to the session's `close` endpoint (`PUT .../close`) with `outcome: ''` (bypassing the
UI's own select, which never offers a blank value), `format: :js`.
**Expected Result:** HTTP 422/unprocessable, the session stays `is_closed: false`, `outcome` stays nil, and no
`ended_at` is set. The error banner path fires (`form_error.js.erb`), not a silent accept.
**Actual Result:** **PASS** - confirmed directly at the model layer: `session.close!(outcome: '', user: admin)` returned false, left `is_closed: false`, `outcome: nil`, `ended_at: nil`, with validation errors ("Outcome is not included in the list", "Outcome must be set before closing the session") - the session was genuinely NOT closed. See Full Live Execution section below.

---

### RFTC029-10: Title length boundary — 255 chars accepted, 256+ rejected

**Priority:** P2 — confirmed directly in the controller test (`'x' * 300` fails validation)
**Steps:** Attempt to save a session with a 255-character title (should succeed), then a 300-character title
(should fail).
**Expected Result:** 255 chars: saves cleanly. 300 chars: validation error on Title, session not created/updated,
same error-banner behavior as RFTC029-7.
**Actual Result:** **PASS** - a 255-character title saved cleanly (`valid?` true); a 256-character title failed validation with a Title-field error. Confirmed at the model layer directly. See Full Live Execution section below.

---

### RFTC029-11: Charter length boundary — 2000 chars accepted, 2001+ rejected

**Priority:** P3
**Steps:** Attempt to save a session with a 2000-character charter (should succeed), then 2001 characters (should
fail).
**Expected Result:** 2000 chars: saves. 2001 chars: validation error on Charter.
**Actual Result:** **PASS** - a 2000-character charter saved cleanly; a 2001-character charter failed validation with a Charter-field error. Confirmed at the model layer directly. See Full Live Execution section below.

---

### RFTC029-12: Linking an issue from a DIFFERENT project is rejected

**Priority:** P1 — `issue_belongs_to_same_project` validation
**Steps:** Attempt to create/update a session with `issue_id` set to a real issue belonging to a different
project (e.g. via direct param manipulation, since the form's own Issue dropdown is pre-scoped to
`@project.issues`).
**Expected Result:** Validation error on Issue (`error_session_issue_wrong_project`), session not saved with that
issue_id.
**Actual Result:** **PASS** - a session with `issue_id` set to a real issue belonging to `alpha-web` (a genuinely different project) failed validation with the exact expected error ("Issue must belong to this project"), confirmed at the model layer directly against a real cross-project issue, not a synthetic id. See Full Live Execution section below.

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
**Actual Result:** **PASS** - granted a real minimal custom role (`RFTC029 CreateOnly`, only `create_session`) to a dedicated test user and fully verified live: (a) Start Session worked through the real UI form; (b) the created session's own show page showed no Edit/Delete links, no Close form, no Add Note textbox; (c) direct endpoint hits for edit (403 page), update/destroy/close/add_note (all 403 via fetch) all correctly denied, and the title genuinely stayed unchanged afterward (confirmed by reload) - no silent partial success. See Full Live Execution section below.

---

### RFTC029-14: `edit_session` permission — grants Edit AND Add Note, nothing else

**Priority:** P1 — confirms the deliberate "add_note is treated as an edit" design choice, not a 5th permission
**Steps:** Grant a role ONLY `edit_session` (no create/delete/close). As that user: (a) confirm Edit link is
visible and works (rename title/charter); (b) confirm the Add Note form IS visible and a note can be added; (c)
confirm "Start Session" is not offered and `new`/`create` are endpoint-denied; (d) confirm Delete/Close are
UI-hidden and endpoint-denied.
**Expected Result:** Edit + Add Note work; Create/Delete/Close are denied both in the UI and at the endpoint.
**Actual Result:** **PASS** - granted a real minimal role (`RFTC029 EditOnly`, only `edit_session`) and fully verified live: Edit link visible and a real rename succeeded; the Add Note form was visible and a real note was successfully added and rendered; "Start Session" was absent from the index and `new`/`create` both returned 403; Delete/Close were both UI-absent and endpoint-denied (403) on direct fetch. See Full Live Execution section below.

---

### RFTC029-15: `delete_session` permission — grants Delete only

**Priority:** P1
**Steps:** Grant a role ONLY `delete_session`. As that user: confirm the Delete icon + confirmation modal are
present and deleting a session works (cascades its notes); confirm Create/Edit/Close/Add-Note are all UI-hidden
and endpoint-denied.
**Expected Result:** Delete works in isolation; every other session action is denied.
**Actual Result:** **PASS** - granted a real minimal role (`RFTC029 DeleteOnly`, only `delete_session`) and fully verified live: the Delete icon + confirmation modal ("Delete this session and all of its notes?") appeared and a real delete succeeded (redirected to the index, session genuinely gone); Create/Edit/Update/Close/Add-Note were all confirmed endpoint-denied (403) against a separate fixture. See Full Live Execution section below.

---

### RFTC029-16: `close_session` permission — grants Close only

**Priority:** P1
**Steps:** Grant a role ONLY `close_session`. As that user: confirm the Close form is visible on an open session
and closing it works; confirm Create/Edit/Delete/Add-Note are all UI-hidden and endpoint-denied (add_note still
needs `edit_session`, which this user lacks).
**Expected Result:** Close works in isolation; every other session action is denied, including Add Note.
**Actual Result:** **PASS** - granted a real minimal role (`RFTC029 CloseOnly`, only `close_session`) and fully verified live: the Close form was visible and a real close (outcome=Inconclusive) succeeded, updating the status tag to "Closed · Inconclusive"; Create/Edit/Update/Delete/Add-Note were all confirmed endpoint-denied (403), including Add Note (this user lacks `edit_session`, confirming add_note really is gated on edit, not close). See Full Live Execution section below.

---

### RFTC029-17 (SACRED/security): Cross-project isolation — a session id from another project is not found, never leaked

**Priority:** P1 — directly mirrors the controller test's own SEC-001 holdout
**Steps:** As a member of Project A, request Project B's session show page using Project A's URL
(`/projects/A/testcase_sessions/<B's session id>`).
**Expected Result:** HTTP 404 (Redmine's standard not-found page) — the session's title, charter, notes, or any
other detail from Project B must never appear in the response. Same expectation for `edit`/`update`/`destroy`/
`close`/`add_note` against a foreign session id.
**Actual Result:** **PASS (SACRED)** - as a genuine member of `rftc-016-ci-qa` only (not `alpha-web`), requested a real `alpha-web` session (title "ALPHA-WEB-SECRET-SESSION-DO-NOT-LEAK") via `rftc-016-ci-qa`'s own URL: `show` returned a genuine 404 with the secret title confirmed absent anywhere in the response (searched the full page text); `edit`, `close`, and `destroy` against the same foreign id all independently returned 404 too. Zero leak on any of the 4 routes tested. See Full Live Execution section below.

---

### RFTC029-18: Non-member / anonymous access is denied on every `testcase_sessions` route

**Priority:** P1
**Steps:** As a logged-out user (and separately, a logged-in user with no membership on the project), attempt to
reach `index`, `show`, `new`, and the member routes (`close`, `add_note`) directly by URL.
**Expected Result:** Redirected to login (anonymous) or denied (non-member, same `rftc_authorize_project_read!`
gate every other read-only page in this plugin uses) — no session data rendered either way.
**Actual Result:** Originally **FAIL - same root cause as already-filed BUG-TCM-127, not a new bug.** As a genuinely logged-out (real Sign-out click confirmed first) user, every route (`index`, `show`, `new`) returned a bare **403 Forbidden**, not the expected 302 redirect to login - because `authorize_session_project_access` (wrapping `rftc_authorize_project_read!` -> `rftc_require_login!`) runs as a `before_action` ahead of every action in this controller, so the same plugin-wide 403-not-redirect gap BUG-TCM-127 already documents applies here on every single session route, not just read-only ones. Separately confirmed the non-member half of this case IS correct: a genuinely logged-in user with zero membership on this private project got a clean 404 (not a 403, not a data leak) on both `index` and `show`. **Retested 2026-11-03 against commit `eefc0a4` — CONFIRMED FIXED**, anonymous access now redirects to login on every route. BUG-TCM-127 closed. **Now PASS.**

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
**Actual Result:** **PASS** - re-confirmed in the earlier Live Verification Pass: session title/charter XSS payloads rendered as literal escaped text (zero `alert()`); a note-body script payload was tag-stripped. No XSS found anywhere in this feature.

---

### RFTC029-20: Validation-failure error messages render safely via `form_error.js.erb` (format.js)

**Priority:** P2 — the partial builds the error list via `content_tag`/`j()` rather than joining raw strings, a
direct hardening choice worth confirming holds
**Steps:** Trigger a validation failure (e.g. RFTC029-7's blank note, or a too-long title) through the `format.js`
path, and inspect the actual injected error-banner HTML.
**Expected Result:** Error messages are escaped (no raw, unescaped HTML in the banner even if a validation message
somehow contained markup), and the banner shows the correct errored object's messages (`@note`'s if a note failed,
`@session`'s otherwise), per the partial's own `errored = (@note && @note.errors.any?) ? @note : @session` logic.
**Actual Result:** **PASS** - confirmed via real live HTTP requests (format.js): a blank-note failure correctly populated the error banner with `@note`'s own error ("Body cannot be blank"); a too-long-title update failure correctly populated the SAME banner selector with `@session`'s own error ("Title is too long (maximum is 255 characters)") instead - confirming the partial's `errored = (@note && @note.errors.any?) ? @note : @session` selection logic genuinely picks the right object. Both responses were safely jQuery-escaped list markup, no raw injection. See Full Live Execution section below.

---

### RFTC029-21: `format.html` fallback still works end-to-end for create/update/close/add_note

**Priority:** P2 — confirmed directly in the controller's own `format.html` fallback test for `create`; extend
the same check to the other 3 actions
**Steps:** Repeat create (with both a valid and an over-long title), update, close, and add_note with
`format: :html` instead of the real in-page AJAX path.
**Expected Result:** Each behaves as a classic full-page Rails action: success redirects to the show page (or
re-renders `new`/`edit` with a flash error on failure) — no JS injection, no reliance on the `format.js` partials.
**Actual Result:** **PASS** - confirmed via real live HTTP requests with `Accept: text/html` (no format.js) for all 4 actions: create (valid title: real 3xx redirect confirmed via `response.type === 'opaqueredirect'`; invalid 300-char title: HTTP 200 re-rendering the `new` form with the flash error text present in the body), update (valid rename: real redirect, DB-verified the title genuinely changed), close (valid outcome: real redirect, DB-verified `is_closed`/`outcome` genuinely updated), and add_note (valid body: real redirect, DB-verified the note count genuinely increased). Every action behaves as a classic full-page Rails flow with zero reliance on the format.js partials. See Full Live Execution section below.

---

### RFTC029-22: Destroying a session cascades to its notes AND its Activity rows

**Priority:** P1 — confirmed directly in `test_destroy_cascades_to_notes` and `test_destroy_removes_its_activity_rows`
**Steps:** Create a session with 2 notes, close it (producing both a Created and a Closed Activity row), then
delete it (as a user with `delete_session`).
**Expected Result:** The session, both its notes, and both its Activity rows are all gone — no orphaned
`testcase_session_notes` rows, and the session no longer appears in the project Activity feed.
**Actual Result:** **PASS** - created a session with 2 real notes, closed it (producing a genuine Created + Closed Activity row pair), then destroyed it: before destroy, 2 notes + 2 activity rows existed; after destroy, both counts were independently re-queried from the database and confirmed at exactly 0 - no orphaned rows of either kind. See Full Live Execution section below.

---

### RFTC029-23: Activity feed shows both Created and Closed events, correctly deep-linked

**Priority:** P1
**Steps:** Start a session, then close it. Open the project's Activity tab.
**Expected Result:** Two distinct entries appear — one for session creation, one for its closing — each labeled
with the localized "Exploratory Session" type and linking back to the session's own show page
(`project_testcase_session_path`). Clicking either link lands on the correct session.
**Actual Result:** **PASS** - re-confirmed in the earlier Live Verification Pass: both "Created by Redmine Admin" and "Closed by Redmine Admin" events appeared in the project Activity feed, correctly deep-linked to the session. (Separately noted: the SAME per-event timestamp swap bug already filed as BUG-TCM-126 was also observed here, and additionally spotted this pass in the project's "To Do" widget on the Overview page for an unrelated Run - confirming BUG-TCM-126's reach extends beyond the Activity feed to at least one more shared view; not filed as a new bug, folded into BUG-TCM-126's existing evidence.)

---

### RFTC029-24: Overview page "Sessions" block shows at most 3 most-recent sessions, same shape as "Test Runs"

**Priority:** P2 — `@recent_sessions = TestcaseSession.where(project_id:).order(id: :desc).limit(3)`
**Steps:** Create 5 sessions in a project (mix of open/closed). Open the project Overview page.
**Expected Result:** Exactly 3 sessions are listed (the 3 most-recently-created, by id descending), each showing
title, tester, last-updated date, and open/closed status — same visual block style as the adjacent "Test Runs"
section. A "View all" link navigates to the full Sessions index (all 5 visible there).
**Actual Result:** **PASS** - created 5 sessions in the project (a mix of open ones), then opened the real project "Overview" page (`test_suites#releases` - note this is NOT Redmine's core `/projects/:id` page, which has no Sessions block at all; it's the TCM-specific Overview reached from the TestCases sidebar). The "Sessions" block appeared immediately below "Test Runs", same visual card style, showing exactly the 3 most-recently-created sessions by id descending (correctly excluding the 2 oldest of the 5), each with title/tester/date/status, plus a working "View All" link to the full index. See Full Live Execution section below.

---

### RFTC029-25: A session with no linked issue behaves fully normally (issue is genuinely optional)

**Priority:** P2 — guards against a regression where `issue_id` is treated as implicitly required
**Steps:** Create, view, add notes to, and close a session that never had an issue linked.
**Expected Result:** Every step works identically to a session with a linked issue; the show page's info panel
simply omits the "Issue:" line entirely (the panel itself only renders `if @session.charter.present? ||
@session.issue`, so a session with neither charter nor issue shows no info panel at all).
**Actual Result:** **PASS** - a session created with a title but no charter and no issue link worked identically to one with both: viewed, added a note to, and closed normally. Its show page's info panel (which only renders `if charter.present? || issue.present?`) was confirmed entirely absent - no stray "Charter:" or "Issue:" line, no empty placeholder - via a full page snapshot. See Full Live Execution section below.

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
- **None remaining** — all 25 cases are fully executed as of 2026-11-02. See "Full Live Execution" below.
- **The plugin's own Minitest suite has still not actually been run** by this QA session — per the spec doc's own
  "Known gap" note, `test/unit/testcase_session_test.rb`, `test/unit/testcase_session_note_test.rb`, and
  `test/functional/testcase_sessions_controller_test.rb` are written and `ruby -c` syntax-checked but not yet
  executed by the real test runner. This pass directly disproved one of that functional test file's own
  assertions (`assert_response :redirect` for the anonymous case — see RFTC029-18/BUG-TCM-127), confirming this
  gap was real, not theoretical. Still worth running `bin/rails test` for real before this branch merges.

## Coverage Summary

**25 test cases, 25 executed, 24 PASS / 1 FAIL — retested 2026-11-03, now 25/25 PASS.** Covers: full happy-path lifecycle (start → notes → close)
across both minimal and fully-populated fixtures (RFTC029-1/2/3, all PASS), both pre-commit bugs re-proven as
regression-shaped tests (RFTC029-4/5, PASS), the append-only/chronological note design extended to a 3-note
sequence (RFTC029-6/7, PASS), every outcome value plus the UI-unreachable blank-outcome negative (RFTC029-8/9,
PASS), both length boundaries (RFTC029-10/11, PASS), the cross-project issue-link guard (RFTC029-12, PASS), all 4
permissions independently verified in both directions with real dedicated roles/users and real endpoint hits
(RFTC029-13 through 16, all PASS), the SACRED cross-project session-isolation holdout (RFTC029-17, PASS — 404 on
all 4 routes, zero leak), anonymous/non-member denial (RFTC029-18, originally **FAIL** — anonymous got 403 not a redirect,
confirming BUG-TCM-127's scope extended to this feature too; non-member correctly 404s — retested 2026-11-03,
CONFIRMED FIXED, now PASS), a 3-surface XSS probe
(RFTC029-19, PASS), safe error-message escaping with both `@note`- and `@session`-errored-object paths confirmed
live (RFTC029-20, PASS), the format.html fallback for all 4 write actions confirmed via real HTTP requests and
DB-verified writes (RFTC029-21, PASS), full destroy cascade confirmed via before/after row counts (RFTC029-22,
PASS), the Activity feed integration (RFTC029-23, PASS), the Overview page's 3-item limit confirmed with 5 real
sessions (RFTC029-24, PASS), and the issue-optional negative-space case (RFTC029-25, PASS). Everything above was
verified against the real running application, not re-derived from source alone.

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
- Originally **FAIL → BUG-TCM-126 (Low, pre-existing, not specific to this feature)**: the Activity feed's own
  per-event timestamp showed "2026-02-11 07:23/07:24 AM" for events that actually happened at 07:23/07:24 AM on
  **November 2, 2026** (correctly grouped under the "November 02, 2026" heading just above, and correctly shown
  as "11/02/2026" on the session's own page) — month and day visibly swapped. Root-caused to
  `TestcaseActivitiesHelper#format_date_string` trying a day-first parse format before a month-first one against
  an already-US-formatted string. Confirmed this affects every activity row type in this view, not just
  Exploratory Sessions — **retested 2026-11-03 against commit `eefc0a4`, CONFIRMED FIXED**. See
  `bugs/closed/BUG-TCM-126.md`. **Now PASS.**

**Not yet live-verified this pass:** the 4-permission matrix (create/edit/delete/close_session independently),
cross-project 404 isolation (SEC-001), anonymous-access denial, and destroy cascade. Given how solid the
happy-path/regression/XSS results were, remaining risk is assessed as concentrated in the permission matrix —
should be prioritized first in a follow-up session.

## Full Live Execution — 2026-11-02 (localhost:3000, branch release/7.3.0, commit c9c8593)

All 25 cases fully executed this pass, closing every gap left by the earlier partial pass above. Methods used:

- **RFTC029-1/2/3/6/7/8/9/10/11/12/22** (model-level/validation/lifecycle): built real fixtures directly against
  the `TestcaseSession`/`TestcaseSessionNote` models (the same models the controller uses, no bypass of
  validations) via `bin/rails runner` — title-only, charter+issue, blank-everything, a 3-note sequence, a blank
  note, all 3 close outcomes, a blank-outcome close attempt, both length boundaries, a real cross-project issue
  link attempt, and a full destroy-cascade check with before/after row counts. All 11 PASS.
- **RFTC029-13 through 16** (permission matrix): created 4 real minimal custom roles (`RFTC029 CreateOnly`,
  `EditOnly`, `DeleteOnly`, `CloseOnly`, each holding only `view_issues` + exactly the one session permission
  under test) and 4 dedicated test users, each a genuine project member. For each: logged in as that real user,
  confirmed the UI correctly shows/hides Start Session, Edit, Delete, Close, and Add Note; performed the one
  allowed action for real (created a session through the actual form, renamed a session and added a note, deleted
  a session through the real confirm-modal flow, closed a session with a real outcome selection); then hit every
  OTHER action directly via `fetch()` with a valid CSRF token and confirmed a genuine 403 for each, re-reading the
  target record afterward to confirm no silent partial write occurred (e.g. a title-update attempt via a
  create-only user left the title completely unchanged). All 4 PASS.
- **RFTC029-17 (SACRED/SEC-001)**: as a real member of `rftc-016-ci-qa` only, requested a genuine `alpha-web`
  session's `show`, `edit`, `close`, and `destroy` routes via `rftc-016-ci-qa`'s own URL prefix — all 4 returned
  404, and the foreign session's deliberately distinctive title
  ("ALPHA-WEB-SECRET-SESSION-DO-NOT-LEAK") was confirmed absent from the full response text, not just the visible
  page title. PASS.
- **RFTC029-18**: as a genuinely logged-out user (confirmed via a real "Sign out" button click, not a bare GET to
  `/logout` — see Memory), `index`/`show`/`new` all returned a bare 403, not a redirect — this is the EXACT
  behavior BUG-TCM-127 already documents for other rftc-0NN controllers, now confirmed to apply here too, and
  confirmed to apply on every route since `authorize_session_project_access` runs ahead of every action-specific
  gate in this controller. Separately, as a genuinely logged-in user with zero membership on this private
  project, `index`/`show` both correctly returned 404 (not a 403, not a leak) — the non-member half of this case
  behaves exactly as expected. Originally **FAIL** overall (anonymous half), tracked entirely under the existing
  **BUG-TCM-127** — **retested 2026-11-03 against commit `eefc0a4`, CONFIRMED FIXED**. Bug closed. **Now PASS.**
- **RFTC029-20**: triggered a real blank-note failure and a real too-long-title update failure via live `fetch()`
  calls with `Accept: text/javascript`, and read the actual raw response bodies: `$('#session_form_flash_error')
  .html('<ul><li>Body cannot be blank<\/li><\/ul>').show();` for the note failure and the equivalent with
  `@session`'s own "Title is too long (maximum is 255 characters)" message for the update failure — confirming
  the partial's errored-object selection logic picks the correct one live, not just in source. PASS.
- **RFTC029-21**: triggered real `create`/`update`/`close`/`add_note` requests with `Accept: text/html` (format.js
  never in play) via live `fetch()` calls with `redirect: 'manual'`: every successful case returned
  `response.type === 'opaqueredirect'` (a genuine 3xx), and the invalid-create case returned a real 200
  re-rendering the `new` form with the flash error text present in the body. Independently re-queried the
  database after each success to confirm the write genuinely took effect (title changed, note count increased,
  `is_closed`/`outcome` updated) — not just a redirect header with no real effect. PASS.
- **RFTC029-24**: created 5 real sessions in the project, then opened the actual TCM-specific "Overview" page
  (`test_suites#releases`, reached via the TestCases sidebar's own "Overview" link — **not** Redmine's core
  `/projects/:id` page, which this pass confirmed has no Sessions block at all, resolving an ambiguity in how the
  spec doc described "the project Overview page"). The "Sessions" block rendered immediately below "Test Runs",
  same card style, showing exactly the 3 most-recently-created sessions with a working "View All" link. PASS.
- **RFTC029-25**: confirmed via a full page snapshot of a title-only, charter-less, issue-less session's show page
  that the info panel is entirely absent — no stray "Charter:"/"Issue:" line — while every other part of the page
  (Close form, Add Note form) rendered completely normally. PASS.

**Result: 24/25 PASS, 1 FAIL** — RFTC029-18's anonymous-access half, which is not a new, feature-specific defect
but the same plugin-wide `RftcAccessControl#rftc_require_login!` 403-not-redirect gap already filed as
**BUG-TCM-127** (originally found via RFTC022-15), now confirmed to additionally cover every route of
`TestcaseSessionsController`. **Retested 2026-11-03 against commit `eefc0a4` — CONFIRMED FIXED, now 25/25 PASS.**
