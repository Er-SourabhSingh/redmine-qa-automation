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

## Duplicate check

- Duplicate found: No. Distinct from BUG-CRX-106 (Budget Agent silently guessing wrong project) and
  BUG-CRX-107 (Budget Agent can't resolve category names) — both of those are Crux/chat-side gaps. This one
  is a native-UI-side visibility gap: the backend/agent-side calculation is correct, but the native plugin
  settings page never displays it.
