# Test Cases — Redmineflux Helpdesk — Features 52–53: Permissions

> Source: `docs/HELPDESK_FEATURES_LIST.md` #52–53 (category J). Grounded in `docs/HELPDESK_USER_GUIDE.md` §20 (Permissions) and tester checklist §26 group U.
>
> Many individual permission checks already exist scattered across other suites (each testing the one permission it happened to need): `view_helpdesk`/`manage_helpdesk` tab visibility (`HELPDESK_TICKET_LIFECYCLE.md` TC-HLP-385, `HELPDESK_NAVIGATION_WORKSPACES.md` TC-HLP-160), `export_helpdesk_reports` (`HELPDESK_REPORTING_AUTOMATION.md` TC-HLP-277), the three KB permissions (`HELPDESK_CONTENT_TEMPLATES.md` TC-HLP-029–176), admin-only email config (`HELPDESK_EMAIL.md` TC-HLP-080) and admin-only Swagger (`HELPDESK_REPORTING_AUTOMATION.md` TC-HLP-280), and `log_time` gating the time-log block (`HELPDESK_TICKET_LIFECYCLE.md` TC-HLP-389). This suite does not repeat those — it adds a systematic, deliberate pass across the full permission matrix, plus one contradiction this pass caught.

## ⚠ Known documentation contradiction — resolve by testing, not by assumption

`HELPDESK_USER_GUIDE.md` §20's own permission table says: *"`manage_helpdesk` | Everything in view, plus managing the desk's configuration **and exporting reports**"* — read literally, `manage_helpdesk` alone grants export.

But `export_helpdesk_reports` is listed as its own distinct permission in the same table, and the tester checklist (§26 group U) says *"`export_helpdesk_reports` controls the Export button"* — implying it's required independently of `manage_helpdesk`.

**TC-HLP-165** below exists to determine the real, tested behavior. Once run, update `HELPDESK_REQUIREMENTS.md`'s Permissions Matrix and `HELPDESK_MEMORY.md` with the confirmed answer.

## Plugin
- Name: redmineflux_helpdesk
- Version: (fill from environment)
- Redmine version: (fill from environment)
- Path: plugins/redmineflux_helpdesk_qa

---

## Positive Cases

---

### TC-HLP-166: `view_helpdesk` alone grants full visibility and ticket create/edit

**User Role:** Role granted `view_helpdesk` only (no `manage_helpdesk`)
**Priority:** High
**Precondition:** Role is a member of a helpdesk-enabled project.

**Steps:**
1. Sign in and open the Helpdesk tab
2. View tickets, reports, SLAs, customers, etc.
3. Create a new ticket and edit an existing one

**Expected Result:**
- All helpdesk screens are visible
- Ticket creation and editing succeed

- **CONFIRMED LIVE 2026-09-07** (Local, redmine-docker-6, luna.blossom — Agent role, `view_helpdesk` only): **PASS, with a documented nuance.** Signed in, clicked through Projects → Helpdesk QA Alpha → Helpdesk tab: reachable, but only **3 of the 6** project-level helpdesk sub-tabs render for this permission tier — Dashboard, Tickets, Knowledgebase. SLA/Organization/Settings are absent (this is the plugin's already-documented two-tier Agent model from `HELPDESK_NAVIGATION_WORKSPACES.md`'s TC-274/275 pass, not a new finding — "all helpdesk screens visible" holds for the screens `view_helpdesk` is documented to grant, not literally every screen in the plugin). Created ticket #54 ("TC-HLP-166 view_helpdesk-only agent create-ticket test") via New issue — succeeded, "Successful creation." Opened #54, clicked Edit, changed Subject to add "(edited)", Submit — succeeded, title updated immediately. Both creation and editing confirmed working for this role.

---

### TC-HLP-167: `manage_helpdesk` grants desk configuration management

**User Role:** Role granted `manage_helpdesk`
**Priority:** High
**Precondition:** None.

**Steps:**
1. Create/edit an SLA
2. Create/edit a support level
3. Create/edit an organization, a product, a canned response, and a holiday

**Expected Result:**
- Every configuration action succeeds

- **CONFIRMED LIVE 2026-09-07** (Local, redmine-docker-6, manage.helpdesk.test — custom role "Agent ManageHelpdesk Test", `manage_helpdesk` granted, confirmed clean of `export_helpdesk_reports`/`manage_prepaid_support_hours` via the role's own Edit page): **PASS on 5 of 6 actions, FAIL on the 6th — filed as BUG-HLP-039.** Created: SLA "TC-HLP-167 Permission Test SLA" (succeeded), Support Level "TC-HLP-167 Permission Test Level" (succeeded, after adding a required Support Assignee), Organization "TC-HLP-167 Permission Test Org" (succeeded), Product "TC-HLP-167 Permission Test Product" (succeeded), Holiday "TC-HLP-167 Permission Test Holiday" (succeeded) — all five confirmed via "Successful creation." flashes and/or list verification. **Canned Response creation was refused with a genuine 403 Forbidden** ("You are not authorized to access this page.") for this same `manage_helpdesk`-holding, non-admin user. Root-caused via source: `RfCannedResponsesController` has `before_action :require_admin, except: [:process_macros]` on every action — a hardcoded admin-only gate with no `manage_helpdesk` fallback at all, unlike its five siblings tested here. This directly contradicts `HELPDESK_REQUIREMENTS.md` line 40's own Permissions Matrix, which explicitly lists canned responses as `manage_helpdesk`-grantable alongside the other five. Filed as **BUG-HLP-039** (Medium).

---

### TC-HLP-168: `manage_helpdesk` + `manage_prepaid_support_hours` together grant full prepaid-hours control

> **Permission model, clarified 2026-09-07** (supersedes this TC's original framing, which tested `manage_prepaid_support_hours` in isolation without `manage_helpdesk` and treated the resulting block as a bug — see BUG-HLP-040's Closed section): **`manage_helpdesk` is required to access the Organization management area. `manage_prepaid_support_hours` is required, in addition to `manage_helpdesk`, to modify prepaid support hours.** `manage_prepaid_support_hours` is not a standalone, `manage_helpdesk`-independent permission — it is an additive grant on top of `manage_helpdesk`, matching how the write path's own permission check (confirmed via source) is layered on top of the page-access check, not a substitute for it. Do not treat "`manage_prepaid_support_hours` without `manage_helpdesk` can't reach the Organization page" as a functional failure — that combination is intentionally never usable, by design.

**User Role:** Role granted `view_helpdesk` + `manage_helpdesk` + `manage_prepaid_support_hours`
**Priority:** High
**Precondition:** An organization with a prepaid budget on a project.

**Steps:**
1. Open the Organization page for that organization.
2. Add/top up prepaid hours.
3. Change the "When hours run out" mode.
4. Reload the page (a genuine server round-trip, not just re-reading the DOM) and re-check both values.

**Expected Result:**
- The Organization page opens normally.
- The top-up succeeds and the Approved/Remaining totals update.
- The run-out mode change succeeds.
- Both changes persist after the reload — this is a real, saved server-side state change, not a client-side-only update.

CONFIRMED LIVE 2026-09-07 (Local, redmine-docker-6, `perm.test.agent` — custom role "Permission Test Role" reconfigured to hold exactly `view_helpdesk`+`manage_helpdesk`+`manage_prepaid_support_hours`): **PASS on all four steps.** Opened `/projects/helpdesk-qa-alpha/helpdesk/organization` → list loaded normally → clicked into "Alpha Minimal Fields Test Org" → Overview tab showed "9.92h Prepaid remaining" → Prepaid Support Hours tab showed both the "Add / top up hours" link and a real editable `<select>` for "When hours run out" (not plain text). Clicked "Add / top up hours" → filled Hours=`1`, Comment="TC-HLP-168 positive-case retest..." → Save → flash "Prepaid support hours for 'Alpha Minimal Fields Test Org' have been updated.", Approved 14.75h→**15.75h**, Remaining 9.92h→**10.92h**, new ledger row attributed to "Perm TestAgent". Changed "When hours run out" from No limit → Soft — allow overage → flash `'Alpha Minimal Fields Test Org' on 'Helpdesk QA Alpha': Soft — allow overage.` Navigated fresh to `/rf_organizations/8?tab=prepaid_support_hours` (full page reload, new request) → confirmed via DOM: `<select>` value is `soft`, Approved still `15.75h`, Remaining still `10.92h` — both changes are genuine, persisted server-side state, not stale client rendering.

---

### TC-HLP-169: All three Knowledgebase permissions together grant full KB CRUD

**User Role:** Role granted `add_kb_page`, `edit_kb_page`, and `delete_kb_page` together
**Priority:** High
**Precondition:** None.

**Steps:**
1. Create, then edit, then delete a Knowledgebase article

**Expected Result:**
- All three actions succeed — consolidated confirmation of the individually-gated checks in `HELPDESK_CONTENT_TEMPLATES.md`

CONFIRMED LIVE 2026-09-07 (Local, custom role "Permission Test Role" holding `add_kb_page`+`edit_kb_page`+`delete_kb_page` together, plus `view_helpdesk`/`manage_helpdesk`/`export_helpdesk_reports`/`manage_prepaid_support_hours` from TC-213/214): PASS. As `perm.test.agent`, navigated Helpdesk QA Alpha project → Knowledgebase tab. Clicked the "Add Article" control (`#add-space`, tooltip "Add Article") → New Article modal → entered title "TC-HLP-169 Permission Test KB Article" → Save → article created (`?page_id=1`), edit pencil icon present on the title. Clicked into the Editor.js content block and typed "Edited content for TC-HLP-169 permission test." → content accepted and saved via the Save-Page icon (page's own "Saved" indicator confirmed). Clicked the Delete (trash) icon → "Delete Page?" confirmation modal appeared → confirmed Delete → redirected back to the Knowledgebase list with the article gone (URL lost `?page_id=1`). All three CRUD actions succeeded end-to-end with no permission errors, confirming the three KB permissions compose correctly when granted together.

---

## Negative Cases

---

### TC-HLP-170: Neither `view_helpdesk` nor `manage_helpdesk` — no access at all (canonical reference)

**User Role:** Role with neither permission on any project
**Priority:** High
**Precondition:** None.

**Steps:**
1. Sign in, look for the Helpdesk tab/menu entry
2. Attempt to navigate directly to a helpdesk URL

**Expected Result:**
- Tab/menu entry absent; direct URL access refused
- (This is the canonical, deliberate version of the same check made incidentally in TC-HLP-385 and TC-HLP-160)

CONFIRMED LIVE 2026-09-07 (Local, `zero.perm.user` — zero project memberships anywhere, no helpdesk permission): PASS with one known, already-tracked exception. Top menu: no "Helpdesk Command Center" entry (confirmed via snapshot). Direct URL checks: `/issues/54` (a real Helpdesk QA Alpha ticket) → genuine `403 Forbidden`; `/rf_helpdesk/reports/tickets` → genuine `403 Forbidden`; `/rf_helpdesk/issues` (ticket list) → loads but correctly scoped, shows "0 tickets"/"No tickets yet" (not a leak). **Exception**: `/helpdesk` (the global Helpdesk Command Center dashboard) itself loads with a 200 and its "Recent Tickets" panel shows real ticket subjects/project/priority/status/assignee/SLA-status/created-date from Helpdesk QA Alpha, despite the user having zero access anywhere else — this is **BUG-HLP-029** (already open, filed in an earlier session, root-caused to the dashboard's `Issue.where(project_id: ...)` query missing a `.visible(User.current)` scope), and it still reproduces identically today. Not filed as a new bug — this TC's execution independently reconfirms BUG-HLP-029 rather than finding something new.

---

### TC-HLP-171: `view_helpdesk` only cannot manage desk configuration

**User Role:** Role granted `view_helpdesk`, explicitly **not** `manage_helpdesk`
**Priority:** High
**Precondition:** None.

**Steps:**
1. Attempt to create/edit an SLA, a support level, an organization, a product, a canned response, and a holiday

**Expected Result:**
- Every configuration-management action is refused or hidden — view-only really means view-only

CONFIRMED LIVE 2026-09-07 (Local, `luna.blossom` — role Agent, `view_helpdesk` only, confirmed `manage_helpdesk` NOT granted): PASS. Project sub-nav for Helpdesk QA Alpha shows only Helpdesk Dashboard / Helpdesk Tickets / Knowledgebase — no SLA, Organization, or Settings tabs at all (matches TC-210's already-confirmed hidden-controls finding). Direct URL attempts, all genuine `403 Forbidden`: `/projects/helpdesk-qa-alpha/helpdesk/sla` (SLA/Support Level management lives here), `/rf_organizations` (Organization), `/rf_products` (Product), `/rf_canned_responses` (Canned Response — also independently admin-only per BUG-HLP-039), `/rf_helpdesk/setting` (plugin Settings, houses Holiday management). All six configuration entities refused — view-only holds.

---

### TC-HLP-172: `manage_helpdesk` without `manage_prepaid_support_hours` cannot touch budgets

**User Role:** Role granted `view_helpdesk` + `manage_helpdesk`, explicitly **not** `manage_prepaid_support_hours`
**Priority:** High
**Precondition:** An organization with a prepaid budget on a project.

**Steps:**
1. Access/open the Organization page.
2. View the prepaid-hours information (Approved/Used/Remaining, run-out mode).
3. Attempt to add/top up or otherwise modify prepaid hours.
4. Attempt to change the "When hours run out" mode.

**Expected Result:**
- The Organization page opens normally, and the prepaid-hours figures (Approved/Used/Remaining) are visible — `manage_helpdesk` alone is sufficient for **access and viewing**.
- The "Add / top up hours" control and any other prepaid-hours modification control are unavailable (hidden), or the corresponding action is rejected if attempted — **modification** requires `manage_prepaid_support_hours` in addition, and this role doesn't have it.
- Changing the "When hours run out" mode is also blocked (rendered as plain, non-editable text, not a live control).
- This confirms `manage_prepaid_support_hours` is the permission that controls actual modification of prepaid hours, layered on top of `manage_helpdesk`'s access grant — not a replacement for it. (See TC-HLP-168 for the symmetric positive case, and the permission-model note there for the full clarified relationship between these two permissions.)

CONFIRMED LIVE 2026-09-07 (Local, redmine-docker-6, `manage.helpdesk.test` — `view_helpdesk`+`manage_helpdesk` granted, `manage_prepaid_support_hours` explicitly not granted): **PASS on all four steps.** Organization page opened normally, no refusal. Reached and viewed the organization's Prepaid Support Hours tab — Approved/Used/Remaining figures all visible (viewing is correctly gated on `manage_helpdesk` alone, per the controller's own design, matching this TC's Expected Result). But: **no "Add / top up hours" link exists anywhere on the page** (the "Budget by project" section header shows only the heading, no action control), and the "When hours run out" column for the project row renders as plain text **"—"**, not an editable dropdown (contrast with TC-HLP-168's identical row, shown to a `manage_prepaid_support_hours`-holding session, which renders a real `<select>`). Both modification controls are genuinely absent, not just disabled-and-clickable — access/view works, modification is fully and correctly blocked. This is the intended, by-design permission boundary — `manage_prepaid_support_hours` is confirmed as the permission that controls actual modification, additive to `manage_helpdesk`'s access grant.

---

### TC-HLP-173: Missing an individual KB permission blocks exactly that action (canonical reference)

**User Role:** Role granted `view_helpdesk` and exactly one of `add_kb_page`/`edit_kb_page`/`delete_kb_page` at a time
**Priority:** High
**Precondition:** An existing article.

**Steps:**
1. With only `add_kb_page`: attempt to edit, then delete, an article
2. With only `edit_kb_page`: attempt to create, then delete, an article
3. With only `delete_kb_page`: attempt to create, then edit, an article

**Expected Result:**
- In each case, only the one granted action succeeds; the other two are refused — the three KB permissions are fully independent of each other (canonical version of TC-HLP-029/174/175)

CONFIRMED LIVE 2026-09-07 (Local, custom role "Permission Test Role" reconfigured three times, `perm.test.agent` holding `view_helpdesk` + exactly one KB permission each pass): PASS on all three passes.
- **Pass 1 — `add_kb_page` only**: Created "TC-HLP-173 add-only KB Article" via the Add-Article modal → succeeded (`?page_id=2`). Edit refused: clicking into the content area produced no editable block (`.codex-editor__redactor` stayed empty, confirmed via DOM), and the title's "Edit Title" pencil click had no effect. Delete refused: DOM-confirmed the delete button itself is `display:none` (`#delete-button { display: none }`), not merely styled — no delete affordance reachable at all.
- **Pass 2 — `edit_kb_page` only**: On the same article, create refused: the "Add Article" icon is present in the DOM (`display:block`, a minor cosmetic inconsistency) but dispatching its click produced no New-Article modal and no new page (KB sidebar list count unchanged) — the create action itself is blocked, only the stale icon visibility isn't. Edit succeeded: content block was genuinely editable (`.ce-paragraph` present), typed "Edited by edit-only permission test." and saved via `#save-draft` (visible, `display:inline-block`) — change persisted. Delete refused: `#delete-button` confirmed `display:none` again.
- **Pass 3 — `delete_kb_page` only**: On the same article, create/edit both refused: `#save-draft` confirmed `display:none`, and no editable content block was instantiated (`hasEditableBlock: false`). Delete succeeded: `#delete-button` confirmed visible (`display:inline-block`), clicked it → "Delete Page?" confirmation modal → confirmed → article removed, redirected to KB list with the article gone.

All three KB permissions confirmed fully independent — each gates exactly its own action, with one cosmetic-only exception (the Add-Article icon's visibility doesn't itself reflect `add_kb_page`, though the underlying create action is still correctly blocked without it) — not filed as a bug since no actual unauthorized action succeeds, only a harmless dead icon click.

---

### TC-HLP-174: Saving a project's email configuration is refused for every non-admin role

**User Role:** A role granted `manage_helpdesk` (the highest non-admin helpdesk permission)
**Priority:** High
**Precondition:** None.

**Steps:**
1. Attempt to open and save Helpdesk › Settings › Email Configuration for a project

**Expected Result:**
- Refused/shown a note instead of the form, even with `manage_helpdesk` — confirms this is truly admin-only regardless of any helpdesk permission held (canonical version of TC-HLP-080)

- **CONFIRMED LIVE 2026-09-07** (Local, redmine-docker-6, manage.helpdesk.test — `manage_helpdesk` granted): **PASS.** Reached Helpdesk Settings → Email Configuration tab (the tab itself is reachable, unlike Canned Responses' outright 403 — BUG-HLP-039), selected Project "Helpdesk QA Alpha" from the dropdown. Instead of the actual configuration form, the page shows exactly: **"Only an administrator can change a project's email configuration."** No form fields rendered at all. Confirms Email Configuration is genuinely admin-only regardless of `manage_helpdesk`, matching this TC's expectation and TC-HLP-080's canonical finding. Unlike BUG-HLP-039 (Canned Responses), this behavior is **not** a documentation contradiction — nothing in `HELPDESK_REQUIREMENTS.md` promises `manage_helpdesk` grants email configuration.

---

## Edge Cases

---

### TC-HLP-165: Resolving whether `manage_helpdesk` alone grants report export

**User Role:** Role A — granted `manage_helpdesk`, explicitly **without** `export_helpdesk_reports`. Role B — granted both.
**Priority:** High
**Precondition:** A report tab with data.

**Steps:**
1. As Role A, open a report tab and look for/attempt to use **Export**
2. As Role B, do the same

**Expected Result — record whichever actually happens:**
- **If the table's descriptive text is correct:** Role A can export (manage_helpdesk alone is sufficient)
- **If the checklist/permission-list reading is correct:** Role A cannot export; only Role B (with `export_helpdesk_reports` explicitly granted) can
- Whichever is observed, update `HELPDESK_REQUIREMENTS.md`'s Permissions Matrix and `HELPDESK_MEMORY.md` with the confirmed behavior, since the guide's own table and checklist disagree

- **CONFIRMED LIVE 2026-09-07** (Local, redmine-docker-6): **RESOLVED — the table's descriptive text is correct; `manage_helpdesk` alone is sufficient.** Role A (`manage.helpdesk.test`: `manage_helpdesk` granted, `export_helpdesk_reports` explicitly not granted): opened Reports → Ticket Summary, clicked Export → Export as CSV — the file **genuinely downloaded** (`helpdesk_tickets_2026-08-09_to_2026-09-07.csv`), confirmed by reading its actual content (a real "Ticket Summary Report" with a populated Date Range and Summary section, not an error page). Role B (`perm.test.agent`, reconfigured to hold `manage_helpdesk` + `export_helpdesk_reports` + `manage_prepaid_support_hours` together): identical Export → CSV action, also succeeded. Both roles can export — `export_helpdesk_reports` does not appear to gate this action independently of `manage_helpdesk` in the current build. **Action per this TC's own instruction**: `HELPDESK_REQUIREMENTS.md`'s Permissions Matrix already states this correctly (line 40's wording); the tester checklist's "`export_helpdesk_reports` controls the Export button" reading is the one that does not hold up — `HELPDESK_MEMORY.md` updated with this confirmed resolution.

---

### TC-HLP-175: Both admin-only actions are refused together for the same non-admin role

**User Role:** A single role granted `manage_helpdesk` **and** `export_helpdesk_reports` **and** `manage_prepaid_support_hours` — i.e. every non-admin helpdesk permission at once
**Priority:** High
**Precondition:** None.

**Steps:**
1. Attempt to save a project's email configuration
2. Attempt to open `/helpdesk/swagger`

**Expected Result:**
- Both are refused even with every other permission stacked on — confirming "admin-only regardless of role" means regardless of **any** permission combination, not just a single missing one (combines TC-HLP-080 and TC-HLP-280 into one deliberate maximal-permission check)

- **CONFIRMED LIVE 2026-09-07** (Local, redmine-docker-6, perm.test.agent — role reconfigured to hold `view_helpdesk` + `manage_helpdesk` + `export_helpdesk_reports` + `manage_prepaid_support_hours` all together): **PASS.** Email configuration: selected Project "Helpdesk QA Alpha" on the Email Configuration tab — same refusal as TC-HLP-174, "Only an administrator can change a project's email configuration.", no form rendered. Swagger: direct navigation to `/helpdesk/swagger` — genuine **403 Forbidden**. Both admin-only gates hold firm even with every non-admin helpdesk permission stacked simultaneously on one role — confirms these are true `admin?` checks, not a missing-permission gap that any sufficiently-privileged combination could satisfy.

---

## Evidence Map

- Case ID: TC-HLP-166 – TC-HLP-175
- Screenshot: `screenshots/<TC-ID>/` (only if a bug is found — see `CLAUDE.md` §6)
- Log: `logs/`
- Bug reference: see `bugs/_index.md`
