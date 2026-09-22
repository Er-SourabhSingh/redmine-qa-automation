# Test Cases — Redmineflux CRM — Deals, Pipeline & Closed-Deal Rules

> Source: vendor KB — "How to Create a Deal", "How to Edit or Delete a Deal", "How to Use the Deal Pipeline",
> "How to Change Deal Stage with Drag and Drop", "How to Use Territories in Deals",
> "How to Mark a Deal as Won or Lost".
> **Status: authored 2026-09-15. Not yet executed.**

## Plugin
- Name: Redmineflux CRM Plugin
- Version: (record at execution time)
- Redmine version: (record at execution time)
- Path: plugins/redmineflux_crm_qa

## Navigation methodology

CRM → **Deals**, and the pipeline view from there. Drag-and-drop must be a real mouse interaction, and every
stage change must be confirmed by a **full reload** — the KB says the update goes through a
`/deals/:id/update_stage` request, so a card that moved while the deal did not is the defect class this suite
targets.

> **Deal figures are revenue figures.** Forecast, open pipeline value and won revenue are what a sales team plans
> and reports from. Every arithmetic case below should be hand-calculable before it is checked.

---

## Functional Cases — Creating deals

---

### TC-CRM-083: Create a deal with all fields

**User Role:** Member with **Manage Deals**
**Steps:**
1. Deals → **New Deal** → name, amount, currency, stage, probability, due date, closed date, contact, company,
   assignee, territory, tags, description, privacy flag, custom fields → Save.

**Expected Result:**
- All values stored and shown on the detail page.

---

### TC-CRM-084: Create a deal with only the required fields

**User Role:** Member
**Steps:**
1. Provide only name and stage.

**Expected Result:**
- Created; everything else is optional.

---

### TC-CRM-085: Link a deal to a contact and a company

**User Role:** Member
**Steps:**
1. Set both and Save; open the contact and the company.

**Expected Result:**
- The deal appears from both sides.

---

### TC-CRM-086: Edit a deal

**User Role:** Member with Manage Deals
**Steps:**
1. Change amount, probability, assignee and stage; Save.

**Expected Result:**
- All persist, and the documented automatic activities are logged for the stage change and the assignee change
  (TC-CRM-013 – 615).

---

## Negative Cases — deal validation

---

### TC-CRM-087: Name and stage are required

**User Role:** Member
**Steps:**
1. Save with each omitted in turn.

**Expected Result:**
- Both refused with a message naming the field.

---

### TC-CRM-088: Probability must be 0–100

**User Role:** Member
**Steps:**
1. Enter `-1`, `0`, `100`, `101` and a non-numeric value.

**Expected Result:**
- `0` and `100` accepted; `-1` and `101` refused; non-numeric refused.
- Test both boundaries rather than a middle value — the forecast formula multiplies by this number, so an
  out-of-range value distorts the weighted forecast directly.

---

### TC-CRM-089: Lost reason is required when the stage is Lost

**User Role:** Member
**Steps:**
1. Set the stage to **Lost** with no lost reason and Save.
2. Repeat by sending the update **directly** to the endpoint.

**Expected Result:**
- Refused at both legs — the KB states the requirement plainly.
- Lost reasons are what a sales team analyses to improve; a lost deal without one is a permanent gap in that
  analysis, and there is no edit path to add it later once the deal is closed (TC-CRM-105).

---

### TC-CRM-090: Invalid amounts

**User Role:** Member
**Steps:**
1. Enter a negative amount, a non-numeric value and a value with many decimal places.

**Expected Result:**
- Each refused or normalised consistently. **A negative amount would reduce the pipeline and won-revenue totals**,
  understating them with no visible cause.

---

### TC-CRM-091: Currency cannot be changed after creation

**User Role:** Member with Manage Deals
**Steps:**
1. Create a deal, then attempt to change its currency through the edit form.
2. Attempt the same change **directly** at the endpoint.

**Expected Result:**
- No currency control is offered on edit, **and** the direct change is refused.
- The KB states the currency is fixed at creation. **If the endpoint accepts it, the deal's amount silently
  changes meaning** — a 10,000 deal reinterpreted from USD to another currency, with every total that includes it
  becoming wrong. High severity.

---

### TC-CRM-092: Forecast value calculation

**User Role:** Member
**Steps:**
1. Create a deal of 10,000 at 60% probability.

**Expected Result:**
- Forecast value is **6,000** — amount × probability ÷ 100, the KB's own worked example.

---

### TC-CRM-093: Forecast at the boundaries

**User Role:** Member
**Steps:**
1. Create deals at 0% and at 100% probability, and one with no amount.

**Expected Result:**
- 0% forecasts zero; 100% forecasts the full amount; a deal with no amount forecasts zero rather than erroring or
  showing `NaN`.

---

## Functional Cases — Pipeline

---

### TC-CRM-094: Pipeline groups deals by stage

**User Role:** Member with **View Pipeline**
**Steps:**
1. Open the pipeline view.

**Expected Result:**
- One column per configured stage, with each deal in its correct column.
- Cross-check a few against the deal list — a card in the wrong column misrepresents the whole board.

---

### TC-CRM-095: Open pipeline value

**User Role:** Member
**Steps:**
1. Compare the open pipeline figure against the sum of the amounts of all **open** deals.

**Expected Result:**
- They match, and **Won and Lost deals are excluded** — the KB defines it as the total of all open deals.

---

### TC-CRM-096: Weighted forecast

**User Role:** Member
**Steps:**
1. Compare the weighted forecast against the sum of the forecast values of all open deals, computed by hand.

**Expected Result:**
- They match exactly.
- This is the number a sales manager commits to; an error here is invisible and consequential, which is why it is
  computed by hand rather than eyeballed.

---

### TC-CRM-097: Won revenue

**User Role:** Member
**Steps:**
1. Compare won revenue against the sum of the amounts of all **Won** deals.

**Expected Result:**
- They match, and Lost deals are not included.

---

### TC-CRM-098: Territory filter

**User Role:** Member
**Steps:**
1. Apply a territory filter and re-check the board and the three headline totals.

**Expected Result:**
- Only that territory's deals are shown, and **the totals recalculate to the filtered set** rather than staying at
  the unfiltered values — a stale total beside a filtered board is a reporting defect.

---

## Functional Cases — Drag-and-drop

---

### TC-CRM-099: Drag a deal to another stage

**User Role:** Member with Manage Deals
**Steps:**
1. Drag a card from one column to another; **reload**; open the deal.

**Expected Result:**
- The stage is updated on the deal record itself, not just on the board.

---

### TC-CRM-100: A stage change creates an activity note

**User Role:** Member
**Steps:**
1. After the drag, open the deal's Recent Activities.

**Expected Result:**
- A CRM activity records the stage change, per the KB — with the actor and the old and new stages.

---

### TC-CRM-101: Won and Lost deals cannot be dragged

**User Role:** Member with Manage Deals
**Steps:**
1. Attempt to drag a Won deal to another column, then a Lost one.

**Expected Result:**
- The move is rejected and the card returns to its column, with a message explaining why.

---

### TC-CRM-102: The update_stage endpoint rejects closed deals

**User Role:** Member with Manage Deals
**Steps:**
1. Send `PUT /api/deals/:id/update_stage` **directly** for a Won deal, then for a Lost one.

**Expected Result:**
- Both refused — the KB states the endpoint rejects changes on closed deals.
- **This is the case that matters, not TC-CRM-101.** The board can simply disable the card while the endpoint
  still accepts the write; if it does, a closed deal can be silently reopened, which corrupts won revenue, the
  open-deal count and the win rate at once. High severity.

---

### TC-CRM-103: Reopening a closed deal via the edit form

**User Role:** Member with Manage Deals
**Steps:**
1. Open a Won deal's edit form and change the stage back to an open one; Save.

**Expected Result:**
- Permitted — the KB names the edit form as the documented route for this.
- The deal returns to the open counts and the totals recalculate.
- Record whether an activity logs the reopening; a closed deal quietly becoming open again without a trail is an
  auditability gap worth noting.

---

### TC-CRM-104: Won and Lost are excluded from open counts

**User Role:** Member
**Steps:**
1. Note the dashboard's open-deal count and the pipeline value; move a deal to Won, then another to Lost;
   re-check both.

**Expected Result:**
- Each closure reduces the open count by one and removes that amount from the open pipeline value.

---

### TC-CRM-105: Both Won and Lost feed the win rate

**User Role:** Member
**Steps:**
1. With a known set of won and lost deals, check the analytics win rate.

**Expected Result:**
- It reflects won ÷ (won + lost), per the KB's statement that both count toward it.
- **Open deals must not be in the denominator** — including them would understate the win rate permanently.

---

### TC-CRM-106: Territories on the deal form

**User Role:** Member
**Steps:**
1. Select a configured territory, and the custom option if offered; Save; then filter the pipeline by it.

**Expected Result:**
- The territory persists and the filter returns exactly that deal set.

---

## Negative Cases

---

### TC-CRM-107: Deleting a deal follows the documented cascade exactly

**User Role:** Member with **Delete CRM Data**
**Preconditions:** A deal with activities, an issue link, a linked contact and a linked company.
**Steps:**
1. Record the contact, company and issue.
2. Delete the deal and confirm.
3. Check the activities, the issue's CRM panel, the **contact** and the **company**.

**Expected Result:**
- Activities and issue links **destroyed**.
- **The contact and company are untouched** — the KB states this precisely.
- Deleting one opportunity must never remove the customer record behind it.

---

### TC-CRM-108: Deletion requires Delete CRM Data

**User Role:** Member with **Manage Deals** but without Delete CRM Data
**Steps:**
1. Confirm no Delete control; send the delete request directly.

**Expected Result:**
- Refused at the endpoint (paired with TC-CRM-192).

---

### TC-CRM-109: Drag-and-drop without permission

**User Role:** Member with **View Pipeline** but without Manage Deals
**Steps:**
1. Confirm cards are not draggable.
2. Send the update_stage request directly.

**Expected Result:**
- Refused at both. The KB names Manage Deals as the requirement for drag-and-drop, so a view-only pipeline user
  must not be able to move another team's deals through the endpoint.

---

### TC-CRM-110: Drag-and-drop without JavaScript

**User Role:** Member
**Steps:**
1. Disable JavaScript and open the pipeline.

**Expected Result:**
- The board still renders readable data and the deal edit form remains available as the alternative route.
- The KB names this as a known requirement, so the expectation is graceful degradation rather than a broken page.

---

### TC-CRM-111: Closed date and due date

**User Role:** Member
**Steps:**
1. Set a closed date earlier than the creation date and a due date in the past; then close a deal and check
   whether the closed date is set automatically.

**Expected Result:**
- Dates are validated sensibly and the behaviour on closing is consistent — record whether the closed date is
  auto-populated, since analytics trends depend on it.

---

### TC-CRM-112: Concurrent stage changes

**User Role:** Two members
**Steps:**
1. Both have the pipeline open; each drags the same deal to a different stage.

**Expected Result:**
- One succeeds and the other is refused with a clear message; after reload both see the same stage, and the
  activity trail shows each real transition once.

---

### TC-CRM-113: Large pipeline performance

**User Role:** Member
**Steps:**
1. Open the pipeline with several hundred deals across the stages.

**Expected Result:**
- It renders in reasonable time and stays draggable; the three headline totals remain accurate at volume.
  Record the timing.

---

## Evidence Map

| Case ID | Screenshot | Log | Bug reference |
|---------|------------|-----|---------------|
| | | | |
