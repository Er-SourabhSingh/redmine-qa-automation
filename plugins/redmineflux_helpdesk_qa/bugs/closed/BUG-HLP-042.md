# BUG-HLP-042

- Bug ID: BUG-HLP-042
- Production Redmine Issue ID: 120087
- Title: Customer creation is unconditionally, permanently blocked once any User custom field is marked required — the Customer create/edit forms expose no custom-fields section at all, unlike Redmine's own core `/users/new`/`/users/:id/edit`
- Redmine version: 6 (local Docker, `redmine-docker-6`)
- Plugin name: Redmineflux Helpdesk
- Plugin version: (installed copy in `redmine-docker-6-redmine-1`, current as of 2026-09-07)
- Environment: Local (`http://localhost:3012`, container `redmine-docker-6-redmine-1`)
- Browser: Chromium (Playwright MCP)
- User role: Admin
- Date: 2026-09-07

## Steps to reproduce

1. As Admin, go to Administration → Custom fields → New custom field → type **Users**, name it anything, check **Is required**, Create.
2. Go to Helpdesk → Customers → New Customer.
3. Fill in every field the form actually offers (Login, First name, Last name, Email, Password, Confirmation) — there is no field anywhere on this form for the new required custom field.
4. Click Create.

## Expected result

Either the Customer form should expose the same User custom fields section Redmine's own core `/users/new` renders (so an admin can actually satisfy a required field), or required User custom fields should not block Customer creation through a form that structurally cannot present them — one of the two, since as currently built neither is true and there is no way to create a Customer at all once this configuration exists.

## Actual result

**Customer creation is completely and unconditionally blocked**, for any input, with no way to proceed:

- Created a required Text custom field ("QA Required User Field") on the **Users** custom-field type — confirmed `is_required` checked via the field's own Edit page after creation.
- Confirmed as a control: Redmine's own core `/users/new` form correctly renders this field as a real `<input>` and enforces it — the field itself is not broken, it works exactly as designed everywhere Redmine's own admin UI is used.
- On the Helpdesk plugin's own **New Customer** form (`/rf_customers/new`): filled in a fully valid Login/First name/Last name/Email/Password/Confirmation — no custom-fields section renders anywhere on this form (confirmed via a full DOM/accessibility snapshot).
- Clicking Create returns the same form, re-rendered, with the error **"Qa required user field cannot be blank"** — the only error shown, everything else was valid.
- Checked whether the record was created anyway, despite the error, via three independent methods: (1) the Customers list (`/rf_helpdesk/customers`) stayed at exactly 16 rows, no new row; (2) Administration → Users search (`/users?name=qa.reqfield.customer`) returned "No data"; (3) direct `rails runner` query, `User.find_by(login: 'qa.reqfield.customer')` → `nil`, `User.where("login LIKE '%qa.reqfield%'")` → `[]`. **No User record of any kind was created** — the block is a clean, atomic validation failure, not a partial/orphaned save.
- Root-caused via source (`rf_customers_controller.rb#create`): `@customer = User.new(customer_params)` ... `if @customer.save … else render :new end` — a single, standard Rails atomic save/validate. The defect isn't a data-integrity gap in this controller; it's that the **form itself has no way to satisfy any User custom field**, so once one is required, this single `if @customer.save` branch can never succeed again through this form, for any admin, for any input.

## Evidence

### Screenshot

![Customer creation blocked by a required User custom field the form never exposes](../../screenshots/BUG-HLP-042/customer-create-blocked-by-required-user-custom-field.png)

### Console / log

- Custom field confirmed required via direct DOM read on its own Edit page (`/custom_fields/3/edit`): `document.querySelector('input[name="custom_field[is_required]"]').checked === true`.
- Control check on core `/users/new`: field renders as `QA Required User Field *` with a real `<input>`, positioned in the standard "Information" fieldset alongside Login/Firstname/Lastname/Mail — proves the field definition itself is correct and Redmine's native custom-field rendering/enforcement works as expected.
- New Customer form (`/rf_customers/new`) full snapshot: only Login/First name/Last name/Email/Password/Confirmation/Generate-password/Send-account-info fields exist, plus the separate "Project access" group (Project/SLA/Support Level/Organization) — no custom-fields section, no field named anything like the new required field, anywhere in the DOM.
- Submission with a fully valid Login/First name/Last name/Email/Password re-rendered `New Customer` (not a redirect) with flash error list containing exactly one item: "Qa required user field cannot be blank".
- Verified no orphaned record three ways: Customers list row count unchanged (16 before and after); `/users?name=qa.reqfield.customer` → "No data"; `rails runner` direct query confirmed zero matching `User` rows.
- Source read: `plugins/redmineflux_helpdesk/app/controllers/rf_customers_controller.rb`, `create` action — `@customer = User.new(customer_params)` then `if @customer.save … else … render :new end`, a standard atomic Rails validate-then-save with no partial commit path. The `update` action (editing an existing customer) follows the identical pattern (`assign_attributes` then `if @customer.save`), so the same total block applies to Edit as well, not just Create.

## Duplicate check

- Duplicate found: No (checked `bugs/_duplicates.md` — empty register; grepped all of `docs/`, `testcases/`, and `bugs/` for "custom field" — this scenario was never previously tested, documented, or filed)
- Existing bug reference (if duplicate): None. Not related to BUG-HLP-001 (an earlier, since-resolved Customer-creation error that also turned out non-reproducible on this build) or any other open bug — this is a newly-discovered, first-time-tested gap.

## Notes

- Prompted directly by the user, who had observed this exact scenario (required User custom field + Customer creation) and asked whether it had been reported — it had not; this bug file and TC-HLP-145 (`HELPDESK_FIELD_VALIDATIONS.md`, new Section H) are the first coverage of this scenario in the suite's history.
- The user's own framing was that the error appears but the customer is created anyway (a partial-save/data-integrity concern). Live re-verification (UI + Administration → Users search + a direct `rails runner` query) shows that is **not** what happens on this build — the create is fully and correctly blocked, no orphaned `User` row results. The actual defect is the opposite framing: creation is **totally, permanently impossible** through this form once any User custom field is required, since the form never gives the admin anywhere to enter it. Documenting this distinction explicitly so it isn't miscited later as "confirms the user's original theory" — it does not; it confirms a different, real defect in the same area.
- Severity judged **Medium**: no data corruption, no security impact, and a workaround exists at the admin-configuration layer (don't mark a User custom field required, or unrequire it before using the Customer form) — but it is a real, total functional block on a core, documented feature (Customer creation) triggered by an entirely ordinary, supported admin action (Administration → Custom fields → Users → Is required) that has nothing to do with the Helpdesk plugin on its face.
- Recommend: either (a) have the Customer create/edit forms render the standard Redmine custom-fields partial for `User` custom fields (the same partial core `/users/new`/`/users/:id/edit` use), or (b) if Customer records are deliberately meant to be a reduced-field subset of `User`, document that Customer creation requires all User custom fields to be non-required, and/or have `RfCustomersController` explicitly skip/relax validation for any custom field not part of its own form.
- Same root-cause class applies to `update` (Edit) as well as `create` — confirmed via source, not yet re-verified live on Edit (TC-HLP-145 only exercises Create). Worth a quick follow-up TC if this bug is picked up for a fix, to confirm the Edit path behaves identically before closing.

## Retest — Confirmed FIXED (2026-09-10)

- Production issue #120087 found marked "In QA" (developer checked in a fix), triggering this retest per the user's request to retest all checked-in Helpdesk bugs on `localhost:3012`.
- The original fixture custom field ("QA Required User Field") no longer existed on this environment (0 User custom fields present) — recreated an equivalent required Text custom field on the **Users** type ("QA Required User Field Retest") to restore the precondition.
- On the Helpdesk plugin's **New Customer** form (`/rf_customers/new`): the new required custom field **now renders as a real input** ("QA Required User Field Retest *"), unlike the original bug where no custom-fields section appeared anywhere on the form.
- Filled in a fully valid Login/First name/Last name/Email/the new required field/Password/Confirmation and clicked Create. **Result: "Successful creation. Welcome email sent to customer successfully."** — the customer (`qa.reqfield.retest`) was created and appears in the Customers list.
- This confirms the fix took the first of the two options this bug's own Notes section recommended: the Customer create form now renders the standard User custom-fields section, so a required User custom field no longer structurally blocks Customer creation.
- Cleanup: deleted the fixture custom field and the throwaway test customer created for this retest, restoring the environment to its prior state (0 User custom fields).
- Production issue #120087 synced 2026-09-10: status In QA → Done, % done → 100 (approved).
