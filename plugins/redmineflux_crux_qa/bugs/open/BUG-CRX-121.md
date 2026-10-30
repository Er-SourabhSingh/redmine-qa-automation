# Bug Report Template

- Bug ID: BUG-CRX-121
- Production Redmine Issue ID: #126693
- Title: Time Agent falsely claims approval schema level descriptions AND level approver roles are "immutable after creation" and can only be changed by delete+recreate — both are genuinely editable via the native Edit Schema form, proven by actually changing a level's role live
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Time Agent)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: `admin`
- Date: 2026-10-30

## Steps to reproduce

1. As `admin`, with an existing 2-level approval schema (e.g. "Crux QA Schema Updated", ID 2, level 2 = Developer), in a chat pinned to the Time Agent, ask: "Update the approval schema 'Crux QA Schema Updated' - change its description to 'Updated description for full CRUD test' and change level 2's approver role from Developer to Reporter."
2. Observe the agent's response.
3. Separately, as `admin`, open the native Edit Schema form at `/approval_schemas/2/edit`, change level 2's "Approver Role" dropdown from "Developer" to "Reporter", and click "Update Schema".
4. Observe the schema's Approval Flow section on its Show page afterward.

## Expected result

- The agent's claim about what is and isn't editable should match the plugin's actual, real capabilities. If level roles genuinely cannot be changed after creation, the native UI should also refuse/not offer this; if the native UI allows it, the agent should not claim otherwise.

## Actual result

- The agent responded: *"the schema management tools available to me do **not** include a way to change a level's approver role after creation. Levels are set only at schema creation and cannot be edited afterward — to change level 2's approver from Developer to Reporter, you would need to delete and recreate the schema."* It offered to update only the description.
- This claim is **false**. On the native Edit Schema form, the "Approver Role *" dropdown for an existing level is a fully enabled, selectable combobox (not disabled) with the current role pre-selected and other roles available. Changing Level 2's role from "Developer" to "Reporter" and clicking "Update Schema" genuinely persisted — confirmed on the schema's Show page afterward: "Approval Flow — Level 2: Reporter, Approval by Reporter" (previously "Developer, Approval by Developer").
- This is the same root pattern as BUG-CRX-118 (per-level descriptions, also claimed "immutable after creation" and also genuinely editable via the native Edit form — same Edit Schema form, same "Description (Optional)" per-level field) — but is more severe here because changing the agent's own asserted limitation to a verified fact shows the agent is not merely under-capable, it is **actively stating something false** about the plugin's real behavior, which could mislead a user into unnecessarily deleting and recreating a schema (losing its "Used In Contexts" assignments and ID) when a simple edit would have sufficed.
- Root cause (consistent with BUG-CRX-118): the Time Agent's `schema_update` tool exposes only `name` and `description` fields and has no parameter for per-level role/description changes — but the agent's own explanation describes this as an inherent plugin constraint rather than a limitation of its own tool surface, which is incorrect.

## Evidence

### Console / log

- Chat response (quoted above) asserting level roles are "immutable after creation" and "cannot be edited afterward."
- Native Edit Schema form (`/approval_schemas/2/edit`) snapshot: Level 2's Approver Role combobox confirmed enabled, not disabled, with "Reporter" selectable alongside "Manager (already used)" (disabled only because Level 1 already uses it) and "Developer" (the then-current selection).
- Post-edit Show page (`/approval_schemas/2`) snapshot confirming the change persisted: "Level 2 — Reporter, Approval by Reporter" (was "Developer, Approval by Developer").

## Duplicate check

- Duplicate found: No new root cause — shares the exact same underlying gap as **BUG-CRX-118** (per-level description immutability claim, also disproven by the same native Edit form), but is filed separately because it demonstrates the stronger, independently-reproduced claim that level **roles** (not just descriptions) are also falsely declared unchangeable, confirmed via an actual live edit-and-verify rather than just an empty field inspection. Kept as its own bug per this repo's one-bug-per-concrete-finding convention, while noting in both bug files that they share one root cause (an incomplete `schema_update` tool whose limitations the agent mis-describes as plugin-level constraints).
