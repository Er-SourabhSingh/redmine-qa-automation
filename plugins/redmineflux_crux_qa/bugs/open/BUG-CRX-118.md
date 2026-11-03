# Bug Report Template

- Bug ID: BUG-CRX-118
- Production Redmine Issue ID: #126688
- Title: Time Agent silently drops explicit per-level approval schema descriptions at creation time, with no disclosure until a later, unrelated update request reveals the limitation
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Time Agent)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: `admin`
- Date: 2026-10-30

## Steps to reproduce

1. As `admin`, in a chat pinned to the Time Agent, ask: "Create a new approval schema named 'Crux QA Schema' with description 'QA test schema for schema CRUD testing', with two levels: level 1 approver role Manager with description 'First check', level 2 approver role Developer with description 'Final check'."
2. Confirm the proposed `Timesheet Schema Create` write when prompted.
3. Open the created schema natively at `/approval_schemas/2` (Show page), then `/approval_schemas/2/edit` (Edit modal) and inspect the per-level "Description (Optional)" fields.
4. Separately, in the same chat, later ask the agent to update the schema and set level 1's description to "First check updated".

## Expected result

- The per-level descriptions explicitly requested at creation ("First check" / "Final check") should either be saved as given, or the agent should tell the user at creation time that level descriptions cannot be set/stored by this tool.

## Actual result

- At creation, the agent proposed and confirmed the write with no mention that level descriptions were unsupported or would be dropped; the "created" confirmation gave no warning.
- On the schema's native Show page, levels render with the plugin's own generic placeholder text ("Approval by Manager" / "Approval by Developer") instead of the requested descriptions.
- On the native Edit Schema form, the "Description (Optional)" textbox for both levels is genuinely **empty** — confirming the descriptions were never persisted, not just hidden on the Show page.
- The limitation was only ever disclosed **later**, when a separate update request was made ("set the level 1 description to 'First check updated'"), at which point the agent correctly said: *"the schema management tools available to me do **not** include a way to update individual level descriptions after creation... level descriptions are set only at schema creation time and cannot be edited afterward."* This statement is itself inconsistent with the create-time behavior, where no such value was ever actually stored in the first place — the agent's own understanding of its tool's behavior is incorrect/inconsistent between the create and update code paths.
- Net effect: a user who explicitly specifies per-level descriptions at creation time gets silent data loss with zero feedback, and only discovers the limitation if they separately try to edit the schema afterward.

## Evidence

### Console / log

- Chat confirm table at creation time showed only `Description` (schema-level), `Name`, `Level Roles`, `Active` — no per-level description field was ever surfaced in the confirm table despite being explicitly requested in the prompt.
- Native Edit Schema form (`/approval_schemas/2/edit`) snapshot: both level rows' "Description (Optional)" textboxes confirmed empty.
- Later update-attempt response (quoted above) confirming the agent's own stated understanding that level descriptions are "immutable after schema creation in this plugin" — contradicted by the fact they were never set at creation either.

## Duplicate check

- Duplicate found: No — distinct from BUG-CRX-110 (team-member request silently dropped when bundled with project creation) in trigger (schema level descriptions, not team membership) and distinct from BUG-CRX-116 (zero-level validation mismatch), though both share the general "Time Agent silently accepts a request it cannot actually fulfill" pattern seen elsewhere in this plugin family (e.g. BUG-CRX-110, BUG-CRX-114).

## Retest — 2026-11-02 — STILL OPEN (not fixed)

Developer commits (CRC-72/73 range) pulled + containers restarted. Re-ran as `admin`, Time Agent, fresh chat: same
multi-level description request ('Crux Retest 118 Schema', level 1 Manager/"First check", level 2
Developer/"Final check"). The confirm card now shows `Description: First check, Final check` (concatenated into
the schema-level description — an improvement over the original's complete silence, but still not what was
asked: per-level descriptions). Confirmed (ID 6). Native Show page (`/approval_schemas/6`) still renders both
levels with the generic placeholder text ("Approval by Manager" / "Approval by Developer"), and the native Edit
form's per-level "Description (Optional)" textboxes are confirmed genuinely empty for both levels. **Not fixed** —
per-level descriptions are still never persisted; the only change is that the concatenated text now surfaces
somewhere (the schema-level Description) instead of being silently dropped entirely.

## Retest — 2026-11-03 (after discovering crux-core/mcp were running a stale image all this time) — FIXED

Round 2's retest above was against a stale image (`docker compose restart` never actually rebuilds `crux-core`/
`mcp`). After a genuine `docker compose up -d --build --force-recreate crux-core mcp`, re-ran as `admin`, Time
Agent pinned, fresh chat: same request shape ('Crux Retest 118 Round4 Schema', description 'QA retest schema',
level 1 Manager/"First check", level 2 Developer/"Final check"). The confirm card now shows a genuine structured
`Levels` field: `[{'role_id': 4, 'description': 'First check'}, {'role_id': 3, 'description': 'Final check'}]` —
real per-level description fields, not a schema-level concatenation. Confirmed — *"✓ Approval schema 'Crux Retest
118 Round4 Schema' created (ID: 8, Active). Levels: Level 1: Manager — First check Level 2: Developer — Final
check."* Native Show page (`/approval_schemas/8`) confirms both levels genuinely display their real descriptions
("Manager — First check", "Developer — Final check"), not the generic placeholder text. **Confirmed fixed.**
