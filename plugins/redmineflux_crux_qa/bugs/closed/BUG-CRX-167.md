# Bug Report Template

- Bug ID: BUG-CRX-167
- Production Redmine Issue ID:
- Title: Docs Writer Agent fabricates a complete, confident product-documentation page describing SSO
  features, protocols (SAML 2.0/OIDC) and admin settings pages that do not exist anywhere in this Redmine
  instance — presented as real, shipped functionality rather than a draft grounded in the source issue
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Ask Crux chat UI, Docs Writer agent)
- Plugin version: crux-core 0.130.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-04

## Steps to reproduce

1. Create a real fixture issue (#35, "Reviewer Fixture: Add SSO login") whose description only says, in plain
   English: a "Login with SSO" button appears on the login page; clicking it redirects to the identity
   provider and back, creating a session on success; a failed attempt shows a clear error. No protocol name
   (SAML, OIDC, etc.), no admin settings page, and no configuration steps are mentioned anywhere.
2. As `admin`, Docs Writer agent pinned, fresh chat: "Docs Writer, write a wiki page explaining the new SSO
   login feature, from issue #35."
3. Natively check `Administration → Settings → Authentication` on this same instance for any trace of
   SAML/OIDC/SSO configuration options.

## Expected result

Per the Docs Writer's own manifest (`redmineflux-crux-core/agents/docs-writer.md`): *"Every line comes from a
real issue, version or page"* and *"Never list a change that isn't in a real issue."* The draft should
describe only what issue #35 actually states (a login button, a redirect/session flow, an error-on-failure
behavior) — it must not invent protocol names, administrative settings pages, or configuration steps that
aren't in the issue and aren't real features of this Redmine instance.

## Actual result

The agent produced a complete, confident-sounding wiki page that states as established fact:

- *"Redmineflux supports Single Sign-On (SSO) login via **SAML 2.0** and **OpenID Connect (OIDC)**."*
- A "When to use SSO" section listing business reasons (Okta, Azure AD, Google Workspace) — none mentioned in
  the issue.
- A specific admin configuration path: *"Go to **Administration > Settings > Authentication**. Select **SAML
  2.0** or **OpenID Connect** as your SSO method. Provide your identity provider's configuration details
  (endpoint URL, client ID, secret, metadata URL, etc.)."*

**None of this exists.** Issue #35 never mentions SAML, OIDC, or any specific protocol or admin settings path
— it's a generic 3-criterion feature request. Natively checked `Administration → Settings → Authentication`
on this exact instance: there is **no** SAML, OIDC, OpenID, SSO, or "Single Sign" option anywhere on that real
page — confirmed via a direct page fetch, zero matches for any of those terms. The entire "Setting up SSO"
section describes a configuration flow that is **completely fictional**, not a reasonable inference from the
issue, and not a real feature of this product. A reader of this wiki page — a genuine end user looking for
real setup instructions — would be told to go configure settings that don't exist, with no way to tell from
the page itself that it was invented rather than documented from the real, shipped feature.

This is a more severe instance of the same class as BUG-CRX-166 (Test Author's fabricated implementation
specifics) — but worse, because Docs Writer's own stated purpose is to produce *documentation presented as
fact to end users*, and the fabrication here invents a specific, named security protocol and a real-looking
admin UI path, which is exactly the kind of confident, checkable-seeming claim a reader would trust without
verifying.

## Evidence

### Console / log

- Response (verbatim excerpt): *"Redmineflux supports Single Sign-On (SSO) login via SAML 2.0 and OpenID
  Connect (OIDC). This lets users sign in using their organization's identity provider instead of a local
  password... To enable SSO in Redmineflux: 1. Go to Administration > Settings > Authentication. 2. Select
  SAML 2.0 or OpenID Connect as your SSO method. 3. Provide your identity provider's configuration details
  (endpoint URL, client ID, secret, metadata URL, etc.)."*
- Issue #35's real, full description (confirmed via native UI): "Add single sign-on login support. Acceptance
  Criteria: 1. A 'Login with SSO' button appears on the login page. 2. Clicking it redirects to the identity
  provider and back, creating a session on success. 3. A failed SSO attempt shows a clear error, no silent
  failure." — no protocol, no admin path, no configuration detail stated anywhere.
- Native check, `/settings?tab=authentication` on this exact instance: zero occurrences of "SAML", "OIDC",
  "OpenID", "SSO", or "Single Sign" anywhere on the real page.

## Retest — 2026-11-04 (FIXED — crux-core 0.150.0, post-rebuild per AGENT-TEST-GUIDE.md §0)

Repro re-run verbatim in a fresh chat (`ses-397`), Docs Writer explicitly pinned via the agent picker, same
exact phrasing ("Write a wiki page explaining the new SSO login feature, from issue #35."). No fabrication at
all this time — the agent now responds: *"I couldn't find a tool for this here, so I can't do it from this
chat. It can be done directly in Redmineflux; if you expected Crux to do it, an administrator can check this
deployment's tool setup."* No SAML/OIDC, no invented admin settings path, no fictional configuration steps —
an honest capability refusal instead of a confident fabrication. This is consistent with AGENT-TEST-GUIDE.md
§1's "unknown values must be looked up or asked for, never guessed" rule, applied here as an honest "I can't"
rather than inventing an answer. **Status: FIXED** (the specific defect — fabricating fictional product
documentation as established fact — no longer reproduces). Moving to `bugs/closed/`.

Side note for `CRUX_MEMORY.md`, not a bug on its own: Docs Writer apparently has no wiki-page-write tool
available in this build at all (declines any wiki-authoring request outright) — worth a quick capability check
in a future session to confirm whether that's by design or an unrelated gap, but out of scope for this retest.

## Duplicate check

- Duplicate found: No. Same general fabrication-under-pressure-to-be-thorough shape as BUG-CRX-166 (Test
  Author), but a distinct, more severe instance: Docs Writer invents a specific, named security protocol and
  a real-looking admin settings path presented as already-shipped fact in reader-facing documentation, rather
  than implementation code intended for a developer who would quickly notice the wrong URL/element-id. Kept
  as its own bug given the different agent, different artifact type (published documentation vs. test code),
  and the materially higher trust a documentation reader places in stated "how it works" facts.
