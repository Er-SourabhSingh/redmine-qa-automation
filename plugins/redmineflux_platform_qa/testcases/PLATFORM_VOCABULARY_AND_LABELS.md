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

---

### TC-PLT-081: Active / Inactive / Private wording identical across all 6 plugins

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. For each of the 6 consumer plugins, find a screen showing an Active/Inactive toggle or status, and a Private/Public (or equivalent visibility) toggle, for a consolidated entity.
2. Record the exact wording used in each plugin.

**Expected Result:**
- Identical wording (exact string match) across all 6 plugins for the same concept — confirms the 54-shared-label consolidation.

---

### TC-PLT-082: No silent `label_active`/`label_inactive` clobbering (plugin load order no longer matters)

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. If plugin load order can be influenced (e.g. by folder naming or a Redmine config, if such a mechanism is exposed), try loading the 6 consumer plugins in at least two different orders across two restarts.
2. Compare the Active/Inactive wording observed each time.

**Expected Result:**
- Wording is identical regardless of load order — confirms the fix (previously "whichever plugin loaded last silently won app-wide"). **BLOCKED note:** if load order can't practically be controlled/observed on this setup, downgrade this TC to inspecting the label-definition source (only the platform plugin should define `label_active`/`label_inactive` now, not any consumer plugin) as indirect verification instead.

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

---

### TC-PLT-084: Leave Types use a dedicated create/edit page

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method as TC-PLT-083, for Leave Types.

**Expected Result:** Same as TC-PLT-083.

---

### TC-PLT-085: Leaves use a dedicated create/edit page

**User Role:** Admin/Manager.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method as TC-PLT-083, for filing/editing a Leave.

**Expected Result:** Same as TC-PLT-083.

---

### TC-PLT-086: Organizations use a dedicated create/edit page, grouped into 3 sections matching CRM's old Companies form

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Open the Organization create/edit page from CRM and from Helpdesk.
2. Confirm both show a dedicated page (not a popup), grouped into Basic Information / Business Details / Additional Details, with field placeholders.

**Expected Result:**
- Both entry points show the identical, correctly-grouped dedicated page (single source of truth for the form itself, not just the data).

---

### TC-PLT-087: Teams and Holiday Schemes remain popup dialogs (deliberately NOT moved to dedicated pages)

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Click "New Team" and "New Holiday Scheme" from any consumer plugin.

**Expected Result:**
- Both still open as popup dialogs, per the ticket's explicit statement that these forms are "short enough not to need a page." If either was unexpectedly moved to a full page, that's a UX inconsistency worth noting (not necessarily a bug, but a documented-behavior deviation).

---

### TC-PLT-088: Primary action button (Create/Save) comes first, left-aligned, on every consolidated-entity form

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. On every consolidated-entity create/edit form across all 6 plugins (Organizations, Contacts, Teams, Holidays, Leaves, Leave Types), check button order and alignment.

**Expected Result:**
- Create/Save button appears first (before Cancel), both buttons left-aligned — matches Helpdesk's and CRM's pre-existing convention per the ticket. Any form still showing Cancel-first/right-aligned is a leftover, worth a bug (Low severity, cosmetic).

---

### TC-PLT-089: No duplicate "New team" button on the Overview page

**User Role:** Admin.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Check the Overview page (per the ticket, this button was removed since Teams' own list page already offers a create shortcut).

**Expected Result:**
- No "New team" shortcut on Overview. Confirm no other entity has a create shortcut on Overview either (per the ticket's stated consistency rationale).

---

## Evidence Map

- Case ID: TC-PLT-080 … TC-PLT-089
- Screenshot: (bugs only)
- Log: —
- Bug reference: —
