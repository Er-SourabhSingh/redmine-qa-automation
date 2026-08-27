# Test Cases — Redmineflux Helpdesk — Field-Level Validation (Organization, Customer, SLA, Support Level, Holiday)

> Source: field lists confirmed live against the Forge instance and captured in `automation/tests/HelpdeskOrganizationPage.ts`, `HelpdeskCustomerPage.ts`, `HelpdeskSlaPage.ts`, `HelpdeskSupportLevelPage.ts`, `HelpdeskHolidayPage.ts`. Cross-cutting suite — one file for every Settings-entity field, rather than duplicating this shape into each entity's own suite file.
>
> **Why this file exists:** `HELPDESK_CUSTOMERS_ORGANIZATIONS.md` and `HELPDESK_SLA_ESCALATION.md` cover CRUD, workflow, and a handful of business-rule negative cases (duplicate names, zero assignees, etc. — TC-HLP-099–103, 119–121, 123). Neither file drills into **per-field** validation: required-empty, character-type accepted, and max-length/boundary behavior for every individual input. This file is that drill-down.
>
> **On unknown limits:** none of the max-length/boundary values below have been confirmed against the live server yet — the plugin's own docs never state them. Where a case probes a boundary, the Expected Result says **"record the actual enforced limit/behavior"** rather than asserting a specific number, so execution fills in ground truth instead of a guess. Once a limit is confirmed, update this file's Expected Result with the real number and note it in `HELPDESK_MEMORY.md` under Known Quirks.

## Plugin
- Name: redmineflux_helpdesk
- Version: (fill from environment)
- Redmine version: (fill from environment)
- Path: plugins/redmineflux_helpdesk_qa

---

## A. Organization (`/rf_organizations/new`)

Fields: Organization Name\* (text), Website (text), Phone Number (text), Organization Address (text), Number of Employees (number), Notes (textarea), Billing Info (textarea), Active (checkbox).

---

### TC-HLP-228: Organization Name is required

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Open New Organization
2. Leave Organization Name blank, fill nothing else
3. Save

**Expected Result:**
- Save is refused with a clear "can't be blank" / required-field message on Organization Name
- No organization is created

---

### TC-HLP-229: Organization Name rejects whitespace-only input

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Open New Organization
2. Enter only spaces (e.g. `"   "`) into Organization Name
3. Save

**Expected Result:**
- Treated the same as blank — refused with a required-field message (leading/trailing whitespace should not count as content)

---

### TC-HLP-230: Organization Name — maximum length boundary

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Open New Organization
2. Enter a Organization Name of 255 characters, Save — record result
3. Repeat with 256 characters — record result
4. Repeat with 1000 characters — record result

**Expected Result:**
- Record the actual enforced maximum: exact accept/reject boundary, whether the field silently truncates instead of rejecting, and the exact error message if one appears (currently unknown — not documented anywhere in the plugin)

---

### TC-HLP-231: Organization Name accepts letters, numbers, and common punctuation

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Create organizations named: `"Acme 123"`, `"O'Brien & Sons, Ltd."`, `"日本語テスト"` (non-Latin/unicode), `"<script>alert(1)</script>"` (HTML/script injection probe)

**Expected Result:**
- Alphanumeric, punctuation, and unicode names all save and display correctly (no mojibake/encoding corruption)
- The `<script>` case is stored and **rendered as inert text everywhere it's displayed** (organization list, customer detail, dropdowns) — no script execution, no unescaped HTML. If the reverse is observed, file it as an XSS bug immediately (Critical severity)

---

### TC-HLP-232: Website field format is/isn't validated

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Create an organization with Website set to `"not a url"` (no scheme, no domain)
2. Create another with Website set to `"https://example.com"`

**Expected Result:**
- Record whether the malformed value is accepted as-is (plain text field, no format validation) or refused. If accepted, note that the plugin doesn't validate URL format — not necessarily a bug, but worth confirming for `HELPDESK_MEMORY.md`

---

### TC-HLP-233: Phone Number accepts non-numeric input

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Create an organization with Phone Number set to `"call-me-maybe"` (letters, no digits)
2. Create another with a properly formatted number, e.g. `"+1 (555) 123-4567"`

**Expected Result:**
- Record whether letters are accepted (plain text field) or rejected. If accepted, confirm it's a UI/UX gap worth a low-severity note, not necessarily a bug on its own

---

### TC-HLP-292: Website, Phone, and other non-Name fields do NOT require uniqueness across organizations

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** An organization "Acme Corp" already exists with Website `https://acme.example.com` and Phone `+1 (555) 123-4567`.

**Steps:**
1. Create a second, differently-named organization ("Acme Corp Subsidiary") using the exact same Website and Phone values as Acme Corp
2. Attempt Save

**Expected Result — per `HELPDESK_USER_GUIDE.md` §3.4 ("Name is required and must be unique. Everything else — website, phone, address, employee count, billing info, notes — is optional"), only Organization Name should be a uniqueness constraint:**
- Save succeeds — the second organization is created with the identical Website/Phone values, no "already taken" refusal
- **CONFIRMED LIVE 2026-08-26** (Local, redmine-docker-6, admin): PASS against the current spec. Set Alpha Org's Website to `https://acme.example.com` and Phone to `+1 (555) 123-4567`, then created a second organization "Alpha Org Subsidiary" (id=3) with the exact same Website and Phone values — Save succeeded with no refusal of any kind, and the detail page confirms both fields saved byte-identical to Alpha Org's. Matches the documented spec exactly: only Organization Name is a real uniqueness constraint (TC-HLP-119); Website/Phone/Address/Employee Count/Billing Info/Notes have none.
- **Filed as BUG-HLP-010 (Low) anyway, per explicit user product-judgment direction**: even though this matches the written spec, real-world organizations essentially never share an identical website/phone, so the lack of even a soft duplicate-warning is a real data-integrity gap worth tracking. This TC's "Expected Result" above documents *today's actual* (permissive) behavior — if BUG-HLP-010 is ever fixed, this TC's expectation should flip to match the new validation, not stay as a record of the old gap.

---

### TC-HLP-234: Number of Employees rejects non-numeric and negative values

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Open New Organization; inspect whether Number of Employees is a native `<input type="number">` (browser-level blocking) or `type="text"` (needs a server-side check)
2. Attempt to enter `"-5"` (negative), Save — record result
3. Attempt to enter `"0"`, Save — record result
4. Attempt to enter `"3.5"` (decimal), Save — record result
5. Attempt to enter `"abc"` (non-numeric), Save — record result

**Expected Result:**
- Record the field's actual input type and, for each value: whether it's blocked client-side, refused server-side with a message, silently coerced (e.g. decimal truncated to integer), or accepted as-is. A negative employee count being silently accepted is worth flagging as a data-integrity gap (Low/Medium)

---

### TC-HLP-235: Notes and Billing Info — maximum length boundary

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Enter a 5,000-character string into Notes, Save — record result
2. Repeat for Billing Info

**Expected Result:**
- Record the actual enforced maximum (these are textareas — likely a much higher or unbounded limit than Organization Name, but unconfirmed)

---

## B. Customer (`/rf_customers/new`)

Fields: Login\* (text), First name\* (text), Last name\* (text), Email\* (text), Password\*/Confirmation\* (text, unless "Generate password automatically" is checked).

> Note: BUG-HLP-001 already documents that the Login field shows a permanently stuck "Login must be at least 2 characters long" message regardless of actual input — when executing the cases below, judge success/failure by whether the customer actually appears in the list afterward, **not** by whether that message is visible (it may show even on success — see `bugs/open/BUG-HLP-001.md`).

---

### TC-HLP-236: Login, First name, Last name, and Email are each individually required

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Open New Customer, fill in all fields EXCEPT Login, Save — record result
2. Repeat, this time omitting only First name — record result
3. Repeat, omitting only Last name — record result
4. Repeat, omitting only Email — record result

**Expected Result:**
- Each of the four submissions is refused with a field-specific required message, and no customer account is created in any case

---

### TC-HLP-237: Login — minimum length boundary

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Attempt to create a customer with Login = a single character, e.g. `"a"`
2. Attempt with Login = two characters, e.g. `"ab"`

**Expected Result:**
- Record the actual minimum enforced (the stuck-message text claims "at least 2 characters" — confirm whether a genuine 1-character login is actually refused, independent of BUG-HLP-001's message reliability)

---

### TC-HLP-238: Login — maximum length boundary

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Attempt a Login of 30 characters — record result
2. Attempt a Login of 100 characters — record result
3. Attempt a Login of 256 characters — record result

**Expected Result:**
- Record the actual enforced maximum (Redmine core's default user login limit is commonly 30 characters — confirm whether the Helpdesk customer form inherits that or has its own limit)

---

### TC-HLP-239: Login rejects characters Redmine logins don't allow

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Attempt Login values containing a space (`"john doe"`), an `@` symbol (`"john@doe"`), and other punctuation not typically allowed in a Redmine login (e.g. `"john!doe"`)

**Expected Result:**
- Record which characters are refused vs. silently accepted, and the exact error message for each refusal

---

### TC-HLP-240: Login must be unique — duplicate is refused

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** A customer with login `"dupe.test"` already exists.

**Steps:**
1. Attempt to create a second account with the same Login `"dupe.test"`

**Expected Result:**
- Refused with a clear "already taken" style message — not a silent failure or a generic error

---

### TC-HLP-241: First name / Last name — maximum length boundary

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Attempt a First name of 30 characters, then 100, then 256 — record each result
2. Repeat for Last name

**Expected Result:**
- Record the actual enforced maximum for each (Redmine core commonly caps these around 30 characters)

---

### TC-HLP-242: First name / Last name accept unicode and reject/accept script injection safely

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Create a customer with First name `"日本語"` and Last name `"O'Connor-Smith"`
2. Create another with First name `"<script>alert(1)</script>"`

**Expected Result:**
- Unicode and apostrophe/hyphen names save and display correctly everywhere (customer list, ticket assignment, etc.)
- The script-injection name is stored but rendered as inert text everywhere — no execution. Escalate immediately as a Critical XSS bug if this fails

---

### TC-HLP-243: Email format is validated

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Attempt Email values: `"notanemail"` (no @), `"missing@domain"` (no TLD), `"@nouser.com"` (no local part), `"valid@example.com"` (control, should succeed)

**Expected Result:**
- All three malformed values are refused with a clear format-error message
- The valid control case succeeds

---

### TC-HLP-244: Email must be unique — duplicate is refused

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** A customer with email `"dupe@example.com"` already exists.

**Steps:**
1. Attempt to create a second account (different login) using the same Email

**Expected Result:**
- Refused with a clear "already taken" message referencing the email specifically

---

### TC-HLP-245: Email — maximum length boundary

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Attempt an email with a very long local part or domain totaling ~255 characters, then ~320 characters (the RFC 5321 upper bound), then longer

**Expected Result:**
- Record the actual enforced maximum

---

### TC-HLP-246: Password and Confirmation must match

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** "Generate password automatically" is unchecked.

**Steps:**
1. Enter Password `"Password123"` and Confirmation `"Password456"` (mismatch), Save

**Expected Result:**
- Refused with a clear "doesn't match confirmation" message; no account created

---

### TC-HLP-247: Password minimum length is enforced

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** "Generate password automatically" is unchecked. Check Administration › Settings › Authentication for the configured "Minimum password length" first, so the expected boundary is known rather than assumed.

**Steps:**
1. Enter a Password one character shorter than the configured minimum (both Password and Confirmation matching), Save
2. Enter a Password exactly at the configured minimum, Save

**Expected Result:**
- Step 1 is refused with a minimum-length message
- Step 2 succeeds

---

### TC-HLP-248: "Generate password automatically" correctly disables and bypasses manual password entry

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Check "Generate password automatically"
2. Confirm the Password/Confirmation fields become disabled (already observed live — confirm this still holds)
3. Fill in Login/First name/Last name/Email only, Save

**Expected Result:**
- Account is created successfully without any password ever being typed
- (If "Send account information" is also checked/forced-checked) the generated password is emailed, not silently discarded

---

## C. SLA (`/rf_slas/new`)

Fields: SLA Name\* (text), Description (richtext), First Response Time\* (number + unit), Resolution Time\* (number + unit), Working Hours (start/end time, UTC), Working Days (checkboxes), Holiday (multiselect), Active (checkbox), SLA Agreement (file upload, documented max 5 MB).

---

### TC-HLP-249: SLA Name is required

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Leave SLA Name blank, fill First Response/Resolution Time, Save

**Expected Result:**
- Refused with a required-field message; no SLA created

---

### TC-HLP-250: SLA Name — maximum length boundary

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Attempt SLA Names of 255, 256, and 1000 characters — record each result

**Expected Result:**
- Record the actual enforced maximum

---

### TC-HLP-251: First Response Time is required and rejects non-positive values

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Leave First Response Time blank, Save — record result
2. Enter `"0"`, Save — record result
3. Enter `"-10"`, Save — record result
4. Enter a decimal, e.g. `"1.5"`, Save — record result
5. Attempt non-numeric input (check whether the field is a native `<input type="number">` blocking this client-side)

**Expected Result:**
- Blank and negative are refused
- Record whether zero is accepted (a zero-minute first response target may be semantically valid — "respond immediately" — or may be rejected; either is plausible, confirm which)
- Record whether decimals are accepted, rejected, or rounded

---

### TC-HLP-252: Resolution Time is required and rejects non-positive values

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Repeat the same blank / zero / negative / decimal / non-numeric probes as TC-HLP-251, but for Resolution Time

**Expected Result:**
- Same as TC-HLP-251, recorded independently for this field (the two fields may not share the same validation rules)

---

### TC-HLP-253: Resolution Time shorter than First Response Time — is this refused?

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Set First Response Time = 4 Hours, Resolution Time = 30 Minutes (resolution target shorter than the first-response target — logically inconsistent), Save

**Expected Result:**
- Record whether the plugin cross-validates these two fields against each other (refuses as illogical) or accepts them independently with no cross-check. If accepted, this is worth a Low/Medium data-integrity note in `HELPDESK_MEMORY.md` rather than an assumed bug — SLA semantics may intentionally allow it

---

### TC-HLP-254: Working Hours end time before start time

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Set Working Hours start = 18:00, end = 09:00 (end before start), Save

**Expected Result:**
- Record whether this is refused, silently accepted (perhaps intentionally supporting overnight shifts, e.g. 18:00–09:00 next day), or produces incorrect SLA-clock behavior on a subsequent ticket

---

### TC-HLP-255: SLA Agreement file upload — size limit is enforced

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** A file just over 5 MB and a file just under 5 MB are available.

**Steps:**
1. Upload the file just under 5 MB — record result
2. Upload the file just over 5 MB — record result

**Expected Result:**
- Under-limit file uploads and saves successfully
- Over-limit file is refused with a clear "(Maximum size: 5 MB)" style message (the form already displays this limit statically — confirm it's actually enforced, not just labeled)

---

### TC-HLP-256: SLA Agreement file upload — file type is/isn't restricted

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** A `.pdf`, a `.docx`, and an `.exe` (or other non-document type) file are available, each well under 5 MB.

**Steps:**
1. Upload each file type in turn, Save, record the result for each

**Expected Result:**
- Record which file types are accepted vs. refused. No documented allow-list exists in the plugin's UI — if `.exe` or other executable/script types are accepted, flag as a Medium security-hygiene concern (arbitrary file upload) even though it's an admin-only screen

---

## D. Support Level (`/rf_support_levels/new`)

Fields: Project\* (select), Support Level Name\* (text), Level Order\* (number), Description (richtext), Support Assignees\* (multiselect — TC-HLP-101 already covers zero-assignee refusal, not repeated here), Escalation To (select).

---

### TC-HLP-257: Support Level Name is required

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** A project is selected.

**Steps:**
1. Leave Support Level Name blank, fill Level Order and an assignee, Save

**Expected Result:**
- Refused with a required-field message

---

### TC-HLP-258: Support Level Name — maximum length boundary

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Attempt names of 255, 256, and 1000 characters — record each result

**Expected Result:**
- Record the actual enforced maximum

---

### TC-HLP-259: Level Order is required and rejects non-positive / non-numeric values

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Leave Level Order blank, Save — record result
2. Enter `"0"`, Save — record result
3. Enter `"-1"`, Save — record result
4. Enter a decimal, e.g. `"1.5"`, Save — record result
5. Attempt non-numeric input — check whether the field is a native `<input type="number">` (spinbutton) blocking this client-side (confirmed live: it IS a `spinbutton` role — client-side blocking of non-numeric is expected; confirm server-side too via direct form manipulation if possible)

**Expected Result:**
- Blank is refused
- Record whether zero/negative Level Order is accepted (a "Level 0" or negative-ordered level may or may not make sense in the escalation model — confirm against real behavior rather than assuming)
- Record decimal handling

---

### TC-HLP-260: Level Order duplicate within the same project is refused (regression of already-confirmed behavior)

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** A support level with Level Order = 1 already exists on Project A (already confirmed working via the real "Level order has already been taken" error — see `HELPDESK_MEMORY.md` Known Quirks. This TC formalizes it as a regression check.)

**Steps:**
1. Attempt to create a second support level on Project A also with Level Order = 1

**Expected Result:**
- Refused with the "Level order has already been taken" message
- Confirm the SAME Level Order on a **different** project (e.g. Project B) is allowed — order uniqueness should be scoped per-project, not install-wide

---

### TC-HLP-261: Description field — maximum length boundary (Support Level)

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Enter a 5,000-character Description, Save

**Expected Result:**
- Record the actual enforced maximum (richtext/textarea fields are typically much less restrictive, but unconfirmed)

---

## E. Holiday (`/rf_helpdesk_holidays/new`)

Fields: Holiday Name\* (text), Description (richtext), Start Date\* (date), End Date\* (date).

---

### TC-HLP-262: Holiday Name is required

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Leave Holiday Name blank, fill Start/End Date, Save

**Expected Result:**
- Refused with a required-field message

---

### TC-HLP-263: Holiday Name — maximum length boundary

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Attempt names of 255, 256, and 1000 characters — record each result

**Expected Result:**
- Record the actual enforced maximum

---

### TC-HLP-264: Start Date and End Date are each required

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Leave Start Date blank (End Date filled), Save — record result
2. Leave End Date blank (Start Date filled), Save — record result

**Expected Result:**
- Both submissions are refused with field-specific required messages

---

### TC-HLP-265: End Date before Start Date is refused

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Set Start Date = 2026-12-25, End Date = 2026-12-20 (End before Start), Save

**Expected Result:**
- Refused with a clear date-order error message — not silently accepted as a backwards or zero-length range

---

### TC-HLP-266: Holiday dates far in the past or far in the future are accepted

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Create a holiday dated 10 years in the past
2. Create a holiday dated 10 years in the future

**Expected Result:**
- Both save successfully — holidays aren't expected to be restricted to "current year" or similar, but confirm no hidden restriction exists

---

## F. Canned Response (`/rf_canned_responses/new`)

Fields: Name\* (text), Author (read-only, auto-set to current user — not a real input), Content\* (textarea + toolbar), Active (checkbox).

> Unlike the other sections above, every case in this section was **actually executed live** on 2026-08-24 (Forge `flux-fw2qhf0ux49`) rather than left as an unconfirmed boundary probe — see the real values captured in each Expected Result and in `automation/tests/HelpdeskCannedResponsePage.ts`.

---

### TC-HLP-267: Name and Content are each required (confirmed: client-side HTML5 validation)

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Open New Canned Response, leave both Name and Content blank, Save

**Expected Result:**
- **CONFIRMED LIVE:** both `#rf_canned_response_name` and `#canned_content` are real `required` HTML5 inputs — the browser blocks submission natively with "Please fill out this field." (no server round-trip occurs at all for a fully blank submission)

---

### TC-HLP-268: Name — maximum length is exactly 255 characters (confirmed, not a guess)

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Attempt a Name of exactly 255 characters, Save
2. Attempt a Name of exactly 256 characters, Save

**Expected Result:**
- **CONFIRMED LIVE:** 255 characters saves successfully. 256 characters is refused with the exact server message **"Name is too long (maximum is 255 characters)"**. No client-side `maxlength` attribute exists on the field (confirmed via `el.maxLength === -1`) — this is purely a server-side (likely Rails `validates :name, length: { maximum: 255 }`) check.

---

### TC-HLP-269: Duplicate Name is refused (confirmed exact wording — regression check, not a duplicate of TC-HLP-170)

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** A canned response named "Acknowledge Receipt" already exists.

**Steps:**
1. Attempt to create another canned response also named "Acknowledge Receipt"

**Expected Result:**
- **CONFIRMED LIVE:** refused with the exact message **"Name has already been taken"**. (This is the same scenario as TC-HLP-170 in `HELPDESK_CONTENT_TEMPLATES.md` — recorded here too since this section is where the exact server wording was captured; don't execute both as if independent, they're the same check.)

---

### TC-HLP-270: Author field is not an editable input — always the current user

**User Role:** Admin or Agent with `manage_helpdesk`
**Precondition:** None.

**Steps:**
1. Open New Canned Response, inspect the Author field

**Expected Result:**
- Author renders as static text showing the currently signed-in user's display name (e.g. "Redmine Admin") — there is no input to override it, confirmed on both the New and Edit forms

---

## Notes

- Every case in Sections A–E above whose Expected Result says "record the actual..." is an **exploratory boundary probe**, not a pass/fail assertion against a known spec — the plugin's docs never state these limits. Fill in the real observed behavior during execution, then promote genuinely surprising findings (accepted script injection, no upload type restriction, illogical SLA time acceptance, etc.) into `HELPDESK_MEMORY.md` and file a bug if the behavior is actually harmful, not merely undocumented. Section F (Canned Response) is the one section where every case has already been executed with real confirmed values, rather than left as an open probe — use it as the template for what "done" looks like once the other sections are run.
- TC-HLP-101 (Support Level, zero assignees refused), TC-HLP-099/100/103 (duplicate name refusals for SLA/Support Level/Holiday), and TC-HLP-119 (duplicate name refusal for Organization) already exist in their respective suite files and are not duplicated here — see `HELPDESK_SLA_ESCALATION.md` and `HELPDESK_CUSTOMERS_ORGANIZATIONS.md`.
- Do not automate any of these into `automation/tests/` until each has a confirmed manual PASS, per `CLAUDE.md` §13. Section F's cases are now eligible for automation since they carry confirmed PASS results.
