# Bug Report

- Bug ID: BUG-HLP-032
- Production Redmine Issue ID: 119980
- Title: SLA Agreement file upload has no file-type restriction — arbitrary executable files (.exe) are accepted and stored
- Redmine version: 6.1.3.stable
- Plugin name: redmineflux_helpdesk
- Plugin version: (see plugin registry — not independently re-checked this session)
- Environment: Local (redmine-docker-6, localhost:3012)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-02

## Steps to reproduce

1. Log in as Admin. Go to Project (Helpdesk QA Alpha) › Helpdesk › Helpdesk SLA › New SLA (`/projects/1/rf_slas/new`).
2. Fill SLA Name, First Response Time, Resolution Time as normal.
3. For "SLA Agreement", choose a file with a `.exe` extension (well under the 5 MB size limit, which IS correctly enforced — see TC-HLP-120).
4. Save.

## Expected result

- The form documents this field only as an "SLA Agreement" upload — a policy/contract document. There is no documented allow-list in the plugin's UI, but a `.exe` (or other executable/script type) should reasonably be refused, or at minimum flagged, given this is a general-purpose attachment field with no apparent business reason to accept executables.

## Actual result

- The `.exe` file is accepted with zero restriction — no client-side or server-side file-type check exists (contrast with the file-size limit, which genuinely blocks client-side via a JS `alert()` — see TC-HLP-120). The SLA is created successfully and the file is genuinely stored and downloadable: SLA detail page shows "SLA Agreement: test-file-type.exe" linking to `/attachments/download/7/test-file-type.exe`. A `.docx` file was also accepted with no issue, for contrast (i.e. this isn't specific to `.exe` — no file type appears to be restricted at all).
- Severity kept at Medium rather than higher because this is an Admin-only, `manage_helpdesk`-gated screen, not customer/agent-facing — but it's still a real arbitrary-file-upload gap: any admin (or compromised admin account) could store and distribute an executable through this attachment mechanism, and Redmine's own attachment storage/serving path has no reason to expect executables here.

## Evidence

### Screenshot

![Bug evidence — SLA detail page shows an accepted .exe attachment](../../screenshots/BUG-HLP-032/BUG-HLP-032-sla-exe-upload-accepted.png)

### Console / log

- Server responded 302 redirect (success) for the `.exe` upload — no validation error, no content-type check performed.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Retest — Confirmed FIXED (2026-09-10)

- Production issue #119980 found marked "In QA" (developer checked in a fix), triggering this retest per the user's request to retest all checked-in Helpdesk bugs on `localhost:3012`.
- Created a new SLA ("BUG-HLP-032 retest SLA") and attempted to attach the same `test-file-type.exe` fixture file used in the original repro (`automation/uploads/test-file-type.exe`) via the SLA Agreement field.
- **Result: the file was refused.** On Save, a flash warning appeared: *"These files were not attached because their file type is not allowed for security reasons: test-file-type.exe"* — the SLA itself was still created ("Successful creation"), but with no SLA Agreement attachment (list shows "—" for that row), confirming the file was genuinely rejected, not silently dropped or partially saved.
- This is a real server-side file-type restriction now enforced on the SLA Agreement upload, closing the arbitrary-file-upload gap.
- Cleanup: deleted the throwaway "BUG-HLP-032 retest SLA" test record afterward.
- Production issue #119980 synced 2026-09-10: status In QA → Done, % done → 100 (approved).
