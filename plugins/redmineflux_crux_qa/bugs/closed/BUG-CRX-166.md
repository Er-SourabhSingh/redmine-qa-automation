# Bug Report Template

- Bug ID: BUG-CRX-166
- Production Redmine Issue ID:
- Title: Test Author Agent outputs raw, fabricated Python/Selenium/pytest automation code instead of
  human-readable test cases, inventing a specific tech stack, URLs, element IDs and module paths that the
  source issue never states
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Test Author agent)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-04

## Steps to reproduce

1. Create a real fixture issue (#35, "Reviewer Fixture: Add SSO login") with 3 plain-English acceptance
   criteria (a button appears, a redirect+session flow works, a failed attempt shows a clear error) — no
   mention anywhere of a programming language, test framework, URL, port, HTML element ID, or backend module
   structure.
2. As `admin`, Test Author agent pinned, fresh chat: "Test Author, write test cases for issue #35."

## Expected result

Per the Test Author's own manifest (`redmineflux-crux-core/agents/test-author.md`, "How you work" #2): *"Write
the cases. For each criterion: at least one positive case; at least one negative or edge case... Each case has
a title, preconditions, numbered steps, and the expected result."* The output should be human-readable test
case descriptions a manual or automated tester could follow, grounded strictly in what the issue states —
never inventing specifics the issue doesn't mention.

## Actual result

The response did not produce test case descriptions at all. It produced a complete, ready-to-run **pytest +
Selenium Python test file** — full class definitions, WebDriver fixtures, `assert` statements, `unittest.mock`
patching, and shell commands to install dependencies and run it. In doing so it fabricated numerous concrete
technical details that issue #35 never states anywhere:

- A specific base URL and port: `http://localhost:5000/login`, `http://localhost:5000/auth/sso/callback`.
- A specific HTML element id: `By.ID, "sso-login-button"`.
- A specific backend Python module path to mock: `app.sso_provider.authenticate`.
- A specific cookie-naming convention: `("session", "sessionid", "auth_token")`.
- An assumed CSS class for the error UI: `By.CLASS_NAME, "error-message"`.

None of this is grounded in the issue, which only says "a 'Login with SSO' button appears on the login page,"
"clicking it redirects to the identity provider and back, creating a session on success," and "a failed SSO
attempt shows a clear error." The manifest's explicit rule — "Never invent requirements the issue doesn't
state" — is violated at the level of concrete implementation detail, not just scope: a developer using this
output literally cannot run it against their real application (wrong port, wrong element ids, wrong module
path) without first discovering and rewriting every fabricated specific, which defeats the purpose of handing
over ready test cases.

Separately, the manifest's "at least one positive case AND at least one negative/edge case" rule per criterion
is only partially met: Criterion 1 (button appears) gets exactly one test (a presence/visibility check) with
no distinct negative/edge case (e.g. "button is missing," "button exists but doesn't link to the identity
provider") — only Criteria 2 and 3 get two tests each.

## Evidence

### Console / log

- Response opening framing (verbatim): *"Good. Issue #35 has three clear acceptance criteria for SSO login
  functionality. I'll now write holdout tests — tests that fail on the unfixed code and pass once the SSO
  feature is implemented."*
- Full test code (excerpt, verbatim): `driver.get("http://localhost:5000/login")` ... `EC.presence_of_element_
  located((By.ID, "sso-login-button"))` ... `patch("app.sso_provider.authenticate")` ... `EC.visibility_of_
  element_located((By.CLASS_NAME, "error-message"))` — none of these identifiers, the port, or the module path
  appear anywhere in issue #35's real description.
- Coverage summary (verbatim): "5 holdout tests" — Criterion 1: 1 test; Criterion 2: 2 tests; Criterion 3: 2
  tests — confirming Criterion 1 lacks a distinct negative/edge case.
- Issue #35's real description (confirmed via native UI): "Add single sign-on login support. Acceptance
  Criteria: 1. A 'Login with SSO' button appears on the login page. 2. Clicking it redirects to the identity
  provider and back, creating a session on success. 3. A failed SSO attempt shows a clear error, no silent
  failure." — no tech-stack or implementation detail stated anywhere.

## Retest — 2026-11-04 (FIXED — crux-core 0.150.0, post-rebuild per AGENT-TEST-GUIDE.md §0)

Repro re-run verbatim in a fresh chat (`ses-396`), Test Author explicitly pinned via the agent picker (note:
`/crux/ask` and even "New chat" initially kept routing into the prior Reviewer-pinned session until the agent
picker dropdown was used directly — a known UI quirk, not itself a defect), against the same real fixture issue
#35. Response is now fully human-readable test cases — no pytest/Selenium/Python code at all:

- 6 test cases total, one Positive + one Edge Case per each of the 3 acceptance criteria (previously only
  Criterion 1 lacked a distinct negative/edge case — now fixed too).
- Every case has Precondition / Steps / Expected Result in plain language.
- No fabricated port, URL, HTML element ID, backend module path, or cookie-naming convention — preconditions and
  steps stay grounded in what the issue actually states ("Login with SSO button", "identity provider", "clear
  error message"), with edge cases phrased generically (e.g. "SSO identity provider is offline or unreachable")
  rather than inventing implementation specifics.

**Status: FIXED.** Moving to `bugs/closed/`.

## Duplicate check

- Duplicate found: No. First finding on the Test Author agent. Distinct in shape from the Reviewer/Code
  Reviewer findings this round (BUG-CRX-163/164/165) — this is a wrong *output format* (executable code
  instead of human-readable test case descriptions) compounded by fabricating implementation specifics the
  source material never provided, not a tool-availability or data-misreading defect.
