import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Administration › Users (/users, /users/new). Standard Redmine core
 * screens. Locators verified against the live Forge instance on 2026-08-21.
 */
export class AdminUsersPage extends BasePage {
  private readonly loginInput = this.page.locator('#user_login');
  private readonly firstNameInput = this.page.locator('#user_firstname');
  private readonly lastNameInput = this.page.locator('#user_lastname');
  private readonly emailInput = this.page.locator('#user_mail');
  private readonly adminCheckbox = this.page.locator('#user_admin');
  private readonly passwordInput = this.page.locator('#user_password');
  private readonly passwordConfirmationInput = this.page.locator('#user_password_confirmation');
  private readonly generatePasswordCheckbox = this.page.locator('#user_generate_password');
  private readonly mustChangePasswordCheckbox = this.page.locator('#user_must_change_passwd');
  private readonly createButton = this.page.getByRole('button', { name: 'Create' });

  // List view (/users) — standard Redmine operator-style query filter, not
  // a custom UI like the Helpdesk screens.
  private readonly newUserLink = this.page.getByRole('link', { name: 'New user' });
  private readonly statusFilterCheckbox = this.page.locator('#cb_status');

  /** Real nav path (added 2026-08-25): top nav "Administration" → "Users" in the admin sidebar (also Administration's default landing tab). */
  async openList() {
    await this.clickTopNav('Administration');
    await this.clickNavLink('Users');
  }

  /** Navigates to the list, then clicks "New user". */
  async openNew() {
    await this.openList();
    await this.newUserLink.click();
  }

  async createUser(options: {
    login: string;
    firstName: string;
    lastName: string;
    email: string;
    admin?: boolean;
    password?: string;
    mustChangePassword?: boolean;
  }) {
    await this.openNew();
    await this.loginInput.fill(options.login);
    await this.firstNameInput.fill(options.firstName);
    await this.lastNameInput.fill(options.lastName);
    await this.emailInput.fill(options.email);
    if (options.admin) await this.adminCheckbox.check();
    if (options.password) {
      await this.passwordInput.fill(options.password);
      await this.passwordConfirmationInput.fill(options.password);
    } else {
      await this.generatePasswordCheckbox.check();
    }
    if (options.mustChangePassword === false) await this.mustChangePasswordCheckbox.uncheck();
    await this.createButton.click();
  }

  async assertUserRowVisible(fullName: string) {
    await expect(this.page.getByRole('link', { name: fullName })).toBeVisible();
  }
}
