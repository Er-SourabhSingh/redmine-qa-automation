# BUG-HLP-007

- Bug ID: BUG-HLP-007
- Production Redmine Issue ID: 119631
- Title: Submitting an Internal Note on a ticket crashes with a 500 Internal Server Error (`private_notes` NOT NULL violation)
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-08-26)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Agent (custom role, permissions per `HELPDESK_EMAIL_TEST_PLAN.md` §3 — `view_helpdesk`, standard issue permissions, no `manage_helpdesk`)
- Date: 2026-08-26

## ⚠️ Scope correction (2026-08-26 retest)

The original repro below was written using `browser_navigate` to jump straight to the branded URL `/projects/helpdesk-qa-beta/helpdesk/issues/67`. On retest, driving the same steps via **real UI click-through navigation** (Home → Projects → Helpdesk QA Beta → Helpdesk tab → Helpdesk Tickets sub-nav → click the ticket row) lands on `/issues/67` instead — Redmine's **core** `IssuesController#update` (PATCH) — and Internal Note submission **succeeds** there: `private_notes` is correctly submitted as `"1"`, journal is created and correctly marked Private, no crash.

So the bug is **not** unconditional across "any role" as originally stated — it is specific to which of two controllers handles the ticket page:

| Route | Controller | Internal Note submit |
|---|---|---|
| `/projects/:id/helpdesk/issues/:id` (branded) | `RfProjectHelpdeskIssuesController#update` (PUT) | **Crashes** — `private_notes` NOT NULL violation |
| `/issues/:id` (core Redmine) | `IssuesController#update` (PATCH) | Works correctly |

**This does not shrink the bug's real-world impact — it confirms it.** Every outbound Helpdesk notification email's "View Ticket" / "View Ticket Details" link points to the branded route. Verified directly in Roundcube on 2026-08-26 by opening two real notification emails sent for ticket #67:
- Ticket-created confirmation ("View Ticket Details" link) → `http://localhost:3012/projects/helpdesk-qa-beta/helpdesk/issues/67`
- Agent-reply notification ("View Ticket" link) → `http://localhost:3012/projects/helpdesk-qa-beta/helpdesk/issues/67`

So any agent or customer who reaches a ticket by clicking a link in an email — which is the primary, expected entry point for a support workflow — lands on the buggy branded route and hits this crash the moment they try to leave an Internal Note. The only way to *avoid* it is to already be logged into Redmine and manually navigate the in-app ticket list instead of using the email link, which is not realistic day-to-day agent behavior.

The steps below (marked **[Branded route / crashes]**) are the original, still-valid repro for the buggy path. A **[Core route / works]** variant is noted after for contrast.

## Steps to reproduce

**[Branded route / crashes]**

1. Log in as an Agent-role user who is a member of a Helpdesk-enabled project (reproduced as `aurora.wren` on Helpdesk QA Beta).
2. Reach the ticket via the branded URL — in practice this is how a real user arrives, by clicking "View Ticket"/"View Ticket Details" in a Helpdesk notification email (reproduced on Support #67, `/projects/helpdesk-qa-beta/helpdesk/issues/67`).
3. Click **Reply**.
4. Select the **Internal Note** radio button (instead of the default "Reply Note").
5. Type any note text (reproduced text: "Internal: checked our error logs, looks like a caching issue on our end after the last deploy. Will push a fix and follow up with the customer.").
6. Select any Activity in the time-log section (Activity is a required field on this form even when not logging time) — reproduced with "Technical Support".
7. Click **Save**.

**[Core route / works — does NOT reproduce]**

1. Same login.
2. Reach the same ticket by clicking through the real in-app UI instead: Home → Projects → Helpdesk QA Beta → Helpdesk tab → Helpdesk Tickets sub-nav → click the ticket #67 row. This lands on `/issues/67`.
3–7. Same steps as above (Reply → Internal Note → text → Activity → Save) — submission succeeds, journal created and correctly marked Private.

## Expected result

- The note is saved as an internal (team-only) note on the ticket, per `HELPDESK_FEATURES_LIST.md` #15 — never emailed to the customer, no status/SLA side effects — **regardless of which route the ticket page was reached through.**
- **Per explicit user product-judgment direction (2026-08-31): an Agent should not open a ticket via the branded/"customer" ticket URL (`/projects/:id/helpdesk/issues/:id`) at all — an Agent session should only ever use the core Redmine issue route (`/issues/:id`).** The branded route is intended for the customer-facing experience; an Agent landing on it (e.g. via a notification email's "View Ticket" link, which currently points there for every role) is itself the wrong behavior, not just an acceptable path that happens to crash on Internal Note. The real fix direction is therefore two-part: (1) outbound notification emails should link Agents to the core `/issues/:id` route, not the branded route, and (2) even if the branded route remains reachable, it should not be relied upon for Agent workflows — this reframes the priority away from "fix `private_notes` handling on the branded route" and toward "stop routing Agents to the branded route in the first place."

## Actual result

- Via the branded route, the request fails outright with **HTTP 500 Internal Server Error** — Redmine's generic "Internal error" page is shown, no note is saved, and the ticket page itself is inaccessible until navigating back.
- Server-side exception (from the Rails/Sidekiq combined stdout log):
  ```
  Completed 500 Internal Server Error in 80ms (ActiveRecord: 35.4ms (24 queries, 3 cached) | GC: 0.0ms)
  ActiveRecord::NotNullViolation (Mysql2::Error: Column 'private_notes' cannot be null):
  Causes:
  Mysql2::Error (Column 'private_notes' cannot be null)
  ```
- The submitted request parameters show the root shape of the problem — `private_notes` was submitted as an **empty string**, not a boolean:
  ```
  "issue" => {"notes" => "Internal: checked our error logs, ...", "private_notes" => ""}
  ```
  Something in `RfProjectHelpdeskIssuesController#update`'s Internal Note code path is passing this empty string through to a raw column write instead of Rails' normal boolean type-casting (which would coerce `""` to `false` safely) — the underlying `journals.private_notes` column is `NOT NULL`, and an empty string reaches MySQL as a literal, not as `0`/`false`, tripping the NOT NULL constraint directly. The core `IssuesController#update` action does not have this defect — it correctly submits `"1"`/`"0"`.
- **This blocks the Internal Note feature specifically for anyone who reaches a ticket via the branded URL** — which, per the email-link verification above, is every real notification-driven workflow. It is not blocked when reached via in-app ticket-list navigation.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-HLP-007/internal-note-submit-500-error.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-HLP-007/retest-yyyy-mm-dd-pass.png)

### Console / log

- Branded route (crashes): `Started PUT "/projects/helpdesk-qa-beta/helpdesk/issues/67" ... Processing by RfProjectHelpdeskIssuesController#update as HTML`
- Params: `{"issue" => {"notes" => "...", "private_notes" => ""}, "time_entry" => {"hours" => "", "activity_id" => "", "comments" => "", "rf_helpdesk_support_package_id" => ""}, "helpdesk_reply" => "1", "project_id" => "helpdesk-qa-beta", "id" => "67"}`
- Exception: `ActiveRecord::NotNullViolation (Mysql2::Error: Column 'private_notes' cannot be null)`, raised inside `RfProjectHelpdeskIssuesController#update`.
- Core route (works): `Started PATCH "/issues/67" ... Processing by IssuesController#update as HTML`, `private_notes => "1"` correctly submitted, `302 Found`, Journal #536/#3 created and correctly marked Private, correctly attributed to the submitting agent.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Retest — 2026-08-31, Local (redmine-docker-6), fresh rebuilt environment

- **Context**: retested on the environment rebuilt earlier this session (new project Helpdesk QA Alpha, new agent `luna.blossom`, ticket #2) — zero shared history with the original `aurora.wren`/Helpdesk QA Beta repro.
- **Branded route** (`/projects/helpdesk-qa-alpha/helpdesk/issues/2`, reached by direct navigation since there is still no legitimate in-app agent click path to it — only an outbound notification email link reaches it, matching this bug's own established finding): logged in as `luna.blossom`, Reply → Internal Note → text → Activity "Technical Support" → Save. **Still crashes with HTTP 500.** Confirmed via the server log (`docker logs redmine-docker-6-redmine-1`) — byte-for-byte the same failure as originally reported: `Processing by RfProjectHelpdeskIssuesController#update`, params show `"private_notes" => ""`, exception `ActiveRecord::NotNullViolation (Mysql2::Error: Column 'private_notes' cannot be null)`. Screenshot: `retest-2026-08-31-still-500-error.png`.
- **Core route** (`/issues/2`) contrast check, same session: Internal Note submitted cleanly, no error, note saved and correctly marked "Private" in the ticket's history. Confirms the branded-vs-core split is unchanged.
- **Verdict: RETEST FAIL — bug still reproduces, unchanged.** This is a genuinely unfixed defect, not an environment-specific artifact — same exact controller, same exact param shape, same exact exception as the original report. Left open.
- **Follow-up check, same session: confirmed by actually clicking, not just reading `href` attributes, that there is still no in-app agent click path to the branded route.** Clicked through Helpdesk QA Alpha's own "Helpdesk" tab → "Helpdesk Tickets" sub-nav → clicked the ticket row itself (both the `#2` link and the subject link) — lands on `/issues/2` (core route) every time, confirmed via the resulting page URL after the click, not merely the link's static `href`. Also checked the project's Helpdesk Dashboard for a "Recent Tickets"-style widget as an alternate path — none exists at the project level (that widget is Command-Center-only, admin/manager-facing). This reconfirms: the branded route is reachable in practice only via an outbound notification email's "View Ticket" link, never through any in-app navigation an agent would organically use — which is exactly why this bug's real-world impact is high despite the core route working fine.

## Notes

- The equivalent **Reply Note** path (same form, same controller action, `private_notes` presumably correctly sent as `"0"`/absent) works correctly — confirmed multiple times this session (ticket #67's agent reply and the customer's email reply both saved cleanly). This isolates the defect specifically to how the Internal Note radio's selection is serialized into the `private_notes` param, not a general fault in the reply-save path.
- Found while executing the local email-flow test plan's Internal Note re-confirmation step (`HELPDESK_EMAIL_TEST_PLAN.md` / `HELPDESK_MEMORY.md`'s "Confirmed Working (addendum #5)" internal-note-vs-reply-note comparison, originally verified on Forge — this is the first time it's been exercised on the local environment, and it fails outright here, a regression risk if this same code path is version-dependent between Forge's instance and this local build).
- **Retested 2026-08-26** using real click-through navigation per the "no direct URL navigation" QA rule — this is what surfaced the branded-vs-core routing distinction above. The bug remains open (High) since the branded route is what every real notification email links to; recommend the fix target `RfProjectHelpdeskIssuesController#update`'s handling of the `private_notes` param specifically (coerce empty string to boolean the way core Rails/`IssuesController` already does), rather than treating this as a navigation-path issue to work around.
