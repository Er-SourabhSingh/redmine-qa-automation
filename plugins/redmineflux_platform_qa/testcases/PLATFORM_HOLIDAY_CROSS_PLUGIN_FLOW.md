# Holiday — Cross-Plugin Flow (Platform / Workload / Shift Management / Helpdesk)

> Same purpose as `PLATFORM_TEAM_CROSS_PLUGIN_FLOW.md` and `PLATFORM_LEAVE_CROSS_PLUGIN_FLOW.md`, this time for
> Holiday Scheme and Holiday: tests them as experienced from each plugin that touches them — Platform (owner),
> Workload, Shift Management, and Helpdesk — per the product owner's 2026-10-13 audit request, triggered by a
> direct user finding (see `BUG-PLT-046`).
>
> Fixtures used throughout: Holiday Scheme **"Holiday-Scheme-Testing"** (created in Platform, left Inactive),
> Holiday **"Holiday-Testing"** (under that scheme, 2026-11-20, National Holiday).
>
> **Standard being tested, per explicit user direction (2026-10-13):** Holiday Scheme/Holiday management should
> exist **only** in Platform — no consumer plugin should carry any Holiday-specific UI at all, not even a
> read-only embedded widget or a "Manage" shortcut link's own list rendering. Separately, any consumer picker
> that selects holidays for its own purpose (e.g. an SLA's clock-skip list) must respect which Holiday Scheme
> is currently **active** — holidays belonging to an Inactive scheme should never be offered as if in effect.

## Functional Cases — Platform nav fragmentation

### TC-PLT-281 — Platform's own nav splits Holiday Scheme and Holiday into two sections

1. Open Platform's own nav (`/redmineflux_platform`) and inspect every entry.

**Expected:** Holiday Scheme and Holiday should be managed from one unified section, holidays nested inside
their owning scheme — matching the same standard already recommended for Leave Types/Leaves/Policy Bands
(`BUG-PLT-044`).

**Actual:** Confirmed — "Holiday Schemes" (`/redmineflux_platform/list/holiday_schemes`) and "Holidays"
(`/redmineflux_platform/list/holidays`) are two separate top-level nav entries. **Status: FAIL — filed
`BUG-PLT-046`.**

## Functional Cases — Consumer plugins should carry ZERO Holiday-specific UI

### TC-PLT-282 — Shift Management's "Holidays" nav link has no screen of its own (correct, positive case)

1. Open Shift Management (`/shift_management`) and click "Holidays" in its own left nav.

**Expected:** Links straight to Platform's own Holiday screen, with no Shift-Management-rendered screen in
between at all — the strictest version of the "defer" standard.

**Actual:** Confirmed — the link's `href` is `/redmineflux_platform/list/holiday_schemes` directly; Shift
Management renders nothing of its own first. **Status: PASS** — this is the standard every other plugin's
Holiday touchpoint should be held to.

### TC-PLT-283 — Workload's own "Holiday Management" widget still renders its own embedded list

1. Open Workload's own Settings (`/rf_settings`) and find the "Holiday Management" section.

**Expected (per the stricter 2026-10-13 standard):** Same as TC-PLT-282 — a plain link to Platform, nothing
rendered locally.

**Actual:** Workload's widget does correctly defer **writes** — "Add Holiday Scheme" and each row's "Manage"
link both point to Platform's own URLs, no duplicate CRUD — but it still renders its **own embedded table** of
Holiday Schemes (Scheme Name / Description / Holidays count / Active / Actions) locally on `/rf_settings`,
rather than being a bare link like Shift Management's. **Status: FAIL — filed `BUG-PLT-046`** (this is better
than Helpdesk's version below, but still fails the "zero Holiday-specific UI outside Platform" standard).

### TC-PLT-284 — Helpdesk's own "Holiday" tab is a flat, non-nested, standalone list

1. Open Helpdesk → Helpdesk Settings → "Holiday" tab (`/rf_helpdesk/setting?tab=holidays`).

**Expected:** Same standard as TC-PLT-282/283 — ideally no screen at all, or at minimum holidays nested under
their owning Holiday Scheme, not a flat independent list.

**Actual:** Confirmed — a flat list of individual Holiday records with no Holiday Scheme grouping shown
anywhere on this tab. "New Holiday" does correctly defer to Platform's own `/redmineflux_platform/list/holidays/new`
(write path is fine), but the list itself duplicates Platform's own, with no scheme context at all. This is
the exact example given at the very start of this testing cycle — confirmed still unresolved. **Status: FAIL —
filed `BUG-PLT-046`.**

## Functional Cases — Holiday data sharing and SLA integration

### TC-PLT-285 — A Holiday created via Platform is immediately visible in Helpdesk's SLA creation form

**Preconditions:** Holiday Scheme "Holiday-Scheme-Testing" and Holiday "Holiday-Testing" created via Platform's
own screens.

1. Open Helpdesk's SLA creation form (`Project → Helpdesk → SLA → New SLA`) and open the "Holiday" multi-select.

**Expected:** The holiday appears as a selectable option with zero sync action needed, confirming genuinely
shared data at the model layer.

**Actual:** Confirmed — "Holiday-Testing" appeared immediately. **Status: PASS** — the underlying data sharing
and SLA field wiring are correct; see TC-PLT-286 for the real defect found alongside this.

### TC-PLT-286 — SLA's "Holiday" picker ignores Holiday Scheme active/inactive status

**Preconditions:** Same as TC-PLT-285, with "Holiday-Scheme-Testing" explicitly left **Inactive** (confirmed
via Workload's own settings widget showing its Active column as "Inactive").

1. With the scheme still Inactive, open Helpdesk's SLA creation form's "Holiday" multi-select again and check
   whether "Holiday-Testing" is still offered.

**Expected:** Per the plugin family's own documented rule (Shift Management's own KB: *"Only one schema can be
active organization-wide at any time... the active schema's holidays are the only ones used by attendance
calculations, the dashboard, the shift calendar, and the Holiday report tab"*), a holiday belonging to an
Inactive scheme should not be offered as if it were in effect.

**Actual:** Confirmed — "Holiday-Testing" remained fully selectable despite its scheme being Inactive, with no
indication anywhere in the picker that it belongs to an inactive scheme. **Status: FAIL — filed `BUG-PLT-046`**
(a distinct defect from TC-PLT-285, found while verifying the data-sharing claim, not previously tested or
filed anywhere else).

## Evidence Map

| TC ID | Result | Bug Filed | Screenshot |
|-------|--------|-----------|------------|
| TC-PLT-281 | FAIL | BUG-PLT-046 | `screenshots/BUG-PLT-046/platform-nav-holiday-scheme-and-holiday-separate-sections.png` |
| TC-PLT-282 | PASS | — | — |
| TC-PLT-283 | FAIL | BUG-PLT-046 | — |
| TC-PLT-284 | FAIL | BUG-PLT-046 | `screenshots/BUG-PLT-046/helpdesk-standalone-holiday-tab-flat-list.png` |
| TC-PLT-285 | PASS | — | `screenshots/BUG-PLT-046/sla-holiday-dropdown-after-create.png` |
| TC-PLT-286 | FAIL | BUG-PLT-046 | `screenshots/BUG-PLT-046/workload-scheme-inactive-status.png` |

## Summary (2026-10-13)

Of 6 cases: 2 PASS, 4 FAIL — all 4 filed under the single `BUG-PLT-046` (one root cause/recommendation set:
consolidate Holiday Scheme+Holiday into one Platform section, strip Holiday-specific UI from every consumer
plugin down to a plain link at most, and make the SLA picker scheme-aware). Shift Management (TC-PLT-282) is
the only plugin already meeting the strictest standard — a bare link, nothing rendered locally — and is the
reference pattern the other two should be brought in line with. The data layer itself (TC-PLT-285) is correct;
every FAIL in this suite is about UI placement or a picker's filtering logic, not data sharing.
