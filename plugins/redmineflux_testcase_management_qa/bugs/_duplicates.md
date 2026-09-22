# Duplicate Bug Register — Redmineflux Testcase Management

> Check this before creating any new bug.

| Duplicate Finding | Root Cause | Original Bug ID |
|-------------------|------------|-----------------|
| "Report emailed as PDF arrives with no attachment" on a server where Node.js/Puppeteer/Chromium are not installed | Incomplete installation — KB Installation step 6 / `initialize.sh` never run. **Environment, not a product defect.** Check `node -v` and the Sidekiq process's `PUPPETEER_EXECUTABLE_PATH` before filing | BUG-TCM-005 (closed) |
| "Emailed PDF report has no attachment" observed *after* deliberately breaking PDF generation | The `rescue` in `run_mailer.rb` sends the mail anyway. **Not a duplicate of BUG-TCM-005** — that bug was the environment gap; this is the error-handling defect | BUG-TCM-006 |

> **BUG-TCM-005 / BUG-TCM-006 are not duplicates of each other.** They share a visible symptom (no attachment) but
> differ in assertion, trigger and cause. 005 = the PDF must be generated and attached on a working server
> (TC-TCM-100, fixed by completing the install). 006 = a *failed* PDF must not produce an email claiming an
> attachment (TC-TCM-101, open, needs a code fix). Deciding which applies: if `node`, `npm` and Chromium are
> present and the Sidekiq worker has `PUPPETEER_EXECUTABLE_PATH` set, it is 006.
