# Test Cases — Redmineflux CRM — Installation, Plugin Settings & Dashboard

> Source: vendor KB — "Version Compatibility", "Installation", "Configuration" (currency, stages, territories,
> lead statuses, lead sources, and the four important notes), "CRM Overview", "How to Open CRM",
> "How to Use the Dashboard", "Troubleshooting", "Uninstallation of Plugin".
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux CRM Plugin
- Version: (record at execution time)
- Redmine version: (record — KB declares 4.x, 5.x, 6.x; Ruby 2.5+; Rails 5.2+)
- Path: plugins/redmineflux_crm_qa

## Navigation methodology

Administration → Plugins → **Redmineflux CRM** → **Configure** for settings; **CRM** in the top menu for the
workspace.

> **Warning:** the configuration lists here define stages and statuses that existing records already use. Record
> the originals and restore them; several cases deliberately remove values that the KB warns against removing.

---

## Functional Cases — Installation

---

### TC-CRM-101: Plugin appears after installation

**User Role:** Admin
**Preconditions:** Folder copied as `plugins/redmineflux_crm`, `bundle install` and migrations run, restarted.
**Steps:**
1. Open Administration → Plugins.

**Expected Result:**
- The plugin is listed with a **Configure** link.
- The KB's first troubleshooting step is confirming the folder name, so verify the negative too: rename, restart,
  confirm a loud failure, then restore.

---

### TC-CRM-102: Migrations complete cleanly

**User Role:** Admin
**Steps:**
1. Run the migration, restart, open the CRM workspace.

**Expected Result:**
- No missing-table exception in the log; the Dashboard renders.

---

### TC-CRM-103: Permissions must be granted before anything works

**User Role:** Admin, then a member with no CRM permissions
**Steps:**
1. Without granting any CRM permission, have the member click **CRM** in the top menu.
2. Grant **View CRM** and retry.

**Expected Result:**
- Refused before the grant; the workspace opens after it.
- The KB makes granting permissions step 6 of installation — so "CRM does not work" immediately after install is
  usually configuration, not a defect.

---

### TC-CRM-104: Assets load

**User Role:** Any
**Steps:**
1. Open the pipeline board and inspect the console and Network tab.

**Expected Result:**
- No 404s; drag-and-drop responds. The KB notes drag-and-drop **requires JavaScript**, so confirm by behaviour.

---

## Functional Cases — Plugin settings

---

### TC-CRM-105: Default values match the documentation

**User Role:** Admin
**Steps:**
1. On a fresh install, read the Configure page.

**Expected Result:**
- Currency **USD**; stages **New, Qualified, Proposal, Negotiation, Won, Lost**; lead statuses **New, Contacted,
  Qualified, Unqualified**; lead sources **Website, Referral, Cold Call, Email Campaign, Social Media, Other**.
- A missing default is a defect against a precisely documented list.

---

### TC-CRM-106: Default currency applies to new deals

**User Role:** Admin then a deal owner
**Steps:**
1. Change the default currency; save; create a new deal.
2. Open a deal created **before** the change.

**Expected Result:**
- The new deal uses the new currency; the older deal keeps its original one.
- **Currency is immutable per deal** (TC-CRM-409), so a retroactive change would silently restate the value of
  historic deals in a different currency — a serious reporting defect.

---

### TC-CRM-107: Add a custom deal stage

**User Role:** Admin
**Steps:**
1. Add a stage; save; create a deal in it and view the pipeline.

**Expected Result:**
- The stage appears as a pipeline column and is selectable on the deal form.

---

### TC-CRM-108: Territories, lead statuses and lead sources are configurable

**User Role:** Admin
**Steps:**
1. Add a territory, a lead status and a lead source; save.
2. Check each on the relevant form and filter.

**Expected Result:**
- All three appear where expected — territory on the deal form and the pipeline filter, status and source on the
  lead form.

---

### TC-CRM-109: Configuration changes are not retroactive

**User Role:** Admin
**Steps:**
1. With deals and leads in various stages and statuses, rename a stage and a status.
2. Reopen the existing records.

**Expected Result:**
- Existing records keep their current values, exactly as the KB states.
- Record how a record holding a now-renamed value is displayed — an orphaned value shown as blank would make those
  records look unclassified.

---

## Negative Cases — the documented configuration hazards

---

### TC-CRM-110: Removing the Won or Lost stage

**User Role:** Admin
**Steps:**
1. Remove **Won** from the stages list and save.
2. Check the dashboard's open-deal count, the pipeline's won revenue, and the analytics win rate.

**Expected Result:**
- Either the removal is refused with an explanation, or the consequence is clearly visible.
- The KB warns not to remove these because they carry **closed-deal behaviour**. If closed deals silently start
  counting as open, every pipeline and forecast figure on the instance becomes wrong with nothing to indicate it —
  worth filing as a High-severity finding if there is no guard or warning.

---

### TC-CRM-111: Removing the Qualified lead status

**User Role:** Admin
**Steps:**
1. Remove **Qualified** from the lead statuses and save.
2. Attempt to convert a lead.

**Expected Result:**
- Either refused, or conversion is now impossible — and the UI explains why.
- The KB states plainly that Qualified is required for conversion. **Silently disabling the plugin's main workflow
  through a settings edit, with no warning, is a defect worth reporting** even though the documentation warns
  against it.

---

### TC-CRM-112: Adding Converted to the lead statuses

**User Role:** Admin
**Steps:**
1. Add **Converted** manually to the lead statuses and save.
2. Attempt to set it on a lead, then convert a different lead normally.

**Expected Result:**
- The KB says this value is reserved and applied automatically. Ideally it is refused.
- If it is accepted, record what breaks: a manually "Converted" lead that was never converted has no contact, no
  deal and no conversion activity, yet is locked against deletion and re-conversion (TC-CRM-518, 519) — an
  unrecoverable record created through a settings field.

---

### TC-CRM-113: Removing a stage or status currently in use

**User Role:** Admin
**Steps:**
1. Remove a stage that deals currently occupy, and a status that leads currently hold.
2. Open those records, the pipeline and the lead list.

**Expected Result:**
- The records remain openable and editable, with the orphaned value visible rather than blank.
- **They must not become unopenable or uneditable** — that would strand real records behind a configuration
  change.

---

## Functional Cases — Workspace and dashboard

---

### TC-CRM-114: CRM opens from the top menu

**User Role:** Member with View CRM
**Steps:**
1. Click **CRM** in the top menu.

**Expected Result:**
- The global workspace opens with Dashboard, Leads, Contacts, Companies, Deals and Analytics in the left
  navigation; Audit Log appears only with its permission and Plugin Settings only for admins.

---

### TC-CRM-115: CRM is global, not project-scoped

**User Role:** Member
**Steps:**
1. Confirm the entry is in the **top** menu and check whether any project menu or module exists for CRM.

**Expected Result:**
- Global only. Record that there is **no project module to disable** — as with the Dashboard plugin, that means
  access is governed solely by the global permissions and privacy rules, which raises the importance of the
  permissions suite.

---

### TC-CRM-116: Dashboard shows all nine documented panels

**User Role:** Member with View CRM
**Steps:**
1. Open the Dashboard.

**Expected Result:**
- Total contacts, total companies, total open deals, unconverted leads, recent contacts, recent deals, upcoming
  deals, recent activities and pipeline summary by stage — all nine, per the KB.

---

### TC-CRM-117: Dashboard counts are accurate

**User Role:** Member
**Steps:**
1. Compare each count against the corresponding list.

**Expected Result:**
- They match **for this user**.
- **Open deals must exclude Won and Lost** — the most likely count error, and the one that misstates the pipeline.
- Unconverted leads must exclude leads whose status is Converted.

---

### TC-CRM-118: Quick Create

**User Role:** Member with the manage permissions
**Steps:**
1. Use Quick Create for a lead, contact, company and deal in turn.

**Expected Result:**
- Each opens the correct form and creates a record that appears on the dashboard.

---

### TC-CRM-119: Dashboard export

**User Role:** Member with View CRM
**Steps:**
1. Export the dashboard to CSV, then XLS.

**Expected Result:**
- Both formats download and their figures match the screen.
- **The export respects privacy** — it must contain only records this user can see (paired with TC-CRM-906).

---

## Uninstallation

---

### TC-CRM-120: Clean uninstall

**User Role:** Admin
**Preconditions:** **Database backup taken.**
**Steps:**
1. Run `bundle exec rake redmine:plugins:migrate NAME=redmineflux_crm VERSION=0 RAILS_ENV=production`.
2. Remove the plugin folder and restart.

**Expected Result:**
- Redmine starts cleanly and the CRM top-menu entry is gone.
- **Redmine issues that had linked CRM records still open normally** with no broken CRM panel — the links are
  plugin data, but the issues are not, and breaking them would be Critical.
- Note in the handoff that all CRM data — contacts, companies, deals, leads, activities and the audit log — is
  destroyed by the rollback. For a system holding customer records, that is worth stating explicitly to whoever
  runs it.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
