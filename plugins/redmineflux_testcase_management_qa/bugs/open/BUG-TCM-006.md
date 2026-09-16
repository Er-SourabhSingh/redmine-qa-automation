# BUG-TCM-006

- Bug ID: BUG-TCM-006
- Production Redmine Issue ID: #120658 (https://flux.zehntech.com/issues/120658) — created 2026-09-15, assigned to Sheetal Sharma, Priority Medium, Defect Severity Medium-severity
- Title: Failed PDF generation still sends an email whose body promises an attachment that is not there, with nothing surfaced in the UI
- Redmine version: 6.1.3
- Plugin name: Redmineflux Testcase Management
- Plugin version: 7.0.0
- Environment: Docker `localhost:3012` (container `redmine-docker-6-redmine-1`, project `test`)
- Browser: Chromium (Playwright MCP, headed)
- User role: Administrator (`admin`)
- Date: 2026-09-15
- Severity: Medium
- Split from: **BUG-TCM-005** (closed 2026-09-15). See "Relationship to BUG-TCM-005" below.

## Summary

When a Testcase Report is emailed as PDF and **PDF generation fails for any reason**, `run_mailer.rb` rescues the
error, logs it, and then **sends the email anyway** — with no attachment, and a body that still reads
*"Please find the attached Testcase Report"*. Nothing is surfaced in the UI: the report is created and listed as
though it had succeeded. The only trace is one line in the Sidekiq log, which an end user never sees.

This is **not** the original customer symptom. The customer's missing attachment was an incomplete installation
(Node.js/Puppeteer/Chromium never installed — KB Installation step 6), which has been resolved and verified; see
BUG-TCM-005. This ticket is the **error-handling defect that remains on a correctly installed server**: a Puppeteer
timeout, render crash or OOM in production will produce the same silently-attachment-less email.

**Format scope:** the misleading body text lives in a template shared by *both* formats, but only the PDF branch
has a `rescue` that lets execution reach `mail(...)` without an attachment — the HTML branch has no `rescue` at
all, so a failure there raises and no email is sent. See "Scope check — is the HTML format affected too?" below
for the source evidence, what was tested on the HTML path, and the one HTML case that remains untested.

## Relationship to BUG-TCM-005

| | BUG-TCM-005 (closed) | BUG-TCM-006 (this bug) |
|---|---|---|
| Assertion | PDF is generated and attached to the email | A *failed* PDF must not produce an email claiming an attachment |
| Trigger | Normal, working server | Only when PDF generation fails |
| Cause | Incomplete installation (environment) | Code — the `rescue` in `run_mailer.rb` |
| Retest vehicle | TC-TCM-523 | TC-TCM-524 |
| Status | **Fixed / closed 2026-09-15** (retest Test 1 PASS) | **Open** |

BUG-TCM-005 was closed on its original scope after the PDF attachment was verified delivered and valid. This bug
carries forward the residual defect found during that retest's Test 2, which was never the reported symptom.

## Preconditions

- A project with the Testcase Management module enabled and at least one Requirement defined.
- Outgoing email configured and working (the HTML variant delivers fine over the same SMTP path).
- Sidekiq running (mail is delivered via `ActionMailer::MailDeliveryJob`).
- **Node.js + Puppeteer + Chromium installed** (Installation step 6) — i.e. a *correctly installed* server, so the
  environment gap of BUG-TCM-005 is not in play.
- Shell access to the server, to induce a PDF-generation failure. **This bug cannot be reproduced from the browser
  alone** — on a healthy instance the UI simply sends a working PDF.

## Steps to reproduce

1. Confirm PDF emailing works normally first (baseline): email any report as PDF and verify a valid attachment
   arrives. This rules out the BUG-TCM-005 environment cause.
2. Make PDF generation fail. Restart Sidekiq with a browser path that does not exist:
   ```
   PUPPETEER_EXECUTABLE_PATH=/nonexistent/chrome GROVER_NO_SANDBOX=true bundle exec sidekiq
   ```
   (Any other failure cause works equally — an induced Puppeteer timeout or OOM.)
3. Open a project → **TESTCASES** → **Reports** → **+ New report**.
4. Pick any **Select Type**, enter a **Name**, tick **Notify me by email**, enter a real, checkable mailbox.
5. Select **Email the report as PDF attachment**, leave **Right now**, click **Create**.
6. Observe the UI after submitting.
7. Open the recipient mailbox and inspect the delivered message's `Content-Type` and MIME parts.

## Expected result

- Either report creation fails with a **visible error in the UI**, or an email arrives that **plainly states the
  PDF could not be generated**.
- In no failure mode does a delivered email claim an attachment it does not carry.
- Falling back to the HTML attachment — which works reliably — would also be acceptable, provided the body says so.

## Actual result

- The report is created and listed as if it had succeeded. **No error, warning, or indication anywhere in the UI.**
- An email is delivered as bare `text/html` (1,767 bytes) with **no attachment MIME part at all**.
- The body still reads *"Please find the attached Testcase Report:"*.
- The only evidence of the failure is a single Sidekiq log line.

Measured on `localhost:3012`, 2026-09-14:

```
Sidekiq: Error generating PDF: Tried to find the browser at the configured path
         (/nonexistent/chrome), but no executable was found.

Delivered email: 1,767 bytes | Content-Type: text/html | attachment: NONE
Body still reads: "Please find the attached Testcase Report:"
```

Note this was a **different failure cause** from the one in BUG-TCM-005 (`Errno::ENOENT - node`), confirming the
defect is in the error handling itself and not specific to any one cause.

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

The `rescue` logs to `Rails.logger` and then *still calls `mail(...)`*. The mail body template
(`send_report.html.erb`) has no knowledge of whether the attachment was produced, so it unconditionally renders
*"Please find the attached Testcase Report"*. Because delivery is async via Sidekiq, nothing propagates back to the
request either, so the controller reports success.

### Affects every report type

All six report types share the single `send_report` method, so the **format branch** — not the report type —
decides the outcome. Any of the six will reproduce this.

### Scope check — is the HTML format affected too?

**Partly. The misleading text is shared; the defect that exposes it is not.**

`app/views/run_mailer/send_report.html.erb` is **one template used by both formats**, and its second line is
unconditional:

```erb
<p>Hello All,</p>
<p>Please find the attached Testcase Report: <strong>"<%= @report.name %>"</strong>.</p>
```

So the promise of an attachment is not PDF-specific — the template has no knowledge of whether an attachment was
actually produced, for either format.

What differs is the error handling around it. **The HTML branch has no `begin`/`rescue` at all**
(`run_mailer.rb:284-290`): if `modify_html_for_email` or the attachment assignment raises, the exception
propagates out of the mailer, the Sidekiq job fails and retries, and **no email is sent**. There is no code path
by which the HTML branch reaches `mail(...)` without its attachment. Only the PDF branch swallows its error and
carries on to `mail(...)` anyway.

`render_show_view` (line 277) runs *before* the branch and is likewise unprotected, so a render failure kills the
job for both formats without sending anything.

**Conclusion: the defect is PDF-only in practice**, and the fix belongs in the PDF branch — but the fix should
make the *template* conditional rather than only patching the `rescue`, since the body text is shared.

### What was and was not tested on the HTML path

| Check | Result |
|---|---|
| HTML email, normal operation, all six report types (TC-TCM-521) | **PASS** 2026-09-14 — `multipart/mixed`, valid 14–25 KB `.html` attachments |
| HTML email still works after the Node/Puppeteer install (regression) | **PASS** 2026-09-14 — not regressed |
| HTML branch source inspected for the same swallowed `rescue` | **Verified absent** — no `begin`/`rescue` in that branch |
| **HTML email under a *forced* failure** (the parallel of Test 2) | **NOT TESTED** |

The last row is an honest gap. It was not tested because the code shows the HTML branch cannot swallow an error —
but that is a code-reading argument, not an observation. It matters more now than it did: the developer-reported
fix below makes the PDF path **fall back to attaching the HTML report**, which turns HTML generation into a
dependency of the PDF fix. If HTML rendering fails *while* PDF generation has already failed, the fallback has
nothing to attach, and the behaviour in that case is unverified by anyone. Added as step 6 of the verification
plan.

## Suggested fix

1. **Stop swallowing the error.** On failure, either fail the report creation with a visible error, or send an
   email that plainly states the PDF could not be generated. Never one whose body claims an absent attachment.
2. **Make the mail body conditional** on whether an attachment was actually produced. This is the more robust half
   of the fix: `send_report.html.erb` is shared by both formats and its "Please find the attached…" line is
   unconditional, so patching only the `rescue` leaves the misleading text one code change away from resurfacing.
3. **Consider an HTML fallback** — attach the HTML report instead and say so in the body. The HTML path is proven
   reliable, and this keeps the user with a usable artifact. Note this makes HTML generation a dependency of the
   PDF failure path, which needs its own error handling (see verification step 6).
4. **Validate the dependency at plugin load / settings-save time** and surface a configuration warning, so the PDF
   option isn't silently offered on an instance where Installation step 6 was never completed. This alone would
   have prevented the original customer report (BUG-TCM-005).

## Developer-reported fix — NOT YET VERIFIED BY QA

Recorded on production #120588 (journal 2026-09-15) before this bug was split out. Carried forward here because it
applies to **this** defect, not to the closed BUG-TCM-005:

| Item | Reported state |
|---|---|
| Swallowed `rescue` in `run_mailer.rb` | Fixed, commit `dee611e` — rescue falls back to attaching the HTML report and sets `@pdf_generation_failed` |
| Mailer body no longer promises a PDF | `send_report.html.erb:2-4` branches on that flag, commit `dee611e` |
| Dependency validation + form warning | Commit `58c68d2`, refined in `9e82662` |

All commits reported to be on `development` **locally, not pushed**. Existing unit coverage
(`test/unit/run_mailer_send_report_test.rb`) stubs Grover — it is not a real Chromium render nor a real delivered
email.

### Verification required before this bug can close

Needs a live instance **with Sidekiq restart access**:

1. Puppeteer working: email a report as PDF → `multipart/mixed`, valid attachment, mail job duration in seconds.
2. `PUPPETEER_EXECUTABLE_PATH=/nonexistent/chrome`: record delivered size, `Content-Type`, whether an attachment
   MIME part exists, exact body text, and whether anything surfaces in the UI.
3. Repeat with a **second** failure cause (induced timeout or OOM) to confirm the fix isn't specific to the
   missing-binary case.
4. Confirm the HTML email path is not regressed — email a report as HTML and verify the attachment still arrives.
5. Spot-check at least two of the six report types across the shared `send_report` path.
6. **HTML generation failing *while* PDF has already failed** — the fallback's own failure mode, untested by
   anyone. Break both (e.g. a broken `PUPPETEER_EXECUTABLE_PATH` plus an induced `modify_html_for_email` failure)
   and confirm no email claiming an attachment is delivered. Only applicable once the HTML-fallback fix is in.

**Acceptance:** in no failure mode does a delivered email claim an attachment it does not carry.

## Evidence

Retest 2026-09-14 — the `AfterInstall` PDF carries an attachment; the `SilentFail` run does not:

![Retest 2026-09-14 — install fixes PDF, silent failure remains](../../screenshots/BUG-TCM-005/07-retest-2026-09-14-install-fixes-pdf-silentfail-remains.png)

The delivered email body promising an attachment that is not present:

![PDF email with no attachment](../../screenshots/BUG-TCM-005/02-pdf-email-no-attachment.png)

Full evidence: [`logs/BUG-TCM-005-retest-2026-09-14.log`](../../logs/BUG-TCM-005-retest-2026-09-14.log)

> Evidence lives under `screenshots/BUG-TCM-005/` because it was captured during that bug's retest, before this
> bug was split out. Retest evidence for **this** bug goes in `screenshots/BUG-TCM-006/`.

## Test case coverage

- **TC-TCM-524** — "PDF failure must not produce a misleading email". This is the retest vehicle for this bug.
- TC-TCM-523 covers the BUG-TCM-005 assertion (attachment delivered) and already passes.

## Duplicate check

- Duplicate found: No
- Split from BUG-TCM-005 by deliberate rescoping on 2026-09-15 — BUG-TCM-005 tracked the *missing attachment*
  (fixed, environment); this tracks the *swallowed error* (open, code). Recorded in `bugs/_duplicates.md`.
- Checked `bugs/_index.md`: BUG-TCM-001/002 are CSV import, BUG-TCM-003/004 are Runs & Results. Neither touches
  report emailing.

## Notes

- **Cannot be reproduced from the browser alone.** Any retest needs shell access to induce a PDF failure. A
  browser-only retest on a healthy instance will show a working PDF and produce a **false pass**.
- Severity assessed **Medium**, lower than BUG-TCM-005's High: it requires a PDF-generation failure to trigger, so
  it does not affect a healthy server's normal operation. It remains genuine because the failure is invisible —
  a user believes a report was delivered when it was not.
