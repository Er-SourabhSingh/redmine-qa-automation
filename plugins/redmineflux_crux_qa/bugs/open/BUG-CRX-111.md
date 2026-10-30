# Bug Report Template

- Bug ID: BUG-CRX-111
- Production Redmine Issue ID: #126601
- Title: create_project proposes/accepts identifiers (uppercase or purely numeric) that native Redmine's own validation rejects — the real failure only surfaces at confirm time, never caught or corrected upfront
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Project Setup Agent) / MCP tool `redmineflux_core_create_project`
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright) / direct source review
- User role: admin
- Date: 2026-10-30

## Steps to reproduce

1. Fresh chat, Project Setup Agent: "Create a project called 'Crux Project Setup Test E', identifier
   'CruxTestE'." (mixed-case identifier, explicitly given by the user)
2. Confirm.
3. Fresh chat: "Create a project called 'Crux Project Setup Test F', identifier '2026'." (purely numeric
   identifier)
4. Confirm.

## Expected result

Per the Project Setup Agent's own persona rule ("`identifier` must be lowercase letters/digits/hyphens...")
and the MCP tool's own docstring ("Unique project slug — lowercase letters, digits, hyphens"), an identifier
that violates this should either be corrected/lowercased with disclosure before ever being proposed, or at
minimum validated client-side before the confirm card is shown — not discovered only after the user clicks
Confirm.

## Actual result

**Both identifiers passed straight through to the confirm card unchanged** (`CruxTestE` and `2026`
respectively) with no warning, no correction, no disclosure that either would fail. Clicking Confirm on
each produced a genuine, real backend rejection both times:

> `write failed: tool 'redmineflux_core_create_project' failed: Error executing tool
> redmineflux_core_create_project: Validation error: Identifier is invalid Correct the value(s) above and
> try again.`

**Root-caused via direct source comparison, confirmed exactly matching the live behavior:**
- The MCP's own `validate_identifier` (`redmineflux-mcp/src/validation.py`):
  `_SAFE_ID_PATTERN = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9_-]*$")` — this is a general-purpose
  path-traversal/injection guard, not Redmine's real identifier rule. It allows uppercase letters and a
  purely numeric string, so it never rejects either test case.
- Native Redmine's own `Project` model (`app/models/project.rb`, confirmed via the running container):
  `validates_format_of :identifier, :with => /\A(?!\d+$)[a-z0-9\-_]*\z/` — lowercase only, AND explicitly
  rejects an all-digit identifier via the negative lookahead (`(?!\d+$)`).

So the MCP's client-side check is strictly looser than what the real Redmine backend will ever accept for a
project identifier specifically (the same generic validator is presumably reused across many different
`*_id`-shaped parameters, where it may be appropriate — but not here). The honest failure disclosure at
confirm time (no false success) is good and matches this repo's standing expectation, but the agent/tool
had every opportunity to catch this before ever showing the user a confirm card that was doomed to fail —
the user clicks Confirm, waits, and only then learns the exact identifier they or the agent proposed was
never valid in the first place.

## Evidence

### Console / log

- `CruxTestE` → `Validation error: Identifier is invalid Correct the value(s) above and try again.`
  (identical error for `2026`)
- `redmineflux-mcp/src/validation.py:12`: `_SAFE_ID_PATTERN = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9_-]*$")`
- Native Redmine `app/models/project.rb:84`: `validates_format_of :identifier, :with =>
  /\A(?!\d+\$)[a-z0-9\-_]*\z/, :if => proc {|p| p.identifier_changed?}`

## Duplicate check

- Duplicate found: No. First finding on the Project Setup Agent / `create_project` identifier handling.
  Same general "client-side check looser than server-side reality, surfaces as a confusing confirm-time
  failure" shape seen elsewhere in this repo (e.g. budget-hours validation gaps), but the first instance on
  project identifier validation specifically.
