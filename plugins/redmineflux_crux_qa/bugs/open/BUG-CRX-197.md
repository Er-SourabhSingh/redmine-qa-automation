# Bug Report

- Bug ID: BUG-CRX-197
- Production Redmine Issue ID: #128753 (ztflux, flux.zehntech.com) — linked to Test Run #607 "Crux Run 2", Test Case #127778 (CRUX_AGENT_ROOT_CAUSE), Environment "Window 11 + Chrome", assigned to Prashant Chaurasia
- Title: Root-Cause Analyst collapses two reporter-offered candidate causes into one invented "race condition" theory instead of ranking them separately
- Redmine version: 6.0-bookworm
- Plugin name: redmineflux_crux (Ask Crux chat UI, Root-Cause Analyst agent)
- Plugin version: crux-core 0.130.0 (current local build, 2026-11-16)
- Environment: Local Docker, http://localhost:3015
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-16

## Steps to reproduce

1. Create a bug (#94, "dashboard totals intermittently stale") whose own journal comments genuinely offer TWO
   separate, independent candidate causes from the reporter, neither confirmed:
   - Comment 1: *"Could this be related to the caching layer change we made two weeks ago?"*
   - Comment 2: *"Actually it might also be the new background refresh job that was added recently..."*
2. Root-Cause Analyst pinned, ask: *"Root-Cause Analyst, what's causing issue #94?"*
3. Read the response's structure: does it rank the two candidates separately, or merge them into one?
4. Cross-check against the manifest's own stated output format: *"Several possible causes, if there are
   several, ranked."* and this suite's own TC-CRX-665 expectation: *"multiple candidates should be surfaced
   and ranked, not arbitrarily collapsed into a single confident pick when the real evidence doesn't actually
   single one out."*

## Expected result

Since the real evidence (2 separate, independent "could it be X... or maybe Y" comments from the reporter)
genuinely does not single out one cause, the response should present **two ranked candidates** — e.g. "most
likely: caching invalidation bug; also plausible: background-job scheduling drift" — not a single merged
verdict.

## Actual result

Crux replied: *"Probable cause (medium confidence): **Caching layer + background refresh job race condition**"*
— inventing a **third, more specific mechanism** (the two causes racing against each other) that **neither
original comment ever suggested**. The reporter offered two independent, alternative guesses ("could it be the
cache change... actually it might also be the background job..."); the agent re-framed these as components of
a single unified failure mode ("a race between two asynchronous processes") and presented that merged theory
with a specific confidence label, rather than ranking the two original candidates as separate possibilities per
the manifest's own "several possible causes... ranked" instruction.

This is a subtler variant of overconfident synthesis: rather than overstating confidence on a single candidate
(as in BUG-CRX-196), here the agent manufactures a *new*, more specific causal narrative by combining two
unconfirmed, independent guesses — which is itself an unverified claim (that the two mechanisms interact as a
"race condition") stated with the same unearned specificity the manifest's ranking instruction exists to avoid.

## Evidence

### Console / log

- Issue #94 journal (verbatim, via `redmineflux_core_get_issue(94, include="journals")`):
  - `[id=72] Redmine Admin: Could this be related to the caching layer change we made two weeks ago? That
    touched a lot of the dashboard aggregation queries.`
  - `[id=73] Redmine Admin: Actually it might also be the new background refresh job that was added recently —
    if it runs on a different schedule than the page load, the numbers could drift out of sync for a bit.`
- Chat reply (verbatim, headline): *"Probable cause (medium confidence): Caching layer + background refresh
  job race condition"* — followed by *"Two plausible causes offered by the reporter: [lists both]"* then a
  *"3. Intermittent nature... points to a timing/scheduling issue rather than a logic error — a race between
  two asynchronous processes"* — the race-condition framing is the agent's own synthesis, not present in
  either source comment.
- Persona file (`redmineflux-crux-core/agents/root-cause.md`, line 61, verbatim): *"Several possible causes,
  if there are several, ranked."*

## Duplicate check

- Duplicate found: No. Checked `bugs/_duplicates.md`/`bugs/_index.md`. Distinct from BUG-CRX-196 (filed same
  session, same agent) — that bug is about an overstated confidence *label* on a single candidate; this bug is
  about *merging two independent candidates into an invented combined theory* instead of ranking them
  separately, a different failure of the same underlying "don't overstate certainty" manifest principle.
