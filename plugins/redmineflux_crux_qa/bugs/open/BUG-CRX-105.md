# Bug Report Template

- Bug ID: BUG-CRX-105
- Production Redmine Issue ID: #126191
- Title: Scrum Agent has no tool anywhere to set Story Points on an issue — a core Scrum/Agile concept the agent's own domain is built around, not a peripheral field
- Redmine version: 6.0-bookworm (new local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Scrum Agent, Agile Board plugin domain)
- Plugin version: `agile_board` (installed version not queried) / crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-10-29

## Steps to reproduce

1. Enable Story Points at `Administration → Plugins → Redmineflux Agile Board → Configure` ("Enable Story
   Points" checkbox, plus "Story Point Values" set to a real Fibonacci list `0, 1, 2, 3, 5, 8, 13, 21`) —
   confirmed genuinely instance-wide: Board Settings panel gains a real "Story Points" option under both
   Visible Card Fields and Show Totals.
2. Fresh chat, Scrum Agent (pinned), admin, in the Crux Scrum Agent Test Project: "can you set the story
   points on card #15 to 5?"
3. Confirm card resolves correctly (`Issue: #15`, `Field: story_points`, `Value: 5`) — confirming fails
   with: *"Error: field 'story_points' is not editable via this endpoint. Allowed fields: assigned_to_id,
   category_id, done_ratio, fixed_version_id, is_private, priority_id, sprint_craft_id, tracker_id or
   custom_field_N."*
4. **Contrast test, same chat, same tool family:** "can you assign card #16 to the 'Scrum Sprint Fixture
   1' sprint?" — a genuinely different Scrum concept (`redmineflux_agile_update_backlog_issue`'s
   `sprint_id` param) — this one works correctly end-to-end: confirm card resolved `Sprint: 1` by name,
   confirmed, DB-verified `issues.sprint_craft_id` for #16 is now `1`.

## Expected result

Sprint assignment and Story Points are both foundational, day-to-day Scrum ceremonies — not one-time admin
setup like Run Type or board column configuration. A Scrum Agent whose entire reason for existing is
"backlog and board work" (per its own persona description: *"the natural address for backlog and board
work"*) should be able to set story points on an issue, the same way it can assign that issue to a sprint.

## Actual result

Sprint assignment works (contrast test above, step 4 — confirms the agent's write-tool mechanics are
otherwise sound). **Story Points cannot be set through any tool the Scrum Agent has, static or
discoverable.** Checked all 3 candidate write tools in `redmineflux-mcp/src/tools/agile.py`:

- `redmineflux_agile_update_issue_field` — hardcoded `allowed` set explicitly excludes `story_points`
  (only `assigned_to_id, tracker_id, priority_id, category_id, fixed_version_id, done_ratio, is_private,
  sprint_craft_id` are permitted, plus `custom_field_N`).
- `redmineflux_agile_update_card` — only edits subject/description.
- `redmineflux_agile_update_backlog_issue` — only moves sprint_id/version_id.

`story_points` is confirmed to be a real, native column on `issues` (not a custom field — `custom_field_N`
is not an applicable workaround), genuinely enabled and rendering on cards/totals once the admin setting is
on, with a real configured value list (`0, 1, 2, 3, 5, 8, 13, 21`) meant to drive an editing dropdown. There
is simply no code path from any Scrum Agent tool to that column at all — this is a complete, structural
feature gap in a core Scrum capability, not a minor unsupported edge-case field (contrast with Run Type on
the QA Agent suite's own BUG-CRX-099 precedent, which concerns a one-time admin/setup field, not a
per-sprint ceremony).

## Evidence

### Console / log

- Error (verbatim): *"Error: field 'story_points' is not editable via this endpoint. Allowed fields:
  assigned_to_id, category_id, done_ratio, fixed_version_id, is_private, priority_id, sprint_craft_id,
  tracker_id or custom_field_N (e.g. custom_field_5)."*
- Retested after the admin "Story Point Values" field was populated with a real Fibonacci list — identical
  error, confirming that config field only drives the native issue-edit dropdown's displayed options, not
  the MCP tool's own hardcoded whitelist.
- DB: `issues.story_points` for #15 remains `NULL` after 2 confirmed attempts.
- Contrast (sprint assignment, same session): `issues.sprint_craft_id` for #16 genuinely changed `NULL →
  1` via `redmineflux_agile_update_backlog_issue`, confirming the agent's write path and confirm-gate work
  correctly in general — this is specifically a missing field on `update_issue_field`, not a broader write
  defect.
- Source: `redmineflux-mcp/src/tools/agile.py`, `redmineflux_agile_update_issue_field`'s `allowed` set
  (lines ~1823-1826).

## Duplicate check

- Duplicate found: No new root cause vs. the originally-documented TC-CRX-396 finding (same underlying
  missing-field gap) — but **this file replaces that finding's "not a bug" classification**. On reflection
  (explicit user pushback: "sprint ya story point update karna to possible hona chahiye, kyunki ye agile ka
  feature hai"), Story Points is core to the Scrum Agent's own stated domain, not a peripheral
  one-time-setup field like Run Type (BUG-CRX-099, QA Agent) — the distinction this repo has used to decide
  "honest gap, not a bug" doesn't hold here. Filed as a genuine feature-gap bug.
