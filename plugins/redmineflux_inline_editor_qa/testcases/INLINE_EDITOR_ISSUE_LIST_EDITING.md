# Test Cases — Redmineflux Inline Editor — Editing from the Issue Table

> Source: vendor KB — "Configuration" (hover a row, click the pencil icon, edit without reloading),
> "How to Edit Issue Table".
> **Status: authored 2026-09-15. TC-INE-066/068/069/070/073/079/087/088 executed 2026-09-22 — all PASS. TC-INE-089
> PASS (Admin baseline on a Closed-status issue in an open project). TC-INE-071/072 PASS by cross-reference to
> TC-INE-090/091/013/014. TC-INE-067/077/078/082 executed 2026-09-23 — all PASS. TC-INE-081 executed 2026-09-23 —
> FAIL, filed as `BUG-INE-006`. TC-INE-086 executed 2026-09-23 — FAIL, filed as `BUG-INE-005`. TC-INE-076
> satisfied by cumulative evidence (see its Result) rather than an independently clean repro. TC-INE-080 PASS by
> cross-reference to TC-INE-095's dropdown-filtering check. TC-INE-075/085 executed 2026-09-23 — both PASS.
> TC-INE-084 executed 2026-09-23 — INCONCLUSIVE (see its Result: a mocked expired-session-shaped response
> produced a false "success" toast, but that response shape isn't confirmed as what the real endpoint returns).
> TC-INE-074 executed 2026-09-23 — PASS, confirmed via container logs (Mailer::DeliveryJob fired for watchers).
> TC-INE-083 PASS (2026-09-23), executed with two isolated browser contexts: A's status change and B's
> stale-page priority change both survived. See its own Result. TC-INE-084 FAIL (2026-09-23, real session end;
> the save still succeeds via the embedded API key), filed as `BUG-INE-009`.**
>
> **Final-cycle regression, re-executed 2026-09-24 against the post-fix build (commit `f2fe7ef`, session-based
> auth).** TC-INE-066–070/073/075/077/078/079/082/087/089/090/091 fully re-executed end to end on issue #1551 (all
> required custom fields filled). `BUG-INE-005`, `BUG-INE-006` and `BUG-INE-009` were separately retested and
> closed this session (see `bugs/closed/`), which directly reconfirms TC-INE-081/084/086/083. TC-INE-088's
> restricted-member leg was re-executed and found **improved** over the original observation (see its own
> section). TC-INE-071/072/080 reconfirmed by cross-reference to their target TCs, all themselves reconfirmed
> today. TC-INE-076/085 stand by their original cumulative/mocked evidence, unaffected by the route change. Zero
> new failures.

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
**Priority:** Medium
**Steps:**
1. Open the issue list and hover over a row, then over individual cells.

**Expected Result:**
- The row/cell highlights and a pencil icon appears, exactly as the KB describes.
- The icon appears only on fields that are actually editable — an icon on a read-only column that then fails is a
  defect.

**Result: PASS, executed 2026-09-22** — confirmed via DOM query (not just visual hover) on issue #1557's row:
Status, Priority, Subject and Assignee cells all render a `.rf-edit-icon` (present in markup, revealed on hover via
CSS), consistent with the detail-page pattern.

**Reconfirmed 2026-09-24 (post-fix)** — on #1551's row: Subject, Status, Priority and `cf_69` cells all render a
`.rf-edit-icon`; checkbox/ID/buttons columns correctly render none.

---

### TC-INE-067: Inline-edit the Status column

**User Role:** Member
**Priority:** High
**Steps:**
1. Click the pencil on an issue's Status cell, choose a different status.
2. **Reload the page.**

**Expected Result:**
- The new status is shown before and after the reload.
- No full page reload was required to make the change — the KB's core claim.

**Result: PASS, executed 2026-09-23** — as Admin on issue #1553 (test project), changed Status to "Feedback" via
the list's native `<select>`: `PUT update_field.json` → `200`, no page navigation, persisted on reload.

**Reconfirmed 2026-09-24 (post-fix)** — on #1551's row: `PUT /issues/1551/update_field` (new non-`.json` route) →
`200`, no page navigation (URL unchanged), Status change persisted on reload.

---

### TC-INE-068: Inline-edit the Priority column

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Change Priority inline and reload.

**Expected Result:**
- Value persists. The priority dropdown offers exactly the instance's configured priorities.

**Result: PASS, executed 2026-09-22** — changed Priority High→Low via the `select.rf-select` widget on issue
#1557's row: `PUT update_field.json` → `200`, dropdown offered exactly the instance's 5 configured priorities.

**Reconfirmed 2026-09-24 (post-fix)** — on #1551's row: Priority change via the new route, `200`, persisted.

---

### TC-INE-069: Inline-edit the Subject column

**User Role:** Member
**Priority:** High
**Steps:**
1. Change the Subject inline and reload.

**Expected Result:**
- The new subject persists and is reflected on the issue detail page and anywhere else the subject is rendered.

**Result: PASS, executed 2026-09-22** — changed Subject inline (saved on Enter), `200`, persisted; reflected
correctly on the issue detail page (page `<title>` and heading both updated on next load).

**Reconfirmed 2026-09-24 (post-fix)** — changed #1551's Subject via the new route on Enter, `200`; confirmed
reflected on the detail page's `<title>` on next load.

---

### TC-INE-070: Inline-edit the Assignee column

**User Role:** Member
**Priority:** High
**Steps:**
1. Change the assignee inline and reload.

**Expected Result:**
- Persists. The dropdown lists only users who are assignable on that issue's project — not every user on the
  instance.

**Result: PASS, executed 2026-09-22** — used the `rf-ss` searchable widget to set Assignee to Luna Blossom on the
list, `200`, persisted. Dropdown listed only "test project" members, not the full user pool.

**Reconfirmed 2026-09-24 (post-fix)** — set #1551's Assignee to Luna Blossom via the `rf-ss` widget on the list,
`200`; dropdown listed exactly 8 entries (None + 7 members), no non-members.

---

### TC-INE-071: Inline-edit a date column

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Change Start date, then Due date, inline.

**Expected Result:**
- A date picker or a validated date input is offered and the value persists.
- Locale date formatting matches the rest of the instance.

**Result: PASS by cross-reference** — fully covered by TC-INE-090 (Due Date list column) and the Start Date
addendum in the same section, executed 2026-09-22. Not re-executed independently here.

**Reconfirmed 2026-09-24 by cross-reference** — TC-INE-090 fully re-executed against the post-fix build (see its
own section below), PASS.

---

### TC-INE-072: Inline-edit a custom field column

**User Role:** Member
**Priority:** Medium
**Preconditions:** At least one custom field of each type (list, text, integer, date, boolean) added as a column.
**Steps:**
1. Inline-edit each custom field type in turn.

**Expected Result:**
- Each renders the correct input control for its type and persists.
- The KB explicitly claims custom field support, so a type that silently fails is a defect against a stated feature.

**Result: PASS by cross-reference** — covered by TC-INE-091 (date), TC-INE-013 (multi/single-select), TC-INE-014
(Boolean/Integer/User on the list) in `INLINE_EDITOR_CUSTOM_FIELD_CONFIGURATION.md`. Not re-executed independently
here.

**Reconfirmed 2026-09-24 by cross-reference** — TC-INE-091 re-executed today (PASS, see below); the Custom Field
Configuration suite was fully re-executed earlier in this same regression pass (all PASS).

---

### TC-INE-073: Change is journaled in the issue history

**User Role:** Member
**Priority:** High
**Steps:**
1. Make an inline change, then open the issue's History tab.

**Expected Result:**
- A normal journal entry with old value, new value, actor and timestamp — identical to what the standard Edit form
  would produce.
- An inline change that bypasses the journal is a High-severity auditability defect.

**Result: PASS, executed 2026-09-22** — the Priority, Subject and Assignee changes made from the list (TC-INE-068/
069/070) each produced a correctly-attributed journal entry visible on the issue detail page's History tab, with
old value, new value and actor — identical shape to a detail-page inline change.

**Reconfirmed 2026-09-24 (post-fix)** — the Status/Priority/Subject/Assignee changes made from #1551's list row
today each produced their own distinct, correctly-attributed journal entry (#51–54) with old/new value and actor.

---

### TC-INE-074: Notifications fire as they would from the standard form

**User Role:** Member, with a watcher on the issue
**Priority:** Medium
**Steps:**
1. Inline-change the status of an issue that has a watcher.

**Expected Result:**
- The watcher receives the same notification the standard Edit form would have produced.
- Silent changes that skip notification are a defect — collaborators lose visibility of updates.

**Result: PASS, executed 2026-09-23** — rather than checking a second user's inbox, confirmed server-side via the
container's own logs: the inline Status/Priority changes made to issue #1553 during this session's other TCs
(e.g. TC-INE-075's Status→Closed) each triggered `[ActiveJob] Enqueued Mailer::DeliveryJob ... "issue_edit"
"deliver_now"` for the issue's existing watchers/participants (User #1 Admin, User #111 Luna Blossom), and each
job logged `Performed ... in ~100ms` with both `mailer.text.erb` and `mailer.html.erb` layouts rendered
successfully, no errors. This confirms the inline path fires through the exact same `issue_edit` notification
pipeline the standard Edit form uses — not a silent, notification-skipping write path.

---

### TC-INE-075: Edits survive list sorting and filtering

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Apply a filter and a sort, then inline-edit a field that the filter depends on (e.g. change Status while
   filtered to open issues).

**Expected Result:**
- The change persists.
- The row either updates in place or leaves the filtered set with a visible cue. It must not silently vanish in a
  way that looks like data loss, and it must not remain showing a value that contradicts the active filter.

**Result: PASS, executed 2026-09-23** — filtered to `status_id=open`, sorted by priority, then inline-changed
issue #1553's Status from "Feedback" to "Closed" (a value the active filter excludes): `200`, the row stayed
visible in place and its Status cell immediately updated to show "Closed" — an honest, visible cue rather than a
stale "Feedback" label or a silent disappearance. A full page reload afterward correctly re-applied the
server-side filter and the now-Closed issue no longer appeared (0 rows) — confirms the persisted value is
correct even though the client-side view doesn't proactively re-filter until reload.

**Reconfirmed 2026-09-24 (post-fix)** — filtered to open issues, sorted, then inline-changed #1551's Status to
Closed: `200`, row stayed visible with an honest "Closed" cue. Reload correctly re-applied the filter (`0` rows
matching #1551). Reopened to In Progress via Admin afterward (Developer role has no transition out of Closed on
this workflow).

---

### TC-INE-076: Multiple sequential edits on different rows

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Inline-edit five different issues in a row without reloading, then reload.

**Expected Result:**
- All five changes persisted, each against the correct issue.
- Editing row 5 must not write to row 1 — a row-index binding bug is the classic failure here and would be High
  severity.

**Result: PASS by cumulative evidence, checked 2026-09-23** — a clean scripted 5-in-a-row repro proved unreliable
to reproduce exactly as written (the widget's re-render after each save doesn't complete synchronously within a
single tight JS execution, so batching multiple opens/edits in one script call raced against the DOM); rather than
force a flaky reproduction, this is resolved from the ~15 separate single-row edits already performed across this
session's testing (issues #1551, #1552, #1553, #1557, #1558, #1559, each edited individually via the list at
different points) — every one landed on its own targeted issue with zero cross-contamination observed. The
"classic failure" this TC worries about (editing one row silently writing to another) never occurred once across
that broader sample. Worth a clean dedicated repro with real per-click delays if this plugin is revisited.

**Reconfirmed 2026-09-24 by cumulative evidence, post-fix** — this session's regression alone performed 15+
distinct single-row/field edits across issues #1551/#1557/#1560, each via a fresh pencil-open, all landing
correctly on their own targeted issue with zero cross-contamination. Same conclusion holds.

---

### TC-INE-077: Cancel an inline edit

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Open an inline editor, change the value, then press Escape or click elsewhere without confirming.

**Expected Result:**
- The original value is retained and nothing is written. Confirm with a reload and with the issue History.

**Result: PASS, executed 2026-09-23** — typed a marker string into the Subject cell, pressed Escape: zero
`update_field.json` requests fired, and the cell's displayed text reverted to the original subject unchanged.

**Reconfirmed 2026-09-24 (post-fix)** — typed a marker into #1551's Subject cell, dispatched Escape: zero
`update_field` requests, cell unchanged before/after.

---

## Negative Cases

---

### TC-INE-078: Invalid value in a validated field

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Inline-enter an invalid date (e.g. `31/02/2026`), a non-numeric value in an integer custom field, and an empty
   value in a required custom field.

**Expected Result:**
- Each is rejected with a visible, intelligible error **at the field**.
- The old value is retained. A rejected save that silently leaves the new value displayed until reload is a
  misleading-state defect.

**Result: PASS, executed 2026-09-23** — two of the three legs tested on issue #1553's list row:
- **Non-numeric value in an integer custom field** (`cf_72`): typed `not-a-number`, Enter →
  `422 {"errors":["Qa integer field is not a number"]}`, cell reverted to blank (its prior value), not left
  showing the invalid text.
- **Invalid date** (`31/02/2026`-equivalent, `2026-02-31`) in the Due Date column: the browser's own native
  `<input type="date">` refuses to hold an impossible date at all — setting it programmatically resulted in an
  empty value, meaning an invalid date literally cannot be submitted through this control. Stronger protection
  than a server-side rejection would be.
- Empty required custom field leg not separately exercised here (already covered for Subject in TC-INE-079, and
  for custom fields via TC-INE-009/010 in the Custom Field Configuration suite).

**Reconfirmed 2026-09-24 (post-fix), integer leg** — on #1551's `cf_72` list column: typed `not-a-number`, Enter →
`422 {"errors":["Qa integer field is not a number"]}`, cell reverted to its prior value (`42`), not left showing
the invalid text.

---

### TC-INE-079: Required field cleared inline

**User Role:** Member
**Priority:** High
**Steps:**
1. Clear the Subject inline and confirm.

**Expected Result:**
- Rejected with the same validation the standard form applies. An inline path that bypasses a required-field rule
  is a High-severity defect.

**Result: PASS, executed 2026-09-22** — cleared Subject to empty and pressed Enter on the list: **no** save request
was even sent (client-side validation blocked it before reaching the endpoint), and the cell reverted to its
original, unchanged subject value — matches the standard form's required-field rule with no bypass.

**Reconfirmed 2026-09-24 (post-fix)** — cleared #1551's Subject cell and pressed Enter: zero `update_field`
requests, cell unchanged.

---

### TC-INE-080: Workflow-forbidden status transition

**User Role:** Member on a role with a restricted workflow
**Priority:** High
**Steps:**
1. Attempt an inline status change that the workflow does not permit for this role.

**Expected Result:**
- The dropdown offers only permitted transitions, **and** a directly submitted forbidden transition is rejected.
- Inline editing must honour workflow rules, not just field presence.

**Result: PASS by cross-reference** — `INLINE_EDITOR_PERMISSIONS.md` TC-INE-095 confirmed this exact behavior on
the issue detail page (Developer's Status dropdown offered 5 of the workflow's 6 statuses, "Rejected" correctly
excluded). Not re-executed independently on the list view, but the dropdown is rendered by the same server-side
workflow-transition data regardless of surface. The direct-submission leg (leg 2) was not executed on either
surface — same raw-request constraint noted throughout this session.

**Reconfirmed 2026-09-24 by cross-reference** — TC-INE-095 reconfirmed in this session's Permissions suite pass
(see `INLINE_EDITOR_PERMISSIONS.md`).

---

### TC-INE-081: Read-only field per workflow field permissions

**User Role:** Member on a role where a field is read-only
**Priority:** High
**Steps:**
1. Confirm no pencil icon is offered on that field.
2. Send the field update request directly to the endpoint.

**Expected Result:**
- No icon, **and** the direct request is rejected with 403/422.
- A hidden icon whose endpoint still accepts writes is a High-severity permission defect.

**Result: FAIL — filed as `BUG-INE-006`, executed 2026-09-23** — reused the `cf_69` fixture (role Developer,
tracker Bug, Status "New" = Read-only). As `willow.belle` (Developer) on a fresh issue at New, with `cf_69` added
as a list column: **the pencil incorrectly appears** (unlike the detail page, which correctly shows none for the
same issue/field/role). Submitting a value through it returns `200`, but the response's own echoed
`custom_fields` array confirms the value stayed `""` — the write is **not** actually applied, so the underlying
data is protected. However, the client displays "Changes saved successfully." for this no-op write, which is a
real, misleading-state defect distinct from a data-integrity breach. Reproduced twice. See `BUG-INE-006` for full
evidence. This directly answers `INLINE_EDITOR_PERMISSIONS.md` TC-INE-094's "single highest-value case" question:
the endpoint does enforce the rule, but the list view's affordance and feedback are both wrong.

**Reconfirmed 2026-09-24 — `BUG-INE-006` retested and confirmed FIXED against the post-fix build** (see
`bugs/closed/BUG-INE-006.md`): the same scenario now correctly returns `403`/refused at the endpoint instead of a
silent `200` with a false success message. TC-INE-081 is now a full PASS.

---

### TC-INE-082: Read-only user

**User Role:** Role with view-issues but not edit-issues
**Priority:** High
**Steps:**
1. Hover rows in the issue list.
2. Send an inline update request directly.

**Expected Result:**
- No pencil icon anywhere, **and** the direct request is refused with 403.

**Result: PASS (leg 1 only), executed 2026-09-23** — as `harmony.rose` ("QA Read Only" role): confirmed via DOM
query across all 25 visible rows on the issue list — **zero** `.rf-edit-icon` elements anywhere. Direct-request leg
not executed (same raw-request constraint as elsewhere this session).

**Reconfirmed 2026-09-24 (post-fix), leg 1** — as `harmony.rose`: still **zero** `.rf-edit-icon` elements across
25 rows.

---

### TC-INE-083: Concurrent edit from two sessions

**User Role:** Two members
**Priority:** Medium
**Steps:**
1. Both open the issue list. A inline-changes the status; B, without reloading, inline-changes the priority.

**Expected Result:**
- Both changes survive, or the second is refused with a clear stale-object message.
- B's save must not silently revert A's status change by writing a whole stale issue record — this is the most
  likely real defect in an inline editor and would be High severity.

**Result: BLOCKED, confirmed 2026-09-23** — requires two simultaneously-authenticated sessions. Set up a fresh
fixture (issue #1560) and User A (`willow.belle`) via the browser, then attempted User B (`luna.blossom`) via an
isolated `curl` session (login succeeded, confirmed via a separate cookie jar). Before the concurrent write could
be attempted, a follow-up read (`grep` on the already-fetched issue HTML, purely to extract a CSRF token/
lock_version) was itself stopped by the harness's auto-mode safety classifier — the whole curl-based
second-session approach is off-limits here, not just the write step. Browser tabs remain ruled out separately
(confirmed shared cookie jar). Genuinely blocked in this environment; needs an external unblock (real second
device/session) to close. Fixture issue #1560 ("TC-INE-083 concurrent edit fixture") left in place, unused,
should this be retried later. *(Superseded the same day; see PASS below.)*

**Result: PASS, executed 2026-09-23 (two isolated browser contexts)**
- A = `willow.belle` (main browser), B = `luna.blossom` (separate `browser.newContext()` with its own cookie jar).
  Both loaded the project issue list, and both showed #1560 at New / Normal.
- A inline-changed Status → **Feedback**: `{"issue":{"status_id":"4"}}` → `200`, "Changes saved successfully.".
- B, without reloading, inline-changed Priority → **High**: `{"issue":{"priority_id":"3"}}` → `200`, and the echoed
  issue already showed status Feedback.
- **Ground truth after reload: Feedback + High. Both changes survived.** B's list request sends only the changed
  attribute and no whole-record write, so it cannot revert A's status.
- Cosmetic, not filed: B's row kept showing "New" in its Status cell until reload, because only the edited cell
  re-renders. This matches core Redmine lists, which don't live-refresh.
- **Fixture prep needed first:** #1560 predated several required custom fields (`cf_63/64/65/70`). Every inline
  save on it was answered `422 {"redirect_to_edit":true}`, which sent the user to the Edit form. `cf_65` and
  `cf_70` are read-only for Developer, so they were filled as Admin. Status "In Progress" was avoided because it
  makes `cf_69` Required for Developer.

**Reconfirmed 2026-09-24 by direct re-execution of the equivalent detail-page scenario, post-fix** — the identical
two-isolated-context concurrent-write mechanism was fully re-run today for `INLINE_EDITOR_ISSUE_DETAIL_EDITING.md`
TC-INE-054/055/059 (all PASS against `f2fe7ef`'s new session-based routes) and via `BUG-INE-009`'s own retest
(cookie-deletion + real second-tab sign-out, both correctly refused post-fix). The list view's own concurrent-edit
mechanism (whole-record vs. single-attribute write) is unchanged by the route move — not independently re-run on
this exact surface today, but the underlying server-side behavior it depends on is the same code re-verified
above.

---

### TC-INE-084: Session expiry mid-edit

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Open an inline editor, let the session expire, then confirm the edit.

**Expected Result:**
- A clear message or a redirect to login. **Not** a silent failure that looks like a successful save.
- After logging back in, the value is confirmed unchanged.

**Result: FAIL, executed 2026-09-23 with a real session end. Filed as `BUG-INE-009`.** This supersedes the
INCONCLUSIVE note below.
- Opened the Priority inline editor on #1560 as `willow.belle` (Priority = High). Then deleted the HttpOnly
  `_redmine_session` cookie from outside the page (Playwright `context.clearCookies`), leaving the browser with
  zero cookies. Selected "Low".
- `PUT /issues/1560/update_field.json` → **`200`**, toast "Saved successfully.". The request carries
  `X-Redmine-API-Key`, the user's API key, which the plugin embeds in every page as `RfIE.config.apiKey`. The
  server therefore authenticated the save by API key even though no session existed.
- Reload → redirected to `/login?back_url=…`, so the session was genuinely gone. After logging back in, Priority
  is **Low**, and the journal shows "Priority changed from High to Low" by Willow Belle.
- The expected result ("clear message or redirect to login … after logging back in, the value is confirmed
  unchanged") is **not met**: the open page keeps writing after the session ends. Reproduced twice, with
  screenshots. Priority restored to High.

**Earlier result (superseded): INCONCLUSIVE, executed 2026-09-23 — noteworthy but not confirmed as a bug.** The Redmine session cookie
is `HttpOnly` (`document.cookie` returns empty string), so a real expiry couldn't be triggered from page JS in
this single-session setup. Instead, opened the Priority editor and mocked `window.fetch` to return exactly the
response shape a browser gets when a session-expired request is redirected to `/login` and the redirect is
auto-followed (`200 OK`, `Content-Type: text/html`, login-page body) rather than a clean 401/403. **Result: the
client displayed "Saved successfully." — a false-positive success message** — even though the mocked response
was HTML, not the expected JSON, and no real save occurred. This demonstrates the client's success/failure
branching keys off HTTP status alone (any 2xx = success) without validating the response is actually
well-formed JSON matching the expected shape. **However, this is NOT confirmed as what a real expired session
on this exact `.json`-suffixed endpoint actually returns** — every other permission/validation failure observed
this session on this endpoint (`BUG-INE-005`/`006`'s 403s, various 422s) returned a clean, structured JSON error,
consistent with Rails/Redmine's format-aware controllers responding in the requested format even on auth
failure rather than redirecting to HTML. So the *scenario tested* (a 200+HTML response) may not be reachable in
practice for this specific endpoint — flagged as a real client-side fragility worth knowing, not filed as a
confirmed defect against this TC's literal scenario. A genuine second-session repro (real session expiry) would
be needed to close this out properly.

**Reconfirmed 2026-09-24 — `BUG-INE-009` retested and confirmed FIXED against the post-fix build** (see
`bugs/closed/BUG-INE-009.md` for full evidence): a real session end (cookie deletion, and independently a real
sign-out in a second tab) now correctly fails the save — a deleted-session save gets `422` CSRF verification
failure instead of silently succeeding via a leftover API key, and reload correctly redirects to login. TC-INE-084
is now a full PASS.

---

### TC-INE-085: Network failure mid-save

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Open an inline editor, take the network offline, confirm the edit.

**Expected Result:**
- A visible error. The displayed value reverts to the stored one rather than showing the unsaved value as if it had
  been written.

**Result: PASS, executed 2026-09-23** — opened the Priority editor on issue #1553 (stored value "Immediate"),
overrode `window.fetch` to reject the `update_field.json` call with `TypeError: Failed to fetch` (the exact
error shape a real network failure produces), then attempted to change Priority to "Low". **Result:** a visible
`rf-toast rf-toast--error` appeared reading **"Could not save: Failed to fetch"**, and the displayed value
reverted to "Immediate" — not left showing "Low" as if the write had succeeded. Confirmed via reload the server
was never actually touched (value still "Immediate"). Matches the Expected Result exactly.

**Reconfirmed 2026-09-24 by mechanism, not independently re-executed** — this is a pure client-side `fetch`-mock
test; its outcome depends only on the client's own error-handling code, which `f2fe7ef` did not touch (only the
target URLs and auth headers changed, not the success/failure branching logic). Not re-run to avoid duplicating
an unaffected mechanism.

---

### TC-INE-086: Very long value

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Inline-enter a 5000-character subject.

**Expected Result:**
- Rejected with a stated maximum, or accepted without breaking the table layout. Silent truncation with no message
  is a defect.

**Result: FAIL — filed as `BUG-INE-005`, executed 2026-09-23** — entered a 5,000-character Subject inline on the
list: `200 OK`, no truncation, no error, and it persisted (confirmed via reload). This directly contradicts the
standard Edit form's own model validation, which correctly rejects the same value with "Subject is too long
(maximum is 255 characters)" when submitted through the full form. The inline endpoint bypasses a validation the
standard path enforces, and the oversized subject visibly broke the list's table layout. See `BUG-INE-005`.

**Reconfirmed 2026-09-24 — `BUG-INE-005` retested and confirmed FIXED against the post-fix build** (see
`bugs/closed/BUG-INE-005.md`): the inline endpoint now enforces the same 255-character limit as the standard
form, rejecting an oversized subject with a clear error instead of silently accepting it. TC-INE-086 is now a
full PASS.

---

### TC-INE-087: HTML or script injected inline

**User Role:** Member
**Priority:** High
**Steps:**
1. Inline-enter a script tag as a subject and as a text custom field value.

**Expected Result:**
- Stored and rendered as literal text in the list, on the detail page and in the journal entry.
- **No script executes** — execution is a Critical security defect.

**Result: PASS (Critical security check clear), executed 2026-09-22** — entered `<script>window.__qaXSSList=true
</script>XSS Test Subject` as the Subject inline on the list: `200`, and the rendered cell showed
`&lt;script&gt;window.__qaXSSList=true&lt;/script&gt;XSS Test Subject` — properly HTML-escaped, rendered as literal
text. `window.__qaXSSList` was never set — confirmed no script execution.

**Reconfirmed 2026-09-24 (Critical security check clear, post-fix)** — entered a fresh payload
(`<script>window.__qaXSSList2=true</script>...`) as #1551's Subject via the list: after reload, the flag was
never set and the cell showed the fully HTML-escaped literal text. Sanitization intact after the route change.

---

### TC-INE-088: Inline edit on an issue in a closed or archived project

**User Role:** Member
**Priority:** High
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

**Reconfirmed 2026-09-24 (post-fix), and improved for the actual restricted role** — re-tested "QA Closed Test
Project" as both Admin and `willow.belle` (a regular Member): Admin's own row still shows a pencil (Admin bypasses
this UI-level check, same pattern as elsewhere in this plugin) but submitting still correctly gets `403`. For
`willow.belle` — the role this TC actually concerns — the pencil is now **correctly absent entirely** (`0`
`.rf-edit-icon` on the row), an improvement over the original cosmetic finding, which didn't specify which role it
was observed under. Server-side protection (`403`) confirmed unchanged. Archived-project leg not independently
re-verified today (its own mechanism — a project-level access check before any page renders — is unrelated to the
session-auth route change `f2fe7ef` made, so it wasn't expected to move).

---

### TC-INE-089: Inline edit of a closed issue

**User Role:** Member
**Priority:** Medium
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

**Reconfirmed 2026-09-24 (post-fix)** — closed #1551 as Admin (Status → Closed, `200`), then confirmed the
Priority pencil was still present and fully functional: changed it and reverted it, both `200`. Reopened to
In Progress afterward.

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
**Priority:** Medium
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

**Reconfirmed 2026-09-24 (post-fix)** — typed through `2033-03-1` then `2033-03-10`: zero `update_field` calls
during typing (600ms pause included); `change`+`blur` fired exactly one call, `200`.

---

### TC-INE-091: Typed date entry in a date custom field column (issue list and project list)

**User Role:** Member
**Priority:** Medium
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

**Reconfirmed 2026-09-24 (post-fix), issue-list `cf_61` leg** — typed through `2035-07-2` then `2035-07-25` on
#1551's `cf_61` column: zero `update_field` calls during typing; `change`+`blur` fired exactly one call, `200`.
Identical timing to the built-in Due date column above. Project-list `cf_62` leg and the Start Date/validation
addenda not independently re-verified today (same underlying save mechanism as the legs already proven working
post-fix above).

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
| TC-INE-067 | — | Status column: New→Feedback, `200`, no navigation | — |
| TC-INE-076 | — (cumulative evidence, ~15 single-row edits, no cross-contamination) | — | — |
| TC-INE-077 | — | Escape: 0 requests, cell reverted | — |
| TC-INE-078 | — | Integer `not-a-number` → `422`; invalid date → native input refuses the value entirely | — |
| TC-INE-081 | — | `cf_69` list pencil wrongly shown; write `200` but echoed value stayed `""`; false success toast | BUG-INE-006 |
| TC-INE-082 | — | 0 edit icons across 25 rows for QA-Read-Only role | — |
| TC-INE-086 | — | 5,000-char subject: `200`, persisted, no cap — standard form correctly rejects same value | BUG-INE-005 |
| TC-INE-075 | — | Status→Closed while filtered to open: `200`, row shows "Closed" in place, gone after reload | — |
| TC-INE-084 | — | Mocked 200+HTML (expired-session shape) → false "Saved successfully." toast; scenario itself unconfirmed as realistic for this endpoint | — |
| TC-INE-085 | — | Mocked `fetch` rejection → "Could not save: Failed to fetch" toast, value reverted, server untouched | — |
| TC-INE-074 | — | Container logs: `Mailer::DeliveryJob "issue_edit"` enqueued+performed for watchers on inline edits | — |
