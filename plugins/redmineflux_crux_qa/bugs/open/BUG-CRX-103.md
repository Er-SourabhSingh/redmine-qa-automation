# Bug Report Template

- Bug ID: BUG-CRX-103
- Production Redmine Issue ID: #126196
- Title: Scrum Agent's "Create/Update Board Config" writes `filters` in a flat `{field: value}` shape that crashes the native Agile Board page with a 500 error the moment that saved board config is ever opened — the agent reports "✓ ... updated successfully" for data it will never be possible to actually use
- Redmine version: 6.0-bookworm (new local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Scrum Agent, Agile Board plugin domain)
- Plugin version: `agile_board` (installed version not queried) / crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-10-29

## Steps to reproduce

1. Fresh chat, Scrum Agent (pinned), admin, in the Crux Scrum Agent Test Project: "can you create a saved
   board view called 'My Open Bugs', grouped by priority, filtered to only show open Bug-tracker issues?"
   — confirm card correctly showed `Filters: {'status': 'open', 'tracker': 'Bug'}`. Confirmed; DB-verified
   `rf_board_configs` row created with exactly that `filters` value (TC-CRX-394, previously marked PASS —
   see note below, this is a correction, not a fresh regression).
2. Later turn, same chat: "can you update the 'My Open Bugs' saved board view to group by assignee
   instead of priority?" — confirm card correctly showed `Group By: assignee`, `filters` left unmentioned.
   Confirmed: *"✓ Board config #1 updated: 'My Open Bugs.'"* DB-verified `group_by` genuinely changed to
   `assignee`, `filters` genuinely preserved untouched — this specific write mechanics is correct.
3. Open the saved board config the way the native UI actually surfaces it: `Administration`-adjacent
   project page `/projects/crux-scrum-agent-test-project/board_configs` (the real index page) → click
   "My Open Bugs" → navigates to `/projects/crux-scrum-agent-test-project/agile_board?board_config_id=1`.

## Expected result

The Agile Board page should load with the saved config's grouping/filters applied (per
`rf_boards_controller.rb`'s own `needs_redirect`/filter-application logic, which exists specifically to
read a `board_config_id` param and re-derive the correct board state from it).

## Actual result

The page returns a genuine **HTTP 500 Internal Server Error** — confirmed via server logs:

```
TypeError (no implicit conversion of Symbol into Integer):
plugins/agile_board/app/controllers/rf_boards_controller.rb:773:in `[]'
plugins/agile_board/app/controllers/rf_boards_controller.rb:773:in `block in index'
plugins/agile_board/app/controllers/rf_boards_controller.rb:771:in `each'
plugins/agile_board/app/controllers/rf_boards_controller.rb:771:in `index'
```

**Root cause, confirmed via source on both sides:**

- `rf_boards_controller.rb` (lines 771-774) expects each `filters` entry to be a **nested hash per
  field**: `@board_config.filters.each do |field, filter_data| ... filter_data[:operator] ...
  filter_data[:values] ...` — i.e. the real shape is `{"status": {"operator": "...", "values": [...]}}`.
- The native "New/Edit Board Config" form (`app/views/rf_board_configs/_filters.html.erb`) genuinely
  builds filters in exactly that nested shape (`options[:operator]`, `options[:values]`, submitted as
  `op[field]`/`v[field][]`), so a board config **created through the native UI would not hit this crash**.
- The Scrum Agent's `create_board_config`/`update_board_config` MCP tools instead write a **flat**
  `{field: value}` shape — confirmed via DB (`filters = {"status":"open","tracker":"Bug"}`, a plain string
  value per key, not a nested `{operator, values}` object). When the controller's redirect logic calls
  `filter_data[:operator]` on that plain string (`"open"[:operator]`), Ruby's `String#[]` rejects a Symbol
  index with exactly the `TypeError` seen above.

This means **every single board config ever created or updated via the Scrum Agent crashes the instant
anyone (the same chat user, a teammate, or the agent itself on a later read) tries to actually open it** —
the feature is a complete dead end via chat, even though the chat's own write mechanics (which field
changed, which stayed preserved) are internally correct per TC-CRX-394/395's own narrow checks. The agent
reported genuine, unqualified success ("✓ ... updated successfully") for data that can never actually be
used.

## Evidence

### Console / log

- Native board-config index page (`/projects/crux-scrum-agent-test-project/board_configs`) correctly
  lists "My Open Bugs" (Kanban board, "to me only") and links to
  `/projects/crux-scrum-agent-test-project/agile_board?board_config_id=1`.
- Opening that link: `GET .../agile_board?board_config_id=1` → `Completed 500 Internal Server Error in
  14ms` → `TypeError (no implicit conversion of Symbol into Integer)` at
  `rf_boards_controller.rb:773`, inside the `filters.each` block (quoted above).
- DB: `rf_board_configs.filters` for config #1 = `{"status":"open","tracker":"Bug"}` (flat values) —
  confirmed does NOT match the nested `{field: {operator, values}}` shape the controller's own filter-
  redirect logic requires, and which the native create/edit form (`_filters.html.erb`) genuinely produces.

## Duplicate check

- Duplicate found: No. First finding on the Board Config feature's actual usability (TC-CRX-394/395's
  earlier checks only verified the write itself persisted correctly — they never opened the resulting
  config, which is the step that reveals this defect). Distinct from every other bug in this suite — this
  is a data-shape/format mismatch between what the MCP tool writes and what the plugin's own render path
  requires, not a wrong-ID resolution, wrong-project substitution, or misleading-success-text pattern,
  though it shares the latter's "confident ✓ for something that doesn't actually work" flavor.
