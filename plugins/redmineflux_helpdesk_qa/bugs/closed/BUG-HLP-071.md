# Bug Report Template

- Bug ID: BUG-HLP-071
- Production Redmine Issue ID: #123756
- Title: SLA clock's holiday-skip logic completely ignores the "Recurring" flag — a recurring holiday only ever applies in the year it was originally created
- Redmine version: 6
- Plugin name: redmineflux_helpdesk
- Plugin version: current (2026-10-15)
- Environment: Local Docker (localhost:3013, `redmine6platform-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-10-15

## Steps to reproduce

1. Create a Platform Holiday inside the active Holiday Scheme dated in a **past** year with **Recurring = Yes** (here: "TC-Recurring-Holiday-XMas", Start Date `12/25/2025`, Recurring "Repeats every year on this date").
2. Open a Global SLA's create/edit form (`/rf_helpdesk_global_slas/new`) with Working Hours set — confirm the Holiday picker offers "TC-Recurring-Holiday-XMas" as a selectable option (it does — the picker lists the holiday by name with no date, implying year-independent applicability).
3. Select this holiday on the SLA, set Working Hours/Working Days, Save.
4. Inspect the plugin's own SLA deadline calculator (`lib/redmineflux_helpdesk/sla_calculator.rb`) for how it decides whether a given date is a holiday for this SLA.

## Expected result

- Since the Holiday is marked Recurring and the SLA's Holiday picker offers it without any year qualifier, the SLA clock should skip this date in **every** year the holiday scheme stays active — matching the same "Recurring" promise the Holiday's own detail page states, and consistent with how Platform's own `HolidayEngine` (used elsewhere in this engagement, e.g. by Shift Management's Dashboard) correctly projects a recurring holiday into future years.

## Actual result

- `SlaCalculator#is_holiday?` does a literal date-range comparison only, with **no reference to the `recurring` flag at all**:
```ruby
def is_holiday?(date_time)
  return false if sla.holiday_ids_array.empty?
  date = date_time.to_date
  @holidays ||= sla.holidays.to_a
  @holidays.any? { |h| h.start_date <= date && h.end_date >= date }
end
```
  A holiday whose `start_date`/`end_date` are both `2025-12-25` (the original creation date, no end date given) can **never** match any date in 2026 or any later year — `h.start_date <= date && h.end_date >= date` is false for every date after 2025-12-25. This means a ticket's SLA deadline falling on `2026-12-25` (the holiday's recurring date) will **not** be skipped — the clock counts it as a normal working day, directly contradicting the Holiday's own "Recurring" setting and the Holiday picker's own framing (it offers the holiday with no year, implying it should apply every year).
- This is the exact same defect class as `BUG-SFM-002` (filed the same day against Shift Management's Calendar) — a second, independent place in this codebase where a feature ignores Platform's `recurring` flag and does a naive literal-date match instead of delegating to the shared recurrence logic.

## Evidence

### Screenshot

![SLA Holiday picker offers the recurring holiday with no year qualifier](../../screenshots/BUG-HLP-071/BUG-HLP-071-sla-holiday-picker.png)

### Retest screenshot

- N/A — the retest exercises `SlaCalculator` directly via `rails runner` against the real fixture data (see Retest section below), not a UI screen, so there is no visual artifact to capture. This is a deliberate choice for precision (exact deadline-minute verification) over a slower UI-timing reconstruction, not a shortcut around live verification — the calculator runs the exact same production code path a live ticket would.

### Console / log

- N/A — confirmed by reading `lib/redmineflux_helpdesk/sla_calculator.rb`'s `is_holiday?` method directly in the container (`redmine6platform-redmine-1`); the live UI-only check (offering the holiday regardless of year) made the source-level confirmation necessary rather than a pure black-box guess.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —

## Retest — 2026-10-16 — PASS (FIXED)

- Environment: Local Docker (redmine6platform-redmine-1, localhost:3013), Redmine 6, `bundle exec rails runner` against the real `redmine6platform` database (exact production `SlaCalculator` code path, real fixture Holiday id=2), Admin.
- Fix under test: `git pull` on `redmineflux_helpdesk` (branch `redmineflux_platform`, `25dc026..4e1214f`) touching `lib/redmineflux_helpdesk/sla_calculator.rb` + a new `test/unit/sla_calculator_recurring_holiday_test.rb`, plus the shared `redmineflux_platform` fix (`working_calendar.rb`, `holiday.rb`). Container restarted after pull (no new DB migration).

| # | Check | Result |
|---|-------|--------|
| 1 | SLA with Working Hours + the recurring holiday selected, resolution deadline forced to roll past `2026-12-24 16:45 UTC` (15 min left in the working day, 60 min resolution time needed) | Deadline now correctly lands on `2026-12-28 09:45 UTC` (Monday) — skips the holiday (Dec 25) **and** the weekend (Dec 26–27) — PASS |
| 2 | Non-recurring holiday ("Holiday-Testing", Nov 20) on an SLA, same rollover setup | Still correctly skipped — deadline lands on `2026-11-23 09:45 UTC` (Monday) — PASS, no regression |
| 3 | SLA with the recurring holiday **not** selected (`holiday_ids_array = []`), same rollover setup | Deadline correctly lands exactly on `2026-12-25 09:45 UTC`, i.e. NOT skipped, per TC-PLT-290's "a holiday on its own excludes nothing unless explicitly selected on this SLA" rule — PASS, no regression |
| 4 | SLA with the recurring holiday selected but **no** Working Hours configured, plain `+60 min` from `2026-12-24 16:45 UTC` | Correctly ignores the holiday entirely, landing on `2026-12-24 17:45 UTC` — matches TC-PLT-291's "an SLA without a working-hours window ignores holidays entirely" rule — PASS, no regression |

- Regression note (SENIOR_QA_STANDARDS §26): checks 2–4 cover the three adjacent rules this calculator also enforces (non-recurring holidays, explicit per-SLA holiday selection, and the Working-Hours gate) — all three confirmed unaffected by the fix.
