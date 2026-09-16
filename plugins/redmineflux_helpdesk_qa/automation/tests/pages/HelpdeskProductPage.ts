import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Helpdesk Settings › Products (/rf_products). Locators verified against the
 * live Forge instance on 2026-08-21 via real `name`/`id` attributes. Full
 * CRUD+search cycle confirmed 2026-08-24 on a fresh Forge instance (real
 * "Phoenix Core" kept as seed data, throwaway "CRUD Test Product" used for
 * the duplicate-name/duplicate-code/delete cycle) — this was previously an
 * untested gap (create+list+search only, no edit/delete).
 *
 * DISCREPANCY vs HELPDESK_USER_GUIDE.md §15: the real form also has a
 * "Description" textarea, not listed in the guide's field table (Name, Code,
 * Category, Project, Active only).
 *
 * Confirmed live 2026-08-24 (exact validation wording):
 * - Duplicate Product Name (same project, different code): "Product Name
 *   has already been taken for this project" — uniqueness is PER-PROJECT,
 *   unlike Organization/SLA/Support-Level-Name which are install-wide.
 * - Duplicate Code (same project, different name): "Code has already been
 *   taken for this project" — also per-project.
 * - Same BUG-HLP-003 Active-checkbox-can't-be-unchecked-via-Edit defect as
 *   every other entity — BUT the list view at /rf_products has its own
 *   working AJAX toggle checkbox (`input.product-active-toggle`,
 *   `data-url=".../toggle_active"`), same pattern as Organization/SLA/
 *   Support Level. Use `setActiveViaListToggle()` to actually change Active.
 * - The submit button here genuinely IS `input[type="submit"][name="commit"]`
 *   (same as Canned Response and SLA) — confirmed via direct DOM inspection,
 *   not assumed.
 */
export class HelpdeskProductPage extends BasePage {
  private readonly projectSelect = this.page.locator('#rf_product_project_id');
  private readonly nameInput = this.page.locator('#rf_product_name');
  private readonly codeInput = this.page.locator('#rf_product_code');
  private readonly categoryInput = this.page.locator('#rf_product_category');
  private readonly descriptionInput = this.page.locator('#rf_product_description');
  private readonly activeCheckbox = this.page.locator('input[type="checkbox"]#rf_product_active');
  private readonly submitButton = this.page.locator('input[type="submit"][name="commit"]');

  // List view (/rf_products) — real <table>, confirmed live 2026-08-24.
  // NOTE: Products also render as a tab inside Helpdesk Settings
  // (/rf_helpdesk/setting?tab=products) with the SAME #search id as the
  // other setting tabs (id collision — use placeholder there, not #search).
  private readonly searchInput = this.page.getByPlaceholder('Search products...');
  private readonly listProjectFilterSelect = this.page.locator('select#project_id');
  private readonly listStatusFilterSelect = this.page.locator('select#active');
  private readonly applyFiltersButton = this.page.getByRole('button', { name: 'Apply Filters' });
  private readonly clearFiltersLink = this.page.getByRole('link', { name: 'Clear' });

  /** Real nav path (added 2026-08-25): Helpdesk Command Center rail → "Products". */
  async openList() {
    await this.clickTopNav('Helpdesk Command Center');
    await this.clickHelpdeskSubNav('Products');
  }

  /** Navigates to the list, then clicks "New Product". */
  async openNew() {
    await this.openList();
    await this.page.getByRole('link', { name: 'New Product' }).click();
  }

  /** Navigates to the list, then clicks the named row's "Edit" link — pre-fills all fields, including (correctly reading, if not correctly writing) Active. */
  async openEdit(productName: string) {
    await this.openList();
    await this.row(productName).getByRole('link', { name: 'Edit' }).click();
  }

  /**
   * Confirmed live 2026-08-24: same JS confirmation-modal pattern as every
   * other Helpdesk Settings entity — a.rf-delete-btn[data-item-name],
   * data-item-type="product". Actually exercised end-to-end against a
   * throwaway "CRUD Test Product".
   */
  async delete(productName: string) {
    await this.page.locator(`a.rf-delete-btn[data-item-name="${productName}"]`).click();
    await this.page.getByRole('button', { name: 'Delete' }).click();
  }

  /**
   * The list row's live AJAX Active toggle — confirmed live 2026-08-24 as
   * the reliable way to (de)activate a product (see BUG-HLP-003; the Edit
   * form's checkbox does not persist). Call from the list page (openList()
   * first).
   */
  async setActiveViaListToggle(productId: number, active: boolean) {
    const toggle = this.page.locator(`#product_active_${productId}`);
    if (active) await toggle.check();
    else await toggle.uncheck();
  }

  async search(term: string) {
    await this.searchInput.fill(term);
    await this.applyFiltersButton.click();
  }

  async filterByProject(project: string) {
    await this.listProjectFilterSelect.selectOption({ label: project });
    await this.applyFiltersButton.click();
  }

  async filterByStatus(status: 'All Statuses' | 'Active only' | 'Inactive only') {
    await this.listStatusFilterSelect.selectOption({ label: status });
    await this.applyFiltersButton.click();
  }

  async clearFilters() {
    await this.clearFiltersLink.click();
  }

  async create(options: {
    project: string;
    name: string;
    code: string;
    category?: string;
    description?: string;
    active?: boolean;
  }) {
    await this.openNew();
    await this.projectSelect.selectOption({ label: options.project });
    await this.nameInput.fill(options.name);
    await this.codeInput.fill(options.code);
    if (options.category) await this.categoryInput.fill(options.category);
    if (options.description) await this.descriptionInput.fill(options.description);
    if (options.active === false) await this.activeCheckbox.uncheck();
    await this.submitButton.click();
  }

  /** Call after openEdit(). Only fills what's provided. Do NOT use for `active` — see BUG-HLP-003, use setActiveViaListToggle() instead. */
  async edit(options: {
    name?: string;
    code?: string;
    category?: string;
    description?: string;
  }) {
    if (options.name) await this.nameInput.fill(options.name);
    if (options.code) await this.codeInput.fill(options.code);
    if (options.category) await this.categoryInput.fill(options.category);
    if (options.description) await this.descriptionInput.fill(options.description);
    await this.submitButton.click();
  }

  /** Confirmed live 2026-08-24 — exact message: "Product Name has already been taken for this project" (per-project uniqueness). */
  async assertDuplicateNameRefused() {
    await expect(this.page.getByText(/Product Name has already been taken for this project/i)).toBeVisible();
  }

  /** Confirmed live 2026-08-24 — exact message: "Code has already been taken for this project" (per-project uniqueness). */
  async assertDuplicateCodeRefused() {
    await expect(this.page.getByText(/Code has already been taken for this project/i)).toBeVisible();
  }

  async assertRowVisible(name: string) {
    await expect(this.page.getByRole('link', { name })).toBeVisible();
  }

  /** Distinct from an empty-list state — the filtered/searched-with-no-results state, confirmed live 2026-08-24. */
  async assertNoSearchResults() {
    await expect(this.page.getByText('Nothing matched')).toBeVisible();
  }
}
