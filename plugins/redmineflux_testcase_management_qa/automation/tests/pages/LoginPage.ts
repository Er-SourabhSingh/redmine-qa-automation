import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * This instance (localhost:3010) runs the stock Redmine login form — NOT a
 * themed Redmineflux form (confirmed live via direct interaction this
 * engagement: heading "Redmine", a Login textbox, a Password textbox whose
 * accessible name is "Password Lost password" because a "Lost password" link
 * sits next to it, and a plain <button>"Login"</button>). After a successful
 * login the avatar/account link in the top-right corner shows the user's
 * initials; clicking it reveals "Profile" / "My account" / "Sign out".
 */
export class LoginPage extends BasePage {
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly submitButton: Locator;
  private readonly loginErrorMessage: Locator;
  private readonly accountMenuLink: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.getByRole('textbox', { name: 'Login' });
    this.passwordInput = page.getByRole('textbox', { name: /Password/ });
    this.submitButton = page.getByRole('button', { name: 'Login', exact: true });
    this.loginErrorMessage = page.locator('#flash_error, .flash.error');
    this.accountMenuLink = page.locator('#account').getByRole('link');
  }

  async open() {
    await this.goto('/login');
  }

  async login(username: string, password: string) {
    await this.open();
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async assertLoggedIn() {
    await expect(this.accountMenuLink.first()).toBeVisible();
  }

  async assertLoginFailed() {
    await expect(this.loginErrorMessage).toBeVisible();
  }

  async signOut() {
    await this.accountMenuLink.first().click();
    await this.page.getByRole('link', { name: 'Sign out' }).click();
  }
}
