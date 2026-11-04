# Bug Report Template

- Bug ID: BUG-CRX-160
- Production Redmine Issue ID: #127607
- Title: Asking the Support Agent to create a Helpdesk "support package" proposes Crux's own unrelated
  `crux_create_work_package` tool instead of `redmineflux_helpdesk_create_support_package` — reproduced twice,
  including once with the exact correct tool name stated explicitly in the request
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Support Agent, Helpdesk plugin domain — redmineflux_helpdesk)
- Plugin version: 6.2.0 (Redmineflux Helpdesk plugin)
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-04

## Steps to reproduce

1. As admin, Support Agent pinned: "Create a new support package called 'Gold Support Package' with 10
   standard hours." Agent correctly discovered `redmineflux_helpdesk_create_support_package`, correctly
   explained its real field set (name + optional description, no "standard hours" field), and asked whether the
   user wanted that or a prepaid-hours setup instead — a genuinely good, accurate response.
2. Replied: "Create the support package called 'Gold Support Package' with a description noting it's for 10
   standard hours." — a direct, unambiguous follow-up to the agent's own question. Instead of proposing
   `Helpdesk Create Support Package`, the agent proposed **`Create work package` / "New work package"** —
   Crux's own internal task-tracking construct (`crux_create_work_package`), a completely unrelated tool, with
   a confirm card showing only `Autonomy: execute-with-approval` (no name/description fields reflecting the
   actual request at all). Cancelled rather than confirmed.
3. Retried, naming the correct tool explicitly: "Use the redmineflux_helpdesk_create_support_package tool
   specifically: name='Gold Support Package', description='For 10 standard hours'." — **identical result**: the
   agent again proposed `Create work package` / "New work package" with just `Autonomy: execute-with-approval`,
   ignoring the explicitly-named tool entirely. Cancelled.
4. Native-verified no resource was created at `/crux/work_packages` (no matching entry) since both proposals
   were cancelled rather than confirmed.

## Expected result

A request to create a Helpdesk "support package," especially one immediately following the agent's own correct
explanation of the real `create_support_package` tool, and even one explicitly naming the exact tool to use,
should propose `Helpdesk Create Support Package` with the requested `name`/`description` fields — not an
unrelated Crux work-package proposal.

## Actual result

The word "package" appears to trigger a hard mix-up with Crux's own `crux_create_work_package` tool, 2 times
in a row, including once where the user named the correct tool verbatim. The proposed confirm card for the
wrong tool doesn't even carry forward the name/description the user gave — it shows only a generic `Autonomy`
field, meaning the mix-up isn't just a wrong tool choice but a wrong *intent* entirely (treating this as "track
an internal task" rather than "create this named record").

## Evidence

### Console / log

- Attempt 1 (natural phrasing): *"I'll create this work package — confirm?"* → card: `Autonomy:
  execute-with-approval` only.
- Attempt 2 (exact tool name stated): *"I'll create this work package — confirm?"* → identical card:
  `Autonomy: execute-with-approval` only, completely ignoring the stated tool name and the `name`/`description`
  values given.
- Both cancelled; native-verified `/crux/work_packages` shows no matching new entry.

## Duplicate check

- Duplicate found: No. First finding of a "support package" vs. "work package" name-collision mix-up on this
  agent, and the first instance where even explicitly naming the correct tool in the user's own message failed
  to correct the agent's tool choice. Distinct from the false-capability-denial family (the agent did
  genuinely discover and correctly describe the real tool one turn earlier) and from BUG-CRX-157/159 (both
  about a real tool's actual field set, not a wrong-tool mix-up).
