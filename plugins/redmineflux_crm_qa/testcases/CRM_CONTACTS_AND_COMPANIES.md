# Test Cases — Redmineflux CRM — Contacts & Companies

> Source: vendor KB — "How to Create a Contact", "How to Edit or Delete a Contact",
> "How to Upload or Remove a Contact Avatar", "How to Link a Contact with a Company",
> "How to Use Helpdesk Integration for a Contact", "How to Create a Company",
> "How to Edit or Delete a Company".
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux CRM Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_crm_qa

## Navigation methodology

CRM → **Contacts** / **Companies**. Do not type URLs.

> **The deletion cascades are documented precisely and are the most consequential cases here.** Each states
> exactly what is destroyed and what survives with a cleared reference. A cascade that deletes more than
> documented destroys customer data irreversibly — there is no undo in this plugin.

---

## Functional Cases — Contacts

---

### TC-CRM-201: Create a contact with all fields

**User Role:** Member with **Manage Contacts**
**Steps:**
1. Contacts → **New Contact** → fill first name, last name, email, phone, mobile, job title, address, contact
   type, company, assignee, tags, notes, privacy flag, avatar and any custom fields → Save.

**Expected Result:**
- The contact is created with every value stored and shown on its detail page.

---

### TC-CRM-202: Create a contact with only the required fields

**User Role:** Member with Manage Contacts
**Steps:**
1. Provide only first name and email; Save.

**Expected Result:**
- Created — everything else is optional.

---

### TC-CRM-203: Contact type Person vs Company

**User Role:** Member
**Steps:**
1. Create one contact of each type.

**Expected Result:**
- Both save and the type is visible on the detail page and in the list.

---

### TC-CRM-204: Edit a contact

**User Role:** Member with Manage Contacts
**Steps:**
1. Change several fields and Save.

**Expected Result:**
- All changes persist, and an automatic activity records the change where the KB says one is generated
  (assignee change — see TC-CRM-615).

---

### TC-CRM-205: Tags are case-insensitive and comma-separated

**User Role:** Member
**Steps:**
1. Enter `Sales, VIP` on one contact and `sales, vip` on another.

**Expected Result:**
- Both parse into two tags each, and the two contacts are matched by the **same** tags — the KB states tags are
  case-insensitive.
- Two tags differing only in case must not appear as separate entries anywhere they are listed.

---

### TC-CRM-206: Assignee is set and searchable

**User Role:** Member
**Steps:**
1. Assign a contact to a user and confirm it appears where assigned records are listed.

**Expected Result:**
- The assignment persists, and it affects privacy visibility (TC-CRM-904).

---

## Negative Cases — contact validation

---

### TC-CRM-207: First name and email are required

**User Role:** Member
**Steps:**
1. Save with each omitted in turn.

**Expected Result:**
- Both refused with a message naming the field.

---

### TC-CRM-208: Email must be unique across all contacts

**User Role:** Member
**Steps:**
1. Create a contact with an email that already exists — through the UI **and** through the API.
2. Also try the same email with different capitalisation.

**Expected Result:**
- Refused at both, with a clear uniqueness message.
- Record the case-sensitivity result: if `A@x.com` and `a@x.com` are both accepted, the import's
  duplicate-by-email rule (TC-CRM-701) will not catch them either, and the database ends up with duplicate
  customers that look distinct.

---

### TC-CRM-209: Phone and mobile length validation

**User Role:** Member
**Steps:**
1. Enter 6 digits, 7 digits, 15 digits and 16 digits in each field.

**Expected Result:**
- 7 and 15 are accepted; 6 and 16 are refused — the documented 7–15 international range, tested at both
  boundaries rather than in the middle.
- Also check formatting characters (spaces, `+`, dashes) are handled predictably rather than counted as digits.

---

### TC-CRM-210: Invalid email format

**User Role:** Member
**Steps:**
1. Enter `notanemail`, `a@`, and `a@b`.

**Expected Result:**
- Rejected with a clear message. The email is the key used for uniqueness, import deduplication and lead-conversion
  matching, so an invalid one propagates errors into all three.

---

### TC-CRM-211: Long values and script content

**User Role:** Member
**Steps:**
1. Enter 500-character values in name, job title and notes, and a script tag in the name and notes.
2. View the contact in the list, detail page, dashboard panels, exports and any email template preview.

**Expected Result:**
- Long values do not break layouts. **Script content is escaped everywhere and never executes.**
- The email template preview matters: template content is loaded into an activity form with `%{first_name}`
  substituted, which is a real injection path from a contact's own field.

---

## Functional Cases — Avatar

---

### TC-CRM-212: Upload an avatar

**User Role:** Member with Manage Contacts
**Preconditions:** `public/uploads/contacts/avatars` is writable.
**Steps:**
1. Upload an image via Profile Photo and Save.

**Expected Result:**
- It displays on the contact detail page and in any list that shows avatars.

---

### TC-CRM-213: Remove an avatar

**User Role:** Member
**Steps:**
1. Enable the remove-avatar option and Save.

**Expected Result:**
- The avatar is removed and a default placeholder is shown — not a broken image.

---

### TC-CRM-214: Avatar size limit and file type

**User Role:** Member
**Steps:**
1. Upload a file just under 2 MB, one just over, and a non-image file (e.g. a renamed `.exe`).

**Expected Result:**
- Under the limit succeeds; over 2 MB is refused with a clear message naming the limit.
- **A non-image file is refused** — an upload directory that accepts arbitrary files and serves them back is a
  real security concern, not just a validation gap.
- If uploads fail generally, check directory write access, which the KB names as the cause.

---

## Functional Cases — Company linking and helpdesk

---

### TC-CRM-215: Link a contact to a company

**User Role:** Member
**Steps:**
1. Select a company on the contact form and Save; open the company and look for the contact.

**Expected Result:**
- The link is visible from both sides.

---

### TC-CRM-216: Create a contact from a company page

**User Role:** Member
**Steps:**
1. From a company, use the create-contact flow.

**Expected Result:**
- The company is **preselected and locked** in the form, per the KB, and the saved contact is linked to it.

---

### TC-CRM-217: Helpdesk integration when the plugin is installed

**User Role:** Member
**Preconditions:** Redmineflux Helpdesk installed.
**Steps:**
1. Link a contact to a helpdesk customer user and open the contact.

**Expected Result:**
- Recent issues created by that user are shown, plus organization/SLA detail and product links where present.
- **Those issues must respect the viewer's own permissions** — a CRM contact page must not become a way to read
  issue subjects from projects the viewer cannot access. This is the integration's most plausible leak.

---

### TC-CRM-218: Helpdesk integration when the plugin is absent

**User Role:** Member
**Steps:**
1. On an instance without Helpdesk, open a contact.

**Expected Result:**
- Those sections are hidden or inactive, per the KB — not broken panels or errors.

---

## Negative Cases — contact deletion cascade

---

### TC-CRM-219: Deleting a contact follows the documented cascade exactly

**User Role:** Member with **Delete CRM Data**
**Preconditions:** A contact with activities, an issue link, a linked deal, and a linked company.
**Steps:**
1. Record the deal ID, the company and the issue.
2. Delete the contact and confirm.
3. Check: the activities; the issue's CRM panel; the **deal**; the **company**.

**Expected Result:**
- Activities and issue links **destroyed**.
- **The deal still exists**, with only its contact reference cleared.
- **The company is untouched.**
- The KB states all four outcomes explicitly. **A cascade that also deletes the deal would destroy pipeline data
  and revenue figures**, and there is no undo — treat any over-deletion as High severity or above.

---

### TC-CRM-220: Deletion requires Delete CRM Data

**User Role:** Member with **Manage Contacts** but without Delete CRM Data
**Steps:**
1. Confirm no Delete control appears.
2. Send the delete request **directly**.

**Expected Result:**
- Refused at the endpoint.
- This separation is stated twice in the KB and is the point of the recommended Sales Representative role
  (paired with TC-CRM-909).

---

## Functional Cases — Companies

---

### TC-CRM-301: Create a company with all fields

**User Role:** Member with **Manage Companies**
**Steps:**
1. Companies → **New Company** → name, email, phone, website, address, industry, employee count, assignee, tags,
   notes, privacy flag, custom fields → Save.

**Expected Result:**
- All values stored and displayed.

---

### TC-CRM-302: Employee count accepts numbers only

**User Role:** Member
**Steps:**
1. Enter a non-numeric value, a negative number and a decimal.

**Expected Result:**
- Each rejected or normalised with a clear message.

---

### TC-CRM-303: Edit a company

**User Role:** Member with Manage Companies
**Steps:**
1. Change several fields and Save.

**Expected Result:**
- Changes persist; linked contacts and deals keep their links.

---

### TC-CRM-304: Company detail shows its contacts and deals

**User Role:** Member
**Steps:**
1. Open a company with several linked contacts and deals.

**Expected Result:**
- Both are listed, and only those the viewer is permitted to see (paired with TC-CRM-906).

---

## Negative Cases — company validation

---

### TC-CRM-305: Company name is required

**User Role:** Member
**Steps:**
1. Save with the name blank, then with whitespace only.

**Expected Result:**
- Both refused.

---

### TC-CRM-306: Company name must be unique

**User Role:** Member
**Steps:**
1. Create a second company with an existing name, via the UI and the API; then try a different capitalisation.

**Expected Result:**
- Refused with a uniqueness message.
- Record the case behaviour: the import duplicate check and the lead-conversion company lookup both match **by
  name**, so if `Acme` and `acme` can coexist, conversion and import will attach records to the wrong one
  (TC-CRM-514).

---

### TC-CRM-307: Bare domain is normalised to https

**User Role:** Member
**Steps:**
1. Enter `acmecorp.com` in Website and Save.

**Expected Result:**
- Stored as `https://acmecorp.com`, exactly as documented, and the link on the detail page works.

---

### TC-CRM-308: Website values that are already qualified

**User Role:** Member
**Steps:**
1. Enter `http://acmecorp.com`, `https://acmecorp.com`, `www.acmecorp.com`, and a `javascript:` URL.

**Expected Result:**
- Existing schemes are preserved rather than double-prefixed into something like `https://http://…`.
- **A `javascript:` URL is rejected or neutralised** — the website field renders as a clickable link on the detail
  page, which makes it a direct injection path.

---

### TC-CRM-309: Deleting a company follows the documented cascade exactly

**User Role:** Member with **Delete CRM Data**
**Preconditions:** A company with activities, two linked contacts and two linked deals.
**Steps:**
1. Record the contact and deal IDs.
2. Delete the company and confirm.
3. Check the activities, the **contacts** and the **deals**.

**Expected Result:**
- The company's activities **destroyed**.
- **All contacts still exist**, with only the company reference cleared.
- **All deals still exist**, with only the company reference cleared.
- The KB states this precisely. **A cascade that deleted the contacts would destroy the customer records of an
  entire account in one irreversible click** — the single most damaging possible defect in this plugin.

---

### TC-CRM-310: Long values and script content in company fields

**User Role:** Member
**Steps:**
1. Use 500-character values and a script tag in name, industry and notes; view in the list, detail page,
   dashboard, pipeline cards and exports.

**Expected Result:**
- Layouts hold; **script content is escaped everywhere and never executes**. Company names render on deal cards
  and in analytics, so the payload travels widely.

---

### TC-CRM-311: Concurrent edits

**User Role:** Two members
**Steps:**
1. Both edit the same contact, and then the same company, without reloading.

**Expected Result:**
- No lost update, or a clear stale-state message. A whole-form save that silently discards the other user's change
  would quietly lose corrected customer details.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
