# BUG-HLP-018

- Bug ID: BUG-HLP-018
- Title: When "Comment" is marked Required for time logs, the reply box's Comment field is invisible until the first Save attempt fails
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-08-31)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Admin (setting), Agent (`luna.blossom`'s ticket, tested as `admin`)
- Date: 2026-08-31

## Steps to reproduce

1. Administration → Settings → Time tracking → check **Comment** under "Required fields for time logs", Save.
2. Open any Support ticket, click **Reply**.
3. Select a Time spent preset (e.g. "10 min") and an Activity, type a reply, click **Save** — without looking for or filling in a Comment field.

## Expected result

- Per `HELPDESK_TICKET_LIFECYCLE.md` TC-HLP-395's own documented expectation for this feature: once Comment is marked Required, **a Comment field appears** in the reply's time-log block, and is required to save.

## Actual result

- Immediately after checking "Comment" as required and reloading the reply form, **no Comment field is present at all** — confirmed via a full-page search for "Comment" text, with a Time spent preset already selected (so it isn't merely gated behind picking a preset first).
- Clicking **Save** in this state throws a client-side alert: **"A comment is required on time entries."** — but at the moment this alert fires, there is still no way to comply, since the field doesn't exist on the page.
- Only *after* dismissing that alert does the **Comment \*** field become visible in the DOM (confirmed via a fresh snapshot immediately after dismissing) — it appears to be un-hidden by the same validation routine that blocks the save, not created fresh.
- Once visible, typing into it and clicking Save again **does succeed** — Spent time correctly went from 0:45h to 0:55h. So this isn't a hard, unrecoverable dead-end, but the field is genuinely absent through the entire first attempt: a real user gets a "the input you need doesn't exist" experience for one full round-trip before the form self-corrects.

## Evidence

### Screenshot

![Reply form with Time spent = 10 min, Activity selected, and "Comment required" globally on — the Comment field is entirely absent from the rendered form](../../screenshots/BUG-HLP-018/reply-form-no-comment-field-required-on.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-HLP-018/retest-yyyy-mm-dd-pass.png)

### Console / log

- Client-side alert text, verbatim: `A comment is required on time entries.`
- Sequence confirmed via two consecutive Playwright snapshots of the same reply form: before the first failed Save, "Comment" does not appear in a full-page text search at all; immediately after dismissing the alert, the same form now shows `Comment *` as a focused, editable textbox.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Retest — 2026-08-31, Local (redmine-docker-6)

- **User reported this does not reproduce on manual check.** Retested immediately: re-checked "Comment" as Required, opened ticket #11's Reply form fresh (no prior failed Save attempt this time), and took a snapshot — **`Comment *` is present as a textbox from the very first load**, not gated behind picking a Time spent preset or a failed Save.
- Cross-checked directly against the live DOM via `browser_evaluate` rather than relying solely on the accessibility-snapshot text search that produced the original finding: `#rf-reply-time-comment` has `display: block`, `visibility: visible`, `offsetParent` non-null, a real on-screen bounding rect (1014×40px at a real x/y position), `opacity: 1`, and genuine `<input type="text">` markup — i.e. a normal, fully visible, interactive field, exactly where a user would expect it.
- Completed the full flow in one clean attempt with no failed Save first: typed a reply, filled the now-visible Comment field, picked an Activity, clicked Save — succeeded immediately (Spent time correctly went 0:55h → 1:05h), no alert, no retry needed.
- **Root cause of the original false positive**: the very first check relied on a `Grep` text search over a Playwright accessibility-snapshot capture, and that particular capture did not surface this label+input pair as expected — most likely a one-off snapshot/timing artifact rather than a real rendering gap, since a direct DOM query and every subsequent snapshot show the field correctly. The "field appears only after a failed Save" theory in the original Actual Result was an incorrect inference built on top of that same flawed first check, not an independently confirmed behavior.
- **Verdict: DOES NOT REPRODUCE.** Setting reverted to its original (Comment not required) state afterward.

## Closed — 2026-08-31

- Closed as **not a real bug** — a false positive from this session's own testing methodology (an accessibility-snapshot text search that missed a real, fully visible form field), not a plugin defect. The Comment field behaves exactly as `HELPDESK_TICKET_LIFECYCLE.md` TC-HLP-395 expects: absent when not required, present and required when the admin setting is on, from the very first load.
- If a similar "field completely absent" symptom appears again, cross-check via direct DOM inspection (`browser_evaluate` / `getComputedStyle`) before filing, rather than relying solely on an accessibility-snapshot text search.

## Notes

- Found while executing `testcases/HELPDESK_TICKET_LIFECYCLE.md` TC-HLP-395 — its own Expected Result ("a Comment field appears") is written as a proactive, on-load behavior; the real behavior turned out to match this exactly once retested properly.
- Not a data-loss bug even under the original (mistaken) understanding — the reply text and other fields survive untouched either way.
