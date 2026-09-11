# BUG-HLP-052

- Bug ID: BUG-HLP-052
- Production Redmine Issue ID: 120476
- Title: On a customer's own ticket, every custom field's label renders but its value is dropped entirely (blank), even though the value is genuinely saved
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-11)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Customer (`alpha.customer`)
- Date: 2026-09-11

## Steps to reproduce

1. Sign in as a Customer (`alpha.customer`), open Helpdesk QA Alpha, click **New issue**.
2. Fill Subject, select a value for the list-type custom field **Issue Category** (e.g. "Report a Bug"), fill the required string-type custom field **test** (e.g. "custom field value test"), select a Product, Create.
3. Open the resulting ticket (#91) as the same customer and inspect the field grid.
4. Sign in as Admin, open the same ticket #91 via the core route, and compare the same two fields.

## Expected result

The customer's own ticket view (`/projects/:id/helpdesk/issues/:id`) already correctly renders real values for every other attribute in the identical field grid on this same template — Status, Priority, Product, Organization, Prepaid Support Hours all show their actual saved value to the customer. A custom field the customer themselves just filled in on the New issue form should be internally consistent with that and show its value too, not silently drop it while still showing its label.

## Actual result

**Both custom field values are genuinely saved** — confirmed as Admin on the same ticket #91 (core `/issues/91` route): `<div class="list_cf cf_1 attribute">...<span class="rf-show-display">Report a Bug</span>...` and `<div class="string_cf cf_5 attribute">...<span class="rf-show-display">custom field value test</span>...` — both real, correct values.

**But on the customer's own view of the exact same ticket, the value is blank for both**, while the label still renders:

```html
<div class="list_cf cf_1 attribute"><div class="label"><span>Issue Category</span>:</div><div class="value"></div></div>
<div class="string_cf cf_5 attribute"><div class="label"><span>test</span>:</div><div class="value"></div></div>
```

This is **not** the same mechanism as BUG-HLP-051 (Product hidden via `display:none` on the whole block) — here the block is fully visible, the label renders, but the `.value` div itself is empty. To a real customer this looks exactly like their own submitted answer was silently discarded (worse than an intentionally-hidden field), even though the data is fully intact server-side. Confirmed on both a list-type custom field (`cf_1`, Issue Category) and a string-type custom field (`cf_5`, "test") — this is not specific to one field type.

## Evidence

### Screenshot

![Ticket #91 as alpha.customer — "Issue Category:" and "test:" labels render with completely blank values, despite "Report a Bug" and "custom field value test" having been entered by this same customer at creation and being present in the ticket's own DOM (confirmed via Admin)](../../screenshots/BUG-HLP-052/bug-hlp-052-customer-view-blank-custom-field-values.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-HLP-052/retest-yyyy-mm-dd-pass.png)

### Console / log

- Customer view (`/projects/helpdesk-qa-alpha/helpdesk/issues/91`), `document.querySelectorAll('.attribute')` outerHTML dump: `list_cf cf_1` and `string_cf cf_5` both render `<div class="value"></div>` — empty — while every other attribute in the same list (`status`, `priority`, `product`, `organization`, `prepaid-support-hours`, `start-date`) correctly shows its real value.
- Admin view (core `/issues/91`), same query: `list_cf cf_1` → `<span class="rf-show-display">Report a Bug</span>`; `string_cf cf_5` → `<span class="rf-show-display">custom field value test</span>` — confirms the data is genuinely saved and only the customer-facing branded-route template fails to populate it.

## Duplicate check

- Duplicate found: No (checked `bugs/_index.md` — no prior coverage of custom-field value rendering on the Customer role's ticket view)
- Existing bug reference (if duplicate): —

## Notes

- Found immediately after BUG-HLP-051, while re-checking a user's direct follow-up observation ("custom field value label visible to customer but their selected value not visible") on that same ticket page. Distinct root cause from BUG-HLP-051 (that one hides the whole attribute via CSS; this one renders an empty value node for a visible attribute) — filed separately rather than folded in, since the failure mechanism and user-facing impact (looks like data loss, not an intentionally-hidden field) are both different.
- Not tied to a specific documented promise in `HELPDESK_USER_GUIDE.md` (no `custom field` mentions there at all) — grounded instead in internal inconsistency: every other attribute on this exact template, including plugin-added ones like Product/Organization, correctly shows its value to the customer; only genuine Redmine custom fields (list_cf, string_cf, and likely every other custom-field type on the Support tracker) are affected.
- Reused ticket #91 (created fresh for this investigation) and the "test" custom field already configured on the Support tracker — no new fixtures needed beyond this one ticket.
