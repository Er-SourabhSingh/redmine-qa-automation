# BUG-AGB-009 [FIXED]

- Bug ID: BUG-AGB-009
- Production Redmine Issue ID: #120947 (ztflux, assigned to Prashant Chaurasia, reported 2026-09-18)
- Title: Turning Story Points off and on again silently wipes the configured Story Point Values, and the issue form falls back to the built-in default list
- Redmine version: 7.0.0
- Plugin name: Redmineflux Agile Board
- Plugin version: 7.0.0 (branch `feature/backlog-sprint-points`, commit `66ae25f`)
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Browser: Chrome (Playwright MCP), 1920×1080
- User role: Admin
- Date: 2026-09-18
- Severity: Medium
- Found during: sanity pass on Feature #120436 (local TC-AGB-033 / production testcase #120941, run #577)

## Summary

The **Story Point Values** field is only rendered on the plugin Configure page while **Enable Story Points** is
checked. When an admin unchecks Enable Story Points and saves, the field disappears from the form, so the next
save submits no value for it and the stored setting is overwritten with an empty string. Re-enabling Story Points
therefore returns the feature in a state where the admin's configured estimation scale is gone, and the issue
form silently falls back to the plugin's built-in default list.

The loss is easy to miss: once empty, the field renders a **placeholder** showing the default list
(`0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89`) in grey, so at a glance the Configure page still looks correctly
populated.

## Steps to reproduce

1. Administration → Plugins → Redmineflux Agile Board → **Configure**.
2. Check **Enable Story Points**, set **Story Point Values** to a custom scale — e.g. `1, 2, 3` — and click **Apply**.
3. Open any issue's edit form and confirm the **Story Points** dropdown offers exactly `--, 1, 2, 3`.
4. Return to Configure, **uncheck** Enable Story Points, click **Apply**.
5. **Re-check** Enable Story Points, click **Apply**.
6. Re-read **Story Point Values** on the Configure page, and re-open the same issue's edit form.

## Expected result

- The admin's configured scale survives the off/on cycle. After step 5, **Story Point Values** still reads
  `1, 2, 3` and the issue form's Story Points dropdown offers exactly `--, 1, 2, 3`.
- Disabling a feature toggle should not discard the feature's own configuration. The plugin already preserves the
  per-issue Story Point *data* across the same toggle (verified separately — see Notes), so discarding the
  *configuration* is inconsistent with the plugin's own behaviour.

## Actual result

- After step 5, the stored `settings[story_point_values]` is an **empty string** (`value=""`; the visible grey
  text is the field's `placeholder`, not its value).
- The issue form's Story Points dropdown offers the built-in default list —
  `--, 0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89` (11 selectable values) — instead of the configured `1, 2, 3`.
- No warning, no confirmation and no validation error at any point; the page reports "Successful update" each time.

## Impact

A team using a deliberately restricted scale loses it the first time an admin toggles the feature off and back on —
which is an entirely ordinary action, and is exactly what the plugin's own documented disable/re-enable behaviour
invites. Afterwards, estimates can be entered using values the team had deliberately excluded (here, `0`, `5`, `8`,
`13`, `21`, `34`, `55`, `89`), and nothing on screen indicates the scale changed. Recoverable by re-entering the
values, and no issue data is lost, which is why this is Medium rather than High.

## Root cause (observable from the UI)

With **Enable Story Points** unchecked and saved, `input[name="settings[story_point_values]"]` is **absent from
the DOM entirely** — confirmed by querying for it on the saved page (`fieldPresent: false`). A Redmine plugin
settings form replaces the whole settings hash on submit, so an un-rendered field is stored as blank rather than
left untouched.

Note the intermediate state: immediately after *unchecking the box but before saving*, the field is still present
and still holds its value. The data is only lost on the **second** save, which is why the cause is not obvious
from a single toggle.

## Evidence

### Screenshot — Configure page after the off/on cycle

Enable Story Points is checked, but Story Point Values holds no value (the grey `0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89`
is the placeholder):

![Configure page with Story Point Values wiped](../../screenshots/BUG-AGB-009/config-story-point-values-wiped.png)

### Screenshot — issue form offering the default list

The admin had configured `1, 2, 3`; the dropdown offers `0`, `5`, `8` … from the built-in default:

![Issue form Story Points dropdown showing the default 11 values](../../screenshots/BUG-AGB-009/issue-form-shows-default-11-values.png)

### Console / log

- No console errors related to this. The settings form reports "Successful update" on every save, including the
  one that discards the values.

### Measured values

| Point in the sequence | `enable_story_points` | `story_point_values` (stored) | Field in DOM | Issue form dropdown |
|---|---|---|---|---|
| After step 2 (configured) | true | `"1, 2, 3"` | present | `--, 1, 2, 3` |
| After unchecking, before Apply | false (unsaved) | `"1, 2, 3"` | present, populated | — |
| After step 4 (saved, disabled) | false | — | **absent** | — |
| After step 5 (re-enabled) | true | `""` | present, empty | `--, 0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89` |

## Notes

- **Not a regression introduced by Feature #120436.** This is in the pre-existing Story Points configuration
  handling, not in the new Backlog code. It was found while executing TC-AGB-033, which requires disabling and
  re-enabling Story Points.
- TC-AGB-033 itself still **passes** on its own assertions: the badge disappears when the feature is disabled,
  returns with identical figures when re-enabled, and the per-issue Story Point values are retained. This defect
  concerns the *configured value list*, a separate piece of state.
- Related existing cases: **TC-AGB-099** ("Re-enabling restores previously stored values" — about per-issue data,
  which does survive) and **TC-AGB-101** ("Empty Story Point values list"), both in
  `testcases/AGILE_CUSTOM_BOARDS_AND_STORY_POINTS.md`. TC-AGB-101's expectation that an empty list is either
  rejected or made obvious is also not met here — it is accepted silently and masked by the placeholder.
- The same shape of defect would affect **Maximum WIP Limit** or any other field if it were ever made conditional
  on a toggle in the same way; worth a look when the fix is made.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_index.md` (BUG-AGB-001 … 008, all closed, all translation/display defects) and
  `bugs/_duplicates.md` (empty). No prior bug touches Story Points configuration persistence.

## Retest — 2026-09-21

- Retest environment: Local Docker `redmine-docker-700` — http://localhost:3010, same as original.
- Plugin version: 7.0.0, branch `feature/backlog-sprint-points`, commit `288d293` ("Keep the story point scale
  when the feature is toggled off" — fixes this bug per its own commit message and the reference `Fixes
  BUG-AGB-009 (#120947)`).
- Browser: Chrome (Playwright MCP), 1920×1080. User role: Admin.
- Restarted the container and ran `start-background-jobs.sh` (Redis + Sidekiq) before retesting, per standing
  environment procedure.

### Steps followed (identical to the bug's own repro)

1. Configure page → set **Story Point Values** to `1, 2, 3`, **Enable Story Points** checked, **Apply**.
   - Confirmed saved: `1, 2, 3`, "Successful update".
2. Issue #1528 edit form → **Story Points** dropdown: confirmed exactly `--, 1, 2, 3`.
3. Configure page → **unchecked** Enable Story Points, **Apply**.
   - Confirmed via DOM: `input#story_point_values_input` is **present** (not absent, per the fix's approach —
     "render always, hide with CSS") with `value="1, 2, 3"` intact, and its row has `style="display: none;"`.
4. Configure page → **re-checked** Enable Story Points (no reload).
   - The Story Point Values row **reappeared immediately on ticking the checkbox, before any save** — matching
     the fix's stated improvement ("the field now also appears as soon as the checkbox is ticked, rather than
     only after a save"). Value still `1, 2, 3`.
5. Clicked **Apply**.
   - "Successful update". Configure page re-read: **Story Point Values still reads `1, 2, 3`.**
6. Issue #1528 edit form, re-opened: **Story Points** dropdown offers exactly **`--, 1, 2, 3`** — the built-in
   11-value default (`0, 5, 8, 13…`) does **not** reappear. Issue #1528's own previously-set value (`3`) is
   still selected.

### Result: FIXED

The admin's configured scale survives the full off/on cycle end to end, on both the Configure page and the issue
form — exactly the Expected Result this bug specifies. See screenshots.

### No regression in the surrounding feature

Re-checked the Backlog page (Feature #120436, this same session's other work): the sprint's Closed/Total badge
still reads `5 / 21 SP` unchanged, so the fix did not disturb the story-points badge or backlog behavior.

### Anomaly observed once, not reproducible — noted, not filed separately

On the *first* attempt at step 5 (Apply after re-checking the box), the page returned a Redmine 500 Internal
Server error. The write itself had actually succeeded — reloading the Configure page afterward showed `1, 2, 3`
correctly saved — so the failure was in rendering the response, not in the setting update. Retried the exact
same sequence (uncheck → Apply → re-check → Apply) a second time immediately after, following the steps via
plain UI clicks rather than a mix of scripted DOM manipulation and clicks as in the first attempt, and it
completed cleanly with no error, repeatably. `docker logs` for this container is only capturing buffered/stale
output in this environment (unrelated infra quirk, tail sits days behind wall-clock except for a few FATAL
lines), so no stack trace could be pulled to confirm a root cause. Given it did not reproduce against the
documented steps and the underlying data was correct both times, this is **not blocking** the FIXED verdict, but
is worth a quiet follow-up if a 500 is ever seen again on this settings form.

### Evidence

![Retest: Configure page after full off/on cycle, values intact](../../screenshots/BUG-AGB-009/retest-2026-09-21-pass-config.png)

![Retest: issue form dropdown shows exactly --, 1, 2, 3](../../screenshots/BUG-AGB-009/retest-2026-09-21-pass-issue-form.png)

Environment restored to the default scale (`0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89`) after retest.
