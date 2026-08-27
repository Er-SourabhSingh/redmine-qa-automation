# Test Cases — Redmineflux Helpdesk — Features 52–53: Permissions

> Source: `docs/HELPDESK_FEATURES_LIST.md` #52–53 (category J). Grounded in `docs/HELPDESK_USER_GUIDE.md` §20 (Permissions) and tester checklist §26 group U.
>
> Many individual permission checks already exist scattered across other suites (each testing the one permission it happened to need): `view_helpdesk`/`manage_helpdesk` tab visibility (`HELPDESK_TICKET_LIFECYCLE.md` TC-HLP-033, `HELPDESK_NAVIGATION_WORKSPACES.md` TC-HLP-070), `export_helpdesk_reports` (`HELPDESK_REPORTING_AUTOMATION.md` TC-HLP-197), the three KB permissions (`HELPDESK_CONTENT_TEMPLATES.md` TC-HLP-173–176), admin-only email config (`HELPDESK_EMAIL.md` TC-HLP-152) and admin-only Swagger (`HELPDESK_REPORTING_AUTOMATION.md` TC-HLP-200), and `log_time` gating the time-log block (`HELPDESK_TICKET_LIFECYCLE.md` TC-HLP-036). This suite does not repeat those — it adds a systematic, deliberate pass across the full permission matrix, plus one contradiction this pass caught.

## ⚠ Known documentation contradiction — resolve by testing, not by assumption

`HELPDESK_USER_GUIDE.md` §20's own permission table says: *"`manage_helpdesk` | Everything in view, plus managing the desk's configuration **and exporting reports**"* — read literally, `manage_helpdesk` alone grants export.

But `export_helpdesk_reports` is listed as its own distinct permission in the same table, and the tester checklist (§26 group U) says *"`export_helpdesk_reports` controls the Export button"* — implying it's required independently of `manage_helpdesk`.

**TC-HLP-213** below exists to determine the real, tested behavior. Once run, update `HELPDESK_REQUIREMENTS.md`'s Permissions Matrix and `HELPDESK_MEMORY.md` with the confirmed answer.

## Plugin
- Name: redmineflux_helpdesk
- Version: (fill from environment)
- Redmine version: (fill from environment)
- Path: plugins/redmineflux_helpdesk_qa

---

## Positive Cases

---

### TC-HLP-204: `view_helpdesk` alone grants full visibility and ticket create/edit

**User Role:** Role granted `view_helpdesk` only (no `manage_helpdesk`)
**Precondition:** Role is a member of a helpdesk-enabled project.

**Steps:**
1. Sign in and open the Helpdesk tab
2. View tickets, reports, SLAs, customers, etc.
3. Create a new ticket and edit an existing one

**Expected Result:**
- All helpdesk screens are visible
- Ticket creation and editing succeed

---

### TC-HLP-205: `manage_helpdesk` grants desk configuration management

**User Role:** Role granted `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Create/edit an SLA
2. Create/edit a support level
3. Create/edit an organization, a product, a canned response, and a holiday

**Expected Result:**
- Every configuration action succeeds

---

### TC-HLP-206: `manage_prepaid_support_hours` grants budget control

**User Role:** Role granted `manage_prepaid_support_hours` (with `view_helpdesk`, without `manage_helpdesk`)
**Precondition:** An organization with a prepaid budget on a project.

**Steps:**
1. Set/top up the budget
2. Change the "When hours run out" mode

**Expected Result:**
- Both actions succeed even though this role lacks `manage_helpdesk`

---

### TC-HLP-207: All three Knowledgebase permissions together grant full KB CRUD

**User Role:** Role granted `add_kb_page`, `edit_kb_page`, and `delete_kb_page` together
**Precondition:** None.

**Steps:**
1. Create, then edit, then delete a Knowledgebase article

**Expected Result:**
- All three actions succeed — consolidated confirmation of the individually-gated checks in `HELPDESK_CONTENT_TEMPLATES.md`

---

## Negative Cases

---

### TC-HLP-208: Neither `view_helpdesk` nor `manage_helpdesk` — no access at all (canonical reference)

**User Role:** Role with neither permission on any project
**Precondition:** None.

**Steps:**
1. Sign in, look for the Helpdesk tab/menu entry
2. Attempt to navigate directly to a helpdesk URL

**Expected Result:**
- Tab/menu entry absent; direct URL access refused
- (This is the canonical, deliberate version of the same check made incidentally in TC-HLP-033 and TC-HLP-070)

---

### TC-HLP-209: `view_helpdesk` only cannot manage desk configuration

**User Role:** Role granted `view_helpdesk`, explicitly **not** `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Attempt to create/edit an SLA, a support level, an organization, a product, a canned response, and a holiday

**Expected Result:**
- Every configuration-management action is refused or hidden — view-only really means view-only

---

### TC-HLP-210: `manage_helpdesk` without `manage_prepaid_support_hours` cannot touch budgets

**User Role:** Role granted `manage_helpdesk`, explicitly **not** `manage_prepaid_support_hours`
**Precondition:** An organization with a prepaid budget.

**Steps:**
1. Attempt to set/top up the budget
2. Attempt to change the run-out mode

**Expected Result:**
- Both are refused — `manage_helpdesk` does **not** implicitly grant prepaid-hours control; it is a separate permission

---

### TC-HLP-211: Missing an individual KB permission blocks exactly that action (canonical reference)

**User Role:** Role granted `view_helpdesk` and exactly one of `add_kb_page`/`edit_kb_page`/`delete_kb_page` at a time
**Precondition:** An existing article.

**Steps:**
1. With only `add_kb_page`: attempt to edit, then delete, an article
2. With only `edit_kb_page`: attempt to create, then delete, an article
3. With only `delete_kb_page`: attempt to create, then edit, an article

**Expected Result:**
- In each case, only the one granted action succeeds; the other two are refused — the three KB permissions are fully independent of each other (canonical version of TC-HLP-173/174/175)

---

### TC-HLP-212: Saving a project's email configuration is refused for every non-admin role

**User Role:** A role granted `manage_helpdesk` (the highest non-admin helpdesk permission)
**Precondition:** None.

**Steps:**
1. Attempt to open and save Helpdesk › Settings › Email Configuration for a project

**Expected Result:**
- Refused/shown a note instead of the form, even with `manage_helpdesk` — confirms this is truly admin-only regardless of any helpdesk permission held (canonical version of TC-HLP-152)

---

## Edge Cases

---

### TC-HLP-213: Resolving whether `manage_helpdesk` alone grants report export

**User Role:** Role A — granted `manage_helpdesk`, explicitly **without** `export_helpdesk_reports`. Role B — granted both.
**Precondition:** A report tab with data.

**Steps:**
1. As Role A, open a report tab and look for/attempt to use **Export**
2. As Role B, do the same

**Expected Result — record whichever actually happens:**
- **If the table's descriptive text is correct:** Role A can export (manage_helpdesk alone is sufficient)
- **If the checklist/permission-list reading is correct:** Role A cannot export; only Role B (with `export_helpdesk_reports` explicitly granted) can
- Whichever is observed, update `HELPDESK_REQUIREMENTS.md`'s Permissions Matrix and `HELPDESK_MEMORY.md` with the confirmed behavior, since the guide's own table and checklist disagree

---

### TC-HLP-214: Both admin-only actions are refused together for the same non-admin role

**User Role:** A single role granted `manage_helpdesk` **and** `export_helpdesk_reports` **and** `manage_prepaid_support_hours` — i.e. every non-admin helpdesk permission at once
**Precondition:** None.

**Steps:**
1. Attempt to save a project's email configuration
2. Attempt to open `/helpdesk/swagger`

**Expected Result:**
- Both are refused even with every other permission stacked on — confirming "admin-only regardless of role" means regardless of **any** permission combination, not just a single missing one (combines TC-HLP-152 and TC-HLP-200 into one deliberate maximal-permission check)

---

## Evidence Map

- Case ID: TC-HLP-204 – TC-HLP-214
- Screenshot: `screenshots/<TC-ID>/` (only if a bug is found — see `CLAUDE.md` §6)
- Log: `logs/`
- Bug reference: see `bugs/_index.md`
