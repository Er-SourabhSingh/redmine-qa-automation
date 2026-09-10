# BUG-HLP-041

- Bug ID: BUG-HLP-041
- Production Redmine Issue ID: 120086
- Title: Hard mode ("stop work") has zero enforcement anywhere in Redmine's own core Spent-time paths — neither editing an existing time entry NOR creating a brand-new one via the core "Log time" link is enforced; prepaid-hours enforcement exists ONLY on the reply-box's own create-time-log widget
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-07)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Agent (`luna.blossom`, role Agent, `view_helpdesk` only)
- Date: 2026-09-07

## Steps to reproduce

**Path A — editing an existing entry:**
1. Set an organization's run-out mode to **Hard** on a project with a real budget (confirmed via the mode dropdown's own value, `select[name="mode"].value === "hard"`).
2. Ensure Remaining is a small positive value (e.g. 1.00h).
3. As an agent, open an existing time entry already logged against one of this organization's tickets, via Redmine's own core **Spent time → Edit** form (`/time_entries/:id/edit` — NOT the reply box's own time-log integration, which every other Hard-mode TC in this suite exercises instead).
4. Increase the entry's **Hours** field by an amount larger than the current Remaining (e.g. from `0:05` to `3:00`, an increase of ~2.92h against 1.00h Remaining).
5. Save.

**Path B — creating a brand-new entry via the core "Log time" link:**
1. Same Hard-mode setup, Remaining a small positive value (e.g. 2.00h).
2. As an agent, open the ticket and click the ticket action bar's **"Log time"** link (`/issues/:id/time_entries/new`) — Redmine's own native new-time-entry form, a structurally distinct control from "Reply" (the reply box's own embedded Time-spent widget).
3. Enter Hours far exceeding Remaining (e.g. `5:00` against 2.00h Remaining).
4. Create.

## Expected result

Per `HELPDESK_USER_GUIDE.md`'s documented Hard-mode contract ("nobody can log time... customer cannot raise a new ticket") and this suite's own TC-HLP-380/381/389/390 (all of which correctly block/cap new time-log attempts once Remaining is exhausted), increasing an existing entry's Hours far past the available Remaining under Hard mode should be refused, capped, or otherwise blocked — the same enforcement that correctly blocks a *new* reply-box time log should extend to *editing* an existing entry, since both actions have the identical effect of increasing Used against a Hard-mode budget.

## Actual result

**Both paths succeed completely uncapped, with no error, no cap, and no warning of any kind** — a plain Redmine flash message, identical to what a non-Helpdesk time entry would show. Confirmed live:

**Path A (edit):**
- Before: Approved 6.83h, Used 5.83h, Remaining **1.00h**, mode confirmed `hard`.
- Edited time entry #23 (Hours `0:05` → `3:00`, a `+2:55` / `+2.92h` increase) via `/time_entries/23/edit` as `luna.blossom` — saved cleanly, "Successful update."
- After: Approved 6.83h, **Used 8.75h**, **Remaining -1.92h** — the full increase applied with zero cap or block, despite Hard mode being active and Remaining having been positive but insufficient before the edit.

**Path B (core "Log time" — new entry):**
- Before: Approved 11.67h, Used 9.67h, Remaining **2.00h** (ticket #46's own "Prepaid Support Hours" summary read "9.67h used · 2.00h left of 11.67h"), mode confirmed `hard`.
- As `luna.blossom`, clicked the ticket action bar's **"Log time"** link (confirmed URL `/issues/46/time_entries/new` — the native Redmine form, no prepaid-hours widget, no run-out-mode awareness anywhere in its UI), entered Hours `5:00` (2.5× the available Remaining), Activity "Technical Support", clicked Create.
- Result: **"Successful creation."** flash, full redirect to the ticket. Ticket's own summary now reads "14.67h used · **-3.00h left** of 11.67h" — the entire 5:00h was applied with zero cap or block.

This confirms the same root-cause defect on **two separate Redmine core `TimeEntry` controller actions** (`new`/`create` AND `edit`/`update`), both structurally distinct from the reply-box widget: BUG-HLP-038 (still open) found that the reply-box's *own* create-time-log path only checks whether Remaining is already ≤0 *before* an action, not whether the action's own size would cross zero — a genuine but partial gap in the one place enforcement *does* exist. This bug shows that **every other way a `TimeEntry` can be created or modified — Redmine's own core new-entry form and its own core edit form alike — has no prepaid-hours enforcement hook at all.** Enforcement exists exclusively on the reply-box's bespoke widget; nowhere else in core Redmine's spent-time UI is Hard mode even consulted.

## Evidence

### Console / log

- Role confirmed: `luna.blossom`, Agent role, `view_helpdesk` only (no `manage_helpdesk`/`manage_prepaid_support_hours` — same restricted role used throughout this suite's Agent-side TCs).
- Mode confirmed via direct DOM read as admin: `document.querySelectorAll('table tbody tr')[0].querySelector('select[name="mode"]').value === "hard"`, both immediately before and after the edit.
- Time entry #23's Hours field read `0:05` before the edit (confirmed via the Edit form's own pre-filled value), changed to `3:00`, Save clicked — response was a full-page redirect to `/projects/helpdesk-qa-alpha/time_entries` with flash text **"Successful update"** — no validation error, no redirect back to the edit form, no partial/capped value.
- Organization's own Prepaid Support Hours page (`/rf_organizations/8?tab=prepaid_support_hours`), read immediately after: Approved `6.83h`, Used `8.75h`, Remaining `-1.92h` — the arithmetic (`5.83 + 2.92 = 8.75`) confirms the full, uncapped increase was applied to Used.
- For contrast, the identical scenario under **Soft** mode (time entry #22, `0:05`→`1:00`) also succeeded (Used `8.75h`→`9.67h`, Remaining `-1.92h`→`-2.84h`) — this is Soft mode's own correct, documented behavior (allow overage), not itself a bug; included only to show the comparison test was run and Soft's contract holds for edits too.
- Path B, mode confirmed via direct DOM read as admin immediately before the test: `document.querySelectorAll('table tbody tr')[0].querySelector('select[name="mode"]').value === "hard"` for the Helpdesk QA Alpha row.
- Path B, ticket #46's own "Prepaid Support Hours" field (rendered directly on the issue view, not just the organization's admin page) read "9.67h used · 2.00h left of 11.67h" before, and "14.67h used · -3.00h left of 11.67h" immediately after — confirming the ticket-level UI itself shows the breach, it isn't merely a hidden backend inconsistency.
- Path B used the core "Log time" link specifically (`f98e77`/`f98e219` in the live DOM, href `/issues/46/time_entries/new`), distinct from "Reply" (href `#`, opens the reply box's own embedded widget) and distinct from "Edit" on an existing entry (`/time_entries/:id/edit`, Path A) — three genuinely separate controls confirmed present side-by-side on the same ticket action bar.

## Duplicate check

- Duplicate found: No (checked `bugs/_duplicates.md` — empty register)
- Existing bug reference (if duplicate): Related to but distinct from **BUG-HLP-038** (open) — that bug is about the reply-box's *create*-time-log path only checking pre-action state, never the action's own size, when *creating* a new entry. This bug is about Redmine's own core `TimeEntry` paths — both the *edit* form and the core *new-entry* "Log time" link — having no enforcement hook whatsoever, on either. Not a duplicate; cross-referenced as the same broad defect class (Hard-mode enforcement incompletely wired into every place `Used` can change). Path A and Path B within this bug are not filed as separate bug IDs either, since both are the identical root cause (a core Redmine controller action with zero awareness of prepaid-hours enforcement) manifesting on two different actions of the same controller family.

## Notes

- Found while executing `HELPDESK_PREPAID_HOURS.md` TC-HLP-396, added following a direct user follow-up asking specifically about editing/deleting existing time entries (a code path this suite's first two rounds of coverage — TC-125–142, 367–395 — never exercised; every prior time-logging TC used the reply box's own create-time integration). Path B (TC-HLP-400) was added after a second, separate user follow-up asking specifically whether the core "Log time" link (a third distinct code path, creating a brand-new entry without going through the reply box at all) had also been checked — it had not, until this addendum.
- Severity judged **Medium**, matching BUG-HLP-038's precedent: this is a real, cleanly-reproducible enforcement gap on a genuine, commonly-used path (any agent who realizes they under-logged time and corrects it via Edit, rather than logging a fresh entry, silently bypasses Hard mode entirely) — but it does not expose data or grant unauthorized access; it is a business-logic completeness gap in the prepaid-hours enforcement layer, the same class as BUG-HLP-038.
- Recommend: audit every place `TimeEntry` can be created, updated, or destroyed (not just the reply box's own controller action) and route all of them through the same prepaid-hours enforcement check used for new reply-box time logs — this bug and BUG-HLP-038 together suggest the enforcement was implemented as a single-purpose hook on one specific controller action rather than a shared, model-level concern that would automatically cover every code path.
- TC-HLP-398/399 (same session) confirmed the *arithmetic* side of edit/delete is correct — Used/Remaining correctly recalculate on both a reduction and a deletion, symmetrically. The gap is specifically in *enforcement* (Hard mode's block), not in the underlying bookkeeping, which is accurate in every direction tested.
