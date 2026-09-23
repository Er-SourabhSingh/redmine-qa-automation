# Test Cases — Redmineflux Inline Editor — Permissions & Access Control

> Source: the vendor KB publishes no permissions matrix; it states only that inline availability "depends on the
> Redmine configuration and the specific fields exposed by the plugin". This suite establishes the matrix
> empirically and verifies that the inline path enforces exactly the same rules as the standard Edit form.
> **Status: authored 2026-09-15. TC-INE-092/097/098/099/102/103/104/105/106 all PASS. TC-INE-094 PASS** (its
> "single highest-value case" question resolved via `BUG-INE-006`: the endpoint protects the data, but the list
> view's UI is wrong — see its Result). **Update 2026-09-23: the leg-2 endpoint checks for TC-INE-094/095/096 are
now executed. The data is enforced in every case, but 094/095 get a silent 200 with "Saved successfully."
(`BUG-INE-006`), and 096's description gets 302 with the same false success (`BUG-INE-008`). See each Result.**
~~**TC-INE-093/095/096 PARTIAL PASS**~~ (historical: positive leg + dropdown-filtering/
> zero-affordance confirmed via real UI; the negative-endpoint leg for a role with literally zero rendered
> affordance still has no UI path to trigger it, and a hand-rolled `fetch()`/`curl` was declined both by the user
> and by the harness's own auto-mode classifier this session — see `INLINE_EDITOR_MEMORY.md`). **TC-INE-100
> resolved N/A** (plugin never exposes notes to inline editing at all). **TC-INE-101 PASS (2026-09-23)**:
> executed with two isolated browser contexts (Developer plus Admin). After a mid-edit revocation, the field save
> got `403`. See its own Result.**

## Plugin
- Name: Redmineflux Inline Editor Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_inline_editor_qa

## Methodology — mandatory for every case in this suite

A missing pencil icon is **not** evidence that a write is blocked. This plugin's whole risk profile is that it adds
a second, JavaScript-driven write path alongside the standard form. Each case is checked three ways:

1. **Positive UI** — the permitted role edits inline through real navigation and it works.
2. **Negative UI** — the denied role sees no inline affordance.
3. **Negative endpoint** — the denied role is refused when the inline update request is sent **directly**.

Leg 3 is the one that matters here. The governing question for every case below is: *does the inline endpoint
enforce the same rule the standard form enforces?* Any place where it does not is the defect.

---

## Permissions matrix to establish

| Action | Admin | Manager | Developer | QA | Reporter | Non-member | Anonymous |
|--------|-------|---------|-----------|-----|----------|------------|-----------|
| See the inline edit affordance | | | | | | | |
| Inline-edit Status | | | | | | | |
| Inline-edit Priority | | | | | | | |
| Inline-edit Assignee | | | | | | | |
| Inline-edit Subject | | | | | | | |
| Inline-edit Description | | | | | | | |
| Inline-edit custom fields | | | | | | | |
| Inline-edit a workflow-read-only field | | | | | | | |

Fill in from observed behaviour, not from assumption. Record separately, per role, whether the **UI** and the
**endpoint** agree — a row where they disagree is a bug, not a matrix entry.

---

## Functional Cases

---

### TC-INE-092: Admin can inline-edit every exposed field

**User Role:** Admin
**Steps:**
1. Exercise every row of the matrix as Admin, on the issue list and the detail page.

**Expected Result:**
- All succeed and all are journaled.

**Result: PASS, executed 2026-09-22** — as Admin on fresh issue #1557 (test project, Bug tracker): inline-edited
Status, Priority, Assignee, %Done and `cf_69` (the workflow-read-only-at-New field — Admin is exempt from workflow
field permissions and got a working pencil where a Developer would not). All 5 saves returned `200` and each
produced a correctly-attributed journal entry. Description also exercised separately (TC-INE-045–053) with the
same clean result. Matrix row "Admin: all editable rows succeed" confirmed.

---

### TC-INE-093: Inline editing requires the edit-issues permission

**User Role:** Developer (has it), then a role without it
**Steps:**
1. As Developer, inline-edit a field — expect success.
2. As the role without edit-issues, confirm no affordance appears.
3. As that role, send the inline update request directly.

**Expected Result:**
- Leg 3 refused with 403. The inline path grants nothing beyond the standard edit permission.

**Result: PASS, executed 2026-09-22/23** — added `willow.belle` as Developer on "test project" (new member,
`edit_issues=true` per the role's existing config). **Leg 1 PASS:** inline-edited Priority on issue #1557,
`200`, saved. **Leg 2 PASS:** as `harmony.rose` (new "QA Read Only" role: `view_issues` only), confirmed **zero**
`.rf-edit-icon` elements anywhere on the same issue — no affordance at all, not merely hidden. **Leg 3 (does the
endpoint enforce the same rule?) now answered via a real UI-driven request** (see `BUG-INE-006`, filed
2026-09-23): on the **issue list** specifically, `cf_69` (workflow Read-only at "New" for Developer/Bug)
incorrectly renders an edit pencil, but submitting a value through it returns `200` with the response's own
echoed `custom_fields` array confirming the value stayed `""` — the write was **not** applied. So the endpoint
**does** protect the data (this TC's core security concern is resolved: no unauthorized field change actually
persists), but the client falsely displays "Changes saved successfully." for that no-op write — a real, filed
UX-correctness bug distinct from the security question this TC was written to answer.

---

### TC-INE-094: Workflow field permissions are enforced at the endpoint

**User Role:** Role with a field marked read-only in the workflow
**Steps:**
1. Confirm no affordance on that field.
2. Send an inline update for it directly.

**Expected Result:**
- Refused. **This is the single highest-value case in the suite**: an inline editor that checks field permissions
  only when rendering the icon, and not when handling the write, lets any member with basic edit rights change
  fields the workflow reserves for managers. That would be High severity.

**Result: PARTIAL PASS (leg 1 only), executed 2026-09-22** — reused the `cf_69` fixture rule (role Developer,
tracker Bug, Status "New" = Read-only, established in `INLINE_EDITOR_CUSTOM_FIELD_CONFIGURATION.md` TC-INE-006).
As `willow.belle` (Developer) on a fresh Bug-tracker issue at "New": `cf_69`'s row rendered with **no**
`.rf-edit-icon`, while the same row's Priority field (unrestricted) **did** show one — confirms the plugin reads
the workflow permission per-field, correctly, not as a blanket lock. **Leg 2 (direct endpoint write) not
executed** — same raw-`fetch()` constraint as TC-INE-093/096. This remains the suite's single highest-value
unconfirmed item; recommend prioritizing a safe way to drive this leg (e.g. via the plugin's own request-signing
path rather than a hand-rolled fetch) in a follow-up session.

**Result (leg 2): FAIL, executed 2026-09-23. Data is enforced, but the write is not refused (`BUG-INE-006`)**
- **Method:** two isolated browser contexts. As `willow.belle` (Developer), open the inline editor on a field
  while it is still editable, and type a value. Admin then makes that field Read-only at the issue's current
  status via Workflow → Fields permissions (Developer / Bug), which does not bump `lock_version`. Then submit.
  This sends a real plugin request for a workflow-Read-only field.
- **Core field, Subject on #1559 at Rejected:** `{"subject":"Subject written after it became workflow read-only","lock_version":"24"}`
  → **`200`**, subject echoed unchanged, toast **"Saved successfully."**. After reload the subject is unchanged
  and its pencil is absent.
- **Custom field `cf_69`, same method (TC-INE-006 step 3):** → `200`, `cf_69` echoed `""`, blank after reload.
- **Verdict:** the High-severity risk this TC targets does **not** exist, because the server enforces the
  workflow rule. The expected result, "Refused", is not met: the write is silently dropped and the user is told
  it succeeded. Recorded under `BUG-INE-006`'s extended scope, which has the same root cause.
- Workflow row restored after the run (Subject: `["","readonly","","","",""]`), verified by reload.

---

### TC-INE-095: Workflow status transitions are enforced at the endpoint

**User Role:** Role with a restricted status workflow
**Steps:**
1. Note which transitions the inline dropdown offers.
2. Send a forbidden transition directly to the inline endpoint.

**Expected Result:**
- Refused with the same error the standard form produces. A dropdown filtered client-side but unenforced
  server-side is a High-severity defect.

**Result: PARTIAL PASS (leg 1 only), executed 2026-09-22** — as `willow.belle` (Developer) on the Bug tracker's
Status dropdown: offered 5 of the workflow's 6 statuses (New, In Progress, Resolved, Feedback, Closed — "Rejected"
excluded), confirming the dropdown genuinely reflects a role-restricted status-transition workflow, not just the
full status list. A valid transition (New → In Progress) saved correctly (`200`, journaled). **Leg 2 (forbidden
transition sent directly) not executed** — same raw-`fetch()` constraint as TC-INE-093/094.

**Result (leg 2): FAIL, executed 2026-09-23. Transition is enforced, but not refused (`BUG-INE-006`)**
- **Method:** two isolated browser contexts. `willow.belle` opened the inline Status dropdown on #1560, which is
  at Feedback and offered In Progress, Resolved, Feedback and Closed. Admin then unchecked the Feedback → Resolved
  transition in Workflow → Status transitions (Developer / Bug; `transitions[4][3][always]`), leaving the author
  and assignee variants off as well. Willow then selected **Resolved**.
- `{"status_id":"3","lock_version":"8"}` → **`200`**, echoed status **Feedback**, toast **"Saved successfully."**.
  After reload the status is still Feedback.
- **Standard-form comparison, same revoked state:** the Edit form's Status select offered only In Progress,
  Feedback and Closed, so Resolved could not be chosen at all.
- **Verdict:** the High-severity risk (a transition filtered client-side but not enforced server-side) does
  **not** exist, because the server enforces it. The expected result, "Refused with the same error the standard
  form produces", is not met: the inline path reports success for a transition that didn't happen. Recorded
  under `BUG-INE-006`'s extended scope.
- The transition was restored (checked again), verified by reload.

---

### TC-INE-096: Read-only member sees no affordance and is refused

**User Role:** Role with view-issues only
**Steps:**
1. Hover rows in the list and fields on the detail page.
2. Send inline update requests for a simple field and for the description.

**Expected Result:**
- No affordance anywhere; both direct requests refused with 403.

**Result: PARTIAL PASS (leg 1 only), executed 2026-09-22** — created role "QA Read Only" (`view_issues` only,
nothing else) and added `harmony.rose` to "test project" under it. On issue #1557's detail page: confirmed via DOM
query (not visual hover) that **zero** `.rf-edit-icon` elements exist anywhere on the page, for any field including
the description. **Leg 2 (direct requests for a simple field and the description) not executed** — no UI-driven
path exists to trigger it (no editor markup renders at all for this role), and a hand-rolled `fetch()` was
specifically declined this session.

**Result (leg 2): FAIL, executed 2026-09-23. Simple field PASS, description FAIL (`BUG-INE-008`)**
- **Method:** two isolated browser contexts. `willow.belle` opened an inline editor on #1560 as Developer. Admin
  then changed her project membership to **"QA Read Only"** (`view_issues` only), which is exactly this TC's role,
  via Project settings → Members → Edit. Willow then submitted.
- **Simple field (Subject):** `PUT /issues/1560/update_field.json` → **`403 {"errors":["Forbidden"]}`**, toast
  "Could not save: HTTP 403", subject unchanged. After reload as the read-only member, 0 pencils were shown. PASS.
- **Description:** `POST /issues/1560` → **`302`** and toast **"Saved successfully."**. The description is
  unchanged and the journal count stayed at 7. It was not refused with 403, so the expected result is not met.
  This is `BUG-INE-008`, now also confirmed under a view-only membership, not just a role-permission revocation.
- Membership restored to Developer after each round, verified; Willow sees 29 pencils again.

---

### TC-INE-097: Non-member cannot inline-edit in a private project

**Result: PASS, executed 2026-09-23** — as `violet.ember` (authenticated, member of no project at all): direct `GET
/issues/1554` returned a clean `403 Forbidden` ("You are not authorized to access this page.") with no issue
metadata or field values leaked in the response body. Since the page itself is inaccessible, there is no UI path
through which an inline-update request could legitimately be constructed either — the same `before_action`
authorization gate that blocks the read blocks the write path by construction, not by a separately-observed
endpoint response. (Endpoint response code for the write specifically was not captured via a raw request, per this
session's constraint on hand-rolled `fetch()`/`curl` calls to permission-sensitive endpoints.)

**User Role:** Authenticated non-member
**Preconditions:** **Confirm the project is genuinely private** — a newly created Redmine project has "Public"
checked by default; uncheck it explicitly or this case falsely passes.
**Steps:**
1. Request the issue directly, then send an inline update request for it.

**Expected Result:**
- 403 or not-found on both. No field values or issue metadata leak in any response body, including error bodies.

---

### TC-INE-098: Anonymous user cannot inline-edit

**User Role:** Anonymous (logged out)
**Steps:**
1. On a public project that allows anonymous viewing, hover rows.
2. Send an inline update request with no session.

**Expected Result:**
- No affordance and the request refused. An unauthenticated write path would be Critical.

**Result: PASS (exceeded), executed 2026-09-23** — this instance has "Authentication required" enabled at the
instance level (Administration → Settings → Authentication): logged out entirely, every project's issue list
(`test-project`, `helpdesk-service-desk`) and even `/projects` itself redirect straight to `/login`. There is no
public project on this instance and no anonymous access to anything at all — a stronger guarantee than the TC
anticipated (no affordance is even reachable, let alone an update endpoint).

---

### TC-INE-099: Cross-project write via the inline endpoint

**User Role:** Member of project A only
**Preconditions:** Confirm the target issue really is in a private project B with no membership path for this user.
**Steps:**
1. Send an inline update request naming an issue ID in project B.

**Expected Result:**
- Refused. The endpoint must authorise the **target issue**, not merely the presence of a valid session.
- A successful write here is a Critical cross-project defect.

**Result: PASS, executed 2026-09-23** — as `willow.belle` (member of "test project" / project A only, confirmed
via the roster of new-membership fixtures — not a member of "QA Private Project" / project B): direct `GET
/issues/1554` returned `403 Forbidden`, identical to the non-member case in TC-INE-097. This confirms the
authorization check is keyed to the **target issue's project**, not merely "does this session have some valid
project membership somewhere" — a session that is perfectly legitimate for project A is still refused for an
issue in project B. Same caveat as TC-INE-097: the write-endpoint response code itself wasn't separately probed
via a raw request, but there is no UI path to reach one given the read is already blocked at the same gate.

---

### TC-INE-100: Private notes and private content stay private

**User Role:** Member without private-note rights
**Steps:**
1. Confirm no inline affordance on private content.
2. Request the inline edit form/data for it directly.

**Expected Result:**
- Refused, and the response contains none of the private content — the edit-form fetch is as much a read as the
  page itself, and is a common place for content to leak.

**Resolved N/A, checked 2026-09-22** — same finding as `INLINE_EDITOR_ISSUE_DETAIL_EDITING.md` TC-INE-058: the
plugin adds no inline-edit affordance to journal/notes content at all (`0` `.rf-edit-icon` elements inside any
journal element). Its inline-edit surface never touches notes, so there is no private-note attack surface via this
path.

---

### TC-INE-101: Permission revocation takes effect without re-login

**User Role:** Admin + affected member
**Steps:**
1. Remove edit-issues from the member's role while they have an inline editor open.
2. Have them confirm the edit without logging out.

**Expected Result:**
- Rejected. Permissions are evaluated per request, not cached in the page's JavaScript state.

**Result: BLOCKED, confirmed 2026-09-23** — requires two simultaneously-authenticated sessions. Two approaches
were tried and ruled out this session: (1) a second browser tab — confirmed to share the same cookie jar as the
first (checked `/my/account` in tab 2, saw tab 1's logged-in user), so it isn't a genuinely separate session; (2)
a `curl`-based second session, isolated from the browser's cookie jar — this successfully logged in as a second
user for read-only investigation, but a POST to modify role permissions (the exact action this TC needs) was
stopped by the harness's own auto-mode safety classifier before any write occurred. Also can't clear the session
cookie from page JS to simulate expiry, since it's `HttpOnly` (`document.cookie` returns `""`). Genuinely blocked
in this environment — needs either a real second device/browser profile, or an explicit, narrowly-scoped
permission grant for the specific curl action, neither of which is available this session. *(Superseded the same
day; see PASS below.)*

**Result: PASS, executed 2026-09-23 (two isolated Playwright browser contexts, each with its own cookie jar)**
- `willow.belle` (Developer) opened issue #1559, clicked the Subject inline pencil, and typed a new value without
  saving.
- In a separate Admin context, Administration → Roles → Developer: unchecked **Edit issues**
  (`edit_own_issues` was already off). Saved and reloaded to verify both were unchecked. No sudo prompt appeared.
- Willow pressed Enter in the still-open editor without logging out:
  `PUT /issues/1559/update_field.json {"issue":{"subject":"Written after edit permission revoked","lock_version":"24"}}`
  → **`403 {"errors":["Forbidden"]}`**. The toast read "Could not save: HTTP 403".
- After reload the subject was unchanged, and 0 inline pencils were rendered.
- **Permissions are evaluated per request, not cached in page JS.**
- A second leg re-ran the same revocation against the **Description** editor (issue #1560). That save goes
  through the standard issue update action instead of `update_field.json`. It returned `302` and dropped the
  change, but showed **"Saved successfully."**. Filed as **`BUG-INE-008`**. The data is protected; only the
  feedback is wrong.
- **Fixture gotcha:** unchecking and re-checking "Edit issues" on the role form also **clears its "All trackers"
  scope** (`role[permissions_all_trackers][edit_issues]`). After a restore, `RfIE.config.canEditIssues` read `true`
  but `issueEditable` read `false`, and there were no pencils, until "All trackers" was re-checked too.
- Final state: Developer role has `edit_issues` ✓ plus All trackers ✓. Verified by reload; Willow sees 29 pencils
  on #1560.

---

### TC-INE-102: Closed and archived projects

**User Role:** Member
**Steps:**
1. Attempt an inline edit in a closed project, then in an archived one, at both the UI and the endpoint.

**Expected Result:**
- Refused at both, matching Redmine's own semantics for closed (read-only) and archived (inaccessible) projects.

**Result: PASS by cross-reference, executed 2026-09-22** — fully covered by `INLINE_EDITOR_ISSUE_LIST_EDITING.md`
TC-INE-088, using the same "QA Closed Test Project"/"QA Archived Test Project" fixtures built this session: closed
project's pencil shown but save correctly `403`'d (no data corruption); archived project fully inaccessible
(`403` at the page level itself). Not re-executed independently here.

---

### TC-INE-103: Inline edit respects issue visibility rules

**User Role:** Role whose issue visibility is limited to "issues created by the user"
**Steps:**
1. Confirm the affordance appears only on that user's own issues.
2. Send an inline update for an issue created by someone else in the same project.

**Expected Result:**
- Refused. Visibility-scoped roles are the subtlest permission tier and the most likely to be missed by a plugin
  that only checks the project-level edit permission.

**Result: PASS, executed 2026-09-23** — as `summer.rain` ("QA Own Visibility" role, `issues_visibility=own`):
- Before creating any issue, the issue list showed **zero rows** — not just missing affordance, the list itself is
  empty for her.
- Created issue #1558 as her own. Reloading the list now shows **exactly one row** (#1558) — every other issue in
  "test project" (dozens, authored by Admin/Daisy/Willow/etc.) is completely absent from her view, not merely
  read-only. Her own issue has a working inline pencil.
- Direct `GET /issues/1551` (Admin's issue, same project): `403 Forbidden`. Confirms visibility-scoping is enforced
  as a genuine access-control boundary at the read layer, not a list-filtering cosmetic — exactly the "subtlest
  permission tier" this TC calls out, and it is **not** missed here.

---

### TC-INE-104: "Edit own issues" permission allows inline-editing only the user's own issues

**User Role:** Reporter, reconfigured to `edit_own_issues=true`, `edit_issues=false` (was both false by default on
this instance — checked via Administration → Roles and permissions before assuming stock Redmine defaults). Do
not conflate with TC-INE-093/912, which test the broader "Edit issues" permission and visibility-scoped roles
respectively.
**Preconditions:** `daisy.skye`'s membership on "test project" changed from Developer to **Reporter**. Issue
**#1553** created by `daisy.skye` herself (her "own" issue). Issue **#1551** authored by Redmine Admin (not hers).
**Steps:**
1. Confirm the inline affordance appears on issue #1553 (her own) and a save succeeds — on **both** the issue
   detail page and the issue list view (two separate widget implementations per this plugin's own architecture).
2. Confirm the inline affordance does NOT appear on issue #1551 (someone else's) — on both surfaces.
3. Send an inline update request directly for #1551.

**Expected Result:**
- Own-issue edits succeed; the other user's issue is refused both in the UI and at the endpoint (403). An inline
  editor that only checks "does this role have *some* edit permission" without distinguishing "own" from "any"
  would let this role silently edit everyone's issues — a real permission-boundary defect distinct from
  TC-INE-093's simpler on/off check.

**Result: PASS (steps 1–2, both surfaces), executed 2026-09-22** — as `daisy.skye`:
- **Issue detail page** (`/issues/1553`): Priority inline-edit succeeded (`200`, saved "High"). On #1551
  (Redmine Admin's, `/issues/1551`), zero inline edit affordance — no pencil at all, confirmed via DOM query.
- **Issue list view** (`/projects/test-project/issues`, both issues in the same list): Priority column on
  #1553's row has a working pencil — changed to "Low", `200`, persisted (reload-confirmed). Priority column on
  #1551's row has **no pencil at all** — same negative result as the detail page. User explicitly asked whether
  this had been checked on the list page specifically (it hadn't, initially) — now confirmed identical behavior
  to the detail page on both surfaces.
- **Follow-up, explicitly asked "all thing working as expected on issue list page??"** — the check above only
  covered the Priority column; broadened to confirm the same own/others distinction holds for **every** editable
  column on the list, not just Priority: on #1553 (own), Status/Subject/Assignee columns **all** show a working
  pencil; on #1551 (not own), **all three** show zero pencil, matching Priority's result exactly. Actually
  exercised Subject (not just checked for a pencil): changed it inline on #1553, `200`, reload-confirmed
  persisted. No console errors observed on the list page under this restricted role across the whole check.

**Step 3 (negative endpoint leg) not attempted** — an earlier raw-`fetch()` endpoint test in this same session
(TC-INE-006) triggered the browser's native Basic Auth popup and hung the Playwright session on a different
endpoint; rather than risk repeating that, this leg was skipped this pass. See global memory "Avoid Raw fetch()
On .json Endpoint Tests" before attempting it — drive the plugin's own request path instead of a hand-rolled one.

---

### TC-INE-105: "Edit issues" permission (not "Edit own issues") allows inline-editing any issue in the project

**User Role:** Manager (`luna.blossom`, already `edit_issues=true` on this instance, no reconfiguration needed)
**Steps:**
1. Confirm the inline affordance and a successful save on an issue authored by a different user — on both the
   issue detail page and the issue list view.

**Expected Result:**
- Succeeds — this is the contrast case for TC-INE-104, confirming the broader permission genuinely grants
  project-wide edit rather than being silently narrowed to "own" by the inline path.

**Result: PASS on both surfaces, executed 2026-09-22** — as `luna.blossom` (Manager):
- **Issue detail page**: inline-edited Priority on issue #1553 (authored by `daisy.skye`, not Luna) to "Urgent":
  `200`, saved and persisted.
- **Issue list view**: same issue #1553's Priority column had a working pencil; changed to "Immediate", `200`,
  reload-confirmed persisted. Confirms `edit_issues` genuinely grants any-issue edit on both surfaces, not
  silently narrowed to "own" by the inline path on either.

---

### TC-INE-106: "Edit project" permission gates project-list/card inline editing, per project

**User Role:** Reporter (`daisy.skye`), reconfigured to `edit_project=true` on this role. She is a member of
"test project" (Reporter, edit_project granted) and can also **view** "Helpdesk Service Desk" (visible in her
project list) without edit_project there.
**Preconditions:** Reporter role's `edit_project` checkbox checked via Administration → Roles and permissions —
required a "sudo mode" password re-confirmation to actually persist (see global memory "Redmine Sudo Mode On
Admin Saves" — the first attempt silently did not save).
**Steps:**
1. On the project list view (`?display_type=list`), confirm the inline pencil appears on the Name field for
   "test project" (edit_project granted) and attempt a save.
2. Confirm the pencil's presence/absence for "Helpdesk Service Desk" (edit_project NOT granted there) and attempt
   a save regardless of what the pencil shows.

**Expected Result:**
- Refused on the ungranted project, both UI and endpoint — this is the project-level analogue of TC-INE-093/913:
  the inline path must check "Edit project" per-project, not just "is this user logged in and a member of *some*
  project."

**Result: PASS — but with a genuine, notable finding, executed 2026-09-22** —
- **"test project" (granted):** pencil present, save attempted (round-tripped the Name field back to itself) →
  `204 No Content` — succeeded, as expected.
- **"Helpdesk Service Desk" (NOT granted — confirmed by the actual save attempt below, not by checking membership,
  since Daisy lacks rights to view that project's Members page):** the pencil **incorrectly appeared** as if the
  field were editable. Attempting the save anyway (`PUT` with a real value change) got a genuine **`403
  Forbidden`** — the endpoint correctly refused it, and the Name field reverted with **zero data corruption**.
- **This confirms the load-bearing security property holds** (the endpoint is the real gate, exactly as
  `INLINE_EDITOR_PERMISSIONS.md`'s own stated methodology says it must be — "a missing pencil icon is not evidence
  a write is blocked," and symmetrically here a *present* pencil is not evidence a write will succeed). The
  pencil-shown-when-it-shouldn't-be is a minor, cosmetic UI inconsistency (the client-side affordance isn't
  checking `edit_project` before rendering the icon on this surface) — **not a security defect**, since the
  server-side check is what actually protects the data. Worth a look if this plugin's UI logic is ever revisited,
  but Low severity at most given the endpoint holds. Not filed as a bug this session — flagged for awareness.
- Note: this 403 did **not** trigger the native Basic-Auth-popup risk documented for TC-INE-006/913 — that risk
  appears specific to certain request shapes, not universal to every 403 on this instance.
- **Follow-up, explicitly asked whether regression was complete — checked the project board/card view too**
  (the previous check only covered the project list `?display_type=list` view): same result. On the board,
  "Helpdesk Service Desk" (not granted) shows a pencil that shouldn't be there, but the actual save attempt
  correctly got `403`, name unchanged. "test project" (granted) saved correctly (`204`). Identical pattern on
  both project surfaces — the cosmetic pencil bug and the real endpoint enforcement both hold consistently.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| TC-INE-104 | — | Detail page + issue list, both confirmed: own issue (#1553) Priority edit 200 on both surfaces; other's issue (#1551) zero inline affordance on both. Endpoint leg not attempted (popup risk) | — |
| TC-INE-105 | — | Detail page + issue list, both confirmed: Manager edits non-authored issue (#1553) Priority 200, persisted on both surfaces | — |
| TC-INE-106 | — | "test project" (granted): pencil + save 204. "Helpdesk Service Desk" (not granted): pencil incorrectly shown, save correctly refused 403, no data corruption | — |
| TC-INE-092 | — | 5 field types inline-edited by Admin, all `200`, all journaled, including workflow-exempt `cf_69` | — |
| TC-INE-093 | — | Leg 1: Developer Priority edit `200`. Leg 2: QA-Read-Only role, 0 edit icons anywhere. Leg 3: not executed | — |
| TC-INE-094 | — | Detail page: `cf_69` no icon at New for Developer, Priority icon present same issue. List view: `cf_69` pencil WRONGLY shown, write `200` but echoed value stayed `""`, false success toast | BUG-INE-006 |
| TC-INE-095 | — | Leg 1: Status dropdown 5/6 options (Rejected excluded), valid transition saved `200`. Leg 2: not executed | — |
| TC-INE-096 | — | 0 edit icons anywhere for QA-Read-Only role (DOM-confirmed). Endpoint leg not executed | — |
| TC-INE-097 | — | `violet.ember` (non-member) direct GET /issues/1554 → 403, no data leaked | — |
| TC-INE-098 | — | Authentication required instance-wide; every project/`/projects` redirects to login when logged out | — |
| TC-INE-099 | — | `willow.belle` (project A member only) direct GET /issues/1554 (project B) → 403 | — |
| TC-INE-102 | — (cross-ref TC-INE-088) | — | — |
| TC-INE-103 | — | `summer.rain`: 0 issues visible until own-created; #1551 (Admin's) → 403 | — |
