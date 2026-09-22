# BUG-AGB-011

- Bug ID: BUG-AGB-011
- Production Redmine Issue ID: #120990 (ztflux, assigned to Prashant Chaurasia, reported 2026-09-21)
- Title: Backlog story-points badge goes wrong (including negative) after dragging a card between sprint/version columns, without a page reload
- Redmine version: 7.0.0
- Plugin name: Redmineflux Agile Board
- Plugin version: 7.0.0 (branch `feature/backlog-sprint-points`, commit `288d293`)
- Environment: Local Docker `redmine-docker-700` — http://localhost:3010
- Browser: Chrome (Playwright MCP), 1920×1080
- User role: Admin
- Date: 2026-09-21
- Severity: High
- Found by: user, live-testing the Backlog after Feature #120436 was marked Done on production; independently
  reproduced and root-caused in this session

## Summary

Dragging a card from one Backlog column to another (sprint→sprint, and by the same code path almost certainly
version→version or sprint→version) correctly updates the **card count** on both the source and destination
column headers, but **never touches the story-points badge** (`<closed> / <total> SP`) on either column. The
badge is left silently stale. If a story point is then edited inline on any card in one of those now-desynced
columns, the inline editor's live-update logic applies its delta **on top of the stale, wrong badge value**
instead of the true total — compounding the error further. Repeated drags and edits in the same session (no
reload in between) can drive the displayed total arbitrarily wrong, including negative, exactly as reported by
the user with a live screenshot showing `13 / -74 SP`.

Reloading the page always shows the correct value — **the underlying stored `story_points` data is never
corrupted**, this is purely a live client-side DOM display bug.

## Steps to reproduce

1. With Story Points enabled and at least two sprint (or version) columns on the Backlog, note both columns'
   `<closed> / <total> SP` badges.
2. Drag a pointed card from one column to the other (a real drag, not a page navigation).
3. Without reloading, compare both columns' badges to their true totals (card count changed correctly; points
   badge did not change at all — still shows the pre-drag value on both sides).
4. Still without reloading, use the inline story-points editor (click a card's points value) on any card in the
   destination column and change its value.
5. Compare the resulting badge to the true total (sum of the actually-drawn cards' points).
6. Reload the page and compare again.

## Expected result

- The story-points badge on both the source and destination columns updates live, immediately after the drag
  completes, to reflect the true total/closed points for the cards now actually in each column — the same way
  the card count already does.
- Any subsequent inline point edit computes its new total from the true, current total, not a stale displayed
  one.

## Actual result

- After the drag (step 3): both badges are **unchanged** — card count updates, points badge does not.
- After the inline edit (steps 4–5): the badge updates, but from the **stale pre-drag base**, not the true
  total, so it's visibly wrong. Concretely, in this session's reproduction:
  - "SP Sanity Sprint" badge before any drag: `5 / 13 SP` (correct, reload-verified).
  - After dragging a 2-point card (#1493) into this column: badge still `5 / 13 SP` (unchanged; true total is
    `5 / 15`).
  - After changing #1493's points from 2 → 8 (a +6 delta) via the inline editor: badge became `5 / 19 SP`
    (`13 + 6`), computed from the stale `13`. The true total (verified on reload) is `5 / 21 SP`
    (`5+3+2+3+8 = 21`) — the live display was off by exactly 2, the very points that never got added when the
    card was dragged in.
  - The user's own report reached a materially worse case after more drags/edits in one session: a live badge
    reading `13 / -74 SP` — a negative total, which is never a valid state.
- **A plain page reload always corrects the display** to the true value — confirmed independently by the user
  ("after refresh it show correct value") and by this session's own reproduction.

## Root cause (from source)

`app/views/rf_boards/backlog.html.erb`'s jQuery UI Sortable `update` handler (around line 1810, inside the
`$containers.sortable({ ... update: function(event, ui) { ... } })` block starting at line 1700) is the code
that runs immediately after a card is dropped in a new column. It calls:

```js
updateSingleColumnCount($newContainer, 1);
updateSingleColumnCount($oldContainer, -1);
```

`updateSingleColumnCount` (defined at line 2040) explicitly only maintains the card **count**:

```js
const currentTotal = parseInt($container.attr('data-total-count'), 10) || 0;
const newTotal = Math.max(0, currentTotal + delta);
...
const $countElement = $column.find('.jira-issue-count');
if ($countElement.length) {
  $countElement.text(hasMore ? `${displayLoaded} / ${newTotal}` : newTotal);
}
```

Nowhere in this function, or anywhere else in the sortable `update` handler, is `.backlog-column-story-points`
(the badge's own class, from `backlog_story_points_badge` in `app/helpers/rf_boards_helper.rb`) read or
written. Confirmed by grepping the entire `backlog.html.erb` file for `story.point`/`storyPoint`: the only
matches are the config block for the inline editor (lines 11–17) and the four `<%= backlog_story_points_badge(...) %>`
calls that render the badge on **initial page load** (lines 350, 380, 422, 452) — there is no live-update call
site for it at all in the drag/drop path.

Separately, `assets/javascripts/rf_story_points.js`'s own live-update function `updateBadges` (line 114) is
correctly wired, but only from the inline-edit save handler (line 145) — it has no knowledge that a drag may
have already made the displayed badge wrong, so it applies its own delta on top of whatever is currently shown,
compounding a pre-existing drag-caused error rather than fixing it.

## Impact

This directly undermines the core purpose of Feature #120436 — the badge exists specifically so a team can read
trustworthy sprint capacity numbers while planning in the Backlog, and dragging cards between sprints/versions
*is* the primary planning action on this page. A team actively planning (drag several stories into a sprint,
adjust a few point values, all without reloading) will see an increasingly wrong number in front of them, with
no visual indication anything is off — up to and including a nonsensical negative total, as directly observed
in production-adjacent testing by the user. Severity is High because:
- It is trivially reachable through completely ordinary use of the feature's main interaction (drag-and-drop
  planning), not an edge case or malformed input.
- The wrong number is exactly the number the feature was built to make trustworthy — a client requirement
  (#120436, Innoval) specifically about being able to trust "24/40"-style sprint totals for planning decisions.
- It has no error indicator; a user has no way to know the number is wrong without knowing to reload.

Not Critical because no data is corrupted — a reload always shows the truth, and nothing is written to the
issue's stored `story_points` incorrectly.

## Evidence

### Screenshot — wrong live badge before refresh

Badge reads `5 / 19 SP`; the true total (confirmed on refresh, sum of visible cards' points 5+3+2+3+8) is 21.

![Wrong live badge, before refresh](../../screenshots/BUG-AGB-011/live-wrong-badge-before-refresh.png)

### Screenshot — correct badge after refresh

Same column, same cards, immediately after a plain reload: `5 / 21 SP`, matching the true sum exactly.

![Correct badge, after refresh](../../screenshots/BUG-AGB-011/correct-badge-after-refresh.png)

### Reproduction trace

| Step | Column state | Badge shown | True total | Match? |
|---|---|---|---|---|
| Fresh reload, before any drag | 4 cards | `5 / 13 SP` | 13 | ✅ |
| After dragging in a 2-point card (no reload) | 5 cards | `5 / 13 SP` (unchanged) | 15 | ❌ stale |
| After editing that card's points 2 → 8 (no reload) | 5 cards | `5 / 19 SP` | 21 | ❌ wrong (delta applied to stale base) |
| Reload | 5 cards | `5 / 21 SP` | 21 | ✅ |

### User's own report (production-adjacent live testing)

Screenshot supplied by the user during this session showed a "SP Sanity Sprint" column reading `13 / -74 SP`
after "dropping cards from one sprint/version/status to another" in a single session — the same mechanism,
compounded further by additional drag/edit cycles. User separately confirmed: *"after refresh it show correct
value."*

## Notes

- **Within Feature #120436's own scope.** This is not pre-existing/unrelated plugin infrastructure like
  BUG-AGB-010 — `backlog_story_points_badge` and the whole "closed/total SP" badge display are exactly what
  #120436 introduced. This finding means the earlier regression sign-off ("zero defects in the feature's own
  code") needs to be corrected: this is a real defect in #120436's own delivered functionality, found after the
  ticket had already been marked Done on production.
- **Not caught during the regression pass** because that pass tested drag operations (TC-AGB-545) and inline
  point edits (TC-AGB-537) as *separate* scenarios, each followed by a check, rather than performing several
  drags and edits back-to-back in the same page load without reloading in between — which is exactly the real
  planning workflow the user was doing.
- **Suggested fix direction:** either (a) have the sortable `update` handler in `backlog.html.erb` also update
  `.backlog-column-story-points` on both `$oldContainer`/`$newContainer` using the moved card's own
  `data-points` value (mirroring what `updateSingleColumnCount` already does for the count), or (b) have
  `rf_story_points.js`'s `updateBadges` re-fetch/recompute the column's true total from the DOM (summing every
  visible card's `data-points`) rather than reading and mutating the badge's currently-displayed text.
- Recommend re-testing TC-AGB-530–532, 536–537, 539–540, 542–543 as one continuous multi-step session (several
  drags and point edits without reloading between them) once fixed, since that combined-interaction scenario is
  what actually exposes this and was not covered by the regression suite's TC-by-TC structure.

## Duplicate check

- Duplicate found: No
- Checked `bugs/_index.md` (BUG-AGB-001 … 010) and `bugs/_duplicates.md` (empty). No prior bug touches the
  Backlog's live badge update behavior during drag-and-drop.

## Production report

- Reported to production 2026-09-21 as **#120990** (ztflux, project id 122), assigned to Prashant Chaurasia
  (user id 410), Priority High, Defect Severity "High-severity", Defect priority "High", category "Agile board
  plugin". Companion action taken same session: production #120436 (the feature this bug's badge belongs to)
  moved back In QA / 90% (from Done / 100%) with a comment cross-referencing #120990 — per explicit user
  approval for both actions.
- Also linked to production **testcase #120941** in **run #577** ("Agile Board - Sanity - Verify Story Points
  support in Backlog (Feature #120436)", suite #110, environment "Window 11 + Chrome") via
  `redmineflux_testcases_management_report_defect` — that testcase's run-577 result is now **Failed** with
  defect #120990 attached, reflecting this regression against the sanity testcase's own scope. The local
  per-TC verdicts in `testcases/AGILE_BACKLOG_AND_SPRINTS.md` (TC-AGB-529/530/533/535/539/545) are left as
  isolated PASS, per this repo's retest-scope rule — see the note added there 2026-09-21.

## Retest — 2026-09-21 — FIXED

- Environment: same local Docker `redmine-docker-700` (http://localhost:3010), branch **`master`**, commits
  `32141ba` ("Keep the backlog points badge true while cards are dragged") and `50a8a76` ("Move story points
  with a dragged card on every board") — `feature/backlog-sprint-points` was merged to master (`fda8fb1`) and
  released as plugin version **7.1.0**. Container restarted, Redis/Sidekiq restarted; no plugin migrations
  were added, so no `rake redmine:plugins:migrate` was needed.
- Repeated the exact repro on the same fixture ("SP Sanity Sprint 120436" / "No Points Sprint 120436", issue
  #1469): dragged #1469 (5 pts) from "No Points Sprint 120436" into "SP Sanity Sprint 120436" — **both badges
  updated live, immediately, correctly**: source `13 / 18 SP` → `13 / 13 SP` (5 subtracted), destination
  `5 / 21 SP` → `5 / 26 SP` (5 added) — matching true totals with no reload needed.
- Then, still without reloading, edited #1469's points 5 → 8 (+3) via the inline editor: badge updated live to
  `5 / 29 SP` — computed correctly from the now-accurate post-drag base (26 + 3 = 29), not a stale one.
- Reloaded the page: badge still read `5 / 29 SP`, an exact match to the live value — no divergence.
- This directly confirms both the drag-desync and the delta-compounding-on-stale-base mechanisms are fixed.
- Evidence: `screenshots/BUG-AGB-011/retest-2026-09-21-fixed-live-badge-after-drag.png` (live, post-drag,
  correct) and `screenshots/BUG-AGB-011/retest-2026-09-21-fixed-matches-after-reload.png` (post-reload,
  identical).
- Moved to `bugs/closed/`.
- Production **#120990** updated: In QA → Done, 100%, with retest summary noted — per explicit user approval.
- Production **testcase #120941** in **run #577** updated to **Passed** (result ID 14287), noting the fix and
  that BUG-AGB-010 was confirmed fixed in the same retest pass — per explicit user approval.
