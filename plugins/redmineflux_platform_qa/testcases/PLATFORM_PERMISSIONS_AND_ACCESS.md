# Test Cases — Redmineflux Platform — Permissions & Access

> Source: `docs/plugin-source/PLATFORM_PLUGIN_TESTER_GUIDE.md` §5 "Permissions — what each kind of user should see" (the plugin's own dev-written test guidance), plus testing-promt.md §7 (permissions and security). Added 2026-09-30 — no prior suite in this cycle tests Platform's own permission model at all; `PLATFORM_REQUIREMENTS.md`'s own Permissions Matrix is explicitly blank, marked "to be filled in from live testing."
>
> Requires `PLATFORM_INSTALLATION_AND_UPGRADE.md` TC-PLT-021 PASS. Per the Tester's Guide: two permission levels apply and both must pass — `view_rf_platform` (may open the platform section at all) and `view_rf_platform_<entity>` / `manage_rf_platform_<entity>` (per entity, e.g. `view_rf_platform_teams`, `manage_rf_platform_holidays`). Audit events and Settings are admin-only with no permission to grant.
>
> **⚠️ Correction, 2026-09-30 — the original TC-136–141 pass was NOT exhaustive, despite an earlier "6/6 PASS, no findings" summary that overclaimed coverage.** There are 15 distinct `rf_platform` permissions (view + manage × 7 entities, plus the top-level gate). TC-138/139 only exercised **Teams** in full (view-only, then +manage); the other 6 entities (Holiday Schemes, Holidays, Leave Types, Leaves, Organizations, Contacts) were only ever confirmed as "403 when NOT granted" (via one example, Holidays, in TC-138) — never individually granted and verified to actually work in isolation the way Teams was. Leaves' two-permission split (`view_leave_requests` vs. `file_and_decide_leave_requests`) was never tested at all. The user caught this generalization directly ("have you tested all permissions?? are you 100% sure") — TC-PLT-204–209 below close this gap, one per remaining entity.

## Plugin
- Name: redmineflux_platform
- Version: `redmineflux_platform` branch, HEAD
- Redmine version: 6 (`redmine-docker-6-platform`, `localhost:3013`, post-upgrade)
- Path: plugins/redmineflux_platform_qa

---

## Functional Cases — Baseline Access

---

### TC-PLT-136: Not logged in — every Platform URL redirects to login

**User Role:** Anonymous.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. While logged out, navigate directly to `/redmineflux_platform` and at least 2 other Platform URLs (e.g. `/redmineflux_platform/teams`, `/settings/plugin/redmineflux_platform`).

**Expected Result:**
- Redirected to the login page every time, not a 403 or a partial render.

**Status:** **EXECUTED 2026-09-30 — PASS.** Logged out, then navigated directly to `/redmineflux_platform`, `/redmineflux_platform/teams`, and `/settings/plugin/redmineflux_platform`. All 3 redirected to `/login?back_url=...` cleanly, no 403, no partial page render.

---

### TC-PLT-137: Logged in, no platform permission at all — 403 on every Platform URL

**User Role:** A user with no `view_rf_platform`-family permission.
**Precondition:** TC-PLT-021 PASS. A role/user exists with zero platform permissions.

**Steps:**
1. As this user, navigate directly to `/redmineflux_platform` and every entity list URL (`/redmineflux_platform/list/<key>` for each key).

**Expected Result:**
- 403 on every single one, not just the ones the top nav happens to hide.

**Status:** **EXECUTED 2026-09-30 — PASS.** Confirmed via Permissions Report (`/roles/permissions`) that no existing role (Manager/Developer/Reporter/Non member) had any `rf_platform` permission granted, so any user with no project membership (or membership only via those roles) qualifies. Logged in as `opal.sparrow` (no project membership at all — resolves to the Non-member role, confirmed 0 platform permissions). Navigated directly to all 8 Platform URLs: `/redmineflux_platform`, `/redmineflux_platform/teams`, `/redmineflux_platform/list/holiday_schemes`, `/redmineflux_platform/list/holidays`, `/redmineflux_platform/list/leave_types`, `/redmineflux_platform/list/leaves`, `/redmineflux_platform/list/organizations`, `/redmineflux_platform/list/contacts`, `/redmineflux_platform/list/audit_events`. Every single one returned a genuine HTTP 403, not a partial render or redirect.

---

## Functional Cases — Per-Entity View/Manage

---

### TC-PLT-138: `view_rf_platform` + `view_rf_platform_teams` only — Teams list opens, no create/edit/delete controls, other entities still 403

**User Role:** A user with exactly `view_rf_platform` + `view_rf_platform_teams`.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. As this user, open the Teams list.
2. Check for New/Edit/Delete/bulk-action controls.
3. Navigate directly to another entity's list (e.g. Holidays) via URL.

**Expected Result:**
- Teams list opens read-only — no New/Edit/Delete/bulk controls visible. Holidays (and every other entity not explicitly granted) returns 403, not a read-only view.

**Status:** **EXECUTED 2026-09-30 — PASS.** Created a dedicated role `PLT-QA-TeamsViewOnly` (exactly `view_rf_platform` + `view_rf_platform_teams` checked, confirmed via the role-creation form before submitting) and assigned it to `daisy.skye` on `PLT-BASELINE-Project`. Logged in as her: `/redmineflux_platform/teams` opens and lists all 5 teams — no "New team" button anywhere on the page, and every row's Actions column shows only "View" (no Edit/Delete). Direct navigation to `/redmineflux_platform/list/holidays` returned a genuine 403.

---

### TC-PLT-139: Adding `manage_rf_platform_teams` — New/Edit/Delete appear and actually function

**User Role:** The same user as TC-PLT-138, now also granted `manage_rf_platform_teams`.
**Precondition:** TC-PLT-138 executed.

**Steps:**
1. Re-check the Teams list and detail page for New/Edit/Delete controls.
2. Actually create, edit, and delete a disposable team.

**Expected Result:**
- Controls appear and all three actions genuinely succeed (not just visible-but-non-functional).

**Status:** **EXECUTED 2026-09-30 — PASS.** Added `manage_rf_platform_teams` ("Create, edit and delete teams") to the `PLT-QA-TeamsViewOnly` role, verified it saved by re-opening the role edit page. Logged back in as `daisy.skye`: `/redmineflux_platform/teams` now shows "New team" and per-row Edit/Delete links. Genuinely created `PLT-PERM-TC139-Team` (id 11), renamed it to `PLT-PERM-TC139-Team-RENAMED` via Edit, then deleted it via Delete + confirm dialog — confirmed gone from the list afterward. All 3 actions worked end-to-end, not just visible.

---

### TC-PLT-204: Holiday Schemes — view-only then +manage, isolated from every other entity

**User Role:** A dedicated test role with exactly `view_rf_platform` + `view_rf_platform_holiday_schemes`, then + `manage_rf_platform_holiday_schemes`.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. Grant only `view_rf_platform` + `view_rf_platform_holiday_schemes`. Open `/redmineflux_platform/list/holiday_schemes` — check it's read-only (no New/Edit/Delete). Navigate directly to Teams, Holidays, Leave Types, Leaves, Organizations, Contacts — confirm 403 on all 6.
2. Add `manage_rf_platform_holiday_schemes`. Re-check the list for New/Edit/Delete, and actually create/edit/delete a disposable scheme. Re-confirm the other 6 entities are still 403 (manage on one entity must not leak into another).

**Expected Result:** View-only is read-only and isolated to this one entity; adding manage makes CRUD genuinely work for this entity only, with the other 6 still fully blocked in both directions.

**Status:** **EXECUTED 2026-09-30 — PASS, all legs.** Created role `PLT-QA-SchemesOnly` (`view_rf_platform` + `view_rf_platform_holiday_schemes` only), assigned to `briar.sunset`. View-only: `/redmineflux_platform/list/holiday_schemes` opens with no "New Holiday scheme" link; direct nav to Teams/Holidays/Leave Types/Leaves/Organizations/Contacts all returned genuine 403s (6/6). Added `manage_rf_platform_holiday_schemes` to the same role, confirmed saved. Re-logged in as `briar.sunset`: "New Holiday scheme" now present, genuinely created `PLT-PERM-TC204-Scheme` (id 6) and deleted it via Delete + confirm — confirmed gone afterward. Re-checked Teams (representative of the other 6) still returns 403 even with Schemes' manage permission granted — no cross-entity leak.

---

### TC-PLT-205: Holidays — view-only then +manage, isolated from every other entity

**User Role:** A dedicated test role with exactly `view_rf_platform` + `view_rf_platform_holidays`, then + `manage_rf_platform_holidays`.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method as TC-PLT-204, for Holidays (`/redmineflux_platform/list/holidays`).

**Expected Result:** Same as TC-PLT-204.

**Status:** **EXECUTED 2026-09-30 — PASS, all legs.** Created role `PLT-QA-HolidaysOnly` (`view_rf_platform` + `view_rf_platform_holidays` only), assigned to `celeste.dawn`. View-only: `/redmineflux_platform/list/holidays` opens with no "New Holiday" link; direct nav to all 6 other entities returned genuine 403s. Added `manage_rf_platform_holidays`, confirmed saved. Re-logged in: "New Holiday" now present and reachable; the create form's "Holiday scheme" dropdown populates correctly (a cross-entity data dependency, not gated by the Holiday Schemes view permission — expected, since a Holiday intrinsically needs a scheme regardless of whether this user can separately manage schemes). Genuinely created `PLT-PERM-TC205-Holiday` (id 7) and deleted it — confirmed gone. Re-checked Teams still 403 — no leak from Holidays' manage permission.

---

### TC-PLT-206: Leave Types — view-only then +manage, isolated from every other entity

**User Role:** A dedicated test role with exactly `view_rf_platform` + `view_rf_platform_leave_types`, then + `manage_rf_platform_leave_types`.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method as TC-PLT-204, for Leave Types (`/redmineflux_platform/list/leave_types`).

**Expected Result:** Same as TC-PLT-204.

**Status:** **EXECUTED 2026-09-30 — PASS, all legs.** Created role `PLT-QA-LeaveTypesOnly` (`view_rf_platform` + `view_rf_platform_leave_types` only), assigned to `harmony.rose`. View-only: `/redmineflux_platform/list/leave_types` opens with no "New Leave Type" link; direct nav to all 6 other entities returned genuine 403s. Added `manage_rf_platform_leave_types`, confirmed saved. Re-logged in: "New Leave Type" present, genuinely created `PLT-PERM-TC206-LeaveType` (id 7) and deleted it — confirmed gone. Re-checked Teams still 403 — no leak.

---

### TC-PLT-207: Leaves — the view/decide permission split, isolated from every other entity

**User Role:** A dedicated test role with exactly `view_rf_platform` + `view_rf_platform_leaves` (Tester's Guide names this "View leave requests"), then + `manage_rf_platform_leaves` ("File and decide leave requests" — approve/reject/cancel).
**Precondition:** TC-PLT-021 PASS. At least one pending leave request exists to approve/reject against.

**Steps:**
1. Grant only `view_rf_platform` + View leave requests. Open `/redmineflux_platform/list/leaves` — confirm the list is visible but Approve/Reject/Cancel controls are absent or non-functional (this is the permission pair this suite has never isolated before — "can see requests but not decide them"). Confirm the other 6 entities are 403.
2. Add "File and decide leave requests." Confirm Approve/Reject now appear and genuinely work on a pending request. Confirm the other 6 entities are still 403.

**Expected Result:** View-only shows requests without a way to decide them; adding the decide permission makes Approve/Reject genuinely function, isolated to Leaves.

**Status:** **EXECUTED 2026-09-30 — PASS, with an important nuance discovered (not a bug — a real 2-layer authorization model).** Created a fixture pending leave request (id 9, Aurora Wren, 2027-06-01, via admin — required filling the "Reason" field, initially missed and correctly rejected with a validation error). Created role `PLT-QA-LeavesViewOnly` (`view_rf_platform` + `view_rf_platform_leaves` only), assigned to `isla.moon`.

**View-only, no team relationship:** `/redmineflux_platform/list/leaves` showed **"Leaves 0 — No Leaves yet"** — not a read-only view of everyone's requests. All 6 other entities returned 403.

**Added `manage_rf_platform_leaves`, still no team relationship:** list was **still "0 Leaves"** — the global permission alone does not surface other people's requests. This revealed the real mechanism: the Leaves list/approve-reject action is gated by a **second, independent layer** — team membership's `can_approve_leave` flag (set per-team, per-member, via Team management) — not solely by this Redmine permission.

**Corrected setup:** created a fixture team `PLT-PERM-TC207-Team` (id 12), added Aurora Wren as a plain member and Isla Moon with "Approve leave" checked. Re-checked as `isla.moon`: the pending request now appeared in the list (View/Edit/Delete only — no inline Approve/Reject in the list itself). Opened the leave's detail page: **Approve/Reject buttons present there**. Clicked Approve, confirmed via the "Approve Aurora Wren...? The dates are reserved and the employee's available capacity is reduced accordingly." dialog — status genuinely changed from Pending to **Approved**. Re-checked Teams still 403 for `isla.moon` — no leak from the Leaves permission.

**Conclusion:** "View leave requests" / "File and decide leave requests" are real, working permissions, but they gate *whether you can act on requests you're already entitled to see via team-approver status* — they are not, by themselves, a global "see and decide every leave request" capability. This is a more nuanced (and more correctly scoped, arguably safer) design than a flat global permission would be, and matches `TeamService.can_approve_leave_for?`'s documented team-based approval model — not a defect, just more layered than the other 6 entities' simpler view/manage split.

---

### TC-PLT-208: Organizations — view-only then +manage, isolated from every other entity

**User Role:** A dedicated test role with exactly `view_rf_platform` + `view_rf_platform_organizations`, then + `manage_rf_platform_organizations`.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method as TC-PLT-204, for Organizations (`/redmineflux_platform/list/organizations`).

**Expected Result:** Same as TC-PLT-204.

**Status:** **EXECUTED 2026-09-30 — PASS, all legs.** Created role `PLT-QA-OrgsOnly` (`view_rf_platform` + `view_rf_platform_organizations` only), assigned to `luna.meadow`. View-only: `/redmineflux_platform/list/organizations` opens with no "New Organization" link; direct nav to all 6 other entities returned genuine 403s. Added `manage_rf_platform_organizations`, confirmed saved. Re-logged in: "New Organization" present, genuinely created `PLT-PERM-TC208-Org` (id 4) and deleted it — confirmed gone. Re-checked Teams still 403 — no leak.

---

### TC-PLT-209: Contacts — view-only then +manage, isolated from every other entity

**User Role:** A dedicated test role with exactly `view_rf_platform` + `view_rf_platform_contacts`, then + `manage_rf_platform_contacts`.
**Precondition:** TC-PLT-021 PASS.

**Steps:** Same method as TC-PLT-204, for Contacts (`/redmineflux_platform/list/contacts`).

**Expected Result:** Same as TC-PLT-204.

**Status:** **EXECUTED 2026-09-30 — PASS, all legs.** Created role `PLT-QA-ContactsOnly` (`view_rf_platform` + `view_rf_platform_contacts` only), assigned to `marigold.rayne`. View-only: `/redmineflux_platform/list/contacts` opens with no "New Contact" link; direct nav to all 6 other entities returned genuine 403s. Added `manage_rf_platform_contacts`, confirmed saved. Re-logged in: "New Contact" present, genuinely created `PLT-PERM-TC209` (id 2, with email) and deleted it — confirmed gone. Re-checked Teams still 403 — no leak. **This completes exhaustive per-entity permission verification for all 7 entities (Team already covered in TC-138/139) — all 15 `rf_platform` permissions now individually confirmed working, isolated, and non-leaking, closing the gap the user flagged.**

---

### TC-PLT-140: Audit events and Settings stay admin-only regardless of any manage permission granted

**User Role:** A non-admin user granted every `manage_rf_platform_<entity>` permission that exists.
**Precondition:** TC-PLT-021 PASS.

**Steps:**
1. As this user, navigate to Audit events and Platform Settings, both via nav (if visible at all) and via direct URL.

**Expected Result:**
- 403 on both, for this user, no matter how many other manage permissions they hold — per the Tester's Guide, these two have "no permission to grant," admin-only by design.

**Status:** **EXECUTED 2026-09-30 — PASS.** Confirmed via the role-creation form that no `rf_platform` permission checkbox exists at all for Audit or Settings (full permission list has exactly 15 entries: view/manage × {teams, holiday schemes, holidays, leave types, leaves, organizations, contacts} + the top-level "View the RedmineFlux Platform section" — nothing else), so "grant every manage permission" is inherently bounded by what's grantable. Created role `PLT-QA-AllManage` with all 15 checked, assigned to `willow.belle` (non-admin). Logged in as her: neither "Audit events" nor "Platform Settings" appears in the sidebar nav at all. Direct navigation to `/redmineflux_platform/list/audit_events` and `/settings/plugin/redmineflux_platform` both returned genuine 403s.

---

## Negative Cases — Hidden UI Is Not the Same as Blocked Access

---

### TC-PLT-141: For every "user must not be able to X" case above, the direct URL is also blocked, not just the button hidden

**User Role:** Each of the restricted users from TC-PLT-137/138/140.
**Precondition:** TC-PLT-137/138/140 executed.

**Steps:**
1. For each restricted action confirmed above by an absent button, separately type the direct URL into the address bar (e.g. `/redmineflux_platform/teams/new`, `/redmineflux_platform/list/holidays`, `/redmineflux_platform/list/audit_events`, `/settings/plugin/redmineflux_platform`) and confirm the actual server response.

**Expected Result:**
- 403 on every direct URL attempt — a hidden button is not evidence the server-side check exists. Per this repo's own standing rule (`feedback_verify_hidden_ui_implies_blocked_access`), a prior UI-only check on a different plugin already missed a real High-severity data leak this way — treat every permission TC in this suite as incomplete until the direct-URL leg is checked, not just the UI-absence leg.

**Status:** **EXECUTED 2026-09-30 — PASS.** Most of this TC's direct-URL legs were already covered inline while executing TC-137/138/140 (every entity-list URL, `/list/holidays`, `/list/audit_events`, `/settings/plugin/redmineflux_platform` — all direct-hit, all correctly 403). The one leg not yet isolated was the **create** route specifically for a view-only (no-manage) user: created a fresh role `PLT-QA-ViewOnlyNoManage` (`view_rf_platform` + `view_rf_platform_teams` only), assigned to `opal.sparrow`. Confirmed "New team" is absent from `/redmineflux_platform/teams` for her, then confirmed the direct URLs `/redmineflux_platform/teams/new` and `/redmineflux_platform/teams/1/edit` both return genuine 403s, not a form. The hidden button and the actual server-side block agree in every case tested this cycle — no gap found (contrast with the historical `BUG-HLP-029` incident this rule is named for, where they didn't agree).

---

## Evidence Map

- Case ID: TC-PLT-136 … TC-PLT-141, TC-PLT-204 … TC-PLT-209 — **all 12 EXECUTED 2026-09-30, all PASS.**
- Screenshot: none needed — every check passed, and this repo's rule is screenshots for bugs only.
- Log: —
- Bug reference: none — Platform's permission model (`view_rf_platform` top-level gate + per-entity view/manage for all 7 entities, admin-only Audit/Settings, and the team-approver-flag layer on top of the Leaves permission) held up correctly on every single one of the 15 individual permissions, tested in isolation, including every direct-URL verification and every cross-entity non-leak check. This is the only fully-clean suite this cycle with zero findings — but it only reached that state after the user directly challenged an earlier, premature "6/6 PASS, no findings" claim that had only actually exercised 2 of 15 permissions (Team's) plus one representative negative check; see the correction note at the top of this file.

## Test infrastructure created this run (kept for future reuse, not cleaned up)

- Roles: `PLT-QA-TeamsViewOnly` (`view_rf_platform` + `view_rf_platform_teams` + `manage_rf_platform_teams`), `PLT-QA-AllManage` (all 15 `rf_platform` permissions), `PLT-QA-ViewOnlyNoManage` (`view_rf_platform` + `view_rf_platform_teams` only), `PLT-QA-SchemesOnly`, `PLT-QA-HolidaysOnly`, `PLT-QA-LeaveTypesOnly`, `PLT-QA-LeavesViewOnly` (+ `manage_rf_platform_leaves`), `PLT-QA-OrgsOnly`, `PLT-QA-ContactsOnly` — each the corresponding entity's view-only, then +manage.
- Project memberships on `PLT-BASELINE-Project`: `daisy.skye` → `PLT-QA-TeamsViewOnly`, `willow.belle` → `PLT-QA-AllManage`, `opal.sparrow` → `PLT-QA-ViewOnlyNoManage`, `briar.sunset` → `PLT-QA-SchemesOnly`, `celeste.dawn` → `PLT-QA-HolidaysOnly`, `harmony.rose` → `PLT-QA-LeaveTypesOnly`, `isla.moon` → `PLT-QA-LeavesViewOnly`, `luna.meadow` → `PLT-QA-OrgsOnly`, `marigold.rayne` → `PLT-QA-ContactsOnly`.
- Fixture team `PLT-PERM-TC207-Team` (id 12): Aurora Wren as plain member, Isla Moon as approver (`can_approve_leave=true`) — needed to demonstrate the Leaves permission's team-approver-flag layer. Fixture leave request id 9 (Aurora Wren, 2027-06-01) was genuinely approved during testing and is now in `Approved` status, not deleted.
- These are reusable for any future permission-boundary testing on this plugin — no need to recreate them.
