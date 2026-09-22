# BUG-HLP-051

- Bug ID: BUG-HLP-051
- Production Redmine Issue ID: #120475 (ztflux)
- Title: A customer picks a ticket's Product when raising it, but can never see that value again — the Product attribute is hidden (`display:none`) on their own ticket
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-11)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Customer (`alpha.customer`)
- Date: 2026-09-11

## Steps to reproduce

1. Sign in as a Customer (`alpha.customer`), open Helpdesk QA Alpha, click **New issue**.
2. Confirm the New issue form offers a **Product** dropdown, fill Subject, select a Product (e.g. "Falcon Suite"), Create.
3. Open the newly created ticket as the same customer and inspect its field grid.
4. Click **Edit** on the same ticket as the customer.

## Expected result

Per `HELPDESK_USER_GUIDE.md` §7 ("Working a ticket"): *"Open a ticket and you get Redmine's issue page plus the helpdesk additions: the SLA panel, the customer's organization, **the product**, and the reply box."* This line is not scoped to Agent only — it immediately follows §6's explicit, deliberate agent-vs-customer breakdown (tickets shown, columns, filters), and is the first line of a new section describing what opening a ticket itself shows. The customer's own Organization value (also listed in that same sentence) **is** shown on the customer's ticket view, so Product should be too.

## Actual result

**Selecting Product at creation works correctly** — the Customer-role New issue form genuinely has a Product `<select>`, and the choice persists server-side: ticket #88's field grid contains `<div class="product attribute"><div class="label">Product:</div><div class="value">Falcon Suite</div></div>` (confirmed via direct DOM read).

**But that same element is `display:none` for the Customer role.** Confirmed via `getComputedStyle`: `.product.attribute` → `display: none` (all of its ancestor elements are `display: block`/`flex`, so this is a rule targeting the element itself, not an inherited collapse). The customer-facing field panel on the ticket detail page shows Priority, Organization, and Issue Category — but never Product, on the ticket the same customer just created and picked a Product for.

Clicking **Edit** as the customer confirms there is no alternate path to see it either: the customer's "Edit" only exposes an inline Subject-rename widget, and **Reply** only exposes a Reply Note textbox — no field-editing form of any kind is presented to the Customer role, so Product is unreachable in every direction (view or edit) once the ticket exists, despite being requested from the customer at creation time and genuinely saved.

## Evidence

### Screenshot

![Ticket #88 as alpha.customer — Priority/Organization/Issue Category shown in the field grid, no Product row, despite "Falcon Suite" having been selected at creation and being present in the ticket's own DOM](../../screenshots/BUG-HLP-051/bug-hlp-051-customer-view-no-product-field.png)

### Retest screenshot (fill after fix is verified)

![Retest result](../../screenshots/BUG-HLP-051/retest-yyyy-mm-dd-pass.png)

### Console / log

- `document.body.innerText` for ticket #88 (customer view): field grid reads `Priority: Normal` / `Organization: -` / `Issue Category:` — no "Product" label anywhere outside the ticket's own subject text.
- `document.querySelector('.product.attribute').outerHTML`: `<div class="product attribute"><div class="label">Product:</div><div class="value">Falcon Suite</div></div>` — element exists with the correct saved value.
- `getComputedStyle` walk from `.product.attribute` up to `<body>`: the element itself is `display: none`; every ancestor (`.splitcontentleft`, `.splitcontent`, `.attributes`, `.issue...details`, `.collapsiblesidebar`) is `block`/`flex` — confirms the hide is specific to this one element, not a collapsed parent.
- New-issue form (customer role) DOM: `<select name="issue[product_id]">` present with real options (`Falcon Suite`, `Phoenix Core II`, etc.), confirming the customer genuinely gets asked to choose a Product at creation.

## Duplicate check

- Duplicate found: No (checked `bugs/_index.md` — no existing entry for Product visibility on the Customer role's ticket view; `HELPDESK_CONTENT_TEMPLATES.md` TC-HLP-014's only prior evidence was an Admin editing an existing ticket, never a Customer creating one)
- Existing bug reference (if duplicate): —

## Retest — 2026-09-18 (Local, `redmine-docker-6`, production issue #120475 checked in)

**CONFIRMED FIXED.** Root-caused the fix via source (`assets/stylesheets/customer_menu.css`): the offending CSS rule that unconditionally hid `.product` is now removed entirely, replaced with a comment explaining the original mistake — it was meant to hide a *duplicate* Product row, but that duplication was already prevented server-side (`view_hooks.rb` skips rendering its own Product row on the branded customer ticket view), so the rule was hiding the customer's only Product row, not a real duplicate.

Live-verified end-to-end as `alpha.customer`: created a fresh ticket (#337) via the real customer-facing New Issue form, selecting Product "Falcon Suite". Opened the same ticket as the same customer — `.product.attribute` now resolves to `getComputedStyle(...).display === "block"` (was `"none"`), and the field grid visibly shows "Product: Falcon Suite" between Priority and Organization, exactly matching the documented `HELPDESK_USER_GUIDE.md` §7 promise. `HELPDESK_CONTENT_TEMPLATES.md` TC-HLP-014 can now be updated to reflect the customer-side case as passing too.

## Notes

- Found while directly investigating a user question: "does a customer select Product during ticket creation, and can they edit it after?" Selecting during creation: confirmed working. Editing after creation: confirmed customers have no field-editing surface at all post-creation (matches the plugin's documented reduced-customer-model, not itself a bug) — but that investigation surfaced this separate, real finding: the value is asked for, saved, and then permanently invisible to the very role who set it.
- `HELPDESK_CONTENT_TEMPLATES.md` TC-HLP-014 should get a follow-up evidence note pointing at this bug, since its existing PASS only covered the Admin/Agent side of "picking a product on the ticket form saves and displays."
