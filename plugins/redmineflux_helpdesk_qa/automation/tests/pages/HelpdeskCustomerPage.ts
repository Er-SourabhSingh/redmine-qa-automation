import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Helpdesk › Customers (/rf_customers). Locators verified against the live
 * Forge instance on 2026-08-21, full CRUD+search cycle re-confirmed 2026-08-24.
 *
 * CORRECTED (was wrong): the New Customer form DOES have a "Project access"
 * section (Project/SLA/Support Level/Organization + "Add project" for
 * multiple rows) — it just renders conditionally, only once an eligible
 * Helpdesk-enabled project (and, for the row to be fully selectable, an SLA
 * and organization) exists. Confirmed live with real field names below.
 *
 * Confirmed live 2026-08-24 (customer "Acme Customer" / acme.customer1, id=25):
 * - Create WITH Project Access fully filled (Project/SLA/Support
 *   Level/Organization) succeeds cleanly — BUG-HLP-001's stuck validation
 *   message did NOT reproduce this run.
 * - /rf_customers/:id/edit is correct and pre-fills all Project Access
 *   fields from the saved row, confirming the Rails REST URL guess.
 * - Update works: changed Support Level L1→L2 on the existing row, verified
 *   persisted in the list afterward.
 * - Search (?search=) and organization filter both work; a no-match search
 *   shows "Nothing matched" (same pattern as Organization/SLA/Holiday/Support Level).
 * - Delete is the same JS confirmation-modal pattern as every other Helpdesk
 *   Settings entity (a.rf-delete-btn[data-item-name][data-item-type="customer"])
 *   — CONFIRMED LIVE 2026-08-24 (second pass, new Forge instance) end-to-end
 *   against a throwaway "CRUD Test" customer, not just markup-inspected.
 * - /rf_customers and /rf_helpdesk/customers are BOTH live routes to the same
 *   list (not a redirect) — either can be used for openList().
 * - Duplicate Login refused with exact message "Login has already been
 *   taken"; duplicate Email (different login) refused with "Email has
 *   already been taken" — both confirmed live 2026-08-24.
 * - TC-HLP-045/122 RESOLVED 2026-08-24: "Add project" DOES persist multiple
 *   distinct project-access rows. Enabled the Helpdesk module on a second
 *   project ("Agile Board Project", identifier "agileboard") and created a
 *   support level for it (AB-L1) since Support Level is a hard-required
 *   field per row with no way to leave it blank for a project with zero
 *   levels defined ("Support Level is required" — submitting with "none"
 *   silently drops ALL project-access rows back to a blank single row rather
 *   than a field-level error). With a valid support level available for both
 *   projects, customer id=26 ("MultiProject CustomerTwo") saved successfully
 *   with 2 project-access rows (Agile Board Project/AB-L1 and Helpdesk
 *   Service Desk/L1), confirmed in both the list ("Projects: 2",
 *   "Support Level: AB-L1, L1") and the edit form (both rows pre-filled
 *   with their correct project). One related discrepancy noted but not
 *   filed as a bug yet: the Project dropdown in this form is scoped to the
 *   CURRENT USER's project memberships (daisy.skye, who is only a member of
 *   Helpdesk Service Desk, saw just that one project even after the
 *   Helpdesk module was enabled elsewhere), not to "every Helpdesk-enabled
 *   project" — worth a UX/permissions test case of its own.
 */
export class HelpdeskCustomerPage extends BasePage {
  private readonly loginInput = this.page.locator('#customer_login');
  private readonly firstNameInput = this.page.locator('#customer_firstname');
  private readonly lastNameInput = this.page.locator('#customer_lastname');
  private readonly emailInput = this.page.locator('#customer_mail');
  private readonly passwordInput = this.page.locator('#customer_password');
  private readonly passwordConfirmationInput = this.page.locator('#customer_password_confirmation');
  private readonly generatePasswordCheckbox = this.page.locator('#generate_password');
  private readonly sendInformationCheckbox = this.page.locator('#send_information');
  /**
   * BUG FIX 2026-08-24: this used to locate `input[type="submit"][name="commit"]`,
   * which does not exist on this form — the real submit is a `<button
   * type="submit">`, labeled "Create" on /rf_customers/new and "Save" on
   * /rf_customers/:id/edit. The old locator would have silently matched
   * nothing and thrown on .click(); it was never actually exercised via the
   * page object (manual testing clicked the button directly), so this bug
   * itself was never triggered until this fix. Kept as one property since
   * only one submit button exists per page load (create OR edit, never both).
   */
  private readonly submitButton = this.page.getByRole('button', { name: /^(Create|Save)$/ });

  // Project Access section — confirmed live 2026-08-21. Real field names use
  // an array index per row: customer_projects[N][project_id|sla_id|support_level_id|organization_id].
  // Only row 0 is modeled explicitly here; use projectAccessRow(n) for others.
  private readonly addProjectButton = this.page.getByRole('button', { name: 'Add project' });

  private projectAccessRow(index: number) {
    return {
      project: this.page.locator(`select[name="customer_projects[${index}][project_id]"]`),
      sla: this.page.locator(`select[name="customer_projects[${index}][sla_id]"]`),
      supportLevel: this.page.locator(`select[name="customer_projects[${index}][support_level_id]"]`),
      organization: this.page.locator(`select[name="customer_projects[${index}][organization_id]"]`),
      deleteButton: this.page.getByRole('button', { name: 'Delete' }).nth(index),
    };
  }

  // List view: CORRECTED 2026-08-24 — /rf_customers and /rf_helpdesk/customers
  // are BOTH live routes to the same list (confirmed: creating a customer
  // redirects to /rf_customers, and navigating to /rf_helpdesk/customers
  // directly renders the identical list with no redirect). Real <table> row
  // markup confirmed against customer "Acme Customer" (id=25).
  private readonly searchInput = this.page.getByPlaceholder('Search customers...');
  private readonly organizationFilterSelect = this.page.locator('select#organization_id');
  private readonly applyFiltersButton = this.page.getByRole('button', { name: 'Apply Filters' });
  private readonly clearFiltersLink = this.page.getByRole('link', { name: 'Clear' });

  /**
   * Real nav path (added 2026-08-25): Helpdesk Command Center rail →
   * "Customers". A fresh Playwright test starts on a blank page even with a
   * restored auth session (storageState only restores cookies, not
   * navigation state) — goto('/') is the one sanctioned entry-point
   * navigation BasePage's own policy allows, landing on the authenticated
   * home page so the top nav actually exists to click (confirmed live
   * 2026-09-14: omitting this made every test in this suite time out
   * waiting for "Helpdesk Command Center" on an empty page).
   */
  async openList() {
    await this.goto('/');
    await this.clickTopNav('Helpdesk Command Center');
    await this.clickHelpdeskSubNav('Customers');
  }

  /**
   * Navigates to the list, then clicks "New Customer".
   *
   * BUG FIX 2026-09-14: on an EMPTY customer list, "New Customer" renders
   * TWICE — once as the persistent header button, once again inside the
   * "No customers yet" empty-state block — a strict-mode violation
   * (confirmed live via provision.setup.ts's first-ever run against a
   * genuinely empty Local instance; every prior run had existing customers,
   * so only the header button was ever present). The header button is
   * always first in DOM order, present whether the list is empty or not,
   * so `.first()` is reliable either way.
   */
  async openNew() {
    await this.openList();
    await this.page.getByRole('link', { name: 'New Customer' }).first().click();
  }

  async search(term: string) {
    await this.searchInput.fill(term);
    await this.applyFiltersButton.click();
  }

  async filterByOrganization(organization: string) {
    await this.organizationFilterSelect.selectOption({ label: organization });
    await this.applyFiltersButton.click();
  }

  async clearFilters() {
    await this.clearFiltersLink.click();
  }

  async createAccount(options: {
    login: string;
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    sendInformation?: boolean;
    /** One entry per project-access row to fill in via "Add project" (beyond the first, already-present row). */
    projectAccess?: Array<{ project: string; sla?: string; supportLevel?: string; organization?: string }>;
  }) {
    await this.openNew();
    await this.loginInput.fill(options.login);
    await this.firstNameInput.fill(options.firstName);
    await this.lastNameInput.fill(options.lastName);
    await this.emailInput.fill(options.email);
    if (options.password) {
      await this.passwordInput.fill(options.password);
      await this.passwordConfirmationInput.fill(options.password);
    } else {
      await this.generatePasswordCheckbox.check();
    }
    if (options.sendInformation === false) await this.sendInformationCheckbox.uncheck();
    if (options.projectAccess) {
      for (let i = 0; i < options.projectAccess.length; i++) {
        if (i > 0) await this.addProjectButton.click(); // row 0 exists by default; click "Add project" for each additional row
        const entry = options.projectAccess[i];
        const row = this.projectAccessRow(i);
        await row.project.selectOption({ label: entry.project });
        if (entry.sla) await row.sla.selectOption({ label: entry.sla });
        if (entry.supportLevel) await row.supportLevel.selectOption({ label: entry.supportLevel });
        if (entry.organization) await row.organization.selectOption({ label: entry.organization });
      }
    }
    await this.submitButton.click();
  }

  /** Removes a project-access row by index via its Delete button — does not save; call after createAccount/edit is loaded. */
  async removeProjectAccessRow(index: number) {
    await this.projectAccessRow(index).deleteButton.click();
  }

  /**
   * Adds a brand-new, blank project-access row (clicks "Add project") and
   * fills it — for TC-HLP-063's two-step scenario (row A saved in one Save,
   * row B added via a SEPARATE later edit, without touching row A) — does
   * NOT save; call submit() after. `index` is the new row's position (the
   * count of rows already on the form before this call).
   */
  async addProjectAccessRow(index: number, entry: { project: string; sla?: string; supportLevel?: string; organization?: string }) {
    await this.addProjectButton.click();
    const row = this.projectAccessRow(index);
    await row.project.selectOption({ label: entry.project });
    if (entry.sla) await row.sla.selectOption({ label: entry.sla });
    if (entry.supportLevel) await row.supportLevel.selectOption({ label: entry.supportLevel });
    if (entry.organization) await row.organization.selectOption({ label: entry.organization });
  }

  /** Clicks the form's Create/Save button — for flows (like addProjectAccessRow) that build up a submission across several page-object calls before submitting. */
  async submit() {
    await this.submitButton.click();
  }

  /** Navigates to the list, then clicks the named row's "Edit" link — pre-fills Project Access from the saved row. */
  async openEdit(customerFullName: string) {
    await this.openList();
    await this.row(customerFullName).getByRole('link', { name: 'Edit' }).click();
  }

  /** Reads the "Projects" column (a count, e.g. "2" for a multi-project customer) — call after openList(). */
  async getProjectCount(customerFullName: string): Promise<string | null> {
    return this.getRowCellText(customerFullName, 'Projects');
  }

  /** Reads the "Organization Name" column — call after openList(). */
  async getOrganizationName(customerFullName: string): Promise<string | null> {
    return this.getRowCellText(customerFullName, 'Organization Name');
  }

  /** Reads the "Open" (open-ticket count) column — call after openList(). Used by TC-HLP-052/116 to cross-check against Customer 360's own Open KPI. */
  async getOpenCount(customerFullName: string): Promise<string | null> {
    return this.getRowCellText(customerFullName, 'Open');
  }

  /**
   * Confirmed live 2026-08-24 via markup inspection: same JS confirmation-modal
   * pattern as every other Helpdesk Settings entity. Not actually exercised
   * (keeper test data), but a.rf-delete-btn[data-item-type="customer"] was
   * observed directly on the live customer list row.
   */
  async delete(customerFullName: string) {
    await this.page.locator(`a.rf-delete-btn[data-item-name="${customerFullName}"]`).click();
    await this.page.getByRole('button', { name: 'Delete' }).click();
  }

  /** Call after openEdit(). Only touches the first project-access row; use projectAccessRow() directly for others. */
  async edit(options: {
    firstName?: string;
    lastName?: string;
    email?: string;
    supportLevel?: string;
    sla?: string;
    organization?: string;
  }) {
    if (options.firstName) await this.firstNameInput.fill(options.firstName);
    if (options.lastName) await this.lastNameInput.fill(options.lastName);
    if (options.email) await this.emailInput.fill(options.email);
    const row = this.projectAccessRow(0);
    if (options.sla) await row.sla.selectOption({ label: options.sla });
    if (options.supportLevel) await row.supportLevel.selectOption({ label: options.supportLevel });
    if (options.organization) await row.organization.selectOption({ label: options.organization });
    await this.submitButton.click();
  }

  async assertEmptyState() {
    await expect(this.page.getByText('No customers yet')).toBeVisible();
  }

  async assertRowVisible(fullName: string) {
    await expect(this.page.getByRole('link', { name: fullName })).toBeVisible();
  }

  /**
   * True if a Customer record with this login already exists — provisioning's
   * check-before-create. Unlike Organization/User, the login here is NOT its
   * own link (it renders as plain text next to the name link, e.g. "Karen
   * Chen customer.atlas.karen" in one cell — confirmed live 2026-09-14), so
   * this matches via row(), the shared hasText-row lookup, instead of
   * getByRole('link').
   *
   * Filters the list by `login` first (via the existing search() method)
   * rather than checking row() against whatever the unfiltered/default list
   * happens to render — AdminUsersPage.exists() had exactly this bug (a
   * live-confirmed false negative once the list grew past one page) before
   * being fixed the same way, so this is applied here too even though it
   * hasn't itself been observed to fail yet. Call after openList().
   */
  async exists(login: string): Promise<boolean> {
    await this.search(login);
    return this.row(login).isVisible().catch(() => false);
  }

  /** Distinct from assertEmptyState — the filtered/searched-with-no-results state, confirmed live 2026-08-24. */
  async assertNoSearchResults() {
    await expect(this.page.getByText('Nothing matched')).toBeVisible();
  }

  /** Confirmed live 2026-08-24 — exact message: "Login has already been taken". */
  async assertDuplicateLoginRefused() {
    await expect(this.page.getByText(/Login has already been taken/i)).toBeVisible();
  }

  /** Confirmed live 2026-08-24 — exact message: "Email has already been taken". */
  async assertDuplicateEmailRefused() {
    await expect(this.page.getByText(/Email has already been taken/i)).toBeVisible();
  }

  // --- Customer 360 (/rf_customers/:id) — confirmed live 2026-09-14 ---

  /** Navigates to the list, then clicks the named row's "Customer details" link (the eye icon) — opens Customer 360, NOT the Portal Preview (TC-HLP-053). */
  async openDetail(customerFullName: string) {
    await this.openList();
    await this.row(customerFullName).getByRole('link', { name: 'Customer details' }).click();
  }

  /** Navigates straight to Customer 360 by id. */
  async openDetailById(customerId: number) {
    await this.goto(`/rf_customers/${customerId}`);
  }

  // Identity block — shares the plugin's `.rf_helpdesk_fact` markup with the
  // Organization detail page (see BasePage.getFactValue).
  async getLogin(): Promise<string | null> {
    return this.getFactValue('Login');
  }

  async getEmail(): Promise<string | null> {
    return this.getFactValue('Email');
  }

  async getCustomer360OrganizationName(): Promise<string | null> {
    return this.getFactValue('Organization Name');
  }

  async getCustomerSince(): Promise<string | null> {
    return this.getFactValue('Customer since');
  }

  /** KPI row — `.rf_helpdesk_stat_card` > `.rf_helpdesk_stat_number` + `.rf_helpdesk_stat_label`, e.g. "Total Tickets"/"Open"/"Waiting on them"/"Breached"/"Resolved". */
  async getStat(label: string): Promise<string | null> {
    const card = this.page
      .locator('.rf_helpdesk_stat_card')
      .filter({ has: this.page.locator('.rf_helpdesk_stat_label', { hasText: label }) });
    const text = await card.locator('.rf_helpdesk_stat_number').textContent();
    return text?.trim() ?? null;
  }

  /** Reads one column of the "Projects & entitlements" table's row for the given project — real `<table>`/`<th>` markup, reuses BasePage.getRowCellText. */
  async getEntitlementCell(projectName: string, columnHeader: 'Project' | 'SLA Name' | 'Support Level' | 'Organization Name' | 'Open' | 'Created on'): Promise<string | null> {
    return this.getRowCellText(projectName, columnHeader);
  }

  // --- Project Access dropdown scoping (TC-HLP-048/283/284) ---
  // Confirmed live 2026-09-14: SLA/Support Level options for a project other
  // than the row's currently-selected Project are present in the DOM but
  // rendered `disabled` (BUG-HLP-004 — the option should arguably not appear
  // at all, but the FUNCTIONAL requirement — can't be selected — holds).
  // Organization is deliberately NOT filtered this way (TC-HLP-050, by design).

  private projectAccessSelect(index: number, field: 'sla' | 'supportLevel' | 'organization') {
    return this.projectAccessRow(index)[field];
  }

  /**
   * True if `optionLabel` is disabled in the given row's dropdown right now
   * (call after selecting a Project in that row).
   *
   * BUG FIX 2026-09-14: `hasText` does a SUBSTRING match, so looking up "L1"
   * also matched "L1 - Helpdesk Support" (a real option on this instance) —
   * confirmed live via a strict-mode violation on a real test run. Match the
   * option's exact, trimmed text instead via `hasText` with an anchored
   * RegExp, which Playwright treats as an exact-text filter.
   */
  async isProjectAccessOptionDisabled(index: number, field: 'sla' | 'supportLevel' | 'organization', optionLabel: string): Promise<boolean> {
    const exact = new RegExp(`^${optionLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
    const option = this.projectAccessSelect(index, field).locator('option', { hasText: exact });
    return (await option.getAttribute('disabled')) !== null;
  }

  /** All option labels currently in the given row's dropdown, in DOM order — used to confirm Organization's full list stays IDENTICAL across a Project change (TC-HLP-050), unlike SLA/Support Level. */
  async getProjectAccessOptionLabels(index: number, field: 'sla' | 'supportLevel' | 'organization'): Promise<string[]> {
    return this.projectAccessSelect(index, field).locator('option').allTextContents();
  }

  /** Selects the row's Project dropdown only, without touching SLA/Support Level/Organization or submitting — for TC-HLP-048/283/284, which inspect the OTHER dropdowns' reaction to a Project change. Call openNew()/openEdit() first. */
  async selectProjectAccessProject(index: number, projectLabel: string) {
    await this.projectAccessRow(index).project.selectOption({ label: projectLabel });
  }

  /** Selects whichever real option comes first after the placeholder ("None", index 0) — avoids hardcoding a specific SLA/Support Level/Organization name that could be renamed later. Requires the row's Project to already be selected (SLA/Support Level are scoped to it). */
  async selectProjectAccessFirstAvailable(index: number, field: 'sla' | 'supportLevel' | 'organization') {
    await this.projectAccessSelect(index, field).selectOption({ index: 1 });
  }

  /** Reads back whichever option ended up selected, by its visible label — e.g. to record what "first available" resolved to. */
  async getProjectAccessSelectedLabel(index: number, field: 'sla' | 'supportLevel' | 'organization'): Promise<string> {
    const select = this.projectAccessSelect(index, field);
    return select.locator('option:checked').innerText();
  }
}
