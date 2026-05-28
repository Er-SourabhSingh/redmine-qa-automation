# BUG-RDV-046 — New Release form not pre-populated with SemverSuggester output

- Bug ID: BUG-RDV-046
- Title: New Release form not pre-populated with SemverSuggester output
- Redmine version: 6.0.9 (Local)
- Plugin name: redmineflux_devops
- Plugin version: 0.1.0
- Environment: Local Docker — http://localhost:3008
- Browser: Playwright MCP
- User role: Admin
- Date: 2026-05-26

## Steps to reproduce

1. Navigate to Project "phoenix-platform" → DevOps → Releases → "New Release".
2. Observe the Release Name field and SemverSuggester widget on page load.

## Expected result

- The Release Name / version field is pre-populated with the SemverSuggester's suggested version (e.g., "v0.0.2").
- User can immediately submit or override the pre-filled value.
- Behaviour specified in rfd-084: "Version name field is pre-populated from SemverSuggester output on page load."

## Actual result

- Release Name field is empty on page load (`value = ""`).
- SemverSuggester output is shown in a separate widget ("Suggested next version: v0.0.2 PATCH — ...") with a "Use this version" button.
- User must click "Use this version" to populate the field — the form is NOT automatically pre-populated.

## Evidence

- Screenshot path: screenshots/TC-RDV-255/
- DOM evidence: `#redmineflux_devops_release_name` value = "" on page load; suggestion widget shows v0.0.2
- Confirmed via: TC-RDV-255 FAIL on 2026-05-26

## Duplicate check

- Duplicate found: No
- Existing bug reference: N/A

## Retest — Forge flux-fujhcd9zj49 (2026-05-26)

- Date: 2026-05-26
- Environment: Forge (https://flux-fujhcd9zj49.forge.zehntech.com) — new instance
- Result: **FIXED**
- Navigated to New Release form for agileboard. Release Name / version field is pre-populated with the SemverSuggester's suggested version on page load. User does not need to click "Use this version" — the field is already filled. Bug closed.
