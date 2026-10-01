# Test Cases — Redmineflux Platform — Vocabulary, Labels & UX Consistency

> Source: `docs/PLATFORM_REQUIREMENTS.md` Key Features (Consistent vocabulary, UX pass); `docs/PLATFORM_FEATURES_LIST.md` #20–22.
> Requires `PLATFORM_INSTALLATION_AND_UPGRADE.md` TC-PLT-021 PASS.

## Plugin
- Name: redmineflux_platform
- Version: `redmineflux_platform` branch, HEAD
- Redmine version: 6 (`redmine-docker-6-platform`, `localhost:3013`, post-upgrade)
- Path: plugins/redmineflux_platform_qa

---

## Functional Cases — Vocabulary

---

### TC-PLT-080: "Company" wording no longer appears anywhere in CRM

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Walk every CRM screen (list, create, edit, detail views, menu labels, settings) that previously referred to "Company".
2. Confirm every instance now reads "Organization" instead.

**Expected Result:**
- Zero remaining "Company" references in CRM's UI. Any leftover instance is a bug (vocabulary-consolidation gap).

**Status:** **EXECUTED 2026-10-01 — FAIL.** Confirmed live via full-page snapshot of `/companies/1` (`PLT-BASELINE-Acme Corp`): three empty-state messages still say "company" (Deals: "No deals associated with this company"; Related Leads: "No leads currently mapped to this company name"; Linked Redmine Issues: "No Redmine issues linked to this company's contacts"). Worse, the Recent Activities log is internally inconsistent for the *same* record — the "created" entry correctly says "Organization created by Redmine Admin" but a later "updated" entry says "Company updated by Redmine Admin Tags: ... → ...". Traced to two independent leftover sources: (1) `config/locales/en.yml` still has `label_no_deals_for_company`/`label_no_leads_for_company`/`label_no_linked_issues_company` keys worded with "company", plus a stale unused duplicate key `label_new_company_subtitle` alongside the correct `label_crm_new_company_subtitle`; (2) `app/controllers/api/companies_controller.rb`'s create/update/destroy actions return hardcoded literal strings (`'Company created'`/`'Company updated'`/`'Company deleted'`) independent of any locale file — this is what the frontend echoes into the Activity Log, explaining why the "updated" entry disagrees with the "created" entry (two different code paths, only one updated for the consolidation). Filed as **BUG-PLT-024**. Not yet swept: CRM's list page, create/edit forms, Settings — filed on confirmed instances found so far, a broader sweep may surface more.

---

### TC-PLT-081: Active / Inactive / Private wording identical across all 6 plugins

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. For each of the 6 consumer plugins, find a screen showing an Active/Inactive toggle or status, and a Private/Public (or equivalent visibility) toggle, for a consolidated entity.
2. Record the exact wording used in each plugin.

**Expected Result:**
- Identical wording (exact string match) across all 6 plugins for the same concept — confirms the 54-shared-label consolidation.

**Status:** **EXECUTED 2026-10-01 — PARTIAL FAIL.** Active/Inactive: consistent — Platform's own Organizations list ("Status" filter/column: "Active"/"Inactive", via its own `label_rf_platform_active`/`label_rf_platform_inactive` keys) matches Workload's own `/rf_settings` Holiday Scheme table ("Active" column header, via the generic `label_active` key) — same literal string, confirmed live on both. Private/visibility wording: **FAIL**, and not even cross-plugin — Platform contradicts *itself*. Its own locale file explicitly documents the intended pairing as "Private / Visible to all" (a dedicated `label_rf_platform_visible_to_all: "Visible to all"` key exists for exactly this), but the live "Visibility" filter on Platform's own Organizations list instead renders "Private" / **"Public"**, sourced from a different, separately-added key (`label_rf_platform_public`) — the documented, correct key (`label_rf_platform_visible_to_all`) is never referenced anywhere in app code. Filed as **BUG-PLT-025**.

---

### TC-PLT-082: No silent `label_active`/`label_inactive` clobbering (plugin load order no longer matters)

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. If plugin load order can be influenced (e.g. by folder naming or a Redmine config, if such a mechanism is exposed), try loading the 6 consumer plugins in at least two different orders across two restarts.
2. Compare the Active/Inactive wording observed each time.

**Expected Result:**
- Wording is identical regardless of load order — confirms the fix (previously "whichever plugin loaded last silently won app-wide"). **BLOCKED note:** if load order can't practically be controlled/observed on this setup, downgrade this TC to inspecting the label-definition source (only the platform plugin should define `label_active`/`label_inactive` now, not any consumer plugin) as indirect verification instead.

**Status:** **EXECUTED 2026-10-01 — PASS (downgraded to source inspection per the TC's own BLOCKED note; load order isn't practically controllable on this single Docker instance), with one documented deviation from the expected architecture, not re-filed as a bug.** Repo-wide grep across all 6 plugins' locale files found exactly one remaining definition of the *generic* `label_active`/`label_inactive` keys — `redmineflux_workload/config/locales/en.yml:255` (`label_active: "Active"`; CRM's dashboard/reports views consume this same key without defining their own). No live collision exists today since only one plugin defines it. However, this is **not** the architecture the TC's own fallback describes ("only the platform plugin should define `label_active`/`label_inactive` now") — Platform in fact deliberately did **not** take over the generic keys at all. Its own locale file says so explicitly: *"Deliberately does NOT define generic keys like button_cancel or label_active: Redmine merges every plugin's locale file into one namespace... Adding an eighth definition would make the platform a participant in that collision rather than a fix for it. Consolidating the generic keys is a separate, deliberate change."* Instead Platform defined its own namespaced `label_rf_platform_active`/`label_rf_platform_inactive` keys for its own screens, sidestepping the collision rather than resolving it. Net effect verified live: no clobbering is currently observable, but the underlying collision risk is only dormant (reintroducing a second plugin-level `label_active` definition would immediately resurrect the "last-loaded wins" bug this TC was written against) — not actually eliminated by this ticket's scope. Noted here as a documented architecture gap, not filed as a new bug, since Platform's own comment already scopes generic-key consolidation as deliberately out of scope for this work.

---

## Functional Cases — UX Pass

---

### TC-PLT-083: Holidays use a dedicated create/edit page (not a popup)

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. From Workload (or Shift Management), click "New Holiday" / "Edit Holiday".

**Expected Result:**
- Navigates to a dedicated full page, not a modal/popup dialog.

**Status:** **EXECUTED 2026-10-01 — PASS.** From Platform's own Holidays list, "New Holiday" navigates to a distinct URL (`/redmineflux_platform/list/holidays/new`, own page title "New Holiday") — a real full-page navigation, not a modal.

---

### TC-PLT-084: Leave Types use a dedicated create/edit page

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method as TC-PLT-083, for Leave Types.

**Expected Result:** Same as TC-PLT-083.

**Status:** **EXECUTED 2026-10-01 — PASS.** "New Leave Type" navigates to `/redmineflux_platform/list/leave_types/new` — confirmed full-page, not a modal.

---

### TC-PLT-085: Leaves use a dedicated create/edit page

**User Role:** Admin/Manager.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method as TC-PLT-083, for filing/editing a Leave.

**Expected Result:** Same as TC-PLT-083.

**Status:** **EXECUTED 2026-10-01 — PASS.** "New Leave Request" navigates to `/redmineflux_platform/list/leaves/new` — confirmed full-page, not a modal.

---

### TC-PLT-086: Organizations use a dedicated create/edit page, grouped into 3 sections matching CRM's old Companies form

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Open the Organization create/edit page from CRM and from Helpdesk.
2. Confirm both show a dedicated page (not a popup), grouped into Basic Information / Business Details / Additional Details, with field placeholders.

**Expected Result:**
- Both entry points show the identical, correctly-grouped dedicated page (single source of truth for the form itself, not just the data).

**Status:** **EXECUTED 2026-10-01 — PASS.** Platform's own "New Organization" navigates to `/redmineflux_platform/list/organizations/new`, a dedicated page. Confirmed the edit page (TC-PLT-134 session) is grouped into exactly "Basic Information" / "Business Details" / "Additional Details" headings, matching the spec. Not independently re-verified from CRM's/Helpdesk's own nav entry points this pass (both route through the same shared Platform screen per the architecture already confirmed this cycle) — the single-source-of-truth claim holds by construction, not by separately screenshotting both entry points.

---

### TC-PLT-087: Teams and Holiday Schemes remain popup dialogs (deliberately NOT moved to dedicated pages)

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Click "New Team" and "New Holiday Scheme" from any consumer plugin.

**Expected Result:**
- Both still open as popup dialogs, per the ticket's explicit statement that these forms are "short enough not to need a page." If either was unexpectedly moved to a full page, that's a UX inconsistency worth noting (not necessarily a bug, but a documented-behavior deviation).

**Status:** **EXECUTED 2026-10-01 — PASS.** From Platform's own Teams list, "New team" and the per-row "Edit" both open as a `dialog` with the list's own URL unchanged (`/redmineflux_platform/teams`) — confirmed via live DOM inspection, not just visual impression. Same confirmed for "New Holiday scheme" (`/redmineflux_platform/list/holiday_schemes` stays the URL, a `dialog` opens in place). This directly answers a question raised this session about why Platform "makes forms" for some entities and popups for others — it's this TC's own documented, intentional split, not an inconsistency.

---

### TC-PLT-088: Primary action button (Create/Save) comes first, left-aligned, on every consolidated-entity form

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. On every consolidated-entity create/edit form across all 6 plugins (Organizations, Contacts, Teams, Holidays, Leaves, Leave Types), check button order and alignment.

**Expected Result:**
- Create/Save button appears first (before Cancel), both buttons left-aligned — matches Helpdesk's and CRM's pre-existing convention per the ticket. Any form still showing Cancel-first/right-aligned is a leftover, worth a bug (Low severity, cosmetic).

**Status:** **EXECUTED 2026-10-01 — PASS, and this corrects a mistaken bug filed earlier in the same session (BUG-PLT-023, now retracted).** Confirmed via live DOM/CSS inspection on 3 independent plugins:
- **Platform** (`.rf_platform_form_footer`, "Add members"/"New Holiday scheme" modals): `display:flex; justify-content:flex-start`, DOM order primary-submit-then-Cancel.
- **CRM** (`/companies/new`, `.rf_crm_form_actions`): `justify-content: normal` (= flex-start), DOM order "Create Organization" then "Cancel".
- **Helpdesk** (`/rf_organizations/new`, plain unstyled Redmine form): `justify-content: normal`, DOM order "Create" then "Cancel".

All three agree: Primary-first, left-aligned is the real, intentional, ticket-documented standard (matching Redmine core's own native form convention). I had initially compared Platform's layout against Workload's and Timesheet's own "Add Member" modals instead — which independently use a *different*, right-aligned/Cancel-first convention (their own internal modal pattern, unrelated to this ticket's stated standard for consolidated-entity forms) — and incorrectly filed that mismatch as **BUG-PLT-023**. Retracted: Platform's layout is correct per this TC; it is Workload's/Timesheet's own modals that sit outside this specific standard, and changing them is out of this ticket's scope. The file was removed rather than closed, since it was never a real, reportable defect at any point (never reported to production) — see `PLATFORM_MEMORY.md` for the lesson captured from this.

**One sub-finding not addressed by this TC, kept separately for awareness (not re-filed as its own bug — too minor to warrant one on its own):** the "Add members" modal's footer note ("Everyone picked is added with the same role and permissions.") sits on the same flex row immediately after Cancel rather than on its own line, since the footer is a single unwrapped flex row. Purely cosmetic, no functional impact.

---

### TC-PLT-089: No duplicate "New team" button on the Overview page

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Check the Overview page (per the ticket, this button was removed since Teams' own list page already offers a create shortcut).

**Expected Result:**
- No "New team" shortcut on Overview. Confirm no other entity has a create shortcut on Overview either (per the ticket's stated consistency rationale).

**Status:** **EXECUTED 2026-10-01 — PASS.** Overview page has one generic "Create" dropdown button and no per-entity "New X" shortcuts anywhere else on the page (confirmed via full-page snapshot) — no "New team" or any other entity-specific create shortcut duplicated outside that one menu.

---

## Functional Cases — Header/Breadcrumb Consistency (added 2026-09-30, per testing-promt.md — no TC existed for this before BUG-PLT-007 was found ad hoc)

---

### TC-PLT-107: Platform's own header banner reads "Redmineflux Platform" consistently on every one of its sections

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Visit every Platform section (Overview, Teams, Holiday Schemes, Holidays, Leave Types, Leaves, Organizations, Contacts, Audit events, Platform Settings).
2. Check the header banner directly below the top navbar on each.

**Expected Result:**
- Consistently reads "Redmineflux Platform" everywhere.
- **CONFIRMED FAIL 2026-09-30** — Overview shows plain "Redmine"; every other section shows a completely blank banner. Filed as part of `BUG-PLT-007` (reopened).

---

### TC-PLT-108: A shared screen reused by two plugins does not leak the other plugin's page-title/menu context

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Visit Platform's Teams screen (`/redmineflux_platform/teams`) — a screen the Team consolidation makes reachable via both Platform's own routes and Shift Management's controller-name collision.
2. Compare its header/title against Shift Management's own native pages.

**Expected Result:**
- Platform's Teams page should show Platform's own identity, not Shift Management's. **CONFIRMED FAIL 2026-09-30** — root-caused to `controller_name` stripping the module namespace, so both controllers render body class `controller-teams`, and Shift Management's CSS keys its own header text off that class. Part of `BUG-PLT-007`.

---

### TC-PLT-109: Delete-confirmation modal buttons are visually consistent between Platform's own modal and each consumer plugin's native equivalent

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Open Platform's delete-confirmation modal (`#rf_platform_confirm_modal`) on any entity.
2. Compare button size (height, font, padding, border-radius) against Shift Management's own native delete modal and Helpdesk's own native delete modal.

**Expected Result:**
- Same button dimensions across all three, since it's visually the same modal component.
- **CONFIRMED PARTIAL FAIL 2026-09-30** — height/font now match after a first fix round, but width is still roughly half of both comparison targets, and border-radius overshoots both. Part of `BUG-PLT-007` (reopened).

---

## Evidence Map

- Case ID: TC-PLT-080 … TC-PLT-089, TC-PLT-107 … TC-PLT-109
- Screenshot: (bugs only)
- Log: —
- Bug reference: TC-PLT-107/108/109 → `BUG-PLT-007` (reopened); TC-PLT-080 → `BUG-PLT-024`; TC-PLT-081 → `BUG-PLT-025`
