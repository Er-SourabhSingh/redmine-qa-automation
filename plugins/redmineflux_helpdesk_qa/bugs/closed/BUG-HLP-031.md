# Bug Report

- Bug ID: BUG-HLP-031
- Production Redmine Issue ID: 119979
- Title: SLA First Response Time and Resolution Time are marked required (*) but a blank value is silently accepted on both Create and Edit, creating an SLA with no timer
- Redmine version: 6.1.3.stable
- Plugin name: redmineflux_helpdesk
- Plugin version: (see plugin registry — not independently re-checked this session)
- Environment: Local (redmine-docker-6, localhost:3012)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-02

## Steps to reproduce

1. Log in as Admin. Go to Project (Helpdesk QA Alpha) › Helpdesk › Helpdesk SLA › New SLA (`/projects/1/rf_slas/new`). Both First Response Time and Resolution Time are marked with a required `*` on the form.
2. Fill SLA Name and Resolution Time (e.g. 60 Minutes), leave First Response Time blank (client-side `required` attribute removed via JS to force the request through), Save.
3. Separately, repeat with First Response Time filled (e.g. 30 Minutes) and Resolution Time left blank instead, Save.
4. For contrast: entering `"0"` or a negative number (`"-10"`) into either field IS correctly refused server-side with "First response time must be greater than 0" / "Resolution time must be greater than 0".
5. **Broadened 2026-09-02**: the same gap reproduces via the Edit form, not just Create. On an existing SLA's Edit form (e.g. "Alpha Standard SLA", id 1), clear First Response Time only (leave Name/Resolution Time as-is), Save — succeeds. Repeat clearing Resolution Time only instead — also succeeds.

## Expected result

- A blank First Response Time or Resolution Time should be refused with a required-field message (e.g. "First response time can't be blank"), consistent with the field's own `*` marking and consistent with how 0/negative values on the same field are already correctly refused.

## Actual result

- Both blank submissions succeed ("Successful creation."). The resulting SLA's detail page shows the blank field as "**-**" (e.g. "First Response Time: -"), i.e. the value was saved as `nil`/`NULL`, not defaulted to any number. This is a genuine required-field bypass, not just a cosmetic gap: an SLA created this way has no first-response deadline (or no resolution deadline) for the SLA-clock/breach logic to compute against.
- Root cause (inferred from behavior, not from source read this session): the field almost certainly uses a Rails `numericality: { greater_than: 0 }` validation with no separate `presence: true` — a common gotcha where `numericality` only runs when the attribute is present, so `nil` silently skips the check entirely while `0` and negative values correctly fail it.
- Confirmed the two fields are NOT independent of each other, which is a related but distinct correctly-working behavior (not part of this bug): submitting Resolution Time shorter than First Response Time (unit-aware, e.g. 30 min resolution vs 4 hours first response) is correctly refused with "Resolution time must be greater than or equal to the Response Time" — see TC-HLP-118.
- **Broadened 2026-09-02**: confirmed identical via the Edit form (`/projects/1/rf_slas/1/edit`), not just Create — clearing First Response Time or Resolution Time on an existing, otherwise-valid SLA and saving both succeed with "Successful update", leaving the field as "-" on the detail page exactly as at Create. Found while executing TC-HLP-123 (SLA edit-path validation parity), which otherwise confirmed every other rule (required Name, duplicate-name) IS correctly re-enforced on Edit — this blank-numeric gap is the one exception.

## Evidence

### Screenshot

![Bug evidence — SLA created with First Response Time blank, shown as "-"](../../screenshots/BUG-HLP-031/BUG-HLP-031-sla-blank-first-response-time-accepted.png)

### Console / log

- Server responded 302 redirect (success) for both blank submissions — no exception, no validation error, `Sla` record persisted with `first_response_time`/`resolution_time` as `NULL`.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Retest — Confirmed FIXED (2026-09-10)

- Production issue #119979 found marked "In QA" (developer checked in a fix), triggering this retest per the user's request to retest all checked-in Helpdesk bugs on `localhost:3012`.
- On New SLA form, removed the client-side `required` attribute via `browser_evaluate` (same technique as the original repro) and submitted with First Response Time blank (Resolution Time filled). **Result: blocked** — *"First response time cannot be blank"*, form re-rendered, no record created.
- Repeated with Resolution Time blank instead (First Response Time filled). **Result: blocked** — *"Resolution time cannot be blank"*.
- Both directions are now correctly refused server-side, closing the `numericality`-without-`presence` gap.
- Production issue #119979 synced 2026-09-10: status In QA → Done, % done → 100 (approved).
