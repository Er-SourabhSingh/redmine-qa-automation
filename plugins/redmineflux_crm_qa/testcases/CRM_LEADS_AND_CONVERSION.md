# Test Cases — Redmineflux CRM — Leads & Lead Conversion

> Source: vendor KB — "How to Create a Lead", "How to Edit or Delete a Lead", "How to Convert a Lead"
> (the seven stated conversion rules), and the configuration notes on the `Qualified` and `Converted` statuses.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux CRM Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_crm_qa

## Navigation methodology

CRM → **Leads**. Do not type URLs.

> **Conversion is the plugin's most consequential single action.** It creates or merges into a contact, creates or
> reuses a company, optionally creates a deal, changes the lead's status irreversibly, and locks the lead against
> deletion — all in one submit, with no undo. The KB states seven rules for it; each is tested individually below,
> because a conversion that goes wrong cannot be reversed.

---

## Functional Cases — Leads

---

### TC-CRM-159: Create a lead with all fields

**User Role:** Member with **Manage Leads**
**Priority:** High
**Steps:**
1. Leads → **New Lead** → first name, last name, email, phone, company name, source, status, assignee, notes,
   privacy flag, custom fields → Save.

**Expected Result:**
- All values stored and shown on the detail page.

---

### TC-CRM-160: Create a lead with only the required fields

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Provide only first name and email.

**Expected Result:**
- Created, with status defaulting to **New**.

---

### TC-CRM-161: Source and status lists match the configuration

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Compare the dropdowns against the plugin settings.

**Expected Result:**
- Exactly the configured lead sources and statuses — and **`Converted` is not offered**, since it is reserved.

---

### TC-CRM-162: Edit a lead

**User Role:** Member with Manage Leads
**Priority:** High
**Steps:**
1. Change the status and the assignee; Save; open the Recent Activities.

**Expected Result:**
- Both persist, and the documented automatic activities are logged for the status change and the assignee change.

---

## Negative Cases — lead validation

---

### TC-CRM-163: First name and email are required

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Save with each omitted in turn.

**Expected Result:**
- Both refused with a message naming the field.

---

### TC-CRM-164: Email must be unique across all leads

**User Role:** Member
**Priority:** High
**Steps:**
1. Create a lead with an existing lead's email, via the UI and the API; then with different capitalisation.

**Expected Result:**
- Refused with a uniqueness message.
- Record the case behaviour — the import deduplicates by email (TC-CRM-124) and conversion matches contacts by
  email (TC-CRM-170), so case-insensitivity matters in three places at once.

---

### TC-CRM-165: A lead's email may duplicate a contact's email

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Create a lead whose email matches an existing **contact**.

**Expected Result:**
- Allowed — uniqueness is stated as being **across leads**, not across contacts.
- This is the normal precursor to conversion reusing that contact (TC-CRM-170), so refusing it would break the
  documented flow. Record whichever applies.

---

### TC-CRM-166: `Converted` cannot be set manually

**User Role:** Member with Manage Leads
**Priority:** High
**Steps:**
1. Confirm it is absent from the status dropdown.
2. Send an update **directly** setting the status to `Converted`.

**Expected Result:**
- Refused at the endpoint.
- **A manually "Converted" lead has no contact, no company and no conversion activity, yet is locked against both
  re-conversion and deletion** (TC-CRM-176, 519) — an unrecoverable orphan record created in one API call. This is
  the most valuable negative case in the suite.

---

## Functional Cases — Conversion

---

### TC-CRM-167: Only Qualified leads can be converted

**User Role:** Member with Manage Leads
**Priority:** High
**Steps:**
1. On a lead with status **New**, look for the Convert action, then send the convert request **directly**.
2. Set the status to **Qualified** and retry.

**Expected Result:**
- Refused while not Qualified — at the endpoint as well as the UI — and permitted once Qualified.

---

### TC-CRM-168: Convert without creating a deal

**User Role:** Member
**Priority:** High
**Steps:**
1. Convert a Qualified lead, choosing not to create a deal.

**Expected Result:**
- A contact is created (or reused), the lead's status becomes **Converted**, an automatic activity is logged on
  the lead, and the browser is redirected to the **contact detail page**, per the KB.
- No deal exists.

---

### TC-CRM-169: Convert and create a deal

**User Role:** Member
**Priority:** High
**Steps:**
1. Convert with the deal option enabled: supply the deal name (required), an amount, a stage (defaults to New) and
   any deal custom field values.

**Expected Result:**
- The deal is created with those values and linked to the new contact and company.
- Omitting the deal name is refused, since the KB marks it required.

---

### TC-CRM-170: An existing contact with the same email is reused

**User Role:** Member
**Priority:** High
**Steps:**
1. Create a contact with email `x@y.com`; create a Qualified lead with the same email; convert it.

**Expected Result:**
- **No second contact is created** — the existing one is reused, per the KB.
- Confirm by checking the total contact count before and after.

---

### TC-CRM-171: Merging only fills blank contact fields

**User Role:** Member
**Priority:** High
**Steps:**
1. On the existing contact, set a phone number and a job title to known **correct** values.
2. Create a Qualified lead with the same email but **different** phone data, and leave the contact's address blank
   while giving the lead an address.
3. Convert.

**Expected Result:**
- The contact's existing phone and job title are **unchanged**.
- The previously blank address is now populated from the lead.
- The KB states data is "merged in only where the contact fields are blank". **A conversion that overwrites
  existing contact data would silently replace verified customer details with older lead data** — and it would
  look like a successful conversion. This is the subtlest and most damaging possible conversion defect.

---

### TC-CRM-172: An existing company with the same name is reused

**User Role:** Member
**Priority:** High
**Steps:**
1. Create a company named `Acme Ltd`; create a Qualified lead with company name `Acme Ltd`; convert.

**Expected Result:**
- The existing company is reused; no duplicate is created.
- Also try a case or whitespace variant and record the result — if matching is exact-only, conversions will
  quietly create near-duplicate companies (see TC-CRM-077).

---

### TC-CRM-173: A new company is created when none matches

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Convert a Qualified lead whose company name does not exist.

**Expected Result:**
- A new company is created with that name and linked to the contact and any deal.

---

### TC-CRM-174: Conversion with no company name

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Convert a Qualified lead that has no company name.

**Expected Result:**
- No company is created — the KB conditions creation on a company name being present — and the conversion still
  succeeds.

---

### TC-CRM-175: Conversion logs an automatic activity

**User Role:** Member
**Priority:** Medium
**Steps:**
1. After converting, open the lead's Recent Activities.

**Expected Result:**
- An automatic conversion activity is recorded with the actor and timestamp.
- Since the lead is now locked, that activity is the only record of what happened — it must be present.

---

## Negative Cases — post-conversion locks

---

### TC-CRM-176: A converted lead cannot be converted again

**User Role:** Member
**Priority:** High
**Steps:**
1. Confirm the Convert action is gone from a converted lead.
2. Send the convert request **directly**.

**Expected Result:**
- Refused at the endpoint.
- **A second conversion would create a duplicate contact or deal from the same lead**, inflating the pipeline with
  a phantom opportunity.

---

### TC-CRM-177: A converted lead cannot be deleted

**User Role:** Member with **Delete CRM Data**
**Priority:** High
**Steps:**
1. Confirm no Delete control on a converted lead.
2. Send the delete request **directly**.

**Expected Result:**
- Refused at the endpoint, per the KB.
- The lead is the origin record for a contact and possibly a deal; deleting it would break the provenance trail
  that the conversion activity depends on.

---

### TC-CRM-178: Conversion when the Qualified status has been removed

**User Role:** Admin + Member
**Priority:** Medium
**Steps:**
1. Remove `Qualified` from the lead statuses (see TC-CRM-149), then attempt to convert a lead.

**Expected Result:**
- Conversion is impossible, and the reason is explained rather than the action silently disappearing.

---

### TC-CRM-179: Conversion failure leaves nothing half-created

**User Role:** Member
**Priority:** High
**Steps:**
1. Force a failure mid-conversion — for example supply a deal name that violates a validation rule, or make a
   required custom field invalid.

**Expected Result:**
- **Nothing is created and the lead's status is unchanged.**
- A conversion that creates the contact, fails on the deal, and still marks the lead Converted would leave a
  locked lead, an orphan contact and no deal — with no way to retry, since re-conversion is blocked. This is the
  worst outcome in the suite and is exactly what a non-atomic implementation would produce.

---

### TC-CRM-180: Conversion respects permissions

**User Role:** Member with **Manage Leads** but without **Manage Contacts** and without **Manage Deals**
**Priority:** High
**Steps:**
1. Attempt a conversion that would create a contact, and one that would also create a deal.

**Expected Result:**
- Record the behaviour precisely. Conversion creates records in two other entity types, so it must not become a
  route to create contacts and deals for a user who holds neither permission.
- Whichever way it falls, the result must be consistent — and never partially applied (TC-CRM-179).

---

### TC-CRM-181: Conversion with a private lead

**User Role:** Member
**Priority:** High
**Steps:**
1. Convert a lead marked private and inspect the privacy flags of the resulting contact, company and deal.

**Expected Result:**
- Record whether privacy is carried across. **A private lead converting into a public contact would expose the
  customer record that privacy was protecting**, without any indication on the conversion form.

---

### TC-CRM-182: Concurrent conversion of the same lead

**User Role:** Two members
**Priority:** Medium
**Steps:**
1. Both open the same Qualified lead and submit the conversion at nearly the same moment.

**Expected Result:**
- Exactly one conversion happens. **Two would create duplicate contacts or deals from one lead** — and the
  documented "cannot convert again" guard only helps if it is applied atomically, which this case tests.

---

### TC-CRM-183: Long values and script content in lead fields

**User Role:** Member
**Priority:** High
**Steps:**
1. Use 500-character values and a script tag in name, company name and notes; convert the lead.
2. View the resulting contact, company and deal, and the conversion activity.

**Expected Result:**
- Layouts hold; **script content is escaped everywhere and never executes** — including on the records created by
  the conversion, which is where the payload travels next.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
