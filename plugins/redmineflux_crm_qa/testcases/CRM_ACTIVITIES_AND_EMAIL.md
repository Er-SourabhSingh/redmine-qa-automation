# Test Cases — Redmineflux CRM — Activities, Email Activities & Templates

> Source: vendor KB — "How to Add Activities", "How to Send an Email Activity",
> "How to Review Automatic CRM Activities", "How to Use Email Templates", and the note under Permissions that
> activities have **no edit or update function**.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux CRM Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_crm_qa

## Navigation methodology

Open a contact, company, deal or lead → **Recent Activities** → **Add Activity**.

> **Activities are immutable by design.** The KB states there is no edit or update function at all: once saved,
> content cannot be changed. That makes the timeline a record of what was actually said and when — and it makes
> TC-CRM-005 a real test of whether an edit path exists anywhere, not a formality.
>
> For the email cases, check Administration → Settings → General → **Host name and path** first, and confirm
> outgoing mail is configured, or the results are meaningless.

---

## Functional Cases — Adding activities

---

### TC-CRM-001: All five activity types on a contact

**User Role:** Member with **Manage CRM Activities**
**Steps:**
1. On a contact, add one of each type using the pill buttons: **Note, Call, Meeting, Email, Task**.

**Expected Result:**
- All five types are offered and each saves with its content and type visible in the timeline.

---

### TC-CRM-002: Activities on all four entity types

**User Role:** Member
**Steps:**
1. Add an activity to a contact, a company, a deal and a lead.

**Expected Result:**
- Each appears on its own record's timeline only — an activity logged on a deal must not appear on its contact's
  timeline unless the plugin deliberately aggregates, in which case record that behaviour.

---

### TC-CRM-003: Timeline ordering and attribution

**User Role:** Member
**Steps:**
1. Add several activities over time and review the timeline.

**Expected Result:**
- Ordered consistently (newest first or oldest first) with each showing its author and timestamp.
- Attribution is what makes the timeline evidentiary; an unattributed entry is not useful.

---

### TC-CRM-004: Activity content validation

**User Role:** Member
**Steps:**
1. Save an activity with empty content; then with a very long body; then with a script tag.

**Expected Result:**
- Empty content is refused — an empty timeline entry records nothing.
- Long content does not break the timeline layout.
- **Script content is escaped and never executes**, in the timeline, the audit log and any export. The timeline
  renders one user's text into every colleague's screen, so this is a genuine stored-XSS surface.

---

## Negative Cases — immutability and deletion

---

### TC-CRM-005: There is no way to edit an activity

**User Role:** The activity's author, and an Admin
**Steps:**
1. Confirm no edit control appears on any activity, for either user.
2. Attempt an update **directly** at the activity endpoint (the API documents list, create and delete only — not
   update).

**Expected Result:**
- No edit control, and the direct update is refused or the endpoint does not exist.
- The KB states this explicitly. **An editable activity would let someone rewrite the record of a call or an email
  after the fact**, which defeats the timeline's entire purpose — and the API's own documented verb list implies
  no update route should exist.

---

### TC-CRM-006: Only the author or an admin can delete

**User Role:** Author, a different member with Manage CRM Activities, and an Admin
**Steps:**
1. The author deletes their own — expect success.
2. The other member attempts to delete the author's activity, through the UI and **directly**.
3. The admin deletes someone else's — expect success.

**Expected Result:**
- The other member is refused at the endpoint.
- The KB scopes this permission to "delete activities they authored", so a member able to delete a colleague's
  activity through the endpoint could quietly remove evidence of a customer interaction.

---

### TC-CRM-007: Auto-generated activities are protected

**User Role:** Member with Manage CRM Activities
**Steps:**
1. Attempt to delete a system-generated activity — a stage change or a conversion entry — through the UI and
   directly.

**Expected Result:**
- Refused for a regular user, per the KB.
- These entries are the automatic audit trail of stage changes and conversions; a user able to delete them could
  erase the record of a deal being reopened or a lead being converted.

---

## Functional Cases — Email activities

---

### TC-CRM-008: Send an email activity

**User Role:** Member with Manage CRM Activities
**Preconditions:** Working outgoing mail; **Host name and path** verified.
**Steps:**
1. Choose **Email**; confirm **From** is pre-filled with the user's Redmine email; enter subject, a valid To
   address and content; Save.
2. Check the recipient mailbox.

**Expected Result:**
- The email is delivered, and the timeline shows **Sent** with a sent time.

---

### TC-CRM-009: All four email fields are required

**User Role:** Member
**Steps:**
1. Save with each of subject, from, to and content omitted in turn.

**Expected Result:**
- All four refused with a message naming the field, per the KB.

---

### TC-CRM-010: Invalid To address

**User Role:** Member
**Steps:**
1. Enter `notanemail`, then `a@`, as the To address.

**Expected Result:**
- Refused — the KB requires a valid email address.

---

### TC-CRM-011: Failed delivery is reported honestly

**User Role:** Member
**Steps:**
1. With mail delivery unavailable (or an unroutable recipient domain), save an email activity.

**Expected Result:**
- The timeline shows **Failed** with error details, per the KB.
- **The activity must not show Sent when nothing was delivered.** A false Sent status is worse than a failure: the
  team believes the customer was contacted, and nobody follows up. High severity if it misreports.

---

### TC-CRM-012: The From address cannot be used to impersonate

**User Role:** Member
**Steps:**
1. Change the pre-filled **From** address to another user's address, or to an external one, and send.

**Expected Result:**
- Record the behaviour precisely. The field is editable by design, but sending mail that appears to come from a
  colleague — or from an arbitrary external address — is a spoofing path that leaves the organisation's mail
  server.
- Whatever the plugin allows, the **audit log must record who actually sent it** (TC-CRM-033), so the real sender
  is recoverable.

---

## Functional Cases — Automatic activities

---

### TC-CRM-013: Record creation is logged

**User Role:** Member
**Steps:**
1. Create a contact, company, deal and lead, then open each record's timeline.

**Expected Result:**
- Each shows an automatic creation entry.

---

### TC-CRM-014: Stage, status and conversion changes are logged

**User Role:** Member
**Steps:**
1. Change a deal's stage, change a lead's status, and convert a lead.

**Expected Result:**
- Each produces an automatic entry naming the old and new values where applicable.
- The stage-change entry must appear for a **drag-and-drop** change as well as an edit-form change
  (paired with TC-CRM-100) — two code paths, one required outcome.

---

### TC-CRM-015: Assignee changes are logged

**User Role:** Member
**Steps:**
1. Change the assignee on a contact, a deal and a lead.

**Expected Result:**
- Each is logged automatically, naming the previous and new assignee. Reassignment is an accountability change, so
  the trail matters.

---

## Functional Cases — Email templates

---

### TC-CRM-016: All five templates are available

**User Role:** Member
**Steps:**
1. Open a contact detail page and find the Email Templates section.

**Expected Result:**
- **Introduction, Follow-up, Meeting Request, Thank You** and **Proposal** are offered, per the KB.

---

### TC-CRM-017: A template pre-fills the activity form

**User Role:** Member
**Steps:**
1. Click a template.

**Expected Result:**
- The activity form opens pre-filled with that template's subject and body, editable before saving.

---

### TC-CRM-018: The `%{first_name}` placeholder is substituted

**User Role:** Member
**Steps:**
1. Use a template on a contact whose first name is known.

**Expected Result:**
- `%{first_name}` is replaced with the contact's first name when the template loads.
- Check a contact whose first name contains an apostrophe or a non-Latin character — substitution must not corrupt
  it, since the result is sent to a customer.
- An unresolved `%{first_name}` reaching a real recipient is exactly the kind of error that damages a customer
  relationship, so verify the loaded text rather than assuming.

---

## Negative Cases

---

### TC-CRM-019: Template content is not an injection path

**User Role:** Member
**Steps:**
1. On a contact whose **first name** contains a script tag, load a template and inspect the pre-filled form.

**Expected Result:**
- The name is inserted as literal text and **no script executes**.
- This is the sharpest injection case in the suite: a contact field flows automatically into a form that is then
  rendered — and the contact may have been created by a CSV import from an external source (TC-CRM-118).

---

### TC-CRM-020: Activities without permission

**User Role:** Member with **View CRM** but without Manage CRM Activities
**Steps:**
1. Confirm no Add Activity control appears.
2. Send an activity-create request **directly**, and a delete request for someone else's activity.

**Expected Result:**
- Both refused with 403.

---

### TC-CRM-021: Activities respect record visibility

**User Role:** A member who cannot see a private record
**Steps:**
1. Request the activities of a private contact **directly** via the nested API path.

**Expected Result:**
- Refused, with no activity content in the response.
- **Activities are nested under their record**, so the visibility check has to be applied on the nested route as
  well as the parent — an easy one to miss, and activity content often contains the most sensitive customer detail
  in the whole plugin.

---

### TC-CRM-022: Deleting a record destroys its activities

**User Role:** Member with Delete CRM Data
**Steps:**
1. Delete a contact, a company and a deal that each have activities; then look for orphaned entries in the audit
   log and elsewhere.

**Expected Result:**
- Their activities are destroyed, per the documented cascades — and no orphaned entry renders anywhere.
- Note the tension worth recording: the audit log is described as a permanent record, yet deleting a record
  destroys its activities. Establish what remains visible in the audit log afterwards (TC-CRM-034).

---

### TC-CRM-023: High activity volume

**User Role:** Member
**Steps:**
1. Add 200 activities to one record and open its timeline.

**Expected Result:**
- The timeline paginates or lazily loads rather than rendering everything at once, and stays usable.
  Record the load time.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
