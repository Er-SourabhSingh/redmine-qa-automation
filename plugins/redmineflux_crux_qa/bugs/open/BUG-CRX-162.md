# Bug Report Template

- Bug ID: BUG-CRX-162
- Production Redmine Issue ID: #127609
- Title: Support Agent's `kb_create_page` always fails with a generic, uninformative validation error — the
  real server-side cause is `ActionController::InvalidAuthenticityToken: Can't verify CSRF token authenticity`
  on `RfKnowledgebasePagesController#create`, which is session-cookie-authenticated (not under the
  `Api::V1::*` namespace like every other Helpdesk write tool tested this cycle) and now enforces standard
  Rails CSRF protection the MCP client never supplies
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_crux (Support Agent, Helpdesk plugin domain — redmineflux_helpdesk)
- Plugin version: 6.2.0 (Redmineflux Helpdesk plugin)
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright)
- User role: admin
- Date: 2026-11-04

## Steps to reproduce

1. As admin, Support Agent pinned: "Create a knowledgebase page for project 12 titled 'VPN Setup Guide' with
   content 'Step 1: Install the VPN client. Step 2: Enter your credentials. Step 3: Connect.'"
2. Confirm card correctly showed `Project`, `Title: VPN Setup Guide`, `Content: Step 1:...`. Confirmed → generic
   failure: *"Validation error: rf knowledgebase pages could not be saved. A required field may be missing, a
   value may be out of range, or a status transition may not be allowed for your role."* — this message is
   misleading; nothing about the actual request was invalid.
3. Checked Rails server logs (`docker logs crux-redmine6-redmine-1`) for the exact request:
   ```
   Started POST "/rf_knowledgebase_pages.json" for 172.18.0.2
   Processing by RfKnowledgebasePagesController#create as JSON
   WARN -- Can't verify CSRF token authenticity.
   ERROR -- ActionController::InvalidAuthenticityToken: Can't verify CSRF token authenticity.
   Filter chain halted as :verify_authenticity_token rendered or redirected
   Completed 422 Unprocessable Content
   ```
4. Every other Helpdesk write tool exercised this same session (tickets, SLA, support levels, organizations,
   project-customer entitlement, products, holidays, support packages, prepaid hours, canned responses,
   customers) hits a route under `/helpdesk/api/v1/...` (`Api::V1::*` controllers) and succeeded cleanly with
   no CSRF issue — this is the only tool in the suite that posts to a route outside that namespace
   (`/rf_knowledgebase_pages.json`, the native web controller), and it is the only one affected.

## Expected result

`kb_create_page` (and, very likely, any sibling KB write tool routed the same way — `kb_update_content`,
`kb_delete_page`, `kb_reorder_page`, publish/restore-version actions) should succeed for a session-authenticated
MCP request exactly like every other Helpdesk write tool does, or the real CSRF-related failure should be
surfaced accurately rather than behind a generic "could not be saved... status transition may not be allowed"
message that actively misleads toward the wrong cause.

## Actual result

`kb_create_page` cannot succeed at all via chat — the underlying Rails controller it posts to enforces standard
browser-form CSRF protection that the MCP client's session-cookie request never satisfies, unlike the
`Api::V1::*` namespace's controllers (which use a different, CSRF-exempt authentication path, confirmed by
every other write tool's success this session). The error message shown to the user gives no indication this
is an infrastructure/routing issue rather than a problem with the page content itself.

## Evidence

### Console / log

```
Started POST "/rf_knowledgebase_pages.json" for 172.18.0.2 at 2026-11-04 08:27:32 +0000
Processing by RfKnowledgebasePagesController#create as JSON
Parameters: {"rf_knowledgebase_page"=>{"project_id"=>12, "title"=>"VPN Setup Guide", "content"=>{...}}}
WARN -- : Can't verify CSRF token authenticity.
ERROR -- : ActionController::InvalidAuthenticityToken: Can't verify CSRF token authenticity.
Filter chain halted as :verify_authenticity_token rendered or redirected
Completed 422 Unprocessable Content in 4ms
```

- Chat-visible error (verbatim): *"Validation error: rf knowledgebase pages could not be saved. A required
  field may be missing, a value may be out of range, or a status transition may not be allowed for your role."*
  — none of these candidate causes is the real one.
- Contrast: every other write tool this session (11 distinct Helpdesk tool groups) hits `/helpdesk/api/v1/...`
  and succeeds cleanly under the identical admin session — isolating the defect to the KB page controller's
  routing/auth path specifically.

## Duplicate check

- Duplicate found: No. First finding of a CSRF-related write failure on this agent, and the first instance
  where the generic validation-error wrapper actively misdirects toward the wrong cause (role/status/missing
  field) rather than the real one (CSRF token). Not related in mechanism to BUG-CRX-152 (customer search 500,
  a raw SQL error) or BUG-CRX-157/159/161 (all real-vs-documented field mismatches) — this is an
  authentication/routing-layer failure specific to the one Helpdesk tool that doesn't route through the
  `Api::V1::*` namespace.
