# BUG-HLP-010

- Bug ID: BUG-HLP-010
- Title: Organization Website and Phone Number allow exact duplicates across different organizations, with no warning — a real-world data-integrity gap, not a deviation from the current written spec
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-08-26)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-08-26

## Steps to reproduce

1. Edit an existing organization (reproduced: "Alpha Org", id=1) and set Website = `https://acme.example.com`, Phone Number = `+1 (555) 123-4567`. Save.
2. Create a second, differently-named organization (reproduced: "Alpha Org Subsidiary", id=3) and enter the **exact same** Website and Phone Number values.
3. Save.

## Expected result

- Two genuinely different organizations (real companies) essentially never share the exact same official website or phone number in practice. At minimum, the system should warn on save when a new/edited organization's Website or Phone exactly matches another organization's; ideally it should require confirmation or refuse outright — this catches copy-paste/data-entry mistakes (e.g. accidentally duplicating a company record, or pasting the wrong org's contact info) before they go unnoticed.

## Actual result

- No validation of any kind exists for Website or Phone Number. Both fields saved successfully as exact duplicates of Alpha Org's values, with zero warning, refusal, or even a soft confirmation prompt.
- **This currently matches the documented spec exactly** — `HELPDESK_USER_GUIDE.md` §3.4: *"Name is required and must be unique. Everything else — website, phone, address, employee count, billing info, notes — is optional."* So this is **not a functional defect** where the plugin deviates from its own written intent; it's the intent itself that may be under-specified. Filed as a bug per explicit user direction (a product-judgment call: real-world duplicate contact info across orgs is a legitimate risk worth catching, even though today's spec doesn't ask for it) — recommend product/requirements review of whether Website/Phone should gain at least a soft-duplicate warning, not just Name.

## Evidence

### Screenshot

(None — per `CLAUDE.md` §6, screenshots are for confirmed defects with visible failure state; this finding's evidence is the saved record itself, not a failure screen. See Console/log below for the confirmed data.)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-HLP-010/retest-yyyy-mm-dd-pass.png)

### Console / log

- Alpha Org (id=1): Website `https://acme.example.com`, Phone `+1 (555) 123-4567` (set via `/rf_organizations/1/edit`).
- Alpha Org Subsidiary (id=3): created via `/rf_organizations/new` with identical Website and Phone — confirmed on the resulting detail page (`/rf_organizations/3`) that both fields persisted byte-identical to Alpha Org's, no refusal at any point.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Notes

- Raised during a QA coverage review: the user asked whether Organization Website/Contact uniqueness was tested, and after confirming live that duplicates are currently allowed (see `testcases/HELPDESK_FIELD_VALIDATIONS.md` TC-HLP-292, which documents this as PASS against the *current* spec), the user pushed back that this should arguably be unique regardless of what the doc says. Filed as Low severity per that explicit direction.
- **Triage note for whoever picks this up**: this is a product-judgment bug, not a spec-deviation bug — the fix (if pursued) is a new validation rule that doesn't exist in the requirements today, not a repair of broken existing logic. Confirm intended behavior with product/stakeholders before implementing; TC-HLP-292 will need its own "Expected Result" flipped (PASS → the new refusal/warning behavior) if this is fixed, since right now it correctly documents today's actual (permissive) behavior.
- Not yet tested: whether Organization Address has the same gap (Website/Phone were the two fields specifically raised) — worth a quick follow-up check if this bug is picked up.
