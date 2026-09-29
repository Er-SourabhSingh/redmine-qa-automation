# BUG-HLP-064

- Bug ID: BUG-HLP-064
- Production Redmine Issue ID: 121403
- Title: A customer's Organization is optional and chosen separately on each project row, so one customer can belong to two different organizations — or none — which splits or skips their prepaid budget
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, includes HD-4/HD-5/HD-6/HD-7 per production issue #121289, branch `helpdesk_budget` merged, commit `74c4ed0`)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Severity: Medium
- Date: 2026-09-28

## Steps to reproduce

1. Log in as `admin`.
2. Open Customers → **Delta Customer** (`delta.customer`) → **Edit**.
3. In **Project access**, the customer has two rows: Helpdesk QA Alpha and Helpdesk QA Beta.
4. Set the Alpha row's **Organization Name** to "Alpha Minimal Fields Test Org" and the Beta row's to **"Sakura Mobility KK"** (a different organization). Click **Save**.
5. Open the customer's details page and check the **Projects & entitlements** table.
6. Separately, set a row's Organization Name to **None** and Save.

## Expected result

A customer belongs to exactly one organization. Prepaid budgets are held per organization (Organization → Prepaid Support Hours), so the organization decides whose budget a customer's time is charged to. That means:

- Organization should be a single, **mandatory** field at the top of the Customer form, next to Login/Name/Email. It should be set once per customer, not once per project row.
- Saving one customer with two different organizations should not be possible.
- Saving a customer with no organization should not be possible either. At minimum there should be a clear warning that their tickets won't be charged to any budget.

## Actual result

- **Two different organizations saved with no warning.** After step 4, the customer's Projects & entitlements table read: Alpha row → "Alpha Minimal Fields Test Org", Beta row → **"Sakura Mobility KK"**. One person now has their Alpha work charged to one company's budget and their Beta work to another's. Nothing flagged it.
- **No organization is allowed.** Organization Name has no `*`, offers **"None"**, and saves. `delta.customer`'s Beta row sits on "None" right now (screenshot below). Per TC-HLP-246, time logged by a customer with no organization is never counted against any budget, so Hard mode can't stop their work either.
- **No top-level Organization field.** The form's own fields are only Login, First name, Last name, Email, Password, Confirmation, "Generate password", and "Send account information". Organization appears only inside each Project access row. Its dropdown isn't scoped to the row's project (every organization is always listed), so nothing ties the row's organization to the project or to the organization picked on the customer's other rows.

The test change in step 4 was reverted right after (Beta row back to "None").

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-HLP-064/customer-organization-per-row-optional.png)

*`delta.customer`'s edit form: Organization Name is a separate per-row field with no `*`. The Alpha row has "Alpha Minimal Fields Test Org", the Beta row has "None". There is no Organization field in the customer's own details section above.*

### Console / log

Projects & entitlements table read from the page (`rf_customers/14`) after step 4, before reverting:

```
Helpdesk QA Alpha | Alpha Priority SLA | L2    | Alpha Minimal Fields Test Org
Helpdesk QA Beta  | Beta Standard SLA  | AB-L1 | Sakura Mobility KK
```

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-HLP-064/retest-yyyy-mm-dd-pass.png)

## Notes

- Raised by the user during a UX review of the Customer / Organization / Support Package / SLA model (2026-09-28). Their suggested fix: make Organization a single mandatory field on the customer, and cut each project row down to just **Project + Support Level**. The Support Package (and so the SLA) would then come from the organization's budget for that project; see BUG-HLP-065.
- Existing data needs a migration path: customers with no organization today, and customers whose rows already point at different organizations.
- Related, already verified working: each row's Support Level dropdown **is** correctly limited to the selected project's own levels (Alpha row offers L1/L2/L3, Beta row only AB-L1).

## Retest — 2026-09-28 (after dev fix, branch `helpdesk_budget`, commit 4aafeb3)

**PARTIALLY FIXED — stays open.** Two of the three parts of the recommended fix are genuinely done; the third is not, and the dev's own journal claims it is.

- ✅ **Organization is now a single, mandatory customer-level field.** Confirmed live on `delta.customer`'s edit form: "Organization *" appears once, at the top, with the exact help text from the recommendation ("The one organization this customer belongs to. Determines whose prepaid budget their time is billed against, and which Support Package applies on each project below."). It is no longer present per project-access row at all.
- ✅ **Saving without an organization is refused.** Attempted to save `delta.customer` (whose Organization sat at "None" after the migration) with no organization selected — the browser's native "Please select an item in the list" validation blocked the submit; the form did not save.
- ❌ **Each project row is NOT reduced to "just Project + Support Level."** Confirmed via DOM: `customer_projects[0][sla_id]` and `[1][sla_id]` are both live, enabled `<select>` elements with 28 real SLA options each, freely editable — not removed, not disabled, not derived from anything. This directly contradicts both this bug's own recommended fix and the developer's journal, which states "Each row is down to just Project + Support Level, matching the recommendation." The SLA is still hand-picked per row, independent of whatever Support Package the organization now holds on that project (see BUG-HLP-065's retest, which found the same disconnect from the other side).

Migration note, not a defect: `delta.customer` ended up with Organization = "None" after the automatic migration (her two rows previously had one org set and one blank, a case the migration's stated logic — "rows agreed" / "rows disagreed" / "no row had one" — doesn't cleanly name) — flagged for manual review, which is a safe outcome, not a broken one.

**Stays open**, re-scoped to just the third point: the customer form must stop offering an independent SLA choice per project row.

## Duplicate check

- Duplicate found: No. TC-HLP-050 documents that the Organization dropdown is deliberately *not* scoped to the project. This bug is about the organization being optional and able to differ per row, not about how the dropdown is filtered.
- Existing bug reference (if duplicate):

## Production report

Reported to production 2026-09-28 as **#121403** (`ztflux`), tracker Bug, Priority Medium, Category Helpdesk Plugin (set with a follow-up `update_issue`), assigned to **Vaishnavi Bhawsar** (id 192). Defect Type / Severity / priority: Functional / Medium-severity / Medium (defaults, matching this bug's Medium severity). Attached to Test Case **#121398** / Run **#583** ("Sanity Testing - Feature #121289", Environment "Window 11 + Chrome") via `report_defect`, testcase result Failed. The testcase now shows `defects:[121399, 121400, 121402, 121403]`.
