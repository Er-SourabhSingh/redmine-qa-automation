# Test Suite — Crux Platform: Activity Log

> Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §11. Plugin: redmineflux_crux. Redmine 6.0-bookworm,
> localhost:3015. URL: `/crux/admin/logs` (admin only).
> TC range: TC-CRX-939 to TC-CRX-953.

## Fixtures needed

- Recent activity spanning at least 2 different real Component values (generate some by using chat and admin
  pages right before testing) — don't assume a fixed set, per the dev reference's correction.
- An action known to produce at least one WARN or ERROR-level log line (e.g. a deliberately wrong Core URL
  Test-connection attempt), to test Level filtering meaningfully.
- A specific, known activity id (copyable from one row) for the Activity id exact-match filter.

## Positive Cases

- **TC-CRX-939** — Level filter — minimum, not exact: set Level to WARN, confirm both WARN and ERROR rows show
  (it's a minimum threshold, not an exact match), and DEBUG/INFO rows are excluded.
- **TC-CRX-940** — Component filter options are dynamic: open the Component dropdown and confirm it lists
  whatever components core currently reports — do NOT assume a fixed 5-option list (this was wrongly assumed in
  an earlier draft of this repo's own features list, per dev reference §16).
- **TC-CRX-941** — Activity id exact-match filter: copy a real activity id from one row, paste it into the
  Activity id field, confirm only rows sharing that exact activity id are shown — useful for following one
  action across components.
- **TC-CRX-942** — Clicking "Act" on a row filters to that same activity id (equivalent shortcut to TC-941).
- **TC-CRX-943** — Free-text Search matches message substrings: search for a known substring from a real log
  message, confirm only matching rows show.
- **TC-CRX-944** — Limit control changes row count: switch between 50/200(default)/500 and confirm the number of
  rows returned changes accordingly (up to however many actually exist).
- **TC-CRX-945** — Auto-refresh (5s) is rememberable and pauses when the tab is hidden: enable it, confirm new
  rows appear without a manual refresh; switch to another browser tab and confirm (via a subsequent check) that
  it paused while hidden, then resumed on return.
- **TC-CRX-946** — Activity filter chip "act: … ✕" appears when an activity filter is active, and clicking ✕
  clears it.
- **TC-CRX-947** — Table columns: #, Time (hover shows full timestamp), Level, Component, Act (clickable),
  Session/run, Message.
- **TC-CRX-948** — Pager shows 25 per page.

## Negative / Boundary Cases

- **TC-CRX-949** — In-memory buffer, restarts clear it: note the footer text "In-memory buffer (last N records)
  — restarts clear it." — if a crux-core restart is feasible this session, confirm the log genuinely empties/
  resets after a restart (durable logs remain server-side in files, outside this UI).
- **TC-CRX-950** — No matches for a filter combination: combine a Level/Component/Search that matches nothing —
  confirm a clean "no matching entries" state, not an error.
- **TC-CRX-951** — Invalid/nonexistent Activity id: enter a made-up activity id — confirm a clean empty result,
  not a crash.
- **TC-CRX-952** — Non-admin cannot reach this page at all, regardless of Crux permissions held (cross-reference
  TC-CRX-721).
- **TC-CRX-953** — Changing any filter resets to page 1 (verify by navigating to page 2+ first, then changing a
  filter).

## Suite status

Drafted 2026-11-05, not yet executed. Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §11.
