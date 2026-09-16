import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Helpdesk › Organizations (/rf_organizations). Locators verified against the
 * live Forge instance on 2026-08-21 — this is a custom UI, not a standard
 * Redmine ERB form, so selectors are not guessable from Redmine conventions.
 * Full CRUD+search cycle re-confirmed 2026-08-24 on a fresh Forge instance
 * (real "Acme Corp" kept as seed data, throwaway "CRUD Test Org" used for
 * the create/search/update/delete cycle).
 *
 * BUG-HLP-003 (High, open): the Active checkbox on THIS Edit form
 * (`/rf_organizations/:id/edit`) cannot be unchecked — saving with it
 * unchecked silently leaves the record Active (missing Rails hidden
 * fallback field, same root cause as Canned Response). Confirmed live
 * 2026-08-24 on "Acme Corp": unchecked via Edit, saved, reloaded Edit —
 * still checked.
 *
 * HOWEVER, unlike Canned Response, Organization has a WORKING WORKAROUND:
 * the list view's Active column renders a real, independently-wired AJAX
 * toggle checkbox (`input.organization-active-toggle`, `data-url=".../toggle_active"`)
 * — clicking it DOES correctly persist (confirmed: toggled off, reloaded
 * fresh, stayed off; toggled back on, reloaded fresh, stayed on). Use
 * `setActiveViaListToggle()` below to actually deactivate/reactivate an
 * organization — do NOT rely on `edit({ active: false })`, which reproduces
 * the bug.
 */
export class HelpdeskOrganizationPage extends BasePage {
  // --- Prepaid Support Hours tab (/rf_organizations/:id?tab=prepaid_support_hours) ---
  // Locators confirmed live 2026-08-26 on Local (redmine-docker-6) by actually
  // executing TC-HLP-125 end to end (Alpha Org, Helpdesk QA Alpha project, 40h).
  // No "Run-out mode" field exists in the Add/top-up dialog — it's a separate
  // inline <select name="mode"> per project row in the "Budget by project" table.
  private readonly addTopUpHoursLink = this.page.getByRole('link', { name: 'Add / top up hours' });
  private readonly prepaidProjectSelect = this.page.locator('#prepaid_project_id'); // name="project_id"
  private readonly prepaidHoursInput = this.page.locator('#prepaid_hour'); // name="hour", type=number
  private readonly prepaidSupportPackageSelect = this.page.locator('#prepaid_support_package_id'); // name="rf_helpdesk_support_package_id"
  private readonly prepaidCommentInput = this.page.locator('#prepaid_comment'); // name="comment"
  private readonly prepaidCancelButton = this.page.locator('#cancel-org-prepaid-modal');
  private readonly prepaidSaveButton = this.page.locator('.rf_helpdesk_modal_overlay button[type="submit"]');
  private readonly prepaidCloseModalButton = this.page.locator('#close-org-prepaid-modal');

  /** Approved/Used/Remaining summary cards at the top of the Prepaid Support Hours tab. */
  private readonly prepaidSummaryCard = (label: 'Approved' | 'Used' | 'Remaining') =>
    this.page.locator('div', { has: this.page.getByText(label, { exact: true }) }).first();

  /** The "Budget by project" table's run-out-mode dropdown, scoped to a project's row (name="mode", no id — must be row-scoped, not queried bare). */
  private prepaidRunOutModeSelect(projectName: string) {
    return this.row(projectName).locator('select[name="mode"]');
  }

  private readonly nameInput = this.page.getByLabel('Organization Name *');
  private readonly websiteInput = this.page.getByLabel('Website');
  private readonly phoneInput = this.page.getByLabel('Phone Number');
  private readonly addressInput = this.page.getByLabel('Organization Address');
  private readonly employeeCountInput = this.page.getByLabel('Number of Employees');
  private readonly notesInput = this.page.getByLabel('Notes');
  private readonly billingInfoInput = this.page.getByLabel('Billing Info');
  private readonly activeCheckbox = this.page.getByLabel('Active');
  private readonly submitButton = this.page.getByRole('button', { name: /^(Create|Save)$/ });

  // List view (/rf_organizations) — real <table>, confirmed live 2026-08-24.
  private readonly searchInput = this.page.getByPlaceholder('Search organizations...');
  private readonly statusFilterSelect = this.page.locator('select#active');
  private readonly applyFiltersButton = this.page.getByRole('button', { name: 'Apply Filters' });
  private readonly clearFiltersLink = this.page.getByRole('link', { name: 'Clear' });
  /**
   * Scoped with `.first()` pre-emptively (2026-09-14): the Customer list's
   * equivalent "New Customer" link renders TWICE on an empty list — once as
   * the persistent header button, once again inside the "No X yet"
   * empty-state block (confirmed live, a real strict-mode violation caught
   * by provision.setup.ts's first-ever run against a genuinely empty
   * instance — see HelpdeskCustomerPage.openNew()). This page's own
   * assertEmptyState() ("No organizations yet") suggests the same shared
   * empty-state component, so the same duplicate-link risk likely applies
   * here too, even though no test has hit it yet (every run so far has been
   * against an environment with existing organizations).
   */
  private readonly newOrganizationLink = this.page.getByRole('link', { name: 'New Organization' }).first();

  /** The list row's live AJAX Active toggle — see BUG-HLP-003 note above for why this is the reliable way to (de)activate. */
  private activeToggle(organizationId: number) {
    return this.page.locator(`#organization_active_${organizationId}`);
  }

  /**
   * Real nav path (added 2026-08-25): Helpdesk Command Center rail →
   * "Organization". A fresh Playwright test starts on a blank page even with
   * a restored auth session (storageState only restores cookies, not
   * navigation state) — goto('/') is the one sanctioned entry-point
   * navigation BasePage's own policy allows, landing on the authenticated
   * home page so the top nav actually exists to click (confirmed live
   * 2026-09-14: omitting this made every test in this suite time out
   * waiting for "Helpdesk Command Center" on an empty page).
   */
  async openList() {
    await this.goto('/');
    await this.clickTopNav('Helpdesk Command Center');
    await this.clickHelpdeskSubNav('Organization');
  }

  /** Navigates to the list, then clicks "New Organization". */
  async openNew() {
    await this.openList();
    await this.newOrganizationLink.click();
  }

  /** Navigates to the list, then clicks the named row's "Edit" link — pre-fills all fields, including (correctly reading, if not correctly writing) Active. */
  async openEdit(organizationName: string) {
    await this.openList();
    await this.row(organizationName).getByRole('link', { name: 'Edit' }).click();
  }

  /** Reads the "User Count" column (customers linked to this organization) — call after openList(). */
  async getUserCount(organizationName: string): Promise<string | null> {
    return this.getRowCellText(organizationName, 'User Count');
  }

  /** Reads the row's numeric id from its own "Edit" link href — call after openList(). Used where a test needs the id (e.g. setActiveViaListToggle()) but only knows the organization's name. */
  async getOrganizationId(organizationName: string): Promise<number> {
    const href = await this.row(organizationName).getByRole('link', { name: 'Edit' }).getAttribute('href');
    const id = Number(href?.match(/\/rf_organizations\/(\d+)\/edit/)?.[1]);
    if (!id) throw new Error(`Could not read an organization id from Edit link href "${href}" for row "${organizationName}"`);
    return id;
  }

  /**
   * Confirmed live 2026-08-24: delete is a JS confirmation modal, NOT a
   * plain link — click the row's delete icon (a.rf-delete-btn), then confirm
   * in the "Delete Organization?" modal. This same modal pattern
   * (data-item-type/data-delete-url + Cancel/Delete buttons) is shared across
   * every Helpdesk Settings entity.
   */
  async delete(organizationName: string) {
    await this.page.locator(`a.rf-delete-btn[data-item-name="${organizationName}"]`).click();
    await this.page.getByRole('button', { name: 'Delete' }).click();
  }

  /**
   * Toggles Active via the list view's inline AJAX checkbox — the ONLY
   * reliable way to change Active on an existing organization (see
   * BUG-HLP-003; the Edit form's checkbox does not persist). Call from the
   * list page (openList() first). Confirmed to persist across reloads.
   */
  async setActiveViaListToggle(organizationId: number, active: boolean) {
    const toggle = this.activeToggle(organizationId);
    if (active) await toggle.check();
    else await toggle.uncheck();
  }

  async search(term: string) {
    await this.searchInput.fill(term);
    await this.applyFiltersButton.click();
  }

  async filterByStatus(status: 'All Statuses' | 'Active only' | 'Inactive only') {
    await this.statusFilterSelect.selectOption({ label: status });
    await this.applyFiltersButton.click();
  }

  async clearFilters() {
    await this.clearFiltersLink.click();
  }

  async assertEmptyState() {
    await expect(this.page.getByText('No organizations yet')).toBeVisible();
  }

  /**
   * Both Create and Save redirect to the LIST page on success (`/rf_organizations`,
   * "Successful creation."/"Successful update." flash) — NOT the detail page, despite
   * openDetail()'s original doc comment assuming otherwise. Confirmed live 2026-09-14
   * via MCP: after submitting, the URL is `/rf_organizations` and no `.rf_helpdesk_fact`
   * elements exist, which is why every getName()/getWebsite()/etc. call made right
   * after create()/edit() hung for the full 30s test timeout. On a validation failure
   * (e.g. duplicate name), the SAME URL is used but the "New Organization"/"Edit
   * Organization: ..." heading stays, so that heading is the only reliable success/
   * failure signal available (checked immediately after submit, no wait — the page
   * has already settled by the time .click() resolves).
   */
  private async goToDetailAfterSubmit(name: string, failureHeading: RegExp) {
    const failed = await this.page.getByRole('heading', { name: failureHeading }).isVisible().catch(() => false);
    if (failed) return; // stayed on the create/edit form — let the caller assert on the validation error instead
    const id = await this.getOrganizationId(name);
    await this.openDetail(id);
  }

  async create(options: {
    name: string;
    website?: string;
    phone?: string;
    address?: string;
    employeeCount?: number;
    notes?: string;
    billingInfo?: string;
    active?: boolean;
  }) {
    await this.openNew();
    await this.nameInput.fill(options.name);
    if (options.website) await this.websiteInput.fill(options.website);
    if (options.phone) await this.phoneInput.fill(options.phone);
    if (options.address) await this.addressInput.fill(options.address);
    if (options.employeeCount !== undefined) {
      await this.employeeCountInput.fill(String(options.employeeCount));
    }
    if (options.notes) await this.notesInput.fill(options.notes);
    if (options.billingInfo) await this.billingInfoInput.fill(options.billingInfo);
    if (options.active === false) await this.activeCheckbox.uncheck();
    await this.submitButton.click();
    await this.goToDetailAfterSubmit(options.name, /^New Organization$/);
  }

  /** Call after openEdit(). Only fills what's provided. Do NOT use for `active` — see BUG-HLP-003, use setActiveViaListToggle() instead. */
  async edit(options: {
    name?: string;
    website?: string;
    phone?: string;
    address?: string;
    employeeCount?: number;
    notes?: string;
    billingInfo?: string;
  }) {
    if (options.name) await this.nameInput.fill(options.name);
    if (options.website) await this.websiteInput.fill(options.website);
    if (options.phone) await this.phoneInput.fill(options.phone);
    if (options.address) await this.addressInput.fill(options.address);
    if (options.employeeCount !== undefined) await this.employeeCountInput.fill(String(options.employeeCount));
    if (options.notes) await this.notesInput.fill(options.notes);
    if (options.billingInfo) await this.billingInfoInput.fill(options.billingInfo);
    await this.submitButton.click();
    if (options.name) await this.goToDetailAfterSubmit(options.name, /^Edit Organization:/);
  }

  /** Confirmed live 2026-08-24 — exact message: "Organization Name has already been taken" (note: includes the field label, unlike Canned Response's plain "Name has already been taken"). */
  async assertDuplicateNameRefused() {
    await expect(this.page.getByText(/already been taken|has already been taken|must be unique/i)).toBeVisible();
  }

  async assertRowVisible(name: string) {
    await expect(this.page.getByRole('link', { name })).toBeVisible();
  }

  /** Distinct from assertEmptyState — this is the filtered/searched-with-no-results state, confirmed live 2026-08-24. */
  async assertNoSearchResults() {
    await expect(this.page.getByText('Nothing matched')).toBeVisible();
  }

  // --- Prepaid Support Hours ---

  /** Navigate straight to an organization's Prepaid Support Hours tab. Confirmed live 2026-08-26 (TC-HLP-125). */
  async openPrepaidHours(organizationId: number) {
    await this.goto(`/rf_organizations/${organizationId}?tab=prepaid_support_hours`);
  }

  /** Confirmed live 2026-08-26 — Package/Hours field can be negative to reduce a budget (see TC-HLP-127/136). */
  async addTopUpHours(options: { projectLabel: string; hours: number; supportPackage?: string; comment: string }) {
    await this.addTopUpHoursLink.click();
    await this.prepaidProjectSelect.selectOption({ label: options.projectLabel });
    await this.prepaidHoursInput.fill(String(options.hours));
    if (options.supportPackage) {
      await this.prepaidSupportPackageSelect.selectOption({ label: options.supportPackage });
    }
    await this.prepaidCommentInput.fill(options.comment);
    await this.prepaidSaveButton.click();
  }

  /** Reads one of the top summary cards (Approved/Used/Remaining) as its raw text, e.g. "40.00h". */
  async getPrepaidSummary(label: 'Approved' | 'Used' | 'Remaining'): Promise<string | null> {
    return this.prepaidSummaryCard(label).textContent();
  }

  /** Confirmed live 2026-08-26 — options are exactly "No limit" / "Hard — stop work" / "Soft — allow overage". */
  async setRunOutMode(projectName: string, mode: 'No limit' | 'Hard — stop work' | 'Soft — allow overage') {
    await this.prepaidRunOutModeSelect(projectName).selectOption({ label: mode });
  }

  /** Opens the per-project Ledger view (confirmed live 2026-08-26 — `?ledger_project_id=N&tab=prepaid_support_hours`, "Close" link returns to the summary). */
  async openLedger(projectName: string) {
    await this.row(projectName).getByRole('link', { name: 'Ledger' }).click();
  }

  // --- Detail page (/rf_organizations/:id) — confirmed live 2026-09-14 ---
  // Basic Information fields (Name/Website/Phone Number/Number of Employees/
  // Organization Address) render as the plugin's shared `.rf_helpdesk_fact`
  // label/value pairs (see BasePage.getFactValue). Notes and Billing
  // Information are separate cards with no label/value pairing — read via
  // their own dedicated methods below. A field with nothing entered renders
  // literally as "—" (facts) or "No notes available"/"No billing information
  // available" (the two card-only fields) — confirmed live on
  // "Alpha Minimal Fields Test Org".

  async getName(): Promise<string | null> {
    return this.getFactValue('Organization Name');
  }

  async getWebsite(): Promise<string | null> {
    return this.getFactValue('Website');
  }

  async getPhone(): Promise<string | null> {
    return this.getFactValue('Phone Number');
  }

  async getEmployeeCount(): Promise<string | null> {
    return this.getFactValue('Number of Employees');
  }

  async getAddress(): Promise<string | null> {
    return this.getFactValue('Organization Address');
  }

  private notesOrBillingCard(cardTitle: 'Notes' | 'Billing Information') {
    return this.page
      .locator('.rf_helpdesk_card')
      .filter({ has: this.page.locator('.rf_helpdesk_card_title', { hasText: cardTitle }) })
      .locator('.rf_helpdesk_card_body');
  }

  async getNotes(): Promise<string | null> {
    const text = await this.notesOrBillingCard('Notes').textContent();
    return text?.trim() ?? null;
  }

  async getBillingInfo(): Promise<string | null> {
    const text = await this.notesOrBillingCard('Billing Information').textContent();
    return text?.trim() ?? null;
  }

  /** Navigates straight to an organization's detail page by id (e.g. after create()/edit() redirected there, or to revisit later). */
  async openDetail(organizationId: number) {
    await this.goto(`/rf_organizations/${organizationId}`);
  }
}
