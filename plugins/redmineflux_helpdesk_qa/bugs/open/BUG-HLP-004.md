# Bug Report Template

- Bug ID: BUG-HLP-004
- Title: Customer form's SLA/Support Level dropdowns still list cross-project options (disabled, not removed) — the plugin's own `hidden` attribute on those options is being defeated by CSS
- Redmine version: (see QA_CREDENTIALS_FORGE.md — Forge, flux-fudbk2hlu49)
- Plugin name: Redmineflux Helpdesk
- Plugin version: —
- Environment: Forge (https://flux-fudbk2hlu49.forge.zehntech.com/)
- Browser: Chromium (Playwright MCP)
- User role: Administrator (admin)
- Date: 2026-08-24

## Steps to reproduce

1. Log in as admin.
2. Ensure at least two projects each have their own SLA and Support Level — this environment has SLA "Standard" + Support Level "L1" on "Helpdesk Service Desk" (project_id=9), and SLA "AgileSLA" + Support Level "AB-L1" on "Agile Board Project" (project_id=7).
3. Open `/rf_customers/new` (or edit an existing customer).
4. In the Project Access row, select **Project = Helpdesk Service Desk**.
5. Open the **SLA Name** dropdown (or the **Support Level** dropdown) and inspect its options — either visually (the disabled option still appears in the list) or via DOM: `document.querySelector('select[name="customer_projects[0][sla_id]"]').outerHTML`.

## Expected result

- Once a Project is chosen on the row, the SLA Name and Support Level dropdowns should only **list** that project's own options — the other project's SLA/Support Level should not appear in the dropdown at all.
- This is clearly the plugin's own intent: the cross-project `<option>` is rendered with a `hidden` attribute (see Actual result), which only makes sense as an attempt to remove it from the visible list entirely — not merely to grey it out.

## Actual result

- Selecting Project = "Helpdesk Service Desk" produces this SLA dropdown markup:
  ```html
  <select name="customer_projects[0][sla_id]" data-scoped="" class="rf_helpdesk_access_select">
    <option value="">none</option>
    <option value="2" data-project-id="7" hidden="" disabled="">AgileSLA</option>
    <option value="1" data-project-id="9">Standard</option>
  </select>
  ```
  and the identical pattern on the Support Level select (`AB-L1` gets `hidden="" disabled=""` when Helpdesk Service Desk is selected).
- The `hidden` attribute is present on the cross-project `<option>`, but `getComputedStyle(option).display` reports **`block`**, not `none` — i.e. the `hidden` attribute is not actually taking effect. Some CSS rule affecting `option` elements inside `.rf_helpdesk_access_select` (or `option` generally) is overriding the browser's default `[hidden] { display: none }` user-agent rule, so the option still renders in the dropdown's visible list — just non-selectable (`disabled`), not absent.
- Net effect: the option list is not filtered by project as intended — it always shows every SLA (or Support Level) across every project, with only the non-matching ones disabled instead of removed. This is functionally blocked from being selected (disabled options can't be chosen), but it's a real front-end defect relative to the plugin's own visible intent, and it will get progressively worse as more projects/SLAs/Support Levels are added — the dropdown fills with a majority of disabled noise instead of showing just the handful of valid choices for the selected project.
- Reproduced identically on both the New Customer form and the Edit Customer form, and in both directions (Helpdesk Service Desk ↔ Agile Board Project), for both the SLA Name and Support Level fields.

## Evidence

### Screenshot

![Bug evidence](../../screenshots/BUG-HLP-004/sla-dropdown-shows-cross-project-option.png)

### Console / log

- No console errors observed. This is a CSS/rendering defeat of an explicit `hidden` attribute the plugin's own script sets on the option element — not a JS exception.

## Duplicate check

- Duplicate found: No
- Existing bug reference (if duplicate): —
