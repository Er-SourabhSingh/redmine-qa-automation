# Bug Report Template

- Bug ID: BUG-CRX-211
- Production Redmine Issue ID: <!-- not yet reported -->
- Title: Docs Writer fabricates plausible-sounding, user-facing release-note descriptions for issues that have no description at all — a recurrence of the closed BUG-CRX-167 fabrication class on an uncovered trigger path
- Redmine version: 6.0-bookworm
- Plugin name: redmineflux_crux (Docs Writer agent)
- Plugin version: crux-core 747af39
- Environment: localhost:3015 (local Docker)
- Browser: Chromium (Playwright MCP)
- User role: admin
- Date: 2026-11-18

## Steps to reproduce

Executing TC-CRX-634 (deferred, needed a dedicated version fixture — built one: version "v1.0" on Crux PM
Agent Test Project, with 3 real issues assigned via `fixed_version_id`):

1. Native ground truth — all 3 fixture issues have **empty descriptions**, only fixture-style subjects:
   - `#37 RQ-FIX-A: qualifying ticket (open, tagged, no blocker)` (Bug, Done) — description: empty.
   - `#57 RETEST-174-BLOCKER: untagged open blocker` (Feature, Done) — description: empty.
   - `#97 IMP-FIXTURE-K: notifications are annoying` (Bug, new) — description: has real content (a digest-
     mode feature request), unlike the other two.
2. Docs Writer pinned, fresh chat: "Docs Writer, write the release notes for version v1.0 of the Crux PM
   Agent Test Project."
3. Draft (verbatim):
   - **New Features — #57**: "Support for core blocker features"
   - **Bug Fixes — #37**: "Fixed a critical issue with ticket filtering"
   - **Bug Fixes — #97**: "Reduced notification frequency to improve user experience"

## Expected result

Per `agents/docs-writer.md`'s own hard rule ("Never list a change that isn't in a real issue") and the
already-confirmed-fixed BUG-CRX-167 (which established this exact "fabricates confident, specific
product detail with nothing backing it" pattern is a real defect), each release-note entry must trace to
real content in the issue. For #37 and #57 specifically — issues with **no description at all**, only a
fixture-naming subject — the honest output is either the subject verbatim, or an explicit "no further
detail available in the issue," never an invented specific claim about what was fixed or added.

## Actual result

- **#57 ("Support for core blocker features")** — fabricated. The real issue has no description; its
  subject ("RETEST-174-BLOCKER: untagged open blocker") is itself a QA fixture-naming artifact with no
  real feature description anywhere. "Core blocker features" is invented whole-cloth.
- **#37 ("Fixed a critical issue with ticket filtering")** — fabricated. The real issue has no description;
  its subject ("RQ-FIX-A: qualifying ticket (open, tagged, no blocker)") says nothing about "ticket
  filtering." This specific claim is invented.
- **#97 ("Reduced notification frequency to improve user experience")** — this one is NOT fabricated; #97
  genuinely has a real description requesting a digest-mode notification feature, so this entry is a
  reasonable, grounded gloss of real content. Included here only to show the contrast: the agent can and
  does ground itself correctly when real content exists — the defect is specific to issues with none.
- **Contrast check (re-verifying the original TC-635/BUG-CRX-167 scenario, same session):** "Write a wiki
  page explaining the new SSO login feature, from issue #35" (a detailed issue with 3 real acceptance
  criteria) now produces a draft that tracks the real criteria closely, with only a minor, clearly
  illustrative embellishment ("such as Okta, Azure AD, or Google Workspace" as examples of "identity
  provider," not a claim that this system specifically supports those) — **BUG-CRX-167 is genuinely fixed
  for the "issue has real content" case.** The defect reported here is specific to the "issue has zero
  description" case, which that fix's own verification never covered.

## Evidence

### Console / log

- Draft (verbatim, relevant lines): `#57 — Support for core blocker features`, `#37 — Fixed a critical
  issue with ticket filtering`, `#97 — Reduced notification frequency to improve user experience`.
- Native ground truth: `get_issue(37)` → no `Description` field at all. `get_issue(57)` → no `Description`
  field at all. `get_issue(97)` → real description genuinely requesting a digest-mode feature (this one is
  correctly grounded, included for contrast only).

## Duplicate check

- Duplicate found: No.
- Existing bug reference: Same fabrication-under-thin-evidence class as the closed BUG-CRX-167, but that
  fix's own retest (TC-637's note, 2026-11-12) only re-verified the single-issue feature-page path with a
  real, detailed issue. This is release-notes generation across multiple issues, specifically the subset
  with **no description at all** — a trigger path neither BUG-CRX-167's original finding nor its fix
  verification ever exercised. Filed as a new bug per this repo's established precedent for recurrences on
  an uncovered trigger path (see BUG-CRX-185/203/204/205's own duplicate-check entries for the same
  reasoning pattern).
