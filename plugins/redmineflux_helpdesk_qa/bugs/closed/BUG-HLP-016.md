# BUG-HLP-016

- Bug ID: BUG-HLP-016
- Title: Reply auto-assign silently fails to persist despite the server logging success — ticket stays Unassigned and its SLA clock never starts
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-08-31)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Agent (`luna.blossom`)
- Date: 2026-08-31

## Steps to reproduce

1. Have an unassigned Support ticket in a helpdesk-enabled project (Helpdesk QA Alpha) — reproduced on three, deliberately varied: **#9** (agent-created, no Customer link), **#7** (customer-created via the web New Issue form, no Customer link), and **#8** (created via real inbound email, genuine `Customer: Alpha Customer` link).
2. As an Agent (`luna.blossom`), open the ticket via the real in-app Helpdesk Tickets list (core `/issues/:id` route).
3. Click **Reply**, leave **Reply Note** selected, type a message, click **Save**.
4. Check the ticket's **Assignee** field after the reply.
5. Check the server log for the same request.

## Expected result

- The ticket becomes assigned to the replying agent (`luna.blossom`) — this is the documented, previously-confirmed behavior (see `testcases/HELPDESK_TICKET_LIFECYCLE.md` TC-HLP-021, CONFIRMED LIVE 2026-08-27, ticket #75).
- With a real assignment now in place, the SLA clock starts for the first time and an **SLA Information** tab/section appears on the ticket, later pausing when the ticket enters "Waiting for Customer Response".

## Actual result

- **Assignee stays "-" (Unassigned)** after the reply, on both tickets tested (#7 and #9) — confirmed via the ticket page itself, both immediately after Save and after a fresh reload.
- The server log for the very same request explicitly claims success: `[Helpdesk] Ticket #9 auto-assigned to luna.blossom on reply` (and identically for #7) — logged by `RedminefluxHelpdesk::ReplyAssignment#apply_reply_assignment!`, which correctly computed `luna.blossom` as the assignee and wrote `params[:issue][:assigned_to_id]` before the update proceeds.
- But the very next line in the same request's log shows the model itself disagrees: `[SLA Debug] assigned_to_id changed (before_save capture)? false` — i.e. the field genuinely never changed on the saved record, contradicting the "auto-assigned" log line one step earlier in the same request.
- Because `assigned_to_id` never actually changes, `handle_sla_on_assignment_change`'s "Case 1: Assignment from NULL" branch (which calls `start_sla_for_first_assignment`) never fires — so no `RfIssueSlaStatus` record is ever created, the SLA Information tab never appears, and later status transitions correctly (see below) still show no SLA effect at all.
- **Status auto-transition still works correctly** on the same request (Status → "Waiting for Customer Response") — because that path uses `update_column(:status_id, ...)`, which bypasses `Issue#safe_attributes=` and its permission/mass-assignment filtering entirely. This contrast — one field silently dropped, the other written via a raw column update on the very same save — points at `Issue#safe_attributes=` (likely a workflow field-permission check for `assigned_to_id` on the Agent role/Support tracker/current status) as the most likely place the assignment is actually being filtered out, rather than the `ReplyAssignment` module itself, which is provably computing and injects the correct value.
- **This appears to be a genuine regression, not environment-specific noise**: `grep`ing the container's log for the whole of today's session found **zero** occurrences of `SLA: true` — every ticket viewed today, across every earlier retest this session (BUG-HLP-008/009/015 work), rendered with `SLA: false`, meaning no ticket in this environment has an active SLA record today, even ones that received genuine agent Reply Notes (e.g. ticket #3, #8). The one still-Active SLA policy ("Alpha Standard SLA", confirmed Active, assigned to `alpha.customer`'s project access) can never actually start ticking for anyone, because nothing is completing a first assignment.
- **Ruled out "missing Customer link" as an alternate explanation**: #7 and #9 were both created without a `Customer:` field at all (agent-created, or customer-created via the web form — neither shows a Customer link on the issue page). To rule out that this — rather than the params/`safe_attributes=` issue — was the real reason SLA/assignment never fires, re-checked ticket **#8**, which *does* show a genuine `Customer: Alpha Customer` link (created via real inbound email, which goes through `MailHandler`'s explicit customer-linking code) and which `luna.blossom` had already sent a real Reply Note to during this same session's TC-HLP-019 re-run. Its row in the Helpdesk Tickets list still reads **Assignee: Unassigned, SLA: — No SLA** despite that reply and despite the server log for that exact request also saying "Ticket #8 auto-assigned to luna.blossom on reply." Since the one ticket with genuine Customer linkage fails identically to the two that lack it, the Customer-link theory is ruled out — this really is the `assigned_to_id` write silently not persisting, independent of whether the ticket has a linked customer.

## Evidence

### Screenshot

![Ticket #9 (agent-created, no Customer link): Assignee still shows "-" immediately after a Reply Note save that the server log claims auto-assigned it to luna.blossom](../../screenshots/BUG-HLP-016/ticket9-assignee-still-dash-after-reply.png)
![Ticket #7 (customer-created via web form, no Customer link): same failure — Assignee "-" after the identical Reply Note steps](../../screenshots/BUG-HLP-016/ticket7-assignee-still-dash-after-reply.png)
![Ticket #8 (created via real inbound email, genuine Customer link to Alpha Customer): same failure even with a real customer association — Assignee "-", no SLA — ruling out "missing Customer link" as an alternate explanation](../../screenshots/BUG-HLP-016/ticket8-customer-linked-still-unassigned-no-sla.png)

### Retest screenshot (fill after fix is verified)

![Retest result — ticket #10: Assignee "Luna Blossom", SLA Information tab shows "⏸ Paused — the clock is not running"](../../screenshots/BUG-HLP-016/retest-2026-08-31-assignee-and-sla-now-working.png)

### Console / log

- Ticket #7 reply (`PATCH /issues/7`): `[Helpdesk] Ticket #7 auto-assigned to luna.blossom on reply` immediately followed by `[SLA Debug] assigned_to_id changed (before_save capture)? false`.
- Ticket #9 reply (`PATCH /issues/9`): identical pattern — `[Helpdesk] Ticket #9 auto-assigned to luna.blossom on reply` then `[SLA Debug] assigned_to_id changed (before_save capture)? false`.
- Ticket #8 reply (`PATCH /issues/8`, during this session's TC-HLP-019 re-run): same pattern again — `[Helpdesk] Ticket #8 auto-assigned to luna.blossom on reply` logged, but the Helpdesk Tickets list and the ticket page both still show Assignee "Unassigned" afterward, confirmed on a later independent page load.
- Both requests also show `[Helpdesk] Issue #<id> → 'Waiting for Customer Response' after agent reply` succeeding via `update_column`, confirming the save itself completes — only the mass-assigned `assigned_to_id` is lost.
- `docker logs redmine-docker-6-redmine-1` for the full session (`--since 6h`, filtered on `SLA: `): every `[Custom Tabs] Issue #N ... SLA: false` line, no `SLA: true` occurrences at all.
- Source inspected: `lib/redmineflux_helpdesk/reply_assignment.rb` (`apply_reply_assignment!`, confirmed correctly writing `params[:issue][:assigned_to_id]`) and `lib/redmineflux_helpdesk/patches/issue_patch.rb` (`handle_sla_on_assignment_change`, confirmed gated on `assigned_to_id changed?`, which is false).

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Notes

- Found while re-executing `testcases/HELPDESK_TICKET_LIFECYCLE.md` TC-HLP-021 from scratch against the post-DB-reset Local environment — the original 2026-08-27 evidence for that TC (ticket #75) explicitly confirmed both auto-assign and SLA-pause working; this session's fresh re-run of the identical steps (agent-created ticket, Assigned to blank, Reply Note) reproduced cleanly on two independent tickets (#7 and #9), so this is treated as a real regression between 2026-08-27 and now, not a one-off.
- Root cause is diagnosed from source + log inspection, not a debugger trace — worth a developer confirming exactly which `safe_attributes=` gate (workflow field permissions vs. some other guard) is silently dropping `assigned_to_id` specifically for this save path, since the same field is editable through the plain Edit form (confirmed working throughout this session's other retests).
- This single root cause most likely explains **both** of TC-HLP-021's failing sub-claims (no auto-assign, no SLA pause) as one bug, not two — SLA-start is entirely downstream of the assignment succeeding.
- `testcases/HELPDESK_TICKET_LIFECYCLE.md` TC-HLP-021 updated with a FAIL entry cross-referencing this bug.

## Retest — 2026-08-31, Local (redmine-docker-6)

- **Context**: the user identified the actual root cause directly from the Agent role's own permissions page — the per-tracker "Issue tracking" permission matrix (Administration → Roles and permissions → Agent → Edit) had the **Support** tracker row's own **Edit issues** permission not granted, even though this session's own environment build (earlier today) had only set up the Agent role via "All trackers" without separately confirming the Support-tracker-specific row. The user corrected this via the role's own Edit page.
- **Steps**: created a fresh unassigned ticket (**#10**) as `luna.blossom`, clicked **Reply**, Reply Note, typed a message, Save.
- **Result — PASS on all fronts**: **Assignee** changed from "-" to a real link to **Luna Blossom** (confirmed on the ticket page immediately after Save). Status correctly auto-transitioned to **Waiting for Customer Response**. A brand-new **SLA Information** tab now appears on the ticket (didn't exist on #7/#8/#9), showing **"⏸ Paused — the clock is not running. Paused since 08/31/2026 09:25 AM (UTC)"** — matching the original 2026-08-27 evidence pattern exactly.
- **Corrected root-cause understanding**: the earlier `safe_attributes=`/workflow-field-permission theory in this file's Actual Result section was a reasonable diagnosis from the log contradiction alone, but the real gap was simpler — a genuine, missing per-tracker role permission (Agent role, Support tracker, Edit issues), not a code-level filtering bug. This also explains why Status's `update_column` write (which bypasses permission checks entirely) kept working while the mass-assigned `assigned_to_id` (which does go through the normal permission-checked `safe_attributes=` path) was silently dropped — exactly consistent with an actual missing permission, not a code defect.
- Screenshot: `retest-2026-08-31-assignee-and-sla-now-working.png` (ticket #10).
- **Verdict: RETEST PASS.**

## Closed — 2026-08-31

- Closed per explicit user confirmation, following the clean retest above (ticket #10: auto-assign and SLA-pause both work correctly).
- **Root cause, confirmed**: an environment/setup gap, not a plugin code defect — the Agent role's per-tracker "Issue tracking" permission matrix (Administration → Roles and permissions → Agent → Edit) had the **Support** tracker's own **Edit issues** checkbox not granted. This session's earlier from-scratch environment rebuild had only checked "All trackers", which does not automatically extend to the tracker-specific row for a custom/added tracker like Support in this plugin's permission model.
- If the same symptom (reply auto-assign logs success but the ticket stays Unassigned, no SLA tab) reappears, check the Agent role's tracker-specific Edit Issues permission for Support **first**, before assuming a code regression.
- If this reappears on a different role/tracker combination or after a confirmed correct permission setup, file a new bug rather than reopening this one.
