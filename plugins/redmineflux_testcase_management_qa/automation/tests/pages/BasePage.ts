import { Page, expect } from '@playwright/test';

/** Shared behavior for every page object in this plugin's suite. */
export class BasePage {
  constructor(protected readonly page: Page) {}

  /** Retries once on a transient ERR_ABORTED (navigation racing a still-settling previous page) — a real 404/permission error still surfaces normally on the retry. */
  async goto(path: string) {
    try {
      await this.page.goto(path);
    } catch (err) {
      if (String(err).includes('ERR_ABORTED')) {
        await this.page.goto(path);
      } else {
        throw err;
      }
    }
  }

  async isVisible(selector: string): Promise<boolean> {
    return this.page.locator(selector).isVisible().catch(() => false);
  }

  /** Redmine's persistent top application menu (Home / My page / Projects / Administration / Help). */
  async clickTopNav(label: string) {
    await this.page.locator('#top-menu').getByRole('link', { name: label, exact: true }).click();
  }

  /** A project's own standard menu tabs (Overview/Issues/TestCases/Settings/...). */
  async clickProjectTab(label: string) {
    await this.page.getByRole('link', { name: label, exact: true }).click();
  }

  /**
   * An item in this plugin's own sidebar sub-nav (Overview / Activity / To Do /
   * Environment / Test Cases / Runs & Results / Reports / Requirement /
   * Traceability Matrix / Help & Documentation) — present once the TestCases
   * tab has been opened for a project.
   */
  async clickTestcaseSubNav(label: string) {
    await this.page.getByRole('link', { name: label, exact: true }).click();
  }

  protected row(rowIdentifier: string) {
    return this.page.locator('tr', { hasText: rowIdentifier });
  }

  async assertRowVisible(rowIdentifier: string) {
    await expect(this.row(rowIdentifier)).toBeVisible();
  }

  async assertRowNotVisible(rowIdentifier: string) {
    await expect(this.row(rowIdentifier)).toHaveCount(0);
  }
}
