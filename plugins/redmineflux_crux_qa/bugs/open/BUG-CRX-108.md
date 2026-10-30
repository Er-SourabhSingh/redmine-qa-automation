# Bug Report Template

- Bug ID: BUG-CRX-108
- Production Redmine Issue ID: #126322
- Title: Native "Approved Hours" settings tab shows only the approved-value change history — no Spent, Remaining, or Over-Budget status anywhere, so a project admin has no native way to see actual budget consumption
- Redmine version: 6.0-bookworm (local Docker instance, localhost:3015)
- Plugin name: redmineflux_budget_and_audit (native UI), surfaced during Crux Budget Agent QA
- Plugin version: redmineflux_budget_and_audit 2.1.0
- Environment: Local — `http://localhost:3015` (`C:\crux-redmine`)
- Browser: Chromium (Playwright) / direct source review
- User role: admin (manage_approved_hours holder)
- Date: 2026-10-29

## Steps to reproduce

1. Project 5 ("Crux Budget Agent Test Project"), category "Development" (id 67): approved hours raised to
   55.5h via native "Add Approve Hours" form; separately, a genuine 50h time entry logged against an issue
   in that category (DB-verified, `time_entries` table).
2. Open Project → Settings → "Approved Hours" tab natively (both the "Add Approve Hours" modal and the
   "History" table, `app/views/approved_hour/_approved.html.erb` and `_approved_history.html.erb`).
3. Look for any field showing actual hours spent, hours remaining, or an over-budget indicator for the
   category.

## Expected result

A budget-tracking feature's own native settings page should let a project admin see, at a glance, how a
category's budget is actually being consumed — at minimum Spent and Remaining hours, ideally an
over-budget flag — without needing to leave the native UI. The underlying calculation already exists and is
correct (confirmed via the Budget Agent's `get_budget_status` tool: Approved/Spent/Remaining/Over-Budget are
all computed correctly, e.g. TC-CRX-417 showed "Development" correctly flagged Approved 20h / Spent 50h /
Remaining −30h / OVER BUDGET by 30 hours).

## Actual result

The native "Approved Hours" tab exposes exactly two views, and both only ever show the **Approved** value
and its change history:
- The "Add Approve Hours" form: just an input for the new approved-hours delta, a category dropdown, and a
  comment — no current Spent/Remaining shown before submitting.
- The "History" table: columns are Sr. No / Property Changes ("Hours Changed from X to Y") / Added Hours /
  Issue category / Comment / Updated by / Updated On — again, only the approved-value ledger, never actual
  usage.

There is **no Spent, Remaining, or Over-Budget column or view anywhere in the native plugin UI**. The only
way to find out whether a category is over budget, or how close it is, is to ask the Budget Agent via Crux
chat (`get_budget_status`). A native-UI-only admin (not using Crux) has no way to discover this at all —
they would see the approved-hours ledger climb or shrink via explicit admin actions, but never see it
connected to actual consumption, which is very likely the source of the "approved hours don't reflect usage"
confusion raised during this QA cycle: the confusion isn't that the math is wrong (it isn't — Approved and
Spent are correctly independent, and Remaining is correctly derived), it's that the native UI never shows
the derived Remaining/Spent numbers at all.

## Evidence

### Console / log

- `app/views/approved_hour/_approved.html.erb` (reviewed in full) — "Add Approve Hours" form only collects
  `hour`, `category_id`, `comment`; no Spent/Remaining display.
- `app/views/approved_hour/_approved_history.html.erb` (reviewed in full) — History table columns: Sr No,
  Property Changes, Added Hours, Issue category, Comment, Updated by, Updated On. No Spent/Remaining/
  Over-Budget column.
- Contrast: Budget Agent's `get_budget_status` tool (Crux chat) already computes and correctly surfaces
  Approved / Spent / Remaining / Over-Budget per category (TC-CRX-417, PASS) — so the gap is purely a native
  UI omission, not a missing backend capability.

## Follow-up finding (2026-10-30) — the same visibility gap creates a genuine "re-approval doesn't actually unlock logging" trap

Live-tested, native UI only (no Crux), per explicit user request to verify a specific real-world flow: what
happens when an admin reduces approved hours after a category has already fully consumed them, then later
tries to grant new hours for a fresh period.

**Steps (new category `BudgetFlowTest`, id 68, project 5, isolated fixture issue #18, all native UI):**
1. Admin approves 50h. (`approved_hours` row: `hour=50`)
2. User logs a genuine 50h time entry against the category. (DB-verified `time_entries` row, `hours=50`)
   → Spent now equals Approved exactly (Remaining = 0).
3. Admin reduces approved hours by 50 (reasoning: "it's all used anyway, resetting to 0"). Genuinely
   succeeds — the floor-at-zero check only blocks the *total* from going negative (`50 - 50 = 0`), it has no
   idea spent already equals the old total. New approved = 0h. **Spent remains 50h untouched (own separate
   table, never reset)** → category is now silently over budget by 50h, with zero indication anywhere in the
   native UI.
4. Admin later approves 20h more, genuinely intending to grant a fresh 20h of usable budget for the next
   period. Genuinely succeeds — new approved total = 20h. **Still over budget by 30h**, invisibly.
5. User tries to log a routine, small 2h time entry against the category. **Genuinely, correctly rejected**:
   *"Hours exceed the approved limit."* DB-verified: no new `time_entries` row created (table still shows
   only the original 50h entry). The admin's 20h "grant" produced zero actually-usable hours.
6. Confirmed the fix mechanically: only once approved was topped up to 52h (i.e. **above** the 50h already
   spent, not just "+20 from the last approved number") did the same 2h entry genuinely succeed (DB-verified
   new `time_entries` row created).

**Why this happens:** `set_budget`/the native "Add Approved Hours" form always treats the entered value as a
*delta added to the current cumulative approved total* — never compared against total historical spend. An
admin who reduces approved hours after a category is fully spent, then later tops it up by what they think
is a reasonable new allowance, has no way to know that allowance needs to exceed **everything ever spent
historically**, not just cover the new work — because the native UI never shows that spent figure anywhere
(this is the exact same display gap as the bug's original finding above). The result is a native, 100%
reachable admin workflow that silently produces a category that LOOKS freshly re-funded (a clean positive
`hour` value, a normal-looking confirm/history row) but is actually still fully blocked for any new time
logging, with no warning at approval time and no error until the next person tries to log time days or weeks
later.

This is not a new, separate defect — it is a second, more severe symptom of the same missing Spent/Remaining
visibility: the native UI gives an admin no way to calculate the correct number to enter, and no warning that
the number they did enter still leaves the category over budget.

## Duplicate check

- Duplicate found: No. Distinct from BUG-CRX-106 (Budget Agent silently guessing wrong project) and
  BUG-CRX-107 (Budget Agent can't resolve category names) — both of those are Crux/chat-side gaps. This one
  is a native-UI-side visibility gap: the backend/agent-side calculation is correct, but the native plugin
  settings page never displays it. The 2026-10-30 follow-up is the same root cause, not a separate bug.
