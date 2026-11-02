import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/** Administration → Custom fields, only what the import suite needs (a required issue custom field on one tracker). */
export class CustomFieldsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /** Creates a required Text issue custom field, for all projects, on the named tracker only. */
  async createRequiredIssueField(name: string, trackerName: string) {
    await this.goto('/custom_fields/new?type=IssueCustomField');
    await this.page.locator('#custom_field_name').fill(name);
    await this.page.locator('#custom_field_is_required').check();
    const trackerBoxes = this.page.locator('input[type=checkbox][name="custom_field[tracker_ids][]"]');
    for (let i = 0; i < (await trackerBoxes.count()); i++) await trackerBoxes.nth(i).uncheck();
    await this.page.locator('#custom_field_tracker_ids').getByLabel(trackerName, { exact: true }).check();
    await this.page.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(this.page.locator('#flash_notice')).toBeVisible();
  }

  async deleteIssueField(name: string) {
    await this.goto('/custom_fields?tab=IssueCustomField');
    const row = this.page.locator('tr', { has: this.page.getByRole('link', { name, exact: true }) });
    if ((await row.count()) === 0) return;
    this.page.once('dialog', (d) => d.accept());
    await row.locator('a.icon-del').click();
    await expect(this.page.getByRole('link', { name, exact: true })).toHaveCount(0);
  }
}
