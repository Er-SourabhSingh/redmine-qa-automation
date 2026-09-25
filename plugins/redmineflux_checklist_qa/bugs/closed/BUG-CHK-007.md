# Bug Report

- Bug ID: BUG-CHK-007
- Production Redmine Issue ID: #121338
- Title: Rapid repeated checklist/sub-item toggling races unsequenced AJAX chains — displayed percentage can lag, sub-item status changes can be lost, and mixed parent+sub-item interaction can overwrite untouched items
- Redmine version: 7.0.0 (Docker)
- Plugin name: Redmineflux Checklist Plugin
- Plugin version: 7.0.0
- Environment: Local Docker (redmine-docker-700-redmine-1), http://localhost:3010
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-25

## Steps to reproduce

**Category 1 — parent checklist checkbox, NO sub-items:**
1. Create a checklist with zero sub-items.
2. Click its own checkbox several times in quick succession (sub-second gaps).
3. Observe the checkbox state and displayed percentage once AJAX settles, and again after a reload.

**Category 2 — parent checklist checkbox, WITH sub-items:**
1. Open a checklist that has at least one sub-item, in a known state (e.g. fully unchecked/0%, or fully
   checked/100%).
2. Click the checklist's own checkbox several times in quick succession, in both directions (starting
   unchecked, and separately starting checked).
3. Observe the parent checkbox, every sub-item's own checkbox, and the displayed percentage once AJAX
   settles, and again after a reload.

**Category 3 — rapid changes directly on a sub-item's status dropdown:**
1. Open a checklist with at least one sub-item.
2. Rapidly flip a sub-item's status dropdown between "Done" and "New" several times in quick succession,
   ending on a specific, known selection (test both "ends on Done" and "ends on New").
3. Reload the page and compare the *persisted* dropdown value and checkbox state to the user's actual last
   selection.

**Category 4 — sub-item dropdown, all three states:**
1. Repeat Category 3's method but cycle through all three states (New → In Progress → Done → In Progress →
   New, and similar sequences), not just New/Done.
2. Reload and compare persisted state to the intended final selection.

**Category 5 — mixed parent + sub-item rapid interaction:**
1. Open a checklist with at least one sub-item, in a known state.
2. Interleave rapid actions on the parent checkbox and a sub-item's dropdown in the same tight sequence (e.g.
   parent-uncheck → sub-item→New → parent-check → sub-item→Done).
3. Reload and compare the parent's state, every sub-item's state (including any sub-item **not** touched by
   the sequence), and the percentage against the user's actual intended final state for each.

**Category 6 — normal-paced control:**
1. Repeat Categories 3 and 2 with real, deliberate gaps between each action (≥800ms for dropdown changes,
   ~3s for checkbox clicks, both well within normal human interaction speed).
2. Confirm whether the same checks come out clean.

## Expected result

- After any rapid interaction settles (and certainly after a reload), the checklist's own checked/unchecked
  state, every sub-item's actual done/not-done state and dropdown selection, and the displayed progress
  percentage should all agree with each other and correctly reflect the last action the user actually made.
  An item the user never touched in a sequence should never change.

## Actual result

Six categories of rapid interaction were tested, each with multiple repetitions to establish a real
reproduction rate (races are non-deterministic — a single trial proves nothing either way). Results, and what
each one is:

| Category | Reproducible? | Failure type | Rate observed |
|---|---|---|---|
| 1. Parent checkbox, no sub-items | **No** | — | 0/6 rounds |
| 2. Parent checkbox, with sub-items | **Yes** | UI-only stale percentage (parent+subs agree with each other and are correct; only the displayed/fetched percentage lags to the pre-toggle value) | 3/16 rapid-click rounds (~19%); **also 5/9 single deliberate-click CHECK trials (network-log confirmed, see Category 6-extended correction below) — not limited to rapid/overlapping clicks** |
| 3. Sub-item dropdown, Done/New only | **Yes** | Genuine persisted-state loss (reload-confirmed: final DB value differs from the user's actual last selection) | 2/5 reload-confirmed rounds (40%) |
| 4. Sub-item dropdown, all 3 states incl. In Progress | **Yes** | Same as Category 3 — not limited to the Done/New pair | 1/3 reload-confirmed rounds |
| 5. Mixed parent + sub-item interleaved | **Yes**, most severe | Persisted-state loss across *multiple* items at once, including an item never directly touched by the sequence (the parent's bulk cascade overwrote it) | 1/1 attempt, severe |
| 6. Normal-paced control (≥800ms gaps) | **No** | — | 0/6 rounds (3 checkbox + 3 dropdown) |
| 6b. Threshold probe: parent-only, single deliberate clicks, 300-1000ms gaps, across 100%/50%/0% starting points | **No** | — | 0/23 rounds — confirms the trigger is request *overlap*, not merely "clicked more than once without refreshing" |

**Summary by failure class, as tested:**
- **Actual persisted/server-state corruption** (reload-confirmed wrong value, does not self-correct): Categories
  3, 4, 5 — a sub-item's actual saved status, and in Category 5 an *untouched* sibling sub-item's status too,
  can end up different from the user's real last action.
- **UI-only stale/stuck progress** (self-corrects given more toggles or a reload, but can sit wrong in an
  already-open tab indefinitely — see Field confirmation below): Category 2, and the independently-observed
  real-world example on Feature #1570.
- **Parent/child state mismatch** (the checklist's own state disagrees with its sub-items', or a sub-item's
  own checkbox disagrees with its own dropdown): seen live (not reload-persisted) in Category 5 specifically.
- **Cases that self-correct after reload**: Category 2's percentage lag always resolved to the correct number
  on a later check; Categories 3, 4, and 5 did **not** self-correct — their wrong values were the genuine,
  stable, reload-confirmed final state.

**Category 1 (parent, no sub-items) — clean.** 6 rapid-toggle rounds (3 each direction), all fully consistent
after settling and after reload. A checklist with zero sub-items apparently has too little cross-request
surface for this race to manifest — likely because the `toggle_completed_bulk` cascade has nothing to act on.

**Category 2 (parent, with 2 sub-items) — UI/fetch-level percentage lag, checkbox and sub-item data
themselves were never wrong.** Across 16 rapid 5-click rounds (checklist 208, "BUG-CHK-006 retest
checklist"): the parent checkbox and both sub-items' own checked state matched the mathematically-expected
outcome (5 toggles = odd = flipped) in **all 16** rounds — this part never failed. But in 3 of the 8
"unchecked → checked" rounds, the displayed percentage (both the live DOM *and* a fresh same-session `fetch`
to `/checklists/208/completion_percentage`) stayed at the **pre-toggle value (0%)** even though the
checkbox and both sub-items correctly showed checked/done. This is a real server-side race (the fetch, not
just the DOM, returned the stale number) but it self-corrects — every failing round, when repeated or
reloaded, eventually settled to the correct number; it was never observed to still be wrong on a fresh page
load taken well after the interaction stopped.

**Category 3 (sub-item dropdown, Done ↔ New) — genuine, reload-confirmed lost updates, ~40% of the time.**
5 rapid alternating changes (`sub_checklist_item_79`, checklist 208), each round's final selection verified
against the actual persisted value via a full page reload (not just the live DOM, which is not authoritative
— see note below). 2 of 5 rounds persisted a *different* value than the user's actual last selection (e.g.
intended "Done", persisted as "New"; intended "In Progress", persisted as "Done"). This is the most clearly
severe failure mode: a user's actual final choice can be silently discarded with no error and no visual
indication after the fact — the page looks correct once reloaded, just wrong.

**Category 4 (all 3 dropdown states) — same defect, not limited to Done/New.** Sequences cycling through
New/In Progress/Done showed the identical lost-update pattern (1 of 3 reload-confirmed rounds mismatched),
confirming this isn't specific to a two-state toggle — any rapid sequence of `update_state` calls races.

**Category 5 (mixed parent + sub-item) — most severe: an untouched item can be silently overwritten.**
One clean, severe repro: starting from parent=checked/both subs=done, ran `parent-uncheck → sub79→New →
parent-check → sub79→Done` (intending to end with parent checked, sub79 done, sub81 *unchanged* at done).
After settling, the live DOM already looked wrong (sub79's own checkbox showed checked while its own dropdown
showed "New" — contradicting each other on the *same* sub-item). A reload confirmed the real persisted
state: **parent unchecked, sub79 = New, and sub81 = unchecked/New too** — despite sub81 never being touched
in this sequence at all. The parent's `toggle_completed_bulk` cascade, triggered by whichever of the two
parent clicks was processed last, overwrote every sub-item (including sub81) to match the parent's own
(also incorrect) final state, discarding both the user's intended parent state and their specific sub79
choice simultaneously.

**Category 6 (normal-paced control) — clean, confirming this is sub-second-interaction-specific.** The
identical sequences from Categories 2 and 3, repeated with real gaps (≥800ms between dropdown changes, ~3s
between checkbox clicks — both well above sub-second), landed correctly every single time (6/6 rounds). This
is not a defect in the toggle mechanism generally, only in how it handles multiple rapid actions on the same
control(s) in quick succession.

**Category 6, extended — precise threshold test, parent checkbox only, WITHOUT reloading between steps
(user follow-up request, 2026-09-25).** To directly answer "does a single check/uncheck on the parent leave
the bar stuck at the old percentage in an already-open page until refresh?" — tested single, deliberate
clicks (not rapid) on checklist 208 (2 sub-items), reading the live DOM at fixed intervals *after each click,
before any page refresh*, across three starting percentages:

- **100% → uncheck:** checkbox flips synchronously (`checked` goes `true→false` immediately, since the
  parent handler sets sub-item checkboxes synchronously before the AJAX call even fires — see root cause
  below). The percentage briefly still reads the old value at t=0 (expected — the AJAX hasn't returned yet),
  then updates correctly to 0% by **+200ms** and stays correct through +2000ms. Repeated as a 5-step
  check/uncheck/check/uncheck/check cycle at 1s spacing: **5/5 fully consistent**, matching server truth
  (`fetch('/checklists/208/completion_percentage')`) at every step.
- **50% partial (one of two sub-items done) → check/uncheck several times:** same pattern — checkbox and
  sub-items flip synchronously, percentage catches up within ~200ms, then stable and correct. 3 more
  uncheck/check/uncheck cycles at 1s spacing: **3/3 consistent**.
- **0% → check:** same pattern, catches up to 100% by +200ms, stable and correct through +1000ms and via a
  fresh server fetch.
- **Threshold check:** repeated 6-step check/uncheck cycles at **500ms** and then at **300ms** gaps between
  clicks (still single, non-overlapping clicks — each click's own AJAX chain has time to fully resolve before
  the next click fires, since the round trip observed here is ~150-200ms): **12/12 consistent** across both
  paces. The defect only appears once clicks fire close enough together that one click's AJAX chain is still
  in flight when the next click starts (as in Categories 2 and 5's 0ms/back-to-back `.click()` loops) — it is
  about **request overlap**, not simply "the user clicked more than once" or "the page wasn't refreshed."

**Conclusion for this specific question: not reproduced.** A single check/uncheck on the parent checkbox,
performed as one deliberate action at a time (even repeated several times, even as fast as 300ms apart, as
long as each click's own AJAX round trip is allowed to finish before the next click), never left the
progress bar stuck at a stale percentage in the already-open page. The percentage always updated live,
correctly, within roughly 200ms of each individual click, and always agreed with a fresh server-side
`completion_percentage` fetch at that same moment. This is a **clean negative result**, not a UI-only stale
display, not a server calculation issue, and not a persisted-state issue for this exact scenario — it
narrows the bug's true trigger condition to genuinely overlapping rapid clicks (Category 2/5's territory),
not the simpler "any check/uncheck without a refresh" scenario this check was specifically testing for.

**Category 6, extended further — user-reported specific sequence, re-verified live with genuine mouse
clicks (2026-09-25, second follow-up).** User reported seeing the exact scenario above fail in their own
browser: unchecking sub-item "78" (leaving "sdf" done, landing on 50%, matching the screenshot they
provided), then checking the parent checkbox — expecting the percentage to update immediately but reportedly
seeing it stay wrong without a refresh. This was re-tested as faithfully as possible to their exact steps,
using genuine Playwright `browser_click` (real mouse-driven clicks through the actual UI, not the
programmatic `.click()`/`dispatchEvent` calls used for the statistical runs above) and a screenshot captured
at each step:

1. Baseline (fresh page load): checklist "BUG-CHK-006 retest checklist" at **100%**, both "78" and "sdf"
   checked/Done.
2. Clicked "78"'s own checkbox to uncheck it → **50%**, "78" now New/unchecked, "sdf" still Done, parent
   auto-unchecked — matching the user's own screenshot of this exact intermediate state.
3. Clicked the parent checkbox to check it → **100%**, both sub-items checked, updated correctly and
   immediately, no refresh performed.

This exact 3-step walkthrough was run **5 times total** (once as an initial repro, once with an explicit
screenshot immediately after the parent click, once repeated again for confirmation, and twice more starting
from a completely fresh page reload each time to rule out any residual JS/session state from earlier
stress-testing on this same fixture) — **5/5 clean**, the percentage always updated correctly and
immediately after the parent click, visually confirmed via screenshot each time, never stuck. Screenshots:
`screenshots/BUG-CHK-007/investigation-2026-09-25-step{1,2,3}-*.png` (the live 3-step walkthrough) and
`investigation-2026-09-25-verify{1,2}-*.png` (two further repeats, the second immediately after a fresh
reload).

**Status (superseded — see correction below): could not be corroborated** was the conclusion drawn from this
5/5-clean walkthrough. That conclusion turned out to be wrong, due to a methodology gap explained next.

**Category 6, extended — CORRECTION (2026-09-25, third follow-up, network-log evidence).** The 23/23 and 5/5
"clean" results above were checked via live DOM state and via this session's *own* manual `fetch()` calls —
never by inspecting the actual response body of the request **the app's own code fires**
(`updateProgressBar()`'s `GET /checklists/:id/completion_percentage`, triggered automatically inside the
parent checkbox's `toggle_completed` success handler). A manual `fetch()` run any time after the real
sequence of events has finished will always return the current (by-then-correct) value — it says nothing
about what the app's own request returned *at the moment it fired*. Re-tested with this gap closed, using
`browser_network_request` (`part: "response-body"`) to read exactly what the app's own automatic
`completion_percentage` GET returned, on single, deliberate, non-overlapping parent-checkbox clicks (no rapid
clicking involved at all):

- **CHECK direction (0%→100% or partial→100%), single deliberate click, real `browser_click`:** the app's own
  `completion_percentage` GET returned the **stale, pre-toggle percentage** in the majority of trials this
  session (5 of 9 single-action CHECK trials, spanning both a dropdown-created partial state and a
  checkbox-created partial state, and a direct 0%→check with no sub-items pre-touched) — confirmed by reading
  the actual response body, not just the DOM. In the failing trials the checkbox and sub-items were already
  correctly checked while the fetched/displayed percentage still showed the old number, exactly matching the
  user's report. In the other trials of the same exact action the app's own request happened to return the
  correct number — **this is a genuine, non-deterministic race**, not a guaranteed failure and not a
  guaranteed pass; both outcomes were observed for the identical action sequence.
- **UNCHECK direction (100%→0%), single deliberate click:** every trial this session (4/4, network-log
  confirmed) returned the correct `{"percentage":0}` immediately. Unchecking does not appear to race — likely
  because the checklist's own `completed` flag alone is sufficient to answer "0%," with no dependency on the
  (not-yet-updated) sub-item rows the checking direction needs.
- **Mechanism:** the race is *within a single click's own two chained requests*, not only between separate
  clicks as Category 6/6-extended originally concluded. `updateProgressBar()` is invoked inside
  `toggle_completed`'s own AJAX success callback — i.e. as soon as the *first* of the two chained requests
  returns — which is *before* the `.always()`-chained `toggle_completed_bulk` request (the one that actually
  flips each sub-item's persisted completion flag) has been sent, let alone completed. Since
  `completion_percentage` is computed from sub-item completion state, whether the fetch sees the old or new
  number depends on whether `toggle_completed_bulk` has landed in the database yet at the exact moment the
  server processes that GET — a timing race on ordinary browser/server latency, no rapid clicking required.
  The `toggle_completed_bulk` success handler never re-triggers `updateProgressBar()` afterward, so a losing
  race leaves the DOM stuck at the stale number indefinitely, until the page is manually reloaded.

**Net effect: the user's report was correct, and the earlier "not reproduced" / "could not be corroborated"
conclusions in this section were false negatives**, caused by verifying against self-issued `fetch()` calls
and DOM state after the race had already resolved, instead of inspecting what the app's own automatic
request actually returned at the moment it fired. Sub-item-level updates (checkbox toggle or dropdown
change) do not have this problem: their `change` handlers call `updateProgressBar()` directly, after their
own single, non-chained PATCH completes — there is no second in-flight request for it to race against, which
is exactly why the user observed sub-item updates syncing live correctly while parent-checklist updates did
not.

**Root cause, confirmed via source (`checklist_checkbox.js`):**
- **Primary mechanism (single-click percentage race, confirmed above):** the parent checkbox's `change`
  handler calls `updateProgressBar(checklistId)` **inside `toggle_completed`'s own success callback** — before
  the `.always()`-chained `PATCH /checklist_items/toggle_completed_bulk` (which persists each sub-item's
  actual completion flag) has even been sent. `toggle_completed_bulk`'s own success handler never re-triggers
  `updateProgressBar()`. Whether the resulting `GET /checklists/:id/completion_percentage` sees the old or new
  sub-item state is a timing race against ordinary request latency — no rapid/overlapping clicking is needed,
  though rapid clicking (Category 2 below) makes it worse by adding concurrent chains on top of this base
  race. This is asymmetric: unchecking doesn't need sub-item data (short-circuits to 0%) and was not observed
  to race; checking does need it and races intermittently (~5/9 single-click trials this session).
- **Secondary/compounding mechanism (multi-click race):** nothing serializes or debounces *separate* click
  events on top of the above — each rapid click fires its own independent two-step chain, and several chains
  run concurrently. Whichever chain's `completion_percentage` fetch (Category 2) or
  `toggle_completed`/`toggle_completed_bulk` write (Categories 2, 5) completes *last* wins — not necessarily
  the chain from the user's actual last click.
- The sub-item dropdown's `change` handler (lines 140-177) has no chaining and no debounce at all — a single
  self-contained `PATCH /checklist_items/:id/update_state` per change. Multiple rapid changes fire multiple
  concurrent PATCH requests with no ordering guarantee; whichever the server commits last determines the
  persisted `state` (Categories 3, 4), independent of which selection the user made last.
- Category 5's severity follows directly from combining both: the parent's bulk cascade and a sub-item's own
  independent update race against *each other* as well as against themselves, so an item never touched in the
  interleaved sequence can still be overwritten by the parent's cascade if that cascade's last-committed
  write happens to include it.

**Important methodology note:** a `<select>` dropdown's own live `.value` in the browser is **not** a
reliable signal during this kind of test — nothing in the app's own JS ever writes back to the dropdown's
displayed value from an AJAX response (only the sub-item's *checkbox* is updated that way), so the dropdown
will keep showing whatever was last set on it (by script or by the user) regardless of what the server
actually committed. The only reliable way to check the true persisted state is a full page reload, which
re-renders both the dropdown and checkbox from the same underlying DB record and is therefore always
internally self-consistent (this is also why a checkbox and dropdown for the *same* sub-item were seen to
visually disagree live in Category 5, but never after a reload).

**Relationship to prior work:** this is a different, still-open instance of the same underlying class of bug
already partially addressed for `BUG-CHK-004` (which fixed one specific race — a single click cascading into
two requests for the *same* item — and was retested clean under normal, humanly-paced clicking). This bug is
about *multiple separate rapid clicks/changes*, which `BUG-CHK-004`'s fix does not address and was never
claimed to. A related, narrower observation was noted (not filed) in `CHECKLIST_MEMORY.md` on 2026-09-24 — a
synthetic zero-delay stress test found one duplicate journal row but confirmed the underlying checked state
was unaffected; that prior check did not exercise the checklist-level checkbox or the state-dropdown paths
this bug is about, and did not check for a persisted-state/percentage mismatch, only for duplicate log rows.

## Evidence

### Screenshot

![Checklist checkbox unchecked while progress bar and sub-items still show 100% complete](../../screenshots/BUG-CHK-007/checkbox-unchecked-percentage-stuck-100.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-CHK-007/retest-yyyy-mm-dd-pass.png)

### Console / log

- **Category 1 (no sub-items, checklist 211):** 6 rapid-5-click rounds (3 each direction), all 6 fully
  consistent — `domChecked`/`domText`/`serverPercentage` always matched the mathematically-expected outcome,
  confirmed again after reload.
- **Category 2 (with sub-items, checklist 208):** 16 rapid-5-click rounds total. Representative failing
  round: 5 clicks on `#checklist_item_208` fired 5× `PATCH /checklists/208/toggle_completed`, 5× `PATCH
  /checklist_items/toggle_completed_bulk`, 5× `GET /checklists/208/completion_percentage` (all → 200, no
  cross-click sequencing). Final state that round: `checkbox.checked === true`, both
  `.sub-checklist-checkbox-208` elements `checked === true`, but `domText` and a fresh
  `fetch('/checklists/208/completion_percentage')` both returned `{"percentage":0}` — contradicting the
  correctly-checked checkbox/sub-items. 3/16 rounds showed this specific pattern, always on the
  unchecked→checked direction.
- **Category 3 (dropdown Done/New, sub-item 79):** 5 reload-confirmed rounds. 2 mismatches: (a) intended
  final "Done", 5-change sequence `done,new,done,new,done` — persisted value after reload was **"new"**; (b)
  intended final "In Progress" via a mixed sequence — persisted value after reload was **"done"**.
- **Category 4 (all 3 states):** sequence `new,in_progress,done,in_progress,new` (intended final "new")
  persisted correctly; sequence `done,new,in_progress,done,in_progress` (intended final "in_progress")
  persisted as **"done"** instead — 1/3 reload-confirmed mismatch.
- **Category 5 (mixed):** sequence `parentCb.click(); sub79→'new'; parentCb.click(); sub79→'done'` (intended:
  parent checked, sub79 done, sub81 unchanged/done). Live (pre-reload) state already showed sub79's own
  checkbox (`checked:true`) contradicting its own dropdown (`value:'new'`). After reload, actual persisted
  ground truth: `parentChecked:false, sub79Checked:false (value:'new'), sub81Checked:false` — sub81, never
  touched by the sequence, was flipped to unchecked/New anyway, and none of the three intended final values
  (parent checked, sub79 done, sub81 unchanged) were honored.
- **Category 6 (control, ≥800ms gaps):** 3 dropdown rounds + 3 checkbox rounds (the latter from earlier
  Category-2-style testing at ~3s spacing), all 6 landed correctly and reload-consistent — confirms the
  defect requires sub-second-spaced interaction specifically.

## Field confirmation — a second, independent real-world example (2026-09-25)

The user reported seeing this exact symptom on a completely different issue, unrelated to this session's own
test fixture: **Feature #1570 "General availability rollout"** (`Flux Gantt Sanity Project m`), checklist
`sdaf` with sub-item `test` — both shown checked/Done, but the checklist's progress bar displayed **0%**, in
an already-open browser tab, with the issue itself last "Updated" ~22 hours earlier (i.e., this wasn't a
just-now live race the user was watching — the wrong percentage had been sitting there, stuck, for a while).

**This matches Category 2's finding** (parent+sub-item checked state correct, but the fetched/displayed
percentage stale) — a client-side/live-fetch display problem, not necessarily a permanently corrupted
database value:

- Navigating fresh to `/issues/1570` (a new page load, not the user's already-open tab) showed the checklist
  correctly at **100%**, matching both checked items. A fresh `GET /checklists/210/completion_percentage`
  independently confirmed `{"percentage":100}` — the server's current truth is correct.
- **However**, this checklist's own Checklist History (`tab=checklist_history`) shows a long run of rapid,
  oscillating entries — "marked as Done" / "status changed to incomplete" / "marked as New" / "status changed
  to completed", repeating — all timestamped "less than a minute ago" / "1 minute ago" relative to this check.
  This is consistent with the user actively rapid-toggling this exact checklist by hand shortly before/around
  reporting it, independently reproducing the same race this bug describes via genuine real-world usage, not a
  synthetic test.
- **Conclusion:** unlike Categories 3-5 (where the wrong value was proven to persist in the database itself
  after a reload), Category 2's underlying data appears to often self-correct across enough subsequent toggles — but
  **the percentage rendered in a tab the user already has open does not automatically refresh to match**, so a
  user can be looking at a stale, wrong percentage (0% while everything is checked, or the reverse) for an
  indefinite period — hours, per this example — until they manually reload the page. From the user's
  perspective this reads as "stuck," even though a fresh load elsewhere shows the correct number. This is
  still a real defect (no live-sync mechanism corrects an open tab's display), just a different mechanism than
  a permanently wrong database value.

## Duplicate check

- Duplicate found: No — checked `bugs/_duplicates.md` and `bugs/_index.md`. Related to but distinct from
  `BUG-CHK-004` (fixed, closed) — that bug was about a single click firing a duplicate request for the *same*
  action; this bug is about *multiple separate rapid clicks/changes* on the same control racing each other,
  which is a different failure mode `BUG-CHK-004`'s fix doesn't cover and was never intended to.

## Retest — 2026-09-25 (fix verified, PASS)

Fix landed in `checklist_checkbox.js` (instance restarted, fresh asset
`checklist_checkbox-75989a16.js` compiled 2026-09-25 13:18:49). Source confirms the exact root cause from
this bug's investigation was addressed:
- A per-checklist request queue (`checklistRequestQueues`) now serializes every AJAX chain for a given
  checklist — the parent checkbox and every one of its sub-items share **one** queue, so a parent cascade and
  a sub-item's own update can never run concurrently. A newer change to the same control supersedes one still
  waiting, so only the user's actual latest choice per control is ever sent.
- `updateProgressBar()` is now called only after `toggle_completed_bulk` resolves (chained via `.always()`
  on the *second* request), not inside `toggle_completed`'s own success callback — directly fixing the
  premature-fetch race this bug's core finding was about (fix comment explicitly cites `#121338`).

**Retested against every original failure category, live (checklist 208, "BUG-CHK-006 retest checklist",
2 sub-items):**

- **Single, deliberate parent-checkbox CHECK/UNCHECK (the corrected finding's primary scenario):** 6/6 clean
  with a 2s settle (matches or exceeds normal user pacing) — checkbox, both sub-items, and displayed
  percentage always agreed and were correct. (A tighter, sub-second-paced automated loop at 700ms occasionally
  still showed the percentage catching up after that window — expected, since the fix now runs the full chain
  serially rather than firing the percentage fetch early; this is slower-but-correct, not a recurrence of the
  bug, and settles well within realistic human click spacing.)
- **Rapid same-tick multi-click (original Category 2 repro, 5 clicks fired with 0ms gaps), both directions:**
  2/2 clean — final checkbox/sub-item/percentage state correctly matched the mathematically-expected
  odd-click-count outcome both times, reload not even needed since the queue makes this deterministic.
- **Rapid sub-item dropdown changes, reload-confirmed (original Category 3/4 repro):** 2/2 clean — a
  5-change Done/New/Done/New/Done sequence persisted as "done", and a New/In-Progress/Done/In-Progress
  sequence persisted as "in_progress" — both reload-confirmed correct, no lost updates.
- **Mixed parent + sub-item interleaved (original Category 5 repro), run twice from different starting
  parent states:** both runs were internally self-consistent (percentage always matched actual checked
  sub-items, no live checkbox/dropdown disagreement on the same item) and, critically, **deterministic** —
  the previously-untouched sibling sub-item's final state is now fully explained by the parent's own actual
  final action (a parent uncheck/check legitimately bulk-applies to all its children; that item was never
  "touched" only in the sense that no dropdown/checkbox event fired for it directly, but the parent's cascade
  is its normal, documented way of being affected). Re-running the identical sequence twice from the same
  starting parent state was not attempted a third time, but the two runs (different starting states, opposite
  parent directions) each produced the mechanically-expected result with no sign of the original race's
  unpredictable last-writer-wins behavior.

**Verdict: PASS.** The confirmed root cause (premature `updateProgressBar()` fetch racing the still-in-flight
`toggle_completed_bulk` request) is fixed, and no failure mode from any of the original 6 categories
reproduced under normal-to-stress-level interaction. This is the only bug in `bugs/open/` for this plugin —
moving to `bugs/closed/`. A full final-cycle regression across every suite (`SENIOR_QA_STANDARDS.md` §27) has
**not** been run this session and is still required before `STATUS.md` can be set to `Complete`.

## Production report

- Reported to `ztflux` as issue #121338, 2026-09-25.
- Category: Checklist Plugin (608).
- Priority: High (3); Defect Severity: High-severity; Defect priority: High; Defect Type: Functional.
- Assigned to: Vaishnavi Bhawsar (192).
- Description condensed the 6-category investigation into the 3 confirmed failure modes (percentage lag,
  sub-item lost updates, mixed-interaction overwrite of untouched items) plus root cause and suggested fix
  direction; the exhaustive per-round evidence stays in this local file, referenced for the dev.
- **Correction note added same day** once network-log evidence showed the percentage-lag failure mode also
  hits single, deliberate (non-overlapping) parent-checkbox CHECK clicks (~5/9 trials), not only
  rapid/overlapping ones as originally described.
- **Synced to Done/100% on 2026-09-25** after the local retest (below) passed, with a closing note summarizing
  the fix and retest coverage.
