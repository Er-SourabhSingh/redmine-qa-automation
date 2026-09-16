# Test Cases — Redmineflux Workload — Workloads, Capacity & Allocation

> Source: vendor KB — "How to Create a Workload", "How to Edit and Delete a Workload",
> "How to Add Issues to a Workload", "How to Allocate Planned Hours", "How to Recalculate Capacity",
> "How to Send Workload Email", Troubleshooting ("Capacity numbers look incorrect"), FAQ Q3 – Q6.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Workload Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_workload_qa

## Navigation methodology

Workloads → **Create Workload**, then the workload name for its detail page. Do not type URLs.

> **Build the capacity number up one input at a time.** Cases TC-WKL-405 to 409 deliberately isolate each input —
> base hours, weekends, holidays, leave, custom hours — so that a wrong figure can be attributed to a specific
> cause. A single "capacity looks right" check would be almost useless for diagnosis, and the KB's own
> troubleshooting list is exactly this set of inputs.

---

## Functional Cases — Workload lifecycle

---

### TC-WKL-401: Create a workload

**User Role:** Admin, or a member with **Manage workload** on that team
**Steps:**
1. **Create Workload** → select the team, enter a name, set start and end dates, select members → **Create**.

**Expected Result:**
- The workload appears in the global Workloads list **and** in the team's workload list.
- It is categorised correctly as active, upcoming or completed based on its dates.

---

### TC-WKL-402: Create a workload with custom working hours per day

**User Role:** Workload manager
**Steps:**
1. Create a workload specifying a custom hours-per-day value different from the global setting.

**Expected Result:**
- Capacity for that workload uses the **custom** value, while other workloads continue to use the global setting.
- This override is the documented behaviour; a custom value silently ignored in favour of the global default would
  make part-time or shift teams unplannable.

---

### TC-WKL-403: Edit a workload

**User Role:** Workload manager
**Steps:**
1. Change the name, dates, team, members and working hours; Save; then **Recalculate Capacity**.

**Expected Result:**
- All changes persist and capacity updates to match the new parameters.
- **Extending the date range increases capacity; shortening it reduces it** — and existing allocations that now
  fall outside the range are handled explicitly rather than vanishing silently.

---

### TC-WKL-404: Delete a workload

**User Role:** Workload manager
**Steps:**
1. Delete a workload that has members, issues and allocations; confirm.

**Expected Result:**
- The workload, its workload users, issue links and allocation data are removed, per the KB.
- **The underlying Redmine issues are untouched** — verify a sample. The plugin allocates against real issues, so
  any change to them here would be Critical.

---

## Functional Cases — Capacity calculation

---

### TC-WKL-405: Base capacity from working days

**User Role:** Workload manager
**Preconditions:** Global hours/day = 8.0; no holidays or leave in range.
**Steps:**
1. Create a workload over a range containing exactly 10 working days and read a member's available capacity.

**Expected Result:**
- 80 hours.

---

### TC-WKL-406: Weekends are excluded

**User Role:** Workload manager
**Steps:**
1. Create a workload over a full 14-calendar-day range containing 10 working days and 4 weekend days.

**Expected Result:**
- Capacity is 80 hours, not 112 — weekends are excluded (FAQ Q3).

---

### TC-WKL-407: Active-scheme holidays reduce capacity

**User Role:** Admin + workload manager
**Steps:**
1. Add one holiday inside the range to the **active** scheme; **Recalculate Capacity**.

**Expected Result:**
- Capacity drops to 72 hours (9 working days × 8).
- Repeat with the holiday in an **inactive** scheme: capacity stays at 80 (paired with TC-WKL-323).

---

### TC-WKL-408: Approved leave reduces capacity

**User Role:** Approver + workload manager
**Steps:**
1. Approve two working days of leave for one member inside the range; recalculate.

**Expected Result:**
- That member's capacity drops by 16 hours; **other members are unaffected**.
- Leave is per person, so a leave record that reduced the whole team's capacity would be a clear defect.

---

### TC-WKL-409: All inputs combine correctly

**User Role:** Workload manager
**Steps:**
1. With 10 working days, one active-scheme holiday, and 2 days of approved leave for one member, read that
   member's capacity.

**Expected Result:**
- 7 available days × 8 hours = **56 hours**, with each deduction applied exactly once.
- This is the reconciliation case: if TC-WKL-405 – 408 each pass but this one does not, the inputs are
  interacting — most likely a day being deducted twice.

---

## Functional Cases — Issues and allocation

---

### TC-WKL-410: Add issues to a workload

**User Role:** Workload manager
**Steps:**
1. Open the workload → use the issue search and the eligible-issues list → select an issue → **Add Issue**.

**Expected Result:**
- The issue is added and appears for allocation.
- The eligible list offers only issues the user can actually see — an issue picker that exposes issues from
  projects the user has no access to is a disclosure.

---

### TC-WKL-411: Allocate planned hours within capacity

**User Role:** Workload manager
**Steps:**
1. Enter planned hours for a member on an issue, below their available capacity.

**Expected Result:**
- Accepted. **Utilization**, **remaining capacity** and **overbooked hours** all update consistently:
  remaining = capacity − planned, and utilization = planned ÷ capacity.
- Verify the three figures against each other; they are computed together and must not disagree.

---

### TC-WKL-412: Overload behaviour follows the setting

**User Role:** Workload manager
**Steps:**
1. With **Allow Workload Overload** disabled, allocate beyond capacity through the UI, then send the same
   allocation **directly** to the endpoint.
2. Enable the setting and repeat.

**Expected Result:**
- Disabled: refused at both legs (paired with TC-WKL-109).
- Enabled: accepted, with the excess reported as overbooked hours rather than absorbed silently.

---

### TC-WKL-413: Remove an issue from a workload

**User Role:** Workload manager
**Steps:**
1. Remove an issue that has allocated hours.

**Expected Result:**
- The issue and its allocations leave the workload, and the members' remaining capacity increases accordingly.
- **The Redmine issue itself is untouched.**

---

### TC-WKL-414: Allocate across several members and issues

**User Role:** Workload manager
**Steps:**
1. Allocate hours for three members across three issues.

**Expected Result:**
- Each member's totals reflect only their own allocations, and the workload total equals the sum of all
  allocations.

---

### TC-WKL-415: Update an existing allocation

**User Role:** Workload manager
**Steps:**
1. Change a member's planned hours on an issue.

**Expected Result:**
- Utilization, remaining and overbooked figures all update immediately and consistently.

---

### TC-WKL-416: Zero and cleared allocations

**User Role:** Workload manager
**Steps:**
1. Set an allocation to `0`, then clear it entirely.

**Expected Result:**
- Both are handled cleanly and capacity is fully returned. A zero allocation must not linger as a phantom row that
  still consumes capacity.

---

### TC-WKL-417: Recalculate Capacity

**User Role:** Workload manager
**Steps:**
1. Click **Recalculate Capacity** and review the updated values.

**Expected Result:**
- Capacity and utilization refresh to match current inputs.

---

### TC-WKL-418: Recalculation picks up every documented input

**User Role:** Admin + workload manager
**Steps:**
1. Change each input in turn — working hours per day, workload dates, team membership, a holiday, a leave record —
   and recalculate after each.

**Expected Result:**
- Each change moves the figures in the expected direction.
- The KB lists exactly these five as the things to review when "capacity numbers look incorrect", so a
  recalculation that ignores one of them defeats its own troubleshooting advice. **Record a result per input**,
  not a single overall pass.

---

## Functional Cases — Workload email

---

### TC-WKL-419: Send workload email

**User Role:** Workload manager
**Preconditions:** Working mail path; Administration → Settings → General → **Host name and path** verified.
**Steps:**
1. Open the workload detail page → the workload email action → review → send.

**Expected Result:**
- The email contains the workload, team, issue and allocation information described in the KB, with working links.

---

### TC-WKL-420: Workload email respects recipient visibility

**User Role:** Workload manager
**Steps:**
1. Send a workload email to a recipient who cannot see some of the referenced issues' projects.

**Expected Result:**
- Record what the email discloses. **An email that embeds issue subjects from projects the recipient cannot open
  leaks them regardless of what the UI would show**, and email cannot be un-sent. Treat any such disclosure as a
  High-severity finding.

---

## Negative Cases

---

### TC-WKL-421: Workload validation

**User Role:** Workload manager
**Steps:**
1. Create workloads with: a blank name; an end date before the start date; no members selected; no team; and a
   range containing no working days at all (e.g. a single weekend).

**Expected Result:**
- Each is rejected with a clear message, or handled explicitly.
- A workload with **zero available working days** is the interesting one: capacity is zero, so every allocation is
  overload. It should be refused or clearly flagged rather than silently created as unusable.

---

### TC-WKL-422: Invalid planned hours

**User Role:** Workload manager
**Steps:**
1. Enter negative hours, a non-numeric value, and an implausibly large value.

**Expected Result:**
- Each rejected with a clear message. **Negative planned hours would inflate remaining capacity**, making an
  overbooked person appear available.

---

### TC-WKL-423: Allocating to a member not in the workload

**User Role:** Workload manager
**Steps:**
1. Send an allocation request naming a user who is not a member of the workload.

**Expected Result:**
- Refused. Otherwise hours could be planned against someone whose capacity the workload never computed.

---

### TC-WKL-424: Adding the same issue twice

**User Role:** Workload manager
**Steps:**
1. Add an issue already present in the workload.

**Expected Result:**
- Refused or a no-op — not a duplicate row that double-counts its allocations.

---

### TC-WKL-425: Issue deleted or moved after allocation

**User Role:** Workload manager + Manager
**Steps:**
1. Allocate hours to an issue, then delete it; then repeat with an issue moved to a project the manager cannot
   access.

**Expected Result:**
- The workload detail page and the Gantt still render, with the missing issue handled cleanly.
- Not a 500, and no orphaned allocation silently continuing to consume capacity.

---

### TC-WKL-426: Concurrent allocation edits

**User Role:** Two workload managers
**Steps:**
1. Both allocate hours for the same member on the same issue without reloading.

**Expected Result:**
- No lost update, or a clear stale-state message. The final figure is one of the two entered values, not their sum
  and not a stale one.

---

### TC-WKL-427: Workload access is scoped

**User Role:** A member of team A only
**Steps:**
1. Confirm the global Workloads page shows only team A's workloads.
2. Request a **team B** workload's detail URL directly, and send an allocation request against it.

**Expected Result:**
- Refused at both legs, with no team B member names, issue subjects or capacity figures in any response body.
- The KB states non-admin users see workloads for their own teams; the endpoint must enforce it, not just the list
  view.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
