# Duplicate Bug Register — Redmineflux Testcase Management

> Check this before creating any new bug.

| Duplicate Finding | Root Cause | Original Bug ID |
|-------------------|------------|-----------------|
| "Report emailed as PDF arrives with no attachment" on a server where Node.js/Puppeteer/Chromium are not installed | Incomplete installation — KB Installation step 6 / `initialize.sh` never run. **Environment, not a product defect.** Check `node -v` and the Sidekiq process's `PUPPETEER_EXECUTABLE_PATH` before filing | BUG-TCM-005 (closed) |
| "Emailed PDF report has no attachment" observed *after* deliberately breaking PDF generation | The `rescue` in `run_mailer.rb` sends the mail anyway. **Not a duplicate of BUG-TCM-005** — that bug was the environment gap; this is the error-handling defect | BUG-TCM-006 |

| "Download Server PDF"/`export_pdf1` always fails, on a server WITH Node/Puppeteer/Chromium fully installed | A `NameError` (`pdf_path` undefined) crashes the action before Grover is ever invoked — independent of whether Node/Chromium is installed at all. **Not a duplicate of BUG-TCM-005** (that bug is the environment gap: no Node/Chromium installed). This is BUG-TCM-114 | BUG-TCM-114 |

> **BUG-TCM-005 / BUG-TCM-006 are not duplicates of each other.** They share a visible symptom (no attachment) but
> differ in assertion, trigger and cause. 005 = the PDF must be generated and attached on a working server
> (TC-TCM-100, fixed by completing the install). 006 = a *failed* PDF must not produce an email claiming an
> attachment (TC-TCM-101, open, needs a code fix). Deciding which applies: if `node`, `npm` and Chromium are
> present and the Sidekiq worker has `PUPPETEER_EXECUTABLE_PATH` set, it is 006.

> **BUG-TCM-118 is not a duplicate of BUG-TCM-109/110 (other CI/bootstrap-area bugs).** Those are a stale report-
> type label and a 404 on cancelling a scheduled report — unrelated endpoints and symptoms. BUG-TCM-118 is
> specifically about `bootstrap_run`'s race-condition resolution for a duplicate run name, only reproducible with
> genuinely concurrent requests (1-in-5 trials), confirmed via `bugs/_index.md` grep for "race"/"bootstrap_run"/
> "RecordNotUnique" turning up nothing prior.

| "Requirement creation shows no Template option" on a fresh/real environment | Not a setup gap — `requirement_templates` seeding only ever happens via the internal QA/demo rake task `testcase_plugin:setup` (never run on a real install, never referenced in README). No UI/API anywhere in the plugin can create a `RequirementTemplate`. Confirmed live: dropdown renders but with zero real options on an environment where only migrations (not the rake task) were applied. This is BUG-TCM-120 | BUG-TCM-120 |

> **BUG-TCM-121 is not a duplicate of BUG-TCM-072 despite sharing the same commit, file and feature.** BUG-TCM-072
> is the security vulnerability (unescaped subject executes as live HTML); BUG-TCM-121 is a cosmetic regression
> *introduced by* BUG-TCM-072's own fix (Tribute's legitimate highlight `<span>` markup now shown as literal
> escaped text instead of rendering). Fixing one does not fix the other.

> **BUG-TCM-122 is not a duplicate of BUG-TCM-120 despite sharing the same feature and fix commit.** BUG-TCM-120
> was "no way to create a Requirement Template at all"; BUG-TCM-122 is "the way that now exists only clones an
> existing Requirement's content, and there's still no way to edit a template afterward." Fixing BUG-TCM-120 could
> not have fixed this — it's a narrower scoping gap within the same fix, not a leftover of the original bug.
