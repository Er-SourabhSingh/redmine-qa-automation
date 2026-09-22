# BUG-TCM-005

- Bug ID: BUG-TCM-005
- Production Redmine Issue ID: #120588 (https://flux.zehntech.com/issues/120588) — created 2026-09-14, assigned to Sheetal Sharma, Priority High
- Status: **Closed — Fixed**, 2026-09-15 (retest PASS 2026-09-14, Test 1)
- Split to: **BUG-TCM-006** — failed PDF still sends an email promising an attachment (separate defect, still open)
- Title: Report emailed as PDF arrives with no attachment at all, while the body still says "Please find the attached Testcase Report"
- Redmine version: 6.1.3
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.0.0
- Environment: Docker `localhost:3012` (container `redmine-docker-6-redmine-1`, project `test`)
- Browser: Chromium (Playwright MCP, headed)
- User role: Administrator (`admin`)
- Date: 2026-09-14

## Summary

Creating any Testcase Report with **"Email the report as PDF attachment"** selected sends an email that contains
**no attachment whatsoever** — yet its body still reads *"Please find the attached Testcase Report"*. The user is
given no error, no warning, and no indication anywhere in the UI that the attachment was dropped.

The same report emailed as **HTML** works correctly. The PDF option is the only broken one.

> ## ✅ CLOSED 2026-09-15 — FIXED
>
> **Scope of this bug: PDF generation and attachment failure.** That is what the customer reported, what the title
> states, and what this bug's Expected result (bullet 1) and retest vehicle **TC-TCM-100** assert. It is **fixed**.
>
> **Root cause: incomplete installation**, not a code defect. Node.js + Puppeteer + Chromium (KB Installation
> step 6 / the plugin's own `installation.txt` and `initialize.sh`) had never been installed on
> `redmine-docker-6-redmine-1`. After completing that step, the PDF email delivers a **valid 53,446-byte
> attachment** (`multipart/mixed`, 9 of 9 compressed streams inflate cleanly). See
> [Retest 2026-09-14, Test 1](#test-1--pdf-email-with-puppeteer-working-pass).
>
> **Split out:** a second, separate defect was observed during the retest — when PDF generation *fails*, the
> plugin still sends an email whose body promises an attachment. That is **not** this bug's scope (it needs an
> induced failure to occur at all) and is now tracked as **[BUG-TCM-006](../open/BUG-TCM-006.md)**.
>
> Everything below the banner describes the **pre-install** state and is retained as the historical record.

Two separate things were involved, and they should not be conflated:

1. **Environment — this bug.** This instance was not installed per the documented procedure: the knowledge base's
   Installation step 6 requires Node.js + Puppeteer + Chromium, and none were present. That is why
   `Grover#to_pdf` raised `Errno::ENOENT` here. **Resolved — see the retest.**
2. **Error handling — now BUG-TCM-006.** When PDF generation fails, the plugin's `rescue` block sends the email
   anyway without the attachment, with a body that still promises one, and surfaces no error in the UI. Only
   reachable when PDF generation fails, so it is not the reported symptom.

## Preconditions

- A project with the Testcase Management module enabled and at least one Requirement defined.
- Outgoing email configured and working (verified here — the HTML variant delivers fine over the same SMTP path).
- Sidekiq running (mail is delivered via `ActionMailer::MailDeliveryJob`).

## Steps to reproduce

1. Log in to `http://localhost:3012` as `admin`.
2. Open project **test** → **TESTCASES** → **Reports** (sidebar) → **+ New report**.
3. Set **Select Type** = `Requirement Coverage`, **Select Requirement** = any requirement (`sdfsad` here).
4. Enter a **Name** (e.g. `RC-PDF-2026-09-14`).
5. Tick **Notify me by email** and enter a real, checkable mailbox (`admin@test.local`).
6. Select **Email the report as PDF attachment**.
7. Leave **Create this report: Right now**, click **Create**.
8. Open the recipient mailbox.
9. Repeat steps 2–8 with **Email the report as HTML attachment** for the contrast.

## Expected result

- The email arrives carrying a `.pdf` attachment of the Requirement Coverage report, matching the behaviour of the
  HTML option.
- If the PDF genuinely cannot be produced, the user is told so — the report creation should surface an error rather
  than silently sending a mail whose body promises an attachment that isn't there.

## Actual result

- **The email is delivered, but with no attachment at all.** Its `Content-Type` is a bare `text/html`, not
  `multipart/mixed` — there is no attachment MIME part in the message.
- The body still reads *"Please find the attached Testcase Report: **RC-PDF-2026-09-14**"*.
- Nothing in the UI reports a failure — the report is created and listed as if it had succeeded.
- The HTML option, run minutes apart against the same requirement and the same recipient, delivers correctly with a
  `RC-HTML-2026-09-14.html` attachment (~14 KB).

### Scope: all six report types are affected

Re-tested 2026-09-14 across **every** report type the plugin offers, each sent to the same mailbox in both formats.
PDF fails universally; HTML works universally:

| Report type | PDF | HTML |
|---|---|---|
| Testcase Summary | 1,756 B `text/html` — **no attachment** | 20,829 B `multipart/mixed` — `T1-TestcaseSummary-HTML.html` |
| Defect Summary | 1,750 B `text/html` — **no attachment** | 18,472 B `multipart/mixed` — `T2-DefectSummary-HTML.html` |
| Activity Summary | 1,767 B `text/html` — **no attachment** | 24,826 B `multipart/mixed` — `T3-ActivitySummary-HTML-v2.html` |
| Tester Scorecard | 1,775 B `text/html` — **no attachment** | 19,260 B `multipart/mixed` — `T4-TesterScorecard-HTML.html` |
| Overdue Run Summary | 1,746 B `text/html` — **no attachment** | 14,139 B `multipart/mixed` — `T5-OverdueRun-HTML.html` |
| Requirement Coverage | 1,747 B `text/html` — **no attachment** | 21,240 B `multipart/mixed` — `RC-HTML-2026-09-14.html` |

This is consistent with the root cause: all six types share the single `send_report` method in `run_mailer.rb`, so
the format branch — not the report type — decides the outcome. Every PDF run produced its own
`Error generating PDF: No such file or directory - node` line in the Sidekiq log.

Note on Activity Summary: it additionally requires an **Activity Date Range** (start/end date). Submitting it
without one correctly fails validation with a visible "Start date cannot be blank / End date cannot be blank"
error and creates nothing — that part is **working as intended**, not a defect. Once a date range is supplied it
behaves exactly like the other five.

Original single-type comparison (same mailbox, ~1 minute apart):

| Report | Size | Content-Type | Attachment |
|---|---|---|---|
| `RC-HTML-2026-09-14` (HTML) | 21,240 bytes | `multipart/mixed` | `filename=RC-HTML-2026-09-14.html` ✔ |
| `RC-PDF-2026-09-14` (PDF) | 1,747 bytes | `text/html` | **none** ✗ |

## Analysis — root cause

`app/models/run_mailer.rb` (~line 284):

```ruby
if @report.email_as_html
  modified_html_content = modify_html_for_email(html_content)
  attachments["#{@report.name}.html"] = { mime_type: 'text/html', content: modified_html_content }
  mail(to: recipients, subject: "Testcase Report: #{@report.name}")
else
  begin
    pdf = Grover.new(html_content, options: { 'args' => ['--no-sandbox'] }).to_pdf
    attachments["#{@report.name}.pdf"] = { mime_type: 'application/pdf', content: pdf }
    mail(to: recipients, subject: "Testcase Report: #{@report.name}")
  rescue => e
    Rails.logger.error "Error generating PDF: #{e.message}"
    mail(to: recipients, subject: "Testcase Report: #{@report.name}")   # <-- sends with NO attachment
  end
end
```

Two distinct defects compound here:

1. **Missing runtime dependency.** `Grover` is a Ruby wrapper around **Puppeteer**, which requires **Node.js** and a
   **Chromium** binary. The gem is declared (`Gemfile.lock: grover (1.2.10)`) but none of its runtime prerequisites
   exist in the image:

   ```
   node:      NOT INSTALLED
   npm:       NOT INSTALLED
   chromium:  NOT INSTALLED
   grover gem:  grover (1.2.10)
   ```

   So every call raises, confirmed in the Sidekiq log:

   ```
   ERROR -- : [ActiveJob] [ActionMailer::MailDeliveryJob] Error generating PDF: No such file or directory - node
   ```

2. **The failure is swallowed.** The `rescue` logs to `Rails.logger` and then *still calls `mail(...)`*, producing a
   perfectly valid-looking email with no attachment. Nothing propagates back to the request, so the UI reports
   success. A user has no way to discover the problem except by opening the mail and noticing the attachment is
   absent — exactly what the client reported.

Defect 1 is this bug, and it was an incomplete installation. Defect 2 — even once Node/Chromium are installed, any
future PDF failure (timeout, render crash, OOM) silently produces the same attachment-less email — is a distinct
issue and is now tracked as **[BUG-TCM-006](../open/BUG-TCM-006.md)**.

### Whose dependency is this? (triage) - CORRECTED 2026-09-14

> **Correction.** An earlier revision of this bug asserted that the Node.js/Puppeteer/Chromium dependency was
> "never declared" and appeared in "none of the plugin's documentation". **That was wrong, on two counts.** The
> claim came from grepping only `*.md` files, which missed both of the places the plugin actually documents it:
>
> 1. **`plugins/redmineflux_testcase_management/installation.txt`** — "Step 3: Install Node.js Environment",
>    naming `"puppeteer": "^22.8.2"`, `npm install` and `npx puppeteer browsers install chrome`.
> 2. **`plugins/redmineflux_testcase_management/initialize.sh`** — a ready-made setup script that installs Redis,
>    Node.js, npm, the Chromium shared libraries, puppeteer and Chrome, then starts Sidekiq with
>    `PUPPETEER_EXECUTABLE_PATH` and `GROVER_NO_SANDBOX=true` exported.
>
> The public knowledge base documents the same thing as Installation step 6. The incorrect claim was also included
> in production issue #120588 and needs correcting there.

The vendor knowledge base (https://www.redmineflux.com/knowledge-base/plugins/testcase-management/),
**Installation step 6**, states verbatim:

> **Install Node.js and Puppeteer.** A Node.js environment is required for the plugin. Ensure Node.js is
> installed, add Puppeteer as a dependency: `"puppeteer": "^22.8.2"` Install Node.js dependencies: `npm install`
> Install the necessary browser: `npx puppeteer browsers install chrome`

Installation also requires **Redis** (step 5) and **Sidekiq** (step 7) for background jobs.

So the dependency *is* declared - in the KB, in the plugin's own `installation.txt`, and as an executable
`initialize.sh` - and this instance simply was not set up per that procedure: `node`, `npm` and `chromium` are all
absent from `redmine-docker-6-redmine-1`. **The missing-attachment symptom on this environment is an incomplete
installation, not an undeclared dependency.**

Two further details that matter for retesting:

- `initialize.sh` also installs the X11/font shared libraries (`libxext6`, `libxfixes3`, `libgtk-3-0`, etc.) that
  the bundled `wkhtmltopdf-binary` was failing on - so the second "broken PDF engine" noted below is the same
  single root cause (an unrun setup script), not an independent defect.
- `config/initializers/grover.rb` resolves the browser via `ENV['PUPPETEER_EXECUTABLE_PATH']` (falling back to
  `npx puppeteer executablePath`) and honours `GROVER_NO_SANDBOX`. **Both are exported by `initialize.sh` into the
  Sidekiq process.** A Sidekiq started by hand without them - as was done during the 2026-09-14 session - will not
  have them set, so the environment of the *worker process* must be checked, not just whether `node` exists.

That leaves one genuine product defect, which stands independently of how the server was installed — **now tracked
as [BUG-TCM-006](../open/BUG-TCM-006.md), not here**:

**The failure is silently swallowed.** When PDF generation fails for any reason, `run_mailer.rb` still calls
`mail(...)`, sending an email whose body reads *"Please find the attached Testcase Report"* with no attachment
and no error surfaced anywhere in the UI. A correctly-installed server that later hits a Puppeteer timeout,
render crash or OOM will reproduce this exact symptom. That is the part worth fixing in the product.

The secondary observation that the bundled `wkhtmltopdf-binary` also cannot run (`libXrender.so.1` missing) is
likewise an environment gap, not a code defect - noted only because it removes the obvious fallback.

### Why the client only noticed this in email

The in-app **Download PDF** button on the report page is **client-side** — it renders in the browser via
`html2pdf.js` / `jsPDF` / `html2canvas` (loaded from CDN) and never touches Grover:

```html
<a class="button icon-pdf" id="download-pdf" href="#"> Download PDF </a>
```

So interactive PDF export appears to work fine, while **only the emailed PDF** — the one path that renders
server-side through Grover — silently fails. That asymmetry is exactly why the defect surfaced as an "email issue"
rather than a "PDF issue".

## Suggested fix

- **Stop swallowing the error** (the actual product fix): on failure, either fail the report creation with a visible error, or send an email
  that plainly states the PDF could not be generated — never one whose body claims an attachment that isn't there.
  Consider falling back to the HTML attachment, which demonstrably works.
- **Validate the dependency at plugin load / settings-save time** and surface a configuration warning, so the PDF
  option isn't silently offered on an instance where Installation step 6 was not completed. This would have turned
  this whole investigation into a single visible message.
- **Environment remediation (not a code change):** complete Installation step 6 on affected servers - install
  Node.js, `npm install`, and `npx puppeteer browsers install chrome`. Worth also mirroring the Node/Puppeteer
  requirement into the plugin's bundled `README.md`, which currently omits what the public KB states.

## Evidence

### Screenshots

Inbox — the HTML report carries a paperclip, the PDF report does not:

![Inbox showing PDF report without attachment icon](../../screenshots/BUG-TCM-005/01-inbox-pdf-missing-paperclip.png)

The PDF email opened — body promises an attachment, none present:

![PDF email with no attachment](../../screenshots/BUG-TCM-005/02-pdf-email-no-attachment.png)

The HTML email opened — attachment present and 14 KB:

![HTML email with attachment](../../screenshots/BUG-TCM-005/03-html-email-with-attachment.png)

Form state for the PDF run:

![New report form, PDF attachment selected](../../screenshots/BUG-TCM-005/04-form-pdf-option-selected.png)

Form state for the HTML run:

![New report form, HTML attachment selected](../../screenshots/BUG-TCM-005/05-form-html-option-selected.png)

All six report types in the inbox — every HTML variant carries a paperclip, every PDF variant does not:

![All six report types, PDF vs HTML](../../screenshots/BUG-TCM-005/06-all-six-types-pdf-vs-html.png)

### Console / log

Full excerpt: [`logs/BUG-TCM-005-pdf-attachment-evidence.log`](../../logs/BUG-TCM-005-pdf-attachment-evidence.log)

```
E, [2026-09-14T13:06:15.292395 #538] ERROR -- : [ActiveJob] [ActionMailer::MailDeliveryJob]
    Error generating PDF: No such file or directory - node
```

Both POSTs were byte-identical apart from the format flag, confirming nothing else differed between the two runs:

```
"name" => "RC-HTML-2026-09-14", ... "email_as_html" => "html"   -> attachment delivered
"name" => "RC-PDF-2026-09-14",  ... "email_as_html" => "pdf"    -> no attachment delivered
```

No browser console errors; the failure is entirely server-side and invisible to the UI.

## Retest 2026-09-14 — PASS on this bug's scope; residual finding split to BUG-TCM-006

The environment on `localhost:3012` was brought up to the documented procedure (KB Installation step 6 / the
plugin's own `initialize.sh`), then the bug was retested in two halves — because installing Node only addresses
one of them.

### Test 1 — PDF email with Puppeteer working: **PASS**

Installed `nodejs v20.19.2`, `npm 9.2.0`, the Chromium shared libraries, `puppeteer@^22.8.2` and Chrome
`127.0.6533.88`, then restarted Sidekiq with `PUPPETEER_EXECUTABLE_PATH` and `GROVER_NO_SANDBOX=true` exported,
as `initialize.sh` does. Emailed a Requirement Coverage report as PDF:

| | Before (pre-install) | After |
|---|---|---|
| Email size | 1,747 B | **74,652 B** |
| Content-Type | `text/html` | **`multipart/mixed`** |
| Attachment | none | **`RETEST-BUG005-PDF-AfterInstall.pdf`** |
| Sidekiq `Error generating PDF` | present | **none** |
| Mail job duration | ~200 ms | **6,070 ms** (Chromium actually rendering) |

The delivered PDF is genuinely valid: 53,446 bytes, `%PDF-1.4` header, `%%EOF` trailer, **9 of 9 compressed
streams decompress cleanly**, xref present.

### Test 2 — PDF generation forced to fail: **out of scope — split to BUG-TCM-006**

Sidekiq restarted with `PUPPETEER_EXECUTABLE_PATH=/nonexistent/chrome`, inducing a **different** failure cause
than the original (browser missing at the configured path, rather than `node` absent). Same report, emailed as PDF:

```
Sidekiq: Error generating PDF: Tried to find the browser at the configured path
         (/nonexistent/chrome), but no executable was found.

Delivered email: 1,767 bytes | Content-Type: text/html | attachment: NONE
Body still reads: "Please find the attached Testcase Report:"
```

This is a **different assertion** from the one this bug was raised on. It requires PDF generation to be deliberately
broken before it can be observed at all — it is not reachable on the working server that Test 1 verified. Tracked
separately as **[BUG-TCM-006](../open/BUG-TCM-006.md)** (TC-TCM-101).

### Verdict — CLOSED, FIXED

**BUG-TCM-005 is closed as fixed**, on its original scope: *the report emailed as PDF arrives with no attachment.*

Scope verified against the source material before closing:

| Source | Assertion |
|---|---|
| Customer report (origin of the bug) | *"an email was received… but no attachment was included"* |
| Title of this bug | *"arrives with no attachment at all"* — the *"while the body still says"* clause describes the observed symptom, it is not the defect being asserted |
| Expected result, bullet 1 | *"The email arrives carrying a `.pdf` attachment… matching the behaviour of the HTML option"* |
| Expected result, bullet 2 | *"If the PDF genuinely cannot be produced, the user is told so"* — **conditional**, a fallback expectation, not the reported failure |
| `TESTCASE_MANAGEMENT_REPORTS.md` **TC-TCM-100** — this bug's stated retest vehicle | *"An email arrives as `multipart/mixed` carrying a valid `<name>.pdf` attachment"* — nothing about body text |

**Test 1 satisfies every one of those.** Root cause was an incomplete installation (KB Installation step 6 never
run on `redmine-docker-6-redmine-1`), not a product defect — so there is no code change to wait on here.

TC-TCM-101 ("PDF failure must not produce a misleading email") was written *after* this retest, from Test 2's
finding. It is therefore not evidence of this bug's original scope, and moves to BUG-TCM-006 as that bug's
retest vehicle.

**Regression:** the Reports suite was re-run in the same session — TC-TCM-098 (HTML email, all six report types),
TC-TCM-100 (PDF email) and TC-TCM-102 (report type does not affect emailing) all PASS. The HTML path was
specifically confirmed not regressed by the installation. Full Reports-suite regression (TC-TCM-078…534) is
outstanding and tracked in the handoff.

![Retest 2026-09-14 — AfterInstall carries an attachment, SilentFail does not](../../screenshots/BUG-TCM-005/07-retest-2026-09-14-install-fixes-pdf-silentfail-remains.png)

Full evidence: [`logs/BUG-TCM-005-retest-2026-09-14.log`](../../logs/BUG-TCM-005-retest-2026-09-14.log)

### Incidental finding — `initialize.sh` cannot run as shipped on Debian 12

The script requests `libgdk-pixbuf2.0-0`, which has **no installation candidate** on this release (the package is
now `libgdk-pixbuf-2.0-0`). `apt-get` aborts the entire install on that single bad name, so a user following the
documented procedure ends up with **no packages installed at all** and only a buried error. Encountered directly
during this retest.

Carried forward on **[BUG-TCM-006](../open/BUG-TCM-006.md)** under Suggested fix (development reports it fixed in
commit `dee611e`, unverified). It still warrants its own ticket, since it is an installer defect rather than a
mailer one — and it is the direct cause of the incomplete installation that produced *this* bug.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_index.md` (BUG-TCM-001 … BUG-TCM-004) and `bugs/_duplicates.md`. BUG-TCM-003/004 are Runs &
  Results defects; BUG-TCM-001/002 are CSV import. None touch report emailing.

## Notes

- **Not part of this bug:** the notification footer link renders as `http://hostname/my/account` instead of
  `http://localhost:3012/my/account`, even though `Setting.host_name` is correctly `localhost:3012`. This affects
  **core Redmine emails on this instance equally** (8 occurrences in plugin report emails, 8 in non-plugin core
  emails), so it is an instance/mailer configuration issue on `redmine-docker-6`, not a Testcase Management defect.
  Recorded here only so it isn't re-investigated as part of this bug.
