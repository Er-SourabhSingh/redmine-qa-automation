# Sanity & Regression Report — Production Feature #120919

**Feature:** Inline date editor auto-save timing fix
**Production issue:** [#120919](https://flux.zehntech.com/issues/120919)
**Production testcase:** [#121042](https://flux.zehntech.com/issues/121042) — "Sanity: Inline date editor auto-save timing fix (#120919)" (Suite #146 "Inline Issue Editor", Run #577, Environment "Window 11 + Chrome")
**Plugin:** Redmineflux Inline Editor
**Local test cases:** `TC-INE-060` through `TC-INE-065` (issue detail page), `TC-INE-090`–`TC-INE-091` (issue list / project list)

## What the fix addresses

Before the fix, typing a date manually into an inline date field (e.g. Due Date) could auto-save prematurely mid-entry, truncating the year (e.g. `2026` saved as `0026` before the 4th digit was typed). Developer's fixed behavior:

- Nothing saves while typing, however long the pause, including mid-way through the year.
- Save fires only on **blur** (click away) or **Enter**, with the exact full value typed.
- **Escape** discards the in-progress edit; the original value is retained.
- Picking a date from the **calendar** still saves immediately — this path is unchanged by the fix.
- Applies to both built-in Start/Due Date fields and any date-format custom field.

## Sanity testing — 2026-09-22 (original verification)

Executed on local Docker `redmine-docker-700` (Redmine 7.0.0, plugin 7.0.0), using a `window.fetch`/XHR network interceptor so results were judged by actual network requests, not visual state.

| TC | Scenario | Result |
|----|----------|--------|
| TC-INE-060 | No premature save while typing (incl. mid-year pause) — issue detail Due Date | PASS |
| TC-INE-061 | Save on blur, exact value | PASS |
| TC-INE-062 | Save on Enter, exact value | PASS |
| TC-INE-063 | Escape cancels, no save | PASS |
| TC-INE-064 | Calendar-pick still saves immediately | PASS |
| TC-INE-065 | Same behavior on a date custom field (`cf_61`) | PASS |
| TC-INE-090 | Same checks on the issue-list Due Date column | PASS |
| TC-INE-091 | Same checks on issue-list/project-list date custom-field columns | PASS |

Also covered on explicit request: Start Date parity (identical behavior to Due Date) and the Start/Due cross-field validation error (`422 "Due Date must be greater than start date"`), confirmed correctly shown to the user via toast on both surfaces.

**Result: all 8 sanity checks PASS. No bugs found in the fix itself.**

### Bugs found during the same coverage window (not caused by #120919, found while regression-sweeping around it)

Reported against the same production testcase (#121042) per the original scoping instruction:

| Bug | Title | Status |
|-----|-------|--------|
| BUG-INE-005 | Issue-list Subject field bypasses the 255-char length validation | **Fixed, closed** |
| BUG-INE-006 | List/detail view shows an edit pencil for a workflow-read-only field and falsely reports success on a dropped write | **Fixed, closed** |
| BUG-INE-007 | A core field's pencil can stay stuck hidden after an inline Status change | **Fixed, closed** |
| BUG-INE-008 | Description save reports success after edit rights are revoked mid-edit | **Fixed, closed** |
| BUG-INE-009 | Session authentication broken in both directions (expired session could still save; then a first fix broke valid-session saves) | **Fixed, closed** |
| BUG-INE-010 | Duplicate `jstoolbar` script load, console error on every issue-detail page load | **Fixed, closed** |

## Regression testing — 2026-09-24 (post `f2fe7ef`)

The developer's fix for `BUG-INE-009` (commit `f2fe7ef`, moving the plugin's AJAX calls from `.json`-format routes onto new session-authenticated routes) changed the request URLs and auth headers used by every inline save, including the date-timing code path. TC-INE-060–065/090/091 were fully re-executed end to end against this new build to confirm the date-timing fix itself had not regressed as a side effect of the unrelated auth change.

| TC | Result | Evidence |
|----|--------|----------|
| TC-INE-060 | PASS | Typed through `2026-12-0` → `2026-12-03`, paused 800ms before any blur/Enter — zero `update_field` calls at any point |
| TC-INE-061 | PASS | `change`+`blur` fired exactly one `update_field` call, `200` |
| TC-INE-062 | PASS | `change`+Enter fired exactly one call, `200` |
| TC-INE-063 | PASS | Typed a different date then Escape — zero calls, value unchanged |
| TC-INE-064 | PASS | `change` alone (simulating calendar pick) triggered immediate save, `200` |
| TC-INE-065 | PASS | Identical timing on `cf_61` (date custom field) |
| TC-INE-090 | PASS | Issue-list Due Date column, identical timing |
| TC-INE-091 | PASS | Issue-list `cf_61` column, identical timing |

**Result: all 8 regression checks PASS, zero new failures.** The date-timing fix is unaffected by the later auth-route change; both fixes coexist correctly. This regression pass was part of the plugin's full 130-TC final-cycle regression (see `docs/INLINE_EDITOR_HANDOFF.md` Run History, 2026-09-24).

## Production testcase disposition

Testcase [#121042](https://flux.zehntech.com/issues/121042) was previously **Failed** on production, with all 6 bugs above attached as defects. All 6 are now fixed and closed (locally and on production). Per this report, the testcase is being marked **Passed** on production, Run #577 / Suite #146 / Environment "Window 11 + Chrome".

## Environment

- Redmine Version: 7.0.0
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Test Dates: 2026-09-22 (sanity), 2026-09-24 (regression)
