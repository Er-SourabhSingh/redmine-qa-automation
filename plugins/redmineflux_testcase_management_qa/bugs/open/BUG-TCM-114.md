# BUG-TCM-114

- Bug ID: BUG-TCM-114
- Production Redmine Issue ID: 125092
- Title: Server-side PDF export (`export_pdf1`) 500s on every call with a `NameError` — `pdf_path` is referenced before it is defined
- Severity: High
- Redmine version: 6.0.11.stable (Docker)
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.2.0
- Environment: Docker `localhost:3000`, project `alpha-web`
- Browser: Chromium (Playwright MCP) / curl
- User role: QA Manager (`qa.manager`)
- Date: 2026-10-24

## Steps to reproduce

1. Create any Testcase Report in a project (e.g. "Testcase Summary" type, any run).
2. Request `GET /testcase_reports/:id/export_pdf1?project_id=<id>` (the real server-side Grover/Chromium PDF
   export action — the only one with a matching controller method; the separately-routed
   `GET /testcase_reports/:id/export` has **no** controller method at all and 500s with
   `AbstractController::ActionNotFound`, a second, related dead route worth fixing in the same pass).

## Expected result

- A PDF file downloads (`Content-Type: application/pdf`), built from the report's HTML via Grover/headless
  Chromium, with the dangerous-source sanitizer (`rftc_sanitize_for_pdf`) already applied.

## Actual result

- Every single call to `export_pdf1` returns **HTTP 500** before Grover is ever invoked.

## Root cause (confirmed via code read + live server log)

`testcase_reports_controller.rb#export_pdf1`:

```ruby
def export_pdf1
  show
  html_content = render_to_string(template: 'testcase_reports/show', layout: false)
  html_content = html_content.gsub(/<a [^>]*href="[^"]+"[^>]*>([^<]+)<\/a>/) { "#{$1}" }
  html_content = RftcOutputSafetyHelper.rftc_sanitize_for_pdf(html_content)
  pdf= Grover.new(html_content).to_file(pdf_path)          # <-- line 423: `pdf_path` is undefined here
  file_path = Rails.root.join('tmp', "testcase_report_#{Time.now.to_i}.pdf")   # <-- defined two lines LATER
  File.open(file_path, 'wb') do |file|
    file.write(pdf)
  end
  send_file file_path, type: 'application/pdf', disposition: 'attachment'
  File.delete(file_path) if File.exist?(file_path)
end
```

`pdf_path` is never assigned anywhere in the method (or as a helper) — `file_path` is the variable that should
have been passed to `Grover.new(...).to_file(...)`, but it is computed on the *next* line, after the crashing
call. The action therefore cannot ever succeed, for any report, under any role. Server log:

```
Processing by TestcaseReportsController#export_pdf1 as HTML
Completed 500 Internal Server Error in 100ms
NameError (undefined local variable or method `pdf_path' for an instance of TestcaseReportsController):
plugins/redmineflux_testcase_management/app/controllers/testcase_reports_controller.rb:423:in `export_pdf1'
```

The SSRF mitigation on the line immediately above (`rftc_sanitize_for_pdf`) was independently verified correct via
`rails runner` — it strips `169.254.169.254`/`file://`/`localhost`/private-IP `src` values and removes `<iframe>`
elements entirely while keeping legitimate external image sources — so that part of the feature is sound; it is
simply never reached by any request that gets past this crash.

## Evidence

### Server log

```
F, [2026-10-24T14:17:44.251772 #1] FATAL -- :
NameError (undefined local variable or method `pdf_path' for an instance of TestcaseReportsController):
plugins/redmineflux_testcase_management/app/controllers/testcase_reports_controller.rb:423:in `export_pdf1'
```

### Related dead route

```
GET /testcase_reports/:id/export  ->  AbstractController::ActionNotFound ("The action 'export' could not be
  found for TestcaseReportsController") — routed in config/routes.rb but no matching controller method exists
  anywhere in the controller.
```

## Duplicate check

- Duplicate found: No (distinct from BUG-TCM-005/006, which are about the *email* delivery path's PDF-failure
  handling on a server missing Node/Puppeteer, or the mailer's `rescue` sending a misleading email anyway — both
  already closed/tracked separately). This bug is the on-screen/API `export_pdf1` download action itself, which
  cannot ever succeed regardless of environment, since the crash happens before Grover/Node is even invoked.
- Checked `bugs/_duplicates.md` and `bugs/_index.md` — no existing entry covers `export_pdf1`'s `pdf_path`
  NameError or the dead `export` route.
