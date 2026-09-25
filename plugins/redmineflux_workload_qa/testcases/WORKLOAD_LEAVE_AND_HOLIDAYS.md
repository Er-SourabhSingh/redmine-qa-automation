# Test Cases — Redmineflux Workload — Leave, Holiday Schemes & Holidays

> Source: vendor KB — "How to Request Leave", "How to Approve or Reject Leave", "How to Cancel Leave",
> "How to Create a Holiday Scheme", "How to Add Holidays", "How to Generate Recurring Holidays",
> Troubleshooting ("Holidays are not reducing capacity"), FAQ Q4, Q5.
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux Workload Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_workload_qa

## Navigation methodology

Workloads → **Leaves** icon for leave; Workloads → **Settings** for holiday schemes and holidays.

> **Every case in this suite ends at a capacity number.** Leave and holidays exist to reduce available hours, so
> the meaningful assertion is always "did the member's capacity change by the right amount", verified on the
> workload detail page after **Recalculate Capacity** — not merely "was the record saved".

---

## Functional Cases — Leave requests

---

### TC-WKL-048: Request leave

**User Role:** Any logged-in member
**Priority:** High
**Steps:**
1. Leaves → **Request Leave** → leave type, start date, end date, reason → submit.

**Expected Result:**
- The request appears under **My Leaves** with **pending** status, per the KB.
- It appears in the approval queue of users who hold **Can approve leave** for that member's team.

---

### TC-WKL-049: Single-day leave

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Request leave with the same start and end date.

**Expected Result:**
- Accepted as a one-day request and, once approved, reduces capacity by exactly one working day.

---

### TC-WKL-050: Multi-day leave spanning a weekend

**User Role:** Member
**Priority:** High
**Steps:**
1. Request leave from a Friday to the following Monday; have it approved; recalculate capacity.

**Expected Result:**
- Capacity is reduced by **two working days**, not four. Weekends are excluded from capacity (FAQ Q3), so they
  cannot also be deducted as leave.
- **Double-deducting a weekend is the most likely arithmetic defect in the whole capacity model**, because the two
  exclusions are computed by different code paths and both look correct in isolation.

---

### TC-WKL-051: Leave spanning a holiday

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Request leave across a date that is also a holiday in the active scheme; approve; recalculate.

**Expected Result:**
- The day is deducted **once**, not twice. The same double-deduction risk as TC-WKL-050 applies here.

---

## Functional Cases — Approval

---

### TC-WKL-052: Approve leave

**User Role:** A user with **Can approve leave** on that member's team
**Priority:** High
**Steps:**
1. Leaves → approval queue → open a pending request → **Approve** → add notes → confirm.

**Expected Result:**
- The status changes to approved and the approver and notes are recorded.
- The member's available capacity drops for those dates on the workload detail page.

---

### TC-WKL-053: Reject leave with a reason

**User Role:** Approver
**Priority:** Medium
**Steps:**
1. Open a pending request → **Reject** → enter a rejection reason → confirm.

**Expected Result:**
- The status changes to rejected, the reason is visible to the requester, and **capacity is unchanged**.
- A rejection with no visible reason is unusable for the requester.

---

### TC-WKL-054: Rejection requires a reason

**User Role:** Approver
**Priority:** Medium
**Steps:**
1. Attempt to reject leaving the reason blank.

**Expected Result:**
- Refused with a validation message — the KB presents the reason as part of the reject flow.

---

### TC-WKL-055: Admins can approve globally

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Approve a leave request for a member of a team the admin holds no flag on.

**Expected Result:**
- Succeeds. The KB states administrators can approve or reject leave globally.

---

### TC-WKL-056: Approval queue is scoped to the approver's teams

**User Role:** Approver with **Can approve leave** on team A only
**Priority:** High
**Steps:**
1. Inspect the approval queue while pending requests exist for both team A and team B members.

**Expected Result:**
- Only team A requests appear (paired with TC-WKL-130, which tests the endpoint).

---

## Functional Cases — Cancellation

---

### TC-WKL-057: Cancel a pending leave request

**User Role:** The requester
**Priority:** Medium
**Steps:**
1. My Leaves → **Cancel** → confirm.

**Expected Result:**
- The request is cancelled and disappears from the approval queue.

---

### TC-WKL-058: Cancel an approved leave request

**User Role:** The requester
**Priority:** High
**Steps:**
1. Cancel an already-approved request; then recalculate capacity.

**Expected Result:**
- **Capacity is restored** for those dates — the KB states cancelled leave no longer reduces capacity.
- A cancellation that leaves the capacity deduction in place would permanently understate that person's
  availability, with nothing in the UI to explain why.

---

### TC-WKL-059: Approved leave reduces capacity by the right amount

**User Role:** Member + approver
**Priority:** High
**Steps:**
1. Note a member's capacity over a 10-working-day workload at 8 hours/day (expect 80).
2. Approve 2 working days of leave inside that range; recalculate.

**Expected Result:**
- Capacity becomes exactly 64 hours.
- Confirm the arithmetic explicitly rather than just observing that the number went down.

---

## Functional Cases — Holiday schemes

---

### TC-WKL-060: Create a holiday scheme

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Settings → holiday schemes → **New Holiday Scheme** → name, optional description, **Active** flag → **Create**.

**Expected Result:**
- The scheme is created and listed with its active state shown.

---

### TC-WKL-061: Edit a scheme

**User Role:** Admin
**Priority:** Low
**Steps:**
1. Rename a scheme and change its description.

**Expected Result:**
- Persists; its holidays are unaffected.

---

### TC-WKL-062: Delete a scheme

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Delete a scheme that contains holidays; then delete the **active** scheme.

**Expected Result:**
- The consequence is stated before the action.
- Deleting the active scheme must leave the system in a defined state — either another scheme becomes active or
  none does, with capacity then computed without holidays. **It must not leave capacity referencing a scheme that
  no longer exists.**

---

### TC-WKL-063: Activating a scheme deactivates the previous one

**User Role:** Admin
**Priority:** High
**Steps:**
1. With scheme X active, activate scheme Y.
2. Re-open the schemes list.

**Expected Result:**
- Y is active and **X is no longer active** — the KB states only one scheme should be active.
- **If two schemes can be active at once, capacity becomes non-deterministic**, since it is unclear which
  holidays apply. Attempt to force it (e.g. two concurrent admin sessions each activating a different scheme) and
  record the result.

---

## Functional Cases — Holidays

---

### TC-WKL-064: Add a single-day holiday

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Select the active scheme → **Add Holiday** → name, start date, type, description → **Add Holiday**.
2. Recalculate a workload covering that date.

**Expected Result:**
- The holiday is listed and capacity drops by exactly one working day for every member in range.

---

### TC-WKL-065: Add a multi-day holiday

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Add a holiday with a start and an end date spanning several days, including a weekend.

**Expected Result:**
- Capacity is reduced only for the **working days** in that span — the weekend is already excluded and must not be
  deducted twice.

---

### TC-WKL-066: Holiday types

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Create a holiday of each available type and observe the capacity effect of each.

**Expected Result:**
- The effect of each type is consistent and explainable. Record what the types mean in practice — the KB names the
  field but never says whether the type changes the capacity treatment, and that is worth establishing.

---

### TC-WKL-067: Recurring holiday flag

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Create a holiday with the recurring flag enabled.

**Expected Result:**
- It is marked recurring and is picked up by the generation step (TC-WKL-068).

---

### TC-WKL-068: Generate Recurring Holidays for a year

**User Role:** Admin
**Priority:** Medium
**Steps:**
1. Settings → Holidays → select a target year → **Generate Recurring Holidays**.

**Expected Result:**
- Entries are created for that year for every recurring holiday, on the correct dates.
- Check a February 29 recurring holiday against a non-leap year, if one exists — the date must be handled
  deterministically rather than silently dropped or shifted.

---

### TC-WKL-069: Generating twice does not duplicate

**User Role:** Admin
**Priority:** High
**Steps:**
1. Run the generation for the same year twice.

**Expected Result:**
- No duplicate holiday entries.
- **Duplicates would deduct the same day from capacity twice**, understating availability — an easy defect to
  introduce and a hard one to spot afterwards.

---

### TC-WKL-070: Only the active scheme reduces capacity

**User Role:** Admin
**Priority:** High
**Steps:**
1. Add a holiday to an **inactive** scheme, inside a workload's date range; recalculate.
2. Activate that scheme and recalculate again.

**Expected Result:**
- Step 1: capacity is **unchanged** — holidays in inactive schemes are ignored.
- Step 2: capacity now drops.
- The KB names this exact confusion as a troubleshooting item, so verifying both directions is the point.

---

## Negative Cases

---

### TC-WKL-071: Leave date validation

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Request leave with the end date before the start date; then a range covering only a weekend; then a range of
   several years.

**Expected Result:**
- The reversed range is refused with a clear message.
- A weekend-only request is handled sensibly — either refused as containing no working days, or accepted with zero
  capacity impact. It must not deduct hours that were never available.

---

### TC-WKL-072: Overlapping leave requests

**User Role:** Member
**Priority:** Medium
**Steps:**
1. Request leave overlapping an existing approved request; have both approved; recalculate.

**Expected Result:**
- Either the overlap is refused, or the overlapping days are deducted **once**.
- **Double-deducting overlapping leave would drive a member's capacity negative**, which the plugin has no
  sensible way to represent.

---

### TC-WKL-073: Retroactive leave

**User Role:** Member + approver
**Priority:** Medium
**Steps:**
1. Request and approve leave for dates already in the past, inside a workload that is already fully allocated.

**Expected Result:**
- Handled without error; the affected member becomes overbooked for those dates rather than the allocation
  silently disappearing.

---

### TC-WKL-074: Approving leave without the flag

**User Role:** A plain member, and a workload manager without **Can approve leave**
**Priority:** High
**Steps:**
1. Confirm no approval controls are offered.
2. Send approve and reject requests **directly** for a pending request.

**Expected Result:**
- Refused with 403 for both users.
- **Approving one's own leave is the obvious abuse here** — test it explicitly: a member approving their own
  request would remove themselves from capacity planning unilaterally.

---

### TC-WKL-075: Holiday and scheme management requires admin

**User Role:** A user with **Manage teams and skills**, and a plain member
**Priority:** High
**Steps:**
1. Confirm Settings is not reachable.
2. Send holiday-create, holiday-delete and scheme-activate requests **directly**.

**Expected Result:**
- All refused with 403.
- **Scheme activation is instance-wide**: a non-admin able to activate a different scheme would change capacity
  for every team at once (paired with TC-WKL-043).

---

### TC-WKL-076: Script content in names and reasons

**User Role:** Member and Admin
**Priority:** High
**Steps:**
1. Enter a script tag as a leave reason, a rejection reason, a holiday name and a scheme name.
2. View them in the approval queue, the holidays list, the dashboard and any workload email.

**Expected Result:**
- Escaped and rendered literally everywhere. **No script executes.**
- The approval queue matters most: a requester's reason is rendered into an approver's screen, making it a
  stored-XSS path aimed at a higher-privileged user.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
