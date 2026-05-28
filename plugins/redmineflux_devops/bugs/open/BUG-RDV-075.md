# BUG-RDV-075 — Environment Request submission causes 500 error; issue has no custom fields or auto-assignment

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-RDV-075 |
| **Severity** | High |
| **Status** | Open |
| **Redmine Version** | 6.0.9 (Local Docker) |
| **Plugin** | redmineflux_devops |
| **Found in TC** | TC-RDV-482 |
| **Date** | 2026-05-28 |

## Title
Submitting an Environment Request creates issue with "Environment Request" tracker but the issue detail page returns 500 error; no custom fields are populated; no auto-assignment occurs.

## Steps to Reproduce
1. Navigate to Project → DevOps → Request Env.
2. Fill in all fields: Name, Size, Region, Expires At, Contact Email, Purpose.
3. Click "Submit" (form submit).
4. Observe the redirect destination.
5. Navigate directly to the newly created issue URL.

## Expected Result
- New Redmine issue created with tracker "Environment Request".
- Issue title matches entered name.
- All 5 custom fields (size, region, expires_at, contact_email, purpose) are populated on the issue.
- Issue is auto-assigned to the configured DevOps owner/queue.
- User is redirected to the newly created issue (HTTP 200 issue detail page).

## Actual Result
- Issue IS created with tracker "Environment Request" (confirmed via API: issue #40 created). ✅
- Redirect after submission lands on the issue detail page with "Redmine 500 error" / "Internal error". ❌
- Navigating directly to the issue URL also returns 500 error. ❌
- API response for the issue shows: `custom_fields: []` — no custom fields populated. ❌
- `assigned_to: {}` — no auto-assignment. ❌

## User Role
Admin

## Screenshot
![BUG-RDV-075 — Issue #40 (Environment Request) returns Redmine 500 error on detail page](../../screenshots/BUG-RDV-075/bug-rdv-075-issue-500-error.png)

## Notes
Issue #40 was created during this test. The 500 error appears to be in the issue show action when rendering an "Environment Request" tracker issue — likely a missing partial or custom field rendering error.
