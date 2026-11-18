# Bug Report Template

- Bug ID: BUG-CRX-205
- Production Redmine Issue ID: #128966 (reported 2026-11-18, assigned to Prashant Chaurasia, category Crux Plugin; linked via report_defect to Test Case #120493/Run #607 — no dedicated production TC exists for the Project Setup Agent, so this was attached to the closest tracked Crux TC per repo convention; the TC was already Failed from the unrelated BUG-CRX-204, so this attachment did not change its status)
- Title: Project Setup Agent never discloses "the Work Package follows once it exists" (its own documented rule) when the tracked deliverable isn't yet an existing numbered ticket — two uncovered trigger paths of the closed BUG-CRX-110/114
- Redmine version: 6.0-bookworm
- Plugin name: redmineflux_crux
- Plugin version: 0.98.0 (crux-core 747af39)
- Environment: localhost:3015 (local Docker)
- Browser: Chromium (Playwright MCP)
- User role: admin
- Date: 2026-11-18

## Steps to reproduce

Executing TC-CRX-434 (re-tested after BUG-CRX-114 was confirmed fixed, per CLAUDE.md §26's BLOCKED-TC
re-execution rule):

1. Fresh chat, Project Setup Agent. Sent (combined, one message): "Create a project called 'Crux Project
   Setup Test K' and I want the onboarding guide tracked as a work package too — outline review, then a
   final sign-off."
2. Confirmed the resulting confirm card — it contained ONLY the project creation (`Name`, `Identifier`,
   `Description`). No mention anywhere of the work-package/onboarding-guide intent — no clarifying
   question, no disclosure that part of the request would not be fulfilled.
3. Explicit follow-up in the same chat: "Now track the onboarding guide as a work package too — outline
   review, then a final sign-off." (no existing issue number given yet, matching how a real user would
   ask before any ticket exists).
4. Confirm card proposed a plain `Create issue` ("New issue: Onboarding Guide") — not
   `crux_create_work_package` — the exact substitution shape BUG-CRX-114 was originally filed for.
5. Cancelled; created the ticket manually instead ("Create a ticket for the onboarding guide in that
   project first.") → issue #146 created.
6. Explicit follow-up naming the real issue number: "Now track issue #146 as a work package — it needs an
   outline review before drafting, and a final sign-off before it's done." → **this time** correctly
   proposed `crux_create_work_package` with `Type: document`. Confirmed; native-verified via
   `/crux/work_packages` — the WP genuinely exists, "Agent is working on: Clarify / Then: your approval of
   the outline," matching the `document` template's `clarify→outline→draft→review→finalize` pipeline.

## Expected result

Per `redmineflux-crux-core/agents/project-setup.md` (persona file, read in full as part of this retest,
"How you work" step 4, the exact line this TC and BUG-CRX-114 are both grounded in):

> "It tracks existing tickets. `members` are ticket ids. For a ticket that's being created in the same
> message, propose the project and ticket now and say the Work Package follows once they exist; when the
> ticket already exists ("track #22 as a work package"), call `crux_create_work_package` right away."

So for a deliverable that doesn't exist as a ticket yet, the documented-correct behavior is NOT to call
`crux_create_work_package` immediately — it is to (a) propose the ticket now and (b) **explicitly say a
Work Package will follow once it exists**. Silence on the WP half is itself the violation, not merely
"not calling the tool yet."

## Actual result

- **Step 2 (bundled request):** neither half of this rule was followed — no ticket was proposed, and there
  was no disclosure that a Work Package would follow. The entire WP/ticket intent was dropped with zero
  trace, not deferred-with-disclosure. Same silent-drop mechanism as the closed BUG-CRX-110 (team-member
  request dropped when bundled with project creation) and the closed BUG-CRX-185 (starter-task dropped the
  same way), but on a third, distinct bundled element (work-package tracking) that neither of those fixes'
  retests ever covered.
- **Step 4 (no issue number yet):** the agent correctly proposed creating the ticket (`create_issue`) —
  that half of the documented rule held — but never said anything resembling "a Work Package will follow
  once this exists," the explicit disclosure the persona file requires. From the user's side this is
  indistinguishable from the tool substitution BUG-CRX-114 was originally filed for, since no path to the
  WP is visible anywhere in the reply — but the more precise, spec-grounded framing is a missing mandatory
  disclosure, not merely "wrong tool called." BUG-CRX-114's own retest (see `bugs/closed/BUG-CRX-114.md`)
  always gave an existing issue number ("Track issue #1 as a work package...") — this specific "deliverable
  doesn't exist as a ticket yet" trigger path, and its documented disclosure requirement, was never
  exercised by that fix's verification.
- Step 6 proves the underlying `outcome_type` resolution itself is correct (document vs. software) once
  the tool is actually reached — this bug is purely about the **disclosure step before** reaching
  `crux_create_work_package`, not about picking the wrong template once there.

## Evidence

### Console / log

- Step 2 confirm card (verbatim fields): `Name: Crux Project Setup Test K`, `Identifier:
  crux-project-setup-test-k`, `Description: Project for onboarding guide with document review and
  sign-off workflow.` — no WP-related field anywhere.
- Step 4 confirm card: `Create issue` / `New issue: Onboarding Guide`, `Project: Crux Project Setup Test
  K`, `Subject: Onboarding Guide`, `Description: Create a comprehensive onboarding guide for new team
  members.` — a plain issue, not a work package.
- Step 6 confirm card (correct): `Goal: Complete the onboarding guide with structured review gates.`,
  `Tickets: #146`, `Type: document`, `Autonomy: execute-with-approval`. Confirmed; native-verified via
  `/crux/work_packages`: "Agent is working on: Clarify / Then: your approval of the outline" for `#146
  Onboarding Guide`.

## Duplicate check

- Duplicate found: No.
- Existing bug reference: Related to, but not a duplicate of, the closed BUG-CRX-110 (team-member request
  silently dropped when bundled with project creation — fix verified only for that one bundled element)
  and the closed BUG-CRX-114 (work-package tool never genuinely called — fix verified only when an
  existing issue number was already given). This is the same two underlying defect classes recurring on
  trigger paths neither fix's own retest covered (a third bundled element for 110's class; a
  "deliverable isn't a ticket yet" path for 114's class) — filed as a new bug per this repo's established
  precedent for such recurrences (see BUG-CRX-185's own duplicate-check entry for the same reasoning
  pattern). Grounded directly in the persona file's own current text (`agents/project-setup.md`, "How you
  work" step 4) rather than inferred expected behavior — the spec explicitly requires disclosing "the Work
  Package follows once they exist," which neither repro step did.

## Retest — 2026-11-18 (FIXED — developer marked "In QA", production #128966)

Developer moved 12 bugs to "In QA." Pulled latest code, rebuilt crux-core/mcp, restarted redmine (see
BUG-CRX-204's Retest section for full infra details, shared across this batch). Re-ran both original
repros with Project Setup Agent pinned, fresh project ("Crux Project Setup Retest 205"):

- Repro 1 (combined "create a project... and track the onboarding guide as a work package too"): the
  agent now proposes a 2-step plan (Create project + Create issue) AND explicitly discloses the WP-follows
  rule in text.
- Repro 2 (standalone follow-up, no existing ticket): the agent no longer silently proposes a bare
  create_issue -- it now asks a clarifying question explicitly naming the work-package intent.

Conclusion: FIXED. Both previously-silent trigger paths now carry the documented "WP follows once it
exists" disclosure. Moved to bugs/closed/, production #128966 synced In QA -> Done.
