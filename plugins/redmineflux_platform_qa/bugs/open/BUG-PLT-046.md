# Bug Report Template

- Bug ID: BUG-PLT-046
- Production Redmine Issue ID: (not yet reported — pending approval)
- Title: Holiday Scheme and Holiday are split across two separate Platform nav sections instead of one, and Helpdesk still renders its own standalone, non-nested "Holiday" tab — the original consolidation example from this cycle's very first request, still unresolved
- Redmine version: 6 (Rails 7.2.3.1)
- Plugin name: redmineflux_platform (nav structure) / redmineflux_helpdesk (standalone tab)
- Plugin version: current tip, both plugins
- Environment: `redmine-docker-6-platform`, `localhost:3013`
- Browser: Chromium (Playwright)
- User role: Admin
- Date: 2026-10-13

## Steps to reproduce

1. Open Platform's own nav (`/redmineflux_platform`) and note two separate top-level entries: "Holiday Schemes" (`/redmineflux_platform/list/holiday_schemes`) and "Holidays" (`/redmineflux_platform/list/holidays`) — two places to go for one concept.
2. Open Helpdesk → Helpdesk Settings → "Holiday" tab (`/rf_helpdesk/setting?tab=holidays`) — a flat list of individual Holiday records, with "New Holiday" deferring to Platform's `/redmineflux_platform/list/holidays/new`, but **no concept of Holiday Scheme shown anywhere on this tab** — holidays are not grouped/nested under their scheme here at all.
3. Compare against Workload's own equivalent (`/rf_settings` → "Holiday Management" widget): a single section listing **Holiday Schemes** (with a "Holidays" count column and a "Manage" link into the scheme, where the scheme's own holidays are then nested) — the correct, better pattern.

## Expected result

- Per this session's very first consolidation example (given at the start of this multi-session effort): *"Helpdesk has a standalone 'Holiday' tab in its Settings; holidays should instead only be addable nested inside a Holiday Scheme, matching Workload's existing pattern — Helpdesk's standalone tab should be removed."* Holiday Scheme and Holiday should be managed from **one** place, with holidays nested inside their scheme — not as two independent flat lists.
- Per the same standard already recommended for Leave (`BUG-PLT-044`), Platform's own nav should not fragment one concept (Holiday Scheme + its Holidays) into two separate top-level sections either.

## Actual result

**Confirmed, live, two related findings:**

1. **Platform's own nav still has the fragmentation problem**, exactly like Leave Types/Leaves (`BUG-PLT-044`): "Holiday Schemes" and "Holidays" are two separate nav entries, not one unified section with Holidays nested under their owning scheme.
2. **Helpdesk's own "Holiday" tab is still a flat, standalone list** — not nested inside a Holiday Scheme — confirming the original request from the start of this testing cycle has not been addressed. "New Holiday" does correctly defer to Platform (same partial-mitigation pattern as `BUG-PLT-040`'s Team list and `BUG-PLT-044`'s Leave Types), so this is a duplicate **list**, not a duplicate **write path**.

**Positive finding, confirmed live (addresses the user's specific worry about SLA integration):** Holiday data genuinely **is** shared correctly at the data layer — created a Holiday via Platform's own screen ("Holiday-Testing", under scheme "Holiday-Scheme-Testing") and confirmed it immediately appears, with zero sync action, in Helpdesk's own SLA creation form (`Project → Helpdesk → SLA → New SLA`)'s "Holiday" multi-select field, which SLAs use to exclude days from their response/resolution clock. Workload's and Shift Management's own Holiday-related screens both also correctly defer to Platform with no duplicate CRUD (Workload: "Manage" link only; Shift Management: direct nav link, no screen of its own at all). **The data consolidation and SLA integration already work correctly — this bug is specifically about the UI/IA fragmentation (two sections instead of one) and Helpdesk's leftover flat list, not a data-sharing defect.**

## Evidence

### Screenshot

![Platform's own nav — Holiday Schemes and Holidays as two separate top-level entries](../../screenshots/BUG-PLT-046/platform-nav-holiday-scheme-and-holiday-separate-sections.png)

![Helpdesk's own standalone "Holiday" tab — a flat list, not nested inside a Holiday Scheme](../../screenshots/BUG-PLT-046/helpdesk-standalone-holiday-tab-flat-list.png)

![Positive finding: a Holiday created via Platform correctly appears in Helpdesk's own SLA creation form's Holiday multi-select](../../screenshots/BUG-PLT-046/sla-holiday-dropdown-after-create.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-PLT-046/retest-yyyy-mm-dd-pass.png)

### Console / log

- No error — UX/information-architecture defect, not a data or crash issue.

## Duplicate check

- Duplicate found: No — related to `BUG-PLT-044` (same "fold into one section" recommendation, applied to Holiday instead of Leave) and to the original, not-yet-actioned consolidation example given at the very start of this testing cycle (Helpdesk's standalone Holiday tab). This is the first time that original example has actually been tested live and confirmed still unresolved, rather than only referenced in planning notes.

## Recommendation (consolidation direction, 2026-10-13)

1. On Platform, merge "Holiday Schemes" and "Holidays" into **one** "Holidays" section/nav entry, with Holidays nested inside their owning scheme (the same tabbed or drill-down pattern already recommended for Leave in `BUG-PLT-044`, and already informally followed by Workload's own "Holiday Management" widget).
2. Remove Helpdesk's standalone, flat "Holiday" tab from Helpdesk Settings — per the original request, holidays should only ever be reached by drilling into a Holiday Scheme (matching Workload's pattern), not listed independently.
3. No data-layer change is needed — Holiday data is already correctly shared and already correctly consumed by Helpdesk's own SLA creation form; this is purely a navigation/IA fix.

## Production report

Not yet reported to production — pending approval per `REDMINEFLUX-MCP-SETUP.md` §4.
