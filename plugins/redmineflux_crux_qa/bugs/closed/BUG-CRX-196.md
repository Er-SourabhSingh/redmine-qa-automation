# Bug Report

- Bug ID: BUG-CRX-196
- Production Redmine Issue ID: #128752 (ztflux, flux.zehntech.com) — linked to Test Run #607 "Crux Run 2", Test Case #127778 (CRUX_AGENT_ROOT_CAUSE), Environment "Window 11 + Chrome", assigned to Prashant Chaurasia
- Title: Root-Cause Analyst declares "high confidence" for a timing-only/cross-issue-inferred cause that the agent's own manifest defines as "medium"
- Redmine version: 6.0-bookworm
- Plugin name: redmineflux_crux (Ask Crux chat UI, Root-Cause Analyst agent)
- Plugin version: crux-core 0.130.0 (current local build, 2026-11-16)
- Environment: Local Docker, http://localhost:3015
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-16

## Steps to reproduce

1. Create a bug (#90, "empty CSV export") with NO comment of its own stating a cause, only a nearby, separately-
   filed issue (#91) documenting a deployment just before #90 was reported.
2. Root-Cause Analyst pinned, ask: *"Root-Cause Analyst, what's causing issue #90 (empty CSV export)?"*
3. Read the confidence level stated and the evidence cited.
4. Cross-check against the agent's own persona file (`redmineflux-crux-core/agents/root-cause.md`), which
   explicitly defines: *"**high** (a direct link, such as a linked commit or a confirmed comment), **medium**
   (a strong timeline match), or **low** (a guess worth checking)."*

## Expected result

Since #90 itself has no direct link, linked commit, or confirmed comment stating the cause — only a timeline
correlation with #91's deployment, plus an inferred similarity to a different issue's (#93) already-confirmed
cause — the manifest's own rule requires this to be stated as **medium** confidence, not high.

## Actual result

Crux replied: *"Probable cause (**high confidence**): Off-by-one boundary error in the export worker's
pagination logic"* — citing only: (1) a timeline match with #91's deployment, and (2) an inference that #93's
already-traced root cause ("missing last row" due to an off-by-one boundary bug) *also* explains #90's
completely different symptom ("entirely empty CSV"), introducing its own speculative "Mechanism" step: *"This
same boundary bug **could** cause an entirely empty CSV **if** the export has exactly one page of data **and**
the fetch condition fails to include any rows at all — **or if** the pagination logic fails to execute even
the first batch..."* — three stacked hedging conditionals ("could... if... and... or if..."), yet the headline
confidence is "high."

None of the cited evidence is a direct link/commit/confirmed comment *on #90 itself* — it is entirely a timeline
correlation plus a speculative mechanism borrowed from a different issue's confirmed cause. Per the manifest's
own explicit definition, this is exactly the "medium" case (strong timeline match, no direct link), not "high."
This is a confidence-calibration violation — the agent's own evidence (including its own hedged "could... if...
or if..." language) contradicts the certainty of the headline it assigns.

## Evidence

### Console / log

- Chat reply (verbatim, headline): *"Probable cause (high confidence): Off-by-one boundary error in the export
  worker's pagination logic"*
- Evidence cited (verbatim): *"1. Timeline match: Issue #91... documents the deployment... immediately before
  users started reporting empty CSVs in #90... 2. Related symptom, same root cause: Issue #93... The Root-Cause
  Analyst already traced this to an off-by-one boundary error... 3. Mechanism: This same boundary bug could
  cause an entirely empty CSV if the export has exactly one page of data and the fetch condition fails to
  include any rows at all — or if the pagination logic fails to execute even the first batch when conditions
  are met. 4. Confirmation already documented: Issue #93's journal entry confirms high-confidence root-cause
  analysis..."*
- Persona file (`redmineflux-crux-core/agents/root-cause.md`, line 43-45, verbatim): *"State it with
  confidence: **high** (a direct link, such as a linked commit or a confirmed comment), **medium** (a strong
  timeline match), or **low** (a guess worth checking)."*
- #90 itself has zero comments/journal entries of its own stating any cause — confirmed via
  `redmineflux_core_get_issue(90, include="journals")`.

## Duplicate check

- Duplicate found: No. Checked `bugs/_duplicates.md`/`bugs/_index.md` — no prior bug about Root-Cause Analyst's
  confidence-level calibration. This suite's own "Core checks executed" section (file header) covered a genuine
  high-confidence direct-comment case (TC-660/662, correct) and an honest-capability-denial case (TC-666,
  correct); this is the first execution of the medium-confidence timing-only comparison case (TC-661), and it
  fails the exact high/medium boundary that TC-660/661 were designed as a paired comparison to verify.

## Retest — 2026-11-17 (CONFIRMED FIXED)

Developer moved this to "In QA" on production. Pulled latest code — `redmineflux-crux-core` picked up CRC-113
"answers-match-what-was-read" with a direct change to `agents/root-cause.md` itself. Rebuilt/restarted the
stack, verified healthy.

Re-ran the exact original repro: "Root-Cause Analyst, what's causing issue #90 (empty CSV export)?" Reply now
reads: *"Probable cause (**medium confidence**): Off-by-one pagination error in the new async CSV export
worker v2."* — and the agent now explicitly explains its own confidence choice: *"(Confidence set to medium
by Crux: #90 has no linked commit and no comment confirming the cause. High needs a direct link on the bug
itself.)"* This matches the manifest's own high/medium rule exactly, and the explicit self-check footnote is
new behavior directly addressing this bug's root cause. **Confirmed FIXED.**
