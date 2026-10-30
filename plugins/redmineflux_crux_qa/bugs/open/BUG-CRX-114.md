# Bug Report Template

- Bug ID: BUG-CRX-114
- Production Redmine Issue ID: #126604
- Title: Project Setup Agent never calls crux_create_work_package for genuinely WP-shaped requests — substitutes a plain issue, then falsely claims the tool "doesn't have a built-in way to define multiple sequential gates" when the chosen outcome_type template already provides exactly those gates
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Project Setup Agent)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-10-30

## Steps to reproduce

1. Fresh chat, Project Setup Agent: "Create a project called 'Crux Project Setup Test J' and track the
   mobile sign-in feature as a work package — it needs a plan review before dev starts and a QA holdout
   before it ships." → agent proposed only project creation + a plain `create_issue` (Feature tracker),
   with the gate requirements folded into the issue's free-text description — never a
   `crux_create_work_package` call. Cancelled.
2. Retried more directly, fresh chat: "Create a work package to track the mobile sign-in feature in the
   Crux Project Setup Test J project — it needs a plan review gate before development and a QA holdout gate
   before release." → correctly noted the project doesn't exist yet and asked which issue tracks the work
   (reasonable so far).
3. "Use the existing 'Crux Project Setup Test H' project, create a new ticket for the mobile sign-in
   feature first, then track it as the work package." → created issue #22 (confirmed, DB-verified) but
   stopped there — never proposed the Work Package itself.
4. "Now track issue #22 as a work package, with a plan review gate before development and a QA holdout gate
   before release." → still no `crux_create_work_package` proposal.

## Expected result

Per the tool's own schema (`crux_create_work_package` in `proposals.py`), `outcome_type: "software"` maps to
a pipeline template (`templates.py`) whose stages are
`clarify → plan → develop → test → holdout → review → deliver`, with built-in gates `requirements-approve`
(before plan), `plan-approve` (before develop), and `deploy-approve` (before deliver) — this is EXACTLY the
"plan review before dev starts" and "QA holdout before it ships" shape the user described in every attempt
above. The correct call is simply `crux_create_work_package(goal="...", members=[22], outcome_type:
"software")` — no custom gate parameters needed or available, because the gates are baked into the template,
not passed per-call.

## Actual result

The agent never attempted `crux_create_work_package` in any of the 4 attempts above. On the most explicit,
unambiguous final attempt (step 4 — naming the exact issue id and restating the exact gate language), it
responded with an inaccurate explanation:

> *"I need to clarify the work package structure. The Work Package tool I have available supports a single
> autonomy level (suggest-only, execute-with-approval, or autonomous) and an outcome type, but it doesn't
> have a built-in way to define multiple sequential gates like 'plan review before development' and 'QA
> holdout before release.' However, I can propose a work package that tracks issue #22 with
> execute-with-approval autonomy, which creates a checkpoint before the work is marked complete. That's one
> approval gate. Option 1: Create the work package with execute-with-approval (gates completion approval),
> and document the additional 'plan review' and 'QA' gates as stages in the issue description or comments —
> you'd manage those manually in Redmineflux. Option 2: Check if there are other Redmineflux plugins
> available..."*

This is factually wrong, confirmed via direct source review (`redmineflux-crux-core/crux_core/workflows/
templates.py`): the `software` outcome_type template already has a `plan-approve` gate (`before_stage:
"develop"`) and a `holdout` pipeline stage before `review`/`deliver` — precisely the two checkpoints the user
asked for, in both of their own words. The agent incorrectly concluded the tool "doesn't have a built-in
way" to do this and proposed manual, outside-the-tool workarounds (writing gates into a description/comment,
or looking for an entirely different plugin) instead of simply selecting the correct `outcome_type` that
already does it. Across all 4 attempts in this QA session, `crux_create_work_package` was never once
genuinely proposed — a real gap in this agent's own flagship capability (proposing Work Packages is one of
only 7 tools it has, and one of its two core advertised outputs per its own persona Identity line).

## Evidence

### Console / log

- `crux_core/workflows/templates.py` (`TEMPLATES["software"]`): `"pipeline": ["clarify", "plan", "develop",
  "test", "holdout", "review", "deliver"]`, `"gates": [{"id": "requirements-approve", "before_stage":
  "plan", ...}, {"id": "plan-approve", "before_stage": "develop", ...}, {"id": "deploy-approve",
  "before_stage": "deliver", ...}]`.
- Verbatim final response quoted in full above, claiming no built-in way to define the gates the user
  described — directly contradicted by the template definition.
- `crux_create_work_package`'s own schema (`proposals.py`) has no "gates" parameter at all — gates are
  entirely determined by `outcome_type`, which the agent never attempted to leverage correctly.

## Duplicate check

- Duplicate found: No. First finding on the Project Setup Agent's Work Package proposal judgment
  (TC-CRX-433/434 area) — a distinct capability (crux_create_work_package) from the project/issue creation
  bugs already filed this session (BUG-CRX-110/111/112/113).
