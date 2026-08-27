# Test Cases — Redmineflux Helpdesk — Features 33–37: Customers & Organizations

> Source: `docs/HELPDESK_FEATURES_LIST.md` #33–37 (category E). Grounded in `docs/HELPDESK_USER_GUIDE.md` §3.4 (Create an organization), §3.5 (Create a customer), §11 (Customers and the portal), and tester checklist §26 groups C (Organizations) and D (Customers and entitlements).

## ⚠ Known documentation contradiction — resolve by testing, not by assumption

`HELPDESK_USER_GUIDE.md` §3.5 states in prose: *"A customer can only hold one project-access row at a time in the current data model. If you need the same person on two projects, that is a limitation to be aware of."*

But the same document's own tester checklist, §26 group D, says: *"Add a second row, save, and both survive a reload"* and *"Removing a row removes only that project's access."*

These two statements are mutually exclusive. **TC-HLP-122** below exists specifically to determine the real, tested behavior. Once run, update `HELPDESK_REQUIREMENTS.md`'s Known Constraints and `HELPDESK_MEMORY.md` with the actual answer, and flag the guide itself as needing a correction if one half is simply wrong.

## Plugin
- Name: redmineflux_helpdesk
- Version: (fill from environment)
- Redmine version: (fill from environment)
- Path: plugins/redmineflux_helpdesk_qa

---

## Positive Cases

---

### TC-HLP-108: Creating an organization saves name and all optional fields

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Helpdesk › Organizations › New Organization
2. Enter a unique Name (required)
3. Fill in website, phone, address, employee count, billing info, and notes (all optional)
4. Save

**Expected Result:**
- Organization saves successfully
- Every optional field entered is saved and displayed on the organization page
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6): PASS. Created "Gamma Corp" (id=4) with all fields filled (Website, Phone, Address, 250 Employees, Notes, Billing Info) — every field displayed correctly on the detail page after save, correct attribution (Created by Redmine Admin).

---

### TC-HLP-109: Creating a customer creates the account and flags it as a helpdesk customer

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Helpdesk › Customers › New Customer
2. Fill in name, login, email as for any Redmine user
3. Save (without adding project access yet)

**Expected Result:**
- A Redmine user account is created
- It is flagged as a helpdesk customer (the flag every customer-facing screen keys off)
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6): PASS. Created `gamma.customer` (id=17, no project access) — "Successful creation. Welcome email sent to customer successfully." shown, correctly appears in the Customers list (Organization/Support Level columns show "—", Projects/Open both 0, matching the no-access precondition). Noted in passing: the New Customer form's "Send account information to the user" checkbox is forced `checked` + `disabled` here — unlike the Edit form (TC-HLP-293/294) where it's optional and unchecked by default.

---

### TC-HLP-293: Editing a customer with "Send account information to the user" checked emails them, even with no other field changed

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** An existing customer with a real, reachable email address (reproduced: `beta.customer`).

**Steps:**
1. Open the customer's Edit form
2. Check **Send account information to the user** (unchecked by default on Edit — confirmed fresh on every load, not sticky from a prior save)
3. Save, without changing any other field

**Expected Result:**
- An email is sent to the customer notifying them their account was updated
- **CONFIRMED LIVE 2026-08-26** (Local, redmine-docker-6): PASS. Checked the box on `beta.customer`'s Edit form, Save with nothing else changed — a new email titled **"Your Helpdesk Account Has Been Updated"** arrived in Roundcube immediately (inbox count went 3 → 4). Contrast with TC-HLP-294 below (box left unchecked): no email at all.
- **Follow-up, same session — checkbox + a real field change together, previously undocumented email content discovered:** changed Last name `Customer` → `Customer-EmailTest` AND checked the box, Save. Email arrived immediately, and its content is far richer than a generic notice — confirmed structure: greeting uses the **live, just-updated** name ("Hello Beta Customer-EmailTest,"), an **"Your Account Credentials"** section (Login / Password — literally `(unchanged)` when the password wasn't touched, not a real password leak / Email), and a **"Changes Made"** table with columns Field / Old Value / New Value, one row per actually-changed field (here: `Last name | Customer | Customer-EmailTest`) — plus a Sign-in link and the Helpdesk URL. None of this (credentials recap, the diff table, "(unchanged)" password placeholder) is documented anywhere in `HELPDESK_REQUIREMENTS.md`/`HELPDESK_USER_GUIDE.md`/`HELPDESK_FEATURES_LIST.md` — worth folding into the features list. Reverted the Last name back to `Customer` afterward (left the checkbox unchecked for that revert, so no further test email was generated).

---

### TC-HLP-294: Editing a customer with "Send account information to the user" left unchecked sends no email, even when a real field is actually changed

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** Same as TC-HLP-293 — an existing customer with a reachable email address.

**Steps:**
1. Open the customer's Edit form
2. Leave **Send account information to the user** unchecked (its default state), Save with no other field changed — confirm no email
3. Repeat, this time actually changing a real field (e.g. Last name), still leaving the checkbox unchecked — Save and confirm the change persisted
4. Check whether an email was sent either time

**Expected Result:**
- No email is sent to the customer in either case — a genuine data change with the checkbox unchecked should behave identically to a no-op save with it unchecked; the checkbox alone gates the email, independent of whether real data actually changed
- **CONFIRMED LIVE 2026-08-26** (Local, redmine-docker-6): PASS, both variants. (1) No-op save, checkbox unchecked — inbox count stayed at 4 (no new message). (2) `beta.customer`'s Last name changed `Customer` → `Customer-Updated` (confirmed persisted in the customer list), checkbox still unchecked — inbox count stayed at 4 again, no email despite the real change. Rules out the alternative theory that any actual field change (not just the checkbox) might independently trigger the notification. Reverted the Last name back to `Customer` afterward to keep the fixture clean.

---

### TC-HLP-110: Adding a project-access row saves SLA, support level, and organization together

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** A customer exists; an SLA, a support level, and an organization all exist on the target project.

**Steps:**
1. Open the customer, click **Add project**
2. Pick the project, the SLA, the support level, and (optionally) the organization
3. Save

**Expected Result:**
- The project-access row saves with all four values correctly associated
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6): PASS. Added Helpdesk QA Beta / Beta Standard SLA / AB-L1 / Gamma Corp to `gamma.customer` — "Successful update", customer list row correctly shows Gamma Corp / AB-L1 / 1 project.

---

### TC-HLP-111: The Support Level dropdown when adding project access only offers that project's support levels

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** Adding project access for Project A; Project B also has its own, different support level(s).

**Steps:**
1. In the project-access form, select Project A in the row's Project dropdown
2. Open the row's Support Level dropdown
3. Change the row's Project to Project B and re-open the Support Level dropdown

**Expected Result:**
- Step 2: only support levels belonging to Project A are selectable — Project B's support level(s) are not offered as selectable options
- Step 3: the dropdown updates to only offer Project B's support level(s) instead
- **CONFIRMED LIVE 2026-08-24** (`flux-fudbk2hlu49`): functionally correct on both Create and Edit — the other project's support level is present in the DOM but rendered `disabled`, so it cannot be selected either way. Note the `disabled`-not-removed rendering is itself tracked separately as **BUG-HLP-004** (the option should arguably not appear in the list at all, per the plugin's own `hidden=""` attribute on it, which CSS is defeating) — that bug does not affect this TC's pass/fail, since the functional requirement (wrong-project level cannot be selected) is met.

---

### TC-HLP-283: The SLA Name dropdown when adding project access only offers that project's SLAs

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** Adding project access for Project A; Project B also has its own, different SLA.

**Steps:**
1. In the project-access form, select Project A in the row's Project dropdown
2. Open the row's SLA Name dropdown
3. Change the row's Project to Project B and re-open the SLA Name dropdown

**Expected Result:**
- Step 2: only SLA(s) belonging to Project A are selectable — Project B's SLA is not offered as a selectable option
- Step 3: the dropdown updates to only offer Project B's SLA instead
- Mirrors TC-HLP-111's requirement for the Support Level dropdown on the same form
- **CONFIRMED LIVE 2026-08-24** (`flux-fudbk2hlu49`): functionally correct on both Create and Edit, using SLA "Standard" (Helpdesk Service Desk) vs. "AgileSLA" (Agile Board Project) — same `disabled`-not-removed caveat as TC-HLP-111, tracked as **BUG-HLP-004**, not a functional failure of this TC.

---

### TC-HLP-284: The Organization Name dropdown when adding project access is NOT filtered by the row's Project (by design)

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** At least two organizations exist, neither one linked yet to any customer or prepaid budget on either Project A or Project B.

**Steps:**
1. In the project-access form, select Project A in the row's Project dropdown
2. Open the row's Organization Name dropdown
3. Change the row's Project to Project B and re-open the Organization Name dropdown

**Expected Result:**
- Unlike SLA (TC-HLP-283) and Support Level (TC-HLP-111), the Organization Name dropdown offers the **same full list of organizations regardless of which Project is selected** — this is expected, not a bug, since Organization has no project-scoping mechanism at creation time at all (confirmed 2026-08-24: an organization's apparent "project" is a derived view based on which customers/prepaid budgets happen to reference it, not a stored association — see `HELPDESK_MEMORY.md` Known Quirks)
- Record this explicitly as confirmed-expected behavior so a future tester doesn't mistake it for the same defect class as BUG-HLP-004
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6) — this TC's own steps had never actually been walked through before (the earlier "confirmed 2026-08-24" note only cited a related fact discovered during the BUG-HLP-004 investigation, not a dedicated execution of this TC). Ran it properly: opened `beta.customer`'s Edit form, clicked **Add project** for a fresh row, selected Project = Helpdesk QA Alpha — SLA/Support Level dropdowns correctly re-scoped (Alpha Standard SLA + L1 enabled, Beta Standard SLA + AB-L1 disabled), while Organization Name showed `None, Alpha Org, Beta Org`, all selectable. Switched Project to Helpdesk QA Beta — SLA/Support Level correctly flipped (Beta Standard SLA + AB-L1 now enabled, Alpha's disabled), but Organization Name showed the **exact same** `None, Alpha Org, Beta Org`, still all selectable, no change at all. PASS, matching the expected result. Discarded the unsaved test row via Cancel afterward (no data was persisted).

---

### TC-HLP-112: Removing a project-access row removes only that project's access

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** A customer with project-access rows on two projects (contingent on TC-HLP-122 confirming this is actually possible — if not, adapt to whatever the real data model supports).

**Steps:**
1. Remove the row for Project A only
2. Reload the customer's page

**Expected Result:**
- Access to Project A is gone
- Access to Project B (if it existed) is untouched
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6): PASS. `gamma.customer` had rows for Helpdesk QA Alpha (L1) and Helpdesk QA Beta (AB-L1); clicked Delete on the Alpha row only, Save — reload confirmed exactly one row remains (`AB-L1`, Projects: 1), Beta's SLA/support level/organization all untouched.

---

### TC-HLP-113: The customer list shows organization, project count, and open-ticket count

**User Role:** Agent
**Precondition:** At least one customer with an organization, project access, and at least one open ticket.

**Steps:**
1. Open Helpdesk › Customers

**Expected Result:**
- Each row shows the customer's organization, how many projects they have access to, and their open-ticket count
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6): PASS. Customer list correctly shows Organization Name, Support Level, Projects, and Open columns for every row (e.g. Beta Customer: Beta Org / AB-L1 / 1 / 3; Gamma Customer: Gamma Corp / AB-L1 / 1 / 0).

---

### TC-HLP-114: The eye icon opens the customer's detail page, not the portal

**User Role:** Agent
**Precondition:** Viewing the customer list.

**Steps:**
1. Click the eye icon next to a customer

**Expected Result:**
- Opens Customer 360 (the detail page) — **not** the Portal Preview
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6): PASS. "Customer details" action link opens `/rf_customers/16` (Customer 360), not any portal/preview route — consistent with TC-HLP-117's finding that no portal-preview control exists on this build at all.

---

### TC-HLP-115: Customer 360 shows identity, KPIs, entitlements, and recent tickets with SLA badges

**User Role:** Agent
**Precondition:** A customer with tickets in a range of SLA states.

**Steps:**
1. Open the customer's Customer 360 page

**Expected Result:**
- Shows: identity (login, email, organization, customer since, last login), KPIs (total tickets, open, waiting on them, breached, resolved), Projects & Entitlements (one row per project with SLA, support level, organization, open count), and recent tickets each showing their SLA badge
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6): PASS. `beta.customer`'s Customer 360 shows exactly this — identity block (Login/Email/Organization Name/Customer since/Last Login), KPI row (Total Tickets 3, Open 3, Waiting on them 1, Breached 1, Resolved 0), Projects & Entitlements table (Helpdesk QA Beta / Beta Standard SLA / AB-L1 / Beta Org / 3 open), and Recent Tickets each with a real SLA Status badge (Paused/Breached/N/A observed across the 3 tickets).

---

### TC-HLP-116: Customer 360's open-ticket count matches the customer list's count

**User Role:** Agent
**Precondition:** A customer with a known number of open tickets.

**Steps:**
1. Note the open-ticket count on the customer list
2. Open Customer 360 for the same customer and note its open count

**Expected Result:**
- The two figures match exactly
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6): PASS. `beta.customer`'s customer-list Open column and Customer 360's Open KPI both read **3**.

---

### TC-HLP-117: ~~Portal Preview shows the desk exactly as the customer sees it, read-only~~ — Portal Preview should not exist as a reachable route at all

**User Role:** Agent
**Precondition:** A customer with at least one project entitlement and one ticket.

**Steps:**
1. From Customer 360, look for a **View portal** control
2. If none exists in the UI, attempt the documented route directly: `/rf_customers/:id/portal`

**Expected Result — REVISED 2026-08-27 per explicit user product-judgment direction:** Portal Preview is **not considered part of this plugin's intended functionality** (see `HELPDESK_SCOPE.md` Out of Scope), regardless of what `HELPDESK_USER_GUIDE.md`/`HELPDESK_FEATURES_LIST.md` say. The correct expected result is therefore:
- No "View portal" control should exist anywhere in the UI (confirmed — it doesn't)
- **The route `/rf_customers/:id/portal` should not be present/reachable at all** — it should 404 or otherwise not resolve, since a route for functionality that isn't part of the product's intended scope shouldn't exist regardless of whether its own internal logic happens to be correct
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6): **FAIL against the revised expected result.** A full DOM scan of `beta.customer`'s Customer 360 page (`/rf_customers/16`) confirms no "View portal" control exists anywhere — that half is correct. But `/rf_customers/16/portal` **is** fully reachable and fully functional (read-only banner, "Exit preview" link, correctly scoped to the customer's real entitled project only) — the route should not exist per the revised expected result, yet it does, and works. See **BUG-HLP-013** (reframed) for the full writeup. (Prior note, now superseded: this was first scored BLOCKED on the theory the feature didn't exist, then FAIL on the theory it should have a UI entry point — both readings assumed Portal Preview was in-scope functionality, which the user has since clarified it is not.)

---

### TC-HLP-118: Searching and filtering the customer list works correctly

**User Role:** Agent
**Precondition:** Multiple customers across at least two organizations.

**Steps:**
1. Search by a customer's name, then by login, then by email
2. Clear search; filter by organization

**Expected Result:**
- Each search correctly finds the matching customer
- The organization filter narrows the list to only that organization's customers
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6): PASS, all variants. Searched "Gamma" (name) → only Gamma Customer. Searched "alpha.customer" (login) → only Alpha Customer. Searched "beta.customer@test.local" (email) → only Beta Customer. Organization filter "Gamma Corp" alone → only Gamma Customer. Note: the "All Organizations" control is a custom searchable-select widget (click to open a listbox, click an option), not a native `<select>` — automation should target it accordingly.

---

### TC-HLP-279: Organization list search, Status filter, Apply Filters, and Clear Filters all work correctly

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** Multiple organizations exist, at least one Active and at least one Inactive (deactivated via the list-level toggle).

**Steps:**
1. Open the Organization list, type a known organization's name into **Search organizations...**, click **Apply Filters**
2. Clear the search box, set the **Status** dropdown to **Active only**, click **Apply Filters**
3. Repeat with **Inactive only**
4. Click **Clear**

**Expected Result:**
- Step 1: only the matching organization(s) are shown
- Step 2: only Active organizations are shown
- Step 3: only Inactive organizations are shown
- Step 4: both the search box and Status dropdown reset, and the full unfiltered list returns
- Search and Status filter can be combined and both conditions apply together
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6): PASS, all steps. Deactivated "Alpha Org Subsidiary" via the list toggle to get a real Inactive fixture. Search "Gamma" → only Gamma Corp. Status=Inactive only → only Alpha Org Subsidiary. Status=Active only → Alpha Org/Beta Org/Gamma Corp (3, correctly excluding the deactivated one). Clear → all 4 unfiltered.

---

### TC-HLP-280: Customer list's Apply Filters and Clear Filters buttons behave correctly with search + organization filter combined

**User Role:** Agent
**Precondition:** Multiple customers across at least two organizations.

**Steps:**
1. Set a search term AND pick an organization filter at the same time, click **Apply Filters**
2. Note the result set, then click **Clear**

**Expected Result:**
- Step 1: the result set reflects BOTH conditions together (only customers matching the search term AND belonging to the selected organization) — not just one of the two
- Step 2: both the search box and organization dropdown reset, and the full unfiltered customer list returns
- Complements TC-HLP-118 by specifically exercising the Apply/Clear buttons and the combined-filter case, not just each filter in isolation
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6): PASS. Search "Customer" (matches all 3 customers by name) + Organization "Gamma Corp" together → correctly narrowed to exactly one row (Gamma Customer), proving AND logic, not OR. Clicking Clear returned to all 3 unfiltered.

---

## Negative Cases

---

### TC-HLP-119: Creating an organization with a duplicate name is refused

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** An organization named "Acme Corp" already exists.

**Steps:**
1. Attempt to create another organization also named "Acme Corp"

**Expected Result:**
- Save is refused with a clear duplicate-name message
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6): PASS. Attempted a second "Gamma Corp" — refused with **"Name has already been taken"**, form re-rendered with the entered data intact, no duplicate created.

---

### TC-HLP-120: An organization linked to customers cannot be silently deleted

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** An organization with at least one customer linked to it.

**Steps:**
1. Attempt to delete the organization

**Expected Result:**
- Deletion is refused (or requires explicit confirmation of consequences) with a clear message — not a silent failure or a crash
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6): **FAIL.** Deleted "Gamma Corp" (linked to `gamma.customer`) — the confirmation modal is generic regardless of linkage ("Are you sure you want to delete 'Gamma Corp'? This action cannot be undone.", no mention of the linked customer), and deletion succeeded outright ("Successful deletion."). The customer record didn't crash, but its Organization Name silently became "—" with zero prior warning. Filed as **BUG-HLP-011** (Medium).

---

### TC-HLP-121: A manager scoped to Project A cannot disturb a customer's access to Project B

**User Role:** Manager whose role only administers Project A (via `manage_helpdesk` on Project A only)
**Precondition:** A customer has project-access rows on both Project A and Project B (contingent on TC-HLP-122).

**Steps:**
1. Sign in as the Project-A-scoped manager
2. Edit the customer's Project A access and Save

**Expected Result:**
- The customer's Project B access row is unchanged after this save — a manager without visibility into Project B cannot accidentally remove or alter it
- **CONFIRMED LIVE PASS 2026-08-27** (Local, redmine-docker-6) — Built the missing fixture: created user `ivy.sterling`, added the existing "Manager" role's `manage_helpdesk`/`export_helpdesk_reports`/`manage_prepaid_support_hours`/`view_helpdesk`/`view_email_history` permissions (previously all unchecked on that role), then added `ivy.sterling` as a project Member of **Helpdesk QA Alpha only** with the Manager role — confirmed via her Users → Projects tab: exactly one membership row. Gave `gamma.customer` a second project-access row (Helpdesk QA Alpha, restoring what TC-HLP-112/122 had removed) so it held both an Alpha and a Beta row again. Signed in as `ivy.sterling`, opened `gamma.customer`'s Edit form: **only the Alpha row was visible/editable — the Beta row was completely absent from the form**, not merely disabled. Changed the Alpha row's Organization to "Alpha Org" and saved. Re-verified as admin: Alpha row now shows Organization "Alpha Org" (change persisted), Beta row unchanged — still `Beta Standard SLA` / `AB-L1` / Organization "None", exactly as before. **TC-HLP-121 PASSES** for Project-access-row scoping.
- **Side-effect finding, investigated and closed as Not a Bug:** while executing this TC, noticed that although Project-access rows are correctly scoped, a customer's core Information fields (Login/Name/Email/Password) were editable by `ivy.sterling` even for `beta.customer` (zero Alpha access at the time). Filed as BUG-HLP-012, then closed same-day per user product-judgment review: **Customers are a global entity, not project-scoped** — Login/Email are unique install-wide (TC-HLP-240/244), and the very "Add project" control on this same form was confirmed scoped to only `ivy.sterling`'s own project (Alpha never offered Beta). So the correct read of this form is: Information = the shared global-identity fields (same ones an Admin fills in on creation), Project access = the actually project-scoped entitlement rows — and only the latter needs (and has) per-project gating. See `bugs/closed/BUG-HLP-012.md` for the full resolution writeup.

---

## Edge Cases

---

### TC-HLP-122: Resolving the one-vs-multiple project-access row contradiction

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** A single customer, no existing project access.

**Steps:**
1. Add a project-access row for Project A (SLA + support level), Save
2. Without removing the first row, add a second project-access row for Project B, Save
3. Reload the customer's page and inspect Projects & Entitlements

**Expected Result — record whichever actually happens:**
- **If the guide's prose note is correct:** only one project-access row exists after step 3 (either A was overwritten by B, or B was rejected) — record exactly which
- **If the guide's checklist is correct:** both Project A and Project B rows exist and persist after reload
- Whichever is observed, update `HELPDESK_REQUIREMENTS.md` Known Constraints and `HELPDESK_MEMORY.md` with the confirmed behavior, since the two sections of the user guide disagree
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6) — re-confirms the same finding already documented from Forge (TC-HLP-110/122 resolution, `HELPDESK_MEMORY.md`): **the guide's checklist is correct, the prose note is wrong.** Added a Helpdesk QA Beta row then a Helpdesk QA Alpha row to `gamma.customer` without removing either — reload showed both: customer list's Projects column read "2", Support Level column read "AB-L1 L1" (both levels listed). The "one row at a time" limitation described in `HELPDESK_USER_GUIDE.md` §3.5 does not reflect the real data model on either environment tested — flag that prose line for correction.

---

### TC-HLP-123: Deactivating an organization keeps historical associations

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** An organization with existing customers and ticket history.

**Steps:**
1. Deactivate the organization
2. Attempt to select it for a **new** customer or prepaid budget
3. Open an existing customer/ticket already associated with it

**Expected Result:**
- Step 2: the deactivated organization is not offered for new work
- Step 3: existing historical associations and data remain intact and visible
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6): PASS. Deactivated "Beta Org" (real fixture — `beta.customer` + tickets #67/69/70). New Customer form's Organization dropdown correctly dropped it (only "Alpha Org" + "None" remained, since Alpha Org Subsidiary was also inactive at the time). `beta.customer`'s Customer 360 still showed "Organization Name: Beta Org" intact throughout, both in the identity block and the Beta project's entitlement row. Reactivated Beta Org afterward to restore normal state.

---

### TC-HLP-298: An organization created from within a project's Helpdesk tab does not appear in that project's own Organization view until a customer's project-access row selects it

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** A project with the Helpdesk module enabled (e.g. Helpdesk QA Alpha) and at least one customer with a project-access row on it.

**Steps:**
1. Open the project's own Helpdesk sub-nav → **Organization** tab (`/projects/:id/helpdesk/organization`) and note the current list.
2. Click that same tab's own **New Organization** button (which carries `?project_id=X` in its URL) and create a new organization.
3. Reload the project's Organization tab — check whether the new organization appears.
4. Edit an existing customer who has a project-access row on this project, set that row's Organization to the newly created one, Save.
5. Reload the project's Organization tab again.

**Expected Result:**
- Step 3: the new organization does **not** appear in this project's Organization tab yet, despite having been created from a "New Organization" button that was itself reached from inside this exact project's Helpdesk context — creation origin does not establish the association
- Step 5: the organization **now appears** in this project's Organization tab, because a customer's project-access row on this project actually references it — this is what establishes the (derived, not stored) project association, per `HELPDESK_REQUIREMENTS.md` Known Constraints
- Throughout, the organization is visible in the **global** `/rf_organizations` list from the moment it's created, regardless of whether any project-scoped Organization tab shows it yet
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6): PASS. On Helpdesk QA Alpha's Organization tab (`/projects/3/helpdesk/organization`), only "Alpha Org" was listed (User Count 2). Clicked its own **New Organization** button (`/rf_organizations/new?project_id=3`) and created "Delta Test Org" — it did **not** appear on reload of Alpha's Organization tab, even though `project_id=3` was present in the creation URL the whole time. It **did** immediately appear in the global `/rf_organizations` list (id=5). Edited `alpha.customer`'s Helpdesk QA Alpha project-access row, set its Organization to "Delta Test Org", saved — reloading Alpha's Organization tab now showed **both** "Alpha Org" and "Delta Test Org". Confirms the mechanism precisely: project association is derived entirely from customer project-access-row selection, never from where/how the organization was created. Reverted `alpha.customer`'s Organization back to "Alpha Org" and deleted "Delta Test Org" afterward to restore clean state.

---

### TC-HLP-124: Previewing a project the customer is not linked to is refused

**User Role:** Agent
**Precondition:** A customer entitled to Project A only; Project B exists.

**Steps:**
1. From Customer 360, attempt to force a Portal Preview scoped to Project B (e.g. via URL manipulation)

**Expected Result:**
- The preview is refused — a customer's portal preview cannot show a project they have no entitlement row for
- **Now secondary to TC-HLP-117's revised verdict** — since Portal Preview is not considered part of this plugin's intended functionality (see `HELPDESK_SCOPE.md`), the primary expected result is that the whole route shouldn't be reachable at all, which TC-117 covers and fails. This TC's own scoping check is only meaningful as defense-in-depth evidence for as long as the route continues to exist.
- **CONFIRMED LIVE 2026-08-27** (Local, redmine-docker-6) — the entitlement-scoping mechanism itself is correct: forced `/rf_customers/16/portal?project_id=3` as admin — `beta.customer` (id=16) has zero entitlement to Helpdesk QA Alpha (project_id=3), only to Helpdesk QA Beta (project_id=4). Result: clean **403 Forbidden**, not an exposed preview. **Recorded as PASS for the narrow scoping behavior it tests, but this does not offset TC-HLP-117's FAIL** — the route existing at all is the actual defect now that Portal Preview is out of scope.

---

## Evidence Map

- Case ID: TC-HLP-108 – TC-HLP-124, plus TC-HLP-279–280 (Organization list filter, Customer list Apply/Clear combined-filter, added 2026-08-24), TC-HLP-283 (SLA dropdown project-scoping in Customer form), TC-HLP-284 (Organization dropdown NOT project-scoped, by design), TC-HLP-293–294 (Edit Customer "Send account information" checkbox gates the update-notification email), TC-HLP-296–297 (SLA/Support Level delete-while-linked-to-customer, in `HELPDESK_SLA_ESCALATION.md`), TC-HLP-298 (an organization's project-scoped Organization-tab visibility is derived from customer project-access selection, not creation origin)
- Screenshot: `screenshots/<TC-ID>/` (only if a bug is found — see `CLAUDE.md` §6)
- Log: `logs/`
- Bug reference: see `bugs/_index.md`
