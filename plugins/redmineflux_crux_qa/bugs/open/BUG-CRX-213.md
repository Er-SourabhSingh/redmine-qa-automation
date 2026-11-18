# Bug Report Template

- Bug ID: BUG-CRX-213
- Production Redmine Issue ID: #128975 (reported 2026-11-18 as a standalone issue — no dedicated production test case exists for the Docs Writer agent's own suite, assigned to Prashant Chaurasia, category Crux Plugin)
- Title: Docs Writer fabricates a nonexistent version ("v2.0," wrong due date) when listing a project's real versions to ask which one the user means
- Redmine version: 6.0-bookworm
- Plugin name: redmineflux_crux (Docs Writer agent)
- Plugin version: crux-core 747af39
- Environment: localhost:3015 (local Docker)
- Browser: Chromium (Playwright MCP)
- User role: admin
- Date: 2026-11-18

## Steps to reproduce

Executing TC-CRX-641 (deferred, needed a multi-version fixture — created one: "Crux PM Agent Test
Project" now has 2 real versions):

1. Native ground truth: `redmineflux_core_list_versions(project_id)` →
   `id=1: v1.0 (open, due: 2026-12-31)`, `id=2: v1.1 (open, due: 2027-03-31)`. Only these 2 versions
   exist.
2. Docs Writer pinned, fresh-ish chat (same chat as TC-634/636/638/640, continuing): "Docs Writer, write
   the release notes for the Crux PM Agent Test Project." (no version named).
3. Response (verbatim): *"I need to know which version of the Crux PM Agent Test Project you'd like
   release notes for. The project has these versions: v1.0 (open, due December 31, 2026), **v2.0 (open,
   due January 31, 2027)**. Which one would you like me to write release notes for?"*

## Expected result

Per this TC's own expectation ("asks which version rather than guessing") and the manifest's "Never list a
change that isn't in a real issue" principle (extended to any real-data listing, not just issues) — the
agent correctly asked rather than guessing, but the list of versions it presented as the real options must
itself be accurate. Both listed versions should match `list_versions`'s real output exactly.

## Actual result

- The first listed version (`v1.0`, due December 31 2026) is correct, matching the real data exactly.
- The **second listed version is entirely fabricated**: `v2.0 (open, due January 31, 2027)` does not exist
  anywhere in this project. The real second version is `v1.1`, due `2027-03-31` — neither the name nor
  the due date matches what was presented.
- This is a more severe shape than a simple "didn't call the tool" gap: the agent genuinely called
  `list_versions` (per context, it successfully read and correctly reported the real `v1.0`), then
  presented a second, invented entry alongside the real one as if both came from the same real lookup —
  making the fabrication much harder for a user to spot than an outright capability denial would be.
- If a user had picked the fabricated "v2.0" from this list, the agent would have had no real version to
  write notes for at all.

## Evidence

### Console / log

- Response (verbatim): `"I need to know which version of the Crux PM Agent Test Project you'd like
  release notes for. The project has these versions: v1.0 (open, due December 31, 2026), v2.0 (open, due
  January 31, 2027). Which one would you like me to write release notes for?"`
- Native ground truth: `redmineflux_core_list_versions(project_id="crux-pm-agent-test-project")` →
  `id=1: v1.0 (open, due: 2026-12-31)`, `id=2: v1.1 (open, due: 2027-03-31)` — "v2.0" does not exist at
  all, and the real second version's due date (`2027-03-31`, i.e. March) does not match the fabricated
  "January 31, 2027."

## Duplicate check

- Duplicate found: No.
- Existing bug reference: Same general fabrication-under-real-tool-access shape as BUG-CRX-211 (this
  suite's own release-notes-from-thin-evidence finding) and the historical BUG-CRX-167 class, but a
  distinct and more severe failure mode — those fabricated *descriptions* of real issues; this fabricates
  an entirely nonexistent *version* presented alongside a genuinely real one, in what's meant to be an
  honest disambiguation list. First finding of fabrication on the version-listing path specifically.
