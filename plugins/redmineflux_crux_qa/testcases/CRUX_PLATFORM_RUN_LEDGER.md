# Test Suite — Crux Platform: Run Ledger

> Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §4. Plugin: redmineflux_crux. Redmine 6.0-bookworm,
> localhost:3015. URL: `/crux/runs`.
> TC range: TC-CRX-780 to TC-CRX-792.

## Fixtures needed

- At least 2 different agents, each with multiple runs, including a mix of Success/Failed/Degraded outcomes, to
  exercise both filters meaningfully.
- At least one Ask Crux chat answer, one @-mention reply, and one Improve wand suggestion, specifically to
  confirm all 3 are recorded as runs (per the dev reference's correction — this was wrongly assumed broken in an
  earlier draft of this repo's own features list).
- A run using a model unknown to Crux's own pricing table (if achievable) to test the "cost unpriced" case, else
  accept only the "(est)" positive case.

## Positive Cases

- **TC-CRX-780** — 4 summary tiles match the current filter: Runs (+ average duration), Succeeded "x / y" (%),
  Tokens (in·out), Cost — change the Agent/Outcome filters and confirm all 4 tiles recompute for the new filter,
  not just the table rows.
- **TC-CRX-781** — Agent filter: select a specific agent and confirm only that agent's runs show in the table and
  tiles.
- **TC-CRX-782** — Outcome filter: select Success/Failed/Degraded individually and confirm the table only shows
  matching runs.
- **TC-CRX-783** — Changing any filter resets to page 1 (verify by first navigating to page 2+, then changing a
  filter).
- **TC-CRX-784** — Table columns: When, Agent, What it did, Time, Tokens, Cost ("(est)" when estimated), Status —
  confirm each populates correctly for a known run.
- **TC-CRX-785** — Row click opens detail: Run id, Model, Tokens in/out, Tool calls, Note, and a working issue
  link.
- **TC-CRX-786** — Pager format and function: "← Prev / Page x of y (N runs) / Next →" — confirm Prev/Next
  navigate correctly and are disabled at the first/last page respectively.
- **TC-CRX-787** — Every chat interaction type is recorded as a run: confirm an Ask Crux answer, an @-mention
  reply, and an Improve wand suggestion each produce a new row in the ledger (this directly re-verifies the dev
  reference's §16 correction to this repo's earlier "0 runs recorded" assumption).

## Negative / Boundary Cases

- **TC-CRX-788** — Unknown model shows "cost unpriced": if a run used a model Crux has no pricing data for,
  confirm the Cost column shows "cost unpriced" rather than a fabricated $0.00 or a crash.
- **TC-CRX-789** — Known model shows "(est)": confirm a normal run's cost is marked "(est)" when it's derived
  from token counts rather than an exact billed amount.
- **TC-CRX-790** — Empty-filter state: select an Agent/Outcome combination with zero matching runs — confirm a
  clean "no runs match" state, not an error or a blank broken table.
- **TC-CRX-791** — URL-only model filter (no UI control): manually navigate to `/crux/runs.json?model=<name>` and
  confirm it returns a filtered JSON response, even though no UI element exposes this filter directly.
- **TC-CRX-792** — Cross-check against the Dashboard: confirm the Run ledger's totals for "today" are consistent
  with the Dashboard's own "Agent runs"/"Spent" stat cards (same underlying data, no discrepancy).

## Suite status

Drafted 2026-11-05, not yet executed. Source: `CRUX_DEV_FEATURE_REFERENCE_20261105.md` §4.
