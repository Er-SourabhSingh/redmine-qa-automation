# Bug Report

- Bug ID: BUG-RDV-058
- Title: XSS payload in release description is not sanitized — script executes on release detail page
- Redmine version: 6.0.9 (Local Docker)
- Plugin name: redmineflux_devops
- Plugin version: current
- Environment: Local Docker (http://localhost:3008)
- Browser: Playwright (headless)
- User role: Admin
- Date: 2026-05-28

## Steps to reproduce

1. Navigate to `Project > DevOps > Releases > v2.0.0 Release > Edit`
2. In the "Description" field, enter: `<script>alert('XSS')</script>Malicious release notes`
3. Click Save
4. Navigate to the release detail page: `/projects/phoenix-platform/devops_releases/1`

## Expected result

- The `<script>` tag is stripped or HTML-escaped before rendering
- No JavaScript executes in the browser
- The page displays the text "Malicious release notes" (or nothing, if fully stripped)
- The output passes through Redmine's HTML allow-list sanitizer

## Actual result

- The `<script>alert('XSS')</script>` payload is stored unescaped and rendered as-is on the release detail page
- An `alert('XSS')` dialog fires in the browser when the release detail page loads
- The browser page hangs until the dialog is dismissed
- Stored XSS — any user viewing the release page triggers script execution

## Evidence

![BUG-RDV-058 — XSS payload in release description executes on detail page](../../screenshots/TC-RDV-412/tc-rdv-412-fail.png)

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —
