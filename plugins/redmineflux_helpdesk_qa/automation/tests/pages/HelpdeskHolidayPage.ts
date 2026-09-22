import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Helpdesk Settings › Holidays (/rf_helpdesk_holidays). Locators verified
 * against the live Forge instance on 2026-08-21. Date fields are native
 * <input type="date"> — fill with 'YYYY-MM-DD'.
 */
export class HelpdeskHolidayPage extends BasePage {
  private readonly nameInput = this.page.locator('#rf_helpdesk_holiday_name');
  private readonly descriptionInput = this.page.locator('#rf_helpdesk_holiday_description');
  private readonly startDateInput = this.page.locator('#rf_helpdesk_holiday_start_date');
  private readonly endDateInput = this.page.locator('#rf_helpdesk_holiday_end_date');
  private readonly submitButton = this.page.locator('input[type="submit"][name="commit"]');

  // List view (/rf_helpdesk_holidays) — no redirect, own standalone page
  // (unlike Canned Responses). No row markup verified yet (empty state only).
  private readonly searchInput = this.page.getByPlaceholder('Search holidays...');
  private readonly applyFiltersButton = this.page.getByRole('button', { name: 'Apply Filters' });
  private readonly clearFiltersLink = this.page.getByRole('link', { name: 'Clear' });

  /** Real nav path (added 2026-08-25): Helpdesk Command Center rail → "Helpdesk Settings" → "Holiday" tab. */
  async openList() {
    await this.clickTopNav('Helpdesk Command Center');
    await this.clickHelpdeskSubNav('Helpdesk Settings');
    await this.clickSettingsTab('Holiday');
  }

  /** Navigates to the list, then clicks "New Holiday". */
  async openNew() {
    await this.openList();
    await this.page.getByRole('link', { name: 'New Holiday' }).click();
  }

  /** Navigates to the list, then clicks the named row's "Edit" link. */
  async openEdit(holidayName: string) {
    await this.openList();
    await this.row(holidayName).getByRole('link', { name: 'Edit' }).click();
  }

  /**
   * Confirmed live 2026-08-24: same JS confirmation-modal pattern as
   * Organization/SLA/Support Level — a.rf-delete-btn[data-item-name],
   * data-item-type="holiday". Inspected directly on the live Settings
   * holidays tab (data-delete-url="/rf_helpdesk_holidays/2" for "Winter Break 2026").
   */
  async delete(holidayName: string) {
    await this.page.locator(`a.rf-delete-btn[data-item-name="${holidayName}"]`).click();
    await this.page.getByRole('button', { name: 'Delete' }).click();
  }

  /** Call after openEdit(). Only fills what's provided. */
  async edit(options: { name?: string; description?: string; startDate?: string; endDate?: string }) {
    if (options.name) await this.nameInput.fill(options.name);
    if (options.description) await this.descriptionInput.fill(options.description);
    if (options.startDate) await this.startDateInput.fill(options.startDate);
    if (options.endDate) await this.endDateInput.fill(options.endDate);
    await this.submitButton.click();
  }

  async search(term: string) {
    await this.searchInput.fill(term);
    await this.applyFiltersButton.click();
  }

  async clearFilters() {
    await this.clearFiltersLink.click();
  }

  /** startDate/endDate as 'YYYY-MM-DD'. Pass the same value for both for a single-day holiday. */
  async create(options: { name: string; description?: string; startDate: string; endDate: string }) {
    await this.openNew();
    await this.nameInput.fill(options.name);
    if (options.description) await this.descriptionInput.fill(options.description);
    await this.startDateInput.fill(options.startDate);
    await this.endDateInput.fill(options.endDate);
    await this.submitButton.click();
  }

  /**
   * NOT YET VERIFIED — the exact duplicate-name error wording hasn't been
   * observed yet. Update this regex the first time TC-HLP-347 runs.
   */
  async assertDuplicateNameRefused() {
    await expect(this.page.getByText(/already been taken|has already been taken|must be unique/i)).toBeVisible();
  }

  async assertRowVisible(name: string) {
    await expect(this.page.getByRole('link', { name })).toBeVisible();
  }
}
