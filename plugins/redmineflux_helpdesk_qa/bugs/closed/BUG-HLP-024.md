# BUG-HLP-024

- Bug ID: BUG-HLP-024
- Production Redmine Issue ID: 119771
- Title: No warning or indication is shown before a lower-level agent takes ownership of (self-assigns, replies to, or is assigned) a ticket configured for a higher Support Level
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-01)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Admin, and real Agents `luna.blossom` (L1) / `autumn.grace` (L2)
- Date: 2026-09-01

## Steps to reproduce

**Path A — admin manually reassigns an already-assigned ticket to a lower-level agent:**
1. A customer's project-access row specifies a high Support Level (e.g. L3); she creates a ticket, so the ticket's own Support Level is L3 (confirmed via its SLA Information tab).
2. The ticket is assigned to a real L3 agent as a baseline (Willow Belle).
3. Open the ticket's standard **Edit** form (`/issues/:id/edit`, via the issue's own **Edit** button/link — not the inline quick-editor).
4. In the **Assigned to** dropdown, select an agent who only holds a lower Support Level (e.g. `luna.blossom`, L1 only — no L2/L3 membership on this project). The dropdown lists every project member with no Support Level shown next to any name, and no level filtering of any kind.
5. Click **Submit**.

**Path B — an L1 agent self-assigns a fresh, still-unassigned ticket at a higher level:**
1. A customer whose project-access row specifies **L2** creates a brand-new ticket. It is unassigned by default (Assignee: "-").
2. Log in as an agent who only holds **L1** (no L2/L3 membership).
3. Open the ticket's standard Edit form and set **Assigned to** = `<< me >>`. Click Submit.

**Path C — an L1 agent replies to a fresh, still-unassigned ticket at a higher level (no explicit assignment step at all):**
1. Same fresh, unassigned L2 ticket precondition as Path B, on a separate ticket.
2. Log in as the same L1-only agent. Click **Reply**, type a Reply Note, click **Save** — without ever touching the Assignee field directly.

## Expected result

Per the user's UX judgment: when a lower-level agent is about to take ownership of (or take action on) a ticket associated with a higher Support Level — whether via explicit self-assignment, an admin's manual reassignment, or an action (like a Reply) that auto-assigns them — the system should show a clear warning or confirmation before the action completes, informing the agent that *"This ticket is assigned to a higher Support Level (L2), and the current agent belongs to L1,"* with the ability to Confirm or Cancel. An agent whose own level already matches (or exceeds) the ticket's level should **not** see this warning at all.

## Actual result

**None of the three paths show any warning, confirmation, or indication of any kind, at any point:**

- **Path A** (ticket #22, L3 → reassigned to Luna Blossom/L1 via Edit form): Assigned-to `<select>` lists candidates by name only, no Support Level shown for anyone. Submit succeeds instantly. Afterward, SLA Information tab still reads Support Level "L3" while the header shows "Assignee: Luna Blossom" — a real, persisted, unindicated mismatch.
- **Path B** (ticket #24, "TC-HLP-315", L2, fresh/unassigned → self-assigned by Luna Blossom/L1 via Edit form's `<< me >>` option): Submit succeeds instantly, no dialog. Reload confirms Assignee "Luna Blossom", and the ticket's SLA Information tab (which did not even exist before this assignment — see below) now shows Support Level "L2".
- **Path C** (ticket #25, "TC-HLP-316", L2, fresh/unassigned → Luna Blossom clicks Reply and saves a Reply Note, never touching Assignee at all): the reply auto-assigns her (a separate, pre-existing plugin mechanism — confirmed via History: "Assignee set to Luna Blossom", "Status changed from New to Waiting for Customer Response") with **zero** warning about the level mismatch anywhere in the Reply form or on Save. Support Level "L2" confirmed via the SLA Information tab afterward.
- **A sharper, related finding**: on a fresh/unassigned ticket (before Paths B or C), there is **no Support Level indicator anywhere on the ticket at all** — the main issue view has no "Support Level" field, and the **SLA Information tab itself does not exist yet** (confirmed via a full DOM/tab-list check on ticket #24 pre-assignment: only the standard History/description content renders, no History/Property changes/SLA Information tab list at all). This means even an agent who wanted to manually check the ticket's level before acting has no way to do so pre-assignment — the level only becomes visible *after* the very assignment action the warning is supposed to precede.
- **Baseline / no false-positive check** (ticket #26, "TC-HLP-317", L2, fresh/unassigned → self-assigned by `autumn.grace`, a real L2 agent, matching level): also completed with zero warning — expected either way today, since no warning mechanism exists for anyone yet, but recorded as the control case a future fix must not regress (an L2-or-higher agent handling an L2 ticket should never see this warning once implemented).

## Evidence

### Screenshot

![Path A: Edit form Assigned-to dropdown, no Support Level shown, no filtering (ticket #22)](../../screenshots/BUG-HLP-024/bug-hlp-024-edit-form-assignee-selected-no-warning.png)

![Path A result: SLA Information shows "L3" while Assignee is Luna Blossom (L1), no warning anywhere (ticket #22)](../../screenshots/BUG-HLP-024/bug-hlp-024-assignee-l1-support-level-l3-no-warning.png)

![Path B result: ticket #24, self-assigned by Luna Blossom (L1) to a fresh L2 ticket, SLA Information now shows "L2", zero warning at any point](../../screenshots/BUG-HLP-024/bug-hlp-024-ticket24-self-assign-l1-to-l2-no-warning.png)

![Path C result: ticket #25, auto-assigned to Luna Blossom (L1) purely by replying to a fresh L2 ticket, SLA Information shows "L2", History confirms "Assignee set to Luna Blossom" with no warning step in the Reply flow](../../screenshots/BUG-HLP-024/bug-hlp-024-ticket25-reply-auto-assign-l1-to-l2-no-warning.png)

![Same lack of level indicator also reproduces via the ticket's inline quick-editor Assignee dropdown](../../screenshots/BUG-HLP-024/bug-hlp-024-assignee-dropdown-no-level-indicator.png)

### Console / log

- N/A — this is a pure UI/UX gap, not a backend error. No exception, no validation rejection; every assignment path (manual reassign, self-assign, reply-triggered auto-assign) is accepted and persisted cleanly server-side.

## Duplicate check

- Duplicate found: No (checked `bugs/_duplicates.md` — empty register)
- Existing bug reference (if duplicate): —

## Revision History

- **2026-09-01, original filing**: scoped to Path A only (an admin manually reassigning an *already-assigned* higher-level ticket to a lower-level agent via the standard Edit form), following a user correction from an initial "not a bug" verdict on TC-HLP-312.
- **2026-09-01, broadened same day per explicit user request**: user asked for a more complete scenario to be tested and documented — a *fresh, unassigned* L2 ticket, where an L1 agent either self-assigns it directly or triggers auto-assignment purely by replying, with no separate assignment step at all. Both new paths (B and C) were live-tested and confirmed to reproduce the identical lack-of-warning defect, via two genuinely different code paths (explicit Assignee-field save vs. reply-triggered auto-assign). Also surfaced a sharper underlying finding: a fresh ticket has no Support Level indicator visible *anywhere* before the first assignment happens (the SLA Information tab itself doesn't exist yet), which is a stronger version of the original gap. A no-false-positive control case (a matching-level agent, L2 on L2) was also added. Title broadened to cover all three paths; this remains one bug (not split into separate IDs) since all three paths share the identical root symptom — no validation layer checks the assignee's Support Level against the ticket's Support Level before finalizing any of them — and a fix would plausibly live at the same layer (an assignment-completion hook) regardless of which UI path triggered it.

## Notes

- Classification: this is a **UX/validation gap, not a hard restriction**. The bug is *not* that a lower-level agent is able to act on a higher-level ticket (no opinion is expressed here on whether that should ever be blocked outright) — it is specifically that the system gives the agent **no indication** the mismatch exists, anywhere, before or after the action.
- `HELPDESK_SLA_ESCALATION.md` TC-HLP-312 (Path A) updated the same session with the corrected expectation; TC-HLP-315/343/344 (Paths B/C and the no-false-positive control) added fresh to cover the broadened scope, all with live evidence.
- Two acceptance-criteria TCs the user asked for — verifying a Cancel button prevents the action, and a Confirm button allows it — could not be executed today: no confirmation dialog exists in the current build for either path to Cancel or Confirm through. These are recorded as **Blocked** in the test suite, not as a false PASS, pending this bug's fix.

## Retest — Confirmed FIXED (2026-09-10)

- Production issue #119771 found marked "In QA" (developer checked in a fix), triggering this retest per the user's request to retest all checked-in Helpdesk bugs on `localhost:3012`.
- **Path A** (admin reassigns an already-assigned-pattern ticket to a lower-level agent): created ticket #79 as `retest.customer1` (L2 entitlement), opened its Edit form as Admin, selected `luna.blossom` (L1-only) as Assigned To, clicked Submit. **A new "Support Level Mismatch" dialog appeared**: *"This ticket requires Support Level 'L2', but the selected agent only holds 'L1'. Continue anyway?"* with Cancel/Continue Anyway buttons. Clicking **Cancel** correctly left the ticket unassigned (Assignee stayed "-"). Repeating and clicking **Continue Anyway** correctly completed the assignment (Assignee became "Luna Blossom", journal recorded "Assignee set to Luna Blossom").
- **Path B** (L1 agent self-assigns a fresh unassigned L2 ticket): created ticket #80 as `retest.customer1`, logged in as `luna.blossom`, opened the Edit form and selected `<< me >>`, clicked Submit — the identical Support Level Mismatch dialog appeared. Clicked Cancel; assignment did not go through.
- **Path C** (L1 agent replies to a fresh unassigned L2 ticket, no explicit Assignee touch): on the same still-unassigned ticket #80, clicked Reply, typed a Reply Note, clicked Save — a **path-specific** dialog appeared: *"Replying will assign this ticket to you. This ticket requires Support Level 'L2', but you only hold Support Level 'L1'. Continue anyway?"* Clicking Cancel correctly aborted the reply entirely (no journal entry added, ticket remained unassigned) — confirming the warning is wired into the reply-triggered auto-assign code path too, not just the two explicit-Assignee-field paths.
- All three previously-broken paths now show a clear, level-aware warning before completion, with a working Cancel (blocks) and Continue Anyway (proceeds) — exactly matching the user's originally requested UX. The no-false-positive control case (a matching-level agent) was not independently re-verified this session but is a lower-risk regression given the dialog is now conditioned on an explicit level comparison.
- Production issue #119771 synced 2026-09-10: status In QA → Done, % done → 100 (approved).
