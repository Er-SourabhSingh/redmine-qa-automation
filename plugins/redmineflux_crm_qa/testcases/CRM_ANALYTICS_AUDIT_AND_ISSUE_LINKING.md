# Test Cases — Redmineflux CRM — Analytics, Audit Log, Issue Linking & Custom Fields

> Source: vendor KB — "How to Use Analytics", "How to Use the Audit Log",
> "How to Link CRM Records with Redmine Issues", "How to Use Custom Fields".
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux CRM Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_crm_qa

## Navigation methodology

CRM → **Analytics** / **Audit Log**; and the CRM panel on a Redmine issue for linking.

> **Analytics figures are what a sales team reports upward.** Every metric below should be reconciled against the
> underlying records rather than accepted because it looks plausible — a wrong win rate or forecast is acted on
> for months before anyone questions it.

---

## Functional Cases — Analytics

---

### TC-CRM-801: All sixteen documented metrics are present

**User Role:** Member with **View CRM**
**Steps:**
1. Open Analytics and enumerate the metrics.

**Expected Result:**
- Total deals; open deals; won deals; lost deals; total deal value; open deal value; won deal value; weighted
  forecast; win rate; average deal value; contacts with deals; contacts without deals; active contacts in the last
  30 days; pipeline by stage; deal momentum trends; win/loss mix; top deal owners.
- Record a result per metric — a blanket pass would hide one that never populates.

---

### TC-CRM-802: Deal counts reconcile

**User Role:** Member
**Steps:**
1. Compare total, open, won and lost deal counts against the deal list filtered accordingly.

**Expected Result:**
- **Open + won + lost equals total.** If it does not, some deals are being classified into no bucket at all —
  likely those in a custom stage — and the arithmetic across the four is the cheapest way to detect it.

---

### TC-CRM-803: Deal values reconcile

**User Role:** Member
**Steps:**
1. Compare total, open and won deal value against the sums of the matching deals' amounts.

**Expected Result:**
- Each matches. Note whether lost value is excluded from "total deal value" or included, and record it — the
  phrase is ambiguous and the answer changes what the figure means.

---

### TC-CRM-804: Weighted forecast

**User Role:** Member
**Steps:**
1. Compute the forecast by hand for all open deals (amount × probability ÷ 100) and compare.

**Expected Result:**
- Exact match, and consistent with the pipeline's own weighted forecast (TC-CRM-414).
- Two surfaces showing different forecasts for the same data is a defect regardless of which is right.

---

### TC-CRM-805: Win rate

**User Role:** Member
**Steps:**
1. With a known set — e.g. 3 won, 1 lost, 5 open — check the win rate.

**Expected Result:**
- 75%, from won ÷ (won + lost). **Open deals are not in the denominator**, per the KB's statement that won and
  lost both count toward it (paired with TC-CRM-423).

---

### TC-CRM-806: Average deal value and contact metrics

**User Role:** Member
**Steps:**
1. Check average deal value; then contacts with deals, contacts without deals, and active contacts in the last
   30 days.

**Expected Result:**
- The average matches total value ÷ count over whatever set it claims to cover — record which.
- **Contacts with + contacts without equals the total contact count.**
- "Active in the last 30 days" is defined by something observable (an activity, presumably) — record the
  definition so the figure can be reproduced.

---

### TC-CRM-807: Period filters

**User Role:** Member
**Steps:**
1. Apply **This Week**, **This Month**, **This Quarter**, **This Year** in turn.

**Expected Result:**
- All four are offered and each narrows the data correctly.
- Check the boundaries deliberately: This Week's start day, This Quarter's start month, and a record dated on the
  first day of a period. Off-by-one boundaries silently move revenue between reporting periods.

---

### TC-CRM-808: Charts agree with their numbers

**User Role:** Member
**Steps:**
1. Compare pipeline by stage, deal momentum, win/loss mix and top deal owners against the underlying data.

**Expected Result:**
- Each chart matches its own figures. A chart that disagrees with its table is the half people actually look at.

---

## Functional Cases — Audit log

---

### TC-CRM-809: The audit log shows cross-record history

**User Role:** Member with **View Audit Log**
**Steps:**
1. Perform a mix of manual activities, automatic events and an email activity; open the Audit Log.

**Expected Result:**
- All three kinds appear — manual user activities, system-generated CRM events, and email activity results — per
  the KB.

---

### TC-CRM-810: Filter and search

**User Role:** Member with View Audit Log
**Steps:**
1. Filter by activity type; search by content.

**Expected Result:**
- Both narrow correctly, and entries name the actor, the record and the timestamp.
- Attribution is what makes the log usable — including for the email-sender question raised in TC-CRM-612.

---

### TC-CRM-811: Entries survive their source record's deletion

**User Role:** Member with Delete CRM Data, then View Audit Log
**Steps:**
1. Note an audit entry for a contact, delete the contact, then re-check the audit log.

**Expected Result:**
- Record precisely what happens.
- There is a real tension here: the KB calls the audit log permanent, while the documented cascade destroys a
  deleted record's activities. **If deleting a record erases its audit trail, then deletion is untraceable** — and
  the log cannot serve the purpose it is described as serving. Whichever way it falls, this belongs in the plugin
  memory file.

---

### TC-CRM-812: The audit log is read-only for everyone, including admins

**User Role:** Admin, and a member with View Audit Log
**Steps:**
1. Confirm no edit or delete control appears for either user.
2. Send edit and delete requests **directly** for an audit entry, as both users.

**Expected Result:**
- Refused for both, at the endpoint.
- The KB states this in unusually strong terms — *"cannot be edited or deleted by any user, including
  administrators"*. **An editable audit log is not an audit log**, and an endpoint that accepts an admin's delete
  would void the guarantee entirely.

---

## Functional Cases — Issue linking

---

### TC-CRM-813: Link a contact and a deal to an issue

**User Role:** Member with CRM permissions **and** edit-issues on that project
**Steps:**
1. Open an issue → the CRM panel → link a contact, then a deal.

**Expected Result:**
- Both links are shown on the issue, and the issue appears in each CRM record's **Linked Redmine Issues** section.

---

### TC-CRM-814: One contact and one deal per issue

**User Role:** Member
**Steps:**
1. Link a second contact, then a second deal, to the same issue.

**Expected Result:**
- The existing link is **replaced** rather than accumulating, per the KB's "existing links can be replaced".
- Record whether the replacement is explicit — silently dropping a link a colleague added is a small but real
  surprise.

---

### TC-CRM-815: Unlink

**User Role:** Member
**Steps:**
1. Use Unlink beside the linked contact, then the linked deal; confirm.

**Expected Result:**
- The links are removed from both the issue and the CRM record. **Neither the issue nor the CRM record is
  deleted** — only the association.

---

### TC-CRM-816: Create a CRM record from an issue

**User Role:** Member
**Steps:**
1. Use **New Contact** and **New Deal** in the issue's CRM panel; fill and save each.

**Expected Result:**
- Each record is created and **automatically linked** to the issue, per the KB.
- The record also appears normally in the CRM workspace.

---

### TC-CRM-817: Linking requires issue-edit permission

**User Role:** A member with full CRM permissions but **without** edit-issues on that project
**Steps:**
1. Confirm no link/unlink controls appear in the CRM panel.
2. Send the link and unlink requests **directly**.

**Expected Result:**
- Refused at the endpoint — the KB states issue-edit permission is required.
- Linking writes to the issue, so it must be gated by the issue's own permission, not only by the CRM ones.

---

### TC-CRM-818: Links respect CRM privacy

**User Role:** A member who cannot see a private contact
**Steps:**
1. Open an issue that another user linked to that private contact.

**Expected Result:**
- The contact's name and details are **not** disclosed in the issue's CRM panel.
- **This is the plugin's sharpest leak path**: the issue page is a completely different controller, so the privacy
  rule has to be re-applied there. A private customer record surfacing on a widely visible issue would expose
  exactly what the privacy flag exists to protect.

---

### TC-CRM-819: Deleting an issue removes its links

**User Role:** Manager
**Steps:**
1. Delete an issue that has linked CRM records, then open those records.

**Expected Result:**
- The CRM records survive with the link removed, and their Linked Redmine Issues section shows no dangling entry.

---

## Functional Cases — Custom fields

---

### TC-CRM-820: Custom fields on all four entity types

**User Role:** Admin to configure, Member to use
**Steps:**
1. Configure Redmine custom fields for contacts, companies, deals and leads.
2. Enter values on each form and view the detail pages.

**Expected Result:**
- Fields appear on all four forms, values save, and populated values show on the detail pages.

---

### TC-CRM-821: Custom field types and validation

**User Role:** Member
**Steps:**
1. Use list, text, date, integer and boolean custom fields; enter an invalid value for each typed field; and leave
   a required one blank.

**Expected Result:**
- Each renders the correct input; invalid values are rejected; required fields are enforced.
- **Enforcement must hold on the API too** (TC-CRM-918) and during **import**, which has no column for custom
  fields — record whether imported records can therefore bypass a required custom field.

---

### TC-CRM-822: Custom fields on the lead conversion form

**User Role:** Member
**Steps:**
1. Convert a lead with the deal option enabled and fill the deal custom fields on the conversion form.

**Expected Result:**
- The values are stored on the created deal, per the KB.
- If a required deal custom field is not offered on the conversion form, conversion would create an invalid deal
  or fail late — record which (paired with TC-CRM-521).

---

### TC-CRM-823: Custom field visibility

**User Role:** A member whose role cannot see a restricted custom field
**Steps:**
1. Open a CRM record with that field populated, and check the exports and the API response.

**Expected Result:**
- The value is not shown in any of the three.
- Exports and API payloads are the easy places to forget a field-level visibility check, and unlike the screen they
  produce a file or a response that can be forwarded.

---

## Negative Cases

---

### TC-CRM-824: Analytics with no data

**User Role:** Member
**Steps:**
1. Open Analytics on an instance with no deals, and with a period filter matching nothing.

**Expected Result:**
- Clean empty states — **no `NaN`, no divide-by-zero** in win rate or average deal value, and no broken charts.
  Both metrics divide, so a zero denominator is the obvious hazard.

---

### TC-CRM-825: Analytics respects privacy

**User Role:** A non-admin who cannot see certain private deals
**Steps:**
1. Compare the analytics totals against the same figures computed by an admin.

**Expected Result:**
- The non-admin's figures **exclude** the private deals they cannot see, consistent with the KB's statement that
  counts reflect only visible records.
- An aggregate that silently includes hidden deals discloses their existence and value even without naming them —
  a real leak, and one that would otherwise be dismissed as a rounding discrepancy.

---

### TC-CRM-826: Audit log respects record visibility

**User Role:** A member with View Audit Log who cannot see certain private records
**Steps:**
1. Search the audit log for content belonging to a private record they cannot access.

**Expected Result:**
- Record the behaviour. If the audit log shows entries for records the user cannot open, it becomes a side channel
  around the privacy rules — a plausible gap, since the log is described as a **cross-record** history and may
  well be queried without the per-record filter.

---

### TC-CRM-827: Analytics access requires View CRM

**User Role:** A user with no CRM permissions
**Steps:**
1. Request the analytics page, its data endpoint and both export endpoints **directly**.

**Expected Result:**
- All refused. The analytics export is a complete commercial summary — pipeline value, win rate and top owners —
  in a single file.

---

### TC-CRM-828: Audit log access requires View Audit Log

**User Role:** A member with View CRM but without View Audit Log
**Steps:**
1. Confirm the Audit Log entry is absent; request its URL and the `/api/crm_audit_logs` endpoint directly.

**Expected Result:**
- Refused at both. The audit log aggregates activity across every record, so it is the widest single read in the
  plugin.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
