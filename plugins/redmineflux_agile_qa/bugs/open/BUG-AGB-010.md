# BUG-AGB-010

- Bug ID: BUG-AGB-010
- Production Redmine Issue ID: #120986 (ztflux, assigned to Prashant Chaurasia, reported 2026-09-21)
- Title: A `query_id` parameter on the Agile Board / Backlog controller crashes with a 500 (FrozenError on a frozen string literal) — not reachable via any current UI link
- Redmine version: 7.0.0
- Plugin name: Redmineflux Agile Board
- Plugin version: 7.0.0 (branch `feature/backlog-sprint-points`, commit `288d293`)
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Browser: Chrome (Playwright MCP), 1920×1080
- User role: Admin
- Date: 2026-09-21
- Severity: Medium (downgraded from an initial High — see "UI reachability" in Notes: no in-app link or
  button currently constructs the URL that triggers this)
- Found during: regression pass on Feature #120436, as a side-finding while checking TC-AGB-541's premise
  (that TC was itself marked N/A — the feature it describes isn't built; see the testcase file and Notes below)
  (production testcase #120941)

## Summary

Every Agile Board controller action that accepts a `query_id` parameter (project Kanban board, Backlog, and —
by the same shared code path — Global board and My Page block) crashes with an unhandled 500 the moment a
saved query is used. The crash is a Ruby `FrozenError`, not an application-level validation failure, so it
cannot be worked around from the UI: any saved-query link, bookmark, or "load a saved query" action on any of
these surfaces returns a broken page.

## Steps to reproduce

> **Reachability note (added after review):** there is **no button or link in the current UI** that produces a
> `query_id`-carrying URL for the Backlog or Agile Board pages. Steps 3–4 below require manually constructing
> the URL — this was not found through real navigation. See "UI reachability" under Notes for what was actually
> checked and why the crash is still worth fixing despite that.

1. Create or reuse a saved query with any filter, e.g. Status = closed (Issues → filter → Save, visibility
   "to me only" is enough).
2. Note the query's id (visible in the URL as `?query_id=N` once opened from Issues — Redmine shows it in the
   project sidebar's "My custom queries" list, but that link only ever points at `issues?query_id=N`).
3. Manually edit the URL to open the project's Backlog with that same query id attached:
   `.../projects/<id>/backlog?query_id=N`.
4. Separately, manually edit the URL to open the project's Agile Board (Kanban) the same way:
   `.../projects/<id>/agile_board?query_id=N`.

## Expected result

- A well-formed request with a valid `query_id` and a valid project either applies the query and renders the
  page, or is refused cleanly (e.g. 404/403 if the query or project isn't valid) — not an unhandled 500 either
  way.

## Actual result

- Both requests return **500 Internal Server Error** ("Internal error" page). Confirmed reproducible on repeat
  attempts, not a one-off — every request with `query_id` present fails identically.

## Root cause (from server log / stack trace)

```
FrozenError (can't modify frozen String: "project_id IS NULL"):
plugins/agile_board/app/controllers/rf_boards_controller.rb:1596:in 'RfBoardsController#retrieve_rf_agile_query'
plugins/agile_board/app/controllers/rf_boards_controller.rb:505:in 'RfBoardsController#backlog'
```

`rf_boards_controller.rb` carries `# frozen_string_literal: true` at the top of the file (line 1). Its
`retrieve_rf_agile_query` method (line ~1593) does:

```ruby
if !params[:query_id].blank?
  cond = "project_id IS NULL"
  cond << " OR project_id = #{@project.id}" if @project   # <- mutates a frozen literal
  @query = RfAgileBoardQuery.where(cond).find(params[:query_id])
  ...
```

`cond` is a string **literal**, which the file's own magic comment freezes at parse time. `cond <<` attempts
to mutate it in place, which raises `FrozenError` under Ruby's frozen-string-literal semantics (confirmed on
this instance's Ruby 4.0.6). This is not conditional on plugin settings, project state, or story points at
all — it fires purely from `params[:query_id]` being present, before any of the method's own business logic
runs.

`retrieve_rf_agile_query` is called from **10 separate action entry points** in this controller (grep count),
covering at minimum the project Kanban board, the Backlog (both tabs), and — sharing the same before-action —
almost certainly the Global Agile Board and My Page block as well, since they route through the same
controller. Confirmed directly for two of them (Backlog, project Kanban board); the rest share the identical
code path and would fail the same way.

## Impact

Any request that reaches these actions with `query_id` set crashes hard — not degraded, not silently ignoring
the filter, with no in-page recovery (only "Back" is offered). This is **not** the direct cause of TC-AGB-541
being untestable — that TC was marked N/A because the UI feature it describes was never built, independent of
this crash (see the testcase file). This bug is a separate, code-level finding surfaced while checking that
TC's premise. Confirmed reachable paths:
- Anyone who copies the `query_id` pattern from the adjacent Issues tab's URL onto the Backlog or Agile Board
  tab (the three are sibling project tabs; the parameter name and id are identical, so this is not an
  unreasonable thing for a technical user to try).
- Any external caller (API client, bookmark, saved link shared between teammates, or a future UI feature) that
  constructs a `.../backlog?query_id=N` or `.../agile_board?query_id=N` URL — the controller code treats
  `query_id` as a first-class, intentionally-handled parameter (see "UI reachability" below), so this is a
  supported input shape from the code's own perspective even though no current view links to it.

**Not confirmed reachable via any button or link in the shipped UI** — see Notes. This is why severity was
revised down to Medium after the initial filing: no data loss, no confirmed UI-driven reachability, and a
workaround exists (`set_filter=1` with explicit `f[]`/`op[]` params instead of `query_id`). The defect itself
— an unconditional crash on well-formed, intentionally-accepted controller input — is still real and worth
fixing, particularly if `query_id` is ever wired into a future UI element or is already used by an external
caller (API client, MCP tool) this session didn't check.

## Evidence

### Screenshot — 500 on Backlog via saved query

![Backlog 500 error when opened via a saved query](../../screenshots/BUG-AGB-010/backlog-500-via-saved-query.png)

### Server log / stack trace

```
I, [...] Started GET "/projects/test-project/backlog?query_id=13" for 172.19.0.1
I, [...] Processing by RfBoardsController#backlog as HTML
I, [...] Parameters: {"query_id" => "13", "project_id" => "test-project"}
I, [...] Completed 500 Internal Server Error in 27ms
F, [...] FATAL --
FrozenError (can't modify frozen String: "project_id IS NULL"):
plugins/agile_board/app/controllers/rf_boards_controller.rb:1596:in 'RfBoardsController#retrieve_rf_agile_query'
plugins/agile_board/app/controllers/rf_boards_controller.rb:505:in 'RfBoardsController#backlog'
lib/redmine/sudo_mode.rb:78:in 'Redmine::SudoMode::Controller#sudo_mode'
```

Reproduced twice on the Backlog action and once on the project Agile Board (Kanban) action, all with the
identical `FrozenError` shape (differing only by the calling line: 505 for `backlog`, the equivalent line for
`index`/`board`, etc.).

## Notes

- **UI reachability, checked explicitly — and the feature it would have belonged to isn't built.** Searched
  every `.erb` view under `app/views/rf_boards/` and the controller itself for any link containing `query_id`:
  none exists. The project Issues page's own sidebar ("My custom queries" / "Custom queries") is the only
  in-app place `query_id` links are generated, and every one of those points at `issues?query_id=N`, never at
  `backlog` or `agile_board`. Neither the Backlog page nor the Agile Board (Kanban) page renders any
  saved-query selector of its own — the Backlog's "More filters" panel is a plain filter builder
  (field/operator/value/Apply), not a saved-query picker. **So there is no button or link a user can click to
  reach this crash today**, and — per the user's own call, recorded against **TC-AGB-541** in the testcase
  file — the TC that would have exercised this ("open the Backlog through a saved query") is correctly marked
  **N/A**, not blocked, because that's simply not a feature the product built. This bug was found as a
  side-finding while checking that TC's premise, not by executing the TC itself.
  Despite the lack of a current UI path, `retrieve_rf_agile_query` treats `query_id` as recognized, explicitly
  checked input in multiple places in the controller (e.g. the `global` action's session-reset guard), so this
  is not simply dead/unreachable code from the application's own perspective — it's a real, currently
  code-only input surface, which is why this is still filed as a bug rather than dropped along with the TC.
- **Not caused by Feature #120436's own code.** `retrieve_rf_agile_query` is pre-existing shared plugin
  infrastructure; #120436's changes (the story-point badge and the two Backlog settings) do not touch it.
- **Trivial fix**: use `String.new("project_id IS NULL")`, a mutable duplicate (`+"project_id IS NULL"` or
  `.dup`), or build the condition with an array/`+` instead of `<<`, so the frozen-string-literal magic comment
  at the top of the file doesn't apply to this particular string.
- Fixing this does **not** revive TC-AGB-541 — that TC stays N/A regardless, unless a UI feature to load a
  saved query on these pages is built separately. If `query_id` is ever wired into a UI element in the future,
  re-test that new feature against this fix directly rather than re-opening TC-AGB-541.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_index.md` (BUG-AGB-001 … 009) and `bugs/_duplicates.md` (empty). No prior bug touches saved
  queries or `retrieve_rf_agile_query`.
