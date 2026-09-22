# BUG-HLP-019

- Bug ID: BUG-HLP-019
- Production Redmine Issue ID: 119751
- Title: Escalation notification email never states which SLA deadline (Response vs Resolution) was breached
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-01)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP) + Roundcube webmail
- User role: N/A (system-generated notification, verified via the real recipient's mailbox)
- Date: 2026-09-01

## Revision History

- **2026-09-01, revised same day per user pushback ("where does it mention this in the docs?").** The original title/scope also claimed the email should name the *previous assignee*, sourced from `HELPDESK_SLA_ESCALATION.md` TC-HLP-322's own content checklist rather than the actual product documentation. Re-checked `HELPDESK_USER_GUIDE.md` §"What the new assignee is told" directly: it promises **"the previous level and the new level"** — not the previous assignee's name — and the real email genuinely includes both levels correctly. That claim is dropped; it was never a documented requirement, so it doesn't belong in this bug (may be worth a separate UX *suggestion*, not a defect, if raised again). The guide's other promise — **"The SLA name and which deadline was breached — response or resolution"** — is a real, explicit requirement and is genuinely missing from the email. This bug is now scoped to that one confirmed gap only.

## Steps to reproduce

1. Set up a real L1→L2 escalation: SLA "Alpha Escalation Test SLA" (1-minute First Response Time), ticket #14 assigned to `luna.blossom` at Support Level L1.
2. Let the response deadline pass, then let the SLA monitor (`Helpdesk::SlaMonitorWorker`) process the breach — ticket escalates L1 → L2, reassigned `luna.blossom` → `autumn.grace`.
3. Log into `autumn.grace`'s real mailbox (Roundcube, `http://127.0.0.1:8081/`) and open the resulting escalation email in full.

## Expected result

Per `HELPDESK_USER_GUIDE.md` §"What the new assignee is told", the escalation email must state **which deadline was breached — response or resolution**, alongside the ticket ID/subject, project/status, previous/new level, SLA name, escalation count, and a direct link (all of which are separately confirmed present).

## Actual result

The email ("[Helpdesk QA Alpha] Issue Escalated from L1 to L2 - Issue #14...") contains a clean, well-formatted table with: Issue, Project, Status, Assigned To: Autumn Grace, **Previous Support Level: L1, New Support Level: L2** (both correctly present — matches the guide), SLA: Alpha Escalation Test SLA, Total Escalations: 1, plus a "View Issue" link. The one documented field genuinely missing: the email says the ticket was escalated "due to SLA breach" but never specifies **Response** vs **Resolution** — the plugin tracks both separately (per the SLA Information tab's own "Response SLA" / "Resolution SLA" columns), and a recipient can't tell from the email alone which one triggered this escalation.

Confirmed via the second (L2→L3) escalation on the same ticket too — `willow.belle`'s email showed the identical shape: "Assigned To: Willow Belle", "Previous Support Level: L2", "New Support Level: L3", still no breach-type statement.

## Evidence

### Screenshot

![Escalation email opened in autumn.grace's real mailbox — full content, no Response/Resolution breach-type statement anywhere (Previous/New Support Level rows ARE present, matching the documented spec)](../../screenshots/BUG-HLP-019/escalation-email-no-previous-assignee.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-HLP-019/retest-yyyy-mm-dd-pass.png)

### Console / log

- Sidekiq log confirms the mailer itself is only ever given the assignee and level pair, e.g.: `[SLA][EMAIL] Recipient: autumn.grace (autumn.grace@test.local) | Level: L1 → L2` — no breach-type (Response/Resolution) data is logged as being passed to the mailer, consistent with the rendered email being complete for what the code actually assembles (looks like a template/data-assembly gap, not a delivery gap).

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Notes

- Found while executing `HELPDESK_SLA_ESCALATION.md` TC-HLP-322 (2026-09-01).
- **Documentation basis (added on revision):** `HELPDESK_USER_GUIDE.md` §"What the new assignee is told" is the authoritative source — it explicitly lists 6 required email contents, one of which is "The SLA name and which deadline was breached — response or resolution." All 6 were checked individually against the real email; only this one is genuinely missing. The other 5 (ticket ID/subject, project/status, previous+new level, SLA name, escalation count, direct link) are all present and correct.
- Severity judged Medium: the email is still functional and directionally useful (tells the new assignee they now own the ticket, links straight to it, correctly shows the level change), but the one missing documented field is real information loss for anyone triaging escalations from the inbox alone — they can't tell which SLA clock actually triggered this without opening the ticket.

## Retest — Confirmed FIXED (2026-09-10)

- Production issue #119751 found marked "In QA" (developer checked in a fix), triggering this retest per the user's request to retest all checked-in Helpdesk bugs on `localhost:3012`.
- Set up a fresh L1→L2 escalation: created ticket #83 as `alpha.customer` (L1/Alpha Escalation Test SLA entitlement, 1-minute Response Time), assigned to `luna.blossom` (L1), waited for the response deadline to pass, then ran `Helpdesk::SlaMonitorWorker.new.perform`. The worker's own log now explicitly shows `Breach Type: Response SLA` being passed into the email-send step (previously nothing of the kind was logged as being passed to the mailer).
- Logged into the real recipient's mailbox (`autumn.grace@test.local`, Roundcube webmail) and opened the resulting escalation email in full. **The email now contains a dedicated "Breach Type: Response SLA" row**, positioned between Status and Assigned To — alongside all the previously-correct fields (Issue, Project, Status, Assigned To, Previous/New Support Level, SLA name, Total Escalations, View Issue link). All 6 documented required fields from `HELPDESK_USER_GUIDE.md` §"What the new assignee is told" are now present.
- Production issue #119751 synced 2026-09-10: status In QA → Done, % done → 100 (approved).
