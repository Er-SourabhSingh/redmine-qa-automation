# Test Cases — Redmineflux CRM — Permissions, Privacy Controls & JSON API

> Source: vendor KB — "Permissions" (nine global permissions and the note on Manage CRM Activities),
> "Recommended Role Configurations", "How to Use Privacy Controls", "How to Use the CRM API".
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux CRM Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_crm_qa

## The documented model under test

Nine **global** permissions — there is no project scoping and **no project module to switch off**, so these
permissions plus the privacy rules are the only access control this plugin has.

| Permission | Covers |
|---|---|
| View CRM | Access the workspace |
| Manage Contacts / Companies / Deals / Leads | Create and update — **not delete** |
| View Pipeline | The pipeline board |
| Manage CRM Activities | Log activities; delete **only** ones you authored |
| View Audit Log | The audit log |
| **Delete CRM Data** | **All deletion**, separately |

Privacy rules, as stated: admins see everything; non-admins see public records, **plus private records they
created**, **plus private records assigned to them**. Counts reflect only visible records.

The API enforces the same rules: *"A user without Manage Contacts permission will receive a 403 response when
attempting to create or update a contact through the API."*

## Methodology — mandatory for every case

1. **Positive UI** — the permitted role performs the action through real navigation and it works.
2. **Negative UI** — the denied role sees no control.
3. **Negative endpoint** — the denied role is refused when the request is sent **directly**, including through
   `/api`.

Leg 3 decides every case here. The API is a fully documented second write path over the same data, and the KB
promises it enforces the same rules — this suite is where that promise is checked.

## Test accounts required

- **Admin**
- **SalesRep** — the KB's recommended set: View CRM, the four manage permissions, View Pipeline,
  Manage CRM Activities — **and deliberately no Delete CRM Data**
- **SalesManager** — SalesRep plus View Audit Log and Delete CRM Data
- **Viewer** — View CRM only
- **NoAccess** — a logged-in user with no CRM permission
- **OwnerA** and **OwnerB** — two non-admins, for the privacy cases

Without SalesRep-without-delete and two separate non-admins, the plugin's two most distinctive boundaries are
untestable.

---

## Permissions matrix to confirm

| Action | Admin | SalesManager | SalesRep | Viewer | NoAccess |
|--------|-------|--------------|----------|--------|----------|
| Open the CRM workspace | | | | | |
| Create / update a contact, company, deal, lead | | | | | |
| **Delete** any CRM record | | | | | |
| View the pipeline | | | | | |
| Drag a deal between stages | | | | | |
| Log an activity | | | | | |
| Delete own activity / another's activity | | | | | |
| View the audit log | | | | | |
| Import / export | | | | | |
| Link CRM records to an issue | | | | | |
| Convert a lead | | | | | |

---

## Functional Cases — permissions

---

### TC-CRM-184: Admin has full access

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Exercise every row of the matrix.

**Expected Result:**
- All succeed, including deletion and the audit log.

---

### TC-CRM-185: View CRM alone is read-only

**User Role:** Viewer
**Priority:** High
**Steps:**
1. Confirm the workspace, lists and detail pages are viewable.
2. Confirm no create, edit, delete, import, convert or activity controls appear.
3. Send, **directly**, one request of each kind: contact create, deal update, lead convert, activity create,
   import, and delete.

**Expected Result:**
- Viewing works; **all six direct requests refused with 403**.
- This is the KB's Read-Only Viewer role, so it should be exactly this shape.

---

### TC-CRM-186: The four manage permissions are separate

**User Role:** A role with **Manage Contacts** only
**Priority:** High
**Steps:**
1. Create and update a contact — expect success.
2. Attempt to create a company, a deal and a lead, through the UI and **directly**.

**Expected Result:**
- Only contacts are manageable; the other three are refused at the endpoint.
- A single collapsed "manage CRM" check would hand a contacts-only role the whole database.

---

### TC-CRM-187: **Manage does not include delete**

**User Role:** SalesRep (all four manage permissions, **no** Delete CRM Data)
**Priority:** High
**Steps:**
1. Confirm no Delete control appears on any contact, company, deal or lead.
2. Send the delete request **directly** for each of the four entity types.

**Expected Result:**
- All four refused with 403.
- **This is the single most important case in the suite.** The KB states the separation twice and builds its
  recommended Sales Representative role around it. If manage implies delete, every sales rep can permanently
  destroy customer records — with documented cascades that also destroy activities and issue links, and no undo
  anywhere in the plugin.

---

### TC-CRM-188: Delete CRM Data covers all four entity types

**User Role:** SalesManager
**Priority:** High
**Steps:**
1. Delete a contact, a company, a deal and a lead.

**Expected Result:**
- All succeed, and each follows its documented cascade (TC-CRM-070, 309, 425).
- Converted leads remain undeletable even for this role (TC-CRM-177).

---

### TC-CRM-189: Manage CRM Activities permits authoring and own-deletion only

**User Role:** SalesRep and a second member
**Priority:** High
**Steps:**
1. Log an activity — expect success.
2. Attempt to delete **another user's** activity, through the UI and directly.
3. Attempt to delete an **auto-generated** activity, directly.

**Expected Result:**
- Own activity deletable; the other two refused at the endpoint.
- The KB scopes this permission precisely, and an unenforced endpoint would let anyone erase a colleague's record
  of a customer call or the automatic trail of a deal being reopened.

---

### TC-CRM-190: View Pipeline and Manage Deals are distinct

**User Role:** A role with **View Pipeline** but not Manage Deals
**Priority:** High
**Steps:**
1. Confirm the pipeline renders but cards are not draggable.
2. Send the `update_stage` request directly.

**Expected Result:**
- Refused (paired with TC-CRM-109).

---

### TC-CRM-191: View Audit Log is its own permission

**User Role:** SalesRep (no View Audit Log)
**Priority:** High
**Steps:**
1. Confirm the Audit Log entry is absent; request its URL and `/api/crm_audit_logs` directly.

**Expected Result:**
- Refused at both (paired with TC-CRM-051).

---

### TC-CRM-192: The recommended role configurations work as described

**User Role:** SalesRep, SalesManager, Viewer
**Priority:** High
**Steps:**
1. For each, exercise exactly the capabilities the KB lists for that role, and confirm the ones it omits are
   refused.

**Expected Result:**
- Each role behaves as documented.
- This validates that the vendor's recommended setup is actually usable — if a Sales Rep cannot do their job
  without Delete CRM Data, teams will grant it anyway and the separation in TC-CRM-187 becomes theoretical.

---

## Functional Cases — privacy

---

### TC-CRM-193: Admins see all private records

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. With private records created by OwnerA and OwnerB, view each list.

**Expected Result:**
- All are visible, per the KB.

---

### TC-CRM-194: Non-admins see public records

**User Role:** OwnerB
**Priority:** Medium
**Steps:**
1. View records that are not marked private.

**Expected Result:**
- All visible.

---

### TC-CRM-195: A creator sees their own private records

**User Role:** OwnerA
**Priority:** Medium
**Steps:**
1. Create private records of each type and view the lists.

**Expected Result:**
- Visible to OwnerA.

---

### TC-CRM-196: An assignee sees private records assigned to them

**User Role:** OwnerA creates, OwnerB is assigned
**Priority:** High
**Steps:**
1. OwnerA creates a private contact and assigns it to OwnerB.
2. OwnerB views the contact list and opens the record.

**Expected Result:**
- Visible to OwnerB, per the third privacy rule.
- This is the least obvious of the three rules and the one most likely to be omitted in implementation.

---

### TC-CRM-197: A non-owner, non-assignee cannot see a private record

**User Role:** OwnerB
**Priority:** High
**Steps:**
1. OwnerA creates a private contact, company, deal and lead, assigned to nobody.
2. As OwnerB: confirm each is absent from the lists; request each **directly** by ID; request its **activities**
   via the nested API path; and search for it.

**Expected Result:**
- Absent from the lists, **and refused at every direct route**, with no name, email or activity content in any
  response body.
- The nested activity route is the one most likely to be missed (paired with TC-CRM-021), and activity content is
  often the most sensitive material in the plugin.

---

### TC-CRM-198: Counts reflect only visible records

**User Role:** OwnerA and OwnerB
**Priority:** High
**Steps:**
1. Compare each user's dashboard totals, list counts and analytics figures.

**Expected Result:**
- They legitimately differ, each reflecting only what that user can see, per the KB.
- **Record this explicitly**, so a future "the counts disagree" report is triaged as documented behaviour rather
  than a bug — and so that a count which is too *high* is recognised as the real leak (paired with TC-CRM-048).

---

### TC-CRM-199: Privacy survives edits and reassignment

**User Role:** OwnerA, then OwnerB
**Priority:** High
**Steps:**
1. Toggle a record's privacy off and on; reassign a private record away from OwnerB.

**Expected Result:**
- Visibility follows the current state immediately: making a record public reveals it, and reassigning it away
  removes OwnerB's access at once — including at the API.

---

## Negative Cases — the JSON API

---

### TC-CRM-200: The API requires authentication

**User Role:** No credentials
**Priority:** High
**Steps:**
1. Call `GET /api/crm/ping`, then the contacts, deals and audit-log endpoints, with no `X-Redmine-API-Key`.

**Expected Result:**
- Refused for the data endpoints.
- Record what `ping` returns unauthenticated — a health check may legitimately be open, but it must disclose
  nothing about the instance or its data.

---

### TC-CRM-201: The API enforces the same permissions as the UI

**User Role:** Viewer, then SalesRep
**Priority:** High
**Steps:**
1. As Viewer, attempt `POST` and `PUT` on contacts, companies, deals and leads.
2. As SalesRep, attempt `DELETE` on each, plus `POST /api/leads/:id/convert` and
   `PUT /api/deals/:id/update_stage` on a closed deal.

**Expected Result:**
- Viewer's writes refused with **403** — the KB states this outcome explicitly for a user without Manage Contacts.
- SalesRep's deletes refused (TC-CRM-187); the closed-deal stage update refused (TC-CRM-102).
- **The API is the second write path over the same data.** Every rule proved in the UI must hold here, and this is
  where a rule implemented only in a controller filter or a view would be exposed.

---

### TC-CRM-202: API import and export endpoints are gated

**User Role:** Viewer and NoAccess
**Priority:** High
**Steps:**
1. Call the import and export endpoints for contacts, companies, deals and leads directly as each user.

**Expected Result:**
- Refused.
- **The export endpoints are the highest-value target in the plugin** — a single unguarded call returns the entire
  customer database, and unlike a screen view it produces a file that can be forwarded anywhere (paired with
  TC-CRM-203).

---

### TC-CRM-204: API responses respect privacy

**User Role:** OwnerB
**Priority:** High
**Steps:**
1. Call the list endpoints and compare against OwnerA's private records.
2. Call `GET` on a specific private record's ID, and on its nested activities.

**Expected Result:**
- Private records OwnerB cannot see are absent from the list payloads and refused individually.
- Check the **payload**, not a rendered page — a list endpoint that returns everything and relies on the UI to
  filter would expose every private customer record to any authenticated user.

---

### TC-CRM-205: API validation matches the UI

**User Role:** SalesRep
**Priority:** High
**Steps:**
1. Via the API, attempt: a contact with a duplicate email; a deal with probability 150; a Lost deal with no lost
   reason; a lead with status `Converted`; and a required custom field left blank.

**Expected Result:**
- All five refused with the same rules the UI applies.
- **The API must not be a route around validation.** A Lost deal created with no lost reason, or a lead forced to
  `Converted`, produces exactly the unrecoverable records described in TC-CRM-089 and TC-CRM-166.

---

### TC-CRM-206: API issue-link operations require issue-edit permission

**User Role:** A member with full CRM permissions but no edit-issues on the project
**Priority:** High
**Steps:**
1. Call the link-contact, unlink-contact, link-deal and unlink-deal endpoints directly.

**Expected Result:**
- All refused (paired with TC-CRM-040). Linking writes to the issue and must be gated by the issue's permission.

---

### TC-CRM-207: An API key cannot act beyond its user

**User Role:** SalesRep's API key
**Priority:** High
**Steps:**
1. Using that key, attempt an action only an admin can perform — deleting a record, or reading the audit log.

**Expected Result:**
- Refused.
- The key carries the user's own permissions and nothing more; a key-authenticated path that bypasses the UI's
  checks would be Critical, and the CRM API is a documented, fully featured surface.

---

### TC-CRM-208: Permission revocation takes effect without re-login

**User Role:** Admin + SalesRep
**Priority:** High
**Steps:**
1. Remove Manage Deals while SalesRep has a deal edit form open, then have them save, and separately call the API.

**Expected Result:**
- Both refused. Permissions are evaluated per request, not cached in the session or at API-key issue time.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
