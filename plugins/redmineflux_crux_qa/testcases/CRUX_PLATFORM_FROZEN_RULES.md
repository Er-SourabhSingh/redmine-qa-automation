# Test Suite — Crux Platform: Frozen Rules

> Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §10. Plugin: redmineflux_crux. Redmine 6.0-bookworm,
> localhost:3015. URL: `/crux/admin/frozen_rules` (admin only).
> TC range: TC-CRX-921 to TC-CRX-938.

## Fixtures needed

- A ticket matching a rule scoped narrowly (one specific ticket id), and a different ticket matching a broader
  rule (tracker+project combination), for scope-precision checks.
- An agent (or Work Package) with `autonomous` autonomy, specifically to prove a frozen rule overrides even the
  highest autonomy level.
- A gate-approved Work Package, to prove a frozen rule overrides even an already-approved gate.
- A ticket NOT matching any rule, as a control.

## Positive Cases — Browse & Create

- **TC-CRX-921** — Table shows Rule (a real sentence), Reason, Frozen by, and a Delete button with the confirm
  text "Agents can change these tickets again straight away".
- **TC-CRX-922** — + Freeze something — scoped by field only: create a rule freezing just the `status` field for a
  specific tracker (e.g. Bug), leaving Project/ticket id blank. Confirm the generated rule sentence correctly
  reads something like "Agents can't change the status field on issues with tracker Bug...".
- **TC-CRX-923** — + Freeze something — scoped by one ticket id: create a rule using "#<id>" for One ticket id,
  leaving other scope fields blank. Confirm it applies only to that exact ticket.
- **TC-CRX-924** — + Freeze something — scoped by project: create a rule scoped to a specific project (by
  identifier or name) with no tracker/ticket — confirm it applies project-wide.
- **TC-CRX-925** — All-blank scope triggers the extra confirm: leave every scope field blank (Object type/
  Tracker/Project/ticket id all empty) — confirm a red "Freeze every ticket?" extra confirmation appears before
  the rule can be saved, and cancelling it does not create the rule.
- **TC-CRX-926** — Reason is required and capped: attempt to save with an empty Reason (rejected), then with a
  Reason longer than 300 characters (rejected or truncated — verify which).

## Positive Cases — Enforcement

- **TC-CRX-927** — A frozen field blocks a chat-confirmed write: freeze `priority` on a specific ticket, then ask
  an agent to change that ticket's priority via chat — confirm the write is genuinely refused (native-verify the
  priority is unchanged), with a clear reason shown, not a silent success or a generic error.
- **TC-CRX-928** — A frozen ticket gets NO @-mention reply at all: freeze the whole ticket (or its `notes` field),
  post an `@crux status` comment on it — confirm no reply is posted at all, not even an honest "I can't modify
  this" reply.
- **TC-CRX-929** — A frozen field does NOT block queue claim notes or result notes on an UNFROZEN field: freeze
  only `priority` on a ticket, confirm an agent can still pick it up from the Ready queue and post claim/result
  notes normally (only the frozen field itself is blocked, not the whole ticket, unless the whole ticket is
  frozen).
- **TC-CRX-930** — Autonomy `autonomous` does NOT override a frozen rule: set an agent/Work Package to the highest
  autonomy level, confirm a frozen field on its tickets is STILL blocked — "nothing overrides a rule" per the
  dev reference.
- **TC-CRX-931** — An already-approved gate does NOT override a frozen rule: approve all of a Work Package's
  gates, then confirm a frozen field on its tickets is still blocked for any subsequent agent write.
- **TC-CRX-932** — A rule frozen on `status` does NOT block an @-mention reply: freeze only the `status` field
  (not the whole ticket), post an `@crux status` comment — confirm a reply IS posted (since a reply only writes
  notes, which isn't the frozen field), distinguishing this from TC-CRX-928's whole-ticket-freeze case.
- **TC-CRX-933** — Delete a rule immediately unfreezes: delete an active rule, then immediately retry the
  previously-blocked write — confirm it now succeeds, with no delay or caching of the old frozen state.

## Negative / Boundary Cases

- **TC-CRX-934** — Invalid project reference is rejected: enter a nonexistent project identifier/name — confirm a
  clear "no such project" message, not a silently-created rule that never matches anything.
- **TC-CRX-935** — Invalid tracker reference is rejected: enter a nonexistent tracker name — confirm a clear "no
  such tracker" message.
- **TC-CRX-936** — Invalid field name is rejected: the Field dropdown should be a closed list (status, notes,
  assigned_to, priority, subject, description, done_ratio, tracker, category, fixed_version, parent_issue,
  start_date, due_date, estimated_hours, is_private) — confirm no free-text field-name injection is possible.
- **TC-CRX-937** — Non-admin cannot reach this page at all, regardless of Crux permissions held (cross-reference
  TC-CRX-721).
- **TC-CRX-938** — Humans clicking in native Redmine are never affected: with a field frozen via Crux, confirm a
  human user can still edit that exact field directly in Redmine's own native issue-edit form — frozen rules
  bind agents only, never humans.

## Suite status

Drafted 2026-11-05, not yet executed. Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §10.
