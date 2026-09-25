# Test Cases — Redmineflux CRM — CSV Import & Export

> Source: vendor KB — the four import sections (contacts, companies, deals, leads) with their exact column lists
> and duplicate rules, the four export sections, "How to Export Analytics", and the import troubleshooting note.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux CRM Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_crm_qa

## Navigation methodology

CRM → each section → **Import** / **Export**.

> **Import is the fastest way to damage a CRM.** One file can create hundreds of customer records, and this plugin
> has no undo. The duplicate rules differ per entity and are documented precisely, so each is tested on its own
> terms rather than assumed to be "by email".
>
> **All fixture files must be UTF-8** and use the exact documented header names — the KB names both as the causes
> of mass invalid rows, so a failed import is often the fixture, not the plugin.

---

## Functional Cases — Contact import

---

### TC-CRM-114: Import contacts with all documented columns

**User Role:** Member with **Manage Contacts**
**Priority:** High
**Preconditions:** A UTF-8 CSV with a header row using exactly: `first_name`, `last_name`, `email`, `phone`,
`mobile`, `job_title`, `address`, `company_name`, `notes`, `tags`, `assigned_to`, `is_private`.
**Steps:**
1. Contacts → **Import** → upload → submit.

**Expected Result:**
- Valid rows create contacts with every column mapped to the right field.
- The result reports **imported, duplicate and invalid** counts.

---

### TC-CRM-115: Duplicate detection by email

**User Role:** Member
**Priority:** High
**Steps:**
1. Import a file containing an email that already exists, and a duplicate pair **within** the file.

**Expected Result:**
- Both are skipped and counted as duplicates, not as errors and not as new records.
- Also test a case variant of an existing email — if the skip is case-sensitive, the import will create duplicate
  customers that the UI's own uniqueness rule would have refused (paired with TC-CRM-059).

---

### TC-CRM-116: `company_name` links but does not create

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Import rows where `company_name` matches an existing company, and rows where it does not.

**Expected Result:**
- Matching rows link to that company; non-matching rows import **without** creating a company — the KB states a
  new company is **not** created during contact import.
- A silently created company here would be an undocumented side effect that pollutes the company list.

---

### TC-CRM-117: `assigned_to` and `is_private`

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Use a valid Redmine login in `assigned_to`, an invalid one, and each accepted privacy value (`1`, `true`,
   `yes`, `y`) plus an unrecognised value.

**Expected Result:**
- Valid logins assign correctly; an invalid login is handled explicitly rather than silently assigning to the
  importer.
- All four documented privacy values produce a private record; **anything else is treated as public**, per the KB.
- Getting that default wrong in the other direction — treating unknown values as private — would silently hide
  records from the team.

---

### TC-CRM-118: Imported content is escaped

**User Role:** Member
**Priority:** High
**Steps:**
1. Import a row whose `first_name` and `notes` contain a script tag; view the contact, the list, the dashboard and
   an email template preview for that contact.

**Expected Result:**
- Escaped everywhere and **no script executes**.
- Import is the realistic route for hostile content, since the file usually comes from outside the organisation —
  and the imported first name flows straight into the email templates (TC-CRM-019).

---

## Functional Cases — Company, deal and lead import

---

### TC-CRM-119: Import companies

**User Role:** Member with **Manage Companies**
**Priority:** Medium
**Steps:**
1. Import using exactly: `name`, `email`, `phone`, `website`, `industry`, `employee_count`, `address`, `notes`,
   `tags`, `assigned_to`, `is_private`.

**Expected Result:**
- Valid rows create companies; bare domains in `website` are prefixed with `https://` as in the UI
  (TC-CRM-078); `employee_count` is numeric.

---

### TC-CRM-120: Company duplicates are detected by name **or** email

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Import a row whose `name` matches an existing company but whose email differs.
2. Import a row whose `email` matches an existing company but whose name differs.

**Expected Result:**
- **Both are skipped** — the KB states either match triggers the duplicate rule.
- This differs from the contact rule, so a build that deduplicates companies by email alone would create duplicate
  companies whenever the email column is blank.

---

### TC-CRM-121: Import deals

**User Role:** Member with **Manage Deals**
**Priority:** High
**Steps:**
1. Import using exactly: `name`, `amount`, `currency`, `stage`, `probability`, `due_date`, `contact_email`,
   `company_name`, `description`, `tags`, `assigned_to`, `is_private`.

**Expected Result:**
- Deals are created; `contact_email` links to the matching contact and `company_name` to the matching company.
- `due_date` is parsed as **YYYY-MM-DD**; a different format is reported invalid rather than misparsed —
  a silently transposed day and month would misdate the pipeline.

---

### TC-CRM-122: Deal defaults and stage validation

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Import rows omitting `currency` and `stage`, and a row whose `stage` is not configured.

**Expected Result:**
- Missing currency defaults to the plugin default; missing stage defaults to the **first configured stage**.
- An unconfigured stage is reported invalid rather than being created.
- **Check what happens to a row whose stage is `Lost`** — the UI requires a lost reason (TC-CRM-089), which the
  import has no column for. Record whether such rows are refused or create a Lost deal with no reason, bypassing a
  documented validation rule.

---

### TC-CRM-123: Deal duplicate rule is a three-way match

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Import a deal whose name already exists for the **same** contact and company.
2. Import the same deal name for a **different** contact, and again for a different company.

**Expected Result:**
- Only the first is skipped; the other two import.
- The KB defines the duplicate as name + matched contact + company. A rule that skips on name alone would drop
  legitimate deals that share a name across customers — common for recurring products.

---

### TC-CRM-124: Import leads

**User Role:** Member with **Manage Leads**
**Priority:** Medium
**Steps:**
1. Import using exactly: `first_name`, `last_name`, `email`, `phone`, `company_name`, `source`, `status`, `notes`,
   `assigned_to`, `is_private`.
2. Include a row with no `source`, one with no `status`, and one with `status` set to `Converted`.

**Expected Result:**
- Missing source defaults to **Other**; missing status defaults to **New**; duplicates are skipped by email.
- **A row attempting to set `Converted` must be refused** — it is reserved (TC-CRM-166), and an import is the
  easiest way to create the unrecoverable orphan described there.

---

## Negative Cases — import robustness

---

### TC-CRM-125: Missing required fields

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Import files with rows missing `first_name`, missing `email`, and missing the deal `name`.

**Expected Result:**
- Those rows are reported **invalid** and skipped; the valid rows in the same file still import.
- A single bad row must not abort the whole file.

---

### TC-CRM-126: Wrong header names

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Import a file using `firstname` instead of `first_name`, and one with no header row at all.

**Expected Result:**
- Reported clearly — ideally naming the expected headers.
- The KB lists wrong headers as the first cause of "many invalid rows", so **an error message that names the
  expected columns turns a frustrating failure into a one-minute fix**. Record whether it does; a bare count of
  invalid rows with no explanation is a usability defect on a bulk-data feature.

---

### TC-CRM-127: Non-UTF-8 encoding

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Import a file saved in a non-UTF-8 encoding containing accented and non-Latin characters.

**Expected Result:**
- Either rejected with an encoding message, or imported with characters intact.
- **Silently importing mojibake is the bad outcome** — the records look successful but the customer names are
  corrupted, and nobody notices until someone emails them.

---

### TC-CRM-128: Malformed CSV structure

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Import a file with inconsistent column counts, unescaped quotes, embedded newlines inside quoted fields, and a
   value beginning with `=`.

**Expected Result:**
- Quoted newlines are handled correctly; malformed rows are reported rather than shifting data into the wrong
  fields.
- **A shifted row is worse than a rejected one** — it creates a contact whose phone number is in the address field
  with no error at all.

---

### TC-CRM-129: Large import and counts reconcile

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Import 5,000 rows with a known mix of valid, duplicate and invalid rows.

**Expected Result:**
- The import completes without timeout, and **imported + duplicate + invalid equals the total row count**.
- Counts that do not add up mean rows were silently dropped — undetectable afterwards, and this is the only moment
  it can be caught.

---

### TC-CRM-130: Import requires the matching manage permission

**User Role:** Member with **View CRM** only
**Priority:** High
**Steps:**
1. Confirm no Import control appears in any section.
2. Send each import request **directly**.

**Expected Result:**
- All refused with 403. Bulk creation must be gated at least as strictly as single-record creation.

---

## Functional Cases — Export

---

### TC-CRM-131: Export each entity to CSV and XLS

**User Role:** Member with View CRM
**Priority:** High
**Steps:**
1. Export contacts, companies, deals and leads in both formats.

**Expected Result:**
- All eight exports download and open, with the same records and values as the list.

---

### TC-CRM-132: Exports cover all visible records, not the current page

**User Role:** Member
**Priority:** High
**Steps:**
1. With more records than fit one page, export and count the rows.

**Expected Result:**
- The export contains **every record visible to this user**, per the KB — not just the displayed page.
- A page-limited export presented as complete is the classic export defect, and it is invisible unless counted.

---

### TC-CRM-133: Exports respect privacy

**User Role:** A non-admin who cannot see certain private records
**Priority:** High
**Steps:**
1. Export each entity and search the file for those records.

**Expected Result:**
- Absent.
- **An export is a file that leaves the system** — if it ignores privacy, private records reach a spreadsheet that
  can be forwarded anywhere, and unlike a screen view there is no further access control on it. High severity if
  they appear.

---

### TC-CRM-134: Analytics export to CSV and PDF

**User Role:** Member with View CRM
**Priority:** Medium
**Steps:**
1. Export analytics in both formats and compare against the screen.

**Expected Result:**
- Figures match the KPI cards exactly.

---

### TC-CRM-135: PDF export renders non-Latin scripts

**User Role:** Member
**Priority:** Low
**Preconditions:** Records containing Japanese, Russian, Polish and other non-Latin text.
**Steps:**
1. Export analytics to PDF and inspect those characters.

**Expected Result:**
- All render correctly — the KB states the PDF uses embedded Unicode fonts specifically for this.
- Garbled or missing glyphs point at a pre-1.0.0 build per the KB's troubleshooting; record the plugin version
  alongside the result so the finding is actionable.

---

### TC-CRM-136: Dashboard export

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Export the dashboard to CSV and XLS.

**Expected Result:**
- Both download and their figures match the dashboard panels for this user (paired with TC-CRM-157).

---

### TC-CRM-137: Export file integrity

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Export data containing commas, quotes, newlines in notes, and non-Latin characters; open the CSV in a
   spreadsheet.

**Expected Result:**
- Fields are quoted and escaped so columns stay aligned; characters are readable.
- Confirm a value beginning with `=`, `+` or `-` cannot execute as a formula when opened — CRM notes are
  user-supplied and frequently imported from outside, which makes this a real path.

---

### TC-CRM-138: Export requires View CRM

**User Role:** A user with no CRM permissions
**Priority:** High
**Steps:**
1. Request each export endpoint **directly**.

**Expected Result:**
- Refused. An unguarded export endpoint would hand over the entire customer database in one request — the single
  highest-value target in this plugin.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
