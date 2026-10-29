# Bug Report Template

- Bug ID: BUG-CRX-101
- Production Redmine Issue ID: #126194
- Title: Scrum Agent's "Agile Create Column" confirm card silently targets a stale project from an earlier turn in the same chat, instead of the project explicitly named in the current message
- Redmine version: 6.0-bookworm (new local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Scrum Agent, Agile Board plugin domain)
- Plugin version: `agile_board` (installed version not queried) / crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-10-29

## Steps to reproduce

1. Fresh chat, Scrum Agent (pinned), admin. First message established **Crux Scrum Agent Test Project**
   (project id 4) as the chat's working project (board read, card move, sprint-cleanup negative check —
   all correctly scoped to project 4 throughout).
2. Attempted to create a new board column ("Blocked") in that same chat — hit a real `Wip limit must be
   greater than 0` validation error on the first attempt (column create's confirm card never surfaces a
   WIP-limit field by default; a genuine, honest server-side rejection, not a bug on its own).
3. Replying "Set the WIP limit to 5 for that column" triggered the already-known self-contradiction
   pattern (BUG-CRX-085's shape — *"I described a change without actually proposing it, so there's
   nothing to confirm yet"* — not re-filed here, already a known recurring class, see
   `CRUX_MEMORY.md`).
4. Sent a single fully-explicit retry in the same chat: *"Please create the 'Blocked' column for the
   **Crux Scrum Agent Test Project** mapped to the 'Waiting for Customer Response' status with a WIP
   limit of 5."* — the project is named explicitly, by its exact display name, in this exact message.

## Expected result

Per the persona's own stated rule (and the repo-wide rule proven on other domain agents, e.g.
BUG-CRX-080/093): the project named in the CURRENT message always wins. The confirm card should target
**Crux Scrum Agent Test Project** (id 4) — the project this entire chat had been operating on, and the
one named again explicitly in this very message.

## Actual result

The resulting confirm card read: `Project: Crux PM Agent Test Project`, `Name: Blocked`, `Status Ids:
[1]`, `Wip Limit: 5` — **a completely different, unrelated fixture project** ("Crux PM Agent Test
Project," from an entirely different test suite, never mentioned anywhere in this chat) was silently
substituted for the explicitly-named "Crux Scrum Agent Test Project." Confirming this card (done as part
of this investigation, to observe the outcome) was itself rejected by a genuine permission check — *"You
do not have permission to edit board settings"* — so no column was actually created in either project
(verified via DB: `rf_board_columns` for both project 1's board and project 4's board show only the 5
original default columns, no "Blocked" row anywhere). The wrong-project substitution itself is the
defect; the permission rejection is an unrelated, lucky accident that prevented a bad write this time —
had admin genuinely held `manage_agile_board_settings` on the PM project (a very plausible permission
state for an admin-equivalent user), this would have silently created a "Blocked" column in the wrong
project with no error at all.

## Evidence

### Console / log

- Confirm card (verbatim): `Project: Crux PM Agent Test Project`, `Name: Blocked`, `Status Ids: [1]`,
  `Wip Limit: 5`.
- Permission rejection (verbatim): *"You do not have permission to edit board settings To fix this, ask
  your Redmineflux administrator to: • Grant you the required role/permission for this action • Check:
  Administration → Roles and Permissions → [your role]"*
- DB verification (`rf_board_columns` joined to `rf_agile_boards`): project 1 (PM) and project 4 (Scrum)
  both show exactly their 5 original default columns (new/In progress/QA/Waiting for Customer
  Response/Done) — no "Blocked" column exists on either project's board.
- This chat's own prior turns all correctly operated on project 4 (board read, card #15 move to QA
  verified via DB `status_id=4`, sprint-delete negative check) — confirming the wrong-project
  substitution appeared specifically on this later discovery-gated write call, not throughout the whole
  chat.

## Duplicate check

- Duplicate found: Related to, but not a duplicate of, **BUG-CRX-080** (the original "long chat reuses an
  earlier turn's project" finding, Testcase-Management domain, write tools, fixed via `field_check`) and
  **BUG-CRX-093** (the same root cause recurring on Testcase-Management *read* tools, outside BUG-CRX-080's
  fix scope). This is a **fresh recurrence of the identical defect class on a third domain — the Scrum
  Agent / Agile Board plugin — on a *discovery-gated* write tool (`create_column`) specifically**, which
  BUG-CRX-080's `field_check` coverage may not extend to since discovery-group tools are resolved
  differently from the always-loaded static tool list. Kept as its own bug file per this repo's standing
  rule (one bug = one file per plugin domain, even when root cause classes match) — see
  `bugs/_duplicates.md` for the equivalent BUG-CRX-094/096 precedent.
