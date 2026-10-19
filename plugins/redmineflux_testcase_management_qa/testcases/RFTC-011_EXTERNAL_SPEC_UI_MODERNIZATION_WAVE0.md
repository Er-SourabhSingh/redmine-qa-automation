> ⚠️ **EXTERNAL SOURCE — DO NOT MERGE WITH THIS PLUGIN'S OWN TC-TCM-xxx SUITES, AND SEPARATE FROM THE V1 CYCLE
> FILE** ⚠️
>
> Covers **production feature #121879** ("rftc-011 — TCM UI modernization", **Wave 0 only** — the full
> design-system migration is multi-wave, future work, still "In Progress" at 30% done-ratio, NOT part of this
> release's "In QA" set). Part of **Testcase Management plugin Release 7.2.0**.
>
> **ID prefix**: `RFTC011-<n>`. **Executed**: 2026-10-19, same environment as `RFTC-020`/`021`/`044`.

# Test Cases — Redmineflux Testcase Management — rftc-011 Wave 0 (link color + CSS scope leak)

## Feature summary

Wave 0 of the UI modernization effort: (1) a link hover color that was too low-contrast (an alpha-hex value) is
now a resolved, readable solid hex; (2) a plugin-only layout rule (`#main{flex-grow:2;...}`) that was unscoped and
leaking onto **every** Redmine page is now scoped to only the plugin's own controllers.

---

### RFTC011-1: Plugin layout CSS no longer leaks onto non-plugin pages

**Priority:** P1 — this is a real regression-risk class of bug (global ID selector, `#main`, affecting the entire
app)
**Steps:** Compare the computed style of `#main` on a plugin page (`/test_suites?project_id=...`) vs. a
non-plugin page (`/projects/.../issues`) in the same session.
**Expected Result:** The plugin's `flex-direction:row` rule applies **only** on the plugin's own controllers;
a non-plugin page should show Redmine core's own native layout behavior instead.
**Actual Result:** PASS. Plugin page (`body.controller-test_suites`): `flex-direction: row` (plugin rule
applied, as intended). Non-plugin page (`body.controller-issues`): `flex-direction: row-reverse` (Redmine core's
own default — proves the plugin rule is genuinely scoped out here, not just visually similar by coincidence).
Source-confirmed: `testcase_style.css` now reads
`.controller-test_suites #main,.controller-runs #main,...,.controller-testcase_help #main{flex-grow:2;...}` — an
explicit controller allowlist, not a bare `#main` selector.

---

### RFTC011-2: Link hover color is now a resolved, readable solid color

**Priority:** P2 (accessibility)
**Steps:** Read the computed value of the `--rf-accent-hover` CSS custom property.
**Expected Result:** A solid, readable hex value — not the previous alpha-channel value (`#0094ffc7`, which
rendered as a washed-out, low-contrast blue).
**Actual Result:** PASS. `getComputedStyle(document.documentElement).getPropertyValue('--rf-accent-hover')` →
`#0077CC` — a real darkened solid hex, matching the commit's own stated fix.

---

## rftc-042 / rftc-043 — Testing Harness & Security Scanning (light verification only)

Both are **Task**-tracker, internal dev-tooling work living in the separate `redmineflux-tcm-ci` repo (SAST/DAST/
dependency scanning, mutation testing, accessibility/visual-regression/load checks) — not plugin features an
end-user interacts with directly, so standard positive/negative UI test cases don't apply. Verification here is
limited to spot-checking the **plugin-side side effects** the dev's own journal claims these efforts produced:

- **Accessibility fixes** (faint link color, screen-reader-unreadable buttons/links) — the link-color half is
  independently confirmed above (RFTC011-2); the broader screen-reader/button fixes were not separately probed
  with an actual screen reader or axe-core run this session.
- **N+1 query / concurrent-load fix** ("a page that got noticeably slow when two people loaded it at the same
  time") — likely the Reports or Test Suite tree page per the `1bd95ec`/`378df54` commits seen in `git log`
  ("Make the test-suite tree load much faster under multiple users at once", "Clean up the Reports page so it
  loads lighter"). Not independently load-tested this session (would need a multi-session concurrency harness,
  out of scope for a same-day release sign-off); accepted on the strength of the dev's own disclosed before/after
  description.
- The harness's own six-layer checks (SAST, dependency/secret scanning, mutation testing, fuzzing, etc.) are
  **not re-run or independently re-verified here** — that would mean re-implementing the harness's own test
  suite, which is out of scope for this plugin's QA cycle. The dev's journal is unusually transparent about
  partial gaps (mutation testing needs fuller setup; one fuzzer doesn't install on this OS, worked around) rather
  than claiming blanket completion, which is itself a positive signal for this being a trustworthy self-report
  rather than something requiring independent re-verification under today's time constraint.

**No bugs found** in either the Wave 0 UI fixes or the dev-tooling side effects spot-checked above.

## Coverage Summary

**rftc-011 Wave 0: 2/2 executed scenarios PASS.** rftc-042/043: light verification only, consistent with their
nature as internal dev tooling rather than user-facing plugin features; no independent deep testing performed,
no bugs found in what was checked.
