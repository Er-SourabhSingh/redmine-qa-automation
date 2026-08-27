import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Redmineflux's custom-skinned login screen (NOT the standard Redmine core
 * login form). Used by tests/auth.setup.ts to establish the per-role
 * sessions every other page object relies on.
 *
 * BUG FIX 2026-08-25: this page object previously targeted `#username` /
 * `#password` / `input[type="submit"][name="login"]` / `#loggedas` — the
 * standard Redmine core login form's markup. The real, live form (confirmed
 * repeatedly across multiple Forge instances this engagement, most recently
 * `flux-fwdq7ydhw49`) is a completely different custom form: heading
 * "Welcome to Redmineflux" / "Welcome Back", a Login textbox (placeholder
 * "Enter your email or username", accepts either username or email), a
 * Password textbox (placeholder "Enter your password", with a visible
 * show/hide toggle), a "Forgot password?" link, and a `<button>` labeled
 * "Login" (not an `<input type="submit">`). The old locators would have
 * matched nothing and thrown on first use — this was never actually
 * exercised via auth.setup.ts before now (every login this engagement was
 * driven by direct Playwright MCP interaction, not this page object).
 *
 * NOTE: a fresh admin/admin login on a brand-new Forge instance is always
 * followed by a forced "Change password" interstitial (confirmed every
 * rotation this engagement) — that is a one-time bootstrap step handled
 * manually per new instance (see QA_CREDENTIALS_FORGE.md), not something
 * login() below accounts for. login() assumes the account's real, current
 * password is already known and passed in.
 */
export class LoginPage extends BasePage {
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly submitButton: Locator;
  private readonly loginErrorMessage: Locator;
  private readonly loggedAsIndicator: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.getByPlaceholder('Enter your email or username');
    this.passwordInput = page.getByPlaceholder('Enter your password');
    this.submitButton = page.getByRole('button', { name: 'Login', exact: true });
    // NOT YET VERIFIED — no failed-login attempt has been driven through this
    // custom form yet this engagement (only successful logins observed).
    // Confirm/replace this locator the first time a real negative-login TC runs.
    this.loginErrorMessage = page.locator('#flash_error, .flash.error');
    // Confirmed reliably present on every successful login this engagement
    // (Admin/Agent roles only — the Customer role's top nav collapses to
    // just My account/Sign out/My Helpdesk, but Sign out is still present).
    this.loggedAsIndicator = page.getByRole('link', { name: 'Sign out' });
  }

  /**
   * Reaches the login form the real way: click "Sign in" from the home page,
   * rather than goto('/login') directly — Redmine redirects an
   * already-unauthenticated goto('/login') to the same place, but clicking
   * through matches what TC-HLP-060-style navigation tests actually exercise.
   */
  async open() {
    await this.goto('/');
    await this.clickTopNav('Sign in');
  }

  async login(username: string, password: string) {
    await this.open();
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async assertLoggedIn() {
    await expect(this.loggedAsIndicator).toBeVisible();
  }

  async assertLoginFailed() {
    await expect(this.loginErrorMessage).toBeVisible();
  }
}
