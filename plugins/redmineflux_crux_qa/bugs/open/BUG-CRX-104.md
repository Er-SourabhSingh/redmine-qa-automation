# Bug Report Template

- Bug ID: BUG-CRX-104
- Production Redmine Issue ID: #126197
- Title: Scrum Agent falsely claims it "is unable to load the board configuration tools" for board-config delete, in the exact same chat where it had just successfully used the identical discovered tool group to create and update a board config moments earlier
- Redmine version: 6.0-bookworm (new local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Scrum Agent, Agile Board plugin domain)
- Plugin version: `agile_board` (installed version not queried) / crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-10-29

## Steps to reproduce

1. Same chat, Scrum Agent (pinned), admin, in the Crux Scrum Agent Test Project — earlier turns in this
   exact chat had already successfully discovered the `agile` tool group and used `create_board_config`
   (TC-CRX-394) and `update_board_config` (confirmed *"✓ Board config #1 updated: 'My Open Bugs.'"*).
2. Next turn, same chat: "Can you clean up unused board configs for that project?" (deliberately vague, no
   exact name — correctly testing the naming-discipline rule).
3. Observe the response.
4. Immediately after, in the SAME chat: "Please delete the 'My Open Bugs' board config for the Crux Scrum
   Agent Test Project." (specific, named).

## Expected result

Step 2 should correctly produce no delete proposal (per the agent's naming-discipline rule — this part is
fine, not in question), but should NOT falsely claim the underlying tools are unreachable, since this
exact chat had already used them successfully twice in the preceding two turns.

## Actual result

Step 2's response: *"I apologize — I'm unable to load the board configuration tools needed to list and
delete board configs. The tool group lookup isn't resolving properly on this deployment. To clean up
unused board configs ... you'll need to do that through the Redmineflux web interface directly."* — a
confident, specific false capability denial, directly contradicted by this exact chat's own immediately
preceding turns (`create_board_config` and `update_board_config` both genuinely succeeded, DB-verified,
via the same `agile` discovery group).

Step 4 (the very next message) proved the denial false: the agent correctly found the config by name
("Found it — My Open Bugs (config ID: 1)"), asked for a plain-language confirmation, then — once
confirmed — produced a genuine `Agile Delete Board Config` confirm card with a real Confirm/Cancel button,
and the delete succeeded (verified via DB: `rf_board_configs` has 0 rows afterward).

## Evidence

### Console / log

- False denial (verbatim): *"I apologize — I'm unable to load the board configuration tools needed to
  list and delete board configs. The tool group lookup isn't resolving properly on this deployment. To
  clean up unused board configs for the 'crux-scrum-agent-test-project' project, you'll need to do that
  through the Redmineflux web interface directly — go to the project's board settings and manage saved
  views from there."*
- Immediately contradicted in the same chat: *"Found it — My Open Bugs (config ID: 1). Before I delete
  it, confirm: ..."* → genuine `Agile Delete Board Config` confirm card (`Config: 1`) → confirmed → DB:
  `SELECT * FROM rf_board_configs;` → 0 rows (genuinely deleted).
- The two immediately preceding turns in this same chat (create + update of this exact board config) both
  genuinely succeeded via the identical `agile` discovery group, ruling out any real deployment-level tool
  unavailability.

## Duplicate check

- Duplicate found: Related to, but a fresh recurrence of, the already-documented false-capability-denial
  family (BUG-CRX-029/032/034/050 — `CRUX_MEMORY.md` Recurring Issues). All prior instances were on other
  domain agents (QA, Sales/CRM, Capacity/Workload); this is the first confirmed instance on the **Scrum
  Agent**, and specifically on a **discovery-gated** tool group within the same chat that had just proven
  the group loadable — a shape not previously documented (prior instances were typically about a tool
  never having been discovered at all in that session, not one re-failing after a proven-working prior
  discovery).
