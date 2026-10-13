# Bug Report Template

- Bug ID: BUG-PLT-028
- Production Redmine Issue ID: #121861
- Title: "Mark as Private" helper text undersells the actual visibility rule — it omits the assignee carve-out that the backend genuinely grants
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_platform
- Plugin version: `redmineflux_platform` branch, current tip
- Environment: `redmine-docker-6-platform`, `localhost:3013` (dedicated Docker instance, post-upgrade)
- Browser: Chromium (Playwright MCP)
- User role: Admin (finding), Non-admin assignee (confirmed carve-out behavior)
- Date: 2026-10-01

## Steps to reproduce

1. Open the "New Organization" or "New Contact" form and look at the "Mark as Private" checkbox's helper text.
2. Separately (per `testcases/PLATFORM_SECURITY.md` TC-PLT-214, executed this session), create a private Organization/Contact assigned to a non-admin, non-creator user, then log in as that assigned user and open the record.

## Expected result

- The helper text should describe every category of user who can actually see a private record, since this is privacy-sensitive copy a user relies on when deciding whether to check the box.

## Actual result

- The checkbox's helper text reads: **"A private record is visible only to you and to administrators."** — only two categories (creator, admin).
- Live behavior (confirmed via TC-PLT-214, both for Organizations and Contacts) is a **third** category: the record's **assignee** (`assigned_to_id`) can also see and open the private record in full, even holding only a view permission, no admin, no manage. This is a real, working feature (not a bug on its own — it matches `organization.rb`/`contact.rb`'s own `visible?`/`visible` scope, which explicitly includes the assignee branch) — but the UI text a user reads right before deciding to mark something private doesn't mention it.
- Net effect: a user who assigns a private record to a colleague and relies on the displayed copy ("visible only to you and to administrators") would incorrectly believe that colleague cannot see it — when they actually can, by design.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-PLT-028/mark-as-private-helper-text-omits-assignee.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-028/retest-yyyy-mm-dd-pass.png)

### Console / log

- No error — this is a copy/documentation-accuracy gap, not a crash or data leak.

## Duplicate check

- Duplicate found: No — found while executing `PLATFORM_SECURITY.md` TC-PLT-214 (Private-Record Visibility suite), distinct from every other open bug.

## Production report

Reported to production `ztflux` as **#121861** on 2026-10-01, assigned to Prashant Chaurasia. Priority: Low (priority_id 1); Defect custom fields: Type=Usability, Severity=Low-severity, Priority=Low. **Not yet linked to a testcase/run** — same reason as `BUG-PLT-027`: production suite #397 has no "Security" testcase yet, and two attempts to create one were blocked by the Claude Code auto-mode classifier. The issue exists standalone on production; `report_defect` is still pending.

## Fix Verification

Dev fixed on `redmineflux_platform` (commit `edd1ba4`) and `redmineflux_crm` (commit `aa131e2`) branches `redmineflux_platform`, 2026-10-05, after confirming the assignee carve-out is real/intended backend behavior (`Organization.visible`/`Contact.visible` both carry an `OR assigned_to_id = ?` branch) — the copy was wrong, not the behavior. New hint: "A private record is visible only to you, to anyone it is assigned to, and to administrators." Also found and fixed a worse gap while checking scope: CRM's own `/companies/new` and `/contacts/new` had no helper text at all; both now render the same shared locale key as Platform's forms.

**QA retest 2026-10-06 (Sourabh Singh): CONFIRMED FIXED.** Same commit as #121858 (`edd1ba4`). Live-verified the "Mark as Private" hint now reads "...visible only to you, to anyone it is assigned to, and to administrators" on 3 separate forms across 2 plugins (Platform Contact/Organization edit forms, CRM Organization edit form). Closed on production (status: Done).
