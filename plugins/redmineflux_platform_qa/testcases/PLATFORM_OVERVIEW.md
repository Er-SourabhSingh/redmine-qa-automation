# Overview Page — Permission-Aware Content (Redmineflux Platform)

> New suite, per the user's explicit request ("platform ka overview ek bar admin se test kr lo or then ek user
> lo usko bari bari permission de ke check kro... iska lage to ek testsuite bana lo or check kro kuch bhi miss
> mat krna kiu ki yaha pe data show hota he" — test the Overview page as admin, then incrementally grant one
> permission at a time to a single user and check what shows, make a suite for it, don't miss anything since
> data is shown here). No prior suite tested the Overview page's own content/widgets against the permission
> model — only a flat 403-at-the-door check existed (TC-PLT-137, `PLATFORM_PERMISSIONS_AND_ACCESS.md`).
>
> `OverviewController` (`app/controllers/redmineflux_platform/overview_controller.rb`) is unusually
> well-documented and explicitly designed to be permission-aware: "EVERYTHING HERE IS PERMISSION-AWARE. Each
> block is built only from the entities SharedEntities says this user may see, so a reader with Teams and
> nothing else gets a page about teams rather than a page full of refusals." This suite verifies that claim
> holds, widget by widget, rather than trusting the comment.
>
> Known pre-existing bugs that also affect this page, confirmed to extend here too (not re-filed, cross-referenced
> where relevant): `BUG-PLT-052` (Holiday Schemes/Holidays `open_to_all` view bypass), `BUG-PLT-054` (Leave
> `manage?` bypass), `BUG-PLT-027` (Critical stored XSS via this page's own Holiday Calendar widget, still open).

## Test setup

- Role `PLT-OverviewIncremental` (id 18) created with zero `rf_platform` permissions to start.
- `marigold.rayne` (the repo's standing zero-permission reference account, used by `BUG-PLT-052`/`054`) was
  temporarily added to `PLT-DelCheck-Project` with this role for the duration of this suite, then **removed
  again afterward** to restore her documented zero-permission state for future bug retests.
- Permissions were toggled directly via `rails runner` (`Role#add_permission!`/`#remove_permission!`) between
  checks rather than through the UI each time — Redmine re-evaluates `allowed_to?` on every request, so no
  re-login was needed between permission changes, only a page reload.

## TC-PLT-331 — Admin: full Overview baseline

1. Log in as admin, open `/redmineflux_platform`.

**Expected/Actual:** Confirmed — every widget documented in the controller renders with real data:
- **"Needs you"**: 3 items — "2 leave requests waiting", "1 team with no members", "1 organization with no e-mail".
- **Calendar band**: "October 2026 — 21 working days, 168 hours at 8/day" + "1 holidays".
- **Holiday Calendar widget**: full month grid for the active scheme ("Holiday-Scheme-Testing"), with its own
  working/weekend/holiday day counts, plus "Coming up" (3 upcoming holidays) and "Away next" (4 approved-leave
  entries) side panels.
- **Recent changes**: 12-row audit trail (`ACTIVITY_LIMIT`), newest first.
- **"Your records"** sidebar: all 4 groups present — People (Teams 3, Departments 1, Leave Types 2, Leave policy
  bands 1, Leave band assignments 1, Leaves 9, each with a working "New X" link except Teams, which defers to
  its own controller per the code's own note), Customers (Organizations 2, Contacts 3, Contact links 2), Working
  days (Holiday Schemes 3, Holidays 8), System (Audit events 165, no "New" link — read-only by design).
- **Create dropdown**: offers every entity admin may manage.

**Status: PASS.** Screenshot: `screenshots/TC-PLT-OVERVIEW/admin-baseline-full-overview.png`.

## TC-PLT-332 — Zero-permission user: flat 403 at the Overview URL itself

**Preconditions:** `marigold.rayne` added to `PLT-DelCheck-Project` with role `PLT-OverviewIncremental` holding
zero `rf_platform` permissions.

1. Log in as `marigold.rayne`, navigate to `/redmineflux_platform`.

**Expected:** Per `authorize_view`'s own gate (`SharedEntities.section_visible_to?`), a user with no `rf_platform`
section permission and no door permission should be refused the page itself — matching TC-PLT-137's own
already-confirmed result for this exact URL.

**Actual:** Confirmed — 403. **Important nuance, source-traced rather than assumed:** `section_visible_to?`
explicitly excludes `open_to_all` entities from counting toward section access — "Not the open-to-all ones
(leave, the holiday calendar): every employee reaches those from their own plugin, and that is not the section."
So even though Leave/Holiday Schemes/Holidays are `open_to_all` and reachable directly via their own list URLs
regardless of permission (`BUG-PLT-052`/`054`'s own territory), that does **not** extend to unlocking the
Overview page itself — a genuinely zero-permission user is correctly blocked from `/redmineflux_platform`
specifically, by design. **Status: PASS** — confirms TC-PLT-137 still holds and clarifies *why* it holds even
given the two known `open_to_all` bugs.

## TC-PLT-333 — Incremental single-permission grants: each "Your records" card appears alone, correctly scoped

**Preconditions:** Same user/role as TC-PLT-332. One permission granted at a time via `rails runner`, page
reloaded (no re-login) after each change, previous permission removed before the next is added.

| Permission granted (only this one) | Card(s) expected | Actual |
|---|---|---|
| `view_rf_platform_teams` | Teams only (+ "team with no members" attention item) | Confirmed — "Teams 3" shown, attention item shown, nothing else leaked |
| `view_rf_platform_departments` | Departments only | Confirmed — "Departments 1" shown, Teams card gone |
| `view_rf_platform_leave_types` | Leave Types only | Confirmed — "Leave Types 2" shown |
| `view_rf_platform_leave_policy_bands` | Leave policy bands only | Confirmed — "Leave policy bands 1" shown |
| `view_rf_platform_user_band_assignments` | Leave band assignments only | Confirmed — "Leave band assignments 1" shown |
| `view_rf_platform_organizations` | Organizations only (+ "organization with no e-mail" item) | Confirmed — "Organizations 1" shown (not 2 — see note below), attention item shown |
| `view_rf_platform_contacts` | Contacts only | Confirmed — "Contacts 2" shown (not 3 — see note below) |
| `view_rf_platform_organization_contact_links` | Contact links only | Confirmed — "Contact links 1" shown |

**Note on the Organizations (1 vs 2) and Contacts (2 vs 3) counts**: these are **lower** than the admin baseline
because `entry.scope(user)`'s per-record visibility (an Organization/Contact can be marked Private) correctly
narrows the count for a non-admin — this is the entity's own existing privacy feature working as intended, not a
regression or a miscount; admin sees the true total, a non-admin viewer sees only what they may individually see.

**Status: PASS for every row** — each entity's own `view_rf_platform_<key>` permission correctly and
independently gates its own "Your records" card, with no cross-entity leakage in either direction.

## TC-PLT-334 — Attention band items respect the correct permission, including the VIEW-vs-MANAGE distinction

**Preconditions:** Same incremental setup.

1. With only `view_rf_platform_organizations` granted, confirm the "organization with no e-mail" item (view-gated)
   appears, but the "duplicate organizations" item (explicitly manage-gated in source —
   `return [] unless SharedEntities.find('organizations')&.manage?(User.current)`) does **not**.

**Expected/Actual:** Confirmed exactly as coded. The duplicate-organizations tile's absence couldn't be forced
empirically (this dataset's 2 Organizations have no duplicates to begin with — confirmed via
`DuplicateOrganizationFinder.candidates` returning `[]`), but the source-level gate guarantees it would stay
hidden even if duplicates existed, since the `manage?` check short-circuits before the duplicate scan ever runs.
**Status: PASS** (empty-team and no-email items confirmed live; duplicate-item gate confirmed from source, data
state didn't allow a live false-to-true flip for this one specific tile).

## TC-PLT-335 — Leave's own "Needs you"/"Away next" widgets are correctly scoped per-viewer, not a data leak, despite `open_to_all`

**Preconditions:** `marigold.rayne` holds a Pending leave of her own (Leave #12, from `BUG-PLT-054`'s evidence).

1. With zero or any other single permission granted (Leave's own card/attention item appears regardless, since
   `leaves` is `open_to_all: true`), check the "leave request waiting" count shown.

**Expected:** Per `Leave.visible(user)`'s own documented rule ("own leaves always; admin everything; approve_leave
global everything; team approver that team's"), a non-admin, non-approver user with no team should see only
**their own** pending leave count, not the system-wide count.

**Actual:** Confirmed — shows "1" (her own Leave #12), not "2" (the admin-visible system-wide pending count).
Verified via direct `rails runner` query too: `Leave.visible(marigold_rayne).pending` returns exactly Leave #12,
confirmed as her own record (`user: marigold.rayne`). **Not a leak** — `BUG-PLT-054`'s `manage?` bypass means she
could always reach the Leave *form*, but `Leave.visible`'s own scoping (a separate method, not affected by that
bug) still correctly limits what she can *see* on this widget. **Status: PASS.**

## TC-PLT-336 — Create dropdown offers only entities the user may MANAGE, not merely view (except Leave's known `open_to_all` exception)

**Preconditions:** Only `view_rf_platform_organizations` granted (view, not manage).

1. Click the "Create" button and inspect the dropdown's contents.

**Expected:** Per `@creatable`'s own filter (`entry.manage?(user)`), a view-only permission should not offer
"New Organization".

**Actual:** Confirmed — dropdown offers only "Leave Request" (Leave's own `manage?` always returns `true`
regardless of permission, per the already-filed `BUG-PLT-054`), correctly excluding "New Organization" despite
the Organizations card itself being visible. **Status: PASS** — confirms `@creatable`'s manage-vs-view
distinction holds correctly for a normal (non-`open_to_all`) entity; the one exception observed (Leave) is
`BUG-PLT-054`'s already-documented scope, not a new finding here.

## TC-PLT-337 — `audit_events` is `admin_only`: granting its view permission to a non-admin role has zero effect

**Preconditions:** Only `view_rf_platform_audit_events` granted to a confirmed non-admin user.

1. Reload `/redmineflux_platform`.

**Expected:** Unclear going in — could show an empty/permission-correct "Recent changes" panel, or something else.

**Actual:** The **entire Overview page 403s** — not just the "Recent changes" panel hidden. Root cause, confirmed
via direct service call: the `audit_events` entity carries `admin_only: true` in `shared_entities.rb`, and
`Entry#visible_to?` returns `false` unconditionally for a non-admin once `admin_only?` is set — **before** the
granted permission is ever consulted (confirmed: `entry.manage?`/`visible_to?` both ignore the permission entirely
for an `admin_only` entity). Since this was the user's *only* granted permission, no entity was visible to her at
all, so `section_visible_to?` correctly found nothing and refused the whole section.

**This is not a security bug** — it fails in the safe direction (denies access that might have been intended)
rather than the unsafe one (`BUG-PLT-052`/`054`'s direction, granting access that shouldn't exist). But it is a
**confusing, inert permission checkbox**: an administrator who grants "View audit events" to a non-admin role,
expecting that role to see the audit trail, will find it has literally no effect under any combination with
other permissions — the entity cannot ever become visible to a non-admin regardless of what is checked on the
Permissions report. **Status: PASS (confirmed intentional via source, fails safe) — logged as a documentation
observation, not filed as a defect**, following the same "verify from source, don't file a bug for behavior with
an ADR-equivalent rationale" discipline established in the Leave permission investigation (`PLATFORM_MEMORY.md`).

## TC-PLT-338 — Cross-reference: this page is also within the blast radius of `BUG-PLT-052`/`BUG-PLT-054`/`BUG-PLT-027`

1. With a genuinely zero-permission user who nonetheless has *some* other permission granted (so the section
   gate passes — any one of TC-PLT-333's rows works), confirm the Holiday Calendar widget and "New Leave Request"
   Create-option both still appear, exactly as they do for a fully-permissioned user.

**Expected/Actual:** Confirmed in the course of every row of TC-PLT-333/336 above — the Calendar band, "Coming
up", and "Away next" panels render fully regardless of Holiday Schemes/Holidays permission (same root cause as
`BUG-PLT-052`), and "New Leave Request" is always offered in Create regardless of Leave permission (same root
cause as `BUG-PLT-054`). Both are already-filed, already-reported bugs (`#123775`, `#123795`) — this TC exists
purely to record that their scope explicitly includes the Overview page too, not just the entities' own list
screens, so a future retest of either bug's fix should re-check this page as well as the dedicated list URLs.
Also: the Holiday Calendar widget rendering unconditionally for every user (per the above) is the exact same
widget `BUG-PLT-027`'s Critical stored-XSS lives in (`overview/index.html.erb:118`) — meaning that XSS is
reachable by **any logged-in user with any single `rf_platform` permission**, not just an admin, which is worth
noting if `BUG-PLT-027`'s own severity/scope is ever revisited. **Status: PASS** (confirms existing bugs' scope,
files no new defect).

## TC-PLT-339 — The "+" (New X) icon beside each "Your records" row, and every redirect link on the page, checked explicitly

> Added after the user pointed out these two specific UI elements by name (the "+" icons next to each
> "Your records" row, and the redirect arrows on the attention cards/calendar/activity links) hadn't been
> explicitly called out as their own check in TC-PLT-333/336, even though that testing technically exercised the
> same underlying `manage?`/`entry_visible?` logic.

1. As admin, open the Create dropdown and record its exact contents by href, and record the href of every "+"
   icon beside each "Your records" row.
2. As a user holding only `view_rf_platform_organizations` (view, not manage), reload Overview and check: does
   the Organizations row still carry a "+"/"New Organization" link? Click through the "organization with no
   e-mail" attention card and the "Organizations" row link itself to confirm both actually load (not just that
   they're present in the DOM).

**Expected:** The "+" icon is governed by the same `entry.manage?(user)` check as the Create dropdown (confirmed
in source — both read from `@creatable`/the same per-entity `manage?` method), so it should disappear for a
view-only grant exactly like the Create dropdown option does. Every redirect link (attention cards, "Coming up"
holiday links, "Away next" user-profile links, "Your records" row links, "Recent changes"/"Audit events" link)
should navigate to a real, already-functioning page — none of these are new screens, all are the same list/detail
pages covered by this plugin's other suites.

**Actual:** Confirmed on both counts.
- **Admin's Create dropdown** lists exactly 11 creatable entities by href: Team, Department, Organization,
  Contact, Contact link, Holiday scheme, Holiday, Leave Type, Leave policy band, Band assignment, Leave Request
  — matching "Your records"' own 11 non-Audit-events rows one-to-one. Every one of those 11 rows also carries its
  own matching "+" icon (`href=".../new"`) beside it; **Audit events is the sole exception**, correctly carrying
  no "+" icon at all (read-only entity, no `fields`/`own_route`).
- **View-only Organizations user**: the "Organizations 1" row's "+" icon is **genuinely absent** — confirmed by
  extracting every `<a>` on the page by href; only `/redmineflux_platform/list/organizations` appears, never
  `/redmineflux_platform/list/organizations/new`. Clicking through to that list, and through the "organization
  with no e-mail" attention card, both load the real Organizations list cleanly (200, correct content, no error).
  For contrast, the **same user's "Leaves 1" row still carries its "+" icon** (`/redmineflux_platform/list/leaves/new`)
  — this is `BUG-PLT-054`'s already-filed bypass showing up here too, not a new finding, and is the one entity
  where the "+"-icon-tracks-manage? rule doesn't hold, for the already-documented reason.

**Status: PASS** (the `manage?` gate on the "+" icon behaves identically to the Create dropdown's own gate,
confirmed explicitly rather than inferred) — the one place it doesn't track correctly is the already-known
`BUG-PLT-054`, not a new defect. Screenshot:
`screenshots/TC-PLT-OVERVIEW/view-only-org-no-plus-icon.png`.

## Evidence Map

| TC ID | Result | Bug Filed | Screenshot |
|-------|--------|-----------|------------|
| TC-PLT-331 | PASS | — | `screenshots/TC-PLT-OVERVIEW/admin-baseline-full-overview.png` |
| TC-PLT-332 | PASS | — | — |
| TC-PLT-333 | PASS | — | — |
| TC-PLT-334 | PASS | — | — |
| TC-PLT-335 | PASS | — | — |
| TC-PLT-336 | PASS | — | — |
| TC-PLT-337 | PASS (confirmed intentional, documentation note only) | — | — |
| TC-PLT-338 | PASS (confirms existing BUG-PLT-052/054/027 scope) | — | — |
| TC-PLT-339 | PASS | — | `screenshots/TC-PLT-OVERVIEW/view-only-org-no-plus-icon.png` |

## Summary (2026-10-16)

9/9 PASS. The Overview page's own claim to be fully permission-aware, widget by widget, held up under live
incremental testing — every "Your records" card, and the view-vs-manage distinction in both the attention band
and the Create dropdown, correctly tracks the exact permission granted, with no cross-entity leakage found
anywhere. The two already-known `open_to_all` bugs (`BUG-PLT-052`, `BUG-PLT-054`) do reach this page too, as
expected, and no *new* defect was found — including a specific look for the inverse failure mode (a permission
that's supposed to grant access but doesn't), found once (`audit_events`'s `admin_only` flag) and confirmed
intentional/safe rather than a bug. The one standing severity note worth carrying forward is that `BUG-PLT-027`'s
still-open Critical XSS sits in a widget every single logged-in user with platform access renders on login,
which is a wider blast radius than "the Overview page" alone might suggest.
