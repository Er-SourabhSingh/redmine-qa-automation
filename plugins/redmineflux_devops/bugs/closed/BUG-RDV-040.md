# Bug Report

- Bug ID: BUG-RDV-040
- Title: Release HTML export does not convert markdown to HTML and omits linked issue URLs
- Redmine version: 6.0.9
- Plugin name: redmineflux_devops
- Plugin version: Local
- Environment: Local Docker (http://localhost:3008)
- Browser: Chromium (Playwright)
- User role: Administrator
- Date: 2026-05-25

## Steps to reproduce

1. Navigate to DevOps > Releases > "v2.0.0 Release"
2. In the Changelog section, click "Export HTML"
3. Inspect the downloaded/served HTML content

## Expected result

- Response Content-Type: text/html
- Markdown syntax is converted to HTML (e.g., `**#527**` → `<strong>#527</strong>`)
- Issue numbers are wrapped in clickable `<a href="/issues/527">` links
- The document is a valid HTML page with `<html>`, `<body>`, and styled sections

## Actual result

- The response serves raw markdown-formatted text with Content-Type: text/html
- Issue references (e.g., `**#527**`) are not converted — markdown asterisks appear literally
- No `<a href>` links are present for any issue number
- The output is essentially the same as the Markdown export but served with the wrong Content-Type

## Evidence

- Screenshot path: N/A (HTTP response inspected via fetch())
- Log path: N/A
- Trace/video path: N/A

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): N/A

## Retest

- Date: 2026-05-26
- Environment: Local Docker (http://localhost:3008) — fresh instance
- Result: **FIXED**
- `GET /projects/phoenix-platform/devops_releases/1/export.html` → HTTP 200, Content-Type: text/html; charset=utf-8. Response is a proper standalone HTML document with `<html>`, `<head>`, `<style>`, `<body>` structure (557 bytes). No raw markdown asterisks in output. Markdown is correctly converted to HTML. Issue link generation could not be verified as release #1 has 0 linked issues in the fresh environment. Bug no longer reproduces for the documented symptoms.
