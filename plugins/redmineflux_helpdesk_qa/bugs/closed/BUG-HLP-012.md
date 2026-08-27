# Bug Report Template

- Bug ID: BUG-HLP-012
- Title: ~~Customer Edit form lets a project-scoped Manager edit a customer's core identity (name/email/login/password) even when that customer has zero relationship to any project the Manager belongs to~~ — **CLOSED: Not a Bug, working as designed (see Resolution below)**
- Redmine version: (see QA_CREDENTIALS_LOCAL.md — Local, redmine-docker-6)
- Plugin name: Redmineflux Helpdesk
- Plugin version: —
- Environment: Local (http://localhost:3012, redmine-docker-6)
- Browser: Chromium (Playwright MCP)
- User role: Manager (`manage_helpdesk`), scoped to a single project only (fixture `ivy.sterling`, Member of Helpdesk QA Alpha ONLY — verified not a Member of Helpdesk QA Beta)
- Date: 2026-08-27
- Closed: 2026-08-27 (same day, per user product-judgment review)

## Steps to reproduce

**Fixture setup** (done as admin): created user `ivy.sterling`, added her as a project Member of **Helpdesk QA Alpha only** with the **Manager** role (Manager role was given `manage_helpdesk`/`export_helpdesk_reports`/`manage_prepaid_support_hours`/`view_helpdesk`/`view_email_history` permissions for this test). Confirmed via Administration → Users → `ivy.sterling` → Projects tab: exactly one row, Helpdesk QA Alpha / Manager.

1. Log in as `ivy.sterling`.
2. Go to Helpdesk Command Center → **Customers**. The full customer list is shown, including `beta.customer` — a customer with **zero project-access rows on Helpdesk QA Alpha** (their only row is on Helpdesk QA Beta, a project `ivy.sterling` is not a Member of). The list correctly blanks out `beta.customer`'s Organization/Support Level/Open-ticket columns (shows "—"/"—"/"0"/"0").
3. Click **Edit** on `beta.customer` (`/rf_customers/16/edit`).
4. Observe the form: the **Project access** section correctly shows no rows (empty "-- Select project --" placeholder, since her one real row — Beta — is outside `ivy.sterling`'s scope). The **Information** section above it — Login, First name, Last name, Email, Password/Confirmation, "Send account information" checkbox — is fully populated and fully editable.
5. Change First name from `Beta` to `Beta-ScopeTest` and click Save. Save succeeds and persists.
6. Reverted First name back to `Beta` to restore original state.

## Resolution — CLOSED, Not a Bug (2026-08-27)

**Determined to be working as designed**, per explicit user product-judgment review. Rationale:

- **Customers are a global entity, not a project-scoped one.** Login and Email are enforced unique **install-wide**, not per-project (TC-HLP-240/244) — there is only ever one directory of customer accounts across the whole install, not one per project.
- **The "Add project" mechanism on this same Edit form is already correctly scoped**: when `ivy.sterling` used "Add project" to add a new row, the Project dropdown offered **only Helpdesk QA Alpha** — her own project — never Beta. This is the real, intended workflow this bug's repro should have been read against: a Manager can open *any* existing global customer record and onboard them onto her own project by adding a project-access row with her project's SLA/support level. `beta.customer` in this repro was simply a customer who has not yet been onboarded onto Alpha, not an out-of-bounds record.
- Given that model, the Information section (Login/Name/Email/Password) is the shared global-identity part of the record — the same fields an Admin fills in on customer creation — and is reasonably editable by any `manage_helpdesk` holder as part of managing that shared directory, the same way the Project access section's Organization/SLA/Support Level dropdowns are globally listed (not project-filtered) even though the *row itself* is project-scoped.
- The Project access section (the actually project-scoped data — SLA, support level, organization-per-project) was correctly hidden/scoped for the out-of-project Beta row throughout testing (see TC-HLP-121, PASS). That's the part of the record this plugin's authorization model treats as project-scoped; Information fields are the part it treats as global.

**Residual note for future sessions (not re-opened as a bug, just flagged):** the one edge this reasoning doesn't fully cover is editing Information fields (especially Password) in a request that does **not** also touch/add a project-access row — i.e. renaming or resetting a customer's login with zero footprint on the editor's own project, not in the course of onboarding them anywhere. If this ever needs re-litigating, that's the narrower scenario to test — but per this review it's being treated as within the same "shared global directory, any manage_helpdesk holder can manage it" intent, not a distinct gap.

## Evidence

### Screenshot

![Original repro](../../screenshots/BUG-HLP-012/scoped-manager-edits-out-of-project-customer.png)

### Console / log

- No console errors — was never a JS exception, this was purely a behavior-vs-expectation question, now resolved as expected behavior.

## Duplicate check

- Duplicate found: No.
- Existing bug reference (if duplicate): —

## Related

- Found while executing TC-HLP-121 (project-scoped Manager customer-edit isolation) in `HELPDESK_CUSTOMERS_ORGANIZATIONS.md` — TC-121 itself PASSED and remains valid (Project-access-row scoping is correctly enforced). This closure only concerns the Information-field question raised as a side effect during that same session.
