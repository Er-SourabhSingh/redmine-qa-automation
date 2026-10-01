# Test Cases — Redmineflux Platform — Security

> Source: `SENIOR_QA_STANDARDS.md` §28 (Security Testing Approach — mandatory every plugin, every cycle). Added 2026-10-01.
>
> Requires `PLATFORM_INSTALLATION_AND_UPGRADE.md` TC-PLT-021 PASS. Several TCs below were written after reading the plugin's actual source (`organization.rb`, `contact.rb`, `entities_controller.rb`, `searchable.rb`, and the Overview/Holiday-Calendar views) rather than assumed from the feature list — each cites the exact mechanism it is verifying, per `feedback_verify_bug_claims_against_source_docs`.
>
> **EXECUTED 2026-10-01 — TC-PLT-210 through TC-PLT-222, all except TC-PLT-221.** One Critical bug found (`BUG-PLT-027`, confirmed stored XSS) and one Low documentation-accuracy bug (`BUG-PLT-028`). See each TC below for its own Status line.

## Plugin
- Name: redmineflux_platform
- Version: `redmineflux_platform` branch, HEAD
- Redmine version: 6 (`redmine-docker-6-platform`, `localhost:3013`, post-upgrade)
- Path: plugins/redmineflux_platform_qa

---

## Security Cases — Authentication & Authorization

---

### TC-PLT-210: Authentication required on every Platform route, not just a sample

**User Role:** Anonymous.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. While logged out, directly navigate to every Platform URL, not just the 3 sampled in TC-PLT-136: `/redmineflux_platform`, `/redmineflux_platform/teams`, `/redmineflux_platform/teams/new`, `/redmineflux_platform/list/holiday_schemes`, `/redmineflux_platform/list/holidays`, `/redmineflux_platform/list/leave_types`, `/redmineflux_platform/list/leaves`, `/redmineflux_platform/list/organizations`, `/redmineflux_platform/list/organizations/1/edit`, `/redmineflux_platform/list/contacts`, `/redmineflux_platform/list/audit_events`, `/settings/plugin/redmineflux_platform`.
2. Also try a `new`/`edit`/`show` URL for at least one record ID per entity, not just each entity's bare list URL.

**Expected Result:**
- Every single URL redirects cleanly to `/login?back_url=...` — no partial page render, no 200, no leaked data in the redirect response body.

**Status:** **EXECUTED 2026-10-01 — PASS.** All 12 listed URLs plus 2 additional edit URLs (`/list/holidays/1/edit`, `/list/contacts/1/edit`) redirected cleanly to `/login?back_url=...` while logged out. No 200, no partial render.

---

### TC-PLT-211: Authorization is enforced at the mutation endpoint itself, not only the form/button

**User Role:** A role with `view_rf_platform` + `view_rf_platform_teams` but **not** `manage_rf_platform_teams` (reuse `PLT-QA-TeamsViewOnly` / `daisy.skye` from the Permissions suite).
**Precondition:** `PLATFORM_PERMISSIONS_AND_ACCESS.md` TC-PLT-138 PASS (role already exists).

**Steps:**
1. Confirm (as already known from TC-PLT-141) that `/redmineflux_platform/teams/new` and `/redmineflux_platform/teams/<id>/edit` both 403 for this user.
2. This TC goes one step further: send the actual mutation requests directly — a POST to the teams create endpoint, a PATCH/PUT to an existing team's update endpoint, and a DELETE to an existing team's destroy endpoint — **as this user's authenticated session**, bypassing the UI form entirely (e.g. via a authenticated fetch/XHR from the browser console, or a second tab with the request crafted by hand). Do not use a raw unauthenticated `fetch()` for this — per `feedback_avoid_raw_fetch_json_endpoint_tests`, drive it from within the logged-in session to avoid the native Basic-Auth-popup risk on a 401 path.
3. Repeat for one other entity's shared `EntitiesController` mutation routes (e.g. Holiday Schemes) using the equivalent view-only role.

**Expected Result:**
- All 3 mutation attempts (create/update/destroy) are rejected server-side (403) even though the request was correctly authenticated and reached the real endpoint — confirming the authorization check lives in the controller action itself (`require_writable`/`manage?`), not merely in which links the view happens to render.

**Status:** **EXECUTED 2026-10-01 — PASS (Create/Update leg); Destroy leg not executed, tooling-blocked.**
- **Role correction found first:** `PLT-QA-TeamsViewOnly` / daisy.skye (this TC's originally-cited role) was confirmed via `/roles/6/edit` to now also have `manage_rf_platform_teams` — it was genuinely view-only when TC-138 first created it, but TC-139 deliberately added manage to the same role afterward, and the role was never re-split. Used `PLT-QA-ViewOnlyNoManage` / opal.sparrow instead (confirmed genuinely `view_rf_platform` + `view_rf_platform_teams` only, no manage) for the Teams leg. For the Holiday Schemes leg, `PLT-QA-SchemesOnly` / briar.sunset had the same drift (manage already present) — temporarily unchecked "Create, edit and delete holiday schemes" on that role, ran the check, then re-checked it immediately after (confirmed restored).
- Disposable fixtures created for this test only (not used by any other suite): Team `PLT-SEC-MutationTest-Team` (id 18), Holiday Scheme `PLT-SEC-MutationTest-Scheme` (id 28).
- **Create + Update, both entities:** authenticated `fetch()` POST/PATCH from within the logged-in low-privilege session (per `feedback_avoid_raw_fetch_json_endpoint_tests`, not a raw unauthenticated call) — all 4 calls (Teams create, Teams update, Holiday Schemes create, Holiday Schemes update) returned `403`. Verified as Admin afterward that the target team's name was genuinely unchanged (update really rejected, not silently applied with a wrong status code).
- **Destroy leg not executed**: the session's own auto-mode tool-safety classifier refuses a DELETE call issued via `browser_evaluate`, and the Delete button itself isn't present in the DOM for a view-only role (nothing to click). Per this repo's own `feedback_avoid_evaluate_for_destructive_actions` rule, deferred rather than worked around. Given Create and Update are both correctly enforced at the controller level on the same `EntitiesController` base, Destroy is very likely consistent — but this is not confirmed live and should be picked up in a future session with a safe method (e.g. a lower-privilege Playwright automation suite run outside this classifier's scope).

---

## Security Cases — Private-Record Visibility (Organizations & Contacts)

> Confirmed from source (`organization.rb`/`contact.rb`): the `visible` scope and `visible?` method both resolve as — admin sees everything; otherwise a record is visible only if `is_private` is false, or the current user is the owner (`created_by`/`author_id`) or the assignee (`assigned_to_id`). `entities_controller.rb`'s `find_record` deliberately 404s (not 403) a record outside this scope, "whether it exists at all is part of what is private about it."

### TC-PLT-212: A private Organization/Contact is excluded from the list for a non-owner, non-admin, non-assignee user

**User Role:** A non-admin user who is neither the creator nor the assignee of the target record (e.g. any seed user not used to create the fixture below).
**Precondition:** An Organization and a Contact both exist with "Mark as Private" checked, created/assigned to a different user than the one testing.

**Steps:**
1. As Admin, create an Organization and a Contact, both with "Mark as Private" checked and "Assigned To" set to some third user (not Admin, not the user who will test step 2).
2. Log in as a non-admin, non-owner, non-assignee user with `view_rf_platform_organizations`/`view_rf_platform_contacts`. Open the Organizations and Contacts lists.

**Expected Result:**
- Neither private record appears in the list for this user — the total count and visible rows both exclude them, not just a visual "private" badge on an otherwise-visible row.

**Status:** **EXECUTED 2026-10-01 — PASS.** Created private Organization (`PLT-SEC-Private-Org`, id 7) and private Contact (`PLT-SEC-Private Contact`, id 3), both assigned to Willow Belle. As luna.meadow (Organizations view-only, not owner/assignee), the Organizations list count read "1" (just `PLT-BASELINE-Acme Corp`) with the private record absent from both the row list and the total count. As marigold.rayne (Contacts view-only, not owner/assignee), same result on the Contacts list.

---

### TC-PLT-213: A private Organization/Contact's direct-URL-by-ID access 404s for a non-owner, non-admin, non-assignee user

**User Role:** Same as TC-PLT-212.
**Precondition:** TC-PLT-212's fixtures exist; note their record IDs.

**Steps:**
1. As the same non-owner/non-assignee user from TC-PLT-212, navigate directly to the private Organization's and private Contact's detail/edit URLs by ID (e.g. `/redmineflux_platform/list/organizations/<id>`, `/redmineflux_platform/list/organizations/<id>/edit`).

**Expected Result:**
- Both return a genuine 404, not a 403 and not a 200 with the record's data. Per the source comment this is deliberate: a 403 would itself leak that *something* exists at that ID; 404 doesn't.

**Status:** **EXECUTED 2026-10-01 — PASS.** As luna.meadow, `/list/organizations/7` and `/list/organizations/7/edit` both returned genuine `404 Not Found` (confirmed via Playwright's own HTTP status, not just page text). As marigold.rayne, `/list/contacts/3` likewise returned `404`. No 403, no 200 with data, in either case.

---

### TC-PLT-214: The record's owner or assignee can see their own private record without admin or manage permission

**User Role:** The user set as "Assigned To" on TC-PLT-212's fixtures, holding only `view_rf_platform_organizations`/`view_rf_platform_contacts` (no manage, not admin).
**Precondition:** TC-PLT-212's fixtures exist.

**Steps:**
1. Log in as the assignee user. Open the Organizations/Contacts list, then the private record's own detail page by ID.

**Expected Result:**
- The private record appears in this user's list and its detail page opens normally (200), confirming the assignee carve-out works, not just the admin one.

**Status:** **EXECUTED 2026-10-01 — PASS, with a documentation gap found (`BUG-PLT-028`).** Reassigned the TC-PLT-212 fixtures' "Assigned To" to luna.meadow (Organization) and marigold.rayne (Contact) — both already-confirmed view-only, non-manage, non-admin roles — to cleanly isolate the assignee carve-out from any manage-permission effect. As luna.meadow: Organization detail page returned `200` and the record appeared in her list. As marigold.rayne: Contact detail page returned `200`. The carve-out works exactly as the source predicted. **However**, the "Mark as Private" checkbox's own helper text ("A private record is visible only to you and to administrators.") never mentions this assignee exception — filed as `BUG-PLT-028` (Low) since a user could be misled about who can actually see a record they've marked private.

---

### TC-PLT-215: Admin sees every private record regardless of owner/assignee

**User Role:** Admin.
**Precondition:** TC-PLT-212's fixtures exist, owned/assigned to a non-admin user.

**Steps:**
1. Log in as Admin. Open the Organizations/Contacts lists and the private records' detail pages directly.

**Expected Result:**
- Both private records are fully visible to Admin, confirming the scope's `admin? → all` branch, matching the UI's own stated promise ("visible only to you and to administrators").

**Status:** **EXECUTED 2026-10-01 — PASS.** As Admin, both `/list/organizations/7` and `/list/contacts/3` returned `200` with full record data, regardless of who owned/was assigned them.

---

## Security Cases — Input Sanitization

### TC-PLT-216: Script/HTML in Name, Notes, and Reason fields renders as literal text everywhere, never executes

**User Role:** Admin (or any role with manage permission on the entity under test).
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Create or edit a record on at least 3 different entities (e.g. a Team name, an Organization's Notes field, a Leave's Reason field) using a payload like `<script>alert('xss')</script>` and `"><img src=x onerror=alert(1)>`.
2. View the record on every surface that renders that field: the list screen, the detail/edit screen, and (where applicable) the Audit trail's label for that record.

**Expected Result:**
- The payload renders as inert, visible literal text (e.g. the raw `<script>...` string shown on-page) on every surface — never executes as script, never alters the page's DOM/structure.

**Status:** **EXECUTED 2026-10-01 — PASS across all 3 entities tested (Team name, Organization Notes, Leave Reason) plus the Audit trail.** Created: Team `PLT-SEC-XSS-Team-<script>alert('xss')</script>` (id 19), Organization `PLT-SEC-XSS-Org` (id 8) with Notes = `"><img src=x onerror=alert(1)>`, Leave with Reason = `<script>alert('xss-reason')</script>` (id 17). Every surface checked (detail page, list page, Audit Events page) rendered the payload as HTML-escaped literal text (`&lt;script&gt;` / `&lt;img`) — confirmed via `innerHTML` inspection, not just a screenshot read. Zero console errors, zero alert dialogs, zero raw unescaped tags found anywhere for these 3 fields.

---

### TC-PLT-217: The Tags field's chip rendering does not execute injected markup

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS; TC-PLT-134 PASS (tags chip control confirmed working for normal input).

**Steps:**
1. On an Organization or Contact's Tags field, add a tag containing `<img src=x onerror=alert(1)>` or `"><script>alert(1)</script>` via Enter.
2. Save the record, reload the page, and re-open the edit form.

**Expected Result:**
- The tag renders as a literal-text chip (the raw string visible, including the angle brackets), never executes, and the chip's own `×` remove button and label rendering are not broken by the payload.

**Status:** **EXECUTED 2026-10-01 — PASS.** Added tag `<img src=x onerror=alert(1)>` to Organization id 8 via Enter. Rendered immediately as a literal-text chip (confirmed `innerHTML` shows the raw string, no `<img>` element created, `suspiciousImgFound: false`), with a correctly-labeled `Remove <img src=x onerror=alert(1)>` button. Saved, reloaded, re-opened the edit form — chip persisted identically as literal text after a full round-trip, zero console errors throughout.

---

### TC-PLT-218: Suspected stored-XSS — unescaped `title=` attribute interpolation in Overview/Holiday-Calendar views

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Confirmed from source first: `app/views/redmineflux_platform/overview/index.html.erb` and `app/views/redmineflux_platform/shared/_holiday_calendar.html.erb` both build a tag attribute as `" title=#{names.inspect}".html_safe` (or `holidays.map(&:name).join(', ').inspect`) — using Ruby's `#inspect` (which escapes for Ruby string-literal syntax, e.g. `\"`) rather than HTML-escaping (`<`, `>`, `&` are left completely untouched), then marks the whole interpolated string `html_safe` and inserts it directly into an HTML tag's attribute list, with no surrounding quotes supplied by the ERB template itself.
2. Create a Holiday (or a Team membership feeding the Overview's "names" list) whose Name contains a `>` character followed by executable markup, e.g. `PLT-SEC-Holiday"><script>alert(1)</script>`.
3. Load the Redmineflux Platform Overview page (`/redmineflux_platform`) and/or any screen rendering the Holiday Calendar widget for the scheme containing this holiday, for a date range that includes it (so the calendar's day cell actually renders this holiday's name into the `title=` attribute).

**Expected Result:**
- The holiday name should render as inert text wherever it's shown (including inside any tooltip/title), with no ability to break out of the attribute or inject executable markup into the page.

**What to watch for (per the source finding above):** if the name contains `>`, it may terminate the attribute (and potentially the tag) early, since there is no quote character delimiting the attribute value in the template — confirm live whether this is actually exploitable (view-source / inspect the rendered HTML around the calendar day cell) before concluding either way. If it reproduces, file it as a confirmed stored-XSS bug citing these exact 2 view files and line numbers.

**Status:** **EXECUTED 2026-10-01 — FAIL. Confirmed real, live stored XSS — filed as `BUG-PLT-027` (Critical).** Created Holiday `PLT-SEC-Holiday"><script>alert(1)</script>` (id 9) on the active Holiday Scheme, dated 2026-10-15. Loading `/redmineflux_platform` fired a genuine `alert(1)` JS dialog with **zero user interaction** beyond navigating to the page — confirmed via `browser_handle_dialog`, and via `document.documentElement.outerHTML` showing a real `<script>` element (not escaped text) injected as a sibling inside the calendar day cell's `div`. Root cause confirmed from source exactly as predicted: `#inspect` escapes only Ruby string-literal syntax (`"` → `\"`), never HTML; a literal `"` in the holiday name terminates the `title=` attribute early at the browser's HTML parser level (backslash is not an HTML attribute escape), and everything after becomes live markup. Toggling the holiday's own "Active" flag off did **not** stop it firing (the calendar lookup isn't active-filtered) — had to edit the Name field itself to a safe string to stop it disrupting any other concurrent session on this shared environment. See `BUG-PLT-027` for full detail, evidence, and the exact 2 vulnerable call sites (both `overview/index.html.erb:118` and the shared `_holiday_calendar.html.erb:40` use the identical unsafe pattern).

---

## Security Cases — Query Safety & Direct Object Reference

### TC-PLT-219: SQL-meta-characters in search fields are safely parameterized

**User Role:** Admin or any view-permission role.
**Precondition:** TC-PLT-021 PASS. TC-PLT-114 PASS (`%` already confirmed literal, not a wildcard).

**Steps:**
1. On any searchable entity's list (e.g. Organizations), search for strings containing SQL meta-characters and classic injection probes: `'`, `--`, `' OR '1'='1`, `'; DROP TABLE rf_organizations; --`.

**Expected Result:**
- Each search returns a normal "no matches" result (or a correct literal match, if the string happens to exist) with no server error, no SQL error leaked to the page, and no unintended rows returned — consistent with the `Searchable` concern's confirmed use of `ActiveRecord::Base.sanitize_sql_like` and parameterized `?` placeholders throughout the visibility scopes.

**Status:** **EXECUTED 2026-10-01 — PASS.** Searched Organizations for `' OR '1'='1` and `'; DROP TABLE rf_organizations; --`. Both returned a clean "0 results" page, no server error, no SQL error text. Confirmed the `rf_organizations` table was genuinely untouched afterward (normal search returned all 3 real organizations again).

---

### TC-PLT-220: Sequential/guessable ID sweep does not leak data outside a low-privilege user's granted scope

**User Role:** A low-privilege role (e.g. `PLT-QA-OrgsOnly` from the Permissions suite — view-only on Organizations, nothing else).
**Precondition:** `PLATFORM_PERMISSIONS_AND_ACCESS.md` TC-PLT-208 PASS (role exists). At least one private Organization exists (TC-PLT-212's fixture) belonging to a different user, plus several ordinary (non-private) Organizations.

**Steps:**
1. As this user, iterate Organization detail/edit URLs across a small contiguous ID range covering both ordinary and the private fixture's ID (e.g. ids 1 through the private fixture's id + 1).
2. Also attempt the equivalent sweep against an entity this role has **no** permission on at all (e.g. Teams), using a range of known-existing Team IDs.

**Expected Result:**
- Ordinary Organizations in range: viewable (expected, matches the granted permission). The private Organization's ID: 404 (per TC-PLT-213). Every Team ID: 403 (no permission on that entity at all) — the three outcomes are each individually correct and consistently differentiated, with no ID in the sweep returning another user's or another entity's data by coincidence or off-by-one.

**Status:** **EXECUTED 2026-10-01 — PASS.** Since TC-PLT-214 reassigned org id 7 to luna.meadow herself (making it legitimately hers to see), created a fresh private Organization (`PLT-SEC-Private-Org-2-OtherUser`, id 9) assigned to Willow Belle to keep this sweep's intent intact. Swept org ids 1–9 as luna.meadow: id 1 (ordinary) → 200, id 7 (her own, now-private-but-hers) → 200, id 8 (ordinary) → 200, id 9 (someone else's private org) → **404**, ids 2–6 (non-existent) → 404. Swept team ids 1/7/8/9 (no permission at all on Teams) → 403 on all four. Every outcome individually correct, no coincidental leak.

---

## Security Cases — Session Handling

### TC-PLT-221: An invalidated session is rejected on the very next request, not silently honored

**User Role:** Any authenticated role.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Log in as a normal user and open a Platform list screen successfully.
2. Invalidate the session from the server side without that browser tab doing anything itself — e.g. as Admin, go to Administration → Users → that user → "Sign out" (forces session invalidation), or delete the session's `tokens`/`sessions` row directly if Redmine exposes no UI control for it.
3. Back in the original tab, perform another action (reload the list, or submit a form that was already open).

**Expected Result:**
- The next request after invalidation is rejected and redirected to login — it does not silently complete using a now-revoked session, and no stale page continues to allow further mutations.

**Status:** **BLOCKED this session — not a plugin issue, a tooling limitation.** This TC genuinely needs two *independent* concurrent browser sessions (one staying logged in as the normal user while a separate Admin session revokes it). The single Playwright MCP browser connection available this session shares one cookie jar across every tab in its context — logging in as Admin in a second tab overwrites the *same* shared session cookie used by the first tab (they are not independent), so there is no way to preserve the original user's live session cookie and then test it against a server-side revocation. Session cookies are also `HttpOnly`, so they cannot be read/saved/restored via `browser_evaluate` either. Recommend retesting in a future session using either two separate Playwright MCP server instances (different browser profiles) or a manual two-browser-window pass. Not marked PASS or FAIL — genuinely not executed.

---

## Security Cases — Out-of-Scope Surfaces (explicitly checked, not assumed)

### TC-PLT-222: File upload and rate-limiting — confirmed Not Applicable to this plugin's own surface

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Sweep every create/edit form across all 7 entities (Team, Holiday Scheme, Holiday, Leave Type, Leaves, Organizations, Contacts) plus Audit Events and Settings, confirming none of them has a file/attachment upload field of its own.
2. Confirm Platform exposes no public, unauthenticated, or share-token-style endpoint of its own (unlike, e.g., a public share-link feature) that rate-limiting/brute-force protection would meaningfully apply to.

**Expected Result:**
- No file-upload field exists anywhere in Platform's own 7 entities (file-upload testing is therefore Not Applicable here, not silently skipped) and no public/unauthenticated endpoint of Platform's own exists for rate-limiting to apply to (that surface is Redmine core's login/session handling, already covered by TC-PLT-210/221, not a Platform-specific gap).

**Status:** **EXECUTED 2026-10-01 — PASS / Confirmed N/A.** No `input[type=file]` found on any create/edit form inspected this session: Team, Organization, Contact, Holiday Scheme, Holiday, Leave Type, Leave. TC-PLT-210 already confirms every Platform URL requires authentication (no public endpoint of Platform's own exists), so the rate-limiting question is Redmine core's concern, not Platform's.

---

## Evidence Map

- Case ID: TC-PLT-210 … TC-PLT-222 — 12 of 13 executed 2026-10-01 (TC-PLT-221 blocked, tooling limitation — see its own Status)
- Screenshot: `screenshots/BUG-PLT-027/`, `screenshots/BUG-PLT-028/` (bugs only, per this repo's screenshot rule)
- Log: —
- Bug reference: `BUG-PLT-027` (Critical, confirmed stored XSS, TC-PLT-218), `BUG-PLT-028` (Low, documentation accuracy, TC-PLT-214)
