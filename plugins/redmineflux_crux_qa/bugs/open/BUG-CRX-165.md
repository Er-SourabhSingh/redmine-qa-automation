# Bug Report Template

- Bug ID: BUG-CRX-165
- Production Redmine Issue ID: #127802
- Title: Reviewer Agent outputs a formal "BLOCK" verdict for an issue with no written acceptance criteria,
  directly contradicting its own manifest's explicit rule ("No criteria, no verdict")
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Reviewer agent)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-04

## Steps to reproduce

1. Create a real fixture issue (#34, "Reviewer Fixture: Improve dashboard loading speed") with a plain, vague
   description and **no** "Acceptance Criteria" / "Definition of done" section anywhere.
2. As `admin`, Reviewer agent pinned: "Review issue #34 against its acceptance criteria."

## Expected result

Per the Reviewer's own manifest (`redmineflux-crux-core/agents/reviewer.md`, "How you review", step 2): *"No
criteria, no verdict. If the issue has no written criteria, say so plainly and list what you would need.
Never invent criteria."* The response should explicitly withhold a PASS/BLOCK verdict and instead state that
no criteria exist, listing what's needed to review it.

## Actual result

The response opened with a formal, labeled **BLOCK** verdict: *"**BLOCK** Issue #34 has no acceptance criteria
defined in its description. Without a written spec to judge against, the review cannot proceed. Return to the
Work Package author to document the acceptance criteria before submitting for review."*

While the underlying message is reasonable and honest (it correctly identifies there are no criteria and
doesn't invent any), labeling this outcome **BLOCK** is a direct, literal contradiction of the manifest's
explicit instruction that a no-criteria issue should produce **no verdict at all**, not any specific
PASS/BLOCK label. This matters because BLOCK is specifically defined elsewhere in the same manifest as "one
unmet criterion is a BLOCK" — conflating "no criteria exist to judge" with "a criterion was judged and found
unmet" blurs a distinction the manifest itself draws carefully, and could mislead downstream automation or a
human skimming only the bolded verdict word into treating this the same as a real, judged failure.

## Evidence

### Console / log

- Response (verbatim): *"**BLOCK** Issue #34 has no acceptance criteria defined in its description. Without a
  written spec to judge against, the review cannot proceed. Return to the Work Package author to document the
  acceptance criteria before submitting for review."*
- Fixture issue #34's real description (verbatim, confirmed via native UI): "The dashboard feels slow for some
  users. Please look into making it load faster." — genuinely no criteria/DoD section anywhere.
- Manifest text (`redmineflux-crux-core/agents/reviewer.md`, "How you review" #2, verbatim): *"No criteria, no
  verdict. If the issue has no written criteria, say so plainly and list what you would need. Never invent
  criteria."*

## Retest — 2026-11-04 (crux-core 0.150.0, post-rebuild per AGENT-TEST-GUIDE.md §0)

Repro re-run verbatim in a fresh chat (`ses-395`), Reviewer pinned, against the same real fixture (issue #34,
still has no acceptance-criteria section). **Still reproduces — not a stale-build artifact.** Response (verbatim):

*"**BLOCK** [table: Criterion "Acceptance criteria defined" | Status "Not met" | Evidence "No written acceptance
criteria, checklists, or requirements in the issue description."] The issue has no acceptance criteria. I
cannot judge whether the work is complete without knowing what success looks like... I need a clear criteria
section to review this. Request the issue author to add one of the following: ..."*

Arguably slightly worse than the original finding: the new response now also renders a formal criterion/status
table that frames "no criteria exist" as a judged-and-failed criterion ("Acceptance criteria defined → Not
met"), which is an even more literal blurring of "no criteria to judge" vs. "a real criterion was judged and
found unmet" than the original bolded-word-only BLOCK label was. Manifest rule ("No criteria, no verdict...")
is still being violated. Confirmed genuine, persistent defect — proceeding to file to production per §5 (pending
approval).

## Duplicate check

- Duplicate found: No. First finding on the Reviewer agent's no-criteria handling specifically. Distinct from
  BUG-CRX-163 (misread relation data) and BUG-CRX-164 (platform-wide tool-registration gap) — this is a pure
  verdict-labeling/manifest-compliance issue on an otherwise-correct, honest response, not a data-reading or
  tool-availability defect.
