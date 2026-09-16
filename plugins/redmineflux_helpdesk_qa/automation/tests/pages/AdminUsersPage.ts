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
  /**
   * BUG FIX 2026-09-14: the New user form also has a "Create and add
   * another" submit button — an unscoped, non-exact `name: 'Create'` matches
   * both (confirmed live via a real strict-mode violation the first time
   * createUser() ever actually ran end-to-end, in provision.setup.ts).
   */
  private readonly createButton = this.page.getByRole('button', { name: 'Create', exact: true });
  private readonly saveButton = this.page.getByRole('button', { name: 'Save' });

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

  /**
   * Checks whether a login already has a User record, for provisioning's
   * check-before-create pattern.
   *
   * BUG FIX 2026-09-14: the first version called openList() (the default,
   * UNFILTERED list) and checked visibility on whatever page 1 happened to
   * render — a real, live-confirmed false negative for logins sorted past
   * page 1 once this environment had enough users (it reported an agent
   * that demonstrably already existed as "not found", which would have
   * created a duplicate). Uses Redmine's own `?name=` filter instead
   * (confirmed live to return exactly the matching row(s), not a substring
   * scan) so existence doesn't depend on pagination or sort order.
   */
  async exists(login: string): Promise<boolean> {
    await this.goto(`/users?name=${encodeURIComponent(login)}`);
    return this.page.getByRole('link', { name: login, exact: true }).isVisible().catch(() => false);
  }

  /** Navigates to the list, then clicks the named login's row to open its edit form (General tab). */
  async openEditByLogin(login: string) {
    await this.openList();
    await this.page.getByRole('link', { name: login, exact: true }).click();
  }

  /**
   * Updates an existing user's email and/or password — the "already exists"
   * branch of provisioning (see CLAUDE.md's provision.setup.ts note): a
   * server reseed can hand out a fixture login with an unpredictable
   * password, so this forces it back to the fixture's own known credentials
   * rather than skipping the user entirely. Same field ids as createUser()
   * (confirmed live 2026-09-14 on /users/5/edit — #user_mail/#user_password
   * match the New user form exactly), "Save" is the submit button here
   * (vs. "Create" on New user).
   */
  async updateCredentials(login: string, options: { email?: string; password?: string }) {
    await this.openEditByLogin(login);
    if (options.email) await this.emailInput.fill(options.email);
    if (options.password) {
      await this.passwordInput.fill(options.password);
      await this.passwordConfirmationInput.fill(options.password);
    }
    await this.saveButton.click();
  }
}
