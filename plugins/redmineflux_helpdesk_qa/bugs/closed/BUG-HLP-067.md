# BUG-HLP-067

- Bug ID: BUG-HLP-067
- Production Redmine Issue ID: 121412
- Title: Dashboard's "On Hold" stat card doesn't correspond to any real ticket state — this instance has no "On Hold" status, and the card's number is just Open + Resolved (i.e. the total), mislabeled
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Severity: Medium
- Date: 2026-09-28

## Steps to reproduce

1. Log in as `admin`.
2. Open the Helpdesk Dashboard (`/helpdesk`).
3. Note the stat cards: Unassigned (26), Open (234), **On Hold (396)**, SLA Breached (217), Resolved (162).
4. Go to Administration → Issue statuses and list every configured status.
5. Click the On Hold card's "View All" link and inspect the resulting URL/query.

## Expected result

Every stat card should represent a real, distinct ticket state, and its count should reflect only tickets in that state. "On Hold" implies a specific status a ticket can be in.

## Actual result

- **Step 4**: this instance's full list of configured issue statuses is **New, In Progress, Resolved, Feedback, Closed, Rejected, Waiting for Customer Response** — there is no "On Hold" status anywhere in the workflow.
- **Step 3**: despite that, the dashboard shows "396 On Hold". The number is not independent — it is exactly **Open (234) + Resolved (162) = 396**. In the current date range, every ticket is either Open or Resolved, and the "On Hold" card's total is simply the sum of the other two — i.e. it is the *total ticket count*, not a distinct subset.
- **Step 5**: the On Hold card's "View All" link is `/rf_helpdesk/issues?created_from=2026-08-30&created_to=2026-09-28` — no status filter parameter at all, unlike every other card (Unassigned carries `assigned_to_id[]=none&status_id[]=open`, Open carries `status_id[]=open`, Resolved carries `status_id[]=closed`). There is nothing to filter by, because "On Hold" isn't backed by any actual status.

So this card presents a real, plausible-looking number (396) under a label ("On Hold") that doesn't describe anything the ticket data actually distinguishes — an admin reading it has no way to know it's really just the total.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-HLP-067/dashboard-on-hold-card-mislabeled.png)

### Console / log

- Administration → Issue statuses, full list confirmed via the admin UI: New, In Progress, Resolved, Feedback, Closed, Rejected, Waiting for Customer Response (7 total, no "On Hold").
- Arithmetic: Open 234 + Resolved 162 = 396 = the "On Hold" card's count, exact match.
- On Hold card's "View All" href: `/rf_helpdesk/issues?created_from=2026-08-30&created_to=2026-09-28` (no `status_id` param), versus Open's `/rf_helpdesk/issues?created_from=2026-08-30&created_to=2026-09-28&status_id%5B%5D=open` and Resolved's `...&status_id%5B%5D=closed`.

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-HLP-067/retest-yyyy-mm-dd-pass.png)

## Notes

- Found and confirmed during a user-friendliness review of the Dashboard (2026-09-28) — the user spotted the card first from a screenshot and asked whether "On Hold" showing a count when no On Hold status exists made sense; this was then verified against the instance's actual configured statuses and the underlying arithmetic.
- A plausible intended meaning worth considering for the fix: this dashboard elsewhere shows a per-ticket "SLA Status" of **Paused** for tickets in "Waiting for Customer Response" (see the Recent Tickets table) — "On Hold" may have been meant to represent SLA-paused tickets rather than an issue status. Whoever owns the dashboard's spec should confirm the intended definition before this is wired up; the current behavior (silently defaulting to "everything") is wrong regardless of which real definition is chosen.
- Originally logged as item #4 in `improvements/HELPDESK_IMPROVEMENTS.md` (a non-bug UX review) before the user judged it a correctness defect, not a phrasing/consistency suggestion — moved here, and the improvements file's item #4 now just points at this bug.

## Retest — 2026-09-28 (after dev fix, branch `helpdesk_budget`, commit 6611697 "Fix the dashboard's 'On Hold' card to show a real count")

**CONFIRMED FIXED.** The card now shows "6 On Hold" (was 396), its "View All" link is `/rf_helpdesk/issues?created_from=2026-08-30&created_to=2026-09-28&sla=paused` — a real `sla=paused` filter, plus the dashboard's own date range (so the SLA Breached card's date-range-dropping issue, folded into this same bug's write-up as item 2, is fixed too for this card at least). Clicking through: the ticket list shows "6 tickets", the Filters panel shows an active, editable "SLA Status: Paused" filter, and every visible row genuinely shows "Paused" in its SLA Status column.

(Note: an earlier check of this same card, before the user asked to restart the container onto the new branch, still showed 396/unfiltered — that was a stale-container false negative, not a real regression.)

Moving to `bugs/closed/`.

## Duplicate check

- Duplicate found: No.
- Existing bug reference (if duplicate):

## Production report

Reported to production 2026-09-28 as **#121412** (`ztflux`), tracker Bug, Priority Medium, Category Helpdesk Plugin, assigned to **Vaishnavi Bhawsar** (id 192). Attached to Test Case **#121398** / Run **#583** ("Sanity Testing - Feature #121289", Environment "Window 11 + Chrome") via `report_defect`, testcase result Failed. The testcase now shows `defects:[121399, 121400, 121402, 121403, 121405, 121412]`. All fields checked via `get_issue`.

**Closed on production 2026-09-28**: #121412 → Status **Done**, % Done → **100**, per explicit user instruction, with a retest-summary note. Confirmed via `get_issue`.
