# Test Cases — Redmineflux Helpdesk — Field-Level Validation (Organization, Customer, SLA, Support Level, Holiday)

> Source: field lists confirmed live against the Forge instance and captured in `automation/tests/HelpdeskOrganizationPage.ts`, `HelpdeskCustomerPage.ts`, `HelpdeskSlaPage.ts`, `HelpdeskSupportLevelPage.ts`, `HelpdeskHolidayPage.ts`. Cross-cutting suite — one file for every Settings-entity field, rather than duplicating this shape into each entity's own suite file.
>
> **Why this file exists:** `HELPDESK_CUSTOMERS_ORGANIZATIONS.md` and `HELPDESK_SLA_ESCALATION.md` cover CRUD, workflow, and a handful of business-rule negative cases (duplicate names, zero assignees, etc. — TC-HLP-343–103, 119–121, 123). Neither file drills into **per-field** validation: required-empty, character-type accepted, and max-length/boundary behavior for every individual input. This file is that drill-down.
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

### TC-HLP-090: Organization Name is required

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** None.

**Steps:**
1. Open New Organization
2. Leave Organization Name blank, fill nothing else
3. Save

**Expected Result:**
- Save is refused with a clear "can't be blank" / required-field message on Organization Name
- No organization is created

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, admin): **PASS.** `#rf_organization_name` is a genuine HTML5 `required` input (confirmed via DOM: `el.required === true`). Clicking Create with everything blank never triggered a server round-trip at all — the browser blocked submission client-side and the page stayed on the New Organization form. No organization created.

---

### TC-HLP-091: Organization Name rejects whitespace-only input

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Low
**Precondition:** None.

**Steps:**
1. Open New Organization
2. Enter only spaces (e.g. `"   "`) into Organization Name
3. Save

**Expected Result:**
- Treated the same as blank — refused with a required-field message (leading/trailing whitespace should not count as content)

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, admin): **PASS.** Entered `"   "` (3 spaces) — this has content so it passes the client-side HTML5 `required` check and reaches the server, which correctly refuses it with **"Name cannot be blank"** (server-side blank?/strip check catches what client-side `required` alone cannot). No organization created.

---

### TC-HLP-092: Organization Name — maximum length boundary

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Low
**Precondition:** None.

**Steps:**
1. Open New Organization
2. Enter a Organization Name of 255 characters, Save — record result
3. Repeat with 256 characters — record result
4. Repeat with 1000 characters — record result

**Expected Result:**
- Record the actual enforced maximum: exact accept/reject boundary, whether the field silently truncates instead of rejecting, and the exact error message if one appears (currently unknown — not documented anywhere in the plugin)

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, admin): **The real enforced maximum is exactly 100 characters, confirmed on both sides, no truncation.** `#rf_organization_name` carries a genuine client-side `maxlength="100"` attribute (confirmed via DOM: `el.maxLength === 100`). Created an organization with exactly 100 `"A"` characters — succeeded ("Successful creation.", org id 10). Removed the `maxlength` attribute via `browser_evaluate` to bypass the client cap and edited the same organization's Name to 101 `"B"` characters — Save was refused server-side with the exact message **"Name is too long (maximum is 100 characters)"**; the record's stored value was untouched (still the valid 100-char name). No silent truncation at either boundary — genuinely rejected past 100. 256/1000-character cases are the same failure mode as 101 and weren't tested separately (a hard numeric ceiling, not a range with different behavior at different overflow amounts).

---

### TC-HLP-093: Organization Name accepts letters, numbers, and common punctuation

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Low
**Precondition:** None.

**Steps:**
1. Create organizations named: `"Acme 123"`, `"O'Brien & Sons, Ltd."`, `"日本語テスト"` (non-Latin/unicode), `"<script>alert(1)</script>"` (HTML/script injection probe)

**Expected Result:**
- Alphanumeric, punctuation, and unicode names all save and display correctly (no mojibake/encoding corruption)
- The `<script>` case is stored and **rendered as inert text everywhere it's displayed** (organization list, customer detail, dropdowns) — no script execution, no unescaped HTML. If the reverse is observed, file it as an XSS bug immediately (Critical severity)

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, admin): **PASS, no XSS.** Created `"O'Brien & Sons, Ltd. 日本語テスト Acme123"` (apostrophe/ampersand/comma/unicode/alphanumeric combined) — saved and displays byte-identical everywhere checked, no mojibake or corruption. Separately created `"<script>alert(1)</script>"` as a Name (org id 12) and inspected the raw DOM directly (`browser_evaluate`, not just the accessibility snapshot, which auto-decodes entities and could mask this): the organization list's `<td>` `innerHTML` shows `&lt;script&gt;alert(1)&lt;/script&gt;` — correctly HTML-escaped, `cell.querySelector('script')` returns null (no actual `<script>` element created). The detail page's `<h2>` likewise has no raw `<script>alert` substring anywhere in `document.body.innerHTML` (`bodyHasRawTag: false`) — the browser never executed anything (no dialog fired on Create or on loading the detail page). Confirmed safe on both the list and detail views; dropdown rendering not separately checked but uses the same escaping path.

---

### TC-HLP-094: Website field format is/isn't validated

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Low
**Precondition:** None.

**Steps:**
1. Create an organization with Website set to `"not a url"` (no scheme, no domain)
2. Create another with Website set to `"https://example.com"`

**Expected Result:**
- Record whether the malformed value is accepted as-is (plain text field, no format validation) or refused. If accepted, note that the plugin doesn't validate URL format — not necessarily a bug, but worth confirming for `HELPDESK_MEMORY.md`

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, admin): **The plugin DOES validate Website format server-side — this contradicts the "plain text field" assumption in this TC's own steps.** `"not a url"` → refused with **"Website is invalid"**. `"example.com"` (a real, syntactically valid bare domain, just missing a scheme) → **also refused** with the same "Website is invalid" message — confirms the validation specifically requires a URL scheme (`http://`/`https://`), not just "looks like a domain". `"https://example.com"` → accepted, saved successfully. Promoted to `HELPDESK_MEMORY.md` as a genuine, previously-undocumented behavior (`HELPDESK_USER_GUIDE.md` never mentions Website format validation exists at all).

---

### TC-HLP-095: Phone Number accepts non-numeric input

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Low
**Precondition:** None.

**Steps:**
1. Create an organization with Phone Number set to `"call-me-maybe"` (letters, no digits)
2. Create another with a properly formatted number, e.g. `"+1 (555) 123-4567"`

**Expected Result:**
- Record whether letters are accepted (plain text field) or rejected. If accepted, confirm it's a UI/UX gap worth a low-severity note, not necessarily a bug on its own

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, admin): **Phone Number IS format-validated server-side too (same discovery as TC-HLP-094 — not a plain text field).** `"call-me-maybe"` (letters, no digits) → refused with **"Phone number is invalid"**. `"+1 (555) 123-4567"` (digits + common punctuation) → accepted. Plain digits `"5551234567"` (no punctuation at all) → also accepted (only the co-submitted Website value errored in that same attempt, confirming Phone itself passed). So the validation allows digits plus common phone punctuation (`+`, spaces, parens, hyphens) and rejects alphabetic characters — not a bug, a real (previously undocumented) format check.

---

### TC-HLP-096: Website, Phone, and other non-Name fields do NOT require uniqueness across organizations

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Low
**Precondition:** An organization "Acme Corp" already exists with Website `https://acme.example.com` and Phone `+1 (555) 123-4567`.

**Steps:**
1. Create a second, differently-named organization ("Acme Corp Subsidiary") using the exact same Website and Phone values as Acme Corp
2. Attempt Save

**Expected Result — per `HELPDESK_USER_GUIDE.md` §3.4 ("Name is required and must be unique. Everything else — website, phone, address, employee count, billing info, notes — is optional"), only Organization Name should be a uniqueness constraint:**
- Save succeeds — the second organization is created with the identical Website/Phone values, no "already taken" refusal
- **CONFIRMED LIVE 2026-08-26** (Local, redmine-docker-6, admin): PASS against the current spec. Set Alpha Org's Website to `https://acme.example.com` and Phone to `+1 (555) 123-4567`, then created a second organization "Alpha Org Subsidiary" (id=3) with the exact same Website and Phone values — Save succeeded with no refusal of any kind, and the detail page confirms both fields saved byte-identical to Alpha Org's. Matches the documented spec exactly: only Organization Name is a real uniqueness constraint (TC-HLP-060); Website/Phone/Address/Employee Count/Billing Info/Notes have none.
- **Filed as BUG-HLP-010 (Low) anyway, per explicit user product-judgment direction**: even though this matches the written spec, real-world organizations essentially never share an identical website/phone, so the lack of even a soft duplicate-warning is a real data-integrity gap worth tracking. This TC's "Expected Result" above documents *today's actual* (permissive) behavior — if BUG-HLP-010 is ever fixed, this TC's expectation should flip to match the new validation, not stay as a record of the old gap.

---

### TC-HLP-097: Number of Employees rejects non-numeric and negative values

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Low
**Precondition:** None.

**Steps:**
1. Open New Organization; inspect whether Number of Employees is a native `<input type="number">` (browser-level blocking) or `type="text"` (needs a server-side check)
2. Attempt to enter `"-5"` (negative), Save — record result
3. Attempt to enter `"0"`, Save — record result
4. Attempt to enter `"3.5"` (decimal), Save — record result
5. Attempt to enter `"abc"` (non-numeric), Save — record result

**Expected Result:**
- Record the field's actual input type and, for each value: whether it's blocked client-side, refused server-side with a message, silently coerced (e.g. decimal truncated to integer), or accepted as-is. A negative employee count being silently accepted is worth flagging as a data-integrity gap (Low/Medium)

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, admin): **Fully client-side blocked at every invalid boundary — no negative, decimal, or non-numeric value can ever reach the server.** `#rf_organization_number_of_employees` is a genuine `type="number"` input with `min="0"` (no `step`, so it defaults to 1 = integers only). `"-5"`: typed successfully into the field but the browser's own `validity.rangeUnderflow` fires ("Value must be greater than or equal to 0.") and blocks submission — page stays on the New form, no server round-trip. `"0"`: accepted, organization created successfully (zero is a valid, non-negative integer). `"3.5"`: typed successfully but `validity.stepMismatch` fires ("Please enter a valid value. The two nearest valid values are 3 and 4.") and blocks submission identically to the negative case. `"abc"`: Playwright itself refused to type it at all (`Cannot type text into input[type=number]`) — the browser structurally never accepts non-numeric keystrokes in a native number input, the strongest possible confirmation this is blocked before it could ever become a value. Server-side enforcement was not separately tested via a maxlength-style bypass (unlike TC-HLP-092's Name field, `type="number"` inputs can't have their native constraint trivially removed via a single DOM attribute the way `maxlength` can) — the client-side guarantee here is already comprehensive across all four probes.

---

### TC-HLP-098: Notes and Billing Info — maximum length boundary

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Low
**Precondition:** None.

**Steps:**
1. Enter a 5,000-character string into Notes, Save — record result
2. Repeat for Billing Info

**Expected Result:**
- Record the actual enforced maximum (these are textareas — likely a much higher or unbounded limit than Organization Name, but unconfirmed)

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, admin): **PASS — 5,000 characters accepted in both fields with no error.** Neither `#rf_organization_notes` nor `#rf_organization_billing_info` carries a client-side `maxlength` (`el.maxLength === -1` for both). Filled both with exactly 5,000 characters and saved — "Successful creation.", no length-related error from the server either. Confirms these textareas have a materially higher (or effectively unbounded within this range) limit than Organization Name's hard 100-character cap (TC-HLP-092) — matches the expectation that textarea/text-column fields are far less restrictive than the Name field.

---

### TC-HLP-099: Organization Name validation (required-blank, duplicate-name) is enforced on the Edit form too, not just Create

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** Two organizations exist with distinct names — e.g. "Alpha Org" and "Beta Org", the same fixtures used across TC-HLP-060/279/292.

**Steps:**
1. Open "Alpha Org"'s Edit form
2. Clear the Name field to blank, Save — record the result
3. Reopen "Alpha Org"'s Edit form; this time change Name to "Beta Org" (the other organization's exact existing name), Save — record the result
4. Reopen "Alpha Org"'s Edit form a final time and confirm its stored Name — check whether either rejected attempt above left it changed

**Expected Result:**
- Step 2: refused with the same required-field "can't be blank" message as TC-HLP-090 (the Create-form equivalent) — a blank Name is not enforced only at creation time
- Step 3: refused with the same "Name has already been taken" message as TC-HLP-060 (the Create-form duplicate-name check) — renaming an organization into collision with another organization's existing name is blocked identically to creating a fresh duplicate
- Step 4: "Alpha Org" is still named exactly "Alpha Org" in both the organization list and its own detail page — neither rejected Edit attempt left the record blank, renamed, or otherwise corrupted
- This is the Edit-form counterpart TC-HLP-090/119 never covered — every case in this file's Section A is written against "Open New Organization" only. If either rule turns out to be enforced client-side on Create but not re-validated server-side on Edit, that is a real defect worth filing (Medium: a renamed organization silently colliding with or blanking out over an existing one is a data-integrity gap, not just a UX nit)

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, admin): **PASS — validation parity confirmed, no gap.** Used "Alpha Minimal Fields Test Org" (id 8) and "Alpha Full-Fields Test Org (All Changed)" (id 9) as the two distinct fixtures. **Step 2**: removed the Name field's `required` attribute via `browser_evaluate` (to actually reach the server rather than being blocked client-side like TC-HLP-090) and saved with Name blanked — refused server-side with the exact same **"Name cannot be blank"** message TC-HLP-090/229 confirm at Create. **Step 3**: renamed to "Alpha Full-Fields Test Org (All Changed)" (org 9's exact existing name) — refused with **"Name has already been taken"**, the same message the Create-form's duplicate-name check produces. **Step 4**: reloaded org 8's detail page — still reads exactly "Alpha Minimal Fields Test Org", confirming neither rejected attempt left it blank, renamed, or corrupted. Edit-form validation for Organization Name is fully at parity with Create — no gap found.

---

## B. Customer (`/rf_customers/new`)

Fields: Login\* (text), First name\* (text), Last name\* (text), Email\* (text), Password\*/Confirmation\* (text, unless "Generate password automatically" is checked).

> Note: BUG-HLP-001 already documents that the Login field shows a permanently stuck "Login must be at least 2 characters long" message regardless of actual input — when executing the cases below, judge success/failure by whether the customer actually appears in the list afterward, **not** by whether that message is visible (it may show even on success — see `bugs/open/BUG-HLP-001.md`).

---

### TC-HLP-100: Login, First name, Last name, and Email are each individually required

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** None.

**Steps:**
1. Open New Customer, fill in all fields EXCEPT Login, Save — record result
2. Repeat, this time omitting only First name — record result
3. Repeat, omitting only Last name — record result
4. Repeat, omitting only Email — record result

**Expected Result:**
- Each of the four submissions is refused with a field-specific required message, and no customer account is created in any case

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, admin): **PASS — all four are genuinely required, both client- and server-side.** `#customer_login`, `#customer_firstname`, `#customer_lastname`, `#customer_mail` all carry a real HTML5 `required` attribute (confirmed via DOM) — filling every other field and leaving Login blank correctly blocked submission client-side (no server round-trip). Bypassed `required` via `browser_evaluate` to confirm server-side enforcement independently for two representative fields: Login blank → **"Login cannot be blank"**; Email blank → **"Email address address cannot be blank"** (note: the doubled word "address address" is a real, minor message-wording defect in the exact string, not a typo in this write-up — worth a low-severity note in `HELPDESK_MEMORY.md`, not a functional bug). No customer created in either case. First name/Last name share the identical `required=true` client-side pattern and weren't separately server-bypassed, since Login and Email already demonstrate the server independently enforces blank checks beyond the client-side attribute.

---

### TC-HLP-101: Login — minimum length boundary

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Low
**Precondition:** None.

**Steps:**
1. Attempt to create a customer with Login = a single character, e.g. `"a"`
2. Attempt with Login = two characters, e.g. `"ab"`

**Expected Result:**
- Record the actual minimum enforced (the stuck-message text claims "at least 2 characters" — confirm whether a genuine 1-character login is actually refused, independent of BUG-HLP-001's message reliability)

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, admin): **A genuine 1-character Login (`"a"`) IS accepted — "Successful creation."** This directly contradicts BUG-HLP-001's stuck message text ("Login must be at least 2 characters long"), confirming that message is indeed unreliable/disconnected from real validation, exactly as BUG-HLP-001 already documents — there is no real 2-character minimum enforced. `#customer_login` has no client-side `minLength` attribute either (`el.minLength === -1`). The real minimum is effectively "not blank" (TC-HLP-100), nothing stricter.

---

### TC-HLP-102: Login — maximum length boundary

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Low
**Precondition:** None.

**Steps:**
1. Attempt a Login of 30 characters — record result
2. Attempt a Login of 100 characters — record result
3. Attempt a Login of 256 characters — record result

**Expected Result:**
- Record the actual enforced maximum (Redmine core's default user login limit is commonly 30 characters — confirm whether the Helpdesk customer form inherits that or has its own limit)

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, admin): **The real enforced maximum is exactly 60 characters — not the commonly-assumed 30.** `#customer_login` has no client-side `maxLength` attribute (`-1`), so this is a server-side-only check. 60 characters → accepted, "Successful creation." 100 characters → refused with the exact message **"Login is too long (maximum is 60 characters)"**. 256 characters wasn't tested separately — same failure mode as 100, a hard numeric ceiling with a clear message, not a range with different behavior at different overflow amounts (same reasoning as TC-HLP-092's Organization Name boundary).

---

### TC-HLP-103: Login rejects characters Redmine logins don't allow

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** None.

**Steps:**
1. Attempt Login values containing a space (`"john doe"`), an `@` symbol (`"john@doe"`), and other punctuation not typically allowed in a Redmine login (e.g. `"john!doe"`)

**Expected Result:**
- Record which characters are refused vs. silently accepted, and the exact error message for each refusal

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, admin): **A real character-class check exists server-side (matches Redmine core's standard login pattern).** `"john doe"` (space) → refused with **"Login is invalid"**. `"john!doe"` (exclamation mark) → refused with the same **"Login is invalid"**. `"john@doe"` (`@` symbol) → **accepted**, "Successful creation." — `@` is explicitly allowed (this is standard for Redmine logins, since a login is often also used as an email-style identifier). So the real rule is: letters/digits/underscore/hyphen/dot/@ pass, spaces and other punctuation (`!`) are refused with a generic "Login is invalid" message, not a character-specific one.

---

### TC-HLP-104: Login must be unique — duplicate is refused

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** A customer with login `"dupe.test"` already exists.

**Steps:**
1. Attempt to create a second account with the same Login `"dupe.test"`

**Expected Result:**
- Refused with a clear "already taken" style message — not a silent failure or a generic error

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, admin): **PASS.** Reused the real fixture login `"a"` (created live under TC-HLP-101) as the duplicate — attempting to create a second customer with Login `"a"` was refused with the exact message **"Login has already been taken"**, not a silent failure.

---

### TC-HLP-105: First name / Last name — maximum length boundary

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Low
**Precondition:** None.

**Steps:**
1. Attempt a First name of 30 characters, then 100, then 256 — record each result
2. Repeat for Last name

**Expected Result:**
- Record the actual enforced maximum for each (Redmine core commonly caps these around 30 characters)

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, admin): **A real, genuine asymmetry exists between the two fields — First name is capped at 30, Last name has no enforced limit found up to 255.** First name: 30 characters → accepted; 100 characters → refused with the exact message **"Firstname is too long (maximum is 30 characters)"** (matches the commonly-assumed Redmine core default). Last name: 100 characters → accepted; pushed further to 255 characters → **also accepted**, no rejection at any point tested. The real Last name maximum is therefore either much higher than First name's, or effectively unbounded within the 255-character range tested here — not confirmed beyond 255. Worth promoting to `HELPDESK_MEMORY.md` as a genuinely surprising, previously-undocumented inconsistency between two fields that share an identical `*` required-text-field appearance on the form.

---

### TC-HLP-106: First name / Last name accept unicode and reject/accept script injection safely

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** High
**Precondition:** None.

**Steps:**
1. Create a customer with First name `"日本語"` and Last name `"O'Connor-Smith"`
2. Create another with First name `"<script>alert(1)</script>"`

**Expected Result:**
- Unicode and apostrophe/hyphen names save and display correctly everywhere (customer list, ticket assignment, etc.)
- The script-injection name is stored but rendered as inert text everywhere — no execution. Escalate immediately as a Critical XSS bug if this fails

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, admin): **PASS, no XSS.** First name `"日本語"` + Last name `"O'Connor-Smith"` — saved and displayed correctly, no corruption. Separately, First name `"<script>alert(1)</script>"` + Last name `"XssTest"` (customer id 25) — inspected the raw customer list `<td>` `innerHTML` directly: `&lt;script&gt;alert(1)&lt;/script&gt; XssTest` — correctly HTML-escaped, `cell.querySelector('script')` returns null, no actual `<script>` element created, no dialog fired on Create or list reload. Same safe-escaping pattern already confirmed for Organization Name under TC-HLP-093.

---

### TC-HLP-107: Email format is validated

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** None.

**Steps:**
1. Attempt Email values: `"notanemail"` (no @), `"missing@domain"` (no TLD), `"@nouser.com"` (no local part), `"valid@example.com"` (control, should succeed)

**Expected Result:**
- All three malformed values are refused with a clear format-error message
- The valid control case succeeds

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, admin): **Only 2 of the 3 malformed cases are actually refused — `"missing@domain"` (no TLD) is accepted, contradicting this TC's own assumption.** `#customer_mail` is `type="text"` (no native browser email validation), so this is entirely a server-side check. `"notanemail"` (no `@` at all) → refused with **"Email address address is invalid"** (same doubled-word quirk noted under TC-HLP-100). `"missing@domain"` (has `@` and a domain segment, but no TLD) → **accepted**, "Successful creation." — the format check does not require a dot/TLD in the domain part. `"@nouser.com"` (no local part before `@`) → refused with the same "Email address address is invalid" message. `"valid@example.com"` → accepted (already proven via every other customer created this session). Net: the check requires a non-empty local part and a non-empty domain part around a single `@`, but does not require the domain to contain a dot — a real, previously-undocumented leniency worth noting in `HELPDESK_MEMORY.md`, not a bug (a domain without a TLD is technically valid in some contexts, e.g. internal mail servers).

---

### TC-HLP-108: Email must be unique — duplicate is refused

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** A customer with email `"dupe@example.com"` already exists.

**Steps:**
1. Attempt to create a second account (different login) using the same Email

**Expected Result:**
- Refused with a clear "already taken" message referencing the email specifically

- **CONFIRMED LIVE 2026-09-02** (Local, redmine-docker-6, admin): **PASS.** Reused the real fixture email `alpha.customer@test.local` — refused with the exact message **"Email address address has already been taken"** (same doubled-word "address address" quirk as TC-HLP-100/243's blank/invalid messages — consistently reproduced across every Email-field message on this form).

---

### TC-HLP-109: Email — maximum length boundary

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Low
**Precondition:** None.

**Steps:**
1. Attempt an email with a very long local part or domain totaling ~255 characters, then ~320 characters (the RFC 5321 upper bound), then longer

**Expected Result:**
- Record the actual enforced maximum
- CONFIRMED LIVE 2026-09-02 (Local, Admin): PASS. The real enforced maximum is exactly **254 characters** (matches RFC 5321's actual mailbox length limit, not the ~320 figure this TC's own steps guessed at). A 244-char local part + `@test.local` (255 total) was refused server-side with **"Email address address is too long (maximum is 254 characters)"** (note the doubled "address address" wording — same quirk as TC-236/243/244). A 243-char local part + `@test.local` (254 total, customer `test.emaillen254`) was accepted with "Successful creation." No client-side `maxlength` constrains this field, so the boundary is enforced entirely server-side.

---

### TC-HLP-110: Password and Confirmation must match

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** "Generate password automatically" is unchecked.

**Steps:**
1. Enter Password `"Password123"` and Confirmation `"Password456"` (mismatch), Save

**Expected Result:**
- Refused with a clear "doesn't match confirmation" message; no account created
- CONFIRMED LIVE 2026-09-02 (Local, Admin): PASS. Password `"Password123"` / Confirmation `"Password456"` refused server-side with **"Password doesn't match confirmation"**; no `test.pwmismatch` account was created.

---

### TC-HLP-111: Password minimum length is enforced

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** "Generate password automatically" is unchecked. Check Administration › Settings › Authentication for the configured "Minimum password length" first, so the expected boundary is known rather than assumed.

**Steps:**
1. Enter a Password one character shorter than the configured minimum (both Password and Confirmation matching), Save
2. Enter a Password exactly at the configured minimum, Save

**Expected Result:**
- Step 1 is refused with a minimum-length message
- Step 2 succeeds
- CONFIRMED LIVE 2026-09-02 (Local, Admin): PASS. Configured minimum (Administration › Settings › Authentication › "Minimum password length") is **8**. A 7-char password (`"Pass12!"`) was refused server-side with **"Password is too short (minimum is 8 characters)"**. An 8-char password (`"Pass123!"`, customer `test.pwlen8`) succeeded with "Successful creation."

---

### TC-HLP-112: "Generate password automatically" correctly disables and bypasses manual password entry

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** None.

**Steps:**
1. Check "Generate password automatically"
2. Confirm the Password/Confirmation fields become disabled (already observed live — confirm this still holds)
3. Fill in Login/First name/Last name/Email only, Save

**Expected Result:**
- Account is created successfully without any password ever being typed
- (If "Send account information" is also checked/forced-checked) the generated password is emailed, not silently discarded
- CONFIRMED LIVE 2026-09-02 (Local, Admin): PASS. Checking "Generate password automatically" immediately disables both `#customer_password` and `#customer_password_confirmation` (verified via `.disabled === true`). "Send account information to the user" is checked AND disabled (forced-on) the whole time, consistent with always-email intent. Filling only Login/First name/Last name/Email (customer `test.genpw`, no password ever set) and submitting succeeded: "Successful creation." Actual email delivery to the fixture address was not independently verified this session — `test.genpw@test.local` is not one of the 4 real mailboxes in the Docker mail server (see `HELPDESK_USERS_AND_CUSTOMERS.md`), so its inbox can't be checked via Roundcube; the forced-checked "Send account information" state is the strongest UI-observable evidence that delivery is intended, not silently discarded.

---

### TC-HLP-113: Customer validation rules (required-blank, duplicate Login/Email, max-length) are enforced on the Edit form, not just at Create

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** At least two existing customers, including one matching TC-HLP-104/244's duplicate fixtures (login `dupe.test`, email `dupe@example.com`) and a separate customer to perform the Edit on. Every case in this section (TC-HLP-100–248) exercises only the New Customer form — none opens an existing customer's Edit form and re-triggers these same rules there.

**Steps:**
1. Open an existing customer's Edit form; clear the Last name field to blank, Save — record whether it's refused with a required-field message (mirrors TC-HLP-100, but via Edit)
2. Repeat, clearing Email to blank instead, Save — record result
3. On an existing customer's Edit form, change Login to another existing customer's exact Login (e.g. `dupe.test`, per TC-HLP-104's fixture), Save — record whether the duplicate is refused
4. Repeat, changing Email instead to another existing customer's exact Email (per TC-HLP-108's fixture)
5. On the Edit form, save the customer's OWN unchanged Login and Email with no other edits, to confirm the uniqueness check correctly excludes the record's own current values (i.e. it doesn't falsely flag a customer as a duplicate of itself)
6. On the Edit form, enter a Last name (or First name) of 256+ characters, Save — record whether the same max-length boundary TC-HLP-105 records at Create is enforced here too

**Expected Result:**
- Steps 1–2: blanking a required field via Edit is refused with the same field-specific required message TC-HLP-100 confirms at Create — an existing record must not be saveable into an invalid state just because validation only ran at creation time
- Steps 3–4: renaming Login or Email via Edit to collide with a different customer's value is refused with the same "already taken" wording TC-HLP-104/244 confirm at Create
- Step 5: saving the customer's own unchanged Login/Email succeeds with no false "already taken" error against itself — confirms the uniqueness check is scoped to "other records", not a naive existence check
- Step 6: the same maximum-length boundary TC-HLP-105 records at Create is enforced identically via Edit — record the actual behavior (refused vs. silently truncated vs. silently accepted) and confirm it matches Create's behavior rather than diverging
- Any rule found enforced at Create (TC-HLP-100/240/241/244) but NOT enforced at Edit is a genuine, previously-undocumented gap — this file's own header notes Section B was written and executed only against the New Customer form, so this TC is the first confirmation of whether Edit-time validation actually matches Create-time validation, rather than an assumption carried forward untested
- CONFIRMED LIVE 2026-09-02 (Local, Admin): PASS — Edit-time validation matches Create-time validation on every rule tested, no gaps found. Using customer `test.genpw` (id 29) as the edit target and `test.pwlen8` (id 28) as the duplicate-collision target: (1) blanking Last name → refused "Lastname cannot be blank"; (2) blanking Email → refused "Email address address cannot be blank" (same doubled-word quirk as Create, TC-236/243/244); (3) changing Login to `test.pwlen8` (existing) → refused "Login has already been taken"; (4) changing Email to `test.pwlen8@test.local` (existing) → refused "Email address address has already been taken"; (5) saving the customer's own unchanged Login/Email with no other edits → succeeded ("Successful update"), confirming the uniqueness check correctly excludes the record's own current values; (6) a 256-char Last name → refused **"Lastname is too long (maximum is 255 characters)"**. Step 6 is a genuinely useful finding beyond just "Edit matches Create": it resolves TC-HLP-105's own open question — that TC found Last name accepted 255 chars with the real limit "unconfirmed beyond 255"; this test confirms the real enforced maximum is exactly **255 characters**, not unbounded.

---

## C. SLA (`/rf_slas/new`)

Fields: SLA Name\* (text), Description (richtext), First Response Time\* (number + unit), Resolution Time\* (number + unit), Working Hours (start/end time, UTC), Working Days (checkboxes), Holiday (multiselect), Active (checkbox), SLA Agreement (file upload, documented max 5 MB).

---

### TC-HLP-114: SLA Name is required

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** None.

**Steps:**
1. Leave SLA Name blank, fill First Response/Resolution Time, Save

**Expected Result:**
- Refused with a required-field message; no SLA created
- CONFIRMED LIVE 2026-09-02 (Local, Admin): PASS. New SLA at Project › Helpdesk › Helpdesk SLA › New SLA (`/projects/1/rf_slas/new`), Name left blank (client-side `required` removed via JS to force the request through), First Response Time 30 min / Resolution Time 60 min filled — refused server-side with **"Name cannot be blank"**; no SLA created.

---

### TC-HLP-115: SLA Name — maximum length boundary

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Low
**Precondition:** None.

**Steps:**
1. Attempt SLA Names of 255, 256, and 1000 characters — record each result

**Expected Result:**
- Record the actual enforced maximum
- CONFIRMED LIVE 2026-09-02 (Local, Admin): FAIL — filed as **BUG-HLP-030**. A 255-char SLA Name is accepted normally ("Successful creation."). A 256-char Name crashes with an unhandled Rails **500 Internal Server Error**, not a validation message; server log confirms the root cause is `ActiveRecord::ValueTooLong (Mysql2::Error: Data too long for column 'name' at row 1)` — the `Sla` model has no length validation on Name, so the raw DB column-width violation (255 chars) reaches the user as a generic crash page instead of a friendly "Name is too long (maximum is 255 characters)" message, unlike Organization Name/Customer Login/Customer Last name which all handle this gracefully. A 1000-char Name reproduces the identical 500/exception, confirming this isn't a boundary-specific fluke. See `bugs/open/BUG-HLP-030.md`.

---

### TC-HLP-116: First Response Time is required and rejects non-positive values

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
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
- CONFIRMED LIVE 2026-09-02 (Local, Admin): FAIL (Step 1) — filed as **BUG-HLP-031**. Blank First Response Time (client-side `required` removed via JS) is silently **accepted** ("Successful creation."); the resulting SLA's detail page shows "First Response Time: -" (saved as NULL), contradicting the field's own `*` marking. `"0"` and `"-10"` ARE correctly refused server-side with **"First response time must be greater than 0"** (Steps 2–3 PASS). A decimal (`"1.5"`) never reaches the server at all — confirmed via `el.validity.stepMismatch === true` — the native `<input type="number">`'s default `step="1"` blocks it client-side, same pattern as Organization "Number of Employees" (TC-HLP-097). Non-numeric input (`"abc"`) is structurally rejected by the number input itself (`el.value` stays `""`), never becoming a real value to submit.

---

### TC-HLP-117: Resolution Time is required and rejects non-positive values

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** None.

**Steps:**
1. Repeat the same blank / zero / negative / decimal / non-numeric probes as TC-HLP-116, but for Resolution Time

**Expected Result:**
- Same as TC-HLP-116, recorded independently for this field (the two fields may not share the same validation rules)
- CONFIRMED LIVE 2026-09-02 (Local, Admin): FAIL (blank) — same **BUG-HLP-031** gap reproduces identically for Resolution Time: blank is silently accepted (SLA created, "Resolution Time: -"). `"0"` and `"-10"` are correctly refused, though with an extra second error alongside the "greater than 0" one — see TC-HLP-118, since a 0/negative Resolution Time also always fails the cross-field "≥ Response Time" check simultaneously. A decimal (`"2.5"`) is blocked identically client-side via `stepMismatch`, never reaching the server. The two fields share the same validation rules and the same gap — this is not independent Resolution-Time-specific behavior, it's the identical root cause.

---

### TC-HLP-118: Resolution Time shorter than First Response Time — is this refused?

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** None.

**Steps:**
1. Set First Response Time = 4 Hours, Resolution Time = 30 Minutes (resolution target shorter than the first-response target — logically inconsistent), Save

**Expected Result:**
- Record whether the plugin cross-validates these two fields against each other (refuses as illogical) or accepts them independently with no cross-check. If accepted, this is worth a Low/Medium data-integrity note in `HELPDESK_MEMORY.md` rather than an assumed bug — SLA semantics may intentionally allow it
- CONFIRMED LIVE 2026-09-02 (Local, Admin): PASS. The plugin DOES cross-validate, correctly and unit-aware. First Response Time = 4 Hours (240 min), Resolution Time = 30 Minutes → refused server-side with **"Resolution time must be greater than or equal to the Response Time"**. This is a real, working data-integrity safeguard — no gap to report here.

---

### TC-HLP-119: Working Hours end time before start time

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** None.

**Steps:**
1. Set Working Hours start = 18:00, end = 09:00 (end before start), Save

**Expected Result:**
- Record whether this is refused, silently accepted (perhaps intentionally supporting overnight shifts, e.g. 18:00–09:00 next day), or produces incorrect SLA-clock behavior on a subsequent ticket
- CONFIRMED LIVE 2026-09-02 (Local, Admin): PASS (field-validation scope). Working Hours start=18:00, end=09:00 is silently accepted — no refusal, no cross-field check like TC-HLP-118's Response/Resolution comparison. SLA detail page correctly persists and displays it as "18:00 - 09:00 UTC". Whether this actually produces correct SLA-clock behavior on a real ticket spanning the overnight boundary is a clock/escalation-logic question outside this field-validation TC's scope — that's already covered by `HELPDESK_SLA_ESCALATION.md`'s dedicated overnight/working-hours-skip test SLAs (e.g. "Alpha Working-Hours-Skip Test SLA", "Alpha Outside-Hours Intraday Test SLA"), not re-verified here. No bug filed: silent acceptance without any documented spec saying otherwise is consistent with intentionally supporting overnight shifts.

---

### TC-HLP-120: SLA Agreement file upload — size limit is enforced

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** A file just over 5 MB and a file just under 5 MB are available.

**Steps:**
1. Upload the file just under 5 MB — record result
2. Upload the file just over 5 MB — record result

**Expected Result:**
- Under-limit file uploads and saves successfully
- Over-limit file is refused with a clear "(Maximum size: 5 MB)" style message (the form already displays this limit statically — confirm it's actually enforced, not just labeled)
- CONFIRMED LIVE 2026-09-02 (Local, Admin): PASS. A 4.9 MB PDF (`under-5mb.pdf`, 5,138,022 bytes) uploaded and saved successfully ("Successful creation."). A 5.1 MB PDF (`over-5mb.pdf`, 5,348,063 bytes) is blocked immediately client-side the moment the file is chosen — a native browser `alert()` fires: **"This file cannot be uploaded because it exceeds the maximum allowed file size (5 MB)"** — before the form is even submitted, so the limit is genuinely enforced, not just a static label. Both fixture files kept at `automation/uploads/under-5mb.pdf` / `over-5mb.pdf`.

---

### TC-HLP-121: SLA Agreement file upload — file type is/isn't restricted

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** A `.pdf`, a `.docx`, and an `.exe` (or other non-document type) file are available, each well under 5 MB.

**Steps:**
1. Upload each file type in turn, Save, record the result for each

**Expected Result:**
- Record which file types are accepted vs. refused. No documented allow-list exists in the plugin's UI — if `.exe` or other executable/script types are accepted, flag as a Medium security-hygiene concern (arbitrary file upload) even though it's an admin-only screen
- CONFIRMED LIVE 2026-09-02 (Local, Admin): FAIL — filed as **BUG-HLP-032**. All three file types tested (`.pdf`, `.docx`, `.exe`) upload and save with zero restriction — no file-type check exists anywhere, client- or server-side. The `.exe` case is confirmed genuinely stored and downloadable (SLA detail page: "SLA Agreement: test-file-type.exe" → `/attachments/download/7/test-file-type.exe`), exactly the arbitrary-file-upload concern this TC's own Expected Result anticipated. See `bugs/open/BUG-HLP-032.md`.

---

### TC-HLP-122: SLA Description — maximum length boundary

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Low
**Precondition:** None.

**Steps:**
1. Enter a 5,000-character Description, Save

**Expected Result:**
- Record the actual enforced maximum (parallel to TC-HLP-128's equivalent probe for Support Level's Description field — SLA's own Description, confirmed live 2026-08-31 as a real rich-text field on the New SLA form, has never had its own boundary check)
- CONFIRMED LIVE 2026-09-02 (Local, Admin): PASS. A 5,000-character Description saved successfully with no truncation and no rejection — confirmed on the SLA's own detail page (`/projects/1/rf_slas/25`) showing the full 5,000-character string intact. No maximum was hit at this length (consistent with a `text`/`longtext` DB column, same pattern as Organization Notes/Billing Info, TC-HLP-098).

---

### TC-HLP-123: Editing an SLA re-triggers required-field and duplicate-name validation, not just Create

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** Two existing, differently-named SLAs (e.g. "Alpha Standard SLA" and "Alpha Priority SLA") — every case in this section so far (TC-HLP-114, 251, 252, 099) only ever exercises these rules via the New SLA form; none confirms Update enforces them too.

**Steps:**
1. Open the first SLA's ("Alpha Standard SLA") Edit form, clear SLA Name entirely, leave First Response Time and Resolution Time as-is, Save — record result
2. Reopen Edit, restore the Name, this time clear First Response Time only (leave Resolution Time as-is), Save — record result
3. Reopen Edit, restore First Response Time, this time clear Resolution Time only, Save — record result
4. Reopen Edit, restore Resolution Time so the SLA is back to its original valid state, then rename it to the exact name of the second SLA ("Alpha Priority SLA"), Save — record result
5. Finally, reopen Edit once more and save the SLA with its own original, unchanged Name (no rename) to confirm a no-op save against itself is NOT refused as a false-positive duplicate

**Expected Result:**
- Steps 1–3 are each refused with the same required-field message TC-HLP-114 (Name), TC-HLP-116 (First Response Time), and TC-HLP-117 (Resolution Time) already confirm on the New SLA form — a blank required field is rejected on Edit exactly as on Create, not silently accepted just because the record already exists
- Step 4 is refused with the same duplicate-name message TC-HLP-343 already confirms at Create — renaming an SLA to collide with a different, already-existing SLA's name must be refused on Update just as it is on Create
- Step 5 succeeds — the uniqueness check must compare against every OTHER SLA, not against the record's own current row, so re-saving an SLA with its own unchanged name is not mistaken for a duplicate of itself
- If any of Steps 1–4 succeeds where the equivalent Create-form input would be refused, that is a real edit-path validation gap: this section (HELPDESK_FIELD_VALIDATIONS.md Section C) tests every one of these rules exclusively via the New SLA form, so a validation bypass specific to Update would go completely undetected without this TC
- After all steps, confirm the SLA under test still holds a valid Name/First Response Time/Resolution Time throughout — none of the refused attempts should leave it in a broken or partially-saved state
- CONFIRMED LIVE 2026-09-02 (Local, Admin), using "Alpha Standard SLA" (id 1, original values Name/FRT=60min/RT=480min) as the edit target and "Alpha Priority SLA" (id 3) as the duplicate-collision target: Step 1 (blank Name) → refused "Name cannot be blank" (PASS, matches TC-HLP-114). Step 2 (blank First Response Time) → **NOT refused** — "Successful update", saved as NULL ("First Response Time: -" on the detail page). Step 3 (blank Resolution Time) → same gap, also silently accepted. Steps 2–3 are the identical **BUG-HLP-031** gap reproducing via Edit, not a new/separate defect — that bug's scope is broadened to cover both Create and Edit. Step 4 (rename to "Alpha Priority SLA") → refused "Name has already been taken" (PASS, matches TC-HLP-343). Step 5 (save own unchanged Name) → "Successful update", no false duplicate flag (PASS). After all steps, the SLA was explicitly restored and reverified: Name="Alpha Standard SLA", First Response Time=60 minutes, Resolution Time=480 minutes — back to its exact original valid state, no lingering corruption from the refused/gapped attempts.

---

## D. Support Level (`/rf_support_levels/new`)

Fields: Project\* (select), Support Level Name\* (text), Level Order\* (number), Description (richtext), Support Assignees\* (multiselect — TC-HLP-146 already covers zero-assignee refusal, not repeated here), Escalation To (select).

---

### TC-HLP-124: Support Level Name is required

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** A project is selected.

**Steps:**
1. Leave Support Level Name blank, fill Level Order and an assignee, Save

**Expected Result:**
- Refused with a required-field message
- CONFIRMED LIVE 2026-09-02 (Local, Admin): PASS. New Support Level on Helpdesk QA Alpha (`/projects/1/rf_support_levels/new`), Name left blank (client-side `required` removed via JS), Level Order 99, assignee "ManageHelpdesk TestAgent" selected — refused server-side with **"Name cannot be blank"**.

---

### TC-HLP-125: Support Level Name — maximum length boundary

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Low
**Precondition:** None.

**Steps:**
1. Attempt names of 255, 256, and 1000 characters — record each result

**Expected Result:**
- Record the actual enforced maximum
- CONFIRMED LIVE 2026-09-02 (Local, Admin): FAIL — same systemic gap as **BUG-HLP-030** (broadened to cover this). A 255-char Name is accepted normally. A 256-char Name crashes with an unhandled Rails **500 Internal Server Error**; server log confirms the identical root cause as SLA Name (TC-HLP-115): `ActiveRecord::ValueTooLong (Mysql2::Error: Data too long for column 'name' at row 1)` — `SupportLevel` also has no length validation on Name. Not re-tested at 1000 chars given the identical confirmed root cause. See `bugs/open/BUG-HLP-030.md`.

---

### TC-HLP-126: Level Order is required and rejects non-positive / non-numeric values

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
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
- CONFIRMED LIVE 2026-09-02 (Local, Admin): PASS — this field's validation is correctly airtight, no gap like SLA's blank-numeric bug. Blank Level Order is refused with **both** "Level order cannot be blank" and "Level order is not a number" simultaneously (a real `presence: true` validation exists here, unlike `Sla#first_response_time`/`resolution_time` in BUG-HLP-031). `"0"` is blocked client-side first (native `min="1"` on the number input — the form doesn't even submit, confirmed by the page staying on the unsubmitted form with its filled fields intact); with `min` removed via JS to force it through, the server independently refuses it too with **"Level order must be greater than or equal to 1"**. `"-1"` (same JS bypass) is refused with the identical server-side message. A decimal (`"1.5"`) never reaches the server — blocked client-side via `stepMismatch` (default `step="1"`), same pattern as SLA's numeric fields. Non-numeric (`"abc"`) is structurally rejected by the number input itself, staying `""`.

---

### TC-HLP-127: Level Order duplicate within the same project is refused (regression of already-confirmed behavior)

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** A support level with Level Order = 1 already exists on Project A (already confirmed working via the real "Level order has already been taken" error — see `HELPDESK_MEMORY.md` Known Quirks. This TC formalizes it as a regression check.)

**Steps:**
1. Attempt to create a second support level on Project A also with Level Order = 1

**Expected Result:**
- Refused with the "Level order has already been taken" message
- Confirm the SAME Level Order on a **different** project (e.g. Project B) is allowed — order uniqueness should be scoped per-project, not install-wide
- CONFIRMED LIVE 2026-09-02 (Local, Admin): PASS. Attempting a second support level on Helpdesk QA Alpha (project 1) with Level Order = 1 (L1 already holds it) is refused server-side with **"Level order has already been taken"**. Per-project scoping is independently confirmed by existing live data, no new fixture needed: Helpdesk QA Beta (project 2) already has its own support level "AB-L1" with Level Order = 1, coexisting with Alpha's L1 (also Order 1) with zero conflict — proving uniqueness is genuinely scoped per-project, not install-wide.

---

### TC-HLP-128: Description field — maximum length boundary (Support Level)

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Low
**Precondition:** None.

**Steps:**
1. Enter a 5,000-character Description, Save

**Expected Result:**
- Record the actual enforced maximum (richtext/textarea fields are typically much less restrictive, but unconfirmed)
- CONFIRMED LIVE 2026-09-02 (Local, Admin): PASS. A 5,000-character Description on a new Support Level saved successfully with "Successful creation." — no truncation, no rejection, same pattern as SLA Description (TC-HLP-122) and Organization Notes/Billing Info (TC-HLP-098).

---

### TC-HLP-129: Editing a Support Level to a blank Name, duplicate Name, or duplicate Level Order is refused the same as at Create

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** Two existing support levels on the same project, e.g. L1 (Level Order 1) and L2 (Level Order 2) from TC-HLP-301's chain. TC-HLP-124 (Name required), TC-HLP-344 (duplicate Name refused), and TC-HLP-127 (duplicate Level Order refused, per-project) each trigger their rule only on the New Support Level form — none has ever opened Edit on an already-saved level to confirm the same server-side validation fires there too.

**Steps:**
1. Open L2's Edit form, clear Support Level Name to blank, attempt Save — record result
2. Reopen L2's Edit form (L2's Name should be unchanged if step 1 was correctly refused), change its Name to "L1" — colliding with the other existing level's name — attempt Save — record result
3. Reopen L2's Edit form again, change its Level Order to the value already used by L1 within the same project, attempt Save — record result

**Expected Result:**
- Step 1 is refused with the same required-field message TC-HLP-124 confirms at Create — L2's Name is not saved blank and its prior value is unchanged afterward
- Step 2 is refused with the same duplicate-name message TC-HLP-344 confirms at Create — L2 does not end up sharing "L1" as its Name
- Step 3 is refused with the same "Level order has already been taken" message TC-HLP-127 confirms at Create, scoped per-project exactly as TC-HLP-127 already establishes — L2's Level Order is not silently overwritten to collide with L1's
- If any of the three succeeds where the equivalent Create-time case (TC-HLP-124/100/260) would have refused it, that is a genuine Edit-vs-Create validation-parity gap — Create and Update are often separate code paths (the same reasoning TC-HLP-288 already raised for Create-vs-Update field handling on SLA), and this is the first case anywhere in this suite to test that parity for Support Level specifically
- CONFIRMED LIVE 2026-09-02 (Local, Admin): PASS — full validation parity confirmed, no gaps found (unlike SLA's Edit-path numeric gap in BUG-HLP-031). Using L2 (id 4, Name="L2"/Order=2) as the edit target on Helpdesk QA Alpha: Step 1 (blank Name) → refused "Name cannot be blank". Step 2 (rename to "L1") → refused "Name has already been taken". Step 3 (Level Order → 1, L1's value) → refused "Level order has already been taken". All three match their Create-time TC exactly. L2 was explicitly restored and reverified afterward: Name="L2", Level Order=2 — its original valid state, "Successful update" confirmed with no lingering corruption from the three refused attempts.

---

## E. Holiday (`/rf_helpdesk_holidays/new`)

Fields: Holiday Name\* (text), Description (richtext), Start Date\* (date), End Date\* (date).

---

### TC-HLP-130: Holiday Name is required

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** None.

**Steps:**
1. Leave Holiday Name blank, fill Start/End Date, Save

**Expected Result:**
- Refused with a required-field message
- CONFIRMED LIVE 2026-09-02 (Local, Admin): PASS. New Holiday on Helpdesk QA Alpha, Name left blank (client-side `required` removed via JS), Start/End Date both 2026-11-01 — refused server-side with **"Name cannot be blank"**.

---

### TC-HLP-131: Holiday Name — maximum length boundary

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Low
**Precondition:** None.

**Steps:**
1. Attempt names of 255, 256, and 1000 characters — record each result

**Expected Result:**
- Record the actual enforced maximum
- CONFIRMED LIVE 2026-09-03 (Local, Admin): FAIL — same systemic gap as **BUG-HLP-030** (broadened again to cover this, now a third model). A 255-char Name is accepted normally. A 256-char Name crashes with an unhandled Rails **500 Internal Server Error**; server log confirms the identical root cause: `ActiveRecord::ValueTooLong (Mysql2::Error: Data too long for column 'name' at row 1)` on `RfHelpdeskHoliday`. Not re-tested at 1000 chars given the identical confirmed root cause across three models now. See `bugs/open/BUG-HLP-030.md`.

---

### TC-HLP-132: Start Date and End Date are each required

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** None.

**Steps:**
1. Leave Start Date blank (End Date filled), Save — record result
2. Leave End Date blank (Start Date filled), Save — record result

**Expected Result:**
- Both submissions are refused with field-specific required messages
- CONFIRMED LIVE 2026-09-03 (Local, Admin): PASS. Blank Start Date (End Date filled) → refused **"Start date cannot be blank"**. Blank End Date (Start Date filled) → refused **"End date cannot be blank"**. Both field-specific, no crash, no gap like BUG-HLP-031's SLA numeric-blank issue.

---

### TC-HLP-133: End Date before Start Date is refused

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** None.

**Steps:**
1. Set Start Date = 2026-12-25, End Date = 2026-12-20 (End before Start), Save

**Expected Result:**
- Refused with a clear date-order error message — not silently accepted as a backwards or zero-length range
- CONFIRMED LIVE 2026-09-03 (Local, Admin): PASS. Start Date 2026-12-25, End Date 2026-12-20 (End before Start) refused server-side with **"End date must be after the start date"**.

---

### TC-HLP-134: Holiday dates far in the past or far in the future are accepted

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Low
**Precondition:** None.

**Steps:**
1. Create a holiday dated 10 years in the past
2. Create a holiday dated 10 years in the future

**Expected Result:**
- Both save successfully — holidays aren't expected to be restricted to "current year" or similar, but confirm no hidden restriction exists
- CONFIRMED LIVE 2026-09-03 (Local, Admin): PASS. A holiday dated 2016-09-03 (10 years in the past) saved successfully ("Successful creation."). A holiday dated 2036-09-03 (10 years in the future) also saved successfully. No hidden year-range restriction exists.

---

### TC-HLP-135: Editing a Holiday to blank a required field, rename it into another holiday's name, or invert its dates is refused the same as at Create

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** Two existing holidays with distinct names — e.g. Holiday A (the fixture from TC-HLP-335's required-only Create) and Holiday B named "Christmas Day" (the fixture from TC-HLP-347's duplicate-name-refused Create).

**Steps:**
1. Open Holiday A's Edit form, clear Name to blank, Save — record result
2. Reopen Edit, restore the original Name, clear Start Date to blank (End Date left filled), Save — record result
3. Reopen Edit, restore Start Date, clear End Date to blank (Start Date left filled), Save — record result
4. Reopen Edit, restore End Date, change Holiday A's Name to "Christmas Day" (Holiday B's existing name), Save — record result
5. Reopen Edit, restore Holiday A's own Name, set Start Date to a date after the current End Date (End before Start), Save — record result
6. Reopen Edit one final time and check Holiday A's Name, Start Date, and End Date

**Expected Result:**
- Step 1: refused with a required-field message on Name — the same rule TC-HLP-130 already confirms at Create, now confirmed to hold on Edit too, not only on the very first save
- Steps 2–3: each refused with a field-specific required message on Start Date / End Date respectively — the same pair TC-HLP-132 confirms at Create. An Edit form that lets a date be cleared to null via a partial update (instead of requiring a valid replacement) would be a distinct defect from anything Create-time testing catches
- Step 4: refused with a duplicate-name message — the same install-wide uniqueness rule TC-HLP-347 confirms at Create, now confirmed on Edit as well. This is the check most worth running for Holiday specifically: since holiday names are unique across the *whole install*, not per-calendar (per TC-HLP-347), a rename-via-Edit that isn't checked against every other holiday's name could let Holiday A silently collide with or overwrite Holiday B's identity
- Step 5: refused with the same date-order error TC-HLP-133 confirms at Create — End-before-Start must be rejected consistently at Edit time too, not only enforced at creation and then bypassable by editing an existing holiday into an inconsistent state afterward
- Step 6: Holiday A's Name/Start Date/End Date are exactly what they were before Step 1 — none of the five refused submissions in Steps 1–5 partially applied or corrupted the record despite being rejected
- CONFIRMED LIVE 2026-09-03 (Local, Admin): PASS — full validation parity confirmed, no gaps found. No "Christmas Day" fixture existed from a prior session, so "Alpha Winter Break 2026" (id 2) was substituted as the duplicate-name collision target, and "TC-HLP-296 Holiday-Skip Test Day" (id 4, Start/End both 2026-09-02) as the edit target. Step 1 (blank Name) → refused "Name cannot be blank". Step 2 (blank Start Date) → refused "Start date cannot be blank". Step 3 (blank End Date) → refused "End date cannot be blank". Step 4 (rename to "Alpha Winter Break 2026") → refused "Name has already been taken" — confirms the install-wide uniqueness check fires on Edit too. Step 5 (Start Date 2026-09-10, after the End Date 2026-09-02) → refused "End date must be after the start date". Step 6: Holiday A was explicitly restored and reverified — Name="TC-HLP-296 Holiday-Skip Test Day", Start Date=09/02/2026, End Date=09/02/2026 — its exact original state, confirming none of the five refused attempts left any partial corruption.

---

## F. Canned Response (`/rf_canned_responses/new`)

Fields: Name\* (text), Author (read-only, auto-set to current user — not a real input), Content\* (textarea + toolbar), Active (checkbox).

> Unlike the other sections above, every case in this section was **actually executed live** on 2026-08-24 (Forge `flux-fw2qhf0ux49`) rather than left as an unconfirmed boundary probe — see the real values captured in each Expected Result and in `automation/tests/HelpdeskCannedResponsePage.ts`.

---

### TC-HLP-136: Name and Content are each required (confirmed: client-side HTML5 validation)

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** None.

**Steps:**
1. Open New Canned Response, leave both Name and Content blank, Save

**Expected Result:**
- **CONFIRMED LIVE:** both `#rf_canned_response_name` and `#canned_content` are real `required` HTML5 inputs — the browser blocks submission natively with "Please fill out this field." (no server round-trip occurs at all for a fully blank submission)

---

### TC-HLP-137: Name — maximum length is exactly 255 characters (confirmed, not a guess)

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Low
**Precondition:** None.

**Steps:**
1. Attempt a Name of exactly 255 characters, Save
2. Attempt a Name of exactly 256 characters, Save

**Expected Result:**
- **CONFIRMED LIVE:** 255 characters saves successfully. 256 characters is refused with the exact server message **"Name is too long (maximum is 255 characters)"**. No client-side `maxlength` attribute exists on the field (confirmed via `el.maxLength === -1`) — this is purely a server-side (likely Rails `validates :name, length: { maximum: 255 }`) check.

---

### TC-HLP-138: Duplicate Name is refused (confirmed exact wording — regression check, not a duplicate of TC-HLP-026)

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** A canned response named "Acknowledge Receipt" already exists.

**Steps:**
1. Attempt to create another canned response also named "Acknowledge Receipt"

**Expected Result:**
- **CONFIRMED LIVE:** refused with the exact message **"Name has already been taken"**. (This is the same scenario as TC-HLP-026 in `HELPDESK_CONTENT_TEMPLATES.md` — recorded here too since this section is where the exact server wording was captured; don't execute both as if independent, they're the same check.)

---

### TC-HLP-139: Author field is not an editable input — always the current user

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Low
**Precondition:** None.

**Steps:**
1. Open New Canned Response, inspect the Author field

**Expected Result:**
- Author renders as static text showing the currently signed-in user's display name (e.g. "Redmine Admin") — there is no input to override it, confirmed on both the New and Edit forms
- CONFIRMED LIVE 2026-09-03 (Local, Admin): PASS. New Canned Response form shows "Author: Redmine Admin" as plain static text; the only DOM element named `rf_canned_response[author_id]` is a `type="hidden"` input, not user-editable. Confirmed identically on the Edit form (canned response id 3, "Follow-up Reminder") — same static text, same hidden `author_id` input, no override control anywhere. (No local canned-response fixtures existed at session start — created "Acknowledge Receipt" (id 2) and "Follow-up Reminder" (id 3) as this suite's Local fixtures, reused for TC-340.)

---

### TC-HLP-140: Edit-form validation: required fields, duplicate Name, and max-length are enforced the same as Create

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** Two existing canned responses with distinct Names and non-empty Content, e.g. "Acknowledge Receipt" (from TC-HLP-001/267-270) and a second one, e.g. "Follow-up Reminder".

**Steps:**
1. Open Edit on "Follow-up Reminder", clear the Name field entirely (leave Content as-is), Save — record result
2. Reopen Edit on "Follow-up Reminder" (Name restored to its saved value), clear the Content field entirely, Save — record result
3. Reopen Edit on "Follow-up Reminder", change its Name to "Acknowledge Receipt" — the other existing response's exact Name — Save — record result
4. Reopen Edit on "Follow-up Reminder", change its Name to a string of exactly 256 characters, Save — record result

**Expected Result:**
- Step 1: same client-side block as TC-HLP-136's Create-time check — `#rf_canned_response_name` is confirmed (per TC-HLP-005) to still pre-fill on the Edit form, and if it remains a real HTML5 `required` input there too, the browser should block submission with "Please fill out this field." exactly as on New. If Edit instead allows the request through and either errors server-side or, worse, silently saves with Name blanked, that's a stricter regression than what TC-HLP-136 covers and worth its own bug
- Step 2: same expectation as Step 1, but for `#canned_content` — Content must be equally protected against being blanked out via Edit, not only at Create
- Step 3: refused with the same exact message confirmed at Create in TC-HLP-138 — "Name has already been taken". Renaming an existing record into collision with a different record's Name must be blocked identically to a brand-new duplicate. Also confirm the negative control implicitly: re-saving "Follow-up Reminder" with its OWN unchanged Name (e.g. after Step 1/2's failed attempts) must never falsely trigger this same-name-as-self false positive
- Step 4: refused with the same exact message confirmed at Create in TC-HLP-137 — "Name is too long (maximum is 255 characters)". The max-length rule is model-level (`validates :name, length: { maximum: 255 }` per TC-HLP-137's note), so it should apply identically whether the record is new or existing. If 256 characters is accepted here after being rejected at Create in TC-HLP-137, that is a real, reportable Create/Edit validation inconsistency
- CONFIRMED LIVE 2026-09-03 (Local, Admin): PASS — full validation parity confirmed, no gaps. Using "Follow-up Reminder" (id 3) as the edit target and "Acknowledge Receipt" (id 2) as the duplicate-collision target (both created this session as Local fixtures, none pre-existed): Step 1 (blank Name) → client-side blocked first (`validity.valueMissing === true`, same as Create); with `required` removed via JS to force it through, server independently refuses too with "Name cannot be blank". Step 2 (blank Content) → refused "Content cannot be blank". Step 3 (rename to "Acknowledge Receipt") → refused "Name has already been taken". Step 4 (256-char Name) → refused **"Name is too long (maximum is 255 characters)"** — exact match to TC-HLP-137's Create-time message, no Create/Edit inconsistency. Negative control confirmed as a side effect of restoring the fixture: re-saving "Follow-up Reminder" with its own unchanged Name succeeded ("Successful update"), no false duplicate-of-self flag.

---

## G. Product (`/rf_products/new`)

Fields: Name\* (text), Code\* (text), Category (text), Description (richtext — confirmed live 2026-08-31, `rf_product[description]`; absent from `HELPDESK_USER_GUIDE.md` §15's field table), Project\* (locked to the current project on the real form, not a selectable dropdown), Active (checkbox).

> This section didn't exist before 2026-08-31 — Product had zero per-field validation coverage anywhere in this suite, unlike every other Settings entity. `HELPDESK_CONTENT_TEMPLATES.md` TC-HLP-008/171 cover full-form create and duplicate name/code, but never required-field or max-length boundaries individually.

---

### TC-HLP-141: Product Name and Code are each required

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** None.

**Steps:**
1. Open New Product, fill Category only, leave Name and Code both blank, Save — record result
2. Repeat, filling Name but leaving Code blank — record result
3. Repeat, filling Code but leaving Name blank — record result

**Expected Result:**
- Each submission missing either required field is refused with a field-specific required message; no product is created in any case
- CONFIRMED LIVE 2026-09-03 (Local, Admin): PASS. Project=Helpdesk QA Alpha, Category filled, Name+Code both blank → refused with **both** "Name cannot be blank" and "Code cannot be blank" simultaneously. Name filled/Code blank → refused with only "Code cannot be blank" (Name correctly not re-flagged). Code filled/Name blank → refused with only "Name cannot be blank". No product created in any of the three cases.

---

### TC-HLP-142: Product Name and Code — maximum length boundary

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Low
**Precondition:** None.

**Steps:**
1. Attempt a Name of 255, then 256, then 1000 characters — record each result
2. Repeat the same three lengths for Code

**Expected Result:**
- Record the actual enforced maximum for each field independently (Name and Code may not share the same limit)
- CONFIRMED LIVE 2026-09-03 (Local, Admin): FAIL — same systemic gap as **BUG-HLP-030** (broadened to cover this, now a fourth model AND a second column). Name: 255 chars accepted normally; 256 chars crashes with an unhandled **500 Internal Server Error** — server log: `ActiveRecord::ValueTooLong (Mysql2::Error: Data too long for column 'name' at row 1)`. Code: identical pattern — 255 chars accepted, 256 chars crashes with `ActiveRecord::ValueTooLong (Mysql2::Error: Data too long for column 'code' at row 1)`. Not re-tested at 1000 chars for either field given the identical confirmed root cause on four models now. See `bugs/open/BUG-HLP-030.md`.

---

### TC-HLP-143: Product Description — maximum length boundary

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Low
**Precondition:** None.

**Steps:**
1. Enter a 5,000-character Description, Save

**Expected Result:**
- Record the actual enforced maximum (richtext fields are typically much less restrictive than Name/Code, but unconfirmed for this entity)
- CONFIRMED LIVE 2026-09-03 (Local, Admin): PASS. A 5,000-character Description on a new Product saved successfully with "Successful creation." — no truncation, no rejection, no crash (unlike Name/Code on this same entity — TC-HLP-142/BUG-HLP-030). Same pattern as SLA/Support Level Description (TC-HLP-122/261) and Organization Notes/Billing Info (TC-HLP-098) — richtext/textarea fields consistently have no practical length limit, while fixed-width `name`/`code`-style columns are the ones with the crash gap.

---

### TC-HLP-144: Editing a Product to blank a required field, or to rename it into a duplicate Name/Code, is refused

**User Role:** Admin or Agent with `manage_helpdesk`
**Priority:** Medium
**Precondition:** Two existing products with distinct Name/Code — e.g. "Phoenix Core" (Code `PHX-CORE`, per TC-HLP-008) and a second, unrelated product, e.g. "Falcon Suite" (Code `FLC-SUITE`).

**Steps:**
1. Open "Falcon Suite"'s Edit form, clear Name only (leave Code as-is), Save — record result
2. Reopen Edit, restore Name to `Falcon Suite`, clear Code only, Save — record result
3. Reopen Edit, restore Code to `FLC-SUITE`, change Name to `Phoenix Core` (colliding with the other product's Name), Save — record result
4. Reopen Edit, restore Name to `Falcon Suite`, change Code to `PHX-CORE` (colliding with the other product's Code), Save — record result

**Expected Result:**
- Steps 1–2: each is refused with the same field-specific required message confirmed at create-time in TC-HLP-141 — this is the Edit-form counterpart of that check, which Section G never exercises (TC-311, TC-312, and TC-313 all open "New Product" in their own Steps, never Edit)
- Steps 3–4: each collision is refused with the same duplicate-name/duplicate-code message confirmed at create-time in TC-HLP-027 — confirms uniqueness is re-checked on rename via Edit, not only at initial creation. If either save silently succeeds, two products would end up sharing a Name or Code the moment one is renamed through Edit, which the Create-time check alone would never catch
- In all four attempts, "Falcon Suite" is left holding its last good saved values — reopening its Edit form or the Product list never shows a blank Name/Code, nor a Name/Code that now collides with "Phoenix Core" — confirming the refused Save didn't partially commit
- CONFIRMED LIVE 2026-09-03 (Local, Admin): PASS — full validation parity confirmed, no gaps found. Neither "Phoenix Core"/"Falcon Suite" fixture pre-existed on Local, so both were created fresh this session (Phoenix Core id 5, Falcon Suite id 6, both on Helpdesk QA Alpha). Step 1 (blank Name) → refused "Name cannot be blank". Step 2 (blank Code) → refused "Code cannot be blank". Step 3 (rename to "Phoenix Core") → refused **"Name has already been taken for this project"** — notably scoped wording ("for this project"), consistent with Product being a project-scoped entity, unlike SLA/Support Level/Holiday/Canned Response's install-wide or simple "already taken" messages. Step 4 (Code → "PHX-CORE") → refused **"Code has already been taken for this project"**, same per-project scoping. Falcon Suite was explicitly restored and reverified afterward: Product Name="Falcon Suite", Product Code="FLC-SUITE" — its exact original values, confirming none of the four refused attempts partially committed.

---

## Section H — Customer creation vs. a required User custom field (added 2026-09-07, user-identified gap)

> A Customer is a real Redmine `User` under the hood (`RfCustomersController#create` does `@customer = User.new(customer_params)`), but the Customer create/edit forms only ever expose Login/First name/Last name/Email/Password — never a User custom fields section, unlike Redmine's own core `/users/new`/`/users/:id/edit`, which renders every User custom field automatically. This TC checks what happens when an Administrator makes a User custom field **required** (a routine, supported admin action, e.g. for compliance/reporting reasons) and then tries to create a Customer through the plugin's own form, which has no way to fill that field in.

### TC-HLP-145: Creating a Customer is unconditionally blocked once ANY User custom field is marked required, with no way to satisfy it via the Customer form

**User Role:** Admin (or any role with Customer-creation access, e.g. `manage_helpdesk`)
**Priority:** High
**Precondition:** A required Text custom field exists on the **Users** custom-field type (Administration → Custom fields → Users → New custom field, "Is required" checked), with no default value.

**Steps:**
1. Confirm the field renders and is enforced on Redmine's own core `/users/new` form (control/contrast check)
2. Go to Helpdesk → Customers → New Customer, fill in Login/First name/Last name/Email/Password/Confirmation (all the fields the form actually offers), leave Project access empty, Create
3. Observe the result and message shown
4. Check whether a `User` record was actually created despite the error (via Administration → Users search, not just the Customers list) — do not assume from the redirect alone

**Expected Result:**
- Document the actual behavior. If the create is blocked with an error naming the required custom field, that is itself a real, reportable defect regardless of whether the record persists anyway — the Customer form offers no field to satisfy the requirement, so Customer creation becomes **permanently, unconditionally impossible** the moment any User custom field is marked required, with no workaround available inside the plugin's own UI.

CONFIRMED LIVE 2026-09-07 (Local, redmine-docker-6, Admin): **FAIL — filed as BUG-HLP-042.** Created a required Text custom field "QA Required User Field" on the Users type (`custom_fields/3`, confirmed `is_required` checked via direct DOM read after Create). Step 1: confirmed on core `/users/new` — the field renders as a real, working `<input>` and is enforced there (this is not a data/field-definition problem, the custom field itself functions correctly). Step 2: filled a complete, valid New Customer form (login `qa.reqfield.customer`, full name/email/password) with no way to enter the custom field anywhere on this form (confirmed via full DOM snapshot — no custom-fields section rendered at all) — Create returned the SAME form re-rendered with error **"Qa required user field cannot be blank"**, no other validation errors. Step 3/4: checked both the Customers list (`/rf_helpdesk/customers`, still 16 rows, unchanged) and Administration → Users search (`/users?name=qa.reqfield.customer` → "No data"), and independently via `rails runner` (`User.find_by(login: 'qa.reqfield.customer')` → `nil`, `User.where("login LIKE '%qa.reqfield%'")` → `[]`) — **no User record of any kind was created**; the create is fully, atomically blocked, not a partial/orphaned save. Root-caused via source (`rf_customers_controller.rb#create`, line ~107: a single `if @customer.save` / `else render :new` — standard Rails atomic validation, no partial-commit bug). **The defect is not a data-integrity gap, it's a total, permanent block**: Customer creation cannot succeed at all, for any input, once any User custom field is required, and the plugin's own Customer form gives the admin no way to see or fill that field to get past it. Filed as **BUG-HLP-042** (Medium — no data corruption or security impact, but a real functional block on a documented core feature, triggered by a routine, supported admin configuration action elsewhere in Redmine).

---

## Notes

- Every case in Sections A–E above whose Expected Result says "record the actual..." is an **exploratory boundary probe**, not a pass/fail assertion against a known spec — the plugin's docs never state these limits. Fill in the real observed behavior during execution, then promote genuinely surprising findings (accepted script injection, no upload type restriction, illogical SLA time acceptance, etc.) into `HELPDESK_MEMORY.md` and file a bug if the behavior is actually harmful, not merely undocumented. Section F (Canned Response) is the one section where every case has already been executed with real confirmed values, rather than left as an open probe — use it as the template for what "done" looks like once the other sections are run.
- TC-HLP-146 (Support Level, zero assignees refused), TC-HLP-343/100/103 (duplicate name refusals for SLA/Support Level/Holiday), and TC-HLP-060 (duplicate name refusal for Organization) already exist in their respective suite files and are not duplicated here — see `HELPDESK_SLA_ESCALATION.md` and `HELPDESK_CUSTOMERS_ORGANIZATIONS.md`.
- **Edit-time validation-parity cases, added 2026-09-01:** every case above (Sections A–G) was originally written and, where executed, confirmed only against the **New/Create** form. A dedicated audit (background workflow, 7 parallel agents) found this was a total, unqualified gap — no case anywhere retested required-blank/duplicate-name/max-length validation on the **Edit** form of any entity. One TC per section now closes this: TC-HLP-099 (Organization), TC-HLP-113 (Customer), TC-HLP-123 (SLA), TC-HLP-129 (Support Level), TC-HLP-135 (Holiday), TC-HLP-140 (Canned Response), TC-HLP-144 (Product).
- **All 55 TCs in this suite carry a `CONFIRMED LIVE` marker as of 2026-09-03** (Local, redmine-docker-6, Admin) — verified via `grep -c '^### TC-HLP-'` = `grep -c 'CONFIRMED LIVE'` = 55, plus an awk state-machine pass confirming every TC section's own marker appears before its next TC header (no orphaned/misattributed markers). Three genuine defects surfaced during this pass: **BUG-HLP-030** (Name/Code length-validation crash, systemic across SLA/Support Level/Holiday/Product — 4 models, 2 columns), **BUG-HLP-031** (SLA First/Resolution Time blank silently accepted on both Create and Edit), **BUG-HLP-032** (SLA Agreement upload has no file-type restriction, `.exe` accepted). Everything else confirmed either a working validation or a documented-as-probe observed behavior, not a defect.
- Do not automate any of these into `automation/tests/` until each has a confirmed manual PASS, per `CLAUDE.md` §13. Every section now carries confirmed PASS results and is eligible for automation.
